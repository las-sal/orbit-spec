import { describe, expect, it } from 'vitest';
import { COMPLETE_SLOT_PRODUCTIONS } from '../../../src/core/architecture/parser.js';
import { ownerText } from '../../helpers/owner-text.js';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

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
  getArchitectSkillTemplate,
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
import { ownerText } from '../../helpers/owner-text.js';
import { EXPLORE_MECHANISM_ENTRY_PRODUCTION } from '../../../src/core/explore-grammar.js';

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
//
// rc04c (2026-09-24): the `gate_overridden` pins on apply-change and archive-change RETIRED
// with the bodies — the field is gone from the write path, and the continuation/proceed
// judgement entry is the sole record of a proceed-anyway. A pin going red on deliberate work
// is the pin doing its job; the successor marker (`continuation`) takes its slot so a body
// that silently drops the record's instruction still fails here.
//
// rc04c system blind pair (2026-09-24): `ACCEPTED as a pass` pins the token-source qualifier in
// every body that enumerates citable passes (apply, archive ×2, review's spend record) — both
// halves of the pair found the enumeration counting REJECTED external returns as citable, which
// the write gate refuses. The sentence is stated in four bodies; this pin is what keeps the
// qualifier from dropping out of one of them silently.
const RELOCATED: Array<[string, () => SkillTemplate, string[]]> = [
  ['explore', getExploreSkillTemplate, ['execution disciplines', 'Run-summary emit', 'BEGIN emit', 'orbit emit explore', 'No retro-fire', 'BACK-FILLED counts']],
  // rc13c (propose-consumes-mechanism): the concluded refuse in Step 0, live-only naming inference, the
  // section-list mirror, the Mechanism read after the last file write, the Step 0c.6 record and its
  // no-engine-record header, the rule-answer note at Step 0b. Position and parity assertions live in
  // the `rc13c propose consume-mode integrity` block below.
  ['propose', getOrbitProposeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override', 'this exploration concluded on', 'is never reached', 'LIVE staging director', 'Mechanism → artifacts', 'no engine record', 'Residual kind:', 'no Mechanism entry is authored at propose', 'second claim on one truth']],
  ['new-change', getNewChangeSkillTemplate, ['execution disciplines', 'Run-summary emit']],
  ['continue-change', getContinueChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['apply-change', getApplyChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override', 'blocked-by-gate', 'continuation', 'formed_against: []', 'ACCEPTED as a pass', 'Consent at entry', 'consent_era_from', '"user-invoked" | "prompted"', 'orbit emit apply']],
  ['ff-change', getFfChangeSkillTemplate, ['execution disciplines', 'Run-summary emit', 'Completion-prompt override']],
  ['bulk-archive-change', getBulkArchiveChangeSkillTemplate, ['# Orbit additions', 'execution disciplines', 'Per-change consent', 'consent_era_from']],
  ['verify-change', getVerifyChangeSkillTemplate, ['execution disciplines', 'Run-summary emit']],
  ['archive-change', getArchiveChangeSkillTemplate, ['execution disciplines', 'run summary', 'review-system gate inflection', 'continuation', 'formed_against: []', 'ACCEPTED as a pass', 'Consent at entry', 'consent_era_from', 'Sync inheritance']],
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

  it("review's spend-record token source carries the ACCEPTED-as-a-pass qualifier (rc04c system blind pair)", () => {
    // The fourth copy of the token-source sentence lives in the external-handoff REFERENCE, not
    // the skill body, so the body-marker table above cannot pin it; this does.
    const ref = getReviewSkillTemplate().references.find((r) => r.name === 'external-handoff.md')!.content;
    expect(ref).toContain('ACCEPTED as a pass');
    expect(ref).not.toContain('cannot be unresolvable');
  });
});

describe('rc13c propose consume-mode integrity (Mechanism section consumption)', () => {
  const body = getOrbitProposeSkillTemplate().instructions;
  const sections = (text: string): Record<string, string> => {
    const out: Record<string, string> = {};
    const parts = text.split(/\n(?=## )/);
    for (const part of parts) {
      const m = part.match(/^## (.+)$/m);
      if (m) out[m[1].trim()] = part;
    }
    return out;
  };
  const stripTrailing = (t: string) => t.split('\n').map((l) => l.replace(/\s+$/, '')).join('\n');

  it('the concluded refuse sits inside Mode detection, after the conflict sub-step and before the consume-mode flow (exit 3)', () => {
    const sec = sections(body);
    const mode = sec['Mode detection (NEW Step 0 — runs before upstream Step 1)'];
    expect(mode, 'Mode detection section present').toBeTruthy();
    const conflict = mode.indexOf('**Check for conflict**');
    const refuse = mode.indexOf('this exploration concluded on');
    expect(conflict).toBeGreaterThan(-1);
    expect(refuse).toBeGreaterThan(conflict);
    // The concluded-plus-conflict refuse sits INSIDE the conflict sub-step, before its prompt (precedence 1).
    const bothRefuse = mode.indexOf('second claim on one truth');
    const regen = mode.indexOf('**Regenerate from explore**');
    expect(bothRefuse).toBeGreaterThan(conflict);
    expect(regen).toBeGreaterThan(bothRefuse);
    expect(mode).not.toContain('refused here too');
    // The refuse is taught ONCE in the whole body — and the positional checks above prove that one
    // occurrence sits in Mode detection. (A section-slice negative assertion was retired at the system
    // blind-pair walk: the slicer is fence-blind and a fenced `## Touchpoints` example truncated the
    // consume-mode slice, so it reported coverage it did not have.)
    expect(body.split('this exploration concluded on').length - 1).toBe(1);
  });

  it('points at the re-entry rule and never restates it (exit 3)', () => {
    expect(body).not.toContain('| staging dir | concluded |');
    expect(body).not.toContain('ask nothing else');
  });

  it("carries no 'five-section' residue (rc13a's declared exemption closed)", () => {
    expect(body).not.toMatch(/(five|5)[- ]sections?/);
  });

  it("the section-list mirror is byte-equal to orbit-conventions' format requirement (emphasis stripped)", async () => {
    const owner = await ownerText('orbit-conventions', 'fixed SIX-section format');
    const m = owner.match(/fixed SIX-section format for `explore\.md`, in this order: ([^.]+)\./);
    expect(m, 'the owner states the list in one "in this order:" clause').toBeTruthy();
    const ownerList = m![1].replace(/\*\*/g, '').trim();
    expect(body).toContain(`in its order — ${ownerList}.`);
  });

  it("the Step 0c.6 decision table is byte-equal to the ADDED requirement's (trailing whitespace trimmed)", async () => {
    const owner = await ownerText('orbit-propose-modifications', 'a PARTITION of the entries and live rules');
    const rows = (text: string) => {
      const start = text.indexOf('| row | owner\'s Decisions state | accounting state | lands in |');
      expect(start, 'table header present').toBeGreaterThan(-1);
      const lines = text.slice(start).split('\n');
      const table: string[] = [];
      for (const l of lines) {
        if (!l.startsWith('|')) break;
        table.push(l.replace(/\s+$/, ''));
      }
      return table;
    };
    const ownerRows = rows(owner);
    expect(ownerRows.length).toBe(7); // header + separator + five rows
    expect(rows(body)).toEqual(ownerRows);
  });

  it("the four-shape list is byte-equal to the ADDED requirement's clause", async () => {
    const owner = await ownerText('orbit-propose-modifications', 'a PARTITION of the entries and live rules');
    const m = owner.match(/lands in requirement text as one of four shapes, each observed on the record: ([\s\S]+?)\. Which shape fits/);
    expect(m, 'the owner states the four shapes in one clause').toBeTruthy();
    const bm = body.match(/\*\*The CLOSED shapes\*\* \(a checked mirror of the requirement's list\): ([\s\S]+?)\. Which shape fits/);
    expect(bm, 'the body states its four shapes in one clause').toBeTruthy();
    expect(stripTrailing(bm![1])).toBe(stripTrailing(m![1]));
    expect(body.split(stripTrailing(m![1])).length - 1, 'exactly one occurrence in the body').toBe(1);
  });

  it('the Step 0b entry form interpolates the grammar constant (no hand-written variant)', () => {
    expect(body).toContain('- **<YYYY-MM-DD> — <ID>: <title>** <prose…>');
    expect(body).not.toContain('D-<tag>-<n>');
  });

  it('the Step 0b Mechanism grammar mirror is the grammar module\'s production (adopter-safe, one source)', () => {
    expect(body).toContain('```\n' + EXPLORE_MECHANISM_ENTRY_PRODUCTION + '\n```');
    expect(body.split(EXPLORE_MECHANISM_ENTRY_PRODUCTION).length - 1).toBe(1);
  });
});

describe('rc15 ended-stage-state: the architect §5 offer, the unprompted route, audit-drift check (b) by pointer', () => {
  const architect = getArchitectSkillTemplate().instructions;
  const auditDrift = getAuditDriftSkillTemplate().instructions;
  const h3 = (text: string, prefix: string): string => {
    const parts = text.split(/\n(?=### )/);
    const part = parts.find((p) => p.startsWith(`### ${prefix}`));
    expect(part, `section '### ${prefix}' present`).toBeTruthy();
    return part!;
  };

  it('§5 carries the third answer, the ended write, stages_ended, and offers an ended stage nothing', () => {
    const s5 = h3(architect, '5. Completion-ratification flow');
    expect(s5).toContain('**ratify** / **not yet** / **ended**');
    expect(s5).toContain('the stage\'s exit criteria will not be met, the stage renders `ended`, and the mark is a slot edit that can be reversed by hand');
    expect(s5).toContain('write `Complete: [~] <YYYY-MM-DD> (<who>)` into that stage\'s slot with the same insert rule');
    expect(s5).toContain('under `stages_ended` — never under `completions_ratified`');
    expect(s5).toContain('a stage rendering `ended`, `ended-from-explore` or `complete` is offered nothing');
  });

  it('§5 carries the unprompted route, written on premised/quiescent/concluded + an undated slot, declined on live work and on a dated mark', () => {
    const s5 = h3(architect, '5. Completion-ratification flow');
    expect(s5).toContain('**The unprompted route**');
    expect(s5).toContain('the only route for a `premised` stage');
    expect(s5).toContain('is `premised`, `quiescent` or `concluded` AND its `Complete:` slot is UNDATED (absent, or `[ ]`)');
    expect(s5).toContain('name the live citing artifact and the act that would make the mark supportable — archive the change, or conclude the exploration');
    // fresh system pass S1: both tests are stated in the status JSON's own field names (adopter-safe).
    expect(s5).toContain('the stage is UNDATED when its `ratified` and `ended` fields are both `false`');
    expect(s5).toContain('the `citing[]` entry of kind `active-change`, else the `explore` entry that lacks `concluded: true`');
    expect(s5).toContain('name the existing mark and point at the hand edit as the way to reverse or re-date it');
    expect(s5).toContain('the ended mark is supported wherever no live work contradicts it, `premised` included');
    // R-crc-14: the composition table is named, never restated, in this body.
    expect(s5).toContain('this body names it and restates none of it');
    expect(architect).not.toContain('| observed');
  });

  it('§5 contains exactly ONE AskUserQuestion prompt', () => {
    const s5 = h3(architect, '5. Completion-ratification flow');
    expect(s5.split('**AskUserQuestion**').length - 1).toBe(1);
  });

  it('the §2 scaffold sentence is a CHECKED MIRROR of the owner: the parser constant equals the owning spec\'s inline production, and the body interpolates it once (external system pass W1)', async () => {
    // Body-level: the h3 slicer is fence-blind and §2's scaffold fence carries a `### Stage` line
    // that would truncate the slice (the rc13c lesson above). The sentence is stated once.
    // The owner is read through the single-active-owner lookup (an active delta holding the
    // production, else the baseline) so parity is enforceable mid-change and after sync alike.
    const owner = await ownerText('orbit-architecture-engine', COMPLETE_SLOT_PRODUCTIONS);
    expect(owner).toContain(COMPLETE_SLOT_PRODUCTIONS);
    expect(architect.split(COMPLETE_SLOT_PRODUCTIONS).length - 1).toBe(1);
    expect(architect.indexOf(COMPLETE_SLOT_PRODUCTIONS)).toBeLessThan(architect.indexOf('### 3. Resume'));
    // The mirror says it is one, and names its owner.
    expect(architect).toContain("are a CHECKED MIRROR of `orbit-architecture-engine`'s `Parseable architecture-doc format` requirement");
    expect(architect).toContain('`stages_ended` (the stage ids this session declared ended');
  });

  it('audit-drift check (b) names both marks and points at the composition rule, enumerating no observations', () => {
    expect(auditDrift).toContain('ratified `[x]` or ended `[~]` — on a stage whose observed state the engine\'s composition rule renders INCONSISTENT');
    expect(auditDrift).toContain('this check consumes that rule and enumerates none of its observations');
    expect(auditDrift).toContain('the ended claim is contradicted by live work');
    // The dropped enumerations, and the table itself, are absent.
    expect(auditDrift).not.toContain('no citing artifacts at all (`premised`)');
    expect(auditDrift).not.toContain('live citing work OR');
    expect(auditDrift).not.toContain('| observed');
    expect(auditDrift).not.toContain('ended-from-explore');
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

  it('onboard teaches the per-granularity archive tail: per-change flips READY, program archives append only (external iter 4)', () => {
    const body = getOnboardSkillTemplate().instructions;
    expect(body).toMatch(/for a per-change PR, rewrite the description[^.]*flip the PR \*\*READY\*\*/);
    expect(body).toMatch(/for a PROGRAM PR[^.]*APPEND this stage's entry[^.]*flip NOTHING/);
    expect(body).toContain("stage archives never flip the program PR");
    // The old unconditional sentence must not survive.
    expect(body).not.toMatch(/\(or append this stage's entry, for a program PR\), and flip the PR/);
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
        'architect', // D6 (external iter 1): the arc-done readout carries the shared resolution
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

  // The recorded real-CLI contract and the ONE validator the stub also loads. Paths are
  // MODULE-RELATIVE (external iter 1): a process.cwd() join broke under an explicit --root.
  const prLifecycleDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'integration', 'pr-lifecycle');
  const ghContract = JSON.parse(fs.readFileSync(path.join(prLifecycleDir, 'gh-contract.json'), 'utf-8'));
  const { validate: validateGh } = createRequire(import.meta.url)(
    path.join(prLifecycleDir, 'gh-contract-validate.cjs')
  ) as { validate: (argv: string[], c: unknown) => { ok: boolean; message?: string } };

  /**
   * Every COPYABLE `gh` snippet in a reference, found by SHAPE — never by a remembered
   * command family (external iter 1: a `repo|pr` prefix meant `gh frobnicate …` was never
   * handed to the validator at all, so an unknown TOP-LEVEL command escaped the contract).
   * Unsupported commands are the CONTRACT's business to reject, not the extractor's.
   *
   * Copyable-vs-prose is decided BY THE CONTRACT, not by a heuristic (the flag test that
   * first replaced the family regex validated 9 snippets where this rule validates 15):
   * a snippet is PROSE only when its command RESOLVES in the contract and nothing follows it
   * (`\`gh pr create\`` erroring, `\`gh repo view\`` naming the command). Anything else is
   * validated — including a command the contract does not know, so an invented or mistyped
   * verb fails rather than escaping.
   */
  function ghSnippets(content: string): string[] {
    const commandKeys = Object.keys((ghContract as { commands: Record<string, unknown> }).commands).sort(
      (a, b) => b.length - a.length
    );
    return (content.match(/`gh [a-z][a-z0-9-]*(?: [^`]*)?`/g) ?? []).filter((snippet) => {
      const argv = snippetArgv(snippet);
      const command = commandKeys.find((k) => k.split(' ').every((part, i) => argv[i] === part));
      if (!command) return true; // unknown command → the contract must reject it
      return argv.length > command.split(' ').length; // bare command name → prose
    });
  }

  /**
   * Backticked snippet → argv (leading `gh` dropped). QUOTE-AWARE: a quoted value stays ONE
   * token, matching the argv a shell hands the stub (external iter 1 — whitespace splitting
   * made the two consumers disagree on `--title "Fix title"`). A trailing ellipsis is prose.
   */
  function snippetArgv(snippet: string): string[] {
    const body = snippet.replace(/^`|`$/g, '');
    const tokens: string[] = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const tok = m[1] ?? m[2] ?? m[3];
      if (tok === '…' || tok === '...') continue;
      // A flag whose value is quoted: `--title "Fix title"` → the quotes are the shell's.
      tokens.push(tok);
    }
    return tokens.slice(1);
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
    // The shared section runs from its heading to the next heading in each reference: the
    // config-order gate in the attaching seams' reference, the preflight in the tail's.
    const seamSlice = (s: string) => s.slice(s.indexOf(marker), s.indexOf('## Config resolution order'));
    const tailSlice = (s: string) => s.slice(s.indexOf(marker), s.indexOf('## The read-only PR preflight'));
    expect(seamSlice(choreography)).toBe(tailSlice(tail));
    expect(seamSlice(choreography).length).toBeGreaterThan(200);
    // The archive tail is attachment-gated: no live-config return gate (external iter 3).
    expect(tail).not.toContain('## Config resolution order');
    expect(tail).not.toContain('RETURN IMMEDIATELY');
  });

  it('no seam resolves a remote or default branch independently', () => {
    // The bodies POINT at the reference; only the shared section states the algorithm.
    for (const tpl of [propose, ff, archive]) {
      expect(tpl.instructions).not.toMatch(/git symbolic-ref refs\/remotes/);
      expect(tpl.instructions).not.toMatch(/prefer\s+`?origin`?\s+when present/i);
    }
  });

  it('every copyable gh invocation in the references validates against the recorded real-CLI contract (grammar, not execution)', () => {
    // rc01-instrument-fidelity: the sweep and the stub derive from ONE contract through ONE
    // validator; a snippet the real CLI would reject (unknown flag, missing selector) or that
    // breaks orbit's qualification contract fails here, naming the snippet and the rule.
    for (const content of [
      reference(propose, 'pr-choreography.md'),
      reference(archive, 'pr-archive-tail.md'),
      reference(getArchitectSkillTemplate(), 'pr-resolution.md'),
    ]) {
      // Invocation-shaped: a gh command carrying at least one flag or argument beyond the
      // subcommand. Bare prose mentions (`gh pr create` erroring) carry no arguments.
      const invocations = ghSnippets(content);
      expect(invocations.length).toBeGreaterThan(0);
      for (const inv of invocations) {
        const argv = snippetArgv(inv);
        const r = validateGh(argv, ghContract);
        expect(r.ok, `${inv} → ${r.message ?? ''}`).toBe(true);
      }
    }
  });

  it('the sweep rejects what the stub rejects: negative fixtures run through the EXTRACTOR', () => {
    const cases: Array<[string, string]> = [
      ['`gh repo view --repo <owner>/<repo> --json defaultBranchRef`', 'unknown flag: --repo'],
      ['`gh repo view --json defaultBranchRef`', 'requires a positional'],
      ['`gh pr list --head <branch> --state open --json url`', 'must carry --repo'],
      ['`gh pr view --repo <owner>/<repo> --json isDraft`', 'argument required when using the --repo flag'],
      ['`gh pr frobnicate --repo <owner>/<repo>`', 'unknown command'],
      // An unknown TOP-LEVEL command family must not escape the contract (external iter 1),
      // with or without flags (in-context iter 2: the flag heuristic let the bare form pass).
      ['`gh frobnicate --repo <owner>/<repo>`', 'unknown command'],
      ['`gh frobnicate`', 'unknown command'],
      // Value parse, reproducing the real CLI (external iter 1).
      ['`gh repo view <owner>/<repo> --web=garbage`', 'ParseBool'],
      ['`gh pr list --repo <owner>/<repo> --limit=garbage`', 'ParseInt'],
    ];
    for (const [snippet, message] of cases) {
      // Through the extractor, exactly as a reference's content would be.
      const extracted = ghSnippets(snippet);
      expect(extracted, `extractor missed: ${snippet}`).toHaveLength(1);
      const r = validateGh(snippetArgv(extracted[0]), ghContract);
      expect(r.ok, snippet).toBe(false);
      expect(r.message, snippet).toContain(message);
    }
  });

  it('a bare command name is prose; the same command with an argument is validated', () => {
    // The contract decides, so coverage does not depend on whether a snippet carries a flag.
    expect(ghSnippets('prose `gh repo view` and `gh pr create` name commands')).toEqual([]);
    const argumented = ghSnippets('the positional form is `gh repo view <owner>/<repo>`');
    expect(argumented).toHaveLength(1);
    expect(validateGh(snippetArgv(argumented[0]), ghContract).ok).toBe(true);
  });

  it('a quoted value is ONE token, so the sweep and the stub see the same argv', () => {
    const snippet = '`gh pr create --repo <owner>/<repo> --draft --base <b> --title "Fix the title" --body-file <p>`';
    const argv = snippetArgv(snippet);
    expect(argv).toContain('Fix the title');
    expect(validateGh(argv, ghContract).ok).toBe(true);
    // The same argv a shell hands the stub.
    const shellArgv = ['pr', 'create', '--repo', 'x/y', '--draft', '--base', 'b', '--title', 'Fix the title', '--body-file', 'p'];
    expect(validateGh(shellArgv, ghContract).ok).toBe(true);
  });

  it('propose adds NO consent prompt at entry (D-d6-6: propose is not consent-scoped)', () => {
    expect(propose.instructions).toContain('fires NO consent prompt');
    const prSection = propose.instructions.slice(propose.instructions.indexOf('## PR lifecycle'));
    expect(prSection).not.toContain('AskUserQuestion');
  });

  it('the Position paragraphs use the reference\'s phase numbering (phase 2 = generate + validate; phase 3 carries the no-CI note)', () => {
    for (const tpl of [propose, ff]) {
      const position = tpl.instructions.slice(tpl.instructions.indexOf('**Position'));
      expect(position).toMatch(/Phase 2 \(generation \+\s+validation, ON that branch\)/);
      expect(position).toMatch(/[Pp]hase 3 \(the no-CI\s+note/);
      expect(position).not.toMatch(/Phase 2 \(the no-CI/);
    }
  });

  it('the architect skill carries the shared resolution algorithm as references/pr-resolution.md, byte-identical to the seams', () => {
    const architect = getArchitectSkillTemplate();
    const ref = (architect.references ?? []).find((r) => r.name === 'pr-resolution.md');
    expect(ref, 'architect is missing references/pr-resolution.md').toBeDefined();
    const marker = '## Remote and default-branch resolution (SHARED — both seams)';
    // The seams follow the shared resolution with the config-order gate; the architect
    // reference deliberately omits that gate (the readout is attachment-gated) and follows
    // it with the four-axis query — so each is sliced at its own next heading.
    const seamSlice = (s: string) => s.slice(s.indexOf(marker), s.indexOf('## Config resolution order'));
    const architectSlice = (s: string) => s.slice(s.indexOf(marker), s.indexOf('## The four-axis constrained query'));
    expect(architectSlice(ref!.content)).toBe(seamSlice(reference(propose, 'pr-choreography.md')));
    expect(architectSlice(ref!.content).length).toBeGreaterThan(200);
    expect(ref!.content).not.toContain('## Config resolution order');
    expect(ref!.content).not.toContain('RETURN');
    expect(architect.instructions).toContain('references/pr-resolution.md');
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
    const entryObservation = b.indexOf('## NEW Step 0.7');
    const preflight = b.indexOf('## NEW Step 5.45');
    expect(entryObservation).toBeGreaterThan(-1);
    expect(entryObservation).toBeLessThan(b.indexOf('## NEW Step 1.5')); // before any archive write
    const emit = b.indexOf('## NEW Step 5.5 — Archive run summary');
    const tail = b.indexOf('## NEW Step 5.6 — The PR-attached tail');
    const garnish = b.indexOf('## NEW Step 5.7 — Stage-line garnish');
    expect(preflight).toBeGreaterThan(-1);
    expect(preflight).toBeLessThan(emit);
    expect(emit).toBeLessThan(tail);
    expect(tail).toBeLessThan(garnish); // numbering follows the text order: emit → tail → readout
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

describe('rc02b severity ladder: the generated bodies NAME the ladder and define nothing of their own (task 1.6)', () => {
  const review = getReviewSkillTemplate();
  const walk = getAddressReviewsSkillTemplate();
  const ref = (t: SkillTemplate, name: string) => t.references!.find(r => r.name === name)!.content;
  const LADDER = /per the ladder|Severity ladder/;

  it('every per-pass severity site in the two pass references points at the ladder (no `CRITICAL on|when|for` line without it)', () => {
    for (const name of ['passes-proposal.md', 'passes-system.md']) {
      const lines = ref(review, name).split('\n');
      const offenders = lines.filter(l => /\bCRITICAL (on|when|for)\b/.test(l) && !LADDER.test(l));
      expect(offenders, `${name}: severity sites defining a grade without naming the ladder`).toEqual([]);
      // Every pass paragraph that assigns a severity names the ladder on that line.
      const assigning = lines.filter(l => /^\*\*Pass \d+ — /.test(l) && /\b(CRITICAL|WARNING|SUGGESTION)\b/.test(l));
      expect(assigning.filter(l => !LADDER.test(l)), `${name}: pass paragraphs assigning a severity without the pointer`).toEqual([]);
    }
  });

  it('the proposal pass table and Pass 8 report a BLOCK, not a CRITICAL; the ambiguity-inverts-the-bias clause is gone', () => {
    const p = ref(review, 'passes-proposal.md');
    expect(p).not.toContain('(CRITICAL — must address before apply)');
    expect(p).not.toContain('classify as CRITICAL');
    const pass8 = p.split('**Pass 8 — ')[1].split('**Pass 9 — ')[0];
    expect(pass8).toMatch(/BLOCK/);
    expect(pass8).toContain('blocks');
    const pass1 = p.split('**Pass 1 — ')[1].split('**Pass 2 — ')[0];
    expect(pass1).toMatch(/BLOCK/);
  });

  it("the system Pass 0 fold rule grades verify-change's findings by the ladder as the body's own", () => {
    const s = ref(review, 'passes-system.md');
    const pass0 = s.split('**Pass 0 — ')[1].split('**Pass 1 — ')[0];
    expect(pass0).toMatch(LADDER);
    expect(pass0).toContain('WARNING');
    expect(pass0).toContain('reproduction');
  });

  it('the body\'s general bias line names the ladder; the flags table says --strict stops on a block and --mark writes none', () => {
    const body = review.instructions;
    const bias = body.split('### Pushback bias')[1].split('###')[0];
    expect(bias).toMatch(LADDER);
    const strictRow = body.split('\n').find(l => l.startsWith('| `--strict`'))!;
    expect(strictRow).toMatch(/block/i);
    const markGist = body.split('### 11. Rarely-used flags')[1].split('## Special cases')[0];
    expect(markGist).toMatch(/no marker for a block|never for a block/i);
  });

  it('Step 9\'s field enumeration names `reproduction` (required on CRITICAL) and `blocks`', () => {
    const step9 = review.instructions.split('### 9. Persist via the emit surface')[1].split('### 10.')[0];
    expect(step9).toContain('`reproduction`');
    expect(step9).toMatch(/required.*CRITICAL|CRITICAL.*required/i);
    expect(step9).toContain('`blocks`');
  });

  it('the prompt template carries `## Severity`, the Reproduction line in the CRITICAL quadruple, and `## Blocks`', () => {
    const t = ref(review, 'prompt-template.md');
    expect(t).toContain('## Severity\n\n');
    expect(t).toContain('**Reproduction**: <');
    expect(t).toContain('quadruple');
    expect(t).toContain('## Blocks');
    // The two enumerations of what the parser reads — the handoff reference's Step 7 and the
    // template reference's preamble — name both additions beside File/Description.
    const handoff = ref(review, 'external-handoff.md');
    const stepSeven = handoff.split('### 7.')[1].split('### 8.')[0];
    expect(stepSeven).toContain('**Reproduction**:');
    expect(stepSeven).toContain('## Blocks');
    expect(t.split('## Template')[0]).toContain('**Reproduction**:');
    expect(t.split('## Template')[0]).toContain('## Blocks');
  });

  it('`references/run-summary-schema.md` names `reproduction` on the finding entry and `blocks` on the payload', () => {
    const schema = ref(review, 'run-summary-schema.md');
    expect(schema).toMatch(/"reproduction":/);
    expect(schema).toMatch(/"blocks":/);
    expect(schema).toContain('- **`reproduction`**');
    expect(schema).toContain('- **`blocks`**');
  });

  it('both address-reviews mapping tables carry a `reproduction` row; the JSON path lists blocks[] first at triage', () => {
    const ext = ref(walk, 'external-findings-format.md');
    const int = ref(walk, 'internal-findings-format.md');
    expect(ext.split('\n').some(l => l.startsWith('| `reproduction`'))).toBe(true);
    expect(int.split('\n').some(l => l.startsWith('| `reproduction`'))).toBe(true);
    expect(ext).toContain('**Reproduction**:');
    expect(ext).toContain('## Blocks');
    expect(int).toContain('blocks[]');
    expect(int).toMatch(/"blocks":/);
  });

  it('Step 3a carries step (0): re-run the reproduction first and record `reproduction_rerun`; the triage lists blocks first', () => {
    const body = walk.instructions;
    const step3a = body.split('#### 3a. Apply pushback')[1].split('#### 3b.')[0];
    expect(step3a).toMatch(/^0\. /m);
    expect(step3a).toContain('reproduction_rerun');
    for (const v of ['reproduced', 'not-reproduced', 'cannot-run', 'unreproduced']) expect(step3a).toContain(v);
    const triage = body.split('### 2. Triage')[1].split('### 3. Walk each marker')[0];
    expect(triage).toMatch(/blocks/i);
    expect(triage).toContain('## Blocks');
    expect(triage).toContain('blocks[]');
    const schema = ref(walk, 'run-summary-schema.md');
    expect(schema).toMatch(/"reproduction_rerun":/);
  });
});

describe('rc04b-forward-recommendation: the generated surface carries the direction (task 1.6)', () => {
  const review = getReviewSkillTemplate();
  const walk = getAddressReviewsSkillTemplate();
  const ref = (t: SkillTemplate, name: string) => t.references!.find(r => r.name === name)!.content;
  const RENDER_OWNER = 'Direction renders as its own section and its absence is marked on independent passes';
  const SHAPE_OWNER = 'The review payload carries `direction`';

  it('Step 8 authors the direction under the owner\'s contract: which way and why, never counts / gate state / a command token; owed on fresh and external, optional in-context, refused by the surface otherwise', () => {
    const body = review.instructions;
    expect(body).toContain('### 8. Author the direction and the commentary');
    const step8 = body.split('### 8. Author the direction and the commentary')[1].split('### 9. Persist via the emit surface')[0];
    expect(step8).toContain('`direction`');
    expect(step8).toMatch(/`forward`.*`hold`|`forward` \| `hold`/);
    expect(step8).toMatch(/WHICH WAY and WHY|which way and why/);
    expect(step8).toMatch(/never states? finding counts, the gate's state,? or a command token/i);
    expect(step8).toMatch(/`fresh`.*`external`/);
    expect(step8).toMatch(/optional/i);
    expect(step8).toContain(RENDER_OWNER);
    expect(step8).toContain(SHAPE_OWNER);
    expect(step8).toContain('`orbit-report-rendering`');
    expect(step8).toContain('`orbit-emit-composition`');
  });

  it('Step 9\'s field enumeration names `direction` with the owed/optional rule', () => {
    const step9 = review.instructions.split('### 9. Persist via the emit surface')[1].split('### 10.')[0];
    expect(step9).toContain('`direction`');
    expect(step9).toMatch(/OWED|owed/);
    expect(step9).toMatch(/optional/i);
  });

  it('the prompt template carries `## Direction` between `## Blocks` and `## Notes` with the `**Disposition**:` opener (exit (3)); the preamble and the handoff\'s Step 7 name it', () => {
    const t = ref(review, 'prompt-template.md');
    const i = t.indexOf('Use this exact markdown structure:');
    const a = t.indexOf('```markdown', i);
    const b = t.indexOf('\n```\n', a);
    const block = t.slice(a, b);
    expect(block.indexOf('## Direction')).toBeGreaterThan(block.indexOf('## Blocks'));
    expect(block.indexOf('## Direction')).toBeLessThan(block.indexOf('## Notes'));
    expect(block).toContain('## Direction\n\n**Disposition**: <forward | hold>\n');
    expect(block.split('## Direction').length - 1).toBe(1);
    const section = block.split('## Direction')[1].split('## Notes')[0];
    expect(section).toMatch(/WHICH WAY and WHY/);
    expect(section).toMatch(/Never state finding counts, the gate's state, or a next command/);
    expect(section).toContain('`[no direction]`');
    expect(section).toContain("`orbit-conventions`' External-review findings markdown format");
    // The preamble's "preserve the Output format block" sentence and the handoff's Step 7 enumeration.
    expect(t.split('## Template')[0]).toContain('`## Direction`');
    expect(t.split('## Template')[0]).toContain('`**Disposition**:`');
    const handoff = ref(review, 'external-handoff.md');
    const stepSeven = handoff.split('### 7.')[1].split('### 8.')[0];
    expect(stepSeven).toContain('`## Direction`');
    expect(stepSeven).toContain('`**Disposition**:`');
    // The chat-output instruction after the block enumerates the section.
    expect(t.split('## After completing the review')[1]).toContain('`## Direction`');
  });

  it('`references/run-summary-schema.md` documents `direction` in the block, in the field notes (by pointer to the judgement record\'s vocabulary), and in the schema-intro field list', () => {
    const schema = ref(review, 'run-summary-schema.md');
    expect(schema).toMatch(/"direction":\s*\{/);
    expect(schema).toContain('- **`direction`**');
    const note = schema.split('- **`direction`**')[1].split('\n')[0];
    expect(note).toMatch(/`fresh`.*`external`/);
    // R-crc-14 (system blind pair, external W2): the note names its owners and re-lists nothing —
    // the closed set, the reasoning predicate and the content prohibitions live with the owners
    // and at the two authoring sources (Step 8, the prompt template), never in this third place.
    expect(note).not.toMatch(/`forward`.*`hold`/);
    expect(note).not.toMatch(/non-empty/);
    expect(note).not.toMatch(/finding counts/);
    expect(note).toContain('`orbit-emit-composition`');
    expect(note).toContain('`orbit-report-rendering`');
    expect(note).toContain(RENDER_OWNER);
    expect(note).toContain(SHAPE_OWNER);
    expect(note).toMatch(/judgement record|`orbit-run-summary-emit`/);
    const intro = schema.split('## Field notes')[0].split('```json')[0];
    expect(intro).toContain('`direction`');
  });

  it('the address-reviews expected-file-format block carries `## Direction`, says it is never walked, and names the owner (D6)', () => {
    const ext = ref(walk, 'external-findings-format.md');
    const fmt = ext.split('## Expected file format')[1].split('## Parser contract')[0];
    expect(fmt.indexOf('## Direction')).toBeGreaterThan(fmt.indexOf('## Blocks'));
    expect(fmt.indexOf('## Direction')).toBeLessThan(fmt.indexOf('## Notes'));
    expect(fmt).toContain('**Disposition**: <forward | hold>');
    const section = fmt.split('## Direction')[1].split('## Notes')[0];
    expect(section).toMatch(/never walked/i);
    expect(section).toContain("`orbit-conventions`' External-review findings markdown format");
  });

  it('the architecture interim shape prints `Direction: <disposition>` and contains every reasoning line under `> `; a multiline near-miss with `Ready when you are:` on its second line is pinned contained (walk 2, external W3)', () => {
    const body = review.instructions;
    const interim = body.split('#### Architecture mode — NO gate')[1].split('### 11.')[0];
    expect(interim).toContain('Direction: <disposition>');
    expect(interim).toMatch(/every reasoning line/i);
    expect(interim).toMatch(/^> Ready when you are: /m);
    // Inside the interim shape's example, no reasoning line sits at column 0.
    const example = interim.split('```')[1] ?? '';
    expect(example).toContain('Direction: ');
    expect(example).toMatch(/^> Ready when you are: /m);
    expect(example.split('\n').filter(l => /^Ready when you are: /.test(l))).toEqual([]);
    expect(example.split('\n').filter(l => /^Gate /.test(l))).toEqual([]);
  });
});

describe('rc03b-pass-genres: the review-genre brief carries nothing from the trail (task 1.3)', () => {
  const review = getReviewSkillTemplate();
  const ref = (t: SkillTemplate, name: string) => t.references!.find(r => r.name === name)!.content;
  const PATHSPEC = "':!orbit/changes/<name>/.orbit-runs'";

  it('the external-handoff Step 5 gathers the iteration number ONLY', () => {
    const step5 = ref(review, 'external-handoff.md').split('### 5.')[1].split('### 6.')[0];
    expect(step5).toMatch(/iteration number ONLY/i);
    expect(step5).not.toMatch(/still open|Resolved since|resolved-finding titles/);
    expect(step5).toContain('iteration 1');
    expect(step5).toContain("`orbit-conventions`' `Review mode decision framework`");
  });

  it("Step 6's iteration-3+ line reads \"previously-unused AI\"; option (a) and the trade-off sentence are gone; the worked example carries the new wording", () => {
    const handoff = ref(review, 'external-handoff.md');
    const step6 = handoff.split('### 6.')[1].split('### 7.')[0];
    expect(step6).toContain('**Iteration 3+**: `Fresh session in a previously-unused AI recommended (maximum independence); when every available AI has reviewed this change in this mode, a fresh session of the least-recently-used.`');
    expect(step6).toMatch(/oldest/);
    expect(handoff).not.toContain('Same-vs-fresh trade-off');
    expect(handoff).not.toMatch(/carry context|same-AI continuation/);
    const example = handoff.split('## Worked example')[1].split('## Out of scope')[0];
    expect(example).toContain('previously-unused AI');
  });

  it('the prompt template\'s `## Cycle context` is exactly the iteration line, and its project-context list carries no trail entry', () => {
    const t = ref(review, 'prompt-template.md');
    const cycle = t.split('## Cycle context\n')[1].split('\nDo not push back')[0];
    expect(cycle.trim()).toBe('- Iteration: <N>');
    const project = t.split('## Project context (read first)')[1].split('## Cycle context')[0];
    expect(project).not.toContain('.orbit-runs');
  });

  it('the system-mode read list (mode-sections) and the body\'s Step 4 carry the trail-excluding pathspec', () => {
    const sys = ref(review, 'mode-sections.md').split('## System mode — "What to read for THIS review"')[1].split('## System mode — "What to look for"')[0];
    // Each block carries its own change placeholder (system walk 1, fresh W3): mode-sections is
    // substituted into the prompt under `<change-name>`; the body's Step 4 uses `<name>`.
    expect(sys).toContain("git diff <change-start>..HEAD -- . ':!orbit/changes/<change-name>/.orbit-runs'");
    expect(sys).not.toMatch(/<name>/);
    // The start commit is found by a hash-only read, never from commit subjects (fresh W1).
    expect(sys).toContain('git log --diff-filter=A --format=%h -- orbit/changes/<change-name>/proposal.md | tail -1');
    const step4 = review.instructions.split('### 4. Load context')[1].split('### 5.')[0];
    expect(step4).toContain(`git diff <change-start>..HEAD -- . ${PATHSPEC}`);
    expect(step4).toContain('git log --diff-filter=A --format=%h -- orbit/changes/<name>/proposal.md | tail -1');
    expect(step4).not.toMatch(/estimate `<change-start>` from `git log`/);
  });

  it("Step 5 is scoped to VERIFICATION pass genre; the REVIEW-genre branch names the bounded metadata probe as its only read of the trail's pass and walk records", () => {
    const step5 = review.instructions.split('### 5. Inspect prior runs')[1].split('### 6.')[0];
    expect(step5).toContain('VERIFICATION');
    expect(step5).toContain('REVIEW');
    expect(step5).toContain('`reviewer_class`');
    expect(step5).toContain('`source_path`');
    expect(step5).toMatch(/filenames?/);
    expect(step5).toMatch(/ONLY read of the trail's pass and walk records/i);
    expect(step5).toMatch(/unreadable/i);
    expect(step5).toMatch(/exemption/i);
    // The pushback epitome names no prior-run comparison.
    const epitome = review.instructions.split('- **Pushback (review-time)')[1].split('\n')[0];
    expect(epitome).not.toMatch(/comparing against prior|\.orbit-runs/);
    expect(epitome).toMatch(/current state/);
  });

  it('the `--reviewer`/`--fresh` prose carries the repaired class words, and the fresh dispatch step points at the owner\'s brief rule', () => {
    const body = review.instructions;
    expect(body).toContain('same model, clean context');
    expect(body).toContain('different AI in a separate session');
    const dispatch = body.split('### Dispatching a fresh pass')[1].split(/\n### /)[0];
    expect(dispatch).toContain("`orbit-conventions`' `Review mode decision framework`");
    expect(dispatch).toContain('orbit emit review');
  });
});
