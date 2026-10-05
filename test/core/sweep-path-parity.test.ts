import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate, getAddressReviewsSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc08a-sweep-evidence, system walk 1 (fresh S2, Sal: B) — R-crc-14's mirror corollary, a sibling of
 * `verification-verdict-parity.test.ts`. The CHECK SCOPE and PATH rule are stated ONCE, as a fenced
 * production in `orbit-emit-composition`'s `The walk write gate checks sweep evidence`. The walker
 * composes paths the gate resolves, and the verifier grades over them; an adopter's installed skill
 * has neither our specs nor our engine, so BOTH bodies carry the fence as a CHECKED MIRROR naming the
 * owner, held byte-equal here through the single-active-owner lookup.
 */
const FIRST = 'CHECK SCOPE — the union of:';

describe('sweep scope and path rule ↔ walk and review bodies parity (rc08a)', () => {
  const bodies: Array<[string, string]> = [
    ['orbit-review', getReviewSkillTemplate().instructions],
    ['orbit-address-reviews', getAddressReviewsSkillTemplate().instructions],
  ];

  it.each(bodies)("%s carries the owner's fence byte-equal, once, under a CHECKED MIRROR sentence naming the owner", async (_name, body) => {
    const owner = await ownerText('orbit-emit-composition', '```\n' + FIRST);
    expect(fencedProduction(body, FIRST)).toBe(fencedProduction(owner, FIRST));
    expect(body.split(FIRST).length - 1).toBe(1);
    const before = body.slice(0, body.indexOf('```\n' + FIRST)).split('\n').filter(l => l.trim() !== '').pop()!;
    expect(before).toMatch(/CHECKED MIRROR/);
    expect(before).toContain("`orbit-emit-composition`'s");
    expect(before).toContain('The walk write gate checks sweep evidence');
  });

  it('review step (c) points at the mirror, not at a spec an installed skill cannot open', () => {
    const grade = getReviewSkillTemplate().instructions.split('**(c) Grade.**')[1].split('**(d)')[0];
    expect(grade).toContain('every path resolves by the rule under **Sweep scope and paths** below');
    expect(grade).not.toContain("a path resolves by the rule `orbit-emit-composition`'s");
  });
});
