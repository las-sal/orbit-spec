import type { ScenarioMapConfig } from './project-config.js';
/** The surface's scan when the check is OFF — the map stays viewable before opting in. */
export declare const DEFAULT_SCENARIO_TESTS: string[];
export declare const COVER_KINDS: readonly ["behaviour", "text", "observed", "untestable"];
export type CoverKind = (typeof COVER_KINDS)[number];
export type DeltaOperation = 'ADDED' | 'MODIFIED' | 'RENAMED';
export interface ScenarioEntry {
    capability: string;
    requirement: string;
    scenario: string;
    operation: DeltaOperation;
    declarations: {
        behaviour: Array<{
            file: string;
            line: number;
        }>;
        text: Array<{
            file: string;
            line: number;
        }>;
        observed: Array<{
            record: string;
        }>;
        untestable: Array<{
            why: string;
        }>;
    };
    uncovered: boolean;
}
export type OrphanEntry = {
    source: 'tag';
    file: string;
    line: number;
    key: string;
} | {
    source: 'ledger';
    index: number;
    key: string;
};
export type MalformedEntry = {
    source: 'tag';
    file: string;
    line: number;
    reason: string;
} | {
    source: 'ledger';
    index: number;
    reason: string;
} | {
    source: 'ledger-file';
    reason: string;
} | {
    source: 'spec';
    capability: string;
    requirement: string;
    scenario: string;
    reason: 'unkeyable';
};
export interface ScenarioMap {
    change: string;
    check: 'on' | 'off';
    tests: string[];
    scenarios: ScenarioEntry[];
    orphans: OrphanEntry[];
    malformed: MalformedEntry[];
    counts: {
        delta_scenarios: number;
        behaviour: number;
        text: number;
        observed: number;
        untestable: number;
        uncovered: number;
        orphans: number;
        malformed: number;
        baseline_undeclared: number;
    };
}
/** Split a key on the literal ` :: `; exactly three non-empty trimmed parts, else null. */
export declare function splitKey(raw: string): [string, string, string] | null;
export declare function joinKey(capability: string, requirement: string, scenario: string): string;
/** A title that itself contains the separator cannot be keyed by any tag or ledger entry (the
 *  other unkeyable case — a title repeated within its requirement — is decided in key resolution). */
export declare function isUnkeyableTitle(title: string): boolean;
export interface TagDeclaration {
    kind: 'behaviour' | 'text';
    key: string;
    file: string;
    /** The tag's own line (orphans name it). */
    tagLine: number;
    /** The test call line the tag attached to (declarations name it). */
    line: number;
}
export interface LedgerDeclaration {
    kind: 'observed' | 'untestable';
    key: string;
    index: number;
    record?: string;
    why?: string;
}
export interface ScenarioScan {
    tests: string[];
    tags: TagDeclaration[];
    ledger: LedgerDeclaration[];
    malformed: MalformedEntry[];
}
export interface ScanOptions {
    /** Raise the zero-match warning (only for configured globs — the OFF default never warns). */
    warnOnZeroMatch: boolean;
    warn?: (message: string) => void;
}
/**
 * Scan the declarations — tags in the files the globs match from the project root (never
 * `node_modules`), plus the ledger. Independent of any change, so a bulk run scans ONCE and
 * reuses the result; the zero-match warning is therefore raised once per run.
 */
export declare function scanDeclarations(projectRoot: string, globs: string[], options: ScanOptions): ScenarioScan;
export interface ResolvedKeys {
    /** Keyable delta scenarios, in capability / requirement / scenario order. */
    delta: Array<{
        capability: string;
        requirement: string;
        scenario: string;
        operation: DeltaOperation;
    }>;
    /** Delta scenarios whose requirement or scenario title contains the separator. */
    unkeyable: Array<{
        capability: string;
        requirement: string;
        scenario: string;
    }>;
    /** Keys of every scenario outside the delta. */
    baseline: string[];
    /** Every resolvable key (delta + baseline) — the orphan test. */
    all: Set<string>;
}
/** The baseline under `orbit/specs/` with the change's delta operations applied to the KEY set. */
export declare function resolveScenarioKeys(projectRoot: string, changeDir: string): ResolvedKeys;
export interface ComputeOptions {
    /** The resolved config regime; OFF scans the default globs. */
    config: ScenarioMapConfig;
    /** A scan already taken this run (bulk validate scans once). */
    scan?: ScenarioScan;
    warn?: (message: string) => void;
}
export declare function computeScenarioMap(projectRoot: string, changeDir: string, options: ComputeOptions): ScenarioMap;
export declare function renderScenarioMap(map: ScenarioMap): string;
//# sourceMappingURL=scenario-map.d.ts.map