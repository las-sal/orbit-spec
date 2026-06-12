import { describe, expect, it } from 'vitest';

import {
  getExploreSkillTemplate,
  getOrbitExploreCommandTemplate,
  getOrbitProposeSkillTemplate,
  getOrbitProposeCommandTemplate,
  getOrbitNewCommandTemplate,
  getOrbitContinueCommandTemplate,
  getOrbitApplyCommandTemplate,
  getOrbitFfCommandTemplate,
  getOrbitSyncCommandTemplate,
  getOrbitArchiveCommandTemplate,
  getOrbitBulkArchiveCommandTemplate,
  getOrbitVerifyCommandTemplate,
  getOrbitOnboardCommandTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getOnboardSkillTemplate,
  getReviewSkillTemplate,
  getOrbitReviewCommandTemplate,
  getReviewExternalSkillTemplate,
  getOrbitReviewExternalCommandTemplate,
  getAddressReviewsSkillTemplate,
  getOrbitAddressReviewsCommandTemplate,
  getAuditDriftSkillTemplate,
  getOrbitAuditDriftCommandTemplate,
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
// Per-workflow REQUIRED markers (every listed marker must appear in the skill body).
// A workflow that silently loses its disciplines block, run-summary section, or
// completion-prompt override fails its own assertion — no disjunctive escape hatch.
const RELOCATED: Array<[string, () => SkillTemplate, string[]]> = [
  ['explore', getExploreSkillTemplate, ['execution disciplines', 'Run-summary emit']],
  ['propose', getOrbitProposeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['new-change', getNewChangeSkillTemplate, ['execution disciplines', 'Run-summary emit']],
  ['continue-change', getContinueChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['apply-change', getApplyChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['ff-change', getFfChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['bulk-archive-change', getBulkArchiveChangeSkillTemplate, ['# Orbit additions']],
  ['verify-change', getVerifyChangeSkillTemplate, ['execution disciplines', 'Run-summary emit']],
  ['archive-change', getArchiveChangeSkillTemplate, ['execution disciplines', 'run summary']],
  ['onboard', getOnboardSkillTemplate, ['execution disciplines', 'self-contained']],
  // B3 editorial workflows (net-new relocation; parity proof per D-b3-4)
  ['review', getReviewSkillTemplate, ['execution disciplines', 'convergence states', 'Persist the run summary', 'recommendation_options']],
  ['review-external', getReviewExternalSkillTemplate, ['execution disciplines', 'Run-summary emit (T0', 'awaiting_findings']],
  ['address-reviews', getAddressReviewsSkillTemplate, ['execution disciplines', 'Ripple cascade', 'Decision-fork detection', 'resolution log']],
  ['audit-drift', getAuditDriftSkillTemplate, ['execution disciplines', 'Vocabulary residue', 'Persist the run summary', 'recommendation_options']],
];

// dirName -> exact reference declarations for the B3 multi-file editorial skills
const B3_REFERENCES: Array<[string, () => SkillTemplate, string[]]> = [
  ['review', getReviewSkillTemplate, ['run-summary-schema.md']],
  ['review-external', getReviewExternalSkillTemplate, ['mode-sections.md', 'prompt-template.md']],
  ['address-reviews', getAddressReviewsSkillTemplate, ['external-findings-format.md', 'internal-findings-format.md', 'run-summary-schema.md']],
  ['audit-drift', getAuditDriftSkillTemplate, ['run-summary-schema.md']],
];

// Every generated /orbit:* command is a thin launcher delegating to its skill —
// the skill is the single source of workflow behavior (external-review CRITICAL fix).
const LAUNCHERS: Array<[string, () => { content: string }, string]> = [
  ['explore', getOrbitExploreCommandTemplate, 'orbit-explore'],
  ['new', getOrbitNewCommandTemplate, 'orbit-new-change'],
  ['continue', getOrbitContinueCommandTemplate, 'orbit-continue-change'],
  ['apply', getOrbitApplyCommandTemplate, 'orbit-apply-change'],
  ['ff', getOrbitFfCommandTemplate, 'orbit-ff-change'],
  ['sync', getOrbitSyncCommandTemplate, 'orbit-sync-specs'],
  ['archive', getOrbitArchiveCommandTemplate, 'orbit-archive-change'],
  ['bulk-archive', getOrbitBulkArchiveCommandTemplate, 'orbit-bulk-archive-change'],
  ['verify', getOrbitVerifyCommandTemplate, 'orbit-verify-change'],
  ['onboard', getOrbitOnboardCommandTemplate, 'orbit-onboard'],
  ['propose', getOrbitProposeCommandTemplate, 'orbit-propose'],
  ['review', getOrbitReviewCommandTemplate, 'orbit-review'],
  ['review-external', getOrbitReviewExternalCommandTemplate, 'orbit-review-external'],
  ['address-reviews', getOrbitAddressReviewsCommandTemplate, 'orbit-address-reviews'],
  ['audit-drift', getOrbitAuditDriftCommandTemplate, 'orbit-audit-drift'],
];

describe('orbit content fidelity (B1 relocation)', () => {
  describe.each(RELOCATED)('%s', (_name, getTemplate, requiredMarkers) => {
    const skill = getTemplate().instructions;

    it('carries every required orbit editorial marker', () => {
      for (const marker of requiredMarkers) {
        expect(skill).toContain(marker);
      }
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

  describe('references declarations (orbit-skill-generation, D-b2-4 lean scope)', () => {
    it('archive-change declares exactly archive-summary-schema.md', () => {
      const refs = getArchiveChangeSkillTemplate().references ?? [];
      expect(refs.map((r) => r.name)).toEqual(['archive-summary-schema.md']);
    });

    it('no other workflow declares references', () => {
      const withReferences = new Set(['archive-change', ...B3_REFERENCES.map(([n]) => n)]);
      for (const [name, getTemplate] of RELOCATED) {
        if (withReferences.has(name)) continue;
        expect(getTemplate().references ?? [], `${name} must not declare references`).toEqual([]);
      }
    });

    it.each(B3_REFERENCES)('%s declares its exact reference set', (_name, getTemplate, expected) => {
      const refs = getTemplate().references ?? [];
      expect(refs.map((r) => r.name)).toEqual(expected);
      for (const ref of refs) {
        expect(ref.content).toBeTruthy();
        expect(ref.content).not.toContain('/opsx:');
        expect(ref.content).not.toMatch(/openspec\/(changes|specs|explore|lenses)/);
      }
    });

    it('B3 editorial skills declare their capability metadata (B2 pass-through consumer)', () => {
      for (const [name, getTemplate] of B3_REFERENCES) {
        expect(getTemplate().metadata?.capability).toBe(`orbit-${name}`);
      }
    });

    it('archive schema content matches the baseline-canonical shape and vocabulary', () => {
      const schema = (getArchiveChangeSkillTemplate().references ?? [])[0].content;
      // canonical shapes (orbit-archive-modifications delta scenarios)
      expect(schema).toContain('"unresolved_markers": ["<file>:<line>'); // ARRAY, not object
      expect(schema).not.toContain('"counts": {'); // flat sync_specs counts
      expect(schema).toContain('"added": 0,');
      expect(schema).toContain('audit_skipped_via_flag'); // flat skip flag
      expect(schema).not.toContain('"skipped_via_flag"'); // not nested in audit
      expect(schema).not.toContain('"aborted"'); // three user_decision values only
      // vocabulary: zero opsx/openspec-era residue
      expect(schema).not.toContain('/opsx:');
      expect(schema).not.toMatch(/openspec\/(changes|specs)/);
      expect(schema).not.toContain('openspec-sync-specs');
    });
  });

  describe.each(LAUNCHERS)('command %s', (_name, getTemplate, skillDir) => {
    const content = getTemplate().content;

    it('is a thin launcher delegating to its skill', () => {
      expect(content).toContain('thin launcher');
      expect(content).toContain(`\`${skillDir}\` skill`);
      // a launcher that grows a workflow body again is a regression
      expect(content.length).toBeLessThan(600);
    });

    it('is mechanism-neutral', () => {
      expect(content).not.toContain('/opsx:');
      expect(content).not.toContain('.claude/skills/');
      expect(content).not.toMatch(/openspec\/(changes|specs|explore|lenses)/);
    });
  });
});
