import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { runCLI } from '../helpers/run-cli.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, '..', 'fixtures', 'report-golden');

/**
 * `--report` CLI surface tests (D-arc Stage D4, task 2.2): the status gateway's
 * deepest zoom. Newest-default + explicit-TS resolution on the shared recency
 * axis, genre dispatch errors (exit non-zero), the --json / bare-form guards,
 * the read-only invariant, and the bare/--full/--change regression.
 */

describe('status --report surface', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-status-report-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function makeChange(name: string): Promise<string> {
    const dir = path.join(tempDir, 'orbit', 'changes', name);
    await fs.mkdir(path.join(dir, '.orbit-runs'), { recursive: true });
    await fs.writeFile(
      path.join(dir, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-01"\n'
    );
    await fs.writeFile(path.join(dir, 'proposal.md'), '# Proposal');
    await fs.writeFile(path.join(dir, 'design.md'), '# Design');
    await fs.writeFile(path.join(dir, 'tasks.md'), '## 1. Work\n\n- [ ] 1.1 Do the thing\n');
    await fs.mkdir(path.join(dir, 'specs', 'some-cap'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'specs', 'some-cap', 'spec.md'),
      '## ADDED Requirements\n\n### Requirement: X\n\nX SHALL Y.\n\n#### Scenario: S\n\n- **WHEN** a\n- **THEN** b\n'
    );
    return dir;
  }

  // W2 spine semantics: next_recommended is the deterministic pointer — with
  // findings it names THIS emit's own repo-relative path (token = the filename's).
  function d4Emit(
    change: string,
    mode: string,
    findingTitle?: string,
    token = '2026-07-25T10-00-00Z'
  ): string {
    const zero = { critical: 0, warning: 0, suggestion: 0 };
    return JSON.stringify({
      command: 'review',
      timestamp: '2026-07-25T10:00:00Z',
      change,
      final_assessment: findingTitle ? '0 critical, 1 warning, 0 suggestion.' : 'No findings.',
      next_recommended: findingTitle
        ? `/orbit:address-reviews ${change} --from-file orbit/changes/${change}/.orbit-runs/review-${mode}-${token}.json`
        : `orbit status --change ${change} --report`,
      kind: 'editorial',
      mode,
      reviewer_class: 'in-context',
      depth: 'full',
      scorecard: {
        completeness: { ...zero, warning: findingTitle ? 1 : 0 },
        correctness: { ...zero },
        coherence: { ...zero },
      },
      findings: findingTitle
        ? [
            {
              severity: 'WARNING',
              dimension: 'completeness',
              title: findingTitle,
              file: `orbit/changes/${change}/design.md`,
              line: 3,
              recommendation: 'Fix it.',
            },
          ]
        : [],
    });
  }

  const EXTERNAL_CLEAN =
    '# External Review: x (iteration 1)\n\n**Reviewer**: GPT-5 Codex\n**Date**: 2026-07-25\n\n' +
    '## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n';

  function proposeEmit(change: string): string {
    return JSON.stringify({
      command: 'propose',
      timestamp: '2026-07-20T10:00:00Z',
      change,
      final_assessment: 'Generated artifacts.',
      next_recommended: `/orbit:review ${change}`,
      kind: 'workflow',
    });
  }

  // @scenario behaviour orbit-report-rendering :: The render surface is the status gateway :: No-argument report renders the newest pass
  it('no-argument --report renders the newest review pass; repeated invocations render identically', async () => {
    const dir = await makeChange('newest-change');
    const runs = path.join(dir, '.orbit-runs');
    await fs.writeFile(
      path.join(runs, 'review-proposal-2026-07-25T10-00-00Z.json'),
      d4Emit('newest-change', 'proposal', 'Older finding')
    );
    await fs.writeFile(
      path.join(runs, 'review-proposal-2026-07-25T11-00-00Z.json'),
      d4Emit('newest-change', 'proposal', 'Newest finding', '2026-07-25T11-00-00Z')
    );

    const first = await runCLI(['status', '--change', 'newest-change', '--report'], { cwd: tempDir });
    expect(first.exitCode).toBe(0);
    expect(first.stdout).toContain('## Review: newest-change --as proposal');
    expect(first.stdout).toContain('Newest finding');
    expect(first.stdout).not.toContain('Older finding');
    expect(first.stdout).toContain('Iteration: 2');

    const second = await runCLI(['status', '--change', 'newest-change', '--report'], { cwd: tempDir });
    expect(second.stdout).toBe(first.stdout);
  });

  it('an explicit <TS> selects that pass (as-of iteration; the historical body renders)', async () => {
    const dir = await makeChange('explicit-change');
    const runs = path.join(dir, '.orbit-runs');
    await fs.writeFile(
      path.join(runs, 'review-proposal-2026-07-25T10-00-00Z.json'),
      d4Emit('explicit-change', 'proposal', 'Older finding')
    );
    await fs.writeFile(
      path.join(runs, 'review-proposal-2026-07-25T11-00-00Z.json'),
      d4Emit('explicit-change', 'proposal', 'Newest finding', '2026-07-25T11-00-00Z')
    );

    const result = await runCLI(
      ['status', '--change', 'explicit-change', '--report', '2026-07-25T10-00-00Z'],
      { cwd: tempDir }
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Older finding');
    expect(result.stdout).not.toContain('Newest finding');
    expect(result.stdout).toContain('Iteration: 1');
    expect(result.stdout).toContain('First proposal-mode review of this change.');
  });

  it('an external findings file renders through the shared grammar', async () => {
    const dir = await makeChange('ext-cli-change');
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'external-proposal-2026-07-25T12-00-00Z.md'),
      EXTERNAL_CLEAN
    );

    const result = await runCLI(['status', '--change', 'ext-cli-change', '--report'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('## Review: ext-cli-change --as proposal');
    expect(result.stdout).toContain('Reviewer: external (GPT-5 Codex, 2026-07-25)');
    expect(result.stdout).not.toContain('| Dimension'); // no scorecard for external passes
  });

  // @scenario behaviour orbit-report-rendering :: The render surface is the status gateway :: Non-renderable genre fails naming the renderable set
  it('a <TS> resolving to a non-renderable genre fails naming the genre and the renderable set, exit non-zero', async () => {
    const dir = await makeChange('genre-change');
    const runs = path.join(dir, '.orbit-runs');
    await fs.writeFile(path.join(runs, 'propose-2026-07-20T10-00-00Z.json'), proposeEmit('genre-change'));
    await fs.writeFile(
      path.join(runs, 'review-proposal-2026-07-25T10-00-00Z.json'),
      d4Emit('genre-change', 'proposal')
    );

    const result = await runCLI(
      ['status', '--change', 'genre-change', '--report', '2026-07-20T10-00-00Z'],
      { cwd: tempDir }
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
    const out = result.stdout + result.stderr;
    expect(out).toContain("emit genre 'propose' is not renderable");
    expect(out).toContain('renderable: review passes');
    expect(out).toContain('external findings');
  });

  // @scenario behaviour orbit-report-rendering :: The render surface is the status gateway :: Zero renderable passes fails loud
  it('zero renderable passes fails naming the empty renderable set, exit non-zero', async () => {
    const dir = await makeChange('empty-change');
    // A non-review emit only: the renderable set is still empty.
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'propose-2026-07-20T10-00-00Z.json'),
      proposeEmit('empty-change')
    );

    const result = await runCLI(['status', '--change', 'empty-change', '--report'], { cwd: tempDir });
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
    const out = result.stdout + result.stderr;
    expect(out).toContain("no renderable review pass in 'empty-change'");
    expect(out).toContain('renderable set is empty');
  });

  it('--report with --json is a clean error (the emit IS the JSON)', async () => {
    const dir = await makeChange('json-guard-change');
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'review-proposal-2026-07-25T10-00-00Z.json'),
      d4Emit('json-guard-change', 'proposal')
    );

    const result = await runCLI(
      ['status', '--change', 'json-guard-change', '--report', '--json'],
      { cwd: tempDir }
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('the emit IS the JSON');
  });

  it('--report without --change is a clean error (the report rides the per-change form)', async () => {
    await makeChange('bare-guard-change');

    const result = await runCLI(['status', '--report'], { cwd: tempDir });
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('--report requires --change');
  });

  it('pre-boundary and malformed-external failures write nothing to stdout', async () => {
    const dir = await makeChange('err-stdout-change');
    const runs = path.join(dir, '.orbit-runs');
    // Pre-boundary: the kind+findings_summary generation (no scorecard).
    await fs.writeFile(
      path.join(runs, 'review-proposal-2026-07-20T10-00-00Z.json'),
      JSON.stringify({
        command: 'review', timestamp: '2026-07-20T10:00:00Z', change: 'err-stdout-change',
        final_assessment: 'ok', next_recommended: 'x', kind: 'editorial', mode: 'proposal',
        findings_summary: { critical: 0, warning: 0, suggestion: 0 },
      })
    );
    const pre = await runCLI(
      ['status', '--change', 'err-stdout-change', '--report', '2026-07-20T10-00-00Z'],
      { cwd: tempDir }
    );
    expect(pre.exitCode).not.toBe(0);
    expect(pre.stdout).toBe('');
    expect(pre.stderr).toContain('pre-capability emit');

    // Malformed external: missing the Reviewer header field.
    await fs.writeFile(
      path.join(runs, 'external-proposal-2026-07-21T10-00-00Z.md'),
      '# External Review: err-stdout-change (iteration 1)\n\n**Date**: 2026-07-21\n\n' +
        '## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
    );
    const ext = await runCLI(
      ['status', '--change', 'err-stdout-change', '--report', '2026-07-21T10-00-00Z'],
      { cwd: tempDir }
    );
    expect(ext.exitCode).not.toBe(0);
    expect(ext.stdout).toBe('');
  });

  it('equal tokens resolve by the shared tie-break: the lexicographically-earlier filename is more recent', async () => {
    const dir = await makeChange('tie-cli-change');
    const runs = path.join(dir, '.orbit-runs');
    const token = '2026-07-25T10-00-00Z';
    await fs.writeFile(
      path.join(runs, `review-proposal-${token}.json`),
      d4Emit('tie-cli-change', 'proposal', 'Internal finding')
    );
    await fs.writeFile(path.join(runs, `external-proposal-${token}.md`), EXTERNAL_CLEAN);

    // `external-…` < `review-…` lexicographically → the external pass is more
    // recent; both newest-default and the explicit token resolve to it.
    for (const args of [
      ['status', '--change', 'tie-cli-change', '--report'],
      ['status', '--change', 'tie-cli-change', '--report', token],
    ]) {
      const result = await runCLI(args, { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Reviewer: external (GPT-5 Codex, 2026-07-25)');
      expect(result.stdout).toContain('Iteration: 2'); // distinct ordinal on the shared order
    }
  });

  // @scenario behaviour orbit-report-rendering :: The render surface is the status gateway :: Read-only surface
  it('READ-ONLY: a --report invocation creates and modifies no files (two-sided snapshot)', async () => {
    const dir = await makeChange('readonly-change');
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'review-proposal-2026-07-25T10-00-00Z.json'),
      d4Emit('readonly-change', 'proposal', 'A finding')
    );
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'external-proposal-2026-07-25T12-00-00Z.md'),
      EXTERNAL_CLEAN
    );

    const snapshot = async (): Promise<string[]> => {
      const acc: string[] = [];
      const walk = async (d: string): Promise<void> => {
        for (const entry of await fs.readdir(d, { withFileTypes: true })) {
          const p = path.join(d, entry.name);
          if (entry.isDirectory()) await walk(p);
          else {
            const stat = await fs.stat(p);
            acc.push(`${path.relative(tempDir, p)}:${stat.size}:${stat.mtimeMs}`);
          }
        }
      };
      await walk(tempDir);
      return acc.sort();
    };

    const before = await snapshot();
    const result = await runCLI(['status', '--change', 'readonly-change', '--report'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(await snapshot()).toEqual(before);
  });

  it('D5 model-hint garnish: the report tail eligibility line appends the hint when a models map resolves, byte-identical without', async () => {
    const dir = await makeChange('hint-tail-change');
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'review-proposal-2026-07-25T10-00-00Z.json'),
      d4Emit('hint-tail-change', 'proposal', 'A finding')
    );

    const bare = await runCLI(['status', '--change', 'hint-tail-change', '--report'], { cwd: tempDir });
    expect(bare.exitCode).toBe(0);
    expect(bare.stdout).not.toContain('— hint:');

    // Cover phase + every cadence slot so the resolved key is irrelevant to the assertion.
    const entries = ['review-proposal', 'in-context', 'fresh', 'independent', 'external']
      .map((k) => `  ${k}: TailModel`)
      .join('\n');
    await fs.writeFile(path.join(tempDir, 'orbit', 'config.yaml'), `models:\n${entries}\n`);

    const hinted = await runCLI(['status', '--change', 'hint-tail-change', '--report'], { cwd: tempDir });
    expect(hinted.exitCode).toBe(0);
    const tailLine = hinted.stdout.split('\n').find((l) => l.startsWith('Ready when you are:'));
    expect(tailLine).toContain(' — hint: TailModel');
    // The hint suffix is the ONLY difference.
    expect(hinted.stdout.replace(' — hint: TailModel', '')).toBe(bare.stdout);
  });

  it('regression: bare, --full, and --change outputs are unchanged by the --report addition', async () => {
    const dir = await makeChange('regress-change');
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'propose-2026-07-20T10-00-00Z.json'),
      proposeEmit('regress-change')
    );

    const bare = await runCLI(['status'], { cwd: tempDir });
    expect(bare.exitCode).toBe(0);
    expect(bare.stdout + bare.stderr).toContain('regress-change');
    expect(bare.stdout + bare.stderr).toContain('Ready when you are:');
    expect(bare.stdout).not.toContain('## Review:');

    const full = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(full.exitCode).toBe(0);
    expect(full.stdout + full.stderr).toContain('regress-change');
    expect(full.stdout).not.toContain('## Review:');

    const change = await runCLI(['status', '--change', 'regress-change'], { cwd: tempDir });
    expect(change.exitCode).toBe(0);
    expect(change.stdout + change.stderr).toContain('Gates:');
    expect(change.stdout).not.toContain('## Review:');

    const json = await runCLI(['status', '--change', 'regress-change', '--json'], { cwd: tempDir });
    expect(json.exitCode).toBe(0);
    const payload = JSON.parse(json.stdout);
    expect(Array.isArray(payload.gates)).toBe(true);
  });
});
