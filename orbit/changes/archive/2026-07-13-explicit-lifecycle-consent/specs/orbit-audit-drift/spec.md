## ADDED Requirements

### Requirement: Missing consent-record check in archive coherence

The Category 4 (archive coherence) scan SHALL check consent-scoped lifecycle emits (apply,
archive) for the `consent` field required by `orbit-lifecycle-consent`: a post-capability emit
missing the field is a WARNING finding ("lifecycle emit lacks consent record — an unconsented or
contract-violating transition may have occurred"). This is the empirical tripwire behind the
D-arc's harness-hooks deferral (R-d-2): its firing is the named re-entry trigger for hard
enforcement. Pre-capability emits are EXEMPT. **Era boundary mechanism (three-tier, per change — per
`orbit-lifecycle-consent`'s `Consent-era metadata marker` requirement)**: `schema_version >= 3`
in the change's `.openspec.yaml` → ALL its apply/archive emits are checked; `consent_era_from`
present (a straddler stamped at first post-capability touch) → only emits with TS at-or-after
the stamp are checked; NEITHER field → fully pre-capability, exempt. The metadata markers, not
schema-name resolution and not any timestamp constant, are the authority — resolving the schema
NAME to the current built-in definition would misclassify old archives as v3.

#### Scenario: Post-capability emit without consent flagged

- **WHEN** the audit scans an `apply-*.json` or `archive-*.json` that the three-tier rule marks
  as checked (change has `schema_version >= 3`, OR has `consent_era_from` and the emit's TS is
  at-or-after it), and the emit lacks the `consent` field
- **THEN** a WARNING finding names the emit path and the missing field

#### Scenario: Pre-capability emits exempt

- **WHEN** the audit scans lifecycle emits of changes whose metadata lacks both `schema_version`
  and `consent_era_from` (e.g. the C1/C2 archives, scaffolded before the fields existed and
  never touched by a consent-scoped body)
- **THEN** no finding is raised for the absent field

#### Scenario: Straddler checked from its stamp onward

- **WHEN** the audit scans a change whose metadata lacks `schema_version` but records
  `consent_era_from` (a straddler stamped at first post-capability touch), and an `apply-*.json`
  or `archive-*.json` whose filename `<TS>` token is at-or-after the stamp lacks the `consent`
  field
- **THEN** the WARNING finding is raised for that emit, while the change's pre-stamp emits raise
  nothing
