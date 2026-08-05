import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { parseSchema } from '../../../src/core/artifact-graph/schema.js';
import { computeGateStates } from '../../../src/core/artifact-graph/gates.js';

/**
 * D5: the retired standalone `/orbit:review-external` invocation renders on NO
 * recommendation surface — every engine-rendered next command uses the merged
 * `--reviewer external` form. Record vocabulary (filenames, command values) is frozen
 * and out of scope here.
 */

const YAML = `
name: t
version: 2
artifacts:
  - id: proposal
    generates: proposal.md
    description: P
    template: p.md
gates:
  - id: review-system
    kind: reviewed
    requires: [proposal]
    cadence: [external]
    confirm: findings-resolved
    before: archive
  - id: archive
    kind: tracked
    requires: [proposal]
    tracks: tasks.md
`;

describe('merged external invocation (D5)', () => {
  it('the external cadence slot renders /orbit:review --reviewer external, with the slot key for hints', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-gates-'));
    try {
      const schema = parseSchema(YAML);
      const { gates } = computeGateStates(schema, 'foo', dir, new Set(['proposal']));
      const rs = gates.find(g => g.id === 'review-system')!;
      expect(rs.nextCommand).toBe('/orbit:review --as system --reviewer external foo');
      expect(rs.nextSlot).toBe('external');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('no engine rendering surface contains the retired standalone invocation (grep test)', () => {
    // Rendering surfaces: gate computation, report render tail, orientation, status/instructions.
    const surfaces = [
      'src/core/artifact-graph/gates.ts',
      'src/core/report-render.ts',
      'src/core/orientation.ts',
      'src/commands/workflow/status.ts',
      'src/commands/workflow/instructions.ts',
      'src/core/emit-composition.ts',
    ];
    for (const f of surfaces) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content.includes('/orbit:review-external'), `${f} renders the retired invocation`).toBe(false);
    }
  });
});
