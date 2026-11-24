# Program: reduce-orbit-phase2

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

Phase 1 (`reduce-orbit-phase1`, merged 2026-11-20) restructured orbit's skill bodies without rewording them: the
bodies a session loads went from 434,449 characters to 329,979, text a session rarely needs moved to reference files,
and a per-body budget test holds each body where it landed. Seven bodies still exceed the 5,000 tokens Claude Code
keeps of an invoked skill after a compaction (`npm run size:report` at `e2eabb02`): explore (11,904 estimated tokens),
address-reviews (10,921), review (9,602), propose (8,221), archive (7,041), bulk-archive (6,092) and onboard (5,678).
A long session that compacts in one of them loses its closing steps.

Phase 1 left to this phase what it could not do safely by construction (`reduce-orbit-phase1`'s R-rop-15, R-rop-18 and
R-rop-19): every body fitting what survives a compaction; the cuts its brief gated on evidence, chiefly review's,
archive's and propose's mode-only sections moved to references and the rewording of the decision-writing rule itself;
the rewording of the 115 provenance forms `tighten-bodies` could not remove; and explore's and onboard's own text, left
alone in phase 1. Its evaluation ruled that such cuts are graded by a replay set the brief calls S15 (sessions replayed
several times on fixed tasks, graded by orbit's computed facts) rather than ruled on from one session's evidence.

This phase goes further than phase 1 in two ways. What is not meeting orbit's needs or proving itself may come out, by
Sal's recorded decision (G0), rather than only moving to a reference; and the upstream OpenSpec text in each skill is
analysed and cut on the same terms as orbit's own (R-rop2-4).

(Drafted at the opening session from the rulings it cites; ratified by Sal, 2026-11-20.)

## Goals

Ratified by Sal, 2026-11-20, at the opening session.

- **G0 — Every removal is Sal's decision, and every change is named.** This phase may remove a step, a check, a record
  or a whole workflow that is not meeting orbit's needs or proving itself. Each removal is Sal's decision, made from
  replay grades, real sessions or outside evidence, and recorded as a ruling citing that evidence; its stage's archive
  names what it removes (the specs, tests and text). What is not removed keeps working: the full suite passes, and every
  baseline requirement holds or changes through a named delta. Fails if anything is removed without Sal's recorded
  decision, or changes without being named. (Phase 1's "nothing is lost", RG0, relaxed for this phase at Sal's
  direction: "If something isn't meeting our needs or proving itself, it can come out.")
- **G1 — Every body fits what survives a compaction.** At the program's end every generated skill body, explore and
  onboard included, is at most 5,000 estimated tokens as `npm run size:report` computes them (R-rop-18). Fails on one
  body over.
- **G2 — Growth is held.** Phase 1's per-body budget test keeps running in the suite and the size report in CI, and no
  ceiling is raised during the program. Fails if a ceiling rises.
- **G3 — The replay set grades every cut postulated to change what a session does.** A cut the inventory's cut list
  postulates major, one expected to change significantly what a session does at the defaults, lands only after the
  replay set (R-rop2-2) has run on it before and after, `npm run replay:compare` no worse. A move to a reference read at
  a named moment, the basic content kept in the body, and a rewording that keeps a step's meaning land without a replay
  unless postulated major; a removal under G0 needs none, its ruling being its record. Each cut list entry carries its
  replay mark, which a cut stage's proposal reviewer may contest. Fails on one cut postulated major landing ungraded.
  (Amended by R-rop2-10, 2026-11-23; as ratified 2026-11-20 it graded every cut meant to keep behaviour.)

## Rulings index

- **R-rop2-1** (Sal, 2026-11-20) — Phase 2 runs now, ahead of `automate-dev-flow`, which stays paused until this program
  is done ("let's suspend automate dev flow for now to work on reduction"). Amends `reduce-orbit-phase1`'s R-rop-15 (a
  phase 2 that followed `automate-dev-flow`) and R-rop-9 (`automate-dev-flow` resuming once `evaluation` and
  `records-by-setting` were done), and `automate-dev-flow`'s R-adf-16. Chosen over drafting this phase now and running it
  after `automate-dev-flow`, the order D-eval-8 had set. No stop record: this repository writes none since
  `records-by-setting` (`orbit decisions status` reports nothing written).
- **R-rop2-2** (Sal, 2026-11-20) — The replay set (the brief's S15) is this phase's first stage: a development-time check
  of orbit's own skill bodies, kept in this repository (cases, fixtures and a script that wraps the built skills as a
  throwaway plugin) and never shipped: nothing `orbit init` or `orbit update` installs changes, and no command, skill
  or body is added. It runs on `claude plugin eval` (Anthropic's eval runner: fresh headless sessions in throwaway
  workspaces, several runs per case, a cost ceiling, a JSON result), started by Sal before and after a cut and billed
  per session, outside `npm test` and CI by default. Its first exit criterion is a spike showing that runner can grade
  orbit's computed facts (an emit's fields at its timestamped path, a gate's state); if it cannot, the stage falls back
  to a small runner of this repository's own (`claude -p` in fixture projects, graded by orbit's commands), keeping the
  cases and fixtures. Chosen over that runner from the start and over no replay set.
- **R-rop2-3** (Sal, 2026-11-20) — After this program's reduction passes, `automate-dev-flow` goes back into
  architecture and is rescoped before any of its remaining stages is proposed: its charters were written for the bodies
  and workflows phase 1 left, and this phase may remove some of what they build on (G0). Recorded in that doc's
  R-adf-16 and status log.
- **R-rop2-4** (Sal, 2026-11-20) — The upstream OpenSpec text in each skill is in scope as much as orbit's own: it is
  analysed and cut where it is not carrying weight ("the openspec text itself in each skill is up for analysis and cuts
  itself if it isn't carrying weight"). Each such cut still lands as `orbit-conventions`' `Generated-file disposition`
  requires, a change whose delta spec names the edit, and a skill kept upstream-verbatim (sync-specs) may move to
  orbit-modified. A later cherry-pick from the read-only `upstream` remote (CLAUDE.md) then meets more local edits.
- **R-rop2-5** (Sal, 2026-11-20) — Three of Claude Code's skill tools join the program, each where it fits: the
  `replay-set` spike also tries Anthropic's `skill-creator` skill (its evals and its benchmark with variance analysis)
  beside `claude plugin eval`, R-rop2-2's runner and fallback unchanged; `/skill-doctor`'s usage data (each skill's
  listing cost, tokens and uses, and never-invoked warnings), with orbit's own record of which commands ran across the
  archived changes, is evidence the `inventory` stage brings to Sal's removal decisions (G0), named as measuring one
  user; and `claude plugin validate` over the generated skills runs in CI beside the size report (G2). `/doctor`,
  which checks the installation's health, stays out until it is seen to say something about skills.
- **R-rop2-6** (Sal, 2026-11-20) — The program runs in six stages: the replay set, an up-front inventory that ends in
  Sal's removal rulings, three cut stages by body group, and a close. The inventory comes first so every removal is
  decided with the whole picture, the same step usually sitting in several bodies. Chosen over each cut stage
  inventorying its own bodies and over one cut stage per body.
- **R-rop2-7** (Sal, 2026-11-20) — `pr: per-architecture` stays for this program (the question phase 1's R-rop-13 left
  open): the first propose citing this doc creates the branch `reduce-orbit-phase2` and one draft PR against main, each
  stage's archive appends its entry, and Sal merges once at arc-done. From that propose on, the program's work, the
  `inventory` exploration and architect sessions included, is done on that branch. Chosen over a branch and PR per change
  and over no PR handling.
- **R-rop2-8** (Sal, 2026-11-23) — `replay-set`'s CI repair lands as a direct commit on the program branch, outside the
  change lifecycle, recorded here (`8a85907f`): its `npm pack --dry-run` check had made CI's npm rebuild `dist/`
  mid-suite. The stage stays unratified until CI's Linux leg runs green with `validate:skills` executing, its fourth
  exit criterion. Chosen over a small change citing the stage and over an exploration of the CI picture first.
- **R-rop2-9** (Sal, 2026-11-23) — Phase 1's concluded exploration `evaluation` stays concluded. Its reopen trigger ("the
  replay set S15 is built") has fired, and this program answers it: the two replay-gated cuts it deferred (D-eval-1:
  stage D's mode-only sections moved to references, and the decision-writing bullet) are the `inventory` stage's
  inputs, which opens as its own named exploration citing this doc. Chosen over reopening `evaluation`, which is cited
  to phase 1's doc, and over re-weighing all of D-eval-1 to D-eval-8 in the inventory.
- **R-rop2-10** (Sal, 2026-11-23; the inventory's D-inv-1) — A cut is replayed only when it is postulated to change
  significantly what a session does ("I'm not as concerned about replay testing now unless we make a major change and
  postulate that it will significantly change the system"). Each cut list entry carries its replay mark, yes only when
  postulated major; moves to references read at named moments and rewordings that keep a step's meaning land without a
  replay, and a removal never needed one (G0). The cut stages' proposals plan a replay task only where an entry's mark
  says yes, and the baseline stays available to run at any time. Amends G3 (its text edited above) and R-rop2-2's
  "started by Sal before and after a cut". Chosen over replaying every cut meant to keep behaviour, G3 as ratified.
- **R-rop2-11** (Sal, 2026-11-23; D-inv-14, G0) — bulk-archive is removed. Evidence (`orbit/explore/inventory/explore.md`):
  no record of it ever running in this repository (it writes no run summary and no trail names a bulk archive, D-inv-6);
  orbit is single-user and single-session, concurrency a non-goal; its per-change steps mirror archive's and cost 20
  template edits since June to keep in step (phase 1's D-eval-2); and the parallel lanes D-eval-2 waited on belong to
  `automate-dev-flow`, which R-rop2-3 rescopes first. The removal takes the template
  `src/core/templates/workflows/bulk-archive-change.ts`, the skill `orbit-bulk-archive-change` with its references and
  its `/orbit:bulk-archive` launcher, and its mentions in the baseline specs `orbit-architect`,
  `orbit-archive-modifications`, `orbit-base-fingerprints`, `orbit-conventions`, `orbit-engine-gates`,
  `orbit-lifecycle-consent`, `orbit-run-summary-emit` and `orbit-decision-records`, in onboard's command table, the
  tests and the docs; D15's full surface goes from 15 workflows to 14. An adopter archives several changes one at a time
  with `/orbit:archive`. Landed by `cut-propose-archive`. Chosen over keeping it under 5,000 by moving two per-change
  steps to references (D-inv-3, superseded).
- **R-rop2-12** (Sal, 2026-11-23; D-inv-15, G0) — address-reviews' batch mode and the blind-pair disagreement test are
  removed. Evidence: neither fired in the 476 walk logs on this repository's trails (438 per-finding, 30 legacy walk-mode
  logs, none batch; no resolution carries a `disagreement`; D-inv-7). The removal takes the three batch triggers
  (`--batch`, the verbal phrase, the command-shaped mid-walk switch) and their records (`walk_mode_source`,
  `walk_mode_shifted_at_finding`), the disagreement rule and its `disagreement` record, and their text in the
  address-reviews, review, audit-drift and onboard templates and the baseline specs `orbit-address-reviews`,
  `orbit-decision-records`, `orbit-audit-drift` and `orbit-engine-gates`. Walk mode becomes the only mode, and a
  contradiction between a pair's halves is walked like any two findings; logs written before the removal keep their
  fields, and readers keep reading them. Landed by `cut-review-walk`. Chosen over moving both to references.
- **R-rop2-13** (Sal, 2026-11-23; D-inv-16, G0, R-rop2-4) — explore's illustrative upstream text is removed ("ok to remove
  some of openspec's original stuff"): the four "Handling Different Entry Points" dialogues, the ASCII box under
  "Visualize" (the stance already says to use diagrams liberally), "Ending Discovery"'s summary template (its one-line
  point kept) and the Guardrails lines repeating the opening's "don't implement" and the stance. With the inventory's
  moves (D-inv-5's two references, the crystallization flow, the emit timing, the new-exploration metadata, the propose
  composition in one sentence) explore projects from 11,816 to about 4,926 estimated tokens, about 4,430 tightened.
  Landed by `cut-explore-onboard`. Chosen over keeping one of the four examples (D-inv-11, superseded).

## Program stages

One change per stage, except `inventory`, worked as a named exploration citing it (as phase 1's `evaluation` was). The
three cut stages depend on `replay-set` and `inventory` and not on each other (R-rop2-6).

### Stage replay-set — the replay set that grades cuts meant to keep behaviour

Depends-on: (none)
Complete: [x] 2026-11-23 (Sal)

The brief's S15 as R-rop2-2 sets it: cases, fixtures and a script in this repository that run orbit's built skills as
real headless sessions, several runs per case, graded by facts orbit records. Never shipped; started by Sal and billed
per session. Its spike comes first: can `claude plugin eval` grade orbit's facts (an emit's fields at its timestamped
path, a gate's state), and does Anthropic's `skill-creator` skill, tried beside it, grade them better or say more about
whether a difference between two runs is real (R-rop2-5)? Failing both, the small runner of this repository's own.

Exit criteria:
- The spike's result recorded, the runner chosen, and the fallback taken if neither tool grades orbit's facts.
- Cases covering the default lifecycle (explore, propose, apply, review, the walk, archive) on fixture projects, each
  shown able to fail on a deliberately broken body.
- One baseline run on the bodies as phase 1 left them, recorded with its cost.
- `claude plugin validate` over the generated skills runs in CI beside the size report (R-rop2-5, G2).

Shipped as (2026-11-23; archived as `orbit/changes/archive/2026-11-23-replay-set/`; the charter stands, its second
exit criterion met in a weaker form for three cases, below). The spike found that `claude plugin eval`'s sandbox makes
the shell's workspace read-only, so `orbit emit` cannot write a record, and that `skill-creator` runs a case as a
subagent graded by a model; the fallback was taken, a `claude -p` runner of this repository's own (`replay/`, never
shipped). Each run packs one commit's build and installs it into a throwaway fixture per case behind a walk-up shim.
Six cases (explore, propose, apply, the system review, the walk, archive) are seeded at the state just before their
command by orbit's own emits. Each session is graded only by what orbit printed or wrote: printed paths only from
orbit's own calls, and only records later than the seed. Each grader is shown failing on its seed and passing on its
command's result in `npm test`. `npm run replay:compare` says whether a cut is no worse than a baseline: any case a run
did not fully grade has no verdict. `npm run validate:skills` runs `claude plugin validate --strict` over a freshly
generated surface as a failing CI step, Claude Code pinned at 2.1.329.

Sal's billed runs cost $14.94: plumbing on Sonnet $1.15 (27 of 27 facts), broken bodies on `claude-opus-5-5` $5.89 over
three runs, and the baseline on `claude-opus-5-5` $7.90 (three runs a case, all 81 facts, Claude Code 2.1.330,
`replay/results/2026-11-23T16-08-25Z-6076d85-baseline.json`). Every case was shown able to fail, but the breaks had to
be strengthened twice. A section cut from a body was recovered from the reference it pointed to. With references cut
too, the review, walk and archive sessions still rebuilt the emit step from `orbit emit --help`, the write gate's
refusals and the seeded trail's records of the same kind, and failed only when their whole body was emptied. So those
three cases catch a cut that loses the workflow, not one that loses only the emit step: evidence for `inventory` (their
emit sections are recoverable text for this model).

### Stage inventory — every over-budget body, section by section

Depends-on: replay-set
Complete: [ ]

A section-by-section inventory of the seven bodies over 5,000 estimated tokens, upstream text included (R-rop2-4) and
explore's and onboard's own text (the brief's S12, widened): for each section its size, when a session uses it, and
what shows it carries weight. The evidence is the replay set's baseline, `/skill-doctor`'s usage data and orbit's own
record of which commands ran across the archived changes (R-rop2-5), and any outside evidence Sal brings. Worked as a
named exploration citing this stage.

Exit criteria:
- Each of the seven bodies has its inventory and a cut list (keep, move to a reference, reword, remove), with a
  projected size against G1.
- Every removal on those lists is Sal's ruling, citing its evidence (G0); every move and rewording is marked for the
  replay set (G3).
- A step shared by several bodies is decided once, for all of them.

### Stage cut-review-walk — review and address-reviews

Depends-on: replay-set, inventory
Complete: [ ]

The inventory's cut list for review and address-reviews, the two largest shared-text bodies, applied
(`orbit/explore/inventory/sketches/review.md` and `address-reviews.md`), with R-rop2-12's removal of batch mode and the
disagreement test.

Exit criteria:
- Both bodies at most 5,000 estimated tokens (G1), their ceilings lowered (G2).
- The replay set run before and after, its grades no worse, on every cut whose replay mark says yes (G3, R-rop2-10);
  every removal named in the archive with its ruling (G0).

### Stage cut-propose-archive — propose, archive and bulk-archive

Depends-on: replay-set, inventory
Complete: [ ]

The inventory's cut list for propose and archive, applied (`orbit/explore/inventory/sketches/explore-propose-archive-onboard.md`),
and bulk-archive removed as R-rop2-11 rules (its future, phase 1's R-rop-16 thin loop, was the inventory's to rule on).

Exit criteria:
- Propose and archive at most 5,000 estimated tokens and bulk-archive removed (G0, G1); ceilings lowered (G2).
- The replay set run before and after on every cut whose replay mark says yes (G3, R-rop2-10); every removal named in
  the archive.

### Stage cut-explore-onboard — the two bodies whose text is their own

Depends-on: replay-set, inventory
Complete: [ ]

The inventory's cut list for explore and onboard, applied (`orbit/explore/inventory/sketches/explore-propose-archive-onboard.md`):
the text phase 1 left alone, with R-rop2-13's removal of explore's illustrative upstream text.

Exit criteria:
- Both bodies at most 5,000 estimated tokens (G1), explore's line ceiling and both character ceilings lowered (G2).
- The replay set run before and after on every cut whose replay mark says yes (G3, R-rop2-10); every removal named in
  the archive.

### Stage close — measure the program against its goals

Depends-on: cut-review-walk, cut-propose-archive, cut-explore-onboard
Complete: [ ]

The size report against G1 for every body, the ceilings at their final sizes, and the goals graded; then
`automate-dev-flow` returns to architecture to be rescoped (R-rop2-3).

Exit criteria:
- G0 to G3 graded, each with its evidence, in the status log.
- Every generated body at most 5,000 estimated tokens, or a ruling of Sal's for each that is not.

## Considered & out

- **2026-11-20 — No replay set, phase 2's cuts judged by tests, structural rules and real sessions:** cheapest, but the
  riskiest cut, rewording the decision-writing rule that applies on every call, would have nothing grading it; it would
  also amend R-rop-15's evidence rule and the evaluation's D-eval-1 (R-rop2-2).

## Status log

- 2026-11-20 — Doc created by an architect session at Sal's direction, the day phase 1 merged as PR #46: Sal suspended
  `automate-dev-flow` to work on reduction (R-rop2-1). The Premise is drafted from phase 1's R-rop-15, R-rop-18 and
  R-rop-19 and the brief's deferred items; the Goals and stages wait on the opening session's questions.
- 2026-11-20 — Opening session: Sal chose the replay set on `claude plugin eval` as the first stage (R-rop2-2), sent
  `automate-dev-flow` back to architecture after the reduction passes (R-rop2-3), relaxed "nothing is lost" into G0
  (removals by Sal's recorded decision), kept R-rop-18's size goal whole as G1, and put the upstream OpenSpec text in
  scope (R-rop2-4). Goals G0 to G3 ratified. Sal then folded three Claude Code skill tools in where each fits (R-rop2-5)
  and chose the six-stage shape with the inventory first (R-rop2-6); the stages are declared. `pr: per-architecture`
  stays (R-rop2-7), and Sal ratified the Premise with two sentences added for G0's removals and R-rop2-4's upstream text.
- 2026-11-23 — Architect session after `replay-set`'s archive. Offered for ratification, Sal said not yet: its fourth
  exit criterion is unmet. PR #47's CI had been red since the change's apply. On CI's npm, the runner test's
  `npm pack --dry-run --ignore-scripts` ran the build and rewrote `dist/` mid-suite, failing five unrelated tests. The
  job then stopped before the size report and `validate:skills`, so the validation step had never run. Fixed by a
  direct commit (R-rop2-8, `8a85907f`). The pack check now runs in a scratch replica with no scripts, and the two
  replay test files get a minute a test. Ratification waits on that run's Linux leg. Phase 1's `evaluation` stays
  concluded, its reopen trigger answered by `inventory` (R-rop2-9). Open, outside this program: the macOS leg's
  `completion-offers` test fails on a generated zsh script (`parse error near '<'`, line 32), red on main since
  `e2eabb02`; filing an issue is Sal's. Open for the cut stages: Claude Code auto-updated between the billed runs
  (2.1.329 to 2.1.330); holding it steady for the comparisons (`DISABLE_AUTOUPDATER=1`) is Sal's call.
- 2026-11-23 — Architect session, continued: CI run 45258559650 on `c871f875` showed the Linux leg passing its tests,
  its size report and `Validate generated skills` (the pinned `npx` copy of Claude Code 2.1.329 printed `Validation
  passed`), R-rop2-8's condition. Sal ratified `replay-set`: all four exit criteria met, the second in the weaker form
  its Shipped as records. The macOS leg stays red outside this stage: the zsh-completion test, and three
  `invoked-coverage-oracle` shards that timed out at 300 s after passing in 73 to 91 s two runs earlier (a re-run of the
  failed jobs is Sal's). `inventory` is next, as a named exploration citing this doc.
- 2026-11-23 — Architect session after `inventory` concluded (D-inv-18, its emit `2026-11-24T01-06-24Z`). The stage
  renders `ended-from-explore`, so it is offered no ratification and its slot stays `[ ]`. Its four decisions for this
  doc are written as rulings: Sal's replay rule (R-rop2-10, from D-inv-1), amending G3, whose text is edited, and
  R-rop2-2's "before and after a cut"; and Sal's three removals under G0, bulk-archive (R-rop2-11, D-inv-14),
  address-reviews' batch mode and the blind-pair disagreement test (R-rop2-12, D-inv-15) and explore's illustrative
  upstream text (R-rop2-13, D-inv-16). The three cut stages' charters now name their cut lists and removals, and their
  G3 exit criteria read R-rop2-10's replay mark; `cut-propose-archive` no longer offers bulk-archive's fit as an
  alternative to its removal. Every remaining body projects under 5,000 estimated tokens (D-inv-17). The three cut
  stages depend on nothing left undone and not on each other; each proposes its own change from its cut list.
  Recommended order (not ratified, any order is allowed): `cut-review-walk` first (the two largest bodies, and the most-run
  command), then `cut-propose-archive`, then `cut-explore-onboard` last, since R-rop2-11 and R-rop2-12 both edit onboard's
  text, so onboard is cut once, after both removals.
