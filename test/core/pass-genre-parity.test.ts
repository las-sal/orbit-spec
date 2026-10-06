import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc03b-pass-genres, task 1.2 (design D5; R-crc-14's mirror corollary) — a sibling of
 * `severity-ladder-parity.test.ts`.
 *
 * The pass-genre table is stated ONCE, as a fenced production in `orbit-conventions`' `Review mode
 * decision framework`. An adopter's installed review skill has neither our specs nor our parser, so
 * the body carries the table as a CHECKED MIRROR under a "Pass genre" heading naming the owner; this
 * test holds the mirror byte-equal to the owner's fence through the single-active-owner lookup (the
 * active delta while the change is open, the baseline after archive).
 */
const HEADER_ROW = '| reviewer class | mode | trail position | pass genre |';

describe('pass-genre table ↔ review body parity (rc03b)', () => {
  // @scenario text orbit-conventions :: Review mode decision framework :: The review body carries the table as a checked mirror
  it("the review body's \"Pass genre\" fence is byte-equal to `orbit-conventions`' fenced table", async () => {
    const owner = await ownerText('orbit-conventions', '```\n' + HEADER_ROW);
    const table = fencedProduction(owner, HEADER_ROW);
    const body = getReviewSkillTemplate().instructions;
    const section = body.split(/\n#{2,3} Pass genre\b/)[1];
    expect(section, 'the body carries a "Pass genre" heading').toBeDefined();
    expect(fencedProduction(section, HEADER_ROW)).toBe(table);
  });

  it('the mirror says it is one and names its owner', () => {
    const body = getReviewSkillTemplate().instructions;
    const section = body.split(/\n#{2,3} Pass genre\b/)[1].split('```')[0];
    expect(section).toMatch(/CHECKED MIRROR/);
    expect(section).toContain("`orbit-conventions`' `Review mode decision framework`");
  });

  it('the table appears ONCE in the body (a mirror, never a restatement beside itself)', () => {
    const body = getReviewSkillTemplate().instructions;
    expect(body.split(HEADER_ROW).length - 1).toBe(1);
  });

  it('the table has the six rows the owner declares', async () => {
    const owner = await ownerText('orbit-conventions', '```\n' + HEADER_ROW);
    const rows = fencedProduction(owner, HEADER_ROW).split('\n').slice(2);
    expect(rows).toHaveLength(6);
  });
});
