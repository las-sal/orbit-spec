# Change: d4-review-consistency

## Why

Reviews are effective; their PRESENTATION varies per AI interpretation, and the address-reviews
walk drifts into batch questioning (D-arc Stage D4 charter). Two failure modes, one root: the
human-facing layer is authored fresh by a model on every pass. (1) The findings JSON is already
the source of truth, but the chat report is hand-rendered each time — across D3's fifteen
passes the same data produced fifteen formats (trend arrows, scorecard shapes, gate lines all
drifting), and twice the hand-authored layer contradicted the engine (a "PASSED" verdict the
gate computation disputed; next-lines diverging from `next_command`). (2) The walk's
AskUserQuestion prompt IS the presentation — terse option labels forcing "chat about this"
escapes, and a dismissed prompt loses the walk position and framing entirely (explore.md
D-d4-1..6; source: the user's direct experience plus the D3 cycle's own transcripts).

## What Changes

- **`orbit-report-rendering` (ADDED capability)** — the engine owns the human-facing review
  report as a PURE FUNCTION over the findings record (D-d4-1): same input, same bytes out,
  golden-tested (arc exit criterion 1). The report grammar sandwiches (D-d4-2): structured
  summary (header, engine-computed iteration/trend line, scorecard table, findings by
  severity, suppressed-with-evidence) → the ONE delimited AI `commentary` slot (verbatim from
  the emit; prohibited from stating counts, verdicts, or next commands) → the ENGINE tail
  (gate / position / eligibility from the live gate graph, computed at render time, never
  stored — the AI's framing can never be the last word on the gate). Strict/loud input
  validation (D-d4-6a): malformed records fail with a clean error naming the field; no partial
  render. External passes render from their PARSED form (D-d4-6b): one grammar for internal
  emits and external findings files; the external prompt template's markdown contract is
  unchanged. Surface (D-d4-5): the renderer lives under the status gateway —
  `orbit status --change <name> --report [<TS>]` (no argument = newest review pass; `<TS>`
  picks a specific one; non-renderable genres fail naming the renderable set; read-only,
  preserving the D3 invariant). No new verb; the sprint view's trimmed `last:` line becomes a
  zoom-in door.
- **`orbit-review` (MODIFIED)** — the review emit gains the authored `commentary` field; the
  iteration note becomes renderer-computed from the trail (never AI-authored); and a new
  requirement makes the report contract explicit: after persisting the emit, the body RUNS
  `orbit status --change <name> --report` and pastes the output verbatim as the report —
  hand-rendering the structured sections is PROHIBITED (greppable), and conversational
  engagement follows the pasted report (loose form, D-d4-2: the summary grounds, the
  conversation is the work).
- **`orbit-address-reviews` (MODIFIED)** — the walk becomes three lanes (D-d4-3/4): the triage
  step opens with a compact PREVIEW of everything headed for the obvious-fix lane before any
  fix lands (the over-classification guard — the user can pull any item into the decision lane
  with a word); decision-lane findings get a FULL-PROSE briefing in chat (meaning, stakes,
  terminology, options with tradeoffs) followed by genuine back-and-forth; the AskUserQuestion
  is demoted from presentation-carrier to OPTIONAL CLOSURE DEVICE (fires with the discussed
  conclusion as default only when the conversation needs a crisp end); a direction the user
  types in chat IS ratification (user-typed provenance, recorded with how it was expressed);
  a dismissed or inconclusive prompt re-presents the finding, losing nothing; batch PROMPTS
  (one AskUserQuestion spanning findings) are prohibited while batch DELEGATION (the user
  compressing the walk by explicit directive) survives as their prerogative.
- **Economy dividend rides this change (D-d4-6c)**: the report-format prose comes OUT of the
  review/address bodies — the deletion is criterion 1's enforcement mechanism. Broader
  body-slimming stays D5's.

Deferred, not rejected (recorded in explore.md): rendering address-reviews resolution logs
(the cheap later extension the genre-dispatch leaves open); any `--report --json` variant (the
emit IS the JSON); watch/refresh modes.

## Impact

- Affected specs: `orbit-report-rendering` (ADDED — 7 requirements),
  `orbit-review` (MODIFIED ×2 + ADDED ×1 — commentary field, renderer-computed iteration note,
  the run-and-paste report contract), `orbit-address-reviews` (MODIFIED ×3 — lifecycle lane
  preview, classification briefing protocol, the fork-to-closure-device rewrite). Baseline
  capabilities 17 → 18.
- Affected code: NEW `src/core/report-render.ts` (the pure render + strict validation;
  consumes the trail reader's parsed passes and `computeGateStates`),
  `src/commands/workflow/status.ts` + `src/cli/index.ts` (`--report` on the `--change` form),
  `src/core/templates/workflows/review.ts` + `address-reviews.ts` (body rewrites: run-and-paste
  + prohibition; the three-lane walk), golden + unit + CLI tests. Generated surface count
  unchanged (16 — no new workflow).
- Arc exit criteria: (1) golden byte-identity tests on the renderer; (2) the walk protocol
  body-text-checkable (prompt-never-precedes-briefing ordering, batch-prompt prohibition,
  dismissed-re-presents) plus one observed cycle post-apply.
