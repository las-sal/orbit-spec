/**
 * The instrument proves it can FAIL (rc12-engine-owned-choreography, task 1.3): a printed step
 * git refuses fails the segment runner, and a write inside the engine fails the allowlist
 * assertion. Without these, a green suite would say nothing about either property.
 */
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import type { PrRecord } from '../../../src/core/pr/record.js';
import { PrRefusedError, PrRunner } from '../../../src/core/pr/run.js';
import { prSelect } from '../../../src/core/pr/select.js';
import { assertAllowlist, ctxFor, engine, runSegments } from '../../integration/pr-lifecycle/instrument.js';
import { orbitRepo } from './fixtures.js';

describe('the instrument can fail', () => {
  // @scenario behaviour orbit-pr-lifecycle :: Printed commands are proven by execution :: A printed step git refuses fails the suite
  it('a printed switch git refuses fails the segment runner, naming the step and git\'s message', () => {
    const repo = orbitRepo('per-proposal');
    // An injected select record: a switch to a branch that exists nowhere, without -c.
    const injected: PrRecord = {
      subcommand: 'select',
      action: 'proceed',
      reason: null,
      degraded: null,
      observations: {},
      segments: [{ inputs: [], steps: [{ step: 'switch', argv: ['git', 'switch', 'no-such-branch'] }] }],
      human_acts: [],
    };
    expect(() => runSegments(repo, injected)).toThrow(/step 'switch' \(git switch no-such-branch\) failed: .*no-such-branch/);
  });

  // @scenario behaviour orbit-pr-lifecycle :: Printed commands are proven by execution :: A write inside the engine fails the suite
  it.each([
    [['git', 'commit', '--allow-empty', '-q', '-m', 'x']],
    [['git', 'push', '-q', 'origin', 'main']],
    [['git', 'switch', '-q', '-c', 'sneaky']],
    [['gh', 'pr', 'create', '--repo', 'acme/widget', '--draft', '--base', 'main', '--head', 'x', '--title', 't', '--body', 'b']],
  ])('a subcommand made to invoke %j fails the allowlist assertion, naming it', (argv) => {
    const repo = orbitRepo('per-proposal');
    expect(() =>
      engine(repo, (ctx) => {
        // An engine module that bypassed the runner and spawned a write through PATH.
        spawnSync(argv[0], argv.slice(1), { cwd: ctx.projectRoot, env: ctx.env, encoding: 'utf-8' });
        return { subcommand: 'select', action: 'skip', reason: { code: 'x', detail: {} }, degraded: null, observations: {}, segments: [], human_acts: [] };
      })
    ).toThrow(new RegExp(`outside the read-only allowlist: ${argv[0]} ${argv[1]}`));
  });

  it('an off record that probed anything fails', () => {
    const repo = orbitRepo('never');
    expect(() =>
      engine(repo, (ctx) => {
        spawnSync('git', ['remote'], { cwd: ctx.projectRoot, env: ctx.env });
        return { subcommand: 'select', action: 'off', reason: null, degraded: null, observations: {}, segments: [], human_acts: [] };
      })
    ).toThrow(/an 'off' record ran 1 git/);
  });

  it('the engine runner itself refuses a write before spawning it', () => {
    const repo = orbitRepo('per-proposal');
    const run = new PrRunner(ctxFor(repo));
    const mark = repo.mark();
    expect(() => run.git('commit', '-m', 'x')).toThrow(PrRefusedError);
    expect(() => run.git('fetch', 'origin')).toThrow(PrRefusedError); // the unbounded form
    expect(() => run.git('symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main')).toThrow(PrRefusedError);
    expect(() => run.gh('pr', 'create')).toThrow(PrRefusedError);
    expect(() => run.gh('--version')).toThrow(PrRefusedError);
    expect(repo.since(mark)).toEqual({ git: [], gh: [] });
  });

  it('a positive control: a real select records reads only, and every one passes the allowlist', () => {
    const repo = orbitRepo('per-proposal');
    const { record, calls } = engine(repo, (ctx) => prSelect(ctx, 'add-thing'));
    expect(record.action).toBe('proceed');
    expect(calls.git.map((c) => c.args[0])).toContain('fetch');
    expect(calls.gh.map((c) => c.args.slice(0, 2).join(' '))).toEqual(['repo view']);
  });

  it('the allowlist accepts every read form it names', () => {
    expect(() =>
      assertAllowlist({
        git: [
          { args: ['remote'] },
          { args: ['config', '--get', 'remote.origin.url'] },
          { args: ['ls-remote', '--heads', 'origin', 'refs/heads/main'] },
          { args: ['fetch', '--no-tags', '--refmap=', 'origin', '+refs/heads/main:refs/remotes/origin/main'] },
          { args: ['branch', '--show-current'] },
        ],
        gh: [{ args: ['repo', 'view', 'acme/widget', '--json', 'defaultBranchRef'] }, { args: ['pr', 'list', '--repo', 'acme/widget'] }],
      })
    ).not.toThrow();
    expect(() =>
      assertAllowlist({ git: [{ args: ['fetch', '--no-tags', '--refmap=', 'origin', '+refs/heads/main:refs/heads/main'] }], gh: [] })
    ).toThrow(/fetch --no-tags --refmap= origin \+refs\/heads\/main:refs\/heads\/main/);
    // Without the empty refmap the configured refspec applies too: not the allowlisted form.
    expect(() =>
      assertAllowlist({ git: [{ args: ['fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main'] }], gh: [] })
    ).toThrow(/outside the read-only allowlist/);
  });
});
