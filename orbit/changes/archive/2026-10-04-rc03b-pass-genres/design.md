## Context

`clean-up-review-cycle`'s R-crc-4 fixes the post-apply cadence: a blind pair (one `fresh`, one
`external`) on one artifact state, one merged walk, one verification over the walk's diff, with the
in-context class a REACTION (R-crc-11(f): one CRITICAL in ~25 D-arc in-context passes). rc02 shipped the
pair as a cadence slot and a blindness predicate; rc04b shipped the independent passes' forward
recommendation; rc02c retired the gate clause that demanded a further review after a walk. What never
shipped is the vocabulary the ruling uses — REVIEW versus VERIFICATION — and the brief rule that makes
"blind" true of what a reviewer is handed, not only of the walk records the predicate reads.

The exploration (`explore.md`, one sitting plus a resume on 2026-10-04) re-measured the parent charter
against the shipped tree first: three of five items had shipped elsewhere or stood on retired ground.
Of what remained, this change takes the table and the brief; `rc03c-verification-record` takes the
engine function and the owed record (explore D-rc03-8, Sal: A). The design is small by construction
and carries no engine code; its one load-bearing choice is WHERE the rule is stated.

## Goals / Non-Goals

**Goals:**
- One statement of how a pass's genre is determined, from trail facts only, in the spec that owns the
  class vocabulary; every body points at it.
- A REVIEW-genre brief that carries nothing a reviewer could be anchored by, on every launch order.
- The two shipped inversions repaired (`--fresh`'s parenthetical; the framework's "in-context first").
- A grep test that keeps the generated surface honest (exit (2)).

**Non-Goals:**
- Computing the genre in the engine, storing it, or owing a record on VERIFICATION passes — rc03c.
- Any change to the gate: slot arithmetic, coverage, resolution, canonical next (R-crc-13).
- A pair-launch invocation or ordering rule (D-rc03-5 amended, D-rc03-7).
- Disagreement handling (assigned to rc08, D-rc03-6); the T0 emit's next-step prose (rc08, D-rc03-16).

## Decisions

### D1. The pass genre is COMPUTED from (class, mode, trail position) and stated as one FENCED table in `orbit-conventions` (explore D-rc03-2; bounded at walk 1)

Six cells: independent classes → REVIEW; `in-context` after a QUALIFYING walk of its mode → VERIFICATION;
`in-context` with no such walk, or only MODE-LESS walks (a record whose source resolves to no mode) →
REVIEW; a QUALIFYING walk is one whose token lies after the latest ACCEPTED independent pass of the mode (any walk when
none exists) and before the pass — the bound the fresh pass asked for, which is also rc03c's walk set
(the exploration's table said "a readable walk precedes", unbounded; corrected here, not in the record); architecture mode → REVIEW; `external` × architecture → not a member (refused upstream). The
inputs are `TrailPass.reviewerClass`, `TrailPass.mode`, `TrailResolution.sourcePath` and token order —
all trail facts, so the rule is a record the engine CAN compute (R-crc-10), and rc03c computes it.
Why `orbit-conventions` and not `orbit-review`: the class vocabulary already lives in `Review mode
decision framework`, whose per-change class-choice scenarios R-crc-4 contradicts; rewriting that
requirement into the table replaces a stale statement rather than adding a second (R-crc-14). The
gate reads nothing of the genre; the slot arithmetic is unchanged in every cell (the exploration's
row 3 had said the slot "does not count" such a pass — corrected at propose: an in-context pass that
follows the pair and precedes the walk satisfies the `in-context` slot and is REVIEW genre).
Alternative — a `genre` the author declares on the payload: rejected; a declared word drifts from the
trail and invites the gate to read it. VOCABULARY: "genre" already means internal-versus-external in
`orbit-report-rendering` (~20 uses), the baseline `Iteration note` requirement and `report-render.ts`'s
`genre: 'internal' | 'external'`. This change QUALIFIES rather than renames — R-crc-4 and the stage id
already say "pass genres", and moving a ruling's vocabulary to dodge a renderer field is the wrong
trade — so every use is "pass genre", the owner names the render axis by pointer, and rc03c stores
`pass_genre`. The in-context body learns its genre from ONE directory fact the owner names — the
token-ordered listing of the trail's pass AND walk records with their `reviewer_class` (or, absent it, `flags.fresh`) and `source_path`
fields, bounded by the latest ACCEPTED independent pass (system walk 1, 2026-10-04) (walk 2: the walk listing alone could not supply the bound's latest-independent-pass token — the
external's constructed case, a fresh pass landing between an old walk and the in-context pass, decides
differently with the same walk listing) — a bounded METADATA PROBE that opens no findings, which is why it
is not a "trail pointer" under D2. The engine surface that would print the qualifying-walk fact outright
is Q-crc-24's territory and a fourth capability; named here as the better home once rc03c ships the
function, not built.

### D2. A REVIEW-genre brief carries no findings and no pointer at the trail; the rule is owned by the conventions requirement with its residual stated there (explore D-rc03-3, D-rc03-10)

rc03a enumerated eleven channels and tried to deny-list them; this change makes the instruction they
all wear — "read the change's own history" — absent from every review-genre brief, so the channels
collapse on every order and no ordering rule or attestation field is needed. The twelfth channel,
found on the resume by reading the OWNING SPEC rather than the body, is the recommended-session note's
"continue a same-AI session so it can verify its earlier findings" — verification asked of a
review-genre reviewer through its own memory; it is deleted. The domain is BOUNDED: the fresh
launching brief has no artifact, and any future body sentence is prose. The two residual lines live
ONCE in the conventions requirement (the owner, because only spec text survives archive); the Risks
entry below points there. Pushback (`orbit-review`'s `Pushback discipline on stale findings`) is
current-state verification and needs no prior list, so skipping Step 5 for review-genre passes leaves
it intact and `stale_suppressed` keeps its meaning. Stronger than R-crc-4 requires and compatible with
it (the ruling permits history; it does not require feeding it).

### D3. Nothing launches the pair and nothing orders it (explore D-rc03-5 amended, D-rc03-7)

The charter's "one invocation launches both halves" answered a window rc02 already closed:
`gates.ts:798-805` outranks the walk recommendation while a pair is open. A body sentence spawning the
fresh half inside a `--reviewer external` invocation would breach the no-chaining contract, and the
eligibility line at the end of the packaging turn already renders `--fresh` for an empty pair. The
external-first ordering (rc03a's ratified leaning) loses its blindness value under D2; it is a one-line
rider for rc10, recorded in that stage's charter. Nothing ships here for either.

### D4. The two repairs ride (explore D-rc03-12)

`orbit-review`'s `--fresh` requirement put `fresh`'s definition on `external`; the parenthetical moves.
The framework requirement's "in-context is the right first pass for a small change" scenario is
deleted, its `--fresh`/external scenarios replaced by the table and one sentence: which class runs next
is the schema's cadence, surfaced by the engine.

### D5. The body carries a CHECKED MIRROR of the pass-genre table (R-crc-14's mirror corollary)

An adopter's installed skill has neither this repository's specs nor its parser. The owner FENCES the
six-row table as a production (header row `| reviewer class | mode | trail position | pass genre |`), the
review body carries that fence verbatim under a "Pass genre" heading naming the owner, and the parity
test anchors on the header row through `ownerText` + `fencedProduction` (`test/helpers/owner-text.ts`) —
the same shape rc13a used for the explore grammar and rc02b for the severity ladder. The owner's own
sentence permits exactly this one mirror (walk 1: the first draft forbade it). The architecture
body's hand-computed per-doc iteration note is the ONE exemption from D2, stated in the owner: the mode
has no pair and no gate, and no render surface computes the note — exempting a count beats retiring
architecture mode's only iteration signal.

### D6. Three capabilities, at the ceiling; the fourth declined twice (explore D-rc03-8, D-rc03-6, D-rc03-16)

Disagreement handling (observed at the merged walk → `orbit-address-reviews`) and the T0 emit's
single-half next step (`orbit-run-summary-emit`) would each be a fourth capability; both are rc08's
by assignment, written into its charter on 2026-10-04.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination (shape) |
|---|---|---|---|
| D-rc03-2 | DERIVED | live rule | `orbit-conventions` › `Review mode decision framework` — the pass-genre table as a FENCED normative TABLE (six rows; the VERIFICATION row bounded at walk 1) plus a SCENARIO SET (one scenario per row; the two REVIEW-with-no-qualifying-walk rows share one, by the cell's own text); the `Closure:` justification is the sentence "computed from three trail facts … never declared" |
| D-rc03-3 | BOUNDED | live rule | `orbit-conventions` › `Review mode decision framework` — the brief rule, with `Residual kind:` and `Residual method:` VERBATIM as the named limit (the OWNER); `orbit-review` › ADDED `Review-genre passes read the artifacts and the code, never the trail's findings` and `orbit-review-external` › `Cycle context populated from prior runs` / `Prompt written to versioned file…` / `Recommended-session note in chat output` carry the mechanism and point; ONE Risks entry below names the rule and points at the owner |
| D-rc03-4 | — | `Disposition: assigned rc03c-verification-record` | not carried — permitted history; its Mechanism entry travels with the file for rc03c's exploration to read |
| D-rc03-1 | — | `Kind: fact` | not carried — the charter re-measurement; Context above |
| D-rc03-5 | — | `Kind: scope` | not carried — D3 above |
| D-rc03-6 | — | `Kind: scope`, `assigned rc08-walk-completeness` | not carried — rc08's charter |
| D-rc03-7 | — | `Kind: scope` | not carried — D3 above; rc10's rider |
| D-rc03-8 | — | `Kind: scope` | not carried — proposal.md's size paragraph |
| D-rc03-9 | — | `Kind: fact` | not carried — the rename record |
| D-rc03-10 | — | `Kind: fact` | not carried — D2 above names the twelfth channel; the delta deletes it |
| D-rc03-11 | — | `Kind: scope` | not carried — no record for the fresh brief (D2's residual) |
| D-rc03-12 | — | `Kind: scope` | not carried — the edit table; transcribed into the three deltas and tasks.md |
| D-rc03-13 … D-rc03-16 | — | `Kind: scope`, each `assigned` | not carried — the four open questions resolved at propose as assignments (rc03c, rc10, rc03c, rc08) |

No `key_defects`. My reading of the file against the grammar after the last propose-time write: two
live rules, both with ID-matched owners, a `Domain:` line and table, a closure token from the set,
residual slots exactly on the BOUNDED one, nine move lines each once — both ACCOUNTED (the engine's
parse at the last boundary emit agreed: 2 rules, 0 open, 1 residual). The BOUNDED entry's two residual
lines were grepped in `specs/orbit-conventions/spec.md` before the move: both present, verbatim. (Widened at the system cadence's first walk, 2026-10-04: the owner's residual kind now also names prior-pass content reaching a reviewer through what a brief legitimately names — commit messages, the `orbit status` gate reason, project-context narrative — and its method adds a walk-time check; `explore.md`'s entry keeps the propose-time wording as the exploration's record.)

## Touchpoints

- `src/core/templates/workflows/review.ts` — the external-handoff reference (Step 5 gathering → iteration only; Step 6 iteration-3+ phrasing, trade-off sentence deleted; the worked example's Recommended-session line); the body's pushback epitome bullet (current-state verification, no prior-run comparison); a NEW "Dispatching a fresh pass" step carrying the brief by pointer; the prompt template (`.orbit-runs/` bullet removed, `## Cycle context` reduced to the iteration line); mode-sections' system-mode read list (trail-excluding pathspec); the body's Step 4 read list (same pathspec) and Step 5 (scoped to VERIFICATION genre); the fenced pass-genre table mirrored from the owner under a "Pass genre" heading; the `--reviewer`/`--fresh` rows' class words.
- `test/core/templates/orbit-content-fidelity.test.ts` — expectations for Step 5/6, the template, the pathspec, the pass-genre fence.
- `test/core/templates/*.test.ts` — NEW: the review-genre brief grep over the generated review skill under the PHRASE and REGION rules of `orbit-review`'s ADDED requirement; NEW or extended: the pass-genre fence parity pin against `orbit/specs/orbit-conventions/spec.md` through `ownerText` + `fencedProduction`; the untouched-modules hash pin over `src/core/artifact-graph/`, `src/core/emit-composition.ts`, `src/core/report-render.ts`, `schemas/`.
- `orbit/architecture/clean-up-review-cycle.md` — the rc03b charter paragraph (slot-arithmetic sentence and exit (2)'s phrase list), amended at walk 1 by cascade, dated.
- `orbit/specs/orbit-conventions/spec.md` + `orbit/specs/orbit-review/spec.md` + `orbit/specs/orbit-review-external/spec.md` — synced at archive.
- `CLAUDE.md` — the ACTIVE program section's rc03b paragraph.

## Risks / Trade-offs

- [The fresh launching brief has no artifact; the rule cannot be checked there] → named residual of
  D-rc03-3, stated once in `orbit-conventions`' `Review mode decision framework` (Residual kind / Residual
  method); the external half's prompt IS on the trail and is read at the walk; the generated-surface grep
  holds every file-resident member.
- [An iteration-2+ reviewer re-finds a walked finding] → expected and cheap under R-crc-11: the walk
  suppresses it as stale with evidence; the alternative (feeding it the list) is the anchoring this change
  removes. Measured support: rc02's four blind passes ran without the list and recorded zero repeats.
- [Losing the same-AI continuation at iteration 3+] → that option asked VERIFICATION of a review-genre
  reviewer; the verification genre has its own class (in-context) and, in rc03c, its own record.
- [The `Prompt written to versioned file…` MODIFIED block is 186 lines for a six-line edit] → the
  fingerprint guard (`orbit fingerprint`) protects against a parallel change on the same requirement;
  the block was copied programmatically from the baseline and diffed before writing.
- [The architecture body's iteration note is a prior-run read in a REVIEW-genre mode] → the one
  exemption, stated once in the owner: no pair and no gate exist in architecture mode, and no render
  surface computes the note; retiring it would remove the mode's only iteration signal.
- [The REGION rule must let the prompt keep its three required output paths] → the rule exempts the
  prompt template's output destinations BY LINE: inside `## Output format — write to:` and `## After
  completing the review`, a line whose every trail path is the findings destination, and the reference's
  own header line whose every trail path is the prompt file — decidable, and task 1.1 plants a read pointer
  and asserts the three output paths pass (walk 2, the external's first finding). Narrowed from a
  section-level exemption at the system cadence's first walk (2026-10-04, fresh S3, Sal: A): a read
  instruction planted inside an output section had stayed green.
- [The pass-genre table has no engine reader until rc03c] → by design of the split: the table is a spec
  statement the bodies point at; rc03c's function is held to it by a test when it ships. Until then the
  word is a reader's, as every rc-stage's "in-context confirm" already was.
- [A body mirror of the table can drift from the owner] → the parity pin (D5) fails the build on a
  byte difference, as the severity-ladder and explore-grammar pins do.

## Alternatives considered

(From `explore.md`'s Considered & out, 2026-10-04.)

- **A `--pair` invocation packaging the external and spawning the fresh in one command.** The window it
  closes is already closed by the engine's open-pair outranking; rejected.
- **A body sentence spawning the fresh half in the same turn.** Breaches no-chaining for a user who
  asked for one class and duplicates the eligibility line; rejected.
- **External-first canonical next for an empty pair.** No blindness value once the brief carries
  nothing; a fourth capability for an ergonomic gain; a rider for rc10.
- **Renaming the `in-context` slot token to `verification`.** Schema v5, every archived trail's render,
  goldens; the genre is computable from position, so the token buys nothing.
- **A `cycle_context_passes` attestation field on the T0 emit read by the pair diagnosis.** A self-report
  the engine cannot check, and unnecessary once the brief carries nothing.
- **A self-reported `brief_carried_findings` flag on the fresh emit.** A judgement dressed as a check
  (R-crc-10).
- **Riding Q-crc-24 (the engine prints the accepted pass set).** Past the ceiling; stays canonized.
- **Keeping the resolved-since list as "legitimate history" for later iterations.** R-crc-4 permits it
  and nothing requires it; rejected for the stronger brief.
