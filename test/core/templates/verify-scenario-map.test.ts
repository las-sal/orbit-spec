import { describe, it, expect } from 'vitest';
import {
  type SkillTemplate,
  getVerifyChangeSkillTemplate,
  getReviewSkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOrbitProposeSkillTemplate,
  getOnboardSkillTemplate,
  getAuditDriftSkillTemplate,
  getAddressReviewsSkillTemplate,
  getArchitectSkillTemplate,
  getSyncSpecsSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent, getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { ownerText } from '../../helpers/owner-text.js';

/**
 * rc06b-map-readers — `orbit-verify-modifications` (tasks 1.1, 2.1; design D1, D2, D3, D5).
 *
 * Verify's Scenario Coverage step reads the scenario map instead of tracing scenarios to tests by
 * prose, through ONE closed reader table stated in the owning requirement and carried by the body as
 * a CHECKED MIRROR (R-crc-14's mirror corollary: an installed skill cannot open the spec). The owner's
 * table is a GFM table, not a fence, so the parity test takes the run of `|` lines that opens at the
 * header row on each side and holds them byte-equal.
 *
 * These are `text` declarations: each test asserts the generated surface CARRIES an instruction.
 * Whether an AI follows it is observed at a system review's Pass 0, never here.
 */
const HEADER_ROW = '| what the surface returns | what verify reports |';
const OWNER_ANCHOR = "### Requirement: Verify's Scenario Coverage step reads the scenario map";
const SURFACE = 'orbit status --change "<name>" --scenarios --json';

/** The run of consecutive `|` lines opening at `header` (the GFM table, header and divider included). */
function gfmTable(text: string, header: string): string {
  const lines = text.split('\n');
  const start = lines.indexOf(header);
  if (start < 0) throw new Error(`no table opening ${JSON.stringify(header)}`);
  let end = start;
  while (end < lines.length && lines[end].startsWith('|')) end++;
  return lines.slice(start, end).join('\n');
}

const verifySkill = (): string => generateSkillContent(getVerifyChangeSkillTemplate(), 'test');

/** Step 6's Scenario Coverage block: from its bold heading to step 7. */
function coverageStep(): string {
  const body = verifySkill();
  const start = body.indexOf('**Scenario Coverage**:');
  const end = body.indexOf('7. **Verify Coherence**');
  expect(start, 'step 6 carries a Scenario Coverage block').toBeGreaterThan(-1);
  return body.slice(start, end);
}

/** The table row whose first cell starts with `cell` (exactly one). */
function row(cell: string): string {
  const rows = gfmTable(coverageStep(), HEADER_ROW)
    .split('\n')
    .filter((l) => l.startsWith(`| ${cell}`));
  expect(rows, `exactly one row opens ${JSON.stringify(cell)}`).toHaveLength(1);
  return rows[0];
}

const ADDITIONS = '# Orbit additions';

describe("verify's Scenario Coverage step reads the scenario map (rc06b)", () => {
  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: The coverage step names the surface and carries no test-tracing instruction
  it('names the surface and carries no instruction to look for covering tests', () => {
    const step = coverageStep();
    expect(step).toContain(SURFACE);
    const body = verifySkill();
    expect(body).not.toMatch(/tests? exist(s)? covering/i);
    expect(body).not.toContain('Add test or implementation');
    expect(step).toMatch(/never trace scenarios to tests by searching test files/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: Implementation tracing is kept and titled apart from the map
  it('keeps the implementation check under its own title, recommending implementation only', () => {
    const step = coverageStep();
    expect(step).toContain('Check if conditions are handled in code');
    const impl = step.slice(step.indexOf('Check if conditions are handled in code'), step.indexOf('Take test coverage from the scenario map'));
    expect(impl).toContain('Scenario not handled in code: <scenario name>');
    expect(impl).not.toContain('Scenario not covered');
    expect(impl).not.toMatch(/\btest/i);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: The body's table mirrors this requirement
  it("the body's reader table is byte-equal to the owning requirement's table", async () => {
    const owner = await ownerText('orbit-verify-modifications', OWNER_ANCHOR);
    const ownerSection = owner.slice(owner.indexOf(OWNER_ANCHOR));
    expect(gfmTable(coverageStep(), HEADER_ROW)).toBe(gfmTable(ownerSection, HEADER_ROW));
  });

  it('the mirror says it is one and names its owner; the table appears once in the body', () => {
    const step = coverageStep();
    const lead = step.slice(0, step.indexOf(HEADER_ROW));
    expect(lead).toMatch(/CHECKED MIRROR/);
    expect(lead).toContain("`orbit-verify-modifications`' `Verify's Scenario Coverage step reads the scenario map`");
    expect(verifySkill().split(HEADER_ROW).length - 1).toBe(1);
  });

  it('the fail-mode classification is pointed at its owner, not restated', () => {
    const step = coverageStep();
    expect(step).toContain("`orbit-run-summary-emit`'s `Verify fail-mode recommendations`");
    expect(step).toMatch(/never `scenarios-fail`/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: A failing surface is a skipped check
  it('a failing command is one note and a skipped check, and nothing else', () => {
    const r = row('the command fails');
    expect(r).toMatch(/one note naming the error/);
    expect(r).toMatch(/skipped/);
    expect(r).toMatch(/no other row applies/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: The check off is reported as not checked
  it('the check off is one note naming the config key, with no finding and no other tracing', () => {
    const r = row('`check` is `"off"`');
    expect(r).toContain('`scenario_map:`');
    expect(r).toMatch(/absent from, or malformed in/);
    expect(r).toMatch(/no other row applies — no scenario, orphan or malformed finding, and no tracing by any other means/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: An uncovered scenario is a warning naming its key
  it('an uncovered scenario is a WARNING naming its triple and recommending a tag or ledger entry', () => {
    const r = row('a `scenarios` entry with `uncovered: true`');
    expect(r).toContain('WARNING `Scenario not covered: <capability> :: <requirement> :: <scenario>`');
    expect(r).toMatch(/`@scenario` tag/);
    expect(r).toMatch(/ledger entry/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: A text-only declaration raises nothing
  it('a declared scenario of any kind raises nothing and its kinds are listed, never summed', () => {
    const r = row('a `scenarios` entry with any declaration');
    expect(r).toMatch(/no finding/);
    expect(r).toMatch(/never summed and never re-graded/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: An orphan matching an unkeyable title is reported with it
  it('unkeyable entries are one finding per triple, with matching orphans listed under it', () => {
    const r = row('one or more `malformed` entries with `source: "spec"`');
    expect(r).toMatch(/ONE WARNING per distinct capability, requirement and scenario triple/);
    expect(r).toMatch(/number of entries/);
    expect(r).toMatch(/every `orphans` entry whose `key` equals that triple joined by ` :: ` is listed under it and is never a finding of its own/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: An orphan's recommendation names its causes
  it("any other orphan names its causes without choosing one", () => {
    const r = row('any other `orphans` entry');
    expect(r).toMatch(/names no scenario of the baseline or this change's delta/);
    expect(r).toMatch(/renamed, removed or mistyped key, or a scenario another active change adds/);
    expect(r).toMatch(/unless it names another active change's scenario/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: A change whose only delta scenarios are unkeyable gets no empty note
  it('the no-delta-scenarios note is withheld when a spec entry is malformed', () => {
    const r = row('`check` is `"on"`, `scenarios` is empty');
    expect(r).toContain('no `malformed` entry has `source: "spec"`');
    expect(r).toMatch(/the change has no delta scenarios/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: A malformed ledger file is reported by its path
  it('a malformed ledger file is named by its path, with no line', () => {
    const r = row('a `malformed` entry with source `ledger-file`');
    expect(r).toContain('`orbit/scenario-ledger.yaml`, with no line');
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: A malformed tag is reported by its line
  it('a malformed tag is named by its file and line with the surface reason', () => {
    const r = row('a `malformed` entry with source `tag` or `ledger`');
    expect(r).toMatch(/naming the file and line/);
    expect(r).toMatch(/the surface's `reason`/);
  });

  // @scenario text orbit-verify-modifications :: Verify's Scenario Coverage step reads the scenario map :: Verify prints counts and no coverage ratio
  it('counts are printed as counts, the baseline-undeclared count included, and no ratio', () => {
    expect(row('`counts` |')).toMatch(/no ratio of covered scenarios/);
    expect(row('`counts.baseline_undeclared`')).toMatch(/printed as a count, never a finding/);
  });

  // @scenario text orbit-conventions :: Generated-file disposition :: A named edit replaces an upstream step in place
  it("the edit landed in the upstream portion and verify's additions section carries no Scenario Coverage text", () => {
    const body = verifySkill();
    const cut = body.indexOf(ADDITIONS);
    expect(cut).toBeGreaterThan(-1);
    expect(body.slice(0, cut)).toContain(SURFACE);
    const additions = body.slice(cut);
    expect(additions).not.toMatch(/Scenario Coverage/);
    expect(additions).not.toContain('--scenarios');
  });
});

describe('every Pass 0 reader reads the scenario map (rc06b)', () => {
  const reviewBody = (): string => generateSkillContent(getReviewSkillTemplate(), 'test');
  const modeSections = (): string => {
    const ref = (getReviewSkillTemplate().references ?? []).find((r) => r.name === 'mode-sections.md');
    if (!ref) throw new Error('the review skill ships references/mode-sections.md');
    return ref.content;
  };

  // @scenario text orbit-verify-modifications :: Every Pass 0 reader reads the scenario map :: System Pass 0 consumes the map through verify
  it('system Pass 0 invokes verify and carries no coverage instruction of its own', () => {
    // The pass definitions ship in a reference, not SKILL.md: search the whole generated surface.
    const surface = [reviewBody(), ...(getReviewSkillTemplate().references ?? []).map((r) => r.content)];
    const pass0 = surface
      .flatMap((t) => t.split('\n'))
      .filter((l) => l.startsWith('**Pass 0 — verify-change delegation**'));
    expect(pass0, 'exactly one Pass 0 definition').toHaveLength(1);
    expect(pass0[0]).toContain('`/orbit:verify <change-name>`');
    for (const text of surface) {
      expect(text).not.toMatch(/tests? exist(s)? covering/i);
      expect(text).not.toMatch(/trace (each )?scenarios? to tests/i);
    }
  });

  // @scenario text orbit-verify-modifications :: Every Pass 0 reader reads the scenario map :: The external prompt's item 0 names the surface
  it("the external prompt's system item 0 names the surface and the not-run fallback", () => {
    const text = modeSections();
    const system = text.slice(text.indexOf('## System mode'));
    const item0 = system.split('\n').find((l) => l.startsWith('0. '));
    expect(item0, 'system mode carries an item 0').toBeDefined();
    expect(item0).toContain('`orbit status --change <change-name> --scenarios --json`');
    expect(item0).toMatch(/cannot run it reports? the check as not run/);
  });
});

/**
 * The classification and wrapper scenarios of the two MODIFIED blocks this change carries (task 4.2).
 * Each asserts the observable part of its scenario on the generated surface; the process part (who
 * may edit what, through which change) is the rule's own and no test runs it.
 */
describe('Generated-file disposition is visible in the bodies (rc06b, task 4.2)', () => {
  const marker = (t: SkillTemplate): number => t.instructions.split('\n# Orbit additions\n').length - 1;

  // @scenario text orbit-conventions :: Generated-file disposition :: Orbit-modified — upstream body with `# Orbit additions`
  it('each orbit-modified body carries exactly one `# Orbit additions` section after its upstream portion', () => {
    const modified: SkillTemplate[] = [
      getExploreSkillTemplate(), getOrbitProposeSkillTemplate(), getArchiveChangeSkillTemplate(),
      getApplyChangeSkillTemplate(), getVerifyChangeSkillTemplate(), getContinueChangeSkillTemplate(),
      getFfChangeSkillTemplate(), getNewChangeSkillTemplate(), getBulkArchiveChangeSkillTemplate(),
    ];
    for (const t of modified) {
      expect(marker(t), t.name).toBe(1);
      expect(t.instructions.indexOf('\n# Orbit additions\n'), t.name).toBeGreaterThan(0);
    }
  });

  // @scenario text orbit-conventions :: Generated-file disposition :: Upstream-verbatim — kept unchanged
  it("the upstream-verbatim body's additions carry only the epitome and its invocation note, no step of its own", () => {
    const t = getSyncSpecsSkillTemplate();
    expect(marker(t)).toBe(1);
    const additions = t.instructions.slice(t.instructions.indexOf('\n# Orbit additions\n'));
    const headings = additions.split('\n').filter((l) => l.startsWith('## '));
    expect(headings).toEqual([
      '## Four execution disciplines (epitome)',
      '## Consent inheritance (D1, per `orbit-lifecycle-consent`)',
    ]);
    // No numbered step and no command block: notes only.
    expect(additions).not.toMatch(/^\s*\d+\. \*\*/m);
    expect(additions).not.toContain('```');
  });

  // @scenario text orbit-conventions :: Generated-file disposition :: Orbit-authored — full ownership
  it('each orbit-authored body is orbit-named and carries no upstream/additions split', () => {
    for (const t of [getOnboardSkillTemplate(), getReviewSkillTemplate(), getAuditDriftSkillTemplate(), getAddressReviewsSkillTemplate(), getArchitectSkillTemplate()]) {
      expect(t.name, t.name).toMatch(/^orbit-/);
      expect(marker(t), t.name).toBe(0);
    }
  });
});

describe('the emit layer wraps verify and apply without changing them (rc06b, task 4.2)', () => {
  const split = (t: SkillTemplate): [string, string] => {
    const i = t.instructions.indexOf('\n# Orbit additions\n');
    return [t.instructions.slice(0, i), t.instructions.slice(i)];
  };

  // @scenario text orbit-run-summary-emit :: Emit-layer wraps upstream skills without modifying them :: emit-layer does not modify task-checking
  it("apply's task-checking step is upstream's line, and the emit instructions live only in the additions", () => {
    const [upstream, additions] = split(getApplyChangeSkillTemplate());
    // upstream/v1.3.1's apply-change carries this line verbatim.
    expect(upstream).toContain('   - Mark task complete in the tasks file: `- [ ]` → `- [x]`');
    expect(upstream).not.toMatch(/^## Run-summary emit/m);
    expect(additions).toMatch(/^## Run-summary emit/m);
  });

  // @scenario text orbit-run-summary-emit :: Verify fail-mode recommendations :: Multiple fail signals — precedence ③ > ① > ②
  // rc06b system walk 2 (Sal: A): verify classifies; the engine composes from the mode it is handed.
  // The composition side is pinned per mode by emit-composition's behaviour tests.
  it("verify's additions run validate and classify the fail mode by the precedence, mode ③ first", () => {
    const [upstream, additions] = split(getVerifyChangeSkillTemplate());
    const section = additions.slice(additions.indexOf('## Fail-mode classification'), additions.indexOf('## Run-summary emit'));
    expect(section).toContain('orbit validate <name>');
    expect(section).toContain('validator-error > tasks-incomplete > scenarios-fail');
    expect(section).toMatch(/take the FIRST that holds/);
    expect(section).toMatch(/classifies nothing/);
    expect(upstream).not.toContain('validator-error');
  });
});

/**
 * `orbit-run-summary-emit`'s `Emit scope`, carried as a MODIFIED block since system walk 1 (the
 * sync-specs clause narrowed). Its scenarios that are body instructions are declared here as `text`;
 * the engine-side ones are tagged at their emit-composition tests.
 */
describe("Emit scope's body-side scenarios (rc06b system walk 1)", () => {
  const explore = (): string => getExploreSkillTemplate().instructions;

  // @scenario text orbit-run-summary-emit :: Emit scope :: Mode C crystallization BEGIN emit carries the back-filled state (D-arc Stage D3)
  it('explore instructs Mode C to back-fill explore.md before firing the begin emit', () => {
    expect(explore()).toContain('Mode C (crystallization): back-fill `explore.md` FIRST, then fire');
  });

  // @scenario text orbit-run-summary-emit :: Emit scope :: Bare-mode /orbit:explore writes no JSON
  it('explore states that bare mode does not emit', () => {
    expect(explore()).toContain('Bare-mode `/orbit:explore` does NOT emit');
  });

  // @scenario text orbit-run-summary-emit :: Emit scope :: /orbit:onboard does not emit
  it('onboard instructs no emit and says it does not emit', () => {
    const body = getOnboardSkillTemplate().instructions;
    expect(body).not.toMatch(/orbit emit onboard/);
    expect(body).toContain('`/orbit:onboard` is one of the few commands that does NOT emit');
  });

  // @scenario text orbit-run-summary-emit :: Emit scope :: /orbit:bulk-archive relies on inner /orbit:archive emits
  it('bulk-archive instructs no emit of its own and names the inner archive emits', () => {
    const body = getBulkArchiveChangeSkillTemplate().instructions;
    expect(body).not.toMatch(/orbit emit bulk-archive/);
    // rc10 system walk (fresh W2): the body now names the step that writes each change's emit.
    expect(body).toContain('each archived change gets its own `archive-<TS>.json`, written by the per-change archive emit step above');
    expect(body).toContain('SHALL NOT emit a separate `bulk-archive-<TS>.json`');
  });

  // @scenario text orbit-run-summary-emit :: Emit scope :: Bodies instruct the surface, never hand-compose
  it('every SKILL.md body with an emit step invokes `orbit emit` and carries no spine JSON', () => {
    let emitting = 0;
    for (const { template } of getSkillTemplates()) {
      const body = template.instructions;
      if (!/Run-summary emit/.test(body)) continue;
      emitting++;
      expect(body, template.name).toMatch(/orbit emit [a-z-]+/);
      expect(body, template.name).not.toMatch(/"timestamp"\s*:/);
      expect(body, template.name).not.toMatch(/"next_recommended"\s*:/);
    }
    expect(emitting).toBeGreaterThan(5);
  });
});
