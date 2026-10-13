/**
 * Junie Command Adapter
 *
 * Formats commands for Junie following its frontmatter specification.
 */
import path from 'path';
/**
 * Junie adapter for command generation.
 * File path: .junie/commands/orbit-<id>.md
 * Frontmatter: description
 */
export const junieAdapter = {
    toolId: 'junie',
    getFilePath(commandId) {
        return path.join('.junie', 'commands', `orbit-${commandId}.md`);
    },
    formatFile(content) {
        return `---
description: ${content.description}
---

${content.body}
`;
    },
};
//# sourceMappingURL=junie.js.map