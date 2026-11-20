## Why

`reduce-orbit-phase2`'s goal G3 lets no cut meant to keep behaviour land until a replay set has graded it before and
after: real headless sessions of orbit's built skills on fixed tasks, several runs each, graded by facts orbit records
(R-rop2-2). No such instrument exists yet, so this stage, `replay-set`, builds it ahead of every cut stage. The
exploration's spike found that `claude plugin eval` cannot host orbit's cases (its sandbox makes the shell's workspace
read-only, so `orbit emit` cannot write a record) and that `skill-creator` does not run a real session typing a command
(D-rs-6). R-rop2-2's fallback is therefore taken: a `claude -p` runner of this repository's own, proven in the spike's
Case 4 (D-rs-7). The decisions are the exploration's D-rs-2 to D-rs-10 (see explore.md).

## What Changes

- **A development-time harness under `replay/`**, never shipped: outside `package.json`'s `files`, so nothing
  `npm pack`, the release tree, `orbit init` or `orbit update` carries changes, and no command, skill or body is added
  (R-rop2-2). Sal starts every billed run by hand; `npm test` and CI never start one.
- **Each run tests one commit's build** (D-rs-10). The harness packs that commit (`npm pack`, installed with
  `--omit=dev --ignore-scripts`), installs orbit's skills into each fixture from it (`orbit init --tools claude`), and
  puts a shim first on the session's `PATH`. The shim walks up to the fixture's `.orbit-cli/` and exits 127 when the copy
  is missing, rather than reaching the stale global install. The repository's working tree is never read by a run.
- **A case is one typed command on a fixture seeded at the state just before it** (D-rs-2). Each case keeps the folder
  shape `claude plugin eval` uses (`prompt.md`, a seed, `graders/`), so cases stay portable (D-rs-7).
- **Six cases, one per default lifecycle command** (D-rs-3), all at default settings: a named explore, propose, apply,
  the in-context system review, the walk (address-reviews), and archive.
- **The runner** runs `claude -p "<command>"` in each fixture (D-rs-7):
  - flags: `--setting-sources project`, a fixed tool allow-list, `--max-turns`, `--max-budget-usd` and
    `--output-format stream-json --verbose`;
  - grading happens afterwards, by orbit's own commands in the fixture and by reading the trace;
  - it stops starting sessions once the run's total cost ceiling, a number Sal types, is reached.
- **Graders read only what orbit printed or wrote** (D-rs-8): never the command the session typed, nor the skill body's
  own text. Before a grader joins the set, it is shown failing on input where its fact is false: the case's unrun seed,
  and a trace holding the typed command and the loaded body but no answer from orbit. These checks run free in
  `npm test`.
- **A run's record** gives, for each case and run, each fact's grade plus the run's turns, cost and duration. It also
  names the commit, the Claude Code version, the model the session reported and the skills the session loaded. A
  comparison
  (`npm run replay:compare`) reads two records:
  - a fact the baseline passed every time and the cut fails even once is a regression;
  - a fact the baseline passed only sometimes is reported with its spread, not judged;
  - pass rate, turns and cost per case are shown as mean ± standard deviation (D-rs-9).
- **Graded runs** use the model Sal works with, three runs a case, under a cost ceiling. Cheap one-run sessions are only
  for proving the plumbing (D-rs-4).
- **A recorded baseline**: one graded run on the bodies as phase 1 left them, with its cost. Also, each case is run once
  on a deliberately broken body and seen to fail (the stage's exit criteria). Each is a billed run Sal starts.
- **`claude plugin validate --strict` in CI** over a freshly generated skill surface, beside the size report
  (R-rop2-5, G2). It fails the build when validation fails.

## Capabilities

### New Capabilities

- `orbit-replay-set`: the development-time replay set. It covers:
  - what a case is, and the six cases the set holds;
  - how a run reaches the build under test;
  - the `claude -p` runner and its limits;
  - what a grader may read, and its shown failure;
  - the run record, and the "no worse" comparison;
  - that it is never shipped and only Sal starts a billed run;
  - the CI validation of the generated skills.

### Modified Capabilities

(none)

## Impact

- New: `replay/` (the runner, the shim, the fixture builder, the graders, the comparison, six cases with their seeds, a
  README) and `test/replay/` (the free grader and comparison checks); the `replay` and `replay:compare` npm scripts.
  Run records are kept under `replay/results/`. Fixtures and traces live in a work directory outside any repository,
  so no parent `CLAUDE.md` reaches a session.
- CI: one step in `.github/workflows/ci.yml` that generates the skill surface in a temporary project and runs a pinned
  `claude plugin validate --strict` over it; `scripts/validate-skills.mjs` and the `validate:skills` npm script hold the
  same check for local runs. `scripts/README.md` names both new scripts.
- `CLAUDE.md`'s marked capability figure moves from 34 to 35.
- Behaviour: none for any adopter. Every installed body, reference, command and CLI answer is unchanged. Billed sessions
  run only when Sal starts them. D-rs-11 (on a broken CLI, the explore body let the session improvise) is input to the
  `inventory` stage and not acted on here.
- capabilities: one new capability, one change. The harness and the CI check are both this stage's exit criteria, and
  neither changes a baseline requirement.
