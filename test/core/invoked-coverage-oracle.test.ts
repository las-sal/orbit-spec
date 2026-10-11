import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateReviewedGate } from '../../src/core/artifact-graph/gates.js';
import { CADENCE_ENTRIES } from '../../src/core/artifact-graph/types.js';
import { buildTrail, cadences, gateOf, runOracleShard, trails, ORACLE_TRAIL_COUNT } from '../helpers/invoked-oracle.js';

/**
 * rc17a-invoked-coverage, exit (1) — the EXHAUSTIVE ORACLE of design D9. The reference, the event
 * alphabet and the two properties are stated in `test/helpers/invoked-oracle.ts`, whose header is the
 * oracle's contract.
 *
 * STATED SIZE: every cadence of length 1 to 3 over the six cadence tokens (258 cadences) × every trail of
 * 1 to 5 events (81,426 trails, the launch tie `U` added at the system walk) = 21,007,908 cases, run as SIX shards (this file and the five
 * `invoked-coverage-oracle.shard-<token>.test.ts` siblings), one per cadence-initial token, so they spread
 * across test workers. The shard set is asserted complete below.
 */
const here = path.dirname(fileURLToPath(import.meta.url));

describe('rc17a exit (1) — the exhaustive invoked-coverage oracle', () => {
  it('the stated size: six tokens, 258 cadences, 81,426 trails, and one shard per cadence-initial token', () => {
    expect([...CADENCE_ENTRIES]).toEqual(['in-context', 'fresh', 'external', 'independent', 'blind-pair', 'invoked']);
    expect(cadences()).toHaveLength(258);
    let n = 0;
    for (const _ of trails()) n++;
    expect(n).toBe(ORACLE_TRAIL_COUNT);
    const shards = fs
      .readdirSync(here)
      .map(f => f.match(/^invoked-coverage-oracle\.shard-(.+)\.test\.ts$/)?.[1])
      .filter((t): t is string => !!t);
    // This file runs the `in-context` shard; the siblings run the other five.
    expect(['in-context', ...shards].sort()).toEqual([...CADENCE_ENTRIES].sort());
  });

  // @scenario behaviour orbit-engine-gates :: The first review slot covers what the user invoked :: An invoked pair with one half landed does not cover
  it('shard in-context: engine coverage and openPair equal the reference, and openPair is repairable', () => {
    const r = runOracleShard('in-context');
    expect(r.failures).toEqual([]);
    expect(r.cases).toBe(43 * ORACLE_TRAIL_COUNT);
  }, 300_000);

  // @scenario behaviour orbit-engine-gates :: Single-voiced canonical-next computation :: A pair excluded by an earlier slot reports its missing class
  it("rc08b's reproduction: [external, blind-pair], a clean external consumed by slot 0 and an unwalked fresh WARNING", () => {
    const trail = buildTrail(['E', 'F']);
    const f = trail.passes.find(p => p.reviewerClass === 'fresh')!;
    f.warning = 1;
    f.findings = [{ title: 'w', file: 'a.ts', severity: 'WARNING' }];
    const status = evaluateReviewedGate(gateOf(['external', 'blind-pair']), 'x', trail);
    expect(status.openPair).toEqual({ missing: 'external' });
    expect(status.nextCommand).toBe('/orbit:review --as system --reviewer external x');
    expect(status.nextCommand).not.toMatch(/address-reviews/);
  });
});
