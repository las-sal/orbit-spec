import { type SchemaYaml, type NormalizedGate } from './types.js';
export declare class SchemaValidationError extends Error {
    constructor(message: string);
}
/**
 * Loads and validates an artifact schema from a YAML file.
 */
export declare function loadSchema(filePath: string): SchemaYaml;
/**
 * Parses and validates an artifact schema from YAML content.
 */
export declare function parseSchema(yamlContent: string): SchemaYaml;
/**
 * Normalizes a schema's gates into a flat NormalizedGate[]: the upstream `apply:`
 * block is folded in as a `kind: tracked` gate (id `apply`) unless a declared gate
 * already claims that id; `inputs` defaults to `requires`; `confirm` still defaults to
 * `no-new-findings` but is INERT (rc02c retired clause (c)) — the default is kept so the
 * normalized shape stays stable for readers, not because anything consumes it.
 * This is the shape gate-state computation consumes. Pure.
 */
export declare function normalizeGates(schema: SchemaYaml): NormalizedGate[];
//# sourceMappingURL=schema.d.ts.map