## MODIFIED Requirements

### Requirement: Named-mode explore recommendation by maturity

Named-mode `/orbit:explore` emits SHALL include `next_recommended` text that adapts to the count of decisions captured, the count of open questions remaining, and — for the Mature state only — whether every RULE in Decisions carries a closed enumeration of its domain (per `orbit-conventions`). FIVE mutually-exclusive maturity states cover the full grid (the closure dimension adds a cell):

- **Early (0–1 decisions captured)**: `"/orbit:explore <name> — continue capturing thinking"`
- **Mid (2–3 decisions captured)**: `"/orbit:explore <name> — continue thinking, or /orbit:propose <name> if ready to formalize"`
- **Mature (4+ decisions captured AND ≤1 open question AND every rule's domain closed)**: `"/orbit:propose <name> — substantial thinking captured; ready to formalize the design (or /orbit:explore <name> to keep refining)"`
- **Open-domain (4+ decisions captured AND <=1 open question AND one or more rules' domains OPEN)**: `"/orbit:explore <name> — N decisions captured but M rule(s) have open domains: <ids>; close them before formalizing"`. The propose alternative is NOT surfaced, on the same reasoning Stalled uses: an unclosed rule domain is a not-ready signal regardless of decision count. Rendering is bounded to ONE line, naming at most three decision IDs plus `+N more`; rules are identified by DECISION ID, never by prose.
- **Stalled (4+ decisions captured AND >1 open question)**: `"/orbit:explore <name> — N decisions captured but M open questions remain; resolve open questions before formalizing"` (N = `decisions_captured`, M = `open_questions_count`). NOTE: this state does NOT surface `/orbit:propose` as an alternative because high open-question count signals NOT-ready regardless of decision count; the user is directed back to exploration to close out the open questions first.

**PRECEDENCE**: when both >1 open question AND open rule domains hold, Stalled wins and its text additionally names the open-rule count, so the gap is never silently unreported.

**The Mature state is the only rung that ASSERTS readiness, and it SHALL NOT do so on counts alone.**

**WHAT `every RULE in Decisions` RANGES OVER** — the domain, stated rather than defaulted: a rule counts toward the closure check only while it is LIVE. A rule annotated SUPERSEDED, or explicitly assigned to another stage, is OUT of the domain; a Decisions section is append-only and keeps both, so a blanket reading would make Mature unreachable for any exploration that ever superseded or handed away a rule. An exploration with NO Mechanism section at all has no live rules and therefore no open domains — it is not withheld, and this is the pre-capability case.

**THE INPUT** is engine-computed and named: the explore emit carries `rules_open` (an array of decision IDs whose domains are unclosed) and `rules_total` (the count of live rules), both derived by the emit surface from the Mechanism section's declared closure forms — NOT supplied by the caller, because a caller-supplied field would be the self-classification this program's rule test exists to remove. What the engine judges is FORM: whether each live rule has an enumeration naming a closure form. It does not judge whether the enumeration is TRUE, and no requirement here claims it does. The floor and middle rungs are unchanged because they already defer; only the top rung asserts, and confidence must not RISE with heading count on no additional evidence about substance.

In each case the leading `/orbit:<verb> <name>` token is the canonical recommendation that a downstream status reader parses into `command`/`args`; the alternative path (when present, Mid and Mature only) lives in the reason text.

#### Scenario: 1-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 1` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains "continue capturing thinking"

#### Scenario: 5-decision explore with 0 open questions and every rule closed recommends propose
- **WHEN** named-mode explore emits with `decisions_captured: 5`, `open_questions_count: 0`, and every rule in Decisions carrying a closed enumeration
- **THEN** `next_recommended` begins with `"/orbit:propose <name>"` and surfaces `/orbit:explore` as alternative in reason

#### Scenario: Thresholds met but a rule's domain is open

- **WHEN** named-mode explore emits with `decisions_captured: 5` and `open_questions_count: 0`, and one or more rules in Decisions lack a closed enumeration of their domain
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"`, renders the Open-domain state's text, NAMES the rules whose domains are open by decision ID (at most three plus `+N more`, one line), and does NOT surface `/orbit:propose` as an alternative — the Mature assertion is withheld

#### Scenario: 0-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 0`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains language acknowledging that thinking is just beginning (e.g., "continue capturing thinking — no decisions captured yet")

#### Scenario: Stalled — 5 decisions captured but 3 open questions remain (Mature criteria for decisions met but open-question check fails)
- **WHEN** named-mode explore emits with `decisions_captured: 5` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` (NOT `/orbit:propose`); the text references both counts (e.g., "5 decisions captured but 3 open questions remain; resolve open questions before formalizing"); `/orbit:propose` is NOT surfaced as an alternative
