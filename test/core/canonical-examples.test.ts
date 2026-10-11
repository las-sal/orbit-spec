import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { composeAndWriteEmit, SPINE_FIELDS, ENGINE_OWNED_EXTRA } from '../../src/core/emit-composition.js';
import { renderReport } from '../../src/core/report-render.js';
import { createFenceTracker } from '../../src/core/markdown-fence.js';
import { fences, type Fence } from '../helpers/schema-references.js';

/**
 * rc17c (D-rc17c-7, design D6/D8): `orbit-conventions`' `Internal-run JSON summary format` carries
 * three canonical examples, and each is EXECUTED, never trusted. The examples are WRITTEN emits,
 * not payloads, so — unlike rc07b's reference round trip — the guard SUBTRACTS the engine's own
 * refused set (`SPINE_FIELDS` + `ENGINE_OWNED_EXTRA[command]`, imported, never copied), submits the
 * remainder through the real write gate in a disposable project, and holds the written emit's
 * top-level key set EQUAL to the example's. The review example is also rendered through the
 * report renderer.
 *
 * The requirement is read AS IT WILL STAND: the MODIFIED block of the one active change whose delta
 * holds it, else the baseline — so a change that edits the examples is held to them during its own
 * apply. The review example is submitted under its OWN `change` name on a fresh trail, where every
 * engine-composed value but `timestamp` is predictable, and each is compared with the written emit
 * (rc17c system walk, external S1: the subtraction had discarded the very pointer the stage repairs).
 * Named limit (stated in the requirement): apply and archive get top-level keys only.
 */

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const CAPABILITY = 'orbit-conventions';
const HEADING = '### Requirement: Internal-run JSON summary format';
const MARKER = '**Canonical examples**';

interface Source {
  file: string; // repo-relative
  text: string;
}

/**
 * The 0-indexed line of the requirement's exact heading OUTSIDE a fence, or -1. With `section`, the
 * heading counts only under that `## ` section (also read outside fences): a delta that QUOTES the
 * heading in a fenced example, or carries it under REMOVED or RENAMED Requirements, does not modify it
 * (rc17c system walk, fresh S3 / external W1).
 */
function headingLine(text: string, section?: string): number {
  const tracker = createFenceTracker();
  let current: string | null = null;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    const wasIn = tracker.inFence;
    if (tracker.handle(line) || wasIn) continue;
    if (/^## /.test(line)) current = line.trim();
    else if (line === HEADING && (section === undefined || current === section)) return i;
  }
  return -1;
}

/** The requirement as it will stand: one active delta MODIFYING it, else the baseline. */
function requirementSource(root: string): Source {
  const holders: string[] = [];
  const changesDir = path.join(root, 'orbit', 'changes');
  for (const d of fs.existsSync(changesDir) ? fs.readdirSync(changesDir).sort() : []) {
    if (d === 'archive') continue;
    const rel = path.join('orbit', 'changes', d, 'specs', CAPABILITY, 'spec.md');
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && headingLine(fs.readFileSync(abs, 'utf-8'), '## MODIFIED Requirements') >= 0) holders.push(rel);
  }
  if (holders.length > 1) {
    throw new Error(`more than one active change modifies '${HEADING.slice(17)}': ${holders.join(', ')}`);
  }
  const rel = holders[0] ?? path.join('orbit', 'specs', CAPABILITY, 'spec.md');
  return { file: rel, text: fs.readFileSync(path.join(root, rel), 'utf-8') };
}

interface Example {
  line: number; // 1-indexed opening line in the source file
  opening: string;
  emit: Record<string, unknown>;
}

/** Every `json` fence after the marker line, inside the requirement block, read by the engine's fence tracker. */
function canonicalExamples(src: Source): Example[] {
  const lines = src.text.split('\n');
  const start = headingLine(src.text);
  if (start < 0) throw new Error(`${src.file}: no '${HEADING}'`);
  // The block ends at the next requirement or section heading OUTSIDE a fence.
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
  const marker = lines.slice(start, end).findIndex((l) => l.startsWith(MARKER));
  if (marker < 0) throw new Error(`${src.file}: no '${MARKER}' line in the requirement`);
  const from = start + marker + 1;
  const found: Fence[] = fences(lines.slice(from, end).join('\n'));
  return found
    .filter((f) => f.info === 'json')
    .map((f) => {
      const line = from + f.line;
      let emit: Record<string, unknown>;
      try {
        emit = JSON.parse(f.body);
      } catch (e) {
        throw new Error(`${src.file}:${line} (${f.opening}): not JSON — ${(e as Error).message}`);
      }
      return { line, opening: f.opening, emit };
    });
}

const CHANGE = 'example-change';

function write(root: string, rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function seedChangeDir(root: string, rel: string): void {
  write(root, `${rel}/proposal.md`, '# Proposal\n\n## Why\nw\n');
  write(root, `${rel}/design.md`, '# Design\n');
  write(root, `${rel}/specs/cap/spec.md`, '## ADDED Requirements\n\n### Requirement: R\n\nThe system SHALL r.\n\n#### Scenario: s\n\n- **WHEN** w\n- **THEN** t\n');
  // Minimal tasks: no chunk preamble is seeded — the engine writes the chunk keys on every apply emit.
  write(root, `${rel}/tasks.md`, '# Tasks\n\n## 1. Group\n\n- [ ] 1.1 do a thing\n');
  write(root, `${rel}/.openspec.yaml`, 'schema: spec-driven\nschema_version: 5\n');
}

/** The target each command writes to; a command not listed here has no executable target. */
const TARGETS: Record<string, 'change' | 'archived'> = { apply: 'change', review: 'change', archive: 'archived' };

const sorted = (keys: Iterable<string>) => [...keys].sort();

interface Execution {
  exampleKeys: string[];
  writtenKeys: string[];
  kinds: unknown; // the written emit's `kind`
  report?: string;
}

/** SUBTRACT the engine's refused set, SUBMIT through the write gate, RENDER a review. Throws on any refusal. */
function execute(ex: Example, where: string): Execution {
  const command = String(ex.emit.command ?? '');
  const scope = TARGETS[command];
  if (!scope) throw new Error(`${where}:${ex.line} (${ex.opening}): no executable target for command '${command}'`);
  const refused = new Set([...SPINE_FIELDS, ...(ENGINE_OWNED_EXTRA[command] ?? [])]);
  const payload = Object.fromEntries(Object.entries(ex.emit).filter(([k]) => !refused.has(k)));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-canonical-'));
  try {
    // review: the example's own change name, so its engine-composed values are reproducible and compared.
    const change = command === 'review' ? String(ex.emit.change) : CHANGE;
    const dir = scope === 'change' ? `orbit/changes/${change}` : `orbit/changes/archive/2026-10-07-${change}`;
    seedChangeDir(root, dir);
    const cited = Array.isArray(payload.judgements)
      ? (payload.judgements as any[]).flatMap((j) => (Array.isArray(j?.formed_against) ? j.formed_against : []))
      : [];
    for (const token of cited) {
      write(root, `${dir}/.orbit-runs/review-proposal-${token}.json`, JSON.stringify({ command: 'review', mode: 'proposal', reviewer_class: 'fresh', findings: [] }));
    }
    let r;
    try {
      r = composeAndWriteEmit(command, { change }, payload, { projectRoot: root });
    } catch (e) {
      throw new Error(`${where}:${ex.line} (${command} example): the write gate refused it — ${(e as Error).message}`);
    }
    const written = JSON.parse(fs.readFileSync(r.path, 'utf-8'));
    const out: Execution = { exampleKeys: sorted(Object.keys(ex.emit)), writtenKeys: sorted(Object.keys(written)), kinds: written.kind };
    if (command === 'review') {
      // Every engine-composed value except the clock is reproducible on this fresh trail.
      for (const key of [...refused].filter((k) => k !== 'timestamp' && k in ex.emit)) {
        if (JSON.stringify(ex.emit[key]) !== JSON.stringify(written[key])) {
          throw new Error(
            `${where}:${ex.line} (review example): engine-composed '${key}' is ${JSON.stringify(ex.emit[key])} but the engine writes ${JSON.stringify(written[key])}`
          );
        }
      }
      const ts = path.basename(r.path).replace(/^review-[a-z]+-/, '').replace(/\.json$/, '');
      out.report = renderReport(root, change, ts);
    }
    return out;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** The whole check over one source: every example executes and its key set equals the written one. */
function checkAll(src: Source): Execution[] {
  const examples = canonicalExamples(src);
  if (examples.length === 0) throw new Error(`${src.file}: no json fence after '${MARKER}'`);
  return examples.map((ex) => {
    const x = execute(ex, src.file);
    if (JSON.stringify(x.exampleKeys) !== JSON.stringify(x.writtenKeys)) {
      throw new Error(
        `${src.file}:${ex.line} (${String(ex.emit.command)} example): top-level keys differ from the written emit\n` +
          `  example: ${x.exampleKeys.join(', ')}\n  written: ${x.writtenKeys.join(', ')}`
      );
    }
    return x;
  });
}

/** A disposable repo holding one source at the given path (for the reader and failure scenarios). */
function fakeRepo(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-canonical-repo-'));
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  return root;
}

describe('rc17c: the canonical examples are executed', () => {
  // @scenario behaviour orbit-conventions :: Internal-run JSON summary format :: Editorial command emit shape (with findings)
  // @scenario behaviour orbit-conventions :: Internal-run JSON summary format :: Lifecycle command emit shape
  it('every example in the requirement as it will stand is accepted by the write gate and its key set equals the written emit', () => {
    const src = requirementSource(repo);
    const runs = checkAll(src);
    const commands = canonicalExamples(src).map((e) => e.emit.command);
    expect(commands).toEqual(['apply', 'review', 'archive']);
    const spine = ['command', 'timestamp', 'change', 'final_assessment', 'next_recommended', 'kind', 'model'];
    for (const r of runs) for (const k of spine) expect(r.writtenKeys).toContain(k);
    const [apply, review, archive] = runs;
    expect(apply.kinds).toBe('workflow');
    expect(review.kinds).toBe('editorial');
    for (const k of ['iteration', 'scorecard', 'findings']) expect(review.writtenKeys).toContain(k);
    expect(archive.kinds).toBe('lifecycle');
    for (const k of ['archive_path', 'audit', 'sync_specs', 'unresolved_markers', 'user_decision', 'consent']) expect(archive.writtenKeys).toContain(k);
  });

  it('the review example renders through the report', () => {
    const runs = checkAll(requirementSource(repo));
    const review = runs.find((r) => r.report !== undefined);
    expect(review?.report).toContain('### Direction');
  });

  // @scenario behaviour orbit-conventions :: Internal-run JSON summary format :: A stale canonical example fails by execution
  it('an example missing a key the engine writes fails, naming both key sets', () => {
    const src = requirementSource(repo);
    const stale = { file: src.file, text: src.text.replace('  "pass_genre": "REVIEW",\n', '') };
    expect(stale.text).not.toBe(src.text);
    let msg = '';
    try {
      checkAll(stale);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/review example\): top-level keys differ/);
    expect(msg).toMatch(/\n {2}example: .*\n {2}written: .*pass_genre/);
    expect(msg.split('\n')[1]).not.toContain('pass_genre');
  });

  // @scenario behaviour orbit-conventions :: Internal-run JSON summary format :: A stale engine-composed value in the review example fails
  it('rc17c (system walk, external S1): a stale engine-composed value in the review example fails, naming the key and both values', () => {
    const src = requirementSource(repo);
    const short = '"next_recommended": "/orbit:address-reviews emit-run-summary-jsons-from-workflow-commands"';
    expect(src.text).toContain(short);
    const stale = src.text.replace(short, '"next_recommended": "/orbit:address-reviews emit-run-summary-jsons-from-workflow-commands --from-file <this emit\'s own path>"');
    expect(() => checkAll({ file: src.file, text: stale })).toThrow(
      /\(review example\): engine-composed 'next_recommended' is ".*--from-file.*" but the engine writes "\/orbit:address-reviews emit-run-summary-jsons-from-workflow-commands"/
    );
  });

  // @scenario behaviour orbit-conventions :: Internal-run JSON summary format :: An example with no executable target fails
  it('a fourth fence whose command has no target fails naming its opening line', () => {
    const src = requirementSource(repo);
    const fourth = '\n```json\n{ "command": "verify", "kind": "workflow" }\n```\n';
    const anchor = '\n**Each canonical example is executed';
    const text = src.text.replace(anchor, fourth + anchor);
    const line = text.split('\n').indexOf('{ "command": "verify", "kind": "workflow" }');
    expect(() => checkAll({ file: src.file, text })).toThrow(`${src.file}:${line} (\`\`\`json): no executable target for command 'verify'`);
  });

  // @scenario behaviour orbit-conventions :: Internal-run JSON summary format :: An active change's edit to the examples is checked during its apply
  it('reads an active change\'s MODIFIED block over the baseline, fails on two, and falls back to the baseline', () => {
    const real = requirementSource(repo).text;
    const block = real.slice(real.indexOf(HEADING));
    const baseline = `# orbit-conventions\n\n## Requirements\n\n${block}`;
    const delta = `## MODIFIED Requirements\n\n${block.replace('  "pass_genre": "REVIEW",\n', '')}`;
    const spec = (c: string) => `orbit/changes/${c}/specs/${CAPABILITY}/spec.md`;

    const one = fakeRepo({ 'orbit/specs/orbit-conventions/spec.md': baseline, [spec('edits-examples')]: delta });
    try {
      const src = requirementSource(one);
      expect(src.file).toBe(spec('edits-examples'));
      expect(() => checkAll(src)).toThrow(/top-level keys differ/);
    } finally {
      fs.rmSync(one, { recursive: true, force: true });
    }

    const two = fakeRepo({ 'orbit/specs/orbit-conventions/spec.md': baseline, [spec('a-change')]: delta, [spec('b-change')]: delta });
    try {
      expect(() => requirementSource(two)).toThrow(`${spec('a-change')}, ${spec('b-change')}`);
    } finally {
      fs.rmSync(two, { recursive: true, force: true });
    }

    // A heading QUOTED inside a fence, or carried under REMOVED Requirements, does not make a delta a modifier.
    const quoted = `## ADDED Requirements\n\n### Requirement: Other\n\nText.\n\n\`\`\`markdown\n${HEADING}\n\`\`\`\n`;
    const removed = `## REMOVED Requirements\n\n${HEADING}\n\n**Reason**: gone.\n`;
    const notModifiers = fakeRepo({
      'orbit/specs/orbit-conventions/spec.md': baseline,
      [spec('quotes-it')]: quoted,
      [spec('removes-it')]: removed,
    });
    try {
      expect(requirementSource(notModifiers).file).toBe('orbit/specs/orbit-conventions/spec.md');
    } finally {
      fs.rmSync(notModifiers, { recursive: true, force: true });
    }

    const none = fakeRepo({ 'orbit/specs/orbit-conventions/spec.md': baseline, 'orbit/changes/archive/x/specs/orbit-conventions/spec.md': delta });
    try {
      expect(requirementSource(none).file).toBe('orbit/specs/orbit-conventions/spec.md');
    } finally {
      fs.rmSync(none, { recursive: true, force: true });
    }
  });
});
