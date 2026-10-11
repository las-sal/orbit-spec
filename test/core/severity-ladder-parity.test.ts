import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate } from '../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';

/**
 * rc02b-severity-ladder, task 1.8 (design D9; R-crc-14's mirror corollary).
 *
 * The external prompt's severity guidance is ONE paragraph, stated ONCE as a fenced production in
 * `orbit-conventions`' Severity ladder requirement. An external reviewer has none of our specs, so the
 * paragraph must EXIST in the prompt — a pointer would point at nothing they can read — and the copy
 * is a CHECKED MIRROR: this test holds the shipped prompt template AND `orbit-review-external`'s
 * reference template byte-equal to the owning fence, resolved through the single-active-owner lookup
 * (an active delta holding the block, else the baseline) so parity stays enforceable mid-change.
 */
const FENCE_FIRST_LINE = "Grade by `orbit-conventions`' Severity ladder.";

async function ladderParagraph(): Promise<string> {
  const owner = await ownerText('orbit-conventions', '```\n' + FENCE_FIRST_LINE);
  const fenced = fencedProduction(owner, FENCE_FIRST_LINE);
  expect(fenced.includes('\n'), 'the ladder paragraph is ONE paragraph (one line in the fence)').toBe(false);
  return fenced;
}

function promptTemplate(): string {
  return getReviewSkillTemplate().references!.find(r => r.name === 'prompt-template.md')!.content;
}

/** The output-format block: from the "Use this exact markdown structure:" line to its closing fence. */
function outputFormatBlock(text: string): string {
  const i = text.indexOf('Use this exact markdown structure:');
  expect(i, 'output-format block present').toBeGreaterThanOrEqual(0);
  const a = text.indexOf('```markdown', i);
  const b = text.indexOf('\n```\n', a) + 4;
  return text.slice(a, b);
}

describe('severity ladder paragraph ↔ prompt template parity (rc02b)', () => {
  it("the review skill's shipped prompt template carries `## Severity` immediately before `## Output format`, byte-equal to the owning fence", async () => {
    const paragraph = await ladderParagraph();
    const template = promptTemplate();
    expect(template).toContain(`## Severity\n\n${paragraph}\n\n## Output format`);
  });

  it("`orbit-review-external`'s reference template carries the same paragraph in the same slot", async () => {
    const paragraph = await ladderParagraph();
    const owner = await ownerText('orbit-review-external', 'Use this exact markdown structure:');
    expect(owner).toContain(`## Severity\n\n${paragraph}\n\n## Output format`);
  });

  it('the paragraph appears ONCE in the prompt template (a mirror, never a restatement beside itself)', async () => {
    const paragraph = await ladderParagraph();
    const template = promptTemplate();
    expect(template.split(paragraph).length - 1).toBe(1);
  });

  it("the output-format block is byte-equal between the shipped prompt template and `orbit-review-external`'s reference template (task 5.1's confirm, as a test)", async () => {
    const owner = await ownerText('orbit-review-external', 'Use this exact markdown structure:');
    expect(outputFormatBlock(promptTemplate())).toBe(outputFormatBlock(owner));
  });

  it('the output-format block carries the Reproduction line in the CRITICAL entry and a Blocks section before Notes', () => {
    const block = outputFormatBlock(promptTemplate());
    const crit = block.indexOf('## CRITICAL');
    const warn = block.indexOf('## WARNING');
    expect(block.slice(crit, warn)).toContain('**Reproduction**:');
    expect(block.indexOf('## Blocks')).toBeGreaterThan(block.indexOf('## SUGGESTION'));
    expect(block.indexOf('## Blocks')).toBeLessThan(block.indexOf('## Notes'));
  });
});
