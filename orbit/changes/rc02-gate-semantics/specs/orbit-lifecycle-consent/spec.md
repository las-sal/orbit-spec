## MODIFIED Requirements

### Requirement: Consent-era metadata marker

The change metadata schema SHALL gain an optional `schema_version` field (integer; persisted in
`.openspec.yaml`), written by `orbit new change` from the loaded schema's declared `version` at
scaffold time. **Absence of BOTH era markers is the consent-era signal**: a change whose metadata
lacks `schema_version` AND lacks `consent_era_from` (every untouched pre-D1 change and archive —
neither field existed) is pre-consent era and exempt from the audit tripwire; a change recording
`schema_version >= 3` is consent-era for ALL its lifecycle emits, and a no-`schema_version`
change stamped `consent_era_from` (the straddler transition below) is consent-era from the stamp
onward. No timestamp cutoff and no backfill are needed for changes that never straddle the
boundary. Both fields round-trip through the metadata read/write helpers without loss.

**Straddler transition (migrate-on-touch)**: a change scaffolded BEFORE this capability that runs
a consent-scoped command AFTER it must not stay exempt forever. The consent-scoped workflow
bodies (apply, archive, bulk-archive per change) SHALL, at entry against a change whose metadata
lacks `schema_version`, stamp `consent_era_from: <current TS>` into `.openspec.yaml` (same write
step that later records the consent field). Tripwire semantics become three-tier and per-change:
`schema_version >= 3` (born post-capability) → ALL its apply/archive emits are checked;
`consent_era_from` present (straddler) → only emits with TS at-or-after the stamp are checked
(its genuinely pre-capability emits stay exempt); NEITHER field → fully pre-capability, exempt.
The invariant this buys by construction: any change a post-capability body has touched is
tripwire-covered from that touch onward — including the archive emit of the change that
introduces this capability (itself a straddler).

#### Scenario: New change records the schema version

- **WHEN** `orbit new change` scaffolds a change under the shipped `spec-driven` schema
- **THEN** the change's `.openspec.yaml` records that schema's CURRENT version as
  `schema_version` alongside `schema` and `created` — the scaffolder writes the loaded schema's
  version, so the marker tracks schema revisions without this scenario restating a number

#### Scenario: Straddler is covered from first post-capability touch

- **WHEN** a change scaffolded before this capability (no `schema_version`) runs a
  consent-scoped command after the new bodies ship — e.g. the introducing change itself archiving
- **THEN** the body stamps `consent_era_from` at entry; that run's emit (and every later one)
  carries `consent` and is tripwire-checked, while the change's pre-stamp emits remain exempt

#### Scenario: Pre-D1 archives are exempt by absence

- **WHEN** the audit tripwire evaluates an archived change whose `.openspec.yaml` records only
  `schema: spec-driven` with neither `schema_version` nor `consent_era_from` (e.g. the C1/C2
  archives)
- **THEN** the change is pre-consent era; its emits are exempt and never flagged
