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
 * both and names the change; two walk payloads, one per `source_path`, pass the real write gate and
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
function discover(): { header: string; passes: Array<{ token: string; file: string; source: string }>; openPair?: unknown } {
  const active = fs
    .readdirSync(path.join(root, 'orbit', 'changes'), { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'archive')
    .map(d => d.name);
  expect(active).toEqual([CHANGE]); // row 2: exactly one active change
  const header = `resolved to the single active change ${active[0]}; markers outside it are not scanned`;
  const status = JSON.parse(JSON.stringify(formatChangeStatus(loadChangeContext(root, active[0]))));
  const reviewed = status.gates.filter((g: any) => g.kind === 'reviewed' && g.state !== 'blocked' && !g.superseded);
  const openPair = reviewed.find((g: any) => g.openPair)?.openPair; // row 4
  const passes = reviewed.flatMap((g: any) => g.unresolvedPasses ?? []); // row 5
  return { header, passes, openPair };
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
  it('discovers both halves, names the change, and two logs empty the gate list', () => {
    const before = discover();
    expect(before.header).toContain(`single active change ${CHANGE}`);
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
});
