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
command only, never co-offered with the external alternative. Recommendation surfaces (gate
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
ids (for `spec-driven` v3: `review-proposal`, `apply`, `review-system`, plus any other declared
phase) and the cadence slot names (`in-context`, `fresh`, `independent`, `external`). When both
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

### Requirement: Tracked-gate pass condition

A `tracked` gate SHALL be: `blocked` while any `requires` entry is incomplete; `ready` when
runnable with unchecked boxes remaining in `tracks`; `passed` (today's `all_done`) when every
checkbox in `tracks` is checked. This is upstream apply's state machine, renamed into the gate
vocabulary — with ONE addition (D-arc Stage D5, the user-validation subset rule): when unchecked
boxes remain but EVERY one of them (a) is named in the engine-verified `user_validation_tasks`
declaration of the MOST RECENT apply emit CARRYING one (per `orbit-run-summary-emit` — the list
persists on the emit; the declaration is STICKY: a durable fact about the tasks, so a later
apply emit without the field leaves the standing declaration governing — retraction happens
where the task lives, via the tasks.md edit that checks the box or removes its marker) AND
(b) self-describes as a handoff (its checkbox line carries the `(User-validation`
marker), the gate SHALL compute `passed` FOR FLOW PURPOSES, carrying the pending task ids as an
annotation — the position readout renders `apply ✓ (awaiting user validation: <ids>)`, the
status row's reason names them, supersession and downstream `requires` treat the gate as passed,
and the canonical next command points forward. The condition is recomputed from disk on every
render (a pure function — no stored state): a new unchecked box outside the declared-and-marked
set breaks the subset and the gate honestly drops back to `ready`. A declaration alone never
suffices (the marker requirement makes mislabeling visible in the tasks.md diff review reads),
and the pending obligation is always surfaced, never hidden.

#### Scenario: Checkbox arithmetic decides

- **WHEN** the tracked file has N checked of M boxes and no user-validation subset condition holds
- **THEN** the gate is `passed` iff N == M, with `N/M` surfaced in the gate's status row

#### Scenario: Only declared user-validation handoffs remain

- **WHEN** tasks.md has one unchecked box `- [ ] 9.6 (User-validation handoff) ...`, and the latest apply emit declares `user_validation_tasks: ["9.6"]`
- **THEN** the apply gate computes `passed` with `userValidationPending: ["9.6"]`; the position renders `apply ✓ (awaiting user validation: 9.6)`; `review-proposal` becomes superseded and the canonical next command is the `review-system` gate's next step — never a backward pointer at a moot gate

#### Scenario: A new ordinary task breaks the subset

- **WHEN** the subset condition held, and a review walk adds `- [ ] 10.1 fix the regression` to tasks.md
- **THEN** the next render computes the apply gate back to `ready` (10.1 is neither declared nor marked) — self-healing, no state file involved

#### Scenario: Declaration without the self-describing marker is insufficient

- **WHEN** the latest apply emit declares `user_validation_tasks: ["9.6"]` but the 9.6 checkbox line lacks the `(User-validation` marker
- **THEN** the subset condition fails and plain arithmetic governs

#### Scenario: The declaration is sticky across later field-less emits

- **WHEN** the subset condition held via an apply emit declaring `user_validation_tasks: ["9.6"]`, and a LATER apply emit carries no `user_validation_tasks` field
- **THEN** the standing declaration still governs and the gate remains `passed (awaiting user validation: 9.6)` — a field omission never silently regresses the readout; retraction is the tasks.md edit
