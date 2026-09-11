# External Review: d6-pr-lifecycle (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-08-12

## CRITICAL

### `/orbit:ff` is promised identical PR behavior but the engine task rejects its fields and archive ignores its record
**File**: orbit/changes/d6-pr-lifecycle/tasks.md:23
**Description**: Task 2.1 adds `pr_url`/`pr_state` only to the propose and archive rows and explicitly tests that every other command rejects them, which includes `ff`; task 3.5 and `orbit-pr-lifecycle` lines 82-103 require `ff` to emit those fields. The archive delta and task 4.2 also read only a propose emit, not the equally authoritative ff emit. Implementing the tasks as written therefore makes the promised ff path fail at emit time or lose its attachment at archive. Add `ff` to the engine payload table and tests, make archive discovery read the latest attachment-bearing propose OR ff emit, and update the proposal's two-row/“propose and archive” residue.

### The frozen attachment cannot be represented by the allowed emit schema
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:54
**Description**: This requirement says the propose emit records branch name, granularity, and `pr_url`, and that this record governs every later seam. The owning `orbit-run-summary-emit` delta and the authoritative `orbit-emit-composition` table permit only `pr_url` and `pr_state`; unknown keys are rejected. A URL alone cannot faithfully freeze the selected branch/granularity or correlate a program PR to an architecture doc without re-reading mutable metadata, and the architect readout cannot reliably locate the birth record after its change is archived. Define an owning structured attachment shape (at minimum branch, granularity, and URL, with architecture doc identity when applicable), admit it for both propose and ff, and add archive/architect lookup tasks and tests.

### Arc-done can occur after the only readout seam has passed
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:120
**Description**: Arc-done requires the closing architecture review, but the new readout is tied only to “a completion ratification.” The baseline architect flow offers that interaction only for a quiescent unratified stage. A valid and natural order is final-stage archive → final-stage ratification → closing architecture review; the review then makes the arc done after no ratifiable stage remains, so the required PR URL/READY/merge readout never appears. Make an invocation guaranteed to observe the transition own an idempotent readout (for example the closing architecture-review completion path), or make every later architect resume detect arc-done independently of stage ratification; specify and test both valid orderings.

### The same requirement makes the terminal program-body rewrite both optional and mandatory
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:178
**Description**: Program semantics lines 112-129 say accumulated stage entries are the landmark, no terminal rewrite is required, and a whole-program rewrite is optional polish on request. This requirement then places “the whole-program landmark rewrite at arc-done” in the `SHALL` refresh sequence. That resurrects an outward write at the exact seam the design says has no body and conflicts with the human-only arc-done posture. Remove the rewrite from mandatory refresh points and describe it only as an explicitly requested human/agent polish action, or define a real authorized body and revise the earlier decisions consistently.

### The existing-branch rule rejects the commits a shared program branch is supposed to contain
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-propose-modifications/spec.md:66
**Description**: A reused branch is called unrelated when it diverges from default through commits “the change did not author,” but every program branch after its first stage necessarily contains commits authored by other citing changes. The artifacts also define no local-vs-remote lookup, fetch/update rule, worktree collision behavior, or serialization/retry protocol for two changes or archives sharing that branch; concurrent PR-body read/append/write can lose a stage entry. As written, a conforming implementation can reject every later program change or overwrite concurrent progress. Define a program-specific compatibility rule and remote-tip synchronization strategy, plus serialization or optimistic conflict detection/retry for commits and body appends; test two citing changes, a remote-ahead branch, and concurrent archive attempts.

## WARNING

### The decision record still asserts the retired config and consent behavior
**File**: orbit/changes/d6-pr-lifecycle/explore.md:89
**Description**: The exploration still ratifies a consent prompt for unratified AI-mediated propose, then ratifies the two-key `pr.open`/`program-branches` block and `at-archive` mode at lines 100-112. These are not the deliberately stale arc-charter prose exempted by the prompt; design.md calls explore.md the “full decision record,” yet the 2026-08-12 reversals exist only in the resolution JSON and newer generated artifacts. Preserve the historical entries but append clearly dated supersession decisions (or point every “full decision record” claim to an authoritative addendum/resolution record) and update the decision-count claims so a cold implementer cannot select the wrong ratified vocabulary.

### The “enumerated” archive commit scope can still sweep unrelated baseline edits
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:14
**Description**: The alleged enumerated set names the whole `orbit/specs/` directory. Staging that path also stages unrelated dirty edits to capabilities this archive did not sync, contradicting the scenario that unrelated paths remain unstaged immediately before READY. Require the exact capability spec files reported as changed by this archive's sync, the exact moved archive directory, and an explicit list of at-archive edits; add a test with an unrelated dirty file inside `orbit/specs/`.

### Fallback PR discovery does not establish a unique PR identity
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:8
**Description**: `gh pr list --head <branch> --json url,isDraft` does not constrain the base branch or define what to do with zero, multiple, closed, merged, or already-ready matches. That is insufficient to uphold “exactly ONE” program PR and could edit/flip the wrong PR after a missing attachment record. Require validation of stored URLs and make fallback filter by repository, head, resolved default base, and usable state; proceed only on exactly one match and report distinct zero/ambiguous/state-mismatch outcomes.

### Mid-flight propose failures leave no defined recovery path
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-propose-modifications/spec.md:16
**Description**: A push or `gh pr create` failure may leave the user on a new branch with a committed artifact set but deliberately elides the attachment fields. Propose is not naturally rerunnable after all artifacts exist, and archive explicitly refuses to create a replacement, so a transient failure can permanently strand the change outside the designed PR lifecycle. Specify an idempotent retry/recovery entry point (including behavior when push succeeded but PR creation failed), or require the failure note to give exact manual recovery and a supported way to persist the recovered attachment.

### Program stage appends assume an arc status-log entry that archive does not guarantee
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:20
**Description**: The program PR entry must be adapted from “the arc status-log entry written at this seam,” but the live archive baseline only guarantees a computed stage line in its readout; editing the architecture status log depends on change-specific at-archive notes such as D6 task 5.6. A cited change without that note leaves no required narrative source, so codegen must invent whether to skip, synthesize, or edit the architecture doc. Make the status-log write a normative prerequisite of every cited archive, or define an explicit fallback/source-order and the behavior when the entry is absent.

### Verification does not exercise several normative modes or the literal second exit criterion
**File**: orbit/changes/d6-pr-lifecycle/tasks.md:117
**Description**: The scratch smoke covers unset config and no remote, but not an explicit `pr: never` lifecycle as the charter requires, missing-`gh` degradation, ff end-to-end, cited per-architecture first touch/reuse, multiple changes on one program branch, duplicate/missing PR discovery, either arc-done ordering, or tail failure/retry. Template-string assertions cannot validate the git/GitHub state machine. Add isolated git-repo/`gh`-stub integration tests for those paths and make the explicit `pr: never` and remote-less checks separate assertions.

### D6 adds substantial generated instructions without its required subtraction accounting
**File**: orbit/changes/d6-pr-lifecycle/proposal.md:95
**Description**: The change adds choreography or teach-in text to propose, ff, archive, onboard, and architect, but names nothing removed or shrunk and provides no before/after surface accounting. This violates the arc's R-d-4 cross-cutting rule at `orbit/architecture/d-arc-arbitered-flow.md:311`, which explicitly names D6 as required to account for additions. Add a concrete subtraction/size budget and the tasks that realize it, or record a user-ratified exception in the owning architecture doc.

### The draft PR is not designed to stay current during most of the lifecycle
**File**: orbit/changes/d6-pr-lifecycle/proposal.md:41
**Description**: The charter promises artifacts, `.orbit-runs/`, and review iterations visible in the PR across the change's life, but D6 only guarantees commit/push at propose and archive. Internal/fresh review emits, resolution logs, apply work, and verification can remain local until archive; only the external-review handoff has an existing committed-and-pushed protocol. Either add config-gated commit/push choreography at the intended intermediate seams (with safe scope and failure rules), or narrow the charter/proposal claim to say the PR reflects whatever the user independently pushes rather than making visibility a delivered lifecycle property.

### The onboarding teach-in has a task but no normative capability delta
**File**: orbit/changes/d6-pr-lifecycle/tasks.md:81
**Description**: Task 5.1 changes `orbit-onboard`, but none of the six deltas requires onboarding to teach the config vocabulary or PR lifecycle, and `orbit-onboard` is absent from the proposal's Modified Capabilities. After archive, the baseline onboarding spec would have no durable requirement preserving this behavior. Add a MODIFIED `orbit-onboard` requirement/scenario (and fingerprint) or explicitly place and cross-reference the teach-in contract in the owning new capability.

## SUGGESTION

### Remote selection is implicit and `origin`-specific
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-propose-modifications/spec.md:59
**Description**: The config contract says “a git remote,” default-branch fallback hard-codes `origin`, and commit/push/PR steps never select a remote or repository when several exist. State the remote-selection precedence and push target (including a non-`origin` single remote and multiple-remotes ambiguity) so branch identity, default base, and GitHub repository cannot disagree.

### Branch-name collisions with the default branch are not defined
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:51
**Description**: Mechanical names can equal the resolved default branch (`<change-name> == main` or an architecture doc named `main`), making branch creation or `<head> → <base>` PR creation impossible while the existing-branch rule may misclassify the default branch. Add a reserved-name collision check that skips with a clear note, or define a deterministic namespaced branch form.

### Superseded terminology remains outside the intentionally stale charter
**File**: orbit/changes/d6-pr-lifecycle/design.md:33
**Description**: The artifacts still use `per-architect` as a mode label and call `project-config.ts` a `pr:` “block reader,” while the ratified vocabulary is scalar `per-architecture`. Normalize non-historical prose to the exact config term and “scalar reader” so grep-based drift checks distinguish deliberate historical mentions from accidental residue.

## Notes

Strict change validation passes, both MODIFIED requirements match their live baselines by fingerprint (2/2 verified), all six declared deltas are present, and no unresolved inline `@review:` marker appears outside the run history.

CHARTER CHECK:

- Exit criterion 1 (one real change: draft at propose, CI from day one, READY at archive, human merge) is named by task 6.3 and is plausible for the per-proposal path after the attachment and archive-seam defects above are fixed. It remains a user-validation handoff rather than evidence already supplied by these artifacts.
- Exit criterion 2 (`pr: never` has zero behavior; remote-less degrades gracefully, tested) is only partially covered: the remote-less smoke is named, but the literal explicit-`never` lifecycle is not, and the broader specified missing-`gh` degradation is also untested.
- Exit criterion 3 (no PR/merge/release outside config+provenance rules across the dogfood) is explicitly assigned to task 6.3 and supported by the residual outward-actions requirement. The undefined failure recovery and program-branch concurrency paths currently force implementer/user improvisation at precisely that boundary, so the criterion is not yet robustly demonstrable.

The main risk pattern is not OpenSpec structure; it is state-machine information loss. The design repeatedly relies on durable attachment, branch, PR, and arc-transition facts that the allowed records or guaranteed invocation seams do not currently preserve.
