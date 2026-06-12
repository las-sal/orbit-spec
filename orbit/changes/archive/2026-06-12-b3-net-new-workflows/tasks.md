# Tasks — b3-net-new-workflows

Source bodies: `../openspec-orbit/.claude/skills/openspec-{review,review-external,address-reviews,audit-drift}/`.
Every relocation task applies the design.md rebranding map + the D-b3-1 citation scrub, then sweeps
for residue (`grep -rn "opsx\|openspec\|bootstrap-\|las-sal\|orbit-status\|issue #"` over the new
module, with Tier-C "OpenSpec" prose exempted).

## 1. Workflow modules (skill bodies + references + thin launchers)

- [x] 1.1 Create `src/core/templates/workflows/review.ts` — `getReviewSkillTemplate()` (relocate
      465-line body; 1 reference: `run-summary-schema.md`; metadata `author: 'openspec'`,
      `version: '0.1'`, `capability: 'orbit-review'`) + `getOrbitReviewCommandTemplate()`
      (~3-line launcher per D14). Scrub list: State-1 empirical phrasing (×2 occurrences:
      Step 9 phrasing table + worked example), `--mark` v2 note issue cite, worked-example
      change names, `/opsx:verify` → the `orbit-verify-change` skill cite.
- [x] 1.2 Create `src/core/templates/workflows/review-external.ts` —
      `getReviewExternalSkillTemplate()` (213-line body; 2 references: `mode-sections.md`,
      `prompt-template.md`; `capability: 'orbit-review-external'`) +
      `getOrbitReviewExternalCommandTemplate()`. Scrub list: repo URL in worked example →
      `<repo URL>`, "orbit-status's tier-1 best-effort parse" → "a downstream status reader",
      worked-example change names, `openspec-orbit#8` capability cite → plain
      `orbit-run-summary-emit` cite.
- [x] 1.3 Create `src/core/templates/workflows/address-reviews.ts` —
      `getAddressReviewsSkillTemplate()` (441-line body; 3 references:
      `external-findings-format.md`, `internal-findings-format.md`, `run-summary-schema.md`;
      `capability: 'orbit-address-reviews'`) + `getOrbitAddressReviewsCommandTemplate()`.
      Scrub list: worked-example change names + reviewer lines, archived-change example paths.
- [x] 1.4 Create `src/core/templates/workflows/audit-drift.ts` — `getAuditDriftSkillTemplate()`
      (328-line body; 1 reference: `run-summary-schema.md`; `capability: 'orbit-audit-drift'`) +
      `getOrbitAuditDriftCommandTemplate()`. Scrub list: `openspec-orbit#8`/`#10`/`#4` issue
      cites → restate inline or drop, `orbit-orbit#8` typo'd cites likewise. ALIGN the body's
      persistence prose (its Step 10 + run-summary sections say library/pre-archive contexts
      write change-scoped `audit-drift-<TS>.json`) with the corrected spec delta: standalone
      contexts only emit; library findings fold into the review emit; pre-archive findings are
      captured in `archive-<TS>.json` `audit.*` fields (per the review-proposal iter-1 fix to
      the `Internal run summary persisted` requirement). The bundled
      `references/run-summary-schema.md` needs the same alignment (its path table lists
      library/pre-archive emit paths).
- [x] 1.5 Relocate the 7 reference files into each module's `references` array (content as TS
      template literals, same rebrand + scrub; the three `run-summary-schema.md` are distinct
      per-command docs — relocate independently, no dedupe per explore.md Q-b3-3).
- [x] 1.6 Residue sweep over all four modules AND the four spec deltas (grep list above) +
      read-through of each worked example for overlay-era counts/paths the greps can't catch
      (the review-proposal iter-1 pass caught one such miss in a delta: a rebranded
      overlay-archive citation containing no grep-listed term).

## 2. Registration (11 → 15)

- [x] 2.1 Re-export the 8 new getters in `src/core/templates/skill-templates.ts`.
- [x] 2.2 Add 4 entries to `getSkillTemplates()` in `src/core/shared/skill-generation.ts`
      (dirNames `orbit-review`, `orbit-review-external`, `orbit-address-reviews`,
      `orbit-audit-drift`; workflowIds `review`, `review-external`, `address-reviews`,
      `audit-drift`) and 4 entries to `getCommandTemplates()`.
- [x] 2.3 Add the 4 workflow IDs to `ALL_WORKFLOWS` in `src/core/profiles.ts`.
- [x] 2.4 Add the 4 skill names to `SKILL_NAMES` in `src/core/shared/tool-detection.ts`.

## 3. Tests (parity proof per D-b3-4)

- [x] 3.1 Update count assertions 11→15: `test/core/profiles.test.ts`,
      `test/core/shared/skill-generation.test.ts` (×3), `test/core/shared/tool-detection.test.ts`,
      and `test/core/templates/orbit-generated-surface.test.ts` (e2e surface contents).
- [x] 3.2 Add 4 rows to the RELOCATED table in
      `test/core/templates/orbit-content-fidelity.test.ts` with per-workflow required markers
      (review: 'execution disciplines', 'convergence states', 'Run summary'; review-external:
      'execution disciplines', 'Run-summary emit', 'T0'; address-reviews: 'execution
      disciplines', 'ripple cascade', 'resolution log'; audit-drift: 'execution disciplines',
      'Vocabulary residue', 'run summary') — adjust to actual body text at authoring time.
- [x] 3.3 Add thin-launcher assertions ×4 (launcher references the skill; carries no workflow
      body — match the existing launcher-assertion pattern).
- [x] 3.4 Add a metadata pass-through assertion: generated SKILL.md frontmatter for each new
      skill includes its `capability:` key (first real consumer of B2's pass-through).
- [x] 3.5 Add reference-emission assertions: each new skill's declared `references/*.md` files
      are written by init/update (extend existing generated-surface checks if not automatic).
- [x] 3.6 `npm test` fully green (baseline 1504 + new).

## 4. Baseline spec rider (D-b3-3)

- [x] 4.1 Replace the `TBD` Purpose stub in `orbit/specs/orbit-run-summary-emit/spec.md` with
      the rebranded overlay Purpose paragraph — text staged in this change's `purposes.md`.

## 5. Parity verification + surface refresh

- [x] 5.1 One-time manual diff: generated `SKILL.md` + `references/` for the four new skills vs
      overlay source, modulo the design.md rebranding map + D-b3-1 scrub + the review-driven
      corrections recorded in the change audit trail (notably task 1.4's audit-drift Step-10
      alignment; see design.md "Amendments from iter-1 proposal review"). Record the diff
      summary in the change's review (`/orbit:review --as system`), not as a permanent test.
- [x] 5.2 Refresh this repo's own surface: `npm run build && node bin/orbit.js update --force`;
      spot-check `/orbit:review` launcher + `orbit-review` skill exist locally.
- [x] 5.3 Run `node bin/orbit.js validate b3-net-new-workflows --strict` and confirm
      `orbit list` shows the change healthy.
- [x] 5.4 Refresh CLAUDE.md for post-B3 reality (B1/B2 precedent: update as part of landing):
      "11 skills + 11 thin launcher commands" → 15+15; D15's "always returns all 11 workflows"
      → 15; "1369 tests (1504 as of B2)" → updated count; "Next: B3" → parity reached, next C1;
      "7th baseline capability" framing → 11 baseline capabilities.

## 6. At archive time (not apply time)

- [x] 6.1 After `/orbit:archive` creates the four new baseline specs, replace their stubbed
      `TBD` Purpose sections with the paragraphs staged in `purposes.md` (prevents repeating
      the orbit-run-summary-emit TBD gap this change fixes in 4.1).
