import { type PrMode } from './project-config.js';
import { type ChangeStatus } from './artifact-graph/index.js';
import { type ArchitectureBuckets } from './architecture/buckets.js';
/**
 * Orientation module (D-arc Stage D3). Pure composition layer behind
 * `orbit status` (bare = current sprint) and `orbit status --full` (arc view).
 *
 * READ-ONLY by contract: data sources are limited to the change-status
 * computation, architecture stage-state computation, workstream directory
 * presence, metadata citations, and `.orbit-runs/` emit files — never
 * artifact-content parsing, and never a file write (per orbit-orientation's
 * no-live-inference scenario).
 */
export interface OrientationChip {
    phase: string;
    /** '✓' | '▶' | '■' (the explore chip only — a concluded staging exploration) | '' (pending/unmarked) — the closed glyph mapping. */
    glyph: string;
    /** Review iteration count (`⟲6`) or tracked progress (`12/20`). */
    detail?: string;
}
export interface EmitRecord {
    token: string;
    file: string;
    command: string;
    timestamp: string;
    final_assessment: string;
    next_recommended: string;
    mode?: string;
    /**
     * rc13b: the explore emit's engine-computed header token (orbit-emit-composition's
     * `status` field). OPTIONAL, not spine — present only when the emit carries an object with
     * a string `token`; a prior-generation emit lacks it and reads as exploring. The concluded
     * chip and position are read from THIS (the trail), never from the file.
     */
    status?: {
        token: string;
        date?: string;
        re_entry?: string;
    };
}
export interface StageCitation {
    doc: string;
    stage: string;
}
/**
 * The shared discriminated workstream-entry shape (orbit-orientation's
 * JSON-output requirement). Healthy: {name, kind, stage?, strip, position,
 * last, next, status?}. Degraded: {name, kind, degraded: true, error} plus
 * any fields that remain trustworthy. Absent fields are omitted, never null.
 */
export interface WorkstreamEntry {
    name: string;
    kind: 'change' | 'explore';
    stage?: StageCitation;
    strip?: OrientationChip[];
    position?: string;
    last?: EmitRecord;
    next?: string;
    /** CHANGE entries only: the per-change status payload, nested unmodified. */
    status?: ChangeStatus;
    /**
     * D5 fail-loud surfacing: emit-shaped files (token + .json) excluded from arithmetic
     * as unreadable/JSON-invalid/spine-invalid. Absent when none — detection without
     * failure; the emit surface's atomic single-write cannot produce one.
     */
    skipped_emits?: string[];
    degraded?: true;
    error?: string;
}
export interface GlobalLast {
    workstream: string;
    emit: EmitRecord;
}
export interface Orientation {
    /** All live workstream entries, sprint first (sorted by emit recency). */
    workstreams: WorkstreamEntry[];
    /** The current sprint (continuity predicate), or null when nothing is live. */
    sprint: WorkstreamEntry | null;
    /** Globally most recent emit across ALL trails (incl. archived; LAST-band only). */
    last: GlobalLast | null;
    /** Waiting-on-you items (the closed 3-item set), render-ready strings. */
    waiting: string[];
    /** Architecture program buckets — THE architecture-status shapes, built by the shared builder. */
    program: ArchitectureBuckets;
    /**
     * The RESOLVED PR regime (D-arc Stage D6). Surfaced here because the workflow bodies must
     * not re-derive it: `orbit-pr-lifecycle` defines a CLOSED three-value set with every
     * failure path inert, and a body reading `orbit/config.yaml` itself would re-implement
     * that resolution in prose — silently accepting a typo the reader rejects, and never
     * emitting the one-line warning the requirement promises. Reading it here makes the
     * closed set enforceable rather than aspirational.
     */
    pr: PrMode;
}
/**
 * Minimum spine validity for orientation (orbit-orientation's fault-isolation
 * policy): string `command`, `final_assessment`, `next_recommended`; a
 * `review-external` T0 emit additionally needs a string `mode` (the WAITING
 * arithmetic's discriminator). Spine-invalid files are skipped exactly like
 * unreadable/JSON-invalid ones and never count in WAITING arithmetic.
 */
export declare function isSpineValid(json: unknown): json is {
    command: string;
    final_assessment: string;
    next_recommended: string;
    mode?: string;
};
/** Reads a trail directory's valid emits, ascending by token (then filename). */
export declare function readValidEmits(runsDir: string): EmitRecord[];
/**
 * Emit-shaped files (token + .json) the fault-isolation policy excluded — unreadable,
 * JSON-invalid, or spine-invalid. Surfaced, never silent (D-arc Stage D5): renders carry
 * a one-line degraded note per file and both JSON tiers carry `skipped_emits`.
 */
export declare function listSkippedEmits(runsDir: string): string[];
interface LiveWorkstream {
    name: string;
    kind: 'change' | 'explore';
    dir: string;
    runsDir: string;
}
/** Active changes (minus archive) + staging explores. Archived/architecture/project trails are never live. */
export declare function listLiveWorkstreams(projectRoot: string): LiveWorkstream[];
/**
 * Composes one workstream's entry. Fault isolation (clause b): a failure in
 * status computation or metadata load yields a DEGRADED entry — {name, kind,
 * degraded, error} plus whatever fields remain trustworthy (a readable trail
 * still yields `last`) — never a throw that aborts the fleet.
 */
export declare function composeWorkstreamEntry(projectRoot: string, ws: LiveWorkstream): WorkstreamEntry;
/**
 * The idle next line's fallback (orbit-orientation's recommendation-sourcing requirement): the
 * architect-first start (orbit-architect's `Start surfaces name the architect workflow first`).
 */
export declare const IDLE_NEXT_FALLBACK = "/orbit:architect <name>";
/**
 * The idle next line's recommendation, without its label — rendered ONLY on the degradation
 * ladder's rungs 2 and 3 (no live workstream). Sourced from the global LAST record (the `--full`
 * LAST band's recency rule): its `next_recommended` verbatim when it begins with `/orbit:`, else
 * the constant fallback. The prefix test is the only reading of the string — a prose
 * recommendation under the eligibility label would assert an eligibility nothing has.
 */
export declare function idleNextRecommendation(last: GlobalLast | null): string;
export declare function collectOrientation(projectRoot: string): Orientation;
export {};
//# sourceMappingURL=orientation.d.ts.map