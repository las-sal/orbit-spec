## Context

rc06's exploration (`explore.md`, moved here at promotion) measured the ground and settled six rules with accounted Mechanism entries; the parent stage split under R-crc-9 and this change ships its first child, `rc06a-scenario-map` (exits (1) a delta scenario with no declaration fails validate naming its key — graded AS WRITTEN on the post-apply ERROR, with the check ON in this repo: D-rc06-10 and D-rc06-12 qualify WHEN validate fails, and the criterion stays measurable at that moment, so this is not an R-crc-12 revision; (2) the surface renders the four kinds as separate columns and reports orphans; (3) every scenario in this change's own delta is declared when it archives). The readers — verify-change's Scenario Coverage step and system Pass 0 — are rc06b's.

Facts the design rests on (see explore.md's Premise and Cases):

- 1090 baseline scenarios over 245 requirements; the title triple (capability, requirement, scenario) is unique across all of them, and `::` occurs in no title (Case 1).
- The suite's only skip form today is `it.skipIf(process.platform === 'win32')`, nine sites (Case 2).
- `orbit validate` is run by proposal review's Pass 1 (a failure is a BLOCK) and by the CLI `orbit archive` (`src/core/archive.ts:133`); the propose, apply and archive bodies never call it (Case 4).
- `ValidationLevel` is `ERROR | WARNING | INFO`; `--strict` fails on ERROR and WARNING only (`src/core/validation/validator.ts`).
- A tracked gate computes `blocked`, `ready` or `passed` (`src/core/artifact-graph/gates.ts`); zero boxes is not passed; the user-validation subset makes it passed for flow.

## Goals / Non-Goals

**Goals:**

- A scenario's coverage is declared where the test is, and the map is computed, never written.
- Four cover kinds, each at its real strength; a grep for an instruction never reads as evidence of behaviour.
- `orbit validate <change>` names every undeclared delta scenario, at a level that cannot block a proposal before its tests exist.
- Zero behaviour change for any repo that does not opt in.

**Non-Goals:**

- The readers (verify-change, system Pass 0) — rc06b.
- Backfilling the 1090 baseline scenarios (D-rc06-7).
- A trigger for the check after apply in the agent-driven flow — the archive body moves with `mv` and never runs validate; rc06b's readers are where the post-apply moment reads the map.
- Languages other than JS/TS test files; a TypeScript parse of test files.
- Whether a tagged test really asserts its scenario — the kind word is the author's record (R-crc-10).

## Decisions

**D1 — Key resolution runs over KEYS, not merged spec text** (D-rc06-3, D-rc06-4). The resolved key set is the baseline's keys with the change's delta plan applied key-wise: `parseDeltaSpec` already returns `added`/`modified` blocks, `removed` names and `renamed` pairs, so ADDED/MODIFIED replace a requirement's scenario set, REMOVED drops it, RENAMED re-keys it. This avoids `buildUpdatedSpec`, whose fingerprint divergence guard refuses by default and has no business in a read path. Scenario headings are read inside each requirement block with `createFenceTracker` (`src/core/markdown-fence.ts`); the requirement blocks themselves come from `parseDeltaSpec` / `extractRequirementsSection`, which use `computeFenceMask` — so the read path COMPOSES the engine's two fence grammars, the condition Q-crc-15 names, and inherits that question's limit rather than claiming one grammar. Alternative: merge full spec text through `specs-apply.ts` — rejected, it couples a read surface to the archive's write guard.

**D2 — The scan is a line classifier, not a parser** (D-rc06-1). Each scanned file is read line by line: a line matching `^\s*//\s*@scenario\b` is a tag candidate, checked against the production; the next non-blank, non-plain-comment line is classified by the closed next-line table. Files come from `fast-glob` over the configured globs, relative to the project root, ignoring `node_modules`. Alternative: the TypeScript compiler API to find call expressions — rejected for cost and because a closed table that refuses the unrecognised is already total.

**D3 — Tests of the scanner never carry literal tag lines in fixtures** (Case 3). This repo opts in, so its own scanner tests would otherwise surface MALFORMED or false attachments from fixture strings. Fixtures assemble the tag at runtime (`'// @' + 'scenario …'`) and write it to a temp project; the repo's own surface stays clean.

**D4 — Validate reads the gate through the status computation** (D-rc06-12). The check calls `loadChangeContext` + `formatChangeStatus` (`src/core/artifact-graph/instruction-loader.ts`) and takes the `apply` row's state — the same computation `orbit status --change` renders, so validate and status cannot disagree about whether apply passed. No `apply` row → INFO always; a `loadChangeContext` throw is caught and reported as INFO, never propagated. The hook sits in `validateChangeDeltaSpecs` beside `validateArchitectureCitation`, so the CLI `orbit archive` inherits it. Every map issue carries the path `scenario-map`, and `printReport` (`src/commands/validate.ts`) prints those INFO issues beneath the `is valid` line — an INFO level nobody sees would be a level in name only; a report with no such issue prints byte-identically.

**D5 — Validate reports UNCOVERED and UNKEYABLE only** (D-rc06-4). ORPHAN and MALFORMED appear on the surface; a typo'd tag surfaces in validate as its scenario's UNCOVERED line, which points the reader at the surface. A delta title containing ` :: `, or repeated within its requirement (external system pass, C1), is UNKEYABLE and is an ERROR at every gate state — refused at proposal review, where renaming is free, rather than discovered after apply as a declaration nothing can supply (external proposal pass, C1). Keeps validate's output a list of owed declarations and undeclarable titles, nothing else.

**D6 — The config key follows `pr:`'s inert rule, read on its own** (D-rc06-10). `src/core/project-config.ts` gains an optional `scenario_map` schema field and a DEDICATED resolver that reads `orbit/config.yaml` and inspects only `scenario_map`, returning `{check: 'on' | 'off', tests: string[]}`; every inert shape resolves to OFF with one `console.warn` line naming the shape. Absent is silent. It does NOT go through `readProjectConfig`, which warns on every malformed field — validate never read the config before, and must not start printing `pr:` or `rules:` warnings. The zero-match warning is raised by the scan in `scenario-map.ts`, the only place that globs, once per run (bulk `orbit validate` scans once and reuses the result). The surface's OFF default scans `test/**/*.test.ts` so the map is still viewable before opting in.

**D7 — The JSON form is the human form's facts, one shape** (D-rc06-8). `--scenarios --json` prints `{change, check, tests, scenarios[], orphans[], malformed[], counts}`; the human render is computed from the same object. Mutual exclusion with `--report` and `--boot` is a clean usage error, as `--report` already refuses `--json`.

**D8 — This repo opts in, and the stage grades itself** (exit (3)). `orbit/config.yaml` gains `scenario_map: { tests: ['test/**/*.test.ts'] }` in the same change. From then on `orbit validate rc06a-scenario-map` prints this change's delta scenarios (34 at apply; 35 after system walk 2 added the repeated-title scenario) as INFO lines beneath the `is valid` line until apply passes; the apply tags each of them, so at archive the CLI check reads ERROR-free.

## Alternatives considered

- **The spec scenario names its test id** (the charter's wording; explore Considered & out). Ids would sync into baselines, couple specs to test layout, and force re-tagging every unchanged scenario of each MODIFIED requirement.
- **A per-change sidecar map.** Dies at archive; the next change touching the requirement starts from nothing.
- **One summed "covered" figure.** Counts presence of an instruction as evidence of behaviour (D-rc06-2's FALSIFY).
- **The map carried in verify-change's emit** (the charter's exit (2)). No verify emit has ever been written; a stored map drifts with every test edit.
- **WARNING before apply.** `--strict` fails on WARNING, so proposal review's Pass 1 would still block (D-rc06-12's FALSIFY).
- **On by default.** Every adopter repo's `orbit validate` would fail on its first change (D-rc06-10's FALSIFY).

## Risks / Trade-offs

- [A tag proves a test NAMES a scenario, not that it asserts it] → the kind word records the claim's strength and the columns are never summed; the reader judges the test (R-crc-10). Stated in the requirement.
- [Title edits orphan tags] → a renamed scenario title shows as ORPHAN tag + UNCOVERED scenario on the same surface; validate reports the UNCOVERED half.
- [A second active change's ADDED scenarios] → resolved specs apply only the named change's deltas, so tags written for another active change's new scenarios read ORPHAN in this change's view. orbit is single-user, single-session; named, not locked.
- [The post-apply moment has no trigger in the agent-driven flow] → the archive body never runs validate (Case 4); rc06b's readers close it. Until then the check fires at proposal review (INFO) and on demand.
- [Fixture strings in this repo's tests] → D3.

## Migration Plan

None. The capability is additive and opt-in; without the key every existing output is byte-identical. This repo opts in within the change.

## Touchpoints

- `src/core/scenario-map.ts` — new: tag scan, ledger read, key resolution, the map object, the human render.
- `src/core/project-config.ts` — the `scenario_map` key and its resolver.
- `src/core/validation/validator.ts` — the declaration check in `validateChangeDeltaSpecs`.
- `src/commands/validate.ts` — `printReport` prints `scenario-map` INFO issues under a valid report.
- `src/commands/workflow/status.ts` + `src/cli/index.ts` — the `--scenarios` flag and its dispatch.
- `orbit/config.yaml` — this repo opts in.
- `test/core/scenario-map.test.ts` — new suite; every scenario of this change tagged.
- `test/core/validation.test.ts` + `test/core/project-config.test.ts` — the validate level rule and the config key.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc06-1 | DERIVED | live rule | `A test declares the scenario it exercises with a scenario tag` — a GRAMMAR (the tag production) and a normative TABLE (the next-line forms) |
| D-rc06-2 | DERIVED | live rule | `Cover kinds are reported separately and never summed` — a normative TABLE; the ledger half in `The scenario ledger declares what no test can run` — a GRAMMAR |
| D-rc06-3 | SOURCED | live rule | `The scenario map is engine-computed at one read surface` — a SENTENCE naming the source (the rc06 and rc10 charters and the verify-change body) with the consumers in prose |
| D-rc06-4 | SOURCED | live rule | `A declaration is owed by every scenario in the change's delta blocks` — a normative TABLE over `DeltaOperationType` |
| D-rc06-10 | DERIVED | live rule | `The scenario map is opt-in by the scenario_map config key` — a normative TABLE |
| D-rc06-12 | SOURCED | live rule | `An undeclared delta scenario is INFO until the apply gate passes` — a normative TABLE over `GateState`'s tracked states |
| D-rc06-5 | — | `Kind: fact` | not carried |
| D-rc06-6 | — | `Kind: scope` | not carried |
| D-rc06-7 | — | `Kind: scope` | not carried |
| D-rc06-8 | — | `Kind: scope` | not carried |
| D-rc06-9 | — | `Kind: scope` | not carried |
| D-rc06-11 | — | `Kind: scope` | not carried |
