import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCLI } from '../helpers/run-cli.js';
import { archiveNextRecommended, composeAndWriteEmit } from '../../src/core/emit-composition.js';
import { UPDATE_GETTING_STARTED } from '../../src/core/update.js';
import { getWelcomeText } from '../../src/ui/welcome-screen.js';
import { getOnboardSkillTemplate } from '../../src/core/templates/skill-templates.js';

/**
 * orbit-architect's `Start surfaces name the architect workflow first` (architect-first, D-af-4, G1's
 * engine half). Every STRICT row of the requirement's table is read here and must name
 * `/orbit:architect` and none of the other starts; the PROSE row (the onboard body) must name
 * architect before any other start command.
 */

const OTHER_STARTS = ['/orbit:explore', '/orbit:new', '/orbit:propose', 'orbit new change'];

function expectStrict(surface: string, label: string): void {
  expect(surface, label).toContain('/orbit:architect');
  for (const other of OTHER_STARTS) expect(surface, `${label} names ${other}`).not.toContain(other);
}

// chalk wraps the welcome text in ANSI codes when colour is forced; the test reads the words.
const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-start-surfaces-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('start surfaces — strict rows', () => {
  // @scenario behaviour orbit-architect :: Start surfaces name the architect workflow first :: A strict surface names only architect
  it('the archive emit\'s next, for a cited and an uncited change', () => {
    fs.mkdirSync(path.join(root, 'orbit', 'architecture'), { recursive: true });
    fs.writeFileSync(path.join(root, 'orbit', 'architecture', 'prog.md'), '# prog\n');
    const cited = path.join(root, 'orbit', 'changes', 'archive', '2026-10-14-a');
    const uncited = path.join(root, 'orbit', 'changes', 'archive', '2026-10-14-b');
    fs.mkdirSync(cited, { recursive: true });
    fs.mkdirSync(uncited, { recursive: true });
    fs.writeFileSync(path.join(cited, '.openspec.yaml'), 'schema: spec-driven\narchitecture:\n  doc: prog\n  stage: s1\n');
    fs.writeFileSync(path.join(uncited, '.openspec.yaml'), 'schema: spec-driven\n');

    const citedNext = archiveNextRecommended(root, cited);
    const uncitedNext = archiveNextRecommended(root, uncited);
    expect(citedNext.startsWith('/orbit:architect prog ')).toBe(true);
    expect(uncitedNext.startsWith('/orbit:architect <name> ')).toBe(true);
    expectStrict(citedNext, 'cited archive next');
    expectStrict(uncitedNext, 'uncited archive next');
  });

  it('`orbit init`\'s getting-started output', async () => {
    const result = await runCLI(['init', '--tools', 'none'], {
      cwd: root,
      env: { XDG_CONFIG_HOME: path.join(root, '.config'), XDG_DATA_HOME: path.join(root, '.data') },
    });
    expect(result.exitCode).toBe(0);
    const lines = result.stdout.split('\n');
    const i = lines.findIndex((l) => l.includes('Getting started:'));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(lines[i + 1].trim()).toBe('Plan your first piece of work: /orbit:architect <name>');
    expectStrict(lines[i + 1], 'init getting-started');
    // The block is one line: the next line is blank, so no second start follows it.
    expect(lines[i + 2].trim()).toBe('');
  });

  it('the first line of `orbit update`\'s and the welcome screen\'s lists', () => {
    expectStrict(UPDATE_GETTING_STARTED[0], 'update getting-started first line');

    const welcome = getWelcomeText().map(stripAnsi);
    const i = welcome.findIndex((l) => l.includes('Quick start'));
    expect(i).toBeGreaterThanOrEqual(0);
    expectStrict(welcome[i + 1], 'welcome quick-start first line');
    // The later lines list the canonical flow's order: architect, explore, propose.
    expect(welcome.slice(i + 1, i + 4).map((l) => l.trim().split(/\s+/)[0])).toEqual([
      '/orbit:architect',
      '/orbit:explore',
      '/orbit:propose',
    ]);
  });

  it('idle `orbit status` with no emit, and the no-active-changes message', async () => {
    const text = await runCLI(['status'], { cwd: root });
    expect(text.exitCode).toBe(0);
    const [message, next] = text.stdout.trimEnd().split('\n');
    // The message names no command at all.
    expect(message).toBe('No active changes.');
    expect(message).not.toMatch(/\/orbit:|orbit new/);
    expect(next).toBe('Ready when you are: /orbit:architect <name>');
    expectStrict(next, 'idle status fallback');
  });

  it('the two no-changes errors, raised by `orbit status --change` and `orbit instructions`', async () => {
    fs.mkdirSync(path.join(root, 'orbit', 'changes'), { recursive: true });
    const named = await runCLI(['status', '--change', 'missing'], { cwd: root });
    expect(named.exitCode).not.toBe(0);
    expect(named.stderr).toContain("Change 'missing' not found. No changes exist.");
    expectStrict(named.stderr, 'status --change missing');

    const unnamed = await runCLI(['instructions', 'apply'], { cwd: root });
    expect(unnamed.exitCode).not.toBe(0);
    expect(unnamed.stderr).toContain('No changes found.');
    expectStrict(unnamed.stderr, 'instructions with no change');
  });
});

describe('start surfaces — prose rows', () => {
  // @scenario text orbit-architect :: Start surfaces name the architect workflow first :: A prose surface keeps the one-off path
  it('the onboard body names /orbit:architect before any other start, in its flow and its nudge', () => {
    const body = getOnboardSkillTemplate().instructions;
    const section = (start: string, end: string): string => {
      const from = body.indexOf(start);
      expect(from, start).toBeGreaterThanOrEqual(0);
      const to = body.indexOf(end, from);
      return body.slice(from, to === -1 ? undefined : to);
    };
    const firstStart = (text: string): string | undefined =>
      text.match(/\/orbit:(architect|explore|new|propose)\b/)?.[0];

    const flow = section('## Section 3', '## Section 4');
    expect(firstStart(flow)).toBe('/orbit:architect');
    const diagram = flow.slice(flow.indexOf('```'), flow.indexOf('```', flow.indexOf('```') + 3));
    expect(diagram.trimStart().replace(/^```\s*/, '').trimStart().startsWith('architect')).toBe(true);
    expect(diagram).toMatch(/archive[\s\S]*architect \(ratify the stage\)/);
    expect(flow).toMatch(/never required/);

    const nudge = section('## Section 5', '\u0000');
    expect(firstStart(nudge)).toBe('/orbit:architect');
    expect(nudge).toMatch(/one-off fix/);
  });
});

/**
 * architect-first (task 6.2) — orbit-architect's `Architect is a stance, never a gatekeeper`: no surface
 * keys on whether an architect session happened. A change's citation still selects its archive next and
 * PR target (tested above and in the PR suites); what is tested here is that its ABSENCE costs nothing.
 */
describe('the stance — an architect session is never a gate', () => {
  const writeFile = (rel: string, content: string): void => {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  };
  const DOC = '# Program prog\n\n### Stage s1 — the first stage\n\nCharter text.\n';
  const makeChange = (name: string, cited: boolean): void => {
    const d = `orbit/changes/${name}`;
    writeFile(`${d}/.openspec.yaml`, `schema: spec-driven\ncreated: "2026-07-01"\n${cited ? 'architecture:\n  doc: prog\n  stage: s1\n' : ''}`);
    writeFile(`${d}/proposal.md`, '# Proposal\n');
    writeFile(`${d}/design.md`, '# Design\n');
    writeFile(`${d}/tasks.md`, '## 1. Work\n\n- [ ] 1.1 Do\n');
    writeFile(`${d}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: X\n\nX SHALL Y.\n\n#### Scenario: S\n\n- **WHEN** a\n- **THEN** b\n');
  };
  const json = async (args: string[]): Promise<Record<string, unknown>> => {
    const r = await runCLI(args, { cwd: root });
    expect(r.exitCode, args.join(' ')).toBe(0);
    return JSON.parse(r.stdout);
  };
  const named = (value: unknown, name: string): string => JSON.stringify(value).split(name).join('<name>');

  // @scenario behaviour orbit-architect :: Architect is a stance, never a gatekeeper :: A change that skipped the architect session is not flagged
  it('an uncited change gets the same gates, position, next and validation as its cited twin', async () => {
    writeFile('orbit/architecture/prog.md', DOC);
    makeChange('alpha', false);
    makeChange('bravo', true);

    const alpha = await json(['status', '--change', 'alpha', '--json']);
    const bravo = await json(['status', '--change', 'bravo', '--json']);
    expect(named(alpha, 'alpha')).toBe(named(bravo, 'bravo'));

    const validate = await runCLI(['validate', '--all', '--strict'], { cwd: root });
    expect(validate.exitCode).toBe(0);
    const out = validate.stdout + validate.stderr;
    expect(out).toContain('✓ change/alpha');
    expect(out).toContain('Totals: 2 passed, 0 failed');

    // The arc readout's WAITING band treats both alike: whatever it says of one, it says of the other.
    const full = await json(['status', '--full', '--json']);
    const waiting = (full.waiting as unknown[]).map((w) => JSON.stringify(w));
    expect(waiting.filter((w) => w.includes('alpha')).map((w) => w.split('alpha').join('<name>'))).toEqual(
      waiting.filter((w) => w.includes('bravo')).map((w) => w.split('bravo').join('<name>'))
    );
  });

  // @scenario behaviour orbit-architect :: Architect is a stance, never a gatekeeper :: Explore-born architecture content is first-class
  it('a hand-written doc reads the same with or without an architect session on its trail', async () => {
    writeFile('orbit/architecture/prog.md', DOC);
    const archBefore = await json(['architecture', 'status', '--json']);
    const fullBefore = await json(['status', '--full', '--json']);

    composeAndWriteEmit(
      'architect',
      { doc: 'prog' },
      { final_assessment: 'session', handoff: { boot_sequence: ['a'], next_command: '/orbit:architect prog', model_hint: null, seam: 's' }, model: null },
      { projectRoot: root }
    );
    expect(fs.readdirSync(path.join(root, 'orbit', 'architecture', '.orbit-runs')).some((f) => f.startsWith('architect-'))).toBe(true);

    expect(await json(['architecture', 'status', '--json'])).toEqual(archBefore);
    const fullAfter = await json(['status', '--full', '--json']);
    expect(fullAfter.program).toEqual(fullBefore.program);
    expect(fullAfter.waiting).toEqual(fullBefore.waiting);
  });
});
