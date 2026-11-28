# External Review: replay-set (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-20

## CRITICAL

None.

## WARNING

### Incomplete comparisons can report a cut as no worse

**File**: orbit/changes/replay-set/design.md:215  
**Description**: The comparison judges only facts present in both records, lists unmatched facts without judging them, and exits non-zero only for a regression. A cut run stopped by its cost ceiling can therefore omit grades for cases or runs that passed in the baseline, yet the comparison can still exit successfully and call the cut “no worse.” The same problem applies to a missing case or grader. Require comparable, complete records before issuing a no-worse result; report missing runs, grades, cases, and facts as an incomplete comparison with a non-zero exit.

### The total cost ceiling does not cap total cost

**File**: orbit/changes/replay-set/design.md:192  
**Description**: The runner checks only whether finished-session spending has already reached the ceiling before starting another session. For example, with a $3 ceiling, $2.90 spent, and a case budget of $1, it may start another session and spend up to that session’s budget, exceeding the stated total ceiling. Reserve the next session’s maximum budget against the remaining total, or reduce its budget to the remaining amount, and define how missing or malformed cost reports stop further sessions.

### The declared graders cannot verify the fixture test passes

**File**: orbit/changes/replay-set/design.md:140  
**Description**: The apply case requires the project’s test to pass, but the only specified grader types check file existence, match text, or run an orbit command and inspect JSON. None runs the project’s test or checks its exit status. Consequently an implementation following the grader contract cannot establish this required fact. Add a constrained command-exit grader or specify another reliable observable that proves the test ran and passed, including its known-bad check.

### The free fixture checks point the shim at the wrong layout

**File**: orbit/changes/replay-set/design.md:161  
**Description**: The free checks link `.orbit-cli` to the repository root, but the specified shim looks for `.orbit-cli/node_modules/orbit-spec/bin/orbit.js`. The repository root has `bin/orbit.js`, not that nested installed-package layout, so the shim cannot find the local build in these fixtures. Create the same installed-package directory layout for free checks or specify a separate compatible shim arrangement, and test that the seed commands reach the intended local build.

### File graders cannot establish that orbit wrote the evidence

**File**: orbit/changes/replay-set/specs/orbit-replay-set/spec.md:124  
**Description**: The requirement allows only evidence orbit printed or wrote, but `file_exists` and file-targeted `regex` read arbitrary fixture files without establishing their writer. A session can create an expected artifact or emit-shaped file directly, and a grader can pass even when the CLI did not produce it. Define how each relevant fact is authenticated—for example, by validating it through orbit’s own status or trail commands—and specify what evidence is acceptable for artifacts that the workflow intentionally writes directly.

### The run record can overwrite earlier evidence

**File**: orbit/changes/replay-set/design.md:195  
**Description**: The record name contains only the date, seven-character commit, and label. Repeating a baseline, plumbing run, or broken-body run with the same label on the same day overwrites the earlier record, losing the evidence and cost history that the comparison and stage review depend on. Give each run a unique identifier or timestamp and refuse to overwrite an existing record.

## SUGGESTION

### Clarify the case-directory count

**File**: orbit/changes/replay-set/tasks.md:55  
**Description**: The task puts a shared `_project/` directory under `replay/cases/`, while the spec says listing case directories there yields six. Define case discovery explicitly, such as directories containing `case.yaml`, or place shared material outside the case directory.

## Blocks

None.

## Direction

**Disposition**: hold

The comparison can certify incomplete evidence, and the proposed grader and fixture contracts do not yet support all the checks the cases require. Resolving those details before implementation will make the replay set’s result meaningful for the cuts it is intended to guard.

## Notes

The review covered the proposal, design, tasks, delta spec, project orientation, and relevant baseline conventions. No `@review:` marker was found in the reviewed change artifacts. Strict validation could not be completed: the checkout has no built `dist/cli/index.js`, and this environment does not permit writing the build output.

The environment is read-only, so I could not write the findings file or commit and push it. The complete markdown above is provided for manual saving.