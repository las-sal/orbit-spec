# External Review: rc03b-pass-genres (iteration 1)

**Reviewer**: GPT-6 Astra
**Date**: 2026-10-04

## CRITICAL

None.

## WARNING

### The fresh worker is told to dispatch another fresh worker
**File**: src/core/templates/workflows/review.ts:823
**Description**: The outer `--reviewer fresh` path spawns a subagent, then its brief tells that subagent to run `/orbit:review --reviewer fresh` and follow the same skill. The skill's dispatch step applies to that same flag and has no worker exception, so literal execution spawns again instead of reaching the passes or emit. The built `getSkillTemplates()` output retains both instructions. Make the brief identify the subagent as the already-dispatched worker and direct it to execute the review passes and emit without redispatching; keep dispatch exclusively in the invoking session.

### The metadata probe can disagree with the trail's pass set
**File**: src/core/templates/workflows/review.ts:813
**Description**: The table bounds qualifying walks by the latest independent *pass*, but Step 5 treats every `external-<mode>-*.md` filename as such a pass and reads only the literal `reviewer_class` from internal JSON. The trail reader rejects malformed external returns as non-passes (`trail.ts:193-202`) and infers `fresh` from legacy `flags.fresh` when the field is absent (`trail.ts:237-244`). Two constructed system trails expose opposite genre decisions: a fresh pass at T0, a same-mode walk at T1 and a rejected external file at T2 should make the next in-context pass VERIFICATION by the table, while the filename probe makes it REVIEW; a same-mode walk at T1 followed by a legacy `flags.fresh: true` pass at T2 should make it REVIEW, while the raw-field probe makes it VERIFICATION. A scratch `readTrail()` run confirmed both normalized pass sets. Specify a metadata-only probe that uses the same accepted-pass and class-inference rules as the trail reader, and cover these cases with decision-table tests.

### The brief check misses indirect and reworded prior-finding reads
**File**: test/core/templates/review-genre-brief.test.ts:97
**Description**: The test implements the delta's narrow PHRASE and REGION rules, but those rules do not enforce the owner's broader promise for instructions a REVIEW reviewer follows. In a temporary probe, adding `Read the last review pass findings before you begin` inside the fresh brief or `Read the previous review summary before beginning` to the prompt's project context left both detectors green: neither uses a listed phrase or `.orbit-runs/`. Adding `Read orbit/changes/<name>/.orbit-runs/review-system-previous.json before Pass 0` to `passes-system.md` also stayed green because the REGION check never inspects that reference, although the fresh worker is told to load it. The test is faithful to the ADDED requirement's stated detection rule; that rule is too narrow for the owner requirement. Amend the rule and test to cover read instructions in references a REVIEW pass actually loads, with explicit exemptions for output destinations and the allowed metadata probe, and add adversarial phrasing cases.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The fresh worker needs an unambiguous path to perform the pass without dispatching again, and the in-context genre decision needs to agree with the trail reader. The brief check should then guard the linked instructions that a reviewer follows.

## Notes

The targeted brief and parity tests passed; the full suite passed with 2498 tests, and the build, strict change validation and fingerprint check passed. The actual committed external prompt excludes this change's trail from its concrete diff command and carries only the iteration line in Cycle context. The requested untouched-engine diff is empty. The project and lens files named as optional context are absent. Task 3.5 is explicitly reserved for user validation at the walk of this first committed prompt.
