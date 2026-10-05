## MODIFIED Requirements

### Requirement: Verification-genre passes grade the walk record

The system SHALL run an `in-context` pass whose pass genre is VERIFICATION (per `orbit-conventions`' `Review mode decision framework`, which owns the table) as a verification of the walks, not a re-review of the whole artifact. Concretely, in the review body's VERIFICATION branch, in proposal or system mode: (a) the body learns its genre by the bounded metadata probe `Review-genre passes read the artifacts and the code, never the trail's findings` describes, unchanged — the ENGINE's computation is authoritative, and a write-gate refusal is the channel that reconciles the two, in BOTH directions: when the engine computes VERIFICATION and the refusal names an owed record missing or a verdict not owed, the body reads the keys the refusal names, grades or drops them, and emits again; when the engine computes REVIEW and the refusal names `verification` or a `walk_entry` as refused on a REVIEW-genre pass, the body drops `verification` and every `walk_entry`, runs the pass as a REVIEW-genre pass over the whole artifact, and emits again; (b) it READS the walk records of its mode after the latest accepted independent pass — a VERIFICATION-genre read, outside the review-genre brief rule; (c) it GRADES every owed entry — the `resolved` ones, at every severity, one verdict per key — `landed` or `regressed` by the definition `orbit-emit-composition`'s `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` owns (the review body carries that fence as a checked mirror, since an installed skill cannot open the owner), reading each entry's SWEEP SCOPE: its `file`, its `ripple_cascade.applied` paths (the cascade record `orbit-address-reviews` specifies), and, on an entry that carries one, its `sweep.scope` paths (the sweep record `orbit-address-reviews`' `A resolved walk entry records its sweep evidence` owns; a directory contributes its files, and every path resolves by the rule `orbit-emit-composition`'s `The walk write gate checks sweep evidence` states). `sweep.scope` names paths the walk EXAMINED, not edited, so it widens what is graded and never what the residual check exempts: that check keys on each entry's EDIT RECORD, its `file` plus its `ripple_cascade.applied`; (d) it REVIEWS the union of the sweep scopes with the passes the body already runs for its mode whose subject is a FILE SET — every proposal-mode pass, and system-mode Passes 1–5; a pass defined over the whole change or the whole project — system-mode Pass 0 (verify-change) and Pass 6 (audit-drift) — is not run and is listed in `passes_skipped` naming that reason, so exit (3)'s count is graded against a stated procedure — and checks the scope against `git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'` plus the untracked files `git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'` list — `<C>` the commit that first added the BASE FILE — the latest accepted independent pass's file, or, when the mode has no accepted independent pass, the file of the pass the EARLIEST verified walk walked — found by a hash-only read (`git log --diff-filter=A --format=%h -- <that file> | tail -1`), or `HEAD` when that file is not yet committed; the trail is excluded because walk logs and pass records are bookkeeping, never edits a walk claims, naming each listed file outside every entry's edit record as a SUGGESTION — a record gap, not a defect; a defect the pass finds in such a file is its own finding, graded by `orbit-conventions`' Severity ladder by consequence; (e) it composes `verification` and, on each finding about a walk entry, `walk_entry` — a defect in a `resolved` entry's edit names that entry and grades it `regressed`; a finding about a `stale`, `deferred` or `escalated` entry names that entry; a finding about no entry carries no link and is marked by the renderer. The sweep scope is the walk's CLAIM of what it touched or examined, not an observation of the tree: its named limit — Residual kind: an edit the walk record does not list — a resolved entry written without `ripple_cascade` (126 of 986 resolved entries across the archive, 2026-10-04), an edit made outside the walk's log, a cascade path recorded wrongly, or an edit committed in the same commit that first added the base file (that commit is the range's start, so the diff cannot see it) — the ORDINARY case, not an edge, whenever the base file is committed together with the walks' edits (rc03b's fresh pass file and both its system walk logs share one adding commit); committing the base file BEFORE the walks' edits keeps them in the range. Residual method: at the verification pass, compare the scope against `git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'` plus the untracked files `git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'` list — `<C>` the commit that first added the base file defined in (d), found by a hash-only read, or `HEAD` when that file is not yet committed; the trail is excluded because walk logs and pass records are bookkeeping, never edits a walk claims, and name each listed file outside every entry's edit record as a SUGGESTION finding without `walk_entry` — a record gap, marked by the renderer and outside exit (3)'s WARNING-and-above count. A pass that re-reviews the whole artifact anyway is not refused; its unlinked findings carry `[outside the walk record]`, which is how the drift is seen. Architecture mode has no VERIFICATION genre.

#### Scenario: A verification grades each owed entry over its sweep scope

- **WHEN** an in-context system-mode pass computes VERIFICATION over a walk whose `resolved` entry names `src/core/templates/workflows/review.ts` with `ripple_cascade.applied` listing two delta specs, `design.md` and a test
- **THEN** the body reads all five files for that entry, writes one verdict for its key, and reviews the five files in its scoped passes

#### Scenario: A system-mode verification skips the change-wide and project-wide passes

- **WHEN** an in-context system-mode pass computes VERIFICATION
- **THEN** it runs Passes 1–5 over the union of the sweep scopes, does not run Pass 0 (verify-change) or Pass 6 (audit-drift), and lists both in `passes_skipped` with the reason that their subject is the whole change or the whole project

#### Scenario: A defect in the walk's own addition is a regression with its finding

- **WHEN** the verifying pass finds that an entry's edit introduced a defect
- **THEN** the payload grades that key `regressed` and carries a finding whose `walk_entry` names it, the finding's text stating the cause

#### Scenario: A file touched outside the record is named

- **WHEN** the residual check's listing — the trail excluded — names a file in no owed entry's edit record
- **THEN** the body names it as a SUGGESTION finding without `walk_entry`, which the renderer marks `[outside the walk record]`; a walk log or pass record under `.orbit-runs/` is never listed

#### Scenario: An edit co-committed with the pass file is outside the check's reach

- **WHEN** the commit that first added the base file also carries a walk edit no sweep scope lists
- **THEN** the residual check does not list it — a declared limit, named in the Residual kind — and the body does not claim the scope was checked against that commit

#### Scenario: A verification with no independent pass has a base

- **WHEN** an in-context system-mode pass computes VERIFICATION over walks of an in-context pass, and the mode has no accepted independent pass on the trail
- **THEN** the residual check's base is the commit that first added the file of the pass the earliest verified walk walked (or `HEAD` when it is uncommitted), and the check runs from it

#### Scenario: A refusal reconciles the probe with the engine

- **WHEN** the body's metadata probe read REVIEW and the emit surface refuses the payload because the engine computes VERIFICATION with an owed record missing
- **THEN** the body reads the owed keys the refusal names, grades them, and emits again — no second probe and no hand-computed walk set

#### Scenario: A refusal reconciles a probe that read VERIFICATION where the engine computes REVIEW

- **WHEN** the body's metadata probe read VERIFICATION — its only walk names a rejected external return, or a pass file absent from this trail — and the emit surface refuses `verification` on a REVIEW-genre pass
- **THEN** the refusal says the engine is authoritative and what is now owed; the body drops `verification` and every `walk_entry`, runs the pass as a REVIEW-genre pass over the whole artifact, and emits again

#### Scenario: A walk entry's declared sweep scope is graded

- **WHEN** an owed entry carries `sweep.scope: ["orbit/changes/<name>/proposal.md"]` and its `file` and `ripple_cascade.applied` do not name that path
- **THEN** the verification pass reviews `proposal.md` as part of that entry's sweep scope; if `proposal.md` also changed in the residual check's range and no entry's edit record lists it, the residual check still names it
