/**
 * The explore.md grammar — ONE source in code (rc13b, D-rc13b-5; `orbit-emit-composition`
 * "The explore grammar has one source in code").
 *
 * `orbit-conventions` OWNS the three productions (the status header, the Decision entry, the
 * Mechanism entry). This module carries them in code: the strings the spec fences, and the
 * regular expressions that match them. Every engine extension of the grammar imports from here —
 * the form parse (`parsers/explore-rules.ts`), the generated-surface test's grammar walk, and the
 * explore body template, which interpolates the production STRINGS so the rendered skill's mirrors
 * are byte-identical to the spec's fences. A parity test reads the owning text's fences and asserts
 * the strings below equal them, so this file is a CHECKED extension of the spec, never a second
 * statement of it (R-crc-14).
 *
 * Matching rules the spec states in PROSE rather than in a fence (the opener is a FIRST-LINE PREFIX
 * match; the `Closure:` token is matched from line start to the first ` — `; an H3 beginning `D-`
 * is an entry, `Case` a case, anything else prose) are expressed here as the expressions the
 * parser and the tests share, and are covered by the parser's fixture tests over the two exemplar
 * entries the explore body carries.
 */
/** The status header — `orbit-conventions`' `explore.md` format requirement. One line. */
export declare const EXPLORE_STATUS_HEADER_PRODUCTION: string;
/** The Decision entry — `orbit-conventions`' "Decision entry identity and classification". */
export declare const EXPLORE_DECISION_ENTRY_PRODUCTION: string;
/** The Mechanism entry — `orbit-conventions`' "Mechanism entry grammar and accounted closure". */
export declare const EXPLORE_MECHANISM_ENTRY_PRODUCTION: string;
/**
 * The status-header regex, DERIVED from the fenced production: the production line is the regex
 * source followed by a run of spaces and a comment. Group 1 is the whole token; group 3 the
 * concluded date when the token is `concluded`.
 */
export declare const STATUS_HEADER: RegExp;
/** `<ID> ::= D-[a-z0-9]+-[0-9]+` — the whole-string form. */
export declare const DECISION_ID: RegExp;
/**
 * The Decision opener as a FIRST-LINE PREFIX (`orbit-conventions`' Decision-entry requirement: the
 * closing `**` of the bold title may fall on a later line, so it is not part of the prefix). The
 * colon may be followed by a space OR the line end — a title wrapped immediately after the colon
 * keeps its ID (rc13b system walk). Group 1 the date, group 2 the ID.
 */
export declare const DECISION_OPENER_PREFIX: RegExp;
/** `Kind:` — the fenced regex verbatim, derived from the production's second line. */
export declare const KIND_SLOT: RegExp;
/** `Disposition:` — "same optional bullet prefix as Kind:"; group 1 the value, group 2 the verb. */
export declare const DISPOSITION_SLOT: RegExp;
/** `Re-entry:` — same optional bullet prefix; group 1 the non-empty text. */
export declare const RE_ENTRY_SLOT: RegExp;
/** A Mechanism ENTRY heading: an H3 whose text begins `D-`; group 1 the raw text after `### `. */
export declare const MECHANISM_H3: RegExp;
/** The well-formed entry heading: `### <ID> — <rule title>`; group 1 the ID, group 2 the title. */
export declare const MECHANISM_ENTRY_HEADING: RegExp;
/** A CASE heading: `### Case <n> — <title>`. */
export declare const MECHANISM_CASE_HEADING: RegExp;
/** An entry ends at the next heading of level 1–3. */
export declare const ENTRY_TERMINATOR: RegExp;
/** `Domain: <the set, in one line>` — non-empty. */
export declare const DOMAIN_LINE: RegExp;
/**
 * Splits a GFM table row into its trimmed cells: leading/trailing whitespace ignored, one optional
 * leading and one optional trailing pipe stripped, cells split on UNESCAPED pipes (`\|` is a literal
 * pipe, never a separator — the grammar's clause). Returns null for a line that is not a row (no
 * pipe at all). Padding is never significant (rc13b system walk: both halves of the blind pair found
 * the earlier regex rejecting `|a|b|` and a trailing space as MALFORMED).
 */
export declare function splitTableRow(line: string): string[] | null;
/** A line that BEGINS a table row (GFM: up to three spaces of indent, then a pipe). */
export declare const TABLE_ROW_START: RegExp;
/** The table header: exactly the two named columns, GFM-split. */
export declare function isTableHeader(line: string): boolean;
/** A GFM separator row for a two-column table. */
export declare const TABLE_SEPARATOR: RegExp;
/** A member row: exactly two non-empty cells, GFM-split. */
export declare function isMemberRow(line: string): boolean;
/** The ID-shaped prefix of a heading that begins `D-` but is not a well-formed entry heading (rc13b system walk). */
export declare const DECISION_ID_PREFIX: RegExp;
/** The three closure tokens; DERIVED and SOURCED are CLOSED, BOUNDED is OPEN-DECLARED. */
export declare const CLOSURE_TOKENS: readonly ["DERIVED", "SOURCED", "BOUNDED"];
export type ClosureToken = (typeof CLOSURE_TOKENS)[number];
/** A `Closure:` line by prefix (any token — the parser reports an unknown one as MALFORMED). */
export declare const CLOSURE_PREFIX: RegExp;
/** A well-formed `Closure:` line: token from line start to the first ` — ` or end of line. */
export declare const CLOSURE_LINE: RegExp;
/** The residual slots, WELL-FORMED: a non-empty value; group 1 the text. */
export declare const RESIDUAL_KIND_LINE: RegExp;
export declare const RESIDUAL_METHOD_LINE: RegExp;
/** Any residual slot by prefix (an EMPTY value is a present slot that is ABSENT for the obligation); forbidden on a non-BOUNDED entry. Group 1 names the slot. */
export declare const RESIDUAL_ANY_LINE: RegExp;
/** `Moves:` opens the nine move lines. */
export declare const MOVES_LINE: RegExp;
/** The nine moves — a set the convention declares BOUNDED in its own slots. */
export declare const MOVE_NAMES: readonly ["READ", "ENUMERATE", "COHERE", "EXECUTE", "FALSIFY", "CONFORM", "FEASIBILITY", "CONSUME", "INVOKE"];
export type MoveName = (typeof MOVE_NAMES)[number];
/** A well-formed move line; group 1 the move, group 2 the disposition. */
export declare const MOVE_LINE: RegExp;
/** A line in the moves block that CLAIMS to be a move line (top-level bullet) and must match `MOVE_LINE`. */
export declare const MOVE_CANDIDATE: RegExp;
//# sourceMappingURL=explore-grammar.d.ts.map