// The work-directory check and the per-commit CLI build (design Decisions 2 and 3).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const REPLAY_TMP = path.join(os.tmpdir(), 'orbit-replay');

/** The installed copy's entry point inside a CLI directory (what the shim looks for). */
export function cliEntry(cliDir) {
  return path.join(cliDir, 'node_modules', 'orbit-spec', 'bin', 'orbit.js');
}

/**
 * Why a work directory is refused, or `null` when it is fine. Claude Code loads `CLAUDE.md` files
 * and project settings from a session's directory upward, so a fixture must sit inside no git work
 * tree and below no `CLAUDE.md` or `.claude/` other than the home directory's own `.claude/`.
 */
export function workdirProblem(dir, home = os.homedir()) {
  let d = path.resolve(dir);
  const root = path.parse(d).root;
  while (d !== root) {
    if (fs.existsSync(path.join(d, '.git'))) return `${d} is a git work tree (it holds .git)`;
    if (fs.existsSync(path.join(d, 'CLAUDE.md'))) return `${d} holds a CLAUDE.md`;
    if (fs.existsSync(path.join(d, '.claude')) && path.resolve(d) !== path.resolve(home)) {
      return `${d} holds a .claude/ directory`;
    }
    d = path.dirname(d);
  }
  return null;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.error) throw new Error(`${cmd} ${args.join(' ')}: ${r.error.message}`);
  if (r.status !== 0) {
    const tail = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.trim().split('\n').slice(-20).join('\n');
    throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}\n${tail}`);
  }
  return r.stdout ?? '';
}

/** The full commit hash `ref` names in `repo`. */
export function resolveCommit(repo, ref) {
  return run('git', ['-C', repo, 'rev-parse', '--verify', `${ref}^{commit}`]).trim();
}

/**
 * Builds `ref`'s CLI once and caches it by commit under `<tmp>/orbit-replay/cli/<sha>/`:
 * a detached worktree at the commit, `npm ci`, `npm run build`, `npm pack`, then
 * `npm install <tgz> --omit=dev --ignore-scripts` into the cache; the worktree is removed whatever
 * happens. Returns `{ sha, cliDir, cached }`.
 */
export function buildCli({ repo, ref = 'HEAD', root = REPLAY_TMP, log = () => {} }) {
  const sha = resolveCommit(repo, ref);
  const cliDir = path.join(root, 'cli', sha);
  const done = path.join(cliDir, '.complete');
  if (fs.existsSync(done) && fs.existsSync(cliEntry(cliDir))) {
    log(`CLI for ${sha} is cached at ${cliDir}`);
    return { sha, cliDir, cached: true };
  }

  const buildDir = path.join(root, 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  const worktree = fs.mkdtempSync(path.join(buildDir, `${sha.slice(0, 7)}-`));
  fs.rmdirSync(worktree); // git worktree add wants to create it
  log(`building ${sha} in ${worktree}`);
  run('git', ['-C', repo, 'worktree', 'add', '--detach', worktree, sha]);
  try {
    const env = { ...process.env, DISABLE_AUTOUPDATER: '1' };
    run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: worktree, env });
    run('npm', ['run', 'build'], { cwd: worktree, env });
    const packed = run('npm', ['pack', '--ignore-scripts', '--pack-destination', worktree], { cwd: worktree, env })
      .trim()
      .split('\n')
      .pop()
      .trim();
    const tgz = path.join(worktree, packed);
    if (!fs.existsSync(tgz)) throw new Error(`npm pack wrote no ${tgz}`);

    const partial = `${cliDir}.partial-${process.pid}`;
    fs.rmSync(partial, { recursive: true, force: true });
    fs.mkdirSync(partial, { recursive: true });
    fs.writeFileSync(path.join(partial, 'package.json'), '{ "private": true }\n');
    run('npm', ['install', tgz, '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save'], {
      cwd: partial,
      env,
    });
    if (!fs.existsSync(cliEntry(partial))) throw new Error(`the installed pack has no ${cliEntry(partial)}`);
    fs.rmSync(cliDir, { recursive: true, force: true });
    fs.renameSync(partial, cliDir);
    fs.writeFileSync(done, `${sha}\n`);
  } finally {
    spawnSync('git', ['-C', repo, 'worktree', 'remove', '--force', worktree], { encoding: 'utf8' });
    spawnSync('git', ['-C', repo, 'worktree', 'prune'], { encoding: 'utf8' });
  }
  log(`CLI for ${sha} installed at ${cliDir}`);
  return { sha, cliDir, cached: false };
}
