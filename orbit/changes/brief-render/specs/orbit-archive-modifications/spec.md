## ADDED Requirements

### Requirement: The archive saves the change's brief before the sync

The archive workflow SHALL save the change's brief (`orbit-program-brief`'s `A change's brief is saved, never
overwritten`) under every setting, at a step after the pre-archive audit sweep and its prompt and BEFORE the sync
assessment (upstream Step 4), by running `orbit brief --change <name> --save` while the change is still active, so the
copy is written into the change's own history and moves with it. The step sits there because a sign-off given per
change (stage program-brief's third change, D-pb-1 and D-pb-8 in `orbit/explore/program-brief/explore.md`) waits
before anything is synced or moved, and must cite a copy that already exists; the copy is therefore rendered before the
archive record exists (`orbit-program-brief`'s `A brief rendered before its change's archive record says what it
cannot yet show`).

| the save | the archive |
|---|---|
| succeeds | says nothing about it and goes on |
| exits non-zero (the brief cannot be rendered whole, or the name is taken) | composes ONE `warnings` entry naming the failure as the command reported it, for the Step 5.5 run summary, says nothing about it in chat, and goes on: a brief that cannot be saved never stops an archive |
| ran, and the archive then stops (an abort or a cancel at a later prompt) | the copy stays in the active change's history; the next archive saves a new one, and the latest is the change's brief |

The rows are the save's two outcomes (written, or refused whole) and the one way an archive can end after it without
completing (it stops before the sync and the move).

With every setting at its default, nothing the user sees or is asked changes: the save is a record (`automate-dev-flow`'s
R-adf-9), the tail does not name it (`PR-attached archive tail`), and a failure is recorded, never shown. The bulk-archive
workflow SHALL run the same step per change, before that change's sync, with the same table. Each body carries the
command and the table, so an installed skill needs no spec to run the step; a test holds each body carrying them.

#### Scenario: A default archive saves the brief before the sync

- **WHEN** `/orbit:archive foo` runs with every setting at its default, and `foo`'s delta spec adds a requirement
- **THEN** the archived change's `.orbit-runs/brief/` holds one `brief-<TS>.md` whose requirements are marked as not yet
  synced, and the completion readout is what it was before the save existed

#### Scenario: A failed save is recorded, not shown, and the archive completes

- **WHEN** the save step's `orbit brief --change foo --save` exits non-zero naming an unreadable record
- **THEN** the archive syncs, moves and writes its run summary, whose `warnings` carries one entry naming the failure,
  and nothing about the brief is shown

#### Scenario: A stopped archive leaves its copy, and the next saves another

- **WHEN** the brief is saved and the user then cancels at the sync prompt, and later archives `foo` again
- **THEN** the first copy stays in `foo`'s history, the second archive saves a second copy, and the latest is `foo`'s
  brief

#### Scenario: Bulk archive saves each change's brief

- **WHEN** `/orbit:bulk-archive` archives `foo` and `bar`
- **THEN** each change's brief is saved before that change's sync, and each archived history holds its own copy

## MODIFIED Requirements

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
brief existed → push → rewrite the PR description to the ACHIEVEMENT landmark
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
archive's OWN entry consent (user-typed, prompted-and-proceeded, or granted by the `archive` key, whose row names
these writes) — no second prompt
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

#### Scenario: A saved brief is staged and not named as a stray

- **WHEN** the tail commits a change whose trail holds the `brief/brief-<TS>.md` the archive saved before its sync, and
  no other file git never tracked
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
