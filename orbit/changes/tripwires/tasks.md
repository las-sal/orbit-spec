## 1. The contract and the setting

- [ ] 1.1 `src/core/tripwires.ts`: the reading type (`sensor`, `outcome`, `key`, `reference`, `evidence`, optional
  `stop` and `answered_by`), the sensor list (one entry, `touchpoints`, ordered by id), and `fixedPoint(projectRoot,
  name)` per design M1, returning `null` before the first apply commit. Tests for `A reading carries the contract's
  fields`, `A quiet reading has no key` and `No apply commit yet is quiet`. Each test is tagged `// @scenario` to its
  scenario.
- [ ] 1.2 `resolveTripwiresSetting` in `src/core/project-config.ts` (design M9): reads the `tripwires` key on its own,
  from the working tree or from a config text taken at a commit. Fields:
  - `on_fire`, `exempt`, `per_file_lines`, `share_percent`;
  - a wrong-shaped field takes its default and adds a note;
  - an unknown sensor id is ignored.

  `ProjectConfigSchema` gains the documentation-only entry. Tests for `A wrong-shaped value takes its default` and the
  absent and unparseable cases.

## 2. The Touchpoints sensor

- [ ] 2.1 `src/core/tripwire-touchpoints.ts`:
  - reads `design.md` and `orbit/config.yaml` at the fixed point by `git show`;
  - measures `git diff --numstat <fp>..HEAD`;
  - classifies paths as own, predicted (`isPredicted`), exempt (design M7) or unpredicted source;
  - applies both tolerances, with a binary path counted past the per-file one (M8);
  - builds the key (M6) and evidence listing firing files, lines, the share, files within both tolerances, malformed
    lines, notes, and paths only the current section predicts (declared late).

  Tests, in a disposable git repository, for every scenario of `The Touchpoints sensor fires on unpredicted source past
  a tolerance`, plus:
  - `An edit to the plan after apply begins moves nothing`;
  - `A reference that cannot be read reads as cannot-read`;
  - `A late Touchpoints entry does not quiet the sensor`;
  - `A widened exempt set after apply begins escapes nothing`.
- [ ] 2.2 Show the oracle able to fail: for each tolerance, the exempt matcher and the fixed-point read, mutate the
  code once, run the sensor's tests, see them fail, and revert. Record each mutation and its failing test in the apply
  emit's assessment.

## 3. The emit surface

- [ ] 3.1 `src/core/emit-composition.ts`: compute `tripwires` on the four seam emits named by `Every seam emit
  carries the readings`, and on no other. Add it to `ENGINE_OWNED_EXTRA` for `apply`, `review`, `address-reviews` and
  `archive`, and add it to the engine-owned list in `test/core/emit-schema-parity.test.ts`. Tests for `A quiet run is
  recorded`, `Only the seam emits carry the field`, `The field is engine-owned` and `A firing at the defaults writes no
  stop`.
- [ ] 3.2 The halting stop (design M3, M4, M5):
  - `on_fire` is read from both configs;
  - one stop per key not already named by a `tripwire` stop's chain;
  - `answered_by` comes from a resolution naming that chain;
  - no stop at archive;
  - the stop's plain `about` and `question` are composed by the sensor, with `model: null` and the `tripwire`
    object;
  - stop names are chosen before the write gate, the stops are published exclusively after it, then the emit is
    written;
  - one stderr line per stop written.

  Tests for:
  - every scenario of `A halting reading writes a tripwire stop`;
  - `The user's answer declares the key`;
  - `A halting reading adds its stop`;
  - `A refused emit writes no stop`;
  - `Exactly one file`;
  - a check that `orbit emit resolution` accepts a `tripwire` stop, and that `orbit decisions brief` renders it.
- [ ] 3.3 Check that no reader trips on the new field or the orbit-written stop: run the trail readers, the report
  render, `orbit status` (bare, `--full`, `--boot`, `--json`), the gates and the chain over a fixture whose emits carry
  fired readings and an open `tripwire` stop under no chain. Test `A firing changes no readout`; it holds at the
  defaults, where no stop is written.
- [ ] 3.4 Move `src/core/emit-composition.ts`'s pin in `test/core/rc03b-untouched-modules.test.ts`, with a dated note
  naming this change, after the module's last edit.

## 4. The brief

- [ ] 4.1 `src/core/program-brief.ts` (design M10):
  - `tripwires` becomes the readings view: fired keys once, each with its sensor, latest evidence, first seam emit,
    declared-late paths, and its stop with answer or open; then each sensor's latest outcome;
  - a change with no emit carrying the field renders the "not installed when it ran" line;
  - the program brief's closing section says readings are shown under each change.

  Regenerate `test/fixtures/brief-golden/` and check the diff touches only the Tripwires text. Tests for `Tripwires are
  never reported as quiet`, `A fired reading is listed once with its stop` and `A change brief carries every section`.

## 5. Docs

- [ ] 5.1 `docs/customization.md`:
  - "nine more optional keys" becomes ten;
  - a `tripwires` row saying what the Touchpoints sensor watches, that readings are recorded and shown only in the
    brief, and that `on_fire: halt` writes a stop a granted chain stops on;
  - the example gains the key;
  - `orbit-tripwires` joins the section's `Carried by:` line.

  `docs/cli.md`'s `orbit brief` paragraph replaces "a line saying tripwires are not installed" with the readings. Run
  the user-docs tests.

## 6. Close

- [ ] 6.1 Run the built sensor over the 14 latest merged changes, as D-tw-17's measurement did, and compare with its
  1 of 14 (change-account). Record any difference in the apply emit's assessment, and name its cause.
- [ ] 6.2 `npm run build`, then the full `npm test`, then `node bin/orbit.js validate tripwires --strict`, which
  reports no undeclared scenario. Run `node bin/orbit.js update --force`, then `git status`, to confirm no generated
  body changed.
