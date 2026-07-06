# External Review: c1-engine-gates (iteration 3)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-30

## CRITICAL

None.

## WARNING

### As-of-completion gate computation is scoped too narrowly for current review passes
**File**: orbit/changes/c1-engine-gates/specs/orbit-review/spec.md:40
**Description**: The new as-of-completion scenario only says the current in-context proposal run counts toward the trailing `in-context` slot. That closes one P4/P5 boundary, but it leaves other current-pass cases underspecified even though the final assessment is rendered before the run summary is written. A first `/orbit:review --as proposal --fresh <change>` has no on-disk independent pass yet, so a literal implementation of the five proposal states can match the "no fresh independent pass yet" branch and recommend the same fresh review again instead of counting the current fresh pass and recommending address-reviews or the closing in-context confirm. The same issue exists for system mode: the `review-system` cadence requires a trailing in-context pass after external, but the Path A/Path B system phrasings declare `gate review-system PASSED` without a system-mode as-of-completion rule saying the current in-context run supplies that trailing slot. Generalize the scenario so orbit-review final-assessment rendering evaluates gate state with a synthetic current pass for the active review run (mode, reviewer_class, token/path, and current findings), while keeping `orbit status` / `orbit instructions` strictly on-disk. Specify that if the current pass has findings, the canonical address-reviews command points at the just-written `review-<mode>-<TS>.json`.

### Proposal unresolved-findings branch does not cover mixed independent-pass histories
**File**: orbit/changes/c1-engine-gates/specs/orbit-review/spec.md:19
**Description**: The proposal-mode unresolved branch only fires when the most recent independent-class pass has unresolved findings, but `orbit-engine-gates` requires every pass's findings to be resolved before a reviewed gate passes. With multiple independent passes, an earlier fresh/external pass can remain unresolved while a later independent pass is clean or resolved; that state is not covered by the "latest independent unresolved", "latest independent yielded new findings", "trailing in-context uncovered", or "gate passed" branches. The exact stock phrasing also says the unresolved source is a prior independent `/orbit:review`, even though an `external-proposal-*.md` file can satisfy the `independent` slot and can be the unresolved source passed to `--from-file`. Change this branch to cover any unresolved gate-relevant independent pass (or any unresolved gate-relevant pass, if that is the intended reading of "every pass"), define how to choose `<independent-path>` when more than one unresolved source exists, and use neutral wording such as "prior independent pass" so both `review-proposal-*.json` and `external-proposal-*.md` are valid inputs.

## SUGGESTION

None.

## Notes

`node bin/orbit.js validate c1-engine-gates --strict` passes after `npm ci` builds the CLI. No unresolved `@review:` markers were found under `orbit/changes/c1-engine-gates`.
