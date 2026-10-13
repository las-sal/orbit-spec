# External Review: reference-docs (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### Feedback retarget omits the actual help owner and fallback label output
**File**: orbit/changes/reference-docs/design.md:115
**Description**: D5 says all three edits belong in `src/commands/feedback.ts`, but “Submit feedback about OpenSpec” is defined in `src/cli/program.ts:475`. Task 2.1 and the impact list omit that file, while the architecture carve-out explicitly names only the feedback implementation and its test. Following the stated scope cannot deliver the promised help change. Also, removing the label from the URL and argv leaves `displayFormattedFeedback` printing `Labels: feedback` (`src/commands/feedback.ts:115`), falsely describing the manual submission; its test explicitly expects that line. Correct the help owner in the design, tasks, impact list and carve-out, and include removal of the fallback label line and its assertion.

### Removing the pending CLI entry breaks an existing surface test
**File**: orbit/changes/reference-docs/tasks.md:22
**Description**: Task 4.1 removes `docs/cli.md` from the pending list without updating `test/core/user-docs/pending-rewrite.test.ts:32`. That assertion assumes the page is pending: it removes the entry and expects the unlisted set plus one `docs/cli.md`. After this change, the page is already unlisted, so the actual set contains it once and the expected array contains it twice. The requested full suite cannot pass with the listed edits alone. Add an explicit task to make this test independent of the live pending list, preferably using a constructed pending set that excludes and then admits a known page.

### Installation outline conflates package upgrades with instruction refreshes
**File**: orbit/changes/reference-docs/design.md:76
**Description**: The installation page is instructed to cover “Updating with `orbit update`,” without distinguishing an installed CLI upgrade from a project instruction refresh. `UpdateCommand` refreshes generated skills and commands using the currently installed package; it does not download or upgrade orbit. An implementation following this outline could teach users to run `orbit update` to obtain a newer release while their CLI remains unchanged. Specify both steps: install the selected published release tag through the documented npm route, then run `orbit update` in initialized projects to refresh their generated surface.

## SUGGESTION

### Execute the coverage procedure before handing it to implementation
**File**: orbit/changes/reference-docs/explore.md:53
**Description**: The mechanism records EXECUTE as not applied because the coverage test does not exist, and says propose will write it, but tasks 1.1–1.3 defer that work to implementation. R-crc-7 explicitly permits a constructed case executed by hand before spec prose. Record a small walkthrough of the proposed procedure covering a complete page, a missing subcommand, a hidden subtree, the leading and trailing boundaries, and a listed page checked alone. This would substantiate the matching and pending-list integration before codegen rather than leaving the mechanism entirely unexercised.

### Fixed domain counts undermine the intended registry-driven maintenance
**File**: orbit/changes/reference-docs/tasks.md:5
**Description**: Requiring the real domain to equal exactly 55 paths and 15 ids means a legitimate new command or workflow will fail the suite even when its documentation is added correctly. The derived coverage check already detects undocumented additions. Keep these counts as exploration measurements, or use a non-vacuity assertion alongside constructed recursive-tree tests, rather than making today's totals a permanent test contract.

## Blocks

None.

## Direction

**Disposition**: hold

The coverage mechanism and delta structure are coherent, but the implementation instructions need correction before handoff. The feedback edit scope misses the file that owns the promised help change, the pending-list transition has a predictable test failure, and the installation outline can teach an ineffective upgrade procedure. Resolve those concrete gaps before implementing the rewrite.

## Notes

Strict validation passed, and the modified requirement's baseline fingerprint verified. No unresolved `@review:` markers were found in the change artifacts. The modified requirement preserves its existing scenarios. Validation reports the new coverage scenarios as undeclared informational entries; task 1.3 plans their implementation and tags. The checkout has no local `node_modules` or `dist`, so CLI checks used the available installed orbit 2.0.0, corroborated against repository source. No feedback was submitted.

---

I could not write the findings file, commit, or push because this environment is read-only. Save this review under `orbit/changes/reference-docs/.orbit-runs/external-proposal-<fresh-ISO-timestamp>.md` and commit/push it manually.