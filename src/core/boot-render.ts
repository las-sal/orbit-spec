import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadChangeContext, formatChangeStatus, type ChangeStatus } from './artifact-graph/instruction-loader.js';
import { readValidEmits, listSkippedEmits, type EmitRecord } from './orientation.js';
import { parseTouchpointsFile } from './parsers/touchpoints.js';
import { firstCommitTouching, isGitRepo, filesTouchedCommitted } from './parsers/apply-state.js';
import { modelHintFor, withModelHint } from './model-hints.js';

/**
 * `orbit status --change <name> --boot` — the cold-start boot render (D-arc Stage D5,
 * arc ruling R-d-9(b)'s boot_sequence generalized to an engine surface). ORDERED
 * POINTERS into existing artifacts, never duplicated substance; computed fresh per
 * invocation (the R-d-4 subtraction — no hand-maintained handoff file exists anywhere).
 * READ-ONLY; degrades per orbit-orientation's fault-isolation policy.
 */

export interface BootEmitPointer {
  /** Command family (`apply`, `address-reviews`, `explore`, `verify`, `review-external`, …). */
  family: string;
  /** Review families only: `proposal` | `system` (architecture emits never sit on a change trail). */
  mode?: string;
  path: string;
  /** First sentence of the emit's final_assessment. */
  headline: string;
}

export interface BootView {
  /** Ordered artifact pointers — the read order. */
  artifacts: string[];
  /** Latest emit per command family present on the trail (review split per mode). */
  emits: BootEmitPointer[];
  history: { explore_md: boolean; sketches: boolean };
  touchpoints: {
    predicted: string[] | null;
    actual: string[] | null;
    /** Change-own files (orbit/changes/<name>/**) collapsed out of `actual` — lifecycle bookkeeping, never scope drift. */
    actual_change_own_count?: number;
  };
  /** Fault-isolation exclusions (absent in JSON when empty; typed here as optional). */
  skipped_emits?: string[];
}

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?:\s|$)/s);
  return (m ? m[0] : text).trim();
}

/** Family split: review emits key on `review:<mode>`; everything else on the command. */
function familyOf(e: EmitRecord): { family: string; mode?: string } {
  const name = path.basename(e.file);
  const rm = name.match(/^review-(proposal|system)-/);
  if (rm) return { family: 'review', mode: rm[1] };
  return { family: e.command };
}

export function collectBoot(projectRoot: string, changeName: string): { status: ChangeStatus; boot: BootView } {
  const context = loadChangeContext(projectRoot, changeName);
  const status = formatChangeStatus(context);
  const changeDir = context.changeDir;
  const runsDir = path.join(changeDir, '.orbit-runs');

  // Ordered artifact pointers: the schema's build order over present artifacts.
  const artifacts = status.artifacts
    .filter(a => a.status === 'done' || a.status === 'ready')
    .map(a => path.join('orbit', 'changes', changeName, a.outputPath));

  // Latest emit per family (review split per mode — proposal/system only on a change trail).
  const emits = readValidEmits(runsDir);
  const latest = new Map<string, BootEmitPointer>();
  for (const e of emits) {
    const { family, mode } = familyOf(e);
    const key = mode ? `${family}:${mode}` : family;
    latest.set(key, {
      family,
      ...(mode ? { mode } : {}),
      path: path.relative(projectRoot, e.file),
      headline: firstSentence(e.final_assessment),
    });
  }

  const history = {
    explore_md: fs.existsSync(path.join(changeDir, 'explore.md')),
    sketches: fs.existsSync(path.join(changeDir, 'sketches')),
  };

  // Touchpoints — lifecycle-aware: predicted (design.md section, entry grammar) before
  // apply commits exist; the diff-computed ACTUAL map (never prose) once they do, with
  // predicted alongside as reference. Degradation: absent section / non-git → null.
  const parse = parseTouchpointsFile(path.join(changeDir, 'design.md'));
  const predicted = parse.present ? parse.entries.map(e => e.targets.join(' + ')) : null;
  let actual: string[] | null = null;
  let actualChangeOwnCount: number | undefined;
  const applyStarted = emits.some(e => e.command === 'apply');
  if (applyStarted && isGitRepo(projectRoot)) {
    // Repo-relative by construction (canonicalized absolute paths can cross symlink
    // boundaries — e.g. macOS /var vs /private/var — breaking path.relative).
    const rel = path.join('orbit', 'changes', changeName);
    const first = firstCommitTouching(projectRoot, rel);
    // Committed-only <change-start>..HEAD — the durable-truth view, deliberately
    // different from the per-chunk working-tree diff (per orbit-emit-composition).
    if (first) {
      const touched = filesTouchedCommitted(projectRoot, first);
      if (touched) {
        // Change-own files (the same `orbit/changes/<name>/**` exclusion audit-drift's
        // divergence arithmetic applies) collapse to a count: the ACTUAL map is the
        // CODE map — trail/bookkeeping noise would bury it for a cold-start reader.
        const ownPrefix = rel + path.sep;
        const changeOwn = touched.filter(f => f.startsWith(ownPrefix));
        actual = touched.filter(f => !f.startsWith(ownPrefix));
        if (changeOwn.length > 0) actualChangeOwnCount = changeOwn.length;
      }
    }
  }

  const skipped = listSkippedEmits(runsDir);

  return {
    status,
    boot: {
      artifacts,
      emits: [...latest.values()],
      history,
      touchpoints: {
        predicted,
        actual,
        ...(actualChangeOwnCount !== undefined ? { actual_change_own_count: actualChangeOwnCount } : {}),
      },
      ...(skipped.length > 0 ? { skipped_emits: skipped } : {}),
    },
  };
}

export function renderBoot(projectRoot: string, changeName: string): string {
  const { status, boot } = collectBoot(projectRoot, changeName);
  const lines: string[] = [];
  lines.push(`Boot: ${changeName}`);
  if (status.position) lines.push(`Position: ${status.position}`);
  lines.push('');
  lines.push('Read in order:');
  for (const a of boot.artifacts) lines.push(`  ${a}`);
  if (boot.emits.length > 0) {
    lines.push('');
    lines.push('Latest emits:');
    for (const e of boot.emits) {
      const label = e.mode ? `${e.family}(${e.mode})` : e.family;
      lines.push(`  ${label}: ${e.path} — ${e.headline}`);
    }
  }
  if (boot.history.explore_md || boot.history.sketches) {
    const parts: string[] = [];
    if (boot.history.explore_md) parts.push('explore.md');
    if (boot.history.sketches) parts.push('sketches/');
    lines.push('');
    lines.push(`History: ${parts.join(', ')} present`);
  }
  if (boot.touchpoints.actual !== null) {
    lines.push('');
    lines.push('Touchpoints (ACTUAL — diff-computed):');
    for (const f of boot.touchpoints.actual) lines.push(`  ${f}`);
    if (boot.touchpoints.actual_change_own_count !== undefined) {
      lines.push(
        `  orbit/changes/${changeName}/ — ${boot.touchpoints.actual_change_own_count} change-own files (bookkeeping, collapsed)`
      );
    }
    if (boot.touchpoints.predicted !== null) {
      lines.push('Predicted (reference — the plan, frozen at apply):');
      for (const t of boot.touchpoints.predicted) lines.push(`  ${t}`);
    }
  } else if (boot.touchpoints.predicted !== null) {
    lines.push('');
    lines.push('Touchpoints (predicted — design.md):');
    for (const t of boot.touchpoints.predicted) lines.push(`  ${t}`);
  }
  for (const f of boot.skipped_emits ?? []) {
    lines.push(`⚠ invalid emit skipped: ${f}`);
  }
  if (status.next_command) {
    lines.push('');
    const hint = modelHintFor(projectRoot, status.next_hint_keys);
    lines.push(`Ready when you are: ${withModelHint(status.next_command, hint)}`);
  }
  return lines.join('\n') + '\n';
}
