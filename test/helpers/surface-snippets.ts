/**
 * The shared snippet extractor (rc05, design D3/D4): every generated surface, the
 * commands a named tool is invoked with on it, and the GUARD that fails a command
 * written where the extractor does not look.
 *
 * The rules are `orbit-cli-grammar`'s `Every \`orbit\` snippet on the generated
 * surface parses against that program` — its places table, its fence table and
 * its tokenizer paragraph. This module implements them; it states none of them.
 *
 * Tool-agnostic apart from the tool name: `rc05b-git-grammar` consumes it
 * unchanged. Fences are LOCATED by markdown-it (a devDependency), and the same
 * parse serves the extractor and the guard.
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

export type TokenizeResult = { ok: true; tokens: string[] } | { ok: false; open: '"' | "'" };

/**
 * Split one command line into tokens by the spec's rules: a quoted value is one
 * token; a backslash escapes as the shell's does (outside quotes the next
 * character; inside double quotes `"`, `\`, `$` and a backtick; inside single
 * quotes nothing), so `\"` opens no quote; a `<…>` placeholder (a `<` not
 * followed by whitespace, which is a redirect) is one token,
 * spaces inside and a suffix attached; a trailing ` # …` comment outside quotes
 * is dropped; `…` and `...` are dropped. An open quote at the end is reported, so
 * the caller can join the next line or fail.
 */
export function tokenize(line: string): TokenizeResult {
  const tokens: string[] = [];
  let current = '';
  let inToken = false;
  let i = 0;
  const push = () => {
    if (inToken && current !== '…' && current !== '...') tokens.push(current);
    current = '';
    inToken = false;
  };
  while (i < line.length) {
    const c = line[i];
    if (/\s/.test(c)) {
      push();
      i++;
      continue;
    }
    if (c === '#' && !inToken) break;
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
  push();
  return { ok: true, tokens };
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
      // otherwise swallow every tool line after it, unseen by the sweep and the guard.
      walk.out.failures.push({
        surface: walk.surface,
        line,
        snippet: text,
        message: `unterminated ${result.open} quote at the end of the shell fence`,
      });
      i++;
      continue;
    }
    if (result.tokens[0] === walk.tool) {
      walk.out.snippets.push({ surface: walk.surface, line, text, tokens: result.tokens, source: 'fence' });
    }
    i++;
  }
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
        message: `unterminated ${result.open} quote in the inline span`,
      });
      continue;
    }
    const snippet: Snippet = { surface: walk.surface, line, text: child.content, tokens: result.tokens, source: 'inline' };
    if (walk.tree && isBareCommandName(result.tokens, walk.tree)) walk.out.bareNames.push(snippet);
    else walk.out.snippets.push(snippet);
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
