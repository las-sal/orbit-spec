/**
 * The PR lifecycle's integration harness: real git repositories, a real bare remote, and the
 * contract-validated `gh` stub (D6; extended by rc12-engine-owned-choreography).
 *
 * WHY THIS EXISTS. `orbit pr` OBSERVES and PRINTS: it runs read-only `git` and `gh` queries and
 * prints every write as an argument vector the workflow body runs (`orbit-pr-lifecycle`'s
 * `The \`orbit pr\` command observes and prints; it never writes`). Two questions follow that
 * no prose can answer about itself, and this harness answers both by execution:
 *
 * - Is every printed step PERFORMABLE, in the order given, against real git? The iteration-3
 *   external review of D6 found a step git REFUSES to perform by reproducing it in a disposable
 *   repository; the segment runner (`instrument.ts`) keeps that method.
 * - Does the engine perform NO write? A `git` PATH shim and the `gh` stub record every
 *   invocation, so a case asserts the engine's calls against the read-only allowlist.
 *
 * Remotes are reached through a `url.<path>.insteadOf` rewrite of a GitHub-shaped URL, so the
 * engine reads the CONFIGURED URL exactly as it would in a real checkout carrying such a
 * rewrite, while fetch and push reach the local bare repository. No test hook ships in `src/`.
 *
 * LIMITS, stated rather than implied: a local temporary repository cannot reach a real remote
 * host's behaviour (branch protection, auth expiry) — `Printed commands are proven by
 * execution`'s named limit. No concurrency cases: single-session is an explicit non-goal.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface Invocation {
  args: string[];
}

/** The real git, resolved once; the harness's own setup calls never pass through the shim. */
export const REAL_GIT = (() => {
  const res = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf-8' });
  const p = res.stdout.trim();
  if (!p) throw new Error('harness: no git on PATH');
  return p;
})();

export class Repo {
  constructor(
    readonly dir: string,
    /** Directory holding the `git` shim and the `gh` stub; first on PATH for the engine. */
    readonly binDir: string,
    /**
     * The PATH the engine sees. Defaults to the bin dir ahead of the host PATH; `gh: 'absent'`
     * narrows it to the bin dir plus the system dirs so a host-installed `gh` is GENUINELY
     * absent rather than merely un-stubbed.
     */
    readonly envPath: string = `${binDir}:${process.env.PATH}`
  ) {}

  /** The environment an engine call under test runs with: the shim and the stub first. */
  env(): NodeJS.ProcessEnv {
    return { ...process.env, PATH: this.envPath };
  }

  /** The harness's OWN git — the real binary, never the shim, so setup is not logged. */
  git(...args: string[]): { status: number; stdout: string; stderr: string } {
    const res = spawnSync(REAL_GIT, args, {
      cwd: this.dir,
      encoding: 'utf-8',
      env: { ...process.env, PATH: this.envPath },
    });
    return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
  }

  /** Every `gh` invocation recorded so far (the stub logs each one, from any caller). */
  ghLog(): Invocation[] {
    const logPath = path.join(this.binDir, 'gh-invocations.log');
    if (!fs.existsSync(logPath)) return [];
    return fs
      .readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => ({ args: JSON.parse(line) as string[] }));
  }

  /** Every `git` invocation that went through the PATH shim (never the harness's own). */
  gitLog(): Invocation[] {
    const logPath = path.join(this.binDir, 'git-invocations.log');
    if (!fs.existsSync(logPath)) return [];
    return fs
      .readFileSync(logPath, 'utf-8')
      .split('\x1e')
      .filter((rec) => rec.length > 0)
      .map((rec) => {
        const parts = rec.split('\0');
        parts.pop(); // every argument is NUL-terminated
        return { args: parts };
      });
  }

  /** A position in both logs; `since(mark)` returns only what was recorded after it. */
  mark(): { git: number; gh: number } {
    return { git: this.gitLog().length, gh: this.ghLog().length };
  }

  since(mark: { git: number; gh: number }): { git: Invocation[]; gh: Invocation[] } {
    return { git: this.gitLog().slice(mark.git), gh: this.ghLog().slice(mark.gh) };
  }

  /** Replace the stub's scripted responses mid-case. */
  setGh(script: GhScript): void {
    writeGhScript(this.binDir, script, this.defaultBranch);
  }

  defaultBranch = 'main';

  write(rel: string, content: string): void {
    const p = path.join(this.dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }

  read(rel: string): string {
    return fs.readFileSync(path.join(this.dir, rel), 'utf-8');
  }

  exists(rel: string): boolean {
    return fs.existsSync(path.join(this.dir, rel));
  }

  commitAll(message: string): void {
    this.git('add', '-A');
    this.git('commit', '-q', '-m', message);
  }

  head(): string {
    return this.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim();
  }
}

/** One pull request as the stub answers it — the fields `gh pr view` / `pr list` return. */
export interface GhPr {
  url: string;
  number?: number;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  isDraft: boolean;
  headRefName: string;
  baseRefName: string;
  body?: string;
}

export interface GhScript {
  /** Response for `gh repo view --json defaultBranchRef`; null makes the call fail. */
  defaultBranch?: string | null;
  /**
   * The pull requests `gh pr list` searches: filtered by `--head` and `--state` as the real CLI
   * filters them (never by base — the base filter is the caller's). null makes the call fail.
   */
  prList?: GhPr[] | null;
  /**
   * `gh pr view <url>` responses by URL. A URL absent here is a MISSING pull request: the stub
   * answers with the recorded not-found message. `{error}` is any other failure (auth, network).
   */
  prs?: Record<string, GhPr | { error: string }>;
  /** The URL `gh pr create` prints; default `https://github.com/acme/widget/pull/1`. */
  createdUrl?: string;
}

let counter = 0;

/**
 * Create a disposable repository with a real bare remote, the `git` shim and the `gh` stub.
 *
 * The stub and the shim RECORD every invocation, so a case can assert both "this command was
 * issued with these flags" and "no command was issued at all" — the latter being what `pr:
 * never` and an unattached archive promise.
 */
export function makeRepo(
  opts: {
    defaultBranch?: string;
    remote?: 'bare' | 'none' | 'multiple';
    remoteUrlStyle?: 'https' | 'ssh';
    /** Override the GitHub-shaped URL (e.g. a non-GitHub host). */
    remoteUrl?: string;
    gh?: GhScript | 'absent';
  } = {}
): { repo: Repo; remoteDir: string | null; cleanup: () => void } {
  const defaultBranch = opts.defaultBranch ?? 'main';
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `orbit-pr-${counter++}-`));
  const dir = path.join(base, 'work');
  const binDir = path.join(base, 'bin');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  installGitShim(binDir);
  if (opts.gh !== 'absent') installGhStub(binDir, opts.gh ?? {}, defaultBranch);

  // `absent` must mean absent: a PATH of only the bin dir (shim, no stub) plus the system dirs,
  // where git lives but no host-installed gh does.
  const repo =
    opts.gh === 'absent' ? new Repo(dir, binDir, `${binDir}:/usr/bin:/bin`) : new Repo(dir, binDir);
  repo.defaultBranch = defaultBranch;
  repo.git('init', '-q', '-b', defaultBranch);
  repo.git('config', 'user.email', 'harness@orbit.test');
  repo.git('config', 'user.name', 'Harness');
  repo.git('config', 'commit.gpgsign', 'false');
  repo.write('README.md', '# base\n');
  repo.commitAll('base');

  let remoteDir: string | null = null;
  if ((opts.remote ?? 'bare') !== 'none') {
    remoteDir = path.join(base, 'remote.git');
    spawnSync(REAL_GIT, ['init', '-q', '--bare', '-b', defaultBranch, remoteDir]);
    const url =
      opts.remoteUrl ??
      (opts.remoteUrlStyle === 'ssh' ? 'git@github.com:acme/widget.git' : 'https://github.com/acme/widget.git');
    // The CONFIGURED url is GitHub-shaped; the rewrite makes fetch and push reach the bare repo.
    repo.git('config', `url.${remoteDir}.insteadOf`, url);
    repo.git('remote', 'add', 'origin', url);
    if (opts.remote === 'multiple') {
      // Two remotes, NEITHER named origin — the ambiguity case.
      repo.git('remote', 'rename', 'origin', 'upstream');
      repo.git('remote', 'add', 'fork', url);
    }
    const first = opts.remote === 'multiple' ? 'upstream' : 'origin';
    repo.git('push', '-q', '-u', first, defaultBranch);
  }

  return {
    repo,
    remoteDir,
    cleanup: () => fs.rmSync(base, { recursive: true, force: true }),
  };
}

/** A `git` that records its argv (NUL-separated, record-separator terminated) and execs the real one. */
function installGitShim(binDir: string): void {
  const logPath = path.join(binDir, 'git-invocations.log');
  const shim = `#!/bin/sh
printf '%s\\0' "$@" >> '${logPath}'
printf '\\036' >> '${logPath}'
exec '${REAL_GIT}' "$@"
`;
  const p = path.join(binDir, 'git');
  fs.writeFileSync(p, shim);
  fs.chmodSync(p, 0o755);
}

function writeGhScript(binDir: string, script: GhScript, defaultBranch: string): void {
  const payload = {
    defaultBranch: script.defaultBranch === undefined ? defaultBranch : script.defaultBranch,
    prList: script.prList === undefined ? [] : script.prList,
    prs: script.prs ?? {},
    createdUrl: script.createdUrl ?? 'https://github.com/acme/widget/pull/1',
  };
  fs.writeFileSync(path.join(binDir, 'gh-script.json'), JSON.stringify(payload));
}

function installGhStub(binDir: string, script: GhScript, defaultBranch: string): void {
  const logPath = path.join(binDir, 'gh-invocations.log');
  writeGhScript(binDir, script, defaultBranch);
  // The stub DERIVES its accepted-invocation set from the recorded real-CLI contract
  // (rc01-instrument-fidelity): the contract and the shared validator are copied beside it so
  // the standalone script can `require` them. No hand-written per-verb grammar remains; the
  // scripted RESPONSES below are data, returned only after the contract accepts the argv.
  fs.copyFileSync(path.join(__dirname, 'gh-contract.json'), path.join(binDir, 'gh-contract.json'));
  fs.copyFileSync(path.join(__dirname, 'gh-contract-validate.cjs'), path.join(binDir, 'gh-contract-validate.cjs'));
  const stub = `#!${process.execPath}
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
function flag(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }
function pick(obj) {
  const fields = flag('--json');
  if (!fields) return obj;
  const out = {};
  for (const f of fields.split(',')) if (obj[f] !== undefined) out[f] = obj[f];
  return out;
}
if (v.command === 'repo view') {
  if (script.defaultBranch === null) { process.stderr.write('gh: could not resolve\\n'); process.exit(1); }
  process.stdout.write(JSON.stringify({ defaultBranchRef: { name: script.defaultBranch } }));
  process.exit(0);
}
if (v.command === 'pr list') {
  if (script.prList === null) { process.stderr.write('gh: query failed\\n'); process.exit(1); }
  const head = flag('--head');
  const state = flag('--state');
  const hits = script.prList.filter((p) =>
    (head === undefined || p.headRefName === head) &&
    (state === undefined || state === 'all' || p.state === state.toUpperCase()));
  process.stdout.write(JSON.stringify(hits.map(pick)));
  process.exit(0);
}
if (v.command === 'pr view') {
  const sel = v.positionals[0];
  const pr = script.prs[sel];
  if (pr === undefined) { process.stderr.write(contract.rules.pr_view_not_found + '\\n'); process.exit(1); }
  if (pr.error) { process.stderr.write(pr.error + '\\n'); process.exit(1); }
  process.stdout.write(JSON.stringify(pick(pr)));
  process.exit(0);
}
if (v.command === 'pr create') { process.stdout.write(script.createdUrl + '\\n'); process.exit(0); }
process.stdout.write('');
`;
  const p = path.join(binDir, 'gh');
  fs.writeFileSync(p, stub);
  fs.chmodSync(p, 0o755);
}
