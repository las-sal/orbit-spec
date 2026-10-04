## Why

A delta scenario is the change's test contract, and today nothing connects a scenario to the test that exercises it except task prose: rc07b's tasks say "add the four scenarios of `<requirement>`" in a named test FILE, at requirement grain, and 1 of its 34 scenario titles appears anywhere under `test/`. Verify's scenario check is a prose instruction ("Check if tests exist covering the scenario"), and verify has never written a record of its own — zero `verify-*.json` on every archived trail, because it runs only as system Pass 0 (measured at exploration; see explore.md). So every review rebuilds the scenario → test trace by reading, and a scenario no test exercises is found, if at all, by a reviewer. Goal G2: a claim a machine can verify leaves the reviewer's budget.

## What Changes

- **A test declares the scenario it exercises.** A line comment `// @scenario <kind> <capability> :: <requirement title> :: <scenario title>` — `<kind>` `behaviour` or `text` — attaches to the next test call in a scanned file; the title triple is the key (unique over all 1090 baseline scenarios, and `::` occurs in no title). Specs carry no test ids (explore D-rc06-1, D-rc06-5).
- **A ledger declares what no test can run.** `orbit/scenario-ledger.yaml` keys entries by the same triple: `kind: observed` with the `record:` it cites, or `kind: untestable` with a `why:` (D-rc06-2, D-rc06-9).
- **Cover kinds are separate columns, never summed.** `behaviour`, `text`, `observed`, `untestable` render side by side; only a scenario with no declaration is UNCOVERED; a key resolving to no scenario is ORPHAN; a grammar failure is MALFORMED, naming the line (D-rc06-2).
- **The map is ENGINE-COMPUTED at one read surface.** `orbit status --change <name> --scenarios` (human and `--json`) computes the map at read time from the tags, the ledger and the specs with the change's deltas applied; no emit stores it (D-rc06-3, D-rc06-8).
- **`orbit validate <change>` reports every undeclared delta scenario** — every scenario in an ADDED or MODIFIED block, and every baseline scenario a RENAMED requirement re-keys — as INFO until the change's `apply` gate passes and as ERROR after, so a proposal review never BLOCKs on scenarios whose tests cannot exist yet (D-rc06-4, D-rc06-12). The one exception is an UNKEYABLE delta title (one containing ` :: `), an ERROR at every gate state so it is renamed while renaming is free. Baseline scenarios outside the delta are reported on the surface, never failing; nothing is backfilled (D-rc06-7).
- **The check is OPT-IN.** `scenario_map: { tests: [<glob>, …] }` in `orbit/config.yaml` turns it on and names the scanned files; absent, the check is off and `orbit validate` behaves exactly as before — an adopter arriving from OpenSpec sees no change (D-rc06-10); malformed, the check is off and one warning names the shape. The key is read on its own, so no other config field's warning reaches validate. This repo opts in with `test/**/*.test.ts`.

## Capabilities

### New Capabilities

- `orbit-scenario-map`: the `@scenario` tag and ledger grammar, the opt-in config key, the engine-computed map and its `--scenarios` read surface, the cover kinds, and the `orbit validate` declaration check with its apply-gated level.

### Modified Capabilities

(none)

ONE capability, under R-crc-1's ceiling. The stage's charter named orbit-conventions and orbit-verify-change; the exploration placed the grammar in the capability that owns the map (R-crc-14: the rule stated once, where it is owned), and verify-change has no orbit capability — its reading of the map is rc06b's. The charter's "owner of the status command's flags" is measured too: `orbit-orientation`'s ``Bare `orbit status` renders the current sprint`` already licenses later capabilities to EXTEND the `--change` form with new flags without touching its pre-existing outputs, so `--scenarios` needs no delta there.

## Impact

- **Engine**: a new map module (tag scan, ledger read, key resolution over the specs with the change's deltas applied); `src/core/project-config.ts` gains the optional `scenario_map` key with the `pr:` key's inert-warning rule; `src/core/validation/validator.ts`'s `validateChangeDeltaSpecs` gains the declaration check; `orbit status` gains `--scenarios`.
- **CLI**: one new flag on `orbit status`; human-mode `orbit validate` prints the map's INFO lines beneath a valid report (output unchanged when the map contributes none). No generated workflow body changes (the readers are rc06b's).
- **Config**: `orbit/config.yaml` gains `scenario_map: { tests: ['test/**/*.test.ts'] }` for this repo.
- **Tests**: a new suite for the map; every scenario of this change's own delta is tagged (the stage's exit (3)).
- **Adopters**: none unless they opt in. `orbit validate` output is byte-identical without the key.
- **Downstream**: rc10's charter names an apply-emit pointer to "the latest verify emit"; under D-rc06-3 there is nothing to point at — carried to rc10 by the program doc's rider, not changed here.
