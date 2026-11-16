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

**M1 — The fixed point is the parent of the first apply commit.**
- The first apply commit is the earliest commit after the change's first commit (`firstCommitTouching`) that changes a
  path outside the change's own paths: `orbit/changes/<name>/`, `orbit/explore/<name>/` and its archive folder. The
  staging folder is included because its deletion can land in a commit of its own.
- D-tw-3 said "as of the first apply commit". The parent is read instead, because an apply commit that edits
  `## Touchpoints` alongside the code would otherwise move the reference in the very commit it watches.
- Read with `git rev-list --reverse <first>..HEAD` and `git diff-tree --name-only` per commit until one qualifies.
  Before one exists, the reading is `quiet` with `reference: null`.

**M2 — Sensors read committed state only.**
- Both the reference and the measure come from git (`git show <fp>:<path>`, `git diff --numstat <fp>..HEAD`), never
  from the working tree. That way the run cannot edit what watches it without leaving a commit.
- An apply emit written before its chunk's commit therefore sees the previous chunk's state. The firing surfaces at the
  next seam (see Risks).

**M3 — `on_fire` halts when either config says halt.**
- Every other sensor setting is read at the fixed point (D-tw-3's COHERE: widening mid-run escapes nothing).
- `on_fire` is read from both the current config and the config at the fixed point, and halts if either says `halt`.
  A run cannot turn a halt off, and the user can turn one on mid-change.
- This refines D-tw-6, which did not say where the halt setting is read.

**M4 — The stop orbit writes.**
- Fields: `condition: "tripwire"`, `model: null`, plain `about` and `question` composed per sensor, `detail` with the
  evidence, and a `tripwire: {sensor, key, emit}` object.
- The existing readers ignore keys they do not know (`readDecisionFolder`, `buildDecisionBrief`, the brief).
  `orbit emit resolution` answers it as any stop, since `readNamedStop` checks only the command and the work.
- One stop per key: a key a stop already names is never asked again, which is D-tw-14's "read as declared".
- The archive emit writes no stop, because the archive has landed.

**M5 — Write order: gate, then stops, then the emit.**
- Readings are computed before the write gate. The stop filenames are chosen (collision-bumped against the
  `decisions/` folder) and put in the readings. The emit then passes its full write gate, the stops are written
  without overwriting (the decision records' exclusive publish), and only then is the emit written.
- A refused emit therefore writes no stop. A crash between the stops and the emit leaves a stop the next seam's
  reading finds by key (see Risks).

**M6 — Keys.**
- A fired key is `touchpoints:` plus the firing paths, sorted and comma-joined (every unpredicted source path when the
  share fires).
- A `cannot-read` key is `touchpoints:cannot-read:<reason>`, the reason being one of `no-design`, `no-section` or
  `no-git`.
- A new path joining the firing set makes a new key, so it is a new question. The same set at a later seam is the same
  key.

**M7 — Exempt patterns.**
- A pattern holding no `/` matches a path's last segment. A pattern holding one matches the whole path by the
  Touchpoints target forms (`targetMatches`).
- Needed because the exploration's default `*.test.*` is a single-segment glob, which `targetMatches` anchors at the
  whole path, so it would never match `src/x.test.ts`.

**M8 — A binary path counts as past the per-file tolerance.** `git diff --numstat` prints `-` for it. Silence is never
a pass (D-tw-3), and binary files under `docs/` are exempt anyway.

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
  - any path marked declared late;
  - its stop, with that stop's answer or marked open.
- Then each sensor's latest outcome follows. A change none of whose emits carries the field says tripwires were not
  installed when it ran.
- The program brief's own closing `## Tripwires` line says the readings are shown under each change; architecture
  sessions have no seam emits.

**M11 — Three capabilities, not D-tw-19's two.**
- `orbit-emit-composition`'s `Output contract and read-only guarantee beyond the emit` says the surface writes exactly
  one file, which a halting stop makes false, so it is modified.
- Two neighbours were read and left alone, because neither is made false:
  - `The write gate checks decision records` says "the run-summary commands change only as `The reading's selection is
    recorded at review and archive` states". It is read as scoped to the decision records' addition.
  - `Deterministic facts are engine-composed per command` admits fields "where a capability defines an emit field".
- Three is at the ceiling, not over it.

**M12 — No schema reference text.**
- The run-summary schema references (`references/*schema*.md`) are not edited. Two reasons:
  - The readings are a record that no AI writes or reads at the defaults (D-tw-5, R-adf-12).
  - Editing them moves the generated-skill parity pins.
- The engine-owned refusal is held by `ENGINE_OWNED_EXTRA` and the parity test's engine-owned list.

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
- **`pr: never` on a busy default branch** → `<fp>..HEAD` includes others' commits on the same branch. orbit is
  single-user (a named limit). Under `pr: per-proposal` the branch holds only the change.
- **The pinned module moves** → `src/core/emit-composition.ts`'s hash in `rc03b-untouched-modules.test.ts` is updated
  with a dated note, as earlier stages did.

## Migration Plan

Nothing to migrate:
- Emits written before this change carry no `tripwires` field, and the brief reads that as "not installed when it
  ran".
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

## Open Questions

None.
