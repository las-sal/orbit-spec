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
 *   held by a line ceiling of 664 that may only go down.
 *
 * A failure names the body, its size and its ceiling, then states the rule for fixing it (D-cs-5, D-cs-10).
 */

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VERSION = (JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf-8')) as { version: string }).version;

/**
 * Each body's character ceiling: its size plus 5%, rounded up (2026-11-17, measured at version 2.0.2) — after
 * conditional-steps, and lowered after once-per-session-detail for the eleven bodies whose emit step it moved (each
 * line names its edit and its previous ceiling).
 */
const CHARACTER_CEILING: Record<string, number> = {
  'orbit-explore': 52432, // 49,935
  'orbit-new-change': 7409, // 7,056 (once-per-session-detail; was 7588)
  'orbit-continue-change': 11003, // 10,479 (once-per-session-detail; was 11182)
  'orbit-apply-change': 19819, // 18,875 (once-per-session-detail; was 28481)
  'orbit-ff-change': 15028, // 14,312 (once-per-session-detail; was 15293)
  'orbit-sync-specs': 9069, // 8,637
  'orbit-archive-change': 33489, // 31,894 (once-per-session-detail; was 36883)
  'orbit-bulk-archive-change': 28022, // 26,687
  'orbit-verify-change': 15426, // 14,691 (once-per-session-detail; was 16073)
  'orbit-onboard': 23567, // 22,444
  'orbit-propose': 38030, // 36,219 (once-per-session-detail; was 38295)
  'orbit-review': 43844, // 41,756 (once-per-session-detail; was 45751)
  'orbit-address-reviews': 49862, // 47,487 (once-per-session-detail; was 54442)
  'orbit-audit-drift': 22367, // 21,301 (once-per-session-detail; was 22624)
  'orbit-architect': 18362, // 17,487 (once-per-session-detail; was 19149)
};

const LINE_LIMIT = 500;
/** Explore's own line ceiling (R-rop-8): it starts over the limit and may only go down. */
const LINE_CEILING: Record<string, number> = { 'orbit-explore': 664 };

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
