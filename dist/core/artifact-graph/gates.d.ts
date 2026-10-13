import type { SchemaYaml, NormalizedGate, GateKind, CadenceEntry, ConsentValue } from './types.js';
import { type Trail, type TrailLaunch, type TrailOverlay, type TrailPass, type ReviewMode, type ReviewerClass } from './trail.js';
import { type ReviewPreference } from '../project-config.js';
/**
 * Gate-state computation (C1 engine gates). PURE: reads the change dir + `.orbit-runs/`
 * trail, writes nothing. Implements orbit-engine-gates' reviewed/tracked pass conditions,
 * the v1 freshness rule, and single-voiced canonical-next computation.
 */
export type GateState = 'blocked' | 'ready' | 'passed' | 'stale' | 'unpassed';
export interface GateStatus {
    id: string;
    kind: GateKind;
    state: GateState;
    reason?: string;
    /** Full canonical next command (single-voiced) when the gate is not passed. */
    nextCommand?: string;
    /** D5 hint garnish: the cadence slot the nextCommand covers, when it covers one. */
    nextSlot?: CadenceEntry;
    /** tracked kind: checkbox arithmetic surfaced as N/M. */
    checked?: number;
    total?: number;
    /**
     * D5 user-validation subset rule: set when a tracked gate is passed-for-flow-purposes
     * with ONLY declared user-validation handoff tasks unchecked — the pending task ids,
     * surfaced in the position readout (`apply ✓ (awaiting user validation: 9.6)`).
     */
    userValidationPending?: string[];
    /** rc02c: the DECLARED EXPECTATION of what the cadence costs, when the gate declares one.
     *  Nothing consults it — it is not a ceiling and it bounds nothing. */
    budget?: number;
    /** rc02c RECORDED COST (R-crc-11(h)): independent passes on the gate's mode across the whole
     *  trail, stale included, plus rejected external returns attributed to that mode. Effort is
     *  RECORDED, never TARGETED — nothing compares this to `budget`. */
    independentSpend?: number;
    /** rc02: distinct SUGGESTION-grade entries deferred or escalated; reported, never blocking. */
    deferredSuggestions?: number;
    before?: string;
    /**
     * D1: consent marker from the gate declaration — entry into the gate's `before:`
     * phase requires an explicit user invocation. Surfaced only; the engine never
     * prompts, and consent alters no gate-state computation.
     */
    consent?: ConsentValue;
    /**
     * C1: true when this reviewed gate has not passed and its `before` names a GATE that has passed
     * (a test on gate ids only; rc18) — the gate gated ENTRY to a phase that has since run, so it is
     * no longer the active frontier
     * (post-apply, `review-proposal` is moot). Superseded gates are skipped by
     * canonical-next and rendered as "(past)" in the position readout. NOT the same as
     * `passed`: the gate may never have converged; the flow simply advanced past it.
     */
    superseded?: boolean;
    /**
     * rc08b: EVERY pass the resolution clause finds unresolved, in token order (oldest first) —
     * the same predicate and pass set as clause (b), so element 0 is the pass `reason` names.
     * `[]` when every pass is resolved; absent on a blocked gate. `file` is repo-relative.
     * The field REPORTS; nothing new is ruled (R-crc-13).
     */
    unresolvedPasses?: UnresolvedPassRow[];
    /**
     * rc17a: every pass in clause (b)'s set carrying at least one finding of ANY severity that no walk
     * record references and that is not in `unresolvedPasses` — the discovery set beside the hold. Same
     * shape and order; `[]` when there is none; absent on a blocked gate. The gate's STATE never reads
     * it; its canonical next and the change's do (rc18).
     */
    unwalkedPasses?: UnresolvedPassRow[];
    /** rc08b: the pair diagnosis behind the reason's pair note, as a field a reader need not parse. */
    openPair?: {
        missing: 'fresh' | 'external';
    };
}
/** rc08b: one outstanding pass, as `orbit status --change --json` reports it. */
export interface UnresolvedPassRow {
    token: string;
    /** Repo-relative path of the findings artifact. */
    file: string;
    mode: ReviewMode | null;
    source: 'internal-review' | 'external';
}
export interface GateComputation {
    gates: GateStatus[];
    /** One-line position readout of the canonical flow. */
    position: string;
}
/** v1 freshness: a pass is stale iff an `apply-*.json` token is lexically later than its token. */
export declare function isPassStale(pass: TrailPass, applyTokens: string[]): boolean;
export declare function isIndependent(cls: ReviewerClass): boolean;
/** Why a `blind-pair` slot could not be satisfied, for the reason line. */
export type PairFailure = 'no-fresh' | 'no-external' | 'blindness-broken' | 'tie' | 'none-standing';
/**
 * rc17a: one launch's pair, computed per `orbit-engine-gates`' `A pair's membership is computed from
 * its launch`. `fresh` / `external` are the FIRST accepted pass of each class later than the launch and
 * earlier than the mode's next launch. `endedAt` is the token of the walk record that referenced a
 * landed member before its partner landed; an ended pair has no members — the walked member and every
 * later pass read as singles.
 */
export interface LaunchedPair {
    launch: TrailLaunch;
    fresh?: TrailPass;
    external?: TrailPass;
    endedAt?: string;
    /** rc17a system walk: the first independent pass of the mode sharing the launch's token, when one does. */
    tied?: TrailPass;
}
export interface PairMembership {
    /** Every launch's pair, token order, all modes. */
    pairs: LaunchedPair[];
    /** Files of the passes that are members of a pair that has not ended. Every other independent pass is a single. */
    memberFiles: Set<string>;
    /**
     * rc17a system walk (external W2): files of the independent passes sharing a launch's token. Whether such a
     * pass followed its launch is unknowable, so it is neither a member nor a single and covers nothing — the
     * tie fail-safe, applied at the launch boundary.
     */
    ambiguousFiles: Set<string>;
}
/**
 * rc17a: pair membership, read from the trail on every evaluation (the engine stores nothing). Per mode,
 * a launch's members are the first fresh pass and the first external return among the trail reader's
 * ACCEPTED passes — a rejected return is not in `trail.passes`, so it takes no position — later than the
 * launch and earlier than the mode's next launch. A walk record referencing a landed member whose token
 * precedes that member's partner (or with no partner landed at all) ENDS the pair at that record. An
 * apply ends nothing: freshness alone keeps a stale member from covering. ONE function, read by
 * coverage, diagnosis and presentation.
 */
export declare function computePairMembership(trail: Trail): PairMembership;
/**
 * Computes the state of every gate in the schema for a change. Requires the set of
 * completed artifact ids (from file-existence detection) so gate `requires` on
 * artifacts can be evaluated; gate-on-gate requires are resolved recursively.
 */
export declare function computeGateStates(schema: SchemaYaml, changeName: string, changeDir: string, completedArtifacts: Set<string>, overlay?: TrailOverlay): GateComputation;
/**
 * rc18 (D1, D2): a `passed` reviewed gate that is the FRONTIER — its `before` names no gate that has
 * passed, the superseded test negated on GATE IDS only (a `before` naming an artifact, a non-gate phase
 * such as `archive`, or nothing never makes a gate non-frontier) — and whose `unwalkedPasses` is
 * non-empty. The ONE predicate both the gate row and the change-level selection read.
 */
export declare function passedFrontierHoldsUnwalked(gate: GateStatus, gates: GateStatus[]): boolean;
/**
 * rc17a: evaluates ONE reviewed gate over an in-memory `Trail` — the pure seam the exhaustive oracle
 * calls. Reads no file: the trail and the resolved preference are its whole input. (Gate `requires`
 * are not evaluated here; `computeGateStates` does that before calling it.)
 */
export declare function evaluateReviewedGate(gate: NormalizedGate, changeName: string, trail: Trail, preference?: ReviewPreference): GateStatus;
//# sourceMappingURL=gates.d.ts.map