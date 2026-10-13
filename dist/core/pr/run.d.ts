export interface PrContext {
    /** The project root; every invocation runs here. */
    projectRoot: string;
    /** The environment the invocations see (PATH decides which `git` and `gh` run). */
    env: NodeJS.ProcessEnv;
}
export interface RunResult {
    status: number;
    stdout: string;
    stderr: string;
}
/** Thrown when a subcommand asks the runner for an invocation outside the allowlist. */
export declare class PrRefusedError extends Error {
}
/**
 * Whether `args` (the argv after `git`) is an invocation the allowlist names. `remote` is the
 * resolved remote when one is known; `ls-remote` and `fetch` must name it.
 */
export declare function gitAllowed(args: string[], remote: string | null): boolean;
/** Whether `args` (the argv after `gh`) is an invocation the allowlist names. */
export declare function ghAllowed(args: string[]): boolean;
export declare class PrRunner {
    readonly ctx: PrContext;
    /** The resolved remote, once resolution has chosen one; `ls-remote` and `fetch` must name it. */
    remote: string | null;
    constructor(ctx: PrContext);
    git(...args: string[]): RunResult;
    gh(...args: string[]): RunResult;
    /** A PATH lookup — never an invocation of `gh`. */
    ghAvailable(): boolean;
    /**
     * The bounded fetch (D-rc12-11): `ls-remote --heads` decides which of `branches` exist on the
     * resolved remote, and only those are fetched, each by an explicit refspec, with no tags and
     * an empty `--refmap=` so no configured refspec applies.
     * Returns the set that exists, or null when the remote could not be read.
     */
    boundedFetch(branches: string[]): Set<string> | null;
    private spawn;
}
//# sourceMappingURL=run.d.ts.map