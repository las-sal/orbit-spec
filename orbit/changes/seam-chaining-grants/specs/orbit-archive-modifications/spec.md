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
- **THEN** the archive run summary includes `consent`, one of `user-invoked`, `prompted` and `setting`, per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` for a user-typed invocation, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded, `setting` when the arrival was granted by the `archive` key of the project's `chain` map (the write gate refuses `setting` when that key does not grant it); a consent abort writes no summary. Distinct from `user_decision` (audit outcome), the `continuation` judgement entry (cadence decision), and the fingerprint fields (content guard).

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
  plus the `consent` field (`"user-invoked" | "prompted" | "setting"`; present on every post-capability
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

### Requirement: Consent prompt on AI-mediated archive entry

The archive workflow SHALL apply `orbit-lifecycle-consent`'s provenance rule at command entry:
provenance is CLASSIFIED at entry (a fact about the triggering turn), and on AI-mediated arrival
that is not granted (per that capability's `Invocation-provenance rule`: the change status's `chain`
object names `/orbit:archive <change>` with `may_run: true`) the consent AskUserQuestion fires AFTER read-only discovery (change selection; the read-only look
at the change's `specs/` that supplies the write preview) and BEFORE any of the command's writes
or anomaly prompts (before the Step 3.4 gate prompt — consent asks "should we be here at all";
the anomaly prompts ask "is the state sound"). The prompt content: position readout + what the
archive will write (N deltas across M capabilities synced to baseline, change moved to archive —
Proceed / Abort). When the change is PR-ATTACHED (per `orbit-pr-lifecycle`), the preview
SHALL ADDITIONALLY name the tail's OUTWARD writes: the branch the archive commit lands on,
the PUSH to the resolved remote, and — for a per-proposal PR — the READY FLIP, or, for a
program PR, the APPENDED stage entry. This is required precisely because the tail rides this
same entry consent and fires no second prompt of its own: a preview enumerating only in-repo
writes would obtain consent for a spec sync and a directory move, then push to a remote and
flip a pull request public. The outward line is OMITTED for unattached changes, so the
pre-capability prompt is unchanged wherever no PR exists — and it is likewise OMITTED under
`/orbit:bulk-archive`, which performs no tail (see this capability's tail requirement), so its
per-change prompts have no outward writes to preview and keep the pre-capability content
whatever each change's attachment state. The preview REPORTS what the tail
will attempt; a tail that later degrades (no remote, `gh` failure, HEAD mismatch) still
skips with its own note — the preview is not a promise that every step succeeds. A
user-typed `/orbit:archive` runs with no consent prompt. Proceeding records
`consent: "prompted"` in the archive run summary; an abort writes no summary. A granted arrival
fires no consent prompt and records `consent: "setting"`: no preview is shown, so the outward writes
the tail rides on this entry are named instead in the `archive` key's row of `orbit-engine-gates`'
`The chain setting grants each command on its own key`, which the user reads before granting it, and
the tail runs exactly as it would after a Proceed. The bulk-archive
workflow applies the same rule per change (a user-typed `/orbit:bulk-archive` whose flow confirms
the batch is user-invoked for the confirmed set).

#### Scenario: AI-mediated entry prompts first

- **WHEN** the archive workflow is reached via delegation/inference (no same-turn user
  invocation) and the arrival is not granted
- **THEN** the consent prompt fires before the gate, fingerprint, and audit steps; Abort leaves
  no writes and no summary

#### Scenario: User-typed entry skips the consent prompt

- **WHEN** the user types `/orbit:archive <name>`
- **THEN** no consent prompt fires; the flow proceeds directly to Step 1.5 onward, and the run
  summary records `consent: "user-invoked"`

#### Scenario: Preview names the outward writes for an attached change

- **WHEN** the consent prompt fires for a PR-ATTACHED change
- **THEN** the preview names the branch, the push to the resolved remote, and the READY flip (or the appended stage entry for a program PR) alongside the sync and move — so no push or public flip follows a consent that never mentioned it

#### Scenario: Unattached change keeps the pre-capability preview

- **WHEN** the consent prompt fires for a change with no PR attachment
- **THEN** the preview is byte-identical to the pre-capability content (deltas synced, change moved) — no outward line appears

#### Scenario: A granted entry skips the consent prompt and runs the tail

- **WHEN** the archive of a PR-attached change is reached because the change status's `chain` object
  allowed `/orbit:archive <change> — user-invoked`, granted by `chain.archive`
- **THEN** no consent prompt fires, the anomaly prompts fire as on a typed arrival, the run summary
  records `consent: "setting"`, and the tail commits, pushes, rewrites the description and flips the
  PR to ready with no prompt of its own
