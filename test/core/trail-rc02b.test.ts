import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readTrail } from '../../src/core/artifact-graph/trail.js';
import { normalizeExternalPass } from '../../src/core/report-render.js';

/**
 * rc02b-severity-ladder, task 1.4 (the trail half): the gate's external reader and the renderer's
 * external parser implement ONE contract — `orbit-conventions`' External-review findings markdown
 * format, whose field-line rule says a field-shaped line is recognised only BEFORE a finding's
 * Description body opens. The external proposal pass found the trail reader taking the LAST
 * `**File**:` line, so a path quoted inside a Reproduction body re-filed the finding at the gate
 * while the render showed the right file. These tests pin the finding KEY (title, file) through
 * BOTH readers, and pin that neither a Reproduction body nor a `## Blocks` section changes a count.
 */

let dir: string;
let runs: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc02b-trail-'));
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs, { recursive: true });
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const TOKEN = '2026-10-03T10-00-00Z';
const NAME = `external-proposal-${TOKEN}.md`;

function external(lines: string[]): string {
  const content = ['# External Review: c (iteration 1)', '', '**Reviewer**: M', '**Date**: 2026-10-03', '', ...lines].join('\n') + '\n';
  fs.writeFileSync(path.join(runs, NAME), content);
  return content;
}

const BASE = [
  '## CRITICAL', '',
  '### Guard bypassed',
  '**File**: specs/a/spec.md:7',
  '**Description**: The guard only fires on the CLI path.', '',
  '## WARNING', '',
  '### Drift',
  '**File**: design.md:3',
  '**Description**: fix', '',
  '## SUGGESTION', '', 'None.', '',
];

describe('rc02b: the trail reader and the render parser agree on the finding key', () => {
  it('a `**File**:` line INSIDE a Reproduction body does not re-file the finding in EITHER reader (red before 2.4)', () => {
    const content = external([
      '## CRITICAL', '',
      '### Guard bypassed',
      '**File**: specs/a/spec.md:7',
      '**Description**: The guard only fires on the CLI path.',
      '**Reproduction**: compare with the sibling requirement:',
      '**File**: specs/b/spec.md:99',
      'observed: the sibling is what breaks', '',
      '## WARNING', '', 'None.', '',
      '## SUGGESTION', '', 'None.', '',
    ]);
    const trail = readTrail(dir);
    const pass = trail.passes.find(p => p.source === 'external')!;
    expect(pass).toBeDefined();
    const render = normalizeExternalPass(path.join(runs, NAME), content);
    const trailKey = pass.findings.map(f => [f.title, f.file]);
    const renderKey = render.findings.map(f => [f.title, f.matchFile]);
    expect(trailKey).toEqual(renderKey);
    expect(trailKey).toEqual([['Guard bypassed', 'specs/a/spec.md']]);
  });

  it('a `**File**:` line INSIDE a multi-line Description body does not re-file the finding in EITHER reader', () => {
    const content = external([
      '## CRITICAL', '', 'None.', '',
      '## WARNING', '',
      '### Drift',
      '**File**: specs/a/spec.md:7',
      '**Description**: compare:',
      '**File**: specs/b/spec.md:99',
      '**Description**: a pasted snippet, not a field', '',
      '## SUGGESTION', '', 'None.', '',
    ]);
    const pass = readTrail(dir).passes.find(p => p.source === 'external')!;
    const render = normalizeExternalPass(path.join(runs, NAME), content);
    expect(pass.findings.map(f => [f.title, f.file])).toEqual([['Drift', 'specs/a/spec.md']]);
    expect(render.findings.map(f => [f.title, f.matchFile])).toEqual([['Drift', 'specs/a/spec.md']]);
    expect(render.findings[0].recommendation).toBe('compare:\n**File**: specs/b/spec.md:99\n**Description**: a pasted snippet, not a field');
  });
});

describe('rc02b system blind pair: WHERE a Description body opens is read the same way by both readers', () => {
  it('a bare `**Description**:` label with the body on the next lines is a present Description in BOTH readers, keyed the same', () => {
    const content = external([
      '## CRITICAL', '',
      '### Real finding',
      '**File**: specs/a/spec.md:7',
      '**Description**:',
      'The user path fails.',
      '**Reproduction**: inputs: x; expected: stop; observed: pass',
      '**File**: specs/b/spec.md:99', '',
      '## WARNING', '', 'None.', '',
      '## SUGGESTION', '', 'None.', '',
    ]);
    const trail = readTrail(dir);
    expect(trail.rejectedExternals).toHaveLength(0);
    const pass = trail.passes.find(p => p.source === 'external')!;
    const render = normalizeExternalPass(path.join(runs, NAME), content);
    expect(pass.findings.map(f => [f.title, f.file])).toEqual([['Real finding', 'specs/a/spec.md']]);
    expect(render.findings.map(f => [f.title, f.matchFile])).toEqual([['Real finding', 'specs/a/spec.md']]);
    expect(render.findings[0].recommendation).toBe('The user path fails.');
    expect(render.findings[0].reproduction).toBe('inputs: x; expected: stop; observed: pass\n**File**: specs/b/spec.md:99');
  });

  it('a Description with NO non-blank body (bare label, then the Reproduction) is malformed in BOTH readers', () => {
    const content = external([
      '## CRITICAL', '',
      '### Blank body',
      '**File**: specs/a/spec.md:7',
      '**Description**:',
      '',
      '**Reproduction**: run it', '',
      '## WARNING', '', 'None.', '',
      '## SUGGESTION', '', 'None.', '',
    ]);
    const trail = readTrail(dir);
    expect(trail.passes.filter(p => p.source === 'external')).toHaveLength(0);
    expect(trail.rejectedExternals).toHaveLength(1);
    expect(() => normalizeExternalPass(path.join(runs, NAME), content)).toThrow(/blank '\*\*Description\*\*:' body/);
  });

  it('a Description whose only body is a fenced block is present in BOTH readers', () => {
    const content = external([
      '## WARNING', '',
      '### Fenced body',
      '**File**: specs/a/spec.md:7',
      '**Description**:',
      '```',
      '## CRITICAL',
      '```', '',
      '## CRITICAL', '', 'None.', '',
      '## SUGGESTION', '', 'None.', '',
    ]);
    const trail = readTrail(dir);
    const pass = trail.passes.find(p => p.source === 'external')!;
    expect(pass).toBeDefined();
    expect([pass.critical, pass.warning, pass.suggestion]).toEqual([0, 1, 0]);
    const render = normalizeExternalPass(path.join(runs, NAME), content);
    expect(render.findings[0].recommendation).toBe('```\n## CRITICAL\n```');
  });
});

describe('rc02b: neither a Reproduction body nor a Blocks section is structure to the counter', () => {
  it('counts are unchanged by a Reproduction body', () => {
    external(BASE);
    const before = readTrail(dir).passes[0];
    external([
      '## CRITICAL', '',
      '### Guard bypassed',
      '**File**: specs/a/spec.md:7',
      '**Description**: The guard only fires on the CLI path.',
      '**Reproduction**: run it',
      'expected: refused',
      'observed: merged', '',
      '## WARNING', '',
      '### Drift',
      '**File**: design.md:3',
      '**Description**: fix', '',
      '## SUGGESTION', '', 'None.', '',
    ]);
    const after = readTrail(dir).passes[0];
    expect([after.critical, after.warning, after.suggestion]).toEqual([before.critical, before.warning, before.suggestion]);
    expect([after.critical, after.warning, after.suggestion]).toEqual([1, 1, 0]);
    expect(after.findings.map(f => [f.title, f.file, f.severity])).toEqual(before.findings.map(f => [f.title, f.file, f.severity]));
  });

  it('counts are unchanged by a `## Blocks` section with entries, including a heading-shaped line inside it', () => {
    external(BASE);
    const before = readTrail(dir).passes[0];
    external([
      ...BASE,
      '## Blocks', '',
      '- orbit validate fails on specs/x/spec.md:12',
      '### Not a finding',
      '- unresolved @review: marker at design.md:40', '',
    ]);
    const after = readTrail(dir).passes[0];
    expect(after).toBeDefined();
    expect([after.critical, after.warning, after.suggestion]).toEqual([before.critical, before.warning, before.suggestion]);
    expect(after.findings).toHaveLength(before.findings.length);
  });

  it('`None.` under Blocks and a Blocks section placed before Notes leave the pass readable', () => {
    external([...BASE, '## Blocks', '', 'None.', '', '## Notes', '', 'texture', '']);
    const pass = readTrail(dir).passes.find(p => p.source === 'external');
    expect(pass).toBeDefined();
    expect([pass!.critical, pass!.warning, pass!.suggestion]).toEqual([1, 1, 0]);
  });
});
