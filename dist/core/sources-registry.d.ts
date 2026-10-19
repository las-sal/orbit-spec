/**
 * The source registry (rc07) — `orbit/sources.yaml` plus the CLOSED table of facts the
 * ENGINE can compute.
 *
 * A `src:` marker in living prose may name only what this registry declares, and the
 * registry may name only what the table below exposes. The domain therefore closes by
 * construction: adding a fact is a code change with a test, never a line of YAML. There is
 * deliberately no `command:` field — orbit is a published package, so a shell escape hatch
 * would mean that cloning a project and running a read-only-looking `orbit validate`
 * executes repository data.
 *
 * The rulings-index parse lives HERE rather than in `src/core/architecture/parser.ts`: that
 * parser's model is contractually limited to stage ids/titles, the two slot lines and
 * section boundaries, and this change keeps it that way (the engine-level exception is named
 * in the `orbit-architecture-engine` baseline instead).
 */
import { type ParsedArchitectureDoc } from './architecture/parser.js';
export declare const SOURCES_REGISTRY_PATH: string;
/** A source NAME must be nameable by a marker, whose grammar this mirrors exactly. */
export declare const SOURCE_NAME_REGEX: RegExp;
/** A schema parameter names a schema DIRECTORY — one kebab-case segment, never a path. */
export declare const SCHEMA_NAME_REGEX: RegExp;
/** A fault in the registry file itself: its shape, its names, or its parameters. */
export declare class SourceRegistryError extends Error {
    constructor(message: string);
}
/** A fault resolving ONE declared source to its value. */
export declare class SourceResolutionError extends Error {
    constructor(message: string);
}
export interface DeclaredSource {
    /** The name a marker uses. */
    name: string;
    /** The engine source it names, e.g. `architecture.stage-count`. */
    engine: string;
    /** Declared parameter values, already validated as non-empty strings. */
    params: Record<string, string>;
}
/**
 * Counts ruling entries in a parsed architecture doc's `## Rulings index` section.
 *
 * A ruling entry is a TOP-LEVEL list item whose FIRST bold span is exactly
 * `<prefix>-<n>`: `<prefix>` is matched LITERALLY (never compiled as a pattern) and `<n>`
 * is one or more decimal digits with nothing following them, so `R-crc-10` is an entry and
 * `R-crc-4a` is not. TOP-LEVEL means a `-` or `*` marker at indent 0–3 that is not nested
 * inside another list item; the SECTION runs from the heading to the next heading at `##`
 * or higher. Fence-aware, like every parse over these docs.
 *
 * The prefix is DECLARED by the caller, never derived from the doc's name: a doc's filename
 * stem is not the abbreviation its rulings use, and deriving one would be a guess about a
 * naming convention the engine cannot observe. Because it is declared, emptiness is
 * meaningful — a section yielding ZERO entries is a MALFORMED source that throws, never a
 * count of zero that would silently agree with any prose containing a zero digit.
 */
export declare function countRulingEntries(doc: ParsedArchitectureDoc, prefix: string): number;
/** The engine-source names a registry entry may name. CLOSED. */
export declare function listEngineSources(): string[];
/**
 * Reads `orbit/sources.yaml`. An ABSENT file means an empty registry and no error — the
 * state of every repository today. A file that EXISTS can never reach that silence: every
 * fault below throws, naming the file or the entry.
 */
export declare function readSourcesRegistry(projectRoot: string): DeclaredSource[];
/** Resolves one declared source to the STRING it emits. Throws SourceResolutionError. */
export declare function resolveSourceValue(projectRoot: string, source: DeclaredSource): string;
//# sourceMappingURL=sources-registry.d.ts.map