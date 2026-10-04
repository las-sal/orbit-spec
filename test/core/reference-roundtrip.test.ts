/**
 * Payload schema references are proven by EXECUTION (rc07b-reference-roundtrip;
 * `orbit-emit-composition`'s `Payload schema references are proven by execution`).
 *
 * The rc01 field-set test compares a schema block's keys with the payload table, and so could not
 * tell a divergence from a refusal: it pinned audit-drift's six REFUSED fields as a tolerated
 * divergence. This suite submits each reference's own `json example <scope>…` block, unchanged,
 * through the real write gate (`composeAndWriteEmit`) in a disposable project per (example, scope)
 * pair — acceptance is the assertion, and a refusal fails carrying the gate's own error text.
 *
 * Order matters and is deliberate: PARSE (scope words, attachment, a block with no example) →
 * SUBMIT → COVERAGE. Submitting before the coverage check means a key the gate refuses fails as the
 * gate's error, never as a coverage mismatch that would hide the refusal.
 *
 * Named limit (BOUNDED, D-rc07b-1): the round trip is exactly as strong as the write gate's
 * validators — a documented type or value the gate does not check stays a reviewer's claim.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, type ComposeResult } from '../../src/core/emit-composition.js';
import { REFERENCES, referenceContent, engineOwnedFor, fences, schemaBlockKeys, type Fence } from '../helpers/schema-references.js';

/** The requirement's closed scope-word table; any other word (or none) fails naming the line. */
const SCOPE_WORDS = ['change', 'archived', 'project', 'doc'] as const;
type Scope = (typeof SCOPE_WORDS)[number];

/**
 * GENRE-DEPENDENT keys — a CLOSED list, exempt from joint coverage BY NAME. `verification` is owed
 * on a VERIFICATION-genre pass and refused on a REVIEW-genre one; a fresh disposable trail computes
 * REVIEW, so no example can carry it. Its acceptance is proven by the write gate's own tests (rc03c).
 */
const GENRE_DEPENDENT = ['verification'];

const CHANGE = 'example-change';
const DOC = 'example-doc';

interface SchemaBlock extends Fence {
  keys: string[];
}

interface Example extends Fence {
  scopes: Scope[];
  payload: Record<string, unknown>;
  block: SchemaBlock;
}

interface Analysis {
  schemaBlocks: SchemaBlock[];
  examples: Example[];
}

const blockName = (b: Fence) => `block at line ${b.line} (\`${b.opening.trim()}\`)`;

/**
 * PARSE: schema blocks (info string exactly `json`, top-level keys include `command`) and examples
 * (info string `json example <scope>…`), each example attached to its NEAREST PRECEDING schema block.
 */
function analyze(refLabel: string, content: string): Analysis {
  const schemaBlocks: SchemaBlock[] = [];
  const examples: Example[] = [];
  for (const f of fences(content)) {
    const words = f.info.split(/\s+/).filter(Boolean);
    if (words[0] !== 'json') continue;
    if (words[1] === 'example') {
      const scopeWords = words.slice(2);
      const bad = scopeWords.length === 0 ? '(none)' : scopeWords.find((w) => !(SCOPE_WORDS as readonly string[]).includes(w));
      if (bad !== undefined) {
        throw new Error(`${refLabel}: example ${blockName(f)} has an unknown scope word ${bad} — the closed set is ${SCOPE_WORDS.join(' | ')}.`);
      }
      const block = schemaBlocks[schemaBlocks.length - 1];
      if (!block) {
        throw new Error(`${refLabel}: example ${blockName(f)} precedes every schema block, so it belongs to none.`);
      }
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(f.body);
      } catch (e) {
        throw new Error(`${refLabel}: example ${blockName(f)} is not real JSON — ${(e as Error).message}`);
      }
      examples.push({ ...f, scopes: scopeWords as Scope[], payload, block });
      continue;
    }
    const keys = schemaBlockKeys(f);
    if (keys) schemaBlocks.push({ ...f, keys });
  }
  for (const b of schemaBlocks) {
    if (!examples.some((e) => e.block === b)) {
      throw new Error(`${refLabel}: schema ${blockName(b)} has no \`json example\` block — a documented payload must be proven by execution.`);
    }
  }
  return { schemaBlocks, examples };
}

function write(root: string, rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function seedChangeDir(root: string, rel: string): void {
  write(root, `${rel}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(root, `${rel}/design.md`, '# Design\n');
  write(root, `${rel}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write(root, `${rel}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [ ] 1.1 do a thing\n');
  write(root, `${rel}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 4\n');
}

/** Every token an example names in a `formed_against` array (the ONE seeding rule, design D3). */
function citedTokens(payload: Record<string, unknown>): string[] {
  const j = payload.judgements;
  if (!Array.isArray(j)) return [];
  return j.flatMap((e) => (Array.isArray((e as any)?.formed_against) ? ((e as any).formed_against as string[]) : []));
}

/** SUBMIT one example to one scope in a FRESH disposable project; returns the gate's result. */
function submit(command: string, example: Example, scope: Scope): ComposeResult {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-roundtrip-'));
  try {
    let trailDir: string | null = null;
    let target: { change?: string; doc?: string } = {};
    if (scope === 'change') {
      seedChangeDir(root, `orbit/changes/${CHANGE}`);
      trailDir = `orbit/changes/${CHANGE}/.orbit-runs`;
      target = { change: CHANGE };
    } else if (scope === 'archived') {
      seedChangeDir(root, `orbit/changes/archive/2026-10-04-${CHANGE}`);
      trailDir = `orbit/changes/archive/2026-10-04-${CHANGE}/.orbit-runs`;
      target = { change: CHANGE };
    } else if (scope === 'doc') {
      write(root, `orbit/architecture/${DOC}.md`, '# Example program\n');
      target = { doc: DOC };
    }
    for (const token of citedTokens(example.payload)) {
      if (!trailDir) throw new Error(`example ${blockName(example)} cites a pass but scope '${scope}' has no trail to seed`);
      write(root, `${trailDir}/review-proposal-${token}.json`, JSON.stringify({ command: 'review', mode: 'proposal', reviewer_class: 'fresh', findings: [] }));
    }
    const result = composeAndWriteEmit(command, target, example.payload, { projectRoot: root });
    if (!fs.existsSync(result.path)) throw new Error(`the gate accepted ${blockName(example)} but wrote no file`);
    return result;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/**
 * COVERAGE: per schema block, the union of its examples' top-level keys (excluding `model`)
 * EQUALS the block's keys minus the engine-owned list and the genre-dependent keys. Collects every
 * mismatch so a moved field names BOTH blocks it touches.
 */
function coverage(refLabel: string, command: string, analysis: Analysis): void {
  const owned = engineOwnedFor(command);
  const errors: string[] = [];
  for (const ex of analysis.examples) {
    if (!('model' in ex.payload)) errors.push(`example ${blockName(ex)} carries no \`model\` key`);
  }
  for (const b of analysis.schemaBlocks) {
    const expected = new Set(b.keys.filter((k) => !owned.has(k) && !GENRE_DEPENDENT.includes(k)));
    const carried = new Set(
      analysis.examples.filter((e) => e.block === b).flatMap((e) => Object.keys(e.payload)).filter((k) => k !== 'model')
    );
    for (const k of expected) if (!carried.has(k)) errors.push(`documented key '${k}' is carried by no example of schema ${blockName(b)}`);
    for (const k of carried) if (!expected.has(k)) errors.push(`example key '${k}' is not documented as AI-supplied by schema ${blockName(b)}`);
  }
  if (errors.length > 0) throw new Error(`${refLabel}:\n  ${errors.join('\n  ')}`);
}

/** The whole round trip over one reference's content: parse → submit (every scope) → coverage. */
function roundTrip(command: string, refLabel: string, content: string): { analysis: Analysis; written: number } {
  const analysis = analyze(refLabel, content);
  let written = 0;
  for (const ex of analysis.examples) {
    for (const scope of ex.scopes) {
      try {
        submit(command, ex, scope);
      } catch (e) {
        throw new Error(`${refLabel}: example ${blockName(ex)} refused in scope '${scope}': ${(e as Error).message}`);
      }
      written += 1;
    }
  }
  coverage(refLabel, command, analysis);
  return { analysis, written };
}

const real = (command: string, refName: string): string => {
  const entry = REFERENCES.find(([c, , r]) => c === command && r === refName)!;
  return referenceContent(entry[1], refName)!;
};

/** Replace exactly one occurrence — a mutation that matched nothing would test nothing. */
function mutate(content: string, from: string, to: string): string {
  const n = content.split(from).length - 1;
  if (n !== 1) throw new Error(`mutation anchor matched ${n} times, expected exactly 1: ${JSON.stringify(from)}`);
  return content.replace(from, to);
}

describe('payload schema references are proven by execution (rc07b)', () => {
  for (const [command, template, refName] of REFERENCES) {
    it(`${command}: every \`json example\` in ${refName} is accepted by the write gate in every scope it names, and jointly covers its block`, () => {
      const content = referenceContent(template, refName);
      expect(content, `${command} is missing references/${refName}`).toBeDefined();
      const { analysis, written } = roundTrip(command, `${command} ${refName}`, content!);
      expect(analysis.examples.length).toBeGreaterThan(0);
      expect(written).toBe(analysis.examples.reduce((n, e) => n + e.scopes.length, 0));
    });
  }

  it('count: six schema blocks across five references, each with at least one example', () => {
    let blocks = 0;
    for (const [command, template, refName] of REFERENCES) {
      const a = analyze(`${command} ${refName}`, referenceContent(template, refName)!);
      for (const b of a.schemaBlocks) expect(a.examples.some((e) => e.block === b), blockName(b)).toBe(true);
      blocks += a.schemaBlocks.length;
    }
    expect(REFERENCES.length).toBe(5);
    expect(blocks).toBe(6);
  });

  it('the genre-dependent list is CLOSED: exactly `verification`', () => {
    expect(GENRE_DEPENDENT).toEqual(['verification']);
  });

  it('the audit-drift example runs in BOTH scopes its info string names (change, project)', () => {
    const a = analyze('audit-drift', real('audit-drift', 'run-summary-schema.md'));
    expect(a.examples.map((e) => e.scopes)).toEqual([['change', 'project']]);
  });

  it('the archive example runs against an archived target with a seeded trail', () => {
    const a = analyze('archive', real('archive', 'archive-summary-schema.md'));
    expect(a.examples.map((e) => e.scopes)).toEqual([['archived']]);
    const ex = a.examples[0];
    expect((ex.payload.judgements as any[]).some((j) => j.kind === 'readiness')).toBe(true);
    expect(citedTokens(ex.payload).length).toBeGreaterThan(0);
    const result = submit('archive', ex, 'archived');
    expect(result.path).toContain(path.join('orbit', 'changes', 'archive', `2026-10-04-${CHANGE}`, '.orbit-runs', 'archive-'));
  });
});

describe('negative: each failure is built from a mutated copy of a REAL reference (rc07b)', () => {
  const AUDIT = () => real('audit-drift', 'run-summary-schema.md');
  const auditExampleModel = '  "model": "claude-opus-5-5"\n}\n```';

  it('a refused key fails by execution, carrying the gate\'s `unknown payload key` text', () => {
    const mutated = mutate(AUDIT(), auditExampleModel, '  "depth": "full",\n' + auditExampleModel);
    expect(() => roundTrip('audit-drift', 'audit-drift', mutated)).toThrow(/unknown payload key 'depth' for 'audit-drift'/);
  });

  it('an engine-owned `next_recommended` in the example is refused as engine-owned — nothing is stripped', () => {
    const mutated = mutate(AUDIT(), auditExampleModel, '  "next_recommended": "x",\n' + auditExampleModel);
    expect(() => roundTrip('audit-drift', 'audit-drift', mutated)).toThrow(/payload field 'next_recommended' is engine-owned/);
  });

  it('an unknown scope word fails naming the opening line; the example is not submitted', () => {
    const mutated = mutate(AUDIT(), '```json example change project', '```json example archive-dir');
    expect(() => analyze('audit-drift', mutated)).toThrow(/block at line \d+ \(`{4}json example archive-dir`\).*unknown scope word archive-dir/);
  });

  it('an example with no scope word fails naming the opening line', () => {
    const mutated = mutate(AUDIT(), '```json example change project', '```json example');
    expect(() => analyze('audit-drift', mutated)).toThrow(/unknown scope word \(none\)/);
  });

  it('a schema block with no example fails naming the reference', () => {
    const content = AUDIT();
    const start = content.indexOf('```json example change project');
    const end = content.indexOf('```', content.indexOf('\n', start)) + 3;
    const mutated = content.slice(0, start) + content.slice(end);
    expect(() => analyze('audit-drift run-summary-schema.md', mutated)).toThrow(/^audit-drift run-summary-schema\.md: schema block at line \d+ .* has no `json example` block/);
  });

  it('a documented key absent from every example fails naming the key and the block', () => {
    const content = AUDIT();
    const from = content.slice(content.indexOf('  "stale_suppressed": [\n    { "category": "2"'));
    const stale = from.slice(0, from.indexOf('  ],\n') + 5);
    const mutated = mutate(content, stale, '');
    expect(() => roundTrip('audit-drift', 'audit-drift', mutated)).toThrow(/documented key 'stale_suppressed' is carried by no example of schema block at line \d+/);
  });

  it('an example attaches to the NEAREST PRECEDING block: a key both review blocks document, carried only by the change-mode example, fails naming the architecture block', () => {
    // `findings` is documented by BOTH review blocks. Dropped from the architecture-mode example
    // (its scorecard zeroed so the gate's rollup still agrees), a coverage check POOLED across the
    // reference would still pass — the change-mode example carries it; attachment per block must not.
    const content = real('review', 'run-summary-schema.md');
    const arch = content.slice(content.indexOf('```json example doc'));
    const findings = arch.slice(arch.indexOf('  "findings": ['), arch.indexOf('  "handoff": {'));
    let mutated = mutate(content, findings, '');
    mutated = mutate(
      mutated,
      '    "correctness": { "critical": 0, "warning": 1, "suggestion": 0 },\n    "coherence": { "critical": 0, "warning": 0, "suggestion": 0 }\n  },\n  "handoff"',
      '    "correctness": { "critical": 0, "warning": 0, "suggestion": 0 },\n    "coherence": { "critical": 0, "warning": 0, "suggestion": 0 }\n  },\n  "handoff"'
    );
    const archLine = analyze('review', mutated).schemaBlocks[1].line;
    let message = '';
    try {
      roundTrip('review', 'review', mutated);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).not.toContain('refused in scope');
    expect(message).toContain(`documented key 'findings' is carried by no example of schema block at line ${archLine}`);
  });

  it('omitting `verification` passes (genre-dependent, exempt by name); omitting a key NOT on the list fails', () => {
    const content = real('review', 'run-summary-schema.md');
    // The real tree omits `verification` and passes (asserted by the review round trip above).
    expect(analyze('review', content).examples[0].payload).not.toHaveProperty('verification');
    const mutated = mutate(content, '  "commentary": "The design is sound; the one CRITICAL is an ordering slip in the archive step, not a structural problem.",\n', '');
    expect(() => roundTrip('review', 'review', mutated)).toThrow(/documented key 'commentary' is carried by no example/);
  });

  it('an example preceding every schema block belongs to none', () => {
    const mutated = '```json example project\n{ "model": null }\n```\n\n' + AUDIT();
    expect(() => analyze('audit-drift', mutated)).toThrow(/precedes every schema block, so it belongs to none/);
  });
});
