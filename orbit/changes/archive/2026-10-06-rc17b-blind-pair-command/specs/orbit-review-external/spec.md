## MODIFIED Requirements

### Requirement: A recorded runner launches the external review

The external branch SHALL launch the user's recorded runner — read through `orbit external runner --json`
(`orbit-external-runner`) — when one resolves and is reachable, and SHALL otherwise print the prompt for paste exactly
as before. It SHALL NOT ingest findings: the saved return is walked by `/orbit:address-reviews`, invoked separately.
The launch runs in the background, in a throwaway `git worktree` added at the handoff commit (per `Handoff preflight
blocks unusable pull invocations`) — or, when the run re-launches a blind pair's missing external half, at the commit
`A pair's external half reads the pair's reviewed state` names — OUTSIDE the repository directory, with the prompt file on the runner's standard
input unchanged and `{output}` a path outside the repository; the body waits on the run's completion notification,
because an external review outlasts the foreground limit. The return is saved through `orbit external save`, passed
the launch's T0 token as `--launch` — on a re-run of a blind pair's missing external half, the token
`A pair's external half reads the pair's reviewed state` names.

The record is never parsed by a shell, and the launch keeps it so: `{worktree}` and `{output}` are substituted into
the resolved argv FIRST; the process runs with the worktree as its working directory (so an own argv that names no
`{worktree}` still reads the fixed reviewed state); every element is passed as exactly one argument — on a shell
command line, each element single-quoted with an embedded `'` written `'\''`; and the prompt file arrives by a `<`
redirect. A recorded string is never handed to `sh -c`. The directory change is scoped to a subshell, and every step
after the launch — the save, the commits, the push, the report — runs from the repository root, never the worktree. On
a launched run the prompt's `## Repo` line names the runner's working directory — a checkout of the commit the worktree
was added at — never the live checkout's path.

| member | covered by |
|---|---|
| recorded, `argv[0]` resolves on `PATH` | launched in the background in a worktree at the handoff commit (a pair's re-run: at the commit `A pair's external half reads the pair's reviewed state` names); prompt on stdin; return written to `{output}` outside the repository |
| recorded, `argv[0]` does not resolve | the prompt is printed for paste, with the one extra item naming the unresolved command (per `Prompt written to versioned file with chat invocation snippet`) |
| nothing recorded | today's handoff, unchanged |
| launched, exits non-zero or is stopped (including a runner that is not signed in) | no pass file; the failure is reported with its exit status and the paste fallback is printed — the recommended-session note, a line saying the prompt's `## Repo` names the removed launch worktree and naming the repository and the handoff commit instead — for a blind pair's external half, the pair's REVIEWED COMMIT (per `A pair's external half reads the pair's reviewed state`) — then the pull invocation when the handoff push landed, or, when it did not, a launch-route handoff-blocked line naming the unpushed handoff commit with the push leading (the prompt is already committed); the T0 stands, so the gate keeps presenting the external half |
| the return opens with lines above `# External Review:` | removed by `orbit external save`, which reports them; the body quotes them in the commit message |
| the return carries no unfenced `# External Review:` heading, names another change, is rejected by the trail reader, or is refused by `orbit external save` for any other cause (per `orbit-external-runner`'s `The engine saves an external return into the trail`) | refused by `orbit external save`; treated as a failed run; the raw return stays outside the repository and its path is named |
| an apply landed after the launch | refused by `orbit external save` (`--launch`); a failed run with NO paste fallback — the prompt reviews a superseded state — and the review is re-run, packaging a new prompt |

The failure rows are those observed on one runner (Codex, on rc08b's and rc17a's pairs) plus the absent and
unresolved cases (D-rc17d-1). **Named limit.** Residual kind: a return that opens with the heading and parses yet is not a complete review (a truncated run)
Residual method: running the three external readers over the return and reading its `**Reviewer**:` line at each runner's first recorded use

**Named limit (a writable own runner).** The prompt tells a reviewer that can write files to write, commit and push
its findings. A read-only runner cannot; an own argv that can may write, and commit from a detached head, inside the
worktree. orbit cannot stop it: the worktree is removed with `--force` after the return is read, and the return saved
through `orbit external save` is the only record. A runner whose own commit reaches a remote branch is outside this
requirement.

**Named limit (D-rc17d-7).** The T0 record's `next_recommended` stays the paste/save prose
`orbit-run-summary-emit`'s `Review-external T0 multi-step recommendation` requires: it states the manual fallback
even when a runner launched, and the launch is reported in chat. The T0's `target` field names the runner (the
preset's name, or the basename of `argv[0]`) when one launched.

#### Scenario: A recorded runner launches with no paste

- **WHEN** `/orbit:review <change> --as system --reviewer external` runs with a reachable runner recorded and a clean tree
- **THEN** the runner is launched in a worktree at the handoff commit with the prompt on stdin, no pull invocation is printed, and the saved return is committed without hand edits

#### Scenario: No recorded runner is today's handoff

- **WHEN** the same invocation runs with no `externalRunner` record, and the gate reports no `openPair` for the mode
- **THEN** the chat output and the files written are those of the handoff before this requirement, byte for byte (the unresolved-runner case adds one item and is not covered by this scenario)

#### Scenario: A failed run falls back to paste

- **WHEN** the launched runner exits non-zero
- **THEN** nothing is committed for the return, the failure is reported with its exit status and the raw return's path, and the paste fallback is printed — the recommended-session note, the line naming the repository and the handoff commit in place of the removed worktree (for a blind pair's external half, the pair's REVIEWED COMMIT), then the pull invocation when the handoff push landed, or, when it did not, a launch-route handoff-blocked line naming the unpushed handoff commit with the push leading — the prompt is already committed, so Step 8's commit-the-pending-work output (per `Handoff preflight blocks unusable pull invocations`) does not apply

### Requirement: A launched return is committed alone and pushed

When a launched runner returns, the body SHALL save the return through `orbit external save`, commit the saved file
ALONE — `git add` of that one path, then `git commit --only` on it, so work the user staged during the run stays
out — with the removed preamble lines quoted in the commit message, which is written to a file and passed with `-F`,
never interpolated into a shell string (the lines are text an external AI wrote), push, and remove the worktree with
`--force`. The
handoff commit is made the same way, on the prompt file and the T0 emit. When the run is a blind pair's external half,
the save WAITS until the pair's fresh pass file is committed, or the fresh half is known missing, and the pair's one
push follows both commits — the order is `orbit-review`'s `The blind-pair reviewer runs both halves in one invocation`,
named here and not restated.

| member | covered by |
|---|---|
| the prompt file and T0 emit | the handoff commit, pushed before launch (per `Handoff preflight blocks unusable pull invocations`); the worktree's base |
| the saved return | `external-<mode>-<TS>.md`, committed alone, the removed lines quoted in the message, then pushed |
| the saved return of a blind pair's external half | saved and committed alone only after the pair's fresh pass file is committed, or once the fresh half is known missing; pushed by the pair's one push |
| a failed run | nothing committed; the T0 stands |
| a failed push | reported; the commit stands; no retry |
| the worktree | removed with `--force` after the return is read; a failed removal is reported, never fatal |

Closure: the path writes the packaging pair and at most one pass file; each is a row, plus the push and the worktree
(D-rc17d-6), and the pair's ordering of that one pass file is a row. Committing the return alone keeps the VERIFICATION confirm's residual-check base exact.

#### Scenario: The return is its own commit

- **WHEN** a launched runner returns a well-formed review and the push lands
- **THEN** exactly one new commit adds the saved `external-<mode>-<TS>.md` and nothing else, and it is pushed

#### Scenario: A pair's external return is committed after the fresh pass

- **WHEN** a blind pair's launched external half returns before its fresh half
- **THEN** the return is saved and committed only after the fresh pass file's commit, and the saved file is still the only path in its commit

## ADDED Requirements

### Requirement: A pair's external half reads the pair's reviewed state

Every half of a blind pair SHALL review the state the pair was launched on — or, when an apply landed after the
launch and before the landed member, the state that member reviewed — and never a state holding its partner. A pair's BASE is
the commit that added its launch T0 — found by a hash-only read, `git log --diff-filter=A --format=%H -- <launch T0
path> | tail -1` — and its REVIEWED COMMIT is BASE's first parent, which differs from BASE only by the launch's prompt
file and T0. The OPEN pair is the one the gate reports: the latest `review-external-<TS>.json` of the mode carrying
`pair: true`, whose token L is the launch `orbit-engine-gates`' `A pair's membership is computed from its launch` reads.
A run is a RE-RUN of a pair's missing half when the mode's reviewed gate row in `orbit status --change <change> --json`
carries `openPair: {missing}` naming that half's class. A re-run of the external half writes its own T0 with no `pair`
(per the same requirement), so it refills the open pair. Which state it reviews depends on whether an `apply-*.json`
token on the trail is later than L:

- **No apply later than L** — the re-run reviews the pair's REVIEWED COMMIT; an external re-run's worktree is added at
  BASE and its return is saved with `--launch L`, so supersession is measured from the state it reviewed.
- **An apply later than L** — the landed member was emitted after that apply (one emitted before it is stale, and the
  gate then reports no `openPair`), so it reviewed the post-apply state, and the engine counts the re-run as the pair's
  missing member, not a single. The re-run reviews the state the landed member reviewed: its REVIEWED COMMIT is the
  first parent of the commit that added the landed member's file, found by the same hash-only read
  (`git log --diff-filter=A --format=%H -- <member path> | tail -1`, then `^1`); an external re-run's worktree is added
  at that commit and its return is saved under its OWN T0 token, which is later than the apply. When the landed
  member's file is not yet committed, the run stops and says to commit that file alone first.

A pair's member is STALE, read from the trail and never from the gate's reason (whose text names the first failing
clause, not the pair): the latest launch L of the mode has exactly ONE landed member — its first fresh pass or first
accepted external return later than L, with no member of the other class — no `address-reviews-*.json` names that
member in its `source_path`, and an `apply-*.json` token is later than the member's token. With a stale member, the run is an ordinary single of its class on the current state and the chat says so: the pair's reviewed
state is superseded; a further review of the stale member's class lands as a single and covers; a run of the other
class becomes that pair's missing member and covers nothing. The re-run test is the body's reading of the trail; the
gate's computation is authoritative.

| member | covered by |
|---|---|
| first run, launched | the worktree at the handoff commit, which IS BASE (per `A recorded runner launches the external review`) |
| first run, pasted | the prompt's `## Repo` line names the repository and the pair's REVIEWED COMMIT, telling the reviewer to read the repository at that commit |
| a launched first run or re-run that fails | the paste fallback's commit line names the pair's REVIEWED COMMIT, never the run's handoff commit (per `A recorded runner launches the external review`'s failure row) |
| re-run of the missing external half, launched, no apply later than L | the worktree is added at BASE, NOT at the re-run's own handoff commit, which holds the committed fresh partner; the prompt reaches standard input from the live checkout's copy of the re-run's committed prompt file; the save passes `--launch L` |
| re-run of the missing external half, pasted | the prompt's `## Repo` line names the repository and the pair's REVIEWED COMMIT |
| first run, fresh half | the live checkout at BASE; the external partner stays outside the repository until the fresh pass file is committed (per `orbit-review`'s `The blind-pair reviewer runs both halves in one invocation`) |
| re-run of the missing fresh half, no apply later than L | the brief names the pair's REVIEWED COMMIT as the state to read — the repository read at that commit: the change's files and, in system mode, the code and the commit range ending there — and the worker still emits from the repository root; with the REVIEW-genre brief rule of `orbit-conventions`' `Review mode decision framework`, it names no `.orbit-runs/` path, where the committed external partner sits — instructed, not physical |
| re-run of a missing half, an apply later than L | the REVIEWED COMMIT is the first parent of the commit that added the landed member's file — the post-apply state that member reviewed; an external re-run's worktree is added there and its return saved under its own T0 token; a fresh re-run is briefed with that commit |
| a STALE member (read from the trail, as above) | an ordinary single on the current state, with the supersession notice |

Closure: BOUNDED — the routes are the launch, the paste, the failure fallback, the two re-runs on either side of an
apply, and the stale-member single; the launched routes
fix the TREE the runner is pointed at, and no route confines what a reader reads.

**Named limit.** Residual kind: a reader that goes past the commit it was told to read — a human-carried external AI that pulls HEAD, a fresh re-run subagent that reads the live checkout, or a launched runner that reads outside its worktree (the live checkout, or the object store and refs the worktree shares with it)
Residual method: reading the walked return's `**Reviewer**:` line and file citations for paths that exist only after the reviewed commit, when a re-run or a paste completes a pair

The gate cannot see this limit: its blindness rule reads walk order only (the blind-pair rule of clause (a) of `orbit-engine-gates`' `Reviewed-gate
pass condition — the computed convergence criterion`), so a
half that read its partner still completes a pair the gate counts as blind. A fresh half that STARTED before an apply
and emitted after it reads as current by the freshness rule; orbit is single-user, and an apply while a pair is open is
that user racing their own review.

#### Scenario: A launched re-run of the missing external reads BASE

- **WHEN** a pair launched at L has its fresh pass committed, the gate reports `openPair: {missing: "external"}`, a reachable runner is recorded, and the user runs `/orbit:review foo --as system --reviewer external`
- **THEN** the re-run's prompt and T0 (no `pair`) are committed and pushed as its handoff commit, but the worktree is added at the commit that added L's T0; the worktree holds no fresh pass file of the pair, the return is saved with `--launch L`, and the saved return completes the pair

#### Scenario: A pasted pair half names the reviewed commit

- **WHEN** a pair's external half is printed for paste, on the first run or a re-run
- **THEN** the prompt's `## Repo` line names the repository and the commit that is the first parent of the commit that added the pair's launch T0

#### Scenario: A single external outside a pair is unchanged

- **WHEN** `--reviewer external` runs and the gate reports no `openPair` for the mode
- **THEN** the worktree is added at the run's own handoff commit and the `## Repo` line is filled as `A recorded runner launches the external review` states

#### Scenario: A re-run after an apply reviews the landed member's state

- **WHEN** a pair launched at L has an `apply-*.json` token later than L, a fresh member emitted after that apply and committed, the gate reports `openPair: {missing: "external"}`, and the user runs `--reviewer external`
- **THEN** the worktree is added at the first parent of the commit that added the fresh member's file — it holds no fresh pass file of the pair — the return is saved with the run's own T0 token, and the saved return completes the pair

#### Scenario: A stale member's pair is superseded

- **WHEN** a pair launched at L has a fresh member emitted before an `apply-*.json` token later than it, so the gate reports no `openPair` — the member carrying an unresolved WARNING, so the gate's reason names the unresolved pass, not the stale member — and the user runs a review of either class
- **THEN** the chat says the pair's reviewed state is superseded, and the run proceeds as an ordinary single on the current state

#### Scenario: A failed re-run's fallback names the reviewed commit

- **WHEN** a launched re-run of a pair's missing external half exits non-zero
- **THEN** the paste fallback's commit line names the pair's REVIEWED COMMIT, not the re-run's handoff commit, which holds the committed fresh partner

#### Scenario: A fresh re-run is briefed with the reviewed commit

- **WHEN** a pair is open with `openPair: {missing: "fresh"}`, no apply is later than its launch, and the user runs `--fresh`
- **THEN** the fresh worker's brief names the pair's REVIEWED COMMIT as the state to read, and its pass is emitted from the repository root
