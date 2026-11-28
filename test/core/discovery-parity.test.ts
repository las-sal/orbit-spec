import { describe, it, expect } from 'vitest';
import { getAddressReviewsSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc08b-walk-routing (task 3.1) — R-crc-14's mirror corollary, a sibling of `sweep-path-parity.test.ts`.
 * Discovery is stated ONCE, as a fenced production in `orbit-address-reviews`' `Address-reviews command
 * available`. An adopter's installed skill has no specs to open, so the walk body carries the fence as a
 * CHECKED MIRROR, held byte-equal here through the single-active-owner lookup — since cut-review-walk in its
 * `references/discovery.md`, which the body reads at Step 1. Since tighten-bodies (R-rop-14) the
 * copy carries no note saying it is one: the fence's first line is the anchor.
 */
const FIRST = 'DISCOVERY — rows tested in order, first match wins:';

describe('discovery fence ↔ walk skill parity (rc08b)', () => {
  // cut-review-walk (M1): the fence moved, byte-equal, to the skill's `references/discovery.md`, read at Step 1.
  const skill = getAddressReviewsSkillTemplate();
  const body = skill.instructions;
  const ref = (skill.references ?? []).find((r) => r.name === 'discovery.md')?.content ?? '';

  it("references/discovery.md carries the owner's fence byte-equal, once, with no mirror note before it", async () => {
    const owner = await ownerText('orbit-address-reviews', '```\n' + FIRST);
    expect(fencedProduction(ref, FIRST)).toBe(fencedProduction(owner, FIRST));
    expect(ref.split(FIRST).length - 1).toBe(1);
    const before = ref.slice(0, ref.indexOf('```\n' + FIRST)).split('\n').filter(l => l.trim() !== '').pop()!;
    expect(before).toBe('# Reference: discovery and the `--from-file` ingest (Step 1)');
    expect(before).not.toMatch(/CHECKED MIRROR/);
    expect(body).not.toContain(FIRST);
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: The fence is read from the skill's reference
  it('Step 1 reads references/discovery.md, which carries the fence', () => {
    const step1 = body.split('### 1. Discover')[1].split('### 2. Triage')[0];
    expect(step1).toContain('read `references/discovery.md` and follow it');
    expect(ref).toContain('```\n' + FIRST);
  });
});
