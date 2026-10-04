import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, EmitError } from '../../src/core/emit-composition.js';
import { normalizeInternalPass } from '../../src/core/report-render.js';
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

  it('archive accepts the schema\'s CONDITIONAL fields — fingerprint override/unverified, audit_skipped_via_flag (D6 archive, 2026-09-11; the C1 gate-override field retired at rc04c)', () => {
    write('orbit/changes/archive/2026-09-11-bar/proposal.md', 'p');
    // rc04c: the proceed-anyway decision rides the continuation entry ALONE. `bar` carries no
    // trail, so an EMPTY formed_against is the truthful citation — and the accepted one.
    const continuation = {
      kind: 'continuation', disposition: 'proceed', formed_against: [],
      reasoning: 'proceeded past an unpassed review-system with no independent pass on the trail',
      ratified_by: 'user',
      gate: 'review-system', gate_state: 'unpassed', gate_reason: 'cadence incomplete — no independent pass yet',
    };
    const r = composeAndWriteEmit(
      'archive',
      { change: 'bar' },
      {
        final_assessment: 'Archived bar through a recorded continuation.',
        archive_path: 'orbit/changes/archive/2026-09-11-bar/',
        judgements: [continuation],
        fingerprint_overridden: [{ capability: 'c', requirement: 'r', base_hash: 'sha256:a', live_hash: 'sha256:b' }],
        fingerprints_unverified: [{ capability: 'c', requirement: 'q' }],
        audit_skipped_via_flag: true,
        model: null,
      },
      { projectRoot: root }
    );
    const persisted = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(persisted.judgements).toEqual([continuation]);
    expect('gate_overridden' in persisted).toBe(false);
    expect(persisted.fingerprint_overridden).toHaveLength(1);
    expect(persisted.fingerprints_unverified).toHaveLength(1);
    expect(persisted.audit_skipped_via_flag).toBe(true);
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
    // rc13b: no `## Mechanism` section is ONE format note (never a blocker); the five prefix-less
    // entries are live rules with no well-formed ID, so the Stalled string carries the record suffix.
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("no '## Mechanism' section");
    expect(String(r.emit.next_recommended)).toMatch(/ · open domains: line \d+, line \d+, line \d+ \+2 more$/);

    write('orbit/explore/baz/explore.md', '## Decisions\n\n- only\n');
    const missing = composeAndWriteEmit('explore', { change: 'baz' }, { final_assessment: 'begin', model: null }, { projectRoot: root });
    expect(missing.emit.open_questions_with_recommendation).toBe('0 of 0');
    expect(missing.warnings.some(w => w.includes("Open questions"))).toBe(true);
  });

  // rc13b — the five FORM-parse fields (orbit-emit-composition "Per-command computed extensions").
  it('explore: the five rule fields are computed from the file — the orphan lands in key_defects, not rules_open', () => {
    const moves = ['READ', 'ENUMERATE', 'COHERE', 'EXECUTE', 'FALSIFY', 'CONFORM', 'FEASIBILITY', 'CONSUME', 'INVOKE']
      .map((m) => `- ${m}: applied — x`)
      .join('\n');
    const entry = (id: string, closure: string, residual = '') =>
      `### ${id} — t\nDomain: s\n| member | covered by |\n|---|---|\n| a | b |\nClosure: ${closure}\n${residual}Moves:\n${moves}\n`;
    const content = [
      '> **Status**: exploring.',
      '',
      '## Mechanism',
      '',
      entry('D-foo-1', 'SOURCED — why'),
      entry('D-foo-2', 'BOUNDED', 'Residual kind: a kind\nResidual method: a method\n'),
      entry('D-foo-3', 'BOUNDED', 'Residual kind: a kind\n'),
      entry('D-foo-9', 'SOURCED'),
      '## Decisions',
      '',
      '- **2026-09-25 — D-foo-1: one** p.',
      '- **2026-09-25 — D-foo-2: two** p.\n  Kind: rule',
      '- **2026-09-25 — D-foo-3: three** p.',
      '- **2026-09-25 — D-foo-4: four** p.',
      '- **2026-09-25 — D-foo-5: five** p.\n  Kind: fact',
      '- **2026-09-25 — D-foo-6: six** p.\n  Kind: scope',
      '',
      '## Open questions',
      '',
    ].join('\n');
    write('orbit/explore/rules/explore.md', content);
    const r = composeAndWriteEmit('explore', { change: 'rules' }, { final_assessment: 'boundary', model: null }, { projectRoot: root });
    expect(r.emit.decisions_captured).toBe(6);
    expect(r.emit.rules_total).toBe(4);
    expect(r.emit.rules_open).toEqual([
      { id: 'D-foo-3', state: 'bounded-incomplete' },
      { id: 'D-foo-4', state: 'absent' },
    ]);
    const orphanLine = content.split('\n').findIndex((l) => l.startsWith('### D-foo-9')) + 1;
    expect(r.emit.key_defects).toEqual([{ id: 'D-foo-9', kind: 'orphan', line: orphanLine }]);
    expect(r.emit.residuals).toEqual([{ id: 'D-foo-2', kind: 'a kind', method: 'a method' }]);
    expect(r.emit.status).toEqual({ token: 'exploring' });
    expect(r.emit.next_recommended).toBe(
      `/orbit:explore rules — 2 of 4 live rules have open domains (D-foo-3, D-foo-4); account for them before formalizing; 1 key defect (D-foo-9 at line ${orphanLine})`
    );
    expect(r.warnings).toEqual([]);
    // Persisted, not only returned.
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.rules_open).toEqual(r.emit.rules_open);
    expect(written.status).toEqual({ token: 'exploring' });
  });

  it('explore: concluded header → status with date and re_entry, the Concluded rung, and the no-Mechanism note beside the counter\'s', () => {
    write(
      'orbit/explore/done/explore.md',
      '> **Status**: concluded 2026-09-25.\n\n## Decisions\n\n- **2026-09-25 — D-d-1: a rule** p.\n- **2026-09-25 — D-d-2: the conclusion** p.\n  Kind: scope\n  Re-entry: a third withdrawn stage\n'
    );
    const r = composeAndWriteEmit('explore', { change: 'done' }, { final_assessment: 'concluded', model: null }, { projectRoot: root });
    expect(r.emit.status).toEqual({ token: 'concluded', date: '2026-09-25', re_entry: 'a third withdrawn stage' });
    expect(r.emit.rules_open).toEqual([{ id: 'D-d-1', state: 'absent' }]);
    expect(r.emit.next_recommended).toBe('Concluded 2026-09-25. Reopens when: a third withdrawn stage. · open domains: D-d-1');
    // Two notes: the counter's (no Open questions) and the form parse's (no Mechanism) — neither blocks.
    expect(r.warnings.some((w) => w.includes("no '## Open questions' section"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("no '## Mechanism' section"))).toBe(true);
    expect(r.warnings.some((w) => /(five|5)[- ]sections?/.test(w))).toBe(false);
  });

  it('explore: the BEGIN-emit shape on an empty scaffold carries the five fields at their zero values', () => {
    write('orbit/explore/blank/explore.md', '> **Status**: exploring.\n\n# Exploration: blank\n\n## Premise\n\n## Mechanism\n\n## Decisions\n\n## Open questions\n\n## Considered & out\n\n## References\n');
    const r = composeAndWriteEmit('explore', { change: 'blank' }, { final_assessment: 'begin', model: null }, { projectRoot: root });
    expect(r.emit.rules_total).toBe(0);
    expect(r.emit.rules_open).toEqual([]);
    expect(r.emit.key_defects).toEqual([]);
    expect(r.emit.residuals).toEqual([]);
    expect(r.emit.status).toEqual({ token: 'exploring' });
    expect(r.emit.next_recommended).toBe('/orbit:explore blank — continue capturing thinking — no decisions captured yet');
    expect(r.warnings).toEqual([]);
  });

  it('explore: a payload carrying any of the five fields is refused with the ENGINE-OWNED sentence, never the unknown-key one', () => {
    write('orbit/explore/owned/explore.md', '## Decisions\n\n## Open questions\n');
    for (const [key, value] of Object.entries({ rules_total: 0, rules_open: [], key_defects: [], residuals: [], status: { token: 'exploring' } })) {
      expect(() =>
        composeAndWriteEmit('explore', { change: 'owned' }, { final_assessment: 'x', model: null, [key]: value }, { projectRoot: root })
      ).toThrow(`payload field '${key}' is engine-owned for 'explore' — a second voice on a computable fact is refused at the seam.`);
    }
    // The same sentence decisions_captured draws; the unknown-key sentence is a different one.
    expect(() =>
      composeAndWriteEmit('explore', { change: 'owned' }, { final_assessment: 'x', model: null, decisions_captured: 1 }, { projectRoot: root })
    ).toThrow("payload field 'decisions_captured' is engine-owned for 'explore'");
    expect(() =>
      composeAndWriteEmit('explore', { change: 'owned' }, { final_assessment: 'x', model: null, rules_openn: [] }, { projectRoot: root })
    ).toThrow("unknown payload key 'rules_openn' for 'explore' — not in the command's payload table and not engine-owned.");
    expect(listRuns('orbit/explore/owned/.orbit-runs')).toEqual([]);
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

  it('architect: stages_ended is an accepted payload field beside completions_ratified; an unknown key is still refused (rc15)', () => {
    write('orbit/architecture/prog.md', '# prog\n');
    const handoff = { boot_sequence: ['CLAUDE.md'], next_command: '/orbit:architect prog', model_hint: null, seam: 'post-session' };
    const r = composeAndWriteEmit(
      'architect',
      { doc: 'prog' },
      { final_assessment: 's', completions_ratified: [], stages_ended: ['rc03a-blind-prompt'], handoff, model: null },
      { projectRoot: root }
    );
    expect((r.emit as any).stages_ended).toEqual(['rc03a-blind-prompt']);
    expect((r.emit as any).completions_ratified).toEqual([]);
    // Optional: an emit without it is still valid (every earlier architect emit stays valid).
    const older = composeAndWriteEmit('architect', { doc: 'prog' }, { final_assessment: 's', handoff, model: null }, { projectRoot: root });
    expect('stages_ended' in older.emit).toBe(false);
    expect(() =>
      composeAndWriteEmit('architect', { doc: 'prog' }, { final_assessment: 's', stages_endedd: ['x'], handoff, model: null }, { projectRoot: root })
    ).toThrow(/unknown payload key 'stages_endedd'/);
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
    ).toThrow(/canonical \.orbit-runs child/);
    expect(fs.readdirSync(outside)).toEqual([]);

    // Project scope (bare address-reviews): symlinked orbit/.orbit-runs.
    fs.symlinkSync(outside, path.join(root, 'orbit', '.orbit-runs'), 'dir');
    expect(() =>
      composeAndWriteEmit(
        'address-reviews', {},
        { source: 'whole-repo', walk_mode: 'per_finding', resolutions: [], final_assessment: 'w.', remaining_markers_in_scope: 0, model: null },
        { projectRoot: root }
      )
    ).toThrow(/canonical \.orbit-runs child/);
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
    ).toThrow(/canonical \.orbit-runs child/);
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  it('a toJSON hook forging a gate-checked slot is refused: the gate validates the FROZEN bytes (content check/use regression)', () => {
    // The gate and the written bytes must be ONE read of caller state: a finding
    // whose toJSON emits an embedded newline in a single-line slot must be refused
    // by the gate itself — there is no live-object pre-check for it to satisfy.
    makeChange('forge');
    const zero = { critical: 0, warning: 0, suggestion: 0 };
    const payload: any = {
      mode: 'system',
      reviewer_class: 'in-context',
      depth: 'full',
      scorecard: { completeness: { ...zero, warning: 1 }, correctness: { ...zero }, coherence: { ...zero } },
      findings: [
        {
          toJSON() {
            return {
              severity: 'WARNING',
              dimension: 'completeness',
              title: 'clean at first glance\nforged second line',
              file: 'design.md',
              line: 3,
              recommendation: 'x',
            };
          },
        },
      ],
      stale_suppressed: [],
      passes_run: ['0'],
      passes_skipped: [],
      model: null,
    };
    const runsDir = path.join(root, 'orbit/changes/forge/.orbit-runs');
    expect(() =>
      composeAndWriteEmit('review', { change: 'forge' }, payload, { projectRoot: root })
    ).toThrow();
    expect(fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter(f => /^review-/.test(f)) : []).toEqual([]);
  });

  it('a trail swap DURING serialization is caught at the write boundary (check/use regression)', () => {
    // The last point caller code can run is the final JSON.stringify (toJSON hooks):
    // swap the already-validated .orbit-runs for an outside symlink there — the
    // re-check after materialization must refuse, and nothing lands at the redirect.
    makeChange('toctou');
    const runsDir = path.join(root, 'orbit/changes/toctou/.orbit-runs');
    const outside = path.join(root, 'outside-toctou');
    fs.mkdirSync(outside, { recursive: true });
    let swapped = false;
    const payload: any = {
      source: 'from-file',
      source_path: 'x.md',
      walk_mode: 'per_finding',
      final_assessment: 'Walked 1, resolved 1.',
      resolutions: [
        {
          toJSON() {
            if (!swapped) {
              swapped = true;
              fs.rmSync(runsDir, { recursive: true, force: true });
              fs.symlinkSync(outside, runsDir, 'dir');
            }
            return { marker: 'm', severity: 'SUGGESTION', status: 'resolved' };
          },
        },
      ],
      model: null,
    };
    expect(() =>
      composeAndWriteEmit('address-reviews', { change: 'toctou' }, payload, { projectRoot: root })
    ).toThrow(/canonical \.orbit-runs child/);
    expect(swapped).toBe(true); // the hook DID fire — the swap really happened
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  it('IN-container trail aliases are refused: canonical identity, not ancestry (.orbit-runs -> . and sibling)', () => {
    const payload = { final_assessment: 'x.', model: null };

    // Change scope: .orbit-runs -> . resolves to the container root itself — the
    // iter-3 reproduction (record would land physically beside tasks.md).
    makeChange('alias-dot');
    fs.symlinkSync('.', path.join(root, 'orbit/changes/alias-dot/.orbit-runs'), 'dir');
    expect(() =>
      composeAndWriteEmit('explore', { change: 'alias-dot' }, payload, { projectRoot: root })
    ).toThrow(/canonical \.orbit-runs child/);
    expect(fs.readdirSync(path.join(root, 'orbit/changes/alias-dot')).filter(f => f.endsWith('.json'))).toEqual([]);

    // Change scope: sibling alias inside the same container.
    makeChange('alias-sib');
    fs.mkdirSync(path.join(root, 'orbit/changes/alias-sib/sibling'), { recursive: true });
    fs.symlinkSync('sibling', path.join(root, 'orbit/changes/alias-sib/.orbit-runs'), 'dir');
    expect(() =>
      composeAndWriteEmit('explore', { change: 'alias-sib' }, payload, { projectRoot: root })
    ).toThrow(/canonical \.orbit-runs child/);
    expect(fs.readdirSync(path.join(root, 'orbit/changes/alias-sib/sibling'))).toEqual([]);

    // Project scope: orbit/.orbit-runs aliased to a descendant of another scope.
    fs.mkdirSync(path.join(root, 'orbit/architecture'), { recursive: true });
    fs.symlinkSync('architecture', path.join(root, 'orbit', '.orbit-runs'), 'dir');
    expect(() =>
      composeAndWriteEmit(
        'address-reviews', {},
        { source: 'whole-repo', walk_mode: 'per_finding', resolutions: [], final_assessment: 'w.', remaining_markers_in_scope: 0, model: null },
        { projectRoot: root }
      )
    ).toThrow(/canonical \.orbit-runs child/);
    expect(fs.readdirSync(path.join(root, 'orbit/architecture')).filter(f => f.endsWith('.json'))).toEqual([]);
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

  it('doc-scoped walk ordinal anchors PER DOC on the shared architecture trail', () => {
    write('orbit/architecture/doc-a.md', '# a\n');
    write('orbit/architecture/doc-b.md', '# b\n');
    // A prior walk log for doc-a sits on the SHARED trail.
    write(
      'orbit/architecture/.orbit-runs/address-reviews-2026-08-01T10-00-00Z.json',
      JSON.stringify({
        command: 'address-reviews', timestamp: '2026-08-01T10:00:00Z', change: null, doc: 'doc-a',
        final_assessment: 'walked.', next_recommended: 'x', kind: 'editorial',
      })
    );
    const walkPayload = {
      source: 'from-file', source_path: 'orbit/architecture/.orbit-runs/review-architecture-x.json',
      walk_mode: 'per_finding', resolutions: [], final_assessment: 'Walked 1, resolved 1.', model: null,
    };
    // doc-b's FIRST walk: iteration 1, never counting doc-a's log.
    const b = composeAndWriteEmit('address-reviews', { doc: 'doc-b' }, walkPayload, { projectRoot: root });
    expect(b.emit.iteration).toBe(1);
    // doc-a's next walk: iteration 2 (its own prior log counts).
    const a = composeAndWriteEmit('address-reviews', { doc: 'doc-a' }, walkPayload, { projectRoot: root });
    expect(a.emit.iteration).toBe(2);
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

// ---------------------------------------------------------------------------
// D-arc Stage D6 — PR payload fields.
//
// VALUES are narrative pass-through (the engine cannot verify a branch or a PR exists);
// STRUCTURE is gate-validated, because `pr_attachment` is the AUTHORITATIVE record the
// archive tail dereferences. Per `orbit-run-summary-emit` + `orbit-emit-composition`.
// ---------------------------------------------------------------------------

describe('D6 PR payload fields', () => {
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-emit-d6-'));
    write('orbit/config.yaml', 'schema: spec-driven\n');
    makeChange('foo');
    // archive emits resolve an ARCHIVED directory (target resolution precedes payload
    // validation), so the archived tree must exist for those cases to reach the gate.
    write('orbit/changes/archive/2026-01-01-foo/proposal.md', 'p');
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const perProposal = { branch: 'foo', granularity: 'per-proposal' };
  const perArchitecture = { branch: 'd-arc', granularity: 'per-architecture', doc: 'd-arc-arbitered-flow' };

  function emitPropose(command: 'propose' | 'ff', attachment: unknown) {
    return composeAndWriteEmit(
      command,
      { change: 'foo' },
      { model: null, final_assessment: 'done', pr_attachment: attachment },
      { projectRoot: root }
    );
  }

  describe('acceptance on the commands that own the fields', () => {
    it.each(['propose', 'ff'] as const)('accepts pr_attachment on %s and carries values verbatim', (command) => {
      const res = emitPropose(command, { ...perProposal, url: 'https://example.test/pr/1', state: 'draft' });
      const written = JSON.parse(fs.readFileSync(res.path, 'utf-8'));
      expect(written.pr_attachment).toEqual({
        branch: 'foo',
        granularity: 'per-proposal',
        url: 'https://example.test/pr/1',
        state: 'draft',
      });
    });

    it('accepts a per-architecture attachment carrying doc', () => {
      const res = emitPropose('propose', perArchitecture);
      const written = JSON.parse(fs.readFileSync(res.path, 'utf-8'));
      expect(written.pr_attachment.doc).toBe('d-arc-arbitered-flow');
    });

    it('accepts the degraded record — branch + granularity, no url/state', () => {
      const res = emitPropose('propose', perProposal);
      const written = JSON.parse(fs.readFileSync(res.path, 'utf-8'));
      expect(written.pr_attachment).toEqual(perProposal);
      expect(written.pr_attachment.url).toBeUndefined();
    });

    it('accepts pr_url and pr_state on archive', () => {
      const res = composeAndWriteEmit(
        'archive',
        { change: 'foo' },
        {
          model: null,
          final_assessment: 'archived',
          archive_path: 'orbit/changes/archive/2026-01-01-foo',
          pr_url: 'https://example.test/pr/1',
          pr_state: 'draft',
        },
        { projectRoot: root }
      );
      const written = JSON.parse(fs.readFileSync(res.path, 'utf-8'));
      expect(written.pr_url).toBe('https://example.test/pr/1');
      expect(written.pr_state).toBe('draft');
    });

    it('accepts pr_url with pr_state ELIDED (positive invalidation: closed/merged/retargeted)', () => {
      const res = composeAndWriteEmit(
        'archive',
        { change: 'foo' },
        {
          model: null,
          final_assessment: 'archived',
          archive_path: 'orbit/changes/archive/2026-01-01-foo',
          pr_url: 'https://example.test/pr/1',
        },
        { projectRoot: root }
      );
      const written = JSON.parse(fs.readFileSync(res.path, 'utf-8'));
      expect(written.pr_url).toBe('https://example.test/pr/1');
      expect('pr_state' in written).toBe(false);
    });
  });

  describe('structural rejection (fail-loud at the seam)', () => {
    it('rejects a misspelled nested key', () => {
      expect(() => emitPropose('propose', { branch: 'foo', granularty: 'per-proposal' })).toThrow(
        /unknown key 'pr_attachment.granularty'/
      );
    });

    it('rejects a missing branch', () => {
      expect(() => emitPropose('propose', { granularity: 'per-proposal' })).toThrow(
        /'pr_attachment.branch' is required/
      );
    });

    it('rejects a missing granularity', () => {
      expect(() => emitPropose('propose', { branch: 'foo' })).toThrow(
        /'pr_attachment.granularity' is required/
      );
    });

    it('rejects a non-string field', () => {
      expect(() => emitPropose('propose', { branch: 42, granularity: 'per-proposal' })).toThrow(
        /'pr_attachment.branch' must be a string/
      );
    });

    it('rejects an out-of-enum granularity', () => {
      expect(() => emitPropose('propose', { branch: 'foo', granularity: 'per-architect' })).toThrow(
        /'pr_attachment.granularity' must be one of/
      );
    });

    it('rejects an out-of-enum state', () => {
      expect(() => emitPropose('propose', { ...perProposal, state: 'closed' })).toThrow(
        /'pr_attachment.state' must be one of/
      );
    });

    it('rejects per-architecture WITHOUT doc (the gate-required conditional key)', () => {
      expect(() => emitPropose('propose', { branch: 'd-arc', granularity: 'per-architecture' })).toThrow(
        /'pr_attachment.doc' is required when granularity is 'per-architecture'/
      );
    });

    it('rejects per-proposal WITH doc', () => {
      expect(() => emitPropose('propose', { ...perProposal, doc: 'x' })).toThrow(
        /'pr_attachment.doc' must be absent when granularity is 'per-proposal'/
      );
    });

    it('rejects a non-object attachment', () => {
      expect(() => emitPropose('propose', 'foo')).toThrow(/'pr_attachment' must be an object/);
      expect(() => emitPropose('propose', ['foo'])).toThrow(/'pr_attachment' must be an object/);
    });

    it('rejects an out-of-enum pr_state on archive', () => {
      expect(() =>
        composeAndWriteEmit(
          'archive',
          { change: 'foo' },
          { model: null, final_assessment: 'a', archive_path: 'p', pr_state: 'merged' },
          { projectRoot: root }
        )
      ).toThrow(/'pr_state' must be one of/);
    });
  });

  describe('field ownership — each rejected outside its command set', () => {
    it('rejects pr_attachment on archive', () => {
      expect(() =>
        composeAndWriteEmit(
          'archive',
          { change: 'foo' },
          { model: null, final_assessment: 'a', archive_path: 'p', pr_attachment: perProposal },
          { projectRoot: root }
        )
      ).toThrow(/unknown payload key 'pr_attachment' for 'archive'/);
    });

    it('rejects pr_url on propose', () => {
      expect(() =>
        composeAndWriteEmit(
          'propose',
          { change: 'foo' },
          { model: null, final_assessment: 'a', pr_url: 'https://example.test/pr/1' },
          { projectRoot: root }
        )
      ).toThrow(/unknown payload key 'pr_url' for 'propose'/);
    });

    it.each(['new', 'continue'] as const)('rejects pr_attachment on %s (never attaches)', (command) => {
      expect(() =>
        composeAndWriteEmit(
          command,
          { change: 'foo' },
          { model: null, final_assessment: 'a', pr_attachment: perProposal },
          { projectRoot: root }
        )
      ).toThrow(new RegExp(`unknown payload key 'pr_attachment' for '${command}'`));
    });
  });
});

// ---------------------------------------------------------------------------
// rc04a — the cadence judgement record
//
// Two layers, because they catch different things. The discriminated union is
// AUTHORING ergonomics inside the engine; these tests exercise the RUNTIME
// validator, which is the only check that can fire on a payload file. Every
// refusal case asserts BOTH the named error and that NO FILE was written — a
// refusal that writes is worse than no refusal.
// ---------------------------------------------------------------------------

describe('rc04a judgement record', () => {
  const RUNS = 'orbit/changes/foo/.orbit-runs';

  /** A trail with two INDEPENDENT passes and one in-context pass, all earlier than any emit. */
  function seedPasses(): void {
    write(`${RUNS}/review-system-2026-01-01T10-00-00Z.json`, JSON.stringify({
      command: 'review', mode: 'system', reviewer_class: 'fresh', findings: [],
    }));
    write(`${RUNS}/external-system-2026-01-01T11-00-00Z.md`,
      '# External Review: foo (iteration 1)\n\n**Reviewer**: M\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n');
    write(`${RUNS}/review-system-2026-01-01T12-00-00Z.json`, JSON.stringify({
      command: 'review', mode: 'system', reviewer_class: 'in-context', findings: [],
    }));
  }

  const FRESH = '2026-01-01T10-00-00Z';
  const EXTERNAL = '2026-01-01T11-00-00Z';
  const IN_CONTEXT = '2026-01-01T12-00-00Z';

  const readiness = (over: Record<string, unknown> = {}) => ({
    kind: 'readiness',
    disposition: 'ready',
    formed_against: [FRESH, EXTERNAL],
    reasoning: 'the pair returned and the residual is acceptable',
    ratified_by: 'ai',
    accepted: [{ claim: 'residual findings remain', why: 'two independent reads agreed' }],
    ...over,
  });

  const archivePayload = (judgements: unknown) => ({
    model: 'test-model',
    final_assessment: 'archived',
    archive_path: 'orbit/changes/archive/2026-01-02-foo/',
    audit: { ran: true, failure_reason: null, findings_summary: { critical: 0, warning: 0, suggestion: 0 }, summary_path: null },
    sync_specs: { ran: true, skipped_reason: null, capabilities_updated: [], added: 0, modified: 0, removed: 0, renamed: 0 },
    unresolved_markers: [],
    user_decision: 'proceeded_with_no_critical',
    consent: 'user-invoked',
    ...(judgements === undefined ? {} : { judgements }),
  });

  function archived(): string {
    // the archive emit resolves the POST-MOVE landing, so the change must already be moved
    fs.mkdirSync(path.join(root, 'orbit/changes/archive/2026-01-02-foo/.orbit-runs'), { recursive: true });
    fs.cpSync(
      path.join(root, RUNS),
      path.join(root, 'orbit/changes/archive/2026-01-02-foo/.orbit-runs'),
      { recursive: true }
    );
    fs.rmSync(path.join(root, 'orbit/changes/foo'), { recursive: true, force: true });
    return 'orbit/changes/archive/2026-01-02-foo/.orbit-runs';
  }

  const emitArchive = (judgements: unknown) =>
    composeAndWriteEmit('archive', { change: 'foo' }, archivePayload(judgements) as any, { projectRoot: root });

  beforeEach(() => {
    makeChange('foo');
    seedPasses();
  });

  // ---- 4.2 the pass case -------------------------------------------------
  it('writes a record citing only earlier, resolvable independent tokens', () => {
    const runs = archived();
    const r = emitArchive([readiness()]);
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.judgements).toHaveLength(1);
    expect(written.judgements[0].formed_against).toEqual([FRESH, EXTERNAL]);
    expect(written.judgements[0].accepted[0].claim).toBe('residual findings remain');
    // the written BYTES carry the record unchanged — not merely the returned object
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(1);
  });

  // ---- 4.3 presence scoping ----------------------------------------------
  it('an emit with no `judgements` KEY behaves exactly as before this change', () => {
    const runs = archived();
    const r = emitArchive(undefined);
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect('judgements' in written).toBe(false);
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(1);
  });

  // ---- 4.1 every refusal -------------------------------------------------
  const refusals: Array<[string, unknown, RegExp]> = [
    ['a LATER token', [readiness({ formed_against: ['2099-01-01T00-00-00Z'] })], /not STRICTLY earlier/],
    ['an EQUAL token', 'SELF', /not STRICTLY earlier/],
    ['an unresolvable token', [readiness({ formed_against: ['2020-01-01T00-00-00Z'] })], /resolves to no readable pass/],
    ['an IN-CONTEXT token', [readiness({ formed_against: [IN_CONTEXT] })], /in-context pass/],
    ['an empty formed_against', [readiness({ formed_against: [] })], /NON-EMPTY/],
    ['a missing ratified_by', [readiness({ ratified_by: undefined })], /ratified_by/],
    ['a kind\\/disposition clash', [readiness({ disposition: 'spend' })], /disposition' must be one of ready/],
    ['a routing destination', [readiness({ disposition: 'not-ready', destination: 'architecture' })], /unknown key 'destination'/],
    // the pattern REQUIRES the offending value: the defect was a refusal that named an internal
    // identifier instead of it, so a prefix-only assertion would not have caught the defect.
    ['a prototype-chain kind', [readiness({ kind: 'toString' })], /'kind' must be one of .* got "toString"/],
    ['an unknown key', [readiness({ oops: 1 })], /unknown key 'oops'/],
    ['an empty judgements array', [], /must not be empty/],
    ['a non-array judgements', {}, /must be an ARRAY/],
  ];

  for (const [label, judgements, pattern] of refusals) {
    it(`refuses ${label}, naming it and writing nothing`, () => {
      const runs = archived();
      let j = judgements;
      if (j === 'SELF') {
        // a token EQUAL to the emit's own: freeze the clock so the emit's token is known
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-01T09-00-00Z'.replace(/-(\d\d)-(\d\d)Z$/, ':$1:$2Z')));
        j = [readiness({ formed_against: ['2026-06-01T09-00-00Z'] })];
      }
      expect(() => emitArchive(j)).toThrow(pattern);
      expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(0);
    });
  }

  // ---- 4.1 the per-entry guarantee the array shape earns ------------------
  it('refuses the SECOND entry by INDEX — a valid entry does not rescue an invalid one', () => {
    const runs = archived();
    const good = readiness();
    const bad = readiness({ formed_against: ['2099-01-01T00-00-00Z'] });
    expect(() => emitArchive([good, bad])).toThrow(/judgements\[1\]/);
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(0);
  });

  // ---- rc04c edge (d): EMPTINESS-TRUTHFULNESS on continuation/proceed ------
  //
  // The NON-EMPTY requirement is relaxed for continuation/proceed ONLY, and the relaxation is
  // a CHECK, not a hole: `[]` asserts "there was nothing to cite", and the trail either bears
  // that out or contradicts it. Both directions are pinned, because a conditional accepted
  // without its refusal is half a check. (These cases took the slot of the coexistence
  // guard's tests, deleted with the guard: rc04c task 3.3c.)
  const proceed = (over: Record<string, unknown> = {}) => ({
    kind: 'continuation', disposition: 'proceed', formed_against: [],
    reasoning: 'proceeded with nothing to cite', ratified_by: 'user',
    gate: 'review-proposal', gate_state: 'unpassed', gate_reason: 'no independent pass yet',
    ...over,
  });
  const emitApply = (judgements: unknown) =>
    composeAndWriteEmit('apply', { change: 'foo' }, { model: 'test-model', judgements } as any, { projectRoot: root });

  it('ACCEPTS an empty formed_against on continuation/proceed when the trail carries NO pass at all', () => {
    fs.rmSync(path.join(root, RUNS), { recursive: true, force: true }); // undo seedPasses
    const r = emitApply([proceed()]);
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.judgements[0].formed_against).toEqual([]);
    expect(listRuns(RUNS).filter(f => f.startsWith('apply-'))).toHaveLength(1);
  });

  it('ACCEPTS an empty formed_against when only an IN-CONTEXT pass precedes — the set is INDEPENDENT passes', () => {
    fs.rmSync(path.join(root, RUNS), { recursive: true, force: true });
    write(`${RUNS}/review-proposal-${IN_CONTEXT}.json`, JSON.stringify({
      command: 'review', mode: 'proposal', reviewer_class: 'in-context', findings: [],
    }));
    const r = emitApply([proceed()]);
    expect(JSON.parse(fs.readFileSync(r.path, 'utf-8')).judgements[0].formed_against).toEqual([]);
  });

  it('ACCEPTS an empty formed_against when the only external return was REJECTED — a rejected return is not a member of the pass set', () => {
    // The non-obvious half the spec states outright: a rejected return carries the `external`
    // class and counts as spend, so a rule phrased on reviewer class alone would refuse a legal
    // empty citation in precisely the case where citing it is ALSO refused.
    fs.rmSync(path.join(root, RUNS), { recursive: true, force: true });
    write(`${RUNS}/external-proposal-2026-01-01T09-00-00Z.md`, 'not a review — unreadable return\n');
    const r = emitApply([proceed()]);
    expect(JSON.parse(fs.readFileSync(r.path, 'utf-8')).judgements[0].formed_against).toEqual([]);
  });

  it('REFUSES an empty formed_against when an independent pass precedes — naming the LATEST one, not the older, and the entry index', () => {
    // seedPasses: fresh @10:00 (FRESH), external @11:00 (EXTERNAL) — TWO preceding independent
    // passes, so an implementation naming the oldest or an arbitrary one still fails here.
    // A valid entry sits at [0] so the index named must be [1].
    let caught: unknown;
    try {
      emitApply([proceed({ formed_against: [FRESH] }), proceed()]);
    } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(EmitError);
    const msg = (caught as Error).message;
    expect(msg).toMatch(/judgements\[1\]/);
    expect(msg).toMatch(/'formed_against' is EMPTY/);
    expect(msg).toContain(EXTERNAL);
    expect(msg).not.toContain(FRESH);
    expect(listRuns(RUNS).filter(f => f.startsWith('apply-'))).toHaveLength(0);
  });

  it('REFUSES an empty formed_against on the ARCHIVE seam too — the seam where the decision is most often taken', () => {
    // The refusal direction was pinned on apply only; the archive seam had the acceptance case
    // (the empty-trail 'bar' emit) and a CLI probe that does not survive the session
    // (in-context system pass, 2026-09-24). Same seeded trail, same assertions, other seam.
    const runs = archived();
    let caught: unknown;
    try {
      emitArchive([proceed({ gate: 'review-system', formed_against: [FRESH] }), proceed({ gate: 'review-system' })]);
    } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(EmitError);
    const msg = (caught as Error).message;
    expect(msg).toMatch(/judgements\[1\]/);
    expect(msg).toContain(EXTERNAL);
    expect(msg).not.toContain(FRESH);
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(0);
  });

  it('the exemption does NOT extend to continuation/spend — empty is refused structurally, on an empty trail', () => {
    // empty the trail (keep the dir — `archived()` copies it) so the refusal is provably
    // structural rather than the trail-driven edge (d)
    for (const f of listRuns(RUNS)) fs.rmSync(path.join(root, RUNS, f));
    const runs = archived();
    const spend = {
      kind: 'continuation', disposition: 'spend', formed_against: [],
      reasoning: 'buying another pass', ratified_by: 'user',
    };
    expect(() => emitArchive([spend])).toThrow(/NON-EMPTY/);
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(0);
  });
  // (`readiness` with `[]` is covered by the refusal table above — /NON-EMPTY/ — and by the
  // acceptance fixture, both on trails where passes DO exist; the scope guard is the kind.)

  // ---- rc04c 3.5b: the STANDING NEGATIVE REGRESSION for the retired key ----
  //
  // Schema parity is ONE-WAY (documented keys must be accepted), so it stays green if a later
  // edit silently re-admits an undocumented legacy key. This is the pin that goes red if the
  // retirement is undone. Same shape as the `pr_attachment`-on-archive ownership case.
  it('rejects the RETIRED gate_overridden key on apply as an ordinary unknown key — and writes nothing', () => {
    expect(() =>
      composeAndWriteEmit('apply', { change: 'foo' }, {
        model: 'test-model',
        gate_overridden: { gate: 'review-proposal', state: 'unpassed', reason: 'r' },
      } as any, { projectRoot: root })
    ).toThrow(/unknown payload key 'gate_overridden' for 'apply'/);
    expect(listRuns(RUNS).filter(f => f.startsWith('apply-'))).toHaveLength(0);
  });

  it('rejects the RETIRED gate_overridden key on archive as an ordinary unknown key — and writes nothing', () => {
    const runs = archived();
    expect(() =>
      composeAndWriteEmit('archive', { change: 'foo' }, {
        ...archivePayload(undefined),
        gate_overridden: { gate: 'review-system', state: 'unpassed', reason: 'r' },
      } as any, { projectRoot: root })
    ).toThrow(/unknown payload key 'gate_overridden' for 'archive'/);
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(0);
  });

  // ---- the archive-time DISSENT (rc04a system walk, external finding E4) ------
  //
  // `not-ready` was first specified as a USER-ratified routing decision carrying
  // `destination: "architecture"`. But readiness lands only on `archive`, and the archive's
  // own readout calls the record "this session's own judgement" — so the honest AI dissent the
  // reader describes was refused by the validator, while the only accepted shape claimed work
  // was going to architecture on an emit that had just archived it. Routing was already
  // descoped from rc04a for having no reader; requiring `destination` re-imported it through
  // the validator. The record now says what the reader already says.
  it('accepts an AI-authored not-ready dissent with no destination', () => {
    const runs = archived();
    const r = emitArchive([readiness({ disposition: 'not-ready', ratified_by: 'ai' })]);
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.judgements[0].disposition).toBe('not-ready');
    expect(written.judgements[0].ratified_by).toBe('ai');
    expect('destination' in written.judgements[0]).toBe(false);
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(1);
  });

  // ---- 1.2 the carrier table's KIND half ---------------------------------
  it('refuses a readiness record on the apply emit — apply admits only continuation', () => {
    expect(() =>
      composeAndWriteEmit('apply', { change: 'foo' }, {
        model: 'test-model', judgements: [readiness()],
      } as any, { projectRoot: root })
    ).toThrow(/kind 'readiness' is not admitted on 'apply'/);
    expect(listRuns(RUNS).filter(f => f.startsWith('apply-'))).toHaveLength(0);
  });

  it('refuses a readiness record on the review-external T0 emit, where nothing reads it', () => {
    expect(() =>
      composeAndWriteEmit('review-external', { change: 'foo' }, {
        model: 'test-model',
        mode: 'system',
        prompt_path: `${RUNS}/external-prompt-system-2026-01-02T00-00-00Z.md`,
        target: 'a reviewer',
        final_assessment: 'packaged',
        judgements: [readiness()],
      } as any, { projectRoot: root })
    ).toThrow(/kind 'readiness' is not admitted on 'review-external'/);
    expect(listRuns(RUNS).filter(f => f.startsWith('review-external-'))).toHaveLength(0);
  });

  it('admits BOTH kinds on one archive emit — the reason the carrier is an array', () => {
    // ALSO pins orbit-run-summary-emit's 'Sufficiency above zero remains outside the engine'
    // scenario: the continuation cites ONE of the two preceding independent passes ([FRESH] on a
    // trail holding FRESH and EXTERNAL) and the emit WRITES — whether one was ENOUGH is the
    // judgement R-crc-10 keeps out of the engine, and edge (d)'s boundary is exactly zero.
    const runs = archived();
    const cont = {
      kind: 'continuation', disposition: 'proceed', formed_against: [FRESH],
      reasoning: 'proceeded past an unpassed review-system knowing what came back',
      ratified_by: 'user',
      gate: 'review-system', gate_state: 'unpassed', gate_reason: 'spend 3',
    };
    const r = composeAndWriteEmit('archive', { change: 'foo' }, archivePayload([cont, readiness()]) as any, { projectRoot: root });
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.judgements.map((j: any) => j.kind)).toEqual(['continuation', 'readiness']);
    expect(listRuns(runs).filter(f => f.startsWith('archive-'))).toHaveLength(1);
  });

  // ---- 1.2 the carrier set is CLOSED -------------------------------------
  it('refuses `judgements` on a command that takes no judgement', () => {
    expect(() =>
      composeAndWriteEmit('explore', { change: 'foo' }, {
        model: 'test-model', final_assessment: 'x', judgements: [readiness()],
      } as any, { projectRoot: root })
    ).toThrow(/unknown payload key 'judgements' for 'explore'/);
  });
});

// ---------------------------------------------------------------------------
// rc02b-severity-ladder: the write gate's finding-level checks (tasks 1.1, 1.7)
// ---------------------------------------------------------------------------

describe('rc02b: an internal CRITICAL carries its reproduction at the write gate', () => {
  const critical = (reproduction?: unknown) => ({
    severity: 'CRITICAL',
    dimension: 'correctness',
    title: 'Guard bypassed',
    file: 'src/x.ts',
    line: 3,
    recommendation: 'fix',
    ...(reproduction === undefined ? {} : { reproduction }),
  });
  const criticalCard = {
    completeness: { critical: 0, warning: 0, suggestion: 0 },
    correctness: { critical: 1, warning: 0, suggestion: 0 },
    coherence: { critical: 0, warning: 0, suggestion: 0 },
  };

  it('a CRITICAL with no reproduction is refused naming the index and the title; no file is written', () => {
    makeChange('foo');
    expect(() =>
      composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ scorecard: criticalCard, findings: [critical()] }), { projectRoot: root })
    ).toThrow(/write gate: findings\[0\] 'Guard bypassed' is CRITICAL and carries no reproduction/);
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('an empty reproduction and a non-string reproduction on a CRITICAL are refused the same way', () => {
    makeChange('foo');
    for (const bad of ['', '   \n', 42, null, ['x']]) {
      expect(() =>
        composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ scorecard: criticalCard, findings: [critical(bad)] }), { projectRoot: root })
      ).toThrow(/findings\[0\] 'Guard bypassed' is CRITICAL and carries no reproduction/);
    }
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('a multi-line reproduction on a CRITICAL is accepted and written verbatim (not a single-line slot)', () => {
    makeChange('foo');
    const body = 'inputs: a trail with one external pass\nrule: clause (b)\nexpected: unpassed\nobserved: passed';
    const r = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ scorecard: criticalCard, findings: [critical(body)] }), { projectRoot: root });
    expect((r.emit as any).findings[0].reproduction).toBe(body);
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toHaveLength(1);
  });

  it('WARNING and SUGGESTION need no reproduction; a present string passes through', () => {
    makeChange('foo');
    const ok = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload(), { projectRoot: root });
    expect((ok.emit as any).findings[0].reproduction).toBeUndefined();
    const withRepro = validReviewPayload();
    (withRepro.findings[0] as any).reproduction = 'constructed case';
    const r2 = composeAndWriteEmit('review', { change: 'foo' }, withRepro, { projectRoot: root });
    expect((r2.emit as any).findings[0].reproduction).toBe('constructed case');
  });

  it('a mistyped reproduction on a WARNING is refused naming findings[<i>].reproduction', () => {
    makeChange('foo');
    const p = validReviewPayload();
    (p.findings[0] as any).reproduction = 42;
    expect(() => composeAndWriteEmit('review', { change: 'foo' }, p, { projectRoot: root })).toThrow(
      /findings\[0\]\.reproduction/
    );
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('architecture mode (--doc) is checked identically — the check never reads mode', () => {
    write('orbit/architecture/prog.md', '# prog\n');
    const handoff = { boot_sequence: ['CLAUDE.md'], next_command: '/orbit:architect prog', model_hint: null, seam: 'post-review' };
    expect(() =>
      composeAndWriteEmit(
        'review',
        { doc: 'prog' },
        validReviewPayload({ mode: 'architecture', handoff, scorecard: criticalCard, findings: [critical()] }),
        { projectRoot: root }
      )
    ).toThrow(/findings\[0\] 'Guard bypassed' is CRITICAL and carries no reproduction/);
    expect(listRuns('orbit/architecture/.orbit-runs')).toEqual([]);
    const ok = composeAndWriteEmit(
      'review',
      { doc: 'prog' },
      validReviewPayload({ mode: 'architecture', handoff, scorecard: criticalCard, findings: [critical('the case')] }),
      { projectRoot: root }
    );
    expect(ok.emit.doc).toBe('prog');
  });
});

describe('rc02b: the review payload carries blocks', () => {
  it('blocks: [single-line strings] is accepted and written verbatim; the scorecard rollup is unchanged by it', () => {
    makeChange('foo');
    const blocks = ['Pass 1: orbit validate fails — specs/x/spec.md:12 scenario has 3 hashtags', 'Pass 8: unresolved @review: marker at design.md:40'];
    const r = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ blocks }), { projectRoot: root });
    expect((r.emit as any).blocks).toEqual(blocks);
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.blocks).toEqual(blocks);
    expect(written.scorecard).toEqual(validReviewPayload().scorecard);
    expect(written.final_assessment).toBe('0 critical, 1 warning, 0 suggestion.');
  });

  it('absent blocks is accepted and the key is not composed', () => {
    makeChange('foo');
    const r = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload(), { projectRoot: root });
    expect('blocks' in r.emit).toBe(false);
  });

  it('a non-array is refused naming blocks; a non-string or multi-line entry is refused naming blocks[<i>]; nothing is written', () => {
    makeChange('foo');
    expect(() => composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ blocks: 'validate failed' }), { projectRoot: root })).toThrow(/'blocks' must be an array/);
    expect(() => composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ blocks: ['ok', 42] }), { projectRoot: root })).toThrow(/blocks\[1\]/);
    expect(() => composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ blocks: ['line one\nline two'] }), { projectRoot: root })).toThrow(/blocks\[0\]/);
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('blocks is refused on a command whose table does not name it (the key check is per command)', () => {
    makeChange('foo');
    expect(() => composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'ok', model: null, blocks: ['x'] }, { projectRoot: root })).toThrow(/unknown payload key 'blocks'/);
  });
});

// ---------------------------------------------------------------------------
// rc04b-forward-recommendation: the review payload carries `direction` (task 1.1)
// ---------------------------------------------------------------------------

describe('rc04b: the review payload carries direction — owed by the independent classes, shape-checked at every class', () => {
  const direction = {
    disposition: 'hold',
    reasoning: 'the walk-authored mechanism has no test behind it\nand the delta drops a baseline scenario',
  };
  const handoff = { boot_sequence: ['CLAUDE.md'], next_command: '/orbit:architect prog', model_hint: null, seam: 'post-review' };
  const OWED = (cls: string) =>
    `write gate: review emit of class '${cls}' carries no direction — an independent pass owes its forward recommendation`;

  it('a fresh payload with no direction is refused with the ADDED requirement\'s sentence; no file is written', () => {
    makeChange('foo');
    expect(() =>
      composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ reviewer_class: 'fresh' }), { projectRoot: root })
    ).toThrow(OWED('fresh'));
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('an external payload is refused the same way, naming ITS class', () => {
    makeChange('foo');
    expect(() =>
      composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ reviewer_class: 'external' }), { projectRoot: root })
    ).toThrow(OWED('external'));
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('an in-context payload without it writes exactly as before; the key is not composed', () => {
    makeChange('foo');
    const r = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload(), { projectRoot: root });
    expect('direction' in r.emit).toBe(false);
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toHaveLength(1);
  });

  it('a well-shaped direction (multi-line reasoning) writes verbatim at any class; the scorecard rollup and final_assessment are unchanged by it', () => {
    makeChange('foo');
    for (const cls of ['in-context', 'fresh', 'external']) {
      const r = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ reviewer_class: cls, direction }), { projectRoot: root });
      expect((r.emit as any).direction).toEqual(direction);
      const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
      expect(written.direction).toEqual(direction);
      expect(written.scorecard).toEqual(validReviewPayload().scorecard);
      expect(written.final_assessment).toBe('0 critical, 1 warning, 0 suggestion.');
    }
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toHaveLength(3);
  });

  it('a mis-shaped direction is refused at ANY class naming direction / direction.disposition / direction.reasoning; nothing is written', () => {
    makeChange('foo');
    const cases: Array<[unknown, RegExp]> = [
      ['forward', /'direction' must be an object/],
      [null, /'direction' must be an object/],
      [['forward'], /'direction' must be an object/],
      [{ disposition: 'ship', reasoning: 'x' }, /direction\.disposition/],
      [{ disposition: 'Forward', reasoning: 'x' }, /direction\.disposition/],
      [{ reasoning: 'x' }, /direction\.disposition/],
      [{ disposition: 'forward' }, /direction\.reasoning/],
      [{ disposition: 'forward', reasoning: '' }, /direction\.reasoning/],
      [{ disposition: 'forward', reasoning: '  \n ' }, /direction\.reasoning/],
      [{ disposition: 'forward', reasoning: 42 }, /direction\.reasoning/],
    ];
    for (const cls of ['in-context', 'fresh']) {
      for (const [bad, re] of cases) {
        expect(() =>
          composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ reviewer_class: cls, direction: bad }), { projectRoot: root }),
          `${cls}: ${JSON.stringify(bad)}`
        ).toThrow(re);
      }
    }
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
  });

  it('architecture mode (--doc): a fresh payload without it is refused identically — the rule keys on class, never on mode; with it, writes', () => {
    write('orbit/architecture/prog.md', '# prog\n');
    expect(() =>
      composeAndWriteEmit('review', { doc: 'prog' }, validReviewPayload({ mode: 'architecture', reviewer_class: 'fresh', handoff }), { projectRoot: root })
    ).toThrow(OWED('fresh'));
    expect(listRuns('orbit/architecture/.orbit-runs')).toEqual([]);
    const ok = composeAndWriteEmit(
      'review',
      { doc: 'prog' },
      validReviewPayload({ mode: 'architecture', reviewer_class: 'fresh', handoff, direction }),
      { projectRoot: root }
    );
    expect(ok.emit.doc).toBe('prog');
    expect((ok.emit as any).direction).toEqual(direction);
    // An in-context architecture pass stays optional.
    const inCtx = composeAndWriteEmit('review', { doc: 'prog' }, validReviewPayload({ mode: 'architecture', handoff }), { projectRoot: root });
    expect('direction' in inCtx.emit).toBe(false);
  });

  it('a reviewer_class outside the three values is refused naming reviewer_class and the three values — in change mode AND architecture mode (fresh S1)', () => {
    makeChange('foo');
    write('orbit/architecture/prog.md', '# prog\n');
    const NAMES = /reviewer_class.*'in-context' \| 'fresh' \| 'external'/;
    for (const cls of ['Fresh', 'fressh', 'independent']) {
      expect(() =>
        composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ reviewer_class: cls, direction }), { projectRoot: root })
      ).toThrow(NAMES);
      expect(() =>
        composeAndWriteEmit('review', { doc: 'prog' }, validReviewPayload({ mode: 'architecture', reviewer_class: cls, handoff, direction }), { projectRoot: root })
      ).toThrow(NAMES);
    }
    expect(listRuns('orbit/changes/foo/.orbit-runs')).toEqual([]);
    expect(listRuns('orbit/architecture/.orbit-runs')).toEqual([]);
  });

  it('extra keys inside direction are CARRIED, never read — written verbatim, absent from the normalized render shape (system blind pair, fresh S3; declared in the ADDED requirement)', () => {
    makeChange('foo');
    const r = composeAndWriteEmit('review', { change: 'foo' }, validReviewPayload({ reviewer_class: 'fresh', direction: { ...direction, extra: 1 } }), { projectRoot: root });
    expect((r.emit as any).direction).toEqual({ ...direction, extra: 1 });
    expect(normalizeInternalPass(r.path, JSON.parse(fs.readFileSync(r.path, 'utf-8'))).direction).toEqual(direction);
  });

  it('direction is refused on a command whose table does not name it (the key check is per command)', () => {
    makeChange('foo');
    expect(() =>
      composeAndWriteEmit('verify', { change: 'foo' }, { final_assessment: 'ok', model: null, direction }, { projectRoot: root })
    ).toThrow(/unknown payload key 'direction'/);
  });
});
