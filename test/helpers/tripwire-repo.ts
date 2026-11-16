import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

/** Disposable git repositories for the tripwire tests (`orbit-tripwires`). */

const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 't',
  GIT_AUTHOR_EMAIL: 't@example.invalid',
  GIT_COMMITTER_NAME: 't',
  GIT_COMMITTER_EMAIL: 't@example.invalid',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
};

export function git(root: string, args: string[]): string {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf-8', env: ENV });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout.trim();
}

export function tmpDir(prefix = 'orbit-tw-'): string {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

/** A new repository on branch `main`, with one base commit holding README.txt. */
export function makeRepo(): string {
  const root = tmpDir();
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'commit.gpgsign', 'false']);
  write(root, 'README.txt', 'base\n');
  commit(root, 'base');
  return root;
}

export function write(root: string, rel: string, content: string | Buffer): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

export function remove(root: string, rel: string): void {
  fs.rmSync(path.join(root, rel), { recursive: true, force: true });
}

/** Stages everything and commits; returns the commit's id. */
export function commit(root: string, message: string): string {
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '--allow-empty', '-m', message]);
  return git(root, ['rev-parse', 'HEAD']);
}

/** `n` distinct lines of text. */
export function textLines(n: number, tag = 'l'): string {
  return Array.from({ length: n }, (_, i) => `${tag} ${i}`).join('\n') + (n > 0 ? '\n' : '');
}

/** A design.md whose `## Touchpoints` section lists `entries` verbatim (each a list item's text), or none. */
export function designWith(entries: string[] | null): string {
  const head = '## Context\n\nA change.\n';
  if (entries === null) return head;
  return `${head}\n## Touchpoints\n\n${entries.map(e => `- ${e}`).join('\n')}\n\n## Risks\n\nNone.\n`;
}

/** Writes and commits a change's proposal (`.openspec.yaml` + design.md); returns the commit. */
export function propose(root: string, name: string, touchpoints: string[] | null, extra: Record<string, string> = {}): string {
  write(root, `orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\n');
  write(root, `orbit/changes/${name}/proposal.md`, '## Why\n\nBecause.\n');
  write(root, `orbit/changes/${name}/design.md`, designWith(touchpoints));
  for (const [rel, text] of Object.entries(extra)) write(root, rel, text);
  return commit(root, `propose ${name}`);
}

let applySeq = 0;

/** Writes an apply emit file for `name` plus `files`, and commits them together; returns the commit. */
export function applyCommit(root: string, name: string, files: Record<string, string | Buffer> = {}): string {
  applySeq++;
  const ts = `2026-01-01T00-00-${String(applySeq % 60).padStart(2, '0')}Z`;
  write(root, `orbit/changes/${name}/.orbit-runs/apply-${ts}.json`, '{}\n');
  for (const [rel, text] of Object.entries(files)) write(root, rel, text);
  return commit(root, `apply ${name}`);
}
