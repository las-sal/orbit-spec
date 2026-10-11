## ADDED Requirements

### Requirement: User-validation closure at the archive seam

The archive workflow SHALL dispose of every unchecked task carrying the `(User-validation` marker in
the change's `tasks.md` — the marker `orbit-engine-gates`' `Tracked-gate pass condition` reads —
at a Step 3.2 that runs BEFORE the Step 5 move, each as exactly one of two dispositions, which
partition the marked tasks by whether the box ends checked:

- **OBSERVED** — the validation has happened. The AI checks the box and appends to the task line
  a one-line note naming the evidence.
- **DEFERRED** — the validation was not observed at this seam: it can happen only after the change
  ships (a merge, a later stage, a later session), or it could have happened and has not. The box
  stays unchecked, and the archive emit carries a `deferred_validations` entry
  `{task, why, when, where}`: `task` the task id; `why`, `when` and `where` non-empty prose naming
  why it was not observed here, the moment it will be, and the place.

Before the move, the seam SHALL BRIEF the user in chat with each task, its disposition and, for a
deferral, its `why`. The brief is a report, not a prompt: halting stays the user's, by aborting
(R-crc-13). Upstream Step 3's incomplete-tasks count SHALL exclude every task this step owns — a
named edit to an upstream portion, per `orbit-conventions`' `Generated-file disposition` — and
every other unchecked task still prompts there unchanged.

`orbit emit archive` SHALL read the archived `tasks.md` with the reader the apply emit's
`user_validation_tasks` check uses, and REFUSE, naming the task or line: an emit that leaves an
unchecked marked task with no deferral; a marked unchecked task with no task id, which no deferral
can key; a marked unchecked line the reader places in no `## ` task group, which the reader cannot
see; a deferral naming a checked task, an unchecked task without the marker, or no task; a second
deferral for one task; a deferral whose `why`, `when` or `where` is missing, not a string, or
empty; and a deferral key other than those four. A missing `tasks.md` is an empty marked set, so a
deferral against it names no task. An empty `deferred_validations` array is accepted and written
as absent. The engine checks the id set, never whether the prose is true (R-crc-10). The completion
readout SHALL print one line per deferral.

Step 3.2 SHALL run the same checks against the composed deferrals BEFORE the move, so a predictable
refusal surfaces while the change is still active: an id-less or ungrouped marked task is reported
to the user, who gives it an id or a group before the archive proceeds, or aborts. When the emit
still refuses after the move, the archive SHALL repair the payload and re-run `orbit emit archive`
against the archived directory, never repeating the sync or the move.

The bulk-archive workflow SHALL run Step 3.2 per change, before that change's sync and move, and
brief each change's dispositions in its batch summary; each inner archive emit is checked by the
same write gate.

A task whose assertion is about the baseline after sync is DEFERRED at this step: the task check
precedes the sync.

**Named limit.** This capability provides no reader of a deferral after the archive. For a change
citing an architecture stage, a deferred validation is usually one of the stage's exit criteria,
which the user grades at ratification; for an uncited change, the brief, the emit and the readout
are its only surfaces.

#### Scenario: An observed validation is closed with its evidence

- **WHEN** archive reaches the seam and task 5.3 carries `(User-validation` and its validation was
  observed during the change's own cycle
- **THEN** the AI checks 5.3 with a one-line evidence note before the move, the brief names it
  OBSERVED, and the emit carries no deferral for it

#### Scenario: A validation possible only after shipping is deferred and printed

- **WHEN** task 6.3 carries `(User-validation` and can be observed only after the change merges
- **THEN** 6.3 stays unchecked, the emit carries `{task: "6.3", why, when, where}` with all three
  prose fields non-empty, and the completion readout prints one line for it

#### Scenario: An available but unperformed validation is deferred with its reason

- **WHEN** task 5.3 carries `(User-validation`, could have been run before archive, and was not
- **THEN** 5.3 is DEFERRED with a `why` saying it was not run, and the brief shows that reason to
  the user before the move

#### Scenario: An undeferred validation is refused at the write gate

- **WHEN** the archived `tasks.md` holds an unchecked `(User-validation` task 4.4 and the archive
  payload carries no deferral naming `4.4`
- **THEN** `orbit emit archive` refuses, naming `4.4`, and writes nothing

#### Scenario: A deferral must name an unchecked marked task

- **WHEN** a deferral names a task that is checked, an unchecked task without the
  `(User-validation` marker, or no task in the file
- **THEN** `orbit emit archive` refuses, naming the deferral's task

#### Scenario: A marked line outside every task group is refused before the move

- **WHEN** `tasks.md` opens with `# Tasks` and an unchecked `- [ ] 4.4 (User-validation) …` line
  before any `## ` group heading
- **THEN** Step 3.2 reports the line before the move, and `orbit emit archive` refuses it, naming
  the line

#### Scenario: Step 3 no longer asks about validation tasks

- **WHEN** the only unchecked tasks at archive carry the `(User-validation` marker
- **THEN** upstream Step 3's incomplete-tasks prompt does not fire, and Step 3.2 briefs each task
  instead

#### Scenario: Bulk archive disposes per change

- **WHEN** `/orbit:bulk-archive` archives a batch in which one change carries an unchecked
  `(User-validation` task
- **THEN** that change's Step 3.2 runs before its sync and move, its dispositions appear in the
  batch summary, and its archive emit carries its deferrals

## MODIFIED Requirements

### Requirement: Archive run summary written

The system SHALL write a JSON summary to `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/.orbit-runs/archive-<TS>.json` after a successful archive (the `<YYYY-MM-DD>-` prefix is added by upstream's archive move step).

**THE TERMINAL READINESS RECORD (rc04a).** The archive emit SHALL carry, in its `judgements` array,
an entry with `kind: "readiness"` (shape and carrier both defined by `orbit-run-summary-emit`)
whenever the archive concludes a review cadence. The archive is the one emit admitting BOTH kinds,
so the array may also hold `continuation` entries from the same seam, one per gate proceeded past.
It is the archive's statement of what the AI BELIEVED about the work, formed against the
independent passes it names, and it is distinct from every record already here: `user_decision`
records the audit-drift prompt's outcome, a `continuation` entry records a decision to proceed past
a gate that had not passed, and the fingerprint fields record a content guard. None of them says whether the work was judged ready.

The record's `accepted` list is where RESIDUAL RISK belongs — each `{claim, why}` pair naming
something left unresolved and why that was acceptable. This SUPERSEDES the practice of writing
residual risk as free prose into `warnings`: `warnings` remains the home for PROCESS NOTES that
arose at the seam itself (a divergence observed at archive, a correction made in flow), which are
not readiness judgements and are not formed against independent passes. The distinction is the
qualifying test, not a stylistic preference — a `warnings` entry cites nothing AND occupies no
cadence position, so it can be ordered against nothing. (The second half is what carries the
distinction. An empty `formed_against` on a `continuation`/`proceed` also cites nothing, yet it
DOES hold a cadence position and its emptiness is itself checked against the trail — so
"cites nothing" alone never settles membership; see `orbit-run-summary-emit`.)

**THE CONTINUATION RECORD AT THIS SEAM.** When the Step 3.4 gate prompt — whose gate set
`orbit-engine-gates`' `Inflection-prompt override contract` owns — is answered **Proceed anyway**,
the archive emit SHALL carry ONE `judgements` entry per gate the prompt listed, each with
`kind: "continuation"` and `disposition: "proceed"` carrying THAT gate, its state and its reason AT
DECISION TIME as `gate`, `gate_state` and `gate_reason`. This entry is the SOLE record of the decision — the
`gate_overridden` field it once accompanied is RETIRED, and emits written before that retirement
carry the field as a PRIOR GENERATION that readers continue to accept. This seam — not apply's —
is where the decision is most often taken, and a record that admits the entry while no body is
told to write it ships the capability inert at its own primary carrier. The pass tokens
SHALL be read BEFORE the Step 5 move, because afterwards the change's active path no longer
resolves.

**THE EDGE THAT ONCE COULD NOT BE WRITTEN, AND NOW CAN.** The `review-system` gate is unpassed
precisely when the cadence is incomplete — which INCLUDES the state where no independent pass
exists at all. That case previously fell outside the successor, because `formed_against` was
unconditionally NON-EMPTY, and `gate_overridden` stood alone there. It no longer does: on a
`continuation`/`proceed` entry `formed_against: []` is LEGAL or REFUSED per the totality rule in
`orbit-run-summary-emit`, which owns both the predicate and the SET it is evaluated over. This
capability deliberately does NOT restate the condition: a rule restated in a second place is a rule
with two extensions, and this one already diverged once that way.
So when no pass precedes the emit, the entry SHALL still be written, with an empty
`formed_against`. The record is now TOTAL over the override's domain, which is what "strict
widening" required in order to be true rather than nearly true. The edge remains UNOBSERVED in
practice — every archived emit carrying the retired field has an earlier independent pass — but it
sits inside the override's own trigger condition, so it is closed by rule rather than left to a
first occurrence.

A `disposition: "not-ready"` record SHALL NOT block the archive. Readiness is a judgement and the
engine does not evaluate judgements (R-crc-10); the seam already carries consent, gate and audit
prompts for stopping, and an AI belief that could veto a user's archive would invert the steering
relationship the lifecycle is built on.

#### Scenario: Summary contents

- **WHEN** the archive completes
- **THEN** the JSON includes: command name, timestamp, change name, audit (ran/skipped, findings summary by severity), user_decision (one of: `proceeded_with_no_critical`, `proceeded_despite_critical`, `audit_skipped_via_flag`), sync_specs (capabilities updated, counts of added/modified/removed/renamed)

#### Scenario: Gate override recorded in the summary

- **WHEN** the archive gate prompt lists one or more gates (per `orbit-engine-gates`' override contract — e.g. `review-system` unpassed or stale) and the user chooses proceed-anyway
- **THEN** the archive run summary carries a `judgements` entry `{kind: "continuation", disposition: "proceed", gate, gate_state, gate_reason}` captured at decision time, one per listed gate (e.g. `{gate: "review-system", gate_state: "unpassed", gate_reason: <gate reason>}`); the entries are absent when no such decision was taken and REQUIRED when proceed-anyway was chosen. This is distinct from `user_decision`, which records the audit-drift prompt outcome.

#### Scenario: Fingerprint override recorded in the summary

- **WHEN** the user chooses proceed-anyway at the fingerprint-divergence inflection prompt (per this capability's `Fingerprint-divergence inflection prompt` requirement)
- **THEN** the archive run summary additionally includes `fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]` — one entry per diverged requirement, captured at decision time; the field is absent when no fingerprint override occurred and REQUIRED when proceed-anyway was chosen. This is distinct from the `continuation` judgement entry (review-cadence decision) and `user_decision` (audit-drift outcome).

#### Scenario: Unverified fingerprints recorded in the summary

- **WHEN** the archive proceeds past requirements whose fingerprint status was `unverified` (no base recorded)
- **THEN** the archive run summary additionally includes `fingerprints_unverified: [{capability, requirement}]` — one entry per unverified requirement; the field is absent when every touched requirement was verified

#### Scenario: Consent recorded in the summary

- **WHEN** the archive completes (post-consent-capability)
- **THEN** the archive run summary includes `consent: "user-invoked" | "prompted"` per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` for a user-typed invocation, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded; there is no third value (a consent abort writes no summary). Distinct from `user_decision` (audit outcome), the `continuation` judgement entry (cadence decision), and the fingerprint fields (content guard).

#### Scenario: PR fields recorded at emit-time state

- **WHEN** the archive completes for a PR-ATTACHED change (per `orbit-pr-lifecycle`)
- **THEN** the archive run summary additionally includes `pr_url` and `pr_state` — the PR's URL and its state AS OBSERVED by the read-only preflight that precedes the emit — normally `"draft"`, but truthfully `"ready"` when the PR was already flipped by the USER at an earlier point (including at a prior program's arc-done, for a program PR adopted afterward — never by a stage), and ELIDED when the state could not be observed. The field records what was seen, never a forward-looking claim about the flip this tail is about to perform. When the preflight POSITIVELY INVALIDATES the stored URL (the PR is closed, merged, retargeted, or in another repository), `pr_state` is ELIDED — the draft/ready axis does not apply to a PR in that condition, and recording `"draft"` would be a false observation — while `pr_url` IS still recorded, since it is the identity that was validated and rejected and the trail should show which PR the tail declined to write to. Both fields are absent for UNATTACHED changes — including changes originally proposed under `pr: never` — and present whenever an attachment resolves, EVEN IF `pr:` now reads `never`, per this capability's attachment-authority scope rule (the same invocation that runs the tail records its PR). The READY transition is evidenced by the PR itself and the completion readout, not by this record.

#### Scenario: Readiness recorded on an archive that concludes a cadence

- **WHEN** a change with independent review passes on its trail is archived
- **THEN** the archive run summary's `judgements` array carries a `kind: "readiness"` entry naming
  those passes in its `formed_against`, a `disposition`, prose `reasoning`, `ratified_by`, and an `accepted` list which
  is empty when nothing was left unresolved

#### Scenario: Residual risk moves out of warnings and into accepted

- **WHEN** a cadence ends with residual risk formed against the independent passes
- **THEN** each item appears as a `{claim, why}` pair in the readiness record's `accepted` list,
  NOT as free prose in `warnings`

#### Scenario: A seam-arising process note stays in warnings

- **WHEN** something is observed at the archive itself — a touchpoint divergence, a correction made
  in flow — that was not formed against any independent pass
- **THEN** it remains a `warnings` entry and is NOT an `accepted` pair, because it fails the
  qualifying test and carries nothing to order against

#### Scenario: A gate override at archive carries its continuation successor

- **WHEN** the archive proceeds past an unpassed or stale `review-system` gate
- **THEN** the archive run summary carries a `judgements` entry
  `{kind: "continuation", disposition: "proceed", gate, gate_state, gate_reason}` as the SOLE
  record of the decision — there is no second object to agree with, and no cross-record check
  remains because one record cannot disagree with itself

#### Scenario: An override with no independent pass to cite is still recorded

- **WHEN** the archive proceeds past an unpassed `review-system` gate on a trail carrying no
  independent pass earlier than the emit
- **THEN** the `judgements` entry is STILL written, carrying `formed_against: []` — legal here
  precisely because the emptiness is true of the trail (per `orbit-run-summary-emit`), so the
  decision is recorded rather than lost. Where an independent pass DOES precede the emit, an empty
  `formed_against` is refused naming that pass

#### Scenario: A not-ready record is the author's own dissent

- **WHEN** a readiness record carries `disposition: "not-ready"`
- **THEN** it records that the work archived against the author's judgement, with `ratified_by`
  stating honestly whether that judgement was the AI's or the user's, and it carries no routing
  `destination` — routing has no carrier in this cadence

#### Scenario: not-ready does not block

- **WHEN** the readiness record carries `disposition: "not-ready"`
- **THEN** the archive completes normally — sync, move and emit all proceed — and the record stands
  as the dissent

#### Scenario: Two gates proceeded past, two entries

- **WHEN** the archive gate prompt lists `review-proposal` (`unpassed`) and `review-system`
  (`blocked`) and the user chooses proceed-anyway
- **THEN** the `judgements` array carries two `continuation` entries, one naming each gate with its
  own state and reason as reported at decision time

### Requirement: Archive summary schema reference ships with the skill

The generated `orbit-archive-change` skill SHALL include
`references/archive-summary-schema.md` — the full schema for the Step 5.5 archive run-summary
JSON that the skill body already instructs the AI to read when composing the summary. The
content is migrated from the overlay's `openspec-archive-change/references/archive-summary-schema.md`
and **reconciled to the baseline-canonical shape and vocabulary** — the overlay source predates
the B1 baselines and disagrees on shape (four documented points) and carries opsx/openspec-era
residue that path renaming alone does not fix — satisfying the deferral recorded in B1.

#### Scenario: Reference exists after init

- **WHEN** `orbit init` generates the `orbit-archive-change` skill
- **THEN** `<skills-dir>/orbit-archive-change/references/archive-summary-schema.md` exists and
  documents the archive emit's fields: the universal spine plus the five named lifecycle-kind
  extensions (`archive_path`, `audit`, `sync_specs`, `unresolved_markers`, `user_decision`) per
  `orbit-conventions`' `Internal-run JSON summary format` requirement, plus `warnings` (present
  in that requirement's canonical lifecycle example), plus the conditional
  fingerprint fields (`fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]`
  and `fingerprints_unverified: [{capability, requirement}]`; present only when the corresponding
  fingerprint outcome occurred, per this capability's `Archive run summary written` requirement),
  plus the `consent` field (`"user-invoked" | "prompted"`; present on every post-capability
  archive emit, per `orbit-lifecycle-consent`'s emit-field requirement), plus the conditional
  `deferred_validations` array (`[{task, why, when, where}]`; present only when an unchecked
  user-validation task was deferred, per this capability's `User-validation closure at the archive
  seam` requirement)
  — and covers the field list in this capability's own `Archive run summary written` requirement

#### Scenario: Schema shapes match the baselines, not the overlay source

- **WHEN** the shipped schema is compared against the B1 baselines
- **THEN** it documents `unresolved_markers` as an ARRAY (not the overlay's object), the sync
  delta counts directly under `sync_specs` (not nested under `sync_specs.counts`), exactly the
  three baseline `user_decision` values — no `aborted` (per the baseline, an aborted archive
  writes no summary) — and the flat `audit_skipped_via_flag: true` skip-flag field (not the
  overlay's nested `audit.skipped_via_flag`), matching the baseline and the skill body

#### Scenario: No predecessor-era vocabulary survives

- **WHEN** the shipped reference content is scanned
- **THEN** it contains no `/opsx:` command references, no `openspec/` workspace paths, and no
  `openspec-*` skill names — all command, path, and skill vocabulary is orbit-named

#### Scenario: Body cite resolves

- **WHEN** the archive skill body instructs reading `references/archive-summary-schema.md`
- **THEN** that path resolves within the generated skill directory (the B1-era dangling cite is
  closed)

#### Scenario: The judgement record is documented in the shipped reference

- **WHEN** the shipped archive schema reference is read after init
- **THEN** it documents the conditional `judgements` array and its `readiness` entry alongside the
  other conditional fields — its `kind`, `formed_against`, `disposition`, `reasoning`, `ratified_by` and `accepted` — AND the
  `continuation` entry shape this seam also admits (`gate`/`gate_state`/`gate_reason`), in the same
  style the fingerprint fields use, including a `## Field notes` bullet, so
  the reference and the payload table agree per `orbit-emit-composition`'s parity requirement

#### Scenario: The deferral record is documented in the shipped reference

- **WHEN** the shipped archive schema reference is read after init
- **THEN** it documents the conditional `deferred_validations` array and its four keys, with a
  `## Field notes` bullet and a `json example` block carrying the field, which the reference round
  trip submits unchanged through the archive write gate
