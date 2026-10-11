# External Review: rc02b-severity-ladder (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-03

## CRITICAL

### A multiline Description disappears from the gate trail
**File**: src/core/artifact-graph/trail.ts:420
**Description**: The new field-line parity requirement promises that the trail reader and renderer agree once a Description body opens. The renderer accepts `**Description**:` with its text on following lines, but this regex requires non-empty same-line text. The trail therefore rejects an otherwise renderable external pass; `orbit status --report` can show its finding while the gate omits the pass and a walk cannot resolve its finding key. Latch `descOpen` on the label itself, then validate the body with the same rule the renderer uses, and test both readers with an empty same-line Description followed by body text and a field-shaped line.
**Reproduction**: From the repository root after `npm run build`, run the command below. The input's Reproduction body includes this field-shaped line, which must remain content:
**File**: specs/b/spec.md:99
Expected: both readers retain `Real finding` under `specs/a/spec.md`. Observed: the renderer returns that finding and reproduction, while `readTrail` returns no external pass (`trail: "absent"`).

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readTrail } from './dist/core/artifact-graph/trail.js';
import { normalizeExternalPass } from './dist/core/report-render.js';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc02b-empty-description-'));
const runs = path.join(dir, '.orbit-runs'); fs.mkdirSync(runs);
const file = path.join(runs, 'external-system-2026-10-03T20-00-00Z.md');
const body = ['# External Review: x (iteration 1)', '**Reviewer**: M', '**Date**: 2026-10-03', '## CRITICAL', '### Real finding', '**File**: specs/a/spec.md:7', '**Description**:', 'The user path fails.', '**Reproduction**: inputs: x; expected: stop; observed: pass', '**File**: specs/b/spec.md:99', '## WARNING', 'None.', '## SUGGESTION', 'None.'].join('\n');
fs.writeFileSync(file, body);
const trail = readTrail(dir).passes.find(p => p.file === file);
const render = normalizeExternalPass(file, body);
console.log(JSON.stringify({ trail: trail?.findings ?? 'absent', render: render.findings.map(f => [f.title, f.matchFile, f.reproduction]) }));
fs.rmSync(dir, { recursive: true, force: true });
JS
```

## WARNING

### System passes can grade a harmless requirement violation CRITICAL
**File**: src/core/templates/workflows/review.ts:222
**Description**: Pass 0 says any violated requirement with an observed behavior is CRITICAL, and Pass 1 repeats that rule for any violated baseline requirement. The owning ladder also requires a broken user path or lost data. A violated formatting or documentation requirement can be demonstrated without either consequence, yet these pass instructions would still place it in the CRITICAL scorecard and buy another independent pass. Make the user-path/data-loss consequence explicit at both sites and in the corresponding `orbit-review` delta scenarios; grade lesser violations by the ladder's remaining categories.

### The review schema reference restates the severity definition
**File**: src/core/templates/workflows/review.ts:97
**Description**: The generated `references/run-summary-schema.md` points to `orbit-conventions` and then defines a CRITICAL again in its `reproduction` field note; the write-gate diagnostic repeats that definition at `src/core/emit-composition.ts:538`. These are independent copies of the rule the change says has one owner. Keep the field's type and requiredness here, but point to the owning ladder for the grade and the reproduction's meaning; keep the diagnostic focused on the missing field. That leaves future changes to the consequence rule with one text to edit.

## SUGGESTION

None.

## Blocks

None.
### Heading-shaped parser probe, not a finding

## Notes

I checked the generated Claude skills in a scratch project, the write-gate rejection paths, Blocks rendering, strict change validation, fingerprint and source checks, and the full test suite. The empty-Description mismatch predates the apply, but the new two-reader field-line scenario makes it part of this change's explicit promise. The field-shaped line in the Reproduction body and the heading-shaped line in Blocks above are deliberate parser probes.
