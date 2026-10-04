## Why

Every rc-stage since rc13a has closed its system cadence with an in-context "confirm" that is, in practice, a VERIFICATION of the walks — "did each resolution land, did the walk's own additions break anything" — and none of it is RECORDED in a shape anyone can cite: the confirm emits ordinary findings, the walk's claims are never graded against the artifact on the record, and a confirm that quietly re-reviews the whole tree looks identical to one that verified. rc03b (archived and ratified 2026-10-04) made the pass genre COMPUTABLE — `orbit-conventions`' `Review mode decision framework` owns the table — but shipped no engine code and no record field, by design: that half was split out to this stage (D-rc03-8). This change ships it (see explore.md; mechanism inherited from D-rc03-2 and D-rc03-4 of the archived rc03b exploration, with the departures recorded there).

## What Changes

- **The pass genre is computed and stored.** ONE exported function over the trail (a new module beside `trail.ts`, never `gates.ts`) computes a review pass's `pass_genre` and its qualifying walk set W — the same computation, so for an in-context change-mode pass W is non-empty exactly when the genre is VERIFICATION. Both are stored on the review emit as computed extensions (`pass_genre`, `verified_walks`), like `iteration`, and REFUSED in the payload. A walk's mode resolves through the trail's ACCEPTED pass set: a walk of a rejected external return, or with no source, is mode-less. W is the table's qualifying set, unnarrowed — a second confirm re-grades earlier walks, which is what checks that a later walk did not undo an earlier fix (explore D-rc03c-1, -5, -7).
- **A VERIFICATION-genre pass owes a `verification` record.** The payload carries `verification: [{title, file, verdict}]`, `verdict` exactly `landed` | `regressed` — the one judgement input. Only `resolved` walk entries owe a verdict, at every severity (`stale`/`deferred`/`escalated` claim no edit). The write gate refuses it absent when owed, mis-shaped at any genre, INCOMPLETE over the owed entries, or carrying strays — and its refusal names each missing key with its walk token, so the body need not compute W in advance. A key in two walks gets one verdict, judged against the latest; an unreadable walk owes nothing and is still listed (D-rc03c-1, -2).
- **`landed` / `regressed` are defined once.** `landed` = the resolution's edit is present, complete, clean, and not undone by a later edit; any failed conjunct, or a claim the pass cannot decide, is `regressed`, and the paired finding states the cause (D-rc03c-3).
- **Findings link to the walk through `walk_entry`.** A finding may carry `walk_entry: {title, file}` naming ANY entry of W — a `resolved` entry (whose verdict must then be `regressed`), or a `stale`/`deferred`/`escalated` one (a wrong pushback call is about the walk too). A `regressed` verdict with no finding naming it, a link outside W, and any link on a REVIEW-genre pass are refused. The charter's working name `regresses` is RENAMED — it appears in no shipped spec or source (D-rc03c-4).
- **The report renders it.** The header gains the pass genre (recomputed at render time); a `### Verification` section after `### Suppressed` and before `### Direction` lists one engine-printed row per verdict (with its walk token and linked findings) and one per unreadable walk — OUTSIDE the prose quarantine, a departure from the charter, because every element is a closed token or a checked single-line slot; a linked finding shows its walk entry; an unlinked finding on a pass CARRYING a record is prefixed `[outside the walk record]`; an in-context pass computing VERIFICATION with no record renders `[no verification record]` once, by absence, never by date (D-rc03c-8).
- **The review body gains a VERIFICATION branch.** It reads W's walk records, grades every owed entry over its sweep scope — the entry's `file` plus its `ripple_cascade.applied` (correcting D-rc03-4's `file`-only proxy; a BOUNDED claim with a stated git-diff residual method) — reviews that scope, links findings or leaves them to the mark, and treats a write-gate refusal as the channel that reconciles its rc03b metadata probe with the engine (D-rc03c-6, -9).
- **The gate reads none of it.** `gates.ts` carries no diff; the cadence-slot token is unchanged (R-crc-13; exit (1)).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-emit-composition`: ADDED `The review emit records its pass genre and the walks it verifies` and `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record`; MODIFIED `Generic emit surface with a narrative-only payload contract` (the review payload excerpt names `verification` and the per-finding `walk_entry`).
- `orbit-report-rendering`: ADDED `Verification renders as its own section and its absence is marked`; MODIFIED `Report grammar — the frame sandwiches the commentary` (header pass genre; section order), `Render-time computed context — never stored, never authored` (pass genre computed at render time), `Strict input validation — fail loud, no partial render` (read-side twins for `verification` and `walk_entry`).
- `orbit-review`: ADDED `Verification-genre passes grade the walk record`; MODIFIED `Internal run summary persisted per mode` (names the record and its owners).

Three capabilities — R-crc-1's ceiling, as chartered (D-rc03c-12). `orbit-conventions`' genre table is consumed unchanged; `orbit-address-reviews`' `ripple_cascade` is read unchanged; `orbit-engine-gates` is untouched; no external-format change (a verification is in-context). No `orbit status` genre field (D-rc03c-11).

## Impact

- **Engine**: a new `src/core/artifact-graph/pass-genre.ts`; `src/core/emit-composition.ts` (payload table, two computed extensions, the verification write-gate checks); `src/core/report-render.ts` (header word, section, marks, read-side validation). `src/core/artifact-graph/gates.ts` and `trail.ts` carry no diff.
- **Generated surface**: `src/core/templates/workflows/review.ts` (the VERIFICATION branch; the run-summary schema reference names `verification` and `walk_entry`).
- **Records**: no migration. Prior in-context confirms render `[no verification record]` by absence; their findings are not stamped. Prior-generation emits stay valid on the trail.
- **Q-crc-20 is NOT closed** (D-rc03-15): the sweep scope is the walk's CLAIM of what it touched; it is named as the nearest proxy in Q-crc-20's entry at archive.
- **Exit (3)** is measured on this change's own system-mode in-context confirm, by an instrument stated in design (D-rc03c-10); UNMEASURED is a third outcome, carried forward as a user-validation task, never graded.
