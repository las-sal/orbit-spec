## Context

Stage `rc03c-verification-record` of `orbit/architecture/clean-up-review-cycle.md` — the second child of the split parent `rc03-review-genres` (D-rc03-8). rc03b (archived and ratified 2026-10-04) shipped the pass-genre TABLE in `orbit-conventions`' `Review mode decision framework` — REVIEW for the independent classes, VERIFICATION for an `in-context` pass after a QUALIFYING walk of its mode (after the latest ACCEPTED independent pass of that mode) — plus the in-context body's bounded metadata probe, and no engine code and no record field. That requirement defines no field and reserves the name `pass_genre` for one.

What exists to build on (all read 2026-10-04, see explore.md's References):
- `iteration` is the precedent for a stored computed extension: `ENGINE_OWNED_EXTRA.review` (`src/core/emit-composition.ts:203`), computed at write from `collectSameModePasses` (`:1320`).
- `validateReviewDirection` (`:597`) is the owed-plus-shape write-gate pattern (rc04b).
- The trail reader normalizes walk entries to `{severity, disposition, title, file}` with `Disposition = 'resolved' | 'stale' | 'deferred' | 'escalated'` (`src/core/artifact-graph/trail.ts:25, 58-83`); the gate keys resolutions by (trimmed title, repo-relative file) and reads the latest record per pass (`gates.ts:172-206`).
- Walk records already carry, per entry, `ripple_cascade.applied` — the files the cascade edited (`orbit-address-reviews`, spec line 255) — which the trail reader does not normalize.

The mechanism was explored as ten rules, each with an accounted Mechanism entry (see explore.md); this design transcribes them.

## Goals / Non-Goals

**Goals:**
- Exit (1): a verification pass is a COMPUTED genre with its own body section and its owed record; the cadence-slot token is unchanged and `gates.ts` carries no diff.
- Exit (2): a verification emit carries per-resolution `landed` / `regressed`.
- Exit (3): the next cadence's verification record carries zero findings marked `[outside the walk record]` at WARNING or above, measured on the record (instrument in D9).

**Non-Goals:**
- Closing Q-crc-20 (D-rc03-15): a verification is in-context and reads the walk RECORD; the sweep scope is the nearest proxy and is named in Q-crc-20's entry at archive.
- Changing the gate: neither field is a gate input (R-crc-13).
- Changing the genre table, the address-reviews record, or the external format.
- An `orbit status` field for the next pass's genre (explore D-rc03c-11).

## Decisions

### D1. The walk set is engine-computed with the genre; the AI supplies only verdicts, checked COMPLETE (explore D-rc03c-1)

ONE exported function computes `pass_genre` and `verified_walks` (the qualifying-walk set W); both are stored as computed extensions and refused in the payload. The payload's `verification: [{title, file, verdict}]` is the one judgement input. The write gate refuses it absent when owed, mis-shaped at any genre, incomplete over the owed entries, or carrying strays, and the refusal names each missing key with its walk token — so the body never needs W in advance. A key in two walks of W is ONE owed entry judged against the latest walk (the verdict is a fact about the artifact NOW, mirroring `passResolved`'s latest-record read); an unreadable walk owes nothing and stays listed. This departs from the charter's `verification: {walks, resolutions}` — a mixed-owner object the payload gate cannot refuse in part — and supersedes D-rc03-4's "named by token in `verification.walks`" row.

### D2. Only a `resolved` walk entry owes a verdict, at every severity (explore D-rc03c-2)

`stale`, `deferred` and `escalated` claim no edit; the closed pair `landed | regressed` grades edits only. SUGGESTION-severity `resolved` entries owe, because the record is about what the walk EDITED, not what gates. On rc03b's worked trail, the confirm would have owed 9 verdicts of 10 entries.

### D3. `landed` means the edit HOLDS; `regressed` means it does not, for any cause (explore D-rc03c-3)

Holds = present AND complete AND clean AND not undone by a later edit. Any failed conjunct, or a claim the pass cannot decide, is `regressed`; the paired finding states the cause. Stated ONCE, in `orbit-emit-composition`.

### D4. Findings link through `walk_entry`, naming ANY entry of W (explore D-rc03c-4)

A finding about a `resolved` entry's edit names it and that entry's verdict must be `regressed`; a finding about a wrong `stale` call (or a `deferred`/`escalated` entry) names that entry; a `regressed` verdict needs a finding naming it; a link outside W, and any link on a REVIEW-genre pass, are refused. Under R-crc-6 every walk edit traces to ONE entry, so the link is a single object. The charter's `regresses` is RENAMED — it appears in no shipped spec or source.

### D5. W is unnarrowed; a second confirm re-verifies (explore D-rc03c-5)

Narrowing W to walks after the latest verification pass would give a VERIFICATION genre an empty owed set (a second confirm with no new walk) and change `orbit-conventions`' table. Re-grading buys D3's "not undone" conjunct.

### D6. The sweep scope is `file` ∪ `ripple_cascade.applied`, read by the body (explore D-rc03c-6)

This corrects D-rc03-4's `resolutions[].file` union, which read only the trail reader's normalized entry. The engine does not compute it — no check reads it — so `trail.ts` is not widened. It is BOUNDED; the residual is stated in `orbit-review`'s `Verification-genre passes grade the walk record` (see Risks). **Widened at proposal walk 1 (2026-10-04):** the residual method's listing now names its range — `<C>` the commit that first added the latest accepted independent pass's file (hash-only; `HEAD` when uncommitted), plus untracked files — EXCLUDES the trail, and files an unlisted edit as a SUGGESTION (a record gap), so bookkeeping files can never fail exit (3). explore.md's D-rc03c-6 entry keeps the propose-time wording as the exploration's record; the requirement is the owner.

### D7. The function lives outside `gates.ts`; walk mode resolves through the ACCEPTED pass set; the report recomputes the genre (explore D-rc03c-7)

A new module beside `trail.ts` importing `isIndependent`. A walk whose source names a rejected external return, no pass, or null is MODE-LESS — consistent with the lower bound's "accepted". The stored value is written once like `iteration`; `orbit-report-rendering` recomputes it at render time (its render-time context requirement), so prior-generation emits render a genre by absence.

### D8. Render: header word, a `### Verification` section in the frame, two marks by absence (explore D-rc03c-8)

Section after `### Suppressed`, before `### Direction`, OUTSIDE the prose quarantine (a departure from the charter: every element is a closed token or a checked single-line slot). Rows are engine-printed with engine-derived walk tokens and linked findings; unreadable walks get a row. `[outside the walk record]` prefixes an unlinked finding ONLY on a pass carrying a record (after `[unreproduced]` when both apply); a VERIFICATION-genre pass with no record (prior generation only) renders `[no verification record]` once — nine historical confirms are not stamped finding by finding. A record with no rows renders `- no verdicts owed — every entry of the verified walks claims no edit`.

The canonical rendered example (goldens transcribe it):

```
## Review: example-change --as system

Mode: system · Iteration: 4 · Reviewer: in-context · Depth: full · Pass genre: VERIFICATION
Trend: 1C/2W/0S → 0C/4W/5S → 0C/0W/0S → 0C/1W/1S (0 repeat, 2 new)

...scorecard...

### Findings

#### WARNING
- **orbit/changes/example-change/design.md:40** — The repair stops one artifact short
  walk entry: Pointer names the wrong owner (`design.md`)
  > ...

#### SUGGESTION
- [outside the walk record] **src/core/x.ts:12** — An edit no walk entry lists
  > ...

### Verification
- landed — Field note restates the owner (`specs/orbit-review/spec.md`) · walk 2026-10-04T04-08-51Z
- regressed — Pointer names the wrong owner (`design.md`) · walk 2026-10-04T04-12-35Z · see: The repair stops one artifact short

### Commentary
...
```

The external header line is unchanged (`Mode: … · Iteration: … · Reviewer: external (<name>, <date>)`): every external pass is REVIEW, so the pass-genre field is omitted whole.

### D9. The body's VERIFICATION branch, and exit (3)'s instrument (explore D-rc03c-9, D-rc03c-10)

The branch reads W's walk records, grades every owed entry over its sweep scope, reviews the scope plus the git-diff residual check, links findings or leaves them to the mark; a write-gate refusal reconciles rc03b's probe with the engine.

Exit (3) is measured on THIS change's own system-mode in-context confirm (the first cadence run under the shipped mechanism; the proposal-mode confirm runs before the code exists), by this instrument, fixed now so it cannot be bent at archive (R-crc-12):

```
node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  if (j.pass_genre !== "VERIFICATION") { console.log("UNMEASURED"); process.exit(0) }
  const n = j.findings.filter(f => (f.severity==="CRITICAL"||f.severity==="WARNING") && !f.walk_entry).length;
  console.log(n === 0 ? "MET" : "MISS " + n)' <confirm emit path>
```

cross-checked by counting the finding lines carrying `[outside the walk record]` under the `#### CRITICAL` and `#### WARNING` subsections of its rendered report (a finding line carries no severity of its own; its subsection does). Corrected at proposal walk 1: the first form used `require(process.argv[1])`, which resolves a repo-relative path as a module name and throws. MET / MISS / UNMEASURED; UNMEASURED (the confirm computed REVIEW, or none ran) is neither a revision nor a miss and is carried to the next stage's confirm as a user-validation task, named at archive.

### D10. Three capabilities, as chartered (explore D-rc03c-12)

`orbit-emit-composition` (2 ADDED, 1 MODIFIED), `orbit-report-rendering` (1 ADDED, 3 MODIFIED), `orbit-review` (1 ADDED, 1 MODIFIED) — nine blocks. Consumed unchanged: `orbit-conventions`' table, `orbit-address-reviews`' `ripple_cascade`. Untouched: `orbit-engine-gates`, the external format.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc03c-1 | DERIVED | live rule | `orbit-emit-composition` — `The review emit records its pass genre and the walks it verifies` + `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` (SENTENCE naming the source, with the checks as a scenario set) |
| D-rc03c-2 | SOURCED | live rule | `orbit-emit-composition` — `A VERIFICATION-genre payload carries its verdicts…` (SENTENCE naming `Disposition`'s four values) |
| D-rc03c-3 | DERIVED | live rule | `orbit-emit-composition` — `A VERIFICATION-genre payload carries its verdicts…` (SENTENCE: the four conjuncts plus the undecidable case) |
| D-rc03c-4 | DERIVED | live rule | `orbit-emit-composition` — `A VERIFICATION-genre payload carries its verdicts…` (SCENARIO SET, one per row) |
| D-rc03c-5 | DERIVED | live rule | `orbit-emit-composition` — `The review emit records its pass genre and the walks it verifies` (SENTENCE + the re-list scenario) |
| D-rc03c-6 | BOUNDED | live rule | `orbit-review` — `Verification-genre passes grade the walk record` (both residual lines verbatim) |
| D-rc03c-7 | DERIVED | live rule | `orbit-emit-composition` — `The review emit records its pass genre…`; `orbit-report-rendering` — `Render-time computed context — never stored, never authored` (SCENARIO SET) |
| D-rc03c-8 | DERIVED | live rule | `orbit-report-rendering` — `Verification renders as its own section and its absence is marked` + `Report grammar — the frame sandwiches the commentary` (SCENARIO SET) |
| D-rc03c-9 | SOURCED | live rule | `orbit-review` — `Verification-genre passes grade the walk record` (SENTENCE: steps (a)–(e)) |
| D-rc03c-10 | DERIVED | live rule | this design's D9 and tasks.md's user-validation task (an exit instrument, not a spec requirement) |
| D-rc03c-11 | — | scope (not carried) | none |
| D-rc03c-12 | — | scope (not carried) | none |

## Touchpoints

- `src/core/artifact-graph/pass-genre.ts` — new: the one exported genre + walk-set function.
- `src/core/emit-composition.ts` — payload table, the two computed extensions, the verification / `walk_entry` write-gate checks.
- `src/core/report-render.ts` — header word, `### Verification` section, both marks, read-side shape validation.
- `src/core/templates/workflows/review.ts` — the VERIFICATION branch; `references/run-summary-schema.md` names `verification` and `walk_entry`.
- `test/core/pass-genre.test.ts` — new: the function's decision table.
- `test/core/emit-composition.test.ts` + `test/core/emit-schema-parity.test.ts` — the write gate; the schema-table parity.
- `test/core/report-render.test.ts` + `test/core/report-render-hardening.test.ts` — section, marks, normalizer.
- `test/core/templates/*.test.ts` — the generated body's branch and any moved hash pins.
- `orbit/architecture/clean-up-review-cycle.md` — at archive: Q-crc-20's proxy note; the stage's exit record.

## Risks / Trade-offs

- [D-rc03c-6 is BOUNDED] → its residual kind and method are stated in `orbit-review`'s `Verification-genre passes grade the walk record`; this entry points there and restates nothing.
- [A `landed` verdict is a claim, not a check — completeness proves every owed entry got a word, never that the word is true] → recorded as the verifying pass's judgement (R-crc-10); the rendered rows make each claim citable by the readiness author.
- [`walk_entry` can be attached to an unrelated finding to avoid the mark] → existence is checked, relevance is not; the link renders beside the finding, so the dodge is visible to a reader.
- [The body's metadata probe and the engine can disagree on the genre (rc03b's stated probe limit)] → the write gate's owed/stray refusal names the difference; the engine is authoritative.
- [Re-grading earlier walks on a second confirm costs verdict lines] → bounded by W's resolved entries; confirms rarely repeat on record.
- [Exit (3) may be UNMEASURED on this change's own cadence] → stated as a third outcome in D9; carried forward, never graded.

## Alternatives considered

From explore.md's Considered & out:
- The AI names the walks it verified (the charter's `verification.walks`): out — a hand-typed copy of an engine-computed set (D1).
- A per-disposition verdict vocabulary (`still-stale`): out — widens a closed pair to grade outcomes that claim no edit (D2).
- Keying verdicts by (walk, title, file): out — reintroduces a hand-typed token per entry (D1).
- A per-cause verdict vocabulary (`not-landed` / `incomplete` / `regressed` / `undone`): out — the cause rides the paired finding (D3).
- Keeping `regresses` restricted to `regressed` verdicts: out — a wrong `stale` call would have no link (D4).
- A multi-entry `walk_entry`: out — under R-crc-6 every edit traces to one entry (D4).
- Narrowing W to walks after the latest verification pass: out (D5).
- The engine computing the sweep scope as a stored field: out — no check reads it (D6).
- Resolving a walk's mode from its source filename: out — a rejected external's walk would qualify while the return does not bound (D7).
- `### Verification` inside the prose quarantine: out — its rows are frame (D8).
- Per-finding `[outside the walk record]` on historical confirms: out — the pass-level mark says it once (D8).
