## MODIFIED Requirements

### Requirement: spec-driven v1 gates and cadence

The shipped `spec-driven` schema (version 5) SHALL declare: `review-proposal`
(`kind: reviewed`, requires/inputs the four artifacts, `cadence: [invoked, in-context]`,
`confirm: no-new-findings`, `budget: 3`, `before: apply`, `consent: user-invoked`), `apply`
(`kind: tracked`, today's block normalized),
and `review-system` (`kind: reviewed`, `requires: [apply]`,
`cadence: [invoked, in-context]`, `confirm: findings-resolved`, `budget: 3`,
`before: archive`, `consent: user-invoked`).
Both gates' leading slot is `invoked`: covered by what the user invoked, a single independent pass
or a complete blind pair (per the cadence-entry vocabulary and `The first review slot covers what the
user invoked`). `independent` and `blind-pair` remain in the vocabulary, and no shipped gate declares
them. **`confirm` is DECLARED and INERT.** Both gates still carry a value —
`no-new-findings` on the proposal gate, `findings-resolved` on the system gate — so every existing
schema keeps validating without a version bump, but NOTHING READS EITHER. The convergence criterion
is clauses (a) and (b) only, and there are no repeat rules left for a `confirm` value to match: a
cadence ends when the AI judges the work ready knowing what the independent reviewers returned, not
when a predicate certifies that they stopped finding things. Each cadence's
trailing `in-context` slot is the check on the walk that resolved the leading slot's findings; a
`--fresh` run (reviewer_class `fresh`) does NOT satisfy that trailing slot. The blind pair is the
RECOMMENDED first review, not the required one (R-crc-4 as amended 2026-10-05): it is the default
review preference, which shapes what the readout presents and nothing the gate accepts. Both budgets declare the SAME
expected cost — three independent passes — and the declaration is ALL they are; nothing consults
either figure. The proposal gate's cadence is NOT conditional on size: a change's size is
REPORTED by `orbit-change-size` (`Status carries the size figures`) and enters no gate, and no
proximity to the ceiling is computed — the blind pair is already the default review preference for
every proposal, so a near-ceiling rule could act only by overriding the user's own preference. No sizing argument attaches to either budget — not headroom for a repeat, not a
threshold to stay under. `budget` records what a cadence is EXPECTED to cost, never what it is
PERMITTED to cost (R-crc-11(h)): a cost target distorts the behaviour it measures, and the figure
this change demoted was doing exactly that. The cadence arrays and budgets live in the schema
YAML — tuning the review rhythm is a schema revision (version bump), not an engine or config
change. Verify remains a command (Pass 0 inside system review), not a gate; audit-drift remains
orthogonal to the gate graph.

**No versioned cadence.** No versioned schema selector exists, so version 5 gates every change,
including one stamped with an earlier `schema_version`. The move from version 4 is MONOTONE: a
version-4 trail carries no pair launch, so every independent pass on it is a single, and any
assignment that covered `[independent, in-context]` or `[blind-pair, in-context]` covers
`[invoked, in-context]` — with the same pass, or with the pair's earlier member as the single, whose
token and walks the in-context pass already beats.

#### Scenario: Cadence tuning is a schema edit

- **WHEN** a future revision changes the system cadence
- **THEN** the change is an edit to `schemas/spec-driven/schema.yaml` with a version bump; no
  engine code changes

#### Scenario: v5 declares the invoked slot on both gates

- **WHEN** the shipped `spec-driven` schema (version 5) is parsed
- **THEN** `review-proposal` and `review-system` both carry `cadence: [invoked, in-context]` and
  `budget: 3`

#### Scenario: v5 declares the consent-marked seams

- **WHEN** the shipped `spec-driven` schema (version 5) is parsed
- **THEN** both reviewed gates carry `consent: user-invoked` (per the consent vocabulary in the
  gate-declaration requirement), and a v2- or v3-era schema without the newer attributes parses
  and behaves exactly as before the bump

#### Scenario: A v3-era archived trail still computes

- **WHEN** gate state is computed over an archived change whose trail predates `blind-pair`
- **THEN** the computation completes without error, the gate reports its uncovered slot, and no
  live-change orientation row is produced for it — archived changes are not gated, and no
  versioned schema selector exists

#### Scenario: A trail that covered version 4 covers version 5

- **WHEN** a change's `review-system` trail holds a blind fresh and external pair, both walked, and an
  in-context pass later than both walks
- **THEN** under version 5 the gate's coverage still holds, with the earlier pair member on the
  `invoked` slot
