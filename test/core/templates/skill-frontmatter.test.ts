import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { generateSkillContent, getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import type { SkillTemplate } from '../../../src/core/templates/types.js';

/**
 * tighten-bodies (reduce-orbit-phase1, D-tb-9) — every generated frontmatter parses as YAML with a strict parser, and
 * every description fits and says when to use the skill (`orbit-skill-generation`'s `Frontmatter metadata pass-through`).
 */
const skills = getSkillTemplates();

/** The frontmatter text of a generated SKILL.md: between the opening `---` and the closing one. */
const frontmatter = (content: string): string => {
  expect(content.startsWith('---\n')).toBe(true);
  const end = content.indexOf('\n---\n', 4);
  expect(end).toBeGreaterThan(0);
  return content.slice(4, end);
};

/** A when-clause: a "Use" clause containing "when", or "Use after". */
const WHEN_CLAUSE = /\bUse (?:[^.]*\bwhen\b|after\b)/;

/** Why a template's frontmatter fails the rule, or null. */
function frontmatterFailure(template: SkillTemplate): string | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = parse(frontmatter(generateSkillContent(template, '1.2.3')), { strict: true, uniqueKeys: true }) as Record<string, unknown>;
  } catch (e) {
    return `does not parse: ${(e as Error).message.split('\n')[0]}`;
  }
  if (parsed.name !== template.name) return `name parses as ${JSON.stringify(parsed.name)}`;
  if (parsed.description !== template.description) return 'description does not parse string-equal';
  if (template.description.length > 1024) return `description is ${template.description.length} characters`;
  if (!WHEN_CLAUSE.test(template.description)) return 'description has no when-clause';
  return null;
}

describe('generated frontmatter (tighten-bodies)', () => {
  for (const s of skills) {
    // @scenario text orbit-skill-generation :: Frontmatter metadata pass-through :: Every generated frontmatter parses and every description fits
    it(`${s.dirName}: parses strictly, its description string-equal, at most 1,024 characters, with a when-clause`, () => {
      expect(frontmatterFailure(s.template)).toBeNull();
    });
  }

  // @scenario text orbit-skill-generation :: Frontmatter metadata pass-through :: A description containing a colon parses
  it("review's description, which contains `: `, is quoted and parses string-equal", () => {
    const review = skills.find((s) => s.dirName === 'orbit-review')!.template;
    expect(review.description).toContain(': ');
    const fm = frontmatter(generateSkillContent(review, '1.2.3'));
    expect(fm).toContain(`description: ${JSON.stringify(review.description)}`);
    expect((parse(fm, { strict: true }) as { description: string }).description).toBe(review.description);
  });

  // @scenario text orbit-skill-generation :: Frontmatter metadata pass-through :: A plain value stays bare
  it('a plain value is written bare, exactly as before', () => {
    const apply = skills.find((s) => s.dirName === 'orbit-apply-change')!.template;
    const fm = frontmatter(generateSkillContent(apply, '1.2.3'));
    expect(fm.split('\n')[0]).toBe('name: orbit-apply-change');
    expect(fm).toContain('\nlicense: MIT\n');
    expect(fm).toContain('\ncompatibility: Requires orbit CLI.\n');
  });

  it('mutation: each check fails on a clean mutation', () => {
    const base = skills.find((s) => s.dirName === 'orbit-review')!.template;
    expect(frontmatterFailure({ ...base, description: 'x'.repeat(1020) + ' Use when y.' })).toMatch(/characters/);
    expect(frontmatterFailure({ ...base, description: 'Reviews a change.' })).toMatch(/when-clause/);
    // The generator as it was: a bare description containing `: ` does not parse.
    const bare = generateSkillContent(base, '1.2.3').replace(`description: ${JSON.stringify(base.description)}`, `description: ${base.description}`);
    expect(() => parse(frontmatter(bare), { strict: true })).toThrow();
    // The when-clause rule accepts audit-drift's unchanged "Use standalone when" and "Use after".
    expect(WHEN_CLAUSE.test('Use standalone when something feels off.')).toBe(true);
    expect(WHEN_CLAUSE.test('Use after a review writes findings.')).toBe(true);
    expect(WHEN_CLAUSE.test('Useful when bored.')).toBe(false);
  });
});
