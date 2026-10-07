## MODIFIED Requirements

### Requirement: Deterministic facts are engine-composed per command

Where a capability defines an emit field as a deterministic fact, the surface SHALL compute it
— never accept it from the payload: for review emits, `final_assessment` is the severity-counts
sentence derived from the payload's scorecard (`"X critical, Y warning, Z suggestion."` /
`"No findings."`) and `next_recommended` is the findings-dependent pointer — when findings
exist, the change-scoped `/orbit:address-reviews <change>` for proposal/system (naming no file:
on an active change the change-scoped walk discovers every pass that carries a finding, per `orbit-address-reviews`'
`Address-reviews command available`, so the emit names the same invocation as the gate's
canonical next per `orbit-engine-gates`' `A reviewed gate lists its outstanding passes`), and for architecture mode the address-reviews
`--from-file` invocation naming this emit's own path (no change-scoped walk reads the
architecture trail); when CLEAN,
the `orbit status --change <name> --report` render pointer for proposal/system, and for
architecture mode — where `change` is null and no report surface exists — the payload's
architect-owned `handoff.next_command`, MIRRORED per the architect rule below — per
`orbit-report-rendering`'s strict contract, which the write gate enforces on proposal/system —
and review emits'
`iteration` is likewise engine-computed: for proposal/system the next ordinal on the SHARED
internal+external pass axis (the report ordinal's counting rule per `orbit-report-rendering`);
for architecture mode the per-DOC ordinal (prior `review-architecture-*.json` emits with
matching `doc` + 1 — the `orbit-review` baseline's own per-doc anchoring), never
payload-supplied — the ordinal-divergence seam D4 closed at render time stays closed at write
time; for review-external
T0 emits, `next_recommended` is the recommendation `orbit-run-summary-emit`'s `Review-external
T0 multi-step recommendation` owns, composed from the prompt path template, and
`awaiting_findings: true` is engine-set; for explore emits, the
counts and maturity-grid recommendation per the computed-extensions requirement; for apply
emits, `final_assessment`'s CORE is the engine-composed chunk/counts sentence from the fields
the engine already computes (`"Completed chunk 2 of 5 (inventory+parsing); 28 of 76 tasks
done."`, with paused and no-chunking variants from `chunk_complete`/`chunk`), and the payload
MAY supply an optional `assessment_suffix` string (the judgment sentence) that the engine
appends after the core — a payload-supplied `final_assessment` on an apply emit is rejected
as engine-owned (the two-voices seam the D-d5-1 governing rule closes; review's counts
sentence is the precedent); for architect emits, the spine's `next_recommended` is
engine-COPIED verbatim from the payload's architect-owned `handoff.next_command` (the
`handoff` section remains the single authored home — the spine field mirrors it, never a
second author; direct payload supply of spine `next_recommended` stays rejected). The
remaining emitting commands (the propose family, verify, audit-drift) derive their
recommendations as deterministic facts from their owning capability's recommendation
requirements in `orbit-run-summary-emit` — no emitting command lacks a composition rule.

#### Scenario: Review counts sentence composed from the payload scorecard

- **WHEN** a review payload's scorecard sums to 1 warning
- **THEN** the written emit's `final_assessment` is `0 critical, 1 warning, 0 suggestion.` and, for a proposal- or system-mode pass on change `foo`, `next_recommended` is `/orbit:address-reviews foo` — naming no path

#### Scenario: Review iteration engine-computed from the shared pass axis

- **WHEN** `orbit emit review --change foo` runs with two prior passes on foo's shared internal+external axis
- **THEN** the emit carries `iteration: 3` computed from the trail; a payload supplying `iteration` is rejected naming the field

#### Scenario: T0 recommendation composed from the path template

- **WHEN** `orbit emit review-external --change foo` receives a payload with `prompt_path`
- **THEN** the emit's `next_recommended` is the paste-and-save prose naming the prompt path and the expected findings path pattern, ending at the save step, and `awaiting_findings` is `true`

#### Scenario: Apply assessment core engine-composed, suffix appended

- **WHEN** `orbit emit apply --change foo` fires at chunk-2 completion with payload `assessment_suffix: "Parser edge cases ran deeper than planned."`
- **THEN** the written `final_assessment` is the engine-composed chunk/counts core followed by the suffix; a payload supplying `final_assessment` itself is rejected naming the field

#### Scenario: Architect recommendation mirrors the handoff

- **WHEN** `orbit emit architect --doc my-program` receives a payload whose `handoff.next_command` names the resume invocation
- **THEN** the emit's spine `next_recommended` equals that handoff value verbatim — mirrored, not re-authored; a payload supplying spine `next_recommended` directly is still rejected naming the field

#### Scenario: Architecture-mode review keeps its self pointer

- **WHEN** `orbit emit review --doc my-program` writes an architecture-mode pass with one finding
- **THEN** `next_recommended` is `/orbit:address-reviews --from-file orbit/architecture/.orbit-runs/<this emit's file name>` — unchanged by the change-mode short form

#### Scenario: A clean change-mode pass still points at the report

- **WHEN** a proposal-mode payload for change `foo` carries no findings
- **THEN** `next_recommended` is `orbit status --change foo --report`
