# The replay set

A development-time check of orbit's built skills (`reduce-orbit-phase2`, R-rop2-2; capability `orbit-replay-set`). It
runs real headless Claude Code sessions (`claude -p`) that each type one orbit command into a throwaway project seeded
at the state just before that command, several runs per case, and grades each run by facts orbit itself printed or
wrote. A cut to a skill body meant to keep behaviour is graded before and after (`reduce-orbit-phase2`'s G3) by
comparing two runs' records.

What it is not:

- **Never shipped.** `replay/` is outside `package.json`'s `files`: nothing `npm pack`, an install, `orbit init` or
  `orbit update` carries changes, and no command, skill or body is added for it.
- **Never free, never automatic.** Every session is billed. Only `npm run replay` starts one, it refuses to start
  without a total cost ceiling you type, and `npm test` and CI never start one (they run the free checks in
  `test/replay/`).
- **Never a judge of prose.** A grade is a fact orbit recorded (an emit at its path, a gate's state, orbit's reading of
  a file), never a model's opinion of the session.

## Commands

```bash
npm run replay -- --model <model> --max-total-usd <usd> [--ref <commit>] [--runs 3] [--cases a,b] [--label <l>] [--broken]
npm run replay:compare -- <baseline.json> <cut.json>
```

`npm run replay`:

| flag | meaning |
|---|---|
| `--model` | required: the model every session runs on (graded runs use the model you work with) |
| `--max-total-usd` | required: the run's total cost ceiling |
| `--ref` | the commit whose build is graded (default `HEAD`); uncommitted edits are never graded |
| `--runs` | runs per case (default 3) |
| `--cases` | a comma-separated subset of the cases (default: all six) |
| `--label` | the record's label (default `run`); `plumbing`, `broken`, `baseline`, or the cut's name |
| `--broken` | apply each case's `break` (a deleted section of its skill body): every case should then fail its named grader |
| `--workdir` | where fixtures and traces go (default `<tmp>/orbit-replay/<run-id>/`); refused inside a git work tree or below a `CLAUDE.md` or `.claude/` other than your home's |
| `--cli <dir>`, `--results <dir>`, `--cases-dir <dir>` | the free checks' seams: an already-installed CLI instead of a build, another records directory, another cases directory |

A run, in order:

1. resolves `--ref` to a commit and builds it once: a detached worktree, `npm ci`, `npm run build`, `npm pack`, and
   `npm install <tgz> --omit=dev --ignore-scripts` into `<tmp>/orbit-replay/cli/<sha>/` (cached by commit; the
   worktree is removed);
2. for each case and run: builds a fresh fixture (`git init`, `.orbit-cli` → that install, the shared project,
   `orbit init --tools claude`, the case's `scaffold.sh`), checks the case's `start` state, and runs one session in it
   with the shim (`replay/shim/orbit`) first on `PATH`:

   ```
   claude -p "<prompt.md>" --model <m> --max-turns <n> --max-budget-usd <c> --setting-sources project
     --allowedTools "Bash Read Write Edit Glob Grep Skill" --no-session-persistence --output-format stream-json --verbose
   ```

3. grades the fixture and the trace, and writes the record to
   `replay/results/<YYYY-MM-DDTHH-MM-SSZ>-<sha7>-<label>.json` (never overwritten). The record is written before the
   first session and rewritten after every run, so a run that stops part-way keeps the record of every session it
   billed; Ctrl-C (or SIGTERM) kills the running session, counts its whole budget, and records the rest as not run.

Cases run in name order (apply, archive, explore, propose, review, walk), each case's runs one after another.

The shim walks up from the session's directory to the first `.orbit-cli/` and exits 127 when there is none, so a
session never reaches the global `orbit` install.

## Cost

Before each session the runner **reserves the case's whole `max_budget_usd`**: it starts the session only when the spend
so far plus that budget fits under `--max-total-usd`. A session that crashes, is killed at its `timeout_minutes`
(default 30), or leaves no result record counts its whole budget. So the ceiling must cover the expected spend of the
runs before the last one plus the largest case budget, not just the expected total: a $3 ceiling runs the apply case
alone, and at $8 the review case starts only if the first four cases spent at most $4 together.

| case | `max_turns` | `max_budget_usd` | `timeout_minutes` |
|---|---|---|---|
| `explore` | 15 | 1.5 | 10 |
| `propose` | 60 | 4 | 30 |
| `apply` | 40 | 3 | 30 |
| `review` | 60 | 4 | 30 |
| `walk` | 50 | 3 | 30 |
| `archive` | 60 | 4 | 30 |

The six budgets sum to $19.50 per run of the set. Recorded spends (fill in from each record's `total_cost_usd`):

| run | model | runs a case | total |
|---|---|---|---|
| plumbing | sonnet (claude-sonnet-5-5) | 1 | $1.15, all 27 facts passed: `results/2026-11-20T20-12-39Z-1e9d930-plumbing.json` |
| broken bodies | Sal's model | 1 | not yet run |
| baseline | Sal's model | 3 | not yet run |

## Cases

Six cases, one per default lifecycle command, all at orbit's default settings, on one change `greet-name` in one small
project (`project/`: `greet.js` and a baseline capability `greeting`):

| case | typed command | seeded state |
|---|---|---|
| `explore` | `/orbit:explore greet-name` | the project only |
| `propose` | `/orbit:propose greet-name` | a staged exploration with its explore emit |
| `apply` | `/orbit:apply greet-name` | the proposed change; `review-proposal` passed (a fresh pass, its walk, a later in-context pass) |
| `review` | `/orbit:review greet-name` | the applied change, a fresh system pass and its walk |
| `walk` | `/orbit:address-reviews greet-name` | that, plus an in-context system pass with one obvious-fix warning |
| `archive` | `/orbit:archive greet-name` | that pass walked; `review-system` passed |

Each scaffold runs the previous case's scaffold and then seeds what the previous command leaves, so a case never
depends on another session's luck. Every seeded record is written by orbit's own commands (`orbit emit`, `orbit new
change`; helpers in `lib/seed.sh`), so the gate states a session starts from are what the engine computes.

A case is a directory under `cases/` holding a `case.yaml` (the folder shape `claude plugin eval` uses):

- `prompt.md` — the typed text: the command on its first line, then the answer to any question the command would ask
  (a `claude -p` session has no one to answer `AskUserQuestion`). Named limit: a path that turns on a user's answer
  given mid-session is graded only as far as the prompt's stated answer reaches it.
- `case.yaml` — `max_turns`, `max_budget_usd`, `timeout_minutes`; `start` (orbit checks the seeded fixture must pass
  before any spend); `break` (`file`, the installed skill file; `section`, a heading whose section `--broken` deletes;
  `grader`, the grader expected to fail then).
- `scaffold.sh` — the seed, run in the fixture after `orbit init` with `REPLAY_LIB` and `REPLAY_CASES` set.
- `graders/` — one Markdown file per fact, YAML frontmatter plus the fact in prose.

### Adding a case

Add it when a cut first touches text only a mode or a setting reads (the external review, the blind pair, chained
runs, a `pr:` regime). Write its scaffold with orbit's commands, its `start` checks by the engine's gate ids, and its
graders by the fields `orbit status --change <name> --json` and the emit filenames actually hold (read them; never
copy a table). Then run `npx vitest run test/replay/cases.test.ts`: it builds the seed on the repository's own build
and checks every rule below. The case's `break` is the billed check that the case as a whole can fail: run it once
with `--broken --cases <id>` on your model before it joins a baseline.

## Graders

A grader reads only what orbit printed or wrote:

| source | |
|---|---|
| orbit's printed output in the trace | allowed: the results of the session's Bash calls that ran `orbit` as a command (`orbit` the first word of one of the call's commands, not a bare argument such as `find orbit …`), paired with each call by id |
| a file in the fixture | allowed only beside a fact orbit's answer makes true about it |
| orbit's commands run in the fixture after the session | allowed |
| the command line the session typed | refused |
| the skill body's text, recorded when the skill loads | refused |

Types:

- `file_exists` — `path` (a glob, `*` within one segment), `absent: true` to invert. Needs `pairs_with`.
- `regex` — `pattern` over `target`: `orbit_output` (needs `example`, a line orbit prints that the pattern matches) or
  `file:<path>` (needs `pairs_with`). `after_seed: true` on an `orbit_output` grader over a printed path makes it pass
  only on a path whose timestamp is later than the seed's newest trail record (the record keeps it as `seed_token`):
  orbit's own answers, such as `orbit status --change <name> --boot`, print the seeded records' paths too.
- `orbit` — `args` (an orbit command, with `--json`), `path` into its answer (`a.b`, `a.0`, `a[id=x].c`, `a.length`)
  and one of `equals`, `matches`, `exists`.

A file grader's `pairs_with` names an `orbit` grader, or a `regex` over `orbit_output`, of the same case, whose `about`
is the file grader's own path. A grader whose fact already holds at the seed (a must-not fact) names a
`negative_scaffold`, a script that makes it false. The free checks (`test/replay/cases.test.ts`) show every grader
failing on its seed or its known-bad scaffold, every `orbit_output` grader failing on a trace holding the typed
command, the loaded body and a listing of the seeded trail but no orbit answer, and on orbit's own `--boot` answer over
the seed, and every grader passing on the state its command leaves. A file no orbit command reads once the session ends
(the explore case's `explore.md`) gets no file grader: it is graded only through what orbit wrote from it.

Named limits: a session that hand-writes a file orbit then accepts as its own (a well-formed emit at a trail path)
passes an `orbit` grader that reads it; only the `regex` over orbit's printed path catches that, and every case holds
one. A Bash call that runs orbit and another command (`orbit status; echo …`) contributes its whole output, so text the
other command prints is read as orbit's.

## The comparison

`npm run replay:compare -- <baseline.json> <cut.json>` checks completeness first: a case the cut lacks, a baseline
grader it lacks, or fewer graded runs than a side's run count makes that case INCOMPLETE, with no verdict. Then each
fact of the complete cases:

| baseline | cut | |
|---|---|---|
| passed every run | passes every run | held |
| passed every run | fails a run | a regression |
| passed only some runs | any | reported with its spread, not judged |
| failed every run | any | reported; a cut that makes it pass is noted |

Each case also shows pass rate, turns and cost as mean ± standard deviation on each side. It warns first when the
records' models or Claude Code versions differ, or when the two sides' sessions loaded different skills, and notes each
side's skills that are not orbit's (the same on every record of one machine). It exits non-zero on any regression or
incomplete case. A cut is
"no worse" exactly when every case is complete and nothing regressed.

## Files

- `run.mjs`, `compare.mjs` — the runner and the comparison.
- `lib/` — `build.mjs` (work-directory check, CLI build), `fixture.mjs`, `trace.mjs`, `graders.mjs`, `seed.sh` and
  `seed-walk.mjs` (the scaffolds' helpers).
- `shim/orbit` — the walk-up shim.
- `project/` — the project every fixture starts from.
- `cases/` — the six cases.
- `results/` — committed records (a baseline's record is committed).
