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
 *   decision-writing bullet's labelled sub-bullets added (tighten-bodies, D-tb-17; R-rop-8 and RG3 as amended).
 *
 * A failure names the body, its size and its ceiling, then states the rule for fixing it (D-cs-5, D-cs-10).
 */

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VERSION = (JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf-8')) as { version: string }).version;

/**
 * Each body's character ceiling: its size plus 5%, rounded up (2026-11-17, measured at version 2.0.2) — after
 * conditional-steps, lowered after once-per-session-detail for the eleven bodies whose emit step it moved, and lowered
 * again after tighten-bodies wherever the new size plus 5% is below the ceiling (each line names its edit and its
 * previous ceiling; a body whose new size plus 5% would exceed its ceiling keeps it, so none rises).
 */
const CHARACTER_CEILING: Record<string, number> = {
  'orbit-explore': 52432, // 50,049 at tighten-bodies, which kept the ceiling: its size plus 5% would exceed it
  'orbit-new-change': 7409, // 7,074 at tighten-bodies, which kept the ceiling (once-per-session-detail's; was 7588)
  'orbit-continue-change': 10803, // 10,288 (tighten-bodies; was 11003)
  'orbit-apply-change': 19150, // 18,238 (tighten-bodies; was 19819)
  'orbit-ff-change': 14759, // 14,056 (tighten-bodies; was 15028)
  'orbit-sync-specs': 9069, // 8,715 at tighten-bodies, which kept the ceiling: its size plus 5% would exceed it
  'orbit-archive-change': 32127, // 30,597 (tighten-bodies; was 33489)
  'orbit-bulk-archive-change': 28022, // 26,799 at tighten-bodies, which kept the ceiling: its size plus 5% would exceed it
  'orbit-verify-change': 15358, // 14,626 (tighten-bodies; was 15426)
  'orbit-onboard': 23567, // 22,519 at tighten-bodies, which kept the ceiling: its size plus 5% would exceed it
  'orbit-propose': 37082, // 35,316 (tighten-bodies; was 38030)
  'orbit-review': 42880, // 40,838 (tighten-bodies; was 43844)
  'orbit-address-reviews': 48420, // 46,114 (tighten-bodies; was 49862)
  'orbit-audit-drift': 22367, // 21,328 at tighten-bodies, which kept the ceiling (once-per-session-detail's; was 22624)
  'orbit-architect': 18156, // 17,291 (tighten-bodies; was 18362)
};

const LINE_LIMIT = 500;
/** Explore's own line ceiling (R-rop-8): it starts over the limit and may only go down. */
const LINE_CEILING: Record<string, number> = { 'orbit-explore': 669 };

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

  it("explore's line ceiling holds at 669 or lower, and only explore is over the 500-line limit", () => {
    expect(LINE_CEILING['orbit-explore']).toBeLessThanOrEqual(669);
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
