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

// ---------------------------------------------------------------------------
// The productions, as the spec fences them (byte-equal; see the parity test)
// ---------------------------------------------------------------------------

/** The status header — `orbit-conventions`' `explore.md` format requirement. One line. */
export const EXPLORE_STATUS_HEADER_PRODUCTION: string =
  "^> \\*\\*Status\\*\\*: (exploring\\.( .*)?|concluded \\d{4}-\\d{2}-\\d{2}\\.)$      the file's first non-blank line";

/** The Decision entry — `orbit-conventions`' "Decision entry identity and classification". */
export const EXPLORE_DECISION_ENTRY_PRODUCTION: string = [
  '- **<YYYY-MM-DD> — <ID>: <title>** <prose…>            the opener; the ID slot; <ID> ::= D-[a-z0-9]+-[0-9]+, unique within the file',
  '  Kind: rule | fact | scope                               ^\\s*(?:[-*+]\\s+)?Kind:\\s*(rule|fact|scope)\\s*$',
  '  Disposition: live | superseded <ID or pointer> | assigned <stage-id>     same optional bullet prefix as Kind:',
  '  Re-entry: <what would reopen it>                        concluded entries only; exactly one LIVE entry carries it',
].join('\n');

/** The Mechanism entry — `orbit-conventions`' "Mechanism entry grammar and accounted closure". */
export const EXPLORE_MECHANISM_ENTRY_PRODUCTION: string = [
  '## Mechanism',
  '### <ID> — <rule title>              an entry; ends at the next heading of level 1–3, or EOF',
  'Domain: <the set, in one line>',
  '| member | covered by |              the enumeration, as a table (R-crc-7: decision tables); at least one member row; cells follow GFM — `\\|` is a literal pipe, never a separator',
  'Closure: <TOKEN>[ — <justification>]   <TOKEN> ::= DERIVED | SOURCED | BOUNDED, matched from line start to the first ` — ` or end of line',
  'Residual kind: <what lies outside>            required iff BOUNDED, forbidden otherwise',
  'Residual method: <how a member would be found> required iff BOUNDED, forbidden otherwise',
  'Moves:',
  '- <MOVE>: applied — <what it found>   |   - <MOVE>: not applied — <reason>     (` — ` is the literal em-dash)',
  '                                      nine lines, one per move, each move exactly once',
  '### Case <n> — <title>               evidence, free-form, cited by move lines by name',
].join('\n');

// ---------------------------------------------------------------------------
// The expressions that match them
// ---------------------------------------------------------------------------

/**
 * The status-header regex, DERIVED from the fenced production: the production line is the regex
 * source followed by a run of spaces and a comment. Group 1 is the whole token; group 3 the
 * concluded date when the token is `concluded`.
 */
export const STATUS_HEADER: RegExp = new RegExp(
  EXPLORE_STATUS_HEADER_PRODUCTION.split(/\s{2,}/)[0].replace('concluded \\d{4}-\\d{2}-\\d{2}', 'concluded (\\d{4}-\\d{2}-\\d{2})')
);

/** `<ID> ::= D-[a-z0-9]+-[0-9]+` — the whole-string form. */
export const DECISION_ID: RegExp = /^D-[a-z0-9]+-[0-9]+$/;

/**
 * The Decision opener as a FIRST-LINE PREFIX (`orbit-conventions`' Decision-entry requirement: the
 * closing `**` of the bold title may fall on a later line, so it is not part of the prefix).
 * Group 1 the date, group 2 the ID.
 */
export const DECISION_OPENER_PREFIX: RegExp = /^- \*\*(\d{4}-\d{2}-\d{2}) — (D-[a-z0-9]+-[0-9]+): /;

/** `Kind:` — the fenced regex verbatim, derived from the production's second line. */
export const KIND_SLOT: RegExp = new RegExp(
  EXPLORE_DECISION_ENTRY_PRODUCTION.split('\n')[1].split(/\s{2,}/).filter((s) => s.length > 0)[1]
);

/** `Disposition:` — "same optional bullet prefix as Kind:"; group 1 the value, group 2 the verb. */
export const DISPOSITION_SLOT: RegExp = /^\s*(?:[-*+]\s+)?Disposition:\s*((live)|(superseded|assigned)\s+\S.*?)\s*$/;

/** `Re-entry:` — same optional bullet prefix; group 1 the non-empty text. */
export const RE_ENTRY_SLOT: RegExp = /^\s*(?:[-*+]\s+)?Re-entry:\s*(\S.*?)\s*$/;

/** A Mechanism ENTRY heading: an H3 whose text begins `D-`; group 1 the raw text after `### `. */
export const MECHANISM_H3: RegExp = /^### (.*\S)\s*$/;
/** The well-formed entry heading: `### <ID> — <rule title>`; group 1 the ID, group 2 the title. */
export const MECHANISM_ENTRY_HEADING: RegExp = /^### (D-[a-z0-9]+-[0-9]+) — (.+)$/;
/** A CASE heading: `### Case <n> — <title>`. */
export const MECHANISM_CASE_HEADING: RegExp = /^### Case\b/;
/** An entry ends at the next heading of level 1–3. */
export const ENTRY_TERMINATOR: RegExp = /^#{1,3}\s/;

/** `Domain: <the set, in one line>` — non-empty. */
export const DOMAIN_LINE: RegExp = /^Domain: .*\S/;
/** The table header, exactly the two named columns. */
export const TABLE_HEADER: RegExp = /^\| member \| covered by \|\s*$/;
/** A GFM separator row for a two-column table. */
export const TABLE_SEPARATOR: RegExp = /^\|?\s*:?-+:?\s*\|\s*:?-+:?\s*\|?\s*$/;
/** A member row: two cells; cells follow GFM — `\|` is a literal pipe, never a separator. */
export const TABLE_CELL_ROW: RegExp = /^\| (?:[^|\\]|\\.)+ \| (?:[^|\\]|\\.)+ \|$/;

/** The three closure tokens; DERIVED and SOURCED are CLOSED, BOUNDED is OPEN-DECLARED. */
export const CLOSURE_TOKENS = ['DERIVED', 'SOURCED', 'BOUNDED'] as const;
export type ClosureToken = (typeof CLOSURE_TOKENS)[number];
/** A `Closure:` line by prefix (any token — the parser reports an unknown one as MALFORMED). */
export const CLOSURE_PREFIX: RegExp = /^Closure:/;
/** A well-formed `Closure:` line: token from line start to the first ` — ` or end of line. */
export const CLOSURE_LINE: RegExp = /^Closure: (DERIVED|SOURCED|BOUNDED)(?: — .*)?$/;

/** The residual slots, WELL-FORMED: a non-empty value; group 1 the text. */
export const RESIDUAL_KIND_LINE: RegExp = /^Residual kind: (\S.*)$/;
export const RESIDUAL_METHOD_LINE: RegExp = /^Residual method: (\S.*)$/;
/** Any residual slot by prefix (an EMPTY value is a present slot that is ABSENT for the obligation); forbidden on a non-BOUNDED entry. Group 1 names the slot. */
export const RESIDUAL_ANY_LINE: RegExp = /^Residual (kind|method):/;

/** `Moves:` opens the nine move lines. */
export const MOVES_LINE: RegExp = /^Moves:\s*$/;
/** The nine moves — a set the convention declares BOUNDED in its own slots. */
export const MOVE_NAMES = [
  'READ',
  'ENUMERATE',
  'COHERE',
  'EXECUTE',
  'FALSIFY',
  'CONFORM',
  'FEASIBILITY',
  'CONSUME',
  'INVOKE',
] as const;
export type MoveName = (typeof MOVE_NAMES)[number];
/** A well-formed move line; group 1 the move, group 2 the disposition. */
export const MOVE_LINE: RegExp = new RegExp(`^- (${MOVE_NAMES.join('|')}): (applied|not applied) — .+$`);
/** A line in the moves block that CLAIMS to be a move line (top-level bullet) and must match `MOVE_LINE`. */
export const MOVE_CANDIDATE: RegExp = /^- /;
