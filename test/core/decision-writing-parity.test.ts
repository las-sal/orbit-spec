/**
 * decision-writing (`orbit-conventions`' `Decision-writing discipline` and `Decision-record reference
 * ships beside the statement`): the fifth execution discipline is OWNED by two fences in the spec — the
 * rule and its basic content (`records-by-setting`) — and carried in code by `src/core/disciplines.ts`,
 * the rule composed from the write gate's own lists. This test is the seam between them, between the basic
 * content and every generated workflow body, and between the rule and the reference that carries it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  DECISION_WRITING_BASIC,
  DECISION_WRITING_DISCIPLINE,
  DECISION_RECORDS_REFERENCE,
  DECISION_RECORD_EXAMPLES,
  REFERENCE_RECORD_ORDER,
} from '../../src/core/disciplines.js';
import {
  CITATION_SHAPES,
  DECISION_COMMANDS,
  DECISION_PAYLOAD_FIELDS,
  LEDGER_AREAS,
  PAYLOAD_STOP_CONDITIONS,
  PLAIN_FIELDS,
  READER_BOUND_FIELDS,
  type DecisionCommand,
} from '../../src/core/decision-records.js';
import { composeAndWriteEmit } from '../../src/core/emit-composition.js';
import { getSkillTemplates } from '../../src/core/shared/skill-generation.js';
import { ownerText, fencedProduction } from '../helpers/owner-text.js';
import { REFERENCES } from '../helpers/schema-references.js';
import { decisionStatus } from '../../src/core/decision-status.js';

const FIRST_LINE = '- **Decision-writing (call-time)**';
/**
 * The two fences share the label, and `fencedProduction` returns the first fence it finds, so each is found by a
 * prefix longer than the label: the rule's continues "when `orbit decisions status`", the basic content's "at each
 * command's first step".
 */
const RULE_PREFIX = FIRST_LINE + ': when `orbit decisions status`';
const BASIC_PREFIX = FIRST_LINE + ": at each command's first step";
const RULE_HEADING = '## When to write a record';
const REF_NAME = 'decision-records.md';
const EPITOME = '## Execution disciplines (epitome)';

// ---------------------------------------------------------------------------
// Pure checks, exported in shape so the mutation cases below run the SAME predicates.
// ---------------------------------------------------------------------------

/** The ids in the order they first appear in `text`, or the first id missing. */
function inOrder(text: string, ids: readonly string[]): string | null {
  let at = -1;
  for (const id of ids) {
    const i = text.indexOf(`\`${id}\``, at + 1);
    if (i < 0 || i < at) return id;
    at = i;
  }
  return null;
}

/** The body's epitome lines: from the heading up to the next `## ` heading. */
function epitomeLines(body: string): string[] | null {
  const lines = body.split('\n');
  const h = lines.indexOf(EPITOME);
  if (h < 0) return null;
  const out: string[] = [];
  for (let i = h + 1; i < lines.length && !lines[i].startsWith('## '); i++) out.push(lines[i]);
  return out;
}

/** Why a body fails the carry rule, or null: the statement exactly once, as the bullet after no-chaining. */
function carryFailure(body: string, statement: string): string | null {
  const count = body.split(statement).length - 1;
  if (count !== 1) return `the statement appears ${count} times`;
  const ep = epitomeLines(body);
  if (ep === null) return 'no epitome heading';
  const nc = ep.findIndex(l => l.startsWith('- **No-chaining'));
  if (nc < 0) return 'no no-chaining bullet';
  const next = ep.findIndex((l, k) => k > nc && l.startsWith('- '));
  const lines = statement.split('\n');
  if (next < 0 || ep.slice(next, next + lines.length).join('\n') !== statement) {
    return 'the bullet after no-chaining is not the statement';
  }
  return null;
}

/** The field names a reference's record section lists, in order. */
function sectionOf(ref: string, command: DecisionCommand): string {
  // The section's heading line, not the contents list's entry naming it (tighten-bodies).
  const at = ref.search(new RegExp(`\\n## [^\\n]*\\(\`orbit emit ${command}\`\\)`));
  const start = at < 0 ? -1 : at + 1;
  if (start < 0) return '';
  const next = ref.indexOf('\n## ', start);
  return ref.slice(start, next < 0 ? undefined : next);
}

function listedFields(section: string): string[] {
  const fieldsAt = section.indexOf('Fields:');
  if (fieldsAt < 0) return [];
  const lines = section.slice(fieldsAt).split('\n').slice(1);
  const out: string[] = [];
  let started = false;
  for (const l of lines) {
    const m = l.match(/^- `([a-z_]+)` — /);
    if (m) {
      out.push(m[1]);
      started = true;
    } else if (started) break;
  }
  return out;
}

function exampleOf(section: string): Record<string, unknown> | null {
  const m = section.match(/\n```json\n([\s\S]*?)\n```/);
  return m ? (JSON.parse(m[1]) as Record<string, unknown>) : null;
}

/** Why a reference fails the field rule for a command, or null. */
function fieldFailure(ref: string, command: DecisionCommand): string | null {
  const section = sectionOf(ref, command);
  if (section === '') return `no ${command} section`;
  const listed = listedFields(section);
  if (JSON.stringify(listed) !== JSON.stringify(DECISION_PAYLOAD_FIELDS[command])) {
    return `${command} lists ${JSON.stringify(listed)}`;
  }
  const example = exampleOf(section);
  if (example === null) return `${command} carries no json example`;
  const allowed = new Set([...DECISION_PAYLOAD_FIELDS[command], 'model']);
  const extra = Object.keys(example).filter(k => !allowed.has(k));
  if (extra.length > 0) return `${command} example carries ${extra.join(', ')}`;
  return null;
}

function citationFailure(ref: string): string | null {
  const ledger = sectionOf(ref, 'ledger');
  for (const kind of Object.keys(CITATION_SHAPES)) {
    if (!ledger.includes(`- \`${kind}\` — written `)) return `citation kind ${kind} is not named`;
  }
  return null;
}

/** The statement's condition list: between its BEFORE clause's opening dash and `write a stop record`. */
function conditionList(statement: string): string {
  const start = statement.indexOf('a stop condition describes — ');
  const end = statement.indexOf(' — write a stop record', start);
  return start < 0 || end < 0 ? '' : statement.slice(start, end);
}

// ---------------------------------------------------------------------------

describe('decision-writing statement ↔ owning fence', () => {
  // @scenario text orbit-conventions :: Decision-writing discipline :: The statement is composed from the write gate's lists
  it('the module\'s rule equals the rule fence', async () => {
    const owner = await ownerText('orbit-conventions', '```\n' + FIRST_LINE);
    expect(DECISION_WRITING_DISCIPLINE, 'decision-writing rule diverged from its owner').toBe(fencedProduction(owner, RULE_PREFIX));
  });

  // @scenario text orbit-conventions :: Decision-writing discipline :: Every workflow body carries the basic content
  it('the module\'s basic content equals the basic-content fence', async () => {
    const owner = await ownerText('orbit-conventions', '```\n' + FIRST_LINE);
    expect(DECISION_WRITING_BASIC, 'decision-writing basic content diverged from its owner').toBe(fencedProduction(owner, BASIC_PREFIX));
    // Mutation: the shared label alone finds the basic content's fence first, which is not the rule.
    expect(fencedProduction(owner, FIRST_LINE)).toBe(DECISION_WRITING_BASIC);
    expect(fencedProduction(owner, FIRST_LINE)).not.toBe(DECISION_WRITING_DISCIPLINE);
  });

  // @scenario text orbit-conventions :: Decision-writing discipline :: The statement is composed from the write gate's lists
  it('names every payload condition and every ledger area, in the lists\' order, and not tripwire', () => {
    expect(inOrder(conditionList(DECISION_WRITING_DISCIPLINE), PAYLOAD_STOP_CONDITIONS)).toBeNull();
    expect(inOrder(DECISION_WRITING_DISCIPLINE, LEDGER_AREAS)).toBeNull();
    expect(DECISION_WRITING_DISCIPLINE).not.toContain('tripwire');
  });

  it('mutation: each check fails on a clean mutation', async () => {
    const owner = await ownerText('orbit-conventions', '```\n' + FIRST_LINE);
    const fence = fencedProduction(owner, RULE_PREFIX);
    expect(DECISION_WRITING_BASIC.replace('first step', 'last step')).not.toBe(fencedProduction(owner, BASIC_PREFIX));
    expect(DECISION_WRITING_DISCIPLINE.replace('call-time', 'call time')).not.toBe(fence);
    // A dropped area, and two swapped conditions, are each caught by the order check.
    expect(inOrder(DECISION_WRITING_DISCIPLINE.replace('`licensing`, ', ''), LEDGER_AREAS)).toBe('licensing');
    const swapped = DECISION_WRITING_DISCIPLINE.replace('`ruling-amendment`', '`@@`').replace('`outward-act`', '`ruling-amendment`').replace('`@@`', '`outward-act`');
    expect(inOrder(conditionList(swapped), PAYLOAD_STOP_CONDITIONS)).not.toBeNull();
    expect(DECISION_WRITING_DISCIPLINE.replace('`outward-act`', '`tripwire`')).toContain('tripwire');
  });
});

describe('every epitome-carrying workflow body carries the basic content, and none the rule', () => {
  const skills = getSkillTemplates();
  const carriers = skills.filter(s => s.template.instructions.includes(EPITOME));

  it('fourteen bodies carry an epitome; onboard is the one that does not', () => {
    expect(carriers.length).toBe(14);
    expect(skills.filter(s => !carriers.includes(s)).map(s => s.dirName)).toEqual(['orbit-onboard']);
  });

  it('the rule is a label line and five labelled sub-bullets nested under it; the basic content is one line', () => {
    expect(DECISION_WRITING_BASIC.split('\n')).toHaveLength(1);
    expect(DECISION_WRITING_BASIC.startsWith(FIRST_LINE)).toBe(true);
    const lines = DECISION_WRITING_DISCIPLINE.split('\n');
    expect(lines[0].startsWith(FIRST_LINE)).toBe(true);
    expect(lines.slice(1).map(l => l.match(/^  - \*([^*]+)\*: /)?.[1] ?? l)).toEqual([
      'Before asking',
      'Acting without asking',
      'After a call',
      'Not a stop',
      'Where records go',
    ]);
  });

  /** The rule's lines a body must not carry: any one of them would mean the rule, or part of it, is back in a body. */
  const ruleLeak = (body: string): string | null => DECISION_WRITING_DISCIPLINE.split('\n').find(l => body.includes(l)) ?? null;

  for (const s of carriers) {
    // @scenario text orbit-conventions :: Decision-writing discipline :: Every workflow body carries the basic content
    it(`${s.dirName}: the basic content exactly once, as the bullet after no-chaining, and no line of the rule`, () => {
      expect(carryFailure(s.template.instructions, DECISION_WRITING_BASIC)).toBeNull();
      expect(ruleLeak(s.template.instructions)).toBeNull();
    });
  }

  it('mutation: a body carrying the rule, or one sub-bullet of it, is caught', () => {
    const body = carriers[0].template.instructions;
    expect(ruleLeak(body.replace(DECISION_WRITING_BASIC, DECISION_WRITING_DISCIPLINE))).not.toBeNull();
    expect(ruleLeak(body + '\n' + DECISION_WRITING_DISCIPLINE.split('\n')[3])).not.toBeNull();
  });

  // @scenario text orbit-conventions :: Decision-writing discipline :: The basic content names when the command runs
  it('the basic content names each command\'s first step and the session\'s config edit as the moments, and the result governs the command', () => {
    expect(DECISION_WRITING_BASIC).toContain("at each command's first step");
    expect(DECISION_WRITING_BASIC).toContain('again after this session edits the project config (`orbit/config.yaml` or `.yml`)');
    expect(DECISION_WRITING_BASIC).toContain('run `orbit decisions status --json`');
    expect(DECISION_WRITING_BASIC).toContain(`On \`write: true\`, read \`references/${REF_NAME}\` and follow its rule for the rest of the command.`);
  });

  // @scenario behaviour orbit-conventions :: Decision-writing discipline :: At the defaults the body directs no record
  it('at the defaults the command reports write: false, and the basic content says write: false writes no new ledger entry or stop', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-defaults-'));
    try {
      expect(decisionStatus(empty)).toEqual({ write: false, readers: [] });
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
    expect(DECISION_WRITING_BASIC).toContain('On `write: false`, write no new ledger entry or stop record;');
    // and an answer or a fix of a record already in the trail is still written
    expect(DECISION_WRITING_BASIC).toContain('a resolution answering a stop already in the trail, or a replacement fixing a record already there, is still written');
  });

  /** Why an epitome is not one bullet per discipline ending no-chaining, decision-writing, or null (review leads with pushback). */
  const DISCIPLINES = ['Read-before-reference', 'Change completeness', 'Pushback', 'No-chaining', 'Decision-writing'];
  const epitomeFailure = (body: string): string | null => {
    const ep = epitomeLines(body);
    if (ep === null) return 'no epitome';
    const names = ep.filter(l => l.startsWith('- **')).map(l => l.slice(4).split(' (')[0].split('**')[0]);
    const oneEach = JSON.stringify([...names].sort()) === JSON.stringify([...DISCIPLINES].sort());
    const tail = names.slice(-2).join(',') === 'No-chaining,Decision-writing';
    return oneEach && tail ? null : `epitome bullets are ${JSON.stringify(names)}`;
  };

  // @scenario text orbit-conventions :: No-chaining contract :: Epitome echo is a compliant echo
  it('every epitome is one bullet per discipline, ending no-chaining then decision-writing, and no body carries a pre-D5 full block', () => {
    for (const s of carriers) {
      expect(epitomeFailure(s.template.instructions), s.dirName).toBeNull();
      expect(s.template.instructions, s.dirName).not.toMatch(/^## (Four )?[Ee]xecution disciplines$/m);
    }
    // Mutation: a dropped bullet and an extra one each fail.
    const body = carriers[0].template.instructions;
    expect(epitomeFailure(body.replace(/\n- \*\*Pushback[^\n]*/, ''))).toMatch(/bullets are/);
    expect(epitomeFailure(body.replace(DECISION_WRITING_BASIC, DECISION_WRITING_BASIC + '\n- **Extra**: x'))).toMatch(/bullets are/);
  });

  it('mutation: a duplicated basic content, a moved one and a missing one each fail', () => {
    const body = carriers[0].template.instructions;
    expect(carryFailure(body + '\n' + DECISION_WRITING_BASIC, DECISION_WRITING_BASIC)).toMatch(/2 times/);
    expect(carryFailure(body.replace(DECISION_WRITING_BASIC, ''), DECISION_WRITING_BASIC)).toMatch(/0 times/);
    const lines = body.split('\n');
    const i = lines.indexOf(DECISION_WRITING_BASIC);
    const nc = lines.findIndex((l, k) => k < i && l.startsWith('- **No-chaining'));
    const moved = [...lines];
    moved.splice(i, 1);
    moved.splice(nc, 0, DECISION_WRITING_BASIC);
    expect(carryFailure(moved.join('\n'), DECISION_WRITING_BASIC)).toMatch(/after no-chaining/);
    // A clause dropped from one body's copy is caught too.
    const short = body.replace(' — read that reference when you write one', '');
    expect(carryFailure(short, DECISION_WRITING_BASIC)).toMatch(/0 times/);
  });

  // @scenario text orbit-conventions :: Decision-record reference ships beside the statement :: Every skill carrying the basic content ships the reference
  it('every carrier ships references/decision-records.md byte-equal, and no other skill ships it', () => {
    for (const s of skills) {
      const refs = (s.template.references ?? []).filter(r => r.name === REF_NAME);
      if (carriers.includes(s)) {
        expect(refs.length, s.dirName).toBe(1);
        expect(refs[0].content, s.dirName).toBe(DECISION_RECORDS_REFERENCE);
      } else {
        expect(refs.length, s.dirName).toBe(0);
      }
    }
  });
});

describe('the decision-record reference', () => {
  /** Why the reference fails to carry the rule whole in its first section, named first in its Contents, or null. */
  const ruleSectionFailure = (ref: string): string | null => {
    const contents = ref.indexOf('## Contents\n\n');
    if (contents < 0) return 'no Contents';
    const firstEntry = ref.slice(contents + '## Contents\n\n'.length).split('\n')[0];
    if (firstEntry !== '- When to write a record') return `the Contents list opens with ${JSON.stringify(firstEntry)}`;
    const sections = [...ref.matchAll(/^## (.*)$/gm)].map(m => m[1]).filter(h => h !== 'Contents');
    if (sections[0] !== 'When to write a record') return `the first section is ${JSON.stringify(sections[0])}`;
    const start = ref.indexOf(`\n${RULE_HEADING}\n\n`) + `\n${RULE_HEADING}\n\n`.length;
    const end = ref.indexOf('\n\n## ', start);
    if (ref.slice(start, end) !== DECISION_WRITING_DISCIPLINE) return 'the first section is not the rule, byte-equal';
    return null;
  };

  // @scenario text orbit-conventions :: Decision-record reference ships beside the statement :: The reference carries the rule whole
  it('its first section, When to write a record, carries the rule byte-equal, and the Contents list names it first', () => {
    expect(ruleSectionFailure(DECISION_RECORDS_REFERENCE)).toBeNull();
    // Mutation: a dropped sub-bullet, and a Contents list that no longer leads with the section, each fail.
    expect(ruleSectionFailure(DECISION_RECORDS_REFERENCE.replace(/\n  - \*Not a stop\*[^\n]*/, ''))).toMatch(/not the rule/);
    expect(ruleSectionFailure(DECISION_RECORDS_REFERENCE.replace('- When to write a record\n', ''))).toMatch(/Contents list opens/);
  });

  /** The reference's opening sentence: the paragraph after the Contents list. */
  const openingSentence = (ref: string): string => {
    const after = ref.slice(ref.indexOf('## Contents\n\n'));
    return after.split('\n\n')[2] ?? '';
  };

  // @scenario text orbit-conventions :: Decision-record reference ships beside the statement :: The reference lets an answer or a fix through at write: false
  it('its opening sentence says it is read for an answer or a fix too, which the rule section\'s write: true condition does not cover', () => {
    const opening = openingSentence(DECISION_RECORDS_REFERENCE);
    expect(opening.startsWith('Read this reference when `orbit decisions status` reports `write: true`')).toBe(true);
    expect(opening).toContain('or when you answer a stop already in the trail or fix a record already there');
    expect(opening).toContain('its first section says WHEN to write a record, and the rest WHAT each one holds');
    expect(opening).toContain("On `write: false` that section's `write: true` condition does not cover such an answer or fix, which follows the Resolution and Fixing a record sections.");
    // The sections it names exist.
    expect(DECISION_RECORDS_REFERENCE).toContain('\n## Fixing a record\n');
    expect(DECISION_RECORDS_REFERENCE).toMatch(/\n## Resolution \(/);
    // Mutation: the opening sentence as it read before records-by-setting fails.
    const old = DECISION_RECORDS_REFERENCE.replace(opening, 'The decision-writing discipline in this skill says WHEN to write a record; this reference says WHAT each one holds.');
    expect(openingSentence(old)).not.toContain('fix a record already there');
  });

  it('presents every record once', () => {
    expect([...REFERENCE_RECORD_ORDER].sort()).toEqual([...DECISION_COMMANDS].sort());
  });

  for (const command of DECISION_COMMANDS) {
    // @scenario text orbit-conventions :: Decision-record reference ships beside the statement :: The reference's fields are the write gate's
    it(`${command}: lists exactly DECISION_PAYLOAD_FIELDS, and its example carries no other field besides model`, () => {
      expect(fieldFailure(DECISION_RECORDS_REFERENCE, command)).toBeNull();
    });
  }

  // @scenario text orbit-conventions :: Decision-record reference ships beside the statement :: The reference's fields are the write gate's
  it('names every citation kind the write gate accepts', () => {
    expect(citationFailure(DECISION_RECORDS_REFERENCE)).toBeNull();
  });

  /** Why the reference's `decision` line fails to state both the live rule and the carried exception, or null. */
  const decisionLineFailure = (ref: string): string | null => {
    const line = ref.split('\n').find(l => l.startsWith('- `decision` — '));
    if (line === undefined) return 'no decision line';
    if (!line.includes('whose `Disposition:` is `live` or absent')) return 'the decision line drops the live rule';
    if (!line.includes('on a replacement, whose citation is carried, an entry with that ID whatever its `Disposition:`')) {
      return 'the decision line does not name the carried exception';
    }
    return null;
  };

  it("the decision line names the carried exception beside the live rule", () => {
    expect(decisionLineFailure(DECISION_RECORDS_REFERENCE)).toBeNull();
    // Mutation: the line as it read before the exception (CITATION_EXISTS.decision reverted) fails.
    const reverted = DECISION_RECORDS_REFERENCE.replace('; on a replacement, whose citation is carried, an entry with that ID whatever its `Disposition:`', '');
    expect(reverted).not.toBe(DECISION_RECORDS_REFERENCE);
    expect(decisionLineFailure(reverted)).toMatch(/carried exception/);
  });

  /** Why the reference's plain-language rule fails to name exactly the reader-bound fields, or null. */
  const plainRuleFailure = (ref: string): string | null => {
    const m = ref.match(/The plain fields — ([^\n]*?) — are written for a reader/);
    if (!m) return 'no plain-language rule';
    const named = [...m[1].matchAll(/`([a-z_]+)`/g)].map(x => x[1]);
    const want = DECISION_COMMANDS.flatMap(c => READER_BOUND_FIELDS[c]);
    return JSON.stringify(named) === JSON.stringify(want) ? null : `the rule names ${JSON.stringify(named)}`;
  };

  // @scenario text orbit-conventions :: Decision-record reference ships beside the statement :: The reference's fields are the write gate's
  it('the plain-language rule names every reader-bound field (alternatives among them), and the gate\'s list is a subset', () => {
    expect(plainRuleFailure(DECISION_RECORDS_REFERENCE)).toBeNull();
    expect(READER_BOUND_FIELDS.ledger).toContain('alternatives');
    for (const c of DECISION_COMMANDS) {
      for (const f of PLAIN_FIELDS[c]) expect(READER_BOUND_FIELDS[c], `${c}.${f}`).toContain(f);
    }
    // Mutation: the rule composed from the gate's scalar list alone (the shipped bug) fails.
    expect(plainRuleFailure(DECISION_RECORDS_REFERENCE.replace('`decided`, `alternatives`, `why`', '`decided`, `why`'))).toMatch(/names/);
  });

  it('carries no `json example` block and joins no schema-reference set', () => {
    expect(DECISION_RECORDS_REFERENCE).not.toContain('```json example');
    expect(REFERENCES.map(([command, , ref]) => `${command}:${ref}`)).toEqual([
      'review:run-summary-schema.md',
      'review-external:external-handoff.md',
      'address-reviews:run-summary-schema.md',
      'audit-drift:run-summary-schema.md',
      'archive:archive-summary-schema.md',
    ]);
    expect(REFERENCES.some(([, , ref]) => ref === REF_NAME)).toBe(false);
  });

  it('mutation: a missing field, an extra field, a stray example key and a dropped citation kind each fail', () => {
    const ref = DECISION_RECORDS_REFERENCE;
    expect(fieldFailure(ref.replace(/\n- `about` — [^\n]*/, ''), 'stop')).toMatch(/stop lists/);
    expect(fieldFailure(ref.replace('\n- `about` — ', '\n- `topic` — x\n- `about` — '), 'stop')).toMatch(/stop lists/);
    expect(fieldFailure(ref.replace('"condition": "user-facing-uncovered",', '"condition": "user-facing-uncovered",\n  "kind": "stop",'), 'stop')).toMatch(
      /example carries kind/
    );
    expect(citationFailure(ref.replace(/\n- `goal` — written [^\n]*/, ''))).toMatch(/goal/);
  });
});

describe('each example payload passes the write gate', () => {
  let root: string;
  const CHANGE = 'add-export';
  const write = (rel: string, content: string): void => {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-writing-'));
    write(`orbit/changes/${CHANGE}/proposal.md`, '# Proposal\n\n## Why\nw\n');
    write(`orbit/changes/${CHANGE}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [ ] 1.1 do a thing\n');
    write(`orbit/changes/${CHANGE}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 5\n');
    // What the examples cite: the requirement the ledger example relies on, and the stop the resolution names.
    write('orbit/specs/export/spec.md', '# export\n\n## Purpose\np\n\n## Requirements\n\n### Requirement: Exports are kept for a month\n\nThe system SHALL keep exports.\n');
    write(
      `orbit/changes/${CHANGE}/.orbit-runs/decisions/${DECISION_RECORD_EXAMPLES.resolution.stop as string}`,
      JSON.stringify({ command: 'stop', timestamp: '2026-11-08T10:00:00Z', change: CHANGE, model: null, condition: 'user-facing-uncovered', about: 'a', question: 'q' }) + '\n'
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  for (const command of REFERENCE_RECORD_ORDER) {
    // @scenario behaviour orbit-conventions :: Decision-record reference ships beside the statement :: Each example passes the write gate
    it(`${command}: the reference's example, unchanged, is accepted by \`orbit emit ${command}\``, () => {
      const example = exampleOf(sectionOf(DECISION_RECORDS_REFERENCE, command));
      expect(example).not.toBeNull();
      const result = composeAndWriteEmit(command, { change: CHANGE }, example!, { projectRoot: root });
      expect(fs.existsSync(result.path)).toBe(true);
      const written = JSON.parse(fs.readFileSync(result.path, 'utf-8'));
      expect(written.command).toBe(command);
    });
  }

  it('mutation: the gate refuses an example whose citation names nothing', () => {
    const example = exampleOf(sectionOf(DECISION_RECORDS_REFERENCE, 'ledger'))!;
    const broken = { ...example, relies_on: [{ kind: 'requirement', capability: 'export', title: 'No such requirement' }] };
    expect(() => composeAndWriteEmit('ledger', { change: CHANGE }, broken, { projectRoot: root })).toThrow(/resolves to nothing/);
  });
});
