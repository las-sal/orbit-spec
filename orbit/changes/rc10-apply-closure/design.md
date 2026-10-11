## Context

The archive seam is where the human last hears what is true about a change before it ships. Two of the things it should say, it does not (see explore.md, Premise; proposal.md, Why):

- **User-validation tasks.** Upstream Step 3 counts every `- [ ]` and asks "proceed?". It cannot tell a validation handoff from unfinished code, and it records nothing. Five archived changes left a user-validation task unchecked, and all five could only be observed after shipping (explore.md Case 2). The practice changed at rc02b; the mechanism did not.
- **The gate prompt.** Step 3.4 reads only the `review-system` row of `orbit status --change <name> --json`. A change that never applied reads `review-proposal: unpassed`, `apply: ready`, `review-system: blocked`, so nothing prompts and nothing is recorded (rc03a, rc13).

The engine already has what both fixes need. `GateState` is a closed union (`gates.ts:25`), the superseded mark is computed on gate ids (`gates.ts:935-943`), and the write gate accepts any gate name in a `continuation` entry (`emit-composition.ts:1300-1305`). The archive emit resolves the MOVED directory as its `changeDir` (`emit-composition.ts:774-791`), so the write gate can read the archived `tasks.md`.

## Goals / Non-Goals

**Goals:**
- Exit (1): an archive with an unchecked user-validation task records a deferral, or the user aborts. The write gate makes the record impossible to forget.
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

**D4 — The write gate reads `tasks.md` with `parseCheckboxes` (`src/core/parsers/apply-state.ts`).** This is the reader the apply emit's `user_validation_tasks` check uses (`emit-composition.ts:1415-1437`). It is fence-aware and its id grammar is `\d+(\.\d+)+`. A marked unchecked task with no id cannot be keyed by a deferral, so the gate refuses it by its text. Alternative: export the tracked gate's `uncheckedTaskLines`. Rejected: that reader is not fence-aware and takes any first token as the id, so it would give a second id grammar for one artifact.

**D5 — The brief is a report, not a prompt (D-rc10-0, R-crc-13).** OBSERVED and FORWARD are the AI's dispositions, stated to the user before the move; halting stays the user's, by aborting. The engine checks only that each task id has a deferral, never whether the prose is true (R-crc-10).

**D6 — The step's position is a new Step 3.2, between upstream Step 3 and Step 3.4.** The resulting order is: Step 3 asks about ordinary unchecked tasks; Step 3.2 disposes of validation tasks; Step 3.4 runs the gate prompt. The validation brief informs the gate decision.

**D7 — Only blocks whose text the rule makes false are carried.** `Archive run summary written` (its continuation paragraph names one gate) and `Archive summary schema reference ships with the skill` (its field list would omit the new field) are carried. Not carried: `Critical-drift prompt, not gate` and `Fingerprint-divergence inflection prompt`, which call Step 3.4's prompt "the `review-system` gate prompt". Their sentences state ordering and distinctness relative to that prompt; the prompt still exists at Step 3.4, and `review-system` is still one of its gates. Carrying them would add nine scenario declarations to change a name. See Risks.

## Risks / Trade-offs

- **[Risk] A FORWARD label can hide a task that was simply skipped.** The prose is a record, not a check. → Mitigation: the brief before the move and the readout line put every deferral in front of the user; a cited stage's exit criteria are graded at ratification.
- **[Risk] No reader of a deferral after archive (D-rc10-8).** → Mitigation: stated as the ADDED requirement's named limit; a later stage owns a post-archive reader.
- **[Risk] Two readers of one tasks file.** The tracked gate's subset rule uses `uncheckedTaskLines` (not fence-aware); the write gate uses `parseCheckboxes` (fence-aware, needs a `## ` group). A marked line inside a fence or above every group heading is seen by one reader and not the other. → Accepted for this change: no tasks file on record has either shape. Collapsing the readers is outside this change.
- **[Risk] Two requirements keep the name "the `review-system` gate prompt" (D7).** → Accepted as a naming lag, not a false statement; the next change carrying either block renames it.
- **[Risk] `orbit-pr-lifecycle`'s "override at the `review-system` gate SHALL still flip READY" says nothing about an override at another gate.** Its rationale ("the recorded override IS the user's ratification") covers any gate. → Accepted; not carried, to stay at two capabilities.
- **[Risk] The superseded exclusion trusts the earlier seam's record.** → Apply has prompted and recorded at its seam since C1, so the exclusion holds for every trail written since.
- **[Trade-off] 30 delta scenarios to declare** (20 carried, 10 new). → Group 3 of tasks.md owns them; carried scenarios that no test asserts get ledger entries, never tags without evidence.

## Alternatives considered

From explore.md, Considered & out:
- **Halt on any unchecked user-validation task.** Out: a forward validation would then mean never archiving.
- **Move forward validations out of `tasks.md` at propose.** Out: it touches `orbit-propose-modifications` for a class the seam can classify.
- **Deferrals as readiness `accepted` pairs.** Out: a readiness entry is written only when the archive concludes a cadence, and its pairs key nothing the engine can check.

From the riders (explore.md D-rc10-6, D-rc10-9): R1 (external-first next) and R4 (an apply-emit pointer at the scenario map) are not carried, and R2 (the undeclared-scenario stop) is not carried. R3 (a task about post-sync baseline state) is folded in as one sentence of the ADDED requirement.

## Touchpoints

- `src/core/templates/workflows/archive-change.ts` — Step 3's named edit, the new Step 3.2, Step 3.4 widened, the readout line, and the archive schema reference (field, field note, `json example`).
- `src/core/emit-composition.ts` — `deferred_validations` in the archive payload table and its write-gate check.
- `test/core/emit-composition.test.ts` — the refusals and the acceptance.
- `test/core/` — archive body surface assertions; the template parity pins that move.
- `orbit/scenario-ledger.yaml` — carried scenarios no test asserts.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc10-1 | DERIVED | live rule | `orbit-archive-modifications` / `User-validation closure at the archive seam` — SENTENCE naming the source (the two dispositions, and the marker the tracked gate reads); domain refined at propose (D3) |
| D-rc10-2 | SOURCED | live rule | `orbit-engine-gates` / `Inflection-prompt override contract` — SCENARIO SET, one scenario per gate-state class that changes outcome (listed, superseded, spend), with the closed union named in the paragraph |
| D-rc10-3 | DERIVED | live rule | `orbit-archive-modifications` / `User-validation closure at the archive seam` — SENTENCE naming the source (the reader the apply emit's check uses) with the refusals in prose |
| D-rc10-0, -4 … -9 | — | not a live rule (scope / fact) | not carried |
