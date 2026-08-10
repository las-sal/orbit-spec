# orbit-propose-modifications Specification

## Purpose
TBD - created by archiving change relocate-modified-upstream-workflows. Update Purpose after archive.
## Requirements
### Requirement: Upstream propose behavior preserved in standalone mode

The system SHALL preserve upstream `/orbit:propose`'s behavior when no `orbit/explore/<name>/` staging directory exists.

#### Scenario: Standalone mode

- **WHEN** the user invokes `/orbit:propose <name>` and `orbit/explore/<name>/` does not exist
- **THEN** the command behaves exactly as upstream: takes a description, generates `proposal.md` / `design.md` / `specs/<capability>/spec.md` / `tasks.md` into `orbit/changes/<name>/`

### Requirement: Consume mode when staging directory exists

The system SHALL detect the presence of `orbit/explore/<name>/explore.md` and switch to consume mode.

#### Scenario: Consume mode activated

- **WHEN** the user invokes `/orbit:propose <name>` and `orbit/explore/<name>/explore.md` exists
- **THEN** the command reads `explore.md` as the authoritative seed for artifact generation rather than asking for a description

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

### Requirement: Open question handling

The system SHALL prompt the user per Open question in `explore.md` with three resolution paths: resolve now, defer as `@review:` marker, or abandon.

#### Scenario: Resolve now

- **WHEN** the user resolves an Open question during the prompt
- **THEN** the question's resolution becomes a Decision and informs the generated artifacts; the Open question is moved to Decisions in the persisted `explore.md`

#### Scenario: Defer

- **WHEN** the user defers an Open question
- **THEN** a `@review: <question text>` marker is inserted at the most relevant location in the generated artifacts (typically design.md or the relevant spec); the Open question is moved to a "Deferred to markers" note or remains in Open questions with a "deferred" tag

#### Scenario: Abandon

- **WHEN** the user abandons an Open question (decides it doesn't apply to this change)
- **THEN** the question is moved to Considered & out with a brief rationale; no marker is created

#### Scenario: Default for unprompted bulk

- **WHEN** many Open questions exist and the user chooses "defer all"
- **THEN** all open questions become `@review:` markers in the generated artifacts

### Requirement: Move staging directory to changes

The system SHALL move `orbit/explore/<name>/` to `orbit/changes/<name>/` after generating the artifacts, with the staged metadata MERGED — never bulk-moved: `orbit new change` has already written the change's `.openspec.yaml` (schema, created, schema_version), so the staged `orbit/explore/<name>/.openspec.yaml` (when present, per `orbit-explore-modifications`) is handled explicitly BEFORE the content move — its `architecture:` citation (and any other explore-side fields future capabilities add) carries forward into the change's metadata via the read/write helpers; the change's fresh `schema`/`created`/`schema_version` win; the staged metadata file itself is then discarded so the bulk move can never clobber the change's metadata (precedent: `.orbit-runs/` is already moved explicitly for the same dotfile-glob reason).

#### Scenario: Standard move

- **WHEN** consume mode completes artifact generation successfully
- **THEN** the contents of `orbit/explore/<name>/` (including `explore.md` and any sibling files like `sketches/`) are moved into `orbit/changes/<name>/`; the source staging directory no longer exists

#### Scenario: Citation carries forward by merge

- **WHEN** the staged `.openspec.yaml` carries `architecture: {doc: d-arc-arbitered-flow, stage: d2-architect}` and consume-mode propose completes
- **THEN** the change's `.openspec.yaml` contains that citation alongside its fresh `schema`/`created`/`schema_version`, written through the metadata helpers (never by file overwrite)

#### Scenario: Conflicting citations — staged metadata is authoritative

- **WHEN** the freshly-created change metadata already carries an `architecture:` value (manual edit or future scaffold behavior) that differs from the staged metadata's citation
- **THEN** the staged citation wins (the exploration's citation is the captured decision; the merge is deterministic and loss-free) and the merge step notes the override in chat

#### Scenario: No staged metadata, no merge step

- **WHEN** the staging directory has no `.openspec.yaml` (a pre-D2 exploration)
- **THEN** the move proceeds exactly as before this capability; the change's metadata is untouched

#### Scenario: Generated artifacts coexist with moved content

- **WHEN** the move completes
- **THEN** `orbit/changes/<name>/` contains both the moved exploration files (`explore.md`, `sketches/`, etc.) AND the generated artifacts (`proposal.md`, `design.md`, `specs/`, `tasks.md`)

### Requirement: explore.md persists as historical record

The system SHALL preserve `explore.md` and its sibling files unchanged in the change directory after the move.

#### Scenario: No paraphrasing during move

- **WHEN** `explore.md` is moved into `orbit/changes/<name>/`
- **THEN** its content is unchanged; specific decision wording is preserved exactly

#### Scenario: Cite explore source

- **WHEN** the generated `design.md` references background or decisions originally captured in `explore.md`
- **THEN** the generated text cites `explore.md` rather than paraphrasing without attribution

### Requirement: Validate explore.md structure before consuming

The system SHALL check the basic structure of `explore.md` and warn (but not block) on issues.

#### Scenario: All five sections present

- **WHEN** `explore.md` has all five expected sections (Premise / Decisions / Open questions / Considered & out / References)
- **THEN** the command proceeds normally

#### Scenario: Missing section warning

- **WHEN** `explore.md` is missing one or more expected sections
- **THEN** the command warns about the missing sections and prompts the user to confirm proceed-anyway (default proceed)

#### Scenario: Malformed file

- **WHEN** `explore.md` cannot be read or parsed
- **THEN** the command halts with a clear error and exit; user fixes and re-invokes

### Requirement: Naming inference fallback

The system SHALL attempt to infer the change name when invoked without one.

#### Scenario: Recent explore activity

- **WHEN** `/orbit:propose` is invoked with no name and exactly one `orbit/explore/<name>/` directory exists
- **THEN** the command proposes that name to the user; on accept, proceeds in consume mode

#### Scenario: Multiple or no candidates

- **WHEN** zero or multiple staging directories exist
- **THEN** the command prompts via `AskUserQuestion` to specify a name (zero candidates) or pick among them (multiple)
