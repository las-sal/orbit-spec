/** `<owner>/<repo>` from a GitHub URL, HTTPS or SSH form; null for anything else — never a guess. */
export function canonicalRepoId(url) {
    const https = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
    if (https)
        return `${https[1]}/${https[2]}`;
    const ssh = url.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (ssh)
        return `${ssh[1]}/${ssh[2]}`;
    return null;
}
/** `<owner>/<repo>` from a pull request URL, or null. */
export function repoOfPrUrl(url) {
    const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/\d+\/?$/);
    return m ? `${m[1]}/${m[2]}` : null;
}
/**
 * Resolve the remote and canonical id, then (unless `withDefault` is false) `gh` availability and
 * the default branch. Sets `run.remote` once a remote is chosen, so the bounded fetch can name it.
 */
export function resolve(run, opts = {}) {
    const withDefault = opts.withDefault ?? true;
    const gh = run.ghAvailable() ? 'present' : 'absent';
    const resolution = { remote: null, repo: null, default_branch: null, gh };
    const fail = (failure) => ({ resolution, resolved: null, failure });
    const remotes = run
        .git('remote')
        .stdout.split('\n')
        .map((r) => r.trim())
        .filter(Boolean);
    let remote;
    if (remotes.length === 0)
        return fail({ code: 'no-remote', detail: {} });
    if (remotes.length === 1)
        remote = remotes[0];
    else if (remotes.includes('origin'))
        remote = 'origin';
    else
        return fail({ code: 'several-remotes', detail: { candidates: remotes } });
    resolution.remote = remote;
    run.remote = remote;
    // The CONFIGURED url: `remote get-url` expands `url.<base>.insteadOf` rewrites and would
    // return the rewritten target rather than the repository the checkout names.
    const url = run.git('config', '--get', `remote.${remote}.url`).stdout.trim();
    const repo = canonicalRepoId(url);
    if (!repo)
        return fail({ code: 'unparseable-url', detail: { remote, url } });
    resolution.repo = repo;
    if (gh === 'absent')
        return fail({ code: 'gh-absent', detail: {} });
    if (!withDefault)
        return { resolution, resolved: { remote, repo, defaultBranch: '' }, failure: null };
    let defaultBranch = null;
    const view = run.gh('repo', 'view', repo, '--json', 'defaultBranchRef');
    if (view.status === 0) {
        try {
            defaultBranch =
                JSON.parse(view.stdout).defaultBranchRef?.name ?? null;
        }
        catch {
            defaultBranch = null;
        }
    }
    if (!defaultBranch) {
        const sym = run.git('symbolic-ref', `refs/remotes/${remote}/HEAD`);
        if (sym.status === 0) {
            const ref = sym.stdout.trim();
            const prefix = `refs/remotes/${remote}/`;
            defaultBranch = ref.startsWith(prefix) ? ref.slice(prefix.length) : null;
        }
    }
    if (!defaultBranch)
        return fail({ code: 'no-default-branch', detail: { remote, repo } });
    resolution.default_branch = defaultBranch;
    return { resolution, resolved: { remote, repo, defaultBranch }, failure: null };
}
//# sourceMappingURL=resolve.js.map