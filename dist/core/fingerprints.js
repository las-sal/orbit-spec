/**
 * Base-fingerprint capture and divergence detection (C2 parallel-merge guardrail).
 *
 * A change's MODIFIED/REMOVED/RENAMED delta blocks are absolute snapshots authored
 * against the baseline the author read. This module captures a SHA-256 fingerprint of
 * each touched baseline requirement block at authoring time (stamp), and recomputes the
 * live hash later (check / archive guard) so a stale snapshot can never silently
 * overwrite a sibling change's edits.
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractRequirementsSection, parseDeltaSpec, normalizeRequirementName, } from './parsers/requirement-blocks.js';
import { readChangeMetadata, writeChangeMetadata, } from '../utils/change-metadata.js';
// -----------------------------------------------------------------------------
// Hashing (D-c2-8: verbatim block raw, line-ending normalization only)
// -----------------------------------------------------------------------------
function normalizeLineEndings(content) {
    return content.replace(/\r\n?/g, '\n');
}
export function hashRequirementBlock(raw) {
    const normalized = normalizeLineEndings(raw);
    return 'sha256:' + crypto.createHash('sha256').update(normalized, 'utf-8').digest('hex');
}
// -----------------------------------------------------------------------------
// Touched-set derivation from a delta plan
// -----------------------------------------------------------------------------
/**
 * Derive the touched-requirement set for one capability's delta plan:
 * RENAMED[].from ∪ REMOVED[] ∪ MODIFIED[] — with MODIFIED names mapped back through
 * the delta's own RENAMED pairs to their live (FROM) names, since a MODIFIED that
 * accompanies a rename references the NEW header. ADDED requirements have no base
 * and are never fingerprinted.
 */
export function deriveTouchedSet(plan) {
    const renameFromByTo = new Map();
    for (const { from, to } of plan.renamed) {
        renameFromByTo.set(normalizeRequirementName(to), normalizeRequirementName(from));
    }
    const byLiveName = new Map();
    const touch = (liveName, op, incomingRaw) => {
        const key = normalizeRequirementName(liveName);
        const existing = byLiveName.get(key);
        if (existing) {
            existing.ops.push(op);
            if (incomingRaw !== undefined)
                existing.incomingRaw = incomingRaw;
        }
        else {
            byLiveName.set(key, { liveName: key, ops: [op], incomingRaw });
        }
    };
    for (const { from, to } of plan.renamed) {
        touch(from, 'renamed');
        byLiveName.get(normalizeRequirementName(from)).renamedTo = normalizeRequirementName(to);
    }
    for (const name of plan.removed)
        touch(name, 'removed');
    for (const mod of plan.modified) {
        const modName = normalizeRequirementName(mod.name);
        const liveName = renameFromByTo.get(modName) ?? modName;
        touch(liveName, 'modified', mod.raw);
    }
    return Array.from(byLiveName.values());
}
// -----------------------------------------------------------------------------
// Status computation (pure — callers supply live blocks + stored fingerprints)
// -----------------------------------------------------------------------------
/**
 * Compute the per-requirement fingerprint status for one capability.
 *
 * Precedence: the idempotent-write skip beats `unverified` — a requirement whose live
 * hash equals the incoming block hash reports `verified` regardless of the stored
 * fingerprint (the write is a no-op; nothing can be lost). REMOVED/RENAMED entries get
 * no idempotent skip.
 */
export function computeStatuses(capability, touched, liveBlocks, stored) {
    const liveByName = new Map();
    for (const block of liveBlocks) {
        liveByName.set(normalizeRequirementName(block.name), block);
    }
    return touched.map((t) => {
        const baseHash = stored?.[t.liveName] ?? null;
        const liveBlock = liveByName.get(t.liveName);
        if (!liveBlock) {
            return { capability, requirement: t.liveName, status: 'missing', base_hash: baseHash, live_hash: null, ops: t.ops };
        }
        const liveHash = hashRequirementBlock(liveBlock.raw);
        // Idempotent-write skip: only a pure MODIFIED can be a no-op write.
        const isPureModify = t.ops.length === 1 && t.ops[0] === 'modified';
        if (isPureModify && t.incomingRaw !== undefined && hashRequirementBlock(t.incomingRaw) === liveHash) {
            return { capability, requirement: t.liveName, status: 'verified', base_hash: baseHash, live_hash: liveHash, ops: t.ops };
        }
        if (baseHash === null) {
            return { capability, requirement: t.liveName, status: 'unverified', base_hash: null, live_hash: liveHash, ops: t.ops };
        }
        return {
            capability,
            requirement: t.liveName,
            status: baseHash === liveHash ? 'verified' : 'diverged',
            base_hash: baseHash,
            live_hash: liveHash,
            ops: t.ops,
        };
    });
}
function walkChangeDeltas(projectRoot, changeName) {
    const changeSpecsDir = path.join(projectRoot, 'orbit', 'changes', changeName, 'specs');
    const mainSpecsDir = path.join(projectRoot, 'orbit', 'specs');
    const results = [];
    let entries = [];
    try {
        entries = fs.readdirSync(changeSpecsDir, { withFileTypes: true });
    }
    catch {
        return results; // no specs directory in change
    }
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const deltaPath = path.join(changeSpecsDir, entry.name, 'spec.md');
        let deltaContent;
        try {
            deltaContent = fs.readFileSync(deltaPath, 'utf-8');
        }
        catch {
            continue;
        }
        const plan = parseDeltaSpec(deltaContent);
        const touched = deriveTouchedSet(plan);
        let liveBlocks = [];
        try {
            const liveContent = fs.readFileSync(path.join(mainSpecsDir, entry.name, 'spec.md'), 'utf-8');
            liveBlocks = extractRequirementsSection(liveContent).bodyBlocks;
        }
        catch {
            // live spec absent — every touched requirement will report missing
        }
        results.push({ capability: entry.name, plan, touched, liveBlocks });
    }
    return results;
}
// -----------------------------------------------------------------------------
// Stamp (default mode): write base_fingerprints into .openspec.yaml
// -----------------------------------------------------------------------------
/**
 * Stamp fingerprints for every touched requirement. Add-missing-only by default: an
 * existing fingerprint is NOT overwritten unless `refresh` is set — a default re-stamp
 * after the baseline diverged would overwrite the stored base hash with the new live
 * hash and mask the divergence.
 */
export function stampFingerprints(projectRoot, changeName, options = {}) {
    const changeDir = path.join(projectRoot, 'orbit', 'changes', changeName);
    const metadata = readChangeMetadata(changeDir, projectRoot);
    if (!metadata) {
        throw new Error(`Change '${changeName}' has no .openspec.yaml metadata file; cannot stamp fingerprints.`);
    }
    const fingerprints = { ...(metadata.base_fingerprints ?? {}) };
    const entries = [];
    for (const { capability, touched, liveBlocks } of walkChangeDeltas(projectRoot, changeName)) {
        const liveByName = new Map(liveBlocks.map((b) => [normalizeRequirementName(b.name), b]));
        for (const t of touched) {
            const liveBlock = liveByName.get(t.liveName);
            if (!liveBlock) {
                entries.push({ capability, requirement: t.liveName, action: 'skipped-missing', hash: null });
                continue;
            }
            const existing = fingerprints[capability]?.[t.liveName];
            if (existing && !options.refresh) {
                entries.push({ capability, requirement: t.liveName, action: 'kept', hash: existing });
                continue;
            }
            const hash = hashRequirementBlock(liveBlock.raw);
            fingerprints[capability] = { ...(fingerprints[capability] ?? {}), [t.liveName]: hash };
            entries.push({
                capability,
                requirement: t.liveName,
                action: existing ? 'refreshed' : 'stamped',
                hash,
            });
        }
    }
    const hasAny = Object.keys(fingerprints).length > 0;
    writeChangeMetadata(changeDir, { ...metadata, ...(hasAny ? { base_fingerprints: fingerprints } : {}) }, projectRoot);
    return entries;
}
// -----------------------------------------------------------------------------
// Check (--check): recompute live hashes and report statuses; never writes
// -----------------------------------------------------------------------------
export function checkFingerprints(projectRoot, changeName) {
    const changeDir = path.join(projectRoot, 'orbit', 'changes', changeName);
    let stored = {};
    try {
        stored = readChangeMetadata(changeDir, projectRoot)?.base_fingerprints ?? {};
    }
    catch {
        // unreadable metadata is treated as no stored fingerprints (all unverified)
    }
    const results = [];
    for (const { capability, touched, liveBlocks } of walkChangeDeltas(projectRoot, changeName)) {
        results.push(...computeStatuses(capability, touched, liveBlocks, stored[capability]));
    }
    return results;
}
// -----------------------------------------------------------------------------
// Divergence report formatting (D6: current live ▸ what-would-be-written diff)
// -----------------------------------------------------------------------------
/**
 * Minimal line-level LCS diff. Deletions (`- `) are exactly the live content the write
 * would destroy; additions (`+ `) are the delta's content. Blocks are requirement-sized,
 * so O(n*m) is fine.
 */
export function diffLines(liveRaw, incomingRaw) {
    const a = normalizeLineEndings(liveRaw).split('\n');
    const b = normalizeLineEndings(incomingRaw).split('\n');
    const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            out.push('  ' + a[i]);
            i++;
            j++;
        }
        else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            out.push('- ' + a[i]);
            i++;
        }
        else {
            out.push('+ ' + b[j]);
            j++;
        }
    }
    while (i < a.length)
        out.push('- ' + a[i++]);
    while (j < b.length)
        out.push('+ ' + b[j++]);
    return out;
}
/**
 * The block a pure RENAME would write: the live block with only its header line replaced.
 * A rename preserves the (possibly divergent) live body — it never removes or overwrites it —
 * so divergence reports must diff against this, not claim removal.
 */
export function synthesizeRenamedBlock(liveRaw, to) {
    const lines = normalizeLineEndings(liveRaw).split('\n');
    lines[0] = `### Requirement: ${to}`;
    return lines.join('\n');
}
export function formatDivergenceReport(diverged, changeName) {
    const lines = [];
    lines.push(`Base fingerprint divergence detected — the live baseline changed since this change's delta was authored.`);
    for (const d of diverged) {
        lines.push('');
        lines.push(`  ${d.capability} / "${d.requirement}" (${d.ops.join('+')})`);
        lines.push(`  base ${d.base_hash ?? '<none>'} → live ${d.live_hash ?? '<absent>'}`);
        if (d.liveRaw !== undefined && d.incomingRaw !== undefined) {
            lines.push(`  current live ▸ what this archive would write ('-' lines would be DESTROYED):`);
            for (const l of diffLines(d.liveRaw, d.incomingRaw))
                lines.push('    ' + l);
        }
        else if (d.liveRaw !== undefined) {
            lines.push(`  the archive would REMOVE this live block:`);
            for (const l of normalizeLineEndings(d.liveRaw).split('\n'))
                lines.push('    - ' + l);
        }
    }
    lines.push('');
    lines.push('To reconcile (in this order):');
    lines.push(`  1. Hand-edit the delta spec(s) under orbit/changes/${changeName}/specs/ to incorporate the divergent live content shown above.`);
    lines.push(`  2. Re-stamp: orbit fingerprint ${changeName} --refresh`);
    lines.push('Or proceed deliberately (drops the live content): re-run the archive with --override-fingerprints.');
    return lines.join('\n');
}
//# sourceMappingURL=fingerprints.js.map