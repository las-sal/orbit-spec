import * as fs from 'node:fs';
import { createFenceTracker } from '../markdown-fence.js';
const TOP_LEVEL_ITEM = /^(?:[-*+]|\d+[.)])\s+/;
/**
 * Collects the `##` sections of an explore.md: every line keyed to its section, top-level
 * list items grouped into entries, fenced content marked (never structure). A `#` heading
 * ends the current section; an H3+ heading is section content. A same-named `##` heading
 * recurring later merges into the earlier section (see `Section.headings`).
 */
export function collectSections(content) {
    const lines = content.split(/\r?\n/);
    const sections = new Map();
    const tracker = createFenceTracker();
    let current = null;
    let currentEntry = null;
    let prevBlank = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const n = i + 1;
        const wasInFence = tracker.inFence;
        const isDelimiter = tracker.handle(line);
        if (wasInFence || isDelimiter) {
            // Fenced content (delimiters included) is never structure; it still belongs to the
            // enclosing section and entry as content.
            if (current) {
                const sl = { text: line, n, fenced: true };
                current.lines.push(sl);
                if (currentEntry)
                    currentEntry.lines.push(sl);
            }
            prevBlank = false;
            continue;
        }
        const heading = line.match(/^##\s+(.*\S)\s*$/);
        if (heading) {
            const name = heading[1].trim();
            const existing = sections.get(name);
            if (existing) {
                existing.headings.push(n);
                current = existing;
            }
            else {
                current = { lines: [], entries: [], headings: [n] };
                sections.set(name, current);
            }
            currentEntry = null;
            continue;
        }
        if (/^#\s+/.test(line)) {
            current = null;
            currentEntry = null;
            continue;
        }
        if (!current)
            continue;
        const sl = { text: line, n, fenced: false };
        current.lines.push(sl);
        const blank = line.trim() === '';
        if (TOP_LEVEL_ITEM.test(line)) {
            currentEntry = { line: n, lines: [sl] };
            current.entries.push(currentEntry);
        }
        else if (currentEntry && (/^#{3,}\s/.test(line) || (prevBlank && !blank && !/^\s/.test(line)))) {
            // The list item ENDS here (CommonMark): an ATX heading, or — after a blank line — an
            // unindented line that is not itself an item (a paragraph outside the list). Lines that
            // follow belong to the section, not the entry, so a column-zero `Kind:` after an H3 can
            // never opt the preceding rule out (rc13b system walk, external half). A nested bullet or
            // an indented continuation, and a lazy continuation with no blank line before it, still
            // belong to the entry.
            currentEntry = null;
        }
        else if (currentEntry) {
            currentEntry.lines.push(sl); // nested content / continuation belongs to the entry
        }
        prevBlank = blank;
    }
    return sections;
}
/** True when the entry's content carries a Standing recommendation with a real leaning. */
function hasRecordedLeaning(entry) {
    for (const { text } of entry.lines) {
        const m = text.match(/Standing recommendation:\s*(.*\S)?\s*$/);
        if (m) {
            const value = (m[1] ?? '').replace(/\*+$/, '').trim();
            return value !== '' && value.toLowerCase() !== 'none yet';
        }
    }
    return false;
}
export function countExplore(content) {
    const sections = collectSections(content);
    const missingSections = [];
    const decisions = sections.get('Decisions');
    if (!decisions)
        missingSections.push('Decisions');
    const openQuestions = sections.get('Open questions');
    if (!openQuestions)
        missingSections.push('Open questions');
    const decisionsCaptured = decisions ? decisions.entries.length : 0;
    const openQuestionsCount = openQuestions ? openQuestions.entries.length : 0;
    const withRec = openQuestions
        ? openQuestions.entries.filter(e => hasRecordedLeaning(e)).length
        : 0;
    return {
        decisionsCaptured,
        openQuestionsCount,
        openQuestionsWithRecommendation: withRec,
        attestation: `${withRec} of ${openQuestionsCount}`,
        missingSections,
    };
}
/** Convenience: count from an explore.md path. Missing file → zero counts, both sections missing. */
export function countExploreFile(explorePath) {
    let content;
    try {
        content = fs.readFileSync(explorePath, 'utf-8');
    }
    catch {
        return {
            decisionsCaptured: 0,
            openQuestionsCount: 0,
            openQuestionsWithRecommendation: 0,
            attestation: '0 of 0',
            missingSections: ['Decisions', 'Open questions'],
        };
    }
    return countExplore(content);
}
/** The ONE identifier rule. */
function renderIdentifier(e) {
    if (e.id !== undefined && e.line !== undefined)
        return `${e.id} at line ${e.line}`;
    if (e.id !== undefined)
        return e.id;
    return `line ${e.line}`;
}
/** At most THREE identifiers in the array's order, then ` +N more`. */
function renderBounded(list) {
    const shown = list.slice(0, 3).map(renderIdentifier).join(', ');
    const rest = list.length - 3;
    return rest > 0 ? `${shown} +${rest} more` : shown;
}
/**
 * The maturity-grid `next_recommended` (orbit-run-summary-emit `Named-mode explore
 * recommendation by maturity`) — the grid is ENGINE data. Six rungs: the header token is read
 * FIRST (Concluded); then Early / Mid / Stalled by the two counts, byte-identical to their
 * pre-capability strings; at 4+ decisions and ≤1 open question the accounting splits the cell —
 * UNACCOUNTED (K > 0, the ONE cell where the verb changes) or Accounted (K = 0, which REPORTS
 * and does not vouch). The open-rule list renders as a RECORD (` · open domains: …`) beside the
 * rungs whose own text does not name it; key defects append their own clause on EVERY rung.
 */
export function maturityRecommendation(name, decisionsCaptured, openQuestionsCount, form) {
    const K = form.rulesOpen.length;
    const R = form.rulesTotal;
    const D = form.keyDefects.length;
    const B = form.residuals.length;
    const keyDefectClause = D > 0 ? `; ${D} key defect${D === 1 ? '' : 's'} (${renderBounded(form.keyDefects)})` : '';
    const openRecord = K > 0 ? ` · open domains: ${renderBounded(form.rulesOpen)}` : '';
    // Header FIRST: a concluded file collapses every count to prose naming no command.
    if (form.status.token === 'concluded') {
        const reopens = form.status.re_entry ?? '(no Re-entry: slot found)';
        return `Concluded ${form.status.date}. Reopens when: ${reopens}.${keyDefectClause}${openRecord}`;
    }
    let text;
    if (decisionsCaptured <= 1) {
        text =
            decisionsCaptured === 0
                ? `/orbit:explore ${name} — continue capturing thinking — no decisions captured yet`
                : `/orbit:explore ${name} — continue capturing thinking`;
        return `${text}${keyDefectClause}${openRecord}`;
    }
    if (decisionsCaptured <= 3) {
        text = `/orbit:explore ${name} — continue thinking, or /orbit:propose ${name} if ready to formalize`;
        return `${text}${keyDefectClause}${openRecord}`;
    }
    if (openQuestionsCount > 1) {
        text = `/orbit:explore ${name} — ${decisionsCaptured} decisions captured but ${openQuestionsCount} open questions remain; resolve open questions before formalizing`;
        return `${text}${keyDefectClause}${openRecord}`;
    }
    const rulesNoun = `live rule${R === 1 ? '' : 's'}`;
    if (K > 0) {
        // Unaccounted: the inline list IS the record — no suffix.
        const verb = K === 1 ? 'has an open domain' : 'have open domains';
        return `/orbit:explore ${name} — ${K} of ${R} ${rulesNoun} ${verb} (${renderBounded(form.rulesOpen)}); account for them before formalizing${keyDefectClause}`;
    }
    // Accounted: reports, never vouches.
    const residualClause = B > 0 ? `, ${B} bounded residual${B === 1 ? '' : 's'} named (${renderBounded(form.residuals)})` : '';
    return `/orbit:propose ${name} — ${R} ${rulesNoun} accounted${residualClause}; formalize when you are ready (or /orbit:explore ${name} to keep refining)${keyDefectClause}`;
}
//# sourceMappingURL=explore-counter.js.map