import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SchemaYaml, NormalizedGate, GateKind, CadenceEntry, ConsentValue } from './types.js';
import { normalizeGates } from './schema.js';
import {
  readTrail,
  isSubstantive,
  type Trail,
  type TrailOverlay,
  type TrailPass,
  type TrailResolution,
  type ReviewMode,
  type ReviewerClass,
} from './trail.js';

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
  /**
   * D5 user-validation subset rule: set when a tracked gate is passed-for-flow-purposes
   * with ONLY declared user-validation handoff tasks unchecked — the pending task ids,
   * surfaced in the position readout (`apply ✓ (awaiting user validation: 9.6)`).
   */
  userValidationPending?: string[];
  /** rc02: the declared independent-pass ceiling, when the gate declares one. */
  budget?: number;
  /** rc02 REPORTED spend: independent passes on the gate's mode across the whole trail, stale
   *  included, plus rejected external returns attributed to that mode. DISPLAY ONLY. */
  independentSpend?: number;
  /** rc02 EXHAUSTION TRIGGER: the same count restricted to items fresh against the current state. */
  independentSpendFresh?: number;
  /** rc02: set when `independentSpendFresh` has reached `budget` AND the gate has not converged.
   *  Spend is reported BESIDE the state — the five-value state set is unchanged. */
  budgetExhausted?: boolean;
  /** rc02: distinct SUGGESTION-grade entries deferred or escalated; reported, never blocking. */
  deferredSuggestions?: number;
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
  // EXHAUSTIVE over CadenceEntry (rc02): a new token must never fall through to the in-context
  // command, which would recommend a class satisfying no slot.
  switch (slot) {
    // `independent` renders the fresh-context review (proposal-phase default), never
    // co-offered with external, per orbit-engine-gates single-voiced canonical-next.
    case 'independent':
    case 'fresh':
    // A `blind-pair` reaching here has no pairable pass standing; the fresh invocation is the
    // lighter first half. The pairable-partner case is resolved in canonicalNextForReviewed.
    case 'blind-pair':
      return `/orbit:review --as ${mode} --fresh ${change}`;
    case 'external':
      return `/orbit:review --as ${mode} --reviewer external ${change}`;
    case 'in-context':
      return `/orbit:review --as ${mode} ${change}`;
    default: {
      const never: never = slot;
      throw new Error(`unhandled cadence entry: ${String(never)}`);
    }
  }
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

/**
 * Unchecked checkbox lines from a tracks file as `{id, text}` — id is the first
 * whitespace-delimited token after the box (e.g. `9.6`). Used by the D5 user-validation
 * subset rule; recomputed from disk on every render (self-healing, no stored state).
 */
function uncheckedTaskLines(changeDir: string, tracks: string): Array<{ id: string; text: string }> {
  const p = path.join(changeDir, tracks);
  let content: string;
  try {
    content = fs.readFileSync(p, 'utf-8');
  } catch {
    return [];
  }
  const out: Array<{ id: string; text: string }> = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*- \[ \]\s+(\S+)\s*(.*)$/i);
    if (m) out.push({ id: m[1], text: line });
  }
  return out;
}

/** The address-reviews records whose `source_path` references this pass's findings artifact. */
function recordsFor(pass: TrailPass, trail: Trail): TrailResolution[] {
  const passFile = path.basename(pass.file);
  return trail.resolutions
    .filter(r => r.sourcePath && path.basename(r.sourcePath) === passFile)
    .sort((a, b) => (a.token < b.token ? -1 : 1));
}

/**
 * Clause (b). EXISTENCE FIRST (scoped to SUBSTANTIVE findings), then ONE readability predicate
 * with ONE fallback. Every empty case is STATED, never defaulted.
 */
function passResolved(pass: TrailPass, trail: Trail): boolean {
  // A pass with no substantive findings needs no resolution run — including one whose findings are
  // ALL SUGGESTION-grade, since requiring a walk there would be SUGGESTIONs gating by another route.
  if (pass.critical + pass.warning === 0) return true;

  const recs = recordsFor(pass, trail);
  // EXISTENCE FIRST: no referencing record at all is UNRESOLVED, never vacuously resolved.
  if (recs.length === 0) return false;
  const latest = recs[recs.length - 1];

  if (latest.readable) {
    // Per-entry data is PREFERRED over the severity-blind `resolution_summary`.
    return !latest.entries.some(
      e => isSubstantive(e.severity) && (e.disposition === 'deferred' || e.disposition === 'escalated')
    );
  }
  // UNREADABLE: fall back WHOLE to the bare counts. `null` (absent/non-numeric) stays unresolved.
  return latest.deferred === 0 && latest.escalated === 0;
}

/**
 * Distinct SUGGESTION-grade entries deferred or escalated, deduplicated by (trimmed title,
 * repo-relative file) across the latest record of every relevant pass — the same key the
 * new-finding match uses, so one suggestion deferred across two passes counts once.
 */
function deferredSuggestionCount(passes: TrailPass[], trail: Trail): number {
  const seen = new Set<string>();
  for (const p of passes) {
    const recs = recordsFor(p, trail);
    const latest = recs[recs.length - 1];
    if (!latest?.readable) continue;
    for (const e of latest.entries) {
      if (e.severity === 'SUGGESTION' && (e.disposition === 'deferred' || e.disposition === 'escalated')) {
        seen.add(JSON.stringify([e.title, e.file]));
      }
    }
  }
  return seen.size;
}

/** Tokens of every record closing the given passes' findings — clause (a)'s second ordering bound. */
function recordTokensFor(passes: TrailPass[], trail: Trail): string[] {
  const out: string[] = [];
  for (const p of passes) for (const r of recordsFor(p, trail)) out.push(r.token);
  return out;
}

/**
 * A finding is "new" if its (title, file) matches no SUBSTANTIVE finding in the same-gate prior
 * passes. SUGGESTION-grade findings are excluded from the match set entirely (rc02).
 */
function hasNewFindings(pass: TrailPass, priorPasses: TrailPass[]): boolean {
  const prior = new Set<string>();
  for (const p of priorPasses) {
    for (const f of p.findings) {
      if (isSubstantive(f.severity)) prior.add(JSON.stringify([f.title, f.file]));
    }
  }
  return pass.findings.some(
    f => isSubstantive(f.severity) && !prior.has(JSON.stringify([f.title, f.file]))
  );
}

/** One slot's assignment: which passes satisfy it, and the token a later slot must beat. */
interface SlotAssignment {
  slot: CadenceEntry;
  indices: number[];
  token: string;
}

/** Why a `blind-pair` slot could not be satisfied, for the reason line. */
export type PairFailure = 'no-fresh' | 'no-external' | 'blindness-broken' | 'tie' | 'none-standing';

/**
 * Candidate assignments for ONE slot, in the TOTAL order the requirement names (later token, then
 * earlier token, then findings-artifact filename), so a depth-first search returning the FIRST
 * complete assignment returns the lexicographically smallest one.
 */
function slotCandidates(
  slot: CadenceEntry,
  ordered: TrailPass[],
  used: Set<number>,
  lowerBound: string | null,
  trail: Trail
): Array<{ indices: number[]; token: string; sortKey: string }> {
  const eligible = (i: number): boolean =>
    !used.has(i) && (lowerBound === null || ordered[i].token > lowerBound);

  const out: Array<{ indices: number[]; token: string; sortKey: string }> = [];

  if (slot === 'blind-pair') {
    for (let i = 0; i < ordered.length; i++) {
      if (!eligible(i) || ordered[i].reviewerClass !== 'fresh') continue;
      for (let j = 0; j < ordered.length; j++) {
        if (i === j || !eligible(j) || ordered[j].reviewerClass !== 'external') continue;
        const a = ordered[i];
        const b = ordered[j];
        // Token equality fails SAFE: blindness between same-second members is unknowable.
        if (a.token === b.token) continue;
        const lo = a.token < b.token ? a.token : b.token;
        const hi = a.token < b.token ? b.token : a.token;
        // BLINDNESS, endpoints INCLUSIVE, scoped to records referencing either member.
        if (recordTokensFor([a, b], trail).some(t => t >= lo && t <= hi)) continue;
        const hiPass = a.token === hi ? a : b;
        out.push({ indices: [i, j], token: hi, sortKey: [hi, lo, path.basename(hiPass.file)].join('\u0000') });
      }
    }
  } else {
    for (let i = 0; i < ordered.length; i++) {
      if (!eligible(i) || !passSatisfiesSlot(slot, ordered[i].reviewerClass)) continue;
      out.push({
        indices: [i],
        token: ordered[i].token,
        sortKey: [ordered[i].token, path.basename(ordered[i].file)].join('\u0000'),
      });
    }
  }
  out.sort((x, y) => (x.sortKey < y.sortKey ? -1 : 1));
  return out;
}

/**
 * Clause (a). Coverage is EXISTENTIAL: it holds iff there EXISTS an assignment satisfying every
 * constraint. Depth-first WITH BACKTRACKING, because a pair chosen early can raise the lower bound
 * on a following slot (through that pair's resolution records) and foreclose an assignment a later
 * pair leaves open.
 */
function assignCadence(
  cadence: CadenceEntry[],
  ordered: TrailPass[],
  trail: Trail
): { assignment: SlotAssignment[] } | { failedSlot: number } {
  let deepest = 0;
  const search = (
    slotIdx: number,
    used: Set<number>,
    lowerBound: string | null,
    acc: SlotAssignment[]
  ): SlotAssignment[] | null => {
    if (slotIdx >= cadence.length) return acc;
    if (slotIdx > deepest) deepest = slotIdx;
    const slot = cadence[slotIdx];
    for (const cand of slotCandidates(slot, ordered, used, lowerBound, trail)) {
      const passes = cand.indices.map(i => ordered[i]);
      // The NEXT slot must beat this slot's passes AND every record closing their findings — what
      // makes a following slot a CHECK ON THE WALK rather than a pass that merely arrived late.
      const nextBound = [cand.token, ...recordTokensFor(passes, trail)].reduce(
        (m, t) => (t > m ? t : m),
        cand.token
      );
      const nextUsed = new Set(used);
      for (const i of cand.indices) nextUsed.add(i);
      const got = search(slotIdx + 1, nextUsed, nextBound, [
        ...acc,
        { slot, indices: cand.indices, token: cand.token },
      ]);
      if (got) return got;
    }
    return null;
  };
  const found = search(0, new Set(), null, []);
  return found ? { assignment: found } : { failedSlot: deepest };
}

/** Why a blind-pair slot failed, given the passes available to it. */
function diagnosePair(ordered: TrailPass[], trail: Trail): PairFailure {
  const fresh = ordered.filter(p => p.reviewerClass === 'fresh');
  const ext = ordered.filter(p => p.reviewerClass === 'external');
  if (fresh.length === 0 && ext.length === 0) return 'none-standing';
  if (fresh.length === 0) return 'no-fresh';
  if (ext.length === 0) return 'no-external';
  let sawTie = false;
  for (const a of fresh) {
    for (const b of ext) {
      if (a.token === b.token) {
        sawTie = true;
        continue;
      }
      const lo = a.token < b.token ? a.token : b.token;
      const hi = a.token < b.token ? b.token : a.token;
      if (!recordTokensFor([a, b], trail).some(t => t >= lo && t <= hi)) return 'blindness-broken';
    }
  }
  return sawTie ? 'tie' : 'blindness-broken';
}

/** A standing pass is PAIRABLE while no record referencing it carries a later token. */
function isPairable(pass: TrailPass, trail: Trail): boolean {
  return !recordsFor(pass, trail).some(r => r.token > pass.token);
}

interface ConvergenceResult {
  converged: boolean;
  reason?: string;
  /** Cadence slot / class still needed, when the failing clause is coverage. */
  neededSlot?: CadenceEntry;
  /** How the pair failed, when the needed slot is a blind pair. */
  pairFailure?: PairFailure;
  /** Pass whose findings are unresolved, when the failing clause is resolution. */
  unresolvedPass?: TrailPass;
  /** True when the failing clause is the confirm predicate. */
  confirmFailed?: boolean;
  /** For findings-resolved confirm failure on a CRITICAL, repeat external. */
  confirmNeedsExternal?: boolean;
  /** Deferred SUGGESTION count, surfaced even on a converged gate. */
  deferredSuggestions?: number;
}

/**
 * Evaluates the reviewed-gate pass condition.
 *
 * PASS-LIST QUANTIFICATION (stated once, here): clauses (a) and (c) run over the pass list the
 * CALLER supplies — fresh for the primary evaluation, the full list for the stale discrimination —
 * while clause (b) always runs over every relevant pass. No rule below restates a freshness
 * condition; the filter has exactly one home, the call site.
 *
 * EMPTY SETS ARE NEVER VACUOUSLY SATISFYING: every rule states its empty case.
 */
function evaluateReviewed(
  gate: NormalizedGate,
  coveragePasses: TrailPass[],
  resolutionPasses: TrailPass[],
  trail: Trail
): ConvergenceResult {
  // (b) resolution over EVERY relevant same-gate pass — INCLUDING stale ones.
  const resOrdered = [...resolutionPasses].sort((a, b) => (a.token < b.token ? -1 : 1));
  for (const p of resOrdered) {
    if (!passResolved(p, trail)) {
      return {
        converged: false,
        reason: `pass ${p.token} has unresolved substantive findings`,
        unresolvedPass: p,
      };
    }
  }
  const deferredSuggestions = deferredSuggestionCount(resOrdered, trail);

  const ordered = [...coveragePasses].sort((a, b) => (a.token < b.token ? -1 : 1));

  // (a) ordered-slot coverage, existential with backtracking.
  const cover = assignCadence(gate.cadence, ordered, trail);
  if ('failedSlot' in cover) {
    const slot = gate.cadence[cover.failedSlot];
    if (slot === 'blind-pair') {
      const how = diagnosePair(ordered, trail);
      const reason =
        how === 'blindness-broken'
          ? `blind pair broken: a walk of one member's findings stands between them`
          : how === 'tie'
            ? `blind pair ambiguous: two candidate members share a timestamp token`
            : how === 'none-standing'
              ? `blind pair open: no independent pass stands on this state — both members must run before EITHER is walked`
              : how === 'no-fresh'
                ? `blind pair open: the external pass on this state has no fresh partner; run it before walking these findings`
                : `blind pair open: the fresh pass on this state has no external partner; run it before walking these findings`;
      return { converged: false, reason, neededSlot: slot, pairFailure: how, deferredSuggestions };
    }
    return {
      converged: false,
      reason: `cadence class '${slot}' has no fresh pass`,
      neededSlot: slot,
      deferredSuggestions,
    };
  }

  // (c) confirm predicate over the MOST RECENT independent pass — the SHIPPED selection rule,
  // edited on one axis only (the new-finding match is substantive). rc02c owns the redesign.
  const independents = ordered.filter(p => isIndependent(p.reviewerClass));
  const latestIndep = independents[independents.length - 1];
  if (!latestIndep) {
    return {
      converged: false,
      reason: `no independent pass for the confirm predicate`,
      neededSlot: 'independent',
      deferredSuggestions,
    };
  }
  if (gate.confirm === 'no-new-findings') {
    if (latestIndep.critical > 0) {
      return {
        converged: false,
        reason: `latest independent pass has ${latestIndep.critical} CRITICAL`,
        confirmFailed: true,
        deferredSuggestions,
      };
    }
    const priorPasses = ordered.slice(0, ordered.indexOf(latestIndep));
    if (hasNewFindings(latestIndep, priorPasses)) {
      return {
        converged: false,
        reason: `latest independent pass yielded new substantive findings`,
        confirmFailed: true,
        deferredSuggestions,
      };
    }
  } else {
    if (latestIndep.critical > 0) {
      return {
        converged: false,
        reason: `latest independent pass carried ${latestIndep.critical} CRITICAL; one further independent pass on the walked state is required`,
        confirmFailed: true,
        confirmNeedsExternal: true,
        deferredSuggestions,
      };
    }
  }

  return { converged: true, deferredSuggestions };
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
      let passed = total === 0 ? false : checked === total;
      let userValidationPending: string[] | undefined;
      let reason = total === 0 ? undefined : `${checked}/${total} tasks complete`;
      // D5 user-validation subset rule: when EVERY remaining unchecked box (a) is named
      // by the latest apply emit's engine-verified `user_validation_tasks` declaration
      // AND (b) self-describes as a handoff (its line carries the `(User-validation`
      // marker), the gate is passed FOR FLOW PURPOSES — apply's AI-doable work is done;
      // the pending human obligation is surfaced, never hidden. Recomputed from disk
      // each render: a new ordinary unchecked task breaks the subset and the gate
      // honestly drops back to `ready`.
      if (!passed && total > 0 && gate.tracks) {
        const declared = trail.latestApplyUserValidation;
        if (declared && declared.length > 0) {
          const unchecked = uncheckedTaskLines(changeDir, gate.tracks);
          const allDeclaredHandoffs =
            unchecked.length > 0 &&
            unchecked.every(u => declared.includes(u.id) && u.text.includes('(User-validation'));
          if (allDeclaredHandoffs) {
            passed = true;
            userValidationPending = unchecked.map(u => u.id);
            reason = `${checked}/${total} tasks complete — awaiting user validation: ${userValidationPending.join(', ')}`;
          }
        }
      }
      status = {
        id: gate.id,
        kind: gate.kind,
        state: passed ? 'passed' : 'ready',
        reason,
        checked,
        total,
        ...(userValidationPending ? { userValidationPending } : {}),
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

  // rc02 BUDGET. The REPORTED figure counts every independent pass on the gate's mode across the
  // whole trail, stale included — spend is spend — plus every REJECTED external return attributed
  // to that mode, which satisfies no slot but cost a run. The TRIGGER counts only items fresh
  // against the current state, so an apply that staleness-invalidates a pair cannot report the
  // budget spent during the re-cover the gate itself is asking for.
  const rejected = trail.rejectedExternals.filter(r => (mode ? r.mode === mode : true));
  const indepAll = relevant.filter(p => isIndependent(p.reviewerClass));
  const independentSpend = indepAll.length + rejected.length;
  const independentSpendFresh =
    indepAll.filter(p => !isPassStale(p, trail.applyTokens)).length +
    rejected.filter(r => !trail.applyTokens.some(t => t > r.token)).length;
  const budgetFields =
    gate.budget === undefined ? {} : { budget: gate.budget, independentSpend, independentSpendFresh };

  // Coverage (a)/confirm (c) use fresh passes; resolution (b) uses ALL relevant passes.
  const freshEval = evaluateReviewed(gate, fresh, relevant, trail);
  if (freshEval.converged) {
    const deferred = freshEval.deferredSuggestions ?? 0;
    return {
      id: gate.id,
      kind: gate.kind,
      state: 'passed',
      ...budgetFields,
      ...(gate.budget === undefined ? {} : { budgetExhausted: false }),
      ...(deferred > 0
        ? {
            deferredSuggestions: deferred,
            reason: `converged with ${deferred} SUGGESTION-grade finding${deferred === 1 ? '' : 's'} deferred (reported, never blocking)`,
          }
        : {}),
      before: gate.before,
      consent: gate.consent,
      nextCommand: nextAfterPass(gate, changeName),
    };
  }

  // Distinguish stale (a later apply invalidated otherwise-covering passes) from unpassed.
  const allEval = evaluateReviewed(gate, relevant, relevant, trail);
  const stale = allEval.converged && !freshEval.converged;

  const next = canonicalNextForReviewed(gate, mode, changeName, freshEval, trail, fresh);
  const exhausted = gate.budget !== undefined && independentSpendFresh >= gate.budget;
  let reason = stale ? `a review pass is stale (an apply landed after it)` : freshEval.reason;
  if (exhausted && gate.budget !== undefined) {
    // The exhausted reason carries the spend AND the clause it displaced: a reader shown only a
    // spend figure cannot tell what a further pass would be for.
    reason = `budget spent: ${independentSpendFresh} of ${gate.budget} independent passes${
      rejected.length > 0
        ? ` (including ${rejected.length} external return${rejected.length === 1 ? '' : 's'} rejected as malformed — ${rejected
            .map(r => path.basename(r.file))
            .join(', ')})`
        : ''
    }; ${reason ?? 'still unconverged'}`;
  }
  return {
    id: gate.id,
    kind: gate.kind,
    state: stale ? 'stale' : 'unpassed',
    reason,
    ...budgetFields,
    ...(gate.budget === undefined ? {} : { budgetExhausted: exhausted }),
    ...((freshEval.deferredSuggestions ?? 0) > 0
      ? { deferredSuggestions: freshEval.deferredSuggestions }
      : {}),
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
  if (ev.neededSlot === 'blind-pair') {
    // Name the class missing from the earliest pair STILL FORMABLE. A standing pass counts as a
    // candidate member only while it is PAIRABLE — once walked it can never pair with a later
    // partner, so recommending its partner would buy a pass that satisfies no slot.
    const pairable = freshPasses.filter(p => isIndependent(p.reviewerClass) && isPairable(p, trail));
    const hasFresh = pairable.some(p => p.reviewerClass === 'fresh');
    const hasExternal = pairable.some(p => p.reviewerClass === 'external');
    if (hasFresh && !hasExternal) {
      return { cmd: `/orbit:review --as ${m} --reviewer external ${change}`, slot: 'blind-pair' };
    }
    return { cmd: `/orbit:review --as ${m} --fresh ${change}`, slot: 'blind-pair' };
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
        return s.userValidationPending?.length
          ? `${label} ✓ (awaiting user validation: ${s.userValidationPending.join(', ')})`
          : `${label} ✓`;
      case 'stale':
        return s.budgetExhausted ? `${label} STALE BUDGET-SPENT` : `${label} STALE`;
      case 'blocked':
        return `${label} blocked-by-gate`;
      case 'ready':
        return `${label} ready`;
      default:
        return s.budgetExhausted ? `${label} unpassed BUDGET-SPENT` : `${label} unpassed`;
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
