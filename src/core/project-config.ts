import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

/**
 * Zod schema for project configuration.
 *
 * Purpose:
 * 1. Documentation - clearly defines the config file structure
 * 2. Type safety - TypeScript infers ProjectConfig type from schema
 * 3. Runtime validation - uses safeParse() for resilient field-by-field validation
 *
 * Why Zod over manual validation:
 * - Helps understand OpenSpec's data interfaces at a glance
 * - Single source of truth for type and validation
 * - Consistent with other OpenSpec schemas
 */
export const ProjectConfigSchema = z.object({
  // Required: which schema to use (e.g., "spec-driven", or project-local schema name)
  schema: z
    .string()
    .min(1)
    .describe('The workflow schema to use (e.g., "spec-driven")'),

  // Optional: project context (injected into all artifact instructions)
  // Max size: 50KB (enforced during parsing)
  context: z
    .string()
    .optional()
    .describe('Project context injected into all artifact instructions'),

  // Optional: per-artifact rules (additive to schema's built-in guidance)
  rules: z
    .record(
      z.string(), // artifact ID
      z.array(z.string()) // list of rules
    )
    .optional()
    .describe('Per-artifact rules, keyed by artifact ID'),

  // Optional: model-per-phase hints (D-arc Stage D5, R-d-9(a)) — pure garnish echoed on
  // eligibility readouts, never enforced. Keys: schema phase ids or cadence slot names.
  models: z
    .record(z.string(), z.string())
    .optional()
    .describe('Model hints keyed by schema phase id or cadence slot name'),

  // Optional: PR lifecycle regime (D-arc Stage D6) — a SINGLE scalar with exactly three
  // mutually exclusive values, never a multi-key block (combinations are inexpressible by
  // construction, so no combination can be undefined). Absent = 'never'.
  pr: z
    .enum(['never', 'per-proposal', 'per-architecture'])
    .optional()
    .describe('PR lifecycle regime: never | per-proposal | per-architecture'),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/** The closed set of recognized `pr:` values (per `orbit-pr-lifecycle`). */
export const PR_MODES = ['never', 'per-proposal', 'per-architecture'] as const;
export type PrMode = (typeof PR_MODES)[number];

/**
 * Resolve the effective PR regime for a project.
 *
 * Absent config, absent key, and every inert path (unrecognized value, non-scalar shape)
 * all resolve to `never` — the pre-capability behavior. Consumers call this rather than
 * reading `config.pr` directly, so "absent = never" is stated in exactly one place.
 */
export function resolvePrMode(config: ProjectConfig | null): PrMode {
  return config?.pr ?? 'never';
}

const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB hard limit

/**
 * Read and parse orbit/config.yaml from project root.
 * Uses resilient parsing - validates each field independently using Zod safeParse.
 * Returns null if file doesn't exist.
 * Returns partial config if some fields are invalid (with warnings).
 *
 * Performance note (Jan 2025):
 * Benchmarks showed direct file reads are fast enough without caching:
 * - Typical config (1KB): ~0.5ms per read
 * - Large config (50KB): ~1.6ms per read
 * - Missing config: ~0.01ms per read
 * Config is read 1-2 times per command (schema resolution + instruction loading),
 * adding ~1-3ms total overhead. Caching would add complexity (mtime checks,
 * invalidation logic) for negligible benefit. Direct reads also ensure config
 * changes are reflected immediately without stale cache issues.
 *
 * @param projectRoot - The root directory of the project (where `orbit/` lives)
 * @returns Parsed config or null if file doesn't exist
 */
export function readProjectConfig(projectRoot: string): ProjectConfig | null {
  // Try both .yaml and .yml, prefer .yaml
  let configPath = path.join(projectRoot, 'orbit', 'config.yaml');
  if (!existsSync(configPath)) {
    configPath = path.join(projectRoot, 'orbit', 'config.yml');
    if (!existsSync(configPath)) {
      return null; // No config is OK
    }
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const raw = parseYaml(content);

    if (!raw || typeof raw !== 'object') {
      console.warn(`orbit/config.yaml is not a valid YAML object`);
      return null;
    }

    const config: Partial<ProjectConfig> = {};

    // Parse schema field using Zod
    const schemaField = z.string().min(1);
    const schemaResult = schemaField.safeParse(raw.schema);
    if (schemaResult.success) {
      config.schema = schemaResult.data;
    } else if (raw.schema !== undefined) {
      console.warn(`Invalid 'schema' field in config (must be non-empty string)`);
    }

    // Parse context field with size limit
    if (raw.context !== undefined) {
      const contextField = z.string();
      const contextResult = contextField.safeParse(raw.context);

      if (contextResult.success) {
        const contextSize = Buffer.byteLength(contextResult.data, 'utf-8');
        if (contextSize > MAX_CONTEXT_SIZE) {
          console.warn(
            `Context too large (${(contextSize / 1024).toFixed(1)}KB, limit: ${MAX_CONTEXT_SIZE / 1024}KB)`
          );
          console.warn(`Ignoring context field`);
        } else {
          config.context = contextResult.data;
        }
      } else {
        console.warn(`Invalid 'context' field in config (must be string)`);
      }
    }

    // Parse rules field using Zod
    if (raw.rules !== undefined) {
      const rulesField = z.record(z.string(), z.array(z.string()));

      // First check if it's an object structure (guard against null since typeof null === 'object')
      if (typeof raw.rules === 'object' && raw.rules !== null && !Array.isArray(raw.rules)) {
        const parsedRules: Record<string, string[]> = {};
        let hasValidRules = false;

        for (const [artifactId, rules] of Object.entries(raw.rules)) {
          const rulesArrayResult = z.array(z.string()).safeParse(rules);

          if (rulesArrayResult.success) {
            // Filter out empty strings
            const validRules = rulesArrayResult.data.filter((r) => r.length > 0);
            if (validRules.length > 0) {
              parsedRules[artifactId] = validRules;
              hasValidRules = true;
            }
            if (validRules.length < rulesArrayResult.data.length) {
              console.warn(
                `Some rules for '${artifactId}' are empty strings, ignoring them`
              );
            }
          } else {
            console.warn(
              `Rules for '${artifactId}' must be an array of strings, ignoring this artifact's rules`
            );
          }
        }

        if (hasValidRules) {
          config.rules = parsedRules;
        }
      } else {
        console.warn(`Invalid 'rules' field in config (must be object)`);
      }
    }

    // Parse models field (D5 hint garnish): string values only; anything else is
    // silently inert — the map is garnish, never an error source.
    if (raw.models !== undefined && typeof raw.models === 'object' && raw.models !== null && !Array.isArray(raw.models)) {
      const models: Record<string, string> = {};
      for (const [key, value] of Object.entries(raw.models)) {
        if (typeof value === 'string') models[key] = value;
      }
      if (Object.keys(models).length > 0) config.models = models;
    }

    // Parse pr field (D6 PR-lifecycle regime): a SCALAR with three recognized values.
    // Every failure path is INERT — treated as `never` with a one-line warning — because
    // the key is config garnish and a typo must never stop a lifecycle command. Only an
    // ABSENT key is silent. A bare `pr:` with no value parses to null: the key is PRESENT
    // but unusable, so it takes the same inert path with a warning naming it as empty —
    // a blank key is most likely a half-finished edit, and silently disabling every PR
    // seam is exactly the undocumented exception the closed set forbids.
    if (raw.pr !== undefined) {
      if (raw.pr === null) {
        console.warn(
          `Empty 'pr' field in config: the key is present with no value (expected ${PR_MODES.join(' | ')}); treating as 'never'`
        );
      } else if (typeof raw.pr === 'object') {
        // Non-scalar shape — a map or list where a scalar is expected. Includes the
        // superseded two-key `{open, program-branches}` block an early adopter may carry.
        const shape = Array.isArray(raw.pr) ? 'list' : 'map';
        console.warn(
          `Invalid 'pr' field in config: expected a scalar (${PR_MODES.join(' | ')}), got a ${shape}; treating as 'never'`
        );
      } else {
        const prResult = z.enum(PR_MODES).safeParse(raw.pr);
        if (prResult.success) {
          config.pr = prResult.data;
        } else {
          console.warn(
            `Unrecognized 'pr' value in config: '${String(raw.pr)}' (expected ${PR_MODES.join(' | ')}); treating as 'never'`
          );
        }
      }
    }

    // Return partial config even if some fields failed
    return Object.keys(config).length > 0 ? (config as ProjectConfig) : null;
  } catch (error) {
    console.warn(`Failed to parse orbit/config.yaml:`, error);
    return null;
  }
}

/**
 * Validate artifact IDs in rules against a schema's artifacts.
 * Called during instruction loading (when schema is known).
 * Returns warnings for unknown artifact IDs.
 *
 * @param rules - The rules object from config
 * @param validArtifactIds - Set of valid artifact IDs from the schema
 * @param schemaName - Name of the schema for error messages
 * @returns Array of warning messages for unknown artifact IDs
 */
export function validateConfigRules(
  rules: Record<string, string[]>,
  validArtifactIds: Set<string>,
  schemaName: string
): string[] {
  const warnings: string[] = [];

  for (const artifactId of Object.keys(rules)) {
    if (!validArtifactIds.has(artifactId)) {
      const validIds = Array.from(validArtifactIds).sort().join(', ');
      warnings.push(
        `Unknown artifact ID in rules: "${artifactId}". ` +
          `Valid IDs for schema "${schemaName}": ${validIds}`
      );
    }
  }

  return warnings;
}

/**
 * Suggest valid schema names when user provides invalid schema.
 * Uses fuzzy matching to find similar names.
 *
 * @param invalidSchemaName - The invalid schema name from config
 * @param availableSchemas - List of available schemas with their type (built-in or project-local)
 * @returns Error message with suggestions and available schemas
 */
export function suggestSchemas(
  invalidSchemaName: string,
  availableSchemas: { name: string; isBuiltIn: boolean }[]
): string {
  // Simple fuzzy match: Levenshtein distance
  function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Find closest matches (distance <= 3)
  const suggestions = availableSchemas
    .map((s) => ({ ...s, distance: levenshtein(invalidSchemaName, s.name) }))
    .filter((s) => s.distance <= 3)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const builtIn = availableSchemas.filter((s) => s.isBuiltIn).map((s) => s.name);
  const projectLocal = availableSchemas.filter((s) => !s.isBuiltIn).map((s) => s.name);

  let message = `Schema '${invalidSchemaName}' not found in orbit/config.yaml\n\n`;

  if (suggestions.length > 0) {
    message += `Did you mean one of these?\n`;
    suggestions.forEach((s) => {
      const type = s.isBuiltIn ? 'built-in' : 'project-local';
      message += `  - ${s.name} (${type})\n`;
    });
    message += '\n';
  }

  message += `Available schemas:\n`;
  if (builtIn.length > 0) {
    message += `  Built-in: ${builtIn.join(', ')}\n`;
  }
  if (projectLocal.length > 0) {
    message += `  Project-local: ${projectLocal.join(', ')}\n`;
  } else {
    message += `  Project-local: (none found)\n`;
  }

  message += `\nFix: Edit orbit/config.yaml and change 'schema: ${invalidSchemaName}' to a valid schema name`;

  return message;
}
