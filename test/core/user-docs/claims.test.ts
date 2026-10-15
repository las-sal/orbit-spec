/**
 * landing-page task 3.3 (design D2): the improvement-claims check — `orbit-user-docs`' `Every
 * improvement the README claims over OpenSpec names capabilities that exist`, shown able to fail.
 * Names resolve against this repository's `orbit/specs/`: `orbit-engine-gates` and `orbit-review` are
 * capabilities; `orbit-explore` is a skill and names none.
 */
import { describe, expect, it } from 'vitest';
import { DOCS_WORKFLOW, allDocSurfaces, docSurfaces, readPendingRewrite, type Surface } from '../../helpers/surface-snippets.js';
import { claimsFailures, fileLocalFailures, pendingListFailures } from '../../helpers/user-docs.js';

const FENCE = '```';
/** The README start section the start-sections check reads, so a fixture README passes that check. */
const STARTS = '\n\n## Quickstart\n\n### Your first change\n\nRun `/orbit:architect <program>`.';
const readme = (body: string): Surface => ({
  workflowId: DOCS_WORKFLOW,
  file: 'README.md',
  text: `# orbit\n\n## How orbit improves on OpenSpec\n\n${body}\n\n## Install\n\nSee below.\n`,
});
/** Line numbers below count from the section heading on line 3, so a body's first line is line 5. */
const noName = (line: number) => `README.md:${line}: improvement claim names no capability (the improvement-claims check)`;
const unresolved = (line: number, name: string) =>
  `README.md:${line}: '${name}' names no capability in orbit/specs (the improvement-claims check)`;
const EMPTY = "README.md: no improvement claim found under 'How orbit improves on OpenSpec' (the improvement-claims check)";

describe('the improvement-claims check', () => {
  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: A claim naming existing capabilities passes
  it('passes a top-level item naming existing capabilities', () => {
    expect(claimsFailures([readme('- Reviewed gates (`orbit-engine-gates`, `orbit-review`).')])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: A claim naming no capability fails
  it('fails a top-level item with no name in it or its nested items, naming the item\'s line', () => {
    const body = ['- Gates (`orbit-review`).', '- Orientation, with no name.', '  - nor here.'].join('\n');
    expect(claimsFailures([readme(body)])).toEqual([noName(6)]);
  });

  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: A name that is not a capability fails
  it('fails a name that resolves to no capability, naming its line and the name, beside an existing one', () => {
    const body = ['- Explore and review (`orbit-review`,', '  `orbit-explore`).', '- The package `orbit-spec`.'].join('\n');
    expect(claimsFailures([readme(body)])).toEqual([unresolved(6, 'orbit-explore'), unresolved(7, 'orbit-spec')]);
  });

  it('names the line a name is on after a code span that wraps a line, a hard break or an escaped backtick', () => {
    const wrapped = ['- **A** `orbit-review` and `x', '  y` then', '  `orbit-nope`.'].join('\n');
    expect(claimsFailures([readme(wrapped)])).toEqual([unresolved(7, 'orbit-nope')]);
    const hard = ['- Gates (`orbit-review`),\\', '  and \\` then', '  `orbit-nope`.'].join('\n');
    expect(claimsFailures([readme(hard)])).toEqual([unresolved(7, 'orbit-nope')]);
  });

  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: A nested item rides its parent
  it('passes a nested item that names nothing under a parent that names a capability', () => {
    const body = ['- Gates (`orbit-engine-gates`).', '  - computed from the trail.', '    - deeper still.'].join('\n');
    expect(claimsFailures([readme(body)])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: A name only in a nested item counts for its parent
  it('counts a nested item\'s name toward its parent, and fails an unresolved nested name on the nested line', () => {
    expect(claimsFailures([readme('- Reviews.\n  - carried by `orbit-review`.')])).toEqual([]);
    expect(claimsFailures([readme('- Reviews.\n  - carried by `orbit-explore`.')])).toEqual([unresolved(6, 'orbit-explore')]);
  });

  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: A span that is not a whole name is not read
  it('reads only whole-span names: a path or a command beginning orbit- is not a name', () => {
    const body = '- Review (`orbit-review`), see `orbit-explore/SKILL.md` and `orbit-review --as`.';
    expect(claimsFailures([readme(body)])).toEqual([]);
    expect(claimsFailures([readme('- See `orbit-explore/SKILL.md` and `Orbit-Review` and `orbit-`.')])).toEqual([noName(5)]);
  });

  it('never reads a fence, a blockquote\'s list or a non-list block, and reads only README.md', () => {
    const body = [
      'Intro naming `orbit-explore`.', // 5
      '', // 6
      `${FENCE}`, // 7
      '- `orbit-explore`', // 8
      `${FENCE}`, // 9
      '', // 10
      '> - `orbit-explore`', // 11
      '', // 12
      '| a |', // 13
      '|---|', // 14
      '| `orbit-explore` |', // 15
      '', // 16
      '- Gates (`orbit-engine-gates`).', // 17
      '', // 18
      '  ```', // 19
      '  `orbit-explore`', // 20
      '  ```', // 21
    ].join('\n');
    expect(claimsFailures([readme(body)])).toEqual([]);
    const other = { ...readme('- no name'), file: 'docs/concepts.md' };
    expect(claimsFailures([other])).toEqual([]);
  });

  it('a list after the section\'s end is not a claim, and a sub-heading stays inside the section', () => {
    const text = '# orbit\n\n## How orbit improves on OpenSpec\n\n### Gates\n\n- Gates (`orbit-review`).\n\n## Install\n\n- no name here\n';
    expect(claimsFailures([{ workflowId: DOCS_WORKFLOW, file: 'README.md', text }])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: An empty comparison fails
  it('fails a README with no claims section, or a section holding no top-level list item', () => {
    const absent: Surface = { workflowId: DOCS_WORKFLOW, file: 'README.md', text: '# orbit\n\n- `orbit-review`\n' };
    expect(claimsFailures([absent])).toEqual([EMPTY]);
    expect(claimsFailures([readme('Prose naming `orbit-review`, and no list.')])).toEqual([EMPTY]);
    const setext: Surface = { workflowId: DOCS_WORKFLOW, file: 'README.md', text: 'How orbit improves on OpenSpec\n---\n\n- `orbit-review`\n' };
    expect(claimsFailures([setext])).toEqual([EMPTY]);
  });

  // @scenario behaviour orbit-user-docs :: Every improvement the README claims over OpenSpec names capabilities that exist :: A listed README is held by the exactness rule, not the suite
  it('a listed README is not read by the unlisted-doc suite, and the exactness rule runs the check over it alone', async () => {
    const pending = [...new Set(['README.md', ...readPendingRewrite()])];
    expect(docSurfaces(pending).some((s) => s.file === 'README.md')).toBe(false);
    expect((await fileLocalFailures(docSurfaces(pending))).filter((f) => f.startsWith('[claims]'))).toEqual([]);

    const finished = readme('- Gates (`orbit-engine-gates`).' + STARTS);
    expect(await fileLocalFailures([finished])).toEqual([]);
    expect(await pendingListFailures(['README.md'], [finished])).toEqual([
      'README.md: passes every file-local check; remove it from the pending-rewrite list',
    ]);
    const unfinished = readme('- Gates, naming nothing.' + STARTS);
    expect(await fileLocalFailures([unfinished])).toEqual([`[claims] ${noName(5)}`]);
    expect(await pendingListFailures(['README.md'], [unfinished])).toEqual([]);
  });

  it('passes over the README as it stands, which is unlisted', () => {
    expect(readPendingRewrite()).not.toContain('README.md');
    const doc = allDocSurfaces().find((s) => s.file === 'README.md')!;
    expect(claimsFailures([doc])).toEqual([]);
  });
});
