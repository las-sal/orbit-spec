# External Review: d2-architect (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-14

## CRITICAL

### D1 cannot compute complete without a back-citation
**File**: orbit/changes/d2-architect/design.md:101
**Description**: The retrofit plans to mark D1's `Complete:` slot as `[x] 2026-07-13 (Sal)`, but the state algorithm renders `complete` only when the observed state is `quiescent`, and `quiescent` requires at least one archived change whose metadata cites the stage. The archived D1 metadata at `orbit/changes/archive/2026-07-13-explicit-lifecycle-consent/.openspec.yaml` currently has no `architecture:` citation, while this design says D2's own change is the first live citation. After the state lines are deleted, `orbit architecture status` would therefore observe D1 as `premised` (or at least non-quiescent), not `complete`, violating D2 exit criterion 1 ("status matches reality") on the very first retrofitted doc. Add an explicit retrofit task/spec scenario to backfill the archived D1 change with `architecture: {doc: d-arc-arbitered-flow, stage: d1-explicit-lifecycle-consent}` (or define another observable source for pre-D2 archived stages), and extend validation/audit to flag any ratified `Complete:` mark whose observed state is not quiescent, including `premised`, not only stages with live citing work.

## WARNING

### Audit skip can hide dangling architecture citations
**File**: orbit/changes/d2-architect/specs/orbit-audit-drift/spec.md:12
**Description**: The requirement says dangling `architecture:` citations in change/explore metadata are CRITICAL, but the same paragraph and scenario say that when no parseable architecture docs exist the check skips with no findings. A typo such as `architecture: {doc: missing-doc, stage: d2-architect}` in a change's metadata can create exactly a "no parseable docs" repo while still being a dangling citation the audit is supposed to catch. Make the skip conditional on both "no parseable docs" and "no architecture citations found in change/explore metadata"; otherwise scan citations independently and emit the CRITICAL.

## SUGGESTION

### Define conflicting architecture metadata merge precedence
**File**: orbit/changes/d2-architect/specs/orbit-propose-modifications/spec.md:5
**Description**: The staged metadata merge says staged `architecture:` carries forward and fresh `schema`/`created`/`schema_version` win, but it does not define the conflict case where the freshly-created change metadata already has an `architecture:` value and the staged metadata has a different one. That can happen after this field exists via manual edits or future `orbit new change` behavior. Add a scenario that either declares staged metadata authoritative for `architecture`, or aborts on a mismatch with a clear prompt, so the merge is deterministic and loss-free.

## Notes

I ran `npm run build`, `node bin/orbit.js validate d2-architect --strict`, `node bin/orbit.js fingerprint d2-architect --check` (13/13 verified), and `node bin/orbit.js status --change d2-architect --json`. I did not find the prior un-delta'd baseline contradiction class in the mode/location/emitter/count surfaces I swept after the internal fixes.
