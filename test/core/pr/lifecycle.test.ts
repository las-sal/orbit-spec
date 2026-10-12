/**
 * The whole per-proposal PR lifecycle, end to end, through `orbit pr` (rc12-engine-owned-
 * choreography): select → switch → generate → publish (land, open, emit, record) → preflight →
 * archive (sync, move, emit) → tail. The `git` shim and the `gh` stub log every invocation from
 * every caller, so the case can partition the logs: what ran inside an engine call (reads, each
 * allowlisted) and what ran outside one (exactly the printed segment steps the body ran).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
import { prPreflight } from '../../../src/core/pr/preflight.js';
import { prPublish } from '../../../src/core/pr/publish.js';
import type { PrRecord } from '../../../src/core/pr/record.js';
import { prSelect } from '../../../src/core/pr/select.js';
import { prTail } from '../../../src/core/pr/tail.js';
import type { Invocation, Repo } from '../../integration/pr-lifecycle/harness.js';
import { allowedGh, allowedGit, authorFile, engine, runSegments } from '../../integration/pr-lifecycle/instrument.js';
import { change, orbitRepo } from './fixtures.js';

const URL1 = 'https://github.com/acme/widget/pull/1';

describe('the PR lifecycle end to end', () => {
  // @scenario behaviour orbit-pr-lifecycle :: PR actions are workflow-body choreography (zero engine git) :: Engine untouched by PR flows
  it('every git/gh write traces to a printed segment step; every engine invocation is an allowlisted read', () => {
    const repo: Repo = orbitRepo('per-proposal', {
      gh: { prs: { [URL1]: { url: URL1, state: 'OPEN', isDraft: true, headRefName: 'add-thing', baseRefName: 'main' } } },
    });
    repo.write('orbit/specs/widget/spec.md', '# widget\n');
    repo.commitAll('baseline');
    repo.git('push', '-q', 'origin', 'main');
    const start = repo.mark();
    const engineCalls: Invocation[][] = [];
    const bodyRan: string[][] = [];
    const call = (fn: Parameters<typeof engine>[1]): PrRecord => {
      const { record, calls } = engine(repo, fn);
      engineCalls.push(calls.git.map((c) => ({ args: ['git', ...c.args] })), calls.gh.map((c) => ({ args: ['gh', ...c.args] })));
      return record;
    };
    const run = (record: PrRecord, author?: Parameters<typeof runSegments>[2]) => {
      bodyRan.push(...runSegments(repo, record, author).executed);
    };

    // Propose: select, switch, generate, publish.
    run(call((ctx) => prSelect(ctx, 'add-thing')));
    change(repo, 'add-thing');
    const published = call((ctx) => prPublish(ctx, 'add-thing'));
    run(published, (i, outputs) => {
      if (i === 0) {
        return {
          '<message-file>': authorFile(repo, 'm1.txt', 'Propose: add-thing\n'),
          '<title>': 'add-thing: a thing',
          '<body-file>': authorFile(repo, 'b.md', 'Intent.\n'),
        };
      }
      const url = outputs.map((o) => o.trim()).find((o) => o.startsWith('https://'))!;
      const att = (published.observations as { attachment: Record<string, unknown> }).attachment;
      const emit = composeAndWriteEmit('propose', { change: 'add-thing' }, { final_assessment: 'Proposed.', model: null, pr_attachment: { ...att, url, state: 'draft' } }, { projectRoot: repo.dir });
      return { '<emit-path>': path.relative(repo.dir, path.resolve(repo.dir, emit.path)), '<message-file>': authorFile(repo, 'm2.txt', 'Record\n') };
    });

    // Archive: preflight, then sync + move + emit (the archive's own writes), then the tail.
    const pre = call((ctx) => prPreflight(ctx, 'add-thing'));
    expect(pre.observations).toMatchObject({ outcome: 'valid', emit: { pr_url: URL1, pr_state: 'draft' } });
    repo.write('orbit/specs/widget/spec.md', '# widget\n\nsynced\n');
    fs.mkdirSync(path.join(repo.dir, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(path.join(repo.dir, 'orbit/changes/add-thing'), path.join(repo.dir, 'orbit/changes/archive/2026-10-12-add-thing'));
    repo.write(
      'orbit/changes/archive/2026-10-12-add-thing/.orbit-runs/archive-2026-10-12T23-00-00Z.json',
      JSON.stringify({ command: 'archive', change: 'add-thing', sync_specs: { capabilities_updated: ['widget'] }, ...(pre.observations.emit as object) })
    );
    const tail = call((ctx) => prTail(ctx, 'add-thing', { outcome: pre.observations.outcome as string }));
    run(tail, () => ({ '<message-file>': authorFile(repo, 'm3.txt', 'Archive\n'), '<body-file>': authorFile(repo, 'l.md', 'Landed.\n') }));

    // Partition: what was logged OUTSIDE every engine window is exactly what the body ran.
    const all = repo.since(start);
    const fromEngine = engineCalls.flat().map((c) => c.args.join('\0'));
    const logged = [...all.git.map((c) => ['git', ...c.args]), ...all.gh.map((c) => ['gh', ...c.args])].map((a) => a.join('\0'));
    const outside = [...logged];
    for (const e of fromEngine) {
      const at = outside.indexOf(e);
      expect(at, `engine invocation missing from the logs: ${e}`).toBeGreaterThanOrEqual(0);
      outside.splice(at, 1);
    }
    expect(outside.sort()).toEqual(bodyRan.map((a) => a.join('\0')).sort());
    // And every engine invocation was a read.
    for (const c of engineCalls.flat()) {
      expect(c.args[0] === 'git' ? allowedGit(c.args.slice(1)) : allowedGh(c.args.slice(1))).toBe(true);
    }
    // The writes did happen — by the body: the branch, the PR, the ready flip, the archive commit.
    expect(bodyRan.map((a) => a.slice(0, 3).join(' '))).toEqual(
      expect.arrayContaining(['git switch -c', 'gh pr create', 'gh pr edit', 'gh pr ready', 'git push -u'])
    );
    expect(repo.git('rev-parse', 'origin/add-thing').stdout).toBe(repo.git('rev-parse', 'add-thing').stdout);
    expect(repo.git('status', '--porcelain').stdout.trim()).toBe('');
  });
});
