## Why

D6's PR choreography is a 36 KB runbook across three references that a performing AI executes step by step: resolving the remote and default branch, testing the branch, enumerating the commit scope, checking the attachment, querying the program PR. The first live run (explore.md, `sketches/dogfood-log.md`, PR #15) found 27 of 38 steps deterministic, and every one of them gave the same answer on both seams. The 7 failures were not wrong answers. They were steps the runbook never spelled out (the push command, tracking at creation, the validation command, the return after merge) and pairs of rules that disagree. Code cannot leave a step unspelled. R-crc-5 allows the deterministic steps into an engine command once they have been shown deterministic by execution. D-rc12-4 records how that condition is met: the live run covers the happy path, and engine tests against real repositories cover every other branch.

This is the first of rc12's two changes (Q-crc-9's pre-split): the engine command. The workflow bodies adopt it in the second change, which is where exit (2), the references shrinking by more than half, is measured. This change grades exit (1), the deterministic steps engine-tested, and exit (3), the consent properties unchanged.

## What Changes

- **A new command group, `orbit pr`, OBSERVES and PRINTS, and never writes** (D-rc12-2). Each subcommand runs the read-only `git` and `gh` queries its seam needs. It reports the facts and a decision (`proceed`, `skip` with a one-line note, or `off`), and prints the exact write commands the body runs, as argument vectors. The engine creates no branch, commit, push or PR, and switches nothing. Its one ref-store update is `git fetch` of the resolved remote, which moves remote-tracking refs and nothing else.
- **Five subcommands, one per seam step:**
  - `select <change>` covers propose and ff Phase 1. It reads the regime, resolves the remote and default branch, applies the branch preconditions, and prints the switch.
  - `publish <change>` covers Phase 3. It computes the enumerated commit scope from disk, makes the no-CI observation, runs the program path's four-axis adopt-or-create query, and prints commit, push and draft-PR creation with the title and body left as placeholders.
  - `preflight <change>` is the archive's read-only preflight. It reads the attachment, notes citation divergence, validates the stored URL live against the four predicates with a specific reason, runs the fallback query, and gives the values `pr_url` and `pr_state` take.
  - `tail <change>` covers the archive tail. It checks the `gh` and HEAD preconditions, computes the commit scope from the delta's capabilities (body-named at-archive paths join through `--include`), and prints commit, push, the description write and the READY flip, plus the return-to-default lines after the merge.
  - `program <doc>` is the architect readout's resolution, record validation and query.
- **The dogfood's silences are fixed in the printed form.** Creation is `--no-track`, so the branch never tracks the default. The push is spelled out (`git push -u <remote> <branch>`). The PR-validation command exists. A return to the default branch is printed for after the merge.
- **The test instrument is promoted.** `test/integration/pr-lifecycle/phase1.ts`, D6's executable transcription of Phase 1, is retired into the engine module. Its 33 cases move to the engine's tests, which run each printed command against a real repository with a bare remote and the contract-validated `gh` stub, so a command git will not perform fails the suite. A PATH shim records every `git` and `gh` invocation the engine makes and fails on any outside the read-only allowlist. That is exit (3)'s check.
- **The zero-engine-git requirement is MODIFIED**, not removed: the engine observes, the body writes. Every outward act and every local write stays a body step, run under the user's own invocation.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-pr-lifecycle`:
  - ADDED `The \`orbit pr\` command observes and prints; it never writes`: the subcommand set, the read-only allowlist, the fetch exception, the output shape, regime and attachment gating, `gh` absence as its own fact.
  - ADDED one requirement per subcommand (five). Each POINTS at the rule it computes in its owner (`orbit-propose-modifications`' `Branch preconditions at propose` and `PR choreography at propose (config-gated)`, `orbit-archive-modifications`' `PR-attached archive tail`, this capability's `Program PR (Shape A) semantics` and `Remote and default-branch resolution`) and never restates it (R-crc-14).
  - ADDED `Printed commands are proven by execution`: the instrument.
  - MODIFIED `PR actions are workflow-body choreography (zero engine git)`: the engine observes, the body writes.

## Impact

- New `src/core/pr/` (resolution, the five plans, the shared runner with its allowlist) and `src/commands/pr.ts`. Registration goes in `src/cli/program.ts` and `src/core/completions/command-registry.ts`.
- `test/integration/pr-lifecycle/phase1.ts` is retired; `phase1.test.ts` moves to the engine's tests. `harness.ts` gains scripted `gh pr view` responses and a git PATH shim.
- No workflow body, template or reference changes; that is change 2. No schema version, config or emit-shape change.
