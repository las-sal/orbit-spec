import {
  CITATION_SHAPES,
  DECISION_COMMANDS,
  DECISION_PAYLOAD_FIELDS,
  LEDGER_AREAS,
  LEDGER_STOP_CONDITIONS,
  PAYLOAD_STOP_CONDITIONS,
  READER_BOUND_FIELDS,
  REPLACEMENT_LINK_FIELDS,
  STOP_CONDITIONS,
  type DecisionCommand,
} from './decision-records.js';
import { CHAIN_KEY_TABLE, CHAIN_KEYS } from './chain.js';
import { ACCOUNT_COMMAND, ACCOUNT_DIR, ACCOUNT_PAYLOAD_FIELDS, ACCOUNT_PLAIN_FIELDS } from './account.js';

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
/** The conditions raised directly, with no ledger entry: the payload conditions the ledger names no stop of. */
const DIRECT_STOPS = PAYLOAD_STOP_CONDITIONS.filter(c => !(LEDGER_STOP_CONDITIONS as readonly string[]).includes(c)).map(code);
const DIRECT_STOPS_TEXT = `${DIRECT_STOPS.slice(0, -1).join(', ')} or ${DIRECT_STOPS[DIRECT_STOPS.length - 1]}`;

/** The epitome's fifth bullet, carried byte-equal by every workflow body that has an epitome. */
export const DECISION_WRITING_DISCIPLINE =
  `- **Decision-writing (call-time)**: under every setting, keep a record of each call and each stop without changing what the user sees or is asked. ` +
  `BEFORE asking the user a question that a stop condition describes — ${CONDITIONS} — write a stop record (\`orbit emit stop\`), then ask exactly as you would have; ` +
  `with the user's answer, write a resolution naming that stop (\`orbit emit resolution\`); ` +
  `when ${DIRECT_STOPS_TEXT} describes an act you take without asking — the user directed it (they told you to amend a ruling), or no flow asks — write its stop record before the act, then, when the user directed it, a resolution naming that stop whose answer is their direction, and otherwise leave the stop open; ` +
  `AFTER any call that falls in a ledger area — however you reached it: without asking, after a question no condition describes, or with the user's answer to a stop — ${AREAS} — write a ledger entry (\`orbit emit ledger\`) citing what it relies on; ` +
  `when ${LEDGER_STOPS} describes the call, by its own gloss above, the entry cites nothing and names that stop: the one you asked at, or, where you would not have asked, one you write first — ask nothing and leave that stop open. ` +
  `A designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — is a seam, not a stop, and writes nothing, unless a stop condition also describes it: then write the stop record first and fire the prompt as designed. ` +
  `A question no condition describes writes nothing, nor does a call in no area. ` +
  `A record names the work it belongs to (\`--change <name>\` for a change or a named exploration, or \`--doc <doc>\` in an architect session); in a session with neither (a project-wide run, an unnamed exploration), or on an archived change (orbit writes no record to its trail), write no record, never attaching it to other work. ` +
  `What each record carries — its fields, its citations and the plain-language rule, with an example of each — is in \`references/${DECISION_RECORDS_REFERENCE_NAME}\`, beside this skill; a refused record names the field to fix.`;

// ---------------------------------------------------------------------------
// The chain end step (seam-chaining, `orbit-conventions`' `No-chaining contract`)
// ---------------------------------------------------------------------------

/**
 * The clause the no-chaining epitome bullet gains in the five bodies whose end can name a change's
 * next command (propose, ff, apply, review, address-reviews) — and in no other body.
 */
export const NO_CHAINING_CHAIN_CLAUSE = "unless the change status's `chain` object allows it";

/** The bodies that carry the chain end step and the epitome clause, by skill name. */
export const CHAIN_END_STEP_SKILLS = [
  'orbit-propose',
  'orbit-ff-change',
  'orbit-apply-change',
  'orbit-review',
  'orbit-address-reviews',
] as const;

const KEY_ROWS = CHAIN_KEYS.map(k => `  - \`${k}\` — ${CHAIN_KEY_TABLE[k].map(code).join(', ')}`).join('\n');

/**
 * The closing step, carried byte-equal by the five bodies. The key table is interpolated from the
 * engine's own (`CHAIN_KEY_TABLE`), so an adopter's generated skill ships the mapping it relies on.
 */
export const CHAIN_END_STEP = [
  "## Chain end step (the closing step — `orbit-conventions`' `No-chaining contract`)",
  '',
  "This step is the LAST act of the session the command was invoked in, after the position readout and the eligibility line. A worker that session dispatched — a fresh reviewer, a blind pair's fresh half — never runs it: it persists its pass and returns. With no change target — an architecture-mode review, a `--doc` walk, a project-wide walk — the step does nothing: the turn ends at the readout. Otherwise read the `chain` object from `orbit status --change \"<name>\" --json` — the call that supplied the eligibility line, or, where a render supplied the line, a call made right after it — and obey it; judge no reason of your own beyond a decision prompt the command asked:",
  '',
  '- **`may_run: true`** → print `Chaining: <next> (granted by chain.<key>)` and run `<next>` as the next act of this turn. `<key>` is the row covering `<next>`:',
  KEY_ROWS,
  '',
  "  The chained command runs as on a typed arrival except for its prompts, each tagged at its site: a `(chain: target)` prompt does not fire (the next command names the change and the mode); a `(chain: routine, default: <option>)` prompt takes that default, and the run summary's `final_assessment` records `The chain took the default: <prompt> — <answer>.`; a `(chain: decision)` prompt is asked exactly as on a typed arrival, and after a decision the chain does not continue — the command's own closing step states in one line that the chain stopped at a decision and runs nothing. The chained command records `Chained: granted by chain.<key>.` as one sentence in the record its session writes: a walk in its run summary's `final_assessment`; an external review or a blind pair in its launch record's `final_assessment`; an in-context review in its pass's `commentary` (the review emit owns a pass's `final_assessment`); a chained apply or archive records it as its `consent: \"setting\"` value and writes no sentence. A chained fresh review records nothing — its worker writes the pass, and its brief carries nothing from this session (a named limit). The chained command's closing step reads the status with `--chain-ran \"<next>\" --chain-head \"<head>\"` added — the `next` and `head` this read reported, a null `head` written as the word `null` — so a command that wrote no run record stops the chain on `no-progress`. A chained external review or blind pair needs a committed tree. Where the commit step commits (`commit: true` on the change's attached branch), it ran before this read, so the review arrives on a committed tree; anywhere else, on an uncommitted tree the pair and a launched external review each refuse and write nothing, so no run record lands and the chain stops on `no-progress` — say then that the working tree has uncommitted changes (a named limit).",
  '- **`may_run: false` with `configured: true`** → print `Chain stops: <why>` and end the turn. On `open-stop` print `Chain stops: open-stop — <stop>: <question>`, reading `question` from the stop record at the `stop` path, and put that question to the user; the resolution their answer writes lets the next read pass that row.',
  '- **`configured: false`** → print nothing more: the turn ends at the eligibility line exactly as without the setting.',
].join('\n');

// ---------------------------------------------------------------------------
// The commit step (chained-review-commit, `orbit-conventions`' `The commit step closes each carrying body`)
// ---------------------------------------------------------------------------

/** The bodies that carry the commit step, by skill name: the requirement's table rows marked yes. */
export const COMMIT_STEP_SKILLS = [
  'orbit-propose',
  'orbit-ff-change',
  'orbit-apply-change',
  'orbit-review',
  'orbit-address-reviews',
  'orbit-archive-change',
] as const;

/**
 * The closing commit step, carried byte-equal by the six bodies. It restates the consumption-table rows the step
 * meets, because an installed apply, review or walk skill carries no PR reference to point at.
 */
export const COMMIT_STEP = [
  "## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)",
  '',
  "This step runs in the session the command was invoked in, after the command's run summary is written (in archive, after the PR-attached tail) and BEFORE the position readout (in archive, the completion readout), so its lines precede the readout and the eligibility line, and the chain end step, in a body that carries one, still follows them. In apply it runs once, at the session's close, never at a chunk boundary. A worker that session dispatched — a fresh reviewer, a blind pair's fresh half — never runs it: it persists its pass and returns. With no change target — an architecture-mode review, a `--doc` walk, a project-wide walk — the step does nothing and calls nothing. When this invocation's PR layer has already stopped — an earlier `orbit pr` call exited non-zero, or a step it printed failed (`select` or `publish` at propose or ff, the `tail` at archive) — the step calls nothing and prints nothing: no later PR step runs, and that failure's line stays the recovery the user runs. Otherwise run `orbit pr commit \"<name>\" --json` (the change's name, active or just archived) and act on its record:",
  '',
  '- **A non-zero exit** (a usage error, the only one) → report the error verbatim in ONE line and run nothing; the session\'s writes stay as they are.',
  '- **`action: off`** → print nothing and run nothing. Neither setting is granted, the `pr:` regime is `never`, or the change is unattached; at the defaults the step ends here and the turn ends exactly as before the step existed.',
  '- **`action: skip`** → write ONE line from `reason.code` and `reason.detail` (`detached`; `head-mismatch`, naming HEAD\'s branch and the attachment\'s; `default-branch`; `merge-in-progress`) and run nothing.',
  '- **`action: proceed` with no segment** → nothing is printed to run: run nothing.',
  "- **`action: proceed` with a segment** → when its `inputs` name `<message-file>`, first write the commit message — one line naming the command, the change and what the session did — to a file OUTSIDE the working tree (the OS temp directory), never inside it: the stage is `git add -A` and would commit the message itself. Keep that file until every printed step has run. Run each step's `argv` exactly, in order, substituting only the element `<message-file>`, every element shell-quoted. Then name, in ONE line, each path `observations.untracked` lists (the untracked files the commit took).",
  "- **`action: proceed` with `degraded: \"pr\"`**, with a segment or none → add ONE line saying the push was dropped, from `reason.code`.",
  "- **A step fails** → stop at that step and write ONE line naming the completed, the failed and the skipped steps by their `step` names, showing the failed step's argv and then each skipped step's, verbatim with `<message-file>` filled, as the recovery the user runs in that order. The session's writes stay uncommitted or unpushed until that recovery lands, and nothing the session wrote is undone. Never retry with other flags and never force a push.",
  '',
  "What the step may commit, and to which branch, is `orbit-pr-lifecycle`'s `` `orbit pr commit` computes the closing commit step ``: everything uncommitted, the user's own edits included, except the untracked files `.gitignore` excludes, and only on the change's attached branch. What grants it is that capability's `The commit and push settings`: `commit: true` and `push: true` in `orbit/config.yaml`, each granted only by the literal `true`.",
].join('\n');

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

/** `replaces`, per record: a replacement rewords and carries that record's link fields unchanged. */
const replacesForm = (command: DecisionCommand): string =>
  `optional; the filename (\`${command}-<TS>.json\`) of the ${RECORD_TITLE[command].toLowerCase()} this one REPLACES, in the same \`decisions/\` folder, belonging to the same work, and not already replaced — a replacement rewords and carries ${REPLACEMENT_LINK_FIELDS[command].map(code).join(', ')} unchanged`;

/** The form the write gate accepts for each payload field, per record. */
const FIELD_FORM: Record<DecisionCommand, Record<string, string>> = {
  stop: {
    condition: `one of ${PAYLOAD_STOP_CONDITIONS.map(code).join(', ')} (\`tripwire\` is raised by orbit and refused from a payload)`,
    about: 'plain; non-blank — what the stop is about',
    question: 'plain; non-blank — the question as you put it to the user',
    defines: DEFINES_FORM,
    detail: DETAIL_FORM,
    replaces: replacesForm('stop'),
  },
  resolution: {
    stop: 'the stop it answers, by filename (`stop-<TS>.json`), in the same `decisions/` folder and belonging to the same work; a stop has at most one resolution',
    answer: "plain; non-blank — the user's answer as recorded",
    effect: 'plain; non-blank — what happens next because of it',
    defines: DEFINES_FORM,
    detail: DETAIL_FORM,
    replaces: replacesForm('resolution'),
  },
  ledger: {
    area: `one of the ledger areas: ${LEDGER_AREAS.map(code).join(', ')}`,
    decided: 'plain; non-blank — what was decided',
    alternatives: 'plain; a non-empty array of non-blank strings — the options not taken',
    why: 'plain; non-blank — why this one',
    relies_on: 'an array of citations (below), or `[]` together with `raised_stop`',
    raised_stop: `present only when \`relies_on\` is \`[]\`: the stop the call raised, by filename (\`stop-<TS>.json\`), in the same \`decisions/\` folder, of condition ${LEDGER_STOPS}`,
    defines: DEFINES_FORM,
    detail: DETAIL_FORM,
    replaces: replacesForm('ledger'),
  },
};

/** How the write gate confirms each citation kind exists. */
const CITATION_EXISTS: Record<string, string> = {
  requirement: '`orbit/specs/<capability>/spec.md` holds `### Requirement: <title>`, outside fenced code',
  ruling: '`orbit/architecture/<doc>.md` holds `**<id>**` under `## Rulings index`, outside fenced code, the ID matched whole',
  goal: '`orbit/architecture/<doc>.md` opens a `## Goals` item with `**<id>` followed by a space, an em dash or `**`, outside fenced code — the ID matched whole, so `G1` does not match `**G10`',
  resolution: 'a record `resolution-<token>.json` is found for that change (active, then its exploration, then each archive of it, newest first) or in the architecture trail for that doc, reads as JSON whose `command` is `resolution`, and, for `{doc, token}`, whose `doc` is that doc',
  decision: "the `explore.md` of the work the entry belongs to holds a Decisions entry with that ID whose `Disposition:` is `live` or absent; on a replacement, whose citation is carried, an entry with that ID whatever its `Disposition:` (refused on a `--doc` record)",
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
      `When ${LEDGER_STOPS} describes the call (each by its gloss in the decision-writing statement), write \`"relies_on": []\` and \`"raised_stop": "stop-<TS>.json"\`, naming the ${LEDGER_STOPS} stop you wrote for it — never both a citation and a stop.`
    );
  }
  parts.push('', 'Example:', '', '```json', JSON.stringify(DECISION_RECORD_EXAMPLES[command], null, 2), '```');
  return parts.join('\n');
}

const PLAIN_LIST = DECISION_COMMANDS.flatMap(c => READER_BOUND_FIELDS[c]).map(code).join(', ');

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
  '## Fixing a record',
  '',
  "A record is never edited or deleted once written. To fix one — because a reading found it wanting, or because you did — write a NEW record of the same kind whose `replaces` names the old record's filename; the latest record in a chain is the current one. A replacement rewords and never changes what happened, so it carries the old record's link fields unchanged (a ledger entry's `area`, `relies_on` and `raised_stop`; a stop's `condition`; a resolution's `stop`), and orbit refuses one that differs, naming the field. Replace the LATEST record of a chain: when a second fix lands on a record already replaced, the new record replaces that replacement. A new link (a `raised_stop`, a resolution's `stop`, or a `resolution` citation) names the LATEST record of its chain; orbit refuses one naming a replaced record, naming the record to cite instead.",
  '',
  ...REFERENCE_RECORD_ORDER.flatMap(c => [recordSection(c), '']),
].join('\n');

// ---------------------------------------------------------------------------
// The account (stage program-brief, change-account: `orbit-decision-records`' `Each change carries one
// account, written when apply is complete`)
// ---------------------------------------------------------------------------

/**
 * The form the write gate accepts for each account field (`orbit-emit-composition`'s `The write gate checks
 * the account`). Keyed by the gate's own field list, so a field the gate gains without a form here fails at load.
 */
const ACCOUNT_FIELD_FORM: Record<string, string> = {
  built: 'plain; a non-blank string — what the change built, as its user would describe it',
  seams: 'plain; a non-blank string — each new place the user is asked something, or where a setting now changes what happens; when there is none, say so in words ("None.")',
  deviations: "plain; a non-blank string — where the work left its stage's charter in the architecture doc the change cites, or, for a change citing none, the proposal's scope; when there is none, say so in words (\"None.\")",
  defines: DEFINES_FORM,
  detail: DETAIL_FORM,
  replaces: `optional; the filename (\`${ACCOUNT_COMMAND}-<TS>.json\`) of the LATEST account in the change's \`.orbit-runs/${ACCOUNT_DIR}/\` folder, the one this one replaces — required once the change has an account (a change carries one account chain; orbit refuses a second account without it, and a replacement of an already-replaced account, naming the latest); a replacement may change every field`,
};

function accountFieldLines(): string {
  return ACCOUNT_PAYLOAD_FIELDS.map(f => {
    const form = ACCOUNT_FIELD_FORM[f];
    if (form === undefined) throw new Error(`disciplines: no form for account.${f}`);
    return `- ${code(f)} — ${form}`;
  }).join('\n');
}

/** One example payload per step; a test submits each, unchanged, through `orbit emit account`. */
export const ACCOUNT_EXAMPLES = {
  apply: {
    model: 'claude-opus-5-5',
    built: "A weekly export of the user's data to a file they can download; the user can turn it off.",
    seams: 'The first run asks the user whether to keep the weekly default.',
    deviations: 'None.',
  },
  walk: {
    model: 'claude-opus-5-5',
    built: "A weekly export of the user's data to a file they can download; the user can turn it off, and a failed export is retried once.",
    seams: 'The first run asks the user whether to keep the weekly default.',
    deviations: 'The retry was added by a review fix; the charter did not ask for it.',
    replaces: 'account-2026-11-12T10-00-00Z.json',
  },
} as const;

const PLAIN_ACCOUNT_FIELDS = ACCOUNT_PLAIN_FIELDS.map(code).join(', ');

/** How an account is written, shared by both steps: an installed skill of either ships it whole. */
const ACCOUNT_HOW = (example: Record<string, unknown>): string[] => [
  `Write the payload as JSON to a temporary file and run \`orbit emit ${ACCOUNT_COMMAND} --change <name> --payload <file>\` (an active change only; \`--doc\`, an exploration and an archived change are refused). The payload carries \`model\` (your model id, or \`null\`) and these fields, and nothing else; orbit adds the record, the time and the change, and writes it to the change's \`.orbit-runs/${ACCOUNT_DIR}/\` folder as \`${ACCOUNT_COMMAND}-<TS>.json\`. A refused account names the field to fix, and nothing is written. An account is never edited: to change one, write a replacement whose \`replaces\` names the latest account's filename (list \`.orbit-runs/${ACCOUNT_DIR}/\` to find it).`,
  '',
  'Fields:',
  '',
  accountFieldLines(),
  '',
  `The plain fields — ${PLAIN_ACCOUNT_FIELDS} — follow the plain-language rule of \`references/decision-records.md\`: written for a reader who knows only the program's architecture doc (its Premise, Goals, Rulings and stage charters), every other term defined in \`defines\` or not used, implementation detail only in \`detail\` and never the only statement. They reach the user as the program brief's what was built, new seams and deviations from the charter. Writing an account changes nothing the user sees or is asked, and is done under every setting.`,
  '',
  'Example:',
  '',
  '```json',
  JSON.stringify(example, null, 2),
  '```',
];

/**
 * The apply body's account step: written by the session that ends with apply complete, before its run
 * summary (or its `all_done` completion readout when it writes none).
 */
export const ACCOUNT_STEP = [
  "## Account step (before the run summary — `orbit-decision-records`' `Each change carries one account, written when apply is complete`)",
  '',
  "The change's ACCOUNT says, in plain language, what the change built, the new places the user is asked something, and where the work left its plan. It is not a decision record and not a run summary. APPLY IS COMPLETE when the change's apply gate passes: every task is checked, or every unchecked one is a declared, marked `(User-validation` handoff (named in this session's `user_validation_tasks`). Decide at the session's end, BEFORE the run-summary emit — or, when the session writes no run summary (it arrived on `all_done`), before the completion readout:",
  '',
  '- **Apply is not complete at the end of the session** → write no account, whether or not one exists: the session that completes apply writes or replaces it.',
  '- **Apply is complete, and the change has no account** → write it — whether this session checked the last task, resumed after a session that ended before writing it, or arrived on a change completed before accounts existed.',
  "- **Apply is complete, and the change has an account** (a walk reopened tasks) → when the work done since the latest account was written — by this session or an earlier one — changed what it says, write a replacement of it; otherwise write none. The account always describes the finished work.",
  '',
  ...ACCOUNT_HOW(ACCOUNT_EXAMPLES.apply),
].join('\n');

/**
 * The address-reviews body's account step: a walk replaces the account when a resolved finding changes what
 * it says, except when it resolved the finding by reopening tasks.
 */
export const ACCOUNT_WALK_STEP = [
  "### 7. Replace the account when a fix changed it (`orbit-decision-records`' `Each change carries one account, written when apply is complete`)",
  '',
  "A change's ACCOUNT says, in plain language, what the change built, the new places the user is asked something, and where the work left its plan; the apply session that completes the change writes it. After the logs are written, decide:",
  '',
  `- **A walk of an ACTIVE change that has an account** (its \`.orbit-runs/${ACCOUNT_DIR}/\` holds one), **where a resolved finding changes what was built, a seam, or a deviation** → write a replacement of the latest account that describes the change as it now stands; one replacement covers every such finding of this walk.`,
  "- **A finding resolved by reopening tasks** (appending or unchecking a task in the change's `tasks.md`) → write no account for it: the apply session that completes those tasks replaces the account, so it describes finished work.",
  '- **A change with no account yet, a walk of an archived change, or a walk with no change target** → write no account.',
  '',
  ...ACCOUNT_HOW(ACCOUNT_EXAMPLES.walk),
].join('\n');
