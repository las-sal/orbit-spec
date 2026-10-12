/**
 * `orbit pr tail` (rc12-engine-owned-choreography, task 4.4): every `--outcome` row against a
 * real archived change — the filesystem move, a modified and an ADDED synced capability beside
 * an unrelated baseline edit, the written archive emit — with the segment executed and the
 * human acts never run.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
import { PrUsageError } from '../../../src/core/pr/record.js';
import { prTail } from '../../../src/core/pr/tail.js';
import type { GhScript, Repo } from '../../integration/pr-lifecycle/harness.js';
import { assertHumanActsUnrun, authorFile, ctxFor, engine, runSegments } from '../../integration/pr-lifecycle/instrument.js';
import { change, orbitRepo } from './fixtures.js';

const URL7 = 'https://github.com/acme/widget/pull/7';
const ARCHIVED = 'orbit/changes/archive/2026-10-12-add-thing';

interface Setup {
  gh?: GhScript | 'absent';
  attachment?: Record<string, unknown> | null;
  emit?: { pr_url?: string; pr_state?: string };
  branch?: string;
  regime?: 'per-proposal' | 'per-architecture';
  /** A citation in the change's metadata the attachment never recorded. */
  doc?: string;
}

/**
 * An attached change, proposed and pushed on its branch, then archived: the specs synced
 * (`widget` modified, `gadget` ADDED), the change MOVED on the filesystem, and the archive emit
 * written. `other`'s spec carries an unrelated edit the sync never made.
 */
function archived(s: Setup = {}): Repo {
  const branch = s.branch ?? 'add-thing';
  const repo = orbitRepo(s.regime ?? 'per-proposal', { gh: s.gh ?? {} });
  repo.write('orbit/specs/widget/spec.md', '# widget\n');
  repo.write('orbit/specs/other/spec.md', '# other\n');
  repo.commitAll('baseline specs');
  repo.git('push', '-q', 'origin', 'main');
  repo.git('switch', '-q', '-c', branch);
  change(repo, 'add-thing', s.doc);
  const attachment = s.attachment === undefined ? { branch, granularity: 'per-proposal', url: URL7, state: 'draft' } : s.attachment;
  composeAndWriteEmit(
    'propose',
    { change: 'add-thing' },
    { final_assessment: 'Proposed.', model: null, ...(attachment ? { pr_attachment: attachment } : {}) },
    { projectRoot: repo.dir }
  );
  repo.commitAll('propose');
  repo.git('push', '-q', '-u', 'origin', branch);

  // The archive: sync, move, emit.
  repo.write('orbit/specs/widget/spec.md', '# widget\n\nsynced\n');
  repo.write('orbit/specs/gadget/spec.md', '# gadget\n');
  repo.write('orbit/specs/other/spec.md', '# other\n\nan unrelated edit\n');
  fs.mkdirSync(path.join(repo.dir, 'orbit/changes/archive'), { recursive: true });
  fs.renameSync(path.join(repo.dir, 'orbit/changes/add-thing'), path.join(repo.dir, ARCHIVED));
  const emit = s.emit ?? { pr_url: URL7, pr_state: 'draft' };
  repo.write(
    `${ARCHIVED}/.orbit-runs/archive-2026-10-12T10-00-00Z.json`,
    JSON.stringify({
      command: 'archive',
      timestamp: '2026-10-12T10:00:00Z',
      change: 'add-thing',
      kind: 'lifecycle',
      sync_specs: { ran: true, skipped_reason: null, capabilities_updated: ['widget', 'gadget'], added: 1, modified: 1, removed: 0, renamed: 0 },
      ...emit,
    })
  );
  return repo;
}

function tail(repo: Repo, outcome: string, include?: string[]) {
  return engine(repo, (ctx) => prTail(ctx, 'add-thing', { outcome, include }));
}

function author(repo: Repo) {
  return () => ({
    '<message-file>': authorFile(repo, 'msg.txt', 'Archive: add-thing\n'),
    '<body-file>': authorFile(repo, 'landmark.md', 'What landed.\n'),
  });
}

describe('tail — the gate is the attachment', () => {
  it('no attachment on the archived trail is off whatever --outcome says, and probes nothing', () => {
    const repo = archived({ attachment: null, emit: {} });
    const { record, calls } = tail(repo, 'valid');
    expect(record.action).toBe('off');
    expect(calls).toEqual({ git: [], gh: [] });
  });
});

describe('tail — the --outcome table', () => {
  it('valid: proceed; commit, push, rewrite, ready; the segment runs and the human acts do not', () => {
    const repo = archived();
    const { record } = tail(repo, 'valid');
    expect(record).toMatchObject({ action: 'proceed', degraded: null, reason: null });
    const seg = record.segments[0];
    expect(seg.inputs).toEqual(['<message-file>', '<body-file>']);
    expect(seg.steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push', 'rewrite', 'ready']);
    expect(seg.steps.slice(3).map((s) => s.argv)).toEqual([
      ['gh', 'pr', 'edit', '--repo', 'acme/widget', URL7, '--body-file', '<body-file>'],
      ['gh', 'pr', 'ready', '--repo', 'acme/widget', URL7],
    ]);
    expect(record.human_acts).toEqual([
      { act: 'merge', argv: ['gh', 'pr', 'merge', '--repo', 'acme/widget', URL7] },
      { act: 'return-fetch', argv: ['git', 'fetch', 'origin'] },
      { act: 'return-switch', argv: ['git', 'switch', 'main'] },
      { act: 'return-fast-forward', argv: ['git', 'merge', '--ff-only', 'origin/main'] },
    ]);

    const { executed } = runSegments(repo, record, author(repo));
    expect(repo.git('rev-parse', 'origin/add-thing').stdout).toBe(repo.git('rev-parse', 'add-thing').stdout);
    // The tail never observed the PR again: the only pr calls are the two the segment ran.
    expect(repo.ghLog().filter((c) => c.args[0] === 'pr').map((c) => c.args[1])).toEqual(['edit', 'ready']);
    assertHumanActsUnrun(repo, record, executed);
    expect(repo.head()).toBe('add-thing');
  });

  // @scenario behaviour orbit-pr-lifecycle :: Config selects the regime; citation selects the target :: Citation edited after propose is a no-op
  it('a per-change attachment whose change now cites a doc under per-architecture: the tail acts on the per-change PR and seeks no program PR', () => {
    const repo = archived({ regime: 'per-architecture', doc: 'later-program' });
    const { record, calls } = tail(repo, 'valid');
    expect(record).toMatchObject({ action: 'proceed', degraded: null });
    expect(record.observations.attachment).toEqual({ branch: 'add-thing', granularity: 'per-proposal', url: URL7, state: 'draft' });
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push', 'rewrite', 'ready']);
    expect(record.segments[0].steps[2].argv).toEqual(['git', 'push', 'origin', 'add-thing']);
    expect(calls.gh.some((c) => c.args[1] === 'list')).toBe(false);
    runSegments(repo, record, author(repo));
    expect(repo.ghLog().filter((c) => c.args[0] === 'pr').map((c) => c.args[1])).toEqual(['edit', 'ready']);
    expect(repo.git('rev-parse', '--verify', '-q', 'refs/heads/later-program').status).not.toBe(0);
  });

  it('valid with pr_state ready prints no flip', () => {
    const repo = archived({ emit: { pr_url: URL7, pr_state: 'ready' } });
    const { record } = tail(repo, 'valid');
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push', 'rewrite']);
  });

  it('discovered runs the PR steps against the emit\'s pr_url', () => {
    const repo = archived({ attachment: { branch: 'add-thing', granularity: 'per-proposal' } });
    const { record } = tail(repo, 'discovered');
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push', 'rewrite', 'ready']);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr tail` computes the archive tail :: A positive invalidation still lands the archive
  it.each(['closed', 'merged', 'retargeted', 'head-mismatch', 'repository-mismatch', 'not-found'])(
    '%s: proceed, degraded with the outcome as code; commit and push only, and they land',
    (outcome) => {
      const repo = archived({ emit: { pr_url: URL7 } });
      const { record } = tail(repo, outcome);
      expect(record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: outcome }, human_acts: [] });
      expect(record.segments[0].inputs).toEqual(['<message-file>']);
      expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push']);
      runSegments(repo, record, author(repo));
      expect(repo.ghLog().some((c) => c.args[1] === 'edit' || c.args[1] === 'ready')).toBe(false);
      expect(repo.git('rev-parse', 'origin/add-thing').stdout).toBe(repo.git('rev-parse', 'add-thing').stdout);
    }
  );

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr tail` computes the archive tail :: A URL-less attachment's fallback miss still lands the archive
  it('none and unobserved over the SAME emit: none degrades the PR half, unobserved skips the tail', () => {
    const urlless = { attachment: { branch: 'add-thing', granularity: 'per-proposal' }, emit: {} };
    const repo = archived(urlless);
    const { record: none } = tail(repo, 'none');
    expect(none).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: 'none' } });
    expect(none.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push']);
    const { record: unobserved } = tail(repo, 'unobserved');
    expect(unobserved).toMatchObject({ action: 'skip', reason: { code: 'unobserved' }, segments: [] });
  });

  it('several degrades; gh-absent skips', () => {
    const repo = archived({ attachment: { branch: 'add-thing', granularity: 'per-proposal' }, emit: {} });
    expect(tail(repo, 'several').record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: 'several' } });
    expect(tail(repo, 'gh-absent').record).toMatchObject({ action: 'skip', reason: { code: 'gh-absent' } });
  });

  // @scenario behaviour orbit-pr-lifecycle :: The `orbit pr` command observes and prints; it never writes :: An absent gh is its own fact
  it('gh absent at the tail, after a valid preflight, skips the whole tail before anything is staged', () => {
    const repo = archived({ gh: 'absent' });
    const { record } = tail(repo, 'valid');
    expect(record).toMatchObject({ action: 'skip', reason: { code: 'gh-absent' }, segments: [] });
    expect((record.observations.resolution as { gh: string }).gh).toBe('absent');
  });

  it('a code that disagrees with the emit, or one outside the set, is a usage error naming both', () => {
    const repo = archived({ emit: { pr_url: URL7 } }); // the answered row's shape
    expect(() => prTail(ctxFor(repo), 'add-thing', { outcome: 'valid' })).toThrow(
      /--outcome 'valid' needs an archive emit carrying `pr_url` and `pr_state`, but .*archive-2026-10-12T10-00-00Z\.json carries `pr_url`/
    );
    expect(() => prTail(ctxFor(repo), 'add-thing', { outcome: 'none' })).toThrow(PrUsageError);
    expect(() => prTail(ctxFor(repo), 'add-thing', { outcome: 'missing' })).toThrow(/not in preflight's closed set/);
    expect(() => prTail(ctxFor(repo), 'add-thing', {})).toThrow(/--outcome <code> is required/);
    expect(() => prTail(ctxFor(repo), 'no-such-change', { outcome: 'valid' })).toThrow(/no archived change/);
  });
});

describe('tail — the commit scope', () => {
  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr tail` computes the archive tail :: The scope is what the sync reported, including a new capability
  it('the scope is the synced specs (one ADDED, untracked), the pre-move deletions, the archived dir — never the unrelated spec edit', () => {
    const repo = archived();
    repo.git('add', 'orbit/specs/other/spec.md'); // the user had it staged, even
    const { record } = tail(repo, 'valid');
    const scope = record.observations.scope as string[];
    expect(scope).toContain('orbit/specs/widget/spec.md');
    expect(scope).toContain('orbit/specs/gadget/spec.md');
    expect(scope).toContain('orbit/changes/add-thing/proposal.md');
    expect(scope).toContain(ARCHIVED);
    expect(scope).not.toContain('orbit/specs/other/spec.md');
    expect(record.observations.unrelated_staged).toEqual(['orbit/specs/other/spec.md']);

    runSegments(repo, record, author(repo));
    const committed = repo.git('show', '--name-status', '--format=', 'HEAD').stdout;
    expect(committed).toMatch(/^M\torbit\/specs\/widget\/spec\.md$/m);
    expect(committed).toMatch(/^A\torbit\/specs\/gadget\/spec\.md$/m);
    expect(committed).toMatch(/^D\torbit\/changes\/add-thing\/proposal\.md$|^R\d*\torbit\/changes\/add-thing\/proposal\.md/m);
    expect(committed).not.toMatch(/other/);
    expect(repo.git('diff', '--cached', '--name-only').stdout.trim()).toBe('orbit/specs/other/spec.md');
    expect(repo.git('status', '--porcelain', '--', 'orbit/changes').stdout.trim()).toBe('');
  });

  it('a move already STAGED (git add -A orbit/changes, this repo\'s archive practice): the pre-move deletions still reach the commit, and the pushed tree carries the change once', () => {
    const repo = archived();
    repo.git('add', '-A', 'orbit/changes');
    expect(repo.git('ls-files', '--', 'orbit/changes/add-thing/').stdout).toBe(''); // the index alone sees nothing
    const { record } = tail(repo, 'valid');
    const scope = record.observations.scope as string[];
    expect(scope).toContain('orbit/changes/add-thing/proposal.md');
    const stage = record.segments[0].steps.find((s) => s.step === 'stage')!;
    expect(stage.argv).not.toContain('orbit/changes/add-thing/proposal.md'); // git add would refuse it
    expect(record.observations.unrelated_staged).toEqual([]);

    runSegments(repo, record, author(repo));
    expect(repo.git('ls-tree', '-r', '--name-only', 'origin/add-thing', '--', 'orbit/changes/add-thing/').stdout.trim()).toBe('');
    expect(repo.git('ls-tree', '-r', '--name-only', 'origin/add-thing', '--', ARCHIVED).stdout).toContain(`${ARCHIVED}/proposal.md`);
    expect(repo.git('status', '--porcelain', '--', 'orbit/changes').stdout.trim()).toBe('');
  });

  it('--include adds the at-archive-note edits', () => {
    const repo = archived();
    repo.write('orbit/architecture/notes.md', 'at-archive note\n');
    const { record } = tail(repo, 'valid', ['orbit/architecture/notes.md']);
    expect(record.observations.scope).toContain('orbit/architecture/notes.md');
    runSegments(repo, record, author(repo));
    expect(repo.git('show', '--name-only', '--format=', 'HEAD').stdout).toContain('orbit/architecture/notes.md');
  });
});

describe('tail — the HEAD precondition', () => {
  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr tail` computes the archive tail :: Archiving from the wrong branch prints no write
  it('HEAD on the default, the branch only on the remote: skip head-mismatch, the fetch + tracking-switch recovery, no segments', () => {
    const repo = archived();
    repo.git('switch', '-q', 'main');
    repo.git('branch', '-q', '-D', 'add-thing');
    const { record } = tail(repo, 'valid');
    expect(record).toMatchObject({ action: 'skip', segments: [] });
    expect(record.reason).toEqual({
      code: 'head-mismatch',
      detail: {
        head: 'main',
        branch: 'add-thing',
        recovery: { case: 'remote-only', argv: [['git', 'fetch', 'origin'], ['git', 'switch', '-c', 'add-thing', '--track', 'origin/add-thing']] },
      },
    });
  });

  it('the branch existing locally recovers by a plain switch', () => {
    const repo = archived();
    repo.git('switch', '-q', 'main');
    const { record } = tail(repo, 'valid');
    expect((record.reason!.detail as { recovery: unknown }).recovery).toEqual({ case: 'local', argv: [['git', 'switch', 'add-thing']] });
  });

  it('the branch absent everywhere: no switch recovers it', () => {
    const repo = archived();
    repo.git('switch', '-q', 'main');
    repo.git('branch', '-q', '-D', 'add-thing');
    repo.git('push', '-q', 'origin', '--delete', 'add-thing');
    const { record } = tail(repo, 'valid');
    expect((record.reason!.detail as { recovery: unknown }).recovery).toEqual({ case: 'absent', argv: [] });
  });
});

describe('tail — the program granularity', () => {
  const program = { branch: 'my-program', granularity: 'per-architecture', doc: 'my-program', url: URL7, state: 'draft' };

  it('appends to the current body (read, never re-observed state), and never flips; no human acts at a stage', () => {
    const current = '## Program intent\n\n### Stage one\n';
    const repo = archived({
      branch: 'my-program',
      attachment: program,
      gh: { prs: { [URL7]: { url: URL7, state: 'OPEN', isDraft: true, headRefName: 'my-program', baseRefName: 'main', body: current } } },
    });
    const { record, calls } = tail(repo, 'valid');
    expect(record.observations.current_body).toBe(current);
    expect(calls.gh.find((c) => c.args[0] === 'pr' && c.args[1] === 'view')!.args).toEqual(['pr', 'view', '--repo', 'acme/widget', URL7, '--json', 'body']);
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push', 'append']);
    expect(record.human_acts).toEqual([]);
    const { executed } = runSegments(repo, record, author(repo));
    expect(repo.ghLog().some((c) => c.args[1] === 'ready')).toBe(false);
    assertHumanActsUnrun(repo, record, executed);
  });

  it('a body that cannot be read degrades the PR half rather than erase the earlier entries', () => {
    const repo = archived({ branch: 'my-program', attachment: program, gh: { prs: { [URL7]: { error: 'HTTP 502' } } } });
    const { record } = tail(repo, 'valid');
    expect(record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: 'body-unobserved' } });
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push']);
  });
});
