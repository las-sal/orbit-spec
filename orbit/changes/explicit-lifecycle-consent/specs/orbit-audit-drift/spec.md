## ADDED Requirements

### Requirement: Missing consent-record check in archive coherence

The Category 4 (archive coherence) scan SHALL check consent-scoped lifecycle emits (apply,
archive) for the `consent` field required by `orbit-lifecycle-consent`: a post-capability emit
missing the field is a WARNING finding ("lifecycle emit lacks consent record — an unconsented or
contract-violating transition may have occurred"). This is the empirical tripwire behind the
D-arc's harness-hooks deferral (R-d-2): its firing is the named re-entry trigger for hard
enforcement. Pre-capability emits are EXEMPT. **Era boundary mechanism**: the check applies only to emits
of changes whose `.openspec.yaml` records `schema_version >= 3` (per `orbit-lifecycle-consent`'s
`Consent-era metadata marker` requirement — the field is written at scaffold from the loaded
schema's version); a change whose metadata LACKS `schema_version` is pre-consent era and exempt.
Absence-as-signal is deterministic and needs no backfill or timestamp cutoff — resolving the
schema NAME to the current built-in definition would misclassify old archives as v3, so the
marker, not resolution, is the authority.

#### Scenario: Post-capability emit without consent flagged

- **WHEN** the audit scans an `apply-*.json` or `archive-*.json` belonging to a change whose
  metadata records `schema_version >= 3`, and the emit lacks the `consent` field
- **THEN** a WARNING finding names the emit path and the missing field

#### Scenario: Pre-capability emits exempt

- **WHEN** the audit scans lifecycle emits of changes whose metadata lacks `schema_version`
  (e.g. the C1/C2 archives, scaffolded before the field existed)
- **THEN** no finding is raised for the absent field
