/**
 * The read-only runner every `orbit pr` subcommand reaches `git` and `gh` through
 * (rc12-engine-owned-choreography, D-rc12-2 and D-rc12-11).
 *
 * It REFUSES any invocation outside `orbit-pr-lifecycle`'s allowlist (`The \`orbit pr\` command
 * observes and prints; it never writes`) before spawning anything, so a write can only appear
 * in a record as a printed argument vector. The one ref-store update it permits is the bounded
 * fetch: `ls-remote --heads` decides which refs exist, then `fetch --no-tags --refmap=` with one
 * explicit `+refs/heads/<x>:refs/remotes/<remote>/<x>` refspec per existing ref, so neither a
 * configured `remote.<name>.fetch` refspec nor tag auto-following can move anything else. The
 * empty `--refmap=` is load-bearing: without it git ALSO applies the configured refspec to the
 * fetched refs (its opportunistic remote-tracking update), which a `refs/heads/` mapping turns
 * into a write to local branches — found by executing the case, not by reading git's manual.
 *
 * `gh` AVAILABILITY is a PATH lookup, never an invocation.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PrContext {
  /** The project root; every invocation runs here. */
  projectRoot: string;
  /** The environment the invocations see (PATH decides which `git` and `gh` run). */
  env: NodeJS.ProcessEnv;
}

export interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Thrown when a subcommand asks the runner for an invocation outside the allowlist. */
export class PrRefusedError extends Error {}

const FETCH_REFSPEC = /^\+refs\/heads\/([^:]+):refs\/remotes\/([^/]+)\/(.+)$/;

/**
 * Whether `args` (the argv after `git`) is an invocation the allowlist names. `remote` is the
 * resolved remote when one is known; `ls-remote` and `fetch` must name it.
 */
export function gitAllowed(args: string[], remote: string | null): boolean {
  const [cmd, ...rest] = args;
  switch (cmd) {
    case 'remote':
      return rest.length === 0 || (rest[0] === 'get-url' && rest.length === 2);
    case 'config':
      return rest.length === 2 && rest[0] === '--get' && /^remote\.[^\s]+\.url$/.test(rest[1]);
    case 'rev-parse':
    case 'check-ref-format':
    case 'merge-base':
    case 'rev-list':
    case 'ls-files':
    case 'ls-tree':
      return true;
    case 'symbolic-ref':
      // One ref argument READS; two would WRITE.
      return rest.filter((a) => !a.startsWith('-')).length === 1;
    case 'status':
      return rest[0] === '--porcelain';
    case 'diff':
      return rest.includes('--name-only') || rest.includes('--quiet');
    case 'branch':
      return rest.length === 1 && rest[0] === '--show-current';
    case 'ls-remote':
      return rest[0] === '--heads' && remote !== null && rest[1] === remote && rest.length >= 3;
    case 'fetch': {
      if (rest[0] !== '--no-tags' || rest[1] !== '--refmap=' || remote === null || rest[2] !== remote) return false;
      const specs = rest.slice(3);
      return (
        specs.length > 0 &&
        specs.every((s) => {
          const m = s.match(FETCH_REFSPEC);
          return m !== null && m[2] === remote && m[1] === m[3];
        })
      );
    }
    default:
      return false;
  }
}

/** Whether `args` (the argv after `gh`) is an invocation the allowlist names. */
export function ghAllowed(args: string[]): boolean {
  const [a, b] = args;
  return (a === 'repo' && b === 'view') || (a === 'pr' && (b === 'view' || b === 'list'));
}

export class PrRunner {
  /** The resolved remote, once resolution has chosen one; `ls-remote` and `fetch` must name it. */
  remote: string | null = null;

  constructor(readonly ctx: PrContext) {}

  git(...args: string[]): RunResult {
    if (!gitAllowed(args, this.remote)) {
      throw new PrRefusedError(`orbit pr refuses 'git ${args.join(' ')}': outside the read-only allowlist`);
    }
    return this.spawn('git', args);
  }

  gh(...args: string[]): RunResult {
    if (!ghAllowed(args)) {
      throw new PrRefusedError(`orbit pr refuses 'gh ${args.join(' ')}': outside the read-only allowlist`);
    }
    return this.spawn('gh', args);
  }

  /** A PATH lookup — never an invocation of `gh`. */
  ghAvailable(): boolean {
    const dirs = (this.ctx.env.PATH ?? '').split(path.delimiter).filter(Boolean);
    for (const dir of dirs) {
      const candidate = path.join(dir, 'gh');
      try {
        const st = fs.statSync(candidate);
        if (st.isFile()) {
          fs.accessSync(candidate, fs.constants.X_OK);
          return true;
        }
      } catch {
        // not here
      }
    }
    return false;
  }

  /**
   * The bounded fetch (D-rc12-11): `ls-remote --heads` decides which of `branches` exist on the
   * resolved remote, and only those are fetched, each by an explicit refspec, with no tags and
   * an empty `--refmap=` so no configured refspec applies.
   * Returns the set that exists, or null when the remote could not be read.
   */
  boundedFetch(branches: string[]): Set<string> | null {
    if (this.remote === null) throw new PrRefusedError('orbit pr: the bounded fetch needs a resolved remote');
    const wanted = [...new Set(branches)];
    const ls = this.git('ls-remote', '--heads', this.remote, ...wanted.map((b) => `refs/heads/${b}`));
    if (ls.status !== 0) return null;
    const present = new Set<string>();
    for (const line of ls.stdout.split('\n')) {
      const ref = line.split('\t')[1]?.trim();
      if (ref?.startsWith('refs/heads/')) {
        const name = ref.slice('refs/heads/'.length);
        if (wanted.includes(name)) present.add(name);
      }
    }
    if (present.size > 0) {
      const specs = [...present].map((b) => `+refs/heads/${b}:refs/remotes/${this.remote}/${b}`);
      const fetch = this.git('fetch', '--no-tags', '--refmap=', this.remote, ...specs);
      if (fetch.status !== 0) return null;
    }
    return present;
  }

  private spawn(cmd: string, args: string[]): RunResult {
    const res = spawnSync(cmd, args, {
      cwd: this.ctx.projectRoot,
      encoding: 'utf-8',
      // Never prompt: a read that needs credentials fails, and the failure is an observation.
      env: { ...this.ctx.env, GIT_TERMINAL_PROMPT: '0', GH_PROMPT_DISABLED: '1' },
      maxBuffer: 64 * 1024 * 1024,
    });
    if (res.error) {
      return { status: 127, stdout: '', stderr: res.error.message };
    }
    return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
  }
}
