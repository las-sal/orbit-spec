import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * rc04a exit criterion (3) — THE ACCEPTANCE FIXTURE.
 *
 * rc02c archived through a computed PASSED gate carrying SIX residual-risk entries as free
 * prose in `warnings`, in a field whose own schema example is "Archived with 2 incomplete
 * artifacts". That array is the concrete artifact this record exists to structure, and it is
 * the reason the record's shape is credible rather than merely tidy — the shape was derived
 * FROM it.
 *
 * This test reads the REAL archived emit rather than a copied fixture, so it fails if the
 * artifact the design cites ever stops saying what the design says it says.
 *
 * The sort below is derived under the SHIPPED qualifying test — *was the judgement formed
 * against independent review output?* — not under the exploration's earlier worked example,
 * which predates the test and sorted these differently. That correction is the point: the
 * exit criterion is only meaningful if the sort follows the rule the change ships.
 */

const ARCHIVE = path.join(
  process.cwd(),
  'orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/.orbit-runs'
);
const EMIT = path.join(ARCHIVE, 'archive-2026-09-21T15-38-59Z.json');

/** rc02c's INDEPENDENT passes — the tokens a judgement on that trail could cite. */
const FRESH = '2026-09-21T14-12-34Z';
const EXTERNAL_1 = '2026-09-21T14-11-34Z';
const EXTERNAL_2 = '2026-09-21T15-17-10Z';
const IN_CONTEXT = '2026-09-21T14-56-15Z';

describe('rc04a acceptance fixture — rc02c\'s six warnings under the shipped shape', () => {
  const emit = JSON.parse(fs.readFileSync(EMIT, 'utf-8')) as { warnings: string[] };

  it('the cited artifact still carries the six free-prose entries the design describes', () => {
    expect(emit.warnings).toHaveLength(6);
    const chars = emit.warnings.join('').length;
    expect(chars).toBeGreaterThan(3000); // "3,333 characters of free prose"
  });

  it('TWO entries are formed against independent passes and become `accepted` pairs', () => {
    // [0] a passed gate does not mean a clean independent pass stands — formed against the passes
    // [1] the ~58% capture-recapture residual — formed against the blind pair
    const accepted = [emit.warnings[0], emit.warnings[1]];
    expect(accepted[0]).toMatch(/RESIDUAL RISK, recorded rather than implied/);
    expect(accepted[1]).toMatch(/RESIDUAL RISK, measured/);

    // each is expressible as a {claim, why} pair inside ONE readiness record citing real tokens
    const record = {
      kind: 'readiness' as const,
      disposition: 'ready' as const,
      formed_against: [EXTERNAL_1, FRESH, EXTERNAL_2],
      reasoning: 'the blind pair and the scoped pass returned; the residual is acceptable',
      ratified_by: 'ai' as const,
      accepted: accepted.map(w => ({ claim: w.split('.')[0], why: w.slice(w.indexOf('.') + 1).trim() })),
    };
    expect(record.accepted).toHaveLength(2);
    expect(record.accepted.every(p => p.claim.length > 0 && p.why.length > 0)).toBe(true);
    // every cited token is an INDEPENDENT pass that exists on the trail
    for (const t of record.formed_against) {
      const isPass =
        fs.existsSync(path.join(ARCHIVE, `review-system-${t}.json`)) ||
        fs.existsSync(path.join(ARCHIVE, `external-system-${t}.md`));
      expect(isPass, `${t} must be a real pass on rc02c's trail`).toBe(true);
    }
    expect(record.formed_against).not.toContain(IN_CONTEXT);
  });

  it('THREE entries arose at the seam and correctly STAY in warnings', () => {
    // [3] the stale cross-reference — found by the SYNC AGENT, not by any review pass
    // [4] touchpoint divergence — computed at the seam
    // [5] the at-archive correction — made in flow
    expect(emit.warnings[3]).toMatch(/found by the sync agent/);
    expect(emit.warnings[4]).toMatch(/TOUCHPOINT DIVERGENCE at archive/);
    expect(emit.warnings[5]).toMatch(/AT-ARCHIVE CORRECTION, made in flow/);
    // none of them cites a pass, which is exactly why they fail the qualifying test:
    // a warnings entry cites nothing and can be ordered against nothing
    for (const w of [emit.warnings[3], emit.warnings[4], emit.warnings[5]]) {
      expect(w).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/);
    }
  });

  it('ONE entry is a METHOD call misfiled in warnings, and the new shape makes that visible', () => {
    // [2] the size overage — formed against R-crc-1, not against any pass. It is neither an
    // `accepted` pair nor a seam-arising process note: it is a method call whose correct home
    // is design.md's size section, where it also already lives. Naming it is the point —
    // the qualifying test earns its keep by what it EXCLUDES.
    expect(emit.warnings[2]).toMatch(/^SIZE, over the ceiling/);
    expect(emit.warnings[2]).toMatch(/R-crc-1/);
    expect(emit.warnings[2]).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/);
  });

  it('the continuation cases on the same trail cite earlier, resolvable tokens (task 5.2)', () => {
    // the apply's gate_overridden -> continuation/proceed
    const applies = fs
      .readdirSync(ARCHIVE)
      .filter(f => f.startsWith('apply-') && f.endsWith('.json'))
      .sort();
    expect(applies.length).toBeGreaterThan(0);
    const withOverride = applies
      .map(f => JSON.parse(fs.readFileSync(path.join(ARCHIVE, f), 'utf-8')))
      .filter(d => d.gate_overridden);
    expect(withOverride.length).toBeGreaterThan(0);
    // its gate/state/reason are exactly what a continuation/proceed would carry
    for (const d of withOverride) {
      expect(typeof d.gate_overridden.gate).toBe('string');
      expect(typeof d.gate_overridden.state).toBe('string');
      expect(typeof d.gate_overridden.reason).toBe('string');
    }

    // the scoped iteration-2 handoff -> continuation/spend, taken AFTER the pair returned
    const t0 = fs
      .readdirSync(ARCHIVE)
      .filter(f => f.startsWith('review-external-') && f.endsWith('.json'))
      .sort()
      .pop()!;
    const spendToken = /(\d{4}-\d{2}-\d{2}T[\d-]+Z)/.exec(t0)![1];
    for (const cited of [EXTERNAL_1, FRESH]) {
      expect(cited < spendToken, `${cited} must precede the spend decision at ${spendToken}`).toBe(true);
    }
  });
});
