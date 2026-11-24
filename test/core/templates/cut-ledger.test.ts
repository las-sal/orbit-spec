import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateSkillContent, getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { CHAIN_END_STEP_SKILLS } from '../../../src/core/disciplines.js';
import { CUT_PAIRS, CUT_RECORDED, type CutPair, cutFailure, movedSpan, sha, skillRefs } from './cut-ledger-pairs.js';

/**
 * reduce-orbit-phase2's cut ledger (`orbit-conventions`' `A cut ledger names every body edit a cut stage makes`): the
 * recorded hashes and the pairs are in `cut-ledger-pairs.ts`; this file checks each kind, carries a mutation for each
 * check, and shows that undoing every pair reproduces each recorded body.
 */

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VERSION = (JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf-8')) as { version: string }).version;
const skills = getSkillTemplates();
const skill = (dir: string) => skills.find((s) => s.dirName === dir)!.template;
const body = (dir: string): string => skill(dir).instructions;
/** Everything a generated skill ships: its SKILL.md (frontmatter included) and its references. */
const shipped = (dir: string): Array<[string, string]> => [
  ['SKILL.md', generateSkillContent(skill(dir), VERSION)],
  ...(skill(dir).references ?? []).map((r): [string, string] => [`references/${r.name}`, r.content]),
];

/** Why a `removed` pair fails: its phrase survives somewhere in the generated skill, or it names no ruling. */
function removedFailure(p: CutPair, dir: string, files = shipped(dir)): string | null {
  if (!p.ruling) return `${p.id}: names no ruling`;
  if (!p.phrase || !p.before!.includes(p.phrase)) return `${p.id}: its phrase is not in the removed text`;
  const at = files.find(([, text]) => text.includes(p.phrase!));
  return at ? `${p.id}: ${dir}/${at[0]} still carries ${JSON.stringify(p.phrase)}` : null;
}

/** What `after` adds to `before` once their common prefix and suffix are taken out: '' for a pure removal. */
function addedText(before: string, after: string): string {
  let p = 0;
  while (p < before.length && p < after.length && before[p] === after[p]) p++;
  let s = 0;
  while (s < before.length - p && s < after.length - p && before[before.length - 1 - s] === after[after.length - 1 - s]) s++;
  return after.slice(p, after.length - s);
}

/** Why a `restated` pair fails: it adds text, or a step line it names is no longer in the body. */
function restatedFailure(p: CutPair, text: string): string | null {
  if (!p.steps?.length) return `${p.id}: names no step text`;
  const gone = p.steps.find((s) => !text.includes(s));
  return gone ? `${p.id}: the body no longer carries the step text ${JSON.stringify(gone)}` : null;
}

describe('cut ledger (reduce-orbit-phase2)', () => {
  it('records a hash for each body cut-review-walk edits', () => {
    expect(Object.keys(CUT_RECORDED)).toHaveLength(6);
    for (const dir of Object.keys(CUT_RECORDED)) {
      expect(skills.find((s) => s.dirName === dir), dir).toBeDefined();
      expect(CUT_RECORDED[dir]).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('every pair is of one kind, names bodies the ledger records, and has the fields its kind needs', () => {
    const ids = new Set<string>();
    for (const p of CUT_PAIRS) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(['moved', 'removed', 'reworded', 'restated'], p.id).toContain(p.kind);
      for (const dir of p.bodies) expect(Object.keys(CUT_RECORDED), p.id).toContain(dir);
      expect(p.after.length, p.id).toBeGreaterThan(0);
      if (p.kind === 'moved') {
        for (const k of ['ref', 'start', 'end', 'digest'] as const) expect(p[k], `${p.id}.${k}`).toBeTruthy();
      } else {
        expect(p.before, p.id).toBeTruthy();
      }
      if (p.shared) expect(p.bodies.length, p.id).toBeGreaterThan(1);
      else expect(p.bodies, p.id).toHaveLength(1);
    }
    expect(CUT_PAIRS.filter((p) => p.kind === 'removed').every((p) => p.ruling === 'R-rop2-12')).toBe(true);
  });

  for (const dir of Object.keys(CUT_RECORDED)) {
    // @scenario text orbit-conventions :: A cut ledger names every body edit a cut stage makes :: An unlisted edit fails the cut ledger
    it(`${dir}: undoing its cut pairs reproduces its recorded body`, () => {
      expect(cutFailure(dir, body(dir))).toBeNull();
    });
  }

  it('mutation: an unlisted edit fails the cut ledger, naming the body', () => {
    const dir = 'orbit-address-reviews';
    const cut = body(dir).replace('proceed to reporting.', 'proceed to the report.');
    expect(cut).not.toBe(body(dir));
    expect(cutFailure(dir, cut)).toMatch(/^orbit-address-reviews: the undone body does not match/);
  });

  it('every moved span hashes to its recorded digest, and the body names its reference', () => {
    const failures: string[] = [];
    for (const p of CUT_PAIRS.filter((x) => x.kind === 'moved')) {
      for (const dir of p.bodies) {
        const r = movedSpan(p, dir);
        if ('failure' in r) failures.push(r.failure);
        if (!body(dir).includes(`references/${p.ref}`)) failures.push(`${p.id}: ${dir}'s body does not name references/${p.ref}`);
      }
    }
    expect(failures).toEqual([]);
  });

  // @scenario text orbit-conventions :: A cut ledger names every body edit a cut stage makes :: A moved text changed in its reference fails
  it("mutation: a word of the VERIFICATION procedure changed in references/verification.md fails its pair", () => {
    const p = CUT_PAIRS.find((x) => x.id === 'V1')!;
    const ref = skillRefs('orbit-review', 'verification.md')!;
    const changed = ref.replace('Read the walks.', 'Read the walk.');
    expect(changed).not.toBe(ref);
    const refs = (dir: string, name: string) => (name === 'verification.md' ? changed : skillRefs(dir, name));
    const r = movedSpan(p, 'orbit-review', refs);
    expect('failure' in r && r.failure).toMatch(/^V1: the span in orbit-review\/references\/verification\.md no longer hashes/);
    expect(cutFailure('orbit-review', body('orbit-review'), CUT_PAIRS, refs)).toMatch(/^V1: /);
  });

  it('every removed pair names R-rop2-12 and a phrase that occurs nowhere in its generated skill', () => {
    const failures = CUT_PAIRS.filter((p) => p.kind === 'removed').flatMap((p) => p.bodies.map((dir) => removedFailure(p, dir)));
    expect(failures.filter(Boolean)).toEqual([]);
  });

  // @scenario text orbit-conventions :: A cut ledger names every body edit a cut stage makes :: A removed text still present fails
  it('mutation: a removed phrase still carried by a reference fails, naming the pair and the file', () => {
    const p = CUT_PAIRS.find((x) => x.kind === 'removed' && x.phrase === 'Batch-mode is opt-in')!;
    const files = shipped('orbit-address-reviews').map(([n, t]): [string, string] => [n, n === 'references/run-summary-schema.md' ? `${t}\nBatch-mode is opt-in.\n` : t]);
    expect(removedFailure(p, 'orbit-address-reviews', files)).toBe(`${p.id}: orbit-address-reviews/references/run-summary-schema.md still carries "Batch-mode is opt-in"`);
  });

  it('the batch-mode payload fields are named nowhere in the address-reviews skill', () => {
    for (const [name, text] of shipped('orbit-address-reviews')) {
      expect(text, name).not.toContain('walk_mode_source');
      expect(text, name).not.toContain('walk_mode_shifted_at_finding');
      expect(text, name).not.toContain('command-shape-interruption');
    }
  });

  it('every restated pair drops text whose step the body still states', () => {
    const failures = CUT_PAIRS.filter((p) => p.kind === 'restated').map((p) => restatedFailure(p, body(p.bodies[0])));
    expect(failures.filter(Boolean)).toEqual([]);
    for (const p of CUT_PAIRS.filter((x) => x.kind === 'restated')) expect(addedText(p.before!, p.after), p.id).toBe('');
  });

  it('mutation: a restated pair whose step text left the body fails', () => {
    const p = CUT_PAIRS.find((x) => x.id === 'V5')!;
    const gone = body('orbit-review').replace('Paste the output VERBATIM as the report', '');
    expect(restatedFailure(p, gone)).toBe('V5: the body no longer carries the step text "Paste the output VERBATIM as the report"');
  });

  // @scenario text orbit-conventions :: A cut ledger names every body edit a cut stage makes :: A shared constant is undone in each carrier
  it('the chain end step\'s tag paragraph is one shared pair, undone in each of its five carriers', () => {
    const shared = CUT_PAIRS.filter((p) => p.shared);
    expect(shared.map((p) => p.id)).toEqual(['chain-tags']);
    expect([...shared[0].bodies].sort()).toEqual([...CHAIN_END_STEP_SKILLS].sort());
    for (const dir of shared[0].bodies) expect(cutFailure(dir, body(dir)), dir).toBeNull();
    // Mutation: a carrier that still holds the paragraph fails its undo.
    const r = movedSpan(shared[0], 'orbit-apply-change');
    const span = 'span' in r ? r.span : '';
    expect(span.length).toBeGreaterThan(0);
    expect(cutFailure('orbit-apply-change', body('orbit-apply-change').replace(shared[0].after, span))).toMatch(/chain-tags's after occurs 0 times/);
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: A blind pair walks in two logs
  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: An interrupted walk resumes by rediscovery
  it("M10's walk-order sentences are in triage-sources.md, which the triage step reads before the walk", () => {
    const p = CUT_PAIRS.find((x) => x.id === 'M10-per-source')!;
    expect(p.existing).toBe(true);
    const r = movedSpan(p, 'orbit-address-reviews');
    expect('span' in r && r.span).toContain(p.copied!.text);
    expect(skillRefs('orbit-address-reviews', p.copied!.ref)).toContain(p.copied!.text);
    const b = body('orbit-address-reviews');
    const triage = b.slice(b.indexOf('### 2. Triage'), b.indexOf('### 3. Walk each marker'));
    expect(triage).toContain('when discovery yields more than one source, or a pass a log already names, read `references/triage-sources.md` before the walk');
  });

  it('the moved texts each reference holds byte-equal also exist nowhere else in the body', () => {
    for (const p of CUT_PAIRS.filter((x) => x.kind === 'moved')) {
      const r = movedSpan(p, p.bodies[0]);
      if ('span' in r) expect(body(p.bodies[0]).includes(r.span), p.id).toBe(false);
    }
    expect(sha('')).toHaveLength(64);
  });
});
