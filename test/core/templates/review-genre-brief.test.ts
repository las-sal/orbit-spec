import { describe, it, expect } from 'vitest';
import { getSkillTemplates, generateSkillContent } from '../../../src/core/shared/skill-generation.js';

/**
 * rc03b-pass-genres, task 1.1 — `orbit-review`'s ADDED requirement `Review-genre passes read the
 * artifacts and the code, never the trail's findings`, scenario "Generated surface grep-tested by a
 * decidable rule". The brief rule itself is `orbit-conventions`' `Review mode decision framework`'s;
 * this test is its residual METHOD over the file-resident surface (the fresh launching brief has no
 * artifact and is held by the rule alone — the owner's stated residual).
 *
 * The generated files are composed exactly as the generator composes them: `SKILL.md` through
 * `generateSkillContent`, each `references/<name>.md` as the template's reference content.
 *
 * TWO rules, both decidable from the text:
 *  - PHRASE (every generated skill): "still open", "Resolved since", "carry context" are hits on
 *    any line; "iteration history" is a hit only on a line that also names `.orbit-runs/`.
 *  - REGION (the review skill only): a `.orbit-runs/` mention is a hit only inside a BRIEF REGION —
 *    `references/prompt-template.md` outside its OUTPUT SECTIONS (`## Output format — write to:`,
 *    `## After completing the review`, and the reference's own header line naming where the file is
 *    written), or inside the fenced brief of the body's "Dispatching a fresh pass" step.
 */

export type Hit = { skill: string; file: string; line: number; rule: 'PHRASE' | 'REGION'; text: string };

const PHRASES = ['still open', 'Resolved since', 'carry context'];
const TRAIL = '.orbit-runs/';
const OUTPUT_SECTION = '## Output format — write to:';
const AFTER_SECTION = '## After completing the review';
const HEADER_LINE = 'This is the canonical template for the file written to';
const FRESH_STEP = 'Dispatching a fresh pass';

type GeneratedSkill = { dirName: string; files: Array<[string, string]> };

function generatedSurface(): GeneratedSkill[] {
  return getSkillTemplates().map(({ template, dirName }) => ({
    dirName,
    files: [
      ['SKILL.md', generateSkillContent(template, 'test')],
      ...(template.references ?? []).map(r => [`references/${r.name}`, r.content] as [string, string]),
    ],
  }));
}

export function phraseHits(skill: string, file: string, text: string): Hit[] {
  const hits: Hit[] = [];
  text.split('\n').forEach((l, i) => {
    const phrase = PHRASES.some(p => l.includes(p)) || (l.includes('iteration history') && l.includes(TRAIL));
    if (phrase) hits.push({ skill, file, line: i + 1, rule: 'PHRASE', text: l.trim() });
  });
  return hits;
}

/** Prompt template: every `.orbit-runs/` line outside the output sections and the header line. */
export function promptTemplateRegionHits(text: string): Hit[] {
  const lines = text.split('\n');
  const hits: Hit[] = [];
  let inOutput = false;
  lines.forEach((l, i) => {
    // The output sections run from their heading to the template's closing four-backtick fence; the
    // output-format section ends where the after-completion section begins (both are exempt, so the
    // boundary between them needs no decision). A `##` heading that is neither ends the exemption.
    if (l.startsWith(OUTPUT_SECTION) || l.startsWith(AFTER_SECTION)) inOutput = true;
    else if (l.startsWith('````')) inOutput = false;
    else if (/^## /.test(l) && inOutput && !insideInnerFence(lines, i)) inOutput = false;
    if (!l.includes(TRAIL) || inOutput || l.startsWith(HEADER_LINE)) return;
    hits.push({ skill: 'orbit-review', file: 'references/prompt-template.md', line: i + 1, rule: 'REGION', text: l.trim() });
  });
  return hits;
}

/** True when line i sits inside a ```-fence opened after the most recent output-section heading. */
function insideInnerFence(lines: string[], i: number): boolean {
  let start = i;
  while (start > 0 && !lines[start].startsWith(OUTPUT_SECTION) && !lines[start].startsWith(AFTER_SECTION)) start--;
  let open = false;
  for (let k = start; k < i; k++) if (/^\s*```(?!`)/.test(lines[k])) open = !open;
  return open;
}

/** The fenced brief inside the body's "Dispatching a fresh pass" step: every `.orbit-runs/` line. */
export function freshBriefRegionHits(body: string): Hit[] {
  const lines = body.split('\n');
  const start = lines.findIndex(l => /^#{2,4} /.test(l) && l.includes(FRESH_STEP));
  if (start < 0) return [];
  const hits: Hit[] = [];
  let inFence = false;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{2,4} /.test(lines[i]) && !inFence) break;
    if (/^\s*```/.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence && lines[i].includes(TRAIL)) {
      hits.push({ skill: 'orbit-review', file: 'SKILL.md', line: i + 1, rule: 'REGION', text: lines[i].trim() });
    }
  }
  return hits;
}

function surfaceHits(): Hit[] {
  const hits: Hit[] = [];
  for (const { dirName, files } of generatedSurface()) {
    for (const [file, text] of files) hits.push(...phraseHits(dirName, file, text));
    if (dirName !== 'orbit-review') continue;
    const template = files.find(([f]) => f === 'references/prompt-template.md')![1];
    const skill = files.find(([f]) => f === 'SKILL.md')![1];
    hits.push(...promptTemplateRegionHits(template), ...freshBriefRegionHits(skill));
  }
  return hits;
}

describe('review-genre brief: the generated surface carries no finding and no trail read pointer (rc03b task 1.1)', () => {
  it('zero hits under the PHRASE rule (every generated skill) and the REGION rule (the review skill)', () => {
    expect(surfaceHits()).toEqual([]);
  });

  it('the review skill carries the "Dispatching a fresh pass" step with a fenced brief (the region the rule reads exists)', () => {
    const body = getSkillTemplates(['review'])[0].template.instructions;
    const step = body.split(`### ${FRESH_STEP}`)[1];
    expect(step, 'the step exists').toBeDefined();
    expect(step.split(/\n#{2,3} /)[0]).toMatch(/```/);
  });

  it('a PLANTED read pointer in a copy of the prompt template is red; the three required output paths stay green', () => {
    const template = getSkillTemplates(['review'])[0].template.references!.find(r => r.name === 'prompt-template.md')!.content;
    // Unplanted: the output paths exist (header line, output section, after-completion section) and none is a hit.
    const trailLines = template.split('\n').filter(l => l.includes(TRAIL));
    expect(trailLines.length).toBeGreaterThanOrEqual(3);
    expect(template.split('\n').some(l => l.startsWith(HEADER_LINE) && l.includes(TRAIL))).toBe(true);
    expect(template.split(OUTPUT_SECTION)[1].split(AFTER_SECTION)[0]).toContain(TRAIL);
    expect(template.split(AFTER_SECTION)[1]).toContain(TRAIL);
    expect(promptTemplateRegionHits(template)).toEqual([]);
    // Planted: a read pointer in the project-context list.
    const planted = template.replace(
      '## Cycle context',
      '- `orbit/changes/<change-name>/.orbit-runs/` — prior passes\n\n## Cycle context',
    );
    expect(planted).not.toBe(template);
    const hits = promptTemplateRegionHits(planted);
    expect(hits.length).toBe(1);
    expect(hits[0].text).toContain('prior passes');
  });

  it('a planted read pointer inside the fresh brief fence is red', () => {
    const body = getSkillTemplates(['review'])[0].template.instructions;
    const i = body.indexOf(`### ${FRESH_STEP}`);
    const fence = body.indexOf('```', i);
    const eol = body.indexOf('\n', fence);
    const planted = body.slice(0, eol + 1) + 'Read orbit/changes/<name>/.orbit-runs/ first.\n' + body.slice(eol + 1);
    expect(freshBriefRegionHits(planted).length).toBe(1);
  });

  it('the PHRASE rule is decidable on its own edges: "iteration history" without the trail path on its line is not a hit', () => {
    expect(phraseHits('s', 'f', 'so iteration history travels with the change')).toEqual([]);
    expect(phraseHits('s', 'f', '- `x/.orbit-runs/` — iteration history').length).toBe(1);
    expect(phraseHits('s', 'f', '- Prior findings still open: <list>').length).toBe(1);
  });
});
