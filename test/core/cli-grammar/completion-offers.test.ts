/**
 * rc05 task 4.3: `orbit completion generate <shell>` offers orbit's own commands
 * at the TOP level of each shell's script (the registry filled under D5). Each
 * shell's top-level list is read in its own shape, so a subcommand of the same
 * name (`architecture status`) cannot satisfy the check.
 */
import { execFileSync, spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { runCLI } from '../../helpers/run-cli.js';

const ORBIT_COMMANDS = ['status', 'emit', 'architecture', 'external', 'fingerprint', 'instructions', 'templates', 'schemas', 'new'];

const TOP_LEVEL: Record<string, (script: string) => string[]> = {
  zsh: (s) => {
    const block = s.split('  commands=(\n')[1].split('\n  )\n')[0];
    return [...block.matchAll(/^\s+'([a-z_-]+):/gm)].map((m) => m[1]);
  },
  bash: (s) => (s.match(/local commands="([^"]*)"/)?.[1] ?? '').split(/\s+/),
  fish: (s) => [...s.matchAll(/^complete -c orbit -n '__fish_orbit_no_subcommand' -a '([a-z_-]+)'/gm)].map((m) => m[1]),
  powershell: (s) => {
    const block = s.split('# Top-level commands')[1].split('\n        )\n')[0];
    return [...block.matchAll(/@\{Name="([a-z_-]+)";/g)].map((m) => m[1]);
  },
};

function hasShell(shell: string): boolean {
  return spawnSync('sh', ['-c', `command -v ${shell}`]).status === 0;
}

describe('completion scripts offer orbit\'s own commands', () => {
  // @scenario behaviour orbit-cli-grammar :: The completion registry is a checked copy of the program :: The registry offers orbit's own commands
  it.each(Object.keys(TOP_LEVEL))('%s offers every orbit command at the top level', async (shell) => {
    const result = await runCLI(['completion', 'generate', shell]);
    expect(result.exitCode).toBe(0);
    const offered = TOP_LEVEL[shell](result.stdout);
    expect(offered).toContain('init');
    for (const cmd of ORBIT_COMMANDS) expect(offered, `${shell} offers ${cmd}`).toContain(cmd);
  });

  // The registry's descriptions reach the scripts inside shell quoting; a script that does not
  // parse offers nothing. Checked where the shell is installed.
  it.each(['zsh', 'bash'])('the generated %s script parses (`-n`)', async (shell) => {
    if (!hasShell(shell)) return;
    const result = await runCLI(['completion', 'generate', shell]);
    const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'orbit-completion-')), `orbit.${shell}`);
    writeFileSync(file, result.stdout);
    expect(() => execFileSync(shell, ['-n', file], { stdio: 'pipe' })).not.toThrow();
  });
});
