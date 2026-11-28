## Context

`reduce-orbit-phase2`'s stage `cut-explore-onboard` (its charter and exit criteria are in
`orbit/architecture/reduce-orbit-phase2.md`) applies the inventory's cut lists for explore and onboard
(`orbit/explore/inventory/sketches/explore-propose-archive-onboard.md`; D-inv-5, D-inv-12, D-inv-16) and Sal's
removal of explore's illustrative upstream text (R-rop2-13). At this propose Sal also brought in D-inv-2's shortening
of the decision-writing bullet. That shortening was decided once for every body carrying the bullet, deferred by
`cut-review-walk` "to a later cut stage", and not taken by `cut-propose-archive`. None of the cuts is marked for the
replay set (R-rop2-10).

Sizes below are from `npm run size:report` at `9a122611` (characters / 4, the generated `SKILL.md` with its frontmatter).
The spans were measured on the generated bodies at propose:

| body | now | spans that leave | basic content added | after the moves and removals | after R3 / rewording |
|---|---|---|---|---|---|
| `orbit-explore` | 11,904 (47,616 chars, 664 lines) | X1 about 6,100 chars; D-inv-5 14,758 (the grammar, closure, nine moves, exemplar 11,473; concluding 3,285); E1 2,016; E2 about 2,200 (the emit section's payload detail, engine-owned fields and rationale; its timing stays); E3 1,048; R2 800 | about 1,800 chars | about 22,600 chars, about 5,650 | about 4,800 |
| `orbit-onboard` | 5,610 (22,440 chars) | none moved | — | — | about 4,750 (R1 about 1,300 chars, provenance about 250, the two PR-layer paragraphs and the longest phase paragraphs about 1,800) |

Explore does not fit on its moves alone, unlike the sketch's projection (4,926). Two corrections from reading the
baseline specs at propose account for the gap. E2 cannot move the emit timing: `orbit-run-summary-emit`'s `A body reads
its run-summary detail before the session's first run-summary emit` keeps "when the emit fires … the sweep before it"
in the body. E1 cannot move the "substantive decision" test, because the Mode C prompt fires on it. Explore fits only
once R3 tightens the orbit prose that stays, by about 15% (D2). The shortened decision-writing bullet takes 73
characters more from every body that carries it (514 to 441; D-inv-2 estimated about 140).

The bodies are composed in `src/core/templates/workflows/explore.ts` and `onboard.ts`. Explore interpolates the three
productions `src/core/explore-grammar.ts` exports (`orbit-emit-composition`'s `The explore grammar has one source in
code`). The decision-writing bullet is `DECISION_WRITING_BASIC` in `src/core/disciplines.ts`, interpolated by thirteen
bodies: apply, archive, architect, address-reviews, audit-drift, continue, explore, ff, new, propose, review, sync-specs
and verify.

## Goals / Non-Goals

**Goals:**

- Explore and onboard each at most 5,000 estimated tokens (G1). Their character ceilings in `skill-body-budget.test.ts`
  come down, and explore's line ceiling goes, since it falls under the 500-line limit every other body keeps (G2).
- R-rop2-13's removal done and named, as an edit to explore's upstream portion that `Generated-file disposition`
  requires a delta to name (G0, R-rop2-4).
- The decision-writing bullet shortened in all thirteen carriers, its three branches and its link kept (D-inv-2).
- Every edit named (G0): the removal by its ruling, and every edit to a body's instructions as a pair in the cut ledger.
- For every cut that is not a removal, behaviour is kept: a session reads the same text at the step that uses it.

**Non-Goals:**

- Moving onboard's PR-layer paragraphs to a reference (the inventory's O1; D4).
- Editing explore's upstream portion beyond R-rop2-13's named removals. R3 tightens orbit's additions only.
- Any replay run (R-rop2-10).
- The rule half of decision-writing (`references/decision-records.md`): only the basic content is shortened.

## Decisions

### D1 — Explore's six moves, each read at the moment it serves

Each move keeps the step's heading and basic content in the body and moves its procedure byte-equal to a reference
(`skill_body_convention.md`). Every reference is a one-line title followed by its exported constant in `explore.ts`.
Positional pointers inside a moved span, and the emit timing the body keeps (D2), are reworded first, so the moved text is
byte-equal to its source.

| move | leaves the body | reference | the body keeps | read when |
|---|---|---|---|---|
| D-inv-5a | "Mechanism entries — the grammar", "Closure is ACCOUNTED, not CLOSED", "The nine moves, applied per rule", "Exemplar — two conforming entries" (with the interpolated `EXPLORE_MECHANISM_ENTRY_PRODUCTION`) | `references/mechanism-entries.md` | the first heading; which rules owe an entry (`Kind:` rule or absent, `Disposition:` live or absent) | before writing or editing a Mechanism entry: a rule captured, a Mechanism entry swept at a boundary, a resume adding the section |
| D-inv-5b | "Concluding an exploration", whole, with reopening | `references/concluding.md` | the heading; that a conclusion is written only on the user's word, the AI recommending and never inferring it | on the user's word to conclude or to reopen |
| E1 | "Crystallization to named change", whole | `references/crystallization.md` | the heading; that no file is written before the reference's warning is confirmed | when a bare exploration is about to be named: the user asks to save it under a name, or accepts the Mode C prompt |
| E2 | the emit section (`## Run-summary emit (named-mode only)` and its subsections, crystallization excepted) | `references/run-summary-emit.md`, holding the section whole as the body carried it, its timing reworded first (D2) | when each emit fires: the BEGIN emit after the scaffold (Mode C back-filling first), the two boundary rules and what is not a boundary, the wrap-phrase convention, the residency sweep before every boundary emit, no retro-fire, bare mode's non-emission; the `orbit emit explore` command; the shared read cue | before the session's first emit (the shared cue) |
| E3 | "Minimal explore metadata", whole | `references/new-exploration.md` | the heading | when a new named exploration is scaffolded (Mode B new, or Mode C after its confirmation), or a resumed one lacks its `.openspec.yaml` |
| E4 (Sal, at apply) | the Decisions entry's classification prose, after R3: the one-claim RULE/FACT/SCOPE test and the `Kind:` and `Disposition:` bullets | `references/decision-entries.md` | the production fence; the defaults (an absent `Kind:` means `rule`, an absent `Disposition:` `live`); the well-formed-ID sentence | before the session's first Decisions entry |

E4 was added at apply. After every planned move, removal and R3 rewording, and the shortened bullet, explore measured
20,914 characters (about 5,229 estimated tokens), 914 over. Per Risks the stage raised it to Sal with the candidates,
and Sal chose this move over further upstream removals or leaving explore over (2026-11-27). The production fence stays
in the body, since every named session writes entries. The prose that explains the slots is read before the first one.

Mode C's row and the crystallization step's "(and the minimal `.openspec.yaml`, as in Mode B)" are reworded first to name
`references/new-exploration.md`, so a confirmed crystallization reads the metadata fields and the citation offer before
it scaffolds, rather than reaching them through Mode B.

The "substantive decision" test stays in the body: the Mode C prompt fires on it, so it is read before any reference.
The status header and Decisions-entry productions stay in the body, since every named session writes them (E4 moves the
Decisions entry's prose, not its production).
The paragraph saying the three productions are mirrors is reworded: two are in the body and the Mechanism production is
in its reference. The six-section scaffold's Mechanism placeholder now points at that reference, where it said "the
entry grammar below".

E2 follows `orbit-run-summary-emit`'s table rather than the sketch, which moved the timing too. A session that has not
yet read the reference still needs to know when to emit. Explore becomes the twelfth body under the rule: the same
`RUN_SUMMARY_READ_CUE`, byte-equal, and a `references/run-summary-emit.md`. Its crystallization subsection is the one
part of the section that is not read at the first emit. It runs in bare mode, before any file exists, so it leaves
the emit section for its own reference. The MODIFIED requirement names it, as it names address-reviews' exception.

Chosen over modifying the table to let explore's timing move: the table's rule is what lets a compacted or unread
session still emit at the right moment, and explore's boundary emits are its most-run instruction.

### D2 — R3 tightens orbit's additions, the upstream portion edited only by R-rop2-13

R3 rewords the orbit prose that stays, with no step removed:

- the additions' opening and the epitome's introduction;
- Mode B's table row, which restates the re-entry table;
- the re-entry table's edge paragraph;
- the six-section scaffold's placeholders;
- the Decisions entry's Kind and Disposition prose, its classification test kept;
- the capture types and offer rules;
- the emit timing that stays, with its stage tags, reworded BEFORE E2 moves the section, so the body and the reference
  carry one wording (the read-cue test holds every paragraph the body keeps verbatim in the reference);
- the mirror notes and stage tags of the other text that stays, removed the way `Tightened bodies carry no provenance` removes
  them from the twelve bodies it names: the instruction stays, and the copied text stays byte-equal, held by its parity test.

R2 shortens "Composition with `/orbit:propose`" to at most two sentences, which keep three facts: `/orbit:propose <name>`
consumes `orbit/explore/<name>/explore.md` as authoritative and moves the staging directory, its sibling files included,
to `orbit/changes/<name>/`; a BOUNDED residual's two slots are carried at promotion by `orbit-propose-modifications`'
`Mechanism section consumption`; and a concluded exploration is refused at propose and reopened here first. What leaves
is read elsewhere: the open-question prompt and the generated artifacts in propose's own consume mode (a
reference of the propose skill, which explore's body names as propose's, never as a path of its own), the residual's two destinations in the closure section the pointer names
(`references/mechanism-entries.md`), and the reopen in `references/concluding.md`. The rationale paragraph goes.

Each rewording is a `reworded` pair in the cut ledger. Whether it keeps the meaning is the reviewers' judgement. The
re-entry table, the status-header and Decisions-entry fences and the "substantive decision" test are not reworded.
Their parity tests and the specs that own them hold them byte-equal.

The upstream portion changes only by R-rop2-13's removals, which `orbit-explore-modifications`' `Upstream explore
stance preserved` names one by one:

| upstream text | edit |
|---|---|
| "Handling Different Entry Points", its four dialogues, its heading and the `---` separator that closes it | removed (R-rop2-13) |
| the `**Visualize**` label and its ASCII box | removed (R-rop2-13); the stance's "Visual" bullet says to use ASCII diagrams liberally |
| "Ending Discovery"'s summary template | removed (R-rop2-13); its point is kept by joining the sentences around it into "When it feels like things are crystallizing, you might summarize what you figured out, but this summary is optional.", the one reworded upstream sentence |
| Guardrails: "Don't implement" | restated: the opening's IMPORTANT paragraph |
| Guardrails: "Don't rush", "Don't force structure" | restated: the stance's "Patient" bullet |
| Guardrails: "Don't auto-capture" | kept: Orbit Awareness step 4 says it only under "When a change exists", so no line states it at its scope (Sal, at the proposal walk) |
| Guardrails: "Do visualize" | restated: the stance's "Visual" bullet |
| Guardrails: "Do explore the codebase" | restated: the stance's "Grounded" bullet |
| Guardrails: "Don't fake understanding", "Do question assumptions" | kept: no other line says either ("Including the user's and your own" adds to "Challenge assumptions") |

The Guardrails lines are `restated` pairs, each naming the line that states it (the test asserts that line is still in
the body). `orbit-conventions`' `Restated Guardrails lines are removed from orbit-modified bodies`, whose sourcing sentence
said explore's lines were untouched until phase 1's evaluation, is MODIFIED to point them at this table, so one list has
one rule. The other three rows are `removed` pairs naming R-rop2-13, each with a phrase that leaves the skill entirely
(`COLLABORATION SPECTRUM`, `Use ASCII diagrams liberally        │`, `## What We Figured Out`). The joined sentence is a
`reworded` pair.

### D3 — The decision-writing bullet, shortened with its three branches

`DECISION_WRITING_BASIC` becomes:

```
- **Decision-writing (call-time)**: run `orbit decisions status --json` at each command's first step and after this session edits `orbit/config.yaml` (or `.yml`). On `write: true`, follow `references/decision-records.md` for the rest of the command. On `write: false`, write no new ledger entry or stop record; still write a resolution answering a stop already in the trail or a replacement fixing a record there (read that reference first).
```

It keeps the moment and the config re-run, the command, the `write: true` read, and the `write: false` branch with the
two records it still writes and its read: "still write" keeps the positive verb today's "is still written" carries, since
a resolution is neither a ledger entry nor a stop record and so is no exception to that list. It is 441 characters, 73
fewer than today's 514. D-inv-2 estimated about 140 fewer; going further
would drop a word one of the branches needs (the two records' "answering" and "fixing", the path). `Decision-writing discipline`'s basic-content fence is MODIFIED to this text. The sentence
after the fence ("It names the moment, the command, the usual result and the link") and the moments table stay true and
are carried unchanged. `decision-writing-parity.test.ts` holds the constant equal to the fence. Its `toContain` checks
follow the new words (the test's own phrases "again after this session edits the project config" and "follow its rule"
move with them).

In the cut ledger the bullet is one `shared` pair of kind `reworded`, undone in all thirteen carriers. Phase 1's
tighten-bodies ledger undoes the cut ledger first, then `records-by-setting`'s swap of the labelled bullet for the basic
content, which it finds by `DECISION_WRITING_BASIC`. After the cut ledger's undo, the bodies again carry the
`records-by-setting` text. So `tightened-bodies.test.ts` gains that text as a recorded constant and swaps on it, rather
than on today's `DECISION_WRITING_BASIC`.

### D4 — Onboard fits by rewording in place, not by moving its PR layer

The inventory's O1 moved onboard's two PR-layer paragraphs to `references/pr-layer.md`, read when the project sets `pr:`
or the user asks about pull requests. `orbit-onboard`'s `Canonical-flow walkthrough section` says otherwise. Its "PR
lifecycle taught where it happens" scenario says the propose and archive paragraphs teach the layer whatever the reading
project's `pr:` says, because the body is one generated constant. Its "Config vocabulary and the human boundary stated
once" scenario places the three values and the human boundary in or beside the propose paragraph. O1 would have to
modify both scenarios and add a fifth capability, over the ceiling Sal has already declared one breach of. Onboard fits
without it:

- R1: the execution-disciplines list becomes one line each, all five named (the identity scenario names them), still
  under "**Execution disciplines** codified in `orbit-conventions`".
- The stage tags (`D-arc Stage D2` to `D6`) leave the text that stays.
- The two PR-layer paragraphs are tightened in place, keeping every fact the two scenarios require: the three `pr:`
  values and the default, where the key lives, the citation selecting the target with the uncited fallback, the one-note
  degradation, READY as orbit's terminus, merging as the user's act, the tail's steps and the program PR's append.
- The longest phase paragraphs (run-summary emission, cold-start orientation, propose, address-reviews, system review)
  are tightened. Measured at apply, these left onboard at about 5,056 tokens. The four next longest (explore, proposal
  review, apply, archive), the address-reviews table row, the opening notes and the editorial-review bullet were then
  tightened too, the same way and keeping every fact, so onboard fits.
- "15 commands" becomes 14, matching the table's fourteen rows. It is residue of bulk-archive's removal at
  `cut-propose-archive`.

Each edit is a `reworded` pair. Chosen over O1 because a reading that starts from onboard teaches the PR layer at both
seams in every project, as the spec intends.

### D5 — The cut ledger records fourteen bodies for this stage

`CUT_STAGES` gains `cut-explore-onboard`. Before the first edit, this stage records, from HEAD, the `instructions` hash
of every body it edits: explore, onboard, and the twelve other carriers of the bullet (fourteen bodies; onboard carries
no epitome). Eight of them already carry an earlier stage's hash: address-reviews, review, apply, ff, propose, archive,
sync-specs and onboard. The per-stage reconstruction undoes this stage's pairs first and compares with this stage's
hashes, as `cut-propose-archive` set up.

| edit | pair kind |
|---|---|
| D1's six moves | `moved`, anchors unique in each new reference |
| the pointers and the emit timing reworded before a move, R2, R3, D2's joined sentence, D4's rewordings | `reworded` |
| D2's Guardrails lines | `restated` |
| D2's three upstream removals | `removed`, naming R-rop2-13 |
| D3's bullet | `shared` (`reworded`), naming its thirteen carriers |

Text is reworded before it moves, so a moved span is byte-equal to its source.

### D6 — Ceilings come down after the last edit

After the last body edit (the walks' included), each edited body's ceiling comes down the way `cut-review-walk`'s D7 did:

- a body that fits G1 gets the smaller of its size plus 5% and 20,000 characters;
- any other edited body gets its size plus 5%, unless that exceeds its current ceiling;
- each lowering is a named edit naming its previous ceiling.

Explore's `LINE_CEILING` entry is deleted, and the test holding it at 664 becomes one holding every body under 500
lines. That is a lowering (G2), and `skill_body_convention.md`'s budget rule and Exceptions paragraph say so.

## Alternatives considered

- **Moving explore's emit timing too (the sketch's E2):** it breaks `orbit-run-summary-emit`'s placement table, and a
  session that has not read the reference would not know when to emit (D1).
- **Moving onboard's PR layer (O1):** it changes what `orbit-onboard` designs as unconditional teaching, and needs a
  fifth capability (D4).
- **Further upstream removals to give explore margin:** `What You Might Do`, the Orbit Awareness example offers. No
  ruling covers them (G0). They are the candidates Sal would be asked about if explore is still over after R3 (Risks).
- **Leaving the decision-writing bullet to the close:** Sal took it here (propose, 2026-11-25).

## Risks / Trade-offs

- [Explore fits only with R3's tightening of about 15% of the orbit prose that stays, against the sketch's 10%.] → Apply
  measures `npm run size:report` after the moves and removals, before R3. A body still over 5,000 after R3 meets the
  inventory's re-entry trigger ("a cut stage finds a body that its cut list does not bring under 5,000"). The stage
  then raises it to Sal, naming the candidates (Alternatives), rather than cutting further without naming the cut.
- [A session reads a reference late: it writes a Mechanism entry before `mechanism-entries.md`, or a crystallized
  exploration's files before `crystallization.md`'s warning.] → Each body read names its moment as a "before". The
  crystallization read happens before any file is written, and the Mode C prompt and its test stay in the body.
- [A compaction drops a reference read mid-session.] → The body keeps every moment, and the reads are unconditional at
  those moments. As for the other eleven emit steps, a compaction after the first emit is `orbit-run-summary-emit`'s
  named limit, which this change carries to explore, citing R-rop-18 for why no re-read is added (Sal, at the proposal
  walk). A named exploration compacted after BEGIN still emits at each boundary from its body, and a payload composed
  without the reference is refused by the emit surface, naming the field (`model` missing, an engine-owned or unknown
  key).
- [The replay set's `explore` case breaks the section `## Run-summary emit (named-mode only)`.] → Its `break:` gains
  `remove: [references/run-summary-emit.md]`, which `test/replay/cases.test.ts` requires of every case whose skill
  installs an emit reference. The case is not run for this stage (R-rop2-10). Its graders read the trail and the
  printed path, which E2 does not change.
- [The shortened bullet loses a nuance the rule depends on.] → The three branches and both records still written stay word for
  word in meaning, and `decision-writing-parity.test.ts`' clause checks follow them. D-inv-2 marked it as not replayed,
  and the reviewers grade it.
- [`orbit-explore-modifications`' "Implementation guardrail preserved" scenario after "Don't implement" leaves the
  Guardrails.] → The opening's IMPORTANT paragraph carries the refusal, which is the line the `restated` pair names.

## At archive

- The Shipped as names R-rop2-13's removal (each of D2's upstream edits), the inventory's O1 not taken and why (D4),
  the decision-writing bullet taken at Sal's word, the tests each edit followed, and the measured sizes.
- `skill_body_convention.md`'s Exceptions paragraph says no body is outside the convention.
- The Shipped as says D4 removed onboard's stage tags, and that the "D-arc Stage D2" which `orbit-onboard`'s
  `Enumerates orbit-distinctive layers` scenario names beside program architecture is provenance the body need not carry
  (the system walk; no delta, since neither of the scenario's tests asserts the tag).

## Touchpoints

- `src/core/templates/workflows/explore.ts` — the body; six new references (`mechanism-entries.md`, `decision-entries.md`, `concluding.md`, `crystallization.md`, `run-summary-emit.md`, `new-exploration.md`).
- `src/core/templates/workflows/onboard.ts` — the body.
- `src/core/disciplines.ts` — `DECISION_WRITING_BASIC`; `RUN_SUMMARY_EMIT_SKILLS` gains explore.
- `src/core/explore-grammar.ts` — read, not edited: its productions are interpolated where D1 puts them.
- `replay/cases/explore/case.yaml` — its `break:`.
- `skill_body_convention.md` — the budget rule's line-ceiling sentence, the eleven-body example's count, the Exceptions paragraph.
- `test/core/templates/cut-ledger.test.ts` + `test/core/templates/cut-ledger-pairs.ts` — this stage's hashes and pairs.
- `test/core/templates/tightened-bodies.test.ts` — the recorded `records-by-setting` basic content.
- `test/core/decision-writing-parity.test.ts` — the new fence and clauses.
- `orbit/scenario-ledger.yaml` — the two decision-writing `untestable` reasons that cite the bullet's words.
- `test/core/templates/skill-body-budget.test.ts` — ceilings; explore's line ceiling.
- `test/core/templates/skill-templates-parity.test.ts` — hashes.
- `test/core/templates/*.test.ts` — the tests that read moved or reworded text (orbit-generated-surface, orbit-content-fidelity, run-summary-read-cue, verify-scenario-map, commit-step, blind-pair-command), and the new explore-upstream-removals.
- `test/core/explore-grammar-parity.test.ts` + `test/core/parsers/explore-rules.test.ts` — the exemplar's new home.
- `test/commands/config-profile.test.ts` — explore's reference list.
- `test/replay/cases.test.ts` — read, not edited: it checks the explore break.
