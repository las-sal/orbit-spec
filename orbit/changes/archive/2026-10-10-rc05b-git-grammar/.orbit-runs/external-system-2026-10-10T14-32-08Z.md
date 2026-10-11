# External Review: rc05b-git-grammar (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-10

## CRITICAL

None.

## WARNING

### Capture silently skips additional written forms of the same flag
**File**: scripts/capture-git-contract.capture.ts:125
**Description**: The capture retains only the first token encountered for each flag name. If the surface contains both `git status --porcelain` and a later `git status --porcelain=definitely-invalid`, only the first form is probed. The recorded flag remains accepted, and the validator accepts the invalid form too. I directly confirmed that the checked-in validator accepts the latter argument vector while real git reports `fatal: unsupported porcelain version 'definitely-invalid'`.

The requirement says surface flags are probed in the form the surface writes them. Its named limitation concerns forms introduced **after** capture; this implementation also misses rejected forms already present **during** capture. Probe every distinct written form before consolidating entries by flag name, and ensure a rejected surface form cannot disappear behind an earlier accepted form. Add a case containing two forms of the same flag, with the rejected form second.

### Redirection handling does not satisfy the declared operator closure
**File**: test/helpers/surface-snippets.ts:159
**Description**: The delta claims closure over POSIX control and redirection operators, but the tokenizer does not recognize `>|`, `<>`, `<&`, or `<<-` correctly. For example, directly evaluating the tokenizer gives `git status >| out` two segments, `['git', 'status']` and `['out']`, rather than dropping the redirection and its target. `git status <> file` retains `<>` and `file` as arguments. A redirect target named `git` after `>|` can consequently become a fabricated tool invocation.

The advertised `<<` handling also drops only the delimiter token: `extractFenceLines` subsequently interprets here-document content as commands. A shell fence containing `git status <<EOF`, then `git frobnicate <path>`, then `EOF` therefore validates the data line as an invocation and reports an unknown command.

Implement the declared redirection forms and consume here-document bodies, or explicitly refuse unsupported forms and narrow the spec’s closure claim with a named residual method. Cover redirect targets that resemble tool names and here-document bodies containing command-shaped text.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The shared extractor and recorded-contract approach fit the change’s intent, and production surfaces remain untouched. However, the capture can omit a malformed form already on the surface, and the extractor claims broader shell coverage than it implements. Correct these instrument gaps before relying on the sweep as evidence that generated commands conform to their contracts.

## Notes

Reviewed the commit range beginning at `bbd1ccc8`, the proposal, design, tasks, both capability deltas, affected archived baselines, and the changed capture, extractor, validator, sweep, and test callers. All executable task checkboxes are marked complete; the Purpose update is explicitly deferred to archive. The `gh` extractor migration retains the shared validator used by the harness stub.

Scenario coverage verification was **not run**. The requested `orbit status --change rc05b-git-grammar --scenarios --json` invocation failed because `dist/cli/index.js` is absent. Strict validation could not run for the same reason. Tests could not run because dependencies, including Vitest, are absent; the read-only environment prevents building or installing them. Task-line claims were not treated as independent verification, and scenario coverage was not inferred from test files.

The requested project, root convention, perspective, and critical-path files are absent. No unresolved `@review:` marker was found in the change artifacts outside the review trail. The reported gaps affect test-instrument fidelity; no broken adopter path or data loss was demonstrated.