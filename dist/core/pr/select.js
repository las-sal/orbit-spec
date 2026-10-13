/**
 * `orbit pr select <name>` — propose and ff Phase 1, computed (rc12-engine-owned-choreography;
 * `orbit-pr-lifecycle`'s `\`orbit pr select\` computes propose's branch selection`).
 *
 * Promoted from D6's executable transcription (`phase1.ts`) with the switch PRINTED rather than
 * run. The preconditions are `orbit-propose-modifications`' `Branch preconditions at propose`,
 * in that requirement's order; each skip gives its own reason code. It needs no change
 * directory: an exploration's presence decides consume mode and supplies the citation.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateChangeName } from '../../utils/change-utils.js';
import { readCitation, readRegime, selectTarget } from './inputs.js';
import { offRecord, PrUsageError, skipRecord } from './record.js';
import { resolve } from './resolve.js';
import { PrRunner } from './run.js';
export function prSelect(ctx, name) {
    const valid = validateChangeName(name);
    if (!valid.valid)
        throw new PrUsageError(`'${name}' is not a valid change name: ${valid.error}`);
    // The gate: config FIRST, availability SECOND. `never` probes nothing.
    const regime = readRegime(ctx.projectRoot);
    if (regime === 'never')
        return offRecord('select');
    // The inputs table (D-rc12-10).
    const stagingRel = path.posix.join('orbit', 'explore', name);
    const changeRel = path.posix.join('orbit', 'changes', name);
    let consumeMode = false;
    let citation = null;
    let citationFrom = null;
    if (isDir(path.join(ctx.projectRoot, stagingRel))) {
        consumeMode = true;
        citation = readCitation(path.join(ctx.projectRoot, stagingRel));
        citationFrom = stagingRel;
    }
    else if (isDir(path.join(ctx.projectRoot, changeRel))) {
        citation = readCitation(path.join(ctx.projectRoot, changeRel));
        citationFrom = changeRel;
    }
    const target = selectTarget(regime, citation);
    const program = target.granularity === 'per-architecture';
    const branch = target.doc ?? name;
    const granularity = target.granularity;
    const run = new PrRunner(ctx);
    const res = resolve(run);
    const observations = {
        resolution: res.resolution,
        name,
        regime,
        consume_mode: consumeMode,
        staging_dir: consumeMode ? stagingRel : null,
        citation,
        citation_from: citationFrom,
        branch,
        granularity,
    };
    if (res.failure)
        return skipRecord('select', res.failure.code, res.failure.detail, observations);
    const { remote, defaultBranch } = res.resolved;
    // 1. Branch name validity — a name git rejects is skipped, never transformed.
    if (run.git('check-ref-format', '--branch', branch).status !== 0) {
        return skipRecord('select', 'invalid-branch-name', { branch }, observations);
    }
    // 2. Default-branch collision.
    if (branch === defaultBranch) {
        return skipRecord('select', 'default-collision', { branch, default_branch: defaultBranch }, observations);
    }
    // 3. Dirty tree: tracked modifications skip; untracked paths are named, never a skip.
    const status = run.git('status', '--porcelain', '-z', '--untracked-files=all');
    const entries = parsePorcelainZ(status.stdout);
    const trackedDirty = entries.filter((e) => e.xy !== '??').map((e) => e.path);
    const untracked = entries.filter((e) => e.xy === '??').map((e) => e.path);
    observations.untracked = untracked;
    if (trackedDirty.length > 0) {
        return skipRecord('select', 'dirty-tree', { paths: trackedDirty }, observations);
    }
    // 4. Existence — remote OR local, through the bounded fetch.
    const onRemote = run.boundedFetch([defaultBranch, branch]);
    if (onRemote === null)
        return skipRecord('select', 'fetch-failed', { remote }, observations);
    if (!onRemote.has(defaultBranch)) {
        return skipRecord('select', 'no-default-branch', { remote, default_branch: defaultBranch, on_remote: false }, observations);
    }
    const remoteDefault = `${remote}/${defaultBranch}`;
    const remoteBranch = `${remote}/${branch}`;
    const localExists = run.git('rev-parse', '--verify', '-q', `refs/heads/${branch}`).status === 0;
    const remoteExists = onRemote.has(branch);
    let state;
    if (localExists && remoteExists) {
        // 6. Remote-ahead, resolved FIRST: the effective tip every later check runs against.
        const localBehindOrEqual = run.git('merge-base', '--is-ancestor', `refs/heads/${branch}`, remoteBranch).status === 0;
        const remoteBehindOrEqual = run.git('merge-base', '--is-ancestor', remoteBranch, `refs/heads/${branch}`).status === 0;
        if (localBehindOrEqual && !remoteBehindOrEqual)
            state = 'fast-forward';
        else if (!localBehindOrEqual && !remoteBehindOrEqual) {
            return skipRecord('select', 'diverged', { branch, remote_ref: remoteBranch }, observations);
        }
        else
            state = 'local';
    }
    else if (localExists)
        state = 'local';
    else if (remoteExists)
        state = 'remote-only';
    else
        state = 'absent';
    const effective = state === 'fast-forward' || state === 'remote-only' ? remoteBranch : state === 'local' ? `refs/heads/${branch}` : remoteDefault;
    // 5. Compatibility, per path, against the EFFECTIVE tip.
    if (state !== 'absent') {
        if (program) {
            const mb = run.git('merge-base', effective, remoteDefault);
            if (mb.status !== 0) {
                return skipRecord('select', 'collision', { branch, kind: 'unrelated-root' }, observations);
            }
            const mergeBase = mb.stdout.trim();
            const tip = run.git('rev-parse', remoteDefault).stdout.trim();
            observations.ahead_by =
                mergeBase === tip ? 0 : Number(run.git('rev-list', '--count', `${mergeBase}..${remoteDefault}`).stdout.trim());
        }
        else {
            const diff = run.git('diff', '--name-only', `${remoteDefault}...${effective}`);
            if (diff.status !== 0) {
                // A failed observation is a skip, never an empty compatible diff.
                return skipRecord('select', 'collision', { branch, kind: 'no-merge-base' }, observations);
            }
            const own = (p) => p.startsWith(`orbit/changes/${name}/`) || p.startsWith(`orbit/explore/${name}/`);
            const foreign = diff.stdout.split('\n').filter(Boolean).filter((p) => !own(p));
            if (foreign.length > 0) {
                return skipRecord('select', 'collision', { branch, kind: 'foreign-path', path: foreign[0] }, observations);
            }
        }
    }
    else if (program) {
        observations.ahead_by = 0;
    }
    // Generation-input precondition, against EVERY tree transition the printed steps perform.
    if (consumeMode) {
        const targets = state === 'fast-forward' ? [`refs/heads/${branch}`, remoteBranch] : [effective];
        if (run.git('ls-files', '--error-unmatch', '--', stagingRel).status === 0) {
            for (const target of targets) {
                if (run.git('diff', '--quiet', 'HEAD', target, '--', stagingRel).status !== 0) {
                    return skipRecord('select', 'generation-input', { staging_dir: stagingRel, target }, observations);
                }
            }
        }
    }
    observations.branch_state = state;
    const steps = {
        absent: [{ step: 'create', argv: ['git', 'switch', '-c', branch, '--no-track', remoteDefault] }],
        local: [{ step: 'switch', argv: ['git', 'switch', branch] }],
        'remote-only': [{ step: 'create-tracking', argv: ['git', 'switch', '-c', branch, '--track', remoteBranch] }],
        'fast-forward': [
            { step: 'switch', argv: ['git', 'switch', branch] },
            { step: 'fast-forward', argv: ['git', 'merge', '--ff-only', remoteBranch] },
        ],
    }[state];
    return {
        subcommand: 'select',
        action: 'proceed',
        reason: null,
        degraded: null,
        observations,
        segments: [{ inputs: [], steps }],
        human_acts: [],
    };
}
/** `git status --porcelain -z` entries; a rename or copy carries its source. */
export function parsePorcelainZ(out) {
    const parts = out.split('\0');
    const entries = [];
    for (let i = 0; i < parts.length; i++) {
        const rec = parts[i];
        if (rec.length < 4)
            continue;
        const xy = rec.slice(0, 2);
        const p = rec.slice(3);
        if (xy[0] === 'R' || xy[0] === 'C') {
            entries.push({ xy, path: p, from: parts[i + 1] });
            i += 1;
        }
        else {
            entries.push({ xy, path: p });
        }
    }
    return entries;
}
function isDir(p) {
    try {
        return fs.statSync(p).isDirectory();
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=select.js.map