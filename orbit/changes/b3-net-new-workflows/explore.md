> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: b3-net-new-workflows

## Premise

B3 is the final B-arc change (per D9 in `orbit/explore/fork-and-orbify/explore.md`): add orbit's 4
net-new editorial workflows — **review, review-external, address-reviews, audit-drift** — as
first-class workflows in the fork's generator pipeline. Completing B3 reaches the **parity
milestone**: the fork has full behavioral parity with the old openspec-orbit overlay, and the
companion repo `../openspec-orbit` retires as migration source-of-truth.

Migration source (sizes as of 2026-06-12):

| Source skill | SKILL.md | references/ |
|---|---|---|
| `openspec-review` | 465 lines | run-summary-schema.md |
| `openspec-review-external` | 213 lines | mode-sections.md, prompt-template.md |
| `openspec-address-reviews` | 441 lines | external-findings-format.md, internal-findings-format.md, run-summary-schema.md |
| `openspec-audit-drift` | 328 lines | run-summary-schema.md |

B2 delivered everything the generator needs (multi-file skills via `SkillTemplate.references`,
metadata pass-through, convergent reconciliation) — B3 is content + registration only, **zero
further generator changes expected**. Constraints already ratified: D13 (inline-TS literals),
D14 (thin launcher commands — skill `instructions` is the single behavioral source), D15 (full
surface always — `getProfileWorkflows` returns all workflows), D11 refinement (Claude primacy).
D5 reclassification: only `review` is a true gate, but gate *wiring* is C1 scope — B3 installs
the four as workflow content only.

What this exploration needs to figure out: relocation mechanics (rebranding opsx→orbit prose,
registration touchpoints, spec deltas), what "parity" verification looks like, and any content
divergences between the overlay source and the fork's current conventions.

## Decisions

- **D-b3-1 (2026-06-12) — No overlay-era citations in shipped content.** All historical orbit
  citations in the four bodies + spec deltas are brought in line with the new nomenclature:
  worked-example change names like `bootstrap-openspec-orbit` → neutral example names; the
  `github.com/las-sal/openspec-orbit` URL → generic `<repo URL>`; `bootstrap-orbit-status-cli`
  / "orbit-status's tier-1 best-effort parse" → the fork's established "a downstream status
  reader" genericization. **Why**: (a) generated bodies ship into end-user repos via
  `orbit init` — overlay-era repo references are dangling referents there, not just confusing;
  (b) future readers are served by the OpenSpec-upstream lineage (Tier-C scrub owns that
  prose), not by overlay-era archaeology. **Refinement**: keep empirical *force* while
  dropping referents — review's State-1 rationale becomes "in an early dogfooding cycle,
  in-context system review missed 3 of 3 real implementation bugs — all caught by external
  review" (specific number retained, repo name dropped). **Scope ripple**: the stock
  phrasings are spec'd, so the relocated spec deltas get the identical scrub, not just the
  skill bodies. Citing orbit's own capability names (`orbit-conventions`,
  `orbit-run-summary-emit`) in bodies stays — B1 precedent; they're the tool's vocabulary.

- **D-b3-2 (2026-06-12) — B3 ships prose-native citizens; all engine awareness waits for C1.**
  Ratified the layer boundary: B3 integrates the four workflows at the prose/pipeline layer
  only (same module shape, same generator, registries, baseline specs, canonical flow closed).
  NO engine awareness in B3 — not even small pulls like `orbit status` listing review runs.
  The artifact-graph/gate/staleness work (review as a graph node, Q2–Q5) is C1's, whole and
  intact. **Why**: keeps B3 a relocation claim (mechanically verifiable parity with the
  overlay, which was also prose-level) rather than a design claim; the framework holes the
  overlay arc revealed are already catalogued as C-arc questions in the fork plan.
  **Corollary**: B3's four spec deltas describe today's prose-level behavior as the overlay
  wrote them — no pre-written gate/staleness language; C1 MODIFIES these specs when review
  becomes a gate (generalizing the baseline emit spec's no-forward-look discipline).

- **D-b3-3 (2026-06-12) — Spec-ownership rule for the four ADDED capability specs.** The four
  specs relocate as-is structurally: they keep their thin emit-persistence requirements
  (review, address-reviews, audit-drift each have one; review-external deliberately has none)
  and do NOT absorb the recommendation/timing/spine logic owned by the baseline
  `orbit-run-summary-emit` spec — preserving the overlay's complementary split across the
  move. Proposal-time checklist: every cross-spec citation verifies in BOTH directions
  against the fork baseline's actual requirement-name text (the four → emit spec/conventions:
  names may have shifted in B1 remediation, e.g. the sync-specs scope rewording; emit spec →
  the four: its dangling citations like `Address-reviews command available` pin the
  requirement names B3 must land verbatim). **Rider**: B3 also restores the baseline emit
  spec's `Purpose:` section (currently the archive-flow `TBD` stub) from the overlay's real
  Purpose paragraph, rebranded.

- **D-b3-4 (2026-06-12) — Parity proof.** Parity (the milestone after which openspec-orbit
  retires) is demonstrated by: per-workflow required-marker rows ×4 in
  `orbit-content-fidelity.test.ts`'s RELOCATED table; thin-launcher assertions ×4; surface
  count assertions 11→15 (profiles, skill-generation, tool-detection, e2e generated-surface);
  plus a ONE-TIME manual diff of generated output vs overlay source modulo deliberate renames
  during the change's review — recorded in the review, not kept as a permanent test.

- **D-b3-5 (2026-06-12) — Frontmatter `author:` matches B1.** New modules use
  `author: 'openspec'` (B1 precedent); the `orbit` author rename is Tier-C scrub scope, not
  B3's. The overlay's `capability:` metadata keys ARE kept (first real consumer of B2's
  metadata pass-through) — worth a test assertion.

## Open questions

- **Q-b3-1 — Registration surface** ✅ RESOLVED by investigation (2026-06-12). The full 11→15
  touchpoint map:
  1. `src/core/templates/workflows/<wf>.ts` ×4 new modules, each exporting
     `get<X>SkillTemplate()` + `getOrbit<X>CommandTemplate()` (B1 module shape)
  2. `src/core/templates/skill-templates.ts` — facade re-exports
  3. `src/core/shared/skill-generation.ts` — `getSkillTemplates()` (line 60) and
     `getCommandTemplates()` (line 86) arrays; dirName + workflowId mapping lives here
  4. `src/core/profiles.ts:19` — `ALL_WORKFLOWS`
  5. `src/core/shared/tool-detection.ts:14` — `SKILL_NAMES` (drives `fullyConfigured`
     detection)
  6. Tests asserting 11: `test/core/profiles.test.ts:24`,
     `test/core/shared/skill-generation.test.ts:13,93,147`,
     `test/core/shared/tool-detection.test.ts:31`; plus
     `test/core/templates/orbit-content-fidelity.test.ts` (RELOCATED marker table grows ×4)
     and `orbit-generated-surface.test.ts` (e2e surface)
  Mystery solved: `feedback.ts` is the 12th module but is NOT installed surface — it's
  consumed at runtime by `orbit feedback` (`src/commands/feedback.ts`) and completions.
  Precedent: facade exports ≠ installed surface.
- **Q-b3-2 — Source rebranding scope** ✅ RESOLVED. B1 precedent is total *within bodies* —
  explore.ts has 29 orbit-namespace refs, 0 openspec refs. So: `/opsx:*`→`/orbit:*`,
  `openspec` CLI→`orbit`, `openspec/{changes,specs,lenses}/`→`orbit/...`, skill names
  `openspec-*`→`orbit-*`. Sub-decisions: (a) historical citations and (b) orbit-status
  genericization → D-b3-1; (c) frontmatter author → D-b3-5.
- **Q-b3-3 — run-summary-schema.md ×3** ✅ RESOLVED by investigation (2026-06-12): the three
  files are NOT copies — they're genuinely distinct per-command schema docs (review's 85L,
  address-reviews' 194L, audit-drift's 81L; different paths, different extension fields).
  No dedupe question exists. Relocate all three as-is (modulo rebrand).
- **Q-b3-4 — Spec deltas** ✅ RESOLVED by D-b3-3: four ADDED capabilities, as-is structurally,
  with bidirectional citation verification against the fork baseline; emit-spec ownership
  preserved; Purpose-stub restoration rides along.
- **Q-b3-5 — Parity verification** ✅ RESOLVED by D-b3-4: fidelity markers ×4, launcher
  assertions ×4, counts 11→15, one-time manual diff during review.
- **Q-b3-6 — verify vs review coexistence** ✅ RESOLVED by investigation (2026-06-12): the
  baseline already designed the composition — verify's emit recommends `/orbit:review --as
  system` (orbit-run-summary-emit spec.md:307–316), onboard's canonical flow places review
  around verify, and review system-mode wraps verify as Pass 0. Coexistence is settled;
  nothing to decide.

**Key structural finding (2026-06-12)**: the B1-relocated surface already FORWARD-REFERENCES
all four B3 workflows — `archive-change.ts:226` has "NEW Step 3.5 — Pre-archive audit-drift
sweep" invoking `/orbit:audit-drift` (+ `audit.*` emit fields), ff/continue/propose/verify
emits recommend `/orbit:review`, archive offers `/orbit:address-reviews`, and onboard
documents the full canonical workflow including all four. B3 is filling holes the baseline
already points into — pure addition, no modification of existing bodies expected.

## Considered & out

## References

- `orbit/explore/fork-and-orbify/explore.md` — D5 (reclassification), D9 (phasing), D13/D14/D15
  (body/launcher/surface constraints), Q4/Q5 (gate questions deferred to C1)
- `../openspec-orbit/.claude/skills/openspec-{review,review-external,address-reviews,audit-drift}/`
  — migration source bodies + references
- `../openspec-orbit/openspec/specs/orbit-{review,review-external,address-reviews,audit-drift}/`
  — migration source specs
- `orbit/changes/archive/2026-06-11-b2-grow-generator/` — generator capability B3 consumes;
  D-b2-2 (per-command divergence ratified)
- `src/core/templates/workflows/` — the 12 existing workflow modules (11 installed + feedback);
  B3 adds 4 siblings
- `src/core/profiles.ts` — `ALL_WORKFLOWS` registration point
- `src/core/shared/skill-generation.ts` — central template registry (`getSkillTemplates` /
  `getCommandTemplates`); also `generateSkillContent` metadata pass-through (B3 is its first
  real consumer via `capability:` metadata keys)
- `src/core/shared/tool-detection.ts` — `SKILL_NAMES` (fullyConfigured detection)
- `test/core/templates/orbit-content-fidelity.test.ts` — B1's marker-fidelity pattern to
  extend ×4
- `src/core/templates/workflows/archive-change.ts:226` — the live pre-archive audit-drift
  composition point B3's audit-drift body must satisfy
- `orbit/specs/orbit-run-summary-emit/spec.md` — already specifies review-external T0 +
  standalone audit-drift emits (B1-relocated); B3 spec deltas must not re-add
- `../openspec-orbit/.claude/commands/opsx/{review,review-external,address-reviews,audit-drift}.md`
  — overlay command bodies (106/55/84/64 lines); per D14 these are NOT relocated as-is —
  B3 writes fresh ~3-line launchers instead
