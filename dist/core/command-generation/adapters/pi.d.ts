/**
 * Pi Command Adapter
 *
 * Formats commands for Pi (pi.dev) following its prompt template specification.
 * Pi prompt templates live in .pi/prompts/*.md with description frontmatter.
 */
import type { ToolCommandAdapter } from '../types.js';
/**
 * Pi adapter for prompt template generation.
 * File path: .pi/prompts/orbit-<id>.md
 * Frontmatter: description
 *
 * Pi uses the filename (minus .md) as the slash command name, so
 * orbit-propose.md → /orbit-propose. Command references in the body
 * are transformed from /orbit: to /orbit- for consistency.
 */
export declare const piAdapter: ToolCommandAdapter;
//# sourceMappingURL=pi.d.ts.map