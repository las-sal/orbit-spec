/**
 * concept-docs task 1.1 (design D1): the carried-by check — `orbit-user-docs`' `Every H2 section of four concept pages
 * declares its owner on a checked Carried by line`, shown able to fail. Names resolve against this repository's
 * `orbit/specs/` and decisions against `orbit/architecture/fork-and-orbify.md`: `orbit-engine-gates` is a capability,
 * `orbit-explore` is a skill and names none, and fork-and-orbify has no D99.
 */
import { describe, expect, it } from 'vitest';
import { DOCS_WORKFLOW, allDocSurfaces, readPendingRewrite, type Surface } from '../../helpers/surface-snippets.js';
import {
  CONCEPT_PAGES,
  carriedByFailures,
  fileLocalFailures,
  missingOwingPageFailures,
  pendingListFailures,
} from '../../helpers/user-docs.js';

const FENCE = '```';
const CONCEPTS = 'docs/concepts.md';
const page = (body: string, file = CONCEPTS): Surface => ({ workflowId: DOCS_WORKFLOW, file, text: `# Concepts\n\nIntro.\n\n${body}\n` });
/** A body's first line is line 5: the heading `## …` sits there. */
const none = (line: number, file = CONCEPTS) => `${file}:${line}: section has no carried-by line (the carried-by check)`;
const unresolved = (line: number, item: string) => `${CONCEPTS}:${line}: item '${item}' does not resolve (the carried-by check)`;

describe('the carried-by check', () => {
  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A section naming existing owners passes
  it('passes a section whose one carried-by line names existing owners', () => {
    const body = '## Gates\n\nGates gate.\n\nCarried by: `orbit-engine-gates`, fork-and-orbify D15, the 1.3.1 baseline\n';
    expect(carriedByFailures([page(body)])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A section with no carried-by line fails
  it('fails a section with a body and no carried-by line, naming the heading line; H3s belong to their H2', () => {
    const body = ['## Gates', '', 'Gates gate.', '', '### Detail', '', 'More.', '', '## Next', '', 'Carried by: the 1.3.1 baseline'].join('\n');
    expect(carriedByFailures([page(body)])).toEqual([none(5)]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A section with two carried-by lines fails
  it('fails a section with two carried-by lines, naming the heading line', () => {
    const body = '## Gates\n\nCarried by: the 1.3.1 baseline\n\nText.\n\nCarried by: `orbit-engine-gates`\n';
    expect(carriedByFailures([page(body)])).toEqual([`${CONCEPTS}:5: section has 2 carried-by lines (the carried-by check)`]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: An unresolved item fails
  it('fails a skill name, an unknown decision and free text, naming the line and each item', () => {
    const body = '## Gates\n\nText.\n\nCarried by: `orbit-explore`, fork-and-orbify D99, the review engine, `orbit-engine-gates`\n';
    expect(carriedByFailures([page(body)])).toEqual([
      unresolved(9, '`orbit-explore`'),
      unresolved(9, 'fork-and-orbify D99'),
      unresolved(9, 'the review engine'),
    ]);
    expect(carriedByFailures([page('## Gates\n\nCarried by:\n')])).toEqual([
      `${CONCEPTS}:7: carried-by line names no item (the carried-by check)`,
    ]);
    expect(carriedByFailures([page('## Gates\n\nCarried by: `orbit-engine-gates`,\n')])).toEqual([unresolved(7, '')]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A navigation section is exempt
  it('exempts a section whose only block is a list of bare links, a trailing punctuation mark allowed', () => {
    const body = '## Related\n\n- [Workflows](workflows.md)\n- [CLI](cli.md).\n\n1. [Commands](commands.md)\n';
    expect(carriedByFailures([page(body)])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A link followed by a claim is not navigation
  it('reads a link followed by a claim as a claim, and a section mixing a paragraph and links too', () => {
    expect(carriedByFailures([page('## Related\n\n- [Workflows](workflows.md) gate every change.\n')])).toEqual([none(5)]);
    expect(carriedByFailures([page('## Related\n\nSome prose.\n\n- [CLI](cli.md)\n')])).toEqual([none(5)]);
    expect(carriedByFailures([page('## Related\n\n- [CLI](cli.md)\n  - [Nested](x.md)\n')])).toEqual([none(5)]);
    expect(carriedByFailures([page('## Empty\n')])).toEqual([none(5)]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A wrapped carried-by line is read whole
  it('reads a soft-wrapped carried-by line as one, resolving the items on both source lines', () => {
    const wrapped = '## Gates\n\nCarried by: `orbit-engine-gates`,\n`orbit-review`, the 1.3.1 baseline\n';
    expect(carriedByFailures([page(wrapped)])).toEqual([]);
    const bad = '## Gates\n\nCarried by: `orbit-engine-gates`,\nfork-and-orbify D99\n';
    expect(carriedByFailures([page(bad)])).toEqual([unresolved(7, 'fork-and-orbify D99')]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A missing concept page fails
  it('fails, naming it, a concept page neither listed nor present; a listed or present one passes', () => {
    const docs = allDocSurfaces();
    const without = docs.filter((d) => d.file !== CONCEPTS);
    const check = (pending: string[], surfaces: Surface[]) => missingOwingPageFailures(pending, surfaces, CONCEPT_PAGES, 'the carried-by check');
    expect(check([], without)).toEqual([
      `${CONCEPTS}: owed by the carried-by check but neither listed nor present among the user docs`,
    ]);
    expect(check([CONCEPTS], without)).toEqual([]);
    expect(check(readPendingRewrite(), docs)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: A line inside a fence or a list is not read
  it('does not read a carried-by line inside a fence, a list item or a blockquote', () => {
    const fenced = `## Gates\n\nText.\n\n${FENCE}\nCarried by: the 1.3.1 baseline\n${FENCE}\n`;
    expect(carriedByFailures([page(fenced)])).toEqual([none(5)]);
    expect(carriedByFailures([page('## Gates\n\nText.\n\n- Carried by: the 1.3.1 baseline\n')])).toEqual([none(5)]);
    expect(carriedByFailures([page('## Gates\n\nText.\n\n> Carried by: the 1.3.1 baseline\n')])).toEqual([none(5)]);
  });

  // @scenario behaviour orbit-user-docs :: Every H2 section of four concept pages declares its owner on a checked Carried by line :: Other user docs are not read
  it('passes the migration guide, the README and every other user doc', () => {
    for (const file of ['docs/migration-guide.md', 'README.md', 'docs/cli.md']) {
      expect(carriedByFailures([page('## Steps\n\nNo owner here.\n', file)])).toEqual([]);
    }
    for (const file of CONCEPT_PAGES) {
      expect(carriedByFailures([page('## Steps\n\nNo owner here.\n', file)])).toEqual([none(5, file)]);
    }
  });

  it('does not read content before the first H2, and an H1 ends a section', () => {
    const text = '# Concepts\n\nIntro with no owner.\n\n## Gates\n\nCarried by: the 1.3.1 baseline\n\n# Part two\n\nNo owner.\n';
    expect(carriedByFailures([{ workflowId: DOCS_WORKFLOW, file: CONCEPTS, text }])).toEqual([]);
  });

  it('joins fileLocalFailures, so the exactness rule runs it over a listed page alone', async () => {
    const failing = page('## Gates\n\nText.\n');
    expect(await fileLocalFailures([failing])).toEqual([`[carried-by] ${none(5)}`]);
    const clean = page('## Gates\n\nCarried by: the 1.3.1 baseline\n');
    expect(await pendingListFailures([CONCEPTS], [clean])).toEqual([
      `${CONCEPTS}: passes every file-local check; remove it from the pending-rewrite list`,
    ]);
  });
});
