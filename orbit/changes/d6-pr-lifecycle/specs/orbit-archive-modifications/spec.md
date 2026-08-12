# orbit-archive-modifications Delta

## ADDED Requirements

### Requirement: PR-attached archive tail

The archive flow SHALL, for a PR-ATTACHED change, continue past the archive emit as one
designed tail. ATTACHMENT AND PR IDENTITY are DISCOVERED, never assumed: read `pr_url` from
the change's own propose emit on its trail (the authoritative record per
`orbit-pr-lifecycle`'s frozen-attachment rule); when absent, fall back to
`gh pr list --head <branch> --json url,isDraft`; when neither yields a PR under an active
`pr:` config (closed manually, branch renamed, change created without propose), the
tail SKIPS with a one-line note naming the miss and NEVER opens a replacement — the archive
seam flips and records, it does not create. The tail then: commits the archive's OWN WRITES —
an ENUMERATED path set (the synced baseline `orbit/specs/`, the moved
`orbit/changes/archive/<YYYY-MM-DD>-<name>/`, the change's `.openspec.yaml`, and any
at-archive-note edits the flow itself made), never `git add -A`; unrelated dirty paths are
left unstaged and named in a one-line note, so a session's stray edits can never ride into
a PR about to be flipped READY → push → rewrite the PR description to the ACHIEVEMENT landmark
(per-change PRs) or APPEND the stage entry (program PRs; adapted from the arc status-log
entry written at this seam) → flip READY for PER-CHANGE PRs only. Program PRs are APPENDED
and never flipped by the tail: arc-done is later than any archive, and its flip is the
human's act surfaced at the architect ratification (per `orbit-pr-lifecycle`). ORDERING INVARIANT: the
flip fires only AFTER the archive commit is pushed — the PR must contain its own archive
commit before READY is honest. SCOPE: this tail exists ONLY for
PR-attached changes — with `pr: never`, no remote, or no `gh`, the archive flow ends
exactly as pre-capability (readout; commits stay the user's affair). Tail-step failures
(push rejected, `gh` errors) SKIP the remaining tail steps with a one-line note naming the
completed and skipped steps — the archive itself (sync, move, emit) has already succeeded
and never rolls back or blocks (apply-parity flavor). The tail's outward writes ride the
archive's OWN entry consent (user-typed or prompted-and-proceeded) — no second prompt
inside the tail.

#### Scenario: The tail completes the effort

- **WHEN** a user-typed archive of a PR-attached uncited change completes its emit
- **THEN** the flow continues commit → push → achievement rewrite → `gh pr ready` with no
  further prompts, and the completion readout names the READY PR

#### Scenario: PR discovery finds nothing

- **WHEN** the tail runs on a change whose PR was closed manually (no `pr_url` on the propose emit resolves, and `gh pr list --head` returns none)
- **THEN** the tail skips with a one-line note naming the miss; no replacement PR is opened

#### Scenario: Unrelated dirty paths never ride the commit

- **WHEN** the session left unrelated tracked edits dirty at the archive tail
- **THEN** only the archive's enumerated own-writes are staged and committed; the unrelated paths remain unstaged and are named in a one-line note

#### Scenario: Ordering invariant

- **WHEN** the tail runs
- **THEN** `gh pr ready` is invoked only after the push of the archive commit succeeds —
  never before

#### Scenario: Push failure degrades, archive stands

- **WHEN** the tail's push is rejected (e.g. remote diverged)
- **THEN** the archive (sync, move, emit) remains complete; the tail reports the failure
  and the skipped steps (description rewrite, flip) in one line; nothing rolls back

#### Scenario: Program-mode stage archive appends only

- **WHEN** a citing change archives mid-arc
- **THEN** the tail commits, pushes, and appends the stage entry to the program PR body —
  and does NOT flip READY

## MODIFIED Requirements

### Requirement: Archive run summary written

The system SHALL write a JSON summary to `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/.orbit-runs/archive-<TS>.json` after a successful archive (the `<YYYY-MM-DD>-` prefix is added by upstream's archive move step).

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
- **THEN** the archive run summary additionally includes `pr_url` and `pr_state` — the PR's URL and its state AS OBSERVED AT EMIT TIME, which precedes the PR-attached tail, so `pr_state` is `"draft"` (or elided); it is NEVER `"ready"`, because the tail's flip has not happened when the emit is written. Both fields are absent for unattached changes and when `pr: never`. The READY transition is evidenced by the PR itself and the completion readout, not by this record.
