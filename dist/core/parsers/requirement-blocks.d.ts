export interface RequirementBlock {
    headerLine: string;
    name: string;
    raw: string;
}
export interface RequirementsSectionParts {
    before: string;
    headerLine: string;
    preamble: string;
    bodyBlocks: RequirementBlock[];
    after: string;
}
export declare function normalizeRequirementName(name: string): string;
/**
 * Extracts the Requirements section from a spec file and parses requirement blocks.
 */
/**
 * Returns a boolean per line: true when the line is inside (or is a delimiter of) a
 * fenced code block. Fence-aware parsing keeps `##` / `### Requirement:` headers that
 * appear inside fenced examples (e.g. a prompt template) from being mistaken for spec
 * structure. Nested fences are handled by tracking the opening delimiter's char +
 * length: a fence closes only on a delimiter of the same char and >= length.
 */
export declare function computeFenceMask(lines: string[]): boolean[];
export declare function extractRequirementsSection(content: string): RequirementsSectionParts;
export interface DeltaPlan {
    added: RequirementBlock[];
    modified: RequirementBlock[];
    removed: string[];
    renamed: Array<{
        from: string;
        to: string;
    }>;
    sectionPresence: {
        added: boolean;
        modified: boolean;
        removed: boolean;
        renamed: boolean;
    };
}
/**
 * Parse a delta-formatted spec change file content into a DeltaPlan with raw blocks.
 */
export declare function parseDeltaSpec(content: string): DeltaPlan;
//# sourceMappingURL=requirement-blocks.d.ts.map