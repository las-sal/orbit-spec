/**
 * iFlow Command Adapter
 *
 * Formats commands for iFlow following its frontmatter specification.
 */
import path from 'path';
/**
 * iFlow adapter for command generation.
 * File path: .iflow/commands/orbit-<id>.md
 * Frontmatter: name, id, category, description
 */
export const iflowAdapter = {
    toolId: 'iflow',
    getFilePath(commandId) {
        return path.join('.iflow', 'commands', `orbit-${commandId}.md`);
    },
    formatFile(content) {
        return `---
name: /orbit-${content.id}
id: orbit-${content.id}
category: ${content.category}
description: ${content.description}
---

${content.body}
`;
    },
};
//# sourceMappingURL=iflow.js.map