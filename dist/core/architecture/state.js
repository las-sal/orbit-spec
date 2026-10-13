/**
 * Computed stage state (D-arc Stage D2) — a pure function of on-disk artifacts.
 * Never stored, never hand-authored, no caching (the citation corpus is small).
 *
 * Observed-state precedence: in-change > exploring > quiescent > concluded > premised
 * (live activity outranks history; archived work outranks a conclusion). A citing
 * staging directory observes `concluded` iff its `explore.md` header carries the
 * concluded token of the production `orbit-conventions` owns — read through the
 * explore parser's ONE reader (`readStatus`), never a second regex; a missing or
 * unreadable file, the `exploring` token, or neither token observe as live `exploring`.
 *
 * Completion is a COMPOSITION of observation and mark — ONE table for both layers
 * (rc15, `orbit-architecture-engine`'s `Computed stage state` requirement):
 *
 *   observed \ mark | `[ ]`                            | `[x]` ratified | `[~]` ended
 *   in-change       | in-change                        | INCONSISTENT   | INCONSISTENT
 *   exploring (live)| exploring                        | INCONSISTENT   | INCONSISTENT
 *   quiescent       | quiescent-awaiting-ratification  | complete       | ended
 *   concluded       | ended-from-explore               | INCONSISTENT   | ended
 *   premised        | premised                         | INCONSISTENT   | ended
 *
 * A ratified mark needs evidence (an archive), so it is honoured on `quiescent` only;
 * an ended mark asserts nothing about the work, so it is honoured wherever no LIVE
 * citing work contradicts it. Every INCONSISTENT cell is surfaced by the status render
 * (never a silent `complete` or `ended`) and raised by audit-drift's check (b).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { readStatus } from '../parsers/explore-rules.js';
/**
 * Lenient citation read: the scan must never explode on one unreadable or
 * schema-invalid metadata file (archived pre-capability changes, hand-edits).
 * Only a well-shaped `architecture: {doc, stage}` counts as a citation.
 */
function readCitation(dir) {
    const metaPath = path.join(dir, '.openspec.yaml');
    try {
        if (!fs.existsSync(metaPath))
            return null;
        const parsed = yaml.parse(fs.readFileSync(metaPath, 'utf-8'));
        const arch = parsed?.architecture;
        if (arch && typeof arch.doc === 'string' && typeof arch.stage === 'string') {
            return { doc: arch.doc, stage: arch.stage };
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Whether a staging directory's `explore.md` carries the concluded header token. ONE reader
 * of the status-header production in the engine (the explore parser's `readStatus`); a
 * missing or unreadable file is NOT concluded — the same leniency as `readCitation`.
 */
function readConcluded(exploreDir) {
    try {
        const explorePath = path.join(exploreDir, 'explore.md');
        if (!fs.existsSync(explorePath))
            return false;
        return readStatus(fs.readFileSync(explorePath, 'utf-8')).token === 'concluded';
    }
    catch {
        return false;
    }
}
function subdirs(dir) {
    if (!fs.existsSync(dir))
        return [];
    return fs
        .readdirSync(dir)
        .filter((f) => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isDirectory())
        .sort();
}
/**
 * Scan orbit/changes/*, orbit/changes/archive/*, and orbit/explore/* for artifacts
 * citing `{doc: <docName>}`, keyed by stage id.
 */
export function scanCitations(projectRoot, docName) {
    const byStage = new Map();
    const record = (stage, artifact) => {
        const list = byStage.get(stage) ?? [];
        list.push(artifact);
        byStage.set(stage, list);
    };
    const changesDir = path.join(projectRoot, 'orbit', 'changes');
    for (const name of subdirs(changesDir)) {
        if (name === 'archive')
            continue;
        const citation = readCitation(path.join(changesDir, name));
        if (citation?.doc === docName) {
            record(citation.stage, { kind: 'active-change', name, path: path.join('orbit', 'changes', name) });
        }
    }
    const archiveDir = path.join(changesDir, 'archive');
    for (const name of subdirs(archiveDir)) {
        const citation = readCitation(path.join(archiveDir, name));
        if (citation?.doc === docName) {
            record(citation.stage, { kind: 'archived-change', name, path: path.join('orbit', 'changes', 'archive', name) });
        }
    }
    const exploreDir = path.join(projectRoot, 'orbit', 'explore');
    for (const name of subdirs(exploreDir)) {
        const citation = readCitation(path.join(exploreDir, name));
        if (citation?.doc === docName) {
            record(citation.stage, {
                kind: 'explore',
                name,
                path: path.join('orbit', 'explore', name),
                concluded: readConcluded(path.join(exploreDir, name)),
            });
        }
    }
    return byStage;
}
const isLiveExplore = (c) => c.kind === 'explore' && !c.concluded;
function observe(citing) {
    if (citing.some((c) => c.kind === 'active-change'))
        return 'in-change';
    if (citing.some(isLiveExplore))
        return 'exploring';
    if (citing.some((c) => c.kind === 'archived-change'))
        return 'quiescent';
    if (citing.length > 0)
        return 'concluded'; // every citer is a concluded explore
    return 'premised';
}
/**
 * The first LIVE citer in precedence order (an active change, else a live explore) — what an
 * inconsistency detail names when live work contradicts a mark. Undefined off the live rows.
 */
function liveCiter(citing) {
    return citing.find((c) => c.kind === 'active-change') ?? citing.find(isLiveExplore);
}
/** The composition table, cell for cell (see the module docblock). */
function compose(stage, observed, citing) {
    const { ratified, ended } = stage.complete;
    // `[ ]` column.
    if (!ratified && !ended) {
        if (observed === 'quiescent')
            return { rendered: 'quiescent-awaiting-ratification' };
        if (observed === 'concluded')
            return { rendered: 'ended-from-explore' };
        return { rendered: observed };
    }
    // `[~]` column: ending asserts nothing about the work — honoured wherever no LIVE work contradicts it.
    if (ended) {
        if (observed === 'in-change' || observed === 'exploring') {
            const live = liveCiter(citing);
            return {
                rendered: 'inconsistent',
                inconsistency: `Complete: mark is ended but ${live.kind}:${live.name} is live — the mark is not honored`,
            };
        }
        return { rendered: 'ended' };
    }
    // `[x]` column: honored ONLY on an observed-quiescent stage (its OUTCOMES pre-date rc15 unchanged).
    if (observed === 'quiescent')
        return { rendered: 'complete' };
    const detail = observed === 'premised'
        ? 'no citing artifact exists (a pre-citation archive may need its backfill)'
        : observed === 'concluded'
            ? 'a concluded exploration is not evidence that the exit criteria were met'
            : `live citing work observed (${observed})`;
    return {
        rendered: 'inconsistent',
        inconsistency: `Complete: mark is ratified but the observed state is '${observed}' — ${detail}; the mark is not honored`,
    };
}
/**
 * Compute the state of every well-formed stage in a doc. Pure recompute per call.
 */
export function computeStageStates(projectRoot, doc) {
    const citations = scanCitations(projectRoot, doc.name);
    return doc.stages.map((stage) => {
        const citing = citations.get(stage.id) ?? [];
        const observed = observe(citing);
        const { rendered, inconsistency } = compose(stage, observed, citing);
        const { ratified, ended, date, who } = stage.complete;
        return {
            id: stage.id,
            title: stage.title,
            observed,
            ratified,
            ratifiedDate: ratified ? date : undefined,
            ratifiedWho: ratified ? who : undefined,
            ended,
            endedDate: ended ? date : undefined,
            endedWho: ended ? who : undefined,
            rendered,
            inconsistency,
            citing,
        };
    });
}
//# sourceMappingURL=state.js.map