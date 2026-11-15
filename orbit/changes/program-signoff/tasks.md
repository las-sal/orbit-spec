## 1. The `program` value and the reader

- [ ] 1.1 `resolveSignoffSetting` reads `program` (the schema's documentation too); one helper decides whether the
  account is taken (`change` or `program`), used by `selectUnreadRecords` and the program brief's unread section; the
  change brief's unread-account line and `src/core/account.ts`'s header say "when the user signs off". Tests, each
  tagged to its scenario: the reader under `program` and under `weekly` (`orbit-decision-records`), the unread account
  listed under `program` (`orbit-program-brief`), counted at archive (`orbit-emit-composition`), and the reading step's
  `No records, no reading` (`orbit-review`).
- [ ] 1.2 Re-tag every `@scenario` tag and source comment naming `The reader takes the account only when sign-off is per
  change` or `The sign-off setting holds each change's archive for the user's sign-off` to the new titles (measured at
  propose: `test/core/account.test.ts`, `account-reader.test.ts`, `program-brief.test.ts`, `signoff.test.ts`,
  `templates/account-reading-walk.test.ts`, and `src/core/project-config.ts`, `decision-records.ts`,
  `program-brief.ts`, `account.ts`); the unrecognized-value tests move from `program` to `weekly`.

## 2. The program save

- [ ] 2.1 `saveProgramBrief` in `src/core/program-brief.ts` (design Decision 2): FINISHED from `computeStageStates` and
  the active changes citing the doc, the fresh render compared byte for byte with the latest `brief/<doc>/` copy, the publish through the two-level identity
  check (Decision 3); `orbit brief <doc> --save` prints the path and `sha256`, or one line for `unchanged` and
  `not-finished`, and `--json` carries `save` and `saved`. Tests for each scenario of `A program's brief is saved once
  the program is finished`, the racing writer, the aliased `<doc>` folder and the active change under an undeclared stage included.

## 3. The program sign-off and hold

- [ ] 3.1 `composeSignoff` takes `--doc` under `program` and `--change` under `change` (Decision 6): the doc resolved to
  `orbit/architecture/<doc>.md`, `change: null`, `doc`, the engine's `sha256` and `closing_review`, the record published
  into `signoff/<doc>/` through the two-level check; `SIGNOFF_DOC_REFUSAL` retired. Tests for the gate's new scenarios,
  `closing_review` refused from a payload, and each target refused under the other value.
- [ ] 3.2 `computeProgramHold` in `src/core/signoff.ts` (Decisions 4 and 5): the setting read first, FINISHED, the
  closing review, whether the latest signature still stands (no citing archive after its `closing_review`), the two
  folders, the six `why` values with `re-sign`'s `held` from `resolvePrMode`; a doc record's
  stored checks (`change: null`, its `doc`, `closing_review` a filename or `null`). `orbit brief <doc> --hold` prints
  the line and the `--json` object. Tests for each scenario of `A program's sign-off is recorded against its saved
  copy, and the hold reads arc-done`.
- [ ] 3.3 The change hold reports `setting: "program"` with `why: "off"` and reads no history under `program`; the
  brief command's two "not built yet" refusals retire. Tests for `program holds no change's archive`, `Under program, a
  change's hold reads no history` and `A program sign-off holds no archive`.
- [ ] 3.4 `src/cli/program.ts` and the completion registry describe `--save` and `--hold` for a doc and the doc
  sign-off.

## 4. The bodies

- [ ] 4.1 The architect body's Step 5.4 (Decision 7): the two commands, the hold table, the `orbit emit signoff --doc`
  invocation with its fields, the `re-sign` row's reading of `orbit pr program`'s `pr`, `outcome` and `action`, the
  failure going into `final_assessment` at the defaults, and the Step 5 header's prompt count; Step 5.5's arc-done
  readout, "unconditional" today, shown under `program` only when Step 5.4's row shows it and unchanged under every
  other value; a template test holding the body carrying each. The `orbit-architect` scenarios and the six
  `orbit-pr-lifecycle` scenarios of `Program PR (Shape A) semantics` (the five it carries and the one it adds) describe
  what the AI body does: tag each the test asserts the body's text for, and give each the test cannot run an
  `orbit/scenario-ledger.yaml` entry saying why.
- [ ] 4.2 The review body's fold step: an account is taken under `signoff: change` or `program`.

## 5. Pins, docs and the surface

- [ ] 5.1 Move the measured pins with a dated note each: `rc03b-untouched-modules.test.ts`'s `emit-composition.ts`, and
  `skill-templates-parity.test.ts`'s `getArchitectSkillTemplate` and `orbit-architect`; count which pins moved before
  writing the notes.
- [ ] 5.2 Docs: `docs/customization.md`'s `signoff` row gains `program`, and its "With `change`, the system review's
  reading step also reads" sentence (line 62, measured at the proposal's walk) says `change` or `program`;
  `docs/cli.md` gains `orbit brief <doc> --save`, `--hold` with a doc and `orbit emit signoff --doc`, and its three
  "with `signoff: change`" reading-step sentences (lines 379, 408 and 411) say `change` or `program`; `docs/commands.md`'s architect section and `docs/concepts.md`
  name the program sign-off, with the owning capabilities on each section's Carried-by line; CLAUDE.md's note on the
  sign-off commands names the doc forms.
- [ ] 5.3 Refresh the generated surface: `npm run build && node bin/orbit.js update --force`.

## 6. Verification

- [ ] 6.1 Show each new check able to fail: a clean mutation per new property (the `program` value, the reader's
  helper, FINISHED, the unchanged compare, the two-level identity check, the gate's value split, `closing_review`, each
  hold row), each caught by its own test.
- [ ] 6.2 Full `npm test`, `node bin/orbit.js validate program-signoff --strict` and the scenario map with no
  undeclared delta scenario.

AT-ARCHIVE NOTE 6.3 (executed in the archive flow, not at apply — a note, not a checkbox, so the tracked gate counts
only executable tasks): At archive: `orbit/specs/orbit-program-brief/spec.md`'s `## Purpose` names only `off` and
`change`, a change's saved brief and the change hold, and no delta carries `## Purpose`, so edit it in place to name
`program`, the program's saved briefs and the program hold, as the `program-brief` archive did.
