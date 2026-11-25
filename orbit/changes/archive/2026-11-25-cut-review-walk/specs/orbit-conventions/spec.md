## ADDED Requirements

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
| an edit no pair lists | the undo does not reproduce the recorded hash, and the test fails naming the body |

The closure is DERIVED: the reconstruction equals the recorded hash only when the pairs account for every changed byte
of each body. Each check carries a mutation shown to make it fail. Text is reworded before it moves, so a moved text is
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

#### Scenario: A shared constant is undone in each carrier

- **WHEN** the chain end step's tag paragraph leaves `CHAIN_END_STEP_BASIC` as one `shared` pair
- **THEN** the undo restores it in propose, ff, apply, review and address-reviews, and each of those bodies reproduces its
  recorded hash

## MODIFIED Requirements

### Requirement: No-chaining contract

The AI SHALL invoke at most the orbit workflow commands the user's message explicitly requests, plus the next command
the change status's `chain` object allows (`orbit-engine-gates`' `The change status says whether the next command may
run unasked`) — one command per explicit user request; without that allowance the AI recommends, never invokes.
Completing a command ENDS the turn at the position readout and the engine's canonical-next line (eligibility-framed,
per `orbit-engine-gates`); the AI SHALL NOT invoke the next orbit command — any `/orbit:*`
workflow, review iterations included — unless the user's message requests it or the `chain` object reports
`may_run: true` for it. When it does, the AI renders the position readout and the eligibility line, then one line naming
the command it runs and the setting key that granted it, and runs that command as the next act of the same turn; the
chained command ends the same way, so a chain continues until the object reports `may_run: false` (a chained archive
ends the chain at its completion readout and reads no object, because the command after it is not a change command), and the AI then
states its `why` in one line whenever `configured` is true — on `open-stop`, naming the object's `stop` record and
putting that stop's question to the user. A command run because the object allowed it records that as one sentence,
`Chained: granted by chain.<key>.`, in the record its session writes: a walk in its run summary's `final_assessment`,
an external review or a blind pair in its launch record's `final_assessment`, an in-context review in its pass's
`commentary` (the review emit owns a pass's `final_assessment`); a chained apply or archive records it as its
`consent: "setting"` value and writes no sentence, because the key and the command are one-to-one
(`orbit-lifecycle-consent`'s `Consent recorded in consent-scoped lifecycle emits`); a chained fresh review records nothing, because its
pass is written by a worker whose brief carries nothing from the session that dispatched it — a named limit. Only the session that invoked a
command reads the object at its end: a worker that session dispatched — a fresh reviewer, a blind pair's fresh half —
persists its pass and returns, and never chains. A command with no change target — an architecture-mode review, a
`--doc` walk, a project-wide walk — reads no object and ends at its readout. A chained external review or blind pair
needs a committed tree. Where the commit step commits (per `The commit step closes each carrying body`), it runs before this read, so the review arrives on a committed tree; anywhere else an uncommitted tree makes it write no run record, the object reports `no-progress`, and the AI
says the tree is uncommitted — a named limit. With no `chain` setting the object never allows a command,
and the contract holds exactly as without the setting. Blanket delegation
("follow the cadence", "take it through review") covers work WITHIN each explicitly requested
command (the passes of one review, the tasks of one apply), never the next command; gate `passed`
means *eligible*, not *commanded* — only the user's own `chain` setting commands. This contract is echoed in every generated workflow body
(the self-contained-disciplines pattern) and is the behavior layer the consent prompts
(`orbit-lifecycle-consent`) backstop at the consent-marked seams. The per-body echo MAY take
the EPITOME form (D-arc Stage D5's body economy): for no-chaining, ~2 structural-leaning lines
leaning on the turn-ending structure (position readout + eligibility line); for the
disciplines block generally, an epitome of one bullet per discipline with procedural detail moved to the
step that uses it (detail-to-situ) — the full normative text keeps ONE home (this capability's
discipline requirements), an epitome echo is COMPLIANT, and body-fidelity checks pin the
epitome form, not the pre-D5 full block. The bodies whose end can name a change's next command — propose, ff,
apply, review and address-reviews — carry the `chain` allowance in their echo and in their closing step, the chain end
step, which is carried in two halves (`reduce-orbit-phase1`'s R-rop-3 and R-rop-6, as `reduce-orbit-phase2`'s
R-rop2-14 amends it): its BASIC CONTENT — when it runs, the `chain` read (with the `--chain-ran`/`--chain-head` flags a
command a chain ran adds to it, since the read comes before the reference is opened), the `configured: false` result,
and one sentence telling a command a chain ran that what its prompts' tags mean, and what it records, is in
`references/chain-end-step.md`, to be read before its first tagged prompt when the session has not read it — composed once in code and carried byte-equal by each of those bodies; and the full
step, composed once in code (`CHAIN_END_STEP`, which carries the meaning of the three prompt tags (`(chain: target)`,
`(chain: routine, default: …)`, `(chain: decision)`) and what a chained command records) and carried byte-equal in each
one's `references/chain-end-step.md`, which the basic content tells the agent to read and follow, from the result it
already has, on any result but `configured: false`, a non-zero exit included. Each of those five bodies therefore points
at where its prompt tags are explained, and `(chain: not a prompt)` names itself. Named limit: a command a chain ran in
the session that chained it meets its tags after that session read `references/chain-end-step.md` at its chain end
step; a chained command in a fresh session, or after a compaction, learns their meaning by following its body's pointer
(R-rop2-14). Archive, which a chain can arrive at, carries `(chain: decision)` tags and no chain end step, so its body
neither explains nor points at them, as before; a chained archive relies on the tag meaning the arriving session read in
the chaining body's reference (`reduce-orbit-phase1`'s R-rop-6 as amended).

#### Scenario: Command completion ends the turn

- **WHEN** an orbit workflow command completes, a next command is eligible, and the change status's `chain` object
  reports `may_run: false`
- **THEN** the AI renders the position readout + the engine's canonical-next line and stops;
  it does not invoke the eligible command

#### Scenario: A granted next command runs in the same turn

- **WHEN** a fresh system review completes with findings and the `chain` object reports
  `next: "/orbit:address-reviews <change>"` and `may_run: true`, granted by `chain.address-reviews`
- **THEN** the AI renders the position readout and the eligibility line, names `/orbit:address-reviews <change>` and the
  key `address-reviews` in one line, and runs the walk; the walk's `final_assessment` carries
  `Chained: granted by chain.address-reviews.`, and at the walk's end it reads the object again

#### Scenario: A chain ends by stating why

- **WHEN** a chained command completes, `configured` is true, and the `chain` object reports `may_run: false` with
  `why: "not-granted"`
- **THEN** the AI renders the position readout and the eligibility line, states that the chain stops because the next
  command is not granted, and ends the turn

#### Scenario: A dispatched worker never chains

- **WHEN** a fresh reviewer — dispatched by `/orbit:review --fresh` or as a blind pair's fresh half — persists its pass,
  and the `chain` object reports `may_run: true` for `/orbit:address-reviews <change>`
- **THEN** the worker returns without reading the object or running the walk; only the invoking session's closing step
  may run it

#### Scenario: Blanket delegation does not cross commands

- **WHEN** the user has said "run the review cadence", no `chain` setting grants the next review, and one review
  command completes with the gate still unpassed
- **THEN** the AI reports position and recommends; the next review invocation is the user's
  (review-cycle COUNT is the user's call)

#### Scenario: Explicit multi-command requests are honored as scoped

- **WHEN** the user's message explicitly names multiple commands ("run a fresh review, then
  address its findings")
- **THEN** exactly those named commands are run — the request defines the scope; nothing beyond
  it is invoked unless the `chain` object allows it

#### Scenario: A chained apply records its grant in its consent value

- **WHEN** a proposal walk ends, the `chain` object reports `may_run: true` for `/orbit:apply <change> — user-invoked`,
  granted by `chain.apply`, and the walk's closing step runs apply
- **THEN** apply's emits carry `consent: "setting"`, and no `Chained:` sentence is added to their assessment

#### Scenario: Epitome echo is a compliant echo

- **WHEN** a generated body carries the ~2-line no-chaining epitome and the disciplines
  epitome (one bullet per discipline) instead of the full blocks
- **THEN** the body satisfies this contract's echo expectation — the full text's single
  normative home is this capability; fidelity and drift checks compare bodies against the
  epitome form, not the pre-D5 full block

#### Scenario: A granted commit reaches a chained external review committed

- **WHEN** `commit: true` and `push: true` are set, an attached change's apply closes on its branch with the work
  uncommitted, and the `chain` object reports `may_run: true` for `/orbit:review --as system --reviewer blind-pair <change>`
- **THEN** the commit step commits and pushes before the chain read, the pair's preflight finds a clean tree, and the
  pair writes its launch record, so the chain does not stop on `no-progress`

#### Scenario: Without a chain setting the basic content handles the result

- **WHEN** one of the five bodies is generated
- **THEN** its chain end step's basic content handles `configured: false` itself, printing nothing more, and names
  `references/chain-end-step.md` only for the other results

#### Scenario: Each chaining body points at the tags' meaning

- **WHEN** the propose, ff, apply, review and address-reviews skills are generated
- **THEN** each body carries the chain end step's basic content byte-equal, including the `--chain-ran`/`--chain-head` clause and
  the sentence pointing at `references/chain-end-step.md` for the tags' meaning, and carries neither the meaning of the three prompt
  tags nor the `Chained: granted by chain.<key>.` sentence; each skill ships `references/chain-end-step.md` holding
  `CHAIN_END_STEP` byte-equal, which carries both

### Requirement: An edit ledger holds every tightened body to its recorded text

The system SHALL hold every edit `tighten-bodies` makes to a body's instructions — in the twelve bodies it tightens,
and in explore and bulk-archive for the shared decision-writing bullet — in an edit-ledger test: the sha256 of each
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
| the decision-writing bullet restructured | one pair of kind `restructured`, shared by the fourteen bodies; the test asserts each clause of the one-paragraph form (the five conditions with their glosses, the eighteen areas, the three commands (`orbit emit stop`, `orbit emit resolution`, `orbit emit ledger`), the seam sentence, the record-routing sentence, the reference pointer) is in the rule, which `records-by-setting` moved to `references/decision-records.md`, its opening clause replaced as `Decision-writing discipline`'s `The labelled form keeps every clause` names |
| a `reduce-orbit-phase2` cut stage's edits | undone first, by the cut ledger's pairs in reverse order, on today's body; what remains is the body as `records-by-setting` left it |
| `records-by-setting`'s swap of the labelled bullet for its basic content | undone first in each of the fourteen bodies: the basic content is replaced by the labelled bullet as `tighten-bodies` left it (the rule with "under every setting," restored), and the pairs above are then undone as before |
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
