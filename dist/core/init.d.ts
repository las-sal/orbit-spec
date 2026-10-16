/**
 * Init Command
 *
 * Sets up OpenSpec with Agent Skills and /orbit:* slash commands.
 * This is the unified setup command that replaces both the old init and experimental commands.
 */
type InitCommandOptions = {
    tools?: string;
    force?: boolean;
    interactive?: boolean;
    profile?: string;
};
/** Where the migration guide lives on the orbit repository. */
export declare const MIGRATION_GUIDE_URL = "https://github.com/las-sal/orbit-spec/blob/main/docs/migration-guide.md";
/**
 * Whether the project holds an OpenSpec project directory (orbit-init-openspec-warning): a directory named by the
 * literal 'openspec' (OPENSPEC_DIR_NAME is 'orbit' in this fork) holding a `specs/` or `changes/` directory. A regular
 * file of any of those names is absent.
 */
export declare function detectOpenspecProject(projectPath: string): boolean;
/** The warning's text: orbit/ is separate, the move steps by the state of orbit/, and the guide. */
export declare const OPENSPEC_PROJECT_WARNING: string;
export declare class InitCommand {
    private readonly toolsArg?;
    private readonly force;
    private readonly interactiveOption?;
    private readonly profileOverride?;
    constructor(options?: InitCommandOptions);
    execute(targetPath: string): Promise<void>;
    private validate;
    private canPromptInteractively;
    private resolveProfileOverride;
    private handleLegacyCleanup;
    private performLegacyCleanup;
    private getSelectedTools;
    private resolveToolsArg;
    private validateTools;
    private createDirectoryStructure;
    private generateSkillsAndCommands;
    private createConfig;
    private displaySuccessMessage;
    private startSpinner;
    private removeSkillDirs;
    private removeCommandFiles;
}
export interface RunnerSetupPrompts {
    select(opts: {
        message: string;
        choices: Array<{
            name: string;
            value: string;
        }>;
        default?: string;
    }): Promise<string>;
    input(opts: {
        message: string;
    }): Promise<string>;
}
export interface RunnerSetupDeps {
    env?: NodeJS.ProcessEnv;
    log?: (line: string) => void;
}
export type RunnerSetupOutcome = 'kept' | 'preset' | 'argv' | 'none';
/**
 * The ONE setup step: explains the runner in init's own output, then offers the Codex preset (only
 * when `codex` resolves on PATH), an own argv typed as one JSON array, or none. A well-formed record
 * is shown and kept by default; a malformed one is shown with its warning and none of the choices
 * keeps it. `none` removes a present record and writes nothing when there is none.
 */
export declare function runExternalRunnerSetup(prompts: RunnerSetupPrompts, deps?: RunnerSetupDeps): Promise<RunnerSetupOutcome>;
export {};
//# sourceMappingURL=init.d.ts.map