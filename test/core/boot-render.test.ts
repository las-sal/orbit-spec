import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { collectBoot, renderBoot } from '../../src/core/boot-render.js';
import { listSkippedEmits, composeWorkstreamEntry, listLiveWorkstreams } from '../../src/core/orientation.js';

let root: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function makeChange(name: string): void {
  write(`orbit/changes/${name}/proposal.md`, '# P\n');
  write(
    `orbit/changes/${name}/design.md`,
    '# Design\n\n## Touchpoints\n\n- `src/a.ts` — thing.\n- `src/lib/` — dir.\n'
  );
  write(`orbit/changes/${name}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(`orbit/changes/${name}/tasks.md`, '# Tasks\n\n## 1. G\n\n- [ ] 1.1 x\n');
  write(`orbit/changes/${name}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 3\n');
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-boot-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('boot render (D5)', () => {
  it('pre-apply: ordered pointers, per-family emits (review split per mode), predicted touchpoints, actual null', () => {
    makeChange('foo');
    write(
      'orbit/changes/foo/.orbit-runs/review-proposal-2026-08-01T10-00-00Z.json',
      JSON.stringify({ command: 'review', final_assessment: 'One sentence. Two.', next_recommended: 'x' })
    );
    write(
      'orbit/changes/foo/.orbit-runs/review-system-2026-08-01T11-00-00Z.json',
      JSON.stringify({ command: 'review', final_assessment: 'Sys pass.', next_recommended: 'x' })
    );
    write(
      'orbit/changes/foo/.orbit-runs/explore-2026-07-30T09-00-00Z.json',
      JSON.stringify({ command: 'explore', final_assessment: 'Explored.', next_recommended: 'x' })
    );
    write('orbit/changes/foo/explore.md', '## Decisions\n- d\n');

    const { boot } = collectBoot(root, 'foo');
    expect(boot.artifacts[0]).toContain('proposal.md');
    const keys = boot.emits.map(e => (e.mode ? `${e.family}:${e.mode}` : e.family)).sort();
    expect(keys).toEqual(['explore', 'review:proposal', 'review:system']);
    const rp = boot.emits.find(e => e.mode === 'proposal')!;
    expect(rp.headline).toBe('One sentence.');
    expect(boot.history.explore_md).toBe(true);
    expect(boot.history.sketches).toBe(false);
    expect(boot.touchpoints.predicted).toEqual(['src/a.ts', 'src/lib/']);
    expect(boot.touchpoints.actual).toBeNull();
    expect(boot.skipped_emits).toBeUndefined();
  });

  it('post-apply in git: the ACTUAL map is committed-only <change-start>..HEAD', () => {
    makeChange('foo');
    const g = (cmd: string) => execSync(`git ${cmd}`, { cwd: root, stdio: 'pipe' });
    g('init -q');
    g('config user.email t@t.t');
    g('config user.name t');
    g('add -A');
    g('commit -q -m start');
    // Committed apply work + a change-own commit (collapses to the count line)
    // + an uncommitted edit (must NOT appear in the actual map).
    write('src/a.ts', 'code\n');
    write('orbit/changes/foo/tasks.md', '# Tasks\n\n## 1. G\n\n- [x] 1.1 x\n');
    write(
      'orbit/changes/foo/.orbit-runs/apply-2026-08-01T09-00-00Z.json',
      JSON.stringify({ command: 'apply', final_assessment: 'Committed chunk.', next_recommended: 'x' })
    );
    g('add -A');
    g('commit -q -m work');
    write('src/uncommitted.ts', 'wip\n');
    write(
      'orbit/changes/foo/.orbit-runs/apply-2026-08-02T10-00-00Z.json',
      JSON.stringify({ command: 'apply', final_assessment: 'Chunk 1 done.', next_recommended: 'x' })
    );

    const { boot } = collectBoot(root, 'foo');
    expect(boot.touchpoints.actual).toContain('src/a.ts');
    expect(boot.touchpoints.actual).not.toContain('src/uncommitted.ts');
    // Change-own files (tasks.md + the committed emit) collapse out of the code
    // map into the count — the same orbit/changes/<name>/** exclusion audit-drift
    // applies to its divergence arithmetic.
    expect(boot.touchpoints.actual!.some(f => f.startsWith('orbit/changes/foo/'))).toBe(false);
    expect(boot.touchpoints.actual_change_own_count).toBe(2);
    // Predicted rides alongside as reference.
    expect(boot.touchpoints.predicted).toEqual(['src/a.ts', 'src/lib/']);
    const text = renderBoot(root, 'foo');
    expect(text).toContain('Touchpoints (ACTUAL — diff-computed):');
    expect(text).toContain('orbit/changes/foo/ — 2 change-own files (bookkeeping, collapsed)');
    expect(text).toContain('Predicted (reference');
  });

  it('ENGINE set-difference: actual_unpredicted / predicted_unsatisfied / malformed computed via the grammar matchers', () => {
    makeChange('foo');
    write(
      'orbit/changes/foo/design.md',
      [
        '# Design',
        '',
        '## Touchpoints',
        '',
        '- `src/a.ts` — exact.',
        '- `src/lib/` — prefix.',
        '- `src/gen/*.ts` — glob.',
        '- `src/x.ts` + `src/y.ts` — grouped alternatives.',
        '- `src/never.ts` — planned, never touched.',
        '- plain prose entry without a code span.',
        '',
      ].join('\n')
    );
    const g = (cmd: string) => execSync(`git ${cmd}`, { cwd: root, stdio: 'pipe' });
    g('init -q');
    g('config user.email t@t.t');
    g('config user.name t');
    g('add -A');
    g('commit -q -m start');
    // Committed apply work: exact + prefix + glob + the grouped entry's SECOND
    // alternative, plus one path nothing predicted.
    for (const f of ['src/a.ts', 'src/lib/deep.ts', 'src/gen/out.ts', 'src/y.ts', 'src/rogue.ts']) {
      write(f, 'code\n');
    }
    g('add -A');
    g('commit -q -m work');
    write(
      'orbit/changes/foo/.orbit-runs/apply-2026-08-02T10-00-00Z.json',
      JSON.stringify({ command: 'apply', final_assessment: 'Chunk done.', next_recommended: 'x' })
    );

    const { boot } = collectBoot(root, 'foo');
    expect(boot.touchpoints.actual_unpredicted).toEqual(['src/rogue.ts']);
    expect(boot.touchpoints.predicted_unsatisfied).toEqual(['src/never.ts']);
    expect(boot.touchpoints.malformed).toHaveLength(1);
    expect(boot.touchpoints.malformed![0].text).toContain('plain prose entry');
  });

  it('committed apply work WITHOUT any apply emit shows the ACTUAL map (trail presence is never a condition)', () => {
    makeChange('foo');
    const g = (cmd: string) => execSync(`git ${cmd}`, { cwd: root, stdio: 'pipe' });
    g('init -q');
    g('config user.email t@t.t');
    g('config user.name t');
    g('add -A');
    g('commit -q -m start');
    // Committed implementation work, NO apply emit on the trail (commit landed
    // before the first boundary emit, or the emit was lost/malformed).
    write('src/a.ts', 'code\n');
    g('add -A');
    g('commit -q -m work');

    const { boot } = collectBoot(root, 'foo');
    expect(boot.touchpoints.actual).toContain('src/a.ts');
  });

  it('an apply emit WITHOUT committed apply work stays on the predicted view (transition keys on commits)', () => {
    makeChange('foo');
    const g = (cmd: string) => execSync(`git ${cmd}`, { cwd: root, stdio: 'pipe' });
    g('init -q');
    g('config user.email t@t.t');
    g('config user.name t');
    g('add -A');
    g('commit -q -m start');
    // A change-own commit (artifact edit) + an apply emit, but NO committed
    // implementation work — the cold pickup must get the predicted-only view.
    write('orbit/changes/foo/tasks.md', '# Tasks\n\n## 1. G\n\n- [x] 1.1 x\n');
    g('add -A');
    g('commit -q -m artifacts');
    write('src/uncommitted.ts', 'wip\n');
    write(
      'orbit/changes/foo/.orbit-runs/apply-2026-08-02T10-00-00Z.json',
      JSON.stringify({ command: 'apply', final_assessment: 'Boundary emit.', next_recommended: 'x' })
    );

    const { boot } = collectBoot(root, 'foo');
    expect(boot.touchpoints.actual).toBeNull();
    expect(boot.touchpoints.actual_change_own_count).toBeUndefined();
    const text = renderBoot(root, 'foo');
    expect(text).toContain('Touchpoints (predicted — design.md):');
    expect(text).not.toContain('ACTUAL');
  });

  it('degradation: no Touchpoints section and non-git → nulls, exit-clean render', () => {
    makeChange('foo');
    write('orbit/changes/foo/design.md', '# Design without the section\n');
    const { boot } = collectBoot(root, 'foo');
    expect(boot.touchpoints.predicted).toBeNull();
    expect(boot.touchpoints.actual).toBeNull();
    const text = renderBoot(root, 'foo');
    expect(text).not.toContain('Touchpoints');
    expect(text).toContain('Ready when you are:');
  });
});

describe('surfaced skip-note (fault isolation, D5)', () => {
  it('spine-invalid and unreadable emit files are listed; valid and non-emit files are not', () => {
    makeChange('foo');
    write('orbit/changes/foo/.orbit-runs/apply-2026-08-01T10-00-00Z.json', '{not json');
    write(
      'orbit/changes/foo/.orbit-runs/review-proposal-2026-08-01T11-00-00Z.json',
      JSON.stringify({ command: 'review' }) // spine-invalid: no final_assessment
    );
    write(
      'orbit/changes/foo/.orbit-runs/verify-2026-08-01T12-00-00Z.json',
      JSON.stringify({ command: 'verify', final_assessment: 'ok.', next_recommended: 'x' })
    );
    write('orbit/changes/foo/.orbit-runs/notes.json', '{}'); // no token → not emit-shaped

    const skipped = listSkippedEmits(path.join(root, 'orbit/changes/foo/.orbit-runs'));
    expect(skipped).toEqual([
      'apply-2026-08-01T10-00-00Z.json',
      'review-proposal-2026-08-01T11-00-00Z.json',
    ]);
  });

  it('the workstream entry (both JSON tiers) and the boot object carry skipped_emits', () => {
    makeChange('foo');
    write('orbit/changes/foo/.orbit-runs/apply-2026-08-01T10-00-00Z.json', '{broken');
    const ws = listLiveWorkstreams(root).find(w => w.name === 'foo')!;
    const entry = composeWorkstreamEntry(root, ws);
    expect(entry.skipped_emits).toEqual(['apply-2026-08-01T10-00-00Z.json']);

    const { boot } = collectBoot(root, 'foo');
    expect(boot.skipped_emits).toEqual(['apply-2026-08-01T10-00-00Z.json']);
    const text = renderBoot(root, 'foo');
    expect(text).toContain('⚠ invalid emit skipped: apply-2026-08-01T10-00-00Z.json');
  });

  it('exclusion is surfaced but never counted: arithmetic ignores the broken file', () => {
    makeChange('foo');
    write('orbit/changes/foo/.orbit-runs/apply-2026-08-01T10-00-00Z.json', '{broken');
    const ws = listLiveWorkstreams(root).find(w => w.name === 'foo')!;
    const entry = composeWorkstreamEntry(root, ws);
    expect(entry.last).toBeUndefined(); // the broken emit never wins recency
    expect(entry.degraded).toBeUndefined(); // detection without failure
  });
});
