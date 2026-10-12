/**
 * `orbit pr select` against REAL git repositories with a bare remote and the contract-validated
 * `gh` stub (rc12-engine-owned-choreography). These are D6's phase-1 cases (`phase1.test.ts`,
 * retired), moved onto the engine: each `proceed` case EXECUTES the printed segment, because
 * prose — or a printed command — can be coherent and still impossible, and only execution
 * distinguishes the two (the iteration-3 lesson the harness exists for). Every engine call's
 * `git` and `gh` invocations are held to the read-only allowlist by `engine()`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';
import { PrUsageError } from '../../../src/core/pr/record.js';
import { canonicalRepoId } from '../../../src/core/pr/resolve.js';
import { prSelect } from '../../../src/core/pr/select.js';
import type { Repo } from '../../integration/pr-lifecycle/harness.js';
import { ctxFor, engine, runSegments } from '../../integration/pr-lifecycle/instrument.js';
import { branchExists, change, orbitRepo, stage } from './fixtures.js';

function select(repo: Repo, name: string) {
  return engine(repo, (ctx) => prSelect(ctx, name));
}

/** Select, then run the printed segment; the case then asserts the state the steps promised. */
function selectAndRun(repo: Repo, name: string) {
  const out = select(repo, name);
  expect(out.record.action).toBe('proceed');
  runSegments(repo, out.record);
  return out;
}

describe('select — the gate: config FIRST, availability SECOND', () => {
  // @scenario behaviour orbit-pr-lifecycle :: The `orbit pr` command observes and prints; it never writes :: A closed gate probes nothing
  it('pr: never is off: no reason, no segments, and no git or gh call at all', () => {
    const repo = orbitRepo('never');
    const { record, calls } = select(repo, 'add-thing');
    expect(record).toEqual({
      subcommand: 'select',
      action: 'off',
      reason: null,
      degraded: null,
      observations: {},
      segments: [],
      human_acts: [],
    });
    expect(calls).toEqual({ git: [], gh: [] });
  });

  it('an active mode DOES probe, so the never case above is a real difference', () => {
    const repo = orbitRepo('per-proposal');
    const { record, calls } = selectAndRun(repo, 'add-thing');
    expect(record.action).toBe('proceed');
    expect(calls.gh.length).toBeGreaterThan(0);
    expect(calls.git.length).toBeGreaterThan(0);
  });
});

describe('select — remote and repository resolution', () => {
  it('uses a single remote whatever its name', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('remote', 'rename', 'origin', 'upstream');
    const { record } = selectAndRun(repo, 'add-thing');
    expect((record.observations.resolution as { remote: string }).remote).toBe('upstream');
  });

  it('skips naming the candidates when several remotes exist and none is origin', () => {
    const repo = orbitRepo('per-proposal', { remote: 'multiple' });
    const { record } = select(repo, 'add-thing');
    expect(record.action).toBe('skip');
    expect(record.reason).toEqual({ code: 'several-remotes', detail: { candidates: ['fork', 'upstream'] } });
  });

  // @scenario behaviour orbit-pr-lifecycle :: The `orbit pr` command observes and prints; it never writes :: An absent gh is its own fact
  it('gh genuinely absent from PATH is its own code, before any branch work — even with a resolvable remote HEAD', () => {
    const repo = orbitRepo('per-proposal', { gh: 'absent' });
    repo.git('remote', 'set-head', 'origin', 'main'); // the symbolic-ref fallback WOULD resolve
    const { record } = select(repo, 'add-thing');
    expect(record.action).toBe('skip');
    expect(record.reason?.code).toBe('gh-absent');
    expect((record.observations.resolution as { gh: string }).gh).toBe('absent');
    expect(repo.head()).toBe('main');
    expect(branchExists(repo, 'add-thing')).toBe(false);
  });

  it('no remote at all is its own code', () => {
    const repo = orbitRepo('per-proposal', { remote: 'none' });
    const { record } = select(repo, 'add-thing');
    expect(record.action).toBe('skip');
    expect(record.reason?.code).toBe('no-remote');
  });

  it.each([
    ['https://github.com/acme/widget.git', 'acme/widget'],
    ['https://github.com/acme/widget', 'acme/widget'],
    ['git@github.com:acme/widget.git', 'acme/widget'],
    ['git@github.com:acme/widget', 'acme/widget'],
  ])('derives the canonical repo id from %s', (url, expected) => {
    expect(canonicalRepoId(url)).toBe(expected);
  });

  it('returns null for a non-GitHub remote URL, and select skips on it (degradation, never a guess)', () => {
    expect(canonicalRepoId('https://gitlab.com/acme/widget.git')).toBeNull();
    expect(canonicalRepoId('/tmp/some/local/path.git')).toBeNull();
    const repo = orbitRepo('per-proposal', { remoteUrl: 'https://gitlab.com/acme/widget.git' });
    const { record } = select(repo, 'add-thing');
    expect(record.reason).toEqual({
      code: 'unparseable-url',
      detail: { remote: 'origin', url: 'https://gitlab.com/acme/widget.git' },
    });
  });

  it('reads the CONFIGURED url, never the insteadOf-expanded one, so a rewritten checkout still resolves', () => {
    const repo = orbitRepo('per-proposal', { remoteUrlStyle: 'ssh' });
    // `remote get-url` returns the rewrite's target — a local path, which would not parse.
    expect(repo.git('remote', 'get-url', 'origin').stdout.trim()).not.toMatch(/github/);
    const { record } = select(repo, 'add-thing');
    expect((record.observations.resolution as { repo: string }).repo).toBe('acme/widget');
  });

  it('passes the repository POSITIONALLY on gh repo view — never --repo, which the real CLI rejects', () => {
    const repo = orbitRepo('per-proposal');
    const { calls } = select(repo, 'add-thing');
    const view = calls.gh.find((i) => i.args[0] === 'repo');
    expect(view!.args).toEqual(['repo', 'view', 'acme/widget', '--json', 'defaultBranchRef']);
    // Availability is a PATH lookup: `gh --version` never ran.
    expect(calls.gh.some((i) => i.args[0] === '--version')).toBe(false);
  });

  // @scenario behaviour orbit-pr-lifecycle :: Test instruments derive from a recorded real-CLI contract :: The stub rejects what the real CLI rejects, with the real message
  // @scenario behaviour orbit-pr-lifecycle :: Test instruments derive from a recorded real-CLI contract :: The selector rule is enforced from the contract
  it('the gh stub rejects the flag form of repo view, so the wrong grammar can never pass again', () => {
    const repo = orbitRepo('per-proposal');
    const env = repo.env();
    const bad = spawnSync('gh', ['repo', 'view', '--repo', 'acme/widget', '--json', 'defaultBranchRef'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('unknown flag: --repo');
    const good = spawnSync('gh', ['repo', 'view', 'acme/widget', '--json', 'defaultBranchRef'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(good.status).toBe(0);
    expect(JSON.parse(good.stdout).defaultBranchRef.name).toBe('main');
    const unq = spawnSync('gh', ['pr', 'list', '--head', 'x', '--state', 'open', '--json', 'url'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(unq.status).toBe(1);
    expect(unq.stderr).toContain('must carry --repo');
    const unpos = spawnSync('gh', ['repo', 'view', '--json', 'defaultBranchRef'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(unpos.status).toBe(1);
    expect(unpos.stderr).toContain('requires a positional');
    const nosel = spawnSync('gh', ['pr', 'view', '--repo', 'acme/widget', '--json', 'isDraft'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(nosel.status).toBe(1);
    expect(nosel.stderr).toContain('argument required when using the --repo flag');
    const probe = spawnSync('gh', ['--version'], { cwd: repo.dir, encoding: 'utf-8', env });
    expect(probe.status).toBe(0);
    expect(probe.stdout).toMatch(/^gh version \d/);
  });

  it('falls back to symbolic-ref when gh repo view fails', () => {
    const repo = orbitRepo('per-proposal', { gh: { defaultBranch: null } });
    repo.git('remote', 'set-head', 'origin', 'main');
    const { record } = selectAndRun(repo, 'add-thing');
    expect((record.observations.resolution as { default_branch: string }).default_branch).toBe('main');
  });

  it('skips when neither resolution method yields a default branch', () => {
    const repo = orbitRepo('per-proposal', { gh: { defaultBranch: null } });
    const { record } = select(repo, 'add-thing');
    expect(record.action).toBe('skip');
    expect(record.reason?.code).toBe('no-default-branch');
  });

  it('resolves a non-main default branch rather than assuming', () => {
    const repo = orbitRepo('per-proposal', { defaultBranch: 'trunk' });
    const { record } = selectAndRun(repo, 'add-thing');
    expect((record.observations.resolution as { default_branch: string }).default_branch).toBe('trunk');
    expect(repo.git('merge-base', '--is-ancestor', 'origin/trunk', 'add-thing').status).toBe(0);
  });
});

describe('select — the inputs table (no change directory needed)', () => {
  it('an invalid name is the one usage error', () => {
    const repo = orbitRepo('per-proposal');
    expect(() => prSelect(ctxFor(repo), 'Not_A_Name')).toThrow(PrUsageError);
  });

  it('a standalone name (no staging dir, no change) is uncited and per-proposal', () => {
    const repo = orbitRepo('per-architecture');
    const { record } = selectAndRun(repo, 'add-thing');
    expect(record.observations).toMatchObject({ consume_mode: false, citation: null, branch: 'add-thing', granularity: 'per-proposal' });
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr select` computes propose's branch selection :: A staging-only cited exploration selects the program branch
  it('a staging-only cited exploration selects the program branch, and the guard runs against that staging dir', () => {
    const repo = orbitRepo('per-architecture');
    stage(repo, 'stage-two', 'my-program');
    const { record } = selectAndRun(repo, 'stage-two');
    expect(record.observations).toMatchObject({
      consume_mode: true,
      staging_dir: 'orbit/explore/stage-two',
      citation: 'my-program',
      citation_from: 'orbit/explore/stage-two',
      branch: 'my-program',
      granularity: 'per-architecture',
    });
    expect(repo.head()).toBe('my-program');

    // The guard reads THAT directory: tracked here and absent on the target is a skip.
    const repo2 = orbitRepo('per-architecture');
    repo2.git('push', '-q', 'origin', 'main:my-program');
    stage(repo2, 'stage-two', 'my-program');
    repo2.commitAll('exploration committed');
    const { record: r2 } = select(repo2, 'stage-two');
    expect(r2.reason).toEqual({
      code: 'generation-input',
      detail: { staging_dir: 'orbit/explore/stage-two', target: 'origin/my-program' },
    });
  });

  it('an active change of that name supplies its citation, and is not consume mode', () => {
    const repo = orbitRepo('per-architecture');
    change(repo, 'stage-two', 'my-program');
    repo.commitAll('the change, generated');
    repo.git('push', '-q', 'origin', 'main');
    const { record } = selectAndRun(repo, 'stage-two');
    expect(record.observations).toMatchObject({ consume_mode: false, citation: 'my-program', citation_from: 'orbit/changes/stage-two', branch: 'my-program' });
  });

  it('a citation under per-proposal does not select the program branch', () => {
    const repo = orbitRepo('per-proposal');
    stage(repo, 'stage-two', 'my-program');
    const { record } = selectAndRun(repo, 'stage-two');
    expect(record.observations).toMatchObject({ branch: 'stage-two', granularity: 'per-proposal' });
  });
});

describe('select — name validity, collision, dirty tree', () => {
  it('skips a branch name git rejects, rather than transforming it', () => {
    const repo = orbitRepo('per-architecture');
    stage(repo, 'stage-two', 'my-program.lock');
    const { record } = select(repo, 'stage-two');
    expect(record.reason).toEqual({ code: 'invalid-branch-name', detail: { branch: 'my-program.lock' } });
  });

  it('skips when the mechanical name collides with the default branch', () => {
    const repo = orbitRepo('per-proposal');
    const { record } = select(repo, 'main');
    expect(record.reason).toEqual({ code: 'default-collision', detail: { branch: 'main', default_branch: 'main' } });
  });

  it('skips on a dirty tracked tree and creates nothing', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('README.md', '# modified\n');
    const { record } = select(repo, 'add-thing');
    expect(record.reason).toEqual({ code: 'dirty-tree', detail: { paths: ['README.md'] } });
    expect(branchExists(repo, 'add-thing')).toBe(false);
  });

  it('proceeds past unrelated UNTRACKED paths but names them', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('scratch.txt', 'notes\n');
    const { record } = selectAndRun(repo, 'add-thing');
    expect(record.observations.untracked).toEqual(['scratch.txt']);
    expect(repo.exists('scratch.txt')).toBe(true);
  });
});

describe('select — writes are printed, never run', () => {
  // @scenario behaviour orbit-pr-lifecycle :: The `orbit pr` command observes and prints; it never writes :: Writes are printed, never run
  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr select` computes propose's branch selection :: A branch absent everywhere is created off the remote default, untracked
  it('a branch absent everywhere: nothing created by select; the printed step bases it on the remote default with --no-track', () => {
    const repo = orbitRepo('per-proposal');
    // The local default ref is STALE: the remote has moved on.
    repo.write('other.md', 'x\n');
    repo.commitAll('advance');
    repo.git('push', '-q', 'origin', 'main');
    repo.git('reset', '-q', '--hard', 'HEAD~1');
    const remoteTip = repo.git('rev-parse', 'origin/main').stdout.trim();
    repo.git('update-ref', 'refs/remotes/origin/main', 'HEAD'); // and the tracking ref stale too

    const { record } = select(repo, 'add-thing');
    expect(branchExists(repo, 'add-thing')).toBe(false);
    expect(repo.head()).toBe('main');
    expect(record.observations.branch_state).toBe('absent');
    expect(record.segments).toEqual([
      { inputs: [], steps: [{ step: 'create', argv: ['git', 'switch', '-c', 'add-thing', '--no-track', 'origin/main'] }] },
    ]);

    runSegments(repo, record);
    expect(repo.head()).toBe('add-thing');
    expect(repo.git('rev-parse', 'HEAD').stdout.trim()).toBe(remoteTip);
    // Untracked at creation: the publish push sets the upstream.
    expect(repo.git('config', '--get', 'branch.add-thing.merge').status).not.toBe(0);
  });

  // @scenario behaviour orbit-pr-lifecycle :: The `orbit pr` command observes and prints; it never writes :: A configured fetch refspec cannot move a local branch
  it('a configured refs/heads/ fetch refspec and remote tags move nothing but the two remote-tracking refs', () => {
    const repo = orbitRepo('per-proposal');
    // A hostile configuration: fetch would write into refs/heads/, and the remote carries tags.
    repo.git('config', '--add', 'remote.origin.fetch', '+refs/heads/*:refs/heads/mirror-*');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# p\n');
    repo.commitAll('artifacts');
    repo.git('tag', 'v-remote');
    repo.git('push', '-q', 'origin', 'add-thing', 'v-remote');
    repo.git('tag', '-d', 'v-remote');
    repo.git('switch', '-q', 'main');
    repo.git('branch', '-q', '-D', 'add-thing');
    repo.git('update-ref', '-d', 'refs/remotes/origin/add-thing');
    const refsBefore = repo.git('for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/tags').stdout;

    const { record, calls } = select(repo, 'add-thing');
    expect(record.observations.branch_state).toBe('remote-only');
    expect(repo.git('for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/tags').stdout).toBe(refsBefore);
    expect(repo.git('rev-parse', '--verify', '-q', 'refs/remotes/origin/add-thing').status).toBe(0);
    const fetches = calls.git.filter((c) => c.args[0] === 'fetch');
    expect(fetches).toEqual([
      { args: ['fetch', '--no-tags', '--refmap=', 'origin', '+refs/heads/add-thing:refs/remotes/origin/add-thing', '+refs/heads/main:refs/remotes/origin/main'] },
    ]);
  });
});

describe('select — the reuse path that the old ordering made impossible', () => {
  /**
   * The iteration-3 external review found this by reproducing it in a disposable repo: a
   * compatible per-proposal branch is DEFINED as carrying this change's artifact commits, so it
   * already tracks the paths generation would have written as untracked files. Under the OLD
   * ordering (generate, then switch) git refuses. Under the ratified ordering (select and switch
   * first) nothing untracked exists at switch time.
   */
  it('demonstrates the collision the OLD ordering hit: git refuses the switch', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('switch', '-q', 'main');
    repo.write('orbit/changes/add-thing/proposal.md', '# regenerated\n');
    const sw = repo.git('switch', 'add-thing');
    expect(sw.status).not.toBe(0);
    expect(sw.stderr).toMatch(/would be overwritten|untracked working tree files/i);
  });

  it('the RATIFIED ordering: select prints the switch and it succeeds on the same repository', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('switch', '-q', 'main');
    repo.git('push', '-q', 'origin', 'add-thing');
    const { record } = selectAndRun(repo, 'add-thing');
    expect(record.observations.branch_state).toBe('local');
    expect(repo.head()).toBe('add-thing');
  });

  it('a same-named per-proposal branch with NO merge base is a collision, never an empty compatible diff', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '--orphan', 'add-thing');
    repo.write('foreign.txt', 'unrelated history\n');
    repo.commitAll('unrelated root');
    repo.git('switch', '-q', 'main');
    const { record } = select(repo, 'add-thing');
    expect(record.reason).toEqual({ code: 'collision', detail: { branch: 'add-thing', kind: 'no-merge-base' } });
    expect(repo.head()).toBe('main');
    expect(repo.exists('foreign.txt')).toBe(false);
  });

  it('a per-proposal branch carrying unrelated work is a collision naming the foreign path', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('unrelated.md', 'someone else\n');
    repo.commitAll('unrelated feature work');
    repo.git('switch', '-q', 'main');
    const { record } = select(repo, 'add-thing');
    expect(record.reason).toEqual({ code: 'collision', detail: { branch: 'add-thing', kind: 'foreign-path', path: 'unrelated.md' } });
  });
});

describe('select — program branch compatibility (merge-base, not tip ancestry)', () => {
  function programBranch(repo: Repo): string {
    repo.git('switch', '-q', '-c', 'my-program');
    repo.write('orbit/changes/stage-one/proposal.md', '# one\n');
    repo.commitAll('stage one');
    const tip = repo.git('rev-parse', 'HEAD').stdout.trim();
    repo.git('push', '-q', 'origin', 'my-program');
    repo.git('switch', '-q', 'main');
    return tip;
  }

  it('REUSES a program branch after the default branch has advanced, reporting ahead_by', () => {
    const repo = orbitRepo('per-architecture');
    programBranch(repo);
    repo.write('other.md', 'unrelated main work\n');
    repo.commitAll('advance main');
    repo.git('push', '-q', 'origin', 'main');
    stage(repo, 'stage-two', 'my-program');
    const { record } = selectAndRun(repo, 'stage-two');
    expect(record.observations).toMatchObject({ branch_state: 'local', ahead_by: 1 });
    expect(repo.head()).toBe('my-program');
  });

  it('does NOT merge, rebase, or fast-forward the program branch when the base is ahead', () => {
    const repo = orbitRepo('per-architecture');
    const tipBefore = programBranch(repo);
    repo.write('other.md', 'x\n');
    repo.commitAll('advance main');
    repo.git('push', '-q', 'origin', 'main');
    stage(repo, 'stage-two', 'my-program');
    selectAndRun(repo, 'stage-two');
    expect(repo.git('rev-parse', 'my-program').stdout.trim()).toBe(tipBefore);
  });

  it('an unrelated-root program branch is a collision', () => {
    const repo = orbitRepo('per-architecture');
    repo.git('checkout', '-q', '--orphan', 'my-program');
    repo.git('rm', '-rq', '--cached', '.');
    repo.write('alien.md', 'unrelated history\n');
    repo.git('add', 'alien.md');
    repo.git('commit', '-q', '-m', 'orphan root');
    repo.git('push', '-q', 'origin', 'my-program');
    repo.git('clean', '-qfd');
    repo.git('switch', '-q', '-f', 'main');
    stage(repo, 'stage-two', 'my-program');
    const { record } = select(repo, 'stage-two');
    expect(record.reason).toEqual({ code: 'collision', detail: { branch: 'my-program', kind: 'unrelated-root' } });
  });

  it('a program branch existing only on the remote prints a TRACKING create', () => {
    const repo = orbitRepo('per-architecture');
    programBranch(repo);
    repo.git('branch', '-q', '-D', 'my-program');
    stage(repo, 'stage-two', 'my-program');
    const { record } = selectAndRun(repo, 'stage-two');
    expect(record.observations.branch_state).toBe('remote-only');
    expect(record.segments[0].steps[0].argv).toEqual(['git', 'switch', '-c', 'my-program', '--track', 'origin/my-program']);
    expect(repo.git('rev-parse', 'my-program').stdout.trim()).toBe(repo.git('rev-parse', 'origin/my-program').stdout.trim());
    expect(repo.git('config', '--get', 'branch.my-program.merge').stdout.trim()).toBe('refs/heads/my-program');
  });
});

describe('select — step 6, remote-ahead (fast-forward when possible, skip on divergence)', () => {
  it('a local branch strictly BEHIND the remote tip prints switch + ff-only, and the run lands on the remote tip', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.write('orbit/changes/add-thing/design.md', '# design\n');
    repo.commitAll('add-thing design');
    repo.git('push', '-q', 'origin', 'add-thing');
    const remoteTip = repo.git('rev-parse', 'origin/add-thing').stdout.trim();
    repo.git('reset', '-q', '--hard', 'HEAD~1');
    repo.git('switch', '-q', 'main');

    const { record } = selectAndRun(repo, 'add-thing');
    expect(record.observations.branch_state).toBe('fast-forward');
    expect(record.segments[0].steps.map((s) => s.argv)).toEqual([
      ['git', 'switch', 'add-thing'],
      ['git', 'merge', '--ff-only', 'origin/add-thing'],
    ]);
    expect(repo.head()).toBe('add-thing');
    expect(repo.git('rev-parse', 'HEAD').stdout.trim()).toBe(remoteTip);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr select` computes propose's branch selection :: A diverged branch is a skip
  it('a local branch DIVERGED from the remote tip is a skip with no segments', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.write('orbit/changes/add-thing/design.md', '# design (remote)\n');
    repo.commitAll('remote-side design');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('reset', '-q', '--hard', 'HEAD~1');
    repo.write('orbit/changes/add-thing/tasks.md', '# tasks (local)\n');
    repo.commitAll('local-side tasks');
    const localTip = repo.git('rev-parse', 'add-thing').stdout.trim();
    repo.git('switch', '-q', 'main');

    const { record } = select(repo, 'add-thing');
    expect(record.action).toBe('skip');
    expect(record.reason).toEqual({ code: 'diverged', detail: { branch: 'add-thing', remote_ref: 'origin/add-thing' } });
    expect(record.segments).toEqual([]);
    expect(repo.head()).toBe('main');
    expect(repo.git('rev-parse', 'add-thing').stdout.trim()).toBe(localTip);
  });
});

describe('select — step 6 resolves the EFFECTIVE tip before the checks', () => {
  it('SKIPS when the remote tip would rewrite an exploration that HEAD and the local branch agree on', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v1\n');
    repo.commitAll('exploration v1');
    repo.git('push', '-q', 'origin', 'main');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v2 (remote)\n');
    repo.commitAll('remote-side exploration');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('reset', '-q', '--hard', 'HEAD~1');
    repo.git('switch', '-q', 'main');

    const { record } = select(repo, 'add-thing');
    expect(record.reason).toEqual({
      code: 'generation-input',
      detail: { staging_dir: 'orbit/explore/add-thing', target: 'origin/add-thing' },
    });
    expect(repo.head()).toBe('main');
    expect(repo.read('orbit/explore/add-thing/explore.md')).toContain('v1');
  });

  it('SKIPS as a collision when the remote tip carries a FOREIGN path the local branch does not', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.write('unrelated.md', 'someone else, on the remote\n');
    repo.commitAll('remote-side unrelated');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('reset', '-q', '--hard', 'HEAD~1');
    repo.git('switch', '-q', 'main');

    const { record } = select(repo, 'add-thing');
    expect(record.reason).toEqual({ code: 'collision', detail: { branch: 'add-thing', kind: 'foreign-path', path: 'unrelated.md' } });
    expect(repo.head()).toBe('main');
    expect(repo.exists('unrelated.md')).toBe(false);
  });
});

describe('select — the generation-input precondition', () => {
  it('does NOT print a switch that would delete the consume-mode exploration', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    repo.commitAll('exploration');

    const { record } = select(repo, 'add-thing');
    expect(record.reason?.code).toBe('generation-input');
    expect(record.segments).toEqual([]);
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
    expect(repo.head()).toBe('main');
  });

  it('an UNTRACKED exploration (the ordinary state) does NOT trigger the skip on the REUSE path', () => {
    const repo = orbitRepo('per-proposal');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.commitAll('add-thing artifacts');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    expect(repo.git('ls-files', '--error-unmatch', 'orbit/explore/add-thing').status).not.toBe(0);

    const { record } = selectAndRun(repo, 'add-thing');
    expect(record.observations.consume_mode).toBe(true);
    expect(repo.head()).toBe('add-thing');
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
  });

  it('an UNTRACKED exploration does NOT trigger the skip on the CREATE path either', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    const { record } = selectAndRun(repo, 'add-thing');
    expect(record.observations.branch_state).toBe('absent');
    expect(repo.head()).toBe('add-thing');
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
  });

  it('a TRACKED exploration that exists on the target with DIFFERENT content is a skip', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v1\n');
    repo.commitAll('exploration v1');
    repo.git('push', '-q', 'origin', 'main');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration v2\n');
    repo.commitAll('exploration v2');

    const { record } = select(repo, 'add-thing');
    expect(record.reason?.code).toBe('generation-input');
    expect(repo.head()).toBe('main');
    expect(fs.readFileSync(path.join(repo.dir, 'orbit/explore/add-thing/explore.md'), 'utf-8')).toContain('v2');
  });

  it('proceeds when the staging directory survives the target ref', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    repo.commitAll('exploration on main');
    repo.git('push', '-q', 'origin', 'main');
    repo.git('switch', '-q', '-c', 'add-thing');
    repo.git('push', '-q', 'origin', 'add-thing');
    repo.git('switch', '-q', 'main');
    selectAndRun(repo, 'add-thing');
    expect(repo.exists('orbit/explore/add-thing/explore.md')).toBe(true);
  });

  it('is not covered by the dirty-tree guard — the hazard is COMMITTED content', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('orbit/explore/add-thing/explore.md', '# exploration\n');
    repo.commitAll('exploration');
    expect(repo.git('status', '--porcelain').stdout.trim()).toBe('');
  });
});
