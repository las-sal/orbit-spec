import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';
import { runCLI } from '../helpers/run-cli.js';

const OPEN = (name: string) => `<!${'--'} src:${name} ${'--'}>`;
const CLOSE = `<!${'--'} /src ${'--'}>`;

describe('orbit validate --sources', () => {
  let root: string;

  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-validate-sources-')));
    fs.mkdirSync(path.join(root, 'orbit', 'architecture'), { recursive: true });
    fs.mkdirSync(path.join(root, 'orbit', 'specs', 'alpha'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'orbit', 'specs', 'alpha', 'spec.md'),
      [
        '## Purpose',
        'A deterministic alpha capability exercised by the validation harness in tests.',
        '',
        '## Requirements',
        '',
        '### Requirement: Alpha SHALL be deterministic',
        'The alpha module SHALL produce a deterministic response for validation.',
        '',
        '#### Scenario: Deterministic alpha run',
        '- **GIVEN** a configured alpha module',
        '- **WHEN** the module runs the default flow',
        '- **THEN** the output matches the expected fixture result',
        '',
      ].join('\n')
    );
    fs.writeFileSync(
      path.join(root, 'orbit', 'architecture', 'prog.md'),
      ['# Program', '', '### Stage s1 — one', '', '### Stage s2 — two', ''].join('\n')
    );
    git('init', '-q');
    git('config', 'user.email', 't@example.com');
    git('config', 'user.name', 'T');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const writeRegistry = () =>
    fs.writeFileSync(
      path.join(root, 'orbit', 'sources.yaml'),
      'sources:\n  stages:\n    engine: architecture.stage-count\n    doc: prog\n'
    );

  const track = () => {
    git('add', '-A');
    git('commit', '-q', '-m', 'x');
  };

  it('with no registry, --sources says so and exits zero', async () => {
    track();
    const result = await runCLI(['validate', '--sources'], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No source registry');
  });

  it('with no registry, --all carries NO source keys and no sources byType entry', async () => {
    track();
    const result = await runCLI(['validate', '--all', '--json'], { cwd: root });
    const json = JSON.parse(result.stdout.trim());
    expect(json).not.toHaveProperty('source_findings');
    expect(json).not.toHaveProperty('source_coverage');
    expect(json.summary.byType).not.toHaveProperty('sources');
    // The retired invariant still holds while no registry is present.
    expect(json.summary.totals.items).toBe(json.items.length);
  });

  it('renders coverage after findings and exits non-zero on a disagreement', async () => {
    writeRegistry();
    fs.writeFileSync(path.join(root, 'GOV.md'), `The program has ${OPEN('stages')}17${CLOSE} stages.\n`);
    track();
    const result = await runCLI(['validate', '--sources'], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("source 'stages' emits \"2\"");
    expect(result.stdout).toContain('Sources:');
    expect(result.stdout).toContain('stages = 2 (1 marker)');
  });

  it('--json carries discriminated source_findings and source_coverage', async () => {
    writeRegistry();
    fs.writeFileSync(path.join(root, 'GOV.md'), `has ${OPEN('stages')}17${CLOSE}\n`);
    track();
    const result = await runCLI(['validate', '--sources', '--json'], { cwd: root });
    const json = JSON.parse(result.stdout.trim());
    expect(json.source_findings).toEqual([
      { kind: 'mismatch', file: 'GOV.md', line: 1, source: 'stages', span_text: '17', source_value: '2' },
    ]);
    // Each kind carries exactly its own fields — no null padding.
    expect(Object.keys(json.source_findings[0]).sort()).toEqual([
      'file',
      'kind',
      'line',
      'source',
      'source_value',
      'span_text',
    ]);
    expect(json.source_coverage).toEqual([{ source: 'stages', value: '2', markers: 1 }]);
  });

  it('ONE ITEM IS ONE DECLARED SOURCE, rolled into summary.totals', async () => {
    writeRegistry();
    fs.writeFileSync(path.join(root, 'GOV.md'), `has ${OPEN('stages')}17${CLOSE}\n`);
    track();
    const result = await runCLI(['validate', '--all', '--json'], { cwd: root });
    const json = JSON.parse(result.stdout.trim());
    expect(json.summary.byType.sources).toEqual({ items: 1, passed: 0, failed: 1 });
    const itemTotals = json.summary.byType.change.items + json.summary.byType.spec.items;
    expect(json.summary.totals.items).toBe(itemTotals + 1);
    expect(json.summary.totals.failed).toBeGreaterThan(0);
  });

  it('RETIRES the totals.items === items.length invariant on a registry-bearing run', async () => {
    writeRegistry();
    track();
    const result = await runCLI(['validate', '--all', '--json'], { cwd: root });
    const json = JSON.parse(result.stdout.trim());
    // Source items are deliberately NOT BulkItemResult records, so they never enter items[].
    expect(json.items.every((i: any) => i.type === 'change' || i.type === 'spec')).toBe(true);
    expect(json.summary.totals.items).toBe(json.items.length + 1);
    expect(json.summary.totals.items).not.toBe(json.items.length);
  });

  it('a registry-level fault is ONE failed pseudo-item — never zero failed beside a non-zero exit', async () => {
    fs.writeFileSync(path.join(root, 'orbit', 'sources.yaml'), 'sources:\n  a:\n    engine: not.a.source\n');
    track();
    const result = await runCLI(['validate', '--sources', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    const json = JSON.parse(result.stdout.trim());
    expect(json.source_findings).toHaveLength(1);
    expect(json.source_findings[0].kind).toBe('registry');
    expect(Object.keys(json.source_findings[0]).sort()).toEqual(['detail', 'file', 'kind']);
    expect(json.summary.byType.sources).toEqual({ items: 1, passed: 0, failed: 1 });
    expect(json.summary.totals.failed).toBe(1);
  });

  it('a marker error is unattributable to any source and still fails the run', async () => {
    writeRegistry();
    fs.writeFileSync(path.join(root, 'BROKEN.md'), `${OPEN('stages')}2 and no closer\n`);
    track();
    const result = await runCLI(['validate', '--sources', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    const json = JSON.parse(result.stdout.trim());
    expect(json.source_findings[0].kind).toBe('marker');
    expect(Object.keys(json.source_findings[0]).sort()).toEqual(['detail', 'file', 'kind', 'line']);
    // The declared source passes; the pseudo-item carries the failure.
    expect(json.summary.byType.sources).toEqual({ items: 2, passed: 1, failed: 1 });
  });

  it('an empty file domain is reported with its reason in BOTH output modes', async () => {
    // A checkout git cannot answer for: the run checks nothing and must say so rather than
    // reading as a clean verification.
    const nogit = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-nogit-cli-')));
    try {
      fs.mkdirSync(path.join(nogit, 'orbit', 'architecture'), { recursive: true });
      fs.writeFileSync(
        path.join(nogit, 'orbit', 'architecture', 'prog.md'),
        ['# Program', '', '### Stage s1 — one', ''].join('\n')
      );
      fs.writeFileSync(
        path.join(nogit, 'orbit', 'sources.yaml'),
        'sources:\n  stages:\n    engine: architecture.stage-count\n    doc: prog\n'
      );
      for (const args of [['validate', '--sources'], ['validate', '--sources', '--json']]) {
        const result = await runCLI(args, { cwd: nogit, env: { GIT_CEILING_DIRECTORIES: os.tmpdir() } });
        expect(result.exitCode, args.join(' ')).toBe(0);
        expect(result.stderr, args.join(' ')).toContain('the source lint checked no files');
      }
    } finally {
      fs.rmSync(nogit, { recursive: true, force: true });
    }
  });

  it('per-item validation is unchanged by the lint', async () => {
    writeRegistry();
    fs.writeFileSync(path.join(root, 'GOV.md'), `has ${OPEN('stages')}17${CLOSE}\n`);
    track();
    const result = await runCLI(['validate', 'alpha', '--json'], { cwd: root });
    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout.trim());
    expect(json).not.toHaveProperty('source_findings');
    expect(json.summary.totals.items).toBe(1);
  });
});
