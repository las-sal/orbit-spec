## ADDED Requirements

### Requirement: Consent field on the apply emit

The apply emit (`apply-<TS>.json`) SHALL carry the flat `consent: "user-invoked" | "prompted"`
field per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` when the apply was
user-typed, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded.
The field applies to every post-capability apply emit (all three emit rules: chunk completion,
mid-chunk pause, no-chunking session end — the consent story is a property of the apply
invocation, identical across its chunks' emits). Emits predating the consent capability lack the
field and are exempt from the audit-drift tripwire (per `orbit-audit-drift`). Downstream parsers
SHALL ignore the field if unknown (forward-compat, matching `recommendation_options` precedent).
The archive emit's consent field is specified in `orbit-archive-modifications`' `Archive run
summary written` requirement.

#### Scenario: Apply emit carries consent

- **WHEN** a user-typed `/orbit:apply` session writes its chunk-end emit
- **THEN** the emit includes `consent: "user-invoked"` alongside the existing spine and
  per-command extensions (`gate_overridden` unchanged and independent)

#### Scenario: Consent constant across one apply's chunk emits

- **WHEN** a single apply invocation emits at multiple chunk boundaries
- **THEN** every emit of that invocation carries the same consent value (provenance is a property
  of the invocation, not the chunk)
