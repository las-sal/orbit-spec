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

  it('restates neither the genre table nor the verdict definition', () => {
    const b = branch();
    expect(b).not.toContain('| reviewer class | mode | trail position | pass genre |');
    // The verdict's four conjuncts are the owner's words; the branch names the tokens only.
    expect(b).not.toMatch(/PRESENT|NOT UNDONE|COMPLETE across/);
  });

  it('carries the sweep scope, the residual check with its range, and its co-committed-edit limit', () => {
    const b = branch();
    expect(b).toContain('its `file` plus every path in its `ripple_cascade.applied`');
    expect(b).toContain("git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'");
    expect(b).toContain("git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'");
    expect(b).toContain('git log --diff-filter=A --format=%h -- <the latest accepted independent pass\'s file> | tail -1');
    expect(b).toMatch(/KNOWN LIMIT: an edit committed in `<C>` itself/);
    expect(b).toMatch(/as a SUGGESTION without `walk_entry`/);
  });

  it('names the write-gate refusal as the reconciling channel', () => {
    expect(branch()).toMatch(/The refusal is the reconciling channel — never a second probe, never a hand-computed walk set/);
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
