import * as fs from 'node:fs';
import * as path from 'node:path';
/**
 * Lexically greatest `orbit/changes/archive/<YYYY-MM-DD>-<name>/` match, or null — the ONE
 * archived-directory resolver, shared by the emit surface and `orbit status --report`.
 * Only entries that RESOLVE to a directory match, symbolic links followed (`fs.statSync`,
 * never the entry's own type): a regular file of a matching name never wins the lexical
 * selection, and a symlinked entry is admitted so the caller's containment check can refuse it.
 */
export function findArchivedDir(projectRoot, name) {
    const archiveRoot = path.join(projectRoot, 'orbit', 'changes', 'archive');
    const pattern = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${escapeRegExp(name)}$`);
    let candidates = [];
    try {
        candidates = fs
            .readdirSync(archiveRoot)
            .filter(e => pattern.test(e) && isDirectory(path.join(archiveRoot, e)))
            .sort();
    }
    catch {
        candidates = [];
    }
    return candidates.length > 0 ? path.join(archiveRoot, candidates[candidates.length - 1]) : null;
}
function isDirectory(p) {
    try {
        return fs.statSync(p).isDirectory();
    }
    catch {
        return false;
    }
}
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=archived-change.js.map