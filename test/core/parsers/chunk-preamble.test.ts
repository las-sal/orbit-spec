import { describe, it, expect } from 'vitest';
import { parseChunkPreamble, chunkForGroup } from '../../../src/core/parsers/chunk-preamble.js';

const P = 'orbit/changes/foo/tasks.md';

const ok = `<!--
Implementation chunks:
  Chunk 1 (groups 1):    Foundation
  Chunk 2 (groups 2-3):  Workflow emits
  Chunk 3 (groups 4):    Apply behavior
-->

# Tasks: foo

## 1. First
- [ ] 1.1 a

## 2. Second
- [ ] 2.1 b

## 3. Third
- [ ] 3.1 c

## 4. Fourth
- [ ] 4.1 d
`;

describe('parseChunkPreamble', () => {
  it('parses a valid preamble with single groups and ranges', () => {
    const r = parseChunkPreamble(ok, P);
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.declarations).toEqual([
      { chunk: 1, groupStart: 1, groupEnd: 1, name: 'Foundation' },
      { chunk: 2, groupStart: 2, groupEnd: 3, name: 'Workflow emits' },
      { chunk: 3, groupStart: 4, groupEnd: 4, name: 'Apply behavior' },
    ]);
  });

  it('returns absent when no preamble comment exists', () => {
    expect(parseChunkPreamble('# Tasks\n\n## 1. a\n- [ ] x\n', P).kind).toBe('absent');
  });

  it('returns absent for an HTML comment without the Implementation chunks marker', () => {
    expect(parseChunkPreamble('<!-- just a note -->\n## 1. a\n', P).kind).toBe('absent');
  });

  it('ignores comment blocks after the first group header', () => {
    const content = '# T\n\n## 1. a\n<!--\nImplementation chunks:\n  Chunk 1 (groups 1): X\n-->\n';
    expect(parseChunkPreamble(content, P).kind).toBe('absent');
  });

  it('flags a typo in the Chunk line as malformed with the documented warning', () => {
    const bad = ok.replace('Chunk 2 (groups 2-3)', 'Chnk 2 (groups 2-3)');
    const r = parseChunkPreamble(bad, P);
    expect(r.kind).toBe('malformed');
    if (r.kind !== 'malformed') return;
    expect(r.warning).toContain('could not be parsed as chunk declarations');
    expect(r.warning).toContain(P);
  });

  it('flags missing parens as malformed', () => {
    const bad = ok.replace('(groups 1)', 'groups 1');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags a non-contiguous group set as malformed', () => {
    const bad = ok.replace('(groups 2-3)', '(groups 2,3)');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags an inverted range as malformed', () => {
    const bad = ok.replace('(groups 2-3)', '(groups 3-2)');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags overlapping ranges as malformed (cross-declaration rule)', () => {
    const bad = ok.replace('Chunk 3 (groups 4)', 'Chunk 3 (groups 3-4)');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags a coverage gap as malformed (cross-declaration rule)', () => {
    const bad = ok.replace('Chunk 3 (groups 4)', 'Chunk 3 (groups 5)');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags out-of-order chunk numbers as malformed (cross-declaration rule)', () => {
    const bad = ok
      .replace('Chunk 2 (groups 2-3):  Workflow emits', 'Chunk 3 (groups 2-3):  Workflow emits')
      .replace('Chunk 3 (groups 4):    Apply behavior', 'Chunk 2 (groups 4):    Apply behavior');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('parses the real d5 preamble shape', () => {
    const groups = Array.from({ length: 9 }, (_, i) => `## ${i + 1}. g${i + 1}\n- [ ] ${i + 1}.1 t\n`).join('\n');
    const d5 = `<!--\nImplementation chunks:\n  Chunk 1 (groups 1-3):  Emit surface engine (parsers, composition, CLI, write gate)\n  Chunk 2 (groups 4-5):  Engine surfaces (boot render, gates vocabulary, model hints)\n  Chunk 3 (groups 6-7):  Review merge + body-economy pass\n  Chunk 4 (groups 8-9):  Workflow-layer hardening, audit checks, verification sweep\n-->\n\n# Tasks\n\n${groups}`;
    const r = parseChunkPreamble(d5, P);
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.declarations).toHaveLength(4);
    expect(chunkForGroup(r.declarations, 5)?.chunk).toBe(2);
    expect(chunkForGroup(r.declarations, 9)?.chunk).toBe(4);
    expect(chunkForGroup(r.declarations, 10)).toBeNull();
  });

  it('flags an omitted TRAILING group as malformed (content-coverage rule)', () => {
    // Declarations cover 1-4 internally, but tasks.md carries a fifth numbered group
    // with real work — the final declared chunk must not be able to record complete.
    const bad = ok.replace('## 4. Fourth\n- [ ] 4.1 d\n', '## 4. Fourth\n- [ ] 4.1 d\n\n## 5. Fifth\n- [ ] 5.1 e\n');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags an omitted LEADING group as malformed (content-coverage rule)', () => {
    // Declared span starts at group 2 while group 1 exists in the file.
    const bad = ok
      .replace('Chunk 1 (groups 1):    Foundation\n  ', '')
      .replace('Chunk 2 (groups 2-3)', 'Chunk 1 (groups 2-3)')
      .replace('Chunk 3 (groups 4)', 'Chunk 2 (groups 4)');
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags declarations over a file with NO numbered groups as malformed', () => {
    const bad = '<!--\nImplementation chunks:\n  Chunk 1 (groups 1): X\n-->\n\n# Tasks\n\n## Unnumbered\n- [ ] a\n';
    expect(parseChunkPreamble(bad, P).kind).toBe('malformed');
  });

  it('flags an UNNUMBERED group carrying checkboxes as malformed (undeclarable work — content-coverage rule)', () => {
    // Unchecked task under an unnumbered header: counted by arithmetic, coverable by no chunk.
    const unchecked = ok + '\n## Extra work\n- [ ] stray task\n';
    expect(parseChunkPreamble(unchecked, P).kind).toBe('malformed');
    // CHECKED tasks under an unnumbered header are the same hazard (they distort arithmetic).
    const checked = ok + '\n## Extra work\n- [x] stray done task\n';
    expect(parseChunkPreamble(checked, P).kind).toBe('malformed');
    // An unnumbered group with NO checkboxes (prose notes) stays fine.
    const notes = ok + '\n## Notes\nprose only, no tasks\n';
    expect(parseChunkPreamble(notes, P).kind).toBe('ok');
  });
});
