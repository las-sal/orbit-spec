## Context

Stage `decision-reading` of `automate-dev-flow`. decision-writing shipped the fifth execution discipline, so the AI
writes ledger entries, stops and resolutions under every setting. `orbit-decision-records`' plain-language rule has two
halves: the write gate holds its form rows, and the reader rows (an undefined term, a field leaning on detail, a field
that is correct and still unclear) are covered by no step. This change builds that step, the replacement chain that
fixes what it finds, and the bookkeeping that shows what it read. The design was settled in `explore.md` (D-dr-1 to
D-dr-8, D-dw-1 carried from decision-writing); this document cites it rather than restating it.

The probe behind it (`sketches/probe-2026-11-08.md`): a clean subagent given the architecture doc and the program's four
real ledger entries found one WARNING and nine SUGGESTIONs, and every record was still restatable. Its one WARNING was a
restatement of R-adf-3 that dropped a qualifier. Three of its gaps were the brief's (cited requirement text, the area
list, when and in what work a record was written), not the records'.

## Goals / Non-Goals

**Goals:**
- The stage's exit criteria: the reading step runs on a fixture change that carries records and not on one without,
  and its brief is shown to carry no knowledge of the work beyond the architecture doc and the records' content (what
  each record points at included), its only other text the fixed reader's task orbit renders (decision 5); a
  replacement passes every link
  check its original passed, and a link to a replaced record is refused naming its replacement.
- A reader can check what a record relies on, because the brief carries what each record points at (D-dr-6).
- Nothing read is read twice, and what no reading saw is counted (D-dr-2, D-dr-3).

**Non-Goals:**
- Reading records of an architect session (the architecture trail): a named limit.
- Reading the records written by the walk of the last in-context pass: a named limit, counted at archive.
- Judging whether a citation COVERS a decision: that is G4's closing review (`A ledger entry names what it relies on`).
- Any setting. The reading runs by default (decision 1).

## Decisions

1. **The reading runs by default; G0 as worded does not hold.** G0 says a default install behaves exactly as today and a
   generated body changes only by additions that tell the AI to record something. The reading adds review work and
   findings, and records are already written by default, so every system review of a change with records changes. The
   exploration's CONFORM moves on D-dr-2 and D-dr-8 claimed G0 held because the reading folds into an existing emit;
   that missed the findings it adds and the walk they need. At propose the user was asked (stop
   `stop-2026-11-09T00-29-52Z.json`, condition `ruling-amendment`) and chose to relax G0: "orbit has one user - me. so
   i'd prefer to do the best thing here for future users" (resolution `resolution-2026-11-09T00-41-57Z.json`; ledger
   `ledger-2026-11-09T00-42-12Z.json`, area `defaults`). Alternative: a default-off setting owned by
   `orbit-decision-records` (G0 holds; future users must know to enable a check that protects them). Rewording G0 is
   the user's, at the program's next architect session; this change's archive names the departure.

2. **The reading is its own step, not part of Pass 4 (a refinement of D-dr-8).** D-dr-8 placed the reading "inside
   system Pass 4" to keep the pass count. Measured at propose: `System mode runs verify-change + six system-wide
   passes` skips Pass 4 when no perspectives are defined and under `--fast`, so a reading inside Pass 4 would contradict
   two of its scenarios, and modifying that requirement would carry all eleven of its scenarios into the delta. D-dr-8's
   three properties are kept another way: the reading is a named step (`pass: "reading"`) outside the seven, so the
   count holds; its own trigger (selected records) makes it run regardless of lenses or depth, which is D-dr-8's FALSIFY
   finding; and its brief rule is D-dr-8's. Scoring under Coherence matches Pass 4's dimension.

3. **A record is read when a reading lists it (D-dr-2, refined at the proposal walk).** D-dr-2 selects "records new
   since the last reading", and propose first computed that as a timestamp cut-off at the newest in-context
   system review emit. Both reviewers of the proposal showed it loses records: a skipped reading's own emit moves the cutoff,
   a record written between the brief and the emit falls behind it, and tokens in `decisions/` and `.orbit-runs/` are
   allocated independently, so neither can be ordered against the other. The user chose explicit coverage instead:
   the in-context system review payload lists, in `decision_records_read`, the records its reader's brief rendered,
   and the selection is the latest record in each chain that no such emit lists. No timestamp is compared. The brief,
   the read-list check, the review emit's `decision_records_owed` and the archive emit's `decision_records_unread` all
   call one function in `src/core/decision-records.ts`. A replacement is a new record, so it is read at the next pass.

4. **A pass that owed a reading must say so.** The review emit refuses an in-context system payload that owed records
   and lists `reading` in neither `passes_run` nor `passes_skipped`. That makes a skipped reading visible without making
   orbit judge the reader (R-crc-10); see `orbit-emit-composition`'s `The reading's selection is recorded at review and
   archive`. The same requirement refuses a read list without a reading, a reading without a read list, and a read
   list naming a record outside the selection. Alternative: no refusal (a body that forgot the step would leave no trace) or a reader-output check (orbit
   would be judging prose).

5. **One command renders the brief (D-dw-5, D-dr-6).** `orbit decisions brief <change> [--json]`, read-only, so the
   brief a test inspects is the brief the reader gets. The review body passes its output verbatim. The parts and their
   order are `orbit-decision-records`' `The reading step's brief is rendered by orbit`. A requirement citation renders the
   requirement from its heading to its first scenario, from the baseline spec. Refined at the proposal walk: the brief
   names each record by its bare filename and ends with the reader's task (the four reader rows, the severity rule,
   the return shape), so the session adds nothing and the reader's findings map back to records; text it quotes is
   rendered whole, paths inside it included, since the ban is on pointing the reader at a file, not on quoted text;
   and a brief is whole or absent, a failed source exiting non-zero. A stop's condition is worded from orbit's own
   table in `Three decision records, one job each`, not from R-adf-3 as D-dr-6 said: the five conditions are orbit's,
   defined for every install, and R-adf-3 is this program's ruling, which an adopter's architecture doc does not hold.
   The stage's exit criterion says the brief carries "only the architecture doc and the records"; this change reads
   that "only" as no knowledge of the work beyond them, so the fixed task text meets it. Rewording the criterion to
   say so is the user's, at the program's next architect session, beside G0's rewording (decision 1).

6. **Replacements (D-dw-1, D-dr-4).** `replaces` joins all three payload tables; the link fields a replacement keeps are
   per record (ledger: `area`, `relies_on`, `raised_stop`; stop: `condition`; resolution: `stop`). The walk writes one
   replacement per record however many findings it resolves on it. A replacement's carried links are exempt from the
   replaced-target check (the user's choice at the proposal walk, over re-pointing them to the latest in each chain):
   they are not new, so the equality check stays a byte equality and a record whose target was replaced can still be
   reworded. The at-most-one-resolution rule counts over the whole stop chain, so a stop answered through its earlier
   record is not answered again through its replacement. A replacement is written through the same `orbit
   emit` command as the original, and the shared `references/decision-records.md` documents `replaces`, composed from
   `DECISION_PAYLOAD_FIELDS` as every other field is. No `orbit-address-reviews` requirement changes: a reading finding's
   resolution is an emit the walk runs, never an edit of the record, and the cascade's OUT — audit trail category
   (`Ripple cascade by default`) still keeps every ripple edit out of `.orbit-runs/`. How the walk records it is
   settled here, not at apply (the proposal walk): `A record is fixed by a replacement, never edited` says the entry's
   sweep names the replacement under `introduced` and the replaced record under `kept`, which the sweep gate
   (`The walk write gate checks sweep evidence`) accepts as it stands; the address-reviews body gains that sentence,
   an addition telling the AI to record something. A gap in the brief is recorded `deferred`, against the brief's
   requirement, since only orbit's code can fix it.

7. **The fourth reader row (D-dr-7).** A restatement that shifts what it cites is its own row, and
   `Decision records are written for a reader who knows only the architecture` says a restatement keeps the cited
   text's meaning.

8. **The reading step does not judge who wrote a cited decision (the proposal walk).** The baseline's `A ledger entry
   names what it relies on` named the reading step, with G4's closing review, as where a citation of an explore
   decision the AI wrote is found. This reader judges wording, and `explore.md` records no author, so the requirement
   is carried and the sentence leaves the reading step out. Alternative: a reader row and an authorship part in the
   brief, which needs an author record nothing writes.

## Touchpoints

- `src/core/decision-records.ts` — `replaces` in `DECISION_PAYLOAD_FIELDS`; chain resolution; chain-aware link checks; the selection; the brief renderer.
- `src/core/emit-composition.ts` — `decision_records_owed` on in-context system review emits, `decision_records_unread` on archive emits, the review refusal.
- `src/commands/decisions.ts` — the new `orbit decisions brief` command.
- `src/cli/program.ts` — registration.
- `src/core/completions/command-registry.ts` — the completion registry entry the parity test owes.
- `src/core/templates/workflows/review.ts` — the reading step in the system-mode body and `references/passes-system.md`; the run-summary schema reference names `decision_records_owed` and the `reading` pass id.
- `src/core/templates/workflows/archive-change.ts` — the archive schema reference names `decision_records_unread`.
- `src/core/templates/workflows/address-reviews.ts` — the sentence on how a replacement is recorded in a walk entry's sweep.
- `src/core/disciplines.ts` — the shared `references/decision-records.md` documents `replaces`.
- `docs/cli.md` — the command-coverage check owes `orbit decisions brief`.
- `test/core/` — the fixtures and tests the tasks name.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-dr-1 | — | fact | not carried (history) |
| D-dr-2 | BOUNDED | live rule | `orbit-review`'s `The reading step checks decision records in system review` (named limit, verbatim); refined by decision 3 |
| D-dr-3 | — | scope | not carried (history) |
| D-dr-4 | BOUNDED | live rule | `orbit-decision-records`' `A record is fixed by a replacement, never edited` (second named limit, verbatim) |
| D-dr-5 | — | scope | not carried (history) |
| D-dr-6 | SOURCED | live rule | `orbit-decision-records`' `The reading step's brief is rendered by orbit` — a normative TABLE (the parts rendered), the source sentence naming the payload tables; refined by decision 5 |
| D-dr-7 | BOUNDED | live rule | `orbit-decision-records`' `The plain-language rule is held by structure and by a reader` (named limit, verbatim) |
| D-dr-8 | SOURCED | live rule | `orbit-review`'s `The reading step checks decision records in system review` — a normative TABLE (where it runs); refined by decision 2 |
| D-dw-1 | BOUNDED | live rule | `orbit-decision-records`' `A record is fixed by a replacement, never edited` (named limit, verbatim) |
| D-dw-2 | — | superseded D-dr-2 | not carried (history) |
| D-dw-5 | — | superseded D-dr-6 | not carried (history) |

## Risks / Trade-offs

- [G0 departure] → decision 1; the archive names it, and G0's rewording is the user's at the next architect session.
- [D-dr-2: records no reading reaches] → named limit in `orbit-review`'s `The reading step checks decision records in system review`.
- [D-dr-4: a reader finding no repair row fits] → named limit in `orbit-decision-records`' `A record is fixed by a replacement, never edited`.
- [D-dr-7: a way a record misleads that no row names] → named limit in `orbit-decision-records`' `The plain-language rule is held by structure and by a reader`.
- [D-dw-1: a later reader of `decisions/` that reads a replaced record as current] → named limit in `orbit-decision-records`' `A record is fixed by a replacement, never edited`.
- [A cited requirement rendered from the baseline while the change rewrites it] → named limit in `The reading step's brief is rendered by orbit`.
- [A record written during the in-context pass, after the brief was rendered] → it is in that emit's `decision_records_owed` and not its `decision_records_read`, so it stays selected for the next reading and is counted at archive if none runs (decision 3).
- [Reader findings have a `file` under `.orbit-runs/`] → the walk's cascade treats the trail as OUT (audit trail); a reading finding is resolved by an emit, never an edit, so the cascade never needs to write there. The verification pass's residual check excludes the trail already.
- [Cost] → one subagent per in-context system pass with selected records; the probe took two tool uses.

## Alternatives considered

From `explore.md`'s Considered & out:
- The unread count as a line in archive's readout — changes a readout at default settings; the program brief brings it to the user.
- Editing a record in place — breaks the rule that history is never rewritten, and loses what the reader was first shown.
- The reading step as its own review mode (`--as records`) — a new trail genre and gate slot for one pass.
- The reading step at archive — too late for a walk.
- The reading inside Pass 4 — refined at propose (decision 2).
- A default-off setting for the reading — declined by the user at propose (decision 1).
