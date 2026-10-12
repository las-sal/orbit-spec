#!/usr/bin/env node
// Cut a release as a BUILT RELEASE TREE (orbit-release's `A release ships a built release tree`).
//
// From the commit checked out (HEAD) of the repository in the current directory: build it in a
// detached worktree, force-add the built `dist/` past `.gitignore`, remove npm's git-dependency
// prepare triggers from that commit's `package.json`, commit, and cut the annotated `v<version>`
// tag on the release commit, whose parent is HEAD. Nothing is pushed: the push is printed for
// the release act, and the release commit is never merged back.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** The `package.json` scripts that make npm prepare a git dependency (pacote 21.5.0, `lib/git.js` `#prepareDir`). */
export const PREPARE_TRIGGERS = ['prepare', 'build', 'postinstall', 'install', 'preinstall', 'prepack'];

/**
 * The release commit's `package.json`: the given one with every prepare trigger removed from
 * `scripts`, and nothing else changed. Refuses a `workspaces` field, pacote's seventh trigger.
 */
export function releasePackageJson(pkg) {
  if (Object.prototype.hasOwnProperty.call(pkg, 'workspaces')) {
    throw new Error('package.json declares workspaces, which make npm prepare a git dependency; a release tree cannot carry them');
  }
  if (!pkg.scripts) return { ...pkg };
  const scripts = Object.fromEntries(Object.entries(pkg.scripts).filter(([name]) => !PREPARE_TRIGGERS.includes(name)));
  return { ...pkg, scripts };
}

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** Cut the release tree in the repository at `root`; returns the tag, the release commit and its parent. */
export function cutReleaseTree(root) {
  const base = git(root, ['rev-parse', 'HEAD']);
  const pkg = JSON.parse(git(root, ['show', `${base}:package.json`]));
  const release = releasePackageJson(pkg);
  const tag = `v${pkg.version}`;
  if (git(root, ['tag', '--list', tag]) !== '') throw new Error(`tag ${tag} already exists`);
  if (!existsSync(path.join(root, 'node_modules'))) throw new Error('node_modules is missing; run npm install first');

  const scratch = mkdtempSync(path.join(tmpdir(), 'orbit-release-'));
  const tree = path.join(scratch, 'tree');
  git(root, ['worktree', 'add', '--detach', tree, base]);
  try {
    // Build the base commit's own tree, with the checkout's toolchain.
    symlinkSync(path.join(root, 'node_modules'), path.join(tree, 'node_modules'), 'dir');
    execFileSync(process.execPath, ['build.js'], { cwd: tree, stdio: ['ignore', 'pipe', 'inherit'] });
    rmSync(path.join(tree, 'node_modules'));

    writeFileSync(path.join(tree, 'package.json'), `${JSON.stringify(release, null, 2)}\n`);
    git(tree, ['add', '--force', '--', 'dist', 'package.json']);
    git(tree, ['commit', '--quiet', '--no-verify', '-m', `Release ${tag} (built tree)`, '-m', `Built from ${base}; never merged back.`]);
    const commit = git(tree, ['rev-parse', 'HEAD']);
    git(tree, ['tag', '--annotate', tag, '--message', `orbit ${tag}`, commit]);
    return { tag, commit, base };
  } finally {
    git(root, ['worktree', 'remove', '--force', tree]);
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { tag, commit, base } = cutReleaseTree(git(process.cwd(), ['rev-parse', '--show-toplevel']));
    console.log(`Cut ${tag} on release commit ${commit} (parent ${base}).`);
    console.log(`Push it by name: git push origin ${tag}`);
  } catch (error) {
    console.error(`release-tree: ${error.message}`);
    process.exit(1);
  }
}
