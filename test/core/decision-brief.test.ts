/**
 * decision-reading, chunk 2: the selection and the brief (`orbit-decision-records`' `The reading step's
 * brief is rendered by orbit`), in process and through `orbit decisions brief`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit } from '../../src/core/emit-composition.js';
import {
  AREA_ROWS,
  CONDITION_WORDING,
  LEDGER_AREAS,
  READER_ROWS,
  buildDecisionBrief,
  renderDecisionBrief,
  selectUnreadRecords,
  DecisionBriefError,
} from '../../src/core/decision-records.js';
import { runCLI } from '../helpers/run-cli.js';

const REPO = path.resolve(__dirname, '..', '..');
let root: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

const SENTINEL = {
  proposal: 'PROPOSAL-SENTINEL-why-text',
  design: 'DESIGN-SENTINEL-decision-text',
  tasks: 'TASKS-SENTINEL-task-text',
  doc: 'PROG-DOC-SENTINEL premise text',
  req: 'The system SHALL REQ-T-SENTINEL do t.',
  scenario: 'SCENARIO-SENTINEL-after-first-scenario',
};

function makeChange(name: string, doc: string | null = 'prog'): void {
  write(`orbit/changes/${name}/proposal.md`, `# Proposal\n\n## Why\n${SENTINEL.proposal}\n`);
  write(`orbit/changes/${name}/design.md`, `# Design\n\n${SENTINEL.design}\n`);
  write(`orbit/changes/${name}/tasks.md`, `# Tasks\n\n- [ ] 1.1 ${SENTINEL.tasks}\n`);
  write(
    `orbit/changes/${name}/.openspec.yaml`,
    `schema: spec-driven\nschema_version: 5\n${doc ? `architecture:\n  doc: ${doc}\n  stage: s\n` : ''}`
  );
}

const PROG_DOC = `# prog\n\n## Premise\n\n${SENTINEL.doc}\n\n## Goals\n\n- **G1 — the first goal.** text\n\n## Rulings index\n\n- **R-p-1** (Sal) — a ruling\n`;
const CAP_SPEC = `# cap\n\n## Purpose\n\np\n\n## Requirements\n\n### Requirement: T\n\n${SENTINEL.req}\n\n\`\`\`\n#### Scenario: fenced, not a scenario\n\`\`\`\n\n#### Scenario: s\n\n- **WHEN** ${SENTINEL.scenario}\n- **THEN** t\n\n### Requirement: U\n\nThe system SHALL u.\n`;

const ledgerPayload = (over: Record<string, unknown> = {}) => ({
  model: 'test-model',
  area: 'defaults',
  decided: 'LEDGER-DECIDED the export runs weekly.',
  alternatives: ['daily'],
  why: 'LEDGER-WHY weekly is enough.',
  relies_on: [{ kind: 'requirement', capability: 'cap', title: 'T' }],
  ...over,
});

const emit = (command: string, payload: Record<string, unknown>, change = 'foo') =>
  path.basename(composeAndWriteEmit(command, { change }, payload, { projectRoot: root }).path);

/** A hand-written review emit on the change's trail (the reading's read list is its only field read here). */
function reviewEmit(change: string, ts: string, over: Record<string, unknown>): void {
  write(
    `orbit/changes/${change}/.orbit-runs/review-system-${ts}.json`,
    JSON.stringify({ command: 'review', mode: 'system', reviewer_class: 'in-context', change, ...over })
  );
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-brief-'));
  write('orbit/architecture/prog.md', PROG_DOC);
  write('orbit/specs/cap/spec.md', CAP_SPEC);
  makeChange('foo');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("orbit-decision-records: The reading step's brief is rendered by orbit", () => {
  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: The brief carries only the doc and the records' content
  it("carries the doc, the record, the requirement to its first scenario, the area row and the task — and nothing of the work", () => {
    const a = emit('ledger', ledgerPayload());
    const out = renderDecisionBrief(buildDecisionBrief(root, 'foo'));
    expect(out).toContain(SENTINEL.doc);
    expect(out).toContain(`### ${a}`);
    expect(out).toContain('LEDGER-DECIDED the export runs weekly.');
    expect(out).toContain('LEDGER-WHY weekly is enough.');
    expect(out).toContain(SENTINEL.req);
    // To its first scenario: the fenced line is quoted, the real scenario is not.
    expect(out).toContain('#### Scenario: fenced, not a scenario');
    expect(out).not.toContain(SENTINEL.scenario);
    expect(out).toContain(`\`defaults\` — ${AREA_ROWS.defaults.area}: ${AREA_ROWS.defaults.covers}`);
    expect(out).toContain('2026-'); // when it was written
    expect(out).toContain('in change foo');
    for (const row of READER_ROWS) expect(out).toContain(row);
    expect(out).toMatch(/WARNING[\s\S]*SUGGESTION/);
    expect(out).toContain("baseline spec");
    expect(out.indexOf('## Your task')).toBeGreaterThan(out.indexOf(`### ${a}`));
    // No knowledge of the work beyond the doc and the records, and no trail path of its own.
    for (const s of [SENTINEL.proposal, SENTINEL.design, SENTINEL.tasks]) expect(out).not.toContain(s);
    expect(out).not.toContain('.orbit-runs');
    expect(out).not.toMatch(/review-(system|proposal)-|address-reviews-/);
  });

  it('renders a stop with its condition wording, a resolution with its named stop, a resolution citation and a decision citation', () => {
    write('orbit/changes/foo/explore.md', '# Explore\n\n## Decisions\n\n- **2026-11-08 — D-foo-1: the rule** DECISION-SENTINEL text\n  Kind: rule\n\n## Open questions\n');
    const s = emit('stop', { model: null, condition: 'user-facing-uncovered', about: 'STOP-ABOUT', question: 'STOP-QUESTION?' });
    const r = emit('resolution', { model: null, stop: s, answer: 'RES-ANSWER', effect: 'RES-EFFECT' });
    const token = r.replace(/^resolution-/, '').replace(/\.json$/, '');
    emit('ledger', ledgerPayload({ relies_on: [{ kind: 'resolution', change: 'foo', token }, { kind: 'decision', id: 'D-foo-1' }, { kind: 'ruling', doc: 'prog', id: 'R-p-1' }] }));
    const out = renderDecisionBrief(buildDecisionBrief(root, 'foo'));
    expect(out).toContain(`\`user-facing-uncovered\` — ${CONDITION_WORDING['user-facing-uncovered']}`);
    expect(out).toContain(`It names the stop ${s}:`);
    expect(out).toMatch(/about: STOP-ABOUT[\s\S]*question: STOP-QUESTION\?/);
    expect(out).toMatch(/answer: RES-ANSWER[\s\S]*effect: RES-EFFECT/);
    expect(out).toContain('DECISION-SENTINEL text');
    expect(out).toContain('Ruling R-p-1 of `prog`: in the architecture doc above.');
  });

  it("shows a named stop's latest wording when the stop was replaced", () => {
    const s = emit('stop', { model: null, condition: 'user-facing-uncovered', about: 'OLD-ABOUT', question: 'OLD-Q?' });
    const l = emit('ledger', ledgerPayload({ relies_on: [], raised_stop: s, area: 'user-sees-or-does' }));
    const t = emit('stop', { model: null, condition: 'user-facing-uncovered', about: 'NEW-ABOUT', question: 'NEW-Q?', replaces: s });
    // Only the ledger entry is selected for this check; the stops are read already.
    reviewEmit('foo', '2026-01-01T00-00-00Z', { decision_records_read: [t] });
    const brief = buildDecisionBrief(root, 'foo');
    expect(brief.selected).toEqual([l]);
    expect(brief.records[0].named_stop).toEqual({ record: s, current: t, about: 'NEW-ABOUT', question: 'NEW-Q?' });
    const out = renderDecisionBrief(brief);
    expect(out).toContain(`It names the stop ${s}, since reworded as ${t}:`);
    expect(out).toContain('- about: NEW-ABOUT');
    expect(out).not.toContain('OLD-ABOUT');
  });

  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: Only records no reading listed are selected
  it('selects only the records no in-context system review emit lists as read', () => {
    const a = emit('ledger', ledgerPayload());
    const b = emit('ledger', ledgerPayload({ decided: 'B decided.' }));
    reviewEmit('foo', '2026-01-01T00-00-00Z', { decision_records_read: [a] });
    // A fresh pass and a proposal pass listing B do not count as a reading.
    reviewEmit('foo', '2026-01-01T00-00-01Z', { reviewer_class: 'fresh', decision_records_read: [b] });
    write('orbit/changes/foo/.orbit-runs/review-proposal-2026-01-01T00-00-02Z.json', JSON.stringify({ command: 'review', mode: 'proposal', reviewer_class: 'in-context', decision_records_read: [b] }));
    expect(selectUnreadRecords(path.join(root, 'orbit/changes/foo'))).toEqual([b]);
    const out = renderDecisionBrief(buildDecisionBrief(root, 'foo'));
    expect(out).toContain(`### ${b}`);
    expect(out).not.toContain(`### ${a}`);
  });

  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: A replaced record is not rendered
  it('renders the latest in a chain, never the record it replaces', () => {
    const a = emit('ledger', ledgerPayload());
    const c = emit('ledger', ledgerPayload({ replaces: a, decided: 'C reworded.' }));
    const brief = buildDecisionBrief(root, 'foo');
    expect(brief.selected).toEqual([c]);
    const out = renderDecisionBrief(brief);
    expect(out).toContain(`### ${c}`);
    expect(out).not.toContain(`### ${a}`);
    // A replacement is new, so a record read before it was replaced is read again through it.
    reviewEmit('foo', '2026-01-01T00-00-00Z', { decision_records_read: [a] });
    expect(selectUnreadRecords(path.join(root, 'orbit/changes/foo'))).toEqual([c]);
  });

  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: A cited path is quoted whole
  it("quotes a cited requirement's .orbit-runs paths whole, and names no other", () => {
    fs.mkdirSync(path.join(root, 'orbit/specs/orbit-decision-records'), { recursive: true });
    fs.copyFileSync(path.join(REPO, 'orbit/specs/orbit-decision-records/spec.md'), path.join(root, 'orbit/specs/orbit-decision-records/spec.md'));
    emit('ledger', ledgerPayload({ relies_on: [{ kind: 'requirement', capability: 'orbit-decision-records', title: 'Where decision records are kept' }] }));
    const brief = buildDecisionBrief(root, 'foo');
    const quoted = brief.records[0].cites[0];
    expect(quoted.kind).toBe('requirement');
    const text = (quoted as { text: string }).text;
    expect(text).toContain('.orbit-runs/');
    const out = renderDecisionBrief(brief);
    expect(out).toContain(text);
    expect(out.split(text).join('')).not.toContain('.orbit-runs');
  });

  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: A missing source fails the brief
  it('exits non-zero naming the citation, with nothing on stdout, when a cited requirement is gone', async () => {
    emit('ledger', ledgerPayload());
    write('orbit/specs/cap/spec.md', '# cap\n\n## Requirements\n\n### Requirement: U\n\nThe system SHALL u.\n');
    expect(() => buildDecisionBrief(root, 'foo')).toThrow(DecisionBriefError);
    const r = await runCLI(['decisions', 'brief', 'foo'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/relies_on\[0\].*"title":"T"/);
    // A missing architecture doc fails the same way.
    write('orbit/specs/cap/spec.md', CAP_SPEC);
    fs.rmSync(path.join(root, 'orbit/architecture/prog.md'));
    expect(() => buildDecisionBrief(root, 'foo')).toThrow(/architecture doc 'prog'/);
    const r2 = await runCLI(['decisions', 'brief', 'foo'], { cwd: root });
    expect(r2.exitCode).not.toBe(0);
    expect(r2.stdout).toBe('');
    expect(r2.stderr).toMatch(/prog/);
  });

  it('exits non-zero naming an unreadable selected record', async () => {
    write('orbit/changes/foo/.orbit-runs/decisions/ledger-2026-01-01T00-00-00Z.json', '{ not json');
    expect(() => buildDecisionBrief(root, 'foo')).toThrow(/ledger-2026-01-01T00-00-00Z\.json/);
    const r = await runCLI(['decisions', 'brief', 'foo'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('ledger-2026-01-01T00-00-00Z.json');
  });

  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: A change with no records renders nothing to read
  it('says there is nothing to read and exits zero when the folder is absent or empty', async () => {
    const r = await runCLI(['decisions', 'brief', 'foo'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/Nothing to read/);
    fs.mkdirSync(path.join(root, 'orbit/changes/foo/.orbit-runs/decisions'), { recursive: true });
    const r2 = await runCLI(['decisions', 'brief', 'foo', '--json'], { cwd: root });
    expect(r2.exitCode).toBe(0);
    expect(JSON.parse(r2.stdout).selected).toEqual([]);
  });

  it('says the reader knows no architecture doc when the change cites none; --json carries the same content', async () => {
    makeChange('bar', null);
    emit('ledger', ledgerPayload(), 'bar');
    const out = renderDecisionBrief(buildDecisionBrief(root, 'bar'));
    expect(out).toMatch(/cites no architecture doc, so you know none/);
    const r = await runCLI(['decisions', 'brief', 'bar', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.docs).toEqual([]);
    expect(j.records[0].fields.decided).toBe('LEDGER-DECIDED the export runs weekly.');
    expect(j.task.rows).toEqual([...READER_ROWS]);
    // One run carries both the text the reader is given and the filenames recorded as read.
    const text = await runCLI(['decisions', 'brief', 'bar'], { cwd: root });
    expect(j.markdown).toBe(text.stdout);
    expect(j.markdown).toContain(`### ${j.selected[0]}`);
  });
});

describe('orbit-decision-records: The plain-language rule is held by structure and by a reader (the fourth row)', () => {
  // @scenario behaviour orbit-decision-records :: The plain-language rule is held by structure and by a reader :: A shifted restatement is a reader's finding
  it("the write gate accepts an entry whose restatement drops a qualifier, and the brief gives the reader the fourth row and the cited text", () => {
    write('orbit/architecture/prog.md', PROG_DOC.replace('- **R-p-1** (Sal) — a ruling', '- **R-p-1** (Sal) — a run stops at an outward or irreversible act the config has not granted'));
    const a = emit('ledger', ledgerPayload({ decided: 'The run stops at an outward act.', relies_on: [{ kind: 'ruling', doc: 'prog', id: 'R-p-1' }] }));
    const out = renderDecisionBrief(buildDecisionBrief(root, 'foo'));
    expect(out).toContain(`### ${a}`);
    expect(out).toContain('an outward or irreversible act the config has not granted');
    expect(out).toContain(`4. ${READER_ROWS[3]}`);
  });
});

describe('the brief constants match the baseline tables they render', () => {
  const spec = fs.readFileSync(path.join(REPO, 'orbit/specs/orbit-decision-records/spec.md'), 'utf-8');

  it("AREA_ROWS is `The ledger's eighteen areas` row for row", () => {
    for (const id of LEDGER_AREAS) {
      const row = AREA_ROWS[id];
      expect(spec).toContain(`| \`${id}\` | ${row.area} | ${row.covers} |`);
    }
  });

  it("CONDITION_WORDING is `Three decision records, one job each`'s event table", () => {
    for (const [id, wording] of Object.entries(CONDITION_WORDING)) {
      expect(spec).toContain(`| condition \`${id}\`: ${wording} |`);
    }
  });
});
