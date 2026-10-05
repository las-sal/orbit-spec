## 1. Verify reads the map (`Verify's Scenario Coverage step reads the scenario map`)

- [x] 1.1 Red first: in a new `test/core/templates/verify-scenario-map.test.ts`, assert over the generated `orbit-verify-change` skill. The Scenario Coverage step names `orbit status --change <name> --scenarios --json`. No line instructs checking whether tests exist covering a scenario. "Check if conditions are handled in code" is kept, its miss titled `Scenario not handled in code` and recommending implementation only, with no `Scenario not covered` warning or test recommendation paired with it. The findings' fail-mode classification is pointed at `orbit-run-summary-emit`'s `Verify fail-mode recommendations`, not restated. Add the PARITY test: the body's reader table is byte-equal to the table in this change's `orbit-verify-modifications` delta (at archive, the baseline's). Confirm they fail.
- [x] 1.2 Edit step 6 of `src/core/templates/workflows/verify-change.ts` IN PLACE (design D1, D2): replace the test-tracing bullet and its uncovered sub-bullets with the surface read, the reader table as a checked mirror with its mirror note, and the implementation check's own retitled finding; the Orbit additions section gains no Scenario Coverage text. 1.1 goes green.
- [x] 1.3 Move the two verify hashes in `test/core/templates/skill-templates-parity.test.ts` (the skill template and the generated `orbit-verify-change` skill), each with a dated comment naming this change, as a recorded act.

## 2. Every Pass 0 reader (`Every Pass 0 reader reads the scenario map`)

- [x] 2.1 Red first, same suite: system-mode Pass 0 in the generated `orbit-review` skill invokes `/orbit:verify <change-name>` and carries no instruction of its own to trace scenarios to tests; the external mode-sections reference's system item 0 names `orbit status --change <name> --scenarios --json` and says an external reviewer who cannot run it reports the check as not run.
- [x] 2.2 Edit item 0 in `REVIEW_EXTERNAL_MODE_SECTIONS_REFERENCE` in `src/core/templates/workflows/review.ts` (design D5); 2.1 goes green. Confirm the review-genre brief tests (`orbit-review`'s brief rule) stay green.

## 3. The rider pin (design D4)

- [x] 3.1 In `test/core/scenario-map.test.ts`, add a behaviour test: a delta whose scenario title contains ` :: ` lists the spec entry as unkeyable and its tag as MALFORMED (no orphan); a delta whose scenario title occurs twice within its requirement lists TWO unkeyable entries with the same triple, and its tag as an ORPHAN whose key equals that joined triple. Tag it `behaviour` to `orbit-scenario-map`'s `A tag naming no scenario is an orphan` and `A near-miss tag is malformed, never ignored`.

## 4. Declare this change's scenarios (design D6)

- [x] 4.1 Tag every `orbit-verify-modifications` scenario at the test that exercises it (`text`), and the new `Generated-file disposition` scenario `A named edit replaces an upstream step in place` at a test asserting verify's additions section carries no Scenario Coverage text.
- [x] 4.2 For each MODIFIED block's other scenarios (`orbit-conventions` six, `orbit-run-summary-emit`'s two wrapper scenarios and every `Verify fail-mode recommendations` scenario), tag an existing test that exercises it, or add an `orbit/scenario-ledger.yaml` entry: `untestable` with a `why`, or `observed` with a `record`.
- [x] 4.3 Run `orbit status --change rc06b-map-readers --scenarios` and confirm zero UNCOVERED, zero ORPHAN, zero MALFORMED; run `orbit validate rc06b-map-readers --json` and confirm no `scenario-map` issue at any level.
  - Apply note (2026-10-05, Sal: A): the `Upstream-verbatim — kept unchanged` scenario this change's MODIFIED block carries was FALSE in its second half — `orbit-sync-specs` has carried a `# Orbit additions` section (the epitome + the consent-inheritance note) since D1/D5, while its upstream portion is byte-identical to `upstream/v1.3.1` with the rename normalized (measured). Its THEN was narrowed in the delta to what is true and `text`-tagged; pre-existing drift, repaired in a block this change already owns.

## 5. Close-out

- [x] 5.1 `npm run build && node bin/orbit.js update --force`, then sweep: grep the generated `.claude/skills/orbit-verify-change/SKILL.md` for "Check if tests exist" (expect none) and for `--scenarios` (expect the step); grep `src/`, the generated `.claude/skills/` and this change's `specs/` for "left intact", "MUST NOT modify the upstream-authored body" and "verify itself does not gain" (expect none). The baselines still carry them until sync; their grep is in the at-archive note.
- [x] 5.2 Run the FULL `npm test` and confirm the `Test Files` line reports no failures.
At-archive note (not a task): CLAUDE.md's marked capability figure moves 22 → 23 with the sync, and its D14 line's "pristine upstream body" is reworded to the narrowed rule (upstream body, edited only by named deltas, + `# Orbit additions`); after the sync, grep `orbit/specs/` for "left intact", "MUST NOT modify the upstream-authored body" and "verify itself does not gain" (expect none); the readiness record names Q-rc06b-1's residual (D-rc06b-8) and the archive proposes it to rc10 as a rider.
