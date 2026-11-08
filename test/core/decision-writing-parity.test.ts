/**
 * decision-writing (`orbit-conventions`' `Decision-writing discipline` and `Decision-record reference
 * ships beside the statement`): the fifth execution discipline is OWNED by the fence in the spec and
 * carried in code by `src/core/disciplines.ts`, composed from the write gate's own lists. This test
 * is the seam between them, and between the module and every generated workflow body.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
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

const FIRST_LINE = '- **Decision-writing (call-time)**';
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
  const bullets = ep.filter(l => l.startsWith('- '));
  const nc = bullets.findIndex(l => l.startsWith('- **No-chaining'));
  if (nc < 0) return 'no no-chaining bullet';
  if (bullets[nc + 1] !== statement) return 'the bullet after no-chaining is not the statement';
  return null;
}

/** The field names a reference's record section lists, in order. */
function sectionOf(ref: string, command: DecisionCommand): string {
  const start = ref.indexOf(`(\`orbit emit ${command}\`)`);
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
  it('the module string equals the owning fence', async () => {
    const owner = await ownerText('orbit-conventions', '```\n' + FIRST_LINE);
    expect(DECISION_WRITING_DISCIPLINE, 'decision-writing statement diverged from its owner').toBe(
      fencedProduction(owner, FIRST_LINE)
    );
  });

  // @scenario text orbit-conventions :: Decision-writing discipline :: The statement is composed from the write gate's lists
  it('names every payload condition and every ledger area, in the lists\' order, and not tripwire', () => {
    expect(inOrder(conditionList(DECISION_WRITING_DISCIPLINE), PAYLOAD_STOP_CONDITIONS)).toBeNull();
    expect(inOrder(DECISION_WRITING_DISCIPLINE, LEDGER_AREAS)).toBeNull();
    expect(DECISION_WRITING_DISCIPLINE).not.toContain('tripwire');
  });

  it('mutation: each check fails on a clean mutation', async () => {
    const owner = await ownerText('orbit-conventions', '```\n' + FIRST_LINE);
    const fence = fencedProduction(owner, FIRST_LINE);
    expect(DECISION_WRITING_DISCIPLINE.replace('call-time', 'call time')).not.toBe(fence);
    // A dropped area, and two swapped conditions, are each caught by the order check.
    expect(inOrder(DECISION_WRITING_DISCIPLINE.replace('`licensing`, ', ''), LEDGER_AREAS)).toBe('licensing');
    const swapped = DECISION_WRITING_DISCIPLINE.replace('`ruling-amendment`', '`@@`').replace('`outward-act`', '`ruling-amendment`').replace('`@@`', '`outward-act`');
    expect(inOrder(conditionList(swapped), PAYLOAD_STOP_CONDITIONS)).not.toBeNull();
    expect(DECISION_WRITING_DISCIPLINE.replace('`outward-act`', '`tripwire`')).toContain('tripwire');
  });
});

describe('every epitome-carrying workflow body carries the statement', () => {
  const skills = getSkillTemplates();
  const carriers = skills.filter(s => s.template.instructions.includes(EPITOME));

  it('fourteen bodies carry an epitome; onboard is the one that does not', () => {
    expect(carriers.length).toBe(14);
    expect(skills.filter(s => !carriers.includes(s)).map(s => s.dirName)).toEqual(['orbit-onboard']);
  });

  for (const s of carriers) {
    // @scenario text orbit-conventions :: Decision-writing discipline :: Every workflow body carries the statement
    it(`${s.dirName}: exactly once, as the bullet after no-chaining`, () => {
      expect(carryFailure(s.template.instructions, DECISION_WRITING_DISCIPLINE)).toBeNull();
    });
  }

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
    expect(epitomeFailure(body.replace(DECISION_WRITING_DISCIPLINE, DECISION_WRITING_DISCIPLINE + '\n- **Extra**: x'))).toMatch(/bullets are/);
  });

  it('mutation: a duplicated statement, a moved one and a missing one each fail', () => {
    const body = carriers[0].template.instructions;
    expect(carryFailure(body + '\n' + DECISION_WRITING_DISCIPLINE, DECISION_WRITING_DISCIPLINE)).toMatch(/2 times/);
    expect(carryFailure(body.replace(DECISION_WRITING_DISCIPLINE, ''), DECISION_WRITING_DISCIPLINE)).toMatch(/0 times/);
    const lines = body.split('\n');
    const i = lines.indexOf(DECISION_WRITING_DISCIPLINE);
    const nc = lines.findIndex((l, k) => k < i && l.startsWith('- **No-chaining'));
    const moved = [...lines];
    moved.splice(i, 1);
    moved.splice(nc, 0, DECISION_WRITING_DISCIPLINE);
    expect(carryFailure(moved.join('\n'), DECISION_WRITING_DISCIPLINE)).toMatch(/after no-chaining/);
  });

  // @scenario text orbit-conventions :: Decision-record reference ships beside the statement :: Every statement-carrying skill ships the reference
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
