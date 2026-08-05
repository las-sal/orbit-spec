import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  hasProjectConfigDrift,
  WORKFLOW_TO_SKILL_DIR,
} from '../../src/core/profile-sync-drift.js';
import { CORE_WORKFLOWS } from '../../src/core/profiles.js';
import { getSkillTemplates } from '../../src/core/shared/skill-generation.js';
import { CommandAdapterRegistry } from '../../src/core/command-generation/index.js';

function writeSkill(projectDir: string, workflowId: string): void {
  const skillDirName = WORKFLOW_TO_SKILL_DIR[workflowId as keyof typeof WORKFLOW_TO_SKILL_DIR];
  const skillPath = path.join(projectDir, '.claude', 'skills', skillDirName, 'SKILL.md');
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, `name: ${skillDirName}\n`);

  // A synced skill also carries its declared references (presence-only drift check)
  const entry = getSkillTemplates([workflowId]).find((e) => e.workflowId === workflowId);
  for (const ref of entry?.template.references ?? []) {
    const refPath = path.join(projectDir, '.claude', 'skills', skillDirName, 'references', ref.name);
    fs.mkdirSync(path.dirname(refPath), { recursive: true });
    fs.writeFileSync(refPath, ref.content);
  }
}

function writeCommand(projectDir: string, workflowId: string): void {
  const adapter = CommandAdapterRegistry.get('claude');
  if (!adapter) throw new Error('Claude adapter unavailable in test environment');
  const cmdPath = adapter.getFilePath(workflowId);
  const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectDir, cmdPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `# ${workflowId}\n`);
}

function setupCoreSkills(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeSkill(projectDir, workflow);
  }
}

function setupCoreCommands(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeCommand(projectDir, workflow);
  }
}

describe('profile sync drift detection', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `orbit-profile-sync-drift-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(path.join(tempDir, 'orbit'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects drift for skills-only delivery when commands still exist', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'skills');
    expect(hasDrift).toBe(true);
  });

  it('detects drift for commands-only delivery when skills still exist', () => {
    setupCoreCommands(tempDir);
    setupCoreSkills(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'commands');
    expect(hasDrift).toBe(true);
  });

  it('detects drift when required profile workflow files are missing', () => {
    writeSkill(tempDir, 'explore');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });

  it('detects reference drift: missing declared reference (current-stamps case)', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    fs.rmSync(
      path.join(tempDir, '.claude', 'skills', 'orbit-archive-change', 'references'),
      { recursive: true, force: true }
    );

    expect(hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both')).toBe(true);
  });

  it('detects reference drift: stray undeclared entry', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    fs.writeFileSync(
      path.join(tempDir, '.claude', 'skills', 'orbit-archive-change', 'references', 'stray.md'),
      'parked'
    );

    expect(hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both')).toBe(true);
  });

  it('detects reference drift: undesired references/ root on a reference-less skill', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    // orbit-propose declares no references (explore gained capture-formats.md in D5)
    fs.mkdirSync(
      path.join(tempDir, '.claude', 'skills', 'orbit-propose', 'references'),
      { recursive: true }
    );

    expect(hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both')).toBe(true);
  });

  it('returns false when project files match core profile and delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(false);
  });

  it('detects drift when extra workflows are installed for both delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    writeSkill(tempDir, 'sync');
    writeCommand(tempDir, 'sync');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });
});
