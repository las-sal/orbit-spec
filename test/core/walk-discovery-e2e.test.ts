import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit } from '../../src/core/emit-composition.js';
import { loadChangeContext, formatChangeStatus } from '../../src/core/artifact-graph/instruction-loader.js';

/**
 * rc08b-walk-routing, task 4.1 — exit (1)'s measure, end to end in a disposable project. One active
 * change whose `review-system` gate holds two unwalked passes, a fresh JSON and an external return.
 * The bare-invocation discovery read — status JSON through the DISCOVERY fence's rows 2 and 5 — yields
 * both; two walk payloads, one per `source_path`, pass the real write gate and
 * leave the gate's list empty.
 */

let root: string;
const CHANGE = 'walk-me';
const RUNS = `orbit/changes/${CHANGE}/.orbit-runs`;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'rc08b-e2e-'));
  write(`orbit/changes/${CHANGE}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(`orbit/changes/${CHANGE}/design.md`, '# Design\n');
  write(`orbit/changes/${CHANGE}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(`orbit/changes/${CHANGE}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [x] 1.1 done\n');
  write(`orbit/changes/${CHANGE}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 4\n');
  write('src/a.ts', 'export const a = 1;\n');
  write('src/b.ts', 'export const b = 2;\n');
  write(
    `${RUNS}/review-system-2026-10-05T01-00-00Z.json`,
    JSON.stringify({
      command: 'review',
      mode: 'system',
      reviewer_class: 'fresh',
      findings: [{ severity: 'WARNING', title: 'Fresh finding', file: 'src/a.ts', line: 1 }],
    })
  );
  write(
    `${RUNS}/external-system-2026-10-05T01-10-00Z.md`,
    '# External Review: walk-me (iteration 1)\n\n**Reviewer**: M\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\n### External finding\n**File**: src/b.ts\n**Description**: d\n\n## SUGGESTION\n\nNone.\n'
  );
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

/** The body's discovery read, rows 2 and 5 of the DISCOVERY fence, over real engine output. */
function discover(): { passes: Array<{ token: string; file: string; source: string }>; openPair?: unknown } {
  // Row 2's input is `orbit list --json`; a readdir of orbit/changes stands in for it here. The header
  // row 2 prints is body text, held by the row-2 text test in walk-routing.test.ts — not asserted here.
  const active = fs
    .readdirSync(path.join(root, 'orbit', 'changes'), { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'archive')
    .map(d => d.name);
  expect(active).toEqual([CHANGE]); // row 2: exactly one active change
  const status = JSON.parse(JSON.stringify(formatChangeStatus(loadChangeContext(root, active[0]))));
  const reviewed = status.gates.filter((g: any) => g.kind === 'reviewed' && g.state !== 'blocked' && !g.superseded);
  const openPair = reviewed.find((g: any) => g.openPair)?.openPair; // row 4
  // row 5: the UNION of each gate's unresolvedPasses and unwalkedPasses (rc17a), oldest first per gate.
  const passes = reviewed.flatMap((g: any) =>
    [...(g.unresolvedPasses ?? []), ...(g.unwalkedPasses ?? [])].sort((a: any, b: any) => (a.token < b.token ? -1 : 1))
  );
  return { passes, openPair };
}

function walkPayload(sourcePath: string, token: string, command: string | null, title: string, file: string) {
  return {
    final_assessment: `One of one resolved in ${path.basename(sourcePath)}.`,
    source: 'auto-discovered',
    source_path: sourcePath,
    source_command: command,
    source_token: token,
    latest_apply_token: null,
    external_reviewer: command === null ? 'M' : null,
    walk_mode: 'per_finding',
    input_findings_summary: { critical: 0, warning: 1, suggestion: 0 },
    pushback_verification: 'verified',
    resolution_summary: { resolved: 1, stale_suppressed: 0, deferred: 0, escalated: 0 },
    resolutions: [
      {
        severity: 'WARNING',
        title,
        marker_source: command === null ? 'external' : 'internal-review',
        file,
        line: 1,
        classification: 'trivial_fix',
        action: 'fixed',
        ripple_cascade: { applied: [], flagged_not_applied: [] },
        sweep: { retired: [], introduced: [], searched: [title], scope: [], kept: [] },
        remedy: 'repair',
        outcome: 'resolved',
      },
    ],
    remaining_markers_in_scope: 0,
    persisted_escalations: [],
    model: null,
  };
}

describe('rc08b exit (1): a bare walk discovers every outstanding pass and writes one log per source', () => {
  // @scenario behaviour orbit-address-reviews :: Address-reviews command available :: Bare invocation resolves the single active change
  it('discovers both halves of the single active change, and two logs empty the gate list', () => {
    const before = discover();
    expect(before.openPair).toBeUndefined();
    expect(before.passes.map(p => [p.token, p.file, p.source])).toEqual([
      ['2026-10-05T01-00-00Z', `${RUNS}/review-system-2026-10-05T01-00-00Z.json`, 'internal-review'],
      ['2026-10-05T01-10-00Z', `${RUNS}/external-system-2026-10-05T01-10-00Z.md`, 'external'],
    ]);

    // One log per source, in token order.
    const titles: Record<string, [string | null, string, string]> = {
      '2026-10-05T01-00-00Z': ['review', 'Fresh finding', 'src/a.ts'],
      '2026-10-05T01-10-00Z': [null, 'External finding', 'src/b.ts'],
    };
    const written: string[] = [];
    for (const p of before.passes) {
      const [cmd, title, file] = titles[p.token];
      const r = composeAndWriteEmit('address-reviews', { change: CHANGE }, walkPayload(p.file, p.token, cmd, title, file), { projectRoot: root });
      written.push(r.path);
      expect(r.emit.source_path).toBe(p.file);
    }
    expect(new Set(written).size).toBe(2);

    const after = discover();
    expect(after.passes).toEqual([]);
  });

  // @scenario behaviour orbit-address-reviews :: Address-reviews command available :: An external return is discovered
  it('the external return is in the list with no --from-file, and its log names it', () => {
    const { passes } = discover();
    const ext = passes.find(p => p.source === 'external')!;
    expect(ext.file).toMatch(/external-system-.*\.md$/);
    const r = composeAndWriteEmit('address-reviews', { change: CHANGE }, walkPayload(ext.file, ext.token, null, 'External finding', 'src/b.ts'), { projectRoot: root });
    expect(r.emit.source_path).toBe(ext.file);
    expect(discover().passes.map(p => p.source)).toEqual(['internal-review']);
  });

  // @scenario behaviour orbit-address-reviews :: A walk entry records its remedy, and a REDESIGN leaves the walk :: A redesign outside a gate pass records its route and holds nothing
  it('an essential redesign escalated from an audit-drift emit leaves the gate and its list unchanged', () => {
    const gateRow = () => {
      const st = JSON.parse(JSON.stringify(formatChangeStatus(loadChangeContext(root, CHANGE))));
      const g = st.gates.find((x: any) => x.id === 'review-system');
      return { state: g.state, reason: g.reason, unresolvedPasses: g.unresolvedPasses };
    };
    const before = gateRow();
    const audit = composeAndWriteEmit('audit-drift', { change: CHANGE }, { final_assessment: '1 drift.', categories_run: ['1'], findings: [{ category: '1', severity: 'WARNING', file: 'src/a.ts', line: 1, title: 'Drift', recommendation: 'r' }], model: null }, { projectRoot: root });
    const rel = path.relative(root, audit.path);
    composeAndWriteEmit(
      'address-reviews',
      { change: CHANGE },
      {
        ...walkPayload(rel, path.basename(rel).slice('audit-drift-'.length, -'.json'.length), 'audit-drift', 'Drift', 'src/a.ts'),
        resolution_summary: { resolved: 0, stale_suppressed: 0, deferred: 0, escalated: 1 },
        resolutions: [
          { severity: 'WARNING', title: 'Drift', marker_source: 'audit-drift', file: 'src/a.ts', line: 1, classification: 'unresolvable', action: 'escalated: essential redesign', remedy: 'redesign', routed_to: `orbit/changes/${CHANGE}/explore.md`, outcome: 'escalated' },
        ],
      },
      { projectRoot: root }
    );
    expect(gateRow()).toEqual(before);
  });
});

describe('rc17a exit (3): a SUGGESTION-only pass is discovered, walked once, and holds nothing', () => {
  const SUG = '2026-10-05T02-00-00Z';
  const sugFile = `${RUNS}/review-system-${SUG}.json`;

  beforeEach(() => {
    // Replace the rc08b fixture's two substantive passes with ONE fresh pass carrying only SUGGESTIONs.
    fs.rmSync(path.join(root, `${RUNS}/review-system-2026-10-05T01-00-00Z.json`));
    fs.rmSync(path.join(root, `${RUNS}/external-system-2026-10-05T01-10-00Z.md`));
    write(
      sugFile,
      JSON.stringify({
        command: 'review',
        mode: 'system',
        reviewer_class: 'fresh',
        findings: [
          { severity: 'SUGGESTION', title: 'Name it better', file: 'src/a.ts', line: 1 },
          { severity: 'SUGGESTION', title: 'Trim the comment', file: 'src/b.ts', line: 1 },
        ],
      })
    );
  });

  const gateRow = (): any =>
    JSON.parse(JSON.stringify(formatChangeStatus(loadChangeContext(root, CHANGE)))).gates.find((g: any) => g.id === 'review-system');

  const deferral = (title: string, file: string) => ({
    severity: 'SUGGESTION',
    title,
    marker_source: 'internal-review',
    file,
    line: 1,
    classification: 'decision_required',
    action: 'deferred',
    ripple_cascade: { applied: [], flagged_not_applied: [] },
    remedy: 'descope',
    outcome: 'deferred',
  });

  // @scenario behaviour orbit-address-reviews :: Address-reviews command available :: A walked suggestion-only pass is not rediscovered
  it('discovery lists it through unwalkedPasses; a log deferring both SUGGESTIONs takes it out; clause (b) never moved', () => {
    const before = gateRow();
    expect(before.unresolvedPasses).toEqual([]);
    expect(before.unwalkedPasses).toEqual([{ token: SUG, file: sugFile, mode: 'system', source: 'internal-review' }]);
    expect(discover().passes.map(p => p.file)).toEqual([sugFile]);

    const payload = {
      ...walkPayload(sugFile, SUG, 'review', 'Name it better', 'src/a.ts'),
      final_assessment: 'Two SUGGESTIONs deferred.',
      input_findings_summary: { critical: 0, warning: 0, suggestion: 2 },
      resolution_summary: { resolved: 0, stale_suppressed: 0, deferred: 2, escalated: 0 },
      resolutions: [deferral('Name it better', 'src/a.ts'), deferral('Trim the comment', 'src/b.ts')],
    };
    const r = composeAndWriteEmit('address-reviews', { change: CHANGE }, payload, { projectRoot: root });
    expect(r.emit.source_path).toBe(sugFile);

    const after = gateRow();
    expect(after.unwalkedPasses).toEqual([]);
    expect(after.unresolvedPasses).toEqual([]);
    // The walk adds nothing to clause (b): the gate's state and reason are what they were before it.
    expect([after.state, after.reason]).toEqual([before.state, before.reason]);
    // Nothing left for discovery: the fence's AFTER line ("Nothing to walk") is what the body then prints.
    expect(discover().passes).toEqual([]);
  });
});

