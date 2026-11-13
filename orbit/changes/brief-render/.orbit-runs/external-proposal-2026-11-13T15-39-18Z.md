# External Review: brief-render (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-13

## CRITICAL

None.

## WARNING

### Requirement listings do not distinguish proposed changes from completed syncs
**File**: orbit/changes/brief-render/specs/orbit-program-brief/spec.md:17
**Description**: The archived brief combines `sync_specs` counts with requirement titles from every delta operation, but does not specify how to label titles when syncing was skipped or only part of the delta was applied. The preserved archive flow allows “Archive without syncing.” For example, an archived change can contain ADDED requirement R while its archive record says `ran: false` and reports no capabilities updated; the brief can still list R under capabilities and requirements added or changed. Conversely, line 84 labels every active change’s delta “not yet synced,” although Step 4 explicitly supports already-synced active changes. Define separate labels for delta intent and recorded sync results, including skipped and already-synced cases, and add scenarios covering both.

### Saved unread records cannot unconditionally equal the later archive count
**File**: orbit/changes/brief-render/specs/orbit-program-brief/spec.md:86
**Description**: Using the same selection function does not ensure identical results at different times. The saved brief precedes sync assessment, sync execution and the archive emit; nothing freezes decision records or review history during that interval. Construct a change with one unread ledger entry, save its brief, then write another valid ledger entry before the archive emit. The saved brief lists one record while the archive correctly computes two. The equality scenario at lines 103–106 requires an outcome the proposed mechanism cannot guarantee. Specify that the saved list is a snapshot at render time, qualify equality on unchanged inputs, and test a record written after saving. If equality is essential, define an explicit snapshot mechanism instead.

### Deduplicating terms across independent records can misinterpret their prose
**File**: orbit/changes/brief-render/design.md:80
**Description**: Definitions are scoped to individual records by the existing plain-language contract, but this design merges them across independent chains and the account, with the latest definition winning. Two valid, unreplaced ledger entries can use the same term differently and define their respective meanings. The brief retains both entries’s prose while discarding the older definition, causing readers to apply the newer meaning to the older decision. Preserve definitions beside their records, or merge only identical definitions and show conflicting definitions with their source records. Also define deterministic handling when different record kinds carry the same timestamp.

## SUGGESTION

### Golden-render fixture descriptions disagree
**File**: orbit/changes/brief-render/proposal.md:66
**Description**: The proposal promises golden renders of a fixture change and a fixture program. Task 1.3 instead specifies two program fixtures, matching the architecture stage’s exit criterion. Align the proposal with the tasks, or explicitly require an additional standalone change golden if that coverage is intended.

## Blocks

None.

## Direction

**Disposition**: hold

Clarify the brief’s treatment of sync evidence, snapshot timing and record-local definitions before implementation. These rules determine whether the saved document accurately explains what happened and can support the later sign-off seam.

## Notes

The installed `orbit validate brief-render --strict` passed. The checkout’s local CLI could not run because `dist/cli/index.js` is absent, so validation used the installed executable. Modified requirement titles exist in their baselines, and added requirement titles do not collide with baseline titles. No unresolved `@review:` markers were found in the reviewed change artifacts.