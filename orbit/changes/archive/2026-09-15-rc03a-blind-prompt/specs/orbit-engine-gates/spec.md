## MODIFIED Requirements

### Requirement: Single-voiced canonical-next computation

The engine SHALL compute ONE canonical next command per change state — the full invocation with
all applicable arguments and flags (e.g. `/orbit:review --as system --reviewer external <change>`
— the merged reviewer-class form, D-arc Stage D5; the retired `/orbit:review-external` invocation
never renders on any recommendation surface, while archived records citing it remain untouched) —
derived from the gate graph and cadence position. When the next uncovered cadence slot is the
`independent` meta-class (satisfiable by a `fresh` OR an `external` pass), the engine's single
canonical command SHALL be the fresh-context review (`/orbit:review --as <mode> --fresh <change>`)
— the lighter proposal-phase default. An external pass also satisfies an `independent` slot for
class-coverage purposes, but the rendered recommendation stays single-voiced: the fresh-context
command only, never co-offered with the external alternative. When the next uncovered slot is `blind-pair`, the canonical command names the class missing from
the earliest pair STILL FORMABLE on this state.
When NEITHER member stands — the pair is empty — the canonical command SHALL name the EXTERNAL
half, never the fresh one. This ordering is a CORRECTNESS property, not a preference. The external
prompt is composed from the change's trail at the moment it is written, so a prompt written while
the trail holds no pair member has nothing of its partner to carry; a prompt written after the
fresh half has landed carries that half's findings through several independent channels, and the
blindness predicate — which observes walk records between two tokens — cannot see prompt content
and certifies the anchored pair as blind. Ordering does not suppress those channels; it EMPTIES
them, because the partner's findings do not yet exist. The converse order has no equivalent
exposure: the fresh half reads prior passes by the `review-<mode>-*.json` glob, which an external
findings file (`external-<as>-*.md`) cannot match. A standing pass counts as a candidate member only
while it is PAIRABLE — that is, while no `address-reviews-*.json` record referencing its findings
artifact carries a token AT OR AFTER its own. The bound is INCLUSIVE because the blindness interval
is: a record sharing a member's token already falls inside it, so an exclusive test would recommend
buying a partner for a pass that cannot form a valid pair. Once a pass has been walked it can never
pair with any later partner, so its class no longer counts as present. DIAGNOSIS USES THE SAME
PREDICATE AS ASSIGNMENT, so the reason and the canonical command can never name different classes,
and a pair excluded by the ordering constraints is reported as FORECLOSED rather than as blindness
broken by a walk that does not exist. One consequence is worth stating rather than leaving as dead
vocabulary: the pairability filter SUBSUMES most of the blindness diagnosis, because a record that
breaks blindness has already made the member it references unpairable, so that member leaves the
candidate set before the blindness test runs. `blindness-broken` therefore survives as a DEFENSIVE
branch — reachable only for a record referencing the later member with an earlier token, which an
ordinary trail cannot produce — and not as a diagnosis a user should expect to see. When a pairable fresh pass stands, the command
is the external invocation; when a pairable external pass stands, the fresh invocation; when NO
pairable independent pass stands, the command is the fresh invocation as the lighter first half AND
the gate's reason SHALL state that both members must run before EITHER is walked. Without the
pairability test the engine recommends a partner for a pass that can never pair, and every
recommended run satisfies no slot while counting against the budget.
Recommendation surfaces (gate
reasons, blocked-by-gate payloads, and the workflow handoffs that render them) SHALL present only
this canonical command: no advertised alternatives, no skip paths, and no bare command names
without arguments. Skills render the engine-computed command verbatim.

**Eligibility phrasing (D-arc Stage D1, D-elc-4)**: the canonical-next command SHALL be rendered under
an eligibility-framed label — `Ready when you are:` — never an imperative label (`Next:` and
equivalents are prohibited on every recommendation surface: `orbit status` output,
`instructions` payload rendering, and generated workflow bodies that quote the readout). When the
canonical-next command's phase entry is consent-marked (`consent: user-invoked` on the gate whose
`before:` is that phase), the rendered line SHALL append the marker ` — user-invoked`
(e.g. `Ready when you are: /orbit:apply <name> — user-invoked`). Rationale: words are the API
when the consumer is a model; an imperative label reads as an instruction to execute. Emit FIELD
names (`next_recommended`) are unchanged — display wording only.

**Model-hint garnish (D-arc Stage D5, D-d5-9)**: when `orbit/config.yaml` carries an OPTIONAL
`models:` map and the canonical-next command's phase or cadence slot has an entry, the rendered
eligibility line SHALL append ` — hint: <value>` (after any ` — user-invoked` marker). Valid
keys are the two vocabularies the engine already computes against: the active schema's phase
ids (for `spec-driven` v4: `review-proposal`, `apply`, `review-system`, plus any other declared
phase) and the cadence slot names (`in-context`, `fresh`, `independent`, `external`,
`blind-pair`). When both
the resolved command's phase AND its cadence slot carry entries, the SLOT entry wins (the more
specific hook); keys outside both vocabularies are inert (never an error — the map is garnish).
The VALUE is checked only at the rendering boundary: a renderable hint is a non-empty
single-line string of at most 80 characters containing no control characters — the
eligibility line is a model-facing protocol, and an embedded newline could forge additional
readout lines; a value failing the check is INERT exactly like an unknown key (the line
renders without the suffix, byte-identical to an absent entry, never an error). Beyond that
boundary check the hint is pure garnish: the content is not validated, nothing is enforced,
and an absent map (or absent
entry) yields byte-identical pre-capability output. The phase-mapping content itself is
user-owned config, never spec.

#### Scenario: One command, fully specified

- **WHEN** any recommendation surface renders the next step
- **THEN** it is a single complete invocation; phrasings like "run review-external next" (no
  arguments) or "or proceed directly to archive" (advertised skip) do not appear

#### Scenario: Eligibility label, never imperative

- **WHEN** `orbit status --change <name>` renders the canonical next command
- **THEN** the label is `Ready when you are:` (with ` — user-invoked` appended for
  consent-marked phase entries); no recommendation surface renders an imperative `Next:` label

#### Scenario: External slot renders the merged form

- **WHEN** the cadence's next uncovered slot is `external`
- **THEN** the canonical command renders as `/orbit:review --as <mode> --reviewer external <change>` — the retired standalone invocation appears on no surface

#### Scenario: Model hint appends when configured

- **WHEN** `orbit/config.yaml` maps the external slot to `"GPT-5 Codex"` and the canonical next command is the external review
- **THEN** the eligibility line ends ` — hint: GPT-5 Codex`; with no `models:` map the line is byte-identical to pre-capability output

#### Scenario: Malformed hint value is inert at the rendering boundary

- **WHEN** a `models:` entry's value contains an embedded newline (or control characters, or exceeds 80 characters)
- **THEN** the eligibility line renders WITHOUT the hint suffix — byte-identical to an absent entry; no error, no partial injection into the readout

#### Scenario: The blind pair's missing member is the canonical next

- **WHEN** a PAIRABLE external pass stands on the current state and the `blind-pair` slot has no
  fresh partner
- **THEN** the canonical next command is `/orbit:review --as <mode> --fresh <change>` and the gate
  reason says the pair is open, naming the missing class

#### Scenario: A walked pass is not a pairable member

- **WHEN** both a fresh and an external pass stand on the current state but each has been walked,
  so no pair can be formed with any later partner
- **THEN** the canonical next command is the fresh invocation and the reason states that BOTH
  members must run before either is walked — the engine never recommends a partner for an
  unpairable pass
