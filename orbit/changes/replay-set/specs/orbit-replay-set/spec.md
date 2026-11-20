## ADDED Requirements

### Requirement: The replay set is a development-time check that is never shipped

orbit-spec SHALL keep its replay set (`reduce-orbit-phase2`'s R-rop2-2) under `replay/` in this repository, outside
every path `package.json`'s `files` names, so nothing `npm pack`, an install from the release tree, `orbit init` or
`orbit update` carries changes and no command, skill, body or reference is added for it. (The release tree, being the
commit's whole tree, holds `replay/`; the file set it installs does not.) Every session the replay set starts is a
billed `claude -p` session, and only the `replay` npm script starts one. That script refuses to start without a total
cost ceiling given on its command line (`--max-total-usd`), so each billed run is one Sal typed and capped. `npm test`
and CI start none. They run the free checks only: the graders' shown failures, the comparison, the shim and the run's
argument handling.

#### Scenario: The packed package carries nothing of the replay set

- **WHEN** `package.json`'s `files` is read
- **THEN** no entry matches `replay/` or a path under it, and no entry is a pattern that `replay/` matches

#### Scenario: A run without a cost ceiling starts no session

- **WHEN** the `replay` script is run without `--max-total-usd`
- **THEN** it exits non-zero, names the missing flag, and starts no `claude` process

### Requirement: A case is one typed command on a fixture seeded at the state just before it

A replay case SHALL fix everything that makes two runs of it comparable, member by member:

| member | covered by |
|---|---|
| the project's state when the session starts | the case's seed, built by its scaffold in a fresh fixture, the same for every run and checked before the session starts |
| what the user types | one command, written in the case's `prompt.md` |
| which skill body is under test | the one that command launches |
| what counts as success | the facts the case's graders name, which that command must leave |
| the settings | orbit's defaults, unless the case names a setting |

This table is DERIVED: a session's outcome is a function of its starting state, its input, the body it loads and its
settings. The first four rows fix each of these, and the fifth names the grade.

A case is a directory under `replay/cases/` holding a `case.yaml`, in the folder shape `claude plugin eval` uses, so
it stays portable if that runner ever lets the shell write: `prompt.md` (the typed text), `case.yaml` (its turn and per-session cost limits and the start state its seed
must reach), `scaffold.sh` (the seed, run in the fixture after orbit's skills are installed) and `graders/` (one file per
fact). Before the billed session starts, the runner checks the seeded fixture against the case's start state. A seed
that misses it fails the case unrun, and no session is billed.

#### Scenario: A seed that misses its start state bills nothing

- **WHEN** a case's scaffold leaves the fixture in a state its `case.yaml` start state does not match
- **THEN** the runner records that case as failed at its start state and starts no session for it

### Requirement: The set holds six cases, one per default lifecycle command

The replay set SHALL start with six cases, one for each command of the default lifecycle, all at orbit's default
settings: a named explore (`/orbit:explore <name>`), propose (`/orbit:propose <name>` from a staged exploration), apply
(`/orbit:apply <name>`), the in-context system review (`/orbit:review <name>` after apply), the walk
(`/orbit:address-reviews <name>`) and archive (`/orbit:archive <name>`). A case for a mode or a setting SHALL be added
when a cut first touches text that only that mode or setting reads. Each case's prompt answers, in its own text, any
question its command would ask a user, because a `claude -p` session has no one to answer it.

Named limit — the six cases grade the paths a session takes when nobody answers its questions. A path that turns on a
user's answer given mid-session is graded only as far as the prompt's stated answer reaches it.

#### Scenario: The set lists one case per default lifecycle command

- **WHEN** the directories under `replay/cases/` holding a `case.yaml` are listed
- **THEN** there are six, and their `prompt.md` files begin with `/orbit:explore`, `/orbit:propose`, `/orbit:apply`,
  `/orbit:review`, `/orbit:address-reviews` and `/orbit:archive`, one each

### Requirement: Every run reaches a packed copy of the build under test, by a shim that finds it in the fixture

The replay set SHALL run every session against one commit's build, given to the run as `--ref` (`HEAD` by default). The
runner checks that commit out in a temporary worktree, builds it, packs it with `npm pack`, and installs the pack with
`--omit=dev --ignore-scripts` as the fixture's `.orbit-cli/`. Orbit's skills are installed into the fixture by that
copy's `orbit init --tools claude`. The session's `PATH` starts with a directory whose `orbit` is a shim. Every way a run
can invoke an orbit CLI is covered:

| member | covered by |
|---|---|
| a bare `orbit` in a skill body or reference | the shim, which walks up from the session's directory to the first `.orbit-cli/` |
| `npx orbit` or `node bin/orbit.js` in a body or reference | none exists: a grep over the generated skills finds only bare `orbit` |
| `orbit` typed by the session on its own | the shim |
| the global install the shim shadows | never reached: with no `.orbit-cli/` above the session's directory, the shim exits 127 instead of falling through |
| the repository's working tree | never read by a run: a cut's before and after are two packed commits |

This table is SOURCED: the invocation forms are those a grep of the generated skills finds, and the shim is the one
`orbit` on the session's `PATH`.

#### Scenario: The shim runs the nearest packed copy

- **WHEN** the shim is invoked in a directory below one holding `.orbit-cli/node_modules/orbit-spec/bin/orbit.js`
- **THEN** it runs that file with the arguments it was given, and its exit status is that file's

#### Scenario: The shim fails loudly without a packed copy

- **WHEN** the shim is invoked where no directory above holds `.orbit-cli/`
- **THEN** it prints that no `.orbit-cli` was found to standard error and exits 127, running no other `orbit`

### Requirement: The runner runs each case as a `claude -p` session in its fixture and grades it afterwards

The replay set SHALL run each case as a fresh headless Claude Code session in its own fixture, graded after the session
ends, with every part of a run covered:

| member | covered by |
|---|---|
| orbit's skills loaded as a user has them | `orbit init --tools claude` in the fixture, from the build under test |
| the typed command run as a slash command | `claude -p` given the case's `prompt.md` |
| the shell able to write orbit's records | an unsandboxed session in the fixture, its tools limited by `--allowedTools "Bash Read Write Edit Glob Grep Skill"` |
| the user's own settings kept out | `--setting-sources project` |
| no session left in the user's history | `--no-session-persistence` |
| a ceiling on cost and length | the case's `--max-turns`, `--max-budget-usd` and wall-clock timeout, and the run's `--max-total-usd`: a session starts only when the spend so far plus its `--max-budget-usd` stays within the total |
| a trace to read | `--output-format stream-json --verbose`, kept beside the fixture |
| the grade | the case's graders, run in the fixture after the session against what it left and the trace |

This table is DERIVED: a run is a session (its skills, its input, its permissions, its limits) followed by a grade, and
each part has its row.

Graded runs SHALL use the model Sal works with, given as `--model`, which the runner requires, and three runs a case by
default (`--runs`). The broken-body run, which shows each case able to fail, SHALL use that model too, one run a case,
because a stronger model may recover from a broken body that a cheaper one fails on. A cheaper model with one run is
for proving the plumbing only, and its record carries the label the run was given (`--label`), so a plumbing run is
never read as a baseline.

A session's spend is the cost its trace's result record reports. A session that ends with no result record (it crashed,
was killed, or reached its timeout), or whose result record reports no numeric cost, counts its whole
`--max-budget-usd` as spent and is recorded with that reason, so the run's total never undercounts.

#### Scenario: The run stops starting sessions at its total ceiling

- **WHEN** the spend so far plus the next session's `--max-budget-usd` would exceed the run's `--max-total-usd`
- **THEN** the runner starts no further session, records every case and run it did not start as not run, and exits
  non-zero

#### Scenario: A session with no result record counts its whole budget

- **WHEN** a session ends without a result record in its trace
- **THEN** its case's whole `--max-budget-usd` counts toward the run's spend, and its run is recorded with no grades and
  the reason it ended

### Requirement: Every grader grades what orbit printed or wrote, and is shown failing on a known-bad input

A replay grader SHALL read only what orbit printed or wrote, each source admitted or refused:

| member | covered by |
|---|---|
| orbit's printed output in the trace | allowed: the results of the session's shell calls that ran `orbit` |
| a file in the fixture | allowed only beside a fact orbit's own answer makes true about it: a file's presence cannot tell orbit's write from the session's |
| orbit's commands run in the fixture after the session | allowed |
| the command line the session typed | refused: a pattern matching it passes a run whose CLI never answered |
| the skill body's text, recorded in the trace when the skill loads | refused: the body states the answers it asks for |
| the session's own final message | allowed only for what orbit itself printed into it |

This table is SOURCED: a stream-json trace holds tool calls, tool results, the loaded skill and the assistant's text,
and the fixture holds files. The rows are those sources.

The grader types are `file_exists` (a glob in the fixture), `regex` (over orbit's output in the trace, or over a file
the fixture holds) and `orbit` (an orbit command run in the fixture with `--json`, and a value its answer must hold). No
grader type reads the session's tool inputs or the loaded skill's text. A `file_exists` grader, or a `regex` grader over
a file, SHALL name (`pairs_with`) a grader of its case whose fact only orbit's answer makes true about the same file: an
`orbit` grader whose answer reads it (an artifact's status in `orbit status --change <name> --json`, `orbit validate
<name>`, a gate reading an emit), or a `regex` over orbit's output matching the path orbit printed when it wrote it. A
file the workflow has the session write itself (a change's proposal, design, specs and tasks) is graded by orbit's
reading of it, which is what the next command reads.

Named limit — a session that writes a file orbit then accepts as its own (a well-formed emit at a trail path) without
calling orbit passes an `orbit` grader that reads it. Only a `regex` over orbit's printed path catches that, and a case
holds one wherever orbit prints the path it writes. Before a grader joins the set, it SHALL be shown
failing on known-bad input:

- its case's seeded fixture before any session has run. A grader whose fact already holds at the seed (a thing the
  command must NOT do) instead names a known-bad scaffold of its own, which makes its fact false;
- for a `regex` grader over orbit's output, also a trace that holds the case's typed command and its skill's loaded body
  but no answer from orbit.

These checks run in `npm test` and bill nothing.

#### Scenario: Every grader fails on its known-bad fixture

- **WHEN** each case's graders are run with an empty trace against that case's seeded fixture, or, for a grader naming
  a known-bad scaffold, against the fixture that scaffold leaves
- **THEN** every grader fails

#### Scenario: A file grader never stands alone

- **WHEN** a case's graders are read
- **THEN** every `file_exists` grader and every `regex` grader over a file names in `pairs_with` an `orbit` grader, or a
  `regex` grader over orbit's output, of the same case

#### Scenario: Every trace grader fails on a trace without orbit's answer

- **WHEN** each case's `regex` graders over orbit's output are run against a trace holding the case's typed command and
  its skill's body as loaded text, and no result from an `orbit` call
- **THEN** every one of them fails

### Requirement: A run's record names its build, its model, its cost and every fact's grade

Every replay run SHALL write one record under `replay/results/` (or the directory `--results` names), a JSON file named
for its UTC start time to the second, its commit and its label (`run` when none is given). The runner refuses to start
when that name already exists, so no record is ever overwritten. The record names:

- the commit the build came from;
- the Claude Code version that ran the sessions;
- the model each session reported;
- the skills each session's start reported, so a skill from outside the fixture shows there;
- for each case and run, each grader's pass or fail, the session's turns, cost and duration, and whether it stopped at
  its start state, at a limit or at the run's ceiling;
- the run's total cost;
- the work directory holding its fixtures and traces.

A run's fixtures and traces live in a work directory outside any git repository and below no `CLAUDE.md`. The runner
refuses a work directory that is not, because Claude Code would load a parent directory's instructions into the
session. The record is the part kept in this repository, and a baseline's record is committed.

#### Scenario: A finished run's record holds every case and run

- **WHEN** a run of `n` runs over a set of cases ends, whether every session finished or the ceiling stopped it
- **THEN** its record holds an entry for every case and every run up to `n`, each with its grades or its reason for not
  having any, and the run's commit and total cost

### Requirement: A cut is "no worse" when every fact that passed in all baseline runs passes in all of its runs

The comparison (`replay:compare`) SHALL read a baseline record and a cut's record and classify every fact of the cases
it finds complete (below):

| member | covered by |
|---|---|
| passed every baseline run, passes every cut run | held |
| passed every baseline run, fails a cut run | a regression |
| passed only some baseline runs | reported with its spread, not judged |
| failed every baseline run | reported, and a cut that makes it pass is noted |

This table is DERIVED: the baseline passed a fact every time, some times or never, and each of those crossed with the
cut's result is a row.

Before classifying, the comparison SHALL check that the cut covers what the baseline graded. A case is INCOMPLETE when
the cut lacks it or one of its baseline graders, or when either side has fewer graded runs of it than that side's run
count (a run not run, stopped at its start state, or ended with no result record). An incomplete case gets no verdict
and is listed with what it lacks. A grader only the cut holds is listed as new and not judged.

The cut is "no worse" exactly when every case is complete and no fact is a regression. The report also shows, for each
case, the pass rate, turns and cost as mean ± standard deviation across runs on each side, so a difference is read
beside the spread it sits in. It warns, first, when the two records name different models or Claude Code versions,
because then a difference may come from either. The comparison exits non-zero when it finds a regression or an
incomplete case.

#### Scenario: A reliable fact failing once is a regression

- **WHEN** a fact passed all three baseline runs and fails one of the cut's three runs
- **THEN** the comparison lists it as a regression and exits non-zero

#### Scenario: A cut with a run missing is incomplete, not no worse

- **WHEN** the cut's record holds two graded runs of a case whose third was not run, and no fact regressed
- **THEN** the comparison reports that case incomplete with no verdict, gives no "no worse" result, and exits non-zero

#### Scenario: An unreliable fact is reported, not judged

- **WHEN** a fact passed two of three baseline runs and fails every cut run
- **THEN** the comparison reports it with both sides' pass counts, lists no regression for it, and exits zero when no
  other fact regressed

### Requirement: CI validates the generated skill surface

CI SHALL generate orbit's skill surface from the built commit in a temporary project (`orbit init --tools claude`) and
run `claude plugin validate --strict` over its `.claude/` directory, with Claude Code's version pinned, beside the size
report (R-rop2-5). A validation error or warning fails the build. `npm run validate:skills` runs the same check locally.

#### Scenario: A malformed skill fails the check

- **WHEN** a generated skill's frontmatter lacks its `description`
- **THEN** `claude plugin validate --strict` over the surface reports it and exits non-zero, and the CI step fails
