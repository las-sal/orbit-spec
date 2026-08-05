import * as fs from 'node:fs';

/**
 * Explore counter (D-arc Stage D5, orbit-emit-composition `Per-command computed
 * extensions`). Fence-aware parse of a staging `explore.md` producing the engine-computed
 * explore emit extensions: `decisions_captured`, `open_questions_count`, and the
 * leak-hardening layer-3 attestation `open_questions_with_recommendation` ("n of m").
 *
 * Counter grammar: each counter counts TOP-LEVEL list items directly under the
 * `## Decisions` / `## Open questions` heading — nested bullets, paragraphs, and fenced
 * content are never entries. A heading absent entirely yields count 0 for that section
 * ("0 of 0" for the attestation) plus a caller-surfaced format note (the five-section
 * format makes absence a format violation to surface, never an emit blocker).
 *
 * Attestation MEMBERSHIP: an entry counts toward `n` when its content carries a
 * `Standing recommendation:` line whose value is NOT the literal `none yet` — the
 * attestation measures RECORDED LEANINGS. Slot-less entries fall outside `n` (they are
 * audit-drift's format finding, never the counter's concern).
 */

export interface ExploreCounts {
  decisionsCaptured: number;
  openQuestionsCount: number;
  /** Entries under Open questions whose standing-recommendation value is a real leaning. */
  openQuestionsWithRecommendation: number;
  /** The "n of m" attestation string. */
  attestation: string;
  /** Section headings absent from the file (each deserves one stderr format note). */
  missingSections: string[];
}

interface Section {
  entries: string[][]; // per top-level entry: its lines (the entry line + nested content)
}

const TOP_LEVEL_ITEM = /^(?:[-*+]|\d+[.)])\s+/;

function collectSections(content: string): Map<string, Section> {
  const lines = content.split(/\r?\n/);
  const sections = new Map<string, Section>();
  let inFence = false;
  let fenceMarker = '';
  let current: Section | null = null;
  let currentEntry: string[] | null = null;

  for (const line of lines) {
    // Fence tracking (``` or ~~~, any info string; fences close on a matching marker).
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0].repeat(3);
      } else if (fence[1].startsWith(fenceMarker)) {
        inFence = false;
      }
      if (currentEntry) currentEntry.push(line);
      continue;
    }
    if (inFence) {
      if (currentEntry) currentEntry.push(line);
      continue; // fenced content is never structure
    }

    const heading = line.match(/^##\s+(.*\S)\s*$/);
    if (heading) {
      const name = heading[1].trim();
      current = { entries: [] };
      sections.set(name, current);
      currentEntry = null;
      continue;
    }
    if (/^#\s+/.test(line)) {
      current = null;
      currentEntry = null;
      continue;
    }
    if (!current) continue;

    if (TOP_LEVEL_ITEM.test(line)) {
      currentEntry = [line];
      current.entries.push(currentEntry);
    } else if (currentEntry) {
      currentEntry.push(line); // nested content / continuation belongs to the entry
    }
  }
  return sections;
}

/** True when the entry's content carries a Standing recommendation with a real leaning. */
function hasRecordedLeaning(entryLines: string[]): boolean {
  for (const line of entryLines) {
    const m = line.match(/Standing recommendation:\s*(.*\S)?\s*$/);
    if (m) {
      const value = (m[1] ?? '').replace(/\*+$/, '').trim();
      return value !== '' && value.toLowerCase() !== 'none yet';
    }
  }
  return false;
}

export function countExplore(content: string): ExploreCounts {
  const sections = collectSections(content);
  const missingSections: string[] = [];

  const decisions = sections.get('Decisions');
  if (!decisions) missingSections.push('Decisions');
  const openQuestions = sections.get('Open questions');
  if (!openQuestions) missingSections.push('Open questions');

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
export function countExploreFile(explorePath: string): ExploreCounts {
  let content: string;
  try {
    content = fs.readFileSync(explorePath, 'utf-8');
  } catch {
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

/**
 * The maturity-grid `next_recommended` (orbit-run-summary-emit `Named-mode explore
 * recommendation by maturity`) — the grid is ENGINE data.
 */
export function maturityRecommendation(
  name: string,
  decisionsCaptured: number,
  openQuestionsCount: number
): string {
  if (decisionsCaptured <= 1) {
    return decisionsCaptured === 0
      ? `/orbit:explore ${name} — continue capturing thinking — no decisions captured yet`
      : `/orbit:explore ${name} — continue capturing thinking`;
  }
  if (decisionsCaptured <= 3) {
    return `/orbit:explore ${name} — continue thinking, or /orbit:propose ${name} if ready to formalize`;
  }
  if (openQuestionsCount <= 1) {
    return `/orbit:propose ${name} — substantial thinking captured; ready to formalize the design (or /orbit:explore ${name} to keep refining)`;
  }
  return `/orbit:explore ${name} — ${decisionsCaptured} decisions captured but ${openQuestionsCount} open questions remain; resolve open questions before formalizing`;
}
