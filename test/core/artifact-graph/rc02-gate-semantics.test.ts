import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseSchema, SchemaValidationError } from '../../../src/core/artifact-graph/schema.js';
import { readTrail } from '../../../src/core/artifact-graph/trail.js';
import { computeGateStates } from '../../../src/core/artifact-graph/gates.js';
import type { SchemaYaml } from '../../../src/core/artifact-graph/types.js';

/**
 * rc02-gate-semantics. Severity-aware convergence, the `blind-pair` slot, and the budget
 * reported BESIDE the gate state. Every trail here is written out by hand and walked through
 * the real engine — the defects this stage shipped through six review passes were all rules
 * that read correctly and computed wrongly, and only executing them catches that.
 */

const PAIR_YAML = `
name: t-pair
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: P
    template: p.md
  - id: tasks
    generates: tasks.md
    description: T
    template: t.md
    requires: [proposal]
gates:
  - id: apply
    kind: tracked
    requires: [tasks]
    tracks: tasks.md
  - id: review-system
    kind: reviewed
    requires: [apply]
    cadence: [blind-pair, in-context]
    confirm: findings-resolved
    budget: 3
    before: archive
`;

const PROPOSAL_YAML = `
name: t-prop
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
    cadence: [independent, in-context]
    confirm: no-new-findings
    budget: 3
    before: apply
`;

let dir: string;
let runs: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc02-'));
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(dir, 'proposal.md'), '# P');
  fs.writeFileSync(path.join(dir, 'tasks.md'), '- [x] one\n');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

// ---- trail writers ---------------------------------------------------------

type Sev = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

function review(token: string, mode: string, cls: string, findings: Array<[Sev, string]> = []) {
  fs.writeFileSync(
    path.join(runs, `review-${mode}-${token}.json`),
    JSON.stringify({
      command: 'review',
      mode,
      reviewer_class: cls,
      findings: findings.map(([severity, title]) => ({ severity, title, file: `f/${title}.ts` })),
    })
  );
}

function external(token: string, mode: string, findings: Array<[Sev, string]> = []) {
  const sec = (s: Sev) => {
    const mine = findings.filter(f => f[0] === s);
    if (mine.length === 0) return `## ${s}\n\nNone.\n`;
    return `## ${s}\n\n` + mine.map(f => `### ${f[1]}\n**File**: f/${f[1]}.ts\n`).join('\n') + '\n';
  };
  fs.writeFileSync(
    path.join(runs, `external-${mode}-${token}.md`),
    `# External Review: x (iteration 1)\n\n**Reviewer**: M\n\n${sec('CRITICAL')}\n${sec('WARNING')}\n${sec('SUGGESTION')}\n`
  );
}

/** A malformed external return: parses to nothing, but it cost a run. */
function externalRejected(token: string, mode: string) {
  fs.writeFileSync(path.join(runs, `external-${mode}-${token}.md`), 'not a review at all\n');
}

function walk(token: string, sourceFile: string, opts: { entries?: any; summary?: any } = {}) {
  const body: any = { command: 'address-reviews', source_path: `orbit/x/.orbit-runs/${sourceFile}` };
  if (opts.entries !== undefined) body.resolutions = opts.entries;
  body.resolution_summary = opts.summary ?? { resolved: 1, stale_suppressed: 0, deferred: 0, escalated: 0 };
  fs.writeFileSync(path.join(runs, `address-reviews-${token}.json`), JSON.stringify(body));
}

function apply(token: string) {
  fs.writeFileSync(path.join(runs, `apply-${token}.json`), JSON.stringify({ command: 'apply' }));
}

function gate(yaml: string, id = 'review-system') {
  const schema: SchemaYaml = parseSchema(yaml);
  const completed = new Set(['proposal', 'tasks']);
  return computeGateStates(schema, 'x', dir, completed).gates.find(g => g.id === id)!;
}

const T = (n: number) => `2026-09-14T10-${String(n).padStart(2, '0')}-00Z`;
const ok = (sev: Sev, title: string) => ({ severity: sev, title, file: `f/${title}.ts`, outcome: 'resolved' });

// ---- clause (b): severity, existence, readability --------------------------

describe('rc02 clause (b) — existence first, one readability predicate, one fallback', () => {
  it('an unwalked pass carrying a WARNING blocks', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('unpassed');
    expect(gate(PAIR_YAML).reason).toMatch(/unresolved substantive findings/);
  });

  it('an unwalked SUGGESTION-only pass does NOT block — existence is scoped to substantive', () => {
    review(T(1), 'system', 'fresh', [['SUGGESTION', 's']]);
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  it('a deferred SUGGESTION does not block a readable record, even when the summary reports it', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w'], ['SUGGESTION', 's']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [ok('WARNING', 'w'), { severity: 'SUGGESTION', title: 's', file: 'f/s.ts', outcome: 'deferred' }],
      // the severity-BLIND aggregate disagrees; the per-entry data is preferred
      summary: { resolved: 1, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    review(T(4), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('passed');
    expect(g.deferredSuggestions).toBe(1);
    expect(g.reason).toMatch(/1 SUGGESTION-grade finding deferred/);
  });

  it('a deferred WARNING blocks', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts', outcome: 'deferred' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('legacy `status` reads as the disposition (the 49-entry archive generation)', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts', status: 'resolved' }],
    });
    review(T(4), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  it('a dispositionless entry makes the record unreadable and falls it back WHOLE (the 217-entry generation)', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('an unrecognised disposition makes the record unreadable', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts', outcome: 'deferred to rc04' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('an unrecognised severity makes the record unreadable — the fail-safe points the safe way', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'blocker', title: 'w', file: 'f/w.ts', outcome: 'deferred' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('an EMPTY `resolutions` array is unreadable and never vacuously resolves over its own summary', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 2, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('a counter-object `resolutions` with no summary leaves the pass unresolved (the 8-record generation)', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    fs.writeFileSync(
      path.join(runs, `address-reviews-${T(3)}.json`),
      JSON.stringify({
        command: 'address-reviews',
        source_path: `orbit/x/.orbit-runs/review-system-${T(1)}.json`,
        resolutions: { fixed: 5, ratified_as_designed: 0 },
      })
    );
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('one suggestion deferred across two passes counts once', () => {
    review(T(1), 'system', 'fresh', [['SUGGESTION', 'dup']]);
    external(T(2), 'system', [['SUGGESTION', 'dup']]);
    const dup = { severity: 'SUGGESTION', title: 'dup', file: 'f/dup.ts', outcome: 'deferred' };
    walk(T(3), `review-system-${T(1)}.json`, { entries: [dup] });
    walk(T(4), `external-system-${T(2)}.md`, { entries: [dup] });
    review(T(5), 'system', 'in-context');
    expect(gate(PAIR_YAML).deferredSuggestions).toBe(1);
  });
});

// ---- clause (c): substantive new-finding match -----------------------------

describe('rc02 clause (c) — the new-finding match is substantive', () => {
  it('a new SUGGESTION satisfies no-new-findings', () => {
    review(T(1), 'proposal', 'fresh', [['SUGGESTION', 'a']]);
    review(T(2), 'proposal', 'in-context');
    review(T(3), 'proposal', 'fresh', [['SUGGESTION', 'brand-new']]);
    expect(gate(PROPOSAL_YAML, 'review-proposal').state).toBe('passed');
  });

  it('a new WARNING does not', () => {
    review(T(1), 'proposal', 'fresh');
    review(T(2), 'proposal', 'in-context');
    review(T(3), 'proposal', 'fresh', [['WARNING', 'brand-new']]);
    walk(T(4), `review-proposal-${T(3)}.json`, { entries: [ok('WARNING', 'brand-new')] });
    const g = gate(PROPOSAL_YAML, 'review-proposal');
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/new substantive findings/);
  });
});

// ---- clause (a): the blind pair --------------------------------------------

describe('rc02 clause (a) — the blind-pair slot', () => {
  it('a valid pair satisfies, and the trailing in-context covers the cadence', () => {
    review(T(1), 'system', 'fresh');
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  it('a walk of one member between them breaks blindness', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    walk(T(2), `review-system-${T(1)}.json`, { entries: [ok('WARNING', 'w')] });
    external(T(3), 'system');
    review(T(4), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/blind pair broken/);
  });

  it('an UNRELATED walk does not break the pair', () => {
    review(T(1), 'system', 'fresh');
    walk(T(2), 'audit-drift-2026-09-14T09-00-00Z.json', { entries: [ok('WARNING', 'other')] });
    external(T(3), 'system');
    review(T(4), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  it('two same-class passes do not form a pair', () => {
    review(T(1), 'system', 'fresh');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/no external partner/);
  });

  it('token ties on the two members are REJECTED rather than certified', () => {
    review('2026-09-14T10-01-00Z', 'system', 'fresh');
    external('2026-09-14T10-01-00Z', 'system');
    review(T(3), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/ambiguous.*share a timestamp token/);
  });

  it('a stale member does not satisfy the slot', () => {
    review(T(1), 'system', 'fresh');
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    apply(T(4)); // staleness-invalidates every pass above
    expect(gate(PAIR_YAML).state).toBe('stale');
  });

  it('the trailing slot must beat the WALK, not merely the pair (the pre-walk ordering case)', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'a']]);
    external(T(2), 'system', [['WARNING', 'b']]);
    review(T(3), 'system', 'in-context'); // runs BEFORE the walks it exists to check
    walk(T(4), `review-system-${T(1)}.json`, { entries: [ok('WARNING', 'a')] });
    walk(T(5), `external-system-${T(2)}.md`, { entries: [ok('WARNING', 'b')] });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('the same trail with the in-context pass AFTER both walks converges', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'a']]);
    external(T(2), 'system', [['WARNING', 'b']]);
    walk(T(3), `review-system-${T(1)}.json`, { entries: [ok('WARNING', 'a')] });
    walk(T(4), `external-system-${T(2)}.md`, { entries: [ok('WARNING', 'b')] });
    review(T(5), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  it('a late second external does not foreclose a covered cadence (coverage is existential)', () => {
    external(T(1), 'system');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'in-context');
    external(T(4), 'system'); // arrives after the cadence was already covered
    expect(gate(PAIR_YAML).state).toBe('passed');
  });
});

// ---- the budget ------------------------------------------------------------

describe('rc02 budget — reported BESIDE the state, never as a state', () => {
  it('exhaustion annotates an unconverged gate without adding a state', () => {
    review(T(1), 'system', 'fresh', [['CRITICAL', 'c']]);
    walk(T(2), `review-system-${T(1)}.json`, { entries: [ok('CRITICAL', 'c')] });
    review(T(3), 'system', 'fresh');
    review(T(4), 'system', 'fresh');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed'); // the five-value set is untouched
    expect(g.budgetExhausted).toBe(true);
    expect(g.independentSpendFresh).toBe(3);
    expect(g.reason).toMatch(/budget spent: 3 of 3 independent passes; /);
    expect(g.reason).toMatch(/blind pair/); // the clause it displaced is named too
  });

  it('convergence beats budget, and the boolean stays present-but-false', () => {
    review(T(1), 'system', 'fresh');
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('passed');
    expect(g.budgetExhausted).toBe(false);
  });

  it('stale passes count in the REPORTED figure but not in the TRIGGER', () => {
    review(T(1), 'system', 'fresh');
    external(T(2), 'system');
    apply(T(3)); // invalidates both
    review(T(4), 'system', 'fresh');
    const g = gate(PAIR_YAML);
    expect(g.independentSpend).toBe(3);
    expect(g.independentSpendFresh).toBe(1);
    expect(g.budgetExhausted).toBe(false); // no exhaustion mid re-cover
  });

  it('a rejected malformed external counts as spend while satisfying no slot, and the reason names it', () => {
    externalRejected(T(1), 'system');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'fresh');
    const g = gate(PAIR_YAML);
    expect(g.independentSpend).toBe(3);
    expect(g.state).toBe('unpassed'); // the rejected return satisfied nothing
    expect(g.budgetExhausted).toBe(true);
    expect(g.reason).toMatch(/rejected as malformed/);
  });

  it('a gate declaring no budget never reports exhaustion', () => {
    const yaml = PAIR_YAML.replace('    budget: 3\n', '');
    review(T(1), 'system', 'fresh');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'fresh');
    const g = gate(yaml);
    expect(g.budgetExhausted).toBeUndefined();
    expect(g.budget).toBeUndefined();
  });

  it('the position readout carries the BUDGET-SPENT token rather than a new state', () => {
    review(T(1), 'system', 'fresh', [['CRITICAL', 'c']]);
    walk(T(2), `review-system-${T(1)}.json`, { entries: [ok('CRITICAL', 'c')] });
    review(T(3), 'system', 'fresh');
    review(T(4), 'system', 'fresh');
    const schema: SchemaYaml = parseSchema(PAIR_YAML);
    const { position } = computeGateStates(schema, 'x', dir, new Set(['proposal', 'tasks']));
    expect(position).toMatch(/review\(system\) unpassed BUDGET-SPENT/);
  });
});

// ---- schema validation -----------------------------------------------------

describe('rc02 schema validation names the gate id', () => {
  it('rejects a non-positive budget', () => {
    expect(() => parseSchema(PAIR_YAML.replace('budget: 3', 'budget: 0'))).toThrow(
      /review-system.*budget must be a positive integer/
    );
  });

  it('rejects a fractional budget', () => {
    expect(() => parseSchema(PAIR_YAML.replace('budget: 3', 'budget: 2.5'))).toThrow(
      SchemaValidationError
    );
  });

  it('rejects an unknown cadence entry, naming the gate rather than an index', () => {
    expect(() => parseSchema(PAIR_YAML.replace('[blind-pair, in-context]', '[triple-blind]'))).toThrow(
      /review-system.*unknown cadence entry 'triple-blind'/
    );
  });
});

// ---- the trail reader ------------------------------------------------------

describe('rc02 trail reader', () => {
  it('parses severity from both provenances and surfaces rejected externals', () => {
    review(T(1), 'system', 'fresh', [['CRITICAL', 'c']]);
    external(T(2), 'system', [['WARNING', 'w']]);
    externalRejected(T(3), 'system');
    const t = readTrail(dir);
    const internal = t.passes.find(p => p.source === 'internal-review')!;
    const ext = t.passes.find(p => p.source === 'external')!;
    expect(internal.findings[0].severity).toBe('CRITICAL');
    expect(ext.findings[0].severity).toBe('WARNING');
    expect(t.rejectedExternals).toHaveLength(1);
    expect(t.rejectedExternals[0].mode).toBe('system');
  });

  it('a record with no `resolutions` key yields the legacy shape rather than throwing', () => {
    walk(T(1), 'review-system-x.json');
    const t = readTrail(dir);
    expect(t.resolutions[0].readable).toBe(false);
    expect(t.resolutions[0].entries).toEqual([]);
  });
});

// ---- canonical next + reasons that teach -----------------------------------

describe('rc02 canonical next — pairability, not mere existence', () => {
  it('names the missing member when a PAIRABLE pass stands', () => {
    review(T(1), 'system', 'fresh');
    const g = gate(PAIR_YAML);
    expect(g.reason).toMatch(/blind pair open: the fresh pass on this state has no external partner/);
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
    expect(g.nextSlot).toBe('blind-pair');
  });

  it('a WALKED pass is not a pairable member — the command does not buy an unusable partner', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    walk(T(2), `review-system-${T(1)}.json`, { entries: [ok('WARNING', 'w')] });
    const g = gate(PAIR_YAML);
    // the standing fresh pass can never pair with any later partner, so the engine asks for the
    // lighter first half rather than an external that would satisfy nothing
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
  });

  it('with nothing standing, the reason says both members must run before either is walked', () => {
    const g = gate(PAIR_YAML);
    expect(g.reason).toMatch(/both members must run before EITHER is walked/);
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
  });

  it('the proposal gate NEVER renders the open-pair note — its cadence declares no blind-pair', () => {
    review(T(1), 'proposal', 'fresh');
    const g = gate(PROPOSAL_YAML, 'review-proposal');
    expect(g.reason ?? '').not.toMatch(/blind pair/);
    expect(g.reason).toMatch(/cadence class 'in-context'/);
  });
});

// ---- the two projections ---------------------------------------------------

describe('rc02 budget fields reach BOTH gate-row projections', () => {
  it('the JSON gate row carries all four fields', async () => {
    const { loadChangeContext, formatChangeStatus } = await import(
      '../../../src/core/artifact-graph/instruction-loader.js'
    );
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc02-proj-'));
    const cd = path.join(root, 'orbit', 'changes', 'c');
    fs.mkdirSync(path.join(cd, 'specs'), { recursive: true });
    fs.mkdirSync(path.join(cd, '.orbit-runs'), { recursive: true });
    for (const f of ['proposal.md', 'design.md']) fs.writeFileSync(path.join(cd, f), '# x');
    fs.writeFileSync(path.join(cd, 'specs', 's.md'), '# s');
    fs.writeFileSync(path.join(cd, 'tasks.md'), '- [x] one\n');
    fs.writeFileSync(
      path.join(cd, '.orbit-runs', `review-system-${T(1)}.json`),
      JSON.stringify({ command: 'review', mode: 'system', reviewer_class: 'fresh', findings: [] })
    );
    const status = formatChangeStatus(loadChangeContext(root, 'c'));
    const row = status.gates.find(g => g.id === 'review-system')!;
    expect(row.budget).toBe(3); // the shipped spec-driven v4 declaration
    expect(row.independentSpend).toBe(1);
    expect(row.independentSpendFresh).toBe(1);
    expect(row.budgetExhausted).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('the human gate row names the spend beside the state', () => {
    const src = fs.readFileSync('src/commands/workflow/status.ts', 'utf-8');
    expect(src).toMatch(/independentSpendFresh/);
    expect(src).toMatch(/BUDGET-SPENT/);
  });
});

// ---- the point of the shape: nothing else had to change --------------------

describe('rc02 — the five-value state set is untouched, so its consumers are', () => {
  it('every consumer of gate state still tests the two-value unconverged set', () => {
    const orientation = fs.readFileSync('src/core/orientation.ts', 'utf-8');
    const instructions = fs.readFileSync('src/commands/workflow/instructions.ts', 'utf-8');
    for (const src of [orientation, instructions]) {
      expect(src).toMatch(/'unpassed'/);
      expect(src).not.toMatch(/budget-exhausted/); // never a sixth STATE
    }
  });

  it('the gate-state union itself gained no member', () => {
    const gates = fs.readFileSync('src/core/artifact-graph/gates.ts', 'utf-8');
    const m = gates.match(/export type GateState = ([^;]+);/)!;
    expect(m[1]).toBe("'blocked' | 'ready' | 'passed' | 'stale' | 'unpassed'");
  });
});

// ---- legacy / archived trails ----------------------------------------------

describe('rc02 over a v3-era trail', () => {
  it('computes without throwing and reports the uncovered blind-pair slot', () => {
    // a v3-shaped system cadence: in-context, external, in-context — no fresh pass anywhere
    review(T(1), 'system', 'in-context');
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/blind pair open: the external pass on this state has no fresh partner/);
  });

  it('no schema-version selector exists outside the consent-era tripwire', () => {
    const sel = fs.readFileSync('src/core/artifact-graph/resolver.ts', 'utf-8');
    expect(sel).not.toMatch(/schema_version/);
  });
});

// ---- the shipped schema ----------------------------------------------------

describe('spec-driven v4', () => {
  it('declares the blind pair and both budgets', () => {
    const yaml = fs.readFileSync('schemas/spec-driven/schema.yaml', 'utf-8');
    const schema = parseSchema(yaml);
    expect(schema.version).toBe(4);
    const sys = schema.gates!.find(g => g.id === 'review-system')!;
    const prop = schema.gates!.find(g => g.id === 'review-proposal')!;
    expect(sys.cadence).toEqual(['blind-pair', 'in-context']);
    expect(sys.budget).toBe(3);
    expect(prop.cadence).toEqual(['independent', 'in-context']);
    expect(prop.budget).toBe(3);
    // consent markers survive the bump
    expect(sys.consent).toBe('user-invoked');
    expect(prop.consent).toBe('user-invoked');
  });

  it('a v2/v3-era schema without budget or blind-pair still parses and behaves as before', () => {
    const legacy = `
name: legacy
version: 3
artifacts:
  - id: proposal
    generates: proposal.md
    description: P
    template: p.md
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal]
    cadence: [independent, in-context]
    confirm: no-new-findings
    before: apply
`;
    const schema = parseSchema(legacy);
    const g = schema.gates!.find(x => x.id === 'review-proposal')!;
    expect(g.budget).toBeUndefined();
    expect(g.cadence).toEqual(['independent', 'in-context']);
  });
});
