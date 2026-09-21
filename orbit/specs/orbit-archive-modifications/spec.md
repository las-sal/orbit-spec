# orbit-archive-modifications Specification

## Purpose
TBD - created by archiving change relocate-modified-upstream-workflows. Update Purpose after archive.
## Requirements
### Requirement: Upstream archive behavior preserved

The system SHALL preserve upstream `/orbit:archive`'s core behavior: validate the change is ready, run `sync-specs` to merge deltas into baseline, and move the change directory to `orbit/changes/archive/<YYYY-MM-DD>-<name>/`.

#### Scenario: Standard archive flow

- **WHEN** the user invokes `/orbit:archive <change-name>` for an applied change with no orbit-specific intervention
- **THEN** the upstream sequence runs: validation, sync-specs, move-to-archive — exactly as upstream

### Requirement: Pre-archive audit-drift invocation

The system SHALL auto-invoke `/orbit:audit-drift` as a pre-archive sweep before completing the archive operation, unless `--skip-audit` is set.

#### Scenario: Audit runs before archive

- **WHEN** `/orbit:archive <change-name>` is invoked without `--skip-audit`
- **THEN** the command invokes `/orbit:audit-drift` as a library function before any move or sync-specs operation; the audit's findings are presented in the archive output

#### Scenario: `--skip-audit` bypass

- **WHEN** the command runs with `--skip-audit`
- **THEN** Pre-archive audit is skipped; the archive run summary records `audit_skipped_via_flag: true`

### Requirement: Critical-drift prompt, not gate

The system SHALL prompt the user (not block) when audit-drift reports critical findings. This audit-drift prompt is DISTINCT from the `review-system` gate inflection prompt (per `orbit-engine-gates`): the audit prompt concerns drift findings; the gate prompt concerns review convergence. Both are apply-parity prompts — surface-and-record, never hard-block — and both MAY fire in a single archive invocation (the gate prompt first, per the gated-phase contract, then the audit prompt).

#### Scenario: Critical drift detected

- **WHEN** the pre-archive audit reports one or more CRITICAL findings
- **THEN** the command prompts via `AskUserQuestion`: "Address now / Proceed with archive / Abort?" with the audit's full findings shown to inform the choice

#### Scenario: Address now

- **WHEN** the user chooses "Address now"
- **THEN** the archive does not proceed; the user can fix the drift issues and re-invoke the archive command later

#### Scenario: Proceed despite critical

- **WHEN** the user chooses "Proceed with archive" despite critical findings
- **THEN** the archive proceeds normally and the archive run summary records `user_decision: proceeded_despite_critical`

#### Scenario: Abort

- **WHEN** the user chooses "Abort"
- **THEN** the archive is cancelled; no move, no sync-specs, no summary written

#### Scenario: No critical findings

- **WHEN** the pre-archive audit reports no CRITICAL findings
- **THEN** the archive proceeds without prompting FOR DRIFT; warnings (if any) are logged in the archive run summary. "Without prompting" scopes to the audit-drift prompt ONLY — an unpassed or stale `review-system` gate still fires its own inflection prompt (per `orbit-engine-gates`' override contract), independent of the audit result.

### Requirement: Archive run summary written

The system SHALL write a JSON summary to `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/.orbit-runs/archive-<TS>.json` after a successful archive (the `<YYYY-MM-DD>-` prefix is added by upstream's archive move step).

**THE TERMINAL READINESS RECORD (rc04a).** The archive emit SHALL carry, in its `judgements` array,
an entry with `kind: "readiness"` (shape and carrier both defined by `orbit-run-summary-emit`)
whenever the archive concludes a review cadence. The archive is the one emit admitting BOTH kinds,
so the array may also hold a `continuation` entry from the same seam.
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

**THE CONTINUATION RECORD AT THIS SEAM.** When the Step 3.4 `review-system` gate prompt is answered
**Proceed anyway**, the archive emit SHALL carry, ALONGSIDE `gate_overridden`, a `judgements` entry
with `kind: "continuation"` and `disposition: "proceed"` whose `gate`, `gate_state` and `gate_reason`
are identical to the `gate_overridden` object's `gate`, `state` and `reason`. This seam — not
apply's — is where the override is most often taken, and a record that admits the entry while no
body is told to write it ships the capability inert at its own primary carrier. The pass tokens
SHALL be read BEFORE the Step 5 move, because afterwards the change's active path no longer
resolves.

**THE ONE EDGE WHERE THE SUCCESSOR CANNOT BE WRITTEN.** `formed_against` is required NON-EMPTY, and
the `review-system` gate is unpassed precisely when the cadence is incomplete — which INCLUDES the
state where no independent pass exists at all. When no independent pass precedes this emit, the
entry SHALL be OMITTED and `gate_overridden` stands alone: the record cannot be formed against
evidence that does not exist, and inventing a token is refused by the ordering check. This is a
NAMED case rather than a gap: across every archived change, 20 emits carry `gate_overridden` and
all 20 have an earlier independent pass, so the edge is unobserved — but it is inside the
override's own trigger condition, so the stage that RETIRES `gate_overridden` must handle a domain
the successor provably cannot cover, rather than discover it.

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
- **THEN** the archive run summary carries BOTH `gate_overridden: {gate, state, reason}` AND a
  `judgements` entry `{kind: "continuation", disposition: "proceed", gate, gate_state, gate_reason}`
  whose three gate facts match the override object's, and a mismatch between them is refused

#### Scenario: An override with no independent pass to cite omits the entry

- **WHEN** the archive proceeds past an unpassed `review-system` gate on a trail carrying no
  independent pass earlier than the emit
- **THEN** `gate_overridden` is recorded alone and the `judgements` entry is OMITTED — a non-empty
  `formed_against` is unavailable, so the successor record cannot be formed

#### Scenario: A not-ready record is the author's own dissent

- **WHEN** a readiness record carries `disposition: "not-ready"`
- **THEN** it records that the work archived against the author's judgement, with `ratified_by`
  stating honestly whether that judgement was the AI's or the user's, and it carries no routing
  `destination` — routing has no carrier in this cadence

#### Scenario: not-ready does not block

- **WHEN** the readiness record carries `disposition: "not-ready"`
- **THEN** the archive completes normally — sync, move and emit all proceed — and the record stands
  as the dissent

### Requirement: `.orbit-runs/` directory moves with the change

The system SHALL move the change's `.orbit-runs/` directory along with the rest of the change content into the archive.

#### Scenario: Move with the change

- **WHEN** the archive moves `orbit/changes/<name>/` to `orbit/changes/archive/<YYYY-MM-DD>-<name>/`
- **THEN** the `.orbit-runs/` subdirectory is moved as part of the change content; all prior internal-run summaries and external-review findings persist in the archived location at `orbit/changes/archive/<YYYY-MM-DD>-<name>/.orbit-runs/`

### Requirement: Unresolved marker warning

The system SHALL grep the change directory for unresolved `@review:` markers before completing the archive and warn the user if any are present.

#### Scenario: Unresolved markers detected

- **WHEN** `orbit/changes/<change-name>/` contains one or more `@review:` markers
- **THEN** the command warns: "N unaddressed `@review:` markers will land in archive — convert to `@todo:` or address before archiving?" and offers the user options to convert / address / proceed

#### Scenario: No markers

- **WHEN** the change directory contains no `@review:` markers
- **THEN** the archive proceeds without this warning

### Requirement: Edge cases

The system SHALL handle archive edge cases predictably.

#### Scenario: Already archived

- **WHEN** the user invokes `/orbit:archive <change-name>` for a change already in `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/`
- **THEN** the command halts with a clear error: "Change <name> is already at orbit/changes/archive/<YYYY-MM-DD>-<name>/."

#### Scenario: audit-drift fails to run

- **WHEN** the pre-archive audit fails to execute (parse error, internal exception)
- **THEN** the archive proceeds with a warning; the archive run summary records `audit.ran: false` with the failure reason

### Requirement: Audit informational, not blocking by default

The system SHALL treat audit-drift findings as informational unless the user explicitly chooses to abort. Audit-drift remains orthogonal to the gate graph (per `orbit-engine-gates` D-c1-9); the `review-system` gate is a separate, also-non-blocking concern that the archive flow surfaces via its own inflection prompt.

#### Scenario: Don't auto-fix

- **WHEN** audit-drift surfaces findings
- **THEN** the archive command does NOT attempt to resolve them automatically; the user's options are surface-prompt-proceed-or-abort

#### Scenario: Don't re-run reviews

- **WHEN** the user invokes archive
- **THEN** the command does NOT automatically invoke `/orbit:review --as system` even if it hasn't run — the user owns review execution. The `review-system` gate (per `orbit-engine-gates`) computes whether system review has converged; when the gate is unpassed or stale, the archive flow fires the inflection prompt (address the gate / proceed anyway / abort) with the canonical next command, and proceeding records `gate_overridden` in the archive run summary. The gate surfaces and records — it never auto-runs review and never hard-blocks the archive.

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

#### Scenario: The judgement record is documented in the shipped reference

- **WHEN** the shipped archive schema reference is read after init
- **THEN** it documents the conditional `judgements` array and its `readiness` entry alongside the
  other conditional fields — its `kind`, `formed_against`, `disposition`, `reasoning`, `ratified_by` and `accepted` — AND the
  `continuation` entry shape this seam also admits (`gate`/`gate_state`/`gate_reason`), in the same
  style `gate_overridden` and the fingerprint fields use, including a `## Field notes` bullet, so
  the reference and the payload table agree per `orbit-emit-composition`'s parity requirement

### Requirement: Fingerprint-divergence inflection prompt

The archive workflow SHALL check base fingerprints (`orbit fingerprint <name> --check
--json`, per `orbit-base-fingerprints`) after the `review-system` gate inflection prompt and
before the pre-archive audit sweep, and prompt on anything not `verified`:

- **Any requirement `diverged`** → fire an inflection prompt (AskUserQuestion) presenting the
  divergence report (requirement names plus the live-vs-would-be-written diff) with exactly three
  options: **Reconcile** (halt the archive; print the guided-manual reconcile instructions per
  `orbit-base-fingerprints`), **Proceed anyway** (continue the archive flow past the check; the
  run summary records the override — the workflow applies deltas agent-driven, so no CLI flag is
  involved; `--override-fingerprints` is the equivalent for CLI-direct `orbit archive` runs), or
  **Abort**. When `unverified` requirements exist alongside diverged ones, the divergence prompt
  SHALL list them too (proceeding records both run-summary fields).
- **Any requirement `unverified` and none `diverged`** → prompt proceed / abort ("can't verify —
  no base recorded"); proceeding records the unverified requirements in the run summary. The
  engine-level warn alone is not sufficient interactively — a console warning in a `--yes` flow is
  near-silent, and missing fingerprints must not become a silent-loss loophole.
- **All requirements `verified`** (or the change touches no existing requirements) → no prompt.

This prompt is DISTINCT from the `review-system` gate prompt and the audit-drift prompt; all three
MAY fire in one archive invocation (gate first, then fingerprints, then audit). The bulk-archive
workflow SHALL run the same check and prompt per change before that change's sync and move steps
(its agent-driven path never runs the engine guard, so the check step is its only guard layer).

#### Scenario: Divergence prompt fires with the diff

- **WHEN** the pre-archive fingerprint check reports `diverged` for at least one requirement
- **THEN** the workflow fires the reconcile / proceed-anyway / abort prompt showing which
  requirements diverged and what content the write would drop, and does not proceed without an
  explicit choice

#### Scenario: Proceed-anyway is recorded

- **WHEN** the user chooses proceed-anyway at the divergence prompt
- **THEN** the archive flow continues past the check and the run summary records
  `fingerprint_overridden` for every diverged requirement, captured at decision time

#### Scenario: Unverified-only proceed is recorded

- **WHEN** the check reports `unverified` requirements and no `diverged` ones, and the user
  chooses to proceed
- **THEN** the archive flow continues normally and the run summary records
  `fingerprints_unverified`

#### Scenario: Clean check is silent

- **WHEN** every touched requirement reports `verified`
- **THEN** no fingerprint prompt fires and no fingerprint fields appear in the run summary

### Requirement: Consent prompt on AI-mediated archive entry

The archive workflow SHALL apply `orbit-lifecycle-consent`'s provenance rule at command entry:
provenance is CLASSIFIED at entry (a fact about the triggering turn), and on AI-mediated arrival
the consent AskUserQuestion fires AFTER read-only discovery (change selection; the read-only look
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
`consent: "prompted"` in the archive run summary; an abort writes no summary. The bulk-archive
workflow applies the same rule per change (a user-typed `/orbit:bulk-archive` whose flow confirms
the batch is user-invoked for the confirmed set).

#### Scenario: AI-mediated entry prompts first

- **WHEN** the archive workflow is reached via delegation/inference (no same-turn user
  invocation)
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

### Requirement: PR-attached archive tail

The archive flow SHALL, for a PR-ATTACHED change, continue past the archive emit as one
designed tail — preceded by a READ-ONLY PR PREFLIGHT that runs BEFORE the archive emit is
written. The preflight performs every OBSERVATION the tail depends on and no mutation:
resolve the attachment, validate a stored `url` live, and observe the PR's CURRENT
draft/ready state. It sits before the emit because the emit is required to record the PR's
state AS OBSERVED, and the frozen propose record cannot supply it — that record says `draft`
by construction for the life of the change. One observation therefore feeds BOTH the emit
and the post-emit tail, so the two can never disagree about the PR they are describing. A
preflight that cannot observe (no `gh`, failed query) elides the emit's PR fields and skips
the tail per the availability rule; it never blocks the archive.

Because the preflight observes real state rather than restating the record, a PR may be
found ALREADY READY — the user may have flipped it by hand, and an ADOPTED program PR may
have been flipped by the user at an earlier point — including at a prior program's arc-done,
for a program PR adopted afterward. No STAGE ever performs a program flip (every program flip
is the human's act per `orbit-pr-lifecycle`); the PR simply arrives already READY. That is a
NORMAL observation, not an anomaly: the
emit records `"ready"` truthfully, and the tail's flip step is IDEMPOTENT — it does not
re-flip, does not error, and reports the PR was already READY in one line. The tail's other
steps (commit, push, description rewrite or stage-entry append) proceed unchanged. ATTACHMENT AND PR IDENTITY are DISCOVERED, never assumed: read the
`pr_attachment` object from the change's own trail — the LATEST attachment-bearing PROPOSE
**or FF** emit (both are equally authoritative; `/orbit:ff` carries the identical
choreography per `orbit-pr-lifecycle`'s entry-points requirement, so a tail that reads only
propose emits loses every ff-started change's attachment). That object supplies BOTH facts
the tail needs: `granularity` decides whether this seam flips READY (per-proposal) or
appends only (per-architecture), and `branch` names what to commit to — neither is
re-derived from config or the citation.

TOOL AVAILABILITY IS CHECKED BEFORE ANY STAGING, not discovered mid-tail. `gh` may have
been present at propose (so an attachment exists) and be absent at archive; the config
contract's promise that a missing `gh` degrades to "today's behavior" is only honored if the
whole tail is skipped BEFORE it commits and pushes. The tail SHALL therefore verify `gh`
availability as a precondition alongside the HEAD check and SKIP entirely with a one-line
note when it is missing — leaving the archive exactly as pre-capability. A `gh` failure
encountered AFTER staging began is the different, already-specified case: mid-tail
degradation that names completed vs skipped steps. The distinction is what keeps "no `gh` =
today's behavior" true rather than "no `gh` = committed and pushed, then failed".

Because `git commit` writes to whatever HEAD points at and takes no branch argument,
"`branch` names what to commit to" is a PRECONDITION the tail SHALL VERIFY, not an
assumption: before staging anything, compare HEAD's current branch to
`pr_attachment.branch`. When they differ the tail SKIPS with a one-line note naming BOTH
branches — and the recovery text is SPECIFIC TO THE CASE, because one command cannot serve
all three and a note prescribing an impossible command is worse than none:

- **Local branch exists, HEAD is elsewhere** — recover with `git switch <branch>`, noting
  that the archive's uncommitted writes must survive the switch (they do when they do not
  collide; when they would, the note says to commit or stash them first).
- **Branch exists only on the resolved remote** — `git switch <branch>` cannot work; the
  note gives the fetch-and-track form
  (`git fetch <resolved-remote> && git switch -c <branch> --track <resolved-remote>/<branch>`).
- **Branch absent both locally and on the remote** — no switch recovers it; the note says so
  PLAINLY and points at the attachment record as the evidence of what was expected, rather
  than printing a command that will fail.

A HEAD mismatch skips the TAIL but does NOT suppress the emit's PR fields: the preflight's
observation ran before the branch check and is independent of it, so the trail records the
PR facts that were actually seen. This is the deliberate counterpart to the tool-availability
rule, where the fields ARE elided — there the preflight could not observe at all, here it
could and did. The distinction is exactly whether an observation exists, never whether the
tail went on to act on it. It NEVER checks out, stashes, or
otherwise moves the working tree: the same restraint as "orbit never force-moves, renames,
rebases, or force-pushes a user's branch", and for the same reason — a working-tree mutation
here would fire AFTER the user consented to a sync-and-move, not before. This case is
uncommon (propose leaves the user on the branch and apply keeps them there), but it is
uncommon, SILENT, and lands on the default branch: without the check the archive writes
commit and push to `main`, every step reports success, the ordering invariant reads as
satisfied, and a PR is flipped READY announcing work it does not contain. The archive itself
(sync, move, emit) has already completed and is never rolled back — the skip strands nothing
but the commit, which the note's recovery line addresses directly. A STORED `url` IS A CLAIM, NOT A FACT, AND IS VALIDATED LIVE. GitHub stays mutable between
the two seams: a PR recorded at propose may since have been CLOSED by the user, MERGED,
RETARGETED to a different base, or (in a fork checkout) belong to a different repository
than the resolved one. Before ANY PR operation the tail SHALL resolve the stored URL
read-only and check it against the SAME four predicates the fallback query uses — resolved
repository, head branch, resolved base, and open state. Without this the primary path is the
UNVALIDATED one: every normally-opened PR carries a URL, so the fallback never runs for it,
and this capability's own "PR closed manually → discovery finds nothing → skip" scenario
becomes unreachable for exactly the changes it was written for — the tail would instead
REWRITE the description of a PR the user deliberately closed and discover the problem only
when `gh pr ready` failed.

The validation runs EARLY (read-only, before staging, so the note is accurate and nothing is
discovered mid-flight), but its outcome scopes ONLY THE PR HALF of the tail. A stored record
that fails validation SKIPS the tail's PR-WRITING STEPS — stated path-neutrally because both
granularities are affected: the description rewrite (per-change) OR the stage-entry append
(program), and the flip. Appending a stage entry to a PR the user closed is the same harm as
rewriting its description, so neither path is exempt. The skip carries a one-line note
naming the SPECIFIC reason — `closed`, `merged`, `retargeted to <base>`, `repository
mismatch`, or `not found` — each distinct, never collapsed into a generic miss. The COMMIT
and PUSH still proceed: those writes are the archive's own, they land on the change's branch
via the resolved remote, and they are correct whatever became of the pull request. The PR
layer degrades without taking the lifecycle's own bookkeeping down with it — the same
principle as `pr: never`, applied one level finer. (A failed validation never triggers the
fallback query as a second chance: a record that resolves to a closed PR is ANSWERED, not
missing.)

A WHOLLY ABSENT `pr_attachment` TERMINATES THE PR PATH — it never triggers discovery. The
change is UNATTACHED, and unattached means pre-capability: no remote work, no `gh`
invocation, no commit, push, edit, or flip. This is the same fact the scope rule states
below, and the two must agree, because a fallback keyed on ABSENCE would contradict it
exactly where the contradiction is most expensive: `/orbit:new` and `/orbit:continue` never
produce an attachment (per `orbit-pr-lifecycle`'s entry-points requirement), so a change
started that way whose branch name happens to match an open PR someone opened by hand would
be committed, pushed, rewritten, and flipped — after a consent preview that OMITTED the
outward-writes line precisely because the change is unattached. An unpreviewed push on an
explicitly out-of-scope path is the worst outcome this capability can produce.

The fallback therefore serves ONE narrow case: an attachment that EXISTS but lacks `url` —
the recorded state after the branch work succeeded and PR creation failed or degraded. There
the change IS attached (the branch is real, the granularity is frozen, the consent preview
named the outward writes), and only the PR's identity is missing. In that case fall back to
`gh pr list` — and the fallback SHALL identify EXACTLY ONE PR before
acting, because a head branch does not uniquely identify a pull request. The query is
CONSTRAINED on all four axes and every one is required — with the remote and the base
resolved by `orbit-pr-lifecycle`'s `Remote and default-branch resolution` requirement, the
SHARED algorithm propose uses, so the two seams can never disagree about the repository or
the base; an unresolvable remote or base is a DEGRADATION SKIP naming the resolution
failure, never a zero result: the RESOLVED REMOTE's repository
(`--repo`, so a fork's PRs are never mistaken for this repo's), the `--head <branch>` from
the attachment or the mechanical name, `--state open` (a closed or merged PR is not a
flip target), and the RESOLVED BASE — candidates whose base is not the resolved default
branch are DISCARDED, since a PR from this branch into some other branch is a different
effort. THREE outcomes, each a DISTINCT one-line note, none of them silent:

- **Exactly one survivor** — the tail proceeds against it.
- **Zero survivors** (the PR was never successfully created, was closed, or the branch was
  renamed — never "created without propose", since such a change has no attachment and so
  never reaches this query) — SKIP with a note naming the miss.
- **More than one survivor** — SKIP with a note naming the AMBIGUITY and listing the
  candidate URLs. orbit never picks by recency or number: rewriting the wrong PR's
  description and flipping it READY is worse than doing nothing, and the user is present
  by construction (per `orbit-pr-lifecycle`'s operating-assumption requirement) to say
  which one is meant.

A `gh` invocation that ERRORS (auth, rate limit, network) is degradation, not a zero
result: skip with the failure note rather than reporting a missing PR. The tail NEVER opens
a replacement in any outcome — the archive seam flips and records, it does not create. The tail then: commits the archive's OWN WRITES —
an ENUMERATED FILE LIST, never `git add -A` and never a SHARED directory prefix: the exact
capability spec files this archive's sync REPORTED as changed (not the `orbit/specs/`
directory — staging the directory would sweep dirty edits to capabilities this archive never
synced, contradicting the unrelated-paths guarantee one step before READY), the DELETION the
move produced at the pre-move path `orbit/changes/<change-name>/`, and the explicit list of
at-archive-note edits the flow itself made — COMMITTED IN ISOLATION (`git commit --only <the
enumerated paths>`), because an enumerated `git add` does not restrict a plain `git commit`,
which commits the whole index and would carry any PRE-STAGED unrelated entry;
unrelated dirty paths are left unstaged (and unrelated pre-staged entries left staged), each
named in a one-line note, so a session's stray edits can never ride into a PR about to be
flipped READY.

Staging the DELETION is not optional bookkeeping: the archive move is a FILESYSTEM move (the
engine performs no git operation — see `orbit-pr-lifecycle`'s zero-engine-git requirement), so
git observes a deletion at the old path and an addition at the new one as two independent
facts. Staging only the addition produces a pushed commit containing the change tree TWICE,
with the deletion left dirty in the very tree the flip is about to announce as READY. Propose
carries the symmetric clause for `orbit/explore/<change-name>/`; archive needs its own. The
change's `.openspec.yaml` requires no separate entry — post-move it lives INSIDE the archived
tree and is covered by the whole-tree staging below, while its pre-move path is covered by the
deletion.

The MOVED ARCHIVE DIRECTORY `orbit/changes/archive/<YYYY-MM-DD>-<name>/` is the ONE path
staged as a whole, and this is a BOUNDED, PRINCIPLED EXCEPTION rather than a lapse in the
rule: unlike `orbit/specs/`, that directory is NAMED AND CREATED BY THIS ARCHIVE in this same
invocation (the `<YYYY-MM-DD>-` prefix is applied by the move step) and its contents are, by
construction, exactly ONE change's material — the tree that was `orbit/changes/<name>/` a
moment earlier. There is no other change's work it could sweep, which is the hazard the
enumerated-list rule exists to prevent. UNTRACKED content the move carried along (a scratch
file left in the change directory during the work) IS staged, because it is that change's own
material being archived alongside it, and it is NAMED in the same one-line note so a stray
file is visible in the record rather than silent → push → rewrite the PR description to the ACHIEVEMENT landmark
(per-change PRs) or APPEND the stage entry (program PRs) → flip READY for PER-CHANGE PRs only.

The program stage entry's SOURCE is ORDERED, never assumed: (1) the arc STATUS-LOG entry
written at this same archive, when one was written — the write-once-publish-twice case the
per-architecture design intends; (2) otherwise the archive EMIT's `final_assessment` plus
the change name and date, composed into the same entry shape. The fallback is not an edge
case: a status log is a CONVENTION of this repo's arc doc, not a requirement of the
architecture grammar (which mandates only `### Stage <id>` headings), so an adopter's
program doc may legitimately have none — and even here the log entry is an at-archive note
the flow may not have reached. The tail SHALL NOT block, prompt, or invent narrative when
source (1) is absent; it composes from (2) and notes which source it used in one line. Program PRs are APPENDED
and never flipped by the tail: arc-done is later than any archive, and its flip is the
human's act, surfaced by ANY architect invocation that observes arc-done — never tied to the
completion-ratification interaction (per `orbit-pr-lifecycle`). ORDERING INVARIANT: the
flip fires only AFTER the archive commit is pushed — the PR must contain its own archive
commit before READY is honest. BULK-ARCHIVE IS OUT OF THIS TAIL'S SCOPE. `/orbit:bulk-archive` archives SEVERAL changes in
one invocation, and the tail is inherently single-branch: HEAD can be on only one branch, so
under `per-proposal` — where every attached change has its own — the HEAD precondition would
skip all but at most one change, and which one would depend on the incidental fact of where
the user was standing. Rather than let outward behavior fall out of that accident, bulk-archive
performs NO tail: each change is synced, moved, and emitted exactly as pre-capability, and its
PR is left DRAFT for the user to flip when they choose. The bulk-archive completion readout
SHALL NAME the attached changes it left unflipped, with their PR URLs — reporting, never
acting, per `orbit-conventions`' residual outward-actions rule — so a batch never silently
strands a PR. Single-change `/orbit:archive` is the seam that flips.

SCOPE: THE ATTACHMENT DECIDES, NOT THE LIVE CONFIG. The tail runs whenever a
`pr_attachment` resolves for this change, whatever `pr:` reads at archive time; UNATTACHED
changes — including every change proposed under `pr: never`, and every change whose propose
degraded for want of a remote or `gh` — end exactly as pre-capability (readout; commits stay
the user's affair). This is the SAME freeze-at-commitment rule the citation carries one
requirement earlier: config selects the regime at the ATTACHING invocation, and every later
seam follows the frozen record rather than re-reading the key. Setting `pr: never` therefore
stops NEW attachments; it does not abandon a PR already open, because a draft PR that never
closes is a worse artifact than outward writes continuing under a key changed mid-flight —
the first is invisible, the second is legible in the PR itself. A user who means to abandon
an open PR closes it, and the tail's discovery then finds nothing and skips with its note. Tail-step failures SKIP the remaining tail steps with a note naming the
completed and skipped steps — the archive itself (sync, move, emit) has already succeeded
and never rolls back or blocks (apply-parity flavor). Every step is inside this contract,
INCLUDING staging and commit failures; none is left to generic error handling.

Because the change has already MOVED and the emit is written, `/orbit:archive` is NOT a
retry path — re-invoking it finds no active change. Recovery is manual by design (the same
v1 stance propose takes), so the note SHALL name the exact repository-qualified commands
that finish the interrupted work, keyed to WHICH step failed, and state the consequence of
stopping there:

- **Staging or commit failed** — nothing is committed. The note names the enumerated paths
  and the `git add <paths> && git commit --only <paths>` form — the ISOLATED commit, so a
  manual recovery preserves the pre-staged-entries guarantee exactly as the automatic path
  does (a plain `git commit` here would publish the whole index); consequence: the archive's
  writes are present but uncommitted, and the PR is untouched.
- **Push failed** — a local archive commit exists. The note names
  `git push <resolved-remote> <branch>`; consequence: the PR does not yet contain its own
  archive commit, and READY would be dishonest, which is why the ordering invariant already
  forbids the flip here.
- **Description rewrite (per-change) OR stage-entry append (program) failed** — commit and
  push landed. The note names `gh pr edit <url> --body-file <path>` with the composed body
  written to a temp file, the same recovery on both paths; consequence differs by path — a
  per-change PR is current in CODE but its description is the stale intent narrative, while
  a program PR is current in code but its body LACKS THIS STAGE'S ENTRY.
- **READY flip failed** (per-change only — the program path never flips at this seam, so
  this state cannot arise there) — everything but the flip landed. The note names
  `gh pr ready --repo <owner>/<repo> <number>`; consequence: the PR is complete and
  accurate but still DRAFT, which is a safe resting state and never a correctness problem.

Each command is repository-qualified per `orbit-pr-lifecycle`'s resolution requirement, so
text the user copies resolves the same repository the algorithm chose. The tail's outward writes ride the
archive's OWN entry consent (user-typed or prompted-and-proceeded) — no second prompt
inside the tail.

#### Scenario: The tail completes the effort

- **WHEN** a user-typed archive of a PR-attached uncited change completes its emit
- **THEN** the flow continues commit → push → achievement rewrite → `gh pr ready` with no
  further prompts, and the completion readout names the READY PR

#### Scenario: Bulk-archive runs no tail and names what it left draft

- **WHEN** `/orbit:bulk-archive` archives a batch that includes PR-attached changes
- **THEN** each change is synced, moved, and emitted exactly as pre-capability with NO commit, push, description rewrite, or flip; the completion readout NAMES the attached changes left unflipped with their PR URLs; and the per-change consent preview omits the outward-writes line because none will occur

#### Scenario: Config flipped to never after propose does not abandon the PR

- **WHEN** a change proposed under `pr: per-proposal` is archived after `pr:` has been set to `never`
- **THEN** the tail RUNS on the frozen `pr_attachment` — the live config is not consulted at this seam — and a change proposed under `pr: never` (no attachment) ends exactly as pre-capability

#### Scenario: Already-READY PR is reported, not re-flipped

- **WHEN** the preflight observes the PR is already READY (flipped by the USER at an earlier point — including at a prior program's arc-done, for a program PR adopted afterward; never by a stage)
- **THEN** the emit records `pr_state: "ready"` truthfully; the tail commits, pushes, and rewrites the description as usual, and the flip step is a no-op reported in one line — never an error and never a second `gh pr ready`

#### Scenario: gh absent at archive skips before staging

- **WHEN** the change was attached at propose (when `gh` was available) but `gh` is absent at archive
- **THEN** the tail skips ENTIRELY before any staging, commit, or push, with a one-line note — the archive ends exactly as pre-capability, never committed-and-pushed-then-failed

#### Scenario: HEAD on the wrong branch skips before staging

- **WHEN** the tail runs while HEAD is on the default branch (or any branch other than `pr_attachment.branch`)
- **THEN** nothing is staged, committed, pushed, or flipped; one note names both branches and the recovery text for THAT case — `git switch` for a local branch, fetch-and-track for a remote-only one, and a plain statement that no switch recovers a branch absent everywhere; the working tree is never checked out or stashed, and the completed archive is not rolled back

#### Scenario: Stored URL pointing at a closed PR is caught before it is edited

- **WHEN** the tail runs on a change whose recorded PR was closed (or merged, or retargeted to a different base) after propose
- **THEN** live validation of the stored URL fails with that SPECIFIC reason; the description rewrite and the READY flip are skipped and named, while the archive commit and push still land on the change's branch — the closed PR is never rewritten and the fallback query is not run as a second chance

#### Scenario: An unattached change never reaches discovery

- **WHEN** a change created via `/orbit:new` + `/orbit:continue` (which produce no `pr_attachment`) is archived while an open PR happens to exist for a branch of the same name
- **THEN** the PR path TERMINATES before any remote or `gh` work — no discovery query runs, nothing is committed, pushed, rewritten, or flipped — matching the consent preview that omitted the outward-writes line for this unattached change

#### Scenario: PR discovery finds nothing

- **WHEN** the tail runs on a change whose attachment EXISTS but carries no `url` (branch work succeeded, PR creation failed), and the constrained query returns no open PR into the resolved base
- **THEN** the tail skips with a one-line note naming the miss; no replacement PR is opened. (A change with NO attachment never reaches this point — absence terminates the PR path — and a record carrying a `url` whose PR was closed is answered by live validation, not by this query.)

#### Scenario: Discovery fallback constrains on all four axes

- **WHEN** the fallback query runs for a branch that has an open PR into the resolved default branch, a closed PR from an earlier attempt, and an open PR into a different base
- **THEN** repo + head + `--state open` + resolved-base filtering leaves exactly one candidate and the tail proceeds against it; the closed and wrong-base PRs are never touched

#### Scenario: Ambiguous discovery skips rather than guesses

- **WHEN** the constrained query still yields more than one open PR from this branch into the resolved base
- **THEN** the tail SKIPS with a one-line note naming the ambiguity and listing the candidate URLs; no PR is rewritten and none is flipped — recency and PR number are never used as tie-breaks

#### Scenario: A failing gh query is degradation, not a miss

- **WHEN** the fallback `gh pr list` invocation errors (auth, rate limit, network)
- **THEN** the tail skips with the FAILURE note rather than reporting a missing PR, and the archive itself remains complete

#### Scenario: The move's deletion is staged with its addition

- **WHEN** the tail commits after the archive move relocated `orbit/changes/<name>/` to the dated archive path
- **THEN** BOTH the deletion at the pre-move path and the addition at the archive path are staged, so the pushed commit records a move rather than a duplicated tree with a dirty deletion left behind

#### Scenario: The moved archive tree stages whole; strays are named

- **WHEN** the change directory being archived contained an untracked scratch file the change's work left there
- **THEN** the moved `orbit/changes/archive/<YYYY-MM-DD>-<name>/` is staged as a unit (it is orbit-created in this invocation and holds one change's material by construction), the carried-along file is staged with it, and the one-line note NAMES it — while `orbit/specs/` is still never staged as a prefix

#### Scenario: Unrelated dirty paths never ride the commit

- **WHEN** the session left unrelated tracked edits dirty at the archive tail — INCLUDING a dirty file inside `orbit/specs/` belonging to a capability this archive's sync did not touch — OR left unrelated entries already STAGED in the index
- **THEN** only the archive's enumerated own-write FILES are committed (`git commit --only`); the unrelated paths (inside `orbit/specs/` or anywhere else) remain in whatever state they were — unstaged stays unstaged, staged stays staged — and are named in a one-line note

#### Scenario: Ordering invariant

- **WHEN** the tail runs
- **THEN** `gh pr ready` is invoked only after the push of the archive commit succeeds —
  never before

#### Scenario: Each partial state names its own completion command

- **WHEN** the tail fails at staging/commit, at push, at the description rewrite, or at the flip
- **THEN** the note names the completing command for THAT step — `git add`+`commit`, `git push <resolved-remote> <branch>`, `gh pr edit <url> --body-file <path>`, or `gh pr ready --repo <owner>/<repo> <number>` — and states that step's consequence; `/orbit:archive` is never offered as a retry, since the change has already moved

#### Scenario: Push failure degrades, archive stands

- **WHEN** the tail's push is rejected (e.g. remote diverged)
- **THEN** the archive (sync, move, emit) remains complete; the tail reports the failure
  and the skipped steps (description rewrite, flip) in one line; nothing rolls back

#### Scenario: Program-mode stage archive appends only

- **WHEN** a citing change archives mid-arc
- **THEN** the tail commits, pushes, and appends the stage entry to the program PR body —
  and does NOT flip READY

#### Scenario: Stage entry falls back when no status log exists

- **WHEN** a citing change archives against a program doc whose architecture doc carries no status log (or where no log entry was written at this archive)
- **THEN** the stage entry is composed from the archive emit's `final_assessment` plus the change name and date, in the same entry shape; one line names the source used, and the tail neither blocks nor prompts
