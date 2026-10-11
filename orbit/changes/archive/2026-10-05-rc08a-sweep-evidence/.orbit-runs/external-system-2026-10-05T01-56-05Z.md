# External Review: rc08a-sweep-evidence (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-05

## CRITICAL

### Sweep validation runs before the record is frozen
**File**: src/core/emit-composition.ts:1907
**Description**: The new checks inspect `payload.resolutions` during composition, before the materialization at the end of `composeAndWriteEmit`. The subsequent `writeGate(materialized, ...)` never repeats them. A programmatic caller's nested `toJSON` can therefore replace a checked entry with a resolved entry lacking `sweep`, and the engine writes it successfully. This breaks the archived `orbit-emit-composition` requirement `Engine-owned spine composition and filename discipline`, which explicitly requires validating the inert record that is written, including against getters and `toJSON` hooks. It also bypasses this change's required-sweep contract; the attribution count can similarly describe a different array from the one persisted. Validate the materialized resolutions and compute `ripple_misses` from that same inert record before writing.
**Reproduction**: Run from the repository after `npm run build`:

```bash
node --input-type=module <<'JS'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { composeAndWriteEmit } from './dist/core/emit-composition.js';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc08a-freeze-'));
fs.mkdirSync(path.join(root, 'orbit'));
const entry = {
  severity: 'WARNING', title: 'T', file: 'README.md', outcome: 'resolved'
};
const resolutions = [{ ...entry, sweep: {
  retired: [], introduced: [], searched: [], scope: [], kept: []
} }];
resolutions.toJSON = () => [entry];
const result = composeAndWriteEmit('address-reviews', {}, {
  model: null, source: 'whole-repo', walk_mode: 'per_finding',
  remaining_markers_in_scope: 0, final_assessment: 'Resolved.', resolutions
}, { projectRoot: root });
const written = JSON.parse(fs.readFileSync(result.path, 'utf8'));
console.log(JSON.stringify({
  outcome: written.resolutions[0].outcome,
  has_sweep: Object.hasOwn(written.resolutions[0], 'sweep')
}));
JS
```

Expected: refusal naming the missing sweep, with no emitted file. Observed: successful write and `{"outcome":"resolved","has_sweep":false}`.

### Explicit scope paths bypass the never-read directory exclusions
**File**: src/core/emit-composition.ts:409
**Description**: `SWEEP_SKIP_DIRS` is consulted only for child directories encountered during recursion. `expandPath` accepts an explicitly named excluded directory, its descendants, or a file beneath it without applying the exclusion. Consequently, a legitimate emit can be refused because retired wording remains in build output or dependencies, although `The walk write gate checks sweep evidence` says files under `.git/`, `node_modules/`, `dist/`, and `build/` are never read. The refusal even directs the walker to fix an excluded file or keep-list it. Apply the exclusion to every resolved scope member before expansion or reading, independent of how it entered the scope.
**Reproduction**: Run from the repository after `npm run build`:

```bash
node --input-type=module <<'JS'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc08a-exclusion-'));
fs.mkdirSync(path.join(root, 'orbit'));
fs.mkdirSync(path.join(root, 'dist'));
fs.writeFileSync(path.join(root, 'dist/out.txt'), 'old wording\n');
const payload = {
  model: null, source: 'whole-repo', remaining_markers_in_scope: 0,
  final_assessment: 'Resolved.', resolutions: [{
    severity: 'WARNING', title: 'T', file: 'README.md', outcome: 'resolved',
    sweep: { retired: ['old wording'], introduced: [], searched: [],
      scope: ['dist'], kept: [] }
  }]
};
const result = spawnSync(process.execPath, [
  path.resolve('bin/orbit.js'), 'emit', 'address-reviews', '--json'
], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8' });
console.log(JSON.stringify({
  status: result.status, stdout: result.stdout, stderr: result.stderr
}));
JS
```

Expected: success, since the only occurrence is in an excluded directory. Observed: exit 1, empty stdout, and `retired 'old wording' still occurs at dist/out.txt:1`. An explicit `scope: ['node_modules/pkg/out.txt']` reproduces the same defect for a file beneath an excluded directory.

## WARNING

### Kept paths are neither required to exist nor restricted to files
**File**: src/core/emit-composition.ts:597
**Description**: An unresolved `sweep.kept[].path` is silently dropped, while a directory is accepted and `isInside(f, k)` exempts its entire subtree. The delta requires unresolved sweep paths to be refused and defines a kept element as a file. CLI probes accepted both `{path: 'no-such-file.md', why: 'history'}` and `{path: 'orbit/changes/foo', why: 'history'}`; the latter allowed a resolved emit while `old wording` still existed in the change's proposal and was explicitly retired. Require each kept path to resolve to a file and exempt that file only. This preserves the deliberate per-file exemption without adding an undocumented directory-wide opt-out.

### Read failures become successful absence checks
**File**: src/core/emit-composition.ts:482
**Description**: `readText` converts every read failure to an empty string; `listFilesUnder` and `expandPath` likewise swallow directory-listing and stat failures. An unreadable member of the promised check scope consequently looks clean, with no warning or refusal. In a disposable change, a regular `locked.md` containing `old wording`, made unreadable with `chmod 000`, allowed a resolved CLI emit with `retired: ['old wording']` and no kept paths. The retired text remained on disk. Refuse the emit with the entry and failing path when the required scan cannot be completed; do not interpret an I/O failure as evidence of absence.

### Ripple pointers do not use the trail reader's complete key normalization
**File**: src/core/emit-composition.ts:530
**Description**: The trail reader trims a file string before passing it to `stripLineSuffix`, through `toRepoRelative`. The new pointer comparison replaces separators and calls `stripLineSuffix` without that initial trim. An earlier resolved entry with `file: 'file.md:40 '` is therefore read by `readTrail` under `file.md`, but an otherwise valid pointer with `file: 'file.md'` is refused by the CLI as matching no resolved entry. This contradicts design D6's promise that the pointer and gate use the same key. Reuse the complete key normalizer on both sides, preserving the existing trail behavior, and cover whitespace adjacent to a line suffix.

### Installed verification skills cannot read the path-resolution rule they must follow
**File**: src/core/templates/workflows/review.ts:939
**Description**: The new verification instruction requires resolving each sweep path by `orbit-emit-composition`'s `The walk write gate checks sweep evidence`, but neither the generated review body nor its shipped references contains that rule. The package does not ship this repository's `orbit/specs/`; an adopter's capability specs are their own. The missing information matters when both the project root and the change contain `specs/cap/spec.md`: the engine chooses the project-root file first, whereas the installed reviewer has no instruction establishing that precedence and can grade the other file. Ship a named, byte-checked mirror of the path rule, as R-crc-14 permits for installed consumers, or supply an engine-resolved scope that the reviewer can read.

### The gate baseline still says resolution entries are never validated
**File**: orbit/specs/orbit-engine-gates/spec.md:274
**Description**: `Reviewed-gate pass condition` still introduces its readability predicate with “the emit surface validates the payload KEY and none of the entry shapes.” This change deliberately adds resolution-entry validation, making that present-tense premise false, but carries no delta for the owning baseline. Add a narrowly scoped correction through the change's delta process: preserve the legacy trail-readability behavior and replace the obsolete statement about the writer with a pointer to the write-gate owner. Account for the additional capability in the change's scope rather than silently editing the archived baseline.

## SUGGESTION

### Name the directory scan's symlink limitation
**File**: src/core/emit-composition.ts:390
**Description**: Directory enumeration deliberately follows neither file nor directory symlinks, although the spec describes every file under the change directory and directories contributing their files. A probe with `orbit/changes/foo/linked.md` pointing to an in-project `docs/actual.md` containing the retired wording emitted successfully when the link was reached only through the automatic change scope; explicitly naming the link instead checks its target. State this discovery limitation in the owning requirement and cover the distinction, or follow contained targets with cycle protection if links are intended to belong to the check scope.

## Blocks

None.

## Direction

**Disposition**: hold

The sweep record is useful, and the implementation preserves the distinction between recorded search judgment and observable text checks. I would hold this version because the writer can persist evidence different from what it validated, and a scope spelled explicitly behaves differently from the same scope reached recursively. The file exemptions and failure handling also need to preserve the meaning of a completed check. These are repairs to the proposed mechanism; they do not require expanding the stage into walk routing or edit-level certification.

## Notes

Reviewed `3afcb8b..56bfe1f`, excluding this change's `.orbit-runs/`, together with the proposal, design, tasks, deltas, baseline capability inventory and affected caller/reader contracts. The exported trail helpers preserve their existing implementations; the new consumer's normalization order is where the divergence appears.

`npm run build` succeeded. The full `npm test` run passed: 114 test files, 2,751 tests. Strict change validation passed, and the three modified-requirement fingerprints verified. Scenario coverage was read from `orbit status --change rc08a-sweep-evidence --scenarios --json`: 40 delta scenarios, 18 behavior declarations, 23 text declarations, zero observed or untestable declarations, zero uncovered scenarios, zero orphan or malformed declarations, and 1,050 undeclared baseline scenarios. The coverage kinds overlap and are not summed. Independent probes exercised the real CLI in disposable projects and the programmatic composition seam.

All 13 implementation/check tasks are checked. Task 5.3 remains explicitly marked as the user-validation handoff for the first real post-apply walk; that observation has not occurred in this review. No unresolved review marker was found in the change artifacts; the marker mention in the delta is explanatory text.

`orbit/project.md`, root `*_convention.md` files and both named lens files are absent. No perspectives defined; skip Pass 4. No critical paths defined; skip Pass 5. The scope and serialization probes above supplement the affected-surface walk; they do not substitute invented named lenses.
