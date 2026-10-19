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
export const EXPLORE_STATUS_HEADER_PRODUCTION = "^> \\*\\*Status\\*\\*: (exploring\\.( .*)?|concluded \\d{4}-\\d{2}-\\d{2}\\.)$      the file's first non-blank line";
/** The Decision entry — `orbit-conventions`' "Decision entry identity and classification". */
export const EXPLORE_DECISION_ENTRY_PRODUCTION = [
    '- **<YYYY-MM-DD> — <ID>: <title>** <prose…>            the opener; the ID slot; <ID> ::= D-[a-z0-9]+-[0-9]+, unique within the file',
    '  Kind: rule | fact | scope                               ^\\s*(?:[-*+]\\s+)?Kind:\\s*(rule|fact|scope)\\s*$',
    '  Disposition: live | superseded <ID or pointer> | assigned <stage-id>     same optional bullet prefix as Kind:',
    '  Re-entry: <what would reopen it>                        concluded entries only; exactly one LIVE entry carries it',
].join('\n');
/** The Mechanism entry — `orbit-conventions`' "Mechanism entry grammar and accounted closure". */
export const EXPLORE_MECHANISM_ENTRY_PRODUCTION = [
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
export const STATUS_HEADER = new RegExp(EXPLORE_STATUS_HEADER_PRODUCTION.split(/\s{2,}/)[0].replace('concluded \\d{4}-\\d{2}-\\d{2}', 'concluded (\\d{4}-\\d{2}-\\d{2})'));
/** `<ID> ::= D-[a-z0-9]+-[0-9]+` — the whole-string form. */
export const DECISION_ID = /^D-[a-z0-9]+-[0-9]+$/;
/**
 * The Decision opener as a FIRST-LINE PREFIX (`orbit-conventions`' Decision-entry requirement: the
 * closing `**` of the bold title may fall on a later line, so it is not part of the prefix). The
 * colon may be followed by a space OR the line end — a title wrapped immediately after the colon
 * keeps its ID (rc13b system walk). Group 1 the date, group 2 the ID.
 */
export const DECISION_OPENER_PREFIX = /^- \*\*(\d{4}-\d{2}-\d{2}) — (D-[a-z0-9]+-[0-9]+):(?: |$)/;
/** `Kind:` — the fenced regex verbatim, derived from the production's second line. */
export const KIND_SLOT = new RegExp(EXPLORE_DECISION_ENTRY_PRODUCTION.split('\n')[1].split(/\s{2,}/).filter((s) => s.length > 0)[1]);
/** `Disposition:` — "same optional bullet prefix as Kind:"; group 1 the value, group 2 the verb. */
export const DISPOSITION_SLOT = /^\s*(?:[-*+]\s+)?Disposition:\s*((live)|(superseded|assigned)\s+\S.*?)\s*$/;
/** `Re-entry:` — same optional bullet prefix; group 1 the non-empty text. */
export const RE_ENTRY_SLOT = /^\s*(?:[-*+]\s+)?Re-entry:\s*(\S.*?)\s*$/;
/** A Mechanism ENTRY heading: an H3 whose text begins `D-`; group 1 the raw text after `### `. */
export const MECHANISM_H3 = /^### (.*\S)\s*$/;
/** The well-formed entry heading: `### <ID> — <rule title>`; group 1 the ID, group 2 the title. */
export const MECHANISM_ENTRY_HEADING = /^### (D-[a-z0-9]+-[0-9]+) — (.+)$/;
/** A CASE heading: `### Case <n> — <title>`. */
export const MECHANISM_CASE_HEADING = /^### Case\b/;
/** An entry ends at the next heading of level 1–3. */
export const ENTRY_TERMINATOR = /^#{1,3}\s/;
/** `Domain: <the set, in one line>` — non-empty. */
export const DOMAIN_LINE = /^Domain: .*\S/;
/**
 * Splits a GFM table row into its trimmed cells: leading/trailing whitespace ignored, one optional
 * leading and one optional trailing pipe stripped, cells split on UNESCAPED pipes (`\|` is a literal
 * pipe, never a separator — the grammar's clause). Returns null for a line that is not a row (no
 * pipe at all). Padding is never significant (rc13b system walk: both halves of the blind pair found
 * the earlier regex rejecting `|a|b|` and a trailing space as MALFORMED).
 */
export function splitTableRow(line) {
    let s = line.trim();
    if (!s.includes('|'))
        return null;
    if (s.startsWith('|'))
        s = s.slice(1);
    if (s.endsWith('|') && !s.endsWith('\\|'))
        s = s.slice(0, -1);
    const cells = [];
    let cur = '';
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '\\' && i + 1 < s.length) {
            cur += c + s[i + 1];
            i++;
            continue;
        }
        if (c === '|') {
            cells.push(cur.trim());
            cur = '';
        }
        else
            cur += c;
    }
    cells.push(cur.trim());
    return cells;
}
/** A line that BEGINS a table row (GFM: up to three spaces of indent, then a pipe). */
export const TABLE_ROW_START = /^ {0,3}\|/;
/** The table header: exactly the two named columns, GFM-split. */
export function isTableHeader(line) {
    const c = splitTableRow(line);
    return c !== null && c.length === 2 && c[0] === 'member' && c[1] === 'covered by';
}
/** A GFM separator row for a two-column table. */
export const TABLE_SEPARATOR = /^\s*\|?\s*:?-+:?\s*\|\s*:?-+:?\s*\|?\s*$/;
/** A member row: exactly two non-empty cells, GFM-split. */
export function isMemberRow(line) {
    const c = splitTableRow(line);
    return c !== null && c.length === 2 && c[0] !== '' && c[1] !== '';
}
/** The ID-shaped prefix of a heading that begins `D-` but is not a well-formed entry heading (rc13b system walk). */
export const DECISION_ID_PREFIX = /^D-[a-z0-9]+-[0-9]+/;
/** The three closure tokens; DERIVED and SOURCED are CLOSED, BOUNDED is OPEN-DECLARED. */
export const CLOSURE_TOKENS = ['DERIVED', 'SOURCED', 'BOUNDED'];
/** A `Closure:` line by prefix (any token — the parser reports an unknown one as MALFORMED). */
export const CLOSURE_PREFIX = /^Closure:/;
/** A well-formed `Closure:` line: token from line start to the first ` — ` or end of line. */
export const CLOSURE_LINE = /^Closure: (DERIVED|SOURCED|BOUNDED)(?: — .*)?$/;
/** The residual slots, WELL-FORMED: a non-empty value; group 1 the text. */
export const RESIDUAL_KIND_LINE = /^Residual kind: (\S.*)$/;
export const RESIDUAL_METHOD_LINE = /^Residual method: (\S.*)$/;
/** Any residual slot by prefix (an EMPTY value is a present slot that is ABSENT for the obligation); forbidden on a non-BOUNDED entry. Group 1 names the slot. */
export const RESIDUAL_ANY_LINE = /^Residual (kind|method):/;
/** `Moves:` opens the nine move lines. */
export const MOVES_LINE = /^Moves:\s*$/;
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
];
/** A well-formed move line; group 1 the move, group 2 the disposition. */
export const MOVE_LINE = new RegExp(`^- (${MOVE_NAMES.join('|')}): (applied|not applied) — .+$`);
/** A line in the moves block that CLAIMS to be a move line (top-level bullet) and must match `MOVE_LINE`. */
export const MOVE_CANDIDATE = /^- /;
//# sourceMappingURL=explore-grammar.js.map