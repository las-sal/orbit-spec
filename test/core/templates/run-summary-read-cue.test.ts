import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import {
  RUN_SUMMARY_EMIT_REFERENCE_NAME,
  RUN_SUMMARY_EMIT_SKILLS,
  RUN_SUMMARY_READ_CUE,
} from '../../../src/core/disciplines.js';
import { ADDRESS_REVIEWS_RUN_SUMMARY_EMIT, ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/address-reviews.js';
import { APPLY_RUN_SUMMARY_EMIT, APPLY_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/apply-change.js';
import { ARCHITECT_RUN_SUMMARY_EMIT, ARCHITECT_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/architect.js';
import { ARCHIVE_RUN_SUMMARY_EMIT, ARCHIVE_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/archive-change.js';
import { AUDIT_DRIFT_RUN_SUMMARY_EMIT, AUDIT_DRIFT_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/audit-drift.js';
import { CONTINUE_RUN_SUMMARY_EMIT, CONTINUE_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/continue-change.js';
import { FF_RUN_SUMMARY_EMIT, FF_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/ff-change.js';
import { NEW_RUN_SUMMARY_EMIT, NEW_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/new-change.js';
import { PROPOSE_RUN_SUMMARY_EMIT, PROPOSE_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/propose.js';
import { REVIEW_RUN_SUMMARY_EMIT, REVIEW_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/review.js';
import { VERIFY_RUN_SUMMARY_EMIT, VERIFY_RUN_SUMMARY_EMIT_BASIC } from '../../../src/core/templates/workflows/verify-change.js';

/**
 * once-per-session-detail, task 3.3 — `orbit-run-summary-emit`'s `A body reads its run-summary detail before the
 * session's first run-summary emit`: each of the eleven emit steps in scope keeps when the emit fires, its command and the chat
 * behaviour beside them, and carries the shared READ CUE; its skill ships `references/run-summary-emit.md` holding the
 * emit section whole (byte-equal to the text before the change: `moved-blocks.test.ts` holds each section's sha256).
 */

const skills = getSkillTemplates();
const skill = (dir: string) => {
  const s = skills.find((x) => x.dirName === dir);
  if (!s) throw new Error(`no skill ${dir}`);
  return s.template;
};
const body = (dir: string): string => skill(dir).instructions;
const reference = (dir: string, name: string): string | undefined => (skill(dir).references ?? []).find((r) => r.name === name)?.content;
const emitRef = (dir: string): string => {
  const r = reference(dir, RUN_SUMMARY_EMIT_REFERENCE_NAME);
  if (r === undefined) throw new Error(`${dir} ships no references/${RUN_SUMMARY_EMIT_REFERENCE_NAME}`);
  return r;
};
const count = (hay: string, needle: string): number => hay.split(needle).length - 1;

/** Each skill in scope: its section constant, its body's basic content, and the `orbit emit` command its block opens with. */
const STEPS: Record<(typeof RUN_SUMMARY_EMIT_SKILLS)[number], { section: string; basic: string; command: string }> = {
  'orbit-apply-change': { section: APPLY_RUN_SUMMARY_EMIT, basic: APPLY_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit apply --change <name>' },
  'orbit-archive-change': { section: ARCHIVE_RUN_SUMMARY_EMIT, basic: ARCHIVE_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit archive --change <name>' },
  'orbit-architect': { section: ARCHITECT_RUN_SUMMARY_EMIT, basic: ARCHITECT_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit architect --doc <doc-name>' },
  'orbit-review': { section: REVIEW_RUN_SUMMARY_EMIT, basic: REVIEW_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit review --change <name>' },
  'orbit-verify-change': { section: VERIFY_RUN_SUMMARY_EMIT, basic: VERIFY_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit verify --change <name>' },
  'orbit-propose': { section: PROPOSE_RUN_SUMMARY_EMIT, basic: PROPOSE_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit propose --change <name>' },
  'orbit-address-reviews': { section: ADDRESS_REVIEWS_RUN_SUMMARY_EMIT, basic: ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit address-reviews --change <name>' },
  'orbit-ff-change': { section: FF_RUN_SUMMARY_EMIT, basic: FF_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit ff --change <name>' },
  'orbit-continue-change': { section: CONTINUE_RUN_SUMMARY_EMIT, basic: CONTINUE_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit continue --change <name>' },
  'orbit-new-change': { section: NEW_RUN_SUMMARY_EMIT, basic: NEW_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit new --change <name>' },
  'orbit-audit-drift': { section: AUDIT_DRIFT_RUN_SUMMARY_EMIT, basic: AUDIT_DRIFT_RUN_SUMMARY_EMIT_BASIC, command: 'orbit emit audit-drift --change <name>' },
};

describe('the read cue', () => {
  it('is the two sentences design Decision 3 states, naming the reference file', () => {
    expect(RUN_SUMMARY_READ_CUE).toBe(
      "Before the session's first run-summary emit, read `references/run-summary-emit.md` and follow it to compose the payload: it holds this step whole, with where its fields are documented. Write the payload to a temp file and invoke:"
    );
    expect(RUN_SUMMARY_EMIT_SKILLS).toHaveLength(11);
  });

  // @scenario text orbit-run-summary-emit :: A body reads its run-summary detail before the session's first run-summary emit :: Every emit step in scope carries the read cue
  it('each of the eleven bodies carries the cue once, byte-equal, followed by its command block, and ships run-summary-emit.md', () => {
    for (const dir of RUN_SUMMARY_EMIT_SKILLS) {
      const b = body(dir);
      expect(count(b, RUN_SUMMARY_READ_CUE), dir).toBe(1);
      const after = b.slice(b.indexOf(RUN_SUMMARY_READ_CUE) + RUN_SUMMARY_READ_CUE.length);
      expect(after.startsWith(`\n\n\`\`\`bash\n${STEPS[dir].command}`), dir).toBe(true);
      expect(emitRef(dir), dir).toBeTruthy();
      // The body's emit section is its basic content, carried once.
      expect(count(b, STEPS[dir].basic), dir).toBe(1);
      expect(STEPS[dir].basic, dir).toContain(RUN_SUMMARY_READ_CUE);
    }
  });

  it('no other body carries the cue, and no other skill ships run-summary-emit.md', () => {
    const inScope = new Set<string>(RUN_SUMMARY_EMIT_SKILLS);
    for (const s of skills) {
      if (inScope.has(s.dirName)) continue;
      expect(s.template.instructions.includes(RUN_SUMMARY_READ_CUE), s.dirName).toBe(false);
      expect((s.template.references ?? []).some((r) => r.name === RUN_SUMMARY_EMIT_REFERENCE_NAME), s.dirName).toBe(false);
    }
  });
});

describe('each run-summary-emit.md holds its emit section whole', () => {
  it('each reference is its title plus its section constant, and the body no longer carries the section', () => {
    for (const dir of RUN_SUMMARY_EMIT_SKILLS) {
      expect(emitRef(dir), dir).toBe(`# Reference: the run-summary emit step\n\n${STEPS[dir].section}\n`);
      expect(body(dir).includes(STEPS[dir].section), dir).toBe(false);
      // The section and the body's basic content open with the same heading, but for the `NEW` the body's copy
      // dropped (tighten-bodies: archive's Step 5.5).
      const heading = STEPS[dir].section.split('\n')[0];
      expect(STEPS[dir].basic.split('\n')[0], dir).toBe(heading.replace('## NEW Step ', '## Step '));
    }
  });

  // @scenario text orbit-run-summary-emit :: A body reads its run-summary detail before the session's first run-summary emit :: The reference holds the section as it was
  it("apply's reference holds the judgements entry after Proceed anyway, the token source, consent and the withdrawn grant; the body's emit step carries none of them", () => {
    const ref = emitRef('orbit-apply-change');
    const moved = [
      '**AT THIS SEAM**: when Step 3\'s inflection prompt was answered **Proceed anyway**, compose a `continuation` entry',
      'The token source is the TRAIL ITSELF, not `orbit status`',
      '- `consent` — `"user-invoked" | "prompted" | "setting"`',
      '**A withdrawn grant**: when the gate refuses `setting` naming the `apply` key',
      '- `judgements` (rc04a) — the CADENCE JUDGEMENT record',
    ];
    for (const m of moved) {
      expect(ref, m).toContain(m);
      expect(APPLY_RUN_SUMMARY_EMIT_BASIC, m).not.toContain(m);
      expect(body('orbit-apply-change'), m).not.toContain(m);
    }
  });

  // @scenario text orbit-run-summary-emit :: A body reads its run-summary detail before the session's first run-summary emit :: The trigger of an owed field is in the reference
  it("archive's reference holds the readiness record's composition, and its body does not", () => {
    const ref = emitRef('orbit-archive-change');
    const readiness = '**COMPOSE THE READINESS RECORD (rc04a).** When this archive CONCLUDES A REVIEW CADENCE';
    expect(ref).toContain(readiness);
    expect(ref).toContain('the payload SHALL carry a `judgements` entry with `kind: "readiness"`');
    expect(body('orbit-archive-change')).not.toContain(readiness);
    expect(body('orbit-archive-change')).not.toContain('COMPOSE THE READINESS RECORD');
  });

  it('archive and address-reviews keep a sentence naming their schema reference beside the cue', () => {
    expect(ARCHIVE_RUN_SUMMARY_EMIT_BASIC).toContain(
      `After upstream Step 5 (move-to-archive) completes, write the archive run summary. Its extension fields are documented in \`references/archive-summary-schema.md\`; read it when composing them. ${RUN_SUMMARY_READ_CUE}`
    );
    expect(ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC).toContain(
      `Each payload's fields are listed in \`references/run-summary-schema.md\`. ${RUN_SUMMARY_READ_CUE}`
    );
  });
});

describe('what stays is in the body', () => {
  // @scenario text orbit-run-summary-emit :: A body reads its run-summary detail before the session's first run-summary emit :: What stays is in the body
  it("apply's emit step carries the chunk-boundary sentence and its completion override; propose's and ff's their second publish segment and override", () => {
    expect(APPLY_RUN_SUMMARY_EMIT_BASIC).toContain(
      '`/orbit:apply` is a chunked multi-turn command. Fire the emit at every chunk boundary, at a mid-chunk session pause (chain: not a prompt), or once at session end for a no-chunking change — the conversation-boundary judgment is yours; everything else is engine-computed.'
    );
    expect(APPLY_RUN_SUMMARY_EMIT_BASIC).toContain('**Completion-prompt override (chat)**: on `all_done`');
    for (const basic of [PROPOSE_RUN_SUMMARY_EMIT_BASIC, FF_RUN_SUMMARY_EMIT_BASIC]) {
      expect(basic).toContain('When `publish` printed a second segment, the emit is NOT the last act');
      expect(basic).toContain('**Completion-prompt override (chat)**: where the upstream steps above prompt');
    }
    expect(CONTINUE_RUN_SUMMARY_EMIT_BASIC).toContain('**Completion-prompt override (chat)**: where the upstream steps above suggest');
    // The timing stays where it is not a sentence the cue opens: architect's conversation-boundary paragraph and its
    // sweep, audit-drift's standalone-only sentence; address-reviews keeps a one-line pointer to its per-source paragraph
    // (cut-review-walk, M10: the paragraph and its scope forms are its reference's).
    expect(ARCHITECT_RUN_SUMMARY_EMIT_BASIC).toContain('emit at conversation boundaries');
    expect(ARCHITECT_RUN_SUMMARY_EMIT_BASIC).toContain('**No emit without sweep**');
    expect(AUDIT_DRIFT_RUN_SUMMARY_EMIT_BASIC).toContain('**Standalone invocations only** — library / pre-archive contexts write no separate JSON');
    expect(ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC).toContain('**ONE resolution log PER SOURCE**: a walk that discovered several sources writes one log for each');
    // Each command block keeps its scope forms, address-reviews' excepted (below).
    expect(REVIEW_RUN_SUMMARY_EMIT_BASIC).toContain('orbit emit review --doc <doc-name> --payload <payload.json>');
    expect(AUDIT_DRIFT_RUN_SUMMARY_EMIT_BASIC).toContain('orbit emit audit-drift --payload <payload-file>');
  });

  // @scenario text orbit-run-summary-emit :: A body reads its run-summary detail before the session's first run-summary emit :: Address-reviews reads its per-source paragraph and scope forms from its reference
  it("address-reviews' emit step points at its per-source paragraph and scope forms, which its reference carries", () => {
    const walk = getSkillTemplates().find((s) => s.dirName === 'orbit-address-reviews')!.template;
    const emitRef = walk.references!.find((r) => r.name === 'run-summary-emit.md')!.content;
    const triageRef = walk.references!.find((r) => r.name === 'triage-sources.md')!.content;
    expect(ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC).toContain(RUN_SUMMARY_READ_CUE);
    expect(ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC).toContain('orbit emit address-reviews --change <name> --payload <payload-file>');
    expect(ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC).not.toContain('**ONE resolution log PER SOURCE.**');
    expect(ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC).not.toContain('invoke BARE');
    expect(ADDRESS_REVIEWS_RUN_SUMMARY_EMIT_BASIC).not.toContain('`--doc <doc-name>`');
    expect(emitRef).toContain('**ONE resolution log PER SOURCE.**');
    expect(emitRef).toContain('invoke BARE — `orbit emit address-reviews --payload <payload-file>`');
    expect(emitRef).toContain('`--doc <doc-name>` instead of `--change`');
    expect(triageRef).toContain("The logs go in token order, oldest first, then the markers. Write each source's log when that source's findings are walked, before the next source begins.");
    expect(walk.instructions).toContain('read `references/triage-sources.md` first and follow it as you build the triage below');
  });

  /**
   * tighten-bodies: the provenance each body's copy dropped from a paragraph it shares with its section (the reference
   * keeps its bytes) — (the body's words, the section's words). The edit ledger proves each removal is provenance.
   */
  const SPLIT: Partial<Record<string, Array<[string, string]>>> = {
    'orbit-apply-change': [['node (a separate verify gate', 'node (D5 — a separate verify gate']],
    'orbit-archive-change': [['## Step 5.5 — Archive run summary', '## NEW Step 5.5 — Archive run summary']],
    'orbit-architect': [
      ['(`/orbit:architect` is a multi-turn', '(Per `orbit-run-summary-emit` — `/orbit:architect` is a multi-turn'],
      ['`orbit emit architect`.)', '`orbit emit architect` — `orbit-emit-composition`.)'],
      ['(leak-hardening layer 2', '(D-arc Stage D5, leak-hardening layer 2'],
      ['the Step 4 residency sweep', 'the Step 4 R-d-8 residency sweep'],
    ],
  };

  it('every staying paragraph is also in the section, so the reference holds the step whole', () => {
    for (const dir of RUN_SUMMARY_EMIT_SKILLS) {
      const restore = (p: string): string => (SPLIT[dir] ?? []).reduce((t, [body, section]) => t.replace(body, section), p);
      const paragraphs = STEPS[dir].basic.split('\n\n').map((p) => restore(p.replace(`${RUN_SUMMARY_READ_CUE}`, '').trim())).filter(Boolean);
      // The new sentences opening the cue's paragraph in six bodies are the body's own; every other paragraph is the section's.
      const own = /^(At command completion, write the [a-z]+ run summary\.|After upstream Step 5 \(move-to-archive\) completes, write the archive run summary\.|Each payload's fields are listed in|\*\*ONE resolution log PER SOURCE\*\*: a walk that discovered several sources)/;
      for (const p of paragraphs) {
        if (own.test(p)) continue;
        expect(STEPS[dir].section, `${dir}: ${p.slice(0, 60)}`).toContain(p);
      }
    }
  });
});

/** Explore's and bulk-archive's emit sections, recorded at 9c43eee3; neither template is edited by this change. */
const UNTOUCHED: Array<[string, string, string]> = [
  ['orbit-explore', '## Run-summary emit (named-mode only)', '6f93ba6d6296ec2e61a7e3ea803718bd8f4d1e22d7db16df5c0bbd223540b78a'],
  ['orbit-bulk-archive-change', '## Per-change archive emit (rc10 — NEW step inside upstream Step 8, after 8b)', 'f874fda135d433202d380e2b83d70d70acd1a5cc3723ae5b75e33d2766074736'],
];
const section = (text: string, heading: string): string => {
  const at = text.indexOf(heading);
  if (at < 0) throw new Error(`no heading ${heading}`);
  const level = heading.match(/^#+/)?.[0] ?? '##';
  const rest = text.slice(at + heading.length);
  const next = rest.search(new RegExp(`\\n#{1,${level.length}} `));
  return (heading + (next < 0 ? rest : rest.slice(0, next))).trimEnd();
};

describe('explore and bulk-archive are left as they are', () => {
  // @scenario text orbit-run-summary-emit :: A body reads its run-summary detail before the session's first run-summary emit :: Explore and bulk-archive are left as they are
  it('each emit section reads as before, and neither ships run-summary-emit.md nor carries the cue', () => {
    for (const [dir, heading, recorded] of UNTOUCHED) {
      expect(createHash('sha256').update(section(body(dir), heading)).digest('hex'), dir).toBe(recorded);
      expect(reference(dir, RUN_SUMMARY_EMIT_REFERENCE_NAME), dir).toBeUndefined();
      expect(body(dir).includes(RUN_SUMMARY_READ_CUE), dir).toBe(false);
    }
  });
});
