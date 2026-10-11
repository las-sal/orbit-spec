/**
 * rc05b task 3.2: the `git` validator, one case per branch of design D5, over the checked-in
 * contract (and a synthetic one where today's contract records no instance of the branch).
 */
import { describe, expect, it } from 'vitest';
import { analyseRecorded, recordedTool, sweepRecorded, type RecordedContract } from '../../helpers/recorded-sweep.js';
import type { Surface } from '../../helpers/surface-snippets.js';

const { contract, validate } = recordedTool('git');
const v = (snippet: string) => validate(snippet.split(' ').slice(1), contract);

const FENCE = '```';
const sweep = (text: string, c: RecordedContract = contract) => {
  const surface: Surface = { workflowId: 'demo', file: 'references/x.md', text };
  return sweepRecorded(analyseRecorded([surface], 'git', c), validate, c);
};

describe('the git validator', () => {
  it('accepts today\'s forms: a recorded command, its recorded flags, placeholders as values', () => {
    expect(v('git commit --only <paths> -m <msg>').ok).toBe(true);
    expect(v('git log --diff-filter=A --format=%h -- <file>').ok).toBe(true);
    expect(v('git worktree remove --force <dir>').ok).toBe(true);
  });

  it('takes the longest key: `worktree remove`, never `worktree`', () => {
    expect(v('git worktree remove --force <dir>')).toMatchObject({ ok: true, command: 'worktree remove' });
  });

  it('a key the contract records unknown fails with git\'s recorded line', () => {
    const synthetic = { ...contract, commands: { ...contract.commands, frobnicate: { known: false, message: "git: 'frobnicate' is not a git command. See 'git --help'." } } };
    expect(validate(['frobnicate', '<path>'], synthetic)).toEqual({
      ok: false,
      message: "git: 'frobnicate' is not a git command. See 'git --help'.",
    });
  });

  it('a leading word matching no recorded key fails as an unknown command, with the re-capture hint', () => {
    expect(v('git frobnicate <path>')).toEqual({ ok: false, message: 'unknown command "frobnicate" for "git" — re-run npm run capture:git' });
    expect(v('git worktree frobnicate <dir>')).toEqual({
      ok: false,
      message: 'unknown command "worktree frobnicate" for "git" — re-run npm run capture:git',
    });
  });

  it('a flag matches a recorded name exactly: no abbreviation, no bundling', () => {
    expect(v('git commit --onl <p>').message).toMatch(/flag --onl on git commit is not in the recorded contract/);
    expect(v('git add -Au <p>').message).toMatch(/flag -Au on git add is not in the recorded contract/);
  });

  it('a rejected flag fails with git\'s recorded message', () => {
    const synthetic = structuredClone(contract) as typeof contract & { commands: Record<string, { flags: { name: string; accepted: boolean; message?: string }[] }> };
    synthetic.commands.status.flags.push({ name: '--short', takes_value: false, accepted: false, message: "error: option `short' takes no value" } as never);
    expect(validate(['status', '--short', '<p>'], synthetic)).toEqual({ ok: false, message: "error: option `short' takes no value" });
    expect(validate(['status', '--short=x'], synthetic)).toEqual({ ok: false, message: "error: option `short' takes no value" });
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: A flag added after capture asks for re-capture
  it('an unrecorded flag fails naming npm run capture:git', () => {
    const failures = sweep(`${FENCE}bash\ngit log --oneline -- <file>\n${FENCE}\n`);
    expect(failures).toEqual([
      'demo/references/x.md:2: git log --oneline -- <file>\n    flag --oneline on git log is not in the recorded contract — re-run npm run capture:git',
    ]);
  });

  it('a value-taking flag consumes the next token, separate, `=`-attached, or a short attached value', () => {
    expect(v('git switch -c <branch> --track <r>/<b>').ok).toBe(true);
    expect(v('git log --since <window>').ok).toBe(true);
    expect(v('git log --since=<window>').ok).toBe(true);
    expect(v('git log -S<symbol>').ok).toBe(true);
    // The consumed token is the value, never a positional: `-m` eats `-h`-looking text too.
    expect(v('git commit -m --only').ok).toBe(true);
  });

  it('a value-taking flag with nothing after it fails', () => {
    expect(v('git switch -c')).toEqual({ ok: false, message: 'flag -c on git switch requires a value' });
  });

  it('an attached short value on a flag that takes none is not recorded', () => {
    expect(v('git push -ux <r>').message).toMatch(/flag -ux on git push is not in the recorded contract/);
  });

  it('`--name=value` is accepted on any accepted long flag (the named limit)', () => {
    expect(v('git status --porcelain=v1').ok).toBe(true);
  });

  it('`--` ends options: every later token is a positional', () => {
    expect(v('git diff --name-only <c> -- . :!x --frobnicate').ok).toBe(true);
  });

  it('a command recorded as requiring a positional fails without one', () => {
    expect(v('git worktree remove --force')).toEqual({ ok: false, message: 'git worktree remove requires an argument' });
    expect(v('git merge-base <a> <b>').ok).toBe(true);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: The orbit-side rule rejects what git would accept
  it('rev-parse applies the recorded-flags rule: an unrecorded flag fails under it, though git echoes it', () => {
    expect(v('git rev-parse --abbrev-ref HEAD').ok).toBe(true);
    expect(sweep(`${FENCE}bash\ngit rev-parse --frobnicate HEAD\n${FENCE}\n`)).toEqual([
      'demo/references/x.md:2: git rev-parse --frobnicate HEAD\n    flag --frobnicate on git rev-parse is not recorded, and the orbit-side rule rev_parse_recorded_flags_only accepts recorded flags only — re-run npm run capture:git',
    ]);
  });

  it('a placeholder passes as a value or a positional, exactly as a real value', () => {
    expect(validate(['commit', '--only', '<the same enumerated paths>'], contract).ok).toBe(true);
    expect(v('git symbolic-ref refs/remotes/<resolved-remote>/HEAD').ok).toBe(true);
  });
});
