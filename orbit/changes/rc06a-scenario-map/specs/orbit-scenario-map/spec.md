## ADDED Requirements

### Requirement: A test declares the scenario it exercises with a scenario tag

A scenario's coverage SHALL be declared on the TEST side, never in the spec. A scenario TAG is a line in a scanned test file matching this production:

```
^\s*//\s*@scenario\s+(behaviour|text)\s+<capability> :: <requirement title> :: <scenario title>\s*$
```

The KEY is the triple — the capability's directory name under `orbit/specs/`, the requirement title as written after `### Requirement:`, and the scenario title as written after `#### Scenario:`, each trimmed — joined by the literal ` :: `. A tag's key is SPLIT on the literal ` :: ` (space, two colons, space) and MUST yield exactly three parts, each non-empty after trimming; so `a ::b :: c` splits into two parts and is MALFORMED. A requirement or scenario title that itself contains ` :: ` cannot be keyed; such a title in a change's delta is UNKEYABLE and is refused early, per `A declaration is owed by every scenario in the change's delta blocks` (no baseline title contains `::` today). The kind word records what the test establishes: `behaviour` (the test runs the behaviour the scenario states) or `text` (the test shows an artifact CARRIES the instruction the scenario states; it says nothing about whether an AI follows it). Any line matching `^\s*//\s*@scenario\b` that fails the production — an unknown kind word, a key without exactly three non-empty parts — is MALFORMED, naming the file and line.

A well-formed tag joins a PENDING STACK. While the stack is non-empty, the scan skips blank lines, `//` comments, and further tag lines (each well-formed one joining the stack; a malformed one is MALFORMED by name, joins nothing, and leaves the stack intact), and classifies the FIRST line that is none of those: every tag in the stack attaches to it, or every tag in the stack is refused with it. The next line is classified by this table, and a tag whose next line is refused is MALFORMED, naming the tag's line:

| next line begins, after leading whitespace, with | outcome |
|---|---|
| `it(` / `test(` | attaches |
| `it.each` / `test.each` | attaches; one tag covers every row |
| `it.skipIf(` / `test.skipIf(` | attaches — the test runs where the condition is false |
| `it.only(` / `test.only(` | attaches |
| `it.skip(` / `test.skip(` / `it.todo(` / `test.todo(` | REFUSED — a test that never runs covers nothing |
| `describe` | REFUSED — a tag names a test, never a group |
| anything else, or end of file | REFUSED |

The table is CLOSED: the call forms are listed and every other next line is refused by name, so no line passes unclassified. The scan reads text and never parses the language, so a tag-shaped line inside a string literal is classified like any other line. Only files in the scanned set (per `The scenario map is opt-in by the scenario_map config key`) are read. Three named limits: a tag-shaped line inside a string literal that is followed by a call line ATTACHES exactly as a real tag does, and the map cannot tell the two apart — a false declaration a reader sees only as an ordinary entry naming that file and line; v1 recognises the JS/TS (vitest/jest) call forms above and no other language's; and a line classifier cannot see an ENCLOSING group, so a tag on an `it(` inside a `describe.skip(` / `describe.skipIf(` / `describe.todo(` block attaches although that test may never run.

#### Scenario: A behaviour tag attaches to the next test

- **WHEN** a scanned file carries `// @scenario behaviour orbit-x :: Req A :: Scen 1` followed by a blank line and then `it('does the thing', …)`
- **THEN** the map records a `behaviour` declaration for `orbit-x :: Req A :: Scen 1` naming that file and the `it(` line

#### Scenario: Stacked tags attach to one test

- **WHEN** two tag lines precede a single `test(` call, separated only by a non-tag `//` comment
- **THEN** both keys record a declaration naming the same test line

#### Scenario: A tag above a skipped test is refused

- **WHEN** a tag's next line begins with `it.skip(`
- **THEN** the tag is MALFORMED, naming its file and line, and records no declaration

#### Scenario: A tag above a describe block is refused

- **WHEN** a tag's next line begins with `describe(`
- **THEN** the tag is MALFORMED, naming its file and line

#### Scenario: A tag at end of file is refused

- **WHEN** a tag is the last non-blank line of a file
- **THEN** the tag is MALFORMED, naming its file and line

#### Scenario: A near-miss tag is malformed, never ignored

- **WHEN** a line reads `// @scenario covers orbit-x :: Req A :: Scen 1` (unknown kind) or `// @scenario behaviour orbit-x :: Req A` (two parts)
- **THEN** the line is MALFORMED, naming its file and line

### Requirement: The scenario ledger declares what no test can run

A scenario no test can exercise SHALL be declared in `orbit/scenario-ledger.yaml`, a YAML mapping with one key, `scenarios`, whose value is a list of entries:

```yaml
scenarios:
  - key: "<capability> :: <requirement title> :: <scenario title>"
    kind: observed
    record: <the record it cites — a trail file path, or an archived task line>
  - key: "<capability> :: <requirement title> :: <scenario title>"
    kind: untestable
    why: <why nothing mechanical can bear on it>
```

`key` follows the tag's key rule. `kind: observed` REQUIRES a non-empty `record`; `kind: untestable` REQUIRES a non-empty `why`. An absent ledger file declares nothing. An entry with no `key`, a key without exactly three non-empty parts, an unknown `kind`, or a missing required field is MALFORMED, naming the entry's index; a file that is not valid YAML or whose top level is not a mapping with a `scenarios` list is MALFORMED as a whole. The engine never judges whether a cited record shows what is claimed, or whether a reason is true — the ledger is a RECORD, not a check.

#### Scenario: An observed entry declares a scenario

- **WHEN** the ledger carries `{key: "orbit-x :: Req A :: Scen 2", kind: observed, record: "orbit/changes/archive/…/apply-….json"}`
- **THEN** the map records an `observed` declaration for that key citing the record

#### Scenario: An untestable entry without a why is malformed

- **WHEN** a ledger entry has `kind: untestable` and no `why`
- **THEN** the entry is MALFORMED, naming its index, and records no declaration

#### Scenario: An absent ledger declares nothing

- **WHEN** `orbit/scenario-ledger.yaml` does not exist
- **THEN** the map is computed from tags alone and reports no ledger error

### Requirement: Cover kinds are reported separately and never summed

Every DELTA scenario the map lists SHALL be in exactly the states this table derives — the product of the two declaration sources (tags by kind, ledger by kind) plus their two failure forms — and the map SHALL render each kind as its own column, never folding them into one covered figure:

| the scenario has | reported as |
|---|---|
| one or more `behaviour` tags | the behaviour column, naming each file and line |
| one or more `text` tags | the text column, naming each file and line |
| a ledger `observed` entry | the observed column, naming the record |
| a ledger `untestable` entry | the untestable column, carrying the why |
| several of the above | every kind it has, with no precedence and no single verdict |
| none of the above | UNCOVERED |

A tag or ledger entry whose key resolves to no scenario is reported as ORPHAN against the tag or entry, never against a scenario; a tag or entry failing its grammar is reported as MALFORMED, naming its line or index. Counts are shown as counts, never as a ratio.

#### Scenario: A scenario with two kinds shows both

- **WHEN** a scenario carries a `text` tag and a ledger `untestable` entry
- **THEN** both columns are filled for it and it is not UNCOVERED

#### Scenario: A scenario with no declaration is uncovered

- **WHEN** no tag and no ledger entry names a scenario's key
- **THEN** the scenario is reported UNCOVERED

#### Scenario: A tag naming no scenario is an orphan

- **WHEN** a well-formed tag's key matches no scenario in the resolved specs
- **THEN** the tag is reported ORPHAN with its file and line, and no scenario changes state

#### Scenario: No covered ratio is printed

- **WHEN** the map is rendered for a change with declared and undeclared scenarios
- **THEN** each column and the UNCOVERED total are printed as counts, and no percentage or fraction of covered scenarios appears

### Requirement: The scenario map is engine-computed at one read surface

The map SHALL be computed at read time by `orbit status --change <name> --scenarios` and SHALL be stored in no emit and no file. It resolves keys against the RESOLVED specs — the baseline under `orbit/specs/` with the change's delta operations applied to the key set IN THE ARCHIVE'S ORDER — RENAMED (re-keys a requirement's scenarios), then REMOVED (drops them), then MODIFIED (replaces the scenario set of the requirement named by the block, under its new name when it was renamed), then ADDED (adds the block's scenarios) — reading `#### Scenario:` headings fence-aware through the engine's shared CommonMark fence tracker. The human render opens with a header naming the change, whether the check is ON or OFF, and the scanned globs; then the change's DELTA scenarios with one column per cover kind and UNCOVERED marked; then ORPHAN and MALFORMED lines; then the counts, including the number of baseline scenarios outside the delta that carry no declaration. `--json` carries the same facts as ONE object of this shape:

```
{
  change:    <name>,
  check:     "on" | "off",
  tests:     [<glob>, …],                      the scanned globs
  scenarios: [{                                one entry per delta scenario
    capability, requirement, scenario,         the key's three parts
    operation:    "ADDED" | "MODIFIED" | "RENAMED",
    declarations: {
      behaviour:  [{file, line}],              the attached test line
      text:       [{file, line}],
      observed:   [{record}],
      untestable: [{why}]
    },
    uncovered: <boolean>                       true iff all four lists are empty
  }],
  orphans:   [{source: "tag", file, line, key} | {source: "ledger", index, key}],
  malformed: [{source: "tag", file, line, reason} | {source: "ledger", index, reason} | {source: "ledger-file", reason}
             | {source: "spec", capability, requirement, scenario, reason: "unkeyable"}],
  counts: {
    delta_scenarios, behaviour, text, observed, untestable, uncovered,
    orphans, malformed, baseline_undeclared     each a count; no ratio
  }
}
```

`operation` names the delta block that put the scenario in the delta (a renamed-then-modified requirement's scenarios read `MODIFIED`); a per-kind count is the number of delta scenarios carrying at least one declaration of that kind. `--scenarios` requires `--change`, and cannot be combined with `--report` or `--boot`.

The surface's consumers are exactly those the program names — `orbit validate <change>` (per `A declaration is owed by every scenario in the change's delta blocks`), verify-change's Scenario Coverage step, and system review Pass 0 through verify — sourced from the rc06 and rc10 charters and the verify-change body; each READS the surface and none records a copy.

#### Scenario: The map renders for a change

- **WHEN** the user runs `orbit status --change rc-x --scenarios` with the check ON
- **THEN** the output names `rc-x`, `ON` and the scanned globs, lists every delta scenario with its four kind columns, marks the undeclared ones UNCOVERED, and prints the baseline-undeclared count

#### Scenario: The JSON form carries the same facts

- **WHEN** the user runs `orbit status --change rc-x --scenarios --json`
- **THEN** stdout is one JSON object carrying `change`, `check`, `tests`, `scenarios`, `orphans`, `malformed` and `counts`, and every scenario entry carries its `declarations` per kind and an `uncovered` boolean

#### Scenario: A MODIFIED requirement's unchanged scenarios are in the delta

- **WHEN** a change MODIFIES a requirement whose block keeps two baseline scenarios and adds one
- **THEN** all three scenarios are listed as delta scenarios with `operation` `MODIFIED`

#### Scenario: A fenced scenario heading is not a scenario

- **WHEN** a requirement block contains `#### Scenario: Example` inside a fenced code block
- **THEN** the map lists no scenario for that line

#### Scenario: Nothing is written

- **WHEN** the surface runs
- **THEN** no file under the project is created or modified

#### Scenario: The flag requires a change

- **WHEN** the user runs `orbit status --scenarios` without `--change`
- **THEN** the command fails with a message naming `--change`, and exits non-zero

### Requirement: A declaration is owed by every scenario in the change's delta blocks

When the check is ON, `orbit validate <change>` SHALL report every scenario in the change's delta that carries no declaration, naming its key, at the level `An undeclared delta scenario is INFO until the apply gate passes` assigns. A delta scenario whose requirement title or scenario title contains ` :: ` cannot be keyed by any tag or ledger entry; validate SHALL report it as UNKEYABLE at ERROR whatever the apply gate's state and whether or not the change context loads, naming the capability and both titles, and SHALL report it ONLY so: an UNKEYABLE scenario is not also reported as undeclared, is not listed in the surface's `scenarios`, and is not counted in `counts.uncovered` — it appears on the surface only in `malformed` with `source: "spec"` — so a proposal review's structure pass blocks while renaming it is still free, before any test is written, and the scenario never reaches apply undeclarable. Which scenarios owe a declaration is decided per delta operation, over the set `DeltaOperationType` defines (`ADDED`, `MODIFIED`, `REMOVED`, `RENAMED`):

| delta operation | owes a declaration |
|---|---|
| ADDED | every scenario in the block |
| MODIFIED | every scenario in the block, unchanged scenarios included — the block replaces the whole requirement |
| RENAMED | every baseline scenario under the OLD title, under its NEW key; tags on the old key render ORPHAN — unless the change also MODIFIES the requirement under its new name, when the MODIFIED row governs (the archive's order applies RENAMED first) |
| REMOVED | nothing; tags on its scenarios render ORPHAN once the change is archived |
| (outside every delta block) | nothing — COUNTED on the surface (`counts.baseline_undeclared`), never listed, never reported by validate |

ORPHAN and MALFORMED lines are reported on the surface only; validate reports undeclared and UNKEYABLE delta scenarios and nothing else from the map. When the check is OFF, validate reports nothing from the map; with the key ABSENT its output is byte-identical to its output without this capability, and with the key malformed it adds only the one warning `The scenario map is opt-in by the scenario_map config key` assigns.

#### Scenario: An undeclared ADDED scenario is reported

- **WHEN** the check is ON and an ADDED requirement's scenario carries no tag and no ledger entry
- **THEN** `orbit validate <change>` reports it, naming `<capability> :: <requirement> :: <scenario>`

#### Scenario: A MODIFIED block's unchanged scenario owes a declaration

- **WHEN** the check is ON, a MODIFIED block carries a scenario copied unchanged from the baseline, and no tag names it
- **THEN** `orbit validate <change>` reports that scenario

#### Scenario: A RENAMED requirement re-keys its scenarios

- **WHEN** the check is ON, a change RENAMES `Req A` to `Req B`, and the only tags for its scenarios name `Req A`
- **THEN** `orbit validate <change>` reports each scenario under `Req B` as undeclared, and the surface reports the `Req A` tags as ORPHAN

#### Scenario: A renamed-then-modified requirement owes its MODIFIED block

- **WHEN** the check is ON and a change RENAMES `Req A` to `Req B` and MODIFIES `Req B` with a block of three scenarios
- **THEN** exactly those three scenarios owe declarations, keyed under `Req B`, each with `operation` `MODIFIED`

#### Scenario: An unkeyable title is refused before apply

- **WHEN** the check is ON, a change's tasks are all unchecked, and an ADDED requirement carries `#### Scenario: A :: B`
- **THEN** `orbit validate <change>` reports that scenario as UNKEYABLE at ERROR, naming its capability and both titles, and `--strict` fails

#### Scenario: A baseline scenario outside the delta never fails validate

- **WHEN** the check is ON and a baseline scenario the change does not touch carries no declaration
- **THEN** `orbit validate <change>` reports nothing for it, and the surface counts it among the baseline-undeclared

### Requirement: An undeclared delta scenario is INFO until the apply gate passes

Tests and their tags are written at apply, so the level at which `orbit validate <change>` reports an undeclared delta scenario SHALL follow the change's `apply` gate, read from the gate computation `orbit status --change <name>` performs. The states are those `GateState` defines for a tracked gate — `blocked`, `ready`, `passed` — plus the schema with no `apply` gate:

| the change's `apply` gate | level |
|---|---|
| `blocked` (tasks.md absent) | INFO |
| `ready` (tasks unchecked, or zero tasks) | INFO |
| `passed` (every task checked) | ERROR |
| `passed` for flow (only declared user-validation handoffs remain unchecked) | ERROR |
| no `apply` gate (a schema declaring neither an `apply` gate nor `apply:`) | INFO, always |
| the change context cannot load (an unknown schema, an unreadable metadata file) | INFO, always — the check never throws |

This table governs undeclared scenarios that CAN be keyed; an UNKEYABLE scenario is an ERROR at every state, per `A declaration is owed by every scenario in the change's delta blocks`, which owns that exception. INFO never fails `orbit validate --strict`, so a proposal review's structure pass never blocks on a scenario whose test cannot exist yet. Every issue the map contributes carries the path `scenario-map`, and human-mode `orbit validate` SHALL print each such INFO issue beneath the `is valid` line when the report is valid; a report carrying no `scenario-map` issue prints exactly as before. The level REPORTS the scenario's state; no gate reads it.

#### Scenario: Before apply, an undeclared scenario is INFO

- **WHEN** the check is ON, a change's tasks are unchecked, and an ADDED scenario carries no declaration
- **THEN** `orbit validate <change> --strict` passes and prints the scenario's key beneath the `is valid` line as an INFO line

#### Scenario: After apply, an undeclared scenario is an ERROR

- **WHEN** the check is ON, every task of the change is checked, and an ADDED scenario carries no declaration
- **THEN** `orbit validate <change>` reports it at ERROR and fails

#### Scenario: A change whose context cannot load reports INFO

- **WHEN** the check is ON and the change's metadata names a schema that does not resolve
- **THEN** the check reports its undeclared scenarios at INFO and validate does not throw

#### Scenario: Pending user-validation handoffs count as applied

- **WHEN** the check is ON, the only unchecked tasks are user-validation handoffs the latest apply emit declared, and a delta scenario carries no declaration
- **THEN** `orbit validate <change>` reports it at ERROR

### Requirement: The scenario map is opt-in by the scenario_map config key

The check SHALL be ON only when `orbit/config.yaml` carries a well-formed `scenario_map` key. An ABSENT key SHALL leave `orbit validate` exactly as it behaves without this capability; a MALFORMED key turns the check off and adds only its one warning. The shapes form this table — a value is absent, a mapping, or not a mapping; a mapping's `tests` is valid, empty, absent or mis-typed:

| `scenario_map` | outcome |
|---|---|
| absent, or no config file | check OFF; the surface scans `test/**/*.test.ts` and its header says the check is off |
| `{tests: [<glob>, …]}` with at least one string glob | check ON; the globs, matched from the project root, are the scanned file set |
| `tests` matching zero files | check ON; the scan raises one warning naming the globs, once per run |
| `{tests: []}`, `tests` absent, or `tests` not a list of strings | INERT — treated as absent, with one warning naming the shape |
| not a mapping (a scalar, a list, `null`) | INERT — treated as absent, with one warning naming the shape |
| an unknown sub-key beside a valid `tests` | ignored, with one warning naming it |

The key is read ON ITS OWN: validate and the surface read only `scenario_map` from `orbit/config.yaml` and SHALL NOT print a warning about any other field, so a repo whose config carries a malformed `pr:` or `rules:` sees no new line from `orbit validate`.

#### Scenario: An absent key leaves validate unchanged

- **WHEN** `orbit/config.yaml` has no `scenario_map` key and a change has undeclared delta scenarios
- **THEN** `orbit validate <change>` reports nothing from the map, and `orbit status --change <change> --scenarios` renders with the check OFF

#### Scenario: A configured glob list turns the check on

- **WHEN** `orbit/config.yaml` carries `scenario_map: { tests: ['spec/**/*.test.ts'] }`
- **THEN** only files matching `spec/**/*.test.ts` are scanned for tags and the check is ON

#### Scenario: Another field's malformed value does not reach validate

- **WHEN** `orbit/config.yaml` carries `pr: sometimes` and no `scenario_map` key
- **THEN** `orbit validate <change>` prints no warning about `pr` and its output is unchanged

#### Scenario: Globs matching nothing warn once

- **WHEN** `scenario_map.tests` is `['nothing/**/*.test.ts']` and no file matches
- **THEN** the check is ON and one warning naming the globs is printed per run

#### Scenario: A malformed key is inert with a warning

- **WHEN** `orbit/config.yaml` carries `scenario_map: true`
- **THEN** the check is OFF and one warning names the shape
