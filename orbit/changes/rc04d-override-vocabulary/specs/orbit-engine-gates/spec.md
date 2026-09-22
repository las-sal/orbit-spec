## MODIFIED Requirements

### Requirement: Gate-aware status and instructions with position readout

`orbit status --change <name>` (the per-change form; bare `orbit status` is the orientation surface per `orbit-orientation` — D-arc Stage D3) SHALL render gate rows (state: `blocked | ready | passed | stale | unpassed`, with
reasons, plus the RECORDED SPEND on a reviewed gate) alongside artifact rows, and a one-line
POSITION READOUT of the canonical flow (e.g.
`propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate`).

**THE TWO GATE-ROW SURFACES DIFFER DELIBERATELY, and the split is normative.** The HUMAN row
renders `independentSpend` ALONE — never beside the declaration, never composed with it. The JSON
projection carries the optional `budget` declaration and `independentSpend` as SEPARATE named
fields, composing neither, and OMITS either key entirely when its value is absent rather than
emitting it undefined-valued: an in-process consumer testing key presence must not be told a gate
declares a budget it does not.

Each position-readout step token is a gate id or lifecycle-phase token (`propose`, `review(proposal)`,
`apply`, `review(system)`, `archive`); a gate step renders its computed state (`✓` passed, `STALE`,
`ready`, `blocked-by-gate`, `unpassed` — there is NO spend-derived token, because no
token may make a recorded cost read as a verdict (the retired forms were `unpassed BUDGET-SPENT`
and `STALE BUDGET-SPENT`), or `(past)` for a superseded gate). **Superseded gates**: a
`reviewed` gate whose `before` phase is already complete (e.g. `review-proposal` after `apply` has
passed) is no longer the active frontier — it gated ENTRY to a phase that has since run. Such a gate
is marked SUPERSEDED (distinct from `passed`: it may never have converged; the flow simply advanced
past it), renders as `(past)`, and is SKIPPED by the single-voiced canonical-next computation so the
recommendation advances to the next actionable gate rather than re-surfacing a moot earlier one.
Step order follows the gate graph's `requires`/`before` edges; ties broken by declaration order in
the schema YAML (v1 relies on declaration order matching flow order, as the shipped `spec-driven`
schema does). `orbit instructions` for a phase whose gate is unpassed SHALL return a `blocked-by-gate`
state carrying the gate id, the human-readable reason, and the canonical next command. JSON outputs
carry the same fields for downstream readers.

#### Scenario: Status shows the position readout

- **WHEN** `orbit status --change <name>` runs on a gated schema
- **THEN** the output includes the position readout and per-gate rows with reasons

#### Scenario: An undeclared budget is absent as a KEY, not merely as a JSON value

- **WHEN** a gate declaring no `budget` is projected to the gate-status row
- **THEN** the row carries NO `budget` key at all — `Object.hasOwn(row, 'budget')` is false, so an
  in-process consumer testing key presence is never told a gate declares what it does not; JSON
  hiding an undefined value is not sufficient

#### Scenario: Spend never renders a position token

- **WHEN** an unpassed reviewed gate's independent spend has reached or exceeded its declared budget
- **THEN** its gate row carries `state: "unpassed"` with `independentSpend` reporting the figure,
  its reason names only the clause that failed, and its position token reads `unpassed` — no
  spend-derived token exists, because a recorded cost must never read as a verdict

#### Scenario: Instructions surface blocked-by-gate

- **WHEN** `orbit instructions apply --change <name> --json` runs while `review-proposal` is
  unpassed AND no task has been checked yet (apply has not started)
- **THEN** the JSON includes `state: "blocked-by-gate"`, the gate id, the reason, and
  `next_command` (the canonical full invocation)

#### Scenario: blocked-by-gate is entry-gated, not a mid-apply re-block

- **WHEN** `orbit instructions apply` runs while `review-proposal` is unpassed/stale BUT one or more
  tasks are already checked (implementation is underway)
- **THEN** the state is `ready` (not `blocked-by-gate`): the gate gates ENTRY to apply and is checked
  only before the first task is completed. Post-apply the `review-proposal` pass goes stale relative
  to the `apply-*.json` emit (expected + moot per the v1 freshness scope) and the gate has already
  served its purpose, so mid-apply continuation is never re-blocked. Apply-parity holds throughout:
  even at entry the gate NEVER hard-blocks — the consuming skill prompts (address / proceed-anyway /
  abort) and records the override on proceed-anyway.

### Requirement: Inflection-prompt override contract

The consuming workflow SHALL fire an inflection prompt when a user invokes a command whose phase
is gated by an unpassed or stale gate, offering exactly: address the gate (halt; canonical next
command), proceed anyway, or abort. Proceeding SHALL be recorded in the command's run summary,
carrying the gate, its state, and its reason AT DECISION TIME. The record's SHAPE is owned by
`orbit-run-summary-emit` and named there, not here — this requirement states THAT the override is
recorded and WHAT it must carry, never the field it is carried in. Gates NEVER hard-block — apply-parity enforcement:
the engine reports, the skill prompts, the user decides, the trail records.

#### Scenario: Override recorded, not prevented

- **WHEN** the user proceeds past an unpassed `review-system` gate at archive
- **THEN** the archive completes and its run summary records the override with the gate's state
  and reason at decision time

#### Scenario: The prompt is the only skip surface

- **WHEN** a gate is unpassed
- **THEN** no recommendation text offers proceeding past it; the option exists only inside the
  inflection prompt fired by the actual invocation

### Requirement: Review budget reported beside the gate state

A `reviewed` gate SHALL accept an optional `budget` — a positive integer declaring what the gate's
cadence is EXPECTED to cost in independent review passes. **The declaration is documentation for
the schema author; NOTHING CONSULTS IT.** The engine SHALL NOT compare it against actual spend,
SHALL NOT derive an exhaustion signal from it, and SHALL NOT let it colour any gate state, reason
string, position token or recommendation. A reader who finds `budget: 3` and concludes that it
constrains something has been misled, and this sentence exists to prevent that.

**NO SURFACE RENDERS SPEND AGAINST THE DECLARATION.** The prohibition above enumerates the four
COMPUTED outputs, and a rendered gate row is none of them — so it is stated separately here, because
the readout that motivated this change was exactly that: a terminal row reading `[spend 4/3]`. A
ratio is a verdict wearing a figure's clothes. The rule is about COMPOSITION, never about
co-presence, and it splits by surface. On every RENDERED surface — the live gate row and the
superseded gate row — `independentSpend` appears ALONE: never as a fraction of `budget`, never
beside a label derived from comparing the two. The JSON projection carries `budget` and
`independentSpend` as SEPARATE named fields and composes neither; the declaration is a real part of
the schema and stays readable there. What may not exist on any surface is the two of them divided.

The reason is R-crc-11(h): effort is RECORDED, never TARGETED. A cost target distorts the behaviour
it measures — a cadence stops early to hit a number — while a cost record is how the tool gets
better. `budgetExhausted` was target-shaped by construction: it said "you have spent too much",
which is the one thing a cost record must not say. It is RETIRED, together with the
`independentSpendFresh` trigger count that existed only to fire it and the `BUDGET-SPENT` position
tokens that rendered it.

What survives is the RECORD. The engine SHALL count independent passes (`reviewer_class` `fresh` or
`external`) on the gate's mode across the WHOLE trail, STALE PASSES INCLUDED (spend is spend; a
pass invalidated by a later apply was still paid for), and SHALL report TWO NAMED FIELDS on the
gate's status: `budget` (the declaration, when present) and `independentSpend` (what the cadence
actually cost). The names are normative: a new field on the gate status reaches
`orbit status --change --json` and the terminal gate row only when BOTH field-by-field projections
carry it.

**Spend counts REJECTED returns too.** An external findings file that fails the trail reader's
shape validation — which uses the ONE SHARED CommonMark fence tracker (a fence closes only on a run
of the same character at least as long as the opener with whitespace after, so a three-backtick line
inside a four-backtick fence is body), requires the format's canonical metadata, and requires every
counted finding to carry the full `### Title` / `**File**:` / `**Description**:` triple the
`--from-file` ingestion contract requires — is not a pass, and does not satisfy coverage. It DOES
count toward the recorded spend, because the attempt was paid for whether or not it returned a
usable artifact. The trail reader SHALL surface rejected external artifacts separately from
cadence-eligible passes, and the gate's reason SHALL NAME them (`1 external return rejected as
malformed — <filename>`). Naming a rejected artifact is not reporting the spend: it names the
rule that fired — a return arrived and could not be read — which is exactly what the reason slot
is for, and it survives the rule that the reason NEVER carries the spend figure.

**Mode attribution survives the demotion.** A rejected artifact is ATTRIBUTED to the mode in its
filename (`external-(proposal|system)-<TS>.md`, recoverable before the shape check runs) and counts
only toward the gate operating on that mode; a reviewed gate whose mode cannot be derived from its
id reports NO SPEND at all rather than counting passes of every mode — but it STILL REPORTS ITS
`budget` when one is declared. The declaration and the record are gated SEPARATELY and always have
independent fates: `budget` is schema text, and deriving a mode has nothing to do with whether an
expectation was declared. Coupling them would be the mirror of the defect this requirement removes
— a figure that appears only when an unrelated field happens to be present. The rule is unchanged from
the exhaustion era except in what it guards: it now keeps a recorded cost attributed to the cadence
that paid it, rather than keeping a trigger from firing on the wrong passes.

Two scenarios were REMOVED with the signal, six REWRITTEN and one ADDED; every other scenario is
preserved byte-identically. The change record names each and why (`rc02c-confirmation-semantics`'s
`design.md`, "Scenario accounting").

#### Scenario: An open pair outranks the walk recommendation

- **WHEN** one member of an uncovered `blind-pair` slot stands carrying a substantive finding and
  its partner has not run
- **THEN** the canonical next command names the MISSING MEMBER's class, not the walk, and the reason
  carries both the pass awaiting resolution and the open pair with the walk deferred

#### Scenario: A partial resolution record certifies only what it names

- **WHEN** a pass carried two WARNINGs and the latest referencing record names one of them resolved
- **THEN** the pass is UNRESOLVED — completeness is checked before disposition, so a record cannot
  certify a finding it omits

#### Scenario: A present but uninterpretable `outcome` does not revive `status`

- **WHEN** an entry carries `outcome: null` alongside `status: "resolved"`
- **THEN** the record is UNREADABLE and falls back to the bare counts — the legacy key is consulted
  only when the `outcome` property is ABSENT

#### Scenario: Nothing pairable standing lets the walk run first

- **WHEN** a pass carrying a substantive finding has gone stale and no pairable independent pass
  stands on the current state
- **THEN** the canonical next command is the walk — there is no pair to foreclose, so deferring the
  resolution would buy nothing

#### Scenario: A blocked reviewed gate reports the spend already on its trail

- **WHEN** a reviewed gate is blocked by an unmet `requires` while two independent passes stand
- **THEN** its row carries the real `independentSpend` — blocking is not an exemption from
  counting

#### Scenario: A finding missing the ingestion triple is not a pass

- **WHEN** an external findings file carries a `### Title` with no `**File**:` or `**Description**:`
- **THEN** shape validation rejects the file — a pass the gate counts must be a pass the walk can
  ingest

#### Scenario: A fenced example is not a review

- **WHEN** an external findings file's only severity headings sit inside a fenced code block, or the
  file omits the format's `**Reviewer**:` field
- **THEN** shape validation rejects it: it satisfies no cadence slot and is recorded as a rejected
  return that still counts as spend

#### Scenario: A rejected external return still costs

- **WHEN** an external findings file fails shape validation and one valid independent pass exists
- **THEN** the spend is two, the rejected artifact is named in the reason, and it satisfies no
  cadence slot

#### Scenario: A stale gate reports its spend

- **WHEN** a previously-converged gate goes stale after an apply, with a recorded spend at or
  above its declared `budget`
- **THEN** the state stays `stale` and the position token reads `STALE` — the spend appears only
  as `independentSpend`, and no token is derived from it

#### Scenario: Stale passes count in the recorded spend

- **WHEN** a gate's trail carries independent passes invalidated by a later apply
- **THEN** they are counted in `independentSpend` — spend is spend — and there is no second count,
  because no trigger remains for one to feed

#### Scenario: A mode-underivable gate keeps its declaration and reports no spend

- **WHEN** a reviewed gate declares `budget: 3` but its id yields no derivable mode
- **THEN** it reports the `budget` declaration and NO `independentSpend` — the declaration is
  schema text and does not depend on mode, while the spend does, and the two are gated separately

#### Scenario: No budget declared

- **WHEN** a reviewed gate declares no `budget`
- **THEN** `independentSpend` is still reported and the gate behaves identically to one that
  declares a budget — the declaration changes nothing the engine computes

#### Scenario: The closed-set consumers are untouched

- **WHEN** an unpassed gate whose recorded spend exceeds its declared `budget` is read by the
  WAITING derivation, the inflection prompt, and the override record
- **THEN** each sees `state: "unpassed"` and behaves exactly as for any unpassed gate — no
  consumer enumerates a new state, and the spend reaches them only as `independentSpend`, never
  inside `reason`
