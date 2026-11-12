import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { CHAIN_END_STEP, COMMIT_STEP, COMMIT_STEP_SKILLS } from '../../../src/core/disciplines.js';
import { ownerText } from '../../helpers/owner-text.js';

/**
 * chained-review-commit, task 2.4 — the commit step's carriage (`orbit-conventions`' `The commit step closes each
 * carrying body`): the carrying set is the owner's table, read row by row; each carrying body holds `COMMIT_STEP`
 * byte-equal exactly once, at the position its row names; no other body holds it.
 */

const skills = getSkillTemplates();
const body = (dir: string): string => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template.instructions;
};

/** The table's body names, as the skill directories they generate. */
const DIR_OF: Record<string, string> = {
  propose: 'orbit-propose',
  ff: 'orbit-ff-change',
  apply: 'orbit-apply-change',
  review: 'orbit-review',
  'address-reviews': 'orbit-address-reviews',
  archive: 'orbit-archive-change',
  new: 'orbit-new-change',
  continue: 'orbit-continue-change',
  'bulk-archive': 'orbit-bulk-archive-change',
  architect: 'orbit-architect',
  'audit-drift': 'orbit-audit-drift',
  'sync-specs': 'orbit-sync-specs',
  verify: 'orbit-verify-change',
  explore: 'orbit-explore',
  onboard: 'orbit-onboard',
};

async function ownerTable(): Promise<Array<{ dirs: string[]; yes: boolean }>> {
  const head = '| body | carries the step |';
  const text = await ownerText('orbit-conventions', head);
  const lines = text.slice(text.indexOf(head)).split('\n');
  const end = lines.findIndex((l) => !l.startsWith('|'));
  return lines
    .slice(2, end < 0 ? lines.length : end)
    .map((row) => row.split('|').map((c) => c.trim()))
    .map(([, names, carries]) => ({
      dirs: names.split(',').map((n) => {
        const dir = DIR_OF[n.trim()];
        if (!dir) throw new Error(`the owner's table names an unknown body '${n.trim()}'`);
        return dir;
      }),
      yes: carries.startsWith('yes'),
    }));
}

describe('the commit step: carriage (chained-review-commit)', () => {
  it("the carrying set is the owner's table, and the table covers every generated body", async () => {
    const rows = await ownerTable();
    const yes = rows.filter((r) => r.yes).flatMap((r) => r.dirs).sort();
    expect(yes).toEqual([...COMMIT_STEP_SKILLS].sort());
    expect(rows.flatMap((r) => r.dirs).sort()).toEqual(skills.map((s) => s.dirName).sort());
  });

  // @scenario text orbit-conventions :: The commit step closes each carrying body :: Every carrying body carries the step byte-equal
  it('each carrying body holds COMMIT_STEP byte-equal exactly once; no other body holds it (verify and explore among them)', () => {
    const carrying = new Set<string>(COMMIT_STEP_SKILLS);
    for (const s of skills) {
      const text = s.template.instructions;
      if (carrying.has(s.dirName)) {
        expect(text.split(COMMIT_STEP).length - 1, s.dirName).toBe(1);
      } else {
        expect(text, s.dirName).not.toContain('## Commit step');
        expect(text, s.dirName).not.toContain('orbit pr commit');
      }
    }
    expect(carrying.has('orbit-verify-change')).toBe(false);
    expect(carrying.has('orbit-explore')).toBe(false);
  });

  // @scenario text orbit-conventions :: The commit step closes each carrying body :: The step's lines precede the readout
  it('the step runs after the run summary and before the readout; in the chaining bodies it immediately precedes the chain end step', () => {
    expect(COMMIT_STEP).toContain("after the command's run summary is written (in archive, after the PR-attached tail) and BEFORE the position readout (in archive, the completion readout), so its lines precede the readout and the eligibility line, and the chain end step, in a body that carries one, still follows them.");
    for (const dir of ['orbit-propose', 'orbit-ff-change', 'orbit-apply-change', 'orbit-review', 'orbit-address-reviews']) {
      const text = body(dir);
      expect(text, dir).toContain(`${COMMIT_STEP}\n\n${CHAIN_END_STEP}`);
      const summary = Math.max(text.lastIndexOf('## Run-summary emit'), text.lastIndexOf('Persist the run summary'), text.lastIndexOf('### 9. Persist via the emit surface'));
      expect(summary, dir).toBeGreaterThan(-1);
      expect(text.indexOf(COMMIT_STEP), dir).toBeGreaterThan(summary);
    }
    const archive = body('orbit-archive-change');
    const at = archive.indexOf(COMMIT_STEP);
    expect(at).toBeGreaterThan(archive.indexOf('## NEW Step 5.6 — The PR-attached tail'));
    expect(at).toBeLessThan(archive.indexOf('## NEW Step 5.65'));
    expect(archive).not.toContain('## Chain end step');
  });

  it('apply runs it once at the session close, never at a chunk boundary', () => {
    expect(COMMIT_STEP).toContain("In apply it runs once, at the session's close, never at a chunk boundary.");
  });

  // @scenario text orbit-conventions :: The commit step closes each carrying body :: A stopped PR layer runs no commit step
  it('after the PR layer stopped (a non-zero exit, a failed select, publish or tail step) the step calls nothing', () => {
    expect(COMMIT_STEP).toContain("When this invocation's PR layer has already stopped — an earlier `orbit pr` call exited non-zero, or a step it printed failed (`select` or `publish` at propose or ff, the `tail` at archive) — the step calls nothing and prints nothing: no later PR step runs, and that failure's line stays the recovery the user runs.");
    // It is tested before the call: the clause precedes `Otherwise run`.
    expect(COMMIT_STEP.indexOf('PR layer has already stopped')).toBeLessThan(COMMIT_STEP.indexOf('Otherwise run `orbit pr commit'));
  });

  // @scenario text orbit-conventions :: The commit step closes each carrying body :: A walk with no change target calls nothing
  it('with no change target the step does nothing and calls nothing', () => {
    expect(COMMIT_STEP).toContain('With no change target — an architecture-mode review, a `--doc` walk, a project-wide walk — the step does nothing and calls nothing.');
  });

  // @scenario text orbit-conventions :: The commit step closes each carrying body :: A dispatched worker never commits
  it('a dispatched worker never runs it: the step says so, and the fresh-reviewer brief tells the worker to skip it', () => {
    expect(COMMIT_STEP).toContain("A worker that session dispatched — a fresh reviewer, a blind pair's fresh half — never runs it: it persists its pass and returns.");
    const review = body('orbit-review');
    const start = review.indexOf('You are the fresh-context reviewer');
    const brief = review.slice(start, review.indexOf('```', start));
    expect(brief).toContain("Skip the skill's closing Commit step and Chain end step too:\nonce your pass is persisted, return — never commit");
    expect(review).toContain("the invoking session's Commit step commits the pass");
  });

  it('the message file is written outside the working tree and kept until every printed step has run', () => {
    expect(COMMIT_STEP).toContain('to a file OUTSIDE the working tree (the OS temp directory), never inside it: the stage is `git add -A` and would commit the message itself. Keep that file until every printed step has run.');
  });

  it('it acts on every record shape: a non-zero exit, off, skip, proceed with and without a segment, degraded with or without one, a failed step', () => {
    expect(COMMIT_STEP).toContain('- **A non-zero exit** (a usage error, the only one) → report the error verbatim in ONE line and run nothing');
    expect(COMMIT_STEP).toContain('- **`action: off`** → print nothing and run nothing.');
    expect(COMMIT_STEP).toContain('- **`action: skip`** → write ONE line from `reason.code` and `reason.detail`');
    expect(COMMIT_STEP).toContain('- **`action: proceed` with no segment** → nothing is printed to run: run nothing.');
    expect(COMMIT_STEP).not.toContain('nothing is uncommitted and nothing is unpushed');
    expect(COMMIT_STEP).toContain('Then name, in ONE line, each path `observations.untracked` lists');
    // The degradation line is its own bullet, so a degraded proceed that printed no segment still says the push dropped.
    expect(COMMIT_STEP).toContain('- **`action: proceed` with `degraded: "pr"`**, with a segment or none → add ONE line saying the push was dropped, from `reason.code`.');
    expect(COMMIT_STEP).toContain("- **A step fails** → stop at that step and write ONE line naming the completed, the failed and the skipped steps by their `step` names");
  });

  // @scenario text orbit-conventions :: No-chaining contract :: A granted commit reaches a chained external review committed
  it("the chain end step's dirty-tree limit holds only where the commit step does not commit", () => {
    expect(CHAIN_END_STEP).toContain('A chained external review or blind pair needs a committed tree. Where the commit step commits (`commit: true` on the change\'s attached branch), it ran before this read, so the review arrives on a committed tree; anywhere else, on an uncommitted tree the pair and a launched external review each refuse and write nothing');
  });
});
