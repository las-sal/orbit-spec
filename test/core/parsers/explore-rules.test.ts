import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExploreRules, parseExploreRulesFile } from '../../../src/core/parsers/explore-rules.js';
import { countExplore } from '../../../src/core/parsers/explore-counter.js';
import { MOVE_NAMES, DECISION_OPENER_PREFIX } from '../../../src/core/explore-grammar.js';
import { getExploreSkillTemplate } from '../../../src/core/templates/skill-templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, '../../..');

// ---------------------------------------------------------------------------
// Fixture builders — the grammar's shapes, one knob per defect
// ---------------------------------------------------------------------------

const allMoves = (): string[] => MOVE_NAMES.map((m) => `- ${m}: applied — found it`);

interface MechOpts {
  closure?: string | null; // null = no Closure: line
  residualKind?: string | null; // null = omit the slot
  residualMethod?: string | null;
  table?: string[]; // full table lines override
  moves?: string[]; // override the nine lines
  title?: string;
  heading?: string; // override the whole heading line
}

function mech(id: string, o: MechOpts = {}): string {
  const lines: string[] = [];
  lines.push(o.heading ?? `### ${id} — ${o.title ?? 'a rule'}`);
  lines.push('Domain: the set, in one line');
  lines.push(...(o.table ?? ['| member | covered by |', '|---|---|', '| a member | its cover |']));
  if (o.closure !== null) lines.push(`Closure: ${o.closure ?? 'SOURCED'} — why`);
  if (o.residualKind != null) lines.push(`Residual kind: ${o.residualKind}`);
  if (o.residualMethod != null) lines.push(`Residual method: ${o.residualMethod}`);
  lines.push('Moves:');
  lines.push(...(o.moves ?? allMoves()));
  return lines.join('\n');
}

interface DecOpts {
  kind?: string;
  disposition?: string;
  reEntry?: string;
  opener?: string; // override the whole first line
  wrap?: boolean; // wrap the bold title's closing ** onto the second line
}

function dec(id: string, o: DecOpts = {}): string {
  const lines: string[] = [];
  if (o.opener) lines.push(o.opener);
  else if (o.wrap) {
    lines.push(`- **2026-09-25 — ${id}: a long title that`);
    lines.push('  wraps** and then prose.');
  } else lines.push(`- **2026-09-25 — ${id}: a title** prose.`);
  if (o.kind) lines.push(`  Kind: ${o.kind}`);
  if (o.disposition) lines.push(`  Disposition: ${o.disposition}`);
  if (o.reEntry) lines.push(`  Re-entry: ${o.reEntry}`);
  return lines.join('\n');
}

function file(o: { header?: string; decisions: string[]; mechanism?: string[] | null }): string {
  const parts: string[] = [];
  parts.push(o.header ?? '> **Status**: exploring.', '', '# Exploration: x', '', '## Premise', '', 'p', '');
  if (o.mechanism !== null) {
    parts.push('## Mechanism', '', '### The reframing', '', 'prose', '', '### Case 1 — evidence', '', 'more prose', '');
    for (const m of o.mechanism ?? []) parts.push(m, '');
  }
  parts.push('## Decisions', '');
  for (const d of o.decisions) parts.push(d, '');
  parts.push('## Open questions', '', '(None.)', '', '## Considered & out', '', '## References', '');
  return parts.join('\n');
}

/** 1-based line number of the first line containing `needle`. */
function lineOf(content: string, needle: string): number {
  const i = content.split('\n').findIndex((l) => l.includes(needle));
  if (i < 0) throw new Error(`no line contains ${needle}`);
  return i + 1;
}

// ---------------------------------------------------------------------------
// The five states, the two defect kinds, the join
// ---------------------------------------------------------------------------

describe('parseExploreRules — states', () => {
  it('a live rule with no Mechanism entry is `absent` (id only)', () => {
    const r = parseExploreRules(file({ decisions: [dec('D-x-1', { kind: 'rule' })] }));
    expect(r.rules_total).toBe(1);
    expect(r.rules_open).toEqual([{ id: 'D-x-1', state: 'absent' }]);
    expect(r.key_defects).toEqual([]);
  });

  it('an entry without a Closure: line is `no-closure`', () => {
    const r = parseExploreRules(file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { closure: null })] }));
    expect(r.rules_open).toEqual([{ id: 'D-x-1', state: 'no-closure' }]);
  });

  it('DERIVED and SOURCED entries are accounted and carry no residual', () => {
    const r = parseExploreRules(
      file({ decisions: [dec('D-x-1'), dec('D-x-2')], mechanism: [mech('D-x-1', { closure: 'DERIVED' }), mech('D-x-2', { closure: 'SOURCED' })] })
    );
    expect(r.rules_total).toBe(2);
    expect(r.rules_open).toEqual([]);
    expect(r.residuals).toEqual([]);
    expect(r.key_defects).toEqual([]);
  });

  it('a complete BOUNDED entry is accounted and its residual is named with kind and method', () => {
    const r = parseExploreRules(
      file({
        decisions: [dec('D-x-1')],
        mechanism: [mech('D-x-1', { closure: 'BOUNDED', residualKind: 'what lies outside', residualMethod: 'how to find one' })],
      })
    );
    expect(r.rules_open).toEqual([]);
    expect(r.residuals).toEqual([{ id: 'D-x-1', kind: 'what lies outside', method: 'how to find one' }]);
  });

  it('BOUNDED missing a slot is `bounded-incomplete` — the specific state, never `malformed-entry`', () => {
    const missingMethod = parseExploreRules(
      file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { closure: 'BOUNDED', residualKind: 'k' })] })
    );
    expect(missingMethod.rules_open).toEqual([{ id: 'D-x-1', state: 'bounded-incomplete' }]);
    const emptyKind = parseExploreRules(
      file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { closure: 'BOUNDED', residualKind: '', residualMethod: 'm' })] })
    );
    expect(emptyKind.rules_open).toEqual([{ id: 'D-x-1', state: 'bounded-incomplete' }]);
    // Precedence: a BOUNDED entry missing a slot AND carrying a bad table is still bounded-incomplete.
    const both = parseExploreRules(
      file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { closure: 'BOUNDED', residualKind: 'k', table: ['| member | covered by |', '|---|---|'] })] })
    );
    expect(both.rules_open).toEqual([{ id: 'D-x-1', state: 'bounded-incomplete' }]);
    expect(both.residuals).toEqual([]);
  });

  it('MALFORMED on the rule\'s own entry is `malformed-entry` naming the line: bad table, missing move, duplicated move, unknown token, residual on a CLOSED entry', () => {
    const emptyTable = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { table: ['| member | covered by |', '|---|---|'] })] });
    expect(parseExploreRules(emptyTable).rules_open).toEqual([{ id: 'D-x-1', state: 'malformed-entry', line: lineOf(emptyTable, '| member | covered by |') }]);

    const threeCols = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { table: ['| member | covered by | extra |', '|---|---|---|', '| a | b | c |'] })] });
    expect(parseExploreRules(threeCols).rules_open[0]).toMatchObject({ id: 'D-x-1', state: 'malformed-entry', line: lineOf(threeCols, '| member | covered by | extra |') });

    const missingMove = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { moves: allMoves().slice(1) })] });
    expect(parseExploreRules(missingMove).rules_open).toEqual([{ id: 'D-x-1', state: 'malformed-entry', line: lineOf(missingMove, 'Moves:') }]);

    const dupMove = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { moves: [...allMoves(), '- READ: applied — again'] })] });
    expect(parseExploreRules(dupMove).rules_open).toEqual([{ id: 'D-x-1', state: 'malformed-entry', line: lineOf(dupMove, '- READ: applied — again') }]);

    const unknownToken = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { closure: 'CLOSED' })] });
    expect(parseExploreRules(unknownToken).rules_open).toEqual([{ id: 'D-x-1', state: 'malformed-entry', line: lineOf(unknownToken, 'Closure: CLOSED') }]);

    const residualOnClosed = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { closure: 'SOURCED', residualKind: 'k' })] });
    expect(parseExploreRules(residualOnClosed).rules_open).toEqual([{ id: 'D-x-1', state: 'malformed-entry', line: lineOf(residualOnClosed, 'Residual kind: k') }]);

    // A tenth bullet in the moves block that is not a move line names ITS line (the nine are all present).
    const badMoveLine = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { moves: [...allMoves(), '- INVOKE: maybe — unsure'] })] });
    expect(parseExploreRules(badMoveLine).rules_open[0]).toMatchObject({ id: 'D-x-1', state: 'malformed-entry', line: lineOf(badMoveLine, '- INVOKE: maybe') });
    // Eight moves plus a non-move bullet: two defects; the FIRST in line order (the Moves: line, naming the missing move) is the one named.
    const eightPlusBad = file({ decisions: [dec('D-x-1')], mechanism: [mech('D-x-1', { moves: [...allMoves().slice(0, 8), '- INVOKE: maybe — unsure'] })] });
    expect(parseExploreRules(eightPlusBad).rules_open[0]).toMatchObject({ id: 'D-x-1', state: 'malformed-entry', line: lineOf(eightPlusBad, 'Moves:') });
  });

  it('a prefix-less entry is `open`, named by line, with no id, and counts in rules_total', () => {
    const c = file({ decisions: [dec('D-x-1', { opener: '- **Decision:** we will do the thing.' })] });
    const r = parseExploreRules(c);
    expect(r.rules_total).toBe(1);
    expect(r.rules_open).toEqual([{ state: 'open', line: lineOf(c, '- **Decision:**') }]);
    expect(r.rules_open[0]).not.toHaveProperty('id');
  });

  it('a WRAPPED opener whose closing ** falls on the second line is well-formed, counted and joined', () => {
    const r = parseExploreRules(file({ decisions: [dec('D-x-7', { wrap: true })], mechanism: [mech('D-x-7')] }));
    expect(r.rules_total).toBe(1);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([]);
  });

  it('a duplicate Decisions ID: the first owns the key and joins its entry; the second is a key defect by line, excluded from rules_total', () => {
    const c = file({ decisions: [dec('D-x-2'), dec('D-x-3'), dec('D-x-2', { opener: '- **2026-09-26 — D-x-2: the repeat** prose.' })], mechanism: [mech('D-x-2'), mech('D-x-3')] });
    const r = parseExploreRules(c);
    expect(r.rules_total).toBe(2);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([{ id: 'D-x-2', kind: 'duplicate', line: lineOf(c, 'D-x-2: the repeat') }]);
  });
});

describe('parseExploreRules — the five isolated cases (two disjoint arrays)', () => {
  it('a malformed unique live rule is in rules_open as malformed-entry; key_defects is empty', () => {
    const c = file({ decisions: [dec('D-foo-2')], mechanism: [mech('D-foo-2', { table: ['| member | covered by |', '|---|---|'] })] });
    const r = parseExploreRules(c);
    expect(r.rules_open).toEqual([{ id: 'D-foo-2', state: 'malformed-entry', line: lineOf(c, '| member | covered by |') }]);
    expect(r.key_defects).toEqual([]);
  });

  it('an orphan alone is a key defect; rules_open is empty', () => {
    const c = file({ decisions: [dec('D-foo-1')], mechanism: [mech('D-foo-1'), mech('D-foo-9')] });
    const r = parseExploreRules(c);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([{ id: 'D-foo-9', kind: 'orphan', line: lineOf(c, '### D-foo-9') }]);
  });

  it('a duplicate Decisions ID alone is a key defect', () => {
    const c = file({ decisions: [dec('D-foo-2'), dec('D-foo-2', { opener: '- **2026-09-26 — D-foo-2: again** prose.' })], mechanism: [mech('D-foo-2')] });
    const r = parseExploreRules(c);
    expect(r.rules_total).toBe(1);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([{ id: 'D-foo-2', kind: 'duplicate', line: lineOf(c, 'D-foo-2: again') }]);
  });

  it('a duplicate Mechanism heading: the first heading is judged as the rule\'s entry; the second is a duplicate key defect', () => {
    const c = file({ decisions: [dec('D-foo-5')], mechanism: [mech('D-foo-5', { closure: 'SOURCED' }), mech('D-foo-5', { closure: null, title: 'the second' })] });
    const r = parseExploreRules(c);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([{ id: 'D-foo-5', kind: 'duplicate', line: lineOf(c, '### D-foo-5 — the second') }]);
  });

  it('BOUNDED missing a slot is bounded-incomplete, in rules_open, with no key defect', () => {
    const r = parseExploreRules(file({ decisions: [dec('D-foo-3')], mechanism: [mech('D-foo-3', { closure: 'BOUNDED', residualKind: 'k' })] }));
    expect(r.rules_open).toEqual([{ id: 'D-foo-3', state: 'bounded-incomplete' }]);
    expect(r.key_defects).toEqual([]);
  });
});

describe('parseExploreRules — the spec\'s six-entry scenario', () => {
  it('four rules (SOURCED, complete BOUNDED, BOUNDED missing method, no entry), a fact, a scope, and an orphan', () => {
    const c = file({
      decisions: [
        dec('D-foo-1'),
        dec('D-foo-2', { kind: 'rule' }),
        dec('D-foo-3'),
        dec('D-foo-4'),
        dec('D-foo-5', { kind: 'fact' }),
        dec('D-foo-6', { kind: 'scope' }),
      ],
      mechanism: [
        mech('D-foo-1', { closure: 'SOURCED' }),
        mech('D-foo-2', { closure: 'BOUNDED', residualKind: 'a kind', residualMethod: 'a method' }),
        mech('D-foo-3', { closure: 'BOUNDED', residualKind: 'a kind' }),
        mech('D-foo-9'),
      ],
    });
    const r = parseExploreRules(c);
    expect(r.rules_total).toBe(4);
    expect(r.rules_open).toEqual([
      { id: 'D-foo-3', state: 'bounded-incomplete' },
      { id: 'D-foo-4', state: 'absent' },
    ]);
    expect(r.key_defects).toEqual([{ id: 'D-foo-9', kind: 'orphan', line: lineOf(c, '### D-foo-9') }]);
    expect(r.residuals).toEqual([{ id: 'D-foo-2', kind: 'a kind', method: 'a method' }]);
    expect(r.status).toEqual({ token: 'exploring' });
  });
});

describe('parseExploreRules — fences, slots, dispositions', () => {
  it('a four-backtick fence enclosing a three-backtick decoy, and an over-indented fence: neither is structure; the entry after the real closer counts', () => {
    // The four-backtick fence hides the decoy D-x-8 (its inner three-backtick line does NOT close
    // it — a local scanner keyed on the fence character would have closed there and counted the
    // decoy); the entry after the real closer (D-x-2) counts. The over-indented line (four spaces
    // before the backticks) is NOT a fence opener under CommonMark, so it hides nothing: D-x-3
    // after it counts too (a local scanner accepting any indent would have swallowed it).
    const decisions = [
      dec('D-x-1'),
      ['````markdown', '```', '- **2026-01-01 — D-x-8: decoy**', '  Kind: rule', '```', '````'].join('\n'),
      dec('D-x-2'),
      '    ```',
      dec('D-x-3'),
    ];
    const c = file({ decisions, mechanism: [mech('D-x-1'), mech('D-x-2'), mech('D-x-3')] });
    const r = parseExploreRules(c);
    expect(countExplore(c).decisionsCaptured).toBe(3);
    expect(r.rules_total).toBe(3);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([]);
  });

  it('a fenced decoy entry never counts, and a fenced Mechanism lookalike is neither entry nor orphan', () => {
    const c = file({
      decisions: [dec('D-x-1'), '```\n- **2026-01-01 — D-x-8: decoy**\n```'],
      mechanism: [mech('D-x-1'), '```\n### D-x-9 — fenced lookalike\n```'],
    });
    const r = parseExploreRules(c);
    expect(r.rules_total).toBe(1);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([]);
  });

  it('`Kind: banana` is no match: the slot is absent and the entry defaults to rule', () => {
    const r = parseExploreRules(file({ decisions: [dec('D-x-1', { kind: 'banana' })] }));
    expect(r.rules_total).toBe(1);
    expect(r.rules_open).toEqual([{ id: 'D-x-1', state: 'absent' }]);
  });

  it('each out-of-domain entry is OUT of the obligation, and its permitted history entry is never an orphan', () => {
    const c = file({
      decisions: [
        dec('D-x-1', { kind: 'fact' }),
        dec('D-x-2', { kind: 'scope' }),
        dec('D-x-3', { disposition: 'superseded D-x-4' }),
        dec('D-x-4', { disposition: 'assigned rc15-ended-stage-state' }),
        dec('D-x-5', { kind: 'rule', disposition: 'live' }),
      ],
      mechanism: [mech('D-x-1'), mech('D-x-2'), mech('D-x-3'), mech('D-x-4'), mech('D-x-5')],
    });
    const r = parseExploreRules(c);
    expect(r.rules_total).toBe(1);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([]);
    // A nested-bullet slot form is admitted by the optional bullet prefix.
    const nested = parseExploreRules(file({ decisions: ['- **2026-09-25 — D-x-6: t** p.\n  - Kind: fact'] }));
    expect(nested.rules_total).toBe(0);
    // An unknown Disposition value is no match: live by default, so still in the obligation.
    const unknownDisp = parseExploreRules(file({ decisions: [dec('D-x-7', { disposition: 'retired' })] }));
    expect(unknownDisp.rules_open).toEqual([{ id: 'D-x-7', state: 'absent' }]);
  });

  it('rules_open follows Decisions file order; key_defects follows line order', () => {
    const c = file({
      decisions: [dec('D-x-3'), dec('D-x-1'), dec('D-x-2'), dec('D-x-1', { opener: '- **2026-09-26 — D-x-1: dup** p.' })],
      mechanism: [mech('D-x-9'), mech('D-x-2', { closure: null })],
    });
    const r = parseExploreRules(c);
    expect(r.rules_open.map((e) => e.id)).toEqual(['D-x-3', 'D-x-1', 'D-x-2']);
    expect(r.rules_open.map((e) => e.state)).toEqual(['absent', 'absent', 'no-closure']);
    // The orphan heading (Mechanism precedes Decisions in the file) sorts before the duplicate.
    expect(r.key_defects.map((k) => `${k.kind}:${k.id}`)).toEqual(['orphan:D-x-9', 'duplicate:D-x-1']);
    expect(r.key_defects[0].line).toBeLessThan(r.key_defects[1].line);
  });
});

describe('parseExploreRules — sections, files, the header', () => {
  it('a missing file yields zeros, status exploring, and no notes', () => {
    const r = parseExploreRulesFile(path.join(repo, 'no', 'such', 'explore.md'));
    expect(r).toEqual({ rules_total: 0, rules_open: [], key_defects: [], residuals: [], status: { token: 'exploring' }, notes: [] });
  });

  it('no ## Mechanism section: every live rule is absent, key_defects empty, ONE note names the section', () => {
    const r = parseExploreRules(file({ decisions: [dec('D-x-1'), dec('D-x-2'), dec('D-x-3', { kind: 'fact' })], mechanism: null }));
    expect(r.rules_open).toEqual([
      { id: 'D-x-1', state: 'absent' },
      { id: 'D-x-2', state: 'absent' },
    ]);
    expect(r.key_defects).toEqual([]);
    expect(r.notes).toHaveLength(1);
    expect(r.notes[0]).toContain("no '## Mechanism' section");
  });

  it('concluded header with ONE live Re-entry: slot → status carries token, date and re_entry', () => {
    const r = parseExploreRules(
      file({
        header: '> **Status**: concluded 2026-09-25.',
        decisions: [dec('D-x-1'), dec('D-x-2', { kind: 'scope', reEntry: 'a third withdrawn stage' })],
        mechanism: [mech('D-x-1')],
      })
    );
    expect(r.status).toEqual({ token: 'concluded', date: '2026-09-25', re_entry: 'a third withdrawn stage' });
    expect(r.notes).toEqual([]);
  });

  it('concluded header with NO live Re-entry: slot → re_entry ABSENT (a superseded carrier does not count)', () => {
    const r = parseExploreRules(
      file({
        header: '> **Status**: concluded 2026-09-25.',
        decisions: [dec('D-x-1', { kind: 'scope', reEntry: 'old trigger', disposition: 'superseded D-x-2' }), dec('D-x-2', { kind: 'scope' })],
      })
    );
    expect(r.status).toEqual({ token: 'concluded', date: '2026-09-25' });
    expect(r.status).not.toHaveProperty('re_entry');
  });

  it('concluded header with TWO live Re-entry: slots → the first in file order wins; a note names the second\'s line', () => {
    const c = file({
      header: '> **Status**: concluded 2026-09-25.',
      decisions: [dec('D-x-1', { kind: 'scope', reEntry: 'first trigger' }), dec('D-x-2', { kind: 'scope', reEntry: 'second trigger' })],
    });
    const r = parseExploreRules(c);
    expect(r.status.re_entry).toBe('first trigger');
    expect(r.notes).toHaveLength(1);
    expect(r.notes[0]).toContain(`line ${lineOf(c, 'D-x-2: a title')}`);
  });

  it('a first line matching neither token reads exploring, as does the exploring token with trailing prose', () => {
    expect(parseExploreRules(file({ header: '# Exploration with no status line', decisions: [] })).status).toEqual({ token: 'exploring' });
    expect(parseExploreRules(file({ header: '> **Status**: concluded 2026-09-25', decisions: [] })).status).toEqual({ token: 'exploring' });
    expect(parseExploreRules(file({ header: '> **Status**: exploring. Promoted via /orbit:propose.', decisions: [] })).status).toEqual({ token: 'exploring' });
  });
});

// ---------------------------------------------------------------------------
// Fixtures: the body's two exemplars, and the archived exploration (task 2.3)
// ---------------------------------------------------------------------------

describe('parseExploreRules — the shipped exemplars', () => {
  it('the explore body\'s two exemplars parse to accounted: D-bcs-3 SOURCED, D-bcs-12 BOUNDED with both slots', () => {
    const skill = getExploreSkillTemplate().instructions;
    const start = skill.indexOf('```markdown\n### D-bcs-3 — ');
    expect(start).toBeGreaterThan(-1);
    const end = skill.indexOf('\n```', start + 12);
    const block = skill.slice(start + '```markdown\n'.length, end);
    const c = file({ decisions: [dec('D-bcs-3'), dec('D-bcs-12')], mechanism: [block] });
    const r = parseExploreRules(c);
    expect(r.rules_total).toBe(2);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([]);
    expect(r.residuals).toHaveLength(1);
    expect(r.residuals[0].id).toBe('D-bcs-12');
    expect(r.residuals[0].kind.length).toBeGreaterThan(0);
    expect(r.residuals[0].method.length).toBeGreaterThan(0);
  });

  it('the archived bounded-closure-semantics exploration: 12 decisions, 9 live rules, 9 accounted, 0 malformed, 1 residual — three wrapped openers well-formed', () => {
    const p = path.join(repo, 'orbit', 'changes', 'archive', '2026-09-25-bounded-closure-semantics', 'explore.md');
    const content = fs.readFileSync(p, 'utf-8');
    expect(countExplore(content).decisionsCaptured).toBe(12);
    const r = parseExploreRulesFile(p);
    expect(r.rules_total).toBe(9);
    expect(r.rules_open).toEqual([]);
    expect(r.key_defects).toEqual([]);
    expect(r.residuals).toHaveLength(1);
    expect(r.residuals[0].id).toBe('D-bcs-12');
    expect(r.status).toEqual({ token: 'exploring' });
    expect(r.notes).toEqual([]);
    // D-bcs-8, D-bcs-9 and D-bcs-11 wrap their bold title onto a second line: the FIRST-LINE
    // PREFIX rule reads their IDs (the rules among them joined their entries above — absent
    // from rules_open — and the scope entry's ID is read from its first line).
    const lines = content.split('\n');
    for (const id of ['D-bcs-8', 'D-bcs-9', 'D-bcs-11']) {
      const first = lines.find((l) => l.startsWith(`- **2026-09-25 — ${id}: `))!;
      expect(first, id).toBeDefined();
      expect(first.includes('**', 4)).toBe(false); // the closing ** is NOT on the first line
      expect(first.match(DECISION_OPENER_PREFIX)?.[2]).toBe(id);
    }
  });
});

describe('parseExploreRules — notes are not stderr writes', () => {
  it('the parser returns notes and never writes to stderr itself (the emit surface surfaces them)', () => {
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      parseExploreRules(file({ decisions: [dec('D-x-1')], mechanism: null }));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
