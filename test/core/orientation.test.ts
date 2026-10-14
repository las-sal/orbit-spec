import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  collectOrientation,
  composeWorkstreamEntry,
  readValidEmits,
  isSpineValid,
  listLiveWorkstreams,
} from '../../src/core/orientation.js';
import { buildArchitectureBuckets, renderStageLine } from '../../src/core/architecture/buckets.js';

/**
 * Orientation module tests (D-arc Stage D3, task 1.4): continuity predicate
 * (archive-emit edge, emit-less fallback, same-second ties), count-based
 * WAITING (concurrent handoffs), fault isolation (corrupt + spine-invalid
 * emits, broken workstream), and the degradation ladder inputs.
 */

let root: string;

function writeEmit(runsDir: string, name: string, json: Record<string, unknown>): void {
  fs.mkdirSync(runsDir, { recursive: true });
  fs.writeFileSync(path.join(runsDir, name), JSON.stringify(json, null, 2));
}

function spine(command: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    command,
    timestamp: '2026-07-20T12:00:00Z',
    change: null,
    final_assessment: `${command} ran. Second sentence for trim tests.`,
    next_recommended: `/orbit:${command} next`,
    kind: 'workflow',
    ...extra,
  };
}

function makeChange(
  name: string,
  opts: { created?: string; schema?: string; full?: boolean } = {}
): string {
  const dir = path.join(root, 'orbit', 'changes', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.openspec.yaml'),
    `schema: ${opts.schema ?? 'spec-driven'}\ncreated: "${opts.created ?? '2026-07-01'}"\n`
  );
  fs.writeFileSync(path.join(dir, 'proposal.md'), '# Proposal');
  if (opts.full) {
    fs.writeFileSync(path.join(dir, 'design.md'), '# Design');
    fs.writeFileSync(path.join(dir, 'tasks.md'), '## 1. Work\n\n- [ ] 1.1 Do the thing\n');
    fs.mkdirSync(path.join(dir, 'specs', 'cap'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'specs', 'cap', 'spec.md'),
      '## ADDED Requirements\n\n### Requirement: X\n\nX SHALL Y.\n\n#### Scenario: S\n\n- **WHEN** a\n- **THEN** b\n'
    );
  }
  return dir;
}

function makeExplore(name: string, opts: { created?: string } = {}): string {
  const dir = path.join(root, 'orbit', 'explore', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.openspec.yaml'),
    `schema: spec-driven\ncreated: "${opts.created ?? '2026-07-01'}"\n`
  );
  fs.writeFileSync(path.join(dir, 'explore.md'), '# Exploration');
  return dir;
}

function makeArchivedChange(name: string): string {
  const dir = path.join(root, 'orbit', 'changes', 'archive', name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * A genuinely-degrading fixture: a project-local schema whose YAML is
 * malformed. Metadata pointing at an UNKNOWN schema is silently defaulted by
 * resolveSchemaForChange (graceful fallback), but a REGISTERED-but-broken
 * schema throws SchemaLoadError from status computation — fault-isolation
 * clause (b)'s trigger.
 */
function makeBrokenChange(name: string): string {
  const schemaDir = path.join(root, 'orbit', 'schemas', 'broken-yaml');
  fs.mkdirSync(schemaDir, { recursive: true });
  fs.writeFileSync(path.join(schemaDir, 'schema.yaml'), 'name: [unclosed\n');
  return makeChange(name, { schema: 'broken-yaml' });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-orientation-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Spine validity + emit reading (fault isolation, clause a)
// ---------------------------------------------------------------------------

describe('isSpineValid', () => {
  it('accepts the universal spine and rejects missing/non-string fields', () => {
    expect(isSpineValid(spine('propose'))).toBe(true);
    expect(isSpineValid({})).toBe(false);
    expect(isSpineValid({ command: 'x', final_assessment: 'y' })).toBe(false);
    expect(isSpineValid({ ...spine('apply'), final_assessment: 42 })).toBe(false);
  });

  it('requires a string mode on review-external T0 emits (the WAITING discriminator)', () => {
    expect(isSpineValid(spine('review-external'))).toBe(false);
    expect(isSpineValid(spine('review-external', { mode: 'proposal' }))).toBe(true);
  });
});

describe('readValidEmits (fault isolation)', () => {
  it('skips invalid-JSON and spine-invalid files; recency falls to next-older valid; deterministic', () => {
    const dir = makeChange('a');
    const runs = path.join(dir, '.orbit-runs');
    writeEmit(runs, 'propose-2026-07-20T10-00-00Z.json', spine('propose'));
    fs.writeFileSync(path.join(runs, 'review-2026-07-20T11-00-00Z.json'), '{not json');
    // Spine-invalid newest: parseable JSON but no final_assessment string.
    fs.writeFileSync(
      path.join(runs, 'apply-2026-07-20T12-00-00Z.json'),
      JSON.stringify({ command: 'apply', next_recommended: '/x' })
    );

    const first = readValidEmits(runs);
    const second = readValidEmits(runs);
    expect(first.map((e) => e.command)).toEqual(['propose']);
    expect(second).toEqual(first); // same inputs, same result
  });
});

// ---------------------------------------------------------------------------
// Continuity predicate
// ---------------------------------------------------------------------------

describe('continuity predicate', () => {
  it('anchors the sprint to the live workstream with the most recent emit', () => {
    const a = makeChange('alpha');
    const b = makeChange('beta');
    writeEmit(path.join(a, '.orbit-runs'), 'propose-2026-07-20T10-00-00Z.json', spine('propose'));
    writeEmit(path.join(b, '.orbit-runs'), 'propose-2026-07-20T11-00-00Z.json', spine('propose'));

    const o = collectOrientation(root);
    expect(o.sprint?.name).toBe('beta');
    expect(o.workstreams[0].name).toBe('beta'); // sprint-first ordering
  });

  // @scenario behaviour orbit-orientation :: Continuity predicate and degradation ladder :: Archive emit does not orient to a closed sprint
  it('archive-emit edge: an archived trail never anchors the sprint BUT surfaces in global LAST', () => {
    const explore = makeExplore('staging-x');
    writeEmit(
      path.join(explore, '.orbit-runs'),
      'explore-2026-07-20T10-00-00Z.json',
      spine('explore')
    );
    const archived = makeArchivedChange('2026-07-20-just-closed');
    writeEmit(
      path.join(archived, '.orbit-runs'),
      'archive-2026-07-20T11-00-00Z.json',
      spine('archive')
    );

    const o = collectOrientation(root);
    // Half 1: the sprint anchors to the live explore, not the newer archive emit.
    expect(o.sprint?.name).toBe('staging-x');
    // Half 2: global LAST names the archive emit (LAST-band-only sourcing).
    expect(o.last?.workstream).toBe('archive/2026-07-20-just-closed');
    expect(o.last?.emit.command).toBe('archive');
    // The archived change appears in no workstream entry.
    expect(o.workstreams.map((w) => w.name)).toEqual(['staging-x']);
  });

  // @scenario behaviour orbit-orientation :: Continuity predicate and degradation ladder :: Same-second emits resolve deterministically
  it('same-second tokens tie-break by workstream name (sprint anchoring)', () => {
    const a = makeChange('alpha');
    const b = makeChange('beta');
    writeEmit(path.join(a, '.orbit-runs'), 'propose-2026-07-20T10-00-00Z.json', spine('propose'));
    writeEmit(path.join(b, '.orbit-runs'), 'propose-2026-07-20T10-00-00Z.json', spine('propose'));

    const o1 = collectOrientation(root);
    const o2 = collectOrientation(root);
    // Lexicographically-earlier workstream name anchors; repeat runs identical.
    expect(o1.sprint?.name).toBe('alpha');
    expect(o2.sprint?.name).toBe('alpha');
  });

  it('same-second tokens tie-break identically in global LAST', () => {
    const a = makeChange('alpha');
    const b = makeChange('beta');
    writeEmit(path.join(a, '.orbit-runs'), 'propose-2026-07-20T10-00-00Z.json', spine('propose'));
    writeEmit(path.join(b, '.orbit-runs'), 'propose-2026-07-20T10-00-00Z.json', spine('propose'));

    const o = collectOrientation(root);
    expect(o.last?.workstream).toBe('alpha');
  });

  it('emit-less fleet falls back to metadata created, ties broken by name', () => {
    makeChange('older', { created: '2026-07-01' });
    makeChange('newer', { created: '2026-07-15' });

    const o = collectOrientation(root);
    expect(o.sprint?.name).toBe('newer');
  });

  it('sprint is null when nothing is live (ladder rungs 2/3 input)', () => {
    const o = collectOrientation(root);
    expect(o.sprint).toBeNull();
    expect(o.workstreams).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Explore sourcing (time-shifted, never live)
// ---------------------------------------------------------------------------

describe('explore next sourcing', () => {
  // @scenario behaviour orbit-orientation :: Continuity predicate and degradation ladder :: Emit-less live workstream still participates
  it('emit-less explore gets the Early canonical string and anchors via created', () => {
    makeExplore('fresh-idea');
    const o = collectOrientation(root);
    expect(o.sprint?.kind).toBe('explore');
    expect(o.sprint?.position).toBe('exploring');
    expect(o.sprint?.next).toBe('/orbit:explore fresh-idea — continue capturing thinking');
    expect(o.sprint?.status).toBeUndefined(); // no per-change payload on explores
  });

  // @scenario behaviour orbit-orientation :: Next-recommendation sourcing is time-shifted, never live :: Explore next comes from the recorded trail
  it('explore with emits renders the recorded next_recommended verbatim', () => {
    const dir = makeExplore('deep-dive');
    writeEmit(
      path.join(dir, '.orbit-runs'),
      'explore-2026-07-20T10-00-00Z.json',
      spine('explore', { next_recommended: '/orbit:propose deep-dive — substantial thinking captured' })
    );
    const o = collectOrientation(root);
    expect(o.sprint?.next).toBe('/orbit:propose deep-dive — substantial thinking captured');
  });
});

// ---------------------------------------------------------------------------
// Concluded explores (rc13b): chip, position and next from the TRAIL's status token
// ---------------------------------------------------------------------------

describe('concluded explore row (rc13b)', () => {
  const concludedEmit = (name: string, extra: Record<string, unknown> = {}) =>
    spine('explore', {
      next_recommended: 'Concluded 2026-09-25. Reopens when: a third withdrawn stage.',
      status: { token: 'concluded', date: '2026-09-25', re_entry: 'a third withdrawn stage' },
      ...extra,
    });

  it('newest emit with status.token concluded → chip ■, position concluded, next verbatim; waiting gains nothing', () => {
    const dir = makeExplore('done-idea');
    // The FILE says nothing to orientation: leave it exploring to prove the row reads the trail.
    fs.writeFileSync(path.join(dir, 'explore.md'), '> **Status**: exploring.\n\n# Exploration');
    writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', spine('explore', { status: { token: 'exploring' } }));
    writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-21T10-00-00Z.json', concludedEmit('done-idea'));
    const o = collectOrientation(root);
    expect(o.sprint?.kind).toBe('explore');
    expect(o.sprint?.position).toBe('concluded');
    expect(o.sprint?.strip?.[0]).toEqual({ phase: 'explore', glyph: '■' });
    expect(o.sprint?.strip?.slice(1).every((c) => c.glyph === '')).toBe(true);
    expect(o.sprint?.next).toBe('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    expect(o.sprint?.status).toBeUndefined();
    expect(o.sprint?.last?.status).toEqual({ token: 'concluded', date: '2026-09-25', re_entry: 'a third withdrawn stage' });
    expect(o.waiting).toEqual([]);
  });

  it('a newest emit without status, with a non-object status, or with an object lacking a string token renders exploring', () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ['no-status', {}],
      ['string-status', { status: 'concluded' }],
      ['array-status', { status: ['concluded'] }],
      ['null-status', { status: null }],
      ['no-token', { status: { date: '2026-09-25' } }],
      ['numeric-token', { status: { token: 7 } }],
    ];
    for (const [name, extra] of cases) {
      const dir = makeExplore(name);
      writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', spine('explore', extra));
    }
    const o = collectOrientation(root);
    for (const [name] of cases) {
      const ws = o.workstreams.find((w) => w.name === name);
      expect(ws?.position, name).toBe('exploring');
      expect(ws?.strip?.[0], name).toEqual({ phase: 'explore', glyph: '▶' });
      expect(ws?.last, name).not.toHaveProperty('status');
    }
  });

  it('a hand-flipped header without an emit lags: the file says concluded, the newest emit says exploring → ▶ and exploring', () => {
    const dir = makeExplore('flipped');
    fs.writeFileSync(path.join(dir, 'explore.md'), '> **Status**: concluded 2026-09-25.\n\n# Exploration');
    writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', spine('explore', { status: { token: 'exploring' } }));
    const o = collectOrientation(root);
    expect(o.sprint?.position).toBe('exploring');
    expect(o.sprint?.strip?.[0].glyph).toBe('▶');
  });

  it('a spine-invalid newest emit is skipped and the next-older emit\'s token governs', () => {
    const dir = makeExplore('skipped-newest');
    writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', concludedEmit('skipped-newest'));
    // Newer but spine-invalid (no final_assessment): skipped everywhere, so the concluded emit stays newest.
    writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-22T10-00-00Z.json', {
      command: 'explore',
      next_recommended: '/orbit:explore skipped-newest — x',
      status: { token: 'exploring' },
    });
    const o = collectOrientation(root);
    expect(o.sprint?.position).toBe('concluded');
    expect(o.sprint?.strip?.[0].glyph).toBe('■');
    expect(o.sprint?.next).toBe('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    // and the reverse: a concluded emit that is spine-invalid never flips the row
    const dir2 = makeExplore('invalid-concluded');
    writeEmit(path.join(dir2, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', spine('explore', { status: { token: 'exploring' } }));
    writeEmit(path.join(dir2, '.orbit-runs'), 'explore-2026-07-23T10-00-00Z.json', { command: 'explore', status: { token: 'concluded', date: '2026-09-25' } });
    const o2 = collectOrientation(root);
    expect(o2.workstreams.find((w) => w.name === 'invalid-concluded')?.position).toBe('exploring');
  });

  it('a degraded explore (broken metadata) keeps its trail-derived position, so a concluded row stays concluded', () => {
    const dir = makeExplore('degraded-concluded');
    fs.writeFileSync(path.join(dir, '.openspec.yaml'), 'schema: [broken\n');
    writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', concludedEmit('degraded-concluded'));
    const o = collectOrientation(root);
    const ws = o.workstreams.find((w) => w.name === 'degraded-concluded');
    expect(ws?.degraded).toBe(true);
    expect(ws?.position).toBe('concluded');
    expect(ws?.next).toBe('Concluded 2026-09-25. Reopens when: a third withdrawn stage.');
    // and an exploring degraded row says so
    const dir2 = makeExplore('degraded-exploring');
    fs.writeFileSync(path.join(dir2, '.openspec.yaml'), 'schema: [broken\n');
    writeEmit(path.join(dir2, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', spine('explore'));
    const o2 = collectOrientation(root);
    expect(o2.workstreams.find((w) => w.name === 'degraded-exploring')?.position).toBe('exploring');
  });

  it('readValidEmits keeps only the string fields of a well-formed status object', () => {
    const dir = makeExplore('shape');
    writeEmit(path.join(dir, '.orbit-runs'), 'explore-2026-07-20T10-00-00Z.json', spine('explore', { status: { token: 'concluded', date: 5, re_entry: 'why', junk: true } }));
    const [e] = readValidEmits(path.join(dir, '.orbit-runs'));
    expect(e.status).toEqual({ token: 'concluded', re_entry: 'why' });
  });
});

// ---------------------------------------------------------------------------
// WAITING derivation (count-based externals)
// ---------------------------------------------------------------------------

describe('count-based WAITING', () => {
  it('concurrent handoffs never falsely clear: 2 packaged / 1 returned stays outstanding', () => {
    const dir = makeChange('gamma');
    const runs = path.join(dir, '.orbit-runs');
    writeEmit(runs, 'review-external-2026-07-20T10-00-00Z.json', spine('review-external', { mode: 'proposal' }));
    writeEmit(runs, 'review-external-2026-07-20T10-30-00Z.json', spine('review-external', { mode: 'proposal' }));
    // ONE returned findings file, later than both T0s.
    fs.writeFileSync(
      path.join(runs, 'external-proposal-2026-07-20T11-00-00Z.md'),
      '# External Review: gamma (iteration 1)\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
    );

    const o = collectOrientation(root);
    const item = o.waiting.find((w) => w.includes('external'));
    expect(item).toBeDefined();
    expect(item).toContain('2 external review(s) packaged, 1 returned'); // the spec literal
    expect(item).toContain('(proposal)'); // mode outside the quoted phrase
  });

  it('balanced counts clear; spine-invalid T0s are excluded from the arithmetic', () => {
    const dir = makeChange('delta');
    const runs = path.join(dir, '.orbit-runs');
    writeEmit(runs, 'review-external-2026-07-20T10-00-00Z.json', spine('review-external', { mode: 'proposal' }));
    // Spine-invalid T0 (missing mode): must not count as packaged.
    writeEmit(runs, 'review-external-2026-07-20T10-30-00Z.json', spine('review-external'));
    fs.writeFileSync(
      path.join(runs, 'external-proposal-2026-07-20T11-00-00Z.md'),
      '# External Review: delta (iteration 1)\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
    );

    const o = collectOrientation(root);
    expect(o.waiting.find((w) => w.includes('external'))).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Fault isolation (clause b): one broken workstream degrades alone
// ---------------------------------------------------------------------------

describe('fault isolation', () => {
  it('a workstream whose schema fails to load renders a degraded entry; healthy rows intact', () => {
    makeChange('healthy-one');
    makeChange('healthy-two');
    makeBrokenChange('broken');

    const o = collectOrientation(root);
    expect(o.workstreams).toHaveLength(3);
    const broken = o.workstreams.find((w) => w.name === 'broken');
    expect(broken?.degraded).toBe(true);
    expect(typeof broken?.error).toBe('string');
    expect(broken?.strip).toBeUndefined(); // no fabricated tuple
    const healthy = o.workstreams.filter((w) => !w.degraded);
    expect(healthy).toHaveLength(2);
    for (const h of healthy) expect(h.strip?.length).toBeGreaterThan(0);
  });

  it('a degraded workstream with a readable trail still carries last (trustworthy fields)', () => {
    const dir = makeBrokenChange('broken-trail');
    writeEmit(path.join(dir, '.orbit-runs'), 'propose-2026-07-20T10-00-00Z.json', spine('propose'));

    const o = collectOrientation(root);
    const broken = o.workstreams.find((w) => w.name === 'broken-trail');
    expect(broken?.degraded).toBe(true);
    expect(broken?.last?.command).toBe('propose');
  });

  it('invalid-YAML metadata degrades the entry — the normative clause-(b) trigger (change AND explore)', () => {
    const c = makeChange('bad-meta-change');
    fs.writeFileSync(path.join(c, '.openspec.yaml'), 'schema: [unclosed\n');
    const e = makeExplore('bad-meta-explore');
    fs.writeFileSync(path.join(e, '.openspec.yaml'), 'created: :::\nschema: [nope\n');

    const o = collectOrientation(root);
    const change = o.workstreams.find((w) => w.name === 'bad-meta-change');
    const explore = o.workstreams.find((w) => w.name === 'bad-meta-explore');
    expect(change?.degraded).toBe(true);
    expect(explore?.degraded).toBe(true);
    expect('strip' in (change ?? {})).toBe(false); // no fabricated healthy entry
    expect('status' in (change ?? {})).toBe(false);
  });

  it('metadata naming an unknown schema degrades instead of silently defaulting', () => {
    makeChange('ghost-schema', { schema: 'no-such-schema' });
    const o = collectOrientation(root);
    const entry = o.workstreams.find((w) => w.name === 'ghost-schema');
    expect(entry?.degraded).toBe(true);
    expect(typeof entry?.error).toBe('string');
  });

  it('a degraded EXPLORE keeps its trustworthy next (trail-recorded, or Early canonical when emit-less)', () => {
    const withTrail = makeExplore('degraded-with-trail');
    writeEmit(
      path.join(withTrail, '.orbit-runs'),
      'explore-2026-07-20T10-00-00Z.json',
      spine('explore', { next_recommended: '/orbit:propose degraded-with-trail — ready' })
    );
    fs.writeFileSync(path.join(withTrail, '.openspec.yaml'), 'schema: [unclosed\n');
    const emitless = makeExplore('degraded-emitless');
    fs.writeFileSync(path.join(emitless, '.openspec.yaml'), 'schema: [unclosed\n');
    // A degraded CHANGE keeps no next — its source IS the failed computation.
    const change = makeChange('degraded-change');
    fs.writeFileSync(path.join(change, '.openspec.yaml'), 'schema: [unclosed\n');

    const o = collectOrientation(root);
    const trailed = o.workstreams.find((w) => w.name === 'degraded-with-trail');
    const bare = o.workstreams.find((w) => w.name === 'degraded-emitless');
    const chg = o.workstreams.find((w) => w.name === 'degraded-change');
    expect(trailed?.degraded).toBe(true);
    expect(trailed?.next).toBe('/orbit:propose degraded-with-trail — ready');
    expect(bare?.next).toBe('/orbit:explore degraded-emitless — continue capturing thinking');
    expect(chg?.degraded).toBe(true);
    expect('next' in (chg ?? {})).toBe(false);
  });

  it('a change and an explore sharing a name stay distinct with a deterministic total order', () => {
    // Emit-less twins with the SAME created date: the comparators must stay
    // antisymmetric — the kind:name key is the final tie-break, so the change
    // ('change:twin' < 'explore:twin') anchors and the order is exact.
    makeChange('twin', { created: '2026-07-10' });
    makeExplore('twin'); // makeExplore writes created 2026-07-01... align below
    fs.writeFileSync(
      path.join(root, 'orbit', 'explore', 'twin', '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-10"\n'
    );
    const o1 = collectOrientation(root);
    const o2 = collectOrientation(root);
    expect(o1.workstreams).toHaveLength(2);
    expect(o1.sprint?.kind).toBe('change');
    expect(o1.workstreams.map((w) => `${w.kind}:${w.name}`)).toEqual([
      'change:twin',
      'explore:twin',
    ]);
    expect(o2.workstreams.map((w) => `${w.kind}:${w.name}`)).toEqual(
      o1.workstreams.map((w) => `${w.kind}:${w.name}`)
    );
  });

  it('corrupt newest emit falls back deterministically for the sprint last', () => {
    const dir = makeChange('epsilon');
    const runs = path.join(dir, '.orbit-runs');
    writeEmit(runs, 'propose-2026-07-20T10-00-00Z.json', spine('propose'));
    fs.writeFileSync(path.join(runs, 'review-2026-07-20T11-00-00Z.json'), '{{{');

    const o1 = collectOrientation(root);
    const o2 = collectOrientation(root);
    expect(o1.sprint?.last?.command).toBe('propose');
    expect(o2.sprint?.last?.command).toBe('propose');
  });
});

// ---------------------------------------------------------------------------
// Strip + per-trail recency fidelity (external system iter 1)
// ---------------------------------------------------------------------------

describe('strip and recency fidelity', () => {
  it('a READY apply gate at 0/N carries the current glyph (entry-boundary form)', () => {
    makeChange('at-the-gate', { full: true });
    const entry = composeWorkstreamEntry(root, listLiveWorkstreams(root)[0]);
    const apply = entry.strip?.find((c) => c.phase === 'apply');
    expect(apply?.detail).toBe('0/1');
    expect(apply?.glyph).toBe('▶');
  });

  it('a spine-invalid review emit moves neither last nor the review chip count', () => {
    const dir = makeChange('quiet-review', { full: true });
    const runs = path.join(dir, '.orbit-runs');
    writeEmit(runs, 'propose-2026-07-20T10-00-00Z.json', spine('propose'));
    // Parseable JSON, but no final_assessment/next_recommended → spine-invalid.
    fs.writeFileSync(
      path.join(runs, 'review-proposal-2026-07-20T11-00-00Z.json'),
      JSON.stringify({ command: 'review', mode: 'proposal' })
    );

    const entry = composeWorkstreamEntry(root, listLiveWorkstreams(root)[0]);
    expect(entry.last?.command).toBe('propose');
    const review = entry.strip?.find((c) => c.phase === 'review');
    expect(review?.detail).toBeUndefined(); // 0 counted iterations
  });

  it('same-trail equal tokens select by the SHARED tie-break direction (earlier filename wins)', () => {
    const dir = makeChange('same-second');
    const runs = path.join(dir, '.orbit-runs');
    writeEmit(runs, 'propose-2026-07-20T10-00-00Z.json', spine('propose'));
    writeEmit(runs, 'apply-2026-07-20T10-00-00Z.json', spine('apply'));

    const emits = readValidEmits(runs);
    // `apply-...` < `propose-...` lexicographically → apply is MORE recent
    // under the shared comparator and must be the selected newest.
    expect(emits[emits.length - 1].command).toBe('apply');
    const entry = composeWorkstreamEntry(root, listLiveWorkstreams(root)[0]);
    expect(entry.last?.command).toBe('apply');
  });

  it('quiescent sibling stages inside MALFORMED docs reach WAITING (no doc-class qualifier)', () => {
    const archDir = path.join(root, 'orbit', 'architecture');
    fs.mkdirSync(archDir, { recursive: true });
    fs.writeFileSync(
      path.join(archDir, 'half-broken.md'),
      '# P\n\n### Stage good-stage — fine\n\nText.\n\n### Stage broken stage\n\nOops.\n'
    );
    const archived = makeArchivedChange('2026-07-20-done-work');
    fs.writeFileSync(
      path.join(archived, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-01"\narchitecture:\n  doc: half-broken\n  stage: good-stage\n'
    );
    makeChange('live-one'); // keep a live workstream so the view has a sprint

    const o = collectOrientation(root);
    expect(o.waiting).toContain('good-stage completion — yours to ratify');
  });

  it('ended and ended-from-explore stages contribute NOTHING to WAITING; the PROGRAM band renders both through the shared builder (rc15)', () => {
    const archDir = path.join(root, 'orbit', 'architecture');
    fs.mkdirSync(archDir, { recursive: true });
    fs.writeFileSync(
      path.join(archDir, 'prog.md'),
      '# P\n\n### Stage s1-ended — declared ended\n\nDepends-on: (none)\nComplete: [~] 2026-09-28 (Sal)\n\n### Stage s2-concluded — only a concluded exploration cites it\n\nComplete: [ ]\n\n### Stage s3-awaiting — a real awaiting one\n\nComplete: [ ]\n'
    );
    const archived = makeArchivedChange('2026-09-01-s1-work');
    fs.writeFileSync(
      path.join(archived, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-09-01"\narchitecture:\n  doc: prog\n  stage: s1-ended\n'
    );
    const concluded = makeExplore('s2-think');
    fs.writeFileSync(
      path.join(concluded, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-09-01"\narchitecture:\n  doc: prog\n  stage: s2-concluded\n'
    );
    fs.writeFileSync(path.join(concluded, 'explore.md'), '> **Status**: concluded 2026-09-25.\n\n# Exploration\n');
    const awaiting = makeArchivedChange('2026-09-02-s3-work');
    fs.writeFileSync(
      path.join(awaiting, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-09-02"\narchitecture:\n  doc: prog\n  stage: s3-awaiting\n'
    );
    makeChange('live-one'); // keep a live workstream so the view has a sprint

    const o = collectOrientation(root);
    // The closed set keys on the exact awaiting string: only s3 reaches WAITING.
    expect(o.waiting.filter((w) => w.includes('completion — yours to ratify'))).toEqual(['s3-awaiting completion — yours to ratify']);
    expect(o.waiting.some((w) => w.includes('s1-ended') || w.includes('s2-concluded'))).toBe(false);

    // The PROGRAM band is the shared builder's output — byte-identical to `orbit architecture status`.
    const direct = buildArchitectureBuckets(root);
    expect(o.program).toEqual(direct);
    const strip = (t: string) => t.replace(/\u001b\[[0-9;]*m/g, '');
    const lines = o.program.parseable[0].stages.map((st) => strip(renderStageLine(st)));
    expect(lines).toEqual(direct.parseable[0].stages.map((st) => strip(renderStageLine(st))));
    expect(lines[0]).toBe('  s1-ended — ended (declared 2026-09-28 by Sal) [archived-change:2026-09-01-s1-work]');
    expect(lines[1]).toBe('  s2-concluded — ended-from-explore [explore:s2-think (concluded)]');
    // The concluded explore is still a live-listed workstream (orientation reads its trail, not the file — D3).
    expect(o.workstreams.some((w) => w.kind === 'explore' && w.name === 's2-think')).toBe(true);
  });

  it('WAITING renders the singular literal at one packaged handoff', () => {
    const dir = makeChange('single-handoff');
    writeEmit(
      path.join(dir, '.orbit-runs'),
      'review-external-2026-07-20T10-00-00Z.json',
      spine('review-external', { mode: 'proposal' })
    );
    const o = collectOrientation(root);
    const item = o.waiting.find((w) => w.includes('external'));
    expect(item).toContain('1 external review packaged, 0 returned'); // singular, the spec literal
    expect(item).not.toContain('review(s)');
  });
});

// ---------------------------------------------------------------------------
// Workstream entry shape (the shared discriminated shape)
// ---------------------------------------------------------------------------

describe('workstream entry shape', () => {
  it('change entries nest the per-change payload under status (gate state at status.gates)', () => {
    const ws = listLiveWorkstreams(root);
    expect(ws).toEqual([]);
    makeChange('shape-check');
    const [only] = listLiveWorkstreams(root);
    const entry = composeWorkstreamEntry(root, only);
    expect(entry.kind).toBe('change');
    expect(entry.status).toBeDefined();
    expect(Array.isArray(entry.status?.gates)).toBe(true);
    expect((entry as Record<string, unknown>)['gates']).toBeUndefined(); // no entry-level gates key
    expect(entry.strip?.some((c) => c.phase === 'propose')).toBe(true);
    // Absent fields are omitted, never null.
    expect('stage' in entry).toBe(false);
  });

  it('carries the stage citation only when metadata cites one', () => {
    const dir = makeChange('cited');
    fs.writeFileSync(
      path.join(dir, '.openspec.yaml'),
      'schema: spec-driven\ncreated: "2026-07-01"\narchitecture:\n  doc: my-arc\n  stage: s1\n'
    );
    const entry = composeWorkstreamEntry(root, listLiveWorkstreams(root)[0]);
    expect(entry.stage).toEqual({ doc: 'my-arc', stage: 's1' });
  });
});

/**
 * D-arc Stage D6 — the resolved PR regime on the orientation surface.
 *
 * The bodies read `pr` from here rather than parsing `orbit/config.yaml` themselves, so the
 * closed value set is enforced once by the reader instead of re-derived in prose at every
 * seam. These assertions cover the property that motivated surfacing it: every inert path
 * resolves to `never` rather than leaking a typo into the choreography.
 */
describe('orientation exposes the resolved pr regime (D6)', () => {
  function withConfig(body: string | null): string {
    if (body !== null) {
      fs.mkdirSync(path.join(root, 'orbit'), { recursive: true });
      fs.writeFileSync(path.join(root, 'orbit', 'config.yaml'), body);
    }
    return root;
  }

  it('resolves never when no config file exists at all', () => {
    expect(collectOrientation(root).pr).toBe('never');
  });

  it('resolves never when the key is absent', () => {
    withConfig('schema: spec-driven\n');
    expect(collectOrientation(root).pr).toBe('never');
  });

  it.each(['never', 'per-proposal', 'per-architecture'] as const)('resolves %s', (mode) => {
    withConfig(`schema: spec-driven\npr: ${mode}\n`);
    expect(collectOrientation(root).pr).toBe(mode);
  });

  it('resolves an unrecognized value to never — the typo never reaches the choreography', () => {
    withConfig('schema: spec-driven\npr: per-architect\n');
    expect(collectOrientation(root).pr).toBe('never');
  });

  it('resolves a non-scalar shape to never (the superseded two-key block)', () => {
    withConfig('schema: spec-driven\npr:\n  open: never\n  program-branches: true\n');
    expect(collectOrientation(root).pr).toBe('never');
  });

  it('never throws on a malformed config — orientation stays read-only and total', () => {
    withConfig('schema: spec-driven\npr: [oops\n');
    expect(() => collectOrientation(root)).not.toThrow();
    expect(collectOrientation(root).pr).toBe('never');
  });
});
