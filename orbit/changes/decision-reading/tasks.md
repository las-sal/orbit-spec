## 1. Replacement chains in the write gate

- [ ] 1.1 Add `replaces` to all three rows of `DECISION_PAYLOAD_FIELDS` in `src/core/decision-records.ts`, with its shape check (a `<record>-<TS>.json` filename of the same command)
- [ ] 1.2 Add chain resolution over a `decisions/` folder (latest in each chain; which record replaces which), and the `replaces` checks: same kind, same work, not already replaced, link fields unchanged per record (refusal names the first differing field)
- [ ] 1.3 Make the three link checks chain-aware: one resolution per stop counted per chain; a `raised_stop` or resolution `stop` naming a replaced stop, and a `resolution` citation naming a replaced resolution, are refused naming the latest in the chain
- [ ] 1.4 Tests for every scenario of `A record is fixed by a replacement, never edited` and the three new write-gate scenarios, each mutation-checked able to fail

## 2. The selection and the brief

- [ ] 2.1 Implement the selection in `src/core/decision-records.ts`: records written after the latest in-context system review emit on the change's history, latest in each chain; every record when there is no such emit
- [ ] 2.2 Implement the brief renderer: the parts of `The reading step's brief is rendered by orbit` in order (doc text, each record, the requirement text to its first scenario, resolution answer and effect, the explore decision's text, the area row, the condition wording, the named stop, time and work), with no `.orbit-runs/` path; markdown and `--json`
- [ ] 2.3 Add `src/commands/decisions.ts` and register `orbit decisions brief <change> [--json]` in `src/cli/program.ts`; read-only, exits zero on an empty selection
- [ ] 2.4 Name `orbit decisions brief` in `docs/cli.md` under the engine surfaces
- [ ] 2.5 Tests for every scenario of `The reading step's brief is rendered by orbit`, including a fixture whose brief is asserted to carry the doc and the records' content and no trail path, and one on a change with no records

## 3. The selection on the review and archive emits

- [ ] 3.1 Compute `decision_records_owed` on in-context `review --mode system` emits and `decision_records_unread` on archive emits in `src/core/emit-composition.ts`; both engine-owned and refused from a payload
- [ ] 3.2 Refuse an in-context system review payload that owed records and lists `reading` in neither `passes_run` nor `passes_skipped`
- [ ] 3.3 Name both fields in the review and archive run-summary schema references; confirm `orbit status`, the report render and the archive readout are byte-unchanged on a fixture with records
- [ ] 3.4 Tests for every scenario of `The reading's selection is recorded at review and archive`

## 4. The reading step in the review body

- [ ] 4.1 Add the reading step to the review skill's system-mode body and `references/passes-system.md` in `src/core/templates/workflows/review.ts`: when the brief selects records, render it, dispatch a clean subagent with it verbatim, fold its findings with `pass: "reading"` under Coherence, list `reading` in `passes_run` or `passes_skipped`; the reader rows (four) and the severity rule; not on fresh or external passes, not in proposal or architecture mode
- [ ] 4.2 Document `replaces` in the shared `references/decision-records.md` (composed in `src/core/disciplines.ts` from the payload table), including that one replacement carries every fix to one record and that link fields stay unchanged; extend its executed examples if the reference's test requires one per field
- [ ] 4.3 Tests for every scenario of `The reading step checks decision records in system review` that the generated surface can hold (the body carries the step, its trigger, its brief source, its fresh/external exclusion), and the generated-surface and hash-pin tests the edited skills move, each such edit recorded in this task

## 5. Close

- [ ] 5.1 `npm run build && node bin/orbit.js update --force`; run the full `npm test` and record the counts
- [ ] 5.2 Declare every delta scenario in the scenario map (`orbit status --change decision-reading --scenarios` shows none undeclared)
