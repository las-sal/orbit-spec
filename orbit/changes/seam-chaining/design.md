## Context

Stage `seam-chaining` of `automate-dev-flow` (regime 2). Every lifecycle command is a skill the AI runs; the engine
computes `next_command` and gates and prompts for nothing (D-sc-1, see explore.md). So "chaining" can only mean that
the engine computes a permission and the body obeys it. Today `orbit-conventions`' `No-chaining contract` ends every
command at the eligibility line. This change is the first of the stage's two, split by grant (D-sc-19): it chains the
review-and-walk loop — review → address-reviews → review — and the start of it from propose, ff and apply. The second
change adds the apply and archive grants and `consent: "setting"` (D-sc-7), which make every requirement listing the
consent values as exactly two false.

Project settings are single keys in `orbit/config.yaml`, each read by one resolver with absent meaning today's
behaviour (`pr`, `review_preference`, `size_ceiling` in `src/core/project-config.ts`; D-sc-2). The change-level next
command is set only in `src/core/artifact-graph/instruction-loader.ts`, from the gate walk in
`src/core/artifact-graph/gates.ts` (Case 2 of explore.md): the review forms, `/orbit:address-reviews`, `/orbit:apply`
and `/orbit:archive`. The engine never names a review before an unpassed gate it skips (D-sc-15).

## Goals / Non-Goals

**Goals:**
- A `chain` setting granting review, external review and the walk, each on its own key, granting nothing when absent.
- A `chain` object in `orbit status --change --json` that alone decides whether the next command runs unasked.
- The five bodies that can end on a change's next command run it when the object allows, and stop otherwise.
- A chained review or walk takes routine defaults and stops at every real decision; each prompt says which it is.
- Nothing changes at the defaults (G0 as R-adf-12 words it): every prompt, readout and turn end as today.

**Non-Goals:**
- The apply and archive grants and the third consent value — the stage's second change (D-sc-19).
- Merging the stage's PR and returning to the default branch — the driver's settings (D-sc-17).
- Bounding what a run spends in tokens or money — a candidate follow-up program (D-sc-18).
- A per-program override of the setting — a named limit until the driver (D-sc-3).

## Decisions

1. **The engine decides; the body obeys** (D-sc-6 → D-sc-14). The `chain` object carries `next`, `configured`,
   `may_run`, `head` and, when refused, `why`. The body reads only `may_run` and `why`. Alternative considered: the AI
   reading config and gates itself — out, it puts a gate-shaped judgement in the body (explore.md, Considered & out).
2. **A map keyed by command, absent meaning not granted** (D-sc-5). Alternatives: a list of seams to stop at (an omitted
   seam would grant), a list of transitions (only the arriving command matters) — both out.
3. **`review-external` is its own key** (D-sc-16): an external review or blind pair reaches an outside service and costs
   money (ledger `ledger-2026-11-09T18-17-24Z.json`, area `cost`). Granting `review` never grants it.
4. **Five refusal reasons, tested in order** (D-sc-14): `none`, `not-granted`, `open-stop`, `needs-user`,
   `no-progress`. An unpassed gate is NOT a reason: it is what names the next review (D-sc-6, superseded).
   - `open-stop` reads the change's `decisions/` folder with `readDecisionFolder` and `chainOf` from
     `src/core/decision-records.ts`: a stop is open when no resolution's `stop` names any record of its chain.
   - `needs-user` reads `resolveExternalRunner` (`src/core/external-runner.ts`): no runner, or one not reachable,
     means the external half would be pasted.
   - `no-progress` needs to know what the chain just ran, and status is stateless, so the body passes back the `next`
     and `head` it read as `--chain-ran` and `--chain-head`. Apply's chunks name `/orbit:apply` again, but each chunk
     writes an emit, so the head moves and they run. Alternative considered: the engine inferring the previous command
     from the latest trail record — out, a launch that wrote nothing leaves no record to infer from.
5. **`chain` is not a gate-state input**, as `review_preference` is not: it enters no gate row, state, reason, position
   token or `next_command`, and the human `orbit status --change` output renders nothing of it.
6. **The body's end step.** In propose, ff, apply, review and address-reviews, the closing step reads `chain` from the
   same `orbit status --change <name> --json` call that supplies the eligibility line. On `may_run: true` it prints
   `Chaining: <next> (granted by chain.<key>)` after the eligibility line and runs the command; on `may_run: false`
   with `configured: true` it prints `Chain stops: <why>`; with `configured: false` it prints nothing more. The
   no-chaining epitome bullet in those five bodies gains the clause "unless the change status's `chain` object allows
   it". The other bodies keep theirs unchanged: none ends on a change's next command a key grants.
7. **Prompt kinds** (D-sc-12) and **tags** (D-sc-13), narrowed to the two arrival bodies, review and address-reviews.
   The tags are `(chain: target)`, `(chain: routine, default: <option>)`, `(chain: decision)`; the test reads the
   generated bodies and references, finds every `AskUserQuestion` site and every prose ask of the pause pattern, and
   fails on an untagged site or a tag the requirement's table does not name.
8. **A taken default is a sentence in `final_assessment`** (D-sc-20): `The chain took the default: <prompt> —
   <answer>.` A new payload field would join the payload tables, their schema references and executed examples, and
   make `orbit-emit-composition`'s "only" in `The write gate checks decision records` false.
9. **The blind pair's row 13** names the walk as chained only through the contract (`orbit-review`).
10. **The consent vocabulary is untouched here.** No key grants apply or archive, so `orbit-engine-gates`'
    `Gate declaration in schema YAML` ("entry into the gate's `before:` phase requires an explicit user invocation"),
    the ` — user-invoked` marker and every consent requirement stay true as written. The inflection prompt cannot fire
    on a chained arrival at a review or walk: neither is consent-marked or gated.

### Alternatives considered (from explore.md, Considered & out)

- A chain stopping at every prompt, routine confirmations included — out (archive asks before every sync, D-sc-11).
- Treating `@review:` markers and open tasks at archive as routine — out: both mean unfinished work (G2); they land with
  the archive grant in the second change.
- A list of transitions or of seams as the setting's shape; the AI deciding a chain itself; a per-program setting now;
  an unpassed gate as a reason to stop; sign-off and concurrency as this stage's settings — each out, see explore.md.
- One change carrying the apply and archive grants — out at propose (seven capabilities, D-sc-19).

## Risks / Trade-offs

- **D-sc-12** — the prompt list is a named limit, stated in `orbit-conventions`' `A chain treats each prompt by its kind`.
- **D-sc-13** — the tag test's reach is a named limit, stated in `orbit-conventions`' `Each chained prompt states its kind`.
- **D-sc-14** — the refusal reasons are a named limit, stated in `orbit-engine-gates`' `The change status says whether
  the next command may run unasked`.
- [A chained external launch may be refused by the harness] The recorded codex runner works only with the sandbox off,
  and on 2026-10-14 the harness refused such a launch the user had not invoked. → The refused launch writes nothing;
  `no-progress` stops the chain on the next read. The first-run trial must show a `review-external` grant reaches the
  harness (D-sc-16, FEASIBILITY).
- [A long chain grows the session's context] → A named limit until the driver, which clears context per phase (R-adf-8).
- [A review-and-walk loop that never converges spends without bound] → Each iteration writes records, so
  `no-progress` does not catch it; the tripwires stage's budget signal, and D-sc-18's follow-up program, own it.
- [Body text changes in five bodies] → G0's body clause allows setting-dependent text inert at the defaults (R-adf-12);
  tests that hash or pin body text are closed-set edits named at archive (R-adf-9).
- [The `chain` key in a project config read by an older orbit] → `ProjectConfigSchema` drops unknown keys, so an older
  install reads no grant: the safe direction.

## Touchpoints

- `src/core/project-config.ts` — the `chain` key in the schema and its resolver.
- `src/core/chain.ts` — the `chain` object's composition and the key table.
- `src/commands/workflow/status.ts` + `src/commands/workflow/shared.ts` — the object on the JSON, the two flags.
- `src/cli/program.ts` — `--chain-ran` and `--chain-head` registration.
- `src/core/templates/workflows/propose.ts` — the end step and epitome clause.
- `src/core/templates/workflows/ff-change.ts` — the end step and epitome clause.
- `src/core/templates/workflows/apply-change.ts` — the end step and epitome clause.
- `src/core/templates/workflows/review.ts` — the end step, epitome clause, blind-pair row 13, prompt tags.
- `src/core/templates/workflows/address-reviews.ts` — the end step, epitome clause, prompt tags, the taken-default sentence.
- `docs/customization.md` — the `chain` key beside the other project settings.
- `test/core/chain.test.ts` — the setting and the object.
- `test/core/templates/chain-prompt-tags.test.ts` — the tag test and the end-step surface.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure or state | owner's state | destination |
|---|---|---|---|
| D-sc-3 | DERIVED | live rule | `orbit-engine-gates`' `The chain setting grants each command on its own key` — SENTENCE (one resolver, absent or malformed grants nothing, no umbrella key) |
| D-sc-5 | SOURCED | live rule | the same requirement — TABLE (key → commands), its review and walk rows here; the apply and archive rows land with the stage's second change (D-sc-19) |
| D-sc-7 | SOURCED | live rule | none in this change: it lands with the stage's second change (D-sc-19); a deviation from row 4 recorded here, since this change grants no consent-scoped command |
| D-sc-12 | BOUNDED | live rule | `orbit-conventions`' `A chain treats each prompt by its kind` — TABLE narrowed to review and address-reviews; residual lines verbatim |
| D-sc-13 | BOUNDED | live rule | `orbit-conventions`' `Each chained prompt states its kind` — residual lines verbatim |
| D-sc-14 | BOUNDED | live rule | `orbit-engine-gates`' `The change status says whether the next command may run unasked` — TABLE; residual lines verbatim |
| D-sc-16 | DERIVED | live rule | `orbit-engine-gates`' `The chain setting grants each command on its own key` — TABLE (the `review` and `review-external` rows) |
| D-sc-1, D-sc-2, D-sc-11, D-sc-15 | — | fact | not carried |
| D-sc-4, D-sc-6, D-sc-8, D-sc-10 | — | superseded | not carried |
| D-sc-9 | — | assigned driver | not carried |
| D-sc-17, D-sc-18, D-sc-19, D-sc-20 | — | scope | not carried |
