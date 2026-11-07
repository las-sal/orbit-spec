/**
 * decision-layer: the three decision records (`orbit-decision-records`) and the emit surface that
 * writes them (`orbit-emit-composition`'s `The write gate checks decision records` and the three
 * MODIFIED requirements). It also holds new, tagged tests for the scenarios carried unchanged in
 * those MODIFIED blocks (task 3.3): `Engine-owned spine composition and filename discipline` and
 * `Write-gate validation via the shared normalizers`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { LEDGER_AREAS } from '../../src/core/decision-records.js';
import { loadChangeContext, formatChangeStatus } from '../../src/core/artifact-graph/instruction-loader.js';
import { readTrail } from '../../src/core/artifact-graph/trail.js';
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
  write(`orbit/changes/${name}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [ ] 1.1 do a thing\n');
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 3\n');
}

function ls(rel: string): string[] {
  const dir = path.join(root, rel);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

const DEC = (change: string) => `orbit/changes/${change}/.orbit-runs/decisions`;
const ARCH_DEC = 'orbit/architecture/.orbit-runs/decisions';

const PROG_DOC = [
  '# prog',
  '',
  '## Goals',
  '',
  '- **G1 — the first goal.** text (it cites **R-p-9**, a ruling no index lists)',
  '- **G10 — a later goal.** text',
  '- **G11 — another.** text',
  '',
  '```',
  '- **G7 — fenced, not a goal.**',
  '```',
  '',
  '## Rulings index',
  '',
  '- **R-p-1** (Sal) — a ruling',
  '',
].join('\n');

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
  why: 'Weekly matches the goal of nothing being lost without flooding the disk.',
  relies_on: [{ kind: 'goal', doc: 'prog', id: 'G1' }],
  ...over,
});

const resolutionPayload = (stop: string, over: Record<string, unknown> = {}) => ({
  model: 'test-model',
  stop,
  answer: 'Yes, in the user config file, never in the repository.',
  effect: 'The run continues with the key in the config file.',
  ...over,
});

const emit = (command: string, target: { change?: string; doc?: string }, payload: Record<string, unknown>) =>
  composeAndWriteEmit(command, target, payload, { projectRoot: root });

/** Expect a refusal naming `pattern`, and no new file anywhere under the `decisions/` folder given. */
function expectRefused(fn: () => unknown, pattern: RegExp, folder: string): void {
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

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-decisions-'));
  write('orbit/architecture/prog.md', PROG_DOC);
});

afterEach(() => {
  vi.useRealTimers();
  fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// orbit-decision-records
// ---------------------------------------------------------------------------

describe('orbit-decision-records: three records, one job each', () => {
  // @scenario behaviour orbit-decision-records :: Three decision records, one job each :: A call with no precedent writes a stop, then its ledger entry
  it('a stop, then the ledger entry relying on nothing that names it', () => {
    makeChange('foo');
    const stop = emit('stop', { change: 'foo' }, stopPayload());
    const name = path.basename(stop.path);
    const entry = emit('ledger', { change: 'foo' }, ledgerPayload({ area: 'secrets', relies_on: [], raised_stop: name }));
    expect(ls(DEC('foo'))).toEqual([path.basename(entry.path), name].sort());
    expect(JSON.parse(fs.readFileSync(entry.path, 'utf-8')).raised_stop).toBe(name);
  });

  // @scenario behaviour orbit-decision-records :: Three decision records, one job each :: Amending a ruling raises a stop with no ledger entry
  it('a ruling-amendment stop is written with no ledger entry', () => {
    makeChange('foo');
    const stop = emit('stop', { change: 'foo' }, stopPayload({ condition: 'ruling-amendment' }));
    expect(ls(DEC('foo'))).toEqual([path.basename(stop.path)]);
    expect(stop.emit.condition).toBe('ruling-amendment');
  });

  // @scenario behaviour orbit-decision-records :: Three decision records, one job each :: A stop stays open until answered
  it('a stop is open until a resolution names it; a second resolution is refused', () => {
    makeChange('foo');
    const name = path.basename(emit('stop', { change: 'foo' }, stopPayload()).path);
    const namedBy = () =>
      ls(DEC('foo'))
        .filter(f => f.startsWith('resolution-'))
        .map(f => JSON.parse(fs.readFileSync(path.join(root, DEC('foo'), f), 'utf-8')).stop);
    expect(namedBy()).not.toContain(name); // open
    emit('resolution', { change: 'foo' }, resolutionPayload(name));
    expect(namedBy()).toEqual([name]); // closed
    expectRefused(() => emit('resolution', { change: 'foo' }, resolutionPayload(name)), /already resolved/, DEC('foo'));
  });
});

describe('orbit-decision-records: the plain-language rule held by structure', () => {
  // @scenario behaviour orbit-decision-records :: The plain-language rule is held by structure and by a reader :: An empty plain field is refused
  it('a blank question is refused naming it', () => {
    makeChange('foo');
    expectRefused(() => emit('stop', { change: 'foo' }, stopPayload({ question: '   ' })), /'question'/, DEC('foo'));
    for (const [cmd, field] of [['ledger', 'decided'], ['ledger', 'why'], ['stop', 'about']] as const) {
      const p = cmd === 'ledger' ? ledgerPayload({ [field]: '' }) : stopPayload({ [field]: '' });
      expectRefused(() => emit(cmd, { change: 'foo' }, p), new RegExp(`'${field}'`), DEC('foo'));
    }
    const name = path.basename(emit('stop', { change: 'foo' }, stopPayload()).path);
    for (const field of ['answer', 'effect']) {
      expectRefused(() => emit('resolution', { change: 'foo' }, resolutionPayload(name, { [field]: 7 })), new RegExp(`'${field}'`), DEC('foo'));
    }
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ alternatives: [] })), /'alternatives'/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ alternatives: ['ok', ' '] })), /'alternatives\[1\]'/, DEC('foo'));
  });

  // @scenario behaviour orbit-decision-records :: The plain-language rule is held by structure and by a reader :: An undefined term is refused
  it('a listed term with an empty definition is refused naming defines[0].definition', () => {
    makeChange('foo');
    expectRefused(
      () => emit('ledger', { change: 'foo' }, ledgerPayload({ defines: [{ term: 'hub token', definition: '' }] })),
      /'defines\[0\]\.definition'/,
      DEC('foo')
    );
    const ok = { term: 'hub token', definition: 'the one credential the hub issues' };
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ defines: [ok, { ...ok }] })), /'defines\[1\]\.term' repeats/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ defines: [{ ...ok, extra: 1 }] })), /unknown key 'extra'/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ defines: [{ term: ' ', definition: 'd' }] })), /'defines\[0\]\.term'/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ defines: 'hub token' })), /'defines'/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ detail: ['files'] })), /'detail'/, DEC('foo'));
    const written = emit('ledger', { change: 'foo' }, ledgerPayload({ defines: [ok], detail: 'src/hub.ts' }));
    expect(written.emit.defines).toEqual([ok]);
  });
});

describe("orbit-decision-records: the ledger's eighteen areas", () => {
  // @scenario behaviour orbit-decision-records :: The ledger's eighteen areas :: An unknown area is refused
  it('an unknown area is refused naming area and listing the eighteen ids', () => {
    makeChange('foo');
    expect(LEDGER_AREAS).toHaveLength(18);
    let msg = '';
    try {
      emit('ledger', { change: 'foo' }, ledgerPayload({ area: 'ux' }));
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/'area'/);
    for (const id of LEDGER_AREAS) expect(msg).toContain(id);
    expect(ls(DEC('foo'))).toEqual([]);
    for (const id of LEDGER_AREAS) {
      expect(() => emit('ledger', { change: 'foo' }, ledgerPayload({ area: id }))).not.toThrow();
    }
  });
});

describe('orbit-decision-records: a ledger entry names what it relies on', () => {
  beforeEach(() => {
    makeChange('foo');
    write('orbit/specs/orbit-review/spec.md', '# orbit-review\n\n### Requirement: Real one\n\nIt SHALL.\n\n```\n### Requirement: Fenced one\n```\n');
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: A citation of a missing requirement is refused
  it('a citation of a missing requirement is refused naming it', () => {
    const cite = (title: string) => ledgerPayload({ relies_on: [{ kind: 'requirement', capability: 'orbit-review', title }] });
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('No such thing')), /relies_on\[0\].*No such thing/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('Fenced one')), /relies_on\[0\]/, DEC('foo'));
    expect(() => emit('ledger', { change: 'foo' }, cite('Real one'))).not.toThrow();
    // A requirement being proposed is not yet approved: the change's own delta is not read.
    write('orbit/changes/foo/specs/orbit-review/spec.md', '## ADDED Requirements\n\n### Requirement: Proposed one\n\nIt SHALL.\n');
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('Proposed one')), /relies_on\[0\]/, DEC('foo'));
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: An earlier resolution is precedent
  it("an existing resolution of change bar is precedent; no stop is needed", () => {
    makeChange('bar');
    const stop = path.basename(emit('stop', { change: 'bar' }, stopPayload()).path);
    const res = emit('resolution', { change: 'bar' }, resolutionPayload(stop));
    const token = path.basename(res.path).replace(/^resolution-|\.json$/g, '');
    const entry = emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind: 'resolution', change: 'bar', token }] }));
    expect(entry.emit.raised_stop).toBeUndefined();
    expect(ls(DEC('foo'))).toEqual([path.basename(entry.path)]);
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: A resolution citation survives the archive
  it('a resolution citation resolves in the archived change', () => {
    write('orbit/changes/archive/2026-11-08-bar/.orbit-runs/decisions/resolution-2026-11-07T10-00-00Z.json', JSON.stringify({ command: 'resolution', change: 'bar' }));
    const entry = emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind: 'resolution', change: 'bar', token: '2026-11-07T10-00-00Z' }] }));
    expect(fs.existsSync(entry.path)).toBe(true);
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: A precedent in an older archive of a reused name is found
  it('a precedent in the older of two archives of one name is found', () => {
    write('orbit/changes/archive/2026-11-08-bar/.orbit-runs/decisions/resolution-2026-11-07T10-00-00Z.json', JSON.stringify({ command: 'resolution', change: 'bar' }));
    fs.mkdirSync(path.join(root, 'orbit/changes/archive/2026-12-01-bar/.orbit-runs/decisions'), { recursive: true });
    const entry = emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind: 'resolution', change: 'bar', token: '2026-11-07T10-00-00Z' }] }));
    expect(fs.existsSync(entry.path)).toBe(true);
    // The newest archive holding the record wins over an older one holding a non-resolution.
    write('orbit/changes/archive/2026-12-01-bar/.orbit-runs/decisions/resolution-2026-11-07T10-00-00Z.json', JSON.stringify({ command: 'stop' }));
    expectRefused(
      () => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind: 'resolution', change: 'bar', token: '2026-11-07T10-00-00Z' }] })),
      /2026-12-01-bar.*not a resolution/,
      DEC('foo')
    );
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: A goal ID matches only as a whole
  it('G1 does not match G10 or G11; a fenced goal does not count; rulings resolve under the Rulings index', () => {
    write('orbit/architecture/whole.md', '# whole\n\n## Goals\n\n- **G10 — x.**\n- **G11 — y.**\n');
    const goal = (doc: string, id: string) => ledgerPayload({ relies_on: [{ kind: 'goal', doc, id }] });
    expectRefused(() => emit('ledger', { change: 'foo' }, goal('whole', 'G1')), /relies_on\[0\].*G1/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, goal('prog', 'G7')), /relies_on\[0\]/, DEC('foo'));
    expect(() => emit('ledger', { change: 'foo' }, goal('prog', 'G1'))).not.toThrow();
    expect(() => emit('ledger', { change: 'foo' }, goal('whole', 'G10'))).not.toThrow();
    const ruling = (id: string) => ledgerPayload({ relies_on: [{ kind: 'ruling', doc: 'prog', id }] });
    expect(() => emit('ledger', { change: 'foo' }, ruling('R-p-1'))).not.toThrow();
    expectRefused(() => emit('ledger', { change: 'foo' }, ruling('R-p-2')), /relies_on\[0\]/, DEC('foo'));
    // A goal ID is not a ruling: the Rulings index alone is read for a ruling.
    expectRefused(() => emit('ledger', { change: 'foo' }, ruling('G1')), /relies_on\[0\]/, DEC('foo'));
    // A bold ruling ID outside the Rulings index does not count.
    expectRefused(() => emit('ledger', { change: 'foo' }, ruling('R-p-9')), /Rulings index/, DEC('foo'));
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: A superseded decision is not citable
  it('a superseded decision is refused; a live or disposition-less one resolves; refused on a doc-scoped record', () => {
    write(
      'orbit/changes/foo/explore.md',
      [
        '## Decisions',
        '',
        '- **2026-11-07 — D-foo-1: a live one** text',
        '  Kind: rule',
        '- **2026-11-07 — D-foo-2: replaced** text',
        '  Disposition: superseded D-foo-3',
        '- **2026-11-07 — D-foo-3: its replacement** text',
        '  Disposition: live',
        '',
      ].join('\n')
    );
    const cite = (id: string) => ledgerPayload({ relies_on: [{ kind: 'decision', id }] });
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('D-foo-2')), /relies_on\[0\].*D-foo-2/, DEC('foo'));
    expect(() => emit('ledger', { change: 'foo' }, cite('D-foo-1'))).not.toThrow();
    expect(() => emit('ledger', { change: 'foo' }, cite('D-foo-3'))).not.toThrow();
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('D-foo-9')), /relies_on\[0\]/, DEC('foo'));
    expectRefused(() => emit('ledger', { doc: 'prog' }, cite('D-foo-1')), /architecture-scoped/, ARCH_DEC);
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: An unreadable cited record is refused
  it('a cited resolution holding invalid JSON, or whose command is not resolution, is refused naming the citation', () => {
    makeChange('bar');
    write(`${DEC('bar')}/resolution-2026-11-07T10-00-00Z.json`, '{ not json');
    write(`${DEC('bar')}/resolution-2026-11-07T11-00-00Z.json`, JSON.stringify({ command: 'ledger' }));
    const cite = (token: string) => ledgerPayload({ relies_on: [{ kind: 'resolution', change: 'bar', token }] });
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('2026-11-07T10-00-00Z')), /relies_on\[0\].*cannot be read/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('2026-11-07T11-00-00Z')), /relies_on\[0\].*not a resolution/, DEC('foo'));
    expectRefused(() => emit('ledger', { change: 'foo' }, cite('2026-11-07T12-00-00Z')), /relies_on\[0\].*no resolution record/, DEC('foo'));
    // A doc-form citation reads the architecture trail and must match its doc.
    write(`${ARCH_DEC}/resolution-2026-11-07T10-00-00Z.json`, JSON.stringify({ command: 'resolution', change: null, doc: 'other' }));
    expectRefused(
      () => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind: 'resolution', doc: 'prog', token: '2026-11-07T10-00-00Z' }] })),
      /relies_on\[0\].*doc/,
      DEC('foo')
    );
  });

  it('a citation of an unknown kind or a malformed shape is refused, and names are held to the identifier rule', () => {
    const bad: unknown[] = [
      { kind: 'convention', id: 'x' },
      { kind: 'goal', doc: 'prog' },
      { kind: 'goal', doc: 'prog', id: 'G1', extra: 1 },
      { kind: 'goal', doc: '../prog', id: 'G1' },
      { kind: 'requirement', capability: 'a/b', title: 'x' },
      { kind: 'resolution', change: '..', token: '2026-11-07T10-00-00Z' },
      { kind: 'resolution', change: 'bar', token: '../../x' },
      'G1',
      null,
      // Inherited keys are not kinds (system walk, external W2): each is refused like any unknown kind.
      { kind: 'toString' },
      { kind: 'constructor' },
      { kind: '__proto__' },
      { kind: 'hasOwnProperty' },
    ];
    for (const c of bad) {
      expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [c] })), /relies_on\[0\]/, DEC('foo'));
    }
    // Names that would reach a real file through a path are refused by the identifier rule itself.
    expectRefused(
      () => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind: 'goal', doc: '../architecture/prog', id: 'G1' }] })),
      /relies_on\[0\]\.doc.*not a single name/,
      DEC('foo')
    );
    // A token that would traverse to a real resolution-shaped file is refused by the token form.
    makeChange('bar');
    write(`${DEC('bar')}/2026-11-07T10-00-00Z.json`, JSON.stringify({ command: 'resolution', change: 'bar' }));
    expectRefused(
      () =>
        emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind: 'resolution', change: 'bar', token: '2026-11-07T10-00-00Z/../2026-11-07T10-00-00Z' }] })),
      /relies_on\[0\]\.token.*not a filename token/,
      DEC('foo')
    );
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: 'G1' })), /'relies_on'/, DEC('foo'));
    for (const kind of ['toString', 'constructor', '__proto__']) {
      expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [{ kind }] })), /'relies_on\[0\]' has kind .* a citation's kind is one of/, DEC('foo'));
    }
    // The same defect class on the emit surface's own command lookup: an inherited key is no command.
    for (const command of ['toString', 'constructor', 'hasOwnProperty']) {
      expect(() => emit(command, { change: 'foo' }, { model: null })).toThrow(/unknown emit command/);
    }
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: An entry relying on nothing must name its stop
  it('relies_on [] with no raised_stop is refused naming raised_stop', () => {
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [] })), /'raised_stop'/, DEC('foo'));
    // A raised_stop naming no stop record in the folder is refused too.
    expectRefused(
      () => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [], raised_stop: 'stop-2026-11-07T10-00-00Z.json' })),
      /'raised_stop'.*no readable stop/,
      DEC('foo')
    );
    // A name reaching a real stop outside the folder is refused by the filename form.
    write('orbit/changes/foo/.orbit-runs/stop-2026-11-07T10-00-00Z.json', JSON.stringify({ command: 'stop', change: 'foo', condition: 'security-unprecedented' }));
    expectRefused(
      () => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [], raised_stop: '../stop-2026-11-07T10-00-00Z.json' })),
      /'raised_stop' must name a stop record by its filename/,
      DEC('foo')
    );
    expectRefused(
      () => emit('resolution', { change: 'foo' }, resolutionPayload('../stop-2026-11-07T10-00-00Z.json')),
      /'stop' must name a stop record by its filename/,
      DEC('foo')
    );
  });

  // @scenario behaviour orbit-decision-records :: A ledger entry names what it relies on :: An entry cannot both cite and name a stop
  it('a citation plus raised_stop is refused naming raised_stop', () => {
    const stop = path.basename(emit('stop', { change: 'foo' }, stopPayload()).path);
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ raised_stop: stop })), /'raised_stop'/, DEC('foo'));
  });
});

describe('orbit-decision-records: where decision records are kept', () => {
  // @scenario behaviour orbit-decision-records :: Where decision records are kept :: A ledger entry during a change lands in the change's folder
  it('orbit emit ledger --change foo lands in the change decisions folder', () => {
    makeChange('foo');
    const r = emit('ledger', { change: 'foo' }, ledgerPayload());
    expect(path.relative(root, r.path)).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/decisions\/ledger-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/);
  });

  // @scenario behaviour orbit-decision-records :: Where decision records are kept :: Records made while exploring travel with the change
  it('a stop written while exploring is found after propose moves the directory, and its resolution lands beside it', () => {
    write('orbit/explore/foo/explore.md', '## Decisions\n\n## Open questions\n');
    const stop = emit('stop', { change: 'foo' }, stopPayload());
    expect(path.relative(root, stop.path)).toMatch(/^orbit\/explore\/foo\/\.orbit-runs\/decisions\/stop-/);
    fs.mkdirSync(path.join(root, 'orbit/changes'), { recursive: true });
    fs.renameSync(path.join(root, 'orbit/explore/foo'), path.join(root, 'orbit/changes/foo'));
    const res = emit('resolution', { change: 'foo' }, resolutionPayload(path.basename(stop.path)));
    expect(path.dirname(res.path)).toBe(path.join(root, DEC('foo')));
    expect(ls(DEC('foo'))).toContain(path.basename(stop.path));
  });

  // @scenario behaviour orbit-decision-records :: Where decision records are kept :: Today's readers do not see the folder
  it('status, the reviewed gates, the trail, orientation and the report render read the change as without the folder', () => {
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
    const stop = path.basename(emit('stop', { change: 'foo' }, stopPayload()).path);
    emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [], raised_stop: stop, area: 'secrets' }));
    emit('resolution', { change: 'foo' }, resolutionPayload(stop));
    expect(ls(DEC('foo'))).toHaveLength(3);
    expect(JSON.stringify(snapshot())).toBe(before);
  });
});

describe('orbit-decision-records: written in every mode', () => {
  // @scenario behaviour orbit-decision-records :: Decision records are written in every mode :: A stop under supervised settings halts nothing
  it('a stop under default settings changes no gate, readout or next command', () => {
    makeChange('foo');
    const before = formatChangeStatus(loadChangeContext(root, 'foo'));
    emit('stop', { change: 'foo' }, stopPayload({ condition: 'outward-act' }));
    const after = formatChangeStatus(loadChangeContext(root, 'foo'));
    expect(after.gates).toEqual(before.gates);
    expect(after.position).toBe(before.position);
    expect(after.next_command).toBe(before.next_command);
  });
});

// ---------------------------------------------------------------------------
// orbit-emit-composition: The write gate checks decision records (ADDED)
// ---------------------------------------------------------------------------

describe('orbit-emit-composition: the write gate checks decision records', () => {
  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A well-formed ledger entry writes
  it('a well-formed ledger entry writes with command, timestamp and change', () => {
    makeChange('foo');
    write('orbit/architecture/automate-dev-flow.md', '# adf\n\n## Goals\n\n- **G1 — Sal only shows up where Sal adds value.** x\n');
    const payload = ledgerPayload({ relies_on: [{ kind: 'goal', doc: 'automate-dev-flow', id: 'G1' }] });
    const r = emit('ledger', { change: 'foo' }, payload);
    expect(path.relative(root, r.path)).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/decisions\/ledger-.*\.json$/);
    const onDisk = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(onDisk).toEqual({
      command: 'ledger',
      timestamp: onDisk.timestamp,
      change: 'foo',
      ...payload,
    });
    expect(onDisk.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(path.basename(r.path)).toBe(`ledger-${onDisk.timestamp.replace(/:/g, '-')}.json`);
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A tripwire stop from a payload is refused
  it('condition tripwire is refused naming condition; an unknown condition is refused too', () => {
    makeChange('foo');
    expectRefused(() => emit('stop', { change: 'foo' }, stopPayload({ condition: 'tripwire' })), /'condition' 'tripwire'/, DEC('foo'));
    expectRefused(() => emit('stop', { change: 'foo' }, stopPayload({ condition: 'whim' })), /'condition'/, DEC('foo'));
    for (const c of ['security-unprecedented', 'user-facing-uncovered', 'ruling-amendment', 'outward-act', 'unresolvable-critical']) {
      expect(() => emit('stop', { change: 'foo' }, stopPayload({ condition: c }))).not.toThrow();
    }
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A second resolution of one stop is refused
  it('a second resolution of stop-2026-11-07T10-00-00Z.json is refused naming the stop', () => {
    makeChange('foo');
    write(`${DEC('foo')}/stop-2026-11-07T10-00-00Z.json`, JSON.stringify({ command: 'stop', change: 'foo', condition: 'outward-act' }));
    emit('resolution', { change: 'foo' }, resolutionPayload('stop-2026-11-07T10-00-00Z.json'));
    expectRefused(
      () => emit('resolution', { change: 'foo' }, resolutionPayload('stop-2026-11-07T10-00-00Z.json')),
      /'stop' 'stop-2026-11-07T10-00-00Z\.json' is already resolved/,
      DEC('foo')
    );
    // A resolution naming no stop, or a record that is not a stop, is refused naming `stop`.
    expectRefused(() => emit('resolution', { change: 'foo' }, resolutionPayload('stop-2026-11-07T11-00-00Z.json')), /'stop'/, DEC('foo'));
    write(`${DEC('foo')}/stop-2026-11-07T12-00-00Z.json`, JSON.stringify({ command: 'ledger', change: 'foo' }));
    expectRefused(() => emit('resolution', { change: 'foo' }, resolutionPayload('stop-2026-11-07T12-00-00Z.json')), /'stop'.*not a stop/, DEC('foo'));
  });

  it('a resolution of a stop two writers already resolved names both resolutions', () => {
    makeChange('foo');
    write(`${DEC('foo')}/stop-2026-11-07T10-00-00Z.json`, JSON.stringify({ command: 'stop', change: 'foo', condition: 'outward-act' }));
    for (const t of ['11', '12']) {
      write(`${DEC('foo')}/resolution-2026-11-07T${t}-00-00Z.json`, JSON.stringify({ command: 'resolution', change: 'foo', stop: 'stop-2026-11-07T10-00-00Z.json' }));
    }
    expectRefused(
      () => emit('resolution', { change: 'foo' }, resolutionPayload('stop-2026-11-07T10-00-00Z.json')),
      /resolved by resolution-2026-11-07T11-00-00Z\.json, resolution-2026-11-07T12-00-00Z\.json/,
      DEC('foo')
    );
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A stop of another program is refused
  it('a resolution --doc prog-b naming a prog-a stop is refused naming stop', () => {
    write('orbit/architecture/prog-a.md', '# a\n');
    write('orbit/architecture/prog-b.md', '# b\n');
    const stop = path.basename(emit('stop', { doc: 'prog-a' }, stopPayload()).path);
    expect(ls(ARCH_DEC)).toEqual([stop]);
    expectRefused(() => emit('resolution', { doc: 'prog-b' }, resolutionPayload(stop)), /'stop'.*other work/, ARCH_DEC);
    expect(() => emit('resolution', { doc: 'prog-a' }, resolutionPayload(stop))).not.toThrow();
    // Same for a ledger entry's raised_stop across changes sharing nothing but a forged record.
    makeChange('foo');
    write(`${DEC('foo')}/stop-2026-11-07T10-00-00Z.json`, JSON.stringify({ command: 'stop', change: 'other', condition: 'security-unprecedented' }));
    expectRefused(
      () => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [], raised_stop: 'stop-2026-11-07T10-00-00Z.json' })),
      /'raised_stop'.*other work/,
      DEC('foo')
    );
  });

  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A raised stop of the wrong condition is refused
  it('a raised_stop of condition outward-act is refused naming raised_stop', () => {
    makeChange('foo');
    const stop = path.basename(emit('stop', { change: 'foo' }, stopPayload({ condition: 'outward-act' })).path);
    expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [], raised_stop: stop })), /'raised_stop'.*outward-act/, DEC('foo'));
    const ok = path.basename(emit('stop', { change: 'foo' }, stopPayload({ condition: 'user-facing-uncovered' })).path);
    expect(() => emit('ledger', { change: 'foo' }, ledgerPayload({ relies_on: [], raised_stop: ok }))).not.toThrow();
  });

  it('the payload contract holds: an unknown key and each spine field are refused, model is required', () => {
    makeChange('foo');
    expectRefused(() => emit('stop', { change: 'foo' }, stopPayload({ severity: 'high' })), /unknown payload key 'severity'/, DEC('foo'));
    for (const k of ['command', 'timestamp', 'change', 'kind', 'doc', 'next_recommended', 'final_assessment']) {
      expectRefused(() => emit('stop', { change: 'foo' }, stopPayload({ [k]: 'x' })), new RegExp(`'${k}' is engine-owned`), DEC('foo'));
    }
  });
});

// ---------------------------------------------------------------------------
// orbit-emit-composition: the three new MODIFIED scenarios
// ---------------------------------------------------------------------------

describe('orbit-emit-composition: decision records on the emit surface', () => {
  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: A decision record lands in the trail's decisions folder
  it("stop --change foo and ledger --doc my-program land in their decisions folders; an archived-only change is not found", () => {
    makeChange('foo');
    write('orbit/architecture/my-program.md', '# my-program\n\n## Goals\n\n- **G1 — g.**\n');
    const stop = emit('stop', { change: 'foo' }, stopPayload());
    expect(path.relative(root, stop.path)).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/decisions\/stop-.*\.json$/);
    const ledger = emit('ledger', { doc: 'my-program' }, ledgerPayload({ relies_on: [{ kind: 'goal', doc: 'my-program', id: 'G1' }] }));
    expect(path.relative(root, ledger.path)).toMatch(/^orbit\/architecture\/\.orbit-runs\/decisions\/ledger-.*\.json$/);
    expect(ledger.emit.change).toBeNull();
    expect(ledger.emit.doc).toBe('my-program');
    for (const r of [stop, ledger]) expect('kind' in JSON.parse(fs.readFileSync(r.path, 'utf-8'))).toBe(false);

    write('orbit/changes/archive/2026-11-01-gone/proposal.md', 'p');
    expect(() => emit('ledger', { change: 'gone' }, ledgerPayload())).toThrow(/workstream 'gone' not found/);
    expect(fs.existsSync(path.join(root, 'orbit/changes/archive/2026-11-01-gone/.orbit-runs'))).toBe(false);
    // A bare invocation is a missing-target error.
    expect(() => emit('stop', {}, stopPayload())).toThrow(/requires a target/);
    expect(fs.existsSync(path.join(root, 'orbit/.orbit-runs'))).toBe(false);
  });

  it('the token bump is scoped to the decisions folder, and a decisions alias is refused', () => {
    makeChange('foo');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T10:00:00Z'));
    // A trail file carrying the token does not bump a decision record …
    write('orbit/changes/foo/.orbit-runs/verify-2026-11-07T10-00-00Z.json', '{}');
    const first = emit('stop', { change: 'foo' }, stopPayload());
    expect(path.basename(first.path)).toBe('stop-2026-11-07T10-00-00Z.json');
    // … a decision record carrying it does, whatever its command.
    const second = emit('ledger', { change: 'foo' }, ledgerPayload());
    expect(path.basename(second.path)).toBe('ledger-2026-11-07T10-00-01Z.json');
    expect(second.emit.timestamp).toBe('2026-11-07T10:00:01Z');
    vi.useRealTimers();

    makeChange('bar');
    fs.mkdirSync(path.join(root, 'orbit/changes/bar/.orbit-runs'), { recursive: true });
    fs.symlinkSync('.', path.join(root, 'orbit/changes/bar/.orbit-runs/decisions'), 'dir');
    expect(() => emit('stop', { change: 'bar' }, stopPayload())).toThrow(/canonical decisions child/);
    expect(ls('orbit/changes/bar/.orbit-runs').filter(f => f.startsWith('stop-'))).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Deterministic facts are engine-composed per command :: A decision record carries no recommendation
  it('a ledger entry carries neither next_recommended nor final_assessment; supplying either is refused', () => {
    makeChange('foo');
    const r = emit('ledger', { change: 'foo' }, ledgerPayload());
    const onDisk = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect('next_recommended' in onDisk).toBe(false);
    expect('final_assessment' in onDisk).toBe(false);
    for (const k of ['next_recommended', 'final_assessment']) {
      expectRefused(() => emit('ledger', { change: 'foo' }, ledgerPayload({ [k]: 'x' })), new RegExp(`'${k}' is engine-owned`), DEC('foo'));
    }
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: A decision record passes its own spine checks
  it('a well-formed stop writes without the run-summary spine; a stop with no model is refused naming model', () => {
    makeChange('foo');
    const r = emit('stop', { change: 'foo' }, stopPayload());
    const onDisk = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    for (const k of ['final_assessment', 'next_recommended', 'kind']) expect(k in onDisk).toBe(false);
    const { model: _m, ...noModel } = stopPayload();
    expectRefused(() => emit('stop', { change: 'foo' }, noModel), /'model'/, DEC('foo'));
    // model may be null, never absent.
    expect(() => emit('stop', { change: 'foo' }, stopPayload({ model: null }))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Carried scenarios (task 3.3) — `Engine-owned spine composition and filename discipline`
// ---------------------------------------------------------------------------

const walkPayload = {
  source: 'whole-repo',
  walk_mode: 'per_finding',
  resolutions: [],
  final_assessment: 'Walked 1, resolved 1.',
  remaining_markers_in_scope: 0,
  model: null,
};

const cleanScorecard = {
  completeness: { critical: 0, warning: 0, suggestion: 0 },
  correctness: { critical: 0, warning: 0, suggestion: 0 },
  coherence: { critical: 0, warning: 0, suggestion: 0 },
};

const reviewPayload = (over: Record<string, unknown> = {}) => ({
  mode: 'proposal',
  reviewer_class: 'in-context',
  depth: 'full',
  passes_run: ['1'],
  passes_skipped: [],
  scorecard: {
    completeness: { critical: 0, warning: 1, suggestion: 0 },
    correctness: { critical: 0, warning: 0, suggestion: 0 },
    coherence: { critical: 0, warning: 0, suggestion: 0 },
  },
  findings: [{ severity: 'WARNING', dimension: 'completeness', title: 'A finding', file: 'a.md', line: 1, recommendation: 'fix it' }],
  stale_suppressed: [],
  model: 'test-model',
  ...over,
});

describe('carried: Engine-owned spine composition and filename discipline', () => {
  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: Anchor-less walk persists through the bare project scope
  it('a bare address-reviews walk lands at orbit/.orbit-runs with change null', () => {
    const r = emit('address-reviews', {}, walkPayload);
    expect(path.relative(root, r.path)).toMatch(/^orbit\/\.orbit-runs\/address-reviews-.*\.json$/);
    expect(r.emit.change).toBeNull();
    expect(r.emit.kind).toBe('editorial');
  });

  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: Archived-change walk persists to the archived trail
  it('a walk of a name found only in the archive lands on the lexically greatest archived trail', () => {
    fs.mkdirSync(path.join(root, 'orbit/changes/archive/2026-07-01-old'), { recursive: true });
    fs.mkdirSync(path.join(root, 'orbit/changes/archive/2026-08-01-old'), { recursive: true });
    const r = emit('address-reviews', { change: 'old' }, { ...walkPayload, source: 'from-file' });
    expect(path.relative(root, r.path)).toMatch(/^orbit\/changes\/archive\/2026-08-01-old\/\.orbit-runs\/address-reviews-/);
  });

  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: Traversal-shaped targets never write
  it('a target carrying separators, .. or a leading dot fails before resolution and writes nothing', () => {
    const before = fs.readdirSync(root).sort();
    for (const bad of ['../elsewhere', 'a/b', '..', '.hidden']) {
      expect(() => emit('explore', { change: bad }, { final_assessment: 'x', model: null })).toThrow(/canonical workstream name/);
      expect(() => emit('ledger', { change: bad }, ledgerPayload())).toThrow(/canonical workstream name/);
    }
    expect(fs.readdirSync(root).sort()).toEqual(before);
    expect(fs.existsSync(path.join(root, 'orbit/explore'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'orbit/changes'))).toBe(false);
  });

  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: Collision bumps forward
  it('a token any trail file carries advances one second at a time, and the timestamp matches', () => {
    makeChange('foo');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T10:00:00Z'));
    write('orbit/changes/foo/.orbit-runs/verify-2026-08-05T10-00-00Z.json', '{}');
    write('orbit/changes/foo/.orbit-runs/external-prompt-proposal-2026-08-05T10-00-01Z.md', '# p\n');
    const r = emit('review', { change: 'foo' }, reviewPayload());
    expect(path.basename(r.path)).toBe('review-proposal-2026-08-05T10-00-02Z.json');
    expect(r.emit.timestamp).toBe('2026-08-05T10:00:02Z');
  });

  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: A same-second walk precedes the review written after it
  it('a review in the same second as a walk is bumped past it and computes VERIFICATION', () => {
    makeChange('foo');
    const RUNS = 'orbit/changes/foo/.orbit-runs';
    write(`${RUNS}/review-system-2026-08-05T09-00-00Z.json`, JSON.stringify({ command: 'review', mode: 'system', reviewer_class: 'fresh', findings: [] }));
    write(
      `${RUNS}/address-reviews-2026-08-05T10-00-00Z.json`,
      JSON.stringify({ command: 'address-reviews', source_path: `${RUNS}/review-system-2026-08-05T09-00-00Z.json`, resolutions: [{ severity: 'WARNING', outcome: 'stale', title: 'S', file: 's.md' }] })
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T10:00:00Z'));
    const r = emit('review', { change: 'foo' }, reviewPayload({ mode: 'system', verification: [] }));
    expect(path.basename(r.path)).toBe('review-system-2026-08-05T10-00-01Z.json');
    expect((r.emit as any).pass_genre).toBe('VERIFICATION');
  });

  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: Trail location per command
  it('explore, change-scoped, architecture, bare audit-drift and archive each land in their trail', () => {
    write('orbit/explore/ex/explore.md', '## Decisions\n\n## Open questions\n');
    makeChange('foo');
    const explore = emit('explore', { change: 'ex' }, { final_assessment: 'x', model: null });
    expect(path.relative(root, explore.path)).toMatch(/^orbit\/explore\/ex\/\.orbit-runs\/explore-/);
    const verify = emit('verify', { change: 'foo' }, { final_assessment: 'ok', model: null });
    expect(path.relative(root, verify.path)).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/verify-/);
    const arch = emit('architect', { doc: 'prog' }, {
      final_assessment: 's', model: null,
      handoff: { boot_sequence: ['a'], next_command: '/orbit:architect prog', model_hint: null, seam: 's' },
    });
    expect(path.relative(root, arch.path)).toMatch(/^orbit\/architecture\/\.orbit-runs\/architect-/);
    const drift = emit('audit-drift', {}, { final_assessment: 'clean', findings: [], model: null });
    expect(path.relative(root, drift.path)).toMatch(/^orbit\/\.orbit-runs\/audit-drift-/);
    write('orbit/changes/archive/2026-08-03-done/proposal.md', 'p');
    const archive = emit('archive', { change: 'done' }, { final_assessment: 'archived', model: null });
    expect(path.relative(root, archive.path)).toMatch(/^orbit\/changes\/archive\/2026-08-03-done\/\.orbit-runs\/archive-/);
  });

  // @scenario behaviour orbit-emit-composition :: Engine-owned spine composition and filename discipline :: Project-scope emit takes no target flag
  it('bare audit-drift is project-scoped, --change foo change-scoped, --doc a usage error', () => {
    makeChange('foo');
    const bare = emit('audit-drift', {}, { final_assessment: 'clean', findings: [], model: null });
    expect(path.relative(root, bare.path)).toMatch(/^orbit\/\.orbit-runs\/audit-drift-/);
    expect(bare.emit.change).toBeNull();
    const scoped = emit('audit-drift', { change: 'foo' }, { final_assessment: 'clean', findings: [], model: null });
    expect(path.relative(root, scoped.path)).toMatch(/^orbit\/changes\/foo\/\.orbit-runs\/audit-drift-/);
    expect(() => emit('audit-drift', { doc: 'prog' }, { final_assessment: 'clean', findings: [], model: null })).toThrow(/--doc is not a valid target/);
  });
});

// ---------------------------------------------------------------------------
// Carried scenarios (task 3.3) — `Write-gate validation via the shared normalizers`
// ---------------------------------------------------------------------------

describe('carried: Write-gate validation via the shared normalizers', () => {
  const RUNS = 'orbit/changes/foo/.orbit-runs';
  const FRESH = '2026-01-01T10-00-00Z';
  const EXTERNAL = '2026-01-01T11-00-00Z';

  function seedPasses(): void {
    write(`${RUNS}/review-system-${FRESH}.json`, JSON.stringify({ command: 'review', mode: 'system', reviewer_class: 'fresh', findings: [] }));
    write(
      `${RUNS}/external-system-${EXTERNAL}.md`,
      '# External Review: foo (iteration 1)\n\n**Reviewer**: M\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
    );
  }

  const readiness = (formed_against: string[]) => ({
    kind: 'readiness',
    disposition: 'ready',
    formed_against,
    reasoning: 'the pair returned',
    ratified_by: 'ai',
    accepted: [{ claim: 'c', why: 'w' }],
  });

  const proceed = (formed_against: string[]) => ({
    kind: 'continuation',
    disposition: 'proceed',
    formed_against,
    reasoning: 'proceeded',
    ratified_by: 'user',
    gate: 'review-proposal',
    gate_state: 'unpassed',
    gate_reason: 'r',
  });

  const ARCHIVED_RUNS = 'orbit/changes/archive/2026-01-02-foo/.orbit-runs';
  function moveToArchive(): void {
    fs.mkdirSync(path.join(root, ARCHIVED_RUNS), { recursive: true });
    fs.cpSync(path.join(root, RUNS), path.join(root, ARCHIVED_RUNS), { recursive: true });
    fs.rmSync(path.join(root, 'orbit/changes/foo'), { recursive: true, force: true });
  }

  const archive = (judgements?: unknown) =>
    emit('archive', { change: 'foo' }, {
      model: 'm',
      final_assessment: 'archived',
      ...(judgements === undefined ? {} : { judgements }),
    });

  const apply = (judgements: unknown) => emit('apply', { change: 'foo' }, { model: 'm', judgements });

  beforeEach(() => {
    makeChange('foo');
  });

  const applyEmits = () => ls(RUNS).filter(f => f.startsWith('apply-'));

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: Scorecard/findings mismatch refused at write
  it('a scorecard of zero warnings over a WARNING finding is refused naming the cell; stdout-free, no file', () => {
    expect(() => emit('review', { change: 'foo' }, reviewPayload({ scorecard: cleanScorecard }))).toThrow(/completeness/);
    expect(ls(RUNS).filter(f => f.startsWith('review-'))).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: Forged single-line slot refused at write
  it('a finding title with an embedded newline is refused naming the slot', () => {
    const findings = [{ severity: 'WARNING', dimension: 'completeness', title: 'one\ntwo', file: 'a.md', line: 1, recommendation: 'r' }];
    expect(() => emit('review', { change: 'foo' }, reviewPayload({ findings }))).toThrow(/title/);
    expect(ls(RUNS).filter(f => f.startsWith('review-'))).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: Architecture-mode review emit passes the mode-scoped gate
  it('an architecture-mode review writes with change null + doc; a missing handoff is refused naming it', () => {
    const handoff = { boot_sequence: ['a'], next_command: '/orbit:architect prog', model_hint: null, seam: 's' };
    const r = emit('review', { doc: 'prog' }, reviewPayload({ mode: 'architecture', handoff }));
    expect(r.emit.change).toBeNull();
    expect(r.emit.doc).toBe('prog');
    expect(() => emit('review', { doc: 'prog' }, reviewPayload({ mode: 'architecture' }))).toThrow(/handoff/);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: A readiness record citing a LATER pass is refused
  it('an archive readiness entry citing a later token is refused naming both tokens', () => {
    seedPasses();
    moveToArchive();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T09:00:00Z'));
    expect(() => archive([readiness(['2099-01-01T00-00-00Z'])])).toThrow(/'2099-01-01T00-00-00Z'.*'2026-06-01T09-00-00Z'/);
    expect(ls(ARCHIVED_RUNS).filter(f => f.startsWith('archive-'))).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: A record citing its own timestamp exactly is refused
  it('a citation equal to the emit token is refused', () => {
    seedPasses();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    // The clock's token equals FRESH's, so the bump carries the emit to 10-00-01 — cite that.
    expect(() => apply([proceed(['2026-01-01T10-00-01Z'])])).toThrow(/not STRICTLY earlier/);
    expect(applyEmits()).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: An unresolvable citation is refused rather than skipped
  it('a token matching no readable pass is refused naming it', () => {
    seedPasses();
    expect(() => apply([proceed(['2025-01-01T00-00-00Z'])])).toThrow(/'2025-01-01T00-00-00Z' is unresolvable/);
    expect(applyEmits()).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: The check runs per entry, not over a merged set
  it('the second entry is refused by index though the first is valid', () => {
    seedPasses();
    expect(() => apply([proceed([FRESH]), proceed(['2099-01-01T00-00-00Z'])])).toThrow(/judgements\[1\].*2099-01-01T00-00-00Z/);
    expect(applyEmits()).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: An empty citation is refused when the trail contradicts it
  it('an empty formed_against is refused naming the latest preceding independent pass and the index', () => {
    seedPasses();
    let msg = '';
    try {
      apply([proceed([])]);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/judgements\[0\]/);
    expect(msg).toContain(EXTERNAL);
    expect(msg).not.toContain(FRESH);
    expect(applyEmits()).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: An empty citation is accepted when the trail bears it out
  it('an empty formed_against is accepted when no independent pass precedes', () => {
    const r = apply([proceed([])]);
    expect(JSON.parse(fs.readFileSync(r.path, 'utf-8')).judgements[0].formed_against).toEqual([]);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: Sufficiency above zero remains outside the engine
  it('citing one of two preceding independent passes is accepted', () => {
    seedPasses();
    const r = apply([proceed([FRESH])]);
    expect(fs.existsSync(r.path)).toBe(true);
  });

  // @scenario behaviour orbit-emit-composition :: Write-gate validation via the shared normalizers :: A payload with no judgement record is not ordering-checked
  it('an emit with no judgements key writes as before, with no judgements on the record', () => {
    seedPasses();
    moveToArchive();
    const r = archive(undefined);
    expect('judgements' in JSON.parse(fs.readFileSync(r.path, 'utf-8'))).toBe(false);
  });
});
