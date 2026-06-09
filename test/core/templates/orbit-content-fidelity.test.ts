import { describe, expect, it } from 'vitest';

import {
  getExploreSkillTemplate,
  getOrbitExploreCommandTemplate,
  getOrbitProposeSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getOnboardSkillTemplate,
  type SkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

/**
 * Fidelity guard for B1 (relocate-modified-upstream-workflows): asserts orbit's
 * editorial layer was relocated into the source modules, orbit-named and
 * mechanism-neutral. Semantic (not hash) assertions so a future edit that
 * silently drops orbit content, reintroduces the /opsx: namespace, or points at
 * the old openspec/ working dir fails loudly.
 *
 * sync-specs is intentionally absent: orbit never modified it (a no-op for B1).
 */
const RELOCATED: Array<[string, () => SkillTemplate]> = [
  ['explore', getExploreSkillTemplate],
  ['propose', getOrbitProposeSkillTemplate],
  ['new-change', getNewChangeSkillTemplate],
  ['continue-change', getContinueChangeSkillTemplate],
  ['apply-change', getApplyChangeSkillTemplate],
  ['ff-change', getFfChangeSkillTemplate],
  ['bulk-archive-change', getBulkArchiveChangeSkillTemplate],
  ['verify-change', getVerifyChangeSkillTemplate],
  ['archive-change', getArchiveChangeSkillTemplate],
  ['onboard', getOnboardSkillTemplate],
];

describe('orbit content fidelity (B1 relocation)', () => {
  describe.each(RELOCATED)('%s', (_name, getTemplate) => {
    const skill = getTemplate().instructions;

    it('carries the orbit editorial layer', () => {
      expect(skill).toMatch(/# Orbit additions|execution disciplines|Run-summary|Consume-mode|NEW Step/);
    });

    it('is orbit-named + mechanism-neutral (no opsx / openspec working-dir / stale issue refs)', () => {
      expect(skill).not.toContain('/opsx:');
      expect(skill).not.toMatch(/openspec\/(changes|specs|explore|lenses)/);
      expect(skill).not.toContain('openspec-orbit#');
    });
  });

  it('onboard reflects the self-contained fork, not the dead overlay model', () => {
    const skill = getOnboardSkillTemplate().instructions;
    // new orbit-spec framing present
    expect(skill).toContain('self-contained');
    // overlay-model residue gone
    expect(skill).not.toMatch(/orbit's overlay|Overlay orbit|Setup verification/);
    expect(skill).not.toContain('rm -rf .claude/skills/feedback');
    expect(skill).not.toMatch(/MUST equal `?\d+/);
    expect(skill).not.toContain('.claude/skills/');
  });

  it('explore command carries the orbit-additions summary, mechanism-neutral', () => {
    const command = getOrbitExploreCommandTemplate().content;
    expect(command).toContain('Orbit additions (summary)');
    expect(command).toContain('the `orbit-explore` skill');
    expect(command).not.toContain('.claude/skills/');
    expect(command).not.toContain('/opsx:');
  });
});
