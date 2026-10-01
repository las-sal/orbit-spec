# orbit-architecture-engine Specification

## Purpose
Make the engine architecture-aware: architecture docs under `orbit/architecture/` declare
parseable stages (`### Stage <id> — <title>` headings with optional `Depends-on:`/`Complete:`
slot lines — fence-aware, with a near-miss rule so intended structure never silently degrades
to legacy), and stage state is a pure function of on-disk artifacts: active changes and live
explores citing `{doc, stage}` via the optional `architecture:` metadata field, archived
citations, and the user-ratified `Complete:` mark (complete = quiescent AND ratified). The
`orbit architecture` CLI (`status` / `show` / `validate`, all `--json`) renders the computed
program position; architecture-scoped run summaries persist to `orbit/architecture/.orbit-runs/`,
the fourth trail location.
## Requirements
### Requirement: Parseable architecture-doc format

Architecture docs SHALL declare engine-readable structure via markdown heading conventions while
remaining judgment-dense prose documents: a stage is declared by a heading of the form
`### Stage <id> — <title>` (kebab-case `<id>`, unique within the doc), and a stage section MAY
carry two labeled slot lines — `Depends-on: <id>[, <id>…]` (or `Depends-on: (none)`) and
`Complete: [ ]` / `Complete: [x] <YYYY-MM-DD> (<who>)` / `Complete: [~] <YYYY-MM-DD> (<who>)` — three
EXACT productions: unratified, ratified, and ENDED (the user's declaration that the stage ended without
meeting its exit criteria — dated and attributed like the ratified mark, with no free-text suffix; the
reason lives in the status log, never in the slot). The slot's domain is CLOSED: the three productions,
absence (unratified, below), duplication (a violation), and every other `Complete:`-prefixed line a
near-miss under the rule below — a bare `[~]`, a malformed date, a trailing suffix. The dated productions
are LEXICAL, and the limit is shared by both: the date is shape-only (`\d{4}-\d{2}-\d{2}`; calendar
validity is not checked) and the attribution is opaque up to the final closing paren. Both slots are OPTIONAL with defined
omission semantics: an absent `Depends-on:` parses as no dependencies; an absent `Complete:`
parses as unratified; validation accepts either omission; the architect ratification flow INSERTS
a missing `Complete:` line when writing a mark (per `orbit-architect`). The parser INTERPRETS only:
stage ids/titles, the two slot lines, and section boundaries (a stage section runs from its heading
to the next same-or-higher-level heading); `docClass` and the grammar-violation list derive from
that grammar alone. That interpreted set is what OPACITY is a claim about — charter prose, exit
criteria, premise, rulings and status log carry no meaning the parser assigns, and no engine reader
may DERIVE meaning from them except where named below.

The parser additionally CARRIES the document's raw lines as PASSTHROUGH. This is stated rather than
elided because an earlier wording — "the model contains ONLY … and nothing downstream of
`parseArchitectureDoc` may read it" — was false of the shipped API in both halves: the parsed model
holds every line of the document, and two readers consume it. Passthrough confers no meaning by
itself; it is the substrate section slicing is computed from, and carrying content is not
interpreting it.

The engine readers that attach meaning to passthrough content are NAMED, and the list is CLOSED:

| reader | what it reads | what it does with it |
|---|---|---|
| `sliceStageSection` (serving `orbit architecture show`) | a stage section's lines, by the boundaries the parser interpreted | returns them VERBATIM; assigns no meaning, contributes no field, changes no classification |
| `orbit-source-lint`'s `architecture.ruling-count` | the `## Rulings index` section | counts entries whose first bold span matches a DECLARED prefix, producing a source value |

Any FURTHER engine-level reader of passthrough content SHALL be named here the same way; an unnamed
one is a violation of this requirement. The consequence of the second entry is stated plainly rather
than left implicit: an author who reformats a ruling entry can change a source-lint result, so
`orbit validate --sources` can go red on an edit the architecture parser is indifferent to. That is
the price of the named exception, and it is why the exception is named rather than assumed.

The parser SHALL be fence-aware: headings and slot lines
inside fenced code blocks are content, never declarations. **Near-miss rule** (a doc intended to
be parseable must not silently degrade to legacy): a heading starting `### Stage ` that fails the
exact grammar (malformed id, missing ` — <title>`), or a stage-like slot line that fails slot
syntax, is a VALIDATION ERROR naming the line — never silently ignored; `status` lists such a doc
as malformed rather than legacy. LEGACY means zero `### Stage `-prefixed headings anywhere
outside fences (genuinely opaque prose). Architecture docs live at
`orbit/architecture/<name>.md`; `<name>` (the filename stem) is the doc's citable identity.

#### Scenario: Stage declarations parse

- **WHEN** the parser reads a doc containing `### Stage d2-architect — architect (the program layer)` followed by `Depends-on: (none)` and `Complete: [ ]` lines
- **THEN** it yields a stage with id `d2-architect`, title `architect (the program layer)`, no dependencies, and an unratified completion mark

#### Scenario: Fenced look-alikes are content

- **WHEN** a doc contains a fenced code block whose text includes `### Stage fake-stage — x` or a `Complete: [x]` line
- **THEN** the parser declares no stage and no slot from inside the fence

#### Scenario: Duplicate stage id fails validation

- **WHEN** a doc declares two stages with the same `<id>`
- **THEN** `orbit architecture validate` fails with an error naming the duplicated id

#### Scenario: Slotless stage parses with omission defaults

- **WHEN** a parseable stage carries neither slot line
- **THEN** it parses as no-dependencies + unratified; `validate` passes; ratifying its completion later inserts the `Complete:` line

#### Scenario: Ended mark parses

- **WHEN** a stage carries `Complete: [~] 2026-09-28 (Sal)`
- **THEN** it parses as ENDED with date `2026-09-28` and attribution `Sal` — neither ratified nor unratified — and `validate` passes

#### Scenario: Ended near-misses are validation errors, executed one by one

- **WHEN** a stage's slot reads a bare `Complete: [~]`, or `Complete: [~] soon (someone)`, or `Complete: [~] 2026-09-28 (Sal) — withdrawn`
- **THEN** each FAILS `orbit architecture validate` naming its line and the slot grammar's three productions, `status` lists the doc as malformed, and no ended mark is parsed from any of them — the mark is dated and attributed like the ratified one, and the slot carries no suffix

#### Scenario: The lexical limit is shared and declared

- **WHEN** a stage's slot reads `Complete: [~] 2026-99-99 (Sal)` or `Complete: [~] 2026-09-28 (Sal))`
- **THEN** each parses as ENDED — the first because the date is shape-only, the second with attribution `Sal)` because attribution is opaque — exactly as the same two lines with `[x]` parse as ratified today; the limit is declared, not hidden

#### Scenario: Near-miss heading is a validation error, not silent legacy

- **WHEN** a doc's only stage heading is mistyped (e.g. `### Stage d2_architect architect` — bad id form, missing em-dash)
- **THEN** `orbit architecture validate` FAILS naming the line and the grammar violation, and `status` lists the doc as malformed — the doc never silently downgrades to legacy

#### Scenario: Legacy prose docs degrade gracefully

- **WHEN** a doc under `orbit/architecture/` contains zero `### Stage `-prefixed headings outside fences (e.g. a pre-D2 prose document)
- **THEN** it is listed as legacy/opaque by the status surface and is never an error; only
  parseable docs participate in stage-state computation

#### Scenario: Passthrough is carried, not interpreted

- **WHEN** `orbit architecture show <doc> <stage>` prints a stage section whose charter prose the parser assigns no meaning to
- **THEN** the section is reproduced VERBATIM from the carried lines, and `parseArchitectureDoc` yields the same stages, slots, `docClass` and violations it would if that prose were different — carrying content is not interpreting it

#### Scenario: Ruling-index content stays out of the parsed model

- **WHEN** the source lint reads a doc's `## Rulings index` section to compute a ruling count
- **THEN** `parseArchitectureDoc` yields the same stages, slots and `docClass` it would otherwise, the ruling text contributes no field to the parsed model, and `orbit architecture validate` is unaffected — the reader is named at the engine level without becoming part of the format's parse

### Requirement: Computed stage state with completion-as-ratification

Stage state SHALL be a pure function of on-disk artifacts — never stored, never hand-authored.
For a stage `<id>` in doc `<doc>`, the observed state is computed with this precedence: (1) any
ACTIVE change whose metadata cites `{doc, stage: <id>}` → `in-change`; (2) else any LIVE explore
(`orbit/explore/*/`) whose metadata cites it → `exploring`; (3) else ≥1 ARCHIVED change citing it
→ `quiescent`; (4) else any CONCLUDED explore citing it → `concluded`; (5) else → `premised`. A
citing staging directory is CONCLUDED iff the first non-blank line of its `explore.md` carries the
`concluded` token of the status-header production `orbit-conventions` owns — the reader consumes
the engine's ONE reader of that production (the explore parser's) and states no second grammar; a
missing or unreadable `explore.md`, the `exploring` token, or neither token observe as LIVE
`exploring` (the convention's rule: not-concluded, never MALFORMED). Archived work outranks a
conclusion: the archive is evidence to grade, the conclusion only a decision to build no more. The
`.openspec.yaml` citation is the only thing that makes a directory a citer; the header decides only
which of the two explore observations it is.

**Completion is a composition of observation and mark — ONE table for both layers** (the stage
grammar's `Complete:` slot per the format requirement; the exploration's header per the rule above):

| observed \ mark | `[ ]` | `[x]` ratified | `[~]` ended |
|---|---|---|---|
| `in-change` | `in-change` | INCONSISTENT | INCONSISTENT |
| `exploring` (live) | `exploring` | INCONSISTENT | INCONSISTENT |
| `quiescent` | quiescent-awaiting-ratification | `complete` | `ended` |
| `concluded` | `ended-from-explore` | INCONSISTENT | `ended` |
| `premised` | `premised` | INCONSISTENT | `ended` |

The `[x]` column's OUTCOMES are the pre-rc15 rule unchanged: the engine renders `complete` ONLY when the
observed state is `quiescent` AND the stage's `Complete:` slot is ratified (`[x]` with date); a
quiescent stage with an unratified slot renders as quiescent-awaiting-ratification; a ratified
`Complete:` mark on a stage whose OBSERVED state is not quiescent — live citing work (active change
or live explore), a concluded exploration only, OR no citing artifacts at all (`premised`, e.g. a
pre-D2 archived stage whose archive was never backfilled with its citation) — is an inconsistency
surfaced by the STATUS RENDER (which never shows a silent `complete`) and raised as a finding by
the audit-drift staleness check. The `[~]` column is the ended mark's rule: ending ASSERTS NOTHING
ABOUT THE WORK, so the mark is honoured on `quiescent` (the work archived without meeting its
criteria), on `concluded` (the mark and the header agree) and on `premised` (declared and withdrawn
before any work — the doc-layer twin of Considered & out), and is INCONSISTENT only where LIVE
citing work contradicts it — surfaced by the status render naming the live citer and raised by
audit-drift's check (b), which consumes this rule and restates none of it. `ended-from-explore` is
the ONE cell where the exploration layer alone decides: a stage whose only citers are concluded
explorations and whose slot is `[ ]` renders it — an observation, never `exploring`, and never a
claim that a mark is owed (a mark there renders `ended`: agreement, not contradiction). Re-entry
falls out of the table: a new live change or live explore citing an ended stage renders
INCONSISTENT, and clearing the slot by hand is the user's re-entry act. Every mark is the USER's,
written in an architect session on their word (per `orbit-architect`); the engine never infers
ratification or withdrawal from a trail.

The rendered vocabulary is `in-change`, `exploring`, `quiescent-awaiting-ratification`, `complete`,
`ended`, `ended-from-explore`, `premised` and `inconsistent`; the status render prints the ended
mark as `ended (declared <date> by <who>)`, and the `--json` stage payload carries `ended`,
`endedDate` and `endedWho` beside the ratified fields, with each `explore` entry of `citing[]`
carrying `concluded: true | false` (the header read, so a reader can tell a concluded explore citer
from a live one without opening the file; the text render prints ` (concluded)` after such a
citer). Orientation's WAITING band (owned by
`orbit-orientation` as a closed set naming the awaiting state only) lists neither ended state —
that requirement is unchanged. `orbit architecture validate` stays structure-only and does not run
the citation scan. The propose staging-move, the archive move, the explore conclude flow and the
architect's mark writes are the state transitions — no additional bookkeeping exists.

#### Scenario: Precedence over multiple citations

- **WHEN** a stage is cited by one archived change AND one active change
- **THEN** its observed state is `in-change` (live activity outranks history)

#### Scenario: Quiescent awaiting ratification

- **WHEN** all changes citing a stage are archived, no live explore cites it, and its `Complete:` slot is `[ ]`
- **THEN** the status surface renders the stage as quiescent with completion awaiting the user's ratification — the readout is the reminder; no command prompts for it unprovoked

#### Scenario: Complete only when quiescent AND ratified

- **WHEN** a stage is quiescent and its `Complete:` slot is `[x] 2026-08-01 (Sal)`
- **THEN** the engine renders the stage `complete`

#### Scenario: Ratified mark without observable quiescence is an inconsistency

- **WHEN** a stage's `Complete:` slot is ratified but the observed state is `premised` (no citing artifact exists — e.g. its work archived before the citation field existed and was never backfilled)
- **THEN** the status surface renders the inconsistency (never a silent `complete`), and audit-drift raises the finding; the remedy is backfilling the archived change's `architecture:` citation (a deliberate migration edit — the citation records a true historical fact)

#### Scenario: Re-exploration reopens honestly

- **WHEN** a quiescent stage gains a new live explore citing it
- **THEN** its observed state returns to `exploring`

#### Scenario: A concluded exploration is not live activity

- **WHEN** a stage's only citing artifact is a staging directory whose `explore.md` first non-blank line reads `> **Status**: concluded 2026-09-25.` and the stage's `Complete:` slot is `[ ]`
- **THEN** its observed state is `concluded` and it renders `ended-from-explore` naming the directory — never `exploring` — and orientation's WAITING band gains nothing for it

#### Scenario: Archived work outranks a conclusion

- **WHEN** a stage is cited by one archived change AND one concluded exploration, with an unratified slot
- **THEN** its observed state is `quiescent` and it renders quiescent-awaiting-ratification — the archive is evidence to grade

#### Scenario: Live header tokens observe as exploring

- **WHEN** a citing staging directory's `explore.md` is missing, or its first non-blank line carries the `exploring` token, or carries neither token
- **THEN** the stage observes `exploring` in every case — never MALFORMED, never `concluded`

#### Scenario: Ended mark honoured on a quiescent stage

- **WHEN** all changes citing a stage are archived and its slot is `Complete: [~] 2026-09-28 (Sal)`
- **THEN** the engine renders `ended (declared 2026-09-28 by Sal)`, the state is neither `complete` nor awaiting, and the WAITING band does not list it

#### Scenario: Ended mark honoured on a premised stage

- **WHEN** a stage has no citing artifact at all and its slot carries the ended mark
- **THEN** it renders `ended` — ending asserts nothing about the work, so no evidence is owed

#### Scenario: Ended mark contradicted by live work is an inconsistency

- **WHEN** a stage's slot carries the ended mark and an active change (or a live explore) cites it
- **THEN** the status render shows the inconsistency naming the live citer (never a silent `ended`), and audit-drift's check (b) raises it; clearing the slot by hand is the re-entry

#### Scenario: Ratified mark with only a concluded exploration is an inconsistency

- **WHEN** a stage's slot is `[x]` and its only citer is a concluded exploration
- **THEN** it renders the inconsistency with a detail naming the conclusion ("a concluded exploration is not evidence that the exit criteria were met") and never the words "live citing work" — the `[x]` column's outcomes are unchanged by the fifth observed state; only its detail learns the new observation's name

### Requirement: Architecture citation in change and explore metadata

The change metadata schema SHALL gain an optional `architecture` field of shape
`{doc: <name>, stage: <id>}` — `doc` is an architecture doc's filename stem under
`orbit/architecture/`, `stage` is a stage id declared in that doc. The field is valid in both
change metadata (`orbit/changes/<name>/.openspec.yaml`) and explore metadata
(`orbit/explore/<name>/.openspec.yaml`), round-trips through the metadata read/write helpers
without loss, and is re-pointable by hand-edit (validation checks resolvability; no immutability
is enforced, consistent with the rest of metadata). Absence of the field means an unlinked
change/explore and imposes no ceremony.

#### Scenario: Citation round-trips

- **WHEN** metadata containing `architecture: {doc: d-arc-arbitered-flow, stage: d2-architect}` is written and re-read through the helpers
- **THEN** the field is preserved exactly, alongside existing fields (`base_fingerprints`, `schema_version`, `consent_era_from`)

#### Scenario: Two-level dangling validation

- **WHEN** change validation (`orbit validate <change>` — the citation's OWNER: citations live in change/explore metadata, so they are validated where that metadata is validated; `orbit architecture validate` checks doc structure only) resolves a citation whose `doc` has no file under `orbit/architecture/`, OR whose `doc` exists but declares no stage with the cited id
- **THEN** validation fails with an error naming WHICH level dangled (the doc, or the stage within the named doc)

#### Scenario: Uncited metadata unaffected

- **WHEN** a change or explore has no `architecture` field
- **THEN** all validation and state computation behave exactly as before this capability

### Requirement: Architecture CLI surface

The system SHALL expose three subcommands under `orbit architecture`: **`status`** renders the
computed program position across all parseable docs — per stage: id, observed state (with the
completion composition), and the citing artifacts — honoring D1's eligibility framing (no
imperative labels); **`show <doc> [<stage>]`** prints one stage's section (heading-to-heading
slice) or, without `<stage>`, the doc's stage index — a session loads ONE stage section, never
the whole doc, as the layer's read-cost answer; **`validate <doc>`** checks parseable structure
(heading form, slot syntax, stage-id uniqueness, dependency references resolve to declared
stages). All three support `--json`.

#### Scenario: Status computes from disk

- **WHEN** `orbit architecture status --json` runs against a repo with one parseable doc whose stage is cited by an active change
- **THEN** the output lists that stage as `in-change` with the citing change named, computed live from disk (no stored state is read, because none exists)

#### Scenario: Show slices one stage

- **WHEN** `orbit architecture show d-arc-arbitered-flow d2-architect` runs
- **THEN** exactly that stage's section (heading through the line before the next same-or-higher heading) prints — not the whole document

#### Scenario: Validate on a legacy doc passes with a note

- **WHEN** `orbit architecture validate` targets a LEGACY doc (zero stage-prefixed headings outside fences)
- **THEN** it exits 0 with a legacy/opaque note — being legacy is not an error; only near-miss grammar failures fail validation

#### Scenario: Show on a malformed doc errors toward validate

- **WHEN** `orbit architecture show` targets a MALFORMED doc
- **THEN** it fails with an error naming the grammar violation(s) and pointing at `orbit architecture validate <doc>` — malformed docs are fixed, not browsed

#### Scenario: Citations resolve against a malformed doc's well-formed stages

- **WHEN** a doc contains both well-formed stage declarations and near-miss lines, and a change cites one of its WELL-FORMED stages
- **THEN** the citation resolves and the stage participates in state computation (one typo'd heading must not dangle every sibling citation); the malformed lines remain validation errors and the doc lists as malformed

#### Scenario: Validate catches a dangling Depends-on

- **WHEN** a stage declares `Depends-on: d9-nonexistent` and no such stage exists in the doc
- **THEN** `orbit architecture validate` fails naming the stage and the unresolvable dependency

#### Scenario: Show on a legacy doc or a nonexistent stage

- **WHEN** `show <doc>` targets a legacy (zero-parseable-stage) doc, or `show <doc> <stage>` names a stage id the doc does not declare
- **THEN** the legacy case prints an empty stage index with a legacy/opaque note (exit 0 — not an error); the nonexistent-stage case fails with an error listing the doc's declared stage ids

#### Scenario: Status with no architecture docs at all

- **WHEN** `orbit architecture status` runs in a repo whose `orbit/architecture/` contains no docs (or does not exist)
- **THEN** it reports `no architecture docs` cleanly (exit 0; `--json` yields empty buckets) — never an error

#### Scenario: Status buckets parseable, legacy, and malformed docs

- **WHEN** `orbit architecture status --json` runs in a repo with any mix of parseable, legacy, and near-miss docs
- **THEN** the payload buckets them (`parseable` with per-stage computed state; `legacy` listed as opaque; `malformed` listed with their grammar violations AND per-stage computed state for their well-formed stages — the stages that participate in state computation per the citation-resolution scenario render within the malformed listing) — a legacy-only or malformed-only repo never renders the clean no-docs message, and listings are never suppressed

### Requirement: Architecture trail location

Architecture-scoped work SHALL persist its run summaries to `orbit/architecture/.orbit-runs/`
(one directory shared by all architecture docs; each emit names its doc), committed like the
other `.orbit-runs/` locations. This is the fourth persistence location alongside per-change,
per-explore, and project-wide (per `orbit-conventions`); it never moves (architecture docs are
not archived by change archiving).

#### Scenario: Architecture emits land in the architecture trail

- **WHEN** `/orbit:architect` or `/orbit:review --as architecture` completes against doc `<doc>`
- **THEN** its run-summary JSON lands under `orbit/architecture/.orbit-runs/` with the doc named in the emit body
