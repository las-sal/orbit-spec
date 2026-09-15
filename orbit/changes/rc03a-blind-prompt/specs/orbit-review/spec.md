## ADDED Requirements

### Requirement: A blind-pair member receives no prior-findings context

The system SHALL withhold prior-findings context from any review pass filling a `blind-pair` cadence slot, in EVERY reviewer class. A blind-pair member is a REVIEW in the genre sense — it reads the whole artifact and the thesis and receives no account of what earlier passes found — so the rule is not scoped to the partner's findings specifically but to prior-findings context from any source. Concretely, the prior-run inspection that otherwise fuels the pushback discipline is SKIPPED for such a pass, which is the internal-class equivalent of the Cycle context section `orbit-review-external` withholds for the external class; the two are the same context wearing different names and are governed by one rule. The genre is READ FROM THE ENGINE — `next_hint_keys.slot` from `orbit status --change <name> --json` — never inferred from flags or file inspection, so the gate that decides cadence also decides genre and a body-side heuristic can never disagree with it. When the slot cannot be determined, the pass FAILS CLOSED and skips the inspection.

Pushback discipline itself is UNCHANGED and still applies: findings are verified against current state before being reported. What is withheld is the prior-run read, not the verification.

This is a DELIBERATE COST, accepted for a stated reason: both members may re-report findings resolved in earlier iterations, which the walk then suppresses as stale. Independence is what makes the pair's overlap interpretable — capture-recapture assumes independent observers, and priming both members on a common prior frame inflates their overlap and deflates the residual estimate, making the instrument read safer than it is.

#### Scenario: Fresh pass filling a blind-pair slot skips the prior-run read

- **WHEN** a review pass runs with `--reviewer fresh` (or `--fresh`) and `next_hint_keys.slot` is `blind-pair`
- **THEN** the pass does NOT read prior `review-<mode>-*.json` summaries for pushback fuel, and the emit records the pass normally with `reviewer_class: "fresh"` — the withheld read changes what the reviewer saw, never how the pass is recorded or how the gate counts it

#### Scenario: Non-pair pass retains the prior-run read

- **WHEN** a review pass runs and `next_hint_keys.slot` is any value other than `blind-pair` — `in-context`, `fresh`, `external`, or `independent`
- **THEN** the pass reads the most-recent matching prior summary exactly as before, because a confirming or sequential pass is doing a different job and needs to know what came before

#### Scenario: Slot undeterminable fails closed

- **WHEN** a review pass cannot read `next_hint_keys.slot` — the status call fails, the change declares no reviewed gate, or the field is absent
- **THEN** the pass skips the prior-run read, and the report states that prior-run context was withheld because the slot could not be determined
