import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadChangeContext, formatChangeStatus } from './artifact-graph/instruction-loader.js';
import { collectSameModePasses } from './report-render.js';
import { normalizeInternalPass } from './report-render.js';
import { parseChunkPreamble, chunkForGroup, type ChunkDeclaration } from './parsers/chunk-preamble.js';
import { countExploreFile, maturityRecommendation } from './parsers/explore-counter.js';
import {
  parseCheckboxes,
  captureDiffBase,
  filesTouchedSince,
  firstCommitTouching,
  gitObjectExists,
  isGitRepo,
  type CheckboxState,
} from './parsers/apply-state.js';

/**
 * `orbit emit <command>` — the engine-owned emit-composition surface (D-arc Stage D5,
 * capability orbit-emit-composition). ONE generic surface: the AI supplies only the
 * narrative payload; the engine composes the spine, deterministic facts, and computed
 * extensions, validates through the same normalizers the D4 renderer uses (the fail-loud
 * boundary at WRITE time), and writes EXACTLY ONE file, atomically.
 *
 * Post-write-semantics commands (change-scoped address-reviews, apply) compose their
 * `next_recommended` against a SYNTHETIC TRAIL — the on-disk trail plus the in-memory
 * candidate as-landed — so no provisional record ever exists and a crash leaves NO file.
 */

export class EmitError extends Error {}

export type EmitKind = 'workflow' | 'editorial' | 'lifecycle';

interface CommandSpec {
  kind: EmitKind;
  /** Scope capability per the target-resolution contract. */
  scopes: { change?: boolean; doc?: boolean; project?: boolean };
  /** The authoritative payload-field row (model is implicit on every command). */
  payloadFields: string[];
}

/** The engine-internal command→kind taxonomy table (orbit-conventions becomes engine data). */
const COMMANDS: Record<string, CommandSpec> = {
  explore: { kind: 'workflow', scopes: { change: true }, payloadFields: ['final_assessment'] },
  // D6: propose and ff RESOLVE a PR attachment and record its identity as one correlated
  // unit (`pr_attachment`); archive resolves nothing and reports observed state as two flat
  // fields. The asymmetry is deliberate — see `orbit-pr-lifecycle`'s zero-engine-git
  // requirement. `new`/`continue` are explicitly NOT extended: they never attach.
  propose: {
    kind: 'workflow',
    scopes: { change: true },
    payloadFields: ['final_assessment', 'pr_attachment'],
  },
  new: { kind: 'workflow', scopes: { change: true }, payloadFields: ['final_assessment'] },
  continue: { kind: 'workflow', scopes: { change: true }, payloadFields: ['final_assessment'] },
  ff: {
    kind: 'workflow',
    scopes: { change: true },
    payloadFields: ['final_assessment', 'pr_attachment'],
  },
  apply: {
    kind: 'workflow',
    scopes: { change: true },
    payloadFields: ['user_validation_tasks', 'assessment_suffix', 'gate_overridden', 'consent'],
  },
  verify: {
    kind: 'workflow',
    scopes: { change: true },
    payloadFields: [
      'final_assessment',
      'verdict',
      'fail_mode',
      'validator_message',
      'warnings_count',
      'scenarios_failed',
    ],
  },
  architect: {
    kind: 'workflow',
    scopes: { doc: true },
    payloadFields: [
      'final_assessment',
      'stages_touched',
      'rulings_captured',
      'completions_ratified',
      'handoff',
    ],
  },
  review: {
    kind: 'editorial',
    scopes: { change: true, doc: true },
    payloadFields: [
      'mode',
      'reviewer_class',
      'depth',
      'flags',
      'scorecard',
      'findings',
      'stale_suppressed',
      'commentary',
      'passes_run',
      'passes_skipped',
      'handoff',
    ],
  },
  'address-reviews': {
    kind: 'editorial',
    // TRIPLE-scope (D5 walk, external C2): change (with archived fallback), doc, and
    // bare project scope for anchor-less whole-repo walks — no walk hand-writes its log.
    scopes: { change: true, doc: true, project: true },
    payloadFields: [
      'source',
      'source_path',
      'source_command',
      'source_token',
      'latest_apply_token',
      'tie_break_rationale',
      'external_reviewer',
      'walk_mode',
      'walk_mode_source',
      'walk_mode_shifted_at_finding',
      'input_findings_summary',
      'pushback_verification',
      'resolution_summary',
      'resolutions',
      'remaining_markers_in_scope',
      'persisted_escalations',
      'delegation_directive',
      'final_assessment',
    ],
  },
  'audit-drift': {
    kind: 'editorial',
    scopes: { change: true, project: true },
    payloadFields: [
      'final_assessment',
      'categories_run',
      'findings_by_category',
      'findings_total',
      'findings',
      'stale_suppressed',
    ],
  },
  'review-external': {
    kind: 'editorial',
    scopes: { change: true },
    payloadFields: ['mode', 'prompt_path', 'target', 'final_assessment'],
  },
  archive: {
    kind: 'lifecycle',
    scopes: { change: true },
    payloadFields: [
      'final_assessment',
      'archive_path',
      'audit',
      'sync_specs',
      'unresolved_markers',
      'user_decision',
      'consent',
      'warnings',
      // D6: archive REPORTS the PR state its read-only preflight observed; it resolves no
      // attachment, so the fields are flat rather than the correlated `pr_attachment` unit.
      'pr_url',
      'pr_state',
    ],
  },
};

/** Spine + deterministic facts + computed extensions per command — REJECTED in payloads. */
const SPINE_FIELDS = ['command', 'timestamp', 'change', 'kind', 'next_recommended', 'doc'];
const ENGINE_OWNED_EXTRA: Record<string, string[]> = {
  review: ['final_assessment', 'iteration'],
  apply: [
    'final_assessment',
    'tasks_completed',
    'tasks_remaining',
    'user_validation_remaining',
    'chunk',
    'chunk_name',
    'chunk_complete',
    'tasks_completed_this_session',
    'files_touched',
    'diff_base',
  ],
  explore: ['decisions_captured', 'open_questions_count', 'open_questions_with_recommendation'],
  'address-reviews': ['iteration'],
  'review-external': ['awaiting_findings'],
};

export interface EmitTarget {
  change?: string;
  doc?: string;
}

export interface ComposedEmit {
  /** Absolute path of the written file. */
  path: string;
  emit: Record<string, unknown>;
}

interface ResolvedTarget {
  scope: 'change' | 'explore' | 'archived' | 'doc' | 'project';
  runsDir: string;
  /** Spine `change` value. */
  change: string | null;
  doc: string | null;
  /** For change-scoped: the change directory (status computation / trails). */
  changeDir: string | null;
}

function utcNow(): { timestamp: string; token: string } {
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  return { timestamp: iso, token: iso.replace(/:/g, '-') };
}

function bumpToken(token: string): string {
  // Advance the second-granular token by one second, preserving lexical ordering.
  const iso = token.replace(/-(\d{2})-(\d{2})Z$/, ':$1:$2Z');
  const d = new Date(iso);
  d.setUTCSeconds(d.getUTCSeconds() + 1);
  const next = d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  return next.replace(/:/g, '-');
}

function tokenToTimestamp(token: string): string {
  return token.replace(/-(\d{2})-(\d{2})Z$/, ':$1:$2Z');
}

// ---------------------------------------------------------------------------
// Target resolution (the per-command scope-capability contract)
// ---------------------------------------------------------------------------

/**
 * Emit targets are single canonical identifiers — a workstream name or a doc filename
 * stem, never a path (the same contained-identity rule as architecture doc names, D2).
 * Rejecting separators, traversal segments, and leading dots closes the path-traversal
 * write primitive on a surface whose whole contract is writing only orbit trails.
 */
function isValidTargetName(name: string): boolean {
  return name.length > 0 && !/[\\/]/.test(name) && !name.startsWith('.') && !name.includes('..');
}

/**
 * Defense in depth behind the name rule: an existing target directory must physically
 * resolve inside its orbit root — a symlinked workstream dir pointing elsewhere is not
 * a writable emit trail (the B2 generator's physical-containment precedent).
 */
function assertContained(dir: string, root: string, what: string): void {
  let real: string;
  let realRoot: string;
  try {
    real = fs.realpathSync(dir);
    realRoot = fs.realpathSync(root);
  } catch {
    return; // existence is the caller's check; unresolvable paths fail there
  }
  if (real !== realRoot && !real.startsWith(realRoot + path.sep)) {
    throw new EmitError(`${what} resolves outside ${root} — symlinked targets are not writable emit trails.`);
  }
}

/**
 * The trail dir must BE its container's physical `.orbit-runs` child — canonical
 * IDENTITY, not ancestry (external iter-3): containment alone accepts in-container
 * aliases (`.orbit-runs -> .` resolves to the container root and would land records
 * beside the artifacts; a sibling alias redirects them into another directory) —
 * lexically-correct paths whose physical record no trail reader would ever find.
 */
function assertCanonicalTrailDir(runsDir: string): void {
  let realRuns: string;
  let realParent: string;
  try {
    realRuns = fs.realpathSync(runsDir);
    realParent = fs.realpathSync(path.dirname(runsDir));
  } catch {
    return; // unresolvable paths fail at the write itself
  }
  if (realRuns !== path.join(realParent, '.orbit-runs')) {
    throw new EmitError(
      `trail directory ${runsDir} does not physically resolve to its container's canonical .orbit-runs child — aliased trail entries are never writable emit trails.`
    );
  }
}

function resolveTarget(projectRoot: string, command: string, target: EmitTarget): ResolvedTarget {
  const spec = COMMANDS[command];
  const { change, doc } = target;

  if (change !== undefined && doc !== undefined) {
    throw new EmitError('supply --change or --doc, never both — one target per invocation.');
  }
  if (change !== undefined && !isValidTargetName(change)) {
    throw new EmitError(
      `--change '${change}' is not a canonical workstream name (single name, no separators, no traversal).`
    );
  }
  if (doc !== undefined && !isValidTargetName(doc)) {
    throw new EmitError(
      `--doc '${doc}' is not a canonical doc name (single filename stem, no separators, no traversal).`
    );
  }
  if (doc !== undefined && !spec.scopes.doc) {
    throw new EmitError(`--doc is not a valid target for '${command}' (change-scoped command).`);
  }
  if (change !== undefined && !spec.scopes.change) {
    throw new EmitError(`--change is not a valid target for '${command}' (architecture-scoped command; use --doc).`);
  }
  if (change === undefined && doc === undefined) {
    if (spec.scopes.project) {
      // Bare project-scoped invocation (audit-drift, address-reviews).
      const runsDir = path.join(projectRoot, 'orbit', '.orbit-runs');
      return { scope: 'project', runsDir, change: null, doc: null, changeDir: null };
    }
    throw new EmitError(
      `'${command}' requires a target: ${spec.scopes.doc && !spec.scopes.change ? '--doc <doc-name>' : '--change <name>'}.`
    );
  }

  if (doc !== undefined) {
    const docPath = path.join(projectRoot, 'orbit', 'architecture', `${doc}.md`);
    if (!fs.existsSync(docPath)) {
      throw new EmitError(`architecture doc not found: ${docPath}`);
    }
    return {
      scope: 'doc',
      runsDir: path.join(projectRoot, 'orbit', 'architecture', '.orbit-runs'),
      change: null,
      doc,
      changeDir: null,
    };
  }

  // --change: the WORKSTREAM — a change, or the staging exploration for explore-trail emits.
  const name = change as string;
  const changeDir = path.join(projectRoot, 'orbit', 'changes', name);
  const exploreDir = path.join(projectRoot, 'orbit', 'explore', name);

  if (command === 'archive') {
    // The ARCHIVED change's trail, post-move: lexically greatest archive/*-<name>/ match
    // (never composed from today's date, which diverges across a UTC midnight).
    const archived = findArchivedDir(projectRoot, name);
    if (!archived) {
      const archiveRoot = path.join(projectRoot, 'orbit', 'changes', 'archive');
      throw new EmitError(
        `no archived directory matching ${path.join(archiveRoot, `*-${name}`)} — the archive emit writes AFTER the move completes.`
      );
    }
    assertContained(archived, path.join(projectRoot, 'orbit', 'changes', 'archive'), `archived change '${name}'`);
    return {
      scope: 'archived',
      runsDir: path.join(archived, '.orbit-runs'),
      change: name,
      doc: null,
      changeDir: archived,
    };
  }

  if (fs.existsSync(changeDir)) {
    assertContained(changeDir, path.join(projectRoot, 'orbit', 'changes'), `change '${name}'`);
    return {
      scope: 'change',
      runsDir: path.join(changeDir, '.orbit-runs'),
      change: name,
      doc: null,
      changeDir,
    };
  }
  if (fs.existsSync(exploreDir)) {
    assertContained(exploreDir, path.join(projectRoot, 'orbit', 'explore'), `exploration '${name}'`);
    return {
      scope: 'explore',
      runsDir: path.join(exploreDir, '.orbit-runs'),
      change: name,
      doc: null,
      changeDir: null,
    };
  }
  if (command === 'address-reviews') {
    // Archived-change FALLBACK (after active/staging miss — the archive emit stays
    // archived-first-and-only): discovery resolves archived changes, so their walks
    // must persist to the archived trail, never hand-write or fail.
    const archived = findArchivedDir(projectRoot, name);
    if (archived) {
      assertContained(archived, path.join(projectRoot, 'orbit', 'changes', 'archive'), `archived change '${name}'`);
      return {
        scope: 'archived',
        runsDir: path.join(archived, '.orbit-runs'),
        change: name,
        doc: null,
        changeDir: archived,
      };
    }
  }
  throw new EmitError(
    `workstream '${name}' not found — checked ${changeDir} and ${exploreDir}${command === 'address-reviews' ? ' and orbit/changes/archive/*-' + name : ''}.`
  );
}

/** Lexically greatest `orbit/changes/archive/<YYYY-MM-DD>-<name>/` match, or null. */
function findArchivedDir(projectRoot: string, name: string): string | null {
  const archiveRoot = path.join(projectRoot, 'orbit', 'changes', 'archive');
  let candidates: string[] = [];
  try {
    candidates = fs
      .readdirSync(archiveRoot)
      .filter(e => new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${escapeRegExp(name)}$`).test(e))
      .sort();
  } catch {
    candidates = [];
  }
  return candidates.length > 0 ? path.join(archiveRoot, candidates[candidates.length - 1]) : null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Payload validation (the authoritative per-command table)
// ---------------------------------------------------------------------------

function validatePayload(command: string, payload: Record<string, unknown>): void {
  const spec = COMMANDS[command];
  const engineOwned = new Set([...SPINE_FIELDS, ...(ENGINE_OWNED_EXTRA[command] ?? [])]);
  const allowed = new Set([...spec.payloadFields, 'model']);

  for (const key of Object.keys(payload)) {
    if (key === 'model') continue;
    if (engineOwned.has(key)) {
      throw new EmitError(`payload field '${key}' is engine-owned for '${command}' — a second voice on a computable fact is refused at the seam.`);
    }
    if (!allowed.has(key)) {
      throw new EmitError(`unknown payload key '${key}' for '${command}' — not in the command's payload table and not engine-owned.`);
    }
  }
  if (!('model' in payload)) {
    throw new EmitError(`payload is missing the required 'model' key (explicit null allowed) — provenance is a conscious act.`);
  }

  // D6 STRUCTURAL validation of the PR fields. Their VALUES stay narrative pass-through —
  // the engine cannot verify that a branch or a PR exists — but their STRUCTURE is checked
  // here, because `pr_attachment` is the AUTHORITATIVE record later bodies dereference: an
  // emit carrying `{granularty: ...}` or a missing `branch` would otherwise sail through a
  // seam advertised as fail-loud and be read back at archive as truth.
  validatePrFields(command, payload);
}

const PR_GRANULARITIES = new Set(['per-proposal', 'per-architecture']);
const PR_STATES = new Set(['draft', 'ready']);
const PR_ATTACHMENT_KEYS = new Set(['branch', 'granularity', 'url', 'state', 'doc']);

function validatePrFields(command: string, payload: Record<string, unknown>): void {
  const attachment = payload.pr_attachment;
  if (attachment !== undefined) {
    if (typeof attachment !== 'object' || attachment === null || Array.isArray(attachment)) {
      throw new EmitError(`'pr_attachment' must be an object for '${command}' — got ${Array.isArray(attachment) ? 'an array' : typeof attachment}.`);
    }
    const obj = attachment as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (!PR_ATTACHMENT_KEYS.has(key)) {
        throw new EmitError(`unknown key 'pr_attachment.${key}' — the attachment record's shape is closed (${[...PR_ATTACHMENT_KEYS].join(', ')}).`);
      }
    }
    for (const req of ['branch', 'granularity'] as const) {
      if (obj[req] === undefined) {
        throw new EmitError(`'pr_attachment.${req}' is required — the attachment record is the authoritative identity the archive tail reads back.`);
      }
    }
    for (const key of PR_ATTACHMENT_KEYS) {
      if (obj[key] !== undefined && typeof obj[key] !== 'string') {
        throw new EmitError(`'pr_attachment.${key}' must be a string — got ${typeof obj[key]}.`);
      }
    }
    if (!PR_GRANULARITIES.has(obj.granularity as string)) {
      throw new EmitError(`'pr_attachment.granularity' must be one of ${[...PR_GRANULARITIES].join(' | ')} — got '${String(obj.granularity)}'.`);
    }
    if (obj.state !== undefined && !PR_STATES.has(obj.state as string)) {
      throw new EmitError(`'pr_attachment.state' must be one of ${[...PR_STATES].join(' | ')} — got '${String(obj.state)}'; a closed or merged PR is not representable on the draft/ready axis and elides the field.`);
    }
    // The conditional `doc` rule, enforced in BOTH directions: without it a program PR
    // cannot be correlated to its program once the birth change is archived, and a repo
    // running two programs has two indistinguishable URLs.
    if (obj.granularity === 'per-architecture' && obj.doc === undefined) {
      throw new EmitError(`'pr_attachment.doc' is required when granularity is 'per-architecture' — the program PR cannot be correlated to its doc without it.`);
    }
    if (obj.granularity === 'per-proposal' && obj.doc !== undefined) {
      throw new EmitError(`'pr_attachment.doc' must be absent when granularity is 'per-proposal' — a per-change PR belongs to no program.`);
    }
  }

  if (payload.pr_url !== undefined && typeof payload.pr_url !== 'string') {
    throw new EmitError(`'pr_url' must be a string — got ${typeof payload.pr_url}.`);
  }
  if (payload.pr_state !== undefined && !PR_STATES.has(payload.pr_state as string)) {
    throw new EmitError(`'pr_state' must be one of ${[...PR_STATES].join(' | ')} — got '${String(payload.pr_state)}'; a closed or merged PR is not representable on the draft/ready axis and elides the field.`);
  }
}

// ---------------------------------------------------------------------------
// Deterministic facts + per-command computed extensions
// ---------------------------------------------------------------------------

function countsSentence(scorecard: any): string {
  const dims = ['completeness', 'correctness', 'coherence'];
  let c = 0,
    w = 0,
    s = 0;
  for (const d of dims) {
    c += scorecard?.[d]?.critical ?? 0;
    w += scorecard?.[d]?.warning ?? 0;
    s += scorecard?.[d]?.suggestion ?? 0;
  }
  if (c === 0 && w === 0 && s === 0) return 'No findings.';
  return `${c} critical, ${w} warning, ${s} suggestion.`;
}

function hasFindings(payload: any): boolean {
  return Array.isArray(payload.findings) && payload.findings.length > 0;
}

interface ApplyComputed {
  tasks_completed: number;
  tasks_remaining: number;
  user_validation_remaining: number;
  chunk: string | null;
  chunk_name: string | null;
  chunk_complete: boolean;
  tasks_completed_this_session: number;
  files_touched: string[] | null;
  diff_base: string | null;
  assessmentCore: string;
  preambleWarning?: string;
}

function computeApply(
  projectRoot: string,
  target: ResolvedTarget,
  payload: any
): ApplyComputed {
  const changeDir = target.changeDir as string;
  const tasksPath = path.join(changeDir, 'tasks.md');
  let content = '';
  try {
    content = fs.readFileSync(tasksPath, 'utf-8');
  } catch {
    throw new EmitError(`tasks.md not found at ${tasksPath} — apply emits require the tasks artifact.`);
  }
  const boxes: CheckboxState = parseCheckboxes(content);

  // The payload's ONE checkbox judgment: the user-validation task-id list. Each named
  // task must exist and be unchecked; the count and per-chunk subsets are engine-derived.
  const uvList: string[] = Array.isArray(payload.user_validation_tasks)
    ? payload.user_validation_tasks.map(String)
    : [];
  const uncheckedIds = new Set(boxes.groups.flatMap(g => g.uncheckedIds));
  const checkedIds = new Set(boxes.groups.flatMap(g => g.checkedIds));
  for (const id of uvList) {
    if (checkedIds.has(id)) {
      throw new EmitError(`user_validation_tasks entry '${id}' names a CHECKED task — the judgment list may only name unchecked tasks.`);
    }
    if (!uncheckedIds.has(id)) {
      throw new EmitError(`user_validation_tasks entry '${id}' names no unchecked task in tasks.md.`);
    }
  }
  const uvByGroup = new Map<number, number>();
  for (const g of boxes.groups) {
    if (g.group === null) continue;
    uvByGroup.set(g.group, g.uncheckedIds.filter(id => uvList.includes(id)).length);
  }

  // Chunk resolution from the engine-owned preamble grammar.
  const preamble = parseChunkPreamble(content, tasksPath);
  let chunk: string | null = null;
  let chunkName: string | null = null;
  let chunkComplete: boolean;
  let currentDecl: ChunkDeclaration | null = null;
  let preambleWarning: string | undefined;
  let declarations: ChunkDeclaration[] | null = null;

  if (preamble.kind === 'ok') {
    declarations = preamble.declarations;
    const remainingIn = (d: ChunkDeclaration): number => {
      let n = 0;
      for (const g of boxes.groups) {
        if (g.group !== null && g.group >= d.groupStart && g.group <= d.groupEnd) {
          n += g.unchecked - g.uncheckedIds.filter(id => uvList.includes(id)).length;
        }
      }
      return n;
    };
    const checkedIn = (d: ChunkDeclaration): number =>
      boxes.groups
        .filter(g => g.group !== null && g.group >= d.groupStart && g.group <= d.groupEnd)
        .reduce((n, g) => n + g.checked, 0);
    // Chunk identity at the boundary (rule 1): when chunk N's last task was just checked
    // and chunk N+1 is untouched, the emit records chunk N COMPLETE — so the current
    // chunk is the HIGHEST chunk with any checked work (the first chunk when none has).
    const withChecked = declarations.filter(d => checkedIn(d) > 0);
    currentDecl = withChecked.length > 0 ? withChecked[withChecked.length - 1] : declarations[0];
    chunk = `${currentDecl.chunk} of ${declarations.length}`;
    chunkName = currentDecl.name;
    chunkComplete = remainingIn(currentDecl) === 0;
  } else {
    if (preamble.kind === 'malformed') preambleWarning = preamble.warning;
    // No-chunking (absent or malformed-fallback): the whole task set stands in as the
    // "current chunk" — the same engine formula, never a constant.
    chunkComplete = boxes.tasksRemaining - uvList.length === 0;
  }

  // Diff boundary: the previous apply emit's recorded diff_base tree; fallbacks per spec.
  const runsDir = target.runsDir;
  let prevBase: string | null = null;
  try {
    const prior = fs
      .readdirSync(runsDir)
      .filter(f => /^apply-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/.test(f))
      .sort();
    if (prior.length > 0) {
      const last = JSON.parse(fs.readFileSync(path.join(runsDir, prior[prior.length - 1]), 'utf-8'));
      if (typeof last.diff_base === 'string' && last.diff_base) prevBase = last.diff_base;
    }
  } catch {
    prevBase = null;
  }

  let filesTouched: string[] | null = null;
  let diffBase: string | null = null;
  if (isGitRepo(projectRoot)) {
    let base: string | null = prevBase && gitObjectExists(projectRoot, prevBase) ? prevBase : null;
    if (!base) {
      const rel = path.relative(projectRoot, changeDir);
      base = firstCommitTouching(projectRoot, rel);
    }
    if (base) filesTouched = filesTouchedSince(projectRoot, base);
    diffBase = captureDiffBase(projectRoot);
  }

  // Prior-emit totals for the session delta.
  let priorCompleted = 0;
  try {
    const prior = fs
      .readdirSync(runsDir)
      .filter(f => /^apply-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/.test(f))
      .sort();
    if (prior.length > 0) {
      const last = JSON.parse(fs.readFileSync(path.join(runsDir, prior[prior.length - 1]), 'utf-8'));
      if (typeof last.tasks_completed === 'number') priorCompleted = last.tasks_completed;
    }
  } catch {
    priorCompleted = 0;
  }

  const core =
    chunk !== null
      ? chunkComplete
        ? `Completed chunk ${chunk}${chunkName ? ` (${chunkName})` : ''}; ${boxes.tasksCompleted} of ${boxes.tasksCompleted + boxes.tasksRemaining} tasks done.`
        : `Paused mid-chunk ${chunk}${chunkName ? ` (${chunkName})` : ''}; ${boxes.tasksCompleted} of ${boxes.tasksCompleted + boxes.tasksRemaining} tasks done.`
      : `${boxes.tasksCompleted} of ${boxes.tasksCompleted + boxes.tasksRemaining} tasks done.`;

  return {
    tasks_completed: boxes.tasksCompleted,
    tasks_remaining: boxes.tasksRemaining,
    user_validation_remaining: uvList.length,
    chunk,
    chunk_name: chunkName,
    chunk_complete: chunkComplete,
    tasks_completed_this_session: Math.max(0, boxes.tasksCompleted - priorCompleted),
    files_touched: filesTouched,
    diff_base: diffBase,
    assessmentCore: core,
    preambleWarning,
  };
}

/** Name of chunk N+1 (for the engine-composed ` — next chunk: <name>` suffix). */
function nextChunkName(changeDir: string, completedChunk: number): string | null {
  const tasksPath = path.join(changeDir, 'tasks.md');
  let content = '';
  try {
    content = fs.readFileSync(tasksPath, 'utf-8');
  } catch {
    return null;
  }
  const preamble = parseChunkPreamble(content, tasksPath);
  if (preamble.kind !== 'ok') return null;
  const next = preamble.declarations.find(d => d.chunk === completedChunk + 1);
  return next ? next.name : null;
}

// ---------------------------------------------------------------------------
// Write gate
// ---------------------------------------------------------------------------

function universalSpineCheck(emit: Record<string, unknown>, target: ResolvedTarget): void {
  const required = ['command', 'timestamp', 'final_assessment', 'next_recommended', 'kind'];
  for (const f of required) {
    if (typeof emit[f] !== 'string' || (emit[f] as string).trim() === '') {
      throw new EmitError(`write gate: spine field '${f}' missing or empty.`);
    }
  }
  if (!('model' in emit)) {
    throw new EmitError(`write gate: spine field 'model' missing (nullable, never absent).`);
  }
  if (emit.model !== null && typeof emit.model !== 'string') {
    throw new EmitError(`write gate: spine field 'model' must be a string or null.`);
  }
  if (target.scope === 'doc' || target.scope === 'project') {
    if (emit.change !== null) throw new EmitError(`write gate: 'change' must be null for ${target.scope}-scoped emits.`);
    if (target.scope === 'doc' && typeof emit.doc !== 'string') {
      throw new EmitError(`write gate: 'doc' required for architecture-scoped emits.`);
    }
  } else if (typeof emit.change !== 'string') {
    throw new EmitError(`write gate: 'change' must be a string for change-scoped emits.`);
  }
}

function scorecardRollupCheck(emit: any): void {
  const dims: Array<'completeness' | 'correctness' | 'coherence'> = [
    'completeness',
    'correctness',
    'coherence',
  ];
  const sevs = [
    ['critical', 'CRITICAL'],
    ['warning', 'WARNING'],
    ['suggestion', 'SUGGESTION'],
  ] as const;
  const findings: any[] = Array.isArray(emit.findings) ? emit.findings : [];
  for (const d of dims) {
    for (const [cell, sev] of sevs) {
      const declared = emit.scorecard?.[d]?.[cell];
      const actual = findings.filter(f => f?.dimension === d && f?.severity === sev).length;
      if (declared !== actual) {
        throw new EmitError(
          `write gate: scorecard cell ${d}.${cell} = ${declared} but findings roll up to ${actual}.`
        );
      }
    }
  }
}

function handoffShapeCheck(handoff: any): void {
  if (!handoff || typeof handoff !== 'object') {
    throw new EmitError(`write gate: architecture-scoped emit requires the architect-owned 'handoff' section.`);
  }
  if (!Array.isArray(handoff.boot_sequence)) {
    throw new EmitError(`write gate: handoff.boot_sequence must be an ordered pointer array.`);
  }
  if (typeof handoff.next_command !== 'string' || handoff.next_command.trim() === '') {
    throw new EmitError(`write gate: handoff.next_command missing.`);
  }
  // The FULL architect-owned shape (R-d-9(b)): model_hint nullable-never-absent, seam named.
  if (!('model_hint' in handoff) || (handoff.model_hint !== null && typeof handoff.model_hint !== 'string')) {
    throw new EmitError(`write gate: handoff.model_hint must be a string or null (nullable, never absent).`);
  }
  if (typeof handoff.seam !== 'string' || handoff.seam.trim() === '') {
    throw new EmitError(`write gate: handoff.seam missing.`);
  }
}

function writeGate(emit: Record<string, unknown>, target: ResolvedTarget, filePath: string): void {
  universalSpineCheck(emit, target);
  const command = emit.command as string;
  if (command === 'review') {
    const mode = (emit as any).mode;
    if (mode === 'proposal' || mode === 'system') {
      // The strict internal normalizer — the same validation the D4 read side uses.
      normalizeInternalPass(filePath, emit);
    } else if (mode === 'architecture') {
      // D4's architecture-mode render exemption drawn at write time: universal spine
      // (change: null + doc accepted above) + rollup equality + the handoff shape.
      scorecardRollupCheck(emit);
      handoffShapeCheck((emit as any).handoff);
    } else {
      throw new EmitError(`write gate: review emit has invalid mode '${String(mode)}'.`);
    }
  }
  if (command === 'architect') {
    handoffShapeCheck((emit as any).handoff);
  }
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export interface ComposeOptions {
  projectRoot?: string;
}

export interface ComposeResult extends ComposedEmit {
  /** stderr-suitable warnings gathered during composition (malformed preamble, missing sections). */
  warnings: string[];
}

export function composeAndWriteEmit(
  command: string,
  target: EmitTarget,
  payload: Record<string, unknown>,
  options: ComposeOptions = {}
): ComposeResult {
  const projectRoot = options.projectRoot ?? '.';
  const spec = COMMANDS[command];
  if (!spec) {
    throw new EmitError(
      `unknown emit command '${command}' — supported: ${Object.keys(COMMANDS).join(', ')}.`
    );
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new EmitError('payload must be a JSON object (stdin or --payload <file>).');
  }

  const resolved = resolveTarget(projectRoot, command, target);
  validatePayload(command, payload);

  const warnings: string[] = [];

  // Review filenames carry the mode (the trail vocabulary: review-<mode>-<TS>.json);
  // mode and target scope must agree before anything else composes.
  let filePrefix = command;
  if (command === 'review') {
    const mode = (payload as any).mode;
    if (mode !== 'proposal' && mode !== 'system' && mode !== 'architecture') {
      throw new EmitError(`review payload 'mode' must be proposal|system|architecture.`);
    }
    if (mode === 'architecture' && resolved.scope !== 'doc') {
      throw new EmitError(`review mode 'architecture' requires --doc (the architecture trail).`);
    }
    if (mode !== 'architecture' && resolved.scope === 'doc') {
      throw new EmitError(`--doc requires review mode 'architecture'.`);
    }
    filePrefix = `review-${mode}`;
  }

  // Filename-token resolution — INCLUDING the collision bump — precedes deterministic-fact
  // composition, so a self-pointer always names the FINAL written path.
  fs.mkdirSync(resolved.runsDir, { recursive: true });
  // The trail dir ITSELF must be its container's canonical `.orbit-runs` child
  // (external iter-2 caught the outside-container symlink; iter-3 the in-container
  // alias). Checked after creation, before any write; dirname-uniform, so every
  // scope (change/explore/archived/doc/project) is covered.
  assertCanonicalTrailDir(resolved.runsDir);
  let { token } = utcNow();
  while (fs.existsSync(path.join(resolved.runsDir, `${filePrefix}-${token}.json`))) {
    token = bumpToken(token);
  }
  const filename = `${filePrefix}-${token}.json`;
  const filePath = path.join(resolved.runsDir, filename);
  const timestamp = tokenToTimestamp(token);

  // Spine skeleton.
  const emit: Record<string, unknown> = {
    command,
    timestamp,
    change: resolved.change,
    ...(resolved.doc !== null ? { doc: resolved.doc } : {}),
    kind: spec.kind,
    model: payload.model ?? null,
  };
  for (const f of spec.payloadFields) {
    if (f in payload) emit[f] = payload[f];
  }

  // Per-command computed extensions + deterministic facts.
  let postWrite = false;
  switch (command) {
    case 'explore': {
      const workstreamDir =
        resolved.scope === 'explore'
          ? path.join(projectRoot, 'orbit', 'explore', resolved.change as string)
          : (resolved.changeDir as string);
      const counts = countExploreFile(path.join(workstreamDir, 'explore.md'));
      for (const s of counts.missingSections) {
        warnings.push(`note: explore.md has no '## ${s}' section — count recorded as 0 (five-section format violation to fix on next touch).`);
      }
      emit.decisions_captured = counts.decisionsCaptured;
      emit.open_questions_count = counts.openQuestionsCount;
      emit.open_questions_with_recommendation = counts.attestation;
      emit.next_recommended = maturityRecommendation(
        resolved.change as string,
        counts.decisionsCaptured,
        counts.openQuestionsCount
      );
      break;
    }
    case 'review': {
      const mode = (emit as any).mode;
      emit.final_assessment = countsSentence((payload as any).scorecard);
      if (mode === 'architecture') {
        // Per-doc ordinal + the handoff mirror (no change-report surface exists).
        const runs = fs.existsSync(resolved.runsDir) ? fs.readdirSync(resolved.runsDir) : [];
        const prior = runs.filter(f => {
          if (!/^review-architecture-.*\.json$/.test(f)) return false;
          try {
            const j = JSON.parse(fs.readFileSync(path.join(resolved.runsDir, f), 'utf-8'));
            return j.doc === resolved.doc;
          } catch {
            return false;
          }
        });
        emit.iteration = prior.length + 1;
        emit.next_recommended = hasFindings(payload)
          ? `/orbit:address-reviews --from-file ${path.relative(projectRoot, filePath)}`
          : String((payload as any).handoff?.next_command ?? '');
      } else {
        // Shared internal+external pass axis (the report ordinal's counting rule).
        const passes = collectSameModePasses(resolved.changeDir as string, mode);
        emit.iteration = passes.length + 1;
        emit.next_recommended = hasFindings(payload)
          ? `/orbit:address-reviews ${resolved.change} --from-file ${path.relative(projectRoot, filePath)}`
          : `orbit status --change ${resolved.change} --report`;
      }
      break;
    }
    case 'review-external': {
      const promptPath = String((payload as any).prompt_path ?? '');
      if (!promptPath) throw new EmitError(`review-external T0 payload requires 'prompt_path'.`);
      const mode = String((payload as any).mode ?? 'proposal');
      const findingsPattern = promptPath.replace('external-prompt-', 'external-').replace(/\.md$/, '').replace(/-\d{4}.*$/, `-<TS>`);
      emit.awaiting_findings = true;
      emit.next_recommended = `Paste ${promptPath} into the target AI, save the response as ${path.dirname(promptPath)}/external-${mode}-<TS>.md, then /orbit:address-reviews ${resolved.change} --from-file <path>`;
      void findingsPattern;
      break;
    }
    case 'apply': {
      const computed = computeApply(projectRoot, resolved, payload);
      if (computed.preambleWarning) warnings.push(computed.preambleWarning);
      emit.tasks_completed = computed.tasks_completed;
      emit.tasks_remaining = computed.tasks_remaining;
      emit.user_validation_remaining = computed.user_validation_remaining;
      emit.chunk = computed.chunk;
      emit.chunk_name = computed.chunk_name;
      emit.chunk_complete = computed.chunk_complete;
      emit.tasks_completed_this_session = computed.tasks_completed_this_session;
      emit.files_touched = computed.files_touched;
      emit.diff_base = computed.diff_base;
      const suffix = typeof (payload as any).assessment_suffix === 'string' && (payload as any).assessment_suffix.trim() !== ''
        ? ` ${(payload as any).assessment_suffix.trim()}`
        : '';
      emit.final_assessment = `${computed.assessmentCore}${suffix}`;
      delete (emit as any).assessment_suffix;
      // The verified identifier list PERSISTS on the emit (D5 walk): the tracked-gate
      // user-validation subset rule reads it from the trail; an empty list is elided.
      if (!Array.isArray((emit as any).user_validation_tasks) || (emit as any).user_validation_tasks.length === 0) {
        delete (emit as any).user_validation_tasks;
      }
      postWrite = true;
      break;
    }
    case 'address-reviews': {
      const runs = fs.existsSync(resolved.runsDir) ? fs.readdirSync(resolved.runsDir) : [];
      const walkLogs = runs.filter(f => /^address-reviews-.*\.json$/.test(f));
      // Doc-scoped walks anchor per doc: the architecture trail is SHARED across
      // docs, so doc B's ordinal must not count doc A's logs (the same per-doc
      // rule as the review-architecture ordinal above).
      const prior =
        resolved.scope === 'doc'
          ? walkLogs.filter(f => {
              try {
                const j = JSON.parse(fs.readFileSync(path.join(resolved.runsDir, f), 'utf-8'));
                return j.doc === resolved.doc;
              } catch {
                return false;
              }
            })
          : walkLogs;
      emit.iteration = prior.length + 1;
      if (resolved.scope === 'doc') {
        // Doc-scoped walk: pre-computable, the gate-less confirm pointer naming the doc.
        emit.next_recommended = `/orbit:review --as architecture ${resolved.doc} — confirm the resolutions`;
      } else if (resolved.scope === 'project') {
        // Anchor-less whole-repo walk: findings-dependent, computed from the payload's
        // own remaining-markers count — no change status exists to synthesize. The count
        // DRIVES a deterministic engine fact, so it fails loud when missing or invalid
        // (a fabricated 'no markers remain' is the wrong-but-plausible record class).
        const remaining = (payload as any).remaining_markers_in_scope;
        if (typeof remaining !== 'number' || !Number.isInteger(remaining) || remaining < 0) {
          throw new EmitError(
            `project-scoped address-reviews requires a non-negative integer remaining_markers_in_scope — the count drives the engine's recommendation and is never defaulted.`
          );
        }
        emit.next_recommended =
          remaining > 0
            ? `/orbit:address-reviews — ${remaining} marker(s) remain in scope`
            : 'No markers remain in scope; the project trail records this walk.';
      } else if (resolved.scope === 'archived') {
        // Archived-change walk: no live gate graph exists to point at.
        emit.next_recommended =
          'No lifecycle follows an archived-change walk; the archived trail records the resolution log.';
      } else {
        postWrite = true;
      }
      break;
    }
    case 'archive': {
      emit.next_recommended =
        'Change archived. Run /orbit:new or /orbit:explore to start the next change, or /orbit:audit-drift for a project-wide drift check.';
      break;
    }
    case 'architect': {
      emit.next_recommended = String((payload as any).handoff?.next_command ?? '');
      break;
    }
    case 'verify': {
      const failMode = (payload as any).fail_mode ?? null;
      const name = resolved.change as string;
      if (failMode === 'validator-error') {
        emit.next_recommended = `Fix artifact validation errors: ${String((payload as any).validator_message ?? '')}`;
      } else if (failMode === 'tasks-incomplete') {
        const boxes = parseCheckboxes(
          fs.readFileSync(path.join(resolved.changeDir as string, 'tasks.md'), 'utf-8')
        );
        emit.next_recommended = `/orbit:apply ${name} — ${boxes.tasksRemaining} tasks remaining`;
      } else if (failMode === 'scenarios-fail') {
        // Baseline mode-② template carries the scenario count when the payload supplies it.
        const n = (payload as any).scenarios_failed;
        const countPrefix =
          typeof n === 'number' && Number.isInteger(n) && n > 0 ? `${n} spec scenarios` : 'spec scenarios';
        emit.next_recommended = `/orbit:review --as system ${name} — ${countPrefix} fail against implementation; system review will surface findings in its scorecard for you to walk each as code fix or spec revision`;
      } else if (failMode === 'warnings') {
        // Warn state (pass with non-blocking findings): a truthful record, never 'clean'.
        const n = (payload as any).warnings_count;
        if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) {
          throw new EmitError(
            `verify fail_mode 'warnings' requires a positive integer warnings_count — a warn-state record without its count is the wrong-but-plausible class this surface exists to prevent.`
          );
        }
        emit.next_recommended = `/orbit:review --as system ${name} — verification passed with ${n} warnings; system review recommended`;
      } else if (failMode === 'incomplete') {
        emit.next_recommended = `Re-run /orbit:verify ${name} — prior verify run incomplete (see verify-change output for details)`;
      } else {
        emit.next_recommended = `/orbit:review --as system ${name} — verification clean; formal pre-archive review recommended (or /orbit:archive ${name} if you're skipping the editorial pass)`;
      }
      delete (emit as any).fail_mode;
      delete (emit as any).validator_message;
      delete (emit as any).warnings_count;
      delete (emit as any).scenarios_failed;
      break;
    }
    case 'audit-drift': {
      const total = Number((payload as any).findings_total ?? 0);
      if (resolved.scope === 'project') {
        emit.next_recommended =
          total > 0
            ? `/orbit:address-reviews --from-file ${path.relative(projectRoot, filePath)} — ${total} drift(s) detected project-wide; resolve before next workflow step`
            : 'No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift.';
      } else if (total > 0) {
        emit.next_recommended = `/orbit:address-reviews ${resolved.change} — ${total} drift(s) detected; resolve before next workflow step`;
      } else {
        // Clean: defer to the most recent prior emit's recommendation.
        let deferred: string | null = null;
        try {
          const prior = fs
            .readdirSync(resolved.runsDir)
            .filter(f => f.endsWith('.json'))
            .sort();
          for (let i = prior.length - 1; i >= 0; i--) {
            const j = JSON.parse(fs.readFileSync(path.join(resolved.runsDir, prior[i]), 'utf-8'));
            if (typeof j.next_recommended === 'string' && j.next_recommended.trim() !== '') {
              deferred = j.next_recommended;
              break;
            }
          }
        } catch {
          deferred = null;
        }
        emit.next_recommended = deferred ?? `orbit status --change ${resolved.change}`;
      }
      break;
    }
    default: {
      // Propose family: propose/ff are propose-shaped; new/continue are completion-aware.
      const name = resolved.change as string;
      if (command === 'propose' || command === 'ff') {
        emit.next_recommended = `/orbit:review ${name} — proposal artifacts ready; review before apply`;
      } else {
        const context = loadChangeContext(projectRoot, name);
        const status = formatChangeStatus(context);
        if (status.isComplete) {
          emit.next_recommended = `/orbit:review ${name} — all proposal artifacts now present`;
        } else {
          const nextArtifact = status.artifacts.find(a => a.status === 'ready');
          emit.next_recommended = `/orbit:continue ${name} — ${nextArtifact ? nextArtifact.outputPath : 'next artifact'} still pending`;
        }
      }
      break;
    }
  }

  // Post-write semantics: compose complete except next_recommended, compute status against
  // the SYNTHETIC TRAIL (disk + candidate as-landed), stamp, then full-gate + single write.
  if (postWrite) {
    if (resolved.scope !== 'change') {
      throw new EmitError(`internal: post-write-semantics composition requires a change scope.`);
    }
    // The candidate needs a plausible next_recommended for the overlay's spine parse; a
    // placeholder is fine — the trail reader consumes counts/tokens, not this field.
    const candidate = { ...emit, next_recommended: '(composing)' };
    const context = loadChangeContext(projectRoot, resolved.change as string);
    const status = formatChangeStatus(context, { name: filename, json: candidate });
    let next = status.next_command ?? '';
    if (command === 'apply') {
      const complete = (emit as any).chunk_complete === true;
      const isFinal =
        (emit as any).chunk === null ||
        ((): boolean => {
          const m = String((emit as any).chunk).match(/^(\d+) of (\d+)$/);
          return m ? m[1] === m[2] : true;
        })();
      if (!complete || !isFinal) {
        next = `/orbit:apply ${resolved.change}`;
        if (complete && !isFinal) {
          const m = String((emit as any).chunk).match(/^(\d+) of /);
          const nextName = m ? nextChunkName(resolved.changeDir as string, Number(m[1])) : null;
          if (nextName) next = `${next} — next chunk: ${nextName}`;
        }
      }
      // On apply-complete the synthetic-trail next_command stands as-is.
    }
    if (!next) {
      throw new EmitError('internal: post-write composition produced no next_command.');
    }
    emit.next_recommended = next;
  }

  // MATERIALIZE first: this stringify is the LAST point caller-supplied code
  // (property getters, nested toJSON hooks) can run; the parse yields an INERT
  // plain-data record. The write gate then validates the frozen data, the bytes
  // are serialized from that same frozen data (hook-free by construction — the
  // gate-validated candidate and the written bytes are ONE read), and the
  // canonical trail check re-runs immediately before the write. External iter-4
  // closed the directory half of this check/use seam; the fresh pass closed the
  // content half the same way, one call earlier.
  const materialized = JSON.parse(JSON.stringify(emit)) as Record<string, unknown>;
  // Full write gate on the now-complete FROZEN record, then EXACTLY ONE atomic
  // write. The dot-tmp never parses as an emit-shaped name, so no trail reader
  // ever sees a provisional record; the unlink covers every failure the process
  // survives (a hard kill can still strand the inert dot-tmp — noise, never a record).
  writeGate(materialized, resolved, filePath);
  const serialized = JSON.stringify(materialized, null, 2) + '\n';
  assertCanonicalTrailDir(resolved.runsDir);
  const tmp = path.join(resolved.runsDir, `.${filename}.tmp`);
  try {
    fs.writeFileSync(tmp, serialized, 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch (err) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // best-effort cleanup; the original failure is the story
    }
    throw err;
  }

  // The returned record IS the written one — the frozen data the gate validated.
  return { path: filePath, emit: materialized, warnings };
}
