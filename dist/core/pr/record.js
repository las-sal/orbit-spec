/**
 * The `orbit pr` record (rc12-engine-owned-choreography, D-rc12-8; `orbit-pr-lifecycle`'s
 * `The \`orbit pr\` command observes and prints; it never writes`).
 *
 * One record per subcommand call. It separates what the engine SAW (`observations`), what the
 * workflow body RUNS (`segments`, in order, authoring each segment's `inputs` first), and what
 * the USER does (`human_acts`, never run by a body or a test). The engine writes no note: a
 * skip or a PR-half degradation carries a closed `reason.code` and the facts in `detail`, and
 * the body renders the one-line note (D-rc12-13).
 */
/** The CLOSED set of body-authored inputs a printed argv may name, each an exact argv element. */
export const SEGMENT_INPUTS = ['<message-file>', '<title>', '<body-file>', '<emit-path>'];
/**
 * A usage error: the only non-zero exit an `orbit pr` subcommand has. Every other outcome —
 * off, skip, proceed, degraded — exits 0, because the PR layer degrades and never blocks.
 */
export class PrUsageError extends Error {
}
/**
 * Preflight's CLOSED outcome set (D-rc12-12), shared by `preflight` (which decides one), `tail`
 * (which takes one as `--outcome`) and `program` (which reports one).
 */
export const POSITIVE_INVALIDATIONS = [
    'closed',
    'merged',
    'retargeted',
    'head-mismatch',
    'repository-mismatch',
];
export const PREFLIGHT_OUTCOMES = [
    'valid',
    ...POSITIVE_INVALIDATIONS,
    'not-found',
    'discovered',
    'none',
    'several',
    'unobserved',
    'gh-absent',
];
export function offRecord(subcommand, observations = {}) {
    return { subcommand, action: 'off', reason: null, degraded: null, observations, segments: [], human_acts: [] };
}
export function skipRecord(subcommand, code, detail, observations) {
    return {
        subcommand,
        action: 'skip',
        reason: { code, detail },
        degraded: null,
        observations,
        segments: [],
        human_acts: [],
    };
}
//# sourceMappingURL=record.js.map