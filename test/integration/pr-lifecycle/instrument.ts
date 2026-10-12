/**
 * The `orbit pr` instrument (rc12-engine-owned-choreography, `orbit-pr-lifecycle`'s `Printed
 * commands are proven by execution`): the allowlist assertion and the segment runner.
 *
 * The allowlist here is TRANSCRIBED from the requirement's table, never imported from the
 * engine's runner: an engine that widened its own allowlist must still fail this assertion.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PrRecord, SegmentInput } from '../../../src/core/pr/record.js';
import type { PrContext } from '../../../src/core/pr/run.js';
import type { Invocation, Repo } from './harness.js';

/** `orbit-pr-lifecycle`'s allowlist, row by row. `remote` is the resolved remote, when known. */
export function allowedGit(args: string[]): boolean {
  const [cmd, ...rest] = args;
  switch (cmd) {
    case 'remote':
      return rest.length === 0 || (rest[0] === 'get-url' && rest.length === 2);
    case 'config':
      return rest.length === 2 && rest[0] === '--get' && /^remote\..+\.url$/.test(rest[1]);
    case 'rev-parse':
    case 'check-ref-format':
    case 'merge-base':
    case 'rev-list':
    case 'ls-files':
    case 'ls-tree':
      return true;
    case 'symbolic-ref':
      // Exactly one ref, and only the read flags: two refs WRITE, and `--delete` / `-d` writes
      // with one.
      return (
        rest.filter((a) => !a.startsWith('-')).length === 1 &&
        rest.every((a) => !a.startsWith('-') || a === '-q' || a === '--quiet' || a === '--short')
      );
    case 'status':
      return rest[0] === '--porcelain';
    case 'diff':
      // `--output=<file>` writes a file; nothing else on a name-only or quiet diff does.
      return (rest.includes('--name-only') || rest.includes('--quiet')) && !rest.some((a) => a.startsWith('--output'));
    case 'branch':
      return rest.length === 1 && rest[0] === '--show-current';
    case 'ls-remote':
      return rest[0] === '--heads' && rest.length >= 3 && rest.slice(1).every((a) => !a.startsWith('-'));
    case 'fetch': {
      if (rest[0] !== '--no-tags' || rest[1] !== '--refmap=' || rest.length < 4) return false;
      const remote = rest[2];
      return rest.slice(3).every((s) => {
        const m = s.match(/^\+refs\/heads\/([^:]+):refs\/remotes\/([^/]+)\/(.+)$/);
        return m !== null && m[2] === remote && m[1] === m[3];
      });
    }
    default:
      return false;
  }
}

export function allowedGh(args: string[]): boolean {
  if (args[0] === 'repo' && args[1] === 'view') return args[2] !== undefined && !args[2].startsWith('-');
  return args[0] === 'pr' && (args[1] === 'view' || args[1] === 'list');
}

/** Fails naming every recorded call outside the allowlist. */
export function assertAllowlist(calls: { git: Invocation[]; gh: Invocation[] }): void {
  const bad = [
    ...calls.git.filter((c) => !allowedGit(c.args)).map((c) => `git ${c.args.join(' ')}`),
    ...calls.gh.filter((c) => !allowedGh(c.args)).map((c) => `gh ${c.args.join(' ')}`),
  ];
  if (bad.length > 0) throw new Error(`orbit pr invoked outside the read-only allowlist: ${bad.join('; ')}`);
}

/** Every `orbit pr` call a case makes, with the invocations it recorded. */
export const ENGINE_CALLS: Array<{ subcommand: string; calls: { git: Invocation[]; gh: Invocation[] } }> = [];

export function ctxFor(repo: Repo): PrContext {
  return { projectRoot: repo.dir, env: repo.env() };
}

/**
 * Run an engine call against the repository and return the record with exactly the `git` and
 * `gh` invocations it made; the allowlist is asserted on them before anything else reads it.
 */
export function engine(repo: Repo, call: (ctx: PrContext) => PrRecord): { record: PrRecord; calls: { git: Invocation[]; gh: Invocation[] } } {
  const mark = repo.mark();
  const record = call(ctxFor(repo));
  const calls = repo.since(mark);
  assertAllowlist(calls);
  if (record.action === 'off' && (calls.git.length > 0 || calls.gh.length > 0)) {
    throw new Error(`an 'off' record ran ${calls.git.length} git and ${calls.gh.length} gh invocation(s)`);
  }
  // Recorded only once it passed: an injected case that failed here has already failed loudly.
  ENGINE_CALLS.push({ subcommand: record.subcommand, calls });
  return { record, calls };
}

export type Authored = Partial<Record<SegmentInput, string>>;

/**
 * Run a record's segments in order. Before each, `author(i, outputs)` — `outputs` being every
 * earlier step's stdout, in order — supplies that segment's inputs (a
 * file path for `<message-file>`, `<body-file>` and `<emit-path>`; the text for `<title>`), so a
 * case can write the emit between `publish`'s two segments. A step that exits non-zero FAILS,
 * naming the step and the tool's message. `human_acts` are never run.
 */
export function runSegments(
  repo: Repo,
  record: PrRecord,
  author: (index: number, outputs: string[]) => Authored = () => ({})
): { executed: string[][]; outputs: string[] } {
  const executed: string[][] = [];
  const outputs: string[] = [];
  record.segments.forEach((seg, i) => {
    const inputs = author(i, outputs);
    for (const need of seg.inputs) {
      if (inputs[need] === undefined) throw new Error(`segment ${i + 1} needs ${need} authored first`);
    }
    for (const s of seg.steps) {
      const argv = s.argv.map((a) => (a in inputs ? (inputs[a as SegmentInput] as string) : a));
      const leftover = argv.filter((a) => /^<[a-z-]+>$/.test(a));
      if (leftover.length) throw new Error(`step '${s.step}' still names ${leftover.join(', ')} after authoring`);
      const res = spawnSync(argv[0], argv.slice(1), { cwd: repo.dir, encoding: 'utf-8', env: repo.env() });
      executed.push(argv);
      if (res.status !== 0) {
        throw new Error(`step '${s.step}' (${argv.join(' ')}) failed: ${(res.stderr || res.stdout || '').trim()}`);
      }
      outputs.push(res.stdout ?? '');
    }
  });
  return { executed, outputs };
}

/** No human act ran: none in what the segments executed, and no `gh pr merge` was ever recorded. */
export function assertHumanActsUnrun(repo: Repo, record: PrRecord, executed: string[][]): void {
  for (const act of record.human_acts) {
    if (executed.some((e) => e.join('\0') === act.argv.join('\0'))) {
      throw new Error(`human act '${act.act}' was run`);
    }
  }
  if (repo.ghLog().some((c) => c.args[0] === 'pr' && (c.args[1] === 'merge' || (c.args[1] === 'ready' && record.subcommand === 'program')))) {
    throw new Error('a human act reached gh');
  }
}

/** Write a body-authored file in the repo's parent dir (never inside the worktree). */
export function authorFile(repo: Repo, name: string, content: string): string {
  const p = path.join(path.dirname(repo.dir), name);
  fs.writeFileSync(p, content);
  return p;
}
