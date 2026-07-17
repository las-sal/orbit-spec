# External Review: d2-architect (iteration 1 — system mode)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-16

## CRITICAL

### Architecture review still executes change-only setup
**File**: src/core/templates/workflows/review.ts:123
**Description**: The new mode is added after an unconditional change-oriented setup. Step 1 always resolves a change and, when the positional is omitted, prompts over `orbit list --json`; Step 4 then always runs `orbit status --change <name>` plus `orbit instructions apply --change <name>` and loads change artifacts; Step 9 likewise opens with the change-gate computation. For `/orbit:review --as architecture d-arc-arbitered-flow`, the Step-4 commands target a nonexistent change, and for `/orbit:review --as architecture` without a doc, Step 1 prompts over changes instead of the parseable architecture docs required by the delta. The later architecture-specific paragraphs do not cancel these earlier sequential instructions, so a faithful agent can fail before reaching the six passes. Resolve the mode before the target, branch Steps 1/4/8/9 by mode, use `orbit architecture status/show` for architecture context, announce `Using doc:` rather than `Using change:`, and add fidelity tests for both explicit-doc and omitted-doc architecture invocations.

### D2 is marked apply-complete without satisfying exit criterion 3
**File**: orbit/architecture/d-arc-arbitered-flow.md:519
**Description**: The stage acceptance test requires `/orbit:review --as architecture` to run from the generated body and leave evidence in `orbit/architecture/.orbit-runs/`, but no architecture trail directory or `review-architecture-*.json` exists. The apply ledger explicitly substitutes “ships as generated body (its first evidence lands on first use),” while task 5.1 is checked as if the emit path had been exercised. Shipping instructions is not the stated run-and-evidence criterion—especially while the body has the change-only setup defect above. Run the generated architecture review against the retrofitted arc, verify and commit its emit (including `change: null`, `doc`, and `handoff`), and do not claim all 20 tasks/exit criteria complete until that evidence exists; alternatively, changing the exit criterion requires an explicit architecture-level ratification rather than silently weakening it in the status log.

## WARNING

### Architecture iteration history is not scoped by doc
**File**: src/core/templates/workflows/review.ts:369
**Description**: Architecture reviews share one trail, and the delta requires iteration matching to filter `review-architecture-*.json` by the current emit's `doc`. The implemented Step 8 only selects prior summaries “matching this mode,” so a review of doc B can treat doc A's run as its previous iteration and compare unrelated findings. Add an architecture branch that filters by both `mode: "architecture"` and exact `doc`, and use doc-oriented first-run wording; cover mixed-doc trail fixtures in fidelity tests.

### The generated review launcher still advertises only two modes
**File**: src/core/templates/workflows/review.ts:610
**Description**: The skill instructions contain architecture mode, but the skill description and the generated thin command's description/body/example still say review is only proposal or system and show `--as proposal|system`. Those strings are the discoverable launcher surface, so the 16-workflow install continues to hide and contradict the third mode even though arbitrary arguments are passed through. Update the skill metadata, command metadata, launcher prose/example, and compatibility text to advertise an architecture doc target and `--as proposal|system|architecture`; add a generated-surface assertion so future mode additions cannot update only the long body.

### The retrofitted arc still points readers to a deleted state line
**File**: orbit/architecture/d-arc-arbitered-flow.md:114
**Description**: D1's live stage prose says to “see the state line + status log for position,” but D2 deliberately deleted every hand-maintained state line and made `orbit architecture status` authoritative. This is outside the append-only status log, so it is current owning prose rather than protected historical narration. Replace the pointer with the computed status command (and retain the status-log pointer only for narrative history), then extend the live-arc residue assertion beyond the exact old `State (manual until D2)` spelling so semantic stale pointers are caught.

### Onboarding omits two run-summary persistence locations
**File**: src/core/templates/workflows/onboard.ts:58
**Description**: The generated onboarding identity says summaries persist only per-change or project-wide. D2's own contract has four locations, including named-explore and architecture trails, and architecture-mode review is an editorial command that now writes outside both locations listed here. Update this paragraph to enumerate all four scoped locations (or point to a compact authoritative table) and add an onboarding fidelity marker for `orbit/architecture/.orbit-runs/`; otherwise the new review mode tells users that its evidence lives somewhere the onboarding says does not exist.

## SUGGESTION

None.

## Notes

`npm install`, `npm run build`, strict change validation, architecture validation, live architecture status, and the fingerprint check passed (18/18 verified). The targeted architecture and generated-surface suites passed 202/202. The full suite reached the expected 1707 passing tests plus 24 failures caused by the known unquoted workspace path (`/Users/sal/Documents/orbit 3` being executed as `/Users/sal/Documents/orbit`), so that failure class is environmental. The CLI engine itself correctly reports D1 complete, D2 in-change, D3–D6 premised; the parser/state/validation implementation and the 16-skill/16-command generation paths otherwise matched the reviewed deltas.
