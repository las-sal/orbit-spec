/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOrbitProposeSkillTemplate,
  getOrbitExploreCommandTemplate,
  getOrbitNewCommandTemplate,
  getOrbitContinueCommandTemplate,
  getOrbitApplyCommandTemplate,
  getOrbitFfCommandTemplate,
  getOrbitSyncCommandTemplate,
  getOrbitArchiveCommandTemplate,
  getOrbitBulkArchiveCommandTemplate,
  getOrbitVerifyCommandTemplate,
  getOrbitOnboardCommandTemplate,
  getOrbitProposeCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
import type { SkillReference } from '../templates/types.js';
import path from 'path';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';

/**
 * Skill template with directory name and workflow ID mapping.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
}

/**
 * Command template with ID mapping.
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getOrbitExploreCommandTemplate>;
  id: string;
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose workflowId is in this array
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const all: SkillTemplateEntry[] = [
    { template: getExploreSkillTemplate(), dirName: 'orbit-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(), dirName: 'orbit-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(), dirName: 'orbit-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(), dirName: 'orbit-apply-change', workflowId: 'apply' },
    { template: getFfChangeSkillTemplate(), dirName: 'orbit-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(), dirName: 'orbit-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(), dirName: 'orbit-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(), dirName: 'orbit-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifyChangeSkillTemplate(), dirName: 'orbit-verify-change', workflowId: 'verify' },
    { template: getOnboardSkillTemplate(), dirName: 'orbit-onboard', workflowId: 'onboard' },
    { template: getOrbitProposeSkillTemplate(), dirName: 'orbit-propose', workflowId: 'propose' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.workflowId));
}

/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  const all: CommandTemplateEntry[] = [
    { template: getOrbitExploreCommandTemplate(), id: 'explore' },
    { template: getOrbitNewCommandTemplate(), id: 'new' },
    { template: getOrbitContinueCommandTemplate(), id: 'continue' },
    { template: getOrbitApplyCommandTemplate(), id: 'apply' },
    { template: getOrbitFfCommandTemplate(), id: 'ff' },
    { template: getOrbitSyncCommandTemplate(), id: 'sync' },
    { template: getOrbitArchiveCommandTemplate(), id: 'archive' },
    { template: getOrbitBulkArchiveCommandTemplate(), id: 'bulk-archive' },
    { template: getOrbitVerifyCommandTemplate(), id: 'verify' },
    { template: getOrbitOnboardCommandTemplate(), id: 'onboard' },
    { template: getOrbitProposeCommandTemplate(), id: 'propose' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.id));
}

/**
 * Converts command templates to CommandContent array, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return contents whose id is in this array
 */
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The OpenSpec version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  // Metadata pass-through (orbit-skill-generation): emit every template-declared key in
  // declared order; generatedBy is generator-owned — a template-declared generatedBy is
  // dropped from its position and the generator's value appears exactly once, appended last.
  const metadataEntries = Object.entries(template.metadata ?? {}).filter(
    ([key]) => key !== 'generatedBy'
  );
  const metadataBlock = [
    ...metadataEntries.map(([key, value]) => `  ${key}: ${yamlScalar(value)}`),
    // generatedBy is always quoted (stable provenance formatting, YAML-safe for any version string)
    `  generatedBy: ${JSON.stringify(generatedByVersion)}`,
  ].join('\n');

  return `---
name: ${template.name}
description: ${template.description}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'Requires orbit CLI.'}
metadata:
${metadataBlock}
---

${instructions}
`;
}

/**
 * Emits a metadata value YAML-safe: bare only when unambiguously a plain string,
 * otherwise JSON-quoted so the parsed value is string-equal to the declared value.
 */
function yamlScalar(value: string): string {
  const PLAIN = /^[A-Za-z][A-Za-z0-9 _.\/-]*$/;
  const RESERVED = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off']);
  if (PLAIN.test(value) && !RESERVED.has(value.toLowerCase()) && value.trim() === value) {
    return value;
  }
  return JSON.stringify(value);
}

const METADATA_KEY_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 * Preflight validation (orbit-skill-generation): runs over EVERY template before any file
 * write in a generation operation. Invalid reference names (path-escaping, duplicate) and
 * invalid metadata keys (integer-like, YAML-significant) fail the operation with an error
 * naming the offending template — no file is written or modified.
 */
export function validateSkillTemplates(entries: SkillTemplateEntry[]): void {
  for (const { template, dirName } of entries) {
    for (const key of Object.keys(template.metadata ?? {})) {
      if (!METADATA_KEY_RE.test(key)) {
        throw new Error(
          `Invalid metadata key "${key}" in skill template "${dirName}": keys must match ${METADATA_KEY_RE}`
        );
      }
    }
    const seen = new Set<string>();
    for (const ref of template.references ?? []) {
      const name = ref.name;
      const invalid =
        !name ||
        name === '.' ||
        name === '..' ||
        name.includes('/') ||
        name.includes('\\') ||
        path.isAbsolute(name);
      if (invalid) {
        throw new Error(
          `Invalid reference name "${name}" in skill template "${dirName}": must be a bare filename`
        );
      }
      if (seen.has(name)) {
        throw new Error(
          `Duplicate reference name "${name}" in skill template "${dirName}"`
        );
      }
      seen.add(name);
    }
  }
}

export interface ReferenceReconcileResult {
  written: number;
  /** Relative names of undeclared entries removed from references/ */
  removed: string[];
}

/**
 * Reconciles <skillDir>/references/ to the declared set (orbit-skill-generation):
 * - declared set empty: remove the references/ dir entirely (no empty-dir litter)
 * - root that is not a real directory (symlink/file) is replaced with a real directory
 * - WRITE phase: every declared reference written; an existing symlink/dir at a DECLARED
 *   name is replaced, never followed (declared-path replacement is part of writing)
 * - PRUNE phase (only after all writes succeed): undeclared entries (files, dirs,
 *   symlinks-as-links) removed; containment is physical — nothing outside references/
 */
export async function reconcileSkillReferences(
  skillDir: string,
  references: SkillReference[] | undefined
): Promise<ReferenceReconcileResult> {
  const refsDir = path.join(skillDir, 'references');
  const declared = references ?? [];
  const result: ReferenceReconcileResult = { written: 0, removed: [] };

  const rootStat = await fs.lstat(refsDir).catch(() => null);

  if (declared.length === 0) {
    if (rootStat) {
      if (rootStat.isDirectory()) {
        const entries = await fs.readdir(refsDir);
        result.removed.push(...entries);
        await fs.rm(refsDir, { recursive: true, force: true });
      } else {
        // file or symlink at the references path — remove the entry itself
        result.removed.push('references');
        await fs.rm(refsDir, { force: true });
      }
    }
    return result;
  }

  if (rootStat && !rootStat.isDirectory()) {
    // symlinked or non-directory root: replace with a real directory (never follow)
    await fs.rm(refsDir, { force: true });
  }
  await fs.mkdir(refsDir, { recursive: true });

  // WRITE phase — all declared writes complete before any pruning
  for (const ref of declared) {
    const target = path.join(refsDir, ref.name);
    const existing = await fs.lstat(target).catch(() => null);
    if (existing && !existing.isFile()) {
      // declared-path collision (symlink or directory): replace, never follow
      await fs.rm(target, { recursive: true, force: true });
    }
    await fs.writeFile(target, ref.content, 'utf-8');
    result.written += 1;
  }

  // PRUNE phase — undeclared entries only
  const declaredNames = new Set(declared.map((r) => r.name));
  const entries = await fs.readdir(refsDir);
  for (const entry of entries) {
    if (declaredNames.has(entry)) continue;
    await fs.rm(path.join(refsDir, entry), { recursive: true, force: true });
    result.removed.push(entry);
  }

  return result;
}

/**
 * Synchronous drift check for smart update detection (orbit-skill-generation):
 * declared-set and root-shape drift — missing declared file, undeclared entry, a
 * references/ root that shouldn't exist (reference-less skill), or a root that is not a
 * real directory. Content of same-name declared references is deliberately out of scope.
 */
export function skillReferencesDrifted(
  skillDir: string,
  references: SkillReference[] | undefined
): boolean {
  const refsDir = path.join(skillDir, 'references');
  const declared = references ?? [];
  let rootStat: fsSync.Stats | null = null;
  try {
    rootStat = fsSync.lstatSync(refsDir);
  } catch {
    rootStat = null;
  }

  if (declared.length === 0) {
    return rootStat !== null; // undesired root presence
  }
  if (!rootStat || !rootStat.isDirectory()) {
    return true; // missing root, or root not a real directory (e.g., symlink)
  }
  const declaredNames = new Set(declared.map((r) => r.name));
  for (const name of declaredNames) {
    let entryStat: fsSync.Stats | null = null;
    try {
      entryStat = fsSync.lstatSync(path.join(refsDir, name));
    } catch {
      entryStat = null;
    }
    if (!entryStat || !entryStat.isFile()) return true; // missing or non-regular declared entry
  }
  for (const entry of fsSync.readdirSync(refsDir)) {
    if (!declaredNames.has(entry)) return true; // undeclared entry
  }
  return false;
}
