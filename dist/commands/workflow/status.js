/**
 * Status Command
 *
 * Displays artifact completion status for a change.
 */
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import { loadChangeContext, formatChangeStatus, } from '../../core/artifact-graph/index.js';
import { collectOrientation, } from '../../core/orientation.js';
import { renderStageLine, renderLegacyLine, renderMalformedHeaderLines, } from '../../core/architecture/buckets.js';
import { renderReport } from '../../core/report-render.js';
import { findArchivedDir } from '../../core/archived-change.js';
import { resolvesWithin } from '../../core/containment.js';
import { validateChangeName } from '../../utils/change-utils.js';
import * as fs from 'fs';
import { modelHintFor, withModelHint } from '../../core/model-hints.js';
import { composeStatusSize, renderSizeLine } from '../../core/change-size.js';
import { resolveSizeCeiling } from '../../core/project-config.js';
import { validateChangeExists, validateSchemaExists, getAvailableChanges, getStatusIndicator, getStatusColor, } from './shared.js';
// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------
export async function statusCommand(options) {
    const spinner = options.json ? undefined : ora('Loading change status...').start();
    try {
        const projectRoot = process.cwd();
        // rc06a scenario map — computed at read time from the tags, the ledger and the specs with
        // the change's deltas applied; stored nowhere (`orbit-scenario-map`). READ-ONLY.
        if (options.scenarios) {
            const isReport = options.report !== undefined && options.report !== false;
            if (isReport || options.boot) {
                throw new Error(`--scenarios cannot be combined with ${isReport ? '--report' : '--boot'}: each is its own render of the change`);
            }
            if (!options.change) {
                throw new Error('--scenarios requires --change <name>: the scenario map is change-scoped');
            }
            const mapChange = await validateChangeExists(options.change, projectRoot);
            const { resolveScenarioMapConfig } = await import('../../core/project-config.js');
            const { computeScenarioMap, renderScenarioMap } = await import('../../core/scenario-map.js');
            spinner?.stop();
            const map = computeScenarioMap(projectRoot, path.join(projectRoot, 'orbit', 'changes', mapChange), {
                config: resolveScenarioMapConfig(projectRoot),
            });
            if (options.json) {
                console.log(JSON.stringify(map, null, 2));
                return;
            }
            process.stdout.write(renderScenarioMap(map));
            return;
        }
        // D4 report render — the trail gateway's deepest zoom (rides --change only).
        // READ-ONLY: raw artifact resolution + normalize + pure render; no file is
        // created or modified. Errors are clean and exit non-zero via the CLI wrapper.
        if (options.report !== undefined && options.report !== false) {
            if (options.json) {
                throw new Error('--report cannot be combined with --json: the emit IS the JSON (no JSON render variant is defined)');
            }
            if (!options.change) {
                throw new Error('--report requires --change <name>: the report rides the per-change form (bare status stays the sprint view)');
            }
            const location = await resolveReportLocation(options.change, projectRoot);
            const rendered = renderReport(projectRoot, options.change, typeof options.report === 'string' ? options.report : undefined, location);
            spinner?.stop();
            // Verbatim: the render already ends with its single trailing newline.
            process.stdout.write(rendered);
            return;
        }
        // D5 boot render — the cold-start sequence as ordered pointers (rides --change).
        if (options.boot) {
            if (!options.change) {
                throw new Error('--boot requires --change <name>: the boot render is change-scoped (mid-explore boots from bare orbit status + explore.md + the explore trail)');
            }
            const bootChange = await validateChangeExists(options.change, projectRoot);
            if (options.json) {
                const { collectBoot } = await import('../../core/boot-render.js');
                const { status, boot } = collectBoot(projectRoot, bootChange);
                spinner?.stop();
                console.log(JSON.stringify({ ...status, boot }, null, 2));
                return;
            }
            const { renderBoot } = await import('../../core/boot-render.js');
            const rendered = renderBoot(projectRoot, bootChange);
            spinner?.stop();
            process.stdout.write(rendered);
            return;
        }
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
            // live + zero parseable docs → the existing no-changes message (text
            // unchanged; the JSON shape carries `pr` like every other rung — D6: the
            // bodies read the resolved regime here, and a fresh adopter's FIRST change
            // is proposed from exactly this rung).
            if (orientation.sprint) {
                printSprintView(orientation, options.json ?? false);
                return;
            }
            if (orientation.program.parseable.length > 0) {
                printFullView(orientation, options.json ?? false);
                return;
            }
            if (options.json) {
                console.log(JSON.stringify({ changes: [], message: 'No active changes.', pr: orientation.pr }, null, 2));
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
        // rc09a (design D4): size is composed HERE, at the command layer, never inside
        // `formatChangeStatus` — orientation, the boot render and the gate computation consume
        // `ChangeStatus`, and size must reach none of them. A read failure lands in `size.errors`.
        const size = composeStatusSize(projectRoot, path.join(projectRoot, 'orbit', 'changes', changeName), resolveSizeCeiling(projectRoot));
        spinner?.stop();
        if (options.json) {
            console.log(JSON.stringify({ ...status, size }, null, 2));
            return;
        }
        printStatusText(status, size);
    }
    catch (error) {
        spinner?.stop();
        throw error;
    }
}
export function printStatusText(status, size) {
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
    // rc09a: one `Size:` line when the check is ON (a ceiling is configured); none when OFF.
    if (size && size.ceiling) {
        console.log();
        console.log(renderSizeLine(size));
    }
    // C1: gate rows + position readout.
    if (status.gates && status.gates.length > 0) {
        console.log();
        console.log('Gates:');
        for (const g of status.gates) {
            if (g.superseded) {
                // Subdued, but NOT silent about cost: reported spend is defined across the whole trail, so
                // a superseded gate still shows what it spent (rc02 walk 9).
                const pastSpend = g.independentSpend === undefined ? '' : chalk.dim(` [spend ${g.independentSpend}]`);
                console.log(`  ${chalk.dim('·')} ${g.id}: ${chalk.dim('(past — phase already ran)')}${pastSpend}`);
                continue;
            }
            const detail = g.kind === 'tracked' && g.total !== undefined && g.total > 0
                ? ` (${g.checked}/${g.total})`
                : g.reason
                    ? ` (${g.reason})`
                    : '';
            // rc02c: the RECORDED COST is reported beside the state — ALONE. Never as a fraction of
            // `budget` and never beside a label derived from comparing the two: a ratio is a verdict
            // wearing a figure's clothes, and `[spend 4/3]` is the readout Q-crc-19 named as the harm.
            // Named here as well as in the JSON projection, or the field reaches neither surface.
            const spend = g.independentSpend === undefined ? '' : chalk.dim(` [spend ${g.independentSpend}]`);
            console.log(`  ${gateIndicator(g.state)} ${g.id}: ${g.state}${detail}${spend}`);
        }
        if (status.position) {
            console.log();
            console.log(`Position: ${status.position}`);
        }
        if (status.next_command) {
            // D1 eligibility phrasing: never an imperative label — the user is the arbiter
            // of lifecycle transitions; the engine reports eligibility only. D5: the model-hint
            // garnish appends after any ` — user-invoked` marker; absent map = byte-identical.
            const hint = modelHintFor('.', status.next_hint_keys);
            console.log(`Ready when you are: ${withModelHint(status.next_command, hint)}`);
        }
    }
}
function gateIndicator(state) {
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
function renderStrip(strip) {
    if (!strip || strip.length === 0)
        return '';
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
function trimAssessment(text) {
    const firstSentence = text.match(/^.*?[.!?](?:\s|$)/s)?.[0]?.trim() ?? text.trim();
    if (firstSentence.length <= 160)
        return firstSentence;
    return `${firstSentence.slice(0, 159)}…`;
}
function relativeTime(iso) {
    const then = Date.parse(iso.replace(/(\d{2})-(\d{2})-(\d{2})Z$/, '$1:$2:$3Z'));
    if (Number.isNaN(then))
        return iso;
    const mins = Math.round((Date.now() - then) / 60000);
    if (mins < 1)
        return 'just now';
    if (mins < 60)
        return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 48)
        return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}
function renderLastLine(last) {
    return `${last.command} · ${relativeTime(last.timestamp)} — ${trimAssessment(last.final_assessment)}`;
}
/**
 * Eligibility line for a workstream entry, with the D5 model-hint garnish.
 * Change entries carry hint keys via the nested per-change status; explore
 * entries (and degraded rows without status) have none — hint resolves null
 * and the line renders unchanged.
 */
function renderNextLine(entry) {
    // rc13b: a CONCLUDED explore's recorded next is the Concluded rung's prose, which points at
    // nothing — it renders BARE (no eligibility label, no model hint), because an eligibility
    // label on a recommendation naming no command would assert an eligibility that does not
    // exist (orbit-orientation's sourcing requirement, the concluded rule). The position literal
    // is read from the same trail token the chip reads, so the two cannot disagree.
    if (entry.kind === 'explore' && entry.position === 'concluded')
        return entry.next;
    const hint = modelHintFor('.', entry.status?.next_hint_keys);
    return `Ready when you are: ${withModelHint(entry.next, hint)}`;
}
function renderDegradedRow(entry) {
    // "name + a ONE-LINE error note" (fault-isolation clause b): real YAML/schema
    // errors embed multi-line code frames — the text row keeps the first line
    // only; the JSON `error` field carries the full string.
    const note = (entry.error ?? 'unknown failure').split('\n')[0].trim();
    return `${entry.name} — DEGRADED: ${note}`;
}
function stageTag(entry) {
    return entry.stage ? `  (stage ${entry.stage.stage} · ${entry.stage.doc})` : '';
}
function printSprintView(orientation, json) {
    const sprint = orientation.sprint;
    if (!sprint)
        return;
    if (json) {
        const others = orientation.workstreams.filter((w) => !(w.kind === sprint.kind && w.name === sprint.name));
        console.log(JSON.stringify({
            sprint,
            last: sprint.last ?? null,
            next: sprint.next ?? null,
            also: others.map((w) => w.degraded ? { name: w.name, kind: w.kind, degraded: true } : { name: w.name, kind: w.kind }),
            waiting: orientation.waiting,
            pr: orientation.pr,
        }, null, 2));
        return;
    }
    if (sprint.degraded) {
        // Bare degraded-sprint render: the degraded row in place of the strip,
        // plus any trustworthy fields; exit 0 (fault-isolation clause b).
        console.log(renderDegradedRow(sprint));
        if (sprint.last)
            console.log(`last: ${renderLastLine(sprint.last)}`);
        printSkippedEmits(sprint);
        if (sprint.next)
            console.log(renderNextLine(sprint));
    }
    else {
        console.log(`${sprint.name}${stageTag(sprint)}`);
        console.log(`  ${renderStrip(sprint.strip)}`);
        if (sprint.last)
            console.log(`last: ${renderLastLine(sprint.last)}`);
        else
            console.log('last: no emits yet');
        printSkippedEmits(sprint);
        if (sprint.next)
            console.log(renderNextLine(sprint));
    }
    const others = orientation.workstreams.filter((w) => !(w.kind === sprint.kind && w.name === sprint.name));
    const alsoParts = others.map((w) => 
    // An explore's phase word is its engine position (`exploring` / `concluded` — rc13b), never a literal.
    w.degraded ? `${w.name} (degraded)` : `${w.name} (${w.kind === 'explore' ? (w.position ?? 'exploring') : phaseOf(w)})`);
    const waitingParts = orientation.waiting;
    const alsoLine = alsoParts.length === 0 && waitingParts.length === 0
        ? 'also: nothing else in flight'
        : `also: ${[...alsoParts, ...waitingParts].join(' · ')}`;
    console.log(alsoLine);
}
/**
 * D5 fail-loud surfacing: one degraded note per excluded emit-shaped file —
 * detection without failure (exit 0), per orbit-orientation's fault isolation.
 */
function printSkippedEmits(entry) {
    for (const f of entry.skipped_emits ?? []) {
        console.log(`\u26a0 invalid emit skipped: ${f}`);
    }
}
/**
 * One-word phase for the `also` line — the ENGINE's frontier gate (first
 * non-superseded, non-passed gate in graph order), so an unpassed/stale review
 * frontier reads `(review)` rather than the completed predecessor. The strip is
 * presentation; the gate graph owns where a change actually stands.
 */
function phaseOf(entry) {
    const gates = entry.status?.gates;
    if (gates && gates.length > 0) {
        const frontier = gates.find((g) => !g.superseded && g.state !== 'passed');
        if (frontier) {
            return frontier.id === 'review-proposal' || frontier.id === 'review-system'
                ? 'review'
                : frontier.id;
        }
        return 'archive-ready';
    }
    // Ungated schemas: fall back to strip presentation.
    const strip = entry.strip ?? [];
    const current = strip.find((c) => c.glyph === '▶');
    if (current)
        return current.phase;
    const lastDone = [...strip].reverse().find((c) => c.glyph === '✓');
    return lastDone ? `${lastDone.phase} done` : 'pending';
}
function printFullView(orientation, json) {
    if (json) {
        console.log(JSON.stringify({
            program: orientation.program,
            workstreams: orientation.workstreams,
            last: orientation.last,
            waiting: orientation.waiting,
            pr: orientation.pr,
        }, null, 2));
        return;
    }
    const { parseable, legacy, malformed } = orientation.program;
    // Printed-entry tracking is by kind:name identity — a cited change and an
    // uncited twin-named explore must both render (the standalone filter would
    // otherwise drop the twin from the text view).
    const citedKeys = new Set();
    // One nesting walk for any doc's stages — parseable AND malformed docs'
    // well-formed siblings alike (siblings are real citation targets: the
    // architecture-status listing and WAITING already treat them as stages).
    const renderDocStages = (docName, stages) => {
        for (const s of stages) {
            // The stage line exactly as `orbit architecture status` renders it
            // (id + computed state with the completion composition + citing).
            console.log(`  ${renderStageLine(s)}`);
            for (const entry of orientation.workstreams) {
                if (entry.stage && entry.stage.doc === docName && entry.stage.stage === s.id) {
                    citedKeys.add(`${entry.kind}:${entry.name}`);
                    printWorkstreamEntry(entry, '      ');
                }
            }
        }
    };
    if (parseable.length > 0) {
        console.log('PROGRAM');
        for (const doc of parseable) {
            console.log(`  ${doc.doc}`);
            renderDocStages(doc.doc, doc.stages);
        }
        // Legacy/malformed docs listed as the architecture-status surface lists
        // them — with workstreams nested under malformed docs' sibling stages.
        for (const name of legacy)
            console.log(`  ${renderLegacyLine(name)}`);
        for (const m of malformed) {
            for (const line of renderMalformedHeaderLines(m))
                console.log(`  ${line}`);
            renderDocStages(m.doc, m.stages);
        }
        const standalone = orientation.workstreams.filter((w) => !citedKeys.has(`${w.kind}:${w.name}`));
        if (standalone.length > 0) {
            console.log('  standalone');
            for (const entry of standalone)
                printWorkstreamEntry(entry, '    ');
        }
    }
    else {
        // Flat fleet degradation: zero parseable docs — workstreams unnested, no
        // PROGRAM band, each entry still carrying the full tuple. Never an error.
        for (const entry of orientation.workstreams)
            printWorkstreamEntry(entry, '');
    }
    console.log();
    if (orientation.last) {
        console.log(`LAST: ${orientation.last.workstream} — ${renderLastLine(orientation.last.emit)}`);
    }
    if (orientation.waiting.length > 0) {
        console.log('WAITING');
        for (const w of orientation.waiting)
            console.log(`  ${w}`);
    }
}
/** Full-view entry: the full orientation tuple (degraded entries excepted). */
function printWorkstreamEntry(entry, indent) {
    if (entry.degraded) {
        console.log(`${indent}${renderDegradedRow(entry)}`);
        if (entry.last)
            console.log(`${indent}  last: ${renderLastLine(entry.last)}`);
        for (const f of entry.skipped_emits ?? [])
            console.log(`${indent}  \u26a0 invalid emit skipped: ${f}`);
        if (entry.next)
            console.log(`${indent}  ${renderNextLine(entry)}`);
        return;
    }
    console.log(`${indent}${entry.name} (${entry.kind})${stageTag(entry)}`);
    console.log(`${indent}  ${renderStrip(entry.strip)}`);
    if (entry.position && entry.kind === 'change')
        console.log(`${indent}  position: ${entry.position}`);
    console.log(`${indent}  last: ${entry.last ? renderLastLine(entry.last) : 'no emits yet'}`);
    for (const f of entry.skipped_emits ?? [])
        console.log(`${indent}  \u26a0 invalid emit skipped: ${f}`);
    if (entry.next)
        console.log(`${indent}  ${renderNextLine(entry)}`);
}
/**
 * report-archived-change: `--report`'s resolution, its alone (every other status form keeps
 * `validateChangeExists`). ACTIVE FIRST, as `orbit/changes/<name>/`; on a miss, the shared
 * archived-directory resolver, refused when its real path lies outside the archive root; a miss
 * in both names both locations checked.
 */
async function resolveReportLocation(name, projectRoot) {
    const nameValidation = validateChangeName(name);
    if (!nameValidation.valid) {
        throw new Error(`Invalid change name '${name}': ${nameValidation.error}`);
    }
    const activeDir = path.join(projectRoot, 'orbit', 'changes', name);
    if (fs.existsSync(activeDir) && fs.statSync(activeDir).isDirectory()) {
        return { changeDir: activeDir, archived: false };
    }
    const archivedDir = findArchivedDir(projectRoot, name);
    if (archivedDir !== null) {
        if (!resolvesWithin(archivedDir, path.join(projectRoot, 'orbit', 'changes', 'archive'))) {
            throw new Error(`archived change '${name}' resolves outside orbit/changes/archive — a symlinked archive entry is not a renderable trail`);
        }
        return { changeDir: archivedDir, archived: true };
    }
    const available = await getAvailableChanges(projectRoot);
    const checked = `checked orbit/changes/${name} and orbit/changes/archive/*-${name}`;
    throw new Error(available.length > 0
        ? `Change '${name}' not found — ${checked}. Available changes:\n  ${available.join('\n  ')}`
        : `Change '${name}' not found — ${checked}`);
}
//# sourceMappingURL=status.js.map