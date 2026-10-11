# External Review: rc04a-judgement-record (iteration 1)

**Reviewer**: OpenAI Codex (GPT-5)
**Date**: 2026-09-21

## CRITICAL

### The archive override path never composes its continuation record
**File**: src/core/templates/workflows/archive-change.ts:282
**Description**: The archive carrier is specified as the most important `continuation/proceed` carrier, but Step 3.4 still tells the body to write only `gate_overridden`, Step 5.5 tells it to compose only a `readiness` entry, and the shipped archive schema shows only the readiness shape. Therefore an archive that proceeds past an unpassed `review-system` gate will not write the promised continuation successor at all, leaving the most common `gate_overridden` use with no strict widening and making rc04c's retirement premise false. Update the gate-prompt branch to retain the pass tokens and compose a matching `continuation/proceed` entry alongside `gate_overridden`, document both admissible archive entry shapes in the schema reference, and add a generated-workflow test that exercises an archive carrying both entries.

## WARNING

### The coexistence guard compares two nonexistent legacy keys
**File**: src/core/emit-composition.ts:622
**Description**: `gate_overridden` is shaped as `{gate, state, reason}`, while the new record is shaped as `{gate, gate_state, gate_reason}`. The loop indexes both objects with the new names, so only `gate` is compared; `go.gate_state` and `go.gate_reason` are `undefined` and the checks are skipped. A real `orbit emit archive` probe wrote `gate_overridden.state: "stale"` beside `gate_state: "unpassed"` and different reasons without refusal. Compare explicit pairs (`gate`↔`gate`, `state`↔`gate_state`, `reason`↔`gate_reason`), validate the legacy object before comparison, and add mismatch cases for each field that assert no file is written.

### Carrier-specific judgement kinds are not enforced
**File**: src/core/emit-composition.ts:540
**Description**: The closed carrier requirement says `apply` and `review-external` admit only `continuation`, while `archive` admits both kinds, but `validateJudgements` never uses `command` to constrain an entry after the top-level key has been admitted. A real `orbit emit review-external` probe accepted and wrote a `readiness/ready` record. This makes record location meaningless and lets payloads contradict all three shipped schema references. Add a command-to-admitted-kind/disposition table to runtime validation (including `review-external`'s `spend` and the proceed seams) and constructed CLI cases for every forbidden command/kind combination.

### The not-ready contract conflates archived dissent with routing
**File**: orbit/changes/rc04a-judgement-record/specs/orbit-run-summary-emit/spec.md:54
**Description**: `not-ready` is defined here as a user-ratified routing decision with `destination: "architecture"`, yet readiness is admitted only on `archive`, the archive requirement says this disposition does not block and stands as the AI's dissent, and the completion line calls it the session's own judgement. Consequently the honest archive-dissent record the reader describes (`ratified_by: "ai"`) is refused, while the only accepted shape claims work is going to architecture even though the change is archived. Separate these cases: either allow an AI-authored archive dissent without a routing destination, or give the user-ratified routing decision a non-archive carrier plus a real reader; then align the validator, archive schema/body, and completion wording to that choice.

## SUGGESTION

### The acceptance fixture asserts the classification it claims to derive
**File**: test/core/judgement-record-fixture.test.ts:44
**Description**: The fixture selects `warnings[0]` and `[1]` by index, labels them pass-formed in comments, and checks only their opening phrases; it then attaches a separately hard-coded pass list. The remaining classifications likewise rely on phrase checks or the absence of literal timestamp text, and the continuation case checks the old object's string fields plus lexical ordering without ever composing the proposed records through the write gate. This cannot detect a wrong semantic sort and did not expose the carrier/coexistence defects above. Build the proposed readiness and continuation payloads from the archived evidence in a temporary fixture, pass them through `composeAndWriteEmit`, and assert both the accepted output and the excluded warning/method cases.

## Notes

The MODIFIED delta blocks mechanically preserve every scenario from their live baseline requirements, all 19 tasks are checked, the build succeeds, all 2,229 tests pass, and strict validation reports 26 clean items. The ordering check itself uses the final collision-resolved filename token and the trail reader's independent-pass set as intended. The risk is concentrated at the surrounding seams: the workflow does not author one promised record, and the runtime validator admits contradictory records that the prose says are impossible. The perspective and critical-path lens files are absent, so those named passes were skipped; the lifecycle was walked directly instead.
