import { describe, it, expect } from 'vitest';
import { DEFERRAL_REFUSALS } from '../../src/core/templates/workflows/archive-change.js';
import { getArchiveChangeSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc10-apply-closure, task 2.8 (design D6; R-crc-14's mirror corollary) — a sibling of
 * `pass-genre-parity.test.ts`.
 *
 * The archive write gate's refusals are stated ONCE, as the `DEFERRAL REFUSALS` fenced production in
 * `orbit-archive-modifications`' `User-validation closure at the archive seam`. No engine surface runs
 * the write gate before the move, so the archive skill carries the production as a CHECKED MIRROR — in its
 * `references/user-validation.md` since cut-propose-archive (A2), the reference Step 3.2 reads when a marked task is
 * unchecked; this test holds it byte-equal to the owner's fence through the single-active-owner lookup (the active delta
 * while the change is open, the baseline after).
 */
const FIRST_LINE = 'DEFERRAL REFUSALS — the archive write gate refuses each, naming the task or line, and Step 3.2 checks each before the move:';

describe('DEFERRAL REFUSALS ↔ archive skill parity (rc10)', () => {
  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: An undeferred validation is refused at the write gate
  it("the mirror constant is byte-equal to the owner's fence", async () => {
    const owner = await ownerText('orbit-archive-modifications', '```\n' + FIRST_LINE);
    expect(DEFERRAL_REFUSALS).toBe(fencedProduction(owner, FIRST_LINE));
  });

  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: The archive body reads the user-validation reference only when a marked task is unchecked
  it("the user-validation reference carries the fence exactly once, byte-equal to the owner's, and the body does not", async () => {
    const tpl = getArchiveChangeSkillTemplate();
    const ref = (tpl.references ?? []).find((r) => r.name === 'user-validation.md')!.content;
    const owner = await ownerText('orbit-archive-modifications', '```\n' + FIRST_LINE);
    expect(fencedProduction(ref, FIRST_LINE)).toBe(fencedProduction(owner, FIRST_LINE));
    expect(ref.split(FIRST_LINE).length - 1).toBe(1);
    expect(tpl.instructions).not.toContain(FIRST_LINE);
  });
});
