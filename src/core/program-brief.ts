/**
 * The BRIEF of a change or of a program (stage `program-brief` of `automate-dev-flow`, `orbit-program-brief`):
 * what the work did, composed from what the trail already holds — the latest account, the archive record,
 * the delta specs, the latest record of each decision-record chain, the selection of records no reader
 * checked, and the proposal's `## Size` section — rendered as markdown for a reader who knows only the
 * program's architecture doc, and as data.
 *
 * Whole or absent, as `orbit decisions brief` is: every source that cannot be read or is not valid throws
 * a `ProgramBriefError` naming it, and nothing is returned. A brief says only what the archive recorded
 * (`A brief says only what the archive recorded`): its sync lines and the archive's own signals follow the
 * change's archive record, never an inference.
 *
 * The save (`A change's brief is saved, never overwritten`) writes the render's exact bytes into the active
 * change's `.orbit-runs/brief/` through the emit surface's no-overwrite publish.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import { isSingleName } from './containment.js';
import { findArchivedDir } from './archived-change.js';
import {
  AREA_ROWS,
  DecisionBriefError,
  DecisionRecordError,
  RECORD_FILENAME,
  chainOf,
  checkDecisionShape,
  isDecisionCommand,
  latestInChain,
  readDecisionFolder,
  selectUnreadRecords,
  type DecisionCommand,
  type DecisionFolder,
} from './decision-records.js';
import { ACCOUNT_DIR, AccountError, checkAccountShape, latestAccount, readAccountFolder } from './account.js';
import { resolveSignoffSetting } from './project-config.js';
import { parseDeltaSpec } from './parsers/requirement-blocks.js';
import { readSizeDeclaration, type SizeDimension } from './change-size.js';
import { loadArchitectureDoc, isValidDocName } from './architecture/parser.js';
import { EmitError, publishTrailChildText } from './emit-composition.js';

export class ProgramBriefError extends Error {}

function fail(message: string): never {
  throw new ProgramBriefError(message);
}

/** The trail child a change's saved briefs are kept in. */
export const BRIEF_DIR = 'brief';

/** A saved brief's filename, `brief-<TS>.md`. */
export const BRIEF_FILENAME = /^brief-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.md$/;

const ARCHIVE_RECORD = /^archive-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/;
const TOKEN_IN = /(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/;
const DATED_DIR = /^\d{4}-\d{2}-\d{2}-(.+)$/;

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

export interface BriefTerm {
  term: string;
  definition: string;
  /** The records that define the term this way, oldest first (a decision record's or the account's filename). */
  records: string[];
}

export type BriefCitationName =
  | { kind: 'requirement'; capability: string; title: string }
  | { kind: 'ruling' | 'goal'; doc: string; id: string }
  | { kind: 'resolution'; work: string; token: string }
  | { kind: 'decision'; id: string };

export interface BriefLedgerEntry {
  record: string;
  timestamp: string;
  area: { id: string; name: string };
  decided: string;
  alternatives: string[];
  why: string;
  relies_on: BriefCitationName[];
  /** The stop the entry raised, when it relies on nothing: as named, and its current record when replaced. */
  raised_stop: { record: string; current: string } | null;
}

export interface BriefStop {
  record: string;
  timestamp: string;
  condition: string;
  about: string;
  question: string;
  /** The latest resolution naming any record of the stop's chain; null when the stop is open. */
  resolution: { record: string; answer: string; effect: string } | null;
}

export interface BriefDecisions {
  terms: BriefTerm[];
  ledger: BriefLedgerEntry[];
  stops: BriefStop[];
}

/** What the change's archive record says, by `A brief says only what the archive recorded`'s rows. */
export type BriefArchive =
  | { state: 'active' }
  | {
      state: 'synced';
      record: string;
      capabilities_updated: string[] | null;
      counts: { added: number | null; modified: number | null; removed: number | null; renamed: number | null };
      warnings: string[];
      accepted: { claim: string; why: string }[];
    }
  | { state: 'not-synced'; record: string; skipped_reason: string | null; warnings: string[]; accepted: { claim: string; why: string }[] }
  /** A record that states the sync in none of the shapes the brief reads: it says what it says of the rest. */
  | { state: 'unstated'; record: string; warnings: string[]; accepted: { claim: string; why: string }[] }
  | { state: 'no-record' };

export interface BriefCapability {
  capability: string;
  added: string[];
  modified: string[];
  removed: string[];
  renamed: { from: string; to: string }[];
}

export interface ChangeBrief {
  unit: 'change';
  change: string;
  status: 'active' | 'archived';
  /** Repo-relative directory of the change. */
  path: string;
  program: { doc: string; stage: string | null } | null;
  /** The latest account's filename, or null when none was written. */
  account: string | null;
  built: string | null;
  capabilities: BriefCapability[];
  archive: BriefArchive;
  terms: BriefTerm[];
  seams: string | null;
  ledger: BriefLedgerEntry[];
  stops: BriefStop[];
  tripwires: 'not-installed';
  deviations: { account: string | null; size_breached: SizeDimension[] };
  /** `records`: the selection; `account`: the latest account named apart, only when the reader does not take it. */
  unread: { records: string[]; account: string | null };
}

export interface ProgramStageGroup {
  /** The stage id the changes cite; null for the changes that name no stage. */
  stage: string | null;
  /** The stage's title, when the doc declares it. */
  title: string | null;
  declared: boolean;
  changes: ChangeBrief[];
}

export interface ProgramBrief {
  unit: 'program';
  doc: string;
  groups: ProgramStageGroup[];
  architecture: BriefDecisions;
  tripwires: 'not-installed';
}

// ---------------------------------------------------------------------------
// Reading the sources
// ---------------------------------------------------------------------------

function rel(projectRoot: string, p: string): string {
  return path.relative(projectRoot, p).split(path.sep).join('/');
}

function tokenOf(filename: string): string {
  const m = filename.match(TOKEN_IN);
  return m ? m[1] : '';
}

/** Oldest first, by the filename's token, then the filename. */
function byToken(a: string, b: string): number {
  const ta = tokenOf(a);
  const tb = tokenOf(b);
  return ta < tb ? -1 : ta > tb ? 1 : a < b ? -1 : a > b ? 1 : 0;
}

/**
 * A directory's entries; an ABSENT directory is an empty one, and any other failure to list it (a permission or
 * I/O error, a file where a folder belongs) fails the brief naming it, so unreadable history is never shown as none.
 */
function listDir(projectRoot: string, dir: string, what: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    fail(`${what} ${rel(projectRoot, dir)} cannot be listed (${(e as NodeJS.ErrnoException).code ?? 'error'}).`);
  }
}

/** A change's citation. Absent metadata cites nothing; metadata present but unreadable fails the brief naming it. */
function readMeta(projectRoot: string, dir: string): { doc: string; stage: string | null } | null {
  const metaPath = path.join(dir, '.openspec.yaml');
  if (!fs.existsSync(metaPath)) return null;
  let meta: { architecture?: { doc?: unknown; stage?: unknown } } | null;
  try {
    meta = parseYaml(fs.readFileSync(metaPath, 'utf-8')) as typeof meta;
  } catch {
    fail(`change metadata ${rel(projectRoot, metaPath)} cannot be read as YAML.`);
  }
  const arch = meta !== null && typeof meta === 'object' ? meta.architecture : undefined;
  if (!arch || typeof arch.doc !== 'string' || arch.doc.trim() === '') return null;
  return { doc: arch.doc, stage: typeof arch.stage === 'string' && arch.stage.trim() !== '' ? arch.stage : null };
}

/**
 * A `decisions/` folder, every record held to the write gate's shape: a record that cannot be read, whose
 * `command` is not its filename's kind, or that the gate would refuse fails the brief naming it.
 */
function readValidDecisions(
  projectRoot: string,
  dir: string,
  keep: (r: Record<string, unknown>) => boolean = () => true
): DecisionFolder {
  listDir(projectRoot, dir, 'decision records folder');
  const folder = readDecisionFolder(dir);
  for (const [name, record] of folder.records) {
    const where = `${rel(projectRoot, path.join(dir, name))}`;
    // An unreadable record's work cannot be known, so it fails every brief that reads this folder.
    if (record === null) fail(`record ${where} cannot be read as a JSON object.`);
    if (!keep(record)) continue;
    const kind = name.slice(0, name.indexOf('-'));
    if (record.command !== kind || !isDecisionCommand(kind)) fail(`record ${where} carries command ${JSON.stringify(record.command)}, not its filename's kind.`);
    try {
      checkDecisionShape(kind, record);
    } catch (e) {
      if (e instanceof DecisionRecordError) fail(`record ${where} is not a valid ${kind} record: ${e.message}`);
      throw e;
    }
  }
  return folder;
}

function heads(folder: DecisionFolder, kind: DecisionCommand, keep: (r: Record<string, unknown>) => boolean = () => true): string[] {
  return [...folder.records.keys()]
    .filter(n => n.startsWith(`${kind}-`) && !folder.replacedBy.has(n) && keep(folder.records.get(n) as Record<string, unknown>))
    .sort(byToken);
}

function citationName(c: Record<string, unknown>): BriefCitationName {
  switch (c.kind) {
    case 'requirement':
      return { kind: 'requirement', capability: String(c.capability), title: String(c.title) };
    case 'ruling':
    case 'goal':
      return { kind: c.kind, doc: String(c.doc), id: String(c.id) };
    case 'resolution':
      return { kind: 'resolution', work: typeof c.doc === 'string' ? `architecture doc ${c.doc}` : `change ${String(c.change)}`, token: String(c.token) };
    default:
      return { kind: 'decision', id: String(c.id) };
  }
}

/**
 * The ledger and the stops of one folder: the latest record of each chain, oldest first; `keep` narrows to
 * one work's records (the architecture trail is shared by every doc).
 */
function readDecisions(folder: DecisionFolder, keep: (r: Record<string, unknown>) => boolean): { ledger: BriefLedgerEntry[]; stops: BriefStop[]; heads: string[] } {
  const rec = (n: string): Record<string, unknown> => folder.records.get(n) as Record<string, unknown>;
  const ledger = heads(folder, 'ledger', keep).map((n): BriefLedgerEntry => {
    const r = rec(n);
    const area = String(r.area) as keyof typeof AREA_ROWS;
    const raised = typeof r.raised_stop === 'string' ? r.raised_stop : null;
    return {
      record: n,
      timestamp: String(r.timestamp ?? ''),
      area: { id: area, name: AREA_ROWS[area].area },
      decided: String(r.decided),
      alternatives: (r.alternatives as unknown[]).map(String),
      why: String(r.why),
      relies_on: (r.relies_on as Record<string, unknown>[]).map(citationName),
      raised_stop: raised === null ? null : { record: raised, current: latestInChain(folder, raised) },
    };
  });
  const resolutions = heads(folder, 'resolution', keep);
  const stops = heads(folder, 'stop', keep).map((n): BriefStop => {
    const r = rec(n);
    const chain = new Set(chainOf(folder, n));
    const answering = resolutions.filter(res => chain.has(String(rec(res).stop)));
    const latest = answering.length > 0 ? answering[answering.length - 1] : null;
    return {
      record: n,
      timestamp: String(r.timestamp ?? ''),
      condition: String(r.condition),
      about: String(r.about),
      question: String(r.question),
      resolution: latest === null ? null : { record: latest, answer: String(rec(latest).answer), effect: String(rec(latest).effect) },
    };
  });
  return { ledger, stops, heads: [...heads(folder, 'ledger', keep), ...heads(folder, 'stop', keep), ...resolutions].sort(byToken) };
}

/** Each distinct term and definition, once, naming the records that define it; by term, then earliest record. */
function collectTerms(sources: { record: string; defines: unknown }[]): BriefTerm[] {
  const byKey = new Map<string, BriefTerm>();
  for (const s of [...sources].sort((a, b) => byToken(a.record, b.record))) {
    if (!Array.isArray(s.defines)) continue;
    for (const d of s.defines as { term: string; definition: string }[]) {
      const term = d.term.trim();
      const definition = d.definition.trim();
      const key = JSON.stringify([term, definition]);
      const entry = byKey.get(key) ?? { term, definition, records: [] };
      if (!entry.records.includes(s.record)) entry.records.push(s.record);
      byKey.set(key, entry);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.term < b.term ? -1 : a.term > b.term ? 1 : byToken(a.records[0], b.records[0])
  );
}

function stringArray(v: unknown, where: string): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.some(x => typeof x !== 'string')) fail(`${where} is not a list of strings.`);
  return v as string[];
}

function count(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** The latest archive record of an archived change's history, read by `A brief says only what the archive recorded`. */
function readArchive(projectRoot: string, changeDir: string): BriefArchive {
  const runsDir = path.join(changeDir, '.orbit-runs');
  const names = listDir(projectRoot, runsDir, "change's history")
    .map(e => e.name)
    .filter(f => ARCHIVE_RECORD.test(f))
    .sort();
  if (names.length === 0) return { state: 'no-record' };
  const name = names[names.length - 1];
  const where = `archive record ${rel(projectRoot, path.join(runsDir, name))}`;
  let r: unknown;
  try {
    r = JSON.parse(fs.readFileSync(path.join(runsDir, name), 'utf-8'));
  } catch {
    fail(`${where} cannot be read as JSON.`);
  }
  if (r === null || typeof r !== 'object' || Array.isArray(r)) fail(`${where} is not a JSON object.`);
  const record = r as Record<string, unknown>;
  const warnings = stringArray(record.warnings, `${where}'s warnings`);
  const accepted: { claim: string; why: string }[] = [];
  if (record.judgements !== undefined) {
    if (!Array.isArray(record.judgements)) fail(`${where}'s judgements is not a list.`);
    for (const j of record.judgements as Record<string, unknown>[]) {
      if (j === null || typeof j !== 'object' || j.kind !== 'readiness' || j.accepted === undefined) continue;
      if (!Array.isArray(j.accepted)) fail(`${where}'s readiness judgement carries accepted that is not a list.`);
      for (const a of j.accepted as Record<string, unknown>[]) {
        if (a === null || typeof a !== 'object' || typeof a.claim !== 'string' || typeof a.why !== 'string') {
          fail(`${where}'s readiness judgement carries an accepted entry that is not {claim, why}.`);
        }
        accepted.push({ claim: a.claim, why: a.why });
      }
    }
  }
  const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
  const s = isObject(record.sync_specs) ? record.sync_specs : null;
  const caps = s?.capabilities_updated;
  const listsCaps = Array.isArray(caps) && caps.length > 0 && caps.every(c => typeof c === 'string');
  // What the record states of the sync, in the current shape (`sync_specs.ran`) or an earlier one: `specs_synced`,
  // `sync.synced`, or a `sync_specs` without `ran` that lists the capabilities it updated. A record stating it in
  // none of these says nothing the brief can read of the sync, and never reads as synced or not synced.
  const ran: boolean | null =
    s !== null && typeof s.ran === 'boolean'
      ? s.ran
      : typeof record.specs_synced === 'boolean'
        ? record.specs_synced
        : isObject(record.sync) && typeof record.sync.synced === 'boolean'
          ? record.sync.synced
          : s !== null && listsCaps
            ? true
            : null;
  if (ran === null) return { state: 'unstated', record: name, warnings, accepted };
  if (ran) {
    return {
      state: 'synced',
      record: name,
      capabilities_updated: listsCaps ? (caps as string[]) : null,
      counts: { added: count(s?.added), modified: count(s?.modified), removed: count(s?.removed), renamed: count(s?.renamed) },
      warnings,
      accepted,
    };
  }
  return {
    state: 'not-synced',
    record: name,
    skipped_reason: typeof s?.skipped_reason === 'string' && s.skipped_reason.trim() !== '' ? s.skipped_reason : null,
    warnings,
    accepted,
  };
}

function readCapabilities(projectRoot: string, changeDir: string): BriefCapability[] {
  const specsDir = path.join(changeDir, 'specs');
  const caps = listDir(projectRoot, specsDir, 'delta specs folder')
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
  const out: BriefCapability[] = [];
  for (const capability of caps) {
    const specPath = path.join(specsDir, capability, 'spec.md');
    if (!fs.existsSync(specPath)) fail(`capability folder ${rel(projectRoot, path.dirname(specPath))} has no spec.md.`);
    let content: string;
    try {
      content = fs.readFileSync(specPath, 'utf-8');
    } catch {
      fail(`delta spec ${rel(projectRoot, specPath)} cannot be read.`);
    }
    const plan = parseDeltaSpec(content);
    if (plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length === 0) {
      fail(
        `delta spec ${rel(projectRoot, specPath)} states no requirement under an ADDED, MODIFIED, REMOVED or RENAMED Requirements heading.`
      );
    }
    out.push({
      capability,
      added: plan.added.map(b => b.name),
      modified: plan.modified.map(b => b.name),
      removed: plan.removed,
      renamed: plan.renamed,
    });
  }
  return out;
}

/** The change's directory: active first, then the newest archive. */
export function findChange(projectRoot: string, name: string): { dir: string; status: 'active' | 'archived' } | null {
  const active = path.join(projectRoot, 'orbit', 'changes', name);
  if (name !== 'archive' && isDir(active)) return { dir: active, status: 'active' };
  const archived = findArchivedDir(projectRoot, name);
  return archived === null ? null : { dir: archived, status: 'archived' };
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** The reading's selection; a folder it cannot list fails the brief, naming it (the brief is whole or absent). */
function selectedOrFail(changeDir: string, projectRoot: string): string[] {
  try {
    return selectUnreadRecords(changeDir, projectRoot);
  } catch (e) {
    if (e instanceof DecisionBriefError) fail(e.message);
    throw e;
  }
}

/** The change brief of the change at `changeDir`. Whole or absent. */
export function buildChangeBriefAt(projectRoot: string, changeDir: string, status: 'active' | 'archived'): ChangeBrief {
  const base = path.basename(changeDir);
  const change = status === 'archived' ? (base.match(DATED_DIR)?.[1] ?? base) : base;
  const runsDir = path.join(changeDir, '.orbit-runs');

  const decisions = readValidDecisions(projectRoot, path.join(runsDir, 'decisions'));
  const { ledger, stops, heads: latest } = readDecisions(decisions, () => true);

  listDir(projectRoot, path.join(runsDir, ACCOUNT_DIR), 'account folder');
  const accountFolder = readAccountFolder(path.join(runsDir, ACCOUNT_DIR));
  for (const [name, r] of accountFolder.records) {
    const where = rel(projectRoot, path.join(runsDir, ACCOUNT_DIR, name));
    if (r === null) fail(`account ${where} cannot be read as a JSON object.`);
    if (r.command !== 'account') fail(`account ${where} carries command ${JSON.stringify(r.command)}, not account.`);
    try {
      checkAccountShape(r);
    } catch (e) {
      if (e instanceof AccountError || e instanceof DecisionRecordError) fail(`account ${where} is not a valid account: ${e.message}`);
      throw e;
    }
  }
  const accountName = latestAccount(accountFolder);
  const account = accountName === null ? null : (accountFolder.records.get(accountName) as Record<string, unknown>);

  const size = readSizeDeclaration(changeDir);
  if (size.error) fail(`proposal ${rel(projectRoot, size.error.path)} cannot be read: ${size.error.message}`);

  const terms = collectTerms([
    ...latest.map(n => ({ record: n, defines: (decisions.records.get(n) as Record<string, unknown>).defines })),
    ...(accountName === null ? [] : [{ record: accountName, defines: account?.defines }]),
  ]);

  return {
    unit: 'change',
    change,
    status,
    path: rel(projectRoot, changeDir),
    program: readMeta(projectRoot, changeDir),
    account: accountName,
    built: account === null ? null : String(account.built),
    capabilities: readCapabilities(projectRoot, changeDir),
    archive: status === 'active' ? { state: 'active' } : readArchive(projectRoot, changeDir),
    terms,
    seams: account === null ? null : String(account.seams),
    ledger,
    stops,
    tripwires: 'not-installed',
    deviations: { account: account === null ? null : String(account.deviations), size_breached: size.declaration.declared },
    // Under `signoff: change` the selection takes the latest account while it is unread, and a read one is named
    // nowhere; under every other value the account is named apart as checked by no reader
    // (`orbit-decision-records`' `The reader takes the account only when sign-off is per change`).
    unread: {
      records: selectedOrFail(changeDir, projectRoot).sort(byToken),
      account: resolveSignoffSetting(projectRoot).value === 'change' ? null : accountName,
    },
  };
}

/** `orbit brief --change <name>`: the change found active first, then as its newest archive. */
export function buildChangeBrief(projectRoot: string, name: string): ChangeBrief {
  if (!isSingleName(name)) fail(`'${name}' is not a single change name.`);
  const found = findChange(projectRoot, name);
  if (found === null) fail(`change '${name}' not found at orbit/changes/${name}/ or in orbit/changes/archive/.`);
  return buildChangeBriefAt(projectRoot, found.dir, found.status);
}

function subdirs(projectRoot: string, dir: string): string[] {
  return listDir(projectRoot, dir, 'changes folder')
    .map(e => e.name)
    .filter(f => !f.startsWith('.') && isDir(path.join(dir, f)))
    .sort();
}

/** When an archived change was archived: its latest archive record's token, else its directory's date. */
function archivedAt(projectRoot: string, dir: string): string {
  const records = listDir(projectRoot, path.join(dir, '.orbit-runs'), "change's history")
    .map(e => e.name)
    .filter(f => ARCHIVE_RECORD.test(f))
    .sort();
  return records.length > 0 ? tokenOf(records[records.length - 1]) : `${path.basename(dir).slice(0, 10)}T00-00-00Z`;
}

/** `orbit brief <doc>`: every change citing the doc, grouped by stage, then the architecture trail's records. */
export function buildProgramBrief(projectRoot: string, doc: string): ProgramBrief {
  if (!isSingleName(doc) || !isValidDocName(doc)) fail(`'${doc}' is not a single doc name.`);
  const parsed = loadArchitectureDoc(projectRoot, doc);
  if (parsed === null) fail(`architecture doc '${doc}' not found at orbit/architecture/${doc}.md.`);
  if (parsed.docClass === 'malformed') {
    fail(`architecture doc '${doc}' breaks the stage grammar; run \`orbit architecture validate ${doc}\` to see where.`);
  }

  // Citing changes, archived first in the order they were archived (their latest archive record's time, else the
  // directory's date), then active by name (the order key).
  const citing: { key: string; stage: string | null; dir: string; status: 'active' | 'archived' }[] = [];
  const changesDir = path.join(projectRoot, 'orbit', 'changes');
  for (const name of subdirs(projectRoot, path.join(changesDir, 'archive'))) {
    const dir = path.join(changesDir, 'archive', name);
    const meta = readMeta(projectRoot, dir);
    if (meta?.doc === doc) citing.push({ key: `0:${archivedAt(projectRoot, dir)}:${name}`, stage: meta.stage, dir, status: 'archived' });
  }
  for (const name of subdirs(projectRoot, changesDir)) {
    if (name === 'archive') continue;
    const dir = path.join(changesDir, name);
    const meta = readMeta(projectRoot, dir);
    if (meta?.doc === doc) citing.push({ key: `1:${name}`, stage: meta.stage, dir, status: 'active' });
  }
  citing.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  const groups: ProgramStageGroup[] = [];
  const groupFor = (stage: string | null): ProgramStageGroup => {
    let g = groups.find(x => x.stage === stage);
    if (!g) {
      const declared = stage === null ? undefined : parsed.stages.find(s => s.id === stage);
      g = { stage, title: declared?.title ?? null, declared: declared !== undefined, changes: [] };
      groups.push(g);
    }
    return g;
  };
  for (const c of citing) groupFor(c.stage).changes.push(buildChangeBriefAt(projectRoot, c.dir, c.status));
  // Declared stages in the doc's order; then undeclared stage ids in the order of their earliest change
  // (the order groups were created in, since `citing` is sorted); then the changes that name no stage.
  const order = (g: ProgramStageGroup): number => {
    if (g.stage === null) return Number.MAX_SAFE_INTEGER;
    const i = parsed.stages.findIndex(s => s.id === g.stage);
    return i === -1 ? parsed.stages.length + groups.indexOf(g) : i;
  };
  groups.sort((a, b) => order(a) - order(b));

  const archDir = path.join(projectRoot, 'orbit', 'architecture', '.orbit-runs', 'decisions');
  const ofDoc = (r: Record<string, unknown>): boolean => r.doc === doc;
  const folder = readValidDecisions(projectRoot, archDir, ofDoc);
  const { ledger, stops, heads: latest } = readDecisions(folder, ofDoc);
  const terms = collectTerms(latest.map(n => ({ record: n, defines: (folder.records.get(n) as Record<string, unknown>).defines })));

  return { unit: 'program', doc, groups, architecture: { terms, ledger, stops }, tripwires: 'not-installed' };
}

// ---------------------------------------------------------------------------
// The render
// ---------------------------------------------------------------------------

const q = (s: string): string => `\`${s}\``;

/** The fixed text, kept in one place so the golden renders pin it. */
const TEXT = {
  noAccount: 'No account was written for this change, so this brief cannot say this.',
  titlesNote: "The requirement titles below are the titles the change's specs give them, word for word.",
  noSpecs: 'This change has no delta specs: it added and changed no requirement.',
  activeSync:
    'No archive has recorded a sync of these yet: they are what the change proposes to add or change in the specs.',
  noRecordSync:
    'This change was archived without an archive record, so whether these were synced into the specs is not recorded.',
  unstatedSync:
    "This change's archive record does not say, in a form orbit reads, whether these were synced into the specs.",
  noTerms: 'No record of this work defines a new term.',
  noLedger: 'No ledger entry was written for this work.',
  noStops: 'No stop was recorded for this work.',
  tripwires: 'Tripwires are not installed yet, so this brief cannot say whether any would have fired.',
  activeArchiveSignals:
    "The archive records its warnings and accepted risks after this brief was rendered; they appear in the archived change's brief and the program brief.",
  noRecordSignals: 'No archive record holds warnings or accepted risks for this change.',
  noSize: "The proposal's Size section declares no size limit breached.",
  allRead: 'No decision record of this change is waiting for a reader.',
  unreadNote: 'Decision records no reader has checked:',
  unreadWithAccountNote: "Records no reader has checked (decision records, and the change's account):",
  accountUnread: (n: string) =>
    `The account ${n} was checked by no reader: a reading step reads the account only when the user signs off on each change.`,
  snapshot:
    "This list is as of when this brief was rendered; records written after it appear in the archived change's brief and the program brief.",
  open: 'Open: no answer to this stop has been recorded.',
};

function citationText(c: BriefCitationName): string {
  switch (c.kind) {
    case 'requirement':
      return `requirement ${q(c.title)} of capability ${q(c.capability)}`;
    case 'ruling':
      return `ruling ${c.id} of ${q(c.doc)}`;
    case 'goal':
      return `goal ${c.id} of ${q(c.doc)}`;
    case 'resolution':
      return `the answer recorded as resolution-${c.token}.json, in ${c.work}`;
    case 'decision':
      return `explore decision ${c.id}`;
  }
}

function renderDecisions(out: string[], h: string, d: BriefDecisions): void {
  out.push(`${h} New terms`, '');
  if (d.terms.length === 0) out.push(TEXT.noTerms, '');
  else {
    for (const t of d.terms) out.push(`- **${t.term}**: ${t.definition} (defined in ${t.records.join(', ')})`);
    out.push('');
  }
}

function renderLedger(out: string[], h: string, entries: BriefLedgerEntry[]): void {
  out.push(`${h} The ledger`, '');
  if (entries.length === 0) {
    out.push(TEXT.noLedger, '');
    return;
  }
  for (const e of entries) {
    out.push(`${h}# ${e.record}`, '');
    out.push(`- Area: ${e.area.name}`);
    out.push(`- Decided: ${e.decided}`);
    out.push('- Alternatives considered:');
    for (const a of e.alternatives) out.push(`  - ${a}`);
    out.push(`- Why: ${e.why}`);
    if (e.raised_stop !== null) {
      const s = e.raised_stop;
      out.push(`- Relies on nothing approved; it raised the stop ${s.record}${s.current !== s.record ? `, since reworded as ${s.current}` : ''}.`);
    } else {
      out.push('- Relies on:');
      for (const c of e.relies_on) out.push(`  - ${citationText(c)}`);
    }
    out.push('');
  }
}

function renderStops(out: string[], h: string, stops: BriefStop[]): void {
  out.push(`${h} Stops`, '');
  if (stops.length === 0) {
    out.push(TEXT.noStops, '');
    return;
  }
  for (const s of stops) {
    out.push(`${h}# ${s.record}`, '');
    out.push(`- About: ${s.about}`);
    out.push(`- Question: ${s.question}`);
    if (s.resolution === null) out.push(`- ${TEXT.open}`);
    else {
      out.push(`- Answer (${s.resolution.record}): ${s.resolution.answer}`);
      out.push(`- Effect: ${s.resolution.effect}`);
    }
    out.push('');
  }
}

function syncLine(a: BriefArchive): string | null {
  switch (a.state) {
    case 'active':
      return TEXT.activeSync;
    case 'no-record':
      return TEXT.noRecordSync;
    case 'unstated':
      return TEXT.unstatedSync;
    case 'not-synced':
      return `The archive recorded no sync of these into the specs${a.skipped_reason !== null ? `: ${a.skipped_reason}` : '.'}`;
    case 'synced': {
      const parts: string[] = [];
      if (a.capabilities_updated !== null) {
        parts.push(`${a.capabilities_updated.length} ${a.capabilities_updated.length === 1 ? 'capability' : 'capabilities'} updated (${a.capabilities_updated.map(q).join(', ')})`);
      }
      const counted = (['added', 'modified', 'removed', 'renamed'] as const)
        .filter(k => a.counts[k] !== null)
        .map(k => `${a.counts[k]} ${k === 'modified' ? 'changed' : k}`);
      if (counted.length > 0) parts.push(`requirements: ${counted.join(', ')}`);
      return `The archive synced these into the specs${parts.length > 0 ? ` — ${parts.join('; ')}` : ''}.`;
    }
  }
}

function renderChange(out: string[], b: ChangeBrief, level: number): void {
  const h = '#'.repeat(level + 1);
  const where = b.status === 'active' ? `active, at ${b.path}/` : `archived, at ${b.path}/`;
  out.push(`- Change ${q(b.change)}: ${where}`);
  out.push(
    b.program === null
      ? '- Program: none — this change cites no architecture doc.'
      : `- Program: architecture doc ${q(b.program.doc)}, ${b.program.stage === null ? 'naming no stage' : `stage ${q(b.program.stage)}`}`
  );
  out.push('');

  out.push(`${h} What was built`, '', b.built ?? TEXT.noAccount, '');

  out.push(`${h} Capabilities and requirements added or changed`, '');
  if (b.capabilities.length === 0) out.push(TEXT.noSpecs, '');
  else {
    out.push(syncLine(b.archive) as string, '', TEXT.titlesNote, '');
    for (const c of b.capabilities) {
      out.push(`- ${q(c.capability)}`);
      const list = (label: string, xs: string[]): void => {
        if (xs.length === 0) return;
        out.push(`  - ${label}:`);
        for (const x of xs) out.push(`    - ${x}`);
      };
      list('Added', c.added);
      list('Changed', c.modified);
      list('Removed', c.removed);
      list('Renamed', c.renamed.map(r => `${r.from} → ${r.to}`));
    }
    out.push('');
  }

  renderDecisions(out, h, { terms: b.terms, ledger: b.ledger, stops: b.stops });

  out.push(`${h} New seams`, '', b.seams ?? TEXT.noAccount, '');

  renderLedger(out, h, b.ledger);
  renderStops(out, h, b.stops);

  out.push(`${h} Tripwires`, '', TEXT.tripwires, '');

  out.push(`${h} Deviations from the charter`, '', b.deviations.account ?? TEXT.noAccount, '');
  const a = b.archive;
  if (a.state === 'active') out.push(TEXT.activeArchiveSignals, '');
  else if (a.state === 'no-record') out.push(TEXT.noRecordSignals, '');
  else {
    if (a.warnings.length === 0) out.push('The archive recorded no warnings.', '');
    else {
      out.push('The archive recorded these warnings:', '');
      for (const w of a.warnings) out.push(`- ${w}`);
      out.push('');
    }
    if (a.accepted.length === 0) out.push('The archive recorded no accepted risks.', '');
    else {
      out.push('The archive recorded these risks as accepted:', '');
      for (const r of a.accepted) out.push(`- ${r.claim} — ${r.why}`);
      out.push('');
    }
  }
  out.push(
    b.deviations.size_breached.length === 0
      ? TEXT.noSize
      : `The proposal's Size section declares these size limits breached: ${b.deviations.size_breached.map(q).join(', ')}.`,
    ''
  );

  out.push(`${h} Records no reader checked`, '');
  if (b.unread.records.length === 0) out.push(TEXT.allRead, '');
  else {
    out.push(b.unread.records.some(r => r.startsWith('account-')) ? TEXT.unreadWithAccountNote : TEXT.unreadNote, '');
    for (const r of b.unread.records) out.push(`- ${r}`);
    out.push('');
  }
  if (b.unread.account !== null) out.push(TEXT.accountUnread(b.unread.account), '');
  if (b.status === 'active') out.push(TEXT.snapshot, '');
}

/** The change brief as markdown: the text `orbit brief --change` prints and `--save` writes, byte for byte. */
export function renderChangeBrief(b: ChangeBrief): string {
  const out: string[] = [`# Brief: change ${b.change}`, ''];
  out.push(
    "This brief says what this change did, from what its history holds. Text under a heading is quoted from the change's records as they were written; orbit writes the rest.",
    ''
  );
  renderChange(out, b, 1);
  return out.join('\n').replace(/\n+$/, '\n');
}

/** The program brief as markdown. */
export function renderProgramBrief(b: ProgramBrief): string {
  const out: string[] = [`# Brief: program ${b.doc}`, ''];
  out.push(
    `This brief says what the program in architecture doc ${q(b.doc)} did: each change that cites it, grouped by stage, then what was decided in the architecture sessions for it. Text under a heading is quoted from the records as they were written; orbit writes the rest.`,
    ''
  );
  if (b.groups.length === 0) out.push('No change cites this doc yet.', '');
  for (const g of b.groups) {
    if (g.stage === null) out.push('## Changes that name no stage', '');
    else if (g.declared) out.push(`## Stage ${q(g.stage)} — ${g.title}`, '');
    else out.push(`## Stage ${q(g.stage)}`, '', 'The doc declares no stage of this id; these changes cite it.', '');
    for (const c of g.changes) {
      out.push(`### Change ${c.change}`, '');
      renderChange(out, c, 3);
    }
  }
  out.push('## The architecture sessions', '');
  out.push(`What was decided while the doc ${q(b.doc)} itself was worked on.`, '');
  renderDecisions(out, '###', b.architecture);
  renderLedger(out, '###', b.architecture.ledger);
  renderStops(out, '###', b.architecture.stops);
  out.push('## Tripwires', '', TEXT.tripwires, '');
  return out.join('\n').replace(/\n+$/, '\n');
}

// ---------------------------------------------------------------------------
// The save
// ---------------------------------------------------------------------------

export interface SavedBrief {
  path: string;
  sha256: string;
}

export function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf-8')).digest('hex');
}

/**
 * Save an ACTIVE change's rendered brief as `.orbit-runs/brief/brief-<TS>.md`, never overwriting. The caller
 * renders first, so a brief that cannot be rendered writes nothing. Returns the repo-relative path and the
 * SHA-256 of the file's bytes, read back from the file.
 */
export function saveChangeBrief(projectRoot: string, brief: ChangeBrief, markdown: string): SavedBrief {
  if (brief.status !== 'active') {
    fail(`change '${brief.change}' is archived, and orbit writes nothing to an archived change's history; no brief was saved.`);
  }
  const runsDir = path.join(projectRoot, brief.path, '.orbit-runs');
  let written: string;
  try {
    written = publishTrailChildText(runsDir, BRIEF_DIR, 'brief', '.md', markdown, 'run the save again');
  } catch (e) {
    if (e instanceof EmitError) fail(e.message.replace(/^write gate: /, ''));
    throw e;
  }
  return { path: rel(projectRoot, written), sha256: sha256(fs.readFileSync(written, 'utf-8')) };
}

/** Exported for tests and readers: the record filename rule the brief reads `decisions/` by. */
export const DECISION_RECORD_FILENAME = RECORD_FILENAME;
