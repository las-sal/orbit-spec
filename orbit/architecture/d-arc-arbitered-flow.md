# D-arc — The Arbitered Flow (orbit program architecture)

> **Status**: living program architecture — hand-maintained until Stage D2 gives the genre engine
> standing. Never consumed by propose; stages spin explores/changes that cite this document.

A program-level architecture document spanning multiple explorations and changes. **This is
design-direction, not an OpenSpec change** — explorations and proposals are staged against it,
cite it, and it is updated as stages archive. It is the hand-rolled predecessor of the
`/orbit:architect` capability it itself contains (Stage D2 formalizes this document's genre);
until then, this document is maintained by hand, dogfooding the shape.

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

## Open questions (arc-level)

None open — the first architecture review's three arc-level questions (D2 engine standing,
enforcement placement, exit-criteria regime) were resolved 2026-07-08 (R-d-1/2/3). Questions that
belong to a single stage live in that stage's explore, not here.

## Program stages

**Stage state vocabulary** (controlled; hand-maintained *provisionally* until D2 computes it from
disk — per R-d-1, state is never hand-authored once the engine owns it):
`premised → exploring → in-change → archived`.

### Stage D1 — explicit-lifecycle-consent

*State (manual until D2): **in-change, APPLIED** — `orbit/changes/explicit-lifecycle-consent/`; all 16 tasks complete (2026-07-13). The user invoked /orbit:apply and chose proceed-anyway at the review-proposal inflection prompt (gate formally UNPASSED on the severity-blind confirm; `gate_overridden` recorded in the apply emit — the change's own thesis operating). Shipped: spec-driven v3 (consent on both reviewed gates), engine parse/surface + `Ready when you are:` phrasing with the ` — user-invoked` marker, consent steps in apply/archive/bulk-archive bodies (migrate-on-touch `consent_era_from` stamp), no-chaining as the fourth discipline in all 15 bodies, the audit-drift three-tier tripwire, 1668 tests green. Next seam: system review cadence — user-invoked.*

`orbit/changes/explicit-lifecycle-consent/` — the consent/arbiter core (explore.md rides inside the change as the decision record).
AskUserQuestion as the only harness-enforceable primitive (D-elc-1); provenance-conditioned
consent prompts — user-typed commands never prompt, AI-mediated arrivals at the gated seams
(`→ apply`, `→ archive`) must (D-elc-2/7); the no-chaining contract — the AI recommends, never
invokes (D-elc-3); eligibility phrasing replacing imperative readouts (D-elc-4); consent
provenance in emits (D-elc-5); flat `consent: "user-invoked" | "prompted"` emit field
(D-elc-8); no engine prompt for CLI-direct, ever (D-elc-9); consent set declared as SCHEMA gate
data — a `consent:` attribute on the gated seams (D-elc-10, consistent with R-d-1). All open
questions resolved 2026-07-09; the stage awaits the user's /orbit:propose. (The PR-lifecycle
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

### Stage D2 — architect (the program layer)

*State (manual until D2): **premised**. First in sequence after D1 (see Sequencing).*

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
dir) → in-change (citing change) → archived (archive back-reference); no new state files;
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
history; `fork-and-orbify/explore.md`; this document as live dogfood. Remaining design territory
for the explore: the parseable format itself, update triggers, explore/change linkage details,
and how much of the review mode ships in D2 v1.

**Exit criteria**: (1) this document retrofitted to the parseable format and
`orbit architecture status` renders program position (stage states computed from disk) matching
reality; (2) a change's `.openspec.yaml` cites its architecture+stage and validation fails on a
dangling citation; (3) `/orbit:review --as architecture` runs from a generated body and leaves
evidence in the architecture's own `.orbit-runs/`; (4) a session can load a single stage section
via CLI instead of the whole doc.

### Stage D3 — orientation (status absorption)

*State (manual until D2): **premised**.*

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

### Stage D4 — review-consistency

*State (manual until D2): **premised**.*

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

### Stage D5 — context-economy, native execution, and model strategy

*State (manual until D2): **premised**.*

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
  2026-07-09 forward, ahead of the spec.

**Exit criteria**: (1) generated surface size measured before/after against a stated reduction
target picked at explore time — the criterion is a NUMBER hit, not "smaller"; (2) an inventory
pass finds no body instructing the AI to hand-compose output the engine can render; (3) the
model-handoff boot test passes AT EVERY SEAM — a different model picks up mid-explore,
post-review, pre-apply, mid-apply-chunk, and pre-archive cold, from file-resident material
alone, and proceeds correctly; (4) `models:` config hints appear in eligibility
readouts.

### Stage D6 — pr-lifecycle (orbit-native git integration)

*State (manual until D2): **premised**.*

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
- **This document updates when a stage's change archives** (status log below) — the maintenance
  burden D2 will automate.
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
