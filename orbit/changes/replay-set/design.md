## Context

This is stage `replay-set` of `reduce-orbit-phase2`, the program's first. Its goal G3 holds every later cut meant to keep
behaviour until a replay set has graded it before and after (R-rop2-2). The exploration settled the instrument and ran
the spike (see explore.md, Cases 1 to 4):

- `claude plugin eval` loads orbit's skills and launchers and reaches a shimmed CLI, but its OS sandbox makes the shell's
  workspace read-only. `orbit emit` therefore cannot create `.orbit-runs/`, and no record orbit keeps can be written
  (D-rs-6, Case 3).
- `skill-creator` runs a case as a subagent reading the skill by path and grades it with a model. That is not a real
  session typing a command, and it does not grade orbit's facts (D-rs-6). Its mean ± spread aggregation is kept (D-rs-9).
- A plain `claude -p` session in a fixture project worked: orbit's skills installed as project skills, the launcher
  resolved, the shimmed packed CLI answered `orbit decisions status`, and the explore emit was written at its timestamped
  path, for $0.14 and five turns (Case 4, D-rs-7).
- Two plausible graders passed a broken run. One matched the command the session typed, the other the skill body's own
  text, which the trace records when the skill loads (Case 2, D-rs-8).
- The `orbit` on Sal's `PATH` is an older 2.0.2 build without `orbit decisions status`, so a session must reach the build
  under test, never the global install (D-rs-1, superseded by D-rs-10).

The stage's exit criteria are:

- the runner chosen, which the exploration did;
- six cases each shown able to fail on a deliberately broken body;
- one baseline run with its cost;
- `claude plugin validate` in CI (R-rop2-5).

The spike's files are kept in `sketches/spike-files/` (an eval case, its graders, its scaffold and the walk-up shim).

Constraints:

- **Never shipped (R-rop2-2):** no command, skill, body or reference is added, and nothing under `package.json`'s
  `files` changes.
- **Billed runs are Sal's:** every billed session is started by Sal, and `npm test` and CI start none.
- **Fixtures are throwaway projects, never orbit-spec (R-adf-5).**

## Goals / Non-Goals

**Goals:**

- A runner Sal starts as `npm run replay -- …`:
  - it builds one commit's CLI, builds a fixture per case and run, runs one `claude -p` session in each, and grades it;
  - it writes one record per run.
- Six cases on fixture projects, one per default lifecycle command (D-rs-3), each seeded at the state just before its
  command (D-rs-2).
- Graders that read only orbit's output and files, each shown failing on known-bad input free in `npm test` (D-rs-8).
  Each case is also shown failing on a deliberately broken body in one billed run.
- A comparison that says whether a cut is "no worse" than a baseline (D-rs-9).
- `claude plugin validate --strict` over a generated skill surface, in CI and as `npm run validate:skills`.
- A committed baseline record on the bodies as phase 1 left them, with its cost.

**Non-Goals:**

- Cases for modes or settings (the external review, the blind pair, chained runs, `pr:` regimes). Each is added when a
  cut first touches text only it reads (D-rs-3).
- Grading a session's judgement or prose. A replay grade is a fact orbit recorded, never a model's opinion of the
  session.
- Running billed sessions in CI, or on a schedule.
- Acting on D-rs-11 (the explore body let a session improvise on a broken CLI). It is input to the `inventory` stage.
- Any change to an installed body, reference, launcher or CLI answer.

## Decisions

### 1. The harness lives in `replay/`, in plain Node modules, outside `files`

`replay/` holds:

- `run.mjs` (the runner) and `compare.mjs` (the comparison);
- `lib/` (fixture building, trace reading, graders, records);
- `shim/orbit` (the walk-up shim, from `sketches/spike-files/orbit-shim.sh`);
- `cases/<id>/` (the six cases: a case is a directory holding `case.yaml`);
- `project/` (the small project every fixture starts from, outside `cases/`);
- `results/` (committed records);
- `README.md` (how to run it, what it costs, how to add a case).

It uses only Node's standard library and the repository's existing `yaml` dependency. It stays out of `src/` because
`src/` compiles into `dist/`, which ships. Its free checks are vitest files under `test/replay/`, so `npm test` runs them
with the rest of the suite. `package.json` gains three scripts: `replay`, `replay:compare` and `validate:skills`.

Chosen over TypeScript under `scripts/`. The repository's other scripts are `.mjs` run by `node`, and a TypeScript runner
would need a build step that `npm test` does not run for `scripts/`.

### 2. A run builds its commit's CLI once and shares it across fixtures (D-rs-10)

The runner resolves `--ref` (default `HEAD`) to a commit, then:

1. adds a detached `git worktree` at that commit under `<os.tmpdir()>/orbit-replay/build/`;
2. runs `npm ci`, `npm run build` and `npm pack` there;
3. installs the pack into `<os.tmpdir()>/orbit-replay/cli/<sha>/` with `npm install <tgz> --omit=dev --ignore-scripts`;
4. removes the build worktree (`git worktree remove --force`), so no run leaves one registered in this repository.

The installed CLI is cached by commit outside every run's work directory, so a second run on the same commit skips the
build. `--cli <dir>` skips the build entirely and uses an already-installed CLI directory of the same layout: the free
checks' seam (decision 6): its record names that directory in place of a commit, its filename carries `local` in place
of the commit hash, and it is never a baseline. Each fixture's `.orbit-cli` is a
symlink to that directory, which the spike's walk-up shim (`.orbit-cli/node_modules/orbit-spec/bin/orbit.js`, exit 127
when absent) finds. A dirty working tree is irrelevant to a run, because a run reads only the commit: uncommitted body
edits are never graded, so a cut is graded only once it is committed, and the runner prints the commit it built.

### 3. The work directory is outside every repository and every `CLAUDE.md`

Claude Code loads `CLAUDE.md` files and project settings from the session's directory upward. A fixture nested in
orbit-spec would hand every session this repository's CLAUDE.md and `.claude/` surface. The work directory defaults to
`<os.tmpdir()>/orbit-replay/<run-id>/` (`--workdir` overrides it). Before building anything, the runner refuses one that:

- sits inside a git work tree;
- has a `CLAUDE.md` or a `.claude/` directory in any ancestor below the filesystem root, other than the user's home
  directory's own `.claude/`.

Records are written back into `replay/results/` in the repository (`--results <dir>` overrides it, so the free checks
write into a temporary directory and never into the tree); the work directory is not cleaned, so its traces stay
readable after a run (the record names it).

### 4. A case is `prompt.md`, `case.yaml`, `scaffold.sh` and `graders/` (D-rs-2, D-rs-7)

The folder shape of the spike's `claude plugin eval` case is kept, so a case stays portable if that runner ever lets the
shell write:

- **`prompt.md`** is the typed text: the slash command on its first line, then, where the command would ask the user
  something, the answer stated up front ("Scaffold it, record that one sentence as its premise, and stop there; ask me
  nothing", as Case 4 ran). A `claude -p` session has no one to answer `AskUserQuestion`.
- **`case.yaml`** holds:
  - `max_turns`, `max_budget_usd` and `timeout_minutes` (default 30);
  - `start`: a list of `orbit`-type checks the seeded fixture must pass before the session is billed, for example the
    change's gate state;
  - `break`: the deliberately broken body for the case's broken-body run, naming the installed skill file, the section
    to delete (a heading anchor to the next heading of the same level) and the grader expected to fail.
- **`scaffold.sh`** seeds the fixture after `orbit init --tools claude`. It copies the case's `seed/` files and runs orbit's
  own commands through the shim (`orbit new change`, `orbit emit … --payload`), then commits, so the seeded trail and gate
  states are what the engine computes and never hand-written JSON that the engine would read differently.
- **`graders/`** holds one Markdown file per fact, with YAML frontmatter (the `plugin eval` grader form) and the fact in
  prose as its body.

A fixture is built as follows: `git init`, a fixed author, `.gitignore` holding `.orbit-cli`, the `.orbit-cli` symlink,
`orbit init --tools claude` through the shim, `scaffold.sh`, then one commit. This is Case 4's recipe.

### 5. The six cases share one small project and chain their seeds by construction (D-rs-3)

The fixtures are one tiny project, `replay/project/`: a Node script and one baseline capability spec. Each case's seed is the
state the previous command leaves, rebuilt by its own scaffold rather than taken from a previous run. That way a case
never depends on another's luck (D-rs-2's FALSIFY).

| case | typed command | seeded state | facts it must leave (graders, exact fields read from the engine at apply) |
|---|---|---|---|
| `explore` | `/orbit:explore <name>` with the topic and "stop after the premise" | project only | `orbit/explore/<name>/explore.md`; an explore emit in its trail |
| `propose` | `/orbit:propose <name>` | a staged exploration whose decisions are facts and scope only, so no Mechanism entry is owed | the change's four artifacts; `orbit validate <name>` passes; the staging directory moved; a propose emit |
| `apply` | `/orbit:apply <name>` | a proposed change whose `review-proposal` gate has passed: a fresh proposal pass, its walk, and a later in-context proposal pass with no substantive findings | every task checked (the `apply` gate passed); an apply emit; no review emit (no-chaining, a must-not fact with its own known-bad scaffold) |
| `review` | `/orbit:review <name>` | an applied change (the `apply` gate passed) holding a fresh system pass and its walk, so the typed review fills `review-system`'s in-context slot | an in-context system review emit; the `review-system` gate reading it |
| `walk` | `/orbit:address-reviews <name>` | the `review` seed plus an in-context system pass whose findings are obvious fixes only | a walk emit closing every finding; the `review-system` gate passed |
| `archive` | `/orbit:archive <name>` | the walked state, `review-system` passed | the change under `orbit/changes/archive/<date>-<name>/`; the delta synced into `orbit/specs/`; an archive emit |

Each seed is written as the sequence of passes and walks the engine's default cadence reads. Both reviewed gates
declare `[invoked, in-context]` (`schemas/spec-driven/schema.yaml`): the first slot needs a fresh or external pass, and
the in-context slot needs a pass later than the walk of that pass's findings. `apply` is a tracked gate, passed only
when every task is checked (`src/core/artifact-graph/gates.ts`). There is no gate named `archive`: `review-system`
guards it. Every case's `start` checks name the gate states its seed must reach in these ids, so a seed that misses one
fails in the free checks before any spend.

The exact grader fields (emit filename globs, JSON paths in `orbit status --change <name> --json`) are read from the
engine when each case is written (read-before-reference), not taken from this table. The apply case grades orbit's
facts only: whether the project's own code works is not one of them (D-rs-8; see Alternatives).

### 6. Three grader types, none able to read a tool input or a skill's text (D-rs-8)

- **`file_exists`:** `path` is a glob in the fixture, and `absent: true` inverts it.
- **`regex`:** `pattern` is matched against `target`, which is `orbit_output` or `file:<path>`. `orbit_output` is the
  concatenated RESULTS of the session's Bash calls whose command runs `orbit`. The runner pairs each `tool_use` with its
  `tool_result` by id and keeps only the result, so the command the session typed and the Skill tool's loaded body are
  excluded by construction, not by a careful pattern. These were Case 2's two false passes.
- **`orbit`:** `args` is an orbit command run in the fixture after the session (with `--json`). `path` is a dotted path
  into its answer, compared with `equals`, `matches` or `exists`.

A grader may name `negative_scaffold`: a script that makes its fact false on top of the seed, for facts that already hold
at the seed (the apply case's "no review emit"). A `file_exists` grader, or a `regex` over a file, names `pairs_with`:
the id of a grader of its case whose fact only orbit's answer makes true about the same file (an `orbit` grader reading
it, or a `regex` over `orbit_output` matching the path orbit printed), which names that file in `about`. A file the
session writes itself, such as the explore case's `explore.md`, pairs with orbit's reading of it (the exploration
listed in bare `orbit status --json`), never with a fact about another file. A file a session can write by hand never grades
alone: that was the spike's Case 1 (D-rs-11).

The free checks in `test/replay/` build each case's seeded fixture with the repository's own build, laid out as the
installed copy is: a temporary `.orbit-cli/node_modules/orbit-spec` symlinked to the repository root, whose `dist/` the
suite's setup builds. Node resolves the symlink, so the repository's own `node_modules` serves the dependencies, and the
shim finds `.orbit-cli/node_modules/orbit-spec/bin/orbit.js` as it does in a billed run. The checks then assert:

- a seed command reaches that build (it answers `orbit decisions status`, which the stale global install lacks);
- every file grader names a `pairs_with` grader of the kind above, whose `about` is the file grader's own path;
- every grader fails on the seed (or on its negative scaffold);
- every `orbit_output` grader fails on a synthetic trace holding the typed command and the skill's body as a loaded
  Skill result, but no `orbit` result;
- every case's `start` checks pass on its seed.

The case's broken-body run (decision 8) is the billed check that the case as a whole can fail.

### 7. The runner, its limits and its record (D-rs-7, D-rs-4)

`npm run replay -- --model <m> --max-total-usd <usd> [--ref <commit>] [--runs 3] [--cases a,b] [--label <l>] [--broken]
[--workdir <dir>] [--cli <dir>] [--results <dir>]` refuses to start without `--model` or `--max-total-usd`. In order, it:

1. checks the work directory (decision 3);
2. builds the CLI (decision 2);
3. records `claude --version`;
4. for each case and run, builds the fixture, runs the `start` checks, and runs:

   ```
   claude -p "<prompt.md>" --model <m> --max-turns <n> --max-budget-usd <c> --setting-sources project
     --allowedTools "Bash Read Write Edit Glob Grep Skill" --no-session-persistence
     --output-format stream-json --verbose
   ```

   It runs this in the fixture with the shim's directory first on `PATH`, writing the trace to `trace.jsonl` beside the
   fixture, then grades.

The trace's `system`/`init` record gives the model and the loaded skills, and its `result` record gives the cost
(`total_cost_usd`), turns, duration and how the session ended. Cases run in sequence: a run is a handful of sessions, and
sequence keeps the spend predictable against the ceiling. Before each session the runner RESERVES the case's
`max_budget_usd`: it starts the session only when the spend so far plus that budget stays within `--max-total-usd`, so
the ceiling holds even if the session spends its whole budget. Otherwise it records the rest as not run and exits
non-zero. Each session runs under the case's `timeout_minutes` (default 30); at the timeout the runner kills it. A
session whose trace has no `result` record (a crash, a kill, the timeout), or one with no numeric `total_cost_usd`,
counts its whole `max_budget_usd` as spent and is recorded with that reason and no grades.

The record goes to `replay/results/<YYYY-MM-DDTHH-MM-SSZ>-<sha7>-<label>.json` (label `run` by default; `local` in
place of `<sha7>` for a `--cli` run), with the
fields `orbit-replay-set`'s record requirement lists. The runner refuses to start when that file already exists. `--broken` applies each case's `break` to the installed skill file after `orbit init`, and the label
records it.

### 8. The billed runs, in order, each started by Sal

Three billed runs close the stage. Each is a `(User-validation)` task, so apply can complete without them and archive
reads them:

1. **Plumbing:** `--model sonnet --runs 1 --label plumbing`, all six cases, about $1, proves the runner end to end.
2. **Broken bodies:** `--model <Sal's model> --runs 1 --broken --label broken`, its ceiling sized from the plumbing
   run's costs. Each case's named grader fails, which is the exit criterion that each case is shown able to fail on a
   deliberately broken body.
3. **Baseline:** Sal's model, three runs a case, on the commit that holds this change's harness and phase 1's bodies
   unchanged (`--label baseline`). Its record is committed, and its cost goes into the stage's `Shipped as`.

The broken-body run uses Sal's model (Sal's ruling at the proposal walk, which keeps D-rs-4 whole): a stronger model may
recover from a deleted section by doing the step anyway, and a case that cannot detect a cut on the model that grades
the cuts must be found before the baseline, not after. A grader that fails to fail there is repaired, or its case's
`break` moved to a section the model cannot recover, before the baseline.

### 9. The comparison (D-rs-9)

`npm run replay:compare -- <baseline.json> <cut.json>` first checks completeness: a case the cut lacks, a baseline grader
it lacks, or a case with fewer graded runs than its side's run count makes that case INCOMPLETE, listed with what it
lacks and given no verdict. It then classifies every (case, grader) fact of the complete cases by D-rs-9's four rows
and prints, per case, the pass rate, turns and cost as mean ± standard deviation on each side. It warns first when the
records' models or Claude Code versions differ. It exits non-zero on any regression or any incomplete case, so a cut the
ceiling cut short is never reported "no worse". A grader only the cut holds is listed as new and not judged. The module exports its classifier so `test/replay/` checks the four
rows and the exit code without a billed run.

### 10. `claude plugin validate --strict` in CI over a freshly generated surface (R-rop2-5)

`scripts/validate-skills.mjs`:

1. makes a temporary directory and runs `node <repo>/bin/orbit.js init --tools claude` in it;
2. runs `claude plugin validate --strict <tmp>/.claude`;
3. exits with the validator's status.

The binary is the `claude` on `PATH` when its version matches the pinned one, and otherwise
`npx --yes @anthropic-ai/claude-code@<pinned>`, with `DISABLE_AUTOUPDATER=1`. The pin is 2.1.329, the version checked at
propose. CI runs it on the Linux leg after the size report, as a failing step. A validation warning is a real defect in a
generated file, and the check passes today. That was measured at propose: strict validation of a freshly generated
surface passed with no credentials and an empty `HOME`, and failed (exit 1) once a skill's `description` was removed.

Chosen over a non-failing step like the size report. The size report measures and judges nothing, while this check
judges, and a warning that only prints would be ignored.

## Risks / Trade-offs

- [A user-level skill, memory or setting reaches a case session; `--setting-sources project` keeps settings out but not
  necessarily user skills or `~/.claude/CLAUDE.md` (D-rs-7's FALSIFY)] → The record lists the skills each session's
  start reported, and the comparison prints any that are not orbit's. Sal's own environment is constant between a
  baseline and a cut run on the same machine.
- [Three runs miss a rare failure (D-rs-9's FALSIFY)] → A fact the baseline passes only sometimes is reported with its
  spread, and its case's `--runs` can be raised for the cuts it guards.
- [The model or Claude Code changes between a baseline and a cut] → Both are recorded, the comparison warns, and a new
  baseline is cheap relative to a wrong verdict.
- [A seed drifts as the engine changes (a gate's field renamed, an emit refused)] → Each case's `start` checks run before
  a session is billed, and the free checks in `npm test` build every seed, so drift fails the suite before any spend.
- [The `prompt.md` answers a question the body would have asked, so a cut to that question's text goes ungraded] →
  Stated as the six-case requirement's named limit. A cut to such text gets its own case (D-rs-3).
- [A billed run costs more than expected on Sal's model] → `--max-total-usd` is required, each case carries its own
  `--max-budget-usd`, and the plumbing run's recorded costs on Sonnet size the broken-body run's and the baseline's
  ceilings before Sal types them.
- [A session hand-writes a file orbit then accepts as its own, without calling orbit] → Stated as the grader
  requirement's named limit; a case holds a `regex` over orbit's printed path wherever orbit prints the path it writes.
- [The pinned Claude Code in CI ages] → It is pinned on purpose so CI is reproducible. Raising it is a one-line edit made
  when a newer validator is wanted.

## Alternatives considered

- **`claude plugin eval` as the runner** (see explore.md, Considered & out; D-rs-6): its sandbox gives the shell a
  read-only workspace, so orbit's CLI cannot write its records. Re-entry: a release of the runner that grants shell
  writes. Cases keep its folder shape for that day.
- **`skill-creator` as the runner** (D-rs-6): its cases run as subagents reading the skill by path, graded by a model,
  not as real sessions typing a command and graded by orbit's facts. Its mean ± spread aggregation is kept (D-rs-9).
- **A whole lifecycle per case** (D-rs-2): a late step's grade would depend on every earlier step, and each run would
  cost a full lifecycle.
- **Seeds taken from a previous run's fixture**: cheaper to author, but a case would inherit an earlier session's luck
  and its seed would differ run to run. Scaffolds built with orbit's own commands give the same seed every time
  (decision 5).
- **The broken-body runs on a cheaper model** (Sal's ruling at the proposal walk: Sal's model instead): cheaper, but a
  stronger model may recover from a broken body that a cheaper one fails on, so the case would not be shown able to fail
  on the model that grades the cuts (decision 8).
- **A `command` grader running the fixture project's test** (settled under R-crc-3 at the proposal walk): it would admit
  a source outside D-rs-8's table, what orbit printed or wrote, and R-rop-15's "graded by orbit's computed facts". The
  apply case is graded on orbit's facts instead: every task checked, an apply emit, no review emit.

## Migration Plan

Nothing migrates: no adopter-visible file changes. Rollback is deleting `replay/`, `test/replay/`, the three npm
scripts, `scripts/validate-skills.mjs` and the CI step.

## Touchpoints

- `replay/` — the runner, comparison, shim, fixture builder, graders, records, README and the six cases.
- `test/replay/` — the free grader, start-state, comparison, shim and argument checks.
- `scripts/validate-skills.mjs` + `scripts/README.md` — the local and CI skill validation, and its entry.
- `package.json` — the `replay`, `replay:compare` and `validate:skills` scripts.
- `.github/workflows/ci.yml` — the validation step beside the size report.
- `CLAUDE.md` — the capability figure, 34 to 35.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rs-1 | — | superseded D-rs-10 (not carried) | none |
| D-rs-2 | DERIVED | live rule | `orbit-replay-set`'s `A case is one typed command on a fixture seeded at the state just before it`, as a TABLE of what a case fixes |
| D-rs-7 | DERIVED | live rule | `orbit-replay-set`'s "The runner runs each case as a `claude -p` session in its fixture and grades it afterwards", as a TABLE of a run's parts |
| D-rs-8 | SOURCED | live rule | `orbit-replay-set`'s `Every grader grades what orbit printed or wrote, and is shown failing on a known-bad input`, as a TABLE of the sources a grader may read |
| D-rs-9 | DERIVED | live rule | `orbit-replay-set`'s `A cut is "no worse" when every fact that passed in all baseline runs passes in all of its runs`, as a TABLE of the four baseline-by-cut outcomes |
| D-rs-10 | SOURCED | live rule | `orbit-replay-set`'s `Every run reaches a packed copy of the build under test, by a shim that finds it in the fixture`, as a TABLE of the invocation forms |
| D-rs-3 | — | scope (not carried) | none (its content is `The set holds six cases, one per default lifecycle command`) |
| D-rs-4 | — | scope (not carried) | none (its content is in the runner requirement's last paragraph) |
| D-rs-5 | — | scope (not carried) | none |
| D-rs-6 | — | fact (not carried) | none |
| D-rs-11 | — | fact (not carried) | none (input to stage `inventory`) |
