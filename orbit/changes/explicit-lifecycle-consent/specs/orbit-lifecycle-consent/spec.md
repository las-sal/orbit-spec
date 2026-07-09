## ADDED Requirements

### Requirement: Invocation-provenance rule

Consent SHALL be determined by invocation provenance, an observable transcript fact — never by
the AI's judgment of delegated intent. **User-invoked** means the triggering turn contains an
explicit user invocation of the command: the typed slash command (the harness injects a literal
command invocation), or an unambiguous same-turn prose request naming the act ("archive it").
**AI-mediated** means everything else: delegation phrases ("finish the cadence"), inference
("continue"), handoff documents, or a gate reporting a phase eligible. Rationale (normative
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
- **Placement**: at command entry, before any other step (for archive: before the Step 3.4 gate
  prompt — consent asks "should we be here at all"; anomaly prompts ask "is the state sound").
- **Bulk-archive**: the consent prompt fires per change on AI-mediated arrival; a user-typed
  `/orbit:bulk-archive` invocation (whose flow already confirms the batch) is user-invoked for
  the confirmed set.
- **Sync inheritance**: `sync` invoked as a step inside a consented flow (e.g. archive Step 4)
  inherits that flow's consent and SHALL NOT prompt separately; a standalone AI-mediated
  `/orbit:sync` — a baseline writer — fires the consent prompt.
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

#### Scenario: Abort writes nothing

- **WHEN** the user chooses Abort at a consent prompt
- **THEN** no run summary is written (there is no third consent value)
