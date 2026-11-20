> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: replay-set

## Premise

`reduce-orbit-phase2`'s first stage (R-rop2-2, R-rop2-5): a replay set that runs orbit's built skills as real headless
Claude Code sessions on fixed tasks, several runs each, graded by facts orbit records (the emits a session wrote and
their fields, the gates' states, the records the engine refused), so that every later cut meant to keep behaviour is
compared before and after (G3). It is a development-time check in this repository, never shipped, started by Sal and
billed per session. Its spike comes first: can `claude plugin eval` grade orbit's facts, and does Anthropic's
`skill-creator` skill, tried beside it, grade them better or say more about whether a difference between runs is real?
Failing both, a small `claude -p` runner of this repository's own. What this exploration has to settle: what a case is,
how its fixture project is built and how the session reaches this repository's own CLI, what grades it, which cases
the set holds, and what a run costs.

## Mechanism

### D-rs-1 — every case session reaches this repository's built CLI, by a shim first on its `PATH`
Domain: every way a case session can invoke an `orbit` CLI
| member | covered by |
|---|---|
| a bare `orbit` in a skill body | the shim, first on `PATH` |
| a bare `orbit` in a skill's reference file | the shim, first on `PATH` |
| `npx orbit` or `node bin/orbit.js` in a body or reference | none exists (grep over the generated skills: zero hits) |
| `orbit` typed by the session on its own | the shim, first on `PATH` |
| the global install the shim shadows | reached only if the runner drops the inherited `PATH`: the spike's first check |
Closure: SOURCED — the invocation forms are those a grep of the generated skills finds (bare `orbit` only: 248 mentions in references, every body's command lines), plus what a session types, which resolves through the same `PATH`
Moves:
- READ: applied — `which orbit` is `~/.npm-global/bin/orbit` at 2.0.2 and lacks `decisions status`; the repo's build reports the same version
- ENUMERATE: applied — this table, from the grep over `.claude/skills/`
- COHERE: applied — one shim serves every bare call, so bodies and references cannot reach different builds
- EXECUTE: not applied — no run yet; the spike runs it
- FALSIFY: applied — a runner that resets `PATH` would silently use the stale CLI; the spike checks a call only the new build answers (`orbit decisions status`)
- CONFORM: applied — R-rop2-2 (never shipped: the shim lives in the harness, not in any body)
- FEASIBILITY: not applied — one small script
- CONSUME: applied — every grader reads what this CLI printed or wrote, so a stale CLI would corrupt every grade
- INVOKE: applied — the harness sets `PATH` before every run

### D-rs-2 — a case is one typed command on a fixture project seeded at the state just before it
Domain: what a case must fix so two runs of it are comparable
| member | covered by |
|---|---|
| the project's state when the session starts | the seeded fixture, the same for every run |
| what the user types | one command, written in the case |
| which skill body is under test | the one that command launches |
| what counts as success | the facts the case names that the command must leave |
| the settings | the defaults, unless the case names a setting (D-rs-3) |
Closure: DERIVED — a session's outcome is a function of its starting state, its input, the body it loads and its settings; the four rows fix each, and the fifth names the grade
Moves:
- READ: applied — the lifecycle commands each start from a state another command leaves, which a fixture can seed
- ENUMERATE: applied — this table
- COHERE: applied — one command per case makes a cut to one body comparable on exactly the cases that run it
- EXECUTE: not applied — no case built yet
- FALSIFY: applied — a whole-lifecycle case would grade a late command on earlier steps' luck; rejected for that
- CONFORM: applied — G3 (each cut graded before and after) needs cases that isolate one body
- FEASIBILITY: applied — six fixtures, small changes with two or three tasks each, keep each run short
- CONSUME: applied — the grade comparison reads one result per case, run by run
- INVOKE: applied — the harness runs every case on each before/after run Sal starts

### D-rs-7 — the replay set runs on a `claude -p` runner of this repository's own, graded by orbit's commands
Domain: what a run needs from its runner
| member | covered by |
|---|---|
| orbit's skills loaded as a user has them | `orbit init --tools claude` in the fixture (Case 4: 15 skills, 15 launchers) |
| the typed command run as a slash command | `claude -p "<command>"` (Case 4: the launcher resolved) |
| the shell able to write orbit's records | an unsandboxed session in the fixture (Case 4: the emit was written) |
| your own settings kept out | `--setting-sources project` |
| a ceiling on cost and length | `--max-budget-usd`, `--max-turns` |
| a trace to read | `--output-format stream-json --verbose` |
| the grade | orbit's commands run in the fixture afterwards, and the trace |
Closure: DERIVED — a run is a session (its skills, its input, its permissions, its limits) followed by a grade; each part has its row
Moves:
- READ: applied — `claude --help` lists every flag used; Case 4 ran them
- ENUMERATE: applied — this table
- COHERE: applied — grading after the run in the same fixture reads exactly what the session left
- EXECUTE: applied — Case 4, one run, $0.14
- FALSIFY: applied — `--setting-sources project` keeps settings out but not necessarily user-level skills or memory; the runner's record lists the skills the session's init reported, and a stray one shows there
- CONFORM: applied — R-rop2-2 (its fallback), D-rs-2, R-adf-5 (the fixtures are throwaway projects, never orbit-spec)
- FEASIBILITY: applied — about $0.14 and five turns for the smallest case
- CONSUME: applied — D-rs-9's comparison reads one grade per fact per run
- INVOKE: applied — Sal starts it before and after a cut (G3)

### D-rs-8 — every grader grades what orbit printed or wrote, and is shown failing on a known-bad run
Domain: what a grader can read
| member | covered by |
|---|---|
| orbit's printed output in the trace | allowed |
| the files orbit wrote in the fixture | allowed |
| orbit's commands run after the session | allowed |
| the command line the session typed | refused: Case 2's first false pass |
| the skill body's text, recorded in the trace | refused: Case 2's second false pass |
| the session's own final message | allowed only for what orbit itself printed into it |
Closure: SOURCED — a stream-json trace holds tool calls, tool results, the loaded skill and the assistant's text; the fixture holds files; the rows are those sources
Moves:
- READ: applied — Case 2's two false passes, read from the kept trace
- ENUMERATE: applied — this table, from the trace's record kinds
- COHERE: applied — the negative run is the same check that caught both false passes
- EXECUTE: applied — the corrected pattern failed on the broken trace and passed on orbit's real answer
- FALSIFY: applied — a grader shown failing on one bad run may still pass another; each fact's grader gets the bad run its fact makes most likely
- CONFORM: applied — R-rop-15's "graded by orbit's computed facts"; phase 1's oracle-must-fail practice
- FEASIBILITY: applied — the negative run is a kept trace or a hand-broken fixture, no billed session
- CONSUME: applied — D-rs-9 trusts a grade only because this rule made it falsifiable
- INVOKE: applied — when a grader is written, before it joins the set

### D-rs-9 — a cut is "no worse" when every fact that passed in all baseline runs passes in all of its runs
Domain: a fact's results across the baseline runs and the cut's runs
| member | covered by |
|---|---|
| passed every baseline run, passes every cut run | held |
| passed every baseline run, fails a cut run | a regression |
| passed only some baseline runs | reported with its spread, not judged |
| failed every baseline run | reported; a cut that makes it pass is noted |
Closure: DERIVED — the baseline either passed a fact every time, some times or never; each crossed with the cut's result is a row
Moves:
- READ: applied — `skill-creator`'s `aggregate_benchmark.py` reports pass rate, time and tokens as mean ± stddev
- ENUMERATE: applied — this table
- COHERE: applied — a regression needs a fact the baseline made reliable, so noise in an unreliable fact never blocks a cut
- EXECUTE: not applied — no baseline run yet
- FALSIFY: applied — three runs can miss a rare failure; a fact found flaky in the baseline is reported, and its case's run count can be raised
- CONFORM: applied — G3 (graded before and after)
- FEASIBILITY: applied — counts per fact, no statistics library
- CONSUME: applied — the report Sal reads before a cut lands
- INVOKE: applied — every comparison of a cut's runs with the baseline's

### D-rs-10 — every run reaches a packed copy of the build under test, by a shim that finds it in the fixture
Domain: every way a run's session can invoke an `orbit` CLI
| member | covered by |
|---|---|
| a bare `orbit` in a skill body or reference | the shim, which finds `.orbit-cli/` above the session's directory |
| `npx orbit` or `node bin/orbit.js` in a body or reference | none exists (grep: zero hits; 248 bare mentions in references) |
| `orbit` typed by the session on its own | the shim |
| the stale global install | shadowed by the shim; a missing `.orbit-cli/` exits 127 rather than falling through |
| the repository's working tree | never read by a run: a cut's before and after are two packed commits |
Closure: SOURCED — the invocation forms are those the grep of the generated skills finds, and the shim is the one `orbit` on `PATH`
Moves:
- READ: applied — Case 3 (a sandbox hides the repository) and Case 4 (the shim reached the packed build)
- ENUMERATE: applied — this table
- COHERE: applied — one packed copy per fixture means bodies and references cannot reach different builds
- EXECUTE: applied — Case 4 answered `decisions status`, a command only the new build has
- FALSIFY: applied — the shim exits 127 instead of falling through to the stale install, so a missing copy fails loudly
- CONFORM: applied — R-rop2-2 (never shipped: the shim and the copy live in the harness)
- FEASIBILITY: applied — 18 MB a packed build, shared by symlink across one run's fixtures
- CONSUME: applied — every grade reads what this CLI printed or wrote
- INVOKE: applied — the runner places the copy and sets `PATH` before every run

### Case 1 — the stale and hidden CLI (spike runs 1 and 2, `claude plugin eval`)
The shim pointed at the repository's `bin/orbit.js`, which the runner's sandbox hides: every `orbit` call failed with
`Cannot find module`. The session wrote `explore.md` with the Write tool and reported the scaffold done (D-rs-11).
Runs: $0.14 and $0.15, Sonnet, six and seven turns.

### Case 2 — two graders that passed a broken run
The first g1 matched `decisions status`, the command the session typed. The second matched `write: false`, which the
skill body itself says, and the trace records the body when it loads. Both passed run 2, where the CLI never answered.
The pattern that held: `write\W{1,4}false.{1,14}readers`, orbit's JSON answer, checked failing on run 2's trace and
passing on the answer itself.

### Case 3 — the sandbox's read-only shell (spike runs 3 and 4)
Run 3 never started: `add_dirs` outside the case directory is refused. Run 4 copied the packed CLI into the workspace
by scaffold: `orbit decisions status` answered, but `mkdir` and `orbit emit` failed with "Read-only file system",
while the Write tool succeeded. No emit could be written. $0.16, nine turns.

### Case 4 — the fallback runner (`claude -p` in a fixture)
A fixture with orbit's skills installed by `orbit init --tools claude`, the packed CLI as `.orbit-cli/`, the shim on
`PATH`; `claude -p "/orbit:explore spike-probe …" --model sonnet --max-turns 15 --max-budget-usd 1 --setting-sources
project`. The session's init listed 15 orbit skills; the launcher ran `orbit-explore`; `decisions status` answered;
the begin emit was written at `orbit/explore/spike-probe/.orbit-runs/explore-2026-11-20T16-37-56Z.json`, found
afterwards by listing the trail. $0.14, five turns.

## Decisions

- **2026-11-20 — D-rs-1: every case session reaches this repository's built CLI, by a shim first on its `PATH`** Sal's
  direction to settle the exploration on the AI's recommendations. The `orbit` on `PATH` here is an older build
  reporting the same version, 2.0.2, without `orbit decisions status`, so a session using it runs the new bodies
  against a CLI missing their commands. Each run's `PATH` starts with a directory holding an `orbit` that execs
  `node <repo>/bin/orbit.js`, and the run's record names the commit that build came from. Whether the eval runner's
  sessions inherit that `PATH` is the spike's first check.
  Kind: rule
  Disposition: superseded D-rs-10
- **2026-11-20 — D-rs-2: a case is one typed command on a fixture project seeded at the state just before it** Sal's
  direction, as above. A whole lifecycle in one session would make a late step's grade depend on every earlier step's
  luck and cost a full lifecycle per run; one command on a seeded fixture grades that command's body alone, and a cut
  to one body is compared on the cases that run it. Each case names its fixture, its typed command and the facts that
  command must leave.
  Kind: rule
- **2026-11-20 — D-rs-3: the set starts with six cases, one per default lifecycle command** A named explore, propose,
  apply, the in-context system review, the walk and archive, all at default settings; a case for a mode or a setting
  is added when a cut first touches text that only it reads.
  Kind: scope
- **2026-11-20 — D-rs-4: graded runs use the model Sal works with, three runs a case, under a cost ceiling** The
  baseline run's cost is recorded before any cut is graded; the spike alone runs on a cheaper model with one run, since
  it tests the plumbing, not a body.
  Kind: scope
- **2026-11-20 — D-rs-5: the spike is one named-explore case, run once, testing four things before any case is designed**
  Its plan is `sketches/spike.md`: whether the sessions reach the shim (D-rs-1), whether orbit's skills and its
  `/orbit:<command>` launchers load and resolve as a plugin, whether a timestamped emit can be graded, and whether a
  grader can be shown to fail. Then `skill-creator` is read for what its evals and variance analysis add.
  Kind: scope
- **2026-11-20 — D-rs-6: `claude plugin eval` cannot host orbit's cases** Five spike runs on Sonnet, $0.59 in all
  (Cases 1 to 3): the eval runner's OS sandbox gives shell tools a read-only workspace, so `orbit emit` cannot create
  `.orbit-runs/` and no record orbit keeps can be written from the shell; it has no operator flag to grant writes; it
  refuses `context.add_dirs` outside the case directory; and it deletes the workspace and trace unless `--keep-temp`.
  The launcher, the skill and the CLI shim all worked inside it; the writes did not. Anthropic's `skill-creator`,
  tried beside it, runs a case as a subagent of the current session reading the skill by path, graded by a model, so it
  is not a real session typing a command (D-rs-2) and does not grade orbit's facts.
  Kind: fact
- **2026-11-20 — D-rs-7: the replay set runs on a `claude -p` runner of this repository's own, graded by orbit's commands**
  R-rop2-2's fallback, taken on D-rs-6 and proven by Case 4: each run builds its fixture (a git repository with orbit's
  skills installed as project skills by `orbit init --tools claude`, then the case's seeded state), runs
  `claude -p "<the case's command>" --model <m> --max-turns <n> --max-budget-usd <c> --setting-sources project
  --allowedTools "Bash Read Write Edit Glob Grep Skill" --no-session-persistence --output-format stream-json --verbose`
  in it, and grades afterwards by running orbit's own commands in the fixture (`orbit status --change <name> --json`,
  the trail's listing, `orbit validate`) and reading the stream-json trace. Cases keep the folder shape `plugin eval`
  uses (`prompt.md`, a scaffold, `graders/`), so they stay portable if its sandbox ever allows shell writes.
  Kind: rule
- **2026-11-20 — D-rs-8: every grader grades what orbit printed or wrote, and is shown failing on a known-bad run** In the
  spike two plausible patterns passed a broken run: one matched the command the session typed, the other the skill
  body's own text, which the trace records when the skill loads (Case 2). A grader reads orbit's output or the files it
  wrote, never the session's command line or the body's wording, and before it joins the set it is run against a trace
  or fixture where its fact is known false and seen to fail.
  Kind: rule
- **2026-11-20 — D-rs-9: a cut is "no worse" when every fact that passed in all baseline runs passes in all of its runs, and
  the report shows each case's pass rate as mean and spread** The rule the open question carried as interim, kept: with
  three runs a case, a fact that the baseline passed every time and the cut fails even once is a regression, and a fact
  the baseline already passed only sometimes is reported, not judged. From `skill-creator` the report takes its
  aggregation, pass rate, turns and cost per case as mean ± standard deviation across runs, so a difference is read
  beside the spread it sits in.
  Kind: rule
- **2026-11-20 — D-rs-10: every run reaches a packed copy of the build under test, by a shim that finds it in the fixture**
  Supersedes D-rs-1. The fixture holds the build as `.orbit-cli/` (`npm pack` of the commit under test, installed with
  `--omit=dev --ignore-scripts`), and the shim first on `PATH` walks up from the session's directory to it, so a
  before run and an after run each use their own commit's CLI side by side, and the run's record names that commit.
  Kind: rule
- **2026-11-20 — D-rs-11: on a broken CLI the explore body let the session improvise by hand** Case 1: with `orbit`
  failing, the session wrote `explore.md` with the Write tool "because the orbit CLI is broken", and reported the
  scaffold done. A body that tells the session to stop when an orbit command fails, rather than imitate it, is a
  candidate for the `inventory` stage's list.
  Kind: fact

## Open questions

## Considered & out

- **2026-11-20 — `claude plugin eval` as the runner:** its sandbox gives the shell a read-only workspace, so orbit's CLI
  cannot write its records (D-rs-6, Case 3). Re-entry: a release of the runner that grants shell writes.
- **2026-11-20 — `skill-creator` as the runner:** its cases run as subagents reading the skill by path, graded by a
  model, not as real sessions typing a command and graded by orbit's facts (D-rs-6); its mean ± spread aggregation is
  kept (D-rs-9).

- **2026-11-20 — A whole lifecycle per case:** a late step's grade would depend on every earlier step, and each run
  would cost a full lifecycle (D-rs-2).

## References

- `orbit/architecture/reduce-orbit-phase2.md` — R-rop2-2, R-rop2-5, G3 and stage `replay-set`'s charter and exit criteria
- `orbit/architecture/reduce-orbit-phase1-brief.md` — the brief's S15 and section 7 (how to verify)
- `claude plugin eval --help` (Claude Code 2.1.328) — the runner's flags: `--runs`, `--model`, `--max-cost-usd`,
  `--scaffold`, `--ablation`, `--json`, `--no-publish`, `--trust-plugin`
- `orbit/explore/replay-set/sketches/spike.md` — the spike's setup, its five checks and what each outcome leads to (D-rs-5)
- `orbit/explore/replay-set/sketches/spike-files/` — the spike's eval case, graders, scaffold and walk-up shim, and the
  fallback runner's command and fixture as Case 4 ran them
