## MODIFIED Requirements

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
MAY fire in one archive invocation (gate first, then fingerprints, then audit).

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
pre-capability prompt is unchanged wherever no PR exists. The preview REPORTS what the tail
will attempt; a tail that later degrades (no remote, `gh` failure, HEAD mismatch) still
skips with its own note — the preview is not a promise that every step succeeds. A
user-typed `/orbit:archive` runs with no consent prompt. Proceeding records
`consent: "prompted"` in the archive run summary; an abort writes no summary. A granted arrival
fires no consent prompt and records `consent: "setting"`: no preview is shown, so the outward writes
the tail rides on this entry are named instead in the `archive` key's row of `orbit-engine-gates`'
`The chain setting grants each command on its own key`, which the user reads before granting it, and
the tail runs exactly as it would after a Proceed. Named limit: a granted archive whose HEAD is not on the
attachment's branch is told so only by the one line the entry observation prints before Step 1, and nobody is
asked; the sync, the move and the emit land in the working tree as on a typed archive, the tail's HEAD
precondition skips the commit and the push, and its note names the recovery. Nothing is pushed to the wrong
branch, but the archive's writes stay uncommitted until the user carries them to the attachment's branch.

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

- **WHEN** the archive of a change attached to a per-change PR is reached because the change status's
  `chain` object allowed `/orbit:archive <change> — user-invoked`, granted by `chain.archive`, and the
  tail's preflight and push succeed
- **THEN** no consent prompt fires, the anomaly prompts fire as on a typed arrival, the run summary
  records `consent: "setting"`, and the tail commits, pushes, rewrites the description and flips the
  PR to ready with no prompt of its own

#### Scenario: A granted entry on a program PR appends and leaves the flip

- **WHEN** the archive of a change attached to a program PR is reached because the change status's
  `chain` object allowed it, granted by `chain.archive`, and the tail's preflight and push succeed
- **THEN** no consent prompt fires, the run summary records `consent: "setting"`, and the tail commits,
  pushes and appends the change's stage entry to the program PR and runs no ready flip: the PR keeps the
  draft or ready state the preflight observed, and its flip remains the user's

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
file is visible in the record rather than silent. The change's SAVED BRIEFS are the one
exception: a `brief-<TS>.md` in the trail's `brief/` folder is the archive's OWN WRITE,
saved before the sync and so carried by the move (`The archive saves the change's brief before
the sync`); like the archive emit, the archive's own write after the move, it is staged with the
tree and NOT named, so a default archive's note names exactly the strays it named before the
brief existed. After the commit: push → rewrite the PR description to the ACHIEVEMENT landmark
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
commit before READY is honest.

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
archive's OWN entry consent (user-typed, prompted-and-proceeded, or granted by the `archive` key, whose row names
these writes) — no second prompt
inside the tail.

#### Scenario: The tail completes the effort

- **WHEN** a user-typed archive of a PR-attached uncited change completes its emit
- **THEN** the flow continues commit → push → achievement rewrite → `gh pr ready` with no
  further prompts, and the completion readout names the READY PR

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

#### Scenario: A saved brief is staged and not named as a stray

- **WHEN** the tail commits a change whose trail holds the `brief/brief-<TS>.md` the archive saved before its sync, and
  no other untracked file
- **THEN** the brief is staged with the archived tree, and the one-line note names no carried untracked file

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
`user_validation_tasks` check uses, and REFUSE every case of the production below, naming the task
or line. The production is the ONE statement of the refusals:

```
DEFERRAL REFUSALS — the archive write gate refuses each, naming the task or line, and Step 3.2 checks each before the move:
1 an unchecked task carrying the (User-validation marker, with no deferral naming it
2 a marked unchecked task with no task id, which no deferral can key
3 a marked unchecked line the reader places in no ## task group, found by a fence-aware line scan the reader's set lacks
4 a deferral naming a checked task, an unchecked task without the marker, or no task
5 a second deferral naming one task
6 a deferral whose why, when or where is missing, not a string, or empty
7 a deferral carrying a key other than task, why, when and where
8 a marked unchecked task whose task id another task line also carries, checked or not, naming both lines
A missing tasks.md is an empty marked set; any other failure to read it is refused, naming the error. An empty deferred_validations array is accepted and written as absent.
```

The engine checks the id set, never whether the prose is true (R-crc-10). The completion readout
SHALL print one line per deferral.

Step 3.2 SHALL check each case of that production against the composed deferrals BEFORE the move,
so a predictable refusal surfaces while the change is still active: a marked task with no id, in no
group or with a duplicated id, or an unreadable tasks file, is reported to the user, who repairs
`tasks.md` before the archive proceeds, or aborts.
No engine surface runs the write gate before the move, so the archive skill carries the production
as a CHECKED MIRROR in its `references/user-validation.md`, held byte-equal to this fence by a parity test (R-crc-14's
mirror corollary). The archive body carries the step's BASIC CONTENT (`reduce-orbit-phase1`'s R-rop-3): when it runs,
what it does in one sentence, the "says nothing" case when no marked task is unchecked, and the recovery after the
move; and it tells the agent, when `tasks.md` holds an unchecked task carrying the marker, to read
`references/user-validation.md` and follow it. That reference carries the two dispositions, the check of the production
before the move, the report-to-the-user cases and the brief. When the emit
still refuses after the move, the archive SHALL repair the payload and re-run `orbit emit archive`
against the archived directory, never repeating the sync or the move.

A task whose assertion is about state that exists only after this step — the baseline after sync,
the archived directory, or the archive emit — is DEFERRED at this step: the step precedes the sync
and the move.

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

#### Scenario: A task id two task lines carry is refused

- **WHEN** `tasks.md` holds a checked `- [x] 1.1 (User-validation) …` and an unchecked
  `- [ ] 1.1 (User-validation) …`, or two unchecked marked tasks both numbered `1.1`
- **THEN** `orbit emit archive` refuses, naming the id and both lines, whatever the deferrals say

#### Scenario: Step 3 no longer asks about validation tasks

- **WHEN** the only unchecked tasks at archive carry the `(User-validation` marker
- **THEN** upstream Step 3's incomplete-tasks prompt does not fire, and Step 3.2 briefs each task
  instead

#### Scenario: The archive body reads the user-validation reference only when a marked task is unchecked

- **WHEN** the archive skill is generated
- **THEN** its Step 3.2 basic content says nothing when no marked task is unchecked, names
  `references/user-validation.md` for the case where one is, and a parity test finds the DEFERRAL REFUSALS
  production in that reference byte-equal to this requirement's fence, and not in the body

### Requirement: The archive saves the change's brief before the sync

The archive workflow SHALL save the change's brief (`orbit-program-brief`'s `A change's brief is saved, never
overwritten`) under every setting, at a step after the pre-archive audit sweep and its prompt and BEFORE the sync
assessment (upstream Step 4), by running `orbit brief --change <name> --save` while the change is still active, so the
copy is written into the change's own history and moves with it. The step sits there because a sign-off given per
change (`The archive holds for a per-change sign-off`, the step that follows it) waits before anything is synced or
moved, and must cite a copy that already exists; the copy is therefore rendered before the
archive record exists (`orbit-program-brief`'s `A brief says only what the archive recorded`).

| the save | the archive |
|---|---|
| succeeds | says nothing about it and goes on |
| exits non-zero (the brief cannot be rendered whole, or a racing writer took its name) | composes ONE `warnings` entry naming the failure as the command reported it, for the Step 5.5 run summary, says nothing about it in chat, and goes on to the hold: under every sign-off setting but `change` a brief that cannot be saved never stops an archive; under `change` the hold stops it, since there is no copy to sign (`The archive holds for a per-change sign-off`) |
| ran, and the archive then stops (an abort or a cancel at a later prompt) | the copy stays in the active change's history; the next archive saves a new one, and the latest is the change's brief |

The rows are the save's two outcomes (written, or refused whole) and the one way an archive can end after it without
completing (it stops before the sync and the move).

With every setting at its default, nothing the user sees or is asked changes: the save is a record (`automate-dev-flow`'s
R-adf-9), the tail does not name it (`PR-attached archive tail`), and a failure is recorded, never shown. The archive
body carries the step's BASIC CONTENT (`reduce-orbit-phase1`'s R-rop-3) — the command and the table's first row, a
save that succeeds being said nothing about — and tells the agent, when the save exits non-zero, to read
`references/brief-save.md` and follow it from the result it already has; that reference carries the table and the
sentence on its rows. An installed skill needs no spec to run the step; a test holds the body's basic content and the
reference carrying the table.

#### Scenario: A default archive saves the brief before the sync

- **WHEN** `/orbit:archive foo` runs with every setting at its default, and `foo`'s delta spec adds a requirement
- **THEN** the archived change's `.orbit-runs/brief/` holds one `brief-<TS>.md` whose requirements section says no
  archive has recorded a sync yet, and the completion readout is what it was before the save existed

#### Scenario: A failed save is recorded, not shown, and the archive completes

- **WHEN** with the sign-off setting not `change`, the save step's `orbit brief --change foo --save` exits non-zero naming
  an unreadable record
- **THEN** the archive syncs, moves and writes its run summary, whose `warnings` carries one entry naming the failure,
  and nothing about the brief is shown

#### Scenario: A stopped archive leaves its copy, and the next saves another

- **WHEN** the brief is saved and the user then cancels at the sync prompt, and later archives `foo` again
- **THEN** the first copy stays in `foo`'s history, the second archive saves a second copy, and the latest is `foo`'s
  brief

#### Scenario: The archive body's basic content handles a save that succeeds

- **WHEN** the archive skill is generated
- **THEN** its Step 3.6 basic content carries `orbit brief --change "<name>" --save` and says nothing about a save that
  succeeds, names `references/brief-save.md` only for a save that exits non-zero, and that reference carries the table

#### Scenario: A failed save under `change` stops at the hold

- **WHEN** under `signoff: change` the save step's `orbit brief --change foo --save` exits non-zero naming an unreadable
  record
- **THEN** the archive stops before the sync, naming the failure and saying there is no copy to sign; nothing is synced
  or moved, and `foo` stays active

### Requirement: The archive holds for a per-change sign-off

The archive workflow SHALL, at a step directly after the brief's save (`The archive saves the change's brief before the
sync`) and BEFORE the sync assessment, read the hold by running `orbit brief --change <name> --hold --json`
(`orbit-program-brief`'s `A sign-off is recorded against the saved copy, and the hold reads it`) and act by the first row
of this table that matches (D-pb-14 in `program-brief`'s `explore.md`):

| the save and the hold | the archive |
|---|---|
| the hold command exits non-zero | stops before the sync, naming the error as the command reported it; nothing is synced or moved. With the setting off the hold reads no history, so this row is reached only on a usage error, which an archive body and the `orbit` it was generated with never produce |
| `why: "off"` | goes on, saying nothing about the hold; when the hold carries a warning, it states the warning in one line |
| the save exited non-zero, or `why: "no-copy"` | stops before the sync, naming the save's failure as the command reported it, or that no copy is saved, and saying there is no copy to sign; nothing is synced or moved, and the change stays active |
| `why: "signed"` | states in one line that the latest sign-off covers this copy's text, naming the record, and goes on |
| `why: "unsigned"` | shows the latest saved copy whole, then asks the user to sign off or decline; writes the answer by `orbit emit signoff --change <name>` with the copy's filename as `brief`, `answer`, and, on a decline, the user's reason as `reason` (asked for when the answer did not give one); it acts on the answer only once that emit has written the record: on `signed` it goes on; on `declined` it stops before the sync, says the change stays active and the user's reason is recorded, and asks nothing further: what happens next is the user's direction. When the emit is refused or fails, whatever the answer, it stops before the sync, naming the refusal: a signature that is not recorded lifts no hold |

The rows are the hold command's failure and the hold's four `why` values, the save's own failure joining `no-copy` (an
earlier copy may still be saved, but it is not the text this archive would sync); the `unsigned` row carries the write of
the answer, its success and its failure. An archive that stops at the hold writes no run summary, as an aborted archive writes none; the brief's saved
copy and any sign-off stay in the active change's history.

The question is a DECISION prompt (`orbit-conventions`' `A chain treats each prompt by its kind`): an archive the
`chain` object allowed asks it exactly as an archive the user typed, and the chain does not continue after it. The
consent prompt is unchanged: a granted arrival still records `consent: "setting"`, which a sign-off does not replace.

With every setting at its default, nothing the user sees or is asked changes: the hold reports `why: "off"` with no
warning and the archive goes on silently (`automate-dev-flow`'s R-adf-12). The archive body carries the step's BASIC
CONTENT (`reduce-orbit-phase1`'s R-rop-3) — the hold command and its `why: "off"` row — and tells the agent to read
`references/signoff-hold.md` and follow it, from the save's outcome and the result it already has, on any other result or a non-zero exit; that reference carries the command,
the table and the `orbit emit signoff` invocation with its fields, byte-equal to the step's text. An installed skill
needs no spec to run the step; a test holds the archive body's basic content and its reference file.

#### Scenario: A default archive reads the hold and asks nothing

- **WHEN** `/orbit:archive foo` runs with every setting at its default
- **THEN** the hold reports `why: "off"`, no sign-off is asked for, nothing about the hold is shown, and the archive
  completes as it did before the step existed

#### Scenario: A default archive is not stopped by an unreadable history

- **WHEN** `/orbit:archive foo` runs with every setting at its default, and `foo`'s `.orbit-runs/brief/` folder exists and
  cannot be listed
- **THEN** the hold reports `why: "off"` without reading the folder, and the archive goes on exactly as it would without
  the hold step

#### Scenario: Under `change`, the archive shows the copy and asks

- **WHEN** `/orbit:archive foo` runs under `signoff: change` and the hold reports `why: "unsigned"`
- **THEN** the latest saved copy is shown whole and the user is asked to sign off or decline before the sync assessment

#### Scenario: A signature lets the archive go on

- **WHEN** the user signs off at `foo`'s hold
- **THEN** a `signoff` record saying `signed` and naming the copy is written, and the archive goes on to the sync
  assessment

#### Scenario: A signature whose record is not written stops the archive

- **WHEN** the user signs off at `foo`'s hold and `orbit emit signoff --change foo` is refused
- **THEN** the archive stops before the sync naming the refusal, nothing is synced or moved, and `foo` stays active

#### Scenario: A decline stops the archive and keeps the change active

- **WHEN** the user declines at `foo`'s hold, giving a reason
- **THEN** a `signoff` record saying `declined` with that reason is written, nothing is synced or moved, no run summary
  is written, and `foo` stays under `orbit/changes/`

#### Scenario: A copy already signed is not asked again

- **WHEN** `foo`'s archive stopped at the sync prompt after a signature, and the next archive saves a copy with the same
  text
- **THEN** the hold reports `why: "signed"`, the archive states that in one line, and no sign-off is asked for

#### Scenario: An unrecognized value warns and goes on

- **WHEN** `/orbit:archive foo` runs under `signoff: weekly`
- **THEN** the archive states the hold's warning in one line, asks no sign-off, and completes

#### Scenario: A program sign-off holds no archive

- **WHEN** `/orbit:archive foo` runs under `signoff: program`
- **THEN** the hold reports `why: "off"` with no warning, no sign-off is asked for, nothing about the hold is shown, and
  the archive completes

#### Scenario: The archive body's basic content handles the default hold

- **WHEN** the archive skill is generated
- **THEN** its Step 3.7 basic content handles `why: "off"` itself and names `references/signoff-hold.md` only for the other
  results and a non-zero exit
