import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Lexically greatest `orbit/changes/archive/<YYYY-MM-DD>-<name>/` match, or null — the ONE
 * archived-directory resolver, shared by the emit surface and `orbit status --report`.
 * Only entries that RESOLVE to a directory match, symbolic links followed (`fs.statSync`,
 * never the entry's own type): a regular file of a matching name never wins the lexical
 * selection, and a symlinked entry is admitted so the caller's containment check can refuse it.
 */
export function findArchivedDir(projectRoot: string, name: string): string | null {
  const archiveRoot = path.join(projectRoot, 'orbit', 'changes', 'archive');
  const pattern = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${escapeRegExp(name)}$`);
  let candidates: string[] = [];
  try {
    candidates = fs
      .readdirSync(archiveRoot)
      .filter(e => pattern.test(e) && isDirectory(path.join(archiveRoot, e)))
      .sort();
  } catch {
    candidates = [];
  }
  return candidates.length > 0 ? path.join(archiveRoot, candidates[candidates.length - 1]) : null;
}

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * True when `dir` physically resolves inside `orbit/changes/archive/` — the real-path test the
 * emit surface's containment check runs after every archived resolution. An unresolvable path
 * returns true: existence is the caller's check.
 */
export function isInsideArchive(projectRoot: string, dir: string): boolean {
  let real: string;
  let realRoot: string;
  try {
    real = fs.realpathSync(dir);
    realRoot = fs.realpathSync(path.join(projectRoot, 'orbit', 'changes', 'archive'));
  } catch {
    return true;
  }
  return real !== realRoot && real.startsWith(realRoot + path.sep);
}
