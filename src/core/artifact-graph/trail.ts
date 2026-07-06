import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Trail reader (C1 engine gates). Reads a change's `.orbit-runs/` audit trail into
 * plain data that gate-state computation consumes. PURE: reads files, writes nothing.
 *
 * The audit trail IS the gate ledger (per orbit-engine-gates "Gate state is a pure
 * function of existing on-disk artifacts") — there is no dedicated gate-state file.
 */

export type ReviewerClass = 'in-context' | 'fresh' | 'external';
export type ReviewMode = 'proposal' | 'system';

/** A normalized finding, keyed for same-gate new-finding matching. */
export interface TrailFinding {
  /** Trimmed, case-sensitive title. */
  title: string;
  /** Repo-relative file path with any `:line` suffix stripped. */
  file: string;
}

/** A completed review pass (internal `review-<mode>-*.json` or external `external-<as>-*.md`). */
export interface TrailPass {
  /** Filename `<TS>` token, e.g. `2026-06-30T20-24-48Z`; lexically comparable. */
  token: string;
  /** Absolute path of the findings artifact. */
  file: string;
  reviewerClass: ReviewerClass;
  mode: ReviewMode | null;
  critical: number;
  warning: number;
  suggestion: number;
  findings: TrailFinding[];
  source: 'internal-review' | 'external';
}

/** An address-reviews resolution record. */
export interface TrailResolution {
  token: string;
  /** Repo-relative-normalized `source_path`, or null. */
  sourcePath: string | null;
  /** `null` when the field was absent/non-numeric — treated as UNRESOLVED (not zero). */
  deferred: number | null;
  escalated: number | null;
}

export interface Trail {
  changeDir: string;
  runsDir: string;
  passes: TrailPass[];
  resolutions: TrailResolution[];
  /** `apply-*.json` filename tokens (artifact-changing events for freshness). */
  applyTokens: string[];
}

const TS_TOKEN = /(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/;

/** Extract the ISO-with-hyphens `<TS>` token from a filename; null if unparseable (treated as absent). */
export function parseTsToken(filename: string): string | null {
  const m = filename.match(TS_TOKEN);
  return m ? m[1] : null;
}

/** Strip a trailing `:line` (and `:line:col`) suffix from a file path. */
function stripLineSuffix(file: string): string {
  return file.replace(/:\d+(:\d+)?$/, '').trim();
}

function toRepoRelative(p: string): string {
  // Normalize to a forward-slash path; keep as-is if already relative. Absolute
  // paths are compared after this normalization by callers.
  return p.replace(/\\/g, '/').trim();
}

/**
 * Reads the change's `.orbit-runs/` trail. Files with unparseable tokens or
 * unreadable/invalid content are skipped (treated as absent) — never throws on
 * a single bad file.
 */
export function readTrail(changeDir: string): Trail {
  const runsDir = path.join(changeDir, '.orbit-runs');
  const trail: Trail = { changeDir, runsDir, passes: [], resolutions: [], applyTokens: [] };

  if (!fs.existsSync(runsDir)) return trail;

  let entries: string[];
  try {
    entries = fs.readdirSync(runsDir);
  } catch {
    return trail;
  }

  for (const name of entries) {
    const token = parseTsToken(name);
    const full = path.join(runsDir, name);

    // External findings file: external-(proposal|system)-<TS>.md — NOT external-prompt-*.
    const extMatch = name.match(/^external-(proposal|system)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/);
    if (extMatch && token) {
      const pass = parseExternalMarkdown(full, token, extMatch[1] as ReviewMode);
      if (pass) trail.passes.push(pass);
      continue;
    }

    if (!name.endsWith('.json') || !token) continue;

    let json: any;
    try {
      json = JSON.parse(fs.readFileSync(full, 'utf-8'));
    } catch {
      continue; // unreadable / invalid JSON → absent
    }

    if (/^review-(proposal|system)-/.test(name)) {
      trail.passes.push(parseInternalReview(full, token, json));
    } else if (/^address-reviews-/.test(name)) {
      trail.resolutions.push(parseAddressReviews(token, json));
    } else if (/^apply-/.test(name)) {
      trail.applyTokens.push(token);
    }
    // review-external-*.json (T0 packaging emit) is intentionally NOT a pass:
    // a packaged-but-unreturned external never counts as class coverage.
  }

  trail.passes.sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
  trail.resolutions.sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
  trail.applyTokens.sort();
  return trail;
}

function parseInternalReview(file: string, token: string, json: any): TrailPass {
  // reviewer_class: first-class field (C1); legacy inference for older emits.
  let reviewerClass: ReviewerClass;
  if (json.reviewer_class === 'fresh' || json.reviewer_class === 'external' || json.reviewer_class === 'in-context') {
    reviewerClass = json.reviewer_class;
  } else if (json.flags?.fresh === true) {
    reviewerClass = 'fresh';
  } else {
    reviewerClass = 'in-context';
  }

  const summary = json.findings_summary ?? {};
  const findingsArr: any[] = Array.isArray(json.findings) ? json.findings : [];
  const findings: TrailFinding[] = findingsArr.map(f => ({
    title: String(f?.title ?? '').trim(),
    file: stripLineSuffix(toRepoRelative(String(f?.file ?? ''))),
  }));

  const critical =
    typeof summary.critical === 'number'
      ? summary.critical
      : findingsArr.filter(f => f?.severity === 'CRITICAL').length;
  const warning =
    typeof summary.warning === 'number'
      ? summary.warning
      : findingsArr.filter(f => f?.severity === 'WARNING').length;
  const suggestion =
    typeof summary.suggestion === 'number'
      ? summary.suggestion
      : findingsArr.filter(f => f?.severity === 'SUGGESTION').length;

  return {
    token,
    file,
    reviewerClass,
    mode: json.mode === 'proposal' || json.mode === 'system' ? json.mode : null,
    critical,
    warning,
    suggestion,
    findings,
    source: 'internal-review',
  };
}

function parseAddressReviews(token: string, json: any): TrailResolution {
  const rs = json.resolution_summary ?? {};
  const rawPath = json.source_path ?? null;
  return {
    token,
    sourcePath: rawPath ? stripLineSuffix(toRepoRelative(String(rawPath))) : null,
    // Missing/non-numeric → null (unresolved), NOT 0: an address-reviews JSON without a
    // proper resolution_summary must not falsely resolve a pass (per the edge-case contract:
    // malformed/missing fields are treated as if no address-reviews ran).
    deferred: typeof rs.deferred === 'number' ? rs.deferred : null,
    escalated: typeof rs.escalated === 'number' ? rs.escalated : null,
  };
}

/**
 * Parses an external-review markdown findings file into a pass. Counts findings per
 * severity section (`## CRITICAL` / `## WARNING` / `## SUGGESTION`); a section whose
 * only body is an empty-severity sentinel (`None.` etc.) contributes zero findings.
 * On parse failure returns null (the file is treated as absent).
 */
function parseExternalMarkdown(file: string, token: string, mode: ReviewMode): TrailPass | null {
  let content: string;
  try {
    content = fs.readFileSync(file, 'utf-8');
  } catch {
    return null;
  }

  const lines = content.split(/\r?\n/);
  let section: 'CRITICAL' | 'WARNING' | 'SUGGESTION' | null = null;
  const counts = { CRITICAL: 0, WARNING: 0, SUGGESTION: 0 };
  const findings: TrailFinding[] = [];
  let pendingTitle: string | null = null;
  // Shape validation: a well-formed external findings file has the `# External Review:`
  // header AND all three severity sections. Content that doesn't parse to this shape is
  // NOT a valid external pass — return null (absent) so a malformed/plain-text file can
  // never count as a clean external and advance the gate (per orbit-review: external
  // parse failure → NOT-clean; Path A requires confident parse success).
  let hasHeader = false;
  const sawSections = new Set<string>();

  for (const line of lines) {
    if (/^#\s+External Review\b/i.test(line)) hasHeader = true;
    const sec = line.match(/^##\s+(CRITICAL|WARNING|SUGGESTION)\s*$/);
    if (sec) {
      section = sec[1] as 'CRITICAL' | 'WARNING' | 'SUGGESTION';
      sawSections.add(sec[1]);
      pendingTitle = null;
      continue;
    }
    if (/^##\s+/.test(line)) {
      section = null; // left the severity sections (e.g. ## Notes)
      pendingTitle = null;
      continue;
    }
    if (!section) continue;

    const title = line.match(/^###\s+(.*\S)\s*$/);
    if (title) {
      counts[section]++;
      pendingTitle = title[1].trim();
      findings.push({ title: pendingTitle, file: '' });
      continue;
    }
    const fileField = line.match(/^\*\*File\*\*:\s*(.*\S)\s*$/i);
    if (fileField && findings.length > 0) {
      findings[findings.length - 1].file = stripLineSuffix(toRepoRelative(fileField[1]));
    }
  }

  // Reject malformed/incomplete files: not a confidently-parsed external findings artifact.
  if (!hasHeader || sawSections.size < 3) return null;

  return {
    token,
    file,
    reviewerClass: 'external',
    mode,
    critical: counts.CRITICAL,
    warning: counts.WARNING,
    suggestion: counts.SUGGESTION,
    findings,
    source: 'external',
  };
}
