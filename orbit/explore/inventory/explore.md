> **Status**: concluded 2026-11-23.

# Exploration: inventory

## Premise
`reduce-orbit-phase2`'s stage `inventory` (R-rop2-6): before any cut, a section-by-section inventory of the seven
generated skill bodies over the 5,000 estimated tokens Claude Code keeps of an invoked skill after a compaction
(explore, address-reviews, review, propose, archive, bulk-archive, onboard), upstream OpenSpec text included (R-rop2-4)
and explore's and onboard's own text. For each section: its size, when a session uses it, and what shows it carries
weight. The evidence is the replay set's baseline (`replay/results/2026-11-23T16-08-25Z-6076d85-baseline.json`),
`/skill-doctor`'s usage data and orbit's own record of which commands ran across the archived changes (R-rop2-5), the
broken-body runs (which emit sections the model rebuilds from orbit itself), phase 1's `evaluation` deferrals (its
D-eval-1's two replay-gated cuts, R-rop2-9), and any outside evidence Sal brings. It ends in a cut list per body (keep,
move to a reference, reword, remove) with a projected size against G1, every removal Sal's ruling citing its evidence
(G0), every move and rewording marked for the replay set (G3), and a step shared by several bodies decided once for all.

## Mechanism

### D-inv-1 — a cut is replayed only when it is postulated to change significantly what a session does
Domain: every kind of cut the three cut stages land
| member | covered by |
|---|---|
| a removal (G0) | no replay: Sal's ruling, citing its evidence, is its record (G0 as ratified) |
| a section moved to a reference read at a named moment, the basic content kept in the body | no replay, unless the cut list postulates it major |
| a rewording that keeps a step's meaning | no replay, unless the cut list postulates it major |
| a cut postulated to change significantly what a session does at the defaults | replay before and after on the cases that read the text, `npm run replay:compare` no worse |
| a cut to text only a mode or a setting reads | no replay and no new case, unless postulated major; then its case is added first (D-rs-3) |
Closure: DERIVED — a cut removes, moves or rewords text, and each is either postulated major or not; the mode-only row splits off because no case reads that text
Moves:
- READ: applied — Sal, 2026-11-23: "I'm not as concerned about replay testing now unless we make a major change and postulate that it will significantly change the system"; G3 as ratified grades every cut meant to keep behaviour
- ENUMERATE: applied — this table, by the cut kinds the stage's cut list uses (keep, move to a reference, reword, remove)
- COHERE: applied — G0's removal row is unchanged (a removal never needed a replay), so this narrows G3 only
- EXECUTE: applied — on threads 1, 2 and 4 of this exploration: every cut they settle is a move or a light rewording, none postulated major, so none is replayed (D-inv-2, D-inv-3, D-inv-5)
- FALSIFY: applied — a cut wrongly judged minor lands ungraded; the cut list names its judgement per entry, so a reviewer of the cut stage's proposal can contest it, and the baseline stays available to run at any time
- CONFORM: applied — amends `reduce-orbit-phase2`'s G3 and R-rop2-2's "before and after a cut"; the amendment is Sal's and is written into the program doc at its next architect session
- FEASIBILITY: not applied — a judgement per cut list entry
- CONSUME: applied — the cut stages' proposals read each entry's replay mark and plan a replay task only where it says yes
- INVOKE: applied — fires when the inventory writes each cut list entry, and again when a cut stage's propose plans its tasks

## Decisions
- **2026-11-23 — D-inv-1: a cut is replayed only when it is postulated to change significantly what a session does** Sal's word, at the opening of this exploration: replay testing matters now only for a major change postulated to change the system significantly, while Sal evaluates orbit by other means. Each cut list entry carries its replay mark (yes only when postulated major); moves and light rewordings land without a replay; removals were never replayed (G0). Amends `reduce-orbit-phase2`'s G3, which as ratified grades every cut meant to keep behaviour; the amendment is written into the program doc at its next architect session.
  Kind: rule
- **2026-11-23 — D-inv-2: the shared closing steps are decided once: the chain end step's second paragraph moves to its reference, the commit step stays, the decision-writing bullet is shortened** Settled under Sal's delegation ("try and settle 1-4 without me"). The chain end step's paragraph on how a chained command meets its tagged prompts (about 287 tokens, in address-reviews, apply, ff, propose and review) is needed only by a command a chain ran, and the session that chains has just read `references/chain-end-step.md` at its chain end step; it moves there, the body keeping a one-line pointer (about 35 tokens). The commit step (about 149 tokens) stays whole: it is the gating read and its `off` line. The epitome's decision-writing bullet shortens from about 129 to about 94 tokens with the same three branches (D-eval-1's deferred rewording; no replay, D-inv-1). Net about 287 tokens a body with a chain end step, 35 without. This closes no body's gap alone.
  Kind: scope
- **2026-11-23 — D-inv-3: bulk-archive stays, brought under 5,000 by moving two per-change steps to references** Settled under Sal's delegation. Its per-change sign-off hold (about 1,217 tokens) and per-change user-validation closure (about 579) move to reference files read when it reaches that step for a change, the basic content kept in the body; bulk-archive projects to about 4,286 tokens. No removal, so no G0 ruling is needed; D-eval-2's thin loop stays deferred to `automate-dev-flow`'s parallel lanes, as Sal chose. Removing bulk-archive remains open as Sal's G0 call (Open questions).
  Kind: scope
  Disposition: superseded D-inv-14
- **2026-11-23 — D-inv-4: the replay set's reach is settled by D-inv-1; no mode case is built in this program unless a cut is postulated major** Settled under Sal's delegation. The six cases read only default paths, so review's fresh-dispatch and architecture-mode text, and propose's consume-only steps, are read by no case; under D-inv-1 moving them needs no replay, and D-rs-3's "add a case when a cut first touches text only a mode reads" fires only for a cut postulated major.
  Kind: scope
- **2026-11-23 — D-inv-5: explore's mirrored grammar moves to two references, read at the moments they serve** Settled under Sal's delegation. The Mechanism-entry grammar, the closure outcomes, the nine moves and the worked exemplar (about 3,159 tokens) move to one reference read when a session captures a rule (the `A rule is captured` section-evolution rule names that moment); concluding an exploration (about 817) moves to a reference read on the user's word to conclude. Each stays byte-equal to its owner in `orbit-conventions` or `orbit-explore-modifications`, the parity tests following the bytes into the reference. The status header and the Decisions entry production stay in the body: every named session uses them. Explore projects to about 7,895 tokens, still over by about 2,895.
  Kind: scope
- **2026-11-23 — D-inv-6: what the trails show about use** Measured over the 81 workstreams with a trail (2026-11-23): address-reviews is the most-run command (459 walks in 76 workstreams, 17 more project-wide), then explore (201 emits in 79), the external review (162), fresh proposal reviews (104), apply (93), in-context system reviews (82), archive (75), propose (74), in-context proposal reviews (74) and fresh system reviews (72); architecture-mode review ran 5 times. 55 of the 79 explored workstreams captured at least one rule; 2 explore emits record a conclusion. bulk-archive, onboard, ff, new, continue, sync and verify leave no run summary, so the trails cannot show their use. Threads 1, 2 and 4 together project explore to about 7,895, address-reviews 10,348, review 9,143, propose 7,840, archive 6,928, bulk-archive 4,286 and onboard 5,575.
  Kind: fact
- **2026-11-23 — D-inv-7: address-reviews fits by moving step procedure to references at the moments that use it, with no removal** The cut list is `sketches/address-reviews.md`: eleven moves (discovery, multi-source triage, ripple-miss attribution, batch triggers, decision-lane detection, the sweep record, reading findings, the redesign route, the report template, the per-source log rule, the ripple cascade) plus D-inv-2's chain paragraph and two rewordings (Constraints' restatements dropped, the prose that stays tightened). Projected 10,635 to about 4,546 tokens. Every entry is a move or a light rewording, so none is replayed (D-inv-1). Use counts come from the 476 walk logs on this repository's trails: the decision lane in 205, a sweep in 238, ripple-miss attribution in 39, a CRITICAL re-run in 18, a reading finding in 12, a rediscovered pass in 10 of 457 passes, a redesign in 4, a blind-pair disagreement in none and batch mode in none.
  Kind: scope
- **2026-11-23 — D-inv-8: review fits by moving its mode- and genre-only procedure to references, with no removal** The cut list is `sketches/review.md`: the VERIFICATION procedure with its verdicts and sweep scope (read when the pass genre is VERIFICATION), the fresh-pass dispatch and a pair's re-run (read when the reviewer is fresh), architecture mode (read with `--as architecture`, 5 passes ever), the flag and selector tables (read at Step 3), D-inv-2's chain paragraph, and two rewordings (a duplicated "Output format" section dropped, the preamble's dispatch detail cut). Projected 9,430 to about 4,509 tokens. None replayed (D-inv-1).
  Kind: scope
- **2026-11-23 — D-inv-9: propose fits by moving consume mode to a reference read when mode detection resolves consume** The cut list is in `sketches/explore-propose-archive-onboard.md`: consume mode's Steps 0a, 0b, 0c, 0c.6 and 0d with its graceful-degradation cases, plus D-inv-2's chain paragraph. Projected 8,127 to about 4,510 tokens on the moves alone, about 4,059 tightened. Step 0c.5 (Touchpoints) stays, since it runs in both modes. None replayed (D-inv-1).
  Kind: scope
- **2026-11-23 — D-inv-10: archive fits by moving the paths a default typed archive does not take** The cut list is in `sketches/explore-propose-archive-onboard.md`: consent at entry's AI-mediated and granted paths, the user-validation closure's procedure, the brief save's failure table and the PR-attached steps, each read when its case arises, plus the readiness line's justification paragraph dropped. Projected 6,963 to about 5,047 tokens on the moves, about 4,542 tightened. None replayed (D-inv-1).
  Kind: scope
- **2026-11-23 — D-inv-11: explore fits only with its prose tightened, after D-inv-5 and three more moves** The cut list is in `sketches/explore-propose-archive-onboard.md`: D-inv-5's two references, the crystallization flow (read when a bare session reaches two substantive decisions or the user asks to name it), the emit timing (read before the first emit), the new-exploration metadata (read at scaffold), and two rewordings of upstream text (one of the four entry-point examples kept, R-rop2-4; the propose composition in one sentence). Projected 11,816 to about 5,504 tokens on these, about 4,954 with the prose that stays tightened by about 10%: the tightest of the seven. None replayed (D-inv-1).
  Kind: scope
  Disposition: superseded D-inv-16
- **2026-11-23 — D-inv-12: onboard fits by moving its PR-layer paragraphs and shortening its disciplines list** The cut list is in `sketches/explore-propose-archive-onboard.md`. Projected 5,575 to about 4,879 tokens, about 4,391 tightened. None replayed (D-inv-1).
  Kind: scope
- **2026-11-23 — D-inv-13: every body fits under G1 on moves and light rewordings, and no removal is needed** With D-inv-2, D-inv-3, D-inv-5 and D-inv-7 to D-inv-12, the projected sizes are: explore about 4,954, address-reviews 4,546, review 4,509, propose 4,059, archive 4,542, bulk-archive 4,286, onboard 4,391 (the last four tightened; explore needs its tightening to fit). The steps shared across bodies are each decided once (the table in `sketches/explore-propose-archive-onboard.md`). So G0 has nothing it must rule for size: the removal candidates the inventory found (bulk-archive, address-reviews' batch mode and disagreement test) are questions of what is proving itself, left to Sal.
  Kind: fact
  Disposition: superseded D-inv-17
- **2026-11-23 — D-inv-14: bulk-archive is removed** Sal's ruling (G0), on the inventory's evidence: no record of it ever running in this repository (it writes no run summary, and no trail names a bulk archive), orbit is single-user and single-session with concurrency a non-goal, its per-change steps mirror archive's and have cost 20 template edits since June to keep in step (D-eval-2), and the parallel lanes D-eval-2 waited on belong to `automate-dev-flow`, which R-rop2-3 sends back to architecture before any of its stages is proposed. The removal takes the workflow template `src/core/templates/workflows/bulk-archive-change.ts`, the skill `orbit-bulk-archive-change`, its references and its `/orbit:bulk-archive` launcher, and its mentions in the baseline specs `orbit-architect`, `orbit-archive-modifications`, `orbit-base-fingerprints`, `orbit-conventions`, `orbit-engine-gates`, `orbit-lifecycle-consent`, `orbit-run-summary-emit` and `orbit-decision-records`, in onboard's command table, in the tests and in the docs; D15's full surface goes from 15 workflows to 14. An adopter archives several changes one at a time with `/orbit:archive`. Supersedes D-inv-3. Its stage is `cut-propose-archive`.
  Kind: scope
- **2026-11-23 — D-inv-15: address-reviews' batch mode and the blind-pair disagreement test are removed** Sal's ruling (G0): neither has fired in the 476 walk logs on this repository's trails (438 per-finding, 30 legacy walk-mode logs, no batch; no resolution carries a `disagreement`). The removal takes the three batch triggers (`--batch`, the verbal phrase, the command-shaped mid-walk switch) and their records (`walk_mode_source`, `walk_mode_shifted_at_finding`), the disagreement rule and its `disagreement` record, and their text in the address-reviews, review, audit-drift and onboard templates and in the baseline specs `orbit-address-reviews`, `orbit-decision-records`, `orbit-audit-drift` and `orbit-engine-gates`; walk mode becomes the only mode, and a contradiction between a pair's halves is walked like any two findings. Logs written before the removal keep their fields, and readers keep reading them. Its stage is `cut-review-walk`.
  Kind: scope
- **2026-11-23 — D-inv-16: explore drops the illustrative upstream text, and fits on moves alone** Sal's ruling (G0, R-rop2-4: "ok to remove some of openspec's original stuff"; the examples need not stay): the four "Handling Different Entry Points" dialogues, the ASCII box under "Visualize" (the stance already says to use diagrams liberally), "Ending Discovery"'s summary template (its one-line point kept) and the Guardrails lines that repeat the opening's "don't implement" and the stance are removed. With D-inv-5's two references, the crystallization flow (read when a bare session reaches two substantive decisions or the user asks to name it), the emit timing (read before the first emit), the new-exploration metadata (read at scaffold) and the propose composition in one sentence, explore projects from 11,816 to about 4,926 tokens on these cuts, about 4,430 with the prose that stays tightened. Supersedes D-inv-11. Its stage is `cut-explore-onboard`.
  Kind: scope
- **2026-11-23 — D-inv-17: every remaining body fits under G1, with Sal's three removals** Projected sizes: explore about 4,926 (4,430 tightened), address-reviews about 4,546 or less (batch mode and the disagreement test now removed rather than moved), review 4,509, propose 4,059, archive 4,542, onboard 4,391; bulk-archive removed. The steps shared across bodies are each decided once (the table in `sketches/explore-propose-archive-onboard.md`). Supersedes D-inv-13.
  Kind: fact
- **2026-11-23 — D-inv-18: the inventory concludes; nothing is built from it** Sal's word. Its output is decisions: the cut lists in `sketches/` for the seven over-budget bodies, every one projected under 5,000 estimated tokens (D-inv-17); Sal's replay rule (D-inv-1, amending G3); and Sal's three removals (D-inv-14 bulk-archive, D-inv-15 address-reviews' batch mode and disagreement test, D-inv-16 explore's illustrative upstream text). The next architect session writes D-inv-1 and the three removals into `reduce-orbit-phase2` as rulings and offers the stage for ratification; each cut stage (`cut-review-walk`, `cut-propose-archive`, `cut-explore-onboard`) proposes its own change from its cut list. No change is proposed from this file.
  Kind: scope
  Re-entry: a cut stage finds a body that its cut list does not bring under 5,000, or a cut the inventory marked minor turns out to change what a session does

## Open questions

## Considered & out
- **2026-11-23 — Keeping bulk-archive under 5,000 by moving two per-change steps (D-inv-3):** it fit, but Sal removed it (D-inv-14): never run here, concurrency a non-goal.
- **2026-11-23 — Keeping one of explore's four entry-point examples (D-inv-11's R1):** Sal removed all four (D-inv-16); the stance bullets carry what they illustrate.

## References
- `orbit/architecture/reduce-orbit-phase2.md` — stage `inventory`'s charter, G0 to G3, R-rop2-4/5/6/9
- `orbit/architecture/reduce-orbit-phase1.md` and `reduce-orbit-phase1-brief.md` — what phase 1 moved and left
- `orbit/explore/evaluation/explore.md` — D-eval-1 to D-eval-8, the deferred cuts
- `skill_body_convention.md` — the rules a body follows (basic content in the body, procedure in a reference file)
- `replay/README.md` and the baseline record — how a cut is graded before and after
