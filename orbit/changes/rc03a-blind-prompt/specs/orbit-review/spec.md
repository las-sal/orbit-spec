## ADDED Requirements

### Requirement: A blind-pair member receives no prior-findings context

The system SHALL withhold prior-findings context from any review pass that is a BLIND-PAIR MEMBER. A blind-pair member is a REVIEW in the genre sense — it reads the whole artifact and the thesis and receives no account of what earlier passes found — so the withholding is not scoped to the partner's findings but to prior-findings context from any source. For the internal reviewer classes this means the prior-run inspection that otherwise fuels the pushback discipline is SKIPPED; that inspection is the internal-class equivalent of the Cycle context section `orbit-review-external` withholds for the external class, and one rule governs both.

**Reading the genre.** The class is READ FROM THE ENGINE — `next_hint_keys.slot` from `orbit status --change <name> --json` — never inferred from flags or file inspection, so the gate that decides cadence also decides genre.

**The rule is a CONJUNCTION on a POSITIVE signal.** A pass is a blind-pair member when the slot is present AND equals `blind-pair` AND the invoked reviewer class is independent (`fresh` or `external`). Absence is never treated as a pair signal:

| `next_hint_keys.slot` | invoked class | prior-run read | why |
|---|---|---|---|
| `blind-pair` | `fresh` | **SKIPPED** | the pass can satisfy the slot |
| `blind-pair` | `in-context` | performed | an in-context pass can never satisfy a blind-pair slot, and is the verification genre that most needs prior context |
| any other value | any | performed | not a pair slot |
| ABSENT (findings stand unwalked / all gates passed / status failed / no reviewed gate) | any | performed | absence is not a signal; a sequential pass must not be blinded by a missing field |

**Architecture mode is carved out.** An architecture-mode review has no change, no reviewed gate, and no cadence — it resolves its target through `orbit architecture status` and is governed by the no-gate requirement — so no pair can exist and this requirement does not apply. Its prior-run read remains MANDATORY, because the architecture-mode iteration note is hand-computed from prior `review-architecture-*.json` emits whose `doc` matches the doc under review.

Pushback discipline itself is UNCHANGED and still applies: findings are verified against current state before being reported. What is withheld is the prior-run read, not the verification.

**The cost is DELIBERATE and larger than duplicate prose.** Both members may re-report findings resolved in earlier iterations. Most are caught by pushback-against-current-state and suppressed as stale by the walk — but a finding closed by a RATIFIED DECISION rather than an artifact edit leaves no current-state evidence for pushback to find, so a blinded member can re-report it as a live CRITICAL. The gate reads a pass's IMMUTABLE severity counts, not the walk's suppressions, so such a re-report fails the confirm predicate and buys a further independent pass against the gate's declared budget. This is ACCEPTED, not mitigated: independence is what makes the pair's overlap interpretable, and priming both members on a common prior frame inflates their overlap and deflates the residual estimate, making the instrument read safer than it is. A deflated residual estimate is a worse failure than a spent pass, because it is invisible.

#### Scenario: Fresh pass filling a blind-pair slot skips the prior-run read

- **WHEN** a review pass runs with `--reviewer fresh` (or `--fresh`) and `next_hint_keys.slot` is `blind-pair`
- **THEN** the pass does NOT read prior `review-<mode>-*.json` summaries for pushback fuel, and the emit records the pass normally with `reviewer_class: "fresh"` — the withheld read changes what the reviewer saw, never how the pass is recorded or how the gate counts it

#### Scenario: In-context pass during the pair window retains the read

- **WHEN** a review pass runs with the default `in-context` class while `next_hint_keys.slot` is `blind-pair`
- **THEN** the pass reads the most-recent matching prior summary as usual, because an in-context pass cannot satisfy a blind-pair slot and blinding it would withhold context from the verification genre

#### Scenario: Absent slot retains the read

- **WHEN** a review pass runs and `next_hint_keys.slot` is absent — a prior pass's findings stand unwalked, every gate has passed, the status call failed, or the change declares no reviewed gate
- **THEN** the pass reads the most-recent matching prior summary exactly as before

#### Scenario: Architecture mode is unaffected

- **WHEN** a review runs with `--as architecture` against a doc
- **THEN** the prior-run read over `review-architecture-*.json` emits matching the doc proceeds unchanged and remains mandatory for the hand-computed iteration note; this requirement does not apply, because architecture mode has no cadence and therefore no pair
