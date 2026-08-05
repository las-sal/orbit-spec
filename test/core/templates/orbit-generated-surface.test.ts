import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../../src/core/init.js';
import { UpdateCommand } from '../../../src/core/update.js';

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
 * runs a REAL default `orbit init` (claude + codex; no profile config — D15:
 * all workflows install every time)
 * into a temp dir, then applies orbit's content assertions to the files ON
 * DISK — closing the gap between the template-level fidelity tests and the
 * generation pipeline. The original external-review CRITICAL (command files
 * lacking the orbit layer) was only visible at this level.
 */

// dirName -> [commandId, required skill markers]
const SURFACE: Array<[string, string, string[]]> = [
  ['orbit-explore', 'explore', ['execution disciplines', 'Run-summary emit', 'Minimal explore metadata']],
  ['orbit-propose', 'propose', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override', 'staged-metadata MERGE', 'fresh-owned DENYLIST']],
  ['orbit-new-change', 'new', ['execution disciplines', 'Run-summary emit']],
  ['orbit-continue-change', 'continue', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-apply-change', 'apply', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-ff-change', 'ff', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-sync-specs', 'sync', ['execution disciplines', 'Consent inheritance']], // gained the orbit layer in D1
  ['orbit-archive-change', 'archive', ['execution disciplines', 'run summary', 'Stage-line garnish']],
  ['orbit-bulk-archive-change', 'bulk-archive', ['# Orbit additions']],
  ['orbit-verify-change', 'verify', ['execution disciplines', 'Run-summary emit']],
  ['orbit-onboard', 'onboard', ['execution disciplines', 'self-contained', 'Program architecture', 'orbit/architecture/.orbit-runs/', 'architecture mode — D-arc Stage D2']],
  ['orbit-review', 'review', ['execution disciplines', 'Paste the output VERBATIM', 'hand-rendering them is PROHIBITED', 'REVIEWER-CLASS axis', 'references/external-handoff.md', 'references/passes-<mode>.md', 'orbit emit review', 'Using doc:', 'First architecture review for this doc']],
  ['orbit-address-reviews', 'address-reviews', ['execution disciplines', 'Ripple cascade', 'resolution log', 'Architecture-scoped']],
  ['orbit-audit-drift', 'audit-drift', ['execution disciplines', 'Vocabulary residue', 'Persist the run summary', 'Architecture staleness check']],
  ['orbit-architect', 'architect', ['execution disciplines', 'Run-summary emit', 'Completion-ratification flow', 'a gatekeeper']],
];

// B3 editorial skills bundle reference files (multi-file skills)
const REFERENCE_SKILLS: Record<string, string[]> = {
  'orbit-explore': ['capture-formats.md'],
  'orbit-review': ['run-summary-schema.md', 'passes-proposal.md', 'passes-system.md', 'passes-architecture.md', 'external-handoff.md', 'mode-sections.md', 'prompt-template.md', 'flags-detail.md'],
  'orbit-address-reviews': ['external-findings-format.md', 'internal-findings-format.md', 'resolution-detail.md', 'run-summary-schema.md'],
  'orbit-audit-drift': ['run-summary-schema.md', 'worked-example.md'],
};

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

    // No profile/delivery configuration on purpose: a DEFAULT init must
    // produce the full surface (D15 — all workflows installed every time).
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
      expect(skill).not.toContain('/opsx:');
      // D1: no body renders an imperative Next: label; every body echoes no-chaining.
      expect(skill).not.toContain('Next:');
      expect(skill).toContain('No-chaining');
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

  it('archive ships its reference on disk for both tools, byte-identical', async () => {
    const claudeRef = await fs.readFile(
      path.join(testDir, '.claude', 'skills', 'orbit-archive-change', 'references', 'archive-summary-schema.md'),
      'utf-8'
    );
    const codexRef = await fs.readFile(
      path.join(testDir, '.codex', 'skills', 'orbit-archive-change', 'references', 'archive-summary-schema.md'),
      'utf-8'
    );
    expect(codexRef).toBe(claudeRef);
    expect(claudeRef).toContain('archive run-summary schema');
    expect(claudeRef).toContain('"unresolved_markers": ["<file>:<line>');
  });

  it('reference-less skills have no references/ dir on disk', async () => {
    for (const [dirName] of SURFACE) {
      if (dirName === 'orbit-archive-change' || dirName in REFERENCE_SKILLS) continue;
      const refsDir = path.join(testDir, '.claude', 'skills', dirName, 'references');
      await expect(fs.access(refsDir)).rejects.toThrow();
    }
  });

  it('generates exactly the 16 registered skills, no extras (e.g., no feedback)', async () => {
    const dirs = await fs.readdir(path.join(testDir, '.claude', 'skills'));
    expect(dirs.sort()).toEqual(SURFACE.map(([d]) => d).sort());
  });

  it('editorial skills ship their references on disk for both tools, byte-identical', async () => {
    for (const [dirName, refNames] of Object.entries(REFERENCE_SKILLS)) {
      const refsDir = path.join(testDir, '.claude', 'skills', dirName, 'references');
      const onDisk = (await fs.readdir(refsDir)).sort();
      expect(onDisk).toEqual([...refNames].sort());
      for (const refName of refNames) {
        const claudeRef = await fs.readFile(path.join(refsDir, refName), 'utf-8');
        const codexRef = await fs.readFile(
          path.join(testDir, '.codex', 'skills', dirName, 'references', refName),
          'utf-8'
        );
        expect(codexRef).toBe(claudeRef);
        expect(claudeRef).not.toContain('/opsx:');
      }
    }
  });

  it('editorial skills carry their capability metadata in frontmatter (B2 pass-through)', async () => {
    // orbit-explore joined REFERENCE_SKILLS in D5 but is not a B3 editorial skill
    // (its capability spec is orbit-explore-modifications; no metadata pass-through).
    for (const dirName of Object.keys(REFERENCE_SKILLS).filter((d) => d !== 'orbit-explore')) {
      const skill = await fs.readFile(
        path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      expect(skill).toContain(`capability: ${dirName}`);
    }
  });

  it('PLAIN update on a current-stamps project reconciles reference drift (no --force)', async () => {
    // the surface was just generated at the current version — stamps are current
    const refPath = path.join(
      testDir, '.claude', 'skills', 'orbit-archive-change', 'references', 'archive-summary-schema.md'
    );
    const strayPath = path.join(
      testDir, '.claude', 'skills', 'orbit-archive-change', 'references', 'stray.md'
    );
    await fs.rm(refPath);
    await fs.writeFile(strayPath, 'parked');

    await new UpdateCommand({}).execute(testDir);

    // drift detection defeated the current-stamps short-circuit: declared restored, stray pruned
    const restored = await fs.readFile(refPath, 'utf-8');
    expect(restored).toContain('archive run-summary schema');
    await expect(fs.access(strayPath)).rejects.toThrow();
  });

  it('generates exactly the 16 registered commands', async () => {
    const files = await fs.readdir(path.join(testDir, '.claude', 'commands', 'orbit'));
    expect(files.sort()).toEqual(SURFACE.map(([, id]) => `${id}.md`).sort());
  });

  it('address-reviews generated references carry the architecture-mode shapes', async () => {
    const refsDir = path.join(testDir, '.claude', 'skills', 'orbit-address-reviews', 'references');
    const ingest = await fs.readFile(path.join(refsDir, 'internal-findings-format.md'), 'utf-8');
    expect(ingest).toContain('review-architecture-<TS>.json');
    expect(ingest).toContain('"proposal" | "system" | "architecture"');
    const log = await fs.readFile(path.join(refsDir, 'run-summary-schema.md'), 'utf-8');
    expect(log).toContain('review-architecture');
    expect(log).toContain('architecture scope');
  });

  it('review LAUNCHER surfaces advertise all three modes (not just the long body)', async () => {
    // Guards the discoverable layer: a future mode addition must update the
    // command mirror and the skill description, not only SKILL.md's body.
    const cmd = await fs.readFile(path.join(testDir, '.claude', 'commands', 'orbit', 'review.md'), 'utf-8');
    expect(cmd).toContain('--as proposal|system|architecture');
    const skill = await fs.readFile(path.join(testDir, '.claude', 'skills', 'orbit-review', 'SKILL.md'), 'utf-8');
    expect(skill).toContain('architecture mode (a doc under orbit/architecture/');
  });
});
