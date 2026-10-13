export function normalizeRequirementName(name) {
    return name.trim();
}
const REQUIREMENT_HEADER_REGEX = /^###\s*Requirement:\s*(.+)\s*$/;
/**
 * Extracts the Requirements section from a spec file and parses requirement blocks.
 */
/**
 * Returns a boolean per line: true when the line is inside (or is a delimiter of) a
 * fenced code block. Fence-aware parsing keeps `##` / `### Requirement:` headers that
 * appear inside fenced examples (e.g. a prompt template) from being mistaken for spec
 * structure. Nested fences are handled by tracking the opening delimiter's char +
 * length: a fence closes only on a delimiter of the same char and >= length.
 */
export function computeFenceMask(lines) {
    const mask = new Array(lines.length).fill(false);
    // Depth-tracked so nested SAME-LENGTH fences parse correctly (the specs embed
    // ```markdown examples that themselves contain ``` blocks). Heuristic tuned for
    // these docs: a fence delimiter carrying an info string (```markdown) OPENS a
    // level; a bare delimiter (```) CLOSES the current level, or opens one at depth 0.
    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*(`{3,}|~{3,})(.*)$/);
        if (m) {
            const info = m[2].trim();
            if (info !== '') {
                depth++; // opening fence with an info string
            }
            else if (depth > 0) {
                depth--; // bare delimiter closes the current level
            }
            else {
                depth++; // bare delimiter with nothing open — opens a language-less block
            }
            mask[i] = true; // the delimiter line itself is part of the fence
            continue;
        }
        mask[i] = depth > 0;
    }
    return mask;
}
export function extractRequirementsSection(content) {
    const normalized = normalizeLineEndings(content);
    const lines = normalized.split('\n');
    const fence = computeFenceMask(lines);
    const reqHeaderIndex = lines.findIndex((l, i) => /^##\s+Requirements\s*$/i.test(l) && !fence[i]);
    if (reqHeaderIndex === -1) {
        // No requirements section; create an empty one at the end
        const before = content.trimEnd();
        const headerLine = '## Requirements';
        return {
            before: before ? before + '\n\n' : '',
            headerLine,
            preamble: '',
            bodyBlocks: [],
            after: '\n',
        };
    }
    // Find end of this section: next NON-FENCED line that starts with '## '.
    let endIndex = lines.length;
    for (let i = reqHeaderIndex + 1; i < lines.length; i++) {
        if (/^##\s+/.test(lines[i]) && !fence[i]) {
            endIndex = i;
            break;
        }
    }
    const before = lines.slice(0, reqHeaderIndex).join('\n');
    const headerLine = lines[reqHeaderIndex];
    const sectionBodyLines = lines.slice(reqHeaderIndex + 1, endIndex);
    const bodyFence = fence.slice(reqHeaderIndex + 1, endIndex);
    const isReqHeader = (idx) => /^###\s+Requirement:/.test(sectionBodyLines[idx]) && !bodyFence[idx];
    // Parse requirement blocks within section body (fence-aware)
    const blocks = [];
    let cursor = 0;
    let preambleLines = [];
    // Collect preamble lines until first requirement header
    while (cursor < sectionBodyLines.length && !isReqHeader(cursor)) {
        preambleLines.push(sectionBodyLines[cursor]);
        cursor++;
    }
    while (cursor < sectionBodyLines.length) {
        const headerLineCandidate = sectionBodyLines[cursor];
        const headerMatch = isReqHeader(cursor) ? headerLineCandidate.match(REQUIREMENT_HEADER_REGEX) : null;
        if (!headerMatch) {
            // Not a requirement header; skip line defensively
            cursor++;
            continue;
        }
        const name = normalizeRequirementName(headerMatch[1]);
        cursor++;
        // Gather lines until the next NON-FENCED requirement header or '## ' boundary
        const bodyLines = [headerLineCandidate];
        while (cursor < sectionBodyLines.length &&
            !isReqHeader(cursor) &&
            !(/^##\s+/.test(sectionBodyLines[cursor]) && !bodyFence[cursor])) {
            bodyLines.push(sectionBodyLines[cursor]);
            cursor++;
        }
        const raw = bodyLines.join('\n').trimEnd();
        blocks.push({ headerLine: headerLineCandidate, name, raw });
    }
    const after = lines.slice(endIndex).join('\n');
    const preamble = preambleLines.join('\n').trimEnd();
    return {
        before: before.trimEnd() ? before + '\n' : before,
        headerLine,
        preamble,
        bodyBlocks: blocks,
        after: after.startsWith('\n') ? after : '\n' + after,
    };
}
function normalizeLineEndings(content) {
    return content.replace(/\r\n?/g, '\n');
}
/**
 * Parse a delta-formatted spec change file content into a DeltaPlan with raw blocks.
 */
export function parseDeltaSpec(content) {
    const normalized = normalizeLineEndings(content);
    const sections = splitTopLevelSections(normalized);
    const addedLookup = getSectionCaseInsensitive(sections, 'ADDED Requirements');
    const modifiedLookup = getSectionCaseInsensitive(sections, 'MODIFIED Requirements');
    const removedLookup = getSectionCaseInsensitive(sections, 'REMOVED Requirements');
    const renamedLookup = getSectionCaseInsensitive(sections, 'RENAMED Requirements');
    const added = parseRequirementBlocksFromSection(addedLookup.body);
    const modified = parseRequirementBlocksFromSection(modifiedLookup.body);
    const removedNames = parseRemovedNames(removedLookup.body);
    const renamedPairs = parseRenamedPairs(renamedLookup.body);
    return {
        added,
        modified,
        removed: removedNames,
        renamed: renamedPairs,
        sectionPresence: {
            added: addedLookup.found,
            modified: modifiedLookup.found,
            removed: removedLookup.found,
            renamed: renamedLookup.found,
        },
    };
}
function splitTopLevelSections(content) {
    const lines = content.split('\n');
    const fence = computeFenceMask(lines);
    const result = {};
    const indices = [];
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(##)\s+(.+)$/);
        if (m && !fence[i]) {
            const level = m[1].length; // only care for '##'
            indices.push({ title: m[2].trim(), index: i, level });
        }
    }
    for (let i = 0; i < indices.length; i++) {
        const current = indices[i];
        const next = indices[i + 1];
        const body = lines.slice(current.index + 1, next ? next.index : lines.length).join('\n');
        result[current.title] = body;
    }
    return result;
}
function getSectionCaseInsensitive(sections, desired) {
    const target = desired.toLowerCase();
    for (const [title, body] of Object.entries(sections)) {
        if (title.toLowerCase() === target)
            return { body, found: true };
    }
    return { body: '', found: false };
}
function parseRequirementBlocksFromSection(sectionBody) {
    if (!sectionBody)
        return [];
    const lines = normalizeLineEndings(sectionBody).split('\n');
    const fence = computeFenceMask(lines);
    const isReqHeader = (i) => /^###\s+Requirement:/.test(lines[i]) && !fence[i];
    const isBoundary = (i) => /^##\s+/.test(lines[i]) && !fence[i];
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
        // Seek next (non-fenced) requirement header
        while (i < lines.length && !isReqHeader(i))
            i++;
        if (i >= lines.length)
            break;
        const headerLine = lines[i];
        const m = headerLine.match(REQUIREMENT_HEADER_REGEX);
        if (!m) {
            i++;
            continue;
        }
        const name = normalizeRequirementName(m[1]);
        const buf = [headerLine];
        i++;
        while (i < lines.length && !isReqHeader(i) && !isBoundary(i)) {
            buf.push(lines[i]);
            i++;
        }
        blocks.push({ headerLine, name, raw: buf.join('\n').trimEnd() });
    }
    return blocks;
}
function parseRemovedNames(sectionBody) {
    if (!sectionBody)
        return [];
    const names = [];
    const lines = normalizeLineEndings(sectionBody).split('\n');
    for (const line of lines) {
        const m = line.match(REQUIREMENT_HEADER_REGEX);
        if (m) {
            names.push(normalizeRequirementName(m[1]));
            continue;
        }
        // Also support bullet list of headers
        const bullet = line.match(/^\s*-\s*`?###\s*Requirement:\s*(.+?)`?\s*$/);
        if (bullet) {
            names.push(normalizeRequirementName(bullet[1]));
        }
    }
    return names;
}
function parseRenamedPairs(sectionBody) {
    if (!sectionBody)
        return [];
    const pairs = [];
    const lines = normalizeLineEndings(sectionBody).split('\n');
    let current = {};
    for (const line of lines) {
        const fromMatch = line.match(/^\s*-?\s*FROM:\s*`?###\s*Requirement:\s*(.+?)`?\s*$/);
        const toMatch = line.match(/^\s*-?\s*TO:\s*`?###\s*Requirement:\s*(.+?)`?\s*$/);
        if (fromMatch) {
            current.from = normalizeRequirementName(fromMatch[1]);
        }
        else if (toMatch) {
            current.to = normalizeRequirementName(toMatch[1]);
            if (current.from && current.to) {
                pairs.push({ from: current.from, to: current.to });
                current = {};
            }
        }
    }
    return pairs;
}
//# sourceMappingURL=requirement-blocks.js.map