## MODIFIED Requirements

### Requirement: Named-mode explore recommendation by maturity

Named-mode `/orbit:explore` emits SHALL include `next_recommended` text computed from FIVE inputs read from the staging `explore.md` by the emit surface (per `orbit-emit-composition`'s computed-extensions requirement): the status-header token, the count of decisions captured, the count of open questions remaining, the LIVE rules whose domain is OPEN (`rules_open`), and the KEY DEFECTS (`key_defects`) — the fifth selects no rung and only ever adds a clause. The header is read FIRST. Six mutually-exclusive rungs cover the grid:

- **Concluded (header token `concluded`, any counts)**: `"Concluded <YYYY-MM-DD>. Reopens when: <the live CONCLUDED entry's Re-entry: slot, verbatim>."` — PROSE naming no command. It is the only rung that points at nothing, which is its point (the exploration's own record says what would reopen it; the engine recommends neither `/orbit:explore` nor `/orbit:propose`). When the file carries the token but no live entry with a `Re-entry:` slot, the second sentence reads `Reopens when: (no Re-entry: slot found)`. Any open-rule list renders beside it as a record.
- **Early (0–1 decisions captured)**: `"/orbit:explore <name> — continue capturing thinking"`
- **Mid (2–3 decisions captured)**: `"/orbit:explore <name> — continue thinking, or /orbit:propose <name> if ready to formalize"`
- **Stalled (4+ decisions captured AND >1 open question)**: `"/orbit:explore <name> — N decisions captured but M open questions remain; resolve open questions before formalizing"` (N = `decisions_captured`, M = `open_questions_count`). NOTE: this state does NOT surface `/orbit:propose` as an alternative because high open-question count signals NOT-ready regardless of decision count; the user is directed back to exploration to close out the open questions first.
- **Unaccounted (4+ decisions captured AND ≤1 open question AND `rules_open` non-empty)**: `"/orbit:explore <name> — K of R live rules have open domains (<IDs>); account for them before formalizing"`, (K = `rules_open`'s LENGTH — that array holds open live rules and nothing else — and R = `rules_total`, both defined once in `orbit-emit-composition`'s computed-extensions requirement; this rung consumes them). Noun and verb agree with their count (`1 of 4 live rules has an open domain`; `2 of 4 live rules have open domains`). `/orbit:propose` is NOT surfaced: a rule whose domain is open silently is the condition the Mechanism section exists to forbid (`orbit-conventions`' accounted-closure requirement), and this is the ONE cell where the accounting changes the verb.
- **Accounted (4+ decisions captured AND ≤1 open question AND `rules_open` = 0)**: `"/orbit:propose <name> — R live rules accounted, B bounded residuals named (<IDs>); formalize when you are ready (or /orbit:explore <name> to keep refining)"` (B = the count of accounted BOUNDED entries; the ENTIRE `, B bounded residual(s) named (<IDs>)` clause is omitted when B = 0, so the string reads `R live rules accounted; formalize when you are ready …`; noun and verb agree with the count — `1 live rule accounted`, `1 bounded residual named`). The top rung REPORTS — live-rule count, zero open, the named residuals — and does not vouch: eligibility phrasing, never an assertion of readiness. A complete BOUNDED entry is ACCOUNTED and never withholds this rung; its residual is NAMED beside it (`orbit-conventions`: the tier difference is visibility, never blocking).

The open-rule list renders as a RECORD beside the rungs whose own text does NOT name the open rules — Early, Mid, Stalled, and Concluded — when `rules_open` is non-empty, appended as ` · open domains: <IDs>`, so an open domain is visible at every rung and changes the recommendation only at the Unaccounted/Accounted seam; the Unaccounted rung names the same IDs inline and carries NO record suffix (its inline list IS the record), and Accounted has none to name. KEY DEFECTS (`key_defects`, per `orbit-emit-composition`: orphan Mechanism entries and duplicate Decisions IDs) NEVER change the verb and never enter K; when the array is non-empty EVERY rung — the Concluded rung included — appends the clause `; N key defect(s) (<IDs>)` (noun agreeing with N) after its text and before any open-domains record, so a key defect is always visible and never mistaken for an open domain. Wherever `<IDs>` appears — the open-domains list, the key-defects clause, and the Accounted rung's residual list alike — the render is BOUNDED: at most THREE identifiers in the source array's stated order, then ` +N more` when more remain; the emit's arrays carry the full lists (per `orbit-emit-composition`). ONE identifier rule: an entry with both an `id` and a `line` renders `<id> at line <n>`; an entry with an `id` alone renders `<id>`; an entry with no `id` renders `line <n>`. The Early, Mid and Stalled strings are byte-identical PREFIXES of their pre-capability forms — the record suffix, when present, is appended AFTER the unchanged string — so readers matching them are unaffected; the Accounted string keeps the leading `/orbit:propose <name>` token the retired Mature string carried.

In each `exploring` rung the leading `/orbit:<verb> <name>` token is the recommendation; a downstream status reader MAY parse it best-effort, and a prose value (the Concluded rung) is preserved whole — the spine's own contract (`orbit-conventions`: "verbatim recommendation, suitable for best-effort parse"; this capability's shape requirement: extracted "if present"). No reader is required to parse it, and none in the engine does: `orbit-orientation` renders the recorded string verbatim.

#### Scenario: 1-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 1` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains "continue capturing thinking"

#### Scenario: 5 decisions, 0 open questions, one rule open — Unaccounted (the cell the retired Mature rung occupied)
- **WHEN** named-mode explore emits with `decisions_captured: 5`, `open_questions_count: 0`, and `rules_open` naming one live rule (`D-x-3`, its Mechanism entry absent)
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"`, reads "1 of 4 live rules has an open domain (D-x-3)", carries NO ` · open domains:` suffix (the inline list is the record), and does NOT surface `/orbit:propose`

#### Scenario: A key defect is reported beside the rung, never counted in K
- **WHEN** named-mode explore emits with `rules_total: 4`, two live rules open (`D-x-3`, `D-x-4`) and one orphan Mechanism entry `D-x-9` at line 88
- **THEN** `next_recommended` reads "2 of 4 live rules have open domains (D-x-3, D-x-4); account for them before formalizing; 1 key defect (D-x-9 at line 88)" — the orphan is absent from K and from the open-domains list

#### Scenario: A key defect alone does not change the verb
- **WHEN** named-mode explore emits with `decisions_captured: 5`, `open_questions_count: 0`, `rules_open: []`, `rules_total: 4`, `residuals: []` and one duplicate-ID defect `D-x-2` at line 61
- **THEN** `next_recommended` begins with `"/orbit:propose <name>"`, reads "4 live rules accounted; formalize when you are ready (or /orbit:explore <name> to keep refining); 1 key defect (D-x-2 at line 61)" — Accounted, with the defect visible

#### Scenario: A malformed entry on a live rule is an open domain
- **WHEN** named-mode explore emits with `rules_total: 3` and one live rule `D-x-1` whose entry's `Domain:` table has no member rows (line 40)
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and reads "1 of 3 live rules has an open domain (D-x-1 at line 40)"

#### Scenario: 5 decisions, 0 open questions, every rule accounted — the top rung reports
- **WHEN** named-mode explore emits with `decisions_captured: 5`, `open_questions_count: 0`, `rules_total: 4`, `rules_open: []`, and one accounted BOUNDED entry `D-x-4`
- **THEN** `next_recommended` begins with `"/orbit:propose <name>"`, reads "4 live rules accounted, 1 bounded residual named (D-x-4)" (a fifth residual would render `+2 more` after three IDs), carries "formalize when you are ready", and surfaces `/orbit:explore` as the alternative in the reason

#### Scenario: 0-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 0`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains language acknowledging that thinking is just beginning (e.g., "continue capturing thinking — no decisions captured yet")

#### Scenario: Stalled — 5 decisions captured but 3 open questions remain (the 4+ decisions threshold met, the open-question check fails)
- **WHEN** named-mode explore emits with `decisions_captured: 5` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` (NOT `/orbit:propose`); the text references both counts (e.g., "5 decisions captured but 3 open questions remain; resolve open questions before formalizing"); `/orbit:propose` is NOT surfaced as an alternative

#### Scenario: Concluded header collapses every count
- **WHEN** the staging `explore.md`'s first non-blank line is `> **Status**: concluded 2026-09-25.`, its live CONCLUDED entry carries `Re-entry: a third withdrawn stage`, and both `rules_open` and `key_defects` are empty, whatever the decision and question counts
- **THEN** `next_recommended` is exactly `"Concluded 2026-09-25. Reopens when: a third withdrawn stage."` — no `/orbit:` token anywhere in it

#### Scenario: Concluded with open domains carries the record after the prose
- **WHEN** the same file has two live rules open
- **THEN** `next_recommended` is exactly `"Concluded 2026-09-25. Reopens when: a third withdrawn stage. · open domains: D-x-1, D-x-2"` — the conclusion first, the record after, still no `/orbit:` token

#### Scenario: Open-rule list is bounded in prose and total in the field
- **WHEN** an Unaccounted rung has five open rules in file order `D-x-1` … `D-x-4` then an ID-less entry at line 212
- **THEN** the recommendation text names `(D-x-1, D-x-2, D-x-3 +2 more)` — the first three in the array's order, the ID-less fifth would have rendered `line 212` — and the emit's `rules_open` field carries all five entries, the fifth as `{state: "open", line: 212}` with no `id`

#### Scenario: Open domains are visible at Mid without changing the verb
- **WHEN** named-mode explore emits with `decisions_captured: 3` and two live rules open
- **THEN** `next_recommended` begins with the Mid string unchanged and ends with ` · open domains: D-x-1, D-x-2`
