/**
 * rc05 exit (1): every `orbit` snippet on the generated surface parses against
 * the builder's program, through commander's own parser (design D2, D3), and the
 * guard finds no `orbit` command with a flag written outside a shell fence.
 */
import { describe, expect, it } from 'vitest';
import { analyseOrbit, guardFailureLines, sweepFailures } from '../../helpers/orbit-sweep.js';
import { DOCS_WORKFLOW, docSurfaces, generatedSurfaces, readPendingRewrite, type Surface } from '../../helpers/surface-snippets.js';
import { docsFloorFailures } from '../../helpers/user-docs.js';

const analysis = analyseOrbit(generatedSurfaces());

/**
 * A non-vacuity floor, not a pin: at rc05's apply the sweep parsed 129 snippets and set aside
 * 35 bare command names (figures recorded in the apply emit); 130 once the system walk read each
 * SKILL.md with its generated frontmatter. An extractor that silently found
 * nothing would pass every parse; the floor fails it, while a body edit adding or removing a
 * snippet does not.
 */
const PARSED_FLOOR = 100;

describe('the orbit snippet sweep', () => {
  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: Today's surface parses
  it('every extracted orbit snippet parses against the builder\'s program', async () => {
    expect(await sweepFailures(analysis)).toEqual([]);
    expect(analysis.snippets.length).toBeGreaterThanOrEqual(PARSED_FLOOR);
    expect(analysis.snippets.some((s) => s.source === 'fence')).toBe(true);
    expect(analysis.snippets.some((s) => s.source === 'inline')).toBe(true);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: Today's surface parses
  it('the guard finds no orbit command with a flag outside a shell fence', () => {
    expect(guardFailureLines(analysis)).toEqual([]);
  });
});

/**
 * The user docs' floor (docs-under-test design D5): `null` while any file is on the pending-rewrite
 * list, asserted only once the list is empty. The edit that empties the list sets it below the
 * count this sweep measures over the user docs at that edit.
 */
const DOCS_FLOOR: number | null = null;

const FENCE = '```';

describe('the orbit snippet sweep over the user docs', () => {
  const docs = analyseOrbit(docSurfaces());

  it('every orbit snippet in an unlisted user doc parses, and the guard fails no line', async () => {
    expect(await sweepFailures(docs)).toEqual([]);
    expect(guardFailureLines(docs)).toEqual([]);
  });

  it('its floor is asserted once the pending-rewrite list is empty', () => {
    expect(docsFloorFailures(readPendingRewrite(), [{ sweep: 'orbit', floor: DOCS_FLOOR, count: docs.snippets.length }])).toEqual([]);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: An unlisted user doc's orbit snippet is swept
  it('an unknown orbit flag in an unlisted user doc fails, naming the file, the line, the snippet and commander\'s message', async () => {
    const surface: Surface = { workflowId: DOCS_WORKFLOW, file: 'docs/cli.md', text: `# CLI\n\n${FENCE}bash\norbit status --change <name> --frobnicate\n${FENCE}\n` };
    const failures = await sweepFailures(analyseOrbit([surface]));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/^docs\/cli\.md:4: orbit status --change <name> --frobnicate\n {4}error: unknown option '--frobnicate'$/);
  });
});
