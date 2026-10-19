/**
 * Chunk-preamble parser (D-arc Stage D5, orbit-run-summary-emit `Apply per-chunk-end
 * emission`). Parses the optional HTML-comment chunk declaration block at the top of a
 * change's tasks.md — the grammar is ENGINE data, no longer body prose.
 *
 * Grammar:
 *   <!--
 *   Implementation chunks:
 *     Chunk N (groups X[-Y]): <chunk-name>
 *   -->
 *
 * Constraints (all violations are MALFORMED — tolerant on read, strict on write:
 * a single stderr-suitable warning + no-chunking fallback, never a blocker):
 *  - `(groups X[-Y])` is a single group or a CONTIGUOUS range; non-contiguous sets are
 *    unsupported in v1.
 *  - Cross-declaration coverage: chunk numbers ascending, group ranges non-overlapping,
 *    and no gap (a group within the declared span covered by no chunk) — a tolerated gap
 *    would let chunk arithmetic declare apply-complete while uncovered tasks remain.
 *  - Content coverage: the declared span's ENDS must match the numbered groups actually
 *    present in tasks.md — an omitted leading or trailing group is the same
 *    apply-complete-with-uncovered-work hazard as an internal gap.
 */
export interface ChunkDeclaration {
    /** 1-based chunk number as declared. */
    chunk: number;
    /** First group number covered (inclusive). */
    groupStart: number;
    /** Last group number covered (inclusive; === groupStart for single-group chunks). */
    groupEnd: number;
    name: string;
}
export type ChunkPreambleResult = {
    kind: 'absent';
} | {
    kind: 'ok';
    declarations: ChunkDeclaration[];
} | {
    kind: 'malformed';
    warning: string;
};
/** Parses the chunk preamble from tasks.md content. `tasksPath` is used only in the warning text. */
export declare function parseChunkPreamble(content: string, tasksPath: string): ChunkPreambleResult;
/** Convenience: parse from a tasks.md path on disk. Missing file → absent. */
export declare function parseChunkPreambleFile(tasksPath: string): ChunkPreambleResult;
/** Returns the declaration covering `group`, or null. */
export declare function chunkForGroup(declarations: ChunkDeclaration[], group: number): ChunkDeclaration | null;
//# sourceMappingURL=chunk-preamble.d.ts.map