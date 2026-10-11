import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readTrail } from '../../src/core/artifact-graph/trail.js';
import { computePassGenre } from '../../src/core/artifact-graph/pass-genre.js';

/**
 * rc03b-pass-genres, system walk 1 (fresh W2 + external W2, Sal: A) — the in-context pass decides its
 * PASS GENRE from a bounded METADATA PROBE (`orbit-conventions`' `Review mode decision framework`).
 * "Latest ACCEPTED independent pass" is the trail reader's pass set and class rule, and the probe reads
 * `reviewer_class` or — absent it — `flags.fresh`. One KNOWN LIMIT is stated in the owner: acceptance of
 * an external return cannot be read from metadata, so the probe counts every `external-<mode>-*.md`
 * file as a pass and the engine's computation is authoritative where the two differ.
 *
 * This decision table runs the probe AS THE OWNER STATES IT beside the ENGINE's computation
 * (`computePassGenre`, since rc03c) on constructed trails, and pins that they agree everywhere except
 * two cases: the owner's named limit (a rejected external return), and — found at rc03c's system walk 2
 * against the real function — a walk naming a pass file absent from this trail, an ACCEPTED RESIDUAL
 * (naming it in the owner is a fourth capability past rc03c's ceiling). The write gate's refusal
 * reconciles both, in both directions; the engine is authoritative.
 */
type Mode = 'proposal' | 'system';
type Genre = 'REVIEW' | 'VERIFICATION';

const ACCEPTED_EXTERNAL = [
  '# External Review: c (iteration 1)', '', '**Reviewer**: M', '**Date**: 2026-10-04', '',
  '## CRITICAL', '', 'None.', '', '## WARNING', '', 'None.', '', '## SUGGESTION', '', 'None.', '',
].join('\n');
const REJECTED_EXTERNAL = 'I reviewed it and it looks fine.\n';

const modeOfSource = (p: string | null): Mode | null =>
  (p && (path.basename(p).match(/^(?:review|external)-(proposal|system)-/)?.[1] as Mode)) || null;
const tokenOf = (name: string): string | null => name.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/)?.[1] ?? null;

/** The probe as the owner states it: filenames + `reviewer_class` (else `flags.fresh`) + `source_path`. */
function probeGenre(runsDir: string, mode: Mode, passToken: string): Genre {
  const indep: string[] = [];
  const walks: string[] = [];
  for (const name of fs.readdirSync(runsDir)) {
    const token = tokenOf(name);
    if (!token || token >= passToken) continue;
    if (new RegExp(`^external-${mode}-`).test(name)) indep.push(token);
    else if (new RegExp(`^review-${mode}-`).test(name)) {
      const j = JSON.parse(fs.readFileSync(path.join(runsDir, name), 'utf-8'));
      const cls = j.reviewer_class ?? (j.flags?.fresh === true ? 'fresh' : 'in-context');
      if (cls === 'fresh' || cls === 'external') indep.push(token);
    } else if (/^address-reviews-/.test(name)) {
      const j = JSON.parse(fs.readFileSync(path.join(runsDir, name), 'utf-8'));
      if (modeOfSource(j.source_path ?? null) === mode) walks.push(token);
    }
  }
  const bound = indep.sort().at(-1) ?? '';
  return walks.some(w => w > bound) ? 'VERIFICATION' : 'REVIEW';
}

/**
 * The ENGINE's computation — rc03c-verification-record's `computePassGenre`, called directly (system walk
 * 2, fresh S1: this was a hand model resolving a walk's mode from its source FILENAME, while the shipped
 * function resolves it THROUGH the accepted pass set; a decision table pinned against a model witnesses
 * the model, not the engine).
 */
function trailGenre(changeDir: string, mode: Mode, passToken: string): Genre {
  return computePassGenre(readTrail(changeDir), 'in-context', mode, passToken).passGenre;
}

let dir: string;
let runs: string;
const T = (n: number) => `2026-10-04T0${n}-00-00Z`;
const write = (name: string, body: string | object) =>
  fs.writeFileSync(path.join(runs, name), typeof body === 'string' ? body : JSON.stringify(body));
const review = (n: number, extra: object) =>
  write(`review-system-${T(n)}.json`, { command: 'review', mode: 'system', findings: [], ...extra });
const walk = (n: number, source: string | null) =>
  write(`address-reviews-${T(n)}.json`, { command: 'address-reviews', source_path: source, resolutions: [] });
const both = (n: number) => [probeGenre(runs, 'system', T(n)), trailGenre(dir, 'system', T(n))];

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc03b-genre-'));
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs);
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('pass-genre metadata probe ↔ trail reader (rc03b system walk 1)', () => {
  it('no walk at all → REVIEW on both', () => {
    review(1, { reviewer_class: 'fresh' });
    expect(both(2)).toEqual(['REVIEW', 'REVIEW']);
  });

  it('fresh pass, then a walk of its mode → VERIFICATION on both', () => {
    review(1, { reviewer_class: 'fresh' });
    walk(2, `orbit/changes/c/.orbit-runs/review-system-${T(1)}.json`);
    expect(both(3)).toEqual(['VERIFICATION', 'VERIFICATION']);
  });

  it('an accepted external return after the walk bounds it out → REVIEW on both', () => {
    review(1, { reviewer_class: 'fresh' });
    walk(2, `orbit/changes/c/.orbit-runs/review-system-${T(1)}.json`);
    write(`external-system-${T(3)}.md`, ACCEPTED_EXTERNAL);
    expect(both(4)).toEqual(['REVIEW', 'REVIEW']);
  });

  it('a LEGACY fresh pass (`flags.fresh: true`, no `reviewer_class`) after the walk bounds it out → REVIEW on both (the external half\'s case)', () => {
    walk(1, `orbit/changes/c/.orbit-runs/review-system-${T(0)}.json`);
    review(2, { flags: { fresh: true } });
    expect(both(3)).toEqual(['REVIEW', 'REVIEW']);
  });

  it('only MODE-LESS walks, or walks of the other mode → REVIEW on both', () => {
    walk(1, null);
    walk(2, `orbit/changes/c/.orbit-runs/review-proposal-${T(0)}.json`);
    expect(both(3)).toEqual(['REVIEW', 'REVIEW']);
  });

  it('THE NAMED LIMIT: a REJECTED external return after a qualifying walk — the probe says REVIEW, the trail reader VERIFICATION, and the engine is authoritative', () => {
    review(1, { reviewer_class: 'fresh' });
    walk(2, `orbit/changes/c/.orbit-runs/review-system-${T(1)}.json`);
    write(`external-system-${T(3)}.md`, REJECTED_EXTERNAL);
    expect(readTrail(dir).rejectedExternals.map(r => r.token)).toEqual([T(3)]);
    expect(both(4)).toEqual(['REVIEW', 'VERIFICATION']);
  });

  it('THE SECOND DIFFERENCE (rc03c system walk 2, fresh W2 — an accepted residual, not named in the owner\'s KNOWN LIMIT): a walk naming a pass file ABSENT from this trail — the probe reads its mode from the filename (VERIFICATION), the engine resolves it through the accepted pass set (mode-less → REVIEW); the write gate\'s REVIEW-genre refusal reconciles it', () => {
    walk(1, `orbit/changes/other/.orbit-runs/review-system-${T(0)}.json`);
    expect(both(2)).toEqual(['VERIFICATION', 'REVIEW']);
  });
});
