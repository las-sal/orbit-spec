import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTrail } from '../../src/core/artifact-graph/trail.js';
import { computePassGenre, verificationLedger } from '../../src/core/artifact-graph/pass-genre.js';

/**
 * rc03c-verification-record, task 1.1 — the pass-genre function's decision table over constructed
 * trails, plus rc03b's archived system trail as a fixture. `orbit-conventions`' `Review mode decision
 * framework` owns the table; `orbit-emit-composition`'s `The review emit records its pass genre and
 * the walks it verifies` owns the two computed fields this function produces.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');

const ACCEPTED_EXTERNAL = [
  '# External Review: c (iteration 1)', '', '**Reviewer**: M', '**Date**: 2026-10-04', '',
  '## CRITICAL', '', 'None.', '', '## WARNING', '', 'None.', '', '## SUGGESTION', '', 'None.', '',
].join('\n');
const REJECTED_EXTERNAL = 'I reviewed it and it looks fine.\n';

let dir: string;
let runs: string;
const T = (n: number) => `2026-10-04T0${n}-00-00Z`;
const write = (name: string, body: string | object) =>
  fs.writeFileSync(path.join(runs, name), typeof body === 'string' ? body : JSON.stringify(body));
const review = (n: number, cls: string, mode = 'system') =>
  write(`review-${mode}-${T(n)}.json`, { command: 'review', mode, reviewer_class: cls, findings: [] });
const walk = (n: number, source: string | null, resolutions: object[] = [{ severity: 'WARNING', outcome: 'resolved', title: 't', file: 'f.md' }]) =>
  write(`address-reviews-${T(n)}.json`, { command: 'address-reviews', source_path: source, resolutions });
const src = (name: string) => `orbit/changes/c/.orbit-runs/${name}`;
const genre = (cls: 'in-context' | 'fresh' | 'external', mode: string, n: number) =>
  computePassGenre(readTrail(dir), cls, mode, T(n));

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc03c-genre-'));
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs);
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('computePassGenre — the decision table (task 1.1)', () => {
  it('independent classes are REVIEW with [] at every trail position, even after a qualifying walk', () => {
    review(1, 'fresh');
    walk(2, src(`review-system-${T(1)}.json`));
    for (const cls of ['fresh', 'external'] as const) {
      expect(genre(cls, 'system', 3)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
    }
  });

  it('architecture mode is REVIEW with [] for every class', () => {
    review(1, 'fresh');
    walk(2, src(`review-system-${T(1)}.json`));
    expect(genre('in-context', 'architecture', 3)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
    expect(genre('fresh', 'architecture', 3)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
  });

  it('in-context after a qualifying walk is VERIFICATION, its walks in token order', () => {
    review(1, 'fresh');
    write(`external-system-${T(2)}.md`, ACCEPTED_EXTERNAL);
    walk(4, src(`external-system-${T(2)}.md`));
    walk(3, src(`review-system-${T(1)}.json`));
    expect(genre('in-context', 'system', 5)).toEqual({ passGenre: 'VERIFICATION', verifiedWalks: [T(3), T(4)] });
  });

  it('in-context with no walk at all, or only walks older than the latest accepted independent pass, is REVIEW', () => {
    review(1, 'fresh');
    expect(genre('in-context', 'system', 2)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
    walk(2, src(`review-system-${T(1)}.json`));
    review(3, 'fresh');
    expect(genre('in-context', 'system', 4)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
  });

  it('a walk of the OTHER mode does not qualify', () => {
    review(1, 'fresh', 'proposal');
    walk(2, src(`review-proposal-${T(1)}.json`));
    expect(genre('in-context', 'system', 3)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
    expect(genre('in-context', 'proposal', 3)).toEqual({ passGenre: 'VERIFICATION', verifiedWalks: [T(2)] });
  });

  it('a walk whose source is a REJECTED external return is MODE-LESS → REVIEW', () => {
    review(1, 'fresh');
    write(`external-system-${T(2)}.md`, REJECTED_EXTERNAL);
    // The fresh pass at T1 bounds; the only walk after it names the rejected return.
    walk(3, src(`external-system-${T(2)}.md`));
    expect(genre('in-context', 'system', 4)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
  });

  it('a walk naming no pass on the trail, or with a null source, is MODE-LESS → REVIEW', () => {
    walk(1, src(`review-system-${T(0)}.json`));
    walk(2, null);
    expect(genre('in-context', 'system', 3)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
  });

  it('a walk of an in-context pass resolves to that pass\'s mode and qualifies when no independent pass exists', () => {
    review(1, 'in-context');
    walk(2, src(`review-system-${T(1)}.json`));
    expect(genre('in-context', 'system', 3)).toEqual({ passGenre: 'VERIFICATION', verifiedWalks: [T(2)] });
  });

  it('records at or after the pass token are not read', () => {
    review(1, 'fresh');
    walk(3, src(`review-system-${T(1)}.json`));
    expect(genre('in-context', 'system', 3)).toEqual({ passGenre: 'REVIEW', verifiedWalks: [] });
  });

  it('a second in-context pass re-lists earlier walks (UNNARROWED — a prior verification does not move the bound)', () => {
    review(1, 'fresh');
    walk(2, src(`review-system-${T(1)}.json`));
    review(3, 'in-context');
    walk(4, src(`review-system-${T(3)}.json`));
    expect(genre('in-context', 'system', 5)).toEqual({ passGenre: 'VERIFICATION', verifiedWalks: [T(2), T(4)] });
  });
});

describe('computePassGenre — rc03b\'s archived system trail (task 1.1 fixture)', () => {
  const archived = path.join(REPO, 'orbit', 'changes', 'archive', '2026-10-04-rc03b-pass-genres');

  it('the confirm at 04-16-02Z computes VERIFICATION over 04-08-51Z and 04-12-35Z', () => {
    expect(computePassGenre(readTrail(archived), 'in-context', 'system', '2026-10-04T04-16-02Z')).toEqual({
      passGenre: 'VERIFICATION',
      verifiedWalks: ['2026-10-04T04-08-51Z', '2026-10-04T04-12-35Z'],
    });
  });

  it('the worked trail owes 9 verdicts of its 10 entries (design D2)', () => {
    const trail = readTrail(archived);
    const ledger = verificationLedger(trail, ['2026-10-04T04-08-51Z', '2026-10-04T04-12-35Z']);
    expect(ledger.owed.size).toBe(9);
    expect(ledger.unreadable).toEqual([]);
  });
});

describe('verificationLedger — the owed set', () => {
  it('only resolved entries owe; a key in two walks is one entry judged against the latest resolved walk; a later stale call does not lift it', () => {
    review(1, 'fresh');
    walk(2, src(`review-system-${T(1)}.json`), [
      { severity: 'WARNING', outcome: 'resolved', title: 'A', file: 'a.md' },
      { severity: 'SUGGESTION', outcome: 'resolved', title: 'B', file: 'b.md:12' },
      { severity: 'WARNING', outcome: 'stale', title: 'C', file: 'c.md' },
    ]);
    walk(3, src(`review-system-${T(1)}.json`), [
      { severity: 'WARNING', outcome: 'resolved', title: 'A', file: 'a.md' },
      { severity: 'WARNING', outcome: 'stale', title: 'B', file: 'b.md' },
    ]);
    const ledger = verificationLedger(readTrail(dir), [T(2), T(3)]);
    expect([...ledger.owed.values()]).toEqual([
      { title: 'A', file: 'a.md', walk: T(3) },
      { title: 'B', file: 'b.md', walk: T(2) },
    ]);
    expect(ledger.carried.get(JSON.stringify(['B', 'b.md']))).toEqual(['resolved', 'stale']);
  });

  it('an unreadable walk, or one holding an entry with no title, owes nothing and is listed unreadable', () => {
    walk(2, null, []);
    walk(3, null, [{ severity: 'WARNING', outcome: 'resolved', file: 'a.md' }]);
    const ledger = verificationLedger(readTrail(dir), [T(2), T(3)]);
    expect(ledger.owed.size).toBe(0);
    expect(ledger.unreadable).toEqual([T(2), T(3)]);
  });
});
