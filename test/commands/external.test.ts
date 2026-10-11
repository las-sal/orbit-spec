import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCLI } from '../helpers/run-cli.js';

/**
 * rc17d-external-runner tasks 1.4 (the config path through the real CLI), 2.1, 2.3 and 5.2 —
 * `orbit external runner` prints one JSON object on stdout with every warning on stderr, `orbit
 * config set` writes and refuses the record, `orbit external save` exits non-zero and writes nothing
 * on refusal, and a runner on PATH with no record is never surfaced as one.
 */

const tmp = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-ext-cli-'));

describe('orbit external (CLI)', () => {
  let xdg: string;
  let emptyPath: string;
  const env = (): NodeJS.ProcessEnv => ({ XDG_CONFIG_HOME: xdg });
  const writeConfig = (cfg: unknown): void => {
    fs.mkdirSync(path.join(xdg, 'openspec'), { recursive: true });
    fs.writeFileSync(path.join(xdg, 'openspec', 'config.json'), JSON.stringify(cfg));
  };
  const readConfig = (): Record<string, unknown> =>
    JSON.parse(fs.readFileSync(path.join(xdg, 'openspec', 'config.json'), 'utf-8'));

  beforeEach(() => {
    xdg = tmp();
    emptyPath = tmp();
  });

  it('runner --json prints {"runner": null} and nothing on stderr when nothing is recorded', async () => {
    const r = await runCLI(['external', 'runner', '--json'], { env: env() });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({ runner: null });
    expect(r.stderr).toBe('');
  });

  it('runner --json keeps stdout one JSON object when the record is malformed; the warning is on stderr', async () => {
    writeConfig({ externalRunner: 'codex exec -' });
    const r = await runCLI(['external', 'runner', '--json'], { env: env() });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({ runner: null });
    expect(r.stderr).toMatch(/externalRunner/);
  });

  it('runner --json prints the preset shape, placeholders intact', async () => {
    writeConfig({ externalRunner: { preset: 'codex' } });
    const r = await runCLI(['external', 'runner', '--json'], { env: { ...env(), PATH: `${path.dirname(process.execPath)}` } });
    const out = JSON.parse(r.stdout);
    expect(out.runner).toMatchObject({ form: 'preset', name: 'codex' });
    expect(out.runner.argv).toContain('{worktree}');
    expect(out.runner.argv).toContain('{output}');
    expect(typeof out.runner.reachable).toBe('boolean');
  });

  // @scenario behaviour orbit-external-runner :: A runner is used only through the user's record :: A runner on PATH is never launched without a record
  it('exit (3): a codex on PATH with no record resolves to none, and nothing runs', async () => {
    const bin = tmp();
    const marker = path.join(bin, 'ran');
    fs.writeFileSync(path.join(bin, 'codex'), `#!/bin/sh\ntouch '${marker}'\n`);
    fs.chmodSync(path.join(bin, 'codex'), 0o755);
    const r = await runCLI(['external', 'runner', '--json'], {
      env: { ...env(), PATH: `${bin}${path.delimiter}${process.env.PATH}` },
    });
    expect(JSON.parse(r.stdout)).toEqual({ runner: null });
    expect(fs.existsSync(marker)).toBe(false);
  });

  // @scenario behaviour orbit-external-runner :: The external runner is recorded in the per-user global config :: orbit config accepts the key
  it('config set externalRunner.preset codex is written without --allow-unknown', async () => {
    const r = await runCLI(['config', 'set', 'externalRunner.preset', 'codex'], { env: env() });
    expect(r.exitCode).toBe(0);
    expect(readConfig().externalRunner).toEqual({ preset: 'codex' });
  });

  // @scenario behaviour orbit-external-runner :: The external runner is recorded in the per-user global config :: Switching from an own argv to the preset needs an unset first
  it('config set externalRunner.preset over a recorded argv is refused, naming the unset; the record is unchanged', async () => {
    writeConfig({ externalRunner: { argv: ['my-reviewer', '{output}'] } });
    const r = await runCLI(['config', 'set', 'externalRunner.preset', 'codex'], { env: env() });
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('orbit config unset externalRunner');
    expect(readConfig().externalRunner).toEqual({ argv: ['my-reviewer', '{output}'] });
    const u = await runCLI(['config', 'unset', 'externalRunner'], { env: env() });
    expect(u.exitCode).toBe(0);
    expect(readConfig().externalRunner).toBeUndefined();
    const s = await runCLI(['config', 'set', 'externalRunner.preset', 'codex'], { env: env() });
    expect(s.exitCode).toBe(0);
  });

  it('config unset externalRunner.preset drops the emptied record, so nothing warns afterwards', async () => {
    writeConfig({ externalRunner: { preset: 'codex' } });
    const u = await runCLI(['config', 'unset', 'externalRunner.preset'], { env: env() });
    expect(u.exitCode).toBe(0);
    expect('externalRunner' in readConfig()).toBe(false);
    const r = await runCLI(['external', 'runner', '--json'], { env: env() });
    expect(JSON.parse(r.stdout)).toEqual({ runner: null });
    expect(r.stderr).toBe('');
  });

  describe('save', () => {
    let root: string;
    let src: string;
    beforeEach(() => {
      root = tmp();
      fs.mkdirSync(path.join(root, 'orbit', 'changes', 'my-change'), { recursive: true });
      src = path.join(tmp(), 'raw.md');
    });
    const runs = (): string[] => {
      const d = path.join(root, 'orbit', 'changes', 'my-change', '.orbit-runs');
      return fs.existsSync(d) ? fs.readdirSync(d) : [];
    };

    it('--json prints {path, removed} on success', async () => {
      fs.writeFileSync(
        src,
        'preamble\n# External Review: my-change (iteration 1)\n\n**Reviewer**: m\n**Date**: 2026-10-06\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
      );
      const r = await runCLI(['external', 'save', 'my-change', '--as', 'system', '--from', src, '--json'], { cwd: root });
      expect(r.exitCode).toBe(0);
      const out = JSON.parse(r.stdout);
      expect(out.removed).toEqual(['preamble']);
      expect(out.path).toMatch(/^orbit\/changes\/my-change\/\.orbit-runs\/external-system-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/);
      expect(runs()).toHaveLength(1);
    });

    it.each([
      ['no unfenced heading', ['--as', 'system'], 'no heading here\n'],
      ['--as architecture', ['--as', 'architecture'], '# External Review: my-change (iteration 1)\n'],
      ['a reader rejection', ['--as', 'system'], '# External Review: my-change (iteration 1)\n'],
    ])('%s exits non-zero, names the source on stderr, and writes nothing', async (_l, flags, body) => {
      fs.writeFileSync(src, body);
      const r = await runCLI(['external', 'save', 'my-change', ...flags, '--from', src], { cwd: root });
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toContain(src);
      expect(r.stdout).toBe('');
      expect(runs()).toEqual([]);
    });

    it('a change that does not exist exits non-zero', async () => {
      fs.writeFileSync(src, '# External Review: nope (iteration 1)\n');
      const r = await runCLI(['external', 'save', 'nope', '--as', 'system', '--from', src], { cwd: root });
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toMatch(/does not exist/);
    });
  });
});
