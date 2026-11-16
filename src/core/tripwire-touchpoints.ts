import { isPredicted, parseTouchpoints, targetMatches, type TouchpointsParse } from './parsers/touchpoints.js';
import type { TouchpointsSetting, TripwiresSetting } from './project-config.js';
import {
  cannotRead,
  emptyTree,
  gitOut,
  referenceOf,
  sensorHalts,
  settingAt,
  showAt,
  type Sensor,
  type SensorContext,
  type StopText,
  type TripwireReading,
} from './tripwires.js';

/**
 * The Touchpoints sensor (`orbit-tripwires`' `The Touchpoints sensor fires on unpredicted source past a tolerance`,
 * D-tw-17): the paths the change's committed work changed over its MEASURE (from its first commit's parent to HEAD,
 * renames off), against `design.md`'s `## Touchpoints` section at its reference (the fixed point, or HEAD before apply
 * begins), with the exempt set and both tolerances read from the config at that same reference.
 */

export const TOUCHPOINTS_SENSOR_ID = 'touchpoints';

/** One measured path: its changed lines, or null for a binary path whose lines git does not count. */
export interface MeasuredPath {
  path: string;
  lines: number | null;
}

/** One unpredicted source path in the evidence. */
export interface TouchpointsFile {
  path: string;
  lines: number | null;
  binary?: true;
  over?: true;
  declared_late?: true;
}

/**
 * Whether `p` is in the exempt set (design M7): a pattern holding no `/` matches the path's last segment; one holding
 * a `/` matches the whole path by the Touchpoints target forms (exact, directory prefix, glob).
 */
export function isExempt(patterns: readonly string[], p: string): boolean {
  const last = p.slice(p.lastIndexOf('/') + 1);
  return patterns.some(pat => (pat.includes('/') ? targetMatches(pat, p) : targetMatches(pat, last)));
}

/** Parses `git diff --numstat -z` output (no renames): `added\tdeleted\tpath\0` per path; `-` for a binary path. */
export function parseNumstatZ(out: string): MeasuredPath[] {
  const result: MeasuredPath[] = [];
  for (const rec of out.split('\0')) {
    if (rec === '') continue;
    const m = rec.match(/^(-|\d+)\t(-|\d+)\t([\s\S]*)$/);
    if (!m) continue;
    const binary = m[1] === '-' || m[2] === '-';
    result.push({ path: m[3], lines: binary ? null : Number(m[1]) + Number(m[2]) });
  }
  return result;
}

/** The pure arithmetic over measured paths: classification, both tolerances, keys and evidence. */
export function touchpointsArithmetic(args: {
  measured: MeasuredPath[];
  plan: TouchpointsParse;
  current: TouchpointsParse | null;
  ownDirs: string[];
  setting: TouchpointsSetting;
}): { deviations: string[]; evidence: Record<string, unknown> } {
  const { measured, plan, current, ownDirs, setting } = args;
  let sourceLines = 0;
  let unpredictedLines = 0;
  const files: TouchpointsFile[] = [];
  for (const m of measured) {
    if (ownDirs.some(d => m.path.startsWith(d))) continue; // the change's own folder
    if (isExempt(setting.exempt, m.path)) continue; // never source
    if (m.lines !== null) sourceLines += m.lines;
    if (isPredicted(plan.entries, m.path)) continue;
    if (m.lines !== null) unpredictedLines += m.lines;
    const f: TouchpointsFile = { path: m.path, lines: m.lines };
    if (m.lines === null) f.binary = true;
    // A binary path fires as past the per-file tolerance: its lines are not counted, and silence is never a pass.
    if (m.lines === null || m.lines > setting.per_file_lines) f.over = true;
    if (current !== null && isPredicted(current.entries, m.path)) f.declared_late = true;
    files.push(f);
  }
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const share = sourceLines > 0 ? (unpredictedLines / sourceLines) * 100 : null;
  const shareFired = share !== null && share > setting.share_percent;
  const firing = new Set<string>();
  for (const f of files) if (f.over || shareFired) firing.add(f.path);
  const deviations = [...firing].sort().map(p => `${TOUCHPOINTS_SENSOR_ID}:${p}`);
  return {
    deviations,
    evidence: {
      files,
      share: share === null ? null : Math.round(share * 10) / 10,
      share_fired: shareFired,
      malformed: plan.malformed.map(x => ({ line: x.line, text: x.text })),
      settings: {
        on_fire: setting.on_fire,
        exempt: [...setting.exempt],
        per_file_lines: setting.per_file_lines,
        share_percent: setting.share_percent,
      },
      notes: [...setting.notes],
    },
  };
}

/** `design.md` at `rev`, from the first own folder that holds one there. */
function designAt(ctx: SensorContext, rev: string | null): string | null {
  for (const d of ctx.ownDirs) {
    const t = showAt(ctx.projectRoot, rev, `${d}design.md`);
    if (t !== null) return t;
  }
  return null;
}

function runTouchpoints(ctx: SensorContext): TripwireReading {
  const id = TOUCHPOINTS_SENSOR_ID;
  const { commits, projectRoot } = ctx;
  if (commits.kind === 'no-git' || commits.kind === 'uncommitted') return cannotRead(id, commits.kind, null, false);
  const ref = referenceOf(commits) as { rev: string | null; frozen: boolean };
  const setting = settingAt(projectRoot, ref.rev).touchpoints;

  const design = designAt(ctx, ref.rev);
  if (design === null) return cannotRead(id, 'no-design', ref.rev, ref.frozen);
  const plan = parseTouchpoints(design);
  if (!plan.present) return cannotRead(id, 'no-section', ref.rev, ref.frozen);

  // The MEASURE: from the first commit's parent (the empty tree when it has none) to HEAD, committed only.
  const parent = gitOut(projectRoot, ['rev-parse', '--verify', '--quiet', `${commits.first}^`]);
  const base = parent !== null ? parent.trim() : emptyTree(projectRoot);
  if (base === null) return cannotRead(id, 'no-git', ref.rev, ref.frozen);
  const out = gitOut(projectRoot, ['diff', '--numstat', '--no-renames', '-z', '--relative', base, commits.head]);
  if (out === null) return cannotRead(id, 'no-git', ref.rev, ref.frozen);
  // The change's OWN paths: those its first-parent, non-merge commits from the first commit to HEAD changed, so a
  // path only a merge brought into the branch is not measured (a path both changed counts the whole range's lines).
  const own = gitOut(projectRoot, [
    'log',
    '--first-parent',
    '--no-merges',
    '--no-renames',
    '--relative',
    '--name-only',
    '-z',
    '--format=',
    parent !== null ? `${parent.trim()}..${commits.head}` : commits.head,
  ]);
  if (own === null) return cannotRead(id, 'no-git', ref.rev, ref.frozen);
  const ownPaths = new Set(own.split('\0').filter(x => x !== ''));

  // The CURRENT section (design.md at HEAD, read with git like the reference) marks a late declaration.
  let current: TouchpointsParse | null = null;
  if (ref.frozen) {
    const now = designAt(ctx, commits.head);
    if (now !== null) {
      const parsed = parseTouchpoints(now);
      if (parsed.present) current = parsed;
    }
  }

  // The `on_fire` the halt decision reads: `halt` when the config at the fixed point or at HEAD says so.
  const effective = { ...setting, on_fire: sensorHalts(projectRoot, commits, touchpointsSensor) ? ('halt' as const) : ('record' as const) };
  const { deviations, evidence } = touchpointsArithmetic({
    measured: parseNumstatZ(out).filter(m => ownPaths.has(m.path)),
    plan,
    current,
    ownDirs: ctx.ownDirs,
    setting: effective,
  });
  return {
    sensor: id,
    outcome: deviations.length > 0 ? 'fired' : 'quiet',
    deviations,
    reference: ref.rev,
    frozen: ref.frozen,
    evidence,
  };
}

const REASON_TEXT: Record<string, string> = {
  'no-git': 'the project is not a git repository, or git failed, so there is no committed work to measure',
  uncommitted: 'nothing about the change is committed yet, so there is no work to measure',
  'no-design': "the change has no design file to read its plan from",
  'no-section': "the change's design has no list of the files it expects to edit",
};

function list(paths: string[]): string {
  const shown = paths.slice(0, 10).join(', ');
  return paths.length > 10 ? `${shown} and ${paths.length - 10} more` : shown;
}

function touchpointsStopText(reading: TripwireReading, keys: string[]): StopText {
  const detail = `Sensor ${reading.sensor}, reference ${reading.reference ?? 'none'} (${reading.frozen ? 'fixed when building began' : 'the plan as it stands'}); evidence: ${JSON.stringify(reading.evidence)}`;
  if (reading.outcome === 'cannot-read') {
    const reason = String(reading.evidence.reason ?? '');
    return {
      about: `orbit could not check whether the change is editing the files its plan named: ${REASON_TEXT[reason] ?? reason}.`,
      question: 'Should the work go on as it is, without this check?',
      detail,
    };
  }
  const prefix = `${TOUCHPOINTS_SENSOR_ID}:`;
  const paths = keys.map(k => (k.startsWith(prefix) ? k.slice(prefix.length) : k));
  const share = reading.evidence.share_fired === true ? ` Files the plan did not name make up ${String(reading.evidence.share)}% of the changed lines of code.` : '';
  return {
    about: `The change edited code its plan did not name, more than the plan allows for: ${list(paths)}.${share}`,
    question: 'Should the work go on as it is, counting these files as part of the plan?',
    detail,
  };
}

function touchpointsDescribe(reading: TripwireReading, key: string): string {
  if (reading.outcome === 'cannot-read') {
    const reason = String(reading.evidence.reason ?? '');
    return `orbit could not check the change's work against its plan: ${REASON_TEXT[reason] ?? reason}`;
  }
  const p = key.startsWith(`${TOUCHPOINTS_SENSOR_ID}:`) ? key.slice(TOUCHPOINTS_SENSOR_ID.length + 1) : key;
  const files = Array.isArray(reading.evidence.files) ? (reading.evidence.files as TouchpointsFile[]) : [];
  const f = files.find(x => x.path === p);
  const settings = (reading.evidence.settings ?? {}) as { per_file_lines?: number; share_percent?: number };
  const parts: string[] = [];
  if (f) {
    const size = f.binary ? 'a binary file, whose lines git does not count' : `${String(f.lines)} changed lines`;
    parts.push(`the plan did not name ${p}, ${size}`);
    if (f.over) parts.push(f.binary ? 'which counts as past the per-file limit' : `more than the per-file limit of ${String(settings.per_file_lines)}`);
  } else {
    parts.push(`the plan did not name ${p}`);
  }
  if (reading.evidence.share_fired === true) {
    parts.push(
      `and files the plan did not name made up ${String(reading.evidence.share)}% of the changed lines of code, past the limit of ${String(settings.share_percent)}%`
    );
  }
  return parts.join('; ');
}

export const touchpointsSensor: Sensor = {
  id: TOUCHPOINTS_SENSOR_ID,
  run: runTouchpoints,
  stopText: touchpointsStopText,
  describe: touchpointsDescribe,
  onFire: (s: TripwiresSetting) => s.touchpoints.on_fire,
};
