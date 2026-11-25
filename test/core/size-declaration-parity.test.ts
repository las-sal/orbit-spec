import { describe, it, expect } from 'vitest';
import { getOrbitProposeSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { SIZE_DECLARATION_PRODUCTION } from '../../src/core/change-size.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc09a-size-record, tasks 5.2–5.3 (design D5; R-crc-14's mirror corollary).
 *
 * The `## Size` production is stated ONCE, as a fenced production in `orbit-change-size`'s `A breach
 * is declared in the proposal's Size section`. The engine's parser exports it as one constant, and the
 * propose body interpolates that constant as a CHECKED MIRROR, because an adopter's installed skill has
 * neither our specs nor our parser. This test holds the constant byte-equal to the owner's fence through
 * the single-active-owner lookup (the active delta while the change is open, the baseline after
 * archive), and the rendered propose skill to the same text. Since conditional-steps the brief's full text, the mirror
 * among it, is the propose skill's `references/size-brief.md`; the body keeps the brief's basic content.
 */
const FIRST_LINE = '## Size';
const ANCHOR = '```\n## Size\n- <dimension>';

const body = (): string => getOrbitProposeSkillTemplate().instructions;
/** The brief's full text: the propose skill's `references/size-brief.md`. */
const section = (): string => {
  const r = (getOrbitProposeSkillTemplate().references ?? []).find((x) => x.name === 'size-brief.md');
  expect(r, 'the propose skill ships references/size-brief.md').toBeDefined();
  return (r as { content: string }).content;
};
/** The brief's basic content, in the body's `Size brief after generation` section. */
const basic = (): string => {
  const s = body().split('\n## Size brief after generation')[1];
  expect(s, 'the body carries a "Size brief after generation" section').toBeDefined();
  return s.split('\n## PR lifecycle')[0];
};

describe('size declaration production ↔ owner ↔ propose body parity (rc09a)', () => {
  it("the exported constant is byte-equal to `orbit-change-size`'s fenced production", async () => {
    const owner = await ownerText('orbit-change-size', ANCHOR);
    expect(fencedProduction(owner, FIRST_LINE)).toBe(SIZE_DECLARATION_PRODUCTION);
  });

  // @scenario behaviour orbit-propose-modifications :: Size brief after generation :: The mirror matches its owner
  it("the rendered propose skill's `## Size` production is byte-equal to the owner's fence", async () => {
    const owner = await ownerText('orbit-change-size', ANCHOR);
    expect(fencedProduction(section(), FIRST_LINE)).toBe(fencedProduction(owner, FIRST_LINE));
  });

  it('the mirror says it is one, names its owner, and appears ONCE, in the reference and not in the body', () => {
    const s = section();
    expect(s).toMatch(/CHECKED MIRROR/);
    expect(s).toContain("`orbit-change-size`'s `A breach is declared in the proposal's\nSize section`");
    expect(s.split(SIZE_DECLARATION_PRODUCTION).length - 1).toBe(1);
    expect(body().split(SIZE_DECLARATION_PRODUCTION).length - 1).toBe(0);
  });

  // @scenario text orbit-propose-modifications :: Size brief after generation :: The basic content handles a quiet size check
  it('the basic content says nothing about size on a null ceiling or no breaches, and names the reference only otherwise', () => {
    const b = basic();
    const quiet = b.indexOf('When `ceiling` is `null` or `breaches` is empty, say nothing about size.');
    const other = b.indexOf('Otherwise, or on a non-zero exit, read `references/size-brief.md` and follow it from the result you already have.');
    expect(quiet).toBeGreaterThan(-1);
    expect(other).toBeGreaterThan(quiet);
    expect(b.split('references/size-brief.md').length - 1).toBe(1);
    expect(b).toContain('read `size` from `orbit status --change "<name>" --json`');
    expect(b).toContain("BEFORE Step 0d's move, Phase 3 and the completion emit");
  });
});

describe('the propose body carries the size brief (rc09a task 5.3)', () => {
  // @scenario text orbit-propose-modifications :: Size brief after generation :: A check that is off says nothing
  it('the OFF row and the empty-breaches row say nothing about size', () => {
    const s = section();
    expect(s).toContain('| `ceiling` is `null` (the check is OFF) | says nothing about size |');
    expect(s).toContain('| `breaches` is empty | says nothing about size |');
  });

  it('the declared row states each declared breach at the completion summary', () => {
    expect(section()).toContain('| every breach `declared` | states each declared breach in one line, at the completion summary |');
  });

  // @scenario text orbit-propose-modifications :: Size brief after generation :: An undeclared breach is briefed before the emit
  it('the undeclared row briefs before the completion emit, through AskUserQuestion, from the status JSON', () => {
    const s = section();
    expect(s).toContain(
      '| any breach not `declared` | BRIEFS the user before the completion emit: each undeclared dimension with its figure and maximum, and the two routes below |'
    );
    expect(s).toContain('ask with **AskUserQuestion**');
    expect(s).toContain('`orbit status --change "<name>" --json`');
  });

  // @scenario text orbit-propose-modifications :: Size brief after generation :: Declare writes the user's reason
  it("the Declare route writes `## Size` with the user's reason in the user's words", () => {
    const s = section();
    expect(s).toMatch(/- \*\*Declare\*\* — write a `## Size` section into `proposal\.md`/);
    expect(s).toContain("carrying the user's reason in the user's words. Then run `orbit validate \"<name>\" --strict`.");
  });

  // @scenario text orbit-propose-modifications :: Size brief after generation :: Split leaves the artifacts in place
  it('the Split route recommends explore or the architecture doc and leaves the artifacts in place', () => {
    const s = section();
    expect(s).toMatch(/- \*\*Split\*\* — the change is split before review/);
    expect(s).toContain('`/orbit:explore <name>` or the architecture doc');
    expect(s).toContain('Leave every artifact in place and write no\n  `## Size` section');
    // The rest of the flow runs unchanged after Split (walk D2: A).
    expect(s).toContain("The rest of the\n  flow runs unchanged — Step 0d's move, the PR choreography's Phase 3 and the completion emit");
  });

  // @scenario text orbit-propose-modifications :: Size brief after generation :: Split replaces the review prompt
  it('the split recommendation replaces the completion prompt to review, and the completion override says so', () => {
    expect(section()).toContain('The split recommendation REPLACES the completion prompt to review');
    expect(body()).toMatch(
      /\*\*Completion-prompt override \(chat\)\*\*:[^\n]*except after the size brief's \*\*Split\*\* route, whose split recommendation is the closing chat line instead\./
    );
  });

  // @scenario text orbit-propose-modifications :: Size brief after generation :: A declaration lands before the PR commit
  it("the brief runs before Step 0d's move, the PR choreography's Phase 3 and the completion emit, in both modes", () => {
    const s = section();
    expect(s).toContain('standalone mode alike');
    // The validation before the brief is non-strict, so a breach never stops the flow before it.
    expect(s).toContain('passes NON-STRICT — size never fails\nnon-strict validation');
    expect(s).toContain("BEFORE Step 0d's move, BEFORE the PR choreography's Phase 3 (commit, push, draft PR) and BEFORE the\ncompletion emit");
    // cut-propose-archive (P1): Step 0d is propose's references/consume-mode.md, which points back at the body's brief;
    // the body still says Step 0d runs after it.
    const consume = getOrbitProposeSkillTemplate().references!.find((r) => r.name === 'consume-mode.md')!.content;
    expect(consume).toContain("non-strict validation passes) and the\nbody's size brief has run, FIRST");
    expect(body()).toContain('its Step 0d runs after the size brief');
  });
});
