# orbit-lifecycle-consent Specification

## Purpose

The consent model for lifecycle transitions (D-arc Stage D1): the USER is the arbiter of
every lifecycle transition — gate `passed` means *eligible*, never *commanded*. Consent is
determined by invocation provenance (an observable transcript fact), enforced as prompts in
the consent-scoped workflow bodies (apply / archive / bulk-archive per change; sync inherits
its containing flow's consent), surfaced by the engine (which never prompts), recorded as a
flat `consent` field on lifecycle emits, and audited by the drift tripwire under the
three-tier consent-era rule. The enforcement ceiling is deliberately the body-prompt layer;
harness-hook enforcement is deferred with the tripwire's firing as the named re-entry
trigger (arc ruling R-d-2).

## Requirements

### Requirement: Invocation-provenance rule

Consent SHALL be determined by invocation provenance, an observable transcript fact — never by
the AI's judgment of delegated intent. **User-invoked** means the triggering turn contains an
explicit user invocation of the command: the typed slash command (the harness injects a literal
command invocation), or an unambiguous same-turn prose request naming the act ("archive it").
**AI-mediated** means everything else: delegation phrases ("finish the cadence"), inference
("continue"), handoff documents, or a gate reporting a phase eligible. **When provenance is
uncertain, the AI SHALL treat the arrival as AI-mediated** — erring toward one extra click,
never toward a silent proceed. Rationale (normative
context): the motivating incident was the AI *misreading delegated authority* as consent — any
"prompt only when unsure" rule routes through the same judgment that failed, while provenance is
in the transcript.

#### Scenario: Typed command is consent

- **WHEN** the user types `/orbit:apply <name>` or `/orbit:archive <name>` (or requests the act
  unambiguously in the same turn)
- **THEN** the invocation is user-invoked; no consent prompt fires (only anomaly prompts — gate,
  fingerprint, audit — may interrupt)

#### Scenario: Delegated arrival is AI-mediated

- **WHEN** a consent-scoped command is reached because a handoff document, blanket delegation, or
  an eligibility readout pointed at it — with no explicit same-turn user invocation
- **THEN** the arrival is AI-mediated and the consent prompt fires before any of the command's
  writes

### Requirement: Consent prompts at consent-marked seams

Workflow bodies SHALL fire a consent AskUserQuestion on AI-mediated arrival at consent-marked
commands — those whose schema gate carries `consent: user-invoked` (per `orbit-engine-gates`'
gate declaration; in `spec-driven`: the `→ apply` and `→ archive` seams) — BEFORE any of the
command's writes:

- **Content**: the position readout, what the command will write (apply: begin implementing N
  tasks from the artifacts; archive: sync N deltas across M capabilities to baseline + move the
  change to archive), and exactly two options — **Proceed** / **Abort**.
- **Placement**: provenance is CLASSIFIED at command entry (it is a fact about the triggering
  turn, known before anything runs); the prompt itself — and the consent-era stamp — fire AFTER
  read-only discovery (change selection; the status/spec reads that supply the prompt's content)
  and BEFORE any of the command's writes or anomaly prompts (for archive: before the Step 3.4
  gate prompt — consent asks "should we be here at all"; anomaly prompts ask "is the state
  sound"). Read-only steps never require consent; writes always follow it.
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
  prompts after.

#### Scenario: AI-mediated archive entry prompts before any write

- **WHEN** the archive workflow is reached AI-mediated and the user chooses Abort at the consent
  prompt
- **THEN** no baseline write, no sync, no move, and no run summary occur

#### Scenario: User-typed entry runs prompt-free

- **WHEN** the user types `/orbit:archive <name>` and all gates/fingerprints/audit are clean
- **THEN** the archive runs with zero prompts beyond upstream's own confirmations

#### Scenario: Sync inside archive does not double-prompt

- **WHEN** a consented archive flow invokes the sync-specs step
- **THEN** no additional consent prompt fires for the sync

### Requirement: The engine never prompts for consent

Consent prompting SHALL live exclusively in workflow bodies. The engine (CLI commands, gate
computation, readouts) reports eligibility and surfaces the consent marker but SHALL NOT add
interactive consent confirmation to CLI-direct invocations — a human typing `orbit archive` IS
the consent. Engine changes for this capability are declaration parsing and display wording only.

#### Scenario: CLI-direct archive unchanged

- **WHEN** a user runs `orbit archive <name>` directly in a terminal
- **THEN** no consent prompt is added by the engine; upstream confirmations and the C2
  fingerprint guard behave exactly as before

### Requirement: Consent recorded in consent-scoped lifecycle emits

Run-summary emits for consent-scoped commands (apply, archive) SHALL carry one flat field:
`consent: "user-invoked" | "prompted"` — `user-invoked` when the invocation was user-typed
(provenance rule), `prompted` when the consent prompt fired and the user chose Proceed. Exactly
two values: an abort at the consent prompt writes NO summary (existing convention), so a summary
that exists has exactly two consent stories. The field is self-reported by the emitting session
(honest-actor legibility, not enforcement — the enforcement layer is the prompt itself); its
ABSENCE on post-capability emits is the audit-drift tripwire condition (per `orbit-audit-drift`).
Emits predating this capability lack the field and are exempt.

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
- **THEN** no run summary is written (there is no third consent value)

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
  (version 3)
- **THEN** the change's `.openspec.yaml` records `schema_version: 3` alongside `schema` and
  `created`

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
