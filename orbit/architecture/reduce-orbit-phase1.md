# Program: reduce-orbit-phase1

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

orbit's skills grew from 131 KB of workflow template source at the fork to 586 KB, and the skill bodies a session loads
total 434,449 characters (the brief, measured at `b5dac0dd`): review, the walk, archive, explore and propose each load
44,000 to 57,000 characters before any work begins, and an invoked body stays in context on every turn. Sessions pay for
it in tokens, in time, and in the AI's hold on its own instructions; after a compaction Claude Code keeps only the first
5,000 tokens of each skill, so a long body loses its closing steps. Anthropic's guidance for building skills is the
measure: concise bodies, progressive disclosure, reference files one level deep.

Phase 1 restructures the bodies without changing what any workflow does. Text a session rarely needs moves to reference
files; each body keeps the step's basic content (when it runs, the command, the usual result, and the link to its
reference file); and a budget test keeps the bodies from growing back. It does not reword instructions, move steps into
the engine, or decide how much process a change should carry: those are weighed at its evaluation. Explore and onboard,
whose text is their own rather than shared, are left as they are (the brief's section 8).

## Goals

Ratified by Sal, 2026-11-17, from the opening session's answers to the brief's questions.

- **RG0 — Nothing is lost.** With every setting at its default and with each setting on, every workflow does what it
  does today; every baseline requirement holds and the full suite passes. A test changes only to follow text that moved
  to its new home (R-adf-15) or to lower a size ceiling, each such edit named in the stage's archive. Fails if a
  workflow behaves differently under any setting, or if an assertion about behaviour is weakened.
- **RG1 — Slimmer bodies.** After stage `tighten-bodies`, the generated skill bodies total at most 350,000 characters
  (the brief's 344,931 for its stages A to C, with a margin), and apply's body is at most 17,500. Fails above either.
- **RG2 — Anthropic's structural rules.** Every reference file is linked directly from its skill's `SKILL.md` (one level
  deep); every reference file over 100 lines opens with a table of contents; every skill's description is valid YAML,
  at most 1,024 characters, and says what the skill does and when to use it. Fails on one exception.
- **RG3 — Growth is held.** From stage `conditional-steps` on, the per-body budget test runs in the suite and the size
  report in CI (R-rop-8), and no ceiling is raised during the program. Fails if a ceiling rises.

## Rulings index

- **R-rop-1** (Sal, 2026-11-17) — Goals may be amended, in this program or another, in order to restructure orbit to be
  slimmer and more in line with Anthropic's guidelines for building skills. The alternative is an orbit-lite built from
  scratch, starting from the beginning; restructuring this orbit is the route taken. First applied to
  `automate-dev-flow`'s G0 (its R-adf-15, recorded as `stop-2026-11-17T01-22-37Z.json` and its resolution in the
  architecture trail's `decisions/` folder).
- **R-rop-2** (Sal, 2026-11-17) — Phase 1 is the brief's stages A, B and C, one change each, and then an evaluation of
  the result. Stage D (the cuts that need evidence first) is not declared; whether it is taken up is decided at that
  evaluation. (The brief's question 1.) Amended by Sal, 2026-11-17: three of stage D's steps join stage A, which is
  renamed `conditional-steps` to cover them: archive's gate inflection prompt, the base-fingerprint divergence check
  and propose's size brief. Each runs at the defaults, but an orbit command's result says
  when its procedure is needed and its usual result needs none, so it moves as stage A's steps do (the brief's rule 2).
  The rest of stage D still waits for the evaluation. Recorded as `stop-2026-11-17T02-42-43Z.json` and its resolution
  in the architecture trail's `decisions/` folder. Amended again by Sal, 2026-11-17, in the stage's exploration:
  bulk-archive is left out of this stage, its steps staying in its body as they are, since it has never run in this
  repository and its body costs a session nothing until it does; whether it is kept, folded into archive or retired is
  weighed at the evaluation. Recorded as `stop-2026-11-17T03-00-00Z.json` and its resolution in
  `orbit/explore/conditional-steps/.orbit-runs/decisions/`.
- **R-rop-3** (Sal, 2026-11-17) — A requirement that a block is carried byte-equal by each body is met by both halves,
  each byte-equal to one source: the step's BASIC CONTENT (when it runs, the command, the usual result, and the link to
  its reference file) in every carrying body, and the full step in every carrying skill's REFERENCE FILE. The tests keep
  today's checks, retargeted: carriage and position on the basic content, the full text on the reference file. The doc
  uses Anthropic's terms (progressive disclosure, the conditional-details pattern, basic content, reference file), not
  the brief's "stub". (The brief's question 2.)
- **R-rop-4** (Sal, 2026-11-17) — The basic content directs the read: at the branch, the body says which reference
  file to read and follow, as Anthropic's conditional-details pattern and its own published skills do
  (`build-mcp-server`, `math-olympiad`, `skill-creator`). No command's output names a reference file in this phase;
  that is a candidate for the evaluation, should sessions miss reads after a compaction. (The brief's question 3.)
- **R-rop-5** (Sal, 2026-11-17) — Every body is the same under every configuration: a step that is off at the defaults
  keeps its basic content and moves its procedure to a reference file, rather than being left out of bodies generated
  to match `orbit/config.yaml`. A setting turned on then works at once, with no regeneration step, in keeping with
  D15's full surface always. (The brief's question 4.)
- **R-rop-6** (Sal, 2026-11-17) — The meaning of the prompt tags (`(chain: target)`, `(chain: routine, default: …)`,
  `(chain: decision)`, `(chain: not a prompt)`) and what a chained command records stay in each chaining body, about
  1,000 characters, beside the tags they explain; only the chain end step's procedure moves to its reference file. A
  chained command, in this session or in a fresh one, then meets no tag its body does not explain. (The brief's
  question 5.) Amended by Sal, 2026-11-17, at the proposal walk of `conditional-steps`: that last sentence holds for the
  five chaining bodies, which explain the three prompt tags (`target`, `routine`, `decision`); `(chain: not a prompt)`
  names itself; and archive, which a chain can arrive at but which carries no chain end step, explains none of its tags,
  a named limit as before this program. Recorded as `stop-2026-11-17T14-14-43Z.json` and its resolution in
  `orbit/changes/conditional-steps/.orbit-runs/decisions/`.
- **R-rop-7** (Sal, 2026-11-17) — The decision-writing bullet is restructured in stage C into labelled sub-bullets
  (before asking, acting without asking, after a call, not a stop, where records go) with its content unchanged; the
  one-line form with its detail in `decision-records.md` is weighed at the evaluation, with stage D (R-rop-2). Whether
  decision records are written by default at all is a separate question, outside phase 1. (The brief's question 6.)
- **R-rop-8** (Sal, 2026-11-17) — Growth is held by a per-body budget test in the suite, run locally and in CI: each
  generated body has a character ceiling at its size plus 5%, and any body over 500 lines fails (the guideline's own
  limit), except explore, held at its 664 lines by a line ceiling that may only go down until its own reduction is
  weighed at the evaluation (amended by Sal, 2026-11-17: the check as first ratified would have failed explore on the
  day it landed; recorded as `stop-2026-11-17T02-31-47Z.json` and its resolution in the architecture trail's
  `decisions/` folder). The test lands with stage A at post-A sizes, and stages B and C each lower the ceilings to their own sizes,
  each a named edit; a ceiling only moves down in this program. A size report printing each skill's body and reference
  sizes runs in CI after the suite, reporting and never failing. orbit-spec's guard is a test, never a sensor run here
  (R-adf-5); the tripwires stage's size-budget sensor (D-tw-2) is the same idea for adopters' files. (The brief's
  question 7.)
- **R-rop-9** (Sal, 2026-11-17) — `automate-dev-flow` waits for all of phase 1: no change of its remaining stages
  (`tripwires`' three further changes, `driver`, `parallel-lanes`, `release`, `first-run`) is proposed until stages A,
  B and C are archived and their evaluation is done, so that program resumes on the slimmer bodies and on whatever the
  evaluation settles about the process. Recorded in `automate-dev-flow` as R-adf-16. (The brief's question 8; option B,
  over waiting for stage A alone or for a split.)
- **R-rop-10** (Sal, 2026-11-17) — Whether a reference file read again in one session costs its full size again (the
  brief's spike S9) is measured in stage A's verification: one session chaining two commands, comparing a repeated read
  with a single one. Claude Code's skills page documents that a re-invoked skill with identical content adds only an
  "already loaded" note; it says nothing of a re-read reference file. If a repeat costs twice, the chain end step's
  basic content takes on the common chained outcomes and reads its reference only for the rare ones. At the defaults no
  reference is read, so the answer changes nothing there. (The brief's question 9.) Amended by Sal, 2026-11-17, in the
  stage's exploration: the measurement leaves phase 1, since this repository runs no chained commands (R-adf-5), and is
  answered where chaining is first used in earnest, `automate-dev-flow`'s stage `first-run`; the consequence above
  travels with it. Recorded as `stop-2026-11-17T03-52-04Z.json` and its resolution in
  `orbit/explore/conditional-steps/.orbit-runs/decisions/`.
- **R-rop-12** (Sal, 2026-11-17) — Compaction is measured, not yet targeted: the size report also prints each body's
  estimated tokens against the 5,000 that Claude Code keeps of each skill after a compaction, stage A's verification
  records whether real long sessions compact and what was lost, and the evaluation decides whether every body must
  fit. Phase 1 already brings apply, the longest-running session, within that budget.
- **R-rop-11** (Sal, 2026-11-17) — The brief this program answers, Sal's "orbit: Skill Structural Cleanup" (measured at
  `b5dac0dd`), lives beside this doc as `orbit/architecture/reduce-orbit-phase1-brief.md` and is the program's source;
  "the brief" in this doc means it. Its program P2 and spikes S2, S9, S12 and S15 name work outside this repository.
- **R-rop-13** (Sal, 2026-11-17) — The program's changes ride one program branch and one program PR: `orbit/config.yaml`
  sets `pr: per-architecture` (from `per-proposal`), so each change citing this doc lands on the branch
  `reduce-orbit-phase1`, each stage's archive appends its entry to one draft PR against main, and main receives phase 1
  whole when Sal flips that PR READY and merges it at arc-done. From the first propose on, the work between stages (an
  architect session, the next stage's exploration) is done on `reduce-orbit-phase1`, not main: propose's branch
  selection skips when the exploration it consumes differs between the current branch and the program branch. It is
  the setting's first real use here, and it gives architect's program-PR readout, one of the sections stage
  `conditional-steps` moves, a real run at arc-done. Whether the setting stays when `automate-dev-flow` resumes is
  decided then.

## Program stages

One change per stage, in this order (R-rop-2). The brief's stage D is not declared, apart from the three steps stage
`conditional-steps` takes: whether the rest is taken up is decided at `evaluation`.

### Stage conditional-steps — steps whose procedure an orbit command's result calls for move to reference files

Depends-on: (none)
Complete: [x] 2026-11-17 (Sal)

The brief's stage A, with three steps from its stage D, and without bulk-archive (R-rop-2 as amended). The commit step,
the chain end step's procedure, the sign-off hold and the PR lifecycle sections, which do nothing at the defaults, and
archive's gate inflection prompt, its base-fingerprint divergence check and propose's size brief, which run at the
defaults but whose usual result needs no procedure, each keep their basic content in the body and move their
procedure to a reference file, byte-equal to today's text, composed once in code as now (R-rop-3, R-rop-4, R-rop-5).
In each, an orbit command's result picks the branch: the agent never judges whether to read the reference file. The brief save, which runs at every archive, is separated from
the sign-off hold and stays in the body. The meaning of the prompt tags and what a chained command records stay in each
chaining body (R-rop-6). The per-body budget test and the size report land in this change (R-rop-8). The requirements
that pin each block's text (the brief's section 5) are modified so that both halves are pinned.

Exit criteria:
- At the defaults, each gating command returns the result the basic content handles itself (`action: off`,
  `configured: false`, `why: "off"`), shown by test.
- For the three steps from stage D, the usual result (every reviewed gate passed or superseded, no fingerprint
  diverged, no size breach) is handled by the basic content, shown by test.
- A named limit, accepted by Sal (2026-11-17): the stage shows by test, not by a real session, that an agent meeting an
  unusual result opens the reference file and acts as before. A missed read would first reach adopters at archive's
  gate prompt, which fires at every archive for anyone who does not review; real sessions on the new bodies, here and
  in `evaluation`, are where one would be seen.
- Each reference file is byte-equal to today's block, and each basic content byte-equal across its carrying bodies,
  both tested.
- The compaction measurement (R-rop-12) is recorded. (The repeated-read measurement, R-rop-10, is answered in
  `automate-dev-flow`'s `first-run`.)
- The budget test and the size report run in the suite and in CI.
- RG0 holds.

Shipped as (2026-11-17; archived as `orbit/changes/archive/2026-11-17-conditional-steps/`; the charter stands): seven
steps keep their basic content in the bodies and move their procedure, byte-equal, to reference files: the commit step
(`commit-step.md`, six bodies) and the chain end step (`chain-end-step.md`, five bodies, the tag meaning kept in each);
archive's gate prompt, divergence check and sign-off hold (`gate-inflection.md`, `fingerprint-divergence.md`,
`signoff-hold.md`); architect's program sign-off hold (`program-signoff.md`); and propose's size brief
(`size-brief.md`). Propose's and ff's PR placement paragraphs join `pr-choreography.md`'s new `Where each phase runs`
section, and architect's arc-done act joins `pr-resolution.md`. Each moved block's sha256 was recorded before any edit
and is held by `moved-blocks.test.ts`; a test in a disposable project shows each gating command returning, at the
defaults and on the usual result, what its basic content handles itself. The bodies total 389,374 characters (apply
27,124), and `skill-body-budget.test.ts` holds each at that size plus 5% (explore at 664 lines); `npm run size:report`
runs in CI, and `skill_body_convention.md` states the rule for new steps. Carried forward: RG1's projection after
`tighten-bodies` is about 352,700, about 2,700 over (D-cs-11 was decided at about 600); `pr-choreography.md` now runs to
108 lines with no table of contents, a new RG2 instance for `tighten-bodies`, beside the review skill's two references
reached through `external-handoff.md`; the positional phrases that moved with their text are listed in the change's
design. The compaction observation (R-rop-12) is deferred to `evaluation`: the apply and review sessions ran in one
session that did not compact.

### Stage once-per-session-detail — run-summary payload detail and the account step move to reference files

Depends-on: conditional-steps
Complete: [ ]

The brief's stage B. The run-summary payload detail the bodies still carry inline moves to each skill's run-summary
schema reference, the body keeping the emit's call; the account step keeps its basic content and moves its field rules
to a reference file. Before the account step moves, check whether the apply gate could report a missing account, since
nothing in the engine prompts for one today.

Exit criteria:
- The payload detail and the account step's rules live in reference files; the bodies keep the calls and triggers.
- One change taken through apply under the new bodies writes its account.
- The budget test's ceilings are lowered to the new sizes.
- RG0 holds.

### Stage tighten-bodies — tighten what stays, and Anthropic's structural rules

Depends-on: once-per-session-detail
Complete: [ ]

The brief's stage C: the decision-writing bullet restructured into labelled sub-bullets with its content unchanged
(R-rop-7); Guardrails sections that restate the steps removed, keeping any line that says something the steps do not;
provenance (stage tags, ruling ids, checked-mirror notes, owning-spec citations in headings) removed from the bodies; and
the walk's description shortened. With it, RG2's structural fixes (placed here by Sal, 2026-11-17): reference files one level deep, a table of contents
on every reference file over 100 lines, and descriptions that are valid YAML within 1,024 characters.

Exit criteria:
- RG1 and RG2 are met.
- No wording an agent acts on is removed, shown by tests.
- The budget test's ceilings are lowered to the new sizes.
- RG0 holds.

### Stage evaluation — measure phase 1 and decide what follows

Depends-on: tighten-bodies
Complete: [ ]

Measure the bodies and the sessions run on them, and decide what follows phase 1: the rest of the brief's stage D (R-rop-2), the
one-line decision-writing (R-rop-7), reads named by a command's output (R-rop-4), whether every body should fit in what
survives a compaction (R-rop-12), whether decision records are written by default at all, and whether bulk-archive is
kept, folded into archive or retired (R-rop-2). Worked through as a named
exploration citing this stage. `automate-dev-flow` resumes once this stage is done (R-rop-9).

Exit criteria:
- The measures are written down: body and reference sizes, the compaction results, and what real sessions on the new
  bodies showed.
- Each decision above is recorded as a ruling or as considered and out.

## Considered & out

- **2026-11-17 — An orbit-lite built from scratch:** the alternative to restructuring this orbit (R-rop-1).
- **2026-11-17 — Bodies generated to match `orbit/config.yaml`:** a setting turned on without regenerating would do
  nothing, silently; every body stays the same under every configuration (R-rop-5).
- **2026-11-17 — One size ceiling for all bodies together:** it would hide one skill growing while another shrinks
  (R-rop-8).
- **2026-11-17 — A command's output naming the reference file to read, in phase 1:** an engine change this structural
  work rules out; weighed at the evaluation (R-rop-4).
- **2026-11-17 — The one-line decision-writing in phase 1:** the riskiest cut, since it applies on every call; weighed at
  the evaluation (R-rop-7).
- **2026-11-17 — Reordering bodies, or a goal that every body survive a compaction, in phase 1:** reordering rewords
  pinned positions, and the goal needs stage D; measured instead (R-rop-12).
- **2026-11-17 — Keeping the brief out of the repository:** the rulings rely on it (R-rop-11).

## Status log

- 2026-11-17 — Doc created by an architect session, at Sal's direction after `automate-dev-flow`'s session of
  2026-11-16 (its status log): orbit is getting too big and unwieldy, so take up a reduction pass, the work
  `automate-dev-flow`'s exploration `tripwires` set aside as D-tw-2.
- 2026-11-17 — Opening session: Sal supplied the brief `orbit-skill-structural-cleanup.md` (measured at `b5dac0dd`; no
  skill template has changed since; kept as `reduce-orbit-phase1-brief.md`, R-rop-11) as the program's source, and ruled R-rop-1, which amended `automate-dev-flow`'s G0
  (R-adf-15). Premise, Goals and stages wait on the brief's nine questions.
- 2026-11-17 — Opening session, continued: Sal reviewed Anthropic's skill-authoring guidance and Claude Code's skills
  page with the AI, walked the brief's nine questions one at a time (R-rop-2 to R-rop-10), placed the brief beside this
  doc (R-rop-11), chose to measure compaction rather than target it (R-rop-12), and ratified the Premise, Goals RG0 to
  RG3 and the four stages, with the guideline's structural fixes in `tighten-bodies`. R-rop-8 was amended the same day
  to hold explore at its 664 lines. `automate-dev-flow` is paused until `evaluation` is done (R-rop-9, its R-adf-16).
- 2026-11-17 — Resume session: the brief's four `### Stage A:` to `### Stage D:` headings matched the engine's stage-heading
  prefix, so `orbit architecture status` listed the brief as MALFORMED. At Sal's choice they are numbered `### 4.1 Stage A:`
  to `### 4.4 Stage D:` under its section 4, with no other text changed; the brief now reads as a legacy doc, and "the
  brief's stage A" still names the same section.
- 2026-11-17 — Resume session, continued: Sal asked whether steps that run at the defaults should move too. The AI
  sorted them by what picks the branch: archive's gate inflection prompt, the base-fingerprint divergence check and
  propose's size brief have an orbit command's result say when their procedure is needed (about 9,300 characters
  measured in today's bodies); archive's user-validation closure is picked by the agent's own scan of `tasks.md`, and
  review's fresh dispatch, architecture-mode report and verification step by the user's flags, so those stay in stage D.
  Sal moved the three into stage A and renamed it `conditional-steps` to cover them (R-rop-2 amended; RG3 and the
  `once-per-session-detail` dependency follow the new id).
- 2026-11-17 — From the exploration `conditional-steps`: bulk-archive has never run in this repository (no commit
  archives two changes; its 20 template edits since 2026-06-05 kept it in step with archive). At Sal's direction it is
  left out of this stage, and its future goes to `evaluation` (R-rop-2 amended again).
- 2026-11-17 — From the exploration `conditional-steps`: at Sal's direction the repeated-read measurement (R-rop-10)
  leaves phase 1 for `automate-dev-flow`'s `first-run`, where chained sessions first run on real work; this
  repository runs none (R-adf-5).
- 2026-11-17 — From the exploration `conditional-steps`: at Sal's direction `pr:` is set to `per-architecture`
  (R-rop-13); the program's work rides the branch `reduce-orbit-phase1` from its first propose on.
- 2026-11-17 — From the exploration `conditional-steps`: at Sal's choice the stage is verified by tests alone; the
  real-run checks of each unusual result leave its exit criteria, replaced by a named limit.
- 2026-11-17 — From the proposal walk of `conditional-steps`: R-rop-6's closing sentence amended to what is true (the
  five chaining bodies explain the three prompt tags; archive is a named limit, as before this program).
- 2026-11-17 — Stage `conditional-steps` archived and ratified by Sal: six exit criteria met, the compaction observation
  met in part (the apply and review sessions did not compact) and its remainder deferred to `evaluation` (its task 6.4).
