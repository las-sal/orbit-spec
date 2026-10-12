# External Review: landing-page (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### Quickstart skips the review cadence and resolution steps
**File**: README.md:71
**Description**: Both review commands use the default `in-context` reviewer, but the shipped schema requires `[invoked, in-context]` for both reviewed gates. The `invoked` slot requires an independent fresh/external pass or a complete blind pair. The sequence also proceeds directly from review to apply/archive without walking findings through `/orbit:address-reviews`. Review does not resolve findings or automatically invoke subsequent workflows, so even clean reviews in this sequence cannot complete the declared cadence. Teach an independent review followed by resolution when needed and the subsequent in-context review, or explicitly tell readers to follow the report’s recommended steps before advancing.

### The required clean-machine rehearsal remains unperformed
**File**: orbit/changes/landing-page/tasks.md:30
**Description**: Task 5.2 remains unchecked and contains no commands or observed output. Design D5 requires a pre-public rehearsal of the Git installation, quickstart shell commands, and one Claude Code proposal on a machine/account without orbit installed. The grammar checks and scenario declarations cannot establish that npm’s Git dependency preparation builds a usable installation or that the generated Claude commands work. Complete and record that rehearsal before treating the landing page’s install-and-start goal as fulfilled. The post-merge tag and post-public rerun can remain deferred as designed.

## SUGGESTION

### The records claim exceeds the declared emission scope
**File**: README.md:33
**Description**: “Every run writes a summary” is broader than the named capabilities support. `orbit-run-summary-emit` defines an emission scope, and `orbit-onboard` explicitly requires no run-summary emission; ordinary read-only CLI invocations also do not write these summaries. Narrow the wording to the workflows covered by the emission contract, preserving the useful claim that the engine composes and validates their records.

## Blocks

None.

## Direction

**Disposition**: hold

The landing page should guide a newcomer through the review process it advertises. Its current sequence omits the independent review and resolution steps that make that process complete. The installation path also needs the pre-public rehearsal already required by the design before the page is ready to serve as the release entry point.

## Notes

Strict validation passed using the installed `orbit 2.0.0`: `orbit validate landing-page --strict`. The scenario map from `orbit status --change landing-page --scenarios --json` reports declarations for every delta scenario, with no uncovered scenarios, orphan declarations, or malformed declarations. These are coverage declarations, not evidence that the tests executed.

The checkout contains neither `node_modules` nor built `dist/`, so I could not independently run the test suite or the checkout’s CLI. `git diff --check` passed. No unresolved `@review:` markers were found in the change artifacts outside `.orbit-runs`.

The project and lens files named in the brief are absent, and `AGENTS.md` is empty. Caller and flow review therefore focused on newcomers installing orbit, users following the Claude quickstart, the onboard version explanation, and the shared docs-check callers. The version fields agree, the onboard edit distinguishes orbit’s version from its upstream baseline, and the modified delta blocks preserve the existing scenarios.