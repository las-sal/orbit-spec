import { z } from 'zod';
import { checkRunnerShape, EXTERNAL_RUNNER_FIELD } from './external-runner.js';

/**
 * Zod schema for global OpenSpec configuration.
 * Uses passthrough() to preserve unknown fields for forward compatibility.
 */
export const GlobalConfigSchema = z
  .object({
    featureFlags: z
      .record(z.string(), z.boolean())
      .optional()
      .default({}),
    profile: z
      .enum(['core', 'custom'])
      .optional()
      .default('core'),
    delivery: z
      .enum(['both', 'skills', 'commands'])
      .optional()
      .default('both'),
    workflows: z
      .array(z.string())
      .optional(),
    // rc17d: the shape is checked by `checkRunnerShape` (the shape table's one implementation), not here.
    externalRunner: z.unknown().optional(),
  })
  .passthrough();

export type GlobalConfigType = z.infer<typeof GlobalConfigSchema>;

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: GlobalConfigType = {
  featureFlags: {},
  profile: 'core',
  delivery: 'both',
};

const KNOWN_TOP_LEVEL_KEYS = new Set([...Object.keys(DEFAULT_CONFIG), 'workflows', EXTERNAL_RUNNER_FIELD]);

/**
 * Validate a config key path for CLI set operations.
 * Unknown top-level keys are rejected unless explicitly allowed by the caller.
 */
export function validateConfigKeyPath(path: string): { valid: boolean; reason?: string } {
  const rawKeys = path.split('.');

  if (rawKeys.length === 0 || rawKeys.some((key) => key.trim() === '')) {
    return { valid: false, reason: 'Key path must not be empty' };
  }

  const rootKey = rawKeys[0];
  if (!KNOWN_TOP_LEVEL_KEYS.has(rootKey)) {
    return { valid: false, reason: `Unknown top-level key "${rootKey}"` };
  }

  if (rootKey === 'featureFlags') {
    if (rawKeys.length > 2) {
      return { valid: false, reason: 'featureFlags values are booleans and do not support nested keys' };
    }
    return { valid: true };
  }

  // rc17d: exactly one nested path — an own argv is an array, which `config set` cannot write.
  if (rootKey === EXTERNAL_RUNNER_FIELD && rawKeys.length > 1) {
    if (rawKeys.length === 2 && rawKeys[1] === 'preset') {
      return { valid: true };
    }
    return { valid: false, reason: `"${EXTERNAL_RUNNER_FIELD}" admits one nested key, "${EXTERNAL_RUNNER_FIELD}.preset"` };
  }

  if (rawKeys.length > 1) {
    return { valid: false, reason: `"${rootKey}" does not support nested keys` };
  }

  return { valid: true };
}

/**
 * Get a nested value from an object using dot notation.
 *
 * @param obj - The object to access
 * @param path - Dot-separated path (e.g., "featureFlags.someFlag")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Set a nested value in an object using dot notation.
 * Creates intermediate objects as needed.
 *
 * @param obj - The object to modify (mutated in place)
 * @param path - Dot-separated path (e.g., "featureFlags.someFlag")
 * @param value - The value to set
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * Delete a nested value from an object using dot notation.
 *
 * @param obj - The object to modify (mutated in place)
 * @param path - Dot-separated path (e.g., "featureFlags.someFlag")
 * @returns true if the key existed and was deleted, false otherwise
 */
export function deleteNestedValue(obj: Record<string, unknown>, path: string): boolean {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      return false;
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  return false;
}

/**
 * Coerce a string value to its appropriate type.
 * - "true" / "false" -> boolean
 * - Numeric strings -> number
 * - Everything else -> string
 *
 * @param value - The string value to coerce
 * @param forceString - If true, always return the value as a string
 * @returns The coerced value
 */
export function coerceValue(value: string, forceString: boolean = false): string | number | boolean {
  if (forceString) {
    return value;
  }

  // Boolean coercion
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  // Number coercion - must be a valid finite number
  const num = Number(value);
  if (!isNaN(num) && isFinite(num) && value.trim() !== '') {
    return num;
  }

  return value;
}

/**
 * Format a value for YAML-like display.
 *
 * @param value - The value to format
 * @param indent - Current indentation level
 * @returns Formatted string
 */
export function formatValueYaml(value: unknown, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);

  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    return value.map((item) => `${indentStr}- ${formatValueYaml(item, indent + 1)}`).join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }
    return entries
      .map(([key, val]) => {
        const formattedVal = formatValueYaml(val, indent + 1);
        if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) {
          return `${indentStr}${key}:\n${formattedVal}`;
        }
        return `${indentStr}${key}: ${formattedVal}`;
      })
      .join('\n');
  }

  return String(value);
}

/**
 * Validate a configuration object against the schema.
 *
 * @param config - The configuration to validate
 * @returns Validation result with success status and optional error message
 */
export function validateConfig(config: unknown): { success: boolean; error?: string } {
  try {
    GlobalConfigSchema.parse(config);
    // rc17d: the runner record's shape is part of the whole-config validation, so a `set` whose merged
    // result is a refused shape (`preset` over a recorded `argv`) is refused before anything is written.
    if (config !== null && typeof config === 'object' && EXTERNAL_RUNNER_FIELD in config) {
      const shape = checkRunnerShape((config as Record<string, unknown>)[EXTERNAL_RUNNER_FIELD]);
      if (!shape.ok) {
        return {
          success: false,
          error: `${EXTERNAL_RUNNER_FIELD} ${shape.reason}. To switch forms or clear a malformed record, run \`orbit config unset ${EXTERNAL_RUNNER_FIELD}\` first.`,
        };
      }
    }
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const messages = zodError.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: messages.join('; ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
