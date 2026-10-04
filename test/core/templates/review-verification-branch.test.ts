import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { getSkillTemplates, generateSkillContent } from '../../../src/core/shared/skill-generation.js';

/**
 * rc03c-verification-record, task 1.5 — the review body's VERIFICATION branch, as generated.
 * `orbit-review`'s `Verification-genre passes grade the walk record` owns the procedure; the branch
 * lives in the SKILL body's Step 5 (never in a reference a REVIEW pass loads to read — those are brief
 * regions under `review-genre-brief.test.ts`), names its owners and restates neither the genre table
 * nor the verdict definition.
 */

const review = getSkillTemplates().find(t => t.dirName === 'orbit-review')!;
const skill = generateSkillContent(review.template, 'test');

/** Step 5's VERIFICATION bullet and its sub-steps, up to the next Step heading. */
function branch(): string {
  const start = skill.indexOf('- **VERIFICATION pass genre**');
  expect(start, 'Step 5 carries the VERIFICATION branch').toBeGreaterThan(-1);
  const end = skill.indexOf('\n### ', start);
  return skill.slice(start, end);
}

describe('review body: the VERIFICATION branch (1.5)', () => {
  it('names the owners it points at', () => {
    const b = branch();
    for (const owner of [
      "`orbit-review`'s **Verification-genre passes grade the walk record**",
      "`orbit-conventions`' table",
      "`orbit-emit-composition`'s **A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record**",
      '`orbit-address-reviews` specifies',
      "`orbit-report-rendering`'s **Verification renders as its own section and its absence is marked**",
    ]) {
      expect(b, owner).toContain(owner);
    }
  });

  it('restates the genre table nowhere, and carries the verdict definition ONLY as its checked mirror', () => {
    const b = branch();
    expect(b).not.toContain('| reviewer class | mode | trail position | pass genre |');
    // System walk 2 (fresh W1): an installed skill cannot open the owner, so the definition is carried
    // as a CHECKED MIRROR (held byte-equal by `verification-verdict-parity.test.ts`) — and nowhere else
    // in the branch: the grading step names the mirror, it does not paraphrase it.
    const [steps, mirror] = b.split('#### Verdicts');
    expect(mirror).toMatch(/CHECKED MIRROR/);
    expect(steps).not.toMatch(/PRESENT|NOT UNDONE|COMPLETE across/);
    expect(steps).toContain('by the definition under **Verdicts** below');
  });

  it('carries the sweep scope, the residual check with its range, and its co-committed-edit limit', () => {
    const b = branch();
    expect(b).toContain('its `file` plus every path in its `ripple_cascade.applied`');
    expect(b).toContain("git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'");
    expect(b).toContain("git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'");
    expect(b).toContain('git log --diff-filter=A --format=%h -- <base file> | tail -1');
    // System walk 1 (external W1): the base is defined when the mode has no independent pass too.
    expect(b).toContain("the BASE FILE is the latest accepted independent pass's file, or, when this mode has no accepted independent pass, the file of the pass the earliest walk you verify walked");
    expect(b).toMatch(/KNOWN LIMIT: an edit committed in `<C>` itself — the commit that added the base file/);
    // System walk 2 (fresh S2): the limit is the ordinary case under one commit order, and the remedy is stated.
    expect(b).toContain('commit the pass file BEFORE the walks\' edits so they stay in range');
    expect(b).toMatch(/as a SUGGESTION without `walk_entry`/);
    // System walk 2 (fresh W3): which passes run over the scope is stated, so exit (3) is graded
    // against a procedure, not an interpretation.
    expect(b).toContain("Run this mode's FILE-SET passes over the union of the sweep scopes — every proposal-mode pass; system-mode Passes 1–5.");
    expect(b).toMatch(/system-mode Pass 0 \(verify-change\) and Pass 6 \(audit-drift\) — is NOT run: list it in `passes_skipped`/);
  });

  it('names the write-gate refusal as the reconciling channel', () => {
    expect(branch()).toMatch(/The refusal is the reconciling channel, in BOTH directions — never a second probe, never a hand-computed walk set/);
    // System walk 2 (fresh W2): the reverse direction — the engine computed REVIEW.
    expect(branch()).toMatch(/drop `verification` and every `walk_entry`, run this pass as a REVIEW-genre pass over the whole artifact, and emit again/);
  });

  it('lives in the SKILL body only — no reference a REVIEW pass reads carries it', () => {
    for (const ref of review.template.references ?? []) {
      if (!/^passes-|^mode-sections\.md$|^flags-detail\.md$/.test(ref.name)) continue;
      expect(ref.content, ref.name).not.toContain('Verification-genre passes grade the walk record');
      expect(ref.content, ref.name).not.toContain('ripple_cascade.applied');
    }
  });

  it('leaves rc03b\'s metadata probe text byte-unchanged', () => {
    const probe = skill.split('\n').find(l => l.startsWith("Decide this pass's PASS GENRE first"));
    expect(probe).toBeDefined();
    expect(createHash('sha256').update(probe!).digest('hex')).toBe('be60969321cd69620065a02b080f85fb2a0b60fb7573817dbcc4efaa64c1b103');
  });
});
