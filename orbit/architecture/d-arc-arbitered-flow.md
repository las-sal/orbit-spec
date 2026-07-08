# D-arc — The Arbitered Flow (orbit program architecture)

A program-level architecture document spanning multiple explorations and changes. **This is
design-direction, not an OpenSpec change** — explorations and proposals are staged against it,
cite it, and it is updated as stages archive. It is the hand-rolled predecessor of the
`/orbit:architect` capability it itself contains (Stage D2 formalizes this document's genre);
until then, this document is maintained by hand, dogfooding the shape.

Genre precedents: `../home-env/architect-host-first-strategy.md` +
`vendor-backends-strategy.md` (the "strategy doc changes are proposed against" pattern, grown
independently there), and this repo's own `orbit/explore/fork-and-orbify/explore.md` (the A→C
fork program — a program plan that lived in an explore's clothing because no better home
existed). Two projects growing the same organ independently is the evidence this layer is real.

## Premise

The fork program (A1 → B1–B3 → C1 → C2) is complete: orbit is a self-contained tool whose engine
computes the workflow and whose review cadence demonstrably catches real bugs. This arc is about
what orbit should BE now that it works — honed from sustained daily use (orbit-spec itself,
home-env, and the C2 delivery session):

1. **An AI can generate complex code predictably, matching the user's requirements and
   expectations** — the details governing generation live in written artifacts more permanent
   than any context window. (Largely achieved; this arc protects and sharpens it.)
2. **The developer executes a predictable, easy flow and never gets lost in it.** AI velocity is
   the power; user disorientation is the danger. The USER is the arbiter of the canonical flow —
   `explore → propose → ⟲ proposal review → apply → ⟲ system review → archive` — and of every
   transition in it.
3. **Token and context-window economy is a governing constraint**, weighed in every stage's
   decisions: what each command forces into context, what the AI re-narrates versus the engine
   renders, what a fresh session must read to boot a phase.

Motivating incidents: the C2 session's AI-driven auto-archive + unrequested PR (Stage D1's
origin); multi-session disorientation across 3–4 concurrent changes and step-away-and-return
(D3); review presentation varying per AI interpretation and batch-prompt walks losing discussion
context (D4); generated skills growing large while the AI occasionally drifts back to upstream
flow instead of native orbit commands (D5); and the program-layer gap both home-env and this repo
patched by hand (D2).

## Program stages

### Stage D1 — explicit-lifecycle-consent (IN FLIGHT)

`orbit/explore/explicit-lifecycle-consent/` — 7 decisions, 5 open questions; near-converged.
The consent/arbiter layer: AskUserQuestion as the only harness-enforceable primitive (D-elc-1);
provenance-conditioned consent prompts — user-typed commands never prompt, AI-mediated arrivals
at the gated seams (`→ apply`, `→ archive`) must (D-elc-2/7); the no-chaining contract — the AI
recommends, never invokes (D-elc-3); eligibility phrasing replacing imperative readouts
(D-elc-4); consent provenance in emits (D-elc-5); PRs as a designed lifecycle step — draft at
propose, READY at archive, merge human (D-elc-6). Remaining: emit field shape, CLI-direct
boundary, draft→READY trigger, PR-open ratification, branch bite-size — plus the Layer-1 option
(declare the consent set as gate data in the schema rather than body prose).

### Stage D2 — architect (the program layer; TOP OF LIST)

Formalize this document's genre as a first-class capability: `/orbit:architect` produces a
durable artifact (home: `orbit/architecture/`) that is NEVER consumed by propose — explorations
and changes cite it; it tracks which stages have archived; audit-drift checks baseline reality
against it (a stale architecture doc is the most expensive drift there is). Answers the
program-level half of "where am I" (D3 answers the positional half). Sources: home-env's two
strategy docs and its chat history (an extended record of real orbit use, including where the
flow is clunky); `fork-and-orbify/explore.md` as the prior in-repo instance; THIS document as
the live dogfood. Open design territory: artifact shape (stages, goals, terminology rulings,
companion-doc links, archive back-references), update triggers (stage archive → status log
entry?), relationship to explore (architect frames many explores; explore feeds one change).

### Stage D3 — orientation (status absorption)

The positional half of "where am I": a surface answering, across ALL active changes at once —
what phase is each in, what workflow command ran last, what are the one-or-two sensible next
commands — cheap enough to consult after a day away, without burning a session's context to
reconstruct state. The data already exists (emits carry `command` + `next_recommended`; the
engine computes `position`/`next_command`); the surface doesn't. Absorbs the `~/code/orbit-status`
test project as first-class engine functionality (issue #3; extend built-in `orbit status`).
Constraint from D1: renders eligibility, never imperatives; constraint from goal 3: reading it
must cost near-zero context.

### Stage D4 — review-consistency

Reviews are effective; their PRESENTATION varies per AI interpretation, and the address-reviews
walk drifts into batch questioning. Two moves: (1) make report rendering deterministic — the
findings JSON is already the source of truth; the ENGINE can render the human-facing report
(internal and external identically), removing per-AI variance and shrinking the bodies (economy
win from the same fix); (2) redesign the walk protocol: per-finding, present → DISCUSS IN CHAT →
then ratify; AskUserQuestion ratifies a discussion's conclusion rather than gating entry to it
(the dismissed-prompt-loses-context failure). Source: home-env chat history for concrete clunk
instances.

### Stage D5 — context-economy, native execution, and model strategy

Three braided threads, one governing concern (what's in the window and who's reading it):

- **Skill size / native execution**: audit generated bodies; move rarely-needed detail to
  `references/` (B2 built the machinery; the bodies kept growing inline); move mechanical work
  (report rendering, checklist grading, summary composition) from AI prose into the engine;
  ensure the AI executes orbit natively instead of drifting to upstream flow.
- **Model-per-phase strategy**: orbit's artifacts ARE the handoff material — every phase boundary
  is a designed context reset, so model switching is naming who sits at existing seams. Working
  hypothesis (Sal, 2026-07-08): strongest reasoner for explore/architect (judgment-dense,
  token-light); same tier for propose/requirements (normative text gates everything downstream —
  do NOT economize here); coding model at apply (the token furnace — and the spec-driven bet made
  explicit: SPEC RIGOR IS WHAT BUYS CHEAP APPLY); review models chosen for DIVERSITY from the
  authoring model (C1+C2 empirics: the external slot caught what same-model passes missed).
  Switch only at phase boundaries, never within one. Mechanism: `models:` hints in
  `orbit/config.yaml`, echoed by eligibility readouts, never enforced by bodies.
- **Handoff/boot formalization**: generalize the C2 HANDOFF.md pattern — per-phase boot material
  a fresh session (or different model) reads to pick up cold; record model identity in emits
  (provenance: which model authored these specs / this review).

## Cross-cutting constraint

**Token/context economy is a decision criterion in every stage above**, not a stage of its own
(D5 carries the dedicated mechanisms, but D2–D4 each weigh it: architect docs must be cheap to
consult; orientation must cost near-zero context; engine-rendered reports save narration
tokens).

## Sequencing and rules of engagement

- **Order**: D1 finishes first (near-converged) → D2 (top of list; retrofits this document) →
  D3 → D4 → D5, with D3–D5 order flexible and economy decisions landing inside whichever stage
  touches them first.
- **One exploration in flight per stage**; each stage spins its `orbit/explore/<name>/` when its
  turn comes, citing this document. Stage premises live HERE until then (deliberately: an
  `orbit/explore/` dir means "actively being thought about").
- **Every lifecycle transition in this arc is user-invoked** — this arc practices D1's contract
  before D1 ships it: the AI recommends; Sal types the command.
- **This document updates when a stage's change archives** (status log below) — the maintenance
  burden D2 will automate.

## Sources

- `../home-env/architect-host-first-strategy.md`, `../home-env/vendor-backends-strategy.md` —
  genre exemplars (D2).
- home-env chat history — extended real-use record; flow-clunk evidence (D2, D4).
- `~/code/orbit-status` — D3's seed project (issue #3).
- `orbit/changes/archive/2026-07-07-c2-parallel-merge-guardrail/.orbit-runs/` — D1's motivating
  incident trail (auto-archive at `archive-2026-07-07T14-30-23Z.json`; unrequested PR #7).
- `orbit/explore/fork-and-orbify/explore.md` — the prior program (A→C), D1–D15 decisions.
- `orbit/explore/explicit-lifecycle-consent/explore.md` — Stage D1, in flight.

## Status log

- **2026-07-08** — Document created from the explicit-lifecycle-consent exploration session
  (which outgrew a single explore): goals, five stages, sequencing, and the economy constraint
  ratified in conversation with Sal. D1 in flight; D2–D5 premised here, not yet explored.
