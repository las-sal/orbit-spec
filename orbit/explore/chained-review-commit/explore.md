> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: chained-review-commit

## Premise

The third of D-sga-1's three changes for stage seam-chaining (`orbit/changes/archive/2026-11-11-seam-chaining-grants/explore.md`,
D-sga-1), carrying option C of the first change's dirty-tree finding (the system walk, 2026-11-09, the user's word:
"c feels right to me. ok to do a first"). Option C's text: "Give the apply body's end step a commit of the apply's
named paths before reading chain when the next command is an external form (designed steps may commit), with its
test and a ledger entry in the defaults area."

Today, read 2026-11-11:

- A chained external review or blind pair needs a committed tree. The pair's Step 1 (`references/blind-pair.md`)
  refuses on ANY `git status --porcelain` output and writes nothing; the launch route (`references/external-handoff.md`
  Step 3a) refuses a dirty tree when the runner is reachable and writes nothing, saying "Never auto-commit the user's
  pending work". Unpushed commits do not block either: the pair's Step 3 and the handoff's Step 9 push.
- Nothing a chain runs before one commits: apply and the walk commit nothing, and propose and ff commit only under a
  PR regime. Every orbit command also writes its own run record under `.orbit-runs/`, so a tree a chain has passed
  through is never clean.
- So the common arrivals under `chain.review-external` (apply, then the system pair; a walk, then a re-review;
  propose or ff with no PR regime, then the proposal pair) write no run record, and the next read stops on
  `no-progress` (`src/core/chain.ts`, `composeChainObject`). The shared end step (`CHAIN_END_STEP` in
  `src/core/disciplines.ts`, carried byte-equal by five bodies) states this as a named limit and tells the AI to say
  the tree is uncommitted.

The question: where a commit goes so that the loop runs, what it may commit, and what grants it, without the review
ever committing work that is not the chain's.

## Mechanism

### D-chrc-2 — an auto-commit takes everything uncommitted
Domain: every kind of uncommitted path the step can meet on the attached branch
| member | covered by |
|---|---|
| a tracked file the command modified | committed (`git add -A`) |
| a tracked file the user modified by hand | committed — the user's word (D-chrc-2) |
| a tracked file deleted | committed as a deletion (`git add -A`) |
| an untracked file the command created (a new source file, a run record, a decision record) | committed and named (D-chrc-5) |
| an untracked file the user or a tool created | committed and named (D-chrc-5) |
| a file `.gitignore` excludes | never committed (D-chrc-5) |
| a path already staged before the step | committed with the rest |
| a merge or rebase in progress, or unmerged paths | not committed: the subcommand reports the state and prints no step (Case 2) |
| an empty status | no commit step is printed; a granted push still runs if commits are unpushed |
Closure: SOURCED — the member kinds are the states `git status --porcelain -z --untracked-files=all` reports (modified, deleted, added, renamed, untracked, unmerged) plus the ignored state porcelain hides, as `parsePorcelainZ` (`src/core/pr/select.ts`) reads them, keeping the raw two-letter status
Moves:
- READ: applied — `parsePorcelainZ` (`src/core/pr/select.ts`), `enumerateScope` (`src/core/pr/scope.ts`) and the tail's porcelain read (`src/core/pr/tail.ts`) read 2026-11-11
- ENUMERATE: applied — this table, one row per porcelain state plus ignored and empty
- COHERE: applied — "everything" (this rule) and ".gitignore bounds it" (D-chrc-5) are one predicate: what `git add -A` stages
- EXECUTE: not applied — no subcommand exists yet; the change's tests run it over a fixture repository with one path of each kind
- FALSIFY: applied — Case 1: the archive tail's unrelated-paths guarantee leaves the user's other edits out of its commit by design; with `commit: true`, the step after the tail commits them (the user's word: an edit left behind is worse), so the guarantee holds for the tail alone and the change says so
- CONFORM: applied — R-adf-14 (a commit takes everything `.gitignore` does not exclude); R-adf-1 (off unless set, D-chrc-3)
- FEASIBILITY: not applied — one `git add -A` per session close
- CONSUME: applied — a chained external review or blind pair reads `git status --porcelain` and now finds it empty (`references/blind-pair.md` Step 1, `references/external-handoff.md` Step 3a), which is the narrow fix this change started as
- INVOKE: applied — fires at every carrying body's close (D-chrc-8) when `commit: true` and HEAD is on the attached branch (D-chrc-6)

### D-chrc-4 — committing and pushing are two settings
Domain: every combination of the two settings
| member | covered by |
|---|---|
| neither set | today's behaviour: the subcommand prints nothing to run (G0, D-chrc-3) |
| `commit: true` alone | commit, no push; the PR does not show the commit until a later push (the archive tail's, or the user's) |
| `push: true` alone | push the branch's unpushed commits, commit nothing |
| both `true` | commit, then push to the attached branch |
| a value other than `true` (`false`, `"yes"`, a map) | grants nothing, read silently, as `resolveChainSetting` reads the `chain` map |
| an unknown sibling key | not read; the config schema's other keys are untouched |
Closure: DERIVED — two keys, each granted or not: four combinations, plus the two ways a key is not granted
Moves:
- READ: applied — `chain`'s schema entry and its silent reading (`src/core/project-config.ts`, `resolveChainSetting` in `src/core/chain.ts`) read 2026-11-11
- ENUMERATE: applied — this table
- COHERE: applied — push-alone pushing existing commits agrees with D-chrc-6: it runs only on the attached branch, never the default branch
- EXECUTE: not applied — no subcommand yet; one test per row
- FALSIFY: applied — a single key would publish every local commit the moment committing is on, which R-adf-6 rules out
- CONFORM: applied — R-adf-6 (each outward act its own setting), R-adf-1 (default is today), R-adf-14
- FEASIBILITY: not applied — two boolean reads
- CONSUME: applied — the body runs only the steps the subcommand prints, so an ungranted act is never printed and never run
- INVOKE: applied — read by `orbit pr commit` on every call

### D-chrc-5 — `.gitignore` bounds "everything", and each untracked file a commit adds is named
Domain: every surface where an untracked file added by the step must be visible
| member | covered by |
|---|---|
| the session's chat, at the step | one line naming each untracked file the commit adds, from the subcommand's observation |
| the commit itself | the files are in it, visible in the PR's diff once pushed |
| an ignored file | never staged, so never named |
| an untracked file the archive tail already committed | not named again: the tail's own line names it (R-adf-13), and it is no longer untracked when the step runs |
Closure: SOURCED — the step's outputs are its printed observation and the commit it makes; the tail's line is the one other surface that names untracked files (`carried_untracked`, `src/core/pr/tail.ts`)
Moves:
- READ: applied — the tail's `carried_untracked` observation and its one-line naming (R-adf-13) read 2026-11-11
- ENUMERATE: applied — this table
- COHERE: applied — naming files the commit adds (this rule) and committing them (D-chrc-2) read the same porcelain call
- EXECUTE: not applied — no subcommand yet
- FALSIFY: applied — a credentials file that is not ignored is still committed and pushed; naming it at once is the safety, and `.gitignore` remains the project's own boundary (the user's word on Q4)
- CONFORM: applied — R-adf-13's precedent (name, don't block); orbit's purpose memory (report, never a hard block)
- FEASIBILITY: not applied — one line
- CONSUME: applied — the user reads the line in the session; the program brief (stage program-brief) may later read it from the record, not owed here
- INVOKE: applied — fires whenever the commit step adds an untracked file

### D-chrc-6 — no auto-commit on the default branch
Domain: every branch state the step can find
| member | covered by |
|---|---|
| HEAD on the change's attached branch | the step runs |
| HEAD on the default branch | prints nothing to run, and one line says why |
| HEAD on another branch | prints nothing to run, names the attached branch, and one line says why |
| detached HEAD | prints nothing to run |
| no attachment (`pr: never`, unattached via new/continue, or a staging exploration) | prints nothing to run, silently, as today |
| attachment present but the branch deleted locally | prints nothing to run; names the branch |
| a per-architecture attachment (the program branch) | the step runs on the program branch (R-adf-14) |
Closure: SOURCED — HEAD is on a named branch or detached, and the attachment is present or absent (`latestAttachment`); the tail's head-mismatch read (`src/core/pr/tail.ts`) enumerates the same branch states
Moves:
- READ: applied — the tail's head-mismatch check and `latestAttachment` read 2026-11-11
- ENUMERATE: applied — this table
- COHERE: applied — the step keys on HEAD equalling the attached branch, so it needs no `gh` to know the default branch; propose's select names that branch after the change or the cited doc (`orbit-pr-lifecycle`'s `orbit pr select computes propose's branch selection`), so the one way it could equal the default branch is a change or doc named like it, which the subcommand refuses when `refs/remotes/<remote>/HEAD` names the same branch
- EXECUTE: not applied — no subcommand yet; one fixture per row
- FALSIFY: applied — a user who switches branches mid-session would otherwise have orbit's commit land on the wrong branch; the HEAD check catches it
- CONFORM: applied — R-adf-14 (never to the default branch); `orbit-pr-lifecycle`'s `Single-session operating assumption and v1 limits`
- FEASIBILITY: not applied — two git reads
- CONSUME: applied — under `pr: never` a chained external review on a dirty tree still stops on `no-progress`, so that limit's sentence in `orbit-conventions`' `No-chaining contract` is narrowed to it rather than retired
- INVOKE: applied — every call of `orbit pr commit`

### D-chrc-8 — the commit is a shared closing step, run before the chain end step
Domain: every workflow body under `src/core/templates/workflows/`
| member | covered by |
|---|---|
| propose, ff | carry it: the completion emit lands after Phase 3's commit, so the step commits it |
| apply | carries it, at the session's close, not at each chunk boundary |
| review | carries it in the dispatching session; a fresh worker or a blind pair's fresh half never runs it, as with the chain end step |
| address-reviews | carries it |
| verify | carries it |
| explore | carries it: runs only when resumed in a change's directory; a staging exploration has no attachment |
| archive | carries it after the tail: commits what the tail's scope left, then pushes |
| new, continue | do not carry it: never attached (`orbit-pr-lifecycle`'s `PR entry points`) |
| bulk-archive | does not carry it: several changes and no tail; a named limit |
| architect | does not carry it: no change target; the program PR's opening at the architect session is the driver's (D-chrc-1) |
| audit-drift | does not carry it: project-wide, no change target |
| sync-specs | does not carry it: it writes no run record, and its writes ride the next carrying body's commit |
| onboard, feedback | write nothing to a change |
| pr-choreography | not a body: the shared PR text propose and ff interpolate |
Closure: SOURCED — the directory listing of `src/core/templates/workflows/`, read 2026-11-11
Moves:
- READ: applied — the listing; `CHAIN_END_STEP`'s carriers (apply, propose, ff, review, address-reviews) and the emitting bodies, by grep 2026-11-11; archive's step order (the tail at Step 5.6, after the emit at Step 5.5)
- ENUMERATE: applied — this table, every file in the directory
- COHERE: applied — the step runs before the chain end step, so a chained external review always arrives on a committed tree, and with chaining off it still runs
- EXECUTE: not applied — no body text yet
- FALSIFY: applied — apply commits once per session, not per chunk: a long apply session leaves its work uncommitted until it closes; a named limit
- CONFORM: applied — D14 (each skill body is the behavioural source; the step is interpolated as `CHAIN_END_STEP` is); R-adf-12 (text whose effect depends on a setting is allowed in a body at the defaults)
- FEASIBILITY: applied — carried by eight bodies, so skill hash pins move for each (R-adf-9 names them at archive)
- CONSUME: applied — the chain end step's `no-progress` read is unchanged; the step writes no run record, so it moves no trail head
- INVOKE: applied — every carrying body's close, after its run summary is written

### D-chrc-10 — `orbit pr commit` observes and prints; `commit` and `push` are two top-level booleans
Domain: every fact the subcommand reads, and every step it may print
| member | covered by |
|---|---|
| the `commit` and `push` settings | read from `orbit/config.yaml` (D-chrc-4) |
| the change's attachment | `latestAttachment` (D-chrc-6) |
| HEAD and its branch | `git branch --show-current` (D-chrc-6) |
| the uncommitted paths and the untracked ones | one porcelain read (D-chrc-2, D-chrc-5) |
| a merge or rebase in progress | Case 2: reported, nothing printed |
| the remote to push to | `resolve` with `withDefault: false` (`src/core/pr/resolve.ts`), which skips the `gh` check, since a push needs no `gh` |
| unpushed commits | `git rev-list @{u}..HEAD --count`, or the branch has no upstream yet |
| the printed `stage` step | `git add -A` |
| the printed `commit` step | `git commit -F <message-file>`; the body writes the message |
| the printed `push` step | `git push <remote> <branch>` |
Closure: SOURCED — the inputs D-chrc-2, 4, 5 and 6 need, and the three step kinds `orbit pr tail` prints (`stage`, `commit`, `push`), `src/core/pr/tail.ts`
Moves:
- READ: applied — `orbit pr tail`'s segment and the `orbit pr` help text read 2026-11-11; `PrRunner` runs git reads only
- ENUMERATE: applied — this table
- COHERE: applied — the subcommand writes nothing and the body runs what it prints, as `orbit-pr-lifecycle`'s `PR actions are workflow-body choreography (zero engine git)` requires
- EXECUTE: not applied — not built yet
- FALSIFY: applied — the tail's resolution requires `gh`; a project with a remote and no `gh` can still commit and push here, so the subcommand resolves with `withDefault: false` (the remote row)
- CONFORM: applied — `orbit-pr-lifecycle`'s `The orbit pr command observes and prints; it never writes` and `Printed commands are proven by execution` (the change's tests run the printed argv against a fixture repository)
- FEASIBILITY: not applied — a handful of git reads per session close
- CONSUME: applied — the body runs the printed steps in order and stops at the first failure, naming it
- INVOKE: applied — called by the shared closing step (D-chrc-8)

### Case 1 — the archive tail's unrelated-paths guarantee
`orbit-archive-modifications`' `PR-attached archive tail` commits an enumerated scope and leaves unrelated tracked edits
unstaged, naming them in the owner's note (`src/core/pr/tail.ts`, `unrelated_unstaged`). With `commit: true`, the
shared step after the tail commits those edits too. The tail's guarantee is unchanged (the tail still leaves them out
of its own commit); the setting adds a second commit after it. The change states this beside the tail's requirement
so the two do not read as contradicting.

### Case 2 — a merge or rebase in progress
`git add -A` during an unfinished merge or rebase would stage conflict markers. The subcommand reads porcelain's
unmerged states (`UU`, `AA`, `DD` and the rest) and the presence of `.git/MERGE_HEAD` or a rebase directory, and
prints nothing to run, naming the state. `parsePorcelainZ` (`src/core/pr/select.ts`) keeps the raw two-letter status,
so the unmerged codes reach the subcommand (read 2026-11-11).

## Decisions

- **2026-11-11 — D-chrc-1: this change widens to "every command commits its writes to the change's PR branch"; the PR's birth at the architect session goes to the driver stage** The user's statement of the whole program (2026-11-11): the PR is created at the start of an architect session, that branch and PR live for the entire program, orbit commits to it the whole time, and the user gives the go-ahead for the merge at the end. Committing at every command's end makes the narrow fix (a commit before a chained external review) unnecessary, since the tree is already committed when such a review arrives. Opening the PR at the architect session is an outward act that spans stages, so it joins the merge and the return to the default branch in the driver stage (D-sc-17 of the first change's exploration). The user's word, 2026-11-11 ("Split"; AI recommendation).
  Kind: scope
- **2026-11-11 — D-chrc-2: an auto-commit takes everything uncommitted in the tree, not only orbit's own writes** The user, 2026-11-11: "we are committing into a PR branch for a particular change. I'm ok if any edits I make as part of the PR are included; it actually seems worse if I edit something and it gets left behind because orbit didn't take it, or if the AI misses something that is critical. To me everything is safer." This replaces the earlier leaning (commit only the change folder and the paths the command names) and the narrow fix's premise that the review's "never auto-commit the user's pending work" refusal stays the safety net. The user's word over the AI's recommendation.
  Kind: rule

- **2026-11-11 — D-chrc-3: committing throughout is opt-in, a setting a project turns on** With no setting, orbit
  commits only at propose and archive, as today; R-adf-1 and G0 stand unchanged. Answers stop
  `stop-2026-11-11T16-52-34Z.json`. The user's word, 2026-11-11 ("opt-in"; AI recommendation).
  Kind: scope
- **2026-11-11 — D-chrc-4: pushing is its own setting, separate from committing** Two settings: one lets orbit commit,
  the other lets it push each commit to the change's PR branch (the change's own branch under `pr: per-proposal`, the
  program branch under `pr: per-architecture`), never to the default branch. A commit is local and a push is outward,
  and R-adf-6 makes each outward act its own setting. The user's word, 2026-11-11 ("two lines"; AI recommendation).
  Kind: rule
- **2026-11-11 — D-chrc-5: `.gitignore` bounds "everything", and each untracked file a commit adds is named** An
  auto-commit stages what `git add -A` stages, so a file `.gitignore` excludes is never committed, and the step names
  in one line each untracked file the commit adds, as the archive tail does since R-adf-13, so a stray scratch or
  credentials file is seen the moment it lands. The user's word, 2026-11-11 ("Q4 holds"; AI recommendation).
  Kind: rule
- **2026-11-11 — D-chrc-6: no auto-commit on the default branch** The step runs only on the change's attached PR branch;
  with `pr: never`, or a change with no attached branch, it commits nothing. The user's word, 2026-11-11 ("Q5 holds";
  AI recommendation).
  Kind: rule
- **2026-11-11 — D-chrc-7: `orbit init` writes `pr: per-architecture` into a new project's config, as a small change of
  its own** Existing projects are unchanged, and an absent `pr:` still means `never` (`orbit-pr-lifecycle`'s
  `PR lifecycle config vocabulary`); today `orbit init` writes only `schema:` (`src/core/init.ts`, `createConfig`). It
  changes what a default install does, so G0 names it as a ratified exception at an architect session, as R-adf-11
  and R-adf-13 did. Not this change's scope. Answers stop `stop-2026-11-11T17-17-03Z.json`. The user's word,
  2026-11-11 ("init writes it"; AI recommendation).
  Kind: scope
- **2026-11-11 — D-chrc-8: the commit is a shared closing step of its own, run before the chain end step** Carried
  byte-equal by every body that writes to a change, as `CHAIN_END_STEP` is, and run before the chain read, so it
  commits with chaining off as well as on, and a chained external review always arrives on a committed tree. Folding
  it into the chain end step was the alternative: that would tie committing to chaining, two settings R-adf-6 keeps
  apart. The AI's call (the user delegates method, recorded with rationale under R-crc-3).
  Kind: rule

- **2026-11-11 — D-chrc-9: D-chrc-7's change cites stage `release`** It is in that stage's charter and exit criteria in
  `orbit/architecture/automate-dev-flow.md`: the stage prepares the orbit the trial project installs, and that
  project's `orbit init` is the first to use the new default. The user's word at the architect session, 2026-11-11
  ("release"; AI recommendation). At the same session the user's program statement became R-adf-14, and the driver
  stage's charter dropped the merge and return settings: nothing merges between stages on one program branch.
  Kind: scope

- **2026-11-11 — D-chrc-10: an `orbit pr commit <change>` subcommand observes and prints the step; the settings are two
  top-level booleans, `commit` and `push`** The subcommand reads both settings, the change's attachment
  (`latestAttachment`, `src/core/pr/inputs.ts`), whether HEAD is on its branch, and the porcelain status, and prints
  `git add -A`, `git commit -F <message-file>` and `git push <remote> <branch>` as `orbit pr publish` and `orbit pr tail`
  print theirs, under `orbit-pr-lifecycle`'s `The orbit pr command observes and prints; it never writes`. The body
  writes the message and runs the printed steps. `commit: true` and `push: true` in `orbit/config.yaml` each grant one
  act; any other value, or an absent key, grants nothing, read silently as the `chain` map is. The alternative, the
  body running git itself, leaves D-chrc-5's and D-chrc-6's observations untested and unlike every other commit orbit
  makes. Closes Q8. The AI's call (method, R-crc-3); the key names are the two lines the user agreed to (D-chrc-4).
  Kind: rule

## Open questions

## Considered & out

- **2026-11-11 — The commit is granted by the `review-external` key** (the narrow fix's leaning): moot once the commit
  happens at every command's end rather than only before a chained external review (D-chrc-1).
- **2026-11-11 — The commit holds only the change folder and the paths the command names** (the narrow fix's
  leaning): the user chose everything, since an edit left behind or a file the AI missed is worse (D-chrc-2).
- **2026-11-11 — Committing throughout as orbit's default** (amending R-adf-1 and G0): opt-in instead, since a fresh
  install by anyone else should not start committing on its own (D-chrc-3).
- **2026-11-11 — One setting for commit and push**: two settings, since a push publishes and R-adf-6 makes each such
  act its own permission (D-chrc-4).
- **2026-11-11 — An absent `pr:` means `per-architecture`**: every existing project that set nothing would start
  pushing branches and opening draft PRs after an upgrade, which R-adf-1 rules out; `orbit init` writes it for new
  projects instead (D-chrc-7).

## References

- `orbit/changes/archive/2026-11-11-seam-chaining-grants/explore.md` — D-sga-1 (the three changes) and D-sga-4's
  apply row ("a commit or push of the applied work … the third change's").
- `orbit/changes/archive/2026-11-10-seam-chaining/design.md` — Risks, "A chained external review or blind pair meets
  an uncommitted tree": the named limit and the carry.
- `orbit/changes/archive/2026-11-10-seam-chaining/.orbit-runs/review-system-2026-11-09T23-04-10Z.json` — the dirty-tree
  finding and its options A, B and C.
- `src/core/disciplines.ts` — `CHAIN_END_STEP`, the shared closing step and its dirty-tree limit sentence.
- `src/core/chain.ts` — `CHAIN_KEY_TABLE`, `composeChainObject` and the `no-progress` row.
- `.claude/skills/orbit-review/references/blind-pair.md` Step 1 and `references/external-handoff.md` Step 3a — the two
  clean-tree refusals.
- `src/core/pr/tail.ts` and `src/core/pr/publish.ts` — the engine's existing enumerated commit scopes (`enumerateScope`
  in `src/core/pr/scope.ts`), a precedent for an engine-printed `git commit --only -- <paths>`.
