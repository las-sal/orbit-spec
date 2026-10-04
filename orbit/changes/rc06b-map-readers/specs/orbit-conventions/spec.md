## MODIFIED Requirements

### Requirement: Generated-file disposition

The system SHALL classify every skill and command file orbit generates into one of four disposition categories by template provenance. Each category dictates how the file's source template is maintained in the fork.

#### Scenario: Orbit-authored — full ownership

- **WHEN** a generated file's template body has no upstream-derived content (currently `orbit-onboard`, whose body replaces upstream's guided-tour content entirely; the net-new editorial workflows — review (whose `--reviewer external` branch absorbed the external packaging at D-arc Stage D5's merge; the standalone review-external template joined at B3 and RETIRED at D5), audit-drift, address-reviews; and `orbit-architect`, fully orbit-authored — joined as the 16th workflow at D-arc Stage D2, the surface standing at 15 post-D5)
- **THEN** the template is fully owned by orbit; orbit's contributors edit it freely; the file uses the `orbit-*` directory naming convention for consistency with siblings even when the body is 100% orbit-authored

#### Scenario: Orbit-modified — upstream body with `# Orbit additions`

- **WHEN** a generated file's template bundles upstream's body with an appended `# Orbit additions` section (`orbit-explore`, `orbit-propose`, `orbit-archive-change`, `orbit-apply-change`, `orbit-verify-change`, `orbit-continue-change`, `orbit-ff-change`, `orbit-new-change`, `orbit-bulk-archive-change`)
- **THEN** the upstream-authored portion is the vendored-baseline snapshot and SHALL change only through a change whose delta spec names the edit — the step it replaces and the requirement that replaces it — so a future upstream cherry-pick can find every edit as a named act; an edit so named lands IN PLACE, and no additions-section text overrides a step edited under this rule, so the body carries one instruction for that step; orbit's other behavior and constraints land in the additions section. Known limits, both from before this rule and outside its clauses: upstream portions already edited name no delta — `orbit-apply-change` and `orbit-archive-change` carry semantic edits, found by diffing each body's upstream portion against `upstream/v1.3.1` with the rename normalized (2026-10-04) — and additions sections already override upstream steps, such as `orbit-propose`'s consume mode replacing Step 1 and `orbit-bulk-archive-change`'s fingerprint check superseding Step 5c's heuristic; a cherry-pick finds the first kind by diffing against that tag and the second by reading the additions sections

#### Scenario: A named edit replaces an upstream step in place

- **WHEN** a change's delta spec names an edit to an orbit-modified body's upstream portion (`orbit-verify-modifications`' `Verify's Scenario Coverage step reads the scenario map` names the replacement of verify-change's test-tracing instruction)
- **THEN** the step is edited in place in the upstream portion, no additions-section text overrides the same step, and the rest of the upstream portion stays the snapshot

#### Scenario: Upstream-verbatim — kept unchanged

- **WHEN** orbit generates an upstream skill it never modified because its interaction is at the invocation layer, not the skill-body layer (currently `orbit-sync-specs`, which upstream's own archive flow invokes as a callable primitive)
- **THEN** the template carries the upstream body unchanged; no `# Orbit additions` section is needed

#### Scenario: Not generated — excluded from the install surface

- **WHEN** an upstream skill provides no orbit-mission value (e.g., `feedback`, which sends user feedback to Fission-AI and has no role in orbit's workflow)
- **THEN** orbit does not register its template for generation; a fresh `orbit init` produces no such skill or command in the project

#### Scenario: Per-skill disposition is documented

- **WHEN** orbit's contributors evaluate a new upstream skill arriving via a future engine upgrade or cherry-pick
- **THEN** the disposition decision is recorded in the change proposal that performs the upgrade; the new skill is assigned to one of the four categories with rationale

#### Scenario: Commands are thin launchers delegating to skills

- **WHEN** orbit generates (or declines to generate) a `/orbit:*` command file
- **THEN** the command is a thin launcher that invokes its corresponding skill (the skill is the single source of workflow behavior and carries the disposition above); the command surface mirrors the skill surface 1:1, and a skill that is not generated has no command either
