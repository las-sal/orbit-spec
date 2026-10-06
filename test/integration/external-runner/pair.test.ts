import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureCliBuilt } from '../../helpers/run-cli.js';
import { sh } from './launch.js';
import { runPair, runExternalRerun, emitFresh } from './pair.js';

/**
 * rc17b-blind-pair-command task 6.1 — the blind pair's git steps, TRANSCRIBED (see `pair.ts` for the
 * instrument's stated limit: it proves the commands, not that an agent follows the body), against a
 * real repository, a real bare remote, a stub runner, a stub fresh worker on the real emit surface, and
 * the real gate. Exit (2) of the stage is recorded by the no-runner case here.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const cliEntry = path.join(root, 'dist', 'cli', 'index.js');
const CHANGE = 'pair-change';
const MODE = 'system' as const;

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
  '## Direction',
  '',
  '**Disposition**: forward',
  '',
  'stub',
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
case "$(cat "$dir/mode")" in
  fail) echo "not signed in" >&2; exit 3 ;;
  *) cat "$dir/review.md" > "$out" ;;
esac
`;

describe('rc17b — the blind pair against real git (task 6.1)', () => {
  let base: string;
  let repo: string;
  let stubDir: string;
  let stub: string;
  let scratch: string;

  beforeAll(async () => {
    await ensureCliBuilt();
  });

  beforeEach(() => {
    base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-pair-')));
    const remote = path.join(base, 'remote.git');
    repo = path.join(base, 'repo');
    scratch = path.join(base, 'scratch');
    stubDir = path.join(base, 'tools');
    fs.mkdirSync(stubDir, { recursive: true });
    fs.mkdirSync(scratch, { recursive: true });
    stub = path.join(stubDir, 'stub-runner');
    fs.writeFileSync(stub, STUB);
    fs.chmodSync(stub, 0o755);
    fs.writeFileSync(path.join(stubDir, 'review.md'), REVIEW);
    fs.writeFileSync(path.join(stubDir, 'mode'), 'success');
    sh(base, 'git', ['init', '--bare', '-q', remote]);
    sh(base, 'git', ['init', '-q', '-b', 'main', repo]);
    for (const [k, v] of [['user.email', 't@example.com'], ['user.name', 'T'], ['commit.gpgsign', 'false']]) {
      sh(repo, 'git', ['config', k, v]);
    }
    const dir = path.join(repo, 'orbit', 'changes', CHANGE);
    fs.mkdirSync(path.join(dir, 'specs'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'orbit', 'config.yaml'), 'schema: spec-driven\n');
    fs.writeFileSync(path.join(dir, '.openspec.yaml'), 'schema: spec-driven\ncreated: 2026-10-06\nschema_version: 5\n');
    for (const f of ['proposal.md', 'design.md']) fs.writeFileSync(path.join(dir, f), '# x\n');
    fs.writeFileSync(path.join(dir, 'specs', 's.md'), '# s\n');
    fs.writeFileSync(path.join(dir, 'tasks.md'), '- [x] one\n');
    sh(repo, 'git', ['add', '-A']);
    sh(repo, 'git', ['commit', '-q', '-m', 'init']);
    sh(repo, 'git', ['remote', 'add', 'origin', remote]);
    sh(repo, 'git', ['push', '-q', '-u', 'origin', 'main']);
  });

  afterEach(() => {
    fs.rmSync(base, { recursive: true, force: true });
    const tmpRoot = fs.realpathSync(os.tmpdir());
    for (const d of fs.readdirSync(tmpRoot).filter((d) => d.startsWith(`orbit-external-${CHANGE}-`))) {
      fs.rmSync(path.join(tmpRoot, d), { recursive: true, force: true });
    }
  });

  const gateRow = () => {
    const r = spawnSync(process.execPath, [cliEntry, 'status', '--change', CHANGE, '--json'], { cwd: repo, encoding: 'utf-8' });
    return JSON.parse(r.stdout).gates.find((g: any) => g.id === `review-${MODE}`);
  };
  const subjects = (since: string) => sh(repo, 'git', ['log', '--format=%s', `${since}..HEAD`]).stdout.trim().split('\n').reverse();
  const filesOf = (rev: string) => sh(repo, 'git', ['show', '--name-only', '--format=', rev]).stdout.trim().split('\n').sort();
  const head = () => sh(repo, 'git', ['rev-parse', 'HEAD']).stdout.trim();
  const upstream = () => sh(repo, 'git', ['rev-parse', '@{u}']).stdout.trim();
  const tok = (p: string) => /(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/.exec(p)![1];
  const pair = (runner: string[] | null, fresh = { emit: true, exit: 0 }) =>
    runPair({ repo, change: CHANGE, mode: MODE, cliEntry, runner, fresh, scratch });

  // @scenario behaviour orbit-review :: The blind-pair reviewer runs both halves in one invocation :: A launched pair commits each half alone
  // @scenario behaviour orbit-review :: The blind-pair reviewer runs both halves in one invocation :: The external return waits for the fresh commit
  // @scenario behaviour orbit-review-external :: A launched return is committed alone and pushed :: A pair's external return is committed after the fresh pass
  it('a launched pair: three commits in order, the fresh token earlier, one push, the gate COMPLETE', () => {
    const start = head();
    const o = pair([stub, '--out', '{output}']);
    expect(o.failure).toBeNull();
    const shas = sh(repo, 'git', ['rev-list', '--reverse', `${start}..HEAD`]).stdout.trim().split('\n');
    expect(shas).toHaveLength(3);
    expect(shas[0]).toBe(o.base);
    expect(filesOf(shas[0])).toHaveLength(2);
    expect(filesOf(shas[1])).toEqual([o.freshPath]);
    expect(filesOf(shas[2])).toEqual([o.savedPath]);
    expect(tok(o.freshPath!) < tok(o.savedPath!)).toBe(true);
    expect(tok(o.freshPath!) > o.L!).toBe(true);
    expect(o.laterPushes).toBe(1);
    expect(head()).toBe(upstream());
    expect(fs.readdirSync(path.dirname(path.join(repo, o.freshPath!))).some((f) => f.startsWith('address-reviews-'))).toBe(false);
    const g = gateRow();
    expect(g.openPair).toBeUndefined();
    expect(g.reason).toBe("cadence class 'in-context' has no fresh pass");
    expect(fs.existsSync(path.join(o.runDir, 'worktree'))).toBe(false);
  });

  // @scenario behaviour orbit-review :: The blind-pair reviewer runs both halves in one invocation :: With no runner the pair ends open
  it('a no-runner pair: BASE and the fresh commit, pushed, and the pair OPEN missing external (exit 2)', () => {
    const start = head();
    const o = pair(null);
    expect(subjects(start)).toEqual([
      `External review handoff (${MODE}, iter 1): ${CHANGE} — blind pair launch`,
      `Fresh review (${MODE}): ${CHANGE} — blind pair, fresh half`,
    ]);
    expect(head()).toBe(upstream());
    const prompt = fs.readFileSync(path.join(repo, filesOf(o.base!).find((f) => f.includes('external-prompt-'))!), 'utf-8');
    expect(prompt).toContain(`read the repository at commit ${o.reviewedCommit}`);
    expect(sh(repo, 'git', ['rev-parse', `${o.base}^1`]).stdout.trim()).toBe(o.reviewedCommit);
    const g = gateRow();
    expect(g.openPair).toEqual({ missing: 'external' });
    expect(g.nextCommand).toBe(`/orbit:review --as ${MODE} --reviewer external ${CHANGE}`);
  });

  // @scenario behaviour orbit-review :: The blind-pair reviewer runs both halves in one invocation :: A failed external half leaves the pair open
  it('a failed runner: nothing committed for the external half, the fresh committed and pushed, the pair open', () => {
    fs.writeFileSync(path.join(stubDir, 'mode'), 'fail');
    const start = head();
    const o = pair([stub, '--out', '{output}']);
    expect(o.failure).toBe('runner exited 3');
    expect(o.fallback).toBe('pull');
    expect(subjects(start)).toHaveLength(2);
    expect(head()).toBe(upstream());
    expect(gateRow().openPair).toEqual({ missing: 'external' });
  });

  // @scenario behaviour orbit-review :: The blind-pair reviewer runs both halves in one invocation :: A dirty tree refuses the pair
  it('a dirty tree refuses the pair: nothing is written', () => {
    fs.writeFileSync(path.join(repo, 'dirty.txt'), 'x');
    const o = pair([stub, '--out', '{output}']);
    expect(o.refused).toContain('dirty.txt');
    expect(fs.existsSync(path.join(repo, 'orbit', 'changes', CHANGE, '.orbit-runs'))).toBe(false);
  });

  // @scenario behaviour orbit-review-external :: A pair's external half reads the pair's reviewed state :: A launched re-run of the missing external reads BASE
  it("a re-run of the missing external half: the worktree at BASE holds no fresh pass file; the save passes --launch L", () => {
    const first = pair(null);
    expect(gateRow().openPair).toEqual({ missing: 'external' });
    const r = runExternalRerun({ repo, change: CHANGE, mode: MODE, cliEntry, runner: [stub, '--out', '{output}'], scratch });
    expect(r.kind).toBe('re-run');
    expect(r.L).toBe(first.L);
    expect(r.worktreeBase).toBe(first.base);
    expect(r.worktreeHadFresh).toBe(false);
    expect(r.saveLaunch).toBe(first.L);
    expect(r.failure).toBeNull();
    const g = gateRow();
    expect(g.openPair).toBeUndefined();
    expect(g.reason).toBe("cadence class 'in-context' has no fresh pass");
  });

  /** An apply after L: its token one second past the trail's latest token, committed alone. */
  const applyAfter = (after: string): string => {
    const later = new Date(after.replace(/T(\d{2})-(\d{2})-(\d{2})Z/, 'T$1:$2:$3Z'));
    later.setUTCSeconds(later.getUTCSeconds() + 1);
    const tok = later.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
    const rel = `orbit/changes/${CHANGE}/.orbit-runs/apply-${tok}.json`;
    fs.writeFileSync(path.join(repo, rel), JSON.stringify({ command: 'apply' }));
    sh(repo, 'git', ['add', rel]);
    sh(repo, 'git', ['commit', '--only', rel, '-q', '-m', 'apply']);
    return tok;
  };

  // @scenario behaviour orbit-review-external :: A pair's external half reads the pair's reviewed state :: A re-run after an apply reviews the landed member's state
  it("an apply later than L, then a fresh member: the re-run reviews the commit before that member's, and the pair completes blind", () => {
    // The system walk's fresh CRITICAL, constructed: launch, no member, an apply, then the presented fresh review.
    const first = pair(null, { emit: false, exit: 0 });
    const applyTok = applyAfter(first.L!);
    // The constructed case of the proposal walk's external CRITICAL still refuses: a return saved under L after the apply.
    const raw = path.join(scratch, 'return.md');
    fs.writeFileSync(raw, REVIEW);
    const refused = spawnSync(process.execPath, [cliEntry, 'external', 'save', CHANGE, '--as', MODE, '--from', raw, '--launch', first.L!, '--json'], { cwd: repo, encoding: 'utf-8' });
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toMatch(/later than the launch/);
    const fresh = emitFresh(repo, cliEntry, CHANGE, MODE, scratch);
    sh(repo, 'git', ['add', fresh]);
    sh(repo, 'git', ['commit', '--only', fresh, '-q', '-m', 'fresh']);
    expect(gateRow().openPair).toEqual({ missing: 'external' });
    const r = runExternalRerun({ repo, change: CHANGE, mode: MODE, cliEntry, runner: [stub, '--out', '{output}'], scratch });
    expect(r.kind).toBe('re-run-after-apply');
    expect(r.worktreeHadFresh).toBe(false);
    expect(r.saveLaunch).not.toBe(first.L);
    expect(r.saveLaunch > applyTok).toBe(true);
    expect(r.failure).toBeNull();
    const g = gateRow();
    expect(g.openPair).toBeUndefined();
    expect(g.reason).toBe("cadence class 'in-context' has no fresh pass");
  });

  // @scenario behaviour orbit-review-external :: A pair's external half reads the pair's reviewed state :: A stale member's pair is superseded
  it('a member emitted before an apply is stale: no openPair, the notice, and an ordinary single', () => {
    const first = pair(null);
    applyAfter(tok(first.freshPath!));
    const before = gateRow();
    expect(before.openPair).toBeUndefined();
    expect(before.reason).toMatch(/cannot fill this slot: its fresh member is stale/);
    const r = runExternalRerun({ repo, change: CHANGE, mode: MODE, cliEntry, runner: [stub, '--out', '{output}'], scratch });
    expect(r.kind).toBe('stale-single');
    expect(r.failure).toBeNull();
  });

  // @scenario behaviour orbit-review :: The blind-pair reviewer runs both halves in one invocation :: A missing fresh half lets the external return land
  it('a fresh worker that wrote no pass file: the external lands alone and the pair is open missing fresh', () => {
    const start = head();
    const o = pair([stub, '--out', '{output}'], { emit: false, exit: 0 });
    expect(o.freshPath).toBeNull();
    expect(o.savedPath).not.toBeNull();
    const shas = sh(repo, 'git', ['rev-list', '--reverse', `${start}..HEAD`]).stdout.trim().split('\n');
    expect(shas).toHaveLength(2);
    expect(filesOf(shas[1])).toEqual([o.savedPath]);
    expect(gateRow().openPair).toEqual({ missing: 'fresh' });
  });

  // @scenario behaviour orbit-review :: The blind-pair reviewer runs both halves in one invocation :: A fresh worker stopped after it persisted is the landed member
  it('a fresh worker stopped after writing its pass file: committed as the member, and the pair COMPLETE', () => {
    const o = pair([stub, '--out', '{output}'], { emit: true, exit: 130 });
    expect(o.freshPath).not.toBeNull();
    expect(o.savedPath).not.toBeNull();
    expect(gateRow().openPair).toBeUndefined();
  });
});
