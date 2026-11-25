import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { BRIEF_SAVE_STEP, BRIEF_SAVE_TABLE } from '../../../src/core/templates/workflows/archive-change.js';
import { ownerText } from '../../helpers/owner-text.js';

/**
 * brief-render, task 3.3 — the save step's carriage (`orbit-archive-modifications`' `The archive saves the
 * change's brief before the sync`). Since cut-propose-archive (A3) the body carries the step's basic content
 * (`BRIEF_SAVE_STEP`: the command and a save that succeeds) and `references/brief-save.md` carries the table
 * (`BRIEF_SAVE_TABLE`), a CHECKED MIRROR of the owner's: every row of the requirement's table, and the sentence naming
 * its rows, appear in it verbatim.
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

const reference = (): string => {
  const s = skills.find((x) => x.dirName === 'orbit-archive-change')!;
  return s.template.references!.find((r) => r.name === 'brief-save.md')!.content;
};

describe("the archive body carries the brief save step", () => {
  it('the reference carries every row of the owner table and the sentence on its rows, verbatim; the body carries the command', async () => {
    const block = await ownerBlock();
    const rows = block.split('\n').filter((l) => l.startsWith('|'));
    expect(rows).toHaveLength(5); // header, separator, three rows
    for (const r of rows) expect(reference(), r).toContain(r);
    for (const r of rows) expect(BRIEF_SAVE_TABLE, r).toContain(r);
    const rowsSentence = block.split('\n\n').find((p) => p.startsWith('The rows are'));
    expect(rowsSentence).toBeDefined();
    expect(reference()).toContain((rowsSentence as string).replace(/\n/g, ' '));
    expect(BRIEF_SAVE_STEP).toContain('orbit brief --change "<name>" --save');
  });

  // @scenario text orbit-archive-modifications :: The archive saves the change's brief before the sync :: The archive body's basic content handles a save that succeeds
  it("the body's basic content says nothing on success and reads references/brief-save.md only on a non-zero exit", () => {
    const b = body('orbit-archive-change');
    const step = b.slice(b.indexOf("## Step 3.6 — Save the change's brief"), b.indexOf('## Step 3.7'));
    expect(step).toContain('orbit brief --change "<name>" --save');
    expect(step).toContain('On success, say nothing about it and go on');
    expect(step).toContain('On a non-zero exit, read `references/brief-save.md` and follow it from the result you already have.');
    expect(step.split('references/brief-save.md').length - 1).toBe(1);
    // The table is not in the body.
    expect(b).not.toContain('| the save | the archive |');
    expect(reference()).toContain('| the save | the archive |');
  });

  it('the archive body carries it once, as Step 3.6, after the audit sweep and before the sync and the preflight', () => {
    const b = body('orbit-archive-change');
    expect(count(b, BRIEF_SAVE_STEP)).toBe(1);
    const at = [
      '## Step 3.5 — Pre-archive audit-drift sweep',
      "## Step 3.6 — Save the change's brief (BEFORE the sync)",
      BRIEF_SAVE_STEP,
      '## Step 4.9 — PR preflight',
    ].map((s) => b.indexOf(s));
    expect(at.every((i) => i > -1)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
    expect(b.slice(at[1], at[2])).toContain('BEFORE upstream Step 4 (the sync assessment)');
  });

  it('no other body carries the step', () => {
    for (const s of skills) {
      if (s.dirName === 'orbit-archive-change') continue;
      expect(s.template.instructions.includes('orbit brief --change'), s.dirName).toBe(false);
    }
  });
});
