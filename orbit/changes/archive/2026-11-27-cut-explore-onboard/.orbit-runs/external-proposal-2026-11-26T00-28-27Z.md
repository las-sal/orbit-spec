# External Review: cut-explore-onboard (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-25

## CRITICAL

None.

## WARNING

### The emit reference can disappear before the boundary it serves
**File**: orbit/changes/cut-explore-onboard/specs/orbit-run-summary-emit/spec.md:57  
**Description**: The proposal’s motivating case is a named exploration that compacts before its final boundary. A session can read the emit reference before BEGIN, compact, and reach a user pause with the emit command and sweep instructions still in the body but without the payload instructions. The shared cue only triggers before BEGIN in that session. The delta acknowledges the lost read and leaves the reread decision to a past evaluation. Specify what explore does at a boundary when the payload instructions have dropped out of context, and cover a BEGIN → compaction → pause sequence.

### The Mode C flow lacks an explicit metadata handoff
**File**: orbit/changes/cut-explore-onboard/design.md:63  
**Description**: The moved crystallization procedure tells the agent to create the metadata “as in Mode B.” The actual metadata fields and citation offer now live in `references/new-exploration.md`. The design gives that reference a general scaffold trigger, but never puts the read in the confirmed Mode C sequence. An agent following the crystallization procedure alone could create the files and emit before consulting the citation procedure. Put an explicit Mode C read in the body after confirmation and before scaffolding, and check the sequence with a bare exploration that serves a declared architecture stage.

### The auto-capture guardrail’s replacement has narrower scope
**File**: orbit/changes/cut-explore-onboard/specs/orbit-explore-modifications/spec.md:20  
**Description**: The removed “Don’t auto-capture” line applies across upstream explore’s modes. The cited restatement lives under “When a change exists,” so a bare session with no existing change loses the upstream guardrail at its original scope. The separate Orbit capture rules govern specific capture types and allow proactive decision capture in named mode. Preserve the guardrail at the scope where it applies, or name and justify the scope change in the delta.

### The one-sentence propose handoff has no acceptance criteria
**File**: orbit/changes/cut-explore-onboard/tasks.md:20  
**Description**: The section being replaced describes the consume-mode trigger, the authority of `explore.md`, open-question handling, the staging move, the destinations of both BOUNDED residual slots, and refusal of concluded explorations. The design refers other text to this section while giving the implementer only a sentence-count constraint. Name which semantics the sentence must retain and where readers should find the rest, especially the residual handoff and the requirement to reopen before promotion.

### An exact reference-list test is missing from the apply tasks
**File**: orbit/changes/cut-explore-onboard/tasks.md:34  
**Description**: The task updates the generated-surface and config-profile reference lists, but `test/core/templates/orbit-content-fidelity.test.ts:520` independently asserts that explore ships exactly `capture-formats.md` and `decision-records.md`. That assertion will fail with the five new references. Add it to the named test edits and update its stale test title along with the expected list.

## SUGGESTION

### Separate the historical interpolation hash from the current grammar invariant
**File**: orbit/changes/cut-explore-onboard/specs/orbit-emit-composition/spec.md:12  
**Description**: The retained scenario still says the rendered skill is byte-identical to the literal render and the hash pin is unchanged, while task 6.4 requires re-pinning the edited skill. The historical comparison makes sense for the original extraction into `explore-grammar.ts`. Label it as historical or fold its enduring byte-parity assertion into the new production-placement scenario so the archived spec gives one clear expectation.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the explore handoffs before apply. The cut changes where the agent obtains instructions for a post-compaction emit and for a confirmed crystallization. Those transitions need explicit behavior and targeted checks. The upstream auto-capture rule and the abbreviated propose handoff also need clearer acceptance criteria so an implementation can preserve their intended scope.

## Notes

`orbit validate cut-explore-onboard --strict` passed. It reported informational scenario-coverage gaps and the declared capability-size exception. All modified requirement titles match archived requirements. The `@review:` mentions in the explore delta describe the marker mechanism and its scenario. I found no unresolved inline marker.

The workspace is read-only. I could not write, commit, or push the findings file.