import { z } from 'zod';

// Artifact definition schema
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID is required' }),
  generates: z.string().min(1, { error: 'generates field is required' }),
  description: z.string(),
  template: z.string().min(1, { error: 'template field is required' }),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});

// Apply phase configuration for schema-aware apply instructions
export const ApplyPhaseSchema = z.object({
  // Artifact IDs that must exist before apply is available
  requires: z.array(z.string()).min(1, { error: 'At least one required artifact' }),
  // Path to file with checkboxes for progress (relative to change dir), or null if no tracking
  tracks: z.string().nullable().optional(),
  // Custom guidance for the apply phase
  instruction: z.string().optional(),
});

// Gate declaration (C1 engine gates). The `kind` set is CLOSED — the two kinds
// (`tracked`, `reviewed`) are the extension surface; there is no generic
// pass-condition plugin. See spec: orbit-engine-gates "Gate declaration in schema YAML".
export const GateKindSchema = z.enum(['tracked', 'reviewed']);

// Reviewed-gate confirm predicate (clause (c) selector). CLOSED set.
export const GateConfirmSchema = z.enum(['no-new-findings', 'findings-resolved']);

// Cadence-entry vocabulary: the three reviewer classes plus the cadence-only
// meta-class `independent` (satisfied by a `fresh` OR `external` pass; never
// `in-context`). `independent` is NOT a value the `reviewer_class` emit field carries.
export const CADENCE_ENTRIES = ['in-context', 'fresh', 'external', 'independent'] as const;
export const CadenceEntrySchema = z.enum(CADENCE_ENTRIES);

// Lifecycle-phase tokens that a gate's `before` may target (in addition to a
// declared gate/artifact id).
export const LIFECYCLE_PHASE_TOKENS = ['apply', 'archive'] as const;

export const GateSchema = z.object({
  id: z.string().min(1, { error: 'Gate ID is required' }),
  // Validated against the closed set in schema.ts so the error can name the gate id.
  kind: z.string().min(1, { error: 'Gate kind is required' }),
  // Artifact and/or gate ids that must be complete/passed before the gate is runnable
  requires: z.array(z.string()).default([]),
  // tracked kind: checkbox file (relative to change dir)
  tracks: z.string().nullable().optional(),
  // reviewed kind: freshness scope (artifact ids whose change invalidates a pass; defaults to `requires`)
  inputs: z.array(z.string()).optional(),
  // reviewed kind: ordered slot list (cadence-entry vocabulary)
  cadence: z.array(CadenceEntrySchema).optional(),
  // reviewed kind: independent-confirmation predicate (defaults to `no-new-findings`)
  confirm: GateConfirmSchema.optional(),
  // Target this gate blocks: a declared gate id, a declared artifact id, or a lifecycle-phase token
  before: z.string().optional(),
  instruction: z.string().optional(),
});

// Full schema YAML structure
export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name is required' }),
  version: z.number().int().positive({ error: 'Version must be a positive integer' }),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: 'At least one artifact required' }),
  // Optional apply phase configuration (upstream sugar; normalized into a tracked gate).
  apply: ApplyPhaseSchema.optional(),
  // Optional gates list (C1). When present, gate ids participate in the same
  // duplicate/reference/cycle validation as artifact ids.
  gates: z.array(GateSchema).optional(),
});

// Derived TypeScript types
export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type GateKind = z.infer<typeof GateKindSchema>;
export type GateConfirm = z.infer<typeof GateConfirmSchema>;
export type CadenceEntry = z.infer<typeof CadenceEntrySchema>;
export type Gate = z.infer<typeof GateSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

// A gate after normalization: `apply:` sugar folded in, `inputs` defaulted to
// `requires`, `confirm` defaulted. This is the shape gate-state computation consumes.
export interface NormalizedGate {
  id: string;
  kind: GateKind;
  requires: string[];
  tracks?: string | null;
  inputs: string[];
  cadence: CadenceEntry[];
  confirm: GateConfirm;
  before?: string;
  instruction?: string;
}

// Per-change metadata schema
// Note: schema field is validated at parse time against available schemas
// using a lazy import to avoid circular dependencies
export const ChangeMetadataSchema = z.object({
  // Required: which workflow schema this change uses
  schema: z.string().min(1, { message: 'schema is required' }),

  // Optional: creation timestamp (ISO date string)
  created: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'created must be YYYY-MM-DD format',
    })
    .optional(),

  // Optional: base fingerprints for parallel-merge divergence detection (C2).
  // capability directory name -> requirement name (as parsed) -> "sha256:<hex>"
  // of the baseline requirement block the delta was authored against.
  base_fingerprints: z
    .record(
      z.string(),
      z.record(
        z.string(),
        z.string().regex(/^sha256:[0-9a-f]{64}$/, {
          message: 'fingerprint must be sha256:<64 lowercase hex chars>',
        })
      )
    )
    .optional(),
});

export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;

// Runtime state types (not Zod - internal only)

// Slice 1: Simple completion tracking via filesystem
export type CompletedSet = Set<string>;

// Return type for blocked query
export interface BlockedArtifacts {
  [artifactId: string]: string[];
}

