/**
 * `orbit emit <command>` — the generic emit surface's CLI channel (D-arc Stage D5).
 *
 * Targets per the target-resolution contract: `--change <name>` (workstream — change or
 * staging exploration; archived fallback for address-reviews), `--doc <doc-name>`
 * (architecture trail), or bare for project-scoped `audit-drift` and `address-reviews`
 * (anchor-less whole-repo walks). Payload arrives as JSON on stdin or via `--payload <file>`; when
 * `--payload` is present stdin is not consulted.
 *
 * Stdout contract: the written path; with `--json`, EXACTLY ONE structured object
 * `{path, emit, render?}` (no plain-text framing); `--render` (proposal/system review
 * emits) appends the engine report render — architecture mode: no-op + stderr note.
 * Error paths keep stdout empty (non-zero exit, message on stderr).
 */
export declare class EmitCommand {
    execute(emitCommand: string, options?: {
        change?: string;
        doc?: string;
        payload?: string;
        json?: boolean;
        render?: boolean;
    }): Promise<number>;
    private readStdin;
    private renderReport;
}
//# sourceMappingURL=emit.d.ts.map