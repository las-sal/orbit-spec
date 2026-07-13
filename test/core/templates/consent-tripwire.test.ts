import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAuditDriftSkillTemplate } from '../../../src/core/templates/skill-templates.js';
import { readChangeMetadata } from '../../../src/utils/change-metadata.js';
import type { ChangeMetadata } from '../../../src/core/artifact-graph/types.js';

/**
 * D1 tripwire (missing consent-record check, per orbit-lifecycle-consent +
 * orbit-audit-drift). The tripwire itself is body prose executed by the driving
 * AI — there is deliberately NO engine code for it (gate state stays a pure
 * function of on-disk artifacts; the tripwire is audit-drift's scan). Two test
 * layers pin it:
 *
 * 1. Body fidelity — the audit-drift body carries the three-tier era rule
 *    verbatim, the exact WARNING wording, and no timestamp fallback.
 * 2. Rule semantics — the documented three-tier classifier, implemented here
 *    exactly as the body states it, produces the spec's required outcomes over
 *    the fixture shapes (post-era emit flagged; straddler pre-stamp exempt /
 *    at-or-after checked; a REAL pre-D1 archive exempt by absence).
 */

// The three-tier rule exactly as the audit-drift body documents it.
// Returns true when the emit (by filename <TS> token) must carry `consent`.
function emitIsChecked(meta: Pick<ChangeMetadata, 'schema_version' | 'consent_era_from'>, emitTsToken: string): boolean {
  if (meta.schema_version !== undefined && meta.schema_version >= 3) return true; // tier 1: born post-capability
  if (meta.consent_era_from) {
    // tier 2: straddler — filename token is colon-replaced ISO; normalize the
    // stamp to token form so lexical comparison matches the trail convention.
    const stampToken = meta.consent_era_from.replace(/:/g, '-');
    return emitTsToken >= stampToken;
  }
  return false; // tier 3: fully pre-capability, exempt
}

describe('D1 tripwire — audit-drift body fidelity', () => {
  const body = getAuditDriftSkillTemplate().instructions;

  it('carries the three-tier era rule with the metadata markers as sole authority', () => {
    expect(body).toContain('three-tier era rule');
    expect(body).toContain('schema_version >= 3');
    expect(body).toContain('consent_era_from');
    expect(body).toContain('NEITHER field');
    expect(body).toContain('NOT schema-name resolution');
    expect(body).toContain('NOT any timestamp constant');
  });

  it('has no timestamp-fallback instruction', () => {
    expect(body).not.toMatch(/timestamp fallback/i);
  });

  it('names the WARNING wording, the emit path, and the missing field', () => {
    expect(body).toContain(
      'lifecycle emit lacks consent record — an unconsented or contract-violating transition may have occurred'
    );
    expect(body).toContain('naming the emit path');
    expect(body).toContain('the missing field (`consent`)');
  });

  it('scopes the scan to active changes too, and names the re-entry trigger', () => {
    expect(body).toContain('also scan ACTIVE changes');
    expect(body).toContain('re-entry trigger');
  });
});

describe('D1 tripwire — three-tier rule semantics (spec scenarios)', () => {
  it('post-era emit is checked: schema_version >= 3 covers ALL lifecycle emits', () => {
    const meta = { schema_version: 3 };
    expect(emitIsChecked(meta, '2026-07-13T10-00-00Z')).toBe(true);
    expect(emitIsChecked(meta, '2020-01-01T00-00-00Z')).toBe(true); // even "old" tokens: born post-capability
  });

  it('straddler: pre-stamp emits exempt, at-or-after-stamp emits checked', () => {
    const meta = { consent_era_from: '2026-07-13T12:00:00Z' };
    expect(emitIsChecked(meta, '2026-07-10T09-00-00Z')).toBe(false); // genuinely pre-capability emit
    expect(emitIsChecked(meta, '2026-07-13T12-00-00Z')).toBe(true); // at the stamp
    expect(emitIsChecked(meta, '2026-07-14T08-30-00Z')).toBe(true); // after the stamp
  });

  it('neither field → fully exempt', () => {
    expect(emitIsChecked({}, '2026-07-13T10-00-00Z')).toBe(false);
  });

  it('a checked emit without consent is the WARNING condition; with consent it is clean', () => {
    const meta = { schema_version: 3 };
    const flagged = (emit: Record<string, unknown>, ts: string) =>
      emitIsChecked(meta, ts) && !('consent' in emit);
    expect(flagged({ command: 'apply' }, '2026-07-13T10-00-00Z')).toBe(true);
    expect(flagged({ command: 'apply', consent: 'user-invoked' }, '2026-07-13T10-00-00Z')).toBe(false);
    expect(flagged({ command: 'archive', consent: 'prompted' }, '2026-07-13T10-00-00Z')).toBe(false);
  });

  it('REAL pre-D1 archives scan exempt by absence (C1 + C2 fixtures)', () => {
    const repoRoot = path.join(__dirname, '..', '..', '..');
    const archives = [
      'orbit/changes/archive/2026-07-06-c1-engine-gates',
      'orbit/changes/archive/2026-07-07-c2-parallel-merge-guardrail',
    ];
    for (const rel of archives) {
      const dir = path.join(repoRoot, rel);
      const meta = readChangeMetadata(dir, repoRoot);
      expect(meta, `${rel} metadata must exist`).not.toBeNull();
      // Exemption-by-absence invariant: pre-D1 archives carry neither marker.
      // If someone backfills schema_version into old archives, this fails loudly.
      expect(meta!.schema_version).toBeUndefined();
      expect(meta!.consent_era_from).toBeUndefined();
      // Every emit in the archived trail is therefore exempt.
      const runsDir = path.join(dir, '.orbit-runs');
      const lifecycleEmits = fs
        .readdirSync(runsDir)
        .filter(f => /^(apply|archive)-.*\.json$/.test(f));
      expect(lifecycleEmits.length).toBeGreaterThan(0);
      for (const f of lifecycleEmits) {
        const token = f.replace(/^(apply|archive)-/, '').replace(/\.json$/, '');
        expect(emitIsChecked(meta!, token), `${rel}/${f} must be exempt`).toBe(false);
      }
    }
  });
});
