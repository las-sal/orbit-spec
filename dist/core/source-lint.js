/**
 * The source lint (rc07) — checks MARKED spans in living prose against the facts the engine
 * computes.
 *
 * The scope is deliberately narrow and stated out loud: the lint verifies a link the AUTHOR
 * declared. An UNMARKED figure that disagrees with a computable fact is INVISIBLE to it, and
 * always will be — deciding which number in arbitrary prose restates a given fact is
 * inference about intent, which R-crc-10 keeps out of the engine. Per-source marker COVERAGE
 * is reported as the mitigation, and it is a RECORD: it counts, and it judges nothing.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { computeCodeRegionMask } from './markdown-fence.js';
import { readSourcesRegistry, resolveSourceValue, SOURCES_REGISTRY_PATH, SourceRegistryError, } from './sources-registry.js';
// The delimiters are matched EXACTLY — one literal space inside each comment, no tabs, no
// line breaks, no compact form. The spec says a comment that does not match the opener grammar
// exactly is INERT, and a tolerant regex turned `<!--src:stages-->` into a live span, so prose
// the contract declares inert could raise a false failure. Only NAME is a pattern.
/**
 * THE check, in one place: containment of a STRING inside a boundary the AUTHOR drew.
 *
 * Exported so the four motivating defects can be asserted against the product rather than
 * against `String.prototype.includes` — in particular the compound case (`4C/6W/0S`), which is
 * the only fixture that discriminates containment from a numeric parse and which the CLOSED
 * v1 engine table cannot emit as a source value.
 *
 * It never parses a number, and it never infers which token in the span is the figure.
 */
export function checkSpanAgainstValue(spanText, sourceValue) {
    return spanText.includes(sourceValue);
}
// The CLOSER CARRIES ITS NAME, and that is what makes prose safe. An anonymous `<!-- /src -->`
// has no placeholder form, so every sentence mentioning it was a live orphan closer — which is
// why an inline-code scanner once existed, and why four reviewers found four defects in it. A
// named closer is inert in prose by the same NAME-grammar rule that always protected the
// opener: authors write NAME, and the grammar does the rest.
const OPENER_REGEX = /<!-- src:([a-z0-9][a-z0-9-]*) -->/g;
const CLOSER_REGEX = /<!-- \/src:([a-z0-9][a-z0-9-]*) -->/g;
const closerFor = (name) => `<!-- /src:${name} -->`;
/**
 * The lint reads LIVING documents, never RECORDS. Every exclusion is decidable BY PATH, so
 * no judgment is asked of the engine; a figure inside a record was TRUE WHEN WRITTEN, and
 * linting it would demand rewriting history to match the present.
 */
export function isExcludedPath(repoRelative) {
    const p = repoRelative.split(path.sep).join('/');
    const segments = p.split('/');
    // RECORDS — true when written.
    if (p.startsWith('orbit/changes/archive/'))
        return true;
    if (segments.includes('.orbit-runs'))
        return true;
    // FIXTURES and GOLDENS — their numbers are test data.
    if (p === 'test' || p.startsWith('test/'))
        return true;
    // TEMPLATES — placeholders, not claims. BOTH tiers: the package's own schemas and a
    // project-local schema directory (version-controlled when present).
    if (/^schemas\/[^/]+\/templates\//.test(p))
        return true;
    if (/^orbit\/schemas\/[^/]+\/templates\//.test(p))
        return true;
    // GENERATED — the source is what must be true.
    if (p.startsWith('.claude/'))
        return true;
    return false;
}
/**
 * The file domain is `git ls-files '*.md'` minus the declared exclusions. Git's tracked-file
 * list is the authority, so the domain closes by construction rather than by a directory
 * list an author remembers — with two consequences STATED rather than discovered: an
 * UNTRACKED markdown file is outside the domain until it is added, and where git cannot
 * answer at all the domain is EMPTY with a named reason, never an exception.
 */
export function resolveFileDomain(projectRoot) {
    let stdout;
    try {
        // `-z` is not a nicety: git's default `core.quotePath=true` C-quotes any path with a
        // non-ASCII byte (`"d\303\251-caf\303\251.md"`, quotes included), which then names no
        // file on disk and leaves the domain with no signal at all. Under `-z` git emits raw
        // bytes NUL-separated, which also makes a path containing a newline or surrounding
        // spaces safe — so paths are never trimmed either.
        stdout = execFileSync('git', ['ls-files', '-z', '--', '*.md'], {
            cwd: projectRoot,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
    }
    catch (err) {
        return {
            files: [],
            reason: `git could not list tracked files (no git, or not a repository): ${err.message.split('\n')[0]}`,
        };
    }
    const files = stdout
        .split('\0')
        .filter((l) => l.length > 0)
        .filter((l) => !isExcludedPath(l))
        .sort();
    return { files, reason: null };
}
/**
 * Parses one document's marked spans.
 *
 * A marker is INERT — neither an opener nor a closer — in TWO cases, so that prose ABOUT the
 * syntax never becomes prose CHECKED by it: a comment that does not match the delimiter grammar
 * exactly, and a marker inside a fenced code block. Backticks confer NO inertness; the NAME does,
 * which is why prose writes a PLACEHOLDER name. A real-named pair in prose is LIVE, deliberately.
 *
 * Pairing is a CLOSED table whose outcomes are of two kinds. A MARKER ERROR names the
 * offending delimiter's line, because there is no span to compare; an EMPTY span is NOT a
 * syntax error but a CHECK FAILURE, reported with the source value like any disagreeing
 * span. A marker error ABANDONS the rest of this file (pairing is no longer trustworthy
 * inside it) and nothing else: every other file still lints and still reports.
 */
export function parseMarkedSpans(content) {
    const code = computeCodeRegionMask(content);
    const lineOf = buildLineIndex(content);
    const delimiters = [];
    OPENER_REGEX.lastIndex = 0;
    for (let m = OPENER_REGEX.exec(content); m !== null; m = OPENER_REGEX.exec(content)) {
        if (code[m.index])
            continue;
        delimiters.push({ type: 'open', start: m.index, end: m.index + m[0].length, source: m[1] });
    }
    CLOSER_REGEX.lastIndex = 0;
    for (let m = CLOSER_REGEX.exec(content); m !== null; m = CLOSER_REGEX.exec(content)) {
        if (code[m.index])
            continue;
        delimiters.push({ type: 'close', start: m.index, end: m.index + m[0].length, source: m[1] });
    }
    delimiters.sort((a, b) => a.start - b.start);
    const spans = [];
    let open = null;
    for (const d of delimiters) {
        if (d.type === 'open') {
            if (open) {
                // Nesting is not supported; the FIRST opener's line is the one named.
                return {
                    spans,
                    error: {
                        line: lineOf(open.start),
                        detail: `unclosed marker: '<!-- src:${open.source} -->' has no '${closerFor(open.source)}' before the next opener`,
                    },
                };
            }
            open = d;
            continue;
        }
        if (!open) {
            return {
                spans,
                error: { line: lineOf(d.start), detail: `orphan closer: '${closerFor(d.source)}' with no open span` },
            };
        }
        if (d.source !== open.source) {
            // A named closer naming a DIFFERENT source is an authoring error the anonymous form could
            // not express: re-pairing it silently would close a span the author never opened.
            return {
                spans,
                error: {
                    line: lineOf(d.start),
                    detail: `mismatched closer: '${closerFor(d.source)}' closes a span opened as '<!-- src:${open.source} -->'`,
                },
            };
        }
        spans.push({ source: open.source, line: lineOf(open.start), text: content.slice(open.end, d.start) });
        open = null;
    }
    if (open) {
        return {
            spans,
            error: {
                line: lineOf(open.start),
                detail: `unclosed marker: '<!-- src:${open.source} -->' has no '${closerFor(open.source)}' before end of file`,
            },
        };
    }
    return { spans, error: null };
}
function buildLineIndex(content) {
    const starts = [0];
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '\n')
            starts.push(i + 1);
    }
    return (offset) => {
        let lo = 0;
        let hi = starts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (starts[mid] <= offset)
                lo = mid;
            else
                hi = mid - 1;
        }
        return lo + 1;
    };
}
/**
 * Runs the source lint over a project. Never throws: every fault becomes a finding.
 */
export function runSourceLint(projectRoot) {
    const registryFile = path.join(projectRoot, SOURCES_REGISTRY_PATH);
    if (!fs.existsSync(registryFile)) {
        // No registry → no sources, no markers, no lint: the state of every repository today.
        return { registryPresent: false, findings: [], coverage: [], filesScanned: 0, domainReason: null, scanComplete: true };
    }
    let declared;
    try {
        declared = readSourcesRegistry(projectRoot);
    }
    catch (err) {
        const detail = err instanceof SourceRegistryError ? err.message : `could not read the registry: ${err.message}`;
        return {
            registryPresent: true,
            findings: [{ kind: 'registry', file: SOURCES_REGISTRY_PATH, detail }],
            coverage: [],
            filesScanned: 0,
            domainReason: null,
            scanComplete: true,
        };
    }
    const findings = [];
    const values = new Map();
    for (const source of declared) {
        try {
            values.set(source.name, resolveSourceValue(projectRoot, source));
        }
        catch (err) {
            findings.push({
                kind: 'registry',
                file: SOURCES_REGISTRY_PATH,
                detail: `source '${source.name}' did not resolve: ${err.message}`,
            });
        }
    }
    const { files, reason } = resolveFileDomain(projectRoot);
    // A domain that could not be listed is the first way a scan is incomplete.
    let scanComplete = reason === null;
    const markerCounts = new Map(declared.map((d) => [d.name, 0]));
    let filesRead = 0;
    for (const file of files) {
        const absolute = path.join(projectRoot, file);
        let content;
        // A tracked path with NO DIRECTORY ENTRY is the ONE silence that is correct (a deleted file
        // still appears in `git ls-files`). `lstat`, never `exists`: the latter follows symlinks, so
        // a tracked DANGLING symlink — an entry that exists, pointing at nothing — was silently
        // skipped as though it had been deleted.
        let entry;
        try {
            entry = fs.lstatSync(absolute);
        }
        catch (err) {
            // ONLY a genuinely absent entry is silent. A bare catch also swallowed EACCES (a tracked
            // path under an unsearchable parent), ENOTDIR and metadata I/O faults, each of which
            // leaves a tracked living document unexamined while the run still looks clean.
            if (err.code === 'ENOENT')
                continue;
            findings.push({
                kind: 'domain',
                file,
                detail: `tracked path could not be inspected (${err.code ?? 'unknown error'}), so its marked spans were never checked`,
            });
            scanComplete = false;
            continue;
        }
        // A tracked symlink is a DOMAIN fault rather than a file to follow. Git tracks the link
        // text; following it would lint bytes that live outside the tracked set, possibly outside
        // the repository. The policy is deterministic and stated rather than left to what the
        // filesystem happens to resolve.
        if (entry.isSymbolicLink()) {
            findings.push({
                kind: 'domain',
                file,
                detail: 'tracked path is a symlink; the lint reads tracked file content, not link targets, so its marked spans were never checked',
            });
            scanComplete = false;
            continue;
        }
        try {
            content = fs.readFileSync(absolute, 'utf-8');
        }
        catch (err) {
            findings.push({
                kind: 'domain',
                file,
                detail: `tracked file could not be read, so its marked spans were never checked: ${err.message}`,
            });
            scanComplete = false;
            continue;
        }
        filesRead++;
        const { spans, error } = parseMarkedSpans(content);
        for (const span of spans) {
            if (markerCounts.has(span.source)) {
                markerCounts.set(span.source, markerCounts.get(span.source) + 1);
            }
            if (!values.has(span.source)) {
                if (!markerCounts.has(span.source)) {
                    findings.push({ kind: 'unknown-source', file, line: span.line, source: span.source });
                }
                // A declared source that failed to resolve is already reported once, at the
                // registry level; the span is not reported a second time.
                continue;
            }
            const value = values.get(span.source);
            if (!checkSpanAgainstValue(span.text, value)) {
                findings.push({
                    kind: 'mismatch',
                    file,
                    line: span.line,
                    source: span.source,
                    span_text: span.text,
                    source_value: value,
                });
            }
        }
        if (error) {
            findings.push({ kind: 'marker', file, line: error.line, detail: error.detail });
            // A marker error ABANDONS the rest of this file — pairing is no longer trustworthy inside
            // it — so the abandoned suffix may hold any source's only marker. The file was read but
            // not fully examined, which is exactly the distinction this flag exists to carry.
            scanComplete = false;
        }
    }
    const coverage = declared.map((d) => ({
        source: d.name,
        value: values.has(d.name) ? values.get(d.name) : null,
        markers: markerCounts.get(d.name) ?? 0,
    }));
    // `filesScanned` counts files actually READ, never files merely listed — otherwise the one
    // number answering "what did this run look at" overstates itself precisely when a read failed.
    return { registryPresent: true, findings, coverage, filesScanned: filesRead, domainReason: reason, scanComplete };
}
//# sourceMappingURL=source-lint.js.map