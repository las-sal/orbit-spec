## ADDED Requirements

### Requirement: The judgement record — one spine, two kinds

A CADENCE JUDGEMENT is a decision formed against INDEPENDENT REVIEW OUTPUT, and it SHALL be
recorded rather than left in narrative prose. The qualifying test is exactly that — *is the
judgement formed against independent review output?* — and it is not a tidiness rule: citing the
passes is the SAME property the write gate's ordering check consumes, so the criterion for
belonging and the constraint that makes the record trustworthy are ONE thing. A judgement citing no
pass has no ordering to check, which is why it does not belong here: method calls, scope calls and
process notes keep their existing homes.

A judgement record SHALL carry:

```
kind            enum          "continuation" | "readiness"
formed_against  string[]      NON-EMPTY list of independent pass <TS> tokens (fresh or external)
disposition     enum          kind-dependent; see below
reasoning       string        prose — why, in the author's own words (a RECORD under R-crc-10)
ratified_by     enum          "ai" | "user"
```

`ratified_by` is REQUIRED and is never inferred. The difference between the AI's own belief and a
user's ratification is a fact about the decision that context will not preserve, and a record that
leaves it implicit claims an authority it may not have.

`formed_against` cites BY TOKEN, never in prose. A prose citation — the shape `gate_overridden`
uses — cannot be ordered against anything, which is why no ordering check has ever been possible on
it.

**`kind: "continuation"`** is formed MID-CADENCE and answers *given what came back, what next?*
Its `disposition` is `proceed` (continue past a gate that has not passed, additionally carrying
`gate`, `gate_state` and `gate_reason`) or `spend` (buy a further independent pass past a gate that
HAS passed — a decision the cadence has no other home for).

**`kind: "readiness"`** is formed at the cadence's END. Its `disposition` is `ready` or `not-ready`,
and it additionally carries `accepted`: a list of `{claim, why}` pairs naming what was accepted
WITHOUT resolution and why that was acceptable. The accepted residuals are the assertion's CONTENT,
not peer records — *"I accepted the residual because the scoped pass came back sound"* is one
statement, and splitting it loses the because.

A `not-ready` record RECORDS; it SHALL NOT block. Readiness is a judgement, and an engine that
blocks on it acts on what it cannot observe (R-crc-10); the lifecycle already carries consent, gate
and audit prompts for stopping.

#### Scenario: A continuation record names the passes it was formed against

- **WHEN** a further independent pass is bought past a gate that has already passed
- **THEN** the emit carries `kind: "continuation"`, `disposition: "spend"`, a non-empty
  `formed_against` of pass tokens, prose `reasoning`, and `ratified_by`

#### Scenario: A readiness record carries its acceptances as content

- **WHEN** a cadence ends with residual risk the author judges acceptable
- **THEN** the record's `accepted` list names each `{claim, why}`, and they appear there rather
  than as separate judgement records

#### Scenario: An empty formed_against is refused

- **WHEN** a judgement record carries `formed_against: []`
- **THEN** the emit is refused — a judgement formed against no independent output is not a cadence
  judgement, and recording it here would defeat the test that defines the record

#### Scenario: ratified_by is never inferred

- **WHEN** a judgement record omits `ratified_by`
- **THEN** the emit is refused naming the field — the engine SHALL NOT guess whether a human
  ratified a decision

## MODIFIED Requirements

### Requirement: Workflow-kind emit shape (extends the universal spine)

Every workflow-command run-summary JSON (per `Requirement: Emit scope`) SHALL include the universal spine defined in the `orbit-conventions` capability's `Internal-run JSON summary format` requirement — 7 required top-level fields (D-arc Stage D5 adds `model`):

```
command          string       identifies which command emitted (matches filename prefix)
timestamp        string       ISO-8601 UTC; JSON field uses standard colon format `YYYY-MM-DDTHH:MM:SSZ`. Filename embeds a colon-replaced `<TS>` token `YYYY-MM-DDTHH-MM-SSZ` (colons aren't filesystem-safe across all platforms).
change           string|null  the change name (or null for project-scope and architecture-scoped commands)
final_assessment string       narrative of what just happened (human-readable)
next_recommended string       verbatim recommendation, suitable for best-effort parse by downstream status readers
kind             enum         "workflow" | "editorial" | "lifecycle"  (always "workflow" for commands in this capability's scope)
model            string|null  the emitting AI's model identity (provenance — D-arc Stage D5); null when unknown. REQUIRED in every post-capability payload (explicit null allowed); pre-capability emits lack the field and readers SHALL tolerate absence (both generations valid on the trail), per `orbit-conventions`.
```

For workflow-kind emits specifically, `kind` SHALL equal `"workflow"`. Per-command extensions (defined in subsequent requirements in this capability) add command-specific state beyond the spine.

**THE JUDGEMENT RECORD IS A PER-COMMAND EXTENSION, not a spine field (rc04a).** It appears ONLY on
the emits written at the moments a cadence judgement is actually taken, which are three:
`continuation` on the APPLY emit (where the proceed-past-a-gate decision is made) and on the
`review-external` T0 emit (where the spend decision is made, at exactly the moment it is taken);
`readiness` on the ARCHIVE emit. A cadence that ends by ROUTING TO ARCHITECTURE rather than
archiving carries its `readiness` record on the `address-reviews` emit that closed the final walk —
the emit being written at that moment. NO NEW TRAIL LOCATION is introduced: every one of these
emits already exists.

Filenames SHALL use the per-command prefix (preserving entry-point provenance): `<command>-<TS>.json`. Propose-family variants (`new`, `continue`, `ff`) each use their own command-name prefix, NOT `propose-<TS>.json`. ("Propose-family" here is the entry-point grouping for the per-variant-filename rule; "propose-shaped" is the recommendation-class term defined in `Requirement: Propose-shaped and artifact-completion-aware recommendation logic` and applies only to `/orbit:propose` + `/orbit:ff`.)

#### Scenario: explore emit includes all 7 spine fields
- **WHEN** the emit-layer writes `explore-<TS>.json` for a named-mode explore
- **THEN** the JSON contains `command`, `timestamp`, `change`, `final_assessment`, `next_recommended`, `kind`, and `model` fields with valid values (`model` nullable; absent only on pre-capability emits, which readers tolerate)

#### Scenario: apply emits with kind=workflow
- **WHEN** the emit-layer writes `apply-<TS>.json`
- **THEN** the `kind` field equals `"workflow"`

#### Scenario: /orbit:new uses its own filename prefix
- **WHEN** the user invokes `/orbit:new foo` and the emit-layer writes a JSON
- **THEN** the filename is `new-<TS>.json`, NOT `propose-<TS>.json`

#### Scenario: Downstream status reader parses next_recommended verbatim
- **WHEN** a downstream status reader reads any run-summary JSON and best-effort parses `next_recommended`
- **THEN** the leading `/orbit:<verb> [args]` token (if present) is extracted into `command` and `args`; on parse failure (e.g., prose recommendation), the full string is preserved in `reason`

#### Scenario: A judgement record on an emit that takes no judgement is refused

- **WHEN** a judgement record is supplied on an emit outside the three that take one (and outside
  the `address-reviews` routing case)
- **THEN** the emit is refused naming the command — the record marks where a decision was TAKEN, and
  allowing it anywhere would make its location meaningless
