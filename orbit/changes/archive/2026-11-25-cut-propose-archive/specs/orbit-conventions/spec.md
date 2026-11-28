## MODIFIED Requirements

### Requirement: Generated-file disposition

The system SHALL classify every skill and command file orbit generates into one of four disposition categories by template provenance. Each category dictates how the file's source template is maintained in the fork.

#### Scenario: Orbit-authored — full ownership

- **WHEN** a generated file's template body has no upstream-derived content (currently `orbit-onboard`, whose body replaces upstream's guided-tour content entirely; the net-new editorial workflows — review (whose `--reviewer external` branch absorbed the external packaging at D-arc Stage D5's merge; the standalone review-external template joined at B3 and RETIRED at D5), audit-drift, address-reviews; and `orbit-architect`, fully orbit-authored — joined as the 16th workflow at D-arc Stage D2, the surface standing at 15 post-D5 and at 14 since `cut-propose-archive` retired bulk-archive)
- **THEN** the template is fully owned by orbit; orbit's contributors edit it freely; the file uses the `orbit-*` directory naming convention for consistency with siblings even when the body is 100% orbit-authored

#### Scenario: Orbit-modified — upstream body with `# Orbit additions`

- **WHEN** a generated file's template bundles upstream's body with an appended `# Orbit additions` section (`orbit-explore`, `orbit-propose`, `orbit-archive-change`, `orbit-apply-change`, `orbit-verify-change`, `orbit-continue-change`, `orbit-ff-change`, `orbit-new-change`)
- **THEN** the upstream-authored portion is the vendored-baseline snapshot and SHALL change only through a change whose delta spec names the edit — the step it replaces and the requirement that replaces it — so a future upstream cherry-pick can find every edit as a named act; an edit so named lands IN PLACE, and no additions-section text overrides a step edited under this rule, so the body carries one instruction for that step; orbit's other behavior and constraints land in the additions section. Known limits, both from before this rule and outside its clauses: upstream portions already edited name no delta — `orbit-apply-change` and `orbit-archive-change` carry semantic edits, found by diffing each body's upstream portion against `upstream/v1.3.1` with the rename normalized (2026-10-04) — and additions sections already override upstream steps, such as `orbit-propose`'s consume mode replacing Step 1, its procedure carried by `references/consume-mode.md`, which the additions section tells the agent to read; a cherry-pick finds the first kind by diffing against that tag and the second by reading the additions sections and the references they read

#### Scenario: A named edit replaces an upstream step in place

- **WHEN** a change's delta spec names an edit to an orbit-modified body's upstream portion (`orbit-verify-modifications`' `Verify's Scenario Coverage step reads the scenario map` names the replacement of verify-change's test-tracing instruction)
- **THEN** the step is edited in place in the upstream portion, no additions-section text overrides the same step, and the rest of the upstream portion is unchanged by that edit

#### Scenario: Upstream-verbatim — kept unchanged

- **WHEN** orbit generates an upstream skill it never modified because its interaction is at the invocation layer, not the skill-body layer (currently `orbit-sync-specs`, which upstream's own archive flow invokes as a callable primitive)
- **THEN** the template carries the upstream body unchanged; a `# Orbit additions` section, where present, carries only the execution disciplines' epitome every body carries and notes on how the skill behaves when invoked (`orbit-sync-specs`: consent inherited from the flow that invokes it), and no step of its own; beside the body, the skill ships only the shared decision-record reference (`references/decision-records.md`) that the epitome's decision-writing statement points at

#### Scenario: Not generated — excluded from the install surface

- **WHEN** an upstream skill provides no orbit-mission value (e.g., `feedback`, which sends user feedback to Fission-AI and has no role in orbit's workflow)
- **THEN** orbit does not register its template for generation; a fresh `orbit init` produces no such skill or command in the project

#### Scenario: Per-skill disposition is documented

- **WHEN** orbit's contributors evaluate a new upstream skill arriving via a future engine upgrade or cherry-pick
- **THEN** the disposition decision is recorded in the change proposal that performs the upgrade; the new skill is assigned to one of the four categories with rationale

#### Scenario: Commands are thin launchers delegating to skills

- **WHEN** orbit generates (or declines to generate) a `/orbit:*` command file
- **THEN** the command is a thin launcher that invokes its corresponding skill (the skill is the single source of workflow behavior and carries the disposition above); the command surface mirrors the skill surface 1:1, and a skill that is not generated has no command either

### Requirement: The commit step closes each carrying body

Each CARRYING body, a generated workflow body the table below marks yes, SHALL close with the commit step, carried in
two halves (`reduce-orbit-phase1`'s R-rop-3): its BASIC CONTENT — when it runs, the command, the usual result and the
link to its reference file — composed once in code (`COMMIT_STEP_BASIC`) and carried byte-equal by each carrying body;
and the full step, composed once in code (`COMMIT_STEP`) and carried byte-equal in each carrying skill's
`references/commit-step.md`, which the basic content tells the agent to read and follow, from the record it already
has, on any result but `off` (a non-zero exit included). What the step does is the same whichever half states it. The step runs `orbit pr commit <change-name> --json` in the session the command
was invoked in, after the command's run summary is written and BEFORE the position readout, so its lines precede the
readout and the eligibility line that end the turn, and the chain end step (`No-chaining contract`) still follows
them. With no change target (an architecture-mode review, a `--doc` walk, a project-wide walk) the step does nothing
and calls nothing, as the chain end step does. When the invocation's PR layer has already stopped (an earlier `orbit pr`
call exited non-zero, or a step it printed failed: `select` or `publish` at propose or ff, the `tail` at archive), the
step calls nothing and prints nothing, because the consumption table's failure row runs no later PR step, and that
failure's line stays the recovery. It acts on the record by `orbit-pr-lifecycle`'s consumption table
(`PR actions are workflow-body choreography (zero engine git)`). On `off` it prints nothing and runs nothing. On `skip`
it writes one line from the reason. On `proceed` it runs the printed segment, if any: when the segment's inputs name
`<message-file>`, it first writes the commit message (one line naming the command, the change and what the session
did) to a file OUTSIDE the working tree (the OS temp directory), which it keeps until every printed step has run; it
runs the printed steps in order, and names, in one line, each path `observations.untracked` lists. With `degraded: "pr"`
it writes one line saying the push was dropped, whether or not a segment printed. On a non-zero exit it reports the
error verbatim and runs nothing. What it may commit, and to which
branch, is `orbit-pr-lifecycle`'s `` `orbit pr commit` computes the closing commit step ``; what grants it is that
capability's `The commit and push settings`. A worker the session dispatched (a fresh reviewer, a blind pair's fresh
half) persists its pass and returns, and never runs the step. The bodies, SOURCED from the workflow templates under
`src/core/templates/workflows/`:

| body | carries the step |
|---|---|
| propose, ff | yes: after the completion emit and `publish`'s record segment, before the position readout; not after a failed `select` or `publish` step |
| apply | yes: at the session's close, before the position readout, not at each chunk boundary |
| review | yes: in the invoking session, before the position readout; with no change target it does nothing |
| address-reviews | yes: before the position readout; with no change target it does nothing |
| archive | yes: after the PR-attached tail and before the completion readout, not after a failed `tail` step; the tail commits its enumerated scope, and under `commit: true` the step commits the rest in a second commit, so the tail's unrelated-paths guarantee (`orbit-archive-modifications`' `PR-attached archive tail`) holds for the tail's own commit |
| new, continue | no: never attached (`orbit-pr-lifecycle`'s `PR entry points`) |
| architect, audit-drift | no: no change target |
| sync-specs | no: it writes no run record; its writes ride the next carrying body's commit |
| verify | no: a system review's Pass 0 runs it inside the review's own session, where a commit would land mid-review; its run summary rides the next carrying body's commit |
| explore | no: a staging exploration is never attached, and an exploration resumed in a change's directory leaves its writes to the next carrying body's commit |
| onboard | no: it writes nothing |

(`feedback` is not generated, and `pr-choreography` is text propose and ff share, not a body.) At the defaults (neither
setting granted) the step's one act is that read-only call: the record is `off`, and the basic content handles it: the
body prints nothing and runs nothing (G0, as R-adf-12 words it). Named limits: an apply session's work stays uncommitted until the session closes,
however many chunks it completes; and the writes of sync-specs, verify and explore wait for the next
carrying body.

#### Scenario: At the defaults the step prints nothing

- **WHEN** a carrying body closes in a project that sets neither `commit` nor `push`
- **THEN** `orbit pr commit` prints `off`, the body prints nothing about it, and the turn ends as it did before the step
  existed

#### Scenario: The step commits before the chain read

- **WHEN** `commit: true` is set and an attached change's walk closes with its edits uncommitted
- **THEN** the step commits them before the chain end step reads the `chain` object

#### Scenario: A dispatched worker never commits

- **WHEN** a fresh reviewer dispatched by `/orbit:review --fresh` persists its pass under `commit: true`
- **THEN** the worker runs no commit step; the invoking session's step commits the pass

#### Scenario: The archive's second commit carries what the tail left

- **WHEN** an attached change archives under `commit: true` with an unrelated tracked edit in the tree
- **THEN** the tail's commit leaves the edit out, as `orbit-archive-modifications` promises, and the step after it
  commits the edit; without the setting the edit stays uncommitted, as today

#### Scenario: A stopped PR layer runs no commit step

- **WHEN** `commit: true` is set and propose's `publish` `open` step fails, or archive's `tail` step fails
- **THEN** the step calls nothing and prints nothing, so the failure line's recovery (at propose, ending in the record
  segment's `git commit --only`) runs as printed

#### Scenario: A walk with no change target calls nothing

- **WHEN** `/orbit:address-reviews --doc <doc>` closes under `commit: true`
- **THEN** the step does nothing and `orbit pr commit` is not called

#### Scenario: The step's lines precede the readout

- **WHEN** a carrying body closes under `commit: true` and the step names an untracked file it committed
- **THEN** that line prints before the position readout and the eligibility line

#### Scenario: Every carrying body carries the step byte-equal

- **WHEN** the workflow skills are generated
- **THEN** each body the table marks yes carries `COMMIT_STEP_BASIC` byte-equal and its skill ships
  `references/commit-step.md` holding `COMMIT_STEP` byte-equal; no body the table marks no carries either, and no
  other skill ships the file

#### Scenario: At the defaults the basic content handles the record

- **WHEN** a carrying body is generated
- **THEN** its commit step's basic content handles the `off` record itself, printing nothing and running nothing, and names
  `references/commit-step.md` only for the other results

### Requirement: Tightened bodies carry no provenance

The system SHALL keep provenance — text that records where an instruction came from rather than what to do — out of
the twelve bodies `tighten-bodies` tightens: new-change, continue-change, apply-change, ff-change, sync-specs,
archive-change, verify-change, propose, review, address-reviews, audit-drift and architect. The instruction it was attached to SHALL stay,
and text only template authors need goes to a comment beside the template literal, which is not emitted:

| member | covered by |
|---|---|
| stage tags (`D-arc Stage D2` to `D6`, `C1`, `C2`, `rc04a`, `rc10`, `rc12`) | removed with the connectors that join them; a bracket goes only when nothing else is left in it; a step's number stays |
| the `NEW` before an orbit step's number, and "(orbit named edit, per …)" | removed; the number stays, so "Step 3.2" still resolves |
| ruling and decision ids (`R-d-8`, `R-crc-6`, `D-c1-2`, `D-d2-6`, `D1`) | removed; where an id is part of a name ("R-d-8 residency sweep", "R-crc-6's three lanes"), the name stays without it, the same at every use in the body |
| mirror notes (thirteen: archive 1, verify 1, propose 5, review 3, address-reviews 2, architect 1) | removed: the sentences or clauses that say the text is a copy, name its owner, say why the copy exists, or tell authors not to edit it; every other sentence or clause of the paragraph stays, and the copied text stays byte-equal, held by its parity test |
| owning-spec citations in headings | removed; the heading's own words and number stay |
| spec citations in prose | removed when the sentence gives the same instruction without it; kept where the citation names something the agent acts on, or where a requirement asks the body to name it (`Severity ladder`'s "SHALL NAME this ladder"; `Review mode decision framework`'s "the bodies that compose briefs name it") |

**The removal unit.** A removal takes only provenance and the connectors that join it to its sentence; every other
word of the paragraph or bracket stays. A span is COVERED by these patterns when, after the mirror-note spans it holds
are taken out whole, every remaining character is a match of a token pattern or a connector:

```
CONNECTORS             whitespace, the marks — – - , ; : ( ) and the emphasis marks * and **, and the words per, see, by,
                       since, from, in, at, of, the, its, and
stage tag              D-arc(?:'s)?(?: Stage D[0-9])?  |  Stage D[0-9]  |  \bC[0-9]\b  |  \brc[0-9]{2}[a-z]?\b
NEW marker             \bNEW(?= Step )  |  orbit named edit
ruling or decision id  \bR-[a-z0-9]+-[0-9]+(?:'s)?\b  |  \bD-[a-z0-9]+-[0-9]+(?:'s)?\b  |  \bD[0-9]{1,2}\b
spec citation          `orbit-[a-z-]+`(?:'s?)?(?: (?:`[^`]+`|"[^"]+"|\*\*[^*]+\*\*)(?: requirement)?)?
mirror note            the span from the clause holding a marker to the end of its sentence, or of the bracket the
                       marker sits in; a marker is, in any case: checked mirror, mirror of, parity test, installed
                       skill, has no specs, cannot open, never edit it here, the grammar module supplies it; clauses
                       split at , ; — and brackets outside backtick spans, so a note's owner clause (", its owner",
                       "— the owner of …") goes with the marker clause it follows, and a clause before it stays; the
                       sentence's closing mark stays when text before the span remains (a colon introducing a fence)
```

The patterns decide FORM: a span they cover may still name something the agent acts on, which the prose-citation row
above keeps by judgement and a grep of the specs before each removal. The kinds were found by pattern over the
generated bodies at `a5ba0f0c` and by reading the hits; the set is BOUNDED,
and its named limit is this:

Residual kind: a provenance form outside the six above (a coined tag, an archive name, a pointer to orbit's own history), or a member of the six whose removal would take characters none of the patterns covers (an id or tag with a suffix or prefix: `R-crc-11(f)`, `rc04a's`, `D1's`, `pre-D2`)
Residual method: reading each tightened body whole after its edits, recording each find in the change's account and leaving it in place for the evaluation, and the removal test, which lists every removed span with its kind

Explore and onboard keep their own text until `reduce-orbit-phase1`'s evaluation (bulk-archive did too, until
`cut-propose-archive` retired it), and so does the disciplines epitome's opening line, which explore carries; specs keep
their own tags. Provenance in text
a body shares with a block `moved-blocks.test.ts` pins leaves the body's copy only: that copy is split from the block's
constant, and the block stays byte-equal to its record. At `a5ba0f0c` the shared texts carrying provenance are four step
headings (the commit step's, the chain end step's and the two account steps') and three paragraphs a body shares with
its run-summary reference: apply's completion-prompt override, and architect's "(Per `orbit-run-summary-emit` …)"
note and "No emit without sweep" paragraph.

#### Scenario: A stage tag leaves a heading and its number stays

- **WHEN** archive's body is generated
- **THEN** its user-validation closure heading reads "Step 3.2 — User-validation closure", with no `NEW` and no
  `(rc10)`

#### Scenario: A mirror note goes and the copy stays

- **WHEN** review's body is generated
- **THEN** no sentence before its pass-genre table says it is a CHECKED MIRROR, and the table is byte-equal to
  `Review mode decision framework`'s fence

#### Scenario: A citation a requirement asks for stays

- **WHEN** review's body assigns a severity
- **THEN** it still names `orbit-conventions`' Severity ladder, as that requirement asks

#### Scenario: An instruction beside a mirror note stays

- **WHEN** review's body is generated
- **THEN** the mirror note before its pass-genre table is gone, and "The pass genre is a record and a header word; the
  gate reads nothing of it." still stands there

#### Scenario: An id that names a thing drops at every use

- **WHEN** architect's body is generated
- **THEN** it says "residency sweep" wherever it said "R-d-8 residency sweep", and carries no `R-d-8`

### Requirement: An edit ledger holds every tightened body to its recorded text

The system SHALL hold every edit `tighten-bodies` makes to a body's instructions — in the twelve bodies it tightens,
and in explore for the shared decision-writing bullet — in an edit-ledger test (bulk-archive's recorded body, and its
pairs, left the ledger when `cut-propose-archive` retired that workflow, since no body remains to undo onto): the sha256 of each
edited body's `instructions` is recorded before the first edit, and the test lists every edit as a (before, after)
pair of one kind, checks each kind, and undoes every pair on today's body to compare with the recorded hash, first
undoing the later edits to those bodies: those a cut stage's ledger names (`A cut ledger names every body edit a cut
stage makes`), undone by that ledger's own pairs, then `records-by-setting`'s:

| member | covered by |
|---|---|
| a Guardrails line removed as restated | a pair of kind `restated`, naming the step line that states it; the test asserts that line is still in the body |
| a provenance span removed | a pair of kind `provenance`; the test asserts the removed span is COVERED by the patterns in `Tightened bodies carry no provenance` — every character a token match or a connector once its mirror-note spans are taken out — so no instruction is filed as provenance |
| an id dropped from a name | a pair of kind `provenance` at each use; the test asserts the id-bearing name occurs nowhere in the body |
| a mirror note removed | a pair of kind `provenance`; the copied text after it is held unchanged by its parity test |
| the decision-writing bullet restructured | one pair of kind `restructured`, shared by the thirteen bodies that carry it (fourteen until bulk-archive's retirement); the test asserts each clause of the one-paragraph form (the five conditions with their glosses, the eighteen areas, the three commands (`orbit emit stop`, `orbit emit resolution`, `orbit emit ledger`), the seam sentence, the record-routing sentence, the reference pointer) is in the rule, which `records-by-setting` moved to `references/decision-records.md`, its opening clause replaced as `Decision-writing discipline`'s `The labelled form keeps every clause` names |
| a `reduce-orbit-phase2` cut stage's edits | undone first, by the cut ledger's pairs in reverse order, on today's body; what remains is the body as `records-by-setting` left it |
| `records-by-setting`'s swap of the labelled bullet for its basic content | undone first in each of the thirteen bodies: the basic content is replaced by the labelled bullet as `tighten-bodies` left it (the rule with "under every setting," restored), and the pairs above are then undone as before |
| review's flag row naming its two prompt references | a pair of kind `link` |
| any edit the list misses | the undo of every pair no longer matches the recorded hash, and the test fails |

The closure is DERIVED: the reconstruction equals the recorded hash only when the pairs account for every changed
byte. Each check carries a mutation shown to make it fail. An existing test SHALL change only to follow its
instruction to the text that remains, or a requirement this change modifies, and each such edit is named in the
change's archive (RG0):

| member | covered by |
|---|---|
| `chain-prompt-tags.test.ts`' rows for apply's Guardrails lines 4 and 7 | removed: the step 6 lines that state them already have their own rows, so the instruction's home stays asserted; the row for the kept line 3 is unchanged |
| an assertion that includes a provenance string (`NEW Step`, `(rc04a)`, `D-arc Stage`, a spec citation in a heading) | keeps its instruction and drops the provenance |
| a parity test anchored on a `CHECKED MIRROR` note | takes a new anchor on the copied text itself (a heading or the fence's first line); its byte-equality assertion is unchanged |
| a test tagged to a scenario this change modifies | follows the modified scenario |
| the decision-writing parity test | follows the restructured form, the constant held byte-equal in fourteen bodies until `records-by-setting` moved it to their references |
| `skill-templates-parity.test.ts`' per-body hashes | re-recorded, as for any template edit |
| `skill-body-budget.test.ts`' ceilings | each lowered to its body's new size plus 5% as a named edit, or kept where that would exceed it; explore's line ceiling and the assertion holding it at 664 follow `reduce-orbit-phase1`'s R-rop-8 and RG3 as amended to 669, the one rise |
| an assertion pinning removed text that fits none of the rows above | stops the edit: it is raised, not edited to pass |

The second table is sourced from a grep of `test/` for each removed string, the strings taken from the ledger's pairs.

#### Scenario: An unlisted edit fails the ledger

- **WHEN** a word is removed from a tightened body and no pair lists it
- **THEN** the undo of every pair does not match the recorded hash, and the test fails naming the body

#### Scenario: An instruction filed as provenance fails

- **WHEN** a pair of kind `provenance` removes a span the patterns do not cover — a mirror note together with the
  instruction after it, "The pass genre is a record and a header word; the gate reads nothing of it."
- **THEN** the test fails naming the pair and the words left uncovered

#### Scenario: A sentence that only names an owner is not a note

- **WHEN** a pair of kind `provenance` removes review's instruction "The owner's ONE exemption: architecture mode keeps
  its hand-computed per-doc iteration note …", which carries no mirror-note marker
- **THEN** the test fails naming the pair and the words left uncovered

#### Scenario: A restated line needs its step line

- **WHEN** a pair of kind `restated` names a step line the body no longer carries
- **THEN** the test fails naming the pair

#### Scenario: A cut stage's edits are undone first

- **WHEN** `cut-review-walk` has moved review's VERIFICATION procedure to a reference and its pairs are in the cut ledger
- **THEN** the tighten-bodies ledger undoes the cut ledger's pairs on today's review body first, and its own reconstruction
  of review's text at `ef55ee46` still matches the recorded hash

#### Scenario: A clause dropped from the bullet fails

- **WHEN** the decision-writing rule loses a clause of its one-paragraph form
- **THEN** the test fails naming the clause

### Requirement: A cut ledger names every body edit a cut stage makes

The system SHALL hold every edit a `reduce-orbit-phase2` cut stage makes to a generated body's `instructions` in a
cut-ledger test (`test/core/templates/cut-ledger.test.ts`), so that every change is named (that program's G0): before the
stage's first edit, the sha256 of each body it will edit is recorded, and the test lists every edit as a pair of one
kind, checks each kind, and undoes every pair, in reverse order, on today's body to compare with the recorded hash. Each
cut stage appends its own pairs and recorded hashes, a body a later stage edits again being recorded afresh by that
stage, whose undo runs first. A pair is of one kind:

| member | covered by |
|---|---|
| `moved` — text that leaves a body for a reference file, the body keeping its basic content | the pair names the span by a start and an end anchor, each unique in the reference, and records the sha256 of the text before the move; the undo replaces the basic content with the span read between the anchors, and where the reference already held that text before the move (a span it shared with the body) the undo copies it back into the body and adds nothing to the reference; the test asserts the span hashes to the recorded digest and that the body names the reference by path |
| `removed` — text a removal ruling takes | the pair names the ruling; the undo restores the text; the test asserts that a phrase the pair names, specific to the removed text, occurs nowhere in the generated skill, body or references |
| `reworded` — text a rewording replaces, a positional pointer that a move would make wrong included | the undo restores it; whether the rewording keeps its meaning is the reviewer's judgement, so the test asserts only the reconstruction |
| `restated` — text dropped because it restates a step the body keeps | the pair names the step text it restates; the undo restores the dropped text; the test asserts the step text is still in the body |
| `shared` — any of the three on a constant several bodies carry | undone in every carrier the pair names |
| `retired` — a whole workflow a removal ruling takes (its template, skill and launcher) | the pair names the ruling, the skill directory and the command id, and records no hash: no body remains to undo onto, so the pair is outside the reconstruction; the test asserts that no generated skill or launcher carries that directory or id, that both are in the retired-artifacts registry (`orbit-skill-generation`'s `Retired surface artifacts converge on update`), and that a phrase the pair names, specific to the workflow, occurs in no generated skill |
| an edit no pair lists | the undo does not reproduce the recorded hash, and the test fails naming the body |

The closure is DERIVED: the reconstruction equals the recorded hash only when the pairs account for every changed byte
of each body the ledger records; a workflow removed whole has no body and is held by its `retired` pair alone. Each check carries a mutation shown to make it fail. Text is reworded before it moves, so a moved text is
byte-equal to its source. Named limit — reference files are not hashed: a moved text's bytes are held by the `moved`
check and a removal's absence by its phrase check, but an edit inside a reference that is neither is outside this
ledger, and grading it is the stage's reviewers'.

#### Scenario: An unlisted edit fails the cut ledger

- **WHEN** a sentence of address-reviews' body is reworded and no pair lists it
- **THEN** the undo of every pair does not reproduce the recorded hash, and the test fails naming `orbit-address-reviews`

#### Scenario: A moved text changed in its reference fails

- **WHEN** a pair of kind `moved` names review's VERIFICATION procedure and a word of it is changed in
  `references/verification.md`
- **THEN** the test fails naming the pair, because the span between its anchors no longer hashes to the digest recorded before the move

#### Scenario: A removed text still present fails

- **WHEN** a pair of kind `removed` names R-rop2-12 and the phrase `walk_mode_source`, and a reference still carries it
- **THEN** the test fails naming the pair and the file that carries the phrase

#### Scenario: A retired workflow still generated fails

- **WHEN** a pair of kind `retired` names R-rop2-11, `orbit-bulk-archive-change` and `bulk-archive`, and the generator
  still emits that skill
- **THEN** the test fails naming the pair and the generated skill

#### Scenario: A shared constant is undone in each carrier

- **WHEN** the chain end step's tag paragraph leaves `CHAIN_END_STEP_BASIC` as one `shared` pair
- **THEN** the undo restores it in propose, ff, apply, review and address-reviews, and each of those bodies reproduces its
  recorded hash
