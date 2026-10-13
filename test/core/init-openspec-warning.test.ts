/**
 * concept-docs task 2.2 (design D3): `orbit-init-openspec-warning`'s `orbit init warns when an OpenSpec project directory
 * sits beside it`. Each case runs a real non-interactive init (`--tools claude`) in its own temp directory.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  InitCommand,
  MIGRATION_GUIDE_URL,
  OPENSPEC_PROJECT_WARNING,
  detectOpenspecProject,
} from '../../src/core/init.js';

describe('orbit init beside an OpenSpec project', () => {
  let dir: string;
  let configDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let logs: string[];
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-init-openspec-'));
    configDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-init-openspec-config-'));
    originalEnv = { ...process.env };
    process.env.XDG_CONFIG_HOME = configDir;
    logs = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });
    exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
  });

  afterEach(async () => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    await fs.rm(dir, { recursive: true, force: true });
    await fs.rm(configDir, { recursive: true, force: true });
  });

  const mkdir = (...parts: string[]) => fs.mkdir(path.join(dir, ...parts), { recursive: true });
  const write = async (rel: string, text: string) => {
    await mkdir(path.dirname(rel));
    await fs.writeFile(path.join(dir, rel), text);
  };
  const init = () => new InitCommand({ tools: 'claude' }).execute(dir);
  const warned = () => logs.findIndex((l) => l.includes(OPENSPEC_PROJECT_WARNING));
  const exists = (rel: string) => fs.stat(path.join(dir, rel)).then(() => true, () => false);

  /** Init completed and built orbit/ and the skills, never exiting. */
  async function proceeded() {
    expect(exit).not.toHaveBeenCalled();
    expect(await exists('orbit/specs')).toBe(true);
    expect(await exists('orbit/changes')).toBe(true);
    expect(await exists('.claude/skills/orbit-apply-change/SKILL.md')).toBe(true);
  }

  // @scenario behaviour orbit-init-openspec-warning :: orbit init warns when an OpenSpec project directory sits beside it :: A first init over an OpenSpec project warns and proceeds
  it('warns on a first init over an OpenSpec project, naming the move steps per state of orbit/ and the guide, then proceeds', async () => {
    await mkdir('openspec', 'specs', 'auth');
    await init();
    expect(warned()).toBeGreaterThanOrEqual(0);
    for (const phrase of [
      'separate from openspec/',
      'reads nothing in openspec/specs/',
      'openspec/changes/',
      'openspec-* skills and opsx commands',
      'no orbit/ yet: git mv openspec orbit, then orbit init',
      'orbit/ created by orbit init and holding no file but orbit/config.yaml: delete orbit/',
      'keep a copy',
      'orbit/ holding any other file',
      'merge by hand',
      'orbit/openspec/',
      MIGRATION_GUIDE_URL,
      'checklist first',
    ]) {
      expect(OPENSPEC_PROJECT_WARNING).toContain(phrase);
    }
    await proceeded();
    expect(await exists('openspec/specs/auth')).toBe(true);
  });

  // @scenario behaviour orbit-init-openspec-warning :: orbit init warns when an OpenSpec project directory sits beside it :: A later init beside an OpenSpec project still warns
  it('still warns when orbit/ already exists beside openspec/changes/, and proceeds', async () => {
    await mkdir('openspec', 'changes', 'add-auth');
    await mkdir('orbit', 'specs');
    await init();
    expect(warned()).toBeGreaterThanOrEqual(0);
    await proceeded();
  });

  // @scenario behaviour orbit-init-openspec-warning :: orbit init warns when an OpenSpec project directory sits beside it :: A pre-1.0 project warns before the legacy cleanup
  it('prints the warning before the legacy cleanup summary on a pre-1.0 project, and the cleanup still runs', async () => {
    await mkdir('openspec', 'specs');
    await write('openspec/AGENTS.md', '# OpenSpec Instructions\n');
    await init();
    const warning = warned();
    const legacy = logs.findIndex((l) => l.includes('AGENTS.md') && !l.includes(OPENSPEC_PROJECT_WARNING));
    expect(warning).toBeGreaterThanOrEqual(0);
    expect(legacy).toBeGreaterThan(warning);
    expect(await exists('openspec/AGENTS.md')).toBe(false);
    await proceeded();
  });

  // @scenario behaviour orbit-init-openspec-warning :: orbit init warns when an OpenSpec project directory sits beside it :: A directory that is not an OpenSpec project is silent
  it('is silent when openspec/ holds neither specs/ nor changes/ as a directory', async () => {
    await mkdir('openspec', 'notes');
    await write('openspec/specs', 'a file, not a directory\n');
    await init();
    expect(warned()).toBe(-1);
    await proceeded();
  });

  // @scenario behaviour orbit-init-openspec-warning :: orbit init warns when an OpenSpec project directory sits beside it :: A project with no openspec directory is silent
  it('is silent with no openspec/, and with an openspec regular file', async () => {
    await init();
    expect(warned()).toBe(-1);
    await proceeded();
    await write('openspec', 'a file\n');
    expect(detectOpenspecProject(dir)).toBe(false);
  });

  it('the detector reads the literal openspec directory, never orbit/', async () => {
    await mkdir('orbit', 'specs');
    await mkdir('orbit', 'changes');
    expect(detectOpenspecProject(dir)).toBe(false);
    await mkdir('openspec', 'changes');
    expect(detectOpenspecProject(dir)).toBe(true);
  });
});
