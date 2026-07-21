/**
 * Status Command
 *
 * Displays artifact completion status for a change.
 */

import ora from 'ora';
import chalk from 'chalk';
import {
  loadChangeContext,
  formatChangeStatus,
  type ChangeStatus,
} from '../../core/artifact-graph/index.js';
import {
  collectOrientation,
  type Orientation,
  type WorkstreamEntry,
  type OrientationChip,
  type EmitRecord,
} from '../../core/orientation.js';
import {
  validateChangeExists,
  validateSchemaExists,
  getStatusIndicator,
  getStatusColor,
} from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StatusOptions {
  change?: string;
  schema?: string;
  json?: boolean;
  full?: boolean;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function statusCommand(options: StatusOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Loading change status...').start();

  try {
    const projectRoot = process.cwd();

    // Orientation surface (D-arc Stage D3): bare = current sprint; --full = arc
    // view. `--change` behavior and the no-changes message stay byte-identical.
    if (!options.change) {
      const orientation = collectOrientation(projectRoot);
      spinner?.stop();

      if (options.full) {
        printFullView(orientation, options.json ?? false);
        return;
      }

      // Degradation ladder: (1) ≥1 live workstream → sprint view; (2) zero live
      // + ≥1 parseable doc → the --full view (JSON switches tier too); (3) zero
      // live + zero parseable docs → the existing no-changes message, unchanged.
      if (orientation.sprint) {
        printSprintView(orientation, options.json ?? false);
        return;
      }
      if (orientation.program.parseable.length > 0) {
        printFullView(orientation, options.json ?? false);
        return;
      }
      if (options.json) {
        console.log(JSON.stringify({ changes: [], message: 'No active changes.' }, null, 2));
        return;
      }
      console.log('No active changes. Create one with: orbit new change <name>');
      return;
    }

    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);
    const status = formatChangeStatus(context);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    printStatusText(status);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printStatusText(status: ChangeStatus): void {
  const doneCount = status.artifacts.filter((a) => a.status === 'done').length;
  const total = status.artifacts.length;

  console.log(`Change: ${status.changeName}`);
  console.log(`Schema: ${status.schemaName}`);
  console.log(`Progress: ${doneCount}/${total} artifacts complete`);
  console.log();

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(` (blocked by: ${artifact.missingDeps.join(', ')})`);
    }

    console.log(line);
  }

  if (status.isComplete) {
    console.log();
    console.log(chalk.green('All artifacts complete!'));
  }

  // C1: gate rows + position readout.
  if (status.gates && status.gates.length > 0) {
    console.log();
    console.log('Gates:');
    for (const g of status.gates) {
      if (g.superseded) {
        console.log(`  ${chalk.dim('·')} ${g.id}: ${chalk.dim('(past — phase already ran)')}`);
        continue;
      }
      const detail =
        g.kind === 'tracked' && g.total !== undefined && g.total > 0
          ? ` (${g.checked}/${g.total})`
          : g.reason
            ? ` (${g.reason})`
            : '';
      console.log(`  ${gateIndicator(g.state)} ${g.id}: ${g.state}${detail}`);
    }
    if (status.position) {
      console.log();
      console.log(`Position: ${status.position}`);
    }
    if (status.next_command) {
      // D1 eligibility phrasing: never an imperative label — the user is the arbiter
      // of lifecycle transitions; the engine reports eligibility only.
      console.log(`Ready when you are: ${status.next_command}`);
    }
  }
}

function gateIndicator(state: string): string {
  switch (state) {
    case 'passed':
      return chalk.green('✓');
    case 'stale':
      return chalk.yellow('~');
    case 'blocked':
    case 'blocked-by-gate':
      return chalk.red('✗');
    case 'ready':
      return chalk.cyan('•');
    default:
      return chalk.yellow('○'); // unpassed
  }
}

// -----------------------------------------------------------------------------
// Orientation rendering (D-arc Stage D3)
// -----------------------------------------------------------------------------

/** Text render of the strip chip array (the JSON carries the array itself). */
function renderStrip(strip: OrientationChip[] | undefined): string {
  if (!strip || strip.length === 0) return '';
  return strip
    .map((c) => {
      if (c.phase === 'review') {
        // `review ⟲` (pending) / `review ⟲6 ✓` — the ⟲ is the chip's identity
        // in the text grammar (spec's canonical strip); N appends when present.
        return ['review', c.detail ?? '⟲', c.glyph].filter(Boolean).join(' ');
      }
      if (c.phase === 'apply') {
        // `apply ▶ 12/20` — glyph before detail.
        return ['apply', c.glyph, c.detail].filter(Boolean).join(' ');
      }
      return [c.phase, c.glyph].filter(Boolean).join(' ');
    })
    .join(' → ');
}

/** First sentence, hard-capped ~160 chars with ellipsis (text render only). */
function trimAssessment(text: string): string {
  const firstSentence = text.match(/^.*?[.!?](?:\s|$)/s)?.[0]?.trim() ?? text.trim();
  if (firstSentence.length <= 160) return firstSentence;
  return `${firstSentence.slice(0, 159)}…`;
}

function relativeTime(iso: string): string {
  const then = Date.parse(iso.replace(/(\d{2})-(\d{2})-(\d{2})Z$/, '$1:$2:$3Z'));
  if (Number.isNaN(then)) return iso;
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function renderLastLine(last: EmitRecord): string {
  return `${last.command} · ${relativeTime(last.timestamp)} — ${trimAssessment(last.final_assessment)}`;
}

function renderDegradedRow(entry: WorkstreamEntry): string {
  return `${entry.name} — DEGRADED: ${entry.error ?? 'unknown failure'}`;
}

function stageTag(entry: WorkstreamEntry): string {
  return entry.stage ? `  (stage ${entry.stage.stage} · ${entry.stage.doc})` : '';
}

function printSprintView(orientation: Orientation, json: boolean): void {
  const sprint = orientation.sprint;
  if (!sprint) return;

  if (json) {
    const others = orientation.workstreams.filter((w) => w.name !== sprint.name);
    console.log(
      JSON.stringify(
        {
          sprint,
          last: sprint.last ?? null,
          next: sprint.next ?? null,
          also: others.map((w) =>
            w.degraded ? { name: w.name, kind: w.kind, degraded: true } : { name: w.name, kind: w.kind }
          ),
          waiting: orientation.waiting,
        },
        null,
        2
      )
    );
    return;
  }

  if (sprint.degraded) {
    // Bare degraded-sprint render: the degraded row in place of the strip,
    // plus any trustworthy fields; exit 0 (fault-isolation clause b).
    console.log(renderDegradedRow(sprint));
    if (sprint.last) console.log(`last: ${renderLastLine(sprint.last)}`);
  } else {
    console.log(`${sprint.name}${stageTag(sprint)}`);
    console.log(`  ${renderStrip(sprint.strip)}`);
    if (sprint.last) console.log(`last: ${renderLastLine(sprint.last)}`);
    else console.log('last: no emits yet');
    if (sprint.next) console.log(`Ready when you are: ${sprint.next}`);
  }

  const others = orientation.workstreams.filter((w) => w.name !== sprint.name);
  const alsoParts: string[] = others.map((w) =>
    w.degraded ? `${w.name} (degraded)` : `${w.name} (${w.kind === 'explore' ? 'exploring' : phaseOf(w)})`
  );
  const waitingParts = orientation.waiting;
  const alsoLine =
    alsoParts.length === 0 && waitingParts.length === 0
      ? 'also: nothing else in flight'
      : `also: ${[...alsoParts, ...waitingParts].join(' · ')}`;
  console.log(alsoLine);
}

/** One-word phase for the `also` line, derived from the strip (no new judgment). */
function phaseOf(entry: WorkstreamEntry): string {
  const strip = entry.strip ?? [];
  const current = strip.find((c) => c.glyph === '▶');
  if (current) return current.phase;
  const lastDone = [...strip].reverse().find((c) => c.glyph === '✓');
  return lastDone ? `${lastDone.phase} done` : 'pending';
}

function printFullView(orientation: Orientation, json: boolean): void {
  if (json) {
    console.log(
      JSON.stringify(
        {
          program: orientation.program,
          workstreams: orientation.workstreams,
          last: orientation.last,
          waiting: orientation.waiting,
        },
        null,
        2
      )
    );
    return;
  }

  const { parseable, legacy, malformed } = orientation.program;
  const citedNames = new Set<string>();

  if (parseable.length > 0) {
    console.log('PROGRAM');
    for (const doc of parseable) {
      console.log(`  ${doc.doc}`);
      for (const s of doc.stages) {
        console.log(`    ${s.id}: ${s.rendered}`);
        for (const entry of orientation.workstreams) {
          if (entry.stage && entry.stage.doc === doc.doc && entry.stage.stage === s.id) {
            citedNames.add(entry.name);
            printWorkstreamEntry(entry, '      ');
          }
        }
      }
    }
    for (const name of legacy) console.log(`  ${name}: legacy (not parseable)`);
    for (const m of malformed) console.log(`  ${m.doc}: MALFORMED`);

    const standalone = orientation.workstreams.filter((w) => !citedNames.has(w.name));
    if (standalone.length > 0) {
      console.log('  standalone');
      for (const entry of standalone) printWorkstreamEntry(entry, '    ');
    }
  } else {
    // Flat fleet degradation: zero parseable docs — workstreams unnested, no
    // PROGRAM band, each entry still carrying the full tuple. Never an error.
    for (const entry of orientation.workstreams) printWorkstreamEntry(entry, '');
  }

  console.log();
  if (orientation.last) {
    console.log(`LAST: ${orientation.last.workstream} — ${renderLastLine(orientation.last.emit)}`);
  }
  if (orientation.waiting.length > 0) {
    console.log('WAITING');
    for (const w of orientation.waiting) console.log(`  ${w}`);
  }
}

/** Full-view entry: the full orientation tuple (degraded entries excepted). */
function printWorkstreamEntry(entry: WorkstreamEntry, indent: string): void {
  if (entry.degraded) {
    console.log(`${indent}${renderDegradedRow(entry)}`);
    if (entry.last) console.log(`${indent}  last: ${renderLastLine(entry.last)}`);
    return;
  }
  console.log(`${indent}${entry.name} (${entry.kind})${stageTag(entry)}`);
  console.log(`${indent}  ${renderStrip(entry.strip)}`);
  if (entry.position && entry.kind === 'change') console.log(`${indent}  position: ${entry.position}`);
  console.log(`${indent}  last: ${entry.last ? renderLastLine(entry.last) : 'no emits yet'}`);
  if (entry.next) console.log(`${indent}  Ready when you are: ${entry.next}`);
}
