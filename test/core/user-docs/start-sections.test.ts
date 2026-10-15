/**
 * docs-refinement task 1.2 (design D-dr-4): the start-sections check — `orbit-user-docs`' `The user docs' start
 * sections name the architect workflow first`, shown able to fail. The fixtures pass a one-member list; the real list
 * is `START_SECTIONS`, read by the shipped-docs run.
 */
import { describe, expect, it } from 'vitest';
import { DOCS_WORKFLOW, allDocSurfaces, readPendingRewrite, type Surface } from '../../helpers/surface-snippets.js';
import {
  START_PAGES,
  START_SECTIONS,
  fileLocalFailures,
  missingOwingPageFailures,
  startSectionFailures,
} from '../../helpers/user-docs.js';

const FENCE = '```';
const PAGE = 'docs/start.md';
const LIST = [{ page: PAGE, heading: '## Begin' }];
const page = (body: string, heading = 'Begin'): Surface => ({
  workflowId: DOCS_WORKFLOW,
  file: PAGE,
  text: `# Start\n\n## ${heading}\n\n${body}\n\n## Later\n\nRun \`/orbit:explore\`.\n`,
});
const where = `${PAGE} › ## Begin`;

describe('the start-sections check', () => {
  // @scenario behaviour orbit-user-docs :: The user docs' start sections name the architect workflow first :: Every listed section leads with architect
  it('passes every listed section of the shipped user docs', () => {
    // The requirement's table, written out here so dropping a member from START_SECTIONS fails.
    expect(START_SECTIONS).toEqual([
      { page: 'README.md', heading: '### Your first change' },
      { page: 'docs/getting-started.md', heading: '## The change' },
      { page: 'docs/workflows.md', heading: '### One change, start to finish' },
      { page: 'docs/workflows.md', heading: '### Step by step' },
      { page: 'docs/workflows.md', heading: '### Exploring first' },
      { page: 'docs/workflows.md', heading: '## Practices' },
      { page: 'docs/workflow-engine.md', heading: '## Actions, not phases' },
      { page: 'docs/concepts.md', heading: '## Artifacts' },
    ]);
    const docs = allDocSurfaces();
    expect(START_SECTIONS.every((s) => docs.some((d) => d.file === s.page))).toBe(true);
    expect(startSectionFailures(docs)).toEqual([]);
    expect(startSectionFailures([page('Run `/orbit:architect <p>`, then `/orbit:explore`.')], LIST)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs' start sections name the architect workflow first :: A section that leads with explore fails
  it('fails a section naming explore before architect, naming the page, the heading and the command found first', () => {
    expect(startSectionFailures([page('Run `/orbit:explore`, then `/orbit:architect <p>`.')], LIST)).toEqual([
      `${where}: first start command is 'explore', not 'architect' (the start-sections check)`,
    ]);
    expect(startSectionFailures([page('Run `/orbit:propose` and `/orbit:architect`.\n\n### Sub\n\n`/orbit:new`')], LIST)).toEqual([
      `${where}: first start command is 'propose', not 'architect' (the start-sections check)`,
    ]);
  });

  it('fails a listed section that names no start command; reads a section to its next same-or-higher heading', () => {
    expect(startSectionFailures([page('Nothing to run here; `/orbit:apply` is no start.')], LIST)).toEqual([
      `${where}: names no start command (the start-sections check)`,
    ]);
    expect(startSectionFailures([page('Intro.\n\n### Deeper\n\nRun `/orbit:architect`.')], LIST)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs' start sections name the architect workflow first :: A flow diagram is read as a start
  it('reads a fenced `explore ──►` as a start, and only inside a fence', () => {
    const diagram = (first: string) => `${FENCE}text\n   ${first} ──► propose ──► apply\n${FENCE}\n\nThen \`/orbit:architect\`.`;
    expect(startSectionFailures([page(diagram('explore'))], LIST)).toEqual([
      `${where}: first start command is 'explore', not 'architect' (the start-sections check)`,
    ]);
    expect(startSectionFailures([page(diagram('architect ──► explore'))], LIST)).toEqual([]);
    expect(startSectionFailures([page(`${FENCE}text\nexplore ──► propose   # or /orbit:architect\n${FENCE}`)], LIST)).toEqual([
      `${where}: first start command is 'explore', not 'architect' (the start-sections check)`,
    ]);
    expect(startSectionFailures([page('Prose: explore ──► propose, then `/orbit:architect`.')], LIST)).toEqual([]);
    expect(startSectionFailures([page(`${FENCE}text\nproposal ──► specs\n${FENCE}\n\n\`/orbit:architect\``)], LIST)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs' start sections name the architect workflow first :: A missing heading fails
  it('fails a listed heading not found on its page at its listed level, naming the page and the heading', () => {
    expect(startSectionFailures([page('Run `/orbit:architect`.', 'Renamed')], LIST)).toEqual([
      `${where}: heading not found (the start-sections check)`,
    ]);
    const demoted: Surface = { workflowId: DOCS_WORKFLOW, file: PAGE, text: '# Start\n\n### Begin\n\nRun `/orbit:architect`.\n' };
    expect(startSectionFailures([demoted], LIST)).toEqual([`${where}: heading not found (the start-sections check)`]);
    const fenced = page(`${FENCE}markdown\n## Begin\n${FENCE}`, 'Other');
    expect(startSectionFailures([fenced], LIST)).toEqual([`${where}: heading not found (the start-sections check)`]);
  });

  it('fails, naming it, a page neither listed nor present; a listed or present one passes', () => {
    const docs = allDocSurfaces();
    const without = docs.filter((d) => d.file !== 'docs/workflows.md');
    const check = (pending: string[], surfaces: Surface[]) =>
      missingOwingPageFailures(pending, surfaces, START_PAGES, 'the start-sections check');
    expect(check([], without)).toEqual([
      'docs/workflows.md: owed by the start-sections check but neither listed nor present among the user docs',
    ]);
    expect(check(['docs/workflows.md'], without)).toEqual([]);
    expect(check(readPendingRewrite(), docs)).toEqual([]);
  });

  it('passes every other user doc, and joins fileLocalFailures', async () => {
    const other: Surface = { workflowId: DOCS_WORKFLOW, file: 'docs/cli.md', text: '# CLI\n\nRun `/orbit:explore`.\n' };
    expect(startSectionFailures([other])).toEqual([]);
    const readme: Surface = { workflowId: DOCS_WORKFLOW, file: 'README.md', text: '# orbit\n' };
    expect(await fileLocalFailures([readme])).toContain(
      '[start-sections] README.md › ### Your first change: heading not found (the start-sections check)',
    );
  });
});
