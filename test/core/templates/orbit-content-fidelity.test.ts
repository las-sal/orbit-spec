import { describe, expect, it } from 'vitest';

import {
  getExploreSkillTemplate,
  getOrbitExploreCommandTemplate,
  getOrbitProposeSkillTemplate,
  getOrbitProposeCommandTemplate,
  getOrbitNewCommandTemplate,
  getOrbitContinueCommandTemplate,
  getOrbitApplyCommandTemplate,
  getOrbitFfCommandTemplate,
  getOrbitSyncCommandTemplate,
  getOrbitArchiveCommandTemplate,
  getOrbitBulkArchiveCommandTemplate,
  getOrbitVerifyCommandTemplate,
  getOrbitOnboardCommandTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getOnboardSkillTemplate,
  getSyncSpecsSkillTemplate,
  getReviewSkillTemplate,
  getOrbitReviewCommandTemplate,
  getAddressReviewsSkillTemplate,
  getOrbitAddressReviewsCommandTemplate,
  getAuditDriftSkillTemplate,
  getOrbitAuditDriftCommandTemplate,
  type SkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

/**
 * Fidelity guard for B1 (relocate-modified-upstream-workflows): asserts orbit's
 * editorial layer was relocated into the source modules, orbit-named and
 * mechanism-neutral. Semantic (not hash) assertions so a future edit that
 * silently drops orbit content, reintroduces the /opsx: namespace, or points at
 * the old openspec/ working dir fails loudly.
 *
 * sync-specs joined RELOCATED in D1 (explicit-lifecycle-consent): it gained the
 * disciplines block + the consent-inheritance note (it was a B1 no-op before).
 */
// Per-workflow REQUIRED markers (every listed marker must appear in the skill body).
// A workflow that silently loses its disciplines block, run-summary section, or
// completion-prompt override fails its own assertion — no disjunctive escape hatch.
const RELOCATED: Array<[string, () => SkillTemplate, string[]]> = [
  ['explore', getExploreSkillTemplate, ['execution disciplines', 'Run-summary emit', 'BEGIN emit', 'orbit emit explore', 'No retro-fire', 'BACK-FILLED counts']],
  ['propose', getOrbitProposeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['new-change', getNewChangeSkillTemplate, ['execution disciplines', 'Run-summary emit']],
  ['continue-change', getContinueChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['apply-change', getApplyChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override', 'blocked-by-gate', 'gate_overridden', 'Consent at entry', 'consent_era_from', '"user-invoked" | "prompted"', 'orbit emit apply']],
  ['ff-change', getFfChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['bulk-archive-change', getBulkArchiveChangeSkillTemplate, ['# Orbit additions', 'execution disciplines', 'Per-change consent', 'consent_era_from']],
  ['verify-change', getVerifyChangeSkillTemplate, ['execution disciplines', 'Run-summary emit']],
  ['archive-change', getArchiveChangeSkillTemplate, ['execution disciplines', 'run summary', 'review-system gate inflection', 'gate_overridden', 'Consent at entry', 'consent_era_from', 'Sync inheritance']],
  ['onboard', getOnboardSkillTemplate, ['execution disciplines', 'self-contained', 'Four execution disciplines']],
  ['sync-specs', getSyncSpecsSkillTemplate, ['execution disciplines', 'Consent inheritance']],
  // B3 editorial workflows (net-new relocation; parity proof per D-b3-4)
  ['review', getReviewSkillTemplate, ['execution disciplines', 'orbit status --change <name> --report', 'Paste the output VERBATIM', 'hand-rendering them is PROHIBITED', 'architecture mode is EXEMPT', 'recommendation_options', 'reviewer_class', 'commentary', 'REVIEWER-CLASS axis', 'references/external-handoff.md', 'references/passes-<mode>.md', 'orbit emit review']],
  ['address-reviews', getAddressReviewsSkillTemplate, ['execution disciplines', 'Ripple cascade', 'obvious-fix lane preview', 'present → discuss → ratify', "AFTER the finding's discussion concludes", 'RE-PRESENTS the finding', 'one prompt NEVER spans multiple findings', 'ratified_via', 'delegation_directive', 'resolution log']],
  ['audit-drift', getAuditDriftSkillTemplate, ['execution disciplines', 'Vocabulary residue', 'Persist the run summary', 'recommendation_options']],
];

// D1 (explicit-lifecycle-consent): every generated body echoes the no-chaining
// contract as the FOURTH disciplines entry, and no body renders an imperative
// `Next:` label — eligibility phrasing (`Ready when you are:`) is the only
// recommendation label. Exit-criterion greps per the D-arc D1 acceptance tests.
const ALL_SURFACE_SKILLS: Array<[string, () => SkillTemplate]> = [
  ['explore', getExploreSkillTemplate],
  ['propose', getOrbitProposeSkillTemplate],
  ['new-change', getNewChangeSkillTemplate],
  ['continue-change', getContinueChangeSkillTemplate],
  ['apply-change', getApplyChangeSkillTemplate],
  ['ff-change', getFfChangeSkillTemplate],
  ['sync-specs', getSyncSpecsSkillTemplate],
  ['bulk-archive-change', getBulkArchiveChangeSkillTemplate],
  ['verify-change', getVerifyChangeSkillTemplate],
  ['archive-change', getArchiveChangeSkillTemplate],
  ['onboard', getOnboardSkillTemplate],
  ['review', getReviewSkillTemplate],
  ['address-reviews', getAddressReviewsSkillTemplate],
  ['audit-drift', getAuditDriftSkillTemplate],
];

// dirName -> exact reference declarations for the B3 multi-file editorial skills
const B3_REFERENCES: Array<[string, () => SkillTemplate, string[]]> = [
  ['review', getReviewSkillTemplate, ['run-summary-schema.md', 'passes-proposal.md', 'passes-system.md', 'passes-architecture.md', 'external-handoff.md', 'mode-sections.md', 'prompt-template.md', 'flags-detail.md']],
  ['address-reviews', getAddressReviewsSkillTemplate, ['external-findings-format.md', 'internal-findings-format.md', 'resolution-detail.md', 'run-summary-schema.md']],
  ['audit-drift', getAuditDriftSkillTemplate, ['run-summary-schema.md', 'worked-example.md']],
];

// Every generated /orbit:* command is a thin launcher delegating to its skill —
// the skill is the single source of workflow behavior (external-review CRITICAL fix).
const LAUNCHERS: Array<[string, () => { content: string }, string]> = [
  ['explore', getOrbitExploreCommandTemplate, 'orbit-explore'],
  ['new', getOrbitNewCommandTemplate, 'orbit-new-change'],
  ['continue', getOrbitContinueCommandTemplate, 'orbit-continue-change'],
  ['apply', getOrbitApplyCommandTemplate, 'orbit-apply-change'],
  ['ff', getOrbitFfCommandTemplate, 'orbit-ff-change'],
  ['sync', getOrbitSyncCommandTemplate, 'orbit-sync-specs'],
  ['archive', getOrbitArchiveCommandTemplate, 'orbit-archive-change'],
  ['bulk-archive', getOrbitBulkArchiveCommandTemplate, 'orbit-bulk-archive-change'],
  ['verify', getOrbitVerifyCommandTemplate, 'orbit-verify-change'],
  ['onboard', getOrbitOnboardCommandTemplate, 'orbit-onboard'],
  ['propose', getOrbitProposeCommandTemplate, 'orbit-propose'],
  ['review', getOrbitReviewCommandTemplate, 'orbit-review'],
  ['address-reviews', getOrbitAddressReviewsCommandTemplate, 'orbit-address-reviews'],
  ['audit-drift', getOrbitAuditDriftCommandTemplate, 'orbit-audit-drift'],
];

describe('D4 external prompt output-format block: delta <-> shipped template byte-equality', () => {
  it('the orbit-review-external delta carries the SHIPPED inner block verbatim', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.resolve(__dirname, '..', '..', '..');
    const deltaPath = path.join(root, 'orbit', 'changes', 'd4-review-consistency', 'specs', 'orbit-review-external', 'spec.md');
    if (!fs.existsSync(deltaPath)) return; // post-archive: the block lives in the baseline; parity holds transitively
    const delta = fs.readFileSync(deltaPath, 'utf-8');
    const extract = (text) => {
      const i = text.indexOf('Use this exact markdown structure:');
      const a = text.indexOf('```markdown', i);
      const b = text.indexOf('\n```\n', a) + 4;
      return text.slice(a, b);
    };
    const template = getReviewSkillTemplate().references.find((r) => r.name === 'prompt-template.md').content;
    expect(extract(delta)).toBe(extract(template));
  });
});

describe('D4 decision-lane protocol integrity (address-reviews body)', () => {
  const body = getAddressReviewsSkillTemplate().instructions;

  it('no instruction surfaces decision options via AskUserQuestion outside the closure role', () => {
    // The prompt is an OPTIONAL CLOSURE DEVICE (3b.5); no earlier step may
    // instruct firing it to present options (the pre-D4 imperative class).
    expect(body).not.toMatch(/options via \*\*AskUserQuestion\*\*/);
    expect(body).not.toMatch(/surface .{0,40}options .{0,20}AskUserQuestion/);
  });

  it('the closure-only rule is stated', () => {
    expect(body).toContain('post-discussion closure');
  });
});

describe('orbit content fidelity (B1 relocation)', () => {
  describe.each(RELOCATED)('%s', (_name, getTemplate, requiredMarkers) => {
    const skill = getTemplate().instructions;

    it('carries every required orbit editorial marker', () => {
      for (const marker of requiredMarkers) {
        expect(skill).toContain(marker);
      }
    });

    it('is orbit-named + mechanism-neutral (no opsx / openspec working-dir / stale issue refs)', () => {
      expect(skill).not.toContain('/opsx:');
      expect(skill).not.toMatch(/openspec\/(changes|specs|explore|lenses)/);
      expect(skill).not.toContain('openspec-orbit#');
    });
  });

  describe('D1 lifecycle-consent exit criteria (every surface body)', () => {
    describe.each(ALL_SURFACE_SKILLS)('%s', (_name, getTemplate) => {
      const skill = getTemplate().instructions;

      it('echoes the no-chaining contract (fourth discipline)', () => {
        expect(skill).toContain('No-chaining');
        expect(skill).toContain('execution disciplines');
      });

      it('renders no imperative Next: label', () => {
        expect(skill).not.toContain('Next:');
      });
    });

    it('consent-scoped bodies instruct the provenance-gated prompt (user-typed = zero prompts)', () => {
      for (const getTemplate of [getApplyChangeSkillTemplate, getArchiveChangeSkillTemplate]) {
        const skill = getTemplate().instructions;
        expect(skill).toContain('User-invoked');
        expect(skill).toContain('AI-mediated');
        expect(skill).toContain('ZERO added prompts');
        expect(skill).toContain('uncertain, treat the arrival as AI-mediated');
      }
      const bulk = getBulkArchiveChangeSkillTemplate().instructions;
      expect(bulk).toContain("the user's invocation for the confirmed set");
      expect(bulk).toContain('treat the arrival as AI-mediated');
    });
  });

  it('onboard reflects the self-contained fork, not the dead overlay model', () => {
    const skill = getOnboardSkillTemplate().instructions;
    // new orbit-spec framing present
    expect(skill).toContain('self-contained');
    // overlay-model residue gone
    expect(skill).not.toMatch(/orbit's overlay|Overlay orbit|Setup verification/);
    expect(skill).not.toContain('rm -rf .claude/skills/feedback');
    expect(skill).not.toMatch(/MUST equal `?\d+/);
    expect(skill).not.toContain('.claude/skills/');
    // B3: all four editorial commands are generated — no row may be labeled planned
    expect(skill).not.toContain('(planned)');
  });

  describe('references declarations (orbit-skill-generation, D-b2-4 lean scope)', () => {
    it('archive-change declares its exact reference set (D6 added the PR tail)', () => {
      const refs = getArchiveChangeSkillTemplate().references ?? [];
      expect(refs.map((r) => r.name)).toEqual(['archive-summary-schema.md', 'pr-archive-tail.md']);
    });

    it('propose and ff declare exactly the shared PR choreography (D6)', () => {
      for (const getTemplate of [getOrbitProposeSkillTemplate, getFfChangeSkillTemplate]) {
        const refs = getTemplate().references ?? [];
        expect(refs.map((r) => r.name)).toEqual(['pr-choreography.md']);
      }
    });

    it('explore declares exactly capture-formats.md (D5 body-economy move)', () => {
      const refs = getExploreSkillTemplate().references ?? [];
      expect(refs.map((r) => r.name)).toEqual(['capture-formats.md']);
    });

    it('no other workflow declares references', () => {
      // D6 added references to propose and ff (the shared PR choreography).
      const withReferences = new Set([
        'archive-change',
        'explore',
        'propose',
        'ff-change',
        ...B3_REFERENCES.map(([n]) => n),
      ]);
      for (const [name, getTemplate] of RELOCATED) {
        if (withReferences.has(name)) continue;
        expect(getTemplate().references ?? [], `${name} must not declare references`).toEqual([]);
      }
    });

    it.each(B3_REFERENCES)('%s declares its exact reference set', (_name, getTemplate, expected) => {
      const refs = getTemplate().references ?? [];
      expect(refs.map((r) => r.name)).toEqual(expected);
      for (const ref of refs) {
        expect(ref.content).toBeTruthy();
        expect(ref.content).not.toContain('/opsx:');
        expect(ref.content).not.toMatch(/openspec\/(changes|specs|explore|lenses)/);
      }
    });

    it('B3 editorial skills declare their capability metadata (B2 pass-through consumer)', () => {
      for (const [name, getTemplate] of B3_REFERENCES) {
        expect(getTemplate().metadata?.capability).toBe(`orbit-${name}`);
      }
    });

    it('archive schema content matches the baseline-canonical shape and vocabulary', () => {
      const schema = (getArchiveChangeSkillTemplate().references ?? [])[0].content;
      // canonical shapes (orbit-archive-modifications delta scenarios)
      expect(schema).toContain('"unresolved_markers": ["<file>:<line>'); // ARRAY, not object
      expect(schema).not.toContain('"counts": {'); // flat sync_specs counts
      expect(schema).toContain('"added": 0,');
      expect(schema).toContain('audit_skipped_via_flag'); // flat skip flag
      expect(schema).not.toContain('"skipped_via_flag"'); // not nested in audit
      expect(schema).not.toContain('"aborted"'); // three user_decision values only
      // vocabulary: zero opsx/openspec-era residue
      expect(schema).not.toContain('/opsx:');
      expect(schema).not.toMatch(/openspec\/(changes|specs)/);
      expect(schema).not.toContain('openspec-sync-specs');
    });
  });

  describe.each(LAUNCHERS)('command %s', (_name, getTemplate, skillDir) => {
    const content = getTemplate().content;

    it('is a thin launcher delegating to its skill', () => {
      expect(content).toContain('thin launcher');
      expect(content).toContain(`\`${skillDir}\` skill`);
      // a launcher that grows a workflow body again is a regression
      expect(content.length).toBeLessThan(600);
    });

    it('is mechanism-neutral', () => {
      expect(content).not.toContain('/opsx:');
      expect(content).not.toContain('.claude/skills/');
      expect(content).not.toMatch(/openspec\/(changes|specs|explore|lenses)/);
    });
  });
});

/**
 * D-arc Stage D6 — the PR lifecycle layer.
 *
 * The choreography is defined ONCE in `pr-choreography.ts` and consumed as a `references/`
 * file by propose, ff, and archive. These assertions guard the two properties the spec makes
 * load-bearing: that no seam resolves a remote or base independently (a seam that did would
 * defeat the `--repo` constraint the other seam relies on), and that every copyable `gh`
 * invocation is repository-qualified.
 */
describe('D6 PR lifecycle surface', () => {
  const propose = getOrbitProposeSkillTemplate();
  const ff = getFfChangeSkillTemplate();
  const archive = getArchiveChangeSkillTemplate();
  const bulk = getBulkArchiveChangeSkillTemplate();

  function reference(tpl: SkillTemplate, name: string): string {
    const ref = (tpl.references ?? []).find((r) => r.name === name);
    expect(ref, `${tpl.name} is missing references/${name}`).toBeDefined();
    return ref!.content;
  }

  it('propose and ff ship the SAME choreography reference (identical bytes)', () => {
    const a = reference(propose, 'pr-choreography.md');
    const b = reference(ff, 'pr-choreography.md');
    expect(a).toBe(b);
  });

  it('archive ships the tail reference', () => {
    expect(reference(archive, 'pr-archive-tail.md')).toContain('The read-only PR preflight');
  });

  it('both references carry the ONE shared resolution algorithm, byte-identical', () => {
    const choreography = reference(propose, 'pr-choreography.md');
    const tail = reference(archive, 'pr-archive-tail.md');
    const marker = '## Remote and default-branch resolution (SHARED — both seams)';
    expect(choreography).toContain(marker);
    expect(tail).toContain(marker);
    // The shared section runs from its heading to the config-order heading that follows it.
    const slice = (s: string) =>
      s.slice(s.indexOf(marker), s.indexOf('## Config resolution order'));
    expect(slice(choreography)).toBe(slice(tail));
    expect(slice(choreography).length).toBeGreaterThan(200);
  });

  it('no seam resolves a remote or default branch independently', () => {
    // The bodies POINT at the reference; only the shared section states the algorithm.
    for (const tpl of [propose, ff, archive]) {
      expect(tpl.instructions).not.toMatch(/git symbolic-ref refs\/remotes/);
      expect(tpl.instructions).not.toMatch(/prefer\s+`?origin`?\s+when present/i);
    }
  });

  it('every copyable gh invocation in the references is repository-qualified', () => {
    for (const content of [
      reference(propose, 'pr-choreography.md'),
      reference(archive, 'pr-archive-tail.md'),
    ]) {
      // Invocation-shaped: a gh command carrying at least one flag or argument beyond the
      // subcommand. Bare prose mentions (`gh pr create` erroring) carry no arguments.
      const invocations = content.match(/`gh (?:repo|pr) [a-z]+ [^`]*`/g) ?? [];
      expect(invocations.length).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv, `unqualified gh invocation: ${inv}`).toContain('--repo');
      }
    }
  });

  it('propose adds NO consent prompt at entry (D-d6-6: propose is not consent-scoped)', () => {
    expect(propose.instructions).toContain('fires NO consent prompt');
    const prSection = propose.instructions.slice(propose.instructions.indexOf('## PR lifecycle'));
    expect(prSection).not.toContain('AskUserQuestion');
  });

  it('config-first resolution order is stated in the bodies, not only the reference', () => {
    for (const tpl of [propose, ff]) {
      expect(tpl.instructions).toMatch(/RETURN IMMEDIATELY/);
      expect(tpl.instructions).toMatch(/probe nothing/i);
    }
  });

  it('archive positions the preflight BEFORE the emit and the tail AFTER it', () => {
    const b = archive.instructions;
    // Anchor on the HEADINGS: the prose carries forward references to later steps.
    const preflight = b.indexOf('## NEW Step 5.45');
    const emit = b.indexOf('## NEW Step 5.5 — Archive run summary');
    const tail = b.indexOf('## NEW Step 5.7');
    expect(preflight).toBeGreaterThan(-1);
    expect(preflight).toBeLessThan(emit);
    expect(emit).toBeLessThan(tail);
  });

  it('archive consent preview names the outward writes for an attached change', () => {
    expect(archive.instructions).toContain('PR-ATTACHED');
    expect(archive.instructions).toMatch(/READY FLIP|READY flip/);
    expect(archive.instructions).toContain('fires no second prompt');
  });

  it('bulk-archive runs NO tail and names what it left draft', () => {
    expect(bulk.instructions).toContain('runs NO tail');
    expect(bulk.instructions).toMatch(/NAME the PR-attached changes it left DRAFT/i);
    expect(bulk.instructions).not.toMatch(/`gh pr ready`/);
  });

  it('new and continue are NOT extended with the PR layer', () => {
    for (const tpl of [getNewChangeSkillTemplate(), getContinueChangeSkillTemplate()]) {
      expect(tpl.instructions).not.toContain('pr_attachment');
      expect((tpl.references ?? []).some((r) => r.name.startsWith('pr-'))).toBe(false);
    }
  });
});
