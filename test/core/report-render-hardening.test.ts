import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { renderReport } from '../../src/core/report-render.js';

/**
 * D4 system iter-2 resolutions: single-line grammar-slot enforcement (record-
 * sourced text must not forge column-0 report grammar) and the cross-source
 * equivalence check (an internal emit and an external file with equivalent
 * findings render through ONE grammar — task 5.1's claimed case, made real).
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
    expect(() => renderReport(root, 'forge-supp')).toThrow(/stale_suppressed\[0\]' must be single-line/);
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
    emit.findings = [
      { pass: '2', severity: 'WARNING', dimension: 'correctness', file: 'design.md', line: 12,
        title: 'Equivalent finding', recommendation: 'Do the fix.' },
    ];
    (emit.scorecard as any).correctness.warning = 1;
    emit.final_assessment = '0 critical, 1 warning, 0 suggestion.';
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
