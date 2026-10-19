import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createFenceTracker } from '../markdown-fence.js';
const GROUP_HEADER = /^##\s+(?:(\d+)\.\s+)?(.*\S)\s*$/;
const CHECKBOX = /^\s*-\s+\[([ xX])\]\s+(.*\S)\s*$/;
const TASK_ID = /^(\d+(?:\.\d+)+)\b/;
/** The task id a checkbox item's text opens with (`9.6`), or null — the reader's one id grammar. */
export function taskIdOf(text) {
    return text.match(TASK_ID)?.[1] ?? null;
}
export function parseCheckboxes(content) {
    const lines = content.split(/\r?\n/);
    const groups = [];
    let current = null;
    // rc10 (system walk, external W1): the engine's ONE CommonMark fence tracker, never a local
    // toggle. A toggle on any run of three backticks closed a four-backtick fence early, so a real
    // task after a fenced example read as fenced and vanished from every count and the archive check.
    // Each line is fed with its leading whitespace STRIPPED (rc10 verification walk): tasks.md is a list
    // document, and an example nested under a task item sits at 4+ spaces, where CommonMark's top-level
    // 0-3 indent rule would not open it and its lines would read as tasks.
    const fence = createFenceTracker();
    const ungroupedUncheckedTexts = [];
    for (const line of lines) {
        if (fence.handle(line.trimStart()) || fence.inFence)
            continue;
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
                if (id)
                    current.uncheckedIds.push(id);
            }
            else {
                current.checked++;
                current.checkedTexts.push(box[2]);
                if (id)
                    current.checkedIds.push(id);
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
function git(projectRoot, args, env) {
    const res = spawnSync('git', args, {
        cwd: projectRoot,
        encoding: 'utf-8',
        env: env ? { ...process.env, ...env } : process.env,
    });
    if (res.status !== 0)
        return null;
    return res.stdout;
}
export function isGitRepo(projectRoot) {
    return git(projectRoot, ['rev-parse', '--is-inside-work-tree'])?.trim() === 'true';
}
/** True when `ref` names an object present in the repository (tree, commit, …). */
export function gitObjectExists(projectRoot, ref) {
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
export function captureDiffBase(projectRoot) {
    if (!isGitRepo(projectRoot))
        return null;
    const tmpIndex = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-emit-')), 'index');
    const env = { GIT_INDEX_FILE: tmpIndex };
    try {
        if (git(projectRoot, ['read-tree', 'HEAD'], env) === null)
            return null;
        if (git(projectRoot, ['add', '-u'], env) === null)
            return null;
        const staged = git(projectRoot, ['diff', '--name-only', '--cached', '--diff-filter=A', '-z']);
        if (staged === null)
            return null;
        const additions = staged.split('\0').filter(l => l !== '');
        if (additions.length > 0) {
            if (git(projectRoot, ['add', '--', ...additions], env) === null)
                return null;
        }
        const tree = git(projectRoot, ['write-tree'], env);
        return tree ? tree.trim() : null;
    }
    finally {
        try {
            fs.rmSync(path.dirname(tmpIndex), { recursive: true, force: true });
        }
        catch {
            /* best-effort cleanup */
        }
    }
}
/**
 * Tracked file paths changed between `base` (a tree-ish) and the WORKING TREE —
 * committed and uncommitted tracked changes both count. Returns null outside git or
 * when the diff fails (e.g. the base object is gone).
 */
export function filesTouchedSince(projectRoot, base) {
    if (!isGitRepo(projectRoot))
        return null;
    const out = git(projectRoot, ['diff', '--name-only', base]);
    if (out === null)
        return null;
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
export function filesTouchedCommitted(projectRoot, fromRef) {
    if (!isGitRepo(projectRoot))
        return null;
    const out = git(projectRoot, ['diff', '--name-only', `${fromRef}..HEAD`]);
    if (out === null)
        return null;
    return out
        .split('\n')
        .map(l => l.trim())
        .filter(l => l !== '');
}
/** The earliest commit touching `relPath` (the change directory) — the change's first commit. */
export function firstCommitTouching(projectRoot, relPath) {
    if (!isGitRepo(projectRoot))
        return null;
    const out = git(projectRoot, ['rev-list', '--reverse', 'HEAD', '--', relPath]);
    if (!out)
        return null;
    const first = out.split('\n').find(l => l.trim() !== '');
    return first ? first.trim() : null;
}
//# sourceMappingURL=apply-state.js.map