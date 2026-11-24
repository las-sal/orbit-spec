import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';

/**
 * tighten-bodies (reduce-orbit-phase1, D-tb-10, D-tb-11) — `orbit-skill-generation`'s `Reference files are linked from
 * their skill and long ones open with contents`: every reference over 100 lines opens, after its `# Reference:` title,
 * with a hand-written `## Contents` list whose entries each name a heading the file carries; review's body names its two
 * prompt references.
 */
const skills = getSkillTemplates();
const LONG = 100;

const lineCount = (content: string): number => content.split('\n').length - (content.endsWith('\n') ? 1 : 0);

/** Why a reference fails the contents rule, or null. */
function contentsFailure(content: string): string | null {
  if (lineCount(content) <= LONG) return null;
  const lines = content.split('\n');
  if (!lines[0].startsWith('# Reference:')) return 'its first line is not a `# Reference:` title';
  const firstSection = lines.slice(1).find((l) => /^#{1,6} /.test(l));
  if (firstSection !== '## Contents') return `its first section after the title is ${JSON.stringify(firstSection ?? null)}, not ## Contents`;
  const at = lines.indexOf('## Contents');
  const entries: string[] = [];
  for (const l of lines.slice(at + 1)) {
    if (l.trim() === '' && entries.length === 0) continue;
    const m = l.match(/^\s*- (.+)$/);
    if (!m) break;
    entries.push(m[1]);
  }
  if (entries.length === 0) return 'its contents list is empty';
  const headings = new Set(lines.map((l) => l.match(/^#{2,6} (.+)$/)?.[1]).filter((h): h is string => h !== undefined && h !== 'Contents'));
  const missing = entries.filter((e) => !headings.has(e));
  return missing.length ? `its contents list names sections the file lacks: ${missing.join(' | ')}` : null;
}

describe('reference files open with their contents (tighten-bodies)', () => {
  const seen = new Map<string, string>();
  for (const s of skills) for (const r of s.template.references ?? []) seen.set(`${s.dirName}/references/${r.name}`, r.content);

  // @scenario text orbit-skill-generation :: Reference files are linked from their skill and long ones open with contents :: A long reference opens with its contents
  it('every reference over 100 lines opens with a contents list naming headings it carries', () => {
    const failures = [...seen].map(([path, content]) => [path, contentsFailure(content)]).filter(([, f]) => f !== null);
    expect(failures).toEqual([]);
  });

  it('the eleven long references of the stage are among them, each opening with its list', () => {
    const long = new Set([...seen].filter(([, c]) => lineCount(c) > LONG).map(([p]) => p.split('/references/')[1]));
    for (const name of [
      'decision-records.md', 'pr-choreography.md', 'archive-summary-schema.md', 'run-summary-schema.md', 'external-handoff.md',
      'blind-pair.md', 'prompt-template.md', 'external-findings-format.md', 'internal-findings-format.md', 'resolution-detail.md',
    ]) {
      expect(long.has(name), name).toBe(true);
    }
    // prompt-template.md's headings after its title belong to the prompt it holds: its list names the template as one section.
    const template = seen.get('orbit-review/references/prompt-template.md')!;
    expect(template).toContain('## Contents\n\n- Template\n');
  });

  // @scenario text orbit-skill-generation :: Reference files are linked from their skill and long ones open with contents :: A reference with no contents list fails the suite
  it('mutation: a long reference with no list, a list naming a missing section, and a list after another section each fail', () => {
    const ref = seen.get('orbit-review/references/blind-pair.md')!;
    expect(contentsFailure(ref)).toBeNull();
    const noList = ref.replace(/## Contents\n\n(?:\s*- [^\n]*\n)+\n/, '');
    expect(noList).not.toBe(ref);
    expect(contentsFailure(noList)).toMatch(/not ## Contents/);
    expect(contentsFailure(ref.replace('- Session end', '- Session start'))).toMatch(/Session start/);
    expect(contentsFailure(ref.replace('# Reference: the blind pair (`--reviewer blind-pair`)\n', '# Reference: the blind pair (`--reviewer blind-pair`)\n\n## Intro\n'))).toMatch(/Intro/);
    // A file at or under 100 lines owes no list.
    expect(contentsFailure('# Reference: short\n\nbody\n')).toBeNull();
  });

  // @scenario text orbit-skill-generation :: Reference files are linked from their skill and long ones open with contents :: Review's body names its prompt references
  it("review's body names its two prompt references where Step 3 dispatches the external reviewer", () => {
    // cut-review-walk (V4): the flag table moved to `references/flags-detail.md`; Step 3's dispatch sentence names them.
    const review = skills.find((s) => s.dirName === 'orbit-review')!.template.instructions;
    const row = review.split('\n').find((l) => l.includes('`external` loads `references/external-handoff.md` and follows it'))!;
    expect(row).toContain('`references/prompt-template.md`');
    expect(row).toContain('`references/mode-sections.md`');
  });
});
