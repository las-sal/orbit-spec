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

/**
 * The ONE single-name rule (decision-layer system walk, fresh S2): a workstream name or doc filename
 * stem, never a path — no separator, no traversal segment, no leading dot, not empty. Held by the emit
 * surface's `--change` / `--doc` values and by a decision record's citation names (`capability`, `doc`,
 * `change`), which `orbit-decision-records` holds to the same rule.
 */
export function isSingleName(name: unknown): name is string {
  return typeof name === 'string' && name.length > 0 && !/[\\/]/.test(name) && !name.startsWith('.') && !name.includes('..');
}
