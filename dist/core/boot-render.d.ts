import { type ChangeStatus } from './artifact-graph/instruction-loader.js';
/**
 * `orbit status --change <name> --boot` — the cold-start boot render (D-arc Stage D5,
 * arc ruling R-d-9(b)'s boot_sequence generalized to an engine surface). ORDERED
 * POINTERS into existing artifacts, never duplicated substance; computed fresh per
 * invocation (the R-d-4 subtraction — no hand-maintained handoff file exists anywhere).
 * READ-ONLY; degrades per orbit-orientation's fault-isolation policy.
 */
export interface BootEmitPointer {
    /** Command family (`apply`, `address-reviews`, `explore`, `verify`, `review-external`, …). */
    family: string;
    /** Review families only: `proposal` | `system` (architecture emits never sit on a change trail). */
    mode?: string;
    path: string;
    /** First sentence of the emit's final_assessment. */
    headline: string;
}
export interface BootView {
    /** Ordered artifact pointers — the read order. */
    artifacts: string[];
    /** Latest emit per command family present on the trail (review split per mode). */
    emits: BootEmitPointer[];
    history: {
        explore_md: boolean;
        sketches: boolean;
    };
    touchpoints: {
        predicted: string[] | null;
        actual: string[] | null;
        /** Change-own files (orbit/changes/<name>/**) collapsed out of `actual` — lifecycle bookkeeping, never scope drift. */
        actual_change_own_count?: number;
        /** ENGINE set-difference (present only when both maps are live): actual paths no predicted entry matches. */
        actual_unpredicted?: string[];
        /** ENGINE set-difference (present only when both maps are live): predicted entries (targets joined ` + `) no actual path satisfied. */
        predicted_unsatisfied?: string[];
        /** Malformed section entries (line-cited), surfaced whenever the section is present; already excluded from the arithmetic. */
        malformed?: Array<{
            line: number;
            text: string;
        }>;
    };
    /** Fault-isolation exclusions (absent in JSON when empty; typed here as optional). */
    skipped_emits?: string[];
}
export declare function collectBoot(projectRoot: string, changeName: string): {
    status: ChangeStatus;
    boot: BootView;
};
export declare function renderBoot(projectRoot: string, changeName: string): string;
//# sourceMappingURL=boot-render.d.ts.map