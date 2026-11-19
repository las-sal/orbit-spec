## Why

Every workflow body carries the decision-writing rule, about 2,900 characters in fourteen bodies, and at the default
settings the only thing that reads the records it asks for is a check of those same records. `reduce-orbit-phase1`'s
R-rop-17 rules that decision records are written only when a setting that reads them is on, with every body the same
under every configuration (R-rop-5) and an orbit command's result picking the branch (R-rop-4). This is stage
`records-by-setting`, RG0's one named exception, after which `automate-dev-flow` resumes on bodies that already write
records only under the settings it builds (R-rop-9 as amended). The decisions are the exploration's D-rbs-1 to D-rbs-7,
as the proposal walk refined them (D-rbs-8 to D-rbs-10; see explore.md).

## What Changes

- **A new command, `orbit decisions status [--json]`**, project-wide, says whether decision records are written:
  `write` is true exactly when a reader of them runs, that is when some chain key is granted, OR `signoff` is `change`
  or `program`, OR some tripwire sensor is set to `on_fire: halt`; `readers` names the ones that are on (D-rbs-1,
  D-rbs-2). A `chain:` map with no key granted and tripwires left at `record` owe nothing.
- **The decision-writing bullet becomes its basic content** in all fourteen bodies: at each command's first step, and
  again after the session edits the project config (`orbit/config.yaml` or `.yml`), run `orbit decisions status --json`; on `write: true` read
  `references/decision-records.md` and follow its rule; on `write: false` write no new ledger entry or stop record,
  while a resolution answering a stop already in the trail, or a replacement fixing a record already there, is still
  written (D-rbs-10).
- **The rule moves whole into `references/decision-records.md`**, every clause of today's bullet kept except "under
  every setting", replaced by "when `orbit decisions status` reports `write: true`" (D-rbs-6); the reference's opening
  line, which said the body owns WHEN and the reference WHAT, is rewritten, since it now says both.
- **The write gate is unchanged**: a record written when none is owed is accepted and read as today (D-rbs-4).
- **Every text that says records are written under every setting is corrected** (D-rbs-5): onboard's one-line
  statement, `docs/cli.md` (with the new command documented beside `orbit decisions brief`), `docs/customization.md`'s
  rows for the three settings, this repository's CLAUDE.md, and `orbit-decision-records`' Purpose.
- **The `tighten-bodies` edit ledger follows the bullet** to its new home: it undoes this change's swap before its own
  pairs, and its clause check reads the rule in the reference.
- **The budget test's ceilings are lowered** to the new body sizes, explore's line ceiling among them.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `Decision-writing discipline` holds two fences, the rule (carried by the reference) and its basic
  content (carried by every body), with the moment the command runs and its named limit; `Decision-record reference
  ships beside the statement` says the reference carries the rule as well as the record forms; `An edit ledger holds
  every tightened body to its recorded text` gains the row for this change's swap and moves its clause check to the
  reference.
- `orbit-decision-records`: `Decision records are written in every mode` is renamed `Decision records are written when
  a setting reads them` and rewritten to D-rbs-1's three terms; `orbit decisions status says whether decision records
  are written` is added.

## Impact

- `src/core/decision-status.ts` (new): the predicate over the three resolvers; `src/cli/program.ts`,
  `src/commands/decisions.ts` and the completion registry: `orbit decisions status`.
- `src/core/disciplines.ts`: the rule's first clause, a new basic-content constant, the reference's new section and
  opening line; the fourteen workflow templates interpolate the basic content; `onboard.ts`'s line.
- Tests: the decision-writing parity test (two fences), the edit ledger, the content-fidelity and template-parity
  pins, `skill-body-budget.test.ts`' ceilings, one re-tagged scenario, and new tests for the command.
- Docs: `docs/cli.md`, `docs/customization.md`, `CLAUDE.md`; `orbit/specs/orbit-decision-records/spec.md`'s Purpose.
- Behaviour: at the defaults the AI writes no new decision records; records already in a trail are still read, answered
  and fixed, and on a trail that holds none the review's reading step selects nothing and is skipped as it is today (RG0 as amended; `automate-dev-flow`'s G0 by R-adf-17). Under any of
  the three settings nothing changes.
