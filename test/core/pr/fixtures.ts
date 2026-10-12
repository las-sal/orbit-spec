/**
 * Orbit-configured repositories for the `orbit pr` cases: the harness's real repository and bare
 * remote, with `orbit/config.yaml` carrying the `pr:` regime, committed and pushed so every
 * branch the cases cut carries it.
 */
import { afterAll, afterEach, expect } from 'vitest';
import { makeRepo, type Repo } from '../../integration/pr-lifecycle/harness.js';
import { assertAllowlist, ENGINE_CALLS } from '../../integration/pr-lifecycle/instrument.js';

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

/**
 * Exit (3)'s check over the WHOLE file: every `orbit pr` call any case made, through `engine()`,
 * held to the allowlist once more after the last case (each call is also asserted as it returns).
 */
afterAll(() => {
  for (const { calls } of ENGINE_CALLS) assertAllowlist(calls);
  expect(ENGINE_CALLS.length).toBeGreaterThan(0);
});

export type Regime = 'never' | 'per-proposal' | 'per-architecture';

export function orbitRepo(regime: Regime, opts: Parameters<typeof makeRepo>[0] = {}): Repo {
  const { repo, cleanup } = makeRepo(opts);
  cleanups.push(cleanup);
  repo.write('orbit/config.yaml', `schema: spec-driven\npr: ${regime}\n`);
  repo.commitAll('orbit config');
  if (opts.remote !== 'none') {
    const remote = opts.remote === 'multiple' ? 'upstream' : 'origin';
    repo.git('push', '-q', remote, repo.defaultBranch);
  }
  return repo;
}

/** A staging exploration (untracked, the ordinary state) optionally citing an architecture doc. */
export function stage(repo: Repo, name: string, doc?: string): void {
  repo.write(`orbit/explore/${name}/explore.md`, `# ${name}\n`);
  repo.write(
    `orbit/explore/${name}/.openspec.yaml`,
    doc ? `architecture:\n  doc: ${doc}\n  stage: ${name}\n` : 'status: exploring\n'
  );
}

/** An active change directory (as propose generates it), optionally citing a doc. */
export function change(repo: Repo, name: string, doc?: string): void {
  repo.write(`orbit/changes/${name}/proposal.md`, `## Why\n\n${name}\n`);
  repo.write(
    `orbit/changes/${name}/.openspec.yaml`,
    `schema: spec-driven\ncreated: 2026-10-12\n${doc ? `architecture:\n  doc: ${doc}\n  stage: ${name}\n` : ''}`
  );
}

export function branchExists(repo: Repo, b: string): boolean {
  return repo.git('rev-parse', '--verify', '-q', `refs/heads/${b}`).status === 0;
}
