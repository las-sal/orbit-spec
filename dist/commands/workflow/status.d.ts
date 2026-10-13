/**
 * Status Command
 *
 * Displays artifact completion status for a change.
 */
import { type ChangeStatus } from '../../core/artifact-graph/index.js';
import { type StatusSize } from '../../core/change-size.js';
export interface StatusOptions {
    change?: string;
    schema?: string;
    json?: boolean;
    full?: boolean;
    /** D4 `--report [<TS>]`: true when the flag is bare, the token string when given. */
    report?: string | boolean;
    /** D5 `--boot`: the cold-start boot render (rides --change; composes with --json). */
    boot?: boolean;
    /** rc06a `--scenarios`: the engine-computed scenario map (rides --change; composes with --json). */
    scenarios?: boolean;
}
export declare function statusCommand(options: StatusOptions): Promise<void>;
export declare function printStatusText(status: ChangeStatus, size?: StatusSize): void;
//# sourceMappingURL=status.d.ts.map