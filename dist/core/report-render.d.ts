import { type ReviewMode } from './artifact-graph/index.js';
import { type ReviewerClass } from './artifact-graph/trail.js';
import { type PassGenre } from './artifact-graph/pass-genre.js';
/**
 * Review-report renderer (D-arc Stage D4, per orbit-report-rendering). The
 * human-facing review report is a PURE FUNCTION over a review pass record: the
 * same input record and render-time context produce a BYTE-IDENTICAL markdown
 * report. The renderer performs NO judgment — every rendered sentence is either
 * verbatim from the record, computed from the trail/gate engine, or fixed
 * grammar text (design D2b is the canonical grammar; goldens pin it).
 *
 * Three deliberate policies live here:
 * - STRICT validation (fail loud, no partial render) — the opposite of the
 *   orientation surface's graceful degradation: `--report` is the reviewing
 *   AI's own tool in the run-and-paste loop, so a malformed emit must fail at
 *   the source pass where it can be fixed.
 * - The render BOUNDARY is the D4 emit generation (spine `kind` + `scorecard`
 *   + dimension-carrying findings): every earlier real generation fails with
 *   the clean `pre-capability emit` error. Trail COUNTING (trend/ordinals)
 *   stays tolerant of all generations — rendering does not.
 * - Render-time context (iteration, trend, gate/position/eligibility tail) is
 *   COMPUTED, never read from the rendered record — the reviewer cannot author
 *   a verdict into the report.
 */
export type Severity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
export type Dimension = 'completeness' | 'correctness' | 'coherence';
export interface ScorecardCells {
    critical: number;
    warning: number;
    suggestion: number;
}
export interface Scorecard {
    completeness: ScorecardCells;
    correctness: ScorecardCells;
    coherence: ScorecardCells;
}
export interface NormalizedFinding {
    severity: Severity;
    /** Internal only: the owning scorecard dimension. */
    dimension?: Dimension;
    title: string;
    /**
     * The rendered `<file>[:<line>]` reference: internal = `${file}:${line}`;
     * external = the `**File**:` value VERBATIM (line reference retained).
     */
    fileRef: string;
    /** Line-stripped path for repeat/new matching (orbit-engine-gates rule). */
    matchFile: string;
    /** Verbatim recommendation (internal field / external Description body). */
    recommendation: string;
    recommendationOptions?: {
        label: string;
        body: string;
    }[];
    /**
     * rc02b: the finding's REPRODUCTION — internal `reproduction` field / external
     * `**Reproduction**:` body — verbatim, multi-line allowed. Absent on a CRITICAL
     * renders the `[unreproduced]` mark; the severity itself is NEVER re-graded here.
     */
    reproduction?: string;
    /**
     * rc03c: the walk entry this finding is about (internal only) — the shape
     * `orbit-emit-composition`'s verification requirement owns, key-normalized.
     */
    walkEntry?: {
        title: string;
        file: string;
    };
}
/**
 * rc04b: the reviewer's FORWARD RECOMMENDATION — the shape `orbit-emit-composition`'s
 * "The review payload carries `direction`" owns; this is its read-side twin.
 */
export interface ReviewDirection {
    disposition: 'forward' | 'hold';
    reasoning: string;
}
export interface NormalizedReviewPass {
    genre: 'internal' | 'external';
    filePath: string;
    mode: ReviewMode;
    /**
     * Internal only: the emit's own `change` field, PRESERVED verbatim (C3). The
     * render validates it equals the change being rendered — never a silent
     * relabel — and the internal header then renders this emit-sourced value.
     */
    change?: string;
    /**
     * The reviewer class — set on BOTH genres (the external normalizer sets `external`, rc04b), so
     * the renderer decides "owed" for either with the gate model's one predicate.
     */
    reviewerClass?: ReviewerClass;
    /** Internal genre field. */
    depth?: string;
    scorecard?: Scorecard;
    /** External genre fields (parsed header). */
    reviewerName?: string;
    reviewerDate?: string;
    findings: NormalizedFinding[];
    suppressed: {
        title: string;
        evidence: string;
    }[];
    /** Internal `commentary` field / external `## Notes` body. Absent = section omitted. */
    commentary?: string;
    /**
     * rc02b: lifecycle BLOCKS — internal `blocks` array / external `## Blocks` items —
     * rendered above the findings, in no scorecard cell, never a gate input.
     */
    blocks?: string[];
    /**
     * rc04b: internal `direction` object / external `## Direction` section. Absent = no direction
     * (MARKED `[no direction]` on an independent pass, section omitted on an in-context one);
     * `'malformed'` = an external section the format owner reads as malformed (MARKED
     * `[direction malformed]`, never a rejection). An internal mis-shaped one fails normalization.
     */
    direction?: ReviewDirection | 'malformed';
    /**
     * rc03c: internal `verification` record, key-normalized. Absent on a VERIFICATION-genre pass =
     * a prior-generation emit, rendered `[no verification record]` — by absence, never by date.
     */
    verification?: {
        title: string;
        file: string;
        verdict: 'landed' | 'regressed';
    }[];
}
/** Render-time computed context — never stored, never read from the record. */
export interface ReportContext {
    change: string;
    /** 1-based same-mode trail ordinal of the rendered pass (as-of semantics). */
    iteration: number;
    /** Severity counts of same-mode passes up to AND INCLUDING the rendered pass. */
    trend: ScorecardCells[];
    /** Repeat/new vs the immediately-prior same-mode pass (first run: undefined). */
    repeatCount?: number;
    newCount?: number;
    /**
     * rc03c: the PASS GENRE, recomputed at render time by the function `orbit-emit-composition`'s
     * genre requirement exports (internal passes only — every external pass is REVIEW and its header
     * omits the field). Never read from the record's stored `pass_genre`.
     */
    passGenre?: PassGenre;
    /**
     * rc03c: on a VERIFICATION-genre pass, the engine-derived facts its section prints — per owed key,
     * the latest walk carrying it `resolved`; and the walks that owe nothing because they are unreadable.
     */
    verification?: {
        latestWalk: Map<string, string>;
        unreadable: string[];
    };
    /**
     * report-archived-change: an ARCHIVED change's tail — the repo-relative archived directory,
     * `/`-joined. When present, no gate/position/eligibility line is computed or rendered.
     */
    archivedDir?: string;
    /** Engine tail — each line renders only when computed. */
    gateLine?: string;
    position?: string;
    nextCommand?: string;
}
/**
 * Strictly validates and normalizes an internal `review-<mode>-*.json` emit.
 * First failure wins; the error names the field and the offending file; NO
 * partial render is ever produced from an invalid emit.
 *
 * The D4-GENERATION BOUNDARY check runs first: an emit missing `kind` OR
 * missing `scorecard` OR carrying any dimension-less finding is a PRE-CAPABILITY
 * emit (the kind+findings_summary generation and the D3-cycle scorecard/no-kind
 * shape alike) and fails with its own distinct clean error — no inference, no
 * relaxation; the raw JSON remains the record.
 */
export declare function normalizeInternalPass(filePath: string, json: unknown): NormalizedReviewPass;
/**
 * Parses an `external-<as>-<TS>.md` findings file into the normalized render
 * shape. This is the renderer's OWN fence-aware parser (design D4) — the gate
 * model's lean `TrailPass` parse in trail.ts is untouched. Fence-aware: heading
 * and field lines inside ``` fences never count as structure (they stay verbatim
 * body content). Requirements: the `# External Review:` header; UNIQUELY-parsed
 * `**Reviewer**:` and `**Date**:` fields — recognized ONLY in the pre-severity
 * HEADER REGION (before the first `## ` heading; W4), the date a REAL
 * YYYY-MM-DD calendar date (W3); all three severity sections; per finding a
 * `### <title>`, a `**File**:` reference (line RETAINED), and a non-blank
 * `**Description**:` body (the verbatim recommendation). `## Notes` (when
 * present) supplies the Commentary slot. A shape the parser cannot confidently
 * parse is a REJECTION naming the field and file — non-renderable, no partial.
 *
 * rc02b additions, per `orbit-conventions`' External-review findings markdown
 * format: `**Reproduction**:` is the ONE field label recognised AFTER a finding's
 * Description body opens — it ENDS that body and opens the reproduction body,
 * which runs to the next `###`/`##` heading; every other field-shaped line inside
 * a Description or Reproduction body is content (the field-line rule, which the
 * gate's trail reader also follows so the finding key never diverges). A
 * `## Blocks` section's `- ` items are COLLECTED as the pass's blocks — never
 * findings, never counted; `None.` (or any non-item line) is no block.
 *
 * rc04b, per the same format: a `## Direction` section (matched case-insensitively,
 * read wherever it sits — the Blocks-then-Notes order is the prompt's instruction,
 * never a parse condition) is the pass's direction: its first non-blank line must be
 * the opener `**Disposition**: forward` | `**Disposition**: hold`, and the remaining
 * body (to the next `##`, blank edges trimmed) is the reasoning. A non-conforming
 * opener, a conforming opener with NO body, a heading with no non-blank line, or a
 * SECOND `## Direction` section normalizes as `'malformed'`; no section at all as
 * absent. In NEITHER case is the file rejected — the confidence gate is unchanged, and
 * the normalizer sets `reviewerClass: 'external'` so the renderer's one `isIndependent`
 * call decides "owed" for both genres. Inside the section, every line — field-shaped,
 * heading-shaped — is content (the field-line rule).
 */
export declare function normalizeExternalPass(filePath: string, content: string): NormalizedReviewPass;
/**
 * Renders a normalized review pass with its computed context into the report.
 * PURE and byte-deterministic; the fixed section order is: header → trend →
 * scorecard (internal only) → Blocks (when any) → findings by severity →
 * suppressed → Direction (rc04b: the reviewer's forward recommendation — present for every
 * independent pass, marked when the record has none; omitted for an in-context pass without
 * one) → the ONE delimited Commentary slot → the engine tail LAST. Empty sections are omitted
 * whole. Verbatim multi-line bodies render under BLOCKQUOTE CONTAINMENT so no
 * source line sits at column 0 (forged headings/rules/fences impossible).
 */
export declare function renderReviewReport(pass: NormalizedReviewPass, ctx: ReportContext): string;
export interface TrailArtifact {
    token: string;
    /** Absolute path. */
    file: string;
    /** Basename (the tie-break key). */
    name: string;
    renderable: boolean;
    passKind?: 'internal' | 'external';
    mode?: ReviewMode;
}
/**
 * Counts the confident external findings files for one mode in a change's
 * trail — the orientation strip's shared-pass-axis contribution (D4: ONE
 * iteration semantics across surfaces — the ⟲N chip and the report ordinal
 * count the same axis). The same confidence gate lenient trail counting
 * applies (header + all three severity sections); an unreadable or
 * unconfident file contributes nothing.
 */
export declare function countConfidentExternalPasses(changeDir: string, mode: 'proposal' | 'system'): number;
/**
 * Enumerates ALL of a change's `.orbit-runs/` trail artifacts (every genre — so
 * explicit-token dispatch can name a propose/apply emit cleanly), sorted in the
 * total order. Raw resolution step: no parsing, no gate-reader reuse.
 */
export declare function listTrailArtifacts(changeDir: string): TrailArtifact[];
/** A same-mode pass as trail counting sees it (TOLERANT — this is counting, not rendering). */
export interface TrailOrderPass {
    token: string;
    file: string;
    name: string;
    counts: ScorecardCells;
    /** Trimmed-title + line-stripped-path pairs for repeat/new matching. */
    findings: {
        title: string;
        matchFile: string;
    }[];
}
/**
 * Collects the change's same-mode review passes in the total order, with
 * TOLERANT severity counting for trend/ordinal purposes (all generations count
 * here; only the RENDERED pass must be boundary-conformant): internal emits →
 * scorecard cell sums when present, else `findings_summary` counts, else the
 * findings[] severity count (absent findings → 0); external files → lenient
 * severity-section counts (a parse-rejected external contributes nothing).
 */
export declare function collectSameModePasses(changeDir: string, mode: ReviewMode): TrailOrderPass[];
/**
 * Computes the render-time context for a normalized pass: as-of iteration and
 * trend from the trail's same-mode passes (INCLUDING the rendered pass — the
 * record/trail boundary is the persist, not the render), repeat/new vs the
 * immediately-prior same-mode pass, and the CURRENT engine tail from the same
 * per-change status computation the orientation surface composes from. The
 * legitimately-UNGATED case does not throw — the status computation returns no
 * gates/position/next_command values and the tail renders what exists (the
 * `---` rule alone). A THROWN status computation is a real failure (broken
 * schema, unreadable metadata) and propagates as a clean report failure naming
 * the change and cause (W1) — gate failures are never rendered as "ungated".
 */
export declare function buildReportContext(projectRoot: string, change: string, changeDir: string, pass: NormalizedReviewPass, archived?: boolean): ReportContext;
/**
 * Renders the report for a change: no `<TS>` → the NEWEST renderable pass on
 * the shared recency axis; explicit `<TS>` → resolved against ALL trail
 * artifacts (tie-break on multiple matches), review passes rendering and any
 * other genre failing with a clean error naming the genre and the renderable
 * set. READ-ONLY: creates and modifies no files. Throws clean errors (the CLI
 * exits non-zero); prints nothing itself.
 */
export interface ReportLocation {
    /** The resolved change directory (active or archived). */
    changeDir: string;
    /** True when `changeDir` is an archived directory — the tail is the `Archived:` line. */
    archived: boolean;
}
export declare function renderReport(projectRoot: string, change: string, ts?: string, location?: ReportLocation): string;
//# sourceMappingURL=report-render.d.ts.map