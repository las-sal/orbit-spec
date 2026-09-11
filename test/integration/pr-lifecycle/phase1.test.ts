/**
 * D6 phase-1 preconditions, exercised against REAL git repositories with a `gh` stub.
 *
 * Scope and limits are documented in `harness.ts`. In short: this drives an executable
 * TRANSCRIPTION of the documented procedure, because the procedure itself is workflow-body
 * prose (zero engine git). It answers "are the documented steps performable against real
 * git, in the order given?" — the question that caught the switch-collision defect.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it, expect, afterEach } from 'vitest';
import { makeRepo, type Repo } from './harness.js';
import { runPhase1, canonicalRepoId } from './phase1.js';

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

function repoFor(opts: Parameters<typeof makeRepo>[0] = {}): Repo {
  const { repo, cleanup } = makeRepo(opts);
  cleanups.push(cleanup);
  return repo;
}

describe('D6 phase 1 — config resolution order', () => {
  it('pr: never probes NOTHING and says nothing (asserted against the gh log, not output text)', () => {
    const repo = repoFor();
    const res = runPhase1({ repo, mode: 'never', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toBeUndefined();
    // The promise `never` makes is silence — including no tooling probe.
    expect(repo.ghLog()).toEqual([]);
  });

  it('an active mode DOES probe, so the never case above is a real difference', () => {
    const repo = repoFor();
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('proceed');
    expect(repo.ghLog().length).toBeGreaterThan(0);
  });
});

describe('D6 phase 1 — remote and repository resolution', () => {
  it('uses a single remote whatever its name', () => {
    const repo = repoFor();
    repo.git('remote', 'rename', 'origin', 'upstream');
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('proceed');
    expect(res.remote).toBe('upstream');
  });

  it('skips with an ambiguity note when several remotes exist and none is origin', () => {
    const repo = repoFor({ remote: 'multiple' });
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/several remotes and no origin/);
    expect(res.note).toMatch(/never guesses/);
  });

  it('degrades to never when there is no remote at all', () => {
    const repo = repoFor({ remote: 'none' });
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/no git remote/);
  });

  it.each([
    ['https://github.com/acme/widget.git', 'acme/widget'],
    ['https://github.com/acme/widget', 'acme/widget'],
    ['git@github.com:acme/widget.git', 'acme/widget'],
    ['git@github.com:acme/widget', 'acme/widget'],
  ])('derives the canonical repo id from %s', (url, expected) => {
    expect(canonicalRepoId(url)).toBe(expected);
  });

  it('returns null for a non-GitHub remote URL (degradation, never a guess)', () => {
    expect(canonicalRepoId('https://gitlab.com/acme/widget.git')).toBeNull();
    expect(canonicalRepoId('/tmp/some/local/path.git')).toBeNull();
  });

  it('passes the repository POSITIONALLY on gh repo view — never --repo, which the real CLI rejects', () => {
    const repo = repoFor();
    runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    const view = repo.ghLog().find((i) => i.args[0] === 'repo');
    expect(view).toBeDefined();
    expect(view!.args).toEqual(['repo', 'view', 'acme/widget', '--json', 'defaultBranchRef']);
    expect(view!.args).not.toContain('--repo');
  });

  it('the gh stub rejects the flag form of repo view, so the wrong grammar can never pass again', () => {
    const repo = repoFor();
    const env = { ...process.env, PATH: `${repo.binDir}:${process.env.PATH}` };
    const bad = spawnSync('gh', ['repo', 'view', '--repo', 'acme/widget', '--json', 'defaultBranchRef'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('unknown flag: --repo');
    const good = spawnSync('gh', ['repo', 'view', 'acme/widget', '--json', 'defaultBranchRef'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(good.status).toBe(0);
    expect(JSON.parse(good.stdout).defaultBranchRef.name).toBe('main');
    // And the pr verbs are held to the contract in the other direction.
    const unq = spawnSync('gh', ['pr', 'list', '--head', 'x', '--state', 'open', '--json', 'url'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(unq.status).toBe(1);
  });

  it('falls back to symbolic-ref when gh repo view fails', () => {
    const repo = repoFor({ gh: { defaultBranch: null } });
    repo.git('remote', 'set-head', 'origin', 'main');
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('proceed');
    expect(res.defaultBranch).toBe('main');
  });

  it('skips when neither resolution method yields a default branch', () => {
    const repo = repoFor({ gh: { defaultBranch: null } });
    // No remote HEAD configured, so symbolic-ref fails too.
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/could not resolve the default branch/);
  });

  it('resolves a non-main default branch rather than assuming', () => {
    const repo = repoFor({ defaultBranch: 'trunk' });
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('proceed');
    expect(res.defaultBranch).toBe('trunk');
  });
});

describe('D6 phase 1 — name validity, collision, dirty tree', () => {
  it('skips a branch name git rejects, rather than transforming it', () => {
    const repo = repoFor();
    const res = runPhase1({ repo, mode: 'per-architecture', branch: 'my-program.lock' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/not a valid git branch name/);
    expect(res.note).toMatch(/rather than transformed/);
  });

  it('skips when the mechanical name collides with the default branch', () => {
    const repo = repoFor();
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'main' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/collides with the default branch/);
  });

  it('skips on a dirty tracked tree and creates nothing', () => {
    const repo = repoFor();
    repo.write('README.md', '# modified\n');
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/tracked modifications/);
    expect(repo.git('rev-parse', '--verify', '-q', 'refs/heads/add-thing').status).not.toBe(0);
  });

  it('proceeds past unrelated UNTRACKED paths but names them', () => {
    const repo = repoFor();
    repo.write('scratch.txt', 'notes\n');
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('proceed');
    expect(res.note).toMatch(/untracked path/);
    expect(repo.exists('scratch.txt')).toBe(true);
  });
});

describe('D6 phase 1 — the reuse path that the old ordering made impossible', () => {
  /**
   * The iteration-3 external review found this by reproducing it in a disposable repo: a
   * compatible per-proposal branch is DEFINED as carrying this change's artifact commits, so
   * it already tracks the paths generation would have written as untracked files. Under the
   * OLD ordering (generate, then switch) git refuses. Under the ratified ordering (select and
   * switch first) nothing untracked exists at switch time.
   */
  it('demonstrates the collision the OLD ordering hit: git refuses the switch', () => {
    const repo = repoFor();
    // A prior propose left the branch carrying the change's artifacts.
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('switch', '-q', 'main');

    // OLD ordering: generate FIRST, so the same paths are now untracked here.
    repo.write('orbit/changes/add-thing/proposal.md', '# regenerated\n');
    const sw = repo.git('switch', 'add-thing');

    expect(sw.status).not.toBe(0);
    expect(sw.stderr).toMatch(/would be overwritten|untracked working tree files/i);
  });

  it('the RATIFIED ordering succeeds on the same repository', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('switch', '-q', 'main');
    repo.git('push', '-q', 'origin', 'add-thing');

    // NEW ordering: phase 1 runs with nothing generated yet.
    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });

    expect(res.action).toBe('proceed');
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('add-thing');
  });

  it('reports a per-proposal branch carrying unrelated work as a collision', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('unrelated.md', 'someone else\n');
    repo.commitAll('unrelated feature work');
    repo.git('switch', '-q', 'main');

    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/unrelated work \(unrelated\.md\); collision/);
  });
});

describe('D6 phase 1 — program branch compatibility (merge-base, not tip ancestry)', () => {
  it('REUSES a program branch after the default branch has advanced', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'my-program');
    repo.write('orbit/changes/stage-one/proposal.md', '# one\n');
    repo.commitAll('stage one');
    repo.git('push', '-q', 'origin', 'my-program');
    repo.git('switch', '-q', 'main');

    // main advances underneath the long-lived program branch — the ordinary condition.
    repo.write('other.md', 'unrelated main work\n');
    repo.commitAll('advance main');
    repo.git('push', '-q', 'origin', 'main');

    const res = runPhase1({ repo, mode: 'per-architecture', branch: 'my-program' });

    // A tip-ancestry test would have REJECTED this; merge-base accepts it.
    expect(res.action).toBe('proceed');
    expect(res.aheadBy).toBe(1);
    expect(res.note).toMatch(/ahead by 1 commit/);
    expect(res.note).toMatch(/until you integrate/);
  });

  it('does NOT merge, rebase, or fast-forward the program branch when the base is ahead', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'my-program');
    repo.write('orbit/changes/stage-one/proposal.md', '# one\n');
    repo.commitAll('stage one');
    const tipBefore = repo.git('rev-parse', 'my-program').stdout.trim();
    repo.git('push', '-q', 'origin', 'my-program');
    repo.git('switch', '-q', 'main');
    repo.write('other.md', 'x\n');
    repo.commitAll('advance main');
    repo.git('push', '-q', 'origin', 'main');

    runPhase1({ repo, mode: 'per-architecture', branch: 'my-program' });

    expect(repo.git('rev-parse', 'my-program').stdout.trim()).toBe(tipBefore);
  });

  it('reports an unrelated-root branch as a collision', () => {
    const repo = repoFor();
    repo.git('checkout', '-q', '--orphan', 'my-program');
    repo.git('rm', '-rq', '--cached', '.');
    repo.write('alien.md', 'unrelated history\n');
    repo.commitAll('orphan root');
    repo.git('push', '-q', 'origin', 'my-program');
    repo.git('switch', '-q', 'main');

    const res = runPhase1({ repo, mode: 'per-architecture', branch: 'my-program' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/shares no ancestry|unrelated root/);
  });

  it('creates a local TRACKING branch when the program branch exists only on the remote', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'my-program');
    repo.write('orbit/changes/stage-one/proposal.md', '# one\n');
    repo.commitAll('stage one');
    repo.git('push', '-q', 'origin', 'my-program');
    repo.git('switch', '-q', 'main');
    // Simulate a fresh checkout: the local ref is gone, the remote ref remains.
    repo.git('branch', '-D', 'my-program');

    const res = runPhase1({ repo, mode: 'per-architecture', branch: 'my-program' });

    expect(res.action).toBe('proceed');
    expect(res.trackedFromRemote).toBe(true);
    // Tracking, not a divergent history: the branch points at the remote's commit.
    expect(repo.git('rev-parse', 'my-program').stdout.trim()).toBe(
      repo.git('rev-parse', 'origin/my-program').stdout.trim()
    );
  });
});

describe('D6 phase 1 — step 6, remote-ahead (fast-forward when possible, skip on divergence)', () => {
  it('fast-forwards a local branch that is strictly BEHIND the resolved remote tip', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    // The remote moves ahead (another checkout pushed): simulate by advancing and pushing,
    // then rewinding the local branch one commit.
    repo.write('orbit/changes/add-thing/design.md', '# design\n');
    repo.commitAll('add-thing design');
    repo.git('push', '-q', 'origin', 'add-thing');
    const remoteTip = repo.git('rev-parse', 'origin/add-thing').stdout.trim();
    repo.git('reset', '-q', '--hard', 'HEAD~1');
    repo.git('switch', '-q', 'main');

    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('proceed');
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('add-thing');
    expect(repo.git('rev-parse', 'HEAD').stdout.trim()).toBe(remoteTip);
  });

  it('SKIPS without switching when the local branch has DIVERGED from the remote tip', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    // Remote gains one commit; local gains a different one.
    repo.write('orbit/changes/add-thing/design.md', '# design (remote)\n');
    repo.commitAll('remote-side design');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('reset', '-q', '--hard', 'HEAD~1');
    repo.write('orbit/changes/add-thing/tasks.md', '# tasks (local)\n');
    repo.commitAll('local-side tasks');
    const localTip = repo.git('rev-parse', 'add-thing').stdout.trim();
    repo.git('switch', '-q', 'main');

    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/diverged/);
    expect(res.note).toMatch(/never force-moves/);
    // Nothing moved: HEAD stayed on main and the user's branch is untouched.
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('main');
    expect(repo.git('rev-parse', 'add-thing').stdout.trim()).toBe(localTip);
  });
});

describe('D6 commit isolation (external iter 3): the documented recipe leaves pre-staged unrelated entries out and staged', () => {
  it('git add <paths> && git commit --only <paths> excludes a pre-staged unrelated file and keeps it staged', () => {
    const repo = repoFor();
    // The user had something staged before the seam ran.
    repo.write('unrelated-staged.txt', 'not mine to publish\n');
    repo.git('add', 'unrelated-staged.txt');
    // The seam's enumerated set.
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.git('add', 'orbit/changes/add-thing/proposal.md');
    const commit = repo.git('commit', '-q', '--only', 'orbit/changes/add-thing/proposal.md', '-m', 'add-thing artifacts');
    expect(commit.status).toBe(0);
    const inCommit = repo.git('show', '--name-only', '--format=', 'HEAD').stdout.split('\n').filter(Boolean);
    expect(inCommit).toEqual(['orbit/changes/add-thing/proposal.md']);
    // The unrelated entry is still staged — untouched, not published.
    expect(repo.git('diff', '--cached', '--name-only').stdout.trim()).toBe('unrelated-staged.txt');
  });
});

describe('D6 phase 1 — step 6 resolves the EFFECTIVE tip before the checks (external iter 3)', () => {
  it('SKIPS when the remote tip would rewrite an exploration that HEAD and the local branch agree on', () => {
    const repo = repoFor();
    // Exploration v1 committed on main; branch cut from it (so local branch == HEAD content).
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v1\n');
    repo.commitAll('exploration v1');
    repo.git('push', '-q', 'origin', 'main');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.git('push', '-q', 'origin', 'add-thing');
    // The REMOTE tip of the branch changes the exploration (another checkout pushed).
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v2 (remote)\n');
    repo.commitAll('remote-side exploration');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('reset', '-q', '--hard', 'HEAD~1'); // local branch back to v1 == main
    repo.git('switch', '-q', 'main');

    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing', stagingDir: 'orbit/explore/add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/absent or different on origin\/add-thing/);
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('main');
    expect(fs.readFileSync(path.join(repo.dir, 'orbit/explore/add-thing/explore.md'), 'utf-8')).toContain('v1');
  });

  it('SKIPS as a collision when the remote tip carries a FOREIGN path the local branch does not', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.write('unrelated.md', 'someone else, on the remote\n');
    repo.commitAll('remote-side unrelated');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('reset', '-q', '--hard', 'HEAD~1'); // local is strictly behind, and clean of it
    repo.git('switch', '-q', 'main');

    const res = runPhase1({ repo, mode: 'per-proposal', branch: 'add-thing' });
    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/unrelated work \(unrelated\.md\); collision/);
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('main');
    expect(repo.exists('unrelated.md')).toBe(false);
  });
});

describe('D6 phase 1 — the generation-input precondition', () => {
  it('does NOT switch when the switch would delete the consume-mode exploration', () => {
    const repo = repoFor();
    // The branch exists on the base's history and does NOT carry the exploration.
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');

    // The exploration is COMMITTED here — invisible to the dirty-tree check.
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    repo.commitAll('exploration');

    const res = runPhase1({
      repo,
      mode: 'per-proposal',
      branch: 'add-thing',
      stagingDir: 'orbit/explore/add-thing',
    });

    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/switching would delete or rewrite the exploration/);
    // The whole point: nothing was destroyed and HEAD never moved.
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('main');
  });

  it('an UNTRACKED exploration (the ordinary explore-then-propose state) does NOT trigger the skip on the REUSE path', () => {
    const repo = repoFor();
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');

    // /orbit:explore commits nothing: the staging dir is present but untracked.
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    expect(repo.git('ls-files', '--error-unmatch', 'orbit/explore/add-thing').status).not.toBe(0);

    const res = runPhase1({
      repo,
      mode: 'per-proposal',
      branch: 'add-thing',
      stagingDir: 'orbit/explore/add-thing',
    });

    expect(res.action).toBe('proceed');
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('add-thing');
    // git switch rewrites only tracked paths: the exploration survived the switch intact.
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
  });

  it('an UNTRACKED exploration does NOT trigger the skip on the CREATE path either', () => {
    const repo = repoFor();
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');

    const res = runPhase1({
      repo,
      mode: 'per-proposal',
      branch: 'add-thing',
      stagingDir: 'orbit/explore/add-thing',
    });

    expect(res.action).toBe('proceed');
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('add-thing');
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
  });

  it('a TRACKED exploration that exists on the target with DIFFERENT content is a skip (the switch would silently rewrite it)', () => {
    const repo = repoFor();
    // The target branch carries an OLDER version of the exploration.
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v1\n');
    repo.commitAll('exploration v1');
    repo.git('push', '-q', 'origin', 'main');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');
    // main moved on: the exploration was revised and committed here.
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v2\n');
    repo.commitAll('exploration v2');

    const res = runPhase1({
      repo,
      mode: 'per-proposal',
      branch: 'add-thing',
      stagingDir: 'orbit/explore/add-thing',
    });

    expect(res.action).toBe('skip');
    expect(res.note).toMatch(/absent or different/);
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim()).toBe('main');
    expect(fs.readFileSync(path.join(repo.dir, 'orbit/explore/add-thing/explore.md'), 'utf-8')).toContain('v2');
  });

  it('proceeds when the staging directory survives the target ref', () => {
    const repo = repoFor();
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    repo.commitAll('exploration on main');
    repo.git('push', '-q', 'origin', 'main');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');

    const res = runPhase1({
      repo,
      mode: 'per-proposal',
      branch: 'add-thing',
      stagingDir: 'orbit/explore/add-thing',
    });

    expect(res.action).toBe('proceed');
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
  });

  it('is not covered by the dirty-tree guard — the hazard is COMMITTED content', () => {
    const repo = repoFor();
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    repo.commitAll('exploration');
    // Committed, so the tree is clean: the dirty check would have waved this through.
    expect(repo.git('status', '--porcelain').stdout.trim()).toBe('');
  });
});
