# D-arc — The Arbitered Flow (orbit program architecture)

> **Status**: living program architecture — PARSEABLE since D2 (2026-07-16): stage state is
> engine-computed (`orbit architecture status`); the prose stays judgment-dense. Never consumed
> by propose; stages spin explores/changes that cite this document.

A program-level architecture document spanning multiple explorations and changes. **This is
design-direction, not an OpenSpec change** — explorations and proposals are staged against it,
cite it, and it is updated as stages archive. It is the hand-rolled predecessor of the
`/orbit:architect` capability it itself contains — Stage D2 formalized the genre 2026-07-16;
this document is the first parseable instance (its hand-maintained era dogfooded the shape).

Genre precedents: `../home-env/architect-host-first-strategy.md` +
`vendor-backends-strategy.md` (the "strategy doc changes are proposed against" pattern, grown
independently there), and this repo's own `fork-and-orbify.md` (sibling in this directory — the A→C
fork program, a program plan that lived in an explore's clothing until this layer existed;
relocated here 2026-07-08). Two projects growing the same organ independently is the evidence this layer is real.

## Premise

The fork program (A1 → B1–B3 → C1 → C2) is complete: orbit is a self-contained tool whose engine
computes the workflow and whose review cadence demonstrably catches real bugs. This arc is about
what orbit should BE now that it works — honed from sustained daily use (orbit-spec itself,
home-env, and the C2 delivery session). Goals are first-class below; exit criteria and the
closing review grade against them.

Motivating incidents: the C2 session's AI-driven auto-archive + unrequested PR (Stage D1's
origin); multi-session disorientation across 3–4 concurrent changes and step-away-and-return
(D3); review presentation varying per AI interpretation and batch-prompt walks losing discussion
context (D4); generated skills growing large while the AI occasionally drifts back to upstream
flow instead of native orbit commands (D5); and the program-layer gap both home-env and this repo
patched by hand (D2).

## Goals

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

## Rulings index

Arc-level rulings, addressable by ID; full text lives where cited. (Stage-level decision detail
is owned by each stage's explore/change per R-d-7 — this index holds only cross-stage rulings.)

- **R-d-1** — Architecture is FIRST-CLASS ENGINE, not prose (Stage D2 section).
- **R-d-2** — Harness-hook enforcement DEFERRED with a named empirical re-entry trigger
  (Considered & out).
- **R-d-3** — Every stage carries falsifiable exit criteria; arc-done = all stages archived +
  a closing `--as architecture` review (stage sections; Sequencing).
- **R-d-4** — Subtraction rule: additions to the generated surface must name what they remove
  (Cross-cutting constraint).
- **R-d-5** — Economy-vs-legibility resolution rule: interaction only at commitment points;
  tokens only on durable artifacts; economize everything else (Cross-cutting constraint).
- **R-d-6** — Stage D6 split out of D1 so the consent core proposes without git machinery
  (Stage D6; status log 2026-07-08).
- **R-d-7** — Ownership rule: the arc owns premise, exit criteria, state vocabulary, and
  cross-stage rulings; a stage's explore/change owns decision detail; once an explore exists the
  arc POINTS rather than duplicates (Sequencing).
- **R-d-8** — File-residency rule: at every conversation boundary, anything awaiting the user's
  ratification (standing recommendations, leanings, options) must be written into the owning
  artifact — chat is never the store of record (Sequencing; encoded into bodies/conventions by
  D5). Found empirically 2026-07-08: a model-handoff audit caught a chat-resident recommendation
  (Q-elc-c) that every captured decision had survived but pending material had not.
- **R-d-9** — Handoff posture: model-per-phase is a requirement; every phase-ending emit carries
  a structured `handoff` section (pointers, never duplicated substance); a handoff audit is
  required at phase seams (Cross-cutting constraint; practiced by hand from 2026-07-14;
  mechanized by D5).
- **R-d-10** (Sal, 2026-07-16) — Gate convergence is severity-thresholded: an independent pass
  converges on 0 CRITICAL and 0 new WARNING-or-above; SUGGESTION-grade findings still resolve
  (convergence clause (b)) but do not repeat the independent loop. Accepted risk, ratified:
  severity is a subjective reviewer rating — the user can always run another pass when a
  suggestion warrants fix-and-re-review. Found empirically 2026-07-15: D2 proposal iter 6
  (0 C / 0 W / 2 S, both polish-grade) would cost a full extra fresh cycle + confirm under the
  shipped strict `no-new-findings` predicate. Follow-up tracked as issue #8 (third `confirm`
  value `no-new-substantive-findings`: gates.ts + orbit-engine-gates delta + spec-driven v4 +
  conventions prose + tests); until it ships, the recorded `gate_overridden` proceed-anyway is
  the sanctioned interim path.

## Open questions (arc-level)

None open — the first architecture review's three arc-level questions (D2 engine standing,
enforcement placement, exit-criteria regime) were resolved 2026-07-08 (R-d-1/2/3). Questions that
belong to a single stage live in that stage's explore, not here.

## Program stages

**Stage state vocabulary** (controlled; COMPUTED from disk since D2 — per R-d-1, state is never
hand-authored now that the engine owns it):
`premised → exploring → in-change → quiescent (+ ratified `complete`)` — vocabulary
superseded by D-d2-1 (the d2-architect explore): `archived` was renamed `quiescent` because it
must not read as "complete"; completion is a user ratification composed with quiescence.

### Stage d1-explicit-lifecycle-consent — explicit-lifecycle-consent

Depends-on: (none)
Complete: [x] 2026-07-13 (Sal)


`orbit/changes/explicit-lifecycle-consent/` — the consent/arbiter core (explore.md rides inside the change as the decision record).
AskUserQuestion as the only harness-enforceable primitive (D-elc-1); provenance-conditioned
consent prompts — user-typed commands never prompt, AI-mediated arrivals at the gated seams
(`→ apply`, `→ archive`) must (D-elc-2/7); the no-chaining contract — the AI recommends, never
invokes (D-elc-3); eligibility phrasing replacing imperative readouts (D-elc-4); consent
provenance in emits (D-elc-5); flat `consent: "user-invoked" | "prompted"` emit field
(D-elc-8); no engine prompt for CLI-direct, ever (D-elc-9); consent set declared as SCHEMA gate
data — a `consent:` attribute on the gated seams (D-elc-10, consistent with R-d-1). All open
questions resolved 2026-07-09; the user proposed the same day (position is computed — `orbit
architecture status`; the status log carries the narrative history). (The PR-lifecycle
theme originally explored here as D-elc-6 was SPLIT OUT to Stage D6 on 2026-07-08 so it stops
blocking this stage's propose.) Enforcement ceiling accepted deliberately: the body-prompt layer
is the ONLY enforcement layer — harness hooks were considered and deferred with a named re-entry
trigger (see Considered & out); D-elc-5's audit tripwire is what makes the deferral empirical
rather than hopeful.

**Exit criteria**: (1) every post-D1 lifecycle emit carries `consent: user-invoked | prompted`,
and audit-drift DEMONSTRABLY flags an emit missing it (tripwire proven live, not just spec'd);
(2) a user-typed `/orbit:apply` / `/orbit:archive` runs with ZERO added prompts (only anomaly
prompts can interrupt); (3) no imperative `Next:` phrasing survives in engine output or generated
bodies — greppable.

### Stage d2-architect — architect (the program layer)

Depends-on: d1-explicit-lifecycle-consent
Complete: [ ]


**RULED (R-d-1, Sal, 2026-07-08): architecture is FIRST-CLASS ENGINE, not prose.** "Part of the goal of
forking orbit was to evolve the engine into what I wanted — not just layer prose on top of the
existing engine." The fork thesis, applied upward: A→C turned prose conventions into
engine-computed state (gates, fingerprints); D2 does the same for the program layer. The engine
grows a third declaration tier — architecture (cross-change program) above schema (per-change
flow) — both data, both engine-interpreted.

Concretely (each with in-repo precedent): (1) **parseable structure** — the doc keeps prose but
gains engine-readable sections (stages, states, goals), as specs have parsed requirement blocks;
this document is retrofitted as the first instance; (2) **linkage** — `.openspec.yaml` gains an
`architecture:` citation (precedent: C2's `base_fingerprints` schema extension) so every change
names its program + stage; (3) **computed program position** — stage state as a pure function of
disk, extending C1's principle upward: premised (arch doc only) → exploring (`orbit/explore/`
dir) → in-change (citing change) → quiescent (archived citing change; vocabulary per D-d2-1 —
completion is a separate user ratification); no new state files;
(4) **CLI surface** — `orbit architecture show/status` + validation, which D3's orientation
surface consumes for mechanical program position (a session loads ONE stage section, not the
whole doc — engine standing IS the economy answer for this layer's read-cost); (5) **trail +
review standing** — the architecture gets its own `.orbit-runs/`, enabling evidence-graded
`/orbit:review --as architecture` (dogfooded by hand 2026-07-08; working pass set: cohesion /
traceability, completeness / exit-criteria, dependencies / sequencing, layer-fit, route-level
alternatives, economy self-audit). Plus `/orbit:architect` the workflow body, and the
audit-drift hook (a stale architecture doc is the most expensive drift there is).

Sizing acknowledged: a C1-class engine change — the arc's biggest single effort, spent where
everything downstream leans. **D3 now DEPENDS on D2** (program position is D2 machinery), so
D2-before-D3 is a dependency, not a preference. Sources: home-env's two strategy docs + chat
history; `fork-and-orbify/explore.md`; this document as live dogfood. Decision detail lives in
the stage's change (R-d-7): `orbit/changes/d2-architect/` — explore.md D-d2-1..7 (format,
computed state, linkage, review-mode scope) + the full proposal/design/specs record.

**Exit criteria**: (1) this document retrofitted to the parseable format and
`orbit architecture status` renders program position (stage states computed from disk) matching
reality; (2) a change's `.openspec.yaml` cites its architecture+stage and validation fails on a
dangling citation; (3) `/orbit:review --as architecture` runs from a generated body and leaves
evidence in the architecture's own `.orbit-runs/`; (4) a session can load a single stage section
via CLI instead of the whole doc.

### Stage d3-orientation — orientation (status absorption)

Depends-on: d2-architect
Complete: [ ]


The positional half of "where am I": a surface answering, across ALL active changes at once —
what phase is each in, what workflow command ran last, what are the one-or-two sensible next
commands — cheap enough to consult after a day away, without burning a session's context to
reconstruct state. The data already exists (emits carry `command` + `next_recommended`; the
engine computes `position`/`next_command`); the surface doesn't. Absorbs the `~/code/orbit-status`
test project as first-class engine functionality (issue #3; extend built-in `orbit status`).
Constraint from D1: renders eligibility, never imperatives; constraint from goal 3: reading it
must cost near-zero context.

**Exit criteria**: (1) the cold-start test passes — fresh session whose ONLY prior read is
CLAUDE.md, several active changes, ONE command answers per change: position in the flow, last workflow command run, next one-or-two
eligible commands, with no artifact reading beyond the command's own output; (2)
`~/code/orbit-status` is retired as a separate project (the `../openspec-orbit`-at-parity
pattern).

### Stage d4-review-consistency — review-consistency

Depends-on: d2-architect
Complete: [ ]


Reviews are effective; their PRESENTATION varies per AI interpretation, and the address-reviews
walk drifts into batch questioning. Two moves: (1) make report rendering deterministic — the
findings JSON is already the source of truth; the ENGINE can render the human-facing report
(internal and external identically), removing per-AI variance and shrinking the bodies (economy
win from the same fix); (2) redesign the walk protocol: per-finding, present → DISCUSS IN CHAT →
then ratify; AskUserQuestion ratifies a discussion's conclusion rather than gating entry to it
(the dismissed-prompt-loses-context failure). Source: home-env chat history for concrete clunk
instances.

**Exit criteria**: (1) the same findings JSON produces a BYTE-IDENTICAL rendered report
regardless of which model ran the review (engine-rendered, golden-tested); (2) the
address-reviews walk provably follows discuss-then-ratify — the ratification prompt for finding
N cannot be issued before finding N's discussion concludes, batch prompts are prohibited in the
body, and a dismissed prompt loses nothing (the finding re-presents). (Walk criterion is
body-text-checkable plus one observed cycle — the honest limit for a UX behavior.)

### Stage d5-context-economy — context-economy, native execution, and model strategy

Depends-on: d2-architect
Complete: [ ]


Three braided threads, one governing concern (what's in the window and who's reading it):

- **Skill size / native execution**: audit generated bodies; move rarely-needed detail to
  `references/` (B2 built the machinery; the bodies kept growing inline); move mechanical work
  (checklist grading, summary composition; report rendering is D4's — D5 inventories and
  generalizes the pattern) from AI prose into the engine;
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
- **Handoff/boot formalization**: generalize the C2 HANDOFF.md pattern — boot material a fresh
  session (or different model) reads to pick up cold at ANY seam, not just phase entries:
  mid-explore, post-review-pre-address, pre-apply, mid-apply chunk, pre-archive. Boot material
  MUST include the code-touchpoints map (the C2-handoff §5 pattern — where the work lands) and
  point only at file-resident state (R-d-8). Record model identity in emits (provenance: which
  model authored these specs / this review). D5 also encodes R-d-8 into the explore/architect
  bodies and orbit-conventions via the **three-layer leak hardening** (designed 2026-07-09, after
  the Q-elc-c leak showed pending leanings had no named home): (1) FORMAT — open-question entries
  gain a required slot, `Standing recommendation: … | none yet` (orbit-conventions explore.md
  format requirement; AIs fill template slots far more reliably than they obey prose rules);
  (2) PROTOCOL — a boundary residency sweep in the explore/architect bodies, tied to the EXISTING
  emit trigger ("no emit without sweep": decisions / leanings / rejections / citations discussed
  this session must be file-resident before the emit writes — inherits the emit's mandatory
  boundary trigger, costing nothing against R-d-4); (3) ATTESTATION — the explore emit gains
  `open_questions_with_recommendation: "n of m"` (orbit-run-summary-emit delta); computing it
  forces re-reading the file, and audit-drift cross-checks counts against the actual file. Same
  enforcement ladder as D1 (structure → instruction → trail); same honest ceiling (nothing
  outside the conversation knows what was discussed). Practiced as authoring discipline from
  2026-07-09 forward, ahead of the spec. **D5 also mechanizes R-d-9's clauses (b) and (c)**
  (ratified 2026-07-14, practiced by hand since): the structured `handoff` emit section and the
  phase-seam handoff audit join the model-per-phase `models:` hints as this stage's spec'd
  deliverables — the working design above and R-d-9's text are the same program, stated once
  there and mechanized here.

**Exit criteria**: (1) generated surface size measured before/after against a stated reduction
target picked at explore time — the criterion is a NUMBER hit, not "smaller" — RATIFIED READING
(Sal, 2026-08-06, via the d5 system-review walk): the stated ≤20k target was missed at 28.5k
(−30% from ≈40.6k); accepted as met-in-intent with the residual attributed to deferred engine
work-list items #2 (findings resolver) and #3 (archive preflight), which remain named follow-up
work outside D5's scope; (2) an inventory
pass finds no body instructing the AI to hand-compose output the engine can render; (3) the
model-handoff boot test passes AT EVERY SEAM — a different model picks up mid-explore,
post-review, pre-apply, mid-apply-chunk, and pre-archive cold, from file-resident material
alone, and proceeds correctly; (4) `models:` config hints appear in eligibility
readouts.

### Stage d6-pr-lifecycle — pr-lifecycle (orbit-native git integration)

Depends-on: d1-explicit-lifecycle-consent
Complete: [ ]


Split out of Stage D1 (2026-07-08) once its true size was visible. The ratified direction
(originally D-elc-6, full rationale in D1's explore.md tombstone): **PRs are a DESIGNED
lifecycle step, not a policed ad-hoc action** — propose opens a DRAFT PR on the change's branch
(after artifacts are committed + pushed); archive flips it DRAFT → READY; merging stays a human
act outside orbit. The early draft makes the PR the human-facing window onto the change for its
whole life (artifacts, `.orbit-runs/` trail, and review iterations visible as they happen; CI
from day one; the pushed-branch requirement shared with review-external's handoff preflight).
Optional via config (e.g. `pr: draft-at-propose | at-archive | never`) with graceful
no-remote/no-GitHub degradation. The residual outward-actions rule (off-script merges, releases,
issue-filing) shrinks to a short conventions requirement echoed into lifecycle-completion
outputs, plus a CLAUDE.md line per project for non-orbit sessions.

Open questions carried from D1: **(e)** draft→READY trigger — leaning archive (READY =
merge-eligible: all gates passed, baseline synced); **(f)** who ratifies the draft-PR open —
leaning provenance (user-typed `/orbit:propose` + config = standing consent; AI-mediated propose
SKIPS the PR step rather than prompting); **(g)** branch-management bite-size — leaning zero
engine git: branch/commit/push/`gh pr` as workflow-body steps (propose offers to create
`<change-name>` off the default branch), full `openspec branch`-style scaffolding out; multi-repo
changes explicitly deferred. Prior art: `openspec-parallel-merge-plan.md` Phase 3.3. Affinity
with D5's handoff/boot thread (both make phase boundaries produce durable, transferable
artifacts); depends on D1's consent vocabulary shipping first.

**Exit criteria**: (1) one change dogfoods the full arc — draft PR opened at propose, CI running
from day one, flipped READY at archive, merged by the user; (2) `pr: never` yields zero PR
behavior and a remote-less repo degrades gracefully (tested, not assumed); (3) no PR/merge/release
action occurs outside the config+provenance rules across the dogfood.

## Cross-cutting constraint

**Token/context economy is a decision criterion in every stage above**, not a stage of its own
(D5 carries the dedicated mechanisms, but D2–D4 each weigh it: architect docs must be cheap to
consult; orientation must cost near-zero context; engine-rendered reports save narration
tokens). **Subtraction rule (R-d-4)**: every stage that ADDS instruction text to the generated surface
must name what it removes or shrinks — D4/D5 are net-negative by design; D1/D2/D6 must account
for their additions. Ceremony creep is the failure mode of process tooling at AI speed.

**Economy-vs-legibility resolution rule (R-d-5)** (goals 2 and 3 pull opposite ways; this is how stages
decide locally without re-arguing): **spend interaction only at commitment points; spend tokens
only on durable artifacts; economize everything else.** Applied: consent prompts exist only at
the two gated seams and only on AI-mediated arrival (interaction at commitment points);
architecture docs, specs, boot material, and trail emits are worth their tokens (durable
artifacts); narration, re-reading, re-orientation, and AI-composed formatting the engine could
render are what gets cut (everything else).

**Handoff posture rule (R-d-9, Sal, 2026-07-14)** — three clauses, PRACTICED by hand from
ratification; D5 mechanizes (b) and (c):

- **(a) Model-per-phase is a REQUIREMENT**, not a hypothesis: each phase names its model
  (`models:` hints in `orbit/config.yaml`, echoed by eligibility readouts, never enforced by
  bodies; switch only at phase boundaries, never within one). The 2026-07-08 assignment stands
  as the working default: strongest reasoner for explore/architect and propose (do NOT economize
  on normative text); coding model at apply; review models chosen for DIVERSITY from the
  authoring model (C1/C2/D1 empirics: independent slots out-caught in-context 9–0 in the D1
  cycle).
- **(b) Every phase-ending emit carries a structured `handoff` section** — the boot-read
  sequence (ordered pointers, e.g. CLAUDE.md → owning doc §stage → explore/change artifacts),
  the next command, and the next phase's model hint. POINTERS, never duplicated substance — a
  copied instructions blob is one more thing that goes stale; the artifacts hold the substance,
  the audit (c) proves the chain suffices.
- **(c) A HANDOFF AUDIT is required at phase seams** (explore→propose, propose→review-cycle,
  post-apply, pre-archive — wherever a context clear or model swap is plausible; NOT at every
  emit). Checklist: (1) R-d-8 residency sweep; (2) boot-chain currency — every doc the chain
  points through says what is currently true (stale state lines in OWNING docs hit 3× in the D1
  cycle); (3) coverage-vs-charter — the stage's charter items all covered by a decision or an
  open question with a standing slot; (4) code-touchpoints map present in boot material.
  Empirical basis: the two hand-run audits (2026-07-08 leak audit; 2026-07-14 D2 handoff audit)
  both surfaced real findings.

## Sequencing and rules of engagement

- **Order**: D1 finishes first (near propose-ready) → D2 (top of list; retrofits this document) →
  D3 → D4 → D5 → D6, with D3–D6 order flexible (D6 after D1 ships its consent vocabulary;
  natural pairing with D5) and economy decisions landing inside whichever stage touches them
  first.
- **One exploration in flight per stage**; each stage spins its `orbit/explore/<name>/` when its
  turn comes, citing this document. Stage premises live HERE until then (deliberately: an
  `orbit/explore/` dir means "actively being thought about").
- **Every lifecycle transition in this arc is user-invoked** — this arc practices D1's contract
  before D1 ships it: the AI recommends; Sal types the command.
- **File residency (R-d-8)**: session boundaries assume nothing of the conversation — pending
  recommendations live in the owning file (explore.md open questions carry their standing
  recommendation; arc open questions carry theirs). The handoff test is: a different model, cold,
  loses only conversational shorthand — never state.
- **Ownership (R-d-7)**: the arc owns premise, exit criteria, state vocabulary, and cross-stage
  rulings; a stage's explore/change owns its decision detail. Once a stage's explore exists, the
  arc's stage section POINTS at it rather than duplicating — summary drift between the layers is
  a defect, not a convenience.
- **This document updates when a stage's change archives** (status log below). Stage STATE is
  engine-computed since D2 (`orbit architecture status`); only the narrative status-log ledger
  is hand-appended.
- **Arc-level done (R-d-3)**: all six stages archived, plus one closing `/orbit:review --as architecture`
  grading the arc against each stage's exit criteria and the three goals.

## Considered & out

- **Harness-hook enforcement (generated PreToolUse config) — DEFERRED, not rejected
  (R-d-2, 2026-07-08).** Claude Code hooks could hard-block `orbit archive` / `gh pr create` at the
  harness layer — the only mechanism that enforces against a session that MISREADS rather than
  merely misbehaves (AskUserQuestion fires only when the body-following AI chooses to call it).
  Deferred because the risk it guards is low-severity and recoverable post-C2 (fingerprint-guarded
  baseline, git-revertible archive, closeable PR), D1 removes all three enablers of the original
  incident (ambiguous delegation as authority, imperative readouts, no green-path prompt), hooks
  are provenance-blind (redundant click on user-typed transitions), Claude-only (two-tier vs
  codex), and another config knob + generated artifact against the over-engineering budget.
  **Re-entry trigger (named, empirical)**: if D-elc-5's tripwire ever fires — audit-drift finds a
  lifecycle emit missing its consent record — or a second C2-class unconsented transition occurs,
  add the generated-hooks layer then. It is purely additive (orbit already generates the
  `.claude/` surface; a hooks block is the same generator pattern); nothing in D1's design
  changes to accept it later.

## Sources

- `../home-env/architect-host-first-strategy.md`, `../home-env/vendor-backends-strategy.md` —
  genre exemplars (D2).
- home-env chat history — extended real-use record; flow-clunk evidence (D2, D4).
- `~/code/orbit-status` — D3's seed project (issue #3).
- `orbit/changes/archive/2026-07-07-c2-parallel-merge-guardrail/.orbit-runs/` — D1's motivating
  incident trail (auto-archive at `archive-2026-07-07T14-30-23Z.json`; unrequested PR #7).
- `orbit/architecture/fork-and-orbify.md` — the prior program (A→C), D1–D15 decisions.
- `orbit/explore/explicit-lifecycle-consent/explore.md` — Stage D1, in flight.

## Status log

- **2026-07-08** — Document created from the explicit-lifecycle-consent exploration session
  (which outgrew a single explore): goals, five stages, sequencing, and the economy constraint
  ratified in conversation with Sal. D1 in flight; D2–D5 premised here, not yet explored.
- **2026-07-08** — Stage D6 (pr-lifecycle) split out of D1: the PR-integration theme (D-elc-6 +
  its three open questions) moved here so the consent core can propose without waiting on git
  machinery. D1 narrowed to consent-only; now 6 decisions / 3 open questions.
- **2026-07-08** — First `--as architecture` review (in-context, dogfooded by hand): 0 CRITICAL,
  5 WARNING, 3 SUGGESTION. Ruled from its findings: **D2 is first-class engine, not prose**
  (stage section rewritten; D2→D3 now a hard dependency; the layer's read-cost answered by
  engine-parsed stage sections). Still open from that review: harness-hooks-as-enforcement
  Considered-&-out entry, per-stage exit criteria, the economy-vs-legibility resolution rule,
  D4 ownership of engine-rendered reports, status-header vocabulary.
- **2026-07-08** — Hooks question resolved: generated harness-hook enforcement DEFERRED with a
  named empirical re-entry trigger (D-elc-5 tripwire firing, or a repeat incident); body-prompt
  layer stands alone as D1's enforcement. Review finding #1 closed; exit criteria + economy rule
  remain.
- **2026-07-08** — Per-stage exit criteria ratified and added (falsifiable, mechanically
  checkable where possible) + arc-level done condition; D4 given explicit ownership of
  engine-rendered reports; subtraction rule added to the cross-cutting constraint; status header
  added to this document. Review findings #2 closed; the economy-vs-legibility resolution rule
  (#3) is the last open finding.
- **2026-07-08** — Economy-vs-legibility resolution rule ratified as-is ("interaction only at
  commitment points; tokens only on durable artifacts; economize everything else") and added to
  the cross-cutting constraint. **All findings from the first `--as architecture` review are
  resolved** — the arc is pressure-tested; next milestone: resume the Stage D1 explore
  (Q-elc-c/d/h) toward its propose.
- **2026-07-08** — Exemplar-structure pass (this doc models what D2 formalizes): Goals hoisted to
  a first-class section; arc-level rulings given addressable IDs (R-d-1..7) with an index;
  hand-written stage states replaced by the controlled vocabulary and marked provisional-manual
  until D2 computes them (hand-authored state is the anti-pattern the retrofit deletes);
  arc-level Open-questions section added (currently none); ownership rule between arc and
  stage explores stated (R-d-7).
- **2026-07-08** — Bookkeeping: `fork-and-orbify` relocated from `orbit/explore/` to
  `orbit/architecture/fork-and-orbify.md` with a COMPLETE status header — the completed program
  plan was the last violation of "an explore dir means actively being thought about"; live
  references updated (CLAUDE.md, this doc, the 1.3.1 survey).
- **2026-07-08** — Baseline-spec taxonomy question examined against upstream's vendored docs
  (`docs/concepts.md` @ upstream/v1.3.1: "organize specs by domain"): current granularity
  (13 domain dirs) RATIFIED; naming rationalization (drop overlay-era `-modifications` suffix +
  `orbit-` prefix) queued into D5's scope, standalone-shippable.
- **2026-07-08** — Model-handoff audit (manual run of D5's boot test, today's state): captured
  decisions all survived; three leaks found and fixed (chat-resident Q-elc-c recommendation →
  written in-file; D1 code-touchpoints map added to its explore References; CLAUDE.md gained the
  active-program pointer). Systemic fixes ratified into the arc: **R-d-8 file-residency rule**;
  D5's boot test extended to ALL seams with touchpoints mandatory in boot material; D3's
  cold-start test now starts from CLAUDE.md alone.
- **2026-07-09** — D1's last three open questions ratified as recommended (D-elc-8/9/10: flat
  consent field; no engine prompt for CLI-direct; consent as schema gate data per R-d-1 grain).
  **Stage D1 is propose-ready** — the propose is the user's to invoke.
- **2026-07-13** — Two lessons from D1's 6-pass proposal cycle captured (R-d-8; the second had
  been claimed-captured in an emit but never written — the phantom-claim class again):
  **(a) Severity-blind confirm over-iterates**: `confirm: no-new-findings` lets a stale-checklist
  WARNING reset the cadence like a baseline-contradiction CRITICAL; rounds 4-6 were mostly
  polishing material earlier fixes introduced. Candidate fix: a `no-new-criticals` confirm
  vocabulary option (schema edit per engine-gates' cadence-tuning rule) and/or later iterations
  scoped to contract-integrity passes only. Home: D4 (review consistency) / the schema vocabulary.
  **(b) Contradiction sweep is mechanizable**: ALL 5 proposal-cycle CRITICALs (and C2's dropped
  scenarios) were one class — un-delta'd baseline text contradicting what a delta redefines. A
  mechanical sweep (grep baselines for every construct/enumeration/label a delta touches) at
  propose or review Pass 4 would catch the class deterministically. Home: D4 or D5
  (engine-absorbed mechanical work).
- **2026-07-09** — User invoked /orbit:propose: D1 is **in-change** at
  `orbit/changes/explicit-lifecycle-consent/` (1 new capability + 5 deltas, 12 delta
  requirements; fingerprints stamped; --strict valid). Design settles the consent-era boundary
  (schema-version-based). Proposal review cycle is the stage's next seam — user-invoked.
- **2026-07-09** — R-d-8 mechanization designed into D5 (three-layer leak hardening: format slot
  for standing recommendations, boundary residency sweep piggybacking the emit trigger, emit
  attestation field). The format layer is PRACTICED from today in all explores/architecture docs,
  ahead of D5 spec'ing it.
- **2026-07-13** — **D1 APPLIED** (user-invoked /orbit:apply; proceed-anyway at the
  review-proposal inflection prompt, `gate_overridden` recorded — the first live exercise of the
  C1 override trail on this repo's own flow). Four groups landed in three commits: engine
  (consent vocabulary, spec-driven v3, `schema_version`/`consent_era_from` metadata, eligibility
  phrasing incl. the ` — user-invoked` marker in canonical-next), bodies (consent steps at the
  apply/archive/bulk seams; no-chaining echoed as the fourth discipline in all 15 bodies —
  sync-specs gained its first orbit layer; review stock phrasings re-labeled), tripwire
  (audit-drift Cat-4 three-tier check + tests incl. the real C1/C2 archives scanning exempt),
  verification (exit-criterion greps live as tests: engine + templates + on-disk surface;
  1668 tests green vs 1608 baseline; 8/8 fingerprints; local surface regenerated). Deferred to
  archive time by design: CLAUDE.md's execution-disciplines section gains the fourth discipline
  when the change's deltas sync to baseline. Next seam: `/orbit:review --as system` — user-invoked.
- **2026-07-14** — **R-d-9 ratified (handoff posture)**: model-per-phase upgraded from working
  hypothesis to requirement; phase-ending emits carry a structured `handoff` section (pointers,
  never duplicated substance); handoff audits required at phase seams (4-item checklist:
  residency, boot-chain currency, coverage-vs-charter, touchpoints). Empirical basis: both
  hand-run audits found real findings (2026-07-08: 3 leaks; 2026-07-14: stale arc state line,
  uncovered charter item → Q-d2-6/D-d2-6, soft touchpoints). Practiced by hand immediately;
  D5 mechanizes (b)+(c). Raised during the D2 explore's handoff-readiness discussion.
- **2026-07-13** — **D1 COMPLETE and ARCHIVED** (user-invoked archive; the full system cadence
  before it: in-context clean → external GPT-5 Codex (1 W + 2 S, resolved — delta era-exemption
  text tightened to require absence of BOTH markers; ordering invariant added to bodies; on-disk
  tripwire fixture harness) → fresh independent (3 W + 3 S, resolved — four-disciplines residue in
  review --parallel; delta placement text aligned to the ordering invariant; upstream
  suggest-archive bullet replaced; single-voiced fall-through so status renders
  `/orbit:archive <name> — user-invoked` at the all-passed seam instead of nothing; all_done
  instruction defers to the gate graph; this doc's stale propose clause) → in-context confirm
  CONVERGED. Sync: baseline 13 → 14 (orbit-lifecycle-consent NEW; 9 ADDED + 8 MODIFIED
  requirements, containment-verified). The archive itself exercised the shipped contract
  end-to-end: user-typed → zero consent prompts, gate PASSED, fingerprints 8/8, summary records
  `consent: "user-invoked"`. CLAUDE.md gained the fourth discipline + the D1 completion entry.
  Cycle lesson (already ledgered 2026-07-13 above) stands for D4: the external + fresh
  independent slots again out-caught the in-context passes (9 real findings vs 0). **Next stage
  per Sequencing: D2 (architect) — its explore is the user's to invoke.**

- **2026-07-16 — D2 APPLY COMPLETE (all 20 tasks; the engine gains its third tier).** This
  document is now the FIRST PARSEABLE INSTANCE: six stage headings normalized to kebab ids,
  `Depends-on:`/`Complete:` slots added (d1 ratified `[x] 2026-07-13 (Sal)`, user-confirmed at
  apply), every hand-maintained state paragraph DELETED (the R-d-4 subtraction; position is
  computed — `orbit architecture status`). Shipped: `src/core/architecture/` (fence-aware
  near-miss parser, computed stage state, structure validation), `orbit architecture
  status/show/validate` (bucketed --json), `architecture: {doc, stage}` metadata citation with
  two-level dangling validation owned by `orbit validate <change>` (the archived D1 change
  backfilled; this change carries the first live citation), the 16th workflow `/orbit:architect`
  (all six registries), `/orbit:review --as architecture` (six passes, no gate, architecture
  trail), audit-drift architecture-staleness checks (a)–(d), explore minimal metadata + propose
  staged-metadata merge + archive stage-line garnish. 1707 tests green (baseline 1670 + 37);
  surface 15 → 16 regenerated. README install-surface audit: no-edit-needed (no counts, file
  lists, or invocations affected). Gate proceed-anyway recorded (`gate_overridden`:
  review-proposal unpassed — in-context slot uncovered; R-d-10's sanctioned interim path,
  suggestion-only tail resolved). R-d-9 handoff audit at this seam: residency clean (no
  chat-resident decisions; all ratifications in artifacts), boot chain current (CLAUDE.md →
  `orbit architecture status`; arc doc parseable), coverage-vs-charter: exit criteria 1/2/4
  mechanically test-covered, 3 ships as generated body (its first evidence lands on first use).

- **2026-07-16 — external system review (GPT-5 Codex, iter 1) + resolution; exit criterion 3 NOW EVIDENCED.**
  2 CRITICAL + 4 WARNING, all resolved: the review body's change-oriented Steps 1/4/5/8/9 now
  branch by mode (architecture mode resolves a DOC, `Using doc:` header, no change CLI calls, no
  gate computation, doc-scoped iteration); the launcher surface advertises all three modes; the
  onboarding emit paragraph names all four trail locations; D1's stage prose no longer points at
  the deleted state line (and the live-arc test now catches semantic stale pointers, not just the
  old spelling). CORRECTION of the prior entry's weakened claim: exit criterion 3 was NOT
  satisfied at apply completion — the first `/orbit:review --as architecture` has now RUN from
  the generated body (user-sanctioned at the C2 resolution fork) and its evidence exists:
  `orbit/architecture/.orbit-runs/review-architecture-2026-07-16T19-42-13Z.json` (no findings;
  `change: null`, `doc`, `handoff` carried). All four D2 exit criteria are now met with on-disk
  evidence.
- **2026-07-17 — D2 ARCHIVED (baseline 14 → 16; the engine's third tier is live).** System
  cadence converged: in-context (2, resolved) → external GPT-5 Codex iter 1 (2 CRITICAL + 4
  WARNING — mode-first review-body restructure; exit-criterion-3 evidence; all resolved) →
  fresh (schema-reference root cause, resolved) → external iter 2 (0 CRITICAL + 4 WARNING —
  incl. the doc-identity path-traversal catch; all resolved) → fresh CLEAN (byte-identical
  fresh-init surface check) → in-context confirm; gate review-system PASSED by the engine.
  Sync: 34 delta requirements (16 ADDED + 18 MODIFIED) across 11 capabilities;
  `orbit-architecture-engine` + `orbit-architect` join baseline with real Purposes; orbit-review
  and orbit-run-summary-emit Purposes updated per task 5.4. Archive: user-typed, zero consent
  prompts, fingerprints 18/18, `consent: "user-invoked"`. 1712 tests green. Post-archive the
  engine renders d2-architect QUIESCENT — completion awaits the user's ratification (an
  architect session or hand-edit writes the mark; the readout is the reminder). Cycle lesson,
  third time running: the external + fresh independent slots out-caught the in-context passes
  (13 of 17 system findings); the cadence's cross-check structure is earning its cost.


- **2026-07-20 — D3 applied (orientation shipped; post-apply seam).** The orientation surface
  is live: `src/core/orientation.ts` (pure composition — continuity predicate with the
  same-second tie-break, count-based WAITING, spine-invalid skip + degraded-row fault
  isolation, archived-trail LAST-only sourcing), bare `orbit status` = the sprint view (the
  "Missing required option --change" error path claimed; `--change` and no-changes outputs
  unchanged), `orbit status --full` = the arc view satisfying exit criterion 1 (per-workstream
  orientation tuples, ONE command, zero artifact reads — asserted read-only two-sided by test),
  shared discriminated JSON entry shape both tiers. The explore BEGIN emit ships mode-aware
  (Mode B zero-count + Early canonical; Mode C back-filled post-back-fill; bump-a-second
  collision; no retro-fire); explore parity hashes re-pinned. CLAUDE.md carries the cold-start
  pointer; issue #3 closed (v0.1 `~/code/orbit-status` retired — the R-d-4 subtraction).
  Proposal cadence before apply: 8 passes (in-context 1/5/6, fresh 2/3/4, external GPT-5 Codex
  ×2), 24 findings all resolved, iter 6 CLEAN; apply proceeded via recorded `gate_overridden`
  (R-d-10's sanctioned interim path — the strict predicate wants the clean pass independent).
  **1742 tests green** (baseline 1712 + 30). Next: system review cadence, then archive
  (baseline 16 → 17 at sync).

- **2026-07-21 — D3 ARCHIVED (orientation complete; exit criteria met).** Archived to
  `orbit/changes/archive/2026-07-21-d3-orientation/` after the system cadence closed: 6 system
  passes (in-context → external GPT-5 Codex — 1 CRITICAL, the swallowed-metadata fault-isolation
  gap → fresh → in-context confirm → fresh adversarial → external confirm), 55 findings across
  the change's 15 passes, all resolved, none re-opened. Sync landed `orbit-orientation` as the
  17th baseline capability (9 requirements) + 7 MODIFIED blocks byte-identical across four
  baselines; fingerprints 7/7; validate --specs 17/17; **1754 tests green**. Exit criterion 1
  proven by test (ONE `orbit status --full --json` answers position/last/next per workstream,
  read-only two-sided); criterion 2 delivered (issue #3 closed; `~/code/orbit-status` retired —
  the R-d-4 subtraction). Archive: user-typed, zero consent prompts, gate PASSED (no
  inflection), `consent: "user-invoked"`. Post-archive the engine renders d3-orientation
  QUIESCENT — completion awaits ratification (with d2-architect still pending the same mark).
  Cycle lessons: the external+fresh independent slots again out-caught in-context (the two
  layer-residue finds — templates unswept after the spec-level scoping — were both theirs); and
  the mid-cycle process correction is now standing discipline: gate verdicts/next-lines are
  READ from the engine, never authored.

- **2026-07-29 — D4 applied (review-consistency shipped; post-apply seam).** The engine owns
  the review report: NEW `src/core/report-render.ts` (pure render over the findings record —
  D2b's line-level grammar, blockquote containment, per-genre strict validation with the
  D4-generation boundary, as-of iteration/trend under one total pass order, the engine tail
  computed at render time) surfaced as `orbit status --change <name> --report [<TS>]`; goldens
  transcribed from the canonical example with the pre-boundary error fixtures copied
  byte-for-byte from the real B2/D3 archives. The walk protocol rewrote to three lanes in the
  generated body (triage preview from provisional classification; decision lane = prose
  briefing → discussion → chat-directive ratification with the AskUserQuestion demoted to
  optional closure; dismissed re-presents; batch prompts dead, delegation recorded); the
  review body sheds its final-assessment machinery for persist-first + run-and-paste with the
  greppable hand-rendering prohibition (exit criterion 2's checkable half IS the fidelity
  suite); review-external's Notes contract and onboard's re-teach landed with it. Apply
  proceeded via the recorded `gate_overridden` (review-proposal unpassed — the user's explicit
  pre-authorized sign-off after 9 passes / 69 findings all resolved and two consecutive
  independent zero-CRITICAL passes; R-d-10's sanctioned path). **1783 tests green** (1754 +
  29). R-d-9 seam audit (2026-07-29, dated evidence note carried in the apply emit): residency
  verified (all D4 artifacts in-change; deltas across 7 capabilities), boot chain current
  (CLAUDE.md orientation pointer + arc doc accurate), charter coverage complete (both exit
  criteria carried by real tests + the one-observed-cycle half pending post-apply), code
  touchpoints as declared (report-render.ts; status.ts/cli; four templates; three test
  suites). Next: system review cadence, then archive (baseline 17 → 18 at sync).

- **2026-07-30 — D4 ARCHIVED (baseline 17 → 18).** The system cadence converged over five
  shared-axis passes — in-context CLEAN → fresh (5 findings; the observed three-lane cycle
  satisfying exit criterion 2's UX half: obvious-fix preview at triage, prose briefing, the
  "fail loud" chat directive as ratification) → **external GPT-5 Codex** (10 findings, 4
  CRITICAL: the pre-3b.5 AskUserQuestion imperative, the incomplete single-line slot set, the
  ignored emit `change`, the non-verbatim delta prompt block) → fresh confirm (3 suggestions;
  the ordinal-divergence decision-lane fork resolved by the user's "A": the strip's ⟲N now
  counts the SHARED pass axis via the exported confidence-gated counter — one iteration
  semantics across surfaces, verified live ⟲9/⟲4 = the report ordinals) → in-context confirm
  CLEAN. 23 system-phase findings, all resolved, none re-opened; whole-change total 100
  findings across 24 passes. **The review-system gate computed PASSED — the first D-arc
  archive to enter through a passed gate with no override.** Archive: user-typed, zero consent
  prompts, fingerprints 19/19 verified, sync of 27 delta blocks (8 ADDED + 19 MODIFIED)
  byte-verified against baseline, `orbit-report-rendering` created as the 18th capability.
  **1819 tests green.** Both exit criteria hold shipped: the byte-stable engine render
  golden-tested; the observed cycle recorded with entry-level `ratified_via`/`resolution`.
  Stage d4 renders quiescent — completion awaiting ratification.
