# External Review: d6-pr-lifecycle (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-08-25

## CRITICAL

### The implementation task re-ties arc-done surfacing to the ratification seam the normative spec explicitly removed
**File**: orbit/changes/d6-pr-lifecycle/tasks.md:137
**Description**: Task 5.2 instructs `architect.ts` to surface the program PR "at completion ratification," and design.md repeats that seam at lines 81-87 and 179-180. The normative `Program PR (Shape A) semantics` requirement instead says ANY architect invocation observing arc-done must surface it, specifically because the valid ordering final archive → final-stage ratification → closing review makes arc-done true after the last ratification interaction has already passed. Implementing the task/design text therefore recreates the previously identified no-observer failure despite task 6.2f promising to test both orderings. Rewrite task 5.2 and both design references as an unconditional, idempotent check on every architect invocation, and make the two-ordering harness assert the readout appears when closing review is last.

### A stored attachment URL bypasses all live PR identity validation
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:31
**Description**: The four-axis open-PR query runs only when `pr_attachment` is absent or has no `url`; a present URL is accepted without checking repository, head, base, or open state. That contradicts lines 46-47 and 88-89, which say manually closing the PR makes discovery find nothing and skip: every normally opened PR has a stored URL, so the closed-PR case bypasses the query and the tail can rewrite a closed or retargeted PR before `gh pr ready` fails. Validate stored URLs live with the same repository/head/base/open predicates before any commit or PR edit; treat closed, merged, retargeted, and mismatched records as distinct skips, and add stored-URL cases to the harness rather than testing those outcomes only through fallback discovery.

### The archive emit is scheduled before the discovery needed to author its PR fields
**File**: orbit/changes/d6-pr-lifecycle/tasks.md:78
**Description**: Group 4 defines the tail as beginning after the archive emit, and task 4.2 places attachment/PR discovery inside that tail, but task 4.4 requires the earlier emit to contain the PR URL and state "as observed at emit time." The frozen propose/ff record cannot supply current state, and the emit delta compounds the contradiction by declaring an observed `"ready"` value false solely because this tail has not flipped it—even though the user or an adopted program PR may already have changed live state. Add an explicit read-only pre-emit preflight that resolves and validates the attachment, URL, and current draft/ready state; feed that observation to the emit and the post-emit tail, define idempotent behavior for an already-READY PR, and test both draft and already-ready inputs.

### Program-branch compatibility rejects a normal advance of the default branch
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-propose-modifications/spec.md:124
**Description**: A program branch is called compatible only when it "descends from the resolved default branch," which ordinarily means the current default tip is its ancestor; two sentences later, only an entirely unrelated root is called a collision. Those predicates diverge as soon as `main` advances after the long-lived program branch was created: the branches still share the intended history, but the current `main` tip is not an ancestor of the program branch. A fresh implementation can either reject healthy program work or silently weaken the stated predicate. Define the precise graph test and the supported base-ahead policy (continue with detection, or skip for explicit manual integration—never automatic merge/rebase), and add a harness case that advances the default branch between two citing stages.

## WARNING

### The authoritative attachment object is exempted from structural write-gate validation
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-run-summary-emit/spec.md:28
**Description**: The requirement defines required keys, enums, and a conditional `doc`, then says the engine "neither computes nor verifies" the object; task 2.1 reinforces this with "carried verbatim." External truth cannot be engine-verified, but the object’s syntax can: otherwise `{granularty: ...}`, a missing branch, an invalid state, or `granularity: per-architecture` without `doc` passes the supposedly fail-loud emit seam and becomes the authoritative record later bodies dereference. Require structural validation of exact nested keys, string types, enums, and the conditional `doc` rule (plus the flat archive field types), while leaving branch/PR existence body-owned; add malformed-object rejection tests.

### The archive-summary rule still makes live `pr: never` override the frozen attachment
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:241
**Description**: The tail requirement now says attachment authority wins when config changes mid-flight, and task 6.2a explicitly archives an attached change after `pr: never`; this summary scenario nevertheless says `pr_url` and `pr_state` are absent "when `pr: never`." The same invocation is therefore required to run the PR tail while omitting its PR record. Replace that clause with "absent for unattached changes, including changes originally proposed under `pr: never`," and assert the config-flipped harness records the fields from the frozen attachment.

### Removing `gh` after propose has two incompatible degradation outcomes
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:19
**Description**: The config contract and design goal say no `gh` degrades to `never`/today’s behavior for the invocation, while the attachment-authority rule says an attached archive runs its tail and treats a later `gh` error as a mid-tail failure. If `gh` existed at propose but is absent at archive, one implementation skips before staging and another commits/pushes before failing at description rewrite; only the first is "today’s behavior." Define availability precedence explicitly—preferably a pre-tail `gh` check that skips the whole tail before staging if the capability is unavailable, or narrow the global degradation claim—and add the missing-gh-at-archive-after-successful-propose case to task 6.2b.

### The resolved remote is not actually bound to several `gh` commands
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:106
**Description**: The shared rule warns that `gh`’s implicit repository can disagree with the selected remote, then specifies `gh repo view --json defaultBranchRef` without `--repo`; the manual recovery command likewise omits repository selection, and the arc-done commands use only a PR number. In a fork or a single non-`origin` remote checkout, those commands can resolve a different repository from the one chosen by the algorithm. Define how the resolved remote URL becomes a canonical GitHub repository identifier and use it (or the full PR URL) on every `gh repo/pr list/create/view/edit/ready/merge` command, including recovery/readout text; test the exact invocations, not only the selected remote name.

### A newer URL-less program attachment can hide the valid program PR forever
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:184
**Description**: The architect lookup takes the most recent matching `pr_attachment`, but `url` is deliberately optional after query or PR-creation failure. A later citing change can therefore emit a newer `{branch, granularity, doc}` record without a URL and mask an older valid URL for the same program; arc-done then has nothing to surface even though the program PR exists. Select the most recent matching URL-bearing record, then validate it live (or use the constrained query as fallback), and add a two-stage harness where the second attachment is URL-less.

### A remote-only existing program branch has no specified reuse path
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-propose-modifications/spec.md:117
**Description**: "Existing branch" is never defined as local, remote, or either. In a fresh checkout where `<resolved-remote>/<program-branch>` exists but no local branch does, "create off default if absent" can create a conflicting local history and reach only a rejected push; the remote-ahead rule is phrased as running before reuse of an already-existing branch and does not say to create a tracking branch. Require the fetch/remote-ref check before deciding absence, define creation of a local tracking branch from the resolved remote when only the remote ref exists, and add that ordinary resume case to the branch harness.

### The prescribed recovery command cannot recover a locally absent attachment branch
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:20
**Description**: The requirement deliberately groups HEAD mismatch with "the named branch does not exist locally" but prescribes the same literal `git switch <branch>` recovery for both. That command cannot switch to a nonexistent local branch, and after the archive move the dirty working tree may also prevent a normal switch. Give the two cases distinct recovery text: an existing-local mismatch may suggest switching subject to preserving the archive writes, while a remote-only branch needs the resolved-remote fetch/tracking command and a branch absent everywhere needs an honest manual-recovery note. Exercise the printed recovery for each harness case rather than asserting only that a note exists.

### The archive commit scope forbids directory prefixes and then names one as the staged unit
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:57
**Description**: The normative scope is an "ENUMERATED FILE LIST, never a directory prefix," but line 61 names the exact moved `orbit/changes/archive/<date>-<name>/` directory. Staging that path is still a directory-prefix sweep and can include an unrelated untracked file that happened to live inside the change directory; the current harness covers unrelated dirt only under `orbit/specs/`. Specify how the move’s tracked renames and known new archive/emit files are enumerated, define what happens to unrelated untracked content inside the moved tree, and add that case to the commit-scope harness.

## SUGGESTION

### The non-scalar config test has no specified expected behavior
**File**: orbit/changes/d6-pr-lifecycle/tasks.md:12
**Description**: Task 1.1 requests a non-scalar-shape unit test, but the requirement defines only valid scalars and unrecognized scalar values; it never says whether a YAML map/list is an inert warned `never` or a validation error. State the expected outcome explicitly—consistent with "config garnish, never an error," treating it as `never` with a warning naming the invalid shape would be the least surprising—and mirror that case in the integration harness.

### Architecture filename stems are not guaranteed to be valid Git branch names
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:51
**Description**: Program branch identity is the architecture document’s filename stem, while the architecture capability requires kebab-case stage IDs but does not impose a Git-ref grammar on document names. A contained, citable filename can still be rejected by Git (for example a stem ending in `.lock`), and D6 currently checks only collision with the default branch. Add `git check-ref-format --branch` as a precondition with a one-line degradation note (or define a deterministic reversible encoding), and test an architecture doc identity that is valid on disk but invalid as a branch.

## Notes

Strict change validation passes, every baseline fingerprint verifies, and no inline `@review:` residue is present. The remaining pattern is authority split across three moments: the attachment freezes regime and branch at propose, GitHub remains live and mutable between seams, and the implementation tasks sometimes schedule observation after the record that needs it or narrow a broadly specified observer back to one interaction. I walked both arc-done orderings, config and tool availability changes, default-branch advancement, fresh-checkout program reuse, closed/retargeted/already-ready PRs, and later URL-less attachment records. The specification is strongest on fallback-query ambiguity and unrelated-path safety; the gaps are where those protections do not apply to the primary stored-record path.
