/**
 * Spec Application Logic
 *
 * Extracted from ArchiveCommand to enable standalone spec application.
 * Applies delta specs from a change to main specs without archiving.
 */
export interface SpecUpdate {
    source: string;
    target: string;
    exists: boolean;
}
export interface ApplyResult {
    capability: string;
    added: number;
    modified: number;
    removed: number;
    renamed: number;
}
export interface SpecsApplyOutput {
    changeName: string;
    capabilities: ApplyResult[];
    totals: {
        added: number;
        modified: number;
        removed: number;
        renamed: number;
    };
    noChanges: boolean;
}
/**
 * Find all delta spec files that need to be applied from a change.
 */
export declare function findSpecUpdates(changeDir: string, mainSpecsDir: string): Promise<SpecUpdate[]>;
/**
 * Build an updated spec by applying delta operations.
 * Returns the rebuilt content and counts of operations.
 */
export interface BuildUpdatedSpecOptions {
    /**
     * Change directory holding .openspec.yaml — overrides the default derivation for the
     * base-fingerprint guard (C2). When omitted, the guard derives it from `update.source`
     * (which is always `<changeDir>/specs/<capability>/spec.md`), so direct programmatic
     * callers cannot silently bypass the guard.
     */
    changeDir?: string;
    /** Proceed past fingerprint divergence (deliberate, visible override). */
    overrideFingerprints?: boolean;
}
export declare function buildUpdatedSpec(update: SpecUpdate, changeName: string, options?: BuildUpdatedSpecOptions): Promise<{
    rebuilt: string;
    counts: {
        added: number;
        modified: number;
        removed: number;
        renamed: number;
    };
}>;
/**
 * Write an updated spec to disk.
 */
export declare function writeUpdatedSpec(update: SpecUpdate, rebuilt: string, counts: {
    added: number;
    modified: number;
    removed: number;
    renamed: number;
}): Promise<void>;
/**
 * Build a skeleton spec for new capabilities.
 */
export declare function buildSpecSkeleton(specFolderName: string, changeName: string): string;
/**
 * Apply all delta specs from a change to main specs.
 *
 * @param projectRoot - The project root directory
 * @param changeName - The name of the change to apply
 * @param options - Options for the operation
 * @returns Result of the operation with counts
 */
export declare function applySpecs(projectRoot: string, changeName: string, options?: {
    dryRun?: boolean;
    skipValidation?: boolean;
    silent?: boolean;
    overrideFingerprints?: boolean;
}): Promise<SpecsApplyOutput>;
//# sourceMappingURL=specs-apply.d.ts.map