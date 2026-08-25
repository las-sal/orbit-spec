# orbit-archive-modifications Delta

## ADDED Requirements

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
have been flipped by an earlier stage. That is a NORMAL observation, not an anomaly: the
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
  than printing a command that will fail. It NEVER checks out, stashes, or
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
that fails validation SKIPS the description rewrite and the READY flip with a one-line note
naming the SPECIFIC reason — `closed`, `merged`, `retargeted to <base>`, `repository
mismatch`, or `not found` — each distinct, never collapsed into a generic miss. The COMMIT
and PUSH still proceed: those writes are the archive's own, they land on the change's branch
via the resolved remote, and they are correct whatever became of the pull request. The PR
layer degrades without taking the lifecycle's own bookkeeping down with it — the same
principle as `pr: never`, applied one level finer. (A failed validation never triggers the
fallback query as a second chance: a record that resolves to a closed PR is ANSWERED, not
missing.)

When the object is absent, or present without a
`url`, fall back to `gh pr list` — but the fallback SHALL identify EXACTLY ONE PR before
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
an ENUMERATED FILE LIST, never `git add -A` and never a SHARED directory prefix: the exact
capability spec files this archive's sync REPORTED as changed (not the `orbit/specs/`
directory — staging the directory would sweep dirty edits to capabilities this archive never
synced, contradicting the unrelated-paths guarantee one step before READY), the change's
`.openspec.yaml`, and the explicit list of at-archive-note edits the flow itself made;
unrelated dirty paths are left unstaged and named in a one-line note, so a session's stray
edits can never ride into a PR about to be flipped READY.

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
human's act surfaced at the architect ratification (per `orbit-pr-lifecycle`). ORDERING INVARIANT: the
flip fires only AFTER the archive commit is pushed — the PR must contain its own archive
commit before READY is honest. SCOPE: THE ATTACHMENT DECIDES, NOT THE LIVE CONFIG. The tail runs whenever a
`pr_attachment` resolves for this change, whatever `pr:` reads at archive time; UNATTACHED
changes — including every change proposed under `pr: never`, and every change whose propose
degraded for want of a remote or `gh` — end exactly as pre-capability (readout; commits stay
the user's affair). This is the SAME freeze-at-commitment rule the citation carries one
requirement earlier: config selects the regime at the ATTACHING invocation, and every later
seam follows the frozen record rather than re-reading the key. Setting `pr: never` therefore
stops NEW attachments; it does not abandon a PR already open, because a draft PR that never
closes is a worse artifact than outward writes continuing under a key changed mid-flight —
the first is invisible, the second is legible in the PR itself. A user who means to abandon
an open PR closes it, and the tail's discovery then finds nothing and skips with its note. Tail-step failures
(push rejected, `gh` errors) SKIP the remaining tail steps with a one-line note naming the
completed and skipped steps — the archive itself (sync, move, emit) has already succeeded
and never rolls back or blocks (apply-parity flavor). The tail's outward writes ride the
archive's OWN entry consent (user-typed or prompted-and-proceeded) — no second prompt
inside the tail.

#### Scenario: The tail completes the effort

- **WHEN** a user-typed archive of a PR-attached uncited change completes its emit
- **THEN** the flow continues commit → push → achievement rewrite → `gh pr ready` with no
  further prompts, and the completion readout names the READY PR

#### Scenario: Config flipped to never after propose does not abandon the PR

- **WHEN** a change proposed under `pr: per-proposal` is archived after `pr:` has been set to `never`
- **THEN** the tail RUNS on the frozen `pr_attachment` — the live config is not consulted at this seam — and a change proposed under `pr: never` (no attachment) ends exactly as pre-capability

#### Scenario: Already-READY PR is reported, not re-flipped

- **WHEN** the preflight observes the PR is already READY (flipped by the user, or by an earlier stage of an adopted program PR)
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

#### Scenario: The moved archive tree stages whole; strays are named

- **WHEN** the change directory being archived contained an untracked scratch file the change's work left there
- **THEN** the moved `orbit/changes/archive/<YYYY-MM-DD>-<name>/` is staged as a unit (it is orbit-created in this invocation and holds one change's material by construction), the carried-along file is staged with it, and the one-line note NAMES it — while `orbit/specs/` is still never staged as a prefix

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
pre-capability prompt is unchanged wherever no PR exists. The preview REPORTS what the tail
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
- **THEN** the archive run summary additionally includes `pr_url` and `pr_state` — the PR's URL and its state AS OBSERVED by the read-only preflight that precedes the emit — normally `"draft"`, but truthfully `"ready"` when the PR was already flipped (by the user, or by an earlier stage of an adopted program PR), and ELIDED when the state could not be observed. The field records what was seen, never a forward-looking claim about the flip this tail is about to perform. Both fields are absent for UNATTACHED changes — including changes originally proposed under `pr: never` — and present whenever an attachment resolves, EVEN IF `pr:` now reads `never`, per this capability's attachment-authority scope rule (the same invocation that runs the tail records its PR). The READY transition is evidenced by the PR itself and the completion readout, not by this record.
