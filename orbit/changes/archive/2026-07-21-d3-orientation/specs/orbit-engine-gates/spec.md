## MODIFIED Requirements

### Requirement: Gate declaration in schema YAML

The schema YAML SHALL accept an optional `gates:` list. Each gate declares: `id` (unique among
gates and artifacts), `kind` (`tracked` | `reviewed` — a CLOSED set; any other value fails schema
validation), `requires` (artifact and/or gate ids that must be complete/passed before the gate is
runnable), and per-kind fields — `tracks` (checkbox file, `tracked` kind), `inputs` (freshness
scope: artifact ids whose change invalidates a pass; `reviewed` kind; defaults to `requires`),
`cadence` (ordered slot list, `reviewed` kind — see the cadence-entry vocabulary below), `confirm`
(the independent-confirmation predicate, `reviewed` kind: `no-new-findings` | `findings-resolved` —
a CLOSED set; selects which clause-(c) rule the gate uses; defaults to `no-new-findings`), `before`
(the target this gate blocks — see legal `before:` targets below), optional `consent` (see the
consent vocabulary below), and optional `instruction`.
There is NO generic pass-condition plugin mechanism — the two kinds are the extension surface.

**Cadence-entry vocabulary** (defined once here; referenced by clause (a) of the reviewed-gate
pass condition and by `spec-driven`): each `cadence` entry is one of the three reviewer classes
`in-context` | `fresh` | `external`, OR the meta-class `independent` (satisfied by a `fresh` OR an
`external` pass; never `in-context`). `independent` is a cadence-only token — it is NOT a value the
`reviewer_class` emit field ever carries.

**Legal `before:` targets**: a declared gate id, a declared artifact id, OR a lifecycle-phase token
from the enumerated set {`apply`, `archive`}. `apply` is modeled by the engine as a phase
(`orbit instructions apply` returns its gate state); `archive` is a lifecycle phase the CLI does
NOT model as an `instructions` target — a gate with `before: archive` is queried through the
archive workflow's gate surface (`orbit status --change <name> --json`, which carries `gates[]` and
`next_command`), never through `orbit instructions archive`.

**Consent vocabulary** (D-arc Stage D1, per `orbit-lifecycle-consent`): `consent` is an optional gate
attribute with the single legal value `user-invoked` (a CLOSED set of one for v1; any other value
fails schema validation). It declares that entry into the gate's `before:` phase requires an
explicit user invocation — the engine PARSES and SURFACES the marker (in `gates[]` JSON and the
readouts per the single-voiced requirement below); the consuming workflow bodies implement the
consent prompt per `orbit-lifecycle-consent`'s provenance rule. The attribute changes NO gate
pass-condition computation — consent is orthogonal to gate state (a gate can be `passed` while
its phase still awaits the user's invocation). `spec-driven` sets `consent: user-invoked` on
`review-proposal` (before: apply) and `review-system` (before: archive).

#### Scenario: Valid gates list parses

- **WHEN** a schema YAML declares `gates:` entries with valid ids, kinds, and references
- **THEN** `parseSchema` accepts it; gate ids participate in the same duplicate/reference/cycle
  validation as artifact ids

#### Scenario: Unknown kind rejected

- **WHEN** a schema YAML declares a gate with `kind: scored` (or any value outside the closed set)
- **THEN** schema validation fails with an error naming the gate id and the allowed kinds

#### Scenario: Consent attribute parses, surfaces, and rejects unknown values

- **WHEN** a schema YAML declares `consent: user-invoked` on a gate
- **THEN** `parseSchema` accepts it and `orbit status --change <name> --json` carries the marker on that gate's
  `gates[]` entry; a schema declaring any other consent value fails validation naming the gate id
  and the single legal value

#### Scenario: Consent does not alter gate computation

- **WHEN** a gate with `consent: user-invoked` meets its pass condition
- **THEN** its computed state is `passed` exactly as without the attribute — eligibility and
  consent are independent axes

### Requirement: Gate-aware status and instructions with position readout

`orbit status --change <name>` (the per-change form; bare `orbit status` is the orientation surface per `orbit-orientation` — D-arc Stage D3) SHALL render gate rows (state: `blocked | ready | passed | stale | unpassed`, with
reasons) alongside artifact rows, and a one-line POSITION READOUT of the canonical flow (e.g.
`propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate`).
Each position-readout step token is a gate id or lifecycle-phase token (`propose`, `review(proposal)`,
`apply`, `review(system)`, `archive`); a gate step renders its computed state (`✓` passed, `STALE`,
`ready`, `blocked-by-gate`, `unpassed`, or `(past)` for a superseded gate). **Superseded gates**: a
`reviewed` gate whose `before` phase is already complete (e.g. `review-proposal` after `apply` has
passed) is no longer the active frontier — it gated ENTRY to a phase that has since run. Such a gate
is marked SUPERSEDED (distinct from `passed`: it may never have converged; the flow simply advanced
past it), renders as `(past)`, and is SKIPPED by the single-voiced canonical-next computation so the
recommendation advances to the next actionable gate rather than re-surfacing a moot earlier one.
Step order follows the gate graph's `requires`/`before` edges; ties broken by declaration order in
the schema YAML (v1 relies on declaration order matching flow order, as the shipped `spec-driven`
schema does). `orbit instructions` for a phase whose gate is unpassed SHALL return a `blocked-by-gate`
state carrying the gate id, the human-readable reason, and the canonical next command. JSON outputs
carry the same fields for downstream readers.

#### Scenario: Status shows the position readout

- **WHEN** `orbit status --change <name>` runs on a gated schema
- **THEN** the output includes the position readout and per-gate rows with reasons

#### Scenario: Instructions surface blocked-by-gate

- **WHEN** `orbit instructions apply --change <name> --json` runs while `review-proposal` is
  unpassed AND no task has been checked yet (apply has not started)
- **THEN** the JSON includes `state: "blocked-by-gate"`, the gate id, the reason, and
  `next_command` (the canonical full invocation)

#### Scenario: blocked-by-gate is entry-gated, not a mid-apply re-block

- **WHEN** `orbit instructions apply` runs while `review-proposal` is unpassed/stale BUT one or more
  tasks are already checked (implementation is underway)
- **THEN** the state is `ready` (not `blocked-by-gate`): the gate gates ENTRY to apply and is checked
  only before the first task is completed. Post-apply the `review-proposal` pass goes stale relative
  to the `apply-*.json` emit (expected + moot per the v1 freshness scope) and the gate has already
  served its purpose, so mid-apply continuation is never re-blocked. Apply-parity holds throughout:
  even at entry the gate NEVER hard-blocks — the consuming skill prompts (address / proceed-anyway /
  abort) and records `gate_overridden` on proceed-anyway.
