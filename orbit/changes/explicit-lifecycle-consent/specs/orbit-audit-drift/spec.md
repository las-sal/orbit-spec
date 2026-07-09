## ADDED Requirements

### Requirement: Missing consent-record check in archive coherence

The Category 4 (archive coherence) scan SHALL check consent-scoped lifecycle emits (apply,
archive) for the `consent` field required by `orbit-lifecycle-consent`: a post-capability emit
missing the field is a WARNING finding ("lifecycle emit lacks consent record — an unconsented or
contract-violating transition may have occurred"). This is the empirical tripwire behind the
D-arc's harness-hooks deferral (R-d-2): its firing is the named re-entry trigger for hard
enforcement. Pre-capability emits are EXEMPT — the era boundary mechanism (timestamp cutoff vs a
schema-version marker) is a design.md decision of the consent change; the check SHALL NOT flag
emits older than that boundary.

#### Scenario: Post-capability emit without consent flagged

- **WHEN** the audit scans an `apply-*.json` or `archive-*.json` newer than the consent-era
  boundary that lacks the `consent` field
- **THEN** a WARNING finding names the emit path and the missing field

#### Scenario: Pre-capability emits exempt

- **WHEN** the audit scans lifecycle emits older than the consent-era boundary (e.g. the C1/C2
  archives)
- **THEN** no finding is raised for the absent field
