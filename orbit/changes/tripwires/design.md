## Context

The first of stage `tripwires`' four changes (see `explore.md`, D-tw-19). Earlier stages left places for it:
- `tripwire` in `STOP_CONDITIONS`, refused from a payload by `PAYLOAD_STOP_CONDITIONS` (`src/core/decision-records.ts`);
- the brief's `tripwires: 'not-installed'` and its line "Tripwires are not installed yet…" (`src/core/program-brief.ts`);
- the chain's `open-stop` row (`src/core/chain.ts`), which already halts a granted chain on any open stop in the
  change's `decisions/` folder.

The Touchpoints arithmetic this sensor builds on already exists:
- `parseTouchpoints`, `isPredicted` and `targetMatches` in `src/core/parsers/touchpoints.ts`;
- the boot render's committed-only `actual_unpredicted` (`src/core/boot-render.ts`);
- `firstCommitTouching` in `src/core/parsers/apply-state.ts`.

The emit surface already computes engine-owned fields per command:
- `ENGINE_OWNED_EXTRA` and the `switch (command)` in `composeAndWriteEmit` (`src/core/emit-composition.ts`);
- that file is hash-pinned by `test/core/rc03b-untouched-modules.test.ts`.

## Goals / Non-Goals

**Goals:**
- One sensor contract (`orbit-tripwires`' `A tripwire is a sensor that returns a reading`), one sensor list, and one
  reading shape, so the stage's later changes add sensors without touching the emit surface again.
- The Touchpoints sensor, measured on the record at 1 firing in 14 changes (D-tw-17).
- Readings on every seam emit at the defaults, so first-run's G6 can count firings in supervised stretches (D-tw-5).
- A halt setting per sensor that writes the `tripwire` stop and lets a granted chain halt on it.
- The brief's Tripwires section shows the readings.

**Non-Goals:**
- The other sensors: circling, budget, capability, ruling and size (`tripwire-sensors`); the steward
  (`tripwire-steward`); project sensors (`tripwire-project-sensors`).
- Any generated workflow body or skill reference text. Nothing in a body asks the user a tripwire question, even under
  halt (see Risks).
- Shrinking the skills (D-tw-2: its own architect work).

## Decisions

The rules are the exploration's (D-tw-1, D-tw-3, D-tw-5, D-tw-6, D-tw-14, D-tw-17, see `explore.md`). The decisions
below are the method settled at propose.

**M1 — Two commits: where the plan is read, and where the measure starts** (the walk's ratified option B; it replaces
the propose-time rule, which used one commit for both).
- Both searches start at the change's BIRTH, the latest first-parent commit adding `orbit/changes/<name>/.openspec.yaml`.
  `orbit new change` refuses only an active change of the same name, so a name can be reused after archive, and an
  unbounded search would reach the earlier change's commits.
- The FIRST APPLY COMMIT is the earliest commit adding `orbit/changes/<name>/.orbit-runs/apply-*.json`: the apply
  emit, which is what marks apply as begun. Its parent is the FIXED POINT, where the plan (`## Touchpoints`) and the
  settings are read.
- The MEASURE runs from the parent of the change's FIRST COMMIT (the earliest touching `orbit/changes/<name>/`) to
  `HEAD`, so code committed with the proposal, or before the first apply emit, is measured.
- Before the first apply commit, the plan and settings are read at `HEAD` with `frozen: false`: the plan is still
  revisable, so nothing is silenced.
- Both commits come from `git rev-list --first-parent`, so a merge of the default branch into the change's branch never
  stands for the change's work.
- Why the rule changed: the propose-time rule took the first commit touching a path outside the change's folders. Over
  the 14 latest archived changes it picked a proposal-review walk three times (read-obligation 3efc8abb,
  decision-writing a0a0436a, chained-review-commit dd707609). Two of those walks added Touchpoints entries the old rule
  would have read as unpredicted. It also never measured code committed with the proposal.
- D-tw-3 said "as of the first apply commit". The parent is read instead, because an apply commit that edits
  `## Touchpoints` alongside the code would otherwise move the reference in the very commit it watches.
- The cases are ordered in the spec:
  - no git → `cannot-read: no-git`;
  - nothing committed → `cannot-read: uncommitted`;
  - no apply emit committed → measured with `frozen: false`;
  - otherwise → frozen.

  `changeCommits` returns a result distinguishing these, never a bare `null`. `firstCommitTouching` returns `null` both
  outside git and with nothing committed, so it is not reused as is.

**M2 — Sensors read committed state only.**
- Both the reference and the measure come from git (`git show <fp>:<path>`,
  `git diff --numstat --no-renames -z <first>^..HEAD`), never from the working tree. That way the run cannot edit what
  watches it without leaving a commit.
- An apply emit written before its chunk's commit therefore sees the previous chunk's state. The firing surfaces at the
  next seam (see Risks).

**M3 — `on_fire` halts when either config says halt.**
- Every other sensor setting is read where the reference is read: at the fixed point, or at `HEAD` before apply begins
  (D-tw-3's COHERE: widening mid-run escapes nothing).
- `on_fire` is read from the config at `HEAD` and, once a fixed point exists, at the fixed point; it halts if either says
  `halt`.
  A run cannot turn a halt off, and the user can turn one on mid-change.
- This refines D-tw-6, which did not say where the halt setting is read.

**M4 — The stop orbit writes.**
- Fields: `condition: "tripwire"`, `model: null`, plain `about` and `question` composed per sensor, `detail` with the
  evidence, and a `tripwire: {sensor, deviations, emit}` object naming the keys the stop asks about.
- The existing readers ignore keys they do not know (`readDecisionFolder`, `buildDecisionBrief`, the brief).
  `orbit emit resolution` answers it as any stop, since `readNamedStop` checks only the command and the work.
- A stop is written only for keys no earlier `tripwire` stop covers. A covered key is never asked again, which is
  D-tw-14's "read as declared" (M6).
- **The coverage lookup is a new reader of `decisions/`.** `orbit-decision-records`' `A record is fixed by a
  replacement, never edited` asks each stage that adds one to check it against its chain table. Checked: it takes the
  latest record of each stop chain for the keys, and the latest of each resolution chain for the answer. The
  at-most-one-resolution rule is the write gate's, unchanged. It never cites a replaced record as current.
- **An orbit-written stop cannot be reworded.** A replacement would have to carry `condition: "tripwire"`, which the
  payload gate refuses. So a reading-step finding on its wording is recorded `deferred`, naming `A halting reading
  writes a tripwire stop` (orbit's composition), as a gap in the brief is.
- The archive emit writes no stop, because the archive has landed.

**M5 — Write order: gate, then stops, then the emit.**
- Readings are computed before the write gate. The stop filenames are chosen (collision-bumped against the
  `decisions/` folder) and put in the readings. The emit then passes its full write gate, the stops are written
  without overwriting (the decision records' exclusive publish), and only then is the emit written.
- A refused emit therefore writes no stop. A crash between the stops and the emit leaves a stop the next seam's
  reading finds by key (see Risks).

**M6 — One key per deviation** (the walk's ratified option A; it replaces comma-joined set keys).
- A reading carries `deviations`, a sorted array of keys:
  - `touchpoints:<path>` for each firing path (every unpredicted source path when the share fires);
  - `touchpoints:cannot-read:<reason>`, the reason being one of `no-git`, `uncommitted`, `no-design` or `no-section`.
- An array of whole paths cannot collide, unlike a comma-joined string: a path may contain a comma.
- A halting reading's stop names only its keys that no earlier stop covers. Answering a stop declares exactly the
  deviations it asked about, and a new path is asked about on its own. Set keys would have re-asked about every path
  already answered (D-tw-14).
- The reading's `stops` and `answered_by` are lists, since one reading can be covered by several stops.
- This refines D-tw-1's "a key naming the deviation" without changing what it promises: a stop and its resolution
  still name exactly what they answer.

**M7 — Exempt patterns.**
- A pattern holding no `/` matches a path's last segment. A pattern holding one matches the whole path by the
  Touchpoints target forms (`targetMatches`).
- Needed because the exploration's default `*.test.*` is a single-segment glob, which `targetMatches` anchors at the
  whole path, so it would never match `src/x.test.ts`.

**M8 — Renames and binary paths.**
- `--no-renames` makes a rename a deletion plus an addition, each classified on its own. A default rename would print
  `src/{a => b}.ts`, which no Touchpoints target matches, and could hide an unpredicted destination behind zero changed
  lines.
- `-z` keeps unusual paths unquoted.
- A binary path (numstat prints `-`) fires on the per-file check when it is unpredicted source, because silence is
  never a pass (D-tw-3). It counts in neither side of the share: the share is a line ratio, and an invented line count
  would distort it.
- No source lines means no share firing. Binary files under `docs/` are exempt anyway.

**M9 — The setting.**
- `tripwires.<sensor>.{on_fire, exempt, per_file_lines, share_percent}`, resolved by `resolveTripwiresSetting` in
  `src/core/project-config.ts`, after the `resolveSignoffSetting` pattern: it reads the key on its own, and inert
  values fall back to the default with a note.
- `ProjectConfigSchema` gains a documentation-only entry, as `signoff` has.
- The fixed-point copy is parsed from `git show <fp>:orbit/config.yaml` with the same resolver body.

**M10 — The brief.**
- A change brief's Tripwires section lists each fired or cannot-read key once. Each key carries:
  - its sensor;
  - the latest evidence for it;
  - the first seam emit that carried it;
  - whether it is marked declared late;
  - the stop covering it, with that stop's answer or marked open.
- Then each sensor's latest outcome follows. A change none of whose emits carries the field says tripwires were not
  installed when it ran.
- The program brief's own closing `## Tripwires` line says the readings are shown under each change; architecture
  sessions have no seam emits.

**M11 — Four capabilities, not D-tw-19's two.**
- `orbit-emit-composition` is modified twice:
  - `Output contract and read-only guarantee beyond the emit` says the surface writes exactly one file, which a halting
    stop makes false;
  - `The write gate checks decision records` says the run-summary commands change "only as" the reading's selection
    states, which the new `tripwires` field makes false. That sentence is qualified to the decision records' own
    addition, with the new field and the orbit-written stop named as `orbit-tripwires`' own.

  The propose-time reading that the sentence was scoped was wrong: as written it denies the new field.
- `Deterministic facts are engine-composed per command` was read and left alone, because it admits fields "where a
  capability defines an emit field".
- `orbit-conventions`' `Internal-run JSON summary format` is modified too, found at apply (task 3.1): its three
  canonical example emits (apply, review, archive) must carry the new `tripwires` field, because the requirement's own
  test executes each example through the write gate and holds its keys equal to the written emit's. The review
  example's values are compared too, so it shows the `cannot-read: no-git` reading of the disposable project the test
  runs it in. The propose-time count missed this reader of the emit shape.
- Four capabilities and 12 requirements: the capabilities ceiling of 3 is breached, declared in the proposal's
  `## Size`; requirements are at their ceiling of 12.

**M12 — No schema reference text.**
- The run-summary schema references (`references/*schema*.md`) are not edited. Two reasons:
  - The readings are a record that no AI writes or reads at the defaults (D-tw-5, R-adf-12).
  - Editing them moves the generated-skill parity pins.
- The engine-owned refusal is held by `ENGINE_OWNED_EXTRA` and the parity test's engine-owned list,
  `ENGINE_OWNED_PER_COMMAND` in `test/helpers/schema-references.ts`.

## Touchpoints

- `src/core/tripwires.ts` — the contract, sensor list, fixed point, readings and stop composition.
- `src/core/tripwire-touchpoints.ts` — the Touchpoints sensor.
- `src/core/emit-composition.ts` — the computed field on the four seam emits, its refusal, the stop writes.
- `src/core/project-config.ts` — `resolveTripwiresSetting` and the schema entry.
- `src/core/program-brief.ts` — the Tripwires section.
- `src/core/parsers/apply-state.ts` — a shared git helper, if the sensor needs one exported.
- `test/core/` — the new tests, the pin move, the brief and emit tests.
- `test/fixtures/brief-golden/` — the golden briefs.
- `docs/customization.md` + `docs/cli.md` — the key and the brief's text.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-tw-1 | BOUNDED | live rule | `A tripwire is a sensor that returns a reading` — table; residual verbatim |
| D-tw-3 | BOUNDED | live rule | `A sensor compares against a reference fixed before the run` — sentence naming the source (the sensors are each sensor's own requirement); residual verbatim |
| D-tw-4 | — | superseded (D-tw-17) | not carried |
| D-tw-5 | SOURCED | live rule | `At the defaults a reading is shown nowhere but the brief` — table |
| D-tw-6 | DERIVED | live rule | `Every seam emit carries the readings` — table; the halt row's stop in `A halting reading writes a tripwire stop` |
| D-tw-7 | — | superseded (D-tsn-1) | not carried |
| D-tw-8 | — | superseded (D-tst-1) | not carried |
| D-tw-9 | — | superseded (D-tst-2) | not carried |
| D-tw-10 | — | superseded (D-tst-3) | not carried |
| D-tw-11 | — | superseded (D-tps-1) | not carried |
| D-tw-12 | — | superseded (D-tps-2) | not carried |
| D-tw-13 | — | superseded (D-tsn-2) | not carried |
| D-tw-14 | DERIVED | live rule | `A declaration after the fixed point counts only as the user's answer` — table |
| D-tw-15 | — | superseded (D-tsn-3) | not carried |
| D-tw-16 | — | superseded (D-tsn-4) | not carried |
| D-tw-17 | DERIVED | live rule | `The Touchpoints sensor fires on unpredicted source past a tolerance` — table |

## Risks / Trade-offs

- **D-tw-1 (BOUNDED)** → the named limit and its residual are stated in `A tripwire is a sensor that returns a
  reading`.
- **D-tw-3 (BOUNDED)** → the named limit and its residual are stated in `A sensor compares against a reference fixed
  before the run`.
- **A reading lags one seam when the work is uncommitted (M2)** → the apply emit is written before the commit step, so
  a chunk's own firing first shows at the next seam (the review, or the next chunk's apply). The system review reads
  committed work, so the last seam before archive sees everything.
- **Halt with no chain asks nothing** → under `on_fire: halt` the stop is written, and the reading names it. The emit
  prints one stderr line naming it. Only a granted chain stops on it (`open-stop`), which prints its question. A
  supervised session ends at its eligibility line as today, so the user meets the open stop in the brief or at the
  chain's next stop. The driver stage (R-adf-6) is where a halt is acted on unattended.
- **A crash between the stop and the emit (M5)** → the stop exists with no emit naming it. The next seam's reading
  finds it by key and names it, so it is never asked twice and never lost.
- **Drift within both tolerances passes (D-tw-17's named limit)** → many small edits to unpredicted source beneath the
  share tolerance are not seen. First-run's closing review reads the readings' "within" lists.
- **`pr: never` on a busy default branch** → the measure from the change's first commit to `HEAD` includes others'
  commits on the same branch. orbit is single-user (a named limit). Under `pr: per-proposal` the branch holds only the
  change.
- **Apply work committed before the first apply emit (M1)** → it is measured, but its commit can still edit the plan
  the fixed point reads. In orbit's flow the emit is written before the commit that carries the chunk, so they land
  together; a commit made by hand ahead of the first emit is the open case, stated as a named limit in `A sensor
  compares against a reference fixed before the run`. A second anchor (the first commit touching non-exempt source)
  would close it, but would bring back the path-based start the walk replaced.
- **An uncommitted change reads `cannot-read` (M1)** → under `pr: never`, a change whose files are not yet committed
  records `cannot-read: uncommitted` at every seam until its first commit. At the defaults that is a record only. Under
  `on_fire: halt` it is one stop, covering that key once. The alternative, reading it as quiet, would report silence as
  a pass.
- **The pinned module moves** → `src/core/emit-composition.ts`'s hash in `rc03b-untouched-modules.test.ts` is updated
  with a dated note, as earlier stages did.

## Migration Plan

No data migrates, but rendered text changes:
- Emits written before this change carry no `tripwires` field, and the brief reads that as "not installed when it
  ran".
- **Every brief's Tripwires text changes.** That includes the briefs of changes archived before this one: the old line
  "Tripwires are not installed yet…" becomes "not installed when it ran", and the program brief's closing line changes.
  So a finished program's next `orbit brief <doc> --save` writes a new copy that differs from any copy already signed,
  and under `signoff: program` the hold's `re-sign` row asks again. Change briefs already saved stay as saved.
- The setting is absent everywhere until a user adds it.
- Rollback is a revert. Emits written in between keep a field no reader requires.

## Alternatives considered

From the exploration's Considered & out (see `explore.md`), the ones bearing on this change:
- **Touchpoints with the exempt set alone (D-tw-4 as chosen):** it fired on 8 of the 14 latest changes, almost all on
  small ripple.
- **Touchpoints firing only outside every predicted directory:** coarser than the entries already written.
- **Touchpoints firing on anything unpredicted, graded by first-run's G3:** routine test and doc files would make most
  firings unwarranted.
- **A one-line tripwire report at the defaults:** needs a named G0 exception.
- **Computing sensors only under a setting:** first-run's G6 could not count firings in supervised stretches.
- **Writing the `tripwire` stop at the defaults:** it reaches the default-on reader and halts any granted chain.
- **A separate `orbit tripwires` command, or computing readings in `status`:** a command can be skipped, and a read
  must not write.

At propose (method):
- **Reading the reference at the first apply commit itself:** it moves with a commit that edits both (M1).
- **Reading the working tree:** the run could edit what watches it without leaving a commit (M2).
- **Reading `on_fire` only at the fixed point:** the user could not add a halt mid-change (M3).

At the proposal walk (method, ratified by the user):
- **The fixed point at the parent of the first apply emit's commit, measured from there (walk option A for F1):** code
  committed with the proposal, or before the first apply emit, would never be measured.
- **Keeping the first-path-outside-the-change rule, minus `orbit/` and the exempt set (option C):** a docs-first apply,
  or a fix landed mid-review, would still set it early.
- **One key per reading, JSON-encoded (option B for F9):** unambiguous, but answering a stop would still not declare
  its paths once a new one joined; the repeat question would stand as a named limit.

## At archive

`orbit-tripwires` is a new capability, so three edits wait for the sync, as brief-render's did:
- Its `## Purpose` is written in place. `orbit-program-brief`'s Purpose, which says "the tripwires line", is edited in
  place to say the tripwires section and its readings. No delta carries `## Purpose`.
- `docs/customization.md`'s config-keys section names `orbit-tripwires` on its `Carried by:` line. The carried-by check
  resolves an item only against a baseline spec, so task 5.1 adds the rest of that section at apply and this one name
  after the sync.
- CLAUDE.md's marked capability figure moves from 33 to 34 (its `src:capabilities` marker). After the sync,
  `node bin/orbit.js validate --sources` checks it.

## Open Questions

None.
