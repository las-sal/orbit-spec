import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit } from '../../src/core/emit-composition.js';

/**
 * rc08a-sweep-evidence: the walk write gate's resolution-level checks
 * (`orbit-emit-composition`'s `The walk write gate checks sweep evidence` and
 * `A ripple-miss pointer resolves and is counted`; the shapes are `orbit-address-reviews`').
 */

let root: string;
const CH = 'orbit/changes/foo';
const RUNS = `${CH}/.orbit-runs`;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function makeChange(dir = CH): void {
  write(`${dir}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(`${dir}/design.md`, '# Design\n\nsixteen blocks are carried.\n');
  write(`${dir}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(`${dir}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [ ] 1.1 do a thing\n');
  write(`${dir}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 3\n');
}

function listRuns(rel = RUNS): string[] {
  const dir = path.join(root, rel);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

const emptySweep = () => ({ retired: [], introduced: [], searched: [], scope: [], kept: [] });

const entry = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  severity: 'WARNING',
  title: 'T',
  file: 'design.md',
  outcome: 'resolved',
  ripple_cascade: { applied: [], flagged_not_applied: [] },
  sweep: emptySweep(),
  ...overrides,
});

const payload = (resolutions: unknown[], extra: Record<string, unknown> = {}) => ({
  source: 'from-file',
  source_path: `${RUNS}/review-proposal-2026-10-05T00-00-00Z.json`,
  walk_mode: 'per_finding',
  resolutions,
  final_assessment: 'Walked.',
  model: null,
  ...extra,
});

const emit = (resolutions: unknown[], extra: Record<string, unknown> = {}, target: Record<string, string> = { change: 'foo' }) =>
  composeAndWriteEmit('address-reviews', target, payload(resolutions, extra), { projectRoot: root });

/** Asserts a refusal that writes nothing to the trail. */
function refused(fn: () => unknown, pattern: RegExp, runs = RUNS): void {
  const before = listRuns(runs);
  expect(fn).toThrow(pattern);
  expect(listRuns(runs)).toEqual(before);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-walk-sweep-'));
  makeChange();
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('The walk write gate checks sweep evidence — shape', () => {
  // @scenario behaviour orbit-emit-composition :: The walk write gate checks sweep evidence :: A resolved entry without sweep is refused
  it('refuses a resolved entry without sweep, naming resolutions[<i>].sweep', () => {
    const e = entry();
    delete e.sweep;
    refused(() => emit([entry({ title: 'ok' }), e]), /resolutions\[1\]\.sweep/);
  });

  // @scenario behaviour orbit-emit-composition :: The walk write gate checks sweep evidence :: A legacy status key without outcome is refused
  it('refuses a status-only entry with no outcome, naming the entry and outcome', () => {
    const e = entry({ status: 'resolved' });
    delete e.outcome;
    delete e.sweep;
    refused(() => emit([e]), /resolutions\[0\].*outcome/);
  });

  // @scenario behaviour orbit-emit-composition :: The walk write gate checks sweep evidence :: A stale entry with a sweep is refused
  it('refuses a sweep on a stale entry', () => {
    refused(() => emit([entry({ outcome: 'stale' })]), /resolutions\[0\]/);
  });

  // @scenario behaviour orbit-address-reviews :: A resolved walk entry records its sweep evidence :: A stale entry carries no sweep
  it('writes a stale entry carrying no sweep', () => {
    const e = entry({ outcome: 'stale' });
    delete e.sweep;
    expect(() => emit([e])).not.toThrow();
  });

  // @scenario behaviour orbit-address-reviews :: A resolved walk entry records its sweep evidence :: A resolved entry carries all five keys
  it('refuses a sweep without exactly the five keys, or with a malformed element', () => {
    const missing: any = emptySweep();
    delete missing.kept;
    refused(() => emit([entry({ sweep: missing })]), /sweep/);
    refused(() => emit([entry({ sweep: { ...emptySweep(), extra: [] } })]), /sweep/);
    refused(() => emit([entry({ sweep: { ...emptySweep(), retired: 'x' } })]), /retired/);
    refused(() => emit([entry({ sweep: { ...emptySweep(), retired: [''] } })]), /retired/);
    refused(() => emit([entry({ sweep: { ...emptySweep(), searched: [3] } })]), /searched/);
    refused(() => emit([entry({ sweep: { ...emptySweep(), introduced: [{ path: 'design.md' }] } })]), /introduced/);
    refused(() => emit([entry({ sweep: { ...emptySweep(), kept: [{ path: 'design.md', why: '' }] } })]), /kept/);
    refused(() => emit([entry({ sweep: { ...emptySweep(), kept: [{ path: 'design.md', why: 'w', x: 1 }] } })]), /kept/);
    refused(() => emit([entry({ sweep: [] })]), /sweep/);
  });

  // @scenario behaviour orbit-address-reviews :: A resolved walk entry records its sweep evidence :: Nothing to retire is written, not omitted
  it('writes a sweep whose arrays are all empty, and one with only introduced text', () => {
    expect(() => emit([entry()])).not.toThrow();
    expect(() =>
      emit([entry({ sweep: { ...emptySweep(), introduced: [{ path: `${CH}/design.md`, text: 'sixteen blocks' }] } })])
    ).not.toThrow();
  });
});

describe('The walk write gate checks sweep evidence — retired / introduced / scope', () => {
  // @scenario behaviour orbit-emit-composition :: The walk write gate checks sweep evidence :: A surviving retired string refuses the log
  it('refuses a retired string surviving wrapped across two lines, naming entry, string, path and first line', () => {
    const lines = Array.from({ length: 11 }, (_, i) => `line ${i + 1}`);
    write(`${CH}/proposal.md`, [...lines, 'we carry seventeen', 'blocks in total', ''].join('\n'));
    const e = entry({ sweep: { ...emptySweep(), retired: ['seventeen blocks'] } });
    let msg = '';
    try {
      emit([e]);
    } catch (err) {
      msg = (err as Error).message;
    }
    expect(msg).toMatch(/resolutions\[0\]/);
    expect(msg).toContain('T');
    expect(msg).toContain('seventeen blocks');
    expect(msg).toContain('proposal.md');
    expect(msg).toMatch(/:12\b|line 12\b/);
    expect(listRuns()).toEqual([]);
  });

  it('matches case-sensitively', () => {
    write(`${CH}/proposal.md`, 'Seventeen Blocks\n');
    expect(() => emit([entry({ sweep: { ...emptySweep(), retired: ['seventeen blocks'] } })])).not.toThrow();
  });

  // @scenario behaviour orbit-emit-composition :: The walk write gate checks sweep evidence :: A kept path is not searched
  // @scenario behaviour orbit-address-reviews :: A resolved walk entry records its sweep evidence :: History that quotes the old wording is kept
  it('writes when the retired string survives only in a kept path', () => {
    write(`${CH}/explore.md`, '# Explore\n\nwe first wrote seventeen blocks\n');
    const sweep = { ...emptySweep(), retired: ['seventeen blocks'], kept: [{ path: `${CH}/explore.md`, why: 'Decisions history' }] };
    expect(() => emit([entry({ sweep })])).not.toThrow();
    // Without the kept entry the same log is refused.
    refused(() => emit([entry({ sweep: { ...sweep, kept: [] } })]), /explore\.md/);
  });

  it('never searches the change trail', () => {
    write(`${RUNS}/review-proposal-2026-10-05T00-00-00Z.json`, JSON.stringify({ note: 'seventeen blocks' }));
    expect(() => emit([entry({ sweep: { ...emptySweep(), retired: ['seventeen blocks'] } })])).not.toThrow();
  });

  it('searches the entry file, cascade paths and sweep.scope outside the change directory', () => {
    write('src/a.ts', '// seventeen blocks\n');
    write('docs/b.md', 'seventeen blocks\n');
    write('notes/c/d.md', 'seventeen blocks\n');
    const retired = { ...emptySweep(), retired: ['seventeen blocks'] };
    refused(() => emit([entry({ file: 'src/a.ts', sweep: retired })]), /src\/a\.ts/);
    refused(() => emit([entry({ ripple_cascade: { applied: ['docs/b.md'], flagged_not_applied: [] }, sweep: retired })]), /docs\/b\.md/);
    refused(() => emit([entry({ sweep: { ...retired, scope: ['notes'] } })]), /notes\/c\/d\.md/);
  });

  // @scenario behaviour orbit-emit-composition :: The walk write gate checks sweep evidence :: An introduced text that did not land refuses the log
  it('refuses an introduced text absent from its path, naming entry, path and text', () => {
    refused(
      () => emit([entry({ sweep: { ...emptySweep(), introduced: [{ path: `${CH}/design.md`, text: 'fifteen blocks' }] } })]),
      /resolutions\[0\][\s\S]*design\.md[\s\S]*fifteen blocks|resolutions\[0\][\s\S]*fifteen blocks[\s\S]*design\.md/
    );
    refused(
      () => emit([entry({ sweep: { ...emptySweep(), introduced: [{ path: `${CH}/nope.md`, text: 'x' }] } })]),
      /nope\.md/
    );
  });

  it('matches an introduced text wrapped across lines', () => {
    write(`${CH}/design.md`, '# Design\n\nsixteen\n   blocks\n');
    expect(() =>
      emit([entry({ sweep: { ...emptySweep(), introduced: [{ path: 'design.md', text: 'sixteen blocks' }] } })])
    ).not.toThrow();
  });

  it('refuses a sweep.scope or sweep.kept path that resolves to nothing', () => {
    refused(() => emit([entry({ sweep: { ...emptySweep(), scope: ['missing/dir'] } })]), /missing\/dir/);
    // System walk 1 (fresh W1): a kept path is a sweep path, refused like a scope path.
    refused(() => emit([entry({ sweep: { ...emptySweep(), kept: [{ path: 'does/not/exist.md', why: 'w' }] } })]), /sweep\.kept[\s\S]*does\/not\/exist\.md/);
  });

  // @scenario behaviour orbit-emit-composition :: The walk write gate checks sweep evidence :: A free-text ripple path is skipped with a warning
  it('writes with a stderr warning when a free-text ripple path resolves to nothing, still checking the rest', () => {
    const r = emit([entry({ ripple_cascade: { applied: ['.openspec.yaml fingerprint (13th stamp)'], flagged_not_applied: [] } })]);
    expect(r.warnings.join('\n')).toContain('.openspec.yaml fingerprint (13th stamp)');
    write('docs/b.md', 'seventeen blocks\n');
    refused(
      () =>
        emit([
          entry({
            ripple_cascade: { applied: ['.openspec.yaml fingerprint (13th stamp)', 'docs/b.md'], flagged_not_applied: [] },
            sweep: { ...emptySweep(), retired: ['seventeen blocks'] },
          }),
        ]),
      /docs\/b\.md/
    );
  });

  it('skips a file of design.md:40 (section) with a warning — the suffix is not stripped', () => {
    const r = emit([entry({ file: 'design.md:40 (section)' })]);
    expect(r.warnings.join('\n')).toContain('design.md:40 (section)');
  });

  it('resolves a change-relative file and an orbit/changes/<name>/ cascade path; strips :line[:col]', () => {
    write(`${CH}/specs/cap/spec.md`, 'keep\n');
    const sweep = { ...emptySweep(), introduced: [{ path: 'specs/cap/spec.md:3:7', text: 'keep' }, { path: `${CH}/design.md:2`, text: 'sixteen blocks' }] };
    const r = emit([entry({ file: 'specs/cap/spec.md:3', ripple_cascade: { applied: [`${CH}/design.md`], flagged_not_applied: [] }, sweep })]);
    expect(r.warnings).toEqual([]);
  });

  it('refuses a path that escapes the project root', () => {
    fs.writeFileSync(path.join(path.dirname(root), `${path.basename(root)}-outside.md`), 'x\n');
    refused(
      () => emit([entry({ sweep: { ...emptySweep(), scope: [`../${path.basename(root)}-outside.md`] } })]),
      /outside|contain/
    );
    refused(
      () => emit([entry({ file: `../${path.basename(root)}-outside.md` })]),
      /outside|contain/
    );
    fs.rmSync(path.join(path.dirname(root), `${path.basename(root)}-outside.md`));
  });

  it('checks an archived-fallback walk as change-scoped over the archive directory', () => {
    const arch = 'orbit/changes/archive/2026-07-01-old';
    makeChange(arch);
    write(`${arch}/proposal.md`, 'seventeen blocks\n');
    const retired = { ...emptySweep(), retired: ['seventeen blocks'] };
    refused(
      () => emit([entry({ sweep: retired })], { remaining_markers_in_scope: 0 }, { change: 'old' }),
      /proposal\.md/,
      `${arch}/.orbit-runs`
    );
    // orbit/changes/<name>/ maps to the archive directory.
    expect(() =>
      emit([entry({ sweep: { ...emptySweep(), introduced: [{ path: 'orbit/changes/old/design.md', text: 'sixteen blocks' }] } })], {}, { change: 'old' })
    ).not.toThrow();
  });

  it('a project-scoped walk checks only file, cascade and sweep.scope', () => {
    write('docs/b.md', 'seventeen blocks\n');
    const retired = { ...emptySweep(), retired: ['seventeen blocks'] };
    expect(() => emit([entry({ file: 'README.md', sweep: retired })], { remaining_markers_in_scope: 0 }, {})).not.toThrow();
    refused(() => emit([entry({ file: 'docs/b.md', sweep: retired })], { remaining_markers_in_scope: 0 }, {}), /docs\/b\.md/, 'orbit/.orbit-runs');
  });
});

describe('rc08a system walk 2 (external half): the frozen record, the never-read dirs, kept files, read failures', () => {
  const retired = (r: string, extra: Record<string, unknown> = {}) => ({ ...emptySweep(), retired: [r], ...extra });

  it('C1: the checks run on the FROZEN record — a toJSON hook cannot swap a checked entry for an unchecked one', () => {
    const unchecked = { severity: 'WARNING', title: 'T', file: 'design.md', outcome: 'resolved' };
    const resolutions: any = [entry()];
    resolutions.toJSON = () => [unchecked];
    refused(() => emit(resolutions), /resolutions\[0\]\.sweep/);
  });

  it('C1: ripple_misses is counted from the frozen record', () => {
    const resolutions: any = [entry()];
    resolutions.toJSON = () => [entry({ title: 'A' }), entry({ title: 'B' })];
    const r = emit(resolutions);
    expect(r.emit.ripple_misses).toBe(0);
    expect((r.emit.resolutions as unknown[]).length).toBe(2);
  });

  it('C2: a never-read directory named in sweep.scope, or a file beneath one, is not read', () => {
    write('dist/out.txt', 'old wording\n');
    write('node_modules/pkg/out.txt', 'old wording\n');
    expect(() => emit([entry({ sweep: retired('old wording', { scope: ['dist'] }) })])).not.toThrow();
    expect(() => emit([entry({ sweep: retired('old wording', { scope: ['node_modules/pkg/out.txt'] }) })])).not.toThrow();
    expect(() => emit([entry({ ripple_cascade: { applied: ['dist/out.txt'], flagged_not_applied: [] }, sweep: retired('old wording') })])).not.toThrow();
  });

  it('C2: a never-read name is judged inside the change directory, so a change named build is still checked', () => {
    const arch = 'orbit/changes/archive/2026-07-01-build';
    makeChange(arch);
    write(`${arch}/proposal.md`, 'old wording\n');
    refused(() => emit([entry({ sweep: retired('old wording') })], { remaining_markers_in_scope: 0 }, { change: 'build' }), /proposal\.md/, `${arch}/.orbit-runs`);
  });

  it('W1: a kept path naming a directory is refused, and a kept file exempts that file only', () => {
    write(`${CH}/proposal.md`, 'old wording\n');
    refused(() => emit([entry({ sweep: retired('old wording', { kept: [{ path: CH, why: 'history' }] }) })]), /sweep\.kept[\s\S]*directory/);
    write(`${CH}/explore.md`, 'old wording\n');
    refused(() => emit([entry({ sweep: retired('old wording', { kept: [{ path: `${CH}/explore.md`, why: 'history' }] }) })]), /proposal\.md/);
  });

  it.skipIf(typeof process.getuid === 'function' && process.getuid() === 0)('W2: an unreadable member of the check scope refuses the emit rather than reading as absent', () => {
    write(`${CH}/locked.md`, 'old wording\n');
    const locked = path.join(root, CH, 'locked.md');
    fs.chmodSync(locked, 0o000);
    try {
      refused(() => emit([entry({ sweep: retired('old wording') })]), /cannot read[\s\S]*locked\.md/);
    } finally {
      fs.chmodSync(locked, 0o644);
    }
  });

  it("W3: the pointer keys a legacy file by the reader's full normalization — whitespace beside a :line suffix", () => {
    write(`${RUNS}/address-reviews-2026-10-05T01-00-00Z.json`, JSON.stringify({ command: 'address-reviews', resolutions: [{ severity: 'WARNING', title: 'T', file: 'file.md:40 ', outcome: 'resolved' }] }));
    expect(() => emit([entry({ title: 'Later', ripple_miss_of: { walk: '2026-10-05T01-00-00Z', title: 'T', file: 'file.md', kind: 'scope' } })])).not.toThrow();
  });
});

describe('A ripple-miss pointer resolves and is counted', () => {
  const W = '2026-10-05T01-00-00Z';
  const earlier = (resolutions: unknown[]) =>
    write(`${RUNS}/address-reviews-${W}.json`, JSON.stringify({ command: 'address-reviews', resolutions }));
  const pointer = (overrides: Record<string, unknown> = {}) => ({ walk: W, title: 'T', file: 'design.md', kind: 'scope', ...overrides });

  // @scenario behaviour orbit-emit-composition :: A ripple-miss pointer resolves and is counted :: A pointer to a resolved entry of an earlier walk writes
  it('writes a pointer to a resolved entry of an earlier walk (padded title, :line file), counting 1', () => {
    earlier([{ severity: 'WARNING', title: '  T  ', file: 'design.md:40', outcome: 'resolved' }]);
    const r = emit([entry({ title: 'Later', ripple_miss_of: pointer() })]);
    expect(r.emit.ripple_misses).toBe(1);
  });

  // @scenario behaviour orbit-emit-composition :: A ripple-miss pointer resolves and is counted :: A pointer to a legacy resolved entry writes
  it('writes a pointer to a legacy status: resolved entry', () => {
    earlier([{ severity: 'WARNING', title: 'T', file: 'design.md', status: 'resolved' }]);
    expect(() => emit([entry({ title: 'Later', ripple_miss_of: pointer() })])).not.toThrow();
  });

  // @scenario behaviour orbit-emit-composition :: A ripple-miss pointer resolves and is counted :: A pointer to nothing is refused
  it('refuses a pointer to a missing walk, a missing entry, or a non-resolved entry', () => {
    refused(() => emit([entry({ title: 'Later', ripple_miss_of: pointer() })]), /ripple_miss_of/);
    earlier([
      { severity: 'WARNING', title: 'T', file: 'design.md', outcome: 'stale' },
      { severity: 'WARNING', title: 'U', file: 'design.md', outcome: 'resolved' },
    ]);
    refused(() => emit([entry({ title: 'Later', ripple_miss_of: pointer() })]), /ripple_miss_of/);
    refused(() => emit([entry({ title: 'Later', ripple_miss_of: pointer({ title: 'V' }) })]), /ripple_miss_of/);
  });

  it('refuses a pointer to a walk that does not precede this emit', () => {
    const future = '2099-01-01T00-00-00Z';
    write(`${RUNS}/address-reviews-${future}.json`, JSON.stringify({ command: 'address-reviews', resolutions: [{ severity: 'WARNING', title: 'T', file: 'design.md', outcome: 'resolved' }] }));
    refused(() => emit([entry({ title: 'Later', ripple_miss_of: pointer({ walk: future }) })]), /ripple_miss_of/);
  });

  // @scenario behaviour orbit-emit-composition :: A ripple-miss pointer resolves and is counted :: A pointer on an unresolved entry is refused
  it('refuses a pointer on a stale entry', () => {
    earlier([{ severity: 'WARNING', title: 'T', file: 'design.md', outcome: 'resolved' }]);
    const e = entry({ outcome: 'stale', ripple_miss_of: pointer() });
    delete e.sweep;
    refused(() => emit([e]), /resolutions\[0\]/);
  });

  // @scenario behaviour orbit-emit-composition :: A ripple-miss pointer resolves and is counted :: An unknown kind is refused
  it('refuses an unknown kind naming the three accepted values, and a malformed pointer', () => {
    earlier([{ severity: 'WARNING', title: 'T', file: 'design.md', outcome: 'resolved' }]);
    refused(() => emit([entry({ ripple_miss_of: pointer({ kind: 'wording' }) })]), /query[\s\S]*scope[\s\S]*judgement|scope[\s\S]*query[\s\S]*judgement/);
    refused(() => emit([entry({ ripple_miss_of: { ...pointer(), extra: 1 } })]), /ripple_miss_of/);
    refused(() => emit([entry({ ripple_miss_of: 'x' })]), /ripple_miss_of/);
  });

  // @scenario behaviour orbit-emit-composition :: A ripple-miss pointer resolves and is counted :: A walk with no attribution counts zero
  it('computes ripple_misses 0 with no attribution, and refuses a supplied ripple_misses', () => {
    const r = emit([entry()]);
    expect(r.emit.ripple_misses).toBe(0);
    refused(() => emit([entry()], { ripple_misses: 0 }), /ripple_misses/);
  });
});
