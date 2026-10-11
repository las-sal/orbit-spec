## Context

The archive seam is where the human last hears what is true about a change before it ships. Two of the things it should say, it does not (see explore.md, Premise; proposal.md, Why):

- **User-validation tasks.** Upstream Step 3 counts every `- [ ]` and asks "proceed?". It cannot tell a validation handoff from unfinished code, and it records nothing. Five archived changes left a user-validation task unchecked, and all five could only be observed after shipping (explore.md Case 2). The practice changed at rc02b; the mechanism did not.
- **The gate prompt.** Step 3.4 reads only the `review-system` row of `orbit status --change <name> --json`. A change that never applied reads `review-proposal: unpassed`, `apply: ready`, `review-system: blocked`, so nothing prompts and nothing is recorded (rc03a, rc13).

The engine already has what both fixes need. `GateState` is a closed union (`gates.ts:25`), the superseded mark is computed on gate ids (`gates.ts:935-943`), and the write gate accepts any gate name in a `continuation` entry (`emit-composition.ts:1300-1305`). The archive emit resolves the MOVED directory as its `changeDir` (`emit-composition.ts:774-791`), so the write gate can read the archived `tasks.md`.

## Goals / Non-Goals

**Goals:**
- Exit (1): an archive with an unchecked user-validation task records a REASONED deferral (its `why`), or the user aborts. The write gate makes the record impossible to forget. The charter's word "reasoned" is carried by the `why` field, not narrowed (D5).
- Exit (2), revised at exploration (explore.md D-rc10-5): the next archive carrying a user-validation task either closes it by observation or writes a deferral the write gate accepted.
- Exit (3): an archive past a non-passing gate of any phase fires the prompt and records one decision per gate.
- Orbit's purpose as this stage's test (D-rc10-0): the seam REPORTS and RECORDS; the AI does the work, and the human is told.

**Non-Goals:**
- A post-archive reader of a deferral (D-rc10-8, the requirement's named limit).
- The archive's stop on an undeclared delta scenario (rider R2, D-rc10-9), and rider R1, the external-first canonical next (D-rc10-6).
- Any change to gate state, the tracked gate's subset rule, the schema, config or CLI.

## Decisions

**D1 — The gate set at archive is every reviewed gate that is not passed and not superseded (explore.md D-rc10-2).** The rule lives in `orbit-engine-gates`' `Inflection-prompt override contract`, its owner, and the archive body points at it (R-crc-14). `blocked` is listed because its reason names the cause, and that is what the human needs at the seam. A superseded gate is silent, because its phase's own seam owned the decision. A tracked gate is not listed, because its unchecked work belongs to the task check. Alternative: list every non-passing gate including tracked `apply: ready`. Rejected: Step 3 already asks about those tasks, so the user would be asked twice.

**D2 — One prompt, one entry per listed gate.** One decision, many facts. The `judgements` array already carries several entries and the write gate takes any gate name, so no engine change is needed. Alternative: one prompt per gate. Rejected: it asks the same question N times.

**D3 — The disposition domain is every unchecked `(User-validation` task, not only the engine's `userValidationPending` list.** This refines explore.md's D-rc10-1 Mechanism entry, whose second row sent marked-but-undeclared tasks to Step 3. At propose the write gate's reader was fixed (D4), and that reader sees every marked unchecked line whether or not apply declared it. If the seam's domain were narrower than the write gate's, a marked task could reach the emit with no disposition and be refused there with no step having asked about it. So the seam owns every marked task, and Step 3 excludes them all.

**D4 — The write gate reads `tasks.md` with `parseCheckboxes` (`src/core/parsers/apply-state.ts`).** This is the reader the apply emit's `user_validation_tasks` check uses (`emit-composition.ts:1415-1437`). It is fence-aware and its id grammar is `\d+(\.\d+)+`, and it counts a box only inside a `## ` group. Two marked lines it cannot key are refused by their text rather than left invisible: a marked unchecked task with no id, and a marked unchecked line outside every group. The second is found by a fence-aware line scan for unchecked marked lines, compared with the set the reader returns. So the seam and the gate share one domain: every marked unchecked line is either keyed or refused (walk, external W2). A missing `tasks.md` is an empty marked set. An empty `deferred_validations` array is written as absent, as the apply emit drops an empty `user_validation_tasks`. Alternative: export the tracked gate's `uncheckedTaskLines`. Rejected: that reader is not fence-aware and takes any first token as the id, so it would give a second id grammar for one artifact.

**D5 — Two dispositions, partitioned by the checkbox, and the deferral carries `why` (walk, Sal: A).** OBSERVED checks the box; DEFERRED leaves it unchecked with `{task, why, when, where}`. An earlier draft had FORWARD ("observable only after shipping"), which left a validation that could have run and did not with no honest disposition (external W1), and its record had no reason slot, which narrowed the charter's "reasoned deferral" (fresh W5). DEFERRED covers both cases and `why` carries the reason. Alternative: a third disposition, POSTPONED, with `when`/`where` read as the reason. Rejected: a third label the engine cannot tell from the second. The brief is a report, not a prompt (D-rc10-0, R-crc-13); halting stays the user's, by aborting. The engine checks only that each marked task has a deferral with non-empty prose, never whether the prose is true (R-crc-10).

**D6 — The step's position is a new Step 3.2, between upstream Step 3 and Step 3.4, and it checks before the move.** The resulting order is: Step 3 asks about ordinary unchecked tasks; Step 3.2 disposes of validation tasks and checks the composed deferrals against the `DEFERRAL REFUSALS` production; Step 3.4 runs the gate prompt. The validation brief informs the gate decision. Because the emit runs after the move, a predictable refusal must surface here while the change is active (walk, both passes). An id-less or ungrouped marked task is reported for the user to fix or abort. A refusal that still arrives after the move is repaired by re-running `orbit emit archive` against the archived directory, never by repeating the sync or the move. No engine surface runs the write gate before the move, so the refusals are stated ONCE, as a fenced production in the requirement, and Step 3.2 carries them as a checked mirror held by a parity test (verification, W1) rather than as a second unchecked prose list.

**D8 — Bulk archive runs Step 3.2 per change (walk, external W4).** `/orbit:bulk-archive` syncs and moves each change itself and then writes each change's archive emit, which the new write gate checks. It therefore runs the disposition step per change before that change's sync and move, the pattern its fingerprint check already follows, and briefs the dispositions in its batch summary. Its own readiness count (every `- [ ]`) excludes the marked tasks Step 3.2 owns, as the single archive's Step 3 does; otherwise a validation-only change is classed incomplete and can be skipped before its Step 3.2 runs (verification, W2). Bulk archive's rules live in `orbit-archive-modifications`, so this adds no capability.

**D7 — Only blocks whose text the rule makes false are carried.** `Archive run summary written` (its continuation paragraph names one gate) and `Archive summary schema reference ships with the skill` (its field list would omit the new field) are carried. Not carried: `Critical-drift prompt, not gate` and `Fingerprint-divergence inflection prompt`, which call Step 3.4's prompt "the `review-system` gate prompt". Their sentences state ordering and distinctness relative to that prompt; the prompt still exists at Step 3.4, and `review-system` is still one of its gates. Carrying them would add nine scenario declarations to change a name. See Risks.

## Risks / Trade-offs

- **[Risk] A DEFERRED label can hide a weak reason.** The `why` is a record, not a check. → Mitigation: the brief before the move and the readout line put every deferral in front of the user; a cited stage's exit criteria are graded at ratification.
- **[Risk] No reader of a deferral after archive (D-rc10-8).** → Mitigation: stated as the ADDED requirement's named limit; a later stage owns a post-archive reader.
- **[Risk] Two readers of one tasks file.** The tracked gate's subset rule uses `uncheckedTaskLines` (not fence-aware); the write gate uses `parseCheckboxes` (fence-aware, needs a `## ` group). → The archive's own domain is closed by D4: an ungrouped marked line is refused by its text, never silently missed. What remains is the gate side: a marked line inside a fence is counted by the tracked gate's subset rule and by neither archive check. Collapsing the readers is outside this change.
- **[Risk] Two requirements keep the name "the `review-system` gate prompt" (D7).** → Accepted as a naming lag, not a false statement; the next change carrying either block renames it.
- **[Risk] `orbit-pr-lifecycle`'s "override at the `review-system` gate SHALL still flip READY" says nothing about an override at another gate.** Its rationale ("the recorded override IS the user's ratification") covers any gate. → Accepted; not carried, to stay at two capabilities.
- **[Risk] The superseded exclusion trusts the earlier seam's record.** → It holds wherever apply ran through its workflow, which has prompted and recorded at its seam since C1. Tasks checked by hand pass the apply gate with no seam prompt; that case is the named limit stated in the override contract's own text.
- **[Trade-off] 33 delta scenarios to declare** (20 carried, 13 new). → Group 3 of tasks.md owns them; carried scenarios that no test asserts get ledger entries, never tags without evidence.

## Alternatives considered

From explore.md, Considered & out:
- **Halt on any unchecked user-validation task.** Out: a forward validation would then mean never archiving.
- **Move forward validations out of `tasks.md` at propose.** Out: it touches `orbit-propose-modifications` for a class the seam can classify.
- **Deferrals as readiness `accepted` pairs.** Out: a readiness entry is written only when the archive concludes a cadence, and its pairs key nothing the engine can check.

From the riders (explore.md D-rc10-6, D-rc10-9): R1 (external-first next) and R4 (an apply-emit pointer at the scenario map) are not carried, and R2 (the undeclared-scenario stop) is not carried. R3 (a task about post-sync baseline state) is folded in as one sentence of the ADDED requirement.

## Touchpoints

- `src/core/templates/workflows/archive-change.ts` — Step 3's named edit, the new Step 3.2, Step 3.4 widened, the readout line, and the archive schema reference (field, field note, `json example`).
- `src/core/templates/workflows/bulk-archive-change.ts` — Step 3.2 per change, before that change's sync and move; dispositions in the batch summary.
- `src/core/emit-composition.ts` — `deferred_validations` in the archive payload table and its write-gate check.
- `test/core/emit-composition.test.ts` — the refusals and the acceptance.
- `test/core/reference-roundtrip.test.ts` — a second seeding rule: a `(User-validation` task per deferral an example names.
- `test/core/` — archive body surface assertions; the template parity pins that move.
- `orbit/scenario-ledger.yaml` — carried scenarios no test asserts.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc10-1 | DERIVED | live rule | `orbit-archive-modifications` / `User-validation closure at the archive seam` — SENTENCE naming the source (the two dispositions, and the marker the tracked gate reads); domain refined at propose (D3); FORWARD replaced by DEFERRED with `why` at the walk (D5) |
| D-rc10-2 | SOURCED | live rule | `orbit-engine-gates` / `Inflection-prompt override contract` — SCENARIO SET, one scenario per gate-state class that changes outcome (listed, superseded, spend), with the closed union named in the paragraph |
| D-rc10-3 | DERIVED | live rule | `orbit-archive-modifications` / `User-validation closure at the archive seam` — SENTENCE naming the source (the reader the apply emit's check uses) with the refusals in prose; the explore entry's "the same reader the tracked gate uses" was replaced at propose (D4), and the ungrouped-line refusal added at the walk closes the set that reader cannot see |
| D-rc10-0, -4 … -9 | — | not a live rule (scope / fact) | not carried |
