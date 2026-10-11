# External Review: rc17a-invoked-coverage (iteration 1)

**Reviewer**: GPT-6 Codex  
**Date**: 2026-10-05

## CRITICAL

### Formatting an invalid review preference can crash status
**File**: src/core/project-config.ts:200  
**Description**: The invalid-value warning calls `String(pref)` on arbitrary YAML values. A mapping such as `review-system: {toString: external}` throws `TypeError: Cannot convert object to primitive value`. Because gate computation calls this resolver without catching that exception, `orbit status --change … --json` exits unsuccessfully instead of warning and falling back to `blind-pair`, as required. Use a non-throwing formatter for invalid values and test object-shaped preferences through the status surface.

**Reproduction**: After building the checkout, run this from its root. It substitutes the config contents only within this process and changes no files:

```bash
node --input-type=module -e '
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
const config = process.cwd() + "/orbit/config.yaml";
const read = fs.readFileSync;
fs.readFileSync = (p, ...args) => String(p) === config
  ? "schema: spec-driven\nreview_preference:\n  review-system:\n    toString: external\n"
  : read(p, ...args);
syncBuiltinESMExports();
process.argv = [process.execPath, "status", "--change", "rc17a-invoked-coverage", "--json"];
await import("./dist/cli/index.js");
'
```

Expected: a warning identifying the invalid preference, fallback to `blind-pair`, and normal status JSON. Observed when executing the checked-out source: exit 1 with `Error: Cannot convert object to primitive value`, without status JSON.

## WARNING

### “Walk now” cannot end a pair whose landed half is clean
**File**: orbit/changes/rc17a-invoked-coverage/specs/orbit-address-reviews/spec.md:16  
**Description**: Discovery row 4 unconditionally offers “walk now” and promises that this ends the pair. However, a launch followed by a clean fresh pass produces `openPair: {missing: "external"}`, `unresolvedPasses: []`, and `unwalkedPasses: []`—confirmed through `evaluateReviewedGate`. With no markers or audit findings, row 5 discovers nothing and the AFTER rule exits without a log. Membership consequently remains unchanged, and repeating the command offers the same ineffective choice.

Define the clean-half case explicitly. Either make the choice route through the existing empty-source walk, producing a record referencing the landed member, or restrict the offer and accurately describe its effect. Update the checked mirror at `src/core/templates/workflows/address-reviews.ts:1033` and verify the complete discovery-to-record path.

### A return tied with its launch silently becomes a covering single
**File**: orbit/changes/rc17a-invoked-coverage/specs/orbit-engine-gates/spec.md:102  
**Description**: Membership requires tokens strictly inside the launch window, while every other independent pass becomes a single. There is no rule for a return sharing its launch’s timestamp. The implementation at `src/core/artifact-graph/gates.ts:329` therefore treats that ambiguous return as a deliberate single.

I evaluated `[invoked, in-context]` with a system launch and clean external return both at `2026-10-05T10-02-00Z`, followed by an in-context pass at `2026-10-05T10-03-00Z`. The member set was empty, the result was `passed`, and the next command was `/orbit:archive x`, despite no fresh half or ending walk. External returns are authored outside the emit collision guard, so that guard does not eliminate this input.

Specify launch-boundary ties explicitly and preserve the stated fail-safe approach rather than inferring a single invocation from ambiguous ordering. Extend the oracle’s event set: its current tie event covers two review classes sharing a token, not a launch and return sharing one.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The coverage mechanism is coherent over its tested event model, but its surrounding user paths need repair. Invalid preferences should leave status usable, the offered walk choice should perform its promised action, and ambiguous launch timing should not silently change what review was invoked.

## Notes

Reviewed the change artifacts, the hash-derived range `e91328b5..cc44898a`, affected code and callers, and relevant archived requirements. All task checkboxes are complete.

Executed the checked-out TypeScript in memory using locally installed dependencies because this worktree lacks built output and permits no writes. Strict change validation and source validation passed. The scenario map reported 95 delta scenarios, zero uncovered, zero orphans, and zero malformed declarations. All six oracle shards completed, covering 11,722,230 cases without disagreement. The generated DISCOVERY fence matched its delta owner byte-for-byte. The full filesystem-writing test suite was not run.

`orbit/project.md`, root convention files, and both named lens files were absent. No named-perspective or declared-critical-path review was possible; surface checks followed status, gate computation, preferences, launch ingestion, and walk discovery.
