import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureCliBuilt } from '../../helpers/run-cli.js';
import { runLaunchRoute, sh } from './launch.js';

/**
 * rc17d-external-runner task 5.1 — the launch route's commands, TRANSCRIBED (see `launch.ts` for the
 * instrument's stated limit: it proves the commands, not that an agent follows the body), against a
 * real repository, a real bare remote and a stub runner recorded as an own argv whose `argv[0]` path
 * holds a space and a quote.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const cliEntry = path.join(root, 'dist', 'cli', 'index.js');
const CHANGE = 'my-change';

const REVIEW = [
  `# External Review: ${CHANGE} (iteration 1)`,
  '',
  '**Reviewer**: stub-runner',
  '**Date**: 2026-10-06',
  '',
  '## CRITICAL',
  '',
  'None.',
  '',
  '## WARNING',
  '',
  'None.',
  '',
  '## SUGGESTION',
  '',
  'None.',
  '',
].join('\n');

const STUB = `#!/bin/sh
out=""
while [ $# -gt 0 ]; do
  case "$1" in
    --out) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
dir=$(dirname "$0")
cat > "$dir/stdin.txt"
pwd -P > "$dir/cwd.txt"
mode=$(cat "$dir/mode")
case "$mode" in
  fail) echo "not signed in" >&2; exit 3 ;;
  noheading) echo "I ran out of time." > "$out" ;;
  preamble) { echo "I could not save, commit, or push the findings file."; cat "$dir/review.md"; } > "$out" ;;
  hostile) { cat "$dir/hostile.txt"; cat "$dir/review.md"; } > "$out" ;;
  *) cat "$dir/review.md" > "$out" ;;
esac
`;

describe('rc17d — the launch route against real git (task 5.1)', () => {
  let base: string;
  let repo: string;
  let remote: string;
  let stubDir: string;
  let stub: string;
  let n = 0;

  beforeAll(async () => {
    await ensureCliBuilt();
  });

  beforeEach(() => {
    base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-launch-')));
    remote = path.join(base, 'remote.git');
    repo = path.join(base, 'repo');
    stubDir = path.join(base, "tools dir", "o'brien");
    fs.mkdirSync(stubDir, { recursive: true });
    stub = path.join(stubDir, "my rev'iewer");
    fs.writeFileSync(stub, STUB);
    fs.chmodSync(stub, 0o755);
    fs.writeFileSync(path.join(stubDir, 'review.md'), REVIEW);
    sh(base, 'git', ['init', '--bare', '-q', remote]);
    sh(base, 'git', ['init', '-q', '-b', 'main', repo]);
    for (const [k, v] of [['user.email', 't@example.com'], ['user.name', 'T'], ['commit.gpgsign', 'false']]) {
      sh(repo, 'git', ['config', k, v]);
    }
    fs.mkdirSync(path.join(repo, 'orbit', 'changes', CHANGE), { recursive: true });
    fs.writeFileSync(path.join(repo, 'orbit', 'changes', CHANGE, 'proposal.md'), '## Why\n');
    sh(repo, 'git', ['add', '-A']);
    sh(repo, 'git', ['commit', '-q', '-m', 'init']);
    sh(repo, 'git', ['remote', 'add', 'origin', remote]);
    sh(repo, 'git', ['push', '-q', '-u', 'origin', 'main']);
  });

  afterEach(() => {
    fs.rmSync(base, { recursive: true, force: true });
    const tmpRoot = fs.realpathSync(os.tmpdir());
    for (const d of fs.readdirSync(tmpRoot).filter((d) => d.startsWith(`orbit-external-${CHANGE}-2026-10-06T1`))) {
      fs.rmSync(path.join(tmpRoot, d), { recursive: true, force: true });
    }
  });

  const launch = (mode: string) => {
    fs.writeFileSync(path.join(stubDir, 'mode'), mode);
    n++;
    const sec = String(n).padStart(2, '0');
    return runLaunchRoute({
      repo,
      change: CHANGE,
      mode: 'system',
      argv: [stub, '--out', '{output}'],
      cliEntry,
      token: `2026-10-06T10-00-${sec}Z`,
      t0Token: `2026-10-06T10-01-${sec}Z`,
    });
  };
  const headFiles = () => sh(repo, 'git', ['show', '--name-only', '--format=', 'HEAD']).stdout.trim().split('\n');
  const headSubject = () => sh(repo, 'git', ['log', '-1', '--format=%B']).stdout;
  const runsFiles = () => fs.readdirSync(path.join(repo, 'orbit', 'changes', CHANGE, '.orbit-runs')).sort();

  // @scenario behaviour orbit-review-external :: Handoff preflight blocks unusable pull invocations :: A clean tree with a runner commits, pushes and launches
  it('success: the saved return is one commit, pushed to the bare remote; stdin and cwd are the worktree', () => {
    const o = launch('success');
    expect(o.failure).toBeNull();
    expect(o.handoffPushed).toBe(true);
    expect(o.returnCommitted).toBe(true);
    expect(o.returnPushed).toBe(true);
    expect(headFiles()).toEqual([o.saved!.path]);
    expect(sh(repo, 'git', ['rev-parse', 'HEAD']).stdout).toBe(sh(repo, 'git', ['rev-parse', '@{u}']).stdout);
    expect(fs.readFileSync(path.join(stubDir, 'stdin.txt'), 'utf-8')).toMatch(/^# External Review: my-change/);
    expect(fs.readFileSync(path.join(stubDir, 'cwd.txt'), 'utf-8').trim()).toBe(path.join(o.runDir, 'worktree'));
    expect(fs.existsSync(path.join(o.runDir, 'worktree'))).toBe(false);
    // The handoff commit carried the prompt and the T0 and nothing else.
    expect(sh(repo, 'git', ['show', '--name-only', '--format=', 'HEAD~1']).stdout.trim().split('\n').sort()).toEqual([
      'orbit/changes/my-change/.orbit-runs/external-prompt-system-2026-10-06T10-00-01Z.md',
      'orbit/changes/my-change/.orbit-runs/review-external-2026-10-06T10-01-01Z.json',
    ]);
  });

  it('the return commit stays alone when the user staged other work during the run', () => {
    fs.writeFileSync(path.join(stubDir, 'mode'), 'success');
    // Stage work in the live checkout before launching would block (dirty); stage it via a wrapper runner instead.
    const wrapper = path.join(stubDir, 'wrap.sh');
    fs.writeFileSync(
      wrapper,
      `#!/bin/sh\ncd '${repo}' && echo pending > pending.txt && git add pending.txt\nexec '${stub.replace(/'/g, `'\\''`)}' "$@"\n`
    );
    fs.chmodSync(wrapper, 0o755);
    const o = runLaunchRoute({
      repo,
      change: CHANGE,
      mode: 'system',
      argv: [wrapper, '--out', '{output}'],
      cliEntry,
      token: '2026-10-06T11-00-00Z',
      t0Token: '2026-10-06T11-00-01Z',
    });
    expect(o.returnCommitted).toBe(true);
    expect(headFiles()).toEqual([o.saved!.path]);
    expect(sh(repo, 'git', ['diff', '--cached', '--name-only']).stdout.trim()).toBe('pending.txt');
  });

  it('a preamble is removed and quoted in the commit message', () => {
    const o = launch('preamble');
    expect(o.saved!.removed).toEqual(['I could not save, commit, or push the findings file.']);
    expect(fs.readFileSync(path.join(repo, o.saved!.path), 'utf-8')).toBe(REVIEW);
    expect(headSubject()).toContain('> I could not save, commit, or push the findings file.');
  });

  it('a preamble carrying shell syntax stays literal data in the commit message; nothing runs', () => {
    const probe = path.join(base, 'PREAMBLE_RAN');
    const hostile = `I could not run \`touch ${probe}\` or $(touch ${probe}) — "quoted" and 'single'`;
    fs.writeFileSync(path.join(stubDir, 'hostile.txt'), hostile + '\n');
    const o = launch('hostile');
    expect(o.returnCommitted).toBe(true);
    expect(o.saved!.removed).toEqual([hostile]);
    expect(fs.existsSync(probe)).toBe(false);
    expect(headSubject()).toContain(`> ${hostile}`);
  });

  it('no heading: nothing committed for the return, paste fallback', () => {
    const o = launch('noheading');
    expect(o.failure).toMatch(/save refused/);
    expect(o.returnCommitted).toBe(false);
    expect(o.fallback).toBe('pull');
    expect(runsFiles().some((f) => /^external-system-/.test(f))).toBe(false);
    expect(fs.existsSync(path.join(o.runDir, 'return.md'))).toBe(true);
  });

  it('non-zero exit: nothing committed, paste fallback; the T0 stands', () => {
    const o = launch('fail');
    expect(o.runExit).toBe(3);
    expect(o.returnCommitted).toBe(false);
    expect(o.fallback).toBe('pull');
    expect(runsFiles().some((f) => /^review-external-/.test(f))).toBe(true);
    expect(headSubject()).toMatch(/^External review handoff/);
  });

  it('a failed handoff push still launches; a failed run then prints the handoff-blocked fallback', () => {
    sh(repo, 'git', ['remote', 'set-url', 'origin', path.join(base, 'gone.git')]);
    const o = launch('fail');
    expect(o.handoffPushed).toBe(false);
    expect(o.launched).toBe(true);
    expect(o.fallback).toBe('handoff-blocked');
  });

  // @scenario behaviour orbit-review-external :: Handoff preflight blocks unusable pull invocations :: A dirty tree with a runner does not launch
  it('a dirty tree launches nothing and writes nothing', () => {
    fs.writeFileSync(path.join(repo, 'dirty.txt'), 'x');
    const o = launch('success');
    expect(o.failure).toBe('dirty');
    expect(o.launched).toBe(false);
    expect(fs.existsSync(path.join(repo, 'orbit', 'changes', CHANGE, '.orbit-runs'))).toBe(false);
  });
});
