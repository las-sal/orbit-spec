> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: d5-context-economy

## Premise

Stage D5 of the D-arc (`orbit/architecture/d-arc-arbitered-flow.md`, stage
`d5-context-economy` — read the charter there; this file does not duplicate it). Three braided
threads, one governing concern (what's in the window and who's reading it): skill size / native
execution (audit generated bodies, move rarely-needed detail to `references/`, move mechanical
work from AI prose into the engine — D4's report render is the pattern to inventory and
generalize), the model-per-phase strategy (`models:` hints in config, echoed by eligibility
readouts, never enforced by bodies), and handoff/boot formalization (generalize the C2
HANDOFF.md pattern to any seam; record model identity in emits; the three-layer leak hardening:
format slot → boundary residency sweep → attestation count).

## Decisions

- **D-d5-1 (2026-07-30) — Thread-1 goal statement: the body is the editorial voice and nothing
  else.** Four kinds of body content, four destinations: (1) MECHANICAL work → engine (the D4
  move); (2) rarely-needed detail → `references/` (the B2 move); (3) judgment/stance → stays,
  as the product; (4) duplication → deleted into one home. The governing rule generalizes D4:
  **if it's computable from disk, the engine computes it and prose never re-states it** — every
  D-arc failure class (hand-authored verdicts, stale iteration notes, findings_summary drift)
  was two voices asserting one computable fact. Engine-absorption candidates ranked by
  D4-shape: emit composition (spine deterministic; engine already validates what it could have
  written), address-reviews triage/walk bookkeeping, apply chunk detection, residual
  iteration/boundary arithmetic taught as prose.

- **D-d5-2 (2026-07-30) — Merge review-external into review as the reviewer-class axis.**
  `/orbit:review --as <mode> --reviewer external` replaces the separate
  `/orbit:review-external` command (surface 16 → 15). Rationale: every layer since C1 already
  unified the axis (cadence slots, `reviewer_class` emit field, D4's report header, the shared
  pass axis and strip ⟲N) — the CLI is the last place the split survives; `--fresh` is a flag
  while external is a whole command, an asymmetry with no remaining justification. Merge
  contract: (a) SURFACE merge only — the record vocabulary is untouched (T0 emits stay
  `review-external-<TS>.json` with `command: "review-external"`, findings stay
  `external-<as>-<TS>.md`; the gate reader, orientation WAITING, report ordinal, and
  address-reviews parser all key on those names); (b) the external branch moves to
  `references/external-handoff.md`, loaded ONLY when `--reviewer external` — the merge must
  not grow review's resident body (economy trap named at capture time); (c) `gates.ts`
  next-command vocabulary updates to the merged form (`:77`, `:397`); (d) ~1–1.5k of
  duplicated resolution/iteration/cycle-context prose deleted; (e) the `--reviewer` axis is
  the designated home for thread 2's model hints (config naming the preferred external
  target, echoed at the external slot's eligibility line). Acknowledged cost: one command
  that sometimes reviews and sometimes packages a handoff — the flag name carries it, and
  `--as architecture` already made review polymorphic.

- **D-d5-3 (2026-07-30) — The emit surface is generic `orbit emit <command>` (option A;
  resolves Q-d5-1).** The AI composes ONLY the narrative payload (non-deterministic
  final_assessment narrative, commentary, findings, resolutions) and pipes it via stdin JSON;
  the engine: stamps timestamp + collision-bumped filename token, fills the spine (`kind` from
  the command taxonomy; deterministic facts where D4 defined them — counts sentence, report
  pointer), then performs the ATOMIC write → recompute status → stamp `next_recommended` loop
  (the chicken-and-egg no prose discipline can fix: the emit's next_recommended is
  definitionally the engine's next_command AFTER the emit exists), validating through the SAME
  normalizers D4 built for the renderer — the fail-loud boundary moves from read time to write
  time, one validator with two gates. Per-command surfaces (B) rejected: payloads travel as
  stdin JSON either way, so per-command flags are ceremony ×10 surfaces. Scaffold-and-AI-writes
  (C) rejected: forfeits the atomic loop and leaves timestamp/collision discipline as prose.
  Three inventory items become sub-requirements rather than separate work: `orbit emit explore`
  needs engine counting of decisions/open-questions in explore.md (which IS the maturity grid),
  `orbit emit apply` needs the chunk-preamble grammar, review-external's T0 multi-step
  next_recommended is an engine-fillable path template. Optional `--render` prints the report
  in the same breath for review emits. Acknowledged: schemas become engine-versioned (fine —
  one repo ships both); schema reference docs shrink to payload-field lists, not zero; nothing
  physically stops hand-written emits (bodies instruct the surface; audit-drift MAY later
  tripwire files the composer didn't write).

- **D-d5-4 (2026-07-30) — Disciplines blocks shrink IN PLACE (resolves Q-d5-2).** The
  shared-reference move is FORECLOSED twice over: by prior ruling D-b2-2 (consolidation tried
  and reversed, issue #4 — per-command divergence is the desired trajectory, disciplines stay
  inline per body) and by always-needed economics (references/ saves tokens only for
  rarely-needed content; an always-needed reference is either unread — reliability loss — or
  read every run — same tokens plus a tool call). Three legs, all D-b2-2-compatible:
  (1) EPITOME skeleton — the four definitions compress to ~120–180 tok of stance-setting
  bullets; (2) DETAIL-TO-SITU — procedure prose that already exists in its step loses the
  block's copy; block-only procedure moves to the step where it fires (the tailoring survives,
  positioned where it bites — address-reviews' 6-step pushback procedure currently lives in
  BOTH the block and Step 3a); (3) STRUCTURAL LEANING — no-chaining shrinks to ~2 lines
  because post-D1/D4 the consent provenance rule, eligibility-framed readouts, and
  engine-computed next-lines ARE the enforcement. Yield ≈7.5k → ~2.5–3k surface-wide, nothing
  leaves the body. Deliberate non-move: NO shared TS constant for the skeleton in the
  generator — divergence capacity is the point of per-body literals (D-b2-2's trajectory);
  blocks shrink individually during the D5 body pass.

- **D-d5-5 (2026-07-30) — Mode-split review pass definitions into per-mode references
  (resolves Q-d5-3).** The ~2.25k of pass definitions (9 proposal + 7 system + 6 architecture)
  are judgment and survive verbatim — but only ONE mode's passes run per invocation, so they
  are rarely-needed-per-run: genuine kind-2 content. Each mode's pass set moves to its own
  reference (e.g. `references/passes-proposal.md`), loaded at Step 6 for the resolved mode
  only; ~⅔ of the definitions become lazy per invocation with zero content change. Composes
  with D-d5-2: the merged review body loads external-handoff, proposal, system, or
  architecture material per-invocation from references — the body itself becomes the thin
  shared trunk (resolution, disciplines epitome, persist-first, render protocol).

- **D-d5-6 (2026-07-30) — Boot is an engine RENDER, never a hand-maintained file (thread 3a).**
  `orbit boot <change>` (surface name provisional) composes the cold-start sequence as ordered
  POINTERS into existing artifacts — R-d-9(b)'s `boot_sequence` promoted from architect-only to
  a general engine surface: position/eligibility (already computed), the artifact set, latest
  emits per mode, the touchpoints map per D-d5-7. NO generalized HANDOFF.md: C2's worked
  because it was written once at a designed seam, not maintained; a living hand-curated boot
  file is the D3 staleness lesson (R-d-4 applied).

- **D-d5-7 (2026-07-30) — Touchpoints: predicted map authored in design.md, actual map
  computed from the diff; the ratio flips at apply (thread 3b, ratified as-is).** Touchpoints
  are TWO things wearing one name: the PREDICTED map (judgment — where the work WILL land) and
  the ACTUAL map (computation — where it DID land, which git holds exactly). (1) Predicted:
  a `## Touchpoints` section in design.md, authored at propose (consume mode pulls candidates
  from explore.md leanings), revised only through normal artifact-revision channels — INSIDE
  the proposal review cadence, which bounds its staleness like every other design claim —
  and FROZEN once apply starts (it reads as "the plan", not "the truth", thereafter;
  accepted at capture time). (2) Actual: engine-computed (`git diff <change-start>..HEAD`),
  never prose; `orbit emit apply` additionally stamps per-chunk file lists computed from the
  diff since the previous chunk emit (forensic bonus via D-d5-3, no AI listing). (3) The boot
  render chooses by lifecycle position — predicted pre-apply, actual (predicted alongside as
  reference) once commits exist. (4) Predicted-vs-actual DIVERGENCE is signal: a mechanical
  set-difference check for the system cohesion pass and audit-drift (scope drift today checked
  by vibes becomes a computed cross-validation — the D4 scorecard-rollup pattern: two
  representations of one fact, engine cross-validates). One voice throughout: predicted has
  ONE authored home, actual has ZERO, the merged view is composed fresh at render.

- **D-d5-8 (2026-07-30) — The three-layer leak hardening ratified as charter-designed, with
  layer 3 UPGRADED by the emit surface (thread 3c).** Layers per the 2026-07-09 design:
  (1) FORMAT — open-question entries carry a required `Standing recommendation: … | none yet`
  slot (orbit-conventions explore-format requirement; slot practice dates to the 2026-07-09
  charter design — this exploration itself closed with zero open questions);
  (2) PROTOCOL — the boundary residency sweep in explore/architect bodies, tied to the
  existing emit trigger (no emit without sweep); (3) ATTESTATION —
  `open_questions_with_recommendation: "n of m"` on explore emits, now ENGINE-COMPUTED:
  `orbit emit explore` parses explore.md for the maturity grid anyway (D-d5-3), so the count
  cannot be fudged — the designed honest-ceiling caveat shrinks to layer 2's conversational
  residue only.

- **D-d5-9 (2026-07-30) — Model provenance on the spine; model-per-phase stays config-owned
  hints (threads 3d + 2).** (1) A nullable `model` field joins the emit payload contract —
  the emit surface requires it (null when unknown); every pass in the trail records who
  authored it, making the C1/C2 diversity finding (external slots catch what same-model
  passes miss) measurable per-model. (2) `models:` map in `orbit/config.yaml` (phase →
  suggested model), echoed as a garnish on engine eligibility lines (e.g.
  ` — hint: <model>` at the external slot, composing with D-d5-2's `--reviewer` axis),
  NEVER enforced by bodies. The phase-mapping hypothesis itself (strong reasoner for
  explore/propose, furnace at apply, diversity at review) is recorded config content,
  user-owned — not spec.

## Open questions

(None open at close — all nine decisions ratified; the empty section is retained for the
five-section format the conventions delta hardens, and is the live zero-entry case for the
emit surface's counter.)

## Considered & out

- **Hand-maintained generalized HANDOFF.md / living touchpoints prose in design.md during
  apply** (2026-07-30) — see D-d5-6/D-d5-7: the R-d-4 staleness lesson; the computed half
  belongs to the diff, the merged view is composed at render, never maintained.

- **Shared disciplines reference / generator-side skeleton constant** (2026-07-30) — see
  D-d5-4: foreclosed by D-b2-2 (reversal precedent, issue #4) and by always-needed economics;
  the generator keeps fully divergent per-body literals.
- **Per-command emit surfaces (option B)** and **scaffold-and-AI-writes (option C)**
  (2026-07-30) — see D-d5-3: B is ceremony ×10 (payloads are stdin JSON regardless); C
  forfeits the atomic next_recommended loop and leaves clerical discipline as prose.

## References

- `orbit/architecture/d-arc-arbitered-flow.md` — stage `d5-context-economy` charter (the
  authoritative premise; run `orbit architecture show d-arc-arbitered-flow d5-context-economy`)
- `sketches/body-inventory.md` — the 2026-07-30 inventory pass: six heaviest bodies tagged by
  kind (engine/reference/judgment/duplication), per-section token tables, destination totals
  (≈27% engine / 20% references / 9% delete / 44% judgment), and the ranked engine work-list
