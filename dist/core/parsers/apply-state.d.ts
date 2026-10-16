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
/** The task id a checkbox item's text opens with (`9.6`), or null — the reader's one id grammar. */
export declare function taskIdOf(text: string): string | null;
export declare function parseCheckboxes(content: string): CheckboxState;
export declare function isGitRepo(projectRoot: string): boolean;
/** True when `ref` names an object present in the repository (tree, commit, …). */
export declare function gitObjectExists(projectRoot: string, ref: string): boolean;
/**
 * Captures the TRACKED working state as a tree object and returns its OID: a temporary
 * index seeded from HEAD, tracked modifications/deletions via `git add -u`, plus
 * additions already staged in the REAL index (the staging act is what admits a new file
 * to the tracked state) — brand-new UNSTAGED untracked files stay invisible, per the
 * governing spec's tracked-state rule. The tree is content-addressed and deliberately
 * unreferenced (safe to lose to gc once superseded; readers fall back to the change's
 * first commit). Returns null outside a git repo or on any git failure.
 */
export declare function captureDiffBase(projectRoot: string): string | null;
/**
 * Tracked file paths changed between `base` (a tree-ish) and the WORKING TREE —
 * committed and uncommitted tracked changes both count. Returns null outside git or
 * when the diff fails (e.g. the base object is gone).
 */
export declare function filesTouchedSince(projectRoot: string, base: string): string[] | null;
/**
 * COMMITTED-ONLY paths changed in `<fromRef>..HEAD` — the boot render's ACTUAL
 * touchpoints map (a durable-truth view; deliberately different from the per-chunk
 * working-tree diff). Returns null outside git or on failure.
 */
export declare function filesTouchedCommitted(projectRoot: string, fromRef: string): string[] | null;
/** The earliest commit touching `relPath` (the change directory) — the change's first commit. */
export declare function firstCommitTouching(projectRoot: string, relPath: string): string | null;
//# sourceMappingURL=apply-state.d.ts.map