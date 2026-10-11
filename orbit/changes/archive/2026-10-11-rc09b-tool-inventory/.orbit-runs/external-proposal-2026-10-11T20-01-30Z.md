# External Review: rc09b-tool-inventory (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### Failure assertions contradict the passing scenarios
**File**: orbit/changes/rc09b-tool-inventory/design.md:66
**Description**: D6 requires every ADDED scenario to assert failure text naming surface, line and head; task 3.2 repeats this requirement. However, `Today's surface passes the inventory` and `An inline span without a flag token is not read` explicitly require success. Exemption and malformed-block failures also require different diagnostic fields: an unused exemption has no surface occurrence, and an absent block has no offending head. An implementation following the blanket assertion instruction would contradict the spec or invent misleading diagnostics. Specify assertions by scenario outcome: successful inventory and excluded-span assertions for passing cases, surface/line/head for unknown-head failures, head/kind for unused exemptions, and requirement/source location for malformed blocks.

## SUGGESTION

### The named residual omits tools invoked through exempt wrappers
**File**: orbit/changes/rc09b-tool-inventory/specs/orbit-cli-grammar/spec.md:54
**Description**: The named limit describes missed inline invocations and excluded containers, but misses a tool invoked through an exempt command in a fully read shell fence. For example, `command jq -r .url <path>` yields the exempt head `command`; `jq` is an argument and receives no inventory check. Likewise, `sh -c 'jq -r .url file.json'` introduces a tool inside a quoted argument. These cases fall outside the listed residual even though they bypass the intended contract price. Extend the named limit and its review method to cover wrapper arguments and embedded scripts. This can remain a declared limitation without expanding implementation scope.

### Refused inline spans are not reported by every existing sweep
**File**: orbit/changes/rc09b-tool-inventory/design.md:40
**Description**: D1 says a refused or open line needs no failure because the shared extractor already reports it “in every sweep.” That is true for shell-fence lines, but `extractInline` only tokenizes spans beginning with the sweep's own tool name. An inline span such as `jq --arg value "$(cat file)"` is refused by the proposed head walk and ignored by the existing `orbit`, `git` and `gh` sweeps. The spec already declares refused inline spans as a residual, so the implementation policy is coherent; correct D1's explanation to distinguish unconditional fence failures from tool-selected inline failures.

## Blocks

None.

## Direction

**Disposition**: hold

Clarify the scenario-specific test outcomes before implementation. The inventory approach fits the stated scope, but its blanket failure-assertion instruction conflicts with the behavior the spec requires. The coverage descriptions should also accurately explain what the instrument leaves to review.

## Notes

The installed `/opt/homebrew/bin/orbit` CLI accepted `validate rc09b-tool-inventory --strict`. It reported informational scenario-map omissions for the new scenarios, which the implementation tasks explicitly address. The change has no size breach.

The MODIFIED requirement preserves all twelve baseline scenarios. No unresolved inline review markers were found in the proposal, design, tasks, exploration or delta spec.

The checkout lacks `dist/cli/index.js`, so its own `node bin/orbit.js` could not run. Validation therefore used the installed CLI; no implementation tests were executed.