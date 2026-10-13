/**
 * landing-page (D-lp-16, the system walk's repair): `orbit-release`' `A release ships a built release tree`. The real
 * release script runs in a scratch clone of this repository's HEAD, with the checkout's `node_modules` linked in and an
 * empty bare repository as its remote; its tag is then installed globally from git into an empty prefix by the npm that
 * runs this suite (the requirement's named limit: other npm majors are the rehearsal's).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error -- an untyped ESM script
import { PREPARE_TRIGGERS, releasePackageJson } from '../../scripts/release-tree.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(REPO, 'scripts', 'release-tree.mjs');

/** The suite's own `npm_*` settings (npm exports them to `npm test`) never reach the commands run here. */
const ENV: NodeJS.ProcessEnv = {
  ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^npm_/i.test(k))),
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'commit.gpgsign',
  GIT_CONFIG_VALUE_0: 'false',
  GIT_CONFIG_KEY_1: 'tag.gpgsign',
  GIT_CONFIG_VALUE_1: 'false',
  GIT_AUTHOR_NAME: 'release-tree test',
  GIT_AUTHOR_EMAIL: 'release-tree@example.invalid',
  GIT_COMMITTER_NAME: 'release-tree test',
  GIT_COMMITTER_EMAIL: 'release-tree@example.invalid',
};
const run = (cwd: string, cmd: string, args: string[]) =>
  execFileSync(cmd, args, { cwd, env: ENV, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const git = (cwd: string, ...args: string[]) => run(cwd, 'git', args);
const release = (cwd: string) => spawnSync(process.execPath, [SCRIPT], { cwd, env: ENV, encoding: 'utf-8' });
/** pacote 21.5.0's prepare triggers, as `orbit-release`' table names them: stated here, never read from the script. */
const TRIGGERS = ['prepare', 'build', 'postinstall', 'install', 'preinstall', 'prepack'];
/**
 * npm 10 (Node 20's) runs `prepare` on `pack` despite `--ignore-scripts` and writes the build's output to stdout ahead of
 * the JSON (public-readiness: CI's first run, reproduced with npm 10.9.9); npm 11 does not. The JSON is the array that
 * opens on a line of its own, so everything before that line is dropped.
 */
const packed = (cwd: string): string[] => {
  const out = run(cwd, 'npm', ['pack', '--dry-run', '--json', '--ignore-scripts']);
  const start = out.search(/^\[$/m);
  if (start === -1) throw new Error(`npm pack printed no JSON array:\n${out}`);
  return (JSON.parse(out.slice(start))[0].files as Array<{ path: string }>).map((f) => f.path).sort();
};

describe('the release package.json', () => {
  it('removes exactly the six prepare triggers and keeps every other key', () => {
    expect([...PREPARE_TRIGGERS].sort()).toEqual([...TRIGGERS].sort());
    const scripts = Object.fromEntries([...TRIGGERS, 'test', 'prepublishOnly'].map((n) => [n, `run ${n}`]));
    const pkg = { name: 'p', version: '1.2.3', scripts, files: ['dist'] };
    expect(releasePackageJson(pkg)).toEqual({ ...pkg, scripts: { test: 'run test', prepublishOnly: 'run prepublishOnly' } });
    expect(pkg.scripts).toEqual(scripts);
    expect(releasePackageJson({ name: 'p' })).toEqual({ name: 'p' });
  });

  it('refuses a workspaces field, empty or not', () => {
    expect(() => releasePackageJson({ name: 'p', workspaces: [] })).toThrow(/workspaces/);
    expect(() => releasePackageJson({ name: 'p', workspaces: ['a'] })).toThrow(/workspaces/);
  });
});

describe('the release script over a scratch clone', () => {
  let scratch: string;
  let clone: string;
  let remote: string;
  let base: string;
  let tag: string;
  let version: string;
  let first: ReturnType<typeof release>;

  beforeAll(() => {
    scratch = mkdtempSync(path.join(tmpdir(), 'orbit-release-test-'));
    clone = path.join(scratch, 'clone');
    remote = path.join(scratch, 'remote.git');
    git(scratch, 'clone', '--quiet', '--no-tags', REPO, clone);
    git(scratch, 'init', '--quiet', '--bare', remote);
    git(clone, 'remote', 'set-url', 'origin', remote);
    symlinkSync(path.join(REPO, 'node_modules'), path.join(clone, 'node_modules'), 'dir');
    // A stale build output in the checkout's ignored dist/.
    mkdirSync(path.join(clone, 'dist'), { recursive: true });
    writeFileSync(path.join(clone, 'dist', 'stale-output.js'), 'export const stale = true;\n');
    base = git(clone, 'rev-parse', 'HEAD');
    version = JSON.parse(readFileSync(path.join(clone, 'package.json'), 'utf-8')).version;
    tag = `v${version}`;
    first = release(clone);
  }, 120_000);

  afterAll(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  });

  // @scenario behaviour orbit-release :: A release ships a built release tree :: The release commit is a child of the commit released, and the tag is on it
  it('cuts an annotated tag on a release commit whose only parent is HEAD, leaving HEAD and the worktrees as they were', () => {
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toContain(`git push origin ${tag}`);
    expect(git(clone, 'cat-file', '-t', tag)).toBe('tag');
    const commit = git(clone, 'rev-parse', `${tag}^{commit}`);
    expect(git(clone, 'rev-list', '--parents', '-n', '1', commit).split(' ').slice(1)).toEqual([base]);
    expect(git(clone, 'rev-parse', 'HEAD')).toBe(base);
    expect(git(clone, 'status', '--porcelain', '--untracked-files=no')).toBe('');
    expect(git(clone, 'worktree', 'list', '--porcelain').split('\n').filter((l) => l.startsWith('worktree '))).toHaveLength(1);
  });

  // @scenario behaviour orbit-release :: A release ships a built release tree :: The release package.json loses exactly the prepare triggers
  it('changes package.json by the triggers alone and touches nothing outside package.json and dist/', () => {
    const before = JSON.parse(git(clone, 'show', `${base}:package.json`));
    const after = JSON.parse(git(clone, 'show', `${tag}:package.json`));
    expect(before.scripts.prepare).toBeDefined();
    const kept = Object.fromEntries(Object.entries(before.scripts).filter(([name]) => !TRIGGERS.includes(name)));
    expect(after).toEqual({ ...before, scripts: kept });
    const changed = git(clone, 'diff', '--name-only', base, tag).split('\n');
    expect(changed).toContain('package.json');
    expect(changed).toContain('dist/cli/index.js');
    expect(changed.filter((f) => f !== 'package.json' && !f.startsWith('dist/'))).toEqual([]);
  });

  // @scenario behaviour orbit-release :: A release ships a built release tree :: A stale build output never reaches the release tree
  it('builds the released tree afresh: the checkout\'s stale dist/ file is absent from the release commit', () => {
    const dist = git(clone, 'ls-tree', '-r', '--name-only', tag, '--', 'dist').split('\n');
    expect(dist).toContain('dist/cli/index.js');
    expect(dist).not.toContain('dist/stale-output.js');
  });

  // @scenario behaviour orbit-release :: A release ships a built release tree :: The release tree packs what a built checkout packs
  it('packs the same files from the release tree as from a built checkout of the released commit', () => {
    const tree = path.join(scratch, 'release-tree');
    git(clone, 'worktree', 'add', '--quiet', '--detach', tree, tag);
    try {
      run(clone, process.execPath, ['build.js']);
      const fromCheckout = packed(clone);
      expect(fromCheckout).toContain('dist/cli/index.js');
      expect(fromCheckout).not.toContain('dist/stale-output.js');
      expect(packed(tree)).toEqual(fromCheckout);
    } finally {
      git(clone, 'worktree', 'remove', '--force', tree);
    }
  }, 60_000);

  // @scenario behaviour orbit-release :: A release ships a built release tree :: The release tag installs globally from git
  it('installs from git with -g into an empty prefix, as a copy, and prints the version', () => {
    const prefix = path.join(scratch, 'prefix');
    run(scratch, 'npm', ['install', '-g', '--prefix', prefix, '--prefer-offline', '--no-audit', '--no-fund', `git+file://${clone}#${tag}`]);
    expect(lstatSync(path.join(prefix, 'lib', 'node_modules', 'orbit-spec')).isSymbolicLink()).toBe(false);
    expect(run(scratch, path.join(prefix, 'bin', 'orbit'), ['--version'])).toBe(version);
  }, 120_000);

  // @scenario behaviour orbit-release :: A release ships a built release tree :: An existing tag is refused, and nothing is pushed
  it('refuses a second run naming the tag, and never pushes', () => {
    const again = release(clone);
    expect(again.status).toBe(1);
    expect(again.stderr).toContain(`tag ${tag} already exists`);
    expect(git(remote, 'for-each-ref')).toBe('');
  });

  // @scenario behaviour orbit-release :: A release ships a built release tree :: A workspaces field is refused
  it('refuses a commit declaring workspaces, cutting nothing', () => {
    git(clone, 'checkout', '--quiet', '-b', 'with-workspaces');
    const pkg = JSON.parse(readFileSync(path.join(clone, 'package.json'), 'utf-8'));
    writeFileSync(path.join(clone, 'package.json'), `${JSON.stringify({ ...pkg, workspaces: ['packages/*'] }, null, 2)}\n`);
    git(clone, 'commit', '--quiet', '-am', 'declare workspaces');
    git(clone, 'tag', '--delete', tag);
    const refs = git(clone, 'for-each-ref');
    const refused = release(clone);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain('workspaces');
    expect(git(clone, 'for-each-ref')).toBe(refs);
    expect(git(clone, 'worktree', 'list', '--porcelain').split('\n').filter((l) => l.startsWith('worktree '))).toHaveLength(1);
  });
});
