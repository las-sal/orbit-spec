import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { loadChangeContext, formatChangeStatus } from '../../src/core/artifact-graph/instruction-loader.js';

let root: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function makeChange(name: string, opts: { tasks?: string } = {}): void {
  write(`orbit/changes/${name}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(`orbit/changes/${name}/design.md`, '# Design\n');
  write(`orbit/changes/${name}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(
    `orbit/changes/${name}/tasks.md`,
    opts.tasks ?? '# Tasks\n\n## 1. Group\n\n- [ ] 1.1 do a thing\n- [ ] 1.2 do another\n'
  );
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 3\n');
}

function listRuns(rel: string): string[] {
  const dir = path.join(root, rel);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

const validReviewPayload = (overrides: Record<string, unknown> = {}) => ({
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
  findings: [
    {
      severity: 'WARNING',
      dimension: 'completeness',
      title: 'A finding',
      file: 'a.md',
      line: 1,
      recommendation: 'fix it',
    },
  ],
  stale_suppressed: [],
  model: 'test-model',
  ...overrides,
});

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-emit-'));
});

afterEach(() => {
  vi.useRealTimers();
  fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 2.1 payload contract
// ---------------------------------------------------------------------------

describe('payload contract', () => {
  it('rejects engine-owned fields naming the field, writing nothing', () => {
    makeChange('foo');
    expect(() =>
      composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ next_recommended: 'x' }), { projectRoot: root })
    ).toThrow(/next_recommended.*engine-owned/);
    expect(() =>
      composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ timestamp: 'x' }), { projectRoot: root })
    ).toThrow(/timestamp.*engine-owned/);
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('rejects unknown payload keys naming the key (pases_run)', () => {
    makeChange('foo');
    expect(() =>
      composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ pases_run: ['1'] }), { projectRoot: root })
    ).toThrow(/unknown payload key 'pases_run'/);
  });

  it('rejects a payload missing the model key; explicit null is accepted', () => {
    makeChange('foo');
    const p = validReviewPayload();
    delete (p as any).model;
    expect(() => composeAndWriteEmit('review', { change: 'foo' }, p, { projectRoot: root })).toThrow(/model/);
    const ok = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ model: null }), { projectRoot: root });
    expect(ok.emit.model).toBeNull();
  });

  it('unknown command names the supported set', () => {
    expect(() => composeAndWriteEmit('frobnicate', { change: 'foo' }, { model: null }, { projectRoot: root })).toThrow(
      /unknown emit command 'frobnicate'.*review/
    );
  });
});

// ---------------------------------------------------------------------------
// 2.2 target resolution + spine + collision
// ---------------------------------------------------------------------------

describe('target resolution and spine composition', () => {
  it('routes change / explore staging / doc / bare project to their trails with the right kind', () => {
    makeChange('foo');
    write('orbit/explore/bar/explore.md', '## Decisions\n\n- one\n\n## Open questions\n');
    write('orbit/architecture/prog.md', '# prog\n');

    const change = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'ok', model: null }, { projectRoot: root });
    expect(change.path).toContain('orbit/changes/foo/.orbit-runs/verify-');
    expect(change.emit.kind).toBe('workflow');

    const explore = composeAndWriteEmit('explore', { change: 'bar' }, { final_assessment: 'captured', model: null }, { projectRoot: root });
    expect(explore.path).toContain('orbit/explore/bar/.orbit-runs/explore-');

    const doc = composeAndWriteEmit(
      'architect',
      { doc: 'prog' },
      { final_assessment: 'session', handoff: { boot_sequence: ['a'], next_command: '/orbit:architect prog', model_hint: null, seam: 's' }, model: null },
      { projectRoot: root }
    );
    expect(doc.path).toContain('orbit/architecture/.orbit-runs/architect-');
    expect(doc.emit.change).toBeNull();
    expect(doc.emit.doc).toBe('prog');

    const project = composeAndWriteEmit('audit-drift', {}, { final_assessment: 'clean project-wide.', findings_total: 0, model: null }, { projectRoot: root });
    expect(project.path).toContain(path.join('orbit', '.orbit-runs', 'audit-drift-'));
    expect(project.emit.change).toBeNull();
    expect(project.emit.kind).toBe('editorial');
  });

  it('enforces the scope-capability usage errors', () => {
    makeChange('foo');
    write('orbit/architecture/prog.md', '# prog\n');
    const base = { final_assessment: 'x', model: null };
    expect(() => composeAndWriteEmit('apply', { doc: 'prog' }, base, { projectRoot: root })).toThrow(/--doc is not a valid target/);
    expect(() => composeAndWriteEmit('architect', { change: 'foo' }, base, { projectRoot: root })).toThrow(/--change is not a valid target/);
    expect(() => composeAndWriteEmit('review', { change: 'foo', doc: 'prog' }, base, { projectRoot: root })).toThrow(/never both/);
    expect(() => composeAndWriteEmit('verify', {}, base, { projectRoot: root })).toThrow(/requires a target/);
    expect(() => composeAndWriteEmit('verify', { change: 'nope' }, base, { projectRoot: root })).toThrow(/workstream 'nope' not found — checked/);
  });

  it('archive resolves the lexically greatest archived directory, post-move only', () => {
    write('orbit/changes/archive/2026-01-01-foo/proposal.md', 'p');
    write('orbit/changes/archive/2026-03-01-foo/proposal.md', 'p');
    write('orbit/changes/archive/2026-02-01-foobar/proposal.md', 'p');
    const r = composeAndWriteEmit(
      'archive',
      { change: 'foo' },
      { final_assessment: 'Archived foo.', archive_path: 'orbit/changes/archive/2026-03-01-foo/', model: null },
      { projectRoot: root }
    );
    expect(r.path).toContain('orbit/changes/archive/2026-03-01-foo/.orbit-runs/archive-');
    expect(r.emit.kind).toBe('lifecycle');
    expect(String(r.emit.next_recommended)).toContain('Change archived.');

    expect(() =>
      composeAndWriteEmit('archive', { change: 'missing' }, { final_assessment: 'x', model: null }, { projectRoot: root })
    ).toThrow(/no archived directory matching/);
  });

  it('collision bumps the token forward and the self-pointer names the FINAL path', () => {
    makeChange('foo');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T10:00:00Z'));
    // Pre-create the file at the exact token the clock will produce.
    write('orbit/changes/foo/.orbit-runs/review-proposal-2026-08-05T10-00-00Z.json', '{}');

    const r = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload(), { projectRoot: root });
    expect(r.path).toContain('review-proposal-2026-08-05T10-00-01Z.json');
    expect(r.emit.timestamp).toBe('2026-08-05T10:00:01Z');
    // Findings exist → the pointer names this emit's own (post-bump) path.
    expect(String(r.emit.next_recommended)).toContain('review-proposal-2026-08-05T10-00-01Z.json');
  });
});

// ---------------------------------------------------------------------------
// 2.3 deterministic facts
// ---------------------------------------------------------------------------

describe('deterministic facts', () => {
  it('review: counts sentence + findings-dependent pointer; clean → report pointer', () => {
    makeChange('foo');
    const withFindings = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload(), { projectRoot: root });
    expect(withFindings.emit.final_assessment).toBe('0 critical, 1 warning, 0 suggestion.');
    expect(String(withFindings.emit.next_recommended)).toMatch(/^\/orbit:address-reviews foo --from-file /);

    const clean = composeAndWriteEmit(
      'review',
      { change: 'foo' },
      validReviewPayload({
        scorecard: {
          completeness: { critical: 0, warning: 0, suggestion: 0 },
          correctness: { critical: 0, warning: 0, suggestion: 0 },
          coherence: { critical: 0, warning: 0, suggestion: 0 },
        },
        findings: [],
      }),
      { projectRoot: root }
    );
    expect(clean.emit.final_assessment).toBe('No findings.');
    expect(clean.emit.next_recommended).toBe('orbit status --change foo --report');
    // Iteration: second pass on the shared axis.
    expect(clean.emit.iteration).toBe(2);
  });

  it('T0: paste/save/ingest template from prompt_path, awaiting_findings engine-set', () => {
    makeChange('foo');
    const r = composeAndWriteEmit(
      'review-external',
      { change: 'foo' },
      { mode: 'proposal', prompt_path: 'orbit/changes/foo/.orbit-runs/external-prompt-proposal-2026-08-05T10-00-00Z.md', target: null, final_assessment: 'packaged', model: null },
      { projectRoot: root }
    );
    expect(r.emit.awaiting_findings).toBe(true);
    const nr = String(r.emit.next_recommended);
    expect(nr.startsWith('Paste ')).toBe(true);
    expect(nr).toContain('then /orbit:address-reviews foo --from-file');
  });

  it('explore: counts computed from the file, maturity grid recommendation, missing-section note', () => {
    write('orbit/explore/bar/explore.md', '## Decisions\n\n- d1\n- d2\n- d3\n- d4\n- d5\n\n## Open questions\n\n- q1\n  Standing recommendation: lean A\n- q2\n  Standing recommendation: none yet\n- q3\n  Standing recommendation: ship it\n');
    const r = composeAndWriteEmit('explore', { change: 'bar' }, { final_assessment: 'boundary', model: null }, { projectRoot: root });
    expect(r.emit.decisions_captured).toBe(5);
    expect(r.emit.open_questions_count).toBe(3);
    expect(r.emit.open_questions_with_recommendation).toBe('2 of 3');
    // Stalled: 5 decisions, 3 open questions.
    expect(String(r.emit.next_recommended)).toContain('5 decisions captured but 3 open questions remain');
    expect(r.warnings).toEqual([]);

    write('orbit/explore/baz/explore.md', '## Decisions\n\n- only\n');
    const missing = composeAndWriteEmit('explore', { change: 'baz' }, { final_assessment: 'begin', model: null }, { projectRoot: root });
    expect(missing.emit.open_questions_with_recommendation).toBe('0 of 0');
    expect(missing.warnings.some(w => w.includes("Open questions"))).toBe(true);
  });

  it('architect: spine next_recommended mirrors handoff.next_command verbatim', () => {
    write('orbit/architecture/prog.md', '# prog\n');
    const r = composeAndWriteEmit(
      'architect',
      { doc: 'prog' },
      { final_assessment: 's', handoff: { boot_sequence: ['CLAUDE.md'], next_command: '/orbit:architect prog — resume stage d6', model_hint: null, seam: 'post-session' }, model: null },
      { projectRoot: root }
    );
    expect(r.emit.next_recommended).toBe('/orbit:architect prog — resume stage d6');
  });

  it('verify: pass and fail-mode recommendations per the baseline rules', () => {
    makeChange('foo');
    const pass = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'clean', verdict: 'pass', model: null }, { projectRoot: root });
    expect(String(pass.emit.next_recommended)).toMatch(/^\/orbit:review --as system foo/);
    expect(String(pass.emit.next_recommended)).toContain('/orbit:archive foo');

    const failTasks = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'incomplete', verdict: 'fail', fail_mode: 'tasks-incomplete', model: null }, { projectRoot: root });
    expect(String(failTasks.emit.next_recommended)).toMatch(/^\/orbit:apply foo — 2 tasks remaining/);

    const failValidator = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'broken', verdict: 'fail', fail_mode: 'validator-error', validator_message: 'bad frontmatter', model: null }, { projectRoot: root });
    expect(String(failValidator.emit.next_recommended)).toBe('Fix artifact validation errors: bad frontmatter');

    const failScenarios = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'gaps', verdict: 'fail', fail_mode: 'scenarios-fail', scenarios_failed: 3, model: null }, { projectRoot: root });
    expect(String(failScenarios.emit.next_recommended)).toBe(
      '/orbit:review --as system foo — 3 spec scenarios fail against implementation; system review will surface findings in its scorecard for you to walk each as code fix or spec revision'
    );
    expect(failScenarios.emit.scenarios_failed).toBeUndefined();
  });

  it('verify: warn state and incomplete run are truthful records, never clean (baseline warn/out-of-scope rules)', () => {
    makeChange('foo');
    const warn = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'passed with warnings', verdict: 'pass', fail_mode: 'warnings', warnings_count: 2, model: null }, { projectRoot: root });
    expect(String(warn.emit.next_recommended)).toBe(
      '/orbit:review --as system foo — verification passed with 2 warnings; system review recommended'
    );
    expect(warn.emit.warnings_count).toBeUndefined();

    // A warn-state record without its count fails loud — never a plausible 'clean'.
    expect(() =>
      composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'passed with warnings', verdict: 'pass', fail_mode: 'warnings', model: null }, { projectRoot: root })
    ).toThrow(/warnings_count/);

    const incomplete = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'aborted', verdict: 'fail', fail_mode: 'incomplete', model: null }, { projectRoot: root });
    expect(String(incomplete.emit.next_recommended)).toBe(
      'Re-run /orbit:verify foo — prior verify run incomplete (see verify-change output for details)'
    );
  });

  it('audit-drift change-scoped: findings → address pointer; clean → defer to prior emit verbatim', () => {
    makeChange('foo');
    write(
      'orbit/changes/foo/.orbit-runs/apply-2026-08-01T10-00-00Z.json',
      JSON.stringify({ command: 'apply', next_recommended: '/orbit:apply foo — chunk 3 of 5 done' })
    );
    const dirty = composeAndWriteEmit('audit-drift', { change: 'foo' }, { final_assessment: '3 drifts.', findings_total: 3, model: null }, { projectRoot: root });
    expect(String(dirty.emit.next_recommended)).toMatch(/^\/orbit:address-reviews foo — 3 drift\(s\) detected/);

    const clean = composeAndWriteEmit('audit-drift', { change: 'foo' }, { final_assessment: 'drift check clean; deferring to prior workflow state.', findings_total: 0, model: null }, { projectRoot: root });
    // Defers to the most recent prior emit (the just-written dirty audit-drift is prior now).
    expect(String(clean.emit.next_recommended)).toMatch(/^\/orbit:address-reviews foo — 3 drift/);
  });

  it('propose family: propose-shaped vs completion-aware recommendations', () => {
    makeChange('foo');
    const propose = composeAndWriteEmit('propose', { change: 'foo' }, { final_assessment: 'generated', model: null }, { projectRoot: root });
    expect(String(propose.emit.next_recommended)).toMatch(/^\/orbit:review foo — proposal artifacts ready/);

    const cont = composeAndWriteEmit('continue', { change: 'foo' }, { final_assessment: 'generated', model: null }, { projectRoot: root });
    // The fixture change has all four artifacts → isComplete → review.
    expect(String(cont.emit.next_recommended)).toMatch(/^\/orbit:review foo — all proposal artifacts now present/);
  });
});

// ---------------------------------------------------------------------------
// 2.4 atomic next_recommended (post-write semantics)
// ---------------------------------------------------------------------------

describe('post-write semantics (synthetic trail, single atomic write)', () => {
  it('address-reviews: stamped next_recommended equals the engine next_command computed AFTER landing', () => {
    makeChange('foo');
    // A review pass with findings sits unresolved on the trail.
    composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload(), { projectRoot: root });
    const reviewFile = listRuns('orbit/changes/foo/.orbit-runs').find(f => f.startsWith('review-proposal-'))!;

    const r = composeAndWriteEmit(
      'address-reviews',
      { change: 'foo' },
      {
        source: 'from-file',
        source_path: `orbit/changes/foo/.orbit-runs/${reviewFile}`,
        walk_mode: 'per_finding',
        input_findings_summary: { critical: 0, warning: 1, suggestion: 0 },
        pushback_verification: '1 verified',
        resolution_summary: { resolved: 1, stale_suppressed: 0, deferred: 0, escalated: 0 },
        resolutions: [],
        final_assessment: 'All findings resolved.',
        model: null,
      },
      { projectRoot: root }
    );

    // Byte-equality with the engine's post-landing next_command, by construction.
    const context = loadChangeContext(root, 'foo');
    const after = formatChangeStatus(context);
    expect(r.emit.next_recommended).toBe(after.next_command);
    expect(r.emit.iteration).toBe(1);
  });

  it('a gate failure mid-composition leaves NO file on the trail (two-sided snapshot)', () => {
    makeChange('foo');
    const before = listRuns('orbit/changes/foo/.orbit-runs');
    // final_assessment missing → the universal spine gate refuses the complete candidate.
    expect(() =>
      composeAndWriteEmit(
        'address-reviews',
        { change: 'foo' },
        { source: 'from-file', source_path: 'x.json', walk_mode: 'per_finding', resolutions: [], model: null },
        { projectRoot: root }
      )
    ).toThrow(/final_assessment/);
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual(before);
  });

  it('address-reviews bare = project scope; archived names fall back to the archived trail (triple-scope)', () => {
    // Bare: the anchor-less whole-repo walk lands on orbit/.orbit-runs with change null.
    const walkPayload = {
      source: 'whole-repo', walk_mode: 'per_finding', resolutions: [],
      final_assessment: 'Walked 2, resolved 2.', remaining_markers_in_scope: 3, model: null,
    };
    const bare = composeAndWriteEmit('address-reviews', {}, walkPayload, { projectRoot: root });
    expect(bare.path).toContain(path.join('orbit', '.orbit-runs'));
    expect(bare.emit.change).toBeNull();
    expect(String(bare.emit.next_recommended)).toBe('/orbit:address-reviews — 3 marker(s) remain in scope');

    const clean = composeAndWriteEmit(
      'address-reviews', {},
      { ...walkPayload, remaining_markers_in_scope: 0 },
      { projectRoot: root }
    );
    expect(String(clean.emit.next_recommended)).toBe('No markers remain in scope; the project trail records this walk.');

    // The count DRIVES an engine fact — missing/NaN/fractional/negative all fail loud, no file.
    const runsBefore = fs.existsSync(path.join(root, 'orbit/.orbit-runs'))
      ? fs.readdirSync(path.join(root, 'orbit/.orbit-runs')).length
      : 0;
    for (const bad of [undefined, 'three' as any, NaN, 1.5, -1]) {
      const p: any = { ...walkPayload };
      if (bad === undefined) delete p.remaining_markers_in_scope;
      else p.remaining_markers_in_scope = bad;
      expect(() => composeAndWriteEmit('address-reviews', {}, p, { projectRoot: root })).toThrow(
        /remaining_markers_in_scope/
      );
    }
    expect(fs.readdirSync(path.join(root, 'orbit/.orbit-runs')).length).toBe(runsBefore);

    // Archived fallback: a name existing only under archive/ resolves to the archived trail.
    fs.mkdirSync(path.join(root, 'orbit/changes/archive/2026-07-01-old-change'), { recursive: true });
    const archived = composeAndWriteEmit(
      'address-reviews',
      { change: 'old-change' },
      { ...walkPayload, source: 'from-file', remaining_markers_in_scope: 0 },
      { projectRoot: root }
    );
    expect(archived.path).toContain(path.join('archive', '2026-07-01-old-change', '.orbit-runs'));
    expect(archived.emit.change).toBe('old-change');
    expect(String(archived.emit.next_recommended)).toContain('archived trail records the resolution log');
  });

  it('target names are contained identifiers: traversal, separators, absolute forms, and symlink escapes never write (no-write regressions)', () => {
    makeChange('foo');
    const outside = path.join(root, 'outside-target');
    fs.mkdirSync(outside, { recursive: true });
    const payload = { final_assessment: 'x.', model: null };

    // Traversal / separator / absolute / dot forms — rejected at the name rule,
    // regardless of whether the joined path would exist.
    for (const bad of ['../outside-target', 'a/b', '..', '.hidden', `${path.sep}abs`, '../../etc']) {
      expect(() =>
        composeAndWriteEmit('explore', { change: bad }, payload, { projectRoot: root })
      ).toThrow(/canonical workstream name/);
    }
    expect(() =>
      composeAndWriteEmit('review', { doc: '../outside-target' }, { mode: 'architecture', reviewer_class: 'in-context', model: null }, { projectRoot: root })
    ).toThrow(/canonical doc name/);
    // Nothing was written outside the orbit roots.
    expect(fs.readdirSync(outside)).toEqual([]);
    expect(fs.existsSync(path.join(root, '.orbit-runs'))).toBe(false);

    // Symlink escape: a workstream dir pointing outside orbit/changes is refused.
    const evil = path.join(root, 'orbit', 'changes', 'evil');
    fs.symlinkSync(outside, evil, 'dir');
    expect(() =>
      composeAndWriteEmit('explore', { change: 'evil' }, payload, { projectRoot: root })
    ).toThrow(/resolves outside/);
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  it('a symlinked .orbit-runs CHILD never carries a write outside the trail (every scope)', () => {
    const outside = path.join(root, 'outside-runs');
    fs.mkdirSync(outside, { recursive: true });
    const payload = { final_assessment: 'x.', model: null };

    // Change scope: contained change dir, symlinked trail child.
    makeChange('sly');
    fs.symlinkSync(outside, path.join(root, 'orbit/changes/sly/.orbit-runs'), 'dir');
    expect(() =>
      composeAndWriteEmit('explore', { change: 'sly' }, payload, { projectRoot: root })
    ).toThrow(/trail directory resolves outside/);
    expect(fs.readdirSync(outside)).toEqual([]);

    // Project scope (bare address-reviews): symlinked orbit/.orbit-runs.
    fs.symlinkSync(outside, path.join(root, 'orbit', '.orbit-runs'), 'dir');
    expect(() =>
      composeAndWriteEmit(
        'address-reviews', {},
        { source: 'whole-repo', walk_mode: 'per_finding', resolutions: [], final_assessment: 'w.', remaining_markers_in_scope: 0, model: null },
        { projectRoot: root }
      )
    ).toThrow(/trail directory resolves outside/);
    expect(fs.readdirSync(outside)).toEqual([]);

    // Doc scope: symlinked architecture trail.
    write('orbit/architecture/prog2.md', '# prog2\n');
    fs.symlinkSync(outside, path.join(root, 'orbit/architecture/.orbit-runs'), 'dir');
    expect(() =>
      composeAndWriteEmit(
        'architect', { doc: 'prog2' },
        { final_assessment: 's', handoff: { boot_sequence: ['a'], next_command: '/orbit:architect prog2', model_hint: null, seam: 's' }, model: null },
        { projectRoot: root }
      )
    ).toThrow(/trail directory resolves outside/);
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  it('a write failure past the gate leaves NO file — not even the dot-tmp (cleanup on the throw path)', () => {
    makeChange('foo');
    const runsDir = path.join(root, 'orbit/changes/foo/.orbit-runs');
    fs.mkdirSync(runsDir, { recursive: true });
    const before = listRuns('orbit/changes/foo/.orbit-runs');
    fs.chmodSync(runsDir, 0o555); // write refused past the gate, at the tmp write
    try {
      expect(() =>
        composeAndWriteEmit(
          'verify',
          { change: 'foo' },
          { final_assessment: 'clean', verdict: 'pass', model: null },
          { projectRoot: root }
        )
      ).toThrow();
    } finally {
      fs.chmodSync(runsDir, 0o755);
    }
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual(before);
    expect(fs.readdirSync(runsDir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('an unnumbered checkbox group degrades a chunked apply to no-chunking (undeclarable work never yields a complete record)', () => {
    const tasks = `<!--\nImplementation chunks:\n  Chunk 1 (groups 1):  First\n  Chunk 2 (groups 2):  Second\n-->\n\n# Tasks\n\n## 1. A\n\n- [x] 1.1 done\n\n## 2. B\n\n- [x] 2.1 done\n\n## Extra work\n\n- [ ] stray task\n`;
    makeChange('foo', { tasks });
    const r = composeAndWriteEmit(
      'apply',
      { change: 'foo' },
      { consent: 'user-invoked', model: null },
      { projectRoot: root }
    );
    // Both declared chunks are checked, but the stray unnumbered task blocks any
    // chunked/complete record: no-chunking fallback, honest remaining count.
    expect(r.emit.chunk).toBeNull();
    expect(r.emit.tasks_remaining).toBe(1);
    expect(r.emit.chunk_complete).toBe(false);
  });

  it('apply boundary: chunk N complete with the engine-composed next-chunk suffix (rule 1)', () => {
    const tasks = `<!--\nImplementation chunks:\n  Chunk 1 (groups 1):  First\n  Chunk 2 (groups 2):  Second\n-->\n\n# Tasks\n\n## 1. A\n\n- [x] 1.1 done\n\n## 2. B\n\n- [ ] 2.1 pending\n- [ ] 2.2 (User-validation handoff) live-test\n`;
    makeChange('foo', { tasks });

    const r = composeAndWriteEmit(
      'apply',
      { change: 'foo' },
      { user_validation_tasks: ['2.2'], assessment_suffix: 'Chunk one went smoothly.', consent: 'user-invoked', model: null },
      { projectRoot: root }
    );
    // Chunk 1's last task checked, chunk 2 untouched → the emit records chunk 1 COMPLETE.
    expect(r.emit.chunk).toBe('1 of 2');
    expect(r.emit.chunk_name).toBe('First');
    expect(r.emit.chunk_complete).toBe(true);
    expect(r.emit.tasks_completed).toBe(1);
    expect(r.emit.tasks_remaining).toBe(2);
    expect(r.emit.user_validation_remaining).toBe(1);
    expect(String(r.emit.final_assessment)).toContain('Completed chunk 1 of 2 (First)');
    expect(String(r.emit.final_assessment)).toContain('Chunk one went smoothly.');
    expect(r.emit.next_recommended).toBe('/orbit:apply foo — next chunk: Second');
    // Engine-owned judgment verification: a bad task id is refused.
    expect(() =>
      composeAndWriteEmit('apply', { change: 'foo' }, { user_validation_tasks: ['9.9'], consent: 'user-invoked', model: null }, { projectRoot: root })
    ).toThrow(/names no unchecked task/);
  });

  it('apply mid-chunk: the highest chunk with checked work, incomplete, resumes plainly', () => {
    const tasks = `<!--\nImplementation chunks:\n  Chunk 1 (groups 1):  First\n  Chunk 2 (groups 2):  Second\n-->\n\n# Tasks\n\n## 1. A\n\n- [x] 1.1 done\n\n## 2. B\n\n- [x] 2.1 started\n- [ ] 2.2 pending\n`;
    makeChange('foo', { tasks });
    const r = composeAndWriteEmit(
      'apply',
      { change: 'foo' },
      { consent: 'user-invoked', model: null },
      { projectRoot: root }
    );
    expect(r.emit.chunk).toBe('2 of 2');
    expect(r.emit.chunk_complete).toBe(false);
    expect(String(r.emit.final_assessment)).toContain('Paused mid-chunk 2 of 2');
    expect(r.emit.next_recommended).toBe('/orbit:apply foo');
  });

  it('apply completion: the whole-task-set formula and the engine canonical next', () => {
    makeChange('foo', { tasks: '# Tasks\n\n## 1. A\n\n- [x] 1.1 done\n- [ ] 1.2 (User-validation handoff) live-test\n' });
    const r = composeAndWriteEmit(
      'apply',
      { change: 'foo' },
      { user_validation_tasks: ['1.2'], consent: 'user-invoked', model: null },
      { projectRoot: root }
    );
    // No-chunking: chunk null; chunk_complete computed (all unchecked minus UV == 0), never a constant.
    expect(r.emit.chunk).toBeNull();
    expect(r.emit.chunk_complete).toBe(true);
    // Apply-complete: the stamped recommendation equals the engine's post-landing
    // canonical next_command BY CONSTRUCTION (whatever the gate graph computes for
    // this fixture's state — byte-identical, never hand-authored).
    const context = loadChangeContext(root, 'foo');
    const after = formatChangeStatus(context);
    expect(r.emit.next_recommended).toBe(after.next_command);
  });
});

// ---------------------------------------------------------------------------
// 2.5 write gate
// ---------------------------------------------------------------------------

describe('write gate', () => {
  it('scorecard/findings cell mismatch is refused naming the cell; no file written', () => {
    makeChange('foo');
    const before = listRuns('orbit/changes/foo/.orbit-runs');
    expect(() =>
      composeAndWriteEmit(
        'review',
        { change: 'foo' },
        validReviewPayload({
          scorecard: {
            completeness: { critical: 0, warning: 0, suggestion: 0 },
            correctness: { critical: 0, warning: 0, suggestion: 0 },
            coherence: { critical: 0, warning: 0, suggestion: 0 },
          },
        }),
        { projectRoot: root }
      )
    ).toThrow(/completeness|warning/);
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual(before);
  });

  it('a forged single-line slot (embedded newline in a title) is refused', () => {
    makeChange('foo');
    expect(() =>
      composeAndWriteEmit(
        'review',
        { change: 'foo' },
        validReviewPayload({
          findings: [
            { severity: 'WARNING', dimension: 'completeness', title: 'line one\nline two', file: 'a.md', line: 1, recommendation: 'r' },
          ],
        }),
        { projectRoot: root }
      )
    ).toThrow();
  });

  it('architecture-mode review emit passes the mode-scoped gate (strict normalizer not applied)', () => {
    write('orbit/architecture/prog.md', '# prog\n');
    const r = composeAndWriteEmit(
      'review',
      { doc: 'prog' },
      validReviewPayload({
        mode: 'architecture',
        handoff: { boot_sequence: ['CLAUDE.md', 'orbit/architecture/prog.md'], next_command: '/orbit:architect prog', model_hint: null, seam: 'post-review' },
      }),
      { projectRoot: root }
    );
    expect(r.emit.change).toBeNull();
    expect(r.emit.doc).toBe('prog');
    expect(r.emit.iteration).toBe(1);
    // Findings exist → the address pointer, doc-scoped.
    expect(String(r.emit.next_recommended)).toMatch(/^\/orbit:address-reviews --from-file /);
  });

  it('a non-string model and an incomplete handoff shape are refused (declared-shape enforcement)', () => {
    makeChange('foo');
    // model must be string|null — a number is refused, not written.
    expect(() =>
      composeAndWriteEmit('explore', { change: 'foo' }, { final_assessment: 'x.', model: 5 as any }, { projectRoot: root })
    ).toThrow(/'model' must be a string or null/);

    // handoff without model_hint / without seam — the FULL architect-owned shape is enforced.
    write('orbit/architecture/prog.md', '# prog\n');
    const base = { final_assessment: 's', model: null };
    const h = (handoff: any) => ({ ...base, handoff });
    expect(() =>
      composeAndWriteEmit('architect', { doc: 'prog' }, h({ boot_sequence: ['a'], next_command: '/orbit:architect prog', seam: 's' }), { projectRoot: root })
    ).toThrow(/model_hint/);
    expect(() =>
      composeAndWriteEmit('architect', { doc: 'prog' }, h({ boot_sequence: ['a'], next_command: '/orbit:architect prog', model_hint: null }), { projectRoot: root })
    ).toThrow(/seam/);
  });

  it('architecture-mode review emit missing the handoff section is refused naming it', () => {
    write('orbit/architecture/prog.md', '# prog\n');
    expect(() =>
      composeAndWriteEmit('review', { doc: 'prog' }, validReviewPayload({ mode: 'architecture' }), { projectRoot: root })
    ).toThrow(/handoff/);
  });
});

// ---------------------------------------------------------------------------
// 3.2 exactly-one-file guarantee
// ---------------------------------------------------------------------------

describe('exactly-one-file guarantee', () => {
  it('a successful emit adds exactly one file and changes nothing else in the change dir', () => {
    makeChange('foo');
    const snapshot = (): string[] => {
      const out: string[] = [];
      const walk = (dir: string): void => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) walk(p);
          else out.push(`${p}:${fs.statSync(p).size}`);
        }
      };
      walk(path.join(root, 'orbit/changes/foo'));
      return out.sort();
    };
    const before = snapshot();
    const r = composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'clean', verdict: 'pass', model: null }, { projectRoot: root });
    const after = snapshot();
    const added = after.filter(x => !before.includes(x));
    expect(added).toHaveLength(1);
    expect(added[0]).toContain(path.basename(r.path));
    // No tmp residue.
    expect(listRuns('orbit/changes/foo/.orbit-runs').some(f => f.includes('.tmp'))).toBe(false);
  });
});
