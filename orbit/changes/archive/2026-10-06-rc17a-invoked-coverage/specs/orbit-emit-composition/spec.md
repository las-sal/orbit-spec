## ADDED Requirements

### Requirement: The review-external payload carries `pair`

The `review-external` command's payload table SHALL admit an OPTIONAL `pair` field, a boolean. A T0
written with `pair: true` is a blind pair's LAUNCH, whose meaning is owned by `orbit-engine-gates`' `A
pair's membership is computed from its launch`. The write gate refuses a present `pair` that is not a
boolean, naming the field, and refuses `pair: true` unless the payload carries an explicit `mode` of
`proposal` or `system` — a launch the trail cannot attribute to a mode would be no launch at all, and
the T0's own default mode is not written into the record. The field is pass-through narrative
otherwise: the T0's `next_recommended`, `awaiting_findings` and every other composed fact are unchanged
by it, and `pair: false` or an absent `pair` writes the ordinary T0.

#### Scenario: A pair launch is accepted and carried

- **WHEN** `orbit emit review-external --change foo` receives a payload with `mode: "system"`,
  `prompt_path`, and `pair: true`
- **THEN** the T0 is written carrying `pair: true`, with the same `next_recommended` and
  `awaiting_findings: true` it would carry without the field

#### Scenario: A malformed pair is refused

- **WHEN** the payload's `pair` is `"yes"`, `1`, or `null`
- **THEN** the surface exits non-zero naming `pair`, and no file is written

#### Scenario: A pair launch without a mode is refused

- **WHEN** the payload carries `pair: true` and no `mode`, or a `mode` other than `proposal` or `system`
- **THEN** the surface exits non-zero naming `mode`, and no file is written
