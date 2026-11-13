## Why

Stage `program-brief` of `automate-dev-flow` owes a sign-off seam: a project that wants the user to read what each
change built before it lands can make the archive wait for the user's sign-off over that change's brief (R-adf-2 as
amended, R-adf-1, R-adf-6). The first two changes of the stage wrote each change's account and saved its brief at the
archive; nothing yet waits on either, and no reader checks the account (see `explore.md`, D-pb-11 and D-pb-15: this
change carries the per-change sign-off, and `program-signoff` the per-program one).

## What Changes

- **A sign-off setting**, `signoff:` in `orbit/config.yaml`, off by default: absent or `off`, nothing waits, as today;
  `change`, each change's archive waits for the user's sign-off over that change's saved brief, under every `pr:` mode.
  Any other value — `program` included, until `program-signoff` adds it — is read as absent with one warning naming it
  (D-pb-12).
- **A `signoff` record**, written by `orbit emit signoff --change <name>` into the change's `.orbit-runs/signoff/`
  folder: it names the saved copy of the brief the user read, and orbit records that copy's SHA-256 beside it; it says
  `signed`, or `declined` with the user's reason in plain words (D-pb-8). It is refused when the setting is not
  `change`, and when it names any copy but the latest.
- **The hold, read by the engine**: `orbit brief --change <name> --hold` reports whether the change waits — the
  setting, the latest saved copy, the latest sign-off, and whether a signed record covers that copy's exact text.
- **The archive holds after its save** (D-pb-14): under `change`, the archive and bulk-archive show the saved copy
  whole and ask the user to sign or decline before anything is synced; a decline stops that change's archive and leaves
  it active; a failed save stops it, since there is nothing to sign; a copy already signed with the same text is not
  asked again. A chained archive asks the same question as a decision prompt, so the chain stops after it and gains no
  refusal reason.
- **The reader takes the account under `change`** (D-pb-13): the reading's selection includes a change's latest account
  that no reading has listed, so `orbit decisions brief` renders it, the in-context system review owes it, the archive
  counts it unread while unread, and `orbit brief` lists it with the records no reader checked. Under every other value
  nothing changes.
- **Docs**: `docs/customization.md`'s config-key table gains `signoff`.

At the defaults nothing the user sees or is asked changes: the archive's added step reads the hold, finds the setting
off and says nothing, and the selection is unchanged (R-adf-12; G0 names no new exception).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `orbit-program-brief`: adds the sign-off setting and the `signoff` record with the hold `orbit brief --hold`
  reports; the brief's records-no-reader-checked section names the account apart only when the reader does not take it.
- `orbit-decision-records`: the reading's brief selects and renders a change's latest account under `change`; `No
  reader takes the account yet` is renamed and rewritten as the account's reader rule; the account's lifecycle table
  points at it.
- `orbit-emit-composition`: the recorded selection includes the account under `change`; a new write gate for the
  `signoff` record.
- `orbit-archive-modifications`: the archive and bulk-archive hold for a per-change sign-off after the brief's save;
  the save's failure row stops the archive under `change`.
- `orbit-conventions`: the chain's prompt table gains the archive's sign-off, a decision prompt.

## Impact

- Code: `src/core/project-config.ts` (the setting's resolver), a new `src/core/signoff.ts` (the record's gate and the
  hold), `src/core/emit-composition.ts` (the `signoff` command; the selection's callers), `src/core/decision-records.ts`
  (the selection and the account's rendering), `src/core/program-brief.ts` and `src/cli/program.ts` (`--hold`, the
  unread section), the archive and bulk-archive templates, the shell completion registry.
- Generated surface: the archive and bulk-archive skills change, so their hash pins move (R-adf-9); the chained-prompt
  test (`Each chained prompt states its kind`) meets the new decision prompt.
- Tests that name `No reader takes the account yet` in their scenario tags are re-tagged to the new title.
- Docs: `docs/customization.md`.
- No new dependency; no outward act.

## Size

- capabilities: the per-change sign-off reaches five owners: the setting and record, the reader's selection (stated in two specs), the archive's hold, and one row in the chain's prompt table. This is already the smaller half of D-pb-11's split.
