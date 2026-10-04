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
 *  - REGION (the review skill only): a `.orbit-runs/` mention is a hit inside a BRIEF REGION —
 *    `references/prompt-template.md`, or the fenced brief of the body's "Dispatching a fresh pass"
 *    step — unless it is an OUTPUT DESTINATION, exempted BY LINE (system walk 1, Sal: A): inside
 *    `## Output format — write to:` / `## After completing the review`, a line whose every trail path
 *    is the findings file `external-<as>-<TS>.md`; and the reference's header line whose every trail
 *    path is the prompt file `external-prompt-<as>-<TS>.md`. Since system walk 2 (external W3, Sal: A)
 *    the brief regions also include every reference a REVIEW pass loads to READ — the three pass
 *    references, `mode-sections.md`, `flags-detail.md` — where a pathspec EXCLUSION (`':!…'`) is not a
 *    hit. A REWORDED read ("read the previous review summary") names no path and no grep decides it:
 *    that is the owner's stated residual, and the plants below pin it green on purpose.
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

/** The file names a line's `.orbit-runs/` paths point at (`.orbit-runs/<name>`; a bare directory is ''). */
const trailTargets = (l: string): string[] =>
  [...l.matchAll(/\.orbit-runs\/([^\s`'")]*)/g)].map(m => m[1]);
const FINDINGS_DEST = 'external-<as>-<TS>.md';
const PROMPT_DEST = 'external-prompt-<as>-<TS>.md';

/** Prompt template: every `.orbit-runs/` line that is not an output destination, exempted BY LINE. */
export function promptTemplateRegionHits(text: string): Hit[] {
  const lines = text.split('\n');
  const hits: Hit[] = [];
  let inOutput = false;
  lines.forEach((l, i) => {
    // The output sections run from their heading to the template's closing four-backtick fence; the
    // output-format section ends where the after-completion section begins. A `##` heading that is
    // neither (outside the inner findings fence) ends them.
    if (l.startsWith(OUTPUT_SECTION) || l.startsWith(AFTER_SECTION)) inOutput = true;
    else if (l.startsWith('````')) inOutput = false;
    else if (/^## /.test(l) && inOutput && !insideInnerFence(lines, i)) inOutput = false;
    if (!l.includes(TRAIL)) return;
    const targets = trailTargets(l);
    if (inOutput && targets.every(t => t === FINDINGS_DEST)) return;
    if (l.startsWith(HEADER_LINE) && targets.every(t => t === PROMPT_DEST)) return;
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

/** References a REVIEW pass loads to READ (system walk 2): every `.orbit-runs/` line outside a `':!…'` exclusion. */
export const READ_REFERENCES = ['passes-proposal.md', 'passes-system.md', 'passes-architecture.md', 'mode-sections.md', 'flags-detail.md'];
export function readReferenceRegionHits(name: string, text: string): Hit[] {
  const hits: Hit[] = [];
  text.split('\n').forEach((l, i) => {
    if (l.replace(/':![^']*'/g, '').includes(TRAIL)) {
      hits.push({ skill: 'orbit-review', file: `references/${name}`, line: i + 1, rule: 'REGION', text: l.trim() });
    }
  });
  return hits;
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
    for (const name of READ_REFERENCES) {
      const ref = files.find(([f]) => f === `references/${name}`);
      expect(ref, `the review skill ships references/${name}`).toBeDefined();
      hits.push(...readReferenceRegionHits(name, ref![1]));
    }
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

  it('a read instruction planted INSIDE an output section is red; the destination lines stay green (system walk 1, fresh S3)', () => {
    const template = getSkillTemplates(['review'])[0].template.references!.find(r => r.name === 'prompt-template.md')!.content;
    const planted = template.replace(
      'Use this exact markdown structure:',
      'Before writing, compare against the prior `orbit/changes/<change-name>/.orbit-runs/external-*.md` files.\n\nUse this exact markdown structure:',
    );
    expect(planted).not.toBe(template);
    const hits = promptTemplateRegionHits(planted);
    expect(hits.map(h => h.text)).toEqual([expect.stringContaining('compare against the prior')]);
    // A destination line naming a second, non-destination trail path is not exempt either.
    const mixed = template.replace(
      'git add orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md',
      'git add orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md orbit/changes/<change-name>/.orbit-runs/review-system-x.json',
    );
    expect(mixed).not.toBe(template);
    expect(promptTemplateRegionHits(mixed).length).toBe(1);
  });

  it("the external half's three plants (system walk 2): a trail path in a loaded pass reference is red; the two REWORDED reads are green — the owner's named residual", () => {
    const review = getSkillTemplates(['review'])[0].template;
    const passes = review.references!.find(r => r.name === 'passes-system.md')!.content;
    const plantedRef = passes + '\nRead orbit/changes/<name>/.orbit-runs/review-system-previous.json before Pass 0.\n';
    expect(readReferenceRegionHits('passes-system.md', plantedRef).length).toBe(1);
    // The mode-sections exclusion pathspec is not a hit.
    const modes = review.references!.find(r => r.name === 'mode-sections.md')!.content;
    expect(modes).toContain("':!orbit/changes/<change-name>/.orbit-runs'");
    expect(readReferenceRegionHits('mode-sections.md', modes)).toEqual([]);
    // Reworded reads: no trail path, no listed phrase — undecidable by grep, held by the rule alone.
    const body = review.instructions;
    const i = body.indexOf(`### ${FRESH_STEP}`);
    const eol = body.indexOf('\n', body.indexOf('```', i));
    const reworded = body.slice(0, eol + 1) + 'Read the last review pass findings before you begin.\n' + body.slice(eol + 1);
    expect(freshBriefRegionHits(reworded)).toEqual([]);
    expect(phraseHits('orbit-review', 'SKILL.md', reworded).filter(h => h.text.includes('last review pass'))).toEqual([]);
    const template = review.references!.find(r => r.name === 'prompt-template.md')!.content;
    const reworded2 = template.replace('## Cycle context', '- Read the previous review summary before beginning.\n\n## Cycle context');
    expect(reworded2).not.toBe(template);
    expect(promptTemplateRegionHits(reworded2)).toEqual([]);
  });

  it('the fresh brief names its reader as the dispatched WORKER that skips the dispatch step (system walk 2, external W1)', () => {
    const body = getSkillTemplates(['review'])[0].template.instructions;
    const step = body.split(`### ${FRESH_STEP}`)[1].split(/\n### /)[0];
    expect(step).toMatch(/INVOKING session's act alone/);
    const brief = step.split('```')[1];
    expect(brief).toMatch(/WORKER, not a dispatcher/);
    expect(brief).toMatch(/SKIPPING its "Dispatching a fresh\s+pass" step/);
    expect(brief).toMatch(/never dispatch again/);
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
