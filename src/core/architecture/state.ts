/**
 * Computed stage state (D-arc Stage D2) — a pure function of on-disk artifacts.
 * Never stored, never hand-authored, no caching (the citation corpus is small).
 *
 * Observed-state precedence: in-change > exploring > quiescent > premised (live
 * activity outranks history). Completion is a COMPOSITION of observation and
 * ratification: `complete` renders only when observed quiescent AND the stage's
 * `Complete:` slot is ratified. A ratified mark on ANY non-quiescent observation —
 * live citing work OR no citing artifacts at all — is an inconsistency surfaced by
 * the status render (never a silent `complete`) and raised by audit-drift.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { ParsedArchitectureDoc, ParsedStage } from './parser.js';

export type ObservedState = 'in-change' | 'exploring' | 'quiescent' | 'premised';

export type RenderedState =
  | 'in-change'
  | 'exploring'
  | 'quiescent-awaiting-ratification'
  | 'complete'
  | 'premised'
  | 'inconsistent';

export interface CitingArtifact {
  kind: 'active-change' | 'archived-change' | 'explore';
  name: string;
  /** Repo-relative directory of the citing artifact. */
  path: string;
}

export interface StageState {
  id: string;
  title: string;
  observed: ObservedState;
  ratified: boolean;
  ratifiedDate?: string;
  ratifiedWho?: string;
  rendered: RenderedState;
  /** Present when rendered === 'inconsistent': what contradicts the ratified mark. */
  inconsistency?: string;
  /** ALL citing artifacts (the payload lists every citation; precedence picks observed). */
  citing: CitingArtifact[];
}

interface Citation {
  doc: string;
  stage: string;
}

/**
 * Lenient citation read: the scan must never explode on one unreadable or
 * schema-invalid metadata file (archived pre-capability changes, hand-edits).
 * Only a well-shaped `architecture: {doc, stage}` counts as a citation.
 */
function readCitation(dir: string): Citation | null {
  const metaPath = path.join(dir, '.openspec.yaml');
  try {
    if (!fs.existsSync(metaPath)) return null;
    const parsed = yaml.parse(fs.readFileSync(metaPath, 'utf-8'));
    const arch = parsed?.architecture;
    if (arch && typeof arch.doc === 'string' && typeof arch.stage === 'string') {
      return { doc: arch.doc, stage: arch.stage };
    }
    return null;
  } catch {
    return null;
  }
}

function subdirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isDirectory())
    .sort();
}

/**
 * Scan orbit/changes/*, orbit/changes/archive/*, and orbit/explore/* for artifacts
 * citing `{doc: <docName>}`, keyed by stage id.
 */
export function scanCitations(projectRoot: string, docName: string): Map<string, CitingArtifact[]> {
  const byStage = new Map<string, CitingArtifact[]>();
  const record = (stage: string, artifact: CitingArtifact) => {
    const list = byStage.get(stage) ?? [];
    list.push(artifact);
    byStage.set(stage, list);
  };

  const changesDir = path.join(projectRoot, 'orbit', 'changes');
  for (const name of subdirs(changesDir)) {
    if (name === 'archive') continue;
    const citation = readCitation(path.join(changesDir, name));
    if (citation?.doc === docName) {
      record(citation.stage, { kind: 'active-change', name, path: path.join('orbit', 'changes', name) });
    }
  }

  const archiveDir = path.join(changesDir, 'archive');
  for (const name of subdirs(archiveDir)) {
    const citation = readCitation(path.join(archiveDir, name));
    if (citation?.doc === docName) {
      record(citation.stage, { kind: 'archived-change', name, path: path.join('orbit', 'changes', 'archive', name) });
    }
  }

  const exploreDir = path.join(projectRoot, 'orbit', 'explore');
  for (const name of subdirs(exploreDir)) {
    const citation = readCitation(path.join(exploreDir, name));
    if (citation?.doc === docName) {
      record(citation.stage, { kind: 'explore', name, path: path.join('orbit', 'explore', name) });
    }
  }

  return byStage;
}

function observe(citing: CitingArtifact[]): ObservedState {
  if (citing.some((c) => c.kind === 'active-change')) return 'in-change';
  if (citing.some((c) => c.kind === 'explore')) return 'exploring';
  if (citing.some((c) => c.kind === 'archived-change')) return 'quiescent';
  return 'premised';
}

function compose(stage: ParsedStage, observed: ObservedState): { rendered: RenderedState; inconsistency?: string } {
  if (!stage.complete.ratified) {
    if (observed === 'quiescent') return { rendered: 'quiescent-awaiting-ratification' };
    return { rendered: observed };
  }
  // Ratified mark: honored ONLY on an observed-quiescent stage.
  if (observed === 'quiescent') return { rendered: 'complete' };
  const detail =
    observed === 'premised'
      ? 'no citing artifact exists (a pre-citation archive may need its backfill)'
      : `live citing work observed (${observed})`;
  return {
    rendered: 'inconsistent',
    inconsistency: `Complete: mark is ratified but the observed state is '${observed}' — ${detail}; the mark is not honored`,
  };
}

/**
 * Compute the state of every well-formed stage in a doc. Pure recompute per call.
 */
export function computeStageStates(projectRoot: string, doc: ParsedArchitectureDoc): StageState[] {
  const citations = scanCitations(projectRoot, doc.name);
  return doc.stages.map((stage) => {
    const citing = citations.get(stage.id) ?? [];
    const observed = observe(citing);
    const { rendered, inconsistency } = compose(stage, observed);
    return {
      id: stage.id,
      title: stage.title,
      observed,
      ratified: stage.complete.ratified,
      ratifiedDate: stage.complete.date,
      ratifiedWho: stage.complete.who,
      rendered,
      inconsistency,
      citing,
    };
  });
}
