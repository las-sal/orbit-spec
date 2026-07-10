# Proposal: explicit-lifecycle-consent

## Why

During C2's delivery session, the driving AI ran the entire lifecycle — propose → reviews →
apply → system review → **archive → PR** — from one blanket instruction, because every safeguard
orbit has is anomaly-gated: prompts fire only when a gate is unpassed, fingerprints diverge, or
drift is CRITICAL. On the all-green path **nothing ever asks the human**, and the engine's
imperative `Next: /orbit:archive <name>` readout reads to an AI driver as an instruction to
execute. The user's requirement (D-arc goal 2, Stage D1): **the user is the arbiter of every
lifecycle transition** — apply (requirements→code, the flow's biggest commitment) and archive
(the baseline write) must never run on the AI's inferred authority; gate `passed` means
*eligible*, never *commanded*.

## What Changes

- **Consent declared in the schema** (D-elc-10): the gate vocabulary gains an optional
  `consent: user-invoked` attribute; `spec-driven` sets it on its two gated seams
  (`review-proposal before: apply`, `review-system before: archive`). The engine parses and
  surfaces it; custom schemas can define their own consent points.
- **Provenance-conditioned consent prompts** (D-elc-2/7): the apply, archive, and bulk-archive
  workflow bodies gain a consent AskUserQuestion that fires ONLY when the command is reached
  without an explicit same-turn user invocation (delegation, inference, handoff docs). User-typed
  invocations run with zero added prompts. `sync` inherits the containing flow's consent.
- **No-chaining contract** (D-elc-3): a new `orbit-conventions` requirement, echoed into every
  workflow body's disciplines block — one orbit workflow command per explicit user request; the
  AI recommends, never invokes; completing a command ends the turn at the position readout.
- **Eligibility phrasing** (D-elc-4): engine readouts stop issuing imperatives — the
  `Next:` label becomes `Ready when you are:` in `orbit status` / `orbit instructions` output and
  everywhere generated bodies quote it. Emit FIELD names (`next_recommended`) are untouched.
- **Consent provenance in the trail** (D-elc-5/8): consent-scoped lifecycle emits (apply,
  archive) gain one flat field — `consent: "user-invoked" | "prompted"` — and audit-drift's
  archive-coherence pass flags a consent-scoped emit missing it (WARNING): the empirical tripwire
  behind the arc's hooks deferral (R-d-2).
- **Engine never prompts** (D-elc-9): CLI-direct invocations are consent by definition; the
  engine reports, the bodies ask. Stated normatively so the spec can't drift toward engine
  prompting.
- **Explicitly out** (see design.md Alternatives): harness-hook enforcement (deferred, R-d-2),
  consent-as-a-gate, blocking blanket delegation, PR/outward-action integration (Stage D6).

## Capabilities

### New Capabilities

- `orbit-lifecycle-consent`: the consent model — invocation-provenance rule, consent prompts at
  the gated seams (apply / archive / bulk-archive per-change; sync inheritance), the CLI-direct
  boundary (engine never prompts), the `consent` emit field semantics, and the honest enforcement
  ceiling (body-layer only; hooks deferred with a named re-entry trigger).

### Modified Capabilities

- `orbit-engine-gates`: gate declaration vocabulary gains the optional `consent` attribute
  (parsed, validated, surfaced); the single-voiced canonical-next requirement adopts eligibility
  phrasing (`Ready when you are:`) and surfaces the consent marker; the `spec-driven v1 gates and
  cadence` requirement bumps to version 3 with both reviewed gates consent-marked.
- `orbit-conventions`: ADDED requirement — the no-chaining contract (one command per explicit
  user request; recommend-never-invoke; blanket-delegation scope limited to work WITHIN the
  requested command) — plus a MODIFIED `Internal-run JSON summary format` block: the canonical
  lifecycle example and both per-kind extension lines gain the `consent` field.
- `orbit-archive-modifications`: the archive run summary gains the `consent` field (scenario +
  shipped `archive-summary-schema.md` reference updated); the archive body gains the
  AI-mediated-entry consent prompt step.
- `orbit-run-summary-emit`: the apply emit shape gains the `consent` field scenario.
- `orbit-audit-drift`: archive-coherence category gains the missing-consent-record check
  (WARNING; pre-consent-era emits exempt via schema-version era detection).
- `orbit-onboard`: the identity-statement enumeration updates from three execution disciplines
  to four (no-chaining joins read-before-reference / change completeness / pushback).
- `orbit-review`: the exact stock final-assessment phrasings (8+ scenarios across both modes)
  re-labeled from imperative `Next:` to `Ready when you are:` with the ` — user-invoked` marker
  on apply/archive recommendations — the review reports are recommendation surfaces and were the
  only baseline carrier of the imperative label (repo-wide grep).

## Impact

- **Schema**: `schemas/spec-driven/schema.yaml` (consent attribute on two gates; version bump).
- **Engine**: `src/core/artifact-graph/{types,schema,gates}.ts` (parse/validate/surface consent;
  eligibility phrasing in `position` / canonical-next strings) + the status/instructions
  renderers registered in `src/cli/index.ts`.
- **Workflow templates** (`src/core/templates/workflows/`): `apply-change.ts`,
  `archive-change.ts`, `bulk-archive-change.ts` (consent prompt steps + emit field docs,
  including the archive body's `ARCHIVE_SUMMARY_SCHEMA_REFERENCE` literal); `audit-drift.ts`
  (tripwire check); ALL 15 bodies (no-chaining discipline echo + any quoted `Next:` phrasing).
- **Baseline specs**: 1 new + 7 delta'd capabilities (13 → 14).
- **Tests**: gate-schema parsing, eligibility-phrasing fidelity (grep: no imperative `Next:`
  survives), emit-schema docs, template parity hash re-pins, and the D1 exit-criteria checks
  (zero-prompt user path; tripwire demonstrably fires).
- **Compatibility**: `consent` is optional in the gate vocabulary — schemas without it behave
  exactly as today; pre-consent-era emits are exempt from the tripwire. No migration.
- **Program**: D-arc Stage D1 (`orbit/architecture/d-arc-arbitered-flow.md`); its exit criteria
  are this change's acceptance tests. This change practices its own contract while being built:
  every lifecycle transition is user-invoked.
