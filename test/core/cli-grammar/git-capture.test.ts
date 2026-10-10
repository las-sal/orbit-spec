/**
 * rc05b task 2.3: the `git` capture's classifiers are pure functions over `{status, firstLine}`,
 * exercised here with lines recorded from real git 2.50.1 (explore.md Cases 1–3, each probe in
 * a fresh copy of a one-commit repository). No test spawns git.
 */
import { describe, expect, it } from 'vitest';
import {
  BOGUS_VERB,
  CaptureError,
  acceptanceArgs,
  acceptanceFrom,
  classFrom,
  firstLineOf,
  flagEntry,
  flagsWritten,
  formsByName,
  isGroup,
  isRejection,
  keyOf,
  knownFrom,
  positionalRequiredFrom,
  probeForm,
  takesValueFrom,
  type Probe,
} from '../../helpers/git-capture.js';

const p = (status: number | null, firstLine: string): Probe => ({ status, firstLine });

/** Recorded first lines, real git 2.50.1. */
const LINES = {
  commitBogus: "error: unknown option `orbit-capture-bogus'",
  commitUsage: 'usage: git commit [-a | --interactive | --patch] [-s] [-v] [-u[<mode>]] [--amend]',
  commitMNoValue: "error: switch `m' requires a value",
  revListUsage: 'usage: git rev-list [<options>] <commit>... [--] [<path>...]',
  checkRefFormatUsage: 'usage: git check-ref-format [--normalize] [<options>] <refname>',
  checkRefFormatBranchHead: "fatal: 'HEAD' is not a valid branch name",
  worktreeBogusVerb: "error: unknown subcommand: `orbitcapturebogusverb'",
  pushBogusVerb: 'fatal: The current branch main has no upstream branch.',
  revParseEcho: '--orbit-capture-bogus',
  logUnrecognised: 'fatal: unrecognized argument: --frobnicate',
  statusShortTakesNoValue: "error: option `short' takes no value",
  switchUnknown: "error: unknown option `orbit-x'",
  diffInvalid: 'error: invalid option: --bogus-diff',
  unknownSwitch: "error: unknown switch `Q'",
  notAGitCommand: "git: 'frobnicate' is not a git command. See 'git --help'.",
  worktreeFrobverb: "error: unknown subcommand: `frobverb'",
  logSinceNoValue: "fatal: Option '--since' requires a value",
  diffFilterNoValue: "error: option `diff-filter' requires a value",
  worktreeRemoveUsage: 'usage: git worktree remove [-f] <worktree>',
  statusUsage: 'usage: git status [<options>] [--] [<pathspec>...]',
  logBogusUnderHelp: 'usage: git log [<options>] [<revision-range>] [[--] <path>...]',
};

describe('the rejection shapes', () => {
  it.each([
    LINES.commitBogus,
    LINES.switchUnknown,
    LINES.diffInvalid,
    LINES.unknownSwitch,
    LINES.logUnrecognised,
    LINES.statusShortTakesNoValue,
  ])('%s is a rejection', (line) => {
    expect(isRejection(line)).toBe(true);
  });

  it.each([LINES.commitUsage, LINES.revParseEcho, LINES.checkRefFormatBranchHead, LINES.commitMNoValue, LINES.notAGitCommand, '1', ''])(
    '%j is not a rejection',
    (line) => {
      expect(isRejection(line)).toBe(false);
    }
  );

  it('an `error: option` line is a rejection only when it ends `takes no value`', () => {
    expect(isRejection(LINES.diffFilterNoValue)).toBe(false);
  });

  it('the first line is stderr\'s first non-empty line, else stdout\'s', () => {
    expect(firstLineOf(`\n${LINES.commitBogus}\n${LINES.commitUsage}\n`, '')).toBe(LINES.commitBogus);
    expect(firstLineOf('', `${LINES.commitUsage}   \n`)).toBe(LINES.commitUsage);
    expect(firstLineOf('', '')).toBe('');
  });
});

describe('groups and keys', () => {
  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: A group's verb is a key and another command's second word is an argument
  it('a bogus verb reporting `unknown subcommand` makes a group; the group\'s verb is the key, another command\'s second word an argument', () => {
    expect(isGroup(p(129, LINES.worktreeBogusVerb))).toBe(true);
    expect(isGroup(p(128, LINES.pushBogusVerb))).toBe(false);
    const groups = new Set(['worktree']);
    expect(keyOf(['worktree', 'remove', '--force', '<dir>'], groups)).toBe('worktree remove');
    expect(keyOf(['push', '<remote>', '<branch>'], groups)).toBe('push');
    expect(BOGUS_VERB).toBe('orbitcapturebogusverb');
  });

  it('a group segment whose second token is a flag, a placeholder, or absent has no key', () => {
    const groups = new Set(['worktree']);
    expect(keyOf(['worktree', '--force'], groups)).toBeNull();
    expect(keyOf(['worktree', '<verb>'], groups)).toBeNull();
    expect(keyOf(['worktree'], groups)).toBeNull();
    expect(keyOf([], groups)).toBeNull();
  });

  it('reads the flags a segment writes after its key, up to `--`, by name', () => {
    expect(flagsWritten(['log', '--diff-filter=A', '--format=%h', '-S', '<s>', '--', '-x'], 'log')).toEqual([
      { name: '--diff-filter', written: '--diff-filter=A' },
      { name: '--format', written: '--format=%h' },
      { name: '-S', written: '-S' },
    ]);
    expect(flagsWritten(['log', '-S<symbol>'], 'log')).toEqual([{ name: '-S', written: '-S<symbol>' }]);
    expect(flagsWritten(['worktree', 'remove', '--force', '<dir>'], 'worktree remove')).toEqual([{ name: '--force', written: '--force' }]);
  });

  it('every distinct written form of a flag reaches a probe, the second form too (system walk, fresh W1)', () => {
    const forms = formsByName([['commit', '--only', '<p>'], ['commit', '--only=<p>'], ['commit', '--only', '<q>'], ['commit', '--only=<q>']], 'commit');
    expect([...forms]).toEqual([['--only', [{ name: '--only', written: '--only' }, { name: '--only', written: '--only=<p>' }]]]);
    expect(forms.get('--only')!.map((f) => acceptanceArgs('commit', f, false, 'parse-options'))).toEqual([
      ['commit', '--only', '-h'],
      ['commit', '--only=x', '-h'],
    ]);
  });

  it('a name is rejected when any written form is, with that form\'s line, though an earlier form was accepted', () => {
    const rejected = { accepted: false as const, message: "error: option `only' takes no value" };
    expect(flagEntry('--only', false, [{ accepted: true }, rejected])).toEqual({ name: '--only', takes_value: false, ...rejected });
    expect(flagEntry('--only', false, [{ accepted: true }, { accepted: true }])).toEqual({ name: '--only', takes_value: false, accepted: true });
  });

  it('a flag is probed as written, a placeholder value standing as `x`', () => {
    expect(probeForm({ name: '--format', written: '--format=%h' })).toBe('--format=%h');
    expect(probeForm({ name: '--since', written: '--since=<window>' })).toBe('--since=x');
    expect(probeForm({ name: '-u', written: '-u' })).toBe('-u');
  });
});

describe('known', () => {
  it('a usage page records the command known', () => {
    expect(knownFrom('status', p(129, LINES.statusUsage))).toEqual({ known: true });
  });

  it('`is not a git command` and `unknown subcommand` record it unknown, with git\'s line', () => {
    expect(knownFrom('frobnicate', p(1, LINES.notAGitCommand))).toEqual({ known: false, message: LINES.notAGitCommand });
    expect(knownFrom('worktree frobverb', p(129, LINES.worktreeFrobverb))).toEqual({ known: false, message: LINES.worktreeFrobverb });
  });

  it('any other line fails the capture', () => {
    expect(() => knownFrom('x', p(0, ''))).toThrow(CaptureError);
  });
});

describe('the probe class', () => {
  it('a bogus flag rejected under -h is PARSE-OPTIONS', () => {
    expect(classFrom('commit', p(129, LINES.commitBogus), p(129, LINES.commitBogus))).toBe('parse-options');
  });

  it('a bogus flag rejected, or printing usage, with HEAD is RUN', () => {
    expect(classFrom('log', p(129, LINES.logBogusUnderHelp), p(128, 'fatal: unrecognized argument: --orbit-capture-bogus'))).toBe('run');
    expect(classFrom('check-ref-format', p(129, LINES.checkRefFormatUsage), p(129, LINES.checkRefFormatUsage))).toBe('run');
  });

  it('a command neither probe rejects takes its named orbit-side rule', () => {
    expect(classFrom('rev-parse', p(0, LINES.revParseEcho), p(0, LINES.revParseEcho))).toBe('rule');
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: The capture refuses a command it cannot classify
  it('a command neither probe rejects, with no orbit-side rule, fails the capture naming it', () => {
    // The capture throws before it writes, so no contract is written.
    expect(() => classFrom('frobcommand', p(0, '--orbit-capture-bogus'), p(0, 'ok'))).toThrow(
      /^git frobcommand: neither bogus-flag probe is rejected and no orbit-side rule names it/
    );
  });
});

describe('value-taking', () => {
  it.each([LINES.commitMNoValue, LINES.logSinceNoValue, LINES.diffFilterNoValue])('%s records the flag value-taking', (line) => {
    expect(takesValueFrom(p(129, line))).toBe(true);
  });

  it('a usage page or any other line does not', () => {
    expect(takesValueFrom(p(129, LINES.revListUsage))).toBe(false);
    expect(takesValueFrom(p(128, 'fatal: unrecognized argument: --format'))).toBe(false);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: A value-taking flag is probed with a stand-in value
  it('a value-taking flag is probed with a stand-in value, never with -h as its value', () => {
    const m = { name: '-m', written: '-m' };
    expect(takesValueFrom(p(129, LINES.commitMNoValue))).toBe(true);
    const args = acceptanceArgs('commit', m, true, 'parse-options');
    expect(args).toEqual(['commit', '-m', 'x', '-h']);
    expect(args).not.toEqual(['commit', '-m', '-h']);
    expect(acceptanceFrom('parse-options', `git ${args.join(' ')}`, p(129, LINES.commitUsage))).toEqual({ accepted: true });
  });

  it('no stand-in when the surface attached the value, and none for a flag that takes none', () => {
    expect(acceptanceArgs('log', { name: '--since', written: '--since=<window>' }, true, 'run')).toEqual(['log', '--since=x', 'HEAD']);
    expect(acceptanceArgs('push', { name: '-u', written: '-u' }, false, 'parse-options')).toEqual(['push', '-u', '-h']);
  });
});

describe('acceptance', () => {
  it('PARSE-OPTIONS: usage is accepted, a rejection shape rejected with git\'s line', () => {
    expect(acceptanceFrom('parse-options', 'git commit -m x -h', p(129, LINES.commitUsage))).toEqual({ accepted: true });
    expect(acceptanceFrom('parse-options', 'git status --short=x -h', p(129, LINES.statusShortTakesNoValue))).toEqual({
      accepted: false,
      message: LINES.statusShortTakesNoValue,
    });
    expect(acceptanceFrom('parse-options', 'git diff --bogus-diff -h', p(129, LINES.diffInvalid))).toEqual({
      accepted: false,
      message: LINES.diffInvalid,
    });
  });

  it('PARSE-OPTIONS: any other line fails the capture naming the probe', () => {
    expect(() => acceptanceFrom('parse-options', 'git commit --x -h', p(0, 'something else'))).toThrow(/^git commit --x -h: neither/);
  });

  it('RUN: a rejection shape or a usage page is rejected, with git\'s line', () => {
    expect(acceptanceFrom('run', 'git log --frobnicate HEAD', p(128, LINES.logUnrecognised))).toEqual({
      accepted: false,
      message: LINES.logUnrecognised,
    });
    expect(acceptanceFrom('run', 'git rev-list --frobnicate HEAD', p(129, LINES.revListUsage))).toEqual({
      accepted: false,
      message: LINES.revListUsage,
    });
  });

  it('RUN: anything else is accepted, a fatal on the name included', () => {
    expect(acceptanceFrom('run', 'git check-ref-format --branch HEAD', p(128, LINES.checkRefFormatBranchHead))).toEqual({ accepted: true });
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: A flag on a command that needs a positional is recorded accepted
  it('rev-list is RUN, --count with HEAD exits 0 and is accepted, though --count alone prints usage', () => {
    expect(classFrom('rev-list', p(129, LINES.revListUsage), p(129, LINES.revListUsage))).toBe('run');
    expect(acceptanceFrom('run', 'git rev-list --count HEAD', p(0, '1'))).toEqual({ accepted: true });
    // `git rev-list --count` alone: usage, which is neither value-taking nor (in RUN) the acceptance probe.
    expect(takesValueFrom(p(129, LINES.revListUsage))).toBe(false);
    expect(positionalRequiredFrom(p(129, LINES.revListUsage))).toBe(true);
  });
});

describe('the positional', () => {
  it('a usage page from the command alone records a required positional', () => {
    expect(positionalRequiredFrom(p(129, LINES.worktreeRemoveUsage))).toBe(true);
  });

  it('any other line does not', () => {
    expect(positionalRequiredFrom(p(128, 'fatal: No configured push destination.'))).toBe(false);
    expect(positionalRequiredFrom(p(0, ''))).toBe(false);
  });
});
