/**
 * brief-render (stage `program-brief` of `automate-dev-flow`): the BRIEF of a change and of a program
 * (`orbit-program-brief`), the save, and the two decision-records scenarios that name the brief as a reader.
 *
 * The goldens under test/fixtures/brief-golden/ are the stage's first exit criterion: one fixture program,
 * and a second whose changes carry ledger entries and stops, open and answered. Each asserts BYTE equality;
 * a wording change re-records them deliberately (`UPDATE_BRIEF_GOLDEN=1`), never silently.
 *
 * The same-token race is simulated as `account.test.ts` does: `node:fs`'s `readdirSync` is wrapped to return
 * an empty listing for a `brief` folder while `race.on` is set.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const race = vi.hoisted(() => ({ on: false }));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const readdirSync = ((p: fs.PathLike, ...rest: unknown[]) =>
    race.on && String(p).endsWith(`${path.sep}brief`) ? [] : (actual.readdirSync as any)(p, ...rest)) as typeof actual.readdirSync;
  return { ...actual, readdirSync, default: { ...actual, readdirSync } };
});

const {
  buildChangeBrief,
  buildProgramBrief,
  renderChangeBrief,
  renderProgramBrief,
  saveChangeBrief,
  ProgramBriefError,
} = await import('../../src/core/program-brief.js');
const { selectUnreadRecords } = await import('../../src/core/decision-records.js');
const { composeAndWriteEmit } = await import('../../src/core/emit-composition.js');
const { loadChangeContext, formatChangeStatus } = await import('../../src/core/artifact-graph/instruction-loader.js');
const { readTrail } = await import('../../src/core/artifact-graph/trail.js');
const { renderReport } = await import('../../src/core/report-render.js');
const { collectOrientation } = await import('../../src/core/orientation.js');
const { runCLI } = await import('../helpers/run-cli.js');

const GOLDEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'brief-golden');

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-brief-'));
  race.on = false;
});

afterEach(() => {
  race.on = false;
  vi.useRealTimers();
  fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function json(rel: string, v: unknown): void {
  write(rel, JSON.stringify(v, null, 2) + '\n');
}

/** A fixed token per record number, so the renders are byte-stable. */
const T = (n: number): string => `2026-11-01T10-${String(Math.floor(n / 60)).padStart(2, '0')}-${String(n % 60).padStart(2, '0')}Z`;
const iso = (tok: string): string => tok.replace(/-(\d{2})-(\d{2})Z$/, ':$1:$2Z');

const DOC = [
  '# prog',
  '',
  '## Premise',
  '',
  'A test program.',
  '',
  '## Stages',
  '',
  '### Stage a — the first stage',
  '',
  'Depends-on: (none)',
  'Complete: [ ]',
  '',
  '### Stage b — the second stage',
  '',
  'Depends-on: a',
  'Complete: [ ]',
  '',
].join('\n');

function makeDoc(content = DOC, name = 'prog'): void {
  write(`orbit/architecture/${name}.md`, content);
}

interface ChangeOpts {
  doc?: string | null;
  stage?: string | null;
  specs?: Record<string, string>;
  size?: string;
}

const ADD_R = '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n';

/** A change at `dir` (repo-relative). */
function makeChange(dir: string, opts: ChangeOpts = {}): void {
  const doc = opts.doc === undefined ? 'prog' : opts.doc;
  const stage = opts.stage === undefined ? 'a' : opts.stage;
  write(`${dir}/proposal.md`, `## Why\n\nw\n${opts.size ?? ''}`);
  write(`${dir}/design.md`, '# Design\n');
  write(`${dir}/tasks.md`, '## 1. Group\n\n- [x] 1.1 do a thing\n');
  for (const [cap, body] of Object.entries(opts.specs ?? { cap: ADD_R })) write(`${dir}/specs/${cap}/spec.md`, body);
  const arch = doc === null ? '' : `architecture:\n  doc: ${doc}\n${stage === null ? '' : `  stage: ${stage}\n`}`;
  write(`${dir}/.openspec.yaml`, `schema: spec-driven\nschema_version: 5\n${arch}`);
}

const changeOf = (dir: string): string => path.basename(dir).replace(/^\d{4}-\d{2}-\d{2}-/, '');

function ledger(dir: string, n: number, over: Record<string, unknown> = {}): string {
  const name = `ledger-${T(n)}.json`;
  json(`${dir}/.orbit-runs/decisions/${name}`, {
    command: 'ledger',
    timestamp: iso(T(n)),
    change: changeOf(dir),
    model: 'm',
    area: 'user-sees-or-does',
    decided: `Decided ${n}.`,
    alternatives: [`Alternative ${n}.`],
    why: `Why ${n}.`,
    relies_on: [{ kind: 'ruling', doc: 'prog', id: 'R-1' }],
    ...over,
  });
  return name;
}

function stop(dir: string, n: number, over: Record<string, unknown> = {}): string {
  const name = `stop-${T(n)}.json`;
  json(`${dir}/.orbit-runs/decisions/${name}`, {
    command: 'stop',
    timestamp: iso(T(n)),
    change: changeOf(dir),
    model: 'm',
    condition: 'user-facing-uncovered',
    about: `About ${n}.`,
    question: `Question ${n}?`,
    ...over,
  });
  return name;
}

function resolution(dir: string, n: number, stopName: string, over: Record<string, unknown> = {}): string {
  const name = `resolution-${T(n)}.json`;
  json(`${dir}/.orbit-runs/decisions/${name}`, {
    command: 'resolution',
    timestamp: iso(T(n)),
    change: changeOf(dir),
    model: 'm',
    stop: stopName,
    answer: `Answer ${n}.`,
    effect: `Effect ${n}.`,
    ...over,
  });
  return name;
}

function account(dir: string, n: number, over: Record<string, unknown> = {}): string {
  const name = `account-${T(n)}.json`;
  json(`${dir}/.orbit-runs/account/${name}`, {
    command: 'account',
    timestamp: iso(T(n)),
    change: changeOf(dir),
    model: 'm',
    built: `Built ${n}.`,
    seams: `Seams ${n}.`,
    deviations: `Deviations ${n}.`,
    ...over,
  });
  return name;
}

function archiveRecord(dir: string, n: number, sync: Record<string, unknown>, over: Record<string, unknown> = {}): void {
  json(`${dir}/.orbit-runs/archive-${T(n)}.json`, {
    command: 'archive',
    timestamp: iso(T(n)),
    change: changeOf(dir),
    sync_specs: sync,
    warnings: [],
    ...over,
  });
}

const SYNCED = { ran: true, skipped_reason: null, capabilities_updated: ['cap'], added: 1, modified: 0, removed: 0, renamed: 0 };

function change(name: string): string {
  return renderChangeBrief(buildChangeBrief(root, name));
}

/** The text of one `## <heading>` section of a change brief, up to the next `## `. */
function section(text: string, heading: string): string {
  const start = text.indexOf(`\n## ${heading}\n`);
  expect(start, `section ${heading}`).toBeGreaterThan(-1);
  const rest = text.slice(start + 1);
  const end = rest.indexOf('\n## ', 4);
  return end === -1 ? rest : rest.slice(0, end);
}

function allFiles(dir = root): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...allFiles(p));
    else out.push(`${path.relative(root, p)}:${createHash('sha256').update(fs.readFileSync(p)).digest('hex')}`);
  }
  return out.sort();
}

function golden(name: string, actual: string): void {
  const p = path.join(GOLDEN, name);
  if (process.env.UPDATE_BRIEF_GOLDEN === '1') {
    fs.mkdirSync(GOLDEN, { recursive: true });
    fs.writeFileSync(p, actual);
  }
  expect(actual).toBe(fs.readFileSync(p, 'utf-8'));
}

const ARCHIVED_X = 'orbit/changes/archive/2026-11-01-x';

// ---------------------------------------------------------------------------
// A brief tells the user what a change or a program did, from the trail
// ---------------------------------------------------------------------------

describe('a brief tells the user what a change or a program did, from the trail', () => {
  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: A change brief carries every section
  it('an archived change brief carries every section, in order, each from its source', () => {
    makeDoc();
    makeChange(ARCHIVED_X, { stage: 'b' });
    account(ARCHIVED_X, 1);
    ledger(ARCHIVED_X, 2);
    const s = stop(ARCHIVED_X, 3);
    resolution(ARCHIVED_X, 4, s);
    archiveRecord(ARCHIVED_X, 5, SYNCED, { warnings: ['Warned 5.'] });
    const text = change('x');
    const headings = text.split('\n').filter(l => l.startsWith('## '));
    expect(headings).toEqual([
      '## What was built',
      '## Capabilities and requirements added or changed',
      '## New terms',
      '## New seams',
      '## The ledger',
      '## Stops',
      '## Tripwires',
      '## Deviations from the charter',
      '## Records no reader checked',
    ]);
    expect(section(text, 'What was built')).toContain('Built 1.');
    const caps = section(text, 'Capabilities and requirements added or changed');
    expect(caps).toContain('The archive synced these into the specs — 1 capability updated (`cap`); requirements: 1 added, 0 changed, 0 removed, 0 renamed.');
    expect(caps).toContain("The requirement titles below are the titles the change's specs give them, word for word.");
    expect(caps).toMatch(/- `cap`\n {2}- Added:\n {4}- R\n/);
    expect(section(text, 'New seams')).toContain('Seams 1.');
    expect(section(text, 'The ledger')).toContain('- Decided: Decided 2.');
    expect(section(text, 'The ledger')).toContain('  - ruling R-1 of `prog`');
    expect(section(text, 'Stops')).toContain('- Answer (resolution-2026-11-01T10-00-04Z.json): Answer 4.');
    expect(section(text, 'Deviations from the charter')).toContain('Deviations 1.');
    expect(section(text, 'Deviations from the charter')).toContain('- Warned 5.');
    expect(section(text, 'Records no reader checked')).toContain('- ledger-2026-11-01T10-00-02Z.json');
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: A change with no account says so
  it('a change with no account says so in what was built, the seams and the deviations', () => {
    makeChange('orbit/changes/foo');
    ledger('orbit/changes/foo', 1);
    const text = change('foo');
    const none = 'No account was written for this change, so this brief cannot say this.';
    expect(section(text, 'What was built')).toContain(none);
    expect(section(text, 'New seams')).toContain(none);
    expect(section(text, 'Deviations from the charter')).toContain(none);
    expect(section(text, 'The ledger')).toContain('Decided 1.');
    expect(section(text, 'Records no reader checked')).not.toContain('The account');
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: A replaced ledger entry shows its latest wording
  it('a replaced ledger entry shows its replacement and not the original', () => {
    makeChange('orbit/changes/foo');
    const a = ledger('orbit/changes/foo', 1, { decided: 'The first wording.' });
    ledger('orbit/changes/foo', 2, { decided: 'The second wording.', replaces: a });
    const l = section(change('foo'), 'The ledger');
    expect(l).toContain('The second wording.');
    expect(l).not.toContain('The first wording.');
    expect(l).not.toContain(`### ${a}`);
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: An unanswered stop is marked open
  it('an unanswered stop shows its about and question and is marked open', () => {
    makeChange('orbit/changes/foo');
    stop('orbit/changes/foo', 1);
    const s = section(change('foo'), 'Stops');
    expect(s).toContain('- About: About 1.');
    expect(s).toContain('- Question: Question 1?');
    expect(s).toContain('- Open: no answer to this stop has been recorded.');
  });

  it('a stop answered through its earlier record shows the answer on the reworded stop', () => {
    makeChange('orbit/changes/foo');
    const s = stop('orbit/changes/foo', 1);
    resolution('orbit/changes/foo', 2, s);
    stop('orbit/changes/foo', 3, { about: 'Reworded.', replaces: s });
    const text = section(change('foo'), 'Stops');
    expect(text).toContain('- About: Reworded.');
    expect(text).toContain('Answer 2.');
    expect(text).not.toContain('Open:');
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: Tripwires are never reported as quiet
  it('every brief says tripwires are not installed, never that none fired', () => {
    makeDoc();
    makeChange('orbit/changes/foo');
    const line = 'Tripwires are not installed yet, so this brief cannot say whether any would have fired.';
    const c = change('foo');
    const p = renderProgramBrief(buildProgramBrief(root, 'prog'));
    expect(section(c, 'Tripwires')).toContain(line);
    expect(p).toContain(`## Tripwires\n\n${line}\n`);
    expect(c + p).not.toMatch(/no tripwire fired|none fired/i);
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: One definition from two records is shown once
  it('one definition from two records is shown once, naming both', () => {
    makeChange('orbit/changes/foo');
    const def = [{ term: 'hold', definition: "a wait for the user's answer" }];
    const a = ledger('orbit/changes/foo', 1, { defines: def });
    const b = stop('orbit/changes/foo', 2, { defines: def });
    const t = section(change('foo'), 'New terms');
    expect(t.match(/\*\*hold\*\*/g)).toHaveLength(1);
    expect(t).toContain(`- **hold**: a wait for the user's answer (defined in ${a}, ${b})`);
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: Two definitions of a term are both shown
  it('two definitions of a term are both shown, each beside the record that wrote it', () => {
    makeChange('orbit/changes/foo');
    const a = ledger('orbit/changes/foo', 1, { defines: [{ term: 'hold', definition: 'one way' }] });
    const acc = account('orbit/changes/foo', 2, { defines: [{ term: 'hold', definition: 'another way' }] });
    const t = section(change('foo'), 'New terms');
    expect(t).toContain(`- **hold**: one way (defined in ${a})`);
    expect(t).toContain(`- **hold**: another way (defined in ${acc})`);
  });

  it('terms come only from the latest record of each chain', () => {
    makeChange('orbit/changes/foo');
    const a = ledger('orbit/changes/foo', 1, { defines: [{ term: 'old', definition: 'gone' }] });
    ledger('orbit/changes/foo', 2, { replaces: a });
    expect(section(change('foo'), 'New terms')).toContain('No record of this work defines a new term.');
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: A program brief groups changes by stage
  it('a program brief groups changes by stage in the doc order, then the architecture trail, and leaves out a change citing no doc', () => {
    makeDoc();
    makeChange(ARCHIVED_X, { stage: 'b' });
    makeChange('orbit/changes/y', { stage: 'a' });
    makeChange('orbit/changes/z', { doc: null });
    json(`orbit/architecture/.orbit-runs/decisions/ledger-${T(9)}.json`, {
      command: 'ledger', timestamp: iso(T(9)), change: null, doc: 'prog', model: 'm', area: 'docs',
      decided: 'An architecture call.', alternatives: ['Another.'], why: 'Because.', relies_on: [{ kind: 'goal', doc: 'prog', id: 'G1' }],
    });
    json(`orbit/architecture/.orbit-runs/decisions/ledger-${T(10)}.json`, {
      command: 'ledger', timestamp: iso(T(10)), change: null, doc: 'other', model: 'm', area: 'docs',
      decided: 'Another doc call.', alternatives: ['Another.'], why: 'Because.', relies_on: [{ kind: 'goal', doc: 'other', id: 'G1' }],
    });
    const text = renderProgramBrief(buildProgramBrief(root, 'prog'));
    const order = ['## Stage `a` — the first stage', '### Change y', '## Stage `b` — the second stage', '### Change x', '## The architecture sessions', 'An architecture call.'];
    const at = order.map(o => text.indexOf(o));
    expect(at.every(i => i > -1)).toBe(true);
    expect([...at].sort((p, q) => p - q)).toEqual(at);
    expect(text).not.toContain('Change z');
    expect(text).not.toContain('Another doc call.');
  });

  it('an undeclared stage comes after the declared ones, and a change naming no stage comes last', () => {
    makeDoc();
    makeChange('orbit/changes/n', { stage: null });
    makeChange('orbit/changes/u', { stage: 'zz' });
    makeChange('orbit/changes/y', { stage: 'a' });
    const text = renderProgramBrief(buildProgramBrief(root, 'prog'));
    const at = ['### Change y', '## Stage `zz`', '### Change u', '## Changes that name no stage', '### Change n'].map(o => text.indexOf(o));
    expect(at.every(i => i > -1)).toBe(true);
    expect([...at].sort((p, q) => p - q)).toEqual(at);
  });

  it('a LEGACY doc groups its changes by the stage ids they cite, in the order of their earliest change', () => {
    makeDoc('# prog\n\nNo stages here.\n');
    makeChange('orbit/changes/late', { stage: 'q' });
    makeChange('orbit/changes/archive/2026-10-01-early', { stage: 'p' });
    const text = renderProgramBrief(buildProgramBrief(root, 'prog'));
    expect(text.indexOf('## Stage `p`')).toBeGreaterThan(-1);
    expect(text.indexOf('## Stage `p`')).toBeLessThan(text.indexOf('## Stage `q`'));
  });

  it('archived changes of the same day come in the order their archive records were written', () => {
    makeDoc();
    makeChange('orbit/changes/archive/2026-11-10-alpha', { stage: 'a' });
    archiveRecord('orbit/changes/archive/2026-11-10-alpha', 30, SYNCED);
    makeChange('orbit/changes/archive/2026-11-10-beta', { stage: 'a' });
    archiveRecord('orbit/changes/archive/2026-11-10-beta', 5, SYNCED);
    const text = renderProgramBrief(buildProgramBrief(root, 'prog'));
    expect(text.indexOf('### Change beta')).toBeGreaterThan(-1);
    expect(text.indexOf('### Change beta')).toBeLessThan(text.indexOf('### Change alpha'));
  });

  it("a program brief checks only its own doc's records on the shared architecture trail, and an unreadable one fails it", () => {
    makeDoc();
    json(`orbit/architecture/.orbit-runs/decisions/ledger-${T(1)}.json`, {
      command: 'ledger', timestamp: iso(T(1)), change: null, doc: 'other', model: 'm', area: 'nowhere',
      decided: 'Another doc.', alternatives: ['x'], why: 'y', relies_on: [],
    });
    expect(() => buildProgramBrief(root, 'prog')).not.toThrow();
    json(`orbit/architecture/.orbit-runs/decisions/ledger-${T(2)}.json`, {
      command: 'ledger', timestamp: iso(T(2)), change: null, doc: 'prog', model: 'm', area: 'nowhere',
      decided: 'This doc.', alternatives: ['x'], why: 'y', relies_on: [],
    });
    expect(() => buildProgramBrief(root, 'prog')).toThrow(/ledger-2026-11-01T10-00-02Z\.json is not a valid ledger record/);
    fs.rmSync(path.join(root, `orbit/architecture/.orbit-runs/decisions/ledger-${T(2)}.json`));
    write(`orbit/architecture/.orbit-runs/decisions/ledger-${T(3)}.json`, '{ not json');
    expect(() => buildProgramBrief(root, 'prog')).toThrow(/ledger-2026-11-01T10-00-03Z\.json cannot be read as a JSON object/);
  });

  it('within a stage, archived changes come first in the order archived, then active changes by name', () => {
    makeDoc();
    makeChange('orbit/changes/b-active', { stage: 'a' });
    makeChange('orbit/changes/a-active', { stage: 'a' });
    makeChange('orbit/changes/archive/2026-11-02-later', { stage: 'a' });
    makeChange('orbit/changes/archive/2026-11-01-earlier', { stage: 'a' });
    const text = renderProgramBrief(buildProgramBrief(root, 'prog'));
    const at = ['### Change earlier', '### Change later', '### Change a-active', '### Change b-active'].map(o => text.indexOf(o));
    expect([...at].sort((p, q) => p - q)).toEqual(at);
  });
});

// ---------------------------------------------------------------------------
// A brief says only what the archive recorded
// ---------------------------------------------------------------------------

describe('a brief says only what the archive recorded', () => {
  // @scenario behaviour orbit-program-brief :: A brief says only what the archive recorded :: An active change's brief lists its delta as proposed
  it("an active change's capabilities are what it proposes, with no word of a sync either way", () => {
    makeChange('orbit/changes/foo');
    const caps = section(change('foo'), 'Capabilities and requirements added or changed');
    expect(caps).toContain('No archive has recorded a sync of these yet: they are what the change proposes to add or change in the specs.');
    expect(caps).toMatch(/- `cap`\n {2}- Added:\n {4}- R\n/);
    expect(caps).not.toMatch(/synced into|not synced|recorded no sync|archived without/);
  });

  // @scenario behaviour orbit-program-brief :: A brief says only what the archive recorded :: The archive's own signals are promised, not omitted silently
  it("an active change's deviations promise the archive's warnings and accepted risks, and say where they appear", () => {
    makeChange('orbit/changes/foo');
    expect(section(change('foo'), 'Deviations from the charter')).toContain(
      "The archive records its warnings and accepted risks after this brief was rendered; they appear in the archived change's brief and the program brief."
    );
  });

  // @scenario behaviour orbit-program-brief :: A brief says only what the archive recorded :: An archive that skipped the sync says so
  it('an archive that skipped the sync says so, with its reason, and never shows the requirement as synced', () => {
    makeChange(ARCHIVED_X);
    archiveRecord(ARCHIVED_X, 1, { ran: false, skipped_reason: 'the user chose to skip it' });
    const caps = section(change('x'), 'Capabilities and requirements added or changed');
    expect(caps).toContain('The archive recorded no sync of these into the specs: the user chose to skip it');
    expect(caps).toContain('    - R');
    expect(caps).not.toContain('The archive synced');
  });

  it("an archive record's warnings and accepted risks are shown from the record", () => {
    makeChange(ARCHIVED_X);
    archiveRecord(ARCHIVED_X, 1, SYNCED, {
      warnings: ['A warning.'],
      judgements: [{ kind: 'readiness', accepted: [{ claim: 'A claim.', why: 'A reason.' }] }],
    });
    const d = section(change('x'), 'Deviations from the charter');
    expect(d).toContain('- A warning.');
    expect(d).toContain('- A claim. — A reason.');
  });

  // @scenario behaviour orbit-program-brief :: A brief says only what the archive recorded :: A change archived without an archive record says so
  it('a change archived without an archive record says so, and nothing says a sync is still to come', () => {
    const dir = 'orbit/changes/archive/2026-06-08-rename-followups';
    makeChange(dir, { doc: null });
    const text = change('rename-followups');
    const caps = section(text, 'Capabilities and requirements added or changed');
    expect(caps).toContain('This change was archived without an archive record, so whether these were synced into the specs is not recorded.');
    expect(caps).toContain('    - R');
    expect(section(text, 'Deviations from the charter')).toContain('No archive record holds warnings or accepted risks for this change.');
    expect(text).not.toMatch(/No archive has recorded a sync|after this brief|records written after it/);
  });

  // @scenario behaviour orbit-program-brief :: A brief says only what the archive recorded :: The copy and the archive's count agree when nothing is written after the save
  it("the saved copy lists the same unread records the archive's count counts when nothing is written after it", () => {
    makeChange('orbit/changes/foo');
    const a = ledger('orbit/changes/foo', 1);
    const b = ledger('orbit/changes/foo', 2);
    const brief = buildChangeBrief(root, 'foo');
    const saved = saveChangeBrief(root, brief, renderChangeBrief(brief));
    const copy = fs.readFileSync(path.join(root, saved.path), 'utf-8');
    // The archive emit's `decision_records_unread` is the selection's length (`selectUnreadRecords`).
    const unread = selectUnreadRecords(path.join(root, 'orbit/changes/foo'));
    expect(unread).toHaveLength(2);
    const listed = section(copy, 'Records no reader checked').split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2));
    expect(listed).toEqual([a, b]);
  });

  // @scenario behaviour orbit-program-brief :: A brief says only what the archive recorded :: A record written after the save is the archive's to count, and the copy says so
  it('a record written after the save is counted by the archive and not in the copy, which says where it appears', () => {
    makeChange('orbit/changes/foo');
    ledger('orbit/changes/foo', 1);
    ledger('orbit/changes/foo', 2);
    const brief = buildChangeBrief(root, 'foo');
    const saved = saveChangeBrief(root, brief, renderChangeBrief(brief));
    ledger('orbit/changes/foo', 3);
    expect(selectUnreadRecords(path.join(root, 'orbit/changes/foo'))).toHaveLength(3);
    const unreadSection = section(fs.readFileSync(path.join(root, saved.path), 'utf-8'), 'Records no reader checked');
    expect(unreadSection.split('\n').filter(l => l.startsWith('- '))).toHaveLength(2);
    expect(unreadSection).toContain(
      "This list is as of when this brief was rendered; records written after it appear in the archived change's brief and the program brief."
    );
  });

  // @scenario behaviour orbit-program-brief :: A brief says only what the archive recorded :: An archive record of an earlier shape is read as it states the sync
  it('an archive record of an earlier shape is read as it states the sync, and one stating none of them says so', () => {
    const caps = (dir: string): string => section(change(changeOf(dir)), 'Capabilities and requirements added or changed');
    const cases: [string, Record<string, unknown>, RegExp][] = [
      ['2026-07-17-a', { specs_synced: true }, /The archive synced these into the specs\./],
      ['2026-07-21-b', { sync: { synced: true } }, /The archive synced these into the specs\./],
      ['2026-07-06-c', { sync_specs: { capabilities_updated: ['cap'], added: 1 } }, /The archive synced these into the specs — 1 capability updated \(`cap`\); requirements: 1 added\./],
      ['2026-07-08-d', { specs_synced: false }, /The archive recorded no sync of these into the specs\./],
      ['2026-07-09-e', { sync_specs: { capabilities_updated: [] } }, /does not say, in a form orbit reads, whether these were synced/],
      ['2026-07-10-f', { archived_to: 'somewhere' }, /does not say, in a form orbit reads, whether these were synced/],
    ];
    for (const [d, body, expected] of cases) {
      const dir = `orbit/changes/archive/${d}`;
      makeChange(dir, { doc: null });
      json(`${dir}/.orbit-runs/archive-${T(1)}.json`, { command: 'archive', warnings: ['Warned.'], ...body });
      const c = caps(dir);
      expect(c, d).toMatch(expected);
      expect(c, d).toContain('    - R');
      expect(section(change(changeOf(dir)), 'Deviations from the charter'), d).toContain('- Warned.');
    }
    // The fourth state never reads as synced or not synced.
    expect(caps('orbit/changes/archive/2026-07-10-f')).not.toMatch(/The archive synced|recorded no sync|archived without/);
  });

  it('a delta spec stating no requirement operation, or a capability folder with no spec.md, fails the brief naming it', () => {
    makeChange('orbit/changes/foo', { specs: { cap: '## ADDED Requirement\n\n### Requirement: R\n\nThe system SHALL r.\n' } });
    expect(() => buildChangeBrief(root, 'foo')).toThrow(/delta spec orbit\/changes\/foo\/specs\/cap\/spec\.md states no requirement/);
    fs.rmSync(path.join(root, 'orbit/changes/foo/specs/cap'), { recursive: true });
    fs.mkdirSync(path.join(root, 'orbit/changes/foo/specs/empty'), { recursive: true });
    expect(() => buildChangeBrief(root, 'foo')).toThrow(/capability folder orbit\/changes\/foo\/specs\/empty has no spec\.md/);
  });

  it.skipIf(process.getuid?.() === 0)('a folder the brief reads that cannot be listed fails it, naming the folder, and an absent one reads as none', () => {
    makeChange('orbit/changes/foo');
    fs.rmSync(path.join(root, 'orbit/changes/foo/specs'), { recursive: true });
    expect(section(change('foo'), 'Capabilities and requirements added or changed')).toContain('This change has no delta specs');
    makeChange('orbit/changes/foo');
    const specs = path.join(root, 'orbit/changes/foo/specs');
    fs.chmodSync(specs, 0o000);
    try {
      expect(() => buildChangeBrief(root, 'foo')).toThrow(/delta specs folder orbit\/changes\/foo\/specs cannot be listed \(EACCES\)/);
    } finally {
      fs.chmodSync(specs, 0o755);
    }
    const decisions = path.join(root, 'orbit/changes/foo/.orbit-runs/decisions');
    fs.mkdirSync(decisions, { recursive: true });
    fs.chmodSync(decisions, 0o000);
    try {
      expect(() => buildChangeBrief(root, 'foo')).toThrow(/decision records folder .*decisions cannot be listed/);
    } finally {
      fs.chmodSync(decisions, 0o755);
    }
  });

  it("change metadata that cannot be parsed fails the brief naming it, in a change brief and a program brief", () => {
    makeDoc();
    makeChange('orbit/changes/foo');
    write('orbit/changes/foo/.openspec.yaml', 'schema: [unclosed\n');
    expect(() => buildChangeBrief(root, 'foo')).toThrow(/change metadata orbit\/changes\/foo\/\.openspec\.yaml cannot be read as YAML/);
    expect(() => buildProgramBrief(root, 'prog')).toThrow(/change metadata orbit\/changes\/foo\/\.openspec\.yaml cannot be read as YAML/);
  });
});

// ---------------------------------------------------------------------------
// The decision-records scenarios that name the brief
// ---------------------------------------------------------------------------

describe("orbit-decision-records: the brief as a reader", () => {
  // @scenario behaviour orbit-decision-records :: Decision records are written for a reader who knows only the architecture :: A stop's question reaches the user in the brief too
  it("a stop's about and question are shown as written", () => {
    makeChange('orbit/changes/foo');
    const about = 'Whether to show *this* — `as written`.';
    const question = 'Keep the weekly default, or turn it off?';
    stop('orbit/changes/foo', 1, { about, question });
    const s = section(change('foo'), 'Stops');
    expect(s).toContain(`- About: ${about}`);
    expect(s).toContain(`- Question: ${question}`);
  });

  // @scenario behaviour orbit-decision-records :: No reader takes the account yet :: The brief shows the account as checked by no reader
  it('a change holding only an account: no decision record is named unread, and the account is named apart', () => {
    makeChange('orbit/changes/foo');
    const a = account('orbit/changes/foo', 1);
    const u = section(change('foo'), 'Records no reader checked');
    expect(u).toContain('No decision record of this change is waiting for a reader.');
    expect(u).not.toContain('Decision records no reader has checked:');
    expect(u).toContain(`The account ${a} was checked by no reader: no reading step reads accounts yet.`);
  });
});

// ---------------------------------------------------------------------------
// The goldens (the stage's first exit criterion)
// ---------------------------------------------------------------------------

describe('golden renders', () => {
  it('one fixture program renders byte for byte', () => {
    makeDoc();
    makeChange(ARCHIVED_X, { stage: 'a', specs: { cap: ADD_R, other: '## MODIFIED Requirements\n\n### Requirement: M\n\nThe system SHALL m.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n' } });
    account(ARCHIVED_X, 1, { built: 'A weekly export of the user\'s data.', seams: 'None.', deviations: 'None.' });
    archiveRecord(ARCHIVED_X, 2, { ...SYNCED, capabilities_updated: ['cap', 'other'], modified: 1 });
    makeChange('orbit/changes/y', { stage: 'b', size: '\n## Size\n\n- tasks: the export needs every step\n' });
    account('orbit/changes/y', 3, { built: 'The export can be turned off.', seams: 'The first run asks whether to keep the weekly default.', deviations: 'None.' });
    golden('program.golden.md', renderProgramBrief(buildProgramBrief(root, 'prog')));
  });

  it('a program whose changes carry ledger entries and stops, open and answered, renders byte for byte', () => {
    makeDoc();
    makeChange(ARCHIVED_X, { stage: 'a' });
    account(ARCHIVED_X, 1, { built: 'Built x.', seams: 'Seams x.', deviations: 'None.', defines: [{ term: 'hold', definition: "a wait for the user's answer" }] });
    ledger(ARCHIVED_X, 2, { defines: [{ term: 'hold', definition: "a wait for the user's answer" }] });
    const sx = stop(ARCHIVED_X, 3);
    resolution(ARCHIVED_X, 4, sx);
    archiveRecord(ARCHIVED_X, 5, SYNCED, {
      warnings: ['A touchpoint was not predicted.'],
      judgements: [{ kind: 'readiness', accepted: [{ claim: 'An empty folder is left behind.', why: 'No reader lists it.' }] }],
    });
    makeChange('orbit/changes/y', { stage: 'b' });
    const sy = stop('orbit/changes/y', 6, { condition: 'security-unprecedented' });
    ledger('orbit/changes/y', 7, { area: 'who-can-get-in', relies_on: [], raised_stop: sy });
    ledger('orbit/changes/y', 8, { relies_on: [{ kind: 'requirement', capability: 'cap', title: 'R' }, { kind: 'decision', id: 'D-1' }, { kind: 'resolution', change: 'x', token: T(4) }] });
    json(`orbit/architecture/.orbit-runs/decisions/stop-${T(9)}.json`, {
      command: 'stop', timestamp: iso(T(9)), change: null, doc: 'prog', model: 'm', condition: 'ruling-amendment',
      about: 'Amending R-1.', question: 'Amend R-1 as proposed?',
    });
    golden('program-decisions.golden.md', renderProgramBrief(buildProgramBrief(root, 'prog')));
  });
});

// ---------------------------------------------------------------------------
// `orbit brief` renders a brief read-only
// ---------------------------------------------------------------------------

describe('`orbit brief` renders a brief read-only', () => {
  // @scenario behaviour orbit-program-brief :: `orbit brief` renders a brief read-only :: A change brief is printed and nothing is written
  it('prints the change brief and changes no file', async () => {
    makeChange('orbit/changes/foo');
    ledger('orbit/changes/foo', 1);
    const before = allFiles();
    const r = await runCLI(['brief', '--change', 'foo'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toBe(change('foo'));
    expect(allFiles()).toEqual(before);
  });

  // @scenario behaviour orbit-program-brief :: `orbit brief` renders a brief read-only :: JSON carries the text too
  it('--json is one object holding the sections and the same text as markdown', async () => {
    makeChange('orbit/changes/foo');
    ledger('orbit/changes/foo', 1);
    const plain = await runCLI(['brief', '--change', 'foo'], { cwd: root });
    const j = await runCLI(['brief', '--change', 'foo', '--json'], { cwd: root });
    expect(j.exitCode).toBe(0);
    const o = JSON.parse(j.stdout);
    expect(o.markdown).toBe(plain.stdout);
    expect(o.ledger).toHaveLength(1);
    expect(Object.keys(o)).toEqual(expect.arrayContaining(['built', 'capabilities', 'terms', 'seams', 'ledger', 'stops', 'tripwires', 'deviations', 'unread']));
  });

  it('a program brief prints too, and its --json carries its text', async () => {
    makeDoc();
    makeChange('orbit/changes/foo');
    const r = await runCLI(['brief', 'prog'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toBe(renderProgramBrief(buildProgramBrief(root, 'prog')));
    const j = JSON.parse((await runCLI(['brief', 'prog', '--json'], { cwd: root })).stdout);
    expect(j.markdown).toBe(r.stdout);
    expect(j.groups[0].changes[0].change).toBe('foo');
  });

  // @scenario behaviour orbit-program-brief :: `orbit brief` renders a brief read-only :: An archived change is found
  it('finds a change only in the archive, its archive record included', async () => {
    makeChange('orbit/changes/archive/2026-11-13-foo');
    archiveRecord('orbit/changes/archive/2026-11-13-foo', 1, SYNCED);
    const r = await runCLI(['brief', '--change', 'foo'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('- Change `foo`: archived, at orbit/changes/archive/2026-11-13-foo/');
    expect(r.stdout).toContain('The archive synced these into the specs');
  });

  it('an active change is found before an archive of the same name', () => {
    makeChange('orbit/changes/archive/2026-11-13-foo');
    makeChange('orbit/changes/foo');
    expect(buildChangeBrief(root, 'foo').status).toBe('active');
  });

  // @scenario behaviour orbit-program-brief :: `orbit brief` renders a brief read-only :: An unreadable record fails the brief
  it('a record that is not valid JSON fails the brief, naming it, with nothing on standard output', async () => {
    makeChange('orbit/changes/foo');
    write(`orbit/changes/foo/.orbit-runs/decisions/ledger-${T(1)}.json`, '{ not json');
    const r = await runCLI(['brief', '--change', 'foo'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain(`ledger-${T(1)}.json cannot be read as a JSON object`);
  });

  it('an account or a record the write gate would refuse, or a record that cannot be read, fails the brief', () => {
    makeChange('orbit/changes/foo');
    account('orbit/changes/foo', 1, { built: '' });
    expect(() => buildChangeBrief(root, 'foo')).toThrow(ProgramBriefError);
    expect(() => buildChangeBrief(root, 'foo')).toThrow(/account .*account-2026-11-01T10-00-01Z\.json is not a valid account/);
    fs.rmSync(path.join(root, 'orbit/changes/foo/.orbit-runs/account'), { recursive: true });
    ledger('orbit/changes/foo', 2, { area: 'nowhere' });
    expect(() => buildChangeBrief(root, 'foo')).toThrow(/ledger-2026-11-01T10-00-02Z\.json is not a valid ledger record/);
    write(`orbit/changes/foo/.orbit-runs/decisions/ledger-${T(2)}.json`, '{ not json');
    expect(() => buildChangeBrief(root, 'foo')).toThrow(/ledger-2026-11-01T10-00-02Z\.json cannot be read as a JSON object/);
  });

  // @scenario behaviour orbit-program-brief :: `orbit brief` renders a brief read-only :: A malformed doc fails the program brief
  it('a malformed doc fails the program brief naming `orbit architecture validate prog`', async () => {
    makeDoc(DOC.replace('### Stage b — the second stage', '### Stage B_bad the second stage'));
    const r = await runCLI(['brief', 'prog'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('orbit architecture validate prog');
    expect(() => buildProgramBrief(root, 'prog')).toThrow(/`orbit architecture validate prog`/);
  });

  // @scenario behaviour orbit-program-brief :: `orbit brief` renders a brief read-only :: Both units at once is a usage error
  it('both units at once, or neither, is a usage error with nothing on standard output', async () => {
    makeDoc();
    makeChange('orbit/changes/foo');
    const both = await runCLI(['brief', 'prog', '--change', 'foo'], { cwd: root });
    expect(both.exitCode).not.toBe(0);
    expect(both.stdout).toBe('');
    expect(both.stderr).toContain('name either a doc or a change, not both');
    const neither = await runCLI(['brief'], { cwd: root });
    expect(neither.exitCode).not.toBe(0);
    expect(neither.stdout).toBe('');
    expect(neither.stderr).toContain('name either a doc or a change');
  });

  it('a name that is not a single name, or that is not found, fails naming it', async () => {
    makeDoc();
    for (const args of [['--change', '../foo'], ['../prog'], ['--change', 'missing'], ['missing']]) {
      const r = await runCLI(['brief', ...args], { cwd: root });
      expect(r.exitCode, args.join(' ')).not.toBe(0);
      expect(r.stdout).toBe('');
    }
    expect(() => buildChangeBrief(root, 'archive')).toThrow(/change 'archive' not found/);
  });
});

// ---------------------------------------------------------------------------
// A change's brief is saved, never overwritten
// ---------------------------------------------------------------------------

describe("a change's brief is saved, never overwritten", () => {
  // @scenario behaviour orbit-program-brief :: A change's brief is saved, never overwritten :: A saved brief is the printed brief, with its hash
  it('--save writes the printed bytes and prints the path and the sha256 of the file', async () => {
    makeChange('orbit/changes/foo');
    ledger('orbit/changes/foo', 1);
    const printed = (await runCLI(['brief', '--change', 'foo'], { cwd: root })).stdout;
    const r = await runCLI(['brief', '--change', 'foo', '--save'], { cwd: root });
    expect(r.exitCode).toBe(0);
    const lines = r.stdout.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe('');
    expect(lines[0]).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/brief\/brief-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/);
    const bytes = fs.readFileSync(path.join(root, lines[0]));
    expect(bytes.toString('utf-8')).toBe(printed);
    const hex = createHash('sha256').update(bytes).digest('hex');
    expect(lines[1]).toBe(`sha256 ${hex}`);
    expect(createHash('sha256').update(printed).digest('hex')).toBe(hex);
  });

  it('--save --json carries the brief and saved {path, sha256}', async () => {
    makeChange('orbit/changes/foo');
    const r = await runCLI(['brief', '--change', 'foo', '--save', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    const o = JSON.parse(r.stdout);
    const bytes = fs.readFileSync(path.join(root, o.saved.path));
    expect(o.saved.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect(bytes.toString('utf-8')).toBe(o.markdown);
  });

  // @scenario behaviour orbit-program-brief :: A change's brief is saved, never overwritten :: A second save in the same second takes the next token
  it('a second save in the same second draws the next token, and both files stay', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    makeChange('orbit/changes/foo');
    const brief = buildChangeBrief(root, 'foo');
    const text = renderChangeBrief(brief);
    const one = saveChangeBrief(root, brief, text);
    const two = saveChangeBrief(root, brief, text);
    expect(path.basename(one.path)).toBe('brief-2026-11-13T10-00-00Z.md');
    expect(path.basename(two.path)).toBe('brief-2026-11-13T10-00-01Z.md');
    expect(fs.readdirSync(path.join(root, 'orbit/changes/foo/.orbit-runs/brief')).sort()).toEqual([
      'brief-2026-11-13T10-00-00Z.md',
      'brief-2026-11-13T10-00-01Z.md',
    ]);
  });

  // @scenario behaviour orbit-program-brief :: A change's brief is saved, never overwritten :: A racing writer is refused, not overwritten
  it('a writer that published the drawn name first is refused, naming the file, and its file is unchanged', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    makeChange('orbit/changes/foo');
    write('orbit/changes/foo/.orbit-runs/brief/brief-2026-11-13T10-00-00Z.md', 'the other writer\n');
    race.on = true;
    const brief = buildChangeBrief(root, 'foo');
    expect(() => saveChangeBrief(root, brief, renderChangeBrief(brief))).toThrow(/brief-2026-11-13T10-00-00Z\.md already exists/);
    race.on = false;
    expect(fs.readFileSync(path.join(root, 'orbit/changes/foo/.orbit-runs/brief/brief-2026-11-13T10-00-00Z.md'), 'utf-8')).toBe('the other writer\n');
    expect(fs.readdirSync(path.join(root, 'orbit/changes/foo/.orbit-runs/brief'))).toEqual(['brief-2026-11-13T10-00-00Z.md']);
  });

  // @scenario behaviour orbit-program-brief :: A change's brief is saved, never overwritten :: An archived change's brief is not saved
  it("refuses an archived change, saying orbit writes nothing to an archived change's history", async () => {
    makeChange('orbit/changes/archive/2026-11-13-foo');
    const before = allFiles();
    const r = await runCLI(['brief', '--change', 'foo', '--save'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain("orbit writes nothing to an archived change's history");
    expect(allFiles()).toEqual(before);
    const brief = buildChangeBrief(root, 'foo');
    expect(() => saveChangeBrief(root, brief, renderChangeBrief(brief))).toThrow(/orbit writes nothing to an archived change's history/);
    expect(allFiles()).toEqual(before);
  });

  // @scenario behaviour orbit-program-brief :: A change's brief is saved, never overwritten :: A brief that cannot be rendered saves nothing
  it('a brief that cannot be rendered writes nothing under brief/', async () => {
    makeChange('orbit/changes/foo');
    write(`orbit/changes/foo/.orbit-runs/decisions/ledger-${T(1)}.json`, '{ not json');
    const r = await runCLI(['brief', '--change', 'foo', '--save'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain(`ledger-${T(1)}.json`);
    expect(fs.existsSync(path.join(root, 'orbit/changes/foo/.orbit-runs/brief'))).toBe(false);
  });

  it('--save with a doc, or with nothing, is a usage error', async () => {
    makeDoc();
    const withDoc = await runCLI(['brief', 'prog', '--save'], { cwd: root });
    expect(withDoc.exitCode).not.toBe(0);
    expect(withDoc.stdout).toBe('');
    expect(withDoc.stderr).toContain('saving a program brief is not built yet');
    const bare = await runCLI(['brief', '--save'], { cwd: root });
    expect(bare.exitCode).not.toBe(0);
    expect(bare.stderr).toContain('--save takes --change');
  });

  // @scenario behaviour orbit-program-brief :: A change's brief is saved, never overwritten :: Today's readers do not see saved briefs
  it('status, the reviewed gates, the trail, orientation and the report render read the change as without the brief folder', () => {
    makeChange('orbit/changes/foo');
    composeAndWriteEmit('review', { change: 'foo' }, {
      mode: 'proposal', reviewer_class: 'in-context', depth: 'full', passes_run: ['1'], passes_skipped: [],
      scorecard: {
        completeness: { critical: 0, warning: 0, suggestion: 0 },
        correctness: { critical: 0, warning: 0, suggestion: 0 },
        coherence: { critical: 0, warning: 0, suggestion: 0 },
      },
      findings: [], stale_suppressed: [], model: 'm',
    }, { projectRoot: root });
    const snapshot = () => ({
      status: formatChangeStatus(loadChangeContext(root, 'foo')),
      trail: readTrail(path.join(root, 'orbit/changes/foo')),
      orientation: collectOrientation(root),
      report: renderReport(root, 'foo'),
    });
    const before = JSON.stringify(snapshot());
    const brief = buildChangeBrief(root, 'foo');
    saveChangeBrief(root, brief, renderChangeBrief(brief));
    saveChangeBrief(root, brief, renderChangeBrief(brief));
    expect(fs.readdirSync(path.join(root, 'orbit/changes/foo/.orbit-runs/brief'))).toHaveLength(2);
    expect(JSON.stringify(snapshot())).toBe(before);
  });
});
