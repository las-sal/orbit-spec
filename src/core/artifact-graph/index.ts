// Types
export {
  ArtifactSchema,
  SchemaYamlSchema,
  GateSchema,
  type Artifact,
  type SchemaYaml,
  type Gate,
  type NormalizedGate,
  type GateKind,
  type GateConfirm,
  type CadenceEntry,
  type CompletedSet,
  type BlockedArtifacts,
} from './types.js';

// Schema loading and validation
export { loadSchema, parseSchema, normalizeGates, SchemaValidationError } from './schema.js';

// Gate model (C1): trail reader + gate-state computation
export {
  readTrail,
  parseTsToken,
  type Trail,
  type TrailPass,
  type TrailResolution,
  type TrailFinding,
  type ReviewMode,
  type ReviewerClass,
} from './trail.js';
export {
  computeGateStates,
  isPassStale,
  type GateState,
  type GateStatus,
  type GateComputation,
} from './gates.js';

// Graph operations
export { ArtifactGraph } from './graph.js';

// State detection
export { detectCompleted } from './state.js';
export { artifactOutputExists, isGlobPattern, resolveArtifactOutputs } from './outputs.js';

// Schema resolution
export {
  resolveSchema,
  listSchemas,
  listSchemasWithInfo,
  getSchemaDir,
  getPackageSchemasDir,
  getUserSchemasDir,
  SchemaLoadError,
  type SchemaInfo,
} from './resolver.js';

// Instruction loading
export {
  loadTemplate,
  loadChangeContext,
  generateInstructions,
  formatChangeStatus,
  TemplateLoadError,
  type ChangeContext,
  type ArtifactInstructions,
  type DependencyInfo,
  type ArtifactStatus,
  type ChangeStatus,
} from './instruction-loader.js';
