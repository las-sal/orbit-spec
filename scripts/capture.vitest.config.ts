import { defineConfig } from 'vitest/config';

/**
 * The `git` contract capture's own config (rc05b design D4): it collects the capture file
 * only, so `npm run capture:git` runs it and a plain `npm test` (whose include is
 * `test/**\/*.test.ts`) never does.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/capture-git-contract.capture.ts'],
    testTimeout: 300_000,
  },
});
