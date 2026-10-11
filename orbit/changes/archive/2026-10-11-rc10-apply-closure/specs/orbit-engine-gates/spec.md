## MODIFIED Requirements

### Requirement: Inflection-prompt override contract

The consuming workflow SHALL fire an inflection prompt when a user invokes a command whose phase
is gated by an unpassed or stale gate, offering exactly: address the gate (halt; canonical next
command), proceed anyway, or abort. Proceeding SHALL be recorded in the command's run summary,
carrying the gate, its state, and its reason AT DECISION TIME. This requirement states THAT the
override is recorded and WHICH FACTS ABOUT THE GATE it must carry; the FIELD those facts are
carried in, and its shape, belong to the emit layer and are not named here.
Gates NEVER hard-block — apply-parity enforcement:
the engine reports, the skill prompts, the user decides, the trail records.

**AT ARCHIVE, THE GATE SET IS EVERY REVIEWED GATE.** Archive is the last seam: a gate whose
`before` names a phase that never ran has no later prompt to speak at. The archive workflow's gate
prompt SHALL read every `reviewed` gate the schema declares, whatever its `before`, and list in ONE
prompt each that is not `passed` and whose `superseded` field is not true — an `unpassed` or
`stale` gate with its reason, a `blocked` gate with the reason naming what blocks it. A superseded
gate (its `before` names a gate that has passed) is NOT listed: it gated a phase that has run, and
that phase's seam owned the decision. Named limit: a phase entered without its workflow — tasks
checked by hand, so the `apply` gate passes with no apply-seam prompt — leaves the earlier gate
superseded with no recorded decision, and archive does not ask again. A second named limit:
`/orbit:bulk-archive` fires no gate prompt, so a change archived in a batch past a gate this rule
would list records no decision; the prompt this rule binds is the single-change archive's. A `tracked` gate is NOT listed: its unchecked work is the archive's task check.
The recorded `independentSpend` MAY be shown beside a listed gate and SHALL NOT decide whether the
prompt fires or which gates it lists — effort is recorded, never targeted. Proceeding records one
entry per listed gate. When no gate is listed, the prompt does not fire.

#### Scenario: Override recorded, not prevented

- **WHEN** the user proceeds past an unpassed `review-system` gate at archive
- **THEN** the archive completes and its run summary records the override with the gate's state
  and reason at decision time

#### Scenario: The prompt is the only skip surface

- **WHEN** a gate is unpassed
- **THEN** no recommendation text offers proceeding past it; the option exists only inside the
  inflection prompt fired by the actual invocation

#### Scenario: An unapplied change's proposal gate speaks at archive

- **WHEN** archive is invoked on a change whose `review-proposal` gate is `unpassed`, whose `apply`
  gate is `ready`, and whose `review-system` gate is `blocked` by `apply`
- **THEN** ONE gate prompt lists `review-proposal` with its reason and `review-system` with the
  reason naming `apply`; `apply` is not listed; proceeding records two entries, one per listed gate

#### Scenario: A superseded gate stays silent at archive

- **WHEN** archive is invoked on a change whose `review-proposal` gate is `unpassed` and superseded
  because `apply` passed, and whose `review-system` gate is `passed`
- **THEN** no gate prompt fires

#### Scenario: Spend is shown, never decisive

- **WHEN** a listed gate carries `independentSpend` equal to or above its declared `budget`
- **THEN** the prompt MAY show the figure; the gate is listed because of its state, and a gate
  whose state is `passed` is never listed whatever its spend
