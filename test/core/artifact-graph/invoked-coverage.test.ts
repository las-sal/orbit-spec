import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseSchema } from '../../../src/core/artifact-graph/schema.js';
import { resolveSchema } from '../../../src/core/artifact-graph/resolver.js';
import { computeGateStates, computePairMembership, type GateStatus } from '../../../src/core/artifact-graph/gates.js';
import { readTrail } from '../../../src/core/artifact-graph/trail.js';
import { loadChangeContext, formatChangeStatus } from '../../../src/core/artifact-graph/instruction-loader.js';
import { modelHintFor } from '../../../src/core/model-hints.js';
import type { SchemaYaml } from '../../../src/core/artifact-graph/types.js';

/**
 * rc17a-invoked-coverage — exit (2) and the gate behaviour behind exits (1) and (3), over hand-written
 * trails in a disposable project (`<root>/orbit/changes/x`), so the review preference is read from
 * `<root>/orbit/config.yaml` exactly as every surface reads it: once, inside the gate computation.
 * Exit (1)'s exhaustive oracle is `test/core/invoked-coverage-oracle.test.ts`.
 */

type Sev = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
const T = (n: number) => `2026-10-05T11-${String(n).padStart(2, '0')}-00Z`;

let root: string;
let dir: string;
let runs: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc17a-'));
  dir = path.join(root, 'orbit', 'changes', 'x');
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.mkdirSync(path.join(dir, 'specs'), { recursive: true });
  for (const f of ['proposal.md', 'design.md']) fs.writeFileSync(path.join(dir, f), '# x');
  fs.writeFileSync(path.join(dir, 'specs', 's.md'), '# s');
  setTasks(true);
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

function setTasks(done: boolean): void {
  fs.writeFileSync(path.join(dir, 'tasks.md'), done ? '- [x] one\n' : '- [ ] one\n');
}

function review(token: string, mode: string, cls: string, findings: Array<[Sev, string]> = []): string {
  const name = `review-${mode}-${token}.json`;
  fs.writeFileSync(
    path.join(runs, name),
    JSON.stringify({
      command: 'review',
      mode,
      reviewer_class: cls,
      findings: findings.map(([severity, title]) => ({ severity, title, file: `f/${title}.ts` })),
    })
  );
  return name;
}

function external(token: string, mode: string, findings: Array<[Sev, string]> = [], malformed = false): string {
  const sec = (s: Sev) => {
    const mine = findings.filter(f => f[0] === s);
    if (mine.length === 0) return `## ${s}\n\nNone.\n`;
    return `## ${s}\n\n` + mine.map(f => `### ${f[1]}\n**File**: f/${f[1]}.ts\n**Description**: d\n`).join('\n') + '\n';
  };
  const name = `external-${mode}-${token}.md`;
  fs.writeFileSync(
    path.join(runs, name),
    malformed ? 'not a findings file\n' : `# External Review: x (iteration 1)\n\n**Reviewer**: M\n\n${sec('CRITICAL')}\n${sec('WARNING')}\n${sec('SUGGESTION')}\n`
  );
  return name;
}

function t0(token: string, payload: Record<string, unknown>): void {
  fs.writeFileSync(path.join(runs, `review-external-${token}.json`), JSON.stringify({ command: 'review-external', ...payload }));
}
const launch = (token: string, mode = 'system') => t0(token, { mode, pair: true });

function walk(token: string, source: string, entries: Array<[Sev, string, 'resolved' | 'deferred']>): void {
  const deferred = entries.filter(e => e[2] === 'deferred').length;
  fs.writeFileSync(
    path.join(runs, `address-reviews-${token}.json`),
    JSON.stringify({
      source_path: `orbit/changes/x/.orbit-runs/${source}`,
      resolution_summary: { resolved: entries.length - deferred, deferred, escalated: 0 },
      resolutions: entries.map(([severity, title, outcome]) => ({ severity, title, file: `f/${title}.ts`, outcome })),
    })
  );
}

function config(yaml: string): void {
  fs.writeFileSync(path.join(root, 'orbit', 'config.yaml'), `schema: spec-driven\n${yaml}`);
}

const shipped = (): SchemaYaml => resolveSchema('spec-driven');
const ALL = new Set(['proposal', 'specs', 'design', 'tasks']);

function gate(id: 'review-proposal' | 'review-system' = 'review-system', schema: SchemaYaml = shipped()): GateStatus {
  return computeGateStates(schema, 'x', dir, ALL).gates.find(g => g.id === id)!;
}

const modeOf = (id: string) => (id === 'review-proposal' ? 'proposal' : 'system');
const freshCmd = (id: string) => `/orbit:review --as ${modeOf(id)} --fresh x`;
const externalCmd = (id: string) => `/orbit:review --as ${modeOf(id)} --reviewer external x`;

// ---- exit (2): the first slot is covered by what the user invoked, on BOTH shipped gates -------

describe('exit (2) — a single fresh or external pass covers the invoked slot on both gates', () => {
  for (const id of ['review-proposal', 'review-system'] as const) {
    const mode = modeOf(id);
    // The proposal gate is read before apply (tasks open); the system gate after it (tasks done).
    const prep = () => setTasks(id === 'review-system');

    // @scenario behaviour orbit-engine-gates :: The first review slot covers what the user invoked :: A single fresh pass covers the invoked slot
    it(`${id}: a single fresh pass covers the invoked slot, and a later in-context pass completes the cadence`, () => {
      prep();
      review(T(1), mode, 'fresh');
      const before = gate(id);
      expect(before.state).toBe('unpassed');
      expect(before.reason).toBe("cadence class 'in-context' has no fresh pass");
      review(T(2), mode, 'in-context');
      expect(gate(id).state).toBe('passed');
    });

    // @scenario behaviour orbit-engine-gates :: The first review slot covers what the user invoked :: A single external pass covers the invoked slot
    it(`${id}: a single external pass covers the invoked slot, and a later in-context pass completes the cadence`, () => {
      prep();
      external(T(1), mode);
      expect(gate(id).reason).toBe("cadence class 'in-context' has no fresh pass");
      review(T(2), mode, 'in-context');
      expect(gate(id).state).toBe('passed');
    });

    // @scenario behaviour orbit-engine-gates :: The first review slot covers what the user invoked :: The preference changes only the presented command
    it(`${id}: the preference changes only nextCommand and nextSlot — set, absent, unknown, malformed`, () => {
      prep();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const read = (yaml: string | null): GateStatus => {
        if (yaml === null) fs.rmSync(path.join(root, 'orbit', 'config.yaml'), { force: true });
        else config(yaml);
        return gate(id);
      };
      const cases: Array<[string, string | null, string, 'fresh' | 'external', RegExp | null]> = [
        ['absent', null, freshCmd(id), 'fresh', null],
        ['blind-pair', `review_preference:\n  ${id}: blind-pair\n`, freshCmd(id), 'fresh', null],
        ['fresh', `review_preference:\n  ${id}: fresh\n`, freshCmd(id), 'fresh', null],
        ['external', `review_preference:\n  ${id}: external\n`, externalCmd(id), 'external', null],
        ['unknown value', `review_preference:\n  ${id}: triple-blind\n`, freshCmd(id), 'fresh', new RegExp(`'${id}'.*'triple-blind'.*blind-pair`)],
        ['malformed (a list)', `review_preference:\n  - external\n`, freshCmd(id), 'fresh', /Invalid 'review_preference'.*a list/],
        ['unknown gate key', `review_preference:\n  review-nothing: external\n`, freshCmd(id), 'fresh', /Unknown gate 'review-nothing'/],
        // rc17a system walk (external C1): a MAP-shaped value — `String()` on it threw — warns and falls back.
        ['a map value', `review_preference:\n  ${id}:\n    toString: external\n`, freshCmd(id), 'fresh', new RegExp(`'${id}': a map`)],
      ];
      const strip = (g: GateStatus) => {
        const { nextCommand, nextSlot, ...rest } = g;
        void nextCommand;
        void nextSlot;
        return rest;
      };
      const baseline = strip(read(null));
      for (const [label, yaml, cmd, slot, warning] of cases) {
        warn.mockClear();
        const g = read(yaml);
        expect(g.nextCommand, label).toBe(cmd);
        expect(g.nextSlot, label).toBe(slot);
        expect(strip(g), label).toEqual(baseline);
        if (warning) expect(warn.mock.calls.map(c => String(c[0])).join('\n'), label).toMatch(warning);
        else expect(warn, label).not.toHaveBeenCalled();
      }
    });

    // @scenario behaviour orbit-engine-gates :: The first review slot covers what the user invoked :: The preference never re-grades a covered slot
    it(`${id}: the preference never re-grades a covered slot`, () => {
      prep();
      review(T(1), mode, 'fresh');
      const without = gate(id);
      config(`review_preference:\n  ${id}: external\n`);
      expect(gate(id)).toEqual(without);
      config(`review_preference:\n  ${id}: blind-pair\n`);
      expect(gate(id)).toEqual(without);
    });
  }
});

// ---- pair membership --------------------------------------------------------

describe("A pair's membership is computed from its launch", () => {
  // @scenario behaviour orbit-engine-gates :: A pair's membership is computed from its launch :: A launched pair completes
  it('a launched pair completes and covers at its later member', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'in-context'); // between the members: cannot follow a pair satisfied at T4
    external(T(4), 'system');
    const m = computePairMembership(readTrail(dir));
    expect(m.pairs).toHaveLength(1);
    expect(m.pairs[0].fresh?.token).toBe(T(2));
    expect(m.pairs[0].external?.token).toBe(T(4));
    expect(m.pairs[0].endedAt).toBeUndefined();
    const g = gate();
    expect(g.reason).toBe("cadence class 'in-context' has no fresh pass"); // invoked covered at T4
    review(T(5), 'system', 'in-context');
    expect(gate().state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: A pair's membership is computed from its launch :: A walk of the landed half ends the pair
  it('a walk of the landed half ends the pair; the walked half covers as a single and the late partner is an extra single', () => {
    launch(T(1));
    const f = review(T(2), 'system', 'fresh', [['WARNING', 'w']]);
    walk(T(3), f, [['WARNING', 'w', 'resolved']]);
    external(T(4), 'system', [['WARNING', 'late']]);
    const m = computePairMembership(readTrail(dir));
    expect(m.pairs[0].endedAt).toBe(T(3));
    expect(m.memberFiles.size).toBe(0);
    const g = gate();
    expect(g.openPair).toBeUndefined();
    // The extra single's findings are still clause (b)'s.
    expect(g.reason).toBe(`pass ${T(4)} has unresolved substantive findings`);
  });

  // @scenario behaviour orbit-engine-gates :: A pair's membership is computed from its launch :: A rejected return takes no member position
  it('a rejected return takes no member position', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    external(T(3), 'system', [], true);
    external(T(4), 'system');
    const m = computePairMembership(readTrail(dir));
    expect(m.pairs[0].external?.token).toBe(T(4));
    expect(gate().reason).toMatch(/cadence class 'in-context' has no fresh pass/);
  });

  // @scenario behaviour orbit-engine-gates :: A pair's membership is computed from its launch :: A re-run of the missing half refills the open pair
  it('a re-run T0 without pair writes no launch, so the return refills the open pair', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    t0(T(3), { mode: 'system', prompt_path: 'p.md' });
    external(T(4), 'system');
    const trail = readTrail(dir);
    expect(trail.launches.map(l => l.token)).toEqual([T(1)]);
    const m = computePairMembership(trail);
    expect([m.pairs[0].fresh?.token, m.pairs[0].external?.token]).toEqual([T(2), T(4)]);
    expect(gate().reason).toBe("cadence class 'in-context' has no fresh pass");
  });

  // @scenario behaviour orbit-engine-gates :: A pair's membership is computed from its launch :: A second fresh pass is a single
  it('a second fresh pass after the launch is a single and covers alone', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'fresh');
    const m = computePairMembership(readTrail(dir));
    expect(m.pairs[0].fresh?.token).toBe(T(2));
    const g = gate();
    expect(g.openPair).toBeUndefined();
    expect(g.reason).toBe("cadence class 'in-context' has no fresh pass");
  });

  // @scenario behaviour orbit-engine-gates :: A pair's membership is computed from its launch :: A newer launch replaces an open one
  it('a newer launch is the live pair; the older stays as history', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    launch(T(3));
    review(T(4), 'system', 'fresh');
    const m = computePairMembership(readTrail(dir));
    expect(m.pairs.map(p => [p.launch.token, p.fresh?.token])).toEqual([
      [T(1), T(2)],
      [T(3), T(4)],
    ]);
    const g = gate();
    expect(g.openPair).toEqual({ missing: 'external' });
    expect(g.reason).toBe(`pair launched at ${T(3)} is open: the fresh member has no external partner; run it before walking these findings`);
  });

  // @scenario behaviour orbit-engine-gates :: A pair's membership is computed from its launch :: A trail without launches reads as singles
  it('a trail with no launch reads as singles; the earlier covers', () => {
    review(T(1), 'system', 'fresh');
    review(T(2), 'system', 'in-context');
    external(T(3), 'system');
    expect(computePairMembership(readTrail(dir)).memberFiles.size).toBe(0);
    expect(gate().state).toBe('passed');
  });

  it('a T0 lacking the flag or a valid mode is no launch', () => {
    t0(T(1), { mode: 'system' });
    t0(T(2), { pair: true });
    t0(T(3), { pair: true, mode: 'architecture' });
    t0(T(4), { pair: 'yes', mode: 'system' });
    fs.writeFileSync(path.join(runs, `review-external-${T(5)}.json`), '{not json');
    expect(readTrail(dir).launches).toEqual([]);
  });
});

// ---- the invoked presentation table ----------------------------------------

describe('The invoked slot presents what the launch state says', () => {
  // @scenario behaviour orbit-engine-gates :: The first review slot covers what the user invoked :: An invoked pair with one half landed does not cover
  it('one half landed: uncovered, openPair, the missing class presented', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    const g = gate();
    expect(g.state).toBe('unpassed');
    expect(g.openPair).toEqual({ missing: 'external' });
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
    expect(g.nextSlot).toBe('external');
  });

  it('a launch with neither member landed presents the fresh review and says both must land', () => {
    launch(T(1));
    const g = gate();
    expect(g.reason).toBe(`pair launched at ${T(1)}: neither member has landed; both must land before either is walked`);
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
    expect(g.openPair).toBeUndefined();
  });

  it('the two members sharing a token report the tie and present the preference', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    external(T(2), 'system');
    const g = gate();
    expect(g.reason).toBe(`pair launched at ${T(1)} ambiguous: its two members share a timestamp token`);
    expect(g.openPair).toBeUndefined();
  });

  const apply = (token: string) => fs.writeFileSync(path.join(runs, `apply-${token}.json`), JSON.stringify({ command: 'apply' }));

  // rc17a system walk (fresh W1, Sal: C): "landed" is read from membership; a stale member cannot fill the slot.
  it('one member landed and made stale: it cannot fill the slot, and a further review of its class is presented', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    apply(T(3));
    const g = gate();
    expect(g.openPair).toBeUndefined();
    expect(g.reason).toBe(`pair launched at ${T(1)} cannot fill this slot: its fresh member is stale (an apply landed after it); a further fresh review lands as a single`);
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
    // That further review is the window's second fresh pass: a single, and it covers.
    review(T(4), 'system', 'fresh');
    expect(gate().reason).toBe("cadence class 'in-context' has no fresh pass");
  });

  it('both members landed, one or both stale: the pair is complete, no openPair, and the last row presents the preference', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    apply(T(3));
    external(T(4), 'system'); // L F A E — complete by membership; the fresh member is stale
    let g = gate();
    expect(g.openPair).toBeUndefined();
    expect(g.reason).toBe('no outside review stands on this state');
    apply(T(5)); // L F A E A — both stale
    g = gate();
    expect(g.openPair).toBeUndefined();
    expect(g.reason).toBe('no outside review stands on this state');
  });

  // rc17a system walk (external W2): a pass sharing its launch's token is neither member nor single.
  it('an external return sharing its launch token covers nothing, and the reason names the tie', () => {
    launch(T(2));
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    const m = computePairMembership(readTrail(dir));
    expect([...m.ambiguousFiles].map(f => path.basename(f))).toEqual([`external-system-${T(2)}.md`]);
    expect(m.pairs[0].external).toBeUndefined();
    const g = gate();
    expect(g.state).toBe('unpassed');
    expect(g.reason).toBe(
      `pair launched at ${T(2)} ambiguous: the external pass sharing its token may have preceded it; a further external review lands as its member`
    );
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
  });

  it('the launch-boundary tie is class-agnostic: a fresh pass sharing the launch token covers nothing either', () => {
    launch(T(2));
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'in-context');
    const g = gate();
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/ambiguous: the fresh pass sharing its token may have preceded it/);
  });

  // rc17a system walk (external W1, Sal: B): the engine state discovery row 4 reads for a clean landed half.
  it('a clean landed half: openPair stands and neither list names it, so no walk can end the pair', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh');
    const g = gate();
    expect(g.openPair).toEqual({ missing: 'external' });
    expect(g.unresolvedPasses).toEqual([]);
    expect(g.unwalkedPasses).toEqual([]);
  });

  // @scenario behaviour orbit-engine-gates :: The gate reason names the rule that fired and the rule about to fire :: An open launched pair is announced before the walk
  it('an open launched pair outranks the walk: the reason carries both, the next is the missing half', () => {
    launch(T(1));
    review(T(2), 'system', 'fresh', [['WARNING', 'w']]);
    const g = gate();
    expect(g.reason).toBe(
      `pass ${T(2)} has unresolved substantive findings — and the pair launched at ${T(1)} is open: the fresh member has no external partner; run it BEFORE walking these findings, or the walk ends the pair`
    );
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
  });

  // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: An invoked slot's hint reads the presented class
  it("the hint garnishing an invoked slot's command is the presented class's", () => {
    config('models:\n  external: "GPT-6 Codex"\n  fresh: "Claude"\n');
    launch(T(1));
    review(T(2), 'system', 'fresh');
    const status = formatChangeStatus(loadChangeContext(root, 'x'));
    expect(status.next_hint_keys).toEqual({ phase: 'review-system', slot: 'external' });
    expect(modelHintFor(root, status.next_hint_keys)).toBe('GPT-6 Codex');
  });
});

// ---- ordering, freshness and the in-context slot -----------------------------

describe('the invoked slot under clause (a)', () => {
  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: An invoked slot covered by a single pass gates the in-context slot on its walks
  it('a single on the invoked slot holds the in-context slot to its walks', () => {
    const f = review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    review(T(2), 'system', 'in-context'); // before the walk: cannot satisfy the second slot
    walk(T(3), f, [['WARNING', 'w', 'resolved']]);
    expect(gate().state).toBe('unpassed');
    review(T(4), 'system', 'in-context');
    expect(gate().state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: spec-driven v1 gates and cadence :: A trail that covered version 4 covers version 5
  it('a blind pair, both walked, and a later in-context pass — covered under v4 — covers under v5', () => {
    const v4 = parseSchema(
      fs.readFileSync('schemas/spec-driven/schema.yaml', 'utf-8').replace(/cadence: \[invoked, in-context\]\n(\s+confirm: findings-resolved)/, 'cadence: [blind-pair, in-context]\n$1')
    );
    const f = review(T(1), 'system', 'fresh', [['WARNING', 'a']]);
    const e = external(T(2), 'system', [['WARNING', 'b']]);
    walk(T(3), f, [['WARNING', 'a', 'resolved']]);
    walk(T(4), e, [['WARNING', 'b', 'resolved']]);
    review(T(5), 'system', 'in-context');
    expect(v4.gates!.find(g => g.id === 'review-system')!.cadence).toEqual(['blind-pair', 'in-context']);
    expect(gate('review-system', v4).state).toBe('passed');
    expect(gate().state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: spec-driven v1 gates and cadence :: A v3-era archived trail still computes
  it('a trail of in-context passes only (pre-blind-pair) computes and reports its uncovered slot', () => {
    review(T(1), 'system', 'in-context');
    review(T(2), 'system', 'in-context');
    const g = gate();
    expect(g.state).toBe('unpassed');
    expect(g.reason).toBe('no outside review stands on this state');
  });
});

// ---- unwalkedPasses ------------------------------------------------------------

describe('A reviewed gate lists its unwalked passes', () => {
  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: An unwalked SUGGESTION-only pass is listed and does not hold
  it('a SUGGESTION-only pass is listed, and the gate computes exactly as without the field', () => {
    setTasks(false);
    review(T(1), 'proposal', 'fresh', [['SUGGESTION', 's1'], ['SUGGESTION', 's2']]);
    const g = gate('review-proposal');
    expect(g.unresolvedPasses).toEqual([]);
    expect(g.unwalkedPasses).toEqual([
      { token: T(1), file: `orbit/changes/x/.orbit-runs/review-proposal-${T(1)}.json`, mode: 'proposal', source: 'internal-review' },
    ]);
    expect(g.reason).toBe("cadence class 'in-context' has no fresh pass");
  });

  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: A deferred SUGGESTION leaves the unwalked set
  it('a walk deferring both SUGGESTIONs takes the pass out of the set', () => {
    setTasks(false);
    const f = review(T(1), 'proposal', 'fresh', [['SUGGESTION', 's1'], ['SUGGESTION', 's2']]);
    walk(T(2), f, [['SUGGESTION', 's1', 'deferred'], ['SUGGESTION', 's2', 'deferred']]);
    expect(gate('review-proposal').unwalkedPasses).toEqual([]);
  });

  it('a passed gate still lists an unwalked SUGGESTION-only pass, and a pass with no findings is in neither set', () => {
    review(T(1), 'system', 'fresh', [['SUGGESTION', 's']]);
    review(T(2), 'system', 'in-context');
    const g = gate();
    expect(g.state).toBe('passed');
    expect(g.unresolvedPasses).toEqual([]);
    expect(g.unwalkedPasses!.map(p => p.token)).toEqual([T(1)]);
  });

  it('a pass held by the gate is in unresolvedPasses only, never both', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    const g = gate();
    expect(g.unresolvedPasses!.map(p => p.token)).toEqual([T(1)]);
    expect(g.unwalkedPasses).toEqual([]);
  });

  // @scenario behaviour orbit-engine-gates :: A reviewed gate lists its outstanding passes :: A walk after the confirm moves the following slot's bar
  it('a walk landing after the confirm uncovers the in-context slot until a later in-context pass runs', () => {
    const f = review(T(1), 'system', 'fresh', [['SUGGESTION', 's1'], ['SUGGESTION', 's2']]);
    review(T(2), 'system', 'in-context');
    expect(gate().state).toBe('passed');
    walk(T(3), f, [['SUGGESTION', 's1', 'deferred'], ['SUGGESTION', 's2', 'deferred']]);
    const g = gate();
    expect(g.state).toBe('unpassed');
    expect(g.reason).toBe("cadence class 'in-context' has no fresh pass");
    review(T(4), 'system', 'in-context');
    expect(gate().state).toBe('passed');
  });
});

// ---- the structural blind-pair slot and the reason ------------------------

describe('a structural blind-pair slot, and what every reason presents', () => {
  const pairSchema = (): SchemaYaml =>
    parseSchema(fs.readFileSync('schemas/spec-driven/schema.yaml', 'utf-8').replace(/cadence: \[invoked, in-context\]\n(\s+confirm: findings-resolved)/, 'cadence: [blind-pair, in-context]\n$1'));

  // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: The blind pair's missing member is the canonical next
  it('a pairable external with no fresh partner: the fresh review is next, and the reason names the open pair', () => {
    external(T(1), 'system');
    const g = gate('review-system', pairSchema());
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
    expect(g.reason).toBe('blind pair open: the external pass on this state has no fresh partner; run it before walking these findings');
  });

  // @scenario behaviour orbit-engine-gates :: The gate reason names the rule that fired and the rule about to fire :: Open blind pair announced before the walk
  it('an unwalked external with no fresh partner: the reason says the pair is open and names fresh before any walk', () => {
    external(T(1), 'system', [['WARNING', 'w']]);
    const g = gate('review-system', pairSchema());
    expect(g.reason).toMatch(/blind pair is OPEN: run the fresh member BEFORE walking these findings/);
    expect(g.openPair).toEqual({ missing: 'fresh' });
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
  });

  // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: A walked pass is not a pairable member
  it('a fresh and an external, each walked: the fresh review is next and the reason says both must run first', () => {
    // Each walked BEFORE a partner could pair with it: the fresh walk sits inside any pair interval.
    const f = review(T(1), 'system', 'fresh', [['WARNING', 'a']]);
    walk(T(2), f, [['WARNING', 'a', 'resolved']]);
    const e = external(T(3), 'system', [['WARNING', 'b']]);
    walk(T(4), e, [['WARNING', 'b', 'resolved']]);
    const g = gate('review-system', pairSchema());
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
    expect(g.reason).toBe('blind pair open: no independent pass stands on this state — both members must run before EITHER is walked');
    expect(g.openPair).toBeUndefined();
  });

  // @scenario behaviour orbit-engine-gates :: The gate reason names the rule that fired and the rule about to fire :: Deferred suggestions surfaced on a passed gate
  it('a passed gate whose walk deferred a SUGGESTION names the deferred count', () => {
    const f = review(T(1), 'system', 'fresh', [['WARNING', 'w'], ['SUGGESTION', 's']]);
    walk(T(2), f, [['WARNING', 'w', 'resolved'], ['SUGGESTION', 's', 'deferred']]);
    review(T(3), 'system', 'in-context');
    const g = gate();
    expect(g.state).toBe('passed');
    expect(g.reason).toBe('passed with 1 SUGGESTION-grade finding deferred (reported, never blocking)');
  });

  // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: One command, fully specified
  it('every state presents ONE complete invocation: a command, its arguments, the change — never a bare name or an alternative', () => {
    const states: Array<() => void> = [
      () => {},
      () => review(T(1), 'system', 'fresh', [['WARNING', 'w']]),
      () => { launch(T(1)); review(T(2), 'system', 'fresh'); },
      () => { launch(T(1)); },
      () => review(T(1), 'system', 'fresh'),
      () => { review(T(1), 'system', 'fresh'); review(T(2), 'system', 'in-context'); },
    ];
    for (const prep of states) {
      for (const f of fs.readdirSync(runs)) fs.rmSync(path.join(runs, f));
      prep();
      const { next_command } = formatChangeStatus(loadChangeContext(root, 'x'));
      expect(next_command).toMatch(/^\/orbit:[a-z-]+ (--[a-z-]+ [a-z-]+ )*(--[a-z-]+ )?x( — user-invoked)?$/);
      expect(next_command).not.toMatch(/\bor\b|review-external/);
    }
  });
});

// ---- grammar, purity, and recomputation ------------------------------------

describe('the invoked token and the trail as the gate ledger', () => {
  const YAML = (cadence: string) => `
name: t
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: P
    template: p.md
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal]
    cadence: ${cadence}
    before: apply
`;

  // @scenario behaviour orbit-engine-gates :: Gate declaration in schema YAML :: The invoked token parses
  it('cadence [invoked, in-context] parses', () => {
    expect(parseSchema(YAML('[invoked, in-context]')).gates![0].cadence).toEqual(['invoked', 'in-context']);
  });

  // @scenario behaviour orbit-engine-gates :: Gate declaration in schema YAML :: Unknown cadence entry rejected
  it('an unknown cadence entry fails naming the gate and the six allowed entries', () => {
    expect(() => parseSchema(YAML('[triple-blind]'))).toThrow(
      /review-proposal.*unknown cadence entry 'triple-blind'.*allowed: in-context, fresh, external, independent, blind-pair, invoked/
    );
  });

  const listing = (): Array<[string, number]> => {
    const out: Array<[string, number]> = [];
    const walkDir = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walkDir(p);
        else out.push([path.relative(root, p), fs.statSync(p).mtimeMs]);
      }
    };
    walkDir(root);
    return out.sort();
  };

  it('a map-shaped preference leaves orbit status usable: it warns and falls back (external C1)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    config('review_preference:\n  review-system:\n    toString: external\n');
    const status = formatChangeStatus(loadChangeContext(root, 'x'));
    expect(status.next_command).toBe('/orbit:review --as system --fresh x');
    expect(warn.mock.calls.map(c => String(c[0])).join('\n')).toMatch(/'review-system': a map/);
  });

  // @scenario behaviour orbit-engine-gates :: Gate state is a pure function of existing on-disk artifacts :: No new files written by state computation
  it('computing gate state creates and modifies no file', () => {
    config('review_preference:\n  review-system: external\n');
    launch(T(1));
    review(T(2), 'system', 'fresh', [['WARNING', 'w']]);
    const before = listing();
    gate();
    formatChangeStatus(loadChangeContext(root, 'x'));
    expect(listing()).toEqual(before);
  });

  // @scenario behaviour orbit-engine-gates :: Gate state is a pure function of existing on-disk artifacts :: Recomputation reflects new trail entries immediately
  it('a new pass on the trail is reflected on the next computation with no refresh step', () => {
    expect(gate().reason).toBe('no outside review stands on this state');
    review(T(1), 'system', 'fresh');
    expect(gate().reason).toBe("cadence class 'in-context' has no fresh pass");
  });

  // @scenario behaviour orbit-engine-gates :: Gate state is a pure function of existing on-disk artifacts :: A pair launch is read from the trail
  it('a pair launch landing on the trail is reflected, and nothing is written', () => {
    review(T(2), 'system', 'fresh');
    expect(gate().reason).toBe("cadence class 'in-context' has no fresh pass");
    // A launch BEFORE the pass makes it a member of an open pair.
    launch(T(1));
    const before = listing();
    expect(gate().openPair).toEqual({ missing: 'external' });
    expect(listing()).toEqual(before);
  });
});
