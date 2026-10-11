> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc07b-reference-roundtrip

## Premise

Charter (`orbit/architecture/clean-up-review-cycle.md`, Stage rc07b): every reference orbit ships
that describes a payload, a format or an invocation SHALL be provable by RUNNING it against the
surface it documents — build the documented shape, submit it, assert acceptance. Exits: (1) a
reference whose documented shape the surface refuses fails a test, BY EXECUTION; (2) the
`KNOWN_DIVERGENCE` exemption is retired or re-stated as a refusal; (3) the audit-drift reference
and its emit surface agree, so its own Step 10 is followable from its own shipped reference.

Opening measurements (2026-10-04, read this session):

- The defect is LIVE. `test/core/emit-schema-parity.test.ts:40` still pins `KNOWN_DIVERGENCE`
  for audit-drift at six keys (`context`, `caller`, `depth`, `flags`, `categories_skipped`,
  `findings_summary`), and its comment still names rc07 as owner — rc07 archived 2026-09-19.
- It is not three voices but FOUR, plus practice:
  | voice | audit-drift extension fields |
  |---|---|
  | engine table (`emit-composition.ts` `COMMANDS['audit-drift'].payloadFields`) | `final_assessment`, `categories_run`, `findings_by_category`, `findings_total`, `findings`, `stale_suppressed` |
  | `orbit-run-summary-emit` `Audit-drift standalone recommendations` | `categories_run` (object of four named bools), `findings_by_category`, `findings_total` |
  | `orbit-conventions` `Internal-run JSON summary format` (req + scenario) | "audit-drift keeps its `findings_summary` and `finding_titles`" |
  | the shipped reference (`audit-drift.ts` `run-summary-schema.md`) | `context`, `caller`, `depth`, `flags`, `categories_run` (strings), `categories_skipped`, `findings_summary`, `findings`, `stale_suppressed` |
  | practice (last three project-wide emits) | the engine's names; `categories_run` as string ids |
- The engine's audit-drift acceptance is KEY MEMBERSHIP only (`validatePayload`): no type check
  on any audit-drift field. A round trip against this surface proves exactly what the field-set
  comparison proves about keys — the charter's "running it can" is true only for what the
  surface actually checks.
- The reference documents `next_recommended` with authoring instructions; the engine OWNS it
  and refuses a supplied one. The parity test hides this by stripping `ENGINE_OWNED` before
  comparing — a comparison artefact a round trip would not have.
- The engine composes `next_recommended` from `findings_total` (defaulting to 0). The reference
  never documents `findings_total`, so a reference-faithful payload the surface ACCEPTED would
  still compose the CLEAN recommendation over real findings — silent, and invisible to an
  acceptance-only round trip.

## Mechanism

### D-rc07b-1 — a payload reference is proven by submitting its example through the real write gate
Domain: every claim a payload schema reference makes that the emit surface can observe
| member | covered by |
|---|---|
| each AI-supplied key is accepted (unknown-key refusal) | round trip: the example is accepted and written |
| no engine-owned key is supplied (engine-owned refusal) | round trip, with NO `ENGINE_OWNED` strip — a documented `next_recommended` in the example is refused, as it would be in use |
| required narrative fields are present (`final_assessment`, nullable `model`) | round trip |
| per-field shape checks the gate already runs (review `reproduction`, `direction`, `verification`) | round trip, for the commands that have them |
| scope resolution (change-scoped versus project-wide, archived fallback) | round trip run in each scope the reference documents, in a disposable project |
| keys documented in the schema block but absent from the example | NOT this instrument — the rc01 field-set test, kept, with its exemption retired (D-rc07b-5) |
| field TYPES the gate does not check | NOT covered — the round trip is exactly as strong as the surface; see Residual |
Closure: BOUNDED — the claims a reference makes are prose plus shape; the surface observes only what its validators check
Residual kind: a documented field type or value the write gate does not validate (today every audit-drift field, and most fields of every other command)
Residual method: read each command's validators in `emit-composition.ts`; a documented constraint with no validator is outside the round trip and stays a reviewer's claim
Moves:
- READ: applied — `validatePayload` (key membership + engine-owned refusal) and the three review shape validators read this session; audit-drift has none beyond keys
- ENUMERATE: applied — this table; the engine-owned and scope rows are what the field-set comparison cannot see
- COHERE: applied — two instruments, disjoint claims: field-set test for schema-block keys, round trip for the example; neither strips the other's evidence
- EXECUTE: not applied — no prototype run yet; the opening measurement is a read of `validatePayload`, not a submission
- FALSIFY: applied — an acceptance-only round trip passes a reference-faithful audit-drift payload that composes the CLEAN recommendation over real findings (Premise); closed by construction by D-rc07b-3, not by asserting on composed output
- CONFORM: applied — R-crc-10 (every input engine-owned: the reference text, the table, the gate's verdict); R-crc-14 (the table defines, the reference mirrors)
- FEASIBILITY: applied — `composeAndWriteEmit` is exported; a temp project directory per case, as the harness tests already do
- CONSUME: applied — consumer is the test suite; a refused example fails naming the gate's own error text
- INVOKE: applied — runs in `npm test` on every change to a template or the payload tables

### D-rc07b-2 — each payload schema reference carries ONE verbatim example payload, real JSON
Domain: the ways a documented shape can be turned into a submittable payload
| member | covered by |
|---|---|
| a real-JSON example block, exactly the payload file the body tells the AI to write | ADOPTED — submitted verbatim, no transformation |
| instantiate the pseudo-JSON schema block (`"<ISO-8601>"`, `"a" \| "b"` unions) | OUT — a heuristic parser of a documentation dialect; see Considered & out |
| hand-written fixtures in the test file | OUT — a third voice, the exact failure this stage exists to remove |
Closure: SOURCED — the candidates are the three places a payload can come from: the reference's own text (two forms) or the test
Moves:
- READ: applied — all five payload schema blocks are pseudo-JSON today (`documentedKeys` was written to tolerate it)
- ENUMERATE: applied — this table
- COHERE: applied — the example is the PAYLOAD (narrative + extension fields only); the schema block stays DOCUMENTATION and may show engine-owned keys marked engine-computed, so the two blocks do not compete
- EXECUTE: not applied — no example written yet
- FALSIFY: applied — an example can be MINIMAL and omit a refused field the schema documents; covered by keeping the field-set test over the schema block (D-rc07b-1, row 6)
- CONFORM: applied — rc07's authoring lesson: removing the need beat patching the parser (the inline-code scanner deleted mid-cycle)
- FEASIBILITY: applied — one block per reference; the review reference needs two (change modes, architecture mode) and review-external's T0 one
- CONSUME: applied — the AI following the body copies the example's shape; the round trip makes the copied shape one the gate accepts
- INVOKE: applied — read by the D-rc07b-1 test on every run

### D-rc07b-3 — `findings_total` and `findings_by_category` are ENGINE-COMPUTED from `findings[]`
Domain: every audit-drift count the engine reads or writes
| member | covered by |
|---|---|
| `findings_total` | computed: `findings.length`; refused if supplied (engine-owned) |
| `findings_by_category` | computed: count of `findings[].category`, keyed as `orbit-emit-composition`'s `Audit-drift counts are engine-computed` states (corrected at proposal walk 1 — the keying first written here dropped a finding outside `categories_run`); refused if supplied |
| the `next_recommended` branch (findings versus clean) | reads the computed total; the `?? 0` default on an absent field disappears |
| `stale_suppressed` | NOT counted — suppressed findings are not findings; unchanged |
| archived audit-drift emits carrying supplied counts | unchanged; no src reader exists (grep, 2026-10-04) |
Closure: SOURCED — the grep over `src/` for both field names: the payload table and the one `next_recommended` read
Moves:
- READ: applied — `emit-composition.ts` composes `next_recommended` from `payload.findings_total ?? 0`; no other src reader
- ENUMERATE: applied — this table
- COHERE: applied — `orbit-emit-composition`'s own principle: a second voice on a computable fact is refused at the seam; supplying a count beside the list it counts is that second voice
- EXECUTE: applied — all 13 audit-drift emits on disk: `findings_total == len(findings)` every time; `findings_by_category` matches the per-category count wherever it is flat (10 of 13; 3 older emits nested by severity) — the computation agrees with every recorded intent
- FALSIFY: applied — the silent clean-recommendation-over-findings path exists only because the count is supplied separately; computing it removes the path rather than testing for it
- CONFORM: applied — R-crc-13 (the engine reports a fact; nothing judges); D5's engine-composed emit contract
- FEASIBILITY: applied — two lines in the audit-drift compose case
- CONSUME: applied — consumers: the engine's own recommendation branch; `/orbit:address-reviews` reads `findings[]`, not the counts
- INVOKE: applied — every `orbit emit audit-drift`

## Decisions

- **2026-10-04 — D-rc07b-1: a payload reference is proven by submitting its example through the real write gate** (settled under R-crc-3). The test submits each reference's example via `composeAndWriteEmit` in a disposable project, in every scope the reference documents, with NO engine-owned strip; acceptance is the assertion. The rc01 field-set test stays for the schema block. Rationale: test strength (b) from the opening thread was rejected once D-rc07b-3 removed the silent path it existed to catch — the cheaper instrument now suffices; (c) is in Considered & out.
  Kind: rule
- **2026-10-04 — D-rc07b-2: each payload schema reference carries ONE verbatim example payload, real JSON** (settled under R-crc-3). The example is the payload file the body tells the AI to write; the round trip submits it unchanged. Rationale: rc07's lesson — delete the need for a heuristic parser rather than write one.
  Kind: rule
- **2026-10-04 — D-rc07b-3: `findings_total` and `findings_by_category` become ENGINE-COMPUTED from `findings[]`** (settled under R-crc-3). Refused if supplied. Rationale: the engine's own rule against a second voice on a computable fact, and 13 of 13 recorded emits agree with the computation.
  Kind: rule
- **2026-10-04 — D-rc07b-4: the audit-drift payload reconciles to the engine and practice, owned by `orbit-run-summary-emit`** (settled under R-crc-3). The owner is `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` — `orbit-audit-drift`'s `Internal run summary persisted` already names it. `categories_run` is an array of category-id strings `"1"`..`"6"` (practice, the reference, and the six categories that exist since D5; the spec's four named bools predate categories 5 and 6). The reference drops `context`, `caller`, `depth`, `flags`, `categories_skipped`, `findings_summary` (skip reasons already go in the report body, per its own field note). `orbit-conventions`' "audit-drift keeps its `findings_summary` and `finding_titles`" and `orbit-audit-drift`'s change-scoped summary scenario becomes a POINTER to the owner (R-crc-14). The body's Step 10 field list — already engine-shaped, and wrongly claiming the reference lists those fields — becomes a pointer to the reference.
  Kind: scope
- **2026-10-04 — D-rc07b-5: the `KNOWN_DIVERGENCE` exemption violates its own owning requirement, so exit (2) resolves to RETIRE.** `orbit-emit-composition`'s `Payload tables agree with their schema references` says a documented field the table rejects "is a failing test" with no exemption clause; the pin was a ratified interim (option B, 2026-09-12) pointing at rc07, which archived without taking it. Re-stating it as a refusal would write a known contradiction into spec text. The same requirement's "recorded for the artifact-lint stage" pointer is stale for the same reason.
  Kind: fact

- **2026-10-04 — D-rc07b-6: the DOMAIN is the payload schema references only** (Sal, chat: "will take both"; was Q-rc07b-1). In: six payload schema blocks across five references — review `run-summary-schema.md` (change modes; architecture mode), review `external-handoff.md` (review-external T0), address-reviews, audit-drift, archive (`archive-summary-schema.md`). Out, as NAMED residuals written into the owning requirement's text: the two findings formats (`external-findings-format.md`, `internal-findings-format.md`) and the prompt template's output format — their surface is the external readers, Q-crc-15's territory — and `orbit …` invocations written inside references (no owner; rc05 covers git/`gh` only).
  Kind: scope
- **2026-10-04 — D-rc07b-7: FOUR capabilities, the ceiling breach DECLARED by one** (Sal, chat: "will take both"; was Q-rc07b-2). `orbit-emit-composition` (the parity requirement; the computed-count rule), `orbit-run-summary-emit` (the owner row), `orbit-conventions` (one pointer), `orbit-audit-drift` (one scenario pointer) — declared under R-crc-9 as rc13b's was. Two of the four deltas are R-crc-14 pointer substitutions, not mechanism. Split rejected: its first child would ship a parity test still carrying the exemption its own requirement forbids.
  Kind: scope

## Open questions

## Considered & out

- **Splitting rc07b (voices first, instrument second)** — 2026-10-04 (Sal, with D-rc07b-7). The first child would ship the forbidden exemption.
- **Test strength (c): engine TYPE checks on audit-drift fields** — 2026-10-04. After D-rc07b-3 the remaining fields are `categories_run`, `findings`, `stale_suppressed`; typing them is surface hardening beyond the charter, and the residual is named in D-rc07b-1's entry instead.
- **Test strength (b): assert on the composed record** — 2026-10-04. Existed to catch the silent clean-recommendation path; D-rc07b-3 removes the path, so asserting on it would test a branch that no longer exists.
- **Instantiating the pseudo-JSON schema block** — 2026-10-04. A heuristic parser over a documentation dialect; rc07 deleted exactly such a scanner after four reviewers each found a different defect in it.

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc07b-reference-roundtrip (charter, exits); R-crc-1, R-crc-10, R-crc-14
- `test/core/emit-schema-parity.test.ts` — rc01's field-set instrument and the `KNOWN_DIVERGENCE` pin
- `src/core/emit-composition.ts` — `COMMANDS` payload tables, `validatePayload`, `composeAndWriteEmit`, audit-drift `next_recommended` composition
- `src/core/templates/workflows/audit-drift.ts` — the shipped `run-summary-schema.md`
- `orbit/specs/orbit-run-summary-emit/spec.md` — `Audit-drift standalone recommendations`
- `orbit/specs/orbit-conventions/spec.md` — `Internal-run JSON summary format` (editorial kind bullet + scenario)
- `orbit/specs/orbit-emit-composition/spec.md` — `Payload tables agree with their schema references` (the instrument's owning requirement)
- `orbit/specs/orbit-audit-drift/spec.md` — `Internal run summary persisted` (its change-scoped summary scenario)
- `src/core/templates/workflows/audit-drift.ts` Step 10 — the body's payload field list
