import { describe, it, expect } from 'vitest';
import { getAddressReviewsSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc08b-walk-routing (task 3.1) — R-crc-14's mirror corollary, a sibling of `sweep-path-parity.test.ts`.
 * Discovery is stated ONCE, as a fenced production in `orbit-address-reviews`' `Address-reviews command
 * available`. An adopter's installed skill has no specs to open, so the walk body carries the fence as a
 * CHECKED MIRROR naming the owner, held byte-equal here through the single-active-owner lookup.
 */
const FIRST = 'DISCOVERY — rows tested in order, first match wins:';

describe('discovery fence ↔ walk body parity (rc08b)', () => {
  const body = getAddressReviewsSkillTemplate().instructions;

  it("the walk body carries the owner's fence byte-equal, once, under a CHECKED MIRROR sentence naming the owner", async () => {
    const owner = await ownerText('orbit-address-reviews', '```\n' + FIRST);
    expect(fencedProduction(body, FIRST)).toBe(fencedProduction(owner, FIRST));
    expect(body.split(FIRST).length - 1).toBe(1);
    const before = body.slice(0, body.indexOf('```\n' + FIRST)).split('\n').filter(l => l.trim() !== '').pop()!;
    expect(before).toMatch(/CHECKED MIRROR/);
    expect(before).toContain("`orbit-address-reviews`'");
    expect(before).toContain('Address-reviews command available');
  });

  it('the fence sits in Step 1', () => {
    const step1 = body.split('### 1. Discover')[1].split('### 2. Triage')[0];
    expect(step1).toContain('```\n' + FIRST);
  });
});
