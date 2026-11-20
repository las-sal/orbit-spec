import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classify, compareRecords, main, meanSd } from '../../replay/compare.mjs';

type Grades = Record<string, boolean>;

/** A hand-written run record: `runs` maps a case to its runs' grades (null = a run not graded). */
function record(runs: Record<string, (Grades | null)[]>, extra: Record<string, unknown> = {}) {
  const results = Object.entries(runs).flatMap(([c, rs]) =>
    rs.map((grades, i) => ({
      case: c,
      run: i + 1,
      stopped: grades ? 'finished' : 'ceiling',
      model: 'claude-test-1',
      turns: grades ? 10 + i : null,
      cost_usd: grades ? 0.5 + i / 10 : null,
      grades,
    })),
  );
  return {
    label: 'baseline',
    broken: false,
    claude_code_version: '2.1.329 (Claude Code)',
    model_requested: 'claude-test-1',
    runs_per_case: 3,
    cases: Object.keys(runs),
    results,
    ...extra,
  };
}

const ok = { a: true, b: true };

function runMain(base: object, cut: object) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-compare-'));
  const b = path.join(dir, 'base.json');
  const c = path.join(dir, 'cut.json');
  fs.writeFileSync(b, JSON.stringify(base));
  fs.writeFileSync(c, JSON.stringify(cut));
  const out: string[] = [];
  const code = main([b, c], { log: (s: string) => out.push(s), err: (s: string) => out.push(s) });
  fs.rmSync(dir, { recursive: true, force: true });
  return { code, text: out.join('\n') };
}

describe('replay:compare — the four baseline-by-cut rows', () => {
  it('classifies each row from the pass counts', () => {
    expect(classify(3, 3, 3, 3)).toBe('held');
    expect(classify(3, 3, 2, 3)).toBe('regression');
    expect(classify(2, 3, 0, 3)).toBe('unreliable');
    expect(classify(2, 3, 3, 3)).toBe('unreliable');
    expect(classify(0, 3, 0, 3)).toBe('baseline-failed');
    expect(classify(0, 3, 1, 3)).toBe('baseline-failed-cut-passes');
  });

  it('every fact held across complete cases is "no worse" and exits zero', () => {
    const base = record({ x: [ok, ok, ok] });
    const { code, text } = runMain(base, record({ x: [ok, ok, ok] }, { label: 'cut' }));
    expect(code).toBe(0);
    expect(text).toContain('RESULT: no worse');
    expect(text).toContain('a: held (baseline 3/3, cut 3/3)');
  });

  // @scenario behaviour orbit-replay-set :: A cut is "no worse" when every fact that passed in all baseline runs passes in all of its runs :: A reliable fact failing once is a regression
  it('a fact that passed all three baseline runs and fails one cut run is a regression, exit non-zero', () => {
    const base = record({ x: [ok, ok, ok] });
    const cut = record({ x: [ok, { a: false, b: true }, ok] }, { label: 'cut' });
    const report = compareRecords(base, cut);
    expect(report.regressions).toEqual([
      expect.objectContaining({ case: 'x', grader: 'a', row: 'regression', baseline: { pass: 3, n: 3 }, cut: { pass: 2, n: 3 } }),
    ]);
    expect(report.no_worse).toBe(false);
    const { code, text } = runMain(base, cut);
    expect(code).not.toBe(0);
    expect(text).toContain('a: REGRESSION (baseline 3/3, cut 2/3)');
  });

  // @scenario behaviour orbit-replay-set :: A cut is "no worse" when every fact that passed in all baseline runs passes in all of its runs :: A cut with a run missing is incomplete, not no worse
  it('a cut with a run not run at the ceiling is incomplete: no verdict, no "no worse", exit non-zero', () => {
    const base = record({ x: [ok, ok, ok] });
    const cut = record({ x: [ok, ok, null] }, { label: 'cut' });
    const report = compareRecords(base, cut);
    expect(report.incomplete).toEqual(['x']);
    expect(report.cases[0].facts).toEqual([]);
    expect(report.cases[0].lacks).toEqual(['cut: 2 of 3 runs graded']);
    expect(report.regressions).toEqual([]);
    expect(report.no_worse).toBe(false);
    const { code, text } = runMain(base, cut);
    expect(code).not.toBe(0);
    expect(text).toContain('INCOMPLETE: cut: 2 of 3 runs graded (no verdict)');
    expect(text).not.toContain('RESULT: no worse');
  });

  // @scenario behaviour orbit-replay-set :: A cut is "no worse" when every fact that passed in all baseline runs passes in all of its runs :: An unreliable fact is reported, not judged
  it('a fact the baseline passed two of three times and the cut never passes is reported, not a regression', () => {
    const base = record({ x: [ok, ok, { a: false, b: true }] });
    const cut = record({ x: [{ a: false, b: true }, { a: false, b: true }, { a: false, b: true }] }, { label: 'cut' });
    const report = compareRecords(base, cut);
    const a = report.cases[0].facts.find((f: { grader: string }) => f.grader === 'a');
    expect(a).toEqual({ grader: 'a', row: 'unreliable', baseline: { pass: 2, n: 3 }, cut: { pass: 0, n: 3 } });
    expect(report.regressions).toEqual([]);
    const { code, text } = runMain(base, cut);
    expect(code).toBe(0);
    expect(text).toContain('a: unreliable in the baseline: reported, not judged (baseline 2/3, cut 0/3)');
  });

  it('a fact failing every baseline run is reported, and a cut that makes it pass is noted', () => {
    const base = record({ x: [{ a: false }, { a: false }, { a: false }] });
    const cut = record({ x: [{ a: true }, { a: false }, { a: false }] }, { label: 'cut' });
    const [fact] = compareRecords(base, cut).cases[0].facts;
    expect(fact.row).toBe('baseline-failed-cut-passes');
    expect(runMain(base, cut).text).toContain('the cut makes it pass (noted)');
  });

  it('a case the cut lacks, or a baseline grader the cut lacks, is incomplete', () => {
    const base = record({ x: [ok, ok, ok], y: [ok, ok, ok] });
    const cut = record({ x: [{ a: true }, { a: true }, { a: true }] }, { label: 'cut' });
    const report = compareRecords(base, cut);
    expect(report.incomplete).toEqual(['x', 'y']);
    expect(report.cases.find((c: { case: string }) => c.case === 'x').lacks).toEqual(['cut lacks grader b']);
    expect(report.cases.find((c: { case: string }) => c.case === 'y').lacks).toContain('the cut did not run this case');
  });

  it('a grader only the cut holds is listed as new and not judged', () => {
    const base = record({ x: [ok, ok, ok] });
    const cut = record({ x: [{ ...ok, c: false }, { ...ok, c: false }, { ...ok, c: false }] }, { label: 'cut' });
    const report = compareRecords(base, cut);
    expect(report.cases[0].new_graders).toEqual(['c']);
    expect(report.no_worse).toBe(true);
    expect(runMain(base, cut).text).toContain('c: new in the cut, not judged');
  });

  it('warns first when the records name different models or Claude Code versions', () => {
    const base = record({ x: [ok, ok, ok] });
    const cut = record({ x: [ok, ok, ok] }, { label: 'cut', claude_code_version: '2.2.0 (Claude Code)' });
    cut.results.forEach((r) => (r.model = 'claude-other-2'));
    const { text, code } = runMain(base, cut);
    const lines = text.split('\n');
    expect(lines[0]).toMatch(/^WARNING: the records name different models/);
    expect(lines[1]).toMatch(/^WARNING: the records name different Claude Code versions/);
    expect(code).toBe(0);
  });

  it("warns when either side's sessions loaded a skill that is not orbit's", () => {
    const base = record({ x: [ok, ok, ok] });
    base.results.forEach((r) => Object.assign(r, { skills: ['orbit-explore', 'orbit-apply-change'] }));
    const cut = record({ x: [ok, ok, ok] }, { label: 'cut' });
    cut.results.forEach((r, i) => Object.assign(r, { skills: i === 1 ? ['orbit-explore', 'pdf', 'my-plugin:helper'] : ['orbit-explore'] }));
    const report = compareRecords(base, cut);
    expect(report.warnings).toEqual(["the cut's sessions loaded skills that are not orbit's: my-plugin:helper, pdf"]);
    const { text, code } = runMain(base, cut);
    expect(text.split('\n')[0]).toBe("WARNING: the cut's sessions loaded skills that are not orbit's: my-plugin:helper, pdf");
    expect(code).toBe(0);
    expect(compareRecords(base, base).warnings).toEqual([]);
  });

  it('shows pass rate, turns and cost as mean ± standard deviation on each side', () => {
    expect(meanSd([1, 2, 3])).toEqual({ mean: 2, sd: 1, n: 3 });
    const { text } = runMain(record({ x: [ok, ok, ok] }), record({ x: [ok, ok, ok] }, { label: 'cut' }));
    expect(text).toContain('pass rate  baseline 1.00 ± 0.00   cut 1.00 ± 0.00');
    expect(text).toContain('turns      baseline 11.0 ± 1.0   cut 11.0 ± 1.0');
    expect(text).toContain('cost USD   baseline 0.6000 ± 0.1000');
  });

  it('refuses without exactly two records', () => {
    const out: string[] = [];
    expect(main(['only-one.json'], { log: (s: string) => out.push(s), err: (s: string) => out.push(s) })).toBe(2);
    expect(out.join('\n')).toContain('usage: npm run replay:compare');
  });
});
