/**
 * The payload schema references, and the ONE engine-owned subtraction list, shared by both suites
 * that read them (rc07b-reference-roundtrip, design D2): the field-set parity test
 * (`test/core/emit-schema-parity.test.ts`, rc01) and the round-trip test
 * (`test/core/reference-roundtrip.test.ts`). Two suites with two copies of either table would be
 * two statements of one fact — the drift this stage exists to remove.
 */
import {
  getReviewSkillTemplate,
  getAddressReviewsSkillTemplate,
  getAuditDriftSkillTemplate,
  getArchiveChangeSkillTemplate,
} from '../../src/core/templates/skill-templates.js';
import { createFenceTracker } from '../../src/core/markdown-fence.js';

export type ReferenceTemplate = () => { references?: Array<{ name: string; content: string }> };

export const REFERENCES: Array<[command: string, template: ReferenceTemplate, refName: string]> = [
  ['review', getReviewSkillTemplate, 'run-summary-schema.md'],
  // rc04a system walk: the `review-external` T0 block lives in a DIFFERENT reference of the same
  // skill, and was unread here — so rc04a added `judgements` to a block no instrument checked, and
  // a pre-existing divergence sat undetected: the block documented `reviewer_class`, which the
  // payload table REFUSES as an unknown key and the engine never composes, so an author following
  // the schema would have written a refused emit.
  ['review-external', getReviewSkillTemplate, 'external-handoff.md'],
  ['address-reviews', getAddressReviewsSkillTemplate, 'run-summary-schema.md'],
  ['audit-drift', getAuditDriftSkillTemplate, 'run-summary-schema.md'],
  ['archive', getArchiveChangeSkillTemplate, 'archive-summary-schema.md'],
];

/** The content of one reference, by command and name — undefined when the template lacks it. */
export function referenceContent(template: ReferenceTemplate, refName: string): string | undefined {
  return (template().references ?? []).find((r) => r.name === refName)?.content;
}

/** Universal spine + computed keys the engine composes on every command. */
export const ENGINE_OWNED = ['command', 'timestamp', 'change', 'doc', 'kind', 'model', 'next_recommended', 'iteration'];
/** Per-command computed keys the reference marks engine-owned. */
export const ENGINE_OWNED_PER_COMMAND: Record<string, string[]> = {
  // review: the counts sentence is engine-composed from the scorecard (D4).
  review: ['final_assessment', 'pass_genre', 'verified_walks'],
  // review-external: the T0 handoff flag is composed by the engine, never supplied.
  'review-external': ['awaiting_findings'],
  // rc07b-reference-roundtrip (`orbit-emit-composition`'s `Audit-drift counts are engine-computed`):
  // both counts are computed from `findings` at write and refused in the payload.
  'audit-drift': ['findings_total', 'findings_by_category'],
};

/** The full engine-owned set for one command — the field-set test's subtraction. */
export function engineOwnedFor(command: string): Set<string> {
  return new Set([...ENGINE_OWNED, ...(ENGINE_OWNED_PER_COMMAND[command] ?? [])]);
}

/**
 * Top-level keys of a schema block, found STRUCTURALLY — by brace/bracket depth, not by
 * indentation (external iter 1, 2026-09-12: a two-space regex silently dropped a second key
 * on the same line, and a four-space-indented key, so a documented field could bypass the
 * parity check by formatting alone). String contents are skipped so a `"` inside a value
 * never shifts depth.
 */
export function topLevelKeys(block: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let current = '';
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') {
        inString = false;
        // A key is a string at depth 1 followed (after spaces) by a colon.
        if (depth === 1) {
          const after = block.slice(i + 1).match(/^\s*:/);
          if (after) keys.push(current);
        }
        current = '';
      } else current += ch;
      continue;
    }
    if (ch === '"') { inString = true; current = ''; continue; }
    if (ch === '{' || ch === '[') depth += 1;
    else if (ch === '}' || ch === ']') depth -= 1;
  }
  return keys;
}

/** One fenced block, as the engine's fence grammar reads it. */
export interface Fence {
  line: number; // 1-indexed opening line
  opening: string;
  info: string;
  body: string;
}

/**
 * Every fenced block in a reference, read through the engine's ONE fence grammar (design D2;
 * `src/core/markdown-fence.ts`). Both suites read blocks through this — rc07b system walk 1
 * (fresh S3) retired the parity test's local regex, which agreed with this reader only by the
 * references' current formatting (a `~~~json` block, or a trailing space after `json`, split them).
 */
export function fences(content: string): Fence[] {
  const out: Fence[] = [];
  const tracker = createFenceTracker();
  let current: { line: number; opening: string; info: string; lines: string[] } | null = null;
  content.split('\n').forEach((raw, i) => {
    const line = raw.replace(/\r$/, '');
    const wasIn = tracker.inFence;
    const delimiter = tracker.handle(line);
    if (delimiter && !wasIn) {
      current = { line: i + 1, opening: line, info: line.replace(/^ {0,3}(`{3,}|~{3,})/, '').trim(), lines: [] };
      return;
    }
    if (delimiter && wasIn && current) {
      out.push({ line: current.line, opening: current.opening, info: current.info, body: current.lines.join('\n') });
      current = null;
      return;
    }
    if (current) current.lines.push(line);
  });
  return out;
}

/**
 * The ONE definition of a full-record SCHEMA BLOCK: info string exactly `json` (so a
 * `json example …` block never qualifies) and top-level keys including `command`. Returns the
 * block's top-level keys, or null when the block is not a schema block.
 */
export function schemaBlockKeys(f: Fence): string[] | null {
  if (f.info !== 'json') return null;
  const keys = topLevelKeys(f.body);
  return keys.includes('command') ? keys : null;
}
