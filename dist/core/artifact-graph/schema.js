import * as fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { SchemaYamlSchema, CADENCE_ENTRIES, LIFECYCLE_PHASE_TOKENS, CONSENT_VALUES, } from './types.js';
export class SchemaValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SchemaValidationError';
    }
}
/**
 * Loads and validates an artifact schema from a YAML file.
 */
export function loadSchema(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseSchema(content);
}
/**
 * Parses and validates an artifact schema from YAML content.
 */
export function parseSchema(yamlContent) {
    const parsed = parseYaml(yamlContent);
    // Validate with Zod
    const result = SchemaYamlSchema.safeParse(parsed);
    if (!result.success) {
        const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new SchemaValidationError(`Invalid schema: ${errors}`);
    }
    const schema = result.data;
    // Check for duplicate artifact IDs
    validateNoDuplicateIds(schema.artifacts);
    // Check that all requires references are valid
    validateRequiresReferences(schema.artifacts);
    // Check for cycles
    validateNoCycles(schema.artifacts);
    // Validate gates (C1): apply-normalization, closed kinds, references, cycles.
    // Runs whenever a `gates:` list or an `apply:` block is present.
    if ((schema.gates && schema.gates.length > 0) || schema.apply) {
        validateGates(schema);
    }
    return schema;
}
/**
 * Normalizes a schema's gates into a flat NormalizedGate[]: the upstream `apply:`
 * block is folded in as a `kind: tracked` gate (id `apply`) unless a declared gate
 * already claims that id; `inputs` defaults to `requires`; `confirm` still defaults to
 * `no-new-findings` but is INERT (rc02c retired clause (c)) — the default is kept so the
 * normalized shape stays stable for readers, not because anything consumes it.
 * This is the shape gate-state computation consumes. Pure.
 */
export function normalizeGates(schema) {
    const gates = [];
    const declaredGateIds = new Set((schema.gates ?? []).map(g => g.id));
    for (const g of schema.gates ?? []) {
        const requires = g.requires ?? [];
        gates.push({
            id: g.id,
            kind: g.kind,
            requires,
            tracks: g.tracks ?? null,
            inputs: g.inputs ?? requires,
            cadence: (g.cadence ?? []),
            ...(g.budget === undefined ? {} : { budget: g.budget }),
            confirm: (g.confirm ?? 'no-new-findings'),
            before: g.before,
            consent: g.consent,
            instruction: g.instruction,
        });
    }
    // Upstream `apply:` sugar → tracked gate (unless a declared gate already claims `apply`).
    if (schema.apply && !declaredGateIds.has('apply')) {
        gates.push({
            id: 'apply',
            kind: 'tracked',
            requires: schema.apply.requires,
            tracks: schema.apply.tracks ?? null,
            inputs: [],
            cadence: [],
            confirm: 'no-new-findings',
            instruction: schema.apply.instruction,
        });
    }
    return gates;
}
/**
 * Validates the gates list: double-apply-declaration, unique/non-colliding ids,
 * closed kind set (naming the gate id), reviewed-gate cadence presence, and
 * requires/inputs/before references + cycles across the combined artifact+gate graph.
 */
function validateGates(schema) {
    const rawGates = schema.gates ?? [];
    const artifactIds = new Set(schema.artifacts.map(a => a.id));
    // Double apply declaration: an `apply:` block AND a gate with id `apply`.
    if (schema.apply && rawGates.some(g => g.id === 'apply')) {
        throw new SchemaValidationError(`Schema declares both an 'apply:' block and a gate with id 'apply' (double declaration)`);
    }
    const seenGateIds = new Set();
    for (const g of rawGates) {
        if (seenGateIds.has(g.id)) {
            throw new SchemaValidationError(`Duplicate gate ID: ${g.id}`);
        }
        seenGateIds.add(g.id);
        if (artifactIds.has(g.id)) {
            throw new SchemaValidationError(`Gate ID '${g.id}' collides with an artifact ID of the same name`);
        }
        if (g.kind !== 'tracked' && g.kind !== 'reviewed') {
            throw new SchemaValidationError(`Gate '${g.id}': invalid kind '${g.kind}' (allowed: tracked, reviewed)`);
        }
        // rc02: name the GATE ID for both new fields. The Zod enum names an INDEX
        // (`gates.2.cadence.0`), while every surrounding error here names the gate.
        if (g.kind === 'reviewed' && g.cadence) {
            for (const entry of g.cadence) {
                if (!CADENCE_ENTRIES.includes(entry)) {
                    throw new SchemaValidationError(`Reviewed gate '${g.id}': unknown cadence entry '${entry}' (allowed: ${CADENCE_ENTRIES.join(', ')})`);
                }
            }
        }
        if (g.budget !== undefined && (!Number.isInteger(g.budget) || g.budget <= 0)) {
            throw new SchemaValidationError(`Gate '${g.id}': budget must be a positive integer (got ${g.budget})`);
        }
        if (g.kind === 'reviewed' && (!g.cadence || g.cadence.length === 0)) {
            throw new SchemaValidationError(`Reviewed gate '${g.id}': cadence must declare at least one slot (${CADENCE_ENTRIES.join(', ')})`);
        }
        // Consent vocabulary is a CLOSED set of one (D-arc D1) — name the gate id and
        // the single legal value, matching the kind-validation error shape.
        if (g.consent !== undefined && !CONSENT_VALUES.includes(g.consent)) {
            throw new SchemaValidationError(`Gate '${g.id}': invalid consent '${g.consent}' (allowed: ${CONSENT_VALUES.join(', ')})`);
        }
    }
    // Reference + cycle validation over the combined artifact + gate graph.
    const normalized = normalizeGates(schema);
    const gateIds = new Set(normalized.map(g => g.id));
    const allIds = new Set([...artifactIds, ...gateIds]);
    const lifecycle = new Set(LIFECYCLE_PHASE_TOKENS);
    for (const g of normalized) {
        for (const req of g.requires) {
            if (!allIds.has(req)) {
                throw new SchemaValidationError(`Gate '${g.id}': requires '${req}' which is not a declared artifact or gate`);
            }
        }
        for (const inp of g.inputs) {
            if (!allIds.has(inp)) {
                throw new SchemaValidationError(`Gate '${g.id}': inputs references '${inp}' which is not a declared artifact or gate`);
            }
        }
        if (g.before !== undefined && !allIds.has(g.before) && !lifecycle.has(g.before)) {
            throw new SchemaValidationError(`Gate '${g.id}': before '${g.before}' is not a declared gate/artifact id or a lifecycle phase (${LIFECYCLE_PHASE_TOKENS.join(', ')})`);
        }
    }
    validateNoCyclesWithGates(schema.artifacts, normalized);
}
/**
 * Cycle detection across the combined artifact + gate `requires` graph.
 */
function validateNoCyclesWithGates(artifacts, gates) {
    const deps = new Map();
    for (const a of artifacts)
        deps.set(a.id, a.requires ?? []);
    for (const g of gates)
        deps.set(g.id, g.requires ?? []);
    const visited = new Set();
    const inStack = new Set();
    const parent = new Map();
    function dfs(id) {
        visited.add(id);
        inStack.add(id);
        for (const dep of deps.get(id) ?? []) {
            if (!deps.has(dep))
                continue; // reference errors already reported above
            if (!visited.has(dep)) {
                parent.set(dep, id);
                const cycle = dfs(dep);
                if (cycle)
                    return cycle;
            }
            else if (inStack.has(dep)) {
                const cyclePath = [dep];
                let current = id;
                while (current !== dep) {
                    cyclePath.unshift(current);
                    current = parent.get(current);
                }
                cyclePath.unshift(dep);
                return cyclePath.join(' → ');
            }
        }
        inStack.delete(id);
        return null;
    }
    for (const id of deps.keys()) {
        if (!visited.has(id)) {
            const cycle = dfs(id);
            if (cycle) {
                throw new SchemaValidationError(`Cyclic dependency detected: ${cycle}`);
            }
        }
    }
}
/**
 * Validates that there are no duplicate artifact IDs.
 */
function validateNoDuplicateIds(artifacts) {
    const seen = new Set();
    for (const artifact of artifacts) {
        if (seen.has(artifact.id)) {
            throw new SchemaValidationError(`Duplicate artifact ID: ${artifact.id}`);
        }
        seen.add(artifact.id);
    }
}
/**
 * Validates that all `requires` references point to valid artifact IDs.
 */
function validateRequiresReferences(artifacts) {
    const validIds = new Set(artifacts.map(a => a.id));
    for (const artifact of artifacts) {
        for (const req of artifact.requires) {
            if (!validIds.has(req)) {
                throw new SchemaValidationError(`Invalid dependency reference in artifact '${artifact.id}': '${req}' does not exist`);
            }
        }
    }
}
/**
 * Validates that there are no cyclic dependencies.
 * Uses DFS to detect cycles and reports the full cycle path.
 */
function validateNoCycles(artifacts) {
    const artifactMap = new Map(artifacts.map(a => [a.id, a]));
    const visited = new Set();
    const inStack = new Set();
    const parent = new Map();
    function dfs(id) {
        visited.add(id);
        inStack.add(id);
        const artifact = artifactMap.get(id);
        if (!artifact)
            return null;
        for (const dep of artifact.requires) {
            if (!visited.has(dep)) {
                parent.set(dep, id);
                const cycle = dfs(dep);
                if (cycle)
                    return cycle;
            }
            else if (inStack.has(dep)) {
                // Found a cycle - reconstruct the path
                const cyclePath = [dep];
                let current = id;
                while (current !== dep) {
                    cyclePath.unshift(current);
                    current = parent.get(current);
                }
                cyclePath.unshift(dep);
                return cyclePath.join(' → ');
            }
        }
        inStack.delete(id);
        return null;
    }
    for (const artifact of artifacts) {
        if (!visited.has(artifact.id)) {
            const cycle = dfs(artifact.id);
            if (cycle) {
                throw new SchemaValidationError(`Cyclic dependency detected: ${cycle}`);
            }
        }
    }
}
//# sourceMappingURL=schema.js.map