import { describe, it, expect } from 'vitest';
import { DEFERRAL_REFUSALS } from '../../src/core/templates/workflows/archive-change.js';
import { getArchiveChangeSkillTemplate, getBulkArchiveChangeSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc10-apply-closure, task 2.8 (design D6; R-crc-14's mirror corollary) — a sibling of
 * `pass-genre-parity.test.ts`.
 *
 * The archive write gate's refusals are stated ONCE, as the `DEFERRAL REFUSALS` fenced production in
 * `orbit-archive-modifications`' `User-validation closure at the archive seam`. No engine surface runs
 * the write gate before the move, so the archive body's Step 3.2 (and bulk archive's per-change step)
 * carry the production as a CHECKED MIRROR; this test holds it byte-equal to the owner's fence through
 * the single-active-owner lookup (the active delta while the change is open, the baseline after).
 */
const FIRST_LINE = 'DEFERRAL REFUSALS — the archive write gate refuses each, naming the task or line, and Step 3.2 checks each before the move:';

describe('DEFERRAL REFUSALS ↔ archive bodies parity (rc10)', () => {
  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: An undeferred validation is refused at the write gate
  it("the mirror constant is byte-equal to the owner's fence", async () => {
    const owner = await ownerText('orbit-archive-modifications', '```\n' + FIRST_LINE);
    expect(DEFERRAL_REFUSALS).toBe(fencedProduction(owner, FIRST_LINE));
  });

  it('both generated bodies carry the fence exactly once', () => {
    for (const b of [getArchiveChangeSkillTemplate().instructions, getBulkArchiveChangeSkillTemplate().instructions]) {
      expect(fencedProduction(b, FIRST_LINE)).toBe(DEFERRAL_REFUSALS);
      expect(b.split(FIRST_LINE).length - 1).toBe(1);
    }
  });
});
