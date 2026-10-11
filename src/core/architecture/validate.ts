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

import { loadArchitectureDoc, type ParsedArchitectureDoc } from './parser.js';

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
export function validateArchitectureDoc(doc: ParsedArchitectureDoc): DocValidationResult {
  if (doc.docClass === 'legacy') {
    return {
      valid: true,
      docClass: 'legacy',
      issues: [],
      note: 'legacy/opaque doc (zero stage-prefixed headings outside fences) — not an error; only parseable docs participate in stage-state computation',
    };
  }

  const issues: DocValidationIssue[] = doc.violations.map((v) => ({
    line: v.line,
    message: `${v.reason}: \`${v.text.trim()}\``,
  }));

  const seen = new Map<string, number>();
  for (const stage of doc.stages) {
    const prior = seen.get(stage.id);
    if (prior !== undefined) {
      issues.push({
        line: stage.headingLine,
        message: `duplicate stage id '${stage.id}' (first declared at line ${prior + 1})`,
      });
    } else {
      seen.set(stage.id, stage.headingLine);
    }
  }

  const declared = new Set(doc.stages.map((s) => s.id));
  for (const stage of doc.stages) {
    for (const dep of stage.dependsOn) {
      if (!declared.has(dep)) {
        issues.push({
          line: stage.dependsOnLine,
          message: `stage '${stage.id}' declares Depends-on '${dep}' but the doc declares no such stage`,
        });
      }
    }
  }

  return { valid: issues.length === 0, docClass: doc.docClass, issues };
}

export type CitationResolution =
  | { ok: true }
  | { ok: false; level: 'doc' | 'stage'; message: string };

/**
 * Resolve an `architecture: {doc, stage}` citation against the docs on disk.
 * Two-level: the error names WHICH level dangled.
 */
export function resolveArchitectureCitation(
  projectRoot: string,
  citation: { doc: string; stage: string }
): CitationResolution {
  const doc = loadArchitectureDoc(projectRoot, citation.doc);
  if (!doc) {
    return {
      ok: false,
      level: 'doc',
      message: `architecture citation dangles at the DOC level: no doc named '${citation.doc}' under orbit/architecture/`,
    };
  }
  if (!doc.stages.some((s) => s.id === citation.stage)) {
    return {
      ok: false,
      level: 'stage',
      message: `architecture citation dangles at the STAGE level: doc '${citation.doc}' declares no stage '${citation.stage}' (declared: ${
        doc.stages.length > 0 ? doc.stages.map((s) => s.id).join(', ') : 'none — the doc is legacy/opaque'
      })`,
    };
  }
  return { ok: true };
}
