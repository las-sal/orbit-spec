import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseSchema, normalizeGates, SchemaValidationError } from '../../../src/core/artifact-graph/schema.js';
import { computeGateStates } from '../../../src/core/artifact-graph/gates.js';
import { resolveSchema } from '../../../src/core/artifact-graph/resolver.js';
import { writeChangeMetadata, readChangeMetadata } from '../../../src/utils/change-metadata.js';

// ---- Fixtures ---------------------------------------------------------------
// Same shape as gates.test.ts' GATED_YAML, plus consent markers on both reviewed
// gates (the D1 vocabulary). The unmarked variant is the v2-compat control.

const CONSENT_YAML = `
name: test-consent
version: 3
artifacts:
  - id: proposal
    generates: proposal.md
    description: Proposal
    template: p.md
  - id: tasks
    generates: tasks.md
    description: Tasks
    template: t.md
    requires: [proposal]
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal, tasks]
    cadence: [independent, in-context]
    confirm: no-new-findings
    before: apply
    consent: user-invoked
  - id: apply
    kind: tracked
    requires: [tasks]
    tracks: tasks.md
  - id: review-system
    kind: reviewed
    requires: [apply]
    cadence: [in-context, external, in-context]
    confirm: findings-resolved
    before: archive
    consent: user-invoked
`;

const NO_CONSENT_YAML = CONSENT_YAML.replace(/\n    consent: user-invoked/g, '').replace(
  'version: 3',
  'version: 2'
);

describe('consent attribute (D1) — parse / surface / reject', () => {
  it('parses consent: user-invoked and normalizes it through', () => {
    const schema = parseSchema(CONSENT_YAML);
    const norm = normalizeGates(schema);
    expect(norm.find(g => g.id === 'review-proposal')!.consent).toBe('user-invoked');
    expect(norm.find(g => g.id === 'review-system')!.consent).toBe('user-invoked');
    expect(norm.find(g => g.id === 'apply')!.consent).toBeUndefined();
  });

  it('rejects an unknown consent value, naming the gate id and the single legal value', () => {
    const yaml = CONSENT_YAML.replace('consent: user-invoked', 'consent: always');
    expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
    expect(() => parseSchema(yaml)).toThrow(
      /Gate 'review-proposal': invalid consent 'always' \(allowed: user-invoked\)/
    );
  });

  it('a v2-style schema without consent parses and normalizes with no consent keys', () => {
    const schema = parseSchema(NO_CONSENT_YAML);
    for (const g of normalizeGates(schema)) {
      expect(g.consent).toBeUndefined();
    }
  });

  it('the shipped spec-driven schema (version 3) consent-marks both reviewed gates', () => {
    const schema = resolveSchema('spec-driven');
    expect(schema.version).toBe(3);
    const norm = normalizeGates(schema);
    expect(norm.find(g => g.id === 'review-proposal')!.consent).toBe('user-invoked');
    expect(norm.find(g => g.id === 'review-system')!.consent).toBe('user-invoked');
    expect(norm.find(g => g.id === 'apply')!.consent).toBeUndefined();
  });
});

describe('consent attribute (D1) — gate computation and readout marker', () => {
  let dir: string;
  const consentSchema = parseSchema(CONSENT_YAML);
  const plainSchema = parseSchema(NO_CONSENT_YAML);

  const runs = () => path.join(dir, '.orbit-runs');
  const writeJson = (name: string, obj: unknown) =>
    fs.writeFileSync(path.join(runs(), name), JSON.stringify(obj));
  const writeFile = (name: string, body: string) => fs.writeFileSync(path.join(dir, name), body);

  beforeEach(() => {
    dir = path.join(os.tmpdir(), `orbit-consent-test-${Date.now()}-${Math.floor(performance.now())}`);
    fs.mkdirSync(runs(), { recursive: true });
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const allArtifacts = new Set(['proposal', 'tasks']);

  const cleanProposalTrail = () => {
    writeJson('review-proposal-2026-06-30T10-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'fresh',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    writeJson('review-proposal-2026-06-30T11-00-00Z.json', {
      command: 'review', mode: 'proposal', reviewer_class: 'in-context',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
  };

  it('consent does not alter gate state: identical states with and without the attribute', () => {
    cleanProposalTrail();
    const withConsent = computeGateStates(consentSchema, 'c', dir, allArtifacts);
    const without = computeGateStates(plainSchema, 'c', dir, allArtifacts);
    const strip = (g: { id: string; state: string; reason?: string }) => ({
      id: g.id,
      state: g.state,
      reason: g.reason,
    });
    expect(withConsent.gates.map(strip)).toEqual(without.gates.map(strip));
    expect(withConsent.position).toBe(without.position);
  });

  it('a passed consent-marked gate is passed (eligibility and consent are independent axes)', () => {
    cleanProposalTrail();
    const rp = computeGateStates(consentSchema, 'c', dir, allArtifacts).gates.find(
      g => g.id === 'review-proposal'
    )!;
    expect(rp.state).toBe('passed');
    expect(rp.consent).toBe('user-invoked');
  });

  it('gates[] rows surface the consent marker; unmarked gates carry none', () => {
    const { gates } = computeGateStates(consentSchema, 'c', dir, allArtifacts);
    expect(gates.find(g => g.id === 'review-proposal')!.consent).toBe('user-invoked');
    expect(gates.find(g => g.id === 'review-system')!.consent).toBe('user-invoked');
    expect(gates.find(g => g.id === 'apply')!.consent).toBeUndefined();
  });

  it('a consent-marked phase entry renders the — user-invoked marker on the canonical command', () => {
    cleanProposalTrail();
    const rp = computeGateStates(consentSchema, 'mychange', dir, allArtifacts).gates.find(
      g => g.id === 'review-proposal'
    )!;
    expect(rp.nextCommand).toBe('/orbit:apply mychange — user-invoked');
  });

  it('an unmarked phase entry renders the bare command (v2 behavior byte-identical)', () => {
    cleanProposalTrail();
    const rp = computeGateStates(plainSchema, 'mychange', dir, allArtifacts).gates.find(
      g => g.id === 'review-proposal'
    )!;
    expect(rp.nextCommand).toBe('/orbit:apply mychange');
  });

  it('review commands (non-lifecycle canonical-next) never carry the marker', () => {
    // No trail at all → review-proposal unpassed, canonical-next is a review command.
    const rp = computeGateStates(consentSchema, 'mychange', dir, allArtifacts).gates.find(
      g => g.id === 'review-proposal'
    )!;
    expect(rp.state).toBe('unpassed');
    expect(rp.nextCommand).toBe('/orbit:review --as proposal --fresh mychange');
  });

  it('archive entry from a passed consent-marked review-system carries the marker', () => {
    writeFile('tasks.md', '- [x] one\n');
    writeJson('review-system-2026-07-01T10-00-00Z.json', {
      command: 'review', mode: 'system', reviewer_class: 'in-context',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    fs.writeFileSync(
      path.join(runs(), 'external-system-2026-07-01T11-00-00Z.md'),
      '# External Review\n\n**Reviewer**: X\n\n## CRITICAL\n\nNone.\n\n## WARNING\n\nNone.\n\n## SUGGESTION\n\nNone.\n'
    );
    writeJson('review-system-2026-07-01T12-00-00Z.json', {
      command: 'review', mode: 'system', reviewer_class: 'in-context',
      findings_summary: { critical: 0, warning: 0, suggestion: 0 }, findings: [],
    });
    const rs = computeGateStates(consentSchema, 'mychange', dir, allArtifacts).gates.find(
      g => g.id === 'review-system'
    )!;
    expect(rs.state).toBe('passed');
    expect(rs.nextCommand).toBe('/orbit:archive mychange — user-invoked');
  });
});

describe('consent-era metadata (D1) — schema_version + consent_era_from round-trip', () => {
  let projectRoot: string;
  let changeDir: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-consent-meta-'));
    changeDir = path.join(projectRoot, 'orbit', 'changes', 'test-change');
    fs.mkdirSync(changeDir, { recursive: true });
  });
  afterEach(() => fs.rmSync(projectRoot, { recursive: true, force: true }));

  it('schema_version round-trips through the metadata helpers without loss', () => {
    writeChangeMetadata(changeDir, {
      schema: 'spec-driven',
      created: '2026-07-13',
      schema_version: 3,
    });
    const read = readChangeMetadata(changeDir);
    expect(read?.schema_version).toBe(3);
    expect(read?.schema).toBe('spec-driven');
    expect(read?.created).toBe('2026-07-13');
  });

  it('consent_era_from round-trips (straddler stamp shape)', () => {
    writeChangeMetadata(changeDir, {
      schema: 'spec-driven',
      consent_era_from: '2026-07-13T10-00-00Z'.replace(/-(\d\d)-(\d\d)Z$/, ':$1:$2Z'),
    });
    const read = readChangeMetadata(changeDir);
    expect(read?.consent_era_from).toBe('2026-07-13T10:00:00Z');
    expect(read?.schema_version).toBeUndefined();
  });

  it('metadata without either field reads back exempt-shaped (pre-consent era)', () => {
    writeChangeMetadata(changeDir, { schema: 'spec-driven', created: '2026-06-01' });
    const read = readChangeMetadata(changeDir);
    expect(read?.schema_version).toBeUndefined();
    expect(read?.consent_era_from).toBeUndefined();
  });

  it('rejects a malformed consent_era_from (must be ISO-8601 UTC with colons)', () => {
    expect(() =>
      writeChangeMetadata(changeDir, {
        schema: 'spec-driven',
        consent_era_from: '2026-07-13',
      })
    ).toThrow(/consent_era_from must be ISO-8601 UTC/);
  });
});

describe('eligibility phrasing (D1) — no imperative Next: label in engine output', () => {
  // Exit-criterion grep as a test (design.md goal 3): scan the ENGINE source (everything
  // under src/ except the generated-workflow templates, which have their own fidelity
  // tests) for a rendered imperative `Next:` label. The eligibility label is pinned.
  const SRC = path.join(__dirname, '..', '..', '..', 'src');

  const walk = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        // Workflow bodies are prose templates covered by their own no-Next: grep test.
        if (p.includes(path.join('core', 'templates', 'workflows'))) return [];
        return walk(p);
      }
      return e.name.endsWith('.ts') ? [p] : [];
    });

  it('no engine source renders an imperative `Next:` label', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const content = fs.readFileSync(file, 'utf-8');
      // A rendered label is a string literal starting with `Next:` (template or quoted).
      if (/['"`]Next:/.test(content)) offenders.push(path.relative(SRC, file));
    }
    expect(offenders).toEqual([]);
  });

  it('the status renderer uses the eligibility label', () => {
    const statusSrc = fs.readFileSync(
      path.join(SRC, 'commands', 'workflow', 'status.ts'),
      'utf-8'
    );
    expect(statusSrc).toContain('Ready when you are: ${status.next_command}');
  });

  it('the instructions blocked-by-gate rendering uses the eligibility label', () => {
    const instrSrc = fs.readFileSync(
      path.join(SRC, 'commands', 'workflow', 'instructions.ts'),
      'utf-8'
    );
    expect(instrSrc).toContain('Ready when you are: ${nextCommand}');
    expect(instrSrc).not.toMatch(/Canonical next:/);
  });
});
