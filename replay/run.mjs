#!/usr/bin/env node
// The replay set's runner (orbit-replay-set; design Decision 7). Sal starts every run by hand:
//
//   npm run replay -- --model <m> --max-total-usd <usd> [--ref <commit>] [--runs 3] [--cases a,b]
//     [--label <l>] [--broken] [--workdir <dir>] [--cli <dir>] [--results <dir>] [--cases-dir <dir>]
//
// It refuses to start without --model or --max-total-usd. For each case and run it builds a fresh
// fixture from one commit's packed CLI, checks the case's start state, runs one billed `claude -p`
// session in it (only when the spend so far plus the case's budget fits under the total), grades
// what the session left, and writes one record under replay/results/.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REPLAY_TMP, buildCli, cliEntry, resolveCommit, workdirProblem } from './lib/build.mjs';
import { CASES_DIR, buildFixture, fixtureEnv, listCases, loadCase } from './lib/fixture.mjs';
import { checkStart, gradeAll, loadGraders } from './lib/graders.mjs';
import { endOf, readTrace } from './lib/trace.mjs';

const REPLAY_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(REPLAY_DIR, '..');
export const ALLOWED_TOOLS = 'Bash Read Write Edit Glob Grep Skill';

export class UsageError extends Error {}

const VALUE_FLAGS = new Set([
  '--model',
  '--max-total-usd',
  '--ref',
  '--runs',
  '--cases',
  '--label',
  '--workdir',
  '--cli',
  '--results',
  '--cases-dir',
]);

export function parseArgs(argv) {
  const o = { ref: 'HEAD', runs: 3, label: 'run', broken: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--broken') {
      o.broken = true;
      continue;
    }
    if (!VALUE_FLAGS.has(a)) throw new UsageError(`unknown argument ${a}`);
    const v = argv[++i];
    if (v === undefined || v.startsWith('--')) throw new UsageError(`${a} needs a value`);
    o[a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  if (!o.model) throw new UsageError('--model is required: the model the sessions run on');
  if (o.maxTotalUsd === undefined) {
    throw new UsageError('--max-total-usd is required: the total cost ceiling of this run, in USD');
  }
  o.maxTotalUsd = Number(o.maxTotalUsd);
  if (!Number.isFinite(o.maxTotalUsd) || o.maxTotalUsd <= 0) throw new UsageError('--max-total-usd must be a positive number');
  o.runs = Number(o.runs);
  if (!Number.isInteger(o.runs) || o.runs < 1) throw new UsageError('--runs must be a positive integer');
  if (!/^[A-Za-z0-9._-]+$/.test(o.label)) throw new UsageError('--label may hold only letters, digits, . _ and -');
  if (o.broken && !/broken/.test(o.label)) o.label = `${o.label}-broken`;
  o.cases = o.cases ? o.cases.split(',').map((s) => s.trim()).filter(Boolean) : null;
  return o;
}

function stamp(d = new Date()) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
}

function claudeVersion() {
  const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(`claude --version failed: ${r.error?.message ?? r.stderr}`);
  return r.stdout.trim();
}

/** Runs one session in the fixture; resolves `{ code, signal, timedOut }`. */
function runSession({ c, model, fixture, trace, stderrFile }) {
  const args = [
    '-p',
    c.prompt,
    '--model',
    model,
    '--max-turns',
    String(c.max_turns),
    '--max-budget-usd',
    String(c.max_budget_usd),
    '--setting-sources',
    'project',
    '--allowedTools',
    ALLOWED_TOOLS,
    '--no-session-persistence',
    '--output-format',
    'stream-json',
    '--verbose',
  ];
  const out = fs.openSync(trace, 'w');
  const err = fs.openSync(stderrFile, 'w');
  return new Promise((resolve) => {
    const child = spawn('claude', args, {
      cwd: fixture,
      env: { ...fixtureEnv(), DISABLE_AUTOUPDATER: '1' },
      stdio: ['ignore', out, err],
      detached: true,
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }, c.timeout_minutes * 60_000);
    const finish = (code, signal) => {
      clearTimeout(timer);
      fs.closeSync(out);
      fs.closeSync(err);
      resolve({ code, signal, timedOut });
    };
    child.on('error', () => finish(null, null));
    child.on('exit', finish);
  });
}

function validateCase(c) {
  for (const k of ['max_turns', 'max_budget_usd']) {
    if (!(typeof c[k] === 'number' && c[k] > 0)) throw new Error(`case ${c.id}: case.yaml needs a positive ${k}`);
  }
}

export async function main(argv, { log = (s) => console.error(s) } = {}) {
  let o;
  try {
    o = parseArgs(argv);
  } catch (e) {
    if (e instanceof UsageError) {
      log(`replay: ${e.message}`);
      return 2;
    }
    throw e;
  }

  const casesDir = path.resolve(o.casesDir ?? CASES_DIR);
  const all = listCases(casesDir);
  const caseIds = o.cases ?? all;
  for (const id of caseIds) if (!all.includes(id)) return log(`replay: no case ${id} under ${casesDir}`), 2;
  const cases = caseIds.map((id) => loadCase(path.join(casesDir, id)));
  cases.forEach(validateCase);

  let sha = null;
  let cliDir = null;
  if (o.cli) {
    cliDir = path.resolve(o.cli);
    if (!fs.existsSync(cliEntry(cliDir))) return log(`replay: --cli ${cliDir} holds no ${cliEntry(cliDir)}`), 2;
  } else {
    sha = resolveCommit(REPO, o.ref);
  }

  const startedAt = new Date();
  const runId = `${stamp(startedAt)}-${sha ? sha.slice(0, 7) : 'local'}-${o.label}`;
  const resultsDir = path.resolve(o.results ?? path.join(REPLAY_DIR, 'results'));
  const recordFile = path.join(resultsDir, `${runId}.json`);
  if (fs.existsSync(recordFile)) return log(`replay: ${recordFile} already exists; a record is never overwritten`), 2;

  const workdir = path.resolve(o.workdir ?? path.join(REPLAY_TMP, runId));
  const problem = workdirProblem(workdir);
  if (problem) return log(`replay: refusing work directory ${workdir}: ${problem}`), 2;

  if (!cliDir) {
    log(`replay: building commit ${sha} (--ref ${o.ref})`);
    cliDir = buildCli({ repo: REPO, ref: sha, log: (s) => log(`replay: ${s}`) }).cliDir;
  }
  fs.mkdirSync(workdir, { recursive: true });
  const version = claudeVersion();
  log(`replay: ${version}; ${cases.length} case(s) × ${o.runs} run(s); ceiling $${o.maxTotalUsd}; work dir ${workdir}`);

  const record = {
    record: 'orbit-replay-set run',
    label: o.label,
    broken: o.broken,
    started_at: startedAt.toISOString(),
    finished_at: null,
    commit: sha,
    ref: sha ? o.ref : null,
    cli_dir: sha ? null : cliDir,
    claude_code_version: version,
    model_requested: o.model,
    runs_per_case: o.runs,
    cases: cases.map((c) => c.id),
    max_total_usd: o.maxTotalUsd,
    total_cost_usd: 0,
    workdir,
    results: [],
  };

  let spent = 0;
  let ceilingHit = false;
  for (const c of cases) {
    const graders = loadGraders(c.dir);
    for (let run = 1; run <= o.runs; run++) {
      const entry = {
        case: c.id,
        run,
        stopped: null,
        reason: null,
        budget_usd: c.max_budget_usd,
        model: null,
        skills: null,
        slash_commands: null,
        turns: null,
        cost_usd: null,
        duration_ms: null,
        grades: null,
        details: null,
        fixture: null,
        trace: null,
      };
      record.results.push(entry);
      if (ceilingHit || spent + c.max_budget_usd > o.maxTotalUsd) {
        ceilingHit = true;
        entry.stopped = 'ceiling';
        entry.reason = `not run: $${spent.toFixed(4)} spent + $${c.max_budget_usd} budget exceeds the $${o.maxTotalUsd} ceiling`;
        continue;
      }
      const runDir = path.join(workdir, c.id, `run-${run}`);
      const fixture = path.join(runDir, 'fixture');
      entry.fixture = fixture;
      try {
        await buildFixture({ dir: fixture, cliDir, caseDir: c.dir, casesDir, brk: o.broken ? c.break : null });
      } catch (e) {
        entry.stopped = 'start-state';
        entry.reason = `the seed failed to build: ${e.message.split('\n')[0]}`;
        log(`replay: ${c.id} run ${run}: ${entry.reason}`);
        continue;
      }
      const failures = checkStart(c.start, { fixtureDir: fixture });
      if (failures.length) {
        entry.stopped = 'start-state';
        entry.reason = `start state not reached: ${failures.join('; ')}`;
        log(`replay: ${c.id} run ${run}: ${entry.reason}`);
        continue;
      }

      const trace = path.join(runDir, 'trace.jsonl');
      entry.trace = trace;
      log(`replay: ${c.id} run ${run}: session started (budget $${c.max_budget_usd})`);
      const s = await runSession({ c, model: o.model, fixture, trace, stderrFile: path.join(runDir, 'stderr.log') });
      const t = readTrace(trace);
      entry.model = t.init?.model ?? null;
      entry.skills = t.init?.skills ?? null;
      entry.slash_commands = t.init?.slash_commands ?? null;
      const end = endOf(t.result);
      if (end === null) {
        spent += c.max_budget_usd;
        entry.cost_usd = c.max_budget_usd;
        entry.stopped = 'no-result';
        entry.reason = s.timedOut
          ? `killed at its ${c.timeout_minutes}-minute timeout`
          : t.result
            ? 'its result record reports no numeric cost'
            : `exited ${s.code ?? s.signal} with no result record`;
        entry.reason += '; its whole budget counts as spent';
        log(`replay: ${c.id} run ${run}: ${entry.reason}`);
        continue;
      }
      spent += t.result.total_cost_usd;
      entry.cost_usd = t.result.total_cost_usd;
      entry.turns = t.result.num_turns;
      entry.duration_ms = t.result.duration_ms;
      entry.stopped = end;
      entry.reason = t.result.subtype;
      const graded = gradeAll(graders, { fixtureDir: fixture, orbitOutput: t.orbitOutput });
      entry.grades = Object.fromEntries(Object.entries(graded).map(([k, v]) => [k, v.pass]));
      entry.details = Object.fromEntries(Object.entries(graded).map(([k, v]) => [k, v.detail]));
      const passed = Object.values(entry.grades).filter(Boolean).length;
      log(`replay: ${c.id} run ${run}: ${end}, $${entry.cost_usd}, ${entry.turns} turns, ${passed}/${graders.length} facts`);
    }
  }

  record.total_cost_usd = Number(spent.toFixed(6));
  record.finished_at = new Date().toISOString();
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(recordFile, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  log(`replay: record ${recordFile}; total $${record.total_cost_usd}`);
  const ungraded = record.results.filter((r) => r.grades === null).length;
  if (ungraded) log(`replay: ${ungraded} case run(s) not graded`);
  return ungraded ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`replay: ${err.stack ?? err.message}`);
      process.exit(1);
    },
  );
}
