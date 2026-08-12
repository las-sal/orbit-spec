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

- [ ] 2.1 `src/core/emit-composition.ts`: `pr_url` + `pr_state` added to the propose AND
      archive payload-field rows (optional narrative pass-through; elided when absent —
      the existing empty-elision pattern). Tests: accepted on propose/archive, carried
      verbatim, rejected as unknown on every other command.

## 3. Propose choreography (workflow body)

- [ ] 3.1 `src/core/templates/workflows/propose.ts`: the config-gated PR steps after
      artifact generation + validation — per-proposal path (and the per-architecture
      fallback for an uncited change): create `<change-name>` off the default branch,
      commit artifacts + moved staging material, push, open a DRAFT PR with the
      agent-written INTENT description; per-architecture cited path: land on the program
      branch (create off default if absent), open the program PR on first configured touch
      (draft, program-intent body). Degradation: no remote/no `gh`/`never` → skip with one
      note.
- [ ] 3.1b Propose body: branch preconditions — default-branch resolution (`gh repo view`
      → `git symbolic-ref` fallback → skip with note), dirty-tree skip, existing-branch
      reuse-or-report (never force-move/rename); mid-flight push/`gh` failure skips the
      remainder with a completed-vs-skipped note and elides the emit's PR fields.
- [ ] 3.2 Propose body: NO consent prompt and NO consent-scope change (D-d6-6) — the
      choreography rides the user's own invocation; the PR step never silently skips or
      degrades by provenance (grep-test that the propose body adds no AskUserQuestion at
      entry).
- [ ] 3.3 Propose body: the no-CI surfacing note — first PR on a repo with no
      `.github/workflows/` gets the one-line "no CI configured" note in the completion
      output (reporting only).
- [ ] 3.4 Propose emit: record `pr_url`/`pr_state` in the payload when a PR was opened.
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
      trail). Ordering invariant: flip only after the push succeeds.
- [ ] 4.2 Archive tail: PR DISCOVERY — read `pr_url` from the change's propose emit, fall
      back to `gh pr list --head <branch>`, and when neither resolves skip with a one-line
      note (the seam flips and records, it never creates). Commit scope is the archive's
      ENUMERATED own-writes (synced baseline, the moved archive dir, `.openspec.yaml`,
      at-archive-note edits) — never `git add -A`; unrelated dirty paths stay unstaged and
      are named.
- [ ] 4.3 Archive tail degradation: push/`gh` failure skips the remaining tail with a
      one-line note naming completed vs skipped steps; the archive itself never rolls
      back or blocks; `pr: never`/no-remote leaves the flow byte-identical to today.
- [ ] 4.4 Archive tail: the merge-seam echo — the completion readout names merging as
      the human's act in one line (per the `orbit-conventions` residual rule). The archive
      emit records `pr_url` + the EMIT-TIME `pr_state` (`"draft"`, or elided) — never the
      post-flip state, since the emit precedes the tail; the READY transition is evidenced
      by the PR and the readout.

## 5. Surface teach-in

- [ ] 5.1 `src/core/templates/workflows/onboard.ts`: teach the PR lifecycle — config
      vocabulary, citation-selected granularity, draft/READY semantics, merging-stays-
      human.
- [ ] 5.2 `src/core/templates/workflows/architect.ts`: at completion ratification, when
      `orbit architecture status --json` + the architecture trail show ARC-DONE, the readout
      surfaces the program PR's URL (from the trail record at its birth), its DRAFT state,
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

## 6. Verification

- [ ] 6.1 `npm run build && node bin/orbit.js update --force`; generated surface matches
      source (parity hashes re-pinned as needed); full `npm test` green; strict
      validation; `orbit fingerprint d6-pr-lifecycle --check` verified.
- [ ] 6.2 Live smoke in a scratch repo: `pr:` unset → byte-identical behavior; no-remote
      degradation note; config reader values.
- [ ] 6.3 (User-validation handoff) Dogfood exit criterion 1 on a real change: draft PR
      at propose, CI visible from day one, READY at archive, merged by the user — and
      exit criterion 3's no-off-script check across the dogfood (no PR/merge/release
      action outside the config+provenance rules).
