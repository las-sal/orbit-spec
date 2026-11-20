<!--
Implementation chunks:
  Chunk 1 (groups 1-2): the harness, then the six cases
  Chunk 2 (groups 3-4): the free checks, and the CI validation
  Chunk 3 (group 5): the README, the full suite, and the three billed runs Sal starts
-->

## 1. The harness (design Decisions 1, 2, 3, 6 and 7)

- [x] 1.1 Run the full `npm test` for the baseline count. Create `replay/` with `shim/orbit` (the walk-up shim from
  `orbit/changes/replay-set/sketches/spike-files/orbit-shim.sh`, made executable), `cases/`, `project/`, `results/` and
  `lib/`. Add
  the `replay`, `replay:compare` and `validate:skills` scripts to `package.json`, and check by reading `files` that no
  entry reaches `replay/`
- [x] 1.2 Add `replay/lib/build.mjs`. It holds the work-directory check (refuse a directory inside a git work tree, or
  below a `CLAUDE.md` or a `.claude/` other than the home directory's), and the per-commit CLI build: a detached worktree
  at `--ref` under `<os.tmpdir()>/orbit-replay/build/`, `npm ci`, `npm run build`, `npm pack`, `npm install <tgz>
  --omit=dev --ignore-scripts` into `<os.tmpdir()>/orbit-replay/cli/<sha>/` (the cache, outside every run's work
  directory), then `git worktree remove --force` of the build worktree
- [x] 1.3 Add `replay/lib/fixture.mjs`, Case 4's recipe:
  - `git init` with a fixed author, `.gitignore` holding `.orbit-cli`, the `.orbit-cli` symlink;
  - `orbit init --tools claude` through the shim;
  - the case's `scaffold.sh`, then one commit;
  - the `start` checks;
  - applying a case's `break` (delete a heading's section from the installed skill file) and a grader's
    `negative_scaffold`
- [x] 1.4 Add `replay/lib/trace.mjs` and `replay/lib/graders.mjs`:
  - **the trace reader:** the `system`/`init` record's model and skills; the `result` record's `total_cost_usd`, turns,
    duration and end reason; `orbit_output` built only from the `tool_result`s paired by id with Bash `tool_use`s whose
    command runs `orbit`;
  - **the three grader types:** `file_exists` with `absent`, `regex` over `orbit_output` or `file:<path>`, and `orbit`
    with `args`, `path`, and `equals`/`matches`/`exists`, parsed from Markdown files with YAML frontmatter. No type reads
    a tool input or a Skill result. A `file_exists` grader or a `regex` over a file carries `pairs_with`, naming a
    grader whose fact only orbit's answer makes true about the same file, which names that file in `about`
- [x] 1.5 Add `replay/run.mjs`:
  - **arguments:** refuse to start without `--model` or `--max-total-usd`; `--ref`, `--runs` (default 3), `--cases`,
    `--label` (default `run`), `--broken`, `--workdir`, `--cli <dir>` (an installed CLI, skipping the build) and
    `--results <dir>`;
  - **the session:** `claude --version` recorded; cases run in sequence, each in a fresh fixture, with the argv design
    Decision 7 gives and the shim's directory first on `PATH`;
  - **the ceiling:** a session starts only when the spend so far plus its case's `max_budget_usd` stays within
    `--max-total-usd`; otherwise the rest are recorded as not run and the exit is non-zero;
  - **a session that does not finish:** it is killed at its case's `timeout_minutes` (default 30). Any session whose
    trace has no `result` record, or one with no numeric `total_cost_usd`, counts its whole `max_budget_usd` as spent and is recorded with its reason and no
    grades;
  - **the record:** written to `<results>/<YYYY-MM-DDTHH-MM-SSZ>-<sha7>-<label>.json`, refusing to start when that file
    exists, with every field of `A run's record names its build, its model, its cost and every fact's grade`
- [x] 1.6 Add `replay/compare.mjs`:
  - a completeness check first: a case the cut lacks, a baseline grader it lacks, or fewer graded runs than a side's
    run count makes the case incomplete, listed with what it lacks and given no verdict;
  - an exported classifier over D-rs-9's four rows for the complete cases, with a grader only the cut holds listed as
    new;
  - mean ± standard deviation per case of pass rate, turns and cost;
  - the model and Claude Code version warning first;
  - a non-zero exit on any regression or incomplete case.

  Add `test/replay/compare.test.ts` beside it: the four rows, an incomplete case (a run not run at the ceiling, a
  missing grader), a new grader, the warning and the exit codes, on hand-written records. Tag the three comparison
  scenarios `behaviour`

## 2. The six cases (design Decisions 4 and 5)

Before writing each case's graders, read the fields they name from the engine (`orbit status --change <name> --json`,
the emit filenames under `.orbit-runs/`, `orbit validate`). Never take them from design Decision 5's table. Each seed is
the pass-and-walk sequence the default cadence `[invoked, in-context]` reads, and each case's `start` checks name the
gate states it must reach by the engine's gate ids (`review-proposal`, `apply`, `review-system`). Every file fact is
paired with a fact orbit's answer makes true (`pairs_with`).

- [x] 2.1 Add the shared fixture project under `replay/project/` (a Node script and one baseline capability spec) and the
  `explore` case (`/orbit:explore <name>`, its prompt saying to stop after the premise). Its graders: the
  exploration listed as exploring in bare `orbit status --json` (orbit's reading of the `explore.md` the session writes,
  `about` that file), `explore.md` existing paired with it, and the explore emit in its trail paired with the emit path
  orbit printed when it wrote it
- [x] 2.2 Add the `propose` case. Its seed is a staged exploration whose decisions are facts and scope only, seeded as
  `/orbit:explore` leaves one (`explore.md` and its explore emit under `orbit/explore/<name>/`). Its graders: the four
  artifacts done in `orbit status --change <name> --json`, `orbit validate <name>` passing, the staging directory gone,
  and a propose emit
- [x] 2.3 Add the `apply` case. Its seed is a proposed change holding, through `orbit emit`, a fresh proposal pass, its
  walk, and a later in-context proposal pass with no substantive findings, with a `start` check that `review-proposal`
  has passed. Its graders: the `apply` gate passed (every task checked) and an apply emit. Its must-not grader (no
  review emit, no-chaining) names a `negative_scaffold`
- [x] 2.4 Add the `review` case: an applied change (`apply` passed) holding a fresh system pass and its walk, so the
  typed `/orbit:review <name>` fills `review-system`'s in-context slot. Its graders: an in-context system review emit,
  and the `review-system` gate state that reads it
- [x] 2.5 Add the `walk` case: the `review` seed plus an in-context system pass whose findings are obvious fixes only
  (`/orbit:address-reviews <name>`, its prompt ratifying the recommendations). Its graders: a walk emit closing every
  finding, and `review-system` passed
- [x] 2.6 Add the `archive` case: the walked state, with a `start` check that `review-system` has passed. Its graders: the change under
  `orbit/changes/archive/<date>-<name>/`, the delta's requirement in `orbit/specs/`, and an archive emit. Give each of
  the six cases a `break` naming the section whose deletion should fail its named grader

## 3. The free checks (`orbit-replay-set`'s scenarios)

- [x] 3.1 Add `test/replay/runner.test.ts`, with a stub `claude` first on `PATH` that writes a marker and prints a canned
  stream-json trace with a fixed cost, the run given `--cli` (the repository's own build, laid out as in 3.2) and a
  temporary `--results`:
  - no session without `--max-total-usd`;
  - a seed missing its start state bills nothing;
  - the ceiling stops further sessions;
  - a session with no result record counts its whole budget;
  - the record holds every case and run, and a second run refuses to overwrite it;
  - the shim runs the nearest copy and exits 127 with none;
  - `package.json`'s `files` reaches nothing under `replay/`.

  Tag each scenario `behaviour`
- [x] 3.2 Add `test/replay/cases.test.ts`, building every case's seed with the repository's own build: a temporary
  `.orbit-cli/node_modules/orbit-spec` symlinked to the repository root, so the shim finds it as in a billed run:
  - a seed command reaches that build;
  - six cases (directories holding `case.yaml`), one per lifecycle command;
  - every file grader names a `pairs_with` grader that orbit's answer makes true, whose `about` is the file grader's own
    path;
  - every `start` check passes on its seed;
  - every grader fails on its seed or its negative scaffold;
  - every `orbit_output` grader fails on a synthetic trace holding the typed command and the skill body as a loaded
    Skill result.

  Show the oracle can fail: a grader deliberately matching the typed command is caught by the synthetic trace and
  reverted. Tag the scenarios `behaviour`

## 4. The CI validation (design Decision 10)

- [x] 4.1 Add `scripts/validate-skills.mjs`. It generates the surface in a temporary directory with
  `node <repo>/bin/orbit.js init --tools claude` and runs `claude plugin validate --strict` over its `.claude/`, using the
  `claude` on `PATH` at the pinned 2.1.329 or else `npx --yes @anthropic-ai/claude-code@2.1.329`, with
  `DISABLE_AUTOUPDATER=1`. Then:
  - add a failing CI step running `npm run validate:skills` on the Linux leg after the size report, and name the script
    in `scripts/README.md`;
  - run it locally and show it failing on a surface whose skill lost its `description`;
  - declare `A malformed skill fails the check` in `orbit/scenario-ledger.yaml` as `untestable` (the validator is not
    installed where `npm test` runs), its `why` citing that measurement

## 5. Close

- [x] 5.1 Write `replay/README.md`: what the replay set is and is not (never shipped, billed, Sal-started), the commands,
  a case's folder shape and how to add one, what a grader may read, the comparison's rows, and the costs the billed runs
  record. Run the full `npm test`, `npx tsc --noEmit`, `npm run lint` and `node bin/orbit.js validate replay-set --strict`,
  and report the count against 1.1's
- [ ] 5.2 (User-validation) Sal starts the plumbing run:
  `npm run replay -- --model sonnet --runs 1 --max-total-usd 8 --label plumbing`. Every case reaches its session, every
  trace is graded, and the record shows each case's cost. (The ceiling is 8, not 3: the runner reserves each case's
  whole `max_budget_usd`, up to $4, before starting it, so a $3 ceiling stops the run after the explore session.)
- [ ] 5.3 (User-validation) Sal starts the broken-body run on Sal's model, one run a case, with a ceiling sized from
  5.2's costs: `npm run replay -- --model <Sal's model> --runs 1 --broken --max-total-usd <usd> --label broken`. In
  every case its `break`'s named grader fails. A grader that does not fail is repaired (or its `break` moved to a step
  the model cannot recover) and the case re-run before 5.4
- [ ] 5.4 (User-validation) Sal starts the baseline on Sal's model, three runs a case, with a ceiling sized from 5.2's
  costs: `npm run replay -- --model <Sal's model> --max-total-usd <usd> --label baseline`. Its record is committed under
  `replay/results/`, and its total cost goes into the stage's `Shipped as`

At archive (the archive's own steps, not a task): after the sync adds `orbit/specs/orbit-replay-set/`, its Purpose is
written in place, and CLAUDE.md's `src:capabilities` figure moves from 34 to 35 under `orbit validate --sources`.
