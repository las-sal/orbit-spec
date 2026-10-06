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
    // The full ingestion triple: a truncated entry is now rejected by the parser (walk 9).
    return (
      `## ${s}\n\n` +
      mine.map(f => `### ${f[1]}\n**File**: f/${f[1]}.ts\n**Description**: d\n`).join('\n') +
      '\n'
    );
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
  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Findings with no completing address-reviews run fail the gate
  it('an unwalked pass carrying a WARNING blocks', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('unpassed');
    expect(gate(PAIR_YAML).reason).toMatch(/unresolved substantive findings/);
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: An unwalked SUGGESTION-only pass does not block
  it('an unwalked SUGGESTION-only pass does NOT block — existence is scoped to substantive', () => {
    review(T(1), 'system', 'fresh', [['SUGGESTION', 's']]);
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: A deferred SUGGESTION does not block a readable record
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
    // rc02c: pin the PREFIX too. A suffix-only match was satisfied by the retired
    // `converged with ...` reason as happily as by the new `passed with ...` one, so the change
    // that retired the convergence claim was unpinned by the test meant to cover it.
    expect(g.reason).toMatch(/^passed with 1 SUGGESTION-grade finding deferred/);
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Unresolved substantive findings fail the gate
  it('a deferred WARNING blocks', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts', outcome: 'deferred' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
    expect(gate(PAIR_YAML).reason).toBe(`pass ${T(1)} has unresolved substantive findings`); // rc08b 5.2: the reason names the pass
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Legacy `status` is read as the disposition
  it('legacy `status` reads as the disposition (the 49-entry archive generation)', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts', status: 'resolved' }],
    });
    review(T(4), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: A dispositionless entry makes the record unreadable
  it('a dispositionless entry makes the record unreadable and falls it back WHOLE (the 217-entry generation)', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: An unrecognised disposition makes the record unreadable
  it('an unrecognised disposition makes the record unreadable', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts', outcome: 'deferred to rc04' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: An unrecognised severity makes the record unreadable
  it('an unrecognised severity makes the record unreadable — the fail-safe points the safe way', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'blocker', title: 'w', file: 'f/w.ts', outcome: 'deferred' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: An empty `resolutions` array is unreadable
  it('an EMPTY `resolutions` array is unreadable and never vacuously resolves over its own summary', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 2, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: A non-array `resolutions` is unreadable
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

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Deferred suggestions do not fail the gate
  it('one suggestion deferred across two passes counts once', () => {
    review(T(1), 'system', 'fresh', [['SUGGESTION', 'dup']]);
    external(T(2), 'system', [['SUGGESTION', 'dup']]);
    const dup = { severity: 'SUGGESTION', title: 'dup', file: 'f/dup.ts', outcome: 'deferred' };
    walk(T(3), `review-system-${T(1)}.json`, { entries: [dup] });
    walk(T(4), `external-system-${T(2)}.md`, { entries: [dup] });
    review(T(5), 'system', 'in-context');
    expect(gate(PAIR_YAML).deferredSuggestions).toBe(1);
    // rc08b 5.2: clause (b) holds, the gate passes, and the count is named in the reason.
    expect(gate(PAIR_YAML).state).toBe('passed');
    expect(gate(PAIR_YAML).reason).toMatch(/^passed with 1 SUGGESTION-grade finding deferred/);
  });
});

// ---- clause (c): substantive new-finding match -----------------------------

describe('rc02c clause (c) — RETIRED: convergence is clauses (a) and (b) ONLY', () => {
  it('a new SUGGESTION never held the gate, and still does not', () => {
    review(T(1), 'proposal', 'fresh', [['SUGGESTION', 'a']]);
    review(T(2), 'proposal', 'in-context');
    review(T(3), 'proposal', 'fresh', [['SUGGESTION', 'brand-new']]);
    expect(gate(PROPOSAL_YAML, 'review-proposal').state).toBe('passed');
  });

  // rc02c: this trail was `unpassed` with reason `new substantive findings`. The INTENT of the old
  // case — "the gate does not falsely converge" — is deliberately retired: a cadence ends when the
  // work is judged ready knowing what the reviewers returned, not when reviewers stop finding
  // things. The behaviour change is pinned here rather than deleted with the case.
  it('a RESOLVED new substantive finding no longer holds the gate', () => {
    review(T(1), 'proposal', 'fresh');
    review(T(2), 'proposal', 'in-context');
    review(T(3), 'proposal', 'fresh', [['WARNING', 'brand-new']]);
    walk(T(4), `review-proposal-${T(3)}.json`, { entries: [ok('WARNING', 'brand-new')] });
    expect(gate(PROPOSAL_YAML, 'review-proposal').state).toBe('passed');
  });

  it('an UNRESOLVED finding still holds it — clause (b) is untouched by the retirement', () => {
    review(T(1), 'proposal', 'fresh');
    review(T(2), 'proposal', 'in-context');
    review(T(3), 'proposal', 'fresh', [['WARNING', 'unwalked']]);
    const g = gate(PROPOSAL_YAML, 'review-proposal');
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/unresolved substantive findings/);
  });

  // rc02c task 1.2: `confirm` stays ACCEPTED and becomes INERT. Two schemas identical but for the
  // confirm value must compute identically on one trail — asserted, never assumed.
  it('`confirm` is INERT: both declared values compute the same state on one trail', () => {
    review(T(1), 'system', 'fresh', [['CRITICAL', 'c']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, { entries: [ok('CRITICAL', 'c')] });
    review(T(4), 'system', 'in-context');
    const resolved = gate(PAIR_YAML);
    const noNew = gate(PAIR_YAML.replace('confirm: findings-resolved', 'confirm: no-new-findings'));
    const absent = gate(PAIR_YAML.replace('    confirm: findings-resolved\n', ''));
    expect(resolved.state).toBe('passed');
    expect(noNew.state).toBe(resolved.state);
    expect(absent.state).toBe(resolved.state);
    expect(noNew.reason).toBe(resolved.reason);
    expect(absent.reason).toBe(resolved.reason);
  });

  // The defect rc02c was chartered on: a blind pair puts TWO independent passes on one state and
  // the retired predicate read only the LATER one, so a CRITICAL in the earlier-finishing member
  // was invisible. With nothing selecting a pass, the case cannot arise.
  it('a blind pair whose EARLIER member carried a CRITICAL converges once resolved', () => {
    review(T(1), 'system', 'fresh', [['CRITICAL', 'early']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, { entries: [ok('CRITICAL', 'early')] });
    review(T(4), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });
});

// ---- clause (a): the blind pair --------------------------------------------

describe('rc02 clause (a) — the blind-pair slot', () => {
  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Blind pair satisfied by two distinct classes with no walk between
  it('a valid pair satisfies, and the trailing in-context covers the cadence', () => {
    review(T(1), 'system', 'fresh');
    external(T(2), 'system');
    review(T(3), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: A walk between the pair breaks blindness
  it('a walk of one member between them breaks blindness, and the reason names the class the command names', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    walk(T(2), `review-system-${T(1)}.json`, { entries: [ok('WARNING', 'w')] });
    external(T(3), 'system');
    review(T(4), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    // The walked fresh pass is no longer PAIRABLE, so diagnosis — which uses the same predicate
    // assignment uses — reports the missing class rather than blaming the walk. The point of the
    // fix is that the reason and the canonical command can never name different classes.
    expect(g.reason).toMatch(/no fresh partner/);
    expect(g.nextCommand).toBe('/orbit:review --as system --fresh x');
  });

  it('the reason and the canonical command always name the same class', () => {
    external(T(1), 'system');
    const g = gate(PAIR_YAML);
    expect(g.reason).toMatch(/no fresh partner/);
    expect(g.nextCommand).toContain('--fresh');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: An unrelated walk does not break the pair
  it('an UNRELATED walk does not break the pair', () => {
    review(T(1), 'system', 'fresh');
    walk(T(2), 'audit-drift-2026-09-14T09-00-00Z.json', { entries: [ok('WARNING', 'other')] });
    external(T(3), 'system');
    review(T(4), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Same class twice does not form a pair
  it('two same-class passes do not form a pair', () => {
    review(T(1), 'system', 'fresh');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'in-context');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.reason).toMatch(/no external partner/);
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x'); // rc08b 5.2: the THEN's canonical next
  });

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: Token ties fail safe
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

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: A following slot must beat the previous slot's resolution records
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

  // @scenario behaviour orbit-engine-gates :: Reviewed-gate pass condition — the computed convergence criterion :: The earliest qualifying pair is taken
  it('a late second external does not foreclose a covered cadence (coverage is existential)', () => {
    external(T(1), 'system');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'in-context');
    external(T(4), 'system'); // arrives after the cadence was already covered
    expect(gate(PAIR_YAML).state).toBe('passed');
  });
});

// ---- the budget ------------------------------------------------------------

describe('rc02c budget — a DECLARED EXPECTATION nothing consults; the RECORD is the spend', () => {
  // rc02c: this trail used to set `budgetExhausted`, carry a `budget spent: 3 of 3` reason clause
  // and render a BUDGET-SPENT token. Effort is RECORDED, never TARGETED (R-crc-11(h)), so the
  // over-budget gate is now indistinguishable from any other unpassed gate except in its figure.
  // @scenario behaviour orbit-engine-gates :: The gate reason names the rule that fired and the rule about to fire :: The reason names the rule, never the spend
  it('a gate OVER its declared budget renders no token and names no spend in its reason', () => {
    review(T(1), 'system', 'fresh', [['CRITICAL', 'c']]);
    walk(T(2), `review-system-${T(1)}.json`, { entries: [ok('CRITICAL', 'c')] });
    review(T(3), 'system', 'fresh');
    review(T(4), 'system', 'fresh');
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.independentSpend).toBe(3);
    expect(g.budget).toBe(3);
    expect(g.reason).not.toMatch(/budget|spent|exhaust/i);
    expect(g.reason).toMatch(/blind pair/); // the rule that actually fired
    const { position } = computeGateStates(parseSchema(PAIR_YAML), 'x', dir, new Set(['proposal', 'tasks']));
    expect(position).toMatch(/review\(system\) unpassed/);
    expect(position).not.toMatch(/BUDGET-SPENT/);
  });

  it('the retired fields are gone from the gate status entirely', () => {
    review(T(1), 'system', 'fresh');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'fresh');
    const g = gate(PAIR_YAML) as Record<string, unknown>;
    expect('budgetExhausted' in g).toBe(false);
    expect('independentSpendFresh' in g).toBe(false);
  });

  // 3.3 — the RECORD survives the deletion. These are exactly what a careless removal takes too.
  it('stale passes count in the recorded spend — spend is spend', () => {
    review(T(1), 'system', 'fresh');
    external(T(2), 'system');
    apply(T(3)); // invalidates both
    review(T(4), 'system', 'fresh');
    expect(gate(PAIR_YAML).independentSpend).toBe(3);
  });

  it('a rejected malformed external counts as spend while satisfying no slot, and the reason names it', () => {
    externalRejected(T(1), 'system');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'fresh');
    const g = gate(PAIR_YAML);
    expect(g.independentSpend).toBe(3);
    expect(g.state).toBe('unpassed'); // the rejected return satisfied nothing
    expect(g.reason).toMatch(/rejected as malformed/);
    expect(g.reason).not.toMatch(/budget|spent/i); // naming a return is not reporting the spend
  });

  // 2.3b / 3.2 — the record no longer hangs off an inert declaration.
  it('a schema with NO budget reports the spend identically to one that declares it', () => {
    const noBudget = PAIR_YAML.replace('    budget: 3\n', '');
    review(T(1), 'system', 'fresh');
    review(T(2), 'system', 'fresh');
    review(T(3), 'system', 'fresh');
    const declared = gate(PAIR_YAML);
    const undeclared = gate(noBudget);
    expect(undeclared.independentSpend).toBe(declared.independentSpend);
    expect(undeclared.state).toBe(declared.state);
    expect(undeclared.reason).toBe(declared.reason);
    // `budget` is present ONLY when declared — never an undefined-valued key.
    expect(declared.budget).toBe(3);
    expect('budget' in (undeclared as Record<string, unknown>)).toBe(false);
  });
});

// ---- schema validation -----------------------------------------------------

describe('rc02 schema validation names the gate id', () => {
  // @scenario behaviour orbit-engine-gates :: Gate declaration in schema YAML :: Non-positive budget rejected
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

describe('rc02c spend fields reach BOTH gate-row projections', () => {
  it('the JSON gate row carries the declaration and the record — and neither retired field', async () => {
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
    expect(row.budget).toBe(3); // the shipped spec-driven v4 declaration, inert but readable
    expect(row.independentSpend).toBe(1);
    const asRec = row as unknown as Record<string, unknown>;
    expect('independentSpendFresh' in asRec).toBe(false);
    expect('budgetExhausted' in asRec).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('the human gate row renders the record ALONE — never a ratio, never a derived label', () => {
    const src = fs.readFileSync('src/commands/workflow/status.ts', 'utf-8');
    // The field still reaches the terminal row...
    expect(src).toMatch(/independentSpend/);
    // ...but nothing composes it with the declaration. `[spend 4/3]` is the readout Q-crc-19
    // named as the harm: a ratio is a verdict wearing a figure's clothes.
    expect(src).not.toMatch(/independentSpendFresh/);
    expect(src).not.toMatch(/BUDGET-SPENT/);
    expect(src).not.toMatch(/budgetExhausted/);
    expect(src).not.toMatch(/\$\{g\.independentSpend[^}]*\}\/\$\{g\.budget\}/);
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

describe('spec-driven v5 (rc17a; was v4 at rc02)', () => {
  // @scenario behaviour orbit-engine-gates :: spec-driven v1 gates and cadence :: v5 declares the invoked slot on both gates
  it('declares the invoked slot on both gates, and both budgets', () => {
    const yaml = fs.readFileSync('schemas/spec-driven/schema.yaml', 'utf-8');
    const schema = parseSchema(yaml);
    expect(schema.version).toBe(5);
    const sys = schema.gates!.find(g => g.id === 'review-system')!;
    const prop = schema.gates!.find(g => g.id === 'review-proposal')!;
    expect(sys.cadence).toEqual(['invoked', 'in-context']);
    expect(sys.budget).toBe(3);
    expect(prop.cadence).toEqual(['invoked', 'in-context']);
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

// ---- the first blind pair's own findings (rc02 walk 7) ---------------------

describe('rc02 walk 7 — what the first blind pair found', () => {
  it('an OPEN PAIR outranks the walk recommendation, so the engine never suggests foreclosing it', () => {
    // The fresh half's CRITICAL, reproduced: one pair member lands carrying a WARNING. Before the
    // fix the gate said "go walk it", and obeying that writes a record between the members.
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    const g = gate(PAIR_YAML);
    expect(g.state).toBe('unpassed');
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
    expect(g.reason).toMatch(/blind pair is OPEN/);
    expect(g.reason).toMatch(/BEFORE walking these findings/);
  });

  it('a partial resolution record does NOT certify the findings it omits', () => {
    // The external half's CRITICAL: a record naming one of two WARNINGs resolved both, because no
    // entry it contained carried a blocking disposition.
    review(T(1), 'system', 'fresh', [['WARNING', 'a'], ['WARNING', 'b']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, { entries: [ok('WARNING', 'a')] }); // omits 'b'
    review(T(4), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('the same trail with BOTH findings named converges', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'a'], ['WARNING', 'b']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, { entries: [ok('WARNING', 'a'), ok('WARNING', 'b')] });
    review(T(4), 'system', 'in-context');
    expect(gate(PAIR_YAML).state).toBe('passed');
  });

  it('a present-but-null `outcome` does NOT revive the legacy `status` key', () => {
    // The external half's CRITICAL: presence must be tested with `in`, not string-ness.
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    external(T(2), 'system');
    walk(T(3), `review-system-${T(1)}.json`, {
      entries: [{ severity: 'WARNING', title: 'w', file: 'f/w.ts', outcome: null, status: 'resolved' }],
      summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 },
    });
    expect(gate(PAIR_YAML).state).toBe('unpassed');
  });

  it('an external document whose severity headings sit inside a FENCE is rejected, not counted', () => {
    // The external half's CRITICAL: the prompt template itself would otherwise parse as a pass.
    fs.writeFileSync(
      path.join(runs, `external-system-${T(1)}.md`),
      '# External Review: x\n\n**Reviewer**: M\n\nExample of the shape:\n\n```markdown\n## CRITICAL\n## WARNING\n## SUGGESTION\n```\n\nNothing real.\n'
    );
    const t = readTrail(dir);
    expect(t.passes).toHaveLength(0);
    expect(t.rejectedExternals).toHaveLength(1);
  });

  it('a document missing the `**Reviewer**:` field is rejected', () => {
    fs.writeFileSync(
      path.join(runs, `external-system-${T(1)}.md`),
      '# External Review: x\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
    );
    expect(readTrail(dir).rejectedExternals).toHaveLength(1);
  });

  it('a mode-less reviewed gate reports NO SPEND rather than a cross-mode one, and keeps its declaration', () => {
    const yaml = PAIR_YAML.replace('- id: review-system', '- id: peer-check').replace(
      'cadence: [blind-pair, in-context]',
      'cadence: [independent]'
    );
    review(T(1), 'proposal', 'fresh');
    review(T(2), 'system', 'fresh');
    const g = gate(yaml, 'peer-check') as unknown as Record<string, unknown>;
    // rc02c: the LIVE invariant is mode attribution — a gate whose mode cannot be derived from its
    // id reports NO SPEND, rather than one summed across every mode's passes. Asserted
    // structurally, because vitest does not type-check and `g.budgetExhausted` (the old assertion)
    // read a property that no longer exists on GateStatus — green while covering nothing.
    expect('independentSpend' in g).toBe(false);
    expect('budgetExhausted' in g).toBe(false);
    // rc02c walk (system pair): the DECLARATION survives mode-underivability. It is schema text;
    // only the spend is mode-attributed. The two are gated separately, by design.
    expect(g.budget).toBe(3);
  });

  // rc02c (external system pass, iter 1): the no-undefined-key rule must hold at the PROJECTION
  // layer too. computeGateStates honoured it while formatChangeStatus reconstructed every row
  // unconditionally, putting `budget: undefined` back on the public object — invisible to JSON,
  // visible to an in-process consumer testing key presence.
  it('the public status row omits an undeclared budget as a KEY, not merely as a JSON value', async () => {
    const { loadChangeContext, formatChangeStatus } = await import(
      '../../../src/core/artifact-graph/instruction-loader.js'
    );
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc02c-proj-'));
    const cd = path.join(root, 'orbit', 'changes', 'c');
    fs.mkdirSync(path.join(cd, 'specs'), { recursive: true });
    fs.mkdirSync(path.join(cd, '.orbit-runs'), { recursive: true });
    for (const f of ['proposal.md', 'design.md']) fs.writeFileSync(path.join(cd, f), '# x');
    fs.writeFileSync(path.join(cd, 'specs', 's.md'), '# s');
    fs.writeFileSync(path.join(cd, 'tasks.md'), '- [ ] one\n');
    const status = formatChangeStatus(loadChangeContext(root, 'c'));
    const applyRow = status.gates.find(g => g.id === 'apply')! as unknown as Record<string, unknown>;
    // A TRACKED gate declares no budget and computes no spend: neither key may be present.
    expect('budget' in applyRow).toBe(false);
    expect('independentSpend' in applyRow).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
  });

  // rc02c: there is no ceiling left for the naming to be "below" — it is unconditional, which is
  // what the case was reaching for. Naming a rejected return names the RULE THAT FIRED (a return
  // arrived and could not be read), never the spend, so it survives the NEVER-the-spend rule.
  it('a rejected return is named in the reason unconditionally', () => {
    externalRejected(T(1), 'system');
    review(T(2), 'system', 'fresh');
    const g = gate(PAIR_YAML);
    expect(g.reason).toMatch(/rejected as malformed/);
    expect(g.reason).not.toMatch(/budget|spent/i);
  });

  // rc02c (external system pass, iter 2): the hoist was applied in TWO branches and only the live
  // one was covered — the blocked test below uses `review-system`, whose mode IS derivable, so the
  // mode-less blocked path never executed. A regression there would have stayed green.
  it('a BLOCKED and MODE-LESS reviewed gate keeps its declaration and still reports no spend', () => {
    fs.writeFileSync(path.join(dir, 'tasks.md'), '- [ ] one\n'); // apply cannot pass
    const yaml = PAIR_YAML.replace('- id: review-system', '- id: peer-check').replace(
      'cadence: [blind-pair, in-context]',
      'cadence: [independent]'
    );
    review(T(1), 'system', 'fresh');
    const g = gate(yaml, 'peer-check') as unknown as Record<string, unknown>;
    expect(g.state).toBe('blocked');
    expect(g.budget).toBe(3); // the declaration survives mode-underivability AND blocking
    expect('independentSpend' in g).toBe(false); // the spend does not
  });

  it('a BLOCKED reviewed gate still carries its declaration and its record', () => {
    fs.writeFileSync(path.join(dir, 'tasks.md'), '- [ ] one\n'); // apply cannot pass
    const schema: SchemaYaml = parseSchema(PAIR_YAML);
    const g = computeGateStates(schema, 'x', dir, new Set(['proposal', 'tasks'])).gates.find(
      x => x.id === 'review-system'
    )!;
    expect(g.state).toBe('blocked');
    expect(g.budget).toBe(3);
    expect('budgetExhausted' in (g as Record<string, unknown>)).toBe(false);
  });

  it('the cadence search does not blow up on a long cadence (memoized failures)', () => {
    const slots = Array(10).fill('independent').concat(['external']).join(', ');
    const yaml = PAIR_YAML.replace('cadence: [blind-pair, in-context]', `cadence: [${slots}]`);
    for (let i = 1; i <= 20; i++) review(T(i), 'system', 'fresh');
    const t0 = Date.now();
    expect(gate(yaml).state).toBe('unpassed'); // no external ever arrives
    expect(Date.now() - t0).toBeLessThan(1500);
  });
});

// ---- walk 9: what the stop rule's extra pass found -------------------------

describe('rc02 walk 9 — the pass the stop rule bought', () => {
  it('a FOUR-backtick fence is not closed by a three-backtick line (shared CommonMark tracker)', () => {
    fs.writeFileSync(
      path.join(runs, `external-system-${T(1)}.md`),
      '# External Review: x\n\n**Reviewer**: M\n\n````markdown\n```\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n````\n\nNothing real.\n'
    );
    const t = readTrail(dir);
    expect(t.passes).toHaveLength(0);
    expect(t.rejectedExternals).toHaveLength(1);
  });

  it('a finding missing the ingestion triple is rejected, not counted', () => {
    fs.writeFileSync(
      path.join(runs, `external-system-${T(1)}.md`),
      '# External Review: x\n\n**Reviewer**: M\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\n### Truncated warning\n\n## SUGGESTION\n\nNone.\n'
    );
    expect(readTrail(dir).rejectedExternals).toHaveLength(1);
  });

  it('a BLOCKED reviewed gate reports the spend already on the trail, not zero', () => {
    fs.writeFileSync(path.join(dir, 'tasks.md'), '- [ ] one\n'); // apply cannot pass
    review(T(1), 'system', 'fresh');
    external(T(2), 'system');
    const schema: SchemaYaml = parseSchema(PAIR_YAML);
    const g = computeGateStates(schema, 'x', dir, new Set(['proposal', 'tasks'])).gates.find(
      x => x.id === 'review-system'
    )!;
    expect(g.state).toBe('blocked');
    expect(g.independentSpend).toBe(2); // blocking is not an exemption from counting
  });

  it('with NOTHING pairable standing, a safe outstanding walk is not deferred behind a review', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    apply(T(2)); // the pass goes stale; no pairable member stands on the current state
    const g = gate(PAIR_YAML);
    expect(g.reason ?? '').not.toMatch(/blind pair is OPEN/);
    expect(g.nextCommand).toContain('/orbit:address-reviews');
  });

  it('a pairable member standing DOES still defer the walk', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    const g = gate(PAIR_YAML);
    expect(g.reason).toMatch(/blind pair is OPEN/);
    expect(g.nextCommand).toBe('/orbit:review --as system --reviewer external x');
  });

  it('the canonical findings path survives an ancestor directory named `orbit`', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-'));
    const nested = path.join(root, 'orbit', 'orbit');
    const cd = path.join(nested, 'changes', 'c');
    fs.mkdirSync(path.join(cd, '.orbit-runs'), { recursive: true });
    fs.writeFileSync(path.join(cd, 'proposal.md'), '# p');
    fs.writeFileSync(path.join(cd, 'tasks.md'), '- [x] one\n');
    fs.writeFileSync(
      path.join(cd, '.orbit-runs', `review-system-${T(1)}.json`),
      JSON.stringify({
        command: 'review',
        mode: 'system',
        reviewer_class: 'fresh',
        findings: [{ severity: 'WARNING', title: 'w', file: 'f.ts' }],
      })
    );
    // A cadence WITHOUT a blind pair, so the unresolved pass is the recommendation and the
    // findings PATH is what gets rendered.
    const noPair = PAIR_YAML.replace('cadence: [blind-pair, in-context]', 'cadence: [independent]');
    const schema: SchemaYaml = parseSchema(noPair);
    const g = computeGateStates(schema, 'c', cd, new Set(['proposal', 'tasks'])).gates.find(
      x => x.id === 'review-system'
    )!;
    // The emitted path must be relative to the PROJECT root, not to the first `/orbit/` segment
    // anywhere in the absolute path — which here would have produced `orbit/orbit/changes/...`.
    // rc08b (task 1.5, recorded act): the walk next names no file, so the path is now asserted where
    // the engine renders it — the gate's `unresolvedPasses` list.
    expect(g.nextCommand).toBe('/orbit:address-reviews c');
    const file = g.unresolvedPasses![0].file;
    expect(file).toBe(`orbit/changes/c/.orbit-runs/review-system-${T(1)}.json`);
    expect(file).not.toContain('orbit/orbit/changes');
    fs.rmSync(root, { recursive: true, force: true });
  });
});
