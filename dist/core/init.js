/**
 * Init Command
 *
 * Sets up OpenSpec with Agent Skills and /orbit:* slash commands.
 * This is the unified setup command that replaces both the old init and experimental commands.
 */
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { transformToHyphenCommands } from '../utils/command-references.js';
import { AI_TOOLS, OPENSPEC_DIR_NAME, } from './config.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
import { generateCommands, CommandAdapterRegistry, } from './command-generation/index.js';
import { detectLegacyArtifacts, cleanupLegacyArtifacts, formatCleanupSummary, formatDetectionSummary, } from './legacy-cleanup.js';
import { getToolsWithSkillsDir, getToolStates, getSkillTemplates, getCommandContents, generateSkillContent, } from './shared/index.js';
import { getGlobalConfig, saveGlobalConfig } from './global-config.js';
import { checkRunnerShape, isOnPath, EXTERNAL_RUNNER_FIELD } from './external-runner.js';
import { getProfileWorkflows, ALL_WORKFLOWS } from './profiles.js';
import { WORKFLOW_TO_SKILL_DIR } from './profile-sync-drift.js';
import { validateSkillTemplates, reconcileSkillReferences, ensureRealSkillDir } from './shared/skill-generation.js';
import { getAvailableTools } from './available-tools.js';
import { migrateIfNeeded } from './migration.js';
const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');
// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const DEFAULT_SCHEMA = 'spec-driven';
const PROGRESS_SPINNER = {
    interval: 80,
    frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};
// -----------------------------------------------------------------------------
// Init Command Class
// -----------------------------------------------------------------------------
/** Where the migration guide lives on the orbit repository. */
export const MIGRATION_GUIDE_URL = 'https://github.com/las-sal/orbit-spec/blob/main/docs/migration-guide.md';
/**
 * Whether the project holds an OpenSpec project directory (orbit-init-openspec-warning): a directory named by the
 * literal 'openspec' (OPENSPEC_DIR_NAME is 'orbit' in this fork) holding a `specs/` or `changes/` directory. A regular
 * file of any of those names is absent.
 */
export function detectOpenspecProject(projectPath) {
    const isDir = (p) => {
        try {
            return fs.statSync(p).isDirectory();
        }
        catch {
            return false;
        }
    };
    const upstream = path.join(projectPath, 'openspec');
    return isDir(upstream) && (isDir(path.join(upstream, 'specs')) || isDir(path.join(upstream, 'changes')));
}
/** The warning's text: orbit/ is separate, the move steps by the state of orbit/, and the guide. */
export const OPENSPEC_PROJECT_WARNING = [
    'Warning: this project has an OpenSpec project directory, openspec/.',
    'orbit keeps its project in orbit/, separate from openspec/, and reads nothing in openspec/specs/ or',
    'openspec/changes/. To move the project to orbit, first delete the openspec-* skills and opsx commands, then:',
    '  - no orbit/ yet: git mv openspec orbit, then orbit init',
    '  - orbit/ created by orbit init and holding no file but orbit/config.yaml: delete orbit/ (keep a copy',
    '    of orbit/config.yaml if you edited it), then git mv openspec orbit, then orbit init',
    '  - orbit/ holding any other file (specs, changes, an architecture doc, an exploration): merge by hand;',
    '    a git mv into an existing orbit/ nests the project at orbit/openspec/, where orbit reads nothing',
    `Run the migration guide's before-you-move checklist first: ${MIGRATION_GUIDE_URL}`,
    'Continuing with init.',
].join('\n');
export class InitCommand {
    toolsArg;
    force;
    interactiveOption;
    profileOverride;
    constructor(options = {}) {
        this.toolsArg = options.tools;
        this.force = options.force ?? false;
        this.interactiveOption = options.interactive;
        this.profileOverride = options.profile;
    }
    async execute(targetPath) {
        const projectPath = path.resolve(targetPath);
        const openspecDir = OPENSPEC_DIR_NAME;
        const openspecPath = path.join(projectPath, openspecDir);
        // Preflight validation (orbit-skill-generation): the VERY FIRST step — before the
        // permission probe, legacy cleanup, migration, or any other mutating operation.
        // D15 makes profile resolution inert, so the full template set is the operation's
        // template set; validation is pure and throws before anything touches disk.
        validateSkillTemplates(getSkillTemplates());
        // Validation happens silently in the background
        const extendMode = await this.validate(projectPath, openspecPath);
        // orbit-init-openspec-warning: report an OpenSpec project beside this one, then proceed. Printed before the
        // legacy cleanup (whose declined prompt exits) and before orbit/ is created.
        if (detectOpenspecProject(projectPath)) {
            console.log();
            console.log(chalk.yellow(OPENSPEC_PROJECT_WARNING));
            console.log();
        }
        // Check for legacy artifacts and handle cleanup
        await this.handleLegacyCleanup(projectPath, extendMode);
        // Detect available tools in the project (task 7.1)
        const detectedTools = getAvailableTools(projectPath);
        // Migration check: migrate existing projects to profile system (task 7.3)
        if (extendMode) {
            migrateIfNeeded(projectPath, detectedTools);
        }
        // Show animated welcome screen (interactive mode only)
        const canPrompt = this.canPromptInteractively();
        if (canPrompt) {
            const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
            await showWelcomeScreen();
        }
        // Validate profile override early so invalid values fail before tool setup.
        // The resolved value is consumed later when generation reads effective config.
        this.resolveProfileOverride();
        // Get tool states before processing
        const toolStates = getToolStates(projectPath);
        // Get tool selection (pass detected tools for pre-selection)
        const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);
        // Validate selected tools
        const validatedTools = this.validateTools(selectedToolIds, toolStates);
        // Create directory structure and config
        await this.createDirectoryStructure(openspecPath, extendMode);
        // Generate skills and commands for each tool
        const results = await this.generateSkillsAndCommands(projectPath, validatedTools);
        // Create config.yaml if needed
        const configStatus = await this.createConfig(openspecPath, extendMode);
        // rc17d: the external-runner setup step — interactive only; non-interactive init leaves the record alone.
        if (canPrompt) {
            const { select, input } = await import('@inquirer/prompts');
            await runExternalRunnerSetup({ select, input });
        }
        // Display success message
        this.displaySuccessMessage(projectPath, validatedTools, results, configStatus);
    }
    // ═══════════════════════════════════════════════════════════
    // VALIDATION & SETUP
    // ═══════════════════════════════════════════════════════════
    async validate(projectPath, openspecPath) {
        const extendMode = await FileSystemUtils.directoryExists(openspecPath);
        // Check write permissions
        if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
            throw new Error(`Insufficient permissions to write to ${projectPath}`);
        }
        return extendMode;
    }
    canPromptInteractively() {
        if (this.interactiveOption === false)
            return false;
        if (this.toolsArg !== undefined)
            return false;
        return isInteractive({ interactive: this.interactiveOption });
    }
    resolveProfileOverride() {
        if (this.profileOverride === undefined) {
            return undefined;
        }
        if (this.profileOverride === 'core' || this.profileOverride === 'custom') {
            return this.profileOverride;
        }
        throw new Error(`Invalid profile "${this.profileOverride}". Available profiles: core, custom`);
    }
    // ═══════════════════════════════════════════════════════════
    // LEGACY CLEANUP
    // ═══════════════════════════════════════════════════════════
    async handleLegacyCleanup(projectPath, extendMode) {
        // Detect legacy artifacts
        const detection = await detectLegacyArtifacts(projectPath);
        if (!detection.hasLegacyArtifacts) {
            return; // No legacy artifacts found
        }
        // Show what was detected
        console.log();
        console.log(formatDetectionSummary(detection));
        console.log();
        const canPrompt = this.canPromptInteractively();
        if (this.force || !canPrompt) {
            // --force flag or non-interactive mode: proceed with cleanup automatically.
            // Legacy slash commands are 100% OpenSpec-managed, and config file cleanup
            // only removes markers (never deletes files), so auto-cleanup is safe.
            await this.performLegacyCleanup(projectPath, detection);
            return;
        }
        // Interactive mode: prompt for confirmation
        const { confirm } = await import('@inquirer/prompts');
        const shouldCleanup = await confirm({
            message: 'Upgrade and clean up legacy files?',
            default: true,
        });
        if (!shouldCleanup) {
            console.log(chalk.dim('Initialization cancelled.'));
            console.log(chalk.dim('Run with --force to skip this prompt, or manually remove legacy files.'));
            process.exit(0);
        }
        await this.performLegacyCleanup(projectPath, detection);
    }
    async performLegacyCleanup(projectPath, detection) {
        const spinner = ora('Cleaning up legacy files...').start();
        const result = await cleanupLegacyArtifacts(projectPath, detection);
        spinner.succeed('Legacy files cleaned up');
        const summary = formatCleanupSummary(result);
        if (summary) {
            console.log();
            console.log(summary);
        }
        console.log();
    }
    // ═══════════════════════════════════════════════════════════
    // TOOL SELECTION
    // ═══════════════════════════════════════════════════════════
    async getSelectedTools(toolStates, extendMode, detectedTools, projectPath) {
        // Check for --tools flag first
        const nonInteractiveSelection = this.resolveToolsArg();
        if (nonInteractiveSelection !== null) {
            return nonInteractiveSelection;
        }
        const validTools = getToolsWithSkillsDir();
        const detectedToolIds = new Set(detectedTools.map((t) => t.value));
        const configuredToolIds = new Set([...toolStates.entries()]
            .filter(([, status]) => status.configured)
            .map(([toolId]) => toolId));
        const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;
        const canPrompt = this.canPromptInteractively();
        // Non-interactive mode: use detected tools as fallback (task 7.8)
        if (!canPrompt) {
            if (detectedToolIds.size > 0) {
                return [...detectedToolIds];
            }
            throw new Error(`No tools detected and no --tools flag provided. Valid tools:\n  ${validTools.join('\n  ')}\n\nUse --tools all, --tools none, or --tools claude,cursor,...`);
        }
        if (validTools.length === 0) {
            throw new Error(`No tools available for skill generation.`);
        }
        // Interactive mode: show searchable multi-select
        const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');
        // Build choices: pre-select configured tools; keep detected tools visible but unselected.
        const sortedChoices = validTools
            .map((toolId) => {
            const tool = AI_TOOLS.find((t) => t.value === toolId);
            const status = toolStates.get(toolId);
            const configured = status?.configured ?? false;
            const detected = detectedToolIds.has(toolId);
            return {
                name: tool?.name || toolId,
                value: toolId,
                configured,
                detected: detected && !configured,
                preSelected: configured || (shouldPreselectDetected && detected && !configured),
            };
        })
            .sort((a, b) => {
            // Configured tools first, then detected (not configured), then everything else.
            if (a.configured && !b.configured)
                return -1;
            if (!a.configured && b.configured)
                return 1;
            if (a.detected && !b.detected)
                return -1;
            if (!a.detected && b.detected)
                return 1;
            return 0;
        });
        const configuredNames = validTools
            .filter((toolId) => configuredToolIds.has(toolId))
            .map((toolId) => AI_TOOLS.find((t) => t.value === toolId)?.name || toolId);
        if (configuredNames.length > 0) {
            console.log(`orbit configured: ${configuredNames.join(', ')} (pre-selected)`);
        }
        const detectedOnlyNames = detectedTools
            .filter((tool) => !configuredToolIds.has(tool.value))
            .map((tool) => tool.name);
        if (detectedOnlyNames.length > 0) {
            const detectionLabel = shouldPreselectDetected
                ? 'pre-selected for first-time setup'
                : 'not pre-selected';
            console.log(`Detected tool directories: ${detectedOnlyNames.join(', ')} (${detectionLabel})`);
        }
        const selectedTools = await searchableMultiSelect({
            message: `Select tools to set up (${validTools.length} available)`,
            pageSize: 15,
            choices: sortedChoices,
            validate: (selected) => selected.length > 0 || 'Select at least one tool',
        });
        if (selectedTools.length === 0) {
            throw new Error('At least one tool must be selected');
        }
        return selectedTools;
    }
    resolveToolsArg() {
        if (typeof this.toolsArg === 'undefined') {
            return null;
        }
        const raw = this.toolsArg.trim();
        if (raw.length === 0) {
            throw new Error('The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.');
        }
        const availableTools = getToolsWithSkillsDir();
        const availableSet = new Set(availableTools);
        const availableList = ['all', 'none', ...availableTools].join(', ');
        const lowerRaw = raw.toLowerCase();
        if (lowerRaw === 'all') {
            return availableTools;
        }
        if (lowerRaw === 'none') {
            return [];
        }
        const tokens = raw
            .split(',')
            .map((token) => token.trim())
            .filter((token) => token.length > 0);
        if (tokens.length === 0) {
            throw new Error('The --tools option requires at least one tool ID when not using "all" or "none".');
        }
        const normalizedTokens = tokens.map((token) => token.toLowerCase());
        if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
            throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
        }
        const invalidTokens = tokens.filter((_token, index) => !availableSet.has(normalizedTokens[index]));
        if (invalidTokens.length > 0) {
            throw new Error(`Invalid tool(s): ${invalidTokens.join(', ')}. Available values: ${availableList}`);
        }
        // Deduplicate while preserving order
        const deduped = [];
        for (const token of normalizedTokens) {
            if (!deduped.includes(token)) {
                deduped.push(token);
            }
        }
        return deduped;
    }
    validateTools(toolIds, toolStates) {
        const validatedTools = [];
        for (const toolId of toolIds) {
            const tool = AI_TOOLS.find((t) => t.value === toolId);
            if (!tool) {
                const validToolIds = getToolsWithSkillsDir();
                throw new Error(`Unknown tool '${toolId}'. Valid tools:\n  ${validToolIds.join('\n  ')}`);
            }
            if (!tool.skillsDir) {
                const validToolsWithSkills = getToolsWithSkillsDir();
                throw new Error(`Tool '${toolId}' does not support skill generation.\nTools with skill generation support:\n  ${validToolsWithSkills.join('\n  ')}`);
            }
            const preState = toolStates.get(tool.value);
            validatedTools.push({
                value: tool.value,
                name: tool.name,
                skillsDir: tool.skillsDir,
                wasConfigured: preState?.configured ?? false,
            });
        }
        return validatedTools;
    }
    // ═══════════════════════════════════════════════════════════
    // DIRECTORY STRUCTURE
    // ═══════════════════════════════════════════════════════════
    async createDirectoryStructure(openspecPath, extendMode) {
        if (extendMode) {
            // In extend mode, just ensure directories exist without spinner
            const directories = [
                openspecPath,
                path.join(openspecPath, 'specs'),
                path.join(openspecPath, 'changes'),
                path.join(openspecPath, 'changes', 'archive'),
            ];
            for (const dir of directories) {
                await FileSystemUtils.createDirectory(dir);
            }
            return;
        }
        const spinner = this.startSpinner('Creating orbit structure...');
        const directories = [
            openspecPath,
            path.join(openspecPath, 'specs'),
            path.join(openspecPath, 'changes'),
            path.join(openspecPath, 'changes', 'archive'),
        ];
        for (const dir of directories) {
            await FileSystemUtils.createDirectory(dir);
        }
        spinner.stopAndPersist({
            symbol: PALETTE.white('▌'),
            text: PALETTE.white('orbit structure created'),
        });
    }
    // ═══════════════════════════════════════════════════════════
    // SKILL & COMMAND GENERATION
    // ═══════════════════════════════════════════════════════════
    async generateSkillsAndCommands(projectPath, tools) {
        const createdTools = [];
        const refreshedTools = [];
        const failedTools = [];
        const commandsSkipped = [];
        let removedCommandCount = 0;
        let removedSkillCount = 0;
        // Read global config for profile and delivery settings (use --profile override if set)
        const globalConfig = getGlobalConfig();
        const profile = this.resolveProfileOverride() ?? globalConfig.profile ?? 'core';
        const delivery = globalConfig.delivery ?? 'both';
        const workflows = getProfileWorkflows(profile, globalConfig.workflows);
        // Get skill and command templates filtered by profile workflows
        const shouldGenerateSkills = delivery !== 'commands';
        const shouldGenerateCommands = delivery !== 'skills';
        const skillTemplates = shouldGenerateSkills ? getSkillTemplates(workflows) : [];
        const commandContents = shouldGenerateCommands ? getCommandContents(workflows) : [];
        // Preflight validation (orbit-skill-generation): an invalid reference name or metadata
        // key fails the operation BEFORE any file write — including SKILL.md.
        if (shouldGenerateSkills) {
            validateSkillTemplates(skillTemplates);
        }
        let referenceEntriesWritten = 0;
        const referenceEntriesRemoved = [];
        // Process each tool
        for (const tool of tools) {
            const spinner = ora(`Setting up ${tool.name}...`).start();
            try {
                // Generate skill files if delivery includes skills
                if (shouldGenerateSkills) {
                    // Use tool-specific skillsDir
                    const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
                    // Create skill directories and SKILL.md files
                    for (const { template, dirName } of skillTemplates) {
                        const skillDir = path.join(skillsDir, dirName);
                        const skillFile = path.join(skillDir, 'SKILL.md');
                        // Generate SKILL.md content with YAML frontmatter including generatedBy
                        // Use hyphen-based command references for tools where filename = command name
                        const transformer = (tool.value === 'opencode' || tool.value === 'pi') ? transformToHyphenCommands : undefined;
                        const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
                        // Physical containment: a symlinked skill dir must not route writes outside
                        await ensureRealSkillDir(skillDir);
                        // Write the skill file
                        await FileSystemUtils.writeFile(skillFile, skillContent);
                        // Reconcile references/ (orbit-skill-generation): extend-mode re-runs converge too
                        const refResult = await reconcileSkillReferences(skillDir, template.references);
                        referenceEntriesWritten += refResult.written;
                        referenceEntriesRemoved.push(...refResult.removed.map((name) => `${dirName}/references/${name}`));
                        if (refResult.rootRemoved && refResult.removed.length === 0) {
                            referenceEntriesRemoved.push(`${dirName}/references`);
                        }
                    }
                }
                if (!shouldGenerateSkills) {
                    const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
                    removedSkillCount += await this.removeSkillDirs(skillsDir);
                }
                // Generate commands if delivery includes commands
                if (shouldGenerateCommands) {
                    const adapter = CommandAdapterRegistry.get(tool.value);
                    if (adapter) {
                        const generatedCommands = generateCommands(commandContents, adapter);
                        for (const cmd of generatedCommands) {
                            const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(projectPath, cmd.path);
                            await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
                        }
                    }
                    else {
                        commandsSkipped.push(tool.value);
                    }
                }
                if (!shouldGenerateCommands) {
                    removedCommandCount += await this.removeCommandFiles(projectPath, tool.value);
                }
                spinner.succeed(`Setup complete for ${tool.name}`);
                if (tool.wasConfigured) {
                    refreshedTools.push(tool);
                }
                else {
                    createdTools.push(tool);
                }
            }
            catch (error) {
                spinner.fail(`Failed for ${tool.name}`);
                failedTools.push({ name: tool.name, error: error });
            }
        }
        if (referenceEntriesWritten > 0) {
            console.log(chalk.dim(`Generated ${referenceEntriesWritten} reference file${referenceEntriesWritten === 1 ? '' : 's'}`));
        }
        if (referenceEntriesRemoved.length > 0) {
            console.log(chalk.dim(`Removed ${referenceEntriesRemoved.length} undeclared reference entr${referenceEntriesRemoved.length === 1 ? 'y' : 'ies'}: ${referenceEntriesRemoved.join(', ')}`));
        }
        return {
            createdTools,
            refreshedTools,
            failedTools,
            commandsSkipped,
            removedCommandCount,
            removedSkillCount,
        };
    }
    // ═══════════════════════════════════════════════════════════
    // CONFIG FILE
    // ═══════════════════════════════════════════════════════════
    async createConfig(openspecPath, extendMode) {
        const configPath = path.join(openspecPath, 'config.yaml');
        const configYmlPath = path.join(openspecPath, 'config.yml');
        const configYamlExists = fs.existsSync(configPath);
        const configYmlExists = fs.existsSync(configYmlPath);
        if (configYamlExists || configYmlExists) {
            return 'exists';
        }
        // In non-interactive mode without --force, skip config creation
        if (!this.canPromptInteractively() && !this.force) {
            return 'skipped';
        }
        try {
            const yamlContent = serializeConfig({ schema: DEFAULT_SCHEMA });
            await FileSystemUtils.writeFile(configPath, yamlContent);
            return 'created';
        }
        catch {
            return 'skipped';
        }
    }
    // ═══════════════════════════════════════════════════════════
    // UI & OUTPUT
    // ═══════════════════════════════════════════════════════════
    displaySuccessMessage(projectPath, tools, results, configStatus) {
        console.log();
        console.log(chalk.bold('orbit Setup Complete'));
        console.log();
        // Show created vs refreshed tools
        if (results.createdTools.length > 0) {
            console.log(`Created: ${results.createdTools.map((t) => t.name).join(', ')}`);
        }
        if (results.refreshedTools.length > 0) {
            console.log(`Refreshed: ${results.refreshedTools.map((t) => t.name).join(', ')}`);
        }
        // Show counts (respecting profile filter)
        const successfulTools = [...results.createdTools, ...results.refreshedTools];
        if (successfulTools.length > 0) {
            const globalConfig = getGlobalConfig();
            const profile = this.profileOverride ?? globalConfig.profile ?? 'core';
            const delivery = globalConfig.delivery ?? 'both';
            const workflows = getProfileWorkflows(profile, globalConfig.workflows);
            const toolDirs = [...new Set(successfulTools.map((t) => t.skillsDir))].join(', ');
            const skillCount = delivery !== 'commands' ? getSkillTemplates(workflows).length : 0;
            const commandCount = delivery !== 'skills' ? getCommandContents(workflows).length : 0;
            if (skillCount > 0 && commandCount > 0) {
                console.log(`${skillCount} skills and ${commandCount} commands in ${toolDirs}/`);
            }
            else if (skillCount > 0) {
                console.log(`${skillCount} skills in ${toolDirs}/`);
            }
            else if (commandCount > 0) {
                console.log(`${commandCount} commands in ${toolDirs}/`);
            }
        }
        // Show failures
        if (results.failedTools.length > 0) {
            console.log(chalk.red(`Failed: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
        }
        // Show skipped commands
        if (results.commandsSkipped.length > 0) {
            console.log(chalk.dim(`Commands skipped for: ${results.commandsSkipped.join(', ')} (no adapter)`));
        }
        if (results.removedCommandCount > 0) {
            console.log(chalk.dim(`Removed: ${results.removedCommandCount} command files (delivery: skills)`));
        }
        if (results.removedSkillCount > 0) {
            console.log(chalk.dim(`Removed: ${results.removedSkillCount} skill directories (delivery: commands)`));
        }
        // Config status
        if (configStatus === 'created') {
            console.log(`Config: orbit/config.yaml (schema: ${DEFAULT_SCHEMA})`);
        }
        else if (configStatus === 'exists') {
            // Show actual filename (config.yaml or config.yml)
            const configYaml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yaml');
            const configYml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yml');
            const configName = fs.existsSync(configYaml) ? 'config.yaml' : fs.existsSync(configYml) ? 'config.yml' : 'config.yaml';
            console.log(`Config: orbit/${configName} (exists)`);
        }
        else {
            console.log(chalk.dim(`Config: skipped (non-interactive mode)`));
        }
        // Getting started: the architect-first start (orbit-architect's `Start surfaces name the
        // architect workflow first`). Every workflow is installed (D15), so no profile branch.
        console.log();
        console.log(chalk.bold('Getting started:'));
        console.log('  Plan your first piece of work: /orbit:architect <name>');
        // Links
        console.log();
        console.log(`Learn more: ${chalk.cyan('https://github.com/las-sal/orbit-spec')}`);
        console.log(`Feedback:   ${chalk.cyan('https://github.com/las-sal/orbit-spec/issues')}`);
        // Restart instruction if any tools were configured
        if (results.createdTools.length > 0 || results.refreshedTools.length > 0) {
            console.log();
            console.log(chalk.white('Restart your IDE for slash commands to take effect.'));
        }
        console.log();
    }
    startSpinner(text) {
        return ora({
            text,
            stream: process.stdout,
            color: 'gray',
            spinner: PROGRESS_SPINNER,
        }).start();
    }
    async removeSkillDirs(skillsDir) {
        let removed = 0;
        for (const workflow of ALL_WORKFLOWS) {
            const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
            if (!dirName)
                continue;
            const skillDir = path.join(skillsDir, dirName);
            try {
                if (fs.existsSync(skillDir)) {
                    await fs.promises.rm(skillDir, { recursive: true, force: true });
                    removed++;
                }
            }
            catch {
                // Ignore errors
            }
        }
        return removed;
    }
    async removeCommandFiles(projectPath, toolId) {
        let removed = 0;
        const adapter = CommandAdapterRegistry.get(toolId);
        if (!adapter)
            return 0;
        for (const workflow of ALL_WORKFLOWS) {
            const cmdPath = adapter.getFilePath(workflow);
            const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
            try {
                if (fs.existsSync(fullPath)) {
                    await fs.promises.unlink(fullPath);
                    removed++;
                }
            }
            catch {
                // Ignore errors
            }
        }
        return removed;
    }
}
/**
 * The ONE setup step: explains the runner in init's own output, then offers the Codex preset (only
 * when `codex` resolves on PATH), an own argv typed as one JSON array, or none. A well-formed record
 * is shown and kept by default; a malformed one is shown with its warning and none of the choices
 * keeps it. `none` removes a present record and writes nothing when there is none.
 */
export async function runExternalRunnerSetup(prompts, deps = {}) {
    const env = deps.env ?? process.env;
    const log = deps.log ?? ((line) => console.log(line));
    const config = getGlobalConfig();
    const present = Object.prototype.hasOwnProperty.call(config, EXTERNAL_RUNNER_FIELD);
    const current = present ? checkRunnerShape(config[EXTERNAL_RUNNER_FIELD]) : null;
    log('');
    log(chalk.bold('External review runner'));
    log('An external runner is another AI that reviews a change from a packaged prompt. orbit launches it for');
    log('`/orbit:review --reviewer external` only because you record it here; with none recorded, the prompt is');
    log('printed for you to paste. This is a per-user setting (`orbit config` edits it later).');
    if (current?.ok) {
        log(`Current: ${JSON.stringify(config[EXTERNAL_RUNNER_FIELD])}`);
    }
    else if (current && !current.ok) {
        log(chalk.yellow(`Current: ${JSON.stringify(config[EXTERNAL_RUNNER_FIELD])} — malformed: ${EXTERNAL_RUNNER_FIELD} ${current.reason}`));
    }
    const choices = [];
    if (current?.ok)
        choices.push({ name: 'Keep the current runner', value: 'kept' });
    if (isOnPath('codex', env))
        choices.push({ name: 'Codex (codex exec, read-only)', value: 'preset' });
    choices.push({ name: 'My own command (one JSON array, with {output})', value: 'argv' });
    choices.push({ name: 'None — print the prompt for paste', value: 'none' });
    const answer = (await prompts.select({
        message: 'External review runner:',
        choices,
        default: current?.ok ? 'kept' : 'none',
    }));
    const write = (value) => {
        const next = { ...config };
        if (value === undefined)
            delete next[EXTERNAL_RUNNER_FIELD];
        else
            next[EXTERNAL_RUNNER_FIELD] = value;
        saveGlobalConfig(next);
    };
    if (answer === 'kept')
        return 'kept';
    if (answer === 'preset') {
        write({ preset: 'codex' });
        return 'preset';
    }
    if (answer === 'none') {
        if (present)
            write(undefined);
        return 'none';
    }
    if (answer !== 'argv') {
        throw new Error(`Unexpected external-runner setup answer: ${String(answer)}`);
    }
    for (;;) {
        const raw = await prompts.input({
            message: 'Runner argv as one JSON array, e.g. ["my-reviewer", "--out", "{output}"]:',
        });
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            log(chalk.yellow('Not valid JSON — type one JSON array of strings.'));
            continue;
        }
        if (!Array.isArray(parsed)) {
            log(chalk.yellow('Not an array — type one JSON array of strings.'));
            continue;
        }
        const shape = checkRunnerShape({ argv: parsed });
        if (!shape.ok) {
            log(chalk.yellow(`Refused: ${EXTERNAL_RUNNER_FIELD} ${shape.reason}.`));
            continue;
        }
        write({ argv: parsed });
        return 'argv';
    }
}
//# sourceMappingURL=init.js.map