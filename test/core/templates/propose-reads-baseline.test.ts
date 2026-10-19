import { describe, it, expect } from 'vitest';
import {
  getOrbitProposeSkillTemplate,
  getFfChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { ownerText, fencedProduction } from '../../helpers/owner-text.js';

/**
 * read-obligation, tasks 1.1, 1.2 and 1.4 (design D2, D3; issue #29).
 *
 * `orbit-propose-modifications`' `Propose-shaped bodies read the baseline before writing proposal.md` fences two
 * lines that the propose and ff bodies carry in upstream step 4a, immediately after the dependency-read line and
 * before the artifact-creation line. The fence is read through the single-active-owner lookup (the change's delta
 * while it is active, the baseline once archived), so the bodies are held to the owner, never to a copy here.
 */
const REQUIREMENT = 'Propose-shaped bodies read the baseline before writing proposal.md';
const FENCE_FIRST_LINE = '- Before writing the proposal artifact:';
const DEPENDENCY_READ = '- Read any completed dependency files for context';
const CREATE_ARTIFACT = '- Create the artifact file using';

async function fenceLines(): Promise<string[]> {
  const owner = await ownerText('orbit-propose-modifications', `### Requirement: ${REQUIREMENT}`);
  const section = owner.slice(owner.indexOf(`### Requirement: ${REQUIREMENT}`));
  const fenceStart = section.indexOf('```\n') + 4;
  const firstLine = section.slice(fenceStart, section.indexOf('\n', fenceStart));
  expect(firstLine.startsWith(FENCE_FIRST_LINE), 'the fence opens with the proposal line').toBe(true);
  const lines = fencedProduction(section, firstLine).split('\n');
  expect(lines, 'the fence holds exactly two lines').toHaveLength(2);
  return lines;
}

/** null when `body` carries the fence's lines in step 4a; otherwise a failure naming the body and the line. */
function checkBody(name: string, body: string, fence: string[]): string | null {
  const lines = body.split('\n');
  const at = lines.findIndex(l => l.trim() === DEPENDENCY_READ);
  if (at < 0) return `${name}: no dependency-read line (${DEPENDENCY_READ})`;
  for (const [k, expected] of fence.entries()) {
    if (lines[at + 1 + k]?.trim() !== expected) {
      return `${name}: line ${k + 1} of the fence is not at step 4a line ${at + 2 + k}: ${expected}`;
    }
  }
  if (!lines[at + 1 + fence.length]?.trim().startsWith(CREATE_ARTIFACT)) {
    return `${name}: the fence's lines are not followed by ${CREATE_ARTIFACT}`;
  }
  return null;
}

const BODIES: [string, () => string][] = [
  ['orbit-propose', () => getOrbitProposeSkillTemplate().instructions],
  ['orbit-ff-change', () => getFfChangeSkillTemplate().instructions],
];

describe('propose-shaped bodies read the baseline before writing proposal.md (read-obligation)', () => {
  // @scenario text orbit-propose-modifications :: Propose-shaped bodies read the baseline before writing proposal.md :: Both generated bodies carry the two lines in step 4a
  it.each(BODIES)('%s carries the fence\'s two lines right after the dependency-read line', async (name, body) => {
    const fence = await fenceLines();
    expect(checkBody(name, body(), fence)).toBeNull();
  });

  // @scenario text orbit-propose-modifications :: Propose-shaped bodies read the baseline before writing proposal.md :: A body missing a line fails
  it.each(BODIES)('%s fails, naming the body and the line, when a line is removed or the lines are moved', async (name, body) => {
    const fence = await fenceLines();
    const text = body();
    for (const [k, line] of fence.entries()) {
      const removed = text.split('\n').filter(l => l.trim() !== line).join('\n');
      const failure = checkBody(name, removed, fence);
      expect(failure).toContain(name);
      expect(failure).toContain(fence[k]);
    }
    const lines = text.split('\n').filter(l => !fence.includes(l.trim()));
    const create = lines.findIndex(l => l.trim().startsWith(CREATE_ARTIFACT));
    lines.splice(create + 1, 0, ...fence.map(l => `      ${l}`));
    const moved = checkBody(name, lines.join('\n'), fence);
    expect(moved).toContain(name);
    expect(moved).toContain(fence[0]);
  });

  // @scenario text orbit-propose-modifications :: Upstream propose behavior preserved in standalone mode :: Standalone mode
  it("the propose body's standalone section falls through to upstream Step 1 and excepts the orbit steps that run in both modes", () => {
    const body = getOrbitProposeSkillTemplate().instructions;
    const start = body.indexOf('\n## Standalone mode\n');
    expect(start, 'the section is headed `## Standalone mode`').toBeGreaterThanOrEqual(0);
    const end = body.indexOf('\n## ', start + 1);
    const section = body.slice(start, end);
    expect(section).toContain('fall through to upstream Step 1');
    expect(section).toContain(
      'Upstream behavior is otherwise kept, apart from the orbit steps that run in both modes — among them the step 4a baseline read',
    );
  });
});
