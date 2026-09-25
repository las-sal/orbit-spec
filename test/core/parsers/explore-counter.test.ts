import { describe, it, expect } from 'vitest';
import {
  countExplore,
  collectSections,
  maturityRecommendation,
  type MaturityFormInputs,
  type RungIdentifier,
} from '../../../src/core/parsers/explore-counter.js';

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

  it('tracks fences by the shared CommonMark grammar: a three-backtick line does not close a four-backtick fence, and an over-indented fence is not a fence (rc13b, Q-crc-15)', () => {
    const nested = `## Decisions\n\n- real one\n\n\`\`\`\`markdown\n\`\`\`\n- decoy inside the inner example\n\`\`\`\n\`\`\`\`\n\n- real two\n\n    \`\`\`\n- real three (the over-indented line above opened nothing)\n`;
    expect(countExplore(nested).decisionsCaptured).toBe(3);
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

  it('a repeated section heading merges rather than replaces, and records every heading line', () => {
    const repeated = `## Decisions\n\n- one\n\n## Open questions\n\n## Decisions\n\n- two\n- three\n`;
    expect(countExplore(repeated).decisionsCaptured).toBe(3);
    const sections = collectSections(repeated);
    expect(sections.get('Decisions')?.headings).toEqual([1, 7]);
    expect(sections.get('Open questions')?.headings).toEqual([5]);
  });

  it('an ordered-list entry counts as top-level', () => {
    const ordered = `## Decisions\n\n1. first\n2. second\n`;
    expect(countExplore(ordered).decisionsCaptured).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// The maturity grid — six rungs, the record, the key-defect clause, the bound
// ---------------------------------------------------------------------------

/** The pre-capability literals (rc13b keeps Early / Mid / Stalled BYTE-IDENTICAL when rules_open is empty). */
const PRE = {
  early0: '/orbit:explore foo — continue capturing thinking — no decisions captured yet',
  early1: '/orbit:explore foo — continue capturing thinking',
  mid: '/orbit:explore foo — continue thinking, or /orbit:propose foo if ready to formalize',
  stalled: '/orbit:explore foo — 5 decisions captured but 3 open questions remain; resolve open questions before formalizing',
};

function form(o: Partial<MaturityFormInputs> = {}): MaturityFormInputs {
  return {
    status: { token: 'exploring' },
    rulesTotal: 4,
    rulesOpen: [],
    keyDefects: [],
    residuals: [],
    ...o,
  };
}
const ids = (...list: string[]): RungIdentifier[] => list.map((id) => ({ id }));
const rec = (d: number, q: number, f: Partial<MaturityFormInputs> = {}) => maturityRecommendation('foo', d, q, form(f));

describe('maturityRecommendation — the six rungs', () => {
  it('Concluded: the header is read FIRST and collapses every count to prose naming no command', () => {
    const r = rec(5, 0, { status: { token: 'concluded', date: '2026-09-25', re_entry: 'a third withdrawn stage' } });
    expect(r).toBe('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    expect(r).not.toContain('/orbit:');
    // any counts — an Early file concludes too
    expect(rec(0, 3, { status: { token: 'concluded', date: '2026-09-25', re_entry: 'x' }, rulesTotal: 0 })).toBe('Concluded 2026-09-25. Reopens when: x.');
  });

  it('Concluded without a live Re-entry: slot renders the fallback', () => {
    expect(rec(5, 0, { status: { token: 'concluded', date: '2026-09-25' } })).toBe('Concluded 2026-09-25. Reopens when: (no Re-entry: slot found).');
  });

  it('Concluded with open domains carries the record AFTER the prose, still no /orbit: token', () => {
    const r = rec(5, 0, { status: { token: 'concluded', date: '2026-09-25', re_entry: 'a third withdrawn stage' }, rulesOpen: ids('D-x-1', 'D-x-2') });
    expect(r).toBe('Concluded 2026-09-25. Reopens when: a third withdrawn stage. · open domains: D-x-1, D-x-2');
    expect(r).not.toContain('/orbit:');
  });

  it('Early at 0 and 1 decisions: byte-identical to the pre-capability literals when rules_open is empty', () => {
    expect(rec(0, 0, { rulesTotal: 0 })).toBe(PRE.early0);
    expect(rec(1, 3, { rulesTotal: 1 })).toBe(PRE.early1);
  });

  it('Mid: byte-identical when rules_open is empty; a PREFIX with the record when open domains exist', () => {
    expect(rec(3, 2, { rulesTotal: 3 })).toBe(PRE.mid);
    const withRecord = rec(3, 2, { rulesTotal: 3, rulesOpen: ids('D-x-1', 'D-x-2') });
    expect(withRecord.startsWith(PRE.mid)).toBe(true);
    expect(withRecord).toBe(`${PRE.mid} · open domains: D-x-1, D-x-2`);
  });

  it('Stalled: byte-identical when rules_open is empty, no propose; a prefix with the record otherwise', () => {
    expect(rec(5, 3)).toBe(PRE.stalled);
    expect(rec(5, 3)).not.toContain('/orbit:propose');
    const withRecord = rec(5, 3, { rulesOpen: ids('D-x-9') });
    expect(withRecord.startsWith(PRE.stalled)).toBe(true);
    expect(withRecord.endsWith(' · open domains: D-x-9')).toBe(true);
  });

  it('Unaccounted (the cell the retired Mature rung occupied): explore, the gap named inline, NO record suffix, NO propose', () => {
    const r = rec(5, 0, { rulesOpen: ids('D-x-3') });
    expect(r.startsWith('/orbit:explore foo')).toBe(true);
    expect(r).toContain('1 of 4 live rules has an open domain (D-x-3)');
    expect(r).not.toContain(' · open domains:');
    expect(r).not.toContain('/orbit:propose');
    expect(r).toBe('/orbit:explore foo — 1 of 4 live rules has an open domain (D-x-3); account for them before formalizing');
  });

  it('Accounted: propose, reporting the live-rule count and the named residuals; explore as the alternative', () => {
    const r = rec(5, 0, { residuals: ids('D-x-4') });
    expect(r.startsWith('/orbit:propose foo')).toBe(true);
    expect(r).toBe('/orbit:propose foo — 4 live rules accounted, 1 bounded residual named (D-x-4); formalize when you are ready (or /orbit:explore foo to keep refining)');
    // B = 0: the whole residual clause is omitted
    expect(rec(5, 0)).toBe('/orbit:propose foo — 4 live rules accounted; formalize when you are ready (or /orbit:explore foo to keep refining)');
    // 1 open question still qualifies for the top cell
    expect(rec(4, 1).startsWith('/orbit:propose foo')).toBe(true);
  });
});

describe('maturityRecommendation — the record, the key-defect clause, K', () => {
  it('a malformed-entry live rule is counted in K and rendered with its line', () => {
    const r = rec(5, 0, { rulesTotal: 3, rulesOpen: [{ id: 'D-x-1', line: 40 }] });
    expect(r).toContain('1 of 3 live rules has an open domain (D-x-1 at line 40)');
  });

  it('the key-defect clause appends to an Unaccounted rung, never entering K or the open-domains list', () => {
    const r = rec(5, 0, { rulesOpen: ids('D-x-3', 'D-x-4'), keyDefects: [{ id: 'D-x-9', line: 88 }] });
    expect(r).toBe('/orbit:explore foo — 2 of 4 live rules have open domains (D-x-3, D-x-4); account for them before formalizing; 1 key defect (D-x-9 at line 88)');
  });

  it('a key defect alone does not change the verb: Accounted with the clause', () => {
    const r = rec(5, 0, { keyDefects: [{ id: 'D-x-2', line: 61 }] });
    expect(r.startsWith('/orbit:propose foo')).toBe(true);
    expect(r).toBe('/orbit:propose foo — 4 live rules accounted; formalize when you are ready (or /orbit:explore foo to keep refining); 1 key defect (D-x-2 at line 61)');
  });

  it('the key-defect clause appends to the Concluded rung too, before any open-domains record', () => {
    const r = rec(5, 0, {
      status: { token: 'concluded', date: '2026-09-25', re_entry: 'x' },
      keyDefects: [{ id: 'D-x-9', line: 88 }, { id: 'D-x-2', line: 90 }],
      rulesOpen: ids('D-x-1'),
    });
    expect(r).toBe('Concluded 2026-09-25. Reopens when: x.; 2 key defects (D-x-9 at line 88, D-x-2 at line 90) · open domains: D-x-1');
  });

  it('the key-defect clause appends to Early, Mid and Stalled as well (a PREFIX, the literal unchanged)', () => {
    expect(rec(1, 0, { rulesTotal: 1, keyDefects: [{ id: 'D-x-9', line: 5 }] })).toBe(`${PRE.early1}; 1 key defect (D-x-9 at line 5)`);
    expect(rec(3, 0, { rulesTotal: 3, keyDefects: [{ id: 'D-x-9', line: 5 }] })).toBe(`${PRE.mid}; 1 key defect (D-x-9 at line 5)`);
    expect(rec(5, 3, { keyDefects: [{ id: 'D-x-9', line: 5 }] })).toBe(`${PRE.stalled}; 1 key defect (D-x-9 at line 5)`);
  });
});

describe('maturityRecommendation — the bound and the identifier rule', () => {
  it('five open rules in a stated order render the first three then +2 more, in the array\'s order', () => {
    const r = rec(5, 0, { rulesTotal: 5, rulesOpen: [...ids('D-x-1', 'D-x-2', 'D-x-3', 'D-x-4'), { line: 212 }] });
    expect(r).toContain('5 of 5 live rules have open domains (D-x-1, D-x-2, D-x-3 +2 more)');
    // a different stated order renders differently — the array's order, not sorted
    const r2 = rec(5, 0, { rulesTotal: 5, rulesOpen: [...ids('D-x-4', 'D-x-3', 'D-x-2', 'D-x-1'), { line: 212 }] });
    expect(r2).toContain('(D-x-4, D-x-3, D-x-2 +2 more)');
  });

  it('five residuals render likewise on the Accounted rung; exactly three render no suffix', () => {
    const r = rec(5, 0, { rulesTotal: 5, residuals: ids('D-x-1', 'D-x-2', 'D-x-3', 'D-x-4', 'D-x-5') });
    expect(r).toContain('5 live rules accounted, 5 bounded residuals named (D-x-1, D-x-2, D-x-3 +2 more)');
    expect(rec(5, 0, { rulesTotal: 3, residuals: ids('D-x-1', 'D-x-2', 'D-x-3') })).toContain('(D-x-1, D-x-2, D-x-3);');
  });

  it('five key defects render the bound in the clause', () => {
    const r = rec(5, 0, { keyDefects: [1, 2, 3, 4, 5].map((n) => ({ id: `D-x-${n}`, line: n * 10 })) });
    expect(r).toContain('; 5 key defects (D-x-1 at line 10, D-x-2 at line 20, D-x-3 at line 30 +2 more)');
  });

  it('the ONE identifier rule: id+line, id alone, line alone', () => {
    const r = rec(5, 0, { rulesTotal: 3, rulesOpen: [{ id: 'D-x-1', line: 40 }, { id: 'D-x-2' }, { line: 212 }] });
    expect(r).toContain('(D-x-1 at line 40, D-x-2, line 212)');
  });

  it('nouns and verbs agree with their counts', () => {
    expect(rec(5, 0, { rulesTotal: 1, rulesOpen: ids('D-x-1') })).toContain('1 of 1 live rule has an open domain');
    expect(rec(5, 0, { rulesTotal: 2, rulesOpen: ids('D-x-1') })).toContain('1 of 2 live rules has an open domain');
    expect(rec(5, 0, { rulesTotal: 2, rulesOpen: ids('D-x-1', 'D-x-2') })).toContain('2 of 2 live rules have open domains');
    expect(rec(5, 0, { rulesTotal: 1 })).toContain('1 live rule accounted;');
    expect(rec(5, 0, { rulesTotal: 0 })).toContain('0 live rules accounted;');
    expect(rec(5, 0, { rulesTotal: 2, residuals: ids('D-x-1', 'D-x-2') })).toContain('2 bounded residuals named');
    expect(rec(5, 0, { keyDefects: [{ id: 'a', line: 1 }, { id: 'b', line: 2 }] })).toContain('; 2 key defects (');
  });
});
