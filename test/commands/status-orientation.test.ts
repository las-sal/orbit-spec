import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { runCLI } from '../helpers/run-cli.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Orientation CLI tests (D-arc Stage D3, task 2.4): bare sprint render, the
 * error-path-claimed regression (bare exit 0; `--change` and no-changes
 * unchanged incl. gate rows), `--full` nesting + flat fleet, JSON shapes
 * (explore + degraded variants, both tiers), the bare degraded-sprint render,
 * and eligibility framing.
 */

describe('status orientation surface', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-status-orientation-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function makeChange(
    name: string,
    opts: { schema?: string; emit?: boolean; complete?: boolean } = {}
  ) {
    const dir = path.join(tempDir, 'orbit', 'changes', name);
    await fs.mkdir(path.join(dir, '.orbit-runs'), { recursive: true });
    await fs.writeFile(
      path.join(dir, '.openspec.yaml'),
      `schema: ${opts.schema ?? 'spec-driven'}\ncreated: "2026-07-01"\n`
    );
    await fs.writeFile(path.join(dir, 'proposal.md'), '# Proposal');
    if (opts.complete !== false) {
      // Complete artifact set: with propose done, the gate graph computes a
      // canonical next_command (the bare view's `next` source for changes).
      await fs.writeFile(path.join(dir, 'design.md'), '# Design');
      await fs.writeFile(path.join(dir, 'tasks.md'), '## 1. Work\n\n- [ ] 1.1 Do the thing\n');
      await fs.mkdir(path.join(dir, 'specs', 'some-cap'), { recursive: true });
      await fs.writeFile(
        path.join(dir, 'specs', 'some-cap', 'spec.md'),
        '## ADDED Requirements\n\n### Requirement: X\n\nX SHALL Y.\n\n#### Scenario: S\n\n- **WHEN** a\n- **THEN** b\n'
      );
    }
    if (opts.emit) {
      await fs.writeFile(
        path.join(dir, '.orbit-runs', 'propose-2026-07-20T10-00-00Z.json'),
        JSON.stringify({
          command: 'propose',
          timestamp: '2026-07-20T10:00:00Z',
          change: name,
          final_assessment: `Generated artifacts for ${name}. Extra detail sentence.`,
          next_recommended: `/orbit:review ${name}`,
          kind: 'workflow',
        })
      );
    }
    return dir;
  }

  async function makeExplore(name: string) {
    const dir = path.join(tempDir, 'orbit', 'explore', name);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-10"\n'
    );
    await fs.writeFile(path.join(dir, 'explore.md'), '# Exploration');
    return dir;
  }

  async function makeBrokenChange(name: string) {
    const schemaDir = path.join(tempDir, 'orbit', 'schemas', 'broken-yaml');
    await fs.mkdir(schemaDir, { recursive: true });
    await fs.writeFile(path.join(schemaDir, 'schema.yaml'), 'name: [unclosed\n');
    return makeChange(name, { schema: 'broken-yaml' });
  }

  async function makeArcDoc(name: string, stageId: string) {
    const dir = path.join(tempDir, 'orbit', 'architecture');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${name}.md`),
      `# Program ${name}\n\n### Stage ${stageId} — the first stage\n\nCharter text.\n`
    );
  }

  it('bare renders the sprint view mid-sprint (strip, last, next, also) with exit 0', async () => {
    await makeChange('sprint-change', { emit: true });
    await makeChange('other-change');

    const result = await runCLI(['status'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const out = result.stdout + result.stderr;
    expect(out).toContain('sprint-change');
    expect(out).toContain('propose'); // strip phase
    expect(out).toContain('→'); // strip arrows
    expect(out).toContain('last: propose ·');
    expect(out).toContain(`Generated artifacts for sprint-change.`); // first-sentence trim
    expect(out).not.toContain('Extra detail sentence'); // trimmed
    expect(out).toContain('Ready when you are:');
    expect(out).toContain('also:');
    expect(out).toContain('other-change');
  });

  it('regression: --change output keeps gate rows and gates[] markers; no-changes message unchanged', async () => {
    await makeChange('gated-change');

    const text = await runCLI(['status', '--change', 'gated-change'], { cwd: tempDir });
    expect(text.exitCode).toBe(0);
    expect(text.stdout + text.stderr).toContain('Gates:');

    const json = await runCLI(['status', '--change', 'gated-change', '--json'], { cwd: tempDir });
    const payload = JSON.parse(json.stdout);
    expect(Array.isArray(payload.gates)).toBe(true);
    expect(payload.gates.length).toBeGreaterThan(0);

    // No-changes message byte-identical (empty workspace).
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-status-empty-'));
    try {
      const none = await runCLI(['status'], { cwd: empty });
      expect(none.exitCode).toBe(0);
      expect(none.stdout).toContain('No active changes. Create one with: orbit new change <name>');
    } finally {
      await fs.rm(empty, { recursive: true, force: true });
    }
  });

  it('--full nests cited workstreams under stages and lists uncited under standalone', async () => {
    await makeArcDoc('my-arc', 's1');
    const cited = await makeChange('cited-change', { emit: true });
    await fs.writeFile(
      path.join(cited, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-01"\narchitecture:\n  doc: my-arc\n  stage: s1\n'
    );
    await makeChange('uncited-change');

    const result = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const out = result.stdout + result.stderr;
    expect(out).toContain('PROGRAM');
    expect(out).toContain('my-arc');
    expect(out).toContain('s1:');
    expect(out).toContain('standalone');
    const s1Idx = out.indexOf('s1:');
    const citedIdx = out.indexOf('cited-change');
    const standaloneIdx = out.indexOf('standalone');
    const uncitedIdx = out.indexOf('uncited-change');
    expect(citedIdx).toBeGreaterThan(s1Idx);
    expect(uncitedIdx).toBeGreaterThan(standaloneIdx);
  });

  it('--full degrades to the flat fleet with zero parseable docs (never an error)', async () => {
    await makeChange('flat-a', { emit: true });
    await makeChange('flat-b');

    const result = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const out = result.stdout + result.stderr;
    expect(out).not.toContain('PROGRAM');
    expect(out).toContain('flat-a');
    expect(out).toContain('flat-b');
    expect(out).toContain('→'); // entries still carry strips (the full tuple)
  });

  it('bare --json emits {sprint, last, next, also, waiting} with the shared entry shape', async () => {
    await makeChange('json-sprint', { emit: true });

    const result = await runCLI(['status', '--json'], { cwd: tempDir });
    const payload = JSON.parse(result.stdout);
    expect(Object.keys(payload).sort()).toEqual(['also', 'last', 'next', 'sprint', 'waiting']);
    expect(payload.sprint.kind).toBe('change');
    expect(payload.sprint.status).toBeDefined(); // per-change payload NESTS under status
    expect(payload.sprint.gates).toBeUndefined(); // no entry-level gates key
    expect(Array.isArray(payload.sprint.strip)).toBe(true);
    expect(payload.sprint.strip[0]).toHaveProperty('phase');
    expect(payload.sprint.strip[0]).toHaveProperty('glyph');
    // Untruncated final_assessment in JSON.
    expect(payload.last.final_assessment).toContain('Extra detail sentence');
  });

  it('an explore sprint emits the explore variant (kind, position, no status key)', async () => {
    await makeExplore('idea-x');

    const result = await runCLI(['status', '--json'], { cwd: tempDir });
    const payload = JSON.parse(result.stdout);
    expect(payload.sprint.kind).toBe('explore');
    expect(payload.sprint.position).toBe('exploring');
    expect('status' in payload.sprint).toBe(false);
    expect(payload.sprint.next).toBe('/orbit:explore idea-x — continue capturing thinking');
  });

  it('degraded entries carry the degraded variant in both tiers; bare degraded sprint exits 0', async () => {
    const dir = await makeBrokenChange('busted');
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'propose-2026-07-20T10-00-00Z.json'),
      JSON.stringify({
        command: 'propose',
        timestamp: '2026-07-20T10:00:00Z',
        change: 'busted',
        final_assessment: 'Before the breakage.',
        next_recommended: '/orbit:review busted',
        kind: 'workflow',
      })
    );

    // Bare: the degraded sprint renders the degraded row, trustworthy last, exit 0.
    const bare = await runCLI(['status'], { cwd: tempDir });
    expect(bare.exitCode).toBe(0);
    const out = bare.stdout + bare.stderr;
    expect(out).toContain('DEGRADED');
    expect(out).toContain('Before the breakage.');

    // Bare JSON: degraded variant, no fabricated tuple.
    const bareJson = await runCLI(['status', '--json'], { cwd: tempDir });
    const bp = JSON.parse(bareJson.stdout);
    expect(bp.sprint.degraded).toBe(true);
    expect(typeof bp.sprint.error).toBe('string');
    expect('strip' in bp.sprint).toBe(false);
    expect('status' in bp.sprint).toBe(false);

    // Full JSON: same variant.
    const fullJson = await runCLI(['status', '--full', '--json'], { cwd: tempDir });
    const fp = JSON.parse(fullJson.stdout);
    const busted = fp.workstreams.find((w: { name: string }) => w.name === 'busted');
    expect(busted.degraded).toBe(true);
  });

  it('one broken workstream degrades alone: healthy rows render fully, exit 0', async () => {
    await makeBrokenChange('busted');
    await makeChange('fine', { emit: true });

    const result = await runCLI(['status', '--full', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    const fine = payload.workstreams.find((w: { name: string }) => w.name === 'fine');
    const busted = payload.workstreams.find((w: { name: string }) => w.name === 'busted');
    expect(busted.degraded).toBe(true);
    expect(fine.degraded).toBeUndefined();
    expect(Array.isArray(fine.strip)).toBe(true);
    expect(fine.next).toBeDefined();
  });

  it('ladder rung 2: zero live workstreams + parseable docs → bare renders the full view (JSON switches tier)', async () => {
    await makeArcDoc('lonely-arc', 's1');

    const text = await runCLI(['status'], { cwd: tempDir });
    expect(text.exitCode).toBe(0);
    expect(text.stdout + text.stderr).toContain('PROGRAM');

    const json = await runCLI(['status', '--json'], { cwd: tempDir });
    const payload = JSON.parse(json.stdout);
    expect(Object.keys(payload).sort()).toEqual(['last', 'program', 'waiting', 'workstreams']);
  });

  it('cold-start criterion (arc exit criterion 1): ONE --full --json answers position/last/next per workstream, read-only', async () => {
    await makeChange('ws-alpha', { emit: true });
    await makeChange('ws-beta', { emit: true });
    await makeExplore('ws-gamma');

    // Snapshot the workspace before: the surface must create and modify no files.
    const snapshot = async (): Promise<string[]> => {
      const acc: string[] = [];
      const walk = async (dir: string): Promise<void> => {
        for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
          const p = path.join(dir, entry.name);
          if (entry.isDirectory()) await walk(p);
          else acc.push(`${path.relative(tempDir, p)}:${(await fs.stat(p)).size}`);
        }
      };
      await walk(tempDir);
      return acc.sort();
    };
    const before = await snapshot();

    const result = await runCLI(['status', '--full', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);

    // Every workstream entry carries its full orientation tuple — text-free
    // cold start: position / last / next answered per workstream from ONE command.
    expect(payload.workstreams).toHaveLength(3);
    for (const entry of payload.workstreams) {
      expect(entry.degraded).toBeUndefined();
      expect(Array.isArray(entry.strip)).toBe(true);
      expect(typeof entry.position === 'string' || entry.kind === 'change').toBe(true);
      if (entry.kind === 'change') {
        expect(entry.status).toBeDefined();
        expect(entry.last?.command).toBe('propose');
      } else {
        expect(entry.position).toBe('exploring');
      }
      expect(typeof entry.next).toBe('string'); // own next, every entry
    }

    // Text tier answers the same per workstream.
    const text = await runCLI(['status', '--full'], { cwd: tempDir });
    const out = text.stdout + text.stderr;
    for (const name of ['ws-alpha', 'ws-beta', 'ws-gamma']) expect(out).toContain(name);
    expect((out.match(/Ready when you are:/g) ?? []).length).toBeGreaterThanOrEqual(3);

    // READ-ONLY (two-sided): no file created or modified by either invocation.
    expect(await snapshot()).toEqual(before);
  });

  it('CLAUDE.md names the orientation command (the cold-start pointer)', async () => {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const claudeMd = await fs.readFile(path.join(repoRoot, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('run `orbit status`');
    expect(claudeMd).toMatch(/`--full` for the\s+whole arc/);
  });

  it('eligibility framing: never an imperative Next label; the eligibility literal is capitalized', async () => {
    await makeChange('framed', { emit: true });

    const result = await runCLI(['status'], { cwd: tempDir });
    const out = result.stdout + result.stderr;
    expect(out).not.toMatch(/^Next:/m); // the D1 grep rule
    expect(out).toContain('Ready when you are:');
    expect(out).not.toContain('ready when you are:');
  });
});
