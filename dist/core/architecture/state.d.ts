/**
 * Computed stage state (D-arc Stage D2) — a pure function of on-disk artifacts.
 * Never stored, never hand-authored, no caching (the citation corpus is small).
 *
 * Observed-state precedence: in-change > exploring > quiescent > concluded > premised
 * (live activity outranks history; archived work outranks a conclusion). A citing
 * staging directory observes `concluded` iff its `explore.md` header carries the
 * concluded token of the production `orbit-conventions` owns — read through the
 * explore parser's ONE reader (`readStatus`), never a second regex; a missing or
 * unreadable file, the `exploring` token, or neither token observe as live `exploring`.
 *
 * Completion is a COMPOSITION of observation and mark — ONE table for both layers
 * (rc15, `orbit-architecture-engine`'s `Computed stage state` requirement):
 *
 *   observed \ mark | `[ ]`                            | `[x]` ratified | `[~]` ended
 *   in-change       | in-change                        | INCONSISTENT   | INCONSISTENT
 *   exploring (live)| exploring                        | INCONSISTENT   | INCONSISTENT
 *   quiescent       | quiescent-awaiting-ratification  | complete       | ended
 *   concluded       | ended-from-explore               | INCONSISTENT   | ended
 *   premised        | premised                         | INCONSISTENT   | ended
 *
 * A ratified mark needs evidence (an archive), so it is honoured on `quiescent` only;
 * an ended mark asserts nothing about the work, so it is honoured wherever no LIVE
 * citing work contradicts it. Every INCONSISTENT cell is surfaced by the status render
 * (never a silent `complete` or `ended`) and raised by audit-drift's check (b).
 */
import type { ParsedArchitectureDoc } from './parser.js';
export type ObservedState = 'in-change' | 'exploring' | 'quiescent' | 'concluded' | 'premised';
export type RenderedState = 'in-change' | 'exploring' | 'quiescent-awaiting-ratification' | 'complete' | 'ended' | 'ended-from-explore' | 'premised' | 'inconsistent';
export interface CitingArtifact {
    kind: 'active-change' | 'archived-change' | 'explore';
    name: string;
    /** Repo-relative directory of the citing artifact. */
    path: string;
    /** `explore` kind only: the staging directory's header carries the concluded token. */
    concluded?: boolean;
}
export interface StageState {
    id: string;
    title: string;
    observed: ObservedState;
    ratified: boolean;
    ratifiedDate?: string;
    ratifiedWho?: string;
    /** The `[~]` mark: the user's declaration that the stage ended without meeting its criteria. */
    ended: boolean;
    endedDate?: string;
    endedWho?: string;
    rendered: RenderedState;
    /** Present when rendered === 'inconsistent': what contradicts the ratified or ended mark. */
    inconsistency?: string;
    /** ALL citing artifacts (the payload lists every citation; precedence picks observed). */
    citing: CitingArtifact[];
}
/**
 * Scan orbit/changes/*, orbit/changes/archive/*, and orbit/explore/* for artifacts
 * citing `{doc: <docName>}`, keyed by stage id.
 */
export declare function scanCitations(projectRoot: string, docName: string): Map<string, CitingArtifact[]>;
/**
 * Compute the state of every well-formed stage in a doc. Pure recompute per call.
 */
export declare function computeStageStates(projectRoot: string, doc: ParsedArchitectureDoc): StageState[];
//# sourceMappingURL=state.d.ts.map