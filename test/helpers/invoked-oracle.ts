import * as path from 'node:path';
import { evaluateReviewedGate } from '../../src/core/artifact-graph/gates.js';
import { CADENCE_ENTRIES, type CadenceEntry, type NormalizedGate } from '../../src/core/artifact-graph/types.js';
import type { Trail, TrailPass, TrailResolution } from '../../src/core/artifact-graph/trail.js';

/**
 * rc17a-invoked-coverage, exit (1) — the EXHAUSTIVE ORACLE of design D9.
 *
 * STATED SIZE: every cadence of length 1 to 3 over the six cadence tokens (6 + 36 + 216 = 258 cadences)
 * × every trail of 1 to 5 events (81,426 trails), in one mode (`system`). The event alphabet is: a
 * fresh pass `F`, an external return `E`, an in-context pass `I`, a pair launch `L` (a `review-external`
 * T0 carrying `pair: true`), an external return the trail reader REJECTS `R`, an apply `A`, the TIE `T`
 * (a fresh pass and an external return sharing one token), the LAUNCH TIE `U` (a launch and an external
 * return sharing one token — added at the system walk, external W2), and `W<k>` — a walk record
 * referencing the k-th pass already on the trail. Every event takes the next distinct token; only `T` and
 * `U` share one. A launch tied with a FRESH pass is not an event: every internal emit clears its token
 * against every trail file, so only a hand-saved external return can share a launch's token; the rule is
 * class-agnostic and the fresh case is a unit test. 258 × 81,426 = 21,007,908 cases.
 *
 * The engine is called through its in-memory seam (`evaluateReviewedGate`, task 3.1) — never on-disk
 * fixtures. The REFERENCE below is written from the requirements' text alone: it enumerates every
 * assignment (no memo, no pruning) and reads pair membership straight from the launch definition. Passes
 * carry no findings, so clause (b) holds everywhere and the engine's `passed` IS coverage of the fresh
 * pass list. Clause (a)'s ordering bar is the immediately previous slot's passes and the records
 * referencing them — the existing engine reading this change does not move.
 *
 * Two properties per case: EQUALITY (engine coverage and `openPair` equal the reference's, and — added at
 * the system walk, which both halves found the oracle blind to — whenever the deepest failed slot is
 * `invoked`, the engine's REASON equals the reference's reading of the presentation table), and
 * REPAIRABILITY in one direction only (whenever `openPair.missing` is X, one new X pass above every token
 * lets the failed slot be covered; the converse is NOT asserted — on a tie either class repairs while
 * `openPair` is rightly absent). A disagreement fails naming the cadence and the trail.
 */

type Cls = 'fresh' | 'external' | 'in-context';
const MODE = 'system' as const;
const CHANGE_DIR = '/proj/orbit/changes/x';
const RUNS = `${CHANGE_DIR}/.orbit-runs`;
export const tok = (i: number): string => `2026-10-05T10-${String(i).padStart(2, '0')}-00Z`;

export type Ev = 'F' | 'E' | 'I' | 'L' | 'R' | 'A' | 'T' | 'U' | { w: number };

export function passOf(cls: Cls, token: string): TrailPass {
  const file = cls === 'external' ? `${RUNS}/external-${MODE}-${token}.md` : `${RUNS}/review-${MODE}-${token}.json`;
  return {
    token,
    file: cls === 'in-context' ? file.replace('.json', '-ic.json') : file,
    reviewerClass: cls,
    mode: MODE,
    critical: 0,
    warning: 0,
    suggestion: 0,
    findings: [],
    source: cls === 'external' ? 'external' : 'internal-review',
  };
}

export function buildTrail(events: Ev[]): Trail {
  const trail: Trail = {
    changeDir: CHANGE_DIR,
    runsDir: RUNS,
    passes: [],
    resolutions: [],
    launches: [],
    applyTokens: [],
    rejectedExternals: [],
  };
  const passOrder: TrailPass[] = [];
  events.forEach((e, i) => {
    const t = tok(i + 1);
    if (e === 'F' || e === 'E' || e === 'I') {
      const p = passOf(e === 'F' ? 'fresh' : e === 'E' ? 'external' : 'in-context', t);
      trail.passes.push(p);
      passOrder.push(p);
    } else if (e === 'T') {
      const f = passOf('fresh', t);
      const x = passOf('external', t);
      trail.passes.push(f, x);
      passOrder.push(f, x);
    } else if (e === 'U') {
      trail.launches.push({ token: t, mode: MODE });
      const x = passOf('external', t);
      trail.passes.push(x);
      passOrder.push(x);
    } else if (e === 'L') trail.launches.push({ token: t, mode: MODE });
    else if (e === 'R') trail.rejectedExternals.push({ token: t, file: `${RUNS}/external-${MODE}-${t}.md`, mode: MODE });
    else if (e === 'A') trail.applyTokens.push(t);
    else {
      const target = passOrder[e.w];
      const rec: TrailResolution = {
        token: t,
        sourcePath: `orbit/changes/x/.orbit-runs/${path.basename(target.file)}`,
        deferred: 0,
        escalated: 0,
        readable: false,
        entries: [],
      };
      trail.resolutions.push(rec);
    }
  });
  return trail;
}

export function* trails(): Generator<Ev[]> {
  const base: Ev[] = ['F', 'E', 'I', 'L', 'R', 'A', 'T', 'U'];
  const rec = function* (seq: Ev[], npass: number): Generator<Ev[]> {
    if (seq.length > 0) yield seq;
    if (seq.length === 5) return;
    for (const b of base) {
      yield* rec([...seq, b], npass + (b === 'F' || b === 'E' || b === 'I' || b === 'U' ? 1 : b === 'T' ? 2 : 0));
    }
    for (let k = 0; k < npass; k++) yield* rec([...seq, { w: k }], npass);
  };
  yield* rec([], 0);
}

export function cadences(): CadenceEntry[][] {
  const out: CadenceEntry[][] = [];
  const rec = (acc: CadenceEntry[]): void => {
    if (acc.length > 0) out.push(acc);
    if (acc.length === 3) return;
    for (const t of CADENCE_ENTRIES) rec([...acc, t]);
  };
  rec([]);
  return out;
}

export const gateOf = (cadence: CadenceEntry[]): NormalizedGate => ({
  id: 'review-system',
  kind: 'reviewed',
  requires: [],
  inputs: [],
  cadence,
  confirm: 'findings-resolved',
  before: 'archive',
});

// ---------------------------------------------------------------- the reference (requirements' text)

export interface RefWorld {
  fresh: TrailPass[];
  /** Records referencing a pass, by its file. */
  recs: (p: TrailPass) => string[];
  members: Set<string>;
  /** Passes sharing a launch's token: neither member nor single (the tie fail-safe at the launch boundary). */
  ambiguous: Set<string>;
  complete: Array<[TrailPass, TrailPass]>;
  live?: { token: string; fresh?: TrailPass; external?: TrailPass; tied?: TrailPass; ended: boolean };
  /** Rejected external returns no later apply invalidated — named in every unpassed reason. */
  rejectedNames: string[];
}

const isIndep = (p: TrailPass): boolean => p.reviewerClass === 'fresh' || p.reviewerClass === 'external';

export function world(trail: Trail): RefWorld {
  // Freshness: a pass is stale iff an apply token is later than its own.
  const fresh = trail.passes.filter(p => !trail.applyTokens.some(a => a > p.token));
  const recs = (p: TrailPass): string[] =>
    trail.resolutions.filter(r => r.sourcePath && path.basename(r.sourcePath) === path.basename(p.file)).map(r => r.token);
  // `A pair's membership is computed from its launch`: per launch, the FIRST fresh and the FIRST external
  // ACCEPTED pass later than it and earlier than the next launch; ENDED by a record referencing a landed
  // member that precedes the member's partner (or with no partner landed).
  const launches = [...trail.launches].sort((a, b) => (a.token < b.token ? -1 : 1));
  const members = new Set<string>();
  const ambiguous = new Set<string>();
  const complete: Array<[TrailPass, TrailPass]> = [];
  let live: RefWorld['live'];
  launches.forEach((L, k) => {
    const N = launches[k + 1]?.token;
    const inWin = trail.passes
      .filter(p => isIndep(p) && p.token > L.token && (N === undefined || p.token < N))
      .sort((a, b) => (a.token < b.token ? -1 : 1));
    const f = inWin.find(p => p.reviewerClass === 'fresh');
    const e = inWin.find(p => p.reviewerClass === 'external');
    const tied = trail.passes.filter(p => isIndep(p) && p.token === L.token).sort((a, b) => (path.basename(a.file) < path.basename(b.file) ? -1 : 1));
    for (const t of tied) ambiguous.add(t.file);
    const endedBy = (m?: TrailPass, partner?: TrailPass): boolean =>
      !!m && recs(m).some(r => partner === undefined || r < partner.token);
    const ended = endedBy(f, e) || endedBy(e, f);
    if (!ended) {
      if (f) members.add(f.file);
      if (e) members.add(e.file);
      if (f && e) complete.push([f, e]);
    }
    if (k === launches.length - 1) live = { token: L.token, fresh: f, external: e, tied: tied[0], ended };
  });
  const rejectedNames = trail.rejectedExternals
    .filter(r => !trail.applyTokens.some(a => a > r.token))
    .map(r => path.basename(r.file));
  return { fresh, recs, members, ambiguous, complete, live, rejectedNames };
}

const blind = (a: TrailPass, b: TrailPass, w: RefWorld): boolean => {
  if (a.token === b.token) return false;
  const lo = a.token < b.token ? a.token : b.token;
  const hi = a.token < b.token ? b.token : a.token;
  return ![...w.recs(a), ...w.recs(b)].some(t => t >= lo && t <= hi);
};

function candidates(slot: CadenceEntry, bound: string | null, w: RefWorld): TrailPass[][] {
  const above = (p: TrailPass): boolean => bound === null || p.token > bound;
  const ps = w.fresh.filter(above);
  switch (slot) {
    case 'in-context':
    case 'fresh':
    case 'external':
      return ps.filter(p => p.reviewerClass === slot).map(p => [p]);
    case 'independent':
      return ps.filter(isIndep).map(p => [p]);
    case 'blind-pair': {
      const out: TrailPass[][] = [];
      for (const a of ps) for (const b of ps) {
        if (a.reviewerClass === 'fresh' && b.reviewerClass === 'external' && blind(a, b, w)) out.push([a, b]);
      }
      return out;
    }
    case 'invoked': {
      const out: TrailPass[][] = ps.filter(p => isIndep(p) && !w.members.has(p.file) && !w.ambiguous.has(p.file)).map(p => [p]);
      for (const [a, b] of w.complete) {
        if (ps.includes(a) && ps.includes(b) && blind(a, b, w)) out.push([a, b]);
      }
      return out;
    }
  }
}

export interface RefResult {
  covered: boolean;
  deepest: number;
  bound: string | null;
}

export function refCover(cadence: CadenceEntry[], w: RefWorld): RefResult {
  let deepest = 0;
  const boundsAt: Array<Array<string | null>> = cadence.map(() => []);
  let covered = false;
  const go = (i: number, bound: string | null): void => {
    if (i === cadence.length) {
      covered = true;
      return;
    }
    deepest = Math.max(deepest, i);
    boundsAt[i].push(bound);
    for (const c of candidates(cadence[i], bound, w)) {
      const next = [...c.map(p => p.token), ...c.flatMap(p => w.recs(p))].reduce((m, t) => (t > m ? t : m));
      go(i + 1, next);
    }
  };
  go(0, null);
  const bs = boundsAt[deepest] ?? [];
  const bound = bs.includes(null) ? null : bs.length ? bs.reduce((m, t) => (t! < m! ? t : m)) : null;
  return { covered, deepest, bound };
}

export function refOpenPair(cadence: CadenceEntry[], w: RefWorld, r: RefResult): 'fresh' | 'external' | undefined {
  if (r.covered) return undefined;
  const slot = cadence[r.deepest];
  const above = (p: TrailPass): boolean => r.bound === null || p.token > r.bound;
  if (slot === 'blind-pair') {
    const pairable = w.fresh.filter(p => isIndep(p) && above(p) && !w.recs(p).some(t => t >= p.token));
    const hasF = pairable.some(p => p.reviewerClass === 'fresh');
    const hasE = pairable.some(p => p.reviewerClass === 'external');
    if (hasF && !hasE) return 'external';
    if (hasE && !hasF) return 'fresh';
    return undefined;
  }
  if (slot === 'invoked') {
    // The presentation table's first row: the live launch has exactly ONE member (by membership), that
    // member is usable on this state (in the fresh list) and above the bound, and the pair has not ended.
    const live = w.live;
    if (!live || live.ended) return undefined;
    const members = [live.fresh, live.external].filter((m): m is TrailPass => !!m);
    if (members.length !== 1 || !w.fresh.includes(members[0]) || !above(members[0])) return undefined;
    return members[0].reviewerClass === 'fresh' ? 'external' : 'fresh';
  }
  return undefined;
}

/**
 * The reason an uncovered `invoked` slot presents, read row by row from `orbit-engine-gates`' presentation
 * table (default preference: the fallback class is `fresh`), then the clauses every unpassed reason carries:
 * the stale discrimination (the full pass list would cover) and the rejected-return suffix.
 */
export function refInvokedReason(cadence: CadenceEntry[], w: RefWorld, wAll: RefWorld, r: RefResult): string {
  const above = (p: TrailPass): boolean => r.bound === null || p.token > r.bound;
  let reason: string;
  if (refCover(cadence, wAll).covered) reason = 'a review pass is stale (an apply landed after it)';
  else {
    const live = w.live;
    const fallback = 'no outside review stands on this state';
    if (!live || live.ended) reason = fallback;
    else {
      const L = live.token;
      const members = [live.fresh, live.external].filter((m): m is TrailPass => !!m);
      if (members.length === 1) {
        const m = members[0];
        const cls = m.reviewerClass;
        const missing = cls === 'fresh' ? 'external' : 'fresh';
        if (!w.fresh.includes(m)) reason = `pair launched at ${L} cannot fill this slot: its ${cls} member is stale (an apply landed after it); a further ${cls} review lands as a single`;
        else if (above(m)) reason = `pair launched at ${L} is open: the ${cls} member has no ${missing} partner; run it before walking these findings`;
        else reason = `pair launched at ${L} cannot fill this slot: its ${cls} member sits at or below the slot's bound; a further ${cls} review lands as a single`;
      } else if (members.length === 0) {
        reason = live.tied
          ? `pair launched at ${L} ambiguous: the ${live.tied.reviewerClass} pass sharing its token may have preceded it; a further ${live.tied.reviewerClass} review lands as its member`
          : `pair launched at ${L}: neither member has landed; both must land before either is walked`;
      } else if (members.every(m => w.fresh.includes(m) && above(m)) && members[0].token === members[1].token) {
        reason = `pair launched at ${L} ambiguous: its two members share a timestamp token`;
      } else reason = fallback;
    }
  }
  if (w.rejectedNames.length > 0) {
    reason += ` (${w.rejectedNames.length} external return${w.rejectedNames.length === 1 ? '' : 's'} rejected as malformed — ${w.rejectedNames.join(', ')})`;
  }
  return reason;
}

export const describeTrail = (evs: Ev[]): string => evs.map(e => (typeof e === 'string' ? e : `W${e.w}`)).join(' ');


export const ORACLE_TRAIL_COUNT = 81426;

/**
 * One shard of the oracle: every cadence whose FIRST token is `first` (1 + 6 + 36 = 43 cadences) × every
 * trail. Six shards, one per token, run as six test files so the 21,007,908 cases spread across workers.
 *
 * The loop yields to the event loop about once a second. A shard runs for a minute or more on a CI runner, and a
 * worker whose event loop never turns cannot read vitest's RPC replies, so its calls to the main process time out
 * and vitest fails the run with unhandled errors although every test passed (public-readiness: CI's macOS leg).
 */
export async function runOracleShard(first: CadenceEntry): Promise<{ cases: number; withOpenPair: number; failures: string[] }> {
  const cads = cadences().filter(c => c[0] === first);
  let cases = 0;
  let withOpenPair = 0;
  const failures: string[] = [];
  let lastYield = Date.now();
  for (const evs of trails()) {
    if (Date.now() - lastYield > 1000) {
      await new Promise(resolve => setImmediate(resolve));
      lastYield = Date.now();
    }
    const trail = buildTrail(evs);
    const w = world(trail);
    let wAll: RefWorld | undefined;
    const extra: Partial<Record<'fresh' | 'external', RefWorld>> = {};
    for (const cadence of cads) {
      cases++;
      const status = evaluateReviewedGate(gateOf(cadence), 'x', trail);
      const engineCovered = status.state === 'passed';
      const engineMissing = status.openPair?.missing;
      const ref = refCover(cadence, w);
      const refMissing = refOpenPair(cadence, w, ref);
      if (engineCovered !== ref.covered || engineMissing !== refMissing) {
        failures.push(
          `[${cadence.join(', ')}] × ${describeTrail(evs)}: engine covered=${engineCovered} openPair=${engineMissing ?? '-'}; reference covered=${ref.covered} openPair=${refMissing ?? '-'}`
        );
        if (failures.length >= 20) return { cases, withOpenPair, failures };
        continue;
      }
      if (!ref.covered && cadence[ref.deepest] === 'invoked') {
        wAll ??= { ...w, fresh: trail.passes };
        const refReason = refInvokedReason(cadence, w, wAll, ref);
        if (status.reason !== refReason) {
          failures.push(`[${cadence.join(', ')}] × ${describeTrail(evs)}: engine reason "${status.reason}"; reference "${refReason}"`);
          if (failures.length >= 20) return { cases, withOpenPair, failures };
        }
      }
      if (engineMissing) {
        withOpenPair++;
        // REPAIRABILITY, one direction: one new pass of the missing class above every token.
        if (!extra[engineMissing]) {
          const t2 = buildTrail(evs);
          t2.passes.push(passOf(engineMissing, tok(9)));
          extra[engineMissing] = world(t2);
        }
        const after = refCover(cadence, extra[engineMissing]!);
        if (!(after.covered || after.deepest > ref.deepest)) {
          failures.push(`[${cadence.join(', ')}] × ${describeTrail(evs)}: openPair ${engineMissing} is not repairable`);
          if (failures.length >= 20) return { cases, withOpenPair, failures };
        }
      }
    }
  }
  return { cases, withOpenPair, failures };
}
