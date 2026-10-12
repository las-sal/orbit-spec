/**
 * `orbit pr publish <change-name>` — propose and ff Phase 3, computed (rc12-engine-owned-
 * choreography; `orbit-pr-lifecycle`'s `\`orbit pr publish\` computes propose's outward phase`).
 *
 * Computes the ENUMERATED commit scope, the no-CI observation and, on the program path, the
 * four-axis adopt-or-create query of `Program PR (Shape A) semantics`, and prints two segments:
 * land and open, then the attachment record once the body has written the emit from segment
 * 1's result. The title and body are the body's judgment, never computed.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateChangeName } from '../../utils/change-utils.js';
import { readCitation, readRegime, selectTarget } from './inputs.js';
import { offRecord, PrUsageError, skipRecord, type PrRecord, type PrSegment, type PrStep } from './record.js';
import { resolve } from './resolve.js';
import { PrRunner, type PrContext } from './run.js';
import { enumerateScope } from './scope.js';
import { parsePorcelainZ } from './select.js';

export interface PrListEntry {
  url: string;
  baseRefName: string;
  isDraft: boolean;
  number?: number;
}

/**
 * The four-axis constrained query: `--repo`, `--head`, `--state open`, then DISCARD candidates
 * whose base is not the resolved default. Shared by `publish`, `preflight` and `program`.
 */
export function fourAxisQuery(
  run: PrRunner,
  repo: string,
  head: string,
  defaultBranch: string
): { ok: true; survivors: PrListEntry[] } | { ok: false; stderr: string } {
  const res = run.gh('pr', 'list', '--repo', repo, '--head', head, '--state', 'open', '--json', 'url,baseRefName,isDraft,number');
  if (res.status !== 0) return { ok: false, stderr: res.stderr.trim() };
  let list: unknown;
  try {
    list = JSON.parse(res.stdout);
  } catch {
    return { ok: false, stderr: 'unparseable gh pr list output' };
  }
  if (!Array.isArray(list)) return { ok: false, stderr: 'unexpected gh pr list output' };
  const survivors = (list as PrListEntry[]).filter((p) => p && p.baseRefName === defaultBranch && typeof p.url === 'string');
  return { ok: true, survivors };
}

export function prPublish(ctx: PrContext, change: string): PrRecord {
  const valid = validateChangeName(change);
  if (!valid.valid) throw new PrUsageError(`'${change}' is not a valid change name: ${valid.error}`);
  const changeRel = path.posix.join('orbit', 'changes', change);
  if (!isDir(path.join(ctx.projectRoot, changeRel))) {
    throw new PrUsageError(`no active change '${change}' (expected ${changeRel}/)`);
  }

  const regime = readRegime(ctx.projectRoot);
  if (regime === 'never') return offRecord('publish');

  const citation = readCitation(path.join(ctx.projectRoot, changeRel));
  const target = selectTarget(regime, citation);
  const program = target.granularity === 'per-architecture';
  const branch = target.doc ?? change;
  const granularity = target.granularity;

  const run = new PrRunner(ctx);
  const res = resolve(run);
  const observations: Record<string, unknown> = {
    resolution: res.resolution,
    change,
    branch,
    granularity,
    attachment: { branch, ...target },
  };
  if (res.failure) return skipRecord('publish', res.failure.code, res.failure.detail, observations);
  const { remote, repo, defaultBranch } = res.resolved!;
  observations.head_branch = run.git('branch', '--show-current').stdout.trim() || null;

  // The ENUMERATED scope, path by path, from the porcelain status.
  const entries = parsePorcelainZ(run.git('status', '--porcelain', '-z', '--untracked-files=all').stdout);
  // Every path under the change directory (deletions and a rename's source included), and every
  // deletion under the staging directory the move emptied.
  const { scope, alreadyStaged, unrelated } = enumerateScope(entries, [
    { prefix: `${changeRel}/`, deletionsOnly: false },
    { prefix: `orbit/explore/${change}/`, deletionsOnly: true },
  ]);
  observations.scope = scope;
  observations.unrelated = unrelated;

  // The no-CI observation, bound to the resolved remote's default-branch ref.
  const ci = run.git('ls-tree', '--name-only', `${remote}/${defaultBranch}`, '--', '.github/workflows/');
  observations.ci = ci.status !== 0 ? 'unknown' : ci.stdout.trim().length > 0 ? 'present' : 'absent';

  // The program path's adopt-or-create query.
  let createPr = true;
  let degradedCode: string | null = null;
  let degradedDetail: Record<string, unknown> = {};
  if (program) {
    const q = fourAxisQuery(run, repo, branch, defaultBranch);
    if (!q.ok) {
      degradedCode = 'query-error';
      degradedDetail = { stderr: q.stderr };
    } else if (q.survivors.length === 1) {
      createPr = false;
      observations.adopted_url = q.survivors[0].url;
      observations.adopted_state = q.survivors[0].isDraft ? 'draft' : 'ready';
    } else if (q.survivors.length > 1) {
      degradedCode = 'several';
      degradedDetail = { candidates: q.survivors.map((s) => s.url) };
    }
  }

  // An empty scope (a re-run after the commit landed and the push did not) prints no stage or
  // commit: `git commit --only` with no paths is refused by git. The push still carries the work.
  const toAdd = scope.filter((p) => !alreadyStaged.has(p));
  const land: PrStep[] = [
    ...(toAdd.length > 0 ? [{ step: 'stage', argv: ['git', 'add', '--', ...toAdd] }] : []),
    ...(scope.length > 0 ? [{ step: 'commit', argv: ['git', 'commit', '--only', '-F', '<message-file>', '--', ...scope] }] : []),
    { step: 'push', argv: ['git', 'push', '-u', remote, branch] },
  ];
  const seg1: PrSegment = { inputs: scope.length > 0 ? ['<message-file>'] : [], steps: land };
  if (degradedCode === null && createPr) {
    seg1.inputs = [...seg1.inputs, '<title>', '<body-file>'];
    seg1.steps.push({
      step: 'open',
      argv: ['gh', 'pr', 'create', '--repo', repo, '--draft', '--base', defaultBranch, '--head', branch, '--title', '<title>', '--body-file', '<body-file>'],
    });
  }
  const segments: PrSegment[] = [seg1];
  // The attachment record lands only when a PR opened or was adopted; after a degradation the
  // emit stays local (the owner's success gate).
  if (degradedCode === null) {
    segments.push({
      inputs: ['<emit-path>', '<message-file>'],
      steps: [
        { step: 'stage-record', argv: ['git', 'add', '--', '<emit-path>'] },
        { step: 'commit-record', argv: ['git', 'commit', '--only', '-F', '<message-file>', '--', '<emit-path>'] },
        { step: 'push-record', argv: ['git', 'push', remote, branch] },
      ],
    });
  }

  return {
    subcommand: 'publish',
    action: 'proceed',
    reason: degradedCode ? { code: degradedCode, detail: degradedDetail } : null,
    degraded: degradedCode ? 'pr' : null,
    observations,
    segments,
    human_acts: [],
  };
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
