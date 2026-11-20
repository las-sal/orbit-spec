#!/usr/bin/env node
// The replay set's comparison (orbit-replay-set: `A cut is "no worse" when every fact that passed in
// all baseline runs passes in all of its runs`; design Decision 9):
//
//   npm run replay:compare -- <baseline.json> <cut.json>
//
// It first checks the cut covers what the baseline graded (an INCOMPLETE case gets no verdict),
// then classifies each fact by the baseline-by-cut table, and shows each case's pass rate, turns and
// cost as mean ± standard deviation on each side. It exits non-zero on a regression or an
// incomplete case.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** One fact's row, from its pass counts on each side (`bN`, `cN` > 0). */
export function classify(bPass, bN, cPass, cN) {
  if (bPass === bN) return cPass === cN ? 'held' : 'regression';
  if (bPass > 0) return 'unreliable';
  return cPass > 0 ? 'baseline-failed-cut-passes' : 'baseline-failed';
}

export function meanSd(xs) {
  const v = xs.filter((x) => typeof x === 'number' && Number.isFinite(x));
  if (v.length === 0) return { mean: null, sd: null, n: 0 };
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = v.length < 2 ? 0 : Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (v.length - 1));
  return { mean, sd, n: v.length };
}

const graded = (record, id) => record.results.filter((r) => r.case === id && r.grades && typeof r.grades === 'object');

function stats(runs) {
  return {
    pass_rate: meanSd(
      runs.map((r) => {
        const v = Object.values(r.grades);
        return v.length ? v.filter(Boolean).length / v.length : null;
      }),
    ),
    turns: meanSd(runs.map((r) => r.turns)),
    cost_usd: meanSd(runs.map((r) => r.cost_usd)),
  };
}

function modelsOf(record) {
  const s = new Set(record.results.map((r) => r.model).filter(Boolean));
  if (s.size === 0 && record.model_requested) s.add(record.model_requested);
  return [...s].sort();
}

/** Compares two run records; returns the whole report as data. */
export function compareRecords(base, cut) {
  const warnings = [];
  const bm = modelsOf(base).join(', ');
  const cm = modelsOf(cut).join(', ');
  if (bm !== cm) warnings.push(`the records name different models (baseline: ${bm || 'none'}; cut: ${cm || 'none'})`);
  if (base.claude_code_version !== cut.claude_code_version) {
    warnings.push(
      `the records name different Claude Code versions (baseline: ${base.claude_code_version}; cut: ${cut.claude_code_version})`,
    );
  }
  if (base.broken || /plumbing/.test(base.label ?? '')) {
    warnings.push(`the baseline record is labelled ${JSON.stringify(base.label)}, not a baseline`);
  }

  const cases = [];
  for (const id of base.cases) {
    const bRuns = graded(base, id);
    const cRuns = graded(cut, id);
    const lacks = [];
    if (!cut.cases.includes(id)) lacks.push('the cut did not run this case');
    if (bRuns.length < base.runs_per_case) lacks.push(`baseline: ${bRuns.length} of ${base.runs_per_case} runs graded`);
    if (cut.cases.includes(id) && cRuns.length < cut.runs_per_case) {
      lacks.push(`cut: ${cRuns.length} of ${cut.runs_per_case} runs graded`);
    }
    const bGraders = [...new Set(bRuns.flatMap((r) => Object.keys(r.grades)))].sort();
    const cGraders = [...new Set(cRuns.flatMap((r) => Object.keys(r.grades)))].sort();
    for (const g of bGraders) {
      if (cRuns.length && cRuns.some((r) => !(g in r.grades))) lacks.push(`cut lacks grader ${g}`);
    }
    const newGraders = cGraders.filter((g) => !bGraders.includes(g));
    const entry = {
      case: id,
      status: lacks.length ? 'incomplete' : 'complete',
      lacks,
      facts: [],
      new_graders: newGraders,
      baseline: stats(bRuns),
      cut: stats(cRuns),
    };
    if (!lacks.length) {
      for (const g of bGraders) {
        const b = { pass: bRuns.filter((r) => r.grades[g]).length, n: bRuns.length };
        const c = { pass: cRuns.filter((r) => r.grades[g]).length, n: cRuns.length };
        entry.facts.push({ grader: g, row: classify(b.pass, b.n, c.pass, c.n), baseline: b, cut: c });
      }
    }
    cases.push(entry);
  }
  const newCases = cut.cases.filter((id) => !base.cases.includes(id));
  const regressions = cases.flatMap((c) => c.facts.filter((f) => f.row === 'regression').map((f) => ({ case: c.case, ...f })));
  const incomplete = cases.filter((c) => c.status === 'incomplete').map((c) => c.case);
  return {
    warnings,
    cases,
    new_cases: newCases,
    regressions,
    incomplete,
    no_worse: incomplete.length === 0 && regressions.length === 0,
  };
}

const fmt = (m, digits = 2) => (m.mean === null ? '—' : `${m.mean.toFixed(digits)} ± ${m.sd.toFixed(digits)}`);

const ROW_TEXT = {
  held: 'held',
  regression: 'REGRESSION',
  unreliable: 'unreliable in the baseline: reported, not judged',
  'baseline-failed': 'failed every baseline run',
  'baseline-failed-cut-passes': 'failed every baseline run; the cut makes it pass (noted)',
};

export function renderReport(report, baseFile, cutFile) {
  const out = [];
  for (const w of report.warnings) out.push(`WARNING: ${w}`);
  out.push(`baseline: ${baseFile}`, `cut:      ${cutFile}`, '');
  for (const c of report.cases) {
    out.push(`## ${c.case} — ${c.status}`);
    for (const l of c.lacks) out.push(`  INCOMPLETE: ${l} (no verdict)`);
    for (const f of c.facts) {
      out.push(`  ${f.grader}: ${ROW_TEXT[f.row]} (baseline ${f.baseline.pass}/${f.baseline.n}, cut ${f.cut.pass}/${f.cut.n})`);
    }
    for (const g of c.new_graders) out.push(`  ${g}: new in the cut, not judged`);
    out.push(
      `  pass rate  baseline ${fmt(c.baseline.pass_rate)}   cut ${fmt(c.cut.pass_rate)}`,
      `  turns      baseline ${fmt(c.baseline.turns, 1)}   cut ${fmt(c.cut.turns, 1)}`,
      `  cost USD   baseline ${fmt(c.baseline.cost_usd, 4)}   cut ${fmt(c.cut.cost_usd, 4)}`,
      '',
    );
  }
  for (const id of report.new_cases) out.push(`case ${id}: only the cut ran it; not judged`);
  if (report.no_worse) out.push('RESULT: no worse — every case complete and no fact regressed.');
  else {
    out.push(
      `RESULT: not "no worse" — ${report.regressions.length} regression(s), ${report.incomplete.length} incomplete case(s).`,
    );
  }
  return out.join('\n');
}

export function main(argv, { log = (s) => console.log(s), err = (s) => console.error(s) } = {}) {
  if (argv.length !== 2) {
    err('usage: npm run replay:compare -- <baseline.json> <cut.json>');
    return 2;
  }
  const [b, c] = argv.map((f) => path.resolve(f));
  const report = compareRecords(JSON.parse(fs.readFileSync(b, 'utf8')), JSON.parse(fs.readFileSync(c, 'utf8')));
  log(renderReport(report, b, c));
  return report.no_worse ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)));
}
