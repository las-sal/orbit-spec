import * as fs from 'node:fs';
import { collectSections, type SectionEntry, type SectionLine } from './explore-counter.js';
import {
  STATUS_HEADER,
  DECISION_OPENER_PREFIX,
  KIND_SLOT,
  DISPOSITION_SLOT,
  RE_ENTRY_SLOT,
  MECHANISM_H3,
  MECHANISM_ENTRY_HEADING,
  ENTRY_TERMINATOR,
  DOMAIN_LINE,
  TABLE_ROW_START,
  isTableHeader,
  TABLE_SEPARATOR,
  isMemberRow,
  DECISION_ID_PREFIX,
  CLOSURE_PREFIX,
  CLOSURE_LINE,
  RESIDUAL_KIND_LINE,
  RESIDUAL_METHOD_LINE,
  RESIDUAL_ANY_LINE,
  MOVES_LINE,
  MOVE_LINE,
  MOVE_CANDIDATE,
  MOVE_NAMES,
  type ClosureToken,
} from '../explore-grammar.js';

/**
 * The explore FORM parse (rc13b, D-rc13b-8; `orbit-emit-composition` "Per-command computed
 * extensions" — the five explore fields). Reads a staging `explore.md` through the productions
 * `orbit-conventions` owns (imported from the grammar module, never restated) and the engine's
 * ONE CommonMark fence grammar, and judges FORM ONLY: whether a live rule has a Mechanism entry,
 * whether it declares a token, whether the slots the token requires are present. Whether an
 * enumeration is TRUE, a residual honest, or a rule written down at all is a reader's judgement
 * (R-crc-10) — a file whose every decision is `Kind: fact` yields `rules_total: 0`, truthfully.
 *
 * TWO DISJOINT arrays, by construction:
 *   - `rules_open` — LIVE RULES ONLY, one entry per live rule whose domain is not accounted, in
 *     exactly one of five states tested in order (`open` → `absent` → `bounded-incomplete` →
 *     `no-closure` → `malformed-entry`), ordered by the Decisions entries' file order. Its
 *     LENGTH is the maturity rung's K.
 *   - `key_defects` — defects in the KEY space (`orphan`, `duplicate`), ordered by line, never a
 *     rule and never counted in K.
 * No defect of either array blocks an emit: the fields record it and the rung reports it.
 *
 * The ID opener is a FIRST-LINE PREFIX match (`orbit-conventions`' Decision-entry requirement —
 * pointed at, not restated): a bold title wrapped onto a second line keeps its ID; only an entry
 * whose first line carries no prefix at all is ID-less (`open`, named by line). A `Kind:` or
 * `Disposition:` value outside its production is NO MATCH: the slot is absent and the demanding
 * default applies, so a typo cannot escape the obligation.
 */

export type OpenRuleState = 'open' | 'absent' | 'bounded-incomplete' | 'no-closure' | 'malformed-entry';

export interface OpenRule {
  id?: string;
  state: OpenRuleState;
  line?: number;
}

export interface KeyDefect {
  id: string;
  kind: 'orphan' | 'duplicate';
  line: number;
}

export interface Residual {
  id: string;
  kind: string;
  method: string;
}

export interface ExploreStatus {
  token: 'exploring' | 'concluded';
  date?: string;
  re_entry?: string;
}

export interface ExploreRules {
  rules_total: number;
  rules_open: OpenRule[];
  key_defects: KeyDefect[];
  residuals: Residual[];
  status: ExploreStatus;
  /** Caller-surfaced stderr notes (missing Mechanism section; a second live `Re-entry:` slot). Never blockers. */
  notes: string[];
}

// ---------------------------------------------------------------------------
// The Decisions side
// ---------------------------------------------------------------------------

interface DecisionRecord {
  /** Present iff the first line carries the opener prefix. */
  id?: string;
  line: number;
  /** In the accounting obligation: Kind rule/absent AND Disposition live/absent. */
  live: boolean;
  /** Disposition live/absent — the condition for owning the live `Re-entry:` slot. */
  liveDisposition: boolean;
  reEntry?: string;
}

function unfencedTexts(lines: SectionLine[]): string[] {
  return lines.filter((l) => !l.fenced).map((l) => l.text);
}

function readDecision(entry: SectionEntry): DecisionRecord {
  const texts = unfencedTexts(entry.lines);
  const opener = texts[0]?.match(DECISION_OPENER_PREFIX) ?? null;
  let kind: string | undefined;
  let disposition: string | undefined;
  let reEntry: string | undefined;
  for (const t of texts) {
    if (kind === undefined) {
      const k = t.match(KIND_SLOT);
      if (k) kind = k[1];
    }
    if (disposition === undefined) {
      const d = t.match(DISPOSITION_SLOT);
      if (d) disposition = d[2] ? 'live' : d[3];
    }
    if (reEntry === undefined) {
      const r = t.match(RE_ENTRY_SLOT);
      if (r) reEntry = r[1];
    }
  }
  const liveDisposition = disposition === undefined || disposition === 'live';
  return {
    ...(opener ? { id: opener[2] } : {}),
    line: entry.line,
    live: (kind === undefined || kind === 'rule') && liveDisposition,
    liveDisposition,
    ...(reEntry !== undefined ? { reEntry } : {}),
  };
}

// ---------------------------------------------------------------------------
// The Mechanism side
// ---------------------------------------------------------------------------

interface MechanismEntry {
  /** The key the heading CLAIMS: the ID of a well-formed heading, else the text before the first ` — `. */
  id: string;
  line: number;
  /** False when the heading begins `D-` but is not `### <ID> — <title>` (a malformed ID). */
  wellFormedHeading: boolean;
  body: SectionLine[];
}

interface EntryJudgement {
  /** Grammar failures, each naming its line (line order). */
  defects: Array<{ line: number; what: string }>;
  closure?: ClosureToken;
  noClosure: boolean;
  boundedIncomplete: boolean;
  residual?: { kind: string; method: string };
}

function readMechanism(lines: SectionLine[]): MechanismEntry[] {
  const entries: MechanismEntry[] = [];
  let open: MechanismEntry | null = null;
  for (const l of lines) {
    if (l.fenced) {
      if (open) open.body.push(l);
      continue;
    }
    if (ENTRY_TERMINATOR.test(l.text)) {
      open = null; // an entry ends at the next heading of level 1–3
      const h3 = l.text.match(MECHANISM_H3);
      if (h3 && h3[1].startsWith('D-')) {
        const wf = l.text.match(MECHANISM_ENTRY_HEADING);
        // A heading that is not `### <ID> — <title>` is keyed by its ID-shaped prefix when it has
        // one (so `### D-x-1: a rule` still joins D-x-1 as a MALFORMED entry naming the heading),
        // else by the raw token before the first ` — ` (a malformed ID owns nothing: an orphan).
        const id = wf ? wf[1] : (h3[1].match(DECISION_ID_PREFIX)?.[0] ?? h3[1].split(' — ')[0].trim());
        open = { id, line: l.n, wellFormedHeading: wf !== null, body: [] };
        entries.push(open);
      }
      // `### Case …` and any other H3 are boundaries only — never entries.
      continue;
    }
    if (open) open.body.push(l);
  }
  return entries;
}

function judgeEntry(entry: MechanismEntry): EntryJudgement {
  const defects: Array<{ line: number; what: string }> = [];
  const body = entry.body.filter((l) => !l.fenced);
  if (!entry.wellFormedHeading) defects.push({ line: entry.line, what: 'malformed entry heading' });

  // Domain: + the table (named by the table's first line).
  const domainIdx = body.findIndex((l) => DOMAIN_LINE.test(l.text));
  if (domainIdx === -1) {
    defects.push({ line: entry.line, what: 'no Domain: line' });
  } else {
    let j = domainIdx + 1;
    while (j < body.length && body[j].text.trim() === '') j++;
    const header = body[j];
    if (!header || !TABLE_ROW_START.test(header.text)) {
      defects.push({ line: body[domainIdx].n, what: 'no Domain: table' });
    } else if (!isTableHeader(header.text)) {
      defects.push({ line: header.n, what: 'Domain: table columns are not `member | covered by`' });
    } else if (!body[j + 1] || !TABLE_SEPARATOR.test(body[j + 1].text)) {
      defects.push({ line: header.n, what: 'Domain: table has no separator row' });
    } else {
      let k = j + 2;
      let members = 0;
      let bad = false;
      while (k < body.length && TABLE_ROW_START.test(body[k].text)) {
        if (!isMemberRow(body[k].text)) bad = true;
        members++;
        k++;
      }
      if (bad) defects.push({ line: header.n, what: 'Domain: table row is not two cells' });
      else if (members === 0) defects.push({ line: header.n, what: 'Domain: table has no member rows' });
    }
  }

  // Closure: — token from line start to the first ` — `.
  const closureLine = body.find((l) => CLOSURE_PREFIX.test(l.text));
  let closure: ClosureToken | undefined;
  let noClosure = false;
  if (!closureLine) {
    noClosure = true;
  } else {
    const m = closureLine.text.match(CLOSURE_LINE);
    if (m) closure = m[1] as ClosureToken;
    else defects.push({ line: closureLine.n, what: 'unknown Closure: token' });
  }

  // Residual slots: required iff BOUNDED, forbidden otherwise.
  let boundedIncomplete = false;
  let residual: { kind: string; method: string } | undefined;
  if (closure === 'BOUNDED') {
    const kind = body.map((l) => l.text.match(RESIDUAL_KIND_LINE)).find((m) => m !== null);
    const method = body.map((l) => l.text.match(RESIDUAL_METHOD_LINE)).find((m) => m !== null);
    if (kind && method) residual = { kind: kind[1].trim(), method: method[1].trim() };
    else boundedIncomplete = true;
  } else {
    for (const l of body) {
      if (RESIDUAL_ANY_LINE.test(l.text)) defects.push({ line: l.n, what: 'residual slot on a non-BOUNDED entry' });
    }
  }

  // Moves: nine lines, one per move, each move exactly once.
  const movesIdx = body.findIndex((l) => MOVES_LINE.test(l.text));
  if (movesIdx === -1) {
    defects.push({ line: entry.line, what: 'no Moves: block' });
  } else {
    const seen = new Set<string>();
    for (const l of body.slice(movesIdx + 1)) {
      if (!MOVE_CANDIDATE.test(l.text)) continue;
      const m = l.text.match(MOVE_LINE);
      if (!m) defects.push({ line: l.n, what: 'not a move line' });
      else if (seen.has(m[1])) defects.push({ line: l.n, what: `duplicated move line ${m[1]}` });
      else seen.add(m[1]);
    }
    const missing = MOVE_NAMES.filter((mv) => !seen.has(mv));
    if (missing.length > 0) defects.push({ line: body[movesIdx].n, what: `missing move line(s) ${missing.join(', ')}` });
  }

  defects.sort((a, b) => a.line - b.line);
  return { defects, closure, noClosure, boundedIncomplete, residual };
}

// ---------------------------------------------------------------------------
// The status header
// ---------------------------------------------------------------------------

export function readStatus(content: string): ExploreStatus {
  // A leading UTF-8 BOM and trailing whitespace are normalised away BEFORE the owned production
  // matches (rc13b system walk: both were reading a concluded file as exploring, invisibly).
  const first = (content.replace(/^\uFEFF/, '').split(/\r?\n/).find((l) => l.trim() !== '') ?? '').trimEnd();
  const m = first.match(STATUS_HEADER);
  if (m && m[3]) return { token: 'concluded', date: m[3] };
  return { token: 'exploring' }; // `exploring.` or NEITHER token: not-concluded, never MALFORMED
}

// ---------------------------------------------------------------------------
// The join
// ---------------------------------------------------------------------------

export function parseExploreRules(content: string): ExploreRules {
  const sections = collectSections(content);
  const notes: string[] = [];
  const keyDefects: KeyDefect[] = [];

  // A repeated section heading merges (per the collector); each extra heading is a format note —
  // for EVERY section, since the merge applies to every section (the in-context confirm executed
  // a silently merged `## Open questions`).
  for (const [name, section] of sections) {
    for (const extra of section.headings.slice(1)) {
      notes.push(
        `note: explore.md repeats the '## ${name}' heading at line ${extra} — its content is merged into the first section in file order (a format violation per orbit-conventions' explore.md format requirement, to fix on next touch).`
      );
    }
  }

  // Decisions: duplicates are key defects — the first owns the key; the second is excluded.
  const decisions: DecisionRecord[] = [];
  const seenIds = new Set<string>();
  for (const entry of sections.get('Decisions')?.entries ?? []) {
    const d = readDecision(entry);
    if (d.id !== undefined) {
      if (seenIds.has(d.id)) {
        keyDefects.push({ id: d.id, kind: 'duplicate', line: d.line });
        continue;
      }
      seenIds.add(d.id);
    }
    decisions.push(d);
  }

  // Mechanism: the first heading per key is the rule's entry; a second is a duplicate key defect.
  const mechanism = sections.get('Mechanism');
  const entriesById = new Map<string, MechanismEntry>();
  if (!mechanism) {
    notes.push(
      "note: explore.md has no '## Mechanism' section — every live rule is recorded as absent (a format violation per orbit-conventions' explore.md format requirement, to fix on next touch)."
    );
  } else {
    for (const e of readMechanism(mechanism.lines)) {
      if (entriesById.has(e.id)) {
        keyDefects.push({ id: e.id, kind: 'duplicate', line: e.line });
        continue;
      }
      entriesById.set(e.id, e);
      if (!seenIds.has(e.id)) keyDefects.push({ id: e.id, kind: 'orphan', line: e.line });
    }
  }

  // Live rules, in Decisions file order: one of five states, or accounted.
  const rulesOpen: OpenRule[] = [];
  const residuals: Residual[] = [];
  let rulesTotal = 0;
  for (const d of decisions) {
    if (!d.live) continue;
    rulesTotal++;
    if (d.id === undefined) {
      rulesOpen.push({ state: 'open', line: d.line });
      continue;
    }
    const entry = entriesById.get(d.id);
    if (!entry) {
      rulesOpen.push({ id: d.id, state: 'absent' });
      continue;
    }
    const j = judgeEntry(entry);
    if (j.boundedIncomplete) rulesOpen.push({ id: d.id, state: 'bounded-incomplete' });
    else if (j.noClosure) rulesOpen.push({ id: d.id, state: 'no-closure' });
    else if (j.defects.length > 0) rulesOpen.push({ id: d.id, state: 'malformed-entry', line: j.defects[0].line });
    else if (j.residual) residuals.push({ id: d.id, ...j.residual });
  }

  // Status: the header token first; the live `Re-entry:` slot only when concluded.
  const status = readStatus(content);
  if (status.token === 'concluded') {
    const carriers = decisions.filter((d) => d.liveDisposition && d.reEntry !== undefined);
    if (carriers.length > 0) status.re_entry = carriers[0].reEntry;
    for (const extra of carriers.slice(1)) {
      notes.push(
        `note: more than one live Decisions entry carries a 'Re-entry:' slot — the first (line ${carriers[0].line}) is the live one; the entry at line ${extra.line} is ignored (exactly one LIVE entry carries it, per orbit-conventions).`
      );
    }
  }

  keyDefects.sort((a, b) => a.line - b.line);
  return { rules_total: rulesTotal, rules_open: rulesOpen, key_defects: keyDefects, residuals, status, notes };
}

/** From an explore.md path. Missing file → zeros, `status: {token: "exploring"}`, no notes (the counter's missing-section notes stand alone). */
export function parseExploreRulesFile(explorePath: string): ExploreRules {
  let content: string;
  try {
    content = fs.readFileSync(explorePath, 'utf-8');
  } catch {
    return { rules_total: 0, rules_open: [], key_defects: [], residuals: [], status: { token: 'exploring' }, notes: [] };
  }
  return parseExploreRules(content);
}
