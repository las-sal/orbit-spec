import * as fs from 'node:fs';
import * as path from 'node:path';
import { getSchemaDir, resolveSchema } from './resolver.js';
import { ArtifactGraph } from './graph.js';
import { detectCompleted } from './state.js';
import { normalizeGates } from './schema.js';
import { computeGateStates, passedFrontierHoldsUnwalked } from './gates.js';
import { resolveSchemaForChange } from '../../utils/change-metadata.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import { readProjectConfig, validateConfigRules } from '../project-config.js';
// Session-level cache for validation warnings (avoid repeating same warnings)
const shownWarnings = new Set();
/**
 * Error thrown when loading a template fails.
 */
export class TemplateLoadError extends Error {
    templatePath;
    constructor(message, templatePath) {
        super(message);
        this.templatePath = templatePath;
        this.name = 'TemplateLoadError';
    }
}
/**
 * Loads a template from a schema's templates directory.
 *
 * @param schemaName - Schema name (e.g., "spec-driven")
 * @param templatePath - Relative path within the templates directory (e.g., "proposal.md")
 * @param projectRoot - Optional project root for project-local schema resolution
 * @returns The template content
 * @throws TemplateLoadError if the template cannot be loaded
 */
export function loadTemplate(schemaName, templatePath, projectRoot) {
    const schemaDir = getSchemaDir(schemaName, projectRoot);
    if (!schemaDir) {
        throw new TemplateLoadError(`Schema '${schemaName}' not found`, templatePath);
    }
    const templatePathOnDisk = path.join(schemaDir, 'templates', templatePath);
    if (!fs.existsSync(templatePathOnDisk)) {
        throw new TemplateLoadError(`Template not found: ${templatePathOnDisk}`, templatePathOnDisk);
    }
    const fullPath = FileSystemUtils.canonicalizeExistingPath(templatePathOnDisk);
    try {
        return fs.readFileSync(fullPath, 'utf-8');
    }
    catch (err) {
        const ioError = err instanceof Error ? err : new Error(String(err));
        throw new TemplateLoadError(`Failed to read template: ${ioError.message}`, fullPath);
    }
}
/**
 * Loads change context combining graph and completion state.
 *
 * Schema resolution order:
 * 1. Explicit schemaName parameter (if provided)
 * 2. Schema from .openspec.yaml metadata (if exists in change directory)
 * 3. Default 'spec-driven'
 *
 * @param projectRoot - Project root directory
 * @param changeName - Change name
 * @param schemaName - Optional schema name override. If not provided, auto-detected from metadata.
 * @returns Change context with graph, completed set, and metadata
 */
export function loadChangeContext(projectRoot, changeName, schemaName) {
    const changeDir = FileSystemUtils.canonicalizeExistingPath(path.join(projectRoot, 'orbit', 'changes', changeName));
    // Resolve schema: explicit > metadata > default
    const resolvedSchemaName = resolveSchemaForChange(changeDir, schemaName);
    const schema = resolveSchema(resolvedSchemaName, projectRoot);
    const graph = ArtifactGraph.fromSchema(schema);
    const completed = detectCompleted(graph, changeDir);
    return {
        graph,
        schema,
        completed,
        schemaName: resolvedSchemaName,
        changeName,
        changeDir,
        projectRoot,
    };
}
/**
 * Generates enriched instructions for creating an artifact.
 *
 * Instruction injection order:
 * 1. <context> - Project context from config (if present)
 * 2. <rules> - Artifact-specific rules from config (if present)
 * 3. <template> - Schema's template content
 *
 * @param context - Change context
 * @param artifactId - Artifact ID to generate instructions for
 * @param projectRoot - Project root directory (for reading config)
 * @returns Enriched artifact instructions
 * @throws Error if artifact not found
 */
export function generateInstructions(context, artifactId, projectRoot) {
    const artifact = context.graph.getArtifact(artifactId);
    if (!artifact) {
        throw new Error(`Artifact '${artifactId}' not found in schema '${context.schemaName}'`);
    }
    const templateContent = loadTemplate(context.schemaName, artifact.template, context.projectRoot);
    const dependencies = getDependencyInfo(artifact, context.graph, context.completed);
    const unlocks = getUnlockedArtifacts(context.graph, artifactId);
    // Use projectRoot from context if not explicitly provided
    const effectiveProjectRoot = projectRoot ?? context.projectRoot;
    // Try to read project config for context and rules
    let projectConfig = null;
    if (effectiveProjectRoot) {
        try {
            projectConfig = readProjectConfig(effectiveProjectRoot);
        }
        catch {
            // If config read fails, continue without config
        }
    }
    // Validate rules artifact IDs if config has rules (only once per session)
    if (projectConfig?.rules) {
        const validArtifactIds = new Set(context.graph.getAllArtifacts().map((a) => a.id));
        const warnings = validateConfigRules(projectConfig.rules, validArtifactIds, context.schemaName);
        // Show each unique warning only once per session
        for (const warning of warnings) {
            if (!shownWarnings.has(warning)) {
                console.warn(warning);
                shownWarnings.add(warning);
            }
        }
    }
    // Extract context and rules as separate fields (not prepended to template)
    const configContext = projectConfig?.context?.trim() || undefined;
    const rulesForArtifact = projectConfig?.rules?.[artifactId];
    const configRules = rulesForArtifact && rulesForArtifact.length > 0 ? rulesForArtifact : undefined;
    return {
        changeName: context.changeName,
        artifactId: artifact.id,
        schemaName: context.schemaName,
        changeDir: context.changeDir,
        outputPath: artifact.generates,
        description: artifact.description,
        instruction: artifact.instruction,
        context: configContext,
        rules: configRules,
        template: templateContent,
        dependencies,
        unlocks,
    };
}
/**
 * Gets dependency info including paths and descriptions.
 */
function getDependencyInfo(artifact, graph, completed) {
    return artifact.requires.map(id => {
        const depArtifact = graph.getArtifact(id);
        return {
            id,
            done: completed.has(id),
            path: depArtifact?.generates ?? id,
            description: depArtifact?.description ?? '',
        };
    });
}
/**
 * Gets artifacts that become available after completing the given artifact.
 */
function getUnlockedArtifacts(graph, artifactId) {
    const unlocks = [];
    for (const artifact of graph.getAllArtifacts()) {
        if (artifact.requires.includes(artifactId)) {
            unlocks.push(artifact.id);
        }
    }
    return unlocks.sort();
}
/**
 * Formats the status of all artifacts in a change.
 *
 * @param context - Change context
 * @returns Formatted change status
 */
export function formatChangeStatus(context, overlay) {
    // Derive apply-phase requires from the normalized `apply` gate (folds the
    // upstream `apply:` block or a declared tracked gate; C1).
    const schema = context.schema;
    const applyGate = normalizeGates(schema).find(g => g.id === 'apply');
    const applyRequires = applyGate?.requires ?? schema.artifacts.map(a => a.id);
    const artifacts = context.graph.getAllArtifacts();
    const ready = new Set(context.graph.getNextArtifacts(context.completed));
    const blocked = context.graph.getBlocked(context.completed);
    const artifactStatuses = artifacts.map(artifact => {
        if (context.completed.has(artifact.id)) {
            return {
                id: artifact.id,
                outputPath: artifact.generates,
                status: 'done',
            };
        }
        if (ready.has(artifact.id)) {
            return {
                id: artifact.id,
                outputPath: artifact.generates,
                status: 'ready',
            };
        }
        return {
            id: artifact.id,
            outputPath: artifact.generates,
            status: 'blocked',
            missingDeps: blocked[artifact.id] ?? [],
        };
    });
    // Sort by build order for consistent output
    const buildOrder = context.graph.getBuildOrder();
    const orderMap = new Map(buildOrder.map((id, idx) => [id, idx]));
    artifactStatuses.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    // C1: compute gate rows + position readout. Empty/undefined for ungated schemas.
    const hasGates = (context.schema.gates && context.schema.gates.length > 0) || !!context.schema.apply;
    let gateRows = [];
    let position;
    let nextCommand;
    let nextHintKeys;
    if (hasGates) {
        const computation = computeGateStates(context.schema, context.changeName, context.changeDir, context.completed, overlay);
        gateRows = computation.gates.map(g => ({
            id: g.id,
            kind: g.kind,
            state: g.state,
            reason: g.reason,
            checked: g.checked,
            total: g.total,
            nextCommand: g.nextCommand,
            consent: g.consent,
            superseded: g.superseded,
            userValidationPending: g.userValidationPending,
            // rc02c: OPTIONAL fields are spread conditionally, never emitted as undefined-valued keys.
            // `Object.hasOwn(row, 'budget')` must be false on a gate that declares none — JSON hides an
            // undefined value, but an in-process consumer of this exported function does not.
            ...(g.budget !== undefined ? { budget: g.budget } : {}),
            ...(g.independentSpend !== undefined ? { independentSpend: g.independentSpend } : {}),
            ...(g.deferredSuggestions !== undefined ? { deferredSuggestions: g.deferredSuggestions } : {}),
            ...(g.unresolvedPasses !== undefined ? { unresolvedPasses: g.unresolvedPasses } : {}),
            ...(g.unwalkedPasses !== undefined ? { unwalkedPasses: g.unwalkedPasses } : {}),
            ...(g.openPair !== undefined ? { openPair: g.openPair } : {}),
        }));
        position = computation.position;
        // D1: entry into the apply phase carries the ` — user-invoked` marker when the
        // gate declaring `before: apply` is consent-marked (eligibility phrasing).
        const applyConsentMarked = computation.gates.some(g => g.before === 'apply' && g.consent === 'user-invoked');
        for (const g of computation.gates) {
            if (g.state === 'passed') {
                // rc18 (D1): the SAME predicate that set the row's walk. A passed gate's command is taken
                // only on it, never because the row carries one (a passed `review-proposal` carries
                // `/orbit:apply`, which would name apply again after apply passed).
                if (passedFrontierHoldsUnwalked(g, computation.gates)) {
                    nextCommand = `/orbit:address-reviews ${context.changeName}`;
                    nextHintKeys = { phase: g.id };
                    break;
                }
                continue;
            }
            // C1: skip a reviewed gate whose gated phase already ran (moot) — the frontier
            // has advanced past it, so it must not drive the canonical next command.
            if (g.superseded)
                continue;
            if (g.nextCommand) {
                nextCommand = g.nextCommand;
                nextHintKeys = { phase: g.id, slot: g.nextSlot };
                break;
            }
            if (g.kind === 'tracked' && g.state === 'ready') {
                nextCommand =
                    `/orbit:apply ${context.changeName}` + (applyConsentMarked ? ' — user-invoked' : '');
                nextHintKeys = { phase: g.id };
                break;
            }
        }
        // Single-voiced canonical-next: ONE command per change state — including the
        // all-gates-passed state, where no unpassed gate supplies one. Fall through to
        // the flow-latest PASSED gate's before-phase command (e.g. review-system passed
        // → `/orbit:archive <name> — user-invoked`), so the eligibility line never goes
        // silent at exactly the lifecycle seam.
        if (!nextCommand) {
            for (const g of [...computation.gates].reverse()) {
                if (g.state === 'passed' && g.nextCommand) {
                    nextCommand = g.nextCommand;
                    nextHintKeys = g.before ? { phase: g.before } : { phase: g.id };
                    break;
                }
            }
        }
    }
    return {
        changeName: context.changeName,
        schemaName: context.schemaName,
        isComplete: context.graph.isComplete(context.completed),
        applyRequires,
        artifacts: artifactStatuses,
        gates: gateRows,
        position,
        next_command: nextCommand,
        next_hint_keys: nextHintKeys,
    };
}
//# sourceMappingURL=instruction-loader.js.map