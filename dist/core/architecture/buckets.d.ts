import { type StageState } from './state.js';
/**
 * The architecture-status bucket shapes, extracted so every surface that
 * promises "the architecture-status buckets" (the `orbit architecture status`
 * JSON and orientation's `--full` PROGRAM band — D-arc Stage D3) builds and
 * renders them from ONE place. Violation lines are one-based here (the
 * user-facing convention); the parser's zero-based lines never leak.
 */
export interface ArchitectureDocPayload {
    doc: string;
    stages: StageState[];
    violations?: Array<{
        line: number;
        reason: string;
        text: string;
    }>;
}
export interface ArchitectureBuckets {
    parseable: ArchitectureDocPayload[];
    legacy: string[];
    malformed: ArchitectureDocPayload[];
}
export declare function buildArchitectureBuckets(projectRoot: string): ArchitectureBuckets;
/** One stage line, exactly as `orbit architecture status` renders it. */
export declare function renderStageLine(s: StageState): string;
/** A legacy doc's listing line, exactly as `orbit architecture status` renders it. */
export declare function renderLegacyLine(name: string): string;
/** A malformed doc's header + one-based violation lines (no stages — callers may interleave). */
export declare function renderMalformedHeaderLines(p: ArchitectureDocPayload): string[];
/** A malformed doc's full listing lines (header + violations + well-formed sibling stages). */
export declare function renderMalformedLines(p: ArchitectureDocPayload): string[];
//# sourceMappingURL=buckets.d.ts.map