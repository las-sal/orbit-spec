## Why

`automate-dev-flow` lets orbit run a program with Sal present only where Sal adds value, and every later stage of it
needs two things recorded: the calls the AI makes on its own that affect the end user or involve security, and the
moments a run must stop for Sal (R-adf-3's six stop conditions). orbit has no record for either today. Its one
judgement record covers only three review-cadence moments (`orbit-run-summary-emit`'s `The judgement record — one
spine, two kinds`). This change, stage `decision-layer`, builds the records first, because chaining, the program brief
and the tripwires all read them (see explore.md, D-dl-1..9).

## What Changes

- Three new records, written through `orbit emit` (D-dl-2, D-dl-5):
  - **ledger entry** (`orbit emit ledger`): one call the AI made that falls in one of eighteen named areas, with what
    was decided, the alternatives, why, and what approved thing it relies on.
  - **stop record** (`orbit emit stop`): one of R-adf-3's six conditions arose; which one, what it is about, and the
    question for Sal.
  - **resolution** (`orbit emit resolution`): Sal's answer to a stop, and what happens next.
- The records are written for a reader who knows only the program's architecture doc (D-dl-1): each has plain-language
  fields, a technical detail field, and a list defining any new term the plain fields use (D-dl-6).
- orbit checks each record before writing it: the plain fields are present, every listed term is defined, the area is
  on the list, every citation exists, a ledger entry that relies on nothing points at the stop it raised, a resolution
  names a real stop, and no stop is resolved twice (D-dl-3).
- The records are kept in a `decisions/` folder inside the history of the work they belong to — the change's, the
  exploration's, or the architecture history (D-dl-5). Every existing history reader reads only the files directly in
  `.orbit-runs/`, so none of them sees the new folder, and today's flow is unchanged (G0).
- A stop halts nothing in this change: no setting exists yet, so every stop is a "would have stopped here" record
  (D-dl-7).
- Not in this change (D-dl-8): telling the AI to write these records (a fifth execution discipline in every generated
  skill), and the review step in which a reader checks that the records make sense. Both go to a follow-on stage.

## Capabilities

### New Capabilities

- `orbit-decision-records`: the three records — what each is for and carries, the plain-language rule and how it is
  held, the eighteen ledger areas, what a ledger entry may rely on, where the records are kept, and that they are
  written in every mode.

### Modified Capabilities

- `orbit-emit-composition`: the emit surface writes the three records. Modified: `Engine-owned spine composition and
  filename discipline` (the three commands take `--change` or `--doc`, write to the `decisions/` folder, and carry no
  `kind`), `Deterministic facts are engine-composed per command` (decision records carry no `next_recommended`),
  `Atomic next_recommended — pre-computable and post-write classes` (its two ways cover run summaries only) and
  `Write-gate validation via the shared normalizers` (decision records pass their own spine checks, not the run-summary
  ones). Added: the write gate's checks on the three records.

## Impact

- `src/core/emit-composition.ts`: three rows in the command table, the `decisions/` path, the record shape, the
  write-gate checks, and citation resolution.
- New tests over the three records; no existing test or generated skill changes.
- `docs/cli.md`: the `orbit emit` paragraph and its list of commands name the three new commands, which are not run
  summaries.
- `CLAUDE.md`: its marked capability figure goes from 31 to 32 when the archive adds `orbit-decision-records` to the
  baseline.
- No generated skill, existing reader, gate or readout changes (G0, as written).
- `automate-dev-flow`: a follow-on stage (writing the records, the reading step) and G0's rewording are Sal's, at the
  next architect session (D-dl-8, D-dl-9); this change does not edit the architecture doc.
