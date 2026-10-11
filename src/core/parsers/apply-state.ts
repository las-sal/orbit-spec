import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createFenceTracker } from '../markdown-fence.js';

/**
 * Apply-state helpers (D-arc Stage D5): checkbox arithmetic over tasks.md groups, and
 * the git-side of `files_touched`/`diff_base` — the per-chunk half of the
 * predicted/actual touchpoints split (orbit-emit-composition `Per-command computed
 * extensions`).
 *
 * The diff BOUNDARY is exact, never timestamp-inferred: each apply emit records a git
 * TREE OBJECT of the tracked working state (`git write-tree` against a temporary index —
 * the `git stash create` mechanism) as `diff_base`; the next emit diffs from that tree
 * against the working tree (committed + uncommitted tracked changes both count).
 * Fallbacks: the change's first commit (first emit, pre-capability predecessor, or a
 * gc-pruned tree); `null` only outside a git repository or when no base resolves.
 */

export interface TaskGroup {
  /** Leading group number from the `## N.` header, or null when unnumbered. */
  group: number | null;
  title: string;
  checked: number;
  unchecked: number;
  /** Raw text of each unchecked task item (first line), for user-validation matching. */
  uncheckedTexts: string[];
  /** Task ids (e.g. "9.6") of unchecked items when parseable from the text. */
  uncheckedIds: string[];
  checkedIds: string[];
  /** rc10: raw text of each checked item (first line), so a refusal can quote the line. */
  checkedTexts: string[];
}

export interface CheckboxState {
  groups: TaskGroup[];
  tasksCompleted: number;
  tasksRemaining: number;
  /**
   * rc10: raw text of each unchecked item outside every `## ` group, which the counts above never
   * see. Read by the archive write gate so a marked line the reader cannot place is refused by its
   * text rather than missed.
   */
  ungroupedUncheckedTexts: string[];
}

const GROUP_HEADER = /^##\s+(?:(\d+)\.\s+)?(.*\S)\s*$/;
const CHECKBOX = /^\s*-\s+\[([ xX])\]\s+(.*\S)\s*$/;
const TASK_ID = /^(\d+(?:\.\d+)+)\b/;

/** The task id a checkbox item's text opens with (`9.6`), or null — the reader's one id grammar. */
export function taskIdOf(text: string): string | null {
  return text.match(TASK_ID)?.[1] ?? null;
}

export function parseCheckboxes(content: string): CheckboxState {
  const lines = content.split(/\r?\n/);
  const groups: TaskGroup[] = [];
  let current: TaskGroup | null = null;
  // rc10 (system walk, external W1): the engine's ONE CommonMark fence tracker, never a local
  // toggle. A toggle on any run of three backticks closed a four-backtick fence early, so a real
  // task after a fenced example read as fenced and vanished from every count and the archive check.
  const fence = createFenceTracker();
  const ungroupedUncheckedTexts: string[] = [];

  for (const line of lines) {
    if (fence.handle(line) || fence.inFence) continue;

    const header = line.match(GROUP_HEADER);
    if (header && line.startsWith('## ')) {
      current = {
        group: header[1] !== undefined ? Number(header[1]) : null,
        title: header[2],
        checked: 0,
        unchecked: 0,
        uncheckedTexts: [],
        uncheckedIds: [],
        checkedIds: [],
        checkedTexts: [],
      };
      groups.push(current);
      continue;
    }
    const box = line.match(CHECKBOX);
    if (box && !current && box[1] === ' ') {
      ungroupedUncheckedTexts.push(box[2]);
      continue;
    }
    if (box && current) {
      const id = taskIdOf(box[2]);
      if (box[1] === ' ') {
        current.unchecked++;
        current.uncheckedTexts.push(box[2]);
        if (id) current.uncheckedIds.push(id);
      } else {
        current.checked++;
        current.checkedTexts.push(box[2]);
        if (id) current.checkedIds.push(id);
      }
    }
  }

  return {
    groups,
    tasksCompleted: groups.reduce((n, g) => n + g.checked, 0),
    tasksRemaining: groups.reduce((n, g) => n + g.unchecked, 0),
    ungroupedUncheckedTexts,
  };
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function git(projectRoot: string, args: string[], env?: NodeJS.ProcessEnv): string | null {
  const res = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf-8',
    env: env ? { ...process.env, ...env } : process.env,
  });
  if (res.status !== 0) return null;
  return res.stdout;
}

export function isGitRepo(projectRoot: string): boolean {
  return git(projectRoot, ['rev-parse', '--is-inside-work-tree'])?.trim() === 'true';
}

/** True when `ref` names an object present in the repository (tree, commit, …). */
export function gitObjectExists(projectRoot: string, ref: string): boolean {
  const res = spawnSync('git', ['cat-file', '-e', ref], { cwd: projectRoot });
  return res.status === 0;
}

/**
 * Captures the TRACKED working state as a tree object and returns its OID: a temporary
 * index seeded from HEAD, tracked modifications/deletions via `git add -u`, plus
 * additions already staged in the REAL index (the staging act is what admits a new file
 * to the tracked state) — brand-new UNSTAGED untracked files stay invisible, per the
 * governing spec's tracked-state rule. The tree is content-addressed and deliberately
 * unreferenced (safe to lose to gc once superseded; readers fall back to the change's
 * first commit). Returns null outside a git repo or on any git failure.
 */
export function captureDiffBase(projectRoot: string): string | null {
  if (!isGitRepo(projectRoot)) return null;
  const tmpIndex = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-emit-')), 'index');
  const env = { GIT_INDEX_FILE: tmpIndex };
  try {
    if (git(projectRoot, ['read-tree', 'HEAD'], env) === null) return null;
    if (git(projectRoot, ['add', '-u'], env) === null) return null;
    const staged = git(projectRoot, ['diff', '--name-only', '--cached', '--diff-filter=A', '-z']);
    if (staged === null) return null;
    const additions = staged.split('\0').filter(l => l !== '');
    if (additions.length > 0) {
      if (git(projectRoot, ['add', '--', ...additions], env) === null) return null;
    }
    const tree = git(projectRoot, ['write-tree'], env);
    return tree ? tree.trim() : null;
  } finally {
    try {
      fs.rmSync(path.dirname(tmpIndex), { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  }
}

/**
 * Tracked file paths changed between `base` (a tree-ish) and the WORKING TREE —
 * committed and uncommitted tracked changes both count. Returns null outside git or
 * when the diff fails (e.g. the base object is gone).
 */
export function filesTouchedSince(projectRoot: string, base: string): string[] | null {
  if (!isGitRepo(projectRoot)) return null;
  const out = git(projectRoot, ['diff', '--name-only', base]);
  if (out === null) return null;
  return out
    .split('\n')
    .map(l => l.trim())
    .filter(l => l !== '');
}

/**
 * COMMITTED-ONLY paths changed in `<fromRef>..HEAD` — the boot render's ACTUAL
 * touchpoints map (a durable-truth view; deliberately different from the per-chunk
 * working-tree diff). Returns null outside git or on failure.
 */
export function filesTouchedCommitted(projectRoot: string, fromRef: string): string[] | null {
  if (!isGitRepo(projectRoot)) return null;
  const out = git(projectRoot, ['diff', '--name-only', `${fromRef}..HEAD`]);
  if (out === null) return null;
  return out
    .split('\n')
    .map(l => l.trim())
    .filter(l => l !== '');
}

/** The earliest commit touching `relPath` (the change directory) — the change's first commit. */
export function firstCommitTouching(projectRoot: string, relPath: string): string | null {
  if (!isGitRepo(projectRoot)) return null;
  const out = git(projectRoot, ['rev-list', '--reverse', 'HEAD', '--', relPath]);
  if (!out) return null;
  const first = out.split('\n').find(l => l.trim() !== '');
  return first ? first.trim() : null;
}
