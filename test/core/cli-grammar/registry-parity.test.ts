/**
 * rc05 design D5: `COMMAND_REGISTRY` is held to the builder's program both ways
 * (the comparison lives in test/helpers/registry-parity.ts).
 */
import { describe, expect, it } from 'vitest';
import { buildProgram } from '../../../src/cli/program.js';
import { COMMAND_REGISTRY } from '../../../src/core/completions/command-registry.js';
import { fromProgram, fromRegistry, registryDiff, rootFlags } from '../../helpers/registry-parity.js';

describe('the completion registry is a checked copy of the program', () => {
  it('the registry and the builder\'s program agree both ways', () => {
    const program = buildProgram({ hooks: false });
    expect(registryDiff(fromProgram(program), fromRegistry(COMMAND_REGISTRY))).toEqual([]);
  });

  it('the root declares no option beyond the named exclusions', () => {
    expect(rootFlags(buildProgram({ hooks: false }))).toEqual([]);
  });
});
