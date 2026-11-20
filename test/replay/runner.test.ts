import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// The replay runner's free checks: the real runner (`node replay/run.mjs`) against a stub `claude`
// first on PATH, which writes a marker per session and prints a canned stream-json trace with a fixed
// cost. The run is given `--cli` (the repository's own build, laid out as an installed copy) and a
// temporary `--results`, so no check builds a commit, bills a session or writes into the tree.

const REPO = path.resolve(__dirname, '..', '..');
const RUN = path.join(REPO, 'replay', 'run.mjs');
const SHIM = path.join(REPO, 'replay', 'shim', 'orbit');

let root: string;
let stubDir: string;
let cliDir: string;
let casesDir: string;
let marker: string;

const STUB = `#!/usr/bin/env node
const fs = require('fs');
const { spawnSync } = require('child_process');
const argv = process.argv.slice(2);
if (argv.includes('--version')) { console.log('9.9.9 (Claude Code stub)'); process.exit(0); }
const prompt = argv[argv.indexOf('-p') + 1] || '';
fs.appendFileSync(process.env.STUB_MARKER, prompt.split('\\n')[0] + '\\n');
const out = (o) => process.stdout.write(JSON.stringify(o) + '\\n');
out({ type: 'system', subtype: 'init', model: 'claude-stub-1', skills: ['orbit-explore'], slash_commands: ['orbit:explore'] });
if (prompt.includes('STUB:HANG')) { setTimeout(() => {}, 600000); return; }
if (prompt.includes('STUB:NO-RESULT')) process.exit(1);
const r = spawnSync('orbit', ['decisions', 'status', '--json'], { encoding: 'utf8' });
out({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'orbit decisions status --json' } }] } });
out({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: r.stdout }] } });
out({ type: 'result', subtype: 'success', is_error: false, num_turns: 2, duration_ms: 1234, total_cost_usd: 0.25 });
`;

function writeCase(id: string, prompt: string, yaml: string, graders: Record<string, string> = {}) {
  const dir = path.join(casesDir, id);
  fs.mkdirSync(path.join(dir, 'graders'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'prompt.md'), `${prompt}\n`);
  fs.writeFileSync(path.join(dir, 'case.yaml'), yaml);
  for (const [name, text] of Object.entries(graders)) fs.writeFileSync(path.join(dir, 'graders', `${name}.md`), text);
}

const ANSWERED = `---
type: regex
target: orbit_output
pattern: '"write":\\s*false'
example: '{ "write": false }'
---
orbit decisions status answered from the build under test.
`;

function run(args: string[], { withStub = true }: { withStub?: boolean } = {}) {
  fs.writeFileSync(marker, '');
  const results = fs.mkdtempSync(path.join(root, 'results-'));
  const env = {
    ...process.env,
    STUB_MARKER: marker,
    PATH: withStub ? `${stubDir}${path.delimiter}${process.env.PATH}` : process.env.PATH,
  };
  const r = spawnSync(
    process.execPath,
    [RUN, '--cli', cliDir, '--results', results, '--cases-dir', casesDir, '--workdir', fs.mkdtempSync(path.join(root, 'work-')), ...args],
    { cwd: REPO, env, encoding: 'utf8', timeout: 120_000 },
  );
  const files = fs.readdirSync(results);
  const record = files.length === 1 ? JSON.parse(fs.readFileSync(path.join(results, files[0]), 'utf8')) : null;
  const sessions = fs.readFileSync(marker, 'utf8').split('\n').filter(Boolean);
  return { status: r.status, stderr: r.stderr, record, files, results, sessions };
}

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-runner-'));
  stubDir = path.join(root, 'stub');
  fs.mkdirSync(stubDir);
  fs.writeFileSync(path.join(stubDir, 'claude'), STUB, { mode: 0o755 });
  cliDir = path.join(root, 'cli');
  fs.mkdirSync(path.join(cliDir, 'node_modules'), { recursive: true });
  fs.symlinkSync(REPO, path.join(cliDir, 'node_modules', 'orbit-spec'));
  marker = path.join(root, 'sessions.txt');
  casesDir = path.join(root, 'cases');
  writeCase('ok', '/orbit:explore stub', 'max_turns: 5\nmax_budget_usd: 1\n', { answered: ANSWERED });
  writeCase(
    'bad-start',
    '/orbit:explore STUB:BAD-START',
    'max_turns: 5\nmax_budget_usd: 1\nstart:\n  - args: [status, --json]\n    path: sprint\n    exists: true\n',
  );
  writeCase('no-result', '/orbit:explore STUB:NO-RESULT', 'max_turns: 5\nmax_budget_usd: 1\n', { answered: ANSWERED });
  writeCase('hang', '/orbit:explore STUB:HANG', 'max_turns: 5\nmax_budget_usd: 0.5\ntimeout_minutes: 0.03\n');
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('replay runner — billing and limits', () => {
  // @scenario behaviour orbit-replay-set :: The replay set is a development-time check that is never shipped :: A run without a cost ceiling starts no session
  it('refuses to start without --max-total-usd, naming it, and starts no claude process', () => {
    const r = run(['--model', 'stub', '--cases', 'ok']);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('--max-total-usd is required');
    expect(r.sessions).toEqual([]);
    expect(r.files).toEqual([]);
  });

  it('refuses to start without --model', () => {
    const r = run(['--max-total-usd', '5', '--cases', 'ok']);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('--model is required');
    expect(r.sessions).toEqual([]);
  });

  it('runs a session in the fixture through the shim and grades orbit output from the build under test', () => {
    const r = run(['--model', 'stub', '--max-total-usd', '5', '--runs', '1', '--cases', 'ok']);
    expect(r.status).toBe(0);
    expect(r.sessions).toEqual(['/orbit:explore stub']);
    const [entry] = r.record.results;
    expect(entry).toMatchObject({
      case: 'ok',
      run: 1,
      stopped: 'finished',
      model: 'claude-stub-1',
      skills: ['orbit-explore'],
      turns: 2,
      cost_usd: 0.25,
      duration_ms: 1234,
      grades: { answered: true },
    });
    expect(fs.existsSync(entry.trace)).toBe(true);
  });

  // @scenario behaviour orbit-replay-set :: A case is one typed command on a fixture seeded at the state just before it :: A seed that misses its start state bills nothing
  it('a seed that misses its start state is recorded as such and starts no session', () => {
    const r = run(['--model', 'stub', '--max-total-usd', '5', '--runs', '1', '--cases', 'bad-start']);
    expect(r.status).not.toBe(0);
    expect(r.sessions).toEqual([]);
    expect(r.record.results).toEqual([
      expect.objectContaining({ case: 'bad-start', stopped: 'start-state', grades: null, cost_usd: null }),
    ]);
    expect(r.record.results[0].reason).toMatch(/^start state not reached: status --json/);
    expect(r.record.total_cost_usd).toBe(0);
  });

  // @scenario behaviour orbit-replay-set :: The runner runs each case as a `claude -p` session in its fixture and grades it afterwards :: The run stops starting sessions at its total ceiling
  it('stops starting sessions once the spend plus the next budget would pass the ceiling', () => {
    // budget $1, cost $0.25: run 1 reserves 0+1, run 2 0.25+1, run 3 0.50+1 > 1.3 → not run.
    const r = run(['--model', 'stub', '--max-total-usd', '1.3', '--runs', '3', '--cases', 'ok']);
    expect(r.status).not.toBe(0);
    expect(r.sessions).toHaveLength(2);
    expect(r.record.results.map((e: { stopped: string }) => e.stopped)).toEqual(['finished', 'finished', 'ceiling']);
    expect(r.record.results[2]).toMatchObject({ grades: null, fixture: null });
    expect(r.record.results[2].reason).toContain('exceeds the $1.3 ceiling');
    expect(r.record.total_cost_usd).toBe(0.5);
  });

  // @scenario behaviour orbit-replay-set :: The runner runs each case as a `claude -p` session in its fixture and grades it afterwards :: A session with no result record counts its whole budget
  it('a session that ends with no result record counts its whole budget and is not graded', () => {
    const r = run(['--model', 'stub', '--max-total-usd', '5', '--runs', '1', '--cases', 'no-result']);
    expect(r.status).not.toBe(0);
    expect(r.sessions).toHaveLength(1);
    expect(r.record.results[0]).toMatchObject({ stopped: 'no-result', grades: null, cost_usd: 1 });
    expect(r.record.results[0].reason).toContain('no result record; its whole budget counts as spent');
    expect(r.record.total_cost_usd).toBe(1);
  });

  it('a session past its timeout is killed and counts its whole budget', () => {
    const r = run(['--model', 'stub', '--max-total-usd', '5', '--runs', '1', '--cases', 'hang']);
    expect(r.status).not.toBe(0);
    expect(r.record.results[0]).toMatchObject({ stopped: 'no-result', grades: null, cost_usd: 0.5 });
    expect(r.record.results[0].reason).toContain('killed at its 0.03-minute timeout');
  }, 30_000);
});

describe('replay runner — the record', () => {
  // @scenario behaviour orbit-replay-set :: A run's record names its build, its model, its cost and every fact's grade :: A finished run's record holds every case and run
  it('holds an entry for every case and run, graded or with its reason, and the run\'s build and total cost', () => {
    const r = run(['--model', 'stub', '--max-total-usd', '2.4', '--runs', '2', '--cases', 'ok,bad-start,no-result', '--label', 'mixed']);
    expect(r.files).toHaveLength(1);
    expect(r.files[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z-local-mixed\.json$/);
    const rec = r.record;
    expect(rec).toMatchObject({
      commit: null,
      cli_dir: cliDir,
      claude_code_version: '9.9.9 (Claude Code stub)',
      model_requested: 'stub',
      runs_per_case: 2,
      cases: ['ok', 'bad-start', 'no-result'],
      max_total_usd: 2.4,
    });
    expect(rec.results.map((e: { case: string; run: number }) => `${e.case}#${e.run}`)).toEqual([
      'ok#1',
      'ok#2',
      'bad-start#1',
      'bad-start#2',
      'no-result#1',
      'no-result#2',
    ]);
    for (const e of rec.results) expect(e.grades !== null || typeof e.reason === 'string').toBe(true);
    // 0.25 + 0.25 + (no-result #1: its whole $1) = 1.5; #2 would reserve 1.5 + 1 > 2.4 → ceiling.
    expect(rec.results.map((e: { stopped: string }) => e.stopped)).toEqual([
      'finished',
      'finished',
      'start-state',
      'start-state',
      'no-result',
      'ceiling',
    ]);
    expect(rec.total_cost_usd).toBe(1.5);
    expect(fs.existsSync(rec.workdir)).toBe(true);
  });

  it('refuses to start when its record\'s name already exists, writing nothing', () => {
    const results = fs.mkdtempSync(path.join(root, 'taken-'));
    const now = Date.now();
    const taken = [];
    for (let s = 0; s < 6; s++) {
      const stamp = new Date(now + s * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
      const f = path.join(results, `${stamp}-local-dup.json`);
      fs.writeFileSync(f, 'KEEP');
      taken.push(f);
    }
    fs.writeFileSync(marker, '');
    const r = spawnSync(
      process.execPath,
      [RUN, '--cli', cliDir, '--results', results, '--cases-dir', casesDir, '--model', 'stub', '--max-total-usd', '5', '--runs', '1', '--cases', 'ok', '--label', 'dup'],
      { cwd: REPO, env: { ...process.env, STUB_MARKER: marker, PATH: `${stubDir}${path.delimiter}${process.env.PATH}` }, encoding: 'utf8' },
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('already exists; a record is never overwritten');
    for (const f of taken) expect(fs.readFileSync(f, 'utf8')).toBe('KEEP');
    expect(fs.readFileSync(marker, 'utf8')).toBe('');
  });

  it('refuses a work directory inside a git work tree', () => {
    fs.writeFileSync(marker, '');
    const r = spawnSync(
      process.execPath,
      [RUN, '--cli', cliDir, '--results', fs.mkdtempSync(path.join(root, 'r-')), '--cases-dir', casesDir, '--workdir', path.join(REPO, 'replay', 'results', 'never'), '--model', 'stub', '--max-total-usd', '5', '--cases', 'ok'],
      { cwd: REPO, env: { ...process.env, STUB_MARKER: marker, PATH: `${stubDir}${path.delimiter}${process.env.PATH}` }, encoding: 'utf8' },
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/refusing work directory .*is a git work tree/);
    expect(fs.readFileSync(marker, 'utf8')).toBe('');
    expect(fs.existsSync(path.join(REPO, 'replay', 'results', 'never'))).toBe(false);
  });
});

describe('replay shim', () => {
  // @scenario behaviour orbit-replay-set :: Every run reaches a packed copy of the build under test, by a shim that finds it in the fixture :: The shim runs the nearest packed copy
  it('runs the nearest .orbit-cli copy with its arguments and returns its exit status', () => {
    const top = fs.mkdtempSync(path.join(root, 'shim-'));
    const bin = path.join(top, '.orbit-cli', 'node_modules', 'orbit-spec', 'bin');
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(path.join(bin, 'orbit.js'), 'console.log(JSON.stringify(process.argv.slice(2))); process.exit(3);\n');
    const deep = path.join(top, 'a', 'b');
    fs.mkdirSync(deep, { recursive: true });
    const r = spawnSync(SHIM, ['status', '--json'], { cwd: deep, encoding: 'utf8' });
    expect(r.status).toBe(3);
    expect(r.stdout.trim()).toBe('["status","--json"]');
  });

  // @scenario behaviour orbit-replay-set :: Every run reaches a packed copy of the build under test, by a shim that finds it in the fixture :: The shim fails loudly without a packed copy
  it('exits 127 naming the missing .orbit-cli when no directory above holds one', () => {
    const lone = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-shim-lone-'));
    const r = spawnSync(SHIM, ['--version'], { cwd: lone, encoding: 'utf8' });
    fs.rmSync(lone, { recursive: true, force: true });
    expect(r.status).toBe(127);
    expect(r.stderr).toContain('no .orbit-cli found');
    expect(r.stdout).toBe('');
  });
});

describe('the replay set is never shipped', () => {
  // @scenario behaviour orbit-replay-set :: The replay set is a development-time check that is never shipped :: The packed package carries nothing of the replay set
  it("package.json's files reaches nothing under replay/, and npm pack lists no replay file", () => {
    const files: string[] = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).files;
    for (const entry of files) {
      expect(entry.startsWith('replay')).toBe(false);
      expect(/^[!]?(\*|\*\*)(\/|$)/.test(entry)).toBe(false);
    }
    const r = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: REPO, encoding: 'utf8' });
    expect(r.status).toBe(0);
    const [pack] = JSON.parse(r.stdout);
    const paths: string[] = pack.files.map((f: { path: string }) => f.path);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.filter((p) => p.startsWith('replay/'))).toEqual([]);
    expect(paths.some((p) => p.startsWith('dist/'))).toBe(true);
  }, 60_000);
});
