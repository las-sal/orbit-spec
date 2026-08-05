import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadChangeContext,
  formatChangeStatus,
  parseTsToken,
  type ChangeStatus,
} from './artifact-graph/index.js';
import { buildArchitectureBuckets, type ArchitectureBuckets } from './architecture/buckets.js';
import type { StageState } from './architecture/state.js';
import { readChangeMetadata } from '../utils/change-metadata.js';
import { countConfidentExternalPasses } from './report-render.js';

/**
 * Orientation module (D-arc Stage D3). Pure composition layer behind
 * `orbit status` (bare = current sprint) and `orbit status --full` (arc view).
 *
 * READ-ONLY by contract: data sources are limited to the change-status
 * computation, architecture stage-state computation, workstream directory
 * presence, metadata citations, and `.orbit-runs/` emit files — never
 * artifact-content parsing, and never a file write (per orbit-orientation's
 * no-live-inference scenario).
 */

// -----------------------------------------------------------------------------
// Types (the shared discriminated workstream-entry shape)
// -----------------------------------------------------------------------------

export interface OrientationChip {
  phase: string;
  /** '✓' | '▶' | '' (pending/unmarked) — the closed glyph mapping. */
  glyph: string;
  /** Review iteration count (`⟲6`) or tracked progress (`12/20`). */
  detail?: string;
}

export interface EmitRecord {
  token: string;
  file: string;
  command: string;
  timestamp: string;
  final_assessment: string;
  next_recommended: string;
  mode?: string;
}

export interface StageCitation {
  doc: string;
  stage: string;
}

/**
 * The shared discriminated workstream-entry shape (orbit-orientation's
 * JSON-output requirement). Healthy: {name, kind, stage?, strip, position,
 * last, next, status?}. Degraded: {name, kind, degraded: true, error} plus
 * any fields that remain trustworthy. Absent fields are omitted, never null.
 */
export interface WorkstreamEntry {
  name: string;
  kind: 'change' | 'explore';
  stage?: StageCitation;
  strip?: OrientationChip[];
  position?: string;
  last?: EmitRecord;
  next?: string;
  /** CHANGE entries only: the per-change status payload, nested unmodified. */
  status?: ChangeStatus;
  /**
   * D5 fail-loud surfacing: emit-shaped files (token + .json) excluded from arithmetic
   * as unreadable/JSON-invalid/spine-invalid. Absent when none — detection without
   * failure; the emit surface's atomic single-write cannot produce one.
   */
  skipped_emits?: string[];
  degraded?: true;
  error?: string;
}

export interface GlobalLast {
  workstream: string;
  emit: EmitRecord;
}

export interface Orientation {
  /** All live workstream entries, sprint first (sorted by emit recency). */
  workstreams: WorkstreamEntry[];
  /** The current sprint (continuity predicate), or null when nothing is live. */
  sprint: WorkstreamEntry | null;
  /** Globally most recent emit across ALL trails (incl. archived; LAST-band only). */
  last: GlobalLast | null;
  /** Waiting-on-you items (the closed 3-item set), render-ready strings. */
  waiting: string[];
  /** Architecture program buckets — THE architecture-status shapes, built by the shared builder. */
  program: ArchitectureBuckets;
}

// -----------------------------------------------------------------------------
// Emit reading (fault isolation: skip invalid, never throw on one bad file)
// -----------------------------------------------------------------------------

/**
 * Minimum spine validity for orientation (orbit-orientation's fault-isolation
 * policy): string `command`, `final_assessment`, `next_recommended`; a
 * `review-external` T0 emit additionally needs a string `mode` (the WAITING
 * arithmetic's discriminator). Spine-invalid files are skipped exactly like
 * unreadable/JSON-invalid ones and never count in WAITING arithmetic.
 */
export function isSpineValid(json: unknown): json is {
  command: string;
  final_assessment: string;
  next_recommended: string;
  mode?: string;
} {
  if (typeof json !== 'object' || json === null) return false;
  const j = json as Record<string, unknown>;
  if (typeof j.command !== 'string') return false;
  if (typeof j.final_assessment !== 'string') return false;
  if (typeof j.next_recommended !== 'string') return false;
  if (j.command === 'review-external' && typeof j.mode !== 'string') return false;
  return true;
}

/** Reads a trail directory's valid emits, ascending by token (then filename). */
export function readValidEmits(runsDir: string): EmitRecord[] {
  if (!fs.existsSync(runsDir)) return [];
  let entries: string[];
  try {
    entries = fs.readdirSync(runsDir);
  } catch {
    return [];
  }
  const emits: EmitRecord[] = [];
  for (const name of entries) {
    if (!name.endsWith('.json')) continue;
    const token = parseTsToken(name);
    if (!token) continue;
    const full = path.join(runsDir, name);
    let json: unknown;
    try {
      json = JSON.parse(fs.readFileSync(full, 'utf-8'));
    } catch {
      continue; // unreadable / invalid JSON → skipped
    }
    if (!isSpineValid(json)) continue; // spine-invalid → skipped the same way
    const j = json as Record<string, unknown>;
    emits.push({
      token,
      file: full,
      command: j.command as string,
      timestamp: typeof j.timestamp === 'string' ? (j.timestamp as string) : token,
      final_assessment: j.final_assessment as string,
      next_recommended: j.next_recommended as string,
      ...(typeof j.mode === 'string' ? { mode: j.mode as string } : {}),
    });
  }
  // Ascending recency: token first; on equal tokens the lexicographically-
  // EARLIER filename is MORE recent (the shared tie-break direction of
  // compareRecency), so it sorts LAST and `.at(-1)` selects it — one direction
  // for per-trail newest, sprint anchoring, and global LAST alike.
  emits.sort((a, b) =>
    a.token < b.token ? -1 : a.token > b.token ? 1 : a.file < b.file ? 1 : a.file > b.file ? -1 : 0
  );
  return emits;
}

/**
 * Emit-shaped files (token + .json) the fault-isolation policy excluded — unreadable,
 * JSON-invalid, or spine-invalid. Surfaced, never silent (D-arc Stage D5): renders carry
 * a one-line degraded note per file and both JSON tiers carry `skipped_emits`.
 */
export function listSkippedEmits(runsDir: string): string[] {
  if (!fs.existsSync(runsDir)) return [];
  let entries: string[];
  try {
    entries = fs.readdirSync(runsDir);
  } catch {
    return [];
  }
  const skipped: string[] = [];
  for (const name of entries) {
    if (!name.endsWith('.json')) continue;
    if (!parseTsToken(name)) continue;
    const full = path.join(runsDir, name);
    let json: unknown;
    try {
      json = JSON.parse(fs.readFileSync(full, 'utf-8'));
    } catch {
      skipped.push(name);
      continue;
    }
    if (!isSpineValid(json)) skipped.push(name);
  }
  return skipped.sort();
}

// -----------------------------------------------------------------------------
// Live workstream enumeration (directory presence only)
// -----------------------------------------------------------------------------

interface LiveWorkstream {
  name: string;
  kind: 'change' | 'explore';
  dir: string;
  runsDir: string;
}

function listDirs(parent: string, exclude: Set<string>): string[] {
  if (!fs.existsSync(parent)) return [];
  try {
    return fs
      .readdirSync(parent, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !exclude.has(d.name) && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

/** Active changes (minus archive) + staging explores. Archived/architecture/project trails are never live. */
export function listLiveWorkstreams(projectRoot: string): LiveWorkstream[] {
  const changes = listDirs(path.join(projectRoot, 'orbit', 'changes'), new Set(['archive']));
  const explores = listDirs(path.join(projectRoot, 'orbit', 'explore'), new Set());
  return [
    ...changes.map((name) => {
      const dir = path.join(projectRoot, 'orbit', 'changes', name);
      return { name, kind: 'change' as const, dir, runsDir: path.join(dir, '.orbit-runs') };
    }),
    ...explores.map((name) => {
      const dir = path.join(projectRoot, 'orbit', 'explore', name);
      return { name, kind: 'explore' as const, dir, runsDir: path.join(dir, '.orbit-runs') };
    }),
  ];
}

// -----------------------------------------------------------------------------
// Recency + the continuity predicate
// -----------------------------------------------------------------------------

/**
 * Deterministic recency comparison (orbit-orientation's continuity predicate):
 * `<TS>` token first; equal tokens (second-granular) break by lexicographic
 * workstream name, then lexicographic emit filename. The SAME tie-break applies
 * wherever emit recency is compared — sprint anchoring and the global LAST band.
 * Returns >0 when a is more recent than b.
 */
function compareRecency(
  a: { token: string; workstream: string; file: string },
  b: { token: string; workstream: string; file: string }
): number {
  if (a.token !== b.token) return a.token > b.token ? 1 : -1;
  // Equal tokens: the lexicographically-EARLIER workstream name wins (anchors).
  if (a.workstream !== b.workstream) return a.workstream < b.workstream ? 1 : -1;
  return a.file < b.file ? 1 : a.file > b.file ? -1 : 0;
}

// -----------------------------------------------------------------------------
// Strip composition (gate graph + trail counts + explore.md presence only)
// -----------------------------------------------------------------------------

const EXPLORE_EARLY_CANONICAL = (name: string): string =>
  `/orbit:explore ${name} — continue capturing thinking`;

function reviewChip(phase: string, iterations: number, gateState: string | undefined): OrientationChip {
  const chip: OrientationChip = { phase, glyph: '' };
  if (iterations > 0) chip.detail = `⟲${iterations}`;
  // SUPERSEDED (past) renders ✓-equivalent by design; stale/unpassed stay
  // unmarked in the strip (the WAITING band carries the gate's reason).
  if (gateState === 'passed' || gateState === 'superseded') chip.glyph = '✓';
  return chip;
}

function composeChangeStrip(
  status: ChangeStatus,
  changeDir: string,
  emits: EmitRecord[]
): OrientationChip[] {
  // ⟲N counts same-mode passes on the SHARED PASS AXIS (D4 — the report
  // ordinal's axis; one iteration semantics across surfaces): SPINE-VALID
  // internal `review-<mode>-*.json` emits (the fault-isolation skip applies
  // uniformly: a skipped emit moves neither `last` nor the chip count) PLUS
  // confident `external-<mode>-*.md` findings files (the report capability's
  // lenient confidence gate; unreadable/unconfident files contribute nothing).
  const proposalIters =
    emits.filter((e) => e.command === 'review' && e.mode === 'proposal').length +
    countConfidentExternalPasses(changeDir, 'proposal');
  const systemIters =
    emits.filter((e) => e.command === 'review' && e.mode === 'system').length +
    countConfidentExternalPasses(changeDir, 'system');

  const gate = (id: string) => status.gates?.find((g) => g.id === id);
  const gateState = (id: string): string | undefined => {
    const g = gate(id) as { state?: string; superseded?: boolean } | undefined;
    if (!g) return undefined;
    return g.superseded ? 'superseded' : g.state;
  };

  const chips: OrientationChip[] = [];

  // explore chip: '✓' when the change consumed an exploration (explore.md
  // present — a directory-presence fact, not artifact parsing); absent when not.
  if (fs.existsSync(path.join(changeDir, 'explore.md'))) {
    chips.push({ phase: 'explore', glyph: '✓' });
  }

  chips.push({ phase: 'propose', glyph: status.isComplete ? '✓' : '▶' });
  chips.push(reviewChip('review', proposalIters, gateState('review-proposal')));

  const applyGate = gate('apply') as
    | { state?: string; checked?: number; total?: number; superseded?: boolean }
    | undefined;
  const applyChip: OrientationChip = { phase: 'apply', glyph: '' };
  if (applyGate && typeof applyGate.total === 'number' && applyGate.total > 0) {
    const checked = applyGate.checked ?? 0;
    applyChip.detail = `${checked}/${applyGate.total}`;
    if (applyGate.superseded || applyGate.state === 'passed') applyChip.glyph = '✓';
    // A READY tracked gate is the current phase even at 0 checked tasks (the
    // engine's position says `apply ready`; `apply ▶ 0/N` is the entry form).
    else if (applyGate.state === 'ready' || checked > 0) applyChip.glyph = '▶';
  } else if (applyGate?.superseded || applyGate?.state === 'passed') {
    applyChip.glyph = '✓';
  }
  chips.push(applyChip);

  chips.push(reviewChip('review', systemIters, gateState('review-system')));
  chips.push({ phase: 'archive', glyph: gateState('archive') === 'passed' ? '✓' : '' });
  return chips;
}

function composeExploreStrip(): OrientationChip[] {
  return [
    { phase: 'explore', glyph: '▶' },
    { phase: 'propose', glyph: '' },
    { phase: 'review', glyph: '' },
    { phase: 'apply', glyph: '' },
    { phase: 'review', glyph: '' },
    { phase: 'archive', glyph: '' },
  ];
}

// -----------------------------------------------------------------------------
// Per-workstream entry composition (fault-isolated)
// -----------------------------------------------------------------------------

/**
 * Composes one workstream's entry. Fault isolation (clause b): a failure in
 * status computation or metadata load yields a DEGRADED entry — {name, kind,
 * degraded, error} plus whatever fields remain trustworthy (a readable trail
 * still yields `last`) — never a throw that aborts the fleet.
 */
export function composeWorkstreamEntry(
  projectRoot: string,
  ws: LiveWorkstream
): WorkstreamEntry {
  const emits = readValidEmits(ws.runsDir);
  const newest = emits.length > 0 ? emits[emits.length - 1] : undefined;
  const skippedEmits = listSkippedEmits(ws.runsDir);
  const skipped = skippedEmits.length > 0 ? { skipped_emits: skippedEmits } : {};

  try {
    // ONE validated metadata read, INSIDE the fault boundary and WITH
    // projectRoot (project-local schemas resolve; invalid metadata throws and
    // degrades the entry — the normative clause-(b) trigger, never swallowed).
    // Absent metadata (pre-D2 staging dirs) is null, not a failure.
    const meta = readChangeMetadata(ws.dir, projectRoot) as unknown as {
      architecture?: { doc?: unknown; stage?: unknown };
    } | null;
    const arch = meta?.architecture;
    const stage: StageCitation | undefined =
      arch && typeof arch.doc === 'string' && typeof arch.stage === 'string'
        ? { doc: arch.doc, stage: arch.stage }
        : undefined;
    if (ws.kind === 'change') {
      const context = loadChangeContext(projectRoot, ws.name);
      const status = formatChangeStatus(context);
      const entry: WorkstreamEntry = {
        name: ws.name,
        kind: 'change',
        ...(stage ? { stage } : {}),
        strip: composeChangeStrip(status, ws.dir, emits),
        // Change position/next are ENGINE-computed (current, engine-vetted) —
        // emit-independent, per the recommendation-sourcing requirement.
        ...(status.position ? { position: status.position } : {}),
        ...(newest ? { last: newest } : {}),
        ...(status.next_command ? { next: status.next_command } : {}),
        status,
        ...skipped,
      };
      return entry;
    }
    // Explore workstream: no gate graph, no per-change payload; position is the
    // stage-state vocabulary literal; next is the recorded trail recommendation
    // (time-shifted, never live judgment) with the Early-canonical emit-less fallback.
    const entry: WorkstreamEntry = {
      name: ws.name,
      kind: 'explore',
      ...(stage ? { stage } : {}),
      strip: composeExploreStrip(),
      position: 'exploring',
      ...(newest ? { last: newest } : {}),
      next: newest ? newest.next_recommended : EXPLORE_EARLY_CANONICAL(ws.name),
      ...skipped,
    };
    return entry;
  } catch (err) {
    const entry: WorkstreamEntry = {
      name: ws.name,
      kind: ws.kind,
      degraded: true,
      error: err instanceof Error ? err.message : String(err),
      ...(newest ? { last: newest } : {}),
      ...skipped,
      // An explore's `next` source (the trail's recorded next_recommended, or
      // the Early canonical constant) never depends on the failed computation —
      // it survives degradation exactly like `last` (clause b: trustworthy
      // fields are kept; `next` is omitted only when ITS source failed — which
      // is the case for changes, whose next is the failed engine computation).
      ...(ws.kind === 'explore'
        ? { next: newest ? newest.next_recommended : EXPLORE_EARLY_CANONICAL(ws.name) }
        : {}),
    };
    return entry;
  }
}

// -----------------------------------------------------------------------------
// WAITING derivation (the CLOSED 3-item set)
// -----------------------------------------------------------------------------

function deriveWaiting(
  stageStates: Array<{ doc: string; stages: StageState[] }>,
  liveEntries: Array<{ ws: LiveWorkstream; entry: WorkstreamEntry }>
): string[] {
  const waiting: string[] = [];

  // (a) quiescent-awaiting-ratification stages.
  for (const { stages } of stageStates) {
    for (const s of stages) {
      if (s.rendered === 'quiescent-awaiting-ratification') {
        waiting.push(`${s.id} completion — yours to ratify`);
      }
    }
  }

  // (b) outstanding packaged externals — COUNT-BASED per change+mode:
  // #T0 emits − #returned findings files (spine-invalid emits are already
  // excluded by readValidEmits; a negative balance renders nothing).
  for (const { ws } of liveEntries) {
    if (ws.kind !== 'change') continue;
    const emits = readValidEmits(ws.runsDir);
    const t0ByMode = new Map<string, number>();
    for (const e of emits) {
      if (e.command === 'review-external' && e.mode) {
        t0ByMode.set(e.mode, (t0ByMode.get(e.mode) ?? 0) + 1);
      }
    }
    for (const [mode, packaged] of t0ByMode) {
      let returned = 0;
      try {
        returned = fs
          .readdirSync(ws.runsDir)
          .filter((n) => new RegExp(`^external-${mode}-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z\\.md$`).test(n)).length;
      } catch {
        returned = 0;
      }
      const outstanding = packaged - returned;
      if (outstanding > 0) {
        // The spec's quoted literals, verbatim — singular `1 external review
        // packaged`, plural `N external review(s) packaged`; the mode
        // disambiguates OUTSIDE the phrase.
        const noun = packaged === 1 ? 'review' : 'review(s)';
        waiting.push(
          `${ws.name}: ${packaged} external ${noun} packaged, ${returned} returned (${mode})`
        );
      }
    }
  }

  // (c) unpassed/stale gates on live changes, with the engine's reason.
  for (const { entry } of liveEntries) {
    if (entry.kind !== 'change' || entry.degraded || !entry.status) continue;
    for (const g of entry.status.gates ?? []) {
      const row = g as { id: string; state?: string; superseded?: boolean; reason?: string };
      if (row.superseded) continue;
      if (row.state === 'unpassed' || row.state === 'stale') {
        waiting.push(
          `${entry.name}: gate ${row.id} ${row.state}${row.reason ? ` — ${row.reason}` : ''}`
        );
      }
    }
  }

  return waiting;
}

// -----------------------------------------------------------------------------
// Global LAST (all trails, incl. archived changes' relocated trails)
// -----------------------------------------------------------------------------

function collectGlobalLast(projectRoot: string, live: LiveWorkstream[]): GlobalLast | null {
  const candidates: Array<{ workstream: string; emit: EmitRecord }> = [];

  const consider = (workstream: string, runsDir: string) => {
    const emits = readValidEmits(runsDir);
    if (emits.length > 0) candidates.push({ workstream, emit: emits[emits.length - 1] });
  };

  for (const ws of live) consider(ws.name, ws.runsDir);
  // Architecture + project-wide trails (never live workstreams; LAST only).
  consider('architecture', path.join(projectRoot, 'orbit', 'architecture', '.orbit-runs'));
  consider('project', path.join(projectRoot, 'orbit', '.orbit-runs'));
  // Archived changes' relocated trails: global-LAST sourcing ONLY — never live
  // enumeration, never sprint anchoring (orbit-orientation's --full requirement).
  const archiveRoot = path.join(projectRoot, 'orbit', 'changes', 'archive');
  for (const name of listDirs(archiveRoot, new Set())) {
    consider(`archive/${name}`, path.join(archiveRoot, name, '.orbit-runs'));
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) =>
    compareRecency(
      { token: a.emit.token, workstream: a.workstream, file: a.emit.file },
      { token: b.emit.token, workstream: b.workstream, file: b.emit.file }
    )
  );
  return candidates[candidates.length - 1] ?? null;
}

// -----------------------------------------------------------------------------
// collectOrientation — the single entry point
// -----------------------------------------------------------------------------

export function collectOrientation(projectRoot: string): Orientation {
  const live = listLiveWorkstreams(projectRoot);

  const liveEntries = live.map((ws) => ({ ws, entry: composeWorkstreamEntry(projectRoot, ws) }));

  // Workstream identity is kind+name — a live change and a staging explore MAY
  // share a name (nothing blocks creating the change dir while the explore
  // still stages), and name-only comparison would collapse the two.
  const keyOf = (w: { kind: string; name: string }): string => `${w.kind}:${w.name}`;

  // Sprint anchoring: most recent valid emit among LIVE workstreams; the
  // emit-less fallback anchors by metadata `created` (date-granular), ties by name.
  let sprintKey: string | null = null;
  const withEmits = liveEntries
    .map(({ ws, entry }) => {
      const emits = readValidEmits(ws.runsDir);
      return emits.length > 0
        ? { key: keyOf(ws), name: ws.name, token: emits[emits.length - 1].token, file: emits[emits.length - 1].file, entry }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (withEmits.length > 0) {
    withEmits.sort((a, b) =>
      compareRecency(
        { token: a.token, workstream: a.name, file: a.file },
        { token: b.token, workstream: b.name, file: b.file }
      )
    );
    sprintKey = withEmits[withEmits.length - 1].key;
  } else if (liveEntries.length > 0) {
    // No live workstream has any emit: most recently `created` wins, name tiebreak.
    const dated = liveEntries.map(({ ws, entry }) => {
      let created = '';
      try {
        // projectRoot resolves project-local schemas so their valid metadata
        // keeps its `created` date; a genuinely-invalid read anchors last by
        // name (the entry itself is already degraded via composeWorkstreamEntry).
        const meta = readChangeMetadata(ws.dir, projectRoot) as unknown as { created?: unknown } | null;
        if (meta && typeof meta.created === 'string') created = meta.created;
      } catch {
        created = '';
      }
      return { key: keyOf(ws), name: ws.name, created, entry };
    });
    // Total, antisymmetric ordering: created, then name, then the kind:name key
    // (an emit-less change/explore TWIN with the same created date must sort
    // deterministically — 'change:x' < 'explore:x', so the change anchors).
    dated.sort((a, b) => {
      if (a.created !== b.created) return a.created < b.created ? -1 : 1;
      if (a.name !== b.name) return a.name < b.name ? 1 : -1;
      return a.key < b.key ? 1 : a.key > b.key ? -1 : 0;
    });
    sprintKey = dated[dated.length - 1].key;
  }

  const sprint = liveEntries.find(({ ws }) => keyOf(ws) === sprintKey)?.entry ?? null;

  // Program layer — THE architecture-status buckets, built by the shared builder.
  const program = buildArchitectureBuckets(projectRoot);

  // Clause (a)'s predicate has no doc-class qualifier: well-formed sibling
  // stages inside MALFORMED docs render in the listing, so their
  // quiescent-awaiting-ratification state reaches WAITING too.
  const waiting = deriveWaiting([...program.parseable, ...program.malformed], liveEntries);
  const last = collectGlobalLast(projectRoot, live);

  // Workstreams sorted sprint-first, then by own-emit recency (desc), then name.
  const order = new Map(withEmits.map((w, i) => [w.key, i]));
  const workstreams = liveEntries
    .map(({ entry }) => entry)
    .sort((a, b) => {
      if (keyOf(a) === sprintKey) return -1;
      if (keyOf(b) === sprintKey) return 1;
      const ai = order.get(keyOf(a)) ?? -1;
      const bi = order.get(keyOf(b)) ?? -1;
      if (ai !== bi) return bi - ai;
      if (a.name !== b.name) return a.name < b.name ? -1 : 1;
      // Total ordering for twins: the kind:name key is the final tie-break.
      return keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0;
    });

  return { workstreams, sprint, last, waiting, program };
}
