# orbit-lifecycle-consent Specification

## Purpose

The consent model for lifecycle transitions (D-arc Stage D1): the USER is the arbiter of
every lifecycle transition — gate `passed` means *eligible*, never *commanded*. Consent is
determined by invocation provenance (an observable transcript fact) or by a grant in the project's
`chain` setting (the user's own configuration, read from the engine), enforced as prompts in
the consent-scoped workflow bodies (apply / archive / bulk-archive per change; sync inherits
its containing flow's consent), surfaced by the engine (which never prompts, and checks a `setting`
value at the emit write gate), recorded as a flat `consent` field on lifecycle emits (`user-invoked`,
`prompted` or `setting`), and audited by the drift tripwire under the three-tier consent-era rule. The enforcement ceiling is deliberately the body-prompt layer;
harness-hook enforcement is deferred with the tripwire's firing as the named re-entry
trigger (arc ruling R-d-2).
## Requirements
### Requirement: Invocation-provenance rule

Consent SHALL be determined by invocation provenance, an observable transcript fact — never by
the AI's judgment of delegated intent. **User-invoked** means the triggering turn contains an
explicit user invocation of the command: the typed slash command (the harness injects a literal
command invocation), or an unambiguous same-turn prose request naming the act ("archive it").
**AI-mediated** means everything else: delegation phrases ("finish the cadence"), inference
("continue"), handoff documents, a chain, or a gate reporting a phase eligible. **When provenance is
uncertain, the AI SHALL treat the arrival as AI-mediated** — erring toward one extra click,
never toward a silent proceed. An AI-mediated arrival is **granted** exactly when the change status's
`chain` object, read at the command's entry, names that command as `next` with `may_run: true` (per
`orbit-engine-gates`' `The change status says whether the next command may run unasked`): the user's own
`chain` setting is then the consent, and the arrival fires no consent prompt (`Consent prompts at
consent-marked seams`). Whether an arrival is granted is read from the engine, never judged from how the
command was reached: a chain's arrival and an arrival by "continue" are granted alike when the object allows
the command, and prompted alike when it does not. Rationale (normative
context): the motivating incident was the AI *misreading delegated authority* as consent — any
"prompt only when unsure" rule routes through the same judgment that failed, while provenance is
in the transcript and a grant is in the project's configuration.

#### Scenario: Typed command is consent

- **WHEN** the user types `/orbit:apply <name>` or `/orbit:archive <name>` (or requests the act
  unambiguously in the same turn)
- **THEN** the invocation is user-invoked; no consent prompt fires (only anomaly prompts — gate,
  fingerprint, audit — may interrupt)

#### Scenario: Delegated arrival is AI-mediated

- **WHEN** a consent-scoped command is reached because a handoff document, blanket delegation, or
  an eligibility readout pointed at it — with no explicit same-turn user invocation — and the change
  status's `chain` object does not report `may_run: true` for it
- **THEN** the arrival is AI-mediated and the consent prompt fires before any of the command's
  writes

#### Scenario: A granted arrival is read from the engine

- **WHEN** the user says "continue" after a review whose walk left `/orbit:apply <name> — user-invoked`
  as the next command, and `orbit/config.yaml` carries `chain: {apply: true}` with no stop open
- **THEN** the arrival is AI-mediated and granted: the `chain` object reports `may_run: true` for that
  command, so no consent prompt fires

### Requirement: Consent prompts at consent-marked seams

Workflow bodies SHALL fire a consent AskUserQuestion on AI-mediated arrival at consent-marked
commands — those whose schema gate carries `consent: user-invoked` (per `orbit-engine-gates`'
gate declaration; in `spec-driven`: the `→ apply` and `→ archive` seams) — BEFORE any of the
command's writes, unless the arrival is granted (`Invocation-provenance rule`). Each arrival is
handled by exactly one row of this table, by who typed it and what the change status's `chain`
object reports at entry:

| arrival | handled as |
|---|---|
| typed by the user, whatever the `chain` setting grants | `user-invoked`, no consent prompt |
| not typed; `chain.next` is this command and `may_run` is true | granted: `setting`, no consent prompt |
| not typed; `chain.next` is this command and `why: not-granted` (the key absent or false, or no `chain` map) | the consent prompt fires: `prompted` on Proceed, no summary on Abort |
| not typed; `chain.next` is this command and `why: open-stop` | the consent prompt fires; the stop's question was put by the closing step that stopped the chain |
| not typed; `chain.next` names another command (whatever its `why`), or `why: none` | the consent prompt fires, then the gate inflection as without the setting |
| not typed; `chain.next` is this command and `why: needs-user` | cannot hold here: that row is tested for the `review-external` key only |
| not typed; `chain.next` is this command and `why: no-progress` | cannot hold at entry: that row is tested only on a status call carrying `--chain-ran` |
| the later chunks of one chunked apply | the entry's value, constant across the invocation's emits, except an emit after a withdrawn grant (the named limit in `Consent recorded in consent-scoped lifecycle emits`) |
| the sync inside archive | inherits archive's value and never prompts |
| `/orbit:bulk-archive` | never granted: the engine never names it as a next command; it prompts per change as below |

The arrivals are who typed the command (the user, or not) crossed with the `chain` object's outcomes
(`may_run`, or one of its five reasons), plus the three members this capability's Purpose adds: the
chunks, the inherited sync and bulk-archive. The consent prompt carries:

- **Content**: the position readout, what the command will write (apply: begin implementing N
  tasks from the artifacts; archive: sync N deltas across M capabilities to baseline + move the
  change to archive), and exactly two options — **Proceed** / **Abort**.
- **Placement**: provenance is CLASSIFIED at command entry (it is a fact about the triggering
  turn, known before anything runs); the prompt itself — and the consent-era stamp — fire AFTER
  read-only discovery (change selection; the status/spec reads that supply the prompt's content, the
  `chain` object among them)
  and BEFORE any of the command's writes or anomaly prompts (for archive: before the Step 3.4
  gate prompt — consent asks "should we be here at all"; anomaly prompts ask "is the state
  sound"). Read-only steps never require consent; writes always follow it. A granted arrival
  stamps the consent era at the same point.
- **Bulk-archive**: the consent prompt fires per change on AI-mediated arrival; a user-typed
  `/orbit:bulk-archive` invocation (whose flow already confirms the batch) is user-invoked for
  the confirmed set.
- **Sync inheritance**: `sync` invoked as a step inside a consented flow (e.g. archive Step 4)
  inherits that flow's consent and SHALL NOT prompt separately. Standalone `/orbit:sync` is NOT
  consent-scoped in this change — it has no consent-marked gate, no run-summary emit, and no
  prompt; AI-mediated invocation of it is already barred by the no-chaining contract
  (`orbit-conventions`). Promoting sync to a consent-scoped command (own emit + prompt + audit
  scope) is explicitly DEFERRED — the consent-scoped set stays exactly the schema-declared
  consent gates.
- **Distinctness**: the consent prompt is DISTINCT from the anomaly prompts (gate inflection,
  fingerprint divergence, audit drift); a single invocation MAY fire consent first and anomaly
  prompts after. A granted arrival skips only the consent prompt: every anomaly prompt fires as on a
  typed arrival, as `orbit-conventions`' `A chain treats each prompt by its kind` lists it.

#### Scenario: AI-mediated archive entry prompts before any write

- **WHEN** the archive workflow is reached AI-mediated, the arrival is not granted, and the user
  chooses Abort at the consent prompt
- **THEN** no baseline write, no sync, no move, and no run summary occur

#### Scenario: User-typed entry runs prompt-free

- **WHEN** the user types `/orbit:archive <name>` and all gates/fingerprints/audit are clean
- **THEN** the archive runs with zero prompts beyond upstream's own confirmations

#### Scenario: Sync inside archive does not double-prompt

- **WHEN** a consented archive flow invokes the sync-specs step
- **THEN** no additional consent prompt fires for the sync

#### Scenario: A granted archive runs without the consent prompt

- **WHEN** a walk ends with `/orbit:archive <name> — user-invoked` as the next command and the
  `chain` object reports `may_run: true` for it, granted by `chain.archive`
- **THEN** the archive fires no consent prompt and records `consent: "setting"`, and its anomaly
  prompts fire as on a typed arrival

#### Scenario: An ungranted chained arrival still prompts

- **WHEN** apply is reached AI-mediated and the `chain` object reports `may_run: false` with
  `why: "not-granted"`
- **THEN** the consent prompt fires as without the setting, and Proceed records `consent: "prompted"`

### Requirement: The engine never prompts for consent

Consent prompting SHALL live exclusively in workflow bodies. The engine (CLI commands, gate
computation, readouts) reports eligibility and surfaces the consent marker but SHALL NOT add
interactive consent confirmation to CLI-direct invocations — a human typing `orbit archive` IS
the consent. Engine changes for this capability are declaration parsing, display wording, and the write gate's check
of the `consent` value (`Consent recorded in consent-scoped lifecycle emits`); the engine never adds an interactive
prompt.

#### Scenario: CLI-direct archive unchanged

- **WHEN** a user runs `orbit archive <name>` directly in a terminal
- **THEN** no consent prompt is added by the engine; upstream confirmations and the C2
  fingerprint guard behave exactly as before

### Requirement: Consent recorded in consent-scoped lifecycle emits

Run-summary emits for consent-scoped commands (apply, archive) SHALL carry one flat field whose
value is exactly one of three strings — `user-invoked`, `prompted` and `setting` — with no field
naming the key that granted it (the key and the command are one-to-one). Each value has one
meaning and one check:

| `consent` value | meaning | at the write gate |
|---|---|---|
| `user-invoked` | the invocation was user-typed (`Invocation-provenance rule`) | accepted; self-reported |
| `prompted` | the consent prompt fired and the user chose Proceed | accepted; self-reported |
| `setting`, and the project's `chain` map grants the emit's command (`apply` for an apply emit, `archive` for an archive emit) | the arrival was granted | accepted |
| `setting`, and that key is absent or not `true`, or there is no `chain` map | — | refused, naming the key |
| any other string, or a value that is not a string | — | refused, naming the three values |
| the field absent | — | not refused: the gate does not require it, and its absence on a post-capability emit is the audit-drift tripwire condition (per `orbit-audit-drift`) |
| `consent` in any other command's payload | — | refused as an unknown payload key |

The values are SOURCED: the payload tables list `consent` for apply and archive only, and a value
is one of these three or it is not. The gate reads the same resolver of the `chain` map that the
change status's `chain` object reads (`orbit-engine-gates`' `The chain setting grants each command
on its own key`), so a grant the entry read and a grant the gate checks have one definition; the
gate does not test for an open stop, since a stop written during the command must not refuse that
command's own summary. An abort at the consent prompt writes NO summary (existing convention), so
a summary that exists records one of the three values, or none after a withdrawn grant (the named limit
below). `user-invoked` and `prompted` are
self-reported by the emitting session (honest-actor legibility, not enforcement — the enforcement
layer is the prompt itself); `setting` is checked, because a grant is a file the gate can read.
Named limit: a grant withdrawn between a command's entry and its emit refuses a true record. On that
refusal the session writes the emit again with no `consent` field, and its `final_assessment` names the
withdrawn key; it asks the user nothing, since the command's writes have already happened. The emits
the invocation wrote before the withdrawal stand. The absent field is the audit-drift tripwire's
condition (per `orbit-audit-drift`), so the transition is flagged rather than recorded under a consent
nobody gave. Emits predating this capability lack the field and are exempt.

#### Scenario: User-typed apply records user-invoked

- **WHEN** the user types `/orbit:apply <name>` and the apply emit is written
- **THEN** the emit includes `consent: "user-invoked"`

#### Scenario: Prompted proceed records prompted

- **WHEN** a consent prompt fired on AI-mediated arrival and the user chose Proceed
- **THEN** the command's emit includes `consent: "prompted"`

#### Scenario: User-typed bulk propagates to inner archive emits

- **WHEN** the user types `/orbit:bulk-archive` and confirms the batch, and the inner archives
  emit their summaries
- **THEN** each inner archive emit records `consent: "user-invoked"` (the confirmed batch is the
  user's invocation for the set)

#### Scenario: Abort writes nothing

- **WHEN** the user chooses Abort at a consent prompt
- **THEN** no run summary is written (an abort has no consent value)

#### Scenario: A granted emit is accepted

- **WHEN** `orbit/config.yaml` carries `chain: {archive: true}` and `orbit emit archive` receives a
  payload with `consent: "setting"`
- **THEN** the gate accepts the value and writes the emit

#### Scenario: An ungranted setting is refused naming the key

- **WHEN** `orbit/config.yaml` carries `chain: {review: true}` and `orbit emit apply` receives a
  payload with `consent: "setting"`
- **THEN** the emit is refused, no file is written, and the error names the `apply` key

#### Scenario: A withdrawn grant writes the emit without consent

- **WHEN** a granted apply's first chunk emit carries `consent: "setting"`, the user then removes `apply`
  from the `chain` map, and the second chunk's emit is refused naming the `apply` key
- **THEN** the session writes the second emit with no `consent` field and a `final_assessment` naming the
  withdrawn `apply` key, asks the user nothing, and leaves the first emit as written

#### Scenario: A value outside the three is refused

- **WHEN** `orbit emit apply` receives a payload with `consent: "granted"`
- **THEN** the emit is refused, no file is written, and the error names `user-invoked`, `prompted`
  and `setting`

### Requirement: Consent-era metadata marker

The change metadata schema SHALL gain an optional `schema_version` field (integer; persisted in
`.openspec.yaml`), written by `orbit new change` from the loaded schema's declared `version` at
scaffold time. **Absence of BOTH era markers is the consent-era signal**: a change whose metadata
lacks `schema_version` AND lacks `consent_era_from` (every untouched pre-D1 change and archive —
neither field existed) is pre-consent era and exempt from the audit tripwire; a change recording
`schema_version >= 3` is consent-era for ALL its lifecycle emits, and a no-`schema_version`
change stamped `consent_era_from` (the straddler transition below) is consent-era from the stamp
onward. No timestamp cutoff and no backfill are needed for changes that never straddle the
boundary. Both fields round-trip through the metadata read/write helpers without loss.

**Straddler transition (migrate-on-touch)**: a change scaffolded BEFORE this capability that runs
a consent-scoped command AFTER it must not stay exempt forever. The consent-scoped workflow
bodies (apply, archive, bulk-archive per change) SHALL, at entry against a change whose metadata
lacks `schema_version`, stamp `consent_era_from: <current TS>` into `.openspec.yaml` (same write
step that later records the consent field). Tripwire semantics become three-tier and per-change:
`schema_version >= 3` (born post-capability) → ALL its apply/archive emits are checked;
`consent_era_from` present (straddler) → only emits with TS at-or-after the stamp are checked
(its genuinely pre-capability emits stay exempt); NEITHER field → fully pre-capability, exempt.
The invariant this buys by construction: any change a post-capability body has touched is
tripwire-covered from that touch onward — including the archive emit of the change that
introduces this capability (itself a straddler).

#### Scenario: New change records the schema version

- **WHEN** `orbit new change` scaffolds a change under the shipped `spec-driven` schema
- **THEN** the change's `.openspec.yaml` records that schema's CURRENT version as
  `schema_version` alongside `schema` and `created` — the scaffolder writes the loaded schema's
  version, so the marker tracks schema revisions without this scenario restating a number

#### Scenario: Straddler is covered from first post-capability touch

- **WHEN** a change scaffolded before this capability (no `schema_version`) runs a
  consent-scoped command after the new bodies ship — e.g. the introducing change itself archiving
- **THEN** the body stamps `consent_era_from` at entry; that run's emit (and every later one)
  carries `consent` and is tripwire-checked, while the change's pre-stamp emits remain exempt

#### Scenario: Pre-D1 archives are exempt by absence

- **WHEN** the audit tripwire evaluates an archived change whose `.openspec.yaml` records only
  `schema: spec-driven` with neither `schema_version` nor `consent_era_from` (e.g. the C1/C2
  archives)
- **THEN** the change is pre-consent era; its emits are exempt and never flagged

