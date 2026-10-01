# External Review: rc16-retirement-sweep (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-10-01

## CRITICAL

### A4 restates the owner rule instead of only pointing to it
**File**: orbit/changes/rc16-retirement-sweep/specs/orbit-conventions/spec.md:113
**Description**: The repaired `Kind:` bullet repeats the rule that “whether a rule was written down at all is a reader's judgement” and that it is “never a check.” The owning `Mechanism entry grammar and accounted closure` block already states that same reader-judgement/record-not-check rule at line 36, and the generated explore body repeats it again at `src/core/templates/workflows/explore.ts:472`. This directly contradicts R-crc-14 and D-rc16-2's pointer-or-delete, never-restatement constraint; it also falsifies design.md:76's claim that the grammar requirement is the one sentence in any spec that states the limit. Replace A4 with a pure pointer (for example, retain the local consequence that an unentered rule is outside reader sight, then say that the residual's treatment is owned by `Mechanism entry grammar and accounted closure` without re-expressing its predicate), make the same repair in the body, and re-record the affected pins.

## WARNING

### Living design text still carries the superseded two-capability/four-pair scope
**File**: orbit/changes/rc16-retirement-sweep/design.md:5
**Description**: The corrected plan is three capabilities, six body/owner pairs and fourteen repair rows, but the living design still says “two capabilities” at lines 5 and 17, “four paraphrases” at line 12, and “Four (body line, owning sentence) pairs” at line 50. `proposal.md:7` likewise still says the baseline problem is in two capabilities. These are not the intentionally unchanged exploration history; they are current proposal/design claims and disagree with the repair table, tasks 1.1–1.6, exit (2), and the final size record. Update the living proposal/design context and D-rc16-3 count to three capabilities and six pairs, while leaving `explore.md` unchanged as superseded history.

### The SOURCED widened-grep measurement is not exactly reproducible from the trail
**File**: orbit/changes/rc16-retirement-sweep/design.md:98
**Description**: The closure record attributes its 30-line, 14-IN/16-OUT partition to “fourteen paraphrase patterns plus an unanchored `maturity-signal`,” but no artifact enumerates those fourteen patterns or records the executable command. Task 1.7 records only seven alternations and scopes them to `explore.ts`; task 3.2 records eleven fixed literals over the deltas/body/baselines. Neither reproduces the claimed full-tree measurement, and the named review emit records the result rather than the complete query. A future sweep must therefore trust the 30-line count. Record the exact pattern set, tracked-file path exclusions, and command (or a checked script), rerun it on the apply tree, and update the IN/OUT partition so the SOURCED closure is independently repeatable.

## SUGGESTION

### The pairing-risk evidence claims files the apply emit does not contain
**File**: orbit/changes/rc16-retirement-sweep/design.md:133
**Description**: The risk mitigation says the apply emit's `files_touched` shows `explore.ts` and two spec deltas moving in the same session. The emit actually lists `tasks.md`, `explore.ts`, `orbit-generated-surface.test.ts`, and `skill-templates-parity.test.ts`; the deltas landed before apply in the proposal commit. The whole-change range proves that the body and owner sides travel in one change, but the cited session evidence does not. Keep the frozen Touchpoints prediction intact, but correct or annotate this risk with the whole-change evidence and explicitly identify `orbit-generated-surface.test.ts` as the justified actual-unpredicted instrument correction already recorded by the apply emit.

### The archive note both closes Q-crc-28 and leaves an open item on it
**File**: orbit/changes/rc16-retirement-sweep/tasks.md:20
**Description**: The at-archive instruction says Q-crc-28 “CLOSES” on the audit and, in the same paragraph, that the class-C re-entry trigger remains on Q-crc-28 “as its remaining open item.” The design instead treats class C as Considered & out with a trigger that can reopen the question. Make the archive instruction unambiguous: close Q-crc-28 while retaining the trigger in its closed record, and reopen it only if that trigger fires (or route the residual to a separately named open question).

## Notes

The six delta blocks compare cleanly against their baselines: every changed line is one of A1–A5 or B1–B3, and the generated body's `Owned, since shipped` paragraph is byte-equal to A3 after template-literal unescaping. Strict validation, all six fingerprints, source-marker validation, and the full 2,376-test suite pass.

The regenerated skill's four `rc13b` mentions are inside two explicitly introduced, verbatim, fenced exemplar records; they are historical fixture content rather than current workflow instruction. The two `orientation.ts` comments are also accurate at their stated layer: orientation itself does not parse artifact content, and the row chip is trail-sourced. CLAUDE.md:413 describes the reader obtaining the tuple without opening artifacts, a claim the current orientation spec still makes, rather than denying the stage-state source's internal header read.

Running the documented broad residue alternation over tracked files while excluding archives, trails, and this change leaves the expected eight baseline sites awaiting archive sync; the other hits are historical records, unrelated “until … lands” clauses, or module-true comments. The generated-surface lookup correction is behaviorally sound: each independent mirror now resolves its own anchor, and the other `ownerText` callers do not use one requirement's anchor to extract sibling requirement blocks.
