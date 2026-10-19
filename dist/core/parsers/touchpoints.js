import * as fs from 'node:fs';
import { createFenceTracker } from '../markdown-fence.js';
const LIST_ITEM = /^\s*[-*+]\s+(.*)$/;
const LEADING_SPANS = /^(`[^`]+`(?:\s*\+\s*`[^`]+`)*)/;
/**
 * Targets are REPO-RELATIVE path shapes (exact / prefix / glob). Absolute forms,
 * parent-resolving segments, backslash separators, and `./`-prefixed spellings are
 * MALFORMED — they could never match a repo-relative actual path, so accepting them
 * would create predictions the set arithmetic silently never satisfies.
 */
function isValidTarget(t) {
    if (t.trim() === '' || /\s/.test(t))
        return false;
    if (t.startsWith('/') || t.includes('\\') || /^[A-Za-z]:/.test(t))
        return false;
    if (t.startsWith('./'))
        return false;
    if (t.split('/').some(seg => seg === '..'))
        return false;
    return true;
}
function targetForm(t) {
    if (t.includes('*'))
        return 'glob';
    if (t.endsWith('/'))
        return 'prefix';
    if (/^[^\s`]+$/.test(t))
        return 'exact';
    return null;
}
/** Parses the `## Touchpoints` section of a design.md content string. */
export function parseTouchpoints(content) {
    const lines = content.split(/\r?\n/);
    const result = { present: false, entries: [], malformed: [] };
    let inSection = false;
    // rc10 (system walk): the engine's ONE CommonMark fence tracker, never a local toggle — the same
    // repair `parseCheckboxes` took, for the same reason (a three-backtick line closed a four-backtick fence).
    // Unlike there, lines are NOT stripped of indent: a fence nested in a list item sits at 4+ spaces, and
    // every line inside it is indented too, so none can match the `## ` heading or a top-level entry
    // whether or not the fence opens (rc10 verification walk).
    const fence = createFenceTracker();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (fence.handle(line) || fence.inFence)
            continue;
        if (/^##\s+Touchpoints\s*$/.test(line)) {
            inSection = true;
            result.present = true;
            continue;
        }
        if (inSection && /^##\s+/.test(line))
            break; // left the section
        if (!inSection)
            continue;
        const item = line.match(LIST_ITEM);
        if (!item)
            continue;
        // Continuation lines of the previous item start with whitespace and are not list
        // items at this level; only top-level list items are entries.
        if (/^\s{2,}[-*+]\s/.test(line))
            continue; // nested bullet — not an entry
        const spans = item[1].match(LEADING_SPANS);
        if (!spans) {
            result.malformed.push({ line: i + 1, text: item[1].trim() });
            continue;
        }
        const targets = [...spans[1].matchAll(/`([^`]+)`/g)].map(m => m[1].trim());
        if (targets.length === 0 || targets.some(t => !isValidTarget(t) || targetForm(t) === null)) {
            result.malformed.push({ line: i + 1, text: item[1].trim() });
            continue;
        }
        result.entries.push({ targets, line: i + 1 });
    }
    return result;
}
/** Parses a design.md file's Touchpoints section. Missing file → absent section. */
export function parseTouchpointsFile(designPath) {
    let content;
    try {
        content = fs.readFileSync(designPath, 'utf-8');
    }
    catch {
        return { present: false, entries: [], malformed: [] };
    }
    return parseTouchpoints(content);
}
/** fnmatch-style single-target match: exact path, directory prefix, or glob. */
export function targetMatches(target, actualPath) {
    const form = targetForm(target);
    if (form === 'exact')
        return actualPath === target;
    if (form === 'prefix')
        return actualPath.startsWith(target);
    if (form === 'glob') {
        const rx = new RegExp('^' +
            target
                .split('*')
                .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('[^/]*') +
            '$');
        return rx.test(actualPath);
    }
    return false;
}
/** An actual path is PREDICTED when any entry's any target matches. */
export function isPredicted(entries, actualPath) {
    return entries.some(e => e.targets.some(t => targetMatches(t, actualPath)));
}
/** An entry is SATISFIED when ANY of its grouped targets matched some actual path. */
export function entrySatisfied(entry, actualPaths) {
    return entry.targets.some(t => actualPaths.some(p => targetMatches(t, p)));
}
//# sourceMappingURL=touchpoints.js.map