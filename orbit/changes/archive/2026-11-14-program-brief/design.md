## Context

Stage `program-brief` of `automate-dev-flow` ships in four changes (see `explore.md`, D-pb-9, D-pb-11, D-pb-15).
`change-account` gave each change an account of what it built, which no reader takes yet; `brief-render` gave
`orbit brief`, which renders a change's brief, and the archive's save of that brief before the sync. This change is the
per-change sign-off: the setting, the `signoff` record, the hold in the archive and bulk-archive, and the reader taking
the account when sign-off is on. `program-signoff` follows with the `program` value, the program brief's save and the
architect hold.

Current state the change builds on:

- `orbit brief --change <name> --save` writes `orbit/changes/<name>/.orbit-runs/brief/brief-<TS>.md` and prints its
  SHA-256 (`src/core/program-brief.ts`, `saveChangeBrief`); both archive bodies interpolate one constant,
  `BRIEF_SAVE_STEP`, in `src/core/templates/workflows/archive-change.ts`.
- The account is written by `orbit emit account` to `.orbit-runs/account/` (`src/core/account.ts`), with the identity
  checks and no-overwrite publish the decision records use.
- The reading's selection is one function, `selectUnreadRecords` in `src/core/decision-records.ts`, called by
  `buildDecisionBrief`, by the review emit's owed list and read-list check and by the archive emit's unread count
  (`src/core/emit-composition.ts`), and by `buildChangeBriefAt` (`src/core/program-brief.ts`).
- Settings are read by one resolver per key from `orbit/config.yaml` (`src/core/project-config.ts`): `resolveChainSetting`
  and `resolveCommitPushSetting` read only their own keys and are silent; `resolvePrMode` reads an unrecognized value as
  `never`.

## Goals / Non-Goals

**Goals:**

- A `signoff` setting whose absent value is today's behaviour, tested (the stage's exit criterion), and whose `change`
  value makes each archive wait for the user's sign-off over the change's saved brief.
- A record tying the user's answer to the exact text they read.
- The account read at the system review when the user signs off on each change, so the user signs over prose a clean
  reader checked.
- G0 with no new exception: at the defaults the archive asks and shows nothing new, and the selection is unchanged.

**Non-Goals:**

- The `program` value, the program brief's save at the architect session and the architect/arc-done hold —
  `program-signoff` (`explore.md`, D-pb-15).
- A driver obeying the hold (stage `driver`).
- Changing the chain resolver: the chain gains no refusal reason (D-pb-14).

## Decisions

**1. The setting is `signoff`, read by its own resolver; only the hold reports a bad value** (D-pb-12).
`resolveSignoffSetting(projectRoot)` reads only the `signoff` key, as `resolveChainSetting` reads only `chain`: absent,
`off`, an absent file and an unparseable file are off; `change` is `change`; anything else is off with a warning string
naming the value. The selection and the write gate call it silently; the hold puts the warning in its output, and the
archive states it in one line — the only place a user meets the setting. *Alternatives:* `readProjectConfig`'s schema
(it warns on every malformed field at every read, so `orbit status` would start printing); refusing an unrecognized
value (an install that writes `program` early would break its archives).

**2. The `signoff` record lives in its own folder, outside `decisions/`, with an engine-written hash** (D-pb-8).
`.orbit-runs/signoff/signoff-<TS>.json`, beside `account/` and `brief/`. Records form a sequence, not a replacement
chain: each answers the copy it names, and the latest is current. The engine writes `sha256` from the named copy's
bytes, so the record cannot claim a hash for text it does not name; saved copies are never overwritten, so the hash at
signing equals the one `--save` printed. *Alternatives:* a fourth decision record (it would join the reading's selection
and `Three decision records, one job each`, though it records no call); a field of the archive emit (written after the
move, too late to hold anything, and absent from a declined archive, which writes no emit).

**3. The record is written through the emit surface, as the account is.** `orbit emit signoff --change <name>` reuses the
account's path: the narrative-only payload contract, the decision-record spine checks, the folder identity check (twice)
and the exclusive-link publish (`src/core/account.ts`, `src/core/emit-composition.ts`). Its gate refuses when the setting
is not `change`, when `brief` is not the latest saved copy, and when a decline has no reason. *Alternative:*
`orbit brief --sign` (a second write path beside the emit surface, re-implementing its checks).

**4. The hold is read by `orbit brief --change <name> --hold`, which renders no brief.** The archive needs the setting
even when the save failed, so the hold reads only the config, `brief/` and `signoff/`, and answers when the brief cannot
be rendered. It reads the setting first and, under any value but `change`, no folder at all, so a default archive cannot
be stopped by the state of the history (G0). Its `why` is the first of `off`, `no-copy`, `signed`, `unsigned` that matches; `signed` needs the latest
sign-off's `sha256` to equal the latest copy's, so a re-save with the same text is not asked again (D-pb-14).
*Alternatives:* a field of `orbit status --change --json` (a readout G0 keeps unchanged, and owned by another
capability); folding it into `--save`'s output (no answer when the save fails, which is exactly when the archive must
stop).

**5. The hold sits inside the archive, after the save, as a decision prompt** (D-pb-14). A new constant beside
`BRIEF_SAVE_STEP`, `SIGNOFF_HOLD_STEP`, carries the command, the table and the `orbit emit signoff` invocation, and both
`getArchiveChangeSkillTemplate` and the bulk-archive template interpolate it after the save step. The prompt is tagged
`(chain: decision)`, so a chained archive asks it as typed and the chain stops after it; `src/core/chain.ts` is
untouched. The copy is shown whole (the body reads the saved file and pastes it), so the user decides from the brief
alone (G5). A decline writes its record and stops before the sync with no run summary, as an abort does today.
*Alternative:* a chain refusal reason before the archive (`explore.md`, Considered & out): a second user turn, and
`orbit-engine-gates` and `orbit-lifecycle-consent` change for it.

**6. The selection takes the account through the same function** (D-pb-13). `selectUnreadRecords(changeDir,
projectRoot)` returns, under `change`, the decision records it returns today plus the latest of the account chain when
no in-context system review emit lists it. Every caller then agrees by construction — the brief, the owed list and the
read-list check, the archive count, `orbit brief`'s unread section — which settles D-pb-5's open point. `buildDecisionBrief`
renders an account as a record kind of its own (plain fields `built`, `seams`, `deviations`; no citations), and
`orbit brief` names the account apart only when the setting is not `change` (under `change` a read account is not listed
at all). *Alternative:* a second selection for
accounts (the callers could disagree, which is the defect D-pb-5 named).

**6a. A reader's finding against the account is fixed by a replacement of the account.** The fold step gives the finding
the account's path under `account/`, and the walk writes a replacement of the latest account (`orbit emit account` with
`replaces`) for each finding it resolves, as a decision record is replaced. A wording replacement states no new fact, so
it is written in a walk that reopens tasks too, beside the rule that such a walk writes no account for its fact-changing
fixes. `orbit-review`'s `No records, no reading` is qualified to the setting not being `change`. *Alternative:* recording
such findings `deferred` (the account would reach the user's sign-off unclear, which is what D-pb-13 exists to prevent).

**7. `No reader takes the account yet` is renamed, not removed.** The rule survives with a new condition, so a RENAMED +
MODIFIED pair keeps its history and fingerprint (rehearsed through `buildUpdatedSpec` at propose: the merged spec holds
the new title and not the old). The test tags naming the old title are re-tagged.

**8. Under `change`, the PR tail's untracked-files line names the sign-off record.** `PR-attached archive tail` exempts
only the saved briefs from that line; the sign-off is the user's answer, not the archive's own render, and naming it
shows it was committed. At the defaults no sign-off exists, so the line is unchanged (R-adf-13 holds as written).
*Alternative:* exempting it too (a modification of `PR-attached archive tail`, a requirement this change otherwise
leaves alone).

## Touchpoints

- `src/core/project-config.ts` — `resolveSignoffSetting`.
- `src/core/signoff.ts` — new: the record's shape and gate, the latest-copy check, the hold computation.
- `src/core/emit-composition.ts` — the `signoff` command; the selection's callers pass the project root.
- `src/core/decision-records.ts` — `selectUnreadRecords` takes the account under `change`; the brief renders an account.
- `src/core/program-brief.ts` — the unread section; the hold's report.
- `src/cli/program.ts` — `--hold` on `orbit brief`; `signoff` on `orbit emit`.
- `src/commands/brief.ts` — the `--hold` report and its usage errors; the `--save`-with-a-doc message.
- `src/core/completions/command-registry.ts` — the new flag and emit command.
- `src/core/templates/workflows/archive-change.ts` + `src/core/templates/workflows/bulk-archive-change.ts` — `SIGNOFF_HOLD_STEP` and its interpolation.
- `src/core/templates/workflows/review.ts` — the reading fold step's path for an account.
- `src/core/templates/workflows/address-reviews.ts` — the reading-finding rule and step 7 for an account.
- `src/core/account.ts` — the account-folder helpers the selection reuses.
- `docs/customization.md` — the `signoff` row of the config-key table.
- `docs/cli.md` + `docs/concepts.md` — `--hold` and the `signoff` emit; `signoff/` in the Trail row.
- `CLAUDE.md` — the note on running new commands through `node bin/orbit.js`.
- `test/core/*.test.ts` — the setting, the gate, the hold, the selection, the bodies; re-tagged scenarios; moved pins.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-pb-1 | not carried | superseded (D-pb-12, D-ps-1) | none |
| D-pb-3 | not carried | superseded (D-ps-2) | none |
| D-pb-4 | not carried | superseded (D-ca-1, D-br-1) | none |
| D-pb-5 | not carried | superseded (D-pb-13, D-ps-1) | none |
| D-pb-6 | not carried | superseded (D-pb-8, D-br-2) | none |
| D-pb-8 | DERIVED | live rule | `orbit-program-brief`: `A sign-off is recorded against the saved copy, and the hold reads it` — TABLE (the moment / the record) |
| D-pb-12 | DERIVED | live rule | `orbit-program-brief`: `The sign-off setting holds each change's archive for the user's sign-off` — TABLE (the key's value / under every `pr:` mode) |
| D-pb-13 | DERIVED | live rule | `orbit-decision-records`: `The reader takes the account only when sign-off is per change` — TABLE (reader / `change` / any other value) |
| D-pb-14 | DERIVED | live rule | `orbit-archive-modifications`: `The archive holds for a per-change sign-off` — TABLE (the save and the hold / the archive) |

## Risks / Trade-offs

- [The user signs a copy without reading it] → The copy is shown whole before the question, and the record keeps the
  hash of what was shown; whether the user read it is theirs (a named non-goal of any gate).
- [A signature lifts a hold over text it did not cover] → The hold compares hashes, never filenames; a re-save with
  different text is `unsigned`.
- [A concurrent save between the gate's read of `brief/` and its write] → The named limit stated in `The write gate
  checks the sign-off record`; the hash comparison keeps the hold honest.
- [Under `change`, a walk replaces the account after the system review] → That replacement reaches no reader before
  archive (D-dr-2's named limit); it is counted in `decision_records_unread` and listed by the brief, so the user sees it
  unread at the sign-off.
- [The archive and bulk-archive skills change] → Their hash pins move, named at archive (R-adf-9); the change is text
  whose effect depends on a setting, and at the defaults the AI does what it did (R-adf-12).
- [A `program` value written before `program-signoff` ships] → Read as off with a one-line warning at each archive; the
  user is told nothing waits.

## Migration Plan

None: an absent key is today's behaviour, and nothing existing is rewritten. Rollback is reverting the change.

## Alternatives considered

From `explore.md`'s Considered & out:

- The chain stopping before the archive with a new refusal reason under `change` — out (D-pb-14): two user turns where
  one does (G1), and the chain resolver, `orbit-engine-gates` and `orbit-lifecycle-consent` change for it.
- One change with a declared breach of about six capabilities, or three changes — out (D-pb-11).
- Sign-off once per stage — out: neither chosen value needs a stage's end.
- Refusing or warning on `program` unless `pr: per-architecture` — out (D-pb-3, now `program-signoff`'s D-ps-2).
- A sign-off on the plan before apply — out (D-pb-2).
