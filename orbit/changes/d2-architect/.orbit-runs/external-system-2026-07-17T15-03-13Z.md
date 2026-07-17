# External Review: d2-architect (iteration 2 — system mode)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-17

## CRITICAL

None.

## WARNING

### Architecture findings ingestion is still documented as change-only and two-mode
**File**: src/core/templates/workflows/address-reviews.ts:130
**Description**: The main address-reviews body now routes `review-architecture-*.json` correctly, but both references it tells the agent to read remain internally inconsistent with that route. `internal-findings-format.md` says review JSON comes only from `orbit/changes/<name>/...`, models `change` as a string, and limits `mode` to `proposal | system` (lines 130–142); the address-reviews run-summary reference then says `change: null` is only for whole-repo scope and its canonical schema has no architecture `doc` extension (lines 326–340), despite the architecture-path bullet immediately above it. The parser contract later says it ignores those top-level fields, so extraction may happen to work, but a faithful agent is given contradictory producer/consumer schemas and can reject an architecture emit or write a resolution log without the required carried `doc`. Extend the internal-findings reference with the architecture producer shape (`change: null`, `doc`, `mode: "architecture"`) and extend the resolution-log schema/field notes with architecture scope; add generated-reference assertions that ingest and output examples carry those fields.

### Onboarding still describes `/orbit:review` as a two-mode command
**File**: src/core/templates/workflows/onboard.ts:50
**Description**: The identity section's editorial-review bullet says `/orbit:review` runs either the 9-pass proposal review or the 7-pass system review, omitting the architecture mode. The later Program architecture bullet and command table do mention the third mode, so the generated onboarding body contradicts itself on the same surface. Update the editorial-review bullet to enumerate all three modes and add that phrase to the onboarding fidelity markers; the existing launcher assertion does not cover this separate generated body.

### The staged-metadata “merge” is neither generic nor fully conditional
**File**: src/core/templates/workflows/propose.ts:190
**Description**: The delta requires a real field-level merge: staged `architecture` and any future explore-side fields carry forward, while fresh `schema`/`created`/`schema_version` win, and a pre-D2 staging directory with no metadata follows the old move path unchanged. The body instead instructs the agent to copy only `architecture`, so any later explore-side extension is silently discarded, and its executable example unconditionally runs `rm orbit/explore/<name>/.openspec.yaml` even though the prose says that removal is conditional (line 204). Define the merge generically with an explicit fresh-owned denylist, preserve all other staged helper fields with staged precedence, and guard the removal (`[ -f ... ] && rm ...` or equivalent). Add fixtures for a future/sentinel staged field, a citation conflict, and a staging directory with no metadata.

### Architecture doc identifiers are not contained to filename stems
**File**: src/core/architecture/parser.ts:175
**Description**: `loadArchitectureDoc` interpolates the caller-controlled doc name into `path.join`, while `ChangeMetadataSchema` accepts any non-empty `architecture.doc`. As a result, `orbit architecture show ../../README` and `validate ../../README` both succeed against a file outside `orbit/architecture/`; even an alias such as `subdir/../d-arc-arbitered-flow` resolves as a valid citation. That alias then fails the state scan's exact doc-name comparison, so change validation can pass while `architecture status` omits the citation—the core validation/state sources disagree. Enforce a canonical filename-stem identity (no separators, `.`/`..`, or normalization aliases) in metadata and CLI inputs, verify the resolved path remains directly under `orbit/architecture/`, and add traversal/alias rejection tests for show, validate, and citation resolution.

## SUGGESTION

None.

## Notes

All six iteration-1 resolutions are present and complete: review is mode-first, architecture iteration is doc-scoped, the launcher advertises all three modes, the arc's live prose uses computed status, onboarding lists all four trails, and the first generated-body architecture review emit exists with `change: null`, `doc`, and `handoff`. The four D2 exit criteria are evidenced on disk. `npm install`, `npm run build`, strict change validation, architecture validation/status/show, and the fingerprint check passed (18/18). The targeted architecture/generated-surface suite passed 328/328. The full suite reported 1684 passing plus the known 24 command-test failures caused by unquoted interpolation of the workspace path `/Users/sal/Documents/orbit 3` (1708 total tests); that failure class is environmental. Perspective and critical-path passes degraded as instructed because `orbit/lenses/` is absent.
