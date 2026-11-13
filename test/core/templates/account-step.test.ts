import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { ACCOUNT_EXAMPLES, ACCOUNT_STEP, ACCOUNT_WALK_STEP, COMMIT_STEP } from '../../../src/core/disciplines.js';
import { ACCOUNT_PAYLOAD_FIELDS } from '../../../src/core/account.js';
import { composeAndWriteEmit } from '../../../src/core/emit-composition.js';

/**
 * change-account, task 3.4 — the account steps' carriage (`orbit-decision-records`' `Each change carries one
 * account, written when apply is complete`: "a test holds each body carrying the fields and the invocation"):
 * the apply body carries `ACCOUNT_STEP` and the address-reviews body `ACCOUNT_WALK_STEP`, each exactly once,
 * each naming every field the write gate accepts and the `orbit emit account` invocation with `replaces`; no
 * other body carries either; and each step's example payload is accepted by the write gate unchanged.
 */

const skills = getSkillTemplates();
const body = (dir: string): string => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template.instructions;
};
const count = (hay: string, needle: string): number => hay.split(needle).length - 1;

describe('the account steps are carried by the apply and address-reviews bodies', () => {
  for (const [name, step] of [['ACCOUNT_STEP', ACCOUNT_STEP], ['ACCOUNT_WALK_STEP', ACCOUNT_WALK_STEP]] as const) {
    it(`${name} names every field the write gate accepts, and the invocation with replaces`, () => {
      for (const f of ACCOUNT_PAYLOAD_FIELDS) expect(step, f).toContain(`- \`${f}\` — `);
      expect(step).toContain('`orbit emit account --change <name> --payload <file>`');
      expect(step).toContain('`replaces`');
      expect(step).toContain('`model`');
      // A change citing no architecture doc states its deviations against the proposal's scope.
      expect(step).toContain("for a change citing none, the proposal's scope");
    });
  }

  it('the apply body carries ACCOUNT_STEP once, before the run-summary emit and the commit step, and its all_done branch writes a missing account', () => {
    const b = body('orbit-apply-change');
    expect(count(b, ACCOUNT_STEP)).toBe(1);
    expect(b.indexOf(ACCOUNT_STEP)).toBeLessThan(b.indexOf('## Run-summary emit'));
    expect(b.indexOf(ACCOUNT_STEP)).toBeLessThan(b.indexOf(COMMIT_STEP));
    expect(b).toMatch(/If `state: "all_done"`: when the change has no account, write it first \(the Account step below\)/);
    expect(b).not.toContain(ACCOUNT_WALK_STEP);
  });

  it('the address-reviews body carries ACCOUNT_WALK_STEP once, after the run-summary persist step and before the commit step', () => {
    const b = body('orbit-address-reviews');
    expect(count(b, ACCOUNT_WALK_STEP)).toBe(1);
    expect(b.indexOf(ACCOUNT_WALK_STEP)).toBeGreaterThan(b.indexOf('### 6. Persist the run summary'));
    expect(b.indexOf(ACCOUNT_WALK_STEP)).toBeLessThan(b.indexOf(COMMIT_STEP));
    expect(b).not.toContain(ACCOUNT_STEP);
  });

  it('no other body carries either step', () => {
    for (const s of skills) {
      if (s.dirName === 'orbit-apply-change' || s.dirName === 'orbit-address-reviews') continue;
      expect(s.template.instructions.includes(ACCOUNT_STEP), s.dirName).toBe(false);
      expect(s.template.instructions.includes(ACCOUNT_WALK_STEP), s.dirName).toBe(false);
    }
  });

  it('each step states its rows of the lifecycle table', () => {
    expect(ACCOUNT_STEP).toMatch(/Apply is not complete at the end of the session\*\* → write no account/);
    expect(ACCOUNT_STEP).toMatch(/Apply is complete, and the change has no account\*\* → write it/);
    expect(ACCOUNT_STEP).toMatch(/Apply is complete, and the change has an account\*\*.*write a replacement of it; otherwise write none/);
    expect(ACCOUNT_STEP).toContain('`(User-validation`');
    expect(ACCOUNT_WALK_STEP).toMatch(/A walk of an ACTIVE change that has an account\*\*.*write a replacement of the latest account/);
    expect(ACCOUNT_WALK_STEP).toMatch(/A finding resolved by reopening tasks\*\*.*write no account/);
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
