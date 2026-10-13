/**
 * Lexically greatest `orbit/changes/archive/<YYYY-MM-DD>-<name>/` match, or null — the ONE
 * archived-directory resolver, shared by the emit surface and `orbit status --report`.
 * Only entries that RESOLVE to a directory match, symbolic links followed (`fs.statSync`,
 * never the entry's own type): a regular file of a matching name never wins the lexical
 * selection, and a symlinked entry is admitted so the caller's containment check can refuse it.
 */
export declare function findArchivedDir(projectRoot: string, name: string): string | null;
//# sourceMappingURL=archived-change.d.ts.map