/**
 * Fence-aware parser for architecture docs (D-arc Stage D2).
 *
 * An architecture doc declares engine-readable structure via heading conventions while
 * staying a judgment-dense prose document. This parser INTERPRETS only: stage ids/titles, the
 * two optional slot lines (`Depends-on:` / `Complete:` — the latter with three exact productions),
 * and section boundaries; `docClass` and
 * the violation list derive from that grammar alone. All other content — charter prose, exit
 * criteria, premise, rulings, status log — carries no meaning this parser assigns.
 *
 * It does CARRY the document's raw lines as passthrough (`ParsedArchitectureDoc.lines`), which
 * is the substrate `sliceStageSection` slices for `orbit architecture show` and which the source
 * lint reads to count ruling entries. Carrying content is not interpreting it — but an earlier
 * version of this comment said "the engine reads ONLY", which was false of that field and of
 * both readers. The permitted readers of passthrough are enumerated in the
 * `orbit-architecture-engine` spec; any new one belongs on that list.
 *
 * Near-miss rule: a doc intended to be parseable must never silently degrade to legacy.
 * A heading starting `### Stage ` that fails the exact grammar, or a slot line inside a
 * stage section that fails slot syntax, is a grammar VIOLATION naming the line — the doc
 * classes as `malformed` (its well-formed stages still parse and participate in state
 * computation). LEGACY means zero `### Stage `-prefixed headings outside fences.
 */
export declare const ARCHITECTURE_DIR: string;
/**
 * The `Complete:` slot's three productions AS THE OWNING SPEC STATES THEM — one string,
 * byte-equal to the inline production in `orbit-architecture-engine`'s `Parseable
 * architecture-doc format` requirement (a parity test reads the owner through the
 * single-active-owner lookup and asserts equality). The architect body interpolates this
 * constant so its scaffold sentence is a CHECKED MIRROR of the owner, never a second
 * statement of the grammar (R-crc-14's mirror corollary; rc15 external system pass W1).
 * `COMPLETE_REGEX` above is the executable form of the same three productions.
 */
export declare const COMPLETE_SLOT_PRODUCTIONS = "`Complete: [ ]` / `Complete: [x] <YYYY-MM-DD> (<who>)` / `Complete: [~] <YYYY-MM-DD> (<who>)`";
export interface StageCompletion {
    ratified: boolean;
    /** The user's declaration that the stage ended without meeting its exit criteria (`[~]`). Never true beside `ratified`. */
    ended: boolean;
    date?: string;
    who?: string;
}
export interface ParsedStage {
    id: string;
    title: string;
    /** 0-indexed line of the stage heading. */
    headingLine: number;
    /** 0-indexed line AFTER the section's last line (exclusive bound). */
    sectionEnd: number;
    dependsOn: string[];
    hasDependsOnSlot: boolean;
    dependsOnLine?: number;
    complete: StageCompletion;
    hasCompleteSlot: boolean;
    completeLine?: number;
}
export interface GrammarViolation {
    /** 0-indexed line of the offending text. */
    line: number;
    text: string;
    reason: string;
}
export type DocClass = 'parseable' | 'legacy' | 'malformed';
export interface ParsedArchitectureDoc {
    /** Filename stem — the doc's citable identity. */
    name: string;
    /** Repo-relative path (when loaded from disk; '' for in-memory parses). */
    path: string;
    docClass: DocClass;
    /** Well-formed stages, in document order (populated even when malformed). */
    stages: ParsedStage[];
    violations: GrammarViolation[];
    lines: string[];
}
/**
 * Parse architecture-doc content. Pure function of the text.
 */
export declare function parseArchitectureDoc(content: string, name: string, docPath?: string): ParsedArchitectureDoc;
/**
 * A doc's citable identity is its FILENAME STEM — a canonical name, never a path.
 * Rejects separators, traversal segments, and leading dots so `show ../../README`
 * (or an alias like `subdir/../real-doc`) can neither escape orbit/architecture/
 * nor create a second spelling of one identity (validation and the state scan must
 * agree on exact names).
 */
export declare function isValidDocName(name: string): boolean;
/**
 * Load and parse one architecture doc by name (filename stem). Returns null when the
 * name is not a canonical stem or the file does not exist. Defense in depth: even a
 * name passing the stem check must resolve to a file directly under the architecture
 * directory.
 */
export declare function loadArchitectureDoc(projectRoot: string, name: string): ParsedArchitectureDoc | null;
/**
 * List and parse every architecture doc (top-level *.md under orbit/architecture/).
 * Returns [] when the directory does not exist. `.orbit-runs/` and subdirectories are
 * never docs.
 */
export declare function listArchitectureDocs(projectRoot: string): ParsedArchitectureDoc[];
/**
 * Slice one stage's section (heading through the line before the next same-or-higher
 * heading) out of a parsed doc. Returns null when the stage id is not declared.
 */
export declare function sliceStageSection(doc: ParsedArchitectureDoc, stageId: string): string | null;
//# sourceMappingURL=parser.d.ts.map