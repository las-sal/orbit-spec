# External Review: rc04c-retire-gate-overridden (iteration 1)

**Reviewer**: Codex (GPT-5)
**Date**: 2026-09-22

## CRITICAL

### The empty-citation successor contradicts the capability's unchanged membership rule

**File**: orbit/changes/rc04c-retire-gate-overridden/specs/orbit-run-summary-emit/spec.md:132
**Description**: The requirement still defines a cadence judgement as a decision formed against independent review output, calls that the exact qualifying test, and says a judgement citing no pass "does not belong here" because it has no ordering to check (lines 132-138). The same requirement then admits `continuation/proceed` with `formed_against: []` when no independent pass exists (lines 176-192), so the new totality case is expressly admitted by the carrier's lower clause and expressly excluded by its defining clause. The generated apply/archive references repeat the old membership definition (for example `archive-change.ts:97` says `judgements` is present only for a decision formed against independent review output), while tasks 2.1b and 2.2a only change cardinality. Revise the qualifying definition and both body/reference tasks to state the widened membership rule explicitly—e.g. a continuation decision formed against the available cadence state, with the evidence-free `proceed` exception—while preserving the exclusions for readiness, spend, method calls, scope calls, and process notes. Otherwise a fresh implementer cannot tell whether the empty record is valid or forbidden.

### The only rebuild occurs before the engine finishes retiring the field

**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:75
**Description**: Task 2.4 runs `npm run build` and refreshes the installed bodies, but tasks 2.5a/2.5b then edit `src/core/emit-composition.ts` to remove the coexistence guard and payload-table entries. There is no rebuild after those source edits. `bin/orbit.js` imports `dist/cli/index.js`, so the runnable surface remains the pre-2.5 engine: it still accepts `gate_overridden` and retains the guard even though source grep and Vitest (which exercise `src/`) can pass. This defeats the stage's central write-path retirement in the actual local surface and makes the proposed ordering create the very source/runtime split it is trying to avoid. Move the rebuild/refresh after 2.5b, or add a second mandatory rebuild there, and smoke-test the built CLI by submitting `gate_overridden` to apply/archive and asserting the unknown-key refusal.

### The proposal exceeds R-crc-1 on both delta size and task count

**File**: orbit/changes/rc04c-retire-gate-overridden/proposal.md:76
**Description**: The proposal declares the stage "AT the ceiling" because it touches three capabilities, but R-crc-1's ceiling also says approximately 40 KB of delta and under 20 tasks. The three delta files total 56,262 bytes, and `tasks.md` contains 30 independently checkable boxes. The task count is 50% over the hard bound, and the delta is about 40% over its stated calibration; calling capabilities the binding dimension does not repeal the other limits. R-crc-9 requires an over-ceiling mechanism to be split or declared blocked, never reviewed as one. Split the totality precondition (empty-citation semantics, engine check, body contract, and its tests) into a prerequisite stage and keep the actual field/guard retirement in rc04c, or record an explicit architecture ruling that changes the ceiling; do not hide the overage by coalescing checkboxes.

## WARNING

### The prior-generation compatibility fix neither exercises a reader nor supplies an executable manual check

**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:128
**Description**: Task 3.5 calls its archive derivation the standing regression that an old `gate_overridden` emit "still parses", but the cited test reads the file with direct `fs.readFileSync` + `JSON.parse`; it never invokes `readTrail`, orientation, report rendering, or another Orbit reader, so unknown-field compatibility is not being tested. Task 4.2 does not close the gap: `orbit status --change <name> --report` calls `validateChangeExists`, which only accepts active `orbit/changes/<name>` directories, and an invocation against a real archived change fails "Change ... not found". Replace the raw-JSON claim with a persistent test through an actual supported reader (for example `readTrail`/orientation over a real archived fixture), and rewrite 4.2 to use a command or fixture arrangement that can address archived data. The field can remain readable today, but the proposal currently has no executable verification of that central compatibility promise.

## SUGGESTION

### The test task does not pin the newly normative latest-pass choice

**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:139
**Description**: Task 1.2 deliberately makes "LATEST preceding independent pass" normative because several passes commonly exist, but task 3.6 only asks for refusal "naming the pass when one precedes the emit". A test naming any earlier pass—including the oldest—would satisfy that wording while violating the spec. Seed at least two preceding independent passes and assert that the refusal names the lexically latest token and the entry index.

## Notes

I mechanically compared all ten MODIFIED blocks with their live baselines. All 55 baseline scenarios are accounted for; the five net-new scenarios belong to the empty-citation rule, and the renamed/replaced scenarios are confined to the intended retirement sites. Strict change validation passed, all ten base fingerprints verified, `npm run build` succeeded, and the current baseline suite passed all 2,238 tests. No `@review:` markers remain. `orbit/project.md`, root `*_convention.md` files, and `orbit/lenses/` are absent, so those conditional context and lens passes were skipped.
