## Context

The decisions behind this design were settled in the exploration — see explore.md (D-rc07b-1 … D-rc07b-7). In brief: payload schema references are MIRRORS of the engine's payload tables (`orbit-emit-composition`), and rc01's instrument (`test/core/emit-schema-parity.test.ts`) checks them by comparing field sets. That comparison cannot tell a divergence from a refusal, hides engine-owned keys by stripping them before comparing, and pinned audit-drift's six refused fields as `KNOWN_DIVERGENCE`, an exemption the instrument's own requirement (`Payload tables agree with their schema references`) never admitted. audit-drift's payload is described four ways — the engine table, `orbit-run-summary-emit`, `orbit-conventions`, the shipped reference — and practice follows the engine's names. The engine composes audit-drift's `next_recommended` from a supplied `findings_total` that the reference never documents.

## Goals / Non-Goals

**Goals:**
- A shipped payload reference whose documented shape the write gate refuses fails a test, by execution (exit (1)).
- `KNOWN_DIVERGENCE` retired (exit (2)).
- audit-drift's Step 10 followable from its own reference: the reference's example is accepted by `orbit emit audit-drift` in both scopes (exit (3)).
- audit-drift's counts cannot disagree with its findings.

**Non-Goals:**
- Type validation for any emit field the write gate does not check today (the named limit; Considered & out).
- The findings formats and the prompt template's output format (Q-crc-15's territory) and `orbit …` invocations inside references (D-rc07b-6, named in the requirement).
- The git/`gh` invocations in the PR references (rc05).

## Decisions

**D1 — The example is identified by its fence info string: `json example <scope>…`** (refines D-rc07b-2). CommonMark's info string is the one place a fenced block can carry metadata without prose markers; its first word stays `json`, so rendering and highlighting are unchanged. The scope words are a closed set (`change`, `archived`, `project`, `doc`), decided by the table in `Payload schema references are proven by execution` — `archived` added at the first walk (fresh W1) because `resolveTarget` resolves `orbit emit archive --change` ONLY against an archived directory; a hidden per-command meaning of `change` would be the kind of silent special case this stage removes. Examples are per SCHEMA BLOCK, not per reference: the exploration's "one per reference" undercounted — the review skill's `run-summary-schema.md` documents two blocks (change modes; architecture mode), so six blocks across five references. A block's examples JOINTLY carry every AI-supplied key it documents (walk 1, fresh W7, settled under R-crc-3): one example is the norm, a second only where documented fields are mutually exclusive. This is how exit (1) is graded — a documented field is EXECUTED, never only compared. Narrowed at walk 2 (external GPT-6 Astra, settled under R-crc-3): `model` is excluded from the key equality and asserted separately (it sits in the field-set test's engine-owned list yet every payload must carry it); the review payload's `verification` is exempt BY NAME as the one GENRE-DEPENDENT key — a fresh trail computes REVIEW, where the gate refuses it — and is named in the residual rather than met by growing the seeding rule into a walk-and-pass fixture (R-crc-6: descope over new mechanism; rc03c's write-gate tests already execute it); and an example attaches to the NEAREST PRECEDING full-record block, since the review reference holds two in one file. Walk 3 (in-context VERIFICATION pass, settled under R-crc-3): the `command` test also matched two of address-reviews' worked examples — measured eight blocks, not six — so worked examples omit `command` by convention (option A). Defining a schema block by position under `## Schema` (option B) was refuted by measurement: review's architecture-mode block and the review-external block sit under other headings. A new info-string tag for schema blocks was declined as new mechanism (R-crc-6); the convention's failure mode is a loud test failure.

**D2 — The test reads examples through the engine's one fence grammar.** `createFenceTracker` (`src/core/markdown-fence.ts`) decides what is fenced; the test reads the info string from the line on which the tracker opens a fence. No local fence scanner (Q-crc-15's defect class). The command an example belongs to comes from the reference it sits in, through ONE `REFERENCES` table both suites import — extracted from `emit-schema-parity.test.ts` into a shared test helper (walk 1, fresh S5), so the plan does not grow a second table (`external-handoff.md` → `review-external`).

**D3 — Each submission runs in a fresh disposable project, seeded only with what the example cites.** A temp directory per (example, scope) pair: an active change directory with valid metadata for `change`, an archived change directory for `archived`, an architecture doc for `doc`, nothing for `project`. Fresh per pair, so trail-dependent computations (review iteration, pass genre — an empty trail computes `REVIEW`, so no `verification` is owed) start from the same state every run and one submission cannot make another pass. The ONE seeding rule (walk 1, fresh W2, settled under R-crc-3): for every token an example names in a `formed_against` array, write one minimal independent pass file at that token in the target's trail — the archive example's `readiness` judgement is the most complex payload any body composes, so it is the part most worth executing; dropping it to suit an empty trail would trade exactly the claim the stage exists to prove.

**D4 — `findings_by_category` keys are the UNION of `categories_run` and the categories findings carry, over REFUSED malformed inputs** (refines D-rc07b-3). The exploration's entry keyed only on `categories_run`, which would drop a finding whose category did not run and let the two counts disagree — the defect the rule exists to remove. The exploration's ENUMERATE move also missed the computation's own input domain (walk 1, fresh W4): the recorded trail already holds `categories_run` as an object of booleans (2026-09-14, the shape an earlier spec prescribed) and as numbers (2026-09-28). The write gate refuses those shapes and a finding without a non-empty string `category`, rather than coercing them (settled under R-crc-3: a tolerant rule would mint meaningless keys from an object's entries, silently) — and only over those refused inputs does `sum(findings_by_category) == findings_total` hold by construction.

**D5 — The audit-drift reference is rewritten to the owner's shape, and its stale RESTORED note goes.** The schema block shows `categories_run` (strings), `findings`, `stale_suppressed`, and the two computed counts marked engine-computed; the paragraph naming the "three-way divergence … owned by the artifact-lint stage rc07" is deleted, because the divergence is gone. Step 10's inline field list becomes a pointer to the reference (it currently claims the reference lists fields it does not).

**D6 — Ripple: the archive reference's `audit.findings_summary` note.** It says the field "mirrors the audit-drift run summary's counts", and audit-drift has no severity summary — it never had one in practice. The note is repointed to describe what the field is (severity counts of the pre-archive sweep's findings). Template prose only; no archive delta.

**D7 — Two hash pins move, as recorded acts.** `test/core/rc03b-untouched-modules.test.ts` pins `src/core/emit-composition.ts` (D-rc07b-3 edits it) and `test/core/templates/skill-templates-parity.test.ts` pins `getArchiveChangeSkillTemplate` (its reference gains an example and the D6 repoint). Each moves once, with a dated comment naming this change — sized here, not discovered at apply (rc04c's lesson: a hash pin names nothing a grep finds).

## Alternatives considered

- **Engine TYPE checks on audit-drift fields** (test strength (c)) — out: after D-rc07b-3 the remaining fields are `categories_run`, `findings`, `stale_suppressed`; typing them is surface hardening beyond the charter, and the residual is named in the requirement instead (see explore.md, Considered & out).
- **Asserting on the composed record** (test strength (b)) — out: it existed to catch the silent clean-recommendation path, which D-rc07b-3 removes.
- **Instantiating the pseudo-JSON schema block** — out: a heuristic parser over a documentation dialect; rc07 deleted exactly such a scanner after four reviewers each found a different defect in it.
- **Splitting the stage (voices first, instrument second)** — out (Sal, D-rc07b-7): the first child would ship the exemption its own requirement forbids.

## Risks / Trade-offs

- **D-rc07b-1 (BOUNDED)** → the round trip's reach is the write gate's validators; the named limit is stated in `orbit-emit-composition`'s `Payload schema references are proven by execution`.
- **[A refused count input on an adopter's skill]** a skill still composing `categories_run` as an object is refused at the gate → the refusal names the field; `orbit update` regenerates the skill.
- **[BREAKING for a supplied count]** an adopter's skill generated before this change composes `findings_total` / `findings_by_category`, which the gate now refuses → `orbit update` regenerates the skill; the refusal names the field. orbit is single-user here and the bodies are ours.
- **[Examples drift from the schema block]** a minimal example could omit a field the schema block documents and the table refuses → the field-set test still reads the schema block (its requirement is MODIFIED, not replaced).
- **[Out-of-scope observation]** the archive schema's `audit.summary_path` points at "the audit-drift-<TS>.json summary", while `orbit-audit-drift`'s `Internal run summary persisted` says the pre-archive sweep writes none. Not reconciled here (a fifth capability); recorded for the next stage that touches the archive emit.

## Migration Plan

No data migration. Archived audit-drift emits keep their supplied counts (no src reader exists); three older emits nesting `findings_by_category` by severity stay valid history. After apply, `npm run build && node bin/orbit.js update --force` refreshes the local surface.

## Touchpoints

- `src/core/emit-composition.ts` — audit-drift payload table loses the two counts; compose case computes them and reads the computed total.
- `src/core/templates/workflows/audit-drift.ts` — schema reference rewritten; example block; Step 10 pointer.
- `src/core/templates/workflows/review.ts` — two examples in `run-summary-schema.md`; one in `external-handoff.md`.
- `src/core/templates/workflows/address-reviews.ts` — three examples in `run-summary-schema.md`, one per provenance (auto-discovered `change archived`, whole-repo `project`, architecture `from-file` `doc` — system walk 1, Sal: A); the consumer-side shapes in `internal-findings-format.md`.
- `src/core/templates/workflows/archive-change.ts` — example in `archive-summary-schema.md`; the `audit.findings_summary` note (D6).
- `test/core/emit-schema-parity.test.ts` — `KNOWN_DIVERGENCE` and its two pinning tests removed.
- `test/core/reference-roundtrip.test.ts` — the new round-trip suite.
- `test/helpers/schema-references.ts` — the ONE `REFERENCES` table, extracted from the parity test (D2).
- `test/core/emit-composition.test.ts` — audit-drift cases stop supplying counts; computed-count cases added.
- `test/core/rc03b-untouched-modules.test.ts` + `test/core/templates/skill-templates-parity.test.ts` — the two pins (D7).

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc07b-1 | BOUNDED | live rule | `orbit-emit-composition` — `Payload schema references are proven by execution` (residual slots verbatim as its named limit); Risks entry above points |
| D-rc07b-2 | SOURCED | live rule | `orbit-emit-composition` — `Payload schema references are proven by execution`; shape: SENTENCE naming the source (the three places a payload can come from) |
| D-rc07b-3 | SOURCED | live rule | `orbit-emit-composition` — `Audit-drift counts are engine-computed`; shape: SENTENCE naming the source (the grep's two readers become the computation and its one consumer), members as the scenario set |
| D-rc07b-4 | — | `Kind: scope` | not carried |
| D-rc07b-5 | — | `Kind: fact` | not carried |
| D-rc07b-6 | — | `Kind: scope` | not carried |
| D-rc07b-7 | — | `Kind: scope` | not carried |
