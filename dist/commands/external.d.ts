/**
 * `orbit external runner` / `orbit external save` (rc17d-external-runner, `orbit-external-runner`).
 *
 * `runner` prints the RESOLVED per-user record — the engine never executes it. `save` writes an
 * external AI's raw return into a change's trail, cutting any preamble above its heading. Neither
 * reads git state or runs a process; the launch itself is the review body's.
 */
export declare class ExternalCommand {
    runner(options?: {
        json?: boolean;
    }): number;
    save(change: string, options?: {
        as?: string;
        from?: string;
        launch?: string;
        json?: boolean;
    }): number;
}
//# sourceMappingURL=external.d.ts.map