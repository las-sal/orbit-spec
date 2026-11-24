## Context

`reduce-orbit-phase2`'s stage `cut-review-walk` (charter and exit criteria in `orbit/architecture/reduce-orbit-phase2.md`)
applies two cut lists the `inventory` exploration wrote, `orbit/explore/inventory/sketches/address-reviews.md` and
`review.md`, together with Sal's rulings R-rop2-12 (remove batch mode and the blind-pair disagreement test) and R-rop2-14
(the chain end step's tag paragraph moves to its reference, amending phase 1's R-rop-6, ruled at this propose). Every
cut list entry is a move to a reference read at a named moment, a light rewording, or one of those removals; none is
marked for the replay set (R-rop2-10).

Sizes are `npm run size:report`'s (characters / 4, the generated `SKILL.md`, frontmatter included), at `19f2b6f2`:

| body | now | the cut list's projection (sketch) | corrected for frontmatter and the removals |
|---|---|---|---|
| `orbit-address-reviews` | 10,921 | 4,546 | about 4,580 |
| `orbit-review` | 9,602 | 4,509 | about 4,680 |

The sketches measured the body without its frontmatter (about 286 and 172 tokens), so their projections run low by that
much. The removals save more than the address-reviews sketch counted: the batch text in the body is about 394 tokens,
not 185 (the Step 3 paragraph 225, the Constraints bullet 72, the per-source paragraph's batch sentences 80, the sweep
clause 17), and the disagreement paragraph's 267 go whole rather than leaving basic content behind. Both bodies fit only
with the tightening (R2 in both sketches, about 500 tokens each) and the tag paragraph's move (about 247 each).

The bodies are composed in `src/core/templates/workflows/address-reviews.ts` and `review.ts`; their shared closing steps
are `src/core/disciplines.ts` constants carried byte-equal by several bodies (`CHAIN_END_STEP_BASIC` by five,
`COMMIT_STEP_BASIC` by six, `DECISION_WRITING_BASIC` by fourteen).

## Goals / Non-Goals

**Goals:**

- Both bodies at most 5,000 estimated tokens (G1), with their character ceilings in `skill-body-budget.test.ts` lowered
  to the new sizes plus 5% (G2), and apply's, ff's, propose's and onboard's lowered wherever this change's edits bring
  their size plus 5% under the ceiling.
- Every edit named (G0): each removal by its ruling, and every edit to a body's instructions as a pair in a ledger an
  unnamed edit fails.
- Behaviour kept for every cut that is not a removal: what a session reads is the same text, read at the step that uses
  it.

**Non-Goals:**

- The epitome's decision-writing bullet (D-inv-2 shortens it in every body). Neither cut list here needs it, and it is the
  rewording phase 1 deferred as the riskiest (R-rop-15); it lands with the first cut stage whose body does.
- Bulk-archive's removal (R-rop2-11, `cut-propose-archive`) and explore's and onboard's own cuts (`cut-explore-onboard`).
  Onboard is touched here only to drop its four mentions of batch mode (`onboard.ts:50`, the address-reviews layer
  line; `:92`, its Phase 4 paragraph; `:114`, the command table row and that row's description), a consequence of
  R-rop2-12.
- Any replay run (R-rop2-10): no entry is postulated to change significantly what a session does.

## Decisions

### D1 — The two cut lists, as the sketches give them, with the shared steps decided once

Address-reviews, from its sketch: M1 discovery → `references/discovery.md`; M2 several sources and a rediscovered pass →
`references/triage-sources.md` (the disagreement test is removed, D3); M3 and M6 ripple-miss attribution, the sweep's five
arrays and the CHECK SCOPE / PATH production → `references/sweep-record.md`, read at TWO moments: at triage (Step 2), on
a change-scoped walk whose trail holds earlier walk logs, for the attribution, which `A ripple miss is attributed by the
walk that finds it` puts at triage, before the walk edits files; and at Step 3d.5, when an entry resolves, for the sweep; M4 batch mode removed (D3); M5 hybrid
detection and ratification recording → the existing `references/resolution-detail.md`; M7 reading findings →
`references/reading-findings.md`; M8 the REDESIGN route → `references/redesign.md`; M9 the report template →
`references/report.md`; M10 the per-source paragraph SPLIT: its walk-order sentences (token order, each source's log written before the next
source begins, an interrupted walk's logs standing) → `references/triage-sources.md`, read when discovery yields more
than one source and so before the walk, and its log fields with the scope forms → the existing `references/run-summary-emit.md` (already holding them whole), the split named in the ledger — an exception to `orbit-run-summary-emit`'s `A body reads its run-summary detail before the session's first run-summary emit`, which kept the scope forms and that paragraph in the body, so that requirement is MODIFIED (found at apply; Sal's ruling, 2026-11-24); M11 the cascade's OUT table, IN rule, `--no-cascade` and trust rule →
`references/cascade.md`; R1 Constraints keep only "never write new markers"; R2 the prose that stays tightened.

Review, from its sketch: V1 the VERIFICATION procedure (a) to (e), the Verdicts fence and the Sweep scope and paths fence →
`references/verification.md`; V2 dispatching a fresh pass with its brief, and the re-run of a pair's missing fresh half →
`references/fresh-dispatch.md`; V3 architecture mode's target and context paragraphs (Steps 2 and 4) and its gate-less
hand-rendered shape (Step 10) → `references/architecture-mode.md`; V4 the flag table, the reviewer-selector table and the
wrong-mode notes → the existing `references/flags-detail.md`; V5 the "Output format (change modes)" section, a restatement
of Step 10, dropped; R1 the preamble's branch-by-branch dispatch detail dropped (Step 3 and the references state it); R2
the prose that stays tightened.

Kept whole in each body, as the sketches name them: address-reviews' preamble, epitome, Step 3's lifecycle (pushback,
classify, the decision-lane protocol, fix, marker removal), the marker syntax tables, graceful degradation, the commit
step; review's pass-genre table (a checked mirror held in the body, `orbit-conventions`' `Review mode decision
framework`), Steps 1, 2 (change modes), 4, 6 to 9, the disjunctive-recommendation rule, the direction and commentary
contracts, the special cases, the worked example, the commit step.

The shared steps, decided once (the `inventory` stage's third exit criterion, the inventory's table): the CHECK SCOPE / PATH fence
moves in both bodies into each skill's own reference, the same bytes (M6, V1); the chain end step's tag paragraph moves
in all five carrying bodies at once, because it is one constant (D2); the commit step stays whole.

Chosen over landing only the review and walk halves of the shared steps: `CHAIN_END_STEP_BASIC` is one constant, so
the move cannot be scoped to two of its five carriers without a second constant, which `structure over size` (one shape
per step) rules out.

### D2 — The chain end step's basic content points at the tag paragraph (R-rop2-14)

`CHAIN_END_STEP_BASIC` drops `CHAIN_TAG_MEANING` and gains one sentence after its read-and-route paragraph:

> A command a chain ran reads what its prompts' `(chain: …)` tags mean, and what it records, in `references/chain-end-step.md`, before its first tagged prompt when this session has not read it.

`CHAIN_END_STEP` (the reference) already carries `CHAIN_TAG_MEANING` and is unchanged, so `moved-blocks`' recorded hash
for it holds. The `--chain-ran` / `--chain-head` clause stays in the basic content: the read comes before the reference
is opened (phase 1's reading-order rule). `(chain: not a prompt)` still names itself. The named limit generalizes
archive's: a chained command in a fresh session, or after a compaction, learns its tags' meaning by following the
pointer; `automate-dev-flow`'s rescoping (R-rop2-3) takes it up.

### D3 — What the two removals take, and what stays readable

Batch mode: the three triggers and the batch-mode UX go from the body, `resolution-detail.md`'s trigger table and its
"Decision-lane behavior in batch-mode" paragraph, the run-summary schema reference's `walk_mode_source` and
`walk_mode_shifted_at_finding` rows and its batch example payload, the per-source paragraph's batch sentences (body and
`run-summary-emit.md`), the sweep clause "in batch mode, …", the Constraints bullet, the skill's `compatibility`
frontmatter clause, the launcher's argument hint where it names `--batch`, onboard's four mentions (its address-reviews layer line, its
Phase 4 paragraph, its command table row and that row's description), and `docs/commands.md`'s row. `walk_mode` stays a required top-level field; a log the walk writes carries `"per_finding"`, and the write gate
does not check the value (the named limit in `Every walk runs finding by finding`). The
two retired fields leave `emit-composition.ts`' address-reviews `payloadFields`, so a new payload carrying them is
refused as unknown. A log written before keeps them, and no reader reads them (the engine has none; the gate reads
resolutions). The mid-walk DELEGATION directive ("handle the rest, only brief me on real decisions") is not batch mode:
it, `delegation_directive` and "one prompt never spans two findings" stay, the scenario that named both losing its batch
clause. The retired triggers keep body text of their own: `--batch` is dropped before discovery resolves the positional,
the retired verbal forms get a one-line notice that batch mode was removed, and a bare mid-walk "go batch" / "switch to
batch" / "batch the rest" is read as a delegation and recorded verbatim (`Every walk runs finding by finding`). The body
therefore still names those words, so batch mode's `removed` pairs take their phrase from text that leaves the skill
entirely (`walk_mode_source`, `command-shape-interruption`, "Batch-mode is opt-in").

The disagreement test: the body's paragraph, the per-resolution `disagreement` key in the schema reference and its
examples, and the requirement go. The triage's cross-pass split (found by both / one pass only / contradictory) stays as
a rendering: two contradictory findings are walked like any two, each by pushback against current state. A log that
carries `disagreement` keeps it, since the write gate never checked it.

Every example payload in the address-reviews schema reference still passes `reference-roundtrip.test.ts`'s write gate,
and the examples jointly carry every key the schema block documents (`orbit-emit-composition`'s `Payload schema
references are proven by execution`), so the batch example is replaced by a per-finding one that keeps the
`delegation_directive` key covered.

### D4 — Each basic content names its moment and routes from the result already in hand

Each moved step keeps, in the body, its heading, what it does in one or two sentences, and the read: "read
`references/<x>.md` and follow it" at the moment named in D1, "from the result you already have" where a command's result
precedes it (phase 1's reading-order rule). Two moments need care:

- **A VERIFICATION pass the probe missed.** The body's metadata probe decides whether to read `verification.md`. When the
  probe read REVIEW but the engine computes VERIFICATION, `orbit emit review` refuses the payload naming the owed keys; the
  body's basic content therefore says: on a refusal that names owed `verification` keys, read `references/verification.md`
  and follow it from the refusal you already have. The inverse refusal (verification refused on a REVIEW-genre pass) is
  met by a session that has the reference loaded.
- **The fresh half of a blind pair.** `blind-pair.md`'s step 5c dispatches the fresh half "per the trunk's Dispatching a
  fresh pass"; it is re-pointed to `references/fresh-dispatch.md`, which now holds the brief.
- **V2's basic content, and who reads it.** A dispatched worker runs `--reviewer fresh` too, so "the reviewer is fresh"
  is no read cue. The body keeps the step's heading and three sentences: dispatch is the INVOKING session's act alone; a
  subagent holding the brief is the worker, skips this step without reading the reference, and skips the Commit step and
  the Chain end step, returning once its pass is persisted; the invoking session, on a `--reviewer fresh` run or at a blind
  pair's step 5c, reads `references/fresh-dispatch.md` and follows it.

Text that moves is moved byte-equal. A positional pointer inside it that the new home makes wrong ("are below", "just
above", "Step 3 trigger table") is reworded as a named pair in the ledger (D5), never left. A pointer from text that does
NOT move into text that does is re-pointed too: every reference of both skills is grepped for "the body's", "Step N" and
each moved heading, and each hit naming a moved section is re-pointed to its reference — known at propose:
`resolution-detail.md`'s "the body's DISCOVERY rows 4 and 5" and "the DISCOVERY fence in the body's Step 1"
(`address-reviews.ts:373`, `:377`), and review's schema reference's "Step 5's VERIFICATION branch" (`review.ts:212`).
References are not hashed by the ledger, so these re-pointings are named in the archive. `flags-detail.md` opens "Loaded
only when one of these flags is set"; with V4 it is read at Step 3 of every pass, so that line is reworded.

New references: `discovery.md`, `triage-sources.md`, `sweep-record.md`, `reading-findings.md`, `redesign.md`,
`report.md`, `cascade.md` (address-reviews); `verification.md`, `fresh-dispatch.md`, `architecture-mode.md` (review).
Each is named by its body by path (`orbit-skill-generation`'s `Reference files are linked from their skill and long ones
open with contents`), and one over 100 lines opens with `## Contents`. None carries a `json example` block, so the
executed-examples set (six blocks across five references) does not grow. `architecture-mode.md` is read by a REVIEW-genre
pass, so it joins the brief regions of `orbit-review`'s grep rule; `verification.md` is read only by a VERIFICATION pass and
does not.

### D5 — A cut ledger names every body edit; the tighten-bodies ledger undoes it first

`tightened-bodies.test.ts` reconstructs each body's `ef55ee46` text by undoing tighten-bodies' pairs on TODAY's body, after
first undoing records-by-setting's swap. Every edit here breaks that reconstruction, so the edits need naming in a form a
test can undo. A new test, `test/core/templates/cut-ledger.test.ts`, records the sha256 of each body this change edits
(`instructions` of address-reviews, review, apply, ff, propose, onboard) BEFORE the first edit, and lists every edit as a
pair of one kind:

| kind | the pair | the undo | the check |
|---|---|---|---|
| `moved` | the skill, the reference, the moved span's start and end anchors (each unique in the reference), the sha256 of the text before the move, the basic content that replaces it | replaces the basic content with the span read from the reference between its anchors; where the destination already held the text (M10's log fields, the chain paragraph), the pair names that existing span and the undo copies it back into the body, never appending a second copy | the span between the anchors hashes to the recorded digest, and the body names the reference |
| `removed` | the text removed, what replaces it (often nothing), the ruling | restores the text | a phrase specific to the removed text occurs nowhere in the generated skill |
| `reworded` | before, after | restores before | none beyond the reconstruction: whether a rewording keeps its meaning is the reviewer's judgement |
| `restated` | the text dropped as a restatement, and the step text it restates | restores the dropped text | the step text it restates is still in the body (V5, review's R1, address-reviews' R1) |
| `shared` | one of the above on a constant several bodies carry (`CHAIN_END_STEP_BASIC`) | applied in every carrier | as its kind |

Undoing every pair, in reverse order, must reproduce each recorded hash; an unlisted edit fails naming the body.
`tightened-bodies.test.ts` then undoes the cut ledger first, so its own reconstruction still holds. The ledger is ADDED to
`orbit-conventions` as a requirement the later cut stages extend with their own rows (one shape for the three cut
stages), and the tighten-bodies ledger's requirement is modified to undo it first.

Chosen over recording the new bodies' hashes and retiring tighten-bodies' reconstruction (that loses phase 1's proof), and
over a snapshot fixture of today's bodies (a second copy of 80 KB of text that every edit must keep in step).

### D6 — The specs that said "the body carries" now say which file of the skill carries it

Six placements, in five requirements of three owners, put a fence or a step in a BODY (a seventh, `orbit-run-summary-emit`'s scope forms and per-source paragraph, was found at apply and is modified by D1's M10): `orbit-address-reviews`' DISCOVERY fence (`Address-reviews
command available`), `orbit-emit-composition`'s Verdicts fence and CHECK SCOPE fence, `orbit-review`'s VERIFICATION branch
and its verdicts mirror, and `orbit-review`'s dispatch brief in the brief-region rule. Each is modified to name the skill's
reference. The parity tests holding those mirrors (`discovery-parity`, `verification-verdict-parity`, `sweep-path-parity`)
re-anchor on the reference file; their byte-equality assertions are unchanged. The pass-genre table stays in review's body,
so `orbit-conventions`' `The review body carries the table as a checked mirror` holds.

### D7 — Ceilings come down after the last edit

After the last body edit (the walk's included), each edited body's character ceiling is lowered to its new size plus 5%, as
a named edit naming its previous ceiling, the rule phase 1 set; a body whose size plus 5% would exceed its ceiling keeps it.
Apply's, ff's and propose's come down too, since the tag paragraph's move shrinks them by about 990 characters, and
onboard's, which loses its batch mentions.

## Alternatives considered

- **Keeping the tag paragraph in the bodies (R-rop-6 as it stood):** address-reviews would have needed about 100 more
  tokens of tightening and review about 250 to fit; Sal amended R-rop-6 instead (R-rop2-14).
- **Moving batch mode to a reference rather than removing it** (the sketch's first projection): Sal removed it (R-rop2-12,
  0 of 476 walks used it).
- **Taking the decision-writing bullet's shortening here:** not needed by either body, and it touches all fourteen; left
  to the stage that needs it (Non-Goals).
- **A second chain end step constant for review and address-reviews only:** two shapes for one step (D1).

## Risks / Trade-offs

- [Tight margins: both bodies fit only with the tightening, about 500 tokens each.] → Apply measures `npm run size:report`
  after the moves and the removals, before tightening; a body still over 5,000 after R2 meets the inventory's re-entry
  trigger ("a cut stage finds a body that its cut list does not bring under 5,000") and is raised, never cut further
  unnamed.
- [A session skips a moved step it should read.] → Each basic content names its moment and its read; the replay walk and
  review cases grade the emit and the gate, not each step (the sketch's named limit), and the baseline stays available.
- [A chained command in a fresh session meets tags its body no longer explains.] → R-rop2-14's named limit; the pointer
  names where the meaning is.
- [The probe-missed VERIFICATION refusal reaches a session without `verification.md` loaded.] → D4's routing sentence in
  the body.
- [R-rop2-12 names `orbit-audit-drift` and `orbit-engine-gates` among the specs its removal reaches, from D-inv-15.] →
  Measured at this propose: neither carries batch mode or the disagreement test (audit-drift's "disagreement" is
  doc-vs-spec drift; engine-gates' mentions are a 2026-09-14 history note and bulk-archive), so neither is a capability
  here; recorded in the archive's Shipped as.
- [The cut ledger is large: every moved span's two anchors and digest, and every removed, reworded or restated span.] →
  Moves store their anchors and a digest, never the moved text (the undo reads it from the reference); only removals,
  rewordings and restatements store their before text.

## At archive

- `orbit-address-reviews`' Purpose is edited in place (no delta carries `## Purpose`): "Walk-mode is the default (`--batch`
  opts in)" becomes "Every walk runs finding by finding".
- The Shipped as names every removal with its ruling (R-rop2-12, and R-rop2-14's amendment), the tests each edit
  followed, and D-inv-15's two specs measured as unaffected.

## Touchpoints

- `src/core/templates/workflows/address-reviews.ts` — the body, the new references, the schema reference and examples, `resolution-detail.md`, the launcher.
- `src/core/templates/workflows/review.ts` — the body, the new references, `flags-detail.md`, `blind-pair.md`'s step 5c.
- `src/core/disciplines.ts` — `CHAIN_END_STEP_BASIC`.
- `src/core/emit-composition.ts` — address-reviews' `payloadFields`.
- `src/core/templates/workflows/onboard.ts` — its four mentions of batch mode.
- `docs/commands.md` — the `--batch` row.
- `test/core/templates/cut-ledger.test.ts` — the new ledger.
- `test/core/templates/tightened-bodies.test.ts` — undoes the cut ledger first.
- `test/core/templates/skill-body-budget.test.ts` — ceilings.
- `test/core/templates/skill-templates-parity.test.ts` — apply's, ff's, propose's and onboard's hashes.
- `test/core/templates/moved-blocks.test.ts` — the address-reviews emit block's recorded hash.
- `test/core/discovery-parity.test.ts` + `test/core/sweep-path-parity.test.ts` + `test/core/verification-verdict-parity.test.ts` — re-anchored on references.
- `test/core/templates/*.test.ts` — the tests that read moved or removed text (orbit-content-fidelity, walk-routing, review-verification-branch, review-genre-brief, blind-pair-command, chain-prompt-tags, conditional-steps-results, orbit-generated-surface, reference-contents).
- `test/commands/config-profile.test.ts` — the per-skill reference lists.
- `test/core/emit-schema-parity.test.ts` + `test/core/reference-roundtrip.test.ts` — the schema reference's fields and examples.
