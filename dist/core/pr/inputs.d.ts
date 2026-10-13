import { type PrMode } from '../project-config.js';
/** The regime, through the same reader `orbit status --json` surfaces as `pr`. */
export declare function readRegime(projectRoot: string): PrMode;
/** The `architecture.doc` citation in `<dir>/.openspec.yaml`, or null when absent or unreadable. */
export declare function readCitation(dir: string): string | null;
/** The PR target a regime and a citation select: granularity, and the doc on the program path. */
export interface Target {
    granularity: 'per-proposal' | 'per-architecture';
    doc?: string;
}
/**
 * The targeting predicate (`orbit-pr-lifecycle`'s `Config selects the regime; citation selects
 * the target`): a program target of the cited doc when the regime is `per-architecture` and a
 * citation is present, else a per-change target. ONE function for `select`, `publish` and
 * `preflight`, so the target selected, the target published and the divergence note agree.
 */
export declare function selectTarget(regime: PrMode, citation: string | null): Target;
export interface Attachment {
    branch: string;
    granularity: 'per-proposal' | 'per-architecture';
    url?: string;
    state?: 'draft' | 'ready';
    doc?: string;
}
export interface AttachmentRecord {
    attachment: Attachment;
    /** The emit file the attachment was read from, relative to the project root. */
    emit: string;
    /** The emit's `<TS>` token, for ordering across trails. */
    token: string;
}
/** Every attachment-bearing propose or ff emit on one trail, oldest first. */
export declare function attachmentsOnTrail(projectRoot: string, trailDir: string): AttachmentRecord[];
/** The LATEST attachment-bearing propose or ff emit on a change's trail (both equally authoritative). */
export declare function latestAttachment(projectRoot: string, changeDir: string): AttachmentRecord | null;
/** Every change directory, active and archived, whose trail may carry an attachment. */
export declare function allChangeDirs(projectRoot: string): string[];
//# sourceMappingURL=inputs.d.ts.map