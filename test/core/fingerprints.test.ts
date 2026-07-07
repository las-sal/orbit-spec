import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  hashRequirementBlock,
  deriveTouchedSet,
  computeStatuses,
  stampFingerprints,
  checkFingerprints,
  diffLines,
} from '../../src/core/fingerprints.js';
import { parseDeltaSpec, extractRequirementsSection } from '../../src/core/parsers/requirement-blocks.js';
import { buildUpdatedSpec } from '../../src/core/specs-apply.js';
import { ChangeMetadataSchema } from '../../src/core/artifact-graph/types.js';
import { writeChangeMetadata, readChangeMetadata } from '../../src/utils/change-metadata.js';
import { FingerprintCommand } from '../../src/commands/fingerprint.js';

const BASE_REQ = `### Requirement: Slash Command Configuration
The system SHALL configure slash commands.

#### Scenario: Windsurf
- **WHEN** windsurf is configured
- **THEN** the command exists`;

const BASE_SPEC = `# demo Specification

## Purpose
Demo.

## Requirements

${BASE_REQ}
`;

// Change B's MODIFIED snapshot: authored against BASE (does NOT contain the Kilo scenario)
const DELTA_MODIFIED = `## MODIFIED Requirements

### Requirement: Slash Command Configuration
The system SHALL configure slash commands.

#### Scenario: Windsurf
- **WHEN** windsurf is configured
- **THEN** the command exists

#### Scenario: OpenCode
- **WHEN** opencode is configured
- **THEN** the command exists
`;

// A sibling (change A) landed: baseline now carries a Kilo Code scenario
const LIVE_WITH_SIBLING = `# demo Specification

## Purpose
Demo.

## Requirements

### Requirement: Slash Command Configuration
The system SHALL configure slash commands.

#### Scenario: Windsurf
- **WHEN** windsurf is configured
- **THEN** the command exists

#### Scenario: Kilo Code
- **WHEN** kilo is configured
- **THEN** the command exists
`;

describe('fingerprints', () => {
  describe('hashRequirementBlock (D-c2-8)', () => {
    it('hashes LF and CRLF content identically', () => {
      const lf = '### Requirement: X\nBody line';
      const crlf = '### Requirement: X\r\nBody line';
      expect(hashRequirementBlock(lf)).toBe(hashRequirementBlock(crlf));
      expect(hashRequirementBlock(lf)).toMatch(/^sha256:[0-9a-f]{64}$/);
    });

    it('treats any cosmetic edit as divergence', () => {
      expect(hashRequirementBlock('### Requirement: X\nBody')).not.toBe(
        hashRequirementBlock('### Requirement: X\nBody ')
      );
    });
  });

  describe('deriveTouchedSet', () => {
    it('unions RENAMED.from, REMOVED, and MODIFIED', () => {
      const plan = parseDeltaSpec(`## MODIFIED Requirements

### Requirement: Alpha
Body A.

#### Scenario: S
- **WHEN** w
- **THEN** t

## REMOVED Requirements

### Requirement: Beta

## RENAMED Requirements

- FROM: \`### Requirement: Gamma\`
- TO: \`### Requirement: Delta\`
`);
      const touched = deriveTouchedSet(plan);
      const names = touched.map((t) => t.liveName).sort();
      expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('maps MODIFIED-after-RENAME back to the live FROM name', () => {
      const plan = parseDeltaSpec(`## MODIFIED Requirements

### Requirement: Delta
New body.

#### Scenario: S
- **WHEN** w
- **THEN** t

## RENAMED Requirements

- FROM: \`### Requirement: Gamma\`
- TO: \`### Requirement: Delta\`
`);
      const touched = deriveTouchedSet(plan);
      expect(touched).toHaveLength(1);
      expect(touched[0].liveName).toBe('Gamma');
      expect(touched[0].ops.sort()).toEqual(['modified', 'renamed']);
    });

    it('never fingerprints ADDED requirements', () => {
      const plan = parseDeltaSpec(`## ADDED Requirements

### Requirement: Newcomer
Body.

#### Scenario: S
- **WHEN** w
- **THEN** t
`);
      expect(deriveTouchedSet(plan)).toHaveLength(0);
    });
  });

  describe('computeStatuses', () => {
    const liveBlocks = extractRequirementsSection(LIVE_WITH_SIBLING).bodyBlocks;
    const baseHash = hashRequirementBlock(BASE_REQ);
    const liveHash = hashRequirementBlock(liveBlocks[0].raw);
    const plan = parseDeltaSpec(DELTA_MODIFIED);
    const touched = deriveTouchedSet(plan);

    it('reports verified when stored fingerprint matches live', () => {
      const [entry] = computeStatuses('demo', touched, liveBlocks, {
        'Slash Command Configuration': liveHash,
      });
      expect(entry.status).toBe('verified');
    });

    it('reports diverged when the baseline moved past the stored base', () => {
      const [entry] = computeStatuses('demo', touched, liveBlocks, {
        'Slash Command Configuration': baseHash,
      });
      expect(entry.status).toBe('diverged');
      expect(entry.base_hash).toBe(baseHash);
      expect(entry.live_hash).toBe(liveHash);
    });

    it('reports unverified with no stored fingerprint', () => {
      const [entry] = computeStatuses('demo', touched, liveBlocks, undefined);
      expect(entry.status).toBe('unverified');
    });

    it('reports missing when the live block is absent', () => {
      const [entry] = computeStatuses('demo', touched, [], { 'Slash Command Configuration': baseHash });
      expect(entry.status).toBe('missing');
      expect(entry.live_hash).toBeNull();
    });

    it('idempotent-write skip beats diverged AND unverified (precedence)', () => {
      const incoming = touched[0].incomingRaw!;
      const idempotentLive = extractRequirementsSection(
        `# demo Specification\n\n## Requirements\n\n${incoming}\n`
      ).bodyBlocks;
      // stale stored fingerprint, but live == incoming → verified
      const [withStale] = computeStatuses('demo', touched, idempotentLive, {
        'Slash Command Configuration': 'sha256:' + '0'.repeat(64),
      });
      expect(withStale.status).toBe('verified');
      // no stored fingerprint, live == incoming → verified (beats unverified)
      const [withNone] = computeStatuses('demo', touched, idempotentLive, undefined);
      expect(withNone.status).toBe('verified');
    });

    it('REMOVED gets no idempotent skip', () => {
      const removedPlan = parseDeltaSpec(`## REMOVED Requirements

### Requirement: Slash Command Configuration
`);
      const removedTouched = deriveTouchedSet(removedPlan);
      const [entry] = computeStatuses('demo', removedTouched, liveBlocks, undefined);
      expect(entry.status).toBe('unverified');
    });
  });

  describe('ChangeMetadataSchema round-trip', () => {
    it('accepts and preserves base_fingerprints', () => {
      const meta = {
        schema: 'spec-driven',
        created: '2026-07-06',
        base_fingerprints: {
          demo: { 'Some Requirement: with colon': 'sha256:' + 'a'.repeat(64) },
        },
      };
      const parsed = ChangeMetadataSchema.parse(meta);
      expect(parsed.base_fingerprints).toEqual(meta.base_fingerprints);
    });

    it('stays valid without the field', () => {
      const parsed = ChangeMetadataSchema.parse({ schema: 'spec-driven' });
      expect(parsed.base_fingerprints).toBeUndefined();
    });

    it('rejects malformed fingerprint values (documented sha256:<hex> format enforced)', () => {
      for (const bad of ['deadbeef', 'sha256:XYZ', 'sha256:' + 'a'.repeat(63), 'md5:' + 'a'.repeat(64)]) {
        const result = ChangeMetadataSchema.safeParse({
          schema: 'spec-driven',
          base_fingerprints: { demo: { Req: bad } },
        });
        expect(result.success).toBe(false);
      }
    });
  });

  describe('on-disk stamp/check/guard', () => {
    let tempDir: string;
    let prevCwd: string;
    const originalLog = console.log;

    const changeName = 'demo-change';
    const capDir = () => path.join(tempDir, 'orbit', 'specs', 'demo');
    const changeDir = () => path.join(tempDir, 'orbit', 'changes', changeName);

    beforeEach(async () => {
      prevCwd = process.cwd();
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-fingerprints-'));
      await fs.mkdir(capDir(), { recursive: true });
      await fs.mkdir(path.join(changeDir(), 'specs', 'demo'), { recursive: true });
      await fs.writeFile(path.join(capDir(), 'spec.md'), BASE_SPEC);
      await fs.writeFile(path.join(changeDir(), 'specs', 'demo', 'spec.md'), DELTA_MODIFIED);
      writeChangeMetadata(changeDir(), { schema: 'spec-driven', created: '2026-07-06' });
      process.chdir(tempDir);
      console.log = vi.fn();
    });

    afterEach(async () => {
      console.log = originalLog;
      process.chdir(prevCwd);
      await fs.rm(tempDir, { recursive: true, force: true });
      vi.clearAllMocks();
    });

    it('stamp writes fingerprints keyed by capability and live name', () => {
      const entries = stampFingerprints(tempDir, changeName);
      expect(entries).toEqual([
        expect.objectContaining({ capability: 'demo', requirement: 'Slash Command Configuration', action: 'stamped' }),
      ]);
      const meta = readChangeMetadata(changeDir());
      expect(meta?.base_fingerprints?.demo['Slash Command Configuration']).toBe(
        hashRequirementBlock(BASE_REQ)
      );
    });

    it('re-stamp without --refresh keeps a stale fingerprint (divergence stays detectable)', async () => {
      stampFingerprints(tempDir, changeName);
      await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
      const entries = stampFingerprints(tempDir, changeName);
      expect(entries[0].action).toBe('kept');
      expect(readChangeMetadata(changeDir())?.base_fingerprints?.demo['Slash Command Configuration']).toBe(
        hashRequirementBlock(BASE_REQ)
      );
    });

    it('--refresh overwrites with the current live hash', async () => {
      stampFingerprints(tempDir, changeName);
      await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
      const entries = stampFingerprints(tempDir, changeName, { refresh: true });
      expect(entries[0].action).toBe('refreshed');
      const liveRaw = extractRequirementsSection(LIVE_WITH_SIBLING).bodyBlocks[0].raw;
      expect(readChangeMetadata(changeDir())?.base_fingerprints?.demo['Slash Command Configuration']).toBe(
        hashRequirementBlock(liveRaw)
      );
    });

    it('ADDED-only change stamps nothing', async () => {
      await fs.writeFile(
        path.join(changeDir(), 'specs', 'demo', 'spec.md'),
        `## ADDED Requirements

### Requirement: Newcomer
Body.

#### Scenario: S
- **WHEN** w
- **THEN** t
`
      );
      expect(stampFingerprints(tempDir, changeName)).toHaveLength(0);
      expect(readChangeMetadata(changeDir())?.base_fingerprints).toBeUndefined();
    });

    it('check reports statuses without modifying files', async () => {
      stampFingerprints(tempDir, changeName);
      await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
      const before = await fs.readFile(path.join(changeDir(), '.openspec.yaml'), 'utf-8');
      const entries = checkFingerprints(tempDir, changeName);
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe('diverged');
      expect(await fs.readFile(path.join(changeDir(), '.openspec.yaml'), 'utf-8')).toBe(before);
    });

    it('absent .openspec.yaml yields unverified, not an error', async () => {
      await fs.rm(path.join(changeDir(), '.openspec.yaml'));
      const entries = checkFingerprints(tempDir, changeName);
      expect(entries[0].status).toBe('unverified');
    });

    describe('buildUpdatedSpec guard', () => {
      const update = () => ({
        source: path.join(changeDir(), 'specs', 'demo', 'spec.md'),
        target: path.join(capDir(), 'spec.md'),
        exists: true,
      });

      it('refuses a stale snapshot and shows the sibling content as a deletion', async () => {
        stampFingerprints(tempDir, changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        await expect(
          buildUpdatedSpec(update(), changeName, { changeDir: changeDir() })
        ).rejects.toThrow(/divergence/i);
        try {
          await buildUpdatedSpec(update(), changeName, { changeDir: changeDir() });
        } catch (err: any) {
          expect(err.message).toContain('- #### Scenario: Kilo Code');
          expect(err.message).toContain('orbit fingerprint demo-change --refresh');
          // edit-then-refresh ordering: hand-edit listed before re-stamp
          expect(err.message.indexOf('Hand-edit')).toBeLessThan(err.message.indexOf('Re-stamp'));
        }
        // refusal wrote nothing
        expect(await fs.readFile(path.join(capDir(), 'spec.md'), 'utf-8')).toBe(LIVE_WITH_SIBLING);
      });

      it('override proceeds and prints the override notice', async () => {
        stampFingerprints(tempDir, changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        const { rebuilt } = await buildUpdatedSpec(update(), changeName, {
          changeDir: changeDir(),
          overrideFingerprints: true,
        });
        expect(rebuilt).toContain('OpenCode');
        expect(rebuilt).not.toContain('Kilo Code');
        const logged = (console.log as any).mock.calls.map((c: any[]) => String(c[0])).join('\n');
        expect(logged).toContain('fingerprint override');
        expect(logged).toContain('Slash Command Configuration');
      });

      it('unverified warns and proceeds', async () => {
        const { rebuilt } = await buildUpdatedSpec(update(), changeName, { changeDir: changeDir() });
        expect(rebuilt).toContain('OpenCode');
        const logged = (console.log as any).mock.calls.map((c: any[]) => String(c[0])).join('\n');
        expect(logged).toContain("can't verify");
      });

      it('matching fingerprints: explicit changeDir and derived-changeDir output byte-identical', async () => {
        stampFingerprints(tempDir, changeName);
        const explicit = await buildUpdatedSpec(update(), changeName, { changeDir: changeDir() });
        const derived = await buildUpdatedSpec(update(), changeName);
        expect(explicit.rebuilt).toBe(derived.rebuilt);
      });

      it('idempotent write passes even with a stale fingerprint (own delta already applied)', async () => {
        stampFingerprints(tempDir, changeName);
        // Simulate a mid-flight sync: live now equals exactly what the delta would write
        const applied = await buildUpdatedSpec(update(), changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), applied.rebuilt);
        const { rebuilt } = await buildUpdatedSpec(update(), changeName, { changeDir: changeDir() });
        expect(rebuilt).toBe(applied.rebuilt);
      });

      it('direct call without options is still guarded (no programmatic bypass)', async () => {
        stampFingerprints(tempDir, changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        // no options argument at all — changeDir must be derived from update.source
        await expect(buildUpdatedSpec(update(), changeName)).rejects.toThrow(/divergence/i);
        expect(await fs.readFile(path.join(capDir(), 'spec.md'), 'utf-8')).toBe(LIVE_WITH_SIBLING);
      });

      it('pure-rename divergence reports a header change, not removal', async () => {
        await fs.writeFile(
          path.join(changeDir(), 'specs', 'demo', 'spec.md'),
          `## RENAMED Requirements

- FROM: \`### Requirement: Slash Command Configuration\`
- TO: \`### Requirement: Command Configuration\`
`
        );
        stampFingerprints(tempDir, changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        try {
          await buildUpdatedSpec(update(), changeName, { changeDir: changeDir() });
          expect.unreachable('expected divergence refusal');
        } catch (err: any) {
          expect(err.message).not.toContain('REMOVE this live block');
          expect(err.message).toContain('- ### Requirement: Slash Command Configuration');
          expect(err.message).toContain('+ ### Requirement: Command Configuration');
          // the live body (including the sibling scenario) is carried forward, not destroyed
          expect(err.message).toContain('  #### Scenario: Kilo Code');
        }
      });

      it('REMOVED divergence is refused (no idempotent skip)', async () => {
        await fs.writeFile(
          path.join(changeDir(), 'specs', 'demo', 'spec.md'),
          `## REMOVED Requirements

### Requirement: Slash Command Configuration
`
        );
        stampFingerprints(tempDir, changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        await expect(
          buildUpdatedSpec(update(), changeName, { changeDir: changeDir() })
        ).rejects.toThrow(/REMOVE this live block/);
      });
    });

    describe('archive --yes without override', () => {
      it('still refuses on divergence (non-interactive CLI path cannot clobber)', async () => {
        stampFingerprints(tempDir, changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        const { ArchiveCommand } = await import('../../src/core/archive.js');
        // validate:false skips the validation pass (yes suppresses its confirm); the
        // fingerprint guard must still refuse before any write or move.
        await new ArchiveCommand().execute(changeName, { yes: true, validate: false });
        expect(await fs.readFile(path.join(capDir(), 'spec.md'), 'utf-8')).toBe(LIVE_WITH_SIBLING);
        const archived = await fs
          .readdir(path.join(tempDir, 'orbit', 'changes', 'archive'))
          .catch(() => []);
        expect(archived.filter((d) => d.includes(changeName))).toHaveLength(0);
        const logged = (console.log as any).mock.calls.map((c: any[]) => String(c[0])).join('\n');
        expect(logged).toContain('Aborted. No files were changed.');
      });
    });

    describe('FingerprintCommand exit codes', () => {
      it('--check --json emits machine-readable entries and summary', async () => {
        stampFingerprints(tempDir, changeName);
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        const cmd = new FingerprintCommand();
        const code = await cmd.execute(changeName, { check: true, json: true });
        expect(code).toBe(1);
        const logged = (console.log as any).mock.calls.map((c: any[]) => String(c[0])).join('\n');
        const parsed = JSON.parse(logged);
        expect(parsed.mode).toBe('check');
        expect(parsed.entries[0]).toMatchObject({
          capability: 'demo',
          requirement: 'Slash Command Configuration',
          status: 'diverged',
        });
        expect(parsed.entries[0].base_hash).toMatch(/^sha256:/);
        expect(parsed.entries[0].live_hash).toMatch(/^sha256:/);
        expect(parsed.summary).toEqual({ verified: 0, diverged: 1, unverified: 0, missing: 0 });
      });

      it('exits 0 on clean/unverified, 1 on diverged', async () => {
        const cmd = new FingerprintCommand();
        expect(await cmd.execute(changeName, { check: true })).toBe(0); // unverified only
        stampFingerprints(tempDir, changeName);
        expect(await cmd.execute(changeName, { check: true })).toBe(0); // verified
        await fs.writeFile(path.join(capDir(), 'spec.md'), LIVE_WITH_SIBLING);
        expect(await cmd.execute(changeName, { check: true })).toBe(1); // diverged
      });
    });
  });

  describe('diffLines', () => {
    it('marks live-only lines as deletions and incoming-only lines as additions', () => {
      const diff = diffLines('a\nkilo\nb', 'a\nopen\nb');
      expect(diff).toContain('- kilo');
      expect(diff).toContain('+ open');
      expect(diff.filter((l) => l.startsWith('  '))).toHaveLength(2);
    });
  });
});
