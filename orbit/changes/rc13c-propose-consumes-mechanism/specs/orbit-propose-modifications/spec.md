## ADDED Requirements

### Requirement: Mechanism section consumption

In consume mode the system SHALL carry `explore.md`'s Mechanism section into the generated artifacts by the decision table below, reading the section from the FILE — the entry set under `## Mechanism`, each entry's `Closure:` token, and a BOUNDED entry's `Residual kind:` and `Residual method:` lines VERBATIM — as it reads Decisions: by the grammar `orbit-conventions`' Mechanism-entry requirement owns, which this requirement points at and does not restate. Propose fires NO emit of its own before its one-shot completion emit (per `orbit-run-summary-emit`'s one-shot rule, which this requirement leaves untouched); the engine's parse of the same file (the explore emit's `rules_open` / `key_defects` / `residuals`) is available on the staging trail's NEWEST explore emit when the exploration's last session left one, and the proposing AI reads it there as a cross-check when present — a disagreement between that record and the AI's own reading is REPORTED before generation, naming the entry and the array, and is never silently resolved in either direction; when no such emit exists, or the file has changed since it (Step 0b writes to the file), the AI's reading stands alone and the record says so. Propose consumes FORM, as the readout renders form: whether an enumeration is TRUE, a residual honest, or a rule written down at all remains the reviewer's judgement.

**The decision table** — one row per (the entry's `Closure:` token, or no usable entry) × (the owning Decisions entry's live-rule status per `orbit-conventions`' entry-identity requirement):

| Mechanism entry | owner's Decisions state | lands in |
|---|---|---|
| DERIVED or SOURCED | live rule | the spec delta requirement the rule derives: the domain table as one of the CLOSED shapes below, the `Closure:` justification as the sentence naming the source |
| BOUNDED | live rule | `Residual kind:` and `Residual method:` VERBATIM in that requirement's text as a named limit (the OWNER — only spec text survives archive); ONE `design.md` Risks entry naming the rule ID and POINTING at the requirement, restating nothing |
| any token | `Kind: fact` or `Kind: scope`, or `Disposition: superseded` / `assigned` | nowhere — permitted history; `explore.md` travels unchanged |
| no usable entry (any state `orbit-emit-composition`'s `rules_open` field defines) | live rule | ONE `design.md` Risks entry naming the rule as the readout names it — the ID, or `line N` for an ID-less entry, per `orbit-run-summary-emit`'s identifier rule — as UNACCOUNTED with the engine's state word; the spec delta carries nothing for it; never blocking |
| an orphan or duplicate entry (`key_defects`) | — | reported in chat at the structure check; no carrier — a key with no owner has nowhere to land |

**The CLOSED shapes.** A CLOSED domain table lands in requirement text as one of four shapes, each observed on the record: a normative TABLE (the re-entry table in `orbit-explore-modifications`), a GRAMMAR or production block (the Mechanism grammar's fences in `orbit-conventions`), a SCENARIO SET — one scenario per member (the maturity rungs in `orbit-run-summary-emit`), or a SENTENCE naming the source with the members in prose (the concluded outcome's reader sentence in `orbit-conventions`). Which shape fits is the author's judgement; the record says which was chosen. This set is BOUNDED, and its named limit is stated here, once:

- Residual kind: a destination shape for a CLOSED domain table that none of the four names
- Residual method: classify the spec deltas of the next archived change that consumed a Mechanism section (this stage's own is the first through the mapping) against the four; a delta whose domain landed in none is a fifth row and a revision of this table

**The record.** The generated `design.md` SHALL carry a `## Mechanism → artifacts` section: one table row per Mechanism entry (and per live rule with none) — the rule as the readout names it (ID, or `line N`), its closure token or the engine's state word, its owner's state, and its destination named as a requirement title (and the shape, for CLOSED entries) — plus a header line naming the source of the counts: the newest staging explore emit when one was read as the cross-check, else "the proposing AI's reading of the file; no engine record". Before the staging directory is moved, the body verifies by grep that every BOUNDED entry's two residual lines appear in a delta spec under `specs/`; a miss is reported and fixed before the move.

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

- **WHEN** a live rule has no usable Mechanism entry (any `rules_open` state)
- **THEN** `design.md`'s Risks carries one entry naming the rule as the readout would (ID, or `line N`) and the state word, the record lists it as UNACCOUNTED, no spec text is generated for it, and generation proceeds

#### Scenario: The newest explore emit disagrees with the AI's reading

- **WHEN** the staging trail's newest explore emit was written against the file as it stands and its `residuals` names an entry the proposing AI did not read as BOUNDED, or omits one it did
- **THEN** the disagreement is reported before generation naming the entry and the array; the AI re-reads the entry against the grammar and the report says which reading stood and why

#### Scenario: No engine record to cross-check against

- **WHEN** the staging trail has no explore emit, or Step 0b wrote to `explore.md` after the newest one
- **THEN** the AI's reading stands alone, propose fires no emit to obtain one, and the record's header line says "the proposing AI's reading of the file; no engine record"

## MODIFIED Requirements

### Requirement: Consume mode when staging directory exists

The system SHALL detect the presence of `orbit/explore/<name>/explore.md` and switch to consume mode — UNLESS the file's first non-blank line carries the `concluded` token (per `orbit-conventions`' status-header production), in which case mode detection REFUSES: the command halts stating the conclusion date and the recorded re-entry trigger ("this exploration concluded on <YYYY-MM-DD>. Re-entry: <the live CONCLUDED entry's `Re-entry:` slot, verbatim — per `orbit-conventions`' entry-identity requirement's live-carrier rule; `(no Re-entry: slot found)` when none>") and stops — no prompt, nothing written, nothing moved. Stating the trigger is not offering a reopen: it is the conclusion's own recorded sentence, read from the same file, and agrees with the explore body's third re-entry row (state the conclusion and its trigger, ask nothing else). The refuse is a Step 0 outcome, resolved BEFORE the PR layer's phase 1 (select + switch) — which runs between mode detection and the structure check — so a refused promotion never cuts a branch. Propose neither reopens the exploration nor offers to: the reopen edit has one owner (`orbit-conventions`' concluded-outcome requirement) and one executor (the explore body, per `orbit-explore-modifications`' re-entry requirement), and this requirement points at both without restating them. A staging directory with no `explore.md`, or whose header is neither fixed token, is not concluded and resolves as today. A `concluded` header inside `orbit/changes/<name>/explore.md` (a name promoted before this requirement existed) is not a propose input at all — consume mode reads the STAGING file only; the explore body's re-entry requirement owns that row.

#### Scenario: Consume mode activated

- **WHEN** the user invokes `/orbit:propose <name>` and `orbit/explore/<name>/explore.md` exists
- **THEN** the command reads `explore.md` as the authoritative seed for artifact generation rather than asking for a description

#### Scenario: A concluded staging directory is refused before any branch is cut

- **WHEN** the user invokes `/orbit:propose <name>` and `orbit/explore/<name>/explore.md`'s first non-blank line is `> **Status**: concluded 2026-09-25.` and its live CONCLUDED entry carries `Re-entry: a third withdrawn stage`
- **THEN** mode detection halts with "this exploration concluded on 2026-09-25. Re-entry: a third withdrawn stage" and stops; no `AskUserQuestion`, no change directory, no metadata, no move, and no branch switch (the PR layer's phase 1 is never reached); the reopen path is not offered

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
