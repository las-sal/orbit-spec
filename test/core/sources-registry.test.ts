import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseArchitectureDoc, loadArchitectureDoc } from '../../src/core/architecture/parser.js';
import {
  countRulingEntries,
  readSourcesRegistry,
  resolveSourceValue,
  listEngineSources,
  SourceRegistryError,
  SourceResolutionError,
} from '../../src/core/sources-registry.js';

// ---- countRulingEntries (task 1.1) -----------------------------------------

describe('countRulingEntries', () => {
  it('counts the live program doc: prefix R-crc yields its ruling entries', () => {
    const doc = loadArchitectureDoc('.', 'clean-up-review-cycle')!;
    expect(doc).not.toBeNull();
    const count = countRulingEntries(doc, 'R-crc');

    // PINNED: the live contract value the task called for. A derived oracle alone can share a
    // mistake with the implementation — the same section, fence and bold assumptions on both
    // sides pass each other while both are wrong — so the number is stated outright. When a
    // ruling is added this test is the thing that must be updated deliberately.
    expect(count).toBe(10);

    // DERIVED, as a second and independent witness: a plain scan of the section must agree.
    const section = sliceRulingsIndex(doc.lines);
    const byHand = section.filter((l) => /^ {0,3}[-*] \*\*R-crc-\d+\*\*/.test(l)).length;
    expect(byHand).toBe(count);
  });

  it('does NOT count ruling-shaped bullets inside a nested fence, and does not mask the live one', () => {
    // The ruling parse used the requirement-block heuristic while marker scanning used the
    // shared CommonMark tracker. In a doc carrying a four-backtick fence around a
    // three-backtick example, the heuristic admitted both fenced bullets AND masked the live
    // one, returning 2 where the answer is 1 — an engine-computed source value that is false.
    const doc = parseArchitectureDoc(
      [
        '# P',
        '',
        '### Stage s1 — one',
        '',
        '## Rulings index',
        '',
        '````markdown',
        '```',
        '- **R-x-1** an example inside the fence, not an entry',
        '- **R-x-2** likewise',
        '````',
        '',
        '- **R-x-3** the only real entry',
      ].join('\n'),
      'nested-fence'
    );
    expect(countRulingEntries(doc, 'R-x')).toBe(1);
  });

  it('a three-backtick line cannot close a four-backtick fence', () => {
    const doc = parseArchitectureDoc(
      ['## Rulings index', '', '````', '```', '- **R-x-1** still fenced', '````', '', '- **R-x-2** live'].join('\n'),
      'lengths'
    );
    expect(countRulingEntries(doc, 'R-x')).toBe(1);
  });

  it('throws naming doc and prefix when the declared prefix matches nothing', () => {
    const doc = loadArchitectureDoc('.', 'clean-up-review-cycle')!;
    expect(() => countRulingEntries(doc, 'R-nope')).toThrow(SourceResolutionError);
    expect(() => countRulingEntries(doc, 'R-nope')).toThrow(/clean-up-review-cycle.*R-nope/s);
  });

  it('throws when the doc has no rulings section at all', () => {
    const doc = parseArchitectureDoc('# Doc\n\n### Stage a-b — t\n\nprose\n', 'no-rulings');
    expect(() => countRulingEntries(doc, 'R-crc')).toThrow(/no '## Rulings index' section/);
  });

  it('does not count a NESTED bullet whose bold span matches the prefix', () => {
    const doc = parseArchitectureDoc(
      [
        '# Doc',
        '',
        '## Rulings index',
        '',
        '- **R-x-1** (who) — the first ruling',
        '  - **R-x-99** a nested bullet that restates it, not an entry',
        '- **R-x-2** (who) — the second ruling',
        '',
        '## Next section',
        '',
        '- **R-x-3** outside the section entirely',
      ].join('\n'),
      'nested'
    );
    expect(countRulingEntries(doc, 'R-x')).toBe(2);
  });

  it('matches the prefix literally and requires digits with nothing after', () => {
    const doc = parseArchitectureDoc(
      [
        '## Rulings index',
        '',
        '- **R-x-1** counted',
        '- **R-x-4a** not an entry (suffix after the digits)',
        '- **R-x-10** counted',
        '- **Rax-2** not an entry (the prefix is literal, not a pattern)',
      ].join('\n'),
      'literal'
    );
    expect(countRulingEntries(doc, 'R-x')).toBe(2);
  });

  it('is fence-aware: entries inside a fenced block are content', () => {
    const doc = parseArchitectureDoc(
      [
        '## Rulings index',
        '',
        '- **R-x-1** counted',
        '',
        '```markdown',
        '- **R-x-2** an example of the format, not an entry',
        '```',
        '',
        '- **R-x-3** counted',
      ].join('\n'),
      'fenced'
    );
    expect(countRulingEntries(doc, 'R-x')).toBe(2);
  });

  it('ends the section at the next ##-or-higher heading', () => {
    const doc = parseArchitectureDoc(
      [
        '## Rulings index',
        '',
        '- **R-x-1** counted',
        '',
        '### A subsection still inside the rulings section',
        '',
        '- **R-x-2** counted',
        '',
        '## Open questions',
        '',
        '- **R-x-3** outside',
      ].join('\n'),
      'bounds'
    );
    expect(countRulingEntries(doc, 'R-x')).toBe(2);
  });
});

function sliceRulingsIndex(lines: string[]): string[] {
  const start = lines.findIndex((l) => /^##\s+Rulings index\s*$/.test(l));
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,2}\s/.test(l));
  return end === -1 ? rest : rest.slice(0, end);
}

// A valid (if tiny) schema whose only interesting field is its version.
const MINIMAL_SCHEMA = (version: number): string =>
  [
    'name: spec-driven',
    `version: ${version}`,
    'description: a test schema',
    'artifacts:',
    '  - id: only',
    '    generates: only.md',
    '    description: the only artifact',
    '    template: only.md',
    '    instruction: write it',
    '',
  ].join('\n');

// ---- The registry reader and the engine table (tasks 1.2, 1.3) --------------

describe('sources registry', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-sources-'));
    fs.mkdirSync(path.join(root, 'orbit', 'architecture'), { recursive: true });
    fs.mkdirSync(path.join(root, 'orbit', 'specs', 'cap-one'), { recursive: true });
    fs.mkdirSync(path.join(root, 'orbit', 'specs', 'cap-two'), { recursive: true });
    fs.mkdirSync(path.join(root, 'orbit', 'specs', 'no-spec-file'), { recursive: true });
    fs.writeFileSync(path.join(root, 'orbit', 'specs', 'cap-one', 'spec.md'), '# one\n');
    fs.writeFileSync(path.join(root, 'orbit', 'specs', 'cap-two', 'spec.md'), '# two\n');
    fs.writeFileSync(
      path.join(root, 'orbit', 'architecture', 'prog.md'),
      [
        '# Program',
        '',
        '### Stage s1 — first',
        '',
        'Depends-on: (none)',
        '',
        '### Stage s2 — second',
        '',
        '## Rulings index',
        '',
        '- **R-p-1** one',
        '- **R-p-2** two',
        '- **R-p-3** three',
      ].join('\n')
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function writeRegistry(yaml: string): void {
    fs.writeFileSync(path.join(root, 'orbit', 'sources.yaml'), yaml);
  }

  it('an absent file is an empty registry and no error', () => {
    expect(readSourcesRegistry(root)).toEqual([]);
  });

  it('resolves all four v1 engine sources', () => {
    writeRegistry(
      [
        'sources:',
        '  stages:',
        '    engine: architecture.stage-count',
        '    doc: prog',
        '  rulings:',
        '    engine: architecture.ruling-count',
        '    doc: prog',
        '    prefix: R-p',
        '  capabilities:',
        '    engine: specs.capability-count',
        '  schema-version:',
        '    engine: schema.version',
        '    schema: spec-driven',
        '',
      ].join('\n')
    );
    const declared = readSourcesRegistry(root);
    expect(declared.map((d) => d.name)).toEqual(['stages', 'rulings', 'capabilities', 'schema-version']);
    const values = Object.fromEntries(declared.map((d) => [d.name, resolveSourceValue(root, d)]));
    expect(values.stages).toBe('2');
    expect(values.rulings).toBe('3');
    // BASELINE directories carrying a spec.md only — `no-spec-file` is not counted.
    expect(values.capabilities).toBe('2');
    // A string, always — `version: 4` is a YAML number rendered at the source.
    expect(values['schema-version']).toMatch(/^\d+$/);
  });

  it('the CLOSED engine table is exactly the four v1 sources', () => {
    expect(listEngineSources()).toEqual([
      'architecture.ruling-count',
      'architecture.stage-count',
      'schema.version',
      'specs.capability-count',
    ]);
  });

  it('schema.version SKIPS the user-global override tier', () => {
    const dataHome = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-xdg-'));
    const userSchemaDir = path.join(dataHome, 'openspec', 'schemas', 'spec-driven');
    fs.mkdirSync(userSchemaDir, { recursive: true });
    const packageVersion = (() => {
      writeRegistry('sources:\n  v:\n    engine: schema.version\n    schema: spec-driven\n');
      return resolveSourceValue(root, readSourcesRegistry(root)[0]);
    })();
    // A user-global override declaring a wildly different version must not be consulted.
    fs.writeFileSync(
      path.join(userSchemaDir, 'schema.yaml'),
      MINIMAL_SCHEMA(999)
    );
    const prevHome = process.env.XDG_DATA_HOME;
    process.env.XDG_DATA_HOME = dataHome;
    try {
      expect(resolveSourceValue(root, readSourcesRegistry(root)[0])).toBe(packageVersion);
      expect(resolveSourceValue(root, readSourcesRegistry(root)[0])).not.toBe('999');
    } finally {
      if (prevHome === undefined) delete process.env.XDG_DATA_HOME;
      else process.env.XDG_DATA_HOME = prevHome;
      fs.rmSync(dataHome, { recursive: true, force: true });
    }
  });

  it('schema.version prefers a PROJECT-LOCAL schema over the package built-in', () => {
    const local = path.join(root, 'orbit', 'schemas', 'spec-driven');
    fs.mkdirSync(local, { recursive: true });
    fs.writeFileSync(
      path.join(local, 'schema.yaml'),
      MINIMAL_SCHEMA(42)
    );
    writeRegistry('sources:\n  v:\n    engine: schema.version\n    schema: spec-driven\n');
    expect(resolveSourceValue(root, readSourcesRegistry(root)[0])).toBe('42');
  });

  it('a MALFORMED architecture doc errors rather than emitting a short count', () => {
    fs.writeFileSync(
      path.join(root, 'orbit', 'architecture', 'broken.md'),
      ['# Program', '', '### Stage s1 — fine', '', '### Stage bad_id no em-dash', ''].join('\n')
    );
    writeRegistry('sources:\n  stages:\n    engine: architecture.stage-count\n    doc: broken\n');
    const declared = readSourcesRegistry(root);
    expect(() => resolveSourceValue(root, declared[0])).toThrow(SourceResolutionError);
    expect(() => resolveSourceValue(root, declared[0])).toThrow(/malformed/);
  });

  it('a LEGACY architecture doc errors rather than emitting zero', () => {
    fs.writeFileSync(path.join(root, 'orbit', 'architecture', 'old.md'), '# Just prose\n\nNo stages here.\n');
    writeRegistry('sources:\n  stages:\n    engine: architecture.stage-count\n    doc: old\n');
    const declared = readSourcesRegistry(root);
    expect(() => resolveSourceValue(root, declared[0])).toThrow(/legacy/);
  });

  it('a ruling prefix matching nothing is a malformed source, never zero', () => {
    writeRegistry(
      'sources:\n  r:\n    engine: architecture.ruling-count\n    doc: prog\n    prefix: R-absent\n'
    );
    const declared = readSourcesRegistry(root);
    expect(() => resolveSourceValue(root, declared[0])).toThrow(/R-absent/);
  });

  describe('every registry fault fails loudly', () => {
    const cases: { name: string; yaml: string; match: RegExp }[] = [
      { name: 'unparseable YAML', yaml: 'sources:\n  a: [unclosed\n', match: /not valid YAML/ },
      { name: 'sources is not a map', yaml: 'sources: a string\n', match: /must be a map from source name to entry/ },
      { name: 'entry is a scalar', yaml: 'sources:\n  a: 5\n', match: /must be a map, not number/ },
      // Pinned to the branch that ACTUALLY fires: parseYaml({uniqueKeys:true}) rejects the
      // duplicate before any engine-side guard could. An alternation here would pass whichever
      // path ran and record nothing about which contract is live.
      { name: 'duplicate source name', yaml: 'sources:\n  a:\n    engine: specs.capability-count\n  a:\n    engine: specs.capability-count\n', match: /not valid YAML/ },
      { name: 'missing engine', yaml: 'sources:\n  a:\n    doc: prog\n', match: /missing 'engine:'/ },
      { name: 'unknown engine', yaml: 'sources:\n  a:\n    engine: nope.nope\n', match: /unknown engine source 'nope.nope'; the engine exposes: architecture\.ruling-count/ },
      { name: 'missing required parameter', yaml: 'sources:\n  a:\n    engine: architecture.stage-count\n', match: /missing required parameter 'doc'/ },
      { name: 'unknown key', yaml: 'sources:\n  a:\n    engine: specs.capability-count\n    doc: prog\n', match: /unknown key 'doc'/ },
      { name: 'bad source name', yaml: 'sources:\n  Bad_Name:\n    engine: specs.capability-count\n', match: /marker name grammar/ },
      { name: 'non-string parameter', yaml: 'sources:\n  a:\n    engine: architecture.stage-count\n    doc: 5\n', match: /must be a non-empty string/ },
      { name: 'empty-string parameter', yaml: 'sources:\n  a:\n    engine: architecture.stage-count\n    doc: "  "\n', match: /must be a non-empty string/ },
      { name: 'list parameter', yaml: 'sources:\n  a:\n    engine: architecture.stage-count\n    doc: [x]\n', match: /must be a non-empty string, not a list/ },
      { name: 'doc that does not exist', yaml: 'sources:\n  a:\n    engine: architecture.stage-count\n    doc: ghost\n', match: /architecture doc 'ghost' does not exist/ },
      { name: 'schema that does not exist', yaml: 'sources:\n  a:\n    engine: schema.version\n    schema: ghost\n', match: /schema 'ghost' does not exist/ },
      { name: 'no sources key', yaml: 'other: 1\n', match: /unknown top-level key/ },
      { name: 'empty file', yaml: '', match: /is empty/ },
    ];

    for (const c of cases) {
      it(c.name, () => {
        writeRegistry(c.yaml);
        expect(() => readSourcesRegistry(root)).toThrow(SourceRegistryError);
        expect(() => readSourcesRegistry(root)).toThrow(c.match);
      });
    }
  });

  it('an existing registry can never reach the absent-file silence', () => {
    for (const yaml of ['sources:\n', 'sources: {}\n']) {
      writeRegistry(yaml);
      // Present-but-null and present-but-empty are both files that EXIST. An empty map used to
      // be accepted, leaving registryPresent true with no sources, no coverage and no output —
      // a truncation could disable every check without a named reason.
      expect(() => readSourcesRegistry(root), yaml).toThrow(SourceRegistryError);
    }
  });

  it('a schema parameter is an IDENTIFIER: it cannot traverse out of the declared tiers', () => {
    // A schema.yaml planted outside both tiers must stay unreachable, however the parameter is
    // spelled — a read-only-looking validation command never consumes undeclared inputs.
    const outside = path.join(root, 'schemas', 'spec-driven');
    fs.mkdirSync(outside, { recursive: true });
    fs.writeFileSync(path.join(outside, 'schema.yaml'), MINIMAL_SCHEMA(777));
    for (const attempt of [
      '../../schemas/spec-driven',
      '../../../etc',
      'spec-driven/../../../schemas/spec-driven',
      '/absolute/spec-driven',
    ]) {
      writeRegistry(`sources:\n  v:\n    engine: schema.version\n    schema: "${attempt}"\n`);
      expect(() => readSourcesRegistry(root), attempt).toThrow(/does not exist project-locally or in the package/);
    }
  });

  it('a SYMLINKED tier root is never trusted, for either parameter kind', () => {
    // realpath'ing the tier root first made containment tautological: the outside directory
    // became the root it was compared against, and a schema from outside the declared tier was
    // read. The tier's own directory entry must not be a symlink.
    const outsideSchemas = path.join(root, 'elsewhere', 'schemas');
    fs.mkdirSync(path.join(outsideSchemas, 'spec-driven'), { recursive: true });
    fs.writeFileSync(path.join(outsideSchemas, 'spec-driven', 'schema.yaml'), MINIMAL_SCHEMA(777));
    fs.symlinkSync(outsideSchemas, path.join(root, 'orbit', 'schemas'));
    writeRegistry('sources:\n  v:\n    engine: schema.version\n    schema: spec-driven\n');
    // Falls through to the PACKAGE tier rather than reading the symlinked one.
    expect(resolveSourceValue(root, readSourcesRegistry(root)[0])).not.toBe('777');

    const outsideArch = path.join(root, 'elsewhere', 'architecture');
    fs.mkdirSync(outsideArch, { recursive: true });
    fs.writeFileSync(path.join(outsideArch, 'ghost.md'), '# P\n\n### Stage s1 — one\n');
    fs.rmSync(path.join(root, 'orbit', 'architecture'), { recursive: true, force: true });
    fs.symlinkSync(outsideArch, path.join(root, 'orbit', 'architecture'));
    writeRegistry('sources:\n  s:\n    engine: architecture.stage-count\n    doc: ghost\n');
    expect(() => readSourcesRegistry(root)).toThrow(/does not resolve within it|does not exist/);
  });

  it('an inherited prototype name is a clean unknown-source error, not a TypeError', () => {
    for (const name of ['toString', 'constructor', 'hasOwnProperty']) {
      writeRegistry(`sources:\n  a:\n    engine: ${name}\n`);
      expect(() => readSourcesRegistry(root), name).toThrow(SourceRegistryError);
      expect(() => readSourcesRegistry(root), name).toThrow(/the engine exposes: architecture\.ruling-count/);
    }
  });

  it('specs.capability-count errors on an ABSENT specs directory but counts an EMPTY one', () => {
    writeRegistry('sources:\n  caps:\n    engine: specs.capability-count\n');
    // Present but empty is a truthful zero.
    fs.rmSync(path.join(root, 'orbit', 'specs'), { recursive: true, force: true });
    fs.mkdirSync(path.join(root, 'orbit', 'specs'), { recursive: true });
    expect(resolveSourceValue(root, readSourcesRegistry(root)[0])).toBe('0');
    // Absent is 'no baseline to count' — the short-count failure the architecture sources refuse.
    fs.rmSync(path.join(root, 'orbit', 'specs'), { recursive: true, force: true });
    expect(() => readSourcesRegistry(root)).toThrow(/no orbit\/specs\/ directory/);
  });
});
