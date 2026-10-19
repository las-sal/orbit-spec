import { type PreflightOutcome, type PrRecord } from './record.js';
import { PrRunner, type PrContext } from './run.js';
/**
 * The stable part of `gh`'s message for a pull request that does not exist — the substring the
 * recorded contract's `pr_view_not_found` rule carries (a test holds the two together). Any
 * other non-zero exit is `unobserved`: keying on exit status alone would class an auth failure
 * as not-found and keep a dead URL in the emit.
 */
export declare const GH_PR_NOT_FOUND = "Could not resolve to a PullRequest";
export interface ValidatedPr {
    outcome: PreflightOutcome;
    state?: 'draft' | 'ready';
    stderr?: string;
    /**
     * On a positive invalidation, the failed predicate's OBSERVED value and the EXPECTED one — the
     * facts the body's note names (`retargeted to <base>`), so it never invents them or observes again.
     */
    detail?: {
        observed: string | null;
        expected?: string;
    };
}
/** Validate a stored URL live against the four predicates: repository, open state, base, head. */
export declare function validatePrUrl(run: PrRunner, repo: string, url: string, branch: string, defaultBranch: string): ValidatedPr;
export declare function prPreflight(ctx: PrContext, change: string): PrRecord;
//# sourceMappingURL=preflight.d.ts.map