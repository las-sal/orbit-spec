import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { BRIEF_SAVE_STEP, SIGNOFF_HOLD_STEP } from '../../../src/core/templates/workflows/archive-change.js';
import { ownerText } from '../../helpers/owner-text.js';

/**
 * program-brief, task 4.3 — the sign-off hold's carriage (`orbit-archive-modifications`' `The archive holds for a
 * per-change sign-off`: "Each body carries the command, the table, and the `orbit emit signoff` invocation with its
 * fields, so an installed skill needs no spec to run the step; a test holds each body carrying them"). The table is a
 * CHECKED MIRROR of the owner's: every row of the requirement's table, and the paragraph naming its rows, appear in
 * `SIGNOFF_HOLD_STEP` verbatim.
 */

const skills = getSkillTemplates();
const body = (dir: string): string => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template.instructions;
};
const count = (hay: string, needle: string): number => hay.split(needle).length - 1;
const reference = (dir: string, name: string): string | undefined =>
  (skills.find((x) => x.dirName === dir)?.template.references ?? []).find((r) => r.name === name)?.content;
const HEADING = '### Requirement: The archive holds for a per-change sign-off';

async function ownerBlock(): Promise<string> {
  const text = await ownerText('orbit-archive-modifications', HEADING);
  const start = text.indexOf(HEADING);
  const next = text.indexOf('\n### Requirement:', start + HEADING.length);
  return text.slice(start, next === -1 ? undefined : next);
}

describe('the archive bodies carry the sign-off hold', () => {
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: Under `change`, the archive shows the copy and asks
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: A decline stops the archive and keeps the change active
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: A signature lets the archive go on
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: A signature whose record is not written stops the archive
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: A copy already signed is not asked again
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: An unrecognized value warns and goes on
  // @scenario text orbit-archive-modifications :: The archive saves the change's brief before the sync :: A failed save under `change` stops at the hold
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: A default archive reads the hold and asks nothing
  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: A default archive is not stopped by an unreadable history
  it('the step carries the hold command, every row of the owner table and its rows paragraph, verbatim', async () => {
    const block = await ownerBlock();
    const rows = block.split('\n').filter((l) => l.startsWith('|'));
    expect(rows).toHaveLength(7); // header, separator, five rows
    for (const r of rows) expect(SIGNOFF_HOLD_STEP, r).toContain(r);
    const rowsParagraph = block.split('\n\n').find((p) => p.startsWith('The rows are'));
    expect(rowsParagraph).toBeDefined();
    expect(SIGNOFF_HOLD_STEP).toContain((rowsParagraph as string).replace(/\n/g, ' '));
    expect(SIGNOFF_HOLD_STEP).toContain('orbit brief --change "<name>" --hold --json');
  });

  it('the step carries the emit invocation with its fields, the copy shown whole, and the decision prompt', () => {
    expect(SIGNOFF_HOLD_STEP).toContain('orbit emit signoff --change "<name>" --payload <file>');
    for (const f of ['`model`', '`brief`', '`answer`', '`reason`', '`defines`', '`detail`', '`signed`', '`declined`']) {
      expect(SIGNOFF_HOLD_STEP, f).toContain(f);
    }
    expect(SIGNOFF_HOLD_STEP).toContain('orbit adds `sha256`');
    expect(SIGNOFF_HOLD_STEP).toContain('show it to the user WHOLE');
    expect(SIGNOFF_HOLD_STEP).toMatch(/\*\*AskUserQuestion tool\*\* \(chain: decision\)/);
    expect(SIGNOFF_HOLD_STEP).toContain('the chain does not continue after it');
  });

  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: The archive body's basic content handles the default hold
  it("the archive body carries the step's basic content as Step 3.7, after the save step and before the sync and the preflight, and ships the whole step in references/signoff-hold.md", () => {
    const b = body('orbit-archive-change');
    expect(count(b, SIGNOFF_HOLD_STEP)).toBe(0);
    const ref = reference('orbit-archive-change', 'signoff-hold.md');
    expect(ref).toBeDefined();
    expect(count(ref as string, SIGNOFF_HOLD_STEP)).toBe(1);
    const basic = 'Directly after Step 3.6\'s save, BEFORE upstream Step 4, in every mode, run `orbit brief --change "<name>" --hold --json`';
    const at = [
      "## NEW Step 3.6 — Save the change's brief (BEFORE the sync)",
      BRIEF_SAVE_STEP,
      '## NEW Step 3.7 — The sign-off hold (BEFORE the sync)',
      basic,
      '## NEW Step 4.9 — PR preflight',
    ].map((s) => b.indexOf(s));
    expect(at.every((i) => i > -1)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
    const step = b.slice(at[2], at[4]);
    // `why: "off"` is handled in the body; every other result and a non-zero exit read the reference.
    const off = step.indexOf('On `why: "off"`, go on silently, stating any warning in one line.');
    const other = step.indexOf('On any other result or a non-zero exit, read `references/signoff-hold.md` and follow it from the save\'s outcome and the result you already have, before the sync.');
    expect(off).toBeGreaterThan(-1);
    expect(other).toBeGreaterThan(off);
    expect(count(step, 'references/signoff-hold.md')).toBe(1);
  });

  // @scenario text orbit-archive-modifications :: The archive holds for a per-change sign-off :: Bulk archive asks per change
  it('the bulk-archive body carries it once per change, after that change\'s save and before its Step 8a sync, reporting a stopped change', () => {
    const b = body('orbit-bulk-archive-change');
    expect(count(b, SIGNOFF_HOLD_STEP)).toBe(1);
    const save = b.indexOf(BRIEF_SAVE_STEP);
    const hold = b.indexOf('## Per-change sign-off hold');
    expect(save).toBeGreaterThan(-1);
    expect(hold).toBeGreaterThan(save);
    expect(b.slice(hold, b.indexOf(SIGNOFF_HOLD_STEP))).toContain('directly after its brief save above and before its Step 8a sync');
    expect(b.slice(b.indexOf(SIGNOFF_HOLD_STEP))).toContain(
      'A change whose hold stops is not archived and stays active, and the batch goes on with the others; the Step 9 summary reports it among the changes not archived'
    );
  });

  it("no other body carries the change's hold; the architect body carries only the program's (program-signoff)", () => {
    for (const s of skills) {
      if (s.dirName === 'orbit-archive-change' || s.dirName === 'orbit-bulk-archive-change') continue;
      const b = s.template.instructions;
      if (s.dirName === 'orbit-architect') {
        expect(b.includes('--change "<name>" --hold'), s.dirName).toBe(false);
        expect(b.includes('orbit emit signoff --change'), s.dirName).toBe(false);
        expect(b).toContain('orbit brief <doc> --hold --json');
        // conditional-steps: the emit invocation moved with the hold's table to the architect's reference.
        expect(reference(s.dirName, 'program-signoff.md')).toContain('orbit emit signoff --doc <doc>');
        continue;
      }
      expect(b.includes('--hold'), s.dirName).toBe(false);
      expect(b.includes('orbit emit signoff'), s.dirName).toBe(false);
    }
  });
});
