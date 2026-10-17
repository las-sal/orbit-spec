/**
 * The old name in what the package ships (cli-says-orbit): `orbit-cli-name`'s source scan and its
 * exact admitted list. This module implements that capability's check; it states none of its rules.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { Command } from 'commander';

const REPO = fileURLToPath(new URL('../../', import.meta.url));

/** The product-name forms, case-sensitive (design decision 2; lowercase is the named limit's). */
const PATTERN = /OpenSpec|Openspec/g;
/** Every case, in a file under `schemas/**` (openspec-path-fix design D1). */
const SCHEMA_PATTERN = /openspec/gi;

export type AdmittedReason = "names OpenSpec's own artefact" | 'names the fork base' | 'never generated';

export interface AdmittedEntry {
  file: string;
  substring: string;
  reason: AdmittedReason;
}

/** The exact admitted list (design decision 3): each entry admits only the occurrences inside a match of its substring. */
export const ADMITTED: AdmittedEntry[] = [
  { file: 'src/core/legacy-cleanup.ts', substring: 'Removed OpenSpec markers', reason: "names OpenSpec's own artefact" },
  { file: 'src/core/legacy-cleanup.ts', substring: 'removing OpenSpec markers', reason: "names OpenSpec's own artefact" },
  { file: 'src/core/legacy-cleanup.ts', substring: 'OpenSpec markers will be removed', reason: "names OpenSpec's own artefact" },
  { file: 'src/core/init.ts', substring: 'an OpenSpec project directory', reason: "names OpenSpec's own artefact" },
  { file: 'src/core/templates/workflows/onboard.ts', substring: 'upstream OpenSpec', reason: 'names the fork base' },
  { file: 'src/core/templates/workflows/feedback.ts', substring: 'feedback about OpenSpec', reason: 'never generated' },
];

/** A file the scan reads: TypeScript through its string literals, anything else line by line. */
export interface ShippedFile {
  file: string;
  text: string;
}

/** 0-based offsets of the text a user can read: every string literal, no-substitution template and template part. */
function literalRanges(file: string, text: string): Array<[number, number]> {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const ranges: Array<[number, number]> = [];
  const visit = (node: ts.Node): void => {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      case ts.SyntaxKind.TemplateHead:
      case ts.SyntaxKind.TemplateMiddle:
      case ts.SyntaxKind.TemplateTail:
        ranges.push([node.getStart(source), node.end]);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return ranges;
}

interface Occurrence {
  line: number; // 1-based
  column: number; // 0-based, within the line
  word: string;
  lineText: string;
}

function occurrences(f: ShippedFile): Occurrence[] {
  const ranges = f.file.endsWith('.ts') ? literalRanges(f.file, f.text) : [[0, f.text.length] as [number, number]];
  const lineStarts = [0];
  for (let i = 0; i < f.text.length; i++) if (f.text[i] === '\n') lineStarts.push(i + 1);
  const lines = f.text.split('\n');
  const out: Occurrence[] = [];
  // A shipped schema is served to the agent as instructions: there `openspec` is residue in any case.
  const pattern = f.file.startsWith('schemas/') ? SCHEMA_PATTERN : PATTERN;
  for (const m of f.text.matchAll(pattern)) {
    const at = m.index!;
    if (!ranges.some(([start, end]) => at >= start && at + m[0].length <= end)) continue;
    let line = lineStarts.length - 1;
    while (lineStarts[line] > at) line--;
    out.push({ line: line + 1, column: at - lineStarts[line], word: m[0], lineText: lines[line] });
  }
  return out;
}

function admits(entry: AdmittedEntry, file: string, o: Occurrence): boolean {
  if (entry.file !== file || !entry.substring) return false;
  for (let from = o.lineText.indexOf(entry.substring); from !== -1; from = o.lineText.indexOf(entry.substring, from + 1)) {
    if (o.column >= from && o.column + o.word.length <= from + entry.substring.length) return true;
  }
  return false;
}

/** The scan: `file:line: residue '<occurrence>'` per unadmitted occurrence, then `stale admission` per entry admitting none. */
export function residue(files: ShippedFile[], admitted: AdmittedEntry[] = ADMITTED): string[] {
  const failures: string[] = [];
  const used = new Set<AdmittedEntry>();
  for (const f of files) {
    for (const o of occurrences(f)) {
      const entry = admitted.find((e) => admits(e, f.file, o));
      if (entry) used.add(entry);
      else failures.push(`${f.file}:${o.line}: residue '${o.word}'`);
    }
  }
  for (const e of admitted) {
    if (!used.has(e)) failures.push(`${e.file}: stale admission '${e.substring}' (${e.reason})`);
  }
  return failures;
}

function walk(dir: string, keep: (rel: string) => boolean): string[] {
  const abs = path.join(REPO, dir);
  if (!fs.existsSync(abs)) return [];
  return (fs.readdirSync(abs, { recursive: true }) as string[])
    .map((rel) => path.posix.join(dir, rel.split(path.sep).join('/')))
    .filter((rel) => fs.statSync(path.join(REPO, rel)).isFile() && keep(rel))
    .sort();
}

/** The shipped files the scan reads: `src/**\/*.ts`, `schemas/**`, `bin/**`, `scripts/postinstall.js` and `build.js`. */
export function shippedFiles(): ShippedFile[] {
  const paths = [
    ...walk('src', (rel) => rel.endsWith('.ts')),
    ...walk('schemas', () => true),
    ...walk('bin', () => true),
    'scripts/postinstall.js',
    'build.js',
  ];
  return paths.map((file) => ({ file, text: fs.readFileSync(path.join(REPO, file), 'utf-8') }));
}

/** Every visible command's help, depth-first, keyed by its command path (hidden commands skipped). */
export function helpTexts(program: Command): Array<{ command: string; text: string }> {
  const out: Array<{ command: string; text: string }> = [];
  const visit = (cmd: Command, prefix: string): void => {
    out.push({ command: prefix, text: cmd.helpInformation() });
    for (const sub of cmd.commands) {
      if ((sub as unknown as { _hidden: boolean })._hidden) continue;
      visit(sub, `${prefix} ${sub.name()}`);
    }
  };
  visit(program, 'orbit');
  return out;
}

/** The runtime check's admitted identifier (D-cso-5). */
export const RUNTIME_ADMITTED = 'OPENSPEC_CONCURRENCY';

/** Each case-insensitive `openspec` in printed output outside the admitted identifier. */
export function runtimeResidue(label: string, text: string): string[] {
  return text
    .split('\n')
    .flatMap((line, i) =>
      [...line.replaceAll(RUNTIME_ADMITTED, '').matchAll(/openspec/gi)].map((m) => `${label}:${i + 1}: residue '${m[0]}'`)
    );
}
