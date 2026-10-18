# External Review: read-obligation (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-18

## CRITICAL

None.

## WARNING

### The planned standalone test preserves contradictory instructions
**File**: orbit/changes/read-obligation/tasks.md:6
**Description**: Task 1.4 explicitly tests that the standalone section names its “one addition,” while the MODIFIED requirement names three exceptions to upstream behavior. The current body at `src/core/templates/workflows/propose.ts:277–279` says “unchanged from upstream” and “ONE addition,” naming only Touchpoints. The implementation tasks leave that text intact and add a test protecting it. A generated skill would therefore contain the new baseline-read instruction alongside a standalone instruction claiming that only Touchpoints changes upstream behavior. Update the standalone section to acknowledge the applicable edits through a reference to their owning requirements, and test that corrected wording instead of preserving the stale claim.

### Capabilities discovered by grep are listed without an explicit whole-spec read
**File**: orbit/changes/read-obligation/specs/orbit-propose-modifications/spec.md:14
**Description**: The fenced instruction orders the agent to list capabilities, read their baselines, then grep for restatements and list additional capabilities. It never explicitly requires reading the whole baseline of those newly discovered capabilities before writing the proposal. An agent can read capability A, grep and discover capability B, add B to the proposal, and write it after seeing only B’s matching lines. That follows a literal sequential reading of the instruction while missing the program’s requirement to read every listed modified capability. Make the instruction explicitly require whole-spec reads for capabilities discovered by the search before writing `proposal.md`.

## SUGGESTION

### The governing program still states superseded placement and evidence requirements
**File**: orbit/architecture/propose-reads-specs.md:73
**Description**: The stage exit criterion still requires all three steps before the proposal write, although amended G0 and this change deliberately place whole-block copying at the specs artifact. The stage description at lines 67–69 repeats the old placement. The premise at lines 24–25 also promises a reviewable record of the read, despite G3 and this proposal excluding such a record. Align these passages with amended G0 and the instruction-only decision so completion and later measurement have one consistent contract.

### The design points to the wrong test-first task
**File**: orbit/changes/read-obligation/design.md:36
**Description**: The design says task 2.2 demonstrates that the new test fails before the edit. Task 2.2 actually updates parity hashes; task 1.3 performs the failing-test run. Correct the reference to task 1.3.

## Blocks

None.

## Direction

**Disposition**: hold

Clarify the instruction for capabilities discovered during search and remove the contradictory standalone wording before implementation. These changes determine what agents are actually told to do; the proposed surface tests would otherwise preserve the ambiguity.

## Notes

Read the proposal, design, tasks, exploration, complete delta, baseline capability, project orientation, governing program, schema instructions, relevant conventions, template bodies, and mirror-test helpers. The MODIFIED requirement retains the baseline standalone scenario, and no unresolved inline review markers were found in the change artifacts.

CLI validation could not execute: `node bin/orbit.js validate read-obligation --strict` failed to load the absent `dist/cli/index.js`. This is an environment limitation, not an observed artifact-validation failure. Build and test dependencies are unavailable, and the read-only environment prevents preparing them.