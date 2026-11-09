/**
 * decision-reading, chunk 1: replacement records (`orbit-decision-records`' `A record is fixed by a
 * replacement, never edited`) and the write gate's chain-aware link checks (`orbit-emit-composition`'s
 * `The write gate checks decision records`).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { readDecisionFolder, latestInChain, chainOf, selectUnreadRecords } from '../../src/core/decision-records.js';

let root: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function makeChange(name: string): void {
  write(`orbit/changes/${name}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(`orbit/changes/${name}/tasks.md`, '# Tasks\n\n- [ ] 1.1 do a thing\n');
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 3\n');
}

const DEC = (change: string) => `orbit/changes/${change}/.orbit-runs/decisions`;

function ls(rel: string): string[] {
  const dir = path.join(root, rel);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf-8');
}

const PROG_DOC = '# prog\n\n## Goals\n\n- **G1 — the first goal.** text\n- **G2 — the second.** text\n\n## Rulings index\n\n- **R-p-1** (Sal) — a ruling\n';

const stopPayload = (over: Record<string, unknown> = {}) => ({
  model: 'test-model',
  condition: 'security-unprecedented',
  about: 'Where the API key is kept.',
  question: 'May the key live in the user config file?',
  ...over,
});

const ledgerPayload = (over: Record<string, unknown> = {}) => ({
  model: 'test-model',
  area: 'defaults',
  decided: 'The export runs weekly unless the user picks another interval.',
  alternatives: ['daily', 'never by default'],
  why: 'Weekly matches the goal of nothing being lost.',
  relies_on: [{ kind: 'goal', doc: 'prog', id: 'G1' }],
  ...over,
});

const resolutionPayload = (stop: string, over: Record<string, unknown> = {}) => ({
  model: 'test-model',
  stop,
  answer: 'Yes, in the user config file.',
  effect: 'The run continues with the key in the config file.',
  ...over,
});

const emit = (command: string, payload: Record<string, unknown>, change = 'foo') =>
  path.basename(composeAndWriteEmit(command, { change }, payload, { projectRoot: root }).path);

function expectRefused(fn: () => unknown, patterns: RegExp[], folder = DEC('foo')): void {
  const before = ls(folder);
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught, 'expected a refusal').toBeInstanceOf(EmitError);
  for (const p of patterns) expect((caught as Error).message).toMatch(p);
  expect(ls(folder)).toEqual(before);
}

const esc = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-replacements-'));
  write('orbit/architecture/prog.md', PROG_DOC);
  makeChange('foo');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('orbit-decision-records: A record is fixed by a replacement, never edited', () => {
  // @scenario behaviour orbit-decision-records :: A record is fixed by a replacement, never edited :: A replacement rewords and keeps its links
  it('a replacement with equal link fields is written and the original is untouched', () => {
    const a = emit('ledger', ledgerPayload());
    const before = read(`${DEC('foo')}/${a}`);
    // Key order inside a citation is not a difference.
    const c = emit('ledger', ledgerPayload({ decided: 'Reworded.', replaces: a, relies_on: [{ id: 'G1', kind: 'goal', doc: 'prog' }] }));
    expect(read(`${DEC('foo')}/${a}`)).toBe(before);
    expect(JSON.parse(read(`${DEC('foo')}/${c}`)).replaces).toBe(a);
    const folder = readDecisionFolder(path.join(root, DEC('foo')));
    expect(latestInChain(folder, a)).toBe(c);
    expect(chainOf(folder, c)).toEqual([a, c]);
  });

  // @scenario behaviour orbit-decision-records :: A record is fixed by a replacement, never edited :: A replacement that changes a link is refused
  it('a replacement changing area is refused naming area', () => {
    const a = emit('ledger', ledgerPayload());
    expectRefused(() => emit('ledger', ledgerPayload({ replaces: a, area: 'docs' })), [/'area' differs/]);
    // Each link field is checked, not only the first: relies_on, then raised_stop.
    expectRefused(() => emit('ledger', ledgerPayload({ replaces: a, relies_on: [{ kind: 'goal', doc: 'prog', id: 'G2' }] })), [/'relies_on' differs/]);
    const s = emit('stop', stopPayload());
    expectRefused(() => emit('stop', stopPayload({ replaces: s, condition: 'user-facing-uncovered' })), [/'condition' differs/]);
    const s2 = emit('stop', stopPayload());
    const r = emit('resolution', resolutionPayload(s));
    expectRefused(() => emit('resolution', resolutionPayload(s2, { replaces: r })), [/'stop' differs/]);
  });

  // @scenario behaviour orbit-decision-records :: A record is fixed by a replacement, never edited :: Replacing the one resolution of a stop
  it('replacing a stop\'s one resolution is not a second resolution', () => {
    const s = emit('stop', stopPayload());
    const b = emit('resolution', resolutionPayload(s));
    const d = emit('resolution', resolutionPayload(s, { answer: 'Reworded answer.', replaces: b }));
    expect(latestInChain(readDecisionFolder(path.join(root, DEC('foo'))), b)).toBe(d);
    // A third, non-replacing, resolution is still refused, naming both of the chain's records.
    expectRefused(() => emit('resolution', resolutionPayload(s)), [esc(b), esc(d)]);
  });

  // @scenario behaviour orbit-decision-records :: A record is fixed by a replacement, never edited :: A replaced resolution is not cited anew
  it('citing a replaced resolution is refused naming its replacement; an earlier citation stays', () => {
    const s = emit('stop', stopPayload());
    const b = emit('resolution', resolutionPayload(s));
    const tokenOf = (f: string) => f.replace(/^resolution-/, '').replace(/\.json$/, '');
    const cite = { kind: 'resolution', change: 'foo', token: tokenOf(b) };
    const early = emit('ledger', ledgerPayload({ relies_on: [cite] }));
    const d = emit('resolution', resolutionPayload(s, { replaces: b, answer: 'Reworded.' }));
    expectRefused(() => emit('ledger', ledgerPayload({ relies_on: [cite] })), [/relies_on\[0\]/, esc(d)]);
    expect(JSON.parse(read(`${DEC('foo')}/${early}`)).relies_on).toEqual([cite]);
    // The latest is citable.
    emit('ledger', ledgerPayload({ relies_on: [{ ...cite, token: tokenOf(d) }] }));
    // A replacement of the early entry carries its citation, though its target was replaced.
    emit('ledger', ledgerPayload({ relies_on: [cite], replaces: early, why: 'Reworded why.' }));
  });

  // @scenario behaviour orbit-decision-records :: A record is fixed by a replacement, never edited :: A record whose target was replaced can still be replaced
  it('a ledger entry naming a replaced stop can be replaced, carrying that link', () => {
    const s = emit('stop', stopPayload());
    const l = emit('ledger', ledgerPayload({ relies_on: [], raised_stop: s }));
    const t = emit('stop', stopPayload({ replaces: s, about: 'Reworded about.' }));
    const r = emit('ledger', ledgerPayload({ relies_on: [], raised_stop: s, replaces: l, decided: 'Reworded.' }));
    const folder = readDecisionFolder(path.join(root, DEC('foo')));
    expect(latestInChain(folder, JSON.parse(read(`${DEC('foo')}/${r}`)).raised_stop)).toBe(t);
  });

  // @scenario behaviour orbit-decision-records :: A record is fixed by a replacement, never edited :: A stop answered through its earlier record is not answered again
  it('a stop chain answered through its earlier record refuses a resolution of its replacement', () => {
    const s = emit('stop', stopPayload());
    const b = emit('resolution', resolutionPayload(s));
    const t = emit('stop', stopPayload({ replaces: s, question: 'Reworded question?' }));
    expectRefused(() => emit('resolution', resolutionPayload(t)), [/'stop'/, esc(b)]);
  });
});

describe('orbit-decision-records: several fixes to one record (the system walk)', () => {
  // @scenario behaviour orbit-decision-records :: A record is fixed by a replacement, never edited :: Several fixes to one record make a chain
  it('three fixes, one after another, chain three replacements; the third is current to every reader', () => {
    const a = emit('ledger', ledgerPayload());
    const r1 = emit('ledger', ledgerPayload({ replaces: a, decided: 'Fix one.' }));
    const r2 = emit('ledger', ledgerPayload({ replaces: r1, decided: 'Fix one and two.' }));
    const r3 = emit('ledger', ledgerPayload({ replaces: r2, decided: 'Fix one, two and three.' }));
    const folder = readDecisionFolder(path.join(root, DEC('foo')));
    expect(chainOf(folder, a)).toEqual([a, r1, r2, r3]);
    expect(latestInChain(folder, a)).toBe(r3);
    expect(selectUnreadRecords(path.join(root, 'orbit/changes/foo'))).toEqual([r3]);
    // The link checks: a replacement of anything but the latest is refused, naming the latest.
    expectRefused(() => emit('ledger', ledgerPayload({ replaces: r1, decided: 'Late.' })), [/'replaces'/, esc(r3)]);
  });
});

describe('orbit-emit-composition: The write gate checks decision records (replacement chains)', () => {
  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A replacement of another kind is refused
  it('a stop replacing a ledger entry is refused naming replaces', () => {
    const a = emit('ledger', ledgerPayload());
    expectRefused(() => emit('stop', stopPayload({ replaces: a })), [/'replaces'/]);
    expectRefused(() => emit('stop', stopPayload({ replaces: 'ledger-2026-11-08T10-00-00Z.json' })), [/'replaces'/]);
    // A well-formed name of the right kind that does not exist is refused too.
    expectRefused(() => emit('stop', stopPayload({ replaces: 'stop-2026-11-08T10-00-00Z.json' })), [/'replaces'.*names no record/]);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A second replacement of one record is refused
  it('a second replacement of one record is refused naming replaces and the first replacement', () => {
    const a = emit('ledger', ledgerPayload());
    const c = emit('ledger', ledgerPayload({ replaces: a, decided: 'Reworded.' }));
    expectRefused(() => emit('ledger', ledgerPayload({ replaces: a, decided: 'Again.' })), [/'replaces'/, esc(c)]);
    // Replacing the latest extends the chain.
    const e = emit('ledger', ledgerPayload({ replaces: c, decided: 'Again.' }));
    expect(chainOf(readDecisionFolder(path.join(root, DEC('foo'))), a)).toEqual([a, c, e]);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A raised stop that was replaced is refused
  it('a new raised_stop naming a replaced stop is refused naming the replacement', () => {
    const s = emit('stop', stopPayload());
    const t = emit('stop', stopPayload({ replaces: s, about: 'Reworded.' }));
    expectRefused(() => emit('ledger', ledgerPayload({ relies_on: [], raised_stop: s })), [/'raised_stop'/, esc(t)]);
    emit('ledger', ledgerPayload({ relies_on: [], raised_stop: t }));
    // And a resolution's stop.
    expectRefused(() => emit('resolution', resolutionPayload(s)), [/'stop'/, esc(t)]);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A replacement carries a link to a replaced stop
  it('a replacement carrying a raised_stop that was since replaced is written', () => {
    const s = emit('stop', stopPayload());
    const l = emit('ledger', ledgerPayload({ relies_on: [], raised_stop: s }));
    emit('stop', stopPayload({ replaces: s, about: 'Reworded.' }));
    const r = emit('ledger', ledgerPayload({ relies_on: [], raised_stop: s, replaces: l, why: 'Reworded.' }));
    expect(ls(DEC('foo'))).toContain(r);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A second answer through a replaced stop is refused
  it('a resolution of the replacement of an answered stop is refused naming the earlier resolution', () => {
    const s = emit('stop', stopPayload());
    const b = emit('resolution', resolutionPayload(s));
    const t = emit('stop', stopPayload({ replaces: s, about: 'Reworded.' }));
    expectRefused(() => emit('resolution', resolutionPayload(t)), [esc(t), esc(b)]);
  });

  it('a replacement belonging to other work is refused', () => {
    write('orbit/architecture/.orbit-runs/decisions/.keep', '');
    write('orbit/architecture/prog2.md', PROG_DOC);
    const a = path.basename(
      composeAndWriteEmit('stop', { doc: 'prog' }, stopPayload(), { projectRoot: root }).path
    );
    expect(() =>
      composeAndWriteEmit('stop', { doc: 'prog2' }, stopPayload({ replaces: a }), { projectRoot: root })
    ).toThrow(/'replaces'.*other work/);
  });
});
