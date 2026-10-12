/**
 * `orbit pr program` (rc12-engine-owned-choreography, task 4.5): the latest URL-BEARING record
 * rule, the fall-through, `unverified`, and `several` — and it never skips.
 */
import { describe, expect, it } from 'vitest';
import { prProgram } from '../../../src/core/pr/program.js';
import { PrUsageError } from '../../../src/core/pr/record.js';
import type { GhPr, GhScript, Repo } from '../../integration/pr-lifecycle/harness.js';
import { ctxFor, engine } from '../../integration/pr-lifecycle/instrument.js';
import { orbitRepo } from './fixtures.js';

const URL3 = 'https://github.com/acme/widget/pull/3';
const URL4 = 'https://github.com/acme/widget/pull/4';

const pr = (url: string, over: Partial<GhPr> = {}): GhPr => ({
  url,
  state: 'OPEN',
  isDraft: true,
  headRefName: 'my-program',
  baseRefName: 'main',
  ...over,
});

/** Per-architecture records on change trails: `[dir, token, url?]`, dir relative to orbit/changes. */
function programRepo(gh: GhScript | 'absent', records: Array<[string, string, string?]>): Repo {
  const repo = orbitRepo('per-architecture', { gh });
  repo.write('orbit/architecture/my-program.md', '# My program\n');
  for (const [dir, token, url] of records) {
    repo.write(
      `orbit/changes/${dir}/.orbit-runs/propose-${token}.json`,
      JSON.stringify({
        command: 'propose',
        timestamp: token,
        pr_attachment: { branch: 'my-program', granularity: 'per-architecture', doc: 'my-program', ...(url ? { url, state: 'draft' } : {}) },
      })
    );
  }
  // A record for ANOTHER doc never counts.
  repo.write(
    'orbit/changes/elsewhere/.orbit-runs/propose-2026-10-12T12-00-00Z.json',
    JSON.stringify({ command: 'propose', pr_attachment: { branch: 'other', granularity: 'per-architecture', doc: 'other-program', url: URL4 } })
  );
  return repo;
}

function program(repo: Repo) {
  return engine(repo, (ctx) => prProgram(ctx, 'my-program'));
}

describe('program — the record rule', () => {
  it('no per-architecture record naming the doc is off, and probes nothing', () => {
    const repo = programRepo({}, []);
    const { record, calls } = program(repo);
    expect(record.action).toBe('off');
    expect(calls).toEqual({ git: [], gh: [] });
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr program` computes the architect readout's PR facts :: A newer URL-less record does not mask an older URL
  it('a newer URL-less record does not mask an older URL: the older one is validated, and is valid', () => {
    const repo = programRepo({ prs: { [URL3]: pr(URL3) } }, [
      ['archive/2026-10-01-stage-one', '2026-10-01T10-00-00Z', URL3],
      ['stage-two', '2026-10-11T10-00-00Z'],
    ]);
    const { record, calls } = program(repo);
    expect(record).toMatchObject({ action: 'proceed', reason: null, degraded: null, segments: [] });
    expect(record.observations).toMatchObject({ outcome: 'valid', pr: { url: URL3, state: 'draft' } });
    expect(calls.gh.some((c) => c.args[1] === 'list')).toBe(false);
    expect(record.human_acts).toEqual([
      { act: 'ready', argv: ['gh', 'pr', 'ready', '--repo', 'acme/widget', URL3] },
      { act: 'merge', argv: ['gh', 'pr', 'merge', '--repo', 'acme/widget', URL3] },
    ]);
  });

  it('an already-ready PR leaves only the merge', () => {
    const repo = programRepo({ prs: { [URL3]: pr(URL3, { isDraft: false }) } }, [['stage-one', '2026-10-01T10-00-00Z', URL3]]);
    expect(program(repo).record.human_acts.map((a) => a.act)).toEqual(['merge']);
  });

  it('no URL-bearing record at all: the four-axis query discovers it', () => {
    const repo = programRepo({ prList: [pr(URL3), pr(URL4, { baseRefName: 'release' })] }, [['stage-one', '2026-10-01T10-00-00Z']]);
    const { record } = program(repo);
    expect(record.observations).toMatchObject({ outcome: 'discovered', pr: { url: URL3, state: 'draft' }, record: null });
  });

  it('a doc that does not exist is a usage error', () => {
    const repo = programRepo({}, []);
    expect(() => prProgram(ctxFor(repo), 'no-such-doc')).toThrow(PrUsageError);
    expect(() => prProgram(ctxFor(repo), '../escape')).toThrow(PrUsageError);
  });
});

describe('program — fall-through on a positive invalidation (never suppressed)', () => {
  const closed = { [URL3]: pr(URL3, { state: 'CLOSED' as const }) };

  it('a closed record falls through; one open replacement is discovered', () => {
    const repo = programRepo({ prs: closed, prList: [pr(URL4)] }, [['stage-one', '2026-10-01T10-00-00Z', URL3]]);
    const { record } = program(repo);
    expect(record.action).toBe('proceed');
    expect(record.observations).toMatchObject({ invalidated: 'closed', outcome: 'discovered', pr: { url: URL4 } });
  });

  it('nothing open: still proceeds, the outcome is the recorded PR\'s reason, and no PR is handed over', () => {
    const repo = programRepo({ prs: closed, prList: [] }, [['stage-one', '2026-10-01T10-00-00Z', URL3]]);
    const { record } = program(repo);
    expect(record.action).toBe('proceed');
    expect(record.observations).toMatchObject({ invalidated: 'closed', outcome: 'closed', pr: null });
    expect(record.human_acts).toEqual([]);
  });

  it('several open: every candidate is listed', () => {
    const repo = programRepo({ prs: closed, prList: [pr(URL4), pr('https://github.com/acme/widget/pull/5', { isDraft: false })] }, [
      ['stage-one', '2026-10-01T10-00-00Z', URL3],
    ]);
    const { record } = program(repo);
    expect(record.observations).toMatchObject({
      outcome: 'several',
      pr: null,
      candidates: [
        { url: URL4, state: 'draft' },
        { url: 'https://github.com/acme/widget/pull/5', state: 'ready' },
      ],
    });
  });
});

describe('program — a failed observation is unverified, never a skip', () => {
  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr program` computes the architect readout's PR facts :: A failed query still surfaces the PR
  it('gh absent with a URL-bearing record: proceed with that URL, state unverified, and the two human acts', () => {
    const repo = programRepo('absent', [['stage-one', '2026-10-01T10-00-00Z', URL3]]);
    const { record } = program(repo);
    expect(record).toMatchObject({ action: 'proceed', reason: null });
    expect(record.observations).toMatchObject({ outcome: 'gh-absent', pr: { url: URL3, state: 'unverified' } });
    expect(record.human_acts.map((a) => a.argv)).toEqual([
      ['gh', 'pr', 'ready', '--repo', 'acme/widget', URL3],
      ['gh', 'pr', 'merge', '--repo', 'acme/widget', URL3],
    ]);
  });

  it('an auth failure on the validation is unobserved: the record\'s PR, unverified', () => {
    const repo = programRepo({ prs: { [URL3]: { error: 'HTTP 401: Bad credentials' } } }, [['stage-one', '2026-10-01T10-00-00Z', URL3]]);
    const { record } = program(repo);
    expect(record.observations).toMatchObject({ outcome: 'unobserved', pr: { url: URL3, state: 'unverified' } });
    expect(record.human_acts).toHaveLength(2);
  });

  it('a failed fall-through query is unobserved too', () => {
    const repo = programRepo({ prs: { [URL3]: pr(URL3, { state: 'MERGED' }) }, prList: null }, [['stage-one', '2026-10-01T10-00-00Z', URL3]]);
    const { record } = program(repo);
    expect(record.observations).toMatchObject({ invalidated: 'merged', outcome: 'unobserved' });
  });
});
