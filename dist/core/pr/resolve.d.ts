/**
 * Remote, canonical repository and default-branch resolution — ONE algorithm for every `orbit pr`
 * subcommand, computing `orbit-pr-lifecycle`'s `Remote and default-branch resolution`
 * (promoted from D6's executable transcription, `phase1.ts`, by rc12-engine-owned-choreography).
 *
 * Order: remote, canonical id, `gh` availability (a PATH lookup, before any branch work), then
 * the default branch — `gh repo view <owner>/<repo>` (the repository POSITIONAL; `gh repo view`
 * has no `--repo` flag), falling back to `symbolic-ref` only for an installed `gh` whose query
 * fails. Every failure is a reason code; the body writes the note.
 */
import type { PrResolution } from './record.js';
import type { PrRunner } from './run.js';
export type ResolveFailure = {
    code: 'no-remote';
    detail: Record<string, unknown>;
} | {
    code: 'several-remotes';
    detail: {
        candidates: string[];
    };
} | {
    code: 'unparseable-url';
    detail: {
        remote: string;
        url: string;
    };
} | {
    code: 'gh-absent';
    detail: Record<string, unknown>;
} | {
    code: 'no-default-branch';
    detail: {
        remote: string;
        repo: string;
    };
};
export interface Resolved {
    remote: string;
    repo: string;
    defaultBranch: string;
}
export interface ResolveOutcome {
    resolution: PrResolution;
    resolved: Resolved | null;
    failure: ResolveFailure | null;
}
/** `<owner>/<repo>` from a GitHub URL, HTTPS or SSH form; null for anything else — never a guess. */
export declare function canonicalRepoId(url: string): string | null;
/** `<owner>/<repo>` from a pull request URL, or null. */
export declare function repoOfPrUrl(url: string): string | null;
/**
 * Resolve the remote and canonical id, then (unless `withDefault` is false) `gh` availability and
 * the default branch. Sets `run.remote` once a remote is chosen, so the bounded fetch can name it.
 */
export declare function resolve(run: PrRunner, opts?: {
    withDefault?: boolean;
}): ResolveOutcome;
//# sourceMappingURL=resolve.d.ts.map