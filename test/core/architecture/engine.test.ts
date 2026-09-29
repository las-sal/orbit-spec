import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseArchitectureDoc, listArchitectureDocs, loadArchitectureDoc, sliceStageSection } from '../../../src/core/architecture/parser.js';
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

/** Write a staging directory's `explore.md` (the header is its first non-blank line). */
function writeExploreMd(name: string, content: string): void {
  fs.writeFileSync(path.join(tmpDir, 'orbit', 'explore', name, 'explore.md'), content);
}

const CONCLUDED_HEADER = '> **Status**: concluded 2026-09-25.\n\n# Exploration: done\n';

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
    expect(d1.complete).toEqual({ ratified: true, ended: false, date: '2026-07-13', who: 'Sal' });
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

  // rc15 (D-rc15-4): the slot's THIRD exact production, EXECUTED against the well-formed line and
  // each near-miss in its own assertion — the near-miss beside the well-formed line is exit (3).
  describe('the ended production `Complete: [~] <YYYY-MM-DD> (<who>)`', () => {
    const slotDoc = (...slotLines: string[]) =>
      `# Ended doc\n\n### Stage s1-only — the stage\n\nDepends-on: (none)\n${slotLines.join('\n')}\n\nProse.\n`;

    it('parses as ended with date and attribution, never ratified; validate passes', () => {
      const doc = parseArchitectureDoc(slotDoc('Complete: [~] 2026-09-28 (Sal)'), 'ended');
      expect(doc.docClass).toBe('parseable');
      expect(doc.stages[0].complete).toEqual({ ratified: false, ended: true, date: '2026-09-28', who: 'Sal' });
      expect(doc.stages[0].hasCompleteSlot).toBe(true);
      expect(validateArchitectureDoc(doc).valid).toBe(true);
    });

    it('the unratified and ratified productions carry ended: false (never both true)', () => {
      expect(parseArchitectureDoc(slotDoc('Complete: [ ]'), 'blank').stages[0].complete).toEqual({ ratified: false, ended: false });
      const ratified = parseArchitectureDoc(slotDoc('Complete: [x] 2026-09-28 (Sal)'), 'x').stages[0].complete;
      expect(ratified.ratified).toBe(true);
      expect(ratified.ended).toBe(false);
      // Absence: omission semantics.
      expect(parseArchitectureDoc(slotDoc(), 'absent').stages[0].complete).toEqual({ ratified: false, ended: false });
    });

    const nearMiss = (line: string) => {
      const doc = parseArchitectureDoc(slotDoc(line), 'nearmiss');
      expect(doc.docClass).toBe('malformed');
      expect(doc.violations).toHaveLength(1);
      expect(doc.violations[0].text).toBe(line);
      expect(doc.violations[0].line).toBe(5);
      expect(doc.violations[0].reason).toContain('Complete slot fails the grammar');
      // The violation names all three productions.
      expect(doc.violations[0].reason).toContain('`Complete: [ ]`');
      expect(doc.violations[0].reason).toContain('`Complete: [x] <YYYY-MM-DD> (<who>)`');
      expect(doc.violations[0].reason).toContain('`Complete: [~] <YYYY-MM-DD> (<who>)`');
      // No ended mark is parsed from any near-miss.
      expect(doc.stages[0].complete).toEqual({ ratified: false, ended: false });
      expect(doc.stages[0].hasCompleteSlot).toBe(false);
      expect(validateArchitectureDoc(doc).valid).toBe(false);
    };

    it('a bare `Complete: [~]` is a violation naming the line', () => {
      nearMiss('Complete: [~]');
    });

    it('a malformed date `Complete: [~] soon (someone)` is a violation naming the line', () => {
      nearMiss('Complete: [~] soon (someone)');
    });

    it('a trailing suffix `Complete: [~] 2026-09-28 (Sal) — withdrawn` is a violation naming the line', () => {
      nearMiss('Complete: [~] 2026-09-28 (Sal) — withdrawn');
    });

    it('one `[x]` line beside one `[~]` line is the duplicate-slot violation', () => {
      const doc = parseArchitectureDoc(slotDoc('Complete: [x] 2026-09-01 (Sal)', 'Complete: [~] 2026-09-28 (Sal)'), 'dup');
      expect(doc.docClass).toBe('malformed');
      expect(doc.violations).toHaveLength(1);
      expect(doc.violations[0].reason).toBe("duplicate Complete slot in stage 's1-only'");
      expect(doc.violations[0].line).toBe(6);
      // The first slot line stands; the two marks stay mutually exclusive.
      expect(doc.stages[0].complete).toEqual({ ratified: true, ended: false, date: '2026-09-01', who: 'Sal' });
      expect(validateArchitectureDoc(doc).valid).toBe(false);
    });

    // The DECLARED lexical limit, shared with the ratified production (external iter 1, S2;
    // Sal: 6A — declare, do not harden): dates are shape-only and attribution is opaque up to
    // the final closing paren. Asserted so the classification is tested, not accidental.
    it('declared limit: the date is shape-only — `2026-99-99` parses, for `[~]` exactly as for `[x]`', () => {
      const ended = parseArchitectureDoc(slotDoc('Complete: [~] 2026-99-99 (Sal)'), 'lex').stages[0].complete;
      expect(ended).toEqual({ ratified: false, ended: true, date: '2026-99-99', who: 'Sal' });
      const ratified = parseArchitectureDoc(slotDoc('Complete: [x] 2026-99-99 (Sal)'), 'lex').stages[0].complete;
      expect(ratified).toEqual({ ratified: true, ended: false, date: '2026-99-99', who: 'Sal' });
    });

    it('declared limit: attribution is opaque up to the final paren — `(Sal))` yields `Sal)`, for `[~]` exactly as for `[x]`', () => {
      const ended = parseArchitectureDoc(slotDoc('Complete: [~] 2026-09-28 (Sal))'), 'lex').stages[0].complete;
      expect(ended).toEqual({ ratified: false, ended: true, date: '2026-09-28', who: 'Sal)' });
      const ratified = parseArchitectureDoc(slotDoc('Complete: [x] 2026-09-28 (Sal))'), 'lex').stages[0].complete;
      expect(ratified).toEqual({ ratified: true, ended: false, date: '2026-09-28', who: 'Sal)' });
    });
  });

  it('carries passthrough without interpreting it: opaque prose changes nothing in the model', () => {
    // The `Passthrough is carried, not interpreted` scenario (orbit-architecture-engine) claims
    // two things. That `show` reproduces a section verbatim is covered by the slice test below.
    // This is the other half, and it is the one the requirement rests on: the parser CARRIES the
    // document's raw lines, so the model must be identical when only opaque prose differs.
    const varied = PARSEABLE_DOC.replace(
      'Charter prose. Exit criteria prose.',
      'Completely different charter prose — exit criteria, rulings, a status log, none of it read.'
    );
    expect(varied).not.toBe(PARSEABLE_DOC);

    const a = parseArchitectureDoc(PARSEABLE_DOC, 'test-arc');
    const b = parseArchitectureDoc(varied, 'test-arc');

    expect(b.docClass).toBe(a.docClass);
    expect(b.violations).toEqual(a.violations);
    expect(b.stages.map((s) => [s.id, s.title, s.dependsOn, s.complete])).toEqual(
      a.stages.map((s) => [s.id, s.title, s.dependsOn, s.complete])
    );
    // The lines DO differ — passthrough is carried, which is exactly why the claim needs proving.
    expect(b.lines).not.toEqual(a.lines);
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
  it('precedence: in-change > exploring > quiescent > concluded > premised', () => {
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

  // ---- rc15: the composition table (D-rc15-1, D-rc15-2) ---------------------------------------

  describe('the composition table — five observations × three marks (rc15)', () => {
    const SLOT: Record<'blank' | 'ratified' | 'ended', string> = {
      blank: 'Complete: [ ]',
      ratified: 'Complete: [x] 2026-09-01 (Sal)',
      ended: 'Complete: [~] 2026-09-28 (Sal)',
    };
    const oneStageDoc = (slot: string) => `# Arc\n\n### Stage s1 — the stage\n\nDepends-on: (none)\n${slot}\n`;

    type Fixture = { label: string; observed: string; setup: () => void };
    const FIXTURES: Fixture[] = [
      { label: 'an active change', observed: 'in-change', setup: () => writeCiting('active', 'live-work', 'arc', 's1') },
      { label: 'a live staging directory', observed: 'exploring', setup: () => writeCiting('explore', 's1-think', 'arc', 's1') },
      { label: 'an archived change', observed: 'quiescent', setup: () => writeCiting('archived', '2026-09-01-s1-work', 'arc', 's1') },
      {
        label: 'a concluded staging directory',
        observed: 'concluded',
        setup: () => {
          writeCiting('explore', 's1-done', 'arc', 's1');
          writeExploreMd('s1-done', CONCLUDED_HEADER);
        },
      },
      { label: 'no citer', observed: 'premised', setup: () => {} },
    ];

    // The table in the delta, cell for cell: (observed, mark) → rendered.
    const TABLE: Record<string, Record<'blank' | 'ratified' | 'ended', string>> = {
      'in-change': { blank: 'in-change', ratified: 'inconsistent', ended: 'inconsistent' },
      exploring: { blank: 'exploring', ratified: 'inconsistent', ended: 'inconsistent' },
      quiescent: { blank: 'quiescent-awaiting-ratification', ratified: 'complete', ended: 'ended' },
      concluded: { blank: 'ended-from-explore', ratified: 'inconsistent', ended: 'ended' },
      premised: { blank: 'premised', ratified: 'inconsistent', ended: 'ended' },
    };

    const stateOf = (slot: string) => {
      writeDoc('arc', oneStageDoc(slot));
      return computeStageStates('.', listArchitectureDocs('.')[0])[0];
    };

    it.each(
      FIXTURES.flatMap((f) => (['blank', 'ratified', 'ended'] as const).map((mark) => [f.label, mark, f, TABLE[f.observed][mark]] as const))
    )('%s × %s renders the table cell', (_label, mark, fixture, expected) => {
      fixture.setup();
      const s = stateOf(SLOT[mark]);
      expect(s.observed).toBe(fixture.observed);
      expect(s.rendered).toBe(expected);
      if (expected === 'inconsistent') expect(s.inconsistency).toBeTruthy();
      else expect(s.inconsistency).toBeUndefined();
    });

    it('covers all fifteen cells exactly once', () => {
      const cells = Object.values(TABLE).flatMap((row) => Object.values(row));
      expect(cells).toHaveLength(15);
      expect(Object.keys(TABLE)).toEqual(FIXTURES.map((f) => f.observed));
    });

    it('concluded-only + [ ] renders ended-from-explore naming the directory — never exploring (exit 2)', () => {
      writeCiting('explore', 's1-done', 'arc', 's1');
      writeExploreMd('s1-done', CONCLUDED_HEADER);
      const s = stateOf(SLOT.blank);
      expect(s.observed).toBe('concluded');
      expect(s.rendered).toBe('ended-from-explore');
      expect(s.rendered).not.toBe('exploring');
      expect(s.citing).toEqual([{ kind: 'explore', name: 's1-done', path: path.join('orbit', 'explore', 's1-done'), concluded: true }]);
    });

    it('a concluded exploration beside an archived change observes quiescent (archived work outranks a conclusion)', () => {
      writeCiting('archived', '2026-09-01-s1-work', 'arc', 's1');
      writeCiting('explore', 's1-done', 'arc', 's1');
      writeExploreMd('s1-done', CONCLUDED_HEADER);
      const s = stateOf(SLOT.blank);
      expect(s.observed).toBe('quiescent');
      expect(s.rendered).toBe('quiescent-awaiting-ratification');
    });

    it('a live explore beside a concluded one observes exploring (any live citer wins)', () => {
      writeCiting('explore', 's1-done', 'arc', 's1');
      writeExploreMd('s1-done', CONCLUDED_HEADER);
      writeCiting('explore', 's1-again', 'arc', 's1');
      writeExploreMd('s1-again', '> **Status**: exploring.\n');
      const s = stateOf(SLOT.blank);
      expect(s.observed).toBe('exploring');
      expect(s.citing.map((c) => [c.name, c.concluded])).toEqual([
        ['s1-again', false],
        ['s1-done', true],
      ]);
    });

    it('a neither-token header observes exploring, never concluded', () => {
      writeCiting('explore', 's1-odd', 'arc', 's1');
      writeExploreMd('s1-odd', '# Exploration: no status line at all\n\nProse.\n');
      const s = stateOf(SLOT.blank);
      expect(s.observed).toBe('exploring');
      expect(s.rendered).toBe('exploring');
    });

    it('the exploring token observes exploring', () => {
      writeCiting('explore', 's1-live', 'arc', 's1');
      writeExploreMd('s1-live', '> **Status**: exploring. Still thinking.\n');
      expect(stateOf(SLOT.blank).observed).toBe('exploring');
    });

    it('a missing explore.md observes exploring (lenient, like readCitation)', () => {
      writeCiting('explore', 's1-bare', 'arc', 's1');
      expect(fs.existsSync(path.join(tmpDir, 'orbit', 'explore', 's1-bare', 'explore.md'))).toBe(false);
      const s = stateOf(SLOT.blank);
      expect(s.observed).toBe('exploring');
      expect(s.citing[0].concluded).toBe(false);
    });

    it('the ended mark on a quiescent stage carries date and who; the ratified fields stay empty', () => {
      writeCiting('archived', '2026-09-01-s1-work', 'arc', 's1');
      const s = stateOf(SLOT.ended);
      expect(s.rendered).toBe('ended');
      expect(s.ended).toBe(true);
      expect(s.endedDate).toBe('2026-09-28');
      expect(s.endedWho).toBe('Sal');
      expect(s.ratified).toBe(false);
      expect(s.ratifiedDate).toBeUndefined();
      expect(s.ratifiedWho).toBeUndefined();
    });

    it('the ratified mark carries no ended fields', () => {
      writeCiting('archived', '2026-09-01-s1-work', 'arc', 's1');
      const s = stateOf(SLOT.ratified);
      expect(s.rendered).toBe('complete');
      expect(s.ended).toBe(false);
      expect(s.endedDate).toBeUndefined();
      expect(s.endedWho).toBeUndefined();
    });

    it('the ended mark on an active change: the detail names the change in the one declared form', () => {
      writeCiting('active', 'live-work', 'arc', 's1');
      const s = stateOf(SLOT.ended);
      expect(s.rendered).toBe('inconsistent');
      expect(s.inconsistency).toBe('Complete: mark is ended but active-change:live-work is live — the mark is not honored');
    });

    it('the ended mark on a live explore: the detail names the live explore, not a concluded sibling', () => {
      writeCiting('explore', 's1-done', 'arc', 's1');
      writeExploreMd('s1-done', CONCLUDED_HEADER);
      writeCiting('explore', 's1-think', 'arc', 's1');
      const s = stateOf(SLOT.ended);
      expect(s.rendered).toBe('inconsistent');
      expect(s.inconsistency).toBe('Complete: mark is ended but explore:s1-think is live — the mark is not honored');
    });

    it('[x] + concluded-only: the detail names the conclusion and never "live citing work" (W1)', () => {
      writeCiting('explore', 's1-done', 'arc', 's1');
      writeExploreMd('s1-done', CONCLUDED_HEADER);
      const s = stateOf(SLOT.ratified);
      expect(s.rendered).toBe('inconsistent');
      expect(s.inconsistency).toContain("observed state is 'concluded'");
      expect(s.inconsistency).toContain('a concluded exploration is not evidence that the exit criteria were met');
      expect(s.inconsistency).not.toContain('live citing work');
    });

    it('[x] + live explore keeps the pre-rc15 "live citing work" detail', () => {
      writeCiting('explore', 's1-think', 'arc', 's1');
      const s = stateOf(SLOT.ratified);
      expect(s.inconsistency).toContain('live citing work observed (exploring)');
    });

    it('re-entry: a new live change citing an ended stage renders inconsistent; clearing the slot is the re-entry', () => {
      writeCiting('archived', '2026-09-01-s1-work', 'arc', 's1');
      expect(stateOf(SLOT.ended).rendered).toBe('ended');
      writeCiting('active', 's1-reopen', 'arc', 's1');
      expect(stateOf(SLOT.ended).rendered).toBe('inconsistent');
      expect(stateOf(SLOT.blank).rendered).toBe('in-change');
    });
  });
});

// ---- Doc-identity containment (traversal/alias rejection) --------------------

describe('doc identity is a filename stem', () => {
  it('rejects traversal and alias names in load/show/validate', () => {
    writeDoc('arc', PARSEABLE_DOC);
    // A file outside orbit/architecture/ must be unreachable by any name spelling.
    fs.writeFileSync(path.join(tmpDir, 'OUTSIDE.md'), '# not an architecture doc\n');
    for (const name of ['../../OUTSIDE', '../OUTSIDE', 'subdir/../arc', './arc', '..', 'a/b']) {
      expect(loadArchitectureDoc('.', name)).toBeNull();
      expect(() => new ArchitectureCommand().show(name, undefined, {})).toThrow(/No architecture doc named/);
      expect(() => new ArchitectureCommand().validate(name, {})).toThrow(/No architecture doc named/);
    }
    // The canonical stem still loads (incl. stems with single dots, e.g. version numbers).
    expect(loadArchitectureDoc('.', 'arc')).not.toBeNull();
  });

  it('citation resolution rejects alias spellings at the doc level', () => {
    writeDoc('arc', PARSEABLE_DOC);
    const r = resolveArchitectureCitation('.', { doc: 'subdir/../arc', stage: 'd1-first' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.level).toBe('doc');
  });

  it('metadata schema rejects path-shaped doc names and non-kebab stage ids', async () => {
    const { writeChangeMetadata } = await import('../../../src/utils/change-metadata.js');
    const dir = path.join(tmpDir, 'orbit', 'changes', 'bad-cite');
    fs.mkdirSync(dir, { recursive: true });
    expect(() =>
      writeChangeMetadata(dir, { schema: 'spec-driven', architecture: { doc: '../escape', stage: 'd1-first' } })
    ).toThrow(/filename stem/);
    expect(() =>
      writeChangeMetadata(dir, { schema: 'spec-driven', architecture: { doc: 'arc', stage: 'Not A Stage' } })
    ).toThrow(/kebab-case/);
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

  it('status --json: the stage payload carries ended/endedDate/endedWho and renders the ended line (rc15)', () => {
    writeDoc(
      'arc',
      '# Arc\n\n### Stage s1 — ended one\n\nDepends-on: (none)\nComplete: [~] 2026-09-28 (Sal)\n\n### Stage s2 — from explore\n\nComplete: [ ]\n'
    );
    writeCiting('archived', '2026-09-01-s1-work', 'arc', 's1');
    writeCiting('explore', 's2-done', 'arc', 's2');
    writeExploreMd('s2-done', CONCLUDED_HEADER);
    const json = capture(() => new ArchitectureCommand().status({ json: true }));
    expect(json.code).toBe(0);
    const [s1, s2] = JSON.parse(json.out).parseable[0].stages;
    expect(s1).toMatchObject({ id: 's1', rendered: 'ended', ended: true, endedDate: '2026-09-28', endedWho: 'Sal', ratified: false });
    expect(s2).toMatchObject({ id: 's2', observed: 'concluded', rendered: 'ended-from-explore', ended: false });
    expect(s2.citing[0]).toMatchObject({ kind: 'explore', name: 's2-done', concluded: true });
    const text = capture(() => new ArchitectureCommand().status({}));
    const plain = text.out.replace(/\u001b\[[0-9;]*m/g, '');
    expect(plain).toContain('s1 — ended (declared 2026-09-28 by Sal) [archived-change:2026-09-01-s1-work]');
    expect(plain).toContain('s2 — ended-from-explore [explore:s2-done (concluded)]');
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
