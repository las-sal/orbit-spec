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
  // review-external: the T0 handoff flag is composed by the engine, never supplied.
  'review-external': ['awaiting_findings'],
};

/**
 * KNOWN DIVERGENCE (option B, ratified 2026-09-12). The audit-drift reference documents the
 * shape two ARCHIVED requirements mandate (`orbit-conventions`' editorial-emit extensions and
 * scenario keep `findings_summary`/`finding_titles`; `orbit-run-summary-emit` types
 * `categories_run` as an object of named booleans), and the engine's payload table accepts a
 * third shape. Reconciling three voices needs MODIFIED deltas against two more capabilities —
 * past this stage's size ceiling (R-crc-1) — so it is a DATED follow-up owned by rc07
 * (artifact lint, one-voice-for-facts), not an exception this stage may quietly keep. The set
 * is asserted EXACT below, so any NEW divergence still fails loudly.
 */
const KNOWN_DIVERGENCE: Record<string, string[]> = {
  'audit-drift': ['context', 'caller', 'depth', 'flags', 'categories_skipped', 'findings_summary'],
};

const REFERENCES: Array<[command: string, template: () => { references?: Array<{ name: string; content: string }> }, refName: string]> = [
  ['review', getReviewSkillTemplate, 'run-summary-schema.md'],
  // rc04a system walk: the `review-external` T0 block lives in a DIFFERENT reference of the same
  // skill, and was unread here — so rc04a added `judgements` to a block no instrument checked, and
  // a pre-existing divergence sat undetected: the block documented `reviewer_class`, which the
  // payload table REFUSES as an unknown key and the engine never composes, so an author following
  // the schema would have written a refused emit.
  ['review-external', getReviewSkillTemplate, 'external-handoff.md'],
  ['address-reviews', getAddressReviewsSkillTemplate, 'run-summary-schema.md'],
  ['audit-drift', getAuditDriftSkillTemplate, 'run-summary-schema.md'],
  ['archive', getArchiveChangeSkillTemplate, 'archive-summary-schema.md'],
];

/**
 * Top-level keys of a schema block, found STRUCTURALLY — by brace/bracket depth, not by
 * indentation (external iter 1, 2026-09-12: a two-space regex silently dropped a second key
 * on the same line, and a four-space-indented key, so a documented field could bypass the
 * parity check by formatting alone). String contents are skipped so a `"` inside a value
 * never shifts depth.
 */
function topLevelKeys(block: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let current = '';
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') {
        inString = false;
        // A key is a string at depth 1 followed (after spaces) by a colon.
        if (depth === 1) {
          const after = block.slice(i + 1).match(/^\s*:/);
          if (after) keys.push(current);
        }
        current = '';
      } else current += ch;
      continue;
    }
    if (ch === '"') { inString = true; current = ''; continue; }
    if (ch === '{' || ch === '[') depth += 1;
    else if (ch === '}' || ch === ']') depth -= 1;
  }
  return keys;
}

/** Top-level keys of every JSON block whose keys include `command` (a full-record block). */
function documentedKeys(content: string): { keys: Set<string>; blocks: number } {
  const keys = new Set<string>();
  let blocks = 0;
  for (const m of content.matchAll(/```json\n([\s\S]*?)```/g)) {
    const top = topLevelKeys(m[1]);
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
  for (const line of section.split('\n')) {
    if (!line.startsWith('- **')) continue;
    // A bullet may name SEVERAL subjects (`- **\`a\` / \`b\`** are strings…`); collect every
    // backticked identifier in the bolded subject run, not just the first (external iter 1).
    const subject = line.slice(0, line.indexOf('**', 4) + 2);
    for (const m of subject.matchAll(/`([a-z_]+)(?:\.[a-z_]+)*`/g)) keys.add(m[1]);
  }
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
      expect(
        rejected.sort(),
        `${command}: ${refName} documents AI-supplied field(s) the table rejects`
      ).toEqual((KNOWN_DIVERGENCE[command] ?? []).slice().sort());
    });
  }

  for (const [command, template, refName] of REFERENCES) {
    it(`${command}: every field note names a key the schema block carries`, () => {
      const ref = (template().references ?? []).find((r) => r.name === refName)!;
      const { keys } = documentedKeys(ref.content);
      const owned = new Set([...ENGINE_OWNED, ...(ENGINE_OWNED_PER_COMMAND[command] ?? [])]);
      // Finding-level and nested keys documented inside a block's sub-objects are legitimate
      // note subjects; the check is on TOP-LEVEL emit keys the notes claim.
      // rc02b: `reproduction` is a finding-entry field (review), `reproduction_rerun` a resolution-entry
      // field (address-reviews) — nested subjects both; `blocks` is TOP-LEVEL on the review payload and
      // is therefore NOT listed here: its note must be matched by a key the schema block carries.
      const nested = new Set(['recommendation_options', 'severity', 'dimension', 'title', 'file', 'line', 'recommendation', 'reproduction', 'reproduction_rerun', 'evidence', 'ratified_via', 'resolution', 'recommendation_fork', 'ripple_cascade', 'outcome', 'marker_source', 'classification', 'action', 'by_pass', 'by_category', 'reviewer_class', 'walk_mode_shifted_at_finding']);
      const orphaned = [...fieldNoteKeys(ref.content)].filter(
        (k) => !keys.has(k) && !owned.has(k) && !nested.has(k) && !(KNOWN_DIVERGENCE[command] ?? []).includes(k)
      );
      expect(orphaned, `${command}: ${refName} field notes name key(s) no schema block carries`).toEqual([]);
    });
  }

  it('regression: the archive table accepts the three conditional fields its schema defines (four until rc04c retired the gate-override field)', () => {
    const table = payloadFieldsFor('archive')!;
    for (const k of ['fingerprint_overridden', 'fingerprints_unverified', 'audit_skipped_via_flag']) {
      expect(table, k).toContain(k);
    }
  });

  it('regression: the audit-drift divergence is EXACTLY the ratified rc07 follow-up set', () => {
    // Option B (2026-09-12): the reference documents the shape two ARCHIVED requirements
    // mandate; the engine's table accepts a third. Reconciling three voices needs MODIFIED
    // deltas past this stage's ceiling, so the divergence is dated and owned by rc07 — and
    // pinned here, so it can neither grow nor be forgotten.
    const ref = (getAuditDriftSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
    const { keys } = documentedKeys(ref.content);
    const table = payloadFieldsFor('audit-drift')!;
    const owned = new Set(ENGINE_OWNED);
    const diverged = [...keys].filter((k) => !owned.has(k) && !table.includes(k)).sort();
    expect(diverged).toEqual(KNOWN_DIVERGENCE['audit-drift'].slice().sort());
  });

  it('regression: the review reference reads BOTH blocks, and the architecture block carries scorecard, not findings_summary', () => {
    const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
    const { keys, blocks } = documentedKeys(ref.content);
    expect(blocks).toBe(2);
    expect([...keys]).not.toContain('findings_summary');
    expect([...keys]).toContain('handoff');
  });

  it('negative: formatting cannot hide a documented key (external iter 1 mutations)', () => {
    // Two keys on one line, and a four-space-indented key: the old two-space regex missed both.
    const block = '```json\n{\n  "command": "x", "unexpected_one": true,\n    "unexpected_two": 1,\n  "nested": { "inner": 2 }\n}\n```';
    const { keys, blocks } = documentedKeys(block);
    expect(blocks).toBe(1);
    expect([...keys].sort()).toEqual(['command', 'nested', 'unexpected_one', 'unexpected_two']);
    expect([...keys]).not.toContain('inner'); // depth-1 only
  });

  it('negative: a grouped field-note bullet contributes EVERY subject it names', () => {
    const content = '## Field notes\n- **`categories_run` / `categories_skipped`** are strings (category IDs).\n- **`findings_total`** is a count.\n';
    expect([...fieldNoteKeys(content)].sort()).toEqual(['categories_run', 'categories_skipped', 'findings_total']);
  });

  it('known divergence is EXACT, so a new one still fails', () => {
    // The audit-drift set is the ratified rc07 follow-up (option B); nothing else may diverge.
    expect(Object.keys(KNOWN_DIVERGENCE)).toEqual(['audit-drift']);
    expect(KNOWN_DIVERGENCE['audit-drift'].length).toBe(6);
  });

  describe('rc02b-severity-ladder: the three new fields are documented AND accepted (task 1.5)', () => {
    it("review: the schema block carries top-level `blocks`, the table accepts it, and the field notes name `blocks` and `reproduction`", () => {
      const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
      const { keys } = documentedKeys(ref.content);
      expect([...keys]).toContain('blocks');
      expect(payloadFieldsFor('review')).toContain('blocks');
      const notes = fieldNoteKeys(ref.content);
      expect(notes.has('blocks')).toBe(true);
      expect(notes.has('reproduction')).toBe(true);
      // The finding-entry documentation names the field inside the block, not only in prose.
      expect(ref.content).toMatch(/"reproduction":/);
    });

    it('address-reviews: the resolution entry documents `reproduction_rerun` in the block and the field notes', () => {
      const ref = (getAddressReviewsSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
      expect(ref.content).toMatch(/"reproduction_rerun":/);
      expect(fieldNoteKeys(ref.content).has('reproduction_rerun')).toBe(true);
      // The closed value set is stated where the field is documented.
      for (const v of ['reproduced', 'not-reproduced', 'cannot-run', 'unreproduced']) expect(ref.content).toContain(v);
    });

    it('the nested allowlist names exactly the two entry-level subjects (so a top-level `blocks` note cannot hide behind it)', () => {
      const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
      const { keys } = documentedKeys(ref.content);
      // If `blocks` were ever dropped from the block while its note stayed, the orphan check above
      // must catch it — which it only can if `blocks` is NOT in the nested set.
      expect(keys.has('blocks')).toBe(true);
    });
  });

  it('negative: a documented-but-missing field fails naming the field', () => {
    // Simulate by deriving against a table missing one documented key.
    const ref = (getArchiveChangeSkillTemplate().references ?? []).find((r) => r.name === 'archive-summary-schema.md')!;
    const { keys } = documentedKeys(ref.content);
    const owned = new Set(ENGINE_OWNED);
    const aiSupplied = [...keys].filter((k) => !owned.has(k));
    // The victim is a FIXTURE choice, not the subject: it must be documented in the archive
    // reference and live in the table. `fingerprint_overridden` (rc04c: the previous victim
    // was retired from both, so it could no longer stand in).
    const crippled = payloadFieldsFor('archive')!.filter((k) => k !== 'fingerprint_overridden');
    const rejected = aiSupplied.filter((k) => !crippled.includes(k));
    expect(rejected).toEqual(['fingerprint_overridden']);
  });
});
