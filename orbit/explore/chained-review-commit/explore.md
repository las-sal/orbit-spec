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

## Open questions

- **Q7 — where D-chrc-7's change sits in the program.** Which stage it cites, or none.
  Standing recommendation: stage `release`, the stage that prepares the orbit the trial project installs, since what
  `orbit init` writes matters first there.
- **Q8 — the engine's part in the commit step.** Whether an `orbit pr` subcommand observes the facts the step needs
  (the attached branch and whether HEAD is on it, D-chrc-6; the untracked files a commit would add, D-chrc-5; both
  settings) and prints the commit and push, as `orbit pr publish` and `orbit pr tail` do under
  `orbit-pr-lifecycle`'s `The orbit pr command observes and prints; it never writes`, or the body runs git itself.
  Standing recommendation: an engine subcommand: every other commit orbit makes goes through one, it can be tested,
  and the facts D-chrc-5 and D-chrc-6 read are the engine's to observe.

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
