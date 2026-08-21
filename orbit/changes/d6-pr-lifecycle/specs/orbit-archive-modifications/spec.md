# orbit-archive-modifications Delta

## ADDED Requirements

### Requirement: PR-attached archive tail

The archive flow SHALL, for a PR-ATTACHED change, continue past the archive emit as one
designed tail. ATTACHMENT AND PR IDENTITY are DISCOVERED, never assumed: read the
`pr_attachment` object from the change's own trail — the LATEST attachment-bearing PROPOSE
**or FF** emit (both are equally authoritative; `/orbit:ff` carries the identical
choreography per `orbit-pr-lifecycle`'s entry-points requirement, so a tail that reads only
propose emits loses every ff-started change's attachment). That object supplies BOTH facts
the tail needs: `granularity` decides whether this seam flips READY (per-proposal) or
appends only (per-architecture), and `branch` names what to commit to — neither is
re-derived from config or the citation. When the object is absent, or present without a
`url`, fall back to `gh pr list` — but the fallback SHALL identify EXACTLY ONE PR before
acting, because a head branch does not uniquely identify a pull request. The query is
CONSTRAINED on all four axes and every one is required: the RESOLVED REMOTE's repository
(`--repo`, so a fork's PRs are never mistaken for this repo's), the `--head <branch>` from
the attachment or the mechanical name, `--state open` (a closed or merged PR is not a
flip target), and the RESOLVED BASE — candidates whose base is not the resolved default
branch are DISCARDED, since a PR from this branch into some other branch is a different
effort. THREE outcomes, each a DISTINCT one-line note, none of them silent:

- **Exactly one survivor** — the tail proceeds against it.
- **Zero survivors** (closed manually, branch renamed, change created without propose, or
  every candidate filtered out) — SKIP with a note naming the miss.
- **More than one survivor** — SKIP with a note naming the AMBIGUITY and listing the
  candidate URLs. orbit never picks by recency or number: rewriting the wrong PR's
  description and flipping it READY is worse than doing nothing, and the user is present
  by construction (per `orbit-pr-lifecycle`'s operating-assumption requirement) to say
  which one is meant.

A `gh` invocation that ERRORS (auth, rate limit, network) is degradation, not a zero
result: skip with the failure note rather than reporting a missing PR. The tail NEVER opens
a replacement in any outcome — the archive seam flips and records, it does not create. The tail then: commits the archive's OWN WRITES —
an ENUMERATED FILE LIST, never a directory prefix and never `git add -A`: the exact
capability spec files this archive's sync REPORTED as changed (not the `orbit/specs/`
directory — staging the directory would sweep dirty edits to capabilities this archive never
synced, contradicting the unrelated-paths guarantee one step before READY), the exact moved
`orbit/changes/archive/<YYYY-MM-DD>-<name>/`, the change's `.openspec.yaml`, and the
explicit list of at-archive-note edits the flow itself made; unrelated dirty paths are
left unstaged and named in a one-line note, so a session's stray edits can never ride into
a PR about to be flipped READY → push → rewrite the PR description to the ACHIEVEMENT landmark
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

- **WHEN** the tail runs on a change whose PR was closed manually (no attachment on any propose/ff emit resolves, and the constrained `gh pr list` query returns no open PR into the resolved base)
- **THEN** the tail skips with a one-line note naming the miss; no replacement PR is opened

#### Scenario: Discovery fallback constrains on all four axes

- **WHEN** the fallback query runs for a branch that has an open PR into the resolved default branch, a closed PR from an earlier attempt, and an open PR into a different base
- **THEN** repo + head + `--state open` + resolved-base filtering leaves exactly one candidate and the tail proceeds against it; the closed and wrong-base PRs are never touched

#### Scenario: Ambiguous discovery skips rather than guesses

- **WHEN** the constrained query still yields more than one open PR from this branch into the resolved base
- **THEN** the tail SKIPS with a one-line note naming the ambiguity and listing the candidate URLs; no PR is rewritten and none is flipped — recency and PR number are never used as tie-breaks

#### Scenario: A failing gh query is degradation, not a miss

- **WHEN** the fallback `gh pr list` invocation errors (auth, rate limit, network)
- **THEN** the tail skips with the FAILURE note rather than reporting a missing PR, and the archive itself remains complete

#### Scenario: Unrelated dirty paths never ride the commit

- **WHEN** the session left unrelated tracked edits dirty at the archive tail — INCLUDING a dirty file inside `orbit/specs/` belonging to a capability this archive's sync did not touch
- **THEN** only the archive's enumerated own-write FILES are staged and committed; the unrelated paths (inside `orbit/specs/` or anywhere else) remain unstaged and are named in a one-line note

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

#### Scenario: Stage entry falls back when no status log exists

- **WHEN** a citing change archives against a program doc whose architecture doc carries no status log (or where no log entry was written at this archive)
- **THEN** the stage entry is composed from the archive emit's `final_assessment` plus the change name and date, in the same entry shape; one line names the source used, and the tail neither blocks nor prompts

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
