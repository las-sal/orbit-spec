## 1. Record before editing

- [ ] 1.1 Run `npm test` for the green baseline count. Then, before any template is edited, record in `test/core/templates/cut-ledger-pairs.ts` this stage's sha256 of the `instructions` of the five bodies it edits (`orbit-propose`, `orbit-archive-change`, `orbit-apply-change`, `orbit-onboard`, `orbit-sync-specs`), generated from HEAD, its undo running before `cut-review-walk`'s (design D4).

## 2. Retire bulk-archive (R-rop2-11, design D3)

- [ ] 2.1 Delete `src/core/templates/workflows/bulk-archive-change.ts`, and take its id out of `ALL_WORKFLOWS`, `WORKFLOW_TO_SKILL_DIR`, `SKILL_NAMES`, `COMMAND_IDS`, the generator registry in `shared/skill-generation.ts`, the exports in `templates/skill-templates.ts` and `commands/config.ts`' labels. Add `orbit-bulk-archive-change` / `bulk-archive` to `RETIRED_SKILL_DIRS` / `RETIRED_COMMAND_IDS`, with a test for the scenario `Plain update removes the retired bulk-archive surface`.
- [ ] 2.2 Drop every bulk clause from the bodies and references:
  - archive's AI-mediated "likewise omitted under `/orbit:bulk-archive`" clause, before A1 moves it;
  - `archive-summary-schema.md`'s consent note and the `SIGNOFF_HOLD_STEP` comment;
  - onboard's command row and its PR-layer sentence's clause;
  - sync-specs' "bulk-archive Step 8a" example.

  Each body edit is a `removed` pair naming R-rop2-11 with a phrase that leaves the skill entirely. Add the ledger's `retired` kind with its pair and its checks (design D4).
- [ ] 2.3 Phase 1's `tightened-bodies.test.ts` drops bulk-archive's recorded hash and pairs, with a dated note; its decision-writing rows count thirteen bodies.
- [ ] 2.4 The tests that enumerate or read bulk-archive follow:
  - `init`, `update`, `profiles`, `chain`, `tool-detection`, `skill-generation`, `command-generation/adapters`;
  - `config-profile`, `command-references`, `user-docs/coverage`, `validate.sources`;
  - `orbit-content-fidelity`, `orbit-generated-surface`, `archive-user-validation`, `brief-save-step`, `signoff-hold-step`;
  - `run-summary-read-cue`, `commit-step`, `moved-blocks`, `verify-scenario-map`, `deferral-refusals-parity`.

  Each edit is named for the archive. The frozen `test/fixtures/change-size/rc04c/` copies are left as they are.

## 3. Propose's moves (design D1)

- [ ] 3.1 Reword Step 0c's "(authored below)" Touchpoints pointer to "(the body's Step 0c.5)" as a `reworded` pair, then move P1 (Steps 0a, 0b with the two interpolated productions, 0c, 0c.6, 0d) and P2 (Graceful degradation) to `references/consume-mode.md`, byte-equal, as `moved` pairs. The body keeps Step 0, Step 0c.5, the Standalone section and the Consume-mode flow's basic content, with D1's read sentence after Step 0.5 and Step 0d after the size brief.
- [ ] 3.2 `orbit-content-fidelity`'s rc13c block re-anchors on the reference, with its byte-equality unchanged. Add a test for the scenario `The section list ships in the consume-mode reference`: the body names the reference at the consume outcome and carries neither mirror.

## 4. Archive's and apply's moves (design D2)

- [ ] 4.1 A1: archive's AI-mediated and Granted bullets go to its `references/consent-at-entry.md`, and apply's Step 0 bullets to its own `references/consent-at-entry.md`. Each body keeps D2's basic content and the read before any write.
- [ ] 4.2 A2: Step 3.2's procedure and the DEFERRAL REFUSALS fence go to `references/user-validation.md`. The body keeps the position, the "says nothing" case, the read and the recovery. `deferral-refusals-parity` re-anchors on the reference, with a test for the scenario `The archive body reads the user-validation reference only when a marked task is unchecked`.
- [ ] 4.3 A3: the brief save's table and its rows sentence go to `references/brief-save.md`, with a test for the scenario `The archive body's basic content handles a save that succeeds`. A4: Step 0.7's procedure, Step 4.9's carry-forward and Step 5.8's echo go to `references/pr-archive-tail.md`. The body keeps the attachment read and the early read cue before Step 1.
- [ ] 4.4 R1 (the readiness paragraph, `reworded`). Measure `npm run size:report`, then R2: tighten the prose that stays in archive, with no step removed, each edit a `reworded` pair. Grep every archive, apply and propose reference for pointers into the moved sections ("the body's", "Step N", the moved headings) and re-point each hit.

## 5. Docs, the surface, the ledgers and the budgets

- [ ] 5.1 Docs (design D3):
  - `docs/commands.md`: the section, the index row and the consent sentence's bulk clause;
  - the mentions in `docs/concepts.md`, `docs/workflows.md` and `docs/workflow-engine.md`;
  - the counts in `README.md`, `docs/cli.md`, `docs/commands.md`, `docs/installation.md`, `docs/migration-guide.md`, `docs/supported-tools.md` and `CLAUDE.md`.

  `npm run build`, then run `node bin/orbit.js init --tools claude` in a fresh sandbox and check the README's install section against the surface it writes: 14 skills, 14 launchers, thirteen with `references/`. Then run a plain update over a sandbox holding an old `orbit-bulk-archive-change`.
- [ ] 5.2 Each new reference is named by its body by path; one over 100 lines opens with `## Contents`. The per-skill reference lists in `orbit-generated-surface.test.ts` and `config-profile.test.ts` gain the new files, and `reference-contents` passes.
- [ ] 5.3 For every delta scenario that `orbit status --change cut-propose-archive --scenarios` lists as uncovered, declare it, by a tag whose test asserts its THEN or by a ledger entry. Retire or re-point each ORPHAN tag the removal leaves. The map read at propose shows 158 scenarios, 37 uncovered and 8 orphans; record the counts read at apply. Show each new cut-ledger check (the `retired` kind among them) failing by a mutation, then revert it.
- [ ] 5.4 After the last template edit, re-pin the `skill-templates-parity.test.ts` hashes that moved (count them before writing the note) and delete bulk-archive's, with a dated note. Then run `npm run size:report`: propose and archive must each be at most 5,000 estimated tokens. A body still over after R2 is raised, per the inventory's re-entry, never cut further unnamed. Lower the ceilings per design D5, deleting bulk-archive's.
- [ ] 5.5 Run `npm run build`, the full `npm test` (count against 1.1's baseline), `npm run validate:skills` and `node bin/orbit.js validate cut-propose-archive --strict`; then `node bin/orbit.js update --force` so the local surface matches the source, and confirm that `.claude/skills/orbit-bulk-archive-change/` and `.claude/commands/orbit/bulk-archive.md` are gone.
