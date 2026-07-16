import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseArchitectureDoc, listArchitectureDocs, sliceStageSection } from '../../../src/core/architecture/parser.js';
import { computeStageStates, scanCitations } from '../../../src/core/architecture/state.js';
import { validateArchitectureDoc, resolveArchitectureCitation } from '../../../src/core/architecture/validate.js';
import { ArchitectureCommand } from '../../../src/commands/architecture.js';

// ---- Fixtures ---------------------------------------------------------------

const PARSEABLE_DOC = `# Program: test-arc

Premise prose the engine never reads.

### Stage d1-first — the first stage

Depends-on: (none)
Complete: [x] 2026-07-13 (Sal)

Charter prose. Exit criteria prose.

### Stage d2-second — the second stage (with parens)

Depends-on: d1-first
Complete: [ ]

More prose.

### Stage d3-slotless — a stage with neither slot

Only charter prose here — omission semantics apply.

## Status log

Appended entries the engine never reads.
`;

const FENCED_DOC = `# Doc with fenced look-alikes

\`\`\`markdown
### Stage fake-stage — not a declaration
Complete: [x] 2026-01-01 (Nobody)
\`\`\`

### Stage real-stage — the only real one

Depends-on: (none)
`;

const LEGACY_DOC = `# A pre-D2 prose document

No stage-prefixed headings at all. Complete: freeform prose is fine here.
`;

const MALFORMED_HEADING_DOC = `# Near-miss doc

### Stage d2_architect architect

Prose under the mistyped heading (bad id form, missing em-dash).

### Stage d5-good — a well-formed sibling

Depends-on: (none)
`;

const MALFORMED_SLOT_DOC = `# Bad slot doc

### Stage d1-only — the stage

Depends-on: d1-only-typo-target
Complete: [x] soon (someone)
`;

const DUPLICATE_ID_DOC = `# Duplicate ids

### Stage d1-dup — first

### Stage d1-dup — second
`;

// ---- Workspace helpers ------------------------------------------------------

let tmpDir: string;
let prevCwd: string;

function writeDoc(name: string, content: string): void {
  const dir = path.join(tmpDir, 'orbit', 'architecture');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.md`), content);
}

function writeCiting(kind: 'active' | 'archived' | 'explore', name: string, doc: string, stage: string): void {
  const base =
    kind === 'active'
      ? path.join(tmpDir, 'orbit', 'changes', name)
      : kind === 'archived'
        ? path.join(tmpDir, 'orbit', 'changes', 'archive', name)
        : path.join(tmpDir, 'orbit', 'explore', name);
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(
    path.join(base, '.openspec.yaml'),
    `schema: spec-driven\ncreated: '2026-07-15'\narchitecture:\n  doc: ${doc}\n  stage: ${stage}\n`
  );
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-arch-'));
  prevCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(prevCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---- Parser -----------------------------------------------------------------

describe('architecture parser', () => {
  it('parses stage declarations with slots', () => {
    const doc = parseArchitectureDoc(PARSEABLE_DOC, 'test-arc');
    expect(doc.docClass).toBe('parseable');
    expect(doc.stages.map((s) => s.id)).toEqual(['d1-first', 'd2-second', 'd3-slotless']);
    const [d1, d2] = doc.stages;
    expect(d1.title).toBe('the first stage');
    expect(d1.dependsOn).toEqual([]);
    expect(d1.complete).toEqual({ ratified: true, date: '2026-07-13', who: 'Sal' });
    expect(d2.dependsOn).toEqual(['d1-first']);
    expect(d2.complete.ratified).toBe(false);
  });

  it('slotless stage parses with omission defaults', () => {
    const doc = parseArchitectureDoc(PARSEABLE_DOC, 'test-arc');
    const d3 = doc.stages[2];
    expect(d3.dependsOn).toEqual([]);
    expect(d3.hasDependsOnSlot).toBe(false);
    expect(d3.complete.ratified).toBe(false);
    expect(d3.hasCompleteSlot).toBe(false);
    expect(validateArchitectureDoc(doc).valid).toBe(true);
  });

  it('fenced look-alikes are content, never declarations', () => {
    const doc = parseArchitectureDoc(FENCED_DOC, 'fenced');
    expect(doc.docClass).toBe('parseable');
    expect(doc.stages.map((s) => s.id)).toEqual(['real-stage']);
    expect(doc.violations).toEqual([]);
  });

  it('zero stage headings outside fences is legacy, never an error', () => {
    const doc = parseArchitectureDoc(LEGACY_DOC, 'legacy');
    expect(doc.docClass).toBe('legacy');
    expect(doc.stages).toEqual([]);
    const result = validateArchitectureDoc(doc);
    expect(result.valid).toBe(true);
    expect(result.note).toMatch(/legacy/);
  });

  it('near-miss heading yields MALFORMED naming the line — never silent legacy', () => {
    const doc = parseArchitectureDoc(MALFORMED_HEADING_DOC, 'nearmiss');
    expect(doc.docClass).toBe('malformed');
    expect(doc.violations).toHaveLength(1);
    expect(doc.violations[0].text).toContain('d2_architect');
    // The well-formed sibling still parses.
    expect(doc.stages.map((s) => s.id)).toEqual(['d5-good']);
    expect(validateArchitectureDoc(doc).valid).toBe(false);
  });

  it('bad slot syntax is a violation; dangling Depends-on fails validation', () => {
    const doc = parseArchitectureDoc(MALFORMED_SLOT_DOC, 'badslot');
    expect(doc.docClass).toBe('malformed');
    expect(doc.violations.some((v) => v.reason.includes('Complete slot'))).toBe(true);
    const result = validateArchitectureDoc(doc);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Depends-on 'd1-only-typo-target'"))).toBe(true);
  });

  it('duplicate stage ids fail validation naming the id', () => {
    const doc = parseArchitectureDoc(DUPLICATE_ID_DOC, 'dup');
    const result = validateArchitectureDoc(doc);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("duplicate stage id 'd1-dup'"))).toBe(true);
  });

  it('slices exactly one stage section', () => {
    const doc = parseArchitectureDoc(PARSEABLE_DOC, 'test-arc');
    const section = sliceStageSection(doc, 'd2-second');
    expect(section).toContain('### Stage d2-second');
    expect(section).toContain('More prose.');
    expect(section).not.toContain('d3-slotless');
    expect(section).not.toContain('Status log');
    expect(sliceStageSection(doc, 'nope')).toBeNull();
  });
});

// ---- Computed state ---------------------------------------------------------

describe('computed stage state', () => {
  it('precedence: in-change > exploring > quiescent > premised', () => {
    writeDoc('arc', PARSEABLE_DOC);
    writeCiting('archived', '2026-07-01-first-work', 'arc', 'd2-second');
    writeCiting('active', 'live-work', 'arc', 'd2-second');
    const doc = listArchitectureDocs('.')[0];
    const states = computeStageStates('.', doc);
    const d2 = states.find((s) => s.id === 'd2-second')!;
    expect(d2.observed).toBe('in-change');
    expect(d2.rendered).toBe('in-change');
    expect(d2.citing).toHaveLength(2);
  });

  it('completion composes: quiescent + ratified = complete; quiescent alone awaits ratification', () => {
    writeDoc('arc', PARSEABLE_DOC);
    writeCiting('archived', '2026-07-13-d1-work', 'arc', 'd1-first');
    writeCiting('archived', '2026-07-14-d2-work', 'arc', 'd2-second');
    const doc = listArchitectureDocs('.')[0];
    const states = computeStageStates('.', doc);
    expect(states.find((s) => s.id === 'd1-first')!.rendered).toBe('complete');
    expect(states.find((s) => s.id === 'd2-second')!.rendered).toBe('quiescent-awaiting-ratification');
  });

  it('re-exploration flips a quiescent stage back to exploring', () => {
    writeDoc('arc', PARSEABLE_DOC);
    writeCiting('archived', '2026-07-14-d2-work', 'arc', 'd2-second');
    writeCiting('explore', 'd2-revisit', 'arc', 'd2-second');
    const doc = listArchitectureDocs('.')[0];
    const d2 = computeStageStates('.', doc).find((s) => s.id === 'd2-second')!;
    expect(d2.observed).toBe('exploring');
    expect(d2.rendered).toBe('exploring');
  });

  it('ratified mark on a premised stage (zero citing artifacts) surfaces as inconsistent', () => {
    writeDoc('arc', PARSEABLE_DOC);
    // d1-first is ratified in the doc but nothing cites it.
    const doc = listArchitectureDocs('.')[0];
    const d1 = computeStageStates('.', doc).find((s) => s.id === 'd1-first')!;
    expect(d1.observed).toBe('premised');
    expect(d1.rendered).toBe('inconsistent');
    expect(d1.inconsistency).toMatch(/premised/);
    expect(d1.inconsistency).toMatch(/backfill/);
  });

  it('ratified mark on live citing work surfaces as inconsistent, never silent complete', () => {
    writeDoc('arc', PARSEABLE_DOC);
    writeCiting('active', 'd1-rework', 'arc', 'd1-first');
    const doc = listArchitectureDocs('.')[0];
    const d1 = computeStageStates('.', doc).find((s) => s.id === 'd1-first')!;
    expect(d1.rendered).toBe('inconsistent');
    expect(d1.inconsistency).toMatch(/in-change/);
  });

  it('citation scan tolerates unreadable metadata and non-citing artifacts', () => {
    writeDoc('arc', PARSEABLE_DOC);
    const junkDir = path.join(tmpDir, 'orbit', 'changes', 'junk');
    fs.mkdirSync(junkDir, { recursive: true });
    fs.writeFileSync(path.join(junkDir, '.openspec.yaml'), '{{not yaml');
    const noCite = path.join(tmpDir, 'orbit', 'changes', 'plain');
    fs.mkdirSync(noCite, { recursive: true });
    fs.writeFileSync(path.join(noCite, '.openspec.yaml'), 'schema: spec-driven\n');
    expect(scanCitations('.', 'arc').size).toBe(0);
  });
});

// ---- Citation resolution ----------------------------------------------------

describe('citation resolution (two-level)', () => {
  it('resolves a live citation', () => {
    writeDoc('arc', PARSEABLE_DOC);
    expect(resolveArchitectureCitation('.', { doc: 'arc', stage: 'd1-first' })).toEqual({ ok: true });
  });

  it('dangles at the doc level naming the doc', () => {
    const r = resolveArchitectureCitation('.', { doc: 'ghost', stage: 'd1-first' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.level).toBe('doc');
      expect(r.message).toContain("'ghost'");
    }
  });

  it('dangles at the stage level listing declared stages', () => {
    writeDoc('arc', PARSEABLE_DOC);
    const r = resolveArchitectureCitation('.', { doc: 'arc', stage: 'd9-ghost' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.level).toBe('stage');
      expect(r.message).toContain('d1-first');
    }
  });

  it("resolves against a malformed doc's well-formed stages", () => {
    writeDoc('nearmiss', MALFORMED_HEADING_DOC);
    expect(resolveArchitectureCitation('.', { doc: 'nearmiss', stage: 'd5-good' })).toEqual({ ok: true });
    const r = resolveArchitectureCitation('.', { doc: 'nearmiss', stage: 'd2-architect' });
    expect(r.ok).toBe(false);
  });
});

// ---- Metadata round-trip + change-validation ownership -----------------------

describe('architecture citation in metadata', () => {
  it('round-trips through the metadata helpers alongside existing fields', async () => {
    const { writeChangeMetadata, readChangeMetadata } = await import('../../../src/utils/change-metadata.js');
    const changeDir = path.join(tmpDir, 'orbit', 'changes', 'cited');
    fs.mkdirSync(changeDir, { recursive: true });
    writeChangeMetadata(changeDir, {
      schema: 'spec-driven',
      created: '2026-07-15',
      schema_version: 3,
      architecture: { doc: 'd-arc-arbitered-flow', stage: 'd2-architect' },
      base_fingerprints: { cap: { Req: `sha256:${'a'.repeat(64)}` } },
    });
    const read = readChangeMetadata(changeDir);
    expect(read?.architecture).toEqual({ doc: 'd-arc-arbitered-flow', stage: 'd2-architect' });
    expect(read?.schema_version).toBe(3);
    expect(read?.base_fingerprints).toBeDefined();
  });

  it('helpers serve explore directories unchanged', async () => {
    const { writeChangeMetadata, readChangeMetadata } = await import('../../../src/utils/change-metadata.js');
    const exploreDir = path.join(tmpDir, 'orbit', 'explore', 'staged');
    fs.mkdirSync(exploreDir, { recursive: true });
    writeChangeMetadata(exploreDir, {
      schema: 'spec-driven',
      created: '2026-07-15',
      architecture: { doc: 'arc', stage: 'd1-first' },
    });
    expect(readChangeMetadata(exploreDir)?.architecture).toEqual({ doc: 'arc', stage: 'd1-first' });
  });

  it('uncited metadata is unaffected (field absent reads back absent)', async () => {
    const { writeChangeMetadata, readChangeMetadata } = await import('../../../src/utils/change-metadata.js');
    const changeDir = path.join(tmpDir, 'orbit', 'changes', 'plain');
    fs.mkdirSync(changeDir, { recursive: true });
    writeChangeMetadata(changeDir, { schema: 'spec-driven' });
    expect(readChangeMetadata(changeDir)?.architecture).toBeUndefined();
  });

  it('change validation fails a dangling citation naming the level (doc and stage each way)', async () => {
    const { Validator } = await import('../../../src/core/validation/validator.js');
    writeDoc('arc', PARSEABLE_DOC);
    const changeDir = path.join(tmpDir, 'orbit', 'changes', 'cited');
    const specDir = path.join(changeDir, 'specs', 'some-cap');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(
      path.join(specDir, 'spec.md'),
      '## ADDED Requirements\n\n### Requirement: X\n\nThe system SHALL x.\n\n#### Scenario: s\n\n- **WHEN** a\n- **THEN** b\n'
    );

    const runWith = async (doc: string, stage: string) => {
      fs.writeFileSync(
        path.join(changeDir, '.openspec.yaml'),
        `schema: spec-driven\narchitecture:\n  doc: ${doc}\n  stage: ${stage}\n`
      );
      return new Validator().validateChangeDeltaSpecs(changeDir);
    };

    const docDangle = await runWith('ghost', 'd1-first');
    expect(docDangle.valid).toBe(false);
    expect(docDangle.issues.some((i) => i.message.includes('DOC level'))).toBe(true);

    const stageDangle = await runWith('arc', 'd9-ghost');
    expect(stageDangle.valid).toBe(false);
    expect(stageDangle.issues.some((i) => i.message.includes('STAGE level'))).toBe(true);

    const resolves = await runWith('arc', 'd1-first');
    expect(resolves.valid).toBe(true);
  });
});

// ---- CLI --------------------------------------------------------------------

describe('architecture CLI', () => {
  function capture(fn: () => number): { out: string; code: number } {
    const chunks: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => chunks.push(args.join(' '));
    try {
      const code = fn();
      return { out: chunks.join('\n'), code };
    } finally {
      console.log = orig;
    }
  }

  it('status buckets parseable, legacy, and malformed (with per-stage state in malformed)', () => {
    writeDoc('good', PARSEABLE_DOC);
    writeDoc('old', LEGACY_DOC);
    writeDoc('broken', MALFORMED_HEADING_DOC);
    writeCiting('active', 'd5-work', 'broken', 'd5-good');
    const { out, code } = capture(() => new ArchitectureCommand().status({ json: true }));
    expect(code).toBe(0);
    const payload = JSON.parse(out);
    expect(payload.parseable.map((p: { doc: string }) => p.doc)).toEqual(['good']);
    expect(payload.legacy).toEqual(['old']);
    expect(payload.malformed).toHaveLength(1);
    expect(payload.malformed[0].violations).toHaveLength(1);
    // Well-formed stages of a malformed doc render computed state within the listing.
    const d5 = payload.malformed[0].stages.find((s: { id: string }) => s.id === 'd5-good');
    expect(d5.rendered).toBe('in-change');
  });

  it('status with no docs reports cleanly (exit 0, empty buckets)', () => {
    const json = capture(() => new ArchitectureCommand().status({ json: true }));
    expect(json.code).toBe(0);
    expect(JSON.parse(json.out)).toEqual({ parseable: [], legacy: [], malformed: [] });
    const text = capture(() => new ArchitectureCommand().status({}));
    expect(text.code).toBe(0);
    expect(text.out).toMatch(/no architecture docs/);
  });

  it('show slices one stage; bare show prints the index; legacy prints an empty index note', () => {
    writeDoc('good', PARSEABLE_DOC);
    writeDoc('old', LEGACY_DOC);
    const section = capture(() => new ArchitectureCommand().show('good', 'd2-second', {}));
    expect(section.out).toContain('### Stage d2-second');
    expect(section.out).not.toContain('d3-slotless');
    const index = capture(() => new ArchitectureCommand().show('good', undefined, {}));
    expect(index.out).toContain('d1-first');
    expect(index.out).toContain('d3-slotless');
    const legacy = capture(() => new ArchitectureCommand().show('old', undefined, {}));
    expect(legacy.code).toBe(0);
    expect(legacy.out).toMatch(/legacy/);
  });

  it('show on a malformed doc errors toward validate; nonexistent stage lists declared ids', () => {
    writeDoc('broken', MALFORMED_HEADING_DOC);
    writeDoc('good', PARSEABLE_DOC);
    expect(() => new ArchitectureCommand().show('broken', undefined, {})).toThrow(/orbit architecture validate broken/);
    expect(() => new ArchitectureCommand().show('good', 'd9-ghost', {})).toThrow(/d1-first, d2-second, d3-slotless/);
  });

  it('validate: legacy exits 0 with a note; malformed exits 1 naming lines; parseable passes', () => {
    writeDoc('good', PARSEABLE_DOC);
    writeDoc('old', LEGACY_DOC);
    writeDoc('broken', MALFORMED_SLOT_DOC);
    expect(capture(() => new ArchitectureCommand().validate('good', {})).code).toBe(0);
    const legacy = capture(() => new ArchitectureCommand().validate('old', {}));
    expect(legacy.code).toBe(0);
    expect(legacy.out).toMatch(/legacy/);
    const broken = capture(() => new ArchitectureCommand().validate('broken', { json: true }));
    expect(broken.code).toBe(1);
    expect(JSON.parse(broken.out).issues.length).toBeGreaterThan(0);
  });

  it('renders no imperative next-step labels (eligibility framing)', () => {
    writeDoc('good', PARSEABLE_DOC);
    writeCiting('archived', '2026-07-14-d2-work', 'good', 'd2-second');
    const status = capture(() => new ArchitectureCommand().status({}));
    expect(status.out).not.toMatch(/Next:/);
    expect(status.out).not.toMatch(/\bRun\b/);
  });
});
