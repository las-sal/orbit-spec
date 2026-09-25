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

  async function writeReviewEmit(dir: string, mode: string, ts: string) {
    const zero = { critical: 0, warning: 0, suggestion: 0 };
    await fs.writeFile(
      path.join(dir, '.orbit-runs', `review-${mode}-${ts}.json`),
      JSON.stringify({
        command: 'review',
        timestamp: ts.replace(/-(\d{2})-(\d{2})Z$/, ':$1:$2Z'),
        change: path.basename(dir),
        final_assessment: 'No findings.',
        next_recommended: `orbit status --change ${path.basename(dir)} --report`,
        kind: 'editorial',
        mode,
        reviewer_class: 'in-context',
        depth: 'full',
        scorecard: { completeness: { ...zero }, correctness: { ...zero }, coherence: { ...zero } },
        findings: [],
      })
    );
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
    expect(out).toContain('review ⟲'); // the pending review chip's ⟲ identity (spec literal)
    expect(out).toContain('last: propose ·');
    expect(out).toContain(`Generated artifacts for sprint-change.`); // first-sentence trim
    expect(out).not.toContain('Extra detail sentence'); // trimmed
    expect(out).toContain('Ready when you are:');
    expect(out).toContain('also:');
    // The also-line phase is the ENGINE frontier gate (review-proposal for a
    // complete-artifacts change), never a completed predecessor.
    expect(out).toContain('other-change (review)');
  });

  it('D5 model-hint garnish: bare and --full eligibility lines append the hint for change sprints when a models map resolves', async () => {
    await makeChange('hint-sprint-change', { emit: true });

    const bare = await runCLI(['status'], { cwd: tempDir });
    expect(bare.exitCode).toBe(0);
    expect(bare.stdout).not.toContain('— hint:');

    const entries = ['review-proposal', 'in-context', 'fresh', 'independent', 'external']
      .map((k) => `  ${k}: SprintModel`)
      .join('\n');
    await fs.writeFile(path.join(tempDir, 'orbit', 'config.yaml'), `models:\n${entries}\n`);

    const hinted = await runCLI(['status'], { cwd: tempDir });
    expect(hinted.exitCode).toBe(0);
    const nextLine = hinted.stdout.split('\n').find((l) => l.startsWith('Ready when you are:'));
    expect(nextLine).toContain(' — hint: SprintModel');
    expect(hinted.stdout.replace(' — hint: SprintModel', '')).toBe(bare.stdout);

    const full = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(full.exitCode).toBe(0);
    const fullNext = full.stdout.split('\n').find((l) => l.includes('Ready when you are:'));
    expect(fullNext).toContain(' — hint: SprintModel');
  });

  it('the review chip counts the SHARED pass axis: internal emits plus confident external findings files', async () => {
    const dir = await makeChange('axis-change', { emit: true });
    await writeReviewEmit(dir, 'proposal', '2026-07-21T10-00-00Z');
    await writeReviewEmit(dir, 'proposal', '2026-07-22T10-00-00Z');
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'external-proposal-2026-07-23T10-00-00Z.md'),
      [
        '# External Review: axis-change (iteration 3)', '',
        '**Reviewer**: Test Model', '**Date**: 2026-07-23', '',
        '## CRITICAL', '', 'None.', '',
        '## WARNING', '', 'None.', '',
        '## SUGGESTION', '', 'None.', '',
      ].join('\n')
    );
    // An unconfident external (missing sections) contributes nothing.
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'external-proposal-2026-07-24T10-00-00Z.md'),
      '# External Review: axis-change\n\n## CRITICAL\n\nNone.\n'
    );

    const result = await runCLI(['status'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const out = result.stdout + result.stderr;
    expect(out).toContain('review ⟲3'); // 2 internal + 1 confident external; the unconfident file adds nothing
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
    expect(out).toContain('s1 —'); // the architecture-status stage-line form
    expect(out).toContain('standalone');
    const s1Idx = out.indexOf('s1 —');
    const citedIdx = out.indexOf('cited-change');
    const standaloneIdx = out.indexOf('standalone');
    const uncitedIdx = out.indexOf('uncited-change');
    expect(citedIdx).toBeGreaterThan(s1Idx);
    expect(uncitedIdx).toBeGreaterThan(standaloneIdx);
  });

  it('--full lists legacy and malformed docs as the architecture-status surface lists them', async () => {
    await makeArcDoc('main-arc', 's1'); // ≥1 parseable doc → the PROGRAM band renders
    const archDir = path.join(tempDir, 'orbit', 'architecture');
    await fs.writeFile(path.join(archDir, 'old-notes.md'), '# Just prose\n\nNo stages here.\n');
    await fs.writeFile(
      path.join(archDir, 'half-broken.md'),
      '# P\n\n### Stage good-stage — fine\n\nText.\n\n### Stage broken stage\n\nOops.\n'
    );
    await makeChange('bystander', { emit: true });

    const text = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(text.exitCode).toBe(0);
    const out = text.stdout + text.stderr;
    expect(out).toContain('old-notes — legacy/opaque (no parseable stages)');
    expect(out).toContain('half-broken — MALFORMED (fix via: orbit architecture validate half-broken)');
    expect(out).toContain('line 7:'); // one-based violation line
    expect(out).toContain('good-stage'); // the well-formed sibling stage renders

    const json = await runCLI(['status', '--full', '--json'], { cwd: tempDir });
    const payload = JSON.parse(json.stdout);
    const broken = payload.program.malformed.find((m: { doc: string }) => m.doc === 'half-broken');
    expect(Array.isArray(broken.stages)).toBe(true); // the architecture-status payload shape
    expect(broken.stages[0].id).toBe('good-stage');
    expect(broken.violations[0].line).toBe(7);
    expect(payload.program.legacy).toContain('old-notes');
  });

  it('a workstream citing a well-formed sibling inside a MALFORMED doc nests under that stage', async () => {
    await makeArcDoc('main-arc', 's1'); // ≥1 parseable doc → PROGRAM band
    const archDir = path.join(tempDir, 'orbit', 'architecture');
    await fs.writeFile(
      path.join(archDir, 'half-broken.md'),
      '# P\n\n### Stage good-stage — fine\n\nText.\n\n### Stage broken stage\n\nOops.\n'
    );
    const cited = await makeChange('sibling-cited', { emit: true });
    await fs.writeFile(
      path.join(cited, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-01"\narchitecture:\n  doc: half-broken\n  stage: good-stage\n'
    );

    const result = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const out = result.stdout + result.stderr;
    const stageIdx = out.indexOf('good-stage —');
    const citedIdx = out.indexOf('sibling-cited (change)');
    expect(stageIdx).toBeGreaterThan(-1);
    expect(citedIdx).toBeGreaterThan(stageIdx); // nested beneath the sibling stage
    expect(out).not.toContain('standalone'); // NOT listed as standalone
  });

  it('--full text lists an uncited twin-named workstream under standalone (kind+name identity)', async () => {
    await makeArcDoc('my-arc', 's1');
    const cited = await makeChange('alpha', { emit: true });
    await fs.writeFile(
      path.join(cited, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-01"\narchitecture:\n  doc: my-arc\n  stage: s1\n'
    );
    await makeExplore('alpha'); // uncited twin — must NOT be dropped from the text view

    const result = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const out = result.stdout + result.stderr;
    expect(out).toContain('standalone');
    const standaloneIdx = out.indexOf('standalone');
    expect(out.indexOf('alpha (explore)', standaloneIdx)).toBeGreaterThan(standaloneIdx);
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

  it('bare --json emits {sprint, last, next, also, waiting, pr} with the shared entry shape', async () => {
    await makeChange('json-sprint', { emit: true });

    const result = await runCLI(['status', '--json'], { cwd: tempDir });
    const payload = JSON.parse(result.stdout);
    // `pr` joined in D6: the bodies read the RESOLVED regime here rather than parsing config.
    expect(Object.keys(payload).sort()).toEqual(['also', 'last', 'next', 'pr', 'sprint', 'waiting']);
    expect(payload.pr).toBe('never');
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

  it('a concluded explore sprint: position concluded, chip ■, and the next line BARE in text; --json carries the same string (rc13b)', async () => {
    const dir = await makeExplore('idea-done');
    await fs.mkdir(path.join(dir, '.orbit-runs'), { recursive: true });
    await fs.writeFile(
      path.join(dir, '.orbit-runs', 'explore-2026-07-20T10-00-00Z.json'),
      JSON.stringify({
        command: 'explore',
        timestamp: '2026-07-20T10:00:00Z',
        change: 'idea-done',
        kind: 'workflow',
        final_assessment: 'Concluded on the user\'s word.',
        next_recommended: 'Concluded 2026-09-25. Reopens when: a third withdrawn stage.',
        status: { token: 'concluded', date: '2026-09-25', re_entry: 'a third withdrawn stage' },
      })
    );

    const text = await runCLI(['status'], { cwd: tempDir });
    expect(text.exitCode).toBe(0);
    const lines = text.stdout.split('\n');
    expect(lines.some((l) => l.includes('explore ■'))).toBe(true);
    // The next line is the recorded prose, BARE: no eligibility label, no model hint.
    expect(lines).toContain('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    expect(text.stdout).not.toContain('Ready when you are:');

    const json = await runCLI(['status', '--json'], { cwd: tempDir });
    const payload = JSON.parse(json.stdout);
    expect(payload.sprint.kind).toBe('explore');
    expect(payload.sprint.position).toBe('concluded');
    expect(payload.sprint.strip[0]).toEqual({ phase: 'explore', glyph: '■' });
    expect('status' in payload.sprint).toBe(false);
    expect(payload.next).toBe('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    expect(payload.waiting).toEqual([]);

    // The bare tier's also: line names an explore by its POSITION, so a concluded one demoted below
    // a newer workstream reads (concluded), never (exploring).
    await makeExplore('idea-newer');
    const newerDir = path.join(tempDir, 'orbit', 'explore', 'idea-newer', '.orbit-runs');
    await fs.mkdir(newerDir, { recursive: true });
    await fs.writeFile(
      path.join(newerDir, 'explore-2026-07-21T10-00-00Z.json'),
      JSON.stringify({ command: 'explore', timestamp: '2026-07-21T10:00:00Z', change: 'idea-newer', kind: 'workflow', final_assessment: 'x.', next_recommended: '/orbit:explore idea-newer — continue capturing thinking' })
    );
    const demoted = await runCLI(['status'], { cwd: tempDir });
    const alsoLine = demoted.stdout.split('\n').find((l) => l.startsWith('also:'));
    expect(alsoLine).toContain('idea-done (concluded)');
    expect(alsoLine).not.toContain('idea-done (exploring)');
    await fs.rm(path.join(tempDir, 'orbit', 'explore', 'idea-newer'), { recursive: true, force: true });

    // --full renders the same row bare, and an exploring explore beside it keeps its label.
    await makeExplore('idea-live');
    const full = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(full.stdout).toContain('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    expect(full.stdout).toContain('Ready when you are: /orbit:explore idea-live — continue capturing thinking');
    const fullLines = full.stdout.split('\n');
    expect(fullLines.some((l) => l.trim().startsWith('Ready when you are: Concluded'))).toBe(false);

    // A broken .openspec.yaml degrades the row but never puts the eligibility label back on
    // the concluded prose (external half of the rc13b blind pair).
    await fs.writeFile(path.join(dir, '.openspec.yaml'), 'schema: [broken\n');
    const degraded = await runCLI(['status', '--full'], { cwd: tempDir });
    expect(degraded.exitCode).toBe(0);
    expect(degraded.stdout).toContain('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    expect(degraded.stdout).not.toContain('Ready when you are: Concluded');
    const degradedJson = JSON.parse((await runCLI(['status', '--full', '--json'], { cwd: tempDir })).stdout);
    const row = degradedJson.workstreams.find((w: { name: string }) => w.name === 'idea-done');
    expect(row.degraded).toBe(true);
    expect(row.position).toBe('concluded');
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
    // ONE-LINE error note: no multi-line code frame leaks into the text row.
    const degradedLine = out.split('\n').find((l) => l.includes('DEGRADED'));
    expect(degradedLine).toBeDefined();
    expect(out).not.toMatch(/\^{2,}/); // YAML code-frame caret lines never render

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
    expect(Object.keys(payload).sort()).toEqual(['last', 'pr', 'program', 'waiting', 'workstreams']);
  });

  it('ladder rung 3: zero live workstreams + zero parseable docs → the no-changes JSON still carries pr (D6: the first-change rung)', async () => {
    // Regression guard for the fresh-adopter path: `pr: per-proposal`, no changes, no
    // docs. The bodies read `pr` from bare `orbit status --json`; an ABSENT key reads
    // as `never` by design, so rung 3 must carry the field like rungs 1 and 2.
    await fs.mkdir(path.join(tempDir, 'orbit'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'orbit', 'config.yaml'), 'pr: per-proposal\n');

    const json = await runCLI(['status', '--json'], { cwd: tempDir });
    expect(json.exitCode).toBe(0);
    const payload = JSON.parse(json.stdout);
    expect(Object.keys(payload).sort()).toEqual(['changes', 'message', 'pr']);
    expect(payload.changes).toEqual([]);
    expect(payload.message).toBe('No active changes.');
    expect(payload.pr).toBe('per-proposal');

    // Text rung stays byte-identical (the message, not the shape, is the D3 promise).
    const text = await runCLI(['status'], { cwd: tempDir });
    expect(text.exitCode).toBe(0);
    expect(text.stdout).toContain('No active changes. Create one with: orbit new change <name>');
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
