/**
 * EXECUTABLE TRANSCRIPTION of the documented phase-1 procedure.
 *
 * This is a TEST FIXTURE, not engine code — `orbit-pr-lifecycle`'s zero-engine-git
 * requirement keeps the engine out of git, and nothing here is imported by `src/`. Each step
 * below transcribes a specific clause of the generated reference
 * (`references/pr-choreography.md`, built from `src/core/templates/workflows/pr-choreography.ts`),
 * cited inline so a reader can check the two against each other.
 *
 * Its purpose is narrow and worth stating: to run the documented steps against REAL git and
 * find the ones git will not perform. The prose can be internally coherent and still
 * impossible; only execution distinguishes those.
 */
import { spawnSync } from 'node:child_process';
import type { Repo } from './harness.js';

export type Granularity = 'per-proposal' | 'per-architecture';

export interface Phase1Input {
  repo: Repo;
  /** `never` | `per-proposal` | `per-architecture`, exactly as the config reader resolved it. */
  mode: 'never' | Granularity;
  /** The mechanical branch name: `<change-name>` or the doc's filename stem. */
  branch: string;
  /** Present when the change is in consume mode — the staging dir generation will read. */
  stagingDir?: string;
}

export interface Phase1Result {
  /** `proceed` = switched to the branch, ready for phase 2. `skip` = PR layer off, nothing written. */
  action: 'proceed' | 'skip';
  /** One-line note; every skip has one, and some proceeds do (ahead-by-N, untracked paths). */
  note?: string;
  branch?: string;
  remote?: string;
  repoId?: string;
  defaultBranch?: string;
  /** True when phase 1 created a local tracking branch from a remote-only ref. */
  trackedFromRemote?: boolean;
  /** N, when the default branch is ahead of the merge-base. */
  aheadBy?: number;
}

/** Config resolution order: config FIRST, availability SECOND. */
/**
 * Generation-input precondition (checked BEFORE the switch, on BOTH paths). Keys on TRACKED
 * state, never worktree presence: "when a consume-mode staging directory is TRACKED in HEAD,
 * verify the TARGET REF carries the same content — absent or different means the switch
 * would delete or rewrite the exploration → SKIP THE PR LAYER ENTIRELY." An UNTRACKED
 * staging directory (the ordinary explore-then-propose state) never triggers the skip:
 * `git switch` rewrites only tracked paths.
 */
function generationInputGuard(
  repo: Phase1Input['repo'],
  stagingDir: string | undefined,
  targetRef: string
): Phase1Result | null {
  if (!stagingDir) return null;
  const tracked = repo.git('ls-files', '--error-unmatch', stagingDir).status === 0;
  if (!tracked) return null;
  const same = repo.git('diff', '--quiet', 'HEAD', targetRef, '--', stagingDir).status === 0;
  if (same) return null;
  return {
    action: 'skip',
    note: `${stagingDir} is tracked here and absent or different on ${targetRef}; switching would delete or rewrite the exploration — PR layer skipped, generating on the current branch`,
  };
}

export function runPhase1(input: Phase1Input): Phase1Result {
  const { repo, mode, branch } = input;

  // "`never`, absent, or an inert value/shape → RETURN IMMEDIATELY. Probe nothing (no remote
  //  enumeration, no `gh`) and emit NO note."
  if (mode === 'never') return { action: 'skip' };

  // --- Remote resolution -----------------------------------------------------------------
  const remotes = repo
    .git('remote')
    .stdout.split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

  if (remotes.length === 0) {
    return { action: 'skip', note: 'no git remote; PR layer degraded to never for this invocation' };
  }
  let remote: string;
  if (remotes.length === 1) {
    remote = remotes[0]; // "use it, whatever its name"
  } else if (remotes.includes('origin')) {
    remote = 'origin';
  } else {
    return {
      action: 'skip',
      note: `several remotes and no origin (${remotes.join(', ')}); orbit never guesses which remote owns the PR`,
    };
  }

  // --- Canonical repository identifier ---------------------------------------------------
  const ghUrl = repo.git('config', `remote.${remote}.ghurl`).stdout.trim();
  const url = ghUrl || repo.git('remote', 'get-url', remote).stdout.trim();
  const repoId = canonicalRepoId(url);
  if (!repoId) {
    return { action: 'skip', note: `remote URL does not parse as a GitHub repository: ${url}` };
  }

  // --- Default branch --------------------------------------------------------------------
  const view = repo.git('rev-parse', '--git-dir'); // ensure repo is sane before shelling gh
  if (view.status !== 0) return { action: 'skip', note: 'not a git repository' };

  const defaultBranch = resolveDefaultBranch(repo, remote, repoId);
  if (!defaultBranch) {
    return { action: 'skip', note: 'could not resolve the default branch; PR layer skipped' };
  }

  // --- Branch name validity + collision --------------------------------------------------
  if (repo.git('check-ref-format', '--branch', branch).status !== 0) {
    return { action: 'skip', note: `'${branch}' is not a valid git branch name; skipped rather than transformed` };
  }
  if (branch === defaultBranch) {
    return { action: 'skip', note: `branch name '${branch}' collides with the default branch` };
  }

  // --- Dirty tree ------------------------------------------------------------------------
  const status = repo.git('status', '--porcelain').stdout.split('\n').filter(Boolean);
  const trackedDirty = status.filter((l) => !l.startsWith('??'));
  const untracked = status.filter((l) => l.startsWith('??'));
  if (trackedDirty.length > 0) {
    return { action: 'skip', note: `working tree has tracked modifications (${trackedDirty.length}); PR layer skipped` };
  }

  // --- Existence: remote OR local --------------------------------------------------------
  repo.git('fetch', '-q', remote);
  const localExists = repo.git('rev-parse', '--verify', '-q', `refs/heads/${branch}`).status === 0;
  const remoteExists =
    repo.git('rev-parse', '--verify', '-q', `refs/remotes/${remote}/${branch}`).status === 0;

  let trackedFromRemote = false;
  let aheadBy: number | undefined;

  if (localExists || remoteExists) {
    const ref = localExists ? branch : `${remote}/${branch}`;

    // --- Compatibility, per path ---------------------------------------------------------
    if (mode === 'per-architecture') {
      // "compatible when `git merge-base <program-branch> <resolved-default>` SUCCEEDS"
      const mb = repo.git('merge-base', ref, `${remote}/${defaultBranch}`);
      if (mb.status !== 0) {
        return { action: 'skip', note: `branch '${branch}' shares no ancestry with ${defaultBranch} (unrelated root)` };
      }
      const mergeBase = mb.stdout.trim();
      const tip = repo.git('rev-parse', `${remote}/${defaultBranch}`).stdout.trim();
      if (mergeBase !== tip) {
        const count = repo
          .git('rev-list', '--count', `${mergeBase}..${remote}/${defaultBranch}`)
          .stdout.trim();
        aheadBy = Number(count);
      }
    } else {
      // Per-proposal: "no commits beyond the resolved default branch other than this
      // change's own artifact commits" — a PATH test: every path the branch adds beyond the
      // default is under orbit/changes/<name>/ (or a deletion under orbit/explore/<name>/).
      const touched = repo
        .git('diff', '--name-only', `${remote}/${defaultBranch}...${ref}`)
        .stdout.split('\n')
        .filter(Boolean);
      const own = (p: string) =>
        p.startsWith(`orbit/changes/${branch}/`) || p.startsWith(`orbit/explore/${branch}/`);
      const foreign = touched.filter((p) => !own(p));
      if (foreign.length > 0) {
        return {
          action: 'skip',
          note: `branch '${branch}' carries unrelated work (${foreign[0]}); collision`,
        };
      }
    }

    // --- Generation-input precondition, BEFORE the switch (reuse path) --------------------
    const guard = generationInputGuard(repo, input.stagingDir, ref);
    if (guard) return guard;

    // --- Step 6: remote-ahead, BEFORE the switch -----------------------------------------
    // "compare against the resolved remote's tip: fast-forward when possible, otherwise SKIP
    //  with a note naming the divergence. Orbit never force-moves ... a user's branch."
    let fastForwardTo: string | undefined;
    if (localExists && remoteExists) {
      const remoteRef = `${remote}/${branch}`;
      const localBehindOrEqual = repo.git('merge-base', '--is-ancestor', branch, remoteRef).status === 0;
      const remoteBehindOrEqual = repo.git('merge-base', '--is-ancestor', remoteRef, branch).status === 0;
      if (localBehindOrEqual) {
        if (!remoteBehindOrEqual) fastForwardTo = remoteRef; // strictly behind: ff after the switch
      } else if (!remoteBehindOrEqual) {
        return {
          action: 'skip',
          note: `branch '${branch}' has diverged from ${remoteRef}; orbit never force-moves, rebases, or force-pushes a user's branch`,
        };
      }
      // else: local strictly ahead — nothing to do; the push carries it.
    }

    if (localExists) {
      const sw = repo.git('switch', branch);
      if (sw.status !== 0) {
        return { action: 'skip', note: `could not switch to '${branch}': ${sw.stderr.trim()}` };
      }
      if (fastForwardTo) {
        const ff = repo.git('merge', '--ff-only', fastForwardTo);
        if (ff.status !== 0) {
          return { action: 'skip', note: `could not fast-forward '${branch}' to ${fastForwardTo}: ${ff.stderr.trim()}` };
        }
      }
    } else {
      const sw = repo.git('switch', '-c', branch, '--track', `${remote}/${branch}`);
      if (sw.status !== 0) {
        return { action: 'skip', note: `could not create tracking branch '${branch}': ${sw.stderr.trim()}` };
      }
      trackedFromRemote = true;
    }
  } else {
    // Absent both locally and on the remote: create off the RESOLVED REMOTE's default ref.
    // The generation-input precondition applies here too — the target is the default ref.
    const guard = generationInputGuard(repo, input.stagingDir, `${remote}/${defaultBranch}`);
    if (guard) return guard;

    const sw = repo.git('switch', '-c', branch, `${remote}/${defaultBranch}`);
    if (sw.status !== 0) {
      return { action: 'skip', note: `could not create '${branch}': ${sw.stderr.trim()}` };
    }
  }

  const notes: string[] = [];
  if (aheadBy) {
    notes.push(`${defaultBranch} is ahead by ${aheadBy} commit(s); the PR's diff carries the gap until you integrate`);
  }
  if (untracked.length > 0) {
    notes.push(`${untracked.length} unrelated untracked path(s) left alone`);
  }

  return {
    action: 'proceed',
    branch,
    remote,
    repoId,
    defaultBranch,
    trackedFromRemote,
    aheadBy,
    note: notes.length ? notes.join('; ') : undefined,
  };
}

/** "Derive `<owner>/<repo>` from the resolved remote's URL (both HTTPS and SSH forms)." */
export function canonicalRepoId(url: string): string | null {
  const https = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (https) return `${https[1]}/${https[2]}`;
  const ssh = url.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (ssh) return `${ssh[1]}/${ssh[2]}`;
  return null;
}

/** "`gh repo view --repo <owner>/<repo> --json defaultBranchRef` … falling back to symbolic-ref." */
function resolveDefaultBranch(repo: Repo, remote: string, repoId: string): string | null {
  const res = ghRepoView(repo, repoId);
  if (res) return res;
  const sym = repo.git('symbolic-ref', `refs/remotes/${remote}/HEAD`);
  if (sym.status === 0) return sym.stdout.trim().split('/').pop() ?? null;
  return null;
}

function ghRepoView(repo: Repo, repoId: string): string | null {
  const res = spawnSync('gh', ['repo', 'view', '--repo', repoId, '--json', 'defaultBranchRef'], {
    cwd: repo.dir,
    encoding: 'utf-8',
    env: { ...process.env, PATH: `${repo.binDir}:${process.env.PATH}` },
  });
  if (res.status !== 0) return null;
  try {
    return (JSON.parse(res.stdout) as { defaultBranchRef?: { name?: string } }).defaultBranchRef?.name ?? null;
  } catch {
    return null;
  }
}
