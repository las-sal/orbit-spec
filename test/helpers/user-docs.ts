/**
 * The user docs as a checked surface (docs-under-test): `orbit-user-docs`' residue check, the
 * improvement-claims check (landing-page), the pending-rewrite list's exactness, and the docs sweeps'
 * non-vacuity floors. This module implements that capability's checks; it states none of its rules.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import {
  DOCS_INVENTORY,
  inventorySource,
  readInventory,
  recordedHeads,
  unknownHeadFailures,
  type Inventory,
} from './inventory.js';
import { analyseOrbit, guardFailureLines, sweepFailures } from './orbit-sweep.js';
import { analyseRecorded, recordedTools, sweepRecorded } from './recorded-sweep.js';
import { analyseHeads, describeSurface, type Surface } from './surface-snippets.js';

const REPO = fileURLToPath(new URL('../../', import.meta.url));

// ─── the residue check (design D3) ────────────────────────────────

/** The two README headings whose sections admit the old name. */
export const ADMITTED_SECTIONS = ['Built on OpenSpec', 'How orbit improves on OpenSpec'];
export const ADMITTED_FILE = 'docs/migration-guide.md';

const DIRECTORY_PREFIXES = [
  '~/.config',
  '~/.local/share',
  '$XDG_CONFIG_HOME',
  '$XDG_DATA_HOME',
  '%APPDATA%',
  '%LOCALAPPDATA%',
  '~/AppData/Roaming',
  '~/AppData/Local',
];

/** The admitted identifiers, matched as whole substrings: `.openspec.yaml` and each global directory with `/` or `\` before `openspec`. */
export const ADMITTED_IDENTIFIERS = [
  '.openspec.yaml',
  ...DIRECTORY_PREFIXES.flatMap((prefix) => [`${prefix}/openspec`, `${prefix}\\openspec`]),
];

const RESIDUE = /openspec|opsx|fission/gi;

/** HTML enabled, as GitHub renders the README: a heading inside an HTML block is no heading. */
const md = new MarkdownIt({ html: true });

/** A top-level ATX section: its title, and its 0-based line range [start, end). */
interface Section {
  title: string;
  start: number;
  end: number;
}

/**
 * Every top-level ATX section of a parse: from a top-level ATX heading to the next top-level ATX
 * heading at its level or above. Headings come from a markdown-it parse (the extractor's parser, with
 * HTML blocks enabled), so a `#` line inside a fence, an HTML block, a list item or a blockquote is no
 * heading; a setext heading is not read (the named limit).
 */
function atxSections(tokens: ReturnType<typeof md.parse>, lineCount: number): Section[] {
  const headings: Array<{ line: number; level: number; text: string }> = [];
  tokens.forEach((token, i) => {
    if (token.type !== 'heading_open' || token.level !== 0 || !token.map || !/^#+$/.test(token.markup)) return;
    headings.push({ line: token.map[0], level: token.markup.length, text: (tokens[i + 1]?.content ?? '').trim() });
  });
  return headings.map((heading, k) => ({
    title: heading.text,
    start: heading.line,
    end: headings.slice(k + 1).find((h) => h.level <= heading.level)?.line ?? lineCount,
  }));
}

/** 0-based lines inside an admitted README section (see `atxSections` for what bounds one). */
export function admittedLines(text: string): Set<number> {
  const admitted = new Set<number>();
  for (const section of atxSections(md.parse(text, {}), text.split('\n').length)) {
    if (!ADMITTED_SECTIONS.includes(section.title)) continue;
    for (let l = section.start; l < section.end; l++) admitted.add(l);
  }
  return admitted;
}

/** Each residue occurrence in the user docs, naming file, line and occurrence. */
export function residueFailures(surfaces: Surface[]): string[] {
  const failures: string[] = [];
  for (const surface of surfaces) {
    if (surface.file === ADMITTED_FILE) continue;
    const admitted = surface.file === 'README.md' ? admittedLines(surface.text) : new Set<number>();
    surface.text.split('\n').forEach((line, i) => {
      if (admitted.has(i)) return;
      let masked = line;
      for (const id of ADMITTED_IDENTIFIERS) masked = masked.split(id).join(' '.repeat(id.length));
      for (const m of masked.matchAll(RESIDUE)) {
        failures.push(`${describeSurface(surface)}:${i + 1}: residue '${m[0]}' (the residue check)`);
      }
    });
  }
  return failures;
}

// ─── the improvement-claims check (landing-page design D2) ───────

/** The README section whose top-level list items are the improvement claims. */
export const CLAIMS_SECTION = 'How orbit improves on OpenSpec';

/** A NAME: the whole content of one inline code span. */
const CAPABILITY_NAME = /^orbit-[a-z0-9]+(-[a-z0-9]+)*$/;

/** Whether a name resolves: `orbit/specs/<name>/spec.md` exists in this repository. */
export const capabilityExists = (name: string): boolean => fs.existsSync(path.join(REPO, 'orbit', 'specs', name, 'spec.md'));

/**
 * The improvement-claims check over `README.md` (every other surface passes): each top-level list
 * item of the claims section, its nested items' names counted toward it, names at least one
 * capability, and every name resolves. Names are read from `code_inline` tokens, so a fence is never
 * read; a name's line is its inline block's first line plus the line breaks before it.
 */
export function claimsFailures(surfaces: Surface[], exists: (name: string) => boolean = capabilityExists): string[] {
  const failures: string[] = [];
  for (const surface of surfaces) {
    if (surface.file !== 'README.md') continue;
    const where = describeSurface(surface);
    const tokens = md.parse(surface.text, {});
    const sections = atxSections(tokens, surface.text.split('\n').length).filter((s) => s.title === CLAIMS_SECTION);
    let items = 0;
    for (let i = 0; i < tokens.length; i++) {
      const open = tokens[i];
      if (open.type !== 'list_item_open' || open.level !== 1 || !open.map) continue;
      const itemLine = open.map[0];
      if (!sections.some((s) => itemLine >= s.start && itemLine < s.end)) continue;
      items++;
      let names = 0;
      let j = i + 1;
      for (; j < tokens.length && !(tokens[j].type === 'list_item_close' && tokens[j].level === open.level); j++) {
        const inline = tokens[j];
        if (inline.type !== 'inline' || !inline.map) continue;
        let line = inline.map[0];
        for (const child of inline.children ?? []) {
          if (child.type === 'softbreak' || child.type === 'hardbreak') line++;
          if (child.type !== 'code_inline' || !CAPABILITY_NAME.test(child.content)) continue;
          names++;
          if (!exists(child.content)) {
            failures.push(`${where}:${line + 1}: '${child.content}' names no capability in orbit/specs (the improvement-claims check)`);
          }
        }
      }
      if (names === 0) failures.push(`${where}:${itemLine + 1}: improvement claim names no capability (the improvement-claims check)`);
      i = j;
    }
    if (items === 0) failures.push(`${where}: no improvement claim found under '${CLAIMS_SECTION}' (the improvement-claims check)`);
  }
  return failures;
}

// ─── the file-local checks and the pending list (design D2) ───────

/** The docs' declared set, read from `orbit-user-docs`' requirement as it stands. */
export function docsInventory(): Inventory {
  return readInventory(inventorySource(REPO, DOCS_INVENTORY), DOCS_INVENTORY);
}

/**
 * Every FILE-LOCAL check over the given surfaces, each failure prefixed with its check: residue, the
 * `orbit` sweep and guard, the `git`/`gh` sweeps and guards, the inventory's unknown heads against
 * the docs' declared set (`inventory`, by default the real one), and the improvement-claims check
 * (`README.md` only).
 */
export async function fileLocalFailures(surfaces: Surface[], inventory: Inventory = docsInventory()): Promise<string[]> {
  const tag = (check: string, list: string[]) => list.map((f) => `[${check}] ${f}`);
  const orbit = analyseOrbit(surfaces);
  const failures = [
    ...tag('residue', residueFailures(surfaces)),
    ...tag('orbit', [...(await sweepFailures(orbit)), ...guardFailureLines(orbit)]),
  ];
  for (const { tool, contract, validate } of recordedTools()) {
    const analysis = analyseRecorded(surfaces, tool, contract);
    failures.push(...tag(tool, [...sweepRecorded(analysis, validate, contract), ...guardFailureLines(analysis)]));
  }
  failures.push(...tag('inventory', unknownHeadFailures(analyseHeads(surfaces), recordedHeads(), inventory)));
  failures.push(...tag('claims', claimsFailures(surfaces)));
  return failures;
}

/** The list's exactness: a stale entry, and a listed doc that passes every file-local check run over it alone. */
export async function pendingListFailures(
  pending: string[],
  docs: Surface[],
  check: (surfaces: Surface[]) => Promise<string[]> = fileLocalFailures,
): Promise<string[]> {
  const failures: string[] = [];
  for (const entry of pending) {
    const doc = docs.find((d) => d.file === entry);
    if (!doc) {
      failures.push(`${entry}: listed in the pending-rewrite list but names no user doc (a stale entry)`);
    } else if ((await check([doc])).length === 0) {
      failures.push(`${entry}: passes every file-local check; remove it from the pending-rewrite list`);
    }
  }
  return failures;
}

// ─── the docs floors (design D5) ──────────────────────────────────

/** A docs sweep's floor (a positive integer, or null while unset) and its measured count over the unlisted user docs. */
export interface DocsFloor {
  sweep: string;
  floor: number | null;
  count: number;
}

/** Inactive while any file is listed; once the list is empty, an unset floor, a floor that is not a positive integer, or a count below it fails naming the sweep. */
export function docsFloorFailures(pending: string[], floors: DocsFloor[]): string[] {
  if (pending.length > 0) return [];
  const failures: string[] = [];
  for (const { sweep, floor, count } of floors) {
    if (floor === null) failures.push(`the ${sweep} sweep's user-docs floor is unset; set it in the edit that empties the pending-rewrite list`);
    else if (!Number.isInteger(floor) || floor < 1) failures.push(`the ${sweep} sweep's user-docs floor ${floor} is not a positive integer`);
    else if (count < floor) failures.push(`the ${sweep} sweep read ${count} snippets in the user docs, below its floor ${floor}`);
  }
  return failures;
}
