import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseSchema } from '../../../src/core/artifact-graph/schema.js';
import { computeGateStates } from '../../../src/core/artifact-graph/gates.js';
import { loadChangeContext, formatChangeStatus } from '../../../src/core/artifact-graph/instruction-loader.js';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
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

/**
 * rc18-walk-is-next. A passed FRONTIER gate holding an unwalked pass names the walk (D1, D2), and an
 * unpassed or stale gate names the walk for an unwalked pass as it does for an unresolved one (D5).
 * The gate's state and reason never move. Change-level next selection runs through the real
 * `formatChangeStatus` over the shipped `spec-driven` schema in a disposable project.
 */
describe('rc18 — the walk is next', () => {
  let root: string;
  let cr: string;
  const C = 'c';

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc18-'));
    const cd = path.join(root, 'orbit', 'changes', C);
    cr = path.join(cd, '.orbit-runs');
    fs.mkdirSync(path.join(cd, 'specs', 's'), { recursive: true });
    fs.mkdirSync(cr, { recursive: true });
    fs.writeFileSync(path.join(cd, '.openspec.yaml'), 'schema: spec-driven\nschema_version: 5\n');
    fs.writeFileSync(path.join(cd, 'proposal.md'), '# Proposal\n\n## Why\nw\n');
    fs.writeFileSync(path.join(cd, 'design.md'), '# Design\n');
    fs.writeFileSync(
      path.join(cd, 'specs', 's', 'spec.md'),
      '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n'
    );
    tasks(false);
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  function tasks(done: boolean): void {
    fs.writeFileSync(path.join(root, 'orbit', 'changes', C, 'tasks.md'), `# Tasks\n\n## 1. G\n\n- [${done ? 'x' : ' '}] 1.1 one\n`);
  }
  function walk(token: string, source: string, entries: Array<[Sev, string]>): void {
    fs.writeFileSync(
      path.join(cr, `address-reviews-${token}.json`),
      JSON.stringify({
        source_path: `orbit/changes/${C}/.orbit-runs/${source}`,
        resolution_summary: { resolved: entries.length, deferred: 0, escalated: 0 },
        resolutions: entries.map(([severity, title]) => ({ severity, title, file: `f/${title}.ts`, outcome: 'resolved' })),
      })
    );
  }
  const launch = (token: string, mode: string) =>
    fs.writeFileSync(path.join(cr, `review-external-${token}.json`), JSON.stringify({ command: 'review-external', mode, pair: true }));
  const applyEmit = (token: string) =>
    fs.writeFileSync(path.join(cr, `apply-${token}.json`), JSON.stringify({ command: 'apply' }));
  const S3: Array<[Sev, string]> = [['SUGGESTION', 's1'], ['SUGGESTION', 's2'], ['SUGGESTION', 's3']];

  function ctx(mutate?: (s: SchemaYaml) => void) {
    const c = loadChangeContext(root, C);
    if (!mutate) return c;
    const schema = structuredClone(c.schema);
    mutate(schema);
    return { ...c, schema };
  }
  const status = (mutate?: (s: SchemaYaml) => void) => formatChangeStatus(ctx(mutate));
  const row = (st: ReturnType<typeof formatChangeStatus>, id: string) => st.gates.find(g => g.id === id)!;

  const APPLY = `/orbit:apply ${C} — user-invoked`;
  const ARCHIVE = `/orbit:archive ${C} — user-invoked`;
  const WALK = `/orbit:address-reviews ${C}`;
  const IN_CONTEXT = (mode: string) => `/orbit:review --as ${mode} ${C}`;

  /** The row-equality rule, stated independently of the engine's predicate: on every passed gate whose
   *  `before` names no passed gate and whose unwalked list is non-empty, the row's next IS the change's. */
  function expectRowsAgree(st: ReturnType<typeof formatChangeStatus>): number {
    const passedIds = new Set(st.gates.filter(g => g.state === 'passed').map(g => g.id));
    let n = 0;
    for (const g of st.gates) {
      if (g.kind !== 'reviewed' || g.state !== 'passed' || (g.unwalkedPasses?.length ?? 0) === 0) continue;
      if (g.before && passedIds.has(g.before)) continue;
      expect(g.nextCommand).toBe(st.next_command);
      n++;
    }
    return n;
  }

  /** Proposal gate passed through a clean fresh single + an in-context pass carrying `ic`. */
  function proposalPassed(ic: Array<[Sev, string]> = []): void {
    review(cr, T(1), 'proposal', 'fresh');
    review(cr, T(2), 'proposal', 'in-context', ic);
  }

  describe('1.3 — the selection table, row by row', () => {
    it('ungated schema: no gate rows and no command from the selection', () => {
      const st = status(s => {
        delete (s as any).gates;
        delete (s as any).apply;
      });
      expect(st.gates).toEqual([]);
      expect(st.next_command).toBeUndefined();
    });

    it('tracked `ready` beside a passed frontier gate with no unwalked pass: the apply command, the row keeping its phase command', () => {
      proposalPassed();
      const st = status();
      expect(row(st, 'review-proposal').state).toBe('passed');
      expect(row(st, 'review-proposal').unwalkedPasses).toEqual([]);
      expect(row(st, 'review-proposal').nextCommand).toBe(APPLY);
      expect(row(st, 'apply').state).toBe('ready');
      expect(st.next_command).toBe(APPLY);
      expect(st.next_hint_keys).toEqual({ phase: 'apply' });
    });

    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: A passed proposal gate with an unwalked pass names the walk
    it('passed frontier `review-proposal` holding an unwalked pass: the walk, on the row and the change, state unchanged', () => {
      proposalPassed(S3);
      const st = status();
      const rp = row(st, 'review-proposal');
      expect(rp.state).toBe('passed');
      expect(rp.unwalkedPasses!.map(p => p.token)).toEqual([T(2)]);
      expect(row(st, 'apply').state).toBe('ready');
      expect(st.next_command).toBe(WALK);
      expect(rp.nextCommand).toBe(WALK);
      expect(st.next_command).not.toMatch(/user-invoked|--from-file/);
      expect(st.next_hint_keys).toEqual({ phase: 'review-proposal' });
      // reviewed `blocked`: the system gate carries no unwalked list and is never selected
      expect(row(st, 'review-system').state).toBe('blocked');
      expect('unwalkedPasses' in row(st, 'review-system')).toBe(false);
      expect(expectRowsAgree(st)).toBe(1);
    });

    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: A gate past its phase never names the walk
    it('passed `review-proposal` after tracked `apply` passed is not the frontier: never the walk, never `/orbit:apply`', () => {
      proposalPassed(S3);
      tasks(true);
      const st = status();
      const rp = row(st, 'review-proposal');
      expect(rp.state).toBe('passed');
      expect(rp.unwalkedPasses).toHaveLength(1);
      expect(rp.nextCommand).toBe(APPLY); // its row keeps its phase command
      expect(row(st, 'apply').state).toBe('passed');
      expect(st.next_command).toBe(`/orbit:review --as system --reviewer blind-pair ${C}`);
      expect(st.next_command).not.toBe(WALK);
      expect(st.next_command).not.toMatch(/^\/orbit:apply/);
      expect(st.next_hint_keys?.phase).toBe('review-system');
    });

    it('superseded `review-proposal` is skipped: its unwalked passes are not recommended', () => {
      review(cr, T(1), 'proposal', 'fresh', [['WARNING', 'w'], ['SUGGESTION', 's']]);
      review(cr, T(2), 'proposal', 'fresh', [['SUGGESTION', 'only']]);
      tasks(true);
      const st = status();
      const rp = row(st, 'review-proposal');
      expect(rp.superseded).toBe(true);
      expect(rp.nextCommand).toBe(WALK); // its own row's walk, never selected
      expect(st.next_command).toBe(`/orbit:review --as system --reviewer blind-pair ${C}`);
    });

    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: A passed system gate with an unwalked pass names the walk before archive
    it('every gate passed and `review-system` holds an unwalked pass: the walk before the fall-through, archive still eligible', () => {
      proposalPassed();
      tasks(true);
      review(cr, T(3), 'system', 'fresh');
      review(cr, T(4), 'system', 'in-context', [['SUGGESTION', 'x']]);
      const st = status();
      expect(st.gates.every(g => g.state === 'passed')).toBe(true);
      expect(st.next_command).toBe(WALK);
      expect(st.next_command).not.toBe(ARCHIVE);
      expect(st.next_hint_keys).toEqual({ phase: 'review-system' });
      expect(st.position).toMatch(/archive ready$/);
      expect(expectRowsAgree(st)).toBe(1);
    });

    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: Walking the last slot's pass returns the phase command
    it('walking the last slot\'s pass returns the phase command and the gate stays passed (proposal and system)', () => {
      proposalPassed(S3);
      walk(T(3), `review-proposal-${T(2)}.json`, S3);
      let st = status();
      expect(row(st, 'review-proposal').state).toBe('passed');
      expect(row(st, 'review-proposal').nextCommand).toBe(APPLY);
      expect(st.next_command).toBe(APPLY);

      tasks(true);
      review(cr, T(4), 'system', 'fresh');
      review(cr, T(5), 'system', 'in-context', [['SUGGESTION', 'x']]);
      expect(status().next_command).toBe(WALK);
      walk(T(6), `review-system-${T(5)}.json`, [['SUGGESTION', 'x']]);
      st = status();
      expect(row(st, 'review-system').state).toBe('passed');
      expect(st.next_command).toBe(ARCHIVE);
    });

    it('a `before` naming an artifact, or nothing, stays the frontier', () => {
      review(cr, T(1), 'proposal', 'in-context', [['SUGGESTION', 's']]);
      const only = (before: string | undefined) => (s: SchemaYaml) => {
        s.gates = [{ id: 'review-proposal', kind: 'reviewed', requires: ['proposal'], cadence: ['in-context'], ...(before ? { before } : {}) } as any];
        delete (s as any).apply;
      };
      for (const before of ['tasks', undefined]) {
        const st = status(only(before));
        const rp = row(st, 'review-proposal');
        expect(rp.state).toBe('passed');
        expect(st.next_command).toBe(WALK);
        expect(rp.nextCommand).toBe(WALK);
        expect(st.next_hint_keys).toEqual({ phase: 'review-proposal' });
      }
    });
  });

  describe('2.2 — the unpassed gate\'s order', () => {
    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: An unpassed gate with an unwalked SUGGESTION-only pass names the walk first
    it('a SUGGESTION-only invoked pass and no in-context pass: the walk, state and reason unchanged; the in-context review once walked', () => {
      review(cr, T(1), 'proposal', 'fresh');
      const clean = row(status(), 'review-proposal');
      expect(clean.nextCommand).toBe(IN_CONTEXT('proposal')); // exit (3)'s unchanged branch
      review(cr, T(1), 'proposal', 'fresh', [['SUGGESTION', 's1'], ['SUGGESTION', 's2']]);
      let st = status();
      const rp = row(st, 'review-proposal');
      expect([rp.state, rp.reason]).toEqual([clean.state, clean.reason]);
      expect(rp.state).toBe('unpassed');
      expect(rp.nextCommand).toBe(WALK);
      expect(st.next_command).toBe(WALK);
      walk(T(2), `review-proposal-${T(1)}.json`, [['SUGGESTION', 's1'], ['SUGGESTION', 's2']]);
      st = status();
      expect(row(st, 'review-proposal').nextCommand).toBe(IN_CONTEXT('proposal'));
      expect(st.next_command).toBe(IN_CONTEXT('proposal'));
    });

    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: A half-landed pair outranks the walk
    it('a half-landed pair with a SUGGESTION-only member names the missing member, not the walk', () => {
      launch(T(1), 'proposal');
      review(cr, T(2), 'proposal', 'fresh', [['SUGGESTION', 's']]);
      const st = status();
      const rp = row(st, 'review-proposal');
      expect(rp.openPair).toEqual({ missing: 'external' });
      expect(rp.unwalkedPasses).toHaveLength(1);
      expect(rp.nextCommand).toBe(`/orbit:review --as proposal --reviewer external ${C}`);
      expect(st.next_command).toBe(rp.nextCommand);
    });

    it('a stale gate holding an unwalked pass names the walk', () => {
      proposalPassed();
      tasks(true);
      review(cr, T(3), 'system', 'fresh', [['SUGGESTION', 's']]);
      review(cr, T(4), 'system', 'in-context');
      applyEmit(T(5));
      const st = status();
      const rs = row(st, 'review-system');
      expect(rs.state).toBe('stale');
      expect(rs.unwalkedPasses!.map(p => p.token)).toEqual([T(3)]);
      expect(rs.nextCommand).toBe(WALK);
      expect(st.next_command).toBe(WALK);
    });

    it('an unpassed gate with no unresolved or unwalked pass keeps its slot command', () => {
      review(cr, T(1), 'proposal', 'fresh');
      const st = status();
      expect(row(st, 'review-proposal').state).toBe('unpassed');
      expect(st.next_command).toBe(IN_CONTEXT('proposal'));
    });
  });

  describe('3.x — after the walk', () => {
    it('3.1 the ordinary order: walk first, then the in-context review, then passed and the phase command', () => {
      review(cr, T(1), 'proposal', 'fresh', [['SUGGESTION', 's']]);
      expect(status().next_command).toBe(WALK);
      walk(T(2), `review-proposal-${T(1)}.json`, [['SUGGESTION', 's']]);
      expect(status().next_command).toBe(IN_CONTEXT('proposal'));
      review(cr, T(3), 'proposal', 'in-context');
      const st = status();
      expect(row(st, 'review-proposal').state).toBe('passed');
      expect(st.next_command).toBe(APPLY);
    });

    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: Walking an earlier slot's pass after the gate passed names the check it owes
    it('3.1 Case 1: an off-path walk of the invoked pass after the in-context pass un-passes and names the in-context command', () => {
      review(cr, T(1), 'proposal', 'fresh', [['SUGGESTION', 's']]);
      review(cr, T(2), 'proposal', 'in-context');
      let st = status();
      expect(row(st, 'review-proposal').state).toBe('passed');
      expect(st.next_command).toBe(WALK); // the passed frontier gate names the walk it holds
      walk(T(3), `review-proposal-${T(1)}.json`, [['SUGGESTION', 's']]);
      st = status();
      expect(row(st, 'review-proposal').state).toBe('unpassed');
      expect(st.next_command).toBe(IN_CONTEXT('proposal'));
      expect(st.next_command).not.toBe(WALK);
      expect(st.next_command).not.toBe(APPLY);
    });

    // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: A longer cadence can owe more than one review after an off-path walk
    it('3.2 a three-slot cadence owes the external review, then the in-context review', () => {
      const three = (s: SchemaYaml) => {
        const g = (s.gates as any[]).find(x => x.id === 'review-proposal');
        g.cadence = ['fresh', 'external', 'in-context'];
      };
      review(cr, T(1), 'proposal', 'fresh', [['SUGGESTION', 's']]);
      external(cr, T(2), 'proposal');
      review(cr, T(3), 'proposal', 'in-context');
      expect(row(status(three), 'review-proposal').state).toBe('passed');
      walk(T(4), `review-proposal-${T(1)}.json`, [['SUGGESTION', 's']]);
      let st = status(three);
      expect(row(st, 'review-proposal').state).toBe('unpassed');
      expect(st.next_command).toBe(`/orbit:review --as proposal --reviewer external ${C}`);
      external(cr, T(5), 'proposal');
      st = status(three);
      expect(row(st, 'review-proposal').state).toBe('unpassed');
      expect(st.next_command).toBe(IN_CONTEXT('proposal'));
    });

    it('3.3 the walk\'s own emit over the last unwalked pass carries the phase command as next_recommended', () => {
      proposalPassed([['SUGGESTION', 'only']]);
      fs.mkdirSync(path.join(root, 'f'), { recursive: true });
      fs.writeFileSync(path.join(root, 'f', 'only.ts'), 'x\n');
      const src = `orbit/changes/${C}/.orbit-runs/review-proposal-${T(2)}.json`;
      const r = composeAndWriteEmit(
        'address-reviews',
        { change: C },
        {
          final_assessment: 'One of one resolved.',
          source: 'auto-discovered',
          source_path: src,
          source_command: 'review',
          source_token: T(2),
          latest_apply_token: null,
          external_reviewer: null,
          walk_mode: 'per_finding',
          input_findings_summary: { critical: 0, warning: 0, suggestion: 1 },
          pushback_verification: 'verified',
          resolution_summary: { resolved: 1, stale_suppressed: 0, deferred: 0, escalated: 0 },
          resolutions: [
            {
              severity: 'SUGGESTION',
              title: 'only',
              marker_source: 'internal-review',
              file: 'f/only.ts',
              line: 1,
              classification: 'trivial_fix',
              action: 'fixed',
              ripple_cascade: { applied: [], flagged_not_applied: [] },
              sweep: { retired: [], introduced: [], searched: ['only'], scope: [], kept: [] },
              remedy: 'repair',
              outcome: 'resolved',
            },
          ],
          remaining_markers_in_scope: 0,
          persisted_escalations: [],
          model: null,
        },
        { projectRoot: root }
      );
      expect(r.emit.next_recommended).toBe(APPLY);
      expect(status().next_command).toBe(APPLY);
    });
  });

  /** rc18 system walk (Sal: 1B, 2A): the scenarios of the three requirement blocks the walk carried. */
  describe('system walk — verify leads with the walk, and the carried blocks', () => {
    const verify = (payload: Record<string, unknown>) =>
      String(composeAndWriteEmit('verify', { change: C }, { final_assessment: 'v', verdict: 'pass', model: null, ...payload }, { projectRoot: root }).emit.next_recommended);
    const CLAUSE = 'walk the outstanding review findings first';
    function systemOpen(findings: Array<[Sev, string]>): void {
      proposalPassed();
      tasks(true);
      review(cr, T(3), 'system', 'fresh', findings);
    }

    // @scenario behaviour orbit-run-summary-emit :: Verify pass recommendation :: Verify pass emit recommends review-as-system canonically
    it('nothing outstanding: a verify pass leads with the graph\'s system-review command and names archive as the alternative', () => {
      systemOpen([]);
      const st = status();
      expect(st.next_command).toBe(IN_CONTEXT('system'));
      const next = verify({});
      expect(next.startsWith(`${st.next_command} — verification clean; formal pre-archive review recommended`)).toBe(true);
      expect(next).toContain(`/orbit:archive ${C}`);
    });

    // @scenario behaviour orbit-run-summary-emit :: Verify pass recommendation :: A verify pass with a review pass outstanding leads with the walk
    it('a review pass outstanding: a verify pass leads with the walk and names no archive, unpassed and passed alike', () => {
      systemOpen([['SUGGESTION', 's']]);
      expect(row(status(), 'review-system').state).toBe('unpassed');
      expect(verify({})).toBe(`${WALK} — verification clean; ${CLAUSE}`);
      walk(T(4), `review-system-${T(3)}.json`, [['SUGGESTION', 's']]);
      review(cr, T(5), 'system', 'in-context', [['SUGGESTION', 'x']]);
      expect(row(status(), 'review-system').state).toBe('passed');
      const next = verify({});
      expect(next).toBe(`${WALK} — verification clean; ${CLAUSE}`);
      expect(next).not.toContain('/orbit:archive');
    });

    // @scenario behaviour orbit-run-summary-emit :: Verify fail-mode recommendations :: Mode ② and the warn state lead with the walk when a review pass is outstanding
    it('mode ② and the warn state lead with the walk when a review pass is outstanding', () => {
      systemOpen([['SUGGESTION', 's']]);
      expect(verify({ verdict: 'fail', fail_mode: 'scenarios-fail', scenarios_failed: 2 })).toBe(
        `${WALK} — 2 spec scenarios fail against implementation; ${CLAUSE}`
      );
      expect(verify({ fail_mode: 'warnings', warnings_count: 3 })).toBe(`${WALK} — verification passed with 3 warnings; ${CLAUSE}`);
    });

    // @scenario behaviour orbit-run-summary-emit :: No forward-look at planned future behavior changes :: Verify-pass recommendation does not reference planned reviewer-mode changes
    it('the verify-pass lead is the graph\'s command and the text adds no reviewer-mode qualifier of its own', () => {
      systemOpen([]);
      const lead = status().next_command!;
      const next = verify({});
      expect(next.startsWith(`${lead} — `)).toBe(true);
      expect(next.slice(lead.length)).not.toMatch(/external|fresh|reviewer|blind/i);
    });

    // @scenario behaviour orbit-run-summary-emit :: No forward-look at planned future behavior changes :: Emit text contains no other-issue references
    it('verify recommendations in every branch carry no issue number', () => {
      systemOpen([['SUGGESTION', 's']]);
      const texts = [
        verify({}),
        verify({ fail_mode: 'warnings', warnings_count: 1 }),
        verify({ verdict: 'fail', fail_mode: 'scenarios-fail', scenarios_failed: 1 }),
        verify({ verdict: 'fail', fail_mode: 'incomplete' }),
      ];
      walk(T(4), `review-system-${T(3)}.json`, [['SUGGESTION', 's']]);
      texts.push(verify({}));
      for (const t of texts) expect(t).not.toMatch(/#\d+/);
    });

    // @scenario behaviour orbit-engine-gates :: Gate-aware status and instructions with position readout :: Status shows the position readout
    it('the status text renders per-gate rows with reasons and the position readout', async () => {
      const { printStatusText } = await import('../../../src/commands/workflow/status.js');
      review(cr, T(1), 'proposal', 'fresh', [['WARNING', 'w']]);
      const st = status();
      const lines: string[] = [];
      const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')));
      try {
        printStatusText(st);
      } finally {
        spy.mockRestore();
      }
      const out = lines.join('\n');
      expect(out).toContain('Gates:');
      expect(out).toContain(`review-proposal: unpassed (${row(st, 'review-proposal').reason})`);
      expect(out).toContain(`Position: ${st.position}`);
    });

    // @scenario behaviour orbit-engine-gates :: Gate-aware status and instructions with position readout :: An undeclared budget is absent as a KEY, not merely as a JSON value
    it('a gate declaring no budget carries no budget key on its row', () => {
      review(cr, T(1), 'proposal', 'fresh');
      const st = status(s => {
        for (const g of s.gates as any[]) delete g.budget;
      });
      for (const g of st.gates) expect(Object.hasOwn(g, 'budget')).toBe(false);
      expect(Object.hasOwn(row(status(), 'review-proposal'), 'budget')).toBe(true);
    });

    // @scenario behaviour orbit-engine-gates :: Gate-aware status and instructions with position readout :: Spend never renders a position token
    it('a gate whose spend reached its budget reads unpassed, reports the figure, and renders no spend token', () => {
      for (const n of [1, 2, 3]) review(cr, T(n), 'proposal', 'fresh', [['WARNING', `w${n}`]]);
      const st = status();
      const rp = row(st, 'review-proposal');
      expect(rp.state).toBe('unpassed');
      expect(rp.independentSpend).toBe(3);
      expect(rp.budget).toBe(3);
      expect(rp.reason).not.toMatch(/budget|spen[dt]|exhaust/i);
      expect(st.position).toContain('review(proposal) unpassed');
      expect(st.position).not.toMatch(/BUDGET|SPENT/);
    });

    // @scenario behaviour orbit-engine-gates :: Gate-aware status and instructions with position readout :: Instructions surface blocked-by-gate
    it('apply instructions surface blocked-by-gate with the gate id, reason and canonical next before any task is checked', async () => {
      const { generateApplyInstructions } = await import('../../../src/commands/workflow/instructions.js');
      review(cr, T(1), 'proposal', 'fresh', [['WARNING', 'w']]);
      const ins = await generateApplyInstructions(root, C);
      expect(ins.state).toBe('blocked-by-gate');
      expect(ins.gate).toMatchObject({ id: 'review-proposal', state: 'unpassed', reason: row(status(), 'review-proposal').reason });
      expect(ins.next_command).toBe(WALK);
    });

    // @scenario behaviour orbit-engine-gates :: Gate-aware status and instructions with position readout :: blocked-by-gate is entry-gated, not a mid-apply re-block
    it('once a task is checked, an unpassed proposal gate no longer blocks apply', async () => {
      const { generateApplyInstructions } = await import('../../../src/commands/workflow/instructions.js');
      review(cr, T(1), 'proposal', 'fresh', [['WARNING', 'w']]);
      fs.writeFileSync(path.join(root, 'orbit', 'changes', C, 'tasks.md'), '# Tasks\n\n## 1. G\n\n- [x] 1.1 one\n- [ ] 1.2 two\n');
      const ins = await generateApplyInstructions(root, C);
      expect(row(status(), 'review-proposal').state).toBe('unpassed');
      expect(ins.state).toBe('ready');
      expect(ins.gate).toBeUndefined();
    });

    // @scenario behaviour orbit-engine-gates :: Gate-aware status and instructions with position readout :: A before naming an artifact never marks a gate superseded
    it('an unpassed gate whose before names a complete artifact is not superseded', () => {
      review(cr, T(1), 'proposal', 'fresh', [['WARNING', 'w']]);
      const st = status(s => {
        s.gates = [{ id: 'review-proposal', kind: 'reviewed', requires: ['proposal'], cadence: ['fresh', 'in-context'], before: 'tasks' } as any];
        delete (s as any).apply;
      });
      const rp = row(st, 'review-proposal');
      expect(rp.state).toBe('unpassed');
      expect(rp.superseded).toBeFalsy();
      expect(st.position).toContain('review(proposal) unpassed');
      expect(st.position).not.toContain('(past)');
      expect(st.next_command).toBe(WALK);
    });
  });
});
