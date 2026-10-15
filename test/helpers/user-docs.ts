/**
 * The user docs as a checked surface (docs-under-test): `orbit-user-docs`' residue check, the
 * improvement-claims check (landing-page), the command-coverage check (reference-docs), the carried-by and
 * tool-coverage checks (concept-docs), the start-sections check (docs-refinement), the version check and its admitted list's exactness (release), the pending-rewrite list's exactness, and the docs sweeps' non-vacuity floors. This module implements that capability's checks; it states none of its rules.
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
import { fromProgram, type ComparableCommand } from './registry-parity.js';
import { buildProgram } from '../../src/cli/program.js';
import { ALL_WORKFLOWS } from '../../src/core/profiles.js';
import { AI_TOOLS } from '../../src/core/config.js';

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

/** The admitted identifiers, matched as whole substrings: `.openspec.yaml`, CoStrict's command directory, and each global directory with `/` or `\` before `openspec`. */
export const ADMITTED_IDENTIFIERS = [
  '.openspec.yaml',
  '.cospec/openspec/',
  ...DIRECTORY_PREFIXES.flatMap((prefix) => [`${prefix}/openspec`, `${prefix}\\openspec`]),
];

const RESIDUE = /openspec|opsx|fission/gi;

/** HTML enabled, as GitHub renders the README: a heading inside an HTML block is no heading. */
const md = new MarkdownIt({ html: true });

/** A top-level ATX section: its title, its heading level, and its 0-based line range [start, end). */
interface Section {
  title: string;
  level: number;
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
    level: heading.level,
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
 * The index of the next backtick run of exactly `run`'s length at or after `from` in a block's raw source, skipping
 * one preceded by a backslash when it would OPEN a span; -1 when none. A code span's name is located by its opening
 * run, so a span that wraps a line still counts that line ending (markdown-it emits no break token inside a span).
 */
function backtickRun(source: string, run: string, from: number, opening = true): number {
  for (let i = source.indexOf(run, from); i >= 0; i = source.indexOf(run, i + 1)) {
    if (source[i - 1] === '`' || source[i + run.length] === '`') continue;
    if (opening && source[i - 1] === '\\') continue;
    return i;
  }
  return -1;
}

/**
 * The improvement-claims check over `README.md` (every other surface passes): each top-level list
 * item of the claims section, its nested items' names counted toward it, names at least one
 * capability, and every name resolves. Names are read from `code_inline` tokens, so a fence is never
 * read; a name's line is its inline block's first line plus the line endings in the block's source before the span.
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
        let offset = 0;
        for (const child of inline.children ?? []) {
          if (child.type !== 'code_inline') continue;
          const open = backtickRun(inline.content, child.markup, offset);
          const close = open < 0 ? -1 : backtickRun(inline.content, child.markup, open + child.markup.length, false);
          if (close >= 0) offset = close + child.markup.length;
          if (!CAPABILITY_NAME.test(child.content)) continue;
          names++;
          if (!exists(child.content)) {
            const line = inline.map[0] + (open < 0 ? 0 : inline.content.slice(0, open).split('\n').length - 1);
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

// ─── the command-coverage check (reference-docs design D2, D3) ────

/** The two pages the check reads: the CLI reference owes every command path, the workflow reference every id. */
export const CLI_PAGE = 'docs/cli.md';
export const COMMANDS_PAGE = 'docs/commands.md';

/** Every visible command path of a program tree as `orbit <command> <subcommand>…`, at every depth. */
export function commandPathsOf(commands: ComparableCommand[], prefix = 'orbit'): string[] {
  return commands.flatMap((c) => [`${prefix} ${c.name}`, ...commandPathsOf(c.subcommands, `${prefix} ${c.name}`)]);
}

/** The real domain: the program's visible paths (hidden commands dropped at every level by `fromProgram`). */
export const commandPaths = (): string[] => commandPathsOf(fromProgram(buildProgram({ hooks: false })));

/** The real domain: the installed workflow ids. */
export const workflowIds = (): string[] => [...ALL_WORKFLOWS];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whether a page's text NAMES a command path: case-sensitive, bounded before `orbit` and after the last word. */
export const namesPath = (text: string, p: string): boolean =>
  new RegExp(`(?<![A-Za-z0-9_/.-])${escapeRegExp(p)}(?![A-Za-z0-9_-])`).test(text);

/** Whether a page's text NAMES a workflow id, as `/orbit:<id>` bounded after the id. */
export const namesWorkflow = (text: string, id: string): boolean =>
  new RegExp(`${escapeRegExp(`/orbit:${id}`)}(?![A-Za-z0-9_-])`).test(text);

/**
 * The command-coverage check over the given surfaces: `docs/cli.md` against every command path, `docs/commands.md`
 * against every workflow id, over the whole file; every other surface passes. It reads only the pages it is given.
 */
export function commandCoverageFailures(surfaces: Surface[], paths: string[], ids: string[]): string[] {
  const failures: string[] = [];
  for (const surface of surfaces) {
    if (surface.file === CLI_PAGE) {
      for (const p of paths) {
        if (!namesPath(surface.text, p)) failures.push(`${describeSurface(surface)}: does not name '${p}' (the command-coverage check)`);
      }
    } else if (surface.file === COMMANDS_PAGE) {
      for (const id of ids) {
        if (!namesWorkflow(surface.text, id)) failures.push(`${describeSurface(surface)}: does not name '/orbit:${id}' (the command-coverage check)`);
      }
    }
  }
  return failures;
}

/** The suite-level rule: each owing page is listed or present, so deleting or renaming one never empties the check. */
export function missingOwingPageFailures(
  pending: string[],
  docs: Surface[],
  pages: string[] = [CLI_PAGE, COMMANDS_PAGE],
  check = 'the command-coverage check',
): string[] {
  return pages
    .filter((page) => !pending.includes(page) && !docs.some((d) => d.file === page))
    .map((page) => `${page}: owed by ${check} but neither listed nor present among the user docs`);
}

// ─── the carried-by check (concept-docs design D1) ────────────────

/** The four concept pages whose H2 sections declare their owners. */
export const CONCEPT_PAGES = ['docs/concepts.md', 'docs/customization.md', 'docs/supported-tools.md', 'docs/multi-language.md'];

const CARRIED_BY = 'Carried by:';
const BASELINE_ITEM = 'the 1.3.1 baseline';
const DECISION_ITEM = /^fork-and-orbify D(\d+)$/;
const NAME_ITEM = /^`([^`]+)`$/;

/** Whether `fork-and-orbify D<n>` resolves: the architecture doc has a heading beginning `### D<n> — `. */
export const decisionExists = (() => {
  let headings: string[] | undefined;
  return (n: string): boolean => {
    headings ??= fs.readFileSync(path.join(REPO, 'orbit', 'architecture', 'fork-and-orbify.md'), 'utf-8').split('\n');
    return headings.some((line) => line.startsWith(`### D${n} — `));
  };
})();

/** Whether a section's top-level blocks are all lists whose every item's text is exactly one link (navigation). */
function isNavigation(tokens: ReturnType<typeof md.parse>, from: number, to: number): boolean {
  let lists = 0;
  for (let i = from; i < to; i++) {
    const t = tokens[i];
    if (t.level !== 0) continue;
    if (t.type === 'bullet_list_close' || t.type === 'ordered_list_close') continue;
    if (t.type !== 'bullet_list_open' && t.type !== 'ordered_list_open') return false;
    lists++;
    let j = i + 1;
    for (; j < to && !(tokens[j].level === 0 && tokens[j].type === t.type.replace('_open', '_close')); j++) {
      const item = tokens[j];
      if (item.level === 1 && item.type === 'list_item_open') {
        // Exactly one paragraph holding one link: list_item_open, paragraph_open, inline, paragraph_close, list_item_close.
        const [p, inline, pc, close] = tokens.slice(j + 1, j + 5);
        if (p?.type !== 'paragraph_open' || inline?.type !== 'inline' || pc?.type !== 'paragraph_close' || close?.type !== 'list_item_close') {
          return false;
        }
        if (!isOneLink(inline.children ?? [])) return false;
      }
    }
    i = j;
  }
  return lists > 0;
}

/** An inline's children are one link, with nothing beside it but whitespace or one trailing punctuation mark. */
function isOneLink(children: NonNullable<ReturnType<typeof md.parse>[number]['children']>): boolean {
  const open = children.findIndex((c) => c.type === 'link_open');
  const close = children.findIndex((c) => c.type === 'link_close');
  if (open < 0 || close < open) return false;
  const before = children.slice(0, open);
  const after = children.slice(close + 1);
  if (children.slice(open + 1, close).some((c) => c.type === 'link_open')) return false;
  if (!before.every((c) => c.type === 'text' && c.content.trim() === '')) return false;
  const rest = after.map((c) => (c.type === 'text' ? c.content : '\u0000')).join('');
  return /^\s*[.,;:!?]?\s*$/.test(rest);
}

/**
 * The carried-by check over the four concept pages (every other surface passes): each H2 section, to the next H1 or
 * H2, carries exactly one top-level `Carried by:` paragraph whose items all resolve, or is navigation. Sections and
 * paragraphs are read from the markdown-it token stream, so a fence, a list or a blockquote is never structure.
 */
export function carriedByFailures(
  surfaces: Surface[],
  exists: (name: string) => boolean = capabilityExists,
  decision: (n: string) => boolean = decisionExists,
): string[] {
  const failures: string[] = [];
  for (const surface of surfaces) {
    if (!CONCEPT_PAGES.includes(surface.file)) continue;
    const where = describeSurface(surface);
    const tokens = md.parse(surface.text, {});
    const bounds = tokens
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.type === 'heading_open' && t.level === 0 && (t.tag === 'h1' || t.tag === 'h2'));
    bounds.forEach(({ t: heading, i }, k) => {
      if (heading.tag !== 'h2' || !heading.map) return;
      const from = i + 3; // heading_open, inline, heading_close
      const to = bounds[k + 1]?.i ?? tokens.length;
      const lines: Array<{ line: number; text: string }> = [];
      for (let j = from; j < to; j++) {
        const p = tokens[j];
        if (p.type !== 'paragraph_open' || p.level !== 0 || !p.map) continue;
        const text = (tokens[j + 1]?.content ?? '').replace(/\s*\n\s*/g, ' ').trim();
        if (text.startsWith(CARRIED_BY)) lines.push({ line: p.map[0] + 1, text });
      }
      const headingLine = heading.map[0] + 1;
      if (lines.length === 0) {
        if (!isNavigation(tokens, from, to)) failures.push(`${where}:${headingLine}: section has no carried-by line (the carried-by check)`);
        return;
      }
      if (lines.length > 1) {
        failures.push(`${where}:${headingLine}: section has ${lines.length} carried-by lines (the carried-by check)`);
        return;
      }
      const { line, text } = lines[0];
      const body = text.slice(CARRIED_BY.length).trim();
      if (body === '') {
        failures.push(`${where}:${line}: carried-by line names no item (the carried-by check)`);
        return;
      }
      for (const raw of body.split(',')) {
        const item = raw.trim();
        const name = NAME_ITEM.exec(item)?.[1];
        const n = DECISION_ITEM.exec(item)?.[1];
        const resolves =
          item === BASELINE_ITEM ||
          (name !== undefined && CAPABILITY_NAME.test(name) && exists(name)) ||
          (n !== undefined && decision(n));
        if (!resolves) failures.push(`${where}:${line}: item '${item}' does not resolve (the carried-by check)`);
      }
    });
  }
  return failures;
}

// ─── the tool-coverage check (concept-docs design D2) ─────────────

/** The page the check reads. */
export const TOOLS_PAGE = 'docs/supported-tools.md';

/** Tier membership encodes fork-and-orbify D11, not a fact the code carries. */
export const TIER_ONE = ['claude', 'codex'];

/** An id's shape: a span in a tier's row read as an id, so a directory or a command beside it is no id. */
const TOOL_ID = /^[a-z][a-z0-9-]*$/;

/** An init target as the check reads it: its id and whether init accepts it. */
export interface ToolEntry {
  value: string;
  available: boolean;
}

/**
 * The tool-coverage check over `docs/supported-tools.md` (every other surface passes): each available `AI_TOOLS` id
 * named, as an inline code span in a table row, in its tier; no unavailable id, no unknown id, no id in the wrong tier.
 * Only a span shaped like an id (`TOOL_ID`) is read as one, so the directories a row names beside it are not ids.
 * A tier is the text under an H2 whose heading text begins `Tier 1` or `Tier 2`, to the next H1 or H2.
 */
export function toolCoverageFailures(surfaces: Surface[], tools: ToolEntry[] = AI_TOOLS): string[] {
  const failures: string[] = [];
  for (const surface of surfaces) {
    if (surface.file !== TOOLS_PAGE) continue;
    const where = describeSurface(surface);
    const tokens = md.parse(surface.text, {});
    const named = new Map<string, Set<1 | 2>>();
    const anywhere = new Set<string>();
    let tier: 1 | 2 | null = null;
    let inRow = false;
    tokens.forEach((t, i) => {
      if (t.type === 'heading_open' && t.level === 0 && (t.tag === 'h1' || t.tag === 'h2')) {
        const title = (tokens[i + 1]?.content ?? '').trim();
        tier = t.tag === 'h2' && /^Tier 1\b/.test(title) ? 1 : t.tag === 'h2' && /^Tier 2\b/.test(title) ? 2 : null;
      }
      if (t.type === 'tr_open') inRow = true;
      if (t.type === 'tr_close') inRow = false;
      if (t.type !== 'inline') return;
      for (const child of t.children ?? []) {
        if (child.type !== 'code_inline') continue;
        anywhere.add(child.content);
        if (!inRow || tier === null || !TOOL_ID.test(child.content)) continue;
        const tiers = named.get(child.content) ?? new Set<1 | 2>();
        tiers.add(tier);
        named.set(child.content, tiers);
      }
    });
    const byId = new Map(tools.map((tool) => [tool.value, tool]));
    for (const tool of tools) {
      const tiers = named.get(tool.value);
      if (!tool.available) {
        if (anywhere.has(tool.value)) failures.push(`${where}: names '${tool.value}', which is not an init target (the tool-coverage check)`);
        continue;
      }
      const owed: 1 | 2 = TIER_ONE.includes(tool.value) ? 1 : 2;
      const wrong: 1 | 2 = owed === 1 ? 2 : 1;
      if (tiers?.has(wrong)) failures.push(`${where}: '${tool.value}' sits in tier ${wrong}; it belongs in tier ${owed} (the tool-coverage check)`);
      if (!tiers?.has(owed)) failures.push(`${where}: does not name '${tool.value}' in tier ${owed} (the tool-coverage check)`);
    }
    for (const id of named.keys()) {
      if (!byId.has(id)) failures.push(`${where}: names '${id}' in a tier's table, which is no init target (the tool-coverage check)`);
    }
  }
  return failures;
}

// ─── the start-sections check (docs-refinement D-dr-4) ────────────

/** A listed start section: its page, and its heading as the requirement's table writes it (`### Your first change`). */
export interface StartSection {
  page: string;
  heading: string;
}

/** The listed start sections, (page, heading), exactly as the requirement's table lists them. */
export const START_SECTIONS: StartSection[] = [
  { page: 'README.md', heading: '### Your first change' },
  { page: 'docs/getting-started.md', heading: '## The change' },
  { page: 'docs/workflows.md', heading: '### One change, start to finish' },
  { page: 'docs/workflows.md', heading: '### Step by step' },
  { page: 'docs/workflows.md', heading: '### Exploring first' },
  { page: 'docs/workflows.md', heading: '## Practices' },
  { page: 'docs/workflow-engine.md', heading: '## Actions, not phases' },
  { page: 'docs/concepts.md', heading: '## Artifacts' },
];

/** The start commands; the first one a listed section names must be the first of these. */
export const START_COMMANDS = ['architect', 'explore', 'new', 'propose', 'ff'];

const START_IDS = START_COMMANDS.join('|');
/** `/orbit:<id>` anywhere, bounded after the id. */
const SLASH_START = new RegExp(`/orbit:(${START_IDS})(?![A-Za-z0-9_-])`, 'g');
/** Inside a fence: `<id>` as a whole word followed by ` ──►`, the flow-diagram form. */
const ARROW_START = new RegExp(`(?<![A-Za-z0-9-])(${START_IDS}) ──►`, 'g');

/** The first start command named in lines [start, end) of a page, reading `fenced` lines for the arrow form too. */
function firstStartCommand(lines: string[], start: number, end: number, fenced: Set<number>): string | undefined {
  for (let l = start; l < end; l++) {
    const hits = [...lines[l].matchAll(SLASH_START), ...(fenced.has(l) ? [...lines[l].matchAll(ARROW_START)] : [])];
    if (hits.length > 0) return hits.reduce((a, b) => ((b.index ?? 0) < (a.index ?? 0) ? b : a))[1];
  }
  return undefined;
}

/** 0-based lines inside a fence of a parse (the fence's own ``` lines included). */
function fencedLines(tokens: ReturnType<typeof md.parse>): Set<number> {
  const lines = new Set<number>();
  for (const token of tokens) {
    if (token.type !== 'fence' || !token.map) continue;
    for (let l = token.map[0]; l < token.map[1]; l++) lines.add(l);
  }
  return lines;
}

/**
 * The start-sections check over the given surfaces: on each listed page it is given, each listed heading's section
 * must name `/orbit:architect` as its first start command; a heading not found at its listed level fails. Every other
 * surface passes.
 */
export function startSectionFailures(surfaces: Surface[], sections: StartSection[] = START_SECTIONS): string[] {
  const failures: string[] = [];
  for (const surface of surfaces) {
    const listed = sections.filter((s) => s.page === surface.file);
    if (listed.length === 0) continue;
    const lines = surface.text.split('\n');
    const tokens = md.parse(surface.text, {});
    const all = atxSections(tokens, lines.length);
    const fenced = fencedLines(tokens);
    for (const { heading } of listed) {
      const where = `${describeSurface(surface)} › ${heading}`;
      const section = all.find((s) => `${'#'.repeat(s.level)} ${s.title}` === heading);
      if (!section) {
        failures.push(`${where}: heading not found (the start-sections check)`);
        continue;
      }
      const first = firstStartCommand(lines, section.start, section.end, fenced);
      if (first === undefined) failures.push(`${where}: names no start command (the start-sections check)`);
      else if (first !== 'architect') failures.push(`${where}: first start command is '${first}', not 'architect' (the start-sections check)`);
    }
  }
  return failures;
}

/** The pages the start-sections check owes, for the suite-level missing-page rule. */
export const START_PAGES = [...new Set(START_SECTIONS.map((s) => s.page))];

// ─── the version check (release D1, D2) ───────────────────────────

/** `package.json`'s `version`, the one current version. */
export const PACKAGE_VERSION: string = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf-8')).version;

/** An admission: by VALUE (compared with a leading `v` stripped), or by PHRASE in one file (a line break read as a space). */
export type VersionAdmission = { value: string } | { file: string; phrase: string };

/** The admitted list, exactly as the requirement's table lists it. */
export const VERSION_ADMISSIONS: VersionAdmission[] = [
  { file: 'README.md', phrase: "orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0" },
  { value: '1.3.1' },
  { value: '1.14.1' },
  { value: '20.19.0' },
];

/** The two pages that must carry the current install command. */
export const INSTALL_PAGES = ['README.md', 'docs/installation.md'];

const INSTALL_PREFIX = 'github:las-sal/orbit-spec#';
/** A version token: three dot-separated digit runs, optionally `v`-prefixed; a sentence-ending period does not hide it. */
const VERSION_TOKEN = /(?<![A-Za-z0-9.])v?\d+\.\d+\.\d+(?![A-Za-z0-9]|\.\d)/g;

const describeAdmission = (a: VersionAdmission): string =>
  'value' in a ? `value '${a.value}'` : `${a.file} phrase "${a.phrase}"`;

/** A phrase as a pattern matching each of its spaces as a space or a line break plus the indentation after it. */
const phrasePattern = (phrase: string): RegExp =>
  new RegExp(
    phrase
      .split(' ')
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('(?: |\\r?\\n[ \\t]*)'),
    'g',
  );

interface VersionToken {
  token: string;
  line: number;
  install: boolean;
  /** The admissions that admit it; always empty for an install target. */
  admittedBy: VersionAdmission[];
}

/** Every version token of a surface, with its 1-based line and the admissions that admit it. */
function versionTokens(surface: Surface, admissions: VersionAdmission[]): VersionToken[] {
  const text = surface.text;
  const spans = admissions
    .filter((a): a is { file: string; phrase: string } => 'phrase' in a && a.file === surface.file)
    .flatMap((a) => [...text.matchAll(phrasePattern(a.phrase))].map((m) => ({ a, start: m.index!, end: m.index! + m[0].length })));
  return [...text.matchAll(VERSION_TOKEN)].map((m) => {
    const start = m.index!;
    const end = start + m[0].length;
    const install = text.slice(Math.max(0, start - INSTALL_PREFIX.length), start) === INSTALL_PREFIX;
    const bare = m[0].replace(/^v/, '');
    const admittedBy = install
      ? []
      : [
          ...admissions.filter((a) => 'value' in a && a.value === bare),
          ...spans.filter((s) => s.start <= start && end <= s.end).map((s) => s.a),
        ];
    return { token: m[0], line: text.slice(0, start).split('\n').length, install, admittedBy };
  });
}

/**
 * The version check over the given surfaces (file-local): every token is current or admitted, an install target is
 * current whatever the list says, and each of the two install pages it is given carries the current install command.
 */
export function versionFailures(
  surfaces: Surface[],
  version: string = PACKAGE_VERSION,
  admissions: VersionAdmission[] = VERSION_ADMISSIONS,
): string[] {
  const failures: string[] = [];
  const current = (token: string) => token === version || token === `v${version}`;
  for (const surface of surfaces) {
    const where = describeSurface(surface);
    for (const t of versionTokens(surface, admissions)) {
      if (current(t.token)) continue;
      if (t.install) {
        failures.push(`${where}:${t.line}: install target '${t.token}' is not package.json's version ${version}; no admission applies to an install target (the version check)`);
      } else if (t.admittedBy.length === 0) {
        failures.push(`${where}:${t.line}: version token '${t.token}' is neither package.json's version ${version} nor admitted (the version check)`);
      }
    }
    const command = `npm install -g ${INSTALL_PREFIX}v${version}`;
    if (INSTALL_PAGES.includes(surface.file) && !new RegExp(`${command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9.])`).test(surface.text)) {
      failures.push(`${where}: carries no install command \`${command}\` (the version check)`);
    }
  }
  return failures;
}

/** The list's exactness (WHOLE-DOCS, never run on one listed file): an admission that admits no token in the given docs is stale. */
export function staleAdmissionFailures(surfaces: Surface[], admissions: VersionAdmission[] = VERSION_ADMISSIONS): string[] {
  const used = new Set(surfaces.flatMap((s) => versionTokens(s, admissions).flatMap((t) => t.admittedBy)));
  return admissions
    .filter((a) => !used.has(a))
    .map((a) => `admitted ${describeAdmission(a)}: admits no version token in the user docs (a stale admission)`);
}

// ─── the file-local checks and the pending list (design D2) ───────

/** The docs' declared set, read from `orbit-user-docs`' requirement as it stands. */
export function docsInventory(): Inventory {
  return readInventory(inventorySource(REPO, DOCS_INVENTORY), DOCS_INVENTORY);
}

/**
 * Every FILE-LOCAL check over the given surfaces, each failure prefixed with its check: residue, the
 * `orbit` sweep and guard, the `git`/`gh` sweeps and guards, the inventory's unknown heads against
 * the docs' declared set (`inventory`, by default the real one), the improvement-claims check
 * (`README.md` only), the command-coverage check (`docs/cli.md` and `docs/commands.md` only), the carried-by
 * check (the four concept pages only), the tool-coverage check (`docs/supported-tools.md` only), the
 * start-sections check (the pages its list names only), and the version check (every user doc).
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
  failures.push(...tag('coverage', commandCoverageFailures(surfaces, commandPaths(), workflowIds())));
  failures.push(...tag('carried-by', carriedByFailures(surfaces)));
  failures.push(...tag('tools', toolCoverageFailures(surfaces)));
  failures.push(...tag('start-sections', startSectionFailures(surfaces)));
  failures.push(...tag('version', versionFailures(surfaces)));
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
