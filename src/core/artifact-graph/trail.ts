import * as fs from 'node:fs';
import * as path from 'node:path';
import { createFenceTracker } from '../markdown-fence.js';

/**
 * Trail reader (C1 engine gates). Reads a change's `.orbit-runs/` audit trail into
 * plain data that gate-state computation consumes. PURE: reads files, writes nothing.
 *
 * The audit trail IS the gate ledger (per orbit-engine-gates "Gate state is a pure
 * function of existing on-disk artifacts") — there is no dedicated gate-state file.
 */

export type ReviewerClass = 'in-context' | 'fresh' | 'external';
export type ReviewMode = 'proposal' | 'system';

/** The closed severity ladder (orbit-conventions). `null` = the emit carried no recognised value. */
export type Severity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
const SEVERITIES: readonly string[] = ['CRITICAL', 'WARNING', 'SUGGESTION'];
/** CRITICAL and WARNING gate; SUGGESTION never does (rc02). */
export function isSubstantive(sev: Severity | null): boolean {
  return sev === 'CRITICAL' || sev === 'WARNING';
}

/** The closed disposition set an address-reviews entry may carry. */
export type Disposition = 'resolved' | 'stale' | 'deferred' | 'escalated';
const DISPOSITIONS: readonly string[] = ['resolved', 'stale', 'deferred', 'escalated'];

/** A normalized finding. Its KEY is the tuple (TRIMMED, CASE-SENSITIVE TITLE + REPO-RELATIVE FILE) — used by clause (b)
 *  for resolution completeness and for deferred-suggestion dedup. (It was introduced for the
 *  new-finding match, which rc02c retired with clause (c); the key outlived the rule.) */
export interface TrailFinding {
  /** Trimmed, case-sensitive title. */
  title: string;
  /** Repo-relative file path with any `:line` suffix stripped. */
  file: string;
  /** Authored severity; `null` when the emit carried no recognised value. NEVER re-graded. */
  severity: Severity | null;
  /** External parse bookkeeping: the ingestion contract requires the full field triple. */
  hasFile?: boolean;
  hasDescription?: boolean;
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

/** One `resolutions[]` element, normalized. */
export interface TrailResolutionEntry {
  severity: Severity | null;
  /** Read from `outcome`, or the legacy key `status` when `outcome` is absent. */
  disposition: Disposition | null;
  /** Trimmed title, for deduplicating the deferred-suggestion count. */
  title: string;
  /** Repo-relative file with any `:line` suffix stripped. */
  file: string;
}

/** An address-reviews resolution record. */
export interface TrailResolution {
  token: string;
  /** Repo-relative-normalized `source_path`, or null. */
  sourcePath: string | null;
  /** `null` when the field was absent/non-numeric — treated as UNRESOLVED (not zero). */
  deferred: number | null;
  escalated: number | null;
  /**
   * rc02 READABILITY: true only when `resolutions` is a NON-EMPTY array whose EVERY element is an
   * object carrying a recognised severity AND a recognised disposition. Anything else — absent,
   * empty, a counter object, a non-object element, an unrecognised value — is UNREADABLE and the
   * gate falls back WHOLE to the bare counts for that record.
   */
  readable: boolean;
  /** The normalized entries; empty when the record is unreadable. */
  entries: TrailResolutionEntry[];
}

/** An external findings artifact the shape validation REJECTED (rc02: spend is spend). */
export interface RejectedExternal {
  token: string;
  file: string;
  mode: ReviewMode;
}

export interface Trail {
  changeDir: string;
  runsDir: string;
  passes: TrailPass[];
  resolutions: TrailResolution[];
  /** `apply-*.json` filename tokens (artifact-changing events for freshness). */
  applyTokens: string[];
  /**
   * External findings artifacts whose shape validation failed (rc02). They satisfy NO cadence slot
   * — their findings cannot be read — but they cost a model run, so `independentSpend` counts them
   * and the gate's reason names them. Attributed to the mode in the filename.
   */
  rejectedExternals: RejectedExternal[];
  /**
   * The LATEST apply emit's declared `user_validation_tasks` identifier list (D5): the
   * engine-verified record of which unchecked boxes are user-validation handoffs. Absent
   * when no apply emit declares the field. Consumed by the tracked-gate user-validation
   * subset rule (orbit-engine-gates).
   */
  latestApplyUserValidation?: string[];
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
 * A synthetic trail entry (D-arc Stage D5): an in-memory emit candidate treated as if it
 * were already on the trail — the emit surface's post-write-semantics composition computes
 * the change status against `disk + candidate` WITHOUT any provisional file existing.
 */
export interface TrailOverlay {
  /** The candidate's would-be filename (routes it through the same parse branches). */
  name: string;
  json: unknown;
}

/**
 * Reads the change's `.orbit-runs/` trail. Files with unparseable tokens or
 * unreadable/invalid content are skipped (treated as absent) — never throws on
 * a single bad file. An optional `overlay` candidate is folded in as if on disk.
 */
export function readTrail(changeDir: string, overlay?: TrailOverlay): Trail {
  const runsDir = path.join(changeDir, '.orbit-runs');
  const trail: Trail = {
    changeDir,
    runsDir,
    passes: [],
    resolutions: [],
    applyTokens: [],
    rejectedExternals: [],
  };
  // (token, declared user-validation ids) per apply emit; the latest token wins below.
  const applyUserValidation: Array<[string, string[]]> = [];

  const ingestJson = (name: string, token: string, full: string, json: any): void => {
    if (/^review-(proposal|system)-/.test(name)) {
      trail.passes.push(parseInternalReview(full, token, json));
    } else if (/^address-reviews-/.test(name)) {
      trail.resolutions.push(parseAddressReviews(token, json));
    } else if (/^apply-/.test(name)) {
      trail.applyTokens.push(token);
      const uv = (json as any)?.user_validation_tasks;
      if (Array.isArray(uv) && uv.every((t: unknown) => typeof t === 'string')) {
        applyUserValidation.push([token, uv as string[]]);
      }
    }
    // review-external-*.json (T0 packaging emit) is intentionally NOT a pass:
    // a packaged-but-unreturned external never counts as class coverage.
  };

  if (fs.existsSync(runsDir)) {
    let entries: string[];
    try {
      entries = fs.readdirSync(runsDir);
    } catch {
      entries = [];
    }

    for (const name of entries) {
      const token = parseTsToken(name);
      const full = path.join(runsDir, name);

      // External findings file: external-(proposal|system)-<TS>.md — NOT external-prompt-*.
      const extMatch = name.match(/^external-(proposal|system)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/);
      if (extMatch && token) {
        const mode = extMatch[1] as ReviewMode;
        const pass = parseExternalMarkdown(full, token, mode);
        if (pass) trail.passes.push(pass);
        // rc02: a return that came back unreadable is still spend. Recorded separately so it can
        // never satisfy a slot while remaining visible to `independentSpend` and the reason.
        else trail.rejectedExternals.push({ token, file: full, mode });
        continue;
      }

      if (!name.endsWith('.json') || !token) continue;

      let json: any;
      try {
        json = JSON.parse(fs.readFileSync(full, 'utf-8'));
      } catch {
        continue; // unreadable / invalid JSON → absent
      }
      ingestJson(name, token, full, json);
    }
  }

  if (overlay) {
    const token = parseTsToken(overlay.name);
    if (token && overlay.name.endsWith('.json')) {
      ingestJson(overlay.name, token, path.join(runsDir, overlay.name), overlay.json);
    }
  }

  trail.passes.sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
  trail.resolutions.sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
  trail.applyTokens.sort();
  trail.rejectedExternals.sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
  if (applyUserValidation.length > 0) {
    applyUserValidation.sort((a, b) => (a[0] < b[0] ? -1 : 1));
    trail.latestApplyUserValidation = applyUserValidation[applyUserValidation.length - 1][1];
  }
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
    severity: normalizeSeverity(f?.severity),
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

/** A recognised severity, or null. Never throws; never re-grades. */
function normalizeSeverity(v: unknown): Severity | null {
  return typeof v === 'string' && SEVERITIES.includes(v) ? (v as Severity) : null;
}

/**
 * A recognised disposition from `outcome`; the legacy key `status` is consulted ONLY when `outcome`
 * is ABSENT. Presence is tested with `in`, not truthiness or string-ness: `{outcome: null}` is a
 * PRESENT value the reader cannot interpret, and falling through to `status` there would revive a
 * legacy key to override a value the emit actually carried.
 */
function normalizeDisposition(entry: any): Disposition | null {
  const has = (k: string): boolean =>
    entry !== null && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, k);
  const read = (k: string): Disposition | null => {
    const v = entry?.[k];
    return typeof v === 'string' && DISPOSITIONS.includes(v) ? (v as Disposition) : null;
  };
  if (has('outcome')) return read('outcome');
  if (has('status')) return read('status');
  return null;
}

/**
 * rc02 readability: a NON-EMPTY array whose EVERY element is an object carrying BOTH a recognised
 * severity AND a recognised disposition. The empty case is stated, not defaulted — an empty array
 * is UNREADABLE, so it can never vacuously resolve a pass over its own summary.
 */
function readResolutionEntries(raw: unknown): { readable: boolean; entries: TrailResolutionEntry[] } {
  if (!Array.isArray(raw) || raw.length === 0) return { readable: false, entries: [] };
  const entries: TrailResolutionEntry[] = [];
  for (const el of raw) {
    if (el === null || typeof el !== 'object' || Array.isArray(el)) return { readable: false, entries: [] };
    const severity = normalizeSeverity((el as any).severity);
    const disposition = normalizeDisposition(el);
    if (severity === null || disposition === null) return { readable: false, entries: [] };
    entries.push({
      severity,
      disposition,
      title: String((el as any).title ?? '').trim(),
      file: stripLineSuffix(toRepoRelative(String((el as any).file ?? ''))),
    });
  }
  return { readable: true, entries };
}

function parseAddressReviews(token: string, json: any): TrailResolution {
  const rs = json.resolution_summary ?? {};
  const rawPath = json.source_path ?? null;
  const { readable, entries } = readResolutionEntries(json.resolutions);
  return {
    token,
    sourcePath: rawPath ? stripLineSuffix(toRepoRelative(String(rawPath))) : null,
    readable,
    entries,
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

  // FENCE-AWARE via the SHARED CommonMark tracker (rc02 walk 9). An earlier lean copy here
  // remembered only the fence CHARACTER, so a three-backtick line closed a four-backtick fence and
  // the severity headings after it read as structure — admitting a document with no findings at all
  // as a clean external pass. Two parsers implementing one contract is the defect; the tracker is
  // imported, never restated.
  const fence = createFenceTracker();
  let hasReviewer = false;
  for (const line of lines) {
    const wasInFence = fence.inFence;
    if (fence.handle(line) || wasInFence) continue;
    if (/^#\s+External Review\b/i.test(line)) hasHeader = true;
    if (/^\*\*Reviewer\*\*:/i.test(line)) hasReviewer = true;
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
      // External findings take their severity from SECTION MEMBERSHIP, which is structural.
      findings.push({ title: pendingTitle, file: '', severity: section, hasFile: false, hasDescription: false });
      continue;
    }
    const fileField = line.match(/^\*\*File\*\*:\s*(.*\S)\s*$/i);
    if (fileField && findings.length > 0) {
      findings[findings.length - 1].file = stripLineSuffix(toRepoRelative(fileField[1]));
      findings[findings.length - 1].hasFile = true;
    }
    const descField = line.match(/^\*\*Description\*\*:\s*(.*\S)\s*$/i);
    if (descField && findings.length > 0) {
      findings[findings.length - 1].hasDescription = true;
    }
  }

  // Reject malformed/incomplete files: not a confidently-parsed external findings artifact. The
  // `**Reviewer**:` field is required alongside the header and all three severity sections — the
  // canonical shape the format requirement fixes — so a truncated or example-only document is
  // recorded as a REJECTED return rather than counted as a clean pass.
  if (!hasHeader || !hasReviewer || sawSections.size < 3) return null;
  // SHAPE PARITY with the supported ingestion path (rc02 walk 9): every counted finding must carry
  // the full `### Title` / `**File**:` / `**Description**:` triple. A truncated entry that the
  // `--from-file` contract refuses must not make a pass the gate then recommends resolving.
  if (findings.some(f => !(f as any).hasFile || !(f as any).hasDescription)) return null;

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
