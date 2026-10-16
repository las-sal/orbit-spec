import { ValidationReport } from './types.js';
export declare class Validator {
    private strictMode;
    /**
     * rc06a: the scenario-map config and declaration scan, taken ONCE per Validator — one
     * command invocation — so a bulk `orbit validate` reads the config, scans the test files and
     * raises its warnings once, then reuses them for every change (design D6).
     */
    private scenarioRun?;
    /** rc09a: the size ceiling, read ONCE per Validator so a bulk run warns once (the rc06a pattern). */
    private sizeRun?;
    constructor(strictMode?: boolean);
    validateSpec(filePath: string): Promise<ValidationReport>;
    /**
     * Validate spec content from a string (used for pre-write validation of rebuilt specs)
     */
    validateSpecContent(specName: string, content: string): Promise<ValidationReport>;
    validateChange(filePath: string): Promise<ValidationReport>;
    /**
     * Validate delta-formatted spec files under a change directory.
     * Enforces:
     * - At least one delta across all files
     * - ADDED/MODIFIED: each requirement has SHALL/MUST and at least one scenario
     * - REMOVED: names only; no scenario/description required
     * - RENAMED: pairs well-formed
     * - No duplicates within sections; no cross-section conflicts per spec
     */
    validateChangeDeltaSpecs(changeDir: string): Promise<ValidationReport>;
    /**
     * rc09a size check (`orbit-change-size`'s `Validate reports each breach as declared or
     * undeclared` — that requirement's table is the rule; this method is its rows). Every issue
     * carries the path `size`. With the check OFF it contributes nothing. The level REPORTS; no gate
     * reads it.
     */
    private validateChangeSize;
    /**
     * rc06a declaration check (`orbit-scenario-map`). With the check ON, every undeclared delta
     * scenario is reported at the level the change's `apply` gate assigns — INFO until it passes,
     * ERROR after — and every UNKEYABLE delta title at ERROR whatever the gate's state. Validate
     * reports those two and nothing else from the map (design D5): ORPHAN and MALFORMED live on the
     * `--scenarios` surface. With the check OFF it contributes nothing, so a repo without the key
     * gets a byte-identical report.
     */
    private validateScenarioDeclarations;
    /**
     * The level for an undeclared, keyable delta scenario, read from the SAME gate computation
     * `orbit status --change` renders (design D4), so validate and status cannot disagree about
     * whether apply passed. No `apply` row, or a context that cannot load, is INFO — never a throw.
     */
    private scenarioLevel;
    /** The `schema:` string from the change's metadata; undefined when absent; throws when unreadable. */
    private metadataSchema;
    /** `<root>/orbit/changes/<name>` or `<root>/orbit/changes/archive/<name>`; null otherwise. */
    private projectRootFor;
    /**
     * Two-level architecture-citation resolution (D-arc D2). Change validation OWNS
     * citation resolution: the citation lives in the change's metadata, so it is
     * validated where metadata is validated (`orbit architecture validate` checks doc
     * structure only). Absence of the field imposes nothing.
     */
    private validateArchitectureCitation;
    private convertZodErrors;
    private applySpecRules;
    private applyChangeRules;
    private enrichTopLevelError;
    private extractNameFromPath;
    private createReport;
    isValid(report: ValidationReport): boolean;
    private extractRequirementText;
    private containsShallOrMust;
    private countScenarios;
    private formatSectionList;
}
//# sourceMappingURL=validator.d.ts.map