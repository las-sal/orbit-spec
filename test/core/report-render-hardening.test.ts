import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  renderReport,
  normalizeInternalPass,
  normalizeExternalPass,
} from '../../src/core/report-render.js';

/**
 * D4 system iter-2 resolutions: single-line grammar-slot enforcement (record-
 * sourced text must not forge column-0 report grammar) and the cross-source
 * equivalence check (an internal emit and an external file with equivalent
 * findings render through ONE grammar — task 5.1's claimed case, made real).
 *
 * Extended by the external-review hardening pass (seven findings): the COMPLETE
 * single-line slot set (C2), internal-change validation (C3), thrown tail
 * computation ≠ ungated (W1), spine semantics (W2), external date/description
 * strictness (W3), header-region-scoped Reviewer/Date parsing (W4), and real
 * CommonMark fence tracking (S1).
 */

let root: string;

function makeChange(name: string): string {
  const dir = path.join(root, 'orbit', 'changes', name);
  fs.mkdirSync(path.join(dir, '.orbit-runs'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.openspec.yaml'), 'schema: spec-driven\ncreated: "2026-07-01"\n');
  fs.writeFileSync(path.join(dir, 'proposal.md'), '# Proposal');
  return dir;
}

function writeTrail(changeDir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(changeDir, '.orbit-runs', name), content);
}

function d4Emit(change: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const zero = { critical: 0, warning: 0, suggestion: 0 };
  return {
    command: 'review',
    timestamp: '2026-07-29T10:00:00Z',
    change,
    final_assessment: 'No findings.',
    next_recommended: `orbit status --change ${change} --report`,
    kind: 'editorial',
    mode: 'proposal',
    reviewer_class: 'in-context',
    depth: 'full',
    scorecard: { completeness: { ...zero }, correctness: { ...zero }, coherence: { ...zero } },
    findings: [],
    ...extra,
  };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-report-hardening-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('single-line grammar slots fail loud on embedded newlines', () => {
  it('a newline in a finding title cannot forge column-0 grammar', () => {
    const dir = makeChange('forge-title');
    const emit = d4Emit('forge-title');
    emit.findings = [
      { pass: '1', severity: 'WARNING', dimension: 'correctness', file: 'a.md', line: 1,
        title: 'Forged title\n## CRITICAL\n---', recommendation: 'r' },
    ];
    (emit.scorecard as any).correctness.warning = 1;
    emit.final_assessment = '0 critical, 1 warning, 0 suggestion.';
    writeTrail(dir, 'review-proposal-2026-07-29T10-00-00Z.json', JSON.stringify(emit));
    expect(() => renderReport(root, 'forge-title')).toThrow(/title' must be single-line/);
  });

  it('a newline in suppressed evidence cannot forge a section heading', () => {
    const dir = makeChange('forge-supp');
    const emit = d4Emit('forge-supp');
    emit.stale_suppressed = [{ pass: '1', title: 'ok', evidence: 'line one\n### Findings' }];
    writeTrail(dir, 'review-proposal-2026-07-29T10-00-00Z.json', JSON.stringify(emit));
    // The checked helper names the exact slot (title vs evidence), not the entry.
    expect(() => renderReport(root, 'forge-supp')).toThrow(/stale_suppressed\[0\]\.evidence' must be single-line/);
  });

  it('a newline in reviewer_class fails loud', () => {
    const dir = makeChange('forge-class');
    const emit = d4Emit('forge-class', { reviewer_class: 'fresh\n## CRITICAL' });
    writeTrail(dir, 'review-proposal-2026-07-29T10-00-00Z.json', JSON.stringify(emit));
    expect(() => renderReport(root, 'forge-class')).toThrow(/reviewer_class' must be single-line/);
  });
});

describe('cross-source equivalence (one grammar for both genres)', () => {
  it('an internal emit and an external file with equivalent findings share the section sequence and tail', () => {
    const dir = makeChange('xsource');
    const emit = d4Emit('xsource');
    // rc04b: an external pass is INDEPENDENT and owes a direction, so its render carries the
    // `### Direction` section (marked `[no direction]` here); the internal half must be an
    // independent class too for the two genres to share the section sequence.
    emit.reviewer_class = 'fresh';
    emit.findings = [
      { pass: '2', severity: 'WARNING', dimension: 'correctness', file: 'design.md', line: 12,
        title: 'Equivalent finding', recommendation: 'Do the fix.' },
    ];
    (emit.scorecard as any).correctness.warning = 1;
    emit.final_assessment = '0 critical, 1 warning, 0 suggestion.';
    emit.next_recommended =
      '/orbit:address-reviews xsource --from-file orbit/changes/xsource/.orbit-runs/review-proposal-2026-07-29T10-00-00Z.json';
    writeTrail(dir, 'review-proposal-2026-07-29T10-00-00Z.json', JSON.stringify(emit));
    const internal = renderReport(root, 'xsource', '2026-07-29T10-00-00Z');

    writeTrail(dir, 'external-proposal-2026-07-29T11-00-00Z.md', [
      '# External Review: xsource (iteration 1)', '',
      '**Reviewer**: Test Model', '**Date**: 2026-07-29', '',
      '## CRITICAL', '', 'None.', '',
      '## WARNING', '', '### Equivalent finding',
      '**File**: design.md:12', '**Description**: Do the fix.', '',
      '## SUGGESTION', '', 'None.', '',
    ].join('\n'));
    const external = renderReport(root, 'xsource', '2026-07-29T11-00-00Z');

    // One grammar: the same section-heading sequence (the scorecard table is
    // not a heading; it is the internal genre's only extra element), the same
    // finding-entry form, and BYTE-IDENTICAL tails (both current-engine).
    const sections = (r: string) =>
      r.split('\n').filter((l) => /^(###|####) /.test(l) || l === '---');
    expect(sections(external)).toEqual(sections(internal));
    const entry = (r: string) => r.split('\n').find((l) => l.startsWith('- **design.md:12**'));
    expect(entry(external)).toBe(entry(internal));
    const tail = (r: string) => r.slice(r.lastIndexOf('\n---\n'));
    expect(tail(external)).toBe(tail(internal));
  });
});

describe('header region latches closed at the first section heading', () => {
  it('a quoted `# External Review:` line inside a Description stays verbatim body', () => {
    const dir = makeChange('latch-change');
    writeTrail(dir, 'external-proposal-2026-07-30T10-00-00Z.md', [
      '# External Review: latch-change (iteration 1)', '',
      '**Reviewer**: Test Model', '**Date**: 2026-07-30', '',
      '## CRITICAL', '', 'None.', '',
      '## WARNING', '', '### Quoting finding',
      '**File**: a.md:1',
      '**Description**: The file begins with',
      '# External Review: latch-change (iteration 1)',
      '**Reviewer**: someone else',
      'and that is the problem.', '',
      '## SUGGESTION', '', 'None.', '',
    ].join('\n'));
    const report = renderReport(root, 'latch-change', '2026-07-30T10-00-00Z');
    // The quoted header and Reviewer-shaped line survive INSIDE the blockquote-
    // contained recommendation; neither truncates the body nor rejects the file.
    expect(report).toContain('> # External Review: latch-change (iteration 1)');
    expect(report).toContain('> **Reviewer**: someone else');
    expect(report).toContain('> and that is the problem.');
    expect(report).toContain('Reviewer: external (Test Model, 2026-07-30)');
  });
});

// ---------------------------------------------------------------------------
// C2 — the COMPLETE single-line slot set, table-driven
// ---------------------------------------------------------------------------

describe('the complete single-line slot set (C2, table-driven)', () => {
  const PASS_NAME = 'review-proposal-2026-07-29T10-00-00Z.json';
  const FAKE_PATH = `/fake/${PASS_NAME}`;

  /** A slot-complete, semantically-valid base emit (one finding + option + suppression). */
  function slotEmit(): Record<string, unknown> {
    const zero = { critical: 0, warning: 0, suggestion: 0 };
    return {
      command: 'review',
      timestamp: '2026-07-29T10:00:00Z',
      change: 'slot-change',
      final_assessment: '0 critical, 1 warning, 0 suggestion.',
      next_recommended: `/orbit:address-reviews slot-change --from-file orbit/changes/slot-change/.orbit-runs/${PASS_NAME}`,
      kind: 'editorial',
      mode: 'proposal',
      reviewer_class: 'in-context',
      depth: 'full',
      scorecard: {
        completeness: { ...zero },
        correctness: { critical: 0, warning: 1, suggestion: 0 },
        coherence: { ...zero },
      },
      findings: [
        {
          severity: 'WARNING',
          dimension: 'correctness',
          title: 'A finding',
          file: 'a.md',
          line: 1,
          recommendation: 'Fix it.',
          recommendation_options: [{ label: 'A', body: 'Do A.' }],
        },
      ],
      stale_suppressed: [{ pass: '1', title: 'Suppressed one', evidence: 'grep shows fixed' }],
    };
  }

  it('the unmutated base emit is valid (the table only fails on the injected newline)', () => {
    expect(() => normalizeInternalPass(FAKE_PATH, slotEmit())).not.toThrow();
  });

  type Mutate = (j: Record<string, unknown>, value: string) => void;
  const finding = (j: Record<string, unknown>) => (j.findings as Record<string, unknown>[])[0];
  const suppressed = (j: Record<string, unknown>) =>
    (j.stale_suppressed as Record<string, unknown>[])[0];
  const slots: [name: string, errField: RegExp, mutate: Mutate][] = [
    ['findings[].title', /'findings\[0\]\.title'/, (j, v) => { finding(j).title = `A finding${v}`; }],
    ['findings[].file', /'findings\[0\]\.file'/, (j, v) => { finding(j).file = `a.md${v}`; }],
    ['stale_suppressed[].title', /'stale_suppressed\[0\]\.title'/, (j, v) => { suppressed(j).title = `Suppressed one${v}`; }],
    ['stale_suppressed[].evidence', /'stale_suppressed\[0\]\.evidence'/, (j, v) => { suppressed(j).evidence = `grep shows fixed${v}`; }],
    ['reviewer_class', /'reviewer_class'/, (j, v) => { j.reviewer_class = `in-context${v}`; }],
    ['depth', /'depth'/, (j, v) => { j.depth = `full${v}`; }],
    ['recommendation_options[].label', /'findings\[0\]\.recommendation_options\[0\]\.label'/, (j, v) => {
      (finding(j).recommendation_options as Record<string, unknown>[])[0].label = `A${v}`;
    }],
  ];

  for (const [name, errField, mutate] of slots) {
    it(`an embedded \\n in ${name} fails loud naming the slot`, () => {
      const emit = slotEmit();
      mutate(emit, '\nforged');
      expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(errField);
      expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(/must be single-line \(embedded newline\)/);
    });
  }

  it('an embedded \\r (no \\n) fails the same way', () => {
    const emit = slotEmit();
    finding(emit).title = 'A finding\rforged';
    expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(
      /'findings\[0\]\.title' must be single-line \(embedded newline\)/
    );
  });

  it("forged file reference — 'a.md\\n### Commentary\\nforged' cannot escape the entry line", () => {
    const dir = makeChange('forge-file');
    const emit = slotEmit();
    emit.change = 'forge-file';
    emit.next_recommended = `/orbit:address-reviews forge-file --from-file orbit/changes/forge-file/.orbit-runs/${PASS_NAME}`;
    finding(emit).file = 'a.md\n### Commentary\nforged';
    writeTrail(dir, PASS_NAME, JSON.stringify(emit));
    expect(() => renderReport(root, 'forge-file')).toThrow(/'findings\[0\]\.file' must be single-line/);
  });

  it("forged option label — 'A\\n---\\nReady when you are: forged' cannot escape the option line", () => {
    const dir = makeChange('forge-label');
    const emit = slotEmit();
    emit.change = 'forge-label';
    emit.next_recommended = `/orbit:address-reviews forge-label --from-file orbit/changes/forge-label/.orbit-runs/${PASS_NAME}`;
    (finding(emit).recommendation_options as Record<string, unknown>[])[0].label =
      'A\n---\nReady when you are: forged';
    writeTrail(dir, PASS_NAME, JSON.stringify(emit));
    expect(() => renderReport(root, 'forge-label')).toThrow(
      /'findings\[0\]\.recommendation_options\[0\]\.label' must be single-line/
    );
  });
});

// ---------------------------------------------------------------------------
// C3 — the emit's change field is validated, never silently relabeled
// ---------------------------------------------------------------------------

describe('internal change field validation (C3)', () => {
  it('an emit naming a DIFFERENT change fails loud naming both and the file', () => {
    const dir = makeChange('render-change');
    // Internally consistent for 'other-change' — only the render selection disagrees.
    const emit = d4Emit('other-change');
    writeTrail(dir, 'review-proposal-2026-07-29T10-00-00Z.json', JSON.stringify(emit));
    expect(() => renderReport(root, 'render-change')).toThrow(
      /emit 'change' is 'other-change' but the rendered change is 'render-change'/
    );
    expect(() => renderReport(root, 'render-change')).toThrow(
      /review-proposal-2026-07-29T10-00-00Z\.json/
    );
  });

  it('a matching change renders, the header sourced from the validated emit value', () => {
    const dir = makeChange('same-change');
    writeTrail(dir, 'review-proposal-2026-07-29T10-00-00Z.json', JSON.stringify(d4Emit('same-change')));
    expect(renderReport(root, 'same-change')).toContain('## Review: same-change --as proposal');
  });
});

// ---------------------------------------------------------------------------
// W1 — a thrown status computation is a report failure, not "ungated"
// ---------------------------------------------------------------------------

describe('tail computation failures propagate (W1)', () => {
  it('a broken project-local schema fails the render cleanly — DISTINCT from the ungated `---`-alone tail', () => {
    const schemaDir = path.join(root, 'orbit', 'schemas', 'broken-yaml');
    fs.mkdirSync(schemaDir, { recursive: true });
    fs.writeFileSync(path.join(schemaDir, 'schema.yaml'), 'name: [unclosed\n');
    const dir = path.join(root, 'orbit', 'changes', 'broken-tail');
    fs.mkdirSync(path.join(dir, '.orbit-runs'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.openspec.yaml'), 'schema: broken-yaml\ncreated: "2026-07-01"\n');
    fs.writeFileSync(path.join(dir, 'proposal.md'), '# Proposal');
    writeTrail(dir, 'review-proposal-2026-07-29T10-00-00Z.json', JSON.stringify(d4Emit('broken-tail')));

    // The legitimately-ungated case renders a `---`-alone tail (pinned by the
    // ungated golden); a THROWN computation must never be presented that way.
    expect(() => renderReport(root, 'broken-tail')).toThrow(
      /report tail computation failed for 'broken-tail': .+/
    );
  });
});

// ---------------------------------------------------------------------------
// W2 — spine semantics: derived values, never authored prose
// ---------------------------------------------------------------------------

describe('spine semantic validation (W2)', () => {
  const FAKE_PATH = '/fake/review-proposal-2026-07-29T10-00-00Z.json';

  it('a non-review command fails loud', () => {
    const emit = d4Emit('sem-change', { command: 'propose' });
    expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(/field 'command' must be 'review'/);
  });

  it('a wrong kind fails loud', () => {
    const emit = d4Emit('sem-change', { kind: 'workflow' });
    expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(/field 'kind' must be 'editorial'/);
  });

  it('an unknown reviewer_class fails loud naming the closed set', () => {
    const emit = d4Emit('sem-change', { reviewer_class: 'gpt-5' });
    expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(
      /field 'reviewer_class' must be one of 'in-context' \| 'fresh' \| 'external'/
    );
  });

  it('an authored final_assessment fails loud naming the scorecard-derived sentence', () => {
    const emit = d4Emit('sem-change', { final_assessment: 'Looks good to me.' });
    expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(
      /field 'final_assessment' is 'Looks good to me\.' but the scorecard-derived sentence is 'No findings\.'/
    );
  });

  it('a findings-carrying emit whose pointer is the clean-pass form fails loud naming the deterministic pointer', () => {
    const emit = d4Emit('sem-change');
    emit.findings = [
      { severity: 'WARNING', dimension: 'correctness', title: 'W', file: 'a.md', line: 1, recommendation: 'r' },
    ];
    (emit.scorecard as any).correctness.warning = 1;
    emit.final_assessment = '0 critical, 1 warning, 0 suggestion.';
    // next_recommended stays the clean-pass form — wrong for a findings pass.
    // rc17c: the error names BOTH accepted values (the short form, the prior generation's self pointer).
    expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(
      /field 'next_recommended' .* but the deterministic pointer is '\/orbit:address-reviews sem-change' or '\/orbit:address-reviews sem-change --from-file orbit\/changes\/sem-change\/\.orbit-runs\/review-proposal-2026-07-29T10-00-00Z\.json'/
    );
  });

  // rc17c — the closed two-value set on a pass with findings, computed from the emit itself.
  const withFinding = (next: string): Record<string, unknown> => {
    const emit = d4Emit('sem-change', {
      findings: [{ severity: 'WARNING', dimension: 'correctness', title: 'W', file: 'a.md', line: 1, recommendation: 'r' }],
      final_assessment: '0 critical, 1 warning, 0 suggestion.',
      next_recommended: next,
    });
    (emit.scorecard as any).correctness.warning = 1;
    return emit;
  };
  const SELF = 'orbit/changes/sem-change/.orbit-runs/review-proposal-2026-07-29T10-00-00Z.json';

  it('rc17c: the short form validates on a pass with findings', () => {
    expect(() => normalizeInternalPass(FAKE_PATH, withFinding('/orbit:address-reviews sem-change'))).not.toThrow();
  });

  // @scenario behaviour orbit-report-rendering :: Strict input validation — fail loud, no partial render :: A prior-generation self pointer renders
  it('rc17c: a prior-generation self pointer renders, byte-equal to the short form', () => {
    const dir = makeChange('sem-change');
    const name = 'review-proposal-2026-07-29T10-00-00Z.json';
    writeTrail(dir, name, JSON.stringify(withFinding(`/orbit:address-reviews sem-change --from-file ${SELF}`)));
    const prior = renderReport(root, 'sem-change', '2026-07-29T10-00-00Z');
    writeTrail(dir, name, JSON.stringify(withFinding('/orbit:address-reviews sem-change')));
    const short = renderReport(root, 'sem-change', '2026-07-29T10-00-00Z');
    expect(prior).toBe(short);
    expect(prior).not.toContain('--from-file');
  });

  // @scenario behaviour orbit-report-rendering :: Strict input validation — fail loud, no partial render :: A self pointer at another file is drift
  // @scenario behaviour orbit-report-rendering :: Strict input validation — fail loud, no partial render :: Deterministic spine drift fails the render
  it('rc17c: a self pointer naming a DIFFERENT pass file is drift', () => {
    const other = 'orbit/changes/sem-change/.orbit-runs/review-proposal-2026-07-28T09-00-00Z.json';
    expect(() =>
      normalizeInternalPass(FAKE_PATH, withFinding(`/orbit:address-reviews sem-change --from-file ${other}`))
    ).toThrow(/field 'next_recommended'/);
  });

  // @scenario behaviour orbit-report-rendering :: Strict input validation — fail loud, no partial render :: A self pointer at another file is drift
  it('a clean pass pointing at address-reviews fails loud (the pointer is the status gateway)', () => {
    const emit = d4Emit('sem-change', {
      next_recommended: '/orbit:address-reviews sem-change',
    });
    expect(() => normalizeInternalPass(FAKE_PATH, emit)).toThrow(
      /but the deterministic pointer is 'orbit status --change sem-change --report'/
    );
  });
});

// ---------------------------------------------------------------------------
// W3/W4 — external date + description strictness; header-region scoping
// ---------------------------------------------------------------------------

describe('external strictness (W3) and header-region scoping (W4)', () => {
  const EXT_PATH = '/fake/external-proposal-2026-07-29T12-00-00Z.md';
  const SECTIONS = '## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n';

  function extFile(date: string, body = SECTIONS): string {
    return `# External Review: x\n\n**Reviewer**: R\n**Date**: ${date}\n\n${body}`;
  }

  it("Date 'banana' is rejected naming the field", () => {
    expect(() => normalizeExternalPass(EXT_PATH, extFile('banana'))).toThrow(
      /malformed '\*\*Date\*\*:' field \(expected a real YYYY-MM-DD calendar date, got 'banana'\)/
    );
  });

  it("Date '2026-02-30' is syntactically shaped but not a real date — rejected", () => {
    expect(() => normalizeExternalPass(EXT_PATH, extFile('2026-02-30'))).toThrow(
      /malformed '\*\*Date\*\*:' field .*'2026-02-30'/
    );
  });

  it('a blank Description body is rejected naming the finding', () => {
    const body =
      '## CRITICAL\n\n### Empty finding\n**File**: a.ts:1\n**Description**:\n\n' +
      '## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n';
    expect(() => normalizeExternalPass(EXT_PATH, extFile('2026-07-29', body))).toThrow(
      /finding 'Empty finding' has a blank '\*\*Description\*\*:' body/
    );
  });

  it('Reviewer/Date-shaped prose inside a Description is BODY, not duplicate metadata (W4)', () => {
    const body =
      '## CRITICAL\n\n### Quoting finding\n**File**: a.ts:1\n**Description**: The report shows:\n' +
      '**Reviewer**: forged-in-body\n**Date**: 1999-01-01\nMore text.\n\n' +
      '## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n';
    const pass = normalizeExternalPass(EXT_PATH, extFile('2026-07-29', body));
    expect(pass.reviewerName).toBe('R');
    expect(pass.reviewerDate).toBe('2026-07-29');
    expect(pass.findings).toHaveLength(1);
    expect(pass.findings[0].recommendation).toContain('**Reviewer**: forged-in-body');
    expect(pass.findings[0].recommendation).toContain('**Date**: 1999-01-01');
    expect(pass.findings[0].recommendation).toContain('More text.');
  });
});

// ---------------------------------------------------------------------------
// S1 — real CommonMark fence tracking
// ---------------------------------------------------------------------------

describe('real CommonMark fence tracking (S1)', () => {
  const EXT_PATH = '/fake/external-proposal-2026-07-29T12-00-00Z.md';

  it('a three-backtick line inside a four-backtick fence does NOT close it — the fenced grammar stays body', () => {
    const content = [
      '# External Review: x', '',
      '**Reviewer**: R', '**Date**: 2026-07-29', '',
      '## CRITICAL', '',
      '### Fenced finding',
      '**File**: a.ts:1',
      '**Description**: Body start.', '',
      '````',
      '```',
      '## CRITICAL',
      '**Reviewer**: forged',
      '```',
      '````', '',
      'After the fence.', '',
      '## WARNING', '', 'None.', '',
      '## SUGGESTION', '', 'None.', '',
    ].join('\n');
    const pass = normalizeExternalPass(EXT_PATH, content);
    expect(pass.findings).toHaveLength(1);
    const rec = pass.findings[0].recommendation;
    // Everything between the four-backtick delimiters stayed one body — the
    // inner ``` did not close the fence and `## CRITICAL` opened no section.
    expect(rec).toContain('````\n```\n## CRITICAL\n**Reviewer**: forged\n```\n````');
    expect(rec).toContain('After the fence.');
    expect(pass.reviewerName).toBe('R');
  });

  it('an indented (≤3 spaces) fence opens and closes — heading lines inside stay body', () => {
    const content = [
      '# External Review: x', '',
      '**Reviewer**: R', '**Date**: 2026-07-29', '',
      '## CRITICAL', '',
      '### Indented fence finding',
      '**File**: a.ts:1',
      '**Description**: Indent test.', '',
      '   ```',
      '## Notes',
      '   ```', '',
      'Tail line.', '',
      '## WARNING', '', 'None.', '',
      '## SUGGESTION', '', 'None.', '',
    ].join('\n');
    const pass = normalizeExternalPass(EXT_PATH, content);
    expect(pass.findings).toHaveLength(1);
    expect(pass.findings[0].recommendation).toContain('## Notes');
    expect(pass.findings[0].recommendation).toContain('Tail line.');
    // The fenced `## Notes` opened no Notes section: no Commentary slot.
    expect(pass.commentary).toBeUndefined();
  });
});
