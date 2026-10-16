/**
 * `orbit architecture status|show|validate` — the architecture-tier CLI (D-arc D2).
 *
 * status:   computed program position across all docs, bucketed parseable/legacy/
 *           malformed; per-stage observed state (with the completion composition) +
 *           citing artifacts. Eligibility-framed: renders state, never commands.
 * show:     one stage's section (heading-to-heading slice) or the doc's stage index —
 *           a session loads ONE stage section, never the whole doc.
 * validate: doc structure only (heading form, slot syntax, id uniqueness, Depends-on
 *           resolution). Legacy passes with a note; malformed fails naming lines.
 */
import { type ParsedArchitectureDoc } from '../core/architecture/parser.js';
export declare class ArchitectureCommand {
    status(options?: {
        json?: boolean;
    }): number;
    show(docName: string, stageId: string | undefined, options?: {
        json?: boolean;
    }): number;
    validate(docName: string, options?: {
        json?: boolean;
    }): number;
}
export type { ParsedArchitectureDoc };
//# sourceMappingURL=architecture.d.ts.map