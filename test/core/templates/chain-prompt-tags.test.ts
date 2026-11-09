import { describe, it, expect } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { CHAIN_END_STEP, CHAIN_END_STEP_SKILLS, NO_CHAINING_CHAIN_CLAUSE } from '../../../src/core/disciplines.js';
import { CHAIN_KEY_TABLE, CHAIN_KEYS } from '../../../src/core/chain.js';

/**
 * seam-chaining — the generated surface of the chain: the end step and the epitome clause in the five
 * bodies whose end can name a change's next command (`orbit-conventions`' `No-chaining contract`), the
 * blind pair's end (`orbit-review`), and the prompt tags (`A chain treats each prompt by its kind`,
 * `Each chained prompt states its kind`).
 */

const skills = getSkillTemplates();
const skill = (dir: string) => {
  const s = skills.find(x => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template;
};
const ref = (dir: string, name: string): string => {
  const r = (skill(dir).references ?? []).find(x => x.name === name);
  if (!r) throw new Error(`no reference ${dir}/${name}`);
  return r.content;
};
const noChainingBullet = (body: string): string | undefined =>
  body.split('\n').find(l => l.startsWith('- **No-chaining (turn boundary)**'));

/** The no-chaining bullet every OTHER epitome-carrying body carries, exactly as before this change. */
const STANDARD_BULLET =
  "- **No-chaining (turn boundary)**: invoke only the orbit workflow commands the user's message explicitly requests; completing a command ENDS the turn at the position readout + the engine's eligibility line — gate `passed` means *eligible*, not *commanded*.";

// ---- The end step and the clause (task 3.3) ------------------------------------------------------

describe('No-chaining contract — the five bodies carry the end step and the clause', () => {
  it('the end step names every key of the engine table with its commands, and the three outcomes', () => {
    for (const k of CHAIN_KEYS) {
      for (const form of CHAIN_KEY_TABLE[k]) expect(CHAIN_END_STEP).toContain(`\`${form}\``);
      expect(CHAIN_END_STEP).toContain(`\`${k}\` — `);
    }
    expect(CHAIN_END_STEP).toContain('print `Chaining: <next> (granted by chain.<key>)` and run `<next>` as the next act of this turn');
    expect(CHAIN_END_STEP).toContain('print `Chain stops: <why>` and end the turn');
    expect(CHAIN_END_STEP).toContain('`Chain stops: open-stop — <stop>: <question>`');
    expect(CHAIN_END_STEP).toContain('**`configured: false`** → print nothing more');
    expect(CHAIN_END_STEP).toContain('`--chain-ran "<next>" --chain-head "<head>"`');
  });

  // @scenario text orbit-conventions :: No-chaining contract :: A granted next command runs in the same turn
  it('a granted next command is named with its key and run, and the walk records the grant', () => {
    expect(CHAIN_END_STEP).toContain('Chaining: <next> (granted by chain.<key>)');
    expect(CHAIN_END_STEP).toContain('`Chained: granted by chain.<key>.` as one sentence in the record its session writes: a walk in its run summary\'s `final_assessment`');
    // The chained command's own closing step is this same step, so it reads the object again.
    expect(CHAIN_END_STEP).toContain("The chained command's closing step reads the status");
  });

  // @scenario text orbit-conventions :: No-chaining contract :: A chain ends by stating why
  it('a refused chain states its why when configured, and nothing when not', () => {
    expect(CHAIN_END_STEP).toMatch(/`may_run: false` with `configured: true`\*\* → print `Chain stops: <why>` and end the turn/);
    expect(CHAIN_END_STEP).toMatch(/`configured: false`\*\* → print nothing more: the turn ends at the eligibility line exactly as without the setting/);
  });

  it('exactly the five bodies carry the end step once and the clause in their bullet; every other bullet is unchanged', () => {
    const five = new Set<string>(CHAIN_END_STEP_SKILLS);
    let others = 0;
    for (const s of skills) {
      const body = s.template.instructions;
      const bullet = noChainingBullet(body);
      if (five.has(s.dirName)) {
        expect(body.split(CHAIN_END_STEP).length - 1, s.dirName).toBe(1);
        expect(bullet, s.dirName).toContain(`invoking no next command ${NO_CHAINING_CHAIN_CLAUSE}`);
      } else {
        expect(body, s.dirName).not.toContain('## Chain end step');
        expect(body, s.dirName).not.toContain(NO_CHAINING_CHAIN_CLAUSE);
        if (bullet !== undefined) {
          expect(bullet, s.dirName).toBe(STANDARD_BULLET);
          others++;
        }
      }
    }
    expect(others).toBe(9);
  });

  it('with no change target the step does nothing, and a dirty tree is a named limit', () => {
    expect(CHAIN_END_STEP).toContain('With no change target — an architecture-mode review, a `--doc` walk, a project-wide walk — the step does nothing: the turn ends at the readout.');
    expect(CHAIN_END_STEP).toContain('judge no reason of your own beyond a decision prompt the command asked');
    expect(CHAIN_END_STEP).toContain('A chained external review or blind pair needs a committed tree');
  });

  // @scenario text orbit-conventions :: No-chaining contract :: A dispatched worker never chains
  it('the fresh-reviewer brief — standalone and as the blind pair\'s fresh half — tells the worker not to chain', () => {
    const body = skill('orbit-review').instructions;
    const brief = body.slice(body.indexOf('You are the fresh-context reviewer'), body.indexOf('```', body.indexOf('You are the fresh-context reviewer')));
    expect(brief).toContain("Skip the skill's closing Chain end step too: once your pass is\npersisted, return — never run another orbit command, whatever the change status's chain object says.");
    expect(body).toContain('So is the Chain end step: the worker skips it and returns once its pass is persisted');
    expect(CHAIN_END_STEP).toContain("A worker that session dispatched — a fresh reviewer, a blind pair's fresh half — never runs it");
    // The pair's fresh half is dispatched with that same brief, unchanged.
    expect(ref('orbit-review', 'blind-pair.md')).toContain("per the trunk's **Dispatching a fresh pass** — a clean-context subagent with that section's brief, unchanged");
  });
});

describe("the blind pair's end and the external handoff hold the walk to the chain object", () => {
  const pair = ref('orbit-review', 'blind-pair.md');
  const handoff = ref('orbit-review', 'external-handoff.md');

  // @scenario text orbit-review :: The blind-pair reviewer runs both halves in one invocation :: A granted walk follows the pair
  it('row 13 runs the walk only when the chain object allows it, at the end step', () => {
    const end = pair.slice(pair.indexOf('### 13. End'), pair.indexOf('## Session end'));
    expect(end).toContain("The walk is invoked only when the change status's `chain` object allows `/orbit:address-reviews` — by the review body's Chain end step, which this step ends at — and never otherwise (no-chaining).");
    expect(end).not.toContain('NEVER invoked');
  });

  it('the external handoff carries no unconditional "Do NOT walk it" or "never by this branch."', () => {
    expect(handoff).not.toMatch(/Do NOT walk it/);
    expect(handoff).not.toContain('invoked separately, never by this branch.');
    expect(handoff).toContain("never by this branch's own steps: by the user, or, when the change status's `chain` object allows it, by the review body's Chain end step.");
    expect(handoff).toContain("it runs only when the user invokes it or the change status's `chain` object allows it at the review body's Chain end step.");
  });
});

// ---- The prompt tags (tasks 4.2, 4.3) -----------------------------------------------------------

/** The tags `A chain treats each prompt by its kind` names: its one routine default and the three plain kinds. */
const ALLOWED_TAGS = new Set(['(chain: target)', '(chain: routine, default: walk all)', '(chain: decision)', '(chain: not a prompt)']);
/** The two site patterns: an `AskUserQuestion` site, and a prose ask of the pause pattern. */
const SITE = /AskUserQuestion|\bpause\b|wait for guidance|ask for clarification/i;
const TAG = /\(chain: [^)]*\)/g;

/**
 * The closed INVENTORY of tagged sites: each tagged line of the generated surface, by the file it is in and
 * an anchor on its line, with the tags it must carry. A listed prompt is named by its row of `A chain treats
 * each prompt by its kind`; a mention (a line naming `AskUserQuestion` or the pause pattern without asking)
 * by `mention`. A tagged line this list does not name fails, however valid its tag — so a new prompt cannot
 * acquire chained handling without its row being added to the requirement and here.
 */
const INVENTORY: Array<{ file: string; anchor: string; tags: string[]; row: string }> = [
  { file: 'orbit-review/SKILL.md', anchor: 'If change name omitted, prompt via `AskUserQuestion` over `orbit list --json`', tags: ['(chain: target)'], row: 'review: which change' },
  { file: 'orbit-review/SKILL.md', anchor: 'mixed or ambiguous → `AskUserQuestion` (chain: target)', tags: ['(chain: target)'], row: 'review: which mode' },
  { file: 'orbit-review/SKILL.md', anchor: 'otherwise prompt via `AskUserQuestion` over `orbit list --json` (mark changes', tags: ['(chain: target)'], row: 'review: which change' },
  { file: 'orbit-review/SKILL.md', anchor: "prompt over `orbit architecture status --json`'s parseable docs (chain: target)", tags: ['(chain: target)'], row: 'review: which doc' },
  { file: 'orbit-review/SKILL.md', anchor: '**Missing `tasks.md`** → use `AskUserQuestion` for mode', tags: ['(chain: target)'], row: 'review: which mode' },
  { file: 'orbit-review/external-handoff.md', anchor: '- Use **AskUserQuestion** to let the user select.', tags: ['(chain: target)'], row: 'review: which change, in the external handoff' },
  { file: 'orbit-review/external-handoff.md', anchor: '**Ambiguous** → use **AskUserQuestion** to let the user pick.', tags: ['(chain: target)'], row: 'review: which mode' },
  { file: 'orbit-review/external-handoff.md', anchor: 'the external return the user pastes back is', tags: ['(chain: not a prompt)'], row: 'review: the external return the user pastes back' },
  { file: 'orbit-address-reviews/SKILL.md', anchor: "**Row 4's offer — stop, or walk now — is", tags: ['(chain: decision)'], row: 'address-reviews: a half-landed pair' },
  { file: 'orbit-address-reviews/SKILL.md', anchor: "an `AskUserQuestion` is optional closure when the response doesn't settle it", tags: ['(chain: routine, default: walk all)'], row: 'address-reviews: triage scoping' },
  { file: 'orbit-address-reviews/SKILL.md', anchor: 'There is NO mandatory per-finding `AskUserQuestion`', tags: ['(chain: not a prompt)'], row: 'mention' },
  { file: 'orbit-address-reviews/SKILL.md', anchor: 'Proceed to 3c without `AskUserQuestion`', tags: ['(chain: not a prompt)'], row: 'mention' },
  { file: 'orbit-address-reviews/SKILL.md', anchor: 'exists only as post-discussion closure per 3b.5', tags: ['(chain: decision)'], row: 'address-reviews: a decision-lane finding' },
  { file: 'orbit-address-reviews/SKILL.md', anchor: 'Alternatives via **AskUserQuestion**', tags: ['(chain: decision)'], row: "address-reviews: an unresolvable finding's alternatives" },
  { file: 'orbit-address-reviews/SKILL.md', anchor: 'is an OPTIONAL CLOSURE DEVICE', tags: ['(chain: decision)'], row: 'address-reviews: a decision-lane finding' },
  { file: 'orbit-address-reviews/resolution-detail.md', anchor: 'an AskUserQuestion (chain: not a prompt) would fire', tags: ['(chain: not a prompt)'], row: 'mention' },
  { file: 'orbit-address-reviews/resolution-detail.md', anchor: 'it offers to stop (walk nothing, write no log', tags: ['(chain: decision)'], row: 'address-reviews: a half-landed pair' },
  { file: 'orbit-address-reviews/run-summary-schema.md', anchor: 'closure `AskUserQuestion` did) (chain: not a prompt)', tags: ['(chain: not a prompt)'], row: 'mention' },
];

/** Every failure of the tag rule over one text: an untagged site, a tag no kind names, or a tagged site the inventory does not list. */
function tagFailures(label: string, text: string, inventory = INVENTORY): string[] {
  const out: string[] = [];
  // The end step states the tag grammar itself; it is not a site.
  const lines = text.split(CHAIN_END_STEP).join('').split('\n');
  lines.forEach((line, i) => {
    const tags = line.match(TAG) ?? [];
    if (SITE.test(line) && tags.length === 0) out.push(`${label}:${i + 1} untagged site: ${line.trim().slice(0, 120)}`);
    for (const t of tags) if (!ALLOWED_TAGS.has(t)) out.push(`${label}:${i + 1} tag the list does not name: ${t}`);
    if (tags.length === 0) return;
    const entries = inventory.filter(e => e.file === label && line.includes(e.anchor));
    if (entries.length === 0) out.push(`${label}:${i + 1} tagged site the list does not name: ${line.trim().slice(0, 120)}`);
    else if (entries.some(e => JSON.stringify(e.tags) !== JSON.stringify(tags))) {
      out.push(`${label}:${i + 1} tagged ${tags.join(',')}, the list says ${entries[0].tags.join(',')}`);
    }
  });
  return out;
}

/** The generated review and address-reviews bodies and every reference beside them. */
function scanned(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const dir of ['orbit-review', 'orbit-address-reviews']) {
    const t = skill(dir);
    out.push([`${dir}/SKILL.md`, t.instructions]);
    for (const r of t.references ?? []) out.push([`${dir}/${r.name}`, r.content]);
  }
  return out;
}

describe('Each chained prompt states its kind', () => {
  it('every site in the generated review and address-reviews surface carries a tag the list names', () => {
    const failures = scanned().flatMap(([label, text]) => tagFailures(label, text));
    expect(failures).toEqual([]);
  });

  it('every inventory entry is found exactly once, on a line carrying its tags', () => {
    const texts = new Map(scanned());
    for (const e of INVENTORY) {
      const hits = (texts.get(e.file) ?? '').split('\n').filter(l => l.includes(e.anchor));
      expect(hits, `${e.file} :: ${e.anchor}`).toHaveLength(1);
      for (const t of e.tags) expect(hits[0], e.anchor).toContain(t);
    }
  });

  it('a new prompt carrying a valid tag fails: the inventory, not the vocabulary, decides', () => {
    const body = skill('orbit-address-reviews').instructions;
    for (const tag of ['(chain: decision)', '(chain: routine, default: walk all)', '(chain: target)']) {
      const mutated = body.replace('### 2. Triage\n', `### 2. Triage\n\nConfirm deployment with **AskUserQuestion**. ${tag}\n`);
      const failures = tagFailures('orbit-address-reviews/SKILL.md', mutated);
      expect(failures, tag).toEqual([expect.stringMatching(/tagged site the list does not name: Confirm deployment/)]);
    }
    // A listed prompt retagged with another kind fails too.
    const retagged = body.replace('Alternatives via **AskUserQuestion** (chain: decision)', 'Alternatives via **AskUserQuestion** (chain: target)');
    expect(tagFailures('orbit-address-reviews/SKILL.md', retagged)).toEqual([expect.stringMatching(/tagged \(chain: target\), the list says \(chain: decision\)/)]);
  });

  // @scenario behaviour orbit-conventions :: Each chained prompt states its kind :: An untagged prompt fails the test
  it('an untagged prompt fails, naming the site', () => {
    const body = skill('orbit-address-reviews').instructions;
    const mutated = body.replace('### 2. Triage\n', '### 2. Triage\n\nConfirm the source with **AskUserQuestion** first.\n');
    const failures = tagFailures('orbit-address-reviews/SKILL.md', mutated);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/^orbit-address-reviews\/SKILL\.md:\d+ untagged site: Confirm the source with \*\*AskUserQuestion\*\* first\./);
    // The pause pattern is a site too.
    expect(tagFailures('x', 'Then pause and wait for guidance.')).toHaveLength(1);
  });

  // @scenario behaviour orbit-conventions :: Each chained prompt states its kind :: A tag the list does not name fails the test
  it('a tag the list does not name fails, naming the tag', () => {
    const handoff = ref('orbit-review', 'external-handoff.md');
    const mutated = handoff.replace('- Use **AskUserQuestion** to let the user select. (chain: target)', '- Use **AskUserQuestion** to let the user select. (chain: routine, default: proceed)');
    expect(mutated).not.toBe(handoff);
    const failures = tagFailures('orbit-review/external-handoff.md', mutated);
    expect(failures).toEqual(expect.arrayContaining([expect.stringMatching(/tag the list does not name: \(chain: routine, default: proceed\)$/)]));
  });
});

describe('A chain treats each prompt by its kind — each listed prompt is tagged with its row\'s kind', () => {
  const review = skill('orbit-review').instructions;
  const walk = skill('orbit-address-reviews').instructions;
  const handoff = ref('orbit-review', 'external-handoff.md');
  const detail = ref('orbit-address-reviews', 'resolution-detail.md');
  const lineWith = (text: string, anchor: string): string => {
    const hits = text.split('\n').filter(l => l.includes(anchor));
    expect(hits, anchor).toHaveLength(1);
    return hits[0];
  };

  const ROWS: Array<[string, string, string, string]> = [
    ['review: which change', review, 'otherwise prompt via `AskUserQuestion` over `orbit list --json`', '(chain: target)'],
    ['review: which doc (architecture mode)', review, "prompt over `orbit architecture status --json`'s parseable docs (chain: target)", '(chain: target)'],
    ['review: which mode (mixed or ambiguous)', review, 'mixed or ambiguous → `AskUserQuestion`', '(chain: target)'],
    ['review: which mode (missing tasks.md)', review, '**Missing `tasks.md`** → use `AskUserQuestion` for mode', '(chain: target)'],
    ['review: which change, in the external handoff', handoff, '- Use **AskUserQuestion** to let the user select.', '(chain: target)'],
    ['review: which mode, in the external handoff', handoff, '**Ambiguous** → use **AskUserQuestion** to let the user pick.', '(chain: target)'],
    ['review: the external return the user pastes back', handoff, 'the external return the user pastes back is', '(chain: not a prompt)'],
    ['address-reviews: triage scoping', walk, "an `AskUserQuestion` is optional closure when the response doesn't settle it", '(chain: routine, default: walk all)'],
    ['address-reviews: a half-landed pair (body)', walk, "**Row 4's offer — stop, or walk now — is", '(chain: decision)'],
    ['address-reviews: a half-landed pair (reference)', detail, 'it offers to stop (walk nothing, write no log', '(chain: decision)'],
    ['address-reviews: a decision-lane finding (classify)', walk, 'exists only as post-discussion closure per 3b.5', '(chain: decision)'],
    ['address-reviews: a decision-lane finding (closure prompt)', walk, 'is an OPTIONAL CLOSURE DEVICE', '(chain: decision)'],
    ["address-reviews: an unresolvable finding's alternatives", walk, 'Alternatives via **AskUserQuestion**', '(chain: decision)'],
  ];
  for (const [row, text, anchor, tag] of ROWS) {
    it(`${row} → ${tag}`, () => {
      expect(lineWith(text, anchor)).toContain(tag);
    });
  }

  it('the routine tag appears once across the surface: the table has one routine prompt', () => {
    const all = scanned().map(([, t]) => t.split(CHAIN_END_STEP).join('')).join('\n');
    expect(all.split('(chain: routine, default: walk all)').length - 1).toBe(1);
  });

  // @scenario text orbit-conventions :: A chain treats each prompt by its kind :: A routine scoping prompt takes its default
  it('a chained walk takes the walk-all default and records it', () => {
    const line = lineWith(walk, "an `AskUserQuestion` is optional closure when the response doesn't settle it");
    expect(line).toContain("On an arrival the change status's `chain` object allowed, no scoping prompt fires: every finding is walked, and the run summary's `final_assessment` carries `The chain took the default: triage scoping — walk all.`");
  });

  // @scenario text orbit-conventions :: A chain treats each prompt by its kind :: A decision-lane finding stops the chain
  it('a decision prompt is asked as on a typed arrival, and the chain stops after the command', () => {
    expect(CHAIN_END_STEP).toContain('a `(chain: decision)` prompt is asked exactly as on a typed arrival, and after a decision the chain does not continue — the command\'s own closing step states in one line that the chain stopped at a decision and runs nothing');
    expect(walk).toContain(CHAIN_END_STEP);
  });

  // @scenario text orbit-conventions :: A chain treats each prompt by its kind :: A typed arrival asks every prompt
  it('a typed arrival asks every prompt: only an allowed arrival reads the tags', () => {
    expect(lineWith(walk, "an `AskUserQuestion` is optional closure when the response doesn't settle it")).toContain('On any arrival the user typed, scoping is asked as above.');
    expect(CHAIN_END_STEP).toContain('The chained command runs as on a typed arrival except for its prompts');
  });
});
