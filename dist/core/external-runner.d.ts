/**
 * The external runner (rc17d-external-runner, `orbit-external-runner`).
 *
 * Two halves, both engine-side and both inert: the RESOLVER reads the user's per-user
 * `externalRunner` record and resolves it to an argv (the engine never executes it — the review
 * body's external branch does, under the user's `--reviewer external`); the SAVER normalizes an
 * external AI's raw return into the change's trail. Neither reads git state or runs a process.
 *
 * The record is `{preset: "codex"}` or `{argv: [...]}`, never a shell string: an array element is
 * exactly one argument, so nothing ever parses the record as a command line.
 */
import { type GlobalConfig } from './global-config.js';
export declare const EXTERNAL_RUNNER_FIELD = "externalRunner";
/**
 * The only preset. It passes no model flag, so the user's own Codex configuration chooses the model.
 * `-C {worktree}` names the reviewed checkout; `-o {output}` captures the final message; `-` reads the
 * prompt from standard input.
 */
export declare const RUNNER_PRESETS: Readonly<Record<string, readonly string[]>>;
export declare const OUTPUT_PLACEHOLDER = "{output}";
export declare const WORKTREE_PLACEHOLDER = "{worktree}";
export type RunnerForm = 'preset' | 'argv';
export interface ResolvedRunner {
    form: RunnerForm;
    name: string;
    argv: string[];
    reachable: boolean;
}
export type RunnerShapeCheck = {
    ok: true;
    form: RunnerForm;
    name: string;
    argv: string[];
} | {
    ok: false;
    reason: string;
};
/**
 * The shape table of `The runner record is a preset name or an argv array, never a shell string`.
 * Every value is exactly one row: the two accepted forms, or a refusal naming its reason.
 */
export declare function checkRunnerShape(value: unknown): RunnerShapeCheck;
/**
 * Whether `command` resolves to an executable file: a path (absolute, or relative to `cwd`) when it
 * carries a separator, else a `PATH` lookup. Executes nothing.
 */
export declare function isOnPath(command: string, env?: NodeJS.ProcessEnv, cwd?: string): boolean;
export interface RunnerResolution {
    runner: ResolvedRunner | null;
    /** Warnings for standard error; empty when the record is absent or well-formed. */
    warnings: string[];
}
/**
 * Resolve the user's record. Never throws: every missing or bad state resolves to `none`, with a
 * warning naming the cause where there is one. Invalid JSON in the global file falls back through
 * `getGlobalConfig()`, which prints its own warning.
 */
export declare function resolveExternalRunner(config?: GlobalConfig, env?: NodeJS.ProcessEnv): RunnerResolution;
export declare class ExternalSaveError extends Error {
}
export interface ExternalSaveOptions {
    projectRoot: string;
    change: string;
    mode: string;
    from: string;
    launch?: string;
    /** Test seam: the current time. */
    now?: Date;
}
export interface ExternalSaveResult {
    /** Repo-relative, forward slashes. */
    path: string;
    removed: string[];
}
/**
 * Locate the cut: the first line OUTSIDE every fenced block that begins with `# External Review:`.
 * Returns the byte offset of that line and the lines before it (each without its line ending), or
 * null when there is no such line.
 */
export declare function findUnfencedHeading(content: string): {
    offset: number;
    line: string;
    removed: string[];
} | null;
/**
 * The requirement's eight steps, in order. Every refusal throws `ExternalSaveError` before anything is
 * written; the one write is the last act.
 */
export declare function saveExternalReturn(opts: ExternalSaveOptions): ExternalSaveResult;
//# sourceMappingURL=external-runner.d.ts.map