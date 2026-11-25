## Context

`reduce-orbit-phase2`'s stage `cut-propose-archive` (its charter and exit criteria are in
`orbit/architecture/reduce-orbit-phase2.md`) applies the inventory's cut lists for propose and archive
(`orbit/explore/inventory/sketches/explore-propose-archive-onboard.md`, D-inv-9 and D-inv-10) and Sal's removal of
bulk-archive (R-rop2-11, D-inv-14). Every cut list entry is a move to a reference read at a named moment, a light
rewording, or that removal. None is marked for the replay set (R-rop2-10).

Sizes below are `npm run size:report`'s at `a1c1f273` (characters / 4, the generated `SKILL.md` with its frontmatter).
The spans were measured on the generated bodies at propose:

| body | now | spans that leave | basic content added | after the moves | after R2 |
|---|---|---|---|---|---|
| `orbit-propose` | 7,982 | P1 about 3,300 (Steps 0a to 0d; Step 0c.5, which stays, excluded), P2 188 | about 150 | about 4,640 | not needed |
| `orbit-archive-change` | 7,041 | A1 556 (the two bullets, 680, less their classifying sentences, 124, which stay), A2 about 580, A3 308, A4 557 (Step 0.7 300; Step 4.9's carry-forward 76 and its HEAD note 39; Step 5.8 142), R1 104 | about 355 | about 5,290 | about 4,780 |
| `orbit-apply-change` | 3,712 | A1's apply half 204 (334, less its classifying sentences, 130) | about 50 | about 3,560 | — |

Propose fits on its moves. The chain end step's tag paragraph the sketch counted for it left at `cut-review-walk`
(R-rop2-14), so P1 and P2 are what remain. Archive is about 290 over after its moves (re-measured at the walks,
2026-11-25, once Step 4.9 kept its rows, Step 0.7 and Step 3.2 kept their read timing in the body, and Step 0 kept its
classifying sentences) and fits only once R2 tightens the prose that stays, with about 220 to spare. Apply already fits; its Step 0 moves because the inventory decided consent at
entry once for both bodies (the sketch's shared-steps table, A1), and `structure over size` keeps one shape per step.

The bodies are composed in `src/core/templates/workflows/propose.ts`, `archive-change.ts` and `apply-change.ts`.
Consume mode interpolates two explore productions (`EXPLORE_DECISION_ENTRY_PRODUCTION`,
`EXPLORE_MECHANISM_ENTRY_PRODUCTION`), held byte-equal to their owners by parity tests. Bulk-archive is one template,
`bulk-archive-change.ts`, registered in `src/core/profiles.ts` (`ALL_WORKFLOWS`), `profile-sync-drift.ts`
(`WORKFLOW_TO_SKILL_DIR`), `shared/tool-detection.ts` (`SKILL_NAMES`, `COMMAND_IDS`), `shared/skill-generation.ts`,
`templates/skill-templates.ts` and `commands/config.ts`'s workflow labels.

## Goals / Non-Goals

**Goals:**

- Propose and archive each at most 5,000 estimated tokens (G1), with their character ceilings in
  `skill-body-budget.test.ts` lowered (G2). Apply's, onboard's and sync-specs' are lowered too wherever this change
  brings their size plus 5% under the ceiling.
- Bulk-archive removed whole, with every spec, body, reference, test and doc that names it brought to agree (G0). An
  adopter's existing install converges on its next `orbit update`.
- Every edit named (G0): the removal by its ruling, and every edit to a body's instructions as a pair in the cut ledger.
- For every cut that is not a removal, behaviour is kept: a session reads the same text, at the step that uses it.

**Non-Goals:**

- The decision-writing bullet's shortening (D-inv-2). Neither body needs it: archive fits on R2. It touches all thirteen
  carriers and is left to `cut-explore-onboard` if explore needs it, or to the close.
- Explore's and onboard's own cuts (`cut-explore-onboard`). Onboard is touched here only to drop its bulk-archive
  command row and the PR-layer sentence's bulk-archive clause, as R-rop2-11 names onboard's command table.
- Any replay run (R-rop2-10).
- Moving archive's Step 5.6 (the tail): its body text is already a pointer to `references/pr-archive-tail.md` with the
  call; the sketch's A4 does not list it.

## Decisions

### D1 — Propose's consume mode moves whole to one reference, read at mode detection's consume outcome

P1 and P2 from the sketch go to `references/consume-mode.md`, byte-equal. That covers Step 0a, Step 0b with the two
interpolated productions, Step 0c, Step 0c.6 with its table, the CLOSED shapes and the record, the "Before Step 0d"
grep, Step 0d, and the Graceful degradation section's two consume-mode cases (`explore.md` missing sections; no
Decisions). Its other two cases are not consume mode's (the fresh review, walked 2026-11-25): "No staging directory but
user explicitly invoked propose → standalone mode, no message" stays in the body under the section's heading, so a
standalone session still reads it; and the conflict case restates Step 0's step 2, so it leaves the body as a
`restated` pair naming that step. The body keeps four things:

- **Step 0**, mode detection whole: it decides whether the reference is read, and its concluded refusals stop before
  any read.
- **Step 0c.5**: Touchpoints run in both modes.
- **The Consume-mode flow heading**, with its basic content: "Replaces upstream Step 1. After the PR lifecycle's Step 0.5
  (Phase 1), read `references/consume-mode.md` and follow it: its Steps 0a to 0c.6 run before and during generation,
  feeding Step 0c.5's Touchpoints, and its Step 0d runs after the size brief."
- **The Standalone mode section**, unchanged.

Step 3 of mode detection names the outcome "consume mode (continue with consume-mode flow below; skip upstream Step 1)".
The pointer "below" still holds, because the flow's heading stays.

Two positional pointers inside the moved text would go wrong and are reworded before the move (`reworded` pairs):
Step 0c's Touchpoints row says "(authored below)", which becomes "(the body's Step 0c.5)"; and Step 0d's opening says
"the size brief below has run", which becomes "the body's size brief has run" (`size-declaration-parity.test.ts`
asserts that string in the body and follows it to the reference). A grep of the moved span for "below", "above", "next
bullet" and "the other two paths" (the walk, 2026-11-25) found five more, each pointing within the moved text and true
in the reference: Step 0b's "the entry form below", Step 0c's "treated as above", Step 0c.6's "the CLOSED shapes below",
and Step 0d's "merged above" and "(as above)". The opening of Step 0c.6 names "the `Mechanism section consumption`
requirement's decision table", which holds as is. The references `size-brief.md` and
`pr-choreography.md` name "Step 0d's move" by name, never by position, so they hold.

The order rules `orbit-propose-modifications` states hold because the body sets the read point:

- The concluded refusal is decided in Step 0, before Phase 1 (`Consume mode when staging directory exists`).
- The structure check runs after Phase 1.
- The size brief runs before Step 0d (`Size brief after generation`).

The two mirrors move with their text. `orbit-propose-modifications`' `Validate explore.md structure before consuming`
and `Mechanism section consumption` are modified to name the reference. The test holding
them in propose, `orbit-content-fidelity` (its rc13c block), re-anchors on the reference, with its byte-equality
unchanged. `explore-grammar-parity` reads explore's copies only and is untouched.

Chosen over two references (structure check and open questions; Mechanism carry and move): one moment reads them all,
and a consume session needs every step.

### D2 — Archive's four moves, apply's consent half, and R1

- **A1**: the procedures of archive's AI-mediated and Granted bullets go to `references/consent-at-entry.md`. Each
  bullet keeps its classifying sentence in the body: AI-mediated is "everything else — delegation phrases ("finish the
  cadence"), inference ("continue"), a handoff document, a chain, or an eligibility readout pointing here", and Granted
  is its opening sentence, ending "with `may_run: true`". So the body holds the whole provenance classification, as
  `orbit-lifecycle-consent`'s modified `Consent prompts at consent-marked seams` says (the verification pass, walked
  2026-11-25). What moves is what each path does: the prompt, its preview and outward line, what each path records, and
  the tag handling. The body keeps the Step 0 heading, the ordering invariant, the three classifying bullets, the
  uncertainty bullet, the era stamp and sync inheritance, plus one sentence keyed on Step 0's own classification,
  never on whether a command was typed: "On an arrival classified
  above as AI-mediated or granted, read `references/consent-at-entry.md` and follow it before any write." An explicit
  same-turn prose request ("archive it") is user-invoked by the User-invoked bullet and never reads the reference (the
  external review, walked 2026-11-25). Apply's Step 0 gets the same move into its own `references/consent-at-entry.md`. The texts differ (apply's
  preview names tasks, archive's names deltas and the outward tail), so each skill carries its own, under one file name.
  Apply's Step 0 is orbit text inside the upstream portion of its body (upstream's apply begins at Step 1), so the
  edit is named in `orbit-lifecycle-consent`'s modified `Consent prompts at consent-marked seams`, which says where the
  rule lives in both bodies (`Generated-file disposition`; the fresh review, walked 2026-11-25).
  Two pointers in the moved Granted bullets would point at the body from the reference, and are reworded before the
  move (`reworded` pairs): "stamp the consent era below as on the other two paths" (archive and apply) becomes "stamp
  the consent era (the body's Consent-era stamp) as on the other two paths", and archive's "each prompt below is met by
  the kind its tag names" becomes "each of the body's later prompts is met by the kind its tag names". The AI-mediated
  procedure's "Unless the arrival is granted (next bullet)" (archive and apply) loses "(next bullet)", a `reworded`
  pair, since the Granted class it names stays in the body.
- **A2**: Step 3.2's two dispositions, the check against the production, the DEFERRAL REFUSALS fence and the brief go to
  `references/user-validation.md`. The body keeps the heading, its position sentence, the "says nothing" case, the read,
  and the recovery after the move. That recovery is needed at Step 5.5, after the reference's moment has passed.
  `deferral-refusals-parity` re-anchors on the reference. The body's scan has three outcomes (the external review,
  walked 2026-11-25): no unchecked marked task, so it says nothing; one or more, so it reads the reference; or a
  `tasks.md` that exists and cannot be read, which the body reports for repair or abort before the sync and the move
  (the case the production calls "any other failure to read it"), never treating it as an empty marked set. A missing
  `tasks.md` is an empty marked set, as the production says. Upstream Step 3's exclusion of marked tasks is
  a named in-place edit in the upstream portion, which stays.
- **A3**: Step 3.6's table and the sentence on its rows go to `references/brief-save.md`. The body keeps the position,
  the command, "on success say nothing and go on", the read on a non-zero exit, and the sentence on not showing the path
  and hash. The table's third row (a later stop) needs no read at the save: it states what is already true.
- **A4**: Step 0.7's procedure goes to `references/pr-archive-tail.md`, which already exists: the HEAD comparison, the
  mismatch notice and the granted-arrival named limit. The body keeps Step 0.7's heading and its timing, now stated
  against Step 0 (option A of the fresh review's finding, walked 2026-11-25): "Part of Step 0's read-only discovery, on
  every arrival, BEFORE a consent prompt is composed and before the consent-era stamp: read `pr_attachment` from the
  latest attachment-bearing propose or ff emit; when there is one, read `references/pr-archive-tail.md` and run its
  entry observation now, so a HEAD mismatch is named in the consent preview when one fires, and otherwise as one line
  before Step 1." That keeps today's sequence (the mismatch in the preview) and `Consent prompt on AI-mediated archive
  entry`'s "the one line the entry observation prints before Step 1" true. Chosen over carrying the mismatch clause in
  `consent-at-entry.md` (option B), which would state the HEAD comparison in two references. The reference already holds two of A4's pieces, so each piece is classified
  (the fresh review, walked 2026-11-25):
  - Step 0.7's procedure is NEW to the reference: a `moved` span into a new section, "Entry observation, before any
    write", placed before "Preflight, before the move".
  - Step 4.9 keeps in the body its position, the command, the `off` row with its one unattached line, the non-zero-exit
    row (report verbatim, continue unattached) and the read cue on any other result: "read `references/pr-archive-tail.md`
    now, if Step 0.7 did not, and carry its record forward". An unattached change never read the reference at Step 0.7,
    so the cue cannot assume it (the external review, walked 2026-11-25). Only its carry-forward sentences, which restate
    the reference's "Preflight, before the move" bullets in other words, and its closing note on the HEAD observation
    leave the body, as `reworded` pairs; the reference is not edited for them.
  - Step 5.8's per-change echo restates the reference's "At the close"; it leaves the body as a `reworded` pair. Its
    two sentences the reference lacks, the program-PR line and the skipped-on-invalidation line, are `moved` into
    "At the close", after its paragraph.
  - The reference's opening "Loaded when `orbit pr preflight` returned anything but `off`" becomes false and is
    reworded: "Read at the archive's Step 0.7 when the change's trail carries a `pr_attachment`, and at Step 4.9 when
    `orbit pr preflight` returns anything but `off`." References are not hashed by the ledger, so this edit and the
    two added sentences are named in the archive.
  The body keeps Step 5.8's heading with one sentence saying the echo is the reference's, read by then.
  `pr-references.test.ts`, which reads Step 5.8's `human_acts` and "Run none of them." from the body, follows the
  text to the reference.
- **R1**: Step 5.65's second paragraph ("This line is the record's READER…") is a rationale.
  `orbit-archive-modifications`' requirement carries it, so dropping it from the body is a `reworded` pair. The ledger
  then reconstructs it, and the spec keeps it.
- **R2**: the prose that stays in archive is tightened, with no step removed. Each edit is a `reworded` pair.

Shared across the two bodies, decided once: consent at entry (A1 in both). The commit step stays whole. The chain end
step was settled at `cut-review-walk`.

### D3 — Bulk-archive is retired the way review-external was

The template and its launcher function are deleted. Its id leaves `ALL_WORKFLOWS`, `WORKFLOW_TO_SKILL_DIR`,
`SKILL_NAMES`, `COMMAND_IDS`, the generator registry and the config picker's labels. `orbit-bulk-archive-change` and
`bulk-archive` join `RETIRED_SKILL_DIRS` and `RETIRED_COMMAND_IDS`, so a pre-existing surface is drift and a plain
`orbit update` removes both. This follows `orbit-skill-generation`'s `Retired surface artifacts converge on update`,
whose registry "grows on any future retirement". A stored profile whose workflow list names `bulk-archive` changes nothing:
under D15 `getProfileWorkflows` returns every workflow, and drift detection drops unknown ids (`toKnownWorkflows`).

The clauses that named it go from the specs, as the delta specs show. Four statements stay as records: they say what a
past stage did, and they were true when written:

- `orbit-conventions`' `Restated Guardrails lines are removed from orbit-modified bodies` ("explore's and bulk-archive's
  are untouched").
- The same spec's provenance table's mirror-note count.
- The same spec's decision-writing parity row ("fourteen bodies until `records-by-setting`").
- `orbit-skill-generation`'s reference table ("all fourteen skills", framed as "the files it covers when
  `tighten-bodies` introduced it").

Bodies and references that name bulk-archive follow:

- Archive's AI-mediated bullet, whose "likewise omitted under `/orbit:bulk-archive`" clause moves into the reference and
  drops there. Because the ledger hashes the text before the move, that clause is dropped before the text moves, as a
  `removed` pair.
- `archive-summary-schema.md`'s consent field note.
- `archive-change.ts`' comment on `SIGNOFF_HOLD_STEP`.
- Onboard's command row and its PR-layer sentence.
- Sync-specs' consent-inheritance example ("bulk-archive Step 8a"), which is in its `# Orbit additions`.

The project-root `skill_body_convention.md`'s Exceptions paragraph drops its bulk-archive clause ("bulk-archive (its
sign-off hold, PR section and divergence check, and its per-change archive emit), "), leaving explore and onboard.
Docs: `docs/commands.md` loses its section, its index row and its consent sentence's bulk clause. `docs/concepts.md`,
`docs/workflows.md` and `docs/workflow-engine.md` drop their mentions. The 15-workflow and fourteen-skill counts in
`README.md`, `docs/cli.md`, `docs/commands.md`, `docs/installation.md`, `docs/migration-guide.md`,
`docs/supported-tools.md` and `CLAUDE.md` become 14 and thirteen. The README's install section is synchronized and the
install surface checked in a fresh sandbox (`orbit-conventions`' `Install documentation describes actual install
surface`).

Chosen over keeping the template with the workflow deselected: D15 keeps profile gating inert, so a kept template would
be installed.

### D4 — The cut ledger records this stage's bodies and gains a `retired` kind

This stage records afresh, before its first edit, the `instructions` hash of each body it edits: propose, archive, apply,
onboard and sync-specs, generated from HEAD. Three of them (propose, apply, onboard) already carry `cut-review-walk`'s
recorded hashes, so the ledger's flat `CUT_RECORDED` map (body to hash, asserted at six entries) cannot hold this stage's
(the fresh review, walked 2026-11-25). The recorded hashes and the pairs become PER STAGE: `CUT_RECORDED` maps each stage
to its own body-to-hash map, and each pair names its stage. The reconstruction runs newest stage first: it undoes this
stage's pairs and compares every body this stage records with this stage's hash, then undoes `cut-review-walk`'s pairs
and compares with that stage's hashes (`A cut ledger names every body edit a cut stage makes`: "a body a later stage
edits again being recorded afresh by that stage, whose undo runs first"). `tightened-bodies.test.ts` undoes both stages'
pairs, newest first, before its own. The count assertion becomes one per stage (six for `cut-review-walk`, five here).

Moves are `moved` pairs. A4's `moved` spans go into an existing reference, so their anchors name the new spans
there, and its restating sentences are `reworded` (D2). Rewordings
(D1's two pointers, R1 and R2) are `reworded` pairs. The bulk clauses dropped from archive's and onboard's bodies, and
sync-specs' example, are `removed` pairs naming R-rop2-11, each with a phrase that leaves the skill entirely.

The bulk-archive body cannot be recorded and undone, because no body remains, so the ledger gains a kind. A `retired`
pair names R-rop2-11, `orbit-bulk-archive-change` and `bulk-archive`, and holds three things:

- no generated skill or launcher carries that directory or id;
- both are in the retired registry;
- a phrase specific to the workflow (`orbit-bulk-archive-change`) occurs in no generated skill.

Phase 1's tighten-bodies ledger drops bulk-archive's recorded hash and its pairs, with a dated note, since its
reconstruction needs today's body. Its requirement says so, and its decision-writing rows count thirteen bodies.

Chosen over leaving the retirement outside the ledger with only the archive's prose naming it: G0 asks that every
change be named in a form a test checks.

### D5 — Ceilings come down after the last edit

After the last body edit (the walk's included), each edited body's character ceiling is lowered the way
`cut-review-walk`'s D7 did:

- a body that fits G1 gets the smaller of its size plus 5% and 20,000 characters;
- any other edited body gets its size plus 5%, unless that exceeds its current ceiling;
- each lowering is a named edit naming its previous ceiling.

Bulk-archive's ceiling entry is deleted with the body.

## Alternatives considered

- **Keeping bulk-archive under 5,000 by moving its per-change steps (D-inv-3):** Sal removed it (R-rop2-11, D-inv-14),
  since it has never run here and concurrency is a non-goal.
- **Splitting the removal from the cuts into two changes:** the removal alone touches nine capabilities, so neither part
  fits the ceiling. Sal chose to declare (the proposal's Size section).
- **Leaving apply's Step 0 as it is, since apply fits:** two shapes for one step that the inventory decided once (D2).
- **Shortening the decision-writing bullet here to add margin for archive:** R2 gives the margin. The bullet touches
  thirteen bodies (Non-Goals).

## Risks / Trade-offs

- [Archive is about 290 over after its moves and fits only with R2, about 220 to spare.] → Apply measures `npm run size:report` after the moves and before
  R2. A body still over 5,000 after R2 meets the inventory's re-entry trigger ("a cut stage finds a body that its cut
  list does not bring under 5,000"), and the stage raises it rather than cutting further without naming the cut.
- [A consume session skips reading `consume-mode.md`, or reads it before Phase 1.] → The body's read sentence names the
  moment after Step 0.5. Under R-rop2-10 no case covers consume mode (D-inv-4), so the risk is graded by the proposal's
  reviewers.
- [A session on a PR-attached change does not read `pr-archive-tail.md` early enough to warn of a branch mismatch.] → A4
  keeps the attachment read and the read cue in Step 0.7's basic content, inside Step 0's read-only discovery and before
  a consent prompt is composed, so the mismatch reaches the preview. The tail's HEAD precondition stays the guard.
- [An adopter's install keeps a stale `orbit-bulk-archive-change` until their next update.] → The retired registry
  removes it on a plain update. Until then the stale skill still works on its own text, since it calls no command this
  change removes.
- [`orbit-lifecycle-consent`'s "Workflow bodies SHALL fire a consent AskUserQuestion" and `orbit-engine-gates`' "the
  consuming workflow bodies implement the consent prompt" read "body" as the skill layer, as against hooks.] → Left
  unmodified: the body still fires the prompt, reading its reference at entry, before any write. Recorded here for the
  reviewers.

## At archive

- Purposes edited in place (no delta carries `## Purpose`):
  - `orbit-lifecycle-consent`: "(apply / archive / bulk-archive per change; …)" drops "/ bulk-archive per change".
  - `orbit-base-fingerprints`: "the agent-driven archive workflows run" becomes singular.
- The Shipped as names the removal with its ruling (R-rop2-11), the files it took, the tests each edit followed, the
  four historical statements kept as records (D3), and the measured sizes.

## Touchpoints

- `src/core/templates/workflows/propose.ts` — the body; the new `consume-mode.md` reference.
- `src/core/templates/workflows/archive-change.ts` — the body; new `consent-at-entry.md`, `user-validation.md` and `brief-save.md`; `pr-archive-tail.md` gains A4; `archive-summary-schema.md`'s consent note.
- `src/core/templates/workflows/apply-change.ts` — Step 0; a new `consent-at-entry.md`.
- `src/core/templates/workflows/bulk-archive-change.ts` — deleted.
- `src/core/templates/workflows/onboard.ts` — its bulk-archive row and sentence.
- `src/core/templates/workflows/sync-specs.ts` — its consent-inheritance example.
- `src/core/templates/skill-templates.ts` + `src/core/shared/skill-generation.ts` — the registry.
- `src/core/profiles.ts` + `src/core/profile-sync-drift.ts` + `src/core/shared/tool-detection.ts` + `src/commands/config.ts` — the workflow id, the retired registry.
- `README.md` + `docs/` — the command's section, mentions and counts.
- `CLAUDE.md` — the D15 count.
- `skill_body_convention.md` — its Exceptions paragraph's bulk-archive clause.
- `test/core/templates/cut-ledger.test.ts` + `test/core/templates/cut-ledger-pairs.ts` — this stage's hashes and pairs, the `retired` kind.
- `test/core/templates/tightened-bodies.test.ts` — drops bulk-archive.
- `test/core/templates/skill-body-budget.test.ts` — ceilings.
- `test/core/templates/skill-templates-parity.test.ts` — hashes.
- `test/core/templates/*.test.ts` — the tests that read moved or removed text (orbit-content-fidelity, archive-user-validation, brief-save-step, signoff-hold-step, run-summary-read-cue, commit-step, moved-blocks, verify-scenario-map, orbit-generated-surface, chain-prompt-tags, pr-references).
- `test/core/size-declaration-parity.test.ts` — Step 0d's text, followed to the reference.
- `orbit/scenario-ledger.yaml` — the bulk-archive scenario's entry.
- `test/core/deferral-refusals-parity.test.ts` — re-anchored on `user-validation.md`.
- `test/core/` + `test/commands/` + `test/utils/` — the tests that enumerate workflows (init, update, profiles, chain, tool-detection, skill-generation, command-generation adapters, config-profile, command-references, user-docs coverage, validate.sources).
