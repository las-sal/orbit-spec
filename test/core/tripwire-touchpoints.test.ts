import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import { computeReadings, type TripwireReading } from '../../src/core/tripwires.js';
import { isExempt, parseNumstatZ } from '../../src/core/tripwire-touchpoints.js';
import { applyCommit, commit, git, makeRepo, propose, textLines, tmpDir, write } from '../helpers/tripwire-repo.js';

const roots: string[] = [];
function repo(): string {
  const r = makeRepo();
  roots.push(r);
  return r;
}
afterEach(() => {
  while (roots.length) fs.rmSync(roots.pop() as string, { recursive: true, force: true });
});

function reading(root: string, name = 'n'): TripwireReading {
  const { readings } = computeReadings(root, name, null);
  const r = readings.find(x => x.sensor === 'touchpoints');
  if (!r) throw new Error('no touchpoints reading');
  return r;
}

const files = (r: TripwireReading): Array<Record<string, unknown>> => r.evidence.files as Array<Record<string, unknown>>;

describe('the Touchpoints sensor: the reading', () => {
  // @scenario behaviour orbit-tripwires :: A tripwire is a sensor that returns a reading :: A reading carries the contract's fields
  it('a firing reading carries the contract\'s fields, frozen at the fixed point', () => {
    const root = repo();
    const fp = propose(root, 'n', ['`src/main.ts`']);
    applyCommit(root, 'n', { 'src/main.ts': textLines(200), 'src/a.ts': textLines(50) });
    const r = reading(root);
    expect(r.sensor).toBe('touchpoints');
    expect(r.outcome).toBe('fired');
    expect(r.deviations).toEqual(['touchpoints:src/a.ts']);
    expect(r.reference).toBe(fp);
    expect(r.frozen).toBe(true);
    expect(files(r)).toEqual([{ path: 'src/a.ts', lines: 50, over: true }]);
  });

  // @scenario behaviour orbit-tripwires :: A tripwire is a sensor that returns a reading :: A quiet reading has no deviations
  it('a quiet reading has no deviations', () => {
    const root = repo();
    propose(root, 'n', ['`src/`']);
    applyCommit(root, 'n', { 'src/main.ts': textLines(300) });
    const r = reading(root);
    expect(r.outcome).toBe('quiet');
    expect(r.deviations).toEqual([]);
    expect(r.evidence.share).toBe(0);
  });
});

describe('the Touchpoints sensor: the reference fixed before the run', () => {
  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: An edit to the plan after apply begins moves nothing
  it('an edit to the plan after apply begins moves nothing', () => {
    const root = repo();
    const fp = propose(root, 'n', ['`src/main.ts`']);
    applyCommit(root, 'n', { 'src/main.ts': textLines(300) });
    write(root, 'orbit/changes/n/design.md', '## Touchpoints\n\n- `src/main.ts`\n- `src/x.ts`\n');
    write(root, 'src/x.ts', textLines(60));
    commit(root, 'declare and edit x');
    const r = reading(root);
    expect(r.reference).toBe(fp);
    expect(r.outcome).toBe('fired');
    expect(r.deviations).toEqual(['touchpoints:src/x.ts']);
  });

  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: A proposal-review walk's edit is part of the plan
  it('a proposal-review walk\'s edit is part of the plan', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`']);
    write(root, 'orbit/changes/n/design.md', '## Touchpoints\n\n- `src/main.ts`\n- `src/y.ts`\n');
    write(root, 'orbit/architecture/prog.md', '# prog\n');
    const walk = commit(root, 'walk');
    applyCommit(root, 'n', { 'src/y.ts': textLines(30) });
    const r = reading(root);
    expect(r.reference).toBe(walk);
    expect(r.outcome).toBe('quiet');
    expect(files(r)).toEqual([]);
  });

  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: Work committed with the proposal is measured
  it('work committed with the proposal is measured, against the plan at HEAD, not frozen', () => {
    const root = repo();
    const base = git(root, ['rev-parse', 'HEAD']);
    const p = propose(root, 'n', ['`src/main.ts`'], { 'src/z.ts': textLines(100) });
    const r = reading(root);
    expect(base).not.toBe(p);
    expect(r.frozen).toBe(false);
    expect(r.reference).toBe(p);
    expect(r.outcome).toBe('fired');
    expect(r.deviations).toEqual(['touchpoints:src/z.ts']);
  });

  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: An uncommitted change cannot be read
  it('an uncommitted change cannot be read', () => {
    const root = repo();
    write(root, 'orbit/changes/n/design.md', '## Touchpoints\n\n- `src/`\n');
    const r = reading(root);
    expect(r.outcome).toBe('cannot-read');
    expect(r.deviations).toEqual(['touchpoints:cannot-read:uncommitted']);
    expect(r.evidence).toEqual({ reason: 'uncommitted' });
    const outside = tmpDir();
    roots.push(outside);
    expect(reading(outside).deviations).toEqual(['touchpoints:cannot-read:no-git']);
  });

  // @scenario behaviour orbit-tripwires :: A sensor compares against a reference fixed before the run :: A reference that cannot be read reads as cannot-read
  it('a reference that cannot be read reads as cannot-read', () => {
    const root = repo();
    propose(root, 'n', null);
    applyCommit(root, 'n', { 'src/a.ts': textLines(5) });
    const r = reading(root);
    expect(r.outcome).toBe('cannot-read');
    expect(r.deviations).toEqual(['touchpoints:cannot-read:no-section']);
    expect(r.frozen).toBe(true);

    const root2 = repo();
    write(root2, 'orbit/changes/n/.openspec.yaml', 'schema: spec-driven\n');
    commit(root2, 'no design');
    expect(reading(root2).deviations).toEqual(['touchpoints:cannot-read:no-design']);
  });

  // @scenario behaviour orbit-tripwires :: A declaration after the fixed point counts only as the user's answer :: A late Touchpoints entry does not quiet the sensor
  it('a late Touchpoints entry does not quiet the sensor', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`']);
    applyCommit(root, 'n', { 'src/main.ts': textLines(300), 'src/x.ts': textLines(60) });
    write(root, 'orbit/changes/n/design.md', '## Touchpoints\n\n- `src/main.ts`\n- `src/x.ts`\n');
    commit(root, 'declare x late');
    const r = reading(root);
    expect(r.outcome).toBe('fired');
    expect(files(r)).toEqual([{ path: 'src/x.ts', lines: 60, over: true, declared_late: true }]);
  });

  // @scenario behaviour orbit-tripwires :: The tripwires setting :: A widened exempt set after apply begins escapes nothing
  it('a widened exempt set after apply begins escapes nothing', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`']);
    applyCommit(root, 'n', { 'src/main.ts': textLines(300), 'src/a.ts': textLines(80) });
    write(root, 'orbit/config.yaml', "tripwires:\n  touchpoints:\n    exempt: ['src/']\n");
    commit(root, 'widen exempt');
    const r = reading(root);
    expect(r.outcome).toBe('fired');
    expect(r.deviations).toEqual(['touchpoints:src/a.ts']);
    expect((r.evidence.settings as any).exempt).not.toContain('src/');
  });

  it('settings committed at the fixed point apply', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`'], { 'orbit/config.yaml': 'tripwires:\n  touchpoints:\n    per_file_lines: 100\n    share_percent: 50\n' });
    applyCommit(root, 'n', { 'src/main.ts': textLines(300), 'src/a.ts': textLines(80) });
    expect(reading(root).outcome).toBe('quiet');
  });
});

describe('the Touchpoints sensor: tolerances and classes', () => {
  // @scenario behaviour orbit-tripwires :: The Touchpoints sensor fires on unpredicted source past a tolerance :: One large unpredicted file fires
  it('one large unpredicted file fires', () => {
    const root = repo();
    propose(root, 'n', ['`src/other/`']);
    applyCommit(root, 'n', { 'src/a.ts': textLines(138) });
    const r = reading(root);
    expect(r.outcome).toBe('fired');
    expect(r.deviations).toEqual(['touchpoints:src/a.ts']);
    expect(files(r)).toEqual([{ path: 'src/a.ts', lines: 138, over: true }]);
  });

  // @scenario behaviour orbit-tripwires :: The Touchpoints sensor fires on unpredicted source past a tolerance :: Small ripple within both tolerances is quiet
  it('small ripple within both tolerances is quiet', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`']);
    applyCommit(root, 'n', { 'src/main.ts': textLines(196), 'src/b.ts': textLines(4) });
    const r = reading(root);
    expect(r.outcome).toBe('quiet');
    expect(files(r)).toEqual([{ path: 'src/b.ts', lines: 4 }]);
    expect(r.evidence.share).toBe(2);
    expect(r.evidence.share_fired).toBe(false);
  });

  // @scenario behaviour orbit-tripwires :: The Touchpoints sensor fires on unpredicted source past a tolerance :: The share tolerance catches spread drift
  it('the share tolerance catches spread drift', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`']);
    const spread: Record<string, string> = { 'src/main.ts': textLines(200) };
    for (let i = 0; i < 10; i++) spread[`src/f${i}.ts`] = textLines(10);
    applyCommit(root, 'n', spread);
    const r = reading(root);
    expect(r.outcome).toBe('fired');
    expect(r.evidence.share).toBe(33.3);
    expect(r.evidence.share_fired).toBe(true);
    expect(r.deviations).toHaveLength(10);
    expect(r.deviations[0]).toBe('touchpoints:src/f0.ts');
  });

  // @scenario behaviour orbit-tripwires :: The Touchpoints sensor fires on unpredicted source past a tolerance :: Exempt paths never count
  it('exempt paths never count', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`']);
    applyCommit(root, 'n', {
      'src/main.ts': textLines(10),
      'test/core/x.test.ts': textLines(500),
      'docs/cli.md': textLines(500),
      'src/util/x.spec.ts': textLines(500),
    });
    const r = reading(root);
    expect(r.outcome).toBe('quiet');
    expect(files(r)).toEqual([]);
  });

  // @scenario behaviour orbit-tripwires :: The Touchpoints sensor fires on unpredicted source past a tolerance :: A malformed entry is listed with the firing paths
  it('a malformed entry is listed with the firing paths', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`', 'the c module, src/c.ts']);
    applyCommit(root, 'n', { 'src/main.ts': textLines(300), 'src/c.ts': textLines(50) });
    const r = reading(root);
    expect(r.outcome).toBe('fired');
    expect(r.deviations).toEqual(['touchpoints:src/c.ts']);
    expect(r.evidence.malformed).toEqual([{ line: 8, text: 'the c module, src/c.ts' }]);
  });

  // @scenario behaviour orbit-tripwires :: The Touchpoints sensor fires on unpredicted source past a tolerance :: A rename is a deletion and an addition
  it('a rename is a deletion and an addition', () => {
    const root = repo();
    write(root, 'src/old.ts', textLines(80));
    commit(root, 'old');
    propose(root, 'n', ['`src/old.ts`']);
    git(root, ['mv', 'src/old.ts', 'src/new.ts']);
    applyCommit(root, 'n', {});
    const r = reading(root);
    expect(r.outcome).toBe('fired');
    expect(r.deviations).toEqual(['touchpoints:src/new.ts']);
    expect(files(r)).toEqual([{ path: 'src/new.ts', lines: 80, over: true }]);
  });

  // @scenario behaviour orbit-tripwires :: The Touchpoints sensor fires on unpredicted source past a tolerance :: A binary file fires alone and stays out of the share
  it('a binary file fires alone and stays out of the share', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`']);
    applyCommit(root, 'n', {
      'src/main.ts': textLines(30),
      'src/a.ts': textLines(10),
      'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 1, 2, 3, 0]),
    });
    const r = reading(root);
    expect(r.outcome).toBe('fired');
    expect(files(r)).toEqual([
      { path: 'assets/logo.png', lines: null, binary: true, over: true },
      { path: 'src/a.ts', lines: 10 },
    ]);
    expect(r.evidence.share).toBe(25);
    expect(r.evidence.share_fired).toBe(true);
    expect(r.deviations).toEqual(['touchpoints:assets/logo.png', 'touchpoints:src/a.ts']);
  });

  it('exactly at both tolerances is within; one line past the per-file tolerance fires', () => {
    const at = repo();
    propose(at, 'n', ['`src/main.ts`']);
    applyCommit(at, 'n', { 'src/main.ts': textLines(160), 'src/a.ts': textLines(40) });
    const r = reading(at);
    expect(r.evidence.share).toBe(20);
    expect(r.outcome).toBe('quiet');
    const past = repo();
    propose(past, 'n', ['`src/main.ts`']);
    applyCommit(past, 'n', { 'src/main.ts': textLines(400), 'src/a.ts': textLines(41) });
    expect(reading(past).deviations).toEqual(['touchpoints:src/a.ts']);
  });

  it('the change\'s own folder is never source, even with an empty exempt set', () => {
    const root = repo();
    propose(root, 'n', ['`src/main.ts`'], { 'orbit/config.yaml': 'tripwires:\n  touchpoints:\n    exempt: []\n' });
    applyCommit(root, 'n', { 'src/main.ts': textLines(10), 'orbit/changes/n/notes.txt': textLines(500) });
    const r = reading(root);
    expect(files(r).map(f => f.path)).toEqual(['orbit/config.yaml']);
  });
});

describe('the Touchpoints sensor: helpers', () => {
  it('an exempt pattern without a slash matches the last segment; with one, the whole path', () => {
    expect(isExempt(['*.test.*'], 'src/x.test.ts')).toBe(true);
    expect(isExempt(['test/'], 'src/test/x.ts')).toBe(false);
    expect(isExempt(['test/'], 'test/x.ts')).toBe(true);
    expect(isExempt(['src/gen/*.ts'], 'src/gen/a.ts')).toBe(true);
    expect(isExempt(['*.md'], 'README.md')).toBe(true);
  });

  it('parses -z numstat with binary and unusual paths', () => {
    expect(parseNumstatZ('3\t2\tsrc/a b,c.ts\0-\t-\tx.png\0')).toEqual([
      { path: 'src/a b,c.ts', lines: 5 },
      { path: 'x.png', lines: null },
    ]);
  });
});
