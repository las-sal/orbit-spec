/**
 * Kilo Code Command Adapter
 *
 * Formats commands for Kilo Code following its workflow specification.
 * Kilo Code workflows don't use frontmatter.
 */
import path from 'path';
/**
 * Kilo Code adapter for command generation.
 * File path: .kilocode/workflows/orbit-<id>.md
 * Format: Plain markdown without frontmatter
 */
export const kilocodeAdapter = {
    toolId: 'kilocode',
    getFilePath(commandId) {
        return path.join('.kilocode', 'workflows', `orbit-${commandId}.md`);
    },
    formatFile(content) {
        return `${content.body}
`;
    },
};
//# sourceMappingURL=kilocode.js.map