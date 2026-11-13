/**
 * program-brief: the per-change SIGN-OFF — the setting (`orbit-program-brief`'s `The sign-off setting holds each
 * change's archive for the user's sign-off`), the record and the hold (`A sign-off is recorded against the saved
 * copy, and the hold reads it`), and the write gate (`orbit-emit-composition`'s `The write gate checks the sign-off
 * record`).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { resolveSignoffSetting } from '../../src/core/project-config.js';
import { computeHold, SignoffError } from '../../src/core/signoff.js';
import { loadChangeContext, formatChangeStatus } from '../../src/core/artifact-graph/instruction-loader.js';
import { readTrail } from '../../src/core/artifact-graph/trail.js';
import { renderReport } from '../../src/core/report-render.js';
import { collectOrientation } from '../../src/core/orientation.js';
import { runCLI } from '../helpers/run-cli.js';

let root: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function makeChange(name: string): void {
  write(`orbit/changes/${name}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(`orbit/changes/${name}/design.md`, '# Design\n');
  write(`orbit/changes/${name}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(`orbit/changes/${name}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [x] 1.1 do a thing\n');
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 5\n');
}

const setting = (value: string | null): void => {
  write('orbit/config.yaml', value === null ? 'schema: spec-driven\n' : `schema: spec-driven\nsignoff: ${value}\n`);
};

const RUNS = (c = 'foo') => `orbit/changes/${c}/.orbit-runs`;
const A = 'brief-2026-11-13T10-00-00Z.md';
const B = 'brief-2026-11-13T11-00-00Z.md';
const sha = (s: string) => createHash('sha256').update(Buffer.from(s, 'utf-8')).digest('hex');

/** A saved copy written directly, with chosen bytes. */
const saveCopy = (name: string, text: string, c = 'foo') => write(`${RUNS(c)}/brief/${name}`, text);

const payload = (over: Record<string, unknown> = {}) => ({ model: 'test-model', brief: A, answer: 'signed', ...over });

const emit = (p: Record<string, unknown>, target: { change?: string; doc?: string } = { change: 'foo' }) =>
  composeAndWriteEmit('signoff', target, p, { projectRoot: root });

const hold = (c = 'foo') => computeHold(root, c, path.join(root, 'orbit/changes', c));

function allFiles(dir = root): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !e.isSymbolicLink()) out.push(...allFiles(p));
    else out.push(path.relative(root, p));
  }
  return out.sort();
}

/** Expect a refusal naming `pattern`, and no new file anywhere under the project. */
function expectRefused(fn: () => unknown, pattern: RegExp): void {
  const before = allFiles();
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught, 'expected a refusal').toBeInstanceOf(EmitError);
  expect((caught as Error).message).toMatch(pattern);
  expect(allFiles()).toEqual(before);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-signoff-'));
  makeChange('foo');
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// orbit-program-brief: The sign-off setting holds each change's archive for the user's sign-off
// ---------------------------------------------------------------------------

describe("orbit-program-brief: The sign-off setting holds each change's archive for the user's sign-off", () => {
  it('the resolver reads only the signoff key: absent, off, absent file and unparseable file are off silently; change is change; anything else warns', () => {
    const warn = vi.spyOn(console, 'warn');
    expect(resolveSignoffSetting(root)).toEqual({ value: 'off', warning: null }); // no config file
    setting(null);
    expect(resolveSignoffSetting(root)).toEqual({ value: 'off', warning: null });
    setting('off'); // YAML 1.2: a string, not a boolean
    expect(resolveSignoffSetting(root)).toEqual({ value: 'off', warning: null });
    setting('change');
    expect(resolveSignoffSetting(root)).toEqual({ value: 'change', warning: null });
    write('orbit/config.yaml', 'signoff: [change\n');
    expect(resolveSignoffSetting(root)).toEqual({ value: 'off', warning: null });
    for (const [value, named] of [['program', "'program'"], ['[change]', 'a list'], ['{a: 1}', 'a map'], ['3', "'3'"], ['', 'an empty value']]) {
      setting(value);
      const r = resolveSignoffSetting(root);
      expect(r.value, value).toBe('off');
      expect(r.warning, value).toContain(named);
      expect(r.warning, value).toContain('nothing waits on a sign-off');
    }
    // It never prints: the hold carries the warning.
    expect(warn).not.toHaveBeenCalled();
  });

  // @scenario behaviour orbit-program-brief :: The sign-off setting holds each change's archive for the user's sign-off :: With the setting absent, nothing waits
  // @scenario behaviour orbit-archive-modifications :: The archive holds for a per-change sign-off :: A default archive reads the hold and asks nothing
  it('with the setting absent, the hold reports off and not held, with no warning, over a saved brief', async () => {
    setting(null);
    saveCopy(A, 'text');
    expect(hold()).toEqual({ change: 'foo', setting: 'off', warning: null, copy: null, signoff: null, why: 'off', held: false });
    const r = await runCLI(['brief', '--change', 'foo', '--hold', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toBe('');
    expect(Object.keys(JSON.parse(r.stdout))).toEqual(['change', 'setting', 'warning', 'copy', 'signoff', 'why', 'held']);
    expect(JSON.parse(r.stdout)).toMatchObject({ setting: 'off', why: 'off', held: false, warning: null });
  });

  // @scenario behaviour orbit-program-brief :: The sign-off setting holds each change's archive for the user's sign-off :: `off` reads as absent
  it('off reads as absent', () => {
    setting('off');
    saveCopy(A, 'text');
    expect(hold()).toMatchObject({ setting: 'off', warning: null, why: 'off', held: false });
  });

  // @scenario behaviour orbit-program-brief :: The sign-off setting holds each change's archive for the user's sign-off :: `change` holds a change with a saved copy and no sign-off
  it('change holds a change with a saved copy and no sign-off: unsigned', () => {
    setting('change');
    saveCopy(A, 'text');
    expect(hold()).toEqual({
      change: 'foo', setting: 'change', warning: null, copy: { file: A, sha256: sha('text') }, signoff: null, why: 'unsigned', held: true,
    });
  });

  // @scenario behaviour orbit-program-brief :: The sign-off setting holds each change's archive for the user's sign-off :: An unrecognized value is read as absent, with a warning
  it('an unrecognized value is read as absent, the hold carrying one warning naming it', async () => {
    setting('program');
    saveCopy(A, 'text');
    const h = hold();
    expect(h).toMatchObject({ setting: 'off', why: 'off', held: false });
    expect(h.warning).toContain("'program'");
    expect(h.warning).toContain('nothing waits on a sign-off');
    const j = await runCLI(['brief', '--change', 'foo', '--hold', '--json'], { cwd: root });
    expect(JSON.parse(j.stdout).warning).toBe(h.warning);
    // The one-line form keeps standard output to its line; the warning goes to standard error.
    const t = await runCLI(['brief', '--change', 'foo', '--hold'], { cwd: root });
    expect(t.exitCode).toBe(0);
    expect(t.stdout.trimEnd().split('\n')).toHaveLength(1);
    expect(t.stdout).toContain('not held (off)');
    expect(t.stderr).toContain("'program'");
  });
});

// ---------------------------------------------------------------------------
// orbit-program-brief: A sign-off is recorded against the saved copy, and the hold reads it
// ---------------------------------------------------------------------------

describe('orbit-program-brief: A sign-off is recorded against the saved copy, and the hold reads it', () => {
  beforeEach(() => setting('change'));

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: A signature lifts the hold
  it('a signature lifts the hold', async () => {
    saveCopy(A, 'text');
    const s = emit(payload());
    const r = await runCLI(['brief', '--change', 'foo', '--hold', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({
      change: 'foo', setting: 'change', warning: null,
      copy: { file: A, sha256: sha('text') }, signoff: { file: path.basename(s.path), answer: 'signed' }, why: 'signed', held: false,
    });
    const t = await runCLI(['brief', '--change', 'foo', '--hold'], { cwd: root });
    expect(t.stdout).toContain('not held (signed)');
    expect(t.stdout).toContain(A);
    expect(t.stdout).toContain(path.basename(s.path));
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: A decline keeps the hold and records the reason
  it('a decline records the reason and keeps the hold: unsigned', () => {
    saveCopy(A, 'text');
    const reason = 'The seams section leaves out the new prompt.';
    const s = emit(payload({ answer: 'declined', reason }));
    expect(JSON.parse(fs.readFileSync(s.path, 'utf-8'))).toMatchObject({ answer: 'declined', reason });
    expect(hold()).toMatchObject({ why: 'unsigned', held: true, signoff: { answer: 'declined' } });
  });

  it('a decline after a signature over the same copy keeps the hold: the latest sign-off is current', () => {
    saveCopy(A, 'text');
    emit(payload());
    expect(hold().why).toBe('signed');
    emit(payload({ answer: 'declined', reason: 'On a second read, no.' }));
    expect(hold()).toMatchObject({ why: 'unsigned', held: true });
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: A copy saved again with the same text is not asked again
  it('a copy saved again with the same bytes is signed', () => {
    saveCopy(A, 'same text');
    emit(payload());
    saveCopy(B, 'same text');
    expect(hold()).toMatchObject({ why: 'signed', held: false, copy: { file: B } });
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: A signature over different text does not lift the hold
  it('a signature over different text does not lift the hold', () => {
    saveCopy(A, 'first text');
    emit(payload());
    saveCopy(B, 'second text');
    expect(hold()).toMatchObject({ why: 'unsigned', held: true, copy: { file: B } });
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: No saved copy holds with nothing to sign
  it('no saved copy holds with nothing to sign: no-copy, even beside a sign-off folder', () => {
    expect(hold()).toEqual({ change: 'foo', setting: 'change', warning: null, copy: null, signoff: null, why: 'no-copy', held: true });
    fs.mkdirSync(path.join(root, RUNS(), 'brief'), { recursive: true });
    write(`${RUNS()}/brief/notes.md`, 'not a copy'); // any other name is ignored
    expect(hold().why).toBe('no-copy');
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: A damaged latest sign-off fails the hold, never reviving an earlier one
  it('a damaged latest sign-off fails the hold naming it, with nothing on standard output, never reviving the earlier signature', async () => {
    saveCopy(A, 'text');
    emit(payload());
    const damaged = 'signoff-2099-01-01T00-00-00Z.json';
    write(`${RUNS()}/signoff/${damaged}`, '{ not json');
    expect(() => hold()).toThrow(SignoffError);
    expect(() => hold()).toThrow(new RegExp(`${damaged} is not valid JSON`));
    const r = await runCLI(['brief', '--change', 'foo', '--hold'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain(damaged);
    // A latest sign-off of a shape the write gate would refuse fails it too.
    for (const bad of [
      { command: 'signoff', brief: A, sha256: sha('text'), answer: 'maybe' },
      { command: 'signoff', brief: A, sha256: sha('text'), answer: 'declined' },
      { command: 'signoff', brief: A, sha256: 'abc', answer: 'signed' },
      { command: 'account', brief: A, sha256: sha('text'), answer: 'signed' },
      { command: 'signoff', brief: 'x.md', sha256: sha('text'), answer: 'signed' },
      [1],
    ]) {
      write(`${RUNS()}/signoff/${damaged}`, JSON.stringify(bad));
      expect(() => hold(), JSON.stringify(bad)).toThrow(new RegExp(damaged));
    }
  });

  it.skipIf(process.getuid?.() === 0)('a latest copy or a latest sign-off that cannot be read fails the hold naming it', () => {
    saveCopy(A, 'text');
    const copy = path.join(root, RUNS(), 'brief', A);
    fs.chmodSync(copy, 0o000);
    try {
      expect(() => hold()).toThrow(new RegExp(`${A} cannot be read`));
    } finally {
      fs.chmodSync(copy, 0o644);
    }
    const s = emit(payload());
    fs.chmodSync(s.path, 0o000);
    try {
      expect(() => hold()).toThrow(new RegExp(`${path.basename(s.path)} cannot be read`));
    } finally {
      fs.chmodSync(s.path, 0o644);
    }
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: An unreadable history folder fails the hold under `change`
  // @scenario behaviour orbit-archive-modifications :: The archive holds for a per-change sign-off :: A default archive is not stopped by an unreadable history
  it.skipIf(process.getuid?.() === 0)('an unlistable brief/ or signoff/ folder fails the hold under change naming it, with nothing on standard output', async () => {
    saveCopy(A, 'text');
    const briefDir = path.join(root, RUNS(), 'brief');
    fs.chmodSync(briefDir, 0o000);
    try {
      expect(() => hold()).toThrow(/brief cannot be listed/);
      const r = await runCLI(['brief', '--change', 'foo', '--hold', '--json'], { cwd: root });
      expect(r.exitCode).not.toBe(0);
      expect(r.stdout).toBe('');
      expect(r.stderr).toContain('.orbit-runs/brief');
      // With the setting off no folder is read, so the same history answers off (G0).
      setting(null);
      expect(hold()).toMatchObject({ why: 'off', held: false });
    } finally {
      fs.chmodSync(briefDir, 0o755);
    }
    setting('change');
    emit(payload());
    const signoffDir = path.join(root, RUNS(), 'signoff');
    fs.chmodSync(signoffDir, 0o000);
    try {
      expect(() => hold()).toThrow(/signoff cannot be listed/);
    } finally {
      fs.chmodSync(signoffDir, 0o755);
    }
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: Today's readers do not see the sign-offs
  it('status, the reviewed gates, the trail, orientation and the report render read the change as without the signoff folder', () => {
    composeAndWriteEmit('review', { change: 'foo' }, {
      mode: 'proposal', reviewer_class: 'in-context', depth: 'full', passes_run: ['1'], passes_skipped: [],
      scorecard: {
        completeness: { critical: 0, warning: 0, suggestion: 0 },
        correctness: { critical: 0, warning: 0, suggestion: 0 },
        coherence: { critical: 0, warning: 0, suggestion: 0 },
      },
      findings: [], stale_suppressed: [], model: 'm',
    }, { projectRoot: root });
    saveCopy(A, 'text');
    const snapshot = () => ({
      status: formatChangeStatus(loadChangeContext(root, 'foo')),
      trail: readTrail(path.join(root, 'orbit/changes/foo')),
      orientation: collectOrientation(root),
      report: renderReport(root, 'foo'),
    });
    const before = JSON.stringify(snapshot());
    emit(payload());
    emit(payload({ answer: 'declined', reason: 'No.' }));
    expect(fs.readdirSync(path.join(root, RUNS(), 'signoff'))).toHaveLength(2);
    expect(JSON.stringify(snapshot())).toBe(before);
  });

  // @scenario behaviour orbit-program-brief :: A sign-off is recorded against the saved copy, and the hold reads it :: The hold names a change, never a doc
  it('--hold with a doc, with --save, on an archived or unknown change, or with nothing is a usage error printing nothing to standard output', async () => {
    write('orbit/architecture/prog.md', '# prog\n');
    saveCopy(A, 'text');
    const before = allFiles();
    const withDoc = await runCLI(['brief', 'prog', '--hold'], { cwd: root });
    expect(withDoc.exitCode).not.toBe(0);
    expect(withDoc.stdout).toBe('');
    expect(withDoc.stderr).toContain("the program's sign-off is not built yet");
    expect(withDoc.stderr).toContain('program-signoff');
    const withSave = await runCLI(['brief', '--change', 'foo', '--hold', '--save'], { cwd: root });
    expect(withSave.exitCode).not.toBe(0);
    expect(withSave.stdout).toBe('');
    expect(withSave.stderr).toContain('--hold');
    const unknown = await runCLI(['brief', '--change', 'nope', '--hold'], { cwd: root });
    expect(unknown.exitCode).not.toBe(0);
    expect(unknown.stdout).toBe('');
    expect(unknown.stderr).toContain('was not found');
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(path.join(root, 'orbit/changes/foo'), path.join(root, 'orbit/changes/archive/2026-11-13-foo'));
    for (const value of [null, 'change']) {
      setting(value);
      const archived = await runCLI(['brief', '--change', 'foo', '--hold'], { cwd: root });
      expect(archived.exitCode).not.toBe(0);
      expect(archived.stdout).toBe('');
      expect(archived.stderr).toContain('is archived');
    }
    // Writes nothing (the config was rewritten by the test itself).
    expect(allFiles().filter(f => !f.startsWith('orbit/changes/'))).toEqual(before.filter(f => !f.startsWith('orbit/changes/')));
  });
});

// ---------------------------------------------------------------------------
// orbit-emit-composition: The write gate checks the sign-off record
// ---------------------------------------------------------------------------

describe('orbit-emit-composition: The write gate checks the sign-off record', () => {
  beforeEach(() => setting('change'));

  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: A well-formed sign-off writes with the copy's hash
  it('writes signoff/signoff-<TS>.json with the payload, command, change and the engine sha256 of the copy, and no kind', () => {
    saveCopy(A, 'the copy');
    const defines = [{ term: 'hold', definition: 'a wait for the user’s answer' }];
    const r = emit(payload({ reason: 'Reads clearly.', defines, detail: 'technical' }));
    expect(path.relative(root, r.path)).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/signoff\/signoff-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/);
    const rec = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(rec).toEqual({
      command: 'signoff', timestamp: rec.timestamp, change: 'foo', model: 'test-model',
      brief: A, sha256: sha('the copy'), answer: 'signed', reason: 'Reads clearly.', defines, detail: 'technical',
    });
    for (const f of ['kind', 'next_recommended', 'final_assessment']) expect(rec).not.toHaveProperty(f);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: A sign-off with the setting off is refused
  it('refuses under every value but change, naming the setting and the value read', () => {
    saveCopy(A, 'text');
    setting(null);
    expectRefused(() => emit(payload()), /sign-off setting.*is off.*nothing waits on a sign-off/);
    setting('off');
    expectRefused(() => emit(payload()), /is off/);
    setting('program');
    expectRefused(() => emit(payload()), /'program'.*nothing waits on a sign-off/);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: A sign-off naming an earlier copy is refused
  it('refuses a brief that is not the latest saved copy, naming brief and the latest', () => {
    saveCopy(A, 'a');
    saveCopy(B, 'b');
    expectRefused(() => emit(payload({ brief: A })), new RegExp(`'brief'.*not the latest saved copy.*${B.replace(/\./g, '\\.')}`));
  });

  it('refuses a brief that is absent, not a copy filename, or names no saved copy', () => {
    expectRefused(() => emit(payload({ brief: A })), /'brief'.*none is saved/);
    saveCopy(A, 'a');
    expectRefused(() => emit({ model: 'm', answer: 'signed' }), /'brief' must name a saved copy/);
    expectRefused(() => emit(payload({ brief: 7 })), /'brief' must name a saved copy/);
    expectRefused(() => emit(payload({ brief: '../brief-2026-11-13T10-00-00Z.md' })), /'brief' must name a saved copy/);
    expectRefused(() => emit(payload({ brief: 'brief-2026-11-13T09-00-00Z.md' })), /not the latest saved copy/);
  });

  it('refuses an answer that is absent or neither signed nor declined', () => {
    saveCopy(A, 'a');
    expectRefused(() => emit({ model: 'm', brief: A }), /'answer' must be signed or declined/);
    expectRefused(() => emit(payload({ answer: 'yes' })), /'answer' must be signed or declined/);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: A decline without a reason is refused
  it('refuses a decline without a non-blank reason, and a blank or non-string reason on a signature', () => {
    saveCopy(A, 'a');
    expectRefused(() => emit(payload({ answer: 'declined' })), /'reason' is required when the answer is declined/);
    expectRefused(() => emit(payload({ answer: 'declined', reason: '   ' })), /'reason' is required/);
    expectRefused(() => emit(payload({ reason: '' })), /'reason' must be a non-blank string/);
    expectRefused(() => emit(payload({ reason: 3 })), /'reason' must be a non-blank string/);
  });

  it('refuses a malformed defines or detail, an unknown key and a missing model', () => {
    saveCopy(A, 'a');
    expectRefused(() => emit(payload({ defines: 'x' })), /'defines'/);
    expectRefused(() => emit(payload({ defines: [{ term: 'a', definition: 'b' }, { term: 'a', definition: 'c' }] })), /repeats 'a'/);
    expectRefused(() => emit(payload({ defines: [{ term: 'a', definition: 'b', extra: 1 }] })), /unknown key 'extra'/);
    expectRefused(() => emit(payload({ detail: 3 })), /'detail' must be a string/);
    expectRefused(() => emit(payload({ colour: 'red' })), /unknown payload key 'colour'/);
    const { model: _m, ...noModel } = payload();
    expectRefused(() => emit(noModel), /missing the required 'model'/);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: The hash is the engine's
  it('refuses sha256, kind, next_recommended and final_assessment as engine-owned', () => {
    saveCopy(A, 'a');
    for (const f of ['sha256', 'kind', 'next_recommended', 'final_assessment', 'command', 'change']) {
      expectRefused(() => emit(payload({ [f]: 'x' })), new RegExp(`'${f}' is engine-owned`));
    }
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the sign-off record :: An archived change takes no sign-off
  it('refuses an archived-only, exploration-only or unknown name with the active-change wording, and --doc naming program-signoff', () => {
    expectRefused(() => emit(payload(), { change: 'nope' }), /written only for an active change.*'nope' was found nowhere/);
    write('orbit/explore/bar/explore.md', '# x\n');
    expectRefused(() => emit(payload(), { change: 'bar' }), /'bar' was found only at orbit\/explore\/bar\//);
    write('orbit/changes/archive/2026-11-01-baz/proposal.md', '# x\n');
    expectRefused(() => emit(payload(), { change: 'baz' }), /'baz' was found only at orbit\/changes\/archive\/2026-11-01-baz\//);
    write('orbit/architecture/prog.md', '# prog\n');
    expectRefused(() => emit(payload(), { doc: 'prog' }), /--doc is not a valid target for 'signoff'.*program-signoff/);
  });

  it('through the CLI: a refusal exits non-zero with empty stdout', async () => {
    saveCopy(A, 'a');
    write('p.json', JSON.stringify(payload({ answer: 'declined' })));
    const r = await runCLI(['emit', 'signoff', '--change', 'foo', '--payload', 'p.json'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain("'reason'");
  });

  it('the token is unique within signoff/, and an aliased signoff folder is refused writing nowhere', () => {
    saveCopy(A, 'a');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
    try {
      const one = path.basename(emit(payload()).path);
      const two = path.basename(emit(payload()).path);
      expect(one).toBe('signoff-2026-11-13T12-00-00Z.json');
      expect(two).toBe('signoff-2026-11-13T12-00-01Z.json');
    } finally {
      vi.useRealTimers();
    }
    const dir = path.join(root, RUNS(), 'signoff');
    fs.rmSync(dir, { recursive: true });
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-signoff-out-'));
    try {
      fs.symlinkSync(outside, dir);
      expectRefused(() => emit(payload()), /signoff directory .* does not physically resolve/);
      expect(fs.readdirSync(outside)).toEqual([]);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});
