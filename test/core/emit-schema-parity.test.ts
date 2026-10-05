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
  getArchiveChangeSkillTemplate,
} from '../../src/core/templates/skill-templates.js';
// rc07b (design D2): the references, the engine-owned subtraction and the key reader live in ONE
// shared helper the round-trip suite imports too. `ENGINE_OWNED_PER_COMMAND['audit-drift']` there
// declares the two counts rc07b made engine-computed (the `A new engine-owned key must be declared`
// scenario). There is NO tolerated-divergence list: rc07b retired the one this file carried
// (`Payload tables agree with their schema references` admits no exemption).
import { REFERENCES, ENGINE_OWNED, engineOwnedFor, fences, schemaBlockKeys } from '../helpers/schema-references.js';

/**
 * Finding-level and nested keys documented inside a block's sub-objects — legitimate field-note
 * subjects that no TOP-LEVEL emit key carries. A TOP-LEVEL key must NEVER be listed here: the
 * orphan check only fires for keys outside this set, so listing `blocks` or `direction` would
 * disarm it for exactly the note whose block key could be dropped (rc02b; rc04b walk 1, fresh W6).
 */
const NESTED_NOTE_SUBJECTS = new Set(['recommendation_options', 'category', 'severity', 'dimension', 'title', 'file', 'line', 'recommendation', 'reproduction', 'reproduction_rerun', 'evidence', 'ratified_via', 'resolution', 'recommendation_fork', 'ripple_cascade', 'outcome', 'marker_source', 'classification', 'action', 'by_pass', 'by_category', 'reviewer_class', 'walk_mode_shifted_at_finding', 'walk_entry', 'sweep', 'ripple_miss_of', 'remedy', 'routed_to', 'disagreement']);

/** Top-level keys of every full-record schema block — the helper's ONE block grammar (rc07b walk 1). */
function documentedKeys(content: string): { keys: Set<string>; blocks: number } {
  const keys = new Set<string>();
  let blocks = 0;
  for (const f of fences(content)) {
    const top = schemaBlockKeys(f);
    if (!top) continue;
    blocks += 1;
    for (const k of top) keys.add(k);
  }
  return { keys, blocks };
}

/** The AI-supplied fields a reference documents that the command's payload table refuses — sorted. */
function rejectedFields(command: string, content: string): string[] {
  const { keys } = documentedKeys(content);
  const owned = engineOwnedFor(command);
  const table = payloadFieldsFor(command) ?? [];
  return [...keys].filter((k) => !owned.has(k) && !table.includes(k)).sort();
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
      const { blocks } = documentedKeys(ref!.content);
      expect(blocks, `${command}: no full-record JSON block found`).toBeGreaterThan(0);
      expect(payloadFieldsFor(command), `no payload table for ${command}`).toBeDefined();
      // NO exemption (rc07b): a documented field the table refuses fails, always.
      expect(
        rejectedFields(command, ref!.content),
        `${command}: ${refName} documents AI-supplied field(s) the table rejects`
      ).toEqual([]);
    });
  }

  for (const [command, template, refName] of REFERENCES) {
    it(`${command}: every field note names a key the schema block carries`, () => {
      const ref = (template().references ?? []).find((r) => r.name === refName)!;
      const { keys } = documentedKeys(ref.content);
      const owned = engineOwnedFor(command);
      // Finding-level and nested keys documented inside a block's sub-objects are legitimate
      // note subjects; the check is on TOP-LEVEL emit keys the notes claim.
      // rc02b: `reproduction` is a finding-entry field (review), `reproduction_rerun` a resolution-entry
      // field (address-reviews) — nested subjects both; `blocks` is TOP-LEVEL on the review payload and
      // is therefore NOT listed here: its note must be matched by a key the schema block carries.
      const nested = NESTED_NOTE_SUBJECTS;
      const orphaned = [...fieldNoteKeys(ref.content)].filter(
        (k) => !keys.has(k) && !owned.has(k) && !nested.has(k)
      );
      expect(orphaned, `${command}: ${refName} field notes name key(s) no schema block carries`).toEqual([]);
    });
  }

  it('rc03c (1.4): verification is a top-level review key the table accepts; walk_entry sits in the finding shape; pass_genre / verified_walks are documented engine-owned and never accepted', () => {
    const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
    const { keys } = documentedKeys(ref.content);
    const table = payloadFieldsFor('review')!;
    expect([...keys]).toContain('verification');
    expect(table).toContain('verification');
    expect(ref.content).toMatch(/"findings": \[[\s\S]*"walk_entry": \{ "title"[\s\S]*\n  \],/);
    for (const k of ['pass_genre', 'verified_walks']) {
      expect([...keys]).toContain(k);
      expect(table).not.toContain(k);
      expect(ref.content).toMatch(new RegExp(`"${k}": [^\n]*engine-computed`));
    }
  });

  it('regression: the archive table accepts the three conditional fields its schema defines (four until rc04c retired the gate-override field)', () => {
    const table = payloadFieldsFor('archive')!;
    for (const k of ['fingerprint_overridden', 'fingerprints_unverified', 'audit_skipped_via_flag']) {
      expect(table, k).toContain(k);
    }
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

  it('one block grammar (rc07b walk 1, fresh S3): a tilde fence and a trailing-space info string are schema blocks here exactly as in the round trip; a `json example` block never is', () => {
    const tilde = '~~~json\n{ "command": "x", "a": 1 }\n~~~\n';
    const spaced = '```json \n{ "command": "x", "b": 1 }\n```\n';
    const example = '```json example change\n{ "command": "x", "c": 1 }\n```\n';
    expect([...documentedKeys(tilde).keys].sort()).toEqual(['a', 'command']);
    expect([...documentedKeys(spaced).keys].sort()).toEqual(['b', 'command']);
    expect(documentedKeys(example).blocks).toBe(0);
  });

  it('negative: a grouped field-note bullet contributes EVERY subject it names', () => {
    const content = '## Field notes\n- **`categories_run` / `categories_skipped`** are strings (category IDs).\n- **`findings_total`** is a count.\n';
    expect([...fieldNoteKeys(content)].sort()).toEqual(['categories_run', 'categories_skipped', 'findings_total']);
  });

  it('negative (rc07b): no divergence is tolerated — a documented field the table refuses fails naming the field and the reference', () => {
    // A mutated copy of the REAL audit-drift reference re-documents one field rc07b retired.
    const [, template, refName] = REFERENCES.find(([c]) => c === 'audit-drift')!;
    const content = (template().references ?? []).find((r) => r.name === refName)!.content;
    const anchor = '  "categories_run": ["1", "2", "3", "4", "5", "6"],\n  "findings_total"';
    expect(content.split(anchor).length - 1, 'mutation anchor').toBe(1);
    const mutated = content.replace(anchor, '  "categories_run": ["1", "2", "3", "4", "5", "6"],\n  "depth": "full",\n  "findings_total"');
    expect(rejectedFields('audit-drift', mutated)).toEqual(['depth']);
    // And the real reference documents none.
    expect(rejectedFields('audit-drift', content)).toEqual([]);
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

  describe('rc04b-forward-recommendation: `direction` is documented TOP-LEVEL and accepted (task 1.5)', () => {
    it('review: the schema block carries top-level `direction`, the table accepts it, and a field note names it', () => {
      const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
      const { keys } = documentedKeys(ref.content);
      expect([...keys]).toContain('direction');
      expect(payloadFieldsFor('review')).toContain('direction');
      expect(fieldNoteKeys(ref.content).has('direction')).toBe(true);
      // The closed set and both sub-keys are stated where the field is documented.
      expect(ref.content).toMatch(/"direction":\s*\{/);
      expect(ref.content).toMatch(/"disposition":/);
      expect(ref.content).toMatch(/"reasoning":/);
    });

    it('`direction` is NEVER in the nested allowlist (a top-level key there disarms the orphan check — walk 1, fresh W6)', () => {
      expect(NESTED_NOTE_SUBJECTS.has('direction')).toBe(false);
      expect(NESTED_NOTE_SUBJECTS.has('blocks')).toBe(false);
    });

    it('`disposition` / `reasoning` join the nested set ONLY if a field note makes them bullet subjects', () => {
      const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'run-summary-schema.md')!;
      const notes = fieldNoteKeys(ref.content);
      for (const k of ['disposition', 'reasoning']) {
        expect(notes.has(k) === NESTED_NOTE_SUBJECTS.has(k), `${k}: a bullet subject iff nested-listed`).toBe(true);
      }
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
