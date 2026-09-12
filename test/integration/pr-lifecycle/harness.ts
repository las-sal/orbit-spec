/**
 * D-arc Stage D6 — integration harness for the PR lifecycle's phase-1 preconditions.
 *
 * WHY THIS EXISTS, and what it does NOT claim.
 *
 * Every git and `gh` action in D6 is workflow-BODY prose — instructions a reading AI
 * follows — because `orbit-pr-lifecycle`'s zero-engine-git requirement keeps the engine out
 * of git entirely (its only child-process use is read-only diff inspection in
 * `src/core/parsers/apply-state.ts`). So no test can drive "the implementation" of the
 * choreography: there isn't one to drive.
 *
 * What this harness drives instead is an EXECUTABLE TRANSCRIPTION of the documented
 * procedure (`phase1.ts`), run against real git repositories with a real bare remote and a
 * `gh` stub. It answers one question the prose cannot answer about itself: *are the
 * documented steps actually performable, in the order given, against real git?*
 *
 * That question is not academic. The iteration-3 external review found a step that git
 * REFUSES to perform — switching to a compatible branch that already tracks the paths
 * generation had just written as untracked files — precisely by reproducing it in a
 * disposable repository. This harness is that method, kept.
 *
 * LIMITS, stated rather than implied:
 * - It validates the transcription's fidelity to the prose only insofar as a human keeps
 *   them in step. It cannot prove a reading AI will follow the prose.
 * - It covers PHASE 1 (resolution, existence, compatibility, the switch). The tail's
 *   outward writes are validated by the dogfood (task 6.3), not here.
 * - No concurrency cases: single-session is an explicit non-goal.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface GhInvocation {
  args: string[];
}

export class Repo {
  constructor(
    readonly dir: string,
    /** Directory holding the `gh` stub; put on PATH for every command this repo runs. */
    readonly binDir: string,
    /**
     * The PATH every command this repo runs sees. Defaults to the stub dir ahead of the host
     * PATH; `gh: 'absent'` narrows it to the stub dir plus the system dirs so a host-installed
     * `gh` is GENUINELY absent (external iter 4) rather than merely un-stubbed.
     */
    readonly envPath: string = `${binDir}:${process.env.PATH}`
  ) {}

  git(...args: string[]): { status: number; stdout: string; stderr: string } {
    const res = spawnSync('git', args, {
      cwd: this.dir,
      encoding: 'utf-8',
      env: { ...process.env, PATH: this.envPath },
    });
    return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
  }

  /** Every `gh` invocation the transcription made, in order. */
  ghLog(): GhInvocation[] {
    const logPath = path.join(this.binDir, 'gh-invocations.log');
    if (!fs.existsSync(logPath)) return [];
    return fs
      .readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => ({ args: JSON.parse(line) as string[] }));
  }

  write(rel: string, content: string): void {
    const p = path.join(this.dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }

  exists(rel: string): boolean {
    return fs.existsSync(path.join(this.dir, rel));
  }

  commitAll(message: string): void {
    this.git('add', '-A');
    this.git('commit', '-m', message);
  }
}

export interface GhScript {
  /** Response for `gh repo view --json defaultBranchRef`; null makes the call fail. */
  defaultBranch?: string | null;
  /** Response array for `gh pr list --json ...`; null makes the call fail. */
  prList?: unknown[] | null;
}

let counter = 0;

/**
 * Create a disposable repository with a real bare remote and a `gh` stub on PATH.
 *
 * The stub RECORDS every invocation and returns scripted JSON, so a case can assert both
 * "this command was issued with these flags" and "no command was issued at all" — the
 * latter being what `pr: never` and the terminal-absence rule actually promise.
 */
export function makeRepo(
  opts: {
    defaultBranch?: string;
    remote?: 'bare' | 'none' | 'multiple';
    remoteUrlStyle?: 'https' | 'ssh';
    gh?: GhScript | 'absent';
  } = {}
): { repo: Repo; remoteDir: string | null; cleanup: () => void } {
  const defaultBranch = opts.defaultBranch ?? 'main';
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `orbit-d6-${counter++}-`));
  const dir = path.join(base, 'work');
  const binDir = path.join(base, 'bin');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  if (opts.gh !== 'absent') installGhStub(binDir, opts.gh ?? {}, defaultBranch);

  // `absent` must mean absent: a PATH of only the (empty) stub dir plus the system dirs,
  // where git lives but no host-installed gh does.
  const repo =
    opts.gh === 'absent'
      ? new Repo(dir, binDir, `${binDir}:/usr/bin:/bin`)
      : new Repo(dir, binDir);
  repo.git('init', '-q', '-b', defaultBranch);
  repo.git('config', 'user.email', 'harness@orbit.test');
  repo.git('config', 'user.name', 'Harness');
  repo.write('README.md', '# base\n');
  repo.commitAll('base');

  let remoteDir: string | null = null;
  if ((opts.remote ?? 'bare') !== 'none') {
    remoteDir = path.join(base, 'remote.git');
    spawnSync('git', ['init', '-q', '--bare', '-b', defaultBranch, remoteDir]);
    const url =
      opts.remoteUrlStyle === 'ssh'
        ? 'git@github.com:acme/widget.git'
        : 'https://github.com/acme/widget.git';
    // A real fetchable path is needed for push/fetch; the GitHub-shaped URL is what the
    // canonical-identifier derivation parses. Keep both: fetch via the path, parse the URL.
    repo.git('remote', 'add', 'origin', remoteDir);
    repo.git('config', 'remote.origin.ghurl', url);
    if (opts.remote === 'multiple') {
      // Two remotes, NEITHER named origin — the ambiguity case.
      repo.git('remote', 'rename', 'origin', 'upstream');
      repo.git('remote', 'add', 'fork', remoteDir);
    }
    repo.git('push', '-q', '-u', 'origin', defaultBranch);
  }

  return {
    repo,
    remoteDir,
    cleanup: () => fs.rmSync(base, { recursive: true, force: true }),
  };
}

function installGhStub(binDir: string, script: GhScript, defaultBranch: string): void {
  const logPath = path.join(binDir, 'gh-invocations.log');
  const payload = {
    defaultBranch: script.defaultBranch === undefined ? defaultBranch : script.defaultBranch,
    prList: script.prList === undefined ? [] : script.prList,
  };
  fs.writeFileSync(path.join(binDir, 'gh-script.json'), JSON.stringify(payload));
  // The stub DERIVES its accepted-invocation set from the recorded real-CLI contract
  // (rc01-instrument-fidelity): the contract and the shared validator are copied beside it so
  // the standalone script can `require` them. No hand-written per-verb branches remain.
  fs.copyFileSync(path.join(__dirname, 'gh-contract.json'), path.join(binDir, 'gh-contract.json'));
  fs.copyFileSync(path.join(__dirname, 'gh-contract-validate.cjs'), path.join(binDir, 'gh-contract-validate.cjs'));
  const stub = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { validate } = require(path.join(__dirname, 'gh-contract-validate.cjs'));
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');
const contract = JSON.parse(fs.readFileSync(path.join(__dirname, 'gh-contract.json'), 'utf-8'));
const script = JSON.parse(fs.readFileSync(path.join(__dirname, 'gh-script.json'), 'utf-8'));
const v = validate(args, contract);
if (!v.ok) { process.stderr.write(v.message + '\\n'); process.exit(1); }
if (v.probe) { process.stdout.write(v.stdout); process.exit(0); }
if (v.command === 'repo view') {
  if (script.defaultBranch === null) { process.stderr.write('gh: could not resolve\\n'); process.exit(1); }
  process.stdout.write(JSON.stringify({ defaultBranchRef: { name: script.defaultBranch } }));
  process.exit(0);
}
if (v.command === 'pr list') {
  if (script.prList === null) { process.stderr.write('gh: query failed\\n'); process.exit(1); }
  process.stdout.write(JSON.stringify(script.prList));
  process.exit(0);
}
process.stdout.write('{}');
`;
  const p = path.join(binDir, 'gh');
  fs.writeFileSync(p, stub);
  fs.chmodSync(p, 0o755);
}
