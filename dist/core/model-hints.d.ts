/**
 * Model-hint garnish (D-arc Stage D5, D-d5-9 / R-d-9(a)). When `orbit/config.yaml`
 * carries an OPTIONAL `models:` map and the canonical-next command's phase or cadence
 * slot has an entry, the rendered eligibility line appends ` — hint: <value>` (after any
 * ` — user-invoked` marker). SLOT entry wins over phase (the more specific hook); keys
 * outside both vocabularies are inert; and the VALUE is checked only at this rendering
 * boundary — a renderable hint is a non-empty single-line string of at most 80 characters
 * with no control characters (the eligibility line is a model-facing protocol; an embedded
 * newline could forge readout lines). A failing value is INERT exactly like an unknown
 * key: the line renders without the suffix, byte-identical to an absent entry, never an
 * error. Absent map = byte-identical pre-capability output.
 */
export interface HintKeys {
    /** Schema phase id driving the canonical next (e.g. `review-proposal`, `apply`). */
    phase?: string;
    /** Cadence slot name when the next command covers a slot (`in-context`, `fresh`, `independent`, `external`). */
    slot?: string;
}
/** True iff the value passes the rendering-boundary well-formedness check. */
export declare function isRenderableHint(value: unknown): value is string;
/** Resolve the hint for the given keys from a models map; slot wins over phase. */
export declare function resolveModelHint(models: Record<string, string> | undefined, keys: HintKeys | undefined): string | null;
/** Convenience: resolve from orbit/config.yaml on disk. */
export declare function modelHintFor(projectRoot: string, keys: HintKeys | undefined): string | null;
/** Append the hint suffix to an eligibility line (after any ` — user-invoked` marker). */
export declare function withModelHint(line: string, hint: string | null): string;
//# sourceMappingURL=model-hints.d.ts.map