import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runCLI } from '../../helpers/run-cli.js';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { CHAIN_END_STEP_BASIC, COMMIT_STEP_BASIC } from '../../../src/core/disciplines.js';
import { PROGRAM_SIGNOFF_HOLD_BASIC } from '../../../src/core/templates/workflows/architect.js';

/**
 * conditional-steps (reduce-orbit-phase1), task 6.2 — each basic content handles, itself, the result its command
 * returns in the usual case, so the session never opens the reference there. Shown in a disposable project by
 * running the built CLI:
 *
 * - at the defaults (no `commit`, `push`, `chain`, `signoff` or `size_ceiling` key): `orbit pr commit` → `action: off`,
 *   the status `chain` object → `configured: false`, `orbit brief --change` and `orbit brief <doc>` `--hold` →
 *   `why: "off"`, and the status `size` object → `ceiling: null`;
 * - the three stage-D steps' usual results (the stage's second exit criterion): every reviewed gate `passed` or
 *   `superseded` at archive, `orbit fingerprint --check` with every requirement `verified`, and a size check that is on
 *   with `breaches` empty.
 */

let root: string;
const NAME = 'foo';
const C = `orbit/changes/${NAME}/`;
const write = (rel: string, content: string): void => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), content);
};
const clean = (cls: string) =>
  JSON.stringify({ command: 'review', mode: 'system', reviewer_class: cls, findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [] });
const cli = async (args: string[]): Promise<Record<string, unknown>> => {
  const r = await runCLI(args, { cwd: root });
  expect(r.exitCode, `${args.join(' ')}: ${r.stderr}`).toBe(0);
  return JSON.parse(r.stdout) as Record<string, unknown>;
};
const body = (dir: string): string => {
  const s = getSkillTemplates().find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template.instructions;
};

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-conditional-steps-'));
  write('orbit/config.yaml', 'schema: spec-driven\n');
  write('orbit/specs/cap/spec.md', '# cap\n\n## Purpose\n\nA capability.\n\n## Requirements\n\n### Requirement: X\n\nThe system SHALL x.\n\n#### Scenario: s\n\n- **WHEN** a\n- **THEN** b\n');
  write(C + '.openspec.yaml', 'schema: spec-driven\nschema_version: 5\n');
  write(C + 'proposal.md', '## Why\n\nTo change x.\n\n## What Changes\n\n- x changes.\n');
  write(C + 'design.md', '## Context\n\nx.\n');
  write(C + 'specs/cap/spec.md', '## MODIFIED Requirements\n\n### Requirement: X\n\nThe system SHALL x, now better.\n\n#### Scenario: s\n\n- **WHEN** a\n- **THEN** b\n');
  write(C + 'tasks.md', '## 1. G\n\n- [x] 1.1 do\n');
  // A system cadence that passed: a fresh pass, then an in-context one, each clean.
  write(C + '.orbit-runs/review-system-2026-07-01T10-00-00Z.json', clean('fresh'));
  write(C + '.orbit-runs/review-system-2026-07-01T11-00-00Z.json', clean('in-context'));
  write('orbit/architecture/prog.md', '# prog\n\n## Stages\n\n### Stage a — A\n\nDepends-on: (none)\nComplete: [ ]\n');
  const stamp = await runCLI(['fingerprint', NAME], { cwd: root });
  expect(stamp.exitCode, stamp.stderr).toBe(0);
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('at the defaults, each gating command returns the result its basic content handles', () => {
  it('`orbit pr commit` returns `action: off`, which the commit step\'s basic content handles', async () => {
    expect((await cli(['pr', 'commit', NAME, '--json'])).action).toBe('off');
    expect(COMMIT_STEP_BASIC).toContain('On `action: off`, print nothing and go on.');
  });

  it('the status `chain` object reports `configured: false`, which the chain end step\'s basic content handles', async () => {
    const status = await cli(['status', '--change', NAME, '--json']);
    expect((status.chain as { configured: boolean }).configured).toBe(false);
    expect(CHAIN_END_STEP_BASIC).toContain('On `configured: false`, print nothing more.');
  });

  it('both holds report `why: "off"`, which archive Step 3.7 and architect 5.4 handle', async () => {
    expect((await cli(['brief', '--change', NAME, '--hold', '--json'])).why).toBe('off');
    expect((await cli(['brief', 'prog', '--hold', '--json'])).why).toBe('off');
    expect(body('orbit-archive-change')).toContain('On `why: "off"`, go on silently, stating any warning in one line.');
    expect(PROGRAM_SIGNOFF_HOLD_BASIC).toContain('On `why: "off"`, say nothing about it and observe arc-done as Step 5.5 states');
  });

  it('the status `size` object reports `ceiling: null`, which the size brief\'s basic content handles', async () => {
    const status = await cli(['status', '--change', NAME, '--json']);
    expect((status.size as { ceiling: unknown }).ceiling).toBeNull();
    expect(body('orbit-propose')).toContain('When `ceiling` is `null` or `breaches` is empty, say nothing about size.');
  });
});

describe("the stage-D steps' usual results are the ones their basic contents handle", () => {
  it('at archive every reviewed gate is `passed` or `superseded`, which Step 3.4 handles without prompting', async () => {
    const gates = (await cli(['status', '--change', NAME, '--json'])).gates as Array<{ id: string; kind: string; state: string; superseded?: boolean }>;
    const reviewed = gates.filter((g) => g.kind === 'reviewed');
    expect(reviewed.map((g) => g.id)).toEqual(['review-proposal', 'review-system']);
    expect(reviewed.every((g) => g.state === 'passed' || g.superseded === true)).toBe(true);
    expect(body('orbit-archive-change')).toContain('When each is `passed` or `superseded: true` (or there are none), go on without prompting.');
  });

  it('`orbit fingerprint --check` reports every requirement `verified`, which Step 3.45 handles silently', async () => {
    const check = await cli(['fingerprint', NAME, '--check', '--json']);
    const statuses = JSON.stringify(check).match(/"status":"[a-z]+"/g) ?? [];
    expect(statuses.length).toBeGreaterThan(0);
    expect(new Set(statuses)).toEqual(new Set(['"status":"verified"']));
    expect(body('orbit-archive-change')).toContain('When every requirement is `verified` (or none is touched), go on silently.');
  });

  it('a size check that is on reports `breaches` empty, which the size brief handles silently', async () => {
    write('orbit/config.yaml', 'schema: spec-driven\nsize_ceiling:\n  capabilities: 3\n  requirements: 12\n');
    try {
      const size = (await cli(['status', '--change', NAME, '--json'])).size as { ceiling: unknown; breaches: unknown[] };
      expect(size.ceiling).not.toBeNull();
      expect(size.breaches).toEqual([]);
    } finally {
      write('orbit/config.yaml', 'schema: spec-driven\n');
    }
  });
});
