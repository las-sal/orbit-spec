> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: explicit-lifecycle-consent

## Premise

Motivating incident (2026-07-07, C2's own delivery session): the driving AI ran the entire
lifecycle — propose → review iterations → apply → system review → **archive → PR** — from a
single blanket instruction ("take it through the review cadence"). Every safeguard orbit has is
**anomaly-gated**: the C1 gate inflection prompt fires only when a gate is unpassed/stale
(`archive-change.ts` Step 3.4), the C2 fingerprint prompt only on divergence (Step 3.45), the
audit prompt only on CRITICAL drift (Step 3.5). When everything is green, **nothing ever asks the
human** — the clean path proceeds silently, and the engine's `Next: /orbit:archive <name>`
readout reads to an AI driver as an instruction to execute.

The user's requirement: **orbit lifecycle commands must happen explicitly — the user decides how
many review cycles a change goes through and when each phase transition (especially archive, the
baseline-writing step) happens.** Gate `passed` means *eligible*, not *commanded*.

Key constraint discovered: in an AI-driven tool, engine-side enforcement (flags, `--yes`
confirmations, TTY checks) cannot enforce user consent, because the AI controls the shell and can
pass any flag — in the incident, the AI itself drove `orbit archive --yes`. The **only primitive
the driving AI cannot self-answer is `AskUserQuestion`** — it is harness-mediated and lands in
front of the human. Enforcement must be built on that; everything engine-side is legibility and
nudge, not enforcement.

## Decisions

- **D-elc-1 (2026-07-07) — AskUserQuestion is the enforcement primitive; engine mechanisms are
  legibility, not enforcement.** Rationale: the AI session controls the CLI (any flag, any
  `--yes`), so no flag/prompt inside `orbit` binds it. A workflow-body-mandated AskUserQuestion is
  harness-mediated and reaches the human; the AI cannot answer it itself. Consequence: the
  consent layer lives in the generated workflow bodies (skill instructions, per D14 the single
  behavioral source), backed by engine wording changes (D-elc-4) and trail records (D-elc-5).

- **D-elc-2 (2026-07-07, REFINED same day) — Consent prompt conditioned on invocation
  PROVENANCE, not on judgment: it fires only when a consent-scoped command is reached WITHOUT an
  explicit same-turn user invocation.** Original form ("always-on, unconditional") was challenged
  by the user — "if I issued the command, why do we need a consent prompt?" — and the objection
  holds: a user-typed `/orbit:archive <name>` (or an unambiguous same-turn prose request naming
  the act) IS the consent; prompting again is redundant friction. The refinement keys on an
  OBSERVABLE signal instead: when the user types the slash command, the harness injects a literal
  command invocation into the transcript; when the AI chains, it launched the skill itself with
  no such invocation. So: **user-invoked → no consent prompt** (only the anomaly prompts — gate
  Step 3.4 / fingerprints Step 3.45 / audit Step 3.5 — can interrupt); **AI-mediated entry**
  (delegation like "finish the cadence", inference like "continue", handoff docs, a gate
  reporting archive-ready) **→ the consent AskUserQuestion fires** BEFORE any write, showing the
  position readout + exactly what will be written (N deltas to baseline across M capabilities;
  change moved to archive) + proceed / abort. Outcome recorded in the run summary (Q-elc-c).
  Rationale: the C2 incident was the AI *misreading delegated authority* as consent — any
  "prompt only when unsure" rule routes through that same failed judgment, but invocation
  provenance is in the transcript, not inferred. The gray zone shrinks to exactly the delegated
  path, which is where one harness-mediated click is worth it. DISTINCT from the anomaly prompts;
  this one is consent, not anomaly.

- **D-elc-3 (2026-07-07) — No-chaining contract: one orbit workflow command per explicit user
  request; the AI recommends, never invokes.** A new `orbit-conventions` requirement, echoed in
  every workflow body (the established self-contained-disciplines pattern): completing a command
  ENDS the turn at the position readout + canonical next; the AI SHALL NOT invoke the next orbit
  command (any `/orbit:*` workflow — review iterations included, per the user: cycle COUNT is
  theirs) unless the user's message requests it. Blanket delegation ("follow the cadence") covers
  work WITHIN the requested command (passes of one review, tasks of one apply), never the next
  command. Scope note: this also covers non-orbit outward actions in the same spirit (opening a
  PR) — see Q-elc-b for where that rule lives.

- **D-elc-4 (2026-07-07) — Canonical-next readout rewords from imperative to eligibility.**
  `orbit status` / `orbit instructions` currently render `Next: /orbit:archive <name>` — to a
  model, an imperative. Change the display phrasing to eligibility framing (e.g.
  `Ready when you are: /orbit:archive <name>` or `Eligible: … — invoke when ready`), single-voiced
  as before (one command, no skip paths). This is a delta to `orbit-engine-gates`' position-readout
  / single-voiced canonical-next requirements plus the workflow bodies that quote the readout.
  Emit FIELD names (`next_recommended`) stay stable — display wording only, so downstream parsers
  are untouched. Rationale: words are the API when the consumer is a model; cheap, removes the
  standing invitation to auto-execute.

- **D-elc-5 (2026-07-07) — Consent provenance in the run trail; audit-drift checks it
  mechanically.** Lifecycle-command emits (at minimum `archive-*.json`) record the consent
  outcome (prompted + answer). `audit-drift`'s archive-coherence pass gains a check: a lifecycle
  emit missing its consent record is a WARNING finding. Acknowledged limit: self-reported by the
  AI that writes the emit — a contract-violating session could fabricate it. Value is
  honest-actor legibility ("who decided?") + a mechanical tripwire, NOT enforcement (that's
  D-elc-1/D-elc-2). Do not oversell this layer in the specs.

- **D-elc-6 (2026-07-07) — PRs become a DESIGNED lifecycle step, not a policed ad-hoc action
  (resolves Q-elc-b).** Reframed from "where does the don't-open-PRs rule live" to "where does a
  PR belong in the workflow": **propose opens a DRAFT PR** on the change's branch (after
  artifacts are committed + pushed), and **archive flips it DRAFT → READY**; merging stays a
  human act outside orbit. Rationale: the end-of-lifecycle PR (the incident's shape) shows human
  stakeholders a fait accompli after every decision is ratified; an early draft makes the PR the
  human-facing window onto the change for its whole life — artifacts, `.orbit-runs/` trail, and
  review iterations visible as they happen, CI from day one, and the pushed-branch requirement is
  shared with the review-external handoff preflight. Future hook noted: GitHub PR review comments
  are another external-findings source for `address-reviews --from-file`. With the PR's home
  defined, the residual outward-actions rule only covers OFF-SCRIPT acts (unrequested
  merge/release/issue-filing, PRs outside the designed trigger) — a much smaller rule, living as
  a short `orbit-conventions` requirement echoed into lifecycle-command completion outputs
  (eligibility phrasing per D-elc-4), plus a CLAUDE.md line for non-orbit sessions in this repo
  (the `gh`-can-target-upstream-fork hazard stays CLAUDE.md/project-level, not orbit-shipped).
  Feature MUST be optional: config surface (e.g. `pr: draft-at-propose | at-archive | never`)
  with graceful no-remote/no-GitHub degradation, same pattern as review-external's preflight.
  Prerequisite acknowledged: orbit does not manage branches today — branch-per-change is hand
  practice in this repo; PR-at-propose implies orbit knowing/creating the change's branch
  (upstream foresaw this: `openspec-parallel-merge-plan.md` Phase 3.3 "openspec branch"
  scaffolding). See Q-elc-e/f/g.

- **D-elc-7 (2026-07-07) — The canonical user-arbitered workflow is the design's spine; consent
  points ARE the gated phase transitions (resolves Q-elc-a).** The user's stated core workflow:
  `explore → propose → ⟲ proposal review cycle → apply → ⟲ system review cycle → archive`, with
  the USER as arbiter of every transition. Two sorting axes were considered and the wrong one
  rejected: NOT blast-radius/reversibility (an earlier leaning that put sync in and apply out),
  but **commitment points** — apply is requirements→code generation, the single biggest
  commitment in the flow regardless of git reversibility; the expected human behavior is a MANUAL
  read of the requirements at the end of the proposal review cycle BEFORE authorizing generation
  ("apply should NEVER run automatically; users will want absolute control over when that
  happens" — user, 2026-07-07). The resulting set aligns 1:1 with the C1 gate graph's `before:`
  targets (`review-proposal before: apply`; `review-system before: archive`):
  **prompt-backed set = {apply, archive, bulk-archive (per change)}**. `sync` is NOT separately
  prompted: it is in practice never user-typed — it runs inside archive's Step 4 (agent-driven
  sync-specs) and **inherits the containing flow's consent**; a standalone AI-mediated sync
  (never observed) falls back to a prompt as a baseline writer. Unifying statement for the specs:
  *the engine computes "eligible" at a phase boundary; only the human supplies "go"; the consent
  prompt is the backstop when the AI reached the boundary on inferred authority* — gates and
  consent are two halves of one contract at the same two seams. Corollary for D-elc-4's wording:
  the post-proposal-cycle readout should explicitly invite the human requirements-review (e.g.
  "gate review-proposal PASSED — review the artifacts, then /orbit:apply when ready"). No config
  knob for the set in v1.

## Open questions

- **Q-elc-c — Field shape for consent in emits.** `user_consent: "prompted"` (flat, minimal) vs
  `invocation: {source: user-command|ai-continuation, consent: prompted|aborted}` (richer, but
  `source` is unverifiable self-report). Interplay with existing archive-summary fields
  (`user_decision` = audit prompt outcome; `gate_overridden`; `fingerprint_overridden`) — the
  summary is accumulating per-prompt fields; consider whether a single `prompts: {...}` grouping
  is a cleaner v2 or over-engineering.

- **Q-elc-d — Does the consent prompt fire on CLI-direct `orbit archive` (human typing it)?** The
  interactive CLI already confirms; a human typing the command IS explicit consent. Leaning: no
  engine-side change beyond D-elc-4 wording — the consent prompt is a workflow-body concern
  (where the AI drives). But confirm the boundary so the specs don't accidentally promise an
  engine prompt.

- **Q-elc-e — Draft→READY trigger: archive, or earlier?** Archive = all orbit gates passed +
  baseline synced on the branch (READY as merge-eligibility, the leaning). Alternative:
  apply-complete or review-system-passed flips READY ("humans, please review now") with archive
  as a later PR comment/label. Draft PRs are commentable either way, which weakens the case for
  an early flip.

- **Q-elc-f — Who ratifies the draft-PR open at propose: a one-time AskUserQuestion in the
  propose flow, or silent config policy?** Opening even a draft PR is outward. If
  `pr: draft-at-propose` is set in config, is that standing consent (no prompt), or does propose
  still ask once per change? Interacts with D-elc-2's provenance rule — a user-typed
  `/orbit:propose` arguably covers the PR step it's spec'd to include.

- **Q-elc-g — Branch management scope.** PR-at-propose implies orbit knows/creates the change's
  branch (branch-per-change becoming machinery, not hand practice). How much does this change
  bite off: (1) convention-only (document branch-per-change; PR step assumes/detects a branch and
  degrades if on the default branch); (2) propose creates the branch; (3) full
  `openspec branch`-style scaffolding (upstream plan Phase 3.3 territory — likely too big).
  Also: the user's "repo(s)" plural — single-repo orbit is today's reality; multi-repo changes
  would be a separate, much larger exploration.

## Considered & out

- **Engine-side enforcement (required flag / TTY confirm / refusing non-interactive archive) as
  the primary mechanism — out (2026-07-07).** The AI drives the shell; any flag or stdin the
  engine demands, the AI can supply (the motivating incident used `--yes`). Keep `--yes` /
  `--override-fingerprints` semantics as-is; enforcement lives at the harness boundary
  (D-elc-1). Engine gets wording only (D-elc-4).

- **A `consent` gate in the C1 gate model — out (2026-07-07).** Gate state is a pure function of
  on-disk artifacts (`orbit-engine-gates`); "the user said yes just now" is conversation state,
  not artifact state. Modeling it as a gate would either corrupt the pure-function property or
  require consent-token files with fabrication problems. The consent prompt is a workflow-body
  step, like the Step 3.45 fingerprint check — not a gate.

- **Blocking blanket delegation entirely (refuse "run the whole cadence") — out (2026-07-07).**
  Blanket delegation stays legitimate for work WITHIN a command; D-elc-2 ensures even a delegated
  flow gets one harness-mediated touch at the irreversible step. Refusing delegation outright
  would fight orbit's AI-driven design instead of channeling it.

## References

- `orbit/architecture/d-arc-arbitered-flow.md` — **this exploration is Stage D1 of the D-arc
  program** (created 2026-07-08 when the session's scope outgrew a single explore). The program
  doc holds the arc's goals (incl. the token/context-economy constraint governing remaining
  decisions here), the sibling stages (architect / orientation / review-consistency /
  context-economy+models), sequencing, and the rules of engagement.

- `src/core/templates/workflows/archive-change.ts` — Steps 3.4 (gate prompt), 3.45 (fingerprint
  prompt), 3.5 (audit prompt): the anomaly-gated prompt pattern D-elc-2 complements; the consent
  step slots before Step 4 (sync-specs).
- `orbit/specs/orbit-engine-gates/spec.md` — `Inflection-prompt override contract`,
  `Single-voiced canonical-next computation`, `Gate-aware status and instructions with position
  readout` (D-elc-4's delta targets); `Gate state is a pure function of existing on-disk
  artifacts` (why consent is not a gate).
- `orbit/specs/orbit-conventions/spec.md` — the three-disciplines embedding pattern D-elc-3
  reuses; `Pushback discipline` as the model for a session-behavior requirement.
- `orbit/specs/orbit-archive-modifications/spec.md` — `Archive run summary written` (Q-elc-c's
  field-shape home) and the existing per-prompt fields (`user_decision`, `gate_overridden`,
  `fingerprint_overridden`).
- `orbit/changes/archive/2026-07-07-c2-parallel-merge-guardrail/.orbit-runs/` — the motivating
  incident's full trail (the AI-driven cadence, including the auto-archive at
  `archive-2026-07-07T14-30-23Z.json`); PR #7 (the unrequested outward action, Q-elc-b).
- `orbit/specs/orbit-audit-drift/spec.md` — home for D-elc-5's consent-record check (archive
  coherence category).
- `openspec-parallel-merge-plan.md` Phase 3.3 — upstream's "openspec branch" scaffolding idea
  (git-branch alignment); the D-elc-6 prerequisite's prior art.
- `.claude/skills/orbit-review-external/SKILL.md` — the handoff preflight (committed-and-pushed
  checks) whose pushed-branch requirement and graceful degradation D-elc-6's PR step mirrors.
