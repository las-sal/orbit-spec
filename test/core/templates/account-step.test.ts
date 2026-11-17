import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import {
  ACCOUNT_EXAMPLES,
  ACCOUNT_STEP,
  ACCOUNT_STEP_BASIC,
  ACCOUNT_STEP_REFERENCE_NAME,
  ACCOUNT_WALK_STEP,
  ACCOUNT_WALK_STEP_BASIC,
  ACCOUNT_WALK_STEP_REFERENCE_NAME,
  COMMIT_STEP_BASIC,
} from '../../../src/core/disciplines.js';
import { ACCOUNT_PAYLOAD_FIELDS } from '../../../src/core/account.js';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';

/**
 * change-account, task 3.4, retargeted by once-per-session-detail task 2.2 — the account steps' carriage
 * (`orbit-decision-records`' `Each change carries one account, written when apply is complete`: "a test holds each body
 * carrying its basic content and each reference the fields and the invocation"): the apply body carries
 * `ACCOUNT_STEP_BASIC` and the address-reviews body `ACCOUNT_WALK_STEP_BASIC`, each exactly once; each skill's reference
 * is its title plus the full step, naming every field the write gate accepts and the `orbit emit account` invocation
 * with `replaces`; no other body or skill carries either; and each step's example payload is accepted by the write gate
 * unchanged.
 */

const skills = getSkillTemplates();
const skill = (dir: string) => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template;
};
const body = (dir: string): string => skill(dir).instructions;
const reference = (dir: string, name: string): string => {
  const r = (skill(dir).references ?? []).find((x) => x.name === name);
  if (!r) throw new Error(`${dir} ships no references/${name}`);
  return r.content;
};
const count = (hay: string, needle: string): number => hay.split(needle).length - 1;

/**
 * once-per-session-detail, task 2.2 — each body carries its step's BASIC CONTENT and the skill's reference file the
 * full step (D-opsd-8): the basic content reads the reference every time its moment comes, with no condition of its
 * own; the reference decides every branch.
 */
const STEPS = [
  { name: 'ACCOUNT_STEP', step: ACCOUNT_STEP, basic: ACCOUNT_STEP_BASIC, dir: 'orbit-apply-change', file: ACCOUNT_STEP_REFERENCE_NAME, title: '# Reference: the account step' },
  { name: 'ACCOUNT_WALK_STEP', step: ACCOUNT_WALK_STEP, basic: ACCOUNT_WALK_STEP_BASIC, dir: 'orbit-address-reviews', file: ACCOUNT_WALK_STEP_REFERENCE_NAME, title: '# Reference: the account step of a walk (step 7)' },
] as const;

describe('the account steps: basic content in the apply and address-reviews bodies, the full step in a reference', () => {
  for (const { name, step, dir, file, title } of STEPS) {
    it(`${name} names every field the write gate accepts, and the invocation with replaces, in ${dir}'s references/${file}`, () => {
      const ref = reference(dir, file);
      expect(ref).toBe(`${title}\n\n${step}\n`);
      for (const f of ACCOUNT_PAYLOAD_FIELDS) expect(ref, f).toContain(`- \`${f}\` — `);
      expect(ref).toContain('`orbit emit account --change <name> --payload <file>`');
      expect(ref).toContain('`replaces`');
      expect(ref).toContain('`model`');
      // A change citing no architecture doc states its deviations against the proposal's scope.
      expect(ref).toContain("for a change citing none, the proposal's scope");
    });
  }

  // @scenario text orbit-decision-records :: Each change carries one account, written when apply is complete :: The apply body sends the agent to the account reference at the session's end
  it('the apply body carries ACCOUNT_STEP_BASIC once, before the run-summary emit and the commit step, and its all_done branch runs the Account step whether or not an account exists', () => {
    const b = body('orbit-apply-change');
    expect(count(b, ACCOUNT_STEP_BASIC)).toBe(1);
    expect(ACCOUNT_STEP_BASIC).toBe(
      "## Account step (before the run summary — `orbit-decision-records`' `Each change carries one account, written when apply is complete`)\n\n" +
        "At the session's end, BEFORE the run-summary emit (or, when the session writes no run summary, before the completion readout), read `references/account-step.md` and follow it: it says whether this session writes the account, a replacement of it, or none, and how."
    );
    expect(b.indexOf(ACCOUNT_STEP_BASIC)).toBeLessThan(b.indexOf('## Run-summary emit'));
    expect(b.indexOf(ACCOUNT_STEP_BASIC)).toBeLessThan(b.indexOf(COMMIT_STEP_BASIC));
    expect(b).toMatch(/If `state: "all_done"`: first run the Account step below — it writes a missing account, or replaces the latest one when the work done since it was written changed what it says, so read that account and the change's trail since it before deciding/);
    expect(b).not.toMatch(/when the change has no account, write it first/);
    // The full step left the body; the reference carries it whole.
    expect(b).not.toContain(ACCOUNT_STEP);
    expect(b).not.toContain(ACCOUNT_WALK_STEP_BASIC);
  });

  // @scenario text orbit-decision-records :: Each change carries one account, written when apply is complete :: The walk sends the agent to its reference after its logs
  it('the address-reviews body carries ACCOUNT_WALK_STEP_BASIC once as step 7, after the run-summary persist step and before the commit step', () => {
    const b = body('orbit-address-reviews');
    expect(count(b, ACCOUNT_WALK_STEP_BASIC)).toBe(1);
    expect(ACCOUNT_WALK_STEP_BASIC).toBe(
      "### 7. Replace the account when a fix changed it (`orbit-decision-records`' `Each change carries one account, written when apply is complete`)\n\n" +
        "After the logs are written, read `references/account-walk-step.md` and follow it: it says whether this walk writes a replacement of the change's account, or none, and how."
    );
    expect(b.indexOf(ACCOUNT_WALK_STEP_BASIC)).toBeGreaterThan(b.indexOf('### 6. Persist the run summary'));
    expect(b.indexOf(ACCOUNT_WALK_STEP_BASIC)).toBeLessThan(b.indexOf(COMMIT_STEP_BASIC));
    expect(b).not.toContain(ACCOUNT_WALK_STEP);
    expect(b).not.toContain(ACCOUNT_STEP_BASIC);
  });

  it('each basic content carries no condition of its own: one read at its moment, every branch left to the reference', () => {
    for (const { name, basic } of STEPS) {
      const text = basic.slice(basic.indexOf('\n\n') + 2);
      expect(text.split('\n'), name).toHaveLength(1);
      // A parenthetical places the read (apply's: before the completion readout when no run summary is written); it
      // gates nothing. Outside it, nothing conditions the read.
      expect(text.replace(/\([^)]*\)/g, ''), name).not.toMatch(/\b(if|when|unless|only)\b/i);
      expect(count(text, 'read `references/'), name).toBe(1);
    }
  });

  it("apply's reference keeps the completion rule naming this session's user_validation_tasks (a first declared handoff)", () => {
    const ref = reference('orbit-apply-change', ACCOUNT_STEP_REFERENCE_NAME);
    expect(ref).toContain(
      "APPLY IS COMPLETE when the change's apply gate passes: every task is checked, or every unchecked one is a declared, marked `(User-validation` handoff (named in this session's `user_validation_tasks`)."
    );
  });

  it('no other body carries either step or either basic content, and no other skill ships either reference', () => {
    for (const s of skills) {
      if (s.dirName === 'orbit-apply-change' || s.dirName === 'orbit-address-reviews') continue;
      for (const { name, step, basic, file } of STEPS) {
        expect(s.template.instructions.includes(step), `${s.dirName} ${name}`).toBe(false);
        expect(s.template.instructions.includes(basic), `${s.dirName} ${name} basic`).toBe(false);
        expect((s.template.references ?? []).some((r) => r.name === file), `${s.dirName} ${file}`).toBe(false);
      }
    }
  });

  it('each step states its rows of the lifecycle table', () => {
    expect(ACCOUNT_STEP).toMatch(/Apply is not complete at the end of the session\*\* → write no account/);
    expect(ACCOUNT_STEP).toMatch(/Apply is complete, and the change has no account\*\* → write it/);
    expect(ACCOUNT_STEP).toMatch(/Apply is complete, and the change has an account\*\*.*write a replacement of it; otherwise write none/);
    expect(ACCOUNT_STEP).toContain('`(User-validation`');
    expect(ACCOUNT_WALK_STEP).toMatch(/A walk of an ACTIVE change that has an account\*\*.*write a replacement of the latest account/);
    expect(ACCOUNT_WALK_STEP).toMatch(/A walk that resolves any finding by reopening tasks\*\*.*write no account, not even for its other fixes/);
    expect(ACCOUNT_WALK_STEP).toMatch(/and no finding was resolved by reopening tasks\*\* → write a replacement/);
    expect(ACCOUNT_WALK_STEP).toMatch(/a walk of an archived change.*→ write no account/);
  });
});

describe("each step's example payload is accepted by orbit emit account", () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-account-step-'));
    fs.mkdirSync(path.join(root, 'orbit/changes/foo'), { recursive: true });
    fs.writeFileSync(path.join(root, 'orbit/changes/foo/proposal.md'), '# P\n');
  });
  afterEach(() => {
    vi.useRealTimers();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('the apply example writes the first account; the walk example replaces it', () => {
    vi.useFakeTimers();
    // The walk example names the account it replaces by the token this write draws.
    const replaced = ACCOUNT_EXAMPLES.walk.replaces;
    const ts = replaced.replace(/^account-/, '').replace(/\.json$/, '').replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z');
    vi.setSystemTime(new Date(ts));
    const first = composeAndWriteEmit('account', { change: 'foo' }, { ...ACCOUNT_EXAMPLES.apply }, { projectRoot: root });
    expect(path.basename(first.path)).toBe(replaced);
    const second = composeAndWriteEmit('account', { change: 'foo' }, { ...ACCOUNT_EXAMPLES.walk }, { projectRoot: root });
    expect(second.emit.replaces).toBe(replaced);
  });
});
