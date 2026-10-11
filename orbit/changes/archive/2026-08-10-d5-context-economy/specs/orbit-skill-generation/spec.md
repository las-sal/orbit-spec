## ADDED Requirements

### Requirement: Retired surface artifacts converge on update

Update reconciliation SHALL consult an explicit retired-artifacts registry (skill directory
names + launcher command ids whose workflow id no longer exists — as of D5:
`orbit-review-external` / `review-external`, the standalone external-review surface merged into
review's `--reviewer` axis) and remove those artifacts from pre-existing surfaces on both
update paths — retirement is a first-class transition, never an unknown directory left behind
(the deselection sweep cannot see it: it iterates known workflow ids only). The presence of a
retired skill directory or launcher SHALL count as profile drift, so plain update's smart
detection reconciles it without `--force`. Fresh installs are unaffected (the retired artifacts
are never generated); the registry grows on any future retirement.

#### Scenario: Plain update removes retired artifacts from a pre-existing surface

- **WHEN** a surface generated before the D5 merge carries `.claude/skills/orbit-review-external/`
  and `.claude/commands/orbit/review-external.md`, and a plain `orbit update` runs
- **THEN** drift detection defeats the current-stamps short-circuit, and reconciliation removes
  both the retired skill directory and the retired launcher

#### Scenario: Fresh surfaces never see the retired set

- **WHEN** `orbit init` generates a fresh surface at the current version
- **THEN** no retired artifact exists to remove and the retired-artifacts pass is a no-op
