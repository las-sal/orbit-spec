/**
 * Continue Command Adapter
 *
 * Formats commands for Continue following its .prompt specification.
 */
import path from 'path';
/**
 * Continue adapter for command generation.
 * File path: .continue/prompts/orbit-<id>.prompt
 * Frontmatter: name, description, invokable
 */
export const continueAdapter = {
    toolId: 'continue',
    getFilePath(commandId) {
        return path.join('.continue', 'prompts', `orbit-${commandId}.prompt`);
    },
    formatFile(content) {
        return `---
name: orbit-${content.id}
description: ${content.description}
invokable: true
---

${content.body}
`;
    },
};
//# sourceMappingURL=continue.js.map