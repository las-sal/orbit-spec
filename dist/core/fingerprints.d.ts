/**
 * Base-fingerprint capture and divergence detection (C2 parallel-merge guardrail).
 *
 * A change's MODIFIED/REMOVED/RENAMED delta blocks are absolute snapshots authored
 * against the baseline the author read. This module captures a SHA-256 fingerprint of
 * each touched baseline requirement block at authoring time (stamp), and recomputes the
 * live hash later (check / archive guard) so a stale snapshot can never silently
 * overwrite a sibling change's edits.
 */
import { type DeltaPlan, type RequirementBlock } from './parsers/requirement-blocks.js';
export type FingerprintStatus = 'verified' | 'diverged' | 'unverified' | 'missing';
/** capability -> requirement name (live/FROM name) -> "sha256:<hex>" */
export type FingerprintMap = Record<string, Record<string, string>>;
export interface TouchedRequirement {
    /** The requirement's name in the LIVE baseline (RENAMED maps MODIFIED names back to FROM). */
    liveName: string;
    /** Delta operations touching it (a renamed requirement can also be modified). */
    ops: Array<'modified' | 'removed' | 'renamed'>;
    /** The delta block that would replace the live block (MODIFIED only). */
    incomingRaw?: string;
    /** The rename target (RENAMED only) — lets reports synthesize the would-be-written block. */
    renamedTo?: string;
}
export interface FingerprintCheckEntry {
    capability: string;
    requirement: string;
    status: FingerprintStatus;
    base_hash: string | null;
    live_hash: string | null;
    ops: TouchedRequirement['ops'];
}
export interface StampEntry {
    capability: string;
    requirement: string;
    action: 'stamped' | 'kept' | 'refreshed' | 'skipped-missing';
    hash: string | null;
}
export declare function hashRequirementBlock(raw: string): string;
/**
 * Derive the touched-requirement set for one capability's delta plan:
 * RENAMED[].from ∪ REMOVED[] ∪ MODIFIED[] — with MODIFIED names mapped back through
 * the delta's own RENAMED pairs to their live (FROM) names, since a MODIFIED that
 * accompanies a rename references the NEW header. ADDED requirements have no base
 * and are never fingerprinted.
 */
export declare function deriveTouchedSet(plan: DeltaPlan): TouchedRequirement[];
/**
 * Compute the per-requirement fingerprint status for one capability.
 *
 * Precedence: the idempotent-write skip beats `unverified` — a requirement whose live
 * hash equals the incoming block hash reports `verified` regardless of the stored
 * fingerprint (the write is a no-op; nothing can be lost). REMOVED/RENAMED entries get
 * no idempotent skip.
 */
export declare function computeStatuses(capability: string, touched: TouchedRequirement[], liveBlocks: RequirementBlock[], stored: Record<string, string> | undefined): FingerprintCheckEntry[];
/**
 * Stamp fingerprints for every touched requirement. Add-missing-only by default: an
 * existing fingerprint is NOT overwritten unless `refresh` is set — a default re-stamp
 * after the baseline diverged would overwrite the stored base hash with the new live
 * hash and mask the divergence.
 */
export declare function stampFingerprints(projectRoot: string, changeName: string, options?: {
    refresh?: boolean;
}): StampEntry[];
export declare function checkFingerprints(projectRoot: string, changeName: string): FingerprintCheckEntry[];
/**
 * Minimal line-level LCS diff. Deletions (`- `) are exactly the live content the write
 * would destroy; additions (`+ `) are the delta's content. Blocks are requirement-sized,
 * so O(n*m) is fine.
 */
export declare function diffLines(liveRaw: string, incomingRaw: string): string[];
/**
 * The block a pure RENAME would write: the live block with only its header line replaced.
 * A rename preserves the (possibly divergent) live body — it never removes or overwrites it —
 * so divergence reports must diff against this, not claim removal.
 */
export declare function synthesizeRenamedBlock(liveRaw: string, to: string): string;
export declare function formatDivergenceReport(diverged: Array<FingerprintCheckEntry & {
    liveRaw?: string;
    incomingRaw?: string;
}>, changeName: string): string;
//# sourceMappingURL=fingerprints.d.ts.map