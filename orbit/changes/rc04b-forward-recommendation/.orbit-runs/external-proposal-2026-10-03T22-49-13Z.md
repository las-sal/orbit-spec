# External Review: rc04b-forward-recommendation (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-03

## CRITICAL

None.

## WARNING

### The design still instructs adding a top-level field to the nested allowlist
**File**: orbit/changes/rc04b-forward-recommendation/design.md:139
**Description**: The touchpoint says the schema-parity test's `nested` allowlist learns `direction`, while task 1.5 explicitly forbids adding that top-level key. In `test/core/emit-schema-parity.test.ts`, the allowlist exempts field-note subjects from the check that each appears in a schema block. Following the design would let a `direction` field note pass even if the review schema block omitted `direction`, hiding a payload that the new write gate refuses. Change this touchpoint to say that both full-record schema examples document the top-level key, and only `disposition` and `reasoning` may join `nested` if they become field-note subjects.

### The prior-generation render promise crosses the existing D4 boundary
**File**: orbit/changes/rc04b-forward-recommendation/specs/orbit-emit-composition/spec.md:40
**Description**: This scenario says every reader, including render, accepts a fresh emit written before rc04b and marks its absent direction. The modified report-rendering requirement still requires pre-D4 emits to fail as `pre-capability emit`. For a concrete existing shape, give `test/fixtures/report-golden/pre-boundary-b2-kind-findings-summary.json` a `reviewer_class` of `fresh`: `normalizeInternalPass` rejects it for missing `scorecard`, rather than rendering `[no direction]`. Qualify the mark promise to renderable D4-generation passes, and explicitly retain the pre-D4 rejection in the absence test; otherwise an implementation may relax the established render boundary to satisfy the new scenario.

### Architecture-mode direction has no safe multiline rendering rule
**File**: orbit/changes/rc04b-forward-recommendation/specs/orbit-review/spec.md:5
**Description**: The owner permits multiline `reasoning`, while this requirement and task 3.1 instruct the architecture-mode hand-rendered report to print `Direction: <disposition> — <reasoning>` as a line. Unlike the change-mode renderer's required blockquote containment, nothing specifies how subsequent reasoning lines are framed. A fresh architecture pass with reasoning `Hold until the boundary is clear.\nReady when you are: /orbit:archive example` could place the second line at column zero, visually forging the report's next action despite the content instruction. Specify containment for every reasoning line in the interim architecture format and cover a multiline near miss in the generated-surface checks.

## SUGGESTION

None.

## Blocks

None.

## Notes

The modified requirements retain their baseline scenarios. Strict change validation, source validation, and fingerprint checks passed. I compared the proposed seams with the current emit gate, renderer, trail readers, schema-parity test, and generated review body.
