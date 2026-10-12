import { describe, it, expect } from 'vitest';
import {
  PR_ARCHIVE_TAIL_REFERENCE,
  PR_CHOREOGRAPHY_REFERENCE,
  PR_CONSUMPTION_TABLE,
  PR_TITLE_RULE,
} from '../../src/core/templates/workflows/pr-choreography.js';
import { ownerText } from '../helpers/owner-text.js';

/**
 * rc12-body-adoption (D-rba-4; R-crc-14's mirror corollary) — a sibling of
 * `deferral-refusals-parity.test.ts`.
 *
 * `orbit-pr-lifecycle`'s `PR actions are workflow-body choreography (zero engine git)` owns the
 * table a body acts on an `orbit pr` record by, and `Agent-written landmark descriptions at seams
 * only` owns the PR title rule. An installed skill cannot open either owner, so the propose/ff and
 * archive references carry the table as a CHECKED MIRROR and the propose/ff reference quotes the
 * title clause; this test holds both to the requirement as it stands (the active delta while the
 * change is open, the baseline after).
 */
const TABLE_HEAD = '| the call returns |';
const TITLE_HEAD = '`<change-name>: <summary>` for per-change PRs';
const collapse = (t: string) => t.replace(/\s+/g, ' ');

function tableIn(text: string): string {
  const i = text.indexOf(TABLE_HEAD);
  if (i < 0) throw new Error('no consumption table');
  const lines = text.slice(i).split('\n');
  const end = lines.findIndex((l) => !l.startsWith('|'));
  return lines.slice(0, end < 0 ? lines.length : end).join('\n');
}

describe('PR consumption table and title rule ↔ references parity (rc12-body-adoption)', () => {
  it("the table mirror is byte-equal to the owner's table", async () => {
    const owner = await ownerText('orbit-pr-lifecycle', TABLE_HEAD);
    expect(PR_CONSUMPTION_TABLE).toBe(tableIn(owner));
  });

  it('the propose/ff and archive references carry the table exactly once', () => {
    for (const ref of [PR_CHOREOGRAPHY_REFERENCE, PR_ARCHIVE_TAIL_REFERENCE]) {
      expect(tableIn(ref)).toBe(PR_CONSUMPTION_TABLE);
      expect(ref.split(TABLE_HEAD).length - 1).toBe(1);
      expect(ref).toContain('CHECKED COPY');
    }
  });

  it("the title quote is the owner's clause, whitespace-collapsed, and the propose/ff reference carries it", async () => {
    const owner = await ownerText('orbit-pr-lifecycle', '`<change-name>: <summary>`');
    expect(collapse(owner)).toContain(PR_TITLE_RULE);
    expect(PR_TITLE_RULE.startsWith(TITLE_HEAD)).toBe(true);
    expect(PR_CHOREOGRAPHY_REFERENCE).toContain(PR_TITLE_RULE);
  });
});
