import { describe, it, expect } from 'vitest';
import {
  EXPLORE_STATUS_HEADER_PRODUCTION,
  EXPLORE_DECISION_ENTRY_PRODUCTION,
  EXPLORE_MECHANISM_ENTRY_PRODUCTION,
  STATUS_HEADER,
  KIND_SLOT,
} from '../../src/core/explore-grammar.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc13b (D-rc13b-5; `orbit-emit-composition` "The explore grammar has one source in code"): the
 * spec OWNS the three productions; the grammar module carries them in code. This test is the ONE
 * seam between them — the module's strings must equal the owning text's fenced productions, read
 * through the single-active-owner lookup (an active delta holding the block, else the baseline)
 * so parity stays enforceable while a later change is mid-flight on a production.
 */
describe('explore grammar module ↔ spec parity', () => {
  const PRODUCTIONS: Array<[name: string, firstLine: string, value: string]> = [
    ['status header', '^> \\*\\*Status', EXPLORE_STATUS_HEADER_PRODUCTION],
    ['Decision entry', '- **<YYYY-MM-DD> — <ID>: <title>**', EXPLORE_DECISION_ENTRY_PRODUCTION],
    ['Mechanism entry', '## Mechanism\n', EXPLORE_MECHANISM_ENTRY_PRODUCTION],
  ];

  for (const [name, firstLine, value] of PRODUCTIONS) {
    it(`the ${name} production equals the owning spec's fence`, async () => {
      const owner = await ownerText('orbit-conventions', '```\n' + firstLine);
      const fenced = fencedProduction(owner, firstLine);
      expect(value, `${name} production diverged from its owner`).toBe(fenced);
    });
  }

  it('the derived expressions execute: the status header accepts both tokens and captures the date', () => {
    expect(STATUS_HEADER.test('> **Status**: exploring.')).toBe(true);
    expect(STATUS_HEADER.test('> **Status**: exploring. Promoted via /orbit:propose when ready.')).toBe(true);
    const m = '> **Status**: concluded 2026-09-25.'.match(STATUS_HEADER);
    expect(m?.[3]).toBe('2026-09-25');
    expect(STATUS_HEADER.test('> **Status**: exploring')).toBe(false);
    expect(STATUS_HEADER.test('> **Status**: concluded 2026-09-25')).toBe(false);
  });

  it('the derived Kind: expression is the fenced one', () => {
    expect(KIND_SLOT.source).toBe('^\\s*(?:[-*+]\\s+)?Kind:\\s*(rule|fact|scope)\\s*$');
    expect('  Kind: rule'.match(KIND_SLOT)?.[1]).toBe('rule');
    expect('  - Kind: scope'.match(KIND_SLOT)?.[1]).toBe('scope');
    expect(KIND_SLOT.test('  Kind: banana')).toBe(false);
  });
});
