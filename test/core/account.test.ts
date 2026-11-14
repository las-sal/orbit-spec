/**
 * program-brief (change-account): a change's ACCOUNT — the write gate (`orbit-emit-composition`'s `The write
 * gate checks the account`) and that, with the sign-off setting absent, no reader takes it
 * (`orbit-decision-records`' `The reader takes the account only when sign-off is per change`; the `change` value's
 * rows are in `account-reader.test.ts`).
 *
 * The same-token race is simulated as `decision-records-race.test.ts` does: `node:fs`'s `readdirSync` is
 * wrapped to return an empty listing for an `account` folder while `race.on` is set.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const race = vi.hoisted(() => ({ on: false }));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const readdirSync = ((p: fs.PathLike, ...rest: unknown[]) =>
    race.on && String(p).endsWith(`${path.sep}account`) ? [] : (actual.readdirSync as any)(p, ...rest)) as typeof actual.readdirSync;
  return { ...actual, readdirSync, default: { ...actual, readdirSync } };
});

const { composeAndWriteEmit, EmitError } = await import('../../src/core/emit-composition.js');
const { selectUnreadRecords } = await import('../../src/core/decision-records.js');
const { loadChangeContext, formatChangeStatus } = await import('../../src/core/artifact-graph/instruction-loader.js');
const { readTrail } = await import('../../src/core/artifact-graph/trail.js');
const { renderReport } = await import('../../src/core/report-render.js');
const { collectOrientation } = await import('../../src/core/orientation.js');
const { runCLI } = await import('../helpers/run-cli.js');

let root: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function makeChange(name: string, tasks = '- [ ] 1.1 do a thing\n'): void {
  write(`orbit/changes/${name}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(`orbit/changes/${name}/design.md`, '# Design\n');
  write(`orbit/changes/${name}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(`orbit/changes/${name}/tasks.md`, `# Tasks\n\n## 1. Group\n\n${tasks}`);
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 5\n');
}

function ls(rel: string): string[] {
  const dir = path.join(root, rel);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

/** Every file under the project, for the "no file is written anywhere" checks. */
function allFiles(dir = root): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !e.isSymbolicLink()) out.push(...allFiles(p));
    else out.push(path.relative(root, p));
  }
  return out.sort();
}

const ACC = (change: string) => `orbit/changes/${change}/.orbit-runs/account`;

const accountPayload = (over: Record<string, unknown> = {}) => ({
  model: 'test-model',
  built: 'A weekly export of the user\'s data, which the user can turn off.',
  seams: 'None.',
  deviations: 'None.',
  ...over,
});

const emit = (target: { change?: string; doc?: string }, payload: Record<string, unknown>) =>
  composeAndWriteEmit('account', target, payload, { projectRoot: root });

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
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-account-'));
  write('orbit/architecture/prog.md', '# prog\n\n## Goals\n\n- **G1 — the first goal.** text\n');
});

afterEach(() => {
  race.on = false;
  vi.useRealTimers();
  fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// orbit-emit-composition: The write gate checks the account
// ---------------------------------------------------------------------------

describe('orbit-emit-composition: The write gate checks the account', () => {
  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: A well-formed account writes
  it('writes account/account-<TS>.json carrying the payload with command, timestamp and change, and no kind', () => {
    makeChange('foo');
    const r = emit({ change: 'foo' }, accountPayload({ defines: [{ term: 'export', definition: 'a copy of the data' }], detail: 'src/x.ts' }));
    expect(path.relative(root, r.path)).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/account\/account-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/);
    const onDisk = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(onDisk).toEqual(r.emit);
    expect(Object.keys(onDisk).sort()).toEqual(['built', 'change', 'command', 'defines', 'detail', 'deviations', 'model', 'seams', 'timestamp']);
    expect(onDisk.command).toBe('account');
    expect(onDisk.change).toBe('foo');
    expect(onDisk.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    for (const k of ['kind', 'next_recommended', 'final_assessment']) expect(k in onDisk).toBe(false);
    // Nothing lands directly in the trail: the account is in its own child.
    expect(ls('orbit/changes/foo/.orbit-runs')).toEqual(['account']);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: A blank plain field is refused
  it('refuses a plain field that is blank, absent or not a string, naming it', () => {
    makeChange('foo');
    for (const f of ['built', 'seams', 'deviations']) {
      expectRefused(() => emit({ change: 'foo' }, accountPayload({ [f]: '   ' })), new RegExp(`'${f}' must be a non-blank string`));
      expectRefused(() => emit({ change: 'foo' }, accountPayload({ [f]: ['None.'] })), new RegExp(`'${f}' must be a non-blank string`));
      const { [f]: _gone, ...without } = accountPayload();
      expectRefused(() => emit({ change: 'foo' }, without), new RegExp(`'${f}' must be a non-blank string`));
    }
    // The same payload with every field filled writes: the refusals above are the fields', not the payload's.
    expect(fs.existsSync(emit({ change: 'foo' }, accountPayload()).path)).toBe(true);
  });

  it('refuses a malformed defines or detail, an unknown key, and a missing model', () => {
    makeChange('foo');
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ defines: 'hold' })), /'defines' must be an array/);
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ defines: [{ term: 'hold' }] })), /'defines\[0\]\.definition' must be a non-blank string/);
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ defines: [{ term: 'hold', definition: 'd', extra: 1 }] })), /unknown key 'extra'/);
    expectRefused(
      () => emit({ change: 'foo' }, accountPayload({ defines: [{ term: 'hold', definition: 'd' }, { term: 'hold', definition: 'e' }] })),
      /repeats 'hold'/
    );
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ detail: 3 })), /'detail' must be a string/);
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ replaces: 'ledger-2026-11-07T10-00-00Z.json' })), /'replaces' must name an account by its filename/);
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ area: 'defaults' })), /unknown payload key 'area' for 'account'/);
    const { model: _m, ...noModel } = accountPayload();
    expectRefused(() => emit({ change: 'foo' }, noModel), /missing the required 'model'/);
    for (const k of ['command', 'timestamp', 'change']) {
      expectRefused(() => emit({ change: 'foo' }, accountPayload({ [k]: 'x' })), new RegExp(`'${k}' is engine-owned for 'account'`));
    }
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: A second account must replace the first
  it('refuses a second account without replaces, naming replaces and the latest account', () => {
    makeChange('foo');
    const a = path.basename(emit({ change: 'foo' }, accountPayload()).path);
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ built: 'Another.' })), new RegExp(`'replaces' is required.*replace ${a.replace(/\./g, '\\.')}, the latest`));
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: A replacement of the latest account writes
  it('writes a replacement of the latest account, which may change every field, and leaves the original as it was', () => {
    makeChange('foo');
    const first = emit({ change: 'foo' }, accountPayload());
    const a = path.basename(first.path);
    const before = fs.readFileSync(first.path, 'utf-8');
    const r = emit({ change: 'foo' }, { model: 'm2', built: 'A daily export.', seams: 'The user is asked for an interval.', deviations: 'Daily, not weekly, as the charter said.', replaces: a });
    expect(r.emit.replaces).toBe(a);
    expect(r.emit.built).toBe('A daily export.');
    expect(fs.readFileSync(first.path, 'utf-8')).toBe(before);
    expect(ls(ACC('foo'))).toEqual([a, path.basename(r.path)].sort());
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: A replaced account cannot be replaced again
  it('refuses a replacement of a replaced account, naming replaces and the latest', () => {
    makeChange('foo');
    const a = path.basename(emit({ change: 'foo' }, accountPayload()).path);
    const b = path.basename(emit({ change: 'foo' }, accountPayload({ built: 'B.', replaces: a })).path);
    expectRefused(
      () => emit({ change: 'foo' }, accountPayload({ built: 'C.', replaces: a })),
      new RegExp(`'replaces' '${a.replace(/\./g, '\\.')}' is already replaced by ${b.replace(/\./g, '\\.')}.*replace ${b.replace(/\./g, '\\.')}, the latest`)
    );
    // The latest replaces cleanly.
    expect(emit({ change: 'foo' }, accountPayload({ built: 'C.', replaces: b })).emit.replaces).toBe(b);
  });

  it('refuses replaces naming no account in the folder, naming the latest', () => {
    makeChange('foo');
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ replaces: 'account-2026-01-01T00-00-00Z.json' })), /names no account in/);
    const a = path.basename(emit({ change: 'foo' }, accountPayload()).path);
    expectRefused(
      () => emit({ change: 'foo' }, accountPayload({ replaces: 'account-2026-01-01T00-00-00Z.json' })),
      new RegExp(`names no account in .* replace ${a.replace(/\./g, '\\.')}, the latest`)
    );
    // An account-named file that is not an account (another command's record) is not an account.
    write(`${ACC('foo')}/account-2026-01-02T00-00-00Z.json`, JSON.stringify({ command: 'ledger' }));
    expectRefused(() => emit({ change: 'foo' }, accountPayload({ replaces: 'account-2026-01-02T00-00-00Z.json' })), /names no account in/);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: An account outside an active change is refused
  // @scenario behaviour orbit-decision-records :: Each change carries one account, written when apply is complete :: A walk of an archived change writes no account
  // (the THEN holds whatever the walk does: an archived change's name is refused, so no account can land on its trail)
  it('refuses an exploration-only name, an archived-only name and an unknown name with the active-change wording, and --doc as a usage error', () => {
    write('orbit/explore/foo/explore.md', '## Decisions\n');
    expectRefused(
      () => emit({ change: 'foo' }, accountPayload()),
      /an account is written only for an active change under orbit\/changes\/ — 'foo' was found only at orbit\/explore\/foo\//
    );
    write('orbit/changes/archive/2026-11-09-done/proposal.md', 'p');
    expectRefused(
      () => emit({ change: 'done' }, accountPayload()),
      /written only for an active change .* 'done' was found only at orbit\/changes\/archive\/2026-11-09-done\//
    );
    expectRefused(() => emit({ change: 'nowhere' }, accountPayload()), /written only for an active change .* 'nowhere' was found nowhere/);
    expectRefused(() => emit({ change: 'archive' }, accountPayload()), /written only for an active change/);
    expectRefused(() => emit({ doc: 'prog' }, accountPayload()), /--doc is not a valid target for 'account'/);
    expectRefused(() => emit({}, accountPayload()), /'account' requires a target: --change <name>/);
    // Once the change is active, the same payload writes.
    makeChange('foo');
    expect(fs.existsSync(emit({ change: 'foo' }, accountPayload()).path)).toBe(true);
  });

  it('through the CLI: --doc exits non-zero with empty stdout', async () => {
    const r = await runCLI(['emit', 'account', '--doc', 'prog'], { cwd: root, input: JSON.stringify(accountPayload()) });
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/--doc is not a valid target for 'account'/);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: An aliased account folder is refused
  it('refuses an account folder aliased outside the trail, or onto the trail\'s decisions folder, writing in neither place', () => {
    makeChange('foo');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-account-outside-'));
    try {
      fs.mkdirSync(path.join(root, 'orbit/changes/foo/.orbit-runs'), { recursive: true });
      fs.symlinkSync(outside, path.join(root, ACC('foo')), 'dir');
      expectRefused(() => emit({ change: 'foo' }, accountPayload()), /account directory .* does not physically resolve to its trail's canonical account child/);
      expect(fs.readdirSync(outside)).toEqual([]);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
    makeChange('bar');
    fs.mkdirSync(path.join(root, 'orbit/changes/bar/.orbit-runs/decisions'), { recursive: true });
    fs.symlinkSync('decisions', path.join(root, ACC('bar')), 'dir');
    expectRefused(() => emit({ change: 'bar' }, accountPayload()), /canonical account child/);
    expect(ls('orbit/changes/bar/.orbit-runs/decisions')).toEqual([]);
  });

  it('the identity check runs again just before publish', () => {
    makeChange('foo');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-account-swap-'));
    const realSync = fs.realpathSync;
    try {
      // Simulate the folder being swapped for an alias between creation and publish: the first
      // identity check sees the canonical folder, every later one sees it resolve outside.
      let calls = 0;
      const spy = vi.spyOn(fs, 'realpathSync').mockImplementation(((p: fs.PathLike, ...rest: unknown[]) => {
        if (String(p).endsWith(`${path.sep}account`) && ++calls > 1) return outside;
        return (realSync as any)(p, ...rest);
      }) as typeof fs.realpathSync);
      expect(() => emit({ change: 'foo' }, accountPayload())).toThrow(/canonical account child/);
      expect(calls).toBeGreaterThan(1);
      spy.mockRestore();
      expect(ls(ACC('foo'))).toEqual([]);
    } finally {
      vi.restoreAllMocks();
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks the account :: An account carries no recommendation
  it('refuses next_recommended, final_assessment and kind as engine-owned', () => {
    makeChange('foo');
    for (const k of ['next_recommended', 'final_assessment', 'kind']) {
      expectRefused(() => emit({ change: 'foo' }, accountPayload({ [k]: 'x' })), new RegExp(`payload field '${k}' is engine-owned for 'account'`));
    }
  });

  it('the token is unique within account/, independent of the trail and decisions/', () => {
    makeChange('foo');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T10:00:00Z'));
    write('orbit/changes/foo/.orbit-runs/verify-2026-11-07T10-00-00Z.json', '{}');
    write('orbit/changes/foo/.orbit-runs/decisions/stop-2026-11-07T10-00-00Z.json', '{}');
    const a = emit({ change: 'foo' }, accountPayload());
    expect(path.basename(a.path)).toBe('account-2026-11-07T10-00-00Z.json');
    const b = emit({ change: 'foo' }, accountPayload({ replaces: path.basename(a.path) }));
    expect(path.basename(b.path)).toBe('account-2026-11-07T10-00-01Z.json');
    expect(b.emit.timestamp).toBe('2026-11-07T10:00:01Z');
  });

  it("a same-token writer's temporary file or published account refuses the emit and is left in place", () => {
    makeChange('foo');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T10:00:00Z'));
    race.on = true;
    const tmp = `${ACC('foo')}/.account-2026-11-07T10-00-00Z.json.tmp`;
    write(tmp, 'another writer, mid-write');
    expect(() => emit({ change: 'foo' }, accountPayload())).toThrow(/\.account-2026-11-07T10-00-00Z\.json\.tmp already exists — another writer drew token 2026-11-07T10-00-00Z in this account folder/);
    expect(fs.readFileSync(path.join(root, tmp), 'utf-8')).toBe('another writer, mid-write');
    fs.rmSync(path.join(root, tmp));
    const rec = `${ACC('foo')}/account-2026-11-07T10-00-00Z.json`;
    write(rec, 'the other account');
    expect(() => emit({ change: 'foo' }, accountPayload())).toThrow(/account-2026-11-07T10-00-00Z\.json already exists/);
    expect(fs.readFileSync(path.join(root, rec), 'utf-8')).toBe('the other account');
    race.on = false;
    expect(ls(ACC('foo'))).toEqual(['account-2026-11-07T10-00-00Z.json']);
  });
});

// ---------------------------------------------------------------------------
// orbit-decision-records: The reader takes the account only when sign-off is per change
// ---------------------------------------------------------------------------

describe('orbit-decision-records: The reader takes the account only when sign-off is per change', () => {
  // @scenario behaviour orbit-decision-records :: The reader takes the account only when sign-off is per change :: The brief does not render the account
  it('orbit decisions brief says there is nothing to read when the history holds only an account, and exits zero', async () => {
    makeChange('foo');
    emit({ change: 'foo' }, accountPayload());
    expect(selectUnreadRecords(path.join(root, 'orbit/changes/foo'), root)).toEqual([]);
    const r = await runCLI(['decisions', 'brief', 'foo'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/Nothing to read/);
    const j = await runCLI(['decisions', 'brief', 'foo', '--json'], { cwd: root });
    expect(j.exitCode).toBe(0);
    expect(JSON.parse(j.stdout).selected).toEqual([]);
  });

  // @scenario behaviour orbit-decision-records :: The reader takes the account only when sign-off is per change :: The account is not counted unread at archive
  // @scenario behaviour orbit-decision-records :: Each change carries one account, written when apply is complete :: Archive writes no account
  it('the archive emit counts one unread decision record beside an account chain, the in-context system pass owes only it, and the archive writes no account', () => {
    makeChange('foo', '- [x] 1.1 do a thing\n');
    const first = path.basename(emit({ change: 'foo' }, accountPayload()).path);
    emit({ change: 'foo' }, accountPayload({ built: 'Replaced.', replaces: first }));
    const ledger = composeAndWriteEmit('ledger', { change: 'foo' }, {
      model: 'm', area: 'defaults', decided: 'Weekly.', alternatives: ['daily'], why: 'Enough.',
      relies_on: [{ kind: 'goal', doc: 'prog', id: 'G1' }],
    }, { projectRoot: root });
    const clean = { critical: 0, warning: 0, suggestion: 0 };
    const pass = composeAndWriteEmit('review', { change: 'foo' }, {
      mode: 'system', reviewer_class: 'in-context', depth: 'full', passes_run: ['0', '1'], passes_skipped: ['reading'],
      scorecard: { completeness: clean, correctness: clean, coherence: clean }, findings: [], stale_suppressed: [], model: 'm',
    }, { projectRoot: root });
    expect(pass.emit.decision_records_owed).toEqual([path.basename(ledger.path)]);
    // A read list naming the account is refused with the setting absent: the account is not in the selection.
    const accounts = ls(ACC('foo'));
    expect(accounts).toHaveLength(2);
    const account = accounts[0];
    expect(() => composeAndWriteEmit('review', { change: 'foo' }, {
      mode: 'system', reviewer_class: 'in-context', depth: 'full', passes_run: ['0', '1', 'reading'], passes_skipped: [],
      decision_records_read: [account],
      scorecard: { completeness: clean, correctness: clean, coherence: clean }, findings: [], stale_suppressed: [], model: 'm',
    }, { projectRoot: root })).toThrow(/'decision_records_read' names account-.*which is not in the selection/);
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(path.join(root, 'orbit/changes/foo'), path.join(root, 'orbit/changes/archive/2026-11-09-foo'));
    const arch = composeAndWriteEmit('archive', { change: 'foo' }, { final_assessment: 'archived', model: null }, { projectRoot: root });
    expect(arch.emit.decision_records_unread).toBe(1);
    // The archived change keeps both accounts; the archive writes none.
    expect(ls('orbit/changes/archive/2026-11-09-foo/.orbit-runs/account')).toEqual(accounts);
  });

  // @scenario behaviour orbit-decision-records :: The reader takes the account only when sign-off is per change :: Today's readers do not see the account
  it('status, the reviewed gates, the trail, orientation and the report render read the change as without the account folder', () => {
    makeChange('foo');
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
    const a = path.basename(emit({ change: 'foo' }, accountPayload()).path);
    emit({ change: 'foo' }, accountPayload({ built: 'Replaced.', replaces: a }));
    expect(ls(ACC('foo'))).toHaveLength(2);
    expect(JSON.stringify(snapshot())).toBe(before);
  });
});
