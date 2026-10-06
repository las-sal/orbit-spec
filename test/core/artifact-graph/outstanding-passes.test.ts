import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseSchema } from '../../../src/core/artifact-graph/schema.js';
import { computeGateStates } from '../../../src/core/artifact-graph/gates.js';
import type { SchemaYaml } from '../../../src/core/artifact-graph/types.js';

/**
 * rc08b-walk-routing. A reviewed gate lists EVERY outstanding pass (`unresolvedPasses`) and
 * reports an open blind pair as a field (`openPair`), so the walk discovers exactly what the
 * gate holds — one predicate, one voice. Trails are written by hand and run through the engine.
 */

const PAIR_YAML = `
name: t-pair
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: P
    template: p.md
  - id: tasks
    generates: tasks.md
    description: T
    template: t.md
    requires: [proposal]
gates:
  - id: apply
    kind: tracked
    requires: [tasks]
    tracks: tasks.md
  - id: review-system
    kind: reviewed
    requires: [apply]
    cadence: [blind-pair, in-context]
    budget: 3
    before: archive
`;

const PROPOSAL_YAML = `
name: t-prop
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: P
    template: p.md
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal]
    cadence: [independent, in-context]
    budget: 3
    before: apply
`;

let dir: string;
let runs: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc08b-'));
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(dir, 'proposal.md'), '# P');
  fs.writeFileSync(path.join(dir, 'tasks.md'), '- [x] one\n');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

type Sev = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
const T = (n: number) => `2026-10-05T10-${String(n).padStart(2, '0')}-00Z`;

function review(at: string, token: string, mode: string, cls: string, findings: Array<[Sev, string]> = []) {
  fs.writeFileSync(
    path.join(at, `review-${mode}-${token}.json`),
    JSON.stringify({
      command: 'review',
      mode,
      reviewer_class: cls,
      findings: findings.map(([severity, title]) => ({ severity, title, file: `f/${title}.ts` })),
    })
  );
}

function external(at: string, token: string, mode: string, findings: Array<[Sev, string]> = []) {
  const sec = (s: Sev) => {
    const mine = findings.filter(f => f[0] === s);
    if (mine.length === 0) return `## ${s}\n\nNone.\n`;
    return `## ${s}\n\n` + mine.map(f => `### ${f[1]}\n**File**: f/${f[1]}.ts\n**Description**: d\n`).join('\n') + '\n';
  };
  fs.writeFileSync(
    path.join(at, `external-${mode}-${token}.md`),
    `# External Review: x (iteration 1)\n\n**Reviewer**: M\n\n${sec('CRITICAL')}\n${sec('WARNING')}\n${sec('SUGGESTION')}\n`
  );
}

function gate(yaml: string, id = 'review-system') {
  const schema: SchemaYaml = parseSchema(yaml);
  return computeGateStates(schema, 'x', dir, new Set(['proposal', 'tasks'])).gates.find(g => g.id === id)!;
}

describe('rc08b — a reviewed gate lists its outstanding passes', () => {
  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: Two unresolved passes are both listed
  it('lists both unresolved passes in token order, internal then external, reason naming the first', () => {
    review(runs, T(1), 'system', 'fresh', [['WARNING', 'w1']]);
    external(runs, T(2), 'system', [['WARNING', 'w2']]);
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.unresolvedPasses).toHaveLength(2);
    expect(g.unresolvedPasses![0]).toMatchObject({ token: T(1), mode: 'system', source: 'internal-review' });
    expect(g.unresolvedPasses![1]).toMatchObject({ token: T(2), mode: 'system', source: 'external' });
    expect(path.basename(g.unresolvedPasses![0].file)).toBe(`review-system-${T(1)}.json`);
    expect(path.basename(g.unresolvedPasses![1].file)).toBe(`external-system-${T(2)}.md`);
    expect(g.reason).toBe(`pass ${T(1)} has unresolved substantive findings`);
    expect(g.openPair).toBeUndefined();
  });

  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: A resolved gate lists nothing
  it('a gate whose passes are all resolved carries [] — passed and unpassed alike', () => {
    review(runs, T(1), 'system', 'fresh');
    external(runs, T(2), 'system');
    expect(gate(PAIR_YAML).state).toBe('unpassed'); // in-context slot owed
    expect(gate(PAIR_YAML).unresolvedPasses).toEqual([]);
    review(runs, T(3), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('passed');
    expect(g.unresolvedPasses).toEqual([]);
  });

  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: An open pair is a field
  it('an open blind pair is a field beside the unchanged reason', () => {
    review(runs, T(1), 'system', 'fresh', [['WARNING', 'w1']]);
    const g = gate(PAIR_YAML);
    expect(g.openPair).toEqual({ missing: 'external' });
    expect(g.reason).toBe(
      `pass ${T(1)} has unresolved substantive findings — and the blind pair is OPEN: run the external member BEFORE walking these findings, or the pair can never be formed on this state`
    );
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
    expect(g.unresolvedPasses).toHaveLength(1);
  });

  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: Two fresh passes and no external still report the open pair
  it('two pairable fresh passes and no external report openPair external', () => {
    review(runs, T(1), 'system', 'fresh');
    review(runs, T(2), 'system', 'fresh');
    expect(gate(PAIR_YAML).openPair).toEqual({ missing: 'external' });
  });

  it('an external with no fresh partner reports openPair fresh', () => {
    external(runs, T(1), 'system', [['CRITICAL', 'c1']]);
    const g = gate(PAIR_YAML);
    expect(g.openPair).toEqual({ missing: 'fresh' });
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
  });

  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: The walk next names no file
  it('the unresolved-pass canonical next is the change-scoped walk, naming no file', () => {
    review(runs, T(1), 'proposal', 'fresh', [['WARNING', 'w1']]);
    const g = gate(PROPOSAL_YAML, 'review-proposal');
    expect(g.nextCommand).toBe('/orbit:address-reviews x');
    expect(g.nextCommand).not.toMatch(/--from-file/);
  });

  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: A blocked gate carries none of the three fields
  it('a blocked gate carries none of the three fields', () => {
    fs.writeFileSync(path.join(dir, 'tasks.md'), '- [ ] one\n');
    review(runs, T(1), 'system', 'fresh', [['WARNING', 'w1']]);
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('blocked');
    expect('unresolvedPasses' in g).toBe(false);
    expect('unwalkedPasses' in g).toBe(false);
    expect('openPair' in g).toBe(false);
  });
});

describe('rc08b — both fields reach orbit status --change --json', () => {
  it('the gate row carries unresolvedPasses with a repo-relative file, and openPair', async () => {
    const { loadChangeContext, formatChangeStatus } = await import(
      '../../../src/core/artifact-graph/instruction-loader.js'
    );
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc08b-proj-'));
    try {
      const cd = path.join(root, 'orbit', 'changes', 'c');
      const cr = path.join(cd, '.orbit-runs');
      fs.mkdirSync(path.join(cd, 'specs'), { recursive: true });
      fs.mkdirSync(cr, { recursive: true });
      for (const f of ['proposal.md', 'design.md']) fs.writeFileSync(path.join(cd, f), '# x');
      fs.writeFileSync(path.join(cd, 'specs', 's.md'), '# s');
      fs.writeFileSync(path.join(cd, 'tasks.md'), '- [x] one\n');
      // rc17a: under spec-driven v5 a lone fresh pass is a single that covers the `invoked` slot, so the
      // open pair this test projects is now a LAUNCHED one — a `pair: true` T0 before the fresh half.
      fs.writeFileSync(
        path.join(cr, `review-external-${T(0)}.json`),
        JSON.stringify({ command: 'review-external', mode: 'system', pair: true })
      );
      review(cr, T(1), 'system', 'fresh', [['WARNING', 'w1']]);
      const status = formatChangeStatus(loadChangeContext(root, 'c'));
      const row = status.gates.find(g => g.id === 'review-system')!;
      expect(row.unresolvedPasses).toEqual([
        { token: T(1), file: `orbit/changes/c/.orbit-runs/review-system-${T(1)}.json`, mode: 'system', source: 'internal-review' },
      ]);
      expect(row.unwalkedPasses).toEqual([]);
      expect(row.openPair).toEqual({ missing: 'external' });
      // JSON round trip keeps both (the projection is field-by-field and explicit).
      const json = JSON.parse(JSON.stringify(status));
      expect(json.gates.find((g: any) => g.id === 'review-system').unresolvedPasses).toHaveLength(1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('a passed gate row carries unresolvedPasses: []', async () => {
    const { loadChangeContext, formatChangeStatus } = await import(
      '../../../src/core/artifact-graph/instruction-loader.js'
    );
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc08b-proj-'));
    try {
      const cd = path.join(root, 'orbit', 'changes', 'c');
      const cr = path.join(cd, '.orbit-runs');
      fs.mkdirSync(path.join(cd, 'specs'), { recursive: true });
      fs.mkdirSync(cr, { recursive: true });
      for (const f of ['proposal.md', 'design.md']) fs.writeFileSync(path.join(cd, f), '# x');
      fs.writeFileSync(path.join(cd, 'specs', 's.md'), '# s');
      fs.writeFileSync(path.join(cd, 'tasks.md'), '- [x] one\n');
      review(cr, T(1), 'system', 'fresh');
      external(cr, T(2), 'system');
      review(cr, T(3), 'system', 'in-context');
      const status = formatChangeStatus(loadChangeContext(root, 'c'));
      const row = status.gates.find(g => g.id === 'review-system')!;
      expect(row.state).toBe('passed');
      expect(row.unresolvedPasses).toEqual([]);
      expect('openPair' in row).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

/** rc08b task 5.2: the four carried `Reviewed-gate pass condition` scenarios no existing test exercised. */
describe('rc08b 5.2 — carried convergence scenarios with no prior test', () => {
  function walk(token: string, sourceFile: string, entries: any[]) {
    fs.writeFileSync(
      path.join(runs, `address-reviews-${token}.json`),
      JSON.stringify({
        command: 'address-reviews',
        source_path: `orbit/x/.orbit-runs/${sourceFile}`,
        resolutions: entries,
        resolution_summary: { resolved: entries.length, stale_suppressed: 0, deferred: 0, escalated: 0 },
      })
    );
  }
  const ok = (sev: Sev, title: string) => ({ severity: sev, title, file: `f/${title}.ts`, outcome: 'resolved' });
  const withCadence = (c: string) => PAIR_YAML.replace('cadence: [blind-pair, in-context]', `cadence: ${c}`);

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Missing class coverage fails the gate
  it('a cadence requiring external, with only a fresh pass, names the class and targets it', () => {
    review(runs, T(1), 'system', 'fresh');
    const g = gate(withCadence('[external]'));
    expect(g.state).toBe('unpassed');
    expect(g.reason).toBe("cadence class 'external' has no fresh pass");
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: System gate passes on a resolved external, with no confirmation clause
  it('a resolved CRITICAL on the latest external does not hold a covered gate', () => {
    review(runs, T(1), 'system', 'fresh');
    external(runs, T(2), 'system', [['CRITICAL', 'c']]);
    walk(T(3), `external-system-${T(2)}.md`, [ok('CRITICAL', 'c')]);
    review(runs, T(4), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('passed');
    expect(g.unresolvedPasses).toEqual([]);
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: A viable assignment is found rather than foreclosed
  it('an earlier pair walked late does not foreclose a later pair walked promptly', () => {
    review(runs, T(1), 'system', 'fresh', [['WARNING', 'a']]);
    external(runs, T(2), 'system');
    review(runs, T(3), 'system', 'fresh');
    external(runs, T(4), 'system');
    review(runs, T(6), 'system', 'in-context');
    walk(T(7), `review-system-${T(1)}.json`, [ok('WARNING', 'a')]); // the earlier pair's walk lands AFTER the in-context pass
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: A pair member cannot be reused from the previous slot
  it('cadence [external, blind-pair]: the first slot\'s external cannot also be the pair\'s member', () => {
    external(runs, T(1), 'system');
    review(runs, T(2), 'system', 'fresh');
    const g = gate(withCadence('[external, blind-pair]'));
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/blind pair/);
  });
});
