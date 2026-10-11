import { describe, it, expect } from 'vitest';
import { runOracleShard, ORACLE_TRAIL_COUNT } from '../helpers/invoked-oracle.js';

/** rc17a exit (1): the `blind-pair` shard of the exhaustive oracle (see `invoked-coverage-oracle.test.ts`). */
describe('rc17a exit (1) — oracle shard blind-pair', () => {
  it('engine coverage and openPair equal the reference on every cadence opening with blind-pair, and openPair is repairable', () => {
    const r = runOracleShard('blind-pair');
    expect(r.failures).toEqual([]);
    expect(r.cases).toBe(43 * ORACLE_TRAIL_COUNT);
    expect(r.withOpenPair).toBeGreaterThan(0);
  }, 300_000);
});
