import type { Delivery } from './global-config.js';
import { ALL_WORKFLOWS } from './profiles.js';
type WorkflowId = (typeof ALL_WORKFLOWS)[number];
/**
 * Maps workflow IDs to their skill directory names.
 */
export declare const WORKFLOW_TO_SKILL_DIR: Record<WorkflowId, string>;
/**
 * Artifacts RETIRED from the generated surface (D5: the standalone review-external
 * skill/launcher merged into review's `--reviewer` axis). Update reconciliation consults
 * these so PRE-EXISTING surfaces converge — retirement is a first-class transition, never
 * an unknown directory left behind. Grow these lists on any future retirement.
 */
export declare const RETIRED_SKILL_DIRS: readonly string[];
export declare const RETIRED_COMMAND_IDS: readonly string[];
/**
 * Checks whether a tool has at least one generated OpenSpec command file.
 */
export declare function toolHasAnyConfiguredCommand(projectPath: string, toolId: string): boolean;
/**
 * Returns tools with at least one generated command file on disk.
 */
export declare function getCommandConfiguredTools(projectPath: string): string[];
/**
 * Returns tools that are configured via either skills or commands.
 */
export declare function getConfiguredToolsForProfileSync(projectPath: string): string[];
/**
 * Detects if a single tool has profile/delivery drift against the desired state.
 *
 * This function covers:
 * - required artifacts missing for selected workflows
 * - artifacts that should not exist for the selected delivery mode
 * - artifacts for workflows that were deselected from the current profile
 */
export declare function hasToolProfileOrDeliveryDrift(projectPath: string, toolId: string, desiredWorkflows: readonly string[], delivery: Delivery): boolean;
/**
 * Returns configured tools that currently need a profile/delivery sync.
 */
export declare function getToolsNeedingProfileSync(projectPath: string, desiredWorkflows: readonly string[], delivery: Delivery, configuredTools?: readonly string[]): string[];
/**
 * Detects whether the current project has any profile/delivery drift.
 */
export declare function hasProjectConfigDrift(projectPath: string, desiredWorkflows: readonly string[], delivery: Delivery): boolean;
export {};
//# sourceMappingURL=profile-sync-drift.d.ts.map