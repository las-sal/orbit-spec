import { describe, it, expect } from 'vitest';
import { countExplore, maturityRecommendation } from '../../../src/core/parsers/explore-counter.js';

const full = `# Explore: foo

> **Status**: exploring

## Premise

Some premise prose.

## Decisions

- **D-1 (2026-08-01) — First decision.** Body text.
  - nested bullet does not count
- **D-2 (2026-08-02) — Second decision.**

  A continuation paragraph belonging to D-2.
- **D-3** — third.
- **D-4** — fourth.

## Open questions

- **Q-1 — Which flavor?**
  Standing recommendation: vanilla, probably
- **Q-2 — When to ship?**
  Standing recommendation: none yet
- **Q-3 — slot-less entry**

## Considered & out

- rejected thing

## References

- some/file.md
`;

describe('countExplore', () => {
  it('counts top-level entries only, with the real-leaning attestation membership', () => {
    const c = countExplore(full);
    expect(c.decisionsCaptured).toBe(4);
    expect(c.openQuestionsCount).toBe(3);
    // Q-1 has a real leaning; Q-2 is the literal `none yet`; Q-3 is slot-less.
    expect(c.openQuestionsWithRecommendation).toBe(1);
    expect(c.attestation).toBe('1 of 3');
    expect(c.missingSections).toEqual([]);
  });

  it('never counts fenced decoys as entries', () => {
    const fenced = `## Decisions\n\n- real entry\n\n\`\`\`markdown\n- fenced decoy\n## Open questions\n- fenced question\n\`\`\`\n\n## Open questions\n\n- **Q** real\n  Standing recommendation: yes, do it\n`;
    const c = countExplore(fenced);
    expect(c.decisionsCaptured).toBe(1);
    expect(c.openQuestionsCount).toBe(1);
    expect(c.openQuestionsWithRecommendation).toBe(1);
  });

  it('a missing heading yields count 0 and names the section (never a blocker)', () => {
    const noOpen = `## Decisions\n\n- one\n- two\n`;
    const c = countExplore(noOpen);
    expect(c.decisionsCaptured).toBe(2);
    expect(c.openQuestionsCount).toBe(0);
    expect(c.attestation).toBe('0 of 0');
    expect(c.missingSections).toEqual(['Open questions']);
  });

  it('an empty Open questions section counts zero without a format note', () => {
    const empty = `## Decisions\n\n- one\n\n## Open questions\n\n(None open at close.)\n`;
    const c = countExplore(empty);
    expect(c.openQuestionsCount).toBe(0);
    expect(c.attestation).toBe('0 of 0');
    expect(c.missingSections).toEqual([]);
  });

  it('an ordered-list entry counts as top-level', () => {
    const ordered = `## Decisions\n\n1. first\n2. second\n`;
    expect(countExplore(ordered).decisionsCaptured).toBe(2);
  });
});

describe('maturityRecommendation', () => {
  it('Early at 0 decisions acknowledges no decisions yet', () => {
    const r = maturityRecommendation('foo', 0, 0);
    expect(r.startsWith('/orbit:explore foo')).toBe(true);
    expect(r).toContain('no decisions captured yet');
  });

  it('Early at 1 decision continues capturing', () => {
    const r = maturityRecommendation('foo', 1, 3);
    expect(r.startsWith('/orbit:explore foo')).toBe(true);
    expect(r).toContain('continue capturing thinking');
  });

  it('Mid surfaces propose as the alternative', () => {
    const r = maturityRecommendation('foo', 3, 2);
    expect(r.startsWith('/orbit:explore foo')).toBe(true);
    expect(r).toContain('/orbit:propose foo');
  });

  it('Mature leads with propose', () => {
    const r = maturityRecommendation('foo', 5, 0);
    expect(r.startsWith('/orbit:propose foo')).toBe(true);
    expect(r).toContain('/orbit:explore foo');
  });

  it('Stalled directs back to exploration with both counts, no propose', () => {
    const r = maturityRecommendation('foo', 5, 3);
    expect(r.startsWith('/orbit:explore foo')).toBe(true);
    expect(r).toContain('5 decisions captured but 3 open questions remain');
    expect(r).not.toContain('/orbit:propose');
  });
});
