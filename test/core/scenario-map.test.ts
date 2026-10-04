import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  computeScenarioMap,
  scanDeclarations,
  renderScenarioMap,
  type ScenarioMap,
} from '../../src/core/scenario-map.js';
import type { ScenarioMapConfig } from '../../src/core/project-config.js';
import { runCLI } from '../helpers/run-cli.js';

/**
 * rc06a-scenario-map — the map module (`orbit-scenario-map`).
 *
 * Design D3: this repo opts in, so a LITERAL tag line in a fixture string would be read by the
 * repo's own scan. Every fixture tag is ASSEMBLED at runtime from two halves and written into a
 * temp project; no line of this file is tag-shaped except the real declarations above tests.
 */
const AT = '// @' + 'scenario';
const tag = (kind: string, key: string): string => `${AT} ${kind} ${key}`;

const ON: ScenarioMapConfig = { check: 'on', tests: ['test/**/*.test.ts'] };

let root: string;
const warnings: string[] = [];
const warn = (m: string): void => {
  warnings.push(m);
};

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function req(name: string, scenarios: string[], extra = ''): string {
  return [
    `### Requirement: ${name}`,
    '',
    `${name} SHALL hold.`,
    '',
    extra,
    ...scenarios.flatMap((s) => [`#### Scenario: ${s}`, '', '- **WHEN** a', '- **THEN** b', '']),
  ].join('\n');
}

function baseline(cap: string, reqs: string[]): void {
  write(`orbit/specs/${cap}/spec.md`, ['# ' + cap, '', '## Purpose', '', 'P.', '', '## Requirements', '', ...reqs].join('\n'));
}

function delta(cap: string, sections: Record<string, string[]>): void {
  const body = Object.entries(sections)
    .map(([h, blocks]) => [`## ${h} Requirements`, '', ...blocks].join('\n'))
    .join('\n\n');
  write(`orbit/changes/c1/specs/${cap}/spec.md`, body + '\n');
}

function map(config: ScenarioMapConfig = ON): ScenarioMap {
  return computeScenarioMap(root, path.join(root, 'orbit', 'changes', 'c1'), { config, warn });
}

function testFile(lines: string[], rel = 'test/a.test.ts'): void {
  write(rel, lines.join('\n') + '\n');
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-scenario-map-'));
  warnings.length = 0;
  write('orbit/changes/c1/.openspec.yaml', 'schema: spec-driven\n');
  // One ADDED requirement with three scenarios — the key space most cases tag against.
  delta('orbit-x', { ADDED: [req('Req A', ['Scen 1', 'Scen 2', 'Scen 3'])] });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const K1 = 'orbit-x :: Req A :: Scen 1';
const K2 = 'orbit-x :: Req A :: Scen 2';

function decl(m: ScenarioMap, scenario: string) {
  const s = m.scenarios.find((e) => e.scenario === scenario);
  if (!s) throw new Error(`no delta scenario ${scenario}`);
  return s;
}

describe('the scenario tag and its next-line table', () => {
  // @scenario behaviour orbit-scenario-map :: A test declares the scenario it exercises with a scenario tag :: A behaviour tag attaches to the next test
  it('a behaviour tag attaches to the next test across a blank line', () => {
    testFile([tag('behaviour', K1), '', "it('does the thing', () => {});"]);
    const m = map();
    expect(decl(m, 'Scen 1').declarations.behaviour).toEqual([{ file: 'test/a.test.ts', line: 3 }]);
    expect(m.malformed).toEqual([]);
  });

  it.each([
    ["it('x', () => {});"],
    ["test('x', () => {});"],
    ["it.each([1])('x %s', () => {});"],
    ["test.each`a`('x', () => {});"],
    ["it.skipIf(process.platform === 'win32')('x', () => {});"],
    ["test.skipIf(true)('x', () => {});"],
    ["it.only('x', () => {});"],
    ["test.only('x', () => {});"],
  ])('attaches to %s', (call) => {
    testFile([tag('text', K1), call]);
    const m = map();
    expect(decl(m, 'Scen 1').declarations.text).toEqual([{ file: 'test/a.test.ts', line: 2 }]);
    expect(m.malformed).toEqual([]);
  });

  it('attaches to an indented it( inside a describe', () => {
    testFile(["describe('g', () => {", '  ' + tag('behaviour', K1), "  it('x', () => {});", '});']);
    expect(decl(map(), 'Scen 1').declarations.behaviour).toEqual([{ file: 'test/a.test.ts', line: 3 }]);
  });

  // @scenario behaviour orbit-scenario-map :: A test declares the scenario it exercises with a scenario tag :: A tag above a skipped test is refused
  it.each([
    ["it.skip('x', () => {});", 'it.skip('],
    ["test.skip('x', () => {});", 'test.skip('],
    ["it.todo('x');", 'it.todo('],
    ["test.todo('x');", 'test.todo('],
  ])('refuses a tag above %s', (call, form) => {
    testFile([tag('behaviour', K1), call]);
    const m = map();
    expect(decl(m, 'Scen 1').uncovered).toBe(true);
    expect(m.malformed).toEqual([
      { source: 'tag', file: 'test/a.test.ts', line: 1, reason: expect.stringContaining(form) },
    ]);
  });

  // @scenario behaviour orbit-scenario-map :: A test declares the scenario it exercises with a scenario tag :: A tag above a describe block is refused
  it('refuses a tag above describe(', () => {
    testFile([tag('behaviour', K1), "describe('g', () => {", "  it('x', () => {});", '});']);
    const m = map();
    expect(decl(m, 'Scen 1').uncovered).toBe(true);
    expect(m.malformed).toEqual([
      { source: 'tag', file: 'test/a.test.ts', line: 1, reason: expect.stringContaining('describe') },
    ]);
  });

  it('refuses a tag above any other line', () => {
    testFile([tag('behaviour', K1), 'const x = 1;', "it('x', () => {});"]);
    const m = map();
    expect(decl(m, 'Scen 1').uncovered).toBe(true);
    expect(m.malformed).toHaveLength(1);
    expect(m.malformed[0]).toMatchObject({ source: 'tag', line: 1 });
  });

  // @scenario behaviour orbit-scenario-map :: A test declares the scenario it exercises with a scenario tag :: A tag at end of file is refused
  it('refuses a tag at end of file', () => {
    testFile(["it('x', () => {});", '', tag('behaviour', K1), '']);
    const m = map();
    expect(m.malformed).toEqual([
      { source: 'tag', file: 'test/a.test.ts', line: 3, reason: expect.stringContaining('end of file') },
    ]);
  });

  // @scenario behaviour orbit-scenario-map :: A test declares the scenario it exercises with a scenario tag :: Stacked tags attach to one test
  it('stacked tags across a non-tag comment attach to one test', () => {
    testFile([tag('behaviour', K1), '// an ordinary comment', tag('text', K2), "test('x', () => {});"]);
    const m = map();
    expect(decl(m, 'Scen 1').declarations.behaviour).toEqual([{ file: 'test/a.test.ts', line: 4 }]);
    expect(decl(m, 'Scen 2').declarations.text).toEqual([{ file: 'test/a.test.ts', line: 4 }]);
  });

  // @scenario behaviour orbit-scenario-map :: A test declares the scenario it exercises with a scenario tag :: A near-miss tag is malformed, never ignored
  it.each([
    ['an unknown kind', `${AT} covers ${K1}`],
    ['a two-part key', `${AT} behaviour orbit-x :: Req A`],
    ['the split rule (a ::b :: c)', `${AT} behaviour a ::b :: c`],
    ['an empty part', `${AT} behaviour orbit-x ::  :: Scen 1`],
    ['no key at all', `${AT} behaviour`],
  ])('a near-miss — %s — is MALFORMED naming its line', (_label, line) => {
    testFile(['// header', line, "it('x', () => {});"]);
    const m = map();
    expect(m.malformed).toEqual([
      { source: 'tag', file: 'test/a.test.ts', line: 2, reason: expect.any(String) },
    ]);
    expect(m.scenarios.every((s) => s.uncovered)).toBe(true);
  });

  it('a malformed tag inside a stack is MALFORMED by name and the stack still attaches', () => {
    testFile([tag('behaviour', K1), `${AT} covers ${K2}`, tag('text', K2), "it('x', () => {});"]);
    const m = map();
    expect(m.malformed).toEqual([{ source: 'tag', file: 'test/a.test.ts', line: 2, reason: expect.any(String) }]);
    expect(decl(m, 'Scen 1').declarations.behaviour).toEqual([{ file: 'test/a.test.ts', line: 4 }]);
    expect(decl(m, 'Scen 2').declarations.text).toEqual([{ file: 'test/a.test.ts', line: 4 }]);
  });

  it('a word that merely starts with the tag name is not a tag candidate', () => {
    testFile([`${AT}s are documented elsewhere`, "it('x', () => {});"]);
    expect(map().malformed).toEqual([]);
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is opt-in by the scenario_map config key :: A configured glob list turns the check on
  it('scans only files matching the configured globs', () => {
    testFile([tag('behaviour', K1), "it('x', () => {});"], 'spec/a.test.ts');
    testFile([tag('behaviour', K2), "it('x', () => {});"], 'test/b.test.ts');
    const m = map({ check: 'on', tests: ['spec/**/*.test.ts'] });
    expect(decl(m, 'Scen 1').uncovered).toBe(false);
    expect(decl(m, 'Scen 2').uncovered).toBe(true);
  });

  it('never reads node_modules', () => {
    testFile([tag('behaviour', K1), "it('x', () => {});"], 'node_modules/pkg/test/a.test.ts');
    const m = computeScenarioMap(root, path.join(root, 'orbit', 'changes', 'c1'), {
      config: { check: 'on', tests: ['**/*.test.ts'] },
      warn,
    });
    expect(decl(m, 'Scen 1').uncovered).toBe(true);
  });
});

describe('the scenario ledger', () => {
  // @scenario behaviour orbit-scenario-map :: The scenario ledger declares what no test can run :: An observed entry declares a scenario
  it('an observed entry declares a scenario citing its record', () => {
    write('orbit/scenario-ledger.yaml', `scenarios:\n  - key: "${K2}"\n    kind: observed\n    record: "orbit/changes/archive/x/apply.json"\n`);
    const m = map();
    expect(decl(m, 'Scen 2').declarations.observed).toEqual([{ record: 'orbit/changes/archive/x/apply.json' }]);
    expect(decl(m, 'Scen 2').uncovered).toBe(false);
  });

  it('an untestable entry declares a scenario carrying its why', () => {
    write('orbit/scenario-ledger.yaml', `scenarios:\n  - key: "${K2}"\n    kind: untestable\n    why: "an AI's judgement"\n`);
    expect(decl(map(), 'Scen 2').declarations.untestable).toEqual([{ why: "an AI's judgement" }]);
  });

  // @scenario behaviour orbit-scenario-map :: The scenario ledger declares what no test can run :: An untestable entry without a why is malformed
  it.each([
    ['untestable without why', `  - key: "${K2}"\n    kind: untestable\n`],
    ['observed without record', `  - key: "${K2}"\n    kind: observed\n    record: ""\n`],
    ['an unknown kind', `  - key: "${K2}"\n    kind: seen\n    record: x\n`],
    ['a two-part key', `  - key: "orbit-x :: Req A"\n    kind: observed\n    record: x\n`],
    ['no key', `  - kind: observed\n    record: x\n`],
  ])('%s is MALFORMED by index and declares nothing', (_label, entry) => {
    write('orbit/scenario-ledger.yaml', `scenarios:\n  - key: "${K1}"\n    kind: untestable\n    why: fine\n${entry}`);
    const m = map();
    expect(m.malformed).toEqual([{ source: 'ledger', index: 1, reason: expect.any(String) }]);
    expect(decl(m, 'Scen 2').uncovered).toBe(true);
    expect(decl(m, 'Scen 1').uncovered).toBe(false);
  });

  // @scenario behaviour orbit-scenario-map :: The scenario ledger declares what no test can run :: An absent ledger declares nothing
  it('an absent ledger declares nothing and reports no ledger error', () => {
    const m = map();
    expect(m.malformed).toEqual([]);
    expect(m.scenarios.every((s) => s.uncovered)).toBe(true);
  });

  it.each([
    ['a list', '- a\n- b\n'],
    ['a mapping without a scenarios list', 'scenarios: 3\n'],
    ['invalid YAML', 'scenarios: [\n'],
  ])('a file that is %s is MALFORMED as a whole', (_label, body) => {
    write('orbit/scenario-ledger.yaml', body);
    const m = map();
    expect(m.malformed).toEqual([{ source: 'ledger-file', reason: expect.any(String) }]);
  });
});

describe('key resolution over the specs with the change deltas applied', () => {
  it('an ADDED requirement owes every scenario in its block', () => {
    const m = map();
    expect(m.scenarios.map((s) => [s.capability, s.requirement, s.scenario, s.operation])).toEqual([
      ['orbit-x', 'Req A', 'Scen 1', 'ADDED'],
      ['orbit-x', 'Req A', 'Scen 2', 'ADDED'],
      ['orbit-x', 'Req A', 'Scen 3', 'ADDED'],
    ]);
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is engine-computed at one read surface :: A MODIFIED requirement's unchanged scenarios are in the delta
  it('a MODIFIED block with two kept and one new scenario lists all three as MODIFIED', () => {
    baseline('orbit-y', [req('Req M', ['Kept 1', 'Kept 2']), req('Req Other', ['Other'])]);
    delta('orbit-y', { MODIFIED: [req('Req M', ['Kept 1', 'Kept 2', 'New 3'])] });
    const m = map();
    const ys = m.scenarios.filter((s) => s.capability === 'orbit-y');
    expect(ys.map((s) => [s.scenario, s.operation])).toEqual([
      ['Kept 1', 'MODIFIED'],
      ['Kept 2', 'MODIFIED'],
      ['New 3', 'MODIFIED'],
    ]);
    // The untouched requirement stays outside the delta and is counted, never listed.
    expect(m.counts.baseline_undeclared).toBe(1);
  });

  it('a RENAMED requirement owes its baseline scenarios under the new key; old-key tags are ORPHAN', () => {
    baseline('orbit-y', [req('Req A', ['S1', 'S2'])]);
    write(
      'orbit/changes/c1/specs/orbit-y/spec.md',
      '## RENAMED Requirements\n\n- FROM: `### Requirement: Req A`\n- TO: `### Requirement: Req B`\n'
    );
    testFile([tag('behaviour', 'orbit-y :: Req A :: S1'), "it('x', () => {});"]);
    const m = map();
    const ys = m.scenarios.filter((s) => s.capability === 'orbit-y');
    expect(ys.map((s) => [s.requirement, s.scenario, s.operation])).toEqual([
      ['Req B', 'S1', 'RENAMED'],
      ['Req B', 'S2', 'RENAMED'],
    ]);
    expect(ys.every((s) => s.uncovered)).toBe(true);
    expect(m.orphans).toEqual([{ source: 'tag', file: 'test/a.test.ts', line: 1, key: 'orbit-y :: Req A :: S1' }]);
  });

  it('a renamed-then-modified requirement owes exactly its MODIFIED block under the new key', () => {
    baseline('orbit-y', [req('Req A', ['Old 1', 'Old 2'])]);
    write(
      'orbit/changes/c1/specs/orbit-y/spec.md',
      [
        '## RENAMED Requirements',
        '',
        '- FROM: `### Requirement: Req A`',
        '- TO: `### Requirement: Req B`',
        '',
        '## MODIFIED Requirements',
        '',
        req('Req B', ['N1', 'N2', 'N3']),
      ].join('\n')
    );
    const ys = map().scenarios.filter((s) => s.capability === 'orbit-y');
    expect(ys.map((s) => [s.requirement, s.scenario, s.operation])).toEqual([
      ['Req B', 'N1', 'MODIFIED'],
      ['Req B', 'N2', 'MODIFIED'],
      ['Req B', 'N3', 'MODIFIED'],
    ]);
  });

  it('a REMOVED requirement owes nothing, and its tags are ORPHAN', () => {
    baseline('orbit-y', [req('Req Gone', ['G1']), req('Req Stays', ['K1'])]);
    write('orbit/changes/c1/specs/orbit-y/spec.md', '## REMOVED Requirements\n\n### Requirement: Req Gone\n');
    testFile([tag('behaviour', 'orbit-y :: Req Gone :: G1'), "it('x', () => {});"]);
    const m = map();
    expect(m.scenarios.filter((s) => s.capability === 'orbit-y')).toEqual([]);
    expect(m.orphans).toHaveLength(1);
    expect(m.counts.baseline_undeclared).toBe(1);
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is engine-computed at one read surface :: A fenced scenario heading is not a scenario
  it('a scenario heading inside a fence is not a scenario', () => {
    delta('orbit-x', {
      ADDED: [req('Req A', ['Scen 1'], ['```markdown', '#### Scenario: Example', '```', ''].join('\n'))],
    });
    expect(map().scenarios.map((s) => s.scenario)).toEqual(['Scen 1']);
  });

  it('a baseline scenario outside the delta is counted among the baseline-undeclared, and its tag is counted, not listed', () => {
    baseline('orbit-z', [req('Req Z', ['Z1', 'Z2'])]);
    testFile([tag('behaviour', 'orbit-z :: Req Z :: Z1'), "it('x', () => {});"]);
    const m = map();
    expect(m.scenarios.some((s) => s.capability === 'orbit-z')).toBe(false);
    expect(m.orphans).toEqual([]);
    expect(m.counts.baseline_undeclared).toBe(1);
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is opt-in by the scenario_map config key :: Globs matching nothing warn once
  it('configured globs matching no file raise one warning naming them, once per scan', () => {
    const scan = scanDeclarations(root, ['nothing/**/*.test.ts'], { warnOnZeroMatch: true, warn });
    const changeDir = path.join(root, 'orbit', 'changes', 'c1');
    const m1 = computeScenarioMap(root, changeDir, { config: { check: 'on', tests: ['nothing/**/*.test.ts'] }, scan, warn });
    computeScenarioMap(root, changeDir, { config: { check: 'on', tests: ['nothing/**/*.test.ts'] }, scan, warn });
    expect(m1.check).toBe('on');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('nothing/**/*.test.ts');
  });

  it('the OFF default scans test/**/*.test.ts and never warns on zero matches', () => {
    const m = map({ check: 'off', tests: [] });
    expect(m.check).toBe('off');
    expect(m.tests).toEqual(['test/**/*.test.ts']);
    expect(warnings).toEqual([]);
  });
});

describe('cover kinds and the render', () => {
  // @scenario behaviour orbit-scenario-map :: Cover kinds are reported separately and never summed :: A scenario with two kinds shows both
  it('a scenario with a text tag and an untestable entry shows both and is not UNCOVERED', () => {
    testFile([tag('text', K1), "it('x', () => {});"]);
    write('orbit/scenario-ledger.yaml', `scenarios:\n  - key: "${K1}"\n    kind: untestable\n    why: judgement\n`);
    const s = decl(map(), 'Scen 1');
    expect(s.declarations.text).toHaveLength(1);
    expect(s.declarations.untestable).toHaveLength(1);
    expect(s.uncovered).toBe(false);
  });

  // @scenario behaviour orbit-scenario-map :: Cover kinds are reported separately and never summed :: A scenario with no declaration is uncovered
  it('a scenario with no declaration is UNCOVERED', () => {
    const m = map();
    expect(decl(m, 'Scen 3')).toMatchObject({
      uncovered: true,
      declarations: { behaviour: [], text: [], observed: [], untestable: [] },
    });
    expect(m.counts.uncovered).toBe(3);
  });

  // @scenario behaviour orbit-scenario-map :: Cover kinds are reported separately and never summed :: A tag naming no scenario is an orphan
  it('a well-formed tag naming no scenario is ORPHAN with its file and line, and no scenario changes state', () => {
    testFile(['', tag('behaviour', 'orbit-x :: Req A :: Scen 9'), "it('x', () => {});"]);
    const m = map();
    expect(m.orphans).toEqual([{ source: 'tag', file: 'test/a.test.ts', line: 2, key: 'orbit-x :: Req A :: Scen 9' }]);
    expect(m.scenarios.every((s) => s.uncovered)).toBe(true);
    expect(m.counts.orphans).toBe(1);
  });

  it('a ledger entry naming no scenario is ORPHAN by index', () => {
    write('orbit/scenario-ledger.yaml', `scenarios:\n  - key: "orbit-x :: Req A :: Nope"\n    kind: untestable\n    why: w\n`);
    expect(map().orphans).toEqual([{ source: 'ledger', index: 0, key: 'orbit-x :: Req A :: Nope' }]);
  });

  it('an unkeyable delta title is listed in malformed with source spec, absent from scenarios and uncovered', () => {
    delta('orbit-x', { ADDED: [req('Req A', ['Scen 1', 'A :: B'])] });
    const m = map();
    expect(m.scenarios.map((s) => s.scenario)).toEqual(['Scen 1']);
    expect(m.malformed).toEqual([
      { source: 'spec', capability: 'orbit-x', requirement: 'Req A', scenario: 'A :: B', reason: 'unkeyable' },
    ]);
    expect(m.counts.uncovered).toBe(1);
    expect(m.counts.delta_scenarios).toBe(1);
  });

  it('a scenario title repeated within its requirement is unkeyable at every occurrence; one tag satisfies neither', () => {
    delta('orbit-x', { ADDED: [req('Req A', ['Scen 1', 'Same', 'Same'])] });
    testFile([tag('behaviour', 'orbit-x :: Req A :: Same'), "it('only first', () => {});"]);
    const m = map();
    expect(m.scenarios.map((s) => s.scenario)).toEqual(['Scen 1']);
    const dup = { source: 'spec', capability: 'orbit-x', requirement: 'Req A', scenario: 'Same', reason: 'unkeyable' };
    expect(m.malformed).toEqual([dup, dup]);
    expect(m.counts).toMatchObject({ delta_scenarios: 1, behaviour: 0, uncovered: 1, malformed: 2 });
  });

  it('a repeated title OUTSIDE the delta is counted per occurrence, never refused', () => {
    baseline('orbit-z', [req('Req Z', ['Z', 'Z'])]);
    const m = map();
    expect(m.malformed).toEqual([]);
    expect(m.counts.baseline_undeclared).toBe(2);
  });

  it('per-kind counts count delta scenarios carrying at least one declaration of the kind', () => {
    testFile([tag('behaviour', K1), "it('x', () => {});", tag('behaviour', K1), "it('y', () => {});", tag('text', K2), "it('z', () => {});"]);
    expect(map().counts).toEqual({
      delta_scenarios: 3,
      behaviour: 1,
      text: 1,
      observed: 0,
      untestable: 0,
      uncovered: 1,
      orphans: 0,
      malformed: 0,
      baseline_undeclared: 0,
    });
  });

  // @scenario behaviour orbit-scenario-map :: Cover kinds are reported separately and never summed :: No covered ratio is printed
  it('the human render prints counts and no percentage or fraction', () => {
    testFile([tag('behaviour', K1), "it('x', () => {});"]);
    const out = renderScenarioMap(map());
    expect(out).toContain('uncovered 2');
    expect(out).toContain('behaviour 1');
    expect(out).not.toMatch(/%/);
    expect(out).not.toMatch(/\b\d+\s*\/\s*\d+\b/);
    expect(out).not.toMatch(/\bof\s+\d+/);
  });
});

describe('the read surface: orbit status --change <name> --scenarios', () => {
  function project(config: string | null): void {
    write('orbit/changes/c1/proposal.md', '# P\n');
    write('orbit/changes/c1/tasks.md', '## 1. W\n\n- [ ] 1.1 t\n');
    if (config !== null) write('orbit/config.yaml', config);
  }

  function snapshot(): Record<string, string> {
    const out: Record<string, string> = {};
    const walk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else out[path.relative(root, p)] = fs.readFileSync(p, 'utf-8');
      }
    };
    walk(root);
    return out;
  }

  // @scenario behaviour orbit-scenario-map :: The scenario map is engine-computed at one read surface :: The map renders for a change
  it('the human render names the change, ON and the globs, the four kind columns, UNCOVERED and the baseline count', async () => {
    project("schema: spec-driven\nscenario_map:\n  tests: ['test/**/*.test.ts']\n");
    baseline('orbit-z', [req('Req Z', ['Z1'])]);
    testFile([tag('behaviour', K1), "it('x', () => {});"]);
    const r = await runCLI(['status', '--change', 'c1', '--scenarios'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('Scenario map: c1');
    expect(r.stdout).toContain('Check: ON');
    expect(r.stdout).toContain('test/**/*.test.ts');
    for (const k of ['behaviour:', 'text:', 'observed:', 'untestable:']) expect(r.stdout).toContain(k);
    expect(r.stdout).toContain(`UNCOVERED ADDED  ${K2}`);
    expect(r.stdout).toContain('test/a.test.ts:2');
    expect(r.stdout).toContain('baseline undeclared 1');
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is opt-in by the scenario_map config key :: An absent key leaves validate unchanged
  it('with no scenario_map key the surface renders with the check OFF over the default glob', async () => {
    project('schema: spec-driven\n');
    const r = await runCLI(['status', '--change', 'c1', '--scenarios'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('Check: OFF');
    expect(r.stdout).toContain('test/**/*.test.ts');
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is engine-computed at one read surface :: The JSON form carries the same facts
  it('--json prints one object of the requirement shape, every element shape and every count', async () => {
    project("schema: spec-driven\nscenario_map:\n  tests: ['test/**/*.test.ts']\n");
    delta('orbit-x', { ADDED: [req('Req A', ['Scen 1', 'Scen 2', 'Scen 3', 'X :: Y'])] });
    testFile([
      tag('behaviour', K1),
      tag('text', K1),
      "it('x', () => {});",
      tag('behaviour', 'orbit-x :: Req A :: Gone'),
      "it('y', () => {});",
      `${AT} covers ${K2}`,
    ]);
    write(
      'orbit/scenario-ledger.yaml',
      `scenarios:\n  - key: "${K2}"\n    kind: observed\n    record: r.json\n  - key: "${K2}"\n    kind: untestable\n    why: w\n  - key: "orbit-x :: Req A :: Nope"\n    kind: untestable\n    why: w\n  - kind: bogus\n`
    );
    const r = await runCLI(['status', '--change', 'c1', '--scenarios', '--json'], { cwd: root });
    expect(r.exitCode).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(Object.keys(j).sort()).toEqual(['change', 'check', 'counts', 'malformed', 'orphans', 'scenarios', 'tests']);
    expect(j.change).toBe('c1');
    expect(j.check).toBe('on');
    expect(j.tests).toEqual(['test/**/*.test.ts']);
    expect(j.scenarios[0]).toEqual({
      capability: 'orbit-x',
      requirement: 'Req A',
      scenario: 'Scen 1',
      operation: 'ADDED',
      declarations: {
        behaviour: [{ file: 'test/a.test.ts', line: 3 }],
        text: [{ file: 'test/a.test.ts', line: 3 }],
        observed: [],
        untestable: [],
      },
      uncovered: false,
    });
    expect(j.scenarios[1].declarations).toEqual({
      behaviour: [],
      text: [],
      observed: [{ record: 'r.json' }],
      untestable: [{ why: 'w' }],
    });
    expect(j.scenarios[2].uncovered).toBe(true);
    expect(j.orphans).toEqual([
      { source: 'tag', file: 'test/a.test.ts', line: 4, key: 'orbit-x :: Req A :: Gone' },
      { source: 'ledger', index: 2, key: 'orbit-x :: Req A :: Nope' },
    ]);
    expect(j.malformed).toEqual([
      { source: 'tag', file: 'test/a.test.ts', line: 6, reason: expect.any(String) },
      { source: 'ledger', index: 3, reason: expect.any(String) },
      { source: 'spec', capability: 'orbit-x', requirement: 'Req A', scenario: 'X :: Y', reason: 'unkeyable' },
    ]);
    expect(j.counts).toEqual({
      delta_scenarios: 3,
      behaviour: 1,
      text: 1,
      observed: 1,
      untestable: 1,
      uncovered: 1,
      orphans: 2,
      malformed: 3,
      baseline_undeclared: 0,
    });
  });

  it('a ledger file that fails as a whole reads source ledger-file', async () => {
    project('schema: spec-driven\n');
    write('orbit/scenario-ledger.yaml', '- a\n');
    const r = await runCLI(['status', '--change', 'c1', '--scenarios', '--json'], { cwd: root });
    expect(JSON.parse(r.stdout).malformed).toEqual([{ source: 'ledger-file', reason: expect.any(String) }]);
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is engine-computed at one read surface :: The flag requires a change
  it('--scenarios without --change fails naming --change', async () => {
    project('schema: spec-driven\n');
    const r = await runCLI(['status', '--scenarios'], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toContain('--change');
  });

  it.each([[['--report']], [['--boot']]])('--scenarios combined with %s fails cleanly', async (flags) => {
    project('schema: spec-driven\n');
    const r = await runCLI(['status', '--change', 'c1', '--scenarios', ...flags], { cwd: root });
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toContain('--scenarios');
    expect(r.stdout).toBe('');
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is engine-computed at one read surface :: Nothing is written
  it('the project tree is byte-identical before and after a run', async () => {
    project("schema: spec-driven\nscenario_map:\n  tests: ['test/**/*.test.ts']\n");
    testFile([tag('behaviour', K1), "it('x', () => {});"]);
    const before = snapshot();
    await runCLI(['status', '--change', 'c1', '--scenarios'], { cwd: root });
    await runCLI(['status', '--change', 'c1', '--scenarios', '--json'], { cwd: root });
    expect(snapshot()).toEqual(before);
  });
});
