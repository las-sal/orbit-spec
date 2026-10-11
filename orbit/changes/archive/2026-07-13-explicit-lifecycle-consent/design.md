# Design: explicit-lifecycle-consent

## Context

This is **Stage D1 of the D-arc** (`orbit/architecture/d-arc-arbitered-flow.md` — read it first;
its D1 exit criteria are this change's acceptance tests, and rulings R-d-1..8 constrain the
design). The full decision record with rationale is `explore.md` (10 decisions, D-elc-1..10;
D-elc-6 relocated to arc Stage D6). This design maps those decisions onto the code and settles
the codegen-level details the explore deferred.

Grounding facts (verified against source during the explore; touchpoints listed in explore.md
References): every safeguard today is anomaly-gated (`archive-change.ts` Steps 3.4/3.45/3.5); the
engine's readouts render an imperative `Next:` label (composed in
`src/core/artifact-graph/gates.ts` and rendered by the status/instructions commands registered in
`src/cli/index.ts`); the gate vocabulary (`GateSchema` in `src/core/artifact-graph/types.ts`,
parsed in `schema.ts`) has no consent concept; consent prompting can only be enforced at the
harness boundary (AskUserQuestion — the one tool result the AI cannot self-author).

## Goals / Non-Goals

**Goals** (= arc D1 exit criteria):

1. Every post-change lifecycle emit (apply, archive) carries `consent: "user-invoked" |
   "prompted"`, and audit-drift demonstrably flags a post-era emit missing it.
2. A user-typed `/orbit:apply` / `/orbit:archive` runs with ZERO added prompts.
3. No imperative `Next:` phrasing survives in engine output or generated bodies (greppable).

**Non-Goals**:

- Harness-hook enforcement — DEFERRED with a named empirical re-entry trigger (arc R-d-2; the
  tripwire in goal 1 is what makes the deferral empirical). Do not implement, do not scaffold.
- PR / outward-action integration — arc Stage D6.
- Consent as a gate kind or pass condition — consent is orthogonal to gate state (see D3 below).
- Any change to review/verify/audit/explore/propose command behavior beyond the disciplines echo.

## Decisions

### D1. Provenance is the consent test; the prompt is the backstop (explore D-elc-2, D-elc-7)

Consent-scoped commands = the phases behind gates carrying `consent: user-invoked` — in
`spec-driven`: apply and archive (bulk-archive per-change; sync inherits its containing flow's
consent). The workflow body checks provenance at entry: an explicit same-turn user invocation
runs prompt-free; anything else fires the consent AskUserQuestion BEFORE any write. Prompt
content: position readout + concrete write preview + Proceed/Abort (two options — no
"address"-style third option; there is nothing to address). Ordering in archive: consent is
Step 0-equivalent, before the Step 3.4 gate prompt — consent asks "should we be here", anomaly
prompts ask "is the state sound".

### D2. Consent declared in the schema; engine parses and surfaces, bodies prompt (explore D-elc-10, D-elc-9)

`GateSchema` gains optional `consent: z.literal('user-invoked')` (closed set of one — same
pattern as the `kind`/`confirm` closed sets); `spec-driven` schema.yaml sets it on
`review-proposal` and `review-system`; version bumps 2 → 3. The engine surfaces the marker in
`gates[]` JSON and appends ` — user-invoked` to the canonical-next line for consent-marked phase
entries. The engine NEVER prompts (D-elc-9): CLI-direct typing is consent by definition;
`orbit archive`'s existing confirmations and the C2 fingerprint guard are untouched. Consent
changes no pass-condition computation — a gate can be `passed` while the phase awaits invocation
(eligibility and consent are independent axes).

### D3. Not a gate kind (explore Considered & out; arc Considered & out)

Gate state is a pure function of on-disk artifacts (C1 principle); "the user said yes just now"
is conversation state. Modeling consent as a gate would either corrupt that purity or require
consent-token files the AI could fabricate. Hence: attribute on existing gates (declaration),
prompt in bodies (behavior), field in emits (trail).

### D4. Eligibility phrasing: `Ready when you are:` (explore D-elc-4)

The exact label is pinned for testability: `Ready when you are: <command>` with
` — user-invoked` appended on consent-marked entries. Prohibited on all recommendation surfaces:
`Next:` and imperative equivalents. Where the label lives: the status command's readout line, the
`instructions` blocked-by-gate rendering guidance, and every generated body that quotes the
readout (grep sweep is part of the exit criteria). JSON field names (`next_command`,
`next_recommended`) unchanged — display wording only, so downstream parsers and the C1 emit
conventions are untouched.

### D5. One flat consent field; abort writes nothing (explore D-elc-8)

`consent: "user-invoked" | "prompted"` on apply and archive emits. Two values because a consent
abort writes NO summary (existing convention: aborted commands emit nothing), so an existing
summary has exactly two stories. A `source`-style object was rejected as unverifiable
self-report. Constant across one apply's chunk emits (provenance is per-invocation). Field
ownership: semantics in `orbit-lifecycle-consent`; apply-emit carriage in
`orbit-run-summary-emit`; archive-emit carriage in `orbit-archive-modifications` (matches the
C1/C2 precedent for `gate_overridden`/`fingerprint_overridden`).

### D6. Consent-era boundary: a persisted `schema_version` metadata marker; absence = exempt (REVISED after external iter 1)

Original mechanism ("schema resolves to a consent-aware version") was refuted by GPT-5 Codex's
external review: `.openspec.yaml` stores only the schema NAME, and the resolver loads the CURRENT
built-in definition — post-bump, pre-D1 archives would resolve as v3 and be falsely flagged on
the tripwire's first run. Revised mechanism (user-ratified option A): `ChangeMetadataSchema`
gains optional `schema_version` (precedent: C2's `base_fingerprints` extension), written by
`orbit new change` from the loaded schema's `version`. **Absence is the era signal** — every
pre-D1 change lacks the field and is exempt by construction; no backfill, no timestamp constant,
portable across adoption dates. Regression test: a real pre-D1 archive (C1/C2) must scan exempt.

REVISED AGAIN (external iter 2, user-ratified option B): absence-as-exempt over-exempted ACTIVE
straddlers — a pre-D1 change emitting post-D1 (this change itself is the specimen) would dodge
its own tripwire. Fix: migrate-on-touch — consent-scoped bodies stamp `consent_era_from: <TS>`
at entry on unmarked changes; tripwire is three-tier (schema_version → check all;
consent_era_from → check emits at-or-after stamp; neither → exempt). Invariant by construction:
post-capability body touch ⇒ tripwire coverage from that moment. Regressions: straddler's
post-touch emit checked; its pre-touch emits exempt; C1/C2 archives exempt.

### D7. The no-chaining echo rides the disciplines block (explore D-elc-3)

The `orbit-conventions` requirement is echoed into all 15 generated bodies as a fourth
discipline entry (same self-contained-duplication pattern as the existing three). Subtraction
accounting (arc R-d-4): the echo adds ~4 lines per body; offset by removing the now-redundant
per-body "don't auto-invoke" prose variants where they exist and tightening the completion-prompt
sections to render the engine's readout verbatim instead of hand-written next-step text.

## Alternatives considered

(Full record in explore.md Considered & out + arc Considered & out; summarized to prevent
rediscovery.)

- **Harness hooks (PreToolUse) as primary/only enforcement** — deferred (arc R-d-2): risk is
  low-severity and recoverable post-C2; hooks are provenance-blind (redundant friction on
  user-typed transitions) and Claude-only (two-tier vs codex); purely additive later; named
  re-entry trigger = the D5-goal-1 tripwire firing or a repeat incident.
- **Engine-side enforcement (required flags / TTY confirms)** — rejected: the AI drives the
  shell; any flag the engine demands, the AI can supply (the motivating incident used `--yes`).
- **Consent as a gate kind** — rejected (D3 above).
- **Always-on consent prompt (original D-elc-2)** — rejected on user pushback: a user-typed
  command IS consent; provenance-conditioning removes redundant friction without reopening the
  misread-delegation hole.
- **Blocking blanket delegation outright** — rejected: delegation within a command stays
  legitimate; the consent prompt gives even a delegated flow one harness-mediated touch at the
  seams.

## Risks / Trade-offs

- **[Honest ceiling] The prompt fires only if the body-following AI calls it** → accepted by
  ruling (arc R-d-2) with the audit tripwire as the empirical detector; re-entry to hooks is
  pre-authorized by trigger, not re-litigated.
- **[Provenance edge] "Unambiguous same-turn prose request" requires judgment at the margin** →
  the spec's examples pin the poles (typed slash command; "archive it" naming the act); bodies
  instruct: when provenance is uncertain, treat as AI-mediated (prompt) — erring toward one
  extra click, never toward silent proceed.
- **[Phrasing drift] New bodies could reintroduce `Next:`** → exit criterion 3 is a grep the
  test suite enforces (template-fidelity test), not a one-time sweep.
- **[Schema version bump] v3 must not break v2 consumers** → `consent` is optional; schemas
  without it parse and behave exactly as today (compat scenario in the engine-gates delta).

## Migration Plan

None required: `consent` is optional in the vocabulary; pre-era emits are exempt from the
tripwire by D6; no on-disk state is added outside schema + emits. Rollback = revert.

## Open Questions

None — D-elc-1..10 resolved in explore.md; D6 above settles the one deferred codegen detail
(era-boundary mechanism).
