# External Review: seam-chaining (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-09

## CRITICAL

None.

## WARNING

### Failed external launches defeat the no-progress guard
**File**: orbit/changes/seam-chaining/specs/orbit-engine-gates/spec.md:54
**Description**: The guard treats any new trail record as progress, but an unsuccessful external review already writes a T0 before launching. Construct a change whose next command is an external review, grant `review-external`, and record a reachable runner that consistently exits non-zero, such as an executable whose authentication has expired. Each invocation writes another T0, returns no findings, and leaves the external review as the next command. The runner remains reachable, the head changes, and neither `needs-user` nor `no-progress` matches. The closing step therefore launches again indefinitely instead of stopping at the existing paste fallback. This also contradicts design.md:87–90's assertion that a refused launch writes nothing. Specify unsuccessful-launch handling independently of T0 creation, carry the necessary outcome into the permission computation, and test repeated non-zero exits and save refusals.

### Chaining has no single owner when a fresh worker loads the review skill
**File**: orbit/changes/seam-chaining/tasks.md:15
**Description**: The task adds the chaining closing step to the review body without excluding its fresh-context workers. The existing worker brief in `src/core/templates/workflows/review.ts:1256` tells the worker to load that skill and run its steps, skipping only dispatch. After persisting findings, a worker can consequently run a granted walk or another review before returning to its invoking session, which also owns a closing step. In a blind pair, a fresh worker could launch the missing external half while the parent already has that half running and has not yet committed the fresh pass. Specify that only the invoking session evaluates and executes lifecycle chaining; workers must return after persisting their pass. Add coverage for both standalone fresh reviews and blind-pair workers.

### The prompt inventory omits the unresolvable-finding alternatives
**File**: orbit/changes/seam-chaining/specs/orbit-conventions/spec.md:91
**Description**: The address-reviews rows cover triage, half-landed pairs, and decision-lane findings, but omit the separate unresolvable path. `src/core/templates/workflows/address-reviews.ts:1107` explicitly offers `AskUserQuestion` alternatives to filing a task: converting to TODO or escalating. These findings are not decision-lane findings; the baseline `orbit-address-reviews` specification preserves their separate path. The proposed tag test must reject this site when untagged and must also reject a tag whose prompt the table does not name. Add this prompt to the inventory, decide its chain behavior explicitly, and include its scenario and tag in the implementation tasks.

### The external-only review branch retains an unconditional prohibition on walking
**File**: orbit/changes/seam-chaining/tasks.md:15
**Description**: The tasks amend the main review closing step and explicitly amend the blind-pair reference, but do not resolve the external-handoff reference's independent ending. That reference says ingestion is “invoked separately, never by this branch” at `src/core/templates/workflows/review.ts:447`, and its successful-return path says “Do NOT walk it” at line 622. The baseline `orbit-review-external` requirement also says the walk is invoked separately. An implementation following the listed edits can retain these instructions alongside the new instruction to execute a granted walk, leaving external-only reviews with conflicting endings. Specify the conditional handoff for this branch and reconcile its reference and owning baseline requirement while preserving the default behavior.

### Repository handoff instructions would still prohibit granted chaining
**File**: orbit/changes/seam-chaining/tasks.md:28
**Description**: Documentation work covers `docs/customization.md` but omits the active repository instructions. `CLAUDE.md:72` says every lifecycle transition is user-invoked, and `CLAUDE.md:111` states the unconditional no-chaining discipline. Both would contradict the new conditional contract after implementation and can cause an agent to stop despite a valid grant. Add an explicit task to update both statements with the setting-dependent allowance while retaining the existing behavior when no grant exists.

## SUGGESTION

### The retained launched-pair scenario needs a grant precondition
**File**: orbit/changes/seam-chaining/specs/orbit-review/spec.md:46
**Description**: “A launched pair commits each half alone” still requires that no walk record is written without restricting the chain setting. The new granted-walk scenario permits that same successful pair to continue into a walk. Make the retained scenario explicitly apply when the walk is not granted, or scope its assertions to the pair's own steps before chaining begins.

## Blocks

None.

## Direction

**Disposition**: hold

The permission model needs clearer ownership and failure handling before implementation. In particular, a failed external run can repeatedly relaunch, and a fresh worker can start lifecycle work while its parent is still assembling the review. Resolve those execution paths and reconcile the prompt inventory and surviving instructions so an implementer can derive one consistent behavior.

## Notes

The required proposal artifacts are present. Modified requirement names exist in their baselines, added requirement names are new, and the delta uses recognized operation headings. Literal `@review:` examples and discussion were not treated as unresolved review annotations.

Validation remains unverified: `node bin/orbit.js validate seam-chaining --strict --no-interactive` could not load the absent `dist/cli/index.js`. The read-only environment prevented building the CLI. This environment limitation is not listed as a proposal validation block.