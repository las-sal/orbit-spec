import { describe, expect, it } from 'vitest';
import { getExploreSkillTemplate } from '../../../src/core/templates/workflows/explore.js';

/**
 * cut-explore-onboard (reduce-orbit-phase2, R-rop2-13; design D2) — `orbit-explore-modifications`' `Upstream explore
 * stance preserved`: the illustrative upstream text the stance already states leaves the explore skill, each removal
 * named by the requirement's table, and every line the table names as a restatement is still in the body.
 */
const t = getExploreSkillTemplate();
const body = t.instructions;
/** Everything the skill ships: its body and its references. */
const shipped = [body, ...(t.references ?? []).map((r) => r.content)];
const REMOVED = ['## Handling Different Entry Points', 'COLLABORATION SPECTRUM', '**Visualize**', 'Use ASCII diagrams liberally        │', '## What We Figured Out'];
/** The first removed phrase some shipped text still carries, or null. */
const survivor = (texts: string[]): string | null => REMOVED.find((ph) => texts.some((text) => text.includes(ph))) ?? null;
const guardrails = (text: string): string[] => {
  const at = text.indexOf('## Guardrails\n\n');
  const rest = text.slice(at + '## Guardrails\n\n'.length);
  return rest.slice(0, rest.indexOf('\n\n')).split('\n');
};

describe("explore's upstream removals (R-rop2-13)", () => {
  // @scenario text orbit-explore-modifications :: Upstream explore stance preserved :: The illustrative upstream text is gone
  it('carries no entry-point dialogues, no Visualize box, no summary template, and exactly the three kept Guardrails lines', () => {
    expect(survivor(shipped)).toBeNull();
    expect(guardrails(body)).toEqual([
      "- **Don't fake understanding** - If something is unclear, dig deeper",
      "- **Don't auto-capture** - Offer to save insights, don't just do it",
      "- **Do question assumptions** - Including the user's and your own",
    ]);
    // The summary template's two sentences joined as one; the point after it stays.
    expect(body).toContain('When it feels like things are crystallizing, you might summarize what you figured out, but this summary is optional. Sometimes the thinking IS the value.');
    // The separator before the removed section stays, between "What You Don't Have To Do" and "Ending Discovery".
    expect(body).toContain("- Be brief (this is thinking time)\n\n---\n\n## Ending Discovery");
  });

  // @scenario text orbit-explore-modifications :: Upstream explore stance preserved :: A removed Guardrails line's statement stays
  it("each line the table names as a Guardrails restatement is still in the body", () => {
    for (const line of [
      '**IMPORTANT: Explore mode is for thinking, not implementing.**',
      "- **Patient** - Don't rush to conclusions, let the shape of the problem emerge",
      "- **Visual** - Use ASCII diagrams liberally when they'd help clarify thinking",
      "- **Grounded** - Explore the actual codebase when relevant, don't just theorize",
    ]) {
      expect(body, line).toContain(line);
    }
  });

  it('mutation: a dialogue left in a reference, or a fourth Guardrails line, fails', () => {
    expect(survivor([...shipped, '      COLLABORATION SPECTRUM'])).toBe('COLLABORATION SPECTRUM');
    const extra = body.replace("- **Do question assumptions**", "- **Do visualize** - A good diagram is worth many paragraphs\n- **Do question assumptions**");
    expect(guardrails(extra)).toHaveLength(4);
  });
});
