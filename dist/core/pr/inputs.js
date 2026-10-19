/**
 * The file-resident inputs `orbit pr` reads before it runs anything: the resolved `pr:` regime,
 * a change's (or staging exploration's) citation, and the PR attachment on a trail. None of
 * these touch git, so an `off` decision made from them runs no `git` or `gh` invocation.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readProjectConfig, resolvePrMode } from '../project-config.js';
/** The regime, through the same reader `orbit status --json` surfaces as `pr`. */
export function readRegime(projectRoot) {
    return resolvePrMode(readProjectConfig(projectRoot));
}
/** The `architecture.doc` citation in `<dir>/.openspec.yaml`, or null when absent or unreadable. */
export function readCitation(dir) {
    const p = path.join(dir, '.openspec.yaml');
    let raw;
    try {
        raw = parseYaml(fs.readFileSync(p, 'utf-8'));
    }
    catch {
        return null;
    }
    if (!raw || typeof raw !== 'object')
        return null;
    const arch = raw.architecture;
    if (!arch || typeof arch !== 'object')
        return null;
    const doc = arch.doc;
    return typeof doc === 'string' && doc.length > 0 ? doc : null;
}
/**
 * The targeting predicate (`orbit-pr-lifecycle`'s `Config selects the regime; citation selects
 * the target`): a program target of the cited doc when the regime is `per-architecture` and a
 * citation is present, else a per-change target. ONE function for `select`, `publish` and
 * `preflight`, so the target selected, the target published and the divergence note agree.
 */
export function selectTarget(regime, citation) {
    return regime === 'per-architecture' && citation !== null
        ? { granularity: 'per-architecture', doc: citation }
        : { granularity: 'per-proposal' };
}
const ATTACHING_EMIT = /^(propose|ff)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.json$/;
/** Every attachment-bearing propose or ff emit on one trail, oldest first. */
export function attachmentsOnTrail(projectRoot, trailDir) {
    let entries;
    try {
        entries = fs.readdirSync(trailDir);
    }
    catch {
        return [];
    }
    const out = [];
    for (const name of entries) {
        const m = name.match(ATTACHING_EMIT);
        if (!m)
            continue;
        const file = path.join(trailDir, name);
        let emit;
        try {
            emit = JSON.parse(fs.readFileSync(file, 'utf-8'));
        }
        catch {
            continue;
        }
        const a = emit?.pr_attachment;
        if (!a || typeof a !== 'object' || Array.isArray(a))
            continue;
        const att = a;
        if (typeof att.branch !== 'string')
            continue;
        if (att.granularity !== 'per-proposal' && att.granularity !== 'per-architecture')
            continue;
        out.push({
            attachment: {
                branch: att.branch,
                granularity: att.granularity,
                ...(typeof att.url === 'string' ? { url: att.url } : {}),
                ...(att.state === 'draft' || att.state === 'ready' ? { state: att.state } : {}),
                ...(typeof att.doc === 'string' ? { doc: att.doc } : {}),
            },
            emit: path.relative(projectRoot, file),
            token: m[2],
        });
    }
    return out.sort((x, y) => (x.token < y.token ? -1 : x.token > y.token ? 1 : x.emit.localeCompare(y.emit)));
}
/** The LATEST attachment-bearing propose or ff emit on a change's trail (both equally authoritative). */
export function latestAttachment(projectRoot, changeDir) {
    const all = attachmentsOnTrail(projectRoot, path.join(changeDir, '.orbit-runs'));
    return all.length > 0 ? all[all.length - 1] : null;
}
/** Every change directory, active and archived, whose trail may carry an attachment. */
export function allChangeDirs(projectRoot) {
    const changes = path.join(projectRoot, 'orbit', 'changes');
    const dirs = [];
    const list = (root) => {
        try {
            return fs
                .readdirSync(root, { withFileTypes: true })
                .filter((e) => e.isDirectory())
                .map((e) => path.join(root, e.name));
        }
        catch {
            return [];
        }
    };
    for (const d of list(changes)) {
        if (path.basename(d) === 'archive')
            dirs.push(...list(d));
        else
            dirs.push(d);
    }
    return dirs;
}
//# sourceMappingURL=inputs.js.map