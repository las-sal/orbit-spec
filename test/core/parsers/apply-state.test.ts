import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  parseCheckboxes,
  captureDiffBase,
  filesTouchedSince,
  firstCommitTouching,
  isGitRepo,
} from '../../../src/core/parsers/apply-state.js';

const tasks = `# Tasks: foo

## 1. Grammars

- [x] 1.1 done thing
- [ ] 1.2 pending thing
- [ ] 1.3 another pending

## 2. Surfaces

- [x] 2.1 shipped
- [x] 2.2 also shipped

## 9. Verification sweep

- [ ] 9.6 (User-validation handoff) live-test everything

### At-archive notes

- 9.4 not a checkbox
`;

describe('parseCheckboxes', () => {
  it('computes per-group and total checkbox arithmetic', () => {
    const s = parseCheckboxes(tasks);
    expect(s.tasksCompleted).toBe(3);
    expect(s.tasksRemaining).toBe(3);
    expect(s.groups.map(g => g.group)).toEqual([1, 2, 9]);
    expect(s.groups[0].unchecked).toBe(2);
    expect(s.groups[0].uncheckedIds).toEqual(['1.2', '1.3']);
    expect(s.groups[2].uncheckedIds).toEqual(['9.6']);
  });

  it('non-checkbox list items and H3 note lists count nothing', () => {
    const s = parseCheckboxes(tasks);
    const g9 = s.groups.find(g => g.group === 9)!;
    expect(g9.checked + g9.unchecked).toBe(1);
  });

  it('fenced checkboxes are never tasks', () => {
    const fenced = '## 1. a\n- [ ] real\n```\n- [ ] fenced fake\n```\n';
    const s = parseCheckboxes(fenced);
    expect(s.tasksRemaining).toBe(1);
  });
});

describe('git diff-base helpers', () => {
  let repo: string;

  beforeAll(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-apply-state-'));
    const g = (cmd: string) => execSync(`git ${cmd}`, { cwd: repo, stdio: 'pipe' });
    g('init -q');
    g('config user.email t@t.t');
    g('config user.name t');
    fs.mkdirSync(path.join(repo, 'orbit/changes/foo'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'base.txt'), 'base\n');
    fs.writeFileSync(path.join(repo, 'orbit/changes/foo/proposal.md'), 'p\n');
    g('add -A');
    g('commit -q -m init');
  });

  afterAll(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('degrades to null outside a git repository', () => {
    const notRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-notrepo-'));
    try {
      expect(isGitRepo(notRepo)).toBe(false);
      expect(captureDiffBase(notRepo)).toBeNull();
      expect(filesTouchedSince(notRepo, 'HEAD')).toBeNull();
      expect(firstCommitTouching(notRepo, 'x')).toBeNull();
    } finally {
      fs.rmSync(notRepo, { recursive: true, force: true });
    }
  });

  it('resolves the change first commit as the fallback reference', () => {
    const first = firstCommitTouching(repo, 'orbit/changes/foo');
    expect(first).toMatch(/^[0-9a-f]{40}$/);
  });

  it('late-committed chunk work does not reappear (the diff_base regression case)', () => {
    // Chunk 1 fires with its work UNCOMMITTED (a tracked-file edit — brand-new
    // UNTRACKED files stay invisible until staged, the spec's stated git-visibility
    // limitation): the boundary tree captures the working state.
    fs.writeFileSync(path.join(repo, 'base.txt'), 'base\nchunk 1 work\n');
    const boundary = captureDiffBase(repo);
    expect(boundary).toMatch(/^[0-9a-f]{40}$/);

    // Chunk 1's list, diffed from HEAD (the previous boundary = first commit here),
    // includes its uncommitted tracked change — working-tree semantics.
    const chunk1Files = filesTouchedSince(repo, 'HEAD');
    expect(chunk1Files).toContain('base.txt');

    // The work is committed only AFTER the emit fired.
    execSync('git add -A && git commit -q -m chunk1', { cwd: repo });

    // Chunk 2 touches a different (staged) file; its diff from the RECORDED boundary
    // tree excludes chunk 1's file — per-chunk exactness under every commit ordering.
    fs.writeFileSync(path.join(repo, 'chunk2.txt'), 'chunk 2 work\n');
    execSync('git add chunk2.txt', { cwd: repo });
    const chunk2Files = filesTouchedSince(repo, boundary!);
    expect(chunk2Files).toContain('chunk2.txt');
    expect(chunk2Files).not.toContain('base.txt');

    // A timestamp-style commit base (HEAD~1, what rev-list --before would have found)
    // WOULD have repeated chunk 1's file — the failure the snapshot boundary removes.
    const naive = filesTouchedSince(repo, 'HEAD~1');
    expect(naive).toContain('base.txt');
  });

  it('a pruned/unknown base yields null (caller falls back to the first commit)', () => {
    expect(filesTouchedSince(repo, '0'.repeat(40))).toBeNull();
  });

  it('UNSTAGED untracked files stay out of the boundary tree; STAGED additions are in (tracked-state rule)', () => {
    // An unstaged untracked file at the boundary...
    fs.writeFileSync(path.join(repo, 'scratch-note.txt'), 'never staged\n');
    // ...and a staged addition (the staging act admits it to the tracked state).
    fs.writeFileSync(path.join(repo, 'staged-add.txt'), 'staged\n');
    execSync('git add staged-add.txt', { cwd: repo });

    const boundary = captureDiffBase(repo);
    expect(boundary).toMatch(/^[0-9a-f]{40}$/);
    const inTree = execSync(`git ls-tree -r --name-only ${boundary}`, { cwd: repo })
      .toString()
      .split('\n');
    expect(inTree).toContain('staged-add.txt');
    expect(inTree).not.toContain('scratch-note.txt');

    // The regression the finding names: remove the never-staged file before the next
    // boundary — it must NOT surface as a touched-file deletion against the tree.
    fs.rmSync(path.join(repo, 'scratch-note.txt'));
    const touched = filesTouchedSince(repo, boundary!);
    expect(touched).not.toContain('scratch-note.txt');
    // Cleanup the staged addition for any later cases.
    execSync('git reset -q staged-add.txt', { cwd: repo });
    fs.rmSync(path.join(repo, 'staged-add.txt'));
  });
});
