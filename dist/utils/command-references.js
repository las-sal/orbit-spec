/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */
/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/orbit:` patterns to `/orbit-` for tools that use hyphen syntax.
 *
 * @param text - The text containing command references
 * @returns Text with command references transformed to hyphen format
 *
 * @example
 * transformToHyphenCommands('/orbit:new') // returns '/orbit-new'
 * transformToHyphenCommands('Use /orbit:apply to implement') // returns 'Use /orbit-apply to implement'
 */
export function transformToHyphenCommands(text) {
    return text.replace(/\/orbit:/g, '/orbit-');
}
//# sourceMappingURL=command-references.js.map