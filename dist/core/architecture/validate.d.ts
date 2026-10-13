/**
 * Architecture-doc structure validation + the citation-resolution helper (D-arc D2).
 *
 * `orbit architecture validate <doc>` checks STRUCTURE ONLY: heading form, slot syntax,
 * stage-id uniqueness, Depends-on resolution. It never runs the citation scan and never
 * judges ratified marks (falsified marks surface via the status render + audit-drift).
 *
 * Citation resolution (`architecture: {doc, stage}` in change/explore metadata) is
 * HOSTED here but OWNED by change validation — `orbit validate <change>` calls
 * resolveArchitectureCitation; citations live in metadata, so they are validated where
 * metadata is validated. Resolution is two-level (dangling doc vs dangling stage) and
 * resolves against a malformed doc's WELL-FORMED stages (one typo'd heading must not
 * dangle every sibling citation). A legacy doc declares zero stages, so any stage
 * citation against it dangles at the stage level.
 */
import { type ParsedArchitectureDoc } from './parser.js';
export interface DocValidationIssue {
    /** 0-indexed line when the issue anchors to one. */
    line?: number;
    message: string;
}
export interface DocValidationResult {
    valid: boolean;
    docClass: ParsedArchitectureDoc['docClass'];
    issues: DocValidationIssue[];
    /** Present for legacy docs: being legacy is not an error. */
    note?: string;
}
/**
 * Validate one parsed doc's structure. Legacy docs pass with a note; near-miss grammar
 * violations, duplicate ids, and unresolvable Depends-on references fail.
 */
export declare function validateArchitectureDoc(doc: ParsedArchitectureDoc): DocValidationResult;
export type CitationResolution = {
    ok: true;
} | {
    ok: false;
    level: 'doc' | 'stage';
    message: string;
};
/**
 * Resolve an `architecture: {doc, stage}` citation against the docs on disk.
 * Two-level: the error names WHICH level dangled.
 */
export declare function resolveArchitectureCitation(projectRoot: string, citation: {
    doc: string;
    stage: string;
}): CitationResolution;
//# sourceMappingURL=validate.d.ts.map