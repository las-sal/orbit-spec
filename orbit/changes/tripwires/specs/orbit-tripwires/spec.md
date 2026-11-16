## ADDED Requirements

### Requirement: A tripwire is a sensor that returns a reading

orbit SHALL build every tripwire (stage `tripwires` of `automate-dev-flow`, R-adf-3's fifth stop condition) as a SENSOR
behind one contract: a sensor measures something about one change, compares it with its reference, and returns one
READING. Nothing about a sensor is special-cased outside the contract, so a later sensor plugs in by being added to
orbit's sensor list and adds no stop condition. A reading carries:

| field | carries |
|---|---|
| `sensor` | the sensor's id |
| `outcome` | exactly one of `fired`, `quiet`, `cannot-read` |
| `key` | a string naming the deviation, the same at every seam while the deviation is the same; `null` when `quiet` |
| `reference` | the commit the sensor's reference was read at (`A sensor compares against a reference fixed before the run`), or `null` when none exists yet |
| `evidence` | an object the sensor defines, naming what it found against what it compared |
| `stop` | present only when a `tripwire` stop names the reading's key: that stop's filename (`A halting reading writes a tripwire stop`) |
| `answered_by` | present only when a resolution answers that stop: the resolution's filename |

The contract admits four kinds of sensor, by what each reads:

| member | covered by |
|---|---|
| built-in, computed from committed state (Touchpoints left, undeclared capability, undeclared size breach, ruling or goal edited) | an engine function per sensor, reading git and the change's artifacts |
| built-in, computed from the trail (review iterations not converging) | an engine function reading the change's review emits |
| project-declared command (a linter, a code-structure evaluator) | a config entry naming a command whose output is one reading |
| judgement sensor (the steward pass) | a review emit's verdict field, which the engine turns into a reading |

This capability builds the contract and one sensor of the first kind, `touchpoints` (`The Touchpoints sensor fires on
unpredicted source past a tolerance`); the stage's later changes add the others.

Named limit — the four kinds are the inputs orbit can read today; a sensor's input is not a closed structure.

Residual kind: a sensor needing state that is neither committed, on the trail, nor producible by a command (a live session's transcript, its token spend)

Residual method: classifying each drift that G6's first-run closing review finds no sensor caught against these four kinds

#### Scenario: A reading carries the contract's fields

- **WHEN** the `touchpoints` sensor runs on a change whose committed work fires it
- **THEN** its reading carries `sensor: "touchpoints"`, `outcome: "fired"`, a non-null `key`, the fixed point's commit
  as `reference`, and `evidence` naming the files

#### Scenario: A quiet reading has no key

- **WHEN** the `touchpoints` sensor runs on a change whose committed work matches its plan
- **THEN** its reading carries `outcome: "quiet"` and `key: null`

### Requirement: A sensor compares against a reference fixed before the run

Every sensor SHALL fire on an undeclared deviation from a reference fixed before the run it watches: it measures
something now, compares it with that reference, and fires when they differ and the plan did not declare the difference.
Watching deviation rather than level keeps firings rare (G3), and fixing the reference keeps the run from moving it.

The FIXED POINT of a change is the parent of its FIRST APPLY COMMIT: the earliest commit in the history of `HEAD`, after
the change's first commit (the earliest commit touching `orbit/changes/<name>/`), that changes a path outside the
change's own paths (`orbit/changes/<name>/`, `orbit/explore/<name>/` and its archive folder). A sensor reads its
reference, and its settings (`The tripwires setting`), from the fixed point with git, never from the working tree, so an
edit the run makes to either after apply begins changes nothing the sensor compares. Before the first apply commit
exists, no committed work can deviate, and a sensor whose reference is read at the fixed point returns `quiet` with
`reference: null`. Each sensor states its measure, its reference and its declared escape in its own requirement.

A sensor that cannot read its reference returns `cannot-read`, and `cannot-read` is treated as `fired` wherever a
firing is acted on or shown (`Every seam emit carries the readings`, `A halting reading writes a tripwire stop`), so
silence is never a pass.

Named limit — sensors plug in (`A tripwire is a sensor that returns a reading`), so the set of sensors is open by design.

Residual kind: a sensor whose reference cannot be read at its fixed point (no `## Touchpoints` section, a project sensor with no reading at propose, a baseline file missing)

Residual method: each sensor states how it reads its reference; a sensor that cannot read it returns a reading saying so, which is recorded like a firing — silence is never a pass

#### Scenario: An edit to the plan after apply begins moves nothing

- **WHEN** a change's first apply commit is `C`, and a later commit adds `src/x.ts` to `design.md`'s `## Touchpoints`
  and edits `src/x.ts`
- **THEN** the `touchpoints` reading compares against `design.md` as at `C`'s parent, so `src/x.ts` is unpredicted

#### Scenario: No apply commit yet is quiet

- **WHEN** a change's history holds only its propose commit, and the `touchpoints` sensor runs
- **THEN** its reading is `quiet` with `reference: null`

#### Scenario: A reference that cannot be read reads as cannot-read

- **WHEN** a change's `design.md` at the fixed point has no `## Touchpoints` section
- **THEN** the `touchpoints` reading's outcome is `cannot-read`, never `quiet`

### Requirement: Every seam emit carries the readings

The emit surface SHALL compute, as a computed extension (`orbit-emit-composition`'s `Deterministic facts are
engine-composed per command`), a `tripwires` field on every SEAM EMIT: an `apply` emit, a `review` emit of mode
`proposal` or `system`, an `address-reviews` emit on an active change, and an `archive` emit. The field is an array
holding one reading per sensor in orbit's sensor list, in the order of the sensors' ids, every outcome included, so a
seam emit with no `tripwires` field says the sensors did not run. No other emit carries it; a payload supplying it is
refused naming it as engine-owned.

What a sensor run leaves, by its outcome and its sensor's `on_fire` setting:

| member | covered by |
|---|---|
| ran, did not fire | listed in the seam emit's engine-computed readings field (proof the sensor ran) |
| fired, setting absent or record-only | listed in the readings field with its evidence; no stop |
| fired, setting halt | listed in the readings field, and orbit writes a `tripwire` stop to `decisions/` naming the reading; the chain halts on the existing `open-stop` row |
| could not read its reference | listed as such (the residual of `A sensor compares against a reference fixed before the run`), treated as fired for the two rows above |

A run fired, did not, or could not read; the setting is absent, record-only or halt. The reading is the sensor's and the
stop is the setting's: one setting per sensor decides (R-adf-6).

#### Scenario: A quiet run is recorded

- **WHEN** `orbit emit apply --change foo` is written and the `touchpoints` sensor does not fire
- **THEN** the emit carries `tripwires` holding one reading, `{sensor: "touchpoints", outcome: "quiet", …}`

#### Scenario: Only the seam emits carry the field

- **WHEN** a `verify` emit, a `propose` emit and an architecture-mode `review` emit are written
- **THEN** none of them carries a `tripwires` field

#### Scenario: The field is engine-owned

- **WHEN** an apply payload supplies `tripwires`
- **THEN** the emit is refused naming the field as engine-owned; no file is written

#### Scenario: A firing at the defaults writes no stop

- **WHEN** the `touchpoints` sensor fires at a review emit and `orbit/config.yaml` has no `tripwires` key
- **THEN** the emit's reading is `fired` and no file is added to the change's `decisions/` folder

### Requirement: A halting reading writes a tripwire stop

The emit surface SHALL write a STOP RECORD of condition `tripwire` (`orbit-decision-records`' `Three decision records,
one job each`) to the change's `decisions/` folder when a seam emit's reading is `fired` or `cannot-read` and its
sensor's `on_fire` setting is `halt`, unless a `tripwire` stop already names the reading's key there. The setting halts
when it reads `halt` in the current `orbit/config.yaml` or in the config at the fixed point, so a run cannot turn a halt
off and the user can turn one on mid-change. The `archive` emit writes no stop: the archive has landed, so nothing is
left to halt, and its readings are recorded only.

orbit composes the record, since no payload may raise `tripwire`: `command: "stop"`, the timestamp, `change`,
`model: null`, `condition: "tripwire"`, an `about` and a `question` written by orbit in plain language by the rule of
`orbit-decision-records`' `Decision records are written for a reader who knows only the architecture` (what the sensor
found, against what, and whether the work should go on as it is), a `detail` naming the reading's evidence, and a
`tripwire` object `{sensor, key, emit}` naming the sensor, the key and the seam emit's filename. A stop NAMES a key when
the latest record of its replacement chain carries that key in its `tripwire` object. The surface prints one line on
standard error naming each stop it wrote. The chain's `open-stop` row (`orbit-engine-gates`) reads it as any other open
stop.

A reading whose key a stop names carries that stop's filename in `stop`; a reading whose key a resolution has answered
carries the resolution's filename in `answered_by`, and the fired outcome is not asked again.

#### Scenario: A halting firing writes one stop

- **WHEN** `tripwires: {touchpoints: {on_fire: halt}}` is set, and a review emit's `touchpoints` reading fires with key
  `K` that no stop names
- **THEN** the change's `decisions/` folder gains `stop-<TS>.json` with `condition: "tripwire"`, `model: null` and
  `tripwire.key: "K"`, and the reading carries `stop` naming it

#### Scenario: The same key is not asked twice

- **WHEN** a stop naming key `K` exists, open or answered, and the next seam emit's reading fires with key `K`
- **THEN** no stop is written, and the reading names the existing stop (and, when answered, its resolution)

#### Scenario: A halt the run removed still halts

- **WHEN** `on_fire: halt` is set in the config at the fixed point, and the current config sets `on_fire: record`
- **THEN** a firing at the next seam emit writes the stop

#### Scenario: The archive records and halts nothing

- **WHEN** the `touchpoints` reading fires at an `archive` emit under `on_fire: halt`
- **THEN** the archive emit carries the reading and no stop is written

### Requirement: A declaration after the fixed point counts only as the user's answer

A declaration of a deviation SHALL escape a sensor only when it is part of the plan at the fixed point. A declaration
written later counts only as the user's answer to the stop the firing raised, so a run cannot declare its way out of a
sensor:

| member | covered by |
|---|---|
| present at the reference's fixed point | the deviation it names is declared: no firing |
| written later, sensor set to halt | fires; the `tripwire` stop names the reading's key, the user's answer is its resolution, and later readings with that key read as declared |
| written later, sensor record-only (the default) | the reading stays fired; the brief shows it beside the late declaration |

A declaration is in place at the fixed point or written after it; the setting is halt or not. "Declared" has one
source after the fixed point: the resolution names the stop, and the stop names the reading's key. For the
`touchpoints` sensor the declaration is a `## Touchpoints` entry, and a firing path that only the CURRENT section
predicts is marked in the evidence as declared late.

#### Scenario: A late Touchpoints entry does not quiet the sensor

- **WHEN** `src/x.ts` changes by 60 lines, is unpredicted at the fixed point, and a later commit adds it to
  `## Touchpoints`, with the sensor record-only
- **THEN** the reading stays `fired`, and its evidence marks `src/x.ts` as declared late

#### Scenario: The user's answer declares the key

- **WHEN** under `on_fire: halt` a stop names key `K` and a resolution answers it
- **THEN** a later reading with key `K` carries `answered_by` naming that resolution, and no new stop is written

### Requirement: At the defaults a reading is shown nowhere but the brief

With nothing configured, a reading SHALL change nothing the user sees or is asked (`automate-dev-flow`'s G0), by the
surface it could reach:

| member | covered by |
|---|---|
| the human readouts (`orbit status` bare, `--full`, `--boot`; `orbit architecture status`) | unchanged: none renders a reading |
| the gates | unchanged: no gate reads a reading |
| the chain object | unchanged: no stop is written at the defaults (`Every seam emit carries the readings`), so no `open-stop` row can match |
| the reading step (default-on, R-adf-11) | unchanged: no stop is written to `decisions/` at the defaults, so its selection holds nothing new |
| the generated bodies | no text whose effect at the defaults changes what the AI does or says (R-adf-12) |
| the seam emits | an engine-computed field carrying the readings: a record, rendered nowhere |
| the brief (`orbit brief`, the archive's saved copy) | its Tripwires section lists the readings, as `orbit-program-brief`' tripwires row states |

The members are G0's own list (readouts, gates, generated bodies, records), and the chain object and the reading step,
the two default-reaching consumers earlier stages added.

#### Scenario: A firing changes no readout

- **WHEN** a change's latest review emit carries a `fired` reading and every setting is at its default
- **THEN** `orbit status --change <name>`, its `--json`, its `--boot` render and the change's gates are exactly what
  they would be without the reading

### Requirement: The Touchpoints sensor fires on unpredicted source past a tolerance

The `touchpoints` sensor SHALL compare the paths the change's committed work changed, from the fixed point to `HEAD`
(`git diff --numstat`), with `design.md`'s `## Touchpoints` section at the fixed point, read by the entry grammar
`orbit-propose-modifications` owns (the same parse and matching as `orbit-audit-drift`' `Touchpoints divergence
check`). A path's changed lines are its added plus its deleted lines; a binary path, whose lines git does not count,
is counted as past the per-file tolerance. SOURCE is every changed path that is neither the change's own nor exempt.

| member | covered by |
|---|---|
| a path under the change's own folder | excluded, as audit-drift's arithmetic already excludes it |
| a path a Touchpoints entry matches | predicted; no firing |
| a path in the exempt set (default `orbit/`, `test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`, `docs/`, `*.md`) | no firing |
| an unpredicted source file with more than the per-file tolerance changed (default 40 lines) | fires, naming the file and its lines |
| unpredicted source above the share tolerance of the change's source lines (default 20%) | fires, naming the files and the share |
| unpredicted source within both tolerances | no firing; the reading lists the files |
| a malformed Touchpoints entry | excluded from the arithmetic; the reading names the line beside any path it meant to predict |
| no Touchpoints section | "cannot read" (the residual of `A sensor compares against a reference fixed before the run`) |

A path is in the change's folder, predicted, exempt or unpredicted source; unpredicted source is past a tolerance or
within both; the section is present or absent, and its entries parse or do not. An exempt pattern holding no `/`
matches a path's last segment; one holding a `/` matches the whole path by the Touchpoints target forms (exact, directory
prefix, glob). The sensor also returns `cannot-read` when `design.md` is absent at the fixed point or git cannot
answer. Its key is `touchpoints:` followed by the firing paths, sorted and joined by commas (every unpredicted source
path when the share fires); a `cannot-read` key is `touchpoints:cannot-read:` followed by the reason.

#### Scenario: One large unpredicted file fires

- **WHEN** a change's committed work changes `src/a.ts` by 138 lines, its Touchpoints at the fixed point predict
  nothing under `src/a.ts`, and the defaults apply
- **THEN** the reading fires with key `touchpoints:src/a.ts`, its evidence naming `src/a.ts` and 138 lines

#### Scenario: Small ripple within both tolerances is quiet

- **WHEN** the only unpredicted source is `src/b.ts`, 4 changed lines of 200 source lines
- **THEN** the reading is `quiet`, its evidence listing `src/b.ts` as within both tolerances

#### Scenario: The share tolerance catches spread drift

- **WHEN** ten unpredicted source files change by 10 lines each, out of 300 source lines
- **THEN** the reading fires on the share (33%), its key naming all ten files

#### Scenario: Exempt paths never count

- **WHEN** the only unpredicted paths are `test/core/x.test.ts`, `docs/cli.md` and `src/util/x.spec.ts`
- **THEN** the reading is `quiet`

#### Scenario: A malformed entry is named beside the path

- **WHEN** a Touchpoints entry at line 12 is malformed, and `src/c.ts`, which it meant to predict, changes by 50 lines
- **THEN** the reading fires naming `src/c.ts` and the malformed line 12

### Requirement: The tripwires setting

orbit SHALL read a `tripwires` key in `orbit/config.yaml`: a map from a sensor id to that sensor's settings. For
`touchpoints`:

```yaml
tripwires:
  touchpoints:
    on_fire: record          # record (the default) | halt
    exempt: ['orbit/', 'test/', 'tests/', '__tests__/', '*.test.*', '*.spec.*', 'docs/', '*.md']
    per_file_lines: 40       # a positive integer
    share_percent: 20        # an integer from 0 to 100
```

Each field is optional and takes its default when absent. `exempt`, when given, replaces the default set. A field whose
value is of the wrong shape takes its default, and the reading's evidence notes it; an absent or unparseable config file
reads as every default. A key naming no sensor in orbit's sensor list is ignored. Every field but `on_fire` is read only
at the fixed point (`A sensor compares against a reference fixed before the run`); `on_fire` is read as `A halting
reading writes a tripwire stop` states. Absent, the key changes nothing the user sees (`At the defaults a reading is
shown nowhere but the brief`).

#### Scenario: A widened exempt set after apply begins escapes nothing

- **WHEN** the config at the fixed point has no `tripwires` key, and a later commit sets
  `tripwires.touchpoints.exempt: ['src/']`
- **THEN** the sensor still counts paths under `src/` as source

#### Scenario: A wrong-shaped value takes its default

- **WHEN** the config at the fixed point sets `per_file_lines: "forty"`
- **THEN** the sensor uses 40 and its evidence notes the value it could not use
