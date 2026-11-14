/**
 * program-brief: the reader takes the account under `signoff: change` (`orbit-decision-records`' `The reader takes
 * the account only when sign-off is per change` and `The reading step's brief is rendered by orbit`;
 * `orbit-emit-composition`'s `The reading's selection is recorded at review and archive`; `orbit-review`'s `The
 * reading step checks decision records in system review`; `orbit-program-brief`'s `A brief tells the user what a
 * change or a program did, from the trail`). The rows with the setting absent are in `account.test.ts`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { selectUnreadRecords, buildDecisionBrief, renderDecisionBrief } from '../../src/core/decision-records.js';
import { buildChangeBrief, renderChangeBrief } from '../../src/core/program-brief.js';
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
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 5\narchitecture:\n  doc: prog\n  stage: s\n');
}

const setting = (value: string | null): void =>
  write('orbit/config.yaml', value === null ? 'schema: spec-driven\n' : `schema: spec-driven\nsignoff: ${value}\n`);

const CHANGE = () => path.join(root, 'orbit/changes/foo');
const selection = () => selectUnreadRecords(CHANGE(), root);

const account = (over: Record<string, unknown> = {}) =>
  path.basename(composeAndWriteEmit('account', { change: 'foo' }, {
    model: 'm',
    built: 'A weekly export of the user\'s data, which the user can turn off.',
    seams: 'The first run asks whether to keep the weekly default.',
    deviations: 'None.',
    ...over,
  }, { projectRoot: root }).path);

const ledger = () =>
  path.basename(composeAndWriteEmit('ledger', { change: 'foo' }, {
    model: 'm', area: 'defaults', decided: 'Weekly.', alternatives: ['daily'], why: 'Enough.',
    relies_on: [{ kind: 'goal', doc: 'prog', id: 'G1' }],
  }, { projectRoot: root }).path);

const clean = { critical: 0, warning: 0, suggestion: 0 };
const systemPass = (read: string[] | null, over: Record<string, unknown> = {}) =>
  composeAndWriteEmit('review', { change: 'foo' }, {
    mode: 'system', reviewer_class: 'in-context', depth: 'full',
    passes_run: read === null ? ['0', '1'] : ['0', '1', 'reading'], passes_skipped: [],
    ...(read === null ? {} : { decision_records_read: read }),
    scorecard: { completeness: clean, correctness: clean, coherence: clean }, findings: [], stale_suppressed: [], model: 'm',
    ...over,
  }, { projectRoot: root });

const archive = () => {
  fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
  fs.renameSync(CHANGE(), path.join(root, 'orbit/changes/archive/2026-11-13-foo'));
  return composeAndWriteEmit('archive', { change: 'foo' }, { final_assessment: 'archived', model: null }, { projectRoot: root });
};

const unreadSection = (md: string): string => md.slice(md.indexOf('Records no reader checked'));

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-account-reader-'));
  write('orbit/architecture/prog.md', '# prog\n\n## Goals\n\n- **G1 — the first goal.** text\n');
  makeChange('foo');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('orbit-decision-records: The reader takes the account only when sign-off is per change', () => {
  // @scenario behaviour orbit-decision-records :: The reader takes the account only when sign-off is per change :: Under `change`, the reading runs on an account alone
  // @scenario behaviour orbit-review :: The reading step checks decision records in system review :: An account alone is read under `change`
  it('under change, a change whose only record is its unread account selects it, and an in-context system pass owes it', () => {
    setting('change');
    const a = account();
    expect(selection()).toEqual([a]);
    expect(buildDecisionBrief(root, 'foo').selected).toEqual([a]);
    // Silent about the reading → refused: the account is owed.
    expect(() => systemPass(null)).toThrow(/owes a reading of 1 record\(s\) \(account-/);
    const pass = systemPass([a]);
    expect(pass.emit.decision_records_owed).toEqual([a]);
    expect(pass.emit.decision_records_read).toEqual([a]);
  });

  // @scenario behaviour orbit-decision-records :: The reader takes the account only when sign-off is per change :: Only the latest account is selected
  it('under change, only the latest account of the chain is selected', () => {
    setting('change');
    const a = account();
    const b = account({ built: 'Reworded.', replaces: a });
    expect(selection()).toEqual([b]);
  });

  // @scenario behaviour orbit-decision-records :: The reader takes the account only when sign-off is per change :: An unrecognized value reads the account as at the defaults
  it('an unrecognized value reads the account as at the defaults: nothing to read', async () => {
    setting('program');
    account();
    expect(selection()).toEqual([]);
    const r = await runCLI(['decisions', 'brief', 'foo'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/Nothing to read/);
    // With the setting off, a read list naming the account is outside the selection.
    const a = fs.readdirSync(path.join(CHANGE(), '.orbit-runs/account'))[0];
    expect(() => systemPass([a])).toThrow(/names account-.*which is not in the selection/);
  });

  it('a replacement after a reading listed the account is selected again, as for a decision record', () => {
    setting('change');
    const a = account();
    systemPass([a]);
    expect(selection()).toEqual([]);
    const b = account({ seams: 'None.', replaces: a });
    expect(selection()).toEqual([b]);
  });
});

describe("orbit-decision-records: The reading step's brief is rendered by orbit", () => {
  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: An account is selected under `change`
  it('under change, orbit decisions brief renders the account under its filename with its plain fields, then the task', async () => {
    setting('change');
    const a = account({ defines: [{ term: 'weekly default', definition: 'the export runs once a week unless turned off' }], detail: 'cron in src/x.ts' });
    const brief = buildDecisionBrief(root, 'foo');
    expect(brief.records).toHaveLength(1);
    expect(brief.records[0]).toMatchObject({ filename: a, record: 'account', cites: [] });
    const md = renderDecisionBrief(brief);
    const at = md.indexOf(`### ${a}`);
    expect(at).toBeGreaterThan(-1);
    const rec = md.slice(at, md.indexOf('## Your task'));
    expect(rec).toContain("- Kind: the change's account");
    expect(rec).toContain("- built: A weekly export of the user's data, which the user can turn off.");
    expect(rec).toContain('- seams: The first run asks whether to keep the weekly default.');
    expect(rec).toContain('- deviations: None.');
    expect(rec).toContain('  - weekly default: the export runs once a week unless turned off');
    expect(rec).toContain('- detail (not bound by the plain-language rule; may be technical): cron in src/x.ts');
    expect(rec).not.toContain('What it relies on');
    expect(md.indexOf('## Your task')).toBeGreaterThan(at);
    expect(md).not.toContain('.orbit-runs/');
    const j = await runCLI(['decisions', 'brief', 'foo', '--json'], { cwd: root });
    expect(j.exitCode).toBe(0);
    expect(JSON.parse(j.stdout).selected).toEqual([a]);
  });

  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: A change with no records renders nothing to read
  it('nothing to read when the selection holds no account: setting absent, or the latest account read', () => {
    setting(null);
    const a = account();
    expect(renderDecisionBrief(buildDecisionBrief(root, 'foo'))).toMatch(/Nothing to read/);
    setting('change');
    systemPass([a]);
    expect(renderDecisionBrief(buildDecisionBrief(root, 'foo'))).toMatch(/Nothing to read/);
  });

  it('under change, an unreadable latest account fails the brief naming it, never read as an empty selection', () => {
    setting('change');
    write('orbit/changes/foo/.orbit-runs/account/account-2026-11-13T10-00-00Z.json', '{ broken');
    expect(selection()).toEqual(['account-2026-11-13T10-00-00Z.json']);
    expect(() => buildDecisionBrief(root, 'foo')).toThrow(/account-2026-11-13T10-00-00Z\.json cannot be read/);
  });
});

describe('a folder the selection cannot list fails it, never reading as empty', () => {
  it.skipIf(process.getuid?.() === 0)('under change, an unlistable account folder fails the selection, the brief and the review gate, naming it', async () => {
    setting('change');
    account();
    const dir = path.join(CHANGE(), '.orbit-runs/account');
    fs.chmodSync(dir, 0o000);
    try {
      expect(() => selection()).toThrow(/\.orbit-runs\/account cannot be listed/);
      expect(() => buildDecisionBrief(root, 'foo')).toThrow(/\.orbit-runs\/account cannot be listed/);
      expect(() => systemPass(null)).toThrow(EmitError);
      expect(() => systemPass(null)).toThrow(/write gate: the folder .*\.orbit-runs\/account cannot be listed/);
      const r = await runCLI(['decisions', 'brief', 'foo'], { cwd: root });
      expect(r.exitCode).not.toBe(0);
      expect(r.stdout).toBe('');
      expect(r.stderr).toContain('.orbit-runs/account');
      // With the setting off the account folder is not read, so its state cannot fail the selection.
      setting(null);
      expect(selection()).toEqual([]);
    } finally {
      fs.chmodSync(dir, 0o755);
    }
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: Under `change`, an unlistable folder refuses the emit
  // @scenario behaviour orbit-decision-records :: The reading step's brief is rendered by orbit :: Under `change`, an unlistable folder fails the brief
  it.skipIf(process.getuid?.() === 0)('under change, an unlistable decisions folder fails the selection and the brief, and the archive count names it', () => {
    setting('change');
    ledger();
    const dir = path.join(CHANGE(), '.orbit-runs/decisions');
    fs.chmodSync(dir, 0o000);
    try {
      expect(() => selection()).toThrow(/\.orbit-runs\/decisions cannot be listed/);
      expect(() => buildDecisionBrief(root, 'foo')).toThrow(/\.orbit-runs\/decisions cannot be listed/);
      expect(() => buildChangeBrief(root, 'foo')).toThrow(/decisions/);
      expect(() => systemPass(null)).toThrow(/write gate: the folder .*decisions cannot be listed/);
    } finally {
      fs.chmodSync(dir, 0o755);
    }
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(CHANGE(), path.join(root, 'orbit/changes/archive/2026-11-13-foo'));
    const archived = path.join(root, 'orbit/changes/archive/2026-11-13-foo/.orbit-runs/decisions');
    fs.chmodSync(archived, 0o000);
    try {
      expect(() => composeAndWriteEmit('archive', { change: 'foo' }, { final_assessment: 'archived', model: null }, { projectRoot: root }))
        .toThrow(/write gate: the folder .*decisions cannot be listed/);
    } finally {
      fs.chmodSync(archived, 0o755);
    }
  });

  it.skipIf(process.getuid?.() === 0)('with the setting absent, an unlistable decisions folder reads as empty, as before the setting existed', () => {
    setting(null);
    ledger();
    const dir = path.join(CHANGE(), '.orbit-runs/decisions');
    fs.chmodSync(dir, 0o000);
    try {
      expect(selection()).toEqual([]);
      expect(buildDecisionBrief(root, 'foo').selected).toEqual([]);
      expect(systemPass(null).emit.decision_records_owed).toEqual([]);
    } finally {
      fs.chmodSync(dir, 0o755);
    }
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(CHANGE(), path.join(root, 'orbit/changes/archive/2026-11-13-foo'));
    const archived = path.join(root, 'orbit/changes/archive/2026-11-13-foo/.orbit-runs/decisions');
    fs.chmodSync(archived, 0o000);
    try {
      expect(composeAndWriteEmit('archive', { change: 'foo' }, { final_assessment: 'archived', model: null }, { projectRoot: root }).emit.decision_records_unread).toBe(0);
    } finally {
      fs.chmodSync(archived, 0o755);
    }
  });
});

describe("orbit-emit-composition: The reading's selection is recorded at review and archive", () => {
  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: Under `change`, an unread account is owed and counted
  it('under change, an archive with an unread account and an unread ledger entry counts 2; with the setting absent, 1', () => {
    setting('change');
    account();
    ledger();
    const work = path.join(root, '..', path.basename(root) + '-copy');
    fs.cpSync(root, work, { recursive: true });
    try {
      expect(archive().emit.decision_records_unread).toBe(2);
      const saved = root;
      root = work;
      setting(null);
      try {
        expect(archive().emit.decision_records_unread).toBe(1);
      } finally {
        root = saved;
      }
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  });

  // @scenario behaviour orbit-emit-composition :: The reading's selection is recorded at review and archive :: Under `change`, a read account leaves the selection
  it('under change, a pass listing the latest account in decision_records_read owes it, and the next selection does not hold it', () => {
    setting('change');
    const a = account();
    const l = ledger();
    const pass = systemPass([a]);
    expect(pass.emit.decision_records_owed).toEqual([l, a]);
    expect(selection()).toEqual([l]);
    // A second listing of the read account is outside the selection.
    expect(() => systemPass([a])).toThrow(EmitError);
  });

  it('a replaced account is not accepted in a read list: only the latest is in the selection', () => {
    setting('change');
    const a = account();
    account({ built: 'Reworded.', replaces: a });
    expect(() => systemPass([a])).toThrow(new RegExp(`names ${a.replace(/\./g, '\\.')}, which is not in the selection`));
  });
});

describe("orbit-program-brief: the brief's records-no-reader-checked section", () => {
  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: An account the reader takes is listed with the records
  it('under change, an unread account is listed among the selection, and not named apart', () => {
    setting('change');
    const a = account();
    const b = buildChangeBrief(root, 'foo');
    expect(b.unread).toEqual({ records: [a], account: null });
    const u = unreadSection(renderChangeBrief(b));
    expect(u).toContain("Records no reader has checked (decision records, and the change's account):");
    expect(u).toContain(`- ${a}`);
    expect(u).not.toContain('was checked by no reader');
  });

  // @scenario behaviour orbit-program-brief :: A brief tells the user what a change or a program did, from the trail :: An account a reader checked is not listed as unchecked
  it('under change, an account a reading listed is named neither among the records nor apart', () => {
    setting('change');
    const a = account();
    systemPass([a]);
    const b = buildChangeBrief(root, 'foo');
    expect(b.unread).toEqual({ records: [], account: null });
    const u = unreadSection(renderChangeBrief(b));
    expect(u).not.toContain(a);
    expect(u).toContain('No decision record of this change is waiting for a reader.');
  });

  it('with the setting absent, the account is named apart and not among the records', () => {
    setting(null);
    const a = account();
    const b = buildChangeBrief(root, 'foo');
    expect(b.unread).toEqual({ records: [], account: a });
  });
});
