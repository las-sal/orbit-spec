import { describe, it, expect } from 'vitest';
import { loadArchitectureDoc, sliceStageSection } from '../../../src/core/architecture/parser.js';
import { computeStageStates } from '../../../src/core/architecture/state.js';
import { validateArchitectureDoc } from '../../../src/core/architecture/validate.js';

// D2 exit criterion 1, asserted against the REAL retrofitted arc doc (not a fixture):
// the doc parses, validates, and `status` matches reality. Assertions are chosen to
// stay true across the arc's lifecycle (d1's composed `complete` is stable; later
// stages move through the vocabulary without ever legitimately rendering
// `inconsistent` — an inconsistency would mean the retrofit's invariant broke).
describe('retrofitted arc doc (live repo)', () => {
  it('parses as parseable with the six kebab stage ids and passes validate', () => {
    const doc = loadArchitectureDoc('.', 'd-arc-arbitered-flow');
    expect(doc).not.toBeNull();
    expect(doc!.docClass).toBe('parseable');
    expect(doc!.stages.map((s) => s.id)).toEqual([
      'd1-explicit-lifecycle-consent',
      'd2-architect',
      'd3-orientation',
      'd4-review-consistency',
      'd5-context-economy',
      'd6-pr-lifecycle',
    ]);
    expect(validateArchitectureDoc(doc!).valid).toBe(true);
  });

  it('declares the sequencing as Depends-on slots (D2 on D1; D3-D5 on D2; D6 on D1)', () => {
    const doc = loadArchitectureDoc('.', 'd-arc-arbitered-flow')!;
    const deps = Object.fromEntries(doc.stages.map((s) => [s.id, s.dependsOn]));
    expect(deps['d1-explicit-lifecycle-consent']).toEqual([]);
    expect(deps['d2-architect']).toEqual(['d1-explicit-lifecycle-consent']);
    expect(deps['d3-orientation']).toEqual(['d2-architect']);
    expect(deps['d6-pr-lifecycle']).toEqual(['d1-explicit-lifecycle-consent']);
  });

  it('computed state matches reality: d1 composes complete; no stage is inconsistent', () => {
    const doc = loadArchitectureDoc('.', 'd-arc-arbitered-flow')!;
    const states = computeStageStates('.', doc);
    const d1 = states.find((s) => s.id === 'd1-explicit-lifecycle-consent')!;
    // The backfilled archive citation + the user-ratified mark compose (stable forever).
    expect(d1.rendered).toBe('complete');
    expect(d1.ratifiedDate).toBe('2026-07-13');
    // The retrofit's invariant: status matches reality — no falsified/unsupported marks.
    expect(states.filter((s) => s.rendered === 'inconsistent')).toEqual([]);
  });

  it('hand-maintained state lines are gone (the R-d-4 subtraction) — incl. semantic pointers', () => {
    const doc = loadArchitectureDoc('.', 'd-arc-arbitered-flow')!;
    expect(doc.lines.some((l) => l.includes('State (manual until D2)'))).toBe(false);
    expect(doc.lines.some((l) => /^\*State/.test(l))).toBe(false);
    // No live prose may point readers at the deleted state lines (the status log,
    // an append-only ledger, is exempt — it starts at the '## Status log' heading).
    const ledgerStart = doc.lines.findIndex((l) => l.startsWith('## Status log'));
    const live = doc.lines.slice(0, ledgerStart === -1 ? undefined : ledgerStart);
    expect(live.some((l) => l.toLowerCase().includes('see the state line'))).toBe(false);
    expect(live.some((l) => l.toLowerCase().includes('state line + status log'))).toBe(false);
  });

  it('show-style slicing returns exactly one stage section of the real doc', () => {
    const doc = loadArchitectureDoc('.', 'd-arc-arbitered-flow')!;
    const section = sliceStageSection(doc, 'd2-architect')!;
    expect(section).toContain('### Stage d2-architect');
    expect(section).not.toContain('### Stage d3-orientation');
    expect(section).not.toContain('## Status log');
  });
});
