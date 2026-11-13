import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { DecisionRecordError, checkDefines, checkDetail } from './decision-records.js';
import { resolveSignoffSetting, type SignoffSetting } from './project-config.js';

/**
 * A change's SIGN-OFF (stage `program-brief` of `automate-dev-flow`, `orbit-program-brief`'s `A sign-off is
 * recorded against the saved copy, and the hold reads it`): the user's answer, under `signoff: change`, to the
 * question the archive asks over the change's saved brief — and the write gate's checks on it
 * (`orbit-emit-composition`'s `The write gate checks the sign-off record`) and THE HOLD, the one reader of the
 * `signoff/` folder (`orbit brief --change <name> --hold`).
 *
 * The emit surface owns target resolution, the `signoff/` path, the spine and the no-overwrite publish; this
 * module owns what a sign-off must hold, the latest-copy check and the hold's computation. It judges FORM and
 * EXISTENCE only (R-crc-10): whether the user read the copy, and whether a reason is clear, are not its to judge.
 *
 * A sign-off is not a decision record (it records an answer over one copy, never a call or a stop) and not an
 * account; the reading's selection never takes it. Sign-offs form a time-ordered sequence, never a replacement
 * chain: each answers the copy it names, and the latest is the change's current sign-off.
 */

export class SignoffError extends Error {}

/** The emit command that writes a sign-off. */
export const SIGNOFF_COMMAND = 'signoff';

/** The trail child sign-offs are kept in, beside `account/` and `brief/`. */
export const SIGNOFF_DIR = 'signoff';

/** The trail child the saved briefs are kept in (`orbit-program-brief`'s `A change's brief is saved, never overwritten`). */
export const SAVED_BRIEF_DIR = 'brief';

/** The two answers. */
export const SIGNOFF_ANSWERS = ['signed', 'declined'] as const;
export type SignoffAnswer = (typeof SIGNOFF_ANSWERS)[number];

/** The payload table (`The write gate checks the sign-off record`); `sha256` is the engine's. */
export const SIGNOFF_PAYLOAD_FIELDS: string[] = ['brief', 'answer', 'reason', 'defines', 'detail'];

/** A sign-off's filename, `signoff-<TS>.json`. */
export const SIGNOFF_FILENAME = /^signoff-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/;

/** A saved copy's filename, `brief-<TS>.md` (the same rule as `program-brief.ts`'s `BRIEF_FILENAME`). */
export const SAVED_BRIEF_FILENAME = /^brief-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/;

const SHA256_HEX = /^[0-9a-f]{64}$/;

function refuse(message: string): never {
  throw new SignoffError(message);
}

function hasOwn(o: Record<string, unknown>, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

function describe(v: unknown): string {
  return JSON.stringify(v) ?? String(v);
}

function nonBlank(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '';
}

/** The SHA-256 of bytes, in lower-case hex. */
export function sha256OfBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * The refusal for an `--change` naming no active change. `foundAt` is the repo-relative place the name was
 * found (an exploration, an archive), or null.
 */
export function signoffScopeRefusal(name: string, foundAt: string | null): string {
  const where = foundAt === null ? `'${name}' was found nowhere` : `'${name}' was found only at ${foundAt}`;
  return `a sign-off is written only for an active change under orbit/changes/ — ${where}.`;
}

/** The refusal for `--doc`: the program's sign-off is a later change's. */
export const SIGNOFF_DOC_REFUSAL =
  "a sign-off is written for a change, with --change; the program's sign-off is not built yet (stage program-brief's fourth change, program-signoff).";

/** The setting check's refusal text, naming the value read. */
export function signoffSettingRefusal(setting: SignoffSetting): string {
  const read = setting.warning !== null ? setting.warning : "the sign-off setting ('signoff' in orbit/config.yaml) is off (absent or 'off')";
  return `${read} — nothing waits on a sign-off, so no sign-off is written; set signoff: change to sign off on each change.`;
}

/**
 * List a trail child folder's files matching `pattern`, sorted (the greatest token last). An absent folder reads
 * as empty; a folder that exists and cannot be listed throws naming it.
 */
function listChild(dir: string, pattern: RegExp, label: string): string[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    refuse(`the ${label} folder ${dir} cannot be listed (${(err as NodeJS.ErrnoException).code ?? (err as Error).message}).`);
  }
  return entries.filter(f => pattern.test(f)).sort();
}

/** The latest saved copy's filename in `brief/`, or null when none is saved. Throws when the folder cannot be listed. */
export function latestSavedCopy(briefDir: string): string | null {
  const names = listChild(briefDir, SAVED_BRIEF_FILENAME, 'saved-brief');
  return names.length > 0 ? names[names.length - 1] : null;
}

function checkBriefForm(record: Record<string, unknown>): void {
  if (typeof record.brief !== 'string' || !SAVED_BRIEF_FILENAME.test(record.brief)) {
    refuse(`'brief' must name a saved copy of the brief by its filename, brief-<TS>.md (got ${describe(record.brief)}).`);
  }
}

/** The checks after `brief`, with no file read: `answer`, `reason`, `defines`, `detail`. */
function checkAnswerFields(record: Record<string, unknown>): void {
  if (typeof record.answer !== 'string' || !(SIGNOFF_ANSWERS as readonly string[]).includes(record.answer)) {
    refuse(`'answer' must be ${SIGNOFF_ANSWERS.join(' or ')} (got ${describe(record.answer)}).`);
  }
  if (record.answer === 'declined' && !nonBlank(record.reason)) {
    refuse(`'reason' is required when the answer is declined: the user's reason, in their words (got ${describe(record.reason)}).`);
  }
  if (hasOwn(record, 'reason') && !nonBlank(record.reason)) {
    refuse(`'reason' must be a non-blank string when present (got ${describe(record.reason)}).`);
  }
  checkDefines(record);
  checkDetail(record);
}

/** The shape checks a sign-off passes, with no file read (the hold reads a stored record by the same checks). */
export function checkSignoffShape(record: Record<string, unknown>): void {
  checkBriefForm(record);
  checkAnswerFields(record);
}

/** A stored sign-off's shape: the payload's, plus the engine's `command` and `sha256`. */
function checkStoredSignoff(record: Record<string, unknown>): void {
  if (record.command !== SIGNOFF_COMMAND) refuse(`it carries command ${describe(record.command)}, not ${SIGNOFF_COMMAND}.`);
  if (typeof record.sha256 !== 'string' || !SHA256_HEX.test(record.sha256)) {
    refuse(`its 'sha256' is not a SHA-256 in lower-case hex (got ${describe(record.sha256)}).`);
  }
  checkSignoffShape(record);
}

/**
 * The write gate's `brief` check, reading the change's `brief/` folder: `brief` must be the latest saved copy.
 * Returns the SHA-256 of that copy's bytes, read now, for the engine to write beside it.
 */
export function checkSignoffBrief(record: Record<string, unknown>, briefDir: string): string {
  const latest = latestSavedCopy(briefDir);
  if (latest === null) {
    refuse(`'brief' ${describe(record.brief)} names no saved copy — none is saved in ${briefDir}; the archive saves one before it asks.`);
  }
  if (record.brief !== latest) {
    refuse(`'brief' ${describe(record.brief)} is not the latest saved copy — sign off on ${latest}, the latest in ${briefDir}.`);
  }
  let bytes: Buffer;
  try {
    bytes = fs.readFileSync(path.join(briefDir, latest));
  } catch (err) {
    refuse(`the saved copy ${latest} cannot be read (${(err as NodeJS.ErrnoException).code ?? (err as Error).message}).`);
  }
  return sha256OfBytes(bytes);
}

/**
 * Every payload check after the setting, in the gate's order (`brief` — its form, then the folder — `answer`,
 * `reason`, `defines`, `detail`). Returns the SHA-256 of the named copy's bytes.
 */
export function checkSignoff(record: Record<string, unknown>, briefDir: string): string {
  checkBriefForm(record);
  const hash = checkSignoffBrief(record, briefDir);
  checkAnswerFields(record);
  return hash;
}

// ---------------------------------------------------------------------------
// The hold
// ---------------------------------------------------------------------------

export type HoldWhy = 'off' | 'no-copy' | 'signed' | 'unsigned';

/** `orbit brief --change <name> --hold --json`: exactly these keys. */
export interface HoldReport {
  change: string;
  setting: 'off' | 'change';
  warning: string | null;
  copy: { file: string; sha256: string } | null;
  signoff: { file: string; answer: SignoffAnswer } | null;
  why: HoldWhy;
  held: boolean;
}

/**
 * Compute the hold of the ACTIVE change at `changeDir`. The setting is read FIRST: under any value but `change`
 * no folder of the change's history is read, so a default archive is never stopped by the state of its history.
 * Under `change` the latest copy and the latest sign-off are read by filename, never falling back to an earlier
 * one; a folder that cannot be listed, a latest copy that cannot be read, or a latest sign-off that cannot be
 * read, is not valid JSON, or has a shape the write gate would refuse throws a `SignoffError` naming it.
 */
export function computeHold(projectRoot: string, change: string, changeDir: string): HoldReport {
  const setting = resolveSignoffSetting(projectRoot);
  const base = { change, setting: setting.value, warning: setting.warning };
  if (setting.value !== 'change') {
    return { ...base, copy: null, signoff: null, why: 'off', held: false };
  }
  const runsDir = path.join(changeDir, '.orbit-runs');
  const briefDir = path.join(runsDir, SAVED_BRIEF_DIR);
  const signoffDir = path.join(runsDir, SIGNOFF_DIR);

  const copyName = latestSavedCopy(briefDir);
  let copy: HoldReport['copy'] = null;
  if (copyName !== null) {
    let bytes: Buffer;
    try {
      bytes = fs.readFileSync(path.join(briefDir, copyName));
    } catch (err) {
      refuse(`the latest saved copy ${path.join(briefDir, copyName)} cannot be read (${(err as NodeJS.ErrnoException).code ?? (err as Error).message}).`);
    }
    copy = { file: copyName, sha256: sha256OfBytes(bytes) };
  }

  const signoffs = listChild(signoffDir, SIGNOFF_FILENAME, 'sign-off');
  let signoff: HoldReport['signoff'] = null;
  let signedHash: string | null = null;
  if (signoffs.length > 0) {
    const name = signoffs[signoffs.length - 1];
    const where = path.join(signoffDir, name);
    let text: string;
    try {
      text = fs.readFileSync(where, 'utf-8');
    } catch (err) {
      refuse(`the latest sign-off ${where} cannot be read (${(err as NodeJS.ErrnoException).code ?? (err as Error).message}).`);
    }
    let record: unknown;
    try {
      record = JSON.parse(text);
    } catch {
      refuse(`the latest sign-off ${where} is not valid JSON.`);
    }
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      refuse(`the latest sign-off ${where} is not a JSON object.`);
    }
    try {
      checkStoredSignoff(record as Record<string, unknown>);
    } catch (err) {
      if (err instanceof SignoffError || err instanceof DecisionRecordError) {
        refuse(`the latest sign-off ${where} is not a valid sign-off: ${(err as Error).message}`);
      }
      throw err;
    }
    const r = record as Record<string, unknown>;
    signoff = { file: name, answer: r.answer as SignoffAnswer };
    if (r.answer === 'signed') signedHash = r.sha256 as string;
  }

  if (copy === null) return { ...base, copy, signoff, why: 'no-copy', held: true };
  if (signedHash !== null && signedHash === copy.sha256) return { ...base, copy, signoff, why: 'signed', held: false };
  return { ...base, copy, signoff, why: 'unsigned', held: true };
}

/** The hold's one line. */
export function renderHold(h: HoldReport): string {
  const copy = h.copy === null ? 'no saved copy' : `copy ${h.copy.file} (sha256 ${h.copy.sha256})`;
  const signoff = h.signoff === null ? 'no sign-off' : `latest sign-off ${h.signoff.file} (${h.signoff.answer})`;
  if (h.why === 'off') return `${h.change}: not held (off) — the sign-off setting is off, so nothing waits on a sign-off.`;
  return `${h.change}: ${h.held ? 'held' : 'not held'} (${h.why}) — ${copy}; ${signoff}.`;
}
