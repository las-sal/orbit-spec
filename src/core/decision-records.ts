import * as fs from 'node:fs';
import * as path from 'node:path';
import { collectSections } from './parsers/explore-counter.js';
import { liveDecisionIds } from './parsers/explore-rules.js';
import { createFenceTracker } from './markdown-fence.js';
import { isSingleName } from './containment.js';

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
  ledger: ['area', 'decided', 'alternatives', 'why', 'relies_on', 'raised_stop', 'defines', 'detail'],
  stop: ['condition', 'about', 'question', 'defines', 'detail'],
  resolution: ['stop', 'answer', 'effect', 'defines', 'detail'],
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

function checkDefines(record: Record<string, unknown>): void {
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

function checkDetail(record: Record<string, unknown>): void {
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

function checkResolutionCitation(ctx: DecisionContext, c: Record<string, unknown>, where: string): void {
  const filename = `resolution-${c.token as string}.json`;
  let file: string | null = null;
  if (hasOwn(c, 'change')) {
    for (const folder of resolutionFolders(ctx.projectRoot, c.change as string)) {
      const candidate = path.join(folder, filename);
      if (fs.existsSync(candidate)) {
        file = candidate;
        break;
      }
    }
  } else {
    const candidate = path.join(ctx.projectRoot, 'orbit', 'architecture', '.orbit-runs', 'decisions', filename);
    if (fs.existsSync(candidate)) file = candidate;
  }
  if (file === null) refuse(`'${where}' ${describe(c)} resolves to no resolution record.`);
  const record = readJson(file);
  if (record === null) refuse(`'${where}' ${describe(c)} names ${file}, which cannot be read as a JSON record.`);
  if (record.command !== 'resolution') {
    refuse(`'${where}' ${describe(c)} names ${file}, whose command is ${describe(record.command)}, not a resolution.`);
  }
  if (hasOwn(c, 'doc') && record.doc !== c.doc) {
    refuse(`'${where}' ${describe(c)} names a resolution whose doc is ${describe(record.doc)}, not '${c.doc as string}'.`);
  }
}

function checkCitationExists(ctx: DecisionContext, c: Record<string, unknown>, i: number): void {
  const where = citationLabel(i);
  switch (c.kind) {
    case 'requirement':
      if (!requirementExists(ctx.projectRoot, c.capability as string, c.title as string)) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — orbit/specs/${c.capability as string}/spec.md holds no such requirement.`);
      }
      return;
    case 'ruling':
      if (!rulingExists(ctx.projectRoot, c.doc as string, c.id as string)) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — orbit/architecture/${c.doc as string}.md holds no **${c.id as string}** under '## Rulings index'.`);
      }
      return;
    case 'goal':
      if (!goalExists(ctx.projectRoot, c.doc as string, c.id as string)) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — orbit/architecture/${c.doc as string}.md opens no '## Goals' item with **${c.id as string}**.`);
      }
      return;
    case 'resolution':
      checkResolutionCitation(ctx, c, where);
      return;
    case 'decision': {
      if (ctx.workDir === null) {
        refuse(`'${where}' ${describe(c)}: a decision citation is refused on an architecture-scoped record, which has no explore.md.`);
      }
      const content = readOrNull(path.join(ctx.workDir, 'explore.md'));
      if (content === null || !liveDecisionIds(content).has(c.id as string)) {
        refuse(`'${where}' ${describe(c)} resolves to nothing — the work's explore.md holds no live Decisions entry ${c.id as string}.`);
      }
      return;
    }
  }
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

/** The checks that read files: citations, and the stop a record names. Run after the shape checks. */
export function checkDecisionLinks(command: DecisionCommand, record: Record<string, unknown>, ctx: DecisionContext): void {
  if (command === 'ledger') {
    (record.relies_on as Record<string, unknown>[]).forEach((c, i) => checkCitationExists(ctx, c, i));
    if (hasOwn(record, 'raised_stop')) {
      const name = record.raised_stop as string;
      const stop = readNamedStop(ctx, 'raised_stop', name);
      if (!(LEDGER_STOP_CONDITIONS as readonly string[]).includes(stop.condition as string)) {
        refuse(
          `'raised_stop' '${name}' has condition ${describe(stop.condition)} — an entry relying on nothing names a ${LEDGER_STOP_CONDITIONS.join(' or ')} stop.`
        );
      }
    }
  }
  if (command === 'resolution') {
    const name = record.stop as string;
    readNamedStop(ctx, 'stop', name);
    let siblings: string[] = [];
    try {
      siblings = fs.readdirSync(ctx.decisionsDir).filter(f => RESOLUTION_FILENAME.test(f));
    } catch {
      siblings = [];
    }
    // Every resolution already naming the stop is named, so a duplicate two concurrent writers left
    // (the named limit in `Three decision records, one job each`) surfaces at the next resolution of it.
    const already = siblings.sort().filter(f => {
      const other = readJson(path.join(ctx.decisionsDir, f));
      return other !== null && other.command === 'resolution' && other.stop === name;
    });
    if (already.length > 0) {
      refuse(`'stop' '${name}' is already resolved by ${already.join(', ')} — a stop has at most one resolution.`);
    }
  }
}

/** Every check on a decision record, in order: shape first, then the checks that read files. */
export function checkDecisionRecord(command: DecisionCommand, record: Record<string, unknown>, ctx: DecisionContext): void {
  checkDecisionShape(command, record);
  checkDecisionLinks(command, record, ctx);
}
