import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateSkillContent, getSkillTemplates } from '../../../src/core/shared/skill-generation.js';

/**
 * reduce-orbit-phase1's per-body budget (R-rop-8, RG3; conditional-steps design §5). Every skill is rendered as
 * `orbit init` writes its SKILL.md (`generateSkillContent`), and each body is held to:
 *
 * - a CHARACTER ceiling: its size when conditional-steps landed, plus 5%, rounded up (string length of the generated
 *   file, frontmatter included). A ceiling only moves DOWN in this program; stages B and C lower it.
 * - a LINE limit of 500 (Anthropic's guidance for a skill body), counted as `wc -l` counts (newlines), for every body.
 *   Explore was held by a line ceiling of its own until cut-explore-onboard brought it under the limit (664 lines to
 *   345): the ceiling was deleted, a lowering (reduce-orbit-phase2's G2, design D6).
 *
 * A failure names the body, its size and its ceiling, then states the rule for fixing it (D-cs-5, D-cs-10).
 */

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VERSION = (JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf-8')) as { version: string }).version;

/**
 * Each body's character ceiling: its size plus 5%, rounded up (2026-11-17, measured at version 2.0.2) — after
 * conditional-steps, lowered after once-per-session-detail for the eleven bodies whose emit step it moved, and lowered
 * again after tighten-bodies, after records-by-setting, after cut-review-walk, after cut-propose-archive and after
 * cut-explore-onboard (reduce-orbit-phase2's G2) wherever the
 * new size plus 5% is below the ceiling (each line names its edit and its previous ceiling; a body whose new size plus 5%
 * would exceed its ceiling keeps it, so none rises). A body that fits reduce-orbit-phase2's G1 (at most 5,000 estimated
 * tokens, 20,000 characters) is capped at 20,000, so the suite fails the moment it regrows past G1 (cut-review-walk's
 * system walk, 2026-11-24).
 */
const CHARACTER_CEILING: Record<string, number> = {
  'orbit-explore': 20000, // 19,854, under G1's 20,000 (cut-explore-onboard; was 49997)
  'orbit-new-change': 4797, // 4,568 (cut-explore-onboard; was 4874)
  'orbit-continue-change': 8172, // 7,782 (cut-explore-onboard; was 8248)
  'orbit-apply-change': 14818, // 14,112 (cut-explore-onboard; was 14876)
  'orbit-ff-change': 11123, // 10,593 (cut-explore-onboard; was 11200)
  'orbit-sync-specs': 6497, // 6,187 (cut-explore-onboard; was 6573)
  'orbit-archive-change': 20000, // 19,434, under G1's 20,000 (cut-propose-archive; was 29573; cut-explore-onboard kept it, its size plus 5% being 20,406)
  'orbit-verify-change': 12726, // 12,120 (cut-explore-onboard; was 12803)
  'orbit-onboard': 20000, // 19,939, under G1's 20,000 (cut-explore-onboard; was 23562)
  'orbit-propose': 19309, // 18,389 (cut-explore-onboard; was 19386)
  'orbit-review': 20000, // 19,876, under G1's 20,000 (cut-review-walk's system walk, 2026-11-24; cut-explore-onboard kept it)
  'orbit-address-reviews': 20000, // 19,886, under G1's 20,000 (cut-review-walk's system walk, 2026-11-24; cut-explore-onboard kept it)
  'orbit-audit-drift': 19764, // 18,822 (cut-explore-onboard; was 19840)
  'orbit-architect': 15525, // 14,785 (cut-explore-onboard; was 15601)
};

const LINE_LIMIT = 500;
/** A body's own line ceiling, where one is over the limit: none since cut-explore-onboard (explore's was 664). */
const LINE_CEILING: Record<string, number> = {};

const BUDGET_RULE =
  "keep the step's basic content (when it runs, the command, the usual result, the link) in the body and move its procedure to a reference file — see skill_body_convention.md";

const lines = (text: string): number => text.split('\n').length - 1;

/** Every budget breach over the rendered bodies, each message naming the body, its size, its ceiling and the rule. */
function budgetFailures(bodies: Array<[string, string]>, ceilings = CHARACTER_CEILING, lineCeilings = LINE_CEILING): string[] {
  const out: string[] = [];
  for (const [dir, text] of bodies) {
    const ceiling = ceilings[dir];
    if (ceiling === undefined) {
      out.push(`${dir} has no character ceiling: add one at its size plus 5% (${Math.ceil(text.length * 1.05)}); ${BUDGET_RULE}`);
    } else if (text.length > ceiling) {
      out.push(`${dir} is ${text.length} characters, over its ceiling of ${ceiling}: ${BUDGET_RULE}`);
    }
    const lineCeiling = lineCeilings[dir] ?? LINE_LIMIT;
    if (lines(text) > lineCeiling) out.push(`${dir} is ${lines(text)} lines, over its limit of ${lineCeiling}: ${BUDGET_RULE}`);
  }
  return out;
}

const rendered = (): Array<[string, string]> => getSkillTemplates().map((s) => [s.dirName, generateSkillContent(s.template, VERSION)]);

describe('skill body budget (R-rop-8)', () => {
  it('every generated body is within its character ceiling and its line limit', () => {
    expect(budgetFailures(rendered())).toEqual([]);
  });

  it('every generated body has a ceiling, and no ceiling names a body that is not generated', () => {
    expect(Object.keys(CHARACTER_CEILING).sort()).toEqual(rendered().map(([d]) => d).sort());
  });

  it('every body is under the 500-line limit, and no body has a line ceiling of its own (cut-explore-onboard)', () => {
    expect(Object.keys(LINE_CEILING)).toEqual([]);
    for (const [dir, text] of rendered()) expect(lines(text), dir).toBeLessThanOrEqual(LINE_LIMIT);
  });

  it('a breach names the body, its size and its ceiling, and states the rule naming skill_body_convention.md', () => {
    const bodies = rendered();
    const apply = bodies.find(([d]) => d === 'orbit-apply-change') as [string, string];
    const lowered = { ...CHARACTER_CEILING, 'orbit-apply-change': apply[1].length - 1 };
    expect(budgetFailures(bodies, lowered)).toEqual([
      `orbit-apply-change is ${apply[1].length} characters, over its ceiling of ${apply[1].length - 1}: ${BUDGET_RULE}`,
    ]);
    const explore = bodies.find(([d]) => d === 'orbit-explore') as [string, string];
    expect(budgetFailures([explore], CHARACTER_CEILING, { 'orbit-explore': lines(explore[1]) - 1 })).toEqual([
      `orbit-explore is ${lines(explore[1])} lines, over its limit of ${lines(explore[1]) - 1}: ${BUDGET_RULE}`,
    ]);
    expect(BUDGET_RULE).toContain('skill_body_convention.md');
  });
});
