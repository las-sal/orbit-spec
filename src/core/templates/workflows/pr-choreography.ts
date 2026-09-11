/**
 * D-arc Stage D6 — the PR lifecycle choreography, defined ONCE and consumed by every seam.
 *
 * Why this module exists: `orbit-pr-lifecycle`'s `Remote and default-branch resolution`
 * requirement is explicit that BOTH PR seams resolve the remote and default branch by ONE
 * shared algorithm, "never by implementer choice and never per-seam" — a seam that resolved
 * them differently would defeat the very constraint the other seam relies on. Defining the
 * text here and interpolating it into each reference keeps that single-definition property
 * at the SOURCE level: propose, ff, and the archive tail cannot drift apart because there is
 * only one copy to edit.
 *
 * These consts are body prose (instructions to the AI), not engine logic. Per
 * `orbit-pr-lifecycle`'s zero-engine-git requirement the engine NEVER shells to git or `gh`;
 * every command below is a workflow-body step the AI performs.
 */

/** Shared by every seam: remote + default-branch resolution, and `gh` repo qualification. */
export const PR_RESOLUTION_SECTION = `## Remote and default-branch resolution (SHARED — both seams)

Resolve these FIRST, before any other PR work. Both seams use this one algorithm so they can
never disagree about which repository owns the PR or which branch it targets.

**Remote.** Enumerate remotes:

- Exactly one → use it, whatever its name (\`origin\` is a convention, not a requirement).
- Several → prefer \`origin\` when present; otherwise SKIP the PR work with a one-line note
  naming the ambiguity and the candidates. Orbit never guesses which remote owns the PR.
- Zero → the degraded path (behave as \`never\` for this invocation, one note).

**Canonical repository identifier.** Derive \`<owner>/<repo>\` from the resolved remote's URL
(both \`https://github.com/<owner>/<repo>.git\` and \`git@github.com:<owner>/<repo>.git\` forms).
A URL that does not parse as a GitHub repository is a DEGRADATION SKIP with a one-line note —
never a guess.

**Qualify EVERY \`gh\` invocation with the resolved repository, in the grammar each command
actually accepts.** The \`gh pr\` verbs — \`pr list\`, \`pr create\`, \`pr view\`, \`pr edit\`,
\`pr ready\`, and any \`pr merge\` text you surface — take \`--repo <owner>/<repo>\`.
\`gh repo view\` takes the repository POSITIONALLY (\`gh repo view <owner>/<repo>\`) and has NO
\`--repo\` flag: the real CLI rejects it with \`unknown flag: --repo\` (a mistake five review
passes carried because a stub accepted it — the stub now rejects it too). \`gh\` otherwise
picks a repository by its own heuristics, which in a fork or multi-remote checkout can differ
from the one this algorithm chose — defeating the point of resolving a remote at all. A bare
PR NUMBER is likewise repository-relative: never put one in copyable text without \`--repo\`,
or address the PR by full URL.

**\`gh\` availability — checked FIRST, before any branch work.** \`command -v gh\` (or an
equivalent PATH lookup): when \`gh\` is ABSENT, this invocation takes the degraded path (behave
as \`never\`, one note) and NO branch is created, switched, or fast-forwarded. A missing
executable is a different fact from an installed CLI whose query fails, and the two must
never collapse into one null result.

**Default branch.** \`gh repo view <owner>/<repo> --json defaultBranchRef\` — \`gh\` is present
by now — falling back to \`git symbolic-ref refs/remotes/<resolved-remote>/HEAD\` ONLY for an
INSTALLED \`gh\` whose query fails (auth, network, rate limit) (note: a
checkout built by \`git init\` + \`remote add\` + \`fetch\` has NO remote HEAD ref — only a clone
sets it — so the fallback is not a rescue for healthy GitHub access; the \`gh\` form must be
right). When
neither resolves, SKIP with a one-line note naming the failure — the PR layer degrades, the
lifecycle never blocks. At the ARCHIVE seam an unresolvable remote or base is a DEGRADATION
SKIP, never a zero-result: report that resolution failed, never that the PR is missing.`;

/**
 * The config-order gate (config FIRST, availability SECOND). Interpolated ONLY by the
 * propose/ff reference — the attaching seams. NOT by the archive reference (the tail is
 * gated by the ATTACHMENT, never by live config: `pr: never` stops new attachments and never
 * abandons an open PR) and NOT by the architect reference (same rule for the arc-done
 * readout). The 2026-09-10 confirm pass caught the architect reuse; external iter 3 caught
 * the archive one.
 */
export const PR_CONFIG_ORDER_SECTION = `## Config resolution order (config FIRST, availability SECOND)

Read the RESOLVED regime from the engine — \`orbit status --json\`, field \`pr\` — NOT by
parsing \`orbit/config.yaml\` yourself. The value set is CLOSED (\`never\` /
\`per-proposal\` / \`per-architecture\`) and every failure path is inert, so resolution is a
computed fact with one right answer: the engine's reader returns \`never\` for an absent key,
an unrecognized value, or a non-scalar shape, and emits the one-line warning naming the
offending value or shape as it does. A body that read the YAML directly would re-derive that
in prose — quietly accepting a typo the reader rejects, and never emitting the warning the
requirement promises.

- **\`never\`** (which is also what absent and every inert path resolve to) → RETURN
  IMMEDIATELY. Probe nothing (no remote enumeration, no \`gh\`) and emit NO note of your own.
  \`never\`'s promise is silence; a degradation note about tooling the user disabled would
  break byte-identity with pre-capability behavior. (Any config warning already came from the
  reader; do not restate it.)
- **\`per-proposal\` or \`per-architecture\`** → only now run availability resolution above. No
  remote or no \`gh\` degrades to \`never\` behavior for this invocation, reported once in one
  line.`;

/** Propose + ff: the three-phase choreography. */
export const PR_PROPOSE_SECTION = `## The three ordered phases (propose and ff)

The order is NORMATIVE — a simpler one cannot execute.

### Phase 1 — branch selection and switch (LOCAL ONLY, before any artifact is generated)

No network writes happen here. But note that \`git switch\` is **not** a HEAD move alone: it
also rewrites every TRACKED path that differs between HEAD and the target commit. Phase 1
therefore changes worktree content and must be guarded.

**Generation-input precondition — checked BEFORE the switch, on BOTH paths (reusing an
existing branch, or creating one off \`<remote>/<default>\`).** The check keys on TRACKED
state, never on worktree presence: when a consume-mode staging directory
\`orbit/explore/<change-name>/\` is TRACKED in HEAD (\`git ls-files --error-unmatch
orbit/explore/<change-name>/\` succeeds), verify the TARGET REF carries the same content
(\`git diff --quiet HEAD <target-ref> -- orbit/explore/<change-name>/\` exits 0 — absent on the
target counts as different). If it is absent or differs, SKIP THE PR LAYER ENTIRELY — do not
switch — and generate on the current branch, the change proceeding unattached, with one note
naming the reason. An UNTRACKED staging directory — the ORDINARY state, since \`/orbit:explore\`
commits nothing — NEVER triggers the skip: \`git switch\` rewrites only tracked paths, so
untracked content survives it intact, and the one case git would refuse (the target itself
carrying that path) surfaces as the switch-failure skip below, not here. The TARGET REF is
every tip the worktree will pass through: the branch's local tip on the switch AND, when step
6 will fast-forward it, the remote tip — both must carry the same content. Checking beforehand
rather than recovering afterward is what keeps phase 1 non-destructive. The dirty-tree check
below does NOT cover this: it detects uncommitted modifications, while this hazard is
COMMITTED content present on your branch and absent from (or different on) the target.

Then propose's own preconditions, in order. Each SKIP writes nothing, so the flow simply
proceeds unattached — generating on the current branch exactly as under \`pr: never\`:

1. **Branch name.** \`<change-name>\` on the per-proposal path; the architecture doc's filename
   stem on the program path. Validate with \`git check-ref-format --branch <name>\`; a name Git
   rejects is a skip with a note naming the name and reason — never silently transformed.
2. **Default-branch collision.** A mechanical name equal to the resolved default branch makes
   \`<head> → <base>\` impossible: skip with a note.
3. **Dirty tree.** Any tracked modification outside the change's own generated artifacts and
   moved staging material → skip with a note. Unrelated UNTRACKED paths do not trigger the
   skip but ARE named in that note.
4. **Existence — remote OR local.** Fetch and check \`<resolved-remote>/<branch>\` before
   concluding a branch is absent. When only the remote ref exists, create a local tracking
   branch (\`git switch -c <branch> --track <resolved-remote>/<branch>\`) and take the reuse
   path; resuming a program branch from a clean checkout is ordinary. "Absent" means absent
   both locally and on the remote.
5. **Compatibility**, per path:
   - *Per-proposal* — compatible when absent, or present with no commits beyond the resolved
     default branch other than this change's own artifact commits. "Own artifact commits" is a
     PATH test, never a commit-message test: every path \`git diff --name-only
     <resolved-remote>/<default>...<branch>\` lists is under \`orbit/changes/<change-name>/\`
     (or a deletion under \`orbit/explore/<change-name>/\`) — the same discipline the
     enumerated commit scope imposes at phase 3. Any other path means a same-named branch
     carrying unrelated work: a COLLISION, skip with a note naming the foreign path. The
     diff must RESOLVE: a same-named branch with NO merge base against the default (an
     unrelated root — \`git diff\` exits non-zero with \`no merge base\` and empty output) is
     a COLLISION too, never an empty compatible diff — a failed observation is a skip,
     not a pass.
   - *Program* — compatible when \`git merge-base <program-branch> <resolved-default>\`
     SUCCEEDS (shared ancestry). NOT tip-ancestry: a program branch is long-lived, so the
     default branch advancing underneath it is expected at every stage after the first, and a
     tip test would reject healthy work. Only an unrelated root is a collision. When the
     default branch is AHEAD of the merge-base, PROCEED and note that it is ahead by N
     commits and that the PR's diff carries the gap until the user integrates — never merge,
     rebase, or fast-forward the branch, and never skip on this basis.
6. **Remote-ahead — resolved FIRST, before step 5 and the generation-input precondition are
   applied.** When the branch exists locally AND on the resolved remote, compare the tips:
   local strictly behind → the EFFECTIVE TIP is the remote's, reached by \`git merge --ff-only\`
   after the switch; local equal or strictly ahead → the effective tip is the local one;
   diverged → SKIP with a note naming the divergence. Orbit never force-moves, renames,
   rebases, or force-pushes a user's branch. Step 5's compatibility test and the
   generation-input precondition are evaluated against the EFFECTIVE tip — and the
   generation-input check against EVERY tree transition phase 1 will perform (HEAD → the
   local branch on the switch, then the local branch → the remote tip on the fast-forward),
   because a fast-forward rewrites tracked content exactly as a switch does. Approving the
   local branch and then advancing it to a different tip would let the remote tip rewrite an
   approved exploration or carry in a foreign path past the own-path rule.

Creation is based on \`<resolved-remote>/<default>\` — the ref the existence check just
fetched — never the possibly-stale local ref of the same name.

### Phase 2 — generate and validate, ON that branch

Exactly as without the PR layer. If generation or validation FAILS, nothing is committed,
pushed, or opened; the failure note NAMES the branch the flow switched you to, with
\`git switch <default>\` as recovery. The branch is local-only and discardable.

### Phase 3 — outward writes, only after phase 2 succeeds

Nothing leaves the machine until generation and validation have succeeded.

**Commit scope is an ENUMERATED FILE LIST** — every file named, none inferred:
\`orbit/changes/<change-name>/proposal.md\`, \`design.md\`, \`tasks.md\`, every
\`specs/<capability>/spec.md\`, \`.openspec.yaml\` (it carries the base fingerprints the
fingerprint-capture step stamped — forgetting it strands them), the moved staging material
now under \`orbit/changes/<change-name>/\` (\`explore.md\`, any sketches, and the moved
\`.orbit-runs/\` trail files — list them), and the staging-directory DELETIONS the move
produced at \`orbit/explore/<change-name>/\`. Commit with \`git commit --only <the same enumerated
paths>\` — an enumerated \`git add\` does not restrict a plain \`git commit\`, which would sweep
anything the user had pre-staged into the PR; \`--only\` builds the commit from exactly those
paths and leaves other staged entries staged (named in the note). \`git add -A\` is PROHIBITED, as
is staging a bare directory prefix — the artifacts are newly created and therefore untracked,
so reaching for \`-A\` is exactly what would sweep an unrelated untracked file into a PR you
are about to publish.

Then push, and open the PR:

- **Per-proposal path** (and the per-architecture fallback for an UNCITED change): open a
  DRAFT PR with the agent-written INTENT description, adapted from proposal.md's Why/What.
- **Program path** (cited change under \`per-architecture\`): land on the program branch, and
  open the program PR ONLY AFTER resolving existence by query — never assumed from the
  branch's newness and never from a \`gh pr create\` duplicate error. Run the SAME four-axis
  constrained query the archive tail uses: \`--repo <owner>/<repo>\`, \`--head <program-branch>\`,
  \`--state open\`, and DISCARD candidates whose base is not the resolved default branch.
  - Exactly one survivor → ADOPT it: record its identity in this propose's \`pr_attachment\`
    and create nothing. Shape A's one-PR-per-program rule is what makes adoption correct.
  - Zero → create the draft program PR.
  - Several → SKIP the PR step with a one-line ambiguity note listing the candidates.
  - Query ERROR → degradation skip. Never create on error: a duplicate program PR is the one
    outcome Shape A cannot represent.

**Title and body at birth (both paths — never improvised).** Pass the title EXPLICITLY:
\`gh pr create\` without \`--title\` prompts, which a body cannot answer. Per-change title:
\`<change-name>: <proposal.md's title line, without the leading #>\`. Program title:
\`<doc stem>: <the architecture doc's title line>\`. Per-change body: the INTENT description
adapted from proposal.md's Why/What. Program body: PROGRAM INTENT adapted, by the same
discipline, from the doc's opening prose (everything before its first \`### Stage\` heading)
plus its stage list — the birth entry the appended stage entries later accumulate under.
Write the body to a file and pass \`--body-file\`. Titles are set ONCE at birth: the archive
tail's landmark rewrite and the stage-entry append touch the BODY only.

**Mid-flight failure.** A step that fails (push rejected for auth, branch protection, or
divergence; \`gh pr create\` erroring) SKIPS the remaining choreography with a one-line note
naming completed vs skipped steps, and elides \`pr_attachment\`'s \`url\`/\`state\` from the emit.
RECOVERY IS MANUAL BY DESIGN (v1): there is no retry entry point. The note names the exact
completing commands — \`git push -u <resolved-remote> <branch>\`, and
\`gh pr create --repo <owner>/<repo> --draft --base <resolved-base> --head <branch> --title "<title>" --body-file <path>\` when PR
creation was what failed — and states the consequence: the change proceeds UNATTACHED, and
its archive tail will find no attachment, note it, and skip.

**No-CI note.** When opening a change's FIRST PR on a repository with no
\`.github/workflows/\`, note in one line that no CI is configured (the PR's checks section will
be empty). The check is bound to ONE ref — the resolved remote's default-branch ref, which
the existence check already fetched — never the pre-switch worktree and never the target
branch, since those can disagree and the note describes the CI context the NEW PR inherits.
Reporting only: never scaffold, never prompt.

**No consent prompt.** The choreography rides the user's OWN invocation of propose. Propose is
NOT in the consent-scoped set and fires NO consent prompt at entry: the no-chaining contract
already bars an unbidden AI propose, and the outward write is a DRAFT PR on a NEW branch,
reversible in two commands. Behavior is identical on every provenance path — the PR step never
silently skips or degrades based on how propose was reached.

## Recording the attachment

Record \`pr_attachment\` in the propose (or ff) emit payload:

- \`branch\` and \`granularity\` — ALWAYS when the choreography ran. \`granularity\` is the
  RESOLVED regime for THIS change, not the repo's config value: an uncited change under
  \`per-architecture\` records \`"per-proposal"\`, the path it actually took.
- \`url\` and \`state\` — when a PR opened. \`state\` is \`"draft"\` or \`"ready"\` as OBSERVED.
- \`doc\` — REQUIRED when \`granularity\` is \`"per-architecture"\`, absent otherwise. The write
  gate enforces this in both directions, so a program-path record that omits it is REJECTED
  and no emit is written at all.
- The whole object is ELIDED when the choreography did not run.

**Then COMMIT and PUSH the record — the seam's final act, ONLY when a PR OPENED or was
ADOPTED (the emit's \`pr_attachment\` carries \`url\`).** The emit is written AFTER the push and
the PR creation (it needs \`url\`), so it is NOT in the phase-3 commit; left there it is an
uncommitted file that a discarded worktree or a fresh checkout between seams loses — and the
archive tail, finding a WHOLLY ABSENT attachment, terminates the PR path with the PR stranded
DRAFT and no designed way back. Stage EXACTLY the emit file
(\`orbit/changes/<change-name>/.orbit-runs/propose-<TS>.json\`, or \`ff-<TS>.json\`), commit it
with \`git commit --only <emit-path>\`, and \`git push <resolved-remote> <branch>\`. This is the
SAME seam and the user's SAME invocation — no new consent — and it is the only push that
exists between propose and archive; the seams-only rule is untouched.

**Success gate.** This step runs ONLY after every phase-3 step succeeded. After a MID-FLIGHT
FAILURE (push rejected, \`gh pr create\` erroring, ambiguity or query-error skip) the emit —
carrying the branch-only attachment — stays LOCAL: the flow never retries a rejected outward
write in the same invocation, so the mid-flight note's MANUAL recovery gains one more line:
once the failed step is completed by hand, \`git add <emit-path> && git commit --only
<emit-path> && git push <resolved-remote> <branch>\` to land the record.

**Failure here is STEP-DEPENDENT, and the note names completed vs pending.** Commit failed →
the record is uncommitted: \`git add <emit-path> && git commit --only <emit-path> && git push
<resolved-remote> <branch>\`. Commit succeeded, push failed → the tree is CLEAN and the record
is committed: \`git push <resolved-remote> <branch>\` ONLY — a chained add-and-commit stops at
"nothing to commit, working tree clean" and never reaches the push. Either way the
consequence is the same: the attachment record has not reached the branch.`;

/** Archive: the read-only preflight and the PR-attached tail. */
export const PR_ARCHIVE_TAIL_SECTION = `## The read-only PR preflight (BEFORE the archive emit)

Runs before the emit is written, performs every OBSERVATION the tail depends on, and mutates
nothing.

1. **Resolve the attachment.** Read \`pr_attachment\` from the LATEST attachment-bearing
   PROPOSE **or FF** emit on the change's trail (both are equally authoritative). Its
   \`granularity\` decides flip-vs-append; its \`branch\` names the commit target. Neither is
   re-derived from config or the citation.
   - A WHOLLY ABSENT attachment TERMINATES the PR path here: no discovery query, no remote or
     \`gh\` work, nothing committed, pushed, or flipped. Unattached means pre-capability.
     \`/orbit:new\` + \`/orbit:continue\` changes never attach, so a branch name that happens to
     match a hand-opened PR must never pull them into a push the consent preview did not
     disclose.
   - Compare the frozen record against the change's CURRENT \`.openspec.yaml\`
     \`architecture:\` block; when a citation was added, removed, or re-pointed after propose,
     emit a one-line divergence note. The frozen record still governs — the note keeps the
     no-op visible.
2. **Validate a stored \`url\` LIVE.** A stored URL is a CLAIM, not a fact: GitHub stays
   mutable between the seams. Check it against the SAME four predicates the fallback uses —
   resolved repository, head branch, resolved base, open state.
   - **On POSITIVE invalidation** (the record resolves but fails a predicate): skip ONLY the
     tail's PR-WRITING steps — the description rewrite (per-change) OR the stage-entry append
     (program), and the flip — with ONE note naming the SPECIFIC reason: \`closed\`,
     \`merged\`, \`retargeted to <base>\`, \`repository mismatch\`, or \`not found\`
     (each distinct, never a generic miss). The COMMIT and PUSH still proceed: those writes
     are the archive's own, they land on the change's branch via the resolved remote, and
     they are correct whatever became of the pull request. A failed validation NEVER
     triggers step 3's fallback query as a second chance — a record that resolves to a
     closed PR is ANSWERED, not missing.
3. **Fallback**, only when the attachment EXISTS but lacks \`url\`: the four-axis constrained
   query — \`--repo <owner>/<repo>\`, \`--head <resolved-branch>\`, \`--state open\`, and
   DISCARD candidates whose base is not the resolved default branch — requiring EXACTLY ONE
   survivor. Zero / several / query-error are three distinct one-line notes. The tail flips
   and records; it never creates.
4. **Observe current draft/ready state** — \`gh pr view --repo <owner>/<repo> <url> --json isDraft\`,
   addressing the PR by the URL step 2 validated (or step 3 discovered). The selector is
   REQUIRED: with \`--repo\` and no URL or number the real CLI exits before any request
   (\`argument required when using the --repo flag\`), and the observation must never depend
   on the current checkout branch.

Feed that ONE observation to both the emit and the tail so they cannot disagree. Cannot
observe (no \`gh\`, failed query — the observation itself is unavailable, which is DISTINCT
from step 2's positive invalidation, where the observation succeeded and answered) → elide
the emit's PR fields and skip the tail; never block the archive.

**Emit fields.** \`pr_url\` + \`pr_state\` record what the preflight OBSERVED — normally
\`"draft"\`, truthfully \`"ready"\` when the PR was already flipped by the USER at an earlier
point (including at a prior program's arc-done, for an adopted program PR; never by a stage).
On POSITIVE invalidation (closed, merged, retargeted, foreign repository) \`pr_state\` is
ELIDED — the draft/ready axis does not apply — while \`pr_url\` IS still recorded as the
identity that was validated and rejected.

## The tail (AFTER the archive emit)

**Scope: the ATTACHMENT decides, not the live config.** The tail runs whenever an attachment
resolves, whatever \`pr:\` reads now — the same freeze-at-commitment rule the citation carries.
Setting \`pr: never\` stops NEW attachments; it does not abandon an open PR. **Bulk-archive is
out of scope entirely** (see \`/orbit:bulk-archive\`).

**Preconditions, checked BEFORE any staging:**

- **\`gh\` availability.** Absent \`gh\` skips the WHOLE tail before committing anything, so "no
  \`gh\` = today's behavior" stays true rather than "committed and pushed, then failed".
- **HEAD.** \`git commit\` writes to whatever HEAD points at, so verify HEAD's branch equals
  \`pr_attachment.branch\`. (The archive body already OBSERVES this at its read-only ENTRY step,
  before any archive write, and says so — this check remains the guard; that one is the early
  warning.) On mismatch, SKIP with a note naming BOTH branches and the
  CASE-SPECIFIC recovery: \`git switch <branch>\` when the branch exists locally;
  \`git fetch <resolved-remote> && git switch -c <branch> --track <resolved-remote>/<branch>\`
  when it exists only on the remote; and a plain statement that no switch recovers it when it
  is absent everywhere. Never checkout, never stash. Without this check an archive from
  \`main\` would commit and push there while every step reported success.

**Steps:** commit → push → description rewrite (per-change) or stage-entry append (program) →
\`gh pr ready\` for PER-CHANGE PRs only.

**Commit ISOLATION.** An enumerated \`git add\` does NOT restrict \`git commit\`, which commits
the WHOLE index — anything the user had staged before archiving would ride the archive commit
and be pushed. So: \`git add <the enumerated paths>\`, then \`git commit --only <the SAME
enumerated paths>\`. Git builds that commit from exactly those paths and leaves every other
staged entry staged, untouched; the note names them (\`N unrelated staged entries left
staged\`). Never plain \`git commit\` at this seam.

**Commit scope is an ENUMERATED FILE LIST**: the exact capability spec files this archive's
sync REPORTED as changed (never the \`orbit/specs/\` prefix — that would sweep dirty edits to
capabilities this archive never synced), the DELETION the move produced at the pre-move
\`orbit/changes/<change-name>/\` path, and the explicit at-archive-note edits. Never
\`git add -A\`. The moved \`orbit/changes/archive/<YYYY-MM-DD>-<name>/\` is the ONE path staged
as a whole — a bounded exception, because orbit NAMES and CREATES that directory in this same
invocation and its contents are one change's material by construction; untracked content the
move carried along is staged with it and NAMED in the note. Staging the deletion is not
optional: the move is a FILESYSTEM move, so git sees delete+add as two facts, and staging only
the add commits the tree twice and leaves the deletion dirty in the tree the flip announces.

**Program stage entry — SOURCE ORDER:** (1) the arc STATUS-LOG entry written at this same
archive when one was written; (2) otherwise composed from the archive emit's
\`final_assessment\` plus the change name and date. A status log is a convention, not an
architecture-grammar requirement, so the fallback is a real path. Never block, never invent;
name the source used in one line.

**APPEND means READ-APPEND-WRITE.** The \`--body-file\` edit REPLACES the whole body, so:
read the current body first (\`gh pr view --repo <owner>/<repo> <url> --json body -q .body\`),
append this stage's entry to it, write the COMPOSED whole back. Writing only this stage's
entry would destroy every earlier stage's entry — the accumulated entries ARE the landmark.
The per-change description REWRITE is the one place the body is replaced outright.

**READY.** Per-change PRs flip now — including on \`gate_overridden\` archives, since the
recorded override IS the ratification. Program PRs are APPENDED and never flipped here:
arc-done is later than any archive. ORDERING INVARIANT: the flip fires only AFTER the push
succeeds, so the PR contains its own archive commit before READY is honest. An already-READY
PR is reported in one line, never re-flipped and never an error.

**Failure — every step is inside this contract, staging and commit included.** Skip the
remainder with a note naming completed vs skipped steps. The archive itself (sync, move,
emit) has already succeeded and never rolls back. Because the change has MOVED,
\`/orbit:archive\` is NOT a retry path; the note names the repository-qualified completing
command and the consequence for the step that failed:

- **Staging/commit** — \`git add <paths> && git commit --only <paths>\`; the archive's writes are
  present but uncommitted, and the PR is untouched.
- **Push** — \`git push <resolved-remote> <branch>\`; the PR lacks its own archive commit, which
  is why the invariant forbids the flip here.
- **Description rewrite (per-change) or stage-entry append (program)** —
  \`gh pr edit --repo <owner>/<repo> <url> --body-file <path>\`; the PR is current in code but
  its description is the stale intent narrative (per-change), or its body lacks this stage's
  entry (program — the file is the COMPOSED body, current body + this entry, never the entry
  alone).
- **READY flip** (per-change only — the program path never flips here) —
  \`gh pr ready --repo <owner>/<repo> <number>\`; the PR is complete and accurate but still
  DRAFT, a safe resting state.

**Merging is never an orbit action.** The completion readout names merging as the user's act
in one line.`;

/** The reference emitted into propose and ff skills. */
export const PR_CHOREOGRAPHY_REFERENCE = `# Reference: the PR lifecycle choreography (propose / ff)

Loaded ONLY when the engine-resolved regime (\`orbit status --json\`, field \`pr\`) is an
ACTIVE mode (\`per-proposal\` or \`per-architecture\`). When it resolves to \`never\` — which is
also what an absent key and every inert value or shape resolve to — do not load this file and
do not probe anything; see the config resolution order below.

Per \`orbit-pr-lifecycle\`'s zero-engine-git requirement, every git and \`gh\` command here is a
workflow-BODY step you perform; the orbit engine never shells to git or \`gh\`.

${PR_RESOLUTION_SECTION}

${PR_CONFIG_ORDER_SECTION}

${PR_PROPOSE_SECTION}
`;

/** The reference emitted into the architect skill (arc-done readout — READ-ONLY use). */
export const PR_RESOLUTION_REFERENCE = `# Reference: remote and default-branch resolution (architect readout)

Loaded by the arc-done human-acts readout ONLY. The readout makes NO outward write: it
resolves the remote, the canonical \`<owner>/<repo>\`, and the default branch exactly as
propose, ff, and the archive tail do — ONE algorithm, present wherever it is performed — so
it can read the program PR's live state and, when no URL-bearing record exists, run the
four-axis constrained query. This readout is gated by the ATTACHMENT — a matching
per-architecture record on a trail (\`granularity: "per-architecture"\` and \`doc\` naming this
doc), URL OPTIONAL: a URL-bearing record is validated LIVE against the four predicates, and a
record WITHOUT \`url\` (creation failed at propose and the user completed it by hand) takes the
four-axis discovery below — that is the recovery case discovery exists for, never a reason
to stay silent. The gate is never the live \`pr:\` value: setting \`pr: never\` stops NEW
attachments and never hides a program PR that exists — so the seams' config-order gate is
deliberately NOT part of this reference.

Per \`orbit-pr-lifecycle\`'s zero-engine-git requirement, every git and \`gh\` command here is a
workflow-BODY step you perform; the orbit engine never shells to git or \`gh\`.

${PR_RESOLUTION_SECTION}

## The four-axis constrained query (discovery without a stored URL)

\`gh pr list --repo <owner>/<repo> --head <program-branch> --state open --json url,baseRefName,isDraft,number\`,
then DISCARD candidates whose base is not the resolved default branch. Exactly one survivor
is the program PR; zero / several / query-error are three distinct one-line notes. The
readout never creates, edits, or flips — it reports, and names the human acts.
`;

/** The reference emitted into the archive skill. */
export const PR_ARCHIVE_TAIL_REFERENCE = `# Reference: the PR-attached archive tail

Loaded ONLY when the change under archive resolves a \`pr_attachment\` (see the preflight
below). An unattached change ends exactly as pre-capability — do not load this file. The
ATTACHMENT is the only gate at this seam: the live \`pr:\` value is NOT consulted here (setting
\`pr: never\` stops NEW attachments and never abandons an open PR), so the propose/ff
config-order gate is deliberately absent from this reference.

Per \`orbit-pr-lifecycle\`'s zero-engine-git requirement, every git and \`gh\` command here is a
workflow-BODY step you perform; the orbit engine never shells to git or \`gh\`.

${PR_RESOLUTION_SECTION}

${PR_ARCHIVE_TAIL_SECTION}
`;
