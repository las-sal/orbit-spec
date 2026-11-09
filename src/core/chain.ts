/**
 * The chain object (seam-chaining, `orbit-engine-gates`' `The chain setting grants each command on its
 * own key` and `The change status says whether the next command may run unasked`).
 *
 * The engine decides whether the change's next command may run unasked; the workflow body only obeys.
 * Composed from the gate computation's `next_command` and the `chain` setting alone: the object enters
 * no gate row, state, reason, position token or `next_command`, and the human readout renders none of it.
 */

import * as fs from 'fs';
import path from 'path';
import { CHAIN_KEYS, resolveChainSetting, type ChainKey } from './project-config.js';
import { chainOf, readDecisionFolder } from './decision-records.js';
import { resolveExternalRunner, type RunnerResolution } from './external-runner.js';

export { CHAIN_KEYS, type ChainKey };

/**
 * The key table: each key and the next-command forms its row grants. `<mode>` is `proposal` or
 * `system`; `<change>` is the change name. `/orbit:apply` and `/orbit:archive` (with or without the
 * ` — user-invoked` marker) are named by no row: no key grants them in this change.
 */
export const CHAIN_KEY_TABLE: Readonly<Record<ChainKey, readonly string[]>> = Object.freeze({
  review: ['/orbit:review --as <mode> <change>', '/orbit:review --as <mode> --fresh <change>'],
  'review-external': [
    '/orbit:review --as <mode> --reviewer external <change>',
    '/orbit:review --as <mode> --reviewer blind-pair <change>',
  ],
  'address-reviews': ['/orbit:address-reviews <change>'],
});

/** What a next-command string maps to: the key whose row covers it, apply, archive, or nothing known. */
export type ChainTarget = ChainKey | 'apply' | 'archive' | null;

const CONSENT_MARKER = ' — user-invoked';
const MODE = '(?:proposal|system)';
const NAME = '[^\\s]+';
const ROWS: ReadonlyArray<[RegExp, ChainTarget]> = [
  [new RegExp(`^/orbit:review --as ${MODE} ${NAME}$`), 'review'],
  [new RegExp(`^/orbit:review --as ${MODE} --fresh ${NAME}$`), 'review'],
  [new RegExp(`^/orbit:review --as ${MODE} --reviewer (?:external|blind-pair) ${NAME}$`), 'review-external'],
  [new RegExp(`^/orbit:address-reviews ${NAME}$`), 'address-reviews'],
  [new RegExp(`^/orbit:apply ${NAME}$`), 'apply'],
  [new RegExp(`^/orbit:archive ${NAME}$`), 'archive'],
];

/**
 * Map a next-command string to the key whose row covers it; `apply` / `archive` for those two
 * commands (with or without the consent marker), which no key grants; `null` for anything else.
 * The consent marker is accepted only on apply and archive, the two consent-marked commands.
 */
export function chainTargetFor(command: string): ChainTarget {
  const marked = command.endsWith(CONSENT_MARKER);
  const bare = marked ? command.slice(0, -CONSENT_MARKER.length) : command;
  for (const [re, target] of ROWS) {
    if (!re.test(bare)) continue;
    if (marked && target !== 'apply' && target !== 'archive') return null;
    return target;
  }
  return null;
}

/** The key that grants a command, or `null` when no key's row covers it. */
export function chainKeyFor(command: string): ChainKey | null {
  const t = chainTargetFor(command);
  return t === null || t === 'apply' || t === 'archive' ? null : t;
}

/** The refusal reasons, in the order the rows are tested. */
export const CHAIN_WHY = ['none', 'not-granted', 'open-stop', 'needs-user', 'no-progress'] as const;
export type ChainWhy = (typeof CHAIN_WHY)[number];

export interface ChainObject {
  next: string | null;
  configured: boolean;
  may_run: boolean;
  head: string | null;
  why?: ChainWhy;
  stop?: string;
}

const TOKEN = '\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z';
const EMIT_RE = new RegExp(`^(.+)-(${TOKEN})\\.json$`);
const RETURN_RE = new RegExp(`^external-[a-z]+-(${TOKEN})\\.md$`);
const LAUNCH_PREFIX = 'review-external-';

/**
 * The trail head: the latest token among the change's run records — its `<command>-<TS>.json` emits
 * and its `external-<mode>-<TS>.md` returns — leaving out the external launch record
 * `review-external-<TS>.json`, the `external-prompt-*.md` files and the `decisions/` folder (a
 * directory, never a run record). `null` when the trail holds none.
 */
export function trailHead(changeDir: string): string | null {
  let names: string[];
  try {
    names = fs.readdirSync(path.join(changeDir, '.orbit-runs'));
  } catch {
    return null;
  }
  let head: string | null = null;
  for (const n of names) {
    let token: string | undefined;
    if (n.startsWith(LAUNCH_PREFIX)) continue;
    const emit = EMIT_RE.exec(n);
    if (emit) token = emit[2];
    else {
      const ret = RETURN_RE.exec(n);
      if (ret) token = ret[1];
    }
    if (token !== undefined && (head === null || token > head)) head = token;
  }
  return head;
}

/**
 * The earliest open stop record in the change's `decisions/` folder, as its repo-relative trail path:
 * a stop is open when no resolution's `stop` names any record of its replacement chain. `null` when
 * every stop is answered (or the folder is absent).
 */
export function earliestOpenStop(projectRoot: string, changeDir: string): string | null {
  const dir = path.join(changeDir, '.orbit-runs', 'decisions');
  const folder = readDecisionFolder(dir);
  const answered = new Set<string>();
  for (const [, r] of folder.records) {
    if (r && r.command === 'resolution' && typeof r.stop === 'string') answered.add(r.stop);
  }
  // Filenames are read in sorted (token) order, so the first open stop is the earliest.
  for (const [name, r] of folder.records) {
    if (!name.startsWith('stop-') || !r || r.command !== 'stop') continue;
    if (chainOf(folder, name).some(member => answered.has(member))) continue;
    return path.relative(projectRoot, path.join(dir, name)).split(path.sep).join('/');
  }
  return null;
}

export interface ComposeChainOptions {
  /** `--chain-ran <command>`: the `next` the body read before running a chained command. */
  chainRan?: string;
  /** `--chain-head <token>`: the `head` the body read before running it (`null` as the word `null`). */
  chainHead?: string;
  /** Injected runner resolution (tests); defaults to the user's recorded runner. */
  runner?: RunnerResolution;
}

/**
 * Compose the `chain` object for a change. `next` is the change's `next_command` (or null). The rows
 * are tested in order and the first match is `why`; `may_run` is true exactly when none matches.
 */
export function composeChainObject(
  projectRoot: string,
  changeDir: string,
  next: string | null | undefined,
  opts: ComposeChainOptions = {}
): ChainObject {
  const setting = resolveChainSetting(projectRoot);
  const head = trailHead(changeDir);
  const base = { next: next ?? null, configured: setting.configured, head };
  const refuse = (why: ChainWhy, stop?: string): ChainObject => ({
    ...base,
    may_run: false,
    why,
    ...(stop !== undefined ? { stop } : {}),
  });

  if (base.next === null) return refuse('none');
  const key = chainKeyFor(base.next);
  if (key === null || !setting.grants[key]) return refuse('not-granted');
  const stop = earliestOpenStop(projectRoot, changeDir);
  if (stop !== null) return refuse('open-stop', stop);
  if (key === 'review-external') {
    const runner = (opts.runner ?? resolveExternalRunner()).runner;
    if (runner === null || !runner.reachable) return refuse('needs-user');
  }
  if (opts.chainRan !== undefined && opts.chainHead !== undefined) {
    const ranHead = opts.chainHead === 'null' ? null : opts.chainHead;
    if (opts.chainRan === base.next && ranHead === head) return refuse('no-progress');
  }
  return { ...base, may_run: true };
}
