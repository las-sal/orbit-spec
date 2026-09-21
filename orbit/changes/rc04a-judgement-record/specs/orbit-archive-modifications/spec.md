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

#### Scenario: Readiness recorded on an archive that concludes a cadence

- **WHEN** a change with independent review passes on its trail is archived
- **THEN** the archive run summary carries a `readiness` record naming those passes in
  `formed_against`, a `disposition`, prose `reasoning`, `ratified_by`, and an `accepted` list which
  is empty when nothing was left unresolved

#### Scenario: Residual risk moves out of warnings and into accepted

- **WHEN** a cadence ends with residual risk formed against the independent passes
- **THEN** each item appears as an `{claim, why}` pair in the readiness record's `accepted` list,
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
carries an `architecture: {doc, stage}` citation — one line rendering the cited stage's
post-archive COMPUTED position (e.g. `stage d2-architect: now quiescent —
completion is yours to ratify`, or `stage d6-pr-lifecycle: still in-change — <other-change>
also cites it`). The line rides the existing position render and introduces no prompt and no doc
mechanism (D-arc D-d2-4: the readout is the reminder; ratification happens in an architect
session). Uncited changes see no stage line.

**THE READINESS LINE (rc04a).** The completion readout SHALL additionally STATE a readiness record
whose `disposition` is `not-ready` — one line naming that the change was archived against the
author's own judgement, and pointing at the record. This is the record's READER, and it exists
because a judgement record that no surface consumes would repeat the defect this program already
found in `gate_overridden`: written by everyone, read by nothing. A `ready` disposition renders no
line — the ordinary case needs no announcement, and a readout that speaks on every archive teaches
readers to skip it.

#### Scenario: Cited stage renders its post-archive position

- **WHEN** an archived change's metadata cites `{doc, stage}` and the archive completes
- **THEN** the completion readout carries one stage line with that stage's computed position, and no prompt fires

#### Scenario: Uncited change renders no stage line

- **WHEN** an archived change's metadata carries no `architecture` citation
- **THEN** the completion readout is unchanged from pre-capability output

#### Scenario: A not-ready archive says so where a human is looking

- **WHEN** the archive carries a readiness record with `disposition: "not-ready"`
- **THEN** the completion readout states it in one line and names the record, so the dissent is
  visible at the moment it happens rather than only inside a JSON field

#### Scenario: A ready archive adds no line

- **WHEN** the readiness record carries `disposition: "ready"`
- **THEN** the completion readout is unchanged — the record is written, and the readout stays quiet
