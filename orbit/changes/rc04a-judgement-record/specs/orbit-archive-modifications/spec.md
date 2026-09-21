## MODIFIED Requirements

### Requirement: Archive run summary written

The system SHALL write a JSON summary to `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/.orbit-runs/archive-<TS>.json` after a successful archive (the `<YYYY-MM-DD>-` prefix is added by upstream's archive move step).

**THE TERMINAL READINESS RECORD (rc04a).** The archive emit SHALL carry a `readiness` judgement
record (shape defined by `orbit-run-summary-emit`) whenever the archive concludes a review cadence.
It is the archive's statement of what the AI BELIEVED about the work, formed against the
independent passes it names, and it is distinct from every record already here: `user_decision`
records the audit-drift prompt's outcome, `gate_overridden` records a refusal to be blocked, and
the fingerprint fields record a content guard. None of them says whether the work was judged ready.

The record's `accepted` list is where RESIDUAL RISK belongs — each `{claim, why}` pair naming
something left unresolved and why that was acceptable. This SUPERSEDES the practice of writing
residual risk as free prose into `warnings`: `warnings` remains the home for PROCESS NOTES that
arose at the seam itself (a divergence observed at archive, a correction made in flow), which are
not readiness judgements and are not formed against independent passes. The distinction is the
qualifying test, not a stylistic preference — a `warnings` entry cites nothing and can be ordered
against nothing.

A `disposition: "not-ready"` record SHALL NOT block the archive. Readiness is a judgement and the
engine does not evaluate judgements (R-crc-10); the seam already carries consent, gate and audit
prompts for stopping, and an AI belief that could veto a user's archive would invert the steering
relationship the lifecycle is built on.

#### Scenario: Summary contents

- **WHEN** the archive completes
- **THEN** the JSON includes: command name, timestamp, change name, audit (ran/skipped, findings summary by severity), user_decision (one of: `proceeded_with_no_critical`, `proceeded_despite_critical`, `audit_skipped_via_flag`), sync_specs (capabilities updated, counts of added/modified/removed/renamed)

#### Scenario: Gate override recorded in the summary

- **WHEN** the `review-system` gate is unpassed or stale at archive and the user chooses proceed-anyway at the inflection prompt (per `orbit-engine-gates`' override contract)
- **THEN** the archive run summary additionally includes `gate_overridden: {gate, state, reason}` captured at decision time (e.g. `{gate: "review-system", state: "unpassed", reason: <gate reason>}`); the field is absent when no gate override occurred and REQUIRED when proceed-anyway was chosen. This is distinct from `user_decision`, which records the audit-drift prompt outcome.

#### Scenario: Fingerprint override recorded in the summary

- **WHEN** the user chooses proceed-anyway at the fingerprint-divergence inflection prompt (per this capability's `Fingerprint-divergence inflection prompt` requirement)
- **THEN** the archive run summary additionally includes `fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]` — one entry per diverged requirement, captured at decision time; the field is absent when no fingerprint override occurred and REQUIRED when proceed-anyway was chosen. This is distinct from `gate_overridden` (review-cadence override) and `user_decision` (audit-drift outcome).

#### Scenario: Unverified fingerprints recorded in the summary

- **WHEN** the archive proceeds past requirements whose fingerprint status was `unverified` (no base recorded)
- **THEN** the archive run summary additionally includes `fingerprints_unverified: [{capability, requirement}]` — one entry per unverified requirement; the field is absent when every touched requirement was verified

#### Scenario: Consent recorded in the summary

- **WHEN** the archive completes (post-consent-capability)
- **THEN** the archive run summary includes `consent: "user-invoked" | "prompted"` per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` for a user-typed invocation, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded; there is no third value (a consent abort writes no summary). Distinct from `user_decision` (audit outcome), `gate_overridden` (cadence override), and the fingerprint fields (content guard).

#### Scenario: PR fields recorded at emit-time state

- **WHEN** the archive completes for a PR-ATTACHED change (per `orbit-pr-lifecycle`)
- **THEN** the archive run summary additionally includes `pr_url` and `pr_state` — the PR's URL and its state AS OBSERVED by the read-only preflight that precedes the emit — normally `"draft"`, but truthfully `"ready"` when the PR was already flipped by the USER at an earlier point (including at a prior program's arc-done, for a program PR adopted afterward — never by a stage), and ELIDED when the state could not be observed. The field records what was seen, never a forward-looking claim about the flip this tail is about to perform. When the preflight POSITIVELY INVALIDATES the stored URL (the PR is closed, merged, retargeted, or in another repository), `pr_state` is ELIDED — the draft/ready axis does not apply to a PR in that condition, and recording `"draft"` would be a false observation — while `pr_url` IS still recorded, since it is the identity that was validated and rejected and the trail should show which PR the tail declined to write to. Both fields are absent for UNATTACHED changes — including changes originally proposed under `pr: never` — and present whenever an attachment resolves, EVEN IF `pr:` now reads `never`, per this capability's attachment-authority scope rule (the same invocation that runs the tail records its PR). The READY transition is evidenced by the PR itself and the completion readout, not by this record.

#### Scenario: Readiness recorded on an archive that concludes a cadence

- **WHEN** a change with independent review passes on its trail is archived
- **THEN** the archive run summary carries a `readiness` record naming those passes in
  `formed_against`, a `disposition`, prose `reasoning`, `ratified_by`, and an `accepted` list which
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

#### Scenario: not-ready does not block

- **WHEN** the readiness record carries `disposition: "not-ready"`
- **THEN** the archive completes normally — sync, move and emit all proceed — and the record stands
  as the dissent

### Requirement: Stage line in the archive completion readout

The archive completion output SHALL include a stage line when the archived change's metadata
carries an `architecture:` citation: after the move, render the cited stage's post-archive
computed position from `orbit architecture status` (e.g. `stage d2-architect: now quiescent —
completion is yours to ratify`, or `stage d6-pr-lifecycle: still in-change — <other-change>
remains active`). One line riding the existing position render — no prompt, no doc edit, no new
mechanism (D-arc D-d2-4: the readout is the reminder; ratification happens in an architect
session or by hand, never here). Uncited changes see no stage line.

**THE READINESS LINE (rc04a).** The completion readout SHALL additionally STATE a readiness record
whose `disposition` is `not-ready` — one line naming that the change was archived against the
author's own judgement, and pointing at the record. This is the record's READER, and it exists
because a judgement record that no surface consumes would repeat the defect this program already
found in `gate_overridden`: written by everyone, read by nothing. A `ready` disposition renders no
line — the ordinary case needs no announcement, and a readout that speaks on every archive teaches
readers to skip it.

#### Scenario: Quiescent stage surfaced at archive

- **WHEN** a change citing `{doc, stage}` archives and no other live work cites that stage
- **THEN** the completion readout includes the stage line reporting quiescent-awaiting-ratification (or `complete` if already ratified)

#### Scenario: Uncited change unchanged

- **WHEN** a change without an `architecture:` citation archives
- **THEN** the completion readout contains no stage line and is byte-identical to pre-D2 behavior

#### Scenario: A not-ready archive says so where a human is looking

- **WHEN** the archive carries a readiness record with `disposition: "not-ready"`
- **THEN** the completion readout states it in one line and names the record, so the dissent is
  visible at the moment it happens rather than only inside a JSON field

#### Scenario: A ready archive adds no line

- **WHEN** the readiness record carries `disposition: "ready"`
- **THEN** the completion readout is unchanged — the record is written, and the readout stays quiet

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
  in that requirement's canonical lifecycle example), plus the conditional `gate_overridden`
  field (`{gate, state, reason}`; present only when the user proceeded past an unpassed/stale
  `review-system` gate, per `orbit-engine-gates`' override contract), plus the conditional
  fingerprint fields (`fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]`
  and `fingerprints_unverified: [{capability, requirement}]`; present only when the corresponding
  fingerprint outcome occurred, per this capability's `Archive run summary written` requirement),
  plus the `consent` field (`"user-invoked" | "prompted"`; present on every post-capability
  archive emit, per `orbit-lifecycle-consent`'s emit-field requirement)
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

#### Scenario: The readiness record is documented in the shipped reference

- **WHEN** the shipped archive schema reference is read after init
- **THEN** it documents the conditional `readiness` judgement record alongside the other conditional
  fields — its `kind`, `formed_against`, `disposition`, `reasoning`, `ratified_by`, `accepted` and
  (on `not-ready`) `destination` — in the same style `gate_overridden` and the fingerprint fields
  use, so the reference and the payload table agree per `orbit-emit-composition`'s parity
  requirement
