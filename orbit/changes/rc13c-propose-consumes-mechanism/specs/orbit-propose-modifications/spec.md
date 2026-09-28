## ADDED Requirements

### Requirement: Mechanism section consumption

In consume mode the system SHALL carry `explore.md`'s Mechanism section into the generated artifacts by the decision table below, reading the section from the FILE — the entry set under `## Mechanism`, each entry's `Closure:` token, and a BOUNDED entry's `Residual kind:` and `Residual method:` lines VERBATIM — as it reads Decisions: by the grammar `orbit-conventions`' Mechanism-entry requirement owns, which this requirement points at and does not restate. Propose fires NO emit of its own before its one-shot completion emit (per `orbit-run-summary-emit`'s one-shot rule, which this requirement leaves untouched) and reads NO prior emit as a cross-check: git preserves neither file's modification time, so no observable a workflow body has can establish that a trail record was written against the file's current bytes. The proposing AI's reading of the file is the SOLE source of the record, and the record's header says so. The engine's form parse (the readout's `rules_open` / `key_defects` / `residuals`, `orbit-emit-composition`'s fields) remains the reviewer's cross-check after the fact; a read-only print of it for a staging name is the follow-on this requirement names and does not build. Propose consumes FORM, as the readout renders form: whether an enumeration is TRUE, a residual honest, or a rule written down at all remains the reviewer's judgement.

**The decision table** — a PARTITION of the entries and live rules propose meets, over two facts: the owning Decisions entry's live-rule status (per `orbit-conventions`' entry-identity requirement: `Kind:` rule or absent AND `Disposition:` live or absent) and the rule's accounting state as the readout's parser judges it (`orbit-emit-composition`'s `rules_open` and `key_defects` fields — pointed at, never re-listed here). A live rule is ACCOUNTED exactly when it is COUNTED in `rules_total` AND NOT in `rules_open` — a duplicate-ID second entry is counted in neither and is a key defect (row 1), so it never reaches a carrier row; the `Closure:` token an entry carries is consulted ONLY on an accounted entry, because an entry can carry a token and still be open (a BOUNDED entry missing a slot; a SOURCED entry with a bad table). Rows are tested IN ORDER and the first match wins:

| row | owner's Decisions state | accounting state | lands in |
|---|---|---|---|
| 1 | any — tested FIRST | in `key_defects` (an orphan entry with no owner; a second entry under an already-used ID) | reported in chat at the structure check; no carrier — a key with no owner has nowhere to land, and a duplicate is excluded from `rules_total` |
| 2 | NOT a live rule (`Kind: fact` / `scope`, or `Disposition: superseded` / `assigned`) | any — an entry or none, well-formed or not | nowhere — permitted history; `explore.md` travels unchanged; the record lists it as not carried with NO state word (the engine assigns none to a non-live owner) |
| 3 | live rule | in `rules_open` (any state that field defines, whatever `Closure:` token the entry carries) | UNACCOUNTED: ONE `design.md` Risks entry naming the rule as the readout names it — the ID, or `line N` for an ID-less entry, per `orbit-run-summary-emit`'s identifier rule — with the engine's state word; the spec delta carries nothing for it; never blocking |
| 4 | live rule | accounted, `Closure: DERIVED` or `SOURCED` | the spec delta requirement the rule derives: the domain table as one of the CLOSED shapes below, the `Closure:` justification as the sentence naming the source |
| 5 | live rule | accounted, `Closure: BOUNDED` (both residual slots present, by construction) | `Residual kind:` and `Residual method:` VERBATIM in that requirement's text as a named limit (the OWNER — only spec text survives archive); ONE `design.md` Risks entry naming the rule ID and POINTING at the requirement, restating nothing |

**The CLOSED shapes.** A CLOSED domain table lands in requirement text as one of four shapes, each observed on the record: a normative TABLE (the re-entry table in `orbit-explore-modifications`), a GRAMMAR or production block (the Mechanism grammar's fences in `orbit-conventions`), a SCENARIO SET — one scenario per member (the maturity rungs in `orbit-run-summary-emit`), or a SENTENCE naming the source with the members in prose (the concluded outcome's reader sentence in `orbit-conventions`). Which shape fits is the author's judgement; the record says which was chosen. This set is BOUNDED, and its named limit is stated here, once:

- Residual kind: a destination shape for a CLOSED domain table that none of the four names
- Residual method: classify the spec deltas of the next archived change that consumed a Mechanism section (this stage's own is the first through the mapping) against the four; a delta whose domain landed in none is a fifth row and a revision of this table

**The record.** The generated `design.md` SHALL carry a `## Mechanism → artifacts` section: one table row per Mechanism entry (and per live rule with none) — the rule as the readout names it (ID, or `line N`), its closure token or the engine's state word, its owner's state, and its destination named as a requirement title (and the shape, for CLOSED entries) — plus a header line stating the source: "the proposing AI's reading of the file; no engine record" — always that sentence, because no engine record is consulted at propose. Before the staging directory is moved, the body verifies by grep that every BOUNDED entry the table sent to row 5 (a live, accounted rule — never a history row) has its two residual lines in a delta spec under `specs/`; a miss is reported and fixed before the move.

#### Scenario: A BOUNDED entry's residual travels to spec text with a design pointer

- **WHEN** a live rule's Mechanism entry is `Closure: BOUNDED` with both residual slots, and propose generates the artifacts
- **THEN** the two slot lines appear verbatim in the owning requirement's text in the delta spec, `design.md`'s Risks carries one entry naming the rule ID and pointing at that requirement, and the record's row for the entry names both carriers

#### Scenario: A CLOSED entry informs the requirement it derives

- **WHEN** a live rule's Mechanism entry is `Closure: DERIVED` or `Closure: SOURCED`
- **THEN** the record names the requirement the domain table landed in and which of the four shapes it took; the `Closure:` justification is the requirement's sourcing sentence

#### Scenario: A non-live owner is history

- **WHEN** a Mechanism entry's owning Decisions entry carries `Kind: fact`, `Kind: scope`, `Disposition: superseded <ID>` or `Disposition: assigned <stage>`
- **THEN** nothing is generated from it; the record lists it as not carried; `explore.md` is unchanged

#### Scenario: An unaccounted live rule is recorded, never blocking

- **WHEN** a live rule is in `rules_open` (any state), whatever `Closure:` token its entry carries
- **THEN** row 3 applies: `design.md`'s Risks carries one entry naming the rule as the readout would (ID, or `line N`) and the state word, the record lists it as UNACCOUNTED, no spec text is generated for it, and generation proceeds

#### Scenario: A BOUNDED entry missing a slot is unaccounted, not a residual

- **WHEN** a live rule's entry reads `Closure: BOUNDED` and carries `Residual kind:` but no `Residual method:`
- **THEN** the rule is `bounded-incomplete` in `rules_open`, row 3 applies and row 5 does not: nothing is copied into spec text, and the record names the rule UNACCOUNTED with that state word

#### Scenario: A malformed entry on a non-live owner is history

- **WHEN** a Decisions entry carries `Kind: fact` and its Mechanism entry has a `Domain:` table with no member rows
- **THEN** row 2 applies: nothing is generated, the record lists it as not carried with no state word, and no Risks entry is written

#### Scenario: A duplicate-ID entry is a key defect before it is anything else

- **WHEN** two Decisions entries carry the same ID and the second is a live rule with a well-formed, accounted-looking Mechanism entry
- **THEN** row 1 applies to the second entry (it is in `key_defects` and excluded from `rules_total`): it is reported and nothing is carried from it; the first entry is judged by rows 2–5 on its own state

#### Scenario: No prior emit is read as a cross-check

- **WHEN** the staging `.orbit-runs/` holds one or more explore emits when propose runs in consume mode
- **THEN** propose reads none of them as a source for the record and fires none; the record's header line reads "the proposing AI's reading of the file; no engine record"

## MODIFIED Requirements

### Requirement: Consume mode when staging directory exists

The system SHALL detect the presence of `orbit/explore/<name>/explore.md` and switch to consume mode — UNLESS the file's first non-blank line carries the `concluded` token (per `orbit-conventions`' status-header production), in which case mode detection REFUSES: the command halts stating the conclusion date and the recorded re-entry trigger ("this exploration concluded on <YYYY-MM-DD>. Re-entry: <the live CONCLUDED entry's `Re-entry:` slot, verbatim — per `orbit-conventions`' entry-identity requirement's live-carrier rule; first in file order when two entries carry one, as the readout resolves it; `(no Re-entry: slot found)` when none>") and stops — no prompt, nothing written, nothing moved. Stating the trigger is not offering a reopen: it is the conclusion's own recorded sentence, read from the same file; the explore-side behaviour propose agrees with is `orbit-explore-modifications`' `Re-entry resolution and the conclude verb` requirement, pointed at and not restated. PRECEDENCE within Step 0, in this order, first match wins: (1) both `orbit/explore/<name>/` and `orbit/changes/<name>/` exist → the conflict prompt of the next scenario fires (this requirement's no-prompt promise applies only past it; after "Regenerate from explore" the concluded check runs next and refuses a concluded file; the other two choices keep their existing meaning); (2) the staging file's header is `concluded` → REFUSED as above; (3) otherwise → consume mode. Consume mode is entered ONLY for a non-concluded file with no unresolved conflict. The refuse is a Step 0 outcome, resolved BEFORE the PR layer's phase 1 (select + switch) — which runs between mode detection and the structure check — so a refused promotion never cuts a branch. Propose neither reopens the exploration nor offers to: the reopen edit has one owner (`orbit-conventions`' concluded-outcome requirement) and one executor (the explore body, per `orbit-explore-modifications`' re-entry requirement), and this requirement points at both without restating them. A staging directory with no `explore.md`, or whose header is neither fixed token, is not concluded and resolves as today. A `concluded` header inside `orbit/changes/<name>/explore.md` (a name promoted before this requirement existed) is not a propose input at all — consume mode reads the STAGING file only; the explore body's re-entry requirement owns that row.

#### Scenario: Consume mode activated

- **WHEN** the user invokes `/orbit:propose <name>`, `orbit/explore/<name>/explore.md` exists, its first non-blank line is not the `concluded` token, and `orbit/changes/<name>/` does not exist
- **THEN** the command reads `explore.md` as the authoritative seed for artifact generation rather than asking for a description

#### Scenario: A concluded staging directory is refused before any branch is cut

- **WHEN** the user invokes `/orbit:propose <name>`, `orbit/changes/<name>/` does not exist, and `orbit/explore/<name>/explore.md`'s first non-blank line is `> **Status**: concluded 2026-09-25.` with its live CONCLUDED entry carrying `Re-entry: a third withdrawn stage`
- **THEN** mode detection halts with "this exploration concluded on 2026-09-25. Re-entry: a third withdrawn stage" and stops; no `AskUserQuestion`, no change directory, no metadata, no move, and no branch switch (the PR layer's phase 1 is never reached); the reopen path is not offered

#### Scenario: A concluded staging directory beside an active change

- **WHEN** both `orbit/explore/<name>/` (header `concluded`) and `orbit/changes/<name>/` exist
- **THEN** the conflict prompt fires FIRST (precedence 1); choosing "Regenerate from explore" then reaches the concluded check and is REFUSED with the same halt; "Continue from change" and "Abort" behave as the conflict scenario states

#### Scenario: A header that is neither token is not concluded

- **WHEN** the staging `explore.md`'s first non-blank line matches neither `exploring.` nor `concluded <date>.`
- **THEN** the command proceeds in consume mode exactly as before this requirement was modified

#### Scenario: Conflict — both dirs exist

- **WHEN** both `orbit/explore/<name>/` and `orbit/changes/<name>/` exist at invocation
- **THEN** the command halts with a conflict report and asks the user to choose: regenerate from explore (overwrite change), continue from change (discard explore staging), or abort

### Requirement: Section-to-artifact mapping

The system SHALL map `explore.md` sections to the generated artifacts as follows. Additionally
(D-arc Stage D5), the generated `design.md` SHALL carry a `## Touchpoints` section — the
PREDICTED map of where the work lands in the codebase (files/modules to be created or
modified), seeded in consume mode from leanings and references captured in `explore.md` and
authored fresh in standalone mode. The predicted map is revised only through normal artifact
revision (the proposal review cadence bounds its staleness like any design claim) and is
FROZEN once apply begins — from the first apply commit onward it reads as "the plan", while
the ACTUAL map is engine-computed from the diff (per `orbit-orientation`'s boot render and
`orbit-run-summary-emit`'s `files_touched`); prose never tracks what git knows, and
predicted-vs-actual divergence is a computed check (per `orbit-audit-drift`), not a
maintenance chore.

**Touchpoints ENTRY GRAMMAR** (the closed form the computed checks parse — authored here, one
voice; `orbit-audit-drift`'s matching semantics reference this grammar, never redefine it):
each entry is a markdown list item whose LEADING inline-code span(s) name the predicted
targets — one span, or several `+`-joined spans recording grouped alternatives; everything
after the spans (the ` — annotation` tail, parentheticals like "(or the existing config
loader)") is prose the checks never parse. Each target is one of exactly three forms: (a) an
exact repo-relative file path; (b) a DIRECTORY PREFIX, written with a trailing `/`; (c) a
GLOB containing `*` (single-segment wildcard, fnmatch semantics). An actual path MATCHES a
target when it equals the exact path, sits under the directory prefix, or fnmatch-matches
the glob; a grouped entry is satisfied when ANY of its targets matched. Every form is
REPO-RELATIVE: an absolute path, a parent-resolving `..` segment, a backslash separator, or a
`./`-prefixed spelling is malformed — such a target could never match a repo-relative actual
path, so accepting it would create a prediction the arithmetic silently never satisfies. A
list item whose leading spans parse as none of the three forms (or carry a non-repo-relative
target) is a malformed entry — surfaced by the
divergence check as a SUGGESTION naming the line, and excluded from set arithmetic (never a
false drift source).

#### Scenario: Mechanism → the consumption requirement's table

- **WHEN** `explore.md` has a `## Mechanism` section
- **THEN** each entry is carried per the `Mechanism section consumption` requirement's decision table (closure token × owner state), and `design.md` carries the `Mechanism → artifacts` record that requirement specifies; this mapping names that requirement and does not restate its rows

#### Scenario: Grammar covers the canonical map's forms

- **WHEN** the divergence check parses a Touchpoints section containing `src/cli/index.ts` (exact), `src/commands/` (prefix), `src/core/templates/workflows/*.ts` (glob), and `src/core/orientation.ts` + `src/core/artifact-graph/gates.ts` (grouped alternatives)
- **THEN** every entry parses; an actual path under `src/commands/` or matching the glob counts as predicted, and the grouped entry is satisfied by either of its two paths

#### Scenario: Premise → proposal motivation

- **WHEN** `explore.md` has a Premise section
- **THEN** the content is used to seed `proposal.md`'s "Why" / motivation section

#### Scenario: Decisions → spec deltas + design + tasks

- **WHEN** `explore.md` has Decisions
- **THEN** the decisions inform spec requirements, design.md decisions, and tasks; specific wording from the Decisions is preserved where artifact format permits

#### Scenario: Considered & out → design alternatives

- **WHEN** `explore.md` has Considered & out entries
- **THEN** they are surfaced in `design.md`'s "Alternatives considered" or equivalent section to prevent rediscovery

#### Scenario: References → contextual reads

- **WHEN** `explore.md` lists References
- **THEN** those files/URLs are read during artifact generation as context (not copied verbatim)

#### Scenario: Touchpoints authored at propose

- **WHEN** artifacts are generated (consume or standalone mode)
- **THEN** `design.md` includes a `## Touchpoints` section with the predicted file/module map — seeded from the exploration's leanings in consume mode — and the section is never hand-updated after apply's first commit (the actual map is the engine's to compute)

### Requirement: Validate explore.md structure before consuming

The system SHALL check the basic structure of `explore.md` — the sections `orbit-conventions`' `explore.md five-section format` requirement lists, in its order (that requirement OWNS the list and its count; this requirement states neither) — and warn (but not block) on issues. The generated body carries the list as a CHECKED MIRROR of that requirement (R-crc-14's mirror corollary: an adopter's body cannot resolve this repository's spec at runtime), held byte-equal to the owner's stated order by a parity test. The Mechanism section is one of the listed sections: its absence warns like any other and, because every live rule is then without an entry, the design's record lists each as UNACCOUNTED (per `Mechanism section consumption`) — a format note with a visible consequence, never a block.

#### Scenario: All listed sections present

- **WHEN** `explore.md` has every section the owning format requirement lists
- **THEN** the command proceeds normally

#### Scenario: Mechanism section absent

- **WHEN** `explore.md` was written before the six-section format and has no `## Mechanism` section
- **THEN** the command warns naming the missing section, prompts proceed-anyway (default proceed), and — on proceed — the design's `Mechanism → artifacts` record lists every live rule as UNACCOUNTED with state `absent`

#### Scenario: Missing section warning

- **WHEN** `explore.md` is missing one or more expected sections
- **THEN** the command warns about the missing sections and prompts the user to confirm proceed-anyway (default proceed)

#### Scenario: Malformed file

- **WHEN** `explore.md` cannot be read or parsed
- **THEN** the command halts with a clear error and exit; user fixes and re-invokes

### Requirement: Open question handling

The system SHALL prompt the user per Open question in `explore.md` with three resolution paths: resolve now, defer as `@review:` marker, or abandon.

#### Scenario: Resolve now

- **WHEN** the user resolves an Open question during the prompt
- **THEN** the question's resolution becomes a Decision and informs the generated artifacts; the Open question is moved to Decisions in the persisted `explore.md` as a CONFORMING entry per `orbit-conventions`' `Decision entry identity and classification` requirement — the dated ID opener, `Kind:` per the answer's normative force, `Disposition: live` — never a bare bullet (an entry without the opener has no ID and parses as an open rule nobody can name)

#### Scenario: Resolve now, and the answer is a rule

- **WHEN** a resolve-now answer PRESCRIBES how something must be done across a set of situations (a rule under the entry-identity requirement's test)
- **THEN** the entry is written with `Kind: rule` and NO Mechanism entry is authored at propose; the prompt tells the user the rule will stand as an open domain, and the design's `Mechanism → artifacts` record lists it as UNACCOUNTED with state `absent`

#### Scenario: Defer

- **WHEN** the user defers an Open question
- **THEN** a `@review: <question text>` marker is inserted at the most relevant location in the generated artifacts (typically design.md or the relevant spec); the Open question is moved to a "Deferred to markers" note or remains in Open questions with a "deferred" tag

#### Scenario: Abandon

- **WHEN** the user abandons an Open question (decides it doesn't apply to this change)
- **THEN** the question is moved to Considered & out with a brief rationale; no marker is created

#### Scenario: Default for unprompted bulk

- **WHEN** many Open questions exist and the user chooses "defer all"
- **THEN** all open questions become `@review:` markers in the generated artifacts

### Requirement: Naming inference fallback

The system SHALL attempt to infer the change name when invoked without one.

#### Scenario: Recent explore activity

- **WHEN** `/orbit:propose` is invoked with no name and exactly one LIVE `orbit/explore/<name>/` directory exists — a directory whose `explore.md` header carries the `concluded` token is NOT a candidate (per `Consume mode when staging directory exists`)
- **THEN** the command proposes that name to the user; on accept, proceeds in consume mode

#### Scenario: A concluded directory is never inferred

- **WHEN** `/orbit:propose` is invoked with no name, one staging directory is live and one is concluded
- **THEN** the command proposes the live name without a pick prompt; the concluded directory is not mentioned

#### Scenario: Multiple or no candidates

- **WHEN** zero or multiple LIVE staging directories exist
- **THEN** the command prompts via `AskUserQuestion` to specify a name (zero candidates) or pick among them (multiple)
