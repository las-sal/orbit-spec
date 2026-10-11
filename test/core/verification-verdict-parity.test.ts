import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc03c-verification-record, system walk 2 (fresh W1) — R-crc-14's mirror corollary, a sibling of
 * `pass-genre-parity.test.ts`. The verdict definition (`landed` / `regressed`) is stated ONCE, as a
 * fenced production in `orbit-emit-composition`'s `A VERIFICATION-genre payload carries its verdicts
 * and its findings link to the walk record`. An adopter's installed review skill has neither our
 * specs nor our parser, and a verifier cannot grade by a definition it cannot read, so the body
 * carries the fence as a CHECKED MIRROR under a "Verdicts" heading naming the owner; this test holds
 * it byte-equal through the single-active-owner lookup (the delta while open, the baseline after).
 */
const FIRST = "landed — the resolution's edit is PRESENT";

describe('verification verdicts ↔ review body parity (rc03c)', () => {
  it("the review body's \"Verdicts\" fence is byte-equal to the owner's fence", async () => {
    const owner = await ownerText('orbit-emit-composition', '```\n' + FIRST);
    const body = getReviewSkillTemplate().instructions;
    const section = body.split(/\n#{2,4} Verdicts\b/)[1];
    expect(section, 'the body carries a "Verdicts" heading').toBeDefined();
    expect(fencedProduction(section, FIRST)).toBe(fencedProduction(owner, FIRST));
  });

  it('the mirror says it is one and names its owner', () => {
    const section = getReviewSkillTemplate().instructions.split(/\n#{2,4} Verdicts\b/)[1].split('```')[0];
    expect(section).toMatch(/CHECKED MIRROR/);
    expect(section).toContain("`orbit-emit-composition`'s **A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record**");
  });

  it('the definition appears ONCE in the body (a mirror, never a restatement beside itself)', () => {
    const body = getReviewSkillTemplate().instructions;
    expect(body.split(FIRST).length - 1).toBe(1);
  });
});
