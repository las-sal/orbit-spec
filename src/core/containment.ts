import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * The ONE physical-containment test: true when `dir`'s real path is `root`'s real path or lies
 * under it. The root itself counts as contained. An unresolvable path returns true — existence
 * is the caller's check. Shared by the emit surface's `assertContained` and `orbit status
 * --report`'s archived fallback (report-archived-change design D1).
 */
export function resolvesWithin(dir: string, root: string): boolean {
  let real: string;
  let realRoot: string;
  try {
    real = fs.realpathSync(dir);
    realRoot = fs.realpathSync(root);
  } catch {
    return true;
  }
  return real === realRoot || real.startsWith(realRoot + path.sep);
}
