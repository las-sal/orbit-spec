/**
 * `orbit fingerprint <change-name>` — stamp or check base fingerprints (C2).
 *
 * Stamp (default): capture the current baseline hash of every MODIFIED/REMOVED/RENAMED
 * requirement into the change's .openspec.yaml `base_fingerprints`. Add-missing-only;
 * `--refresh` overwrites (the deliberate re-stamp after reconciling).
 *
 * Check (`--check`): recompute live hashes and report per-requirement status. Never
 * writes. Exits non-zero when any requirement reports `diverged` or `missing`.
 */
export declare class FingerprintCommand {
    execute(changeName: string, options?: {
        check?: boolean;
        refresh?: boolean;
        json?: boolean;
    }): Promise<number>;
    private stamp;
    private check;
    private summarize;
    private hashSuffix;
    private checkGlyph;
    private stampGlyph;
    private stampLabel;
}
//# sourceMappingURL=fingerprint.d.ts.map