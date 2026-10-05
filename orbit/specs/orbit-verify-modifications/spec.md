# orbit-verify-modifications Specification

## Purpose
Make verify-change's Scenario Coverage step a READER of the scenario map instead of a tracer of tests by prose: one closed table says what verify reports for every coverage fact `orbit status --change <name> --scenarios --json` can return, the body carries that table as a checked mirror, and every Pass 0 reader — standalone verify, system review's Pass 0 through verify, and the external prompt's item 0 — reads the same surface rather than rebuilding it. The upstream test-tracing line is replaced in place as a named edit under `orbit-conventions`' `Generated-file disposition`. Introduced by rc06b-map-readers (clean-up-review-cycle, goal G2).
## Requirements
### Requirement: Verify's Scenario Coverage step reads the scenario map

The verify-change body's Scenario Coverage step SHALL read the scenario map from `orbit status --change <name> --scenarios --json`, whose shape `orbit-scenario-map`'s `The scenario map is engine-computed at one read surface` owns. It SHALL NOT trace scenarios to tests by searching test files. This replaces, in place, the upstream step's instruction to check whether tests exist covering the scenario, and is the named edit `orbit-conventions`' `Generated-file disposition` requires. The same step's check that a scenario's conditions are handled in code is unchanged, because it traces implementation, not tests. Verify reports what it reads by this table, which is exhaustive over the surface's JSON fields that carry coverage facts plus the one state outside them, the command failing:

| what the surface returns | what verify reports |
|---|---|
| the command fails (a non-zero exit, or output that does not parse) | one note naming the error, and the check listed as skipped, per the body's Graceful Degradation; no other row applies |
| `check` is `"off"` | one note: the scenario-map check is off because `scenario_map:` is absent from, or malformed in, `orbit/config.yaml`; no other row applies — no scenario, orphan or malformed finding, and no tracing by any other means |
| `check` is `"on"`, `scenarios` is empty, and no `malformed` entry has `source: "spec"` | one note: the change has no delta scenarios; the rows below for `orphans`, `malformed` and `counts` still apply |
| a `scenarios` entry with `uncovered: true` | a WARNING `Scenario not covered: <capability> :: <requirement> :: <scenario>`, recommending a `@scenario` tag above the test that exercises it, or a ledger entry |
| a `scenarios` entry with any declaration | no finding; its declared kinds are listed as the surface gives them, never summed and never re-graded |
| one or more `malformed` entries with `source: "spec"` (`reason: "unkeyable"`) | ONE WARNING per distinct capability, requirement and scenario triple, naming the triple and its number of entries, stating that `orbit validate` reports it at the level `orbit-scenario-map` assigns, and recommending the title be renamed; every `orphans` entry whose `key` equals that triple joined by ` :: ` is listed under it and is never a finding of its own |
| any other `orphans` entry | a WARNING naming the tag's file and line, or the ledger index, and the key, stating that the key names no scenario of the baseline or this change's delta — a renamed, removed or mistyped key, or a scenario another active change adds, which the map does not distinguish — and recommending the tag or ledger entry be corrected unless it names another active change's scenario |
| a `malformed` entry with source `tag` or `ledger` | a WARNING naming the file and line, or the ledger index, and the surface's `reason` |
| a `malformed` entry with source `ledger-file` | a WARNING naming `orbit/scenario-ledger.yaml`, with no line, and the surface's `reason` |
| `counts` | printed as counts; no ratio of covered scenarios appears in the report or its scorecard |
| `counts.baseline_undeclared` | printed as a count, never a finding |

The table is exhaustive over the fields of the surface's JSON that carry coverage facts — `check`, `scenarios`, `orphans`, `malformed` and `counts` — plus the one state outside them, the command failing; `change` and `tests` carry none and raise nothing. The verify body carries this table as a CHECKED MIRROR, held byte-equal to this requirement by a parity test (R-crc-14's mirror corollary: an installed skill cannot open this spec). The step's implementation check keeps a finding of its own, titled apart from the map's: a scenario whose conditions are not handled in code is a WARNING `Scenario not handled in code: <scenario name>`, recommending its implementation and never a test. An uncovered, orphan or malformed finding is a WARNING for the verify emit's fail-mode classification, which `orbit-run-summary-emit`'s `Verify fail-mode recommendations` owns, precedence included; it is never `scenarios-fail`. Verify judges nothing the surface computed: whether a declared test really exercises its scenario stays the declaration's own record (the kind word).

#### Scenario: The coverage step names the surface and carries no test-tracing instruction
- **WHEN** the generated `orbit-verify-change` skill is read
- **THEN** its Scenario Coverage step names `orbit status --change <name> --scenarios --json`, and no line instructs checking whether tests exist covering a scenario

#### Scenario: Implementation tracing is kept and titled apart from the map
- **WHEN** the generated `orbit-verify-change` skill's Scenario Coverage step is read
- **THEN** it still instructs checking whether each scenario's conditions are handled in code, reports a miss as `Scenario not handled in code: <scenario name>` recommending its implementation, and pairs no `Scenario not covered` warning or test recommendation with that check

#### Scenario: The body's table mirrors this requirement
- **WHEN** the parity test compares the verify body's reader table with this requirement's table
- **THEN** the two are byte-equal

#### Scenario: A failing surface is a skipped check
- **WHEN** the surface command exits non-zero during verify
- **THEN** verify prints one note naming the error, lists scenario coverage as skipped, and raises no other finding from the map

#### Scenario: The check off is reported as not checked
- **WHEN** the surface returns `check: "off"`
- **THEN** verify prints one note naming the `scenario_map:` key as absent or malformed, raises no scenario, orphan or malformed finding even where the surface returns them, and traces no test by any other means

#### Scenario: An uncovered scenario is a warning naming its key
- **WHEN** the surface returns a delta scenario with `uncovered: true`
- **THEN** verify raises one WARNING naming the scenario's capability, requirement and scenario title, and recommends a tag or a ledger entry

#### Scenario: A text-only declaration raises nothing
- **WHEN** a delta scenario carries only a `text` declaration
- **THEN** verify raises no finding for it and lists its kind as `text`

#### Scenario: An orphan matching an unkeyable title is reported with it
- **WHEN** a scenario title occurs twice within its requirement, so the surface returns two `malformed` entries with `source: "spec"` and the same triple, and an `orphans` entry whose key is that triple joined by ` :: `
- **THEN** verify reports one finding for the triple naming two entries, and lists the orphan under it, not as a separate finding

#### Scenario: An orphan's recommendation names its causes
- **WHEN** the surface returns an `orphans` entry that matches no unkeyable triple
- **THEN** verify's WARNING states that the key names no scenario of the baseline or this change's delta, names the possible causes without choosing one, and recommends correcting the tag or ledger entry unless it names another active change's scenario

#### Scenario: A change whose only delta scenarios are unkeyable gets no empty note
- **WHEN** the surface returns `check: "on"`, an empty `scenarios` list, and a `malformed` entry with `source: "spec"`
- **THEN** verify reports the unkeyable finding and prints no note that the change has no delta scenarios

#### Scenario: A malformed ledger file is reported by its path
- **WHEN** the surface returns a `malformed` entry with `source: "ledger-file"`
- **THEN** verify raises a WARNING naming `orbit/scenario-ledger.yaml` and the surface's reason, and names no line

#### Scenario: A malformed tag is reported by its line
- **WHEN** the surface returns a `malformed` entry with `source: "tag"`
- **THEN** verify raises a WARNING naming the file, the line and the surface's reason

#### Scenario: Verify prints counts and no coverage ratio
- **WHEN** verify reports the scenario map
- **THEN** its report prints the surface's counts, including the baseline-undeclared count, and contains no fraction or percentage of covered scenarios

### Requirement: Every Pass 0 reader reads the scenario map

Every place a review performs verify-change's check SHALL take scenario coverage from the surface named in `Verify's Scenario Coverage step reads the scenario map`, and SHALL state that step's reading only there. The places are listed by this table, which is exhaustive over the review body's three modes, three reviewer classes and two pass genres, plus standalone verify:

| where | how it reads the map |
|---|---|
| standalone `/orbit:verify <name>` | the Scenario Coverage step |
| system-mode Pass 0, `in-context` or `fresh`, REVIEW genre | through its existing `/orbit:verify` invocation; the review body carries no coverage instruction of its own, and folds the findings by its existing Pass 0 rule (`orbit-review`'s `Pass 0 delegates to upstream verify-change`) |
| system-mode Pass 0 under `--skip-verify` | not run; the existing skip note stands |
| system mode under `--fast` | Pass 0 runs, so the Scenario Coverage step runs |
| an `in-context` VERIFICATION-genre system pass | Pass 0 is not run (`orbit-review`'s verification-pass requirement) |
| an `external` system pass: the prompt's item 0, the verify-change-style structural check | the item names `orbit status --change <change-name> --scenarios --json` as the spec-coverage source; an external reviewer who cannot run it reports the check as not run |
| proposal mode | no Pass 0; `orbit validate` reports undeclared scenarios at the level `orbit-scenario-map` assigns |
| architecture mode | no Pass 0 |

The table is exhaustive over the review body's pass definitions for each mode, class and genre, plus the verify command. The surface reads specs, the ledger and test files, so naming it in an external brief carries no finding and no prior pass. The one trail path it can carry, an `observed` declaration's `record`, is an instance of the residual `orbit-conventions`' `Review mode decision framework` already names — prior-pass content reaching a reviewer through what a brief legitimately names.

#### Scenario: System Pass 0 consumes the map through verify
- **WHEN** the generated `orbit-review` skill's system-mode Pass 0 is read
- **THEN** it invokes `/orbit:verify <change-name>` and carries no instruction of its own to trace scenarios to tests

#### Scenario: The external prompt's item 0 names the surface
- **WHEN** the external review prompt's system-mode pass list is read
- **THEN** its item 0 names `orbit status --change <change-name> --scenarios --json` as the source of spec coverage, and says an external reviewer who cannot run it reports the check as not run

