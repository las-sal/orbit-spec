## 1. Measure before writing

- [ ] 1.1 Find every test asserting the exact shape of `orbit status --change <name> --json` or the human status text, and every test over the validate printer's valid-report branch. List them under this task; each is either unaffected or moves in task 4.3 / 4.4 with its reason (design Risks, first entry).

## 2. The size module (D1, D-rc09-3, D-rc09-14)

- [ ] 2.1 `src/core/change-size.ts`: `computeChangeSize(projectRoot, changeDir)` returning `{capabilities, requirements, changed_bytes, tasks}` per `Four size figures are computed from the change's artifacts`, through `parseDeltaSpec`, `extractRequirementsSection` and `parseCheckboxes`; the multiset byte count; the RENAMED + MODIFIED pairing.
- [ ] 2.2 `parseSizeDeclaration(proposalText)` per `A breach is declared in the proposal's Size section`, through the shared CommonMark fence tracker (`markdown-fence.ts`): declared dimensions, MALFORMED and DUPLICATE lines by number, a merged second heading. Export the production string as one constant (D5).
- [ ] 2.3 `sizeBreaches(figures, ceiling, declaration)`: the `breaches` list `{dimension, figure, maximum, declared}` and the stale declarations.
- [ ] 2.4 `test/core/change-size.test.ts`: one case per row of the two tables in the figures requirement and per row of the declaration table, and a regression case reproducing explore.md Case 1's rc04c figure (14.1K new-side) from a fixture built from its delta and baseline. Tag every `orbit-change-size` scenario of the figures and declaration requirements.

## 3. The ceiling config (D2, D-rc09-5)

- [ ] 3.1 `resolveSizeCeiling(projectRoot)` in `src/core/project-config.ts`, reading `size_ceiling` alone: one case per row of the opt-in table, and a case proving a malformed `pr:` beside it prints nothing new. Tag the opt-in requirement's scenarios.
- [ ] 3.2 `orbit/config.yaml` opts in with `{capabilities: 3, requirements: 12, changed_bytes: 40960, tasks: 19}` under a comment block in the `scenario_map` / `review_preference` style (D6).

## 4. Validate and status (D3, D4)

- [ ] 4.1 `Validator.validateChangeSize(changeDir)` beside `validateScenarioDeclarations`, path `size`, one issue per row of `Validate reports each breach as declared or undeclared`; nothing when the check is OFF.
- [ ] 4.2 Widen the human printer in `src/commands/validate.ts`: every `size` issue prints beneath `is valid` on a valid report. A report with no `size` issue prints byte-identically. Tag the validate requirement's scenarios on tests running `--strict` and non-strict.
- [ ] 4.3 `src/commands/workflow/status.ts`: a top-level `size` object on `--json` for every change, and the `Size:` line in human mode only when the check is ON (figures alone; `<dimension> <figure> > <maximum> declared|undeclared` per breach, or `none over`). `formatChangeStatus` is NOT touched. Tag the status requirement's scenarios, including `Size never moves a gate` (gate rows, position and `next_command` compared byte-equal across an under and an over fixture).
- [ ] 4.4 Move each test task 1.1 listed as affected, with the reason written beside the change. `test/core/rc03b-untouched-modules.test.ts` stays green with NO hash moved for `instruction-loader.ts`.

## 5. The propose brief (D5)

- [ ] 5.1 `src/core/templates/workflows/propose.ts`: the post-generation size step per `Size brief after generation`'s four-row table and its two `AskUserQuestion` routes, in both modes, before the completion emit, with the `## Size` production interpolated from task 2.2's constant and labelled a checked mirror of `orbit-change-size`.
- [ ] 5.2 `test/core/size-declaration-parity.test.ts`: the constant is byte-equal to the production fence in `orbit-change-size`'s declaration requirement (resolved through the active delta while the change is live, the baseline after), and the rendered propose SKILL.md carries it. Tag `The mirror matches its owner`.
- [ ] 5.3 Move the `orbit-propose` hash pin in `test/core/templates/skill-templates-parity.test.ts` as a recorded act, with a comment naming rc09a and the inserted step. Tag the remaining `Size brief after generation` scenarios on body-content assertions (each of the four rows and both routes named in the rendered body).
- [ ] 5.4 `npm run build && node bin/orbit.js update --force`, then confirm `.claude/skills/orbit-propose/SKILL.md` carries the step.

## 6. Verification

- [ ] 6.1 Full `npm test` green (count stated against 3287), with no compile failures in the run output. `orbit validate rc09a-size-record --strict` passes, and `orbit status --change rc09a-size-record --scenarios` shows zero undeclared delta scenarios.
- [ ] 6.2 Run `orbit status --change rc09a-size-record` and record its `Size:` line under this task: the stage measured by its own engine, every figure against R-crc-1's maxima.

AT-ARCHIVE NOTE 6.3 (executed in the archive flow, not at apply): replace `orbit-change-size`'s TBD baseline Purpose in place, since no delta carries `## Purpose`.
