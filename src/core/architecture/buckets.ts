import chalk from 'chalk';
import { listArchitectureDocs } from './parser.js';
import { computeStageStates, type StageState } from './state.js';

/**
 * The architecture-status bucket shapes, extracted so every surface that
 * promises "the architecture-status buckets" (the `orbit architecture status`
 * JSON and orientation's `--full` PROGRAM band — D-arc Stage D3) builds and
 * renders them from ONE place. Violation lines are one-based here (the
 * user-facing convention); the parser's zero-based lines never leak.
 */

export interface ArchitectureDocPayload {
  doc: string;
  stages: StageState[];
  violations?: Array<{ line: number; reason: string; text: string }>;
}

export interface ArchitectureBuckets {
  parseable: ArchitectureDocPayload[];
  legacy: string[];
  malformed: ArchitectureDocPayload[];
}

export function buildArchitectureBuckets(projectRoot: string): ArchitectureBuckets {
  const docs = listArchitectureDocs(projectRoot);
  const parseable: ArchitectureDocPayload[] = [];
  const legacy: string[] = [];
  const malformed: ArchitectureDocPayload[] = [];

  for (const doc of docs) {
    if (doc.docClass === 'legacy') {
      legacy.push(doc.name);
      continue;
    }
    const payload: ArchitectureDocPayload = {
      doc: doc.name,
      stages: computeStageStates(projectRoot, doc),
    };
    if (doc.docClass === 'malformed') {
      payload.violations = doc.violations.map((v) => ({ line: v.line + 1, reason: v.reason, text: v.text }));
      malformed.push(payload);
    } else {
      parseable.push(payload);
    }
  }

  return { parseable, legacy, malformed };
}

/** One stage line, exactly as `orbit architecture status` renders it. */
export function renderStageLine(s: StageState): string {
  const mark =
    s.rendered === 'complete'
      ? chalk.green(`complete (ratified ${s.ratifiedDate} by ${s.ratifiedWho})`)
      : s.rendered === 'inconsistent'
        ? chalk.red(`INCONSISTENT — ${s.inconsistency}`)
        : s.rendered === 'quiescent-awaiting-ratification'
          ? chalk.yellow('quiescent — completion awaiting your ratification')
          : s.rendered === 'ended'
            ? chalk.magenta(`ended (declared ${s.endedDate} by ${s.endedWho})`) // neither complete (green) nor waiting (yellow)
            : s.rendered === 'ended-from-explore'
              ? chalk.magenta('ended-from-explore')
              : s.rendered;
  const citing =
    s.citing.length > 0
      ? chalk.gray(` [${s.citing.map((c) => `${c.kind}:${c.name}${c.concluded ? ' (concluded)' : ''}`).join(', ')}]`)
      : '';
  return `  ${s.id} — ${mark}${citing}`;
}

/** A legacy doc's listing line, exactly as `orbit architecture status` renders it. */
export function renderLegacyLine(name: string): string {
  return `${chalk.bold(name)} — legacy/opaque (no parseable stages)`;
}

/** A malformed doc's header + one-based violation lines (no stages — callers may interleave). */
export function renderMalformedHeaderLines(p: ArchitectureDocPayload): string[] {
  const lines = [
    `${chalk.bold(p.doc)} — ${chalk.red('MALFORMED')} (fix via: orbit architecture validate ${p.doc})`,
  ];
  for (const v of p.violations ?? []) lines.push(chalk.red(`  line ${v.line}: ${v.reason}`));
  return lines;
}

/** A malformed doc's full listing lines (header + violations + well-formed sibling stages). */
export function renderMalformedLines(p: ArchitectureDocPayload): string[] {
  return [...renderMalformedHeaderLines(p), ...p.stages.map(renderStageLine)];
}
