/**
 * rc05 (design D1, D2): the CLI's grammar is one program, built by an exported
 * builder, and a neutralised build can be asked about grammar without effect.
 */
import { readFileSync } from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildProgram } from '../../../src/cli/program.js';
import { neutralise, parseArgv } from '../../helpers/neutral-program.js';

const ROOT = path.resolve(__dirname, '../../..');

afterEach(() => {
  vi.restoreAllMocks();
});

function spyEffects() {
  const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code}) was called`);
  }) as never);
  const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
  const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
  return { exit, stderr, stdout };
}

describe('the entry point', () => {
  // @scenario behaviour orbit-cli-grammar :: The CLI's grammar is one program, built by an exported builder :: The entry point declares nothing of its own
  it('declares no command, option or hook and builds through buildProgram, and a neutral build runs no action and no hook', async () => {
    const source = readFileSync(path.join(ROOT, 'src/cli/index.ts'), 'utf-8');
    expect(source).not.toMatch(/\.command\(/);
    expect(source).not.toMatch(/\.option\(/);
    expect(source).not.toMatch(/\.hook\(/);
    expect(source).toMatch(/import \{ buildProgram \} from '\.\/program\.js';/);
    expect(source).toMatch(/buildProgram\(\)\.parse\(\);/);

    const effects = spyEffects();
    // The root hook's only effect is setting NO_COLOR on `--no-color`; the spies cannot see it.
    const noColor = process.env.NO_COLOR;
    delete process.env.NO_COLOR;
    for (const argv of [
      ['config', '--scope', 'local', 'list'],
      ['schema', 'which'],
      ['change', 'list'],
      ['spec', 'list'],
      ['--no-color', 'list'],
      ['status', '--change', 'demo', '--json'],
    ]) {
      const result = await parseArgv(argv);
      expect(result, argv.join(' ')).toEqual({ ok: true, code: null, message: '' });
    }
    expect(process.env.NO_COLOR).toBeUndefined();
    if (noColor !== undefined) process.env.NO_COLOR = noColor;
    expect(effects.exit).not.toHaveBeenCalled();
    expect(effects.stderr).not.toHaveBeenCalled();
    expect(effects.stdout).not.toHaveBeenCalled();
  });

  it('the contrast: a build WITH hooks still fires the register modules\' hooks', async () => {
    const effects = spyEffects();
    const program = neutralise(buildProgram(), []);
    await program.parseAsync(['schema', 'which'], { from: 'user' });
    expect(effects.stderr).toHaveBeenCalledWith('Note: Schema commands are experimental and may change.');
    await expect(
      neutralise(buildProgram(), []).parseAsync(['config', '--scope', 'local', 'list'], { from: 'user' })
    ).rejects.toThrow('process.exit(1) was called');
  });
});

describe('the neutral parse', () => {
  // @scenario behaviour orbit-cli-grammar :: The CLI's grammar is one program, built by an exported builder :: A parse error throws instead of exiting
  it('rejects an undeclared option with commander\'s own message, and the process does not exit', async () => {
    const effects = spyEffects();
    const result = await parseArgv(['status', '--frobnicate']);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('commander.unknownOption');
    expect(result.message).toBe("error: unknown option '--frobnicate'");
    expect(effects.exit).not.toHaveBeenCalled();
  });

  // @scenario behaviour orbit-cli-grammar :: The CLI's grammar is one program, built by an exported builder :: A group command run without its subcommand is rejected
  it('rejects a group command run without a subcommand, and an unknown subcommand as unknown', async () => {
    const bare = await parseArgv(['external']);
    expect(bare.ok).toBe(false);
    expect(bare.code).toBe('commander.help');

    const unknown = await parseArgv(['external', 'frobnicate']);
    expect(unknown.ok).toBe(false);
    expect(unknown.code).toBe('commander.unknownCommand');
    expect(unknown.message).toBe("error: unknown command 'frobnicate'");
  });

  it('accepts --help and --version', async () => {
    const help = await parseArgv(['status', '--help']);
    expect(help).toMatchObject({ ok: true, code: 'commander.helpDisplayed' });
    const version = await parseArgv(['--version']);
    expect(version).toMatchObject({ ok: true, code: 'commander.version' });
  });

  // Commander throws `commander.help` for both; only the exit code tells them apart, as the CLI's
  // own exit status does (`orbit help status` exits 0, `orbit help frobnicate` and `orbit external` 1).
  it('accepts `help <command>` and rejects `help` of an unknown command, by exit code', async () => {
    expect(await parseArgv(['help', 'status'])).toMatchObject({ ok: true, code: 'commander.help' });
    expect(await parseArgv(['help', 'frobnicate'])).toMatchObject({ ok: false, code: 'commander.help' });
  });

  it('rejects a missing required argument and an excess argument', async () => {
    expect(await parseArgv(['fingerprint'])).toMatchObject({ ok: false, code: 'commander.missingArgument' });
    expect(await parseArgv(['list', 'extra'])).toMatchObject({ ok: false, code: 'commander.excessArguments' });
  });

  it('keeps and enforces a required option (`external save` without `--as`)', async () => {
    expect(await parseArgv(['external', 'save', 'c', '--from', 'r.md'])).toMatchObject({
      ok: false,
      code: 'commander.missingMandatoryOptionValue',
    });
    expect(await parseArgv(['external', 'save', 'c', '--as', 'system', '--from', 'r.md'])).toEqual({ ok: true, code: null, message: '' });
  });
});
