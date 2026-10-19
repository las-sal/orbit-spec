/**
 * Touchpoints ENTRY GRAMMAR (D-arc Stage D5, orbit-propose-modifications — authored
 * there, ONE voice; this parser and the audit-drift matching semantics reference it):
 * each entry is a markdown list item under `## Touchpoints` whose LEADING inline-code
 * span(s) name the predicted targets — one span, or several `+`-joined spans recording
 * grouped alternatives. Everything after the spans (the ` — annotation` tail,
 * parentheticals) is prose the checks never parse. Target forms: (a) exact repo-relative
 * file path; (b) DIRECTORY PREFIX, trailing `/`; (c) GLOB containing `*` (fnmatch
 * semantics). A list item whose leading spans parse as none of the three forms is a
 * MALFORMED entry — surfaced (SUGGESTION-grade) naming the line and excluded from set
 * arithmetic, never a false drift source.
 */
export interface TouchpointEntry {
    /** The grouped alternative targets (≥1); the entry is satisfied when ANY matches. */
    targets: string[];
    /** 1-based line number in the source file (for malformed reporting / citations). */
    line: number;
}
export interface TouchpointsParse {
    /** Section present? false = no `## Touchpoints` heading (checks skip silently). */
    present: boolean;
    entries: TouchpointEntry[];
    /** Malformed list items: {line, text} — excluded from arithmetic, surfaced by checks. */
    malformed: Array<{
        line: number;
        text: string;
    }>;
}
/** Parses the `## Touchpoints` section of a design.md content string. */
export declare function parseTouchpoints(content: string): TouchpointsParse;
/** Parses a design.md file's Touchpoints section. Missing file → absent section. */
export declare function parseTouchpointsFile(designPath: string): TouchpointsParse;
/** fnmatch-style single-target match: exact path, directory prefix, or glob. */
export declare function targetMatches(target: string, actualPath: string): boolean;
/** An actual path is PREDICTED when any entry's any target matches. */
export declare function isPredicted(entries: TouchpointEntry[], actualPath: string): boolean;
/** An entry is SATISFIED when ANY of its grouped targets matched some actual path. */
export declare function entrySatisfied(entry: TouchpointEntry, actualPaths: string[]): boolean;
//# sourceMappingURL=touchpoints.d.ts.map