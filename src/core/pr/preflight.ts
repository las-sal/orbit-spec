/**
 * `orbit pr preflight <change-name>` — the archive's read-only PR preflight, computed
 * (rc12-engine-owned-choreography; `orbit-pr-lifecycle`'s `\`orbit pr preflight\` computes the
 * archive's read-only preflight`, over `orbit-archive-modifications`' `PR-attached archive tail`).
 *
 * Reads the attachment from the trail, notes citation divergence, and decides ONE outcome from
 * the closed set (D-rc12-12). A stored URL that resolves is ANSWERED — a failed validation never
 * triggers the fallback query. `observations.emit` carries the values the archive emit records,
 * and the body passes `observations.outcome` to `tail` verbatim.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateChangeName } from '../../utils/change-utils.js';
import { latestAttachment, readCitation, type Attachment } from './inputs.js';
import { fourAxisQuery } from './publish.js';
import {
  offRecord,
  PrUsageError,
  skipRecord,
  type PreflightOutcome,
  type PrRecord,
} from './record.js';
import { repoOfPrUrl, resolve } from './resolve.js';
import { PrRunner, type PrContext } from './run.js';

/**
 * The stable part of `gh`'s message for a pull request that does not exist — the substring the
 * recorded contract's `pr_view_not_found` rule carries (a test holds the two together). Any
 * other non-zero exit is `unobserved`: keying on exit status alone would class an auth failure
 * as not-found and keep a dead URL in the emit.
 */
export const GH_PR_NOT_FOUND = 'Could not resolve to a PullRequest';

export interface ValidatedPr {
  outcome: PreflightOutcome;
  state?: 'draft' | 'ready';
  stderr?: string;
}

/** Validate a stored URL live against the four predicates: repository, open state, base, head. */
export function validatePrUrl(
  run: PrRunner,
  repo: string,
  url: string,
  branch: string,
  defaultBranch: string
): ValidatedPr {
  const view = run.gh('pr', 'view', '--repo', repo, url, '--json', 'state,isDraft,headRefName,baseRefName,url');
  if (view.status !== 0) {
    return view.stderr.includes(GH_PR_NOT_FOUND)
      ? { outcome: 'not-found' }
      : { outcome: 'unobserved', stderr: view.stderr.trim() };
  }
  let pr: { state?: string; isDraft?: boolean; headRefName?: string; baseRefName?: string; url?: string };
  try {
    pr = JSON.parse(view.stdout);
  } catch {
    return { outcome: 'unobserved', stderr: 'unparseable gh pr view output' };
  }
  const prRepo = repoOfPrUrl(pr.url ?? url);
  if (prRepo === null || prRepo.toLowerCase() !== repo.toLowerCase()) return { outcome: 'repository-mismatch' };
  if (pr.state === 'MERGED') return { outcome: 'merged' };
  if (pr.state !== 'OPEN') return { outcome: 'closed' };
  if (pr.baseRefName !== defaultBranch) return { outcome: 'retargeted' };
  if (pr.headRefName !== branch) return { outcome: 'head-mismatch' };
  return { outcome: 'valid', state: pr.isDraft ? 'draft' : 'ready' };
}

export function prPreflight(ctx: PrContext, change: string): PrRecord {
  const valid = validateChangeName(change);
  if (!valid.valid) throw new PrUsageError(`'${change}' is not a valid change name: ${valid.error}`);
  const changeDir = path.join(ctx.projectRoot, 'orbit', 'changes', change);
  if (!isDir(changeDir)) throw new PrUsageError(`no active change '${change}' (expected orbit/changes/${change}/)`);

  const found = latestAttachment(ctx.projectRoot, changeDir);
  if (found === null) return offRecord('preflight');
  const att = found.attachment;

  const recorded = att.doc ?? null;
  const current = readCitation(changeDir);
  const observations: Record<string, unknown> = {
    attachment: att,
    attachment_emit: found.emit,
    citation: { recorded, current, diverged: recorded !== current },
  };

  const decide = (
    outcome: PreflightOutcome,
    extra: { pr_url?: string; pr_state?: 'draft' | 'ready'; detail?: Record<string, unknown>; code?: string } = {}
  ): PrRecord => {
    observations.outcome = outcome;
    observations.emit = {
      ...(extra.pr_url !== undefined ? { pr_url: extra.pr_url } : {}),
      ...(extra.pr_state !== undefined ? { pr_state: extra.pr_state } : {}),
    };
    if (outcome === 'unobserved' || outcome === 'gh-absent') {
      return skipRecord('preflight', extra.code ?? outcome, extra.detail ?? {}, observations);
    }
    const degraded = outcome !== 'valid' && outcome !== 'discovered';
    return {
      subcommand: 'preflight',
      action: 'proceed',
      reason: degraded ? { code: outcome, detail: extra.detail ?? {} } : null,
      degraded: degraded ? 'pr' : null,
      observations,
      segments: [],
      human_acts: [],
    };
  };

  const run = new PrRunner(ctx);
  const res = resolve(run);
  observations.resolution = res.resolution;
  if (res.failure) {
    if (res.failure.code === 'gh-absent') return decide('gh-absent');
    // An unresolvable remote or base is a DEGRADATION SKIP — the observation is unavailable,
    // never a zero-result.
    return decide('unobserved', { code: res.failure.code, detail: res.failure.detail });
  }
  const { repo, defaultBranch } = res.resolved!;

  if (att.url !== undefined) {
    const v = validatePrUrl(run, repo, att.url, att.branch, defaultBranch);
    if (v.outcome === 'valid') return decide('valid', { pr_url: att.url, pr_state: v.state });
    if (v.outcome === 'unobserved') return decide('unobserved', { detail: { stderr: v.stderr } });
    return decide(v.outcome, { pr_url: att.url });
  }
  return discover(run, repo, att, defaultBranch, decide);
}

function discover(
  run: PrRunner,
  repo: string,
  att: Attachment,
  defaultBranch: string,
  decide: (o: PreflightOutcome, extra?: { pr_url?: string; pr_state?: 'draft' | 'ready'; detail?: Record<string, unknown> }) => PrRecord
): PrRecord {
  const q = fourAxisQuery(run, repo, att.branch, defaultBranch);
  if (!q.ok) return decide('unobserved', { detail: { stderr: q.stderr } });
  if (q.survivors.length === 0) return decide('none');
  if (q.survivors.length > 1) return decide('several', { detail: { candidates: q.survivors.map((s) => s.url) } });
  const pr = q.survivors[0];
  return decide('discovered', { pr_url: pr.url, pr_state: pr.isDraft ? 'draft' : 'ready' });
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
