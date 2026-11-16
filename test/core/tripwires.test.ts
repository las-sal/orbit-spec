import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  actsAsFired,
  annotateCoverage,
  cannotRead,
  changeCommits,
  computeReadings,
  composeTripwireStop,
  readCoverage,
  tripwireSensors,
  uncoveredKeys,
  type Sensor,
  type TripwireReading,
} from '../../src/core/tripwires.js';
import { resolveTripwiresSetting, TOUCHPOINTS_DEFAULTS } from '../../src/core/project-config.js';
import { applyCommit, commit, git, makeRepo, propose, remove, tmpDir, write } from '../helpers/tripwire-repo.js';

const roots: string[] = [];
function repo(): string {
  const r = makeRepo();
  roots.push(r);
  return r;
}
afterEach(() => {
  while (roots.length) fs.rmSync(roots.pop() as string, { recursive: true, force: true });
});

/** A stub sensor: the contract is tested without the real measure. */
const stub = (outcome: TripwireReading['outcome'], deviations: string[]): Sensor => ({
  id: 'stub',
  run: () => ({ sensor: 'stub', outcome, deviations, reference: 'abc', frozen: true, evidence: { n: deviations.length } }),
  stopText: (_r, keys) => ({ about: `Found ${keys.join(', ')}.`, question: 'Go on?', detail: 'stub' }),
  describe: (_r, key) => `found ${key}`,
  onFire: () => 'halt',
});

describe('the sensor contract', () => {
  it('lists the sensors ordered by id, touchpoints among them', () => {
    const ids = tripwireSensors().map(s => s.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids).toContain('touchpoints');
  });

  it('a stub sensor returns a reading of the contract shape; cannot-read acts as fired', () => {
    const fired = stub('fired', ['stub:a']).run({ projectRoot: '.', name: 'n', commits: { kind: 'no-git' }, ownDirs: [] });
    expect(Object.keys(fired).sort()).toEqual(['deviations', 'evidence', 'frozen', 'outcome', 'reference', 'sensor']);
    expect(actsAsFired(fired)).toBe(true);
    expect(actsAsFired({ ...fired, outcome: 'quiet', deviations: [] })).toBe(false);
    const cr = cannotRead('stub', 'no-git', null, false);
    expect(cr).toEqual({ sensor: 'stub', outcome: 'cannot-read', deviations: ['stub:cannot-read:no-git'], reference: null, frozen: false, evidence: { reason: 'no-git' } });
    expect(actsAsFired(cr)).toBe(true);
  });

  it('coverage reads the latest stop and resolution of each chain; covered keys are not asked again', () => {
    const root = tmpDir();
    roots.push(root);
    const dir = path.join(root, 'decisions');
    fs.mkdirSync(dir);
    const stopA = composeTripwireStop({
      timestamp: '2026-01-01T00:00:00Z',
      change: 'n',
      sensor: stub('fired', ['stub:a']),
      reading: stub('fired', ['stub:a']).run({} as any),
      keys: ['stub:a'],
      emit: 'apply-2026-01-01T00-00-00Z.json',
    });
    fs.writeFileSync(path.join(dir, 'stop-2026-01-01T00-00-00Z.json'), JSON.stringify(stopA));
    // A stop of another change, and a non-tripwire stop, cover nothing.
    fs.writeFileSync(path.join(dir, 'stop-2026-01-01T00-00-01Z.json'), JSON.stringify({ ...stopA, change: 'other', tripwire: { sensor: 'stub', deviations: ['stub:b'], emit: 'x' } }));
    fs.writeFileSync(path.join(dir, 'stop-2026-01-01T00-00-02Z.json'), JSON.stringify({ ...stopA, condition: 'outward-act', tripwire: { sensor: 'stub', deviations: ['stub:c'], emit: 'x' } }));
    // A resolution chain: R1 replaced by R2; only R2 is named.
    fs.writeFileSync(path.join(dir, 'resolution-2026-01-01T00-00-03Z.json'), JSON.stringify({ command: 'resolution', change: 'n', stop: 'stop-2026-01-01T00-00-00Z.json', answer: 'a', effect: 'e' }));
    fs.writeFileSync(path.join(dir, 'resolution-2026-01-01T00-00-04Z.json'), JSON.stringify({ command: 'resolution', change: 'n', stop: 'stop-2026-01-01T00-00-00Z.json', answer: 'b', effect: 'e', replaces: 'resolution-2026-01-01T00-00-03Z.json' }));

    const cov = readCoverage(dir, 'n');
    expect([...cov.stopsByKey.keys()]).toEqual(['stub:a']);
    const reading = stub('fired', ['stub:a', 'stub:b', 'stub:c']).run({} as any);
    expect(uncoveredKeys(reading, cov)).toEqual(['stub:b', 'stub:c']);
    const annotated = annotateCoverage(reading, cov);
    expect(annotated.stops).toEqual(['stop-2026-01-01T00-00-00Z.json']);
    expect(annotated.answered_by).toEqual(['resolution-2026-01-01T00-00-04Z.json']);
    // A quiet reading names nothing.
    const quiet = annotateCoverage(stub('quiet', []).run({} as any), cov);
    expect('stops' in quiet || 'answered_by' in quiet).toBe(false);
  });

  it('composes the stop orbit writes: tripwire condition, null model, the keys it asks about', () => {
    const s = stub('fired', ['stub:a', 'stub:b']);
    const rec = composeTripwireStop({ timestamp: 'T', change: 'n', sensor: s, reading: s.run({} as any), keys: ['stub:b'], emit: 'review-system-X.json' });
    expect(rec).toEqual({
      command: 'stop',
      timestamp: 'T',
      change: 'n',
      model: null,
      condition: 'tripwire',
      about: 'Found stub:b.',
      question: 'Go on?',
      detail: 'stub',
      tripwire: { sensor: 'stub', deviations: ['stub:b'], emit: 'review-system-X.json' },
    });
  });
});

describe('changeCommits: the four results', () => {
  it('outside git: no-git', () => {
    const root = tmpDir();
    roots.push(root);
    expect(changeCommits(root, 'n')).toEqual({ kind: 'no-git' });
  });

  it('a repository with no commit, and one where nothing about the change is committed: uncommitted', () => {
    const empty = tmpDir();
    roots.push(empty);
    git(empty, ['init', '-q', '-b', 'main']);
    expect(changeCommits(empty, 'n')).toEqual({ kind: 'uncommitted' });
    const root = repo();
    write(root, 'orbit/changes/n/design.md', 'x\n'); // written, never committed
    expect(changeCommits(root, 'n')).toEqual({ kind: 'uncommitted' });
  });

  it('a first commit and no apply emit committed: not-begun', () => {
    const root = repo();
    const p = propose(root, 'n', ['`src/a.ts`']);
    const head = commit(root, 'walk');
    expect(changeCommits(root, 'n')).toEqual({ kind: 'not-begun', first: p, head });
  });

  it('an apply emit committed: frozen, the fixed point its commit\'s parent', () => {
    const root = repo();
    const p = propose(root, 'n', ['`src/a.ts`']);
    const walk = commit(root, 'walk');
    const a = applyCommit(root, 'n', { 'src/a.ts': 'x\n' });
    applyCommit(root, 'n', { 'src/a.ts': 'y\n' });
    const head = git(root, ['rev-parse', 'HEAD']);
    expect(changeCommits(root, 'n')).toEqual({ kind: 'frozen', first: p, firstApply: a, fixedPoint: walk, head });
  });

  it('another change\'s archive is not this change\'s: archiving foo-n while dropping n\'s metadata keeps n\'s fixed point', () => {
    const root = repo();
    write(root, 'orbit/changes/foo-n/.openspec.yaml', 'schema: spec-driven\n');
    const p = propose(root, 'n', ['`src/a.ts`']);
    const a = applyCommit(root, 'n', { 'src/a.ts': 'x\n' });
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    git(root, ['mv', 'orbit/changes/foo-n', 'orbit/changes/archive/2026-01-02-foo-n']);
    remove(root, 'orbit/changes/n/.openspec.yaml');
    commit(root, 'archive foo-n and drop n\'s metadata');
    write(root, 'orbit/changes/n/.openspec.yaml', 'schema: spec-driven\n');
    write(root, 'orbit/changes/n/design.md', '## Touchpoints\n\n- `src/`\n');
    const head = commit(root, 'restore n with a widened plan');
    expect(changeCommits(root, 'n')).toEqual({ kind: 'frozen', first: p, firstApply: a, fixedPoint: p, head });
  });

  it('a git failure reads as no-git', () => {
    const root = repo();
    propose(root, 'n', ['`src/a.ts`']);
    // Remove the loose objects: HEAD still resolves, but history cannot be walked.
    for (const d of fs.readdirSync(path.join(root, '.git', 'objects'))) {
      if (/^[0-9a-f]{2}$/.test(d)) remove(root, `.git/objects/${d}`);
    }
    expect(changeCommits(root, 'n')).toEqual({ kind: 'no-git' });
  });

  it('a merge into the change\'s branch never qualifies as the change\'s work', () => {
    const root = repo();
    git(root, ['checkout', '-q', '-b', 'feat']);
    const p = propose(root, 'n', ['`src/a.ts`']);
    git(root, ['checkout', '-q', 'main']);
    // On the default branch, a commit adding an apply-shaped file under the change's folder.
    applyCommit(root, 'n', { 'src/other.ts': 'x\n' });
    git(root, ['checkout', '-q', 'feat']);
    git(root, ['merge', '-q', '--no-ff', '--no-edit', 'main']);
    const head = git(root, ['rev-parse', 'HEAD']);
    expect(changeCommits(root, 'n')).toEqual({ kind: 'not-begun', first: p, head });
  });

  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: A reused change name reads only the new change
  it('a reused change name reads only the new change', () => {
    const root = repo();
    propose(root, 'n', ['`src/a.ts`']);
    applyCommit(root, 'n', { 'src/a.ts': 'x\n' });
    // Archive: the folder moves away.
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    git(root, ['mv', 'orbit/changes/n', 'orbit/changes/archive/2026-01-01-n']);
    commit(root, 'archive n');
    const birth = propose(root, 'n', ['`src/b.ts`']);
    const head = birth;
    expect(changeCommits(root, 'n')).toEqual({ kind: 'not-begun', first: birth, head });
    const walk = commit(root, 'walk');
    const a2 = applyCommit(root, 'n', { 'src/b.ts': 'y\n' });
    const r = changeCommits(root, 'n');
    expect(r).toEqual({ kind: 'frozen', first: birth, firstApply: a2, fixedPoint: walk, head: a2 });
  });

  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: A reused name not yet committed cannot be read
  it('between an archive and the next change of the name, nothing about the change is committed', () => {
    const root = repo();
    propose(root, 'n', ['`src/a.ts`']);
    applyCommit(root, 'n', { 'src/a.ts': 'x\n' });
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    git(root, ['mv', 'orbit/changes/n', 'orbit/changes/archive/2026-01-01-n']);
    commit(root, 'archive n');
    write(root, 'src/other.ts', 'unrelated\n');
    commit(root, 'later work');
    // A new change of the name, written but not committed.
    write(root, 'orbit/changes/n/.openspec.yaml', 'schema: spec-driven\n');
    expect(changeCommits(root, 'n')).toEqual({ kind: 'uncommitted' });
  });

  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: Restoring deleted metadata keeps the fixed point
  it('deleting and restoring the metadata mid-change starts no new change: the fixed point stands', () => {
    const root = repo();
    const p = propose(root, 'n', ['`src/a.ts`']);
    const fp = commit(root, 'walk');
    const a = applyCommit(root, 'n', { 'src/a.ts': 'x\n' });
    remove(root, 'orbit/changes/n/.openspec.yaml');
    commit(root, 'drop the metadata');
    write(root, 'orbit/changes/n/.openspec.yaml', 'schema: spec-driven\n');
    write(root, 'orbit/changes/n/design.md', '## Touchpoints\n\n- `src/`\n');
    const head = commit(root, 'restore it with a widened plan');
    expect(changeCommits(root, 'n')).toEqual({ kind: 'frozen', first: p, firstApply: a, fixedPoint: fp, head });
    // The reference is the plan at the original fixed point, not the widened one.
    const r = computeReadings(root, 'n', null).readings[0];
    expect(r.reference).toBe(fp);
    expect(r.frozen).toBe(true);
  });
});

describe('resolveTripwiresSetting', () => {
  const defaults = { ...TOUCHPOINTS_DEFAULTS, exempt: [...TOUCHPOINTS_DEFAULTS.exempt], notes: [] };

  it('an absent text, an unparseable text, an absent key and a non-map read as every default', () => {
    expect(resolveTripwiresSetting({ text: null }).touchpoints).toEqual(defaults);
    expect(resolveTripwiresSetting({ text: 'a: [unclosed' }).touchpoints).toEqual(defaults);
    expect(resolveTripwiresSetting({ text: 'schema: spec-driven\n' }).touchpoints).toEqual(defaults);
    expect(resolveTripwiresSetting({ text: 'tripwires: 3\n' }).touchpoints).toEqual(defaults);
    const root = tmpDir();
    roots.push(root);
    expect(resolveTripwiresSetting({ projectRoot: root }).touchpoints).toEqual(defaults); // no config file
  });

  it('reads each field, ignores an unknown sensor, and replaces the exempt set when given', () => {
    const s = resolveTripwiresSetting({
      text: 'tripwires:\n  nosuch: {on_fire: halt}\n  touchpoints:\n    on_fire: halt\n    exempt: [vendor/]\n    per_file_lines: 10\n    share_percent: 0\n',
    });
    expect(s).toEqual({ touchpoints: { on_fire: 'halt', exempt: ['vendor/'], per_file_lines: 10, share_percent: 0, notes: [] } });
  });

  it('reads the working tree\'s config', () => {
    const root = tmpDir();
    roots.push(root);
    write(root, 'orbit/config.yaml', 'tripwires:\n  touchpoints:\n    on_fire: halt\n');
    expect(resolveTripwiresSetting({ projectRoot: root }).touchpoints.on_fire).toBe('halt');
  });

  // @scenario behaviour orbit-tripwires :: The tripwires setting :: A wrong-shaped value takes its default
  it('a wrong-shaped value takes its default and adds a note', () => {
    const s = resolveTripwiresSetting({
      text: 'tripwires:\n  touchpoints:\n    per_file_lines: "forty"\n    share_percent: 120\n    on_fire: stop\n    exempt: "docs/"\n',
    }).touchpoints;
    expect(s.per_file_lines).toBe(40);
    expect(s.share_percent).toBe(20);
    expect(s.on_fire).toBe('record');
    expect(s.exempt).toEqual([...TOUCHPOINTS_DEFAULTS.exempt]);
    expect(s.notes).toHaveLength(4);
    expect(s.notes.some(n => n.includes("'forty'"))).toBe(true);
  });
});
