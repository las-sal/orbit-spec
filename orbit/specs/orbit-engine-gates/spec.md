# orbit-engine-gates Specification

## Purpose
Make the engine review-aware: schemas declare `gates:` (a CLOSED two-kind set — `tracked`
checkbox arithmetic and `reviewed` convergence computed from the `.orbit-runs/` trail), whose
state is a pure function of on-disk artifacts. The engine computes gate state, freshness
(v1 timestamp-token ordering), a single-voiced canonical-next command, and a one-line position
readout; consuming workflows surface inflection prompts at gated phases (apply-parity — the
engine reports, the skill prompts, the user decides, the trail records; gates never hard-block).
## Requirements
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

### Requirement: Upstream `apply:` block normalized as a tracked gate

The upstream `apply:` block (`requires` / `tracks` / `instruction`) SHALL remain valid. When
present, the loader normalizes it into the gates list as a `kind: tracked` gate with id `apply`.
A schema declaring BOTH an `apply:` block AND a `gates:` entry with id `apply` fails validation
(double declaration). Schemas with no `gates:` list and only `apply:` (upstream and existing
project-local/XDG schemas) parse and behave exactly as today. As part of gate reference-validation,
the normalized `apply` gate's `requires`/`inputs` are now checked against declared artifact/gate ids
— so an `apply:` block with a dangling reference (e.g. `requires: [<typo>]`) fails schema validation
eagerly rather than surfacing as a missing artifact at apply time. Well-formed apply-only schemas
are unaffected.

#### Scenario: apply-only schema unchanged

- **WHEN** a WELL-FORMED v1 schema with only an `apply:` block loads
- **THEN** the engine produces one tracked gate (id `apply`) with today's `blocked|ready|all_done`
  semantics; no behavior change is observable (the reference-validation tightening affects only
  malformed schemas with dangling `apply.requires`)

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
`apply-*.json` emits (an apply is the one v1 event that rewrites the artifacts a review pass
judged, so any pass predating it no longer describes current state — D-arc Stage D4 collapsed
the prose formerly restating this in `orbit-review`; the semantics live here alone). Tokens are `YYYY-MM-DDTHH-MM-SSZ` and compare lexically. Files with unparseable
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
vocabulary — with ONE addition (D-arc Stage D5, the user-validation subset rule): when unchecked
boxes remain but EVERY one of them (a) is named in the engine-verified `user_validation_tasks`
declaration of the MOST RECENT apply emit CARRYING one (per `orbit-run-summary-emit` — the list
persists on the emit; the declaration is STICKY: a durable fact about the tasks, so a later
apply emit without the field leaves the standing declaration governing — retraction happens
where the task lives, via the tasks.md edit that checks the box or removes its marker) AND
(b) self-describes as a handoff (its checkbox line carries the `(User-validation`
marker), the gate SHALL compute `passed` FOR FLOW PURPOSES, carrying the pending task ids as an
annotation — the position readout renders `apply ✓ (awaiting user validation: <ids>)`, the
status row's reason names them, supersession and downstream `requires` treat the gate as passed,
and the canonical next command points forward. The condition is recomputed from disk on every
render (a pure function — no stored state): a new unchecked box outside the declared-and-marked
set breaks the subset and the gate honestly drops back to `ready`. A declaration alone never
suffices (the marker requirement makes mislabeling visible in the tasks.md diff review reads),
and the pending obligation is always surfaced, never hidden.

#### Scenario: Checkbox arithmetic decides

- **WHEN** the tracked file has N checked of M boxes and no user-validation subset condition holds
- **THEN** the gate is `passed` iff N == M, with `N/M` surfaced in the gate's status row

#### Scenario: Only declared user-validation handoffs remain

- **WHEN** tasks.md has one unchecked box `- [ ] 9.6 (User-validation handoff) ...`, and the latest apply emit declares `user_validation_tasks: ["9.6"]`
- **THEN** the apply gate computes `passed` with `userValidationPending: ["9.6"]`; the position renders `apply ✓ (awaiting user validation: 9.6)`; `review-proposal` becomes superseded and the canonical next command is the `review-system` gate's next step — never a backward pointer at a moot gate

#### Scenario: A new ordinary task breaks the subset

- **WHEN** the subset condition held, and a review walk adds `- [ ] 10.1 fix the regression` to tasks.md
- **THEN** the next render computes the apply gate back to `ready` (10.1 is neither declared nor marked) — self-healing, no state file involved

#### Scenario: Declaration without the self-describing marker is insufficient

- **WHEN** the latest apply emit declares `user_validation_tasks: ["9.6"]` but the 9.6 checkbox line lacks the `(User-validation` marker
- **THEN** the subset condition fails and plain arithmetic governs

#### Scenario: The declaration is sticky across later field-less emits

- **WHEN** the subset condition held via an apply emit declaring `user_validation_tasks: ["9.6"]`, and a LATER apply emit carries no `user_validation_tasks` field
- **THEN** the standing declaration still governs and the gate remains `passed (awaiting user validation: 9.6)` — a field omission never silently regresses the readout; retraction is the tasks.md edit

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

The shipped `spec-driven` schema (version 3) SHALL declare: `review-proposal`
(`kind: reviewed`, requires/inputs the four artifacts, `cadence: [independent, in-context]`,
`confirm: no-new-findings`, `before: apply`, `consent: user-invoked`), `apply` (`kind: tracked`, today's block normalized),
and `review-system` (`kind: reviewed`, `requires: [apply]`,
`cadence: [in-context, external, in-context]`, `confirm: findings-resolved`, `before: archive`, `consent: user-invoked`).
`independent` in a cadence is the meta-class satisfiable by either `fresh` or `external` (per the
cadence-entry vocabulary). The proposal gate's `no-new-findings` confirm matches its repeat rule
(the independent+address pair repeats while the independent pass yields new findings); the system
gate's `findings-resolved` confirm matches its repeat rule (external repeats only while it yields
CRITICALs, so a resolved no-CRITICAL external converges). The cadence arrays live in the schema
YAML — tuning the review rhythm is a schema revision (version bump), not engine or config change.
Verify remains a command (Pass 0 inside system review), not a gate; audit-drift remains orthogonal
to the gate graph. The system cadence's two `in-context` slots require a pass of reviewer_class
`in-context`: a `--fresh` system run (reviewer_class `fresh`) does NOT satisfy them (`fresh` covers
the meta-class `independent`, which the system cadence does not use), so a fresh run cannot close
the trailing system confirm — it surfaces the gate as still needing its in-context slot.

#### Scenario: Cadence tuning is a schema edit

- **WHEN** a future revision changes the system cadence
- **THEN** the change is an edit to `schemas/spec-driven/schema.yaml` with a version bump; no
  engine code changes

#### Scenario: v3 declares the consent-marked seams

- **WHEN** the shipped `spec-driven` schema (version 3) is parsed
- **THEN** both reviewed gates carry `consent: user-invoked` (per the consent vocabulary in the
  gate-declaration requirement), and a v2-era schema without the attribute parses and behaves
  exactly as before the bump

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

### Requirement: Single-voiced canonical-next computation

The engine SHALL compute ONE canonical next command per change state — the full invocation with
all applicable arguments and flags (e.g. `/orbit:review --as system --reviewer external <change>`
— the merged reviewer-class form, D-arc Stage D5; the retired `/orbit:review-external` invocation
never renders on any recommendation surface, while archived records citing it remain untouched) —
derived from the gate graph and cadence position. When the next uncovered cadence slot is the
`independent` meta-class (satisfiable by a `fresh` OR an `external` pass), the engine's single
canonical command SHALL be the fresh-context review (`/orbit:review --as <mode> --fresh <change>`)
— the lighter proposal-phase default. An external pass also satisfies an `independent` slot for
class-coverage purposes, but the rendered recommendation stays single-voiced: the fresh-context
command only, never co-offered with the external alternative. Recommendation surfaces (gate
reasons, blocked-by-gate payloads, and the workflow handoffs that render them) SHALL present only
this canonical command: no advertised alternatives, no skip paths, and no bare command names
without arguments. Skills render the engine-computed command verbatim.

**Eligibility phrasing (D-arc Stage D1, D-elc-4)**: the canonical-next command SHALL be rendered under
an eligibility-framed label — `Ready when you are:` — never an imperative label (`Next:` and
equivalents are prohibited on every recommendation surface: `orbit status` output,
`instructions` payload rendering, and generated workflow bodies that quote the readout). When the
canonical-next command's phase entry is consent-marked (`consent: user-invoked` on the gate whose
`before:` is that phase), the rendered line SHALL append the marker ` — user-invoked`
(e.g. `Ready when you are: /orbit:apply <name> — user-invoked`). Rationale: words are the API
when the consumer is a model; an imperative label reads as an instruction to execute. Emit FIELD
names (`next_recommended`) are unchanged — display wording only.

**Model-hint garnish (D-arc Stage D5, D-d5-9)**: when `orbit/config.yaml` carries an OPTIONAL
`models:` map and the canonical-next command's phase or cadence slot has an entry, the rendered
eligibility line SHALL append ` — hint: <value>` (after any ` — user-invoked` marker). Valid
keys are the two vocabularies the engine already computes against: the active schema's phase
ids (for `spec-driven` v3: `review-proposal`, `apply`, `review-system`, plus any other declared
phase) and the cadence slot names (`in-context`, `fresh`, `independent`, `external`). When both
the resolved command's phase AND its cadence slot carry entries, the SLOT entry wins (the more
specific hook); keys outside both vocabularies are inert (never an error — the map is garnish).
The VALUE is checked only at the rendering boundary: a renderable hint is a non-empty
single-line string of at most 80 characters containing no control characters — the
eligibility line is a model-facing protocol, and an embedded newline could forge additional
readout lines; a value failing the check is INERT exactly like an unknown key (the line
renders without the suffix, byte-identical to an absent entry, never an error). Beyond that
boundary check the hint is pure garnish: the content is not validated, nothing is enforced,
and an absent map (or absent
entry) yields byte-identical pre-capability output. The phase-mapping content itself is
user-owned config, never spec.

#### Scenario: One command, fully specified

- **WHEN** any recommendation surface renders the next step
- **THEN** it is a single complete invocation; phrasings like "run review-external next" (no
  arguments) or "or proceed directly to archive" (advertised skip) do not appear

#### Scenario: Eligibility label, never imperative

- **WHEN** `orbit status --change <name>` renders the canonical next command
- **THEN** the label is `Ready when you are:` (with ` — user-invoked` appended for
  consent-marked phase entries); no recommendation surface renders an imperative `Next:` label

#### Scenario: External slot renders the merged form

- **WHEN** the cadence's next uncovered slot is `external`
- **THEN** the canonical command renders as `/orbit:review --as <mode> --reviewer external <change>` — the retired standalone invocation appears on no surface

#### Scenario: Model hint appends when configured

- **WHEN** `orbit/config.yaml` maps the external slot to `"GPT-5 Codex"` and the canonical next command is the external review
- **THEN** the eligibility line ends ` — hint: GPT-5 Codex`; with no `models:` map the line is byte-identical to pre-capability output

#### Scenario: Malformed hint value is inert at the rendering boundary

- **WHEN** a `models:` entry's value contains an embedded newline (or control characters, or exceeds 80 characters)
- **THEN** the eligibility line renders WITHOUT the hint suffix — byte-identical to an absent entry; no error, no partial injection into the readout

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
