# Spike files (replay-set, 2026-11-20)

Kept from the spike's scratch space (see `../spike.md` and `explore.md`'s Cases 1 to 4) so the change can start from
them. `eval-case/` is the `claude plugin eval` case as run 4 ran it (its scaffold's `<scratch>` was the job's temp
directory); `orbit-shim.sh` is the walk-up shim D-rs-10 adopts. The packed CLI, the fixtures and the eval results were
not kept: each spike run's cost and grades are recorded in `explore.md`.

Case 4's fallback runner command, as run (from the fixture directory, the shim's directory first on `PATH`):

    claude -p "/orbit:explore spike-probe

    The exploration is about whether the CLI should gain a --verbose flag. Scaffold it, record that one sentence as its premise, and stop there; ask me nothing." \
      --model sonnet --max-turns 15 --max-budget-usd 1 --setting-sources project \
      --allowedTools "Bash Read Write Edit Glob Grep Skill" --no-session-persistence \
      --output-format stream-json --verbose > trace.jsonl

Fixture for Case 4: `git init`, `.orbit-cli` (symlink to an `npm pack` of the build installed with
`--omit=dev --ignore-scripts`), `.gitignore` holding `.orbit-cli`, `orbit init --tools claude`, one commit.
