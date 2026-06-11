import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../../src/core/init.js';
import { saveGlobalConfig } from '../../../src/core/global-config.js';
import { ALL_WORKFLOWS } from '../../../src/core/profiles.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/prompts/searchable-multi-select.js', () => ({
  searchableMultiSelect: vi.fn(),
}));

/**
 * End-to-end fidelity for the generated surface (external-review follow-up):
 * runs a REAL `orbit init` (custom profile = all 11 workflows; claude + codex)
 * into a temp dir, then applies orbit's content assertions to the files ON
 * DISK — closing the gap between the template-level fidelity tests and the
 * generation pipeline. The original external-review CRITICAL (command files
 * lacking the orbit layer) was only visible at this level.
 */

// dirName -> [commandId, required skill markers]
const SURFACE: Array<[string, string, string[]]> = [
  ['orbit-explore', 'explore', ['execution disciplines', 'Run-summary emit']],
  ['orbit-propose', 'propose', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-new-change', 'new', ['execution disciplines', 'Run-summary emit']],
  ['orbit-continue-change', 'continue', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-apply-change', 'apply', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-ff-change', 'ff', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-sync-specs', 'sync', []], // upstream-verbatim: no orbit markers expected
  ['orbit-archive-change', 'archive', ['execution disciplines', 'run summary']],
  ['orbit-bulk-archive-change', 'bulk-archive', ['# Orbit additions']],
  ['orbit-verify-change', 'verify', ['execution disciplines', 'Run-summary emit']],
  ['orbit-onboard', 'onboard', ['execution disciplines', 'self-contained']],
];

describe('generated surface fidelity (real init, all workflows, claude + codex)', () => {
  let testDir: string;
  let configTempDir: string;
  let codexHomeDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-surface-test-'));
    configTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-surface-config-'));
    codexHomeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-surface-codex-'));
    process.env.XDG_CONFIG_HOME = configTempDir;
    process.env.CODEX_HOME = codexHomeDir;

    vi.spyOn(console, 'log').mockImplementation(() => {});

    saveGlobalConfig({ profile: 'custom', workflows: [...ALL_WORKFLOWS], delivery: 'both' });

    const initCommand = new InitCommand({ tools: 'claude,codex', force: true });
    await initCommand.execute(testDir);
  });

  afterAll(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    await fs.rm(codexHomeDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe.each(SURFACE)('%s', (dirName, commandId, requiredMarkers) => {
    it('claude skill on disk carries the orbit layer', async () => {
      const skill = await fs.readFile(
        path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      for (const marker of requiredMarkers) {
        expect(skill).toContain(marker);
      }
      if (requiredMarkers.length === 0) {
        // sync-specs stays upstream-verbatim
        expect(skill).not.toContain('Orbit additions');
      }
      expect(skill).not.toContain('/opsx:');
    });

    it('codex skill on disk matches the claude body (single source)', async () => {
      const claude = await fs.readFile(
        path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      const codex = await fs.readFile(
        path.join(testDir, '.codex', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      expect(codex).toBe(claude);
    });

    it('claude command on disk is a thin launcher to the skill', async () => {
      const command = await fs.readFile(
        path.join(testDir, '.claude', 'commands', 'orbit', `${commandId}.md`),
        'utf-8'
      );
      expect(command).toContain('thin launcher');
      expect(command).toContain(`\`${dirName}\` skill`);
      // frontmatter + launcher only — a command that regrows a workflow body fails
      expect(command.length).toBeLessThan(900);
    });

    it('codex prompt on disk is the same thin launcher', async () => {
      const prompt = await fs.readFile(
        path.join(codexHomeDir, 'prompts', `orbit-${commandId}.md`),
        'utf-8'
      );
      expect(prompt).toContain('thin launcher');
      expect(prompt).toContain(`\`${dirName}\` skill`);
    });
  });

  it('generates exactly the 11 registered skills, no extras (e.g., no feedback)', async () => {
    const dirs = await fs.readdir(path.join(testDir, '.claude', 'skills'));
    expect(dirs.sort()).toEqual(SURFACE.map(([d]) => d).sort());
  });

  it('generates exactly the 11 registered commands', async () => {
    const files = await fs.readdir(path.join(testDir, '.claude', 'commands', 'orbit'));
    expect(files.sort()).toEqual(SURFACE.map(([, id]) => `${id}.md`).sort());
  });
});
