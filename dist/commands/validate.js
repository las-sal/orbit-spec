import ora from 'ora';
import path from 'path';
import { Validator } from '../core/validation/validator.js';
import { isInteractive, resolveNoInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getSpecIds } from '../utils/item-discovery.js';
import { nearestMatches } from '../utils/match.js';
import { runSourceLint } from '../core/source-lint.js';
export class ValidateCommand {
    async execute(itemName, options = {}) {
        const interactive = isInteractive(options);
        // Handle bulk flags first
        if (options.all || options.changes || options.specs || options.sources) {
            await this.runBulkValidation({
                changes: !!options.all || !!options.changes,
                specs: !!options.all || !!options.specs,
                sources: !!options.all || !!options.sources,
            }, { strict: !!options.strict, json: !!options.json, concurrency: options.concurrency, noInteractive: resolveNoInteractive(options) });
            return;
        }
        // No item and no flags
        if (!itemName) {
            if (interactive) {
                await this.runInteractiveSelector({ strict: !!options.strict, json: !!options.json, concurrency: options.concurrency });
                return;
            }
            this.printNonInteractiveHint();
            process.exitCode = 1;
            return;
        }
        // Direct item validation with type detection or override
        const typeOverride = this.normalizeType(options.type);
        await this.validateDirectItem(itemName, { typeOverride, strict: !!options.strict, json: !!options.json });
    }
    normalizeType(value) {
        if (!value)
            return undefined;
        const v = value.toLowerCase();
        if (v === 'change' || v === 'spec')
            return v;
        return undefined;
    }
    async runInteractiveSelector(opts) {
        const { select } = await import('@inquirer/prompts');
        const choice = await select({
            message: 'What would you like to validate?',
            choices: [
                { name: 'All (changes + specs + sources)', value: 'all' },
                { name: 'All changes', value: 'changes' },
                { name: 'All specs', value: 'specs' },
                { name: 'Pick a specific change or spec', value: 'one' },
            ],
        });
        if (choice === 'all')
            return this.runBulkValidation({ changes: true, specs: true, sources: true }, opts);
        if (choice === 'changes')
            return this.runBulkValidation({ changes: true, specs: false, sources: false }, opts);
        if (choice === 'specs')
            return this.runBulkValidation({ changes: false, specs: true, sources: false }, opts);
        // one
        const [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
        const items = [];
        items.push(...changes.map(id => ({ name: `change/${id}`, value: { type: 'change', id } })));
        items.push(...specs.map(id => ({ name: `spec/${id}`, value: { type: 'spec', id } })));
        if (items.length === 0) {
            console.error('No items found to validate.');
            process.exitCode = 1;
            return;
        }
        const picked = await select({ message: 'Pick an item', choices: items });
        await this.validateByType(picked.type, picked.id, opts);
    }
    printNonInteractiveHint() {
        console.error('Nothing to validate. Try one of:');
        console.error('  orbit validate --all');
        console.error('  orbit validate --changes');
        console.error('  orbit validate --specs');
        console.error('  orbit validate --sources');
        console.error('  orbit validate <item-name>');
        console.error('Or run in an interactive terminal.');
    }
    async validateDirectItem(itemName, opts) {
        const [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
        const isChange = changes.includes(itemName);
        const isSpec = specs.includes(itemName);
        const type = opts.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);
        if (!type) {
            console.error(`Unknown item '${itemName}'`);
            const suggestions = nearestMatches(itemName, [...changes, ...specs]);
            if (suggestions.length)
                console.error(`Did you mean: ${suggestions.join(', ')}?`);
            process.exitCode = 1;
            return;
        }
        if (!opts.typeOverride && isChange && isSpec) {
            console.error(`Ambiguous item '${itemName}' matches both a change and a spec.`);
            console.error('Pass --type change|spec, or use: orbit change validate / orbit spec validate');
            process.exitCode = 1;
            return;
        }
        await this.validateByType(type, itemName, opts);
    }
    async validateByType(type, id, opts) {
        const validator = new Validator(opts.strict);
        if (type === 'change') {
            const changeDir = path.join(process.cwd(), 'orbit', 'changes', id);
            const start = Date.now();
            const report = await validator.validateChangeDeltaSpecs(changeDir);
            const durationMs = Date.now() - start;
            this.printReport('change', id, report, durationMs, opts.json);
            // Non-zero exit if invalid (keeps enriched output test semantics)
            process.exitCode = report.valid ? 0 : 1;
            return;
        }
        const file = path.join(process.cwd(), 'orbit', 'specs', id, 'spec.md');
        const start = Date.now();
        const report = await validator.validateSpec(file);
        const durationMs = Date.now() - start;
        this.printReport('spec', id, report, durationMs, opts.json);
        process.exitCode = report.valid ? 0 : 1;
    }
    printReport(type, id, report, durationMs, json) {
        if (json) {
            const out = { items: [{ id, type, valid: report.valid, issues: report.issues, durationMs }], summary: { totals: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 }, byType: { [type]: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 } } }, version: '1.0' };
            console.log(JSON.stringify(out, null, 2));
            return;
        }
        if (report.valid) {
            console.log(`${type === 'change' ? 'Change' : 'Specification'} '${id}' is valid`);
            // rc06a (design D4): the scenario map's INFO lines print beneath a valid report — an INFO
            // level nobody sees would be a level in name only. A report with none prints as before.
            for (const issue of report.issues) {
                if (issue.path === 'scenario-map' && issue.level === 'INFO') {
                    console.log(`ℹ [INFO] ${issue.path}: ${issue.message}`);
                }
            }
            // rc09a (design D3): every `size` issue prints beneath a valid report too — a non-strict
            // run with an undeclared breach is valid, and its WARNING must not exist only in --json.
            for (const issue of report.issues) {
                if (issue.path === 'size') {
                    const prefix = issue.level === 'WARNING' ? '⚠' : 'ℹ';
                    console.log(`${prefix} [${issue.level}] ${issue.path}: ${issue.message}`);
                }
            }
        }
        else {
            console.error(`${type === 'change' ? 'Change' : 'Specification'} '${id}' has issues`);
            for (const issue of report.issues) {
                const label = issue.level === 'ERROR' ? 'ERROR' : issue.level;
                const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
                console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
            }
            this.printNextSteps(type);
        }
    }
    printNextSteps(type) {
        const bullets = [];
        if (type === 'change') {
            bullets.push('- Ensure change has deltas in specs/: use headers ## ADDED/MODIFIED/REMOVED/RENAMED Requirements');
            bullets.push('- Each requirement MUST include at least one #### Scenario: block');
            bullets.push('- Debug parsed deltas: orbit change show <id> --json --deltas-only');
        }
        else {
            bullets.push('- Ensure spec includes ## Purpose and ## Requirements sections');
            bullets.push('- Each requirement MUST include at least one #### Scenario: block');
            bullets.push('- Re-run with --json to see structured report');
        }
        console.error('Next steps:');
        bullets.forEach(b => console.error(`  ${b}`));
    }
    async runBulkValidation(scope, opts) {
        const spinner = !opts.json && !opts.noInteractive ? ora('Validating...').start() : undefined;
        // The source lint is project-scoped and read-only; it runs before the item queue so
        // that a `--sources`-only run (which enqueues nothing) still reports.
        const sourceLint = scope.sources ? runSourceLint(process.cwd()) : undefined;
        const sourcesActive = !!sourceLint?.registryPresent;
        const sourceSummary = sourcesActive ? summarizeSources(sourceLint) : undefined;
        // An empty file domain is REPORTED with its reason in both output modes — a run that
        // checked nothing must never read as a run that verified everything. It is a warning,
        // not a finding: the lint produces none and exits zero.
        if (sourcesActive && sourceLint.domainReason) {
            console.error(`Warning: the source lint checked no files — ${sourceLint.domainReason}`);
        }
        const [changeIds, specIds] = await Promise.all([
            scope.changes ? getActiveChangeIds() : Promise.resolve([]),
            scope.specs ? getSpecIds() : Promise.resolve([]),
        ]);
        const DEFAULT_CONCURRENCY = 6;
        const maxSuggestions = 5; // used by nearestMatches
        const concurrency = normalizeConcurrency(opts.concurrency) ?? normalizeConcurrency(process.env.OPENSPEC_CONCURRENCY) ?? DEFAULT_CONCURRENCY;
        const validator = new Validator(opts.strict);
        const queue = [];
        for (const id of changeIds) {
            queue.push(async () => {
                const start = Date.now();
                const changeDir = path.join(process.cwd(), 'orbit', 'changes', id);
                const report = await validator.validateChangeDeltaSpecs(changeDir);
                const durationMs = Date.now() - start;
                return { id, type: 'change', valid: report.valid, issues: report.issues, durationMs };
            });
        }
        for (const id of specIds) {
            queue.push(async () => {
                const start = Date.now();
                const file = path.join(process.cwd(), 'orbit', 'specs', id, 'spec.md');
                const report = await validator.validateSpec(file);
                const durationMs = Date.now() - start;
                return { id, type: 'spec', valid: report.valid, issues: report.issues, durationMs };
            });
        }
        if (queue.length === 0) {
            spinner?.stop();
            const summary = {
                totals: {
                    items: 0 + (sourceSummary?.items ?? 0),
                    passed: 0 + (sourceSummary?.passed ?? 0),
                    failed: 0 + (sourceSummary?.failed ?? 0),
                    ...(sourceSummary?.unverified ? { unverified: sourceSummary.unverified } : {}),
                },
                byType: {
                    ...(scope.changes ? { change: { items: 0, passed: 0, failed: 0 } } : {}),
                    ...(scope.specs ? { spec: { items: 0, passed: 0, failed: 0 } } : {}),
                    ...(sourceSummary ? { sources: sourceSummary } : {}),
                },
            };
            if (opts.json) {
                const out = {
                    items: [],
                    ...(sourcesActive ? sourceJson(sourceLint) : {}),
                    summary,
                    version: '1.0',
                };
                console.log(JSON.stringify(out, null, 2));
            }
            else if (!scope.changes && !scope.specs) {
                // A `--sources`-only run: never claim "no items", which would describe the wrong thing.
                if (!sourcesActive) {
                    console.log(`No source registry (${'orbit/sources.yaml'}); nothing to lint.`);
                }
                else {
                    printSourceLint(sourceLint);
                }
            }
            else {
                console.log('No items found to validate.');
                if (sourcesActive)
                    printSourceLint(sourceLint);
            }
            process.exitCode = (sourceSummary?.failed ?? 0) > 0 ? 1 : 0;
            return;
        }
        const results = [];
        let index = 0;
        let running = 0;
        let passed = 0;
        let failed = 0;
        await new Promise((resolve) => {
            const next = () => {
                while (running < concurrency && index < queue.length) {
                    const currentIndex = index++;
                    const task = queue[currentIndex];
                    running++;
                    if (spinner)
                        spinner.text = `Validating (${currentIndex + 1}/${queue.length})...`;
                    task()
                        .then(res => {
                        results.push(res);
                        if (res.valid)
                            passed++;
                        else
                            failed++;
                    })
                        .catch((error) => {
                        const message = error?.message || 'Unknown error';
                        const res = { id: getPlannedId(currentIndex, changeIds, specIds) ?? 'unknown', type: getPlannedType(currentIndex, changeIds, specIds) ?? 'change', valid: false, issues: [{ level: 'ERROR', path: 'file', message }], durationMs: 0 };
                        results.push(res);
                        failed++;
                    })
                        .finally(() => {
                        running--;
                        if (index >= queue.length && running === 0)
                            resolve();
                        else
                            next();
                    });
                }
            };
            next();
        });
        spinner?.stop();
        results.sort((a, b) => a.id.localeCompare(b.id));
        // ONE ITEM IS ONE DECLARED SOURCE. Source items do NOT enter `items[]`, which holds only
        // BulkItemResult records, so `summary.totals.items === items.length` no longer holds on a
        // registry-bearing run. That invariant is retired DELIBERATELY (design D5b) and tested.
        const summary = {
            totals: {
                items: results.length + (sourceSummary?.items ?? 0),
                passed: passed + (sourceSummary?.passed ?? 0),
                failed: failed + (sourceSummary?.failed ?? 0),
                ...(sourceSummary?.unverified ? { unverified: sourceSummary.unverified } : {}),
            },
            byType: {
                ...(scope.changes ? { change: summarizeType(results, 'change') } : {}),
                ...(scope.specs ? { spec: summarizeType(results, 'spec') } : {}),
                ...(sourceSummary ? { sources: sourceSummary } : {}),
            },
        };
        if (opts.json) {
            const out = {
                items: results,
                ...(sourcesActive ? sourceJson(sourceLint) : {}),
                summary,
                version: '1.0',
            };
            console.log(JSON.stringify(out, null, 2));
        }
        else {
            for (const res of results) {
                if (res.valid)
                    console.log(`✓ ${res.type}/${res.id}`);
                else
                    console.error(`✗ ${res.type}/${res.id}`);
            }
            if (sourcesActive)
                printSourceLint(sourceLint);
            const unverifiedClause = 'unverified' in summary.totals ? `, ${summary.totals.unverified} unverified` : '';
            console.log(`Totals: ${summary.totals.passed} passed, ${summary.totals.failed} failed${unverifiedClause} (${summary.totals.items} items)`);
        }
        process.exitCode = summary.totals.failed > 0 ? 1 : 0;
    }
}
/**
 * Rolls the source lint into the bulk validator's item accounting. ONE ITEM IS ONE DECLARED
 * SOURCE; `failed` is the sources carrying at least one attributable finding.
 *
 * Two finding kinds cannot be attributed to a declared source — a marker error is a fault of
 * a FILE, and an unknown-source marker names nothing declared — as is a registry read failure,
 * which resolves no source at all. Those roll up into ONE failed PSEUDO-ITEM, so the run can
 * never report zero failed items beside a non-zero exit.
 */
function summarizeSources(result) {
    const declared = new Set(result.coverage.map((c) => c.source));
    const failedSources = new Set();
    // A source that did not resolve carries a null coverage value and its own registry finding.
    for (const c of result.coverage)
        if (c.value === null)
            failedSources.add(c.source);
    let unattributable = false;
    for (const f of result.findings) {
        if (f.kind === 'mismatch' && declared.has(f.source)) {
            failedSources.add(f.source);
            continue;
        }
        if (f.kind === 'registry' && declared.size > 0)
            continue; // already attributed above
        unattributable = true;
    }
    const pseudo = unattributable ? 1 : 0;
    const items = declared.size + pseudo;
    const failed = failedSources.size + pseudo;
    // A source compared against NOTHING has not passed. When the file domain could not be
    // resolved at all, every source that still resolved is UNVERIFIED rather than passed —
    // otherwise the summary reports success for a check that never ran, and the verdict would
    // turn on whether git could answer rather than on whether the repository is correct. The
    // run still exits zero: the spec requires this path to produce no findings and never to
    // claim the project verified, and `passed` IS such a claim.
    // Completeness is READ, never inferred. Three earlier versions deduced it from whichever
    // finding kinds this function happened to inspect, and each one left a scope uncovered — a
    // partially-read domain, then a file abandoned mid-parse after a marker error. `scanComplete`
    // is cleared at every point the lint fails to fully examine a domain file, so there is one
    // place to be right instead of a list to keep widening.
    if (!result.scanComplete && declared.size > 0) {
        const unverified = declared.size - failedSources.size;
        return { items, passed: items - failed - unverified, failed, unverified };
    }
    return { items, passed: items - failed, failed };
}
/**
 * The three source keys a registry-bearing run adds to `--json`. All three are gated on a
 * present registry together, so the no-registry byte-identity promise is untouched.
 *
 * `source_domain` exists because stderr is out-of-band for the consumer `--json` serves: a run
 * that could not list any file was otherwise reporting `passed: 1, failed: 0` — a claim of
 * verification over a run that opened nothing. `files_scanned` counts files actually read.
 */
function sourceJson(result) {
    return {
        source_findings: result.findings,
        source_coverage: result.coverage,
        source_domain: {
            files_scanned: result.filesScanned,
            reason: result.domainReason,
            scan_complete: result.scanComplete,
        },
    };
}
function formatSourceFinding(f) {
    switch (f.kind) {
        case 'registry':
            return `✗ ${f.file}: ${f.detail}`;
        case 'domain':
            return `✗ ${f.file}: ${f.detail}`;
        case 'marker':
            return `✗ ${f.file}:${f.line}: ${f.detail}`;
        case 'unknown-source':
            return `✗ ${f.file}:${f.line}: unknown source '${f.source}' (not declared in orbit/sources.yaml)`;
        case 'mismatch':
            return `✗ ${f.file}:${f.line}: source '${f.source}' emits ${JSON.stringify(f.source_value)}, but the marked span reads ${JSON.stringify(f.span_text)}`;
    }
}
/** Findings first, then the coverage section — which counts and judges nothing. */
function printSourceLint(result) {
    for (const f of result.findings)
        console.error(formatSourceFinding(f));
    if (result.coverage.length > 0) {
        console.log('Sources:');
        for (const c of result.coverage) {
            const value = c.value === null ? '<unresolved>' : c.value;
            console.log(`  ${c.source} = ${value} (${c.markers} marker${c.markers === 1 ? '' : 's'})`);
        }
    }
}
function summarizeType(results, type) {
    const filtered = results.filter(r => r.type === type);
    const items = filtered.length;
    const passed = filtered.filter(r => r.valid).length;
    const failed = items - passed;
    return { items, passed, failed };
}
function normalizeConcurrency(value) {
    if (!value)
        return undefined;
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n <= 0)
        return undefined;
    return n;
}
function getPlannedId(index, changeIds, specIds) {
    const totalChanges = changeIds.length;
    if (index < totalChanges)
        return changeIds[index];
    const specIndex = index - totalChanges;
    return specIds[specIndex];
}
function getPlannedType(index, changeIds, specIds) {
    const totalChanges = changeIds.length;
    if (index < totalChanges)
        return 'change';
    const specIndex = index - totalChanges;
    if (specIndex >= 0 && specIndex < specIds.length)
        return 'spec';
    return undefined;
}
//# sourceMappingURL=validate.js.map