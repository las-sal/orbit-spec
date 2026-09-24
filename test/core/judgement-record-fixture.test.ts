import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit } from '../../src/core/emit-composition.js';
import { readTrail } from '../../src/core/artifact-graph/trail.js';

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
 *
 * WHAT THE SYSTEM WALK CHANGED (external finding E5). The first version of this file asserted
 * the classification it claimed to derive: it selected entries by INDEX, labelled them in
 * comments, checked an opening phrase, and hand-attached a pass list that never went near the
 * write gate. It therefore could not have detected a wrong sort, and in fact detected none of
 * the carrier or coexistence defects the same review found. Every classification below is now
 * settled by COMPOSING the record and running it through `composeAndWriteEmit` against a
 * project seeded with rc02c's REAL trail:
 *
 *   - an entry that qualifies composes a record the write gate ACCEPTS, citing real tokens;
 *   - an entry that does not qualify cites NOTHING, so its `formed_against` is empty and the
 *     gate REFUSES it. The exclusion is demonstrated by the engine, not by a phrase check.
 *
 * The index-and-phrase assertions survive only where that is honestly their job: pinning the
 * IDENTITY of the archived entry a given claim is about, so the test breaks if the cited
 * artifact changes underneath it.
 */

const ARCHIVE_SRC = path.join(
  process.cwd(),
  'orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/.orbit-runs'
);
const EMIT = path.join(ARCHIVE_SRC, 'archive-2026-09-21T15-38-59Z.json');

/** rc02c's INDEPENDENT passes — the tokens a judgement on that trail could cite. */
const FRESH = '2026-09-21T14-12-34Z';
const EXTERNAL_1 = '2026-09-21T14-11-34Z';
const EXTERNAL_2 = '2026-09-21T15-17-10Z';
const IN_CONTEXT = '2026-09-21T14-56-15Z';

const emit = JSON.parse(fs.readFileSync(EMIT, 'utf-8')) as {
  warnings: string[];
  archive_path: string;
};

/** A `{claim, why}` pair from one free-prose entry — the split the record's shape implies. */
const pair = (w: string) => ({ claim: w.split('.')[0], why: w.slice(w.indexOf('.') + 1).trim() });

let root: string;

/**
 * A scratch project carrying rc02c's REAL trail under an ARCHIVED change directory, which is
 * what an `archive` emit resolves against. Only the pass files are copied: those are what the
 * write gate resolves `formed_against` citations to.
 */
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-rc04a-fixture-'));
  const runs = path.join(root, 'orbit/changes/archive/2026-09-21-rc02c-derived/.orbit-runs');
  fs.mkdirSync(runs, { recursive: true });
  for (const f of fs.readdirSync(ARCHIVE_SRC)) {
    if (/^(review-(proposal|system)|external-(proposal|system))-/.test(f)) {
      fs.copyFileSync(path.join(ARCHIVE_SRC, f), path.join(runs, f));
    }
  }
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const archivePayload = (judgements: unknown) => ({
  model: 'test-model',
  final_assessment: 'archived',
  archive_path: 'orbit/changes/archive/2026-09-21-rc02c-derived/',
  audit: {
    ran: true,
    failure_reason: null,
    findings_summary: { critical: 0, warning: 0, suggestion: 0 },
    summary_path: null,
  },
  sync_specs: {
    ran: true,
    skipped_reason: null,
    capabilities_updated: [],
    added: 0,
    modified: 0,
    removed: 0,
    renamed: 0,
  },
  unresolved_markers: [],
  user_decision: 'proceeded_with_no_critical',
  consent: 'user-invoked',
  judgements,
});

const emitDerived = (judgements: unknown, extra: Record<string, unknown> = {}) =>
  composeAndWriteEmit(
    'archive',
    { change: 'rc02c-derived' },
    { ...archivePayload(judgements), ...extra } as any,
    { projectRoot: root }
  );

describe("rc04a acceptance fixture — rc02c's six warnings under the shipped shape", () => {
  it('the cited artifact still carries the six free-prose entries the design describes', () => {
    expect(emit.warnings).toHaveLength(6);
    const chars = emit.warnings.join('').length;
    expect(chars).toBeGreaterThan(3000); // "3,333 characters of free prose"
  });

  it('TWO entries compose a readiness record the WRITE GATE accepts, citing rc02c real tokens', () => {
    // [0] a passed gate does not mean a clean independent pass stands — formed against the passes
    // [1] the ~58% capture-recapture residual — formed against the blind pair
    const accepted = [emit.warnings[0], emit.warnings[1]];
    expect(accepted[0]).toMatch(/RESIDUAL RISK, recorded rather than implied/);
    expect(accepted[1]).toMatch(/RESIDUAL RISK, measured/);

    const r = emitDerived([
      {
        kind: 'readiness',
        disposition: 'ready',
        formed_against: [EXTERNAL_1, FRESH, EXTERNAL_2],
        reasoning: 'the blind pair and the scoped pass returned; the residual is acceptable',
        ratified_by: 'ai',
        accepted: accepted.map(pair),
      },
    ]);

    // The ENGINE accepted it. Every cited token resolved to a real INDEPENDENT pass on the
    // copied trail, and every one preceded the emit's own — neither asserted here, both
    // ENFORCED by the write gate this call went through.
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect(written.judgements[0].accepted).toHaveLength(2);
    expect(written.judgements[0].accepted.every((p: any) => p.claim && p.why)).toBe(true);
    expect(written.judgements[0].formed_against).toEqual([EXTERNAL_1, FRESH, EXTERNAL_2]);
  });

  it('the in-context pass is REFUSED as a citation — independence is enforced, not assumed', () => {
    expect(() =>
      emitDerived([
        {
          kind: 'readiness',
          disposition: 'ready',
          formed_against: [IN_CONTEXT],
          reasoning: 'formed against the in-context pass',
          ratified_by: 'ai',
          accepted: [pair(emit.warnings[0])],
        },
      ])
    ).toThrow(/in-context pass/);
  });

  it('THREE entries arose at the seam and are EXCLUDED by the gate, not by a phrase check', () => {
    // [3] the stale cross-reference — found by the SYNC AGENT, not by any review pass
    // [4] touchpoint divergence — computed at the seam
    // [5] the at-archive correction — made in flow
    expect(emit.warnings[3]).toMatch(/found by the sync agent/);
    expect(emit.warnings[4]).toMatch(/TOUCHPOINT DIVERGENCE at archive/);
    expect(emit.warnings[5]).toMatch(/AT-ARCHIVE CORRECTION, made in flow/);

    for (const w of [emit.warnings[3], emit.warnings[4], emit.warnings[5]]) {
      // None cites a pass — which is not a stylistic observation but the whole qualifying
      // test. A record built from one can cite nothing, so the gate refuses it outright.
      expect(w).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/);
      expect(() =>
        emitDerived([
          {
            kind: 'readiness',
            disposition: 'ready',
            formed_against: [],
            reasoning: 'a seam-arising note has nothing to be formed against',
            ratified_by: 'ai',
            accepted: [pair(w)],
          },
        ])
      ).toThrow(/NON-EMPTY/);
    }
  });

  it('ONE entry is a METHOD call misfiled in warnings, and the gate excludes it the same way', () => {
    // [2] the size overage — formed against R-crc-1, not against any pass. It is neither an
    // `accepted` pair nor a seam-arising process note: it is a method call whose correct home
    // is design.md's size section, where it also already lives. Naming it is the point —
    // the qualifying test earns its keep by what it EXCLUDES.
    expect(emit.warnings[2]).toMatch(/^SIZE, over the ceiling/);
    expect(emit.warnings[2]).toMatch(/R-crc-1/);
    expect(emit.warnings[2]).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/);
    expect(() =>
      emitDerived([
        {
          kind: 'readiness',
          disposition: 'ready',
          formed_against: [],
          reasoning: 'a method call is formed against a ruling, not against a pass',
          ratified_by: 'ai',
          accepted: [pair(emit.warnings[2])],
        },
      ])
    ).toThrow(/NON-EMPTY/);
  });

  it("the continuation/proceed record carries all THREE gate facts, derived from rc02c's prior-generation apply emit through the trail READER (rc04c task 3.5)", () => {
    // NARROWED at rc04c (design D2). This test once asserted the coexistence guard: that the
    // record AGREED with the `gate_overridden` field beside it. The guard is gone with the
    // field, and one record cannot disagree with itself — so the half that became meaningless
    // is dropped and the half that did not is kept: losing the legacy SHAPE must not quietly
    // become losing the FIELDS. The gate/gate_state/gate_reason trio is the earned lesson of a
    // prior external review (the first coexistence check compared only ONE of the three), and
    // this is now the only remaining assertion that all three travel together.
    //
    // THE PRIOR-GENERATION CLAIM, witnessed by a READER. rc02c's archived apply emits carry
    // the field rc04c retired. Parsing them as JSON proves nothing (external iter 1: JSON
    // parses as JSON, which was never in doubt). The archived change directory is handed to
    // `readTrail` — the reader every gate computation goes through — which must consume the
    // trail without error and surface the apply emits; the three facts are then DERIVED from
    // the emit the reader NAMED, never synthesized here.
    const trail = readTrail(path.dirname(ARCHIVE_SRC));
    expect(trail.applyTokens.length).toBeGreaterThan(0);
    expect(trail.passes.map(p => p.token)).toEqual(
      expect.arrayContaining([FRESH, EXTERNAL_1, EXTERNAL_2, IN_CONTEXT])
    );
    expect(trail.rejectedExternals).toEqual([]);

    const legacy = trail.applyTokens
      .map(t => JSON.parse(fs.readFileSync(path.join(trail.runsDir, `apply-${t}.json`), 'utf-8')))
      .find(d => d.gate_overridden);
    expect(legacy).toBeDefined();
    const go = legacy.gate_overridden as { gate: string; state: string; reason: string };
    // pin the IDENTITY of the cited artifact — rc02c proceeded past review-proposal, and its
    // recorded reason is clause-(c) vocabulary today's engine cannot produce (design.md Context)
    expect(go.gate).toBe('review-proposal');
    expect(go.state).toBe('unpassed');
    expect(go.reason).toMatch(/latest independent pass/);

    const continuation = {
      kind: 'continuation',
      disposition: 'proceed',
      formed_against: [EXTERNAL_1, FRESH],
      reasoning: 'proceeded past the gate knowing what the pair returned',
      ratified_by: 'user',
      gate: go.gate,
      gate_state: go.state,
      gate_reason: go.reason,
    };

    const r = emitDerived([continuation]);
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    expect('gate_overridden' in written).toBe(false); // the successor is the SOLE record
    expect(written.judgements[0].gate).toBe(go.gate);
    expect(written.judgements[0].gate_state).toBe(go.state);
    expect(written.judgements[0].gate_reason).toBe(go.reason);

    // and the assertion with teeth: a record missing ANY ONE of the three facts is refused
    for (const key of ['gate', 'gate_state', 'gate_reason'] as const) {
      const { [key]: _dropped, ...without } = continuation;
      expect(() => emitDerived([without])).toThrow(
        new RegExp(`'${key}' is required on a continuation/proceed`)
      );
    }
  });
});
