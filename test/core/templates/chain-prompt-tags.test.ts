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
    // seam-chaining-grants: a chained apply or archive records the grant in its consent value instead.
    expect(CHAIN_END_STEP).toContain('a chained apply or archive records it as its `consent: "setting"` value and writes no sentence');
    // The chained command's own closing step is this same step, so it reads the object again.
    expect(CHAIN_END_STEP).toContain("The chained command's closing step reads the status");
  });

  // @scenario text orbit-conventions :: No-chaining contract :: A chained apply records its grant in its consent value
  it('a chained apply or archive records its grant as its consent value, with no Chained: sentence', () => {
    expect(CHAIN_END_STEP).toContain('a chained apply or archive records it as its `consent: "setting"` value and writes no sentence');
    const apply = skill('orbit-apply-change').instructions;
    expect(apply).toContain(CHAIN_END_STEP);
    expect(apply).toContain('`setting` (granted by `chain.apply`, no prompt) — it lands in every apply emit this session writes');
    const archive = skill('orbit-archive-change').instructions;
    expect(archive).toContain('Record `consent: "setting"`, fire no consent prompt');
    expect(archive).not.toContain('Chained: granted by chain');
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
    // Both refuse on a dirty tree (the pair's preflight; the handoff's launch route writes nothing) — no paste fallback.
    expect(CHAIN_END_STEP).toContain('the pair and a launched external review each refuse and write nothing');
    expect(CHAIN_END_STEP).not.toContain('paste route');
  });

  // @scenario text orbit-conventions :: No-chaining contract :: A dispatched worker never chains
  it('the fresh-reviewer brief — standalone and as the blind pair\'s fresh half — tells the worker not to chain', () => {
    const body = skill('orbit-review').instructions;
    const brief = body.slice(body.indexOf('You are the fresh-context reviewer'), body.indexOf('```', body.indexOf('You are the fresh-context reviewer')));
    expect(brief).toContain("Skip the skill's closing Commit step and Chain end step too:\nonce your pass is persisted, return — never commit, and never run another orbit command, whatever the\nchange status's chain object says.");
    expect(body).toContain('So are the Commit step and the Chain end step: the worker skips both and returns once its pass is persisted');
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

/** The tags `A chain treats each prompt by its kind` names: its three routine defaults and the three plain kinds. */
const ROUTINE_TAGS = ['(chain: routine, default: walk all)', '(chain: routine, default: Sync now)', '(chain: routine, default: Archive now)'];
const ALLOWED_TAGS = new Set(['(chain: target)', ...ROUTINE_TAGS, '(chain: decision)', '(chain: not a prompt)']);
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
type Entry = { file: string; anchor: string; tags: string[]; row: string; exact?: boolean; count?: number };
/** An entry's line test: the anchor as a substring, or (`exact`) the whole trimmed line. */
const matches = (e: Entry, line: string): boolean => (e.exact ? line.trim() === e.anchor : line.includes(e.anchor));

const INVENTORY: Entry[] = [
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
  // seam-chaining-grants: the apply and archive surface.
  { file: 'orbit-apply-change/SKILL.md', anchor: 'Unless the arrival is granted (next bullet), fire a consent **AskUserQuestion** (chain: not a prompt) BEFORE any write (after', tags: ['(chain: not a prompt)'], row: 'apply: the consent prompt' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'use the **AskUserQuestion tool** to let the user select (chain: target)', tags: ['(chain: target)'], row: 'apply: which change' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'fire the gate INFLECTION PROMPT via **AskUserQuestion** (chain: decision)', tags: ['(chain: decision)'], row: 'apply: the gate inflection' },
  { file: 'orbit-apply-change/SKILL.md', anchor: '**Pause if:** (chain: decision)', tags: ['(chain: decision)'], row: 'apply: a pause' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'Task is unclear → ask for clarification', tags: ['(chain: decision)'], row: 'apply: a pause' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'Error or blocker encountered → report and wait for guidance', tags: ['(chain: decision)'], row: 'apply: a pause' },
  { file: 'orbit-apply-change/SKILL.md', anchor: '7. **On completion or pause, show status**', tags: ['(chain: not a prompt)'], row: 'mention' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'If paused: explain why and wait for guidance', tags: ['(chain: decision)'], row: 'apply: a pause' },
  { file: 'orbit-apply-change/SKILL.md', anchor: '**Output On Pause (Issue Encountered)**', tags: ['(chain: not a prompt)'], row: 'mention' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'If task is ambiguous, pause and ask before implementing', tags: ['(chain: decision)'], row: 'apply: a pause' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'If implementation reveals issues, pause and suggest artifact updates', tags: ['(chain: decision)'], row: 'apply: a pause' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'Pause on errors, blockers, or unclear requirements', tags: ['(chain: decision)'], row: 'apply: a pause' },
  { file: 'orbit-apply-change/SKILL.md', anchor: 'at a mid-chunk session pause (chain: not a prompt)', tags: ['(chain: not a prompt)'], row: 'mention' },
  { file: 'orbit-archive-change/SKILL.md', anchor: 'Use the **AskUserQuestion tool** to let the user select. (chain: target)', tags: ['(chain: target)'], row: 'archive: which change' },
  { file: 'orbit-archive-change/SKILL.md', anchor: '- Use **AskUserQuestion tool** to confirm user wants to proceed (chain: decision)', tags: ['(chain: decision)'], row: 'archive: incomplete artifacts; archive: incomplete tasks', exact: true, count: 2 },
  { file: 'orbit-archive-change/SKILL.md', anchor: '"Sync now (recommended)", "Archive without syncing" (chain: routine, default: Sync now)', tags: ['(chain: routine, default: Sync now)'], row: 'archive: the sync assessment' },
  { file: 'orbit-archive-change/SKILL.md', anchor: '"Archive now", "Sync anyway", "Cancel" (chain: routine, default: Archive now)', tags: ['(chain: routine, default: Archive now)'], row: 'archive: the sync assessment' },
  { file: 'orbit-archive-change/SKILL.md', anchor: 'Unless the arrival is granted (next bullet), fire a consent **AskUserQuestion** (chain: not a prompt) BEFORE any of the command', tags: ['(chain: not a prompt)'], row: 'archive: the consent prompt' },
  { file: 'orbit-archive-change/SKILL.md', anchor: 'Prompt via `AskUserQuestion` (chain: decision):', tags: ['(chain: decision)'], row: 'archive: unaddressed `@review:` markers', exact: true },
  { file: 'orbit-archive-change/SKILL.md', anchor: 'who repairs `tasks.md` before the archive proceeds, or aborts (chain: decision)', tags: ['(chain: decision)'], row: 'archive: a user-validation task line the closure cannot dispose of' },
  { file: 'orbit-archive-change/SKILL.md', anchor: 'fire ONE inflection prompt via **AskUserQuestion** (chain: decision)', tags: ['(chain: decision)'], row: 'archive: the gate inflection' },
  { file: 'orbit-archive-change/SKILL.md', anchor: '| `unverified` present, none `diverged` | Prompt via `AskUserQuestion` (chain: decision)', tags: ['(chain: decision)'], row: 'archive: the base-fingerprint check' },
  { file: 'orbit-archive-change/SKILL.md', anchor: '### Divergence inflection prompt (`AskUserQuestion`) (chain: decision)', tags: ['(chain: decision)'], row: 'archive: the base-fingerprint check' },
  { file: 'orbit-archive-change/SKILL.md', anchor: '| **≥1 CRITICAL findings** | Prompt user via `AskUserQuestion` (chain: decision)', tags: ['(chain: decision)'], row: 'archive: critical audit findings' },
  // program-brief: the sign-off hold (Step 3.7).
  { file: 'orbit-archive-change/SKILL.md', anchor: '2. Ask with the **AskUserQuestion tool** (chain: decision) — a decision prompt', tags: ['(chain: decision)'], row: 'archive: the sign-off over the saved brief' },
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
    const entries = inventory.filter(e => e.file === label && matches(e, line));
    if (entries.length === 0) out.push(`${label}:${i + 1} tagged site the list does not name: ${line.trim().slice(0, 120)}`);
    else if (entries.some(e => JSON.stringify(e.tags) !== JSON.stringify(tags))) {
      out.push(`${label}:${i + 1} tagged ${tags.join(',')}, the list says ${entries[0].tags.join(',')}`);
    }
  });
  return out;
}

/** The four scanned skills: the commands a chain can arrive at. */
const SCANNED_SKILLS = ['orbit-review', 'orbit-address-reviews', 'orbit-apply-change', 'orbit-archive-change'];

/** The generated review, address-reviews, apply and archive bodies and every reference beside them. */
function scanned(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const dir of SCANNED_SKILLS) {
    const t = skill(dir);
    out.push([`${dir}/SKILL.md`, t.instructions]);
    for (const r of t.references ?? []) out.push([`${dir}/${r.name}`, r.content]);
  }
  return out;
}

describe('Each chained prompt states its kind', () => {
  it('every site in the generated review, address-reviews, apply and archive surface carries a tag the list names', () => {
    const failures = scanned().flatMap(([label, text]) => tagFailures(label, text));
    expect(failures).toEqual([]);
  });

  it('every inventory entry is found exactly once, on a line carrying its tags', () => {
    const texts = new Map(scanned());
    for (const e of INVENTORY) {
      const hits = (texts.get(e.file) ?? '').split('\n').filter(l => matches(e, l));
      expect(hits, `${e.file} :: ${e.anchor}`).toHaveLength(e.count ?? 1);
      for (const hit of hits) for (const t of e.tags) expect(hit, e.anchor).toContain(t);
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

  // @scenario behaviour orbit-conventions :: Each chained prompt states its kind :: The apply and archive bodies are scanned
  it('the apply and archive bodies are scanned: an untagged prompt added to the archive body fails, naming the site', () => {
    const labels = scanned().map(([l]) => l);
    for (const dir of ['orbit-apply-change', 'orbit-archive-change']) expect(labels).toContain(`${dir}/SKILL.md`);
    for (const r of skill('orbit-archive-change').references ?? []) expect(labels).toContain(`orbit-archive-change/${r.name}`);
    const body = skill('orbit-archive-change').instructions;
    const mutated = body.replace('## NEW Step 1.5 — Unresolved', 'Confirm the archive date with **AskUserQuestion** first.\n\n## NEW Step 1.5 — Unresolved');
    expect(mutated).not.toBe(body);
    const failures = tagFailures('orbit-archive-change/SKILL.md', mutated);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/^orbit-archive-change\/SKILL\.md:\d+ untagged site: Confirm the archive date with \*\*AskUserQuestion\*\* first\./);
    // The pause pattern in the apply body is a site too.
    const apply = skill('orbit-apply-change').instructions;
    const paused = apply.replace('   - User interrupts\n', '   - User interrupts\n   - A flaky test → pause and rerun\n');
    expect(paused).not.toBe(apply);
    expect(tagFailures('orbit-apply-change/SKILL.md', paused)).toEqual([expect.stringMatching(/untagged site: - A flaky test → pause and rerun/)]);
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
  const apply = skill('orbit-apply-change').instructions;
  const archive = skill('orbit-archive-change').instructions;
  /** The line right after the one carrying `anchor` (for the two byte-identical upstream confirm lines). */
  const lineAfter = (text: string, anchor: string): string => {
    const lines = text.split('\n');
    const at = lines.findIndex(l => l.includes(anchor));
    expect(at, anchor).toBeGreaterThanOrEqual(0);
    expect(lines.filter(l => l.includes(anchor)), anchor).toHaveLength(1);
    return lines[at + 1];
  };
  /** The one line that is exactly `line` once trimmed (the marker prompt's line is a substring of the fingerprint row's). */
  const lineExact = (text: string, line: string): string => {
    const hits = text.split('\n').filter(l => l.trim() === line);
    expect(hits, line).toHaveLength(1);
    return hits[0];
  };
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
    ['apply: which change', apply, 'use the **AskUserQuestion tool** to let the user select', '(chain: target)'],
    ['apply: the consent prompt', apply, 'fire a consent **AskUserQuestion**', '(chain: not a prompt)'],
    ['apply: the gate inflection', apply, 'fire the gate INFLECTION PROMPT via **AskUserQuestion**', '(chain: decision)'],
    ['apply: a pause (the pause list)', apply, '**Pause if:**', '(chain: decision)'],
    ['apply: a pause (an unclear task)', apply, 'Task is unclear → ask for clarification', '(chain: decision)'],
    ['apply: a pause (an error or blocker)', apply, 'Error or blocker encountered → report and wait for guidance', '(chain: decision)'],
    ['apply: a pause (the paused status)', apply, 'If paused: explain why and wait for guidance', '(chain: decision)'],
    ['apply: a pause (guardrails, an ambiguous task)', apply, 'If task is ambiguous, pause and ask before implementing', '(chain: decision)'],
    ['apply: a pause (guardrails, a design issue)', apply, 'If implementation reveals issues, pause and suggest artifact updates', '(chain: decision)'],
    ['apply: a pause (guardrails, errors)', apply, 'Pause on errors, blockers, or unclear requirements', '(chain: decision)'],
    ['archive: which change', archive, 'Use the **AskUserQuestion tool** to let the user select.', '(chain: target)'],
    ['archive: the consent prompt', archive, 'fire a consent **AskUserQuestion**', '(chain: not a prompt)'],
    ['archive: a user-validation task line the closure cannot dispose of', archive, 'who repairs `tasks.md` before the archive proceeds, or aborts', '(chain: decision)'],
    ['archive: the sync assessment (deltas need syncing)', archive, '"Sync now (recommended)", "Archive without syncing"', '(chain: routine, default: Sync now)'],
    ['archive: the sync assessment (already synced)', archive, '"Archive now", "Sync anyway", "Cancel"', '(chain: routine, default: Archive now)'],
    ['archive: the gate inflection', archive, 'fire ONE inflection prompt via **AskUserQuestion**', '(chain: decision)'],
    ['archive: the base-fingerprint check (unverified)', archive, '| `unverified` present, none `diverged` |', '(chain: decision)'],
    ['archive: the base-fingerprint check (diverged)', archive, '### Divergence inflection prompt', '(chain: decision)'],
    ['archive: critical audit findings', archive, '| **≥1 CRITICAL findings** |', '(chain: decision)'],
  ];
  for (const [row, text, anchor, tag] of ROWS) {
    it(`${row} → ${tag}`, () => {
      expect(lineWith(text, anchor)).toContain(tag);
    });
  }
  for (const [row, prev] of [['archive: incomplete artifacts', 'Display warning listing incomplete artifacts'], ['archive: incomplete tasks', 'Display warning showing count of incomplete tasks']]) {
    it(`${row} → (chain: decision)`, () => {
      const line = lineAfter(archive, prev);
      expect(line).toContain('Use **AskUserQuestion tool** to confirm user wants to proceed');
      expect(line).toContain('(chain: decision)');
    });
  }

  it('each routine tag appears once across the surface: the table has three routine prompt lines', () => {
    const all = scanned().map(([, t]) => t.split(CHAIN_END_STEP).join('')).join('\n');
    for (const tag of ROUTINE_TAGS) expect(all.split(tag).length - 1, tag).toBe(1);
    expect(all.match(/\(chain: routine, [^)]*\)/g)).toHaveLength(3);
  });

  // @scenario text orbit-conventions :: A chain treats each prompt by its kind :: A chained archive takes the sync default
  it('a chained archive takes the sync default and records it', () => {
    expect(lineWith(archive, '"Sync now (recommended)", "Archive without syncing"')).toContain('(chain: routine, default: Sync now)');
    const granted = lineWith(archive, '- **Granted** (an AI-mediated arrival');
    expect(granted).toContain("a routine prompt takes the default its tag names, and the run summary's `final_assessment` records `The chain took the default: <prompt> — <answer>.`");
    expect(granted).not.toMatch(/\(chain: /);
  });

  // @scenario text orbit-conventions :: A chain treats each prompt by its kind :: A pause in a chained apply stops the chain
  it('a pause in a chained apply is a decision: asked as on a typed apply, and the chain stops after it', () => {
    expect(lineWith(apply, 'Task is unclear → ask for clarification')).toContain('(chain: decision)');
    expect(apply).toContain(CHAIN_END_STEP);
    expect(CHAIN_END_STEP).toContain('the command\'s own closing step states in one line that the chain stopped at a decision and runs nothing');
  });

  // @scenario text orbit-conventions :: A chain treats each prompt by its kind :: Unaddressed markers stop a chained archive
  it('the marker prompt in a chained archive is a decision, asked as on a typed archive', () => {
    // archive: unaddressed `@review:` markers → (chain: decision), on the line right after the warning block.
    expect(lineExact(archive, 'Prompt via `AskUserQuestion` (chain: decision):')).toContain('(chain: decision)');
    const step = archive.slice(archive.indexOf('## NEW Step 1.5'), archive.indexOf('## NEW Step 3.2'));
    expect(step).toContain('Prompt via `AskUserQuestion` (chain: decision):\n\n- **Address now**');
    expect(lineWith(archive, '- **Granted** (an AI-mediated arrival')).toContain('a decision prompt is asked exactly as on a typed arrival, and the chain does not continue after it');
  });

  // @scenario text orbit-conventions :: A chain treats each prompt by its kind :: The sign-off stops a chained archive
  it('the sign-off in a chained archive is a decision: the copy shown and asked as on a typed archive, and the chain stops after it', () => {
    const step = archive.slice(archive.indexOf('## NEW Step 3.7'), archive.indexOf('## NEW Step 4.9'));
    expect(step).toContain('show it to the user WHOLE');
    expect(lineWith(step, '2. Ask with the **AskUserQuestion tool**')).toContain(
      '(chain: decision) — a decision prompt: an archive the `chain` object allowed asks it exactly as an archive the user typed, and the chain does not continue after it'
    );
    expect(lineWith(archive, '- **Granted** (an AI-mediated arrival')).toContain('a decision prompt is asked exactly as on a typed arrival, and the chain does not continue after it');
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
