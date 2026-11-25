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
 * - a LINE limit of 500 (Anthropic's guidance for a skill body), counted as `wc -l` counts (newlines), except explore,
 *   held by a line ceiling that may only go down — but for its one named rise, from 664 to 669, for the five lines the
 *   decision-writing bullet's labelled sub-bullets added (tighten-bodies, D-tb-17; R-rop-8 and RG3 as amended), which
 *   records-by-setting took back down to 664 when the bullet became its one-line basic content.
 *
 * A failure names the body, its size and its ceiling, then states the rule for fixing it (D-cs-5, D-cs-10).
 */

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VERSION = (JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf-8')) as { version: string }).version;

/**
 * Each body's character ceiling: its size plus 5%, rounded up (2026-11-17, measured at version 2.0.2) — after
 * conditional-steps, lowered after once-per-session-detail for the eleven bodies whose emit step it moved, and lowered
 * again after tighten-bodies, after records-by-setting and after cut-review-walk (reduce-orbit-phase2's G2) wherever the
 * new size plus 5% is below the ceiling (each line names its edit and its previous ceiling; a body whose new size plus 5%
 * would exceed its ceiling keeps it, so none rises). A body that fits reduce-orbit-phase2's G1 (at most 5,000 estimated
 * tokens, 20,000 characters) is capped at 20,000, so the suite fails the moment it regrows past G1 (cut-review-walk's
 * system walk, 2026-11-24).
 */
const CHARACTER_CEILING: Record<string, number> = {
  'orbit-explore': 49997, // 47,616 (records-by-setting; was 52432)
  'orbit-new-change': 4874, // 4,641 (records-by-setting; was 7409)
  'orbit-continue-change': 8248, // 7,855 (records-by-setting; was 10803)
  'orbit-apply-change': 15591, // 14,848 (cut-review-walk; was 16596)
  'orbit-ff-change': 11200, // 10,666 (cut-review-walk; was 12205)
  'orbit-sync-specs': 6597, // 6,282 (records-by-setting; was 9069)
  'orbit-archive-change': 29573, // 28,164 (records-by-setting; was 32127)
  'orbit-bulk-archive-change': 25585, // 24,366 (records-by-setting; was 28022)
  'orbit-verify-change': 12803, // 12,193 (records-by-setting; was 15358)
  'orbit-onboard': 23567, // 22,650 at cut-review-walk, which kept the ceiling, as records-by-setting did (22,712): its size plus 5% would exceed it
  'orbit-propose': 33523, // 31,926 (cut-review-walk; was 34528)
  'orbit-review': 20000, // under G1's 20,000 (cut-review-walk's system walk, 2026-11-24; was 20961, its size plus 5%)
  'orbit-address-reviews': 20000, // under G1's 20,000 (cut-review-walk's system walk, 2026-11-24; was 20918, its size plus 5%)
  'orbit-audit-drift': 19840, // 18,895 (records-by-setting; was 22367)
  'orbit-architect': 15601, // 14,858 (records-by-setting; was 18156)
};

const LINE_LIMIT = 500;
/** Explore's own line ceiling (R-rop-8): it starts over the limit and may only go down. */
const LINE_CEILING: Record<string, number> = { 'orbit-explore': 664 }; // 664 lines (records-by-setting; was 669)

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

  it("explore's line ceiling holds at 664 or lower, and only explore is over the 500-line limit", () => {
    expect(LINE_CEILING['orbit-explore']).toBeLessThanOrEqual(664);
    expect(Object.keys(LINE_CEILING)).toEqual(['orbit-explore']);
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
