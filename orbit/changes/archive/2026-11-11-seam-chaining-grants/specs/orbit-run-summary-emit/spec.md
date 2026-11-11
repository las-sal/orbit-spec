## MODIFIED Requirements

### Requirement: Consent field on the apply emit

The apply emit (`apply-<TS>.json`) SHALL carry the flat `consent` field, one of `user-invoked`, `prompted` and
`setting`, per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` when the apply was
user-typed, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded, `setting` when the
arrival was granted by the `apply` key of the project's `chain` map (the write gate refuses `setting` when that key
does not grant it).
The field applies to every post-capability apply emit (all three emit rules: chunk completion,
mid-chunk pause, no-chunking session end — the consent story is a property of the apply
invocation, identical across its chunks' emits, except an emit written after a withdrawn grant, which carries no
field per `orbit-lifecycle-consent`'s named limit). Emits predating the consent capability lack the
field and are exempt from the audit-drift tripwire (per `orbit-audit-drift`). Downstream parsers
SHALL ignore the field if unknown (forward-compat, matching `recommendation_options` precedent).
The archive emit's consent field is specified in `orbit-archive-modifications`' `Archive run
summary written` requirement.

#### Scenario: Apply emit carries consent

- **WHEN** a user-typed `/orbit:apply` session writes its chunk-end emit
- **THEN** the emit includes `consent: "user-invoked"` alongside the existing spine and
  per-command extensions (the `judgements` record unchanged and independent)

#### Scenario: Consent constant across one apply's chunk emits

- **WHEN** a single apply invocation emits at multiple chunk boundaries
- **THEN** every emit of that invocation carries the same consent value (provenance is a property
  of the invocation, not the chunk), except an emit written after a withdrawn grant, which carries no `consent`
  field (`orbit-lifecycle-consent`'s named limit)

#### Scenario: A granted apply records setting

- **WHEN** apply runs because the change status's `chain` object allowed it, granted by `chain.apply`, and writes its
  chunk-end emit
- **THEN** the emit includes `consent: "setting"`, and every later emit of that invocation carries the same value
  while the `apply` key still grants it; an emit after the grant is withdrawn carries no `consent` field
