/**
 * The source lint (rc07) — checks MARKED spans in living prose against the facts the engine
 * computes.
 *
 * The scope is deliberately narrow and stated out loud: the lint verifies a link the AUTHOR
 * declared. An UNMARKED figure that disagrees with a computable fact is INVISIBLE to it, and
 * always will be — deciding which number in arbitrary prose restates a given fact is
 * inference about intent, which R-crc-10 keeps out of the engine. Per-source marker COVERAGE
 * is reported as the mitigation, and it is a RECORD: it counts, and it judges nothing.
 */
/**
 * A finding is DISCRIMINATED by `kind` and carries exactly the fields its kind defines: the
 * five failures have genuinely different shapes, and a single flat record would be
 * null-padded for three of them.
 */
export type SourceFinding = 
/** A fault in the registry itself — no markdown line, no source, no span. */
{
    kind: 'registry';
    file: string;
    detail: string;
}
/**
 * A DOMAIN fault: a tracked file the lint could not read, so its marked spans were never
 * checked. Distinct from `marker` because there is no delimiter and therefore no line —
 * an earlier version reused `marker` with a synthetic `line: 1`, which rendered as a defect
 * on line 1 and widened a kind whose definition is otherwise exact.
 */
 | {
    kind: 'domain';
    file: string;
    detail: string;
}
/** A malformed delimiter — a line, but no span to compare and no source value. */
 | {
    kind: 'marker';
    file: string;
    line: number;
    detail: string;
}
/** A well-formed span naming nothing declared — a span, but no value exists. */
 | {
    kind: 'unknown-source';
    file: string;
    line: number;
    source: string;
}
/** A span that disagrees — span text and source value both present. */
 | {
    kind: 'mismatch';
    file: string;
    line: number;
    source: string;
    span_text: string;
    source_value: string;
};
export interface SourceCoverageEntry {
    source: string;
    /** The string the source emits, or null when it could not be resolved. */
    value: string | null;
    /** How many marked spans reference it. */
    markers: number;
}
export interface SourceLintResult {
    /** True when `orbit/sources.yaml` exists — the lint is otherwise entirely silent. */
    registryPresent: boolean;
    findings: SourceFinding[];
    coverage: SourceCoverageEntry[];
    /** Files actually READ and parsed (after exclusions, and after read failures). */
    filesScanned: number;
    /**
     * True when EVERY file in the domain was fully examined.
     *
     * This is CARRIED, not inferred. Four consecutive review rounds found a scope where a source
     * was reported as passing a check that never ran, because completeness was being deduced from
     * whichever finding kinds the summary happened to look at — the whole-domain reason, then also
     * `domain` findings, and so on. Each widening left a new scope uncovered. Every point below
     * that fails to fully examine a domain file clears this flag, so a further such scope cannot be
     * silently omitted: it has to clear the flag to exist.
     */
    scanComplete: boolean;
    /** Named reason when the file domain is empty, e.g. a checkout without git. */
    domainReason: string | null;
}
/**
 * THE check, in one place: containment of a STRING inside a boundary the AUTHOR drew.
 *
 * Exported so the four motivating defects can be asserted against the product rather than
 * against `String.prototype.includes` — in particular the compound case (`4C/6W/0S`), which is
 * the only fixture that discriminates containment from a numeric parse and which the CLOSED
 * v1 engine table cannot emit as a source value.
 *
 * It never parses a number, and it never infers which token in the span is the figure.
 */
export declare function checkSpanAgainstValue(spanText: string, sourceValue: string): boolean;
/**
 * The lint reads LIVING documents, never RECORDS. Every exclusion is decidable BY PATH, so
 * no judgment is asked of the engine; a figure inside a record was TRUE WHEN WRITTEN, and
 * linting it would demand rewriting history to match the present.
 */
export declare function isExcludedPath(repoRelative: string): boolean;
/**
 * The file domain is `git ls-files '*.md'` minus the declared exclusions. Git's tracked-file
 * list is the authority, so the domain closes by construction rather than by a directory
 * list an author remembers — with two consequences STATED rather than discovered: an
 * UNTRACKED markdown file is outside the domain until it is added, and where git cannot
 * answer at all the domain is EMPTY with a named reason, never an exception.
 */
export declare function resolveFileDomain(projectRoot: string): {
    files: string[];
    reason: string | null;
};
interface ParsedSpan {
    source: string;
    /** 1-indexed line of the OPENER — every span-derived finding reports it. */
    line: number;
    text: string;
}
interface MarkerError {
    /** 1-indexed line of the offending delimiter. */
    line: number;
    detail: string;
}
/**
 * Parses one document's marked spans.
 *
 * A marker is INERT — neither an opener nor a closer — in TWO cases, so that prose ABOUT the
 * syntax never becomes prose CHECKED by it: a comment that does not match the delimiter grammar
 * exactly, and a marker inside a fenced code block. Backticks confer NO inertness; the NAME does,
 * which is why prose writes a PLACEHOLDER name. A real-named pair in prose is LIVE, deliberately.
 *
 * Pairing is a CLOSED table whose outcomes are of two kinds. A MARKER ERROR names the
 * offending delimiter's line, because there is no span to compare; an EMPTY span is NOT a
 * syntax error but a CHECK FAILURE, reported with the source value like any disagreeing
 * span. A marker error ABANDONS the rest of this file (pairing is no longer trustworthy
 * inside it) and nothing else: every other file still lints and still reports.
 */
export declare function parseMarkedSpans(content: string): {
    spans: ParsedSpan[];
    error: MarkerError | null;
};
/**
 * Runs the source lint over a project. Never throws: every fault becomes a finding.
 */
export declare function runSourceLint(projectRoot: string): SourceLintResult;
export {};
//# sourceMappingURL=source-lint.d.ts.map