## MODIFIED Requirements

### Requirement: Named-mode explore recommendation by maturity

Named-mode `/orbit:explore` emits SHALL include `next_recommended` text that adapts to the count of decisions captured, the count of open questions remaining, and — for the Mature state only — whether every RULE in Decisions carries a closed enumeration of its domain (per `orbit-conventions`). Four mutually-exclusive maturity states cover the full grid:

- **Early (0–1 decisions captured)**: `"/orbit:explore <name> — continue capturing thinking"`
- **Mid (2–3 decisions captured)**: `"/orbit:explore <name> — continue thinking, or /orbit:propose <name> if ready to formalize"`
- **Mature (4+ decisions captured AND ≤1 open question AND every rule's domain closed)**: `"/orbit:propose <name> — substantial thinking captured; ready to formalize the design (or /orbit:explore <name> to keep refining)"`
- **Stalled (4+ decisions captured AND >1 open question)**: `"/orbit:explore <name> — N decisions captured but M open questions remain; resolve open questions before formalizing"` (N = `decisions_captured`, M = `open_questions_count`). NOTE: this state does NOT surface `/orbit:propose` as an alternative because high open-question count signals NOT-ready regardless of decision count; the user is directed back to exploration to close out the open questions first.

**The Mature state is the only rung that ASSERTS readiness, and it SHALL NOT do so on counts alone.** When the decision and open-question thresholds are met but one or more rules lack a closed enumeration, the emit renders the MID rung's deferring language plus the named gap — the rules whose domains are open — rather than the Mature assertion. The floor and middle rungs are unchanged because they already defer; only the top rung asserts, and confidence must not RISE with heading count on no additional evidence about substance.

In each case the leading `/orbit:<verb> <name>` token is the canonical recommendation that a downstream status reader parses into `command`/`args`; the alternative path (when present, Mid and Mature only) lives in the reason text.

#### Scenario: 1-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 1` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains "continue capturing thinking"

#### Scenario: 5-decision explore with 0 open questions and every rule closed recommends propose
- **WHEN** named-mode explore emits with `decisions_captured: 5`, `open_questions_count: 0`, and every rule in Decisions carrying a closed enumeration
- **THEN** `next_recommended` begins with `"/orbit:propose <name>"` and surfaces `/orbit:explore` as alternative in reason

#### Scenario: Thresholds met but a rule's domain is open

- **WHEN** named-mode explore emits with `decisions_captured: 5` and `open_questions_count: 0`, and one or more rules in Decisions lack a closed enumeration of their domain
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"`, renders the Mid rung's deferring language, and NAMES the rules whose domains are open — the Mature assertion is withheld

#### Scenario: 0-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 0`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains language acknowledging that thinking is just beginning (e.g., "continue capturing thinking — no decisions captured yet")

#### Scenario: Stalled — 5 decisions captured but 3 open questions remain (Mature criteria for decisions met but open-question check fails)
- **WHEN** named-mode explore emits with `decisions_captured: 5` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` (NOT `/orbit:propose`); the text references both counts (e.g., "5 decisions captured but 3 open questions remain; resolve open questions before formalizing"); `/orbit:propose` is NOT surfaced as an alternative
