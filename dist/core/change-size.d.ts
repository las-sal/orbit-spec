/** The four dimensions, in report order. */
export declare const SIZE_DIMENSIONS: readonly ["capabilities", "requirements", "changed_bytes", "tasks"];
export type SizeDimension = (typeof SIZE_DIMENSIONS)[number];
/** The valid configured maxima; a dimension with no entry is not compared. */
export type SizeCeiling = Partial<Record<SizeDimension, number>>;
/** One figure that could not be computed: its input file exists but cannot be read. */
export interface SizeError {
    figure: SizeDimension;
    path: string;
    message: string;
}
export interface ChangeSize {
    capabilities: number | null;
    requirements: number | null;
    changed_bytes: number | null;
    tasks: number | null;
    errors: SizeError[];
}
/**
 * The `## Size` production, a CHECKED MIRROR of the fence in `orbit-change-size`'s `A breach is
 * declared in the proposal's Size section` (held byte-equal by test/core/size-declaration-parity.test.ts).
 * The propose body interpolates this constant; it is never retyped.
 */
export declare const SIZE_DECLARATION_PRODUCTION: string;
/**
 * Compute the four figures for an active change (`Four size figures are computed from the
 * change's artifacts`). An input file that EXISTS but cannot be read nulls its figure and is
 * recorded in `errors` — never read as absent, which would inflate `changed_bytes` or zero a count.
 */
export declare function computeChangeSize(projectRoot: string, changeDir: string): ChangeSize;
export interface SizeDeclarationLine {
    /** 1-based line number in proposal.md. */
    line: number;
    text: string;
}
export interface SizeDeclaration {
    /** The declared dimensions, in the order first declared. */
    declared: SizeDimension[];
    malformed: SizeDeclarationLine[];
    duplicate: SizeDeclarationLine[];
}
/**
 * Parse the `## Size` section of a proposal (`A breach is declared in the proposal's Size
 * section`), fence-aware through the shared CommonMark fence tracker. The engine reads WHICH
 * dimensions are declared, never what a reason says.
 *
 * A bullet is an item OF THE SECTION when it is indented at most three spaces and LESS than the
 * content column of the item above it in the current list (that item's indent plus its marker and
 * the spaces after the marker, as CommonMark nests); a bullet at or beyond that column is nested
 * under the item and is part of its reason. The list context ends at a heading, at a thematic break
 * and at an unindented non-item line after a blank line. The section ends only at an ATX heading: a
 * `---` or `===` line is never read as a setext underline.
 */
export declare function parseSizeDeclaration(proposalText: string): SizeDeclaration;
/**
 * Read a change's declaration from its proposal. An absent proposal declares nothing silently; one
 * that exists but cannot be read declares nothing and returns the failure.
 */
export declare function readSizeDeclaration(changeDir: string): {
    declaration: SizeDeclaration;
    error?: {
        path: string;
        message: string;
    };
};
export interface SizeBreach {
    dimension: SizeDimension;
    figure: number;
    maximum: number;
    declared: boolean;
}
export interface StaleDeclaration {
    dimension: SizeDimension;
    figure: number | null;
    /** The configured maximum, or null when the dimension has none. */
    maximum: number | null;
}
/**
 * Compare the figures with the ceiling: a breach is a figure STRICTLY GREATER than its maximum.
 * A declared dimension that is not over — or has no configured maximum — is STALE. A figure that
 * could not be computed is not compared. With the check OFF (`ceiling` null) nothing is compared.
 */
export declare function sizeBreaches(figures: Pick<ChangeSize, SizeDimension>, ceiling: SizeCeiling | null, declaration: Pick<SizeDeclaration, 'declared'>): {
    breaches: SizeBreach[];
    stale: StaleDeclaration[];
};
export interface StatusSize {
    capabilities: number | null;
    requirements: number | null;
    changed_bytes: number | null;
    tasks: number | null;
    ceiling: SizeCeiling | null;
    breaches: SizeBreach[];
    errors: SizeError[];
}
/** The `size` object `orbit status --change <name> --json` carries (`Status carries the size figures`). */
export declare function composeStatusSize(projectRoot: string, changeDir: string, ceiling: SizeCeiling | null): StatusSize;
/** The human `Size:` line: the four figures alone, then each breach or `none over`. No ratio. */
export declare function renderSizeLine(size: StatusSize): string;
//# sourceMappingURL=change-size.d.ts.map