import { describe, it, expect } from 'vitest';
import { getReviewSkillTemplate } from '../../../src/core/templates/workflows/review.js';

/**
 * rc17d-external-runner task 5.3 — text declarations for the scenarios `orbit-review-external`'s
 * MODIFIED blocks carry. Each test reads the generated reference that carries the scenario's THEN and
 * asserts the clause the THEN is about. The behaviour of an external AI following the prompt is not
 * observable here; what is held is the text the body and the prompt template ship.
 */

const refs = Object.fromEntries(getReviewSkillTemplate().references!.map((r) => [r.name, r.content]));
const handoff = refs['external-handoff.md'];
const template = refs['prompt-template.md'];
const modes = refs['mode-sections.md'];
const step = (n: string, next: string): string => handoff.split(`### ${n}`)[1].split(`### ${next}`)[0];

describe('orbit-review-external — carried scenarios (rc17d task 5.3)', () => {
  // @scenario text orbit-review-external :: Review-external command available :: Invoke with change name and mode
  it('writes the prompt to the versioned trail path and takes the paste or the launch route', () => {
    expect(step('7. Write the prompt file', '8. Emit')).toContain('orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md');
    expect(handoff).toContain('**With no runner launched**');
    expect(handoff).toContain('**With the user\'s recorded runner reachable**');
  });

  // @scenario text orbit-review-external :: Review-external command available :: Invoke without change name
  it('with no change name, lists changes and asks', () => {
    const s1 = step('1. Resolve the change', '2. Resolve the mode');
    expect(s1).toContain('`orbit list --json`');
    expect(s1).toContain('**AskUserQuestion**');
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Prompt file path
  it('the prompt path carries an ISO token and the file is committed', () => {
    const s7 = step('7. Write the prompt file', '8. Emit');
    expect(s7).toMatch(/`<TS>` is ISO-8601 with hyphens/);
    expect(s7).toContain('The file is **committed**, not gitignored.');
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Prompt file contents
  it('the template carries role, repo, project context, the iteration-only cycle context, mode sections, severity and output format', () => {
    for (const h of ['## Repo', '## Project context (read first)', '## Cycle context', '## What to read for THIS review', '## What to look for', '## Severity', '## Output format — write to:']) {
      expect(template).toContain(h);
    }
    const cycle = template.split('## Cycle context')[1].split('## What to read')[0];
    expect(cycle).toContain('- Iteration: <N>');
    expect(cycle).not.toMatch(/\.orbit-runs/);
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Chat invocation snippet
  it('the paste route prints its items in order, item 6 only for an unresolved runner', () => {
    const s8 = step('8. Emit the chat invocation snippet (no runner launched)', '9. Launch');
    const order = ['1. **(optional)** Mode-inference note', '2. **(required)** Recommended-session note', '3. **(required)** The prompt file path', '4. **(conditional — preflight gate)**', '5. **(required)** The eventual findings path', '6. **(conditional — a recorded runner with `reachable: false`)**'];
    const at = order.map((o) => s8.indexOf(o));
    expect(at.every((i) => i > -1)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(s8).toContain('No other items.');
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Chat output when a runner launches
  it('the launch route prints the runner line, the attestation pushed only when landed, the raw path with its recovery', () => {
    const e = handoff.split('**9e. Chat output (launch route)**')[1].split('## Reference prompt template')[0];
    expect(e).toContain('`Launching <name> — your recorded external runner; no paste needed`');
    expect(e).toContain('`Prompt committed (<short-sha>); launched <name> at that commit`');
    expect(e).toMatch(/pushed to <remote>\/<branch>`? ONLY when the push landed/);
    expect(e).toContain('orbit external save <change-name> --as <as> --from <run-dir>/return.md');
    expect(e).toMatch(/`Findings committed \(<short-sha>\)` followed by `? and pushed` ONLY when that push landed/);
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Mode-specific sections
  it('proposal mode lists 9 passes and system mode 7', () => {
    const proposal = modes.split('## Proposal mode — "What to look for" (9 passes)')[1].split('## System mode')[0];
    const system = modes.split('## System mode — "What to look for" (7 passes)')[1];
    expect(proposal.match(/^\d+\. \*\*/gm)).toHaveLength(9);
    expect(system.match(/^\d+\. \*\*/gm)).toHaveLength(7);
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Reference prompt template
  it('the body composes the prompt from the shipped template reference', () => {
    expect(handoff).toContain('The full template for the file written in Step 7 lives at `references/prompt-template.md`.');
    expect(template).toContain('# External Review: <change-name> (iteration <N>)');
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Output-format block must be verbatim
  it('the output-format block carries every section header and field label', () => {
    const block = template.split('## Output format — write to:')[1].split('## After completing the review')[0];
    for (const h of ['## CRITICAL', '## WARNING', '## SUGGESTION', '## Blocks', '## Direction', '**File**:', '**Description**:', '**Reproduction**:', '**Disposition**:']) {
      expect(block).toContain(h);
    }
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Commit / push instructions in prompt
  it('the prompt tells a git-capable reviewer to commit, push and say so', () => {
    const after = template.split('## After completing the review')[1];
    expect(after).toMatch(/git add [^\n]*external-<as>-<TS>\.md/);
    expect(after).toContain('git push');
    expect(after).toContain('`Findings committed (<short-sha>) and pushed`');
    expect(after).toMatch(/could NOT\s+commit\/push/);
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Commit message format in prompt
  it('the suggested commit message is "External review (<as>, iter <N>): <change-name>" then a summary line', () => {
    expect(template).toMatch(/git commit -m "External review \(<as>, iter <N>\): <change-name>\n\n\s*<one-line summary/);
  });

  // @scenario text orbit-review-external :: Prompt written to versioned file with chat invocation snippet :: Full findings output to chat in prompt
  it('the prompt asks for the full findings markdown in chat, unabridged', () => {
    expect(template).toContain('**Output the full findings markdown in chat**');
    expect(template).toMatch(/Do NOT abbreviate or summarize/);
  });

  // @scenario text orbit-review-external :: Recommended-session note in chat output :: Recommendation appears in chat
  it('the paste route prints a "Recommended session:" line before the prompt path', () => {
    const s8 = step('8. Emit the chat invocation snippet (no runner launched)', '9. Launch');
    expect(s8.indexOf('`Recommended session: <phrasing from Step 6>`')).toBeLessThan(s8.indexOf('`Prompt: orbit/changes/'));
  });

  // @scenario text orbit-review-external :: Recommended-session note in chat output :: Recommendation logic by iteration
  it('three phrasings by iteration, least-recently-used by latest token, reviewer read from **Reviewer**:', () => {
    const s6 = step('6. Compute the recommended-session note', '7. Write the prompt file');
    expect(s6).toContain('**Iteration 1**: `Fresh session recommended — first external pass');
    expect(s6).toContain('**Iteration 2**: `Fresh session in a DIFFERENT AI');
    expect(s6).toContain('**Iteration 3+**: `Fresh session in a previously-unused AI');
    expect(s6).toContain("each reviewer's latest `external-<as>-*.md` token in this mode");
    expect(s6).toContain('`**Reviewer**:`');
  });

  // @scenario text orbit-review-external :: Recommended-session note in chat output :: No prior data → iter 1 recommendation
  it('no prior external file in this mode is iteration 1', () => {
    expect(step('4. Count iterations (per mode)', '5. Load cycle context')).toContain('0 matching files → iteration 1');
    expect(handoff).toContain('**No prior external review** → recommended-session note uses iter 1 phrasing');
  });

  // @scenario text orbit-review-external :: Handoff preflight blocks unusable pull invocations :: Dirty working tree blocks the pull invocation
  it('a dirty tree withholds the pull invocation and leads with commit and push', () => {
    expect(handoff).toMatch(/\*\*Preflight failed\*\* \(dirty tree and\/or unpushed commits\): the pull invocation is WITHHELD/);
    expect(handoff).toContain('`Handoff blocked: <dirty tree | N unpushed commit(s)>. Commit the pending work (including the prompt file above) and push, then hand off');
  });

  // @scenario text orbit-review-external :: Handoff preflight blocks unusable pull invocations :: Unpushed commits block the pull invocation
  it('unpushed commits are read with git rev-list and block the same way', () => {
    expect(step('3. Handoff preflight', '4. Count iterations')).toContain('`git rev-list @{u}..HEAD --count`');
    expect(handoff).toContain('N unpushed commit(s)');
  });

  // @scenario text orbit-review-external :: Handoff preflight blocks unusable pull invocations :: Clean and pushed emits the pull invocation with an affirmative attestation
  it('clean and pushed states the attestation first, never implied', () => {
    expect(handoff).toContain('FIRST affirmatively state the prompt\'s committed-and-pushed state with evidence — `Prompt committed (<short-sha>) and pushed to <remote>/<branch>`');
    expect(handoff).toContain('NEVER implied by the mere absence of a warning');
  });
});
