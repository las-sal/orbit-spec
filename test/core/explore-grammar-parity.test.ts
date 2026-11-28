import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPLORE_STATUS_HEADER_PRODUCTION,
  EXPLORE_DECISION_ENTRY_PRODUCTION,
  EXPLORE_MECHANISM_ENTRY_PRODUCTION,
  STATUS_HEADER,
  KIND_SLOT,
} from '../../src/core/explore-grammar.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';
import { getExploreSkillTemplate } from '../../src/core/templates/workflows/explore.js';

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
    // @scenario text orbit-emit-composition :: The explore grammar has one source in code :: Module and spec agree
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

  // @scenario text orbit-emit-composition :: The explore grammar has one source in code :: Each production is interpolated where the skill carries it
  it('each production is carried once where the skill carries it: two in the body, the Mechanism entry in mechanism-entries.md', () => {
    const t = getExploreSkillTemplate();
    const ref = t.references!.find((r) => r.name === 'mechanism-entries.md')!.content;
    const count = (hay: string, needle: string) => hay.split(needle).length - 1;
    expect(count(t.instructions, EXPLORE_STATUS_HEADER_PRODUCTION)).toBe(1);
    expect(count(t.instructions, EXPLORE_DECISION_ENTRY_PRODUCTION)).toBe(1);
    expect(count(t.instructions, EXPLORE_MECHANISM_ENTRY_PRODUCTION)).toBe(0);
    expect(count(ref, EXPLORE_MECHANISM_ENTRY_PRODUCTION)).toBe(1);
    expect(count(ref, EXPLORE_STATUS_HEADER_PRODUCTION)).toBe(0);
  });

  // @scenario text orbit-emit-composition :: The explore grammar has one source in code :: Body interpolation changes no byte
  it('each fenced mirror the explore skill renders is byte-identical to the module string it interpolates', () => {
    const t = getExploreSkillTemplate();
    const ref = t.references!.find((r) => r.name === 'mechanism-entries.md')!.content;
    const fenced = (text: string, value: string) => text.includes('```\n' + value + '\n```');
    expect(fenced(t.instructions, EXPLORE_STATUS_HEADER_PRODUCTION)).toBe(true);
    expect(fenced(t.instructions, EXPLORE_DECISION_ENTRY_PRODUCTION)).toBe(true);
    expect(fenced(ref, EXPLORE_MECHANISM_ENTRY_PRODUCTION)).toBe(true);
    // The template interpolates the strings rather than restating them, so no hash pin moves with interpolation alone.
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'core', 'templates', 'workflows', 'explore.ts'), 'utf-8');
    for (const n of ['EXPLORE_STATUS_HEADER_PRODUCTION', 'EXPLORE_DECISION_ENTRY_PRODUCTION', 'EXPLORE_MECHANISM_ENTRY_PRODUCTION']) {
      expect(src.split('${' + n + '}').length - 1, n).toBe(1);
    }
  });

  // @scenario text orbit-emit-composition :: The explore grammar has one source in code :: The parse and the surface test share one regex
  it('the form parse and the generated-surface test both import the module\'s Closure: expression; neither restates it', () => {
    const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    for (const f of ['src/core/parsers/explore-rules.ts', 'test/core/templates/orbit-generated-surface.test.ts']) {
      const text = fs.readFileSync(path.join(repo, f), 'utf-8');
      expect(text, f).toMatch(/CLOSURE_LINE[\s\S]*from '[./]+(?:src\/core\/)?explore-grammar\.js'/);
      expect(text, f).not.toContain('DERIVED|SOURCED|BOUNDED');
    }
  });

  it('the derived Kind: expression is the fenced one', () => {
    expect(KIND_SLOT.source).toBe('^\\s*(?:[-*+]\\s+)?Kind:\\s*(rule|fact|scope)\\s*$');
    expect('  Kind: rule'.match(KIND_SLOT)?.[1]).toBe('rule');
    expect('  - Kind: scope'.match(KIND_SLOT)?.[1]).toBe('scope');
    expect(KIND_SLOT.test('  Kind: banana')).toBe(false);
  });
});
