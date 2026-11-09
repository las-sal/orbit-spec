/**
 * decision-reading, chunk 3: the reading's selection on the review and archive emits
 * (`orbit-emit-composition`'s `The reading's selection is recorded at review and archive`).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { selectUnreadRecords } from '../../src/core/decision-records.js';
import { loadChangeContext, formatChangeStatus } from '../../src/core/artifact-graph/instruction-loader.js';
import { renderReport } from '../../src/core/report-render.js';
import { collectOrientation } from '../../src/core/orientation.js';

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
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 3\n');
}

const RUNS = (c: string) => `orbit/changes/${c}/.orbit-runs`;

const ledgerPayload = (over: Record<string, unknown> = {}) => ({
  model: 'test-model',
  area: 'defaults',
  decided: 'The export runs weekly.',
  alternatives: ['daily'],
  why: 'Weekly is enough.',
  relies_on: [{ kind: 'goal', doc: 'prog', id: 'G1' }],
  ...over,
});

const clean = { critical: 0, warning: 0, suggestion: 0 };
const systemPayload = (over: Record<string, unknown> = {}) => ({
  mode: 'system',
  reviewer_class: 'in-context',
  depth: 'full',
  passes_run: ['0', '1', '2', '3', '6'],
  passes_skipped: ['4: no perspectives', '5: no critical paths'],
  scorecard: { completeness: clean, correctness: clean, coherence: clean },
  findings: [],
  stale_suppressed: [],
  model: 'test-model',
  ...over,
});

const emit = (command: string, payload: Record<string, unknown>, change = 'foo') =>
  composeAndWriteEmit(command, { change }, payload, { projectRoot: root });
const record = (payload: Record<string, unknown> = ledgerPayload()) => path.basename(emit('ledger', payload).path);
const reading = (read: string[], over: Record<string, unknown> = {}) =>
  systemPayload({ passes_run: ['0', '1', '2', '3', '6', 'reading'], decision_records_read: read, ...over });

function ls(rel: string): string[] {
  const dir = path.join(root, rel);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

function expectRefused(fn: () => unknown, pattern: RegExp, folder = RUNS('foo')): void {
  const before = ls(folder);
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught, 'expected a refusal').toBeInstanceOf(EmitError);
  expect((caught as Error).message).toMatch(pattern);
  expect(ls(folder)).toEqual(before);
}

const selection = (c = 'foo') => selectUnreadRecords(path.join(root, 'orbit/changes', c));

function archive(change = 'foo'): Record<string, unknown> {
  const dest = `orbit/changes/archive/2026-11-09-${change}`;
  fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
  fs.renameSync(path.join(root, 'orbit/changes', change), path.join(root, dest));
  return composeAndWriteEmit('archive', { change }, { final_assessment: 'archived', model: null }, { projectRoot: root }).emit;
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-reading-emits-'));
  write('orbit/architecture/prog.md', '# prog\n\n## Goals\n\n- **G1 — the first goal.** text\n');
  makeChange('foo');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("orbit-emit-composition: The reading's selection is recorded at review and archive", () => {
  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: An in-context system emit records what it owed and read
  it('records the owed list and the read list; the next selection is empty', () => {
    const a = record();
    const r = emit('review', reading([a]));
    expect(r.emit.decision_records_owed).toEqual([a]);
    expect(r.emit.decision_records_read).toEqual([a]);
    expect(selection()).toEqual([]);
  });

  it('a reading finding, its file the record and its pass "reading", is written beside the read list', () => {
    const a = record();
    const r = emit(
      'review',
      reading([a], {
        scorecard: { completeness: clean, correctness: clean, coherence: { critical: 0, warning: 1, suggestion: 0 } },
        findings: [
          {
            severity: 'WARNING',
            dimension: 'coherence',
            pass: 'reading',
            title: `${a} — row 4: the restatement narrows R-p-1`,
            file: `${RUNS('foo')}/decisions/${a}`,
            line: 1,
            recommendation: 'Write a replacement whose decided states the ruling as it is written.',
          },
        ],
      })
    );
    expect((r.emit.findings as Array<{ pass: string }>)[0].pass).toBe('reading');
    expect(renderReport(root, 'foo')).toContain('row 4: the restatement narrows R-p-1');
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: A pass that owed a reading and is silent about it is refused
  it('refuses a pass that owed records and lists reading in neither list', () => {
    record();
    expectRefused(() => emit('review', systemPayload()), /'reading' in neither passes_run nor passes_skipped/);
  });

  it('refuses a read list without the reading, and the reading without a read list', () => {
    const a = record();
    expectRefused(() => emit('review', systemPayload({ passes_skipped: ['reading'], decision_records_read: [a] })), /'reading' is not in passes_run/);
    expectRefused(() => emit('review', reading([])), /'decision_records_read' is absent or empty/);
    const { decision_records_read: _r, ...noList } = reading([a]);
    expectRefused(() => emit('review', noList), /'decision_records_read' is absent or empty/);
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: A skipped reading leaves its records selected
  it('a skipped reading leaves its records owed at the next pass and counted at archive', () => {
    const a = record();
    const r1 = emit('review', systemPayload({ passes_skipped: ['4: no perspectives', 'reading: no subagent could be dispatched'] }));
    expect(r1.emit.decision_records_owed).toEqual([a]);
    expect('decision_records_read' in r1.emit).toBe(false);
    expect(selection()).toEqual([a]);
    const unread = archive();
    expect(unread.decision_records_unread).toBe(1);
  });

  it('the next in-context pass owes the skipped records again', () => {
    const a = record();
    emit('review', systemPayload({ passes_skipped: ['reading'] }));
    const r2 = emit('review', reading([a]));
    expect(r2.emit.decision_records_owed).toEqual([a]);
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: A record written during the pass stays selected
  it('a record written after the brief is owed, not read, and stays selected', () => {
    const a = record();
    const b = record(ledgerPayload({ decided: 'Written during the pass.' }));
    const r = emit('review', reading([a]));
    expect(r.emit.decision_records_owed).toEqual([a, b]);
    expect(selection()).toEqual([b]);
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: A read list outside the selection is refused
  it('refuses a read list naming a record an earlier reading already listed', () => {
    const a = record();
    emit('review', reading([a]));
    const b = record(ledgerPayload({ decided: 'B.' }));
    expectRefused(() => emit('review', reading([a, b])), new RegExp(`names ${a.replace(/\./g, '\\.')}, which is not in the selection`));
    // A replaced record is outside the selection too.
    const c = record(ledgerPayload({ decided: 'C.', replaces: b }));
    expectRefused(() => emit('review', reading([b])), /which is not in the selection/);
    expect(emit('review', reading([c])).emit.decision_records_owed).toEqual([c]);
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: Nothing owed, nothing required
  it('writes an empty owed list and needs no mention of reading when every record was read', () => {
    const a = record();
    emit('review', reading([a]));
    const r = emit('review', systemPayload());
    expect(r.emit.decision_records_owed).toEqual([]);
    // And with no records at all.
    makeChange('bar');
    expect(emit('review', systemPayload(), 'bar').emit.decision_records_owed).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: Archive counts what no reading saw
  it('archive counts the unread records, and its readout fields are unchanged', () => {
    record();
    record(ledgerPayload({ decided: 'Second.' }));
    // Same trail shape without the records, for the readout comparison.
    makeChange('baz');
    const without = archive('baz');
    const withRecords = archive('foo');
    expect(withRecords.decision_records_unread).toBe(2);
    expect(without.decision_records_unread).toBe(0);
    expect(withRecords.next_recommended).toBe(String(without.next_recommended).replace(/baz/g, 'foo'));
    expect(withRecords.final_assessment).toBe(without.final_assessment);
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: The fields are engine-owned
  it('refuses a payload supplying either computed field, and a read list anywhere but an in-context system pass', () => {
    record();
    write('orbit/changes/archive/2026-11-09-done/proposal.md', 'p');
    expectRefused(
      () => composeAndWriteEmit('archive', { change: 'done' }, { final_assessment: 'x', model: null, decision_records_unread: 0 }, { projectRoot: root }),
      /'decision_records_unread' is engine-owned/,
      'orbit/changes/archive/2026-11-09-done/.orbit-runs'
    );
    expectRefused(() => emit('review', reading([], { decision_records_owed: [] })), /'decision_records_owed' is engine-owned/);
    for (const over of [{ reviewer_class: 'fresh', direction: { disposition: 'forward', reasoning: 'r' } }, { mode: 'proposal' }]) {
      expectRefused(() => emit('review', systemPayload({ ...over, decision_records_read: [] })), /'decision_records_read' is admitted only on an in-context system review/);
    }
    expectRefused(() => emit('apply', { model: null, consent: 'user-invoked', decision_records_read: [] }), /unknown payload key 'decision_records_read'/);
    expectRefused(() => emit('review', reading(['not-a-record.json'])), /must be an array of decision-record filenames/);
  });

  it("orbit status, orientation and the report render are byte-unchanged by the three fields", () => {
    const a = record();
    emit('review', reading([a]));
    const snapshot = () =>
      JSON.stringify({
        status: formatChangeStatus(loadChangeContext(root, 'foo')),
        orientation: collectOrientation(root),
        report: renderReport(root, 'foo'),
      });
    const withFields = snapshot();
    const file = ls(RUNS('foo')).find(f => f.startsWith('review-system-')) as string;
    const p = path.join(root, RUNS('foo'), file);
    const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
    delete j.decision_records_owed;
    delete j.decision_records_read;
    j.passes_run = j.passes_run.filter((x: string) => x !== 'reading');
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
    expect(snapshot()).toBe(withFields);
  });
});

describe("orbit-review: The reading step checks decision records in system review (emit side)", () => {
  // @scenario behaviour orbit-review :: The reading step checks decision records in system review :: A fresh pass does not read
  it('a fresh system pass on a change with selected records carries neither field', () => {
    record();
    const r = emit('review', systemPayload({ reviewer_class: 'fresh', direction: { disposition: 'forward', reasoning: 'r' } }));
    expect('decision_records_owed' in r.emit).toBe(false);
    expect('decision_records_read' in r.emit).toBe(false);
  });

  // @scenario behaviour orbit-review :: The reading step checks decision records in system review :: No records, no reading
  it('a change with no decisions/ folder writes its in-context system emit without reading', () => {
    expect(fs.existsSync(path.join(root, RUNS('foo'), 'decisions'))).toBe(false);
    const r = emit('review', systemPayload());
    expect(r.emit.passes_run).not.toContain('reading');
    expect(r.emit.decision_records_owed).toEqual([]);
  });
});
