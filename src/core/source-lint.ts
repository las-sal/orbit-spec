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

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { computeCodeRegionMask } from './markdown-fence.js';
import {
  readSourcesRegistry,
  resolveSourceValue,
  SOURCES_REGISTRY_PATH,
  SourceRegistryError,
  type DeclaredSource,
} from './sources-registry.js';

/**
 * A finding is DISCRIMINATED by `kind` and carries exactly the fields its kind defines: the
 * four failures have genuinely different shapes, and a single flat record would be
 * null-padded for three of them.
 */
export type SourceFinding =
  /** A fault in the registry itself — no markdown line, no source, no span. */
  | { kind: 'registry'; file: string; detail: string }
  /** A malformed delimiter — a line, but no span to compare and no source value. */
  | { kind: 'marker'; file: string; line: number; detail: string }
  /** A well-formed span naming nothing declared — a span, but no value exists. */
  | { kind: 'unknown-source'; file: string; line: number; source: string }
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
  /** Named reason when the file domain is empty, e.g. a checkout without git. */
  domainReason: string | null;
}

// The delimiters are matched EXACTLY — one literal space inside each comment, no tabs, no
// line breaks, no compact form. The spec says a comment that does not match the opener grammar
// exactly is INERT, and a tolerant regex turned `<!--src:stages-->` into a live span, so prose
// the contract declares inert could raise a false failure. Only NAME is a pattern.
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
export function checkSpanAgainstValue(spanText: string, sourceValue: string): boolean {
  return spanText.includes(sourceValue);
}

const OPENER_REGEX = /<!-- src:([a-z0-9][a-z0-9-]*) -->/g;
const CLOSER = '<!-- /src -->';
const CLOSER_REGEX = /<!-- \/src -->/g;

/**
 * The lint reads LIVING documents, never RECORDS. Every exclusion is decidable BY PATH, so
 * no judgment is asked of the engine; a figure inside a record was TRUE WHEN WRITTEN, and
 * linting it would demand rewriting history to match the present.
 */
export function isExcludedPath(repoRelative: string): boolean {
  const p = repoRelative.split(path.sep).join('/');
  const segments = p.split('/');
  // RECORDS — true when written.
  if (p.startsWith('orbit/changes/archive/')) return true;
  if (segments.includes('.orbit-runs')) return true;
  // FIXTURES and GOLDENS — their numbers are test data.
  if (p === 'test' || p.startsWith('test/')) return true;
  // TEMPLATES — placeholders, not claims. BOTH tiers: the package's own schemas and a
  // project-local schema directory (version-controlled when present).
  if (/^schemas\/[^/]+\/templates\//.test(p)) return true;
  if (/^orbit\/schemas\/[^/]+\/templates\//.test(p)) return true;
  // GENERATED — the source is what must be true.
  if (p.startsWith('.claude/')) return true;
  // HISTORICAL — superseded by their own names.
  const base = segments[segments.length - 1];
  if (base === 'README_OLD.md') return true;
  if (/^adopter-report-.*\.md$/.test(base)) return true;
  return false;
}

/**
 * The file domain is `git ls-files '*.md'` minus the declared exclusions. Git's tracked-file
 * list is the authority, so the domain closes by construction rather than by a directory
 * list an author remembers — with two consequences STATED rather than discovered: an
 * UNTRACKED markdown file is outside the domain until it is added, and where git cannot
 * answer at all the domain is EMPTY with a named reason, never an exception.
 */
export function resolveFileDomain(projectRoot: string): { files: string[]; reason: string | null } {
  let stdout: string;
  try {
    // `-z` is not a nicety: git's default `core.quotePath=true` C-quotes any path with a
    // non-ASCII byte (`"d\303\251-caf\303\251.md"`, quotes included), which then names no
    // file on disk and leaves the domain with no signal at all. Under `-z` git emits raw
    // bytes NUL-separated, which also makes a path containing a newline or surrounding
    // spaces safe — so paths are never trimmed either.
    stdout = execFileSync('git', ['ls-files', '-z', '--', '*.md'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    return {
      files: [],
      reason: `git could not list tracked files (no git, or not a repository): ${(err as Error).message.split('\n')[0]}`,
    };
  }
  const files = stdout
    .split('\0')
    .filter((l) => l.length > 0)
    .filter((l) => !isExcludedPath(l))
    .sort();
  return { files, reason: null };
}

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
 * A marker is INERT — neither an opener nor a closer — in three cases, so that prose ABOUT
 * the syntax never becomes prose CHECKED by it: a comment that does not match the opener
 * grammar exactly, a marker inside a fenced code block, and a marker inside an inline code
 * span. The third is required rather than cosmetic: this capability's own artifacts carry
 * conforming markers inside backticks.
 *
 * Pairing is a CLOSED table whose outcomes are of two kinds. A MARKER ERROR names the
 * offending delimiter's line, because there is no span to compare; an EMPTY span is NOT a
 * syntax error but a CHECK FAILURE, reported with the source value like any disagreeing
 * span. A marker error ABANDONS the rest of this file (pairing is no longer trustworthy
 * inside it) and nothing else: every other file still lints and still reports.
 */
export function parseMarkedSpans(content: string): { spans: ParsedSpan[]; error: MarkerError | null } {
  const code = computeCodeRegionMask(content);
  const lineOf = buildLineIndex(content);

  interface Delimiter {
    type: 'open' | 'close';
    start: number;
    end: number;
    source?: string;
  }
  const delimiters: Delimiter[] = [];

  OPENER_REGEX.lastIndex = 0;
  for (let m = OPENER_REGEX.exec(content); m !== null; m = OPENER_REGEX.exec(content)) {
    if (code[m.index]) continue;
    delimiters.push({ type: 'open', start: m.index, end: m.index + m[0].length, source: m[1] });
  }
  CLOSER_REGEX.lastIndex = 0;
  for (let m = CLOSER_REGEX.exec(content); m !== null; m = CLOSER_REGEX.exec(content)) {
    if (code[m.index]) continue;
    delimiters.push({ type: 'close', start: m.index, end: m.index + m[0].length });
  }
  delimiters.sort((a, b) => a.start - b.start);

  const spans: ParsedSpan[] = [];
  let open: Delimiter | null = null;
  for (const d of delimiters) {
    if (d.type === 'open') {
      if (open) {
        // The closer is anonymous, so nesting is not expressible; the FIRST opener's line
        // is the one named.
        return {
          spans,
          error: {
            line: lineOf(open.start),
            detail: `unclosed marker: '<!-- src:${open.source} -->' has no '${CLOSER}' before the next opener`,
          },
        };
      }
      open = d;
      continue;
    }
    if (!open) {
      return { spans, error: { line: lineOf(d.start), detail: `orphan closer: '${CLOSER}' with no open span` } };
    }
    spans.push({ source: open.source!, line: lineOf(open.start), text: content.slice(open.end, d.start) });
    open = null;
  }
  if (open) {
    return {
      spans,
      error: {
        line: lineOf(open.start),
        detail: `unclosed marker: '<!-- src:${open.source} -->' has no '${CLOSER}' before end of file`,
      },
    };
  }
  return { spans, error: null };
}

function buildLineIndex(content: string): (offset: number) => number {
  const starts: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') starts.push(i + 1);
  }
  return (offset: number) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

/**
 * Runs the source lint over a project. Never throws: every fault becomes a finding.
 */
export function runSourceLint(projectRoot: string): SourceLintResult {
  const registryFile = path.join(projectRoot, SOURCES_REGISTRY_PATH);
  if (!fs.existsSync(registryFile)) {
    // No registry → no sources, no markers, no lint: the state of every repository today.
    return { registryPresent: false, findings: [], coverage: [], filesScanned: 0, domainReason: null };
  }

  let declared: DeclaredSource[];
  try {
    declared = readSourcesRegistry(projectRoot);
  } catch (err) {
    const detail =
      err instanceof SourceRegistryError ? err.message : `could not read the registry: ${(err as Error).message}`;
    return {
      registryPresent: true,
      findings: [{ kind: 'registry', file: SOURCES_REGISTRY_PATH, detail }],
      coverage: [],
      filesScanned: 0,
      domainReason: null,
    };
  }

  const findings: SourceFinding[] = [];
  const values = new Map<string, string>();
  for (const source of declared) {
    try {
      values.set(source.name, resolveSourceValue(projectRoot, source));
    } catch (err) {
      findings.push({
        kind: 'registry',
        file: SOURCES_REGISTRY_PATH,
        detail: `source '${source.name}' did not resolve: ${(err as Error).message}`,
      });
    }
  }

  const { files, reason } = resolveFileDomain(projectRoot);
  const markerCounts = new Map<string, number>(declared.map((d) => [d.name, 0]));

  let filesRead = 0;
  for (const file of files) {
    const absolute = path.join(projectRoot, file);
    let content: string;
    // A tracked path with no working-tree file is the ONE silence that is correct (a deleted
    // file still appears in `git ls-files`). Every other read failure — a permission error,
    // an I/O fault — is reported: swallowing it would let the run exit clean while claiming a
    // tracked living document was scanned when it was never opened.
    if (!fs.existsSync(absolute)) continue;
    try {
      content = fs.readFileSync(absolute, 'utf-8');
    } catch (err) {
      findings.push({
        kind: 'marker',
        file,
        line: 1,
        detail: `tracked file could not be read, so its marked spans were never checked: ${(err as Error).message}`,
      });
      continue;
    }
    filesRead++;
    const { spans, error } = parseMarkedSpans(content);
    for (const span of spans) {
      if (markerCounts.has(span.source)) {
        markerCounts.set(span.source, markerCounts.get(span.source)! + 1);
      }
      if (!values.has(span.source)) {
        if (!markerCounts.has(span.source)) {
          findings.push({ kind: 'unknown-source', file, line: span.line, source: span.source });
        }
        // A declared source that failed to resolve is already reported once, at the
        // registry level; the span is not reported a second time.
        continue;
      }
      const value = values.get(span.source)!;
      if (!checkSpanAgainstValue(span.text, value)) {
        findings.push({
          kind: 'mismatch',
          file,
          line: span.line,
          source: span.source,
          span_text: span.text,
          source_value: value,
        });
      }
    }
    if (error) {
      findings.push({ kind: 'marker', file, line: error.line, detail: error.detail });
    }
  }

  const coverage: SourceCoverageEntry[] = declared.map((d) => ({
    source: d.name,
    value: values.has(d.name) ? values.get(d.name)! : null,
    markers: markerCounts.get(d.name) ?? 0,
  }));

  // `filesScanned` counts files actually READ, never files merely listed — otherwise the one
  // number answering "what did this run look at" overstates itself precisely when a read failed.
  return { registryPresent: true, findings, coverage, filesScanned: filesRead, domainReason: reason };
}
