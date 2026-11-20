# External Review: replay-set (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-20

## CRITICAL

None.

## WARNING

### Trace grading accepts output from commands that never run orbit

**File**: replay/lib/trace.mjs:11  
**Description**: `commandRunsOrbit` treats any whitespace-delimited `orbit` in a Bash command as an invocation. A command such as `echo orbit ...` therefore makes its output eligible as `orbitOutput`, even though orbit never ran. This undermines the trace graders meant to distinguish orbit’s printed answer from text supplied by the session; a fabricated emit path can satisfy a printed-path grader. Recognize actual shell command positions and avoid attributing the entire output of a mixed command to orbit without evidence that orbit produced it.

### The replay set has not yet demonstrated that its cases detect broken bodies

**File**: orbit/changes/replay-set/tasks.md:112  
**Description**: The plumbing run, broken-body run, and baseline remain unchecked. In particular, the free checks demonstrate individual graders against constructed fixtures, but they do not establish that each named body deletion causes its intended grader to fail in a real session, or that the six cases can produce a usable baseline. Complete the documented user-validation runs and repair any ineffective breaks or graders before relying on the replay set to judge cuts.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The replay set’s central purpose is to detect behavioral regressions in skill changes. Its trace attribution currently admits text from commands that do not invoke orbit, and the real-session checks needed to establish that the cases can detect their intended failures remain outstanding. Addressing both would make the resulting baseline more trustworthy.

## Notes

The scenario map reported no uncovered delta scenarios; one scenario is marked untestable with a recorded manual validation. The installed `orbit validate replay-set --strict` passed. The requested perspective and critical-path files were absent.

The environment is read-only. I could not write the findings file or commit and push it; the full review is provided above for manual saving.