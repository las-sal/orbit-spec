## Context

Stage `decision-layer` of `automate-dev-flow` (see `explore.md`, D-dl-1..9, which this design cites rather than
restates). orbit's emit surface (`orbit emit <command>`, `orbit-emit-composition`) composes every run summary from a
narrative-only payload and refuses a malformed one before writing. Its one judgement record
(`orbit-run-summary-emit`'s `The judgement record — one spine, two kinds`) covers three review-cadence moments only and
explicitly excludes method and scope calls. Nothing records an end-user or security call the AI makes, or a moment a run
needed Sal. Every later stage of the program — seam-chaining, program-brief, tripwires, driver — reads such records, so
they come first.

## Goals / Non-Goals

**Goals:**
- Three records — ledger entry, stop record, resolution — written through `orbit emit` and checked before writing
  (D-dl-2, D-dl-5).
- Each record's plain-language fields readable by someone who knows only the architecture doc, held by structure
  (D-dl-1, D-dl-6).
- The eighteen areas and the citable kinds stated in the owning spec, each with its gap named (D-dl-3, D-dl-4).
- G0 as written: no generated skill, existing reader, gate or readout changes; the existing test suite passes unedited.

**Non-Goals:**
- Telling the AI to write the records (a fifth execution discipline in every skill) and the review step in which a
  reader checks them (D-dl-8: a follow-on stage).
- Any setting, and any halting: a stop record halts nothing here (D-dl-7).
- Raising `tripwire` stops (stage `tripwires`).
- Rewording G0 (D-dl-9: Sal's, at architect).

## Decisions

1. **A `decisions/` child of each history folder, not the history folder itself.** Every reader of run summaries
   lists only the files directly in `.orbit-runs/` and filters by filename: `src/core/orientation.ts` (lines ~161, ~209,
   `endsWith('.json')`), `src/core/report-render.ts` (~1001, ~1040, by `parseTsToken`), and the apply-boundary reads in
   `src/core/emit-composition.ts` (~1590, ~1617, by an `apply-` pattern). A `decisions` directory entry matches none of
   them, so no reader sees the records and none needs changing (G0). Writing the records beside the run summaries
   instead would put a `ledger-<TS>.json` where `orbit status` picks the latest record's `next_recommended` — a record
   that recommends nothing would become the change's "next". Alternative: a separate top-level folder
   (`orbit/decisions/<change>/`). Rejected: it would not move with the change at archive or at propose, which the
   history folder already does (D-dl-5).
2. **Decision records are not run summaries.** They carry `command`, `timestamp`, `change` (and `doc` when
   architecture-scoped) and `model`, and no `kind`, `final_assessment` or `next_recommended`. Giving them a fourth
   `kind` would make `orbit-conventions`' spine enumeration and per-kind command lists false and bring in a third
   capability; giving them `workflow` would misstate what they are. The surface treats them as a separate family that
   shares the payload contract.
3. **Three commands, not one with a discriminator.** `orbit emit ledger | stop | resolution` gives each record its own
   payload table and filename prefix, so a history listing shows what each file is. Alternative: one `decision` command
   with a `record` field. Rejected: one table with three conditional shapes is what the per-command table exists to
   avoid.
4. **Records are checked in a new module.** `src/core/decision-records.ts` holds the eighteen ids, the six condition
   names, the shape checks and citation resolution; `emit-composition.ts` gains the three table rows and calls it. Keeps
   the 2,341-line composition module from growing a second record family inline.
5. **A stop is named by its filename; a precedent resolution by its repo path.** A ledger entry's `raised_stop` and a
   resolution's `stop` are filenames in the same `decisions/` folder, because the stop they name is always in it. A
   resolution cited as precedent may come from any change, including an archived one, so it is a repo-relative path.
6. **Ruling and goal citations are read from the doc's own sections.** A ruling exists when `**<id>**` appears under
   `## Rulings index`; a goal when `**<id>` opens an item under `## Goals` — the forms every parseable architecture doc
   uses today (`automate-dev-flow.md`: `**R-adf-1**`, `**G0 — …**`). A requirement citation reads only the baseline
   (`orbit/specs/`), not the change's own delta: a requirement being proposed is not yet approved.
7. **Archived changes are not a decision-record target.** `--change` resolves an active change or a staging
   exploration only. A decision is recorded while the work is live; the archive fallback `address-reviews` uses exists
   for walks of finished work.

## Alternatives considered

From `explore.md`'s Considered & out: a catch-all test ("would the user notice, or is anything put at risk?") beside the
eighteen areas — out (Sal): it makes every call arguable and the AI applies it. From the exploration's open questions
(D-dl-5): a new kind inside the existing `judgements` array — out, it is anchored to three cadence moments; a plain
`ledger.md` — out, nothing checks it. One merged ledger-and-stop record (D-dl-2's rationale) — out: it would put calls
that are not about the user into the ledger Sal reads at sign-off.

## Risks / Trade-offs

- **D-dl-1's residual** (a prose field or surface added later) → named limit in `orbit-decision-records`' `Decision
  records are written for a reader who knows only the architecture`.
- **D-dl-3's residual** (an approved source of another kind) → named limit in `A ledger entry names what it relies on`;
  such a citation is refused at write, which surfaces it.
- **D-dl-4's residual** (a qualifying call in no area) → named limit in `The ledger's eighteen areas`; G4's closing
  review finds such calls.
- [Records nobody writes] Until the follow-on stage adds the instruction, no skill tells the AI to write a record
  (D-dl-8) → stated as a named limit in `Decision records are written in every mode`; the records are built and tested
  first, and the follow-on stage is Sal's to declare.
- [The reader half of D-dl-6 is not wired] → stated as a named limit in `The plain-language rule is held by structure
  and by a reader`.
- [Citation forms are textual] A ruling or goal written in some other markup than bold would not resolve → the
  refusal names the citation, so the mismatch surfaces at the first write rather than silently passing.
- [A later reader descends into `.orbit-runs/` recursively] It would see decision records as unknown files → each
  reader today filters by filename, and the decision records' prefixes (`ledger-`, `stop-`, `resolution-`) match no
  run-summary pattern.

## Touchpoints

- `src/core/decision-records.ts` — new: the areas, the conditions, shape checks, citation resolution.
- `src/core/emit-composition.ts` — three table rows, dual scope, the `decisions/` path and its identity check, the
  no-kind spine, the no-recommendation rule, the call into the new module.
- `test/core/decision-records.test.ts` — new: every refusal and acceptance in the two specs.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-dl-1 | BOUNDED | live rule | `orbit-decision-records` › `Decision records are written for a reader who knows only the architecture` (table; residual verbatim) |
| D-dl-2 | SOURCED | live rule | `orbit-decision-records` › `Three decision records, one job each` (table) |
| D-dl-3 | BOUNDED | live rule | `orbit-decision-records` › `A ledger entry names what it relies on` (table; residual verbatim) |
| D-dl-4 | BOUNDED | live rule | `orbit-decision-records` › `The ledger's eighteen areas` (table; residual verbatim) |
| D-dl-5 | SOURCED | live rule | `orbit-decision-records` › `Where decision records are kept` (table) |
| D-dl-6 | DERIVED | live rule | `orbit-decision-records` › `The plain-language rule is held by structure and by a reader` (table) |
| D-dl-7 | SOURCED | live rule | `orbit-decision-records` › `Decision records are written in every mode` (sentence naming the source: the three regimes of `automate-dev-flow`'s Premise) |
| D-dl-8 | — | not a live rule (`Kind: scope`) | not carried |
| D-dl-9 | — | not a live rule (`Kind: scope`) | not carried |
