import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { DEFERRAL_REFUSALS } from '../../../src/core/templates/workflows/archive-change.js';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';
import { loadChangeContext, formatChangeStatus } from '../../../src/core/artifact-graph/instruction-loader.js';

/**
 * rc10-apply-closure — the archive seam's user-validation closure (Step 3.2), Step 3's named edit,
 * the widened Step 3.4 gate prompt, the readout line, and bulk archive's per-change step (tasks
 * 2.1–2.4, 2.6, 2.8), plus the two fixture runs of tasks 4.2 and 4.3.
 */

const body = () => getArchiveChangeSkillTemplate().instructions;
const bulk = () => getBulkArchiveChangeSkillTemplate().instructions;
const section = (text: string, heading: string): string => {
  const start = text.indexOf(heading);
  expect(start, `body carries "${heading}"`).toBeGreaterThanOrEqual(0);
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next < 0 ? undefined : next);
};
const step3 = () => {
  const b = body();
  return b.slice(b.indexOf('3. **Check task completion status**'), b.indexOf('4. **Assess delta spec sync state**'));
};
const step32 = () => section(body(), '## NEW Step 3.2 — User-validation closure');
const step34 = () => section(body(), '## NEW Step 3.4 — Gate inflection prompt');

describe('archive body: Step 3 named edit (task 2.1)', () => {
  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: Step 3 no longer asks about validation tasks
  it('Step 3 excludes every unchecked (User-validation task from its count and names the edit', () => {
    const s = step3();
    expect(s).toContain('Exclude every unchecked task carrying the `(User-validation` marker from the count');
    expect(s).toContain('Step 3.2 owns those');
    expect(s).toContain("orbit named edit, per `orbit-archive-modifications`' `User-validation closure at the archive seam`");
    // Every other unchecked task still prompts, unchanged.
    expect(s).toContain('**If incomplete tasks found:**');
    expect(s).toContain('Use **AskUserQuestion tool** to confirm user wants to proceed');
  });
});

describe('archive body: Step 3.2 user-validation closure (task 2.2)', () => {
  it('runs after Step 3 and before Step 3.4, ahead of the move', () => {
    const b = body();
    expect(b.indexOf('## NEW Step 3.2')).toBeGreaterThan(b.indexOf('3. **Check task completion status**'));
    expect(b.indexOf('## NEW Step 3.2')).toBeLessThan(b.indexOf('## NEW Step 3.4'));
  });

  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: An observed validation is closed with its evidence
  it('OBSERVED checks the box with a one-line evidence note and writes no deferral', () => {
    const s = step32();
    expect(s).toMatch(/\*\*OBSERVED\*\* — the validation has happened[^\n]*Check the box and append to the task line a one-line note naming the evidence[^\n]*No deferral entry\./);
    expect(s).toContain('whether or not an apply emit declared it');
  });

  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: An available but unperformed validation is deferred with its reason
  it('DEFERRED covers both after-shipping and could-have-run, and `why` says which', () => {
    const s = step32();
    expect(s).toContain('it can happen only after the change ships (a merge, a later stage, a later session), OR it could have happened and has not');
    expect(s).toContain('compose a `deferred_validations` entry `{task, why, when, where}`');
    expect(s).toContain('`why` saying honestly which case it is');
    expect(s).toContain('A task whose assertion is about state that exists only AFTER this step — the baseline after sync, the archived directory, or the archive emit — is DEFERRED here');
  });

  it('briefs before the move as a report, never a prompt, and states the post-move recovery', () => {
    const s = step32();
    expect(s).toContain('**BRIEF the user before the move**');
    expect(s).toContain('The brief is a REPORT, not a prompt: it asks nothing, and halting stays the user\'s, by aborting');
    expect(s).toContain('re-run the emit against the archived directory — NEVER repeat the sync or the move');
  });

  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: A marked line outside every task group is refused before the move
  it('reports an id-less, ungrouped or duplicated-id marked task to the user before the move', () => {
    const s = step32();
    expect(s).toContain('A marked task with no id, in no `## ` group, or with an id another task line carries (cases 2, 3 and 8), or a `tasks.md` that cannot be read, is REPORTED to the user, who repairs `tasks.md` before the archive proceeds, or aborts');
  });

  it('carries the DEFERRAL REFUSALS production once, as a checked mirror naming its owner', () => {
    const s = step32();
    expect(s).toContain('```\n' + DEFERRAL_REFUSALS + '\n```');
    expect(s).toContain("CHECKED MIRROR of the production `orbit-archive-modifications`' `User-validation closure at the archive seam` states once");
    expect(body().split(DEFERRAL_REFUSALS).length - 1).toBe(1);
  });
});

describe('archive body: Step 3.4 widened (task 2.3)', () => {
  // @scenario text orbit-engine-gates :: Inflection-prompt override contract :: An unapplied change's proposal gate speaks at archive
  it('reads every reviewed row, lists each not passed and not superseded in ONE prompt, and points at the owner', () => {
    const s = step34();
    expect(s).toContain('read EVERY `gates[]` row whose `kind` is `reviewed`');
    expect(s).toContain('LIST each one whose `state` is not `passed` and whose `superseded` field is not `true`');
    expect(s).toContain("`orbit-engine-gates`' `Inflection-prompt override contract`'s, which this body points at rather than restates");
    expect(s).toContain('fire ONE inflection prompt');
    expect(s).not.toContain('`id: "review-system"`');
  });

  // @scenario text orbit-engine-gates :: Inflection-prompt override contract :: Spend is shown, never decisive
  it('MAY show spend and never branches on it', () => {
    expect(step34()).toContain('its `independentSpend` MAY be shown; it never decides whether a gate is listed');
  });

  // @scenario text orbit-engine-gates :: Inflection-prompt override contract :: A superseded gate stays silent at archive
  it('fires no prompt when no gate is listed', () => {
    expect(step34()).toContain('When no gate is listed (every reviewed gate passed or superseded, or the schema declares none), proceed without prompting');
  });

  // @scenario text orbit-archive-modifications :: Archive run summary written :: Two gates proceeded past, two entries
  it('records one continuation entry per listed gate', () => {
    const s = step34();
    expect(s).toContain('ONE PER LISTED GATE');
    expect(s).toContain('For EACH listed gate, compose a `judgements` entry `{kind: "continuation", disposition: "proceed", gate: <id>, gate_state: <state>, gate_reason: <reason>}`');
  });
});

describe('archive body: completion readout (task 2.4)', () => {
  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: A validation possible only after shipping is deferred and printed
  it('prints one line per deferral', () => {
    expect(body()).toContain('One line per Step 3.2 deferral (orbit, rc10): `deferred: <task> — <why>; when <when>, where <where>`');
  });
});

describe('bulk archive: per-change user-validation closure (task 2.6)', () => {
  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: Bulk archive disposes per change
  it('excludes marked tasks from its own count and runs Step 3.2 per change before sync and move', () => {
    const b = bulk();
    expect(b).toContain('excluding every unchecked task carrying the `(User-validation` marker');
    expect(b).toContain('so a change whose only unchecked tasks carry the marker is never classed incomplete or offered for skipping');
    const s = section(b, '## Per-change user-validation closure');
    expect(s).toContain("before its fingerprint check, its Step 8a sync and its Step 8b move, run `orbit-archive-change`'s Step 3.2 for that change");
    expect(s).toContain("BRIEF that change's dispositions in chat right there, BEFORE its sync and move");
    expect(s).toContain('repeat them in the Step 9 **Bulk Archive Complete** summary');
    expect(s).toContain('```\n' + DEFERRAL_REFUSALS + '\n```');
    expect(b.indexOf('## Per-change user-validation closure')).toBeLessThan(b.indexOf('## Per-change base-fingerprint check'));
  });

  // @scenario text orbit-archive-modifications :: User-validation closure at the archive seam :: Bulk archive disposes per change
  it('writes each change\'s archive emit after its move, carrying its deferrals', () => {
    const s = section(bulk(), '## Per-change archive emit');
    expect(s).toContain("After each change's Step 8b move, write that change's archive run summary exactly as `orbit-archive-change`'s Step 5.5 does");
    expect(s).toContain('its Step 3.2 `deferred_validations`');
    expect(s).toContain('orbit emit archive --change <name> --payload <payload-file>');
    expect(bulk()).not.toContain('each inner `/orbit:archive` invocation emits');
  });
});

// ---------------------------------------------------------------------------
// Tasks 4.2 and 4.3: the fixture runs, read through the same status computation the body reads.
// ---------------------------------------------------------------------------

let root: string;
function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}
function makeChange(tasks: string): void {
  write('orbit/changes/c1/proposal.md', '# Proposal\n\n## Why\nw\n');
  write('orbit/changes/c1/design.md', '# Design\n');
  write('orbit/changes/c1/specs/cap/spec.md', '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  write('orbit/changes/c1/tasks.md', tasks);
  write('orbit/changes/c1/.openspec.yaml', 'schema: spec-driven\nschema_version: 5\n');
}
/** Step 3.4's selection, as the body states it over the status rows. */
const listed = () =>
  formatChangeStatus(loadChangeContext(root, 'c1'))
    .gates.filter(g => g.kind === 'reviewed' && g.state !== 'passed' && (g as { superseded?: boolean }).superseded !== true)
    .map(g => ({ id: g.id, state: g.state }));

describe('fixture runs (tasks 4.2, 4.3)', () => {
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-rc10-'));
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  // @scenario behaviour orbit-engine-gates :: Inflection-prompt override contract :: An unapplied change's proposal gate speaks at archive
  it("4.2 rc03a's shape: the rows Step 3.4 lists are exactly review-proposal and review-system", () => {
    makeChange('# Tasks\n\n## 1. G\n\n- [ ] 1.1 do\n');
    const rows = formatChangeStatus(loadChangeContext(root, 'c1')).gates;
    expect(rows.map(g => [g.id, g.state])).toEqual([
      ['review-proposal', 'unpassed'],
      ['apply', 'ready'],
      ['review-system', 'blocked'],
    ]);
    expect(listed()).toEqual([
      { id: 'review-proposal', state: 'unpassed' },
      { id: 'review-system', state: 'blocked' },
    ]);
    expect(rows.find(g => g.id === 'review-system')!.reason).toContain('apply');
  });

  // @scenario behaviour orbit-engine-gates :: Inflection-prompt override contract :: A superseded gate stays silent at archive
  it('a superseded review-proposal is not listed once apply has passed', () => {
    makeChange('# Tasks\n\n## 1. G\n\n- [x] 1.1 do\n');
    const rp = formatChangeStatus(loadChangeContext(root, 'c1')).gates.find(g => g.id === 'review-proposal') as { state: string; superseded?: boolean };
    expect(rp.state).not.toBe('passed');
    expect(rp.superseded).toBe(true);
    expect(listed().map(g => g.id)).toEqual(['review-system']);
  });

  it("4.3 Case 3(1): a passed-for-flow apply gate leaves the marked task to Step 3.2 alone", () => {
    makeChange('# Tasks\n\n## 1. G\n\n- [x] 1.1 do\n- [ ] 1.2 (User-validation) observe it after shipping\n');
    composeAndWriteEmit('apply', { change: 'c1' }, { user_validation_tasks: ['1.2'], consent: 'user-invoked', model: null }, { projectRoot: root });
    const apply = formatChangeStatus(loadChangeContext(root, 'c1')).gates.find(g => g.id === 'apply')!;
    expect(apply.state).toBe('passed');
    // Step 3's count, as the body states it: unchecked tasks minus those carrying the marker.
    const unchecked = fs.readFileSync(path.join(root, 'orbit/changes/c1/tasks.md'), 'utf-8').split('\n').filter(l => /^\s*- \[ \]/.test(l));
    expect(unchecked.filter(l => !l.includes('(User-validation'))).toEqual([]);
    expect(step3()).toContain('Exclude every unchecked task carrying the `(User-validation` marker from the count');
    // Only Step 3.2 addresses it: archived without a deferral, the write gate refuses naming it.
    fs.mkdirSync(path.join(root, 'orbit/changes/archive'), { recursive: true });
    fs.renameSync(path.join(root, 'orbit/changes/c1'), path.join(root, 'orbit/changes/archive/2026-10-11-c1'));
    const payload = { final_assessment: 'Archived c1.', archive_path: 'orbit/changes/archive/2026-10-11-c1/', model: null };
    expect(() => composeAndWriteEmit('archive', { change: 'c1' }, payload, { projectRoot: root })).toThrow(/'1\.2' has no deferral/);
    expect(() =>
      composeAndWriteEmit(
        'archive',
        { change: 'c1' },
        { ...payload, deferred_validations: [{ task: '1.2', why: 'observable only after merge', when: 'the next archive', where: 'the next change' }] },
        { projectRoot: root }
      )
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Task 3.1: carried scenarios of `Archive summary schema reference ships with the skill` and
// `Archive run summary written` that no earlier test asserted.
// ---------------------------------------------------------------------------

describe('archive schema reference and body (carried scenarios)', () => {
  const ref = () => (getArchiveChangeSkillTemplate().references ?? []).find(r => r.name === 'archive-summary-schema.md')!.content;

  // @scenario text orbit-archive-modifications :: Archive summary schema reference ships with the skill :: Body cite resolves
  it('the body cites the reference by the path the skill ships it at', () => {
    expect(body()).toContain('`references/archive-summary-schema.md`');
    expect((getArchiveChangeSkillTemplate().references ?? []).map(r => r.name)).toContain('archive-summary-schema.md');
  });

  // @scenario text orbit-archive-modifications :: Archive summary schema reference ships with the skill :: The judgement record is documented in the shipped reference
  it('documents the judgements array, both entry shapes, and a field note', () => {
    const r = ref();
    for (const k of ['"kind": "readiness"', '"formed_against"', '"disposition"', '"reasoning"', '"ratified_by"', '"accepted"', '"kind": "continuation"', '"gate"', '"gate_state"', '"gate_reason"']) {
      expect(r, k).toContain(k);
    }
    expect(r).toContain('- **`judgements`** (rc04a)');
  });

  // @scenario text orbit-archive-modifications :: Archive summary schema reference ships with the skill :: The deferral record is documented in the shipped reference
  it('documents deferred_validations with its four keys, a field note and a json example', () => {
    const r = ref();
    expect(r).toContain('"deferred_validations": [\n    { "task": "<task id>", "why": ');
    expect(r).toContain('- **`deferred_validations`** (rc10)');
    const example = r.slice(r.indexOf('```json example archived'));
    expect(example).toContain('"deferred_validations": [');
    expect(example).not.toContain('user-validation handoff');
    expect(r).toContain('"gate_state": "<unpassed|stale|blocked>"');
  });

  // @scenario text orbit-archive-modifications :: Archive run summary written :: not-ready does not block
  it('the body says a not-ready readiness does not block', () => {
    expect(body()).toContain('It does NOT block — the seam already carries consent, gate and audit prompts for stopping');
  });
});
