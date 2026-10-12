## Why

D6's PR choreography is a 36 KB runbook across three references that a performing AI executes step by step: resolving the remote and default branch, testing the branch, enumerating the commit scope, checking the attachment, querying the program PR. The first live run (explore.md, `sketches/dogfood-log.md`, PR #15) found 27 of 38 steps deterministic, and every one of them gave the same answer on both seams. The 7 failures were not wrong answers. They were steps the runbook never spelled out (the push command, tracking at creation, the validation command, the return after merge) and pairs of rules that disagree. Code cannot leave a step unspelled. R-crc-5 allows the deterministic steps into an engine command once they have been shown deterministic by execution. D-rc12-4 records how that condition is met: the live run covers the happy path, and engine tests against real repositories cover every other branch.

This is the first of rc12's two changes (Q-crc-9's pre-split): the engine command. The workflow bodies adopt it in the second change, which is where exit (2), the references shrinking by more than half, is measured. This change grades exit (1), the deterministic steps engine-tested, and exit (3), the consent properties unchanged.

## What Changes

- **A new command group, `orbit pr`, OBSERVES and PRINTS, and never writes** (D-rc12-2). Each subcommand runs the read-only `git` and `gh` queries its seam needs and prints one record (D-rc12-8):
  - `action` (`off`, `skip` or `proceed`) and a closed `reason` code;
  - `degraded: "pr"` when only the PR half falls and the seam's own commit and push still stand;
  - `observations`;
  - `segments`, the body-run writes as argv arrays, split wherever the body must author something first (a commit message, a title, the emit);
  - `human_acts`, the user's alone.

  The engine creates no branch, commit, push or PR, and switches nothing. Its one ref-store update is a bounded fetch: `ls-remote`, then explicit refspecs with `--no-tags` (D-rc12-11).
- **The engine decides skips that an owner precondition decides, and the body writes every note** from the reason code (D-rc12-13). This narrows R-crc-5's "degradation notes, when to skip", ratified by Sal.
- **Five subcommands, one per seam step:**
  - `select <name>` covers propose and ff Phase 1. It needs no change directory: an exploration's presence decides consume mode and supplies the citation (D-rc12-10).
  - `publish <change>` covers Phase 3. It prints two segments: land and open, then the attachment record once the body has written the emit. It computes the commit scope and the no-CI observation, and runs the program path's adopt-or-create query; several survivors or an error degrade the PR half.
  - `preflight <change>` is the archive's read-only preflight. Its outcome comes from a closed set (D-rc12-12), and `not-found` is keyed on `gh`'s recorded message.
  - `tail <change>` covers the archive tail. It reads preflight's observation and the sync's changed capabilities from the written archive emit, and never observes again (D-rc12-9).
  - `program <doc>` covers the architect readout. It never skips, and follows the latest URL-bearing record rule.
- **The dogfood's silences are fixed in the printed form.** Creation is `--no-track`. The push is spelled `git push -u <remote> <branch>`. The validation command exists. The post-merge return is a human act.
- **The test instrument is promoted.** `test/integration/pr-lifecycle/phase1.ts`, D6's executable transcription of Phase 1, is retired into the engine module, along with its `ghurl` test hook. Its 39 cases move to the engine's tests, which run each segment against a real repository with a bare remote and the contract-validated `gh` stub. A PATH shim fails the suite on any engine invocation outside the read-only allowlist; that is exit (3)'s check. Injected cases show the instrument can fail.
- **The zero-engine-git requirement is MODIFIED**, not removed: the engine observes, the body writes. Its title is kept and names the write boundary.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-pr-lifecycle`:
  - ADDED `The \`orbit pr\` command observes and prints; it never writes`: the allowlist, the bounded fetch, the record, the actions, the R-crc-5 narrowing.
  - ADDED one requirement per subcommand (five). Each POINTS at the rule it computes in its owner (`orbit-propose-modifications`' `Branch preconditions at propose` and `PR choreography at propose (config-gated)`, `orbit-archive-modifications`' `PR-attached archive tail`, this capability's `Program PR (Shape A) semantics` and `Remote and default-branch resolution`) and never restates it (R-crc-14).
  - ADDED `Printed commands are proven by execution`: the instrument.
  - MODIFIED `PR actions are workflow-body choreography (zero engine git)`: the engine observes, the body writes.
  - MODIFIED `Test instruments derive from a recorded real-CLI contract`: a third recorded error rule, the not-found message.

## Impact

- New `src/core/pr/` (record, runner, resolution, the five plans) and `src/commands/pr.ts`. Registration goes in `src/cli/program.ts` and `src/core/completions/command-registry.ts`.
- `test/integration/pr-lifecycle/phase1.ts` and `phase1.test.ts` are retired into the engine's tests. `harness.ts` gains GitHub-shaped remotes, scripted `gh pr view`/`pr list` responses and the git shim. `gh-contract.json` and its capture script gain the not-found rule.
- No workflow body, template or reference changes; that is change 2. No schema version, config or emit-shape change. The tail reads the archive emit's existing `pr_url`, `pr_state` and `sync_specs` fields.
