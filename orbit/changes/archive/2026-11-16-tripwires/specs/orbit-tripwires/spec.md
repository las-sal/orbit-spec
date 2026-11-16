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
| `deviations` | an array of KEYS, sorted, each a string naming ONE deviation and the same at every seam while that deviation stands; empty when `quiet` |
| `reference` | the commit the sensor read its reference at (`A sensor compares against a reference fixed before the run`), or `null` when it read none |
| `frozen` | `true` when `reference` is the change's fixed point; `false` before apply begins, when the plan as it stands is read |
| `evidence` | an object the sensor defines, naming what it found against what it compared |
| `stops` | present only when a `tripwire` stop covers one of the reading's keys: the covering stops' filenames (`A halting reading writes a tripwire stop`) |
| `answered_by` | present only when a resolution answers one of those stops: the resolutions' filenames |

One key per deviation lets a stop, and the user's answer to it, name exactly the deviations it asks about: a deviation
that appears later is a new key, asked about on its own.

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
- **THEN** its reading carries `sensor: "touchpoints"`, `outcome: "fired"`, one key per firing file in `deviations`,
  the fixed point's commit as `reference` with `frozen: true`, and `evidence` naming the files

#### Scenario: A quiet reading has no deviations

- **WHEN** the `touchpoints` sensor runs on a change whose committed work matches its plan
- **THEN** its reading carries `outcome: "quiet"` and `deviations: []`

### Requirement: A sensor compares against a reference fixed before the run

Every sensor SHALL fire on an undeclared deviation from a reference fixed before the run it watches: it measures
something now, compares it with that reference, and fires when they differ and the plan did not declare the difference.
Watching deviation rather than level keeps firings rare (G3), and fixing the reference keeps the run from moving it.

Two commits are read from the first-parent, non-merge history of `HEAD` (`git rev-list --first-parent --no-merges`),
so a merge commit never stands for either, and only from the change's BIRTH on: the first such commit adding
`orbit/changes/<name>/.openspec.yaml` after the latest one that moved that file into the archive
(`orbit/changes/archive/<date>-<name>/`), or the first ever when none did. So a name reused after an earlier change of
that name was archived never reaches into the earlier change's history, and deleting and restoring the file without
archiving starts no new change. When the file's latest addition or deletion in that history is an archive move, nothing
about the change of this name is committed yet:

- the change's FIRST COMMIT, the earliest commit from its birth touching `orbit/changes/<name>/`; the MEASURE runs from
  its parent (the empty tree when it has none) to `HEAD` over the change's OWN PATHS, those its first-parent, non-merge
  commits in that range changed, so work committed with the proposal, or before apply begins, is measured, and a path
  only a merge brought into the branch is not;
- the change's FIRST APPLY COMMIT, the earliest commit from its birth adding a file
  `orbit/changes/<name>/.orbit-runs/apply-*.json` (the apply emit, which marks apply as begun); its parent is the
  change's FIXED POINT.

A sensor reads its reference, and its settings (`The tripwires setting`), from the fixed point with git, never from the
working tree, so an edit the run makes to either after apply begins changes nothing the sensor compares, while an edit
made at a proposal-review walk, before apply, is part of the plan. The cases, tested in this order:

| the change's history | the reading |
|---|---|
| not a git repository, or a git command fails | `cannot-read`, reason `no-git` |
| no commit from the change's birth touches `orbit/changes/<name>/`, or the change of this name was last archived | `cannot-read`, reason `uncommitted`: nothing about the change is committed to measure |
| a first commit, and no first apply commit | measured, the reference and settings read at `HEAD` with `frozen: false`: the plan is not frozen until apply begins |
| a first apply commit | measured, the reference and settings read at the fixed point with `frozen: true` |

Each sensor states its measure, its reference and its declared escape in its own requirement.

A sensor that cannot read its reference returns `cannot-read`, and `cannot-read` is treated as `fired` wherever a
firing is acted on or shown (`Every seam emit carries the readings`, `A halting reading writes a tripwire stop`), so
silence is never a pass.

Named limit — sensors plug in (`A tripwire is a sensor that returns a reading`), so the set of sensors is open by design.

Named limit — a path both the change's own commits and a merge into its branch changed is measured over the whole
range, so the merge's lines in that path count as the change's.

Named limit — a sensor reads committed work only, so work not yet committed when a seam emit is written is not measured
there; work left uncommitted through the archive (with the `commit` setting off) is never measured, and the change's
readings say nothing of it.

Named limit — apply begins at the commit adding its first apply emit, so apply work committed before that commit is
measured but can still edit the plan read at the fixed point. orbit's apply flow writes the emit before the commit that
carries the chunk's work, so the two land together; a commit made by hand ahead of the first emit is the case left open.

Residual kind: a sensor whose reference cannot be read at its fixed point (no `## Touchpoints` section, a project sensor with no reading at propose, a baseline file missing)

Residual method: each sensor states how it reads its reference; a sensor that cannot read it returns a reading saying so, which is recorded like a firing — silence is never a pass

#### Scenario: An edit to the plan after apply begins moves nothing

- **WHEN** a change's first apply commit is `C`, and a later commit adds `src/x.ts` to `design.md`'s `## Touchpoints`
  and edits `src/x.ts`
- **THEN** the `touchpoints` reading compares against `design.md` as at `C`'s parent, so `src/x.ts` is unpredicted

#### Scenario: A proposal-review walk's edit is part of the plan

- **WHEN** after the propose commit, a walk commit adds `src/y.ts` to `## Touchpoints` and edits an architecture doc,
  and the first apply commit `C` then changes `src/y.ts` by 30 lines
- **THEN** the reference is `design.md` at `C`'s parent, which lists `src/y.ts`, so it is predicted

#### Scenario: Work committed with the proposal is measured

- **WHEN** the propose commit adds the change's artifacts and 100 unpredicted lines of `src/z.ts`, and no apply emit
  is committed yet
- **THEN** the `touchpoints` reading measures from the propose commit's parent, compares against `design.md` at `HEAD`
  with `frozen: false`, and fires on `src/z.ts`

#### Scenario: A reused change name reads only the new change

- **WHEN** a change `n` was proposed, applied and archived, and a new change `n` is then created and proposed
- **THEN** the new change's first commit, first apply commit and fixed point all come from commits after the one adding
  the new `orbit/changes/n/.openspec.yaml`

#### Scenario: A reused name not yet committed cannot be read

- **WHEN** a change `n` was archived by a commit moving its folder to `orbit/changes/archive/`, and a new `n` is written
  but not committed
- **THEN** the new change's `touchpoints` reading is `cannot-read` with reason `uncommitted`

#### Scenario: Restoring deleted metadata keeps the fixed point

- **WHEN** after the first apply commit, a commit deletes `orbit/changes/n/.openspec.yaml` and a later one restores it
  with a widened `## Touchpoints`
- **THEN** the change's birth, first apply commit and fixed point are unchanged, and the reference is the plan at the
  original fixed point

#### Scenario: A merge from the default branch is not measured

- **WHEN** after apply begins, the default branch, holding a new 300-line `src/mainwork.ts`, is merged into the change's
  branch
- **THEN** the `touchpoints` reading neither lists nor fires on `src/mainwork.ts`

#### Scenario: An uncommitted change cannot be read

- **WHEN** a seam emit is written for a change no commit touches yet
- **THEN** the `touchpoints` reading is `cannot-read` with reason `uncommitted`, never `quiet`

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
one job each`) to the change's `decisions/` folder when a seam emit's reading is `fired` or `cannot-read`, its sensor's
`on_fire` setting is `halt`, and one or more of its keys is covered by no `tripwire` stop there; the stop names exactly
those uncovered keys. The setting halts when it reads `halt` in the config at `HEAD` or, once the change has a fixed
point, in the config at the fixed point, so a run cannot turn a halt off and the user can turn one on mid-change. The
`archive` emit writes no stop: the archive has landed, so nothing is left to halt, and its readings are recorded only.

orbit composes the record, since no payload may raise `tripwire`: `command: "stop"`, the timestamp, `change`,
`model: null`, `condition: "tripwire"`, an `about` and a `question` written by orbit in plain language by the rule of
`orbit-decision-records`' `Decision records are written for a reader who knows only the architecture` (what the sensor
found, against what, and whether the work should go on as it is), a `detail` naming the reading's evidence, and a
`tripwire` object `{sensor, deviations, emit}` naming the sensor, the keys the stop asks about and the seam emit's
filename. The surface prints one line on standard error naming each stop it wrote. The chain's `open-stop` row
(`orbit-engine-gates`) reads it as any other open stop.

A key is COVERED by a stop when the LATEST record of that stop's replacement chain carries the key in its `tripwire`
object, and ANSWERED when the latest record of a resolution chain names that stop chain. This lookup is a reader of
`decisions/` that takes the latest record of every chain, as `orbit-decision-records`' `A record is fixed by a
replacement, never edited` requires of one. A reading names, in `stops`, each stop covering one of its keys, and, in
`answered_by`, each resolution answering one of those stops; a covered key is never asked again.

An orbit-written stop is never reworded by a replacement, since a payload may not carry `condition: "tripwire"`: a
reader's finding against its wording is a finding against this requirement's composition, which only orbit's code can
fix, and the walk records it `deferred` naming this requirement, as it records a gap in the reading step's brief.

#### Scenario: A halting firing writes one stop

- **WHEN** `tripwires: {touchpoints: {on_fire: halt}}` is set, and a review emit's `touchpoints` reading fires with keys
  `K1` and `K2`, which no stop covers
- **THEN** the change's `decisions/` folder gains one `stop-<TS>.json` with `condition: "tripwire"`, `model: null` and
  `tripwire.deviations: ["K1", "K2"]`, and the reading's `stops` names it

#### Scenario: Only a new deviation is asked about

- **WHEN** a stop covers `K1`, open or answered, and the next seam emit's reading fires with keys `K1` and `K3`
- **THEN** one stop is written naming `K3` alone, and the reading's `stops` names both stops (and, where answered,
  `answered_by` the resolution)

#### Scenario: A halt the run removed still halts

- **WHEN** `on_fire: halt` is set in the config at the fixed point, and the config at `HEAD` sets `on_fire: record`
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
| written later, sensor set to halt | fires; the `tripwire` stop names the reading's keys, the user's answer is its resolution, and later readings with those keys read as declared |
| written later, sensor record-only (the default) | the reading stays fired; the brief shows it beside the late declaration |

A declaration is in place at the fixed point or written after it; the setting is halt or not. "Declared" has one
source after the fixed point: the resolution names the stop, and the stop names the reading's keys. For the
`touchpoints` sensor the declaration is a `## Touchpoints` entry, and a firing path that only the CURRENT section (the
section in `design.md` at `HEAD`, read with git like the reference) predicts is marked in the evidence as declared late.

#### Scenario: A late Touchpoints entry does not quiet the sensor

- **WHEN** `src/x.ts` changes by 60 lines, is unpredicted at the fixed point, and a later commit adds it to
  `## Touchpoints`, with the sensor record-only
- **THEN** the reading stays `fired`, and its evidence marks `src/x.ts` as declared late

#### Scenario: The user's answer declares the key

- **WHEN** under `on_fire: halt` a stop covers key `K` and a resolution answers it
- **THEN** a later reading carrying `K` names that resolution in `answered_by`, and no new stop is written for `K`

### Requirement: At the defaults a reading is shown nowhere but the brief

With nothing configured, a reading SHALL change nothing the user sees or is asked (`automate-dev-flow`'s G0), by the
surface it could reach:

| member | covered by |
|---|---|
| the human readouts (`orbit status` bare, `--full`, `--boot`, `--report`; `orbit architecture status`) | unchanged: none renders a reading |
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
- **THEN** `orbit status --change <name>`, its `--json`, its `--boot` render, its `--report` render of that review
  and the change's gates are exactly what they would be without the reading

### Requirement: The Touchpoints sensor fires on unpredicted source past a tolerance

The `touchpoints` sensor SHALL compare the paths the change's committed work changed over its MEASURE (`A sensor
compares against a reference fixed before the run`), read by `git diff --numstat --no-renames -z`, with `design.md`'s
`## Touchpoints` section at its reference, read by the entry grammar `orbit-propose-modifications` owns (the same parse
and matching as `orbit-audit-drift`' `Touchpoints divergence check`). With renames off, a renamed file is a deletion of
its old path and an addition of its new one, each classified on its own. A path's changed lines are its added plus its
deleted lines. A binary path, whose lines git does not count, fires as past the per-file tolerance when it is
unpredicted source, and counts in neither side of the share. SOURCE is every changed path that is neither the change's
own nor exempt; the SHARE is the unpredicted source lines over all source lines, and never fires when there are no
source lines.

| member | covered by |
|---|---|
| a path under the change's own folder | excluded, as audit-drift's arithmetic already excludes it |
| a path a Touchpoints entry matches | predicted; no firing |
| a path in the exempt set (default `orbit/`, `test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`, `docs/`, `*.md`) | no firing |
| an unpredicted source file with more than the per-file tolerance changed (default 40 lines) | fires, naming the file and its lines |
| unpredicted source above the share tolerance of the change's source lines (default 20%) | fires, naming the files and the share |
| unpredicted source within both tolerances | no firing; the reading lists the files |
| a malformed Touchpoints entry | excluded from the arithmetic; the reading lists its line beside the firing paths, since a path it meant to predict cannot be known |
| no Touchpoints section | "cannot read" (the residual of `A sensor compares against a reference fixed before the run`) |

A path is in the change's folder, predicted, exempt or unpredicted source; unpredicted source is past a tolerance or
within both; the section is present or absent, and its entries parse or do not. An exempt pattern holding no `/`
matches a path's last segment; one holding a `/` matches the whole path by the Touchpoints target forms (exact, directory
prefix, glob). The sensor returns `cannot-read` with exactly one of four reasons: `no-git` and `uncommitted` (`A sensor
compares against a reference fixed before the run`), `no-design` when `design.md` is absent at its reference, and
`no-section` when it has no `## Touchpoints` section. Each firing path is one key, `touchpoints:` followed by the path
(every unpredicted source path when the share fires); a `cannot-read` reading's one key is `touchpoints:cannot-read:`
followed by its reason.

Its `evidence` carries `files` (each unpredicted source path with its `lines`, `binary` when git counted none, `over`
when it is past the per-file tolerance, and `declared_late` when only the current section predicts it), `share` (the
percentage, or `null` with no source lines), `share_fired`, `malformed` (each malformed entry's line and text),
`settings` (the four values used, `on_fire` as the halt decision reads it: `halt` when the config at the fixed
point or at `HEAD` says so) and `notes` (each setting value it could not use); a `cannot-read` reading's evidence
carries its `reason`.

#### Scenario: One large unpredicted file fires

- **WHEN** a change's committed work changes `src/a.ts` by 138 lines, its Touchpoints at the fixed point predict
  nothing under `src/a.ts`, and the defaults apply
- **THEN** the reading fires with `deviations: ["touchpoints:src/a.ts"]`, its evidence naming `src/a.ts` and 138 lines

#### Scenario: Small ripple within both tolerances is quiet

- **WHEN** the only unpredicted source is `src/b.ts`, 4 changed lines of 200 source lines
- **THEN** the reading is `quiet`, its evidence listing `src/b.ts` as within both tolerances

#### Scenario: The share tolerance catches spread drift

- **WHEN** ten unpredicted source files change by 10 lines each, out of 300 source lines
- **THEN** the reading fires on the share (33%), one key per file for all ten

#### Scenario: Exempt paths never count

- **WHEN** the only unpredicted paths are `test/core/x.test.ts`, `docs/cli.md` and `src/util/x.spec.ts`
- **THEN** the reading is `quiet`

#### Scenario: A malformed entry is listed with the firing paths

- **WHEN** a Touchpoints entry at line 12 is malformed, and `src/c.ts`, which it meant to predict, changes by 50 lines
- **THEN** the reading fires naming `src/c.ts`, and its evidence lists the malformed line 12

#### Scenario: A rename is a deletion and an addition

- **WHEN** `src/old.ts`, which `## Touchpoints` predicts, is renamed to `src/new.ts`, which it does not, with 80 lines
- **THEN** `src/old.ts` is predicted, and `src/new.ts` is unpredicted source with its 80 added lines, and fires

#### Scenario: A binary file fires alone and stays out of the share

- **WHEN** the unpredicted source is `src/a.ts` (10 lines) and `assets/logo.png` (binary), out of 40 text source lines
- **THEN** the reading fires on `assets/logo.png` as past the per-file tolerance, and the share is 25% of the text
  lines, firing too

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
where the sensor reads its reference: at the fixed point, or at `HEAD` before apply begins (`A sensor compares against
a reference fixed before the run`); `on_fire` is read as `A halting reading writes a tripwire stop` states. Absent, the
key changes nothing the user sees (`At the defaults a reading is shown nowhere but the brief`).

#### Scenario: A widened exempt set after apply begins escapes nothing

- **WHEN** the config at the fixed point has no `tripwires` key, and a later commit sets
  `tripwires.touchpoints.exempt: ['src/']`
- **THEN** the sensor still counts paths under `src/` as source

#### Scenario: A wrong-shaped value takes its default

- **WHEN** the config at the fixed point sets `per_file_lines: "forty"`
- **THEN** the sensor uses 40 and its evidence notes the value it could not use
