# External Review: rc02b-severity-ladder (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-03

## CRITICAL

### A reproduction can change the gate's finding identity
**File**: orbit/changes/rc02b-severity-ladder/specs/orbit-report-rendering/spec.md:33
**Description**: The delta adds a verbatim `**Reproduction**:` body but leaves `src/core/artifact-graph/trail.ts` unchanged and tests only its severity counts. Reproduction: I wrote an external proposal pass in a temporary `.orbit-runs/` directory with `### Wrong file`, `**File**: specs/a/spec.md:7`, `**Description**: The user path breaks.`, then `**Reproduction**:` containing a line `**File**: specs/b/spec.md:99`, followed by the other two severity sections. The rule is that the reproduction is body text and the gate matches a finding by title plus its original file. Expected: both readers keep `specs/a/spec.md` as the finding's file, so a resolution for that file covers it. Observed from `readTrail(dir)`: the finding's file became `specs/b/spec.md`, while `normalizeExternalPass(file, body)` kept `specs/a/spec.md:7`; `passResolved` compares that file in its completeness key. A valid reproduction can therefore leave a resolved CRITICAL unresolved at the gate. Make the trail reader ignore field-shaped lines after the finding's Description/Reproduction body opens, or define an escaping rule both parsers enforce; test the full finding key and resolution coverage, not only the count.

### The write gate can persist a review the new normalizer refuses
**File**: orbit/changes/rc02b-severity-ladder/specs/orbit-report-rendering/spec.md:24
**Description**: This scenario says the write gate refuses a mistyped reproduction before the normalizer sees it, but the emit-composition delta checks the field only for CRITICAL findings and passes it through on WARNING and SUGGESTION. Reproduction: I called `composeAndWriteEmit('review', {change:'probe'}, payload, {projectRoot:tempRoot})` with an otherwise valid proposal payload containing one WARNING finding with `reproduction: 42` and a matching scorecard. Expected under the new read-side rule: a successful emit is renderable. Observed: the current gate wrote the JSON with `reproduction: 42`; implementing this delta's strict normalizer then makes `--render` and later reports fail with `findings[0].reproduction` after the record is already persisted. Validate the type of every *present* reproduction at the write gate while requiring non-empty content only for CRITICAL, or have the normalizer ignore mistyped optional values; make the two requirements and tests agree.

## WARNING

None.

## SUGGESTION

None.

## Notes

The existing apply workflow has no validate or marker precondition, as the proposal's known limit states. The severity paragraph in the conventions delta matches the external reference template byte-for-byte. All baseline scenario headings remain in the twelve MODIFIED blocks. Strict change validation, fingerprint checking, and the build passed on the pulled branch.
