## 1. Measure before writing

- [x] 1.1 Find every test asserting the exact shape of `orbit status --change <name> --json` or the human status text, and every test over the validate printer's valid-report branch. List them under this task; each is either unaffected or moves in task 4.3 / 4.4 with its reason (design Risks, first entry).
  Measured 2026-10-11 by grep over `test/` for `status --change … --json`, `Object.keys(` / `toEqual` on a status payload, and `is valid` text assertions:
  - `test/commands/status-orientation.test.ts` — its three `Object.keys(payload)` assertions are on the BARE and `--full` tiers (sprint / program / no-changes), which never carry `size`; its `--change --json` case reads `payload.gates` only. Unaffected.
  - `test/cli-e2e/basic.test.ts` (`keeps status --json free of spinner output`) — asserts JSON-only stdout; size warnings go to stderr. Unaffected.
  - `test/integration/external-runner/pair.test.ts` / `pair.ts` — read `.gates` from `--change --json`. Unaffected.
  - `test/core/scenario-map.test.ts` — its key-set assertion is on `--scenarios --json`, which carries no `size` by the requirement. Unaffected.
  - `test/core/validation.test.ts:811,833` — the valid-report printer's exact text, in fixtures with no `size_ceiling` key, so no `size` issue prints. Unaffected.
  - No golden or exact-shape assertion over `orbit status --change <name> --json` or its human text was found; task 4.4 moves nothing unless the full run says otherwise.

## 2. The size module (D1, D-rc09-3, D-rc09-14)

- [x] 2.1 `src/core/change-size.ts`: `computeChangeSize(projectRoot, changeDir)` returning `{capabilities, requirements, changed_bytes, tasks}` plus `errors` per `Four size figures are computed from the change's artifacts`, through `parseDeltaSpec`, `extractRequirementsSection` and `parseCheckboxes`; the line rule (trimmed text split on `\n`, every counted line +1, blank lines included); the multiset byte count; the RENAMED + MODIFIED pairing; an existing-but-unreadable input nulls its figure and records `{figure, path, message}`, never read as absent.
- [x] 2.2 `parseSizeDeclaration(proposalText)` per `A breach is declared in the proposal's Size section`, through the shared CommonMark fence tracker (`markdown-fence.ts`): declared dimensions, MALFORMED and DUPLICATE lines by number, a merged second heading. Export the production string as one constant (D5).
- [x] 2.3 `sizeBreaches(figures, ceiling, declaration)`: the `breaches` list `{dimension, figure, maximum, declared}` and the stale declarations.
- [x] 2.4 `test/core/change-size.test.ts`: one case per row of the two tables in the figures requirement and per row of the declaration table, a read-failure case per input, and a regression case pinning rc04c at exactly 14,438 bytes from a fixture of its archived delta and its baselines at commit `bc4c12fc`. Tag every `orbit-change-size` scenario of the figures and declaration requirements.

## 3. The ceiling config (D2, D-rc09-5)

- [x] 3.1 `resolveSizeCeiling(projectRoot)` in `src/core/project-config.ts`, reading `size_ceiling` alone: one case per row of the opt-in table, and a case proving a malformed `pr:` beside it prints nothing new. Tag the opt-in requirement's scenarios.
- [x] 3.2 `orbit/config.yaml` opts in with `{capabilities: 3, requirements: 12, changed_bytes: 40960, tasks: 19}` under a comment block in the `scenario_map` / `review_preference` style (D6).

## 4. Validate and status (D3, D4)

- [x] 4.1 `Validator.validateChangeSize(changeDir)` beside `validateScenarioDeclarations`, path `size`, one issue per row of `Validate reports each breach as declared or undeclared`; nothing when the check is OFF.
- [x] 4.2 Widen the human printer in `src/commands/validate.ts`: every `size` issue prints beneath `is valid` on a valid report. A report with no `size` issue prints byte-identically. Tag the validate requirement's scenarios on tests running `--strict` and non-strict.
- [x] 4.3 `src/commands/workflow/status.ts`: a top-level `size` object on `--json` for every change, and the `Size:` line in human mode only when the check is ON (figures alone; `<dimension> <figure> > <maximum> declared|undeclared` per breach, or `none over`). `formatChangeStatus` is NOT touched. The field rides the plain change status only, never `--boot`, `--scenarios` or `--report`; a read failure lands in `size.errors` and status exits as it would without size. Tag the status requirement's scenarios, including `Size never moves a gate`: ONE change held fixed, `size_ceiling` moved from maxima above every figure to maxima below, gate rows, position and `next_command` compared byte-equal.
- [x] 4.4 Move each test task 1.1 listed as affected, with the reason written beside the change. `test/core/rc03b-untouched-modules.test.ts` stays green with NO hash moved for `instruction-loader.ts`.
  Measured: nothing moved. The full run went red on no status or validate assertion (task 1.1's list held); `test/core/rc03b-untouched-modules.test.ts` is green with no hash moved, `instruction-loader.ts` included. The only hash pins moved are the two `orbit-propose` pins, task 5.3's recorded act.

## 5. The propose brief (D5)

- [x] 5.1 `src/core/templates/workflows/propose.ts`: the post-generation size step per `Size brief after generation`'s four-row table and its two `AskUserQuestion` routes, in both modes, after validation and BEFORE Step 0d's move, the PR choreography's Phase 3 and the completion emit; on Split, the split recommendation replaces the completion prompt to review; with the `## Size` production interpolated from task 2.2's constant and labelled a checked mirror of `orbit-change-size`.
- [x] 5.2 `test/core/size-declaration-parity.test.ts`: the constant is byte-equal to the production fence in `orbit-change-size`'s declaration requirement (resolved through the active delta while the change is live, the baseline after), and the rendered propose SKILL.md carries it. Tag `The mirror matches its owner`.
- [x] 5.3 Move the `orbit-propose` hash pin in `test/core/templates/skill-templates-parity.test.ts` as a recorded act, with a comment naming rc09a and the inserted step. Tag the remaining `Size brief after generation` scenarios on body-content assertions (each of the four rows and both routes named in the rendered body).
- [x] 5.4 `npm run build && node bin/orbit.js update --force`, then confirm `.claude/skills/orbit-propose/SKILL.md` carries the step.
  Confirmed 2026-10-11: `.claude/skills/orbit-propose/SKILL.md` carries `## Size brief after generation` and the interpolated production.

## 6. Verification

- [x] 6.1 Full `npm test` green (count stated against 3287), with no compile failures in the run output. `orbit validate rc09a-size-record --strict` passes, and `orbit status --change rc09a-size-record --scenarios` shows zero undeclared delta scenarios.
  Measured 2026-10-11: `npm test` — 148 files, **3357 passed** (3287 → 3357, +70: 60 in `change-size.test.ts`, 10 in `size-declaration-parity.test.ts`), no compile failure. `orbit validate rc09a-size-record --strict` passes; `--scenarios` reads 38 delta scenarios, 0 uncovered, 0 malformed.
  One instrument note: the first full run failed `source-lint.test.ts` on AT-ARCHIVE NOTE 6.4 below, which wrote a live `src:` opener in prose — the authoring rule says prose names the marker without its syntax. That line was written at propose, and HEAD was already red on it (measured by stashing this apply's edits). Reworded in place, the meaning unchanged.
- [x] 6.2 Run `orbit status --change rc09a-size-record` and record its `Size:` line under this task: the stage measured by its own engine, every figure against R-crc-1's maxima.
  Recorded 2026-10-11: `Size: 3 capabilities · 7 requirements · 19637 bytes changed · 17 tasks — none over` — against R-crc-1's maxima (3, 12, 40960, 19): capabilities AT its maximum, the other three under it.

AT-ARCHIVE NOTE 6.3 (executed in the archive flow, not at apply): replace `orbit-change-size`'s TBD baseline Purpose in place, since no delta carries `## Purpose`.

AT-ARCHIVE NOTE 6.4 (executed in the archive flow, not at apply): the sync adds a 26th baseline capability; move CLAUDE.md's figure marked with the `capabilities` source from 25 to 26 and its prose capability narrative in the archive commit, so `orbit validate --sources` stays green.
