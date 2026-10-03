import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readTrail } from '../../src/core/artifact-graph/trail.js';
import { collectSameModePasses, countConfidentExternalPasses } from '../../src/core/report-render.js';

/**
 * rc04b-forward-recommendation, task 1.4: the three external readers that feed the GATE and the
 * trend — the trail reader (`readTrail`), the trend counter (`lenientExternalCounts`, reached
 * through `collectSameModePasses`) and `countConfidentExternalPasses` — see NO structure in a
 * `## Direction` section. Per-severity counts and (title, file) keys are byte-identical with and
 * without it, including a heading-shaped and a field-shaped line inside the reasoning. This test
 * carries exit (1)'s "the gate reads nothing" half; `trail.ts` carries no diff in the stage and
 * `gates.ts`'s diff is exactly the `export` keyword on `isIndependent` (measured at task 4.3).
 */

let dir: string;
let runs: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc04b-trail-'));
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs, { recursive: true });
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const NAME = 'external-proposal-2026-10-03T10-00-00Z.md';

function external(lines: string[]): void {
  fs.writeFileSync(
    path.join(runs, NAME),
    ['# External Review: c (iteration 1)', '', '**Reviewer**: M', '**Date**: 2026-10-03', '', ...lines].join('\n') + '\n'
  );
}

const SEV = [
  '## CRITICAL', '',
  '### Guard bypassed',
  '**File**: specs/a/spec.md:7',
  '**Description**: The guard only fires on the CLI path.',
  '**Reproduction**: run it', '',
  '## WARNING', '',
  '### Drift',
  '**File**: design.md:3',
  '**Description**: fix', '',
  '## SUGGESTION', '', 'None.', '',
];
const BLOCKS = ['## Blocks', '', '- orbit validate fails on specs/x/spec.md:12', ''];
const DIRECTION = [
  '## Direction', '',
  '**Disposition**: hold', '',
  'The mechanism has no test.',
  '### Not a finding',
  '**File**: not/a/field.md:1',
  '- not a block', '',
];
const NOTES = ['## Notes', '', 'texture', ''];

function readAll() {
  const trail = readTrail(dir).passes.find(p => p.source === 'external')!;
  const trend = collectSameModePasses(dir, 'proposal').find(p => p.name === NAME)!;
  const confident = countConfidentExternalPasses(dir, 'proposal');
  return {
    trail: { counts: [trail.critical, trail.warning, trail.suggestion], keys: trail.findings.map(f => [f.title, f.file, f.severity]) },
    trend: { counts: trend.counts, findings: trend.findings },
    confident,
  };
}

describe('rc04b: `## Direction` is no structure to the three external readers (1.4)', () => {
  it('counts, keys, the trend counter and the confident-pass count are byte-identical with and without the section', () => {
    external([...SEV, ...BLOCKS, ...NOTES]);
    const without = readAll();
    external([...SEV, ...BLOCKS, ...DIRECTION, ...NOTES]);
    const withSection = readAll();
    expect(withSection).toEqual(without);
    expect(without.trail.counts).toEqual([1, 1, 0]);
    expect(without.trail.keys).toEqual([['Guard bypassed', 'specs/a/spec.md', 'CRITICAL'], ['Drift', 'design.md', 'WARNING']]);
    expect(without.confident).toBe(1);
  });

  it('a malformed section, a second section, and a section before the severity sections leave the pass readable and counted the same', () => {
    external([...SEV, ...NOTES]);
    const base = readAll();
    external([...SEV, '## Direction', '', 'Disposition: hold', '', ...NOTES]);
    expect(readAll()).toEqual(base);
    external([...SEV, ...DIRECTION, ...NOTES, ...DIRECTION]);
    expect(readAll()).toEqual(base);
    external([...DIRECTION, ...SEV, ...NOTES]);
    expect(readAll()).toEqual(base);
  });
});
