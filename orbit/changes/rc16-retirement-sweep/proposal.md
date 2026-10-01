# Proposal: rc16-retirement-sweep (stage rc16-retirement-sweep)

## Why

Three stages in a row — rc13a, rc13b, rc13c — and then rc15 each deferred living prose that a later
stage made false, to "a retirement-class sweep" that Q-crc-28 ledgered and nobody ran. The deferrals
were correct under R-crc-1 when taken; together they leave the baseline asserting, in three capabilities
and the generated explore skill, that mechanisms are still pending which shipped weeks ago: the
maturity signal (rc13b), propose's Mechanism consumption and its refuse of a concluded exploration
(rc13c), and the state reader's header read (rc15). The project-wide audit after rc15's archive was
the fourth surface to raise the set, and Sal ratified it as its own change the same day
(Q-crc-28: A), then declared it a stage so the program keeps the record of why the list grew. The
exploration (`explore.md`: five decisions, two live rules, both Mechanism entries CLOSED under
SOURCED, no open question) enumerated the set BY SENTENCE — Q-crc-28's line numbers had already
drifted — and Sal ruled the retained "five-section" requirement titles OUT (D-rc16-1).

## What Changes

- **`orbit-conventions`: three requirements lose their "pending follow-on" prose.** In `Mechanism entry
  grammar and accounted closure`, the VISIBILITY paragraph's closing clause and the open-domain
  scenario's parenthetical stop naming "the maturity-signal stage" and "the propose-consumption
  follow-on" as future mechanisms and instead NAME THE OWNERS — `orbit-run-summary-emit`'s maturity
  requirement and `orbit-propose-modifications`' Mechanism-consumption requirement — by capability, not
  by stage. In `Concluded exploration outcome`, the KNOWN paragraph's three "until …" limits are
  DELETED and replaced by one sentence naming the three owners that closed them
  (`orbit-architecture-engine`'s state requirement; `orbit-run-summary-emit`'s maturity requirement;
  `orbit-propose-modifications`' Step 0 refuse). In `Decision entry identity and classification`, the `Kind:` bullet's "owned by
  `orbit-explore-modifications`' maturity-signal successor" names the readout whose limit it is
  (`orbit-run-summary-emit`'s maturity requirement). Repair by POINTER or deletion, never a restatement,
  never a stage id (D-rc16-2).
- **`orbit-orientation`: two sentences rc15's header read made false in letter are qualified.** The
  bare-status requirement's `No live inference` THEN clause gains "orientation itself parses no artifact
  content; the stage-state source it consumes reads the concluded header of citing staging directories
  per `orbit-architecture-engine`"; the strip-composition requirement's chip sentence keeps "the ROW's
  chip is read from the trail" and drops the parenthetical that cited the closed-source clause as a
  transitive prohibition. Q-crc-28's written repairs, verbatim in intent.
- **`orbit-explore-modifications`: one scenario stops naming a stage.** `Nine moves applied per rule in
  the Mechanism section`'s exemplar scenario said "the maturity-signal stage parses the same exemplars as
  fixtures"; it now names the owner of that parse, `orbit-emit-composition`'s `The explore grammar has one
  source in code`. Found by the fresh proposal pass (iter 1, CRITICAL) — the exploration's phrase grep had
  missed it and two more.
- **The explore body's six copies move WITH their owners, in the same tasks** (D-rc16-3):
  `src/core/templates/workflows/explore.ts` lines 472, 504, 534, 606, 610 and 657 — the same sentences in
  the generated skill — are edited to the same pointer form in the task that edits each owning sentence.
  The `orbit-explore` hash pins move once; no fidelity marker pins any of these sentences, so the pairing
  is enforced by the task list and stated as that limit.
- **Nothing else.** No engine code, no new test beyond the pins, no new requirement (D-rc16-5). The
  "five-section" titles and their pointer sites stay as they are (D-rc16-1, Considered & out with a
  re-entry trigger).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `Mechanism entry grammar and accounted closure` (the VISIBILITY clause and the
  OPEN-DECLARED scenario's parenthetical point at the owning requirements); `Concluded exploration
  outcome` (the KNOWN paragraph's three retired limits replaced by one owner-naming paragraph);
  `Decision entry identity and classification` (the `Kind:` bullet's "maturity-signal successor" names
  the readout's requirement).
- `orbit-explore-modifications`: `Nine moves applied per rule in the Mechanism section` (the exemplar
  scenario names the fixture parse's owner, not a stage).
- `orbit-orientation`: `Bare orbit status renders the current sprint` (the `No live inference`
  scenario's THEN clause qualified); `Sprint strip composition` (the chip sentence's parenthetical
  dropped, the chip's trail-read rule kept; the hand-flip scenario qualified under `--full`).

THREE capabilities, six MODIFIED requirement blocks — AT R-crc-1's ceiling, which the charter budgets.
The exploration measured two and the proposal first restated that; the fresh proposal pass's widened
grep found the third capability's one sentence and a fifth conventions block (CORRECTED at the walk,
2026-10-01). Exit (2)'s "three directories" grades as written — the measured count was wrong, not the
charter, so no R-crc-12 revision.

## Impact

- **Specs**: six MODIFIED blocks across three capabilities; fingerprints stamped on all six.
- **Templates**: `src/core/templates/workflows/explore.ts` — six sentences (lines 472, 504, 534, 606,
  610, 657 at HEAD f3bfd0e2). Two hash pins (`getExploreSkillTemplate`, `orbit-explore`) move once, in the task
  that edits the body, with a dated reason.
- **Tests**: no new test; the parity and fidelity suites stay green with the pins re-recorded.
- **Docs**: none — CLAUDE.md and the program doc carry no sentence in the set (measured by the same
  grep; CLAUDE.md:398 already hands the two orientation sentences to Q-crc-28, and the D3-era line at
  CLAUDE.md:413 — "with no artifact reads" — sits in the section headed historical and is left as the
  record it is).
- **Exit criteria, measured on this change**: (1) the quoted sentences grep to zero on the archived
  tree; (2) `ls specs/` shows the charter's three directories and `orbit validate --strict` passes with
  MODIFIED blocks only; (3) the project-wide audit-drift run after the archive raises no Category 3 finding on the set,
  and Q-crc-28 closes on that run — an at-archive act, recorded by the archive emit and the program doc.
- **Not in scope, declared**: the title rename (D-rc16-1); `src/core/orientation.ts`' two module-level
  comments, lines 22 and 50 (true of the module's own reads and of the chip respectively — the same set
  the design and task 3.3 name); any sentence outside the classes the widened grep enumerated.
