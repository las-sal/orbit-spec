/**
 * `orbit pr program <doc>` — the architect arc-done readout's PR facts, computed
 * (rc12-engine-owned-choreography; `orbit-pr-lifecycle`'s `\`orbit pr program\` computes the
 * architect readout's PR facts`, over `Program PR (Shape A) semantics`).
 *
 * It NEVER skips: the readout is never suppressed. It reads the latest URL-BEARING
 * per-architecture record naming the doc on any trail (never merely the latest record),
 * validates it live, and — on a positive invalidation or no URL-bearing record — FALLS THROUGH
 * to the four-axis query, the opposite of the archive tail's rule, because this seam only
 * reports. A failed observation surfaces the record's PR with state `unverified`.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { allChangeDirs, attachmentsOnTrail } from './inputs.js';
import { validatePrUrl } from './preflight.js';
import { fourAxisQuery } from './publish.js';
import { offRecord, PrUsageError } from './record.js';
import { repoOfPrUrl, resolve } from './resolve.js';
import { PrRunner } from './run.js';
const DOC_STEM = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
export function prProgram(ctx, doc) {
    if (!DOC_STEM.test(doc) || doc.includes('..')) {
        throw new PrUsageError(`'${doc}' is not an architecture doc filename stem`);
    }
    if (!fs.existsSync(path.join(ctx.projectRoot, 'orbit', 'architecture', `${doc}.md`))) {
        throw new PrUsageError(`no architecture doc '${doc}' (expected orbit/architecture/${doc}.md)`);
    }
    const records = allChangeDirs(ctx.projectRoot)
        .flatMap((d) => attachmentsOnTrail(ctx.projectRoot, path.join(d, '.orbit-runs')))
        .filter((r) => r.attachment.granularity === 'per-architecture' && r.attachment.doc === doc)
        .sort((x, y) => (x.token < y.token ? -1 : x.token > y.token ? 1 : x.emit.localeCompare(y.emit)));
    if (records.length === 0)
        return offRecord('program');
    const withUrl = records.filter((r) => r.attachment.url !== undefined);
    const located = withUrl.length > 0 ? withUrl[withUrl.length - 1] : null;
    const latest = records[records.length - 1];
    const branch = (located ?? latest).attachment.branch;
    const recordedUrl = located?.attachment.url ?? null;
    const observations = {
        doc,
        branch,
        record: located ? { url: recordedUrl, emit: located.emit } : null,
        invalidated: null,
        invalidated_detail: null,
        pr: null,
        outcome: null,
        candidates: [],
    };
    const finish = (outcome, pr, repo) => {
        observations.outcome = outcome;
        observations.pr = pr;
        const human_acts = [];
        const qualify = repo ?? (pr ? repoOfPrUrl(pr.url) : null);
        if (pr && qualify) {
            if (pr.state !== 'ready')
                human_acts.push({ act: 'ready', argv: ['gh', 'pr', 'ready', '--repo', qualify, pr.url] });
            human_acts.push({ act: 'merge', argv: ['gh', 'pr', 'merge', '--repo', qualify, pr.url] });
        }
        return { subcommand: 'program', action: 'proceed', reason: null, degraded: null, observations, segments: [], human_acts };
    };
    const unverified = (outcome, repo) => finish(outcome, recordedUrl ? { url: recordedUrl, state: 'unverified' } : null, repo);
    const run = new PrRunner(ctx);
    const res = resolve(run);
    observations.resolution = res.resolution;
    if (res.failure) {
        if (res.failure.code === 'gh-absent')
            return unverified('gh-absent', res.resolution.repo);
        observations.resolution_failure = { code: res.failure.code, detail: res.failure.detail };
        return unverified('unobserved', res.resolution.repo);
    }
    const { repo, defaultBranch } = res.resolved;
    if (recordedUrl !== null) {
        const v = validatePrUrl(run, repo, recordedUrl, branch, defaultBranch);
        if (v.outcome === 'valid')
            return finish('valid', { url: recordedUrl, state: v.state }, repo);
        if (v.outcome === 'unobserved') {
            observations.query_error = v.stderr ?? null;
            return unverified('unobserved', repo);
        }
        observations.invalidated = v.outcome;
        observations.invalidated_detail = v.detail ?? null;
    }
    // Fall-through (or no URL-bearing record): the four-axis query, every outcome reported.
    const q = fourAxisQuery(run, repo, branch, defaultBranch);
    if (!q.ok) {
        observations.query_error = q.stderr;
        return unverified('unobserved', repo);
    }
    if (q.survivors.length === 1) {
        const s = q.survivors[0];
        return finish('discovered', { url: s.url, state: s.isDraft ? 'draft' : 'ready' }, repo);
    }
    if (q.survivors.length > 1) {
        observations.candidates = q.survivors.map((s) => ({ url: s.url, state: s.isDraft ? 'draft' : 'ready' }));
        return finish('several', null, repo);
    }
    // Zero: the recorded PR's invalidation reason when there was one (no open replacement exists),
    // else `none`.
    return finish(observations.invalidated ?? 'none', null, repo);
}
//# sourceMappingURL=program.js.map