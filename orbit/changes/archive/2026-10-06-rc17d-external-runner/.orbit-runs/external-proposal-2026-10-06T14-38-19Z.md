# External Review: rc17d-external-runner (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-06

## CRITICAL

### Normalization can hide real findings by changing fence boundaries
**File**: orbit/changes/rc17d-external-runner/specs/orbit-external-runner/spec.md:137
**Description**: Selecting the first heading without tracking Markdown fences can promote a quoted example into the review and hide the actual findings. Removing an example’s opening fence makes its closing fence open a new fenced region, concealing everything afterward from both existing readers. Preserving the remaining bytes does not preserve their meaning. Select a structural heading outside fences, and test that normalization preserves the findings the readers recognize.
**Reproduction**: Construct two complete reports, D0 and D1. Both have header `# External Review: demo (iteration 1)`, reviewer `stub`, date `2026-10-06`, all three severity sections, and a valid Direction section. D0 has `None.` under every severity. D1 replaces CRITICAL’s `None.` with:

```markdown
### User records are deleted
**File**: src/store.ts:10
**Description**: Saving one record deletes its peers.
**Reproduction**: Seed records A and B, update A, observe B is deleted.
```

Construct the raw return as `The format example is:\n` + an opening three-backtick `markdown` fence + D0 + its closing fence + D1. Apply the proposed rule: remove everything before the first line beginning `# External Review:`. Expected: D1’s finding remains visible. Observed in probes against both existing readers: the raw return yields one CRITICAL; the normalized return is accepted with zero findings. The normalization has hidden the actual review.

### An older snapshot can satisfy review coverage after a newer apply
**File**: orbit/changes/rc17d-external-runner/specs/orbit-external-runner/spec.md:139
**Description**: The runner reviews the handoff commit, but its pass receives the current timestamp when the return is saved. Design D4 explicitly allows the user to keep working meanwhile. Nothing checks whether another apply changed the reviewed inputs before acceptance. The unchanged freshness rule therefore treats an older-snapshot review as fresh. Define return-time handling for intervening applies and changes to reviewed inputs, or carry snapshot provenance into freshness; a late return must not silently certify newer work.
**Reproduction**: Use a system gate with cadence `[invoked, in-context]`. Launch the external runner against commit H at `2026-10-06T10-00-00Z`. At `10-05-00Z`, apply changed implementation and emit `apply-2026-10-06T10-05-00Z.json`. The runner, still reviewing H, returns no findings at `10-10-00Z`; save it under that timestamp as required. Add a zero-finding in-context pass at `10-11-00Z`. Expected: the external review of H does not supply fresh coverage for the later implementation. Observed when this constructed trail was passed to the existing `evaluateReviewedGate`: `state: 'passed'`. `isPassStale` returns `false` because the apply token precedes the save token.

## WARNING

### The retirement misses a contradictory fourth capability
**File**: orbit/changes/rc17d-external-runner/proposal.md:49
**Description**: The proposal lists only two modified capabilities, but `orbit/specs/orbit-review/spec.md:34` explicitly requires that “no review passes run in this invocation” for `--reviewer external`. Its generated trunk repeats this at `src/core/templates/workflows/review.ts:865`, outside the reference targeted by the tasks. These instructions contradict the new launch branch. Within `orbit-review-external`, the unchanged command-availability scenario still requires a paste-ready instruction, and the recommended-session requirement remains unconditional. Carry the necessary retirement deltas and template edits, narrow manual-only requirements to the manual route, and reassess the capability ceiling.

### Registering the config key does not enable the documented preset setter
**File**: orbit/changes/rc17d-external-runner/tasks.md:3
**Description**: `validateConfigKeyPath` rejects nested keys for every root except `featureFlags`. An in-memory probe adding only `externalRunner` to the known-key set still returned `"externalRunner" does not support nested keys` for `externalRunner.preset`. There is also an unspecified transition: setting that property on an existing `{argv: [...]}` record preserves `argv`, producing the explicitly forbidden both-keys shape. Specify the nested-key validation change and whether switching forms replaces the old record or requires an explicit unset; test both initial setup and switching from an own argv.

### A heading-bearing malformed return follows the success path
**File**: orbit/changes/rc17d-external-runner/specs/orbit-review-external/spec.md:48
**Description**: A runner can exit zero and write only `# External Review: demo (iteration 1)`. The save command accepts this because its only content refusal is absence of that heading. The body then commits and pushes it, announces success, removes the worktree, and only afterward attempts rendering, which rejects the missing reviewer and severity sections. This is outside the declared residual, which concerns incomplete reviews that still parse. Define malformed-return handling before success reporting, including missing or unreadable output files, parser rejection, raw-output preservation, cleanup, and the fallback.

### Push failures are not reflected consistently in completion and fallback output
**File**: orbit/changes/rc17d-external-runner/specs/orbit-review-external/spec.md:99
**Description**: The completion scenario unconditionally adds `Findings committed (<short-sha>) and pushed`, although the commit requirement explicitly permits failed pushes and the launch supports repositories without remotes. Separately, a failed handoff push followed by a failed runner prints the paste invocation even though the remote lacks the prompt it names, contradicting the handoff preflight. Make completion attestations conditional on actual push results, and route failed runs through the existing blocked/local handoff rules instead of unconditionally printing a usable pull instruction.

### The unchanged prompt gives writable custom runners conflicting ownership
**File**: orbit/changes/rc17d-external-runner/design.md:79
**Description**: The unchanged-prompt argument establishes behavior only for the read-only Codex preset. An own argv need not be read-only, yet the prompt tells any reviewer with filesystem/git access to write, commit, and push findings. Such a runner can create its own findings commit in the detached worktree while the parent subsequently saves and commits the captured return again. The parent’s sole ownership of persistence is therefore not a contract for all admitted runners. Specify the custom-runner permission and persistence contract, and reconcile it with the prompt’s commit instructions.

### The machine-readable command interfaces lack concrete schemas
**File**: orbit/changes/rc17d-external-runner/specs/orbit-external-runner/spec.md:8
**Description**: The workflow depends on `orbit external runner --json`, but the spec alternates between “prints `none`” and “one object” without defining the absent-state representation or property names for the resolved record. The save command likewise promises an object containing a path and removed lines without specifying its keys or value types. Independent implementations could choose incompatible interfaces. Provide exact JSON examples or a discriminated schema for absent, malformed, preset, and argv results, plus save results, and specify that warnings remain outside JSON stdout.

## SUGGESTION

### The architecture charter still names the abandoned read surface
**File**: orbit/architecture/clean-up-review-cycle.md:3099
**Description**: The live charter still says the record is surfaced through `orbit status --json`, while design D1 replaces that with `orbit external runner --json`. It also points to the former staging exploration directory at line 3105. Update these pointers and include their reconciliation in the task list so the charter describes the delivered surface.

### State what the disposable-repository test actually executes
**File**: orbit/changes/rc17d-external-runner/tasks.md:32
**Description**: Launch choreography exists only as workflow prose, so a normal test cannot execute that production path directly. The proposed test does not say whether it runs a real agent, extracts an executable procedure, or transcribes the instructions. The existing PR-lifecycle harness explicitly declares this distinction and its limitations. Specify the instrument and its relationship to the generated instructions so a successful transcription is not mistaken for proof that the shipped workflow performs those steps.

## Blocks

- `tasks.md` contains 25 unchecked tasks. `orbit/architecture/clean-up-review-cycle.md:114` sets an under-20-task ceiling and requires an over-ceiling proposal to be split before review. No exception is recorded in this change’s proposal, design, or exploration. Resolve the overage through the program’s split/block process or a recorded user-ratified exception before apply.

## Direction

**Disposition**: hold

The runner is a useful direction, but the current contract can turn a review containing real findings into an apparently clean pass and can accept an older snapshot as coverage for newer implementation. Resolve those semantics, reconcile the surviving packaging-only requirements, and specify the configuration and failure transitions before implementation.

## Notes

Reviewed checkout `d52736ed`. Strict validation succeeded with informational scenario-coverage notices. Fingerprints verified, and in-memory delta merges preserved the modified requirements’ baseline scenarios. No unresolved inline review markers were found; marker mentions in the prompt template are instructional text.

Parser, freshness, and configuration probes used the existing implementation. The relevant source files matched the globally linked checkout. Ordinary unfenced preamble text was already accepted by the renderer, contrary to the design’s blanket claim that such text is refused.

This environment is read-only. I could not write the findings file, commit it, or push it. Intended filename: `orbit/changes/rc17d-external-runner/.orbit-runs/external-proposal-2026-10-06T14-35-43Z.md`.