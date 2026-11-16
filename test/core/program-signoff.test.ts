/**
 * program-signoff: the PROGRAM's sign-off — the program's saved brief (`orbit-program-brief`'s `A program's brief is
 * saved once the program is finished`), the program's sign-off and hold (`A program's sign-off is recorded against
 * its saved copy, and the hold reads arc-done`), the setting's `program` value (`The sign-off setting holds a
 * change's archive or a program's completion for the user's sign-off`), and the write gate's `--doc` form
 * (`orbit-emit-composition`'s `The write gate checks the sign-off record`).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { buildProgramBrief, renderProgramBrief, saveProgramBrief, ProgramBriefError } from '../../src/core/program-brief.js';
import { computeProgramHold, programFinished, SignoffError } from '../../src/core/signoff.js';
import { loadArchitectureDoc } from '../../src/core/architecture/parser.js';
import { collectOrientation } from '../../src/core/orientation.js';
import { readTrail } from '../../src/core/artifact-graph/trail.js';
import { listTrailArtifacts } from '../../src/core/report-render.js';
import { runCLI } from '../helpers/run-cli.js';

// The same-token race is simulated as `program-brief.test.ts` does: `node:fs`'s `readdirSync` is wrapped to return
// an empty listing for a program's `brief/<doc>` folder while `race.on` is set.
const race = vi.hoisted(() => ({ on: false }));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const readdirSync = ((p: fs.PathLike, ...rest: unknown[]) =>
    race.on && String(p).endsWith(`${path.sep}brief${path.sep}prog`) ? [] : (actual.readdirSync as any)(p, ...rest)) as typeof actual.readdirSync;
  return { ...actual, readdirSync, default: { ...actual, readdirSync } };
});

let root: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}
const json = (rel: string, v: unknown): void => write(rel, JSON.stringify(v, null, 2) + '\n');

const stage = (id: string, title: string, mark = '[ ]'): string[] => [`### Stage ${id} — ${title}`, '', 'Depends-on: (none)', `Complete: ${mark}`, ''];

function makeDoc(marks: { a?: string; b?: string } = {}): void {
  write(
    'orbit/architecture/prog.md',
    ['# prog', '', '## Premise', '', 'A test program.', '', '## Stages', '', ...stage('a', 'the first stage', marks.a), ...stage('b', 'the second stage', marks.b)].join('\n')
  );
}

const ADD_R = '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n';

/** A change at `dir` citing `prog` under `stageId` (`null`: names no stage). */
function makeChange(dir: string, stageId: string | null = 'a', doc = 'prog'): void {
  write(`${dir}/proposal.md`, '## Why\n\nw\n');
  write(`${dir}/design.md`, '# Design\n');
  write(`${dir}/tasks.md`, '## 1. Group\n\n- [x] 1.1 do a thing\n');
  write(`${dir}/specs/cap/spec.md`, ADD_R);
  write(`${dir}/.openspec.yaml`, `schema: spec-driven\nschema_version: 5\narchitecture:\n  doc: ${doc}\n${stageId === null ? '' : `  stage: ${stageId}\n`}`);
}

/** An archived change citing `prog`, archived at `token` (its archive record's). */
function archived(name: string, stageId: string, token: string): void {
  const dir = `orbit/changes/archive/${token.slice(0, 10)}-${name}`;
  makeChange(dir, stageId);
  json(`${dir}/.orbit-runs/archive-${token}.json`, { command: 'archive', timestamp: token, change: name, sync_specs: { ran: true, capabilities_updated: ['cap'] }, warnings: [] });
}

/** A closing-review candidate: a `review-architecture-<TS>.json` of `doc`. */
const review = (token: string, doc = 'prog'): string => {
  const name = `review-architecture-${token}.json`;
  json(`orbit/architecture/.orbit-runs/${name}`, { command: 'review', mode: 'architecture', change: null, doc, timestamp: token });
  return name;
};

function setting(signoff: string | null, pr: string | null = null): void {
  write('orbit/config.yaml', `schema: spec-driven\n${signoff === null ? '' : `signoff: ${signoff}\n`}${pr === null ? '' : `pr: ${pr}\n`}`);
}

const T1 = '2026-11-01T10-00-00Z';
const T2 = '2026-11-02T10-00-00Z';
const R1 = '2026-11-03T10-00-00Z';
const T4 = '2026-11-04T10-00-00Z';
const R2 = '2026-11-05T10-00-00Z';

/** A FINISHED program: both stages quiescent on an archived change each. */
function finished(): void {
  makeDoc();
  archived('x', 'a', T1);
  archived('y', 'b', T2);
}

/** A DONE program: finished, with its closing review recorded after the last archive. */
function done(): string {
  finished();
  return review(R1);
}

const BRIEF_DIR = 'orbit/architecture/.orbit-runs/brief/prog';
const SIGNOFF_DIR = 'orbit/architecture/.orbit-runs/signoff/prog';
const CA = 'brief-2026-11-06T10-00-00Z.md';
const CB = 'brief-2026-11-07T10-00-00Z.md';
const sha = (s: string) => createHash('sha256').update(Buffer.from(s, 'utf-8')).digest('hex');
const copy = (name: string, text: string) => write(`${BRIEF_DIR}/${name}`, text);

const save = () => {
  const b = buildProgramBrief(root, 'prog');
  return saveProgramBrief(root, b, renderProgramBrief(b));
};
const hold = () => computeProgramHold(root, 'prog');
const sign = (over: Record<string, unknown> = {}) =>
  composeAndWriteEmit('signoff', { doc: 'prog' }, { model: 'test-model', brief: CA, answer: 'signed', ...over }, { projectRoot: root });

function allFiles(dir = root): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !e.isSymbolicLink()) out.push(...allFiles(p));
    else out.push(path.relative(root, p));
  }
  return out.sort();
}

function expectRefused(fn: () => unknown, pattern: RegExp, type: new (...a: never[]) => Error = EmitError): void {
  const before = allFiles();
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught, 'expected a refusal').toBeInstanceOf(type);
  expect((caught as Error).message).toMatch(pattern);
  expect(allFiles()).toEqual(before);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-program-signoff-'));
});

afterEach(() => {
  race.on = false;
  vi.useRealTimers();
  fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// orbit-program-brief: A program's brief is saved once the program is finished
// ---------------------------------------------------------------------------

describe("orbit-program-brief: A program's brief is saved once the program is finished", () => {
  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: A finished program's brief is saved
  it("saves a finished program's brief byte for byte under brief/<doc>/, printing the path and its sha256", async () => {
    finished();
    const printed = await runCLI(['brief', 'prog'], { cwd: root });
    const r = await runCLI(['brief', 'prog', '--save'], { cwd: root });
    expect(r.exitCode).toBe(0);
    const [p, hash] = r.stdout.trimEnd().split('\n');
    expect(p).toMatch(/^orbit\/architecture\/\.orbit-runs\/brief\/prog\/brief-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/);
    const bytes = fs.readFileSync(path.join(root, p), 'utf-8');
    expect(bytes).toBe(printed.stdout);
    expect(hash).toBe(`sha256 ${sha(bytes)}`);
    // It is finished under every setting, the defaults included: a ratified and an ended stage count too.
    makeDoc({ a: '[x] 2026-11-03 (Sal)', b: '[~] 2026-11-03 (Sal)' });
    expect(programFinished(root, loadArchitectureDoc(root, 'prog')!)).toBe(true);
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: An unfinished program saves nothing
  it('an unfinished program saves nothing, says so and exits zero', async () => {
    makeDoc();
    archived('x', 'a', T1);
    makeChange('orbit/changes/live', 'b'); // stage b in-change
    const before = allFiles();
    const r = await runCLI(['brief', 'prog', '--save'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('is not finished');
    expect(r.stdout.trimEnd().split('\n')).toHaveLength(1);
    expect(allFiles()).toEqual(before);
    const j = await runCLI(['brief', 'prog', '--save', '--json'], { cwd: root });
    expect(JSON.parse(j.stdout)).toMatchObject({ save: 'not-finished', saved: null });
    // A stage not done with no live work citing it (premised) keeps the program unfinished by its state alone.
    fs.rmSync(path.join(root, 'orbit/changes/live'), { recursive: true });
    expect(programFinished(root, loadArchitectureDoc(root, 'prog')!)).toBe(false);
    expect(save()).toEqual({ save: 'not-finished', saved: null });
    // A doc with no stage (LEGACY) is never finished.
    write('orbit/architecture/legacy.md', '# legacy\n\nNo stages here.\n');
    expect(programFinished(root, loadArchitectureDoc(root, 'legacy')!)).toBe(false);
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: An active change under an undeclared stage keeps the program unfinished
  it('an active change citing the doc under an undeclared stage, or naming no stage, keeps the program unfinished', async () => {
    finished();
    makeChange('orbit/changes/stray', 'zz');
    let j = await runCLI(['brief', 'prog', '--save', '--json'], { cwd: root });
    expect(JSON.parse(j.stdout)).toMatchObject({ save: 'not-finished' });
    fs.rmSync(path.join(root, 'orbit/changes/stray'), { recursive: true });
    makeChange('orbit/changes/nostage', null);
    j = await runCLI(['brief', 'prog', '--save', '--json'], { cwd: root });
    expect(JSON.parse(j.stdout)).toMatchObject({ save: 'not-finished' });
    expect(fs.existsSync(path.join(root, BRIEF_DIR))).toBe(false);
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: A live exploration under an undeclared stage keeps the program unfinished
  it('a live exploration under an undeclared stage keeps the program unfinished', async () => {
    finished();
    write('orbit/explore/idea/.openspec.yaml', 'architecture:\n  doc: prog\n  stage: zz\n');
    write('orbit/explore/idea/explore.md', '> **Status**: exploring.\n\n# idea\n');
    const j = await runCLI(['brief', 'prog', '--save', '--json'], { cwd: root });
    expect(JSON.parse(j.stdout)).toMatchObject({ save: 'not-finished', saved: null });
    expect(fs.existsSync(path.join(root, BRIEF_DIR))).toBe(false);
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: A concluded exploration under an undeclared stage leaves the program finished
  it('a concluded exploration under an undeclared stage leaves the program finished', async () => {
    finished();
    write('orbit/explore/idea/.openspec.yaml', 'architecture:\n  doc: prog\n  stage: zz\n');
    write('orbit/explore/idea/explore.md', '> **Status**: concluded 2026-11-05.\n\n# idea\n');
    const j = await runCLI(['brief', 'prog', '--save', '--json'], { cwd: root });
    expect(JSON.parse(j.stdout)).toMatchObject({ save: 'saved' });
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: An unchanged brief is not saved again
  it('an unchanged brief is not saved again, naming the latest copy', async () => {
    finished();
    const first = save();
    expect(first.save).toBe('saved');
    const before = allFiles();
    const again = await runCLI(['brief', 'prog', '--save', '--json'], { cwd: root });
    const out = JSON.parse(again.stdout);
    expect(out.save).toBe('unchanged');
    expect(out.saved).toEqual(first.saved);
    const line = await runCLI(['brief', 'prog', '--save'], { cwd: root });
    expect(line.stdout).toContain(`${first.saved!.path} is unchanged`);
    expect(allFiles()).toEqual(before);
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: A changed brief is saved anew
  it('a changed brief is saved anew beside the earlier copy, which is unchanged', () => {
    finished();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T10:00:00Z'));
    const a = save();
    const aBytes = fs.readFileSync(path.join(root, a.saved!.path), 'utf-8');
    json('orbit/architecture/.orbit-runs/decisions/ledger-2026-11-06T11-00-00Z.json', {
      command: 'ledger', timestamp: '2026-11-06T11:00:00Z', change: null, doc: 'prog', model: 'm', area: 'defaults',
      decided: 'Weekly.', alternatives: ['daily'], why: 'Enough.', relies_on: [{ kind: 'goal', doc: 'prog', id: 'G1' }],
    });
    vi.setSystemTime(new Date('2026-11-06T12:00:00Z'));
    const b = save();
    expect(b.save).toBe('saved');
    expect(b.saved!.path).not.toBe(a.saved!.path);
    expect(fs.readFileSync(path.join(root, a.saved!.path), 'utf-8')).toBe(aBytes);
    expect(fs.readdirSync(path.join(root, BRIEF_DIR)).sort()).toEqual([path.basename(a.saved!.path), path.basename(b.saved!.path)].sort());
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: A program brief that cannot be rendered saves nothing
  it('a program brief that cannot be rendered saves nothing and exits non-zero naming the record', async () => {
    finished();
    write('orbit/architecture/.orbit-runs/decisions/ledger-2026-11-06T11-00-00Z.json', '{ not json');
    const r = await runCLI(['brief', 'prog', '--save'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('ledger-2026-11-06T11-00-00Z.json');
    expect(fs.existsSync(path.join(root, BRIEF_DIR))).toBe(false);
    // A doc not found, and a MALFORMED one, are the render's failure too.
    const missing = await runCLI(['brief', 'nope', '--save'], { cwd: root });
    expect(missing.exitCode).not.toBe(0);
    expect(missing.stderr).toContain('nope');
  });

  // @scenario behaviour orbit-program-brief :: A program's brief is saved once the program is finished :: Today's readers do not see a program's saved briefs
  it("orbit status, orbit architecture status and the trail readers read the same with a program's brief/ and signoff/ folders", async () => {
    done();
    setting('program');
    const snapshot = async () => ({
      status: (await runCLI(['status', '--json'], { cwd: root })).stdout,
      arch: (await runCLI(['architecture', 'status', '--json'], { cwd: root })).stdout,
      orientation: JSON.stringify(collectOrientation(root)),
      trail: JSON.stringify(readTrail(path.join(root, 'orbit/architecture'))),
      artifacts: JSON.stringify(listTrailArtifacts(path.join(root, 'orbit/architecture'))),
    });
    const before = await snapshot();
    const s = save();
    sign({ brief: path.basename(s.saved!.path) });
    expect(fs.readdirSync(path.join(root, SIGNOFF_DIR))).toHaveLength(1);
    expect(await snapshot()).toEqual(before);
  });

  it('a racing writer is refused naming the file, and the existing file is unchanged', () => {
    finished();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-06T10:00:00Z'));
    const name = 'brief-2026-11-06T10-00-00Z.md';
    copy(name, 'the other writer\n');
    race.on = true;
    try {
      expect(() => save()).toThrow(ProgramBriefError);
      expect(() => save()).toThrow(new RegExp(`${name.replace(/\./g, '\\.')} already exists`));
    } finally {
      race.on = false;
    }
    expect(fs.readFileSync(path.join(root, BRIEF_DIR, name), 'utf-8')).toBe('the other writer\n');
    expect(fs.readdirSync(path.join(root, BRIEF_DIR))).toEqual([name]);
  });

  it('an aliased brief/ folder, or an aliased <doc> folder, is refused writing nowhere', () => {
    finished();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-program-brief-out-'));
    try {
      // The <doc> folder aliased outside the trail.
      fs.mkdirSync(path.join(root, 'orbit/architecture/.orbit-runs/brief'), { recursive: true });
      fs.symlinkSync(outside, path.join(root, BRIEF_DIR));
      expectRefused(() => save(), /prog directory .* does not physically resolve/, ProgramBriefError);
      expect(fs.readdirSync(outside)).toEqual([]);
      // The brief/ folder aliased onto a sibling.
      fs.rmSync(path.join(root, 'orbit/architecture/.orbit-runs/brief'), { recursive: true });
      fs.mkdirSync(path.join(root, 'orbit/architecture/.orbit-runs/elsewhere/prog'), { recursive: true });
      fs.symlinkSync(path.join(root, 'orbit/architecture/.orbit-runs/elsewhere'), path.join(root, 'orbit/architecture/.orbit-runs/brief'));
      expectRefused(() => save(), /brief directory .* does not physically resolve/, ProgramBriefError);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// orbit-program-brief: A program's sign-off is recorded against its saved copy, and the hold reads arc-done
// ---------------------------------------------------------------------------

describe("orbit-program-brief: A program's sign-off is recorded against its saved copy, and the hold reads arc-done", () => {
  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A finished program without its closing review is not done
  it('a finished program without a closing review after its last archive is not done', async () => {
    setting('program');
    finished();
    review('2026-11-01T12-00-00Z'); // after x's archive, before y's: not the closing review
    review('2026-11-09T10-00-00Z', 'other'); // another doc's
    const r = await runCLI(['brief', 'prog', '--hold', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    const h = JSON.parse(r.stdout);
    expect(Object.keys(h)).toEqual(['doc', 'setting', 'warning', 'finished', 'closing_review', 'copy', 'signoff', 'why', 'held']);
    expect(h).toEqual({ doc: 'prog', setting: 'program', warning: null, finished: true, closing_review: null, copy: null, signoff: null, why: 'not-done', held: false });
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: An unfinished program is not done
  it('an unfinished program is not done', () => {
    setting('program');
    makeDoc(); // both stages premised
    review(R1);
    expect(hold()).toMatchObject({ why: 'not-done', finished: false, held: false, closing_review: null });
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A signature lifts the program's hold
  it("a signature over the latest copy lifts the program's hold", async () => {
    setting('program');
    const rv = done();
    copy(CA, 'text');
    const s = sign();
    expect(hold()).toEqual({
      doc: 'prog', setting: 'program', warning: null, finished: true, closing_review: { file: rv },
      copy: { file: CA, sha256: sha('text') }, signoff: { file: path.basename(s.path), answer: 'signed' }, why: 'signed', held: false,
    });
    const t = await runCLI(['brief', 'prog', '--hold'], { cwd: root });
    expect(t.stdout).toContain('not held (signed)');
    expect(t.stdout.trimEnd().split('\n')).toHaveLength(1);
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A decline keeps the program held
  it('a decline records the reason and keeps the program held', () => {
    setting('program');
    done();
    copy(CA, 'text');
    const reason = 'The second stage reads as if it shipped more than it did.';
    const s = sign({ answer: 'declined', reason });
    expect(JSON.parse(fs.readFileSync(s.path, 'utf-8'))).toMatchObject({ answer: 'declined', reason });
    expect(hold()).toMatchObject({ why: 'unsigned', held: true, signoff: { answer: 'declined' } });
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A later copy asks again while the program PR can still be flipped
  it('under per-architecture, a later copy over a standing signature is re-sign and held', () => {
    setting('program', 'per-architecture');
    done();
    copy(CA, 'first');
    sign();
    copy(CB, 'second');
    expect(hold()).toMatchObject({ why: 're-sign', held: true, copy: { file: CB } });
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A later copy asks nothing under `per-proposal`
  it('under per-proposal and never, a later copy over a standing signature is re-sign and not held', () => {
    for (const pr of ['per-proposal', null]) {
      setting('program', pr);
      done();
      copy(CA, 'first');
      sign();
      copy(CB, 'second');
      expect(hold(), String(pr)).toMatchObject({ why: 're-sign', held: false });
      fs.rmSync(path.join(root, 'orbit'), { recursive: true });
    }
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A reopened program asks afresh
  it('a change archived after the signature reopens the program: a differing copy is unsigned under every mode', () => {
    setting('program', 'per-proposal');
    done();
    copy(CA, 'first');
    sign();
    archived('z', 'b', T4);
    const r2 = review(R2);
    copy(CB, 'second');
    expect(hold()).toMatchObject({ why: 'unsigned', held: true, closing_review: { file: r2 } });
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A closing review run again leaves the signature standing
  it('a closing review run again with no citing archive since leaves the signature standing: re-sign', () => {
    setting('program', 'per-proposal');
    done();
    copy(CA, 'first');
    sign();
    const r2 = review(R2);
    copy(CB, 'second');
    expect(hold()).toMatchObject({ why: 're-sign', held: false, closing_review: { file: r2 } });
  });

  it('a signed record over different text naming no closing review does not stand: unsigned', () => {
    setting('program', 'per-proposal');
    done();
    copy(CA, 'first');
    const s = sign();
    const rec = JSON.parse(fs.readFileSync(s.path, 'utf-8'));
    json(path.relative(root, s.path), { ...rec, closing_review: null });
    copy(CB, 'second');
    expect(hold()).toMatchObject({ why: 'unsigned', held: true });
  });

  it('a done program with no saved copy is no-copy and held', () => {
    setting('program');
    done();
    expect(hold()).toMatchObject({ why: 'no-copy', held: true, copy: null });
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: With the setting off the program's hold reads nothing
  it.skipIf(process.getuid?.() === 0)("with the setting off the program's hold reads nothing: an unlistable brief/prog/ answers off", async () => {
    done();
    copy(CA, 'text');
    for (const value of [null, 'off', 'change']) {
      setting(value);
      const dir = path.join(root, BRIEF_DIR);
      fs.chmodSync(dir, 0o000);
      try {
        const r = await runCLI(['brief', 'prog', '--hold', '--json'], { cwd: root });
        expect(r.exitCode, String(value)).toBe(0);
        expect(JSON.parse(r.stdout), String(value)).toMatchObject({
          why: 'off', held: false, finished: null, closing_review: null, copy: null, signoff: null,
        });
      } finally {
        fs.chmodSync(dir, 0o755);
      }
    }
    // It reads not even the doc.
    setting(null);
    expect(computeProgramHold(root, 'missing')).toMatchObject({ why: 'off' });
    // Under an unrecognized value it carries the warning.
    setting('weekly');
    expect(hold().warning).toContain("'weekly'");
  });

  // @scenario behaviour orbit-program-brief :: A program's sign-off is recorded against its saved copy, and the hold reads arc-done :: A damaged latest program sign-off fails the hold
  it('a damaged latest program sign-off fails the hold naming it, with nothing on standard output', async () => {
    setting('program');
    done();
    copy(CA, 'text');
    const s = sign();
    const damaged = 'signoff-2099-01-01T00-00-00Z.json';
    write(`${SIGNOFF_DIR}/${damaged}`, '{ not json');
    expect(() => hold()).toThrow(SignoffError);
    expect(() => hold()).toThrow(new RegExp(`${damaged} is not valid JSON`));
    const r = await runCLI(['brief', 'prog', '--hold'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain(damaged);
    // A program record of a shape the gate would refuse fails it too, each by its own check.
    const ok = JSON.parse(fs.readFileSync(s.path, 'utf-8'));
    write(`${SIGNOFF_DIR}/${damaged}`, JSON.stringify(ok));
    expect(hold().why).toBe('signed'); // the well-formed control
    const { closing_review: _c, ...noClosing } = ok;
    const cases: Array<[unknown, RegExp]> = [
      [{ ...ok, change: 'prog' }, /'change' is "prog", not null/],
      [{ ...ok, doc: 'other' }, /'doc' is "other", not 'prog'/],
      [noClosing, /'closing_review' is missing/],
      [{ ...ok, closing_review: 'review-system-2026-11-03T10-00-00Z.json' }, /'closing_review' is not a closing review's filename/],
      [{ ...ok, closing_review: 3 }, /'closing_review' is not a closing review's filename/],
      [{ ...ok, colour: 'red' }, /carries 'colour', a key the write gate never writes/],
    ];
    for (const [bad, why] of cases) {
      write(`${SIGNOFF_DIR}/${damaged}`, JSON.stringify(bad));
      expect(() => hold(), JSON.stringify(bad)).toThrow(why);
    }
    // A change's sign-off carries no doc or closing_review.
    expect(() => hold()).toThrow(SignoffError);
  });

  it('a doc not found or MALFORMED fails the hold under program; a bad name is a usage error under every value', async () => {
    setting('program');
    expect(() => computeProgramHold(root, 'missing')).toThrow(/architecture doc 'missing' not found/);
    write('orbit/architecture/bad.md', '# bad\n\n## Stages\n\n### Stage a — x\n\nComplete: maybe\n');
    expect(() => computeProgramHold(root, 'bad')).toThrow(/breaks the stage grammar/);
    setting(null);
    const r = await runCLI(['brief', '../x', '--hold'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
  });
});

// ---------------------------------------------------------------------------
// orbit-program-brief: The sign-off setting holds a change's archive or a program's completion for the user's sign-off
// ---------------------------------------------------------------------------

describe("orbit-program-brief: The sign-off setting's program value", () => {
  // @scenario behaviour orbit-program-brief :: The sign-off setting holds a change's archive or a program's completion for the user's sign-off :: `program` holds a done program with no sign-off
  it('program holds a done program with a saved copy and no sign-off: unsigned', async () => {
    setting('program');
    done();
    copy(CA, 'text');
    const r = await runCLI(['brief', 'prog', '--hold'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('prog: held (unsigned)');
  });

  // @scenario behaviour orbit-program-brief :: The sign-off setting holds a change's archive or a program's completion for the user's sign-off :: Under `per-proposal`, open change PRs do not change the program's hold
  it('under per-proposal the hold reads no PR: it answers unsigned with gh unreachable', async () => {
    setting('program', 'per-proposal');
    done();
    copy(CA, 'text');
    const r = await runCLI(['brief', 'prog', '--hold', '--json'], { cwd: root, env: { PATH: path.dirname(process.execPath) } });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ why: 'unsigned', held: true });
  });
});

// ---------------------------------------------------------------------------
// orbit-emit-composition: The write gate checks the sign-off record (the --doc form)
// ---------------------------------------------------------------------------

describe('orbit-emit-composition: The write gate checks the sign-off record, for a program', () => {
  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: A program's sign-off writes with the copy's hash and the closing review
  it("writes signoff/<doc>/signoff-<TS>.json with change null, doc, the copy's sha256 and the closing review", () => {
    setting('program');
    const rv = done();
    copy(CA, 'the copy');
    const r = sign({ reason: 'Reads clearly.' });
    expect(path.relative(root, r.path)).toMatch(/^orbit\/architecture\/\.orbit-runs\/signoff\/prog\/signoff-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/);
    const rec = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(rec).toEqual({
      command: 'signoff', timestamp: rec.timestamp, change: null, doc: 'prog', model: 'test-model',
      brief: CA, sha256: sha('the copy'), closing_review: rv, answer: 'signed', reason: 'Reads clearly.',
    });
    for (const f of ['kind', 'next_recommended', 'final_assessment']) expect(rec).not.toHaveProperty(f);
  });

  it('records closing_review null when none is recorded, and refuses closing_review and sha256 from a payload', () => {
    setting('program');
    finished();
    copy(CA, 'text');
    expect(JSON.parse(fs.readFileSync(sign().path, 'utf-8')).closing_review).toBeNull();
    for (const f of ['closing_review', 'sha256', 'doc', 'change']) {
      expectRefused(() => sign({ [f]: 'x' }), new RegExp(`'${f}' is engine-owned`));
    }
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: Each sign-off needs its own value
  it('each sign-off needs its own value: --doc refused under change, --change refused under program, naming the value read', () => {
    done();
    copy(CA, 'text');
    makeChange('orbit/changes/foo', 'a');
    write('orbit/changes/foo/.orbit-runs/brief/brief-2026-11-06T10-00-00Z.md', 'text');
    setting('change');
    expectRefused(() => sign(), /is 'change': it asks for a change's sign-off.*--change.*written under signoff: program/);
    setting('program');
    expectRefused(
      () => composeAndWriteEmit('signoff', { change: 'foo' }, { model: 'm', brief: CA, answer: 'signed' }, { projectRoot: root }),
      /is 'program': it asks for one program's sign-off.*--doc.*written under signoff: change/
    );
    for (const value of [null, 'weekly']) {
      setting(value);
      expectRefused(() => sign(), /nothing waits on a sign-off.*written under signoff: program/);
    }
  });

  it('refuses a --doc naming no doc, and a brief that is not the latest copy in brief/<doc>/', () => {
    setting('program');
    done();
    expectRefused(() => composeAndWriteEmit('signoff', { doc: 'nodoc' }, { model: 'm', brief: CA, answer: 'signed' }, { projectRoot: root }), /'nodoc' names none/);
    expectRefused(() => sign(), /none is saved/);
    copy(CA, 'a');
    copy(CB, 'b');
    expectRefused(() => sign(), new RegExp(`not the latest saved copy.*${CB.replace(/\./g, '\\.')}`));
    // A change's copy does not count for the program.
    expectRefused(() => sign({ brief: 'brief-2026-11-08T10-00-00Z.md' }), /not the latest saved copy/);
  });

  it('the token is unique within signoff/<doc>/, and an aliased signoff/ or <doc> folder is refused writing nowhere', () => {
    setting('program');
    done();
    copy(CA, 'a');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
    expect(path.basename(sign().path)).toBe('signoff-2026-11-13T12-00-00Z.json');
    expect(path.basename(sign().path)).toBe('signoff-2026-11-13T12-00-01Z.json');
    vi.useRealTimers();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-program-signoff-out-'));
    try {
      fs.rmSync(path.join(root, SIGNOFF_DIR), { recursive: true });
      fs.symlinkSync(outside, path.join(root, SIGNOFF_DIR));
      expectRefused(() => sign(), /prog directory .* does not physically resolve/);
      expect(fs.readdirSync(outside)).toEqual([]);
      fs.rmSync(path.join(root, 'orbit/architecture/.orbit-runs/signoff'), { recursive: true });
      fs.mkdirSync(path.join(outside, 'prog'));
      fs.symlinkSync(outside, path.join(root, 'orbit/architecture/.orbit-runs/signoff'));
      expectRefused(() => sign(), /signoff directory .* does not physically resolve/);
      expect(fs.readdirSync(path.join(outside, 'prog'))).toEqual([]);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});
