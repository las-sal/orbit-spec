/**
 * The CLI's program, built in-process and NEUTRALISED so commander's own parser
 * can be asked about grammar without any effect (`orbit-cli-grammar`'s
 * `The CLI's grammar is one program, built by an exported builder`, its
 * neutralisation table; design D2).
 *
 * - `hooks: false` at build: no `preAction` hook is registered.
 * - every command, recursively: `exitOverride()` and `configureOutput` capturing
 *   commander's message;
 * - `action(noop)` ONLY on a command that already declares an action, so a group
 *   command still rejects a run without a subcommand (`commander.help`) and still
 *   reports an unknown subcommand as unknown.
 *
 * The program is built fresh per parse, so option state cannot leak between
 * snippets.
 */
import { Command, CommanderError } from 'commander';
import { buildProgram } from '../../src/cli/program.js';
import type { CommandNode } from './surface-snippets.js';

/** The two exit codes that are an ACCEPTED parse; every other code rejects. */
export const ACCEPTED_EXIT_CODES: ReadonlySet<string> = new Set([
  'commander.helpDisplayed',
  'commander.version',
]);

export interface ParseResult {
  ok: boolean;
  /** commander's error code on a thrown exit, or null on a clean parse. */
  code: string | null;
  /** commander's own message (its error output when it wrote one). */
  message: string;
}

type ActionHolder = { _actionHandler: unknown };

export function neutralise(program: Command, sink: string[]): Command {
  const visit = (cmd: Command): void => {
    cmd.exitOverride();
    cmd.configureOutput({
      writeOut: (s) => sink.push(s),
      writeErr: (s) => sink.push(s),
      outputError: (s) => sink.push(s),
    });
    if ((cmd as unknown as ActionHolder)._actionHandler) cmd.action(() => {});
    for (const sub of cmd.commands) visit(sub);
  };
  visit(program);
  return program;
}

export function buildNeutralProgram(sink: string[] = []): Command {
  return neutralise(buildProgram({ hooks: false }), sink);
}

/** Hand one argument vector (without the leading `orbit`) to commander's parser. */
export async function parseArgv(argv: string[]): Promise<ParseResult> {
  const sink: string[] = [];
  const program = buildNeutralProgram(sink);
  try {
    await program.parseAsync(argv, { from: 'user' });
    return { ok: true, code: null, message: '' };
  } catch (error) {
    if (error instanceof CommanderError) {
      const message = (sink.join('').trim() || error.message).trim();
      return { ok: ACCEPTED_EXIT_CODES.has(error.code), code: error.code, message };
    }
    throw error;
  }
}

/** The program's command tree, for the extractor's bare-name rule. */
export function commandTree(program: Command = buildProgram({ hooks: false })): CommandNode {
  const visit = (cmd: Command): CommandNode => ({
    names: [cmd.name(), ...cmd.aliases()],
    children: cmd.commands.map(visit),
  });
  return visit(program);
}
