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

## Open questions

## Considered & out

## References

- `orbit/architecture/d-arc-arbitered-flow.md` — stage d4-review-consistency charter + exit criteria; rulings R-d-1..10
- `orbit/specs/orbit-review/spec.md`, `orbit/specs/orbit-address-reviews/spec.md` (if present — verify capability names) — the live review/resolution baselines this stage would modify
- The just-archived D3 cycle's `.orbit-runs/` (orbit/changes/archive/2026-07-21-d3-orientation/) — 15 passes of real report renders and walk transcripts, the freshest clunk corpus
