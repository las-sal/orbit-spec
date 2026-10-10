/**
 * The shared snippet extractor (rc05, design D3/D4): every generated surface, the
 * commands a named tool is invoked with on it, and the GUARD that fails a command
 * written where the extractor does not look.
 *
 * The rules are `orbit-cli-grammar`'s `Every \`orbit\` snippet on the generated
 * surface parses against that program` — its places table, its fence table and
 * its tokenizer paragraph. This module implements them; it states none of them.
 *
 * Tool-agnostic apart from the tool name. rc05 shipped it for `orbit`; `rc05b-git-grammar`
 * made the tokenizer operator-aware (a line splits into SEGMENTS at each unquoted control
 * operator, each classified by its own first token) so `git` and `gh` could consume it, and
 * did not consume it unchanged. Fences are LOCATED by markdown-it (a devDependency), and
 * the same parse serves the extractor and the guard.
 */
import { readFileSync } from 'fs';
import MarkdownIt, { type Token } from 'markdown-it';
import { generateSkillContent, getSkillTemplates } from '../../src/core/shared/skill-generation.js';

export interface Surface {
  /** The workflow id (`getSkillTemplates()`'s `workflowId`). */
  workflowId: string;
  /** `SKILL.md`, or `references/<name>`. */
  file: string;
  /** The file as the generator writes it, so a reported line is a line of the installed file. */
  text: string;
}

export type SnippetSource = 'fence' | 'inline';

export interface Snippet {
  surface: Surface;
  /** 1-based line in the surface's text where the snippet starts. */
  line: number;
  /** The raw snippet text (joined lines for a quote spanning lines). */
  text: string;
  tokens: string[];
  source: SnippetSource;
}

export interface ExtractionFailure {
  surface: Surface;
  line: number;
  snippet: string;
  message: string;
}

export interface GuardFailure {
  surface: Surface;
  line: number;
  text: string;
}

/** A command tree for the bare-name rule: a node's names and its subcommands. */
export interface CommandNode {
  names: string[];
  children: CommandNode[];
}

export interface SurfaceAnalysis {
  /** Snippets to hand to the tool's parser. */
  snippets: Snippet[];
  /** Inline spans whose every token resolves to a command: prose, never parsed. */
  bareNames: Snippet[];
  failures: ExtractionFailure[];
  guard: GuardFailure[];
}

export const SHELL_INFO = new Set(['bash', 'sh', 'shell']);
export const MARKDOWN_INFO = new Set(['markdown', 'md']);

const md = new MarkdownIt();

const VERSION: string = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')).version;

/**
 * Every generated SKILL.md and `references/*.md`, through the generator's own registry. A SKILL.md
 * is the generator's own output — its frontmatter above the instructions — as written for the
 * tools that take no command-reference transform (Claude, Codex); a reference is written verbatim.
 */
export function generatedSurfaces(): Surface[] {
  const surfaces: Surface[] = [];
  for (const entry of getSkillTemplates()) {
    surfaces.push({ workflowId: entry.workflowId, file: 'SKILL.md', text: generateSkillContent(entry.template, VERSION) });
    for (const ref of entry.template.references ?? []) {
      surfaces.push({ workflowId: entry.workflowId, file: `references/${ref.name}`, text: ref.content });
    }
  }
  return surfaces;
}

export function describeSurface(surface: Surface): string {
  return `${surface.workflowId}/${surface.file}`;
}

function infoWord(token: Token): string {
  return token.info.trim().split(/\s+/)[0] ?? '';
}

// ─── tokenizer ────────────────────────────────────────────────────

export type TokenizeResult =
  | { ok: true; segments: string[][] }
  | { ok: false; open: '"' | "'" }
  | { ok: false; refused: Refused; quoted?: true };

/** What the tokenizer refuses rather than parses: substitution, `;;`, and a here-document. */
export type Refused = '$(' | '`' | ';;' | '<(' | '>(' | '<<';

/** The extraction failure's message for a refusal. */
export function refusalMessage(result: { refused: Refused; quoted?: true }): string {
  if (result.refused === '<<') return "unquoted << is refused: a here-document's body is never parsed";
  if (result.quoted) return `${result.refused} inside double quotes is refused: substitution is never parsed`;
  return `unquoted ${result.refused} is refused: substitution is never parsed`;
}

/** Control operators, longest first so `&&` is never read as two `&`. */
const CONTROL_OPERATORS = ['&&', '||', '|&', '|', ';', '&'];

/**
 * Split one command line into SEGMENTS of tokens by the spec's rules: a quoted
 * value is one token; a backslash escapes as the shell's does (outside quotes the
 * next character; inside double quotes `"`, `\`, `$` and a backtick; inside single
 * quotes nothing), so `\"` opens no quote; a `<…>` placeholder (a `<` not
 * followed by whitespace, which is a redirect) is one token, spaces inside and a
 * suffix attached; a trailing ` # …` comment outside quotes is dropped; `…` and
 * `...` are dropped. Outside quotes, a control operator (`&&`, `||`, `|&`, `|`,
 * `;`, `&`), spaced or glued, ends the segment; a redirection (`>`, `>>`, `>|`,
 * `>&`, `<` followed by whitespace, `<>`, `<&`, a digit glued before any of them)
 * and its target are dropped; a `(` opening a segment and its matching `)` are
 * grouping, stripped. An open quote at the end is reported, so the caller can join
 * the next line or fail. Refused, never parsed: an unquoted `$(`, backtick, `<(`,
 * `>(`, `;;` or `<<` (a here-document, whose body lines are data), and a `$(` or
 * backtick inside double quotes, where the shell still runs it.
 */
export function tokenize(line: string): TokenizeResult {
  const segments: string[][] = [];
  let tokens: string[] = [];
  let current = '';
  let inToken = false;
  let dropNext = false;
  let groups = 0;
  let i = 0;
  const push = () => {
    if (inToken && current !== '…' && current !== '...') {
      if (dropNext) dropNext = false;
      else tokens.push(current);
    }
    current = '';
    inToken = false;
  };
  const endSegment = () => {
    push();
    if (tokens.length > 0) segments.push(tokens);
    tokens = [];
    dropNext = false;
  };
  while (i < line.length) {
    const c = line[i];
    if (/\s/.test(c)) {
      push();
      i++;
      continue;
    }
    if (c === '#' && !inToken) break;
    if (c === '`') return { ok: false, refused: '`' };
    if (c === '$' && line[i + 1] === '(') return { ok: false, refused: '$(' };
    if (line.startsWith(';;', i)) return { ok: false, refused: ';;' };
    if (line.startsWith('<<', i)) return { ok: false, refused: '<<' };
    if (line.startsWith('<(', i)) return { ok: false, refused: '<(' };
    if (line.startsWith('>(', i)) return { ok: false, refused: '>(' };
    // A redirection: `>`, `>>`, `>|`, `>&`, `<` followed by whitespace or the line's end,
    // `<>`, `<&`, and a digit (the file descriptor) glued before any of them. The operator
    // and its target are dropped.
    const redirect =
      c === '>' ? (/^>[>|&]/.test(line.slice(i, i + 2)) ? 2 : 1)
      : c === '<' ? (/^<[>&]/.test(line.slice(i, i + 2)) ? 2 : i + 1 >= line.length || /\s/.test(line[i + 1]) ? 1 : 0)
      : 0;
    if (redirect > 0) {
      if (inToken && /^\d+$/.test(current)) {
        current = '';
        inToken = false;
      } else {
        push();
      }
      i += redirect;
      dropNext = true;
      continue;
    }
    const operator = CONTROL_OPERATORS.find((op) => line.startsWith(op, i));
    if (operator) {
      endSegment();
      i += operator.length;
      continue;
    }
    if (c === '(' && !inToken && tokens.length === 0) {
      groups++;
      i++;
      continue;
    }
    if (c === ')' && groups > 0) {
      groups--;
      endSegment();
      i++;
      continue;
    }
    if (c === '\\' && i + 1 < line.length) {
      current += line[i + 1];
      inToken = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      const end = line.indexOf("'", i + 1);
      if (end === -1) return { ok: false, open: "'" };
      current += line.slice(i + 1, end);
      inToken = true;
      i = end + 1;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let value = '';
      while (j < line.length && line[j] !== '"') {
        if (line[j] === '\\' && j + 1 < line.length && '"\\$`'.includes(line[j + 1])) {
          value += line[j + 1];
          j += 2;
          continue;
        }
        if (line[j] === '`') return { ok: false, refused: '`', quoted: true };
        if (line[j] === '$' && line[j + 1] === '(') return { ok: false, refused: '$(', quoted: true };
        value += line[j];
        j++;
      }
      if (j >= line.length) return { ok: false, open: '"' };
      current += value;
      inToken = true;
      i = j + 1;
      continue;
    }
    // `< file` (whitespace after) is a shell redirect, never a placeholder's opener.
    if (c === '<' && i + 1 < line.length && !/\s/.test(line[i + 1])) {
      const end = line.indexOf('>', i + 1);
      if (end !== -1) {
        current += line.slice(i, end + 1);
        inToken = true;
        i = end + 1;
        continue;
      }
    }
    current += c;
    inToken = true;
    i++;
  }
  endSegment();
  return { ok: true, segments };
}

// ─── the bare-name rule ───────────────────────────────────────────

/** True when every token after the tool resolves to a command, with nothing after. */
export function isBareCommandName(tokens: string[], tree: CommandNode): boolean {
  let node = tree;
  for (const token of tokens.slice(1)) {
    const next = node.children.find((child) => child.names.includes(token));
    if (!next) return false;
    node = next;
  }
  return true;
}

// ─── the guard's normalisation ────────────────────────────────────

/** Strip leading whitespace, blockquote `>` markers, list markers and a leading `|`. */
export function normaliseGuardLine(line: string): string {
  let s = line;
  for (;;) {
    const before = s;
    s = s.replace(/^\s+/, '');
    s = s.replace(/^>/, '');
    s = s.replace(/^(?:[-*+]|\d+[.)])(?=\s)/, '');
    s = s.replace(/^\|/, '');
    if (s === before) return s;
  }
}

export function guardFails(line: string, tool: string): boolean {
  const words = normaliseGuardLine(line).split(/\s+/).filter(Boolean);
  return words[0] === tool && words.slice(1).some((w) => w.startsWith('-'));
}

// ─── extraction ───────────────────────────────────────────────────

interface Walk {
  surface: Surface;
  tool: string;
  tree?: CommandNode;
  out: SurfaceAnalysis;
  /** 0-based surface lines covered by a shell fence (delimiters included). */
  shellLines: Set<number>;
}

function extractFenceLines(walk: Walk, token: Token, contentStart: number): void {
  const lines = token.content.replace(/\n$/, '').split('\n');
  let i = 0;
  while (i < lines.length) {
    const startIdx = i;
    let text = lines[i];
    let result = tokenize(text);
    while (!result.ok && i + 1 < lines.length) {
      i++;
      text += '\n' + lines[i];
      result = tokenize(text);
    }
    const line = contentStart + startIdx + 1;
    if (!result.ok) {
      // Whatever the line's first word: a non-tool line holding a quote open would
      // otherwise swallow every tool line after it, unseen by the sweep and the guard;
      // and a substitution is refused, never parsed.
      walk.out.failures.push({
        surface: walk.surface,
        line,
        snippet: text,
        message:
          'open' in result ? `unterminated ${result.open} quote at the end of the shell fence` : refusalMessage(result),
      });
      i++;
      continue;
    }
    for (const tokens of result.segments) {
      if (tokens[0] === walk.tool) {
        walk.out.snippets.push({ surface: walk.surface, line, text, tokens, source: 'fence' });
      }
    }
    // The quote that joined lines sits in the segment whose token holds the newline.
    const joiner = result.segments.find((tokens) => tokens.some((t) => t.includes('\n')));
    if (joiner && joiner[0] !== walk.tool) {
      // Another tool's quote, closed by a later line, would hold a tool line as data,
      // unseen by the sweep and the guard: each such joined line fails at its own line.
      for (let k = startIdx + 1; k <= i; k++) {
        if (firstWord(lines[k]) === walk.tool) {
          walk.out.failures.push({
            surface: walk.surface,
            line: contentStart + k + 1,
            snippet: lines[k],
            message: `inside a quote opened at line ${line} by another command`,
          });
        }
      }
    }
    i++;
  }
}

function firstWord(line: string): string {
  return line.trim().split(/\s+/)[0] ?? '';
}

function locateInline(parent: Token, child: Token, from: number): { index: number; end: number } | null {
  const escaped = child.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ \\n]');
  const re = new RegExp(`${child.markup} ?${escaped} ?${child.markup}`, 'g');
  re.lastIndex = from;
  const m = re.exec(parent.content);
  return m ? { index: m.index, end: m.index + m[0].length } : null;
}

function extractInline(walk: Walk, parent: Token, offset: number, blockLine: number): void {
  let cursor = 0;
  for (const child of parent.children ?? []) {
    if (child.type !== 'code_inline') continue;
    const found = locateInline(parent, child, cursor);
    const before = found ? parent.content.slice(0, found.index) : '';
    if (found) cursor = found.end;
    const line = offset + (parent.map?.[0] ?? blockLine) + before.split('\n').length;
    if (child.markup !== '`' || !child.content.startsWith(`${walk.tool} `)) continue;
    const result = tokenize(child.content);
    if (!result.ok) {
      walk.out.failures.push({
        surface: walk.surface,
        line,
        snippet: child.content,
        message:
          'open' in result ? `unterminated ${result.open} quote in the inline span` : refusalMessage(result),
      });
      continue;
    }
    for (const tokens of result.segments) {
      if (tokens[0] !== walk.tool) continue;
      const snippet: Snippet = { surface: walk.surface, line, text: child.content, tokens, source: 'inline' };
      if (walk.tree && isBareCommandName(tokens, walk.tree)) walk.out.bareNames.push(snippet);
      else walk.out.snippets.push(snippet);
    }
  }
}

/** Walk one markdown text whose line 0 sits at surface line `offset` (0-based). */
function walkText(walk: Walk, text: string, offset: number): void {
  // A table cell's inline token carries no map; its row (`tr_open`) does.
  let blockLine = 0;
  for (const token of md.parse(text, {})) {
    if (token.map && token.type !== 'inline') blockLine = token.map[0];
    if (token.type === 'fence' && token.map) {
      const info = infoWord(token);
      const start = offset + token.map[0];
      if (SHELL_INFO.has(info)) {
        for (let l = start; l < offset + token.map[1]; l++) walk.shellLines.add(l);
        extractFenceLines(walk, token, start + 1);
      } else if (MARKDOWN_INFO.has(info)) {
        walkText(walk, token.content, start + 1);
      }
    } else if (token.type === 'inline') {
      extractInline(walk, token, offset, blockLine);
    }
  }
}

/**
 * Analyse one surface for `tool`: the snippets to parse, the bare command names
 * (when a command tree is given), the extraction failures, and the guard's
 * failures over every line outside a shell fence.
 */
export function analyseSurface(surface: Surface, tool: string, tree?: CommandNode): SurfaceAnalysis {
  const walk: Walk = {
    surface,
    tool,
    tree,
    out: { snippets: [], bareNames: [], failures: [], guard: [] },
    shellLines: new Set(),
  };
  walkText(walk, surface.text, 0);
  surface.text.split('\n').forEach((text, idx) => {
    if (!walk.shellLines.has(idx) && guardFails(text, tool)) {
      walk.out.guard.push({ surface, line: idx + 1, text });
    }
  });
  return walk.out;
}

export function analyseSurfaces(surfaces: Surface[], tool: string, tree?: CommandNode): SurfaceAnalysis {
  const all: SurfaceAnalysis = { snippets: [], bareNames: [], failures: [], guard: [] };
  for (const surface of surfaces) {
    const one = analyseSurface(surface, tool, tree);
    all.snippets.push(...one.snippets);
    all.bareNames.push(...one.bareNames);
    all.failures.push(...one.failures);
    all.guard.push(...one.guard);
  }
  return all;
}

/**
 * rc05 design D8: a backslash immediately before a backtick in a surface's RAW text — a
 * TypeScript escaping slip inside a template literal that CommonMark reads as text, so the
 * extractor cannot see it. Exceptions: none; an intended one would be named here.
 */
export function escapedBacktickFailures(surfaces: Surface[]): string[] {
  const failures: string[] = [];
  for (const surface of surfaces) {
    surface.text.split('\n').forEach((line, idx) => {
      if (line.includes('\\`')) failures.push(`${describeSurface(surface)}:${idx + 1}: ${line.trim()}`);
    });
  }
  return failures;
}
