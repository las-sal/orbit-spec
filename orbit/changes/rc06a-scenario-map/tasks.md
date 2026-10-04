## 1. The config key (`The scenario map is opt-in by the scenario_map config key`)

- [ ] 1.1 Red first: in `test/core/project-config.test.ts`, one case per row of the requirement's table — absent (silent, OFF), a valid glob list (ON, globs returned), `tests: []`, `tests` absent, `tests` not a list of strings, a scalar / list / `null` value (each OFF with one warning naming the shape), an unknown sub-key beside a valid `tests` (ON, one warning naming it); confirm they fail.
- [ ] 1.2 In `src/core/project-config.ts`, add the optional `scenario_map` field and a resolver returning `{check: 'on' | 'off', tests: string[]}`, every inert shape resolving to OFF with one warning, following the `pr:` key's pattern (design D6); 1.1 goes green.

## 2. The map module (`src/core/scenario-map.ts`)

- [ ] 2.1 Red first: in a new `test/core/scenario-map.test.ts`, the tag grammar and next-line table — one case per table row (`it(`, `test(`, `it.each`, `test.each`, `it.skipIf(`, `it.only(` attach; `it.skip(`, `test.todo(`, `describe(`, another line, end of file refused as MALFORMED naming the tag's line), stacked tags across a non-tag comment, and the two near-miss forms (unknown kind; two-part key). Fixtures assemble tag lines at runtime and write them into a temp project (design D3).
- [ ] 2.2 Red first, same suite: the ledger — an `observed` entry declares; `untestable` without `why` and `observed` without `record` are MALFORMED by index; an unknown kind and a two-part key are MALFORMED; an absent ledger declares nothing; a non-mapping file is MALFORMED as a whole.
- [ ] 2.3 Red first, same suite: key resolution over the specs with the change's deltas applied (design D1) — an ADDED requirement's scenarios; a MODIFIED block with two kept and one new scenario (all three, `operation: MODIFIED`); a RENAMED requirement (new keys owed, old-key tags ORPHAN); a REMOVED requirement (owes nothing); a `#### Scenario:` heading inside a fence is not a scenario; a baseline scenario outside the delta counted among the baseline-undeclared.
- [ ] 2.4 Red first, same suite: the cover-kind states — two kinds on one scenario both shown and not UNCOVERED; no declaration → UNCOVERED; a well-formed tag naming no scenario → ORPHAN with file and line; the human render prints counts and no percentage or fraction.
- [ ] 2.5 Implement `src/core/scenario-map.ts`: `fast-glob` over the resolved globs from the project root (ignoring `node_modules`), the line classifier (design D2), the ledger reader, key resolution through `parseDeltaSpec` and `createFenceTracker`, the map object of design D7, and the human render; 2.1–2.4 go green.

## 3. The read surface (`The scenario map is engine-computed at one read surface`)

- [ ] 3.1 Red first: the surface cases — the human render names the change, ON/OFF and the globs and lists delta scenarios with four kind columns; `--json` prints one object with `change`, `check`, `tests`, `scenarios`, `orphans`, `malformed`, `counts`; `--scenarios` without `--change` fails naming `--change`; combined with `--report` or `--boot` fails cleanly; the project tree is byte-identical before and after a run.
- [ ] 3.2 Register `--scenarios` on `orbit status` in `src/cli/index.ts` and dispatch it in `src/commands/workflow/status.ts` beside `--report` (design D7); 3.1 goes green.

## 4. The validate check (`A declaration is owed by every scenario in the change's delta blocks`, `An undeclared delta scenario is INFO until the apply gate passes`)

- [ ] 4.1 Red first, in `test/core/validation.test.ts`: with the check ON — an undeclared ADDED scenario reported naming its key; a MODIFIED block's unchanged scenario reported; a RENAMED requirement's scenarios reported under the new key; an untouched baseline scenario not reported; tasks unchecked → INFO and `--strict` passes; every task checked → ERROR and validate fails; only declared user-validation handoffs unchecked → ERROR; a schema with no `apply` gate → INFO. With the check OFF — validate's report for a change with undeclared scenarios is identical to the report without the capability.
- [ ] 4.2 In `src/core/validation/validator.ts`, add the check to `validateChangeDeltaSpecs` beside `validateArchitectureCitation`, reading the `apply` row through `loadChangeContext` + `formatChangeStatus` (design D4) and reporting UNCOVERED only (design D5); 4.1 goes green.
- [ ] 4.3 Confirm `test/core/rc03b-untouched-modules.test.ts` stays green with no hash moved — this change imports `instruction-loader.ts` and edits no pinned module.

## 5. Opt in and grade the stage

- [ ] 5.1 Add `scenario_map: { tests: ['test/**/*.test.ts'] }` to `orbit/config.yaml`, with a comment naming the capability.
- [ ] 5.2 Tag every scenario of this change's delta (29) at the test that exercises it, `behaviour` or `text` as the test establishes; run `orbit status --change rc06a-scenario-map --scenarios` and confirm zero UNCOVERED, zero ORPHAN, zero MALFORMED.
- [ ] 5.3 Run `orbit validate rc06a-scenario-map --strict` after every task above is checked and confirm no ERROR from the map (exit (3), measured on the final tree).
- [ ] 5.4 Run `orbit status --change rc06a-scenario-map --scenarios --json` over this repo and record the baseline-undeclared count in the apply emit's narrative (the D-rc06-7 residue, stated rather than implied).

## 6. Close-out

- [ ] 6.1 Sweep for residue: grep `src/` and `test/` for literal `// @scenario` lines inside fixture strings (expect none — design D3); grep the change for "verify-change's emit" (expect it only where it is named as superseded).
- [ ] 6.2 Run the FULL `npm test` (never a filtered run) and confirm the `Test Files` line reports no failures.
