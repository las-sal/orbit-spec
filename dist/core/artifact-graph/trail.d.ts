/**
 * Trail reader (C1 engine gates). Reads a change's `.orbit-runs/` audit trail into
 * plain data that gate-state computation consumes. PURE: reads files, writes nothing.
 *
 * The audit trail IS the gate ledger (per orbit-engine-gates "Gate state is a pure
 * function of existing on-disk artifacts") — there is no dedicated gate-state file.
 */
export type ReviewerClass = 'in-context' | 'fresh' | 'external';
export type ReviewMode = 'proposal' | 'system';
/** The closed severity ladder (orbit-conventions). `null` = the emit carried no recognised value. */
export type Severity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
/** CRITICAL and WARNING gate; SUGGESTION never does (rc02). */
export declare function isSubstantive(sev: Severity | null): boolean;
/** The closed disposition set an address-reviews entry may carry. */
export type Disposition = 'resolved' | 'stale' | 'deferred' | 'escalated';
/** A normalized finding. Its KEY is the tuple (TRIMMED, CASE-SENSITIVE TITLE + REPO-RELATIVE FILE) — used by clause (b)
 *  for resolution completeness and for deferred-suggestion dedup. (It was introduced for the
 *  new-finding match, which rc02c retired with clause (c); the key outlived the rule.) */
export interface TrailFinding {
    /** Trimmed, case-sensitive title. */
    title: string;
    /** Repo-relative file path with any `:line` suffix stripped. */
    file: string;
    /** Authored severity; `null` when the emit carried no recognised value. NEVER re-graded. */
    severity: Severity | null;
    /** External parse bookkeeping: the ingestion contract requires the full field triple. */
    hasFile?: boolean;
    hasDescription?: boolean;
}
/** A completed review pass (internal `review-<mode>-*.json` or external `external-<as>-*.md`). */
export interface TrailPass {
    /** Filename `<TS>` token, e.g. `2026-06-30T20-24-48Z`; lexically comparable. */
    token: string;
    /** Absolute path of the findings artifact. */
    file: string;
    reviewerClass: ReviewerClass;
    mode: ReviewMode | null;
    critical: number;
    warning: number;
    suggestion: number;
    findings: TrailFinding[];
    source: 'internal-review' | 'external';
}
/** One `resolutions[]` element, normalized. */
export interface TrailResolutionEntry {
    severity: Severity | null;
    /** Read from `outcome`, or the legacy key `status` when `outcome` is absent. */
    disposition: Disposition | null;
    /** Trimmed title, for deduplicating the deferred-suggestion count. */
    title: string;
    /** Repo-relative file with any `:line` suffix stripped. */
    file: string;
}
/** An address-reviews resolution record. */
export interface TrailResolution {
    token: string;
    /** Repo-relative-normalized `source_path`, or null. */
    sourcePath: string | null;
    /** `null` when the field was absent/non-numeric — treated as UNRESOLVED (not zero). */
    deferred: number | null;
    escalated: number | null;
    /**
     * rc02 READABILITY: true only when `resolutions` is a NON-EMPTY array whose EVERY element is an
     * object carrying a recognised severity AND a recognised disposition. Anything else — absent,
     * empty, a counter object, a non-object element, an unrecognised value — is UNREADABLE and the
     * gate falls back WHOLE to the bare counts for that record.
     */
    readable: boolean;
    /** The normalized entries; empty when the record is unreadable. */
    entries: TrailResolutionEntry[];
}
/** An external findings artifact the shape validation REJECTED (rc02: spend is spend). */
export interface RejectedExternal {
    token: string;
    file: string;
    mode: ReviewMode;
}
/**
 * rc17a: a blind pair's LAUNCH — a `review-external-<TS>.json` T0 whose JSON carries `pair: true` and a
 * `mode` of `proposal` or `system`. Its members are COMPUTED by the gate model from the passes after it
 * (`orbit-engine-gates`' `A pair's membership is computed from its launch`); nothing is stored.
 */
export interface TrailLaunch {
    token: string;
    mode: ReviewMode;
}
export interface Trail {
    changeDir: string;
    runsDir: string;
    passes: TrailPass[];
    resolutions: TrailResolution[];
    /** rc17a: pair launches, token order. A T0 without `pair: true` or a valid `mode` is no launch. */
    launches: TrailLaunch[];
    /** `apply-*.json` filename tokens (artifact-changing events for freshness). */
    applyTokens: string[];
    /**
     * External findings artifacts whose shape validation failed (rc02). They satisfy NO cadence slot
     * — their findings cannot be read — but they cost a model run, so `independentSpend` counts them
     * and the gate's reason names them. Attributed to the mode in the filename.
     */
    rejectedExternals: RejectedExternal[];
    /**
     * The LATEST apply emit's declared `user_validation_tasks` identifier list (D5): the
     * engine-verified record of which unchecked boxes are user-validation handoffs. Absent
     * when no apply emit declares the field. Consumed by the tracked-gate user-validation
     * subset rule (orbit-engine-gates).
     */
    latestApplyUserValidation?: string[];
}
/** Extract the ISO-with-hyphens `<TS>` token from a filename; null if unparseable (treated as absent). */
export declare function parseTsToken(filename: string): string | null;
/**
 * Strip a trailing `:line` (and `:line:col`) suffix from a file path. Exported (rc08a) so the walk
 * write gate's path rule and ripple-miss pointer key normalize by this one rule.
 */
export declare function stripLineSuffix(file: string): string;
export declare function toRepoRelative(p: string): string;
/**
 * A synthetic trail entry (D-arc Stage D5): an in-memory emit candidate treated as if it
 * were already on the trail — the emit surface's post-write-semantics composition computes
 * the change status against `disk + candidate` WITHOUT any provisional file existing.
 */
export interface TrailOverlay {
    /** The candidate's would-be filename (routes it through the same parse branches). */
    name: string;
    json: unknown;
}
/**
 * Reads the change's `.orbit-runs/` trail. Files with unparseable tokens or
 * unreadable/invalid content are skipped (treated as absent) — never throws on
 * a single bad file. An optional `overlay` candidate is folded in as if on disk.
 */
export declare function readTrail(changeDir: string, overlay?: TrailOverlay): Trail;
/**
 * A recognised disposition from `outcome`; the legacy key `status` is consulted ONLY when `outcome`
 * is ABSENT. Presence is tested with `in`, not truthiness or string-ness: `{outcome: null}` is a
 * PRESENT value the reader cannot interpret, and falling through to `status` there would revive a
 * legacy key to override a value the emit actually carried. Exported (rc08a) so the ripple-miss
 * pointer check reads an earlier walk's entry as the trail reader reads it.
 */
export declare function normalizeDisposition(entry: any): Disposition | null;
//# sourceMappingURL=trail.d.ts.map