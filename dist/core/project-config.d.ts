import { z } from 'zod';
import { type SizeCeiling } from './change-size.js';
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
export declare const ProjectConfigSchema: z.ZodObject<{
    schema: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
    rules: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
    models: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    pr: z.ZodOptional<z.ZodEnum<{
        never: "never";
        "per-proposal": "per-proposal";
        "per-architecture": "per-architecture";
    }>>;
    scenario_map: z.ZodOptional<z.ZodObject<{
        tests: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    review_preference: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<{
        "blind-pair": "blind-pair";
        fresh: "fresh";
        external: "external";
    }>>>;
    size_ceiling: z.ZodOptional<z.ZodObject<{
        capabilities: z.ZodOptional<z.ZodNumber>;
        requirements: z.ZodOptional<z.ZodNumber>;
        changed_bytes: z.ZodOptional<z.ZodNumber>;
        tasks: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
/** The closed set of recognized `pr:` values (per `orbit-pr-lifecycle`). */
export declare const PR_MODES: readonly ["never", "per-proposal", "per-architecture"];
export type PrMode = (typeof PR_MODES)[number];
/**
 * Resolve the effective PR regime for a project.
 *
 * Absent config, absent key, and every inert path (unrecognized value, non-scalar shape)
 * all resolve to `never` — the pre-capability behavior. Consumers call this rather than
 * reading `config.pr` directly, so "absent = never" is stated in exactly one place.
 */
export declare function resolvePrMode(config: ProjectConfig | null): PrMode;
/** The resolved scenario-map regime (per `orbit-scenario-map`'s opt-in requirement). */
export interface ScenarioMapConfig {
    check: 'on' | 'off';
    /** The configured globs when ON; empty when OFF (the surface then scans its default). */
    tests: string[];
}
/**
 * Resolve the `scenario_map` key, reading ONLY that key from `orbit/config.yaml` (design D6).
 *
 * Deliberately NOT built on `readProjectConfig`, which warns on every malformed field: validate
 * never read the config before this capability, and must not start printing `pr:` or `rules:`
 * warnings. Absent key, absent file and an unparseable file are silent OFF (the other config
 * readers own those warnings); every PRESENT-but-inert shape is OFF with exactly one warning
 * naming the shape, following the `pr:` key's inert rule.
 */
export declare function resolveScenarioMapConfig(projectRoot: string): ScenarioMapConfig;
/** The closed set of `review_preference` values (rc17a). */
export declare const REVIEW_PREFERENCES: readonly ["blind-pair", "fresh", "external"];
export type ReviewPreference = (typeof REVIEW_PREFERENCES)[number];
/**
 * Resolve the `review_preference` key for the given reviewed gates, reading ONLY that key from
 * `orbit/config.yaml` (rc17a design D6; the `resolveScenarioMapConfig` pattern, so no other field's
 * warning reaches the gate computation). Every gate resolves independently: absent map, absent entry,
 * absent file and an unparseable file resolve to `blind-pair` silently. A present but inert shape warns
 * once and is treated as absent: a non-map value is ignored whole; an entry with an unknown value
 * resolves to `blind-pair`, naming the gate and the value; an entry whose key names no reviewed gate of
 * the active schema is ignored, naming the key. The result shapes ONLY the presented command.
 */
export declare function resolveReviewPreference(projectRoot: string, reviewedGateIds: readonly string[]): Record<string, ReviewPreference>;
/**
 * Resolve the `size_ceiling` key, reading ONLY that key from `orbit/config.yaml` (rc09a design D2;
 * the `resolveReviewPreference` pattern, so no other field's warning reaches validate or status).
 * Returns `null` when the check is OFF — absent key, absent or unparseable file (silently), a
 * non-mapping value (one warning naming the shape), or a mapping with no valid entry — and otherwise
 * the valid entries. An unknown key warns naming the key; a value that is not a positive integer
 * warns naming the dimension and the value; each is ignored. The table is `orbit-change-size`'s
 * `The ceiling is opt-in by the size_ceiling config key`.
 */
export declare function resolveSizeCeiling(projectRoot: string): SizeCeiling | null;
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
export declare function readProjectConfig(projectRoot: string): ProjectConfig | null;
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
export declare function validateConfigRules(rules: Record<string, string[]>, validArtifactIds: Set<string>, schemaName: string): string[];
/**
 * Suggest valid schema names when user provides invalid schema.
 * Uses fuzzy matching to find similar names.
 *
 * @param invalidSchemaName - The invalid schema name from config
 * @param availableSchemas - List of available schemas with their type (built-in or project-local)
 * @returns Error message with suggestions and available schemas
 */
export declare function suggestSchemas(invalidSchemaName: string, availableSchemas: {
    name: string;
    isBuiltIn: boolean;
}[]): string;
//# sourceMappingURL=project-config.d.ts.map