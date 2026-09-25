## MODIFIED Requirements

### Requirement: Per-command computed extensions

The surface SHALL compute the per-command extension fields that are functions of on-disk
state: for `explore` emits — `decisions_captured`, `open_questions_count`, and
`open_questions_with_recommendation` ("n of m") parsed fence-aware from the staging
`explore.md`. The counter grammar: each counter counts TOP-LEVEL list items directly under
the `## Decisions` / `## Open questions` heading (nested bullets, paragraphs, and fenced
content are never entries); a heading absent entirely yields count 0 for that section (`"0 of
0"` for the attestation) plus a single stderr note naming the missing section — the
`explore.md` format (per `orbit-conventions`' format requirement) makes absence a format
violation to surface, never an emit blocker. The
attestation's MEMBERSHIP criterion: an entry counts toward `n` when its content carries a
`Standing recommendation:` line whose value is NOT the literal `none yet` — the attestation
measures RECORDED LEANINGS (the leak-hardening intent), so `none yet` entries and slot-less
entries both fall outside `n`; slot-less entries are audit-drift's format finding, never the
counter's concern.

Also for `explore` emits — FIVE fields computed by the FORM parse of the same file, through the
productions `orbit-conventions` owns (the status header, the Decision entry, the Mechanism entry —
imported from the grammar module per the single-source requirement below, never restated) and
through the engine's ONE CommonMark fence grammar (`createFenceTracker` in `src/core/markdown-fence.ts`,
which the counter also adopts — a local fence scanner is the defect class Q-crc-15 records):
`rules_total` (integer — the LIVE rules, as `orbit-conventions`' Decision-entry requirement defines
membership in the accounting obligation; a live rule is counted whether or not its ID is well-formed),
`rules_open` (an array holding LIVE RULES ONLY — one entry per live rule whose domain is not
ACCOUNTED, `{id?, state, line?}`, `state` exactly one of five DISJOINT values, tested in this order:
`open` (a Decisions entry whose ID is not well-formed per `orbit-conventions`' Decision-entry
requirement — it can be keyed to no Mechanism entry, so its domain is open by construction; `line`
present, `id` absent), `absent` (no Mechanism entry keyed by its ID), `bounded-incomplete` (a BOUNDED
entry missing `Residual kind:` or `Residual method:` — this state takes PRECEDENCE over the grammar's
MALFORMED classification of the same defect, because the more specific name is the actionable one),
`no-closure` (an entry without a `Closure:` line), or `malformed-entry` (any OTHER failure in the
Mechanism grammar's MALFORMED list on that rule's own entry — a bad or empty `Domain:` table, a
missing or duplicated move line, an unknown `Closure:` token, a residual slot on a non-BOUNDED entry —
`line` naming the failing line); the array is ORDERED by the Decisions entries' file order, and its
LENGTH is the maturity rung's K — an open live rule is exactly one entry here and nothing else is),
`key_defects` (an array of defects that are NOT rules with open domains but defects in the KEY space
itself: `{id, kind, line}` — `id` always present, since every kind names a key — with `kind` one of
`orphan` (a Mechanism entry whose ID matches no Decisions entry — `id` the heading's ID, `line` its
line) or `duplicate` (a key claimed twice on EITHER side: a Decisions entry whose ID repeats an earlier
one — the FIRST occurrence in file order owns the key and joins its Mechanism entry; the second is this
defect, `id` the repeated ID, `line` its line, EXCLUDED from `rules_total` — or a second Mechanism
heading carrying an ID an earlier heading already used — the FIRST heading in file order is the
rule's own entry and is judged normally; the second is this defect, `line` its heading's line, and it
is never judged as the rule's entry); ordered
by line; never a member of `rules_open`, never counted in K, reported in its own clause beside every
rung), `residuals` (an array `{id, kind, method}`, one per ACCOUNTED BOUNDED entry, in the Decisions
entries' file order — the residual named beside the rung), and `status` (`{token, date?, re_entry?}`
— `token` is `exploring` or `concluded` per the status-header production and its neither-token rule;
`date` present iff concluded; `re_entry` present iff concluded AND exactly one live entry carries a
`Re-entry:` slot, carrying that slot's text — when NO live entry carries one the field is ABSENT and
the rendered prose alone carries the fallback; when MORE than one live entry carries one the FIRST in
file order wins and a stderr note names the second, per `orbit-conventions`' exactly-one-live-slot
rule). The two arrays are DISJOINT by construction: a key defect is never a rule and a rule's own
entry defect is never a key defect, so no file state reaches two clauses of the rung through one entry.

**What the parse adds beyond the owned productions** (stated here once; the Mechanism-side states
are `orbit-conventions`' and the ID well-formedness rule — a first-line prefix match — is
`orbit-conventions`' Decision-entry requirement's, both pointed at, not restated): a `Kind:` or
`Disposition:` line whose value is outside its production does not match, so the slot is ABSENT and
the demanding default applies (a typo cannot escape the obligation). The parse judges FORM ONLY — the
FORM-only clause of `orbit-conventions`' Mechanism-grammar requirement governs what it may and may not
claim — and the form parse SHALL NOT claim more: a file whose every decision is `Kind: fact` yields
`rules_total: 0` and `rules_open: []`, truthfully; a rule never written down is invisible to it. A
missing `## Mechanism` section makes every live rule `absent` and adds ONE stderr note naming the
section, like the counter's; a missing FILE yields `rules_total: 0`, `rules_open: []`,
`key_defects: []`, `residuals: []`, `status: {token: "exploring"}` and the counter's existing
missing-section notes (no additional Mechanism note). Fenced content is never structure — including a
four-backtick fence enclosing a three-backtick example, and a fence indented beyond CommonMark's
three-space limit, both of which the shared tracker resolves and a local scanner did not. A defect of
either array NEVER blocks the emit: the fields record it and the rung reports it.

Also computed: the maturity-grid `next_recommended` (Concluded / Early / Mid / Stalled /
Unaccounted / Accounted per `orbit-run-summary-emit`'s maturity requirement — the grid is engine
data; the header token is read FIRST; K is `rules_open`'s length and key defects render in their own
clause); for `apply` emits —
`tasks_completed`/`tasks_remaining` from checkbox arithmetic, `user_validation_remaining` and
the per-chunk user-validation subset from the payload's `user_validation_tasks` identifier
list (the payload's ONE checkbox judgment — which tasks are user-validation; each named task
is validated to exist and be unchecked, a bad entry rejected naming it; the count itself is
engine-owned and rejected when payload-supplied), `chunk`/`chunk_name`/
`chunk_complete` from the tasks.md chunk-preamble grammar (parsed by the engine —
`chunk_complete` = the current chunk's unchecked tasks minus its user-validation subset, the
whole task set standing in as the "current chunk" when `chunk` is null, per
`orbit-run-summary-emit`'s field semantics; a malformed
preamble degrades per `orbit-run-summary-emit`'s tolerant-on-read rule with the documented
stderr warning), and `files_touched` — the file paths changed since the previous apply
emit's BOUNDARY, engine-computed as `git diff --name-only <base>` against the WORKING TREE:
committed and uncommitted tracked changes both count (the emit is a boundary snapshot, and
sessions routinely reach the boundary before the chunk's commit lands — a committed-only
list would under-report at exactly the moment the field fires; brand-new untracked files
stay invisible until staged, a stated git-visibility limitation). The BOUNDARY is exact,
never timestamp-inferred: at every apply emit the engine captures the tracked working state
as a git TREE OBJECT (`git write-tree` against a temporary index — the `git stash create`
mechanism) and records its OID as the emit's engine-computed `diff_base` field; the next
emit's `<base>` IS the previous emit's recorded `diff_base` tree, so the list is per-chunk
exact under EVERY commit ordering — late-committed prior-chunk work cannot reappear in the
next chunk's list. The FIRST apply emit — and any emit whose predecessor carries no
`diff_base` (pre-capability) or whose recorded tree object is no longer present (gc pruned;
the snapshot is content-addressed and deliberately unreferenced) — falls back to the
change's first commit as its base; `null` only outside a git repository or when no base
resolves at all, never a hand-listed approximation. (The boot render's ACTUAL touchpoints map remains committed-only
`<change-start>..HEAD` per `orbit-orientation` — a durable-truth view computed fresh per
invocation; the two diffs are deliberately different.) Payload attempts to supply any computed
extension are rejected as engine-owned fields.

#### Scenario: Explore counts computed from the file

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` with 4 decisions and 2 open questions — one carrying a real leaning, one reading `Standing recommendation: none yet`
- **THEN** the emit carries `decisions_captured: 4`, `open_questions_count: 2`, `open_questions_with_recommendation: "1 of 2"` (the `none yet` entry falls outside `n`), and the Stalled-state recommendation — none supplied by the payload

#### Scenario: Missing section heading counts zero with a format note

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` that lacks a `## Open questions` heading
- **THEN** the emit still writes, carrying `open_questions_count: 0` and `open_questions_with_recommendation: "0 of 0"`, and a single stderr note names the missing section

#### Scenario: Rule fields computed from the form parse

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` with six Decisions entries — four `Kind: rule` (one with a SOURCED entry, one with a complete BOUNDED entry, one with a BOUNDED entry missing `Residual method:`, one with no entry), one `Kind: fact`, one `Kind: scope` — and one Mechanism entry `D-foo-9` matching no Decisions entry
- **THEN** the emit carries `rules_total: 4`, `rules_open` with two entries in file order (`{id: "D-foo-3", state: "bounded-incomplete"}`, `{id: "D-foo-4", state: "absent"}`), `key_defects` with one entry (`{id: "D-foo-9", kind: "orphan", line: <its heading's line>}`), `residuals` with one entry naming the complete BOUNDED entry's kind and method, `status: {token: "exploring"}`, and the Unaccounted recommendation reading "2 of 4 live rules have open domains (D-foo-3, D-foo-4); 1 key defect (D-foo-9 at line <n>)" — none supplied by the payload

#### Scenario: A malformed entry on a unique live rule is an open live rule

- **WHEN** a file's only defect is a live rule `D-foo-2` whose Mechanism entry has a `Domain:` table with no member rows
- **THEN** `rules_open` is `[{id: "D-foo-2", state: "malformed-entry", line: <the table's first line>}]`, `key_defects` is `[]`, and the rung reads "1 of R live rules has an open domain (D-foo-2 at line <n>)" — the rule counts in K, because its domain is not accounted

#### Scenario: An orphan alone is a key defect, not an open rule

- **WHEN** a file's only defect is a Mechanism entry `D-foo-9` matching no Decisions entry, every live rule accounted
- **THEN** `rules_open` is `[]`, `key_defects` is `[{id: "D-foo-9", kind: "orphan", line: <n>}]`, and the rung is Accounted with the clause "; 1 key defect (D-foo-9 at line <n>)" appended — the verb does not change on a key defect

#### Scenario: A duplicate ID alone is a key defect

- **WHEN** a file's only defect is two Decisions entries opening with `D-foo-2`, the first's Mechanism entry accounted
- **THEN** `rules_total` counts the first only, `rules_open` is `[]`, `key_defects` is `[{id: "D-foo-2", kind: "duplicate", line: <the second entry's line>}]`, and the rung is Accounted with the key-defect clause

#### Scenario: A duplicate Mechanism heading is a key defect, and the first heading is the rule's entry

- **WHEN** a file's only defect is two Mechanism headings `### D-foo-5 — …`, the first well-formed and SOURCED, the second missing its `Closure:` line
- **THEN** `D-foo-5` is ACCOUNTED (judged on the first heading), `rules_open` is `[]`, and `key_defects` is `[{id: "D-foo-5", kind: "duplicate", line: <the second heading's line>}]` — the second heading is never judged as the rule's entry

#### Scenario: BOUNDED missing a slot takes the specific state

- **WHEN** a live rule's Mechanism entry reads `Closure: BOUNDED` with `Residual kind:` present and `Residual method:` absent
- **THEN** its `rules_open` entry is `{id, state: "bounded-incomplete"}` — never `malformed-entry`, though the grammar's MALFORMED list names the same defect

#### Scenario: ID-less, wrapped and unknown-Kind entries are each named, none dropped

- **WHEN** a Decisions section holds an entry whose first line is `- **Decision:** we will …` (no date, no ID), an entry whose opener `- **2026-09-25 — D-foo-7: a long title` wraps so its closing `**` falls on the second line, and an entry carrying `Kind: banana`
- **THEN** the prefix-less entry appears in `rules_open` as `{state: "open", line: <its first line>}` with no `id` and counts in `rules_total`; the wrapped entry is WELL-FORMED per `orbit-conventions` (`D-foo-7`, counted and joined like any other); and the `Kind: banana` entry is a live rule (the slot did not match, so it is absent and defaults to rule) that owes a Mechanism entry like any other

#### Scenario: A nested fence hides nothing and reveals nothing

- **WHEN** a Decisions section holds a real entry, then a four-backtick fence containing a three-backtick example that itself contains a decoy `- **2026-01-01 — D-foo-8: decoy**` line, then the fence's four-backtick closer, then a second real entry
- **THEN** the decoy is never an entry and the second real entry IS counted — the shared fence tracker closes the outer fence only on its own delimiter; an indented fence beyond three spaces is likewise not a fence

#### Scenario: Concluded with no live Re-entry slot, and with two

- **WHEN** one file's header is `concluded` and no live Decisions entry carries `Re-entry:`, and another's header is `concluded` with TWO live entries carrying it
- **THEN** the first emit's `status` is `{token: "concluded", date: "<date>"}` with `re_entry` ABSENT (the rendered prose carries the fallback); the second's `re_entry` is the first entry's text in file order and a stderr note names the second entry's line

#### Scenario: Concluded status computed from the header and the live entry

- **WHEN** the staging file's first non-blank line is `> **Status**: concluded 2026-09-25.` and its Decisions section holds one live entry carrying `Re-entry: a third withdrawn stage`
- **THEN** the emit carries `status: {token: "concluded", date: "2026-09-25", re_entry: "a third withdrawn stage"}` and the Concluded recommendation

#### Scenario: No Mechanism section is a format note, never a blocker

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` with five ID'd decisions and no `## Mechanism` heading
- **THEN** the emit writes, `rules_open` names all five as `absent`, `key_defects` is `[]`, and a single stderr note names the missing section

#### Scenario: Rule fields are engine-owned at the seam

- **WHEN** an explore payload includes `rules_open: []` (or `rules_total`, `key_defects`, `residuals`, or `status`)
- **THEN** the surface exits non-zero with the engine-owned error naming the field — the same sentence a payload `decisions_captured` draws — never the unknown-key error; no file is written

#### Scenario: Apply chunk fields computed from tasks.md

- **WHEN** `orbit emit apply --change foo` runs mid-chunk-2 of a 3-chunk tasks.md, with some chunk work committed and some still uncommitted in the working tree
- **THEN** the chunk fields and checkbox totals are engine-parsed; `files_touched` lists the paths changed since the prior apply emit's recorded `diff_base` boundary — committed and uncommitted tracked changes both included — and this emit records its own fresh `diff_base`; `null` when no base resolves

#### Scenario: First apply emit references the change's first commit

- **WHEN** the first apply emit for a change fires (no previous apply emit carrying `diff_base`) inside a git repository
- **THEN** `files_touched` is computed against the change's first commit as the base — not `null` — and the emit records its own `diff_base` tree for the next boundary

#### Scenario: Late-committed chunk work does not reappear

- **WHEN** chunk 1's emit fires with its work uncommitted (the boundary tree recorded as `diff_base`) and that work is committed only afterward
- **THEN** chunk 2's `files_touched`, diffed from chunk 1's recorded `diff_base` tree, excludes chunk 1's files unless the session touched them again — per-chunk exactness holds under every commit ordering

#### Scenario: User-validation judgment supplied as a verified task list

- **WHEN** `orbit emit apply --change foo` receives payload `user_validation_tasks: ["9.6"]` and task 9.6 exists unchecked in the final chunk
- **THEN** the engine computes `user_validation_remaining: 1` and the final chunk's `chunk_complete` from the per-chunk subset; a payload naming a checked or nonexistent task exits non-zero naming the entry, and a payload supplying `user_validation_remaining` directly is rejected as engine-owned

## ADDED Requirements

### Requirement: The explore grammar has one source in code

The three productions `orbit-conventions` owns for `explore.md` — the status header, the Decision entry (ID opener and slot lines), and the Mechanism entry (`Domain:` table, `Closure:` token, residual slots, move lines) — SHALL be carried in code by ONE module, `src/core/explore-grammar.ts`, exporting the productions as the strings the spec fences and the regular expressions that match them. Every engine extension of the grammar SHALL import that module: the form parse this capability computes, the generated-surface test's grammar assertions, and the explore body template, which interpolates the module's strings so that the rendered skill's mirrors are BYTE-IDENTICAL to the pre-module render (the skill's hash pin does not move). A parity test SHALL read the OWNING spec text's three fenced productions — resolving the owner the way the generated-surface mirror test already does: ONE active change's delta holding the block when one exists, the baseline otherwise — and assert the module's strings equal them, so the spec remains the single stated source (R-crc-14), the module is a checked extension of it rather than a second statement, and parity stays enforceable while a later change is mid-flight on a production. Matching rules the spec states in PROSE rather than in a fence (e.g. the `Closure:` token "matched from line start to the first ` — `") have no fenced text to compare and are covered instead by the parse's fixture tests over the two exemplar entries the explore body carries.

#### Scenario: Module and spec agree

- **WHEN** the parity test reads the owning text's fenced status-header, Decision-entry and Mechanism-entry productions (an active delta's block first, `orbit/specs/orbit-conventions/spec.md` otherwise)
- **THEN** each equals the corresponding string the grammar module exports; a divergence fails the test naming the production

#### Scenario: Body interpolation changes no byte

- **WHEN** the explore body template interpolates the module's production strings in place of its literal mirrors
- **THEN** the rendered `orbit-explore` skill is byte-identical to the literal render, and the skill-templates hash pin is unchanged

#### Scenario: The parse and the surface test share one regex

- **WHEN** the form parse and the generated-surface test each match a `Closure:` line
- **THEN** both use the module's exported expression; neither file restates the pattern
