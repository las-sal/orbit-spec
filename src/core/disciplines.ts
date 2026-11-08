import {
  CITATION_SHAPES,
  DECISION_COMMANDS,
  DECISION_PAYLOAD_FIELDS,
  LEDGER_AREAS,
  LEDGER_STOP_CONDITIONS,
  PAYLOAD_STOP_CONDITIONS,
  PLAIN_FIELDS,
  STOP_CONDITIONS,
  type DecisionCommand,
} from './decision-records.js';

/**
 * The fifth execution discipline, DECISION-WRITING (stage `decision-writing` of `automate-dev-flow`),
 * and the shared reference that says what a decision record holds.
 *
 * The OWNER of the statement is the fence in `orbit-conventions`' `Decision-writing discipline`;
 * this module composes it from the write gate's own lists (`./decision-records.ts`), so an adopter's
 * generated skill names the stop conditions and ledger areas itself.
 * `test/core/decision-writing-parity.test.ts` holds the composed string equal to the fence.
 */

type PayloadStopCondition = Exclude<(typeof STOP_CONDITIONS)[number], 'tripwire'>;

/**
 * One gloss per stop condition a payload may raise, from `orbit-decision-records`' event table.
 * Keyed by the condition, so a new condition without a gloss fails to compile.
 */
const CONDITION_GLOSS: Record<PayloadStopCondition, string> = {
  'security-unprecedented': 'a security-relevant call with nothing approved to rely on',
  'user-facing-uncovered': 'an end-user-visible call no ratified goal covers',
  'ruling-amendment': 'amending a ratified ruling or goal',
  'outward-act': 'an outward or irreversible act the settings do not grant',
  'unresolvable-critical': 'a CRITICAL review finding no edit inside the change resolves',
};

const code = (s: string): string => `\`${s}\``;

/** The file name the reference ships under, beside every statement-carrying skill. */
export const DECISION_RECORDS_REFERENCE_NAME = 'decision-records.md';

const CONDITIONS = PAYLOAD_STOP_CONDITIONS.map(c => `${code(c)} (${CONDITION_GLOSS[c as PayloadStopCondition]})`).join(', ');
const AREAS = LEDGER_AREAS.map(code).join(', ');
const LEDGER_STOPS = LEDGER_STOP_CONDITIONS.map(code).join(' or ');

/** The epitome's fifth bullet, carried byte-equal by every workflow body that has an epitome. */
export const DECISION_WRITING_DISCIPLINE =
  `- **Decision-writing (call-time)**: under every setting, keep a record of each call and each stop without changing what the user sees or is asked. ` +
  `BEFORE asking the user a question that a stop condition describes — ${CONDITIONS} — write a stop record (\`orbit emit stop\`), then ask exactly as you would have; ` +
  `with the user's answer, write a resolution naming that stop (\`orbit emit resolution\`); ` +
  `AFTER any call that falls in a ledger area — made without asking, or made with the user's answer to a stop — ${AREAS} — write a ledger entry (\`orbit emit ledger\`) citing what it relies on; ` +
  `when nothing approved covers the call, the entry names its stop (${LEDGER_STOPS}): the one you asked at, or, where you would not have asked, one you write first — ask nothing and leave that stop open. ` +
  `A designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — is a seam, not a stop, and writes nothing, unless a stop condition also describes it: then write the stop record first and fire the prompt as designed. ` +
  `A question no condition describes writes nothing, nor does a call in no area. ` +
  `A record names the work it belongs to (\`--change <name>\` for a change or a named exploration, or \`--doc <doc>\` in an architect session); in a session with neither (a project-wide run, an unnamed exploration) write no record, never attaching it to other work. ` +
  `What each record carries — its fields, its citations and the plain-language rule, with an example of each — is in \`references/${DECISION_RECORDS_REFERENCE_NAME}\`, beside this skill; a refused record names the field to fix.`;

// ---------------------------------------------------------------------------
// The shared reference (`orbit-conventions`' `Decision-record reference ships beside the statement`)
// ---------------------------------------------------------------------------

/** The order the reference presents the records in: the order the statement names them. */
export const REFERENCE_RECORD_ORDER: readonly DecisionCommand[] = ['stop', 'resolution', 'ledger'];

const RECORD_TITLE: Record<DecisionCommand, string> = {
  stop: 'Stop record',
  resolution: 'Resolution',
  ledger: 'Ledger entry',
};

const DEFINES_FORM = 'optional; an array of `{term, definition}` objects, both non-blank, each term once — every term a plain field uses that the architecture doc does not';
const DETAIL_FORM = 'optional; a string, not bound by the plain-language rule — implementation detail may go here, never as the only statement of what was decided';

/** The form the write gate accepts for each payload field, per record. */
const FIELD_FORM: Record<DecisionCommand, Record<string, string>> = {
  stop: {
    condition: `one of ${PAYLOAD_STOP_CONDITIONS.map(code).join(', ')} (\`tripwire\` is raised by orbit and refused from a payload)`,
    about: 'plain; non-blank — what the stop is about',
    question: 'plain; non-blank — the question as you put it to the user',
    defines: DEFINES_FORM,
    detail: DETAIL_FORM,
  },
  resolution: {
    stop: 'the stop it answers, by filename (`stop-<TS>.json`), in the same `decisions/` folder and belonging to the same work; a stop has at most one resolution',
    answer: "plain; non-blank — the user's answer as recorded",
    effect: 'plain; non-blank — what happens next because of it',
    defines: DEFINES_FORM,
    detail: DETAIL_FORM,
  },
  ledger: {
    area: `one of the ledger areas: ${LEDGER_AREAS.map(code).join(', ')}`,
    decided: 'plain; non-blank — what was decided',
    alternatives: 'a non-empty array of non-blank strings — the options not taken',
    why: 'plain; non-blank — why this one',
    relies_on: 'an array of citations (below), or `[]` together with `raised_stop`',
    raised_stop: `present only when \`relies_on\` is \`[]\`: the stop the call raised, by filename (\`stop-<TS>.json\`), in the same \`decisions/\` folder, of condition ${LEDGER_STOPS}`,
    defines: DEFINES_FORM,
    detail: DETAIL_FORM,
  },
};

/** How the write gate confirms each citation kind exists. */
const CITATION_EXISTS: Record<string, string> = {
  requirement: '`orbit/specs/<capability>/spec.md` holds `### Requirement: <title>`',
  ruling: '`orbit/architecture/<doc>.md` holds `**<id>**` under `## Rulings index`',
  goal: '`orbit/architecture/<doc>.md` opens a `## Goals` item with `**<id>`',
  resolution: 'a resolution record `resolution-<token>.json` exists for that change (active, its exploration, or archived) or in the architecture trail for that doc',
  decision: "the `explore.md` of the work the entry belongs to holds a live Decisions entry with that ID (refused on a `--doc` record)",
};

/** One example payload per record; a test submits each, unchanged, through its `orbit emit` command. */
export const DECISION_RECORD_EXAMPLES: Record<DecisionCommand, Record<string, unknown>> = {
  stop: {
    model: 'claude-opus-5-5',
    condition: 'user-facing-uncovered',
    about: 'How often the export runs when the user has not picked an interval.',
    question: 'Should the export run weekly by default, or only when the user asks?',
  },
  resolution: {
    model: 'claude-opus-5-5',
    stop: 'stop-2026-11-08T10-00-00Z.json',
    answer: 'Weekly by default; the user can turn it off.',
    effect: 'The export is scheduled weekly unless the user changes it.',
  },
  ledger: {
    model: 'claude-opus-5-5',
    area: 'defaults',
    decided: 'Exports are kept for thirty days, then removed.',
    alternatives: ['keep every export', 'keep only the latest export'],
    why: 'Thirty days keeps a month of history without letting old copies fill the disk.',
    relies_on: [{ kind: 'requirement', capability: 'export', title: 'Exports are kept for a month' }],
    defines: [{ term: 'export', definition: "a copy of the user's data written to a file they can download" }],
  },
};

function requireForm(command: DecisionCommand, field: string): string {
  const form = FIELD_FORM[command][field];
  if (form === undefined) throw new Error(`disciplines: no form for ${command}.${field}`);
  return form;
}

function citationLines(): string {
  return Object.entries(CITATION_SHAPES)
    .map(([kind, shapes]) => {
      const exists = CITATION_EXISTS[kind];
      if (exists === undefined) throw new Error(`disciplines: no existence rule for citation kind ${kind}`);
      const written = shapes.map(s => code(`{${s.map(k => (k === 'kind' ? `"kind": "${kind}"` : k)).join(', ')}}`)).join(' or ');
      return `- ${code(kind)} — written ${written}; accepted when ${exists}.`;
    })
    .join('\n');
}

function recordSection(command: DecisionCommand): string {
  const fields = DECISION_PAYLOAD_FIELDS[command].map(f => `- ${code(f)} — ${requireForm(command, f)}`).join('\n');
  const parts = [
    `## ${RECORD_TITLE[command]} (\`orbit emit ${command}\`)`,
    '',
    'Fields:',
    '',
    fields,
  ];
  if (command === 'ledger') {
    parts.push(
      '',
      'The citation kinds of `relies_on`:',
      '',
      citationLines(),
      '',
      `When nothing approved covers the call, write \`"relies_on": []\` and \`"raised_stop": "stop-<TS>.json"\`, naming the ${LEDGER_STOPS} stop you wrote for it — never both a citation and a stop.`
    );
  }
  parts.push('', 'Example:', '', '```json', JSON.stringify(DECISION_RECORD_EXAMPLES[command], null, 2), '```');
  return parts.join('\n');
}

const PLAIN_LIST = DECISION_COMMANDS.flatMap(c => PLAIN_FIELDS[c]).map(code).join(', ');

/** `references/decision-records.md`, shipped beside every skill whose epitome carries the statement. */
export const DECISION_RECORDS_REFERENCE = [
  '# Reference: decision records',
  '',
  'The decision-writing discipline in this skill says WHEN to write a record; this reference says WHAT each one holds.',
  '',
  '## How a record is written',
  '',
  'Write the payload as JSON to a temporary file and run `orbit emit <record> --change <name> --payload <file>` (a change or a named exploration) or `orbit emit <record> --doc <doc> --payload <file>` (an architect session). The payload carries `model` (your model id, or `null`) and the fields listed for its record, and nothing else; orbit adds the record, the time and the work it belongs to, and writes it to that work\'s `.orbit-runs/decisions/` folder as `<record>-<TS>.json`. A refused record names the field to fix, and nothing is written.',
  '',
  '## The plain-language rule',
  '',
  `The plain fields — ${PLAIN_LIST} — are written for a reader who knows only the program's architecture doc (its Premise, Goals, Rulings and stage charters) and nothing else. Any other term a record uses is defined in its \`defines\` list, or not used. Implementation detail (internal names, file layouts, mechanisms coined during the work) may go in \`detail\`, and is never the only statement of what was decided.`,
  '',
  ...REFERENCE_RECORD_ORDER.flatMap(c => [recordSection(c), '']),
].join('\n');
