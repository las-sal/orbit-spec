import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  normalizeInternalPass,
  normalizeExternalPass,
  renderReviewReport,
  buildReportContext,
  collectSameModePasses,
  renderReport,
} from '../../src/core/report-render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, '..', 'fixtures', 'report-golden');

/**
 * Report-renderer tests (D-arc Stage D4, tasks 1.1–1.5). The goldens are
 * TRANSCRIBED from design D2b's canonical rendered example — grammar text is
 * fixed; the tail lines carry the engine's computed strings verbatim. Every
 * golden case asserts BYTE equality (`toBe`), which is arc exit criterion 1.
 */

let root: string;

function fixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf-8');
}

function fixtureJson(name: string): unknown {
  return JSON.parse(fixture(name));
}

/** A spec-driven change with complete artifacts (tasks checkbox state per opts). */
function makeChange(name: string, opts: { tasksDone?: boolean } = {}): string {
  const dir = path.join(root, 'orbit', 'changes', name);
  fs.mkdirSync(path.join(dir, '.orbit-runs'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.openspec.yaml'), 'schema: spec-driven\ncreated: "2026-07-01"\n');
  fs.writeFileSync(path.join(dir, 'proposal.md'), '# Proposal');
  fs.writeFileSync(path.join(dir, 'design.md'), '# Design');
  fs.writeFileSync(
    path.join(dir, 'tasks.md'),
    `## 1. Work\n\n- [${opts.tasksDone ? 'x' : ' '}] 1.1 Do the thing\n`
  );
  fs.mkdirSync(path.join(dir, 'specs', 'some-cap'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'specs', 'some-cap', 'spec.md'),
    '## ADDED Requirements\n\n### Requirement: X\n\nX SHALL Y.\n\n#### Scenario: S\n\n- **WHEN** a\n- **THEN** b\n'
  );
  return dir;
}

function writeTrail(changeDir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(changeDir, '.orbit-runs', name), content);
}

/** A boundary-conformant clean D4 emit (all-zero scorecard, empty findings). */
function d4Emit(change: string, mode: 'proposal' | 'system', extra: Record<string, unknown> = {}): string {
  const zero = { critical: 0, warning: 0, suggestion: 0 };
  return JSON.stringify({
    command: 'review',
    timestamp: '2026-07-25T10:00:00Z',
    change,
    final_assessment: 'No findings.',
    next_recommended: `orbit status --change ${change} --report`,
    kind: 'editorial',
    mode,
    reviewer_class: 'in-context',
    depth: 'full',
    scorecard: { completeness: { ...zero }, correctness: { ...zero }, coherence: { ...zero } },
    findings: [],
    ...extra,
  });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-report-render-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('golden renders (byte-identical to the D2b-transcribed goldens)', () => {
  it('proposal pass: trend over a tolerant legacy prior, scorecard, containment bodies, options, suppressed, commentary, engine tail', () => {
    const dir = makeChange('golden-change');
    writeTrail(dir, 'review-proposal-2026-07-25T10-00-00Z.json', fixture('proposal-prior-legacy.json'));
    writeTrail(dir, 'review-proposal-2026-07-25T11-00-00Z.json', fixture('proposal-pass.json'));

    const report = renderReport(root, 'golden-change');
    expect(report).toBe(fixture('proposal-pass.golden.md'));

    // Byte determinism: the same fixture rendered twice is byte-identical.
    expect(renderReport(root, 'golden-change')).toBe(report);

    // Blockquote containment: the recommendation's `## CRITICAL`, `---`, and
    // fence lines never sit at column 0 in the findings body (the report's own
    // `---` tail rule is the single column-0 rule).
    expect(report).toContain('  > ## CRITICAL');
    expect(report).toContain('  > ---');
    expect(report).toContain('  > ```');
    // Option bodies are single-line (embedded newline collapsed to one space).
    expect(report).toContain('  - (B) Convert the delta to ADDED and leave the baseline untouched');
  });

  it('system pass: first-run literal, all-zero scorecard, Findings + Commentary omitted whole, system-phase gate tail', () => {
    const dir = makeChange('sys-change', { tasksDone: true });
    writeTrail(dir, 'review-system-2026-07-26T09-00-00Z.json', fixture('system-clean.json'));

    const report = renderReport(root, 'sys-change');
    expect(report).toBe(fixture('system-clean.golden.md'));
    expect(report).toContain('First system-mode review of this change.');
    // D4-generation emit without commentary renders fine — section omitted.
    expect(report).not.toContain('### Commentary');
    expect(report).not.toContain('### Findings');
  });

  it('commentary with near-miss phrasing stays quarantined behind the blockquote delimiter; the engine tail has the last word', () => {
    const dir = makeChange('nearmiss-change');
    writeTrail(dir, 'review-proposal-2026-07-25T14-00-00Z.json', fixture('nearmiss-commentary.json'));

    const report = renderReport(root, 'nearmiss-change');
    expect(report).toBe(fixture('nearmiss-commentary.golden.md'));
    // The near-miss verdict appears ONLY blockquote-contained, never at column 0.
    expect(report).toContain('> Gate review-proposal: passed — ship it.');
    expect(report).not.toMatch(/^Gate review-proposal: passed/m);
    // The engine's computed gate line renders after the commentary (tail last).
    expect(report.indexOf('Gate review-proposal: unpassed')).toBeGreaterThan(
      report.indexOf('> Gate review-proposal: passed')
    );
  });

  it('external pass renders through the shared grammar: reviewer/date header, no scorecard, Description bodies verbatim, Notes → Commentary', () => {
    const dir = makeChange('ext-change');
    writeTrail(dir, 'external-proposal-2026-07-25T12-00-00Z.md', fixture('external-pass.md'));

    const report = renderReport(root, 'ext-change');
    expect(report).toBe(fixture('external-pass.golden.md'));
    expect(report).toContain('Reviewer: external (GPT-5 Codex, 2026-07-25)');
    expect(report).not.toContain('| Dimension'); // no scorecard, never fabricated
    expect(report).not.toContain('Depth:'); // the depth cell disappears whole
    // The fenced `## CRITICAL` inside the Description stayed body content.
    expect(report).toContain('  > ## CRITICAL');
  });

  it('ungated schema: the tail is the `---` rule alone (no gate/position/eligibility line invented)', () => {
    // Project-local gateless schema (no gates:, no apply:) — the D3 pattern.
    const schemaDir = path.join(root, 'orbit', 'schemas', 'plain');
    fs.mkdirSync(schemaDir, { recursive: true });
    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      'name: plain\nversion: 1\ndescription: Gateless schema\nartifacts:\n' +
        '  - id: notes\n    generates: notes.md\n    description: Notes artifact\n    template: notes.md\n'
    );
    const dir = path.join(root, 'orbit', 'changes', 'ungated-change');
    fs.mkdirSync(path.join(dir, '.orbit-runs'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.openspec.yaml'), 'schema: plain\ncreated: "2026-07-01"\n');
    fs.writeFileSync(path.join(dir, 'notes.md'), '# Notes');
    writeTrail(dir, 'review-proposal-2026-07-25T15-00-00Z.json', fixture('ungated-pass.json'));

    const report = renderReport(root, 'ungated-change');
    expect(report).toBe(fixture('ungated-pass.golden.md'));
    expect(report.endsWith('---\n')).toBe(true);
    expect(report).not.toContain('Gate ');
    expect(report).not.toContain('Position:');
    expect(report).not.toContain('Ready when you are:');
  });
});

describe('render-time computed context (as-of iteration/trend, current tail, total order)', () => {
  it('historical pass renders as-of iteration + trend (later passes excluded) with TODAY\'s tail', () => {
    const dir = makeChange('hist-change');
    // t10: legacy prior (findings_summary 0C/2W/0S); t11: D4 pass with one
    // finding; t12: D4 clean — the trail's newest.
    writeTrail(
      dir,
      'review-proposal-2026-07-25T10-00-00Z.json',
      JSON.stringify({
        command: 'review',
        timestamp: '2026-07-25T10:00:00Z',
        change: 'hist-change',
        final_assessment: 'legacy',
        next_recommended: 'n',
        kind: 'editorial',
        mode: 'proposal',
        findings_summary: { critical: 0, warning: 2, suggestion: 0 },
      })
    );
    const oneFinding = {
      severity: 'WARNING',
      dimension: 'completeness',
      title: 'A carried warning',
      file: 'orbit/changes/hist-change/design.md',
      line: 5,
      recommendation: 'Fix it.',
    };
    writeTrail(
      dir,
      'review-proposal-2026-07-25T11-00-00Z.json',
      d4Emit('hist-change', 'proposal', {
        scorecard: {
          completeness: { critical: 0, warning: 1, suggestion: 0 },
          correctness: { critical: 0, warning: 0, suggestion: 0 },
          coherence: { critical: 0, warning: 0, suggestion: 0 },
        },
        findings: [oneFinding],
        // W2 spine semantics: the counts sentence + the deterministic pointer.
        final_assessment: '0 critical, 1 warning, 0 suggestion.',
        next_recommended:
          '/orbit:address-reviews hist-change --from-file orbit/changes/hist-change/.orbit-runs/review-proposal-2026-07-25T11-00-00Z.json',
      })
    );
    writeTrail(dir, 'review-proposal-2026-07-25T12-00-00Z.json', d4Emit('hist-change', 'proposal'));

    const historical = renderReport(root, 'hist-change', '2026-07-25T11-00-00Z');
    expect(historical).toContain('Mode: proposal · Iteration: 2 ·');
    // As-of trend: two points only — the t12 pass (later) is excluded.
    expect(historical).toContain('Trend: 0C/2W/0S → 0C/1W/0S (0 repeat, 1 new)');
    expect(historical).not.toContain('→ 0C/0W/0S');

    // The tail alone is CURRENT: identical to the newest render's tail.
    const newest = renderReport(root, 'hist-change');
    expect(newest).toContain('Mode: proposal · Iteration: 3 ·');
    expect(newest).toContain('Trend: 0C/2W/0S → 0C/1W/0S → 0C/0W/0S');
    const tailOf = (r: string) => r.slice(r.lastIndexOf('\n---\n'));
    expect(tailOf(historical)).toBe(tailOf(newest));
  });

  it('equal-token pair: distinct ordinals and a unique final trend point (the shared tie-break order)', () => {
    const dir = makeChange('tie-change');
    const token = '2026-07-25T10-00-00Z';
    writeTrail(
      dir,
      `review-proposal-${token}.json`,
      d4Emit('tie-change', 'proposal', {
        scorecard: {
          completeness: { critical: 1, warning: 0, suggestion: 0 },
          correctness: { critical: 0, warning: 0, suggestion: 0 },
          coherence: { critical: 0, warning: 0, suggestion: 0 },
        },
        findings: [
          {
            severity: 'CRITICAL',
            dimension: 'completeness',
            title: 'Internal-only finding',
            file: 'orbit/changes/tie-change/proposal.md',
            line: 1,
            recommendation: 'Fix.',
          },
        ],
        // W2 spine semantics: the counts sentence + the deterministic pointer.
        final_assessment: '1 critical, 0 warning, 0 suggestion.',
        next_recommended: `/orbit:address-reviews tie-change --from-file orbit/changes/tie-change/.orbit-runs/review-proposal-${token}.json`,
      })
    );
    writeTrail(
      dir,
      `external-proposal-${token}.md`,
      '# External Review: tie-change (iteration 2)\n\n**Reviewer**: R\n**Date**: 2026-07-25\n\n' +
        '## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
    );

    // The lexicographically-earlier filename (external-…) is MORE recent: the
    // internal pass is ordinal 1, the external ordinal 2 — same-second passes
    // hold distinct ordinals and the trend's final point is unique.
    const order = collectSameModePasses(dir, 'proposal');
    expect(order.map((p) => path.basename(p.file))).toEqual([
      `review-proposal-${token}.json`,
      `external-proposal-${token}.md`,
    ]);

    const internal = normalizeInternalPass(
      path.join(dir, '.orbit-runs', `review-proposal-${token}.json`),
      fixtureJsonAt(dir, `review-proposal-${token}.json`)
    );
    const external = normalizeExternalPass(
      path.join(dir, '.orbit-runs', `external-proposal-${token}.md`),
      fs.readFileSync(path.join(dir, '.orbit-runs', `external-proposal-${token}.md`), 'utf-8')
    );
    const ctxInternal = buildReportContext(root, 'tie-change', dir, internal);
    const ctxExternal = buildReportContext(root, 'tie-change', dir, external);
    expect(ctxInternal.iteration).toBe(1);
    expect(ctxExternal.iteration).toBe(2);
    expect(ctxInternal.trend).toEqual([{ critical: 1, warning: 0, suggestion: 0 }]);
    expect(ctxExternal.trend).toEqual([
      { critical: 1, warning: 0, suggestion: 0 },
      { critical: 0, warning: 0, suggestion: 0 },
    ]);

    // Newest-default resolution picks the tie-break winner (the external).
    const report = renderReport(root, 'tie-change');
    expect(report).toContain('Reviewer: external (R, 2026-07-25)');
  });

  it('repeat/new match by trimmed title + line-stripped path against the immediately-prior same-mode pass', () => {
    const dir = makeChange('repeat-change');
    const finding = (line: number) => ({
      severity: 'WARNING',
      dimension: 'correctness',
      title: 'Same finding, different line',
      file: 'orbit/changes/repeat-change/design.md',
      line,
      recommendation: 'Fix.',
    });
    const card = {
      completeness: { critical: 0, warning: 0, suggestion: 0 },
      correctness: { critical: 0, warning: 1, suggestion: 0 },
      coherence: { critical: 0, warning: 0, suggestion: 0 },
    };
    // W2 spine semantics per emit: the counts sentence + each pass's own pointer.
    const spine = (ts: string) => ({
      final_assessment: '0 critical, 1 warning, 0 suggestion.',
      next_recommended: `/orbit:address-reviews repeat-change --from-file orbit/changes/repeat-change/.orbit-runs/review-proposal-${ts}.json`,
    });
    writeTrail(
      dir,
      'review-proposal-2026-07-25T10-00-00Z.json',
      d4Emit('repeat-change', 'proposal', {
        scorecard: card,
        findings: [finding(5)],
        ...spine('2026-07-25T10-00-00Z'),
      })
    );
    writeTrail(
      dir,
      'review-proposal-2026-07-25T11-00-00Z.json',
      d4Emit('repeat-change', 'proposal', {
        scorecard: card,
        findings: [finding(9)],
        ...spine('2026-07-25T11-00-00Z'),
      })
    );

    // Line differs; the line-stripped path + trimmed title still match → repeat.
    const report = renderReport(root, 'repeat-change');
    expect(report).toContain('(1 repeat, 0 new)');
  });
});

describe('strict validation — fail loud, no partial render', () => {
  const D4_PATH = '/fake/review-proposal-2026-07-25T10-00-00Z.json';

  function d4Object(): Record<string, unknown> {
    return JSON.parse(d4Emit('v-change', 'proposal'));
  }

  it('pre-boundary emits from the REAL archives fail with the clean pre-capability error', () => {
    // B2-era shape: kind + findings_summary, no scorecard, findings absent.
    const b2 = fixtureJson('pre-boundary-b2-kind-findings-summary.json');
    expect(() => normalizeInternalPass('/fake/b2.json', b2)).toThrow(/pre-capability emit/);
    expect(() => normalizeInternalPass('/fake/b2.json', b2)).toThrow(/D4-generation boundary/);
    expect(() => normalizeInternalPass('/fake/b2.json', b2)).toThrow(/\/fake\/b2\.json/);

    // D3-cycle shape: scorecard, no spine kind, no per-finding dimension.
    const d3 = fixtureJson('pre-boundary-d3-scorecard-no-kind.json');
    expect(() => normalizeInternalPass('/fake/d3.json', d3)).toThrow(/pre-capability emit/);
    expect(() => normalizeInternalPass('/fake/d3.json', d3)).toThrow(/D4-generation boundary/);
  });

  it('scorecard/findings mismatch fails whole, naming the cell', () => {
    const json = fixtureJson('mismatch-cell.json');
    expect(() => normalizeInternalPass(D4_PATH, json)).toThrow(
      /scorecard\/findings mismatch: scorecard\.completeness\.critical is 0 but active findings roll up to 1/
    );
    expect(() => normalizeInternalPass(D4_PATH, json)).toThrow(new RegExp(D4_PATH.replace(/\//g, '\\/')));
  });

  it('missing reviewer_class fails naming the field and file', () => {
    const json = d4Object();
    delete json.reviewer_class;
    expect(() => normalizeInternalPass(D4_PATH, json)).toThrow(/'reviewer_class'/);
    expect(() => normalizeInternalPass(D4_PATH, json)).toThrow(/review-proposal-2026-07-25T10-00-00Z\.json/);
  });

  it('a finding missing severity fails naming the entry field', () => {
    const json = d4Object();
    json.findings = [
      {
        dimension: 'completeness',
        title: 'No severity here',
        file: 'a.md',
        line: 1,
        recommendation: 'x',
      },
    ];
    expect(() => normalizeInternalPass(D4_PATH, json)).toThrow(/'findings\[0\]\.severity'/);
  });

  it('a mistyped scorecard cell fails naming the cell path', () => {
    const json = d4Object();
    (json.scorecard as Record<string, Record<string, unknown>>).coherence.warning = -1;
    expect(() => normalizeInternalPass(D4_PATH, json)).toThrow(/'scorecard\.coherence\.warning'/);
  });

  it('optional fields are absent-safe but shape-checked when present', () => {
    const ok = d4Object();
    // Absent commentary / stale_suppressed / recommendation_options: valid.
    expect(() => normalizeInternalPass(D4_PATH, ok)).not.toThrow();
    const bad = d4Object();
    bad.commentary = 42;
    expect(() => normalizeInternalPass(D4_PATH, bad)).toThrow(/'commentary'/);
  });
});

describe('external parse — fence-aware, mandatory unique Reviewer/Date', () => {
  const EXT_PATH = '/fake/external-proposal-2026-07-25T12-00-00Z.md';
  const SECTIONS = '## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n';

  it('missing Reviewer / missing Date / duplicate Reviewer are parse rejections naming the field and file', () => {
    const noReviewer = `# External Review: x\n\n**Date**: 2026-07-25\n\n${SECTIONS}`;
    expect(() => normalizeExternalPass(EXT_PATH, noReviewer)).toThrow(/missing '\*\*Reviewer\*\*:' field/);
    expect(() => normalizeExternalPass(EXT_PATH, noReviewer)).toThrow(/external-proposal-2026-07-25T12-00-00Z\.md/);

    const noDate = `# External Review: x\n\n**Reviewer**: R\n\n${SECTIONS}`;
    expect(() => normalizeExternalPass(EXT_PATH, noDate)).toThrow(/missing '\*\*Date\*\*:' field/);

    const dupReviewer = `# External Review: x\n\n**Reviewer**: R\n**Reviewer**: S\n**Date**: 2026-07-25\n\n${SECTIONS}`;
    expect(() => normalizeExternalPass(EXT_PATH, dupReviewer)).toThrow(/duplicate '\*\*Reviewer\*\*:' field/);
  });

  it('a file missing a severity section is a parse rejection naming the section and file', () => {
    const content = '# External Review: x\n\n**Reviewer**: R\n**Date**: 2026-07-25\n\n## CRITICAL\n\nNone.\n';
    expect(() => normalizeExternalPass(EXT_PATH, content)).toThrow(/missing '## WARNING' section/);
    expect(() => normalizeExternalPass(EXT_PATH, content)).toThrow(/external-proposal-2026-07-25T12-00-00Z\.md/);
  });

  it('fenced heading and field lines never count: `## CRITICAL` and `**Reviewer**:` inside a fence stay body content', () => {
    const pass = normalizeExternalPass(EXT_PATH, fixture('external-pass.md'));
    expect(pass.reviewerName).toBe('GPT-5 Codex');
    expect(pass.reviewerDate).toBe('2026-07-25');
    expect(pass.findings).toHaveLength(2);
    const critical = pass.findings[0];
    expect(critical.severity).toBe('CRITICAL');
    // The File line reference is RETAINED un-stripped in the render reference.
    expect(critical.fileRef).toBe('src/core/example.ts:42');
    expect(critical.matchFile).toBe('src/core/example.ts');
    // Description body verbatim, fence block included.
    expect(critical.recommendation).toContain('```\n## CRITICAL\n**Reviewer**: forged\n```');
    // Notes body supplies the Commentary slot.
    expect(pass.commentary).toBe('Probed the archive seam hardest; the engine guard held. Risk texture: low.');
  });

  it('a `None.` severity body contributes zero findings', () => {
    const content = `# External Review: x\n\n**Reviewer**: R\n**Date**: 2026-07-25\n\n${SECTIONS}`;
    const pass = normalizeExternalPass(EXT_PATH, content);
    expect(pass.findings).toHaveLength(0);
  });
});

describe('the pure render is deterministic over its inputs', () => {
  it('renderReviewReport is byte-deterministic for the same pass + context', () => {
    const pass = normalizeInternalPass(
      '/fake/review-proposal-2026-07-25T11-00-00Z.json',
      fixtureJson('proposal-pass.json')
    );
    const ctx = {
      change: 'golden-change',
      iteration: 2,
      trend: [
        { critical: 0, warning: 3, suggestion: 2 },
        { critical: 1, warning: 1, suggestion: 1 },
      ],
      repeatCount: 0,
      newCount: 3,
      gateLine: 'Gate review-proposal: unpassed — pass 2026-07-25T10-00-00Z has unresolved substantive findings',
      position:
        'propose ✓ → review(proposal) unpassed → apply ready → review(system) blocked-by-gate → archive blocked-by-gate',
      nextCommand:
        '/orbit:address-reviews golden-change --from-file orbit/changes/golden-change/.orbit-runs/review-proposal-2026-07-25T10-00-00Z.json',
    };
    const a = renderReviewReport(pass, ctx);
    const b = renderReviewReport(pass, ctx);
    expect(a).toBe(b);
    expect(a).toBe(fixture('proposal-pass.golden.md'));
  });
});

/** Read a trail JSON back for direct normalize calls. */
function fixtureJsonAt(changeDir: string, name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(changeDir, '.orbit-runs', name), 'utf-8'));
}
