# External Review: d5-context-economy (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-08-04

## CRITICAL

### Project-wide audit-drift has no legal emit invocation
**File**: orbit/changes/d5-context-economy/specs/orbit-emit-composition/spec.md:5
**Description**: The generic surface requires `orbit emit <command> --change <name>`, and the target-resolution contract later permits only `--change` or architecture-only `--doc`. However, the modified conventions requirement explicitly requires standalone project-wide `/orbit:audit-drift` to emit with `change: null` into `orbit/.orbit-runs/` when no change argument exists. There is therefore no valid CLI form by which that required emit can be produced. Add a project-scoped target class to the engine table and CLI contract (for example, `orbit emit audit-drift` with neither target flag), define that it resolves `orbit/.orbit-runs/`, and reject target flags for that class; cover the no-target success path and wrong-target errors in task 3.1 and CLI tests.

### Post-write emits cannot pass the mandatory pre-write spine gate
**File**: orbit/changes/d5-context-economy/specs/orbit-emit-composition/spec.md:135
**Description**: The post-write algorithm writes `address-reviews` and `apply` candidates "complete except `next_recommended`", yet the write-gate requirement at line 169 says the composed candidate passes universal-spine validation before ANY write, and the universal spine requires `next_recommended`. No implementation can satisfy both requirements: either the incomplete candidate fails before landing, or the surface bypasses its mandatory gate. Define a coherent transaction. Prefer computing status against a synthetic trail containing the candidate, then validating and atomically renaming one complete file; otherwise explicitly specify a provisional-candidate validator and make the exception to "before ANY write" and "Every kind passes" normative, with crash/recovery tests.

### Timestamp-derived apply references repeat prior chunks
**File**: orbit/changes/d5-context-economy/specs/orbit-emit-composition/spec.md:225
**Description**: `files_touched` claims to be per-chunk, but the next emit resolves its base with `git rev-list -1 --before=<previous emit timestamp> HEAD`. The same requirement acknowledges that an emit commonly fires before the chunk commit lands. If chunk 1 is emitted at T1 while uncommitted and committed afterward as C1, chunk 2's lookup at T1 resolves C0, so its working-tree diff contains both chunk 1 and chunk 2. Repeated or unrelated paths become a plausible-looking per-chunk record. Persist an engine-owned boundary snapshot in each apply emit (for example base/head identity plus the tracked path set) and compute the next delta from that snapshot, or move the boundary after a defined commit; add the emit-before-commit/commit-after-emit/two-chunk regression case.

### Touchpoint set arithmetic has no compatible predicted-path grammar
**File**: orbit/changes/d5-context-economy/specs/orbit-audit-drift/spec.md:5
**Description**: The divergence check is specified as mechanical set difference between actual file paths and the Touchpoints "file list", but no parse or matching grammar is defined. The change's own first canonical map demonstrates non-file entries such as `src/commands/`, `src/core/templates/workflows/*.ts`, and grouped alternatives (`src/core/orientation.ts` + `src/core/artifact-graph/gates.ts`) in design.md:198-210. Literal set arithmetic will falsely report files under those directory/glob entries as unpredicted and report the patterns themselves as never touched. Define a closed Touchpoints entry grammar and normalization/matching semantics (exact file, directory-prefix, and glob if supported), make propose author only that grammar, and test the canonical map against actual paths before this becomes an audit signal.

## WARNING

### Boot `--json` has no specified output shape
**File**: orbit/changes/d5-context-economy/specs/orbit-orientation/spec.md:20
**Description**: The new boot render says it "composes with `--json`", but defines only text content. The baseline JSON requirement describes closed bare/full workstream shapes, while the per-change status JSON payload has no assigned fields for ordered artifact pointers, per-family emit pointers, historical exploration pointers, or predicted/actual touchpoints. A fresh implementer must invent whether boot JSON extends status, wraps it, and how ordering and degraded omissions are represented. Specify the complete `--change <name> --boot --json` object shape and field types, including pointer ordering, review-mode keys, touchpoint variants, and invalid-emit reporting; add a schema-level scenario/test.

### Archive persistence scenarios disagree about pre- versus post-move location
**File**: orbit/changes/d5-context-economy/specs/orbit-conventions/spec.md:185
**Description**: This scenario names `/orbit:archive foo` as an active-change emit and requires its file to land in `orbit/changes/foo/.orbit-runs/`. The emit-composition requirement instead requires archive to run after the move and write directly into the lexically greatest archived directory. Both statements are in post-sync normative requirements and cannot both describe the observable write. Remove archive from the active-change scenario (and from the active-trail usage wording at line 176), then add or reference an explicit post-move archived-trail scenario so archive has one persistence rule.

### Unvalidated model hints can break the one-line recommendation protocol
**File**: orbit/changes/d5-context-economy/specs/orbit-engine-gates/spec.md:29
**Description**: Hint values are appended verbatim to an eligibility line while the requirement explicitly says they receive no validation. YAML strings can contain embedded newlines and control characters, so a configured hint can forge additional output lines or destroy the model-facing `Ready when you are:` protocol that this same requirement treats as an API. Keep the mapping advisory, but validate the rendering boundary: require a non-empty single-line scalar, reject or safely escape CR/LF/control characters, and set a reasonable rendered-length limit. Add multiline and delimiter-containing hint tests.

### `--fresh` conflicts with an explicit reviewer class without a resolution rule
**File**: orbit/changes/d5-context-economy/specs/orbit-review/spec.md:5
**Description**: `--fresh` is defined as shorthand for `--reviewer fresh`, but behavior is unspecified when callers provide both forms with different values, such as `--fresh --reviewer in-context` or `--fresh --reviewer external`. This affects which branch runs, what `reviewer_class` is emitted, and which cadence slot is satisfied. Define the flags as mutually exclusive (clean usage error is least surprising) or specify precedence; add cases for matching and conflicting combinations.

## SUGGESTION

### Emit output flags should have a machine-readable composition contract
**File**: orbit/changes/d5-context-economy/specs/orbit-emit-composition/spec.md:264
**Description**: Success always prints the path, while `--json` "additionally" prints JSON and `--render` additionally prints a report. The ordering and separators for `--json --render` are not defined, and even `--json` alone is not a single parseable JSON document because it is preceded by a plain-text path. Make `--json` switch stdout to one structured object (including `path`, `emit`, and optional `render`), or declare incompatible flag combinations and exact framing. This will prevent every automation consumer from inventing its own split heuristic.

## Notes

Strict change validation passed, all 25 modified-requirement fingerprints verified, and the change tree contains no `@review:` residue. I also compared the modified capability blocks with their baselines and walked the frozen record vocabulary separately from live invocation steering. The dominant residual risk is at representation boundaries: target class versus persistence class, provisional versus valid records, authored path patterns versus file sets, and human-readable additions versus typed output. The repository test run reached 1,789 passing tests but was not clean in this workspace: 30 CLI-spawn assertions failed because the test harness split the space-containing checkout path (`/Users/sal/Documents/orbit 3 2`) at `/Users/sal/Documents/orbit`; that appears environmental and is not counted as a proposal finding.
