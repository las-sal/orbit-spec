<!--
Implementation chunks:
  Chunk 1 (groups 1-2):  Engine surface (config reader, emit payload fields)
  Chunk 2 (groups 3-4):  Workflow bodies (propose choreography, archive tail)
  Chunk 3 (groups 5-6):  Surface teach-in + verification
-->

# Tasks: d6-pr-lifecycle

## 1. Config reader (engine)

- [ ] 1.1 `src/core/project-config.ts`: parse the optional `pr:` scalar —
      `never|per-proposal|per-architecture`; absent = `never`; unrecognized value inert
      (treated as `never`) with a one-line warning naming it; a NON-SCALAR shape (map/list,
      incl. the superseded `{open, program-branches}` block) takes the same inert path with
      the warning naming the invalid SHAPE (garnish, never an error source — a config typo
      must not stop a lifecycle command). Unit tests: absent key, each of the three values,
      unrecognized value, non-scalar shape (map AND list), each asserting inert-`never` plus
      the warning text.
- [ ] 1.2 `orbit/config.yaml`: commented `pr:` example documenting the three modes, the
      per-architecture fallback for uncited changes, and the degradation note (no
      remote/no `gh` → `never`).

## 2. Emit payload fields (engine)

- [ ] 2.1 `src/core/emit-composition.ts`: the structured `pr_attachment` object added to
      the propose AND FF payload-field rows; flat `pr_url` + `pr_state` added to the ARCHIVE
      row (archive resolves no attachment — it reports observed state). Optional narrative
      pass-through, elided when absent (the existing empty-elision pattern). Tests:
      `pr_attachment` accepted on propose/ff and carried verbatim IN ITS VALUES while its
      STRUCTURE is gate-validated (unknown nested key, missing `branch`/`granularity`,
      non-string field, out-of-enum `granularity`/`state`, and the conditional `doc` rule
      each REJECT with the offending field named — existence stays body-owned);
      `pr_url`/`pr_state`
      accepted on archive; each rejected as unknown on the commands outside its set
      (`pr_attachment` on archive, `pr_url` on propose, both on review/address-reviews/…).
      The ff row is not optional — `orbit-pr-lifecycle`'s entry-points requirement gives ff
      the IDENTICAL choreography, so omitting it makes the promised ff path fail at the
      write gate.

## 3. Propose choreography (workflow body)

- [ ] 3.1 `src/core/templates/workflows/propose.ts`: the config-gated PR steps in THREE
      ORDERED PHASES (the order is normative — a simpler one cannot execute):
      PHASE 1 select + switch, no NETWORK writes, BEFORE any artifact is generated — and
      guarded by the GENERATION-INPUT precondition checked BEFORE the switch, since
      `git switch` rewrites tracked worktree content: when a consume-mode
      `orbit/explore/<name>/` exists in the worktree but not on the target ref, SKIP the PR
      layer entirely (no switch at all) and generate on the current branch, unattached, with
      a note. Checking beforehand rather than recovering after is what keeps phase 1
      non-destructive;
      PHASE 2 generate + validate ON that branch (a failure here names the branch the flow
      switched to, with `git switch <default>` as recovery — nothing committed or pushed);
      PHASE 3 outward writes only after validation succeeds. Per-proposal path (and the
      per-architecture fallback for an uncited change): select/create `<change-name>` in
      phase 1, then in phase 3 commit artifacts + moved staging material, push, open a
      DRAFT PR with the agent-written INTENT description; per-architecture cited path: land on the program
      branch (create off the RESOLVED REMOTE's default-branch ref if absent — never the
      possibly-stale local ref), open the program PR on first configured touch
      (draft, program-intent body) — but ONLY after resolving existence with the SAME
      four-axis constrained query the archive tail uses: one survivor = ADOPT (record it in
      `pr_attachment`, create nothing), zero = create, several = ambiguity skip, query error
      = degradation skip (never create on error — a duplicate program PR is unrepresentable
      in Shape A). Degradation: no remote/no `gh` on an ACTIVE mode → skip with one note;
      `never`/absent/inert → no probe and NO output at all (config-first resolution order).
- [ ] 3.1a SHARED resolution helper (body-level, both seams): implement
      `orbit-pr-lifecycle`'s `Remote and default-branch resolution` ONCE as a reusable body
      step and have propose, ff, AND the archive tail invoke it — one remote wins whatever
      its name; multiple → prefer `origin` else skip with an ambiguity note; default branch
      via `gh repo view --repo <owner>/<repo>` → `git symbolic-ref refs/remotes/<remote>/HEAD`
      → skip with note. Derive the CANONICAL `<owner>/<repo>` identifier from the resolved
      remote's URL (HTTPS and SSH forms) and pass `--repo` on EVERY `gh` invocation at every
      seam — `repo view`, `pr list/create/view/edit/ready`, and any `merge` text; never a
      bare PR number in copyable text. Unparseable remote URL = degradation skip. Grep-test
      that no seam resolves a remote or base independently AND that no `gh` invocation in any
      body omits repository qualification.
- [ ] 3.1b Propose body: propose's OWN preconditions, ALL IN PHASE 1 — evaluated before any
      artifact exists, so every skip writes nothing and the flow proceeds unattached,
      generating on the current branch exactly as under `pr: never` (after invoking 3.1a) —
      `git check-ref-format --branch` validation of the mechanical name (skip with a note;
      never silently transform), default-branch NAME COLLISION skip, dirty-tree skip,
      REMOTE-OR-LOCAL existence check before concluding absence (create a local tracking
      branch when only the remote ref exists), creation based on `<resolved-remote>/<default>`
      rather than the local default ref, existing-branch
      reuse-or-report (never force-move/rename), ENUMERATED commit scope (artifacts + moved
      staging material + the `orbit/explore/<name>/` deletions — never `git add -A`, never a
      bare directory prefix; unrelated untracked paths left alone and named in the note);
      mid-flight push/`gh` failure skips the
      remainder with a completed-vs-skipped note and elides the emit's PR fields.
- [ ] 3.2 Propose body: NO consent prompt and NO consent-scope change (D-d6-6) — the
      choreography rides the user's own invocation; the PR step never silently skips or
      degrades by provenance (grep-test that the propose body adds no AskUserQuestion at
      entry).
- [ ] 3.3 Propose body: the no-CI surfacing note — first PR on a repo with no
      `.github/workflows/` gets the one-line "no CI configured" note in the completion
      output (reporting only).
- [ ] 3.4 Propose emit: record the `pr_attachment` object in the payload — `branch` +
      `granularity` always when the choreography ran, `url`/`state` when a PR opened, `doc`
      when granularity is per-architecture; whole object elided when nothing ran.
- [ ] 3.5 `src/core/templates/workflows/ff-change.ts`: the IDENTICAL choreography +
      preconditions + degradation + emit fields as propose (ff is propose-in-one-breath —
      a change is never treated differently for how it was started). `new`/`continue` are
      explicitly NOT extended; verify the archive tail's unattached path notes and skips.

## 4. Archive tail (workflow body)

- [ ] 4.0 Archive body: the READ-ONLY PR PREFLIGHT, positioned BEFORE the archive emit —
      resolve the attachment, validate a stored `url` live, and observe the PR's CURRENT
      draft/ready state; feed that ONE observation to both the emit's `pr_url`/`pr_state`
      and the post-emit tail, so they can never disagree. No mutation in this step. Cannot
      observe (no `gh`, failed query) → elide the emit's PR fields and skip the tail; never
      block the archive.
- [ ] 4.1 `src/core/templates/workflows/archive-change.ts`: the PR-attached tail after
      the archive emit — commit → push → description rewrite (ACHIEVEMENT landmark for
      per-change PRs; APPENDED stage entry adapted from the just-written arc status-log
      entry for program PRs) → `gh pr ready` per the generalized READY rule (per-change:
      flip now, incl. on `gate_overridden` archives; program: append only, flip at
      arc-done — checked from `orbit architecture status --json` + the architecture
      trail). Ordering invariant: flip only after the push succeeds. Stage-entry SOURCE
      ORDER: the arc status-log entry written at this archive when present, else composed
      from the archive emit's `final_assessment` + change name + date (a status log is a
      convention, not an architecture-grammar requirement) — never blocking, never
      inventing; the source used is named in one line.
- [ ] 4.1b Archive tail: the HEAD PRECONDITION — verify HEAD's branch equals
      `pr_attachment.branch` BEFORE staging, alongside the `gh`-availability precondition;
      on mismatch skip with a one-line note naming both branches and the CASE-SPECIFIC
      recovery — `git switch` (local branch), fetch-and-track (remote-only), or a plain
      no-recovery statement (absent everywhere). Never checkout, never stash. Test the
      archive-from-`main` case explicitly: assert ZERO commits land on the default branch
      and the PR is not flipped, and ASSERT THE PRINTED RECOVERY TEXT per case — not merely
      that a note exists.
- [ ] 4.2 Archive tail: PR DISCOVERY — read the `pr_attachment` object from the latest
      attachment-bearing propose OR ff emit on the change's trail (its `granularity` decides
      flip-vs-append, its `branch` names the commit target — neither re-derived); COMPARE the
      frozen record against the change's CURRENT `.openspec.yaml` `architecture:` block and
      emit the one-line divergence note when a citation was added, removed, or re-pointed
      after propose (the frozen record still governs — the note is what keeps the no-op
      visible); VALIDATE a stored `url` LIVE against the same four predicates (resolved repo / head /
      resolved base / open) read-only BEFORE staging — a failure skips ONLY the description
      rewrite and flip with the specific reason (`closed`/`merged`/`retargeted`/`repository
      mismatch`/`not found`), while commit and push still proceed, and never falls through to
      the query as a second chance; TERMINATE the PR path when `pr_attachment` is WHOLLY ABSENT (unattached = pre-capability;
      no discovery, no remote/`gh` work — `new`/`continue` changes must never reach a PR that
      merely shares a branch name, since their consent preview disclosed no outward writes);
      fall back ONLY for an attachment that EXISTS but lacks `url`, using the FOUR-AXIS
      constrained query (`gh pr list --repo <resolved
      remote's repo> --head <branch> --state open`, discarding candidates whose base is not
      the resolved default branch) requiring EXACTLY ONE survivor, with zero / several /
      query-error each a distinct one-line note (the seam flips and records, it never
      creates). Commit scope is an ENUMERATED
      FILE LIST — the exact capability spec files the sync reported changed (never the
      `orbit/specs/` prefix), the DELETION the move produced at the pre-move
      `orbit/changes/<name>/` path (the move is a filesystem move, so git sees delete+add as
      two facts; staging only the add commits the tree twice and leaves the deletion dirty),
      and the explicit at-archive-note edits —
      never `git add -A`. The moved archive dir is the ONE whole-path exception (orbit-created
      this invocation, one change's material by construction); untracked content it carried
      along is staged WITH it and NAMED in the note. Unrelated dirty paths stay unstaged and
      are named. Test with an unrelated dirty file INSIDE `orbit/specs/`.
- [ ] 4.3 Archive tail degradation: ANY step's failure — staging/commit included, not just
      push/`gh` — skips the remaining tail with a note naming completed vs skipped steps AND
      the repository-qualified completing command for the step that failed, plus that step's
      consequence (per the four cases in `orbit-archive-modifications`); `/orbit:archive` is
      never offered as a retry (the change has already moved). The archive itself never rolls
      back or blocks. SCOPE is attachment-driven: an UNATTACHED change (proposed under
      `pr: never`, or degraded at propose) leaves the flow byte-identical to today, while an
      ATTACHED change runs the tail even if `pr:` now reads `never` — the live key is not
      consulted at this seam.
- [ ] 4.4 Archive tail: the merge-seam echo — the completion readout names merging as
      the human's act in one line (per the `orbit-conventions` residual rule). The archive
      emit records `pr_url` + the `pr_state` the 4.0 PREFLIGHT OBSERVED — `"draft"`
      ordinarily, `"ready"` truthfully when the PR was already flipped (user, or an earlier
      stage of an adopted program PR), elided when unobservable; never a forward-looking
      claim about the flip this tail is about to perform. The flip step is IDEMPOTENT: an
      already-READY PR (flipped by the USER at an earlier point — never by a stage) is
      reported in one line, not re-flipped and not an error. Test both
      draft and already-ready inputs. A HEAD mismatch skips the tail but LEAVES the emit's PR
      fields intact (the observation preceded the branch check) — unlike the no-`gh` path,
      where they are elided because no observation exists.

- [ ] 4.5 Archive body, CONSENT PREVIEW (entry, not tail): when the change is PR-ATTACHED,
      the AI-mediated consent prompt's write preview additionally names the branch, the push
      to the resolved remote, and the READY flip (per-proposal) or appended stage entry
      (program) — the tail fires no second prompt, so this preview is where the outward
      writes are disclosed. Unattached changes keep the byte-identical pre-capability
      preview. Grep-test both shapes in the generated body.

- [ ] 4.6 `src/core/templates/workflows/bulk-archive-change.ts`: bulk-archive performs NO
      tail (the tail is single-branch; HEAD cannot be on every attached change's branch).
      Each change syncs/moves/emits as pre-capability; the completion readout NAMES attached
      changes left unflipped with their PR URLs (report, never act); the per-change consent
      preview omits the outward-writes line. Grep-test that the body adds no commit/push/
      `gh` step.

## 5. Surface teach-in

- [ ] 5.1 `src/core/templates/workflows/onboard.ts`: teach the PR lifecycle AT THE TWO
      SEAMS (per the `orbit-onboard` delta) — the propose-phase paragraph names the draft
      PR + the three `pr:` values + citation-selected granularity + the uncited fallback +
      the no-remote/no-`gh` degradation; the archive-phase paragraph names the tail and
      that MERGING IS THE USER'S ACT. Unconditional on the reading project's config (the
      body is a generated constant). Also update the Quick-reference table if any command's
      one-line description changes.
- [ ] 5.2 `src/core/templates/workflows/architect.ts`: on EVERY invocation — unconditional
      and idempotent, NEVER gated on the completion-ratification interaction (the natural
      ordering makes arc-done true after that interaction has passed) — when
      `orbit architecture status --json` + the architecture trail show ARC-DONE, the readout
      surfaces the program PR's URL — found by scanning change trails (active AND archived)
      for `pr_attachment` objects with `granularity: per-architecture` and a matching `doc`,
      most recent URL-BEARING record wins (never merely the most recent match — a later
      URL-less record would permanently mask the still-valid program PR) — its CURRENT draft state read live via `gh pr view --json isDraft`
      (never the recorded `pr_attachment.state`, a point-in-time observation that goes stale
      after emit whatever its initial value). THREE validation outcomes, readout NEVER
      suppressed by any: valid → surface; query FAILED → surface with `state unverified`;
      positively INVALID (closed/merged/retargeted/foreign repo) → fall through to the
      constrained `--head <program-branch>` query and surface what it finds, or state that
      no open replacement exists. The fall-through is the OPPOSITE of the tail's rule
      because this seam reports and the tail writes,
      and `gh pr ready <n>` / `gh pr merge <n>` as the user's acts — recommend, never
      invoke; no outward write from this body.
- [ ] 5.3 Conventions echo sites: the residual outward-actions line in the
      lifecycle-completion outputs that end at outward seams.
- [ ] 5.4 Root `CLAUDE.md`: add the one-line outward-actions note for non-orbit sessions
      (the `orbit-conventions` residual rule's SHOULD — this repo instantiates its own
      requirement rather than only asking adopters to).

### At-archive notes

(NOT apply tasks — the archive flow executes these; deliberately not checkboxes, so the
apply gate's arithmetic covers only apply-completable work.)
- 5.5 Retire superseded prose in the arc doc's `### Stage d6-pr-lifecycle` section
  (depth B, ratified 2026-08-12): replace the stale `pr: draft-at-propose | at-archive |
  never` config sketch with the ratified three-mode `pr: never | per-proposal |
  per-architecture` key, and mark the carried D1 leanings RESOLVED with one-line outcomes
  pointing at this change — (e) READY condition uniform, flip performed per-change /
  surfaced per-program; (f) SUPERSEDED, propose is not consent-scoped and behavior is
  provenance-invariant; (g) confirmed, zero engine git. Exit criteria stay UNTOUCHED, and
  the section stays a charter (what the stage is chartered to do) — resolved questions are
  marked, never deleted, per the arc doc's genre and D1's precedent.
- 5.6 Append the D6 status-log entry to the arc doc (the outcome narrative; the stage
  section holds the charter, the log holds what happened).
- 5.7 Record the single-session stance as an ARC-LEVEL RULING in the arc doc's rulings
  index (Sal, 2026-08-20): orbit is single-user, single-session — one user-invoked lifecycle
  command at a time; concurrency support (locking, serialization, optimistic retry,
  conflict-merge) is an explicit NON-GOAL across the arc, and findings asking for it are
  answered with a named limit plus detection. It is cross-stage (it governs every future
  capability touching shared or remote state), so it belongs in the rulings index rather
  than only in D6's design.
- 5.8 Record the R-d-4 SUBTRACTION EXCEPTION in the arc doc alongside D6's status-log entry
  (user-ratified 2026-08-20): D6 adds an outward-facing capability with no predecessor to
  reclaim from, so it names no removal; the rule stands and the departure is dated and
  visible rather than silent. Rationale lives in design.md — the arc doc carries the
  one-line record, not a restatement.
- 5.9 Add the D6 entry to root `CLAUDE.md` in the D1–D5 house style (what shipped, the
  cadence it went through, the test count) — every prior stage carries one, and it is what
  keeps `CLAUDE.md` accurate for the next cold start. The Impact section's Docs bullet
  promises it; this note is where it lands.

## 6. Verification

- [ ] 6.1 `npm run build && node bin/orbit.js update --force`; generated surface matches
      source (parity hashes re-pinned as needed); full `npm test` green; strict
      validation; `orbit fingerprint d6-pr-lifecycle --check` verified.
- [ ] 6.2 INTEGRATION HARNESS (`test/integration/pr-lifecycle/`): a disposable git repo per
      case (real `git init`, real commits, a bare repo as the remote) plus a `gh` STUB on
      PATH that records invocations and returns scripted JSON. Template-string assertions
      cannot validate a git/GitHub state machine — this harness is what makes exit criterion
      2's "tested, not assumed" honest. No concurrency cases (single-session non-goal).
- [ ] 6.2a Harness cases — CONFIG: explicit `pr: never` runs the full propose→archive
      lifecycle with ZERO git/`gh` invocations recorded (asserted against the stub's log,
      not just output text); unset `pr:` byte-identical to `never`; each of the three values
      resolves; unrecognized value inert with a warning; CONFIG-FLIPPED-MID-FLIGHT — a
      change proposed under `per-proposal` and archived after `pr: never` still runs its
      tail (attachment authority), while a change proposed under `never` runs none.
- [ ] 6.2b Harness cases — DEGRADATION: no remote; `gh` absent from PATH; multiple remotes
      with no `origin` (ambiguity skip); default-branch resolution failure. Each degrades
      with one note, exit 0, artifacts intact. Assert the SHARED algorithm at BOTH seams:
      the same multi-remote checkout skips identically at propose and at the archive tail,
      and an unresolvable base at archive reports a RESOLUTION failure — never a missing PR.
- [ ] 6.2c Harness cases — PRECONDITIONS: non-`main` default branch; dirty tree skip;
      branch-name collision with the default branch; per-proposal collision with unrelated
      work; PROGRAM branch reuse across two successive citing changes (the case the old
      rule wrongly rejected); RE-PROPOSE onto an existing compatible per-proposal branch from
      the default branch (the switch must succeed because selection precedes generation — the
      case that was mechanically impossible under the old ordering); VALIDATION FAILURE after
      the phase-1 switch (branch named in the note, nothing committed or pushed);
      CONSUME-MODE INPUT ABSENT ON TARGET REF — propose from a branch carrying a committed
      `orbit/explore/<name>/` the base ref lacks: assert NO switch occurs, the exploration
      survives, and generation proceeds unattached on the current branch; DEFAULT
      BRANCH ADVANCED between two citing stages — `merge-base`
      still succeeds, branch reused, ahead-by-N note emitted, nothing merged/rebased/skipped;
      an unrelated-root branch IS reported as a collision; REMOTE-ONLY program branch resumed
      in a fresh checkout (tracking branch created, no divergent history); a doc stem valid on disk but invalid as a Git
      ref (skip with a note); remote-ahead fast-forward and remote-diverged skip; propose's
      enumerated commit scope with an unrelated UNTRACKED file present (it stays unstaged
      and is named).
- [ ] 6.2d Harness cases — ENTRY POINTS + ATTACHMENT: `ff` end-to-end producing the same
      branch/PR/`pr_attachment` as propose; `new`+`continue` reaching archive unattached;
      the attachment object's shape per path (per-proposal without `doc`, per-architecture
      with it); branch-without-PR after a `gh pr create` failure; PROGRAM-PR ADOPTION — a
      second citing change proposed when the program PR already exists records the existing
      PR and issues no `gh pr create` (asserted against the stub's log), with the several-
      candidates and query-error cases each skipping distinctly.
- [ ] 6.2e Harness cases — ARCHIVE TAIL: discovery from the propose emit; STORED-URL
      VALIDATION exercised directly (not only through fallback) — closed, merged,
      retargeted-base, and repository-mismatch records each skip the PR half with their own
      reason while commit+push still land; discovery fallback via the `gh` stub; zero/multiple/closed-match outcomes each distinct;
      enumerated commit scope with an unrelated dirty file inside `orbit/specs/` (unstaged)
      AND an untracked scratch file inside the moved change tree (staged with the tree and
      named in the note); the move's DELETION staged alongside its addition (assert the
      commit records a move, not a duplicated tree with a dirty deletion); ordering
      invariant (`gh pr ready` recorded only after a successful push); HEAD-MISMATCH skip
      (archive invoked from the default branch — no commit on `main`, no flip); push-failure skip
      with the archive still complete; each of the four PARTIAL STATES (staging/commit,
      push, description rewrite, flip) asserting its own printed completion command and
      consequence; program-mode append-without-flip; CITATION DIVERGENCE
      — a citation added, removed, or re-pointed after propose produces the one-line note
      and the frozen record still governs.
- [ ] 6.2f Harness cases — ARC-DONE READOUT: both valid orderings surface the human acts —
      and the CLOSING-REVIEW-LAST ordering (final archive → final-stage ratification →
      closing review) is asserted explicitly, since it is the one a ratification-gated
      readout would silently miss; the readout is idempotent across repeated architect
      invocations and stops once the PR is no longer draft; the program PR is located by
      matching `doc` with two programs present in one repo; a TWO-STAGE case where the second
      citing change's attachment is URL-LESS still surfaces the first stage's valid PR; a
      recorded PR that is CLOSED falls through to the query (and, with no open replacement,
      still surfaces with the no-replacement statement).
- [ ] 6.3 (User-validation handoff) Dogfood exit criterion 1 on a real change: draft PR
      at propose, CI visible from day one, READY at archive, merged by the user — and
      exit criterion 3's no-off-script check across the dogfood (no PR/merge/release
      action outside the config+provenance rules).
