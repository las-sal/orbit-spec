import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS } from './config.js';
import { ALL_WORKFLOWS } from './profiles.js';
import { CommandAdapterRegistry } from './command-generation/index.js';
import { COMMAND_IDS, getConfiguredTools, getSkillTemplates, skillReferencesDrifted } from './shared/index.js';
/**
 * Maps workflow IDs to their skill directory names.
 */
export const WORKFLOW_TO_SKILL_DIR = {
    'explore': 'orbit-explore',
    'new': 'orbit-new-change',
    'continue': 'orbit-continue-change',
    'apply': 'orbit-apply-change',
    'ff': 'orbit-ff-change',
    'sync': 'orbit-sync-specs',
    'archive': 'orbit-archive-change',
    'bulk-archive': 'orbit-bulk-archive-change',
    'verify': 'orbit-verify-change',
    'onboard': 'orbit-onboard',
    'propose': 'orbit-propose',
    'review': 'orbit-review',
    'address-reviews': 'orbit-address-reviews',
    'audit-drift': 'orbit-audit-drift',
    'architect': 'orbit-architect',
};
/**
 * Artifacts RETIRED from the generated surface (D5: the standalone review-external
 * skill/launcher merged into review's `--reviewer` axis). Update reconciliation consults
 * these so PRE-EXISTING surfaces converge — retirement is a first-class transition, never
 * an unknown directory left behind. Grow these lists on any future retirement.
 */
export const RETIRED_SKILL_DIRS = ['orbit-review-external'];
export const RETIRED_COMMAND_IDS = ['review-external'];
function toKnownWorkflows(workflows) {
    return workflows.filter((workflow) => ALL_WORKFLOWS.includes(workflow));
}
/**
 * Checks whether a tool has at least one generated OpenSpec command file.
 */
export function toolHasAnyConfiguredCommand(projectPath, toolId) {
    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter)
        return false;
    for (const commandId of COMMAND_IDS) {
        const cmdPath = adapter.getFilePath(commandId);
        const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
        if (fs.existsSync(fullPath)) {
            return true;
        }
    }
    return false;
}
/**
 * Returns tools with at least one generated command file on disk.
 */
export function getCommandConfiguredTools(projectPath) {
    return AI_TOOLS
        .filter((tool) => {
        if (!tool.skillsDir)
            return false;
        const toolDir = path.join(projectPath, tool.skillsDir);
        try {
            return fs.statSync(toolDir).isDirectory();
        }
        catch {
            return false;
        }
    })
        .map((tool) => tool.value)
        .filter((toolId) => toolHasAnyConfiguredCommand(projectPath, toolId));
}
/**
 * Returns tools that are configured via either skills or commands.
 */
export function getConfiguredToolsForProfileSync(projectPath) {
    const skillConfigured = getConfiguredTools(projectPath);
    const commandConfigured = getCommandConfiguredTools(projectPath);
    return [...new Set([...skillConfigured, ...commandConfigured])];
}
/**
 * Detects if a single tool has profile/delivery drift against the desired state.
 *
 * This function covers:
 * - required artifacts missing for selected workflows
 * - artifacts that should not exist for the selected delivery mode
 * - artifacts for workflows that were deselected from the current profile
 */
export function hasToolProfileOrDeliveryDrift(projectPath, toolId, desiredWorkflows, delivery) {
    const tool = AI_TOOLS.find((t) => t.value === toolId);
    if (!tool?.skillsDir)
        return false;
    const knownDesiredWorkflows = toKnownWorkflows(desiredWorkflows);
    const desiredWorkflowSet = new Set(knownDesiredWorkflows);
    const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
    const adapter = CommandAdapterRegistry.get(toolId);
    const shouldGenerateSkills = delivery !== 'commands';
    const shouldGenerateCommands = delivery !== 'skills';
    if (shouldGenerateSkills) {
        const templatesByWorkflow = new Map(getSkillTemplates([...knownDesiredWorkflows]).map((entry) => [entry.workflowId, entry]));
        for (const workflow of knownDesiredWorkflows) {
            const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');
            if (!fs.existsSync(skillFile)) {
                return true;
            }
            // Reference drift (orbit-skill-generation): missing declared file, undeclared entry,
            // undesired root on a reference-less skill, or a root that is not a real directory —
            // all defeat the current-stamps short-circuit. Declared-content tamper is out of scope.
            const entry = templatesByWorkflow.get(workflow);
            if (skillReferencesDrifted(skillDir, entry?.template.references)) {
                return true;
            }
        }
        // A retired skill dir lingering on a pre-existing surface is drift (D5): it keeps a
        // contradicting workflow body loadable, so plain update must reconcile it away.
        for (const dirName of RETIRED_SKILL_DIRS) {
            if (fs.existsSync(path.join(skillsDir, dirName))) {
                return true;
            }
        }
        // Deselecting workflows in a profile should trigger sync.
        for (const workflow of ALL_WORKFLOWS) {
            if (desiredWorkflowSet.has(workflow))
                continue;
            const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
            const skillDir = path.join(skillsDir, dirName);
            if (fs.existsSync(skillDir)) {
                return true;
            }
        }
    }
    else {
        for (const workflow of ALL_WORKFLOWS) {
            const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
            const skillDir = path.join(skillsDir, dirName);
            if (fs.existsSync(skillDir)) {
                return true;
            }
        }
    }
    if (shouldGenerateCommands && adapter) {
        for (const workflow of knownDesiredWorkflows) {
            const cmdPath = adapter.getFilePath(workflow);
            const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
            if (!fs.existsSync(fullPath)) {
                return true;
            }
        }
        // Deselecting workflows in a profile should trigger sync.
        for (const workflow of ALL_WORKFLOWS) {
            if (desiredWorkflowSet.has(workflow))
                continue;
            const cmdPath = adapter.getFilePath(workflow);
            const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
            if (fs.existsSync(fullPath)) {
                return true;
            }
        }
        // A retired launcher lingering on a pre-existing surface is drift (D5).
        for (const commandId of RETIRED_COMMAND_IDS) {
            const cmdPath = adapter.getFilePath(commandId);
            const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
            if (fs.existsSync(fullPath)) {
                return true;
            }
        }
    }
    else if (!shouldGenerateCommands && adapter) {
        for (const workflow of ALL_WORKFLOWS) {
            const cmdPath = adapter.getFilePath(workflow);
            const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
            if (fs.existsSync(fullPath)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Returns configured tools that currently need a profile/delivery sync.
 */
export function getToolsNeedingProfileSync(projectPath, desiredWorkflows, delivery, configuredTools) {
    const tools = configuredTools ? [...new Set(configuredTools)] : getConfiguredToolsForProfileSync(projectPath);
    return tools.filter((toolId) => hasToolProfileOrDeliveryDrift(projectPath, toolId, desiredWorkflows, delivery));
}
function getInstalledWorkflowsForTool(projectPath, toolId, options) {
    const tool = AI_TOOLS.find((t) => t.value === toolId);
    if (!tool?.skillsDir)
        return [];
    const installed = new Set();
    const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
    if (options.includeSkills) {
        for (const workflow of ALL_WORKFLOWS) {
            const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
            const skillFile = path.join(skillsDir, dirName, 'SKILL.md');
            if (fs.existsSync(skillFile)) {
                installed.add(workflow);
            }
        }
    }
    if (options.includeCommands) {
        const adapter = CommandAdapterRegistry.get(toolId);
        if (adapter) {
            for (const workflow of ALL_WORKFLOWS) {
                const cmdPath = adapter.getFilePath(workflow);
                const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
                if (fs.existsSync(fullPath)) {
                    installed.add(workflow);
                }
            }
        }
    }
    return [...installed];
}
/**
 * Detects whether the current project has any profile/delivery drift.
 */
export function hasProjectConfigDrift(projectPath, desiredWorkflows, delivery) {
    const configuredTools = getConfiguredToolsForProfileSync(projectPath);
    if (getToolsNeedingProfileSync(projectPath, desiredWorkflows, delivery, configuredTools).length > 0) {
        return true;
    }
    const desiredSet = new Set(toKnownWorkflows(desiredWorkflows));
    const includeSkills = delivery !== 'commands';
    const includeCommands = delivery !== 'skills';
    for (const toolId of configuredTools) {
        const installed = getInstalledWorkflowsForTool(projectPath, toolId, { includeSkills, includeCommands });
        if (installed.some((workflow) => !desiredSet.has(workflow))) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=profile-sync-drift.js.map