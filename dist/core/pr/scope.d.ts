/**
 * The ENUMERATED commit scope, read from `git status --porcelain -z --untracked-files=all` — one
 * reading for `publish` and `tail` (rc12-engine-owned-choreography, system walk).
 *
 * A deletion can sit in two states, and both must reach the commit:
 * - UNSTAGED (a filesystem move or `rm`): the path is still in the index, so `git add <path>`
 *   stages its removal.
 * - STAGED (a `git rm`, a staged rename's source, an archive move staged by `git add -A`): the
 *   path is gone from the index AND the worktree, so `git add <path>` REFUSES it — but
 *   `git commit --only <path>` still carries the removal. Such a path is reported in
 *   `alreadyStaged`, so a caller prints it in the commit and keeps it out of the add.
 * Reading the index alone (`ls-files`) sees only the first state; reading porcelain sees both.
 */
import type { PorcelainEntry } from './select.js';
export interface ScopeRule {
    /** A directory prefix ending in `/`. */
    prefix: string;
    /** Only deletions (a rename's source included) under the prefix belong to the scope. */
    deletionsOnly: boolean;
}
export interface EnumeratedScope {
    /** Every in-scope path, path by path, in porcelain order, never a directory prefix. */
    scope: string[];
    /** In-scope deletions already staged: printed in the commit, never in the add. */
    alreadyStaged: Set<string>;
    /** Every other path, with its porcelain status. */
    unrelated: Array<{
        path: string;
        status: string;
    }>;
}
export declare function enumerateScope(entries: PorcelainEntry[], rules: ScopeRule[]): EnumeratedScope;
//# sourceMappingURL=scope.d.ts.map