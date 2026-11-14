import * as fs from 'node:fs';
import * as path from 'node:path';
import { collectSections } from './parsers/explore-counter.js';
import { liveDecisionIds, decisionEntryText } from './parsers/explore-rules.js';
import { parse as parseYaml } from 'yaml';
import { createFenceTracker } from './markdown-fence.js';
import { isSingleName } from './containment.js';
import { resolveSignoffSetting } from './project-config.js';
// A call-time cycle (account.ts reads this module's shape checks): nothing here is read at module load.
import { ACCOUNT_DIR, ACCOUNT_FILENAME, latestAccount, readAccountFolder } from './account.js';

/**
 * The three DECISION RECORDS (stage `decision-layer`, capability `orbit-decision-records`) — the
 * ledger entry, the stop record and the resolution — and the write gate's checks on them
 * (`orbit-emit-composition`'s `The write gate checks decision records`). The emit surface owns
 * target resolution, the `decisions/` path, the spine and the single atomic write; this module
 * owns what a record must hold: its plain-language fields, its area or condition, its citations
 * and its stop links. It judges FORM and EXISTENCE only (R-crc-10): whether a call belongs in an
 * area, whether a citation covers the decision, and whether prose is clear are a reader's.
 */

export class DecisionRecordError extends Error {}

/** The three decision-record commands; none is a run summary. */
export const DECISION_COMMANDS = ['ledger', 'stop', 'resolution'] as const;
export type DecisionCommand = (typeof DECISION_COMMANDS)[number];

export function isDecisionCommand(command: string): command is DecisionCommand {
  return (DECISION_COMMANDS as readonly string[]).includes(command);
}

/** `orbit-decision-records`' `The ledger's eighteen areas` — the ids, in the table's order. */
export const LEDGER_AREAS = [
  'user-sees-or-does',
  'defaults',
  'when-things-go-wrong',
  'user-data',
  'things-others-build-on',
  'docs',
  'who-can-get-in',
  'secrets',
  'network-exposure',
  'trusting-input',
  'new-dependencies',
  'permissions-and-sandboxing',
  'encryption',
  'personal-data-and-privacy',
  'cost',
  'licensing',
  'accessibility',
  'performance-user-feels',
] as const;

/** R-adf-3's six stop conditions, as `orbit-decision-records`' event table names them. */
export const STOP_CONDITIONS = [
  'security-unprecedented',
  'user-facing-uncovered',
  'ruling-amendment',
  'outward-act',
  'tripwire',
  'unresolvable-critical',
] as const;

/** The five a payload may raise: `tripwire` is raised by orbit itself (stage `tripwires`). */
export const PAYLOAD_STOP_CONDITIONS = STOP_CONDITIONS.filter(c => c !== 'tripwire');

/** The two conditions that are followed by the ledger entry for the call (a `raised_stop`). */
export const LEDGER_STOP_CONDITIONS = ['security-unprecedented', 'user-facing-uncovered'] as const;

/** The payload tables (`orbit-emit-composition`'s `The write gate checks decision records`). */
export const DECISION_PAYLOAD_FIELDS: Record<DecisionCommand, string[]> = {
  ledger: ['area', 'decided', 'alternatives', 'why', 'relies_on', 'raised_stop', 'defines', 'detail', 'replaces'],
  stop: ['condition', 'about', 'question', 'defines', 'detail', 'replaces'],
  resolution: ['stop', 'answer', 'effect', 'defines', 'detail', 'replaces'],
};

/**
 * The LINK FIELDS a replacement carries unchanged, per record, in the order a refusal names the first
 * that differs (`orbit-decision-records`' `A record is fixed by a replacement, never edited`).
 */
export const REPLACEMENT_LINK_FIELDS: Record<DecisionCommand, string[]> = {
  ledger: ['area', 'relies_on', 'raised_stop'],
  stop: ['condition'],
  resolution: ['stop'],
};

/**
 * The fields `Decision records are written for a reader who knows only the architecture` binds, per
 * record — the reader-facing list, as that requirement's table names them. `PLAIN_FIELDS` below is
 * the write gate's subset of it that must be a non-blank string (`alternatives` is checked as an array).
 */
export const READER_BOUND_FIELDS: Record<DecisionCommand, string[]> = {
  ledger: ['decided', 'alternatives', 'why'],
  stop: ['about', 'question'],
  resolution: ['answer', 'effect'],
};

/** The plain-language fields the write gate holds to a non-blank string (a subset of `READER_BOUND_FIELDS`). */
export const PLAIN_FIELDS: Record<DecisionCommand, string[]> = {
  ledger: ['decided', 'why'],
  stop: ['about', 'question'],
  resolution: ['answer', 'effect'],
};

/** The filename `<TS>` token form (the emit surface's: colons replaced by hyphens). */
const TOKEN = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/;
const STOP_FILENAME = /^stop-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/;
const RESOLUTION_FILENAME = /^resolution-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/;
/** Any decision record's filename, `<record>-<TS>.json`. */
export const RECORD_FILENAME = /^(ledger|stop|resolution)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/;

/** Where a record is being written, and the work it belongs to. */
export interface DecisionContext {
  projectRoot: string;
  /** Spine `change` (null when architecture-scoped). */
  change: string | null;
  /** Spine `doc` (null unless architecture-scoped). */
  doc: string | null;
  /** The `decisions/` folder the record lands in. */
  decisionsDir: string;
  /** The directory holding the work's `explore.md` — the change or exploration; null for a doc. */
  workDir: string | null;
}

function refuse(message: string): never {
  throw new DecisionRecordError(message);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function hasOwn(o: Record<string, unknown>, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

function nonBlank(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '';
}

function describe(v: unknown): string {
  return JSON.stringify(v) ?? String(v);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

function checkPlainFields(command: DecisionCommand, record: Record<string, unknown>): void {
  for (const f of PLAIN_FIELDS[command]) {
    if (!nonBlank(record[f])) {
      refuse(`'${f}' must be a non-blank string — a plain-language field is never empty (got ${describe(record[f])}).`);
    }
  }
  if (command === 'ledger') {
    const alts = record.alternatives;
    if (!Array.isArray(alts) || alts.length === 0) {
      refuse(`'alternatives' must be a non-empty array of non-blank strings (got ${describe(alts)}).`);
    }
    alts.forEach((a, i) => {
      if (!nonBlank(a)) refuse(`'alternatives[${i}]' must be a non-blank string (got ${describe(a)}).`);
    });
  }
}

/** The `defines` list check, shared with the account (`src/core/account.ts`). */
export function checkDefines(record: Record<string, unknown>): void {
  if (!hasOwn(record, 'defines')) return;
  const defs = record.defines;
  if (!Array.isArray(defs)) {
    refuse(`'defines' must be an array of {term, definition} objects (got ${describe(defs)}).`);
  }
  const terms = new Set<string>();
  defs.forEach((d, i) => {
    if (!isPlainObject(d)) refuse(`'defines[${i}]' must be an object {term, definition} (got ${describe(d)}).`);
    for (const k of Object.keys(d)) {
      if (k !== 'term' && k !== 'definition') refuse(`'defines[${i}]' carries unknown key '${k}' — an entry is {term, definition} and nothing else.`);
    }
    if (!nonBlank(d.term)) refuse(`'defines[${i}].term' must be a non-blank string (got ${describe(d.term)}).`);
    if (!nonBlank(d.definition)) refuse(`'defines[${i}].definition' must be a non-blank string — a listed term is defined (got ${describe(d.definition)}).`);
    const term = (d.term as string).trim();
    if (terms.has(term)) refuse(`'defines[${i}].term' repeats '${term}' — each term is defined once.`);
    terms.add(term);
  });
}

/** The `detail` check, shared with the account. */
export function checkDetail(record: Record<string, unknown>): void {
  if (hasOwn(record, 'detail') && typeof record.detail !== 'string') {
    refuse(`'detail' must be a string when present (got ${describe(record.detail)}).`);
  }
}

/** The shape checks every record passes, with no file read. */
export function checkDecisionShape(command: DecisionCommand, record: Record<string, unknown>): void {
  checkPlainFields(command, record);
  checkDefines(record);
  checkDetail(record);
  if (command === 'ledger') {
    if (typeof record.area !== 'string' || !(LEDGER_AREAS as readonly string[]).includes(record.area)) {
      refuse(`'area' ${describe(record.area)} is not one of the eighteen ledger areas: ${LEDGER_AREAS.join(', ')}.`);
    }
    if (!Array.isArray(record.relies_on)) {
      refuse(`'relies_on' must be an array of citations, or [] with 'raised_stop' (got ${describe(record.relies_on)}).`);
    }
    record.relies_on.forEach((c, i) => checkCitationShape(c, i));
    const empty = record.relies_on.length === 0;
    const named = hasOwn(record, 'raised_stop');
    if (empty && !named) {
      refuse(`'raised_stop' is required when 'relies_on' is empty — an entry relying on nothing names the stop it raised.`);
    }
    if (!empty && named) {
      refuse(`'raised_stop' is refused when 'relies_on' cites something — an entry cites what it relies on, or names its stop, never both.`);
    }
    if (named && (typeof record.raised_stop !== 'string' || !STOP_FILENAME.test(record.raised_stop))) {
      refuse(`'raised_stop' must name a stop record by its filename, stop-<TS>.json (got ${describe(record.raised_stop)}).`);
    }
  }
  if (command === 'stop') {
    if (record.condition === 'tripwire') {
      refuse(`'condition' 'tripwire' is refused from a payload — orbit raises a tripwire stop itself.`);
    }
    if (typeof record.condition !== 'string' || !(PAYLOAD_STOP_CONDITIONS as readonly string[]).includes(record.condition)) {
      refuse(`'condition' ${describe(record.condition)} is not one of: ${PAYLOAD_STOP_CONDITIONS.join(', ')}.`);
    }
  }
  if (command === 'resolution') {
    if (typeof record.stop !== 'string' || !STOP_FILENAME.test(record.stop)) {
      refuse(`'stop' must name a stop record by its filename, stop-<TS>.json (got ${describe(record.stop)}).`);
    }
  }
  if (hasOwn(record, 'replaces')) {
    const r = record.replaces;
    const own = new RegExp(`^${command}-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z\\.json$`);
    if (typeof r !== 'string' || !own.test(r)) {
      refuse(`'replaces' must name a ${command} record by its filename, ${command}-<TS>.json — a replacement is a record of the same kind (got ${describe(r)}).`);
    }
  }
}

/** The citation kinds of `relies_on` and the keys each is written with (`A ledger entry names what it relies on`). */
export const CITATION_SHAPES: Record<string, string[][]> = {
  requirement: [['kind', 'capability', 'title']],
  ruling: [['kind', 'doc', 'id']],
  goal: [['kind', 'doc', 'id']],
  resolution: [
    ['kind', 'change', 'token'],
    ['kind', 'doc', 'token'],
  ],
  decision: [['kind', 'id']],
};

function citationLabel(i: number): string {
  return `relies_on[${i}]`;
}

function checkCitationShape(c: unknown, i: number): void {
  const where = citationLabel(i);
  if (!isPlainObject(c)) refuse(`'${where}' must be a citation object (got ${describe(c)}).`);
  // Own properties only: an inherited key (`toString`, `constructor`, `__proto__`) is not a kind.
  const shapes = typeof c.kind === 'string' && hasOwn(CITATION_SHAPES, c.kind) ? CITATION_SHAPES[c.kind] : undefined;
  if (!shapes) {
    refuse(`'${where}' has kind ${describe(c.kind)} — a citation's kind is one of: ${Object.keys(CITATION_SHAPES).join(', ')}.`);
  }
  const keys = Object.keys(c).sort().join(',');
  if (!shapes.some(s => [...s].sort().join(',') === keys)) {
    refuse(`'${where}' ${describe(c)} is not a ${c.kind} citation — written as ${shapes.map(s => `{${s.join(', ')}}`).join(' or ')}.`);
  }
  for (const k of ['capability', 'doc', 'change'] as const) {
    if (hasOwn(c, k) && !isSingleName(c[k])) {
      refuse(`'${where}.${k}' ${describe(c[k])} is not a single name (no separator, no '..', not empty).`);
    }
  }
  for (const k of ['title', 'id'] as const) {
    if (hasOwn(c, k) && !nonBlank(c[k])) refuse(`'${where}.${k}' must be a non-blank string (got ${describe(c[k])}).`);
  }
  if (hasOwn(c, 'token') && (typeof c.token !== 'string' || !TOKEN.test(c.token))) {
    refuse(`'${where}.token' ${describe(c.token)} is not a filename token (YYYY-MM-DDTHH-MM-SSZ).`);
  }
}

// ---------------------------------------------------------------------------
// Existence
// ---------------------------------------------------------------------------

function readOrNull(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

/** Unfenced lines of a markdown file, through the one CommonMark fence grammar. */
function unfencedLines(content: string): string[] {
  const tracker = createFenceTracker();
  const out: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const wasInFence = tracker.inFence;
    const isDelimiter = tracker.handle(line);
    if (!wasInFence && !isDelimiter) out.push(line);
  }
  return out;
}

function requirementExists(projectRoot: string, capability: string, title: string): boolean {
  const content = readOrNull(path.join(projectRoot, 'orbit', 'specs', capability, 'spec.md'));
  if (content === null) return false;
  const want = title.trim();
  return unfencedLines(content).some(l => {
    const m = l.match(/^###\s+Requirement:\s*(.*\S)\s*$/);
    return m !== null && m[1] === want;
  });
}

function sectionLines(projectRoot: string, doc: string, section: string): string[] | null {
  const content = readOrNull(path.join(projectRoot, 'orbit', 'architecture', `${doc}.md`));
  if (content === null) return null;
  const s = collectSections(content).get(section);
  return s ? s.lines.filter(l => !l.fenced).map(l => l.text) : [];
}

function rulingExists(projectRoot: string, doc: string, id: string): boolean {
  const lines = sectionLines(projectRoot, doc, 'Rulings index');
  return lines !== null && lines.some(l => l.includes(`**${id}**`));
}

function goalExists(projectRoot: string, doc: string, id: string): boolean {
  const lines = sectionLines(projectRoot, doc, 'Goals');
  if (lines === null) return false;
  // The goal ID opens an item and matches whole: followed by a space, an em dash or `**`.
  const opener = new RegExp(`^(?:[-*+]|\\d+[.)])\\s+\\*\\*${escapeRegExp(id)}(?: |—|\\*\\*)`);
  return lines.some(l => opener.test(l));
}

function readJson(p: string): Record<string, unknown> | null {
  const raw = readOrNull(p);
  if (raw === null) return null;
  try {
    const j = JSON.parse(raw);
    return isPlainObject(j) ? j : null;
  } catch {
    return null;
  }
}

/**
 * The folders a `{change, token}` resolution citation is looked up in, in order: the active
 * change, the exploration of that name, then each archived change of that name, newest first.
 */
function resolutionFolders(projectRoot: string, change: string): string[] {
  const folders = [
    path.join(projectRoot, 'orbit', 'changes', change, '.orbit-runs', 'decisions'),
    path.join(projectRoot, 'orbit', 'explore', change, '.orbit-runs', 'decisions'),
  ];
  const archiveRoot = path.join(projectRoot, 'orbit', 'changes', 'archive');
  const pattern = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${escapeRegExp(change)}$`);
  let archived: string[] = [];
  try {
    archived = fs.readdirSync(archiveRoot).filter(e => pattern.test(e)).sort().reverse();
  } catch {
    archived = [];
  }
  for (const a of archived) folders.push(path.join(archiveRoot, a, '.orbit-runs', 'decisions'));
  return folders;
}

/** The file a `resolution` citation names, by `A ledger entry names what it relies on`'s lookup; null when none. */
function findResolutionFile(projectRoot: string, c: Record<string, unknown>): string | null {
  const filename = `resolution-${c.token as string}.json`;
  if (hasOwn(c, 'change')) {
    for (const folder of resolutionFolders(projectRoot, c.change as string)) {
      const candidate = path.join(folder, filename);
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  }
  const candidate = path.join(projectRoot, 'orbit', 'architecture', '.orbit-runs', 'decisions', filename);
  return fs.existsSync(candidate) ? candidate : null;
}

function checkResolutionCitation(ctx: DecisionContext, c: Record<string, unknown>, where: string): string {
  const file = findResolutionFile(ctx.projectRoot, c);
  if (file === null) refuse(`'${where}' ${describe(c)} resolves to no resolution record.`);
  const record = readJson(file);
  if (record === null) refuse(`'${where}' ${describe(c)} names ${file}, which cannot be read as a JSON record.`);
  if (record.command !== 'resolution') {
    refuse(`'${where}' ${describe(c)} names ${file}, whose command is ${describe(record.command)}, not a resolution.`);
  }
  if (hasOwn(c, 'doc') && record.doc !== c.doc) {
    refuse(`'${where}' ${describe(c)} names a resolution whose doc is ${describe(record.doc)}, not '${c.doc as string}'.`);
  }
  return file;
}

/**
 * Refuses a citation that points at nothing; returns the resolution file a `resolution` citation found, else null.
 * `carried` (the citation is a replacement's, equal to its original's) changes the `decision` check alone: the
 * original passed the live check when written, so a carried one needs only an entry the brief can still render.
 */
function checkCitationExists(ctx: DecisionContext, c: Record<string, unknown>, i: number, carried: boolean): string | null {
  const where = citationLabel(i);
  switch (c.kind) {
    case 'requirement':
      if (!requirementExists(ctx.projectRoot, c.capability as string, c.title as string)) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — orbit/specs/${c.capability as string}/spec.md holds no such requirement.`);
      }
      return null;
    case 'ruling':
      if (!rulingExists(ctx.projectRoot, c.doc as string, c.id as string)) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — orbit/architecture/${c.doc as string}.md holds no **${c.id as string}** under '## Rulings index'.`);
      }
      return null;
    case 'goal':
      if (!goalExists(ctx.projectRoot, c.doc as string, c.id as string)) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — orbit/architecture/${c.doc as string}.md opens no '## Goals' item with **${c.id as string}**.`);
      }
      return null;
    case 'resolution':
      return checkResolutionCitation(ctx, c, where);
    case 'decision': {
      if (ctx.workDir === null) {
        refuse(`'${where}' ${describe(c)}: a decision citation is refused on an architecture-scoped record, which has no explore.md.`);
      }
      const content = readOrNull(path.join(ctx.workDir, 'explore.md'));
      const id = c.id as string;
      const found = content !== null && (carried ? decisionEntryText(content, id) !== null : liveDecisionIds(content).has(id));
      if (!found) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — the work's explore.md holds no ${carried ? '' : 'live '}Decisions entry ${id}.`);
      }
      return null;
    }
  }
  return null;
}

/** The stop a ledger entry's `raised_stop` or a resolution's `stop` names, read from the same folder. */
function readNamedStop(ctx: DecisionContext, field: string, name: string): Record<string, unknown> {
  const stop = readJson(path.join(ctx.decisionsDir, name));
  if (stop === null) refuse(`'${field}' '${name}' names no readable stop record in ${ctx.decisionsDir}.`);
  if (stop.command !== 'stop') refuse(`'${field}' '${name}' names a record whose command is ${describe(stop.command)}, not a stop.`);
  if (stop.change !== ctx.change || (stop.doc ?? null) !== ctx.doc) {
    refuse(
      `'${field}' '${name}' names a stop belonging to other work (change ${describe(stop.change)}, doc ${describe(stop.doc ?? null)}; this record's are ${describe(ctx.change)}, ${describe(ctx.doc)}).`
    );
  }
  return stop;
}

// ---------------------------------------------------------------------------
// Replacement chains (`A record is fixed by a replacement, never edited`)
// ---------------------------------------------------------------------------

/** One `decisions/` folder read once: every record by filename, and which record replaces which. */
export interface DecisionFolder {
  dir: string;
  /** Every record filename in the folder, sorted; `null` for one that cannot be read as a JSON object. */
  records: Map<string, Record<string, unknown> | null>;
  /** old filename → the filename of the record whose `replaces` names it. */
  replacedBy: Map<string, string>;
}

export function readDecisionFolder(dir: string): DecisionFolder {
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir).filter(f => RECORD_FILENAME.test(f)).sort();
  } catch {
    names = [];
  }
  const records = new Map<string, Record<string, unknown> | null>();
  const replacedBy = new Map<string, string>();
  for (const n of names) {
    const r = readJson(path.join(dir, n));
    records.set(n, r);
    // The first replacement in filename order owns the link; the gate refuses a second.
    if (r !== null && typeof r.replaces === 'string' && !replacedBy.has(r.replaces)) replacedBy.set(r.replaces, n);
  }
  return { dir, records, replacedBy };
}

/** The latest record in the chain `name` belongs to, following `replaces` forward. */
export function latestInChain(folder: DecisionFolder, name: string): string {
  let cur = name;
  const seen = new Set<string>([cur]);
  for (let next = folder.replacedBy.get(cur); next !== undefined; next = folder.replacedBy.get(cur)) {
    if (seen.has(next)) break;
    seen.add(next);
    cur = next;
  }
  return cur;
}

/** Every record of the chain `name` belongs to: backward through `replaces`, then forward. */
export function chainOf(folder: DecisionFolder, name: string): string[] {
  const back: string[] = [];
  let cur: string | undefined = name;
  const seen = new Set<string>();
  while (cur !== undefined && !seen.has(cur)) {
    seen.add(cur);
    back.unshift(cur);
    const r = folder.records.get(cur);
    cur = r && typeof r.replaces === 'string' ? r.replaces : undefined;
  }
  const latest = latestInChain(folder, name);
  for (let c = name; c !== latest; ) {
    const next = folder.replacedBy.get(c) as string;
    if (seen.has(next)) break;
    seen.add(next);
    back.push(next);
    c = next;
  }
  return back;
}

/** Records belonging to the same work: equal `change` and equal `doc` (absent read as null). */
function sameWork(record: Record<string, unknown>, ctx: DecisionContext): boolean {
  return record.change === ctx.change && (record.doc ?? null) === ctx.doc;
}

/** Key-order-free equality for the link fields (a `relies_on` citation's keys may be written in any order). */
function canonical(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (isPlainObject(v)) {
    return `{${Object.keys(v)
      .sort()
      .map(k => `${JSON.stringify(k)}:${canonical(v[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

function checkReplaces(command: DecisionCommand, record: Record<string, unknown>, ctx: DecisionContext, folder: DecisionFolder): void {
  const name = record.replaces as string;
  if (!folder.records.has(name)) refuse(`'replaces' '${name}' names no record in ${ctx.decisionsDir}.`);
  const original = folder.records.get(name);
  if (original === null || original === undefined) refuse(`'replaces' '${name}' names a record that cannot be read as JSON.`);
  if (original.command !== command) {
    refuse(`'replaces' '${name}' names a record whose command is ${describe(original.command)} — a replacement is a ${command} record.`);
  }
  if (!sameWork(original, ctx)) {
    refuse(
      `'replaces' '${name}' names a record belonging to other work (change ${describe(original.change)}, doc ${describe(original.doc ?? null)}; this record's are ${describe(ctx.change)}, ${describe(ctx.doc)}).`
    );
  }
  const by = folder.replacedBy.get(name);
  if (by !== undefined) {
    refuse(`'replaces' '${name}' is already replaced by ${by} — a record is replaced once; replace ${latestInChain(folder, name)}, the latest in its chain.`);
  }
  for (const f of REPLACEMENT_LINK_FIELDS[command]) {
    if (canonical(record[f]) !== canonical(original[f])) {
      refuse(`'${f}' differs from ${name}'s — a replacement rewords and carries every link field (${REPLACEMENT_LINK_FIELDS[command].join(', ')}) unchanged.`);
    }
  }
}

/** A new link naming a replaced stop or resolution is refused, naming the latest in its chain. */
function refuseReplacedTarget(field: string, name: string, folder: DecisionFolder): void {
  const latest = latestInChain(folder, name);
  if (latest !== name) {
    refuse(`'${field}' '${name}' has been replaced — cite ${latest}, the latest record in its chain.`);
  }
}

/** The checks that read files: citations, and the stop a record names. Run after the shape checks. */
export function checkDecisionLinks(command: DecisionCommand, record: Record<string, unknown>, ctx: DecisionContext): void {
  const folder = readDecisionFolder(ctx.decisionsDir);
  // A replacement's link fields equal its original's (checked first), so every link it carries is
  // not new and is exempt from the replaced-target checks below.
  const carried = hasOwn(record, 'replaces');
  if (carried) checkReplaces(command, record, ctx, folder);
  if (command === 'ledger') {
    (record.relies_on as Record<string, unknown>[]).forEach((c, i) => {
      const found = checkCitationExists(ctx, c, i, carried);
      if (!carried && found !== null) {
        refuseReplacedTarget(citationLabel(i), path.basename(found), readDecisionFolder(path.dirname(found)));
      }
    });
    if (hasOwn(record, 'raised_stop')) {
      const name = record.raised_stop as string;
      const stop = readNamedStop(ctx, 'raised_stop', name);
      if (!(LEDGER_STOP_CONDITIONS as readonly string[]).includes(stop.condition as string)) {
        refuse(
          `'raised_stop' '${name}' has condition ${describe(stop.condition)} — an entry relying on nothing names a ${LEDGER_STOP_CONDITIONS.join(' or ')} stop.`
        );
      }
      if (!carried) refuseReplacedTarget('raised_stop', name, folder);
    }
  }
  if (command === 'resolution') {
    const name = record.stop as string;
    readNamedStop(ctx, 'stop', name);
    if (!carried) refuseReplacedTarget('stop', name, folder);
    // The at-most-one-resolution rule counts over the stop's WHOLE chain, one count per resolution
    // chain; the chain this payload replaces into is not a second.
    const stopChain = new Set(chainOf(folder, name));
    const ownChain = carried ? latestInChain(folder, record.replaces as string) : null;
    // Every resolution already naming the chain is named, so a duplicate two concurrent writers left
    // (the named limit in `Three decision records, one job each`) surfaces at the next resolution of it.
    const already = [...folder.records.entries()]
      .filter(([f, other]) => RESOLUTION_FILENAME.test(f) && other !== null && other.command === 'resolution')
      .filter(([, other]) => typeof other!.stop === 'string' && stopChain.has(other!.stop as string))
      .map(([f]) => f)
      .filter(f => ownChain === null || latestInChain(folder, f) !== ownChain);
    if (already.length > 0) {
      refuse(`'stop' '${name}' is already resolved by ${already.join(', ')} — a stop's chain has at most one resolution.`);
    }
  }
}

/** Every check on a decision record, in order: shape first, then the checks that read files. */
export function checkDecisionRecord(command: DecisionCommand, record: Record<string, unknown>, ctx: DecisionContext): void {
  checkDecisionShape(command, record);
  checkDecisionLinks(command, record, ctx);
}

// ---------------------------------------------------------------------------
// decision-reading: the selection and the brief
// (`orbit-decision-records`' `The reading step's brief is rendered by orbit`,
// `orbit-emit-composition`'s `The reading's selection is recorded at review and archive`)
// ---------------------------------------------------------------------------

/**
 * `The ledger's eighteen areas` — each area's name and what it covers, as the table words them.
 * Keyed by id, so an area without a row fails to compile. The brief renders an entry's row from here,
 * because an adopter's project holds neither orbit's specs nor its architecture.
 */
export const AREA_ROWS: Record<(typeof LEDGER_AREAS)[number], { area: string; covers: string }> = {
  'user-sees-or-does': { area: 'what the user sees or does', covers: 'screens, messages, command output, how a feature behaves' },
  defaults: { area: 'defaults', covers: 'what happens when the user sets nothing' },
  'when-things-go-wrong': { area: 'when things go wrong', covers: 'error handling the user meets: retries, fallbacks, failing loudly or quietly' },
  'user-data': { area: "the user's data", covers: 'how it is stored, kept, changed between versions, or deleted' },
  'things-others-build-on': { area: 'things others build on', covers: 'interfaces, file formats, anything another system depends on' },
  docs: { area: 'docs', covers: 'what the user is told' },
  'who-can-get-in': { area: 'who can get in', covers: 'logins, passwords, sessions, who may do what' },
  secrets: { area: 'secrets', covers: 'keys, tokens and credentials, and where they are kept' },
  'network-exposure': { area: 'exposure to the network', covers: 'what is reachable, and from where' },
  'trusting-input': { area: 'trusting input', covers: 'what outside input is believed without checking' },
  'new-dependencies': { area: 'new dependencies', covers: "adding someone else's code" },
  'permissions-and-sandboxing': { area: 'permissions and sandboxing', covers: 'what the software is allowed to touch' },
  encryption: { area: 'encryption', covers: 'how data is protected' },
  'personal-data-and-privacy': { area: 'personal data and privacy', covers: 'what is collected about people, and who sees it' },
  cost: { area: 'cost', covers: 'anything that spends money: paid APIs, cloud resources' },
  licensing: { area: 'licensing', covers: "a dependency's licence constraining what can be done with the result" },
  accessibility: { area: 'accessibility', covers: 'whether some users cannot use it' },
  'performance-user-feels': { area: 'performance the user feels', covers: 'responsiveness, speed and limits a user notices' },
};

/** Each stop condition's wording in `Three decision records, one job each`'s event table. */
export const CONDITION_WORDING: Record<(typeof STOP_CONDITIONS)[number], string> = {
  'security-unprecedented': 'a security-relevant call with nothing approved to rely on',
  'user-facing-uncovered': 'an end-user-visible call that no ratified goal covers',
  'ruling-amendment': 'amending a ratified ruling or goal',
  'outward-act': 'an outward or irreversible act the settings do not grant',
  tripwire: 'a sideways tripwire firing',
  'unresolvable-critical': 'a CRITICAL review finding that no edit inside the change resolves',
};

/** The four reader rows of `The plain-language rule is held by structure and by a reader`, in order. */
export const READER_ROWS: readonly string[] = [
  'a new term used in a plain field and left off the `defines` list',
  'a plain field that relies on implementation detail',
  'a plain field that is correct and still unclear',
  'a plain field that restates something the record cites so that its meaning shifts',
];

/** The severity rule of `orbit-review`'s `The reading step checks decision records in system review`. */
export const READER_SEVERITY_RULE =
  'A record a reader would misread, or whose restatement shifts what it cites, is a WARNING; one that only slows a reader is a SUGGESTION.';

const RECORD_KIND_NAME: Record<DecisionCommand | 'account', string> = {
  ledger: 'ledger entry',
  stop: 'stop record',
  resolution: 'resolution',
  account: "the change's account: what it built, its new seams, and where the work left its plan",
};

/** The plain fields the brief renders per record, in the order it renders them. */
const BRIEF_PLAIN_FIELDS: Record<DecisionCommand | 'account', string[]> = {
  account: ['built', 'seams', 'deviations'],
  ledger: ['decided', 'alternatives', 'why'],
  stop: ['about', 'question'],
  resolution: ['answer', 'effect'],
};

/** An in-context system review emit of a change's history (`review-system-<TS>.json`, class in-context). */
function inContextSystemReviews(runsDir: string): Record<string, unknown>[] {
  let names: string[] = [];
  try {
    names = fs.readdirSync(runsDir).filter(f => /^review-system-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/.test(f)).sort();
  } catch {
    names = [];
  }
  return names
    .map(n => readJson(path.join(runsDir, n)))
    .filter((j): j is Record<string, unknown> => j !== null && j.command === 'review' && j.mode === 'system' && j.reviewer_class === 'in-context');
}

/**
 * THE SELECTION — the one function the brief, the review emit's `decision_records_owed` and read-list
 * check, the archive emit's `decision_records_unread` and `orbit brief`'s unread section call: the latest
 * record in each replacement chain of the change's `decisions/` folder that no in-context system review
 * emit of the change's history lists in `decision_records_read`, and — only when the sign-off setting of
 * the project at `projectRoot` is `change` (`The reader takes the account only when sign-off is per
 * change`) — the latest record of the change's `account/` chain when no such emit lists it. No timestamp
 * is compared. A record that cannot be read is selected (its chain cannot be known), so the brief fails
 * naming it rather than hiding it; and a folder the selection reads that exists and cannot be listed throws a
 * `DecisionBriefError` naming it, so a failure is never read as an empty selection (an absent folder is empty).
 */
export function selectUnreadRecords(changeDir: string, projectRoot: string): string[] {
  const runsDir = path.join(changeDir, '.orbit-runs');
  assertListable(path.join(runsDir, 'decisions'));
  const folder = readDecisionFolder(path.join(runsDir, 'decisions'));
  const read = new Set<string>();
  for (const r of inContextSystemReviews(runsDir)) {
    if (Array.isArray(r.decision_records_read)) {
      for (const f of r.decision_records_read) if (typeof f === 'string') read.add(f);
    }
  }
  const selected = [...folder.records.keys()].filter(f => !folder.replacedBy.has(f) && !read.has(f));
  if (resolveSignoffSetting(projectRoot).value === 'change') {
    assertListable(path.join(runsDir, ACCOUNT_DIR));
    const account = latestAccount(readAccountFolder(path.join(runsDir, ACCOUNT_DIR)));
    if (account !== null && !read.has(account)) selected.push(account);
  }
  return selected;
}

/** An absent folder reads as empty; one that exists and cannot be listed fails the selection, naming it. */
function assertListable(dir: string): void {
  try {
    fs.readdirSync(dir);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return;
    throw new DecisionBriefError(`the folder ${dir} cannot be listed (${code ?? (err as Error).message}), so the records it holds cannot be selected.`);
  }
}

/** A filename the selection can hold: a decision record's, or (under `signoff: change`) an account's. */
export function isSelectableFilename(f: string): boolean {
  return RECORD_FILENAME.test(f) || ACCOUNT_FILENAME.test(f);
}

export class DecisionBriefError extends Error {}

function briefFail(message: string): never {
  throw new DecisionBriefError(message);
}

/** What one citation of a selected record points at, as the brief renders it. */
export type BriefCitation =
  | { kind: 'requirement'; capability: string; title: string; text: string }
  | { kind: 'ruling' | 'goal'; doc: string; id: string }
  | { kind: 'resolution'; record: string; answer: string; effect: string }
  | { kind: 'decision'; id: string; text: string };

export interface BriefRecord {
  filename: string;
  /** The record's kind: a decision record's command, or `account` for an account the selection took. */
  record: DecisionCommand | 'account';
  timestamp: string;
  work: string;
  fields: Record<string, unknown>;
  defines: { term: string; definition: string }[];
  detail: string | null;
  area?: { id: string; area: string; covers: string };
  condition?: { id: string; wording: string };
  cites: BriefCitation[];
  /** `record` as the record names it; `current`, when that stop was replaced, the latest in its chain, whose wording is shown. */
  named_stop?: { record: string; current?: string; about: string; question: string };
}

export interface DecisionBrief {
  change: string;
  selected: string[];
  docs: { doc: string; text: string }[];
  records: BriefRecord[];
  task: { rows: readonly string[]; severity: string; baseline: string; returns: string };
}

const BASELINE_NOTE =
  "A cited requirement's text is the project's baseline spec, which the record was checked against when it was written; the work may be changing that requirement.";

const RETURN_SHAPE =
  'Return one finding per record and row: the record by its filename, the row (1–4, as numbered above), the field, what a reader would take it to mean, and its severity. A record with nothing wanting gets no finding. If every record reads clearly, say so.';

/** A requirement's text from its heading to its first scenario, in the baseline spec; null when absent. */
function requirementText(projectRoot: string, capability: string, title: string): string | null {
  const content = readOrNull(path.join(projectRoot, 'orbit', 'specs', capability, 'spec.md'));
  if (content === null) return null;
  const tracker = createFenceTracker();
  const out: string[] = [];
  let inside = false;
  for (const line of content.split(/\r?\n/)) {
    const wasInFence = tracker.inFence;
    const isDelimiter = tracker.handle(line);
    const structural = !wasInFence && !isDelimiter;
    if (structural) {
      const m = line.match(/^###\s+Requirement:\s*(.*\S)\s*$/);
      if (inside && (/^####\s+Scenario:/.test(line) || /^#{1,3}\s/.test(line))) break;
      if (!inside && m !== null && m[1] === title.trim()) inside = true;
    }
    if (inside) out.push(line);
  }
  return inside ? out.join('\n').trimEnd() : null;
}

function architectureDocOf(changeDir: string): string | null {
  const raw = readOrNull(path.join(changeDir, '.openspec.yaml'));
  if (raw === null) return null;
  try {
    const meta = parseYaml(raw) as { architecture?: { doc?: unknown } } | null;
    const doc = meta?.architecture?.doc;
    return typeof doc === 'string' && doc.trim() !== '' ? doc : null;
  } catch {
    return null;
  }
}

/**
 * Build the brief for `change` (an active change). Whole or absent: any source that does not resolve
 * throws a `DecisionBriefError` naming it, and nothing is returned.
 */
export function buildDecisionBrief(projectRoot: string, change: string): DecisionBrief {
  if (!isSingleName(change)) briefFail(`'${change}' is not a single change name.`);
  const changeDir = path.join(projectRoot, 'orbit', 'changes', change);
  if (!fs.existsSync(changeDir)) briefFail(`change '${change}' not found at orbit/changes/${change}.`);
  const folder = readDecisionFolder(path.join(changeDir, '.orbit-runs', 'decisions'));
  const accounts = readAccountFolder(path.join(changeDir, '.orbit-runs', ACCOUNT_DIR));
  const selected = selectUnreadRecords(changeDir, projectRoot);
  const task = { rows: READER_ROWS, severity: READER_SEVERITY_RULE, baseline: BASELINE_NOTE, returns: RETURN_SHAPE };
  if (selected.length === 0) return { change, selected, docs: [], records: [], task };

  const docNames: string[] = [];
  const addDoc = (d: string): void => {
    if (!docNames.includes(d)) docNames.push(d);
  };
  const own = architectureDocOf(changeDir);
  if (own !== null) addDoc(own);

  const records: BriefRecord[] = [];
  for (const filename of selected) {
    const isAccount = ACCOUNT_FILENAME.test(filename);
    const r = isAccount ? accounts.records.get(filename) : folder.records.get(filename);
    if (r === null || r === undefined) briefFail(`record ${filename} cannot be read as a JSON object.`);
    if (isAccount) {
      // An account is a record of its own kind: its plain fields, its terms and its detail; it cites nothing.
      if (r.command !== 'account') briefFail(`record ${filename} carries command ${describe(r.command)}, not account.`);
      const fields: Record<string, unknown> = {};
      for (const f of BRIEF_PLAIN_FIELDS.account) fields[f] = r[f];
      records.push({
        filename,
        record: 'account',
        timestamp: String(r.timestamp ?? ''),
        work: `change ${String(r.change ?? change)}`,
        fields,
        defines: Array.isArray(r.defines)
          ? (r.defines as Record<string, unknown>[]).map(d => ({ term: String(d.term), definition: String(d.definition) }))
          : [],
        detail: typeof r.detail === 'string' ? r.detail : null,
        cites: [],
      });
      continue;
    }
    const command = r.command;
    if (typeof command !== 'string' || !isDecisionCommand(command) || !filename.startsWith(`${command}-`)) {
      briefFail(`record ${filename} carries command ${describe(command)}, not its filename's kind.`);
    }
    const fields: Record<string, unknown> = {};
    for (const f of BRIEF_PLAIN_FIELDS[command]) fields[f] = r[f];
    const defines = Array.isArray(r.defines)
      ? (r.defines as Record<string, unknown>[]).map(d => ({ term: String(d.term), definition: String(d.definition) }))
      : [];
    const work = typeof r.doc === 'string' ? `architecture doc ${r.doc}` : `change ${String(r.change ?? change)}`;
    const entry: BriefRecord = {
      filename,
      record: command,
      timestamp: String(r.timestamp ?? ''),
      work,
      fields,
      defines,
      detail: typeof r.detail === 'string' ? r.detail : null,
      cites: [],
    };
    if (command === 'ledger') {
      const area = r.area as (typeof LEDGER_AREAS)[number];
      const row = hasOwn(AREA_ROWS, String(area)) ? AREA_ROWS[area] : undefined;
      if (!row) briefFail(`record ${filename} names area ${describe(r.area)}, which is not a ledger area.`);
      entry.area = { id: area, ...row };
      const cites = Array.isArray(r.relies_on) ? (r.relies_on as Record<string, unknown>[]) : [];
      cites.forEach((c, i) => {
        const where = `${filename} relies_on[${i}] ${describe(c)}`;
        switch (c.kind) {
          case 'requirement': {
            const text = requirementText(projectRoot, String(c.capability), String(c.title));
            if (text === null) briefFail(`${where} resolves to no requirement in the baseline spec.`);
            entry.cites.push({ kind: 'requirement', capability: String(c.capability), title: String(c.title), text });
            return;
          }
          case 'ruling':
          case 'goal':
            addDoc(String(c.doc));
            entry.cites.push({ kind: c.kind, doc: String(c.doc), id: String(c.id) });
            return;
          case 'resolution': {
            const file = findResolutionFile(projectRoot, c);
            if (file === null) briefFail(`${where} resolves to no resolution record.`);
            const latest = latestInChain(readDecisionFolder(path.dirname(file)), path.basename(file));
            const res = readJson(path.join(path.dirname(file), latest));
            if (res === null || res.command !== 'resolution') briefFail(`${where} names ${latest}, which cannot be read as a resolution.`);
            entry.cites.push({ kind: 'resolution', record: latest, answer: String(res.answer), effect: String(res.effect) });
            return;
          }
          case 'decision': {
            const content = readOrNull(path.join(changeDir, 'explore.md'));
            const text = content === null ? null : decisionEntryText(content, String(c.id));
            if (text === null) briefFail(`${where} resolves to no Decisions entry in the change's explore.md.`);
            entry.cites.push({ kind: 'decision', id: String(c.id), text });
            return;
          }
          default:
            briefFail(`${where} is not a citation kind the brief renders.`);
        }
      });
    }
    if (command === 'stop') {
      const cond = r.condition as (typeof STOP_CONDITIONS)[number];
      if (!hasOwn(CONDITION_WORDING, String(cond))) briefFail(`record ${filename} names condition ${describe(r.condition)}, which is not a stop condition.`);
      entry.condition = { id: cond, wording: CONDITION_WORDING[cond] };
    }
    const stopName = command === 'ledger' ? r.raised_stop : command === 'resolution' ? r.stop : undefined;
    if (typeof stopName === 'string') {
      // The latest in the stop's chain is the current one (`A record is fixed by a replacement, never edited`).
      const current = latestInChain(folder, stopName);
      const stop = folder.records.get(current);
      if (stop === null || stop === undefined || stop.command !== 'stop') briefFail(`record ${filename} names stop ${current}, which cannot be read as a stop record.`);
      entry.named_stop = {
        record: stopName,
        ...(current !== stopName ? { current } : {}),
        about: String(stop.about),
        question: String(stop.question),
      };
    }
    records.push(entry);
  }

  const docs = docNames.map(d => {
    if (!isSingleName(d)) briefFail(`architecture doc name ${describe(d)} is not a single name.`);
    const text = readOrNull(path.join(projectRoot, 'orbit', 'architecture', `${d}.md`));
    if (text === null) briefFail(`architecture doc '${d}' cannot be read at orbit/architecture/${d}.md.`);
    return { doc: d, text };
  });
  return { change, selected, docs, records, task };
}

/** A fence longer than any backtick run in `text`, so quoted text renders whole. */
function quote(text: string): string {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map(m => m[0].length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}markdown\n${text}\n${fence}`;
}

const q = (s: string): string => `\`${s}\``;

function renderFieldValue(v: unknown): string {
  if (Array.isArray(v)) return '\n' + v.map(x => `  - ${String(x)}`).join('\n');
  return ` ${String(v)}`;
}

/** The brief as markdown: the text the reading step's reader is given, verbatim. */
export function renderDecisionBrief(brief: DecisionBrief): string {
  if (brief.selected.length === 0) {
    return `# Decision records to read — ${brief.change}\n\nNothing to read: every decision record of change ${q(brief.change)} has been read, or it has none.\n`;
  }
  const out: string[] = [];
  out.push(`# Decision records to read — ${brief.change}`, '');
  out.push(
    "You are reading the decision records an AI wrote while working on this change. Each record is written for a reader who knows the program's architecture doc and nothing else, together with what the record points at, which is shown under it. You know only what this brief carries; it points you at no file to open. Judge whether each record makes sense to that reader. Your task is at the end.",
    ''
  );
  if (brief.records.some(r => r.record === 'account')) {
    out.push(
      "One of them is the change's account, which the user reads before signing off on the change: what the change built, the new places the user is asked something, and where the work left its plan. It cites nothing; read it by the same rules.",
      ''
    );
  }
  if (brief.docs.length === 0) {
    out.push('## The architecture doc', '', 'This change cites no architecture doc, so you know none: judge each record against what it carries alone.', '');
  }
  for (const d of brief.docs) {
    out.push(`## The architecture doc: ${d.doc}`, '', quote(d.text.trimEnd()), '');
  }
  out.push('## The records', '');
  for (const r of brief.records) {
    out.push(`### ${r.filename}`, '');
    out.push(`- Kind: ${RECORD_KIND_NAME[r.record]}`);
    out.push(`- Written: ${r.timestamp}, in ${r.work}`);
    if (r.area) out.push(`- Area: ${q(r.area.id)} — ${r.area.area}: ${r.area.covers}`);
    if (r.condition) out.push(`- Condition: ${q(r.condition.id)} — ${r.condition.wording}`);
    for (const [k, v] of Object.entries(r.fields)) out.push(`- ${k}:${renderFieldValue(v)}`);
    if (r.defines.length > 0) {
      out.push('- defines:');
      for (const d of r.defines) out.push(`  - ${d.term}: ${d.definition}`);
    }
    if (r.detail !== null) out.push(`- detail (not bound by the plain-language rule; may be technical):${renderFieldValue(r.detail)}`);
    if (r.named_stop) {
      const named = r.named_stop.current
        ? `It names the stop ${r.named_stop.record}, since reworded as ${r.named_stop.current}:`
        : `It names the stop ${r.named_stop.record}:`;
      out.push('', named, '', `- about: ${r.named_stop.about}`, `- question: ${r.named_stop.question}`);
    }
    if (r.cites.length > 0) {
      out.push('', 'What it relies on:', '');
      for (const c of r.cites) {
        switch (c.kind) {
          case 'requirement':
            out.push(`- Requirement ${q(c.title)} of capability ${q(c.capability)}:`, '', quote(c.text), '');
            break;
          case 'ruling':
          case 'goal':
            out.push(`- ${c.kind === 'ruling' ? 'Ruling' : 'Goal'} ${c.id} of ${q(c.doc)}: in the architecture doc above.`);
            break;
          case 'resolution':
            out.push(`- The resolution ${c.record}:`, `  - answer: ${c.answer}`, `  - effect: ${c.effect}`);
            break;
          case 'decision':
            out.push(`- Explore decision ${c.id}:`, '', quote(c.text), '');
            break;
        }
      }
    }
    out.push('');
  }
  out.push('## Your task', '');
  out.push("For each record above, find any plain field that fails a reader in one of these four ways (the `detail` field is not bound):", '');
  brief.task.rows.forEach((row, i) => out.push(`${i + 1}. ${row}`));
  out.push('', brief.task.severity, '', brief.task.baseline, '', brief.task.returns, '');
  return out.join('\n');
}
