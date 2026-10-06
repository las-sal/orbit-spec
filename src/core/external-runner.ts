/**
 * The external runner (rc17d-external-runner, `orbit-external-runner`).
 *
 * Two halves, both engine-side and both inert: the RESOLVER reads the user's per-user
 * `externalRunner` record and resolves it to an argv (the engine never executes it — the review
 * body's external branch does, under the user's `--reviewer external`); the SAVER normalizes an
 * external AI's raw return into the change's trail. Neither reads git state or runs a process.
 *
 * The record is `{preset: "codex"}` or `{argv: [...]}`, never a shell string: an array element is
 * exactly one argument, so nothing ever parses the record as a command line.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getGlobalConfig, type GlobalConfig } from './global-config.js';
import { createFenceTracker } from './markdown-fence.js';
import { readTrail, parseTsToken } from './artifact-graph/trail.js';

export const EXTERNAL_RUNNER_FIELD = 'externalRunner';

/**
 * The only preset. It passes no model flag, so the user's own Codex configuration chooses the model.
 * `-C {worktree}` names the reviewed checkout; `-o {output}` captures the final message; `-` reads the
 * prompt from standard input.
 */
export const RUNNER_PRESETS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  codex: Object.freeze(['codex', 'exec', '-C', '{worktree}', '-s', 'read-only', '-o', '{output}', '-']),
});

export const OUTPUT_PLACEHOLDER = '{output}';
export const WORKTREE_PLACEHOLDER = '{worktree}';

export type RunnerForm = 'preset' | 'argv';

export interface ResolvedRunner {
  form: RunnerForm;
  name: string;
  argv: string[];
  reachable: boolean;
}

export type RunnerShapeCheck =
  | { ok: true; form: RunnerForm; name: string; argv: string[] }
  | { ok: false; reason: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * The shape table of `The runner record is a preset name or an argv array, never a shell string`.
 * Every value is exactly one row: the two accepted forms, or a refusal naming its reason.
 */
export function checkRunnerShape(value: unknown): RunnerShapeCheck {
  if (typeof value === 'string') {
    return { ok: false, reason: 'is a string; the record is never parsed by a shell — record {"preset": "codex"} or {"argv": [...]}' };
  }
  if (!isPlainObject(value)) {
    return { ok: false, reason: 'must be an object, {"preset": "<name>"} or {"argv": [...]}' };
  }
  const keys = Object.keys(value);
  const hasPreset = keys.includes('preset');
  const hasArgv = keys.includes('argv');
  if (hasPreset && hasArgv) {
    return { ok: false, reason: 'carries both "preset" and "argv"; record exactly one' };
  }
  if (!hasPreset && !hasArgv) {
    return { ok: false, reason: 'carries neither "preset" nor "argv"' };
  }
  const extra = keys.filter((k) => k !== 'preset' && k !== 'argv');
  if (extra.length > 0) {
    return { ok: false, reason: `carries an unknown key beside ${hasPreset ? '"preset"' : '"argv"'}: ${extra.map((k) => `"${k}"`).join(', ')}` };
  }
  if (hasPreset) {
    const preset = value.preset;
    if (typeof preset !== 'string' || !Object.prototype.hasOwnProperty.call(RUNNER_PRESETS, preset)) {
      return {
        ok: false,
        reason: `names an unknown preset ${JSON.stringify(preset)}; the presets are ${Object.keys(RUNNER_PRESETS).map((p) => `"${p}"`).join(', ')}`,
      };
    }
    return { ok: true, form: 'preset', name: preset, argv: [...RUNNER_PRESETS[preset]] };
  }
  const argv = value.argv;
  if (!Array.isArray(argv) || argv.length === 0) {
    return { ok: false, reason: '"argv" must be a non-empty array of strings' };
  }
  const nonString = argv.findIndex((el) => typeof el !== 'string');
  if (nonString !== -1) {
    return { ok: false, reason: `"argv" element ${nonString} is not a string` };
  }
  if (!argv.some((el: string) => el.includes(OUTPUT_PLACEHOLDER))) {
    return { ok: false, reason: `"argv" carries no ${OUTPUT_PLACEHOLDER}, so the return would have nowhere to land` };
  }
  return { ok: true, form: 'argv', name: path.basename(argv[0]), argv: [...argv] };
}

/**
 * Whether `command` resolves to an executable file: a path (absolute, or relative to `cwd`) when it
 * carries a separator, else a `PATH` lookup. Executes nothing.
 */
export function isOnPath(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): boolean {
  if (command === '') return false;
  const isExecutable = (p: string): boolean => {
    try {
      const st = fs.statSync(p);
      if (!st.isFile()) return false;
      if (process.platform === 'win32') return true;
      fs.accessSync(p, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  };
  const exts =
    process.platform === 'win32'
      ? ['', ...(env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)]
      : [''];
  if (command.includes('/') || (process.platform === 'win32' && command.includes('\\'))) {
    const full = path.resolve(cwd, command);
    return exts.some((ext) => isExecutable(full + ext));
  }
  const dirs = (env.PATH ?? '').split(path.delimiter).filter(Boolean);
  return dirs.some((dir) => exts.some((ext) => isExecutable(path.join(dir, command + ext))));
}

export interface RunnerResolution {
  runner: ResolvedRunner | null;
  /** Warnings for standard error; empty when the record is absent or well-formed. */
  warnings: string[];
}

/**
 * Resolve the user's record. Never throws: every missing or bad state resolves to `none`, with a
 * warning naming the cause where there is one. Invalid JSON in the global file falls back through
 * `getGlobalConfig()`, which prints its own warning.
 */
export function resolveExternalRunner(
  config: GlobalConfig = getGlobalConfig(),
  env: NodeJS.ProcessEnv = process.env
): RunnerResolution {
  const record = (config as Record<string, unknown>)[EXTERNAL_RUNNER_FIELD];
  if (record === undefined) return { runner: null, warnings: [] };
  const shape = checkRunnerShape(record);
  if (!shape.ok) {
    return {
      runner: null,
      warnings: [`Warning: ${EXTERNAL_RUNNER_FIELD} ${shape.reason}; no external runner is used.`],
    };
  }
  return {
    runner: { form: shape.form, name: shape.name, argv: shape.argv, reachable: isOnPath(shape.argv[0], env) },
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// orbit external save
// ---------------------------------------------------------------------------

export class ExternalSaveError extends Error {}

export interface ExternalSaveOptions {
  projectRoot: string;
  change: string;
  mode: string;
  from: string;
  launch?: string;
  /** Test seam: the current time. */
  now?: Date;
}

export interface ExternalSaveResult {
  /** Repo-relative, forward slashes. */
  path: string;
  removed: string[];
}

const HEADING_PREFIX = '# External Review:';
const TS_TOKEN_EXACT = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/;

function tokenFor(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
}

// The emit surface's collision rule (rc03c system walk 1): advance a second until no trail file carries
// the token, so token order stays write order. Mirrors `bumpToken` in `emit-composition.ts`, a pinned
// module this stage does not touch.
function nextSecond(token: string): string {
  const d = new Date(token.replace(/-(\d{2})-(\d{2})Z$/, ':$1:$2Z'));
  d.setUTCSeconds(d.getUTCSeconds() + 1);
  return tokenFor(d);
}

/**
 * Locate the cut: the first line OUTSIDE every fenced block that begins with `# External Review:`.
 * Returns the byte offset of that line and the lines before it (each without its line ending), or
 * null when there is no such line.
 */
export function findUnfencedHeading(content: string): { offset: number; line: string; removed: string[] } | null {
  const fence = createFenceTracker();
  const removed: string[] = [];
  let offset = 0;
  while (offset <= content.length) {
    const nl = content.indexOf('\n', offset);
    const end = nl === -1 ? content.length : nl;
    const raw = content.slice(offset, end);
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    const wasInFence = fence.inFence;
    const isDelimiter = fence.handle(line);
    if (!wasInFence && !isDelimiter && line.startsWith(HEADING_PREFIX)) {
      return { offset, line, removed };
    }
    removed.push(line);
    if (nl === -1) break;
    offset = nl + 1;
  }
  return null;
}

/**
 * The requirement's eight steps, in order. Every refusal throws `ExternalSaveError` before anything is
 * written; the one write is the last act.
 */
export function saveExternalReturn(opts: ExternalSaveOptions): ExternalSaveResult {
  const refuse = (cause: string): never => {
    throw new ExternalSaveError(`${cause} (--from ${opts.from}); nothing written.`);
  };

  if (opts.mode !== 'proposal' && opts.mode !== 'system') {
    refuse(`--as must be proposal or system, got "${opts.mode}" (an external review has no architecture mode)`);
  }
  const mode = opts.mode as 'proposal' | 'system';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(opts.change) || opts.change.includes('..')) {
    refuse(`"${opts.change}" is not a change name`);
  }
  const changeDir = path.join(opts.projectRoot, 'orbit', 'changes', opts.change);
  if (!fs.existsSync(changeDir) || !fs.statSync(changeDir).isDirectory()) {
    refuse(`change "${opts.change}" does not exist`);
  }
  if (opts.launch !== undefined && !TS_TOKEN_EXACT.test(opts.launch)) {
    refuse(`--launch must be a trail token (YYYY-MM-DDTHH-MM-SSZ), got "${opts.launch}"`);
  }

  // 1. read
  let content = '';
  try {
    content = fs.readFileSync(opts.from, 'utf-8');
  } catch (e) {
    refuse(`cannot read the return: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
  }
  // 2. drop a leading byte-order mark
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  // 3. the first unfenced heading
  const cut = findUnfencedHeading(content);
  if (cut === null) {
    refuse(`no line beginning "${HEADING_PREFIX}" outside a fenced block`);
  }
  const { offset, line, removed } = cut!;
  // 4. it names this change
  if (!line.startsWith(`${HEADING_PREFIX} ${opts.change} (`)) {
    refuse(`the heading names another change: "${line}"`);
  }
  // 5. keep every byte from the heading on
  const kept = content.slice(offset);

  // 6. the trail reader decides acceptance — the unchanged reader, run over a staged copy
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-external-save-'));
  try {
    const stagedRuns = path.join(stage, '.orbit-runs');
    fs.mkdirSync(stagedRuns);
    fs.writeFileSync(path.join(stagedRuns, `external-${mode}-2000-01-01T00-00-00Z.md`), kept, 'utf-8');
    const staged = readTrail(stage);
    if (staged.passes.length !== 1) {
      refuse('the trail reader rejects the return (it needs the heading, a **Reviewer**: line and all three severity sections)');
    }
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }

  // 7. no apply after the launch
  const trail = readTrail(changeDir);
  if (opts.launch !== undefined) {
    const later = trail.applyTokens.filter((t) => t > opts.launch!);
    if (later.length > 0) {
      refuse(
        `apply-${later[later.length - 1]}.json is later than the launch ${opts.launch}: the return reviewed a state an apply has since changed — re-run the review`
      );
    }
  }

  // 8. write, the token clear of every trail file
  const runsDir = path.join(changeDir, '.orbit-runs');
  fs.mkdirSync(runsDir, { recursive: true });
  const taken = new Set(
    fs.readdirSync(runsDir).map((n) => parseTsToken(n)).filter((t): t is string => t !== null)
  );
  let token = tokenFor(opts.now ?? new Date());
  while (taken.has(token)) token = nextSecond(token);
  const filePath = path.join(runsDir, `external-${mode}-${token}.md`);
  fs.writeFileSync(filePath, kept, { encoding: 'utf-8', flag: 'wx' });

  const rel = path.relative(opts.projectRoot, filePath).split(path.sep).join('/');
  return { path: rel, removed };
}
