import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  computeChangeSize,
  parseSizeDeclaration,
  sizeBreaches,
  composeStatusSize,
  renderSizeLine,
  type SizeCeiling,
} from '../../src/core/change-size.js';
import { resolveSizeCeiling } from '../../src/core/project-config.js';
import { runCLI } from '../helpers/run-cli.js';

/**
 * rc09a-size-record — `orbit-change-size`: the four figures, the multiset byte count, the `## Size`
 * declaration, the opt-in ceiling, and the validate and status surfaces (design D1–D4). One case per
 * row of the requirement tables; the tables are the rule, these are its rows.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RC04C = path.resolve(__dirname, '..', 'fixtures', 'change-size', 'rc04c');

let root: string;
const changeDir = (): string => path.join(root, 'orbit', 'changes', 'c1');

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

/** A path that EXISTS but cannot be read as a file: a directory where the file belongs. */
function unreadable(rel: string): void {
  fs.mkdirSync(path.join(root, rel), { recursive: true });
}

function req(name: string, body: string[] = [`${name} SHALL hold.`]): string {
  return [`### Requirement: ${name}`, '', ...body, '', '#### Scenario: S', '', '- **WHEN** a', '- **THEN** b'].join('\n');
}

function baseline(cap: string, reqs: string[]): void {
  write(`orbit/specs/${cap}/spec.md`, ['# ' + cap, '', '## Purpose', '', 'P.', '', '## Requirements', '', ...reqs, ''].join('\n'));
}

function delta(cap: string, sections: Record<string, string[]>, change = 'c1'): void {
  const body = Object.entries(sections)
    .map(([h, blocks]) => [`## ${h} Requirements`, '', ...blocks].join('\n'))
    .join('\n\n');
  write(`orbit/changes/${change}/specs/${cap}/spec.md`, body + '\n');
}

/** Counted bytes of a block as the rule counts it: UTF-8 bytes + 1 per line. */
const counted = (text: string): number =>
  text.trimEnd().split('\n').reduce((n, l) => n + Buffer.byteLength(l, 'utf8') + 1, 0);

const size = () => computeChangeSize(root, changeDir());

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-change-size-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

// -----------------------------------------------------------------------------
// The figures
// -----------------------------------------------------------------------------

describe('the four figures (Four size figures are computed from the change\'s artifacts)', () => {
  it('capabilities: one per specs/<capability>/spec.md; a directory with no spec.md is not counted', () => {
    delta('cap-a', { ADDED: [req('A')] });
    delta('cap-b', { ADDED: [req('B')] });
    fs.mkdirSync(path.join(changeDir(), 'specs', 'cap-empty'), { recursive: true });
    expect(size().capabilities).toBe(2);
  });

  it('requirements: ADDED + MODIFIED + REMOVED + RENAMED summed over every capability', () => {
    baseline('cap-a', [req('M'), req('Gone'), req('Old')]);
    delta('cap-a', {
      ADDED: [req('A1'), req('A2')],
      MODIFIED: [req('M')],
      REMOVED: ['### Requirement: Gone'],
      RENAMED: ['- FROM: `### Requirement: Old`\n- TO: `### Requirement: New`'],
    });
    delta('cap-b', { ADDED: [req('B')] });
    expect(size().requirements).toBe(6);
  });

  // @scenario behaviour orbit-change-size :: Four size figures are computed from the change's artifacts :: An ADDED block counts whole
  it('an ADDED block of 30 lines whose trimmed text is 1,199 bytes counts 1200', () => {
    const header = '### Requirement: R'; // 18 bytes
    const lines = [header, ...Array.from({ length: 28 }, () => 'x'.repeat(40)), 'y'.repeat(32)];
    const block = lines.join('\n');
    expect(lines).toHaveLength(30);
    expect(Buffer.byteLength(block)).toBe(1199);
    write('orbit/changes/c1/specs/cap/spec.md', `## ADDED Requirements\n\n${block}\n`);
    const s = size();
    expect(s.changed_bytes).toBe(1200);
    expect(s.requirements).toBe(1);
    expect(s.capabilities).toBe(1);
  });

  // @scenario behaviour orbit-change-size :: Four size figures are computed from the change's artifacts :: A MODIFIED block counts only its new lines
  it('a MODIFIED block reproducing a 5,000-byte baseline with one 80-byte line changed counts that line alone', () => {
    const body = Array.from({ length: 64 }, (_, i) => `line ${String(i).padStart(2, '0')} ${'p'.repeat(70)}`);
    const base = req('M', body);
    const changed = 'n'.repeat(80);
    const mod = req('M', body.map((l, i) => (i === 30 ? changed : l)));
    expect(counted(base)).toBeGreaterThan(5000);
    baseline('cap', [base]);
    delta('cap', { MODIFIED: [mod] });
    expect(size().changed_bytes).toBe(81); // the new line's 80 bytes + its newline; the deleted line is not counted
  });

  // @scenario behaviour orbit-change-size :: Four size figures are computed from the change's artifacts :: A repeated line is absorbed once per baseline occurrence
  it('a line carried once in the baseline and twice in the MODIFIED block counts its second occurrence', () => {
    const dup = 'the repeated sentence';
    baseline('cap', [req('M', ['M SHALL hold.', dup])]);
    delta('cap', { MODIFIED: [req('M', ['M SHALL hold.', dup, dup])] });
    expect(size().changed_bytes).toBe(Buffer.byteLength(dup) + 1);
  });

  // @scenario behaviour orbit-change-size :: Four size figures are computed from the change's artifacts :: A renamed and modified requirement counts once
  it('a RENAMED entry with a MODIFIED block under its new name counts once, diffed against the old name', () => {
    baseline('cap', [req('Old', ['Old SHALL hold.', 'kept line'])]);
    delta('cap', {
      RENAMED: ['- FROM: `### Requirement: Old`\n- TO: `### Requirement: New`'],
      MODIFIED: [req('New', ['Old SHALL hold.', 'kept line', 'added line'])],
    });
    const s = size();
    expect(s.requirements).toBe(1);
    // The header line changed (new name) and one line was added; every other line is the old block's.
    expect(s.changed_bytes).toBe(Buffer.byteLength('### Requirement: New') + 1 + Buffer.byteLength('added line') + 1);
  });

  it('changed_bytes table: a MODIFIED block matching no baseline requirement counts whole', () => {
    baseline('cap', [req('Other')]);
    const block = req('Unmatched');
    delta('cap', { MODIFIED: [block] });
    expect(size().changed_bytes).toBe(counted(block));
  });

  it('changed_bytes table: a MODIFIED block whose capability has no baseline file counts whole', () => {
    const block = req('M');
    delta('cap', { MODIFIED: [block] });
    expect(size().changed_bytes).toBe(counted(block));
  });

  it('changed_bytes table: REMOVED and RENAMED entries count zero', () => {
    baseline('cap', [req('Gone'), req('Old')]);
    delta('cap', {
      REMOVED: ['### Requirement: Gone'],
      RENAMED: ['- FROM: `### Requirement: Old`\n- TO: `### Requirement: New`'],
    });
    const s = size();
    expect(s.changed_bytes).toBe(0);
    expect(s.requirements).toBe(2);
  });

  it('changed_bytes table: fenced content inside a block is part of the block', () => {
    const block = req('A', ['A SHALL hold.', '', '```', '## Not a heading', '### Requirement: Not a block', '```']);
    delta('cap', { ADDED: [block] });
    const s = size();
    expect(s.requirements).toBe(1);
    expect(s.changed_bytes).toBe(counted(block));
  });

  it('changed_bytes table: text outside requirement blocks is not counted', () => {
    const block = req('A');
    write(
      'orbit/changes/c1/specs/cap/spec.md',
      `# Preamble prose that is not a block\n\nMore prose.\n\n## ADDED Requirements\n\nSection preamble.\n\n${block}\n`
    );
    expect(size().changed_bytes).toBe(counted(block));
  });

  it('the line rule: a blank line counts 1 byte, and multi-byte characters count their UTF-8 bytes', () => {
    const block = '### Requirement: A\n\né — ✓';
    write('orbit/changes/c1/specs/cap/spec.md', `## ADDED Requirements\n\n${block}\n`);
    expect(size().changed_bytes).toBe(19 + 1 + Buffer.byteLength('é — ✓') + 1);
  });

  // @scenario behaviour orbit-change-size :: Four size figures are computed from the change's artifacts :: Tasks are counted by the tracked gate's counter
  it('tasks: 12 checked + 5 unchecked + one fenced checkbox reads 17', () => {
    const lines = [
      '## 1. Work',
      ...Array.from({ length: 12 }, (_, i) => `- [x] 1.${i + 1} done`),
      ...Array.from({ length: 5 }, (_, i) => `- [ ] 1.${i + 13} open`),
      '```',
      '- [ ] 9.9 an example inside a fence',
      '```',
    ];
    write('orbit/changes/c1/tasks.md', lines.join('\n') + '\n');
    expect(size().tasks).toBe(17);
  });

  // @scenario behaviour orbit-change-size :: Four size figures are computed from the change's artifacts :: A change with no tasks file reads zero tasks
  it('a change with specs but no tasks.md reads zero tasks and computes the rest', () => {
    delta('cap', { ADDED: [req('A')] });
    const s = size();
    expect(s.tasks).toBe(0);
    expect(s.capabilities).toBe(1);
    expect(s.requirements).toBe(1);
    expect(s.changed_bytes).toBeGreaterThan(0);
    expect(s.errors).toEqual([]);
  });

  // @scenario behaviour orbit-change-size :: Four size figures are computed from the change's artifacts :: An unreadable baseline nulls the byte figure
  it('an existing but unreadable baseline nulls changed_bytes, computes the rest, and names the path', () => {
    unreadable('orbit/specs/cap/spec.md');
    delta('cap', { MODIFIED: [req('M')] });
    write('orbit/changes/c1/tasks.md', '## 1. W\n\n- [ ] 1.1 t\n');
    const s = size();
    expect(s.changed_bytes).toBeNull();
    expect(s.capabilities).toBe(1);
    expect(s.requirements).toBe(1);
    expect(s.tasks).toBe(1);
    expect(s.errors).toHaveLength(1);
    expect(s.errors[0].figure).toBe('changed_bytes');
    expect(s.errors[0].path).toBe(path.join(root, 'orbit', 'specs', 'cap', 'spec.md'));
  });

  it('read failure: an unreadable delta spec nulls requirements and changed_bytes, never read as absent', () => {
    unreadable('orbit/changes/c1/specs/cap/spec.md');
    const s = size();
    expect(s.capabilities).toBe(1);
    expect(s.requirements).toBeNull();
    expect(s.changed_bytes).toBeNull();
    expect(s.errors.map((e) => e.figure).sort()).toEqual(['changed_bytes', 'requirements']);
  });

  it('read failure: an unreadable tasks.md nulls tasks', () => {
    unreadable('orbit/changes/c1/tasks.md');
    delta('cap', { ADDED: [req('A')] });
    const s = size();
    expect(s.tasks).toBeNull();
    expect(s.errors).toEqual([expect.objectContaining({ figure: 'tasks', path: path.join(changeDir(), 'tasks.md') })]);
  });

  it('read failure: an unreadable specs directory nulls the three spec figures', () => {
    write('orbit/changes/c1/specs', 'a file where the directory belongs');
    const s = size();
    expect(s.capabilities).toBeNull();
    expect(s.requirements).toBeNull();
    expect(s.changed_bytes).toBeNull();
    expect(s.tasks).toBe(0);
  });

  it('regression: rc04c reads exactly 14,438 bytes against its baselines at bc4c12fc', () => {
    const s = computeChangeSize(RC04C, path.join(RC04C, 'change'));
    expect(s.changed_bytes).toBe(14438);
    expect(s.capabilities).toBe(3);
    expect(s.errors).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// The declaration
// -----------------------------------------------------------------------------

describe("the declaration (A breach is declared in the proposal's Size section)", () => {
  const parse = (body: string[]) => parseSizeDeclaration(['# Proposal', '', ...body].join('\n'));

  // @scenario behaviour orbit-change-size :: A breach is declared in the proposal's Size section :: One item declares one dimension
  it('a `-` item with a known dimension and a reason on its first line declares it', () => {
    const d = parse(['## Size', '- capabilities: the ladder needs its owner and every restating surface']);
    expect(d.declared).toEqual(['capabilities']);
    expect(d.malformed).toEqual([]);
  });

  it('the heading is exactly `## Size`, case-sensitive, trailing whitespace ignored', () => {
    expect(parse(['## Size   ', '- tasks: x']).declared).toEqual(['tasks']);
    expect(parse(['## size', '- tasks: x']).declared).toEqual([]);
    expect(parse(['### Size', '- tasks: x']).declared).toEqual([]);
  });

  // @scenario behaviour orbit-change-size :: A breach is declared in the proposal's Size section :: An unknown dimension is malformed
  it('an unknown dimension is MALFORMED, naming the line, and declares nothing', () => {
    const d = parse(['## Size', '- caps: four']);
    expect(d.declared).toEqual([]);
    expect(d.malformed).toEqual([{ line: 4, text: '- caps: four' }]);
  });

  it('an item with no colon, or nothing after the colon, is MALFORMED', () => {
    const d = parse(['## Size', '- tasks because', '- requirements:   ']);
    expect(d.declared).toEqual([]);
    expect(d.malformed.map((m) => m.line)).toEqual([4, 5]);
  });

  // @scenario behaviour orbit-change-size :: A breach is declared in the proposal's Size section :: A reason only on a continuation line is malformed
  it('a reason only on a continuation line does not rescue the item', () => {
    const d = parse(['## Size', '- tasks:', '  the walk added three tasks']);
    expect(d.declared).toEqual([]);
    expect(d.malformed.map((m) => m.line)).toEqual([4]);
  });

  // @scenario behaviour orbit-change-size :: A breach is declared in the proposal's Size section :: Another list marker is malformed
  it('a `*` or `+` item is MALFORMED and declares nothing', () => {
    const d = parse(['## Size', '* tasks: the walk added three', '+ requirements: two more']);
    expect(d.declared).toEqual([]);
    expect(d.malformed.map((m) => m.line)).toEqual([4, 5]);
  });

  it('a second item for a declared dimension is DUPLICATE; the first declares', () => {
    const d = parse(['## Size', '- tasks: first', '- tasks: second']);
    expect(d.declared).toEqual(['tasks']);
    expect(d.duplicate).toEqual([{ line: 5, text: '- tasks: second' }]);
  });

  it('a continuation line or nested bullet under a well-formed item is part of its reason', () => {
    const d = parse(['## Size', '- tasks: the walk added three', '  and one more', '  - requirements: nested, not an item']);
    expect(d.declared).toEqual(['tasks']);
    expect(d.malformed).toEqual([]);
  });

  it('prose that is not a list item is not read', () => {
    const d = parse(['## Size', 'Three capabilities, at the ceiling.', '- tasks: x']);
    expect(d.declared).toEqual(['tasks']);
    expect(d.malformed).toEqual([]);
  });

  // @scenario behaviour orbit-change-size :: A breach is declared in the proposal's Size section :: A fenced example declares nothing
  it('fenced content under the heading declares nothing', () => {
    const d = parse(['## Size', '```', '- tasks: example', '```']);
    expect(d.declared).toEqual([]);
    expect(d.malformed).toEqual([]);
  });

  it('a `## Size` heading inside a fence opens no section', () => {
    const d = parse(['```', '## Size', '- tasks: example', '```', '- tasks: outside any section']);
    expect(d.declared).toEqual([]);
  });

  it('a second `## Size` heading merges with the first', () => {
    const d = parse(['## Size', '- tasks: a', '', '## Impact', '', '## Size', '- capabilities: b']);
    expect(d.declared).toEqual(['tasks', 'capabilities']);
  });

  it('the section ends at the next level-1 or level-2 heading; a level-3 heading does not end it', () => {
    expect(parse(['## Size', '### Detail', '- tasks: under an H3']).declared).toEqual(['tasks']);
    expect(parse(['## Size', '## Impact', '- tasks: after the section']).declared).toEqual([]);
    expect(parse(['## Size', '# Top', '- tasks: after the section']).declared).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// The comparison
// -----------------------------------------------------------------------------

describe('the comparison (sizeBreaches)', () => {
  const figures = { capabilities: 4, requirements: 8, changed_bytes: 1000, tasks: 30 };

  it('the check OFF compares nothing', () => {
    expect(sizeBreaches(figures, null, { declared: ['tasks'] })).toEqual({ breaches: [], stale: [] });
  });

  it('a breach is STRICTLY GREATER than its maximum; a declared breach is marked declared', () => {
    const r = sizeBreaches(figures, { capabilities: 3, requirements: 8, tasks: 19 }, { declared: ['tasks'] });
    expect(r.breaches).toEqual([
      { dimension: 'capabilities', figure: 4, maximum: 3, declared: false },
      { dimension: 'tasks', figure: 30, maximum: 19, declared: true },
    ]);
  });

  it('a declared dimension not over, or with no maximum, is stale; an uncomputed figure is not compared', () => {
    const r = sizeBreaches({ ...figures, tasks: null }, { requirements: 12, tasks: 19 }, { declared: ['requirements', 'changed_bytes', 'tasks'] });
    expect(r.breaches).toEqual([]);
    expect(r.stale).toEqual([
      { dimension: 'requirements', figure: 8, maximum: 12 },
      { dimension: 'changed_bytes', figure: 1000, maximum: null },
    ]);
  });
});

// -----------------------------------------------------------------------------
// The ceiling config
// -----------------------------------------------------------------------------

describe('the ceiling (The ceiling is opt-in by the size_ceiling config key)', () => {
  let warnings: string[];
  beforeEach(() => {
    warnings = [];
    vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
      warnings.push(a.map(String).join(' '));
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  const config = (yaml: string): SizeCeiling | null => {
    write('orbit/config.yaml', yaml);
    return resolveSizeCeiling(root);
  };

  it('absent key, no config file, or an unparseable file: OFF, silently', () => {
    expect(resolveSizeCeiling(root)).toBeNull();
    expect(config('schema: spec-driven\n')).toBeNull();
    expect(config('schema: [unclosed\n')).toBeNull();
    expect(warnings).toEqual([]);
  });

  // @scenario behaviour orbit-change-size :: The ceiling is opt-in by the size_ceiling config key :: A non-mapping value turns the check off
  it('a non-mapping value turns the check OFF with one warning naming the shape', () => {
    expect(config('size_ceiling: 40\n')).toBeNull();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('a scalar');
    warnings.length = 0;
    expect(config('size_ceiling: [1, 2]\n')).toBeNull();
    expect(warnings[0]).toContain('a list');
    warnings.length = 0;
    expect(config('size_ceiling:\n')).toBeNull();
    expect(warnings[0]).toContain('an empty value');
  });

  it('an unknown key is ignored with one warning naming the key', () => {
    expect(config('size_ceiling:\n  pages: 3\n  tasks: 19\n')).toEqual({ tasks: 19 });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("'pages'");
  });

  // @scenario behaviour orbit-change-size :: The ceiling is opt-in by the size_ceiling config key :: A malformed entry is ignored with a warning
  it('an entry that is not a positive integer is ignored with one warning naming the dimension and the value', () => {
    expect(config('size_ceiling:\n  tasks: 0\n  requirements: 12\n')).toEqual({ requirements: 12 });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("'tasks'");
    expect(warnings[0]).toContain('0');
    warnings.length = 0;
    expect(config("size_ceiling:\n  tasks: 1.5\n  capabilities: '3'\n  requirements: -1\n")).toBeNull();
    expect(warnings).toHaveLength(3);
  });

  it('a mapping with no valid entry is OFF', () => {
    expect(config('size_ceiling: {}\n')).toBeNull();
  });

  // @scenario behaviour orbit-change-size :: The ceiling is opt-in by the size_ceiling config key :: A partial map compares only its dimensions
  it('a partial map compares only its dimensions', () => {
    const ceiling = config('size_ceiling:\n  capabilities: 3\n');
    expect(ceiling).toEqual({ capabilities: 3 });
    const r = sizeBreaches({ capabilities: 4, requirements: 1, changed_bytes: 1, tasks: 30 }, ceiling, { declared: [] });
    expect(r.breaches.map((b) => b.dimension)).toEqual(['capabilities']);
  });

  // @scenario behaviour orbit-change-size :: The ceiling is opt-in by the size_ceiling config key :: A figure at its maximum is not a breach
  it('a figure at its maximum is not a breach', () => {
    const r = sizeBreaches({ capabilities: 1, requirements: 1, changed_bytes: 1, tasks: 19 }, { tasks: 19 }, { declared: [] });
    expect(r.breaches).toEqual([]);
  });

  it('the key is read on its own: a malformed `pr:` beside it prints nothing new', () => {
    expect(config('schema: spec-driven\npr: sometimes\nrules: 5\nsize_ceiling:\n  tasks: 19\n')).toEqual({ tasks: 19 });
    expect(warnings).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// Validate (CLI)
// -----------------------------------------------------------------------------

describe('validate (Validate reports each breach as declared or undeclared)', () => {
  /** A valid change touching `caps` capabilities, with `tasks` tasks and an optional proposal body. */
  function project(opts: { config?: string; caps?: number; tasks?: number; reqs?: number; proposal?: string[] }): void {
    write('orbit/config.yaml', opts.config ?? 'schema: spec-driven\n');
    const caps = opts.caps ?? 1;
    const reqs = opts.reqs ?? 1;
    for (let c = 0; c < caps; c++) {
      delta(`cap-${c}`, { ADDED: Array.from({ length: c === 0 ? reqs : 1 }, (_, i) => req(`R${c}-${i}`)) });
    }
    const n = opts.tasks ?? 1;
    write('orbit/changes/c1/tasks.md', ['## 1. W', '', ...Array.from({ length: n }, (_, i) => `- [ ] 1.${i + 1} t`)].join('\n') + '\n');
    write('orbit/changes/c1/proposal.md', ['# P', '', ...(opts.proposal ?? [])].join('\n') + '\n');
  }
  const validate = (strict = false) => runCLI(['validate', 'c1', ...(strict ? ['--strict'] : [])], { cwd: root });

  // @scenario behaviour orbit-change-size :: The ceiling is opt-in by the size_ceiling config key :: An absent key leaves validate unchanged
  it('with no size_ceiling key, six capabilities report nothing about size and the output is byte-identical', async () => {
    project({ caps: 6 });
    const r = await validate(true);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toBe("Change 'c1' is valid\n");
    expect(r.stdout + r.stderr).not.toContain('size');
  });

  // @scenario behaviour orbit-change-size :: Validate reports each breach as declared or undeclared :: An undeclared breach fails strict validation
  it('an undeclared breach passes non-strict with a WARNING beneath `is valid`, and fails --strict', async () => {
    project({ config: 'schema: spec-driven\nsize_ceiling:\n  capabilities: 3\n', caps: 4 });
    const loose = await validate();
    expect(loose.exitCode).toBe(0);
    expect(loose.stdout).toContain("Change 'c1' is valid");
    expect(loose.stdout).toMatch(/\[WARNING\] size: capabilities 4 > 3: undeclared/);
    const strict = await validate(true);
    expect(strict.exitCode).toBe(1);
    expect(strict.stderr).toMatch(/\[WARNING\] size: capabilities 4 > 3: undeclared/);
  });

  // @scenario behaviour orbit-change-size :: Validate reports each breach as declared or undeclared :: A declared breach passes strict validation
  it('a declared breach passes --strict and prints an INFO naming the dimension, figure, maximum and "declared"', async () => {
    project({
      config: 'schema: spec-driven\nsize_ceiling:\n  capabilities: 3\n',
      caps: 4,
      proposal: ['## Size', '- capabilities: four surfaces restate the rule'],
    });
    const r = await validate(true);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('[INFO] size: capabilities 4 > 3: declared');
  });

  // @scenario behaviour orbit-change-size :: Validate reports each breach as declared or undeclared :: A change that grows past a declaration fails again
  it('a change declared over on capabilities that gains a twentieth task fails --strict on tasks', async () => {
    project({
      config: 'schema: spec-driven\nsize_ceiling:\n  capabilities: 3\n  tasks: 19\n',
      caps: 4,
      tasks: 20,
      proposal: ['## Size', '- capabilities: four surfaces restate the rule'],
    });
    const r = await validate(true);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('tasks 20 > 19: undeclared');
    expect(r.stderr).toContain('capabilities 4 > 3: declared');
  });

  // @scenario behaviour orbit-change-size :: Validate reports each breach as declared or undeclared :: Declaring an unconfigured dimension is stale
  it('declaring a dimension with no configured maximum is a stale INFO, and --strict passes', async () => {
    project({ config: 'schema: spec-driven\nsize_ceiling:\n  capabilities: 3\n', proposal: ['## Size', '- tasks: in case'] });
    const r = await validate(true);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('[INFO] size: tasks is declared but has no configured maximum: the declaration is stale');
  });

  // @scenario behaviour orbit-change-size :: Validate reports each breach as declared or undeclared :: A stale declaration is INFO
  it('declaring a dimension under its maximum is a stale INFO, and --strict passes', async () => {
    project({
      config: 'schema: spec-driven\nsize_ceiling:\n  requirements: 12\n',
      reqs: 8,
      proposal: ['## Size', '- requirements: expected more'],
    });
    const r = await validate(true);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('[INFO] size: requirements 8 <= 12 is declared: the declaration is stale');
  });

  it('a MALFORMED or DUPLICATE `## Size` line is a WARNING naming the line, and fails --strict', async () => {
    project({
      config: 'schema: spec-driven\nsize_ceiling:\n  tasks: 19\n',
      proposal: ['## Size', '- caps: four', '- tasks: a', '- tasks: b'],
    });
    const loose = await validate();
    expect(loose.exitCode).toBe(0);
    expect(loose.stdout).toContain("malformed '## Size' line 4");
    expect(loose.stdout).toContain("duplicate '## Size' line 6");
    expect((await validate(true)).exitCode).toBe(1);
  });

  it('a figure that could not be computed is a WARNING naming the file, not compared, and fails --strict', async () => {
    project({ config: 'schema: spec-driven\nsize_ceiling:\n  tasks: 1\n' });
    fs.rmSync(path.join(changeDir(), 'tasks.md'));
    unreadable('orbit/changes/c1/tasks.md');
    const loose = await validate();
    expect(loose.stdout).toMatch(/\[WARNING\] size: tasks could not be computed: .*tasks\.md exists but cannot be read/);
    expect(loose.stdout).not.toContain('tasks ? >');
    expect((await validate(true)).exitCode).toBe(1);
  });

  it('an unreadable proposal.md is a WARNING; nothing is declared, so every breach is undeclared', async () => {
    project({ config: 'schema: spec-driven\nsize_ceiling:\n  capabilities: 1\n', caps: 2 });
    fs.rmSync(path.join(changeDir(), 'proposal.md'));
    unreadable('orbit/changes/c1/proposal.md');
    const r = await validate();
    expect(r.stdout).toMatch(/proposal\.md exists but cannot be read .*every breach is undeclared/);
    expect(r.stdout).toContain('capabilities 2 > 1: undeclared');
  });

  it('a figure at or under its maximum, not declared, reports nothing', async () => {
    project({ config: 'schema: spec-driven\nsize_ceiling:\n  capabilities: 3\n  tasks: 19\n', caps: 3, tasks: 19 });
    const r = await validate(true);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toBe("Change 'c1' is valid\n");
  });
});

// -----------------------------------------------------------------------------
// Status (CLI)
// -----------------------------------------------------------------------------

describe('status (Status carries the size figures)', () => {
  function project(config: string, tasks = 3): void {
    write('orbit/config.yaml', config);
    write('orbit/changes/c1/.openspec.yaml', 'schema: spec-driven\ncreated: 2026-10-11\n');
    write('orbit/changes/c1/proposal.md', '# P\n');
    delta('cap', { ADDED: [req('A')] });
    write('orbit/changes/c1/tasks.md', ['## 1. W', '', ...Array.from({ length: tasks }, (_, i) => `- [ ] 1.${i + 1} t`)].join('\n') + '\n');
  }
  const json = async () => {
    const r = await runCLI(['status', '--change', 'c1', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    return JSON.parse(r.stdout);
  };

  // @scenario behaviour orbit-change-size :: Status carries the size figures :: JSON carries the figures with the check off
  it('with the key absent, --json carries the four figures, ceiling null, breaches and errors empty; no human line', async () => {
    project('schema: spec-driven\n');
    const j = await json();
    expect(Object.keys(j.size).sort()).toEqual(['breaches', 'capabilities', 'ceiling', 'changed_bytes', 'errors', 'requirements', 'tasks']);
    expect(j.size).toMatchObject({ capabilities: 1, requirements: 1, tasks: 3, ceiling: null, breaches: [], errors: [] });
    expect(typeof j.size.changed_bytes).toBe('number');
    const text = await runCLI(['status', '--change', 'c1'], { cwd: root });
    expect(text.stdout).not.toContain('Size:');
  });

  // @scenario behaviour orbit-change-size :: Status carries the size figures :: The human line names a breach
  it('with the check ON, the human `Size:` line states the four figures and each undeclared breach', async () => {
    project('schema: spec-driven\nsize_ceiling:\n  tasks: 19\n', 22);
    const r = await runCLI(['status', '--change', 'c1'], { cwd: root });
    const line = r.stdout.split('\n').find((l) => l.startsWith('Size: '));
    expect(line).toMatch(/^Size: 1 capabilities · 1 requirements · \d+ bytes changed · 22 tasks — tasks 22 > 19 undeclared$/);
  });

  it('with the check ON and no breach, the line ends `none over`, and no ratio is printed', async () => {
    project('schema: spec-driven\nsize_ceiling:\n  tasks: 19\n');
    const r = await runCLI(['status', '--change', 'c1'], { cwd: root });
    const line = r.stdout.split('\n').find((l) => l.startsWith('Size: '))!;
    expect(line).toMatch(/— none over$/);
    expect(line).not.toMatch(/\d+\/\d+|%/);
  });

  // @scenario behaviour orbit-change-size :: Status carries the size figures :: Size never moves a gate
  it('one change held fixed: gate rows, position and next_command are byte-identical across ceilings above and below', async () => {
    project('schema: spec-driven\n');
    delta('cap-2', { ADDED: [req('B')] }); // two capabilities and two requirements, so a maximum of 1 is below every figure
    write('orbit/config.yaml', 'schema: spec-driven\nsize_ceiling:\n  capabilities: 100\n  requirements: 100\n  changed_bytes: 1000000\n  tasks: 100\n');
    const above = await json();
    write('orbit/config.yaml', 'schema: spec-driven\nsize_ceiling:\n  capabilities: 1\n  requirements: 1\n  changed_bytes: 1\n  tasks: 1\n');
    const below = await json();
    expect(above.size.breaches).toEqual([]);
    expect(below.size.breaches.map((b: { dimension: string }) => b.dimension)).toEqual(['capabilities', 'requirements', 'changed_bytes', 'tasks']);
    expect(JSON.stringify(below.gates)).toBe(JSON.stringify(above.gates));
    expect(below.position).toBe(above.position);
    expect(below.next_command).toBe(above.next_command);
    // Everything but `size` itself is byte-identical.
    const strip = ({ size: _s, ...rest }: Record<string, unknown>) => rest;
    expect(JSON.stringify(strip(below))).toBe(JSON.stringify(strip(above)));
  });

  // @scenario behaviour orbit-change-size :: Status carries the size figures :: A read failure does not fail status
  it('an unreadable tasks.md: status exits 0 with every gate row, size.tasks null, size.errors naming tasks.md', async () => {
    project('schema: spec-driven\nsize_ceiling:\n  tasks: 19\n');
    const before = await json();
    fs.rmSync(path.join(changeDir(), 'tasks.md'));
    fs.mkdirSync(path.join(changeDir(), 'tasks.md'));
    const r = await runCLI(['status', '--change', 'c1', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.gates.map((g: { id: string }) => g.id)).toEqual(before.gates.map((g: { id: string }) => g.id));
    expect(j.size.tasks).toBeNull();
    expect(j.size.errors).toHaveLength(1);
    expect(j.size.errors[0].figure).toBe('tasks');
    expect(j.size.errors[0].path).toBe(path.join(fs.realpathSync(changeDir()), 'tasks.md'));
    const text = await runCLI(['status', '--change', 'c1'], { cwd: root });
    expect(text.exitCode).toBe(0);
    expect(text.stdout).toMatch(/^Size: .* · \? tasks — none over$/m);
  });

  it('the field rides the plain change status only: --boot --json carries no `size`', async () => {
    project('schema: spec-driven\nsize_ceiling:\n  tasks: 19\n');
    const r = await runCLI(['status', '--change', 'c1', '--boot', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout)).not.toHaveProperty('size');
  });

  it('composeStatusSize and renderSizeLine agree with the CLI, and an uncomputed figure renders `?`', () => {
    project('schema: spec-driven\n');
    const s = composeStatusSize(root, changeDir(), { tasks: 1 });
    expect(renderSizeLine(s)).toMatch(/^Size: 1 capabilities · 1 requirements · \d+ bytes changed · 3 tasks — tasks 3 > 1 undeclared$/);
    expect(renderSizeLine({ ...s, changed_bytes: null, breaches: [] })).toContain('? bytes changed');
  });
});
