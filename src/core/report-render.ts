import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadChangeContext,
  formatChangeStatus,
  parseTsToken,
  type ReviewMode,
} from './artifact-graph/index.js';
import { modelHintFor, withModelHint } from './model-hints.js';
import { createFenceTracker } from './markdown-fence.js';
import { readTrail, type ReviewerClass } from './artifact-graph/trail.js';
import { isIndependent } from './artifact-graph/gates.js';
import {
  computePassGenre,
  verificationLedger,
  verificationShapeError,
  walkEntryShapeError,
  normalizeKey,
  keyString,
  type PassGenre,
  type ShapeError,
} from './artifact-graph/pass-genre.js';

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

// -----------------------------------------------------------------------------
// Normalized render shape
// -----------------------------------------------------------------------------

export type Severity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
export type Dimension = 'completeness' | 'correctness' | 'coherence';

const SEVERITIES: Severity[] = ['CRITICAL', 'WARNING', 'SUGGESTION'];
const DIMENSIONS: Dimension[] = ['completeness', 'correctness', 'coherence'];
const SEVERITY_CELLS = ['critical', 'warning', 'suggestion'] as const;

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
  recommendationOptions?: { label: string; body: string }[];
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
  walkEntry?: { title: string; file: string };
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
  suppressed: { title: string; evidence: string }[];
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
  verification?: { title: string; file: string; verdict: 'landed' | 'regressed' }[];
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
  verification?: { latestWalk: Map<string, string>; unreadable: string[] };
  /** Engine tail — each line renders only when computed. */
  gateLine?: string;
  position?: string;
  nextCommand?: string;
}

// -----------------------------------------------------------------------------
// Strict internal-emit validation + normalization
// -----------------------------------------------------------------------------

const SPINE_FIELDS = [
  'command',
  'timestamp',
  'change',
  'final_assessment',
  'next_recommended',
  'kind',
] as const;

const REVIEWER_CLASSES = ['in-context', 'fresh', 'external'] as const;

function fail(detail: string, file: string): never {
  throw new Error(`invalid review emit: ${detail} in ${file}`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * The single-line grammar-slot boundary (ONE checked helper — every slot that
 * renders into the report's own line grammar goes through here): record-sourced
 * text must not be able to forge column-0 report grammar (headings/rules/
 * fences), so embedded newlines — BOTH \r and \n — fail loud naming the slot.
 * The blockquote containment covers only the multi-line bodies; option BODIES
 * are collapsed to a space at render instead (they are labels, not documents).
 */
function requireSingleLine(value: string, field: string, file: string): void {
  if (value.includes('\n') || value.includes('\r')) {
    fail(`field '${field}' must be single-line (embedded newline)`, file);
  }
}

/** rc03c: a shape report from the verification record's ONE shape statement, failed read-side. */
function failShape(e: ShapeError, file: string): never {
  if (e.kind === 'newline') fail(`field '${e.field}' must be single-line (embedded newline)`, file);
  if (e.kind === 'unknown-key') fail(`unknown field '${e.field}'`, file);
  fail(`missing or mistyped field '${e.field}'`, file);
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
export function normalizeInternalPass(filePath: string, json: unknown): NormalizedReviewPass {
  if (!isPlainObject(json)) fail('emit is not a JSON object', filePath);
  const j = json;

  // The D4-generation boundary (checked BEFORE per-field strictness so every
  // real earlier generation gets the boundary error, not a field-lottery one).
  const boundaryMissing: string[] = [];
  if (j.kind === undefined) boundaryMissing.push(`spine 'kind'`);
  if (j.scorecard === undefined) boundaryMissing.push(`'scorecard'`);
  if (
    Array.isArray(j.findings) &&
    j.findings.some(f => isPlainObject(f) && f.dimension === undefined)
  ) {
    boundaryMissing.push(`per-finding 'dimension'`);
  }
  if (boundaryMissing.length > 0) {
    throw new Error(
      `pre-capability emit: ${filePath} predates the D4-generation boundary ` +
        `(missing ${boundaryMissing.join(', ')}); only D4-generation review emits ` +
        `(universal spine incl. kind + scorecard + dimension-carrying findings) render — ` +
        `the raw JSON remains the record`
    );
  }

  // Universal spine: all strings.
  for (const field of SPINE_FIELDS) {
    if (typeof j[field] !== 'string') fail(`missing or mistyped field '${field}'`, filePath);
  }

  // Spine semantics (W2): a renderable review emit IS a review emit.
  if (j.command !== 'review') {
    fail(`field 'command' must be 'review' (got '${j.command}')`, filePath);
  }
  if (j.kind !== 'editorial') {
    fail(`field 'kind' must be 'editorial' (got '${j.kind}')`, filePath);
  }

  // Review extensions.
  if (j.mode !== 'proposal' && j.mode !== 'system') {
    fail(`missing or mistyped field 'mode' (expected 'proposal' | 'system')`, filePath);
  }
  if (typeof j.reviewer_class !== 'string' || j.reviewer_class.length === 0) {
    fail(`missing or mistyped field 'reviewer_class'`, filePath);
  }
  if (typeof j.depth !== 'string' || j.depth.length === 0) {
    fail(`missing or mistyped field 'depth'`, filePath);
  }
  requireSingleLine(j.reviewer_class, 'reviewer_class', filePath);
  requireSingleLine(j.depth, 'depth', filePath);
  if (!REVIEWER_CLASSES.includes(j.reviewer_class as (typeof REVIEWER_CLASSES)[number])) {
    fail(
      `field 'reviewer_class' must be one of 'in-context' | 'fresh' | 'external' (got '${j.reviewer_class}')`,
      filePath
    );
  }

  // Scorecard shape: 3 dimensions × 3 severity cells, non-negative integers.
  if (!isPlainObject(j.scorecard)) fail(`missing or mistyped field 'scorecard'`, filePath);
  const scorecard = {} as Scorecard;
  for (const dim of DIMENSIONS) {
    const cells = (j.scorecard as Record<string, unknown>)[dim];
    if (!isPlainObject(cells)) fail(`missing or mistyped field 'scorecard.${dim}'`, filePath);
    const out = {} as ScorecardCells;
    for (const sev of SEVERITY_CELLS) {
      const v = cells[sev];
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
        fail(`field 'scorecard.${dim}.${sev}' must be a non-negative integer`, filePath);
      }
      out[sev] = v;
    }
    scorecard[dim] = out;
  }

  // findings[] entry shape.
  if (!Array.isArray(j.findings)) fail(`missing or mistyped field 'findings'`, filePath);
  const findings: NormalizedFinding[] = j.findings.map((raw, i) => {
    const at = `findings[${i}]`;
    if (!isPlainObject(raw)) fail(`field '${at}' is not an object`, filePath);
    const f = raw as Record<string, unknown>;
    if (!SEVERITIES.includes(f.severity as Severity)) {
      fail(`missing or mistyped field '${at}.severity'`, filePath);
    }
    if (!DIMENSIONS.includes(f.dimension as Dimension)) {
      fail(`missing or mistyped field '${at}.dimension'`, filePath);
    }
    if (typeof f.title !== 'string' || f.title.trim().length === 0) {
      fail(`missing or mistyped field '${at}.title'`, filePath);
    }
    requireSingleLine(f.title, `${at}.title`, filePath);
    if (typeof f.file !== 'string' || f.file.length === 0) {
      fail(`missing or mistyped field '${at}.file'`, filePath);
    }
    requireSingleLine(f.file, `${at}.file`, filePath);
    if (typeof f.line !== 'number' || !Number.isFinite(f.line)) {
      fail(`missing or mistyped field '${at}.line'`, filePath);
    }
    if (typeof f.recommendation !== 'string') {
      fail(`missing or mistyped field '${at}.recommendation'`, filePath);
    }
    // rc02b: a PRESENT reproduction must be a string (the write gate's read-side twin);
    // its content requirement — non-empty on CRITICAL — is the gate's, enforced at write
    // time only, so prior-generation emits without the field still render (marked).
    if (f.reproduction !== undefined && typeof f.reproduction !== 'string') {
      fail(`missing or mistyped field '${at}.reproduction'`, filePath);
    }
    // rc03c: a PRESENT walk_entry is the write gate's shape, read-side (shape only).
    let walkEntry: { title: string; file: string } | undefined;
    if (f.walk_entry !== undefined) {
      const e = walkEntryShapeError(f.walk_entry, i);
      if (e) failShape(e, filePath);
      const w = f.walk_entry as { title: string; file: string };
      walkEntry = normalizeKey(w.title, w.file);
    }
    let recommendationOptions: { label: string; body: string }[] | undefined;
    if (f.recommendation_options !== undefined) {
      if (!Array.isArray(f.recommendation_options)) {
        fail(`mistyped field '${at}.recommendation_options'`, filePath);
      }
      recommendationOptions = f.recommendation_options.map((o, oi) => {
        if (!isPlainObject(o) || typeof o.label !== 'string' || typeof o.body !== 'string') {
          fail(`missing or mistyped field '${at}.recommendation_options[${oi}]'`, filePath);
        }
        // Labels are single-line grammar slots; the BODIES keep their
        // collapse-to-space treatment at render.
        requireSingleLine(o.label as string, `${at}.recommendation_options[${oi}].label`, filePath);
        return { label: o.label as string, body: o.body as string };
      });
    }
    return {
      severity: f.severity as Severity,
      dimension: f.dimension as Dimension,
      title: (f.title as string).trim(),
      fileRef: `${f.file}:${f.line}`,
      matchFile: stripLineSuffix(String(f.file)),
      recommendation: f.recommendation as string,
      ...(recommendationOptions ? { recommendationOptions } : {}),
      // A blank string is ABSENCE, exactly as the external parser reads a blank body (the mark
      // is by absence on both genres; the write gate refuses blank only on CRITICAL).
      ...(typeof f.reproduction === 'string' && f.reproduction.trim() !== '' ? { reproduction: f.reproduction } : {}),
      ...(walkEntry !== undefined ? { walkEntry } : {}),
    };
  });

  // rc03c: a PRESENT `verification` is the write gate's shape, read-side — SHAPE only; the owed-set,
  // completeness and pairing checks are the write gate's and are not repeated here. Absence is a MARK.
  let verification: NormalizedReviewPass['verification'];
  if (j.verification !== undefined) {
    const e = verificationShapeError(j.verification);
    if (e) failShape(e, filePath);
    verification = (j.verification as Array<{ title: string; file: string; verdict: 'landed' | 'regressed' }>).map(v => ({
      ...normalizeKey(v.title, v.file),
      verdict: v.verdict,
    }));
  }

  // Optional absent-safe fields — validated for shape only when present.
  if (j.commentary !== undefined && typeof j.commentary !== 'string') {
    fail(`mistyped field 'commentary'`, filePath);
  }
  // rc04b: `direction` — absent-safe at every class (absence is a MARK, never a validation
  // failure); a PRESENT one is the write gate's shape, read-side: an object whose `disposition`
  // is in the closed set and whose `reasoning` is a non-empty string.
  let direction: ReviewDirection | undefined;
  if (j.direction !== undefined) {
    const d = j.direction;
    if (
      !isPlainObject(d) ||
      (d.disposition !== 'forward' && d.disposition !== 'hold') ||
      typeof d.reasoning !== 'string' ||
      d.reasoning.trim() === ''
    ) {
      fail(`missing or mistyped field 'direction'`, filePath);
    }
    direction = { disposition: d.disposition as 'forward' | 'hold', reasoning: d.reasoning as string };
  }
  // rc02b: `blocks` — an array of single-line strings, each a `- ` line at column 0 in the
  // report's Blocks section, so the single-line slot rule applies (a newline could forge grammar).
  let blocks: string[] | undefined;
  if (j.blocks !== undefined) {
    if (!Array.isArray(j.blocks)) fail(`mistyped field 'blocks'`, filePath);
    blocks = j.blocks.map((b, i) => {
      if (typeof b !== 'string') fail(`missing or mistyped field 'blocks[${i}]'`, filePath);
      requireSingleLine(b as string, `blocks[${i}]`, filePath);
      return b as string;
    });
  }
  const suppressed: { title: string; evidence: string }[] = [];
  if (j.stale_suppressed !== undefined) {
    if (!Array.isArray(j.stale_suppressed)) fail(`mistyped field 'stale_suppressed'`, filePath);
    for (const [i, raw] of j.stale_suppressed.entries()) {
      if (!isPlainObject(raw) || typeof raw.title !== 'string' || typeof raw.evidence !== 'string') {
        fail(`missing or mistyped field 'stale_suppressed[${i}]'`, filePath);
      }
      requireSingleLine(raw.title as string, `stale_suppressed[${i}].title`, filePath);
      requireSingleLine(raw.evidence as string, `stale_suppressed[${i}].evidence`, filePath);
      suppressed.push({ title: raw.title as string, evidence: raw.evidence as string });
    }
  }

  // CONSISTENCY: each scorecard cell equals the ACTIVE findings' dimension ×
  // severity rollup (suppressed live in stale_suppressed, already excluded).
  for (const dim of DIMENSIONS) {
    for (const sev of SEVERITY_CELLS) {
      const rollup = findings.filter(
        f => f.dimension === dim && f.severity === sev.toUpperCase()
      ).length;
      if (scorecard[dim][sev] !== rollup) {
        throw new Error(
          `scorecard/findings mismatch: scorecard.${dim}.${sev} is ${scorecard[dim][sev]} ` +
            `but active findings roll up to ${rollup} in ${filePath}`
        );
      }
    }
  }

  // SPINE SEMANTICS (W2): final_assessment and next_recommended are DERIVED
  // values, never authored prose — the counts sentence from the scorecard
  // totals, the pointer from the findings state + THIS emit's repo-relative
  // path. Checked AFTER consistency so a mismatched cell names the cell first.
  const totals: ScorecardCells = { critical: 0, warning: 0, suggestion: 0 };
  for (const dim of DIMENSIONS) {
    for (const sev of SEVERITY_CELLS) totals[sev] += scorecard[dim][sev];
  }
  const expectedAssessment =
    totals.critical + totals.warning + totals.suggestion === 0
      ? 'No findings.'
      : `${totals.critical} critical, ${totals.warning} warning, ${totals.suggestion} suggestion.`;
  if (j.final_assessment !== expectedAssessment) {
    fail(
      `field 'final_assessment' is '${j.final_assessment}' but the scorecard-derived sentence is '${expectedAssessment}'`,
      filePath
    );
  }
  const emitRepoPath = `orbit/changes/${j.change}/.orbit-runs/${path.basename(filePath)}`;
  const expectedNext =
    findings.length > 0
      ? `/orbit:address-reviews ${j.change} --from-file ${emitRepoPath}`
      : `orbit status --change ${j.change} --report`;
  if (j.next_recommended !== expectedNext) {
    fail(
      `field 'next_recommended' is '${j.next_recommended}' but the deterministic pointer is '${expectedNext}'`,
      filePath
    );
  }

  return {
    genre: 'internal',
    filePath,
    change: j.change as string,
    mode: j.mode as ReviewMode,
    reviewerClass: j.reviewer_class as ReviewerClass,
    depth: j.depth as string,
    scorecard,
    findings,
    suppressed,
    ...(typeof j.commentary === 'string' ? { commentary: j.commentary } : {}),
    ...(blocks !== undefined ? { blocks } : {}),
    ...(direction !== undefined ? { direction } : {}),
    ...(verification !== undefined ? { verification } : {}),
  };
}

// -----------------------------------------------------------------------------
// External findings parse → the normalized render shape (fence-aware)
// -----------------------------------------------------------------------------

function reject(detail: string, file: string): never {
  throw new Error(`external findings parse rejected: ${detail} in ${file}`);
}

/** Strip a trailing `:line` (and `:line:col`) suffix for matching only. */
function stripLineSuffix(file: string): string {
  return file.replace(/:\d+(:\d+)?$/, '').trim();
}

/** Syntactic YYYY-MM-DD that round-trips as a real UTC calendar date (W3). */
function isRealCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * The ONE line splitter for verbatim bodies under blockquote containment. CommonMark treats a
 * bare carriage return as a line ending, so a body split on `\n` alone leaves the text after a
 * `\r` at column 0 where it can forge the report's own grammar (rc04b system blind pair, external
 * W1 — the direction inherited the hole from the three older bodies). Every containment site
 * splits here; the single-line slots refuse CR and LF outright (`requireSingleLine`).
 */
function containedLines(body: string): string[] {
  return body.split(/\r\n|\r|\n/);
}

function trimBlankEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end);
}

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
export function normalizeExternalPass(filePath: string, content: string): NormalizedReviewPass {
  const name = path.basename(filePath);
  const modeMatch = name.match(/^external-(proposal|system)-/);
  if (!modeMatch) reject(`filename does not match external-(proposal|system)-<TS>.md`, filePath);
  const mode = modeMatch![1] as ReviewMode;

  interface DraftFinding {
    severity: Severity;
    title: string;
    fileRef?: string;
    /** null until the `**Description**:` line opens the body. */
    descLines: string[] | null;
    /** null until a `**Reproduction**:` line (after Description) opens the body. */
    reproLines: string[] | null;
  }

  const lines = content.split(/\r?\n/);
  const fence = createFenceTracker();
  let hasHeader = false;
  const reviewerValues: string[] = [];
  const dateValues: string[] = [];
  const sawSections = new Set<Severity>();
  // The header region is LATCHED closed at the first `## ` heading: later
  // header-shaped lines (`# External Review`, `**Reviewer**:`) inside an open
  // body are verbatim content, never structure or duplicate metadata.
  let headerRegion = true;
  let section: Severity | 'notes' | 'blocks' | 'direction' | 'other' | null = null;
  let current: DraftFinding | null = null;
  const drafts: DraftFinding[] = [];
  let notesLines: string[] | null = null;
  const blockItems: string[] = [];
  // rc04b: the FIRST `## Direction` section's lines; the count decides MALFORMED on a second.
  let directionLines: string[] | null = null;
  let directionSections = 0;

  const closeCurrent = (): void => {
    if (current) drafts.push(current);
    current = null;
  };

  for (const line of lines) {
    const wasInFence = fence.inFence;
    const fenceDelim = fence.handle(line);
    let structural = false;

    if (!wasInFence && !fenceDelim) {
      const sec = line.match(/^##\s+(CRITICAL|WARNING|SUGGESTION)\s*$/);
      if (headerRegion && /^#\s+External Review\b/i.test(line)) {
        hasHeader = true;
        closeCurrent();
        section = null;
        structural = true;
      } else if (sec) {
        headerRegion = false;
        closeCurrent();
        section = sec[1] as Severity;
        sawSections.add(section);
        structural = true;
      } else if (/^##\s+Notes\s*$/i.test(line)) {
        headerRegion = false;
        closeCurrent();
        section = 'notes';
        notesLines = [];
        structural = true;
      } else if (/^##\s+Blocks\s*$/i.test(line)) {
        headerRegion = false;
        closeCurrent();
        section = 'blocks';
        structural = true;
      } else if (/^##\s+Direction\s*$/i.test(line)) {
        headerRegion = false;
        closeCurrent();
        section = 'direction';
        directionSections += 1;
        if (directionLines === null) directionLines = [];
        structural = true;
      } else if (/^##\s+/.test(line)) {
        headerRegion = false;
        closeCurrent();
        section = 'other';
        structural = true;
      } else if (headerRegion && /^\*\*Reviewer\*\*:/.test(line)) {
        // Reviewer/Date recognition is scoped to the pre-severity HEADER
        // REGION (W4): the region latches CLOSED at the first `## ` heading,
        // so header-shaped prose in a later body — including a quoted
        // `# External Review` line — is verbatim content, never structure.
        reviewerValues.push(line.replace(/^\*\*Reviewer\*\*:/, '').trim());
        structural = true;
      } else if (headerRegion && /^\*\*Date\*\*:/.test(line)) {
        dateValues.push(line.replace(/^\*\*Date\*\*:/, '').trim());
        structural = true;
      } else if (section === 'blocks') {
        // A Blocks item is a `- ` line; anything else here — a heading-shaped line, a
        // field-shaped line, `None.` — is content of no finding and no block. A BULLETED
        // `- None.` is the empty-section sentinel the severity sections prime a reviewer to
        // write, not a block (rc02b system blind pair, fresh S4).
        const item = line.match(/^-\s+(.*\S)\s*$/);
        if (item && !/^none\.?$/i.test(item[1])) blockItems.push(item[1]);
        structural = true;
      } else if (section && section !== 'notes' && section !== 'other' && section !== 'direction') {
        const title = line.match(/^###\s+(.*\S)\s*$/);
        if (title) {
          closeCurrent();
          current = { severity: section, title: title[1].trim(), descLines: null, reproLines: null };
          structural = true;
        } else if (current && current.descLines === null) {
          const fileField = line.match(/^\*\*File\*\*:\s*(.*\S)\s*$/i);
          const descField = line.match(/^\*\*Description\*\*:\s?(.*)$/i);
          if (fileField && current.fileRef === undefined) {
            current.fileRef = fileField[1];
            structural = true;
          } else if (descField) {
            current.descLines = descField[1] === '' ? [] : [descField[1]];
            structural = true;
          }
        } else if (current && current.reproLines === null) {
          // The ONE field label recognised after Description opens (the field-line rule).
          const reproField = line.match(/^\*\*Reproduction\*\*:\s?(.*)$/i);
          if (reproField) {
            current.reproLines = reproField[1] === '' ? [] : [reproField[1]];
            structural = true;
          }
        }
      }
    }

    if (!structural) {
      if (current && current.reproLines !== null) current.reproLines.push(line);
      else if (current && current.descLines !== null) current.descLines.push(line);
      else if (section === 'notes' && notesLines) notesLines.push(line);
      // Only the FIRST section's lines are kept: a second one is malformed whatever it says.
      else if (section === 'direction' && directionSections === 1 && directionLines) directionLines.push(line);
    }
  }
  closeCurrent();

  // Shape gate: header + uniquely-parsed Reviewer/Date + all three sections.
  if (!hasHeader) reject(`missing '# External Review:' header`, filePath);
  for (const [field, values] of [
    ['**Reviewer**:', reviewerValues],
    ['**Date**:', dateValues],
  ] as const) {
    if (values.length === 0) reject(`missing '${field}' field`, filePath);
    if (values.length > 1) reject(`duplicate '${field}' field`, filePath);
    if (values[0] === '') reject(`malformed (empty) '${field}' field`, filePath);
  }
  // W3: the date must be a REAL calendar date — syntactic YYYY-MM-DD alone
  // admits 2026-02-30; the round-trip check rejects it with the same clarity
  // as 'banana'.
  if (!isRealCalendarDate(dateValues[0])) {
    reject(
      `malformed '**Date**:' field (expected a real YYYY-MM-DD calendar date, got '${dateValues[0]}')`,
      filePath
    );
  }
  for (const sev of SEVERITIES) {
    if (!sawSections.has(sev)) reject(`missing '## ${sev}' section`, filePath);
  }

  const findings: NormalizedFinding[] = drafts.map(d => {
    if (d.fileRef === undefined) {
      reject(`finding '${d.title}' missing '**File**:' field`, filePath);
    }
    if (d.descLines === null) {
      reject(`finding '${d.title}' missing '**Description**:' body`, filePath);
    }
    const recommendation = trimBlankEdges(d.descLines!).join('\n');
    // W3: a Description with no body after trimming is a rejection, not an
    // empty verbatim recommendation.
    if (recommendation === '') {
      reject(`finding '${d.title}' has a blank '**Description**:' body`, filePath);
    }
    // A present-but-blank Reproduction body is no reproduction: the mark is by absence.
    const reproduction = d.reproLines ? trimBlankEdges(d.reproLines).join('\n') : '';
    return {
      severity: d.severity,
      title: d.title,
      fileRef: d.fileRef!,
      matchFile: stripLineSuffix(d.fileRef!),
      recommendation,
      ...(reproduction !== '' ? { reproduction } : {}),
    };
  });

  const notesBody = notesLines ? trimBlankEdges(notesLines).join('\n') : '';

  // rc04b: the direction — the format owner's four MALFORMED cases, else the opener's token
  // and the trimmed reasoning body. Never a rejection.
  let direction: ReviewDirection | 'malformed' | undefined;
  if (directionSections > 1) {
    direction = 'malformed';
  } else if (directionLines !== null) {
    const body = trimBlankEdges(directionLines);
    const opener = body.length > 0 ? body[0].match(/^\*\*Disposition\*\*:\s*(forward|hold)\s*$/) : null;
    const reasoning = trimBlankEdges(body.slice(1)).join('\n');
    direction = opener && reasoning !== '' ? { disposition: opener[1] as 'forward' | 'hold', reasoning } : 'malformed';
  }

  return {
    genre: 'external',
    filePath,
    mode,
    reviewerClass: 'external',
    reviewerName: reviewerValues[0],
    reviewerDate: dateValues[0],
    findings,
    suppressed: [],
    ...(notesBody !== '' ? { commentary: notesBody } : {}),
    ...(blockItems.length > 0 ? { blocks: blockItems } : {}),
    ...(direction !== undefined ? { direction } : {}),
  };
}

// -----------------------------------------------------------------------------
// The pure render (design D2b's grammar — goldens transcribe, never author)
// -----------------------------------------------------------------------------

/** Scorecard table at D2b's exact column widths (cells space-padded to header widths). */
function renderScorecard(sc: Scorecard): string {
  const row = (label: string, c: ScorecardCells): string =>
    `| ${label.padEnd(12)} | ${String(c.critical).padEnd(8)} | ${String(c.warning).padEnd(7)} | ${String(c.suggestion).padEnd(10)} |`;
  return [
    '| Dimension    | Critical | Warning | Suggestion |',
    '|--------------|----------|---------|------------|',
    row('Completeness', sc.completeness),
    row('Correctness', sc.correctness),
    row('Coherence', sc.coherence),
  ].join('\n');
}

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
export function renderReviewReport(pass: NormalizedReviewPass, ctx: ReportContext): string {
  const blocks: string[] = [];

  // C3: an internal emit's own `change` must EQUAL the change being rendered
  // (the CLI/trail selection) — a mismatch is a fail-loud error, never a silent
  // relabel. The header then renders the VALIDATED emit value (identical bytes,
  // but the source is the emit per design D2b).
  if (pass.genre === 'internal' && pass.change !== ctx.change) {
    fail(
      `emit 'change' is '${pass.change}' but the rendered change is '${ctx.change}'`,
      pass.filePath
    );
  }
  const change = pass.genre === 'internal' ? pass.change! : ctx.change;
  blocks.push(`## Review: ${change} --as ${pass.mode}`);

  const modeLine =
    pass.genre === 'internal'
      ? `Mode: ${pass.mode} · Iteration: ${ctx.iteration} · Reviewer: ${pass.reviewerClass} · Depth: ${pass.depth}` +
        (ctx.passGenre !== undefined ? ` · Pass genre: ${ctx.passGenre}` : '')
      : `Mode: ${pass.mode} · Iteration: ${ctx.iteration} · Reviewer: external (${pass.reviewerName}, ${pass.reviewerDate})`;
  const trendLine =
    ctx.trend.length <= 1
      ? `First ${pass.mode}-mode review of this change.`
      : `Trend: ${ctx.trend
          .map(p => `${p.critical}C/${p.warning}W/${p.suggestion}S`)
          .join(' → ')} (${ctx.repeatCount ?? 0} repeat, ${ctx.newCount ?? 0} new)`;
  blocks.push(`${modeLine}\n${trendLine}`);

  // Scorecard renders for INTERNAL passes only (external has none — omitted whole).
  if (pass.genre === 'internal' && pass.scorecard) {
    blocks.push(renderScorecard(pass.scorecard));
  }

  // rc02b: lifecycle BLOCKS render ABOVE the findings, one `- ` line each (single-line
  // slots, checked at normalization), for both genres; omitted whole when none. They feed
  // no scorecard cell and no gate input — `orbit-report-rendering`'s Blocks slot.
  if (pass.blocks && pass.blocks.length > 0) {
    blocks.push(['### Blocks', ...pass.blocks.map(b => `- ${b}`)].join('\n'));
  }

  // rc03c: a VERIFICATION-genre internal pass renders its walk links and, when it CARRIES a record,
  // marks every finding outside it; REVIEW-genre and external passes render neither.
  const verifying = pass.genre === 'internal' && ctx.passGenre === 'VERIFICATION';
  const carrying = verifying && pass.verification !== undefined;

  if (pass.findings.length > 0) {
    blocks.push('### Findings');
    for (const sev of SEVERITIES) {
      const group = pass.findings.filter(f => f.severity === sev);
      if (group.length === 0) continue; // empty severity subsection omitted
      const lines: string[] = [`#### ${sev}`];
      for (const f of group) {
        // rc02b: a CRITICAL carrying no reproduction is MARKED — a PREFIX before the bold
        // file ref, OUTSIDE the title token, so a copied line still yields the gate's exact
        // title (Q-crc-17). By absence, never by date: on internal passes absence is exactly
        // the prior-generation set (the write gate refuses new ones); on external passes the
        // file could not be refused. The severity is the author's and is never re-graded.
        const mark = f.severity === 'CRITICAL' && f.reproduction === undefined ? '[unreproduced] ' : '';
        // rc03c: `[outside the walk record]` — a PREFIX outside the title token, after
        // `[unreproduced]` when both apply; only on a pass CARRYING a verification record.
        const outside = carrying && f.walkEntry === undefined ? '[outside the walk record] ' : '';
        lines.push(`- ${mark}${outside}**${f.fileRef}** — ${f.title}`);
        if (verifying && f.walkEntry !== undefined) {
          lines.push(`  walk entry: ${f.walkEntry.title} (\`${f.walkEntry.file}\`)`);
        }
        // Blockquote containment at two-space indent: every source line
        // prefixed verbatim — none can forge report grammar at column 0.
        for (const l of containedLines(f.recommendation)) lines.push(`  > ${l}`);
        // rc02b: the reproduction, labelled, directly under the recommendation and under the
        // same containment — before the options, which are labels for choices, not evidence.
        if (f.reproduction !== undefined) {
          lines.push('  > Reproduction:');
          for (const l of containedLines(f.reproduction)) lines.push(`  > ${l}`);
        }
        for (const o of f.recommendationOptions ?? []) {
          // Option bodies are labels for choices, not documents: single-line,
          // embedded newlines collapsed to one space.
          lines.push(`  - (${o.label}) ${o.body.replace(/\r?\n/g, ' ')}`);
        }
      }
      blocks.push(lines.join('\n'));
    }
  }

  if (pass.suppressed.length > 0) {
    blocks.push(
      ['### Suppressed', ...pass.suppressed.map(s => `- ${s.title} — ${s.evidence}`)].join('\n')
    );
  }

  // rc03c: the Verification section — FRAME, not quarantine: the verdict token is from a closed
  // set, title and file are checked single-line slots, and the walk token and linked findings are
  // ENGINE-derived. A VERIFICATION-genre pass always renders the section; a REVIEW-genre or
  // external pass never does.
  if (verifying) {
    const rows: string[] = [];
    if (pass.verification === undefined) {
      rows.push('[no verification record]');
    } else {
      for (const v of pass.verification) {
        const k = keyString(v);
        const walk = ctx.verification?.latestWalk.get(k);
        let row = `- ${v.verdict} — ${v.title} (\`${v.file}\`)${walk !== undefined ? ` · walk ${walk}` : ''}`;
        if (v.verdict === 'regressed') {
          const see = pass.findings.filter(f => f.walkEntry !== undefined && keyString(f.walkEntry) === k).map(f => f.title);
          if (see.length > 0) row += ` · see: ${see.join('; ')}`;
        }
        rows.push(row);
      }
      for (const w of ctx.verification?.unreadable ?? []) rows.push(`- walk ${w} — unreadable; nothing owed`);
      if (rows.length === 0) rows.push('- no verdicts owed — every entry of the verified walks claims no edit');
    }
    blocks.push(['### Verification', ...rows].join('\n'));
  }

  // rc04b: the Direction section — `Disposition: <token>` is a label the ENGINE prints from the
  // closed set (no record-sourced text at column 0), the reasoning under blockquote containment.
  // The two MARKS are by absence, never by date, and change no count and no gate input: an
  // independent pass (the gate model's one predicate, on both genres) with no direction renders
  // `[no direction]`; an external section the format owner reads as malformed renders
  // `[direction malformed]` with NO body (it cannot be trusted to have marked where the reasoning
  // begins); an in-context pass without one omits the section whole.
  if (pass.direction === 'malformed') {
    blocks.push('### Direction\n[direction malformed]');
  } else if (pass.direction !== undefined) {
    blocks.push(`### Direction\nDisposition: ${pass.direction.disposition}`);
    blocks.push(containedLines(pass.direction.reasoning).map(l => `> ${l}`).join('\n'));
  } else if (pass.reviewerClass !== undefined && isIndependent(pass.reviewerClass)) {
    blocks.push('### Direction\n[no direction]');
  }

  if (pass.commentary !== undefined) {
    blocks.push('### Commentary');
    blocks.push(containedLines(pass.commentary).map(l => `> ${l}`).join('\n'));
  }

  // The engine tail — ALWAYS last; each line only when the engine computed its
  // value. An ungated schema's tail is the `---` rule alone.
  const tail: string[] = ['---'];
  if (ctx.gateLine !== undefined) tail.push(ctx.gateLine);
  if (ctx.position !== undefined) tail.push(`Position: ${ctx.position}`);
  if (ctx.nextCommand !== undefined) tail.push(`Ready when you are: ${ctx.nextCommand}`);
  blocks.push(tail.join('\n'));

  return blocks.join('\n\n') + '\n';
}

// -----------------------------------------------------------------------------
// Trail helpers: the ONE TOTAL PASS ORDER + tolerant trend counting
// -----------------------------------------------------------------------------

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

const INTERNAL_PASS_RE = /^review-(proposal|system)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/;
const EXTERNAL_PASS_RE = /^external-(proposal|system)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/;

/**
 * Counts the confident external findings files for one mode in a change's
 * trail — the orientation strip's shared-pass-axis contribution (D4: ONE
 * iteration semantics across surfaces — the ⟲N chip and the report ordinal
 * count the same axis). The same confidence gate lenient trail counting
 * applies (header + all three severity sections); an unreadable or
 * unconfident file contributes nothing.
 */
export function countConfidentExternalPasses(
  changeDir: string,
  mode: 'proposal' | 'system'
): number {
  const runsDir = path.join(changeDir, '.orbit-runs');
  let names: string[];
  try {
    names = fs.readdirSync(runsDir);
  } catch {
    return 0;
  }
  let count = 0;
  for (const name of names) {
    const m = name.match(EXTERNAL_PASS_RE);
    if (!m || m[1] !== mode) continue;
    let content: string;
    try {
      content = fs.readFileSync(path.join(runsDir, name), 'utf-8');
    } catch {
      continue;
    }
    if (lenientExternalCounts(content)) count++;
  }
  return count;
}

/**
 * The shared total-order comparator (orbit-orientation's tie-break): token
 * ascending; on equal tokens the lexicographically-EARLIER filename is MORE
 * recent, so it sorts LAST and `.at(-1)` selects it. The SAME order governs
 * newest selection, explicit-token resolution, trail ordinals, prior-pass
 * matching, and the trend prefix.
 */
function compareTotalOrder(a: { token: string; name: string }, b: { token: string; name: string }): number {
  return a.token < b.token ? -1 : a.token > b.token ? 1 : a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
}

/**
 * Enumerates ALL of a change's `.orbit-runs/` trail artifacts (every genre — so
 * explicit-token dispatch can name a propose/apply emit cleanly), sorted in the
 * total order. Raw resolution step: no parsing, no gate-reader reuse.
 */
export function listTrailArtifacts(changeDir: string): TrailArtifact[] {
  const runsDir = path.join(changeDir, '.orbit-runs');
  let entries: string[];
  try {
    entries = fs.readdirSync(runsDir);
  } catch {
    return [];
  }
  const artifacts: TrailArtifact[] = [];
  for (const name of entries) {
    const token = parseTsToken(name);
    if (!token) continue;
    const full = path.join(runsDir, name);
    const internal = name.match(INTERNAL_PASS_RE);
    const external = name.match(EXTERNAL_PASS_RE);
    if (internal) {
      artifacts.push({ token, file: full, name, renderable: true, passKind: 'internal', mode: internal[1] as ReviewMode });
    } else if (external) {
      artifacts.push({ token, file: full, name, renderable: true, passKind: 'external', mode: external[1] as ReviewMode });
    } else {
      artifacts.push({ token, file: full, name, renderable: false });
    }
  }
  artifacts.sort(compareTotalOrder);
  return artifacts;
}

/** A same-mode pass as trail counting sees it (TOLERANT — this is counting, not rendering). */
export interface TrailOrderPass {
  token: string;
  file: string;
  name: string;
  counts: ScorecardCells;
  /** Trimmed-title + line-stripped-path pairs for repeat/new matching. */
  findings: { title: string; matchFile: string }[];
}

function sumScorecardSeverity(scorecard: Record<string, unknown>, sev: string): number | null {
  let sum = 0;
  let sawAny = false;
  for (const dim of DIMENSIONS) {
    const cells = scorecard[dim];
    if (isPlainObject(cells) && typeof cells[sev] === 'number') {
      sum += cells[sev] as number;
      sawAny = true;
    }
  }
  return sawAny ? sum : null;
}

/**
 * Lenient external severity-section counter (best-effort; trail.ts-shaped gate).
 *
 * rc02b system blind pair (fresh W1): this is a THIRD copy of the external grammar — the trend/
 * ordinal counter whose `findings[].matchFile` feeds the repeat/new set — and it kept taking the
 * LAST `**File**:` line after the other two readers were brought to `orbit-conventions`' field-line
 * rule, so a path quoted inside a Reproduction body re-filed the finding in the trend line alone.
 * It now follows the rule (fields are read only until a Description body opens). The three copies
 * are Q-crc-15's shape, one wider than it counted; collapsing them is that question's, not this
 * patch's.
 */
function lenientExternalCounts(content: string): TrailOrderPass['counts'] & { findings: { title: string; matchFile: string }[] } | null {
  const lines = content.split(/\r?\n/);
  let hasHeader = false;
  const sawSections = new Set<string>();
  let section: Severity | null = null;
  const counts: ScorecardCells = { critical: 0, warning: 0, suggestion: 0 };
  const findings: { title: string; matchFile: string }[] = [];
  const fence = createFenceTracker(); // the SAME tracker as the strict parser (S1)
  let descOpen = false;
  for (const line of lines) {
    const wasInFence = fence.inFence;
    if (fence.handle(line) || wasInFence) continue;
    if (/^#\s+External Review\b/i.test(line)) hasHeader = true;
    const sec = line.match(/^##\s+(CRITICAL|WARNING|SUGGESTION)\s*$/);
    if (sec) {
      section = sec[1] as Severity;
      sawSections.add(sec[1]);
      descOpen = false;
      continue;
    }
    if (/^##\s+/.test(line)) {
      section = null;
      descOpen = false;
      continue;
    }
    if (!section) continue;
    const title = line.match(/^###\s+(.*\S)\s*$/);
    if (title) {
      counts[section.toLowerCase() as keyof ScorecardCells]++;
      findings.push({ title: title[1].trim(), matchFile: '' });
      descOpen = false;
      continue;
    }
    if (descOpen) continue; // inside a Description/Reproduction body: content, never a field
    if (/^\*\*Description\*\*:/i.test(line)) {
      descOpen = true;
      continue;
    }
    const fileField = line.match(/^\*\*File\*\*:\s*(.*\S)\s*$/i);
    if (fileField && findings.length > 0) {
      findings[findings.length - 1].matchFile = stripLineSuffix(fileField[1]);
    }
  }
  if (!hasHeader || sawSections.size < 3) return null; // contributes nothing
  return { ...counts, findings };
}

/**
 * Collects the change's same-mode review passes in the total order, with
 * TOLERANT severity counting for trend/ordinal purposes (all generations count
 * here; only the RENDERED pass must be boundary-conformant): internal emits →
 * scorecard cell sums when present, else `findings_summary` counts, else the
 * findings[] severity count (absent findings → 0); external files → lenient
 * severity-section counts (a parse-rejected external contributes nothing).
 */
export function collectSameModePasses(changeDir: string, mode: ReviewMode): TrailOrderPass[] {
  const passes: TrailOrderPass[] = [];
  for (const a of listTrailArtifacts(changeDir)) {
    if (!a.renderable || a.mode !== mode) continue;
    if (a.passKind === 'internal') {
      let json: unknown;
      try {
        json = JSON.parse(fs.readFileSync(a.file, 'utf-8'));
      } catch {
        continue; // unreadable → contributes nothing to trail counting
      }
      if (!isPlainObject(json)) continue;
      const findingsArr: unknown[] = Array.isArray(json.findings) ? json.findings : [];
      const findings = findingsArr
        .filter(isPlainObject)
        .map(f => ({
          title: String(f.title ?? '').trim(),
          matchFile: stripLineSuffix(String(f.file ?? '')),
        }));
      const summary = isPlainObject(json.findings_summary) ? json.findings_summary : {};
      const counts = {} as ScorecardCells;
      for (const sev of SEVERITY_CELLS) {
        const fromScorecard = isPlainObject(json.scorecard)
          ? sumScorecardSeverity(json.scorecard, sev)
          : null;
        counts[sev] =
          fromScorecard ??
          (typeof summary[sev] === 'number'
            ? (summary[sev] as number)
            : findingsArr.filter(f => isPlainObject(f) && f.severity === sev.toUpperCase()).length);
      }
      passes.push({ token: a.token, file: a.file, name: a.name, counts, findings });
    } else {
      let content: string;
      try {
        content = fs.readFileSync(a.file, 'utf-8');
      } catch {
        continue;
      }
      const parsed = lenientExternalCounts(content);
      if (!parsed) continue;
      const { findings, ...counts } = parsed;
      passes.push({ token: a.token, file: a.file, name: a.name, counts, findings });
    }
  }
  return passes; // already in total order (listTrailArtifacts sorts)
}

// -----------------------------------------------------------------------------
// Render-time context computation (the caller side of the pure render)
// -----------------------------------------------------------------------------

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
export function buildReportContext(
  projectRoot: string,
  change: string,
  changeDir: string,
  pass: NormalizedReviewPass
): ReportContext {
  const sameMode = collectSameModePasses(changeDir, pass.mode);
  const idx = sameMode.findIndex(p => p.file === pass.filePath);
  if (idx === -1) {
    throw new Error(
      `invalid review emit: rendered pass ${pass.filePath} not found in the change's trail`
    );
  }
  const asOf = sameMode.slice(0, idx + 1);
  const trend = asOf.map(p => p.counts);

  let repeatCount: number | undefined;
  let newCount: number | undefined;
  if (asOf.length >= 2) {
    const prior = asOf[asOf.length - 2];
    const priorSet = new Set(prior.findings.map(f => JSON.stringify([f.title, f.matchFile])));
    repeatCount = pass.findings.filter(f =>
      priorSet.has(JSON.stringify([f.title.trim(), f.matchFile]))
    ).length;
    newCount = pass.findings.length - repeatCount;
  }

  // rc03c: the PASS GENRE, recomputed at render time over the records preceding the rendered pass
  // (internal passes only), with the engine-derived facts the Verification section prints.
  let passGenre: PassGenre | undefined;
  let verification: ReportContext['verification'];
  const ownToken = parseTsToken(path.basename(pass.filePath));
  if (pass.genre === 'internal' && pass.reviewerClass !== undefined && ownToken !== null) {
    const trail = readTrail(changeDir);
    const g = computePassGenre(trail, pass.reviewerClass, pass.mode, ownToken);
    passGenre = g.passGenre;
    if (g.passGenre === 'VERIFICATION') {
      const ledger = verificationLedger(trail, g.verifiedWalks);
      verification = {
        latestWalk: new Map([...ledger.owed].map(([k, o]) => [k, o.walk])),
        unreadable: ledger.unreadable,
      };
    }
  }

  // The engine tail — the phase gate the mode maps to; each line only when the
  // status computation yields it. The reviewer cannot author any of these.
  let gateLine: string | undefined;
  let position: string | undefined;
  let nextCommand: string | undefined;
  try {
    const context = loadChangeContext(projectRoot, change);
    const status = formatChangeStatus(context);
    const gateId = pass.mode === 'proposal' ? 'review-proposal' : 'review-system';
    const row = status.gates.find(g => g.id === gateId);
    if (row) gateLine = `Gate ${row.id}: ${row.state}${row.reason ? ` — ${row.reason}` : ''}`;
    position = status.position;
    nextCommand =
      status.next_command !== undefined
        ? withModelHint(status.next_command, modelHintFor(projectRoot, status.next_hint_keys))
        : undefined;
  } catch (err) {
    // NOT the ungated case (that path returns absent values without throwing):
    // a throw here is a broken schema/metadata — a clean report failure (W1).
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`report tail computation failed for '${change}': ${cause}`);
  }

  return {
    change,
    iteration: idx + 1,
    trend,
    ...(repeatCount !== undefined ? { repeatCount, newCount } : {}),
    ...(passGenre !== undefined ? { passGenre } : {}),
    ...(verification !== undefined ? { verification } : {}),
    ...(gateLine !== undefined ? { gateLine } : {}),
    ...(position !== undefined ? { position } : {}),
    ...(nextCommand !== undefined ? { nextCommand } : {}),
  };
}

// -----------------------------------------------------------------------------
// The `--report` orchestration (resolution → dispatch → normalize → render)
// -----------------------------------------------------------------------------

const RENDERABLE_SET =
  'renderable: review passes (review-(proposal|system)-<TS>.json) and external findings (external-(proposal|system)-<TS>.md)';

/** Best-effort genre name for a non-renderable artifact (spine `command` first). */
function artifactGenre(artifact: TrailArtifact): string {
  if (artifact.name.endsWith('.json')) {
    try {
      const json = JSON.parse(fs.readFileSync(artifact.file, 'utf-8'));
      if (isPlainObject(json) && typeof json.command === 'string') return json.command;
    } catch {
      // fall through to the filename-derived genre
    }
  }
  return artifact.name.replace(/-?\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z.*$/, '');
}

/**
 * Renders the report for a change: no `<TS>` → the NEWEST renderable pass on
 * the shared recency axis; explicit `<TS>` → resolved against ALL trail
 * artifacts (tie-break on multiple matches), review passes rendering and any
 * other genre failing with a clean error naming the genre and the renderable
 * set. READ-ONLY: creates and modifies no files. Throws clean errors (the CLI
 * exits non-zero); prints nothing itself.
 */
export function renderReport(projectRoot: string, change: string, ts?: string): string {
  const changeDir = path.join(projectRoot, 'orbit', 'changes', change);
  const artifacts = listTrailArtifacts(changeDir);

  let target: TrailArtifact;
  if (ts === undefined) {
    const renderables = artifacts.filter(a => a.renderable);
    if (renderables.length === 0) {
      throw new Error(
        `no renderable review pass in '${change}' — the trail's renderable set is empty (${RENDERABLE_SET})`
      );
    }
    target = renderables[renderables.length - 1]; // newest in the total order
  } else {
    const matches = artifacts.filter(a => a.token === ts);
    if (matches.length === 0) {
      throw new Error(`no trail artifact matches token '${ts}' in '${change}' (${RENDERABLE_SET})`);
    }
    target = matches[matches.length - 1]; // shared tie-break resolves multi-matches
    if (!target.renderable) {
      throw new Error(
        `emit genre '${artifactGenre(target)}' is not renderable — ${RENDERABLE_SET}`
      );
    }
  }

  let pass: NormalizedReviewPass;
  if (target.passKind === 'internal') {
    let json: unknown;
    try {
      json = JSON.parse(fs.readFileSync(target.file, 'utf-8'));
    } catch {
      fail('unreadable or invalid JSON', target.file);
    }
    pass = normalizeInternalPass(target.file, json!);
  } else {
    let content: string;
    try {
      content = fs.readFileSync(target.file, 'utf-8');
    } catch {
      reject('unreadable file', target.file);
    }
    pass = normalizeExternalPass(target.file, content!);
  }

  const ctx = buildReportContext(projectRoot, change, changeDir, pass);
  return renderReviewReport(pass, ctx);
}
