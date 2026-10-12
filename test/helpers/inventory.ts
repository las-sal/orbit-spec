/**
 * The tool inventory's declared-set reader and checks (rc09b design D2–D4), shared by the
 * generated surface's `inventory` fence (`orbit-cli-grammar`'s `Every command head on the
 * generated surface is a recorded tool or a declared exemption`) and the user docs'
 * `docs-inventory` fence (`orbit-user-docs`' `The user docs declare their own command heads`,
 * docs-under-test design D4). Each fence is read from its requirement AS IT STANDS: the one
 * active change whose delta ADDs or MODIFIes it, else the baseline. This module implements
 * those requirements' checks; it states none of their rules.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import MarkdownIt from 'markdown-it';
import { createFenceTracker } from '../../src/core/markdown-fence.js';
import { recordedTools } from './recorded-sweep.js';
import { describeSurface, type Head } from './surface-snippets.js';

export const KINDS = ['utility', 'placeholder', 'prose'] as const;
export type Kind = (typeof KINDS)[number];

/** Which requirement holds a declared set, and the info string of its one fence. */
export interface InventoryOwner {
  capability: string;
  title: string;
  info: string;
}

export const GENERATED_INVENTORY: InventoryOwner = {
  capability: 'orbit-cli-grammar',
  title: 'Every command head on the generated surface is a recorded tool or a declared exemption',
  info: 'inventory',
};

export const DOCS_INVENTORY: InventoryOwner = {
  capability: 'orbit-user-docs',
  title: 'The user docs declare their own command heads',
  info: 'docs-inventory',
};

export function headingOf(owner: InventoryOwner): string {
  return `### Requirement: ${owner.title}`;
}

const md = new MarkdownIt();

export interface Source {
  file: string; // repo-relative
  text: string;
}

/** The 0-based line of the requirement's heading outside a fence, under `section` when given, or -1. */
function headingLine(text: string, heading: string, sections?: string[]): number {
  const tracker = createFenceTracker();
  let current: string | null = null;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    const wasIn = tracker.inFence;
    if (tracker.handle(line) || wasIn) continue;
    if (/^## /.test(line)) current = line.trim();
    else if (line === heading && (sections === undefined || (current !== null && sections.includes(current)))) return i;
  }
  return -1;
}

const HOLDING_SECTIONS = ['## ADDED Requirements', '## MODIFIED Requirements'];

/** The requirement as it stands: the one active delta adding or modifying it, else the baseline. */
export function inventorySource(root: string, owner: InventoryOwner): Source {
  const heading = headingOf(owner);
  const holders: string[] = [];
  const changesDir = path.join(root, 'orbit', 'changes');
  for (const d of fs.existsSync(changesDir) ? fs.readdirSync(changesDir).sort() : []) {
    if (d === 'archive') continue;
    const rel = path.join('orbit', 'changes', d, 'specs', owner.capability, 'spec.md');
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && headingLine(fs.readFileSync(abs, 'utf-8'), heading, HOLDING_SECTIONS) >= 0) holders.push(rel);
  }
  if (holders.length > 1) {
    throw new Error(`more than one active change adds or modifies '${owner.title}': ${holders.join(', ')}`);
  }
  const rel = holders[0] ?? path.join('orbit', 'specs', owner.capability, 'spec.md');
  return { file: rel, text: fs.readFileSync(path.join(root, rel), 'utf-8') };
}

export interface Exemption {
  head: string;
  kind: Kind;
  line: number; // 1-based line in the source
}

export interface Inventory {
  exemptions: Exemption[];
  /** Malformed-block failures, each naming the requirement and the offending line. */
  failures: string[];
}

/** The requirement's one fence of the owner's info string, parsed by the production of rc09b design D2. */
export function readInventory(src: Source, owner: InventoryOwner): Inventory {
  const heading = headingOf(owner);
  const lines = src.text.split('\n');
  const start = headingLine(src.text, heading);
  const at = (line: number, message: string) => `${src.file}:${line}: '${owner.title}': ${message}`;
  if (start < 0) return { exemptions: [], failures: [`${src.file}: no '${heading}'`] };
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
    .filter((t) => t.type === 'fence' && t.map && t.info.trim().split(/\s+/)[0] === owner.info);
  if (fences.length === 0) return { exemptions: [], failures: [at(start + 1, `no \`${owner.info}\` fence`)] };
  const failures: string[] = [];
  for (const extra of fences.slice(1)) {
    failures.push(at(start + 2 + extra.map![0], `a second \`${owner.info}\` fence; the block is exactly one`));
  }
  const fence = fences[0];
  const contentStart = start + 2 + fence.map![0] + 1; // 1-based line of the fence's first content line
  const exemptions: Exemption[] = [];
  const kindsSeen = new Map<string, number>();
  const headsSeen = new Map<string, number>();
  // A fence with no lines declares nothing: zero lines, never one empty line.
  const content = fence.content.replace(/\n$/, '');
  (content === '' ? [] : content.split('\n')).forEach((text, k) => {
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

/** `orbit`, whose program the builder builds, plus every tool the recorded-contract sweep validates. */
export function recordedHeads(): string[] {
  return ['orbit', ...recordedTools().map((t) => t.tool)];
}

/** The FILE-LOCAL rule: each head neither recorded nor declared, naming its surface, line and head. */
export function unknownHeadFailures(heads: Head[], recorded: string[], inventory: Inventory): string[] {
  const declared = new Set(inventory.exemptions.map((e) => e.head));
  return heads
    .filter((h) => !recorded.includes(h.head) && !declared.has(h.head))
    .map(
      (h) => `${describeSurface(h.surface)}:${h.line}: head '${h.head}' is neither a recorded tool nor a declared exemption (${h.source})`,
    );
}

/** Every failure kind, collected: a malformed block, unknown heads, unused exemptions, exemptions shadowing a recorded tool. */
export function inventoryFailures(heads: Head[], recorded: string[], inventory: Inventory): string[] {
  const failures = [...inventory.failures, ...unknownHeadFailures(heads, recorded, inventory)];
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
