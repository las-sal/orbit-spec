# External Review: cut-explore-onboard (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-27

## CRITICAL

None.

## WARNING

### A compacted exploration can lose the instructions needed to emit at its next boundary

**File**: orbit/changes/cut-explore-onboard/specs/orbit-run-summary-emit/spec.md:59  
**Description**: The delta explicitly prevents rereading the payload reference after compaction. A named exploration can emit at BEGIN, compact, then reach a pause with the boundary trigger and command still in context but the payload contract gone. The previous body kept that contract in the same section as the command. I confirmed the write-gate consequence by running `printf '%s\n' '{"final_assessment":"Pausing the exploration."}' | orbit emit explore --change inventory --payload /dev/stdin`. The engine refused the payload because `model` was missing. That probe confirms the rejection path. Live session behavior after compaction remains unverified. Make the cue reload the reference when its payload instructions are unavailable, or keep the two required payload keys in the explore body.

### Re-entering a concluded exploration can surface a superseded trigger

**File**: src/core/templates/workflows/explore.ts:509  
**Description**: A fresh session must report the live `Re-entry:` trigger before the user decides whether to reopen. After a conclude → reopen → conclude cycle, the Decisions section contains both a superseded trigger and a live one. E4 moves the rule for selecting the live carrier into `decision-entries.md`, but the body reads that reference only before writing the session’s first Decisions entry. The initial re-entry readout writes nothing. Put the live-carrier rule in the concluded row or direct that row to read the reference before reporting the trigger. Apply the same instruction to concluded records inside change directories.

### The boundary sweep no longer explicitly requires updates to existing Mechanism entries

**File**: src/core/templates/workflows/explore.ts:310  
**Description**: The shortened sweep names Mechanism fields as destinations and retains the fallback for a rule with no entry. It drops the explicit instruction to update an existing entry when conversation settles its domain, closure, or a move’s disposition. For example, when a user settles the domain of an already captured rule and then pauses, an agent can treat the decision as already file-resident and emit over the stale entry. The archived `Boundary residency sweep before emits` requirement still calls for the update. Restore that trigger in the body and its mirrored emit section.

### Onboard drops the user’s choice over open questions

**File**: src/core/templates/workflows/onboard.ts:84  
**Description**: The shortened propose walkthrough lists the three open-question outcomes but no longer says that propose prompts the user for each question. The propose workflow still solicits that choice. A reader learning the flow from onboard can infer that the agent selects an outcome on its own. Restore that the user chooses whether to resolve, defer, or abandon each question.

## SUGGESTION

### The broken explore replay assumes the build has the new reference layout

**File**: replay/cases/explore/case.yaml:15  
**Description**: The runner loads the current case definition and accepts a separate `--ref` for the build under test. In a broken replay against a pre-cut build, the fixture mutator deletes the emit section and then throws when `references/run-summary-emit.md` is absent, before the grader runs. Document the supported build range for this mutation or make the removal conditional on the reference being present in the target layout, while still asserting that current builds ship it.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the explore workflow gaps before moving forward. An agent following the shortened body needs enough information to report the current re-entry trigger, persist newly settled Mechanism details, and compose a valid boundary emit after compaction. These fixes can preserve the reference-file split and the size goal.

## Notes

All task boxes were checked. The installed CLI passed strict validation and reported zero uncovered delta scenarios, zero orphans, and zero malformed declarations. I took scenario coverage from the scenario map. I rendered all 14 skills from the checkout using the production generator. Explore measured 4,964 estimated tokens and 345 lines. Onboard measured 4,985 estimated tokens and 130 lines. Both met the stated budgets.

I walked the generated explore and onboard entry points, the affected reference reads, and the handoffs to emit, propose, and replay against the archived specs. The diff changes templates and replay configuration, with no direct changes to CLI, MCP, or HTTP handlers. The requested perspective and critical-path files were absent, so the caller and flow checks used the archived capability scenarios. The full build, test suite, generated-surface validation, and live AI replay were not run in the read-only checkout.

The workspace is read-only. I could not save the findings file, commit it, or push it.