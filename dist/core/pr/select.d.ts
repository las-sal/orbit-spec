import { type PrRecord } from './record.js';
import { type PrContext } from './run.js';
export type BranchState = 'absent' | 'local' | 'remote-only' | 'fast-forward';
export declare function prSelect(ctx: PrContext, name: string): PrRecord;
export interface PorcelainEntry {
    xy: string;
    path: string;
    /** A rename's or copy's source path. */
    from?: string;
}
/** `git status --porcelain -z` entries; a rename or copy carries its source. */
export declare function parsePorcelainZ(out: string): PorcelainEntry[];
//# sourceMappingURL=select.d.ts.map