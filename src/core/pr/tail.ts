/**
 * `orbit pr tail <change-name> --outcome <code> [--include <path>]…` — the archive's PR tail,
 * computed (rc12-engine-owned-choreography; `orbit-pr-lifecycle`'s `\`orbit pr tail\` computes
 * the archive tail`, over `orbit-archive-modifications`' `PR-attached archive tail`).
 *
 * It never observes the PR again (D-rc12-9): preflight's one observation arrives as `--outcome`,
 * passed verbatim, and the WRITTEN archive emit supplies `pr_url`, `pr_state` and the sync's
 * changed capabilities. A code outside preflight's set, or an emit that contradicts the code's
 * row, is a usage error naming both.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { findArchivedDir } from '../archived-change.js';
import { validateChangeName } from '../../utils/change-utils.js';
import { latestAttachment } from './inputs.js';
import {
  offRecord,
  POSITIVE_INVALIDATIONS,
  PREFLIGHT_OUTCOMES,
  PrUsageError,
  skipRecord,
  type PreflightOutcome,
  type PrHumanAct,
  type PrRecord,
  type PrSegment,
} from './record.js';
import { resolve } from './resolve.js';
import { PrRunner, type PrContext } from './run.js';
import { enumerateScope } from './scope.js';
import { parsePorcelainZ } from './select.js';

type Row = 'pr-runs' | 'answered' | 'missed' | 'unobserved';

function rowOf(outcome: PreflightOutcome): Row {
  if (outcome === 'valid' || outcome === 'discovered') return 'pr-runs';
  if ((POSITIVE_INVALIDATIONS as readonly string[]).includes(outcome) || outcome === 'not-found') return 'answered';
  if (outcome === 'none' || outcome === 'several') return 'missed';
  return 'unobserved';
}

const ROW_FIELDS: Record<Row, { url: boolean; state: boolean; text: string }> = {
  'pr-runs': { url: true, state: true, text: '`pr_url` and `pr_state`' },
  answered: { url: true, state: false, text: '`pr_url` and no `pr_state`' },
  missed: { url: false, state: false, text: 'neither PR field' },
  unobserved: { url: false, state: false, text: 'neither PR field' },
};

const ARCHIVE_EMIT = /^archive-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.json$/;

export function prTail(
  ctx: PrContext,
  change: string,
  opts: { outcome?: string; include?: string[] }
): PrRecord {
  const valid = validateChangeName(change);
  if (!valid.valid) throw new PrUsageError(`'${change}' is not a valid change name: ${valid.error}`);
  const archivedDir = findArchivedDir(ctx.projectRoot, change);
  if (archivedDir === null) {
    throw new PrUsageError(`no archived change '${change}' (expected orbit/changes/archive/<date>-${change}/)`);
  }
  const outcome = opts.outcome;
  if (outcome === undefined) throw new PrUsageError('--outcome <code> is required: pass preflight\'s observations.outcome verbatim');
  if (!(PREFLIGHT_OUTCOMES as readonly string[]).includes(outcome)) {
    throw new PrUsageError(`--outcome '${outcome}' is not in preflight's closed set (${PREFLIGHT_OUTCOMES.join(', ')})`);
  }

  const found = latestAttachment(ctx.projectRoot, archivedDir);
  if (found === null) return offRecord('tail');
  const att = found.attachment;

  // The written archive emit — the latest on the archived trail.
  const trail = path.join(archivedDir, '.orbit-runs');
  const emits = safeList(trail).filter((n) => ARCHIVE_EMIT.test(n)).sort();
  if (emits.length === 0) throw new PrUsageError(`no archive emit on ${path.relative(ctx.projectRoot, trail)}; tail runs after the archive emit`);
  const emitRel = path.relative(ctx.projectRoot, path.join(trail, emits[emits.length - 1]));
  let emit: Record<string, unknown>;
  try {
    emit = JSON.parse(fs.readFileSync(path.join(ctx.projectRoot, emitRel), 'utf-8'));
  } catch (e) {
    throw new PrUsageError(`the archive emit ${emitRel} does not parse: ${(e as Error).message}`);
  }
  const prUrl = typeof emit.pr_url === 'string' ? emit.pr_url : undefined;
  const prState = emit.pr_state === 'draft' || emit.pr_state === 'ready' ? emit.pr_state : undefined;
  const row = rowOf(outcome as PreflightOutcome);
  const want = ROW_FIELDS[row];
  if ((prUrl !== undefined) !== want.url || (prState !== undefined) !== want.state) {
    const has = [prUrl !== undefined ? '`pr_url`' : null, prState !== undefined ? '`pr_state`' : null].filter(Boolean);
    throw new PrUsageError(
      `--outcome '${outcome}' needs an archive emit carrying ${want.text}, but ${emitRel} carries ${has.length ? has.join(' and ') : 'neither'} — pass preflight's outcome verbatim`
    );
  }

  const observations: Record<string, unknown> = {
    attachment: att,
    archive_emit: emitRel,
    outcome,
    pr_url: prUrl ?? null,
    pr_state: prState ?? null,
  };
  if (row === 'unobserved') return skipRecord('tail', outcome, {}, observations);

  // Preconditions, before any staging: `gh` available, then HEAD on the attachment's branch.
  const run = new PrRunner(ctx);
  const res = resolve(run);
  observations.resolution = res.resolution;
  if (res.failure) return skipRecord('tail', res.failure.code, res.failure.detail, observations);
  const { remote, repo, defaultBranch } = res.resolved!;
  const branch = att.branch;
  const head = run.git('branch', '--show-current').stdout.trim();
  if (head !== branch) {
    const local = run.git('rev-parse', '--verify', '-q', `refs/heads/${branch}`).status === 0;
    const onRemote = run.git('ls-remote', '--heads', remote, `refs/heads/${branch}`);
    const remoteExists = onRemote.status === 0 && onRemote.stdout.trim().length > 0;
    const recovery = local
      ? { case: 'local', argv: [['git', 'switch', branch]] }
      : remoteExists
        ? { case: 'remote-only', argv: [['git', 'fetch', remote], ['git', 'switch', '-c', branch, '--track', `${remote}/${branch}`]] }
        : { case: 'absent', argv: [] };
    return skipRecord('tail', 'head-mismatch', { head: head || null, branch, recovery }, observations);
  }

  // The commit scope: the synced spec files, the pre-move deletions, the archived directory
  // (the one path staged whole), and every `--include`.
  const sync = (emit.sync_specs ?? {}) as { capabilities_updated?: unknown };
  const caps = Array.isArray(sync.capabilities_updated)
    ? sync.capabilities_updated.filter((c): c is string => typeof c === 'string')
    : [];
  const specs = caps.map((c) => `orbit/specs/${c}/spec.md`);
  const preMove = `orbit/changes/${change}/`;
  const archivedRel = path.relative(ctx.projectRoot, archivedDir).split(path.sep).join('/');
  const include = opts.include ?? [];
  // The pre-move deletions come from PORCELAIN, never the index alone: a move already staged
  // (`git add -A orbit/changes`, this repository's own archive practice) has left no index entry
  // under the pre-move path, and only its rename or deletion entry still names it.
  const entries = parsePorcelainZ(run.git('status', '--porcelain', '-z', '--untracked-files=all').stdout);
  const moved = enumerateScope(entries, [{ prefix: preMove, deletionsOnly: true }]);
  const scope = [...specs, ...moved.scope, archivedRel, ...include];
  const inScope = (p: string) =>
    scope.includes(p) || p.startsWith(`${archivedRel}/`) || include.some((i) => p.startsWith(i.endsWith('/') ? i : `${i}/`));
  observations.scope = scope;
  observations.unrelated_staged = moved.unrelated
    .filter((u) => u.status[0] !== ' ' && u.status[0] !== '?' && !inScope(u.path))
    .map((u) => u.path);

  const degraded = row !== 'pr-runs';
  const program = att.granularity === 'per-architecture';
  const seg: PrSegment = {
    inputs: ['<message-file>'],
    steps: [
      { step: 'stage', argv: ['git', 'add', '--', ...scope.filter((p) => !moved.alreadyStaged.has(p))] },
      { step: 'commit', argv: ['git', 'commit', '--only', '-F', '<message-file>', '--', ...scope] },
      { step: 'push', argv: ['git', 'push', remote, branch] },
    ],
  };
  const human_acts: PrHumanAct[] = [];
  let reason: PrRecord['reason'] = degraded ? { code: outcome, detail: {} } : null;
  let pathDegraded = degraded;

  if (!degraded && prUrl !== undefined) {
    if (program) {
      // READ-APPEND-WRITE: the composed body replaces the whole body, so the current one is read.
      const body = run.gh('pr', 'view', '--repo', repo, prUrl, '--json', 'body');
      let current: string | null = null;
      if (body.status === 0) {
        try {
          const parsed = JSON.parse(body.stdout) as { body?: unknown };
          current = typeof parsed.body === 'string' ? parsed.body : null;
        } catch {
          current = null;
        }
      }
      if (current === null) {
        // Without the current body an append would erase every earlier stage's entry.
        pathDegraded = true;
        reason = { code: 'body-unobserved', detail: { stderr: body.stderr.trim() } };
      } else {
        observations.current_body = current;
        seg.inputs.push('<body-file>');
        seg.steps.push({ step: 'append', argv: ['gh', 'pr', 'edit', '--repo', repo, prUrl, '--body-file', '<body-file>'] });
      }
    } else {
      seg.inputs.push('<body-file>');
      seg.steps.push({ step: 'rewrite', argv: ['gh', 'pr', 'edit', '--repo', repo, prUrl, '--body-file', '<body-file>'] });
      if (prState !== 'ready') {
        seg.steps.push({ step: 'ready', argv: ['gh', 'pr', 'ready', '--repo', repo, prUrl] });
      }
      // The merge and the return it leaves are the user's. A program PR's acts are `program`'s:
      // its merge belongs to arc-done, never to a stage's archive.
      human_acts.push(
        { act: 'merge', argv: ['gh', 'pr', 'merge', '--repo', repo, prUrl] },
        { act: 'return-fetch', argv: ['git', 'fetch', remote] },
        { act: 'return-switch', argv: ['git', 'switch', defaultBranch] },
        { act: 'return-fast-forward', argv: ['git', 'merge', '--ff-only', `${remote}/${defaultBranch}`] }
      );
    }
  }

  return {
    subcommand: 'tail',
    action: 'proceed',
    reason,
    degraded: pathDegraded ? 'pr' : null,
    observations,
    segments: [seg],
    human_acts,
  };
}

function safeList(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}
