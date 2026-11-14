## Context

`program-brief` (archived 2026-11-14) shipped the per-change sign-off: `resolveSignoffSetting` in
`src/core/project-config.ts` reads `off` or `change`; `src/core/signoff.ts` holds the record's checks and the change hold
(`computeHold`, `latestSavedCopy`); `composeSignoff` in `src/core/emit-composition.ts` writes `signoff/` under a change
trail; `src/commands/brief.ts` runs `--save` and `--hold` for a change and refuses both with a doc, naming this change;
`selectUnreadRecords` in `src/core/decision-records.ts` takes the account only when the value is `change`. The program
brief (`buildProgramBrief` in `src/core/program-brief.ts`) renders the citing changes by stage and then the doc's
`decisions/` records from the architecture trail, and no stage state. The architect body's Step 5.5 observes arc-done
itself (every stage archived and the closing `--as architecture` review recorded) and runs `orbit pr program`.

This change is the decisions D-ps-1, D-ps-3 and D-ps-5 to D-ps-7 of `explore.md` made real; the decisions below are how.
The size breach (seven capabilities, fifteen requirements) is declared in the proposal: the user chose that over a split.

## Goals / Non-Goals

**Goals:**

- `signoff: program` read, and the account read by the reader under it as under `change` (D-ps-1).
- The program brief saved for a finished program, under every setting, only when its text changed (D-ps-3, D-ps-6).
- The program hold computed by the engine, the sign-off written for a doc, and the architect session asking for it
  before the READY flip (D-ps-5, D-ps-6, D-ps-7).
- Nothing the user sees or is asked changes at the defaults (G0, R-adf-1).

**Non-Goals:**

- Any change to the per-change hold, the archive's step, or the completion ratification.
- Holding the program PR's merge, or performing the READY flip: both stay human acts.
- A reader for the architecture trail's own records: the program brief brings them to the user, as before.

## Decisions

**1. The setting gains one value; the reader keys on "a sign-off is set".** `SignoffSetting.value` becomes `off`,
`change` or `program`; any other value is still read as `off` with the warning. `selectUnreadRecords` and the program
brief's unread section take the account when the value is `change` or `program` (one helper, `takesAccount(setting)`,
so the five readers cannot disagree). The change brief's unread-account line is reworded so it is true under both.

**2. The program save is a sibling of the change save, decided by the engine.** `saveProgramBrief(projectRoot, doc)`
in `src/core/program-brief.ts` computes FINISHED from `computeStageStates` (every declared stage rendering
`quiescent-awaiting-ratification`, `complete`, `ended` or `ended-from-explore`), compares the fresh render's bytes with
the latest `brief/<doc>/brief-<TS>.md`, and publishes only when they differ. It returns `{save, saved}` with `save` one of
`saved`, `unchanged`, `not-finished`. Deciding "finished" and "unchanged" in the engine, not the architect body, makes
D-ps-3's table testable and keeps the body to one call. Chosen over a body-side check, which no test can hold.

**3. Per-doc folders get a two-level identity check.** `publishTrailChildText` and `composeSignoff` publish into
`<trail>/brief/<doc>/` and `<trail>/signoff/<doc>/`. The existing `assertCanonicalChildDir` checks one level; a doc
folder is checked at both levels (the child under the trail, then `<doc>` under the child), after creation and again
before the link, so an aliased `brief/` or `<doc>` folder is refused as an aliased `decisions/` is today. This moves
`rc03b`'s `emit-composition.ts` pin.

**4. The closing review is a filename the record carries, not a token comparison at read time.** The hold finds the
closing review once — the latest `review-architecture-<TS>.json` whose `doc` is the doc and whose token is later than
every citing change's archive time (`archivedAt`, the program brief's own rule) — and a doc sign-off records it as the
engine-owned `closing_review`. The `re-sign` row then compares filenames: a signature belongs to the current arc-done
exactly when its `closing_review` is the current one. Chosen over ordering a sign-off's token against the review's,
which the reading step's requirement already names as unorderable across folders. The one token comparison left,
review against archive, is a named limit in the requirement.

**5. One hold module, two units.** `computeProgramHold(projectRoot, doc)` joins `computeHold` in `src/core/signoff.ts`,
sharing `latestSavedCopy`, the stored-record checks (a doc record checked for `change: null` and its `doc`) and the
read-the-setting-first rule. The `re-sign` row's `held` reads `resolvePrMode` from the same config. Whether the program
PR is still a draft is NOT read here: `orbit pr program` already observes it live at the arc-done readout, so the
architect body combines the two (D-ps-7), and the engine stays out of `gh`.

**6. The gate splits by target.** `composeSignoff` takes `--change` under `change` and `--doc` under `program`, each
refusal naming the value read and which sign-off it asks for; `SIGNOFF_DOC_REFUSAL` and the brief command's two
"not built yet" refusals are retired. A doc that does not resolve to `orbit/architecture/<doc>.md` is refused.

**7. The architect body gains Step 5.4, before the arc-done readout.** It runs the save and then the hold on every
invocation, under every setting, and acts by the table the `orbit-architect` delta owns. At the defaults the save is
silent and its failure goes only into the session's `final_assessment`: the architect emit has no `warnings` field, and
adding one would touch `orbit-run-summary-emit` for a sentence the narrative already carries. The sign-off question is
the body's third prompt; the Step 5 header that names "the completion flow's one AskUserQuestion" is reworded. This
moves the architect skill's function and generated-skill pins in `skill-templates-parity.test.ts`.

**8. arc-done under `program` is defined where arc-done is defined.** `orbit-pr-lifecycle`'s `Program PR (Shape A)
semantics` gains the sign-off condition, so the readout's "SHALL surface" and the hold cannot contradict each other;
`Generalized READY rule` and `orbit pr program` read arc-done by name and are unchanged.

**9. The two renamed requirements take their pointers with them.** `The reader takes the account when the user signs
off` and `The sign-off setting holds a change's archive or a program's completion for the user's sign-off`: every
baseline pointer to the old titles sits in a block this change carries (checked at propose), and the source comments and
`@scenario` tags naming them are re-tagged at apply. Carried blocks that cited "D-pb-… in this change's `explore.md`" now
name `program-brief`'s, since after the sync "this change" names nothing.

## Touchpoints

- `src/core/project-config.ts` — the `program` value.
- `src/core/signoff.ts` — the program hold, the doc record's checks, the retired doc refusal.
- `src/core/program-brief.ts` — `saveProgramBrief`; the unread-account line under `program`.
- `src/core/decision-records.ts` — the selection takes the account under `program`.
- `src/core/emit-composition.ts` — `signoff --doc`; the two-level doc-folder identity check.
- `src/commands/brief.ts` + `src/cli/program.ts` — `--save` and `--hold` with a doc.
- `src/core/account.ts` — its header's selection rule.
- `src/core/templates/workflows/architect.ts` — Step 5.4 and the prompt count.
- `src/core/templates/workflows/review.ts` — the fold step's account clause.
- `docs/customization.md` + `docs/cli.md` + `docs/commands.md` + `docs/concepts.md` — the program sign-off.
- `test/core/*.test.ts` — the program hold, save and gate; the reader under `program`; the re-tags.
- `test/core/templates/*.test.ts` — the architect body's step; the moved pins.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-ps-1 | DERIVED | live rule | `orbit-program-brief`'s `The sign-off setting holds a change's archive or a program's completion for the user's sign-off` (a normative table: the `program` row) and `orbit-decision-records`' `The reader takes the account when the user signs off` (its reader table's `change` or `program` column) |
| D-ps-2 | — | superseded by D-ps-5 | not carried |
| D-ps-3 | DERIVED | live rule | `orbit-program-brief`'s `A program's brief is saved once the program is finished` (a normative table) |
| D-ps-4 | — | scope | not carried |
| D-ps-5 | DERIVED | live rule | `orbit-program-brief`'s `A program's sign-off is recorded against its saved copy, and the hold reads arc-done` (a normative table), `orbit-architect`'s `The architect session saves the program brief and asks for the program's sign-off` (a normative table) and `orbit-pr-lifecycle`'s `Program PR (Shape A) semantics` (a sentence naming the hold as the source) |
| D-ps-6 | SOURCED | live rule | `orbit-program-brief`'s `A program's brief is saved once the program is finished` and `A program's sign-off is recorded against its saved copy, and the hold reads arc-done` (a sentence naming the folders), `orbit-emit-composition`'s `The write gate checks the sign-off record` (the path sentence) |
| D-ps-7 | DERIVED | live rule | the `re-sign` row of `orbit-program-brief`'s `A program's sign-off is recorded against its saved copy, and the hold reads arc-done` and the `re-sign` rows of `orbit-architect`'s requirement (normative tables) |

## Risks / Trade-offs

- [The architect body asks a third question] → it fires only under `signoff: program`, only on a done program, and only
  in a session the user opened on that doc; a decline is asked again at the next such session, as D-ps-7 records.
- [A failed save under `program` leaves an older copy that a hold could read as signed] → the body asks nothing and
  shows no arc-done readout in a session whose save failed, so an older copy never stands in for the current text.
- [The closing review is ordered against archives by token] → named in the hold's requirement as a limit with its
  method; the record's `closing_review` field lets the user see which review a signature was given under.
- [The doc's sign-off and copies are written by an architect session, which commits nothing itself] → as the session's
  own emits today; under `pr: per-architecture` the program branch carries them with the next stage commit.
- [Seven capabilities and fifteen requirements in one change] → declared in the proposal; each delta block changes only
  the clause the rule makes false, and the merge was rehearsed through `buildUpdatedSpec` at propose.

## Migration Plan

None: the value, the folders and the step are additive. A project without `signoff: program` sees nothing new, and an
existing `signoff: program` (read as unrecognized until now, with a warning) starts holding the program at its next
architect session on a done program.

## Alternatives considered

- **Signing at the last stage's ratification** (D-ps-2, option A): out (D-ps-5). The closing review comes after it, so
  the signed brief would not include that review, and its walk's records would make the copy stale.
- **Signing at ratification and letting later records leave the signature standing** (option C): out (D-ps-5). The
  hash would no longer mean the text the user read.
- **Refusing or warning on `program` unless `pr: per-architecture`**: out (D-pb-3, carried as D-ps-2). One setting would
  depend on another; holding completion works under every mode.
- **The architect body judging "finished" and "unchanged" itself**: out (Decision 2). No test can hold a body-side
  comparison.
- **Ordering a sign-off against the closing review by token**: out (Decision 4), for the record's `closing_review`.
- **Reading the program PR's draft state in the hold**: out (Decision 5). The hold stays file-only, and the readout
  already makes that observation.

## Open Questions

None.
