/**
 * Explore counter (D-arc Stage D5, orbit-emit-composition `Per-command computed
 * extensions`). Fence-aware parse of a staging `explore.md` producing the engine-computed
 * explore emit extensions: `decisions_captured`, `open_questions_count`, and the
 * leak-hardening layer-3 attestation `open_questions_with_recommendation` ("n of m").
 *
 * Counter grammar: each counter counts TOP-LEVEL list items directly under the
 * `## Decisions` / `## Open questions` heading — nested bullets, paragraphs, and fenced
 * content are never entries. A heading absent entirely yields count 0 for that section
 * ("0 of 0" for the attestation) plus a caller-surfaced format note (the `explore.md`
 * format `orbit-conventions` owns makes absence a format violation to surface, never an
 * emit blocker).
 *
 * Attestation MEMBERSHIP: an entry counts toward `n` when its content carries a
 * `Standing recommendation:` line whose value is NOT the literal `none yet` — the
 * attestation measures RECORDED LEANINGS. Slot-less entries fall outside `n` (they are
 * audit-drift's format finding, never the counter's concern).
 *
 * Fences are tracked by the engine's ONE CommonMark fence grammar (`createFenceTracker`),
 * adopted at rc13b: the local scanner this module carried before closed a four-backtick
 * fence on an inner three-backtick line and accepted an over-indented fence — the defect
 * class Q-crc-15 records. The section collector is shared with the form parse
 * (`explore-rules.ts`), so the two parsers cannot disagree about what is fenced or which
 * lines belong to which entry.
 *
 * The maturity grid (`maturityRecommendation`) also lives here — see its own doc comment.
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
/** One line of a section, with its 1-based line number and whether it sits inside a fence (delimiters included). */
export interface SectionLine {
    text: string;
    n: number;
    fenced: boolean;
}
/** A top-level list item and the lines that belong to it (the item line first). */
export interface SectionEntry {
    /** The entry's first line (1-based). */
    line: number;
    lines: SectionLine[];
}
export interface Section {
    /** Every line of the section after its `##` heading, in order. */
    lines: SectionLine[];
    /** The top-level list items (the counter's entries). */
    entries: SectionEntry[];
    /**
     * The 1-based line of every `##` heading that opened this section. A same-named heading
     * recurring later in the file MERGES into the section (lines and entries appended in file
     * order) rather than replacing it — the rc13b system walk found a repeated `## Mechanism`
     * silently discarding the first section's entries and rendering four unaccounted rules
     * Accounted. More than one entry here is a format note for the caller to surface.
     */
    headings: number[];
}
/**
 * Collects the `##` sections of an explore.md: every line keyed to its section, top-level
 * list items grouped into entries, fenced content marked (never structure). A `#` heading
 * ends the current section; an H3+ heading is section content. A same-named `##` heading
 * recurring later merges into the earlier section (see `Section.headings`).
 */
export declare function collectSections(content: string): Map<string, Section>;
export declare function countExplore(content: string): ExploreCounts;
/** Convenience: count from an explore.md path. Missing file → zero counts, both sections missing. */
export declare function countExploreFile(explorePath: string): ExploreCounts;
/** An identifier the rung may render: `<id> at line <n>` / `<id>` / `line <n>` — the ONE identifier rule. */
export interface RungIdentifier {
    id?: string;
    line?: number;
}
/**
 * The FORM inputs the grid reads beside the two counts (rc13b; the fields are computed by
 * `explore-rules.ts` and defined once in `orbit-emit-composition`'s computed-extensions requirement).
 */
export interface MaturityFormInputs {
    /** The status-header token; `concluded` collapses every count to the Concluded rung. */
    status: {
        token: 'exploring' | 'concluded';
        date?: string;
        re_entry?: string;
    };
    /** The LIVE rules, as the Decision-entry requirement defines the obligation. R. */
    rulesTotal: number;
    /** Open live rules only, in Decisions file order; its LENGTH is K. */
    rulesOpen: RungIdentifier[];
    /** Orphans and duplicates, by line — a clause on every rung, never the verb. */
    keyDefects: RungIdentifier[];
    /** Each accounted BOUNDED entry, in Decisions file order — named beside the Accounted rung. */
    residuals: RungIdentifier[];
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
export declare function maturityRecommendation(name: string, decisionsCaptured: number, openQuestionsCount: number, form: MaturityFormInputs): string;
//# sourceMappingURL=explore-counter.d.ts.map