import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate, getAddressReviewsSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc08a-sweep-evidence, system walk 1 (fresh S2, Sal: B) — R-crc-14's mirror corollary, a sibling of
 * `verification-verdict-parity.test.ts`. The CHECK SCOPE and PATH rule are stated ONCE, as a fenced
 * production in `orbit-emit-composition`'s `The walk write gate checks sweep evidence`. The walker
 * composes paths the gate resolves, and the verifier grades over them; an adopter's installed skill
 * has neither our specs nor our engine, so BOTH bodies carry the fence as a CHECKED MIRROR, held byte-equal here
 * through the single-active-owner lookup. Since tighten-bodies (R-rop-14) neither copy carries a note saying it is one:
 * the fence's first line is the anchor.
 */
const FIRST = 'CHECK SCOPE — the union of:';

describe('sweep scope and path rule ↔ walk and review skills parity (rc08a)', () => {
  // cut-review-walk (M6, V1): each skill's copy moved, byte-equal, to a reference its body reads at the step that uses it.
  const refOf = (t: ReturnType<typeof getReviewSkillTemplate>, name: string): string =>
    (t.references ?? []).find((r) => r.name === name)?.content ?? '';
  const review = getReviewSkillTemplate();
  const walk = getAddressReviewsSkillTemplate();
  const copies: Array<[string, string, string, string]> = [
    ['orbit-review', 'verification.md', refOf(review, 'verification.md'), review.instructions],
    ['orbit-address-reviews', 'sweep-record.md', refOf(walk, 'sweep-record.md'), walk.instructions],
  ];

  it.each(copies)("%s's references/%s carries the owner's fence byte-equal, once, with no mirror note before it", async (_name, refName, ref, body) => {
    const owner = await ownerText('orbit-emit-composition', '```\n' + FIRST);
    expect(fencedProduction(ref, FIRST)).toBe(fencedProduction(owner, FIRST));
    expect(ref.split(FIRST).length - 1).toBe(1);
    const before = ref.slice(0, ref.indexOf('```\n' + FIRST)).split('\n').filter(l => l.trim() !== '').pop()!;
    expect(before).not.toMatch(/CHECKED MIRROR/);
    expect(before).not.toContain('The walk write gate checks sweep evidence');
    expect(body).not.toContain(FIRST);
    expect(body).toContain(`references/${refName}`);
  });

  it('review step (c) points at the mirror, not at a spec an installed skill cannot open', () => {
    const grade = refOf(review, 'verification.md').split('**(c) Grade.**')[1].split('**(d)')[0];
    expect(grade).toContain('every path resolves by the rule under **Sweep scope and paths** below');
    expect(grade).not.toContain("a path resolves by the rule `orbit-emit-composition`'s");
  });
});
