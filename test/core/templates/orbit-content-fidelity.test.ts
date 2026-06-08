import { describe, expect, it } from 'vitest';

import {
  getExploreSkillTemplate,
  getOrbitExploreCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

/**
 * Fidelity guard for B1 (relocate-modified-upstream-workflows): asserts that the
 * orbit editorial layer was actually relocated into the source template modules,
 * mechanism-neutral and orbit-named. Semantic (not hash) assertions so a future
 * edit that silently drops orbit content fails loudly. One block per relocated
 * workflow; grows as B1 rolls out the remaining 10.
 */
describe('orbit content fidelity (B1 relocation)', () => {
  describe('explore', () => {
    const skill = getExploreSkillTemplate().instructions;
    const command = getOrbitExploreCommandTemplate().content;

    it('skill carries upstream stance + the orbit additions', () => {
      // upstream layer preserved
      expect(skill).toContain('This is a stance, not a workflow');
      // orbit editorial layer relocated
      expect(skill).toContain('# Orbit additions');
      expect(skill).toContain('Three execution disciplines');
      expect(skill).toContain('Three invocation modes');
      expect(skill).toContain('Five capture types');
      expect(skill).toContain('five-section convention');
      expect(skill).toContain('Run-summary emit');
    });

    it('skill is orbit-named and mechanism-neutral (no openspec/opsx residue)', () => {
      expect(skill).toContain('/orbit:explore');
      expect(skill).toContain('orbit/explore/<name>/explore.md');
      expect(skill).not.toContain('/opsx:');
      expect(skill).not.toContain('openspec/explore');
      // stale overlay issue refs must be gone
      expect(skill).not.toContain('openspec-orbit#');
    });

    it('command carries the orbit-additions summary, pointing at the skill neutrally', () => {
      expect(command).toContain('Orbit additions (summary)');
      expect(command).toContain('Three invocation modes');
      expect(command).toContain('the `orbit-explore` skill');
      expect(command).not.toContain('.claude/skills/');
      expect(command).not.toContain('/opsx:');
    });
  });
});
