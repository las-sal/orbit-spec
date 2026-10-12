/**
 * docs-under-test task 3.1/3.3 (design D5): the docs sweeps' floor guard — `orbit-user-docs`' `The
 * docs sweeps carry non-vacuity floors once the pending list is empty`. Each sweep suite wires its
 * own floor into this guard; here the guard is shown able to fail.
 */
import { describe, expect, it } from 'vitest';
import { docsFloorFailures } from '../../helpers/user-docs.js';

describe('the docs floor guard', () => {
  // @scenario behaviour orbit-user-docs :: The docs sweeps carry non-vacuity floors once the pending list is empty :: A floor is inactive while files are listed
  it('asserts nothing while any file is listed, whatever the floors', () => {
    expect(docsFloorFailures(['docs/cli.md'], [{ sweep: 'orbit', floor: null, count: 0 }, { sweep: 'git', floor: 5, count: 0 }])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The docs sweeps carry non-vacuity floors once the pending list is empty :: Emptying the list without setting the floors fails
  it('fails an empty list with a floor unset, naming the sweep', () => {
    expect(docsFloorFailures([], [{ sweep: 'gh', floor: null, count: 3 }])).toEqual([
      "the gh sweep's user-docs floor is unset; set it in the edit that empties the pending-rewrite list",
    ]);
  });

  // @scenario behaviour orbit-user-docs :: The docs sweeps carry non-vacuity floors once the pending list is empty :: A vacuous sweep fails once the list is empty
  it('fails an empty list with a count below its floor, naming the sweep, its count and its floor', () => {
    expect(docsFloorFailures([], [{ sweep: 'orbit', floor: 10, count: 0 }])).toEqual([
      'the orbit sweep read 0 snippets in the user docs, below its floor 10',
    ]);
  });

  it.each([[0], [-1], [Number.NaN], [1.5], [Number.POSITIVE_INFINITY]])('fails an empty list with a floor of %s: an active floor is a positive integer', (floor) => {
    expect(docsFloorFailures([], [{ sweep: 'git', floor, count: 0 }])).toEqual([
      `the git sweep's user-docs floor ${floor} is not a positive integer`,
    ]);
  });

  it('passes an empty list whose every floor is set and met', () => {
    expect(docsFloorFailures([], [{ sweep: 'orbit', floor: 10, count: 10 }, { sweep: 'git', floor: 1, count: 4 }])).toEqual([]);
  });
});
