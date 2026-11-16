import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import { DecisionRecordError, checkDefines, checkDetail } from './decision-records.js';
import { readProjectConfig, resolvePrMode, resolveSignoffSetting, type SignoffSetting } from './project-config.js';
import { isValidDocName, loadArchitectureDoc, type ParsedArchitectureDoc } from './architecture/parser.js';
import { computeStageStates, type RenderedState } from './architecture/state.js';
import { readStatus } from './parsers/explore-rules.js';
import { isSingleName } from './containment.js';

/**
 * A change's SIGN-OFF (stage `program-brief` of `automate-dev-flow`, `orbit-program-brief`'s `A sign-off is
 * recorded against the saved copy, and the hold reads it`): the user's answer, under `signoff: change`, to the
 * question the archive asks over the change's saved brief — and a PROGRAM's sign-off (`A program's sign-off is
 * recorded against its saved copy, and the hold reads arc-done`), the same record under `signoff: program` over
 * the program's saved brief, asked at the architect session — with the write gate's checks on both
 * (`orbit-emit-composition`'s `The write gate checks the sign-off record`) and THE TWO HOLDS, the one reader of each
 * `signoff/` folder (`orbit brief --change <name> --hold` and `orbit brief <doc> --hold`). The program hold also
 * owns what "finished" and "the closing review" mean, so the program save and the hold read one rule.
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

/** The refusal for a `--doc` naming no architecture doc. */
export function signoffDocScopeRefusal(doc: string): string {
  return `a program's sign-off is written only for an architecture doc at orbit/architecture/<doc>.md — '${doc}' names none.`;
}

/**
 * The setting check's refusal text (`The write gate checks the sign-off record`'s `setting` row): names the value
 * read and which sign-off, if any, that value asks for. `target` is the sign-off submitted: `change` for
 * `--change`, `program` for `--doc`.
 */
export function signoffSettingRefusal(setting: SignoffSetting, target: 'change' | 'program'): string {
  const asked = target === 'change' ? "a change's sign-off (--change)" : "a program's sign-off (--doc)";
  const wants = target === 'change' ? 'change' : 'program';
  if (setting.value === 'off') {
    const read = setting.warning !== null ? setting.warning : "the sign-off setting ('signoff' in orbit/config.yaml) is off (absent or 'off')";
    return `${read} — nothing waits on a sign-off, so ${asked} is not written; ${asked} is written under signoff: ${wants}.`;
  }
  const other =
    setting.value === 'change'
      ? "it asks for a change's sign-off at each archive, with --change"
      : "it asks for one program's sign-off at the architect session, with --doc";
  return `the sign-off setting ('signoff' in orbit/config.yaml) is '${setting.value}': ${other}, so ${asked} is not written; ${asked} is written under signoff: ${wants}.`;
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

/** Every key a written change sign-off carries: the engine's spine and `sha256`, and the payload table. */
const STORED_SIGNOFF_KEYS = new Set(['command', 'timestamp', 'change', 'model', 'sha256', ...SIGNOFF_PAYLOAD_FIELDS]);

/** A program sign-off carries `doc` and the engine's `closing_review` beside them. */
const STORED_PROGRAM_SIGNOFF_KEYS = new Set([...STORED_SIGNOFF_KEYS, 'doc', 'closing_review']);

/** A closing review's filename, `review-architecture-<TS>.json`. */
export const ARCHITECTURE_REVIEW_FILENAME = /^review-architecture-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.json$/;

/** Whose sign-off a stored record is: a change's, by name, or a program's, by doc. */
export type SignoffOwner = { change: string } | { doc: string };

/**
 * A stored sign-off's shape: every check the write gate makes on a record it writes — the decision-record spine
 * (`command`, `timestamp` and `model` present, `change` the change's name, or `null` with `doc` the doc's name for
 * a program, no `kind`, `final_assessment` or `next_recommended`), no key the gate never writes, the engine's
 * `sha256` (and, for a program, its `closing_review`: a closing review's filename or `null`), and the payload
 * fields — so a record the gate would refuse never lifts a hold.
 */
function checkStoredSignoff(record: Record<string, unknown>, owner: SignoffOwner): void {
  if (record.command !== SIGNOFF_COMMAND) refuse(`it carries command ${describe(record.command)}, not ${SIGNOFF_COMMAND}.`);
  if (!nonBlank(record.timestamp)) refuse(`its 'timestamp' is missing or empty (got ${describe(record.timestamp)}).`);
  if (!hasOwn(record, 'model')) refuse(`its 'model' is missing (nullable, never absent).`);
  if (record.model !== null && typeof record.model !== 'string') refuse(`its 'model' is not a string or null (got ${describe(record.model)}).`);
  if ('change' in owner) {
    if (record.change !== owner.change) refuse(`its 'change' is ${describe(record.change)}, not '${owner.change}'.`);
  } else {
    if (!hasOwn(record, 'change') || record.change !== null) refuse(`its 'change' is ${describe(record.change)}, not null, as a program's sign-off carries.`);
    if (record.doc !== owner.doc) refuse(`its 'doc' is ${describe(record.doc)}, not '${owner.doc}'.`);
    if (!hasOwn(record, 'closing_review')) refuse(`its 'closing_review' is missing (a closing review's filename, or null).`);
    const cr = record.closing_review;
    if (cr !== null && (typeof cr !== 'string' || !ARCHITECTURE_REVIEW_FILENAME.test(cr))) {
      refuse(`its 'closing_review' is not a closing review's filename, review-architecture-<TS>.json, or null (got ${describe(cr)}).`);
    }
  }
  for (const f of ['kind', 'final_assessment', 'next_recommended']) {
    if (hasOwn(record, f)) refuse(`it carries '${f}', which a sign-off never carries.`);
  }
  const allowed = 'change' in owner ? STORED_SIGNOFF_KEYS : STORED_PROGRAM_SIGNOFF_KEYS;
  for (const k of Object.keys(record)) {
    if (!allowed.has(k)) refuse(`it carries '${k}', a key the write gate never writes.`);
  }
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
    refuse(`'brief' ${describe(record.brief)} names no saved copy — none is saved in ${briefDir}; the save runs before the sign-off is asked.`);
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
  setting: SignoffSetting['value'];
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
  const copy = readLatestCopy(path.join(runsDir, SAVED_BRIEF_DIR));
  const latest = readLatestSignoff(path.join(runsDir, SIGNOFF_DIR), { change });
  const signoff = latest === null ? null : { file: latest.file, answer: latest.record.answer as SignoffAnswer };
  const signedHash = latest !== null && latest.record.answer === 'signed' ? (latest.record.sha256 as string) : null;

  if (copy === null) return { ...base, copy, signoff, why: 'no-copy', held: true };
  if (signedHash !== null && signedHash === copy.sha256) return { ...base, copy, signoff, why: 'signed', held: false };
  return { ...base, copy, signoff, why: 'unsigned', held: true };
}

/** The latest saved copy in `briefDir` by filename, with the SHA-256 of its bytes; null when none is saved. */
function readLatestCopy(briefDir: string): { file: string; sha256: string } | null {
  const copyName = latestSavedCopy(briefDir);
  if (copyName === null) return null;
  let bytes: Buffer;
  try {
    bytes = fs.readFileSync(path.join(briefDir, copyName));
  } catch (err) {
    refuse(`the latest saved copy ${path.join(briefDir, copyName)} cannot be read (${(err as NodeJS.ErrnoException).code ?? (err as Error).message}).`);
  }
  return { file: copyName, sha256: sha256OfBytes(bytes) };
}

/**
 * The latest sign-off in `signoffDir` by filename, held to the write gate's shape for `owner`; null when there is
 * none. Never falls back to an earlier one: a latest record that cannot be read, is not valid JSON or has a shape
 * the gate would refuse throws naming it.
 */
function readLatestSignoff(signoffDir: string, owner: SignoffOwner): { file: string; record: Record<string, unknown> } | null {
  const signoffs = listChild(signoffDir, SIGNOFF_FILENAME, 'sign-off');
  if (signoffs.length === 0) return null;
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
    checkStoredSignoff(record as Record<string, unknown>, owner);
  } catch (err) {
    if (err instanceof SignoffError || err instanceof DecisionRecordError) {
      refuse(`the latest sign-off ${where} is not a valid sign-off: ${(err as Error).message}`);
    }
    throw err;
  }
  return { file: name, record: record as Record<string, unknown> };
}

/** The hold's one line. */
export function renderHold(h: HoldReport): string {
  const copy = h.copy === null ? 'no saved copy' : `copy ${h.copy.file} (sha256 ${h.copy.sha256})`;
  const signoff = h.signoff === null ? 'no sign-off' : `latest sign-off ${h.signoff.file} (${h.signoff.answer})`;
  if (h.why === 'off') {
    return h.setting === 'program'
      ? `${h.change}: not held (off) — the sign-off setting is program, which holds the program's completion and no change's archive.`
      : `${h.change}: not held (off) — the sign-off setting is off, so nothing waits on a sign-off.`;
  }
  return `${h.change}: ${h.held ? 'held' : 'not held'} (${h.why}) — ${copy}; ${signoff}.`;
}

// ---------------------------------------------------------------------------
// The program: finished, the closing review, the program hold
// ---------------------------------------------------------------------------

/** The stage states a FINISHED program's declared stages render (`A program's brief is saved once the program is finished`). */
export const FINISHED_STAGE_STATES: readonly RenderedState[] = [
  'quiescent-awaiting-ratification',
  'complete',
  'ended',
  'ended-from-explore',
];

const ARCHIVE_RECORD = /^archive-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.json$/;

/** A doc's citation in `<dir>/.openspec.yaml`, leniently: a missing or unreadable file, or no doc, cites nothing. */
function citesDoc(dir: string, doc: string): boolean {
  try {
    const meta = parseYaml(fs.readFileSync(path.join(dir, '.openspec.yaml'), 'utf-8')) as { architecture?: { doc?: unknown } } | null;
    return meta !== null && typeof meta === 'object' && meta.architecture?.doc === doc;
  } catch {
    return false;
  }
}

function subdirsOf(dir: string): string[] {
  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter(n => {
      if (n.startsWith('.')) return false;
      try {
        return fs.statSync(path.join(dir, n)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * The LIVE work citing `doc`, whatever stage it names or none: active changes under `orbit/changes/`, and
 * explorations under `orbit/explore/` whose `explore.md` is not concluded (read through the explore parser's one
 * status reader, a missing or unreadable file reading as live, as the stage states read it). Repo-relative paths.
 */
export function liveWorkCiting(projectRoot: string, doc: string): string[] {
  const live: string[] = [];
  const changesDir = path.join(projectRoot, 'orbit', 'changes');
  for (const name of subdirsOf(changesDir)) {
    if (name === 'archive') continue;
    if (citesDoc(path.join(changesDir, name), doc)) live.push(`orbit/changes/${name}`);
  }
  const exploreDir = path.join(projectRoot, 'orbit', 'explore');
  for (const name of subdirsOf(exploreDir)) {
    const dir = path.join(exploreDir, name);
    if (!citesDoc(dir, doc)) continue;
    let concluded = false;
    try {
      concluded = readStatus(fs.readFileSync(path.join(dir, 'explore.md'), 'utf-8')).token === 'concluded';
    } catch {
      concluded = false;
    }
    if (!concluded) live.push(`orbit/explore/${name}`);
  }
  return live;
}

/**
 * Whether the program is FINISHED: its doc declares at least one stage, every stage it declares renders one of
 * `FINISHED_STAGE_STATES`, and no live work cites the doc under any stage or none. A LEGACY doc declares no stage,
 * so it is never finished.
 */
export function programFinished(projectRoot: string, parsed: ParsedArchitectureDoc): boolean {
  if (parsed.docClass !== 'parseable' || parsed.stages.length === 0) return false;
  const states = computeStageStates(projectRoot, parsed);
  if (!states.every(st => FINISHED_STAGE_STATES.includes(st.rendered))) return false;
  return liveWorkCiting(projectRoot, parsed.name).length === 0;
}

/**
 * When an archived change was archived, as the program brief orders them: its latest archive record's token, or
 * its archive directory's date when it has none. `records` are the filenames of its `.orbit-runs/`.
 */
export function archiveTimeOf(dirName: string, records: string[]): string {
  const tokens = records.map(f => f.match(ARCHIVE_RECORD)?.[1]).filter((t): t is string => t !== undefined).sort();
  return tokens.length > 0 ? tokens[tokens.length - 1] : `${dirName.slice(0, 10)}T00-00-00Z`;
}

/** The archive times of every archived change citing `doc`. A history folder that exists and cannot be listed throws. */
function citingArchiveTimes(projectRoot: string, doc: string): string[] {
  const archiveDir = path.join(projectRoot, 'orbit', 'changes', 'archive');
  const times: string[] = [];
  for (const name of subdirsOf(archiveDir)) {
    const dir = path.join(archiveDir, name);
    if (!citesDoc(dir, doc)) continue;
    const runs = path.join(dir, '.orbit-runs');
    let records: string[];
    try {
      records = fs.readdirSync(runs);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        refuse(`the archived change's history ${runs} cannot be listed (${(err as NodeJS.ErrnoException).code ?? (err as Error).message}).`);
      }
      records = [];
    }
    times.push(archiveTimeOf(name, records));
  }
  return times;
}

/** The architecture trail's folder, `orbit/architecture/.orbit-runs/`. */
export function architectureTrail(projectRoot: string): string {
  return path.join(projectRoot, 'orbit', 'architecture', '.orbit-runs');
}

/**
 * The program's CLOSING REVIEW: the latest `review-architecture-<TS>.json` in the architecture trail whose `doc`
 * is `doc` and whose token is later than every citing change's archive time (any such record of the doc when no
 * citing change is archived — a named limit). `lastArchive` is the latest citing archive time, or null. Returns
 * the filename, or null. A trail that exists and cannot be listed, or a review record that cannot be read or is not
 * a JSON object, throws naming it.
 */
function closingReviewOf(projectRoot: string, doc: string, lastArchive: string | null): string | null {
  const trail = architectureTrail(projectRoot);
  let names: string[];
  try {
    names = fs.readdirSync(trail);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    refuse(`the architecture trail ${trail} cannot be listed (${(err as NodeJS.ErrnoException).code ?? (err as Error).message}).`);
  }
  const candidates = names.filter(n => ARCHITECTURE_REVIEW_FILENAME.test(n)).sort().reverse();
  for (const name of candidates) {
    const token = (name.match(ARCHITECTURE_REVIEW_FILENAME) as RegExpMatchArray)[1];
    if (lastArchive !== null && !(token > lastArchive)) return null; // every earlier one is earlier still
    const where = path.join(trail, name);
    let record: unknown;
    try {
      record = JSON.parse(fs.readFileSync(where, 'utf-8'));
    } catch (err) {
      refuse(`the architecture review ${where} cannot be read as JSON (${(err as NodeJS.ErrnoException).code ?? 'invalid JSON'}).`);
    }
    if (record === null || typeof record !== 'object' || Array.isArray(record)) refuse(`the architecture review ${where} is not a JSON object.`);
    if ((record as Record<string, unknown>).doc === doc) return name;
  }
  return null;
}

/** The latest citing archive time, or null when no citing change is archived. */
function lastCitingArchive(projectRoot: string, doc: string): string | null {
  const times = citingArchiveTimes(projectRoot, doc).sort();
  return times.length > 0 ? times[times.length - 1] : null;
}

/** A program's done-ness, read for the sign-off: whether it is finished, and its closing review when finished. */
export interface ProgramDone {
  finished: boolean;
  /** The closing review's filename; null when none is recorded, or when the program is not finished (not read). */
  closingReview: string | null;
  /** The latest citing archive time; null when none, or when not read. */
  lastArchive: string | null;
}

/** Load a doc for the program hold or save: refuses a bad name, a missing doc and a MALFORMED one, naming it. */
export function loadProgramDoc(projectRoot: string, doc: string): ParsedArchitectureDoc {
  if (!isSingleName(doc) || !isValidDocName(doc)) refuse(`'${doc}' is not a single doc name.`);
  const parsed = loadArchitectureDoc(projectRoot, doc);
  if (parsed === null) refuse(`architecture doc '${doc}' not found at orbit/architecture/${doc}.md.`);
  if (parsed.docClass === 'malformed') {
    refuse(`architecture doc '${doc}' breaks the stage grammar; run \`orbit architecture validate ${doc}\` to see where.`);
  }
  return parsed;
}

/** Whether the program is finished and, when it is, its closing review (`A program's sign-off is recorded ...`). */
export function readProgramDone(projectRoot: string, parsed: ParsedArchitectureDoc): ProgramDone {
  if (!programFinished(projectRoot, parsed)) return { finished: false, closingReview: null, lastArchive: null };
  const lastArchive = lastCitingArchive(projectRoot, parsed.name);
  return { finished: true, closingReview: closingReviewOf(projectRoot, parsed.name, lastArchive), lastArchive };
}

/**
 * The program's closing review now, for the write gate's `closing_review`: read whatever the program's state, so a
 * sign-off records the review it was given under. Null when none is recorded.
 */
export function currentClosingReview(projectRoot: string, doc: string): string | null {
  return closingReviewOf(projectRoot, doc, lastCitingArchive(projectRoot, doc));
}

/** The program's saved briefs, `brief/<doc>/` in the architecture trail. */
export function programBriefDir(projectRoot: string, doc: string): string {
  return path.join(architectureTrail(projectRoot), SAVED_BRIEF_DIR, doc);
}

/** The program's sign-offs, `signoff/<doc>/` in the architecture trail. */
export function programSignoffDir(projectRoot: string, doc: string): string {
  return path.join(architectureTrail(projectRoot), SIGNOFF_DIR, doc);
}

export type ProgramHoldWhy = 'off' | 'not-done' | 'no-copy' | 'signed' | 're-sign' | 'unsigned';

/** `orbit brief <doc> --hold --json`: exactly these keys; a key the hold did not read is null. */
export interface ProgramHoldReport {
  doc: string;
  setting: SignoffSetting['value'];
  warning: string | null;
  finished: boolean | null;
  closing_review: { file: string } | null;
  copy: { file: string; sha256: string } | null;
  signoff: { file: string; answer: SignoffAnswer } | null;
  why: ProgramHoldWhy;
  held: boolean;
}

/**
 * Compute the program hold of `doc` (`A program's sign-off is recorded against its saved copy, and the hold reads
 * arc-done`), by the first row that matches. The setting is read FIRST: under any value but `program` nothing else
 * is read, the doc included. Under `program` the doc (not found or MALFORMED throws), its stage states, the
 * architecture trail's reviews and the citing archives, then, for a done program, the two folders by filename,
 * never falling back to an earlier copy or sign-off. Throws a `SignoffError` naming what cannot be read.
 */
export function computeProgramHold(projectRoot: string, doc: string): ProgramHoldReport {
  const setting = resolveSignoffSetting(projectRoot);
  const base = { doc, setting: setting.value, warning: setting.warning };
  const none = { finished: null, closing_review: null, copy: null, signoff: null };
  if (setting.value !== 'program') return { ...base, ...none, why: 'off', held: false };

  const parsed = loadProgramDoc(projectRoot, doc);
  const done = readProgramDone(projectRoot, parsed);
  if (!done.finished || done.closingReview === null) {
    return { ...base, ...none, finished: done.finished, why: 'not-done', held: false };
  }
  const closing_review = { file: done.closingReview };

  const copy = readLatestCopy(programBriefDir(projectRoot, doc));
  const latest = readLatestSignoff(programSignoffDir(projectRoot, doc), { doc });
  const signoff = latest === null ? null : { file: latest.file, answer: latest.record.answer as SignoffAnswer };
  const at = { ...base, finished: true, closing_review, copy, signoff };

  if (copy === null) return { ...at, why: 'no-copy', held: true };
  if (latest !== null && latest.record.answer === 'signed') {
    if (latest.record.sha256 === copy.sha256) return { ...at, why: 'signed', held: false };
    if (signatureStands(latest.record.closing_review, done.lastArchive)) {
      const held = resolvePrMode(readProjectConfig(projectRoot)) === 'per-architecture';
      return { ...at, why: 're-sign', held };
    }
  }
  return { ...at, why: 'unsigned', held: true };
}

/**
 * Whether a signature STILL STANDS: the review its `closing_review` names is later than every citing change's
 * archive (the same ordering that finds the closing review). A signature naming no closing review does not stand.
 */
function signatureStands(closingReview: unknown, lastArchive: string | null): boolean {
  if (typeof closingReview !== 'string') return false;
  const m = closingReview.match(ARCHITECTURE_REVIEW_FILENAME);
  if (m === null) return false;
  return lastArchive === null || m[1] > lastArchive;
}

/** The program hold's one line. */
export function renderProgramHold(h: ProgramHoldReport): string {
  if (h.why === 'off') return `${h.doc}: not held (off) — the sign-off setting is not program, so the program waits on no sign-off.`;
  if (h.why === 'not-done') {
    return `${h.doc}: not held (not-done) — ${h.finished ? 'the program is finished, and no closing architecture review is recorded after its last archive' : 'the program is not finished'}, so no sign-off is asked yet.`;
  }
  const copy = h.copy === null ? 'no saved copy' : `copy ${h.copy.file} (sha256 ${h.copy.sha256})`;
  const signoff = h.signoff === null ? 'no sign-off' : `latest sign-off ${h.signoff.file} (${h.signoff.answer})`;
  return `${h.doc}: ${h.held ? 'held' : 'not held'} (${h.why}) — ${copy}; ${signoff}; closing review ${(h.closing_review as { file: string }).file}.`;
}
