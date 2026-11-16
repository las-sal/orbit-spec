import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveTripwiresSetting, type TripwiresSetting, type TripwireOnFire } from './project-config.js';
import { latestInChain, readDecisionFolder } from './decision-records.js';
import { touchpointsSensor } from './tripwire-touchpoints.js';

/**
 * Tripwires (stage `tripwires` of `automate-dev-flow`, `orbit-tripwires`): the SENSOR contract, orbit's sensor list,
 * the change's fixed point, the readings a seam emit carries, and the `tripwire` stop orbit composes for a halting
 * reading. A sensor measures something about one change from COMMITTED state (design M2), compares it with a
 * reference fixed before the run it watches, and returns one READING. Nothing about a sensor is special-cased
 * outside this module's contract: a later sensor is added to `tripwireSensors()` and adds no stop condition.
 */

export const TRIPWIRE_OUTCOMES = ['fired', 'quiet', 'cannot-read'] as const;
export type TripwireOutcome = (typeof TRIPWIRE_OUTCOMES)[number];

/** One reading (`orbit-tripwires`' `A tripwire is a sensor that returns a reading`). */
export interface TripwireReading {
  sensor: string;
  outcome: TripwireOutcome;
  /** One key per deviation, sorted; empty when quiet. */
  deviations: string[];
  /** The commit the reference was read at, or null when none was read. */
  reference: string | null;
  /** True when `reference` is the change's fixed point. */
  frozen: boolean;
  evidence: Record<string, unknown>;
  /** The covering `tripwire` stops' filenames (latest of each chain); present only when one covers a key. */
  stops?: string[];
  /** The answering resolutions' filenames (latest of each chain); present only when one answers a covering stop. */
  answered_by?: string[];
}

/**
 * The change's commits (design M1, `A sensor compares against a reference fixed before the run`), one of four
 * distinct results in the spec's order — never a bare null.
 */
export type ChangeCommits =
  | { kind: 'no-git' }
  | { kind: 'uncommitted' }
  /** A first commit and no first apply commit: measured, the reference read at HEAD, not frozen. */
  | { kind: 'not-begun'; first: string; head: string }
  /** A first apply commit: `fixedPoint` is its parent (null when it has none: the empty tree). */
  | { kind: 'frozen'; first: string; firstApply: string; fixedPoint: string | null; head: string };

/** What a sensor is given: the project, the change, its commits and the folders that are its own. */
export interface SensorContext {
  projectRoot: string;
  name: string;
  commits: ChangeCommits;
  /** Repo-relative (project-relative) folders the change owns, each ending in `/`: active, and archived if moved. */
  ownDirs: string[];
}

/** The plain `about` / `question` / `detail` of a stop a sensor's halting reading raises. */
export interface StopText {
  about: string;
  question: string;
  detail: string;
}

/** A sensor: an id, its measure, and the stop text it composes for the keys a stop asks about. */
export interface Sensor {
  id: string;
  run(ctx: SensorContext): TripwireReading;
  stopText(reading: TripwireReading, keys: string[]): StopText;
  /** One plain sentence on what the reading's evidence says of `key`, for the brief. */
  describe(reading: TripwireReading, key: string): string;
  /** Its `on_fire` setting, from a resolved `tripwires` setting. */
  onFire(setting: TripwiresSetting): TripwireOnFire;
}

/** orbit's sensor list, ordered by id. A function, so a sensor module may import this one without a cycle at load. */
export function tripwireSensors(): Sensor[] {
  return [touchpointsSensor].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------------------------------------------------------------------------
// Git (committed state only)
// ---------------------------------------------------------------------------

/** Runs git in the project; the stdout, or null on any failure. */
export function gitOut(projectRoot: string, args: string[], input?: string): string | null {
  const res = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf-8',
    maxBuffer: 256 * 1024 * 1024,
    ...(input !== undefined ? { input } : {}),
  });
  if (res.error || res.status !== 0) return null;
  return res.stdout;
}

/** The text of `relPath` (project-relative) at `rev`, or null when absent there; `rev` null is the empty tree. */
export function showAt(projectRoot: string, rev: string | null, relPath: string): string | null {
  if (rev === null) return null;
  return gitOut(projectRoot, ['show', `${rev}:./${relPath}`]);
}

/** The empty tree's object id in this repository's hash, or null on failure. */
export function emptyTree(projectRoot: string): string | null {
  const out = gitOut(projectRoot, ['hash-object', '-t', 'tree', '--stdin'], '');
  return out ? out.trim() : null;
}

function lines(out: string): string[] {
  return out.split('\n').map(l => l.trim()).filter(l => l !== '');
}

/**
 * The change's commits from first-parent history (design M1). Both searches run only from the change's BIRTH — the
 * latest first-parent commit adding `orbit/changes/<name>/.openspec.yaml` — so a name reused after archive never
 * reaches the earlier change. Without a birth commit, the whole first-parent history is searched. Merge commits
 * never qualify (`--no-merges`): a merge of the default branch into the change's branch is not the change's work.
 */
export function changeCommits(projectRoot: string, name: string): ChangeCommits {
  const inside = gitOut(projectRoot, ['rev-parse', '--is-inside-work-tree']);
  if (inside === null || inside.trim() !== 'true') return { kind: 'no-git' };
  // A repository with no commit has nothing committed about the change.
  // `HEAD` unpeeled: it resolves exactly when a commit exists; a missing object fails a later command (no-git).
  const headOut = gitOut(projectRoot, ['rev-parse', '--verify', '--quiet', 'HEAD']);
  if (headOut === null) return { kind: 'uncommitted' };
  const head = headOut.trim();

  const firstParent = gitOut(projectRoot, ['rev-list', '--first-parent', 'HEAD']);
  if (firstParent === null) return { kind: 'no-git' };
  // Index along the first-parent chain: 0 is HEAD; a larger index is older.
  const order = new Map<string, number>();
  lines(firstParent).forEach((c, i) => order.set(c, i));

  const rel = `orbit/changes/${name}`;
  const added = (pathspec: string): string[] | null => {
    const out = gitOut(projectRoot, [
      'log',
      '--first-parent',
      '--no-merges',
      '--no-renames',
      '--diff-filter=A',
      '--format=%H',
      'HEAD',
      '--',
      pathspec,
    ]);
    return out === null ? null : lines(out).filter(c => order.has(c));
  };

  // The BIRTH: the first addition of the metadata after the latest commit that moved the change into the archive.
  // A deletion that is not an archive move (a run removing and restoring the file) starts no new change, and when
  // the metadata's latest event is an archive move, the change of this name now has nothing committed.
  const events = metadataEvents(projectRoot, `${rel}/.openspec.yaml`);
  const archiveMoves = added(`:(glob)orbit/changes/archive/*-${name}/.openspec.yaml`);
  if (events === null || archiveMoves === null) return { kind: 'no-git' };
  const moved = new Set(archiveMoves);
  let birth: string | null = null;
  for (const e of events.filter(x => order.has(x.commit))) {
    if (e.status === 'A' && birth === null) birth = e.commit;
    else if (e.status === 'D' && moved.has(e.commit)) birth = null;
  }
  if (birth === null && events.some(x => order.has(x.commit))) return { kind: 'uncommitted' };
  const birthIndex = birth !== null ? (order.get(birth) as number) : Number.POSITIVE_INFINITY;
  const sinceBirth = (cs: string[]): string[] => cs.filter(c => (order.get(c) as number) <= birthIndex);
  const earliest = (cs: string[]): string | null =>
    cs.length === 0 ? null : cs.reduce((a, b) => ((order.get(a) as number) >= (order.get(b) as number) ? a : b));

  const touchingOut = gitOut(projectRoot, ['rev-list', '--first-parent', '--no-merges', 'HEAD', '--', `${rel}/`]);
  if (touchingOut === null) return { kind: 'no-git' };
  const first = earliest(sinceBirth(lines(touchingOut).filter(c => order.has(c))));
  if (first === null) return { kind: 'uncommitted' };

  const applies = added(`:(glob)${rel}/.orbit-runs/apply-*.json`);
  if (applies === null) return { kind: 'no-git' };
  const firstApply = earliest(sinceBirth(applies));
  if (firstApply === null) return { kind: 'not-begun', first, head };

  const parent = gitOut(projectRoot, ['rev-parse', '--verify', '--quiet', `${firstApply}^`]);
  return { kind: 'frozen', first, firstApply, fixedPoint: parent === null ? null : parent.trim(), head };
}

/** The additions and deletions of one path along first-parent, non-merge history, oldest first; null on failure. */
function metadataEvents(projectRoot: string, relPath: string): { commit: string; status: 'A' | 'D' }[] | null {
  const out = gitOut(projectRoot, [
    'log',
    '--first-parent',
    '--no-merges',
    '--no-renames',
    '--diff-filter=AD',
    '--name-status',
    '--format=%x00%H',
    'HEAD',
    '--',
    relPath,
  ]);
  if (out === null) return null;
  const events: { commit: string; status: 'A' | 'D' }[] = [];
  for (const block of out.split('\0')) {
    const ls = block.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (ls.length < 2) continue;
    const st = ls[1].charAt(0);
    if (st === 'A' || st === 'D') events.push({ commit: ls[0], status: st });
  }
  return events.reverse();
}

/** The commit a sensor reads its reference and settings at: the fixed point, or HEAD before apply begins. */
export function referenceOf(commits: ChangeCommits): { rev: string | null; frozen: boolean } | null {
  if (commits.kind === 'frozen') return { rev: commits.fixedPoint, frozen: true };
  if (commits.kind === 'not-begun') return { rev: commits.head, frozen: false };
  return null;
}

/** The config text at `rev` (`orbit/config.yaml`, else `orbit/config.yml`), or null. */
export function configTextAt(projectRoot: string, rev: string | null): string | null {
  return showAt(projectRoot, rev, 'orbit/config.yaml') ?? showAt(projectRoot, rev, 'orbit/config.yml');
}

/** The `tripwires` setting as committed at `rev`. */
export function settingAt(projectRoot: string, rev: string | null): TripwiresSetting {
  return resolveTripwiresSetting({ text: configTextAt(projectRoot, rev) });
}

/**
 * Whether a sensor HALTS (design M3, `A halting reading writes a tripwire stop`): `halt` in the config at HEAD, or,
 * once the change has a fixed point, in the config there — a run cannot turn a halt off, and the user can turn one
 * on mid-change. With no HEAD to read (outside git, or a repository with no commit), the working tree's config is
 * the config at hand.
 */
export function sensorHalts(projectRoot: string, commits: ChangeCommits, sensor: Sensor): boolean {
  const atHead =
    commits.kind === 'not-begun' || commits.kind === 'frozen'
      ? settingAt(projectRoot, commits.head)
      : (() => {
          const head = gitOut(projectRoot, ['rev-parse', '--verify', '--quiet', 'HEAD^{commit}']);
          return head === null
            ? resolveTripwiresSetting({ projectRoot })
            : settingAt(projectRoot, head.trim());
        })();
  if (sensor.onFire(atHead) === 'halt') return true;
  if (commits.kind === 'frozen' && sensor.onFire(settingAt(projectRoot, commits.fixedPoint)) === 'halt') return true;
  return false;
}

// ---------------------------------------------------------------------------
// Readings and coverage
// ---------------------------------------------------------------------------

/** Whether a reading is acted on as a firing: `fired`, or `cannot-read` (silence is never a pass). */
export function actsAsFired(r: TripwireReading): boolean {
  return r.outcome === 'fired' || r.outcome === 'cannot-read';
}

/**
 * Who covers which key in a `decisions/` folder (design M4): the LATEST record of each stop chain whose condition is
 * `tripwire` names its keys; the LATEST record of each resolution chain answers the stop chain it names. A reader of
 * `decisions/` that takes the latest of every chain (`A record is fixed by a replacement, never edited`).
 */
export interface Coverage {
  /** key → the latest record of each stop chain naming it. */
  stopsByKey: Map<string, Set<string>>;
  /** latest stop filename → the latest record of each resolution chain answering it. */
  answersByStop: Map<string, Set<string>>;
}

export function readCoverage(decisionsDir: string, change: string): Coverage {
  const folder = readDecisionFolder(decisionsDir);
  const stopsByKey = new Map<string, Set<string>>();
  const answersByStop = new Map<string, Set<string>>();
  for (const [name, r] of folder.records) {
    if (r === null || r.command !== 'stop' || r.change !== change) continue;
    if (latestInChain(folder, name) !== name) continue; // only the latest of a chain speaks
    if (r.condition !== 'tripwire') continue;
    const tw = r.tripwire as Record<string, unknown> | undefined;
    const keys = tw && Array.isArray(tw.deviations) ? tw.deviations.filter((k): k is string => typeof k === 'string') : [];
    for (const k of keys) {
      if (!stopsByKey.has(k)) stopsByKey.set(k, new Set());
      (stopsByKey.get(k) as Set<string>).add(name);
    }
  }
  for (const [name, r] of folder.records) {
    if (r === null || r.command !== 'resolution' || r.change !== change) continue;
    if (latestInChain(folder, name) !== name) continue;
    if (typeof r.stop !== 'string' || !folder.records.has(r.stop)) continue;
    // The resolution names a record of the stop's chain; credit the chain's latest.
    const stopLatest = latestInChain(folder, r.stop);
    if (!answersByStop.has(stopLatest)) answersByStop.set(stopLatest, new Set());
    (answersByStop.get(stopLatest) as Set<string>).add(name);
  }
  return { stopsByKey, answersByStop };
}

/** The keys a reading would ask about: its deviations no stop covers. */
export function uncoveredKeys(reading: TripwireReading, coverage: Coverage): string[] {
  return reading.deviations.filter(k => !coverage.stopsByKey.has(k));
}

/** Names, on a reading, the stops covering its keys and the resolutions answering them (both elided when empty). */
export function annotateCoverage(reading: TripwireReading, coverage: Coverage, extraStops: string[] = []): TripwireReading {
  const stops = new Set<string>(extraStops);
  for (const k of reading.deviations) for (const s of coverage.stopsByKey.get(k) ?? []) stops.add(s);
  const answered = new Set<string>();
  for (const s of stops) for (const a of coverage.answersByStop.get(s) ?? []) answered.add(a);
  const out: TripwireReading = { ...reading };
  delete out.stops;
  delete out.answered_by;
  if (stops.size > 0) out.stops = [...stops].sort();
  if (answered.size > 0) out.answered_by = [...answered].sort();
  return out;
}

/** The project-relative folders a change owns: its active folder, and the archived one when it has moved. */
export function ownDirsOf(projectRoot: string, name: string, changeDir: string | null): string[] {
  const dirs = [`orbit/changes/${name}/`];
  if (changeDir) {
    const rel = path.relative(projectRoot, changeDir).split(path.sep).join('/');
    if (rel !== '' && !rel.startsWith('..') && !dirs.includes(`${rel}/`)) dirs.push(`${rel}/`);
  }
  return dirs;
}

/** Every sensor's reading for one change, in the order of the sensors' ids. */
export function computeReadings(projectRoot: string, name: string, changeDir: string | null): {
  commits: ChangeCommits;
  readings: TripwireReading[];
} {
  const commits = changeCommits(projectRoot, name);
  const ctx: SensorContext = { projectRoot, name, commits, ownDirs: ownDirsOf(projectRoot, name, changeDir) };
  return { commits, readings: tripwireSensors().map(s => s.run(ctx)) };
}

/** A `cannot-read` reading for a sensor (one key: `<sensor>:cannot-read:<reason>`). */
export function cannotRead(sensor: string, reason: string, reference: string | null, frozen: boolean): TripwireReading {
  return {
    sensor,
    outcome: 'cannot-read',
    deviations: [`${sensor}:cannot-read:${reason}`],
    reference,
    frozen,
    evidence: { reason },
  };
}

/** The `tripwire` stop record orbit composes (design M4) — the payload-free shape a decision record's spine admits. */
export function composeTripwireStop(args: {
  timestamp: string;
  change: string;
  sensor: Sensor;
  reading: TripwireReading;
  keys: string[];
  emit: string;
}): Record<string, unknown> {
  const text = args.sensor.stopText(args.reading, args.keys);
  return {
    command: 'stop',
    timestamp: args.timestamp,
    change: args.change,
    model: null,
    condition: 'tripwire',
    about: text.about,
    question: text.question,
    detail: text.detail,
    tripwire: { sensor: args.reading.sensor, deviations: [...args.keys], emit: args.emit },
  };
}

/**
 * The shape of an orbit-written `tripwire` stop (design M4), for the readers that hold a `decisions/` folder's records
 * to a shape: a payload's stop is checked by the write gate, which refuses `tripwire`, so this one is checked here.
 * Returns the first problem, or null.
 */
export function tripwireStopProblem(record: Record<string, unknown>): string | null {
  if (record.command !== 'stop' || record.condition !== 'tripwire') return `it is not a tripwire stop`;
  for (const f of ['about', 'question']) {
    if (typeof record[f] !== 'string' || (record[f] as string).trim() === '') return `'${f}' is not a non-blank string`;
  }
  if ('detail' in record && typeof record.detail !== 'string') return `'detail' is not a string`;
  const tw = record.tripwire as Record<string, unknown> | undefined;
  if (!tw || typeof tw !== 'object' || Array.isArray(tw)) return `'tripwire' is not an object`;
  if (typeof tw.sensor !== 'string' || tw.sensor === '') return `'tripwire.sensor' is not a sensor id`;
  if (!Array.isArray(tw.deviations) || tw.deviations.length === 0 || tw.deviations.some(k => typeof k !== 'string' || k === '')) {
    return `'tripwire.deviations' is not a non-empty list of keys`;
  }
  if (typeof tw.emit !== 'string' || tw.emit === '') return `'tripwire.emit' does not name the seam emit`;
  return null;
}

/**
 * Whether `v` reads as a list of readings of the contract's shape (the brief holds a seam emit's field to it): every
 * field of `A tripwire is a sensor that returns a reading` of its type, and the outcome agreeing with the keys — a
 * `quiet` reading names none, and a `fired` or `cannot-read` one names at least one — so a contradictory reading is
 * refused rather than rendered as a clean statement.
 */
export function isReadingList(v: unknown): v is TripwireReading[] {
  const strings = (x: unknown): boolean => Array.isArray(x) && x.every(k => typeof k === 'string' && k !== '');
  return (
    Array.isArray(v) &&
    v.every(raw => {
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return false;
      const r = raw as Record<string, unknown>;
      if (typeof r.sensor !== 'string' || r.sensor === '') return false;
      if (!(TRIPWIRE_OUTCOMES as readonly unknown[]).includes(r.outcome)) return false;
      if (!strings(r.deviations)) return false;
      if (r.reference !== null && typeof r.reference !== 'string') return false;
      if (typeof r.frozen !== 'boolean') return false;
      if (r.evidence === null || typeof r.evidence !== 'object' || Array.isArray(r.evidence)) return false;
      if ('stops' in r && !strings(r.stops)) return false;
      if ('answered_by' in r && !strings(r.answered_by)) return false;
      const keys = (r.deviations as string[]).length;
      return r.outcome === 'quiet' ? keys === 0 : keys > 0;
    })
  );
}
