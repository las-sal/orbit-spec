/**
 * The commit step's flows over real repositories (chained-review-commit, tasks 2.4–2.6): the step at the defaults,
 * the step run by its body's procedure, a chained blind pair arriving after it, and the archive's second commit.
 * The procedure is `COMMIT_STEP`'s: `orbit pr commit`, then the printed segment with the message written OUTSIDE the
 * working tree; the pair's preflight is the review body's (`git status --porcelain`, any output refuses the pair).
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { composeChainObject } from '../../../src/core/chain.js';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
import type { RunnerResolution } from '../../../src/core/external-runner.js';
import { prCommit } from '../../../src/core/pr/commit.js';
import type { PrRecord } from '../../../src/core/pr/record.js';
import { prTail } from '../../../src/core/pr/tail.js';
import { getReviewSkillTemplate } from '../../../src/core/templates/workflows/review.js';
import type { Repo } from '../../integration/pr-lifecycle/harness.js';
import { authorFile, engine, runSegments } from '../../integration/pr-lifecycle/instrument.js';
import { change, orbitRepo } from './fixtures.js';

const NAME = 'add-thing';
const URL7 = 'https://github.com/acme/widget/pull/7';
const RUNS = `orbit/changes/${NAME}/.orbit-runs`;
const ARCHIVED = `orbit/changes/archive/2026-11-12-${NAME}`;
const REACHABLE: RunnerResolution = { runner: { form: 'preset', name: 'codex', argv: ['codex'], reachable: true }, warnings: [] };
const PAIR = `/orbit:review --as system --reviewer blind-pair ${NAME}`;
const BOTH = 'commit: true\npush: true\n';
// Later than the propose emit's real timestamp, so each session's record is the trail head.
const T = (n: number) => `2099-01-01T10-00-0${n}Z`;

/** An attached change on its pushed branch, as propose leaves it, with `settings` committed in the config. */
function attached(settings = ''): Repo {
  const repo = orbitRepo('per-proposal', { gh: { prs: { [URL7]: { url: URL7, state: 'OPEN', isDraft: true, headRefName: NAME, baseRefName: 'main' } } } });
  repo.write('orbit/config.yaml', `schema: spec-driven\npr: per-proposal\n${settings}`);
  repo.commitAll('settings');
  repo.git('push', '-q', 'origin', 'main');
  repo.git('switch', '-q', '-c', NAME);
  change(repo, NAME);
  composeAndWriteEmit(
    'propose',
    { change: NAME },
    { final_assessment: 'Proposed.', model: null, pr_attachment: { branch: NAME, granularity: 'per-proposal', url: URL7, state: 'draft' } },
    { projectRoot: repo.dir }
  );
  repo.commitAll('propose');
  repo.git('push', '-q', '-u', 'origin', NAME);
  return repo;
}

/** A session's work: a code edit and the command's run record, uncommitted. */
function session(repo: Repo, command: string, n: number): void {
  repo.write('src/thing.ts', `export const n = ${n};\n`);
  repo.write(`${RUNS}/${command}-${T(n)}.json`, JSON.stringify({ command, timestamp: T(n), change: NAME }));
}

/** `COMMIT_STEP`'s procedure: call `orbit pr commit`, then run what it printed, the message outside the tree. */
function commitStep(repo: Repo, message: string): { record: PrRecord; messageFile: string | null } {
  const { record } = engine(repo, (ctx) => prCommit(ctx, NAME));
  let messageFile: string | null = null;
  if (record.action === 'proceed' && record.segments.length > 0) {
    runSegments(repo, record, (i) => {
      if (!record.segments[i].inputs.includes('<message-file>')) return {};
      messageFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-commit-step-')), 'message.txt');
      fs.writeFileSync(messageFile, `${message}\n`);
      return { '<message-file>': messageFile };
    });
  }
  return { record, messageFile };
}

const porcelain = (repo: Repo) => repo.git('status', '--porcelain', '--untracked-files=all').stdout;
const rev = (repo: Repo, ref: string) => repo.git('rev-parse', '-q', '--verify', ref).stdout.trim();
const changed = (repo: Repo, ref = 'HEAD') => repo.git('show', '--name-only', '--format=', ref).stdout.trim().split('\n').filter(Boolean).sort();

/** The review body's pair preflight, as its Step states it: ANY porcelain output refuses the pair. */
const PAIR_PREFLIGHT = 'Run `git status --porcelain`. ANY output refuses the pair: write NOTHING';
function pairLaunches(repo: Repo, n: number): boolean {
  if (porcelain(repo) !== '') return false;
  // The pair's records: its launch record (never a trail head) and its fresh member's pass.
  repo.write(`${RUNS}/review-external-${T(n)}.json`, JSON.stringify({ command: 'review-external', mode: 'system', pair: true }));
  repo.write(`${RUNS}/review-system-${T(n + 1)}.json`, JSON.stringify({ command: 'review', mode: 'system', reviewer_class: 'fresh' }));
  return true;
}

const chain = (repo: Repo, opts: { chainRan?: string; chainHead?: string } = {}) =>
  composeChainObject(repo.dir, path.join(repo.dir, 'orbit/changes', NAME), PAIR, { runner: REACHABLE, ...opts });

describe('the commit step at the defaults', () => {
  // @scenario behaviour orbit-conventions :: The commit step closes each carrying body :: At the defaults the step prints nothing
  it('neither setting: off after no git call, nothing run, the tree as the session left it', () => {
    const repo = attached();
    session(repo, 'apply', 1);
    const before = porcelain(repo);
    const { record, calls } = engine(repo, (ctx) => prCommit(ctx, NAME));
    expect(record).toMatchObject({ action: 'off', segments: [] });
    expect(calls).toEqual({ git: [], gh: [] });
    expect(commitStep(repo, 'unused').messageFile).toBeNull();
    expect(porcelain(repo)).toBe(before);
  });
});

describe("the commit step run by its body's procedure", () => {
  it('leaves no message file in the commit and a clean tree, and the remote carries the commit', () => {
    const repo = attached(BOTH);
    session(repo, 'apply', 1);
    const { record, messageFile } = commitStep(repo, `Apply: ${NAME} — tasks 1.1–1.4`);
    expect(record.observations.untracked).toEqual([`${RUNS}/apply-${T(1)}.json`, 'src/thing.ts']);
    expect(messageFile).not.toBeNull();
    expect(path.relative(repo.dir, messageFile!).startsWith('..')).toBe(true);
    expect(changed(repo)).toEqual([`${RUNS}/apply-${T(1)}.json`, 'src/thing.ts']);
    expect(porcelain(repo)).toBe('');
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));
  });

  // @scenario behaviour orbit-conventions :: The commit step closes each carrying body :: The step commits before the chain read
  it("a walk's edits are committed before the chain end step reads the chain object", () => {
    const repo = attached(`commit: true\nchain:\n  review-external: true\n`);
    session(repo, 'address-reviews', 2);
    commitStep(repo, `Walk: ${NAME}`);
    expect(porcelain(repo)).toBe('');
    // The read that follows the step sees the walk's record as the head, on a committed tree.
    const read = chain(repo);
    expect(read).toMatchObject({ may_run: true, head: T(2) });
    expect(changed(repo)).toContain(`${RUNS}/address-reviews-${T(2)}.json`);
  });
});

describe('a chained blind pair after the commit step (No-chaining contract)', () => {
  it("the pair's preflight is the review body's porcelain check", () => {
    const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'blind-pair.md');
    expect(ref?.content).toContain(PAIR_PREFLIGHT);
  });

  // @scenario behaviour orbit-conventions :: No-chaining contract :: A granted commit reaches a chained external review committed
  it('both settings granted: the step commits and pushes, the pair launches, and the chain reads no no-progress', () => {
    const repo = attached(`${BOTH}chain:\n  review-external: true\n`);
    session(repo, 'apply', 1);
    commitStep(repo, `Apply: ${NAME}`);
    expect(porcelain(repo)).toBe('');
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));

    const before = chain(repo);
    expect(before).toMatchObject({ may_run: true, head: T(1) });
    expect(pairLaunches(repo, 2)).toBe(true);
    const after = chain(repo, { chainRan: before.next!, chainHead: before.head! });
    expect(after.why).not.toBe('no-progress');
    expect(after.head).toBe(T(3));
  });

  it('without the commit setting the named limit still holds: the pair refuses and the chain stops on no-progress', () => {
    const repo = attached(`chain:\n  review-external: true\n`);
    session(repo, 'apply', 1);
    expect(commitStep(repo, 'unused').record.action).toBe('off');
    const before = chain(repo);
    expect(pairLaunches(repo, 2)).toBe(false);
    expect(chain(repo, { chainRan: before.next!, chainHead: before.head! })).toMatchObject({ may_run: false, why: 'no-progress' });
  });
});

describe("the archive's second commit (task 2.6)", () => {
  /** Archive the attached change: move it, write the emit, and leave an unrelated tracked edit in the tree. */
  function archive(repo: Repo): void {
    repo.write('README.md', '# an unrelated tracked edit\n');
    fs.mkdirSync(path.join(repo.dir, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(path.join(repo.dir, `orbit/changes/${NAME}`), path.join(repo.dir, ARCHIVED));
    repo.write(
      `${ARCHIVED}/.orbit-runs/archive-${T(5)}.json`,
      JSON.stringify({ command: 'archive', timestamp: T(5), change: NAME, kind: 'lifecycle', sync_specs: { ran: true, capabilities_updated: [] }, pr_url: URL7, pr_state: 'draft' })
    );
    const { record } = engine(repo, (ctx) => prTail(ctx, NAME, { outcome: 'valid' }));
    expect(record.action).toBe('proceed');
    runSegments(repo, record, () => ({
      '<message-file>': authorFile(repo, 'tail-msg.txt', `Archive: ${NAME}\n`),
      '<body-file>': authorFile(repo, 'landmark.md', 'What landed.\n'),
    }));
  }

  // @scenario behaviour orbit-conventions :: The commit step closes each carrying body :: The archive's second commit carries what the tail left
  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr commit` computes the closing commit step :: An archived change resolves
  it("the tail's commit leaves the unrelated edit out; the step on the archived change commits it", () => {
    const repo = attached(BOTH);
    archive(repo);
    expect(changed(repo)).not.toContain('README.md');
    expect(porcelain(repo)).toBe(' M README.md\n');

    const { record } = commitStep(repo, `Archive: ${NAME} — the edits the tail left`);
    expect(record.observations).toMatchObject({ branch: NAME, change_dir: ARCHIVED });
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push']);
    expect(changed(repo)).toEqual(['README.md']);
    expect(porcelain(repo)).toBe('');
    expect(rev(repo, `refs/remotes/origin/${NAME}`)).toBe(rev(repo, 'HEAD'));
  });

  it('without commit: true the step is off and the edit stays uncommitted, as today', () => {
    const repo = attached();
    archive(repo);
    const { record, calls } = engine(repo, (ctx) => prCommit(ctx, NAME));
    expect(record.action).toBe('off');
    expect(calls).toEqual({ git: [], gh: [] });
    expect(porcelain(repo)).toBe(' M README.md\n');
  });
});
