/**
 * `orbit pr commit <change-name>` — the commit step that closes each carrying body, computed
 * (chained-review-commit; `orbit-pr-lifecycle`'s `\`orbit pr commit\` computes the closing commit
 * step`, granted by `The commit and push settings`, run by `orbit-conventions`' `The commit step
 * closes each carrying body`).
 *
 * The gate is tested in order, the first matching row deciding: the regime, the settings and the
 * attachment are file-resident, so an `off` from any of them runs no `git` call; then HEAD
 * detached, HEAD off the attachment's branch, the attachment's branch named by the remote's `HEAD`
 * ref, and a merge, rebase, cherry-pick or revert in progress — each a `skip` with its code. A
 * `proceed` prints ONE segment when a step is printed and none otherwise: `stage` and `commit`
 * when `commit` is granted and the stage would change something HEAD lacks, `push` when `push` is granted and the
 * destination (the resolved remote and the attachment's branch, never the configured upstream)
 * lacks something. The remote is resolved WITHOUT the default-branch query, so no `gh` is needed.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { findArchivedDir } from '../archived-change.js';
import { resolveCommitPushSetting } from '../project-config.js';
import { validateChangeName } from '../../utils/change-utils.js';
import { latestAttachment, readRegime } from './inputs.js';
import { offRecord, PrUsageError, skipRecord, type PrRecord, type PrSegment, type PrStep } from './record.js';
import { resolve } from './resolve.js';
import { PrRunner, type PrContext } from './run.js';
import { parsePorcelainZ } from './select.js';

/** The porcelain XY codes of an unmerged path (git-status(1), "Short Format"). */
export const UNMERGED_XY = ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'] as const;

/** The pseudo-refs whose presence means a merge, cherry-pick or revert is in progress. */
const IN_PROGRESS_REFS = ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD'] as const;

/** The git-dir entries whose presence means a rebase (or `git am`) is in progress. */
const REBASE_DIRS = ['rebase-merge', 'rebase-apply'] as const;

export function prCommit(ctx: PrContext, change: string): PrRecord {
  const valid = validateChangeName(change);
  if (!valid.valid) throw new PrUsageError(`'${change}' is not a valid change name: ${valid.error}`);
  // Active, else the latest archived change of that name: the step runs after the archive's move.
  const activeDir = path.join(ctx.projectRoot, 'orbit', 'changes', change);
  const changeDir = isDir(activeDir) ? activeDir : findArchivedDir(ctx.projectRoot, change);
  if (changeDir === null) {
    throw new PrUsageError(
      `no change '${change}' (expected orbit/changes/${change}/ or orbit/changes/archive/<date>-${change}/)`
    );
  }

  // The file-resident gate rows: no `git` call before any of them decides `off`.
  if (readRegime(ctx.projectRoot) === 'never') return offRecord('commit');
  const settings = resolveCommitPushSetting(ctx.projectRoot);
  if (!settings.commit && !settings.push) return offRecord('commit', { settings });
  const found = latestAttachment(ctx.projectRoot, changeDir);
  if (found === null) return offRecord('commit', { settings });
  const branch = found.attachment.branch;

  const observations: Record<string, unknown> = {
    branch,
    settings,
    attachment_emit: found.emit,
    change_dir: path.relative(ctx.projectRoot, changeDir).split(path.sep).join('/'),
  };
  const run = new PrRunner(ctx);

  const head = run.git('branch', '--show-current').stdout.trim();
  if (head === '') return skipRecord('commit', 'detached', { branch }, observations);
  if (head !== branch) return skipRecord('commit', 'head-mismatch', { head, branch }, observations);

  const res = resolve(run, { withDefault: false });
  observations.resolution = res.resolution;
  const remote = res.failure ? null : res.resolved!.remote;
  if (remote !== null) {
    // Read from the remote's own `HEAD` ref only (no `gh`); absent, the row is not tested (a named limit).
    const sym = run.git('symbolic-ref', '-q', `refs/remotes/${remote}/HEAD`);
    if (sym.status === 0 && sym.stdout.trim() === `refs/remotes/${remote}/${branch}`) {
      return skipRecord('commit', 'default-branch', { branch, remote }, observations);
    }
  }

  const entries = parsePorcelainZ(run.git('status', '--porcelain', '-z', '--untracked-files=all').stdout);
  const unmerged = entries.filter((e) => (UNMERGED_XY as readonly string[]).includes(e.xy)).map((e) => e.path);
  const inProgress = [
    ...IN_PROGRESS_REFS.filter((ref) => run.git('rev-parse', '-q', '--verify', ref).status === 0),
    ...REBASE_DIRS.filter((dir) => {
      const p = run.git('rev-parse', '--git-path', dir);
      return p.status === 0 && fs.existsSync(path.resolve(ctx.projectRoot, p.stdout.trim()));
    }),
  ];
  if (unmerged.length > 0 || inProgress.length > 0) {
    return skipRecord('commit', 'merge-in-progress', { unmerged, in_progress: inProgress }, observations);
  }

  const untracked = entries.filter((e) => e.xy === '??').map((e) => e.path);
  observations.untracked = settings.commit ? untracked : [];

  // What the destination lacks, measured against ITS remote-tracking ref (null: no such ref).
  let unpushed: number | null = null;
  if (remote !== null) {
    const tracking = `refs/remotes/${remote}/${branch}`;
    if (run.git('rev-parse', '-q', '--verify', tracking).status === 0) {
      const count = run.git('rev-list', '--count', `${tracking}..HEAD`);
      unpushed = count.status === 0 ? Number(count.stdout.trim()) : null;
    }
  }
  observations.unpushed = unpushed;

  const steps: PrStep[] = [];
  // An entry is not enough: `git add -A` can return the index to HEAD (`MM` with the file restored, `AD`), and the
  // printed commit would then fail with nothing to commit. Commit only when the stage would change something: an
  // untracked path, or a tracked path whose working-tree state differs from HEAD (`git diff --quiet HEAD --` exits
  // non-zero: 1 for a difference, anything else counted as one, so an unreadable diff never hides a commit). The
  // diff runs on a copy of the index, because a worktree diff writes the index it reads (`diffWorktreeAgainstHead`).
  const commits =
    settings.commit && entries.length > 0 && (untracked.length > 0 || run.diffWorktreeAgainstHead().status !== 0);
  if (commits) {
    steps.push({ step: 'stage', argv: ['git', 'add', '-A'] });
    steps.push({ step: 'commit', argv: ['git', 'commit', '-F', '<message-file>'] });
  }
  let reason: PrRecord['reason'] = null;
  let degraded: PrRecord['degraded'] = null;
  if (settings.push) {
    if (remote === null) {
      // No remote resolves: the push is dropped, and the stage and commit stand.
      degraded = 'pr';
      reason = { code: res.failure!.code, detail: res.failure!.detail };
    } else if (commits || unpushed === null || unpushed > 0) {
      steps.push({ step: 'push', argv: ['git', 'push', '-u', remote, branch] });
    }
  }
  const segments: PrSegment[] = steps.length > 0 ? [{ inputs: commits ? ['<message-file>'] : [], steps }] : [];

  return { subcommand: 'commit', action: 'proceed', reason, degraded, observations, segments, human_acts: [] };
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
