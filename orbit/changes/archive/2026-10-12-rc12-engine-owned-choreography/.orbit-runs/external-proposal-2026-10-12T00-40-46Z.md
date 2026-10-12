# External Review: rc12-engine-owned-choreography (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### Select cannot resolve a change before its artifacts exist
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:43
**Description**: `select` must run before generation, but the command accepts only a change name, while the common contract makes an unknown change a usage error. A new standalone proposal has no change directory yet; consume mode instead has `orbit/explore/<name>/`. The command also needs the proposed architecture citation and consume-mode staging path to select the program branch and enforce the generation-input guard. The promoted fixture receives these explicitly through `Phase1Input`; the new CLI has no corresponding input contract. Specify how pre-generation names resolve, where citation metadata comes from on each creation path, and how consume mode is identified. Add cases for a nonexistent standalone change and a staging-only cited exploration.

### Bare fetch does not guarantee that only remote-tracking refs move
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:12
**Description**: The claim that `git fetch <resolved-remote>` moves remote-tracking refs and nothing else is false for configurable Git repositories. Fetch follows `remote.<name>.fetch`; a configured destination under `refs/heads/` can update a local branch, and normal fetching can also update tags. The argv allowlist accepts that fetch regardless of its effects, so the shim does not prove the promised boundary. Constrain fetch destinations explicitly, control tag fetching, or validate and reject configurations that violate the boundary. Test a remote with a fetch refspec targeting a non-current local branch, as well as automatic tag fetching.

### Delta membership and Git dirtiness do not identify sync-owned edits
**File**: orbit/changes/rc12-engine-owned-choreography/design.md:35
**Description**: D6 asserts that a delta-named spec is changed in Git exactly when sync changed it. That equivalence does not hold. For example, a user can have an unrelated edit in capability A’s spec while the archive’s delta for A is already present and sync makes no change. The proposed intersection still includes A, and the printed isolated commit publishes the unrelated edit. Even when sync modifies A, Git dirtiness cannot distinguish pre-existing edits in that same file. Preserve an explicit list of files actually changed by sync and define how pre-existing edits in those files are handled. Add a no-op sync case with a dirty delta-named baseline, rather than testing only an unrelated capability.

### Archive preflight has no defined handoff to tail
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:110
**Description**: The baseline requires one preflight observation to feed both the archive emit and the tail. The new `tail` interface accepts only a change name and optional included paths, checks availability and HEAD, and then prints PR edits using `<url>`. It does not specify how it receives preflight’s validated or discovered URL, live draft state, positive invalidation, or unavailable observation. This matters for an attachment without a URL, a manually closed PR, and a PR already made ready. Re-reading the frozen attachment cannot provide those facts; repeating discovery changes the baseline’s single-observation contract. Define the handoff and its representation, including how tail omits PR writes after positive invalidation and skips the entire tail after an unavailable observation.

### The three-action contract cannot express partial PR degradation
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:19
**Description**: Every precondition or degradation is classified as `skip`, which must carry no commands. However, the archive baseline explicitly requires commit and push to proceed when stored-URL validation positively invalidates the PR, while omitting only the PR-writing steps. Similarly, propose’s several-candidate outcome skips the PR step, whereas `publish` declares several candidates a skip that suppresses its entire command list. Specify whether these outcomes return `proceed` with a reduced plan or introduce separate phase outcomes. Add decision rows and execution cases for partial plans so implementing the generic action table cannot silently suppress required bookkeeping.

### Program discovery contradicts the latest URL-bearing record rule
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:139
**Description**: The scenario requires discovery when the latest per-architecture record lacks a URL. The baseline instead deliberately selects the most recent **URL-bearing** matching record, so a newer URL-less record cannot mask an older valid attachment. Construct a trail with an older valid URL-bearing record followed by a newer URL-less record: the scenario directs a query, while the baseline directs validation of the older URL. The requirement also names fallback only when no record carries a URL, although the baseline requires fallback after positive invalidation too. Align the scenario and decision table with both baseline rules, and test newer URL-less records, invalidated recorded URLs, and discovery ambiguity.

### Publish’s ordered commands cannot execute the attachment-record phase as specified
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:74
**Description**: The ordered list jumps from PR creation to `git add <emit-path>` without an intervening operation that creates the propose/ff emit using the newly returned PR identity. The execution requirement nevertheless says to fill placeholders and run all commands in order. Filling an emit-path placeholder does not write that file or establish its attachment contents. The attachment commit also omits `-F <message-file>`, unlike the earlier commit, leaving its message or editor interaction unspecified. Define the phase boundary where the body consumes create/adopt results and writes the emit, and give the attachment commit a complete noninteractive argv. Tests should prove that the recorded attachment reflects the preceding result and reaches the remote.

### Human-only commands and program body reads conflict with the generic execution contract
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:144
**Description**: The shared `commands` field is defined as writes the workflow body runs, and every `proceed` test must execute every entry. Yet `program.commands` contains READY and merge commands exclusively for the human to copy. The program archive tail also places the current-body read in this list, followed by an edit whose body must be composed from that read’s result. A flat list with all placeholders filled beforehand does not represent that dependency. Separate executable workflow steps, observations consumed before composition, and human recommendations in the output schema. Make the execution helper run only workflow steps, with explicit assertions that human recommendations remain uninvoked.

### Validation’s closed outcome set omits a required predicate failure
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:96
**Description**: Stored-URL validation must check repository, head branch, base branch, and open state, but its listed outcomes contain no head-branch mismatch. It also lacks a defined validation value for URL-less attachment discovery yielding zero or several candidates, and for unavailable observations. These are reachable states that tasks 4.3 and 4.5 cannot implement consistently from the declared output contract. Specify a complete validation/discovery result type and its relationship to `action`, emitted fields, notes, and subsequent commands. Include a recorded URL whose live head differs from the frozen attachment branch.

## SUGGESTION

### The retirement sweep misses explicit zero-engine-git statements
**File**: orbit/changes/rc12-engine-owned-choreography/tasks.md:32
**Description**: Task 5.1 searches for `zero-engine-git`, but the baseline capability’s Purpose says the engine performs “ZERO git or GitHub operations,” and `CLAUDE.md:983` says “ZERO ENGINE GIT” and attributes every Git/gh action to workflow bodies. Those spellings will survive the proposed search and contradict the shipped command. Add explicit disposition for these statements and search the vocabulary variants. Preserve the intended deferral of workflow adoption while updating descriptions of what the engine is permitted to do.

### The return-to-default wording contradicts itself
**File**: orbit/changes/rc12-engine-owned-choreography/specs/orbit-pr-lifecycle/spec.md:121
**Description**: `facts.after_merge` explicitly carries `git merge --ff-only`, immediately followed by “The engine never prints a merge.” If the latter means a GitHub PR merge, say that explicitly. Also define `after_merge` as concrete argv records or another pinned representation so consumers need not infer how to render and order the fetch, switch, and fast-forward instructions.

## Blocks

None.

## Direction

**Disposition**: hold

The observation-and-plan approach is reasonable, but the command contracts do not yet preserve the lifecycle rules they claim to compute. The archive handoff and partial-degradation behavior need explicit decisions, and the executable-plan representation needs to distinguish body work from human recommendations. Resolving these at proposal time will prevent implementation from inventing incompatible behavior across the seams.

## Notes

I compared the change artifacts with the PR lifecycle, propose, archive, and conventions baselines, and inspected the live dogfood log and Phase 1 transcription. The happy-path evidence supports the proposed extraction, but the gaps arise in the transition from prose choreography to a machine-consumable plan: pre-generation inputs, observation transfer, partial outcomes, and commands requiring intermediate results.

No inline `@review:` markers were found in the change artifacts. CLI validation could not run because the checkout has neither the built `dist/` CLI nor installed dependencies; the invocation failed with `ERR_MODULE_NOT_FOUND`. This is an environment limitation, not evidence of an artifact validation failure.

The environment is read-only. I could **not** write the findings file or commit/push it. Save this markdown as `orbit/changes/rc12-engine-owned-choreography/.orbit-runs/external-proposal-2026-10-12T00-37-14Z.md` and commit it manually.