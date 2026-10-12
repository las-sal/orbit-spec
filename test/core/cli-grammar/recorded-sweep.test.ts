/**
 * rc05b exit (1): every `git` and `gh` snippet on the generated surface validates against its
 * tool's recorded contract, through the shared extractor, and the guard fails no line for
 * either tool. The bare-name tree is the contract's command keys (design D2).
 */
import { describe, expect, it } from 'vitest';
import { guardFailureLines } from '../../helpers/orbit-sweep.js';
import { analyseRecorded, commandTreeFromKeys, recordedTool, recordedTools, sweepRecorded } from '../../helpers/recorded-sweep.js';
import { describeSurface, generatedSurfaces, isBareCommandName, type Surface } from '../../helpers/surface-snippets.js';

const FENCE = '```';

/**
 * Non-vacuity floors, not pins: at rc05b's apply the sweep validated 101 `git` snippets (28 bare
 * names set aside) and 19 `gh` snippets (15 in references, as rc01's extractor found, and 4 in
 * SKILL.md bodies; 15 bare names set aside). An extractor that silently found nothing would pass
 * every validation; the floor fails it, while a body edit adding or removing a snippet does not.
 * MOVED by rc12-body-adoption (task 3.2), a recorded act: the PR references stopped carrying
 * D6's hand-run runbook, so the surface measured 50 `git` snippets (9 bare names) and 2 `gh`
 * snippets (the worked example in the propose and ff references; 1 bare name). The floors sit
 * below those measurements and still fail an extractor that finds nothing.
 */
const FLOOR = { git: 40, gh: 2 };

function surfaceNamed(id: string): Surface {
  const found = generatedSurfaces().find((s) => describeSurface(s) === id);
  if (!found) throw new Error(`no surface ${id}`);
  return found;
}

describe('the recorded-tool snippet sweep', () => {
  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: Today's surface validates for both recorded tools
  it.each(recordedTools().map((t) => [t.tool, t] as const))('every %s snippet validates and the guard fails no line', (tool, { contract, validate }) => {
    const analysis = analyseRecorded(generatedSurfaces(), tool, contract);
    expect(sweepRecorded(analysis, validate, contract)).toEqual([]);
    expect(guardFailureLines(analysis)).toEqual([]);
    expect(analysis.snippets.length).toBeGreaterThanOrEqual(FLOOR[tool]);
    expect(analysis.bareNames.length).toBeGreaterThan(0);
  });

  // MOVED by rc12-body-adoption (task 3.2), a recorded act: no generated body carries a `gh`
  // invocation since the architect readout calls `orbit pr program`, so the snippet is PLACED in
  // the architect SKILL.md rather than found there; the body is still read by the sweep.
  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: A gh snippet in a SKILL.md body is validated
  // @scenario behaviour orbit-pr-lifecycle :: Test instruments derive from a recorded real-CLI contract :: The sweep and the stub cannot disagree
  it('a gh snippet in a SKILL.md body is validated: an isDraft check without its <url>, placed in the architect body', () => {
    const { contract, validate } = recordedTool('gh');
    const base = surfaceNamed('architect/SKILL.md');
    const broken = 'gh pr view --repo <owner>/<repo> --json isDraft';
    expect(base.text).not.toContain('gh pr view');
    const text = `${base.text}\nCheck the draft state: \`${broken}\`.\n`;
    const line = text.split('\n').findIndex((l) => l.includes(broken)) + 1;
    const failures = sweepRecorded(analyseRecorded([{ ...base, text }], 'gh', contract), validate, contract);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(new RegExp(`^architect/SKILL\\.md:${line}: ${broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`));
    expect(failures[0]).toMatch(/argument required when using the --repo flag$/);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: An unknown git flag fails the sweep
  it('an unknown git flag in a reference\'s shell fence fails, naming the reference, the line, the snippet and the message', () => {
    const { contract, validate } = recordedTool('git');
    const surface: Surface = { workflowId: 'demo', file: 'references/x.md', text: `Commit:\n\n${FENCE}bash\ngit commit --only <paths> --frobnicate\n${FENCE}\n` };
    expect(sweepRecorded(analyseRecorded([surface], 'git', contract), validate, contract)).toEqual([
      'demo/references/x.md:4: git commit --only <paths> --frobnicate\n    flag --frobnicate on git commit is not in the recorded contract — re-run npm run capture:git',
    ]);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: A missing value fails the sweep
  it('an inline `git switch -c` fails: the contract records -c as value-taking', () => {
    const { contract, validate } = recordedTool('git');
    const surface: Surface = { workflowId: 'demo', file: 'SKILL.md', text: 'Then\nrun `git switch -c` to branch.\n' };
    expect(sweepRecorded(analyseRecorded([surface], 'git', contract), validate, contract)).toEqual([
      'demo/SKILL.md:2: git switch -c\n    flag -c on git switch requires a value',
    ]);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: An unrecorded subcommand fails and a recorded bare name is prose
  it('an unrecorded subcommand fails as unknown; a recorded bare name is prose', () => {
    const { contract, validate } = recordedTool('git');
    const surface: Surface = { workflowId: 'demo', file: 'SKILL.md', text: 'Use `git frobnicate <path>`, then `git push`.\n' };
    const analysis = analyseRecorded([surface], 'git', contract);
    expect(analysis.bareNames.map((s) => s.text)).toEqual(['git push']);
    expect(sweepRecorded(analysis, validate, contract)).toEqual([
      'demo/SKILL.md:1: git frobnicate <path>\n    unknown command "frobnicate" for "git" — re-run npm run capture:git',
    ]);
  });
});

describe('the bare-name tree is the contract\'s command keys', () => {
  const git = recordedTool('git');
  const gh = recordedTool('gh');
  const gitTree = commandTreeFromKeys(Object.keys(git.contract.commands));
  const ghTree = commandTreeFromKeys(Object.keys(gh.contract.commands));

  it('a key with nothing after is prose', () => {
    expect(isBareCommandName(['git', 'push'], gitTree)).toBe(true);
    expect(isBareCommandName(['git', 'worktree', 'remove'], gitTree)).toBe(true);
    expect(isBareCommandName(['gh', 'pr', 'merge'], ghTree)).toBe(true);
  });

  it('a key with more after is extracted', () => {
    expect(isBareCommandName(['git', 'push', '<r>'], gitTree)).toBe(false);
    expect(isBareCommandName(['gh', 'pr', 'ready', '--repo', '<o>/<r>', '<n>'], ghTree)).toBe(false);
  });

  it('a first word matching no key is extracted, so an invented verb cannot pass as prose', () => {
    expect(isBareCommandName(['git', 'frobnicate'], gitTree)).toBe(false);
    expect(isBareCommandName(['gh', 'frobnicate'], ghTree)).toBe(false);
  });

  it('a two-level key\'s first word alone is prose: an interior node', () => {
    expect(isBareCommandName(['git', 'worktree'], gitTree)).toBe(true);
    expect(isBareCommandName(['gh', 'pr'], ghTree)).toBe(true);
  });

  it('a segment of an inline span takes the rule on its own: one validated snippet, one prose name', () => {
    const surface: Surface = { workflowId: 'demo', file: 'SKILL.md', text: 'Run `git fetch <r> && git push` now.\n' };
    const analysis = analyseRecorded([surface], 'git', git.contract);
    expect(analysis.snippets.map((s) => s.tokens)).toEqual([['git', 'fetch', '<r>']]);
    expect(analysis.bareNames.map((s) => s.tokens)).toEqual([['git', 'push']]);
    expect(sweepRecorded(analysis, git.validate, git.contract)).toEqual([]);
  });
});
