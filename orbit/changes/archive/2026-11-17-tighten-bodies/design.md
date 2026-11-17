## Context

Stage `tighten-bodies` of `reduce-orbit-phase1` (its charter; the brief's section 4.3) with RG2's structural fixes.
Stages `conditional-steps` and `once-per-session-detail` moved the rarely needed text out of the bodies; this stage
tightens what stays and meets RG2. Measured at `a5ba0f0c` (see explore.md, Premise): the bodies total 369,392
characters (apply 18,887); the decision-writing bullet is 2,860 characters in each of fourteen bodies; Guardrails blocks
restate steps in seven bodies; provenance and thirteen mirror notes sit in the twelve tightened bodies; three
descriptions fail a strict YAML parse; eleven references over 100 lines have no contents list; review reaches two
references only through `external-handoff.md`.

The twelve tightened bodies are new-change, continue-change, apply-change, ff-change, sync-specs, archive-change,
verify-change, propose, review, address-reviews, audit-drift and architect. Explore, onboard and bulk-archive are
untouched apart from the shared decision-writing bullet (all three carry the epitome but onboard) and their
descriptions (D-tb-4, `skill_body_convention.md`'s Exceptions).

## Goals / Non-Goals

**Goals:**
- RG1 as amended: the bodies and apply's body at most the figures this design sets (D-tb-2; decision 7 below).
  Against RG1's first figures the stage lands about 15,000 over in total and 800 over on apply.
- RG2: every reference linked from its `SKILL.md`, a contents list on each reference over 100 lines, every
  description valid YAML within 1,024 characters saying what and when.
- No wording an agent acts on is removed, shown by tests (decisions 5 and 6).
- The budget test's ceilings lowered to the new sizes plus 5%, except explore's line ceiling, which rises from 664 to
  669 for the bullet's five lines (D-tb-17). RG0 holds.

**Non-Goals:**
- Cutting the decision-writing bullet's content (R-rop-7; weighed at `evaluation`).
- Explore's, onboard's and bulk-archive's own text, and mirror notes inside reference files (D-tb-4, D-tb-7).
- Rewording any instruction beyond the labelled restructure and the three descriptions.

## Decisions

### 1. The decision-writing bullet keeps every clause in five labelled sub-bullets (D-tb-1, R-rop-7)

The fifth epitome bullet keeps its label line and gains R-rop-7's five labelled sub-bullets, nested under it: before
asking (the five stop conditions with their glosses, in the write gate's order, as today), acting without asking,
after a call (the eighteen areas inline, as today), not a stop, and where records go. Every clause, gloss, area name
and command stays; a word count of the draft against today's fence loses nothing. The reference pointer moves to the
label line. It stays one constant composed in `src/core/disciplines.ts` from the write gate's condition and area lists,
and the `Decision-writing discipline` fence carries it. It grows by 112 characters per body (2,947 against 2,835 for
the fenced text), 1,568 over fourteen bodies. D-tb-1's first draft measured 41 because it dropped connecting clauses
("however you reached it: …", "by its own gloss above"); keeping them is R-rop-7's "content unchanged". The five
sub-bullets add five lines to every carrying body; explore, at its 664-line ceiling, gets 669, the one ceiling this
program raises, at Sal's choice (D-tb-17; R-rop-8 and RG3 amended).

### 2. Guardrails lines go only when a step line says them (D-tb-3)

The removals are named in `Restated Guardrails lines are removed from orbit-modified bodies`, as `Generated-file
disposition` asks of an edit to an upstream portion. Twenty-three lines go (1,566 characters) and nineteen stay;
archive's block goes whole. Apply keeps "pause and ask before implementing" and "scoped to each task", which no step
says, and new-change keeps "Do NOT create any artifacts yet", a prohibition no step states (walk of the external
proposal pass). Sync-specs keeps all five lines: `Generated-file disposition` classes it as upstream-verbatim, its upstream body
unchanged (D-tb-16).

### 3. Provenance leaves the twelve bodies; the instruction stays (D-tb-6, D-tb-7)

The six kinds and their treatment are the table in `Tightened bodies carry no provenance`. The shared epitome's opening
line ("The disciplines from `orbit-conventions`, embedded per body; …") is shared with explore and bulk-archive and
stays (D-tb-4). The step headings composed in `src/core/disciplines.ts` lose their citations in the bodies' basic contents only
(`COMMIT_STEP_BASIC`, `CHAIN_END_STEP_BASIC`, and the account steps' basic contents, for which
`ACCOUNT_STEP_HEADING` and `ACCOUNT_WALK_STEP_HEADING` are split into a body heading and the full step's own); the
full steps in the reference files (`COMMIT_STEP`, `CHAIN_END_STEP`, `ACCOUNT_STEP`, `ACCOUNT_WALK_STEP`) stay
byte-equal, so `moved-blocks.test.ts`' recorded hashes hold (walk of the fresh proposal pass, F3). The same split
applies to the three paragraphs a body shares with its pinned run-summary reference (apply's completion-prompt
override; architect's "(Per `orbit-run-summary-emit` …)" note and "No emit without sweep" paragraph): the body's
copy loses its provenance, so architect's body says "residency sweep" at every use, and the reference keeps its bytes
(walk of the proposal verification pass, V2). Text only authors need (that a fence
is a mirror, which test holds it) moves to a comment beside the template literal, which is not emitted. Mirror notes go
whole (R-rop-14); the two requirements that asked for them are modified. A removal takes only provenance and the
connectors joining it to its sentence: a note's own sentences and clauses go, an instruction sharing its paragraph or
bracket stays (review's "The pass genre is a record and a header word; …", archive's "(every reviewed gate)"). The
six kinds have written patterns in the requirement, and the ledger checks a removed span is wholly covered by them
(walk of the fresh proposal pass, F1). A citation a requirement asks the body to
carry is not provenance and stays: the review and address-reviews bodies name `orbit-conventions`' Severity ladder
wherever they assign a severity ("SHALL NAME this ladder"), and review names the `Review mode decision framework` rule
where it composes a brief (D-tb-16). Before removing any other prose citation, apply greps `orbit/specs/` for a
requirement asking a body to name the cited requirement.

Two requirements mention the bodies' mirrors and stay unmodified: `No-chaining contract`'s "one bullet per discipline"
holds for a bullet with nested sub-bullets, and `The walk write gate checks sweep evidence` says the bodies carry its
fence "as a CHECKED MIRROR held byte-equal by a parity test", which stays true without the note (D-tb-16).

### 4. The generator writes every frontmatter value YAML-safe (D-tb-9)

`generateSkillContent` passes `name`, `description`, `license` and `compatibility` through `yamlScalar`, as it already
does metadata values. A plain value (a kebab-case name, `MIT`) stays bare; a description with a comma or `: ` is
JSON-quoted. Three descriptions are reworded, drafted here and finalized at apply:

- address-reviews (1,140 characters to about 415, as finalized at apply with the clause "every outstanding pass a
  change's gates report"): "Walk review findings and `@review:` markers to resolution, one
  by one: pushback against current state, classify, fix the obvious ones, brief each decision for the user to
  ratify, cascade ripple edits, and record the walk. Use after `/orbit:review` or `/orbit:audit-drift` writes
  findings, after an external review returns, or when `@review:` markers have built up."
- architect: today's text, plus "Use when starting or steering a program of several changes, or ratifying a stage."
- onboard: today's text, plus "Use when someone is new to orbit or asks how its workflow fits together."

Audit-drift's description stays: its "four categories" are `orbit-audit-drift`'s `Four scan categories executed`,
and its "Use standalone when" is a when-clause the frontmatter test accepts (a "Use" clause containing "when", or
"Use after").

### 5. An edit ledger reconciles each body to its recorded hash (D-tb-14)

Before the first template edit, the sha256 of each edited body's `instructions` is recorded (as `moved-blocks.test.ts`'
task 1.1 did). A new test, `test/core/templates/tightened-bodies.test.ts`, holds the edits as (before, after) pairs of
kind `restated`, `provenance`, `restructured` or `link`, checks each kind, and undoes every pair to match the recorded
hash. Each check carries a mutation shown to fail. The pairs are written from the generated diff at apply, after the
edits, so they describe what landed.

### 6. Existing tests follow the text that remains (D-tb-15)

Each edited assertion is one of the rows of the D-tb-15 table in `An edit ledger holds every tightened body to its
recorded text`; any other stops the edit. Each is named in the archive.

### 7. RG1's amended figures

From the measured drafts: Guardrails −1,566 (apply −435), the decision-writing bullet +1,568 (apply +112), the
descriptions about −650 net (address-reviews −800, architect and onboard +160, quoting about +30), and apply's
provenance drafted at −358. The other eleven bodies' provenance is estimated at 3,100 to 3,800 (D-tb-8, less apply's
share and the citations D-tb-16 keeps). Projection: about 364,500 to 365,200 in total, apply about 18,206. RG1 is set
at **at most 365,500 in total and 18,300 for apply**, written into `reduce-orbit-phase1.md` at propose (`4acf48f9`), so no task
writes them; the budget ceilings then come down to the exact sizes plus 5%. The exit criterion is met when the measured sizes at apply
sit under both figures.

## Risks / Trade-offs

- [D-tb-6's residual] A provenance form none of the six kinds names, or a member of the six whose removal would take
  characters the patterns do not cover, may remain in a body. The named limit and how a
  member is found are stated in `Tightened bodies carry no provenance`; this entry points there and restates nothing.
  Such a form is recorded and left in place, never removed in this stage (walk of the fresh proposal pass, F2; the
  in-kind members added at the system walk, D-tb-18).
- [An instruction mistaken for provenance] A spec citation the agent acts on could be cut. → The edit ledger's
  `provenance` kind check refuses a removed span that matches none of the six patterns, and the prose-citation rule
  keeps a citation the sentence needs.
- [Every installed SKILL.md changes] Quoting rewrites each frontmatter once. → `orbit update` regenerates as for any
  template edit; the parsed values are string-equal to today's.
- [RG1 set before provenance is drafted in eleven bodies] → The figures carry about 100 to 1,000 characters of margin
  over the projection; if apply's measurement lands above them, apply stops and raises it rather than trimming
  further.
- [Codex's frontmatter reader] Not checked; the strict `yaml` parse is the stand-in, and quoting can only help a
  stricter reader.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-tb-3 | SOURCED | live rule | `orbit-conventions`: `Restated Guardrails lines are removed from orbit-modified bodies` (TABLE) |
| D-tb-6 | BOUNDED | live rule | `orbit-conventions`: `Tightened bodies carry no provenance` (TABLE; residual as its named limit, widened by D-tb-18 at the system walk; Risks points) |
| D-tb-9 | SOURCED | live rule | `orbit-skill-generation`: `Frontmatter metadata pass-through` (TABLE) |
| D-tb-10 | SOURCED | live rule | `orbit-skill-generation`: `Reference files are linked from their skill and long ones open with contents` (TABLE) |
| D-tb-14 | DERIVED | live rule | `orbit-conventions`: `An edit ledger holds every tightened body to its recorded text` (TABLE) |
| D-tb-15 | SOURCED | live rule | `orbit-conventions`: `An edit ledger holds every tightened body to its recorded text` (second TABLE) |

## Touchpoints

- `src/core/disciplines.ts` — the decision-writing constant, the basic-content step headings (the account headings split), `decision-records.md`'s contents list.
- `src/core/templates/workflows/*.ts` — the twelve tightened bodies, the three descriptions, review's flag row, the long references' contents lists.
- `src/core/shared/skill-generation.ts` — `generateSkillContent` writes every frontmatter value through `yamlScalar`.
- `test/core/templates/` — the new edit-ledger, frontmatter and contents tests; `moved-blocks.test.ts`, `chain-prompt-tags.test.ts`, `skill-templates-parity.test.ts`, `skill-body-budget.test.ts`.
- `test/core/*-parity.test.ts` — the mirror parity suites' anchors and the decision-writing parity test.
- `skill_body_convention.md` — its Exceptions lose the two-level sentence; its commit-step example takes the new heading; its budget rule names explore's one rise.
- `orbit/architecture/reduce-orbit-phase1.md` — RG1's figures, written at propose (`4acf48f9`); apply edits nothing there.

## Alternatives considered

Decided at propose (D-tb-17): writing the decision-writing bullet's labels inline, or trimming explore's own text, to
keep explore's line ceiling at 664; Sal chose to raise that one ceiling.

From explore.md's Considered & out:
- Cutting the decision-writing bullet's condition glosses and area names in this stage: amends R-rop-7 (D-tb-2).
- Holding RG1 at 350,000 by pulling stage-D moves, whose branch the user's flags pick (D-tb-2).
- Trimming the mirror notes to R-crc-14's minimum: Sal chose removal (D-tb-7).
- Rewording only the three descriptions that fail to parse: the next would fail again (D-tb-9).
- Generating each contents list from the file's headings: `prompt-template.md`'s headings are its prompt's (D-tb-10).
