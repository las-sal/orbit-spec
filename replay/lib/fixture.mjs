// Builds a case's fixture (design Decision 4, Case 4's recipe): `git init` with a fixed author,
// `.gitignore` holding `.orbit-cli`, the `.orbit-cli` symlink to the build under test, the shared
// project, `orbit init --tools claude` through the shim, a commit, the case's `scaffold.sh` (which
// seeds with orbit's own commands), an optional known-bad scaffold, a commit, and for a broken-body
// run the case's `break` applied to the installed skill file and committed.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { SHIM_DIR, runOrbit } from './graders.mjs';

export const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPLAY_DIR = path.join(LIB_DIR, '..');
export const CASES_DIR = path.join(REPLAY_DIR, 'cases');
export const PROJECT_DIR = path.join(REPLAY_DIR, 'project');

const GIT_ENV = {
  GIT_AUTHOR_NAME: 'replay',
  GIT_AUTHOR_EMAIL: 'replay@example.invalid',
  GIT_COMMITTER_NAME: 'replay',
  GIT_COMMITTER_EMAIL: 'replay@example.invalid',
};

export function fixtureEnv(env = process.env) {
  return { ...env, ...GIT_ENV, PATH: `${SHIM_DIR}${path.delimiter}${env.PATH ?? ''}`, NO_COLOR: '1' };
}

function sh(cmd, args, cwd, what, extraEnv = {}) {
  const r = spawnSync(cmd, args, { cwd, env: { ...fixtureEnv(), ...extraEnv }, encoding: 'utf8', timeout: 300_000 });
  if (r.error || r.status !== 0) {
    const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.trim().split('\n').slice(-25).join('\n');
    throw new Error(`${what}: ${cmd} ${args.join(' ')} exited ${r.status ?? r.error?.message}\n${out}`);
  }
  return r.stdout;
}

/** A case: its directory, `case.yaml`, and the typed text of `prompt.md`. */
export function loadCase(caseDir) {
  const spec = YAML.parse(fs.readFileSync(path.join(caseDir, 'case.yaml'), 'utf8')) ?? {};
  const prompt = fs.readFileSync(path.join(caseDir, 'prompt.md'), 'utf8').trim();
  return {
    id: path.basename(caseDir),
    dir: caseDir,
    prompt,
    max_turns: spec.max_turns,
    max_budget_usd: spec.max_budget_usd,
    timeout_minutes: spec.timeout_minutes ?? 30,
    start: spec.start ?? [],
    break: spec.break ?? null,
  };
}

/** The cases under a directory: each subdirectory holding a `case.yaml`, sorted. */
export function listCases(casesDir = CASES_DIR) {
  return fs
    .readdirSync(casesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(casesDir, e.name, 'case.yaml')))
    .map((e) => e.name)
    .sort();
}

function copyDir(from, to) {
  fs.cpSync(from, to, { recursive: true });
}

/**
 * Deletes the section a heading line opens: from the first line starting with `heading` to the next
 * heading of the same or a higher level, outside code fences. Throws unless exactly one line matches.
 */
export function deleteSection(text, heading) {
  const lines = text.split('\n');
  const level = /^(#+) /.exec(heading)?.[1].length;
  if (!level) throw new Error(`break section ${JSON.stringify(heading)} is not a Markdown heading`);
  let fence = false;
  const headings = [];
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    else if (!fence && /^#+ /.test(line)) headings.push({ i, level: /^(#+)/.exec(line)[1].length, line });
  });
  const hits = headings.filter((h) => h.line.startsWith(heading));
  if (hits.length !== 1) throw new Error(`break section ${JSON.stringify(heading)} matches ${hits.length} headings`);
  const start = hits[0].i;
  const next = headings.find((h) => h.i > start && h.level <= level);
  const end = next ? next.i : lines.length;
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n');
}

/** A break's sections, one heading or a list of them. */
export function breakSections(brk) {
  return Array.isArray(brk.section) ? brk.section : [brk.section];
}

/**
 * Applies a case's `break` to the fixture's installed skill: `file`, the skill file; `section`, a
 * heading (or a list) whose section is deleted; `remove`, reference files deleted beside it, each
 * relative to the skill file's directory, so a step cut from the body is not still readable in the
 * reference it pointed to. A heading or a file that is not there throws: a break must break.
 */
export function applyBreak(fixtureDir, brk) {
  const file = path.join(fixtureDir, brk.file);
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const heading of breakSections(brk)) after = deleteSection(after, heading);
  fs.writeFileSync(file, after);
  const removed = [];
  for (const rel of brk.remove ?? []) {
    const ref = path.join(path.dirname(file), rel);
    if (!fs.existsSync(ref)) throw new Error(`break remove: no ${rel} beside ${brk.file}`);
    fs.rmSync(ref);
    removed.push(rel);
  }
  return { removed_chars: before.length - after.length, removed };
}

const TOKEN = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/;

/** The newest timestamp token in the fixture's trails (`.orbit-runs/`), or `null` when there is none. */
export function newestTrailToken(dir) {
  let newest = null;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === '.orbit-cli' || e.name === 'node_modules' || e.name === '.claude') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.includes(`${path.sep}.orbit-runs${path.sep}`)) {
        const t = TOKEN.exec(e.name)?.[0];
        if (t && (!newest || t > newest)) newest = t;
      }
    }
  };
  walk(dir);
  return newest;
}

function nowToken() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
}

/**
 * Waits until the clock is past the newest token in the fixture's trails. The engine bumps a
 * colliding token forward, so a fast scaffold can leave tokens a few seconds ahead; a session's
 * first emit must read as later than every seeded record.
 */
export async function waitPastTrail(fixtureDir, maxMs = 30_000) {
  const newest = newestTrailToken(fixtureDir);
  if (!newest) return;
  const until = Date.now() + maxMs;
  while (nowToken() <= newest && Date.now() < until) await new Promise((r) => setTimeout(r, 200));
}

/**
 * Builds one fixture. `scaffolds` is the list of extra scripts run after the case's own (a known-bad
 * scaffold). Returns the fixture directory.
 */
export async function buildFixture({
  dir,
  cliDir,
  caseDir,
  casesDir = CASES_DIR,
  projectDir = PROJECT_DIR,
  extraScaffolds = [],
  brk = null,
}) {
  fs.mkdirSync(dir, { recursive: true });
  sh('git', ['init', '-q', '-b', 'main'], dir, 'git init');
  sh('git', ['config', 'commit.gpgsign', 'false'], dir, 'git config');
  fs.writeFileSync(path.join(dir, '.gitignore'), '.orbit-cli\n');
  fs.symlinkSync(cliDir, path.join(dir, '.orbit-cli'));
  copyDir(projectDir, dir);
  sh('orbit', ['init', '--tools', 'claude'], dir, 'orbit init');
  sh('git', ['add', '-A'], dir, 'git add');
  sh('git', ['commit', '-q', '-m', 'fixture: project and orbit init'], dir, 'git commit');

  const seedEnv = { REPLAY_LIB: LIB_DIR, REPLAY_CASES: casesDir };
  const scripts = [path.join(caseDir, 'scaffold.sh'), ...extraScaffolds];
  for (const script of scripts) {
    if (fs.existsSync(script)) sh('bash', [script], dir, `scaffold ${path.relative(casesDir, script)}`, seedEnv);
  }
  sh('git', ['add', '-A'], dir, 'git add');
  sh('git', ['commit', '-q', '--allow-empty', '-m', 'fixture: seed'], dir, 'git commit');

  if (brk) {
    applyBreak(dir, brk);
    sh('git', ['add', '-A'], dir, 'git add');
    sh('git', ['commit', '-q', '-m', `fixture: break ${breakSections(brk).join(' + ')}`], dir, 'git commit');
  }
  await waitPastTrail(dir);
  return dir;
}

/** Runs a case's `start` checks in a built fixture; returns the failures (empty when it holds). */
export { checkStart } from './graders.mjs';
export { runOrbit };
