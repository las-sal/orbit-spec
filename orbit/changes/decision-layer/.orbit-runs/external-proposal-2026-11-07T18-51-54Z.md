# External Review: decision-layer (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-07

## CRITICAL

None.

## WARNING

### Resolution citations break when their owning history moves
**File**: orbit/changes/decision-layer/specs/orbit-decision-records/spec.md:168
**Description**: Resolution citations store repository-relative paths, while exploration promotion and change archival move the referenced files. For example, an entry citing `orbit/changes/foo/.orbit-runs/decisions/resolution-2026-11-07T10-00-00Z.json` loses its source when `foo` moves under `orbit/changes/archive/2026-11-07-foo/`. A citation made during exploration similarly breaks at promotion, including when both records move together. The design provides neither stable identities nor relocation-aware lookup, and existing move operations do not rewrite these citations. Define how references survive both transitions and add tests covering references within the moved history and from another change.

### Architecture-scoped resolutions can answer another program's stop
**File**: orbit/changes/decision-layer/specs/orbit-emit-composition/spec.md:27
**Description**: Stop validation requires only that the target exists in the same `decisions/` folder. Every architecture doc shares `orbit/architecture/.orbit-runs/decisions/`, so `orbit emit resolution --doc program-b` can name a stop belonging to `program-a` and satisfy every specified check. The resulting resolution belongs to B while closing A's stop. The same problem affects a ledger entry's `raised_stop`. Require the referenced stop's engine-owned scope identity to match the emitting record: matching `doc` for architecture scope and matching workstream for change/exploration scope. Add cross-program refusal scenarios.

### Goal existence checks accept another goal's ID prefix
**File**: orbit/changes/decision-layer/specs/orbit-decision-records/spec.md:167
**Description**: The specified existence test looks for the prefix `**<id>` rather than a complete goal ID. If a doc contains `**G10 — ...**` but no G1, a citation with `id: "G1"` passes the literal `**G1` test. This contradicts the promise that missing citations are refused. Define the exact boundary after the ID using the supported goal-item grammar, and test that G1 does not resolve against G10 or G11. The matching rule in design.md must change with the spec.

## SUGGESTION

### Citation-read failure behavior needs an explicit contract
**File**: orbit/changes/decision-layer/specs/orbit-decision-records/spec.md:168
**Description**: “A resolution record inside some history's `decisions/` folder” leaves the implementation to decide what constitutes a valid referenced record and how malformed JSON, unreadable files, directories, or inconsistent record identity are handled. Specify the minimum structural checks for referenced stops and resolutions, the allowed history locations, and the clean refusal behavior for failed reads. Add negative fixtures so independently written implementations agree.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve citation identity and scope ownership before implementation. These records are intended to become durable evidence for later automation; movable references and links that can cross program boundaries undermine that foundation. Exact goal matching should also be settled before the citation resolver is built.

## Notes

Reviewed proposal, design, tasks, exploration, both delta specs, the emit-composition baseline, project orientation, the governing severity convention, and the live program charter. Checked existing promotion/archive behavior and emit target handling.

Both modified requirement titles exist in the baseline, and their existing scenarios are retained. No inline review markers were found in the proposal artifacts.

Runtime validation was unavailable: `node bin/orbit.js validate decision-layer --strict` failed because `dist/cli/index.js` is absent. This is a verification limitation, not evidence of an artifact validation failure.

The explicit deferral of generated writing instructions and the reader step is documented consistently and was treated as an intentional scope boundary.