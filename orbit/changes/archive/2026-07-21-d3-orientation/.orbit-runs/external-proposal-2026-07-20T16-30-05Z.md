# External Review: d3-orientation (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-20

## CRITICAL

### The specified bare/full payloads do not satisfy the per-change cold-start exit criterion
**File**: orbit/changes/d3-orientation/specs/orbit-orientation/spec.md:149
**Description**: The arc-owned exit criterion requires ONE command, with several active changes, to answer position, last workflow command, and next eligible command(s) per change. Bare output specifies those fields only for the single sprint workstream and reduces every other live workstream to `name (phase)` on `also`; bare JSON likewise has one `{sprint, last, next, also, waiting}` tuple. The full view specifies nested workstreams plus one global LAST band, but never normatively requires per-workstream last/next in text, and its JSON workstream entry shape is unspecified. This directly conflicts with task 5.1, which says bare `orbit status --json` answers position/last/next per workstream. Make one tier explicitly satisfy the acceptance test (most naturally `--full`): require every rendered/JSON workstream entry to carry position/strip, its own last command/assessment, and its own current next recommendation; change task 5.1 to invoke that tier and add multi-change text and JSON assertions. If bare JSON is intended to satisfy it instead, its declared shape must include the other workstreams' complete orientation rather than an `also` summary.

## WARNING

### Ratified D-d3-4 still mandates the pre-resolution Mode C zero-count emit
**File**: orbit/changes/d3-orientation/explore.md:44
**Description**: The least-reviewed Mode C reconciliation landed in proposal/design/spec/tasks, but the owning ratified decision still says Mode B/C writes a "normal emit shape" with `decisions_captured: 0` and a continue-capturing recommendation. Mode C now normatively requires back-filled counts and a maturity-consistent recommendation. Because R-d-7 makes this explore the owner of stage decision detail, this is a live cross-document contradiction rather than harmless trail history. Rewrite D-d3-4 mode-aware: zero/Early only for Mode B; back-filled counts/maturity-consistent next for Mode C; state that the Mode C begin emit is the crystallization first emit.

### Fleet collection has no malformed-input or fault-isolation contract
**File**: orbit/changes/d3-orientation/design.md:30
**Description**: `collectOrientation` scans many emit JSONs and calls `loadChangeContext` for every active change, but neither the design nor spec says what happens when the newest emit is invalid/unreadable or one workstream's metadata/schema cannot load. The cited trail reader skips bad files, while `loadChangeContext` can throw; two implementers can therefore either silently choose an older emit, render a degraded row, or abort the entire fleet command. A single damaged workstream must not accidentally erase orientation for all healthy work. Specify the policy for invalid emit contents, unreadable/malformed metadata, and per-change status failures; add fixtures proving deterministic fallback and fault isolation, including how `last`/`next` render when no valid emit remains.

### Second-resolution filenames cannot guarantee distinct begin and boundary emits
**File**: orbit/changes/d3-orientation/specs/orbit-run-summary-emit/spec.md:62
**Description**: Named explore now SHALL emit both at BEGIN and at a conversation boundary, but both use `explore-<TS>.json` and the repository's token grammar has only one-second resolution. A fast scaffold-and-wrap can generate the same path twice, overwriting the begin record or failing the second write, so the mandated two-event trail is not representable for that edge case. Define collision handling that preserves lexical timestamp ordering (or explicitly coalesces the events with a specified shape) and carry it with a test.

### A later unrelated external result can clear the wrong waiting item
**File**: orbit/changes/d3-orientation/specs/orbit-orientation/spec.md:129
**Description**: WAITING clears a `review-external` T0 whenever any later `external-<as>-*.md` exists in the same trail. If two external reviews of the same mode are packaged before either returns, the first result is later than both T0 records and falsely clears both, even though one handoff is still outstanding. The T0 emit already carries `prompt_path`, but the findings filename has no specified correlation to that prompt. Define an unambiguous pairing rule (for example a shared handoff id/token recorded in T0 and the returned artifact), or explicitly prohibit concurrent outstanding reviews per change/mode and test the transition.

## SUGGESTION

### Claimed strip truncation rules do not exist
**File**: orbit/changes/d3-orientation/design.md:133
**Description**: The risk section says strip-width truncation rules live in the spec's rendering scenarios, but the spec only caps the `last` assessment; it gives no terminal-width or truncation behavior for a long workstream name, stage citation, or lifecycle strip. Either add the promised deterministic strip truncation rule and scenario or remove this claim and record unbounded width as the accepted v1 behavior.

## Notes

`npm run build`, strict validation, and all 6 fingerprint checks pass. The full suite result is 1688 passed / 24 failed, exactly the prompt's documented path-with-spaces command-test failure class (`node /Users/sal/Documents/orbit 2 2/...` is interpolated without quoting); no additional test failures appeared. No actionable `@review:` residue or non-historical overlay vocabulary leakage was found. Delta/task counts are 14 requirements across 4 files and 16 tasks across 5 groups.
