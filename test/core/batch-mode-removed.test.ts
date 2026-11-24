import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit } from '../../src/core/emit-composition.js';
import { loadChangeContext, formatChangeStatus } from '../../src/core/artifact-graph/instruction-loader.js';

/**
 * cut-review-walk (reduce-orbit-phase2's R-rop2-12): batch mode is removed. A new walk payload carrying either retired
 * batch field is refused by the emit surface; a log written while batch mode existed stays on the trail and is read by
 * the reviewed gate exactly as any walk log (`orbit-address-reviews`' `Every walk runs finding by finding`).
 */

let root: string;
const CHANGE = 'batch-gone';
const RUNS = `orbit/changes/${CHANGE}/.orbit-runs`;
const PASS = `${RUNS}/review-system-2026-10-05T01-00-00Z.json`;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

const listRuns = (): string[] => fs.readdirSync(path.join(root, RUNS)).sort();

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-removed-'));
  write(`orbit/changes/${CHANGE}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(`orbit/changes/${CHANGE}/design.md`, '# Design\n');
  write(`orbit/changes/${CHANGE}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(`orbit/changes/${CHANGE}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [x] 1.1 done\n');
  write(`orbit/changes/${CHANGE}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 4\n');
  write('src/a.ts', 'export const a = 1;\n');
  write(PASS, JSON.stringify({ command: 'review', mode: 'system', reviewer_class: 'fresh', findings: [{ severity: 'WARNING', title: 'A finding', file: 'src/a.ts', line: 1 }] }));
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function payload(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    final_assessment: 'One of one resolved.',
    source: 'auto-discovered',
    source_path: PASS,
    source_command: 'review',
    source_token: '2026-10-05T01-00-00Z',
    latest_apply_token: null,
    external_reviewer: null,
    walk_mode: 'per_finding',
    input_findings_summary: { critical: 0, warning: 1, suggestion: 0 },
    pushback_verification: 'verified',
    resolution_summary: { resolved: 1, stale_suppressed: 0, deferred: 0, escalated: 0 },
    resolutions: [
      {
        severity: 'WARNING',
        title: 'A finding',
        marker_source: 'internal-review',
        file: 'src/a.ts',
        line: 1,
        classification: 'trivial_fix',
        action: 'fixed',
        ripple_cascade: { applied: [], flagged_not_applied: [] },
        sweep: { retired: [], introduced: [], searched: ['A finding'], scope: [], kept: [] },
        remedy: 'repair',
        outcome: 'resolved',
      },
    ],
    remaining_markers_in_scope: 0,
    persisted_escalations: [],
    model: null,
    ...extra,
  };
}

/** The `review-system` gate's outstanding passes, as the walk's discovery reads them. */
function outstanding(): string[] {
  const status = JSON.parse(JSON.stringify(formatChangeStatus(loadChangeContext(root, CHANGE))));
  const gate = status.gates.find((g: any) => g.kind === 'reviewed' && g.id === 'review-system');
  return [...(gate.unresolvedPasses ?? []), ...(gate.unwalkedPasses ?? [])].map((p: any) => p.file);
}

describe('batch mode is removed (R-rop2-12)', () => {
  // @scenario behaviour orbit-address-reviews :: Every walk runs finding by finding :: A retired field is refused on a new payload
  it('a new walk payload carrying walk_mode_source or walk_mode_shifted_at_finding is refused, naming the field, and nothing is written', () => {
    write(`${RUNS}/.keep`, '');
    const before = listRuns();
    for (const [field, value] of [['walk_mode_source', 'flag'], ['walk_mode_shifted_at_finding', 2]] as const) {
      expect(() => composeAndWriteEmit('address-reviews', { change: CHANGE }, payload({ [field]: value }), { projectRoot: root })).toThrow(new RegExp(field));
      expect(listRuns()).toEqual(before);
    }
    // Mutation: the same payload without the retired field writes.
    expect(() => composeAndWriteEmit('address-reviews', { change: CHANGE }, payload(), { projectRoot: root })).not.toThrow();
    expect(listRuns().length).toBe(before.length + 1);
  });

  // @scenario behaviour orbit-address-reviews :: Every walk runs finding by finding :: A log written in batch mode still reads
  it('a log written in batch mode still resolves its pass at the reviewed gate', () => {
    expect(outstanding()).toEqual([PASS]);
    const r = composeAndWriteEmit('address-reviews', { change: CHANGE }, payload(), { projectRoot: root });
    // The log as batch mode wrote it: its mode and its retired fields, its resolutions unchanged.
    const log = JSON.parse(fs.readFileSync(r.path, 'utf8'));
    fs.writeFileSync(r.path, JSON.stringify({ ...log, walk_mode: 'batch', walk_mode_source: 'flag', walk_mode_shifted_at_finding: 1 }, null, 2));
    expect(outstanding()).toEqual([]);
    // Mutation: the same log with its resolution left deferred keeps the pass outstanding, so the read is the gate's.
    const deferred = { ...log, walk_mode: 'batch', walk_mode_source: 'flag', resolution_summary: { resolved: 0, stale_suppressed: 0, deferred: 1, escalated: 0 }, resolutions: [{ ...log.resolutions[0], outcome: 'deferred', sweep: undefined }] };
    fs.writeFileSync(r.path, JSON.stringify(deferred, null, 2));
    expect(outstanding()).toEqual([PASS]);
  });
});
