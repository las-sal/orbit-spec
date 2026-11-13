import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { BRIEF_SAVE_STEP } from '../../../src/core/templates/workflows/archive-change.js';
import { ownerText } from '../../helpers/owner-text.js';

/**
 * brief-render, task 3.3 — the save step's carriage (`orbit-archive-modifications`' `The archive saves the
 * change's brief before the sync`: "Each body carries the command and the table, so an installed skill needs no
 * spec to run the step; a test holds each body carrying them"). The table is a CHECKED MIRROR of the owner's:
 * every row of the requirement's table, and the sentence naming its rows, appear in `BRIEF_SAVE_STEP` verbatim.
 */

const skills = getSkillTemplates();
const body = (dir: string): string => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template.instructions;
};
const count = (hay: string, needle: string): number => hay.split(needle).length - 1;
const HEADING = "### Requirement: The archive saves the change's brief before the sync";

async function ownerBlock(): Promise<string> {
  const text = await ownerText('orbit-archive-modifications', HEADING);
  const start = text.indexOf(HEADING);
  const next = text.indexOf('\n### Requirement:', start + HEADING.length);
  return text.slice(start, next === -1 ? undefined : next);
}

describe("the archive bodies carry the brief save step", () => {
  it('the step carries the command and every row of the owner table, verbatim', async () => {
    const block = await ownerBlock();
    const rows = block.split('\n').filter((l) => l.startsWith('|'));
    expect(rows).toHaveLength(5); // header, separator, three rows
    for (const r of rows) expect(BRIEF_SAVE_STEP, r).toContain(r);
    const rowsSentence = block.split('\n\n').find((p) => p.startsWith('The rows are'));
    expect(rowsSentence).toBeDefined();
    expect(BRIEF_SAVE_STEP).toContain((rowsSentence as string).replace(/\n/g, ' '));
    expect(BRIEF_SAVE_STEP).toContain('orbit brief --change "<name>" --save');
  });

  it('the archive body carries it once, as Step 3.6, after the audit sweep and before the sync and the preflight', () => {
    const b = body('orbit-archive-change');
    expect(count(b, BRIEF_SAVE_STEP)).toBe(1);
    const at = [
      '## NEW Step 3.5 — Pre-archive audit-drift sweep',
      "## NEW Step 3.6 — Save the change's brief (BEFORE the sync)",
      BRIEF_SAVE_STEP,
      '## NEW Step 4.9 — PR preflight',
    ].map((s) => b.indexOf(s));
    expect(at.every((i) => i > -1)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
    expect(b.slice(at[1], at[2])).toContain('BEFORE upstream Step 4 (the sync assessment)');
  });

  it('the bulk-archive body carries it once per change, after the fingerprint check and before the Step 8a sync', () => {
    const b = body('orbit-bulk-archive-change');
    expect(count(b, BRIEF_SAVE_STEP)).toBe(1);
    const fp = b.indexOf('## Per-change base-fingerprint check');
    const save = b.indexOf('## Per-change brief save');
    expect(fp).toBeGreaterThan(-1);
    expect(save).toBeGreaterThan(fp);
    expect(b.slice(save, b.indexOf(BRIEF_SAVE_STEP))).toContain('after its base-fingerprint check above and immediately before its Step 8a sync');
    expect(b.slice(b.indexOf(BRIEF_SAVE_STEP))).toContain("A failure goes into THAT change's own archive run summary's `warnings`; the batch goes on.");
  });

  it('no other body carries the step', () => {
    for (const s of skills) {
      if (s.dirName === 'orbit-archive-change' || s.dirName === 'orbit-bulk-archive-change') continue;
      expect(s.template.instructions.includes('orbit brief --change'), s.dirName).toBe(false);
    }
  });
});
