/**
 * `orbit pr preflight` (rc12-engine-owned-choreography, task 4.3): every outcome of the closed
 * set, against a real repository with the attachment written through the emit surface and the
 * PR scripted on the contract-validated `gh` stub.
 */
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
import { prPreflight } from '../../../src/core/pr/preflight.js';
import type { GhPr, GhScript, Repo } from '../../integration/pr-lifecycle/harness.js';
import { engine } from '../../integration/pr-lifecycle/instrument.js';
import { change, orbitRepo } from './fixtures.js';

const URL7 = 'https://github.com/acme/widget/pull/7';

const open = (over: Partial<GhPr> = {}): GhPr => ({
  url: URL7,
  number: 7,
  state: 'OPEN',
  isDraft: true,
  headRefName: 'add-thing',
  baseRefName: 'main',
  ...over,
});

/** A change on its branch whose propose emit carries `attachment`. */
export function attached(
  gh: GhScript | 'absent',
  attachment: Record<string, unknown> | null,
  opts: { doc?: string; name?: string } = {}
): Repo {
  const name = opts.name ?? 'add-thing';
  const repo = orbitRepo('per-proposal', { gh });
  repo.git('switch', '-q', '-c', String(attachment?.branch ?? name));
  change(repo, name, opts.doc);
  composeAndWriteEmit(
    'propose',
    { change: name },
    { final_assessment: 'Proposed.', model: null, ...(attachment ? { pr_attachment: attachment } : {}) },
    { projectRoot: repo.dir }
  );
  repo.commitAll('the change and its record');
  return repo;
}

const perChange = (over: Record<string, unknown> = {}) => ({ branch: 'add-thing', granularity: 'per-proposal', url: URL7, state: 'draft', ...over });

function preflight(repo: Repo, name = 'add-thing') {
  return engine(repo, (ctx) => prPreflight(ctx, name));
}

describe('preflight — the gate is the attachment', () => {
  it('an unattached change is off: no reason, and no git or gh call', () => {
    const repo = attached({}, null);
    const { record, calls } = preflight(repo);
    expect(record.action).toBe('off');
    expect(record.reason).toBeNull();
    expect(calls).toEqual({ git: [], gh: [] });
  });

  it('pr: never in the live config does not turn an attached change off', () => {
    const repo = attached({ prs: { [URL7]: open() } }, perChange());
    repo.write('orbit/config.yaml', 'schema: spec-driven\npr: never\n');
    const { record } = preflight(repo);
    expect(record.observations.outcome).toBe('valid');
  });
});

describe('preflight — a stored URL, validated live', () => {
  it.each([
    ['draft', true],
    ['ready', false],
  ])('valid, observed %s: proceed with pr_url and pr_state', (state, isDraft) => {
    const repo = attached({ prs: { [URL7]: open({ isDraft }) } }, perChange());
    const { record, calls } = preflight(repo);
    expect(record).toMatchObject({ action: 'proceed', degraded: null, reason: null, segments: [], human_acts: [] });
    expect(record.observations).toMatchObject({ outcome: 'valid', emit: { pr_url: URL7, pr_state: state } });
    expect(calls.gh.find((c) => c.args[0] === 'pr' && c.args[1] === 'view')!.args).toEqual([
      'pr', 'view', '--repo', 'acme/widget', URL7, '--json', 'state,isDraft,headRefName,baseRefName,url',
    ]);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr preflight` computes the archive's read-only preflight :: A closed PR is answered, not missing
  it.each([
    ['closed', open({ state: 'CLOSED' }), { observed: 'CLOSED' }],
    ['merged', open({ state: 'MERGED' }), { observed: 'MERGED' }],
    ['retargeted', open({ baseRefName: 'release' }), { observed: 'release', expected: 'main' }],
    ['head-mismatch', open({ headRefName: 'someone-else' }), { observed: 'someone-else', expected: 'add-thing' }],
    ['repository-mismatch', open({ url: 'https://github.com/other/widget/pull/7' }), { observed: 'other/widget', expected: 'acme/widget' }],
  ])('%s: answered — proceed, degraded, the note\'s facts in detail, pr_url kept, no pr_state, and NO fallback query', (outcome, pr, detail) => {
    const repo = attached({ prs: { [URL7]: pr }, prList: [open()] }, perChange());
    const { record, calls } = preflight(repo);
    expect(record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: outcome } });
    expect(record.reason!.detail).toEqual(detail);
    expect(record.observations).toMatchObject({ outcome, emit: { pr_url: URL7 } });
    expect((record.observations.emit as Record<string, unknown>).pr_state).toBeUndefined();
    expect(calls.gh.some((c) => c.args[1] === 'list')).toBe(false);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr preflight` computes the archive's read-only preflight :: Not-found and a failed query are told apart
  it('not-found and an authentication failure are told apart by gh\'s recorded message', () => {
    const missing = attached({ prs: {} }, perChange());
    const { record: nf } = preflight(missing);
    expect(nf).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: 'not-found' } });
    expect(nf.observations).toMatchObject({ outcome: 'not-found', emit: { pr_url: URL7 } });

    const auth = attached({ prs: { [URL7]: { error: 'HTTP 401: Bad credentials (https://api.github.com/graphql)' } } }, perChange());
    const { record: un } = preflight(auth);
    expect(un).toMatchObject({ action: 'skip', reason: { code: 'unobserved' }, segments: [] });
    expect(un.observations).toMatchObject({ outcome: 'unobserved', emit: {} });
  });

  // @scenario behaviour orbit-pr-lifecycle :: Test instruments derive from a recorded real-CLI contract :: A missing pull request answers with the recorded message
  it('the stub answers a scripted missing pull request with the contract\'s recorded message', () => {
    const repo = attached({ prs: {} }, perChange());
    const res = spawnSync('gh', ['pr', 'view', '--repo', 'acme/widget', URL7, '--json', 'state'], { cwd: repo.dir, encoding: 'utf-8', env: repo.env() });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/^GraphQL: Could not resolve to a PullRequest with the number of \d+\. \(repository\.pullRequest\)\n$/);
  });

  // @scenario behaviour orbit-pr-lifecycle :: The `orbit pr` command observes and prints; it never writes :: An absent gh is its own fact
  it('gh absent is gh-absent: skip, its own code, no emit values', () => {
    const repo = attached('absent', perChange());
    const { record } = preflight(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'gh-absent' } });
    expect(record.observations).toMatchObject({ outcome: 'gh-absent', emit: {}, resolution: { gh: 'absent' } });
  });

  it('an unresolvable remote is unobserved (resolution failed), never a missing PR', () => {
    const repo = attached({}, perChange());
    repo.git('remote', 'remove', 'origin');
    const { record } = preflight(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'no-remote' } });
    expect(record.observations.outcome).toBe('unobserved');
  });
});

describe('preflight — a URL-less attachment: the four-axis fallback', () => {
  const noUrl = { branch: 'add-thing', granularity: 'per-proposal' };

  it('exactly one survivor (another base discarded) is discovered', () => {
    const repo = attached({ prList: [open({ isDraft: false }), open({ url: 'https://github.com/acme/widget/pull/8', baseRefName: 'release' })] }, noUrl);
    const { record, calls } = preflight(repo);
    expect(record).toMatchObject({ action: 'proceed', degraded: null });
    expect(record.observations).toMatchObject({ outcome: 'discovered', emit: { pr_url: URL7, pr_state: 'ready' } });
    expect(calls.gh.find((c) => c.args[1] === 'list')!.args).toEqual([
      'pr', 'list', '--repo', 'acme/widget', '--head', 'add-thing', '--state', 'open', '--json', 'url,baseRefName,isDraft,number',
    ]);
  });

  it.each([
    ['none', [] as GhPr[]],
    ['several', [open(), open({ url: 'https://github.com/acme/widget/pull/8' })]],
  ])('%s: proceed, degraded, no emit values', (outcome, prList) => {
    const repo = attached({ prList }, noUrl);
    const { record } = preflight(repo);
    expect(record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: outcome } });
    expect(record.observations).toMatchObject({ outcome, emit: {} });
    if (outcome === 'several') expect((record.reason!.detail as { candidates: string[] }).candidates).toHaveLength(2);
  });

  it('a query error is unobserved: skip', () => {
    const repo = attached({ prList: null }, noUrl);
    const { record } = preflight(repo);
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'unobserved' } });
    expect(record.observations).toMatchObject({ outcome: 'unobserved', emit: {} });
  });
});

describe('preflight — citation divergence is observed, and the frozen record governs', () => {
  it('a citation added after propose is reported diverged; the attachment still decides the branch', () => {
    const repo = attached({ prs: { [URL7]: open() } }, perChange(), { doc: 'later-program' });
    const { record } = preflight(repo);
    expect(record.observations.citation).toEqual({ recorded: null, current: 'later-program', diverged: true });
    expect(record.observations.outcome).toBe('valid');
  });

  it('an unchanged program citation is not diverged', () => {
    const program = { branch: 'my-program', granularity: 'per-architecture', doc: 'my-program', url: URL7, state: 'draft' };
    const repo = attached({ prs: { [URL7]: open({ headRefName: 'my-program' }) } }, program, { doc: 'my-program' });
    const { record } = preflight(repo);
    expect(record.observations.citation).toEqual({ recorded: 'my-program', current: 'my-program', diverged: false });
  });

  it('the LATEST attachment-bearing propose or ff emit governs', () => {
    const repo = attached({ prs: { 'https://github.com/acme/widget/pull/9': open({ url: 'https://github.com/acme/widget/pull/9' }) } }, perChange());
    composeAndWriteEmit('ff', { change: 'add-thing' }, { final_assessment: 'Re-ran.', model: null, pr_attachment: perChange({ url: 'https://github.com/acme/widget/pull/9' }) }, { projectRoot: repo.dir });
    const { record } = preflight(repo);
    expect(record.observations).toMatchObject({ outcome: 'valid', emit: { pr_url: 'https://github.com/acme/widget/pull/9' } });
  });
});
