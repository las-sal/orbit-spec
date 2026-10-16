/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */
import { getOrbitExploreCommandTemplate, type SkillTemplate } from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
import type { SkillReference } from '../templates/types.js';
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
export declare function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[];
/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export declare function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[];
/**
 * Converts command templates to CommandContent array, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return contents whose id is in this array
 */
export declare function getCommandContents(workflowFilter?: readonly string[]): CommandContent[];
/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The OpenSpec version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export declare function generateSkillContent(template: SkillTemplate, generatedByVersion: string, transformInstructions?: (instructions: string) => string): string;
/**
 * Preflight validation (orbit-skill-generation): runs over EVERY template before any file
 * write in a generation operation. Invalid reference names (path-escaping, duplicate) and
 * invalid metadata keys (integer-like, YAML-significant) fail the operation with an error
 * naming the offending template — no file is written or modified.
 */
export declare function validateSkillTemplates(entries: SkillTemplateEntry[]): void;
/**
 * Ensures a skill directory is a REAL directory before any generation write
 * (orbit-skill-generation physical containment): a symlink (or stray file) at the
 * skill-dir path is removed and replaced with a real directory, so neither the
 * SKILL.md write nor reference reconciliation can follow a link outside the tree.
 */
export declare function ensureRealSkillDir(skillDir: string): Promise<void>;
export interface ReferenceReconcileResult {
    written: number;
    /** Relative names of undeclared entries removed from references/ */
    removed: string[];
    /** True when the references/ root itself was removed or replaced (empty declared set, or non-directory root) */
    rootRemoved: boolean;
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
export declare function reconcileSkillReferences(skillDir: string, references: SkillReference[] | undefined): Promise<ReferenceReconcileResult>;
/**
 * Synchronous drift check for smart update detection (orbit-skill-generation):
 * declared-set and root-shape drift — missing declared file, undeclared entry, a
 * references/ root that shouldn't exist (reference-less skill), or a root that is not a
 * real directory. Content of same-name declared references is deliberately out of scope.
 */
export declare function skillReferencesDrifted(skillDir: string, references: SkillReference[] | undefined): boolean;
//# sourceMappingURL=skill-generation.d.ts.map