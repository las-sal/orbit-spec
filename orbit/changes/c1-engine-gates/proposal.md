## Why

With parity reached (B3 archived 2026-06-12), orbit's editorial layer is first-class prose — but
the engine (`src/core/artifact-graph/`, ~1,150 lines) still computes completion as monotonic file
existence and knows nothing about review. The observed costs in real use (captured as maxims in
`explore.md`): the AI recommends the wrong next step or none; sessions exit early to apply/archive
skipping reviews; the AI declares review cycles "maximally effective" and is later proven wrong by
external passes; review ordering is ad-hoc; external-handoff commit/push state is inconsistently
performed and stated. C1 moves the truth-computation from prose into the engine: gates with
non-monotonic, **computed** pass-conditions, a prescribed review cadence, and handoffs that always
render a position readout plus one canonical full command.

## What Changes

- **Engine — generalize `apply` into N gates** (fork D4): the schema YAML gains an optional
  `gates:` list with a closed two-kind set — `tracked` (pass = checkbox arithmetic; today's apply)
  and `reviewed` (pass = the computed convergence criterion). Upstream's `apply:` block stays
  valid and is normalized into the gates list (cherry-pick + third-party/project-local schema
  compatibility). Cadence arrays live in the schema YAML — tuning = schema revision.
- **Gate state is a pure function of existing on-disk artifacts** — `.orbit-runs/` filename
  tokens + review/address-reviews JSON contents + `tasks.md` checkboxes + artifact existence.
  No new state files. v1 freshness = promoted timestamp-token ordering (B3's spec'd convergence
  semantics moved from prose into the engine); content hashes are a later precision upgrade.
- **Computed review convergence** replaces AI self-assessment: a `reviewed` gate passes when every
  cadence-required reviewer class has a fresh, resolved pass AND the latest independent-class
  iteration yielded 0 CRITICAL and 0 new findings. Emits gain a first-class
  `reviewer_class: in-context|fresh|external` field.
- **v1 gate edges** in `spec-driven`: `review-proposal` gates `apply`; `review-system` gates
  `archive`. Verify stays a command (Pass 0 inside system review); audit-drift stays orthogonal.
- **Single-voiced recommendations**: stock phrasings lose their advertised skip paths ("or proceed
  directly to /orbit:archive…"); skipping happens only at the inflection prompt when the user
  invokes a gated command (address / proceed-anyway / abort, decision recorded). **BREAKING** for
  the exact stock-phrasing contracts in `orbit-review` (deliberate; MODIFIED deltas).
- **Position readout + full-command convention**: every workflow handoff states where the change
  is in the flow (engine-derived, e.g. `propose ✓ → review(proposal) ✓ → apply ✓ →
  review(system) STALE → archive blocked-by-gate`) and the complete next command with all flags.
- **External-handoff attestations**: the packaging side states `Prompt committed (<sha>) and
  pushed to <remote>/<branch>` when the preflight is satisfied; the prompt template requires the
  external AI to state its findings commit/push (or its inability) in chat.
- **CLI surface**: `orbit status` / `orbit instructions` become gate-aware (gate rows with
  pass/stale/blocked reasons; `blocked-by-gate` states with the canonical next command).

## Capabilities

### New Capabilities

- `orbit-engine-gates`: the gate concept — schema declaration (`gates:` list, two kinds, `apply:`
  normalization), pure-function state computation, the freshness rule, the convergence criterion
  and v1 cadence content, gate edges, position readout, single-voiced recommendation computation,
  and the inflection-prompt override contract.

### Modified Capabilities

- `orbit-review`: the system-mode final-assessment stock phrasings become single-voiced and
  engine-sourced (skip clauses removed from recommendations; convergence states computed by the
  engine, rendered by the skill).
- `orbit-review-external`: the handoff preflight gains the affirmative committed-and-pushed
  attestation; the prompt template's "After completing the review" section requires the external
  AI's own commit/push statement.
- `orbit-run-summary-emit`: review-cycle emits gain the `reviewer_class` field (ADDED requirement;
  new concern, no existing behavior changed).
- `orbit-conventions`: the `Review mode decision framework` requirement becomes gate-aware — the
  advisory recommendation is now backed by the engine-computed `review-system` gate (apply-parity:
  surfaced and recorded, never hard-blocked); the "advisory, not a gate" and "does NOT enforce
  cycle patterns" scenarios are reconciled with the gate model (gate-surfaced, not gate-enforced).
- `orbit-archive-modifications`: the `Critical-drift prompt, not gate` and `Audit informational,
  not blocking by default` requirements are scoped against the new gate inflection prompt — "archive
  proceeds without prompting" now scopes to the audit-drift prompt only (the `review-system` gate
  fires its own inflection prompt), and "system review is the user's gate" is reconciled with the
  engine-computed gate that surfaces at archive and records `gate_overridden` on override.

## Impact

- **Code**: `src/core/artifact-graph/` (types, schema, state, instruction-loader — the gate
  machinery), `schemas/spec-driven/schema.yaml` (version 2: `gates:` list), `src/commands/`
  status/instructions surfaces, the four editorial workflow bodies (phrasings, position readouts,
  attestations) + other workflow bodies' completion prompts (position readout convention).
- **Specs**: 1 ADDED capability (11 baseline → 12), 5 MODIFIED (`orbit-review`,
  `orbit-review-external`, `orbit-run-summary-emit`, `orbit-conventions`,
  `orbit-archive-modifications`).
- **Tests**: engine unit tests (gate parsing, normalization, state computation, freshness,
  convergence), schema-compat tests (upstream `apply:`-only YAML still parses), body fidelity
  updates for the rephrased recommendations.
- **Compatibility**: upstream and project-local schemas keep working (`apply:` sugar); existing
  `.orbit-runs/` audit trails are readable as-is (emits without `reviewer_class` degrade to
  class-inference; absence never breaks gate computation).
