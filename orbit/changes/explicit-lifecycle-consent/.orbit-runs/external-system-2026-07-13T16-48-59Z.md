# External Review: explicit-lifecycle-consent (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-13

## CRITICAL

None.

## WARNING

### Straddler metadata can still be read as exempt
**File**: orbit/changes/explicit-lifecycle-consent/specs/orbit-lifecycle-consent/spec.md:123
**Description**: The requirement still says a change whose metadata lacks `schema_version` is pre-consent era and exempt, but the revised straddler rule immediately below makes `consent_era_from` authoritative for no-`schema_version` changes touched after D1. The same ambiguity appears in `orbit/changes/explicit-lifecycle-consent/specs/orbit-audit-drift/spec.md:27`, where the pre-capability scenario exempts changes whose metadata lacks `schema_version` without also requiring absence of `consent_era_from`. A reader implementing from the scenario text could suppress the missing-consent warning for exactly the straddler case D6 was revised to cover. Update both spots to say "lacks both `schema_version` and `consent_era_from`" and add an explicit audit-drift scenario for `consent_era_from` without `schema_version` checking emits at and after the stamp.

## SUGGESTION

### Clarify consent Step 0 ordering around read-only discovery
**File**: src/core/templates/workflows/apply-change.ts:19
**Description**: Apply lists consent as Step 0 before change selection, while the AI-mediated branch says the consent prompt should use status/instructions loaded in Steps 2-3, and the `consent_era_from` stamp needs a selected change. Archive has the same tension at `src/core/templates/workflows/archive-change.ts:218` with "BEFORE any other step" while the prompt needs read-only delta counts. The intended invariant appears to be "after read-only selection/status discovery, before any write or anomaly prompt"; spelling that out, or splitting provenance classification from the actual prompt/stamp, would make the generated bodies harder to misexecute.

### Add a concrete missing-consent fixture for the tripwire
**File**: test/core/templates/consent-tripwire.test.ts:25
**Description**: The tripwire tests pin the audit-drift body text and reimplement the three-tier classifier in a local helper, but they do not exercise a concrete `.orbit-runs` fixture and assert that a post-era or at-stamp emit missing `consent` produces the documented WARNING entry. Because the D-arc exit criterion is that audit-drift "demonstrably flags" missing consent, add a small fixture/harness test that proves the producer behavior for `schema_version >= 3` and for the `consent_era_from` boundary, not only the prose and duplicated classifier.

## Notes

Build, strict validation, fingerprint check, status JSON, and apply instructions probes passed. Full `npm test` did not complete cleanly in this checkout because the workspace path contains a space (`/Users/sal/Documents/orbit 2`) and several existing tests shell out to an unquoted `node <path>` command; the failures all resolve the module path as `/Users/sal/Documents/orbit`. I did not treat that as a D1 regression. I also checked the `next_command` marker concern: embedding ` — user-invoked` in the JSON value is consistent with the delta's rendered-line language and the documented leading-token parse; I found no consumer that executes the whole decorated value as a shell command.
