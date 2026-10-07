import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate } from '../../../src/core/templates/workflows/review.js';
import { getOnboardSkillTemplate } from '../../../src/core/templates/workflows/onboard.js';

/**
 * rc17b-blind-pair-command tasks 2.3, 3.3, 4.4 and 5.1 — template fidelity for the review trunk's
 * reviewer axis, the new `references/blind-pair.md`, the external-handoff reference's pair-half edits,
 * and onboard's pointers. The git steps themselves are exercised by
 * `test/integration/external-runner/pair.test.ts`; these assertions hold the TEXT an agent reads.
 */

const review = getReviewSkillTemplate();
const trunk = review.instructions;
const refOf = (name: string) => review.references!.find((r) => r.name === name)!.content;
const pairRef = refOf('blind-pair.md');
const handoff = refOf('external-handoff.md');
const onboard = getOnboardSkillTemplate().instructions;

describe('rc17b — the review trunk (task 2.3)', () => {
  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Each shorthand is its reviewer value
  it('the axis carries four values, each with one shorthand that is exactly --reviewer <value>', () => {
    expect(trunk).toContain('`--reviewer in-context|fresh|external|blind-pair` (default `in-context`)');
    expect(trunk).toContain('`--in-context`, `--fresh`, `--external`, `--blind-pair`');
    for (const v of ['in-context', 'fresh', 'external', 'blind-pair']) {
      expect(trunk).toMatch(new RegExp(`\\| \`--${v}\` \\| off[^|]*\\| Exactly \`--reviewer ${v}\``));
    }
  });

  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Shorthand and explicit reviewer flags do not combine
  it('the selector table: at most one selector, agreeing forms included, and an unknown value is a usage error', () => {
    const table = trunk.split('**Reviewer selectors.**')[1].split('If a flag is specified for the wrong mode')[0];
    expect(table).toContain('every error row is a clean usage error that runs no pass and writes no file');
    expect(table).toContain('| none | `--reviewer in-context`, the default |');
    expect(table).toContain('| exactly one shorthand | exactly `--reviewer <its value>` |');
    expect(table).toContain('two shorthands, or a shorthand with an explicit `--reviewer` — even when they agree | usage error naming the shorthand equivalence');
    expect(table).toContain('| a `--reviewer` value outside the four | usage error naming the four');
  });

  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Architecture mode rejects the external and blind-pair reviewers
  it('external and blind-pair, by either spelling, are refused with --as architecture, writing no prompt and no T0', () => {
    expect(trunk).toContain('`--reviewer external` and `--reviewer blind-pair`, by either spelling, REQUIRE `--as proposal|system`');
    expect(trunk).toContain('writes no prompt file and no T0 emit');
    expect(trunk).toContain('| `external` or `blind-pair`, by either spelling, with `--as architecture` | usage error');
  });

  // @scenario text orbit-review :: Review command available with `--as` mode flag :: External reviewer class dispatches to the handoff branch
  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Blind-pair reviewer dispatches to the pair reference
  it('dispatch: external loads the handoff reference, blind-pair loads both, the internal branches neither', () => {
    expect(trunk).toContain('`external` dispatches to the EXTERNAL-HANDOFF BRANCH: load `references/external-handoff.md`');
    expect(trunk).toContain('then either prints the chat invocation snippet for paste or, with a reachable recorded runner, launches that runner and saves its return; no pass of the internal classes runs in that invocation');
    expect(trunk).toContain('`blind-pair` loads `references/blind-pair.md` AND `references/external-handoff.md` and follows the pair reference');
    expect(trunk).toContain('The in-context and fresh branches load neither reference.');
  });

  it('the retired packaging-only sentence is gone', () => {
    expect(trunk).not.toContain('no review passes run in that invocation');
    expect(trunk).not.toContain('`--reviewer in-context|fresh|external` (default');
  });

  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Invoke with change name and explicit mode
  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Per-mode reference loading
  it('the resolved mode loads only its own pass reference', () => {
    expect(trunk).toContain('Load `references/passes-<mode>.md` for the RESOLVED mode');
    expect(trunk).toContain("Only the resolved mode's reference is loaded; the other two stay lazy.");
  });

  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Invoke architecture mode with doc name
  it('architecture mode resolves a doc and errors on legacy and malformed docs', () => {
    expect(trunk).toContain("prompt over `orbit architecture status --json`'s parseable docs");
    expect(trunk).toContain('A doc resolving LEGACY (zero stage-prefixed headings outside fences) is an error suggesting retrofit; MALFORMED (fails the near-miss rule) is an error naming the grammar violation.');
  });

  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Invoke without change name
  // @scenario text orbit-review :: Review command available with `--as` mode flag :: Mode inference when `--as` omitted
  it('an omitted change prompts over orbit list; an omitted mode infers from tasks, never architecture', () => {
    expect(trunk).toContain('otherwise prompt via `AskUserQuestion` over `orbit list --json`');
    expect(trunk).toContain('**Architecture mode is NEVER inferred**');
    expect(trunk).toMatch(/all unchecked → `proposal`; all checked \+ code changes[^]*→ `system`; mixed or ambiguous → `AskUserQuestion`/);
  });

  // @scenario text orbit-review :: `--fresh` runs pass work in a clean execution context :: Fresh pass execution
  it('a fresh pass runs in a clean-context subagent and persists as reviewer_class fresh', () => {
    const fresh = trunk.split('### Dispatching a fresh pass')[1].split('### 6. Run passes')[0];
    expect(fresh).toContain('never a fork of this conversation');
    expect(fresh).toContain('The subagent persists through `orbit emit review` with `reviewer_class: "fresh"`');
  });

  // @scenario text orbit-review-external :: A pair's external half reads the pair's reviewed state :: A fresh re-run is briefed with the reviewed commit
  it("a fresh re-run of a pair's missing half is briefed with the reviewed commit and still emits from the root", () => {
    const fresh = trunk.split('### Dispatching a fresh pass')[1].split('### 6. Run passes')[0];
    const rerun = fresh.split("**A re-run of a blind pair's missing fresh half.**")[1];
    expect(rerun).toContain('`openPair: {missing: "fresh"}`');
    expect(rerun).toContain('`git log --diff-filter=A --format=%H -- <L\'s T0 path> | tail -1`');
    expect(rerun).toContain('`git rev-parse <BASE>^1`');
    // System walk (Sal: A′): after an apply later than L, the commit before the landed external member's.
    expect(rerun).toContain('the REVIEWED COMMIT is `git rev-parse <M>^1`');
    expect(rerun).toContain('the engine counts this run as the pair\'s missing member');
    expect(rerun).toContain('Review the repository as it stands at commit <REVIEWED COMMIT>, not the live checkout');
    // System walk (external W1): the skill's own CLI readings describe the live checkout.
    expect(rerun).toContain('that output describes the live checkout, not the reviewed commit');
    expect(rerun).toContain('say in the pass which readings came from the live checkout');
    expect(rerun).toContain('Run orbit emit review from the repository root as usual.');
    expect(rerun).toContain('this run is an ordinary single on the current state');
    expect(rerun).not.toContain('running an ordinary single fresh review');
    // The brief itself is untouched: the line is appended only on a re-run.
    expect(fresh.split('```')[1]).not.toContain('REVIEWED COMMIT');
  });
});

describe('rc17b — the pair reference (task 3.3)', () => {
  const steps = pairRef.split('## Steps')[1].split('## Session end')[0];
  const order = [
    '### 1. Preflight and the runner',
    '### 2. The launch',
    '### 3. BASE',
    '### 4. The route',
    '### 5a. The external half, launched',
    '### 5b. The external half, pasted',
    '### 5c. The fresh half',
    '### 6. Wait',
    '### 7. The fresh pass file',
    '### 8. The external return',
    '### 9. The saved return',
    '### 10. Push',
    '### 11. The worktree',
    '### 12. Reports',
    '### 13. End',
  ];

  it('carries the thirteen steps in order and names its owner', () => {
    let at = -1;
    for (const h of order) {
      const i = steps.indexOf(h);
      expect(i, h).toBeGreaterThan(at);
      at = i;
    }
    expect(pairRef).toContain("`orbit-review`'s `The blind-pair reviewer runs both halves in one invocation`");
  });

  it('reads the runner ONCE at step 1, before the packaging, and names the handoff reference rather than restating it', () => {
    const s1 = steps.split('### 1.')[1].split('### 2.')[0];
    expect(s1).toContain('orbit external runner --json');
    expect(s1).toContain('the runner is never read again in this run');
    expect(steps.indexOf('orbit external runner --json')).toBeLessThan(steps.indexOf('### 2. The launch'));
    expect(steps).toContain("the handoff reference's Steps 4–7");
    expect(steps).toContain("the handoff reference's 9b");
    expect(steps).toContain("the trunk's **Dispatching a fresh pass**");
  });

  it('the save comes after the fresh commit, with --launch L', () => {
    const s8 = steps.split('### 8.')[1].split('### 9.')[0];
    expect(s8).toContain('only after Step 7 — or once the fresh half is known MISSING');
    expect(s8).toContain('orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <L> --json');
    expect(steps.indexOf('### 7. The fresh pass file')).toBeLessThan(steps.indexOf('orbit external save'));
  });

  it('every commit path uses git add then git commit --only, and the saved return is committed by -F with no push of its own', () => {
    expect(steps).toContain('git add <prompt-path> <t0-path>\ngit commit --only <prompt-path> <t0-path>');
    expect(steps).toContain('git add <fresh-path>\ngit commit --only <fresh-path>');
    expect(steps).toContain("git add <saved-path>\ngit commit --only <saved-path> -F '<run-dir>/commit-msg.txt'");
    expect(steps.split('### 9.')[1].split('### 10.')[0]).toContain("WITHOUT 9d's `git push`");
    expect(steps.split('### 10.')[1].split('### 11.')[0]).toContain('ONCE, after Steps 7 and 9');
  });

  it('runs both halves in the background and never waits on a timeout', () => {
    expect(steps.split('### 5a.')[1].split('### 5b.')[0]).toContain('run_in_background');
    expect(steps.split('### 5c.')[1].split('### 6.')[0]).toContain('run_in_background');
    expect(steps.split('### 6.')[1].split('### 7.')[0]).toContain('invent no timeout');
  });

  // @scenario text orbit-review :: The blind-pair reviewer runs both halves in one invocation :: The pair does not walk its findings
  it('ends at the readout and never invokes the walk', () => {
    const end = steps.split('### 13. End')[1];
    expect(end).toContain('Ready when you are: <next_command>');
    expect(end).toContain('The walk is NEVER invoked: `/orbit:address-reviews` is the user\'s to run (no-chaining)');
    // The walk command appears only in that prohibition.
    const mentions = pairRef.split('\n').filter((l) => l.includes('/orbit:address-reviews'));
    expect(mentions).toHaveLength(1);
  });

  it('the no-runner and failed-external endings, the trail-read landing, the dirty-tree refusal, and the other-flags rule', () => {
    const s1 = steps.split('### 1.')[1].split('### 2.')[0];
    expect(s1).toContain('ANY output refuses the pair: write NOTHING — no prompt file, no T0 — dispatch no subagent, launch no runner');
    const s6 = steps.split('### 6.')[1].split('### 7.')[0];
    expect(s6).toContain('read from the TRAIL, never from the worker\'s exit');
    expect(s6).toContain('however the worker ended');
    expect(s6).toContain('the fresh half is MISSING');
    const s5b = steps.split('### 5b.')[1].split('### 5c.')[0];
    expect(s5b).toContain('when it did not, `Handoff blocked: the handoff commit <short-sha> is not pushed.');
    const end13 = steps.split('### 13. End')[1];
    expect(end13).toContain('the pair ends OPEN and no half covers alone; read what the gate reports from that same status JSON, never from this text');
    // System walk (fresh S1): both missing sets no openPair.
    expect(end13).toContain('with BOTH missing it carries no `openPair` and its reason says neither member has landed');
    expect(steps.split('### 8.')[1].split('### 9.')[0]).toContain("the handoff reference's **A failed run** paragraph");
    expect(pairRef).toContain('the fresh half as under `--reviewer fresh`, the external half as under `--reviewer external`');
  });

  it('the session-end recovery line names the uncommitted fresh pass file beside the raw-return save', () => {
    const end = pairRef.split('## Session end')[1];
    // System walk (external W4): conditional on a fresh pass file having landed.
    expect(end).toMatch(/first, IF a fresh pass file landed[^`]*commit it alone[^`]*with none, the pair stays open missing its fresh half[^`]*then save the return with: orbit external save <change-name> --as <as> --from <run-dir>\/return\.md --launch <L>/);
    expect(end).toContain('On the PASTED route print: `If this session ends before the fresh half does: IF a fresh pass file landed');
    expect(end).not.toContain('first commit the fresh pass file alone');
  });
});

describe('rc17b — the external-handoff reference (task 4.4)', () => {
  const step3b = handoff.split("**3b. A blind pair's half.**")[1].split('### 4. Count iterations')[0];

  it('step 3b decides the half, and outside a pair nothing in it applies', () => {
    expect(step3b).toContain('Outside a pair, nothing in this step applies and every later step reads as written.');
    expect(step3b).toContain("`orbit-review-external`'s `A pair's external half reads the pair's reviewed state`");
  });

  // @scenario text orbit-review-external :: A pair's external half reads the pair's reviewed state :: A single external outside a pair is unchanged
  it('a single external outside a pair reads as before: worktree at the handoff commit, its own T0 token', () => {
    expect(step3b).toContain('**Any other state** — no `openPair` for the mode, or one missing `fresh` — a single; nothing here applies.');
    expect(handoff).toContain('git worktree add --detach <run-dir>/worktree <handoff-sha>');
    expect(handoff).toContain('orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <T0 token> --json');
    // Every pair addition to the shared steps is conditioned on the pair.
    for (const added of [
      "On a RE-RUN of a pair's missing external half (Step 3b), its WORKTREE COMMIT replaces `<handoff-sha>`",
      "On a pair's re-run the redirect reads the LIVE CHECKOUT's copy",
      "**In a pair's first run, stop here and return control to `references/blind-pair.md`**",
      "for a pair half, the pair's REVIEWED COMMIT in place of `<handoff-sha>` (Step 3b)",
    ]) {
      expect(handoff).toContain(added);
    }
  });

  it('a re-run: BASE and --launch L with no apply later than L; after one, the commit before the landed member and its own token', () => {
    expect(step3b).toContain('`openPair: {missing: "external"}`, the run is a RE-RUN');
    expect(step3b).toContain("`git log --diff-filter=A --format=%H -- <L's T0 path> | tail -1` (a hash-only read)");
    expect(step3b).toContain('its own T0 WITHOUT `pair`');
    expect(step3b).toContain('The worktree commit is BASE; the save token is L');
    // System walk (fresh C1, Sal: A′): never a single while openPair stands.
    expect(step3b).toContain("the engine counts this run as the pair's missing member — never a single");
    expect(step3b).toContain('The REVIEWED COMMIT is the state that member reviewed: `git rev-parse <M>^1`');
    expect(step3b).toContain("the save token is this run's OWN T0 token, which is later than the apply");
    expect(step3b).toContain("9b adds the worktree at the WORKTREE COMMIT, never at the re-run's own handoff commit");
    expect(step3b).toContain('9d saves with `--launch <SAVE TOKEN>`');
    // System walk (external W3): the stale-member notice, checked before the single exit.
    expect(step3b).toContain("**No `openPair`, and the latest launch's one landed member is STALE** — read from the trail, never from the gate's reason");
    expect(step3b).toContain('an `apply-*.json` token is later than the member\'s token');
    expect(step3b.indexOf('is STALE**')).toBeLessThan(step3b.indexOf('**Any other state**'));
    // System verification (V1): the reason-string test is gone from both bodies.
    expect(handoff).not.toContain("the gate's reason names a member of the latest launch as stale");
    expect(trunk).not.toContain("the gate's reason names a member of the latest launch as stale");
    expect(trunk).toContain('read from the trail: exactly one landed member later than L');
    expect(step3b).not.toContain('**An apply token later than L** — NOT a re-run');
  });

  it('a re-run states its worktree commit and save token in the launch output and the recovery line (system walk, fresh W1)', () => {
    expect(handoff).toContain("on a pair's RE-RUN, `launched <name> at <worktree-commit short-sha>, the pair's reviewed state` in place of `at that commit`");
    expect(handoff).toContain("on a pair's RE-RUN, Step 3b's SAVE TOKEN in place of `<T0 token>`");
  });

  it("a pasted pair half's system read list ends at the reviewed commit, not HEAD (system walk, external W2)", () => {
    expect(handoff).toContain('in system mode the read list\'s commit range ends at that commit, not `HEAD` (`git diff <change-start>..<REVIEWED COMMIT>`)');
  });

  // @scenario text orbit-review-external :: A pair's external half reads the pair's reviewed state :: A pasted pair half names the reviewed commit
  // @scenario text orbit-review-external :: A pair's external half reads the pair's reviewed state :: A failed re-run's fallback names the reviewed commit
  it("a pasted half's Repo line and a failed launch's fallback name the reviewed commit", () => {
    expect(handoff).toContain("the prompt's `## Repo` line (Step 7) reads `<repo URL or path> — read the repository at commit <REVIEWED COMMIT>`");
    expect(handoff).toContain("when a LAUNCHED pair half fails, the paste fallback's commit line (9d) names the REVIEWED COMMIT in place of `<handoff-sha>`");
  });

  it("in a pair, 9d returns control to the pair reference: the save waits, and there is no push of its own", () => {
    const d = handoff.split('**9d. The return.**')[1].split('**A failed run**')[0];
    expect(d).toContain("the save waits until the pair's fresh pass file is committed (or the fresh half is known missing)");
    expect(d).toContain("the pair's one push follows both commits");
  });
});

describe('rc17b — onboard points instead of enumerating (task 5.1)', () => {
  // @scenario text orbit-onboard :: Identity statement section :: Enumerates orbit-distinctive layers
  it('names the reviewer axis and leaves its values to the review skill; no "commits findings back"', () => {
    expect(onboard).toContain('`/orbit:review` also carries a REVIEWER axis');
    expect(onboard).toContain("its values and their shorthands are the review skill's to state, not this page's");
    expect(onboard).not.toContain('commits findings back');
    expect(onboard).not.toMatch(/--reviewer in-context\\?\|fresh\\?\|external/);
    expect(onboard).toContain('`--reviewer` picks who runs the pass — the review skill lists its values and shorthands.');
    for (const layer of ['/orbit:address-reviews', '/orbit:audit-drift', 'orbit/lenses/perspectives.md', '/orbit:architect']) {
      expect(onboard).toContain(layer);
    }
  });

  // @scenario text orbit-onboard :: Identity statement section :: Self-contained-fork framing
  // @scenario text orbit-onboard :: Identity statement section :: No augmentation / overlay language
  it('keeps the self-contained-fork framing and no overlay language', () => {
    expect(onboard).toContain('self-contained');
    expect(onboard).toContain('@fission-ai/openspec@1.3.1');
    for (const p of ['augments cleanly', 'overlay on top of', 'layered on top of', 'extends upstream']) {
      expect(onboard).not.toContain(p);
    }
  });
});
