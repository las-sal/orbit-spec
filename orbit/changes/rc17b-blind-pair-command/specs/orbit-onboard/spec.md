## MODIFIED Requirements

### Requirement: Identity statement section

Section 2 of the body SHALL state what orbit IS and enumerate its distinctive layers, using self-contained-fork framing.

#### Scenario: Self-contained-fork framing

- **WHEN** the Identity section is read
- **THEN** the prose positions orbit (orbit-spec) as a self-contained hard fork of `@fission-ai/openspec@1.3.1` — the upstream engine and orbit's editorial/judgment layer live together in one tool invoked as `orbit`, with no overlay and no separately-installed CLI; the engine is pinned (deliberate, surgical upgrades only)

#### Scenario: Enumerates orbit-distinctive layers

- **WHEN** the Identity section is read
- **THEN** the prose names the distinctive layers concretely: editorial review (`/orbit:review` with its reviewer axis — named, with its values left to `orbit-review`'s "Review command available with `--as` mode flag" rather than enumerated here; `/orbit:address-reviews`), drift audit (`/orbit:audit-drift`), capture (lenses — `orbit/lenses/perspectives.md`, `orbit/lenses/critical-paths.md`), program architecture (`/orbit:architect`, `orbit architecture status` — the cross-change declaration tier, D-arc Stage D2), JSON run-summary emission, four execution disciplines (read-before-reference / change completeness / pushback / no-chaining)

#### Scenario: No augmentation / overlay language

- **WHEN** the Identity section is reviewed (manually or via grep)
- **THEN** the prose does not frame orbit as an additive layer on upstream — phrases like `augments cleanly`, `overlay on top of`, `layered on top of`, `extends upstream` are absent
