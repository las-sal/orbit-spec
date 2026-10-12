/**
 * `orbit pr publish` against real repositories (rc12-engine-owned-choreography, task 4.2). Each
 * `proceed` case runs segment 1, writes a REAL propose emit through the emit surface from
 * segment 1's result (the URL `gh pr create` printed, or the adopted one), runs segment 2, and
 * asserts the record reached the bare remote — the segment boundary D-rc12-8 exists for.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
import { prPublish } from '../../../src/core/pr/publish.js';
import type { PrRecord } from '../../../src/core/pr/record.js';
import { prSelect } from '../../../src/core/pr/select.js';
import type { GhPr, Repo } from '../../integration/pr-lifecycle/harness.js';
import { assertHumanActsUnrun, authorFile, engine, runSegments } from '../../integration/pr-lifecycle/instrument.js';
import { change, orbitRepo, stage } from './fixtures.js';

/** Phase 1 then phase 2: select, run the switch, and generate the change's artifacts. */
function selectAndGenerate(repo: Repo, name: string, doc?: string): void {
  const sel = engine(repo, (ctx) => prSelect(ctx, name)).record;
  expect(sel.action).toBe('proceed');
  runSegments(repo, sel);
  change(repo, name, doc);
  repo.write(`orbit/changes/${name}/specs/widget/spec.md`, '## ADDED Requirements\n');
}

function publish(repo: Repo, name: string) {
  return engine(repo, (ctx) => prPublish(ctx, name));
}

/**
 * Run the whole publish: segment 1 with authored message, title and body; then the emit
 * written from segment 1's result; then segment 2. Returns the emit path.
 */
function runPublish(repo: Repo, name: string, record: PrRecord): { emitRel: string | null; createdUrl: string | null; executed: string[][] } {
  const obs = record.observations as { attachment: Record<string, unknown>; adopted_url?: string; adopted_state?: string };
  let emitRel: string | null = null;
  let createdUrl: string | null = null;
  const { executed } = runSegments(repo, record, (i, outputs) => {
    if (i === 0) {
      return {
        '<message-file>': authorFile(repo, 'msg1.txt', `Propose: ${name}\n`),
        '<title>': `${name}: the title`,
        '<body-file>': authorFile(repo, 'body.md', 'Intent.\n'),
      };
    }
    // Between the segments: the body writes the propose emit from segment 1's result.
    const opened = outputs.map((o) => o.trim()).find((o) => o.startsWith('https://github.com/'));
    createdUrl = opened ?? null;
    const url = opened ?? obs.adopted_url;
    const state = opened ? 'draft' : obs.adopted_state;
    const result = composeAndWriteEmit(
      'propose',
      { change: name },
      { final_assessment: 'Proposed.', model: null, pr_attachment: { ...obs.attachment, url, state } },
      { projectRoot: repo.dir }
    );
    emitRel = path.relative(repo.dir, path.resolve(repo.dir, result.path));
    return { '<emit-path>': emitRel, '<message-file>': authorFile(repo, 'msg2.txt', `Record attachment: ${name}\n`) };
  });
  return { emitRel, createdUrl, executed };
}

function onRemote(repo: Repo, branch: string, file: string): boolean {
  return repo.git('cat-file', '-e', `origin/${branch}:${file}`).status === 0 && repo.git('rev-parse', `origin/${branch}`).stdout === repo.git('rev-parse', branch).stdout;
}

describe('publish — the gate and the absent-gh fact', () => {
  it('pr: never is off and probes nothing', () => {
    const repo = orbitRepo('never');
    change(repo, 'add-thing');
    const { record, calls } = publish(repo, 'add-thing');
    expect(record.action).toBe('off');
    expect(calls).toEqual({ git: [], gh: [] });
  });

  // @scenario behaviour orbit-pr-lifecycle :: The `orbit pr` command observes and prints; it never writes :: An absent gh is its own fact
  it('gh absent is a skip with its own code', () => {
    const repo = orbitRepo('per-proposal', { gh: 'absent' });
    change(repo, 'add-thing');
    const { record } = publish(repo, 'add-thing');
    expect(record.action).toBe('skip');
    expect(record.reason?.code).toBe('gh-absent');
    expect((record.observations.resolution as { gh: string }).gh).toBe('absent');
  });
});

describe('publish — the enumerated scope', () => {
  it('commit isolation (D6 external iter 3): git add <paths> && git commit --only <paths> leaves a pre-staged unrelated entry out and staged', () => {
    const repo = orbitRepo('per-proposal');
    repo.write('unrelated-staged.txt', 'not mine to publish\n');
    repo.git('add', 'unrelated-staged.txt');
    repo.write('orbit/changes/add-thing/proposal.md', '# proposal\n');
    repo.git('add', 'orbit/changes/add-thing/proposal.md');
    const commit = repo.git('commit', '-q', '--only', 'orbit/changes/add-thing/proposal.md', '-m', 'add-thing artifacts');
    expect(commit.status).toBe(0);
    const inCommit = repo.git('show', '--name-only', '--format=', 'HEAD').stdout.split('\n').filter(Boolean);
    expect(inCommit).toEqual(['orbit/changes/add-thing/proposal.md']);
    expect(repo.git('diff', '--cached', '--name-only').stdout.trim()).toBe('unrelated-staged.txt');
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr publish` computes propose's outward phase :: The scope never sweeps an unrelated file
  it('the scope lists only the change\'s own paths; unrelated pre-staged and untracked files are named, and the printed commit carries exactly the scope', () => {
    const repo = orbitRepo('per-proposal');
    selectAndGenerate(repo, 'add-thing');
    repo.write('pre-staged.txt', 'staged before the seam\n');
    repo.git('add', 'pre-staged.txt');
    repo.write('scratch.txt', 'untracked\n');

    const { record } = publish(repo, 'add-thing');
    const scope = record.observations.scope as string[];
    expect(scope.sort()).toEqual([
      'orbit/changes/add-thing/.openspec.yaml',
      'orbit/changes/add-thing/proposal.md',
      'orbit/changes/add-thing/specs/widget/spec.md',
    ]);
    expect(record.observations.unrelated).toEqual([
      { path: 'pre-staged.txt', status: 'A ' },
      { path: 'scratch.txt', status: '??' },
    ]);
    const commit = record.segments[0].steps.find((s) => s.step === 'commit')!;
    expect(commit.argv).toEqual(['git', 'commit', '--only', '-F', '<message-file>', '--', ...scope]);

    const { emitRel } = runPublish(repo, 'add-thing', record);
    const committed = repo.git('show', '--name-only', '--format=', 'HEAD~1').stdout.split('\n').filter(Boolean).sort();
    expect(committed).toEqual([...scope].sort());
    expect(repo.git('diff', '--cached', '--name-only').stdout.trim()).toBe('pre-staged.txt');
    expect(repo.exists('scratch.txt')).toBe(true);
    expect(onRemote(repo, 'add-thing', emitRel!)).toBe(true);
  });

  it('a tracked exploration moved into the change: the scope carries the staging deletions path by path, never a prefix', () => {
    const repo = orbitRepo('per-proposal');
    stage(repo, 'add-thing');
    repo.commitAll('exploration tracked');
    repo.git('push', '-q', 'origin', 'main');
    const sel = engine(repo, (ctx) => prSelect(ctx, 'add-thing')).record;
    runSegments(repo, sel);
    // Propose's FILESYSTEM move (an unstaged deletion), one STAGED deletion, then generation.
    change(repo, 'add-thing');
    fs.renameSync(path.join(repo.dir, 'orbit/explore/add-thing/explore.md'), path.join(repo.dir, 'orbit/changes/add-thing/explore.md'));
    repo.git('rm', '-q', 'orbit/explore/add-thing/.openspec.yaml');

    const { record } = publish(repo, 'add-thing');
    const scope = record.observations.scope as string[];
    expect(scope).toContain('orbit/explore/add-thing/explore.md');
    expect(scope).toContain('orbit/explore/add-thing/.openspec.yaml');
    expect(scope.every((p) => !p.endsWith('/'))).toBe(true);
    const { emitRel } = runPublish(repo, 'add-thing', record);
    expect(repo.git('ls-tree', '-r', '--name-only', 'origin/add-thing', '--', 'orbit/explore/').stdout.trim()).toBe('');
    expect(onRemote(repo, 'add-thing', emitRel!)).toBe(true);
  });
});

describe('publish — the per-proposal path, end to end', () => {
  it('segment 1 lands and opens a draft; the emit is written from the URL it printed; segment 2 lands the record', () => {
    const repo = orbitRepo('per-proposal', { gh: { createdUrl: 'https://github.com/acme/widget/pull/7' } });
    selectAndGenerate(repo, 'add-thing');
    const { record } = publish(repo, 'add-thing');
    expect(record.action).toBe('proceed');
    expect(record.degraded).toBeNull();
    expect(record.segments.map((s) => s.inputs)).toEqual([
      ['<message-file>', '<title>', '<body-file>'],
      ['<emit-path>', '<message-file>'],
    ]);
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push', 'open']);
    expect(record.segments[0].steps[2].argv).toEqual(['git', 'push', '-u', 'origin', 'add-thing']);

    const { emitRel, createdUrl, executed } = runPublish(repo, 'add-thing', record);
    expect(createdUrl).toBe('https://github.com/acme/widget/pull/7');
    const create = repo.ghLog().find((c) => c.args[1] === 'create')!;
    expect(create.args).toEqual([
      'pr', 'create', '--repo', 'acme/widget', '--draft', '--base', 'main', '--head', 'add-thing',
      '--title', 'add-thing: the title', '--body-file', path.join(path.dirname(repo.dir), 'body.md'),
    ]);
    expect(repo.git('config', '--get', 'branch.add-thing.merge').stdout.trim()).toBe('refs/heads/add-thing');
    expect(onRemote(repo, 'add-thing', emitRel!)).toBe(true);
    expect(repo.git('status', '--porcelain').stdout.trim()).toBe('');
    assertHumanActsUnrun(repo, record, executed);
  });

  it.each([
    ['present', true],
    ['absent', false],
  ])('the no-CI observation reads the remote default ref: CI %s', (expected, withCi) => {
    const repo = orbitRepo('per-proposal');
    if (withCi) {
      repo.write('.github/workflows/ci.yml', 'on: push\n');
      repo.commitAll('ci');
      repo.git('push', '-q', 'origin', 'main');
    }
    selectAndGenerate(repo, 'add-thing');
    const { record } = publish(repo, 'add-thing');
    expect(record.observations.ci).toBe(expected);
  });
});

describe('publish — the program path\'s adopt-or-create query', () => {
  const pr = (n: number, base = 'main', head = 'my-program'): GhPr => ({
    url: `https://github.com/acme/widget/pull/${n}`,
    number: n,
    state: 'OPEN',
    isDraft: true,
    headRefName: head,
    baseRefName: base,
  });

  function programRepo(prList: GhPr[] | null): Repo {
    const repo = orbitRepo('per-architecture', { gh: { prList, createdUrl: 'https://github.com/acme/widget/pull/9' } });
    stage(repo, 'stage-two', 'my-program');
    selectAndGenerate(repo, 'stage-two', 'my-program');
    return repo;
  }

  it('one survivor (a different base filtered out) is ADOPTED: no create is printed, and the record lands with the adopted URL', () => {
    const repo = programRepo([pr(3), pr(4, 'release')]);
    const { record, calls } = publish(repo, 'stage-two');
    expect(calls.gh.find((c) => c.args[1] === 'list')!.args).toEqual([
      'pr', 'list', '--repo', 'acme/widget', '--head', 'my-program', '--state', 'open', '--json', 'url,baseRefName,isDraft,number',
    ]);
    expect(record.observations).toMatchObject({ adopted_url: 'https://github.com/acme/widget/pull/3', adopted_state: 'draft', branch: 'my-program' });
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push']);
    const { emitRel } = runPublish(repo, 'stage-two', record);
    expect(repo.ghLog().some((c) => c.args[1] === 'create')).toBe(false);
    expect(onRemote(repo, 'my-program', emitRel!)).toBe(true);
    const emit = JSON.parse(repo.read(emitRel!));
    expect(emit.pr_attachment).toEqual({
      branch: 'my-program', granularity: 'per-architecture', doc: 'my-program',
      url: 'https://github.com/acme/widget/pull/3', state: 'draft',
    });
  });

  it('zero survivors: the program PR is created', () => {
    const repo = programRepo([pr(4, 'release')]);
    const { record } = publish(repo, 'stage-two');
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push', 'open']);
    const { emitRel, createdUrl } = runPublish(repo, 'stage-two', record);
    expect(createdUrl).toBe('https://github.com/acme/widget/pull/9');
    expect(onRemote(repo, 'my-program', emitRel!)).toBe(true);
  });

  it('several survivors: proceed, degraded, every candidate in detail, the work lands and nothing is created; the emit stays local', () => {
    const repo = programRepo([pr(3), pr(5)]);
    const { record } = publish(repo, 'stage-two');
    expect(record).toMatchObject({
      action: 'proceed',
      degraded: 'pr',
      reason: { code: 'several', detail: { candidates: ['https://github.com/acme/widget/pull/3', 'https://github.com/acme/widget/pull/5'] } },
    });
    expect(record.segments).toHaveLength(1);
    runSegments(repo, record, () => ({ '<message-file>': authorFile(repo, 'm.txt', 'land\n') }));
    expect(repo.ghLog().some((c) => c.args[1] === 'create')).toBe(false);
    expect(repo.git('rev-parse', 'origin/my-program').stdout).toBe(repo.git('rev-parse', 'my-program').stdout);
  });

  // @scenario behaviour orbit-pr-lifecycle :: `orbit pr publish` computes propose's outward phase :: A query error lands the work and creates nothing
  it('a query error: proceed, degraded query-error, commit and push in segment 1, no gh pr create', () => {
    const repo = programRepo(null);
    const { record } = publish(repo, 'stage-two');
    expect(record).toMatchObject({ action: 'proceed', degraded: 'pr', reason: { code: 'query-error' } });
    expect(record.segments).toHaveLength(1);
    expect(record.segments[0].steps.map((s) => s.step)).toEqual(['stage', 'commit', 'push']);
    runSegments(repo, record, () => ({ '<message-file>': authorFile(repo, 'm.txt', 'land\n') }));
    expect(repo.ghLog().some((c) => c.args[1] === 'create')).toBe(false);
    expect(repo.git('rev-parse', 'origin/my-program').stdout).toBe(repo.git('rev-parse', 'my-program').stdout);
  });
});
