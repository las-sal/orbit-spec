/**
 * rc05 design D8: no generated surface carries a backslash immediately before a
 * backtick (the check lives in test/helpers/surface-snippets.ts, with its
 * exceptions — none).
 */
import { describe, expect, it } from 'vitest';
import { escapedBacktickFailures, generatedSurfaces } from '../../helpers/surface-snippets.js';

describe('escaped backticks', () => {
  it('no generated surface carries a backslash immediately before a backtick', () => {
    expect(escapedBacktickFailures(generatedSurfaces())).toEqual([]);
  });
});
