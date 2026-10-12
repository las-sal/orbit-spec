# External Review: rc12-engine-owned-choreography (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### Publish mishandles staged deletions and renames within the change
**File**: src/core/pr/publish.ts:89
**Description**: Already-staged deletions are excluded from `git add` only for the exploration directory. A file removed with `git rm orbit/changes/<change>/old.md` enters the change scope but also enters the printed `git add`, which fails because the path is absent from both index and worktree. A staged rename within the change adds only its destination to the scope; its source deletion is omitted from the isolated commit, leaving the old file in the committed tree. Include in-scope rename sources in the commit scope, and exclude all already-staged deletions from the staging step, regardless of which owned directory contains them.

### Tail loses pre-move deletions already staged in the index
**File**: src/core/pr/tail.ts:129
**Description**: The tail discovers old change paths exclusively through `git ls-files`, which reads the current index. If the filesystem move's deletions have already been staged, those paths no longer appear there. The printed `commit --only` then includes the archive destination without the old-path deletions, preserving the active change in the pushed tree and leaving its removal staged locally. This contradicts the archived archive-tail requirement that the pushed commit remove the original tree. Derive the deletion scope from HEAD and porcelain deletion/rename entries as well as the index; keep already-staged deletions out of the printed `git add`.

### The read-only allowlist and its instrument both admit ref deletion
**File**: src/core/pr/run.ts:59
**Description**: Counting non-option arguments does not establish that `symbolic-ref` is read-only. `git symbolic-ref --delete refs/remotes/origin/HEAD` has one such argument and is accepted. The independent instrument repeats the same predicate, so it also approves this write. A read-only runtime probe confirmed that both `gitAllowed` and `allowedGit` return `true` for these arguments. Existing seam implementations do not currently request this operation, but the claimed refusal boundary and consent instrument cannot detect it. Restrict `symbolic-ref` to explicit read forms and add an injected deletion case that both guards must reject.

### Preflight discards facts needed for the required degradation note
**File**: src/core/pr/preflight.ts:64
**Description**: URL validation returns only `retargeted`, `head-mismatch`, or `repository-mismatch`, discarding the observed base, head, and repository. Preflight consequently emits an empty `reason.detail` for these outcomes. The archived archive-tail requirement explicitly requires a note naming `retargeted to <base>`, while this change assigns note authorship to the body using the record's facts. The body cannot produce that note without inventing the base or observing the PR again. Preserve observed and expected predicate values in the validation result and expose them in preflight's observations or reason detail.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The observation-and-print boundary is a reasonable direction, but the printed commit scopes need to preserve staged removals and rename sources. The allowlist also needs to reject ref deletion independently of today's callers. Resolve these issues before relying on the command group for workflow adoption.

## Notes

All tasks are marked complete. I inspected the change artifacts, touched implementation, CLI registration and completion entries, execution instrument, and relevant archived owner requirements. The commit-range whitespace check passed.

Scenario coverage verification and strict validation were not run successfully: both CLI invocations failed because `dist/cli/index.js` is absent. This read-only checkout also lacks installed dependencies, so I could not build or execute the suite. I did not infer scenario coverage from test-file searches.

The optional project file, root convention files, and perspective and critical-path lens files are absent. I traced propose/ff selection and publication, attached archive preflight and tail, and program readout through the available implementation and owner specifications. The findings concern staged-index handling, enforcement of the write boundary, and preservation of observation facts.

---

I could **not** write the findings file or commit/push it because this environment is read-only. The complete markdown above is the review for manual saving and committing.