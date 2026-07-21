# External Review: d3-orientation (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-20

## CRITICAL

### Degraded rows contradict the mandatory full-tuple shape
**File**: orbit/changes/d3-orientation/specs/orbit-orientation/spec.md:115
**Description**: The `--full` requirement says EVERY text and JSON workstream entry SHALL carry `strip`, `position`, its own `last`, and its own `next`, and fixes the JSON shape as `{name, kind, stage?, strip, position, last, next, gates?}`. The new fault-isolation requirement instead says a workstream whose metadata/status load fails renders only a DEGRADED row with name + one-line error. A broken workstream cannot satisfy both SHALLs, and the declared JSON shape has no degraded/error variant. Define a discriminated union and the cold-start exception explicitly (for example, healthy entries carry the full tuple; failed entries carry `{name, kind, degraded: true, error}` plus any fields that remain trustworthy). Also specify what bare view does when the selected sprint is degraded, and amend tasks 2.2/2.3/5.1 and their tests to assert the same text/JSON policy.

## WARNING

### Equal timestamp tokens have no recency tie-break
**File**: orbit/changes/d3-orientation/specs/orbit-orientation/spec.md:35
**Description**: Sprint selection and global LAST order emits only by the second-granular filename `<TS>` token. The new bump-forward rule prevents one narrow same-path begin/boundary collision, but two different workstreams or command prefixes can still emit in the same second; the continuity requirement supplies a name tie-break only for the all-emit-less metadata fallback. `parseTsToken` therefore cannot determine a unique newest emit, conflicting with the fault-isolation requirement's deterministic-render promise. Define a stable tie-break for equal valid emit tokens (for example workstream path/name then filename) and test both current-sprint and global-LAST ties.

### Archived change trails are not carried into global LAST collection
**File**: orbit/changes/d3-orientation/design.md:32
**Description**: The `--full` requirement mandates a globally most recent emit across all four trail locations, and archived changes are excluded only from anchoring the current sprint. But the aggregation design and task 1.1 enumerate active changes, staging explores, architecture, and project-wide trails without explicitly enumerating archived change trails. The most important no-live transition is an `archive-*.json` that moved under `orbit/changes/archive/...`; an implementation following the stated source list can omit it from global LAST. State that archived per-change trails are scanned for global LAST only (never as live workstreams or sprint anchors), add an implementation carrier, and extend the archive-edge fixture to assert both halves.

### Parseable but spine-invalid emits have no malformed-input policy
**File**: orbit/changes/d3-orientation/specs/orbit-orientation/spec.md:172
**Description**: The new policy skips only unreadable or JSON-invalid emit files. A parseable `{}` or an emit with wrong-typed/missing `command`, `final_assessment`, `next_recommended`, `kind`, or `mode` is invalid under the live universal-spine contract but is not covered here; it can win recency and then leave `last`, explore `next`, or count-based WAITING undefined. Define the minimum validity/type checks used by orientation (including T0 `mode` for WAITING), state whether a spine-invalid file is skipped like invalid JSON or degrades its workstream, and add a shape-invalid-newest fixture.

### Bare JSON has no staging-explore sprint shape
**File**: orbit/changes/d3-orientation/specs/orbit-orientation/spec.md:196
**Description**: Bare JSON says `sprint` embeds the same per-change status payload emitted by `--change --json`, but a staging explore is a required bare-sprint case and has no change context, gate graph, or per-change payload. The full view now declares a generic workstream entry but the bare requirement does not say whether it reuses that shape, which fields are absent/null, or what `position` means for an explore. Define a discriminated change/explore workstream JSON shape once and reuse it for bare `sprint` and full `workstreams`; enumerate `kind` values and absence/null rules for `position`, `stage`, and `gates`.

## SUGGESTION

### Design's delta map still mentions only the Mode B scenario
**File**: orbit/changes/d3-orientation/design.md:108
**Description**: D6 correctly explains Mode B and Mode C above, but its closing delta map still says `orbit-explore-modifications` is only the "Mode B scenario gains the emit." The amended delta also changes Mode C ordering and its mode-aware begin emit. Update this parenthetical to name both Mode B and Mode C so the five-artifact reconciliation is complete even in the implementation map.

## Notes

Strict validation passes; all 6 modified-baseline fingerprints verify; the build passes. The full suite produced 1688 passed / 24 failed, exactly the prompt's documented path-with-spaces interpolation failures and no additional failures. The change contains 15 delta requirements across 4 files and 16 tasks across 5 groups. No actionable `@review:` residue or non-historical overlay vocabulary leakage was found.
