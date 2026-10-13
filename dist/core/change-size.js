/**
 * Change size (rc09a, `orbit-change-size`) — R-crc-1's four figures, computed from artifacts the
 * engine already reads, plus the `## Size` declaration parse and the breach comparison.
 *
 * ONE module computes the rule (design D1): validate, status and the propose body all read through
 * these functions. The size REPORTS — nothing here is read by a gate, the position readout or the
 * canonical next (R-crc-13).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { parseDeltaSpec, extractRequirementsSection, normalizeRequirementName, } from './parsers/requirement-blocks.js';
import { parseCheckboxes } from './parsers/apply-state.js';
import { createFenceTracker } from './markdown-fence.js';
/** The four dimensions, in report order. */
export const SIZE_DIMENSIONS = ['capabilities', 'requirements', 'changed_bytes', 'tasks'];
/**
 * The `## Size` production, a CHECKED MIRROR of the fence in `orbit-change-size`'s `A breach is
 * declared in the proposal's Size section` (held byte-equal by test/core/size-declaration-parity.test.ts).
 * The propose body interpolates this constant; it is never retyped.
 */
export const SIZE_DECLARATION_PRODUCTION = '## Size\n' +
    "- <dimension>: <reason>        <dimension> ::= capabilities | requirements | changed_bytes | tasks; <reason> non-empty, on the item's first line";
// -----------------------------------------------------------------------------
// The figures
// -----------------------------------------------------------------------------
/**
 * A block's counted bytes: its text with trailing whitespace trimmed, split on `\n`, each line its
 * UTF-8 bytes plus 1 for its newline (the last line included; a blank line counts 1). The same rule
 * reads both sides of a MODIFIED block.
 */
function blockLines(text) {
    return text.trimEnd().split('\n');
}
function lineBytes(line) {
    return Buffer.byteLength(line, 'utf8') + 1;
}
function wholeBytes(text) {
    return blockLines(text).reduce((n, l) => n + lineBytes(l), 0);
}
/** The lines of `delta` absent from `baseline`, as a MULTISET: k baseline copies absorb at most k. */
function newLineBytes(delta, baseline) {
    const pool = new Map();
    for (const l of blockLines(baseline))
        pool.set(l, (pool.get(l) ?? 0) + 1);
    let bytes = 0;
    for (const l of blockLines(delta)) {
        const k = pool.get(l) ?? 0;
        if (k > 0)
            pool.set(l, k - 1);
        else
            bytes += lineBytes(l);
    }
    return bytes;
}
function message(err) {
    return err instanceof Error ? err.message : String(err);
}
/**
 * Compute the four figures for an active change (`Four size figures are computed from the
 * change's artifacts`). An input file that EXISTS but cannot be read nulls its figure and is
 * recorded in `errors` — never read as absent, which would inflate `changed_bytes` or zero a count.
 */
export function computeChangeSize(projectRoot, changeDir) {
    const errors = [];
    let capabilities = 0;
    let requirements = 0;
    let changedBytes = 0;
    const specsDir = path.join(changeDir, 'specs');
    let capabilityNames = [];
    if (existsSync(specsDir)) {
        try {
            capabilityNames = readdirSync(specsDir, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => d.name)
                .sort();
        }
        catch (err) {
            for (const figure of ['capabilities', 'requirements', 'changed_bytes']) {
                errors.push({ figure, path: specsDir, message: message(err) });
            }
            capabilities = requirements = changedBytes = null;
        }
    }
    const baselineCache = new Map();
    for (const capability of capabilityNames) {
        const specPath = path.join(specsDir, capability, 'spec.md');
        if (!existsSync(specPath))
            continue; // a capability directory with no spec.md is not counted
        if (capabilities !== null)
            capabilities++;
        let content;
        try {
            content = readFileSync(specPath, 'utf-8');
        }
        catch (err) {
            for (const figure of ['requirements', 'changed_bytes']) {
                errors.push({ figure, path: specPath, message: message(err) });
            }
            requirements = changedBytes = null;
            continue;
        }
        const plan = parseDeltaSpec(content);
        const renamedTo = new Map(plan.renamed.map((r) => [normalizeRequirementName(r.to), r.from]));
        if (requirements !== null) {
            const doubleCounted = plan.modified.filter((b) => renamedTo.has(normalizeRequirementName(b.name))).length;
            requirements += plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length - doubleCounted;
        }
        if (changedBytes === null)
            continue;
        let bytes = 0;
        for (const block of plan.added)
            bytes += wholeBytes(block.raw);
        for (const block of plan.modified) {
            const name = normalizeRequirementName(block.name);
            const baselineName = renamedTo.get(name) ?? name;
            const baseline = readBaseline(projectRoot, capability, baselineCache, errors);
            if (baseline === undefined) {
                bytes = NaN; // unreadable baseline: the figure is not computed
                break;
            }
            const baselineBlock = baseline?.get(baselineName);
            bytes += baselineBlock === undefined ? wholeBytes(block.raw) : newLineBytes(block.raw, baselineBlock);
        }
        if (Number.isNaN(bytes))
            changedBytes = null;
        else
            changedBytes += bytes;
    }
    let tasks = 0;
    const tasksPath = path.join(changeDir, 'tasks.md');
    if (existsSync(tasksPath)) {
        try {
            const state = parseCheckboxes(readFileSync(tasksPath, 'utf-8'));
            tasks = state.tasksCompleted + state.tasksRemaining;
        }
        catch (err) {
            errors.push({ figure: 'tasks', path: tasksPath, message: message(err) });
            tasks = null;
        }
    }
    return { capabilities, requirements, changed_bytes: changedBytes, tasks, errors };
}
/**
 * The baseline's requirement blocks by name: `null` when the capability has no baseline file,
 * `undefined` when the file exists but cannot be read (the error is recorded once).
 */
function readBaseline(projectRoot, capability, cache, errors) {
    const cached = cache.get(capability);
    if (cached === 'unreadable')
        return undefined;
    if (cached !== undefined)
        return cached;
    const baselinePath = path.join(projectRoot, 'orbit', 'specs', capability, 'spec.md');
    if (!existsSync(baselinePath)) {
        cache.set(capability, null);
        return null;
    }
    try {
        if (!statSync(baselinePath).isFile())
            throw new Error('not a regular file');
        const parts = extractRequirementsSection(readFileSync(baselinePath, 'utf-8'));
        const blocks = new Map();
        for (const b of parts.bodyBlocks) {
            const key = normalizeRequirementName(b.name);
            if (!blocks.has(key))
                blocks.set(key, b.raw);
        }
        cache.set(capability, blocks);
        return blocks;
    }
    catch (err) {
        errors.push({ figure: 'changed_bytes', path: baselinePath, message: message(err) });
        cache.set(capability, 'unreadable');
        return undefined;
    }
}
/** Headings, read as CommonMark reads them: up to three spaces of indent. */
const SIZE_OPENER = /^ {0,3}## Size[ \t]*$/;
const SECTION_END = /^ {0,3}#{1,2}(?:[ \t]|$)/;
const ANY_HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/;
/** A thematic break (`* * *`, `- - -`, `___`) is not a list item and is not read. */
const THEMATIC_BREAK = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const BULLET = /^( *)([-*+])(?:([ \t]+)(.*)|[ \t]*)$/;
/**
 * Parse the `## Size` section of a proposal (`A breach is declared in the proposal's Size
 * section`), fence-aware through the shared CommonMark fence tracker. The engine reads WHICH
 * dimensions are declared, never what a reason says.
 *
 * A bullet is an item OF THE SECTION when it is indented at most three spaces and LESS than the
 * content column of the item above it in the current list (that item's indent plus its marker and
 * the spaces after the marker, as CommonMark nests); a bullet at or beyond that column is nested
 * under the item and is part of its reason. The list context ends at a heading, at a thematic break
 * and at an unindented non-item line after a blank line. The section ends only at an ATX heading: a
 * `---` or `===` line is never read as a setext underline.
 */
export function parseSizeDeclaration(proposalText) {
    const lines = proposalText.replace(/\r\n?/g, '\n').split('\n');
    const fence = createFenceTracker();
    const out = { declared: [], malformed: [], duplicate: [] };
    let inSection = false;
    let contentCol = null; // the content column of the item above, in the current list
    let prevBlank = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const wasInFence = fence.inFence;
        if (fence.handle(line) || wasInFence)
            continue; // fenced content is not read
        if (SIZE_OPENER.test(line)) {
            inSection = true; // a second `## Size` heading merges with the first
            contentCol = null;
            prevBlank = false;
            continue;
        }
        if (SECTION_END.test(line)) {
            inSection = false;
            continue;
        }
        if (!inSection)
            continue;
        const blank = line.trim() === '';
        const afterBlank = prevBlank;
        prevBlank = blank;
        if (blank)
            continue;
        if (ANY_HEADING.test(line) || THEMATIC_BREAK.test(line)) {
            contentCol = null; // a level-3+ heading or a thematic break ends the list; neither is read
            continue;
        }
        const bullet = line.match(BULLET);
        if (!bullet) {
            if (afterBlank && !/^[ \t]/.test(line))
                contentCol = null; // a new paragraph ends the list
            continue; // prose and continuation lines are not read
        }
        const indent = bullet[1].length;
        const topLevel = indent <= 3 && (contentCol === null || indent < contentCol);
        if (!topLevel)
            continue; // nested under the item above: part of its reason
        // CommonMark: five or more spaces after the marker (or none, on an empty item) put the
        // content one space after it.
        const gap = bullet[3]?.length ?? 1;
        contentCol = indent + 1 + (gap > 4 ? 1 : gap);
        const at = { line: i + 1, text: line };
        if (bullet[2] !== '-') {
            out.malformed.push(at); // only `-` declares, so another marker is visible, never skipped
            continue;
        }
        const content = bullet[4] ?? '';
        const colon = content.indexOf(':');
        const dimension = colon === -1 ? '' : content.slice(0, colon).trim();
        const reason = colon === -1 ? '' : content.slice(colon + 1).trim();
        if (!SIZE_DIMENSIONS.includes(dimension) || reason === '') {
            out.malformed.push(at);
            continue;
        }
        if (out.declared.includes(dimension)) {
            out.duplicate.push(at);
            continue;
        }
        out.declared.push(dimension);
    }
    return out;
}
/**
 * Read a change's declaration from its proposal. An absent proposal declares nothing silently; one
 * that exists but cannot be read declares nothing and returns the failure.
 */
export function readSizeDeclaration(changeDir) {
    const empty = { declared: [], malformed: [], duplicate: [] };
    const proposalPath = path.join(changeDir, 'proposal.md');
    if (!existsSync(proposalPath))
        return { declaration: empty };
    try {
        return { declaration: parseSizeDeclaration(readFileSync(proposalPath, 'utf-8')) };
    }
    catch (err) {
        return { declaration: empty, error: { path: proposalPath, message: message(err) } };
    }
}
/**
 * Compare the figures with the ceiling: a breach is a figure STRICTLY GREATER than its maximum.
 * A declared dimension that is not over — or has no configured maximum — is STALE. A figure that
 * could not be computed is not compared. With the check OFF (`ceiling` null) nothing is compared.
 */
export function sizeBreaches(figures, ceiling, declaration) {
    const breaches = [];
    const stale = [];
    if (!ceiling)
        return { breaches, stale };
    const declared = new Set(declaration.declared);
    for (const dimension of SIZE_DIMENSIONS) {
        const maximum = ceiling[dimension];
        const figure = figures[dimension];
        if (maximum === undefined) {
            if (declared.has(dimension))
                stale.push({ dimension, figure, maximum: null });
            continue;
        }
        if (figure === null)
            continue;
        if (figure > maximum) {
            breaches.push({ dimension, figure, maximum, declared: declared.has(dimension) });
        }
        else if (declared.has(dimension)) {
            stale.push({ dimension, figure, maximum });
        }
    }
    return { breaches, stale };
}
/** The `size` object `orbit status --change <name> --json` carries (`Status carries the size figures`). */
export function composeStatusSize(projectRoot, changeDir, ceiling) {
    const size = computeChangeSize(projectRoot, changeDir);
    const { declaration } = readSizeDeclaration(changeDir);
    const { breaches } = sizeBreaches(size, ceiling, declaration);
    return {
        capabilities: size.capabilities,
        requirements: size.requirements,
        changed_bytes: size.changed_bytes,
        tasks: size.tasks,
        ceiling,
        breaches,
        errors: size.errors,
    };
}
/** The human `Size:` line: the four figures alone, then each breach or `none over`. No ratio. */
export function renderSizeLine(size) {
    const fig = (n) => (n === null ? '?' : String(n));
    const figures = [
        `${fig(size.capabilities)} capabilities`,
        `${fig(size.requirements)} requirements`,
        `${fig(size.changed_bytes)} bytes changed`,
        `${fig(size.tasks)} tasks`,
    ].join(' · ');
    const tail = size.breaches.length === 0
        ? 'none over'
        : size.breaches
            .map((b) => `${b.dimension} ${b.figure} > ${b.maximum} ${b.declared ? 'declared' : 'undeclared'}`)
            .join(', ');
    return `Size: ${figures} — ${tail}`;
}
//# sourceMappingURL=change-size.js.map