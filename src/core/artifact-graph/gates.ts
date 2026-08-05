import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SchemaYaml, NormalizedGate, GateKind, CadenceEntry, ConsentValue } from './types.js';
import { normalizeGates } from './schema.js';
import { readTrail, type Trail, type TrailOverlay, type TrailPass, type ReviewMode, type ReviewerClass } from './trail.js';

/**
 * Gate-state computation (C1 engine gates). PURE: reads the change dir + `.orbit-runs/`
 * trail, writes nothing. Implements orbit-engine-gates' reviewed/tracked pass conditions,
 * the v1 freshness rule, and single-voiced canonical-next computation.
 */

export type GateState = 'blocked' | 'ready' | 'passed' | 'stale' | 'unpassed';

export interface GateStatus {
  id: string;
  kind: GateKind;
  state: GateState;
  reason?: string;
  /** Full canonical next command (single-voiced) when the gate is not passed. */
  nextCommand?: string;
  /** D5 hint garnish: the cadence slot the nextCommand covers, when it covers one. */
  nextSlot?: CadenceEntry;
  /** tracked kind: checkbox arithmetic surfaced as N/M. */
  checked?: number;
  total?: number;
  before?: string;
  /**
   * D1: consent marker from the gate declaration — entry into the gate's `before:`
   * phase requires an explicit user invocation. Surfaced only; the engine never
   * prompts, and consent alters no gate-state computation.
   */
  consent?: ConsentValue;
  /**
   * C1: true when this reviewed gate's `before` phase is already complete — the gate
   * gated ENTRY to a phase that has since run, so it is no longer the active frontier
   * (post-apply, `review-proposal` is moot). Superseded gates are skipped by
   * canonical-next and rendered as "(past)" in the position readout. NOT the same as
   * `passed`: the gate may never have converged; the flow simply advanced past it.
   */
  superseded?: boolean;
}

export interface GateComputation {
  gates: GateStatus[];
  /** One-line position readout of the canonical flow. */
  position: string;
}

/** v1 freshness: a pass is stale iff an `apply-*.json` token is lexically later than its token. */
export function isPassStale(pass: TrailPass, applyTokens: string[]): boolean {
  return applyTokens.some(t => t > pass.token);
}

/** Derive the review mode a gate operates over from its id (`review-proposal` → proposal). */
function gateMode(gate: NormalizedGate): ReviewMode | null {
  const m = gate.id.match(/^review-(proposal|system)$/);
  if (m) return m[1] as ReviewMode;
  if (gate.id.includes('proposal')) return 'proposal';
  if (gate.id.includes('system')) return 'system';
  return null;
}

/** A cadence slot is satisfied by a pass of its class (independent = fresh|external). */
function passSatisfiesSlot(slot: CadenceEntry, cls: ReviewerClass): boolean {
  if (slot === 'independent') return cls === 'fresh' || cls === 'external';
  return slot === cls;
}

function isIndependent(cls: ReviewerClass): boolean {
  return cls === 'fresh' || cls === 'external';
}

/** The canonical command that covers a given cadence slot / class. */
function commandForClass(slot: CadenceEntry, mode: ReviewMode, change: string): string {
  // `independent` renders the fresh-context review (proposal-phase default), never
  // co-offered with external, per orbit-engine-gates single-voiced canonical-next.
  if (slot === 'independent' || slot === 'fresh') return `/orbit:review --as ${mode} --fresh ${change}`;
  if (slot === 'external') return `/orbit:review --as ${mode} --reviewer external ${change}`;
  return `/orbit:review --as ${mode} ${change}`; // in-context
}

/**
 * Lifecycle command for a gate's `before` target when the gate passes. When the
 * gate is consent-marked, the rendered command carries the ` — user-invoked` marker
 * (D1 eligibility phrasing): entry into the phase is the user's call.
 */
function nextAfterPass(gate: NormalizedGate, change: string): string | undefined {
  let cmd: string | undefined;
  if (gate.before === 'apply') cmd = `/orbit:apply ${change}`;
  if (gate.before === 'archive') cmd = `/orbit:archive ${change}`;
  if (cmd && gate.consent === 'user-invoked') cmd += ' — user-invoked';
  return cmd;
}

/** Count `- [ ]` vs `- [x]` checkboxes in a tracks file. */
function countCheckboxes(changeDir: string, tracks: string): { checked: number; total: number } {
  const p = path.join(changeDir, tracks);
  let content: string;
  try {
    content = fs.readFileSync(p, 'utf-8');
  } catch {
    return { checked: 0, total: 0 };
  }
  const checked = (content.match(/^\s*- \[x\]/gim) ?? []).length;
  const unchecked = (content.match(/^\s*- \[ \]/gim) ?? []).length;
  return { checked, total: checked + unchecked };
}

/** Does an address-reviews run fully resolve the given pass's findings artifact? */
function passResolved(pass: TrailPass, trail: Trail): boolean {
  // A findings-free pass needs no resolution run.
  if (pass.critical + pass.warning + pass.suggestion === 0) return true;
  const passFile = path.basename(pass.file);
  // Most recent address-reviews whose source_path references this pass's artifact.
  const matching = trail.resolutions
    .filter(r => r.sourcePath && path.basename(r.sourcePath) === passFile)
    .sort((a, b) => (a.token < b.token ? -1 : 1));
  const latest = matching[matching.length - 1];
  return !!latest && latest.deferred === 0 && latest.escalated === 0;
}

/** A finding is "new" if its (title, file) matches no finding in the same-gate prior passes. */
function hasNewFindings(pass: TrailPass, priorPasses: TrailPass[]): boolean {
  const prior = new Set<string>();
  for (const p of priorPasses) {
    for (const f of p.findings) prior.add(JSON.stringify([f.title, f.file]));
  }
  return pass.findings.some(f => !prior.has(JSON.stringify([f.title, f.file])));
}

interface ConvergenceResult {
  converged: boolean;
  reason?: string;
  /** Cadence slot / class still needed, when the failing clause is coverage. */
  neededSlot?: CadenceEntry;
  /** Pass whose findings are unresolved, when the failing clause is resolution. */
  unresolvedPass?: TrailPass;
  /** True when the failing clause is the confirm predicate. */
  confirmFailed?: boolean;
  /** For findings-resolved confirm failure on a CRITICAL, repeat external. */
  confirmNeedsExternal?: boolean;
}

/**
 * Evaluates the reviewed-gate pass condition over an ordered pass list:
 *  (a) ordered-slot class coverage, (b) resolution over every pass, (c) confirm predicate.
 */
function evaluateReviewed(
  gate: NormalizedGate,
  coveragePasses: TrailPass[],
  resolutionPasses: TrailPass[],
  trail: Trail
): ConvergenceResult {
  // (b) resolution over EVERY relevant same-gate pass — INCLUDING stale ones. Freshness
  // gates only cadence COVERAGE (clause a) + stale reporting, NOT resolution: an unresolved
  // finding from a pass that later went stale (an apply landed after it) still blocks the
  // gate (per orbit-engine-gates clause (b): "every pass's findings are resolved").
  const resOrdered = [...resolutionPasses].sort((a, b) => (a.token < b.token ? -1 : 1));
  for (const p of resOrdered) {
    if (!passResolved(p, trail)) {
      return { converged: false, reason: `pass ${p.token} has unresolved findings`, unresolvedPass: p };
    }
  }

  const ordered = [...coveragePasses].sort((a, b) => (a.token < b.token ? -1 : 1));

  // (a) ordered-slot coverage: each slot satisfied by a pass strictly later than the prior slot's.
  let prevIdx = -1;
  for (const slot of gate.cadence) {
    let found = -1;
    for (let i = prevIdx + 1; i < ordered.length; i++) {
      if (passSatisfiesSlot(slot, ordered[i].reviewerClass)) {
        found = i;
        break;
      }
    }
    if (found === -1) {
      return {
        converged: false,
        reason: `cadence class '${slot}' has no fresh pass`,
        neededSlot: slot,
      };
    }
    prevIdx = found;
  }

  // (c) confirm predicate over the most recent independent pass.
  const independents = ordered.filter(p => isIndependent(p.reviewerClass));
  const latestIndep = independents[independents.length - 1];
  if (!latestIndep) {
    return { converged: false, reason: `no independent pass for the confirm predicate`, neededSlot: 'independent' };
  }
  if (gate.confirm === 'no-new-findings') {
    if (latestIndep.critical > 0) {
      return { converged: false, reason: `latest independent pass has ${latestIndep.critical} CRITICAL`, confirmFailed: true };
    }
    // "New" = not seen in ANY prior same-gate pass (per orbit-engine-gates: a new
    // finding is matched against same-gate prior passes — including in-context, not
    // only prior independents), by trimmed title + repo-relative path.
    const priorPasses = ordered.slice(0, ordered.indexOf(latestIndep));
    if (hasNewFindings(latestIndep, priorPasses)) {
      return { converged: false, reason: `latest independent pass yielded new findings`, confirmFailed: true };
    }
  } else {
    // findings-resolved: 0 CRITICAL AND that pass's findings resolved (already checked in (b)).
    if (latestIndep.critical > 0) {
      return {
        converged: false,
        reason: `latest independent pass carried ${latestIndep.critical} CRITICAL; cadence repeats external until none`,
        confirmFailed: true,
        confirmNeedsExternal: true,
      };
    }
  }

  return { converged: true };
}

/**
 * Orders gate statuses by the gate graph's flow edges (topological), so position
 * readout + canonical-next follow `requires`/`before` rather than declaration order.
 * A gate comes after any gate it `requires`, and before its `before` gate; ties broken
 * by declaration order. (Cycles are rejected at parse; a defensive fallback preserves
 * declaration order if one is somehow reached.)
 */
function flowOrderGates(gates: NormalizedGate[], statuses: GateStatus[]): GateStatus[] {
  const decl = new Map(gates.map((g, i) => [g.id, i]));
  const ids = gates.map(g => g.id);
  const gateIds = new Set(ids);
  const predecessors = new Map<string, Set<string>>(ids.map(id => [id, new Set<string>()]));
  for (const g of gates) {
    for (const req of g.requires) {
      if (gateIds.has(req)) predecessors.get(g.id)!.add(req); // required gate comes first
    }
    if (g.before && gateIds.has(g.before)) predecessors.get(g.before)!.add(g.id); // g before g.before
  }
  const remaining = new Set(ids);
  const order: string[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter(id => [...predecessors.get(id)!].every(p => !remaining.has(p)))
      .sort((a, b) => decl.get(a)! - decl.get(b)!);
    if (ready.length === 0) {
      // defensive (unreachable — cycles rejected at parse): keep declaration order
      order.push(...[...remaining].sort((a, b) => decl.get(a)! - decl.get(b)!));
      break;
    }
    order.push(ready[0]);
    remaining.delete(ready[0]);
  }
  const byId = new Map(statuses.map(s => [s.id, s]));
  return order.map(id => byId.get(id)!).filter(Boolean) as GateStatus[];
}

/**
 * Computes the state of every gate in the schema for a change. Requires the set of
 * completed artifact ids (from file-existence detection) so gate `requires` on
 * artifacts can be evaluated; gate-on-gate requires are resolved recursively.
 */
export function computeGateStates(
  schema: SchemaYaml,
  changeName: string,
  changeDir: string,
  completedArtifacts: Set<string>,
  overlay?: TrailOverlay
): GateComputation {
  const gates = normalizeGates(schema);
  const trail = readTrail(changeDir, overlay);
  const byId = new Map(gates.map(g => [g.id, g]));
  const statusById = new Map<string, GateStatus>();

  const computeOne = (gate: NormalizedGate, stack: Set<string>): GateStatus => {
    const existing = statusById.get(gate.id);
    if (existing) return existing;
    if (stack.has(gate.id)) {
      // Defensive: cycles are rejected at parse; treat as blocked if reached.
      const s: GateStatus = { id: gate.id, kind: gate.kind, state: 'blocked', reason: 'cyclic requires' };
      return s;
    }
    stack.add(gate.id);

    // requires: artifacts must be complete; gates must be passed.
    const unmet: string[] = [];
    for (const req of gate.requires) {
      const depGate = byId.get(req);
      if (depGate) {
        const depStatus = computeOne(depGate, stack);
        if (depStatus.state !== 'passed') unmet.push(req);
      } else if (!completedArtifacts.has(req)) {
        unmet.push(req);
      }
    }

    let status: GateStatus;
    if (unmet.length > 0) {
      status = {
        id: gate.id,
        kind: gate.kind,
        state: 'blocked',
        reason: `blocked by incomplete requires: ${unmet.join(', ')}`,
        before: gate.before,
        consent: gate.consent,
      };
    } else if (gate.kind === 'tracked') {
      const { checked, total } = gate.tracks
        ? countCheckboxes(changeDir, gate.tracks)
        : { checked: 0, total: 0 };
      const passed = total === 0 ? false : checked === total;
      status = {
        id: gate.id,
        kind: gate.kind,
        state: passed ? 'passed' : 'ready',
        reason: total === 0 ? undefined : `${checked}/${total} tasks complete`,
        checked,
        total,
        before: gate.before,
        consent: gate.consent,
        nextCommand: passed ? nextAfterPass(gate, changeName) : undefined,
      };
    } else {
      status = computeReviewedStatus(gate, changeName, trail);
    }

    stack.delete(gate.id);
    statusById.set(gate.id, status);
    return status;
  };

  const results = gates.map(g => computeOne(g, new Set()));

  // C1: mark reviewed gates whose `before` phase is already complete as superseded
  // (moot). `before` names a declared gate (e.g. `apply`) — if that gate is passed,
  // this reviewed gate gated a phase that has run and is no longer the frontier.
  const passedGateIds = new Set(results.filter(s => s.state === 'passed').map(s => s.id));
  for (const s of results) {
    if (s.kind === 'reviewed' && s.state !== 'passed' && s.before && passedGateIds.has(s.before)) {
      s.superseded = true;
    }
  }

  // Order by flow edges (requires/before), not declaration order, so both the position
  // readout AND canonical-next selection (which iterates this list) follow the graph.
  const ordered = flowOrderGates(gates, results);
  return { gates: ordered, position: buildPositionReadout(schema, ordered, completedArtifacts) };
}

function computeReviewedStatus(gate: NormalizedGate, changeName: string, trail: Trail): GateStatus {
  const mode = gateMode(gate);
  const relevant = trail.passes.filter(p => (mode ? p.mode === mode : true));
  const fresh = relevant.filter(p => !isPassStale(p, trail.applyTokens));

  // Coverage (a)/confirm (c) use fresh passes; resolution (b) uses ALL relevant passes.
  const freshEval = evaluateReviewed(gate, fresh, relevant, trail);
  if (freshEval.converged) {
    return {
      id: gate.id,
      kind: gate.kind,
      state: 'passed',
      before: gate.before,
      consent: gate.consent,
      nextCommand: nextAfterPass(gate, changeName),
    };
  }

  // Distinguish stale (a later apply invalidated otherwise-covering passes) from unpassed.
  const allEval = evaluateReviewed(gate, relevant, relevant, trail);
  const stale = allEval.converged && !freshEval.converged;

  const next = canonicalNextForReviewed(gate, mode, changeName, freshEval, trail, fresh);
  return {
    id: gate.id,
    kind: gate.kind,
    state: stale ? 'stale' : 'unpassed',
    reason: stale ? `a review pass is stale (an apply landed after it)` : freshEval.reason,
    nextCommand: next.cmd,
    nextSlot: next.slot,
    before: gate.before,
    consent: gate.consent,
  };
}

/** Single-voiced canonical next command (+ covered slot) for an unpassed/stale reviewed gate. */
function canonicalNextForReviewed(
  gate: NormalizedGate,
  mode: ReviewMode | null,
  change: string,
  ev: ConvergenceResult,
  trail: Trail,
  freshPasses: TrailPass[]
): { cmd: string; slot?: CadenceEntry } {
  const m: ReviewMode = mode ?? 'proposal';
  if (ev.unresolvedPass) {
    const p = ev.unresolvedPass;
    return { cmd: `/orbit:address-reviews ${change} --from-file ${toRepoRelPath(p.file, trail.changeDir)}` };
  }
  if (ev.neededSlot) {
    return { cmd: commandForClass(ev.neededSlot, m, change), slot: ev.neededSlot };
  }
  if (ev.confirmFailed) {
    if (ev.confirmNeedsExternal) {
      return { cmd: `/orbit:review --as ${m} --reviewer external ${change}`, slot: 'external' };
    }
    return { cmd: `/orbit:review --as ${m} --fresh ${change}`, slot: 'fresh' };
  }
  // stale — re-validate against current state via a fresh independent pass.
  return { cmd: commandForClass('independent', m, change), slot: 'independent' };
}

function toRepoRelPath(absFile: string, changeDir: string): string {
  // Best-effort repo-relative rendering: keep from `orbit/` onward if present.
  const norm = absFile.replace(/\\/g, '/');
  const idx = norm.indexOf('/orbit/');
  if (idx >= 0) return norm.slice(idx + 1);
  return path.basename(norm);
}

/**
 * Builds the one-line position readout of the canonical flow, e.g.
 * `propose ✓ → review(proposal) ✓ → apply ✓ → review(system) STALE → archive blocked-by-gate`.
 */
function buildPositionReadout(
  schema: SchemaYaml,
  gateStatuses: GateStatus[],
  completedArtifacts: Set<string>
): string {
  const statusById = new Map(gateStatuses.map(s => [s.id, s]));
  const tokens: string[] = [];

  // Artifacts (propose stage): collapse to a single `propose` token.
  const allArtifactsDone = schema.artifacts.every(a => completedArtifacts.has(a.id));
  tokens.push(`propose ${allArtifactsDone ? '✓' : '…'}`);

  const renderGate = (s: GateStatus): string => {
    const label = s.id === 'apply' ? 'apply' : s.id.startsWith('review-') ? `review(${s.id.slice('review-'.length)})` : s.id;
    // A superseded reviewed gate (its `before` phase already ran) is no longer the
    // frontier — render "(past)" rather than a scary "unpassed"/"STALE".
    if (s.superseded) return `${label} (past)`;
    switch (s.state) {
      case 'passed':
        return `${label} ✓`;
      case 'stale':
        return `${label} STALE`;
      case 'blocked':
        return `${label} blocked-by-gate`;
      case 'ready':
        return `${label} ready`;
      default:
        return `${label} unpassed`;
    }
  };

  // Order gates by requires/before edges; fall back to declaration order.
  for (const s of gateStatuses) {
    tokens.push(renderGate(s));
    // Render a lifecycle phase token after the gate that gates it.
    if (s.before === 'archive') tokens.push(`archive ${s.state === 'passed' ? 'ready' : 'blocked-by-gate'}`);
  }

  return tokens.join(' → ');
}
