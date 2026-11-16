# External Review: tripwires (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-16

## CRITICAL

None.

## WARNING

### The fixed-point search skips implementation in the change’s first commit
**File**: orbit/changes/tripwires/specs/orbit-tripwires/spec.md:55
**Description**: The first apply commit must occur strictly after the earliest commit touching the change directory. If commit C first adds the proposal artifacts alongside 100 unpredicted source lines, and subsequent commits touch only the change directory, the specified search finds no apply commit and reports quiet indefinitely. No requirement rejects this history. Define how a first commit containing both artifacts and implementation is handled: either establish a usable earlier reference or return cannot-read when a pre-implementation plan cannot be recovered. Add a fixture for this history.

### Fixed-point failure is not distinguished from work that has not started
**File**: orbit/changes/tripwires/tasks.md:5
**Description**: The planned `fixedPoint` interface returns null before the first apply commit, but does not define an error result for unavailable git history, an uncommitted change directory, or a failed history command. The referenced `firstCommitTouching` helper also returns null for both missing history and git failure. An implementation following this interface can turn those failures into quiet with a null reference, contrary to the spec’s cannot-read rule. Define distinct results for a successfully established pre-apply state and an unreadable or unresolvable reference, and test both paths through the emit surface.

### Comma-joined paths do not uniquely identify a deviation
**File**: orbit/changes/tripwires/design.md:77
**Description**: Valid repository paths can contain commas. The firing set containing only `src/a,src/b.ts` and the firing set containing `src/a` plus `src/b.ts` both produce `touchpoints:src/a,src/b.ts`. An answered stop for the first deviation therefore suppresses a question about the second, and the brief merges their evidence. Use an unambiguous encoding of the sorted path array, such as JSON serialization or a hash of that serialization, and add a collision fixture.

### Rename handling is left to git’s presentation format
**File**: orbit/changes/tripwires/specs/orbit-tripwires/spec.md:227
**Description**: The sensor is specified around `git diff --numstat`, without fixing rename detection or defining how rename records become paths. Git can render a rename as `src/{old => new}.ts`, which is not a repository path the Touchpoints matcher can classify. A pure rename can also carry zero changed lines, allowing an unpredicted destination to evade both tolerances, whereas disabling rename detection yields deletion/addition counts and potentially a firing. Specify the rename policy, actual paths to classify, line-count policy, and machine-readable parsing flags. Add predicted-to-unpredicted rename fixtures so results do not depend on git configuration.

### Binary files have no defined contribution to the share calculation
**File**: orbit/changes/tripwires/specs/orbit-tripwires/spec.md:230
**Description**: Binary paths are treated as exceeding the per-file tolerance, but the source-line numerator and denominator remain undefined when git returns `-`. For example, consider 10 unpredicted text lines, 30 predicted text lines, and one predicted binary file: excluding binary counts yields a 25% share and fires; treating the binary count as an artificial large value can make the same text drift quiet. Define binary participation in both share totals, including the zero-denominator case, and add mixed binary/text scenarios.

## SUGGESTION

### Historical measurement needs a bounded endpoint
**File**: orbit/changes/tripwires/tasks.md:92
**Description**: Task 6.1 asks the built sensor to reproduce the measurement over archived changes, but its measure ends at HEAD. Running every archived change against today’s HEAD includes later changes and cannot reproduce each change’s original diff. Specify the historical endpoint or checkout used for each archived change, including whether archive-sync edits belong in the measured interval.

## Blocks

None.

## Direction

**Disposition**: hold

The fixed-point and deviation-identity rules need tightening before implementation. They currently permit histories or path sets that silently suppress a firing. The diff rules also need explicit rename and binary semantics so independent implementations produce the same readings.

## Notes

I checked the proposal, design, tasks, delta specs and exploration against the affected baselines and the existing git, Touchpoints and decision-record helpers. No unresolved inline review markers were found.

`node bin/orbit.js validate tripwires --strict` could not start because `dist/cli/index.js` is absent. Structural validation remains unverified; this startup failure does not establish an artifact validation defect.

The environment permits reads only. No findings file was written, and I could NOT commit or push it.