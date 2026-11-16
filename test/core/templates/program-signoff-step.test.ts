import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { PROGRAM_SIGNOFF_STEP } from '../../../src/core/templates/workflows/architect.js';
import { ownerText } from '../../helpers/owner-text.js';

/**
 * program-signoff, task 4.1 — the architect body's Step 5.4 (`orbit-architect`'s `The architect session saves the
 * program brief and asks for the program's sign-off`: "The body carries the two commands, the table and the `orbit emit
 * signoff --doc` invocation with its fields, so an installed skill needs no spec to run the step; a test holds the
 * body carrying them"). The table is a CHECKED MIRROR of the owner's: every row of the requirement's table, and the
 * paragraph naming its rows, appear in `PROGRAM_SIGNOFF_STEP` verbatim. The scenarios tagged here describe what the
 * AI body does; each is declared `text`, the body's carrying of its THEN.
 */

const skills = getSkillTemplates();
const body = (dir: string): string => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template.instructions;
};
const count = (hay: string, needle: string): number => hay.split(needle).length - 1;
const HEADING = "### Requirement: The architect session saves the program brief and asks for the program's sign-off";

async function ownerBlock(): Promise<string> {
  const text = await ownerText('orbit-architect', HEADING);
  const start = text.indexOf(HEADING);
  const next = text.indexOf('\n### Requirement:', start + HEADING.length);
  return text.slice(start, next === -1 ? undefined : next);
}

/** The table row whose first cell is `cell`. */
const row = (cell: string): string => {
  const r = PROGRAM_SIGNOFF_STEP.split('\n').find((l) => l.startsWith(`| ${cell} |`));
  if (!r) throw new Error(`no row ${cell}`);
  return r;
};

describe("the architect body carries the program's save and sign-off (Step 5.4)", () => {
  it('the step carries both commands, every row of the owner table and its rows paragraph, verbatim', async () => {
    const block = await ownerBlock();
    const rows = block.split('\n').filter((l) => l.startsWith('|'));
    expect(rows).toHaveLength(10); // header, separator, eight rows
    for (const r of rows) expect(PROGRAM_SIGNOFF_STEP, r).toContain(r);
    const rowsParagraph = block.split('\n\n').find((p) => p.startsWith('The rows are'));
    expect(rowsParagraph).toBeDefined();
    expect(PROGRAM_SIGNOFF_STEP).toContain((rowsParagraph as string).replace(/\n/g, ' '));
    expect(PROGRAM_SIGNOFF_STEP).toContain('orbit brief <doc> --save --json\norbit brief <doc> --hold --json');
  });

  it('the step carries the emit invocation with its fields and the decision prompt', () => {
    expect(PROGRAM_SIGNOFF_STEP).toContain('orbit emit signoff --doc <doc> --payload <file>');
    for (const f of ['`model`', '`brief`', '`answer`', '`reason`', '`defines`', '`detail`', '`signed`', '`declined`']) {
      expect(PROGRAM_SIGNOFF_STEP, f).toContain(f);
    }
    expect(PROGRAM_SIGNOFF_STEP).toContain('orbit adds `sha256`');
    expect(PROGRAM_SIGNOFF_STEP).toContain('and `closing_review`, the program\'s closing review, and refuses either in the payload');
    expect(PROGRAM_SIGNOFF_STEP).toMatch(/\*\*AskUserQuestion tool\*\* \(chain: decision\)/);
  });

  it('the architect body carries it once, as Step 5.4, after the ratification flow and before the arc-done readout', () => {
    const b = body('orbit-architect');
    expect(count(b, PROGRAM_SIGNOFF_STEP)).toBe(1);
    const at = [
      '### 5. Completion-ratification flow',
      "### 5.4. The program's saved brief and its sign-off (program-signoff)",
      PROGRAM_SIGNOFF_STEP,
      '### 5.5. Arc-done readout',
    ].map((s) => b.indexOf(s));
    expect(at.every((i) => i > -1)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
    // The prompt count names the third prompt; Step 5.5 is unconditional only off `program`.
    expect(b).toContain("the doc selector in Step 1 and Step 5.4's program sign-off are the body's other two prompts");
    expect(b).toContain('Under every sign-off setting but\n`program` the check is unconditional');
  });

  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A default session saves silently and asks nothing
  it('a default session saves silently and asks nothing', () => {
    expect(PROGRAM_SIGNOFF_STEP).toContain("Say nothing about the save in chat under any setting but `program`");
    expect(row('`why: "off"`')).toContain('says nothing about the hold and observes arc-done as it did before this requirement');
    expect(PROGRAM_SIGNOFF_STEP).toContain('With every setting at its default the save writes a copy only for a finished program and says nothing, the hold reports `why: "off"` with no warning, and the arc-done readout is as before');
  });

  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: Under `program`, a done program's session shows the copy and asks
  // @scenario text orbit-pr-lifecycle :: Program PR (Shape A) semantics :: Under `program`, an unsigned program surfaces no READY flip
  it("under program, an unsigned program's copy is shown whole and asked about before any arc-done readout", () => {
    expect(row('`why: "unsigned"`')).toContain('shows the latest saved copy whole, then asks the user to sign off or decline');
    expect(PROGRAM_SIGNOFF_STEP).toContain('show it to the user WHOLE');
    expect(PROGRAM_SIGNOFF_STEP).toContain('BEFORE the arc-done readout of Step 5.5');
    expect(body('orbit-architect')).toContain('under `signoff: program` the\nreadout is shown only when Step 5.4\'s row shows it');
  });

  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A signature lets the arc-done readout appear
  it('a recorded signature lets the arc-done readout appear', () => {
    expect(row('`why: "unsigned"`')).toContain('acts on the answer only once that emit has written the record: on `signed` it shows the arc-done readout');
    expect(PROGRAM_SIGNOFF_STEP).toContain('on a written `signed`, show the arc-done readout');
  });

  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A decline holds the program
  it('a recorded decline holds the program and asks nothing further', () => {
    expect(row('`why: "unsigned"`')).toContain("on `declined` it says the program is not done and the user's reason is recorded, shows no arc-done readout, and asks nothing further");
    expect(PROGRAM_SIGNOFF_STEP).toContain('On **Decline**, when the answer carried no reason, ask the user for it in their own words.');
  });

  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A later copy with the program PR still a draft asks again
  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A later copy with the program PR's state unread asks again
  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A later copy with several candidate program PRs asks again
  it('a later copy asks again while the PR is a draft, unread, or one of several', () => {
    const r = row('`why: "re-sign"`, `held: true`');
    expect(r).toContain('runs `orbit pr program <doc> --json`');
    expect(r).toContain('On every other result it acts as on `unsigned`: `pr.state` `draft` or `unverified`, `pr` `null` with `outcome` `unobserved`, `gh-absent` or `several`');
  });

  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A later copy after the program PR is ready asks nothing
  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: A later copy with no open program PR asks nothing
  it('a later copy asks nothing once the PR is ready, or no open program PR remains', () => {
    const r = row('`why: "re-sign"`, `held: true`');
    expect(r).toContain('asks nothing and shows the arc-done readout only when the call positively settles that no READY flip remains: `observations.pr.state` is `ready`');
    expect(r).toContain('`observations.pr` is `null` with `outcome` `none`, `not-found`');
    expect(row('`why: "re-sign"`, `held: false`')).toContain('asks nothing and shows the arc-done readout');
  });

  // @scenario text orbit-architect :: The architect session saves the program brief and asks for the program's sign-off :: Under `program`, a failed save asks no sign-off
  it('under program, a failed save is stated in one line and asks no sign-off', () => {
    expect(PROGRAM_SIGNOFF_STEP).toContain('Under `program` a failed save is stated in one line, and no sign-off is asked in this session');
    expect(row('the save exited non-zero, or `why: "no-copy"`')).toContain('asks nothing, and shows no arc-done readout');
  });

  // @scenario text orbit-pr-lifecycle :: Program PR (Shape A) semantics :: Arc-done observed with no ratifiable stage remaining
  it('the arc-done check runs on every invocation, never gated on the ratification interaction', () => {
    const b = body('orbit-architect');
    expect(b).toContain('On EVERY invocation — IDEMPOTENT — check whether the doc is ARC-DONE');
    expect(b).toContain('NOT gated on the ratification interaction above');
    expect(b).toContain('A ratification-gated readout would never fire.');
  });
});
