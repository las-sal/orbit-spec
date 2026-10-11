/**
 * rc05 exit (1): every `orbit` snippet on the generated surface parses against
 * the builder's program, through commander's own parser (design D2, D3), and the
 * guard finds no `orbit` command with a flag written outside a shell fence.
 */
import { describe, expect, it } from 'vitest';
import { analyseOrbit, guardFailureLines, sweepFailures } from '../../helpers/orbit-sweep.js';
import { generatedSurfaces } from '../../helpers/surface-snippets.js';

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
