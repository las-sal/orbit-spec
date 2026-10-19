import { type PrRecord } from '../core/pr/record.js';
import type { PrContext } from '../core/pr/run.js';
export type PrSubcommandName = 'select' | 'publish' | 'preflight' | 'tail' | 'program';
export declare class PrCommand {
    execute(sub: PrSubcommandName, target: string, options?: {
        json?: boolean;
        outcome?: string;
        include?: string[];
    }): number;
}
export declare function runSubcommand(ctx: PrContext, sub: PrSubcommandName, target: string, options?: {
    outcome?: string;
    include?: string[];
}): PrRecord;
/** POSIX single-quoting, applied only where a word needs it. */
export declare function shellQuote(word: string): string;
export declare function renderRecord(r: PrRecord): string;
//# sourceMappingURL=pr.d.ts.map