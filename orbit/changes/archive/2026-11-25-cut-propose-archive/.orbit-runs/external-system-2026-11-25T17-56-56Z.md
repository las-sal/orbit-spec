# External Review: cut-propose-archive (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-25

## CRITICAL

None.

## WARNING

### Archive preflight leaves the single-observation handoff ambiguous

**File**: src/core/templates/workflows/archive-change.ts:616  
**Description**: Step 4.9 runs `orbit pr preflight` and tells the agent to carry “its record” forward. The instructions that map `observations.emit` into the archive summary and `observations.outcome` into the tail live only in the reference, whose preflight section opens by showing the same command again. On the ordinary attached path, Step 4.9 skips the reference read because Step 0.7 already loaded it for a different purpose. A session that has compacted since entry can miss the mapping or rerun the preflight when it returns to the reference. A second observation can see a changed PR state and defeat the baseline’s one-observation contract. At Step 4.9, direct the agent to the reference’s preflight section from the result already in hand, and state that the same result supplies both the emit fields and the tail outcome.

## SUGGESTION

### The consent capability’s Purpose still lists bulk-archive

**File**: orbit/specs/orbit-lifecycle-consent/spec.md:9  
**Description**: The delta removes bulk-archive from the consent requirements, but the capability’s Purpose still identifies it as a consent-scoped workflow. The spec rebuild preserves the text before the Requirements section, so this description survives archive. Add the Purpose correction to the design’s at-archive work.

### The command guide drops the migration advice along with the retired command

**File**: docs/commands.md:230  
**Description**: The guide removes the bulk-archive entry and its note about archiving changes individually. The proposal names that as the replacement workflow for existing adopters. Add one sentence under `/orbit:archive` explaining that users can archive several completed changes by invoking it once per change.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the archive preflight handoff before moving forward. The saved observation supplies both the audit record and the outward PR actions. The skill should say exactly how to reuse it after a long session, including when the reference was already opened at entry.

## Notes

All task boxes are checked. Strict validation passed for the change and all archived specs, and source validation passed. The installed `orbit` 2.0.2 scenario map reported zero uncovered scenarios, orphan declarations, or malformed declarations. Those are declaration checks. The test suite could not start because Vitest was unavailable, so generated-body budgets and update behavior were reviewed from source. The checkout has neither named lens file. I traced standalone and consume-mode propose, consent at apply and archive entry, attached and unattached archive, and retirement of an existing generated install.

The workspace was read-only. I could not save the report or commit and push it. The intended filename is `orbit/changes/cut-propose-archive/.orbit-runs/external-system-2026-11-25T17:46:55Z.md`.