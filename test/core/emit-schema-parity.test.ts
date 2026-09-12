/**
 * Schema-table parity (rc01-instrument-fidelity, design D6).
 *
 * The per-command schema references are MIRRORS of the engine's payload tables; the tables
 * are the definition. This test derives each reference's AI-supplied field set — the union
 * of top-level keys over EVERY full-record JSON block, minus one explicit engine-owned list —
 * and asserts the matching table accepts every field. A field the reference documents but
 * the table rejects is a failing test here, never an archive-time discovery (the archive
 * table's four conditional fields, 2026-09-11, are the first regression case).
 */
import { describe, it, expect } from 'vitest';
import { payloadFieldsFor } from '../../src/core/emit-composition.js';
import {
  getReviewSkillTemplate,
  getAddressReviewsSkillTemplate,
  getAuditDriftSkillTemplate,
  getArchiveChangeSkillTemplate,
} from '../../src/core/templates/skill-templates.js';

/** Universal spine + computed keys the engine composes on every command. */
const ENGINE_OWNED = ['command', 'timestamp', 'change', 'doc', 'kind', 'model', 'next_recommended', 'iteration'];
/** Per-command computed keys the reference marks engine-owned. */
const ENGINE_OWNED_PER_COMMAND: Record<string, string[]> = {
  // review: the counts sentence is engine-composed from the scorecard (D4).
  review: ['final_assessment'],
};

const REFERENCES: Array<[command: string, template: () => { references?: Array<{ name: string; content: string }> }, refName: string]> = [
  ['review', getReviewSkillTemplate, 'run-summary-schema.md'],
  ['address-reviews', getAddressReviewsSkillTemplate, 'run-summary-schema.md'],
  ['audit-drift', getAuditDriftSkillTemplate, 'run-summary-schema.md'],
  ['archive', getArchiveChangeSkillTemplate, 'archive-summary-schema.md'],
];

/** Top-level keys of every JSON block whose keys include `command` (a full-record block). */
function documentedKeys(content: string): { keys: Set<string>; blocks: number } {
  const keys = new Set<string>();
  let blocks = 0;
  for (const m of content.matchAll(/```json\n([\s\S]*?)```/g)) {
    const top = [...m[1].matchAll(/^  "([a-z_]+)":/gm)].map((k) => k[1]);
    if (!top.includes('command')) continue;
    blocks += 1;
    for (const k of top) keys.add(k);
  }
  return { keys, blocks };
}

/**
 * Key names the reference's `## Field notes` prose claims — every bullet of the form
 * `- **\`name\`**` (dotted forms `parent.child` contribute their parent). A note naming a key
 * no block carries is a self-contradicting mirror: the audit-drift reference shipped exactly
 * that on 2026-09-11 (its block was corrected; four bullets were not), and the JSON-only
 * derivation could not see it.
 */
function fieldNoteKeys(content: string): Set<string> {
  const section = content.split('## Field notes')[1];
  const keys = new Set<string>();
  if (!section) return keys;
  for (const m of section.matchAll(/^- \*\*`([a-z_]+)(?:\.[a-z_]+)*`\*\*/gm)) keys.add(m[1]);
  return keys;
}

describe('schema-table parity: every AI-supplied field a schema reference documents is accepted by its payload table', () => {
  it('the engine-owned subtraction list is explicit and non-empty', () => {
    expect(ENGINE_OWNED.length).toBeGreaterThan(0);
  });

  for (const [command, template, refName] of REFERENCES) {
    it(`${command}: ${refName} ⊆ payloadFields (all full-record blocks)`, () => {
      const ref = (template().references ?? []).find((r) => r.name === refName);
      expect(ref, `${command} is missing references/${refName}`).toBeDefined();
      const { keys, blocks } = documentedKeys(ref!.content);
      expect(blocks, `${command}: no full-record JSON block found`).toBeGreaterThan(0);
      const table = payloadFieldsFor(command);
      expect(table, `no payload table for ${command}`).toBeDefined();
      const owned = new Set([...ENGINE_OWNED, ...(ENGINE_OWNED_PER_COMMAND[command] ?? [])]);
      const aiSupplied = [...keys].filter((k) => !owned.has(k));
      const rejected = aiSupplied.filter((k) => !table!.includes(k));
      expect(rejected, `${command}: ${refName} documents AI-supplied field(s) the table rejects`).toEqual([]);
    });
  }

  for (const [command, template, refName] of REFERENCES) {
    it(`${command}: every field note names a key the schema block carries`, () => {
      const ref = (template().references ?? []).find((r) => r.name === refName)!;
      const { keys } = documentedKeys(ref.content);
      const owned = new Set([...ENGINE_OWNED, ...(ENGINE_OWNED_PER_COMMAND[command] ?? [])]);
      // Finding-level and nested keys documented inside a block's sub-objects are legitimate
      // note subjects; the check is on TOP-LEVEL emit keys the notes claim.
      const nested = new Set(['recommendation_options', 'severity', 'dimension', 'title', 'file', 'line', 'recommendation', 'evidence', 'ratified_via', 'resolution', 'recommendation_fork', 'ripple_cascade', 'outcome', 'marker_source', 'classification', 'action', 'by_pass', 'by_category', 'reviewer_class', 'walk_mode_shifted_at_finding']);
      const orphaned = [...fieldNoteKeys(ref.content)].filter(
        (k) => !keys.has(k) && !owned.has(k) && !nested.has(k)
      );
      expect(orphaned, `${command}: ${refName} field notes name key(s) no schema block carries`).toEqual([]);
    });
  }

  it('regression: the archive table accepts the four conditional fields its schema defines', () => {
    const table = payloadFieldsFor('archive')!;
    for (const k of ['gate_overridden', 'fingerprint_overridden', 'fingerprints_unverified', 'audit_skipped_via_flag']) {
      expect(table, k).toContain(k);
    }
  });

  it('regression: the audit-drift reference no longer documents fields its table rejects', () => {
    const ref = (getAuditDriftSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
    const { keys } = documentedKeys(ref.content);
    for (const stale of ['context', 'caller', 'depth', 'flags', 'categories_skipped', 'findings_summary']) {
      expect([...keys], stale).not.toContain(stale);
    }
    expect([...keys]).toContain('findings_by_category');
  });

  it('regression: the review reference reads BOTH blocks, and the architecture block carries scorecard, not findings_summary', () => {
    const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
    const { keys, blocks } = documentedKeys(ref.content);
    expect(blocks).toBe(2);
    expect([...keys]).not.toContain('findings_summary');
    expect([...keys]).toContain('handoff');
  });

  it('negative: a documented-but-missing field fails naming the field', () => {
    // Simulate by deriving against a table missing one documented key.
    const ref = (getArchiveChangeSkillTemplate().references ?? []).find((r) => r.name === 'archive-summary-schema.md')!;
    const { keys } = documentedKeys(ref.content);
    const owned = new Set(ENGINE_OWNED);
    const aiSupplied = [...keys].filter((k) => !owned.has(k));
    const crippled = payloadFieldsFor('archive')!.filter((k) => k !== 'gate_overridden');
    const rejected = aiSupplied.filter((k) => !crippled.includes(k));
    expect(rejected).toEqual(['gate_overridden']);
  });
});
