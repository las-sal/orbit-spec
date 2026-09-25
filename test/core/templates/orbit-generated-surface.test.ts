import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../../src/core/init.js';
import { UpdateCommand } from '../../../src/core/update.js';
import {
  MECHANISM_ENTRY_HEADING,
  DOMAIN_LINE,
  isTableHeader,
  TABLE_SEPARATOR,
  isMemberRow,
  CLOSURE_LINE,
  RESIDUAL_KIND_LINE,
  RESIDUAL_METHOD_LINE,
  RESIDUAL_ANY_LINE,
  MOVES_LINE,
  MOVE_LINE,
} from '../../../src/core/explore-grammar.js';
import { ownerText } from '../../helpers/owner-text.js';

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/prompts/searchable-multi-select.js', () => ({
  searchableMultiSelect: vi.fn(),
}));

/**
 * End-to-end fidelity for the generated surface (external-review follow-up):
 * runs a REAL default `orbit init` (claude + codex; no profile config — D15:
 * all workflows install every time)
 * into a temp dir, then applies orbit's content assertions to the files ON
 * DISK — closing the gap between the template-level fidelity tests and the
 * generation pipeline. The original external-review CRITICAL (command files
 * lacking the orbit layer) was only visible at this level.
 */

// dirName -> [commandId, required skill markers]
const SURFACE: Array<[string, string, string[]]> = [
  ['orbit-explore', 'explore', ['execution disciplines', 'Run-summary emit', 'Minimal explore metadata']],
  ['orbit-propose', 'propose', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override', 'staged-metadata MERGE', 'fresh-owned DENYLIST']],
  ['orbit-new-change', 'new', ['execution disciplines', 'Run-summary emit']],
  ['orbit-continue-change', 'continue', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-apply-change', 'apply', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-ff-change', 'ff', ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['orbit-sync-specs', 'sync', ['execution disciplines', 'Consent inheritance']], // gained the orbit layer in D1
  ['orbit-archive-change', 'archive', ['execution disciplines', 'run summary', 'Stage-line garnish']],
  ['orbit-bulk-archive-change', 'bulk-archive', ['# Orbit additions']],
  ['orbit-verify-change', 'verify', ['execution disciplines', 'Run-summary emit']],
  ['orbit-onboard', 'onboard', ['execution disciplines', 'self-contained', 'Program architecture', 'orbit/architecture/.orbit-runs/', 'architecture mode — D-arc Stage D2']],
  ['orbit-review', 'review', ['execution disciplines', 'Paste the output VERBATIM', 'hand-rendering them is PROHIBITED', 'REVIEWER-CLASS axis', 'references/external-handoff.md', 'references/passes-<mode>.md', 'orbit emit review', 'Using doc:', 'First architecture review for this doc']],
  ['orbit-address-reviews', 'address-reviews', ['execution disciplines', 'Ripple cascade', 'resolution log', 'Architecture-scoped']],
  ['orbit-audit-drift', 'audit-drift', ['execution disciplines', 'Vocabulary residue', 'Persist the run summary', 'Architecture staleness check']],
  ['orbit-architect', 'architect', ['execution disciplines', 'Run-summary emit', 'Completion-ratification flow', 'a gatekeeper']],
];

// B3 editorial skills bundle reference files (multi-file skills)
const REFERENCE_SKILLS: Record<string, string[]> = {
  'orbit-explore': ['capture-formats.md'],
  // D6: propose and ff share ONE choreography reference (see pr-choreography.ts).
  'orbit-propose': ['pr-choreography.md'],
  'orbit-ff-change': ['pr-choreography.md'],
  // D6 (external iter 1): the arc-done readout carries the shared resolution algorithm.
  'orbit-architect': ['pr-resolution.md'],
  'orbit-review': ['run-summary-schema.md', 'passes-proposal.md', 'passes-system.md', 'passes-architecture.md', 'external-handoff.md', 'mode-sections.md', 'prompt-template.md', 'flags-detail.md'],
  'orbit-address-reviews': ['external-findings-format.md', 'internal-findings-format.md', 'resolution-detail.md', 'run-summary-schema.md'],
  'orbit-audit-drift': ['run-summary-schema.md', 'worked-example.md'],
};

describe('generated surface fidelity (real init, all workflows, claude + codex)', () => {
  let testDir: string;
  let configTempDir: string;
  let codexHomeDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-surface-test-'));
    configTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-surface-config-'));
    codexHomeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-surface-codex-'));
    process.env.XDG_CONFIG_HOME = configTempDir;
    process.env.CODEX_HOME = codexHomeDir;

    vi.spyOn(console, 'log').mockImplementation(() => {});

    // No profile/delivery configuration on purpose: a DEFAULT init must
    // produce the full surface (D15 — all workflows installed every time).
    const initCommand = new InitCommand({ tools: 'claude,codex', force: true });
    await initCommand.execute(testDir);
  });

  afterAll(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    await fs.rm(codexHomeDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe.each(SURFACE)('%s', (dirName, commandId, requiredMarkers) => {
    it('claude skill on disk carries the orbit layer', async () => {
      const skill = await fs.readFile(
        path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      for (const marker of requiredMarkers) {
        expect(skill).toContain(marker);
      }
      expect(skill).not.toContain('/opsx:');
      // D1: no body renders an imperative Next: label; every body echoes no-chaining.
      expect(skill).not.toContain('Next:');
      expect(skill).toContain('No-chaining');
    });

    it('codex skill on disk matches the claude body (single source)', async () => {
      const claude = await fs.readFile(
        path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      const codex = await fs.readFile(
        path.join(testDir, '.codex', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      expect(codex).toBe(claude);
    });

    it('claude command on disk is a thin launcher to the skill', async () => {
      const command = await fs.readFile(
        path.join(testDir, '.claude', 'commands', 'orbit', `${commandId}.md`),
        'utf-8'
      );
      expect(command).toContain('thin launcher');
      expect(command).toContain(`\`${dirName}\` skill`);
      // frontmatter + launcher only — a command that regrows a workflow body fails
      expect(command.length).toBeLessThan(900);
    });

    it('codex prompt on disk is the same thin launcher', async () => {
      const prompt = await fs.readFile(
        path.join(codexHomeDir, 'prompts', `orbit-${commandId}.md`),
        'utf-8'
      );
      expect(prompt).toContain('thin launcher');
      expect(prompt).toContain(`\`${dirName}\` skill`);
    });
  });

  it('archive ships its reference on disk for both tools, byte-identical', async () => {
    const claudeRef = await fs.readFile(
      path.join(testDir, '.claude', 'skills', 'orbit-archive-change', 'references', 'archive-summary-schema.md'),
      'utf-8'
    );
    const codexRef = await fs.readFile(
      path.join(testDir, '.codex', 'skills', 'orbit-archive-change', 'references', 'archive-summary-schema.md'),
      'utf-8'
    );
    expect(codexRef).toBe(claudeRef);
    expect(claudeRef).toContain('archive run-summary schema');
    expect(claudeRef).toContain('"unresolved_markers": ["<file>:<line>');
  });

  it('reference-less skills have no references/ dir on disk', async () => {
    for (const [dirName] of SURFACE) {
      if (dirName === 'orbit-archive-change' || dirName in REFERENCE_SKILLS) continue;
      const refsDir = path.join(testDir, '.claude', 'skills', dirName, 'references');
      await expect(fs.access(refsDir)).rejects.toThrow();
    }
  });

  it('generates exactly the registered skills, no extras (e.g., no feedback)', async () => {
    const dirs = await fs.readdir(path.join(testDir, '.claude', 'skills'));
    expect(dirs.sort()).toEqual(SURFACE.map(([d]) => d).sort());
  });

  it('editorial skills ship their references on disk for both tools, byte-identical', async () => {
    for (const [dirName, refNames] of Object.entries(REFERENCE_SKILLS)) {
      const refsDir = path.join(testDir, '.claude', 'skills', dirName, 'references');
      const onDisk = (await fs.readdir(refsDir)).sort();
      expect(onDisk).toEqual([...refNames].sort());
      for (const refName of refNames) {
        const claudeRef = await fs.readFile(path.join(refsDir, refName), 'utf-8');
        const codexRef = await fs.readFile(
          path.join(testDir, '.codex', 'skills', dirName, 'references', refName),
          'utf-8'
        );
        expect(codexRef).toBe(claudeRef);
        expect(claudeRef).not.toContain('/opsx:');
      }
    }
  });

  it('editorial skills carry their capability metadata in frontmatter (B2 pass-through)', async () => {
    // The subject is stated EXPLICITLY rather than derived from REFERENCE_SKILLS by
    // exclusion: carrying references and being a B3 editorial skill are independent
    // properties, and the exclusion list had already begun accumulating carve-outs
    // (orbit-explore in D5; orbit-propose and orbit-ff-change in D6).
    const EDITORIAL_SKILLS = [
      'orbit-review',
      'orbit-address-reviews',
      'orbit-audit-drift',
    ];
    for (const dirName of EDITORIAL_SKILLS) {
      const skill = await fs.readFile(
        path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md'),
        'utf-8'
      );
      expect(skill).toContain(`capability: ${dirName}`);
    }
  });

  it('PLAIN update on a current-stamps project reconciles reference drift (no --force)', async () => {
    // the surface was just generated at the current version — stamps are current
    const refPath = path.join(
      testDir, '.claude', 'skills', 'orbit-archive-change', 'references', 'archive-summary-schema.md'
    );
    const strayPath = path.join(
      testDir, '.claude', 'skills', 'orbit-archive-change', 'references', 'stray.md'
    );
    await fs.rm(refPath);
    await fs.writeFile(strayPath, 'parked');

    await new UpdateCommand({}).execute(testDir);

    // drift detection defeated the current-stamps short-circuit: declared restored, stray pruned
    const restored = await fs.readFile(refPath, 'utf-8');
    expect(restored).toContain('archive run-summary schema');
    await expect(fs.access(strayPath)).rejects.toThrow();
  });

  it('PLAIN update removes RETIRED artifacts from a pre-existing surface (D5)', async () => {
    // Simulate a pre-D5 surface: the retired skill dir + launcher linger after upgrade.
    const retiredSkill = path.join(testDir, '.claude', 'skills', 'orbit-review-external', 'SKILL.md');
    const retiredCmd = path.join(testDir, '.claude', 'commands', 'orbit', 'review-external.md');
    await fs.mkdir(path.dirname(retiredSkill), { recursive: true });
    await fs.writeFile(retiredSkill, 'name: orbit-review-external\n');
    await fs.writeFile(retiredCmd, '# retired launcher\n');

    await new UpdateCommand({}).execute(testDir);

    // Retired-artifact drift defeated the short-circuit; reconciliation removed both.
    await expect(fs.access(path.dirname(retiredSkill))).rejects.toThrow();
    await expect(fs.access(retiredCmd)).rejects.toThrow();
  });

  it('generates exactly the registered commands', async () => {
    const files = await fs.readdir(path.join(testDir, '.claude', 'commands', 'orbit'));
    expect(files.sort()).toEqual(SURFACE.map(([, id]) => `${id}.md`).sort());
  });

  it('address-reviews generated references carry the architecture-mode shapes', async () => {
    const refsDir = path.join(testDir, '.claude', 'skills', 'orbit-address-reviews', 'references');
    const ingest = await fs.readFile(path.join(refsDir, 'internal-findings-format.md'), 'utf-8');
    expect(ingest).toContain('review-architecture-<TS>.json');
    expect(ingest).toContain('"proposal" | "system" | "architecture"');
    const log = await fs.readFile(path.join(refsDir, 'run-summary-schema.md'), 'utf-8');
    expect(log).toContain('review-architecture');
    expect(log).toContain('architecture scope');
  });

  describe('explore body carries the six-section convention (rc13a, bounded-closure-semantics)', () => {
    // What IS asserted here is FORM on the generated surface: section list and order, the two
    // status tokens and their production, the slot vocabularies, the closure tokens and the
    // residual-slot rule, the nine move names, the re-entry table, the conclude order, the
    // no-metadata sentence, and that the shipped exemplar's lines match the grammar's productions.
    // What is NOT asserted, and cannot be from a body: that any enumeration is TRUE, that any
    // residual is honest, or that an author wrote every rule down (R-crc-10 — a record, not a check).
    let skill: string;
    beforeAll(async () => {
      skill = await fs.readFile(
        path.join(testDir, '.claude', 'skills', 'orbit-explore', 'SKILL.md'),
        'utf-8'
      );
    });

    const ordered = (haystack: string, needles: string[]) => {
      let cursor = -1;
      for (const n of needles) {
        const at = haystack.indexOf(n, cursor + 1);
        expect(at, `expected '${n}' after position ${cursor}`).toBeGreaterThan(cursor);
        cursor = at;
      }
    };

    it('scaffolds six sections in the owned order and says six, never five', () => {
      const scaffold = skill.slice(skill.indexOf('## explore.md six-section convention'));
      ordered(scaffold, ['## Premise', '## Mechanism', '## Decisions', '## Open questions', '## Considered & out', '## References']);
      expect(skill).toContain('all six sections are scaffolded');
      expect(skill).not.toMatch(/(five|5)[- ]sections?/);
      expect(skill).not.toContain('illustrative');
    });

    it('documents both status tokens and the one status-header production', () => {
      expect(skill).toContain('> **Status**: exploring.');
      expect(skill).toContain('> **Status**: concluded <YYYY-MM-DD>.');
      expect(skill).toContain('^> \\*\\*Status\\*\\*: (exploring\\.( .*)?|concluded \\d{4}-\\d{2}-\\d{2}\\.)$');
      expect(skill).toContain('the ONLY other legal token');
    });

    it('states the Decisions entry production with its slot vocabularies and defaults', () => {
      expect(skill).toContain('- **<YYYY-MM-DD> — <ID>: <title>**');
      expect(skill).toContain('<ID> ::= D-[a-z0-9]+-[0-9]+');
      expect(skill).toContain('Kind: rule | fact | scope');
      expect(skill).toContain('^\\s*(?:[-*+]\\s+)?Kind:\\s*(rule|fact|scope)\\s*$');
      expect(skill).toContain('Disposition: live | superseded <ID or pointer> | assigned <stage-id>');
      expect(skill).toContain('Re-entry: <what would reopen it>');
      expect(skill).toContain('**absent means `rule`.**');
      expect(skill).toContain('absent means `live`');
      expect(skill).toContain('One claim under obligation per entry');
    });

    it('states the Mechanism grammar once: closure tokens, residual-slot rule, MALFORMED', () => {
      expect(skill).toContain('<TOKEN> ::= DERIVED | SOURCED | BOUNDED');
      expect(skill.match(/required iff BOUNDED, forbidden otherwise/g)?.length).toBe(2);
      expect(skill).toContain('nine lines, one per move, each move exactly once');
      expect(skill).toContain('**A grammar failure is MALFORMED, naming the line**');
      expect(skill).toContain('Closure is ACCOUNTED, not CLOSED');
      expect(skill).toContain('"There may be others" discharges nothing');
      expect(skill).toContain('VISIBILITY, never BLOCKING');
    });

    it('carries the nine-move table with every move named', () => {
      const table = skill.slice(skill.indexOf('### The nine moves, applied per rule'), skill.indexOf('### Exemplar'));
      for (const move of ['READ', 'ENUMERATE', 'COHERE', 'EXECUTE', 'FALSIFY', 'CONFORM', 'FEASIBILITY', 'CONSUME', 'INVOKE']) {
        expect(table).toContain(`| **${move}** |`);
      }
      expect(table).toContain('The set is BOUNDED, declared in its own slots.');
      expect(table).toContain('Residual kind:');
      expect(table).toContain('Residual method:');
      expect(table).toContain('RESOURCES');
    });

    it('carries the re-entry table: nine cells in six rows, four refused', () => {
      expect(skill).toContain('| no | — | no | — | Mode B new |');
      expect(skill).toContain('| yes | no | no | — | Mode B resume |');
      expect(skill).toMatch(/\| yes \| yes \| no \| — \| state the conclusion/);
      expect(skill).toMatch(/\| no \| — \| yes \| yes \| resume IN PLACE/);
      expect(skill).toMatch(/\| no \| — \| yes \| no \| Mode B new IN the change directory/);
      expect(skill).toMatch(/\| yes \| either \| yes \| either \| REFUSED/);
    });

    it('status-header production, executed: accepts both tokens, rejects the near-misses', () => {
      const m = skill.match(/^(\^> \\\*\\\*Status\\\*\\\*: \(.+?\)\$)/m);
      expect(m).not.toBeNull();
      const production = new RegExp(m![1]);
      expect(production.test('> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.')).toBe(true);
      expect(production.test('> **Status**: exploring.')).toBe(true);
      expect(production.test('> **Status**: concluded 2026-09-25.')).toBe(true);
      expect(production.test('> **Status**: exploring-bad')).toBe(false);
      expect(production.test('> **Status**: exploring')).toBe(false);
      expect(production.test('> **Status**: concluded 2026-09-25')).toBe(false);
      expect(production.test('> **Status**: concluded 2026-09-25. trailing')).toBe(false);
    });

    it('owned productions and tables: the body carries byte-equal MIRRORS of the spec (R-crc-14 corollary)', async () => {
      // The owner is the spec. While a change is OPEN, its delta is the owner-to-be and the body
      // mirror tracks it (a delta-plus-baseline pair is the normal mid-change state); once synced,
      // the baseline owns it. Two ACTIVE deltas holding one block would be two owners; no holder
      // at all would leave the mirror orphaned — both fail.
      // The lookup is the shared helper (test/helpers/owner-text.ts) since rc13b, where the
      // grammar-module parity test reuses it.
      const fence = (text: string, firstLine: string) => {
        const i = text.indexOf('```\n' + firstLine);
        expect(i, `fence starting ${firstLine}`).toBeGreaterThan(-1);
        return text.slice(i, text.indexOf('\n```', i + 4) + 4);
      };
      const table = (text: string, header: string) => {
        const i = text.indexOf(header);
        expect(i, `table ${header}`).toBeGreaterThan(-1);
        return text.slice(i, text.indexOf('\n\n', i));
      };
      const conv = await ownerText('orbit-conventions', '```\n## Mechanism\n');
      const mods = await ownerText('orbit-explore-modifications', '| staging dir | concluded | active change |');
      expect(fence(skill, '^> \\*\\*Status')).toBe(fence(conv, '^> \\*\\*Status'));
      expect(fence(skill, '- **<YYYY-MM-DD> — <ID>: <title>**')).toBe(fence(conv, '- **<YYYY-MM-DD> — <ID>: <title>**'));
      expect(fence(skill, '## Mechanism\n')).toBe(fence(conv, '## Mechanism\n'));
      expect(table(skill, '| staging dir | concluded | active change |')).toBe(table(mods, '| staging dir | concluded | active change |'));
      expect(table(skill, '| part of the mechanism |')).toBe(table(mods, '| part of the mechanism |'));
      // and each mirror says so, naming its owner
      expect(skill.match(/\*Mirror of `orbit-(conventions|explore-modifications)`'/g)?.length).toBe(5);
    });

    it('states the conclude order and that nothing is written to metadata', () => {
      const section = skill.slice(skill.indexOf('### Concluding an exploration'));
      ordered(section, ['residency sweep', 'CONCLUDED Decisions entry', 'status header flips', 'THEN the final boundary emit']);
      expect(section).toContain('Nothing is written to `.openspec.yaml`');
      expect(section).toContain('STAYS IN PLACE');
      expect(section).toContain('Recommend, never infer');
      expect(section).toContain('superseded <the reopening entry\'s ID>');
    });

    // Cells follow GFM: `\|` is a literal pipe, never a separator (the grammar's clause; the
    // change's own D-bcs-8 Domain row is the fixture rc13b's parser must also accept). The
    // predicate is the grammar module's — imported, never restated (rc13b, D-rc13b-5).
    it('the cell predicate accepts a GFM-escaped pipe inside a cell (D-bcs-8 fixture row)', () => {
      expect(isMemberRow('| move dispositions | `Moves:` + nine lines `- <MOVE>: applied — … \\| not applied — …`, each move exactly once |')).toBe(true);
      expect(isMemberRow('| a | b | c |')).toBe(false);
    });

    it('ships exemplars whose lines match the grammar productions — both closure branches', () => {
      const start = skill.indexOf('```markdown\n### D-bcs-3 — ');
      expect(start).toBeGreaterThan(-1);
      const end = skill.indexOf('\n```', start + 12);
      const block = skill.slice(start + '```markdown\n'.length, end);
      // split into entries at each `### D-` heading
      const entries = block.split(/\n(?=### D-)/).map((e) => e.split('\n').filter((l) => l.length > 0));
      expect(entries.length).toBeGreaterThanOrEqual(2);
      const tokens: string[] = [];
      for (const lines of entries) {
        expect(lines[0]).toMatch(MECHANISM_ENTRY_HEADING);
        expect(lines[1]).toMatch(DOMAIN_LINE);
        expect(isTableHeader(lines[2])).toBe(true);
        expect(lines[3]).toMatch(TABLE_SEPARATOR);
        let i = 4;
        let members = 0;
        while (lines[i].startsWith('|')) {
          expect(isMemberRow(lines[i]), lines[i]).toBe(true);
          members++;
          i++;
        }
        expect(members).toBeGreaterThan(0);
        const closure = lines[i].match(CLOSURE_LINE);
        expect(closure, lines[i]).not.toBeNull();
        tokens.push(closure![1]);
        i++;
        if (closure![1] === 'BOUNDED') {
          expect(lines[i++]).toMatch(RESIDUAL_KIND_LINE);
          expect(lines[i++]).toMatch(RESIDUAL_METHOD_LINE);
        } else {
          expect(lines[i]).not.toMatch(RESIDUAL_ANY_LINE);
        }
        expect(lines[i++]).toMatch(MOVES_LINE);
        const moves = lines.slice(i);
        expect(moves).toHaveLength(9);
        const seen = moves.map((l) => {
          const m = l.match(MOVE_LINE);
          expect(m, l).not.toBeNull();
          return m![1];
        });
        expect(new Set(seen).size).toBe(9);
      }
      // one exemplar per closure OUTCOME: at least one CLOSED entry and at least one BOUNDED entry,
      // so the residual-slot branch above is exercised by the shipped surface, not only by mutation.
      expect(tokens).toContain('BOUNDED');
      expect(tokens.some((t) => t === 'DERIVED' || t === 'SOURCED')).toBe(true);
    });
  });

  it('review LAUNCHER surfaces advertise all three modes (not just the long body)', async () => {
    // Guards the discoverable layer: a future mode addition must update the
    // command mirror and the skill description, not only SKILL.md's body.
    const cmd = await fs.readFile(path.join(testDir, '.claude', 'commands', 'orbit', 'review.md'), 'utf-8');
    expect(cmd).toContain('--as proposal|system|architecture');
    const skill = await fs.readFile(path.join(testDir, '.claude', 'skills', 'orbit-review', 'SKILL.md'), 'utf-8');
    expect(skill).toContain('architecture mode (a doc under orbit/architecture/');
  });
});
