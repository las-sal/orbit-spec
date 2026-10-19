import { z } from 'zod';
export declare const ArtifactSchema: z.ZodObject<{
    id: z.ZodString;
    generates: z.ZodString;
    description: z.ZodString;
    template: z.ZodString;
    instruction: z.ZodOptional<z.ZodString>;
    requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ApplyPhaseSchema: z.ZodObject<{
    requires: z.ZodArray<z.ZodString>;
    tracks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    instruction: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const GateKindSchema: z.ZodEnum<{
    tracked: "tracked";
    reviewed: "reviewed";
}>;
export declare const GateConfirmSchema: z.ZodEnum<{
    "no-new-findings": "no-new-findings";
    "findings-resolved": "findings-resolved";
}>;
export declare const CADENCE_ENTRIES: readonly ["in-context", "fresh", "external", "independent", "blind-pair", "invoked"];
export declare const CadenceEntrySchema: z.ZodEnum<{
    "blind-pair": "blind-pair";
    fresh: "fresh";
    external: "external";
    "in-context": "in-context";
    independent: "independent";
    invoked: "invoked";
}>;
export declare const LIFECYCLE_PHASE_TOKENS: readonly ["apply", "archive"];
export declare const CONSENT_VALUES: readonly ["user-invoked"];
export type ConsentValue = (typeof CONSENT_VALUES)[number];
export declare const GateSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodString;
    requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tracks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    inputs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cadence: z.ZodOptional<z.ZodArray<z.ZodString>>;
    confirm: z.ZodOptional<z.ZodEnum<{
        "no-new-findings": "no-new-findings";
        "findings-resolved": "findings-resolved";
    }>>;
    budget: z.ZodOptional<z.ZodNumber>;
    before: z.ZodOptional<z.ZodString>;
    consent: z.ZodOptional<z.ZodString>;
    instruction: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const SchemaYamlSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    artifacts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        generates: z.ZodString;
        description: z.ZodString;
        template: z.ZodString;
        instruction: z.ZodOptional<z.ZodString>;
        requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    apply: z.ZodOptional<z.ZodObject<{
        requires: z.ZodArray<z.ZodString>;
        tracks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        instruction: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    gates: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodString;
        requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
        tracks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        inputs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        cadence: z.ZodOptional<z.ZodArray<z.ZodString>>;
        confirm: z.ZodOptional<z.ZodEnum<{
            "no-new-findings": "no-new-findings";
            "findings-resolved": "findings-resolved";
        }>>;
        budget: z.ZodOptional<z.ZodNumber>;
        before: z.ZodOptional<z.ZodString>;
        consent: z.ZodOptional<z.ZodString>;
        instruction: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type GateKind = z.infer<typeof GateKindSchema>;
export type GateConfirm = z.infer<typeof GateConfirmSchema>;
export type CadenceEntry = z.infer<typeof CadenceEntrySchema>;
export type Gate = z.infer<typeof GateSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;
export interface NormalizedGate {
    id: string;
    kind: GateKind;
    requires: string[];
    tracks?: string | null;
    inputs: string[];
    cadence: CadenceEntry[];
    confirm: GateConfirm;
    /** rc02c: the DECLARED EXPECTATION of what the cadence costs; absent means no expectation is
     *  declared. It is not a ceiling and bounds nothing — nothing consults it. */
    budget?: number;
    before?: string;
    consent?: ConsentValue;
    instruction?: string;
}
export declare const ChangeMetadataSchema: z.ZodObject<{
    schema: z.ZodString;
    created: z.ZodOptional<z.ZodString>;
    schema_version: z.ZodOptional<z.ZodNumber>;
    consent_era_from: z.ZodOptional<z.ZodString>;
    architecture: z.ZodOptional<z.ZodObject<{
        doc: z.ZodString;
        stage: z.ZodString;
    }, z.core.$strip>>;
    base_fingerprints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>>;
}, z.core.$strip>;
export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;
export type CompletedSet = Set<string>;
export interface BlockedArtifacts {
    [artifactId: string]: string[];
}
//# sourceMappingURL=types.d.ts.map