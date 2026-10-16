/**
 * Fence-aware parser for architecture docs (D-arc Stage D2).
 *
 * An architecture doc declares engine-readable structure via heading conventions while
 * staying a judgment-dense prose document. This parser INTERPRETS only: stage ids/titles, the
 * two optional slot lines (`Depends-on:` / `Complete:` — the latter with three exact productions),
 * and section boundaries; `docClass` and
 * the violation list derive from that grammar alone. All other content — charter prose, exit
 * criteria, premise, rulings, status log — carries no meaning this parser assigns.
 *
 * It does CARRY the document's raw lines as passthrough (`ParsedArchitectureDoc.lines`), which
 * is the substrate `sliceStageSection` slices for `orbit architecture show` and which the source
 * lint reads to count ruling entries. Carrying content is not interpreting it — but an earlier
 * version of this comment said "the engine reads ONLY", which was false of that field and of
 * both readers. The permitted readers of passthrough are enumerated in the
 * `orbit-architecture-engine` spec; any new one belongs on that list.
 *
 * Near-miss rule: a doc intended to be parseable must never silently degrade to legacy.
 * A heading starting `### Stage ` that fails the exact grammar, or a slot line inside a
 * stage section that fails slot syntax, is a grammar VIOLATION naming the line — the doc
 * classes as `malformed` (its well-formed stages still parse and participate in state
 * computation). LEGACY means zero `### Stage `-prefixed headings outside fences.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { computeFenceMask } from '../parsers/requirement-blocks.js';
export const ARCHITECTURE_DIR = path.join('orbit', 'architecture');
const STAGE_HEADING_PREFIX = '### Stage ';
// `### Stage <kebab-id> — <title>` (em-dash required; kebab-case id)
const STAGE_HEADING_REGEX = /^### Stage ([a-z0-9]+(?:-[a-z0-9]+)*) — (.+?)\s*$/;
const DEPENDS_ON_REGEX = /^Depends-on:\s*(\(none\)|[a-z0-9]+(?:-[a-z0-9]+)*(?:\s*,\s*[a-z0-9]+(?:-[a-z0-9]+)*)*)\s*$/;
// Three EXACT productions: unratified `[ ]`, ratified `[x] <date> (<who>)`, ended `[~] <date> (<who>)`.
// The dated productions are LEXICAL — the date is shape-only and the attribution is opaque up to
// the final closing paren (a declared limit shared by both; rc15 D-rc15-4).
const COMPLETE_REGEX = /^Complete:\s*(?:\[ \]|\[x\] (\d{4}-\d{2}-\d{2}) \((.+?)\)|\[~\] (\d{4}-\d{2}-\d{2}) \((.+?)\))\s*$/;
/**
 * The `Complete:` slot's three productions AS THE OWNING SPEC STATES THEM — one string,
 * byte-equal to the inline production in `orbit-architecture-engine`'s `Parseable
 * architecture-doc format` requirement (a parity test reads the owner through the
 * single-active-owner lookup and asserts equality). The architect body interpolates this
 * constant so its scaffold sentence is a CHECKED MIRROR of the owner, never a second
 * statement of the grammar (R-crc-14's mirror corollary; rc15 external system pass W1).
 * `COMPLETE_REGEX` above is the executable form of the same three productions.
 */
export const COMPLETE_SLOT_PRODUCTIONS = '`Complete: [ ]` / `Complete: [x] <YYYY-MM-DD> (<who>)` / `Complete: [~] <YYYY-MM-DD> (<who>)`';
/**
 * Parse architecture-doc content. Pure function of the text.
 */
export function parseArchitectureDoc(content, name, docPath = '') {
    const lines = content.replace(/\r\n?/g, '\n').split('\n');
    const fence = computeFenceMask(lines);
    const stages = [];
    const violations = [];
    const headings = [];
    for (let i = 0; i < lines.length; i++) {
        if (fence[i])
            continue;
        if (!lines[i].startsWith(STAGE_HEADING_PREFIX))
            continue;
        const m = lines[i].match(STAGE_HEADING_REGEX);
        if (m) {
            headings.push({ line: i, id: m[1], title: m[2] });
        }
        else {
            headings.push({ line: i });
            violations.push({
                line: i,
                text: lines[i],
                reason: `stage heading fails the grammar \`### Stage <kebab-id> — <title>\` (kebab-case id, em-dash separator)`,
            });
        }
    }
    if (headings.length === 0) {
        return { name, path: docPath, docClass: 'legacy', stages: [], violations: [], lines };
    }
    // Section bound: from a stage heading to the next same-or-higher-level heading (### or higher).
    const sectionEndFrom = (start) => {
        for (let i = start + 1; i < lines.length; i++) {
            if (!fence[i] && /^#{1,3} /.test(lines[i]))
                return i;
        }
        return lines.length;
    };
    for (const h of headings) {
        const sectionEnd = sectionEndFrom(h.line);
        if (h.id === undefined)
            continue; // near-miss heading: violation recorded; no stage bound
        const stage = {
            id: h.id,
            title: h.title,
            headingLine: h.line,
            sectionEnd,
            dependsOn: [],
            hasDependsOnSlot: false,
            complete: { ratified: false, ended: false },
            hasCompleteSlot: false,
        };
        for (let i = h.line + 1; i < sectionEnd; i++) {
            if (fence[i])
                continue;
            const line = lines[i];
            if (line.startsWith('Depends-on:')) {
                const m = line.match(DEPENDS_ON_REGEX);
                if (!m) {
                    violations.push({
                        line: i,
                        text: line,
                        reason: `Depends-on slot fails the grammar \`Depends-on: (none)\` or \`Depends-on: <id>[, <id>…]\``,
                    });
                }
                else if (stage.hasDependsOnSlot) {
                    violations.push({ line: i, text: line, reason: `duplicate Depends-on slot in stage '${stage.id}'` });
                }
                else {
                    stage.hasDependsOnSlot = true;
                    stage.dependsOnLine = i;
                    stage.dependsOn = m[1] === '(none)' ? [] : m[1].split(',').map((s) => s.trim());
                }
            }
            else if (line.startsWith('Complete:')) {
                const m = line.match(COMPLETE_REGEX);
                if (!m) {
                    violations.push({
                        line: i,
                        text: line,
                        reason: `Complete slot fails the grammar \`Complete: [ ]\`, \`Complete: [x] <YYYY-MM-DD> (<who>)\` or \`Complete: [~] <YYYY-MM-DD> (<who>)\``,
                    });
                }
                else if (stage.hasCompleteSlot) {
                    violations.push({ line: i, text: line, reason: `duplicate Complete slot in stage '${stage.id}'` });
                }
                else {
                    stage.hasCompleteSlot = true;
                    stage.completeLine = i;
                    stage.complete = m[1]
                        ? { ratified: true, ended: false, date: m[1], who: m[2] }
                        : m[3]
                            ? { ratified: false, ended: true, date: m[3], who: m[4] }
                            : { ratified: false, ended: false };
                }
            }
        }
        stages.push(stage);
    }
    const docClass = violations.length > 0 ? 'malformed' : 'parseable';
    return { name, path: docPath, docClass, stages, violations, lines };
}
/**
 * A doc's citable identity is its FILENAME STEM — a canonical name, never a path.
 * Rejects separators, traversal segments, and leading dots so `show ../../README`
 * (or an alias like `subdir/../real-doc`) can neither escape orbit/architecture/
 * nor create a second spelling of one identity (validation and the state scan must
 * agree on exact names).
 */
export function isValidDocName(name) {
    return name.length > 0 && !/[\\/]/.test(name) && !name.startsWith('.') && !name.includes('..');
}
/**
 * Load and parse one architecture doc by name (filename stem). Returns null when the
 * name is not a canonical stem or the file does not exist. Defense in depth: even a
 * name passing the stem check must resolve to a file directly under the architecture
 * directory.
 */
export function loadArchitectureDoc(projectRoot, name) {
    if (!isValidDocName(name))
        return null;
    const dir = path.resolve(projectRoot, ARCHITECTURE_DIR);
    const docPath = path.resolve(dir, `${name}.md`);
    if (path.dirname(docPath) !== dir)
        return null;
    if (!fs.existsSync(docPath))
        return null;
    const content = fs.readFileSync(docPath, 'utf-8');
    return parseArchitectureDoc(content, name, path.join(ARCHITECTURE_DIR, `${name}.md`));
}
/**
 * List and parse every architecture doc (top-level *.md under orbit/architecture/).
 * Returns [] when the directory does not exist. `.orbit-runs/` and subdirectories are
 * never docs.
 */
export function listArchitectureDocs(projectRoot) {
    const dir = path.join(projectRoot, ARCHITECTURE_DIR);
    if (!fs.existsSync(dir))
        return [];
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md') && fs.statSync(path.join(dir, f)).isFile())
        .sort()
        .map((f) => loadArchitectureDoc(projectRoot, f.slice(0, -3)))
        .filter((d) => d !== null);
}
/**
 * Slice one stage's section (heading through the line before the next same-or-higher
 * heading) out of a parsed doc. Returns null when the stage id is not declared.
 */
export function sliceStageSection(doc, stageId) {
    const stage = doc.stages.find((s) => s.id === stageId);
    if (!stage)
        return null;
    return doc.lines.slice(stage.headingLine, stage.sectionEnd).join('\n').trimEnd();
}
//# sourceMappingURL=parser.js.map