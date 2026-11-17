> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: conditional-steps

## Premise

The first stage of `reduce-orbit-phase1` (its charter, R-rop-2 as amended). Seven steps keep their basic content in the
body and move their procedure to a reference file, byte-equal to today's text; in each, an orbit command's result picks
the branch, so the agent never judges whether to read the reference file. The per-body budget test and the size report
land with them (R-rop-8). What this exploration has to settle is how: how the change is cut, where each reference file
lives, what each basic content holds, which requirements move, and how the two measurements (R-rop-10, R-rop-12) are run.

| step | bodies carrying it | branch picked by | usual result |
|---|---|---|---|
| commit step | propose, ff, apply, review, address-reviews, archive (composed once, `COMMIT_STEP`) | `orbit pr commit --json` `action` | `off` |
| chain end step procedure | propose, ff, apply, review, address-reviews (`CHAIN_END_STEP`) | status `chain.configured` | `false` |
| sign-off hold | archive, architect | `orbit brief --hold --json` `why` | `off` |
| PR lifecycle sections | propose, ff, architect | the `pr:` regime | `never` at the defaults; `per-proposal` in this repo |
| gate inflection prompt | archive | status `gates[]` | every reviewed gate passed or superseded |
| base-fingerprint divergence check | archive | `orbit fingerprint --check --json` | all `verified` |
| size brief | propose (ff carries none) | status `size` | ceiling off, or no breach |

Bulk-archive carries its own versions of the sign-off hold, the PR section and the divergence check; it is left out of
this stage (D-cs-3).

## Mechanism

## Decisions

- **2026-11-17 — D-cs-1: the stage is one change, and its proposal declares the capabilities breach** R-rop-2 stands:
  stage `conditional-steps` is promoted as one change, not split, though it likely touches six to eight capabilities
  against this repo's `size_ceiling.capabilities: 3`. The proposal's `## Size` section declares the breach, its reason
  in Sal's words when propose's size brief asks. Sal chose this over three changes or two (`stop-2026-11-17T02-48-26Z.json`
  and its resolution).
  Kind: scope
- **2026-11-17 — D-cs-2: bulk-archive has never run in this repository** None of the 73 archived changes was archived
  with another: no commit adds two archived changes, and no archive record names bulk-archive as its writer; its six
  mentions in archive records are changes that edited it. Its template has 20 commits since 2026-06-05, each keeping it
  in step with archive. Sal does not run it in other projects either.
  Kind: fact
- **2026-11-17 — D-cs-3: bulk-archive is left out of this stage** Its sign-off hold, PR section and divergence check stay
  in its body as they are; its body costs a session nothing until it runs (D-cs-2), while each move would add spec and
  test edits to a change already over the capability limit (D-cs-1). This also settles the question of a shared
  divergence reference: only archive's divergence step moves. Whether bulk-archive is kept, folded into archive or
  retired is weighed at `evaluation` (R-rop-2 as amended; `stop-2026-11-17T03-00-00Z.json` and its resolution).
  Kind: scope
- **2026-11-17 — D-cs-4: the repeated-read measurement is deferred to automate-dev-flow's first-run** R-rop-10's
  measurement (does a reference file read twice in one session cost twice) needs chained sessions, which this repository
  never runs (R-adf-5). At Sal's direction it leaves this stage and the evaluation, and `automate-dev-flow`'s
  `first-run` records it from the trial's chained sessions, with its consequence for the chain end step's basic content
  (R-rop-10 as amended; `stop-2026-11-17T03-52-04Z.json` and its resolution).
  Kind: scope
- **2026-11-17 — D-cs-5: the rule for new steps is stated in CLAUDE.md and in the budget test's failure message** The
  brief's section 6, item 3 (a step whose procedure an orbit command's result calls for ships as basic content plus a
  reference file, the basic content being R-rop-3's: when it runs, the command, the usual result, and the link) is
  written as one line in CLAUDE.md, loaded in every session in this repository and so read at design, and in the
  per-body budget test's failure message, which then says how to fix the failure, not only that a body is too big. No
  requirement carries it: its only authors work in this repository, and propose reads the baseline specs of the
  capabilities a change modifies, which for a new step in archive is not `orbit-conventions`. Sal chose this over a
  requirement in `orbit-conventions`, CLAUDE.md alone, or the test alone.
  Kind: scope
  Disposition: superseded D-cs-10
- **2026-11-17 — D-cs-6: the program runs under `pr: per-architecture`** At Sal's direction `orbit/config.yaml`'s
  `pr:` is set to `per-architecture` (from `per-proposal`), recorded in the program doc as R-rop-13: this change and
  every later one citing `reduce-orbit-phase1` ride the branch `reduce-orbit-phase1` and one draft program PR, and work
  between stages is done on that branch. A consequence for this stage: the PR sections it moves are read for real here,
  at each propose and at arc-done, rather than only at the defaults' `never`.
  Kind: scope
- **2026-11-17 — D-cs-7: the stage is verified by tests alone** The byte-equal tests (each reference file is today's
  block; each basic content is the same in every carrying body) and the default-result tests (each command returns the
  result its basic content handles) are the stage's evidence; no real session is run to show an agent opening a
  reference file on an unusual result. The limit is named in the stage's exit criteria: a missed read would first reach
  adopters at archive's gate prompt, which fires at every archive for anyone who does not review (`spec-driven`'s two
  reviewed gates), and real sessions on the new bodies, here and in `evaluation`, are where one would be seen. Sal
  chose this over a scratch-project rehearsal of all seven steps, or of the gate prompt and divergence check with the
  rest carried to `first-run`.
  Kind: scope
- **2026-11-17 — D-cs-8: propose computes the stage's exact post-stage size from the drafted basic contents** The
  design drafts every basic content word for word (each is pinned byte-equal across its bodies), so propose computes
  this stage's post-stage total exactly: today's measured size, less each moved section, plus each drafted basic content.
  The budget test's ceilings (R-rop-8) are set from it, and RG1's post-C projection is formed from it with the brief's
  estimates for stages B and C. Sal is told only if that projection exceeds 350,000; the levers then are trimming the
  basic contents, bringing bulk-archive's sign-off hold back in (reopening D-cs-3), stage C carrying more, or amending
  RG1 (a goal amendment, Sal's). The projection on 2026-11-17, from today's bodies (434,449 characters at `3f5b035b`,
  equal to the brief's at `b5dac0dd`, generated into a scratch project by `orbit init --tools claude`): the brief's
  344,931, plus about 5,500 for bulk-archive's sign-off hold (4,867) and PR section (1,478) staying, less about 7,900 for
  the gate prompt (3,688), divergence check (2,753) and size brief (2,864) moving, plus about 2,750 for R-rop-6's tag
  meaning kept in five chaining bodies (the brief assumed about 450 left per body), about 345,000 in all, each basic
  content taken at about 450 characters. Apply's limit (17,500) is untouched by these: the brief's 16,923 stands.
  Kind: scope
- **2026-11-17 — D-cs-9: compaction is observed in this change's own sessions** R-rop-12's measurement is taken by
  watching the change's own apply, review and archive sessions, which run on the new bodies once `orbit update`
  installs them, and recording for each whether it compacted and, if so, what of the skill bodies it lost. It is an
  observation of real sessions, not a rehearsal, so it sits beside D-cs-7's tests-alone verification. The size report
  supplies the other half of R-rop-12: each body's estimated tokens against the 5,000 Claude Code keeps after a
  compaction.
  Kind: scope
- **2026-11-17 — D-cs-10: the rule for new steps lives in a convention file, which CLAUDE.md and the budget test point at**
  Found at propose: `orbit-conventions`' `Convention scope distinct from other knowledge layers` sends a durable rule
  about how the system is built to a `<topic>_convention.md` at the root, with CLAUDE.md only referencing it, and
  `Convention file consumers` has proposal review's Passes 3 and 7, system review's Pass 2 and audit-drift's Category 3
  read every such file. So the rule is written in a new `skill_body_convention.md` at the root; CLAUDE.md carries one
  line naming the rule and pointing at the file, and the budget test's failure message names it too. It is then read at
  design, at review and at test. Supersedes D-cs-5's CLAUDE.md placement; its reasoning (no requirement, the author
  reached before the test fails) stands. Sal chose this over keeping D-cs-5 with a recorded exception.
  Kind: scope
- **2026-11-17 — D-cs-11: the later stages carry RG1's projected 600** Measured at propose (D-cs-8), from the basic
  contents drafted word for word in `design.md`: this stage moves about 47,130 characters, landing the bodies at about
  387,300, and the brief's estimates for stages B (about 21,700) and C (about 15,000) project about 350,600 after C,
  about 600 over RG1. The gap comes from R-rop-6's tag paragraph (1,148 characters) kept in five bodies, bulk-archive
  staying out (D-cs-3), and the PR sections already being mostly basic content. Sal chose to build this stage as drafted
  and let the later stages carry the difference, measured again at the next stage's propose, over trimming more here,
  bringing bulk-archive's hold back, or amending RG1 (`stop-2026-11-17T13-56-01Z.json` and its resolution).
  Kind: scope

## Open questions

## Considered & out

- **2026-11-17 — A shared divergence reference shipped in archive and bulk-archive, or one per skill:** moot once
  bulk-archive left the stage (D-cs-3). The shared form (one text composed once, bulk's body keeping its per-change
  handling) stays the shape to use if bulk-archive is kept and its steps are moved later.
- **2026-11-17 — Measuring the repeated read in a scratch project, or by reading one file twice here:** either could
  run now, but the question matters only to chained sessions, so it is answered where they first run (D-cs-4).
- **2026-11-17 — The rule for new steps as a requirement in `orbit-conventions`:** a pin a reviewer can cite, but not
  read at design by the author of a new step, whose change modifies the capability owning that step (D-cs-5).
- **2026-11-17 — The budget test alone, with a bare "too big" failure:** it signals late (at apply) and names no fix; a
  step smaller than the 5% headroom passes silently (D-cs-5).
- **2026-11-17 — A real-session rehearsal of the unusual results** (all seven in a scratch project; or the gate prompt
  and divergence check there, the size brief and PR sections seen in this repository, and commit, chain end and sign-off
  carried to `first-run`): each shows the read a test cannot, but Sal chose tests alone (D-cs-7).
- **2026-11-17 — Splitting the stage into three changes, or two** (shared steps with the budget test; archive side;
  propose side): each would stay near the ceiling, but Sal kept R-rop-2's one change per stage (D-cs-1).

## References

- `orbit/architecture/reduce-orbit-phase1.md`, stage `conditional-steps`, R-rop-2 to R-rop-12.
- `orbit/architecture/reduce-orbit-phase1-brief.md`, sections 3 (rules for what stays), 4.1 and 4.4 (the moves), 5
  (specs and tests), 6 (growth) and 7 (verification).
- `src/core/disciplines.ts`: `COMMIT_STEP`, `CHAIN_END_STEP`, `DECISION_RECORDS_REFERENCE` (the shared-reference
  precedent).
