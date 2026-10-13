/**
 * `orbit architecture status|show|validate` — the architecture-tier CLI (D-arc D2).
 *
 * status:   computed program position across all docs, bucketed parseable/legacy/
 *           malformed; per-stage observed state (with the completion composition) +
 *           citing artifacts. Eligibility-framed: renders state, never commands.
 * show:     one stage's section (heading-to-heading slice) or the doc's stage index —
 *           a session loads ONE stage section, never the whole doc.
 * validate: doc structure only (heading form, slot syntax, id uniqueness, Depends-on
 *           resolution). Legacy passes with a note; malformed fails naming lines.
 */
import chalk from 'chalk';
import { loadArchitectureDoc, sliceStageSection, } from '../core/architecture/parser.js';
import { buildArchitectureBuckets, renderStageLine, renderLegacyLine, renderMalformedLines, } from '../core/architecture/buckets.js';
import { validateArchitectureDoc } from '../core/architecture/validate.js';
export class ArchitectureCommand {
    status(options = {}) {
        const projectRoot = '.';
        const buckets = buildArchitectureBuckets(projectRoot);
        const { parseable, legacy, malformed } = buckets;
        if (options.json) {
            console.log(JSON.stringify(buckets, null, 2));
            return 0;
        }
        if (parseable.length + legacy.length + malformed.length === 0) {
            console.log('no architecture docs (orbit/architecture/ has none)');
            return 0;
        }
        for (const p of parseable) {
            console.log(chalk.bold(p.doc));
            for (const s of p.stages)
                console.log(renderStageLine(s));
        }
        for (const name of legacy) {
            console.log(renderLegacyLine(name));
        }
        for (const p of malformed) {
            for (const line of renderMalformedLines(p))
                console.log(line);
        }
        return 0;
    }
    show(docName, stageId, options = {}) {
        const projectRoot = '.';
        const doc = loadArchitectureDoc(projectRoot, docName);
        if (!doc)
            throw new Error(`No architecture doc named '${docName}' under orbit/architecture/.`);
        if (doc.docClass === 'malformed') {
            const details = doc.violations.map((v) => `line ${v.line + 1}: ${v.reason}`).join('; ');
            throw new Error(`Doc '${docName}' is MALFORMED (${details}). Malformed docs are fixed, not browsed — run: orbit architecture validate ${docName}`);
        }
        if (stageId === undefined) {
            const index = doc.stages.map((s) => ({ id: s.id, title: s.title }));
            if (options.json) {
                console.log(JSON.stringify({ doc: docName, docClass: doc.docClass, stages: index }, null, 2));
                return 0;
            }
            if (doc.docClass === 'legacy') {
                console.log(`${docName} — legacy/opaque doc; no parseable stages to index`);
                return 0;
            }
            console.log(chalk.bold(`${docName} — stage index`));
            for (const s of index)
                console.log(`  ${s.id} — ${s.title}`);
            return 0;
        }
        const section = sliceStageSection(doc, stageId);
        if (section === null) {
            const declared = doc.stages.length > 0 ? doc.stages.map((s) => s.id).join(', ') : 'none (legacy/opaque doc)';
            throw new Error(`Doc '${docName}' declares no stage '${stageId}'. Declared stages: ${declared}.`);
        }
        if (options.json) {
            console.log(JSON.stringify({ doc: docName, stage: stageId, section }, null, 2));
            return 0;
        }
        console.log(section);
        return 0;
    }
    validate(docName, options = {}) {
        const projectRoot = '.';
        const doc = loadArchitectureDoc(projectRoot, docName);
        if (!doc)
            throw new Error(`No architecture doc named '${docName}' under orbit/architecture/.`);
        const result = validateArchitectureDoc(doc);
        if (options.json) {
            console.log(JSON.stringify({
                doc: docName,
                valid: result.valid,
                docClass: result.docClass,
                issues: result.issues.map((i) => ({ line: i.line !== undefined ? i.line + 1 : undefined, message: i.message })),
                note: result.note,
            }, null, 2));
            return result.valid ? 0 : 1;
        }
        if (result.valid) {
            console.log(`Doc '${docName}' is valid${result.note ? ` — ${result.note}` : ''}`);
            return 0;
        }
        console.log(chalk.red(`Doc '${docName}' is INVALID:`));
        for (const issue of result.issues) {
            const where = issue.line !== undefined ? `line ${issue.line + 1}: ` : '';
            console.log(chalk.red(`  ${where}${issue.message}`));
        }
        return 1;
    }
}
//# sourceMappingURL=architecture.js.map