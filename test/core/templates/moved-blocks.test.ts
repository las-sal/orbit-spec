import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import {
  ACCOUNT_STEP,
  ACCOUNT_WALK_STEP,
  CHAIN_END_STEP,
  CHAIN_END_STEP_BASIC,
  CHAIN_END_STEP_SKILLS,
  COMMIT_STEP,
  COMMIT_STEP_BASIC,
  COMMIT_STEP_SKILLS,
} from '../../../src/core/disciplines.js';
import { APPLY_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/apply-change.js';
import { ADDRESS_REVIEWS_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/address-reviews.js';
import { AUDIT_DRIFT_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/audit-drift.js';
import { CONTINUE_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/continue-change.js';
import { FF_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/ff-change.js';
import { NEW_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/new-change.js';
import { REVIEW_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/review.js';
import { VERIFY_RUN_SUMMARY_EMIT } from '../../../src/core/templates/workflows/verify-change.js';
import {
  ARCHIVE_RUN_SUMMARY_EMIT,
  FINGERPRINT_DIVERGENCE_STEP,
  GATE_INFLECTION_STEP,
  SIGNOFF_HOLD_STEP,
} from '../../../src/core/templates/workflows/archive-change.js';
import { ARCHITECT_RUN_SUMMARY_EMIT, PROGRAM_SIGNOFF_HOLD_BASIC, PROGRAM_SIGNOFF_STEP } from '../../../src/core/templates/workflows/architect.js';
import { PROPOSE_RUN_SUMMARY_EMIT, SIZE_BRIEF_STEP } from '../../../src/core/templates/workflows/propose.js';
import {
  ARC_DONE_ACT,
  FF_PR_POSITION,
  PROPOSE_PR_POSITION,
  WHERE_EACH_PHASE_RUNS_SELECTION,
} from '../../../src/core/templates/workflows/pr-choreography.js';

/**
 * conditional-steps (reduce-orbit-phase1) — the moved blocks, held to the bytes they had before any template was edited.
 *
 * Task 1.1 recorded the sha256 of each block as the templates composed it at 84ccb682, before the change edited them:
 * each block runs to its last non-blank line (trailing newlines dropped); the PR Position blocks run from the bold
 * `**Position` label up to, not including, the line beginning "Read the RESOLVED regime"; architect 5.5's arc-done act
 * from "When arc-done, run" to the end of its paragraph, before `### 6. Out of scope`.
 *
 * Task 3.5 holds each reference file to its block, each basic content byte-equal across its carrying bodies, the
 * handoff rule on the seven basic contents that follow a command's result (design §3), every body naming the reference
 * files its skill ships (one level deep), and `pr-choreography.md`'s `Where each phase runs` section.
 */
const RECORDED: Record<string, string> = {
  COMMIT_STEP: 'c3dd4e9c3cd1dd33b2d9b8b9cc3eb0ffec1c30122602c9190e940836d455bce6',
  CHAIN_END_STEP: 'cd1336f31d65b17f1a401d3b258d0e05285d02835bbc08e0cd75e7880d5ed9f5',
  SIGNOFF_HOLD_STEP: 'ca2d020ab05ce7068dc3336f52a9bec72ff1d91edad532fd5a45745147e58660',
  PROGRAM_SIGNOFF_STEP: '8c557d6aabbe4cd136e93446e0d8193a1c13483b9df9497bbd832b3574491b91',
  ARCHIVE_GATE_INFLECTION: '5bcb96900cea7ce12101bf486379f652e1d33817562ddeae9bf2590aec114da3',
  ARCHIVE_FINGERPRINT_DIVERGENCE: '237b7a23c46852ba3a17ef058f4d9fe709cf4a8facc62582474ae2152a0aaa0e',
  PROPOSE_SIZE_BRIEF: '3560215a8f9edee9add41bac0b3d237161fe8bba704e2f79b45a9fde278ee4a9',
  PROPOSE_PR_POSITION: 'af2a7f6ef739175c0c8574e050491b8223ec90c8fd24eac17ca7ef75bccae1c7',
  FF_PR_POSITION: '7a0f252718c34cb9fdffeff9882b3012dbe9623f9bef18bf3590254e20854f18',
  ARCHITECT_ARC_DONE_ACT: '6564c39dbf3725d80347be89cdbb6e6a325e2b3ea46bf5e91798252766384bc7',
  // once-per-session-detail (reduce-orbit-phase1), task 1.1: recorded from the skills generated at 9c43eee3, before
  // any template was edited. The two account steps are their constants; each emit section runs from its heading to the
  // next heading of the same or a higher level, to its last non-blank line (trailing newlines dropped).
  ACCOUNT_STEP: 'dde4faf974d40c5bd8c34a8a38511f064a33d82f66648513267ba09d9480dda4',
  ACCOUNT_WALK_STEP: '8b4eb2fbc3e5fd17be3e67610dbba72aa49b9ea4c7bc3cbf6a554fd16f95428c',
  APPLY_RUN_SUMMARY_EMIT: 'efcd0a22dd87a825b3b5f75cf63b597a632197451c606b49f1e9a4efe9374f73',
  ARCHIVE_RUN_SUMMARY_EMIT: '67b164fac5fd8149295ce6622b9927633d957d2224ca6edd52aaf05d7dde1b94',
  ARCHITECT_RUN_SUMMARY_EMIT: '6a595f0017458bab0cbb9a46fe5887ab52d2ddb4e61626f7f56b1d67dc5e204d',
  REVIEW_RUN_SUMMARY_EMIT: '800cfb192b6b380956f951aff0e5b434df382307a3656f2570000c714043cb56',
  VERIFY_RUN_SUMMARY_EMIT: 'aceb2775860d09d9fb46fd3006e103837606df0f791d0530340791799d0642d3',
  PROPOSE_RUN_SUMMARY_EMIT: 'a5e52c9488c496f247e36207e32579a1a88f5fc4e447d63dcb5a29354cb49b80',
  ADDRESS_REVIEWS_RUN_SUMMARY_EMIT: '0bbd21e0d51afdbcea6888806fd2d8e2bd60b1bb854307e486034c426fdc0b9a',
  FF_RUN_SUMMARY_EMIT: '4ec14a8791430ae8c6fbeb03e88d1527e8a61666aa72e1b1c33618e269f29fd2',
  CONTINUE_RUN_SUMMARY_EMIT: '72f8fe69124f964c99668afa9afebabc9bb90004639f2ff5a6594aae900e5906',
  NEW_RUN_SUMMARY_EMIT: '34dd0abbb17a964a4ad83449283a89b4484982942850d9b59b85d2c62f4b0d3c',
  AUDIT_DRIFT_RUN_SUMMARY_EMIT: 'e778c7de3acbd0a89e58b503e18d2719bc5baa64f9f339fca192e3b4f20c7f24',
};

const sha = (s: string): string => createHash('sha256').update(s).digest('hex');
const skills = getSkillTemplates();
const skill = (dir: string) => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template;
};
const reference = (dir: string, name: string): string => {
  const r = (skill(dir).references ?? []).find((x) => x.name === name);
  if (!r) throw new Error(`no reference ${dir}/references/${name}`);
  return r.content;
};
/** A body's section: from its heading to the next heading of the same or a higher level. */
const section = (text: string, heading: string): string => {
  const at = text.indexOf(heading);
  if (at < 0) throw new Error(`no heading ${heading}`);
  const level = heading.match(/^#+/)?.[0] ?? '##';
  const rest = text.slice(at + heading.length);
  const next = rest.search(new RegExp(`\\n#{1,${level.length}} `));
  return heading + (next < 0 ? rest : rest.slice(0, next));
};

/** Each moved block: its recorded key, its constant, and the reference file(s) that carry it. */
const MOVES: Array<{ key: string; block: string; files: Array<[string, string]>; title?: string }> = [
  { key: 'COMMIT_STEP', block: COMMIT_STEP, files: COMMIT_STEP_SKILLS.map((d) => [d, 'commit-step.md']), title: '# Reference: the commit step' },
  { key: 'CHAIN_END_STEP', block: CHAIN_END_STEP, files: CHAIN_END_STEP_SKILLS.map((d) => [d, 'chain-end-step.md']), title: '# Reference: the chain end step' },
  { key: 'SIGNOFF_HOLD_STEP', block: SIGNOFF_HOLD_STEP, files: [['orbit-archive-change', 'signoff-hold.md']], title: '# Reference: the sign-off hold (archive Step 3.7)' },
  { key: 'PROGRAM_SIGNOFF_STEP', block: PROGRAM_SIGNOFF_STEP, files: [['orbit-architect', 'program-signoff.md']], title: "# Reference: the program's save and sign-off (architect Step 5.4)" },
  { key: 'ARCHIVE_GATE_INFLECTION', block: GATE_INFLECTION_STEP, files: [['orbit-archive-change', 'gate-inflection.md']], title: '# Reference: the gate inflection prompt (archive Step 3.4)' },
  { key: 'ARCHIVE_FINGERPRINT_DIVERGENCE', block: FINGERPRINT_DIVERGENCE_STEP, files: [['orbit-archive-change', 'fingerprint-divergence.md']], title: '# Reference: the base-fingerprint divergence check (archive Step 3.45)' },
  { key: 'PROPOSE_SIZE_BRIEF', block: SIZE_BRIEF_STEP, files: [['orbit-propose', 'size-brief.md']], title: '# Reference: the size brief after generation' },
  { key: 'PROPOSE_PR_POSITION', block: PROPOSE_PR_POSITION, files: [['orbit-propose', 'pr-choreography.md'], ['orbit-ff-change', 'pr-choreography.md']] },
  { key: 'FF_PR_POSITION', block: FF_PR_POSITION, files: [['orbit-propose', 'pr-choreography.md'], ['orbit-ff-change', 'pr-choreography.md']] },
  { key: 'ARCHITECT_ARC_DONE_ACT', block: ARC_DONE_ACT, files: [['orbit-architect', 'pr-resolution.md']] },
  // once-per-session-detail (task 2.2): the account steps.
  { key: 'ACCOUNT_STEP', block: ACCOUNT_STEP, files: [['orbit-apply-change', 'account-step.md']], title: '# Reference: the account step' },
  { key: 'ACCOUNT_WALK_STEP', block: ACCOUNT_WALK_STEP, files: [['orbit-address-reviews', 'account-walk-step.md']], title: '# Reference: the account step of a walk (step 7)' },  // once-per-session-detail (task 3.3): each emit section, whole, in its skill's run-summary-emit.md.
  { key: 'APPLY_RUN_SUMMARY_EMIT', block: APPLY_RUN_SUMMARY_EMIT, files: [['orbit-apply-change', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'ARCHIVE_RUN_SUMMARY_EMIT', block: ARCHIVE_RUN_SUMMARY_EMIT, files: [['orbit-archive-change', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'ARCHITECT_RUN_SUMMARY_EMIT', block: ARCHITECT_RUN_SUMMARY_EMIT, files: [['orbit-architect', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'REVIEW_RUN_SUMMARY_EMIT', block: REVIEW_RUN_SUMMARY_EMIT, files: [['orbit-review', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'VERIFY_RUN_SUMMARY_EMIT', block: VERIFY_RUN_SUMMARY_EMIT, files: [['orbit-verify-change', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'PROPOSE_RUN_SUMMARY_EMIT', block: PROPOSE_RUN_SUMMARY_EMIT, files: [['orbit-propose', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'ADDRESS_REVIEWS_RUN_SUMMARY_EMIT', block: ADDRESS_REVIEWS_RUN_SUMMARY_EMIT, files: [['orbit-address-reviews', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'FF_RUN_SUMMARY_EMIT', block: FF_RUN_SUMMARY_EMIT, files: [['orbit-ff-change', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'CONTINUE_RUN_SUMMARY_EMIT', block: CONTINUE_RUN_SUMMARY_EMIT, files: [['orbit-continue-change', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'NEW_RUN_SUMMARY_EMIT', block: NEW_RUN_SUMMARY_EMIT, files: [['orbit-new-change', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
  { key: 'AUDIT_DRIFT_RUN_SUMMARY_EMIT', block: AUDIT_DRIFT_RUN_SUMMARY_EMIT, files: [['orbit-audit-drift', 'run-summary-emit.md']], title: '# Reference: the run-summary emit step' },
];

/** The handoff rule's seven pointers (design §3): each basic content that follows a command's result. */
function handoffPointers(): Array<[string, string]> {
  const archive = skill('orbit-archive-change').instructions;
  const propose = skill('orbit-propose').instructions;
  return [
    ['commit step', COMMIT_STEP_BASIC],
    ['chain end step', CHAIN_END_STEP_BASIC],
    ['archive Step 3.4', section(archive, '## NEW Step 3.4 — Gate inflection prompt')],
    ['archive Step 3.45', section(archive, '## NEW Step 3.45 — Base-fingerprint divergence check')],
    ['archive Step 3.7', section(archive, '## NEW Step 3.7 — The sign-off hold')],
    ['architect 5.4 hold', PROGRAM_SIGNOFF_HOLD_BASIC],
    ['size brief', section(propose, '## Size brief after generation')],
  ];
}

/**
 * Named exception to "one level deep", predating conditional-steps: the review skill's external-review prompt references
 * are read from `references/external-handoff.md`, which the body names, not from the body itself. Stage
 * `tighten-bodies` owns RG2's one-level fix and removes this entry.
 */
const TWO_LEVEL: Record<string, string[]> = { 'orbit-review': ['mode-sections.md', 'prompt-template.md'] };

describe('moved blocks: each reference file holds its block, byte-equal to the recorded text (task 3.5)', () => {
  for (const m of MOVES) {
    it(`${m.key} hashes to its recorded sha256 and every carrying reference holds it`, () => {
      expect(sha(m.block), m.key).toBe(RECORDED[m.key]);
      for (const [dir, name] of m.files) {
        const content = reference(dir, name);
        expect(content.split(m.block).length - 1, `${dir}/${name}`).toBe(1);
        if (m.title) expect(content, `${dir}/${name}`).toBe(`${m.title}\n\n${m.block}\n`);
        // The moved block no longer sits in the body (the commit and chain end steps, the sign-off holds, and the
        // archive, size-brief and PR blocks alike).
        expect(skill(dir).instructions.includes(m.block), `${dir} body`).toBe(false);
      }
    });
  }

  it('bulk-archive still carries the sign-off hold whole (D-cs-3)', () => {
    expect(skill('orbit-bulk-archive-change').instructions.split(SIGNOFF_HOLD_STEP).length - 1).toBe(1);
  });

  it('the test fails on a one-byte change to a moved block', () => {
    const changed = COMMIT_STEP.replace('ONE line', 'ONE  line');
    expect(changed).not.toBe(COMMIT_STEP);
    expect(sha(changed)).not.toBe(RECORDED.COMMIT_STEP);
  });
});

describe('moved blocks: the basic contents (task 3.5)', () => {
  it('each basic content is byte-equal across its carrying bodies', () => {
    for (const dir of COMMIT_STEP_SKILLS) expect(skill(dir).instructions.split(COMMIT_STEP_BASIC).length - 1, dir).toBe(1);
    for (const dir of CHAIN_END_STEP_SKILLS) expect(skill(dir).instructions.split(CHAIN_END_STEP_BASIC).length - 1, dir).toBe(1);
    expect(skill('orbit-architect').instructions.split(PROGRAM_SIGNOFF_HOLD_BASIC).length - 1).toBe(1);
  });

  it('each of the seven basic contents that follow a command\'s result points at its reference "from the result you already have"', () => {
    const pointers = handoffPointers();
    expect(pointers).toHaveLength(7);
    for (const [name, text] of pointers) {
      expect(text, name).toMatch(/read `references\/[a-z-]+\.md` and follow it from (the save's outcome and )?the result you already have/);
    }
  });

  it('each body names every reference file its skill ships, one level deep (the pass files by their <mode> pattern)', () => {
    const unnamed: string[] = [];
    for (const s of skills) {
      const body = s.template.instructions;
      for (const r of s.template.references ?? []) {
        if (TWO_LEVEL[s.dirName]?.includes(r.name)) continue;
        const named = body.includes(`references/${r.name}`) || (/^passes-/.test(r.name) && body.includes('references/passes-<mode>.md'));
        if (!named) unnamed.push(`${s.dirName}/references/${r.name}`);
      }
    }
    expect(unnamed).toEqual([]);
    // The exception stays true: those files are reached from the reference the body names.
    const handoff = reference('orbit-review', 'external-handoff.md');
    for (const name of TWO_LEVEL['orbit-review']) expect(handoff, name).toContain(`references/${name}`);
  });

  it("pr-choreography.md opens its `Where each phase runs` section with the selection line, then one subsection per workflow", () => {
    const choreography = reference('orbit-propose', 'pr-choreography.md');
    expect(reference('orbit-ff-change', 'pr-choreography.md')).toBe(choreography);
    expect(choreography).toContain(
      `## Where each phase runs\n\n${WHERE_EACH_PHASE_RUNS_SELECTION}\n\n### In /orbit:propose\n\n${PROPOSE_PR_POSITION}\n\n### In /orbit:ff\n\n${FF_PR_POSITION}\n\n## Phase 1`
    );
    expect(WHERE_EACH_PHASE_RUNS_SELECTION).toBe('Follow only the subsection of the workflow you are running.');
    // Each body's one-line pointer names its own subsection.
    expect(skill('orbit-propose').instructions).toContain('under `### In /orbit:propose`, says where phases 2 and 3 run.');
    expect(skill('orbit-ff-change').instructions).toContain('under `### In /orbit:ff`, says where phases 2 and 3 run.');
  });
});
