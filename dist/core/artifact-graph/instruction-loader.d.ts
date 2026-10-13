import { ArtifactGraph } from './graph.js';
import type { TrailOverlay } from './trail.js';
import type { CompletedSet, SchemaYaml } from './types.js';
/**
 * Error thrown when loading a template fails.
 */
export declare class TemplateLoadError extends Error {
    readonly templatePath: string;
    constructor(message: string, templatePath: string);
}
/**
 * Change context containing graph, completion state, and metadata.
 */
export interface ChangeContext {
    /** The artifact dependency graph */
    graph: ArtifactGraph;
    /** The resolved schema (includes any gates). */
    schema: SchemaYaml;
    /** Set of completed artifact IDs */
    completed: CompletedSet;
    /** Schema name being used */
    schemaName: string;
    /** Change name */
    changeName: string;
    /** Path to the change directory */
    changeDir: string;
    /** Project root directory */
    projectRoot: string;
}
/**
 * Enriched instructions for creating an artifact.
 */
export interface ArtifactInstructions {
    /** Change name */
    changeName: string;
    /** Artifact ID */
    artifactId: string;
    /** Schema name */
    schemaName: string;
    /** Full path to change directory */
    changeDir: string;
    /** Output path pattern (e.g., "proposal.md") */
    outputPath: string;
    /** Artifact description */
    description: string;
    /** Guidance on how to create this artifact (from schema instruction field) */
    instruction: string | undefined;
    /** Project context from config (constraints/background for AI, not to be included in output) */
    context: string | undefined;
    /** Artifact-specific rules from config (constraints for AI, not to be included in output) */
    rules: string[] | undefined;
    /** Template content (structure to follow - this IS the output format) */
    template: string;
    /** Dependencies with completion status and paths */
    dependencies: DependencyInfo[];
    /** Artifacts that become available after completing this one */
    unlocks: string[];
}
/**
 * Dependency information including path and description.
 */
export interface DependencyInfo {
    /** Artifact ID */
    id: string;
    /** Whether the dependency is completed */
    done: boolean;
    /** Relative output path of the dependency (e.g., "proposal.md") */
    path: string;
    /** Description of the dependency artifact */
    description: string;
}
/**
 * Status of a single artifact in the workflow.
 */
export interface ArtifactStatus {
    /** Artifact ID */
    id: string;
    /** Output path pattern */
    outputPath: string;
    /** Status: done, ready, or blocked */
    status: 'done' | 'ready' | 'blocked';
    /** Missing dependencies (only for blocked) */
    missingDeps?: string[];
}
/**
 * Formatted change status.
 */
export interface ChangeStatus {
    /** Change name */
    changeName: string;
    /** Schema name */
    schemaName: string;
    /** Whether all artifacts are complete */
    isComplete: boolean;
    /** Artifact IDs required before apply phase (from schema's apply.requires) */
    applyRequires: string[];
    /** Status of each artifact */
    artifacts: ArtifactStatus[];
    /** C1: computed gate rows (empty for ungated schemas). */
    gates: GateStatusRow[];
    /** C1: one-line position readout of the canonical flow (undefined for ungated schemas). */
    position?: string;
    /** D5 hint garnish: the keys (phase id + covered slot) driving next_command. */
    next_hint_keys?: {
        phase?: string;
        slot?: string;
    };
    /** C1: the single canonical next command for the current state, if any. */
    next_command?: string;
}
/** A gate row surfaced in status (C1). */
export interface GateStatusRow {
    id: string;
    kind: string;
    state: string;
    reason?: string;
    checked?: number;
    total?: number;
    nextCommand?: string;
    /** D1: consent marker from the gate declaration (entry into `before:` is user-invoked). */
    consent?: string;
    /** C1: the gate's `before` phase already ran — moot / no longer the frontier. */
    superseded?: boolean;
    /** D5 subset rule: unchecked user-validation handoff ids when the tracked gate passed-for-flow. */
    userValidationPending?: string[];
    /** rc02c: the inert DECLARATION (present only when declared) and the RECORDED COST. The
     *  trigger count and the exhaustion annotation are retired.
     *  This projection is field-by-field and EXPLICIT: a new gate-status field reaches JSON only by
     *  being named here. The human gate row is an INDEPENDENT surface with its own rules — rc02c
     *  deliberately splits them, so `budget` is projected here while the terminal row renders the
     *  recorded spend ALONE. Do NOT reintroduce a rule requiring a field to appear on both. */
    budget?: number;
    independentSpend?: number;
    /** rc02: reported, never blocking. */
    deferredSuggestions?: number;
    /** rc08b: every outstanding pass (`[]` when none; absent on a blocked gate), and the open pair. */
    unresolvedPasses?: Array<{
        token: string;
        file: string;
        mode: string | null;
        source: string;
    }>;
    /** rc17a: unwalked passes carrying any finding — the discovery set beside the hold. */
    unwalkedPasses?: Array<{
        token: string;
        file: string;
        mode: string | null;
        source: string;
    }>;
    openPair?: {
        missing: string;
    };
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
export declare function loadTemplate(schemaName: string, templatePath: string, projectRoot?: string): string;
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
export declare function loadChangeContext(projectRoot: string, changeName: string, schemaName?: string): ChangeContext;
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
export declare function generateInstructions(context: ChangeContext, artifactId: string, projectRoot?: string): ArtifactInstructions;
/**
 * Formats the status of all artifacts in a change.
 *
 * @param context - Change context
 * @returns Formatted change status
 */
export declare function formatChangeStatus(context: ChangeContext, overlay?: TrailOverlay): ChangeStatus;
//# sourceMappingURL=instruction-loader.d.ts.map