/**
 * concept-docs task 1.2 (design D2): the tool-coverage check — `orbit-user-docs`' `The supported-tools page lists
 * every init target in two tiers`, shown able to fail. The fixtures pass a small tool list; the real list is read from
 * `AI_TOOLS` and never typed here.
 */
import { describe, expect, it } from 'vitest';
import { DOCS_WORKFLOW, allDocSurfaces, readPendingRewrite, type Surface } from '../../helpers/surface-snippets.js';
import {
  TIER_ONE,
  TOOLS_PAGE,
  fileLocalFailures,
  missingOwingPageFailures,
  toolCoverageFailures,
  type ToolEntry,
} from '../../helpers/user-docs.js';
import { AI_TOOLS } from '../../../src/core/config.js';

const TOOLS: ToolEntry[] = [
  { value: 'claude', available: true },
  { value: 'codex', available: true },
  { value: 'cursor', available: true },
  { value: 'agents', available: false },
];
const table = (ids: string[]) => ['| Tool | Directory |', '|---|---|', ...ids.map((id) => `| \`${id}\` | \`.x/\` |`)].join('\n');
const page = (tier1: string[], tier2: string[], extra = ''): Surface => ({
  workflowId: DOCS_WORKFLOW,
  file: TOOLS_PAGE,
  text: `# Supported tools\n\n## Tier 1: designed for\n\n${table(tier1)}\n\n## Tier 2: generated, untested\n\n${table(tier2)}\n${extra}`,
});
const missing = (id: string, tier: number) => `${TOOLS_PAGE}: does not name '${id}' in tier ${tier} (the tool-coverage check)`;

describe('the tool-coverage check', () => {
  // @scenario behaviour orbit-user-docs :: The supported-tools page lists every init target in two tiers :: Every available tool has a row in its tier
  it('passes a page naming claude and codex in tier 1 and every other available tool in tier 2', () => {
    expect(toolCoverageFailures([page(['claude', 'codex'], ['cursor'])], TOOLS)).toEqual([]);
    const available = AI_TOOLS.filter((t) => t.available).map((t) => t.value);
    const real = page(TIER_ONE, available.filter((id) => !TIER_ONE.includes(id)));
    expect(toolCoverageFailures([real])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The supported-tools page lists every init target in two tiers :: A tool added to the code without a row fails
  it('fails an available tool named in neither tier, and one named only in prose or outside a table', () => {
    expect(toolCoverageFailures([page(['claude', 'codex'], [])], TOOLS)).toEqual([missing('cursor', 2)]);
    const prose = page(['claude', 'codex'], [], '\nAlso `cursor`.\n\n## Other\n\n' + table(['cursor']) + '\n');
    expect(toolCoverageFailures([prose], TOOLS)).toEqual([missing('cursor', 2)]);
  });

  // @scenario behaviour orbit-user-docs :: The supported-tools page lists every init target in two tiers :: The unavailable tool is not listed
  it('fails a page naming the unavailable tool anywhere', () => {
    expect(toolCoverageFailures([page(['claude', 'codex'], ['cursor', 'agents'])], TOOLS)).toEqual([
      `${TOOLS_PAGE}: names 'agents', which is not an init target (the tool-coverage check)`,
    ]);
    expect(toolCoverageFailures([page(['claude', 'codex'], ['cursor'], '\nNot `agents`.\n')], TOOLS)).toEqual([
      `${TOOLS_PAGE}: names 'agents', which is not an init target (the tool-coverage check)`,
    ]);
  });

  // @scenario behaviour orbit-user-docs :: The supported-tools page lists every init target in two tiers :: A tool in the wrong tier fails
  it('fails codex in tier 2 and cursor in tier 1, naming the tool and the tier it sits in', () => {
    expect(toolCoverageFailures([page(['claude'], ['codex', 'cursor'])], TOOLS)).toEqual([
      `${TOOLS_PAGE}: 'codex' sits in tier 2; it belongs in tier 1 (the tool-coverage check)`,
      missing('codex', 1),
    ]);
    expect(toolCoverageFailures([page(['claude', 'codex', 'cursor'], ['cursor'])], TOOLS)).toEqual([
      `${TOOLS_PAGE}: 'cursor' sits in tier 1; it belongs in tier 2 (the tool-coverage check)`,
    ]);
  });

  // @scenario behaviour orbit-user-docs :: The supported-tools page lists every init target in two tiers :: An id that is no init target fails
  it('fails an id in a tier table that no tool holds, naming the page and the id', () => {
    expect(toolCoverageFailures([page(['claude', 'codex', 'aider'], ['cursor'])], TOOLS)).toEqual([
      `${TOOLS_PAGE}: names 'aider' in a tier's table, which is no init target (the tool-coverage check)`,
    ]);
  });

  it('fails, naming it, a page neither listed nor present; a listed or present one passes', () => {
    const docs = allDocSurfaces();
    const without = docs.filter((d) => d.file !== TOOLS_PAGE);
    const check = (pending: string[], surfaces: Surface[]) => missingOwingPageFailures(pending, surfaces, [TOOLS_PAGE], 'the tool-coverage check');
    expect(check([], without)).toEqual([`${TOOLS_PAGE}: owed by the tool-coverage check but neither listed nor present among the user docs`]);
    expect(check([TOOLS_PAGE], without)).toEqual([]);
    expect(check(readPendingRewrite(), docs)).toEqual([]);
  });

  it('passes every other user doc, and joins fileLocalFailures', async () => {
    const other: Surface = { workflowId: DOCS_WORKFLOW, file: 'docs/cli.md', text: '# CLI\n' };
    expect(toolCoverageFailures([other])).toEqual([]);
    const failures = await fileLocalFailures([page(['claude'], [])]);
    expect(failures).toContain(`[tools] ${missing('codex', 1)}`);
  });
});
