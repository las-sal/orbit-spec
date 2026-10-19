import * as fs from 'node:fs';
import { parseCheckboxes } from './apply-state.js';
const MALFORMED_WARNING = (tasksPath) => `warning: tasks.md preamble at ${tasksPath} could not be parsed as chunk declarations; falling back to no-chunking mode`;
/** Parses the chunk preamble from tasks.md content. `tasksPath` is used only in the warning text. */
export function parseChunkPreamble(content, tasksPath) {
    // The preamble is an HTML comment block BEFORE the first `## ` group header.
    const firstGroup = content.search(/^##\s+/m);
    const head = firstGroup === -1 ? content : content.slice(0, firstGroup);
    const commentMatch = head.match(/<!--([\s\S]*?)-->/);
    if (!commentMatch)
        return { kind: 'absent' };
    const body = commentMatch[1];
    if (!/Implementation chunks:/i.test(body))
        return { kind: 'absent' };
    const declarations = [];
    const lines = body.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || /^Implementation chunks:$/i.test(trimmed))
            continue;
        const m = trimmed.match(/^Chunk\s+(\d+)\s+\(groups\s+(\d+)(?:\s*-\s*(\d+))?\)\s*:\s*(.+\S)\s*$/);
        if (!m) {
            // A non-empty line inside the declared block that isn't a valid declaration
            // (missing parens, typo in `Chunk N`, malformed range, non-contiguous set, …).
            return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
        }
        const chunk = Number(m[1]);
        const groupStart = Number(m[2]);
        const groupEnd = m[3] !== undefined ? Number(m[3]) : groupStart;
        if (groupEnd < groupStart) {
            return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
        }
        declarations.push({ chunk, groupStart, groupEnd, name: m[4].trim() });
    }
    if (declarations.length === 0) {
        return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
    }
    // Cross-declaration coverage rules: ascending chunk numbers, non-overlapping,
    // gap-free coverage of the declared span.
    for (let i = 0; i < declarations.length; i++) {
        const d = declarations[i];
        if (d.chunk !== i + 1) {
            // Out-of-order or non-sequential chunk numbering.
            return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
        }
        if (i > 0) {
            const prev = declarations[i - 1];
            if (d.groupStart <= prev.groupEnd) {
                return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) }; // overlap
            }
            if (d.groupStart !== prev.groupEnd + 1) {
                return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) }; // gap
            }
        }
    }
    // Content coverage: the declared span must reach exactly the numbered groups present
    // in the file (same fence-aware grammar as checkbox arithmetic). Internal gaps are
    // rejected above; an omitted leading or trailing group would let the final declared
    // chunk record `chunk_complete: true` while uncovered AI-doable work remains — the
    // wrong-but-plausible record class this parser exists to prevent.
    const contentGroups = parseCheckboxes(content).groups;
    // An UNNUMBERED group carrying checkboxes is undeclarable — its tasks count in the
    // arithmetic but no chunk can ever cover them (external iter-2): incompatible with
    // chunking, so the preamble degrades to no-chunking like every other coverage hole.
    if (contentGroups.some(g => g.group === null && g.checked + g.unchecked > 0)) {
        return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
    }
    const numbered = contentGroups
        .map(g => g.group)
        .filter((g) => g !== null);
    if (numbered.length === 0) {
        return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) }; // declarations over no numbered groups
    }
    const minGroup = Math.min(...numbered);
    const maxGroup = Math.max(...numbered);
    if (declarations[0].groupStart !== minGroup ||
        declarations[declarations.length - 1].groupEnd !== maxGroup) {
        return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) }; // omitted leading/trailing group
    }
    return { kind: 'ok', declarations };
}
/** Convenience: parse from a tasks.md path on disk. Missing file → absent. */
export function parseChunkPreambleFile(tasksPath) {
    let content;
    try {
        content = fs.readFileSync(tasksPath, 'utf-8');
    }
    catch {
        return { kind: 'absent' };
    }
    return parseChunkPreamble(content, tasksPath);
}
/** Returns the declaration covering `group`, or null. */
export function chunkForGroup(declarations, group) {
    return declarations.find(d => group >= d.groupStart && group <= d.groupEnd) ?? null;
}
//# sourceMappingURL=chunk-preamble.js.map