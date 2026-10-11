# External Review: explicit-lifecycle-consent (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-10

## CRITICAL

### Change-level era exemption misses post-D1 emits from pre-D1 active changes
**File**: orbit/changes/explicit-lifecycle-consent/specs/orbit-audit-drift/spec.md:10
**Description**: The tripwire classifies consent-era solely from the change metadata (`schema_version >= 3`) and exempts every emit for a change whose metadata lacks `schema_version`. That protects old archives, but it also exempts active changes scaffolded before D1 that later run `/orbit:apply` or `/orbit:archive` after the new bodies ship. The current active change demonstrates the shape: its `.openspec.yaml` has only `schema`/`created`/fingerprints because `orbit new change` writes metadata only at scaffold time; unless the design migrates or stamps active pre-D1 changes, a post-D1 archive emit for this change could omit `consent` and audit-drift would suppress the named re-entry trigger. This violates the stated post-capability emit tripwire. Split the exemption so it covers archived pre-D1 emits, not all future emits from no-version changes; or define a migration/transition marker that lets active pre-D1 changes become consent-era without falsely flagging their older emits. Add a regression for an active no-`schema_version` change that emits archive/apply after D1.

## WARNING

### Canonical apply emit example still omits consent
**File**: orbit/changes/explicit-lifecycle-consent/specs/orbit-conventions/spec.md:64
**Description**: The workflow-kind canonical example is explicitly an `apply-*.json` emit, and the requirement says canonical examples illustrate the spine plus per-kind extensions. The per-kind prose above it now says consent-era `apply` emits carry `consent`, and `orbit-run-summary-emit` makes that field mandatory for post-capability apply emits, but this canonical apply example still omits the field. Add `"consent": "user-invoked"` (or explicitly label the example as pre-consent-era, though that is weaker for implementers) so the canonical example does not contradict the new apply emit requirement.

### Audit task still instructs a timestamp fallback
**File**: orbit/changes/explicit-lifecycle-consent/tasks.md:50
**Description**: Task 3.1 tells the implementer to use an era boundary of "consent-aware schema version, timestamp fallback", but the revised design and specs explicitly reject timestamp cutoffs and make the persisted metadata marker the authority. This stale checklist text can reintroduce the just-rejected fallback during implementation. Remove "timestamp fallback" and align the task with the schema-version marker rule plus the active/pre-D1 transition fix above.

## SUGGESTION

None.

## Notes

`node bin/orbit.js validate explicit-lifecycle-consent --strict` passed, and `node bin/orbit.js fingerprint explicit-lifecycle-consent --check` reported 8/8 verified. `npm install` and the build completed successfully. `npm test` did not complete green in this checkout because tests shell out through an unquoted path containing the workspace space (`/Users/sal/Documents/orbit 2`), causing Node to resolve `/Users/sal/Documents/orbit`; I did not count that as a proposal finding.
