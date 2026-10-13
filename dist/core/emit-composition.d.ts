/**
 * `orbit emit <command>` — the engine-owned emit-composition surface (D-arc Stage D5,
 * capability orbit-emit-composition). ONE generic surface: the AI supplies only the
 * narrative payload; the engine composes the spine, deterministic facts, and computed
 * extensions, validates through the same normalizers the D4 renderer uses (the fail-loud
 * boundary at WRITE time), and writes EXACTLY ONE file, atomically.
 *
 * Post-write-semantics commands (change-scoped address-reviews, apply) compose their
 * `next_recommended` against a SYNTHETIC TRAIL — the on-disk trail plus the in-memory
 * candidate as-landed — so no provisional record ever exists and a crash leaves NO file.
 */
export declare class EmitError extends Error {
}
export type EmitKind = 'workflow' | 'editorial' | 'lifecycle';
/**
 * Read-only accessor over the payload-field table, for the schema-table parity test
 * (rc01-instrument-fidelity): the test derives each schema reference's AI-supplied field set
 * and asserts the table accepts it. Exposes nothing the write gate does not already enforce.
 */
export declare function payloadFieldsFor(command: string): readonly string[] | undefined;
/** Spine + deterministic facts + computed extensions per command — REJECTED in payloads. */
export declare const SPINE_FIELDS: string[];
export declare const ENGINE_OWNED_EXTRA: Record<string, string[]>;
export interface EmitTarget {
    change?: string;
    doc?: string;
}
export interface ComposedEmit {
    /** Absolute path of the written file. */
    path: string;
    emit: Record<string, unknown>;
}
export interface ComposeOptions {
    projectRoot?: string;
}
export interface ComposeResult extends ComposedEmit {
    /** stderr-suitable warnings gathered during composition (malformed preamble, missing sections). */
    warnings: string[];
}
export declare function composeAndWriteEmit(command: string, target: EmitTarget, payload: Record<string, unknown>, options?: ComposeOptions): ComposeResult;
//# sourceMappingURL=emit-composition.d.ts.map