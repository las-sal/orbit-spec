# External Review: rc13c-propose-consumes-mechanism (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-26

## CRITICAL

### The closure-token rows overlap the open-state row, giving one malformed live rule opposite destinations
**File**: orbit/changes/rc13c-propose-consumes-mechanism/specs/orbit-propose-modifications/spec.md:7
**Description**: The table treats “has a `Closure:` token” and “no usable entry” as disjoint, but the owned parser does not: a live entry can retain `Closure: BOUNDED` while appearing in `rules_open` as `bounded-incomplete`, or retain `Closure: SOURCED` while appearing as `malformed-entry` because its Domain table or Moves block is bad. A BOUNDED entry missing `Residual method:` therefore matches row 2, which requires both residual lines to be copied, and row 4, which requires no spec text; the current parser actually returns `bounded-incomplete` and no residual for that fixture. The claimed Cartesian table also has no row for “no usable entry × non-live owner,” even though that is an ordinary fact/scope decision with no entry and is reachable for a malformed historical entry. Make the rows a true partition: apply the DERIVED/SOURCED/BOUNDED carrier rows only to an ACCOUNTED entry, give every `rules_open` state precedence as the unaccounted row, and explicitly disposition the no-usable/non-live cell (including what the record writes when the engine intentionally assigns no open-state word to non-live owners).

### The concluded path is not disjoint from the inherited consume and conflict scenarios
**File**: orbit/changes/rc13c-propose-consumes-mechanism/specs/orbit-propose-modifications/spec.md:60
**Description**: A named concluded staging file satisfies both “Consume mode activated” (file exists, so it seeds artifact generation) and “A concluded staging directory is refused” (halt with no prompt or writes). If an active change directory also exists, it additionally satisfies “Conflict — both dirs exist,” which requires an `AskUserQuestion` prompt even though the refusal scenario promises no prompt. Design D-rc13c-1 says conflict-first, but that precedence and its exception to the no-prompt promise are not present in the normative block. A fresh implementer can legitimately generate, refuse, or prompt for the same input. Scope the ordinary consume scenario to a non-concluded file with no unresolved conflict; state conflict-first precedence in the requirement; and scope the concluded-refusal scenario to the post-conflict/no-active-change branch (or specify exactly what happens after each conflict choice).

## WARNING

### Filesystem modification time cannot establish that an emit was written against the current file
**File**: orbit/changes/rc13c-propose-consumes-mechanism/tasks.md:10
**Description**: Task 2.2 operationalizes “written against the file as it stands” as the newest emit being newer than `explore.md`'s last modification, but Git does not preserve either file's historical mtime. In this fresh checkout, the valid `explore-2026-09-26T18-01-34Z.json` record says it was fired after Step 0b and its counts match the file, yet checkout assigned both paths new mtimes and made `explore.md` about 0.6 ms newer, so the proposed check rejects it; comparing the embedded emit timestamp to the checkout-time mtime also rejects it. A change-and-revert can produce the opposite false claim. The workflow can run `stat`, but the observable is not durable provenance. For this one-capability stage, remove the optional trail cross-check and always identify the AI file read as the source; otherwise a later engine change must record a content digest or other persistent file version in the emit before the body may claim the emit describes the current bytes.

### The delta restates the neighboring re-entry row that exit criterion 3 says to point at
**File**: orbit/changes/rc13c-propose-consumes-mechanism/specs/orbit-propose-modifications/spec.md:58
**Description**: The consume-mode requirement already states its own observable refusal, then repeats `orbit-explore-modifications`' third-row predicate as “state the conclusion and its trigger, ask nothing else.” That is the neighboring rule's defining behavior, not merely its name or a pointer, and task 4.1 only forbids copying the table header, so the planned check will certify this restatement. Keep the propose-specific output and no-reopen consequence, replace the parenthetical copy with a bare pointer to `Re-entry resolution and the conclude verb`, and make the residue assertion reject the duplicated “ask nothing else” predicate rather than only a literal table row.

### The main generated-body copies are not covered by the mirror parity plan
**File**: orbit/changes/rc13c-propose-consumes-mechanism/tasks.md:18
**Description**: Task 3.3 tells the generated `orbit-propose` body to carry the five-row decision table and enumerate the four CLOSED shapes “as the spec states it.” Those are definitions of the new rule and its set, so they are generated mirrors under R-crc-14's mirror corollary, just like the six-section list. Task 3.4 adds only phrase markers and the whole-template hash; neither fails when the owning spec changes without the body changing. Add an `ownerText` parity assertion that extracts and byte-compares the decision table and CLOSED-shape set (with only explicitly stated formatting normalization), or put each in one shared constant whose rendered body copy is checked against the owning requirement.

### User-validation expects emit prose that no requirement or implementation task produces
**File**: orbit/changes/rc13c-propose-consumes-mechanism/tasks.md:26
**Description**: Task 4.4 requires the next propose emit's `final_assessment` to say whether an engine record was available and whether it agreed. The ADDED requirement requires that fact only in the generated design record's header, task 3.3 edits that record, and the existing Run-summary body merely asks for a narrative `final_assessment`; no task instructs a future proposing AI to put the cross-check result in the emit. The user-validation checkbox can therefore fail even when every implementation task is followed. Either add the emit sentence to the requirement and to the Run-summary/body work with a fidelity assertion, or narrow 4.4 to validate the `Mechanism → artifacts` header that the change actually specifies.

## SUGGESTION

### Current-state prose still says all eight exploration decisions settled the live mechanism
**File**: orbit/changes/rc13c-propose-consumes-mechanism/proposal.md:16
**Description**: The proposal says every mechanism was settled in `explore.md` and reports seven live rules; design Context similarly says D-rc13c-1 through D-rc13c-8 settled the mechanism. The same artifacts now say D-rc13c-2 was revised, D-rc13c-8 was superseded, and the live figure is six. The later history notes prevent a hidden contradiction, but the opening current-state claims still send a codegen reader to stale rules. Qualify those figures as the state at promotion and state the post-walk live figure/revisions in the opening summary.

### The refusal test plan pins words but not their behaviorally significant location
**File**: orbit/changes/rc13c-propose-consumes-mechanism/tasks.md:5
**Description**: Task 1.3 only checks that refusal phrases occur somewhere in the full propose body. Because this workflow is executable prose, the same phrases in Graceful degradation or an explanatory paragraph would pass while the Resolve mode branch still reached PR phase 1. Slice the generated body by headings and assert that the concluded branch is inside Mode detection's Resolve mode, after the conflict branch and before the consume-flow/PR-phase boundary; keep the whole-body markers as secondary fidelity pins.

## Notes

Critical classification: “closure-token rows overlap the open-state row” is ENUMERATE; the table's proposed partition does not cover its domain disjointly. “Concluded path is not disjoint” is COHERE; three normative paths assign incompatible actions to the same state.

The artifacts are structurally clean: strict change validation, all five base fingerprints, source lint, and the full test suite pass; all five MODIFIED blocks remain byte-complete copies of their baselines apart from the intended edits. I also checked the owning grammar and re-entry requirements, the parser's live-only `rules_open` join, the one-shot emit rule, the current propose body and its fidelity/hash tests, both archived Mechanism exemplars, the stage charter, and the prior walk. No live inline-review marker remains; the `@review:` strings in scope are normative examples. The risk pattern is that syntactic validation is green while two decision surfaces still lack a disjoint state model and the optional cross-check relies on provenance Git does not retain.
