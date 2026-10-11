# External Review: explicit-lifecycle-consent (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-10

## CRITICAL

### Era detection resolves old spec-driven changes as v3
**File**: orbit/changes/explicit-lifecycle-consent/specs/orbit-audit-drift/spec.md:10
**Description**: The tripwire applies only when a change's `.openspec.yaml` schema resolves to a consent-aware schema version, falling back to a timestamp cutoff only when resolution fails. Current change metadata records only `schema: spec-driven`, with no schema version, and the resolver loads the current built-in schema. After this change bumps `spec-driven` to v3, old C1/C2 archives with `schema: spec-driven` will also resolve as v3 and their pre-consent apply/archive emits can be falsely flagged instead of exempt. Add a durable era signal: either persist schema version in per-change metadata and backfill/handle old metadata, or make the timestamp/capability-landed cutoff the primary path when metadata lacks a version. Add a test using an archived pre-D1 change whose `.openspec.yaml` only says `schema: spec-driven`.

### Standalone sync consent is specified but has no implementation path
**File**: orbit/changes/explicit-lifecycle-consent/specs/orbit-lifecycle-consent/spec.md:46
**Description**: The spec says a standalone AI-mediated `/orbit:sync` fires the consent prompt, but proposal/design/tasks scope only apply, archive, and bulk-archive bodies; design D1 says consent-scoped commands are phases behind consent-marked gates, while sync merely inherits a containing flow. Baseline `orbit-sync-specs` is upstream-verbatim and `/orbit:sync` has no run-summary emit, so a fresh implementer has no specified body, emit field, or audit behavior for this standalone prompt. Either remove standalone sync from D1 and state it only inherits archive consent, or add explicit sync-specs/conventions/run-summary/tasks coverage for its prompt and consent record.

## WARNING

### Canonical run-summary examples still omit consent
**File**: orbit/specs/orbit-conventions/spec.md:182
**Description**: `orbit-conventions` owns the internal-run JSON summary format and includes canonical workflow/lifecycle examples, but the change only adds a no-chaining requirement there. The existing apply and archive examples still omit the new `consent` field, and the lifecycle extension list still describes archive fields without it, while the new run-summary and archive deltas require consent on post-capability emits. Add a MODIFIED block for `Internal-run JSON summary format` so the canonical examples and lifecycle extension prose include `consent` (or explicitly mark examples as omitting era-specific fields, though updating them is clearer).

## SUGGESTION

None.

## Notes

Structural checks passed locally: `npm install`, `npm run build`, `node bin/orbit.js validate explicit-lifecycle-consent --strict`, and `node bin/orbit.js fingerprint explicit-lifecycle-consent --check` (6/6 verified).
