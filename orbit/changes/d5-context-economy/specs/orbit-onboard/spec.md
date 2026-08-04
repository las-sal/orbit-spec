## MODIFIED Requirements

### Requirement: Identity statement section

Section 2 of the body SHALL state what orbit IS and enumerate its distinctive layers, using self-contained-fork framing.

#### Scenario: Self-contained-fork framing

- **WHEN** the Identity section is read
- **THEN** the prose positions orbit (orbit-spec) as a self-contained hard fork of `@fission-ai/openspec@1.3.1` — the upstream engine and orbit's editorial/judgment layer live together in one tool invoked as `orbit`, with no overlay and no separately-installed CLI; the engine is pinned (deliberate, surgical upgrades only)

#### Scenario: Enumerates orbit-distinctive layers

- **WHEN** the Identity section is read
- **THEN** the prose names the distinctive layers concretely: editorial review (`/orbit:review` with the `--reviewer in-context|fresh|external` axis — D-arc Stage D5's merge, `/orbit:address-reviews`), drift audit (`/orbit:audit-drift`), capture (lenses — `orbit/lenses/perspectives.md`, `orbit/lenses/critical-paths.md`), program architecture (`/orbit:architect`, `orbit architecture status` — the cross-change declaration tier, D-arc Stage D2), JSON run-summary emission, four execution disciplines (read-before-reference / change completeness / pushback / no-chaining)

#### Scenario: No augmentation / overlay language

- **WHEN** the Identity section is reviewed (manually or via grep)
- **THEN** the prose does not frame orbit as an additive layer on upstream — phrases like `augments cleanly`, `overlay on top of`, `layered on top of`, `extends upstream` are absent

### Requirement: Canonical-flow walkthrough section

Section 3 of the body SHALL present orbit's canonical workflow as a diagram followed by one paragraph per phase.

#### Scenario: Flow diagram

- **WHEN** the Canonical-flow section is read
- **THEN** a diagram (ASCII or equivalent markdown) shows the phases in order: explore → propose → review → address-reviews → apply → verify → review --as system → address-reviews → archive

#### Scenario: One paragraph per phase

- **WHEN** the Canonical-flow section is read
- **THEN** each phase has one paragraph describing its purpose, the primary `/orbit:*` command that drives it, and the typical output the user sees

#### Scenario: Lenses introduced contextually

- **WHEN** the Canonical-flow section is read
- **THEN** lenses (`perspectives.md` + `critical-paths.md`) are introduced in the explore-phase paragraph (where they are captured) and re-referenced in the review-phase paragraphs (where system-mode review consults them)

#### Scenario: External-review named, not demoed

- **WHEN** the review / address-reviews phase paragraphs are read
- **THEN** the external-review loop is named (`/orbit:review --reviewer external`) with a one-paragraph description and a pointer to the review skill's `references/external-handoff.md` for details; no bundled sample prompt and no simulated cross-AI exchange is rendered in the body
