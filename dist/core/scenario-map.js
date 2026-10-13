/**
 * The scenario map (rc06a, `orbit-scenario-map`) — which test, ledger entry or record declares
 * each spec scenario. ENGINE-COMPUTED at read time and stored nowhere: one read surface
 * (`orbit status --change <name> --scenarios`) and one consumer inside the engine (the
 * declaration check in `orbit validate <change>`).
 *
 * Three inputs, each read by its own small reader:
 *   - TAGS: a line classifier over the scanned test files (design D2) — never a language parse.
 *     The tag production and the CLOSED next-line table are owned by the capability's first
 *     requirement; this module implements them.
 *   - the LEDGER: `orbit/scenario-ledger.yaml`, for what no test can run.
 *   - KEYS: the baseline's scenario keys with the change's delta plan applied KEY-WISE in the
 *     archive's order — RENAMED, REMOVED, MODIFIED, ADDED (design D1). This deliberately avoids
 *     `buildUpdatedSpec`, whose fingerprint guard refuses by default and has no business in a
 *     read path. Requirement blocks come from the requirement-block parser (its fence mask);
 *     scenario headings inside each block are read through the shared CommonMark fence tracker —
 *     so the read path COMPOSES the engine's two fence grammars and inherits Q-crc-15's limit.
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { parse as parseYaml } from 'yaml';
import { createFenceTracker } from './markdown-fence.js';
import { extractRequirementsSection, parseDeltaSpec, normalizeRequirementName, } from './parsers/requirement-blocks.js';
/** The surface's scan when the check is OFF — the map stays viewable before opting in. */
export const DEFAULT_SCENARIO_TESTS = ['test/**/*.test.ts'];
export const COVER_KINDS = ['behaviour', 'text', 'observed', 'untestable'];
/** The literal separator of a key's three parts. */
const KEY_SEPARATOR = ' :: ';
const TAG_CANDIDATE = /^\s*\/\/\s*@scenario\b/;
const TAG_PRODUCTION = /^\s*\/\/\s*@scenario\s+(behaviour|text)\s+(.+?)\s*$/;
const SCENARIO_HEADING = /^####\s+Scenario:\s*(.+?)\s*$/;
// -----------------------------------------------------------------------------
// Keys
// -----------------------------------------------------------------------------
/** Split a key on the literal ` :: `; exactly three non-empty trimmed parts, else null. */
export function splitKey(raw) {
    const parts = raw.split(KEY_SEPARATOR).map((p) => p.trim());
    if (parts.length !== 3 || parts.some((p) => p.length === 0))
        return null;
    return parts;
}
export function joinKey(capability, requirement, scenario) {
    return [capability, requirement, scenario].join(KEY_SEPARATOR);
}
/** A title that itself contains the separator cannot be keyed by any tag or ledger entry (the
 *  other unkeyable case — a title repeated within its requirement — is decided in key resolution). */
export function isUnkeyableTitle(title) {
    return title.includes(KEY_SEPARATOR);
}
/**
 * The CLOSED next-line table: a call form attaches, a non-running or group form is refused by
 * name, and every other line is refused — so no line passes unclassified.
 */
function classifyNextLine(line) {
    const t = line.trimStart();
    const refused = [
        'it.skip(',
        'test.skip(',
        'it.todo(',
        'test.todo(',
    ].find((f) => t.startsWith(f));
    if (refused)
        return { attach: false, reason: `the next line begins \`${refused}\` — a test that never runs covers nothing` };
    if (t.startsWith('describe'))
        return { attach: false, reason: 'the next line begins `describe` — a tag names a test, never a group' };
    const attaches = ['it(', 'test(', 'it.each', 'test.each', 'it.skipIf(', 'test.skipIf(', 'it.only(', 'test.only('];
    if (attaches.some((f) => t.startsWith(f)))
        return { attach: true };
    return { attach: false, reason: `the next line is not a test call: \`${t.slice(0, 60)}\`` };
}
function scanFile(rel, content, tags, malformed) {
    const lines = content.replace(/\r\n?/g, '\n').split('\n');
    let pending = [];
    const refuseStack = (reason) => {
        for (const p of pending)
            malformed.push({ source: 'tag', file: rel, line: p.line, reason });
        pending = [];
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNo = i + 1;
        if (TAG_CANDIDATE.test(line)) {
            const m = line.match(TAG_PRODUCTION);
            const parts = m ? splitKey(m[2]) : null;
            if (!m || !parts) {
                const reason = !m
                    ? 'the tag does not match `// @scenario <behaviour|text> <capability> :: <requirement> :: <scenario>`'
                    : 'the key must split on " :: " into exactly three non-empty parts';
                malformed.push({ source: 'tag', file: rel, line: lineNo, reason });
                continue; // joins nothing; any pending stack stays intact
            }
            pending.push({ kind: m[1], key: joinKey(...parts), line: lineNo });
            continue;
        }
        if (pending.length === 0)
            continue;
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('//'))
            continue;
        const verdict = classifyNextLine(line);
        if (verdict.attach) {
            for (const p of pending)
                tags.push({ kind: p.kind, key: p.key, file: rel, tagLine: p.line, line: lineNo });
            pending = [];
        }
        else {
            refuseStack(verdict.reason);
        }
    }
    if (pending.length > 0)
        refuseStack('no test follows the tag before the end of file');
}
const LEDGER_PATH = path.join('orbit', 'scenario-ledger.yaml');
function readLedger(projectRoot, ledger, malformed) {
    const file = path.join(projectRoot, LEDGER_PATH);
    if (!existsSync(file))
        return; // an absent ledger declares nothing
    let raw;
    try {
        raw = parseYaml(readFileSync(file, 'utf-8'));
    }
    catch (error) {
        malformed.push({ source: 'ledger-file', reason: `not valid YAML: ${error.message.split('\n')[0]}` });
        return;
    }
    const entries = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw.scenarios : undefined;
    if (!Array.isArray(entries)) {
        malformed.push({ source: 'ledger-file', reason: 'the top level must be a mapping with a `scenarios` list' });
        return;
    }
    const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
    entries.forEach((entry, index) => {
        const bad = (reason) => {
            malformed.push({ source: 'ledger', index, reason });
        };
        if (!entry || typeof entry !== 'object' || Array.isArray(entry))
            return bad('the entry is not a mapping');
        const e = entry;
        if (!nonEmpty(e.key))
            return bad('the entry has no `key`');
        const parts = splitKey(e.key);
        if (!parts)
            return bad('the key must split on " :: " into exactly three non-empty parts');
        if (e.kind === 'observed') {
            if (!nonEmpty(e.record))
                return bad('`kind: observed` requires a non-empty `record`');
            ledger.push({ kind: 'observed', key: joinKey(...parts), index, record: e.record });
        }
        else if (e.kind === 'untestable') {
            if (!nonEmpty(e.why))
                return bad('`kind: untestable` requires a non-empty `why`');
            ledger.push({ kind: 'untestable', key: joinKey(...parts), index, why: e.why });
        }
        else {
            return bad(`unknown kind \`${String(e.kind)}\` (expected observed | untestable)`);
        }
    });
}
/**
 * Scan the declarations — tags in the files the globs match from the project root (never
 * `node_modules`), plus the ledger. Independent of any change, so a bulk run scans ONCE and
 * reuses the result; the zero-match warning is therefore raised once per run.
 */
export function scanDeclarations(projectRoot, globs, options) {
    const warn = options.warn ?? ((m) => console.warn(m));
    const tags = [];
    const ledger = [];
    const malformed = [];
    const files = fg
        .sync(globs, { cwd: projectRoot, ignore: ['**/node_modules/**'], onlyFiles: true, dot: false })
        .sort();
    if (files.length === 0 && options.warnOnZeroMatch) {
        warn(`scenario_map.tests matched no file: ${globs.join(', ')}`);
    }
    for (const rel of files) {
        let content;
        try {
            content = readFileSync(path.join(projectRoot, rel), 'utf-8');
        }
        catch {
            continue;
        }
        scanFile(rel, content, tags, malformed);
    }
    readLedger(projectRoot, ledger, malformed);
    return { tests: globs, tags, ledger, malformed };
}
// -----------------------------------------------------------------------------
// Key resolution
// -----------------------------------------------------------------------------
/** Scenario titles inside one requirement block, fence-aware through the shared tracker. */
function scenarioTitles(blockRaw) {
    const tracker = createFenceTracker();
    const titles = [];
    for (const line of blockRaw.split('\n')) {
        const wasInFence = tracker.inFence;
        const isDelimiter = tracker.handle(line);
        if (wasInFence || isDelimiter)
            continue;
        const m = line.match(SCENARIO_HEADING);
        if (m)
            titles.push(m[1].trim());
    }
    return titles;
}
function listDirs(dir) {
    try {
        return readdirSync(dir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name)
            .sort();
    }
    catch {
        return [];
    }
}
function readIfExists(file) {
    try {
        return readFileSync(file, 'utf-8');
    }
    catch {
        return undefined;
    }
}
/** The baseline under `orbit/specs/` with the change's delta operations applied to the KEY set. */
export function resolveScenarioKeys(projectRoot, changeDir) {
    const specsRoot = path.join(projectRoot, 'orbit', 'specs');
    const deltaRoot = path.join(changeDir, 'specs');
    const capabilities = Array.from(new Set([...listDirs(specsRoot), ...listDirs(deltaRoot)])).sort();
    const result = { delta: [], unkeyable: [], baseline: [], all: new Set() };
    for (const capability of capabilities) {
        const reqs = new Map();
        const baseContent = readIfExists(path.join(specsRoot, capability, 'spec.md'));
        if (baseContent !== undefined) {
            for (const block of extractRequirementsSection(baseContent).bodyBlocks) {
                if (!reqs.has(block.name))
                    reqs.set(block.name, { name: block.name, scenarios: scenarioTitles(block.raw) });
            }
        }
        const deltaContent = readIfExists(path.join(deltaRoot, capability, 'spec.md'));
        if (deltaContent !== undefined) {
            const plan = parseDeltaSpec(deltaContent);
            // The archive's order: RENAMED, REMOVED, MODIFIED, ADDED.
            for (const { from, to } of plan.renamed) {
                const existing = reqs.get(normalizeRequirementName(from));
                reqs.delete(normalizeRequirementName(from));
                reqs.set(normalizeRequirementName(to), {
                    name: normalizeRequirementName(to),
                    scenarios: existing?.scenarios ?? [],
                    operation: 'RENAMED',
                });
            }
            for (const name of plan.removed)
                reqs.delete(normalizeRequirementName(name));
            for (const block of plan.modified) {
                reqs.set(block.name, { name: block.name, scenarios: scenarioTitles(block.raw), operation: 'MODIFIED' });
            }
            for (const block of plan.added) {
                reqs.set(block.name, { name: block.name, scenarios: scenarioTitles(block.raw), operation: 'ADDED' });
            }
        }
        for (const req of reqs.values()) {
            // A key must name EXACTLY ONE scenario. In the delta, a title repeated within its requirement
            // cannot: every occurrence is UNKEYABLE, never collapsed into one entry one tag could satisfy
            // (external system pass, C1). Outside the delta each occurrence is simply counted.
            const occurrences = new Map();
            for (const s of req.scenarios)
                occurrences.set(s, (occurrences.get(s) ?? 0) + 1);
            for (const scenario of req.scenarios) {
                const repeated = (occurrences.get(scenario) ?? 0) > 1;
                if (req.operation && (repeated || isUnkeyableTitle(req.name) || isUnkeyableTitle(scenario))) {
                    result.unkeyable.push({ capability, requirement: req.name, scenario });
                    continue;
                }
                const key = joinKey(capability, req.name, scenario);
                result.all.add(key);
                if (req.operation) {
                    result.delta.push({ capability, requirement: req.name, scenario, operation: req.operation });
                }
                else {
                    result.baseline.push(key);
                }
            }
        }
    }
    return result;
}
export function computeScenarioMap(projectRoot, changeDir, options) {
    const { config } = options;
    const tests = config.check === 'on' ? config.tests : DEFAULT_SCENARIO_TESTS;
    const scan = options.scan ?? scanDeclarations(projectRoot, tests, { warnOnZeroMatch: config.check === 'on', warn: options.warn });
    const keys = resolveScenarioKeys(projectRoot, changeDir);
    const tagsByKey = new Map();
    for (const t of scan.tags)
        tagsByKey.set(t.key, [...(tagsByKey.get(t.key) ?? []), t]);
    const ledgerByKey = new Map();
    for (const l of scan.ledger)
        ledgerByKey.set(l.key, [...(ledgerByKey.get(l.key) ?? []), l]);
    const scenarios = keys.delta.map((d) => {
        const key = joinKey(d.capability, d.requirement, d.scenario);
        const tags = tagsByKey.get(key) ?? [];
        const led = ledgerByKey.get(key) ?? [];
        const declarations = {
            behaviour: tags.filter((t) => t.kind === 'behaviour').map((t) => ({ file: t.file, line: t.line })),
            text: tags.filter((t) => t.kind === 'text').map((t) => ({ file: t.file, line: t.line })),
            observed: led.filter((l) => l.kind === 'observed').map((l) => ({ record: l.record })),
            untestable: led.filter((l) => l.kind === 'untestable').map((l) => ({ why: l.why })),
        };
        const uncovered = COVER_KINDS.every((k) => declarations[k].length === 0);
        return { ...d, declarations, uncovered };
    });
    const orphans = [
        ...scan.tags
            .filter((t) => !keys.all.has(t.key))
            .map((t) => ({ source: 'tag', file: t.file, line: t.tagLine, key: t.key })),
        ...scan.ledger
            .filter((l) => !keys.all.has(l.key))
            .map((l) => ({ source: 'ledger', index: l.index, key: l.key })),
    ];
    const malformed = [
        ...scan.malformed,
        ...keys.unkeyable.map((u) => ({ source: 'spec', ...u, reason: 'unkeyable' })),
    ];
    const declared = new Set([...tagsByKey.keys(), ...ledgerByKey.keys()]);
    const withKind = (k) => scenarios.filter((s) => s.declarations[k].length > 0).length;
    return {
        change: path.basename(changeDir),
        check: config.check,
        tests,
        scenarios,
        orphans,
        malformed,
        counts: {
            delta_scenarios: scenarios.length,
            behaviour: withKind('behaviour'),
            text: withKind('text'),
            observed: withKind('observed'),
            untestable: withKind('untestable'),
            uncovered: scenarios.filter((s) => s.uncovered).length,
            orphans: orphans.length,
            malformed: malformed.length,
            baseline_undeclared: keys.baseline.filter((k) => !declared.has(k)).length,
        },
    };
}
// -----------------------------------------------------------------------------
// The human render — computed from the same object as --json; counts, never a ratio
// -----------------------------------------------------------------------------
export function renderScenarioMap(map) {
    const out = [];
    out.push(`Scenario map: ${map.change}`);
    out.push(map.check === 'on'
        ? `Check: ON — scanning ${map.tests.join(', ')}`
        : `Check: OFF (scenario_map absent or inert in orbit/config.yaml) — scanning ${map.tests.join(', ')}`);
    out.push('');
    out.push(`Delta scenarios (${map.scenarios.length}):`);
    if (map.scenarios.length === 0)
        out.push('  (none)');
    for (const s of map.scenarios) {
        const mark = s.uncovered ? 'UNCOVERED ' : '';
        out.push(`  ${mark}${s.operation}  ${joinKey(s.capability, s.requirement, s.scenario)}`);
        const cell = (k) => {
            const d = s.declarations;
            switch (k) {
                case 'behaviour':
                case 'text':
                    return d[k].length === 0 ? '—' : d[k].map((x) => `${x.file}:${x.line}`).join(', ');
                case 'observed':
                    return d.observed.length === 0 ? '—' : d.observed.map((x) => x.record).join(', ');
                case 'untestable':
                    return d.untestable.length === 0 ? '—' : d.untestable.map((x) => x.why).join(' | ');
            }
        };
        for (const k of COVER_KINDS)
            out.push(`      ${(k + ':').padEnd(12)}${cell(k)}`);
    }
    if (map.orphans.length > 0) {
        out.push('');
        for (const o of map.orphans) {
            out.push(o.source === 'tag'
                ? `ORPHAN tag ${o.file}:${o.line} — ${o.key}`
                : `ORPHAN ledger entry ${o.index} — ${o.key}`);
        }
    }
    if (map.malformed.length > 0) {
        out.push('');
        for (const m of map.malformed) {
            switch (m.source) {
                case 'tag':
                    out.push(`MALFORMED tag ${m.file}:${m.line} — ${m.reason}`);
                    break;
                case 'ledger':
                    out.push(`MALFORMED ledger entry ${m.index} — ${m.reason}`);
                    break;
                case 'ledger-file':
                    out.push(`MALFORMED ${LEDGER_PATH} — ${m.reason}`);
                    break;
                case 'spec':
                    out.push(`MALFORMED spec ${m.capability}: requirement "${m.requirement}", scenario "${m.scenario}" — unkeyable (the key cannot name exactly one scenario: a title contains " :: " or repeats within its requirement)`);
                    break;
            }
        }
    }
    const c = map.counts;
    out.push('');
    out.push(`Counts: delta scenarios ${c.delta_scenarios} · behaviour ${c.behaviour} · text ${c.text} · observed ${c.observed} · untestable ${c.untestable} · uncovered ${c.uncovered} · orphans ${c.orphans} · malformed ${c.malformed} · baseline undeclared ${c.baseline_undeclared}`);
    return out.join('\n') + '\n';
}
//# sourceMappingURL=scenario-map.js.map