import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EmitCommand } from '../../src/commands/emit.js';

let root: string;
let cwd: string;

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-emit-cli-'));
  cwd = process.cwd();
  process.chdir(root);
  write('orbit/changes/foo/proposal.md', '# P\n');
  write('orbit/changes/foo/design.md', '# D\n');
  write('orbit/changes/foo/specs/cap/spec.md', '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write('orbit/changes/foo/tasks.md', '# Tasks\n\n## 1. G\n\n- [ ] 1.1 x\n');
  write('orbit/changes/foo/.openspec.yaml', 'schema: spec-driven\nschema_version: 3\n');
});

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('EmitCommand (CLI surface)', () => {
  it('with --payload, stdin is not consulted and stdout is the written path', async () => {
    write('payload.json', JSON.stringify({ final_assessment: 'clean', verdict: 'pass', model: null }));
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m: any) => logs.push(String(m)));
    const code = await new EmitCommand().execute('verify', { payload: 'payload.json', change: 'foo' });
    expect(code).toBe(0);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/verify-\d{4}.*\.json$/);
    expect(fs.existsSync(logs[0])).toBe(true);
  });

  it('--json makes stdout exactly one {path, emit} object with no plain-text framing', async () => {
    write('payload.json', JSON.stringify({ final_assessment: 'clean', verdict: 'pass', model: null }));
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m: any) => logs.push(String(m)));
    const code = await new EmitCommand().execute('verify', { payload: 'payload.json', change: 'foo', json: true });
    expect(code).toBe(0);
    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]); // the whole stdout parses as one document
    expect(Object.keys(parsed).sort()).toEqual(['emit', 'path']);
    expect(parsed.emit.command).toBe('verify');
  });

  it('an unreadable --payload file fails cleanly with empty stdout', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m: any) => logs.push(String(m)));
    await expect(
      new EmitCommand().execute('verify', { payload: 'missing.json', change: 'foo' })
    ).rejects.toThrow(/--payload file not readable/);
    expect(logs).toHaveLength(0);
  });

  it('invalid payload JSON fails cleanly naming the parse problem', async () => {
    write('payload.json', '{not json');
    await expect(
      new EmitCommand().execute('verify', { payload: 'payload.json', change: 'foo' })
    ).rejects.toThrow(/payload is not valid JSON/);
  });

  it('composition warnings go to stderr, never stdout', async () => {
    write('orbit/explore/bar/explore.md', '## Decisions\n\n- one\n');
    write('payload.json', JSON.stringify({ final_assessment: 'begin', model: null }));
    const logs: string[] = [];
    const errs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m: any) => logs.push(String(m)));
    vi.spyOn(console, 'error').mockImplementation((m: any) => errs.push(String(m)));
    const code = await new EmitCommand().execute('explore', { payload: 'payload.json', change: 'bar' });
    expect(code).toBe(0);
    expect(logs).toHaveLength(1); // path only
    expect(errs.some(e => e.includes('Open questions'))).toBe(true);
  });
});

describe('rc04b: the direction refusal at the CLI surface (task 1.1 — exit non-zero, empty stdout, no file)', () => {
  it('a fresh review payload with no direction rejects naming direction and the class; stdout is empty; no file lands', async () => {
    const zero = { critical: 0, warning: 0, suggestion: 0 };
    write('payload.json', JSON.stringify({
      mode: 'proposal', reviewer_class: 'fresh', depth: 'full', passes_run: ['1'], passes_skipped: [],
      scorecard: { completeness: { ...zero }, correctness: { ...zero }, coherence: { ...zero } },
      findings: [], stale_suppressed: [], model: null,
    }));
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m: any) => logs.push(String(m)));
    await expect(
      new EmitCommand().execute('review', { payload: 'payload.json', change: 'foo' })
    ).rejects.toThrow(/review emit of class 'fresh' carries no direction/);
    expect(logs).toHaveLength(0);
    expect(fs.existsSync('orbit/changes/foo/.orbit-runs')).toBe(false);
  });
});
