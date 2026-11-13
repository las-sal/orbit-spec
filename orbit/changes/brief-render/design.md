## Context

Stage program-brief of `automate-dev-flow` lands as three changes (D-pb-7, D-pb-9 in
`orbit/explore/program-brief/explore.md`). The first, `change-account` (archived 2026-11-13), gave each change an
ACCOUNT in `.orbit-runs/account/` — what it built, its seams, its deviations — which nothing reads yet. This change, the
second, composes the BRIEF from the trail and saves each change's brief at its archive; the third adds the sign-off
setting, the `signoff` record that cites a saved brief by name and hash, the holds, and the program brief's save at the
architect session (D-br-5).

What the brief reads already exists: the decision records and their chains (`src/core/decision-records.ts`:
`readDecisionFolder`, `latestInChain`, `chainOf`, and `selectUnreadRecords`, the one selection the reading step's brief,
the review emit's read-list check and the archive's unread count share); the account (`src/core/account.ts`:
`readAccountFolder`, `latestAccount`); the archive record (`archive-<TS>.json`: `sync_specs`, `warnings`,
`judgements[]`, `decision_records_unread`); the change's delta specs; and `proposal.md`'s `## Size` section. The
precedent for a read-only rendered brief is `orbit decisions brief` (`src/commands/decisions.ts`), whose
whole-or-absent rule this one follows.

The exploration was settled before `change-account` shipped and re-measured against it on 2026-11-13 (see
`explore.md`): a per-change sign-off waits before the sync (D-pb-1), so the archive must save the brief before the sync,
not after it (D-br-3, superseding D-br-2); the copy then cannot hold what the archive records after the move (D-br-4);
and the PR tail's untracked-files line would name the saved brief on every default archive unless it is left out
(`src/core/pr/tail.ts`, `carried_untracked`). The proposal review's walk then keyed the brief's sync lines on what the
archive record says rather than on whether one exists (D-br-6, superseding D-br-4), and kept each definition of a term
with the records that wrote it (D-br-7, superseding D-br-1).

## Goals / Non-Goals

**Goals:**
- `orbit brief --change <name>` and `orbit brief <doc>`: a change brief and a program brief, rendered read-only, whole
  or absent, with `--json` (D-br-7, D-br-3).
- `orbit brief --change <name> --save`: an active change's brief saved as `brief-<TS>.md`, never overwritten, with its
  SHA-256 printed for the third change's sign-off to cite.
- The archive and bulk-archive save the brief before the sync in every mode (R-adf-7), with a failure recorded and never
  shown, and the tail leaving the copy out of its untracked-files line — so G0 holds with no new exception.

**Non-Goals:**
- Saving the program brief at the architect session, the sign-off setting, the `signoff` record and the holds (the
  third change, D-br-5, D-pb-10).
- A reading step over the account or the brief's own prose (the third change's, D-pb-5).
- Tripwires (stage `tripwires`): the brief says they are not installed.

## Decisions

1. **One new capability, `orbit-program-brief`.** The brief reads accounts, archive records, delta specs and proposals
   as well as decision records, and the third change's sign-off and holds belong beside it. Kept in
   `orbit-decision-records`, that spec would own a surface most of whose sources are not decision records.
   `orbit-decision-records` changes only where its own tables and limits name the brief as a reader.

2. **The command is `orbit brief`, top level** (D-br-3 left the name to propose). A doc as the positional argument for a
   program brief, `--change <name>` for a change brief, never both; `--save` only with `--change`, since the program
   save is the third change's. `orbit decisions brief` stays the reading step's own command: the two briefs have
   different readers and different contents.

3. **The saved brief is markdown, and its hash is computed, not stored.** `brief-<TS>.md` holds exactly the rendered
   text, so the user reads it as written on GitHub or in an editor; its SHA-256 is that of the file's bytes, printed by
   the save. A JSON wrapper carrying the text and a stored hash would put a hash beside the bytes it describes, which a
   reader can recompute anyway, and make the user's copy harder to read. The third change's `signoff` record cites the
   filename and the hash; its write gate recomputes the hash from the file.

4. **The save goes through the decision records' no-overwrite publish.** `publishChildRecord` in
   `src/core/emit-composition.ts` (exclusive temporary file, linked to the final name, canonical trail and child checks)
   is generalised to take the serialized text, so the brief, the records and the account share one publish. Its pin
   moves (R-adf-9).

5. **The archive step sits after Step 3.5 and before upstream Step 4** (D-br-3). Every anomaly prompt (gate, fingerprint,
   audit) has fired by then, so a copy is saved only once the archive is about to sync; a later cancel at the sync prompt
   leaves the copy, and the next archive saves a new one. A failure goes into the existing `warnings` field — a process
   note that arose at the seam, exactly the field's defined use (`orbit-archive-modifications`' `Archive run summary
   written`) — so no emit schema changes and nothing is shown.

6. **The sync lines follow what the archive recorded** (D-br-6, the user's decision A at the proposal walk). Keyed on
   whether an archive record exists, the brief told an archived change without one that its requirements were "not yet
   synced", listed a skipped sync's requirements as synced, and called an active change synced by `/orbit:sync` not
   synced. Each state now has one line true by construction: an active change's says no archive has recorded a sync yet;
   an archived change's says what its record says (the sync ran, or was skipped with its reason), or that it was archived
   without a record. Comparing each delta requirement to the baseline was considered and left out: a baseline reader
   that a later change editing the same requirement would mislead. The unread list is a snapshot when rendered: the
   archiving session can write a record after the save, which the archive counts and the copy lacks, so the copy says
   where such records appear.

7. **Citations are named, not quoted.** A ledger entry's `relies_on` is shown by kind and name (a requirement's
   capability and title, a ruling or goal id, a resolution's token, a decision id), not the cited text the reading
   step's brief renders. The brief's reader is the user deciding whether to sign off; the reading step already checked
   the citations' wording. This also keeps the brief's failure set to sources it reads, with no baseline lookup that a
   later archive could break.

8. **Each definition of a term is shown with the records that wrote it** (D-br-7, the user's decision B at the proposal
   walk). A record's `defines` list belongs to that record, so "latest wins" could attach one record's meaning to
   another's prose. Each distinct term and definition is shown once, naming the records that define it; a term defined
   two ways appears twice. Order is by term, then by the earliest record, so no tie-break between record kinds is needed.
   In a program brief each change and the architecture trail's section list their own terms. Showing terms beside each
   record instead was left out: the charter names new terms as a section of its own.

9. **Program brief order.** Stages in the order the doc declares them; within a stage, archived changes by archive date,
   then active ones by name; a stage the doc does not declare after the declared ones, under its id; then the
   architecture trail's records whose `doc` is the doc. Each change's section is its change brief.

10. **Output details the golden renders fix.** `--save` prints two lines, the path and `sha256 <hex>`, never the
    brief; the file is the render's exact bytes, final newline included, so piping `orbit brief --change <name>` to
    `sha256sum` gives the printed hash; entries within a section run oldest record first; a MALFORMED doc is refused
    naming `orbit architecture validate`, a LEGACY doc groups its changes by the stage ids they cite, and a change naming
    no stage comes last. The token is drawn unique within `brief/` by the collision bump `decisions/` and `account/`
    use, so only two writers racing to one name are refused.

11. **One baseline sentence is left as it is.** `orbit-decision-records`' `Each change carries one account, written when
    apply is complete` says the account holds "the three parts of the program brief". It stays true — a program brief
    carries each change's brief — so the requirement is not carried; the deltas say "the brief" where a change brief now
    reads the account too.

12. **The tail's exclusion is by name.** `carried_untracked` in `src/core/pr/tail.ts` already leaves out the archive
    emit by its filename pattern; it leaves out `.orbit-runs/brief/brief-<TS>.md` the same way. A brief the user saved
    by hand earlier in the change and left untracked is left out too: it is the same kind of file, and the note names
    strays the work left behind.

## Alternatives considered

- **Saving the brief at the end of the archive, after the sync** (D-br-2): out, superseded by D-br-3 — a per-change
  sign-off waits before anything is synced, so the copy it cites must exist then.
- **Saving it twice, before and after the sync**: out — two copies of one change's brief, and the second reaches no
  sign-off; the archive's own signals reach the user in the program brief instead (D-br-6).
- **Saving the brief only when someone signs off**: out (D-pb-6) — R-adf-7 asks for it in every mode.
- **A one-line notice when the save fails**: out — it changes what a default archive shows and would need its own
  named exception to G0 (R-adf-11); recorded in `warnings` instead (ledger entry in this change's trail).
- **Building the program brief's save here, with a declared size breach, or as its own change**: out (D-br-5) — the save
  belongs beside the architect hold that reads it.
- **A new `brief_failure` field in the archive emit**: out — `warnings` already holds process notes that arose at the
  seam; a new field changes the emit schema and its reference for no reader.

## Risks / Trade-offs

- **The saved copy cannot show the archive's warnings or accepted risks** (D-br-6) → it says so and where they appear;
  the program brief and the archived change's on-demand brief carry them. D-br-7's guard against an account that leaves
  a deviation out holds in the saved copy only through a declared size breach.
- **A record written after the save is not in the copy** (D-br-6) → the copy's unread section says such records appear
  in the archived change's brief and the program brief, where a per-change sign-off's reader can still find them.
- **A failed save is silent at the defaults** → it is in the run record's `warnings`, and the third change's sign-off
  cannot go ahead without a saved copy, so the failure surfaces wherever a copy is needed.
- **Old archived changes have no account** → their briefs say so on every section that reads it; a program brief of an
  earlier program is mostly such lines. Nothing saves such a brief in this change.
- **Golden renders pin wording** → the two golden tests are the brief's contract for the third change and first-run's
  G5 grading; a wording change re-records them deliberately.
- **Two saves in one second** → the second draws the next token, as decision records do; only a writer racing another to
  the same name is refused, and at archive that refusal becomes a `warnings` entry.

## At archive

`orbit-program-brief` is a new capability: once synced, its `## Purpose` is written in place (the brief of a change and
of a program, `orbit brief`, the saved copy). `orbit-archive-modifications`' Purpose lists orbit's additions to the
archive flow and gains the saved brief. No delta carries `## Purpose`, so both are edited in place after the sync.

The new capability moves CLAUDE.md's marked capability figure from 32 to 33 (`<!-- src:capabilities -->`); after the sync,
`node bin/orbit.js validate --sources` checks it.

Until a release carrying `orbit brief` is installed, this archive's save step runs as
`node bin/orbit.js brief --change brief-render --save`: the installed `orbit` has no `brief` command, and its failure would
go silently into `warnings`, leaving task 5.3 no copy to read.

## Touchpoints

- `src/core/program-brief.ts` — the brief's model (both units), its render, and the save.
- `src/commands/brief.ts` — the `orbit brief` command.
- `src/cli/program.ts` — registration of `brief`.
- `src/core/completions/command-registry.ts` — the completion entry.
- `src/core/emit-composition.ts` — the no-overwrite publish, generalised to the serialized text.
- `src/core/pr/tail.ts` — `carried_untracked` leaves out saved briefs.
- `src/core/templates/workflows/archive-change.ts` + `src/core/templates/workflows/bulk-archive-change.ts` — the save step.
- `docs/cli.md` — the `orbit brief` section.
- `test/core/` — the brief, save and tail tests, the golden renders, the body test, and the moved pins.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure | owner's state | destination |
|---|---|---|---|
| D-br-1 | — | superseded (D-br-7) | not carried |
| D-br-7 | SOURCED | live rule | `orbit-program-brief`' `A brief tells the user what a change or a program did, from the trail` — a normative TABLE (the sections), its justification the sentence naming the stage charter's list and `orbit-review`'s named limit |
| D-br-2 | — | superseded (D-br-3) | not carried |
| D-br-3 | DERIVED | live rule | divided by member: the on-demand and failure rows to `orbit-program-brief`' `` `orbit brief` renders a brief read-only `` (SENTENCES); the save row and the program row (assigned to the third change, D-br-5) to `A change's brief is saved, never overwritten` (SENTENCES); the archive and stopped-archive rows to `orbit-archive-modifications`' `The archive saves the change's brief before the sync` — a normative TABLE, its justification the sentence naming the save's outcomes and the archive's one way to stop; the tail row to `PR-attached archive tail` (a SENTENCE) |
| D-br-4 | — | superseded (D-br-6) | not carried |
| D-br-6 | DERIVED | live rule | `orbit-program-brief`' `A brief says only what the archive recorded` — a normative TABLE, its justification the sentence naming the three archived states and the active one; the snapshot member as the paragraph after it |
| D-br-5 | — | scope | not carried |
