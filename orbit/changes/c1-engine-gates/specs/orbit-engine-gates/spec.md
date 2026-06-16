## ADDED Requirements

### Requirement: Gate declaration in schema YAML

The schema YAML SHALL accept an optional `gates:` list. Each gate declares: `id` (unique among
gates and artifacts), `kind` (`tracked` | `reviewed` — a CLOSED set; any other value fails schema
validation), `requires` (artifact and/or gate ids that must be complete/passed before the gate is
runnable), and per-kind fields — `tracks` (checkbox file, `tracked` kind), `inputs` (freshness
scope: artifact ids whose change invalidates a pass; `reviewed` kind; defaults to `requires`),
`cadence` (ordered slot list, `reviewed` kind — see the cadence-entry vocabulary below), `confirm`
(the independent-confirmation predicate, `reviewed` kind: `no-new-findings` | `findings-resolved` —
a CLOSED set; selects which clause-(c) rule the gate uses; defaults to `no-new-findings`), `before`
(the target this gate blocks — see legal `before:` targets below), and optional `instruction`.
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

#### Scenario: Valid gates list parses

- **WHEN** a schema YAML declares `gates:` entries with valid ids, kinds, and references
- **THEN** `parseSchema` accepts it; gate ids participate in the same duplicate/reference/cycle
  validation as artifact ids

#### Scenario: Unknown kind rejected

- **WHEN** a schema YAML declares a gate with `kind: scored` (or any value outside the closed set)
- **THEN** schema validation fails with an error naming the gate id and the allowed kinds

### Requirement: Upstream `apply:` block normalized as a tracked gate

The upstream `apply:` block (`requires` / `tracks` / `instruction`) SHALL remain valid. When
present, the loader normalizes it into the gates list as a `kind: tracked` gate with id `apply`.
A schema declaring BOTH an `apply:` block AND a `gates:` entry with id `apply` fails validation
(double declaration). Schemas with no `gates:` list and only `apply:` (upstream and existing
project-local/XDG schemas) parse and behave exactly as today.

#### Scenario: apply-only schema unchanged

- **WHEN** a v1 schema with only an `apply:` block loads
- **THEN** the engine produces one tracked gate (id `apply`) with today's `blocked|ready|all_done`
  semantics; no behavior change is observable

#### Scenario: Double apply declaration rejected

- **WHEN** a schema declares both `apply:` and a gate with id `apply`
- **THEN** schema validation fails naming the conflict

### Requirement: Gate state is a pure function of existing on-disk artifacts

Gate state SHALL be computed on demand from: `.orbit-runs/` filename `<TS>` tokens, review-emit
JSON contents (findings counts, `reviewer_class`), address-reviews JSON contents
(`resolution_summary`, `source_path`), external findings markdown, the tracked checkbox file, and
artifact file existence. The engine SHALL NOT write any dedicated gate-state file; the audit
trail is the gate ledger.

#### Scenario: No new files written by state computation

- **WHEN** `orbit status` or `orbit instructions` computes gate state for a change
- **THEN** no file in the change directory (or anywhere else) is created or modified

#### Scenario: Recomputation reflects new trail entries immediately

- **WHEN** a new `review-system-<TS>.json` lands in `.orbit-runs/` and status is re-run
- **THEN** the computed gate state reflects it with no refresh/sync step

### Requirement: v1 freshness rule — timestamp-token ordering

A pass SHALL be marked STALE when an artifact-changing event exists whose `.orbit-runs/` filename
`<TS>` token is lexically later than the pass's token. v1 artifact-changing events are
`apply-*.json` emits (the generalization of the staleness semantics `orbit-review`'s convergence
states specify). Tokens are `YYYY-MM-DDTHH-MM-SSZ` and compare lexically. Files with unparseable
tokens are treated as absent. **v1 scope limitation**: because the only v1 artifact-changing event
is `apply-*.json` and no apply emit can exist before the `apply` gate runs, v1 freshness detects
POST-APPLY staleness only — a `review-proposal` pass never goes stale under v1 (artifact edits
during the proposal phase — address-reviews fixes, regeneration, hand edits — are not v1
artifact-changing events). The `inputs` freshness scope is declared for this upgrade path but is
not consulted by v1. Content-hash freshness is an explicit future upgrade: emits may later add
normalized input hashes keyed by `inputs` and the freshness function gains a clause — the
pure-function architecture is unchanged.

#### Scenario: Apply after pass marks the pass stale

- **WHEN** a review pass token precedes the latest `apply-*.json` token
- **THEN** the gate reports that pass STALE with the reason naming both tokens

#### Scenario: Resolution traffic does not trigger staleness

- **WHEN** only `address-reviews-*.json` or `review-*-*.json` files are newer than a pass
- **THEN** the pass is NOT stale (per-external scoping: resolution and re-review traffic are not
  artifact-changing events)

### Requirement: Tracked-gate pass condition

A `tracked` gate SHALL be: `blocked` while any `requires` entry is incomplete; `ready` when
runnable with unchecked boxes remaining in `tracks`; `passed` (today's `all_done`) when every
checkbox in `tracks` is checked. This is upstream apply's state machine, renamed into the gate
vocabulary.

#### Scenario: Checkbox arithmetic decides

- **WHEN** the tracked file has N checked of M boxes
- **THEN** the gate is `passed` iff N == M, with `N/M` surfaced in the gate's status row

### Requirement: Reviewed-gate pass condition — the computed convergence criterion

A `reviewed` gate SHALL pass when ALL of: (a) **class coverage (ordered slots)** — the gate's
`cadence` is an ordered list of SLOTS, not a set; each slot is satisfied by a FRESH pass (per the
freshness rule) of the slot's class whose `<TS>` token is STRICTLY LATER than the pass satisfying
the previous slot. A single pass therefore cannot satisfy two slots, and a repeated class (e.g. the
trailing `in-context` confirm in `[in-context, external, in-context]`) requires a distinct later
pass. An `independent` slot is satisfied by any `fresh` or `external` pass meeting the ordering
constraint. (b) **resolution** — every pass's findings are resolved: the most recent
`address-reviews-*.json` whose `source_path` references that pass's findings artifact shows
`resolution_summary.deferred == 0 AND escalated == 0` (a findings-free pass needs no resolution
run); (c) **independent confirmation (per the gate's `confirm` predicate)** — the most recent pass
from an independent class (`fresh` or `external`; never `in-context`) satisfies the gate's
`confirm` rule: `no-new-findings` requires 0 CRITICAL AND 0 new findings; `findings-resolved`
requires 0 CRITICAL AND that pass's findings all resolved per clause (b) (the relaxed rule for a
gate whose independent class repeats only on CRITICALs — e.g. the system external, where a first
external pass with findings later resolved via address-reviews DOES converge). A **new finding** is
matched against same-gate prior passes only, by trimmed case-sensitive title equality AND
repo-relative file path with any `:line` suffix stripped. The criterion SHALL be computed
exclusively from the audit trail — never from AI self-assessment of review quality.

#### Scenario: Missing class coverage fails the gate

- **WHEN** the cadence requires `external` and no fresh external pass exists
- **THEN** the gate is unpassed with reason `cadence class 'external' has no fresh pass` and the
  canonical next command targets that class

#### Scenario: Unresolved findings fail the gate

- **WHEN** a fresh pass has findings and no completing address-reviews run
- **THEN** the gate is unpassed with reason naming the pass and its unresolved counts

#### Scenario: Independent confirmation required

- **WHEN** all coverage and resolution clauses hold but the latest independent-class pass fails the
  gate's `confirm` predicate — a CRITICAL under either predicate, OR (for `confirm: no-new-findings`)
  a new finding
- **THEN** the gate is unpassed; the canonical next command continues the cadence's
  independent+address loop

#### Scenario: System gate converges on a resolved external

- **WHEN** a `review-system` gate (`confirm: findings-resolved`) has full ordered class coverage,
  its latest external pass carried findings, those findings are resolved
  (`resolution_summary.deferred == 0 AND escalated == 0`), and that external pass yielded 0 CRITICAL
- **THEN** the gate passes — the resolved-with-no-CRITICAL external satisfies `findings-resolved`
  even though the findings were "new" relative to prior passes

### Requirement: Reviewer-class resolution for legacy trails

When counting class coverage, the engine SHALL read `reviewer_class` from emits (per
`orbit-run-summary-emit`'s `Reviewer-class field on review-cycle emits`); for emits predating the
field it SHALL infer: `flags.fresh: true` → `fresh`; `external-*.md` provenance → `external`;
otherwise `in-context`. Absence of the field never fails gate computation.

#### Scenario: B-arc-era trail computes

- **WHEN** gate state is computed over an archived change whose emits predate `reviewer_class`
- **THEN** classes are inferred and the convergence computation completes

### Requirement: spec-driven v1 gates and cadence

The shipped `spec-driven` schema (version 2) SHALL declare: `review-proposal`
(`kind: reviewed`, requires/inputs the four artifacts, `cadence: [independent, in-context]`,
`confirm: no-new-findings`, `before: apply`), `apply` (`kind: tracked`, today's block normalized),
and `review-system` (`kind: reviewed`, `requires: [apply]`,
`cadence: [in-context, external, in-context]`, `confirm: findings-resolved`, `before: archive`).
`independent` in a cadence is the meta-class satisfiable by either `fresh` or `external` (per the
cadence-entry vocabulary). The proposal gate's `no-new-findings` confirm matches its repeat rule
(the independent+address pair repeats while the independent pass yields new findings); the system
gate's `findings-resolved` confirm matches its repeat rule (external repeats only while it yields
CRITICALs, so a resolved no-CRITICAL external converges). The cadence arrays live in the schema
YAML — tuning the review rhythm is a schema revision (version bump), not engine or config change.
Verify remains a command (Pass 0 inside system review), not a gate; audit-drift remains orthogonal
to the gate graph.

#### Scenario: Cadence tuning is a schema edit

- **WHEN** a future revision changes the system cadence
- **THEN** the change is an edit to `schemas/spec-driven/schema.yaml` with a version bump; no
  engine code changes

### Requirement: Gate-aware status and instructions with position readout

`orbit status` SHALL render gate rows (state: `blocked | ready | passed | stale | unpassed`, with
reasons) alongside artifact rows, and a one-line POSITION READOUT of the canonical flow (e.g.
`propose ✓ → review(proposal) ✓ → apply ✓ → review(system) STALE → archive blocked-by-gate`). Each
position-readout step token is a gate id or lifecycle-phase token (`propose`, `review(proposal)`,
`apply`, `review(system)`, `archive`); a gate step renders its computed state (`✓` passed, `STALE`,
`blocked-by-gate`, or the unpassed-class reason). Step order follows the gate graph's
`requires`/`before` edges; ties broken by declaration order in the schema YAML.
`orbit instructions` for a phase whose gate is unpassed SHALL return a `blocked-by-gate` state
carrying the gate id, the human-readable reason, and the canonical next command. JSON outputs
carry the same fields for downstream readers.

#### Scenario: Status shows the position readout

- **WHEN** `orbit status --change <name>` runs on a gated schema
- **THEN** the output includes the position readout and per-gate rows with reasons

#### Scenario: Instructions surface blocked-by-gate

- **WHEN** `orbit instructions apply --change <name> --json` runs while `review-proposal` is
  unpassed
- **THEN** the JSON includes `state: "blocked-by-gate"`, the gate id, the reason, and
  `next_command` (the canonical full invocation)

### Requirement: Single-voiced canonical-next computation

The engine SHALL compute ONE canonical next command per change state — the full invocation with
all applicable arguments and flags (e.g. `/orbit:review-external --as system <change>`) — derived
from the gate graph and cadence position. Recommendation surfaces (gate reasons, blocked-by-gate
payloads, and the workflow handoffs that render them) SHALL present only this canonical command:
no advertised alternatives, no skip paths, and no bare command names without arguments. Skills
render the engine-computed command verbatim.

#### Scenario: One command, fully specified

- **WHEN** any recommendation surface renders the next step
- **THEN** it is a single complete invocation; phrasings like "run review-external next" (no
  arguments) or "or proceed directly to archive" (advertised skip) do not appear

### Requirement: Inflection-prompt override contract

The consuming workflow SHALL fire an inflection prompt when a user invokes a command whose phase
is gated by an unpassed or stale gate, offering exactly: address the gate (halt; canonical next
command), proceed anyway, or abort. Proceeding SHALL be recorded in the command's run summary
(`gate_overridden: {gate, state, reason}`). Gates NEVER hard-block — apply-parity enforcement:
the engine reports, the skill prompts, the user decides, the trail records.

#### Scenario: Override recorded, not prevented

- **WHEN** the user proceeds past an unpassed `review-system` gate at archive
- **THEN** the archive completes and its run summary records the override with the gate's state
  and reason at decision time

#### Scenario: The prompt is the only skip surface

- **WHEN** a gate is unpassed
- **THEN** no recommendation text offers proceeding past it; the option exists only inside the
  inflection prompt fired by the actual invocation
