/**
 * `orbit pr commit` against real repositories (chained-review-commit, task 1.4): every gate row, the porcelain states
 * the stage takes or leaves, and the push's destination, each `proceed` executed by the segment runner and the
 * repository and its bare remote asserted afterwards. Every engine call goes through `engine()`, which fails on any
 * invocation outside `orbit-pr-lifecycle`'s allowlist and on any `git` call behind an `off`.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
import { prCommit } from '../../../src/core/pr/commit.js';
import { PrUsageError, type PrRecord } from '../../../src/core/pr/record.js';
import { REAL_GIT, type GhScript, type Repo } from '../../integration/pr-lifecycle/harness.js';
import { authorFile, ctxFor, engine, runSegments } from '../../integration/pr-lifecycle/instrument.js';
import { change, orbitRepo, type Regime } from './fixtures.js';

const NAME = 'add-thing';
const URL7 = 'https://github.com/acme/widget/pull/7';

const extraCleanups: Array<() => void> = [];
afterEach(() => {
  while (extraCleanups.length) extraCleanups.pop()!();
  vi.restoreAllMocks();
});

interface Setup {
  /** Raw YAML lines added to `orbit/config.yaml`, e.g. `commit: true\npush: true\n`. */
  settings?: string;
  regime?: Regime;
  gh?: GhScript | 'absent';
  remote?: 'bare' | 'none';
  /** Write the propose emit's attachment (default true). */
  attach?: boolean;
}

const BOTH = 'commit: true\npush: true\n';

/**
 * An attached change as propose leaves it: the settings committed on the default branch, the change's branch cut,
 * the change generated and its propose emit carrying the attachment, all committed and pushed with upstream set.
 */
function attached(s: Setup = {}): Repo {
  const remote = s.remote ?? 'bare';
  const repo = orbitRepo(s.regime ?? 'per-proposal', { gh: s.gh ?? {}, remote });
  if (s.settings) {
    repo.write('orbit/config.yaml', `schema: spec-driven\npr: ${s.regime ?? 'per-proposal'}\n${s.settings}`);
    repo.commitAll('settings');
    if (remote !== 'none') repo.git('push', '-q', 'origin', repo.defaultBranch);
  }
  repo.git('switch', '-q', '-c', NAME);
  change(repo, NAME);
  composeAndWriteEmit(
    'propose',
    { change: NAME },
    {
      final_assessment: 'Proposed.',
      model: null,
      ...(s.attach === false ? {} : { pr_attachment: { branch: NAME, granularity: 'per-proposal', url: URL7, state: 'draft' } }),
    },
    { projectRoot: repo.dir }
  );
  repo.commitAll('propose');
  if (remote !== 'none') repo.git('push', '-q', '-u', 'origin', NAME);
  return repo;
}

function commit(repo: Repo, name = NAME) {
  return engine(repo, (ctx) => prCommit(ctx, name));
}

/** Run the record's segments as the commit step does: the message written OUTSIDE the working tree. */
function runStep(repo: Repo, record: PrRecord, message = `Apply: ${NAME} — the session's work`) {
  const file = authorFile(repo, 'commit-msg.txt', `${message}\n`);
  expect(path.relative(repo.dir, file).startsWith('..')).toBe(true);
  return runSegments(repo, record, () => ({ '<message-file>': file }));
}

const porcelain = (repo: Repo) => repo.git('status', '--porcelain', '--untracked-files=all').stdout;
const steps = (record: PrRecord) => record.segments.flatMap((s) => s.steps.map((x) => x.step));
const rev = (repo: Repo, ref: string) => repo.git('rev-parse', '-q', '--verify', ref).stdout.trim();
const headTree = (repo: Repo) => repo.git('ls-tree', '-r', '--name-only', 'HEAD').stdout.split('\n').filter(Boolean);

describe('commit — the settings (`The commit and push settings`)', () => {
  // @scenario behaviour orbit-pr-lifecycle :: The commit and push settings :: Neither key is today's behaviour
  it('neither key: off, no git call, the working tree unchanged', () => {
    const repo = attached();
    repo.write('README.md', '# changed\n');
    repo.write('new.txt', 'new\n');
    const before = porcelain(repo);
    const { record, calls } = commit(repo);
    expect(record).toMatchObject({ subcommand: 'commit', action: 'off', reason: null, segments: [], human_acts: [] });
    expect(calls).toEqual({ git: [], gh: [] });
    expect(porcelain(repo)).toBe(before);
  });

  // @scenario behaviour orbit-pr-lifecycle :: The commit and push settings :: A value other than true grants nothing
  it('commit: "yes" and push: false grant nothing, and no warning names either key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = attached({ settings: 'commit: "yes"\npush: false\n' });
    repo.write('README.md', '# changed\n');
    const { record, calls } = commit(repo);
    expect(record.action).toBe('off');
    expect(calls).toEqual({ git: [], gh: [] });
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).not.toMatch(/commit|push/);
  });

  // @scenario behaviour orbit-pr-lifecycle :: The commit and push settings :: Push alone commits nothing
  it('push alone: the push of the unpushed commit, no stage or commit; the modified file stays uncommitted', () => {
    const repo = attached({ settings: 'push: true\n' });
    repo.write('local.txt', 'committed locally\n');
    repo.commitAll('a local commit');
    repo.write('README.md', '# modified, not committed\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'proceed', reason: null, degraded: null });
    expect(record.observations).toMatchObject({ settings: { commit: false, push: true }, unpushed: 1, untracked: [] });
    expect(record.segments).toEqual([{ inputs: [], steps: [{ step: 'push', argv: ['git', 'push', '-u', 'origin', NAME] }] }]);
    runSegments(repo, record);
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));
    expect(porcelain(repo)).toBe(' M README.md\n');
  });

  // @scenario behaviour orbit-pr-lifecycle :: The commit and push settings :: Commit alone pushes nothing
  it('commit alone: the stage and the commit, no push', () => {
    const repo = attached({ settings: 'commit: true\n' });
    repo.write('README.md', '# modified\n');
    const pushed = rev(repo, `refs/remotes/origin/${NAME}`);
    const { record } = commit(repo);
    expect(record.segments).toEqual([
      {
        inputs: ['<message-file>'],
        steps: [
          { step: 'stage', argv: ['git', 'add', '-A'] },
          { step: 'commit', argv: ['git', 'commit', '-F', '<message-file>'] },
        ],
      },
    ]);
    runStep(repo, record);
    expect(porcelain(repo)).toBe('');
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(pushed);
    expect(rev(repo, 'HEAD')).not.toBe(pushed);
  });
});

describe('commit — the gate (`orbit pr commit` computes the closing commit step)', () => {
  it('a never regime is off before the settings are read: no git call', () => {
    const repo = attached({ regime: 'never', settings: BOTH });
    repo.write('README.md', '# modified\n');
    const { record, calls } = commit(repo);
    expect(record.action).toBe('off');
    expect(calls).toEqual({ git: [], gh: [] });
  });

  it('no attachment on the trail is off: no git call', () => {
    const repo = attached({ settings: BOTH, attach: false });
    repo.write('README.md', '# modified\n');
    const { record, calls } = commit(repo);
    expect(record.action).toBe('off');
    expect(calls).toEqual({ git: [], gh: [] });
  });

  it('a name resolving to no change, active or archived, is the usage error', () => {
    const repo = attached({ settings: BOTH });
    expect(() => prCommit(ctxFor(repo), 'no-such-change')).toThrow(PrUsageError);
    expect(() => prCommit(ctxFor(repo), 'Bad Name')).toThrow(PrUsageError);
  });

  it('a detached HEAD skips with detached', () => {
    const repo = attached({ settings: BOTH });
    repo.git('switch', '-q', '--detach');
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'detached' }, segments: [] });
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: A step off the attached branch prints nothing to run
  it('HEAD on another branch skips with head-mismatch naming both branches', () => {
    const repo = attached({ settings: BOTH });
    repo.git('switch', '-q', '-c', 'elsewhere');
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({
      action: 'skip',
      reason: { code: 'head-mismatch', detail: { head: 'elsewhere', branch: NAME } },
      segments: [],
    });
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: The default branch is never committed to
  it("the remote's HEAD ref naming the attachment's branch skips with default-branch", () => {
    const repo = attached({ settings: BOTH });
    repo.git('symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${NAME}`);
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'default-branch' }, segments: [] });
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: A missing remote HEAD ref leaves the default-branch row untested
  it("an absent remote HEAD ref leaves the row untested: proceed with the stage, the commit and the push", () => {
    const repo = attached({ settings: BOTH });
    expect(repo.git('symbolic-ref', '-q', 'refs/remotes/origin/HEAD').status).not.toBe(0);
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record.action).toBe('proceed');
    expect(steps(record)).toEqual(['stage', 'commit', 'push']);
  });

  it("a remote HEAD ref naming another branch is no default-branch skip", () => {
    const repo = attached({ settings: BOTH });
    repo.git('symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${repo.defaultBranch}`);
    repo.write('README.md', '# modified\n');
    expect(commit(repo).record.action).toBe('proceed');
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: A merge in progress prints nothing to run
  it('an unmerged path from an unfinished merge skips with merge-in-progress', () => {
    const repo = attached({ settings: BOTH });
    conflict(repo, 'merge');
    expect(porcelain(repo)).toMatch(/^UU README\.md/m);
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'merge-in-progress' }, segments: [] });
    expect((record.reason!.detail as { unmerged: string[] }).unmerged).toEqual(['README.md']);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: A merge in progress prints nothing to run
  it.each(['cherry-pick', 'revert'] as const)('a %s stopped with no conflicted path still skips', (op) => {
    const repo = attached({ settings: BOTH });
    conflict(repo, op);
    repo.git('add', 'README.md');
    expect(porcelain(repo)).not.toMatch(/^(UU|AA|DD|AU|UA|UD|DU) /m);
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'merge-in-progress' } });
    expect((record.reason!.detail as { in_progress: string[] }).in_progress).toEqual([
      op === 'cherry-pick' ? 'CHERRY_PICK_HEAD' : 'REVERT_HEAD',
    ]);
  });

  it('a rebase directory skips with merge-in-progress', () => {
    const repo = attached({ settings: BOTH });
    fs.mkdirSync(path.join(repo.dir, '.git', 'rebase-merge'));
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'merge-in-progress', detail: { in_progress: ['rebase-merge'] } } });
  });

  describe('the first matching row decides (the order is observable)', () => {
    it('detached before merge-in-progress', () => {
      const repo = attached({ settings: BOTH });
      // Detach first: git refuses a switch once a rebase directory exists.
      expect(repo.git('switch', '-q', '--detach').status).toBe(0);
      fs.mkdirSync(path.join(repo.dir, '.git', 'rebase-merge'));
      expect(commit(repo).record.reason?.code).toBe('detached');
    });

    it('head-mismatch before default-branch', () => {
      const repo = attached({ settings: BOTH });
      repo.git('symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${NAME}`);
      repo.git('switch', '-q', '-c', 'elsewhere');
      expect(commit(repo).record.reason?.code).toBe('head-mismatch');
    });

    it('default-branch before merge-in-progress', () => {
      const repo = attached({ settings: BOTH });
      repo.git('symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${NAME}`);
      conflict(repo, 'merge');
      expect(commit(repo).record.reason?.code).toBe('default-branch');
    });

    it('the attachment before the branch: an unattached change on a detached HEAD is off, with no git call', () => {
      const repo = attached({ settings: BOTH, attach: false });
      repo.git('switch', '-q', '--detach');
      const { record, calls } = commit(repo);
      expect(record.action).toBe('off');
      expect(calls.git).toEqual([]);
    });
  });
});

describe('commit — what the stage takes (`orbit pr commit` computes the closing commit step)', () => {
  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: A granted step on the attached branch commits and pushes everything
  it('both granted: a hand edit and a new file are committed and pushed; the untracked file is named', () => {
    const repo = attached({ settings: BOTH });
    repo.write('README.md', '# edited by hand\n');
    repo.write('notes/new.txt', 'new\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'proceed', reason: null, degraded: null, human_acts: [] });
    expect(record.observations).toMatchObject({ branch: NAME, settings: { commit: true, push: true }, untracked: ['notes/new.txt'], unpushed: 0 });
    expect(record.segments).toEqual([
      {
        inputs: ['<message-file>'],
        steps: [
          { step: 'stage', argv: ['git', 'add', '-A'] },
          { step: 'commit', argv: ['git', 'commit', '-F', '<message-file>'] },
          { step: 'push', argv: ['git', 'push', '-u', 'origin', NAME] },
        ],
      },
    ]);
    runStep(repo, record);
    expect(porcelain(repo)).toBe('');
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));
    expect(headTree(repo)).toContain('notes/new.txt');
    expect(repo.git('show', 'HEAD:README.md').stdout).toBe('# edited by hand\n');
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: An ignored file is never committed
  it('an ignored untracked file is never named and never committed', () => {
    const repo = attached({ settings: BOTH });
    repo.write('.gitignore', 'secret.env\n');
    repo.commitAll('ignore');
    repo.write('secret.env', 'TOKEN=x\n');
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record.observations.untracked).toEqual([]);
    runStep(repo, record);
    expect(repo.git('show', '--name-only', '--format=', 'HEAD').stdout.trim().split('\n')).toEqual(['README.md']);
    expect(headTree(repo)).not.toContain('secret.env');
    expect(repo.exists('secret.env')).toBe(true);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: A tracked file matching an ignore rule is committed
  it('a tracked file matching an ignore rule is committed when modified', () => {
    const repo = attached({ settings: BOTH });
    repo.write('build.log', 'one\n');
    repo.commitAll('a tracked log');
    repo.write('.gitignore', '*.log\n');
    repo.commitAll('ignore logs');
    repo.write('build.log', 'two\n');
    const { record } = commit(repo);
    expect(steps(record)).toEqual(['stage', 'commit', 'push']);
    runStep(repo, record);
    expect(repo.git('show', '--name-only', '--format=', 'HEAD').stdout.trim()).toBe('build.log');
    expect(porcelain(repo)).toBe('');
  });

  it('a path already staged is committed with the rest', () => {
    const repo = attached({ settings: 'commit: true\n' });
    repo.write('staged.txt', 'staged\n');
    repo.git('add', 'staged.txt');
    repo.write('README.md', '# unstaged\n');
    const { record } = commit(repo);
    runStep(repo, record);
    expect(repo.git('show', '--name-only', '--format=', 'HEAD').stdout.trim().split('\n').sort()).toEqual(['README.md', 'staged.txt']);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: The message file never lands in the commit
  it('the message file, written outside the tree, never lands in the commit', () => {
    const repo = attached({ settings: BOTH });
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    runStep(repo, record, 'Walk: add-thing — three findings resolved');
    expect(headTree(repo).filter((p) => p.includes('commit-msg'))).toEqual([]);
    expect(repo.git('log', '-1', '--format=%s').stdout.trim()).toBe('Walk: add-thing — three findings resolved');
    expect(porcelain(repo)).toBe('');
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: A clean tree with nothing to push prints no segment
  it('a clean tree with nothing to push: proceed, no segment', () => {
    const repo = attached({ settings: BOTH });
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'proceed', reason: null, degraded: null, segments: [] });
    expect(record.observations).toMatchObject({ unpushed: 0, untracked: [] });
  });

  it('push granted with no remote-tracking ref for the branch prints the push', () => {
    const repo = attached({ settings: 'push: true\n' });
    repo.git('update-ref', '-d', `refs/remotes/origin/${NAME}`);
    const { record } = commit(repo);
    expect(record.observations.unpushed).toBeNull();
    expect(steps(record)).toEqual(['push']);
    runSegments(repo, record);
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));
  });
});

describe('commit — the push destination and the resolution', () => {
  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: The push goes to the resolved remote, set as upstream
  it('pushes to the resolved remote, measured against its ref, never the configured upstream', () => {
    const repo = attached({ settings: 'push: true\n' });
    const forkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-pr-fork-'));
    extraCleanups.push(() => fs.rmSync(forkDir, { recursive: true, force: true }));
    spawnSync(REAL_GIT, ['init', '-q', '--bare', forkDir]);
    const forkUrl = 'https://github.com/someone/widget-fork.git';
    repo.git('config', `url.${forkDir}.insteadOf`, forkUrl);
    repo.git('remote', 'add', 'fork', forkUrl);
    repo.write('local.txt', 'ahead of origin\n');
    repo.commitAll('ahead');
    // The configured upstream is the fork, and the fork already has HEAD.
    repo.git('push', '-q', '-u', 'fork', NAME);
    expect(repo.git('rev-list', '--count', '@{u}..HEAD').stdout.trim()).toBe('0');

    const { record } = commit(repo);
    expect(record.observations).toMatchObject({ resolution: { remote: 'origin' }, unpushed: 1 });
    expect(record.segments).toEqual([{ inputs: [], steps: [{ step: 'push', argv: ['git', 'push', '-u', 'origin', NAME] }] }]);
    runSegments(repo, record);
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));
    expect(repo.git('rev-parse', '--abbrev-ref', '@{u}').stdout.trim()).toBe(`origin/${NAME}`);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: No gh is needed to commit and push
  it('no gh on PATH: proceed with the stage, the commit and the push, and no gh call', () => {
    const repo = attached({ settings: BOTH, gh: 'absent' });
    repo.write('README.md', '# modified\n');
    const { record, calls } = commit(repo);
    expect(record).toMatchObject({ action: 'proceed', reason: null, degraded: null });
    expect(record.observations).toMatchObject({ resolution: { gh: 'absent', remote: 'origin' } });
    expect(steps(record)).toEqual(['stage', 'commit', 'push']);
    expect(calls.gh).toEqual([]);
    runStep(repo, record);
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: No remote drops the push and keeps the commit
  it('no remote: proceed degraded, the stage and the commit, no push', () => {
    const repo = attached({ settings: BOTH, remote: 'none' });
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: 'no-remote' } });
    expect(steps(record)).toEqual(['stage', 'commit']);
    runStep(repo, record);
    expect(porcelain(repo)).toBe('');
  });

  it('no remote with only push granted: degraded, no segment', () => {
    const repo = attached({ settings: 'push: true\n', remote: 'none' });
    repo.write('README.md', '# modified\n');
    const { record } = commit(repo);
    expect(record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: 'no-remote' }, segments: [] });
  });
});

/**
 * Leave `op` stopped on a conflict in README.md: a commit on a side branch the attached branch's own edit conflicts
 * with (`merge`, `cherry-pick`), or the attached branch's own commit reverted under a later edit (`revert`).
 */
function conflict(repo: Repo, op: 'merge' | 'cherry-pick' | 'revert'): void {
  const base = rev(repo, 'HEAD');
  if (op === 'revert') {
    repo.write('README.md', '# first\n');
    repo.commitAll('first');
    const first = rev(repo, 'HEAD');
    repo.write('README.md', '# second\n');
    repo.commitAll('second');
    repo.git('revert', '--no-edit', first);
  } else {
    repo.git('switch', '-q', '-c', 'side', base);
    repo.write('README.md', '# side\n');
    repo.commitAll('side');
    const side = rev(repo, 'HEAD');
    repo.git('switch', '-q', NAME);
    repo.write('README.md', '# ours\n');
    repo.commitAll('ours');
    if (op === 'merge') repo.git('merge', '--no-edit', 'side');
    else repo.git('cherry-pick', side);
  }
  expect(fs.existsSync(path.join(repo.dir, '.git', op === 'merge' ? 'MERGE_HEAD' : op === 'revert' ? 'REVERT_HEAD' : 'CHERRY_PICK_HEAD'))).toBe(true);
}
