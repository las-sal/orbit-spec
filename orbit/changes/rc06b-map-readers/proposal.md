## Why

rc06a gave the scenario → test link an engine-computed home, `orbit status --change <name> --scenarios`, but no workflow body reads it yet. Verify still traces scenarios to tests by prose ("Check if tests exist covering the scenario"), the check rc06's exploration measured matching 1 of rc07b's 34 scenario titles. System review's Pass 0 runs that prose through verify, and the external reviewer's Pass 0 equivalent rebuilds it from scratch. And after apply, Pass 0 is the ONLY agent-flow reader of an undeclared scenario, because system mode never runs `orbit validate` (see explore.md, Premise). Goal G2: a claim a machine can verify leaves the reviewer's budget. This stage finishes the work rc06a started (rc06's exit (3), this stage's exits (1) and (2)).

## What Changes

- **Verify's Scenario Coverage step reads the map.** The upstream line "Check if tests exist covering the scenario" is replaced IN PLACE by a read of `orbit status --change <name> --scenarios --json`, reported by one closed table over every state that JSON can return: the command failing, the check OFF (one note naming the config key and nothing else, no prose fallback), no delta scenarios, UNCOVERED, a declared scenario of any kind (nothing raised, kinds never summed), ORPHAN, MALFORMED, the UNKEYABLE spec line, and the counts (no ratio). "Check if conditions are handled in code" stays: it traces implementation, not tests (explore D-rc06b-1, D-rc06b-2).
- **The rider is answered in the reader.** An ORPHAN whose key equals an unkeyable spec entry's joined triple is reported under that entry as one finding. A title containing ` :: ` makes its tag MALFORMED, not ORPHAN (executed at exploration), so only the repeated-title shape pairs. A behaviour test pins both shapes against `orbit-scenario-map`'s existing scenarios; the surface is unchanged (D-rc06b-4, D-rc06b-5).
- **Every Pass 0 reader reads the map, and the review body restates nothing.** Internal system Pass 0 consumes it through its existing `/orbit:verify` invocation, folding coverage findings as WARNING under its existing rule. The external prompt's item 0 names the surface command (D-rc06b-3, D-rc06b-6).
- **The pristine-upstream rule is narrowed and stated once.** `orbit-conventions`' `Generated-file disposition` (the owner) now says an orbit-modified body's upstream portion changes only through a change whose delta names the edit, edited in place, with the upstream edits and additions-section overrides made before this rule as named limits. `orbit-run-summary-emit`'s wrapper requirement narrows to what the EMIT LAYER may do and points at the owner instead of restating the rule (D-rc06b-1, corrected at propose).
- **Out of scope:** stopping an archive on an undeclared scenario. That is a pre-archive condition and belongs to rc10-apply-closure, named here as a residual (D-rc06b-8).

## Capabilities

### New Capabilities

- `orbit-verify-modifications`: verify's Scenario Coverage step as a reader of the scenario map, and the rule that every Pass 0 reader (standalone verify, internal system Pass 0, the external prompt's item 0) reads the same surface.

### Modified Capabilities

- `orbit-conventions`: `Generated-file disposition` — the orbit-modified category's upstream portion changes only through a named delta edit; the bodies edited before this rule are a named limit.
- `orbit-run-summary-emit`: `Emit-layer wraps upstream skills without modifying them` and `Verify fail-mode recommendations` — each sentence that said verify gains no behavior is narrowed to the emit layer, pointing at `Generated-file disposition` for the upstream-portion rule.

THREE capabilities, at R-crc-1's ceiling. The charter said verify-change "either gains one or rides orbit-review — measured at propose". It gains one: `orbit-review` carries no delta, because its Pass 0 scenario already invokes verify and already grades an uncovered scenario WARNING. The external prompt's pass list is owned by no spec (`orbit-review-external`'s template leaves it a placeholder), so `orbit-review-external` carries none either. `orbit-scenario-map` is unchanged. Its consumer sentence already names "verify-change's Scenario Coverage step, and system review Pass 0 through verify".

## Impact

- **Bodies**: `src/core/templates/workflows/verify-change.ts` (step 6, in its upstream portion); `src/core/templates/workflows/review.ts` (the external mode-sections reference, item 0). No engine code.
- **Pins**: the verify skill template's hash and the generated `orbit-verify-change` skill's hash in `test/core/templates/skill-templates-parity.test.ts` move, each a recorded act.
- **Tests**: a new body suite for the two reader requirements; the rider pin in `test/core/scenario-map.test.ts`. Every scenario of this change's own delta is declared on the map.
- **Adopters**: a repo without `scenario_map:` sees verify print "scenario coverage not checked" where it used to trace by prose. The prose check is gone for everyone; the note names the config key that turns the mechanical check on.
- **Baseline**: capabilities 22 → 23 at archive (CLAUDE.md's marked figure moves with it).
