import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseSchema, normalizeGates, SchemaValidationError } from '../../../src/core/artifact-graph/schema.js';
import { readTrail, parseTsToken } from '../../../src/core/artifact-graph/trail.js';
import { computeGateStates, isPassStale } from '../../../src/core/artifact-graph/gates.js';
import type { SchemaYaml } from '../../../src/core/artifact-graph/types.js';

// ---- Schema fixtures -------------------------------------------------------

const GATED_YAML = `
name: test-gated
version: 2
artifacts:
  - id: proposal
    generates: proposal.md
    description: Proposal
    template: p.md
  - id: tasks
    generates: tasks.md
    description: Tasks
    template: t.md
    requires: [proposal]
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal, tasks]
    cadence: [independent, in-context]
    confirm: no-new-findings
    before: apply
  - id: apply
    kind: tracked
    requires: [tasks]
    tracks: tasks.md
  - id: review-system
    kind: reviewed
    requires: [apply]
    cadence: [in-context, external, in-context]
    confirm: findings-resolved
    before: archive
`;

describe('artifact-graph/schema — gates (C1)', () => {
  it('parses a valid gates list', () => {
    const schema = parseSchema(GATED_YAML);
    expect(schema.gates).toHaveLength(3);
    const norm = normalizeGates(schema);
    const rp = norm.find(g => g.id === 'review-proposal')!;
    expect(rp.kind).toBe('reviewed');
    expect(rp.inputs).toEqual(['proposal', 'tasks']); // defaults to requires
    expect(rp.confirm).toBe('no-new-findings');
  });

  it('rejects an unknown gate kind, naming the gate id', () => {
    const yaml = GATED_YAML.replace('kind: tracked', 'kind: scored');
    expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
    expect(() => parseSchema(yaml)).toThrow(/apply.*invalid kind 'scored'|invalid kind 'scored'/);
  });

  it('rejects a reviewed gate with no cadence', () => {
    const yaml = `
name: t
version: 1
artifacts:
  - id: a
    generates: a.md
    description: A
    template: a.md
gates:
  - id: review-a
    kind: reviewed
    requires: [a]
`;
    expect(() => parseSchema(yaml)).toThrow(/cadence must declare at least one slot/);
  });

  it('normalizes an apply: block into a tracked gate', () => {
    const yaml = `
name: t
version: 1
artifacts:
  - id: tasks
    generates: tasks.md
    description: Tasks
    template: t.md
apply:
  requires: [tasks]
  tracks: tasks.md
`;
    const schema = parseSchema(yaml);
    const norm = normalizeGates(schema);
    const apply = norm.find(g => g.id === 'apply')!;
    expect(apply.kind).toBe('tracked');
    expect(apply.tracks).toBe('tasks.md');
    expect(apply.requires).toEqual(['tasks']);
  });

  it('rejects a double apply declaration (apply: block + gate id apply)', () => {
    const yaml = `
name: t
version: 1
artifacts:
  - id: tasks
    generates: tasks.md
    description: Tasks
    template: t.md
apply:
  requires: [tasks]
  tracks: tasks.md
gates:
  - id: apply
    kind: tracked
    requires: [tasks]
    tracks: tasks.md
`;
    expect(() => parseSchema(yaml)).toThrow(/double declaration/);
  });

  it('rejects a gate whose before targets an unknown phase', () => {
    const yaml = GATED_YAML.replace('before: apply', 'before: teleport');
    expect(() => parseSchema(yaml)).toThrow(/before 'teleport' is not/);
  });

  it('rejects a gate requiring an undeclared id', () => {
    const yaml = GATED_YAML.replace('requires: [proposal, tasks]', 'requires: [ghost]');
    expect(() => parseSchema(yaml)).toThrow(/requires 'ghost'/);
  });
});

// ---- Trail parsing ---------------------------------------------------------

describe('artifact-graph/trail — token parsing', () => {
  it('extracts a well-formed TS token', () => {
    expect(parseTsToken('review-proposal-2026-06-30T20-24-48Z.json')).toBe('2026-06-30T20-24-48Z');
  });
  it('returns null for an unparseable filename (treated as absent)', () => {
    expect(parseTsToken('review-proposal-garbage.json')).toBeNull();
  });
  it('tokens compare lexically by time', () => {
    const a = parseTsToken('apply-2026-06-30T18-00-00Z.json')!;
    const b = parseTsToken('apply-2026-06-30T20-00-00Z.json')!;
    expect(a < b).toBe(true);
  });
});

// ---- Gate computation (temp-dir fixtures) ----------------------------------

describe('artifact-graph/gates — computation', () => {
  let dir: string;
  const schema = parseSchema(GATED_YAML);

  const runs = () => path.join(dir, '.orbit-runs');
  const writeJson = (name: string, obj: unknown) =>
    fs.writeFileSync(path.join(runs(), name), JSON.stringify(obj));
  const writeFile = (name: string, body: string) => fs.writeFileSync(path.join(dir, name), body);
  const external = (name: string, body: string) => fs.writeFileSync(path.join(runs(), name), body);

  beforeEach(() => {
    dir = path.join(os.tmpdir(), `orbit-gates-test-${Date.now()}-${Math.floor(performance.now())}`);
    fs.mkdirSync(runs(), { recursive: true });
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const allArtifacts = new Set(['proposal', 'tasks']);

  it('blocks a gate whose artifact requires are incomplete', () => {
    const { gates } = computeGateStates(schema, 'c', dir, new Set());
    const rp = gates.find(g => g.id === 'review-proposal')!;
    expect(rp.state).toBe('blocked');
  });

  it('tracked apply gate does checkbox arithmetic', () => {
    writeFile('tasks.md', '- [x] one\n- [ ] two\n');
    const { gates } = computeGateStates(schema, 'c', dir, allArtifacts);
    const apply = gates.find(g => g.id === 'apply')!;
    expect(apply.state).toBe('ready');
    expect(apply.checked).toBe(1);
    expect(apply.total).toBe(2);

    writeFile('tasks.md', '- [x] one\n- [x] two\n');
    const passed = computeGateStates(schema, 'c', dir, allArtifacts).gates.find(g => g.id === 'apply')!;
    expect(passed.state).toBe('passed');
    expect(passed.nextCommand).toBeUndefined(); // apply has no `before`
  });

  it('review-proposal unpassed with no independent pass → recommends --fresh', () => {
    // only an in-context pass exists
    writeJson('review-proposal-2026-06-30T10-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'in-context',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    const rp = computeGateStates(schema, 'mychange', dir, allArtifacts).gates.find(g => g.id === 'review-proposal')!;
    expect(rp.state).toBe('unpassed');
    expect(rp.reason).toMatch(/cadence class 'independent'/);
    expect(rp.nextCommand).toBe('/orbit:review --as proposal --fresh mychange');
  });

  it('review-proposal is superseded (moot) once apply is passed; canonical-next skips it', () => {
    // apply complete, no proposal review ran → proposal gate would be unpassed, but its
    // `before` phase (apply) is done, so it is superseded and no longer the frontier.
    writeFile('tasks.md', '- [x] one\n- [x] two\n');
    const { gates, position } = computeGateStates(schema, 'mychange', dir, allArtifacts);
    const rp = gates.find(g => g.id === 'review-proposal')!;
    expect(rp.superseded).toBe(true);
    expect(position).toContain('review(proposal) (past)');
    // review-system is now the frontier (requires apply, which is passed).
    const rs = gates.find(g => g.id === 'review-system')!;
    expect(rs.state).toBe('unpassed');
  });

  it('review-proposal passes with clean independent + in-context confirm', () => {
    writeJson('review-proposal-2026-06-30T10-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'fresh',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    writeJson('review-proposal-2026-06-30T11-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'in-context',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    const rp = computeGateStates(schema, 'mychange', dir, allArtifacts).gates.find(g => g.id === 'review-proposal')!;
    expect(rp.state).toBe('passed');
    expect(rp.nextCommand).toBe('/orbit:apply mychange');
  });

  it('review-proposal unpassed when an independent pass has unresolved findings', () => {
    writeJson('review-proposal-2026-06-30T10-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'fresh',
      findings_summary: { critical: 0, warning: 1, suggestion: 0 },
      findings: [{ severity: 'WARNING', title: 'x', file: 'a.md', line: 3 }],
    });
    const rp = computeGateStates(schema, 'mychange', dir, allArtifacts).gates.find(g => g.id === 'review-proposal')!;
    expect(rp.state).toBe('unpassed');
    expect(rp.nextCommand).toMatch(/^\/orbit:address-reviews mychange --from-file /);
  });

  it('review-proposal unpassed on new findings even after resolution (no-new-findings confirm)', () => {
    writeJson('review-proposal-2026-06-30T10-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'fresh',
      findings_summary: { critical: 0, warning: 1, suggestion: 0 },
      findings: [{ severity: 'WARNING', title: 'brand new', file: 'a.md', line: 3 }],
    });
    writeJson('address-reviews-2026-06-30T10-30-00Z.json', {
      command: 'address-reviews',
      source_path: 'orbit/changes/c/.orbit-runs/review-proposal-2026-06-30T10-00-00Z.json',
      resolution_summary: { deferred: 0, escalated: 0 },
    });
    writeJson('review-proposal-2026-06-30T11-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'in-context',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    const rp = computeGateStates(schema, 'mychange', dir, allArtifacts).gates.find(g => g.id === 'review-proposal')!;
    // resolved, but the fresh pass yielded a NEW finding → confirm not met → repeat independent
    expect(rp.state).toBe('unpassed');
    expect(rp.nextCommand).toBe('/orbit:review --as proposal --fresh mychange');
  });

  it('parses external markdown findings and counts CRITICAL', () => {
    external(
      'external-system-2026-06-30T09-00-00Z.md',
      `# External Review\n\n**Reviewer**: GPT-5\n\n## CRITICAL\n\n### A real bug\n**File**: src/x.ts:10\n**Description**: bad\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n`
    );
    const trail = readTrail(dir);
    const ext = trail.passes.find(p => p.source === 'external')!;
    expect(ext.reviewerClass).toBe('external');
    expect(ext.mode).toBe('system');
    expect(ext.critical).toBe(1);
    expect(ext.warning).toBe(0);
    expect(ext.findings[0].file).toBe('src/x.ts'); // :line stripped
  });

  it('does NOT count an external prompt file or a T0 emit as a pass', () => {
    external('external-prompt-proposal-2026-06-30T09-00-00Z.md', '# External Review prompt...');
    writeJson('review-external-2026-06-30T09-00-01Z.json', { command: 'review-external', awaiting_findings: true });
    const trail = readTrail(dir);
    expect(trail.passes).toHaveLength(0);
  });

  it('freshness: an apply after a pass marks it stale', () => {
    const pass = {
      token: '2026-06-30T10-00-00Z', file: 'x', reviewerClass: 'fresh' as const,
      mode: 'proposal' as const, critical: 0, warning: 0, suggestion: 0, findings: [], source: 'internal-review' as const,
    };
    expect(isPassStale(pass, ['2026-06-30T11-00-00Z'])).toBe(true);
    expect(isPassStale(pass, ['2026-06-30T09-00-00Z'])).toBe(false);
    expect(isPassStale(pass, [])).toBe(false);
  });

  it('legacy emit without reviewer_class infers from flags.fresh', () => {
    writeJson('review-proposal-2026-06-30T10-00-00Z.json', {
      command: 'review', mode: 'proposal', flags: { fresh: true },
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    const trail = readTrail(dir);
    expect(trail.passes[0].reviewerClass).toBe('fresh');
  });
});

// ---- Compatibility (tasks 4.1 / 4.2) ---------------------------------------

describe('artifact-graph/gates — compatibility', () => {
  // 4.1: upstream apply-only schema (no gates) → one tracked gate; ungated behavior.
  const APPLY_ONLY = `
name: upstream-like
version: 1
artifacts:
  - id: tasks
    generates: tasks.md
    description: Tasks
    template: t.md
apply:
  requires: [tasks]
  tracks: tasks.md
`;

  it('4.1: apply-only YAML normalizes to exactly one tracked gate (id apply)', () => {
    const schema = parseSchema(APPLY_ONLY);
    const norm = normalizeGates(schema);
    expect(norm).toHaveLength(1);
    expect(norm[0].id).toBe('apply');
    expect(norm[0].kind).toBe('tracked');
  });

  it('4.1: ungated schema has no reviewed before:apply gate (apply never blocked-by-gate)', () => {
    const dir = path.join(os.tmpdir(), `orbit-compat-${Date.now()}`);
    fs.mkdirSync(dir, { recursive: true });
    try {
      fs.writeFileSync(path.join(dir, 'tasks.md'), '- [ ] one\n');
      const schema = parseSchema(APPLY_ONLY);
      const { gates } = computeGateStates(schema, 'c', dir, new Set(['tasks']));
      expect(gates.map(g => g.id)).toEqual(['apply']);
      expect(gates.every(g => g.before !== 'apply' || g.kind !== 'reviewed')).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // 4.2: real archived B3 trail — legacy emits (no reviewer_class) exercise inference.
  it('4.2: reads the archived B3 legacy trail with class inference, no crash', () => {
    const b3 = path.join(process.cwd(), 'orbit/changes/archive/2026-06-12-b3-net-new-workflows');
    if (!fs.existsSync(path.join(b3, '.orbit-runs'))) return; // fixture absent → skip
    const trail = readTrail(b3);
    expect(trail.passes.length).toBeGreaterThan(0);
    // The external-system-*.md is classed external by provenance (structural).
    expect(trail.passes.some(p => p.source === 'external' && p.reviewerClass === 'external')).toBe(true);
    // A review-proposal emit predating reviewer_class infers to in-context.
    expect(trail.passes.some(p => p.source === 'internal-review' && p.reviewerClass === 'in-context')).toBe(true);
    // Gate computation over the real trail must not throw.
    const schema = parseSchema(GATED_YAML);
    expect(() => computeGateStates(schema, 'b3', b3, new Set(['proposal', 'tasks']))).not.toThrow();
  });
});
