import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate } from '../../../src/core/templates/workflows/review.js';

/**
 * rc17d-external-runner task 4.6 — the external-handoff reference's launch branch. The paste route's
 * five chat items are pinned byte-equal to their text before runners existed (captured from the
 * proposal commit's reference); the launch branch must name the runner read, the save with its launch
 * token, the worktree as working directory, the quoting rule, stdin by redirect and the commit-alone
 * step, and must never instruct `sh -c`.
 */

const ref = getReviewSkillTemplate().references!.find((r) => r.name === 'external-handoff.md')!.content;

// Items 1–5 of Step 8, as the reference carried them at 41e9206e.
const PASTE_ITEMS_BEFORE_RUNNERS = "1. **(optional)** Mode-inference note when `--as` was omitted: `Generating external-review prompt as \\`<as>\\` (inferred from tasks state).`\n2. **(required)** Recommended-session note: `Recommended session: <phrasing from Step 6>`\n3. **(required)** The prompt file path: `Prompt: orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md`\n4. **(conditional — preflight gate)** ONE of:\n   - **Preflight satisfied** (clean tree, no unpushed commits — or local-path route): FIRST affirmatively state the prompt's committed-and-pushed state with evidence — `Prompt committed (<short-sha>) and pushed to <remote>/<branch>` (or, on the local-path route, the equivalent naming the path) — NEVER implied by the mere absence of a warning; THEN the copy-paste-ready invocation: `Pull <repo URL> and read <prompt-file-path>. Follow its instructions; write findings to the path specified inside.` (Get `<short-sha>` from `git rev-parse --short HEAD` and `<remote>/<branch>` from `git rev-parse --abbrev-ref --symbolic-full-name @{u}` after the push.)\n   - **Preflight failed** (dirty tree and/or unpushed commits): the pull invocation is WITHHELD. Emit instead: `Handoff blocked: <dirty tree | N unpushed commit(s)>. Commit the pending work (including the prompt file above) and push, then hand off: Pull <repo URL> and read <prompt-file-path>. ...` — the commit+push action leads; the pull text is framed as the after-push step, never as an immediately-usable instruction.\n5. **(required)** The eventual findings path: `When findings come back: /orbit:address-reviews --from-file orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md (TS will be set by the external AI when it writes).`\n";

describe('rc17d — the external-handoff reference', () => {
  // @scenario text orbit-review-external :: A recorded runner launches the external review :: No recorded runner is today's handoff
  it('the paste route keeps its five items byte-unchanged, with item 6 the only addition', () => {
    const at = ref.indexOf(PASTE_ITEMS_BEFORE_RUNNERS);
    expect(at).toBeGreaterThan(-1);
    const after = ref.slice(at + PASTE_ITEMS_BEFORE_RUNNERS.length);
    expect(after.startsWith('6. **(conditional — a recorded runner with `reachable: false`)** `Recorded runner <argv[0]> not found on PATH — printing the prompt for paste.`\n\nNo other items.')).toBe(true);
  });

  it('reads the runner at the preflight step and leaves the no-runner branch unchanged', () => {
    const step3 = ref.split('### 3. Handoff preflight')[1].split('### 4. Count iterations')[0];
    expect(step3).toContain('orbit external runner --json');
    expect(step3).toContain('`{"runner": null}` → the branch is UNCHANGED');
    expect(step3).toMatch(/dirty working tree, read BEFORE the prompt file is written[^]*write NOTHING \(no prompt file, no T0\)/);
  });

  // @scenario text orbit-review-external :: A recorded runner launches the external review :: A recorded runner launches with no paste
  it('the launch branch names the worktree, the quoting rule, stdin by redirect and the save with its launch token', () => {
    const step9 = ref.split('### 9. Launch the recorded runner')[1].split('## Reference prompt template')[0];
    expect(step9).toContain('git worktree add --detach <run-dir>/worktree <handoff-sha>');
    expect(step9).toContain("cd '<run-dir>/worktree' && '<argv[0]>'");
    expect(step9).toContain("writing an embedded `'` as `'\\''`");
    expect(step9).toContain("< '<run-dir>/worktree/<prompt-path>'");
    expect(step9).toContain('run_in_background');
    expect(step9).toContain('orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <T0 token> --json');
    expect(step9).toContain('git worktree remove --force <run-dir>/worktree');
  });

  // @scenario text orbit-review-external :: A launched return is committed alone and pushed :: The return is its own commit
  it('commits the handoff pair and then the saved return alone, each with git add then git commit --only', () => {
    expect(ref).toContain('git add <prompt-path> <t0-path>\ngit commit --only <prompt-path> <t0-path>');
    expect(ref).toContain('git add <saved-path>\ngit commit --only <saved-path>');
  });

  it('the return commit message is data: written to a file and passed with -F, never -m with the removed lines (system walk)', () => {
    const step9 = ref.split('### 9. Launch the recorded runner')[1].split('## Reference prompt template')[0];
    expect(step9).toContain("git commit --only <saved-path> -F '<run-dir>/commit-msg.txt'");
    expect(step9).toContain('NEVER interpolate it into `-m "…"`');
    expect(step9).not.toMatch(/-m "External review \(<as>, iter <N>\)[^"]*Removed above/);
  });

  it('the launch is scoped to a subshell and the return steps run from the repository root (system walk)', () => {
    expect(ref).toContain("( cd '<run-dir>/worktree' && '<argv[0]>'");
    expect(ref).toContain('Every step from here runs from the REPOSITORY ROOT');
  });

  it('the failed-run fallback carries the session note and the Repo-line correction; an apply after launch has none (system walk)', () => {
    const failed = ref.split('**A failed run**')[1].split('**Named limits.**')[0];
    expect(failed).toContain('Step 8 item 2 (the recommended-session note');
    expect(failed).toContain("names the launch worktree, now removed — read the repository at <repo URL, or the live checkout's path> at commit <handoff-sha> instead.");
    expect(failed).toContain('An apply after the launch is the one failure with NO paste fallback');
  });

  it('the session-ended recovery keeps --launch, the commit-alone step and the worktree removal (system walk)', () => {
    expect(ref).toContain('orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <T0 token>, commit the saved file alone, and run git worktree remove --force <run-dir>/worktree');
  });

  it('never instructs sh -c: every mention is a prohibition', () => {
    const lines = ref.split('\n').filter((l) => l.includes('sh -c'));
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l).toMatch(/NEVER hand a recorded string to `sh -c`/);
  });

  // @scenario text orbit-review-external :: A recorded runner launches the external review :: A failed run falls back to paste
  it('a failed run commits nothing and prints the paste fallback by push outcome', () => {
    expect(ref).toMatch(/\*\*A failed run\*\*[^\n]*commits NOTHING for the return[^\n]*the Step 8 item 4 pull invocation with its attestation when the handoff push landed, the Step 8 handoff-blocked output when it did not/);
  });

  it('the old packaging-only phrasing is gone', () => {
    expect(ref).not.toContain('Does NOT run the review');
    expect(ref).not.toContain('solely to package the handoff');
    expect(ref).not.toContain('The branch emits **two things**');
    expect(ref).not.toContain('The command does not run the review and does not ingest findings');
    expect(ref).toContain('Runs the review ONLY through the user\'s recorded runner, and NEVER ingests findings.');
  });
});
