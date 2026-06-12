## Context

The fork's B1/B2 changes relocated orbit's modifications to the 11 upstream workflows and grew the
generator (multi-file `references/`, metadata pass-through, convergent reconciliation). The four
net-new editorial workflows still live only in the overlay repo `../openspec-orbit` as hand-kept
`SKILL.md` + `opsx/*.md` pairs. Meanwhile the B1-relocated surface already forward-references all
four: `archive-change.ts` Step 3.5 invokes `/orbit:audit-drift`; ff/continue/propose/verify emits
recommend `/orbit:review`; onboard documents the canonical flow; the baseline
`orbit-run-summary-emit` spec contains the review-external T0 and standalone audit-drift emit
requirements and cites the four specs' requirement names. B3 fills the holes the baseline already
points into. Full exploration record: see `explore.md` (5 decisions D-b3-1..D-b3-5, all open
questions resolved).

Migration source inventory (verified 2026-06-12):

| Overlay skill | SKILL.md | references/ |
|---|---|---|
| `openspec-review` | 465 lines | run-summary-schema.md (85) |
| `openspec-review-external` | 213 lines | mode-sections.md (46), prompt-template.md (120) |
| `openspec-address-reviews` | 441 lines | external-findings-format.md (112), internal-findings-format.md (186), run-summary-schema.md (194) |
| `openspec-audit-drift` | 328 lines | run-summary-schema.md (81) |

The three `run-summary-schema.md` files are distinct per-command schema docs sharing a filename,
not copies — no dedupe applies (see explore.md Q-b3-3).

## Goals / Non-Goals

**Goals:**
- The four workflows become first-class generated citizens: same module shape, same pipeline,
  registered everywhere the existing 11 are.
- Parity with the overlay, mechanically demonstrated (D-b3-4), so `openspec-orbit` retires.
- Four ADDED baseline capabilities whose cross-spec citations resolve bidirectionally (D-b3-3).

**Non-Goals (deferred, with owners):**
- Engine/DAG awareness — gates, staleness, `orbit status` knowledge of review runs → **C1** (D-b3-2).
- Generator changes — B2 delivered everything needed; zero generator edits expected.
- The archive parallel-merge fix → **C2**; `OpenSpec` prose branding / `.openspec.yaml` /
  data-format tags → **Tier-C scrub**; `author:` metadata rename to `orbit` → Tier-C (D-b3-5).
- markdown-as-source (D6) — bodies stay inline-TS template literals per D13.

## Decisions

(Ratified in `explore.md`; restated here with implementation consequence. Wording preserved.)

### D-b3-1 — No overlay-era citations in shipped content

Generated bodies ship into end-user repos via `orbit init`; overlay-era repo references are
dangling referents there, not just confusing. Concretely:
- Worked-example change names (`bootstrap-openspec-orbit`) → neutral example names.
- `github.com/las-sal/openspec-orbit` URL → generic `<repo URL>` placeholder.
- `orbit-status` / "orbit-status's tier-1 best-effort parse" → "a downstream status reader"
  (fork precedent, 8 modules).
- Review's State-1 empirical rationale keeps force, drops referents: "in an early dogfooding
  cycle, in-context system review missed 3 of 3 real implementation bugs — all caught by external
  review" (replaces the `bootstrap-orbit-status-cli` citation).
- Overlay issue references (`openspec-orbit#N`, "see issue #N") → scrubbed or restated inline.
- The stock phrasings are spec'd, so the four spec deltas get the identical scrub.
- Citing orbit's own capability names (`orbit-conventions`, `orbit-run-summary-emit`) stays —
  B1 precedent; they're the tool's vocabulary.

### D-b3-2 — Prose-native only; engine awareness waits for C1

B3 stays a relocation claim (mechanically verifiable) rather than a design claim. Corollary: the
four spec deltas describe today's prose-level behavior as the overlay wrote them — no pre-written
gate/staleness language. C1 MODIFIES these specs when review becomes a graph gate.

### D-b3-3 — Spec-ownership rule + bidirectional citation verification

The four specs keep their thin emit-persistence requirements (review-external deliberately has
none) and do NOT absorb the recommendation/timing/spine logic owned by baseline
`orbit-run-summary-emit`. Verification is bidirectional against the fork baseline's actual text:
- The four → baseline: requirement-name citations into `orbit-conventions` /
  `orbit-run-summary-emit` may have shifted during B1 remediation (known example: the sync-specs
  scope rewording) — verify each against `orbit/specs/`.
- Baseline → the four: the emit spec's dangling citations (e.g. `Address-reviews command
  available`) pin requirement names B3 must land verbatim.
**Rider**: restore the baseline emit spec's `Purpose:` (currently the archive `TBD` stub) from the
overlay's real Purpose paragraph, rebranded. Prose metadata, not a requirement change — applied as
a direct edit task, not a spec delta.

### D-b3-4 — Parity proof

- `orbit-content-fidelity.test.ts` RELOCATED table +4 rows with per-workflow required markers
  (e.g. review: convergence states; address-reviews: ripple cascade; audit-drift: four categories;
  review-external: T0 emit).
- Thin-launcher assertions ×4 (launcher invokes skill, carries no workflow body).
- Surface counts 11→15 across profiles / skill-generation / tool-detection / e2e generated-surface.
- ONE-TIME manual diff of generated output vs overlay source modulo deliberate renames, the
  D-b3-1 scrub, and the review-driven corrections recorded in the change audit trail
  (`.orbit-runs/`) — recorded in the change's review, not a permanent test.

### Amendments from iter-1 proposal review

The relocated deltas deviate from the overlay specs beyond renames+scrub in spots the iter-1
proposal review corrected (audit trail: `.orbit-runs/review-proposal-2026-06-12T16-13-54Z.json`
+ `address-reviews-2026-06-12T16-42-57Z.json`): audit-drift persistence aligned to the baseline
emit model (standalone-only emits, change-scoped form added), a thin `--fresh` requirement added
to orbit-review (semantics from the canonical body), Path B's staleness guard made consistent
with precedence rule (1), `--strict`/`--thorough` scenarios + parity-means-spelling
clarification, and assorted citation/genericization fixes. The audit-drift skill body's Step-10
persistence prose gets the matching alignment at apply time (task 1.4).

### D-b3-5 — Frontmatter

`author: 'openspec'` (B1 precedent). The overlay's `capability:` metadata keys are KEPT — first
real consumer of B2's metadata pass-through; assert in tests.

### Naming (follows existing conventions; no new decisions)

| Workflow ID | Module | Skill dirName | Command |
|---|---|---|---|
| `review` | `workflows/review.ts` | `orbit-review` | `/orbit:review` |
| `review-external` | `workflows/review-external.ts` | `orbit-review-external` | `/orbit:review-external` |
| `address-reviews` | `workflows/address-reviews.ts` | `orbit-address-reviews` | `/orbit:address-reviews` |
| `audit-drift` | `workflows/audit-drift.ts` | `orbit-audit-drift` | `/orbit:audit-drift` |

(Bare skill dirNames like `orbit-propose`/`orbit-onboard`, not the `-change` suffix pattern of
upstream-derived workflows. Hyphenated workflow IDs follow `bulk-archive` precedent.)

### Rebranding map (mechanical, applied to bodies + references + specs)

| Overlay | Fork |
|---|---|
| `/opsx:<verb>` | `/orbit:<verb>` |
| `openspec <subcommand>` (CLI) | `orbit <subcommand>` |
| `openspec/changes\|specs\|lenses\|explore\|project.md\|.orbit-runs` | `orbit/...` |
| `openspec-review` etc. (skill names) | `orbit-review` etc. |
| `openspec-verify-change` (upstream skill cite) | `orbit-verify-change` |
| `.claude/skills/openspec-*/references/...` paths | the skill's `references/` (path-neutral phrasing) |
| `Requires openspec CLI.` (compatibility) | `Requires orbit CLI.` |

Out of scope for this map (Tier-C): "OpenSpec" prose branding, `openspec-change` data tags,
`.openspec.yaml`. Mechanical renames are swept for residue afterward per the change-completeness
discipline (the overlay's own history includes a sed-residue bug; see explore.md References).

## Risks / Trade-offs

- [Sed-style residue during the ~1,450-line rebrand] → mechanical map applied file-at-a-time, then
  a residue grep for `opsx|openspec` over the four modules + spec deltas; the fidelity tests assert
  orbit-named markers; final `npm test` green gate.
- [Citation rot between the four specs and the B1-remediated baseline] → D-b3-3's bidirectional
  checklist is an explicit task, executed with the baseline files open (read-before-reference),
  not from overlay memory.
- [Launcher rewrite is authoring, not relocation — could drift from skill bodies] → launchers are
  ~3 lines by design (D14); the launcher assertion checks they reference the skill and carry no
  workflow body.
- [Worked examples inside bodies may still embed overlay-era counts/paths after rename] → the
  D-b3-1 scrub list is enumerated per file in tasks.md; Pass-8-style grep for residue terms
  (`bootstrap-`, `las-sal`, `orbit-status`, `openspec-orbit#`) before completion.
- [This repo's own installed surface lags after merge] → refresh step in tasks.md
  (`npm run build && node bin/orbit.js update --force`), per CLAUDE.md guidance.

## Migration Plan

Single PR-shaped change on `main` (matching B1/B2): modules + registration + tests land together;
`npm test` green before and after. No data migration; generated surfaces converge on next
`orbit update` (reference-drift smart detection from B2 handles the new `references/` dirs).
Rollback = revert the commit; the baseline 11-workflow surface is untouched by any edit except
additive registration lines.

## Open Questions

(none — all resolved in explore.md; deferred items are catalogued under Non-Goals with owners.)
