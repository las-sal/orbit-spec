> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc03-review-genres

## Premise

Stage `rc03-review-genres` of `orbit/architecture/clean-up-review-cycle.md` — "review is not verification" — the head of Phase 2, promoted by R-crc-11, the only unshipped stage under Goal G1, and the sole blocker of `rc08-walk-completeness`. Opened 2026-10-04 from the architect session that ratified rc04b, where the engine's status log named it next in dependency order (depends only on rc02, complete).

The charter was written 2026-09-11 and amended through 2026-09-21. Since then four stages shipped pieces of it or retired the ground under parts of it, so the exploration's FIRST act is to re-measure the residual charter against the shipped tree before anything is designed:

- **Already shipped elsewhere.** The forward RECOMMENDATION (R-crc-11(g)) is rc04b's `direction` slot, owed by every independent pass in every mode. The pair's classes are HARDCODED one `fresh` + one `external` by rc02 and recorded as permanent in R-crc-4's amendment. The `blind-pair` cadence slot, its blindness predicate and its open-pair recommendation are rc02's (`gates.ts`). The severity ladder the prompt carries is rc02b's checked mirror.
- **Retired ground.** The charter's "REMOVAL IS CONFIRMED BY VERIFICATION, NOT BY ANOTHER REVIEW" paragraph argues against a gate rule that no longer exists: rc02c retired clause (c) ("a CRITICAL buys one further independent pass"), so the gate never asks for another review after a walk. Whatever justifies a VERIFICATION genre now has to be re-derived — the live candidates are Q-crc-20 (a gate passes over a tree no independent pass read when the walk AUTHORS) and the observed practice that every rc-stage's in-context confirm has been an unnamed verification over "the walks' own additions".
- **Still live, verified on the shipped tree 2026-10-04.** (1) The anchoring channel: `orbit-review-external`'s `Cycle context populated from prior runs` SHALL-includes prior open findings and the review body's prompt template carries `Resolved since last review` — rc04b's real system prompt listed the three walk logs there. The gate's blindness predicate reads walk records, not prompt content, so it certifies an anchored pair as blind. (2) The producer/consumer gap: the pair is launched as two invocations with the walk-recommending window between them (Q-crc-22; the charter's "one invocation launches both halves"). (3) The nomenclature inversion: `orbit-review`'s `--fresh` requirement still describes `--reviewer external` as "same model, fresh context, no cross-AI handoff" — `fresh`'s definition on the wrong noun. (4) The disagreement class has no name and no handling rule. (5) The schema's `review-system` cadence reads `[blind-pair, in-context]`; the charter's exit (1) wants `blind-pair → walk → verification`.

Sizing is the second act: even after subtraction the list touches `orbit-review`, `orbit-review-external`, `orbit-address-reviews`, the schema and `orbit-engine-gates`' cadence vocabulary. R-crc-1's ceiling is three capabilities. The charter itself hints at the cut (the genre split and the prompt attestation are separable); rc04d's preventive split at exploration is the precedent, and this exploration measures before it proposes.

## Mechanism

### D-rc03-2 — a pass's GENRE is computed from class, mode and trail position; never declared
Domain: every (reviewer class × mode × trail position) a review emit can be written under
| member | covered by |
|---|---|
| `fresh` or `external`, proposal or system, any position | REVIEW — the independent classes read the whole artifact (R-crc-4) |
| `in-context`, proposal or system, a walk record of THIS mode precedes the pass on the trail | VERIFICATION — the pass reads that walk and answers landed / regressed (R-crc-11(f)) |
| `in-context`, proposal or system, no walk record of this mode precedes it | REVIEW — the cadence does not count it toward its `in-context` slot, and it owes nothing; recorded as what it is |
| `in-context`, proposal or system, the only preceding walks are MODE-LESS (a marker-scan walk, `sourcePath` null) | REVIEW — a walk whose mode cannot be read does not count; declared, so the derivation is total when rc08 widens `sourcePath` |
| `in-context` or `fresh`, architecture mode | REVIEW — the architecture trail carries no walk records a change-mode cadence reads; the mode has no gate |
| `external`, architecture mode | not a member — refused today by `orbit-review`'s mode constraint |
Closure: DERIVED — three classes × three modes × the two-valued "a readable walk of this mode precedes the token" fact, every cell written
Moves:
- READ: applied — `TrailPass.reviewerClass`, `TrailPass.mode`, `TrailResolution.sourcePath` and token ordering are the four trail facts (`src/core/artifact-graph/trail.ts:44-88`); `iteration` is already a stored computed extension on the review emit (`emit-composition.ts:204, 1314`), the precedent this follows (Case 4)
- ENUMERATE: applied — this table; the mode-less walk row was the cell the first draft left implicit
- COHERE: applied — the gate is untouched: genre is a RECORD on the emit and a header on the report, and the `in-context` cadence slot still counts any in-context pass (R-crc-13); exit (1)'s slot wording is revised under R-crc-12, not met by renaming a token
- EXECUTE: applied — against rc04b's system trail: external and fresh → REVIEW; `review-system-2026-10-04T01-04-14Z` (in-context, two walk logs of system mode before it) → VERIFICATION, which is what that pass actually did (0C/0W/3S over the walks' additions)
- FALSIFY: applied — a pass could be correctly classed VERIFICATION and still re-review the whole tree; the genre does not stop that, the owed `verification` field (D-rc03-4) and the render mark are what make the drift visible
- CONFORM: applied — R-crc-10 (every input is a trail fact), R-crc-13 (reports, never rules), R-crc-14 (the table lives ONCE in `orbit-conventions`, replacing the stale `Review mode decision framework`; bodies and the renderer point)
- FEASIBILITY: not applied — one function over an already-read trail
- CONSUME: applied — two consumers: the write gate (owes `verification` when VERIFICATION) and the renderer (header word; `[no verification record]` by absence on a pre-rc03 in-context pass that computes VERIFICATION)
- INVOKE: applied — fires on every `orbit emit review` and every `--report` render; nothing new has to be run

### D-rc03-3 — a REVIEW-genre brief carries NO findings and NO trail pointer
Domain: every instruction in the review body that hands a review-genre reviewer prior findings or the change's trail (rc03a Case 3, re-enumerated from the current source 2026-10-04)
| member | covered by |
|---|---|
| external — cycle context gathering, prior internal findings still open (`review.ts:353`) | DELETED; the section keeps the iteration number only |
| external — cycle context, prior external findings still open (`:354`) | DELETED |
| external — cycle context, resolved since last external review (`:355`) | DELETED |
| external — prompt template bullets (`:594-596`) | DELETED with the gathering step; the generated surface is grep-tested for the three phrasings (exit (3)) |
| external — iteration count and `**Reviewer**:` read from prior `external-*.md` (`:345-348`, Step 6) | KEPT — a count and a model name are not findings; the body reads them, the reviewer never does |
| external — project-context read list points at `.orbit-runs/` "see what's already been addressed" (`:588`) | DELETED from the list |
| external — write path "pick a fresh timestamp so this file doesn't overwrite prior reviews" (`:617`) | KEPT — names the directory, carries no findings; the token rule is the engine's |
| external — system-mode `git diff <change-start>..HEAD` (`:543`) | EXCLUDES the trail: `-- . ':!orbit/changes/<name>/.orbit-runs'` |
| fresh / in-context — Step 5 "Inspect prior runs" to fuel pushback (`:810-819`) | REVIEW genre: NOT RUN; pushback is a resolution-time discipline (`orbit-conventions` `Pushback discipline`) and the walk applies it — the measured zero-repeat axis ran without it |
| fresh / in-context — system-mode `git diff` (`:807`) | the same exclusion |
| fresh — the launching brief (no artifact) | RULE ONLY: the brief names artifacts and the apply commit, never a finding — the one member no file carries |
Closure: BOUNDED — the file-resident members are a grep over one module, but the brief and any future body sentence are prose with no artifact
Residual kind: an instruction outside `review.ts` — another body's prose, the chat invocation snippet, the launching brief — that hands a review-genre reviewer prior findings
Residual method: the exit (3) grep over the WHOLE generated surface for the trail path and the three finding-list phrasings, plus reading each pair's committed prompt file at the walk (the prompt is on the trail; the brief is not)
Moves:
- READ: applied — every line number above re-read today; rc04b's real system prompt carried the walk-log titles under "Resolved since last review" (Case 2)
- ENUMERATE: applied — rc03a's eleven, re-found at new lines; none added, none gone
- COHERE: applied — this is STRONGER than R-crc-4's "blind to each other" and compatible with it: the ruling permits history, it does not require feeding it; D-rc03a-10 narrowed the PROPERTY, this chooses the BRIEF
- EXECUTE: applied — under the engine's fresh-first default with a fresh pass standing, the current prompt lists the partner's open findings; with every row applied the prompt lists nothing on any order, so ORDERING stops mattering for blindness (Case 3)
- FALSIFY: applied — the rule cannot see the brief; a reviewer may also re-find a walked finding and the walk suppresses it as stale with evidence — under R-crc-11 that repeat is cheap and is the price of the stronger brief
- CONFORM: applied — R-crc-4 (compatible), R-crc-6 (the walk, not the reviewer, judges staleness), R-crc-14 (stated once in `orbit-review-external`'s cycle-context requirement; the body deletes, the test pins)
- FEASIBILITY: not applied — deletions and one pathspec
- CONSUME: applied — the pair diagnosis (`gates.ts`) consumes nothing new; the external reviewer loses the "already addressed" hint and gains nothing it needs, since it is told not to push back
- INVOKE: applied — fires on every `--reviewer external` packaging and every fresh dispatch; the grep test fires on every build

### D-rc03-4 — a VERIFICATION-genre pass records landed / regressed per resolution, over the walk record's files
Domain: every output a verification pass produces and every reader of it
| member | covered by |
|---|---|
| the walks it verifies | every address-reviews record of this mode on the trail with a token AFTER the latest independent pass of this mode and BEFORE this pass — named by token in `verification.walks` |
| each resolution in those walks | one entry `{title, file, verdict}` keyed exactly as the gate keys resolutions (Q-crc-17), `verdict` ∈ `landed` \| `regressed` — a CLOSED pair |
| a `regressed` verdict | a matching finding in `findings` carrying `regresses: {title, file}`; the write gate checks EXISTENCE both ways |
| a finding with no `regresses` key | OUTSIDE the walk record — the renderer marks it `[outside the walk record]`; never refused (R-crc-13), measured by exit (3) on the next cadence |
| the walk record's file set | the union of `resolutions[].file` across the cited walks — the engine's declared PROXY for "the walk's diff", because walk edits need not be committed when the pass runs |
| the report | a `### Verification` section inside the quarantine: one row per entry, the `[no verification record]` mark on an in-context pass the genre computes VERIFICATION for with no field (by absence, never by date) |
| the gate | reads NONE of it — coverage and resolution are unchanged |
| the readiness record | may cite the pass token as today; nothing new owed |
Closure: SOURCED — the review emit's payload table (`payloadFieldsFor('review')`) plus the renderer's section list, both engine-owned
Moves:
- READ: applied — `TrailResolutionEntry` carries `title`, `file`, `severity`, `disposition` (`trail.ts:59-68`); the resolution key is the gate's (`passResolved`); `direction`'s write-gate pattern (owed on a predicate, mis-shape refused at any class) is the shape this copies
- ENUMERATE: applied — this table; the "which walks" row is where the first draft said "the walk" and the trail can hold two (rc04b: two walk logs before the confirm)
- COHERE: applied — `regressed` without a finding, or a finding with `regresses` naming no verified entry, is the one internal contradiction; the gate refuses both as SHAPE (an existence check), not as content
- EXECUTE: applied — against rc16's confirm (found walk 1's re-point one artifact short): under this shape that is one `regressed` entry with its finding, and the readiness record cites a pass that SAYS so instead of prose
- FALSIFY: applied — Q-crc-20's gap is NOT closed: a verification is in-context and reads the walk RECORD, not the tree's diff since the pair; the walk-record file set is a proxy and is named as one
- CONFORM: applied — R-crc-10 (the one judgement input, landed/regressed, is RECORDED by the AI; everything the engine checks is existence over trail facts), R-crc-13, R-crc-14 (shape owned by `orbit-emit-composition`; render by `orbit-report-rendering`; the body points)
- FEASIBILITY: applied — the cited walks are one filter over `trail.resolutions`; the union is small; rc02b's evidence tax is the precedent for a gate check on a finding's field
- CONSUME: applied — the renderer (new section + two marks) and the readiness author; the gate is deliberately NOT a consumer
- INVOKE: applied — owed on every `orbit emit review` whose genre computes VERIFICATION (D-rc03-2); the renderer fires on every `--report`

### Case 1 — the charter re-read against the shipped tree (2026-10-04)
Sources: the stage section (`clean-up-review-cycle.md`), R-crc-4 as amended 2026-09-14, R-crc-11, `orbit-engine-gates`' reviewed-gate requirement ("(c) independent confirmation — RETIRED"), rc04b's archive. Findings: the recommendation shipped as `direction`; the classes and the `blind-pair` slot shipped in rc02; the "REMOVAL IS CONFIRMED BY VERIFICATION" paragraph argues against clause (c), which rc02c removed — the gate never asks for a further pass; the `in-context` confirm has run as an unnamed verification on every rc-stage since (nine records, each "over the walks' own additions").

### Case 2 — the anchoring channel on a real prompt
`orbit/changes/archive/2026-10-04-rc04b-forward-recommendation/.orbit-runs/external-prompt-system-2026-10-03T23-31-10Z.md` lines 36-41: "Prior internal findings still open: none … Resolved since last review: everything in the three walk logs (`address-reviews-…`)" — plus a project-context bullet pointing the reviewer at `.orbit-runs/` "to see what's already been addressed". In system mode on a post-apply tree the OPEN lists were empty because every proposal finding was walked before apply; the anchoring content was the RESOLVED list and the trail pointer. Under the engine's own fresh-first default with a fresh pass standing, line 353 would have listed the partner's open findings.

### Case 3 — the walk window is already closed by the engine
`src/core/artifact-graph/gates.ts:798-805`: "An OPEN BLIND PAIR outranks the walk recommendation … `if (ev.openPair)` → recommend the missing member". The charter's "no window between two commands for the gate to recommend the walk that forecloses it" describes a state rc02 already removed from the readout. What one-launch would still buy is same-turn overlap, which the eight-step practice already does by hand (both halves in flight before either returns).

### Case 4 — a stored computed extension is the precedent
`src/core/emit-composition.ts:204` lists `iteration` among the review emit's engine-owned computed extensions (rejected in payloads); line 1314 computes it from the trail at write. `genre` follows the same path: computed at write by one exported function, stored, read by the renderer; a pre-rc03 emit lacking it is recomputed for the header and marked by absence where a field is owed.

## Decisions

- **2026-10-04 — D-rc03-1: the residual charter is three live items, not the charter as written** — SHIPPED elsewhere: the forward recommendation (rc04b `direction`), the fixed classes and the `blind-pair` slot (rc02). GROUND RETIRED: the "removal is confirmed by verification, not by another review" argument answers clause (c), which rc02c removed. LIVE: (1) the review brief anchors (Case 2); (2) the in-context pass is an unnamed verification with no record shape; (3) `orbit-review`'s `--fresh` requirement describes `external` with `fresh`'s definition, and `orbit-conventions`' `Review mode decision framework` still says in-context is the right first pass for a small change, which R-crc-4 contradicts.
  Kind: fact
- **2026-10-04 — D-rc03-2: a pass's GENRE is computed from class, mode and trail position, never declared** — REVIEW for the independent classes and for any in-context pass with no readable walk of its mode before it; VERIFICATION for an in-context pass that follows a walk of its mode. One exported function; stored on the emit as a computed extension like `iteration`; the table lives ONCE in `orbit-conventions`, replacing the framework requirement's stale scenarios; the gate is untouched. Rationale: the trail already holds every input, so this is a record the engine can compute rather than a word the author picks (R-crc-10), and R-crc-11(f) already says what the in-context pass IS.
  Kind: rule
- **2026-10-04 — D-rc03-3: a REVIEW-genre brief carries NO findings and NO trail pointer** — the external prompt's Cycle context keeps the iteration number only; the `.orbit-runs/` read-list bullet goes; both halves' system-mode diff excludes the trail; the fresh brief names artifacts and the apply commit and nothing else; review-genre passes skip Step 5. Rationale: pushback is a resolution-time discipline and the walk owns it; the measured zero-repeat axis (rc02, four passes) ran without the lists; and with no findings in any brief the eleven channels collapse on EVERY order, so no ordering rule and no attestation field is needed. Stronger than R-crc-4 requires and compatible with it.
  Kind: rule
- **2026-10-04 — D-rc03-4: a VERIFICATION-genre pass records landed / regressed per resolution over the walk record's files** — `verification: {walks: [tokens], resolutions: [{title, file, verdict}]}` on the review emit, OWED when the genre computes VERIFICATION, refused mis-shaped at any genre; a `regressed` verdict pairs with a finding carrying `regresses`; a finding without one is marked `[outside the walk record]` by the renderer, never refused; the walk record's `resolutions[].file` union is the declared proxy for the diff. Rationale: exit (2) verbatim; the record Q-crc-17 and rc16's confirm both wanted (a walk's claims checked against the artifact, written where the readiness author can cite it); R-crc-13 keeps the gate out of it.
  Kind: rule
- **2026-10-04 — D-rc03-5: one-invocation pair launch is DESCOPED** — the engine already outranks the walk while a pair is open (Case 3), so the window the charter describes is closed; what remains is same-turn overlap, which becomes ONE sentence in the review body ("when the pair is empty, package the external and spawn the fresh in the same turn") under the existing commands. No new flag, no new slot. Q-crc-22's PRODUCER side is answered by that sentence; its CONSUMER side (walk both halves) stays rc08's by charter.
  Kind: scope
- **2026-10-04 — D-rc03-6: the DISAGREEMENT class is named here and handled by rc08** — a disagreement is the two halves of one pair returning contradictory claims on one site; its handling rule (settle by one cheap empirical test, record the test on the walk log) lives where it is observed, the merged walk — `orbit-address-reviews`, which rc08 owns and this stage cannot add under R-crc-1. The charter's consequence (3) moves with the name attached. RATIFIED by Sal 2026-10-04 (A: assign).
  Kind: scope
  Disposition: assigned rc08-walk-completeness
- **2026-10-04 — D-rc03-7: the external-first ordering (D-rc03a-9's engine half) is NOT carried** — D-rc03-3 removes its blindness value (the brief carries nothing on any order) and its remaining value is ergonomic; it would add `orbit-engine-gates` as a fourth capability. rc03a's record says no resolution was inherited; still a Sal-ratified leaning in a withdrawn stage, so FLAGGED. If wanted later it is one `case` label in `commandForClass` and one sentence in the canonical-next requirement — a rider for rc10, which touches that spec. RATIFIED by Sal 2026-10-04 (A: not carried).
  Kind: scope
- **2026-10-04 — D-rc03-8: the stage splits into TWO changes under R-crc-9, preventively, measured at exploration** — (A) the genre table + the review brief + the nomenclature and framework repairs: `orbit-conventions`, `orbit-review`, `orbit-review-external` — no engine code, ~7 MODIFIED blocks, one generated-surface grep test; (B) the verification record: `orbit-emit-composition`, `orbit-report-rendering`, `orbit-review` — one genre function, one owed field with its write-gate checks, one render section, two marks; depends on (A) for the table. Exit criteria partition: (1)'s review template and (3)'s prompt clause → A; (1)'s verification template and (2) → B; (3)'s "zero WARNINGs outside the diff" → B, measured on the next cadence's record. Exit (1)'s "cadence slots read blind-pair → walk → verification" is REVISED at ratification under R-crc-12 (first case): the mechanism computes the genre from position, so the slot token does not change. Proposed stage ids: `rc03b-pass-genres`, `rc03c-verification-record`; declaring them is Sal's act in an architect session. RATIFIED by Sal 2026-10-04 (A: split). Sequence, by the rc04 precedent (commit `5565d8d0`, "Rename the rc04 exploration to its first child, repoint the citation"): the architect session declares `rc03b-pass-genres` (Depends-on: rc02-gate-semantics) and `rc03c-verification-record` (Depends-on: rc03b-pass-genres) and may mark this parent heading ended as record, as rc13 and rc04 were; THEN this staging directory is renamed to `rc03b-pass-genres` with its citation repointed, trail and all; THEN `/orbit:propose rc03b-pass-genres` consumes it. rc03c gets its own exploration when rc03b archives, reading D-rc03-2 and D-rc03-4 from the archived change.
  Kind: scope
- **2026-10-04 — D-rc03-9: the stages are DECLARED and this directory is RENAMED** — the architect session the same evening declared `rc03b-pass-genres` (Depends-on rc02-gate-semantics) and `rc03c-verification-record` (Depends-on rc03b-pass-genres), wrote the SPLIT note on the retained parent, and left the parent's `Complete:` slot `[ ]` for Sal's word. This directory moved from `orbit/explore/rc03-review-genres/` to `orbit/explore/rc03b-pass-genres/`, trail and all, with the citation repointed to the first child (the rc04 precedent, commit `5565d8d0`); the two emits inside it carry the old name in their `change` field as a prior-generation fact. D-rc03-8's expectation of an R-crc-12 revision on the parent's exit (1) did not arise: a child's exit criteria are authored at declaration in the mechanism's own terms, and rc03c's (1) says so.
  Kind: fact

## Open questions

- **Q-rc03-1 — how does the genre derivation follow `sourcePath` when rc08 widens it?** `TrailResolution.sourcePath` is singular (rc13's D-rc13-3 blocker); a walk of two halves will carry two sources of one mode. D-rc03-2's table counts a walk by the mode read from its source(s); a multi-source walk whose sources disagree in mode is not a case the trail can produce today.
  Standing recommendation: derive the walk's mode as "the mode every source shares; MODE-LESS otherwise", so the widening changes the reader and not the table.
- **Q-rc03-2 — should the cadence's `in-context` slot one day require the VERIFICATION genre?** Today any in-context pass satisfies it; D-rc03-2 records the genre and the gate ignores it (R-crc-13).
  Standing recommendation: not in this stage; revisit when rc10 touches the gate, with the record of how many in-context passes computed REVIEW in change modes as the evidence.
- **Q-rc03-3 — does the verification record move Q-crc-20?** A verification reads the walk RECORD, in-context; Q-crc-20 wants the tree's change since the last independent pass surfaced at the archive seam.
  Standing recommendation: no closure claimed; `verification.walks` plus the file-set union is the nearest proxy and should be named in Q-crc-20's entry as such when rc03c archives.
- **Q-rc03-4 — is the fresh brief's content rule worth any record at all?** The brief has no artifact (rc03a channel 11); a self-reported flag on the fresh emit would be a claim the engine cannot check.
  Standing recommendation: rule only, residual declared in D-rc03-3's Mechanism entry; the external half's prompt is on the trail and is read at the walk.

## Considered & out

- **A `--pair` invocation that packages the external and spawns the fresh in one command** (2026-10-04) — the window it closes is already closed by the engine's open-pair outranking (Case 3); same-turn overlap is one body sentence (D-rc03-5).
- **External-first canonical-next for an empty pair** (2026-10-04) — blindness no longer depends on order under D-rc03-3; a fourth capability for an ergonomic gain (D-rc03-7, flagged).
- **Renaming the `in-context` slot token to `verification`** (2026-10-04) — schema v5, every archived trail's gate render, goldens; the genre is computable from position, so the token buys nothing. Exit (1) is revised under R-crc-12 instead.
- **A `cycle_context_passes` attestation field on the T0 emit, read by the pair diagnosis** (2026-10-04) — a self-report the engine cannot check, and unnecessary once the brief carries no findings; attestation was rc03a's answer to a deny-list problem this exploration dissolves.
- **Refusing verification findings outside the walk record at the write gate** (2026-10-04) — R-crc-13; the renderer marks and exit (3) measures.
- **Riding Q-crc-24 (the engine prints the accepted independent pass set)** (2026-10-04) — the next stage to touch the review bodies is this one, but it would take change A past three capabilities; stays canonized at Q-crc-24.
- **Keeping the resolved-since list for iteration-2+ reviewers as "legitimate history"** (2026-10-04) — R-crc-4 permits it and nothing requires it; the walk suppresses a repeat as stale with evidence, cheaper than a primed pair (D-rc03-3 COHERE).

## References

- `orbit/architecture/clean-up-review-cycle.md` — stage `rc03-review-genres` (charter, the 2026-09-15 rc03a absorption, the 2026-09-14 measurements); R-crc-4 (canonical cadence, amended 2026-09-14); R-crc-11 (alignment not cost; (f) in-context is a reaction, (g) the recommendation); Q-crc-20, Q-crc-22, Q-crc-24.
- `orbit/specs/orbit-review/spec.md` — `--fresh` requirement (the nomenclature inversion); `orbit/specs/orbit-review-external/spec.md` — `Cycle context populated from prior runs`; `orbit/specs/orbit-engine-gates/spec.md` — reviewed-gate pass condition, clause (c) RETIRED.
- `src/core/artifact-graph/gates.ts` — the open-pair branch of `canonicalNextForReviewed` and the blind-pair failure diagnosis; `src/core/templates/workflows/review.ts` — the external prompt's `## Cycle context` writer (lines ~350 and ~591).
- `orbit/changes/archive/2026-10-04-rc04b-forward-recommendation/.orbit-runs/external-prompt-system-2026-10-03T23-31-10Z.md` — a real system prompt carrying `Resolved since last review`.
- `orbit/changes/archive/2026-09-15-rc03a-blind-prompt/` — the withdrawn stage's three passes; the evidence rc03 inherits (twelve channels, two-entry state space, attestation over prevention).
