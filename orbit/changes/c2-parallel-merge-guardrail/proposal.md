# Proposal: c2-parallel-merge-guardrail

## Why

Archiving a change whose `## MODIFIED Requirements` block was authored against a stale baseline
**silently overwrites** sibling edits that landed in the meantime: the delta is an absolute
snapshot of the whole requirement, and `buildUpdatedSpec` applies it as a wholesale replace
(`nameToBlock.set(key, mod)` in `src/core/specs-apply.ts`). Two parallel changes touching the same
requirement therefore corrupt the source-of-truth spec with no warning, diff, or record — the
documented Windsurf-vs-Kilo failure mode in `openspec-parallel-merge-plan.md`, and fork question
Q8. C2 is the final phase of the fork's 6-phase program (D9): make **silent** spec data-loss
impossible.

## What Changes

- **Base fingerprints captured at authoring time**: when a change's delta specs are generated
  (propose / continue / ff), the current baseline block of every MODIFIED/REMOVED/RENAMED
  requirement is hashed (SHA-256 over the parser's normalized `raw`) and stored in the change's
  `.openspec.yaml` under a new optional `base_fingerprints:` map (capability → requirement → hash).
- **A deterministic CLI capture/check surface**: a new `orbit change fingerprint <name>` subcommand
  stamps fingerprints (idempotent; add-missing-only by default, `--refresh` for the deliberate
  re-stamp) and verifies them (`--check [--json]`), so AI workflow bodies never hand-compute hashes.
- **Archive-time divergence guard**: before `buildUpdatedSpec` mutates a spec, the live hash of
  each MODIFIED/REMOVED/RENAMED requirement is recomputed and compared to the stored fingerprint.
  On mismatch the engine refuses by default and prints the divergence (the requirement plus a
  `current live ▸ what-would-be-written` diff, so the user literally sees what they'd drop); an
  explicit override flag exists for the deliberate proceed.
- **Inflection prompt, mirroring C1**: the archive workflow fires C1's apply-parity prompt pattern
  (reconcile / proceed-anyway / abort). Proceeding records
  `fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]` in the archive run
  summary — the exact analogue of `gate_overridden`.
- **Missing-fingerprint is not a loophole**: a MODIFIED/REMOVED/RENAMED requirement with no stored
  fingerprint warns at archive ("can't verify — no base recorded") and the proceed is recorded in
  the run summary; it never silently passes.
- **Guided-manual reconcile (Phase 0)**: on reconcile, the user hand-edits the delta to incorporate
  the divergent content, then re-stamps via `orbit change fingerprint <name> --refresh`. The known
  blind-re-stamp footgun is accepted for Phase 0 (only reachable after the loud diff) and is what
  the deferred Phase-1 3-way merge removes.
- **Explicitly deferred** (scope discipline, per explore.md D-c2-1): Phase 1 (3-way merge /
  `rebase` command) and Phase 2 (scenario-level delta granularity) are follow-ups, not C2.

## Capabilities

### New Capabilities

- `orbit-base-fingerprints`: base-fingerprint capture at every spec-authoring point
  (propose/continue/ff), the `base_fingerprints` metadata format in `.openspec.yaml`, the hashing
  rule (verbatim block `raw`, line-ending normalization only), the `orbit change fingerprint`
  stamp/check CLI surface, the archive-time divergence guard in the spec-apply engine (refuse by
  default, explicit override, idempotent-write skip), and the guided-manual reconcile flow.

### Modified Capabilities

- `orbit-archive-modifications`: the archive flow gains the fingerprint-divergence inflection
  prompt (reconcile / proceed-anyway / abort, firing after the `review-system` gate prompt); the
  archive run summary gains the conditional `fingerprint_overridden` and `fingerprints_unverified`
  fields; the shipped `references/archive-summary-schema.md` documents them.

## Impact

- **Engine**: `src/core/artifact-graph/types.ts` (`ChangeMetadataSchema` + `base_fingerprints`),
  `src/utils/change-metadata.ts` (round-trips the new field), `src/core/specs-apply.ts`
  (`buildUpdatedSpec` guard), `src/core/archive.ts` (override flag plumbing), new fingerprint
  module + `orbit change fingerprint` CLI registration.
- **Workflow templates** (`src/core/templates/workflows/`): `propose.ts`, `continue-change.ts`,
  `ff-change.ts` (capture step), `archive-change.ts` (divergence prompt + summary fields),
  `bulk-archive-change.ts` (brief note: the guard fires per-archive; handle refusals per change).
- **Dogfood recursion**: C2's own delta is the first change verified by the guard it defines —
  the apply order in `tasks.md` must land guard + capture before C2 itself archives.
- **Compatibility**: `base_fingerprints` is optional — existing changes and archives (which lack
  it) archive with the D-c2-7 warn path, never a hard failure. No migration required.
- **Tests**: green baseline 1576 is the contract; new unit coverage for the metadata schema,
  hashing, guard outcomes (verified / diverged / unverified / idempotent-skip), and CLI stamp/check.
