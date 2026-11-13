## Why

The program brief (stage program-brief of `automate-dev-flow`, R-adf-7, G5) must tell the user what a change built, the
new places the user is asked something, and where the work left its stage's plan, and none of orbit's records holds
those three. This change, the first of the stage's three (D-pb-7 and D-pb-9 in
`orbit/explore/program-brief/explore.md`), adds the record that does: each change's ACCOUNT, written by the AI in plain
language once apply is complete (see `explore.md`, D-ca-4). No reader takes the account until the stage's third change
adds the sign-off setting (D-ca-2), so with this change alone nothing the user sees or is asked changes.

## What Changes

- A new record, the change's **account**, with three plain fields: `built` (what the change built), `seams` (the new
  places the user is asked something, or where a setting now changes what happens) and `deviations` (where the work
  left its stage's charter, or the proposal's scope when the change cites no architecture doc), plus `defines`,
  `detail` and `replaces` as the decision records have them.
- `orbit emit account --change <name>` writes it, through a write gate like the decision records': plain fields
  non-blank, one account chain per change (a second account must replace the latest), an active change only.
- The account is kept in `.orbit-runs/account/`, beside `decisions/` and outside it — held to the same canonical-folder
  check — so the reading step's selection, its owed and read checks and the archive's unread count never hold it, and
  no run-summary reader sees it.
- The apply body writes the account in a session that ends with apply complete (the apply gate passing, declared
  user-validation handoffs included) when none exists, and replaces the latest one when the work done since it was
  written changed what it says; the address-reviews body replaces it when a resolved finding of a walk of an active
  change changes what was built, a seam, or a deviation, except a walk that resolves any finding by reopening tasks,
  which writes none, not even for its other fixes: the apply session that completes them replaces it.
- `docs/cli.md` and the `emit` command's description name the new command.
- `orbit-decision-records`' plain-language rule binds the account's three fields, which reach the user through the
  program brief (the stage's second change).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-decision-records`: two ADDED requirements — the account (what it holds, when it is written and replaced, where
  it is kept) and that no reader takes it yet — and the plain-language requirement's field table gains the account's
  three fields.
- `orbit-emit-composition`: one ADDED requirement — the write gate checks the account (its payload, checks, path,
  spine and the absence of a recommendation).

## Impact

- `src/core/decision-records.ts` (or a sibling module) — the account's payload fields and write-gate checks.
- `src/core/emit-composition.ts` — the `account` command in the command table, its path and spine.
- `src/core/templates/workflows/apply-change.ts`, `src/core/templates/workflows/address-reviews.ts`,
  `src/core/disciplines.ts` — the account steps in the apply and address-reviews bodies.
- `src/cli/program.ts`, `docs/cli.md` — the `emit` command's description and the docs' `orbit emit` section.
- At archive, both capabilities' Purpose lines are edited in place to name the account (design.md, At archive).
- Tests: new write-gate and body tests; existing tests that enumerate the emit command set or pin the two bodies'
  hashes move, as closed sets the change extends (R-adf-9), each named at archive.
- G0: the apply and address-reviews bodies gain an instruction to record something (R-adf-9); no readout, gate or
  prompt changes, and no reader runs on the account.
