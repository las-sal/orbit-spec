> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: d4-review-consistency

## Premise

D-arc Stage D4 — review-consistency. Reviews are effective; their PRESENTATION varies per AI
interpretation, and the address-reviews walk drifts into batch questioning. Two moves from the
stage charter: (1) deterministic report rendering — the findings JSON is already the source of
truth, so the ENGINE can render the human-facing report (internal and external identically),
removing per-AI variance and shrinking the generated bodies (an economy win from the same fix);
(2) a redesigned walk protocol — per-finding, present → DISCUSS IN CHAT → then ratify:
AskUserQuestion ratifies a discussion's conclusion rather than gating entry to it (the
dismissed-prompt-loses-context failure). Source material: home-env chat history for concrete
clunk instances.

Exit criteria (arc): (1) the same findings JSON produces a BYTE-IDENTICAL rendered report
regardless of which model ran the review (engine-rendered, golden-tested); (2) the
address-reviews walk provably follows discuss-then-ratify — finding N's ratification prompt
cannot precede its discussion's conclusion, batch prompts are prohibited in the body, and a
dismissed prompt loses nothing (the finding re-presents).

## Decisions

- **D-d4-1 (2026-07-22) — The rendered report is an engine frame + first-class AI commentary,
  both sourced from the JSON.** "Render" = a pure formatting function over the findings JSON
  (engine-owned, golden-tested; same bytes in, same bytes out). The report's structured body —
  scorecard, findings, suppressions, iteration/trend, gate line, position — is engine-rendered
  (trend/gate/position ENGINE-COMPUTED from the trail + gate graph, never AI-authored). AI
  color commentary is CRUCIAL, not residue: it becomes a designated `commentary` field in the
  emit JSON, rendered verbatim into one fixed, delimited slot. Byte-identity (exit criterion 1)
  is preserved because commentary is INPUT to the pure render, not free-form output — model-to-
  model variance moves into a quarantined field instead of leaking across the whole report.
  Rationale: the user wants both the predictable where-we-are/what-happened summary AND deeper
  AI insight; this gets each without costing the other.

- **D-d4-2 (2026-07-22) — Loose form in chat: the rendered report grounds, then free
  engagement follows.** A completed review's chat turn is the engine-rendered report (verbatim,
  the anchor) PLUS unconstrained conversational engagement after it — NOT report-only. The
  report skeleton sandwiches: structured summary first, the delimited `commentary` slot in the
  middle, and the ENGINE-owned gate/position/eligibility lines dead last (the AI's framing can
  never be the last word on the gate — the D3-cycle verdict lesson made structural). Commentary
  contract: everything the structure can't say (the pattern behind findings, what was probed,
  risk texture); PROHIBITED from stating counts, verdicts, or next commands (those exist only
  in engine sections — greppable, golden-testable). Byte-identity (exit criterion 1) binds the
  rendered REPORT artifact, not the whole chat turn. Rationale: "the structured summary is for
  grounding but the real focus is engagement with the AI to make the best thing possible" —
  predictability serves the conversation, never replaces it.

- **D-d4-3 (2026-07-22) — The walk is three lanes; conversation displaces the prompt as the
  medium.** (1) OBVIOUS-FIX lane: findings with one clear correct resolution are fixed by the
  AI with no discussion and no prompt (today's trivial-fix classification, affirmed). (2)
  DECISION lane: the finding is presented as a FULL-PROSE briefing in chat — what it means, why
  it matters, terminology level-set when concepts are novel, options with real tradeoffs —
  followed by genuine back-and-forth; the AskUserQuestion is demoted from presentation-carrier
  to CLOSURE DEVICE, firing (with the discussed conclusion as default) only when the
  conversation needs a crisp end. A direction the user types in chat IS ratification
  (user-typed provenance — the consent model's strongest signal; recorded in the resolution
  log with how it was expressed). (3) Dismissed or inconclusive → the finding re-presents,
  nothing lost. Root complaint being fixed: today the prompt IS the presentation — terse
  option labels forcing "chat about this" escapes; D4 inverts it — prose briefs, conversation
  decides, the prompt closes.

- **D-d4-4 (2026-07-22) — Three walk refinements ratified together.** (a) A chat directive is
  ALWAYS sufficient ratification in the decision lane; the AskUserQuestion is purely an
  optional closure device for discussions that trail off without a crisp directive — never a
  required formality (the resolution log records the chosen resolution with how it was
  expressed, chat or prompt). (b) The over-classification guard: the walk OPENS with a compact
  preview of everything headed for the obvious-fix lane BEFORE any fix lands, so the user can
  pull any item into the decision lane with a word — the guard is presentation-ordering, not a
  prompt. (c) Batch delegation survives as the user's prerogative: an explicit mid-walk
  directive ("handle the rest, only brief me on real decisions") compresses the decision lane
  by USER choice — distinct from the prohibited batch prompt (one AskUserQuestion spanning
  multiple findings), which stays dead.

- **D-d4-5 (2026-07-22) — The renderer lives under `orbit status` — the trail gateway, not a
  new verb.** The user's original conception of the emit JSONs: accessed in various ways
  through status, which stands as the gateway into the project's emitted state at every zoom
  level — bare (sprint) → `--full` (arc) → `--change <name>` (gates/artifacts) →
  `--change <name> --report [<TS>]` (the rendered review report; no argument = newest review
  emit, `<TS>` = a specific pass). The sprint view's trimmed `last:` line becomes a door
  instead of a dead end. Semantics wrinkle resolved in status's favor: the report BODY is the
  historical pass verbatim; the TAIL (gate/position/eligibility) is engine-computed at render
  time — a status view of a past pass, honestly labeled, never a stale stored copy. `--report`
  rides the `--change` form (consistent with the D3 engine-gates scoping; bare stays the
  sprint view); non-renderable emit genres fail with a clean error naming what is renderable
  (resolution-log rendering is the cheap later extension); read-only throughout (the D3
  invariant holds). Supersedes the sketched standalone `orbit render <emit>` verb — see
  Considered & out.

## Considered & out

- **Standalone `orbit render <emit>` verb (self-identifying genre from the spine)** — rejected
  2026-07-22 in favor of the status gateway (D-d4-5): a second verb splits the trail's access
  story, loses the sprint-view zoom-in continuity, and renders the current-tail semantics
  oddly (a "document renderer" printing today's gate line); the genre-inference idea survives
  INSIDE `--report` (the emit's spine `command` field decides renderability).

## References

- `orbit/architecture/d-arc-arbitered-flow.md` — stage d4-review-consistency charter + exit criteria; rulings R-d-1..10
- `orbit/specs/orbit-review/spec.md`, `orbit/specs/orbit-address-reviews/spec.md` (if present — verify capability names) — the live review/resolution baselines this stage would modify
- The just-archived D3 cycle's `.orbit-runs/` (orbit/changes/archive/2026-07-21-d3-orientation/) — 15 passes of real report renders and walk transcripts, the freshest clunk corpus
