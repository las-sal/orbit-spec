import { type PrRecord } from './record.js';
import { PrRunner, type PrContext } from './run.js';
export interface PrListEntry {
    url: string;
    baseRefName: string;
    isDraft: boolean;
    number?: number;
}
/**
 * The four-axis constrained query: `--repo`, `--head`, `--state open`, then DISCARD candidates
 * whose base is not the resolved default. Shared by `publish`, `preflight` and `program`.
 */
export declare function fourAxisQuery(run: PrRunner, repo: string, head: string, defaultBranch: string): {
    ok: true;
    survivors: PrListEntry[];
} | {
    ok: false;
    stderr: string;
};
export declare function prPublish(ctx: PrContext, change: string): PrRecord;
//# sourceMappingURL=publish.d.ts.map