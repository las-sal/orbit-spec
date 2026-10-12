# External Review: rc12-body-adoption (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-11

## CRITICAL

### Archive preflight runs after its required active directory has moved
**File**: orbit/changes/rc12-body-adoption/design.md:65
**Description**: The design adopts `orbit pr preflight` at archive Step 5.45. The existing workflow performs the move-to-archive at Step 5, before Step 5.45. However, `prPreflight` requires `orbit/changes/<change-name>/` to exist and throws a usage error otherwise. The new consumption table treats that error as termination of the PR layer, so the archive never reaches its intended commit, push, description update, or READY flip. Move preflight explicitly before the directory move, retain its record through the move, and pass that retained observation to the emit and tail. Add verification that follows the actual workflow order.
**Reproduction**: Construct an active change `demo` with a valid per-proposal attachment and an open draft PR. Follow the specified archive sequence: Step 5 moves `orbit/changes/demo/` to `orbit/changes/archive/2026-10-11-demo/`; Step 5.45 calls `orbit pr preflight demo --json`. Expected: observe the attached PR, write the archive emit, and execute the printed tail. Observed by applying `src/core/pr/preflight.ts`’s active-directory check: the command throws `no active change 'demo' (expected orbit/changes/demo/)`. The delta’s non-zero-exit row stops the PR layer, leaving the archive unpushed and the PR draft.

## WARNING

### Selection failure needs an explicit latch disabling publish
**File**: orbit/changes/rc12-body-adoption/specs/orbit-pr-lifecycle/spec.md:70
**Description**: The table says a skipped call “runs nothing, and continues unattached,” while the preceding sentence independently requires `select` at phase 1 and `publish` at phase 3. It does not explicitly say that a skipped selection or failed switch disables publish for the entire invocation. `publish` does not enforce the selection preconditions or verify that HEAD is the selected branch. A consumer following the calls independently could publish after a dirty-tree or generation-input skip, committing artifacts on the current branch and pushing the derived target branch. State that `off`, `skip`, usage errors, and failed selection steps disable all later PR phases while generation continues on the current branch. Verify that publish is never called in those cases.

### Attachment emission lacks the replacement data-mapping procedure
**File**: orbit/changes/rc12-body-adoption/specs/orbit-pr-lifecycle/spec.md:74
**Description**: The replacement table instructs the body to write an emit between publish segments but does not specify how to construct `pr_attachment` from the record and executed step results. The design deletes the existing attachment-record runbook, while `publish` supplies only the attachment identity in `observations.attachment`; a newly created PR’s URL arrives from the `open` step’s stdout, and an adopted PR uses `observations.adopted_url` and `adopted_state`. Specify this mapping explicitly, including draft state after creation, URL-less attachments after degradation, and local emit handling after step failure. The existing publish test helper implements this mapping, but it should not be an unstated requirement discoverable only from tests.

### The unchanged citation-note requirement contradicts the new divergence rule
**File**: orbit/changes/rc12-body-adoption/specs/orbit-pr-lifecycle/spec.md:125
**Description**: The new table suppresses divergence for a per-proposal attachment when a citation changes under `pr: per-proposal`. The archived `Config selects the regime; citation selects the target` requirement still says citation additions or removals are surfaced as a one-line note, and its `Citation edited after propose is a no-op` scenario requires that note without restricting the regime. An implementation cannot satisfy both that scenario and the new instruction to write the note from `diverged: true`. Modify the owning freeze requirement and scenario to distinguish an effective target change from a citation edit irrelevant to the current regime.

## SUGGESTION

### The no-record-shape-change claim excludes an actual observation addition
**File**: orbit/changes/rc12-body-adoption/proposal.md:52
**Description**: The proposal and design claim no change to the `orbit pr` record shape, but task 1.2 adds `observations.citation.would_select`. Clarify that the top-level record and attachment schema remain unchanged while the preflight observation payload gains this field.

## Blocks

None.

## Direction

**Disposition**: hold

The archive call must be placed where its required input still exists. The replacement instructions also need to preserve the state carried between selection, publication, and attachment recording, and the citation-note rules must agree across the baseline and delta before implementation.

## Notes

I compared all change artifacts with the affected baseline requirements and inspected the command implementations, workflow seam ordering, and publish execution helper. No unresolved `@review:` markers were found in the change directory. CLI validation could not execute because this checkout lacks `dist/cli/index.js`; this is an unverified check, not evidence of an artifact validation failure.

The environment is read-only. I could not write the findings file or commit/push it; this complete markdown is the manual-save fallback.