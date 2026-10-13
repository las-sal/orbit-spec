/**
 * Core template types for skills and slash commands.
 */
export interface SkillReference {
    /** Bare filename (e.g., "archive-summary-schema.md") — no path separators; unique per skill */
    name: string;
    /** Markdown content emitted verbatim to <skill-dir>/references/<name> */
    content: string;
}
export interface SkillTemplate {
    name: string;
    description: string;
    instructions: string;
    license?: string;
    compatibility?: string;
    metadata?: Record<string, string>;
    /** Sibling reference files emitted alongside SKILL.md (orbit D7/B2 growth) */
    references?: SkillReference[];
}
export interface CommandTemplate {
    name: string;
    description: string;
    category: string;
    tags: string[];
    content: string;
}
//# sourceMappingURL=types.d.ts.map