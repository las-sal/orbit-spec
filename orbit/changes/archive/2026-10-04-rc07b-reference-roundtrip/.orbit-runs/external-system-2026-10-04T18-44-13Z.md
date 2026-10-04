# External Review: rc07b-reference-roundtrip (iteration 1)

**Reviewer**: GPT-6 Astra
**Date**: 2026-10-04

## CRITICAL

### A valid category can disappear from the computed counts
**File**: src/core/emit-composition.ts:577
**Description**: `computeAuditDriftCounts` uses a plain object as a string-keyed counter, while the new validator accepts every non-empty finding category. A finding categorized `__proto__` is retained in `findings` and included in `findings_total` but has no entry in the persisted `findings_by_category`; `constructor` and `toString` produce string values instead of integer counts. This loses count data and violates the new union-and-sum rule. Use a null-prototype object or a `Map` for the accumulator, and test inherited-property names through the write gate.
**Reproduction**: From the repository root, run `npm run build`, then:

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { composeAndWriteEmit } from './dist/core/emit-composition.js';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-rc07b-repro-'));
try {
  const result = composeAndWriteEmit('audit-drift', {}, {
    final_assessment: '1 drift', categories_run: ['1'],
    findings: [{ category: '__proto__', severity: 'WARNING', file: 'README.md', line: 1, title: 'demo', recommendation: 'fix' }],
    model: null,
  }, { projectRoot: root });
  console.log(JSON.stringify({ total: result.emit.findings_total, byCategory: result.emit.findings_by_category }));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
NODE
```

The rule requires `{"total":1,"byCategory":{"1":0,"__proto__":1}}`; the command writes `{"total":1,"byCategory":{"1":0}}`.

## WARNING

### The address-reviews example claims scopes its source cannot occur in
**File**: src/core/templates/workflows/address-reviews.ts:618
**Description**: The block is tagged `json example change archived doc project`, so the round-trip suite submits its unchanged `source: "auto-discovered"` payload in all four scopes. The reference itself describes this as a change-scoped auto-discovery walk and points `source_path` at an active change's review emit. The address-reviews discovery contract only auto-discovers for an active or archived change positional; a bare project walk or architecture-doc walk cannot produce that source. The write gate accepts the mislabeled provenance because it does not validate it, giving the test a green result for examples that the workflow cannot write in two advertised scopes. Give those scopes truthful examples or limit this example's scope tag to the change paths and exercise project/doc with their own payloads.

### The touched consumer reference still documents the retired review counts shape
**File**: src/core/templates/workflows/address-reviews.ts:160
**Description**: The `internal-findings-format.md` reference says its expected review JSON contains `findings_summary`, but current `orbit emit review` writes `scorecard` and retired `findings_summary` for current review emits. This change corrects the adjacent audit-drift JSON block while leaving the review producer's current shape wrong, and the same reference still enumerates only six of the seven required spine fields at line 226. A consumer implemented to this reference could require a field current review files never carry. Show `scorecard` as the current shape, identify `findings_summary` only as legacy input, and include `model` in the spine list.

## SUGGESTION

### The category-id error promises a narrower check than the gate performs
**File**: src/core/emit-composition.ts:553
**Description**: The error says `categories_run` must contain IDs `"1".."6"`, matching the shipped reference, but the validator accepts `['7']` and whitespace strings because it checks only the JavaScript string type. Either enforce the documented category-id range or make the message and reference explicit that the gate checks type only; this also clarifies the named limit of the round-trip test.

## Blocks

None.

## Direction

**Disposition**: hold

The count computation can persist a summary whose category counts omit a recorded finding. Repair the accumulator and align the references with payloads their workflows can actually produce before relying on the new round trip as evidence of reference fidelity.

## Notes

I ran strict change validation, the full test suite, a build, and a direct write-gate reproduction. The change artifacts have completed tasks and the delta requirements are covered. The optional lens files are absent in this checkout, so there were no registered perspectives or critical paths to simulate. The new suite proves acceptance at the write gate; it does not validate the provenance semantics of the example payloads.
