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
      (treated as `never`) with a one-line warning naming it (garnish, never an error
      source). Unit tests: absent key, each of the three values, unrecognized value,
      non-scalar shape.
- [ ] 1.2 `orbit/config.yaml`: commented `pr:` example documenting the three modes, the
      per-architecture fallback for uncited changes, and the degradation note (no
      remote/no `gh` → `never`).

## 2. Emit payload fields (engine)

- [ ] 2.1 `src/core/emit-composition.ts`: the structured `pr_attachment` object added to
      the propose AND FF payload-field rows; flat `pr_url` + `pr_state` added to the ARCHIVE
      row (archive resolves no attachment — it reports observed state). Optional narrative
      pass-through, elided when absent (the existing empty-elision pattern). Tests:
      `pr_attachment` accepted on propose/ff and carried verbatim; `pr_url`/`pr_state`
      accepted on archive; each rejected as unknown on the commands outside its set
      (`pr_attachment` on archive, `pr_url` on propose, both on review/address-reviews/…).
      The ff row is not optional — `orbit-pr-lifecycle`'s entry-points requirement gives ff
      the IDENTICAL choreography, so omitting it makes the promised ff path fail at the
      write gate.

## 3. Propose choreography (workflow body)

- [ ] 3.1 `src/core/templates/workflows/propose.ts`: the config-gated PR steps after
      artifact generation + validation — per-proposal path (and the per-architecture
      fallback for an uncited change): create `<change-name>` off the default branch,
      commit artifacts + moved staging material, push, open a DRAFT PR with the
      agent-written INTENT description; per-architecture cited path: land on the program
      branch (create off default if absent), open the program PR on first configured touch
      (draft, program-intent body) — but ONLY after resolving existence with the SAME
      four-axis constrained query the archive tail uses: one survivor = ADOPT (record it in
      `pr_attachment`, create nothing), zero = create, several = ambiguity skip, query error
      = degradation skip (never create on error — a duplicate program PR is unrepresentable
      in Shape A). Degradation: no remote/no `gh`/`never` → skip with one note.
- [ ] 3.1a SHARED resolution helper (body-level, both seams): implement
      `orbit-pr-lifecycle`'s `Remote and default-branch resolution` ONCE as a reusable body
      step and have propose, ff, AND the archive tail invoke it — one remote wins whatever
      its name; multiple → prefer `origin` else skip with an ambiguity note; default branch
      via `gh repo view` → `git symbolic-ref refs/remotes/<remote>/HEAD` → skip with note.
      The resolved remote drives push target, default base, and `gh` repo at EVERY seam.
      Grep-test that no seam resolves a remote or base independently.
- [ ] 3.1b Propose body: propose's OWN preconditions (after invoking 3.1a) —
      default-branch NAME COLLISION skip, dirty-tree skip, existing-branch
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
      `pr_attachment.branch` BEFORE staging; on mismatch (or a locally-absent branch) skip
      with a one-line note naming both branches and the `git switch <branch>` recovery.
      Never checkout, never stash. Test the archive-from-`main` case explicitly: assert
      ZERO commits land on the default branch and the PR is not flipped.
- [ ] 4.2 Archive tail: PR DISCOVERY — read the `pr_attachment` object from the latest
      attachment-bearing propose OR ff emit on the change's trail (its `granularity` decides
      flip-vs-append, its `branch` names the commit target — neither re-derived); COMPARE the
      frozen record against the change's CURRENT `.openspec.yaml` `architecture:` block and
      emit the one-line divergence note when a citation was added, removed, or re-pointed
      after propose (the frozen record still governs — the note is what keeps the no-op
      visible); fall back to the FOUR-AXIS constrained query (`gh pr list --repo <resolved
      remote's repo> --head <branch> --state open`, discarding candidates whose base is not
      the resolved default branch) requiring EXACTLY ONE survivor, with zero / several /
      query-error each a distinct one-line note (the seam flips and records, it never
      creates). Commit scope is an ENUMERATED
      FILE LIST — the exact capability spec files the sync reported changed (never the
      `orbit/specs/` prefix), the moved archive dir, `.openspec.yaml`, and the explicit
      at-archive-note edits — never `git add -A`; unrelated dirty paths stay unstaged and
      are named. Test with an unrelated dirty file INSIDE `orbit/specs/`.
- [ ] 4.3 Archive tail degradation: push/`gh` failure skips the remaining tail with a
      one-line note naming completed vs skipped steps; the archive itself never rolls
      back or blocks. SCOPE is attachment-driven: an UNATTACHED change (proposed under
      `pr: never`, or degraded at propose) leaves the flow byte-identical to today, while an
      ATTACHED change runs the tail even if `pr:` now reads `never` — the live key is not
      consulted at this seam.
- [ ] 4.4 Archive tail: the merge-seam echo — the completion readout names merging as
      the human's act in one line (per the `orbit-conventions` residual rule). The archive
      emit records `pr_url` + the EMIT-TIME `pr_state` (`"draft"`, or elided) — never the
      post-flip state, since the emit precedes the tail; the READY transition is evidenced
      by the PR and the readout.

- [ ] 4.5 Archive body, CONSENT PREVIEW (entry, not tail): when the change is PR-ATTACHED,
      the AI-mediated consent prompt's write preview additionally names the branch, the push
      to the resolved remote, and the READY flip (per-proposal) or appended stage entry
      (program) — the tail fires no second prompt, so this preview is where the outward
      writes are disclosed. Unattached changes keep the byte-identical pre-capability
      preview. Grep-test both shapes in the generated body.

## 5. Surface teach-in

- [ ] 5.1 `src/core/templates/workflows/onboard.ts`: teach the PR lifecycle AT THE TWO
      SEAMS (per the `orbit-onboard` delta) — the propose-phase paragraph names the draft
      PR + the three `pr:` values + citation-selected granularity + the uncited fallback +
      the no-remote/no-`gh` degradation; the archive-phase paragraph names the tail and
      that MERGING IS THE USER'S ACT. Unconditional on the reading project's config (the
      body is a generated constant). Also update the Quick-reference table if any command's
      one-line description changes.
- [ ] 5.2 `src/core/templates/workflows/architect.ts`: at completion ratification, when
      `orbit architecture status --json` + the architecture trail show ARC-DONE, the readout
      surfaces the program PR's URL — found by scanning change trails (active AND archived)
      for `pr_attachment` objects with `granularity: per-architecture` and a matching `doc`,
      most recent wins — its CURRENT draft state read live via `gh pr view --json isDraft`
      (never the frozen `pr_attachment.state`; a failed query surfaces the readout anyway
      with a `state unverified` note),
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
      rule wrongly rejected); remote-ahead fast-forward and remote-diverged skip; propose's
      enumerated commit scope with an unrelated UNTRACKED file present (it stays unstaged
      and is named).
- [ ] 6.2d Harness cases — ENTRY POINTS + ATTACHMENT: `ff` end-to-end producing the same
      branch/PR/`pr_attachment` as propose; `new`+`continue` reaching archive unattached;
      the attachment object's shape per path (per-proposal without `doc`, per-architecture
      with it); branch-without-PR after a `gh pr create` failure; PROGRAM-PR ADOPTION — a
      second citing change proposed when the program PR already exists records the existing
      PR and issues no `gh pr create` (asserted against the stub's log), with the several-
      candidates and query-error cases each skipping distinctly.
- [ ] 6.2e Harness cases — ARCHIVE TAIL: discovery from the propose emit; discovery
      fallback via the `gh` stub; zero/multiple/closed-match outcomes each distinct;
      enumerated commit scope with an unrelated dirty file inside `orbit/specs/`; ordering
      invariant (`gh pr ready` recorded only after a successful push); HEAD-MISMATCH skip
      (archive invoked from the default branch — no commit on `main`, no flip); push-failure skip
      with the archive still complete; program-mode append-without-flip; CITATION DIVERGENCE
      — a citation added, removed, or re-pointed after propose produces the one-line note
      and the frozen record still governs.
- [ ] 6.2f Harness cases — ARC-DONE READOUT: both valid orderings (final archive →
      ratification → closing review, and closing review → ratification) surface the human
      acts; the readout is idempotent across repeated architect invocations; the program PR
      is located by matching `doc` with two programs present in one repo.
- [ ] 6.3 (User-validation handoff) Dogfood exit criterion 1 on a real change: draft PR
      at propose, CI visible from day one, READY at archive, merged by the user — and
      exit criterion 3's no-off-script check across the dogfood (no PR/merge/release
      action outside the config+provenance rules).
