import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { InitCommand, runExternalRunnerSetup, type RunnerSetupPrompts } from '../../src/core/init.js';

/**
 * rc17d-external-runner task 3.2 — init's external-runner setup step. The step is driven through
 * injected prompts (the step's own seam), so each row of the init table runs without a TTY; the
 * non-interactive row runs the real `InitCommand`.
 */

const tmp = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-init-runner-'));

function codexBin(): string {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'codex'), '#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(dir, 'codex'), 0o755);
  return dir;
}

describe('init: the external-runner setup step', () => {
  let xdg: string;
  let saved: string | undefined;
  const cfgPath = (): string => path.join(xdg, 'openspec', 'config.json');
  const writeRecord = (v: unknown): void => {
    fs.mkdirSync(path.dirname(cfgPath()), { recursive: true });
    fs.writeFileSync(cfgPath(), JSON.stringify({ externalRunner: v }));
  };
  const record = (): unknown =>
    fs.existsSync(cfgPath()) ? JSON.parse(fs.readFileSync(cfgPath(), 'utf-8')).externalRunner : undefined;

  const prompts = (answer: string, inputs: string[] = []) => {
    const seen: { choices: string[]; default?: string; inputs: number } = { choices: [], inputs: 0 };
    const p: RunnerSetupPrompts = {
      select: async (o) => {
        seen.choices = o.choices.map((c) => c.value);
        seen.default = o.default;
        return answer;
      },
      input: async () => inputs[seen.inputs++] ?? (() => { throw new Error('asked too often'); })(),
    };
    return { p, seen };
  };
  const lines: string[] = [];
  const log = (l: string): void => void lines.push(l);

  beforeEach(() => {
    xdg = tmp();
    saved = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = xdg;
    lines.length = 0;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = saved;
  });

  // @scenario behaviour orbit-external-runner :: The runner record is written by init and edited by orbit config :: Interactive init offers the preset when codex is present
  it('explains the runner and offers the preset when codex resolves; choosing it writes {"preset": "codex"}', async () => {
    const { p, seen } = prompts('preset');
    expect(await runExternalRunnerSetup(p, { env: { PATH: codexBin() }, log })).toBe('preset');
    expect(seen.choices).toEqual(['preset', 'argv', 'none']);
    expect(lines.join('\n')).toMatch(/another AI that reviews a change from a packaged prompt/);
    expect(record()).toEqual({ preset: 'codex' });
  });

  it('does not offer the preset when codex does not resolve', async () => {
    const { p, seen } = prompts('none');
    await runExternalRunnerSetup(p, { env: { PATH: tmp() }, log });
    expect(seen.choices).toEqual(['argv', 'none']);
  });

  it('none writes nothing when no record exists', async () => {
    const { p } = prompts('none');
    await runExternalRunnerSetup(p, { env: { PATH: '' }, log });
    expect(fs.existsSync(cfgPath())).toBe(false);
  });

  it('a refused JSON array asks again; a well-formed one is written', async () => {
    const { p, seen } = prompts('argv', ['["my-reviewer"]', 'not json', '"a string"', '["my-reviewer", "--out", "{output}"]']);
    expect(await runExternalRunnerSetup(p, { env: { PATH: '' }, log })).toBe('argv');
    expect(seen.inputs).toBe(4);
    expect(lines.join('\n')).toMatch(/carries no \{output\}/);
    expect(record()).toEqual({ argv: ['my-reviewer', '--out', '{output}'] });
  });

  it('a well-formed record is shown and kept by default', async () => {
    writeRecord({ preset: 'codex' });
    const { p, seen } = prompts('kept');
    expect(await runExternalRunnerSetup(p, { env: { PATH: '' }, log })).toBe('kept');
    expect(seen.default).toBe('kept');
    expect(seen.choices[0]).toBe('kept');
    expect(lines.join('\n')).toContain('Current: {"preset":"codex"}');
    expect(record()).toEqual({ preset: 'codex' });
  });

  it('a malformed record is shown with its warning; no choice keeps it', async () => {
    writeRecord('codex exec -');
    const { p, seen } = prompts('none');
    await runExternalRunnerSetup(p, { env: { PATH: codexBin() }, log });
    expect(seen.choices).not.toContain('kept');
    expect(seen.default).toBe('none');
    expect(lines.join('\n')).toMatch(/malformed: externalRunner is a string/);
    expect(record()).toBeUndefined();
  });

  // @scenario behaviour orbit-external-runner :: The runner record is written by init and edited by orbit config :: Non-interactive init leaves the record alone
  it('non-interactive init (--tools claude) shows no prompt and leaves the record unchanged', async () => {
    writeRecord({ argv: ['my-reviewer', '{output}'] });
    const before = fs.readFileSync(cfgPath(), 'utf-8');
    const project = tmp();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await new InitCommand({ tools: 'claude', force: true }).execute(project);
    } finally {
      vi.restoreAllMocks();
    }
    expect(fs.readFileSync(cfgPath(), 'utf-8')).toBe(before);
  });
});
