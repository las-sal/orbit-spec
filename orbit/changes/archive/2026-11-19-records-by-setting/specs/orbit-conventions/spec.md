## MODIFIED Requirements

### Requirement: Decision-writing discipline

The system SHALL tell the AI when to write each decision record (`orbit-decision-records`) by a fifth execution
discipline, DECISION-WRITING, carried in two halves (`reduce-orbit-phase1`'s R-rop-3 and R-rop-17): its BASIC CONTENT,
the fifth bullet of every generated workflow body's disciplines epitome, carried byte-equal by each; and its RULE, one
bullet whose label line is followed by five labelled sub-bullets (before asking, acting without asking, after a call,
not a stop, where records go), carried byte-equal by the `references/decision-records.md` each of those skills ships
(`Decision-record reference ships beside the statement`). The basic content:

```
- **Decision-writing (call-time)**: at each command's first step, and again after this session edits the project config (`orbit/config.yaml` or `.yml`), run `orbit decisions status --json`. On `write: true`, read `references/decision-records.md` and follow its rule for the rest of the command. On `write: false`, write no new ledger entry or stop record; a resolution answering a stop already in the trail, or a replacement fixing a record already there, is still written — read that reference when you write one.
```

It names the moment, the command, the usual result and the link, so an orbit command's result picks the branch, never
the agent's judgement (R-rop-4): `orbit decisions status` (`orbit-decision-records`' `orbit decisions status says
whether decision records are written`) reports `write: false` at the defaults, and the rule is then read only by a
session that answers or fixes a record already in its trail. On `write: false` the AI writes no NEW ledger entry or stop
record, but a record that answers or fixes one already in the trail is written whatever the result: a resolution
answering a stop already there (one written while a reader was on, or a `tripwire` stop orbit wrote), and a replacement
fixing a record a reading found wanting, since records written before this rule, or while a setting was on, are still
selected and read at the defaults (`orbit-decision-records`' `The reading step's brief is rendered by orbit`). Turning
the last reader off therefore strands no stop, and a reading finding is fixed at the defaults as before. The moments at
which a session's result can differ from the settings it works under:

| member | covered by |
|---|---|
| a command starts — typed, chained, or loaded mid-conversation | its first step runs the call, before any call or question the rule covers, and the result governs that command |
| the session itself edits the project config (`orbit/config.yaml` or `.yml`) | the call is run again after the edit |
| a compaction between commands | covered: the next command's first step runs the call |
| a dispatched worker (a fresh reviewer, a blind pair's fresh half) | its own command, so its own first call |
| a settings edit made outside the session while one command runs, or a compaction during one command | not covered — the named limit below |
| a record already in the trail awaits an answer or a fix | written whatever the result, so no result leaves it stranded |

Named limit — each command's start and the session's own edits are enumerable, but edits made from outside it, and a
result a compaction drops mid-command, are not.

Residual kind: a change to the project config made outside the session while one command runs (by the user's hand, another tool, a branch switch), or a result a compaction drops before the command ends

Residual method: the next command's first call reads the settings afresh; a review of a trail showing records missing under a reader, or written with none, finds one after the fact

The rule — the restructure `tighten-bodies` (`reduce-orbit-phase1`, R-rop-7) gave it, every clause, gloss and area
name of the one-paragraph form kept except its opening clause, "under every setting", which `records-by-setting`
replaced by the condition the basic content reads:

```
- **Decision-writing (call-time)**: when `orbit decisions status` reports `write: true`, keep a record of each call and each stop without changing what the user sees or is asked. What each record carries — its fields, its citations and the plain-language rule, with an example of each — is in `references/decision-records.md`, beside this skill; a refused record names the field to fix.
  - *Before asking*: BEFORE asking the user a question that a stop condition describes — `security-unprecedented` (a security-relevant call with nothing approved to rely on), `user-facing-uncovered` (an end-user-visible call no ratified goal covers), `ruling-amendment` (amending a ratified ruling or goal), `outward-act` (an outward or irreversible act the settings do not grant), `unresolvable-critical` (a CRITICAL review finding no edit inside the change resolves) — write a stop record (`orbit emit stop`), then ask exactly as you would have; with the user's answer, write a resolution naming that stop (`orbit emit resolution`).
  - *Acting without asking*: when `ruling-amendment`, `outward-act` or `unresolvable-critical` describes an act you take without asking — the user directed it (they told you to amend a ruling), or no flow asks — write its stop record before the act, then, when the user directed it, a resolution naming that stop whose answer is their direction, and otherwise leave the stop open.
  - *After a call*: AFTER any call that falls in a ledger area — however you reached it: without asking, after a question no condition describes, or with the user's answer to a stop — `user-sees-or-does`, `defaults`, `when-things-go-wrong`, `user-data`, `things-others-build-on`, `docs`, `who-can-get-in`, `secrets`, `network-exposure`, `trusting-input`, `new-dependencies`, `permissions-and-sandboxing`, `encryption`, `personal-data-and-privacy`, `cost`, `licensing`, `accessibility`, `performance-user-feels` — write a ledger entry (`orbit emit ledger`) citing what it relies on; when `security-unprecedented` or `user-facing-uncovered` describes the call, by its own gloss above, the entry cites nothing and names that stop: the one you asked at, or, where you would not have asked, one you write first — ask nothing and leave that stop open.
  - *Not a stop*: a designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — is a seam, not a stop, and writes nothing, unless a stop condition also describes it: then write the stop record first and fire the prompt as designed. A question no condition describes writes nothing, nor does a call in no area.
  - *Where records go*: a record names the work it belongs to (`--change <name>` for a change or a named exploration, or `--doc <doc>` in an architect session); in a session with neither (a project-wide run, an unnamed exploration), or on an archived change (orbit writes no record to its trail), write no record, never attaching it to other work.
```

The two fences are the owners. A generated skill cannot read this spec, so the rule its reference carries names the stop
conditions and ledger areas themselves; the ids are those `orbit-decision-records` defines (its event table's five conditions a
payload may raise, and `The ledger's eighteen areas`), composed in code from the same lists the write gate checks, and
a parity test holds each composed half equal to its fence. The moments the rule names, and what each writes while
`orbit decisions status` reports `write: true`:

| moment | writes |
|---|---|
| the AI is about to ask the user a question a stop condition describes | a stop record, then the question, asked exactly as without the record |
| the user answers that question | a resolution naming the stop |
| an act `ruling-amendment`, `outward-act` or `unresolvable-critical` describes, taken without asking — the user directed it, or no flow asks | a stop record before the act; when the user directed it, a resolution naming the stop whose answer is that direction; otherwise the stop stays OPEN |
| a call in a ledger area that neither `security-unprecedented` (a security-relevant call with nothing approved to rely on) nor `user-facing-uncovered` (an end-user-visible call no ratified goal covers) describes, however it was reached (without asking, after a question no condition describes, or with the user's answer to a stop) | a ledger entry citing what it relies on |
| a call in a ledger area one of those two conditions describes, each by its own gloss, put to the user as a question | a stop record of that condition, then the question, then, after the answer, the resolution and the ledger entry citing nothing and naming the stop |
| a call in a ledger area one of those two conditions describes, made without asking (where today's flow asks nothing) | a stop record of that condition, then the ledger entry citing nothing and naming it; nothing is asked, and the stop stays OPEN — no resolution answers it |
| a designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — that no stop condition describes | nothing: a designed seam is not a stop |
| a designed prompt a stop condition also describes (a gate's inflection prompt over a CRITICAL finding no edit inside the change resolves: `unresolvable-critical`) | a stop record, then the prompt as designed; with the user's answer, the resolution naming the stop |
| a question no condition describes | nothing for the question itself; a call it leads to is a call row |
| a call in no ledger area | nothing |
| any moment in a session with no change and no architecture doc (a project-wide audit-drift run, an unnamed exploration, an onboard read), or on an archived change (an address-reviews walk of its trail) | nothing: decision records have no project-wide home (`orbit-decision-records`' `Where decision records are kept`), the emit surface writes none to an archived change's trail (a decision is recorded while the work is live), and a record is never attached to work it does not belong to |
| a `tripwire` stop | nothing from the AI: orbit raises it (stage `tripwires` of `automate-dev-flow`), and a payload naming it is refused |

The table is closed by derivation: a moment is either a question for the user — a stop condition, a seam no condition
describes, a seam one does, or neither — or an act a directly raised condition describes, taken with no question (the
user directed it, or no flow asks), or a call the AI makes, however it was reached (without asking, after a question no condition describes, or with
the user's answer to a stop) — in an area neither ledger condition describes, in an area
one does (asked, or not asked), or in none — and every branch is a row; a moment in a session with no home for a
record — no change and no doc, or an archived change — is its own row whatever its branch. The two ledger conditions
are read each by its own gloss, as R-adf-3 rules them: an end-user-visible call that a requirement supports but no
ratified goal covers is `user-facing-uncovered`, and its entry cites nothing and names that stop. While `orbit decisions status` reports `write:
false` — at the defaults — the AI writes no new record at any of these moments, and they go unrecorded by design (a
resolution answering a stop already in the trail is still written)
(`orbit-decision-records`' `Decision records are written when a setting reads them`). While it reports `write: true`,
the discipline changes nothing the user sees or is asked: a stop record keeps the moment and halts nothing unless a
setting says so, and an OPEN stop — one written where today's flow asks nothing — is expected: it marks a moment a
later setting may halt on. Named limit — a moment in a session
with no change and no doc, or on an archived change, goes unrecorded, and nothing tells the user so. Whether a moment
WAS recorded is a reader's judgement, graded at `automate-dev-flow`'s first-run (G2, G4): orbit checks a record's form
when it is written, never that a record was owed.

#### Scenario: Every workflow body carries the basic content

- **WHEN** each generated workflow skill that carries a disciplines epitome is generated
- **THEN** its epitome carries the basic content byte-equal to its fence, as its fifth bullet after no-chaining, and no
  body carries the rule's fence

#### Scenario: At the defaults the body directs no record

- **WHEN** a generated body is read in a project that sets no `chain`, `signoff` or `tripwires` key
- **THEN** `orbit decisions status --json` reports `write: false`, and the basic content the body carries says that on
  `write: false` no new ledger entry or stop record is written

#### Scenario: A stop already in the trail is answered at the defaults

- **WHEN** a stop record written while `chain.review: true` was set is still open, the session turns chaining off and
  runs `orbit decisions status` again, which reports `write: false`, and the user then answers the stop's question
- **THEN** the AI writes a resolution naming that stop, and the stop is closed

#### Scenario: A reading finding is fixed at the defaults

- **WHEN** at the defaults a system review's reading step finds a ledger entry written before this rule unclear, and the
  walk resolves the finding
- **THEN** the walk writes a replacement of that entry, as `orbit-decision-records`' `A record is fixed by a replacement,
  never edited` says, and writes no new ledger entry

#### Scenario: The basic content names when the command runs

- **WHEN** the basic content is read
- **THEN** it names each command's first step, and an edit of the project config (`orbit/config.yaml` or `.yml`) by
  the session, as the moments `orbit decisions status` runs, and says the result governs the rest of the command

#### Scenario: The statement is composed from the write gate's lists

- **WHEN** the composed rule is read
- **THEN** it names every stop condition a payload may raise and every ledger area, in the lists' order, and does not
  name `tripwire`; a parity test holds it equal to this fence

#### Scenario: A stop record precedes the question it keeps

- **WHEN** while `orbit decisions status` reports `write: true`, the AI is about to ask the user whether to amend a ratified ruling
- **THEN** it writes a stop record of condition `ruling-amendment` first, then asks exactly as it would have, and on
  the user's answer writes a resolution naming that stop

#### Scenario: A call put to the user leaves all three records

- **WHEN** while `orbit decisions status` reports `write: true`, the AI is about to ask the user how to handle a security-relevant call with nothing
  approved to rely on
- **THEN** it writes a stop record of condition `security-unprecedented`, asks exactly as it would have, writes a
  resolution naming that stop with the user's answer, and, once it makes the call, a ledger entry whose `raised_stop`
  names that stop

#### Scenario: A call relying on nothing, made without asking, names an open stop

- **WHEN** while `orbit decisions status` reports `write: true`, the AI picks a default that a spec requirement supports but no ratified
  goal covers, where today's flow asks nothing
- **THEN** it writes a stop record of condition `user-facing-uncovered`, then a ledger entry with `relies_on: []`
  whose `raised_stop` names that stop; it asks the user nothing, and no resolution is written

#### Scenario: A session with no change and no doc writes no record

- **WHEN** during a project-wide `/orbit:audit-drift` run the AI is about to ask the user a question a stop condition
  describes
- **THEN** it writes no decision record and asks exactly as it would have

#### Scenario: An act the user directed writes its stop and its resolution

- **WHEN** while `orbit decisions status` reports `write: true`, the user tells the AI to amend a ratified ruling, and the AI amends it without asking
  anything
- **THEN** it writes a stop record of condition `ruling-amendment` before the amendment, and a resolution naming that
  stop whose answer is the user's direction

#### Scenario: A walk of an archived change writes no record

- **WHEN** during `/orbit:address-reviews` on an archived change the AI makes a call in a ledger area
- **THEN** it writes no decision record: the emit surface writes none to an archived change's trail

#### Scenario: A call after a clarifying question writes its ledger entry

- **WHEN** while `orbit decisions status` reports `write: true`, the AI asks the user a clarifying question no stop condition describes, then makes a
  call in a ledger area that something approved covers
- **THEN** it writes a ledger entry citing what the call relies on, and no stop record

#### Scenario: A seam prompt writes nothing

- **WHEN** the AI asks the user for consent at a consent-marked seam, or fires a gate's inflection prompt, and no stop
  condition describes the prompt
- **THEN** no decision record is written: the prompt is a seam, not a stop

#### Scenario: A seam a stop condition describes writes its stop first

- **WHEN** while `orbit decisions status` reports `write: true`, a gate's inflection prompt is about to fire over a CRITICAL review finding no edit inside
  the change resolves
- **THEN** the AI writes a stop record of condition `unresolvable-critical`, fires the prompt exactly as designed,
  and on the user's answer writes a resolution naming that stop

#### Scenario: The labelled form keeps every clause

- **WHEN** the rule is compared with its one-paragraph form before `tighten-bodies`
- **THEN** every stop condition with its gloss, every ledger area, every command and every clause of the earlier form
  is in it but the opening "under every setting", replaced by "when `orbit decisions status` reports `write: true`";
  only the connecting words, the place of the reference pointer and that one clause differ, and a test holds each
  clause and names the replacement

### Requirement: Decision-record reference ships beside the statement

Every generated workflow skill whose epitome carries the decision-writing basic content SHALL ship the reference
`references/decision-records.md`, one constant shared by every such skill, so that the basic content's pointer names a
file the installed skill holds. The reference opens with one sentence saying it is read when `orbit decisions status`
reports `write: true`, or when a record already in the trail is answered or fixed, that its first section says WHEN to
write a record and the rest WHAT each one holds, and that on `write: false` that section's `write: true` condition does
not cover such an answer or fix, which follows the record's own section and `Fixing a record`; its first
section, `## When to write a record`, carries the decision-writing RULE byte-equal to `Decision-writing discipline`'s
rule fence. It then says, for each of the three records (`orbit-decision-records`):

- the command and the payload form: a JSON file passed with `--payload <file>`, carrying `model` (a model id or
  `null`) and the work it belongs to given as `--change <name>` or `--doc <doc>`;
- its fields, composed in code from `DECISION_PAYLOAD_FIELDS`, each with the form the write gate accepts;
- for a ledger entry, the citation kinds of `relies_on`, composed from the write gate's citation shapes, and the
  `[]`-with-`raised_stop` form;
- the plain-language rule: the fields `orbit-decision-records` binds as plain (`decided`, `alternatives`,
  `why`, `about`, `question`, `answer`, `effect`, composed from that requirement's table) are written for a reader who knows only the program's architecture doc, and any other
  term the record uses is defined in `defines`;
- one example payload per record, a fenced `json` block under that record's heading, which a test submits unchanged
  through the record's `orbit emit` command, in a disposable project seeded with what the example cites (the stop a
  resolution or ledger entry names, the requirement or ruling it relies on), and which the gate accepts.

The reference documents no emit schema block and carries no `json example` block, so it is outside the set
`orbit-emit-composition`'s `Payload schema references are proven by execution` counts and seeds; its examples are
executed by this requirement's own test.

The reference holds both halves of what the body leaves to it: when to write a record (the rule) and what a record
holds; the body's basic content says only when to read it.

#### Scenario: The reference carries the rule whole

- **WHEN** the reference is read
- **THEN** its first section, `## When to write a record`, carries the decision-writing rule byte-equal to
  `Decision-writing discipline`'s rule fence, and its Contents list names that section first

#### Scenario: The reference lets an answer or a fix through at write: false

- **WHEN** the reference's opening sentence is read
- **THEN** it says the reference is also read when a record already in the trail is answered or fixed, and that on
  `write: false` the rule section's `write: true` condition does not cover such an answer or fix, which follows the
  record's own section and `Fixing a record`

#### Scenario: Every skill carrying the basic content ships the reference

- **WHEN** the generated workflow skills are generated
- **THEN** every skill whose epitome carries the decision-writing basic content ships `references/decision-records.md`,
  byte-equal across them, and no other skill ships it

#### Scenario: The reference's fields are the write gate's

- **WHEN** the reference is read
- **THEN** it names, for each record, every field `DECISION_PAYLOAD_FIELDS` lists for that command and no other besides `model`, and
  every citation kind the write gate accepts

#### Scenario: Each example passes the write gate

- **WHEN** each example payload in the reference is submitted through its `orbit emit` command, in a disposable
  project seeded with what it cites
- **THEN** the gate accepts it and writes the record

### Requirement: An edit ledger holds every tightened body to its recorded text

The system SHALL hold every edit `tighten-bodies` makes to a body's instructions — in the twelve bodies it tightens,
and in explore and bulk-archive for the shared decision-writing bullet — in an edit-ledger test: the sha256 of each
edited body's `instructions` is recorded before the first edit, and the test lists every edit as a (before, after)
pair of one kind, checks each kind, and undoes every pair on today's body to compare with the recorded hash, first
undoing the one later edit to those bodies, `records-by-setting`'s:

| member | covered by |
|---|---|
| a Guardrails line removed as restated | a pair of kind `restated`, naming the step line that states it; the test asserts that line is still in the body |
| a provenance span removed | a pair of kind `provenance`; the test asserts the removed span is COVERED by the patterns in `Tightened bodies carry no provenance` — every character a token match or a connector once its mirror-note spans are taken out — so no instruction is filed as provenance |
| an id dropped from a name | a pair of kind `provenance` at each use; the test asserts the id-bearing name occurs nowhere in the body |
| a mirror note removed | a pair of kind `provenance`; the copied text after it is held unchanged by its parity test |
| the decision-writing bullet restructured | one pair of kind `restructured`, shared by the fourteen bodies; the test asserts each clause of the one-paragraph form (the five conditions with their glosses, the eighteen areas, the three commands (`orbit emit stop`, `orbit emit resolution`, `orbit emit ledger`), the seam sentence, the record-routing sentence, the reference pointer) is in the rule, which `records-by-setting` moved to `references/decision-records.md`, its opening clause replaced as `Decision-writing discipline`'s `The labelled form keeps every clause` names |
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

#### Scenario: A clause dropped from the bullet fails

- **WHEN** the decision-writing rule loses a clause of its one-paragraph form
- **THEN** the test fails naming the clause
