> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc03c-verification-record

## Premise

Stage `rc03c-verification-record` of `orbit/architecture/clean-up-review-cycle.md` — "a verification says what landed and what regressed" — the second child of the split parent `rc03-review-genres` (D-rc03-8), depending on `rc03b-pass-genres` (archived and ratified 2026-10-04). Opened 2026-10-04.

rc03b shipped the pass-genre TABLE (`orbit-conventions`' `Review mode decision framework`, with the QUALIFYING-walk bound and the trail reader's accepted-pass/class rule) and the in-context body's metadata PROBE, and no engine code; it explicitly defines no record field and reserves the name `pass_genre` for one. This stage ships what D-rc03-4 accounted for and was ASSIGNED here: one exported genre function over the trail, stored as a computed extension; the owed `verification` field with its write-gate checks; the `### Verification` render section and its two marks; and the body's verification branch. Mechanism inherited by reference: D-rc03-2 and D-rc03-4 in `orbit/changes/archive/2026-10-04-rc03b-pass-genres/explore.md`, plus D-rc03-13 (multi-source walk mode) and D-rc03-15 (Q-crc-20 not closed; name the proxy at archive). Where this exploration departs from D-rc03-4 it says so in the entry: the walk set is engine-computed and split into its own field (D-rc03c-1), the link is renamed `walk_entry` (D-rc03c-4), the proxy gains the cascade paths (D-rc03c-6), and the section leaves the quarantine (D-rc03c-8).

The first act is to re-read D-rc03-4's Mechanism entry against what rc03b shipped and what the trail records actually hold, before anything is designed.

## Mechanism

### D-rc03c-1 — the walk set is ENGINE-computed with the genre; the AI supplies only verdicts, and the write gate checks them COMPLETE
Domain: every field of the verification record and every check the write gate runs on it
| member | covered by |
|---|---|
| `pass_genre` | computed extension, stored like `iteration`, REFUSED in the payload; one exported function over the trail |
| `verified_walks: [tokens]` | computed extension from the SAME function (the qualifying-walk set W of `orbit-conventions`' pass-genre table), REFUSED in the payload; for an in-context change-mode pass, W non-empty iff `pass_genre` is VERIFICATION |
| `verification: [{title, file, verdict}]` | the payload; the ONE judgement input (R-crc-10); `verdict` ∈ `landed` \| `regressed` |
| owed | `pass_genre` VERIFICATION and `verification` absent → refused |
| shape | refused mis-shaped at ANY genre (rc04b's `direction` pattern) |
| completeness | every OWED entry of W (per D-rc03c-2) carries exactly one verdict → else refused, naming each missing `walk token + (title, file)` |
| strays | a verdict whose key matches no owed entry of W → refused, naming it |
| a key in two walks of W | ONE verdict, judged against the LATEST walk's entry — the verdict is a fact about the artifact NOW (mirrors `passResolved` reading the latest record) |
| an unreadable walk in W | owes nothing (its `entries` are empty); still listed in `verified_walks`; the render row says unreadable — never silently dropped |
| pairing | a `regressed` verdict ↔ a finding carrying `walk_entry: {title, file}` — the link's domain and its checks are D-rc03c-4's |
| a payload `verification` on a REVIEW-genre pass | refused — W is empty, so every entry is a stray |
Closure: DERIVED — the record's fields (two computed, one supplied) × the checks the gate runs on the supplied one, every cell written
Moves:
- READ: applied — `ENGINE_OWNED_EXTRA.review` holds `iteration` (`emit-composition.ts:203`), computed at write from `collectSameModePasses` (`:1320`); `validateReviewDirection` (`:597`) is the owed-plus-shape pattern; `TrailResolution.readable`/`entries` (`trail.ts:69-83`); `recordsFor`/`passResolved` read the latest record per pass (`gates.ts:172-191`)
- ENUMERATE: applied — this table; the duplicate-key and unreadable-walk rows are the members the charter's shape left implicit
- COHERE: applied — the charter's `verification: {walks, resolutions}` mixes an engine-owned key with an AI-owned one inside one object; the payload gate refuses only TOP-LEVEL engine fields, so the record splits into two computed top-level fields and one supplied one (a DEPARTURE from the charter's text, recorded here; exit (2) is measured unchanged)
- EXECUTE: applied — against rc03b's system trail: latest accepted independent pass `external-system-2026-10-04T03-57-21Z`; walks after it `04-08-51Z` (source the fresh pass) and `04-12-35Z` (source the external) → W = both for the confirm at `04-16-02Z`; owed entries 7 + 2 resolved (the one `stale` excluded per D-rc03c-2) = 9 verdicts
- FALSIFY: applied — completeness proves every owed entry got a WORD, never that the word is TRUE; a `landed` written without reading the artifact passes the gate. That is the judgement R-crc-10 leaves to the record; the render rows make it citable
- CONFORM: applied — R-crc-10 (engine-observable → engine-computed; the judgement is recorded), R-crc-13 (the gate graph reads none of it; the WRITE gate checks shape and existence only), R-crc-14 (one computation of W; nothing restates it), Q-crc-17 (no hand-typed walk tokens)
- FEASIBILITY: applied — one filter over `trail.resolutions` the trail reader already builds; no new read
- CONSUME: applied — the renderer (a `### Verification` row per verdict plus one per unreadable walk), the readiness author citing the pass token; the refusal message is itself a consumer path — it tells the AI the owed set, so the body need not compute W in advance (weakens the case for an `orbit status` genre field)
- INVOKE: applied — every `orbit emit review`; the genre function runs on every review emit, the completeness check only when `pass_genre` is VERIFICATION

### D-rc03c-2 — only a `resolved` walk entry owes a verdict, at every severity
Domain: the walk record's four dispositions (`Disposition` in `trail.ts`) × severity
| member | covered by |
|---|---|
| `resolved`, any severity | OWES one verdict — the walk claims an edit landed; SUGGESTION edits included, because verification checks what the walk EDITED, not what gates |
| `stale` | owes nothing — the walk claims NO edit was needed (pushback with evidence); there is nothing to land |
| `deferred` | owes nothing — no edit made |
| `escalated` | owes nothing — handed to the user, no edit made |
Closure: SOURCED — `Disposition = 'resolved' \| 'stale' \| 'deferred' \| 'escalated'` (`trail.ts:25`), and a readable record carries only recognised dispositions and severities
Moves:
- READ: applied — the type and the readability predicate (`trail.ts:25-26, 69-83`); rc03b's walk `04-12-35Z` carries one `stale` WARNING among three entries — the outcome mix is real, not hypothetical
- ENUMERATE: applied — this table, four dispositions; severity is not a partition (every severity of a `resolved` entry owes)
- COHERE: applied — `landed` \| `regressed` is the closed pair the charter fixes, and it is only meaningful where an edit was claimed; restricting the owed set keeps the pair closed instead of widening it per outcome
- EXECUTE: applied — rc03b's confirm: 9 owed of 10 entries
- FALSIFY: applied — a WRONG `stale` call (pushback that dismissed a real finding) escapes the record; if the verification pass finds it, that finding carries no `regresses` and renders `[outside the walk record]`, a false signal against exit (3). Covered by D-rc03c-4: the finding links to the `stale` entry through `walk_entry`, which may name ANY entry of W, so it is against the walk record and unmarked
- CONFORM: applied — R-crc-6 (the walk authors nothing; only `resolved` entries claim authored edits), R-crc-10
- FEASIBILITY: not applied — a filter on one field
- CONSUME: applied — D-rc03c-1's completeness and stray checks read this set as their domain
- INVOKE: applied — whenever D-rc03c-1's completeness check runs

### D-rc03c-3 — `landed` means the resolution's edit HOLDS on the artifact; `regressed` means it does not, for any cause
Domain: every state a `resolved` entry's edit can be in when the verification pass reads the artifact
| member | covered by |
|---|---|
| the edit is present, complete, and the finding no longer reproduces; the edit introduced no defect | `landed` |
| the edit is absent, or stops short of a site the resolution claims (rc16's confirm: one artifact short) | `regressed` — the paired finding says what is missing |
| the edit is present and introduced a defect (an error IN the walk's own addition) | `regressed` — the paired finding names the defect |
| the edit landed and a LATER edit (another resolution, a cascade) undid or contradicted it | `regressed` — judged against the artifact NOW, per D-rc03c-1's latest-walk row |
| the verification pass cannot decide (the site is unreadable, the claim is ambiguous) | `regressed` with a finding saying so — the pair is CLOSED; an undecidable claim is not a held one |
Closure: DERIVED — "holds" is the conjunction (present AND complete AND clean AND not undone); its negation is partitioned by which conjunct fails, plus the undecidable case
Moves:
- READ: applied — the program doc's own wording of the verification (`clean-up-review-cycle.md`, rc03 charter: "is the removal complete, did anything else regress") already names two of the four failure conjuncts; `regresses` appears nowhere in `orbit/specs/` or `src/` (grep 2026-10-04), so no shipped meaning is moved
- ENUMERATE: applied — this table; the undecidable row is the member a two-word vocabulary invites leaving implicit
- COHERE: applied — `landed` includes "clean", so a `landed` verdict paired with a finding is a contradiction D-rc03c-4 refuses; the two words partition every state
- EXECUTE: applied — rc16's confirm (re-point one artifact short) → row 2; rc03b's confirm (four cascade gaps closed at walk 3) → row 2 on each; rc04b's confirm (three SUGGESTIONs in the walks' additions) → row 3 at SUGGESTION severity
- FALSIFY: applied — one word for four causes loses which conjunct failed; the paired finding's text carries the cause, and a per-cause vocabulary was considered and rejected (Considered & out)
- CONFORM: applied — the charter's closed pair and exit (2)'s words are kept verbatim; R-crc-14 (the definition is stated ONCE, in the capability owning the field's shape, `orbit-emit-composition`; the body and renderer point)
- FEASIBILITY: not applied — a definition
- CONSUME: applied — the readiness author reads `regressed` as "this resolution is not done" whatever the cause; the next walk treats the paired finding as an ordinary finding
- INVOKE: applied — every verdict the verification pass writes

### D-rc03c-4 — a finding links to the walk record through `walk_entry`, which may name ANY entry of W
Domain: every finding a VERIFICATION-genre pass writes, by what it is about
| member | covered by |
|---|---|
| a defect in a `resolved` entry's edit | `walk_entry` names that entry; its verdict MUST be `regressed` (a `landed` verdict paired with a finding is refused — D-rc03c-3's COHERE) |
| a `stale` call that dismissed a real finding | `walk_entry` names the `stale` entry; no verdict exists to agree with (Q-rc03c-1, resolved here) |
| a `deferred` or `escalated` entry the pass finds still harmful | `walk_entry` names it — permitted, harmless; the deferral stays the user's |
| a defect in walk-added text no single resolution claims | not a member under R-crc-6: a walk authors nothing beyond its resolutions and their cascades, so every edit traces to ONE entry; the author names the entry whose edit (or cascade) introduced it |
| a defect unrelated to any walk entry | no `walk_entry` → the renderer marks `[outside the walk record]`, never refused (R-crc-13); exit (3) counts these at WARNING+ |
| `walk_entry` naming a key that is in no walk of W | refused — existence over trail facts |
| a `regressed` verdict with no finding naming it | refused — existence, the charter's other direction |
| `walk_entry` on a REVIEW-genre pass | refused — W is empty, so it names nothing |
Closure: DERIVED — a finding is either about a walk entry (partitioned by the entry's disposition and verdict) or about none; the three refusals are the existence checks over W
Moves:
- READ: applied — `Disposition` (`trail.ts:25`); R-crc-6's walk lanes (repair / descope / redesign) author no mechanism of their own, so the attribution row is grounded in a ruling, not a hope
- ENUMERATE: applied — this table; the `stale` row is Q-rc03c-1, the `deferred`/`escalated` row the member the question's framing omitted
- COHERE: applied — the field is RENAMED from the charter's `regresses` to `walk_entry`: a link to a `stale` entry is not a regression, and a name that says "regresses" on it would assert a verdict the entry does not carry. `regressed` stays the verdict word; `walk_entry` is only the link
- EXECUTE: applied — the hypothetical wrong-stale case: entry (`T`, `F`, stale) in W; the pass writes finding X with `walk_entry: {title: T, file: F}` → accepted, unmarked, outside exit (3)'s count; the same finding without the key → marked, counted
- FALSIFY: applied — an author can attach `walk_entry` to an unrelated finding to dodge the mark; existence is checked, relevance is not (R-crc-10: the link is a judgement, recorded and citable). Bounded by the render showing the link beside the finding
- CONFORM: applied — R-crc-6, R-crc-10, R-crc-13 (refusals are shape and existence at the write gate; the gate graph reads none), R-crc-14 (the link's rules live with the field's owner)
- FEASIBILITY: not applied — one lookup per finding over W's entries
- CONSUME: applied — the renderer (no mark when linked; the link rendered beside the finding), exit (3)'s measurement (counts unlinked WARNING+), the next walk (an ordinary finding)
- INVOKE: applied — every finding on a VERIFICATION-genre emit

### D-rc03c-5 — the walk set W is the pass-genre table's qualifying set, unnarrowed; a second confirm RE-VERIFIES earlier walks
Domain: every trail position an in-context change-mode pass can hold relative to earlier verification passes
| member | covered by |
|---|---|
| first in-context pass after the pair's walks | W = the walks after the latest accepted independent pass — the table's set |
| a second in-context pass after a walk of the first confirm's findings | W = walks 1..n INCLUDING the confirm's walk; earlier entries are re-graded against the artifact NOW (D-rc03c-1's latest-walk row) |
| a second in-context pass with NO walk since the first confirm | still VERIFICATION by the table (walks 1..n qualify); W unchanged; re-grading is the whole of the pass |
| a new independent pass lands after a confirm | the lower bound moves past it; W restarts from that pass |
Closure: DERIVED — W is a function of (latest accepted independent token, walk tokens, pass token); every ordering of a confirm against those is a row
Moves:
- READ: applied — `orbit-conventions`' qualifying-walk definition (lower bound = the latest ACCEPTED independent pass of the mode; no reference to verification passes)
- ENUMERATE: applied — this table; the "no walk since the first confirm" row is the member that breaks narrowing
- COHERE: applied — narrowing W to walks after the latest VERIFICATION pass would make that third row VERIFICATION with an EMPTY owed set, contradicting D-rc03c-1's "W non-empty iff VERIFICATION"; it would also change the owner table (a fourth capability). Unnarrowed, the two stay one computation
- EXECUTE: applied — rc03b's trail had one confirm and archived after walk 3, so no case on record; constructed case: confirm 1 grades walk-1 entry E `regressed`, walk 3 repairs it, confirm 2 owes E again and grades it `landed` — the latest verdict tells the readiness author E is done
- FALSIFY: applied — re-grading costs one verdict line per earlier entry; what it buys is the "not undone" conjunct of D-rc03c-3, which only a later read can check
- CONFORM: applied — R-crc-14 (one definition of W, owned by `orbit-conventions`, unchanged), R-crc-1 (no fourth capability)
- FEASIBILITY: applied — on record, confirms rarely repeat (rc03b: one); re-grading is bounded by W's resolved entries
- CONSUME: applied — D-rc03c-1's completeness check; the renderer's rows carry each entry's walk token, so a reader sees which walk an entry came from
- INVOKE: applied — whenever the genre computes VERIFICATION

### D-rc03c-6 — the sweep scope is each resolved entry's `file` plus its `ripple_cascade.applied`, read by the body; a BOUNDED proxy for the walk's diff
Domain: every file a walk can have edited
| member | covered by |
|---|---|
| the finding's own file | the entry's `file` |
| files the cascade edited | the entry's `ripple_cascade.applied` — specified by `orbit-address-reviews` ("cascaded files are recorded in `ripple_cascade.applied`") |
| files the cascade flagged but did not edit | out — `ripple_cascade.flagged_not_applied` records non-edits |
| a resolved entry carrying no `ripple_cascade` | its `file` only; the residual below |
| an edit made outside any walk entry (by hand, between walks) | the residual below |
Closure: BOUNDED — the walk record is a claim about what was edited, not an observation of the tree
Residual kind: an edit the walk record does not list — a resolved entry written without `ripple_cascade` (126 of 986 resolved entries across the archive, 2026-10-04), an edit made outside the walk's log, or a cascade path recorded wrongly
Residual method: at the verification pass, compare the scope against `git diff --name-only` of the working tree and of the commits since the latest accepted independent pass's token, and name any file in the diff but outside the scope as a finding without `walk_entry` — it is then counted by the mark
Moves:
- READ: applied — the rc03b walk entry carries `ripple_cascade.applied` (five paths) beside `file`; `orbit-address-reviews` spec line 255 specifies the field; the archive count (860 of 986 resolved entries carry it) measured by script 2026-10-04. This CORRECTS D-rc03-4's "union of `resolutions[].file`", which read only the trail reader's normalized entry and missed the cascade
- ENUMERATE: applied — this table
- COHERE: applied — the scope is the BODY's sweep input, not an engine check: no write-gate rule reads it, so the trail reader is not widened (`TrailResolutionEntry` keeps four fields; `trail.ts` needs no diff for this)
- EXECUTE: applied — rc03b's walk `04-08-51Z` first entry: scope = `review.ts` ∪ five cascade paths (two delta specs, design, a test); `file` alone would have swept one of six
- FALSIFY: applied — Q-crc-20 is still NOT closed: the scope is the walk's CLAIM of what it touched, and a verification is in-context; named so at archive in Q-crc-20's entry (D-rc03-15)
- CONFORM: applied — R-crc-10 (a claim read as a claim; the residual method is the one place it meets the tree), R-crc-14 (`orbit-address-reviews` owns the field; the body points)
- FEASIBILITY: not applied — a union of short lists
- CONSUME: applied — the body's sweep (D-rc03c-9); the Q-crc-20 archive note
- INVOKE: applied — every VERIFICATION-genre pass

### D-rc03c-7 — the genre function lives OUTSIDE `gates.ts`, resolves a walk's mode through the trail's ACCEPTED pass set, and the report RECOMPUTES it at render time
Domain: every input and placement decision of the one exported function
| member | covered by |
|---|---|
| placement | a new module beside `trail.ts` (e.g. `src/core/artifact-graph/pass-genre.ts`), importing `isIndependent` — exit (1) requires `gates.ts` to carry no diff |
| a walk whose source names an ACCEPTED pass of mode M | a walk of mode M |
| a walk whose source names a REJECTED external return, or no pass on the trail | MODE-LESS — qualifies for no mode (the table's mode-less row; consistent with "accepted" in the lower bound) |
| a walk with a null `sourcePath` (marker scan) | MODE-LESS |
| a multi-source walk (after rc08 widens `sourcePath`) | the mode every source shares, MODE-LESS otherwise (D-rc03-13) — not reachable today |
| the stored value | written once at emit time, like `iteration` |
| the report header | recomputed at render time from the trail (`orbit-report-rendering`'s render-time requirement); with tokens strictly ordered, both read only tokens before the pass's own, so they agree on any trail not edited by hand |
| a pre-rc03c emit | no stored value; the report computes it anyway — by absence, never by date |
Closure: DERIVED — the function's inputs are the trail reader's pass set, its resolution records and the pass's own (class, mode, token); each input's cases are rows
Moves:
- READ: applied — `recordsFor` matches walks to passes by the source's basename (`gates.ts:172-177`); the trail reader excludes `review-external-*.json` T0 records and parses only `external-(proposal|system)-<TS>.md` (`trail.ts:177-194`); rejected returns are carried separately (`RejectedExternal`)
- ENUMERATE: applied — this table; the rejected-external row is where a filename-pattern resolution and an accepted-set resolution disagree
- COHERE: applied — resolving through the accepted set matches the lower bound's "accepted"; resolving by filename would let a rejected return's walk qualify while the return itself does not bound
- EXECUTE: applied — rc03b's trail: walk `04-08-51Z` → `review-system-…03-55-35Z` (accepted, fresh, system) → system; walk `04-12-35Z` → `external-system-…03-57-21Z` (accepted) → system
- FALSIFY: applied — the body's metadata probe (rc03b) treats every external file as a pass; where it disagrees with this function, the write gate's owed/stray refusals (D-rc03c-1) surface it and the engine is authoritative, as the owner already states
- CONFORM: applied — R-crc-13 (the gate graph does not import it), R-crc-14 (the table is `orbit-conventions`'; the function implements it and restates nothing), the D4 render-time rule
- FEASIBILITY: not applied — one pass over a trail already read
- CONSUME: applied — the write gate, the renderer, and JSON readers of the stored field
- INVOKE: applied — every `orbit emit review` and every `--report` render

### D-rc03c-8 — the report renders the pass genre in the header, a `### Verification` section of engine-printed rows, and two marks by absence
Domain: every rendering the verification record produces
| member | covered by |
|---|---|
| the header | the pass genre word, both render genres (an external pass computes REVIEW) |
| `### Verification` placement | after `### Suppressed`, BEFORE `### Direction` — OUTSIDE the prose quarantine: every element is a closed token or a single-line checked slot (a DEPARTURE from the charter's "inside the quarantine", recorded here) |
| a verdict row | `- landed — <title> (<file>) · walk <token>` / `- regressed — … · see: <linked finding title(s)>`; the walk token and the linked findings are ENGINE-derived, the verdict token is the AI's |
| an unreadable walk in W | one row: `- walk <token> — unreadable; nothing owed` |
| an in-context pass computing VERIFICATION with no record | the section renders the single line `[no verification record]` (pre-rc03c emits only — the write gate refuses new ones) |
| a finding with `walk_entry` | an engine line under it: `walk entry: <title> (<file>)` |
| a finding without `walk_entry` on a pass CARRYING a record | the `[outside the walk record]` prefix outside the title token (rc02b's `[unreproduced]` pattern); never refused, changes no count |
| a finding on a pass WITHOUT a record | no per-finding mark — the pass-level `[no verification record]` already says it; nine prior confirms are not stamped finding by finding |
| a REVIEW-genre pass | no section, no marks |
Closure: DERIVED — (genre) × (record present / absent) × (row kind), every cell written
Moves:
- READ: applied — `orbit-report-rendering`'s section order (Suppressed → Direction → Commentary), its quarantine definition (prose slots: direction's reasoning and commentary), rc02b's prefix-mark pattern, and the render-time computed context requirement
- ENUMERATE: applied — this table; the "finding on a pass without a record" row is the member that would otherwise stamp every historical confirm finding
- COHERE: applied — the quarantine holds model-variance PROSE; rows of closed tokens and checked single-line titles are frame, like the findings sections, so the section sits in the frame
- EXECUTE: applied — rc03b's confirm re-rendered under this: `[no verification record]` in the section, no per-finding marks; a new emit on the same trail with 9 verdicts → 9 rows
- FALSIFY: applied — a row says what the AI claimed; whether `landed` is true is not rendered and cannot be (D-rc03c-1's FALSIFY)
- CONFORM: applied — R-crc-13 (marks change no count and no gate input), R-crc-14 (the render rules are `orbit-report-rendering`'s; the verdict definition is `orbit-emit-composition`'s), by-absence-never-by-date
- FEASIBILITY: not applied — a fixed number of rows per verdict
- CONSUME: applied — the human reader, the readiness author citing the token, exit (3)'s count (the mark is the countable thing)
- INVOKE: applied — every `--report` render of a review pass

### D-rc03c-9 — the review body's VERIFICATION branch reads W's walk records, grades every owed entry over its sweep scope, then reviews the scope; findings link or are marked
Domain: every step of an in-context pass whose genre is VERIFICATION
| member | covered by |
|---|---|
| learning the genre | rc03b's metadata probe, unchanged; the write gate is authoritative (D-rc03c-7) |
| reading | the walk records of W — a VERIFICATION-genre read; the brief rule restricts only REVIEW-genre briefs |
| grading | each `resolved` entry (D-rc03c-2) against the artifact at its sweep scope (D-rc03c-6), one verdict per key (D-rc03c-1), by D-rc03c-3's definition |
| reviewing | the passes the body already runs, scoped to the union of the sweep scopes, plus the residual check (D-rc03c-6's method) |
| findings | each links `walk_entry` when it is about an entry (D-rc03c-4); otherwise it stands unmarked in the payload and the renderer marks it |
| a refusal from the write gate | read the named keys, grade or drop them, re-emit — the refusal is the channel that reconciles the probe with the engine |
| architecture mode | not a member — REVIEW by the table |
Closure: SOURCED — the steps are the pass's inputs (genre, W, scope) and outputs (verdicts, findings, emit) as D-rc03c-1..8 define them
Moves:
- READ: applied — the body today runs the in-context confirm as "verify every walk resolution landed, then the nine passes over the walks' additions" (rc03b's walk-3 record; the practice since rc13a)
- ENUMERATE: applied — this table
- COHERE: applied — the step order matches the record: verdicts first (owed), findings second (linked)
- EXECUTE: applied — rc03b's confirm found four cascade gaps: under this branch, four `regressed` verdicts each with a linked finding, zero marks
- FALSIFY: applied — the body can run a whole-artifact re-review anyway; the `[outside the walk record]` marks make that visible, which is the charter's stated intent
- CONFORM: applied — R-crc-11(f) (the in-context pass is the reacting class), R-crc-14 (the body names the owners — `orbit-conventions` for the table, `orbit-emit-composition` for the record — and restates neither)
- FEASIBILITY: applied — bounded by W's resolved entries and their scopes
- CONSUME: applied — `orbit emit review` (the write gate), the next walk (linked findings are ordinary findings)
- INVOKE: applied — the body's in-context branch, in proposal or system mode, when the probe reads VERIFICATION

### D-rc03c-10 — exit (3) is measured on rc03c's OWN system-mode in-context confirm, by a stated command over the emit
Domain: every outcome the measurement can return
| member | covered by |
|---|---|
| the confirm computes VERIFICATION and every WARNING+ finding has `walk_entry` | MET |
| it computes VERIFICATION and some WARNING+ finding lacks `walk_entry` | MISS — a criterion the mechanism measures and does not meet (R-crc-12) |
| it computes REVIEW (no walk preceded it) | UNMEASURED — not met and not missed; carried to the next stage's confirm as a user-validation task, named at archive |
| no system-mode in-context pass runs | UNMEASURED, as above |
Closure: DERIVED — the instrument's two inputs (stored `pass_genre`; per-finding severity and `walk_entry`) and their combinations
Moves:
- READ: applied — the exit text: "the next cadence's verification record carries zero findings marked `[outside the walk record]` at WARNING or above, measured on the record"; rc03b's task 3.5 and rc04b's 4.5 closed at archive by observation on the stage's own cadence
- ENUMERATE: applied — this table; the UNMEASURED rows are the ones an instrument written later tends to grade silently
- COHERE: applied — "the next cadence" read as the first cadence run under the shipped mechanism, which is rc03c's own post-apply confirm (the proposal-mode confirm runs before the code exists)
- EXECUTE: applied — the instrument, stated now so it cannot be bent at archive (R-crc-12's instrument lesson): over the confirm's emit JSON, `pass_genre === 'VERIFICATION'` and `findings.filter(f => (f.severity === 'CRITICAL' \|\| f.severity === 'WARNING') && !f.walk_entry).length === 0`; cross-checked by `grep -c '\[outside the walk record\]'` on its rendered report over WARNING+ rows
- FALSIFY: applied — zero could come from `walk_entry` attached to unrelated findings (D-rc03c-4's FALSIFY); the readiness record reads the links, the count does not
- CONFORM: applied — R-crc-12 (the criterion is graded as written; UNMEASURED is neither a revision nor a miss and is said)
- FEASIBILITY: not applied — one script over one file
- CONSUME: applied — the archive emit's readiness record and the architect's ratification offer
- INVOKE: applied — a user-validation task in tasks.md, closed at archive by observation (the `(User-validation` line marker)

## Decisions

- **2026-10-04 — D-rc03c-1: the walk set is ENGINE-computed with the genre; the AI supplies only verdicts, and the write gate checks them COMPLETE** — `pass_genre` and `verified_walks` are computed extensions from ONE exported function (refused in the payload); `verification: [{title, file, verdict}]` is the payload's only judgement input; the write gate refuses it absent when owed, mis-shaped at any genre, incomplete over the owed entries, or carrying strays, and its refusal names the missing keys with their walk tokens. A DEPARTURE from the charter's `verification: {walks, resolutions}` shape (a mixed-owner object the payload gate cannot refuse in part); exit (2) is unchanged. Supersedes D-rc03-4's "named by token in `verification.walks`" row. Rationale: W is the genre computation's own intermediate, so an AI-typed copy is a second statement of one fact (R-crc-14) and the Q-crc-17 failure mode; with completeness checked, the refusal tells the AI the owed set, so no pre-pass surface is needed for correctness.
  Kind: rule
- **2026-10-04 — D-rc03c-2: only a `resolved` walk entry owes a verdict, at every severity** — settles gap 1. `stale`, `deferred` and `escalated` claim no edit, so `landed` \| `regressed` has nothing to grade; the closed pair stays closed. SUGGESTION-severity `resolved` entries owe, because the record is about what the walk edited, not what gates.
  Kind: rule
- **2026-10-04 — D-rc03c-3: `landed` means the resolution's edit HOLDS on the artifact; `regressed` means it does not, for any cause** — settles gap 4. "Holds" = present AND complete AND clean AND not undone by a later edit; any failed conjunct, or a claim the pass cannot decide, is `regressed`, and the paired finding states the cause. The charter's closed pair and exit (2)'s words are kept.
  Kind: rule
- **2026-10-04 — D-rc03c-4: a finding links to the walk record through `walk_entry`, which may name ANY entry of W** — resolves Q-rc03c-1. A finding about a `stale` (or `deferred`/`escalated`) entry links to it and is not marked `[outside the walk record]`; a finding naming a `resolved` entry requires that entry's verdict be `regressed`; a `regressed` verdict requires a finding naming it; a link to a key outside W is refused. The charter's field name `regresses` is RENAMED (it appears in no shipped spec or source): a link to a `stale` entry is not a regression.
  Kind: rule
- **2026-10-04 — D-rc03c-5: the walk set W is the pass-genre table's qualifying set, unnarrowed; a second confirm RE-VERIFIES earlier walks** — settles gap 5. Narrowing to walks after the latest verification pass would give a VERIFICATION genre an empty owed set and change `orbit-conventions`' table; re-grading buys D-rc03c-3's "not undone" conjunct.
  Kind: rule
- **2026-10-04 — D-rc03c-6: the sweep scope is each resolved entry's `file` plus its `ripple_cascade.applied`, read by the body; a BOUNDED proxy for the walk's diff** — settles gap 3, and CORRECTS D-rc03-4's `resolutions[].file` union: the walk record already carries cascade paths (860 of 986 resolved entries across the archive). The engine does not compute it; the residual and its method (a `git diff --name-only` comparison) are in the Mechanism entry; Q-crc-20 is still not closed.
  Kind: rule
- **2026-10-04 — D-rc03c-7: the genre function lives OUTSIDE `gates.ts`, resolves a walk's mode through the trail's ACCEPTED pass set, and the report RECOMPUTES it at render time** — a walk of a rejected external return is MODE-LESS; the stored value is written once like `iteration`; pre-rc03c emits get the computed value by absence.
  Kind: rule
- **2026-10-04 — D-rc03c-8: the report renders the pass genre in the header, a `### Verification` section of engine-printed rows, and two marks by absence** — the section sits after `### Suppressed` and before `### Direction`, OUTSIDE the prose quarantine (a departure from the charter: every element is a closed token or a checked single-line slot); `[outside the walk record]` is a per-finding prefix ONLY on a pass carrying a record; a pass computing VERIFICATION without one gets the single pass-level `[no verification record]`.
  Kind: rule
- **2026-10-04 — D-rc03c-9: the review body's VERIFICATION branch reads W's walk records, grades every owed entry over its sweep scope, then reviews the scope; findings link or are marked** — the rc03b probe is kept for learning the genre; the write gate's refusal is the reconciling channel.
  Kind: rule
- **2026-10-04 — D-rc03c-10: exit (3) is measured on rc03c's OWN system-mode in-context confirm, by a stated command over the emit** — MET / MISS / UNMEASURED, with UNMEASURED carried forward as a user-validation task rather than graded; the instrument is written into the Mechanism entry now.
  Kind: rule
- **2026-10-04 — D-rc03c-11: no `orbit status` field for the next pass's genre** — the write gate names the owed set (D-rc03c-1), so the field would be a convenience and not a correctness need, and it would add a fourth capability (`orbit-orientation` or `orbit-engine-gates`).
  Kind: scope
- **2026-10-04 — D-rc03c-12: the stage stays at R-crc-1's ceiling — three capabilities, as chartered** — `orbit-emit-composition` (the two computed fields, `verification`, `walk_entry`, every write-gate check, D-rc03c-3's definition — stated ONCE there), `orbit-report-rendering` (header word, section, both marks, the link line), `orbit-review` (the VERIFICATION branch and its schema-reference fields). Measured against the other candidates: `orbit-conventions`' table is consumed unchanged (D-rc03c-5); `orbit-address-reviews`' `ripple_cascade` is read unchanged (D-rc03c-6); `orbit-engine-gates` is untouched (exit (1)); no external-format change (a verification is in-context).
  Kind: scope

## Open questions

## Considered & out

- **2026-10-04 — the AI names the walks it verified** (the charter's `verification.walks`): out — a hand-typed copy of an engine-computed set (D-rc03c-1).
- **2026-10-04 — a per-disposition verdict vocabulary** (e.g. `still-stale` for a `stale` entry): out — widens a closed pair to grade outcomes that claim no edit (D-rc03c-2).
- **2026-10-04 — keying verdicts by (walk, title, file)**: out — reintroduces a hand-typed token per entry; one verdict per key judged against the latest walk (D-rc03c-1).
- **2026-10-04 — a per-cause verdict vocabulary** (`not-landed` / `incomplete` / `regressed` / `undone`): out — the charter fixes a closed pair and the cause rides the paired finding's text (D-rc03c-3).
- **2026-10-04 — keeping the name `regresses` and restricting it to `regressed` verdicts**: out — leaves a wrong `stale` call with no link, a false signal against exit (3) (D-rc03c-4).
- **2026-10-04 — a multi-entry `walk_entry` (array)**: out — under R-crc-6 every walk edit traces to one entry (D-rc03c-4).
- **2026-10-04 — narrowing W to walks after the latest verification pass**: out — empty owed set under a VERIFICATION genre; a fourth capability (D-rc03c-5).
- **2026-10-04 — the engine computing the sweep scope as a stored field**: out — no check reads it; the body reads the walk records it already reads (D-rc03c-6).
- **2026-10-04 — resolving a walk's mode from its source FILENAME**: out — a rejected external's walk would qualify while the return does not bound (D-rc03c-7).
- **2026-10-04 — `### Verification` inside the prose quarantine** (the charter's placement): out — its rows are closed tokens and checked slots, which are frame (D-rc03c-8).
- **2026-10-04 — per-finding `[outside the walk record]` on historical confirms**: out — the pass-level `[no verification record]` says it once (D-rc03c-8).

## References

- `orbit/architecture/clean-up-review-cycle.md` — the stage section (charter, exit criteria) and Q-crc-20
- `orbit/changes/archive/2026-10-04-rc03b-pass-genres/explore.md` — D-rc03-2, D-rc03-4 (Mechanism entries), D-rc03-13, D-rc03-15
- `orbit/specs/orbit-conventions/spec.md` — `Review mode decision framework` (the pass-genre table, owner)
- `src/core/artifact-graph/trail.ts` — `TrailPass`, `TrailResolution`, `TrailResolutionEntry`, `Disposition`
- `src/core/artifact-graph/gates.ts` — `recordsFor`, `passResolved` (the resolution key), `isIndependent`
- `src/core/emit-composition.ts` — `direction` write-gate pattern; `iteration` computed extension
- `orbit/specs/orbit-address-reviews/spec.md` — `ripple_cascade.applied` / `flagged_not_applied` (line 255 ff.)
- `orbit/specs/orbit-report-rendering/spec.md` — render-time computed context; quarantine; Direction section order; rc02b prefix marks
- `orbit/changes/archive/2026-10-04-rc03b-pass-genres/.orbit-runs/` — the worked trail (fresh `03-55-35Z`, external `03-57-21Z`, walks `04-08-51Z`/`04-12-35Z`, confirm `04-16-02Z`, walk `04-18-05Z`)
