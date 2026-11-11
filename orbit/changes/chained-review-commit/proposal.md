## Why

Today orbit commits only at propose and at the archive tail, so the work of apply, a review and a walk sits uncommitted, and a chained external review or blind pair, which needs a committed tree, refuses and stops the chain on `no-progress` (the named limit in `orbit-conventions`' `No-chaining contract`). The user's model of a program (R-adf-14 of `automate-dev-flow`) is one branch and one pull request that orbit commits and pushes to throughout and the user merges at the end. This change gives that model its commit and push, as two opt-in settings, and so finishes the third of D-sga-1's three changes for stage seam-chaining (see `explore.md`, D-chrc-1).

## What Changes

- Two new settings in `orbit/config.yaml`: `commit: true` lets orbit commit at the end of each command that writes to a change; `push: true` lets it push to the change's pull request branch. Each grants one act. Absent, or any other value, grants nothing and nothing changes (D-chrc-3, D-chrc-4).
- A new engine subcommand, `orbit pr commit <change-name>`. It reads both settings, the change's PR attachment, which branch is checked out, and the uncommitted paths, and prints `git add -A`, the commit, and the push for the body to run, never running one itself (D-chrc-10).
- A commit takes EVERYTHING uncommitted that `.gitignore` does not exclude, the user's own edits included (D-chrc-2). Each untracked file it adds is named in one line (D-chrc-5). It never commits on the default branch, nor on any branch but the change's attached one (D-chrc-6). A merge or rebase in progress prints nothing to run.
- A shared closing step, the commit step, carried by every workflow body that writes to a change, runs before the chain end step. A chained external review therefore arrives on a committed tree whenever the settings and the attachment allow it (D-chrc-8). The no-progress limit narrows to the cases the step cannot reach.
- The docs' config-key table and `orbit pr` table gain the new keys and subcommand.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-pr-lifecycle`: ADDED `The commit and push settings` and `` `orbit pr commit` computes the closing commit step ``. MODIFIED `` The `orbit pr` command observes and prints; it never writes `` (the `off` row gains `commit`'s gate) and `PR actions are workflow-body choreography (zero engine git)` (the engine's surface and the body's call list gain the settings reader and `commit`).
- `orbit-conventions`: ADDED `The commit step closes every body that writes to a change`. MODIFIED `No-chaining contract` (the dirty-tree limit narrows to the cases the commit step does not reach).

## Impact

- `src/core/pr/` gains the `commit` subcommand module. `src/cli/program.ts` and the CLI registry (`orbit-cli-grammar`) register it. `src/core/project-config.ts` types the two keys for documentation, and a resolver reads them silently, as `resolveChainSetting` reads `chain`.
- `src/core/disciplines.ts` gains the shared step text, interpolated into eight bodies: propose, ff, apply, review, address-reviews, verify, explore and archive. Their skill hash pins move (R-adf-9 names them at archive).
- `docs/customization.md` and `docs/cli.md` gain the keys and the subcommand.
- G0: with neither key set, `orbit pr commit` prints nothing to run, and every body ends exactly as today. The body text is setting-dependent text R-adf-12 allows.
