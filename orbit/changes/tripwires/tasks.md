## 1. The contract and the setting

- [x] 1.1 `src/core/tripwires.ts`:
  - the reading type: `sensor`, `outcome`, `deviations`, `reference`, `frozen`, `evidence`, and the optional `stops`
    and `answered_by` lists;
  - the sensor list: one entry, `touchpoints`, ordered by id;
  - `changeCommits(projectRoot, name)` per design M1, reading first-parent history from the change's birth. It returns
    one of four distinct results, never a bare `null`: `no-git`, `uncommitted`, `not-begun` (with the first commit), or
    `frozen` (with the first commit and the fixed point).

  Tests, in a disposable git repository, for each of the four results, a git failure, a merge into the branch that
  never qualifies, and a reused name (`A reused change name reads only the new change`). The contract is tested with a stub sensor; the scenarios that run the real sensor are task 2.1's.
  Each test is tagged `// @scenario` to its scenario.
- [x] 1.2 `resolveTripwiresSetting` in `src/core/project-config.ts` (design M9): reads the `tripwires` key on its own,
  from the working tree or from a config text taken at a commit. Fields:
  - `on_fire`, `exempt`, `per_file_lines`, `share_percent`;
  - a wrong-shaped field takes its default and adds a note;
  - an unknown sensor id is ignored.

  `ProjectConfigSchema` gains the documentation-only entry. Tests for `A wrong-shaped value takes its default` and the
  absent and unparseable cases.

## 2. The Touchpoints sensor

- [x] 2.1 `src/core/tripwire-touchpoints.ts`:
  - reads `design.md` and `orbit/config.yaml` by `git show` at the sensor's reference: the fixed point, or `HEAD` before
    apply begins;
  - classifies paths as own, predicted (`isPredicted`), exempt (design M7) or unpredicted source;
  - measures with `git diff --numstat --no-renames -z` from the first commit's parent (M1, M8);
  - applies both tolerances; a binary path fires on the per-file check and stays out of the share (M8);
  - builds one key per deviation (M6), and the evidence fields the requirement names (`files`, `share`,
    `share_fired`, `malformed`, `settings`, `notes`, or `reason`).

  Tests, in a disposable git repository, for every scenario of `The Touchpoints sensor fires on unpredicted source past
  a tolerance` (the rename and binary scenarios among them), plus:
  - `A reading carries the contract's fields` and `A quiet reading has no deviations`;
  - every scenario of `A sensor compares against a reference fixed before the run`;
  - `A late Touchpoints entry does not quiet the sensor`;
  - `A widened exempt set after apply begins escapes nothing`.
- [x] 2.2 Show the oracle able to fail: for each tolerance, the exempt matcher and the fixed-point read, mutate the
  code once, run the sensor's tests, see them fail, and revert. Record each mutation and its failing test in the apply
  emit's assessment.

## 3. The emit surface

- [x] 3.1 `src/core/emit-composition.ts`: compute `tripwires` on the four seam emits named by `Every seam emit
  carries the readings`, and on no other. Add it to `ENGINE_OWNED_EXTRA` for `apply`, `review`, `address-reviews` and
  `archive`, and to `ENGINE_OWNED_PER_COMMAND` in `test/helpers/schema-references.ts`, which
  `test/core/emit-schema-parity.test.ts` reads. Tests for `A quiet run is recorded`, `Only the seam emits carry the
  field`, `The field is engine-owned` and `A firing at the defaults writes no stop`.
- [x] 3.2 The halting stop (design M3, M4, M5):
  - `on_fire` is read at `HEAD` and, once a fixed point exists, at the fixed point;
  - one stop per halting reading, naming only the keys no `tripwire` stop covers (M4, M6). Coverage reads the latest
    record of each stop chain, and `answered_by` the latest of each resolution chain;
  - no stop at archive;
  - the stop's plain `about` and `question` are composed by the sensor, with `model: null` and the `tripwire`
    object;
  - stop names are chosen before the write gate, the stops are published exclusively after it, then the emit is
    written;
  - one stderr line per stop written.

  Tests for:
  - every scenario of `A halting reading writes a tripwire stop`;
  - `The user's answer declares the key`;
  - `Only a new deviation is asked about`;
  - `A halting reading adds its stop`;
  - `A refused emit writes no stop`;
  - `Exactly one file`;
  - a check that `orbit emit resolution` accepts a `tripwire` stop, and that `orbit decisions brief` renders it.
- [x] 3.3 Check that no reader trips on the new field or the orbit-written stop: run the trail readers, the report
  render, `orbit status` (bare, `--full`, `--boot`, `--json`), the gates and the chain over a fixture whose emits carry
  fired readings and an open `tripwire` stop under no chain. Test `A firing changes no readout`; it holds at the
  defaults, where no stop is written.
- [x] 3.4 Move `src/core/emit-composition.ts`'s pin in `test/core/rc03b-untouched-modules.test.ts`, with a dated note
  naming this change, after the module's last edit.

- [x] 3.5 `orbit-conventions`' `Internal-run JSON summary format` (design M11, found at apply): a MODIFIED delta adding
  `tripwires` to its three canonical example emits, the review example's reading the `cannot-read: no-git` one the
  test's disposable project produces; stamp its base fingerprint (`orbit fingerprint tripwires`), declare the
  capabilities breach in the proposal's `## Size`, and run `test/core/canonical-examples.test.ts`.

## 4. The brief

- [x] 4.1 `src/core/program-brief.ts` (design M10):
  - `tripwires` becomes the readings view: fired keys once, each with its sensor, latest evidence, first seam emit,
    declared-late paths, and its stop with answer or open; then each sensor's latest outcome;
  - a change with no emit carrying the field renders the "not installed when it ran" line;
  - the program brief's closing section says readings are shown under each change.

  Regenerate `test/fixtures/brief-golden/` and check the diff touches only the Tripwires text. Tests for `Tripwires are
  never reported as quiet`, `A fired reading is listed once with its stop`, `A program brief points at each change's
  readings` and `A change brief carries every section`.

## 5. Docs

- [x] 5.1 `docs/customization.md`:
  - "nine more optional keys" becomes ten;
  - a `tripwires` row saying what the Touchpoints sensor watches, that readings are recorded and shown only in the
    brief, and that `on_fire: halt` writes a stop a granted chain stops on;
  - the example gains the key.

  The section's `Carried by:` line gains `orbit-tripwires` only after the sync (design `## At archive`): the
  carried-by check resolves a name only against a baseline spec.

  `docs/cli.md`'s `orbit brief` paragraph replaces "a line saying tripwires are not installed" with the readings. Run
  the user-docs tests.

## 6. Close

- [x] 6.1 Run the built sensor over the 14 latest merged changes, as D-tw-17's measurement did, and compare with its
  1 of 14 (change-account). Measure each change in a worktree at its own archive commit, so `HEAD` is where that change
  ended and no later change is counted. The archive sync's spec edits fall under the exempt `orbit/`.
  - D-tw-17 read the archived `design.md`, but the sensor reads it at the fixed point. So a difference is expected
    wherever a walk edited `## Touchpoints` after apply began.
  - Record each difference in the apply emit's assessment, with its cause.
- [x] 6.2 `npm run build`, then the full `npm test`, then `node bin/orbit.js validate tripwires --strict`, which
  reports no undeclared scenario. Run `node bin/orbit.js update --force`, then `git status`, to confirm no generated
  body changed.
