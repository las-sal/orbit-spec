import { describe, it, expect } from 'vitest';
import { runOracleShard, ORACLE_TRAIL_COUNT } from '../helpers/invoked-oracle.js';

/** rc17a exit (1): the `external` shard of the exhaustive oracle (see `invoked-coverage-oracle.test.ts`). */
describe('rc17a exit (1) — oracle shard external', () => {
  it('engine coverage and openPair equal the reference on every cadence opening with external, and openPair is repairable', () => {
    const r = runOracleShard('external');
    expect(r.failures).toEqual([]);
    expect(r.cases).toBe(43 * ORACLE_TRAIL_COUNT);
  }, 300_000);
});
