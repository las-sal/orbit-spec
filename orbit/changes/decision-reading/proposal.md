## Why

decision-writing made the AI write decision records, and nothing checks yet whether a record makes sense to the person
it is written for. `orbit-decision-records`' `The plain-language rule is held by structure and by a reader` assigns
three failures to a reader (a new term left undefined, a field leaning on implementation detail, a field that is
correct and still unclear), and its named limit says those rows are covered by no step until stage `decision-reading`
of `automate-dev-flow` ships. A probe over the program's four real ledger entries found one warning and nine
suggestions, the worst a paraphrase of a cited ruling that drops its qualifier (see `explore.md`, D-dr-1). This change
builds the reader.

## What Changes

- **A reading step in system review.** The in-context system pass dispatches a clean reader, given only a brief orbit
  renders, over the decision records written since the last reading. The reader's findings join that pass's review
  emit and are walked like any finding. It is not a numbered pass, so system mode keeps its seven, and it runs at every
  depth whenever records are selected (D-dr-2, D-dr-8).
- **`orbit decisions brief <change>`**, a read-only command that renders that brief: the architecture doc, each
  selected record, and what each record points at: the text of each cited requirement, resolution or explore decision,
  its area's row, its stop condition's wording, the stop it names, and when and in what work it was written (D-dr-6).
  The brief carries content, never a `.orbit-runs/` path.
- **A fourth reader row**: a plain field that restates something the record cites so that its meaning shifts
  (D-dr-7). The named limit "covered by no step" is retired.
- **Replacement records.** A record is fixed by a new record of the same kind carrying `replaces: <filename>`, with
  every link field unchanged; one replacement carries every fix to one record. The write gate's link checks follow
  chains to their latest record (D-dw-1, D-dr-4).
- **The selection is recorded.** The in-context system review emit records which records it owed a reading, and is
  refused when it owed one and lists the reading in neither `passes_run` nor `passes_skipped`. The archive emit
  records how many records no reading saw, in its run record only (D-dr-3, D-dr-5).
- **A departure from G0 as worded, ratified by the user at propose**: the reading runs by default, so a system review
  of a change with records adds work and findings it did not have before. The user chose this over a default-off
  setting (stop `stop-2026-11-09T00-29-52Z.json` and its resolution); G0's rewording is the user's, at the program's
  next architect session.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-decision-records`: the plain-language rule gains the fourth reader row, its "covered by no step" limit
  retires, and the reader's knowledge is stated to include what a record points at; new requirements for replacement
  records and for the brief orbit renders and how it selects records.
- `orbit-emit-composition`: the decision-record write gate accepts `replaces` and follows chains in its link checks; a
  new requirement for the engine-computed selection on the in-context system review emit and the unread count on the
  archive emit.
- `orbit-review`: a new requirement for the reading step in system review.

## Impact

- `src/core/decision-records.ts` (the `replaces` field, chain-aware link checks, the selection, the brief renderer);
  `src/core/emit-composition.ts` (the review and archive computed fields and the review refusal); a new
  `orbit decisions brief` command registered in `src/cli/program.ts`.
- The review skill's template (`src/core/templates/workflows/`) and its `references/passes-system.md` gain the
  reading step; the shared `references/decision-records.md` gains `replaces`, composed from the payload table.
- `docs/cli.md` names the new command (the command-coverage check owes it).
- Tests: fixtures with and without records, the rendered brief, the chain checks, the review refusal and the archive
  count. Closed-set tests the new field or command extends (the decision payload table, hash pins on edited skills)
  move, and are named at archive (R-adf-9).
