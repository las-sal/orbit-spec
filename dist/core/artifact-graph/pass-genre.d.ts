import type { Disposition, ReviewerClass, Trail } from './trail.js';
/**
 * rc03c-verification-record — the PASS GENRE, computed (D-rc03c-1, -5, -7).
 *
 * `orbit-conventions`' `Review mode decision framework` OWNS the pass-genre table; this module
 * implements it and restates no row. `orbit-emit-composition`'s `The review emit records its pass
 * genre and the walks it verifies` owns the two computed extensions this produces (`pass_genre`,
 * `verified_walks`), and `orbit-report-rendering` recomputes the genre at render time through the
 * SAME function. The gate graph reads none of it (R-crc-13): this module lives beside the trail
 * reader, never in `gates.ts`, which carries no diff for it.
 *
 * PURE: reads the trail it is handed, writes nothing.
 */
export type PassGenre = 'REVIEW' | 'VERIFICATION';
export interface PassGenreResult {
    passGenre: PassGenre;
    /** The table's QUALIFYING-WALK set for the pass — address-reviews record tokens, token order. */
    verifiedWalks: string[];
}
/**
 * The ONE function implementing the pass-genre table. Inputs: the trail reader's ACCEPTED pass set
 * and its address-reviews records, plus the pass's own class, mode and filename token; only records
 * whose tokens STRICTLY precede that token are read.
 *
 * For an in-context pass in proposal or system mode, the qualifying walks are the address-reviews
 * records whose `source_path` resolves — by basename, through the ACCEPTED pass set — to a pass of
 * this mode, with a token after the latest accepted independent pass of the mode (every such walk
 * when the mode has none) and before the pass. A walk naming a rejected external return, no pass on
 * the trail, or no source at all is MODE-LESS and qualifies for no mode. The set is UNNARROWED: a
 * prior in-context pass does not move the lower bound, so a second verification re-lists the walks
 * an earlier one verified. Every other pass is REVIEW with an empty set.
 */
export declare function computePassGenre(trail: Trail, reviewerClass: ReviewerClass, mode: string, token: string): PassGenreResult;
/**
 * The key the gate uses for resolution: trimmed, case-sensitive title + repo-relative file with any
 * `:line` suffix stripped. The trail reader applies this to walk entries already; a PAYLOAD key is
 * normalized here by the same steps (the trail reader's helpers are private, and `trail.ts` carries
 * no diff for this stage).
 */
export declare function normalizeKey(title: string, file: string): {
    title: string;
    file: string;
};
export declare function keyString(k: {
    title: string;
    file: string;
}): string;
export interface OwedEntry {
    title: string;
    file: string;
    /** The LATEST walk of `verified_walks` carrying the key `resolved` — the one it is judged against. */
    walk: string;
}
export interface VerificationLedger {
    /** Owed entries by key string, in first-owed order. */
    owed: Map<string, OwedEntry>;
    /** Every disposition each key carries across the READABLE walks of the set. */
    carried: Map<string, Disposition[]>;
    /** Walks of the set that owe nothing because they cannot be read for the record. */
    unreadable: string[];
}
/**
 * The owed set over a computed walk set. An entry OWES a verdict exactly when its disposition is
 * `resolved`, at every severity; a key carried `resolved` by several walks is ONE owed entry judged
 * against the LATEST such walk, and a later walk carrying the key at another disposition does not
 * lift it. A walk is UNREADABLE for the record when the trail reader cannot read it, or when any of
 * its entries normalizes to an empty title or file — no well-shaped verdict could name that key.
 */
export declare function verificationLedger(trail: Trail, verifiedWalks: readonly string[]): VerificationLedger;
export interface ShapeError {
    /** The exact field path, e.g. `verification[2].verdict` or `findings[0].walk_entry.title`. */
    field: string;
    /** `newline` for an embedded CR/LF in a single-line slot; otherwise a mistyped/missing value. */
    kind: 'newline' | 'mistyped' | 'unknown-key';
    detail: string;
}
/** `verification`: an array of `{title, file, verdict}`, `verdict` exactly `landed` | `regressed`. */
export declare function verificationShapeError(v: unknown): ShapeError | null;
/** A finding's `walk_entry`: an object `{title, file}`. */
export declare function walkEntryShapeError(v: unknown, findingIndex: number): ShapeError | null;
//# sourceMappingURL=pass-genre.d.ts.map