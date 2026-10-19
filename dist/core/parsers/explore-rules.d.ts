/**
 * The explore FORM parse (rc13b, D-rc13b-8; `orbit-emit-composition` "Per-command computed
 * extensions" — the five explore fields). Reads a staging `explore.md` through the productions
 * `orbit-conventions` owns (imported from the grammar module, never restated) and the engine's
 * ONE CommonMark fence grammar, and judges FORM ONLY: whether a live rule has a Mechanism entry,
 * whether it declares a token, whether the slots the token requires are present. Whether an
 * enumeration is TRUE, a residual honest, or a rule written down at all is a reader's judgement
 * (R-crc-10) — a file whose every decision is `Kind: fact` yields `rules_total: 0`, truthfully.
 *
 * TWO DISJOINT arrays, by construction:
 *   - `rules_open` — LIVE RULES ONLY, one entry per live rule whose domain is not accounted, in
 *     exactly one of five states tested in order (`open` → `absent` → `bounded-incomplete` →
 *     `no-closure` → `malformed-entry`), ordered by the Decisions entries' file order. Its
 *     LENGTH is the maturity rung's K.
 *   - `key_defects` — defects in the KEY space (`orphan`, `duplicate`), ordered by line, never a
 *     rule and never counted in K.
 * No defect of either array blocks an emit: the fields record it and the rung reports it.
 *
 * The ID opener is a FIRST-LINE PREFIX match (`orbit-conventions`' Decision-entry requirement —
 * pointed at, not restated): a bold title wrapped onto a second line keeps its ID; only an entry
 * whose first line carries no prefix at all is ID-less (`open`, named by line). A `Kind:` or
 * `Disposition:` value outside its production is NO MATCH: the slot is absent and the demanding
 * default applies, so a typo cannot escape the obligation.
 */
export type OpenRuleState = 'open' | 'absent' | 'bounded-incomplete' | 'no-closure' | 'malformed-entry';
export interface OpenRule {
    id?: string;
    state: OpenRuleState;
    line?: number;
}
export interface KeyDefect {
    id: string;
    kind: 'orphan' | 'duplicate';
    line: number;
}
export interface Residual {
    id: string;
    kind: string;
    method: string;
}
export interface ExploreStatus {
    token: 'exploring' | 'concluded';
    date?: string;
    re_entry?: string;
}
export interface ExploreRules {
    rules_total: number;
    rules_open: OpenRule[];
    key_defects: KeyDefect[];
    residuals: Residual[];
    status: ExploreStatus;
    /** Caller-surfaced stderr notes (missing Mechanism section; a second live `Re-entry:` slot). Never blockers. */
    notes: string[];
}
export declare function readStatus(content: string): ExploreStatus;
export declare function parseExploreRules(content: string): ExploreRules;
/** From an explore.md path. Missing file → zeros, `status: {token: "exploring"}`, no notes (the counter's missing-section notes stand alone). */
export declare function parseExploreRulesFile(explorePath: string): ExploreRules;
//# sourceMappingURL=explore-rules.d.ts.map