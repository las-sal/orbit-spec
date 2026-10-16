/**
 * Auggie (Augment CLI) Command Adapter
 *
 * Formats commands for Auggie following its frontmatter specification.
 */
import path from 'path';
/**
 * Auggie adapter for command generation.
 * File path: .augment/commands/orbit-<id>.md
 * Frontmatter: description, argument-hint
 */
export const auggieAdapter = {
    toolId: 'auggie',
    getFilePath(commandId) {
        return path.join('.augment', 'commands', `orbit-${commandId}.md`);
    },
    formatFile(content) {
        return `---
description: ${content.description}
argument-hint: command arguments
---

${content.body}
`;
    },
};
//# sourceMappingURL=auggie.js.map