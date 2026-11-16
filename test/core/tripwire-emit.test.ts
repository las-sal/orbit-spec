import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { composeAndWriteEmit } from '../../src/core/emit-composition.js';
import { buildDecisionBrief, renderDecisionBrief } from '../../src/core/decision-records.js';
import { applyCommit, commit, makeRepo, textLines, write } from '../helpers/tripwire-repo.js';
import { ensureCliBuilt, runCLI } from '../helpers/run-cli.js';

/**
 * The readings on the seam emits and the halting stop (`orbit-tripwires`' `Every seam emit carries the readings`,
 * `A halting reading writes a tripwire stop`), through the real emit surface in disposable git repositories.
 */

const roots: string[] = [];
afterEach(() => {
  while (roots.length) fs.rmSync(roots.pop() as string, { recursive: true, force: true });
});

const HALT = 'tripwires:\n  touchpoints:\n    on_fire: halt\n';

/** A repository holding change `n` with emit-ready artifacts, its plan predicting only `src/main.ts`. */
function seamRepo(opts: { config?: string } = {}): string {
  const root = makeRepo();
  roots.push(root);
  write(root, 'orbit/changes/n/.openspec.yaml', 'schema: spec-driven\nschema_version: 3\n');
  write(root, 'orbit/changes/n/proposal.md', '# Proposal\n\n## Why\nw\n');
  write(root, 'orbit/changes/n/design.md', '# Design\n\n## Touchpoints\n\n- `src/main.ts`\n');
  write(root, 'orbit/changes/n/specs/cap/spec.md', '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(root, 'orbit/changes/n/tasks.md', '# Tasks\n\n## 1. Group\n\n- [ ] 1.1 do a thing\n- [ ] 1.2 do another\n');
  if (opts.config !== undefined) write(root, 'orbit/config.yaml', opts.config);
  commit(root, 'propose n');
  return root;
}

const zero = { critical: 0, warning: 0, suggestion: 0 };
const reviewPayload = (overrides: Record<string, unknown> = {}) => ({
  mode: 'system',
  reviewer_class: 'in-context',
  depth: 'full',
  passes_run: ['1'],
  passes_skipped: [],
  scorecard: { completeness: { ...zero }, correctness: { ...zero }, coherence: { ...zero } },
  findings: [],
  stale_suppressed: [],
  model: null,
  ...overrides,
});

function review(root: string): { emit: any; path: string; warnings: string[] } {
  // Proposal mode: an in-context SYSTEM pass owes a reading of the change's open decision records, the stops included.
  const r = composeAndWriteEmit('review', { change: 'n' }, reviewPayload({ mode: 'proposal' }), { projectRoot: root });
  return { emit: r.emit, path: r.path, warnings: r.warnings };
}

const decisions = (root: string): string[] => {
  const d = path.join(root, 'orbit/changes/n/.orbit-runs/decisions');
  return fs.existsSync(d) ? fs.readdirSync(d).sort() : [];
};

/** Every file under the project but `.git`, with its size — the whole-project snapshot. */
function snapshot(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(`${path.relative(root, p)}:${fs.statSync(p).size}`);
    }
  };
  walk(root);
  return out.sort();
}

describe('the readings field on the seam emits', () => {
  // @scenario behaviour orbit-tripwires :: Every seam emit carries the readings :: A quiet run is recorded
  it('a quiet run is recorded on the apply emit', () => {
    const root = seamRepo();
    applyCommit(root, 'n', { 'src/main.ts': textLines(50) });
    const r = composeAndWriteEmit('apply', { change: 'n' }, { consent: 'user-invoked', model: null }, { projectRoot: root });
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.tripwires).toHaveLength(1);
    expect(written.tripwires[0]).toMatchObject({ sensor: 'touchpoints', outcome: 'quiet', deviations: [], frozen: true });
    expect(written).toEqual(r.emit);
  });

  // @scenario behaviour orbit-tripwires :: Every seam emit carries the readings :: Only the seam emits carry the field
  it('only the seam emits carry the field', () => {
    const root = seamRepo();
    write(root, 'orbit/architecture/prog.md', '# prog\n');
    const verify = composeAndWriteEmit('verify', { change: 'n' }, { final_assessment: 'ok', verdict: 'pass', model: null }, { projectRoot: root });
    const propose = composeAndWriteEmit('propose', { change: 'n' }, { final_assessment: 'generated', model: null }, { projectRoot: root });
    const handoff = { boot_sequence: ['CLAUDE.md'], next_command: '/orbit:architect prog', model_hint: null, seam: 'post-session' };
    const arch = composeAndWriteEmit('review', { doc: 'prog' }, reviewPayload({ mode: 'architecture', handoff }), { projectRoot: root });
    for (const r of [verify, propose, arch]) expect('tripwires' in r.emit).toBe(false);
    // Each of the four seam commands carries it.
    const rev = composeAndWriteEmit('review', { change: 'n' }, reviewPayload({ mode: 'proposal' }), { projectRoot: root });
    const walk = composeAndWriteEmit(
      'address-reviews',
      { change: 'n' },
      { source: 'gate', walk_mode: 'per_finding', resolutions: [], final_assessment: 'x', model: null },
      { projectRoot: root }
    );
    for (const r of [rev, walk]) expect(Array.isArray((r.emit as any).tripwires)).toBe(true);
  });

  // @scenario behaviour orbit-tripwires :: Every seam emit carries the readings :: The field is engine-owned
  it('a payload supplying the field is refused as engine-owned, writing nothing', () => {
    const root = seamRepo();
    const before = snapshot(root);
    expect(() =>
      composeAndWriteEmit('apply', { change: 'n' }, { consent: 'user-invoked', model: null, tripwires: [] }, { projectRoot: root })
    ).toThrow(/'tripwires' is engine-owned/);
    expect(snapshot(root)).toEqual(before);
  });

  // @scenario behaviour orbit-tripwires :: Every seam emit carries the readings :: A firing at the defaults writes no stop
  it('a firing at the defaults writes no stop', () => {
    const root = seamRepo();
    applyCommit(root, 'n', { 'src/a.ts': textLines(138) });
    const r = review(root);
    expect(r.emit.tripwires[0].outcome).toBe('fired');
    expect(r.emit.tripwires[0].deviations).toEqual(['touchpoints:src/a.ts']);
    expect('stops' in r.emit.tripwires[0]).toBe(false);
    expect(decisions(root)).toEqual([]);
    expect(r.warnings.some(w => w.startsWith('tripwire:'))).toBe(false);
  });

  // @scenario behaviour orbit-emit-composition :: Output contract and read-only guarantee beyond the emit :: Exactly one file
  it('exactly one file: a seam emit whose reading does not halt adds only itself', () => {
    const root = seamRepo();
    applyCommit(root, 'n', { 'src/a.ts': textLines(138) });
    const before = snapshot(root);
    const r = composeAndWriteEmit('apply', { change: 'n' }, { consent: 'user-invoked', model: null }, { projectRoot: root });
    const added = snapshot(root).filter(x => !before.includes(x));
    expect(added).toEqual([`${path.relative(root, r.path)}:${fs.statSync(r.path).size}`]);
    expect(snapshot(root).filter(x => !added.includes(x))).toEqual(before);
  });
});

describe('the halting stop', () => {
  // @scenario behaviour orbit-tripwires :: A halting reading writes a tripwire stop :: A halting firing writes one stop
  // @scenario behaviour orbit-emit-composition :: Output contract and read-only guarantee beyond the emit :: A halting reading adds its stop
  it('a halting firing writes one stop naming its keys, and nothing else changes', () => {
    const root = seamRepo({ config: HALT });
    applyCommit(root, 'n', { 'src/k1.ts': textLines(50), 'src/k2.ts': textLines(60) });
    const before = snapshot(root);
    const r = review(root);
    const stops = decisions(root);
    expect(stops).toHaveLength(1);
    const stop = JSON.parse(fs.readFileSync(path.join(root, 'orbit/changes/n/.orbit-runs/decisions', stops[0]), 'utf-8'));
    expect(stop).toMatchObject({
      command: 'stop',
      change: 'n',
      model: null,
      condition: 'tripwire',
      tripwire: { sensor: 'touchpoints', deviations: ['touchpoints:src/k1.ts', 'touchpoints:src/k2.ts'], emit: path.basename(r.path) },
    });
    expect(stop.about).toContain('src/k1.ts');
    expect(typeof stop.question).toBe('string');
    expect(r.emit.tripwires[0].stops).toEqual([stops[0]]);
    expect(r.warnings.filter(w => w.startsWith('tripwire:'))).toHaveLength(1);
    expect(r.warnings.find(w => w.startsWith('tripwire:'))).toContain(stops[0]);
    // The trail gains the emit and the stop; nothing else changed.
    const added = snapshot(root).filter(x => !before.includes(x)).map(x => x.replace(/:\d+$/, ''));
    expect(added.sort()).toEqual([path.relative(root, r.path), `orbit/changes/n/.orbit-runs/decisions/${stops[0]}`].sort());
  });

  // @scenario behaviour orbit-tripwires :: A halting reading writes a tripwire stop :: Only a new deviation is asked about
  // @scenario behaviour orbit-tripwires :: A declaration after the fixed point counts only as the user's answer :: The user's answer declares the key
  it('only a new deviation is asked about, and the user\'s answer declares the key', () => {
    const root = seamRepo({ config: HALT });
    applyCommit(root, 'n', { 'src/k1.ts': textLines(50) });
    const first = review(root);
    const [stop1] = decisions(root);
    expect(first.emit.tripwires[0].stops).toEqual([stop1]);

    // `orbit emit resolution` answers an orbit-written stop like any other.
    const res = composeAndWriteEmit(
      'resolution',
      { change: 'n' },
      { stop: stop1, answer: 'Yes, k1 is part of the plan.', effect: 'The work goes on with k1 counted as planned.', model: null },
      { projectRoot: root }
    );
    const resName = path.basename(res.path);

    // The same key again: answered, no new stop.
    const again = review(root);
    expect(decisions(root)).toEqual([resName, stop1].sort());
    expect(again.emit.tripwires[0].stops).toEqual([stop1]);
    expect(again.emit.tripwires[0].answered_by).toEqual([resName]);

    // A new key: one stop naming it alone; the reading names both stops.
    write(root, 'src/k3.ts', textLines(70));
    commit(root, 'k3');
    const third = review(root);
    const stop2 = decisions(root).filter(f => f.startsWith('stop-') && f !== stop1);
    expect(stop2).toHaveLength(1);
    const rec = JSON.parse(fs.readFileSync(path.join(root, 'orbit/changes/n/.orbit-runs/decisions', stop2[0]), 'utf-8'));
    expect(rec.tripwire.deviations).toEqual(['touchpoints:src/k3.ts']);
    expect(third.emit.tripwires[0].deviations).toEqual(['touchpoints:src/k1.ts', 'touchpoints:src/k3.ts']);
    expect(third.emit.tripwires[0].stops).toEqual([stop1, stop2[0]].sort());
    expect(third.emit.tripwires[0].answered_by).toEqual([resName]);
  });

  // @scenario behaviour orbit-tripwires :: A halting reading writes a tripwire stop :: A halt the run removed still halts
  it('a halt the run removed still halts', () => {
    const root = seamRepo({ config: HALT });
    applyCommit(root, 'n', { 'src/main.ts': textLines(10) });
    write(root, 'orbit/config.yaml', 'tripwires:\n  touchpoints:\n    on_fire: record\n');
    write(root, 'src/a.ts', textLines(80));
    commit(root, 'turn the halt off and drift');
    review(root);
    expect(decisions(root)).toHaveLength(1);
  });

  it('a halt the user adds mid-change at HEAD halts too', () => {
    const root = seamRepo();
    applyCommit(root, 'n', { 'src/a.ts': textLines(80) });
    write(root, 'orbit/config.yaml', HALT);
    commit(root, 'add a halt');
    review(root);
    expect(decisions(root)).toHaveLength(1);
  });

  // @scenario behaviour orbit-tripwires :: A halting reading writes a tripwire stop :: The archive records and halts nothing
  it('the archive records the reading and writes no stop', () => {
    const root = seamRepo({ config: HALT });
    applyCommit(root, 'n', { 'src/a.ts': textLines(80) });
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(path.join(root, 'orbit/changes/n'), path.join(root, 'orbit/changes/archive/2026-01-02-n'));
    const r = composeAndWriteEmit(
      'archive',
      { change: 'n' },
      { final_assessment: 'archived', archive_path: 'orbit/changes/archive/2026-01-02-n/', model: null },
      { projectRoot: root }
    );
    expect((r.emit as any).tripwires[0].outcome).toBe('fired');
    expect((r.emit as any).tripwires[0].deviations).toEqual(['touchpoints:src/a.ts']);
    expect(fs.existsSync(path.join(root, 'orbit/changes/archive/2026-01-02-n/.orbit-runs/decisions'))).toBe(false);
  });

  it('a cannot-read reading halts like a firing', () => {
    const root = seamRepo({ config: HALT });
    write(root, 'orbit/changes/n/design.md', '# Design\n');
    commit(root, 'drop the section');
    review(root);
    const [stop] = decisions(root);
    const rec = JSON.parse(fs.readFileSync(path.join(root, 'orbit/changes/n/.orbit-runs/decisions', stop), 'utf-8'));
    expect(rec.tripwire.deviations).toEqual(['touchpoints:cannot-read:no-section']);
  });

  // @scenario behaviour orbit-emit-composition :: Output contract and read-only guarantee beyond the emit :: A refused emit writes no stop
  it('a refused emit writes no stop', () => {
    const root = seamRepo({ config: HALT });
    applyCommit(root, 'n', { 'src/a.ts': textLines(80) });
    const before = snapshot(root);
    // The scorecard's roll-up disagrees with the findings: refused at the write gate, after composition.
    expect(() =>
      composeAndWriteEmit('review', { change: 'n' }, reviewPayload({ scorecard: { completeness: { ...zero, critical: 1 }, correctness: { ...zero }, coherence: { ...zero } } }), { projectRoot: root })
    ).toThrow(/scorecard/);
    expect(snapshot(root)).toEqual(before);
  });

  it('the decision brief renders an orbit-written stop', () => {
    const root = seamRepo({ config: HALT });
    applyCommit(root, 'n', { 'src/a.ts': textLines(80) });
    review(root);
    const text = renderDecisionBrief(buildDecisionBrief(root, 'n'));
    expect(text).toContain('a sideways tripwire firing');
    expect(text).toContain('src/a.ts');
  });
});

describe('at the defaults a reading changes no readout', () => {
  beforeAll(async () => {
    await ensureCliBuilt();
  }, 300_000);

  const stripReadings = (root: string): void => {
    const runs = path.join(root, 'orbit/changes/n/.orbit-runs');
    for (const f of fs.readdirSync(runs).filter(x => x.endsWith('.json'))) {
      const p = path.join(runs, f);
      const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
      delete j.tripwires;
      fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
    }
  };

  const READOUTS: string[][] = [
    ['status'],
    ['status', '--full'],
    ['status', '--change', 'n'],
    ['status', '--change', 'n', '--json'],
    ['status', '--change', 'n', '--boot'],
    ['status', '--change', 'n', '--report'],
    ['architecture', 'status'],
  ];

  async function readouts(root: string): Promise<string[]> {
    const out: string[] = [];
    for (const args of READOUTS) {
      const r = await runCLI(args, { cwd: root });
      out.push(`${args.join(' ')} → ${r.exitCode}\n${r.stdout}\n${r.stderr}`);
    }
    return out;
  }

  // @scenario behaviour orbit-tripwires :: At the defaults a reading is shown nowhere but the brief :: A firing changes no readout
  it('a firing changes no readout, gate or chain', async () => {
    const root = seamRepo();
    applyCommit(root, 'n', { 'src/a.ts': textLines(138) });
    const r = review(root);
    expect(r.emit.tripwires[0].outcome).toBe('fired');
    const withReadings = await readouts(root);
    stripReadings(root);
    const without = await readouts(root);
    expect(withReadings).toEqual(without);
    for (const o of withReadings) expect(o).toMatch(/→ 0\n/);
  }, 120_000);

  it('the readers do not trip on fired readings and an open tripwire stop under no chain', async () => {
    const root = seamRepo({ config: HALT });
    applyCommit(root, 'n', { 'src/a.ts': textLines(138) });
    review(root);
    composeAndWriteEmit('apply', { change: 'n' }, { consent: 'user-invoked', model: null }, { projectRoot: root });
    expect(decisions(root).filter(f => f.startsWith('stop-')).length).toBeGreaterThan(0);
    for (const o of await readouts(root)) expect(o).toMatch(/→ 0\n/);
    const json = await runCLI(['status', '--change', 'n', '--json'], { cwd: root });
    const status = JSON.parse(json.stdout);
    expect(status.chain.configured).toBe(false);
    const brief = await runCLI(['decisions', 'brief', 'n'], { cwd: root });
    expect(brief.exitCode).toBe(0);
    expect(brief.stdout).toContain('a sideways tripwire firing');
    // The change brief holds an orbit-written stop to orbit's own shape, and shows the readings.
    const change = await runCLI(['brief', '--change', 'n'], { cwd: root });
    expect(change.exitCode).toBe(0);
    expect(change.stdout).toContain('`touchpoints:src/a.ts` (sensor `touchpoints`)');
    expect(change.stdout).toMatch(/Stop stop-.*\.json: Open:/);
  }, 120_000);
});
