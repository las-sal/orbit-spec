import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadChangeContext,
  formatChangeStatus,
  parseTsToken,
  type ReviewMode,
} from './artifact-graph/index.js';

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
}

export interface NormalizedReviewPass {
  genre: 'internal' | 'external';
  filePath: string;
  mode: ReviewMode;
  /** Internal genre fields. */
  reviewerClass?: string;
  depth?: string;
  scorecard?: Scorecard;
  /** External genre fields (parsed header). */
  reviewerName?: string;
  reviewerDate?: string;
  findings: NormalizedFinding[];
  suppressed: { title: string; evidence: string }[];
  /** Internal `commentary` field / external `## Notes` body. Absent = section omitted. */
  commentary?: string;
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

function fail(detail: string, file: string): never {
  throw new Error(`invalid review emit: ${detail} in ${file}`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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
    if (typeof f.file !== 'string' || f.file.length === 0) {
      fail(`missing or mistyped field '${at}.file'`, filePath);
    }
    if (typeof f.line !== 'number' || !Number.isFinite(f.line)) {
      fail(`missing or mistyped field '${at}.line'`, filePath);
    }
    if (typeof f.recommendation !== 'string') {
      fail(`missing or mistyped field '${at}.recommendation'`, filePath);
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
    };
  });

  // Optional absent-safe fields — validated for shape only when present.
  if (j.commentary !== undefined && typeof j.commentary !== 'string') {
    fail(`mistyped field 'commentary'`, filePath);
  }
  const suppressed: { title: string; evidence: string }[] = [];
  if (j.stale_suppressed !== undefined) {
    if (!Array.isArray(j.stale_suppressed)) fail(`mistyped field 'stale_suppressed'`, filePath);
    for (const [i, raw] of j.stale_suppressed.entries()) {
      if (!isPlainObject(raw) || typeof raw.title !== 'string' || typeof raw.evidence !== 'string') {
        fail(`missing or mistyped field 'stale_suppressed[${i}]'`, filePath);
      }
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

  return {
    genre: 'internal',
    filePath,
    mode: j.mode as ReviewMode,
    reviewerClass: j.reviewer_class as string,
    depth: j.depth as string,
    scorecard,
    findings,
    suppressed,
    ...(typeof j.commentary === 'string' ? { commentary: j.commentary } : {}),
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
 * `**Reviewer**:` and `**Date**:` fields; all three severity sections; per
 * finding a `### <title>`, a `**File**:` reference (line RETAINED), and a
 * `**Description**:` body (the verbatim recommendation). `## Notes` (when
 * present) supplies the Commentary slot. A shape the parser cannot confidently
 * parse is a REJECTION naming the field and file — non-renderable, no partial.
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
  }

  const lines = content.split(/\r?\n/);
  let inFence = false;
  let hasHeader = false;
  const reviewerValues: string[] = [];
  const dateValues: string[] = [];
  const sawSections = new Set<Severity>();
  let section: Severity | 'notes' | 'other' | null = null;
  let current: DraftFinding | null = null;
  const drafts: DraftFinding[] = [];
  let notesLines: string[] | null = null;

  const closeCurrent = (): void => {
    if (current) drafts.push(current);
    current = null;
  };

  for (const line of lines) {
    const fenceDelim = /^(`{3,}|~{3,})/.test(line);
    let structural = false;

    if (!inFence && !fenceDelim) {
      const sec = line.match(/^##\s+(CRITICAL|WARNING|SUGGESTION)\s*$/);
      if (/^#\s+External Review\b/i.test(line)) {
        hasHeader = true;
        closeCurrent();
        section = null;
        structural = true;
      } else if (sec) {
        closeCurrent();
        section = sec[1] as Severity;
        sawSections.add(section);
        structural = true;
      } else if (/^##\s+Notes\s*$/i.test(line)) {
        closeCurrent();
        section = 'notes';
        notesLines = [];
        structural = true;
      } else if (/^##\s+/.test(line)) {
        closeCurrent();
        section = 'other';
        structural = true;
      } else if (/^\*\*Reviewer\*\*:/.test(line)) {
        reviewerValues.push(line.replace(/^\*\*Reviewer\*\*:/, '').trim());
        structural = true;
      } else if (/^\*\*Date\*\*:/.test(line)) {
        dateValues.push(line.replace(/^\*\*Date\*\*:/, '').trim());
        structural = true;
      } else if (section && section !== 'notes' && section !== 'other') {
        const title = line.match(/^###\s+(.*\S)\s*$/);
        if (title) {
          closeCurrent();
          current = { severity: section, title: title[1].trim(), descLines: null };
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
        }
      }
    }

    if (!structural) {
      if (current && current.descLines !== null) current.descLines.push(line);
      else if (section === 'notes' && notesLines) notesLines.push(line);
    }
    if (fenceDelim) inFence = !inFence;
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
    return {
      severity: d.severity,
      title: d.title,
      fileRef: d.fileRef!,
      matchFile: stripLineSuffix(d.fileRef!),
      recommendation: trimBlankEdges(d.descLines!).join('\n'),
    };
  });

  const notesBody = notesLines ? trimBlankEdges(notesLines).join('\n') : '';

  return {
    genre: 'external',
    filePath,
    mode,
    reviewerName: reviewerValues[0],
    reviewerDate: dateValues[0],
    findings,
    suppressed: [],
    ...(notesBody !== '' ? { commentary: notesBody } : {}),
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
 * scorecard (internal only) → findings by severity → suppressed → the ONE
 * delimited Commentary slot → the engine tail LAST. Empty sections are omitted
 * whole. Verbatim multi-line bodies render under BLOCKQUOTE CONTAINMENT so no
 * source line sits at column 0 (forged headings/rules/fences impossible).
 */
export function renderReviewReport(pass: NormalizedReviewPass, ctx: ReportContext): string {
  const blocks: string[] = [];

  blocks.push(`## Review: ${ctx.change} --as ${pass.mode}`);

  const modeLine =
    pass.genre === 'internal'
      ? `Mode: ${pass.mode} · Iteration: ${ctx.iteration} · Reviewer: ${pass.reviewerClass} · Depth: ${pass.depth}`
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

  if (pass.findings.length > 0) {
    blocks.push('### Findings');
    for (const sev of SEVERITIES) {
      const group = pass.findings.filter(f => f.severity === sev);
      if (group.length === 0) continue; // empty severity subsection omitted
      const lines: string[] = [`#### ${sev}`];
      for (const f of group) {
        lines.push(`- **${f.fileRef}** — ${f.title}`);
        // Blockquote containment at two-space indent: every source line
        // prefixed verbatim — none can forge report grammar at column 0.
        for (const l of f.recommendation.split('\n')) lines.push(`  > ${l}`);
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

  if (pass.commentary !== undefined) {
    blocks.push('### Commentary');
    blocks.push(
      pass.commentary
        .split('\n')
        .map(l => `> ${l}`)
        .join('\n')
    );
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

/** Lenient external severity-section counter (best-effort; trail.ts-shaped gate). */
function lenientExternalCounts(content: string): TrailOrderPass['counts'] & { findings: { title: string; matchFile: string }[] } | null {
  const lines = content.split(/\r?\n/);
  let hasHeader = false;
  const sawSections = new Set<string>();
  let section: Severity | null = null;
  const counts: ScorecardCells = { critical: 0, warning: 0, suggestion: 0 };
  const findings: { title: string; matchFile: string }[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#\s+External Review\b/i.test(line)) hasHeader = true;
    const sec = line.match(/^##\s+(CRITICAL|WARNING|SUGGESTION)\s*$/);
    if (sec) {
      section = sec[1] as Severity;
      sawSections.add(sec[1]);
      continue;
    }
    if (/^##\s+/.test(line)) {
      section = null;
      continue;
    }
    if (!section) continue;
    const title = line.match(/^###\s+(.*\S)\s*$/);
    if (title) {
      counts[section.toLowerCase() as keyof ScorecardCells]++;
      findings.push({ title: title[1].trim(), matchFile: '' });
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
 * per-change status computation the orientation surface composes from. The tail
 * is wrapped: if the status computation throws, the tail lines are simply not
 * computed — the report renders what exists.
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
    nextCommand = status.next_command;
  } catch {
    // Tail not computed — render what exists (the `---` rule still fences).
  }

  return {
    change,
    iteration: idx + 1,
    trend,
    ...(repeatCount !== undefined ? { repeatCount, newCount } : {}),
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
