/**
 * rc09b (design D1–D6): the TOOL INVENTORY. Every command head the shared extractor reads on the
 * generated surface is a RECORDED tool or a DECLARED exemption — `orbit-cli-grammar`'s `Every command
 * head on the generated surface is a recorded tool or a declared exemption`. This file implements
 * that requirement's checks; it states none of its rules.
 *
 * The recorded tools are DERIVED (`orbit` plus `recordedTools()`, design D3). The exemptions are the
 * requirement's one `inventory` fence, read from the requirement AS IT STANDS (design D2): the one
 * active change whose delta ADDs or MODIFIes it, else the baseline — so the test needs no edit at
 * archive. Every failure kind is collected and reported together (design D4).
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import MarkdownIt from 'markdown-it';
import { afterAll, describe, expect, it } from 'vitest';
import { createFenceTracker } from '../../../src/core/markdown-fence.js';
import { recordedTools } from '../../helpers/recorded-sweep.js';
import {
  MARKDOWN_INFO,
  SHELL_INFO,
  analyseHeads,
  describeSurface,
  generatedSurfaces,
  type Head,
  type Surface,
} from '../../helpers/surface-snippets.js';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const CAPABILITY = 'orbit-cli-grammar';
const TITLE = 'Every command head on the generated surface is a recorded tool or a declared exemption';
const HEADING = `### Requirement: ${TITLE}`;
const KINDS = ['utility', 'placeholder', 'prose'] as const;
type Kind = (typeof KINDS)[number];

const md = new MarkdownIt();

// ─── the exemption block (design D2) ──────────────────────────────

interface Source {
  file: string; // repo-relative
  text: string;
}

/** The 0-based line of the requirement's heading outside a fence, under `section` when given, or -1. */
function headingLine(text: string, sections?: string[]): number {
  const tracker = createFenceTracker();
  let current: string | null = null;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    const wasIn = tracker.inFence;
    if (tracker.handle(line) || wasIn) continue;
    if (/^## /.test(line)) current = line.trim();
    else if (line === HEADING && (sections === undefined || (current !== null && sections.includes(current)))) return i;
  }
  return -1;
}

const HOLDING_SECTIONS = ['## ADDED Requirements', '## MODIFIED Requirements'];

/** The requirement as it stands: the one active delta adding or modifying it, else the baseline. */
function inventorySource(root: string): Source {
  const holders: string[] = [];
  const changesDir = path.join(root, 'orbit', 'changes');
  for (const d of fs.existsSync(changesDir) ? fs.readdirSync(changesDir).sort() : []) {
    if (d === 'archive') continue;
    const rel = path.join('orbit', 'changes', d, 'specs', CAPABILITY, 'spec.md');
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && headingLine(fs.readFileSync(abs, 'utf-8'), HOLDING_SECTIONS) >= 0) holders.push(rel);
  }
  if (holders.length > 1) {
    throw new Error(`more than one active change adds or modifies '${TITLE}': ${holders.join(', ')}`);
  }
  const rel = holders[0] ?? path.join('orbit', 'specs', CAPABILITY, 'spec.md');
  return { file: rel, text: fs.readFileSync(path.join(root, rel), 'utf-8') };
}

interface Exemption {
  head: string;
  kind: Kind;
  line: number; // 1-based line in the source
}

interface Inventory {
  exemptions: Exemption[];
  /** Malformed-block failures, each naming the requirement and the offending line. */
  failures: string[];
}

/** The requirement's `inventory` fence, parsed by the production of design D2. */
function readInventory(src: Source): Inventory {
  const lines = src.text.split('\n');
  const start = headingLine(src.text);
  const at = (line: number, message: string) => `${src.file}:${line}: '${TITLE}': ${message}`;
  if (start < 0) return { exemptions: [], failures: [`${src.file}: no '${HEADING}'`] };
  // The block ends at the next requirement or section heading outside a fence.
  const tracker = createFenceTracker();
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const wasIn = tracker.inFence;
    const delim = tracker.handle(lines[i]);
    if (!wasIn && !delim && /^#{2,3} /.test(lines[i])) {
      end = i;
      break;
    }
  }
  const fences = md
    .parse(lines.slice(start + 1, end).join('\n'), {})
    .filter((t) => t.type === 'fence' && t.map && t.info.trim().split(/\s+/)[0] === 'inventory');
  if (fences.length === 0) return { exemptions: [], failures: [at(start + 1, 'no `inventory` fence')] };
  const failures: string[] = [];
  for (const extra of fences.slice(1)) {
    failures.push(at(start + 2 + extra.map![0], 'a second `inventory` fence; the block is exactly one'));
  }
  const fence = fences[0];
  const contentStart = start + 2 + fence.map![0] + 1; // 1-based line of the fence's first content line
  const exemptions: Exemption[] = [];
  const kindsSeen = new Map<string, number>();
  const headsSeen = new Map<string, number>();
  fence.content
    .replace(/\n$/, '')
    .split('\n')
    .forEach((text, k) => {
      const line = contentStart + k;
      const m = /^([^:\s]+): (\S+(?: \S+)*)$/.exec(text);
      if (!m) {
        failures.push(at(line, `'${text}' does not match '<kind>: <head> <head> …'`));
        return;
      }
      const kind = m[1];
      if (!(KINDS as readonly string[]).includes(kind)) {
        failures.push(at(line, `unknown kind '${kind}'; the kinds are ${KINDS.join(', ')}`));
        return;
      }
      if (kindsSeen.has(kind)) {
        failures.push(at(line, `kind '${kind}' repeated (first at line ${kindsSeen.get(kind)})`));
        return;
      }
      kindsSeen.set(kind, line);
      for (const head of m[2].split(' ')) {
        if (headsSeen.has(head)) {
          failures.push(at(line, `head '${head}' repeated (first at line ${headsSeen.get(head)})`));
          continue;
        }
        headsSeen.set(head, line);
        exemptions.push({ head, kind: kind as Kind, line });
      }
    });
  return { exemptions, failures };
}

// ─── the sweep (design D3/D4) ─────────────────────────────────────

/** `orbit`, whose program the builder builds, plus every tool the recorded-contract sweep validates. */
function recordedHeads(): string[] {
  return ['orbit', ...recordedTools().map((t) => t.tool)];
}

/** Every failure kind, collected: unknown heads, unused exemptions, exemptions shadowing a recorded tool, a malformed block. */
function inventoryFailures(heads: Head[], recorded: string[], inventory: Inventory): string[] {
  const failures = [...inventory.failures];
  const declared = new Map(inventory.exemptions.map((e) => [e.head, e]));
  for (const h of heads) {
    if (!recorded.includes(h.head) && !declared.has(h.head)) {
      failures.push(
        `${describeSurface(h.surface)}:${h.line}: head '${h.head}' is neither a recorded tool nor a declared exemption (${h.source})`,
      );
    }
  }
  const read = new Set(heads.map((h) => h.head));
  for (const e of inventory.exemptions) {
    if (recorded.includes(e.head)) {
      failures.push(`declared ${e.kind} head '${e.head}' is a recorded tool; one head has one standing`);
    } else if (!read.has(e.head)) {
      failures.push(`declared ${e.kind} head '${e.head}' is read on no surface`);
    }
  }
  return failures;
}

function sweep(surfaces: Surface[], src: Source = inventorySource(repo)): string[] {
  return inventoryFailures(analyseHeads(surfaces), recordedHeads(), readInventory(src));
}

// ─── injection helpers ────────────────────────────────────────────

function surfaceNamed(id: string): Surface {
  const found = generatedSurfaces().find((s) => describeSurface(s) === id);
  if (!found) throw new Error(`no surface ${id}`);
  return found;
}

function withSurface(replacement: Surface): Surface[] {
  return generatedSurfaces().map((s) => (describeSurface(s) === describeSurface(replacement) ? replacement : s));
}

/** Insert `line` after 0-based line `after`, indented like that line; returns the copy and the 1-based line. */
function insertAfter(surface: Surface, after: number, line: string): { surface: Surface; line: number } {
  const lines = surface.text.split('\n');
  const indent = lines[after].match(/^[\s>]*/)?.[0] ?? '';
  lines.splice(after + 1, 0, indent + line);
  return { surface: { ...surface, text: lines.join('\n') }, line: after + 2 };
}

/** The first reference holding a top-level shell fence (or the first surface with one nested in a markdown fence), and its 0-based opening line. */
function firstFence(nested: boolean): { surface: Surface; opening: number } {
  for (const surface of generatedSurfaces()) {
    if (!nested && !surface.file.startsWith('references/')) continue;
    for (const token of md.parse(surface.text, {})) {
      if (token.type !== 'fence' || !token.map) continue;
      const info = token.info.trim().split(/\s+/)[0];
      if (!nested && SHELL_INFO.has(info) && token.level === 0) return { surface, opening: token.map[0] };
      if (nested && MARKDOWN_INFO.has(info)) {
        for (const inner of md.parse(token.content, {})) {
          if (inner.type === 'fence' && inner.map && SHELL_INFO.has(inner.info.trim().split(/\s+/)[0])) {
            return { surface, opening: token.map[0] + 1 + inner.map[0] };
          }
        }
      }
    }
  }
  throw new Error(`no ${nested ? 'markdown-nested ' : ''}shell fence on the surface`);
}

/** A SKILL.md copy with a prose paragraph holding `span` appended; returns the copy and the span's 1-based line. */
function withInlineSpan(span: string): { surface: Surface; line: number } {
  const surface = surfaceNamed('apply/SKILL.md');
  const text = `${surface.text.replace(/\n*$/, '')}\n\nRun \`${span}\` here.\n`;
  return { surface: { ...surface, text }, line: text.split('\n').length - 1 };
}

const unknownHead = (s: Surface, line: number, head: string) => `${describeSurface(s)}:${line}: head '${head}' is neither`;

/** The real source with its inventory fence's `kind` line rewritten (or the whole fence replaced). */
function editedSource(edit: (text: string) => string): Source {
  const src = inventorySource(repo);
  const text = edit(src.text);
  if (text === src.text) throw new Error('the edit changed nothing');
  return { file: src.file, text };
}

// ─── the head production (design D5, task 1.3) ────────────────────

const FENCE = '```';

function headsOf(text: string): Array<{ line: number; head: string; source: string }> {
  return analyseHeads([{ workflowId: 'demo', file: 'SKILL.md', text }]).map((h) => ({
    line: h.line,
    head: h.head,
    source: h.source,
  }));
}

describe('the head production', () => {
  it('skips an assignment prefix in a fence and in an inline span', () => {
    expect(headsOf(`${FENCE}bash\nFOO=1 BAR=x jq -r .x\n${FENCE}\n\nRun \`A=1 tool --flag\`.\n`)).toEqual([
      { line: 2, head: 'jq', source: 'fence' },
      { line: 5, head: 'tool', source: 'inline' },
    ]);
  });

  it("reads a subshell's inner heads, its grouping stripped", () => {
    expect(headsOf(`${FENCE}sh\n( cd <dir> && orbit list --json )\n${FENCE}\n`).map((h) => h.head)).toEqual(['cd', 'orbit']);
  });

  it('reads a brace group as the head `{`', () => {
    expect(headsOf(`${FENCE}bash\n{ cd x; ls; }\n${FENCE}\n`).map((h) => h.head)).toContain('{');
  });

  it('reads a head in a shell fence nested in a markdown fence, at its surface line', () => {
    const text = `Intro\n\n${FENCE}\`markdown\nText\n\n${FENCE}bash\njq -r .x\n${FENCE}\n${FENCE}\`\n`;
    expect(headsOf(text)).toEqual([{ line: 7, head: 'jq', source: 'fence' }]);
  });

  it('reads no head from an inline span carrying no flag token', () => {
    expect(headsOf('See `jq output` and `orbit list`.\n')).toEqual([]);
  });

  it('reads a path head in a fence, never inline', () => {
    expect(headsOf(`Run \`./bin/orbit.js list --json\`.\n\n${FENCE}bash\n./bin/orbit.js list --json\n${FENCE}\n`)).toEqual([
      { line: 4, head: './bin/orbit.js', source: 'fence' },
    ]);
  });

  it('reads `head -1`: a digit is a flag token', () => {
    expect(headsOf('Pipe it: `orbit status --json | head -1`.\n').map((h) => h.head)).toEqual(['orbit', 'head']);
  });

  it('reads no head from a refused line, a comment or a double-backtick span', () => {
    expect(headsOf(`${FENCE}bash\n# jq -r .x\njq -r $(cat x)\n\n${FENCE}\n\nSee \`\`jq -r .x\`\`.\n`)).toEqual([]);
  });

  it('reads a test word and a placeholder as heads in a fence', () => {
    expect(headsOf(`${FENCE}bash\n[ -f x ] && <argv[0]> --flag\n${FENCE}\n`).map((h) => h.head)).toEqual(['[', '<argv[0]>']);
  });

  it('reads a head in a shell fence nested in a blockquote', () => {
    expect(headsOf(`> Note\n>\n> ${FENCE}bash\n> jq -r .x\n> ${FENCE}\n`)).toEqual([{ line: 4, head: 'jq', source: 'fence' }]);
  });

  it('reads each line of a backslash continuation as its own command', () => {
    expect(headsOf(`${FENCE}bash\norbit status \\\n  --change x --json\n${FENCE}\n`).map((h) => h.head)).toEqual(['orbit', '--change']);
  });

  it('reads nothing outside a shell fence: a json or untagged fence', () => {
    expect(headsOf(`${FENCE}json\njq -r .x\n${FENCE}\n\n${FENCE}\njq -r .x\n${FENCE}\n`)).toEqual([]);
  });
});

// ─── the day-one sweep ────────────────────────────────────────────

describe('the tool inventory', () => {
  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: Today's surface passes the inventory
  it("today's surface passes: every head recorded or declared, every declared head read", () => {
    expect(sweep(generatedSurfaces())).toEqual([]);
  });

  it('the recorded tools are derived: orbit, then exactly the recorded-contract sweep\'s tools', () => {
    const heads = recordedHeads();
    expect(heads[0]).toBe('orbit');
    expect(heads.slice(1)).toEqual(recordedTools().map((t) => t.tool));
  });

  it('a head gains standing by being recorded, with nothing in the inventory edited', () => {
    const injected = withInlineSpan('jq -r .url <path>');
    const heads = analyseHeads(withSurface(injected.surface));
    const inventory = readInventory(inventorySource(repo));
    expect(inventoryFailures(heads, recordedHeads(), inventory)).toHaveLength(1);
    expect(inventoryFailures(heads, [...recordedHeads(), 'jq'], inventory)).toEqual([]);
  });

  // The floor names only what the sweep cannot itself hold: the declared heads are held read by the
  // exactness rule above, so an exemption leaves with its last use and the floor never pins it.
  it('is not vacuous: the recorded tools are read where explore Case 2 measured them', () => {
    const heads = analyseHeads(generatedSurfaces());
    expect(heads.filter((h) => h.head === 'orbit' && h.source === 'fence').length).toBeGreaterThanOrEqual(48);
    expect(heads.filter((h) => h.head === 'git' && h.source === 'fence').length).toBeGreaterThanOrEqual(14);
    expect(heads.filter((h) => h.head === 'gh' && h.source === 'inline').length).toBeGreaterThanOrEqual(15);
  });
});

// ─── one injection per scenario (design D6) ───────────────────────

describe('the inventory shown able to fail', () => {
  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: A new tool in a shell fence fails
  it('a new tool in a shell fence fails, naming surface, line and head', () => {
    const { surface, opening } = firstFence(false);
    expect(surface.file).toMatch(/^references\//);
    const injected = insertAfter(surface, opening, 'jq -r .url <path>');
    const failures = sweep(withSurface(injected.surface));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain(unknownHead(surface, injected.line, 'jq'));
  });

  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: A new tool in a flagged inline span fails
  it('a new tool in a flagged inline span fails, naming surface, line and head', () => {
    const injected = withInlineSpan('jq -r .url <path>');
    const failures = sweep(withSurface(injected.surface));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain(unknownHead(injected.surface, injected.line, 'jq'));
  });

  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: An inline span without a flag token is not read
  it('an inline span without a flag token is not read, and the suite passes', () => {
    const injected = withInlineSpan('jq output');
    expect(analyseHeads([injected.surface]).filter((h) => h.line === injected.line)).toEqual([]);
    expect(sweep(withSurface(injected.surface))).toEqual([]);
  });

  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: An assignment prefix does not hide the head
  it('an assignment prefix does not hide the head', () => {
    const { surface, opening } = firstFence(false);
    const injected = insertAfter(surface, opening, 'FOO=1 jq -r .url <path>');
    const failures = sweep(withSurface(injected.surface));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain(unknownHead(surface, injected.line, 'jq'));
  });

  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: A head in a markdown-nested shell fence is read
  it('a head in a markdown-nested shell fence is read', () => {
    const { surface, opening } = firstFence(true);
    const injected = insertAfter(surface, opening, 'jq -r .url <path>');
    const failures = sweep(withSurface(injected.surface));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain(unknownHead(surface, injected.line, 'jq'));
  });

  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: An exemption no line uses fails
  it('an exemption no line uses fails, naming the head and its kind', () => {
    const src = editedSource((t) => t.replace(/^utility: (.*)$/m, 'utility: $1 rsync'));
    expect(sweep(generatedSurfaces(), src)).toEqual(["declared utility head 'rsync' is read on no surface"]);
  });

  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: An exemption naming a recorded tool fails
  it('an exemption naming a recorded tool fails, naming the head', () => {
    const src = editedSource((t) => t.replace(/^utility: (.*)$/m, 'utility: $1 git'));
    expect(sweep(generatedSurfaces(), src)).toEqual([
      "declared utility head 'git' is a recorded tool; one head has one standing",
    ]);
  });
});

// ─── the block reader (task 2.2) ──────────────────────────────────

describe('the exemption block reader', () => {
  const real = inventorySource(repo);
  const fenceLine = real.text.split('\n').indexOf('```inventory') + 1; // 1-based opening line
  const heading = real.text.split('\n').indexOf(HEADING) + 1;

  function malformed(edit: (text: string) => string): string[] {
    const src = editedSource(edit);
    const failures = sweep(generatedSurfaces(), src);
    // Never vacuous: the malformation itself is reported, whatever else falls out of it.
    return failures.filter((f) => f.startsWith(`${src.file}:`));
  }

  it('reads the three kinds from the real block', () => {
    const inv = readInventory(real);
    expect(inv.failures).toEqual([]);
    expect(new Set(inv.exemptions.map((e) => e.kind))).toEqual(new Set(KINDS));
  });

  // @scenario behaviour orbit-cli-grammar :: Every command head on the generated surface is a recorded tool or a declared exemption :: A malformed exemption block fails
  it.each([
    [
      'no inventory fence',
      (t: string) => t.replace('```inventory', '```text'),
      () => heading,
      'no `inventory` fence',
    ],
    [
      'a second inventory fence',
      (t: string) => t.replace(/(```inventory\n[\s\S]*?\n```\n)/, '$1\n```inventory\nutility: mv\n```\n'),
      () => fenceLine + 6,
      'a second `inventory` fence',
    ],
    ['a line not matching the production', (t: string) => t.replace(/^prose: /m, 'prose:  '), () => fenceLine + 3, "does not match '<kind>: <head> <head> …'"],
    ['an unknown kind', (t: string) => t.replace(/^prose: /m, 'phrase: '), () => fenceLine + 3, "unknown kind 'phrase'"],
    ['a repeated kind', (t: string) => t.replace(/^prose: /m, 'utility: '), () => fenceLine + 3, "kind 'utility' repeated"],
    ['a repeated head', (t: string) => t.replace(/^prose: (.*)$/m, 'prose: $1 mv'), () => fenceLine + 3, "head 'mv' repeated"],
  ])('%s fails naming the requirement and the line', (_name, edit, line, message) => {
    const failures = malformed(edit);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]).toContain(`:${line()}: '${TITLE}': `);
    expect(failures[0]).toContain(message);
  });

  const roots: string[] = [];
  afterAll(() => {
    for (const dir of roots) fs.rmSync(dir, { recursive: true, force: true });
  });

  function root(specs: Record<string, string>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-inventory-'));
    roots.push(dir);
    for (const [rel, text] of Object.entries(specs)) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), text);
    }
    return dir;
  }
  const block = (section: string) => `${section}\n\n${HEADING}\n\nText.\n\n\`\`\`inventory\nutility: mv\n\`\`\`\n`;
  const baseline = path.join('orbit', 'specs', CAPABILITY, 'spec.md');
  const delta = (change: string) => path.join('orbit', 'changes', change, 'specs', CAPABILITY, 'spec.md');

  it('resolves an active delta over the baseline', () => {
    const dir = root({ [baseline]: block('## Requirements'), [delta('one')]: block('## MODIFIED Requirements') });
    expect(inventorySource(dir).file).toBe(delta('one'));
  });

  it('resolves the baseline when no active delta holds the requirement', () => {
    const dir = root({
      [baseline]: block('## Requirements'),
      [delta('other')]: '## MODIFIED Requirements\n\n### Requirement: Something else\n',
      [path.join('orbit', 'changes', 'archive', 'old', 'specs', CAPABILITY, 'spec.md')]: block('## ADDED Requirements'),
    });
    expect(inventorySource(dir).file).toBe(baseline);
  });

  it('fails naming both when two active deltas hold the requirement', () => {
    const dir = root({
      [baseline]: block('## Requirements'),
      [delta('one')]: block('## ADDED Requirements'),
      [delta('two')]: block('## MODIFIED Requirements'),
    });
    expect(() => inventorySource(dir)).toThrow(`${delta('one')}, ${delta('two')}`);
  });

  it('does not read a delta that only quotes the heading in a fence, or removes it', () => {
    const dir = root({
      [baseline]: block('## Requirements'),
      [delta('quote')]: `## MODIFIED Requirements\n\n\`\`\`markdown\n${HEADING}\n\`\`\`\n`,
      [delta('removed')]: `## REMOVED Requirements\n\n${HEADING}\n`,
    });
    expect(inventorySource(dir).file).toBe(baseline);
  });
});
