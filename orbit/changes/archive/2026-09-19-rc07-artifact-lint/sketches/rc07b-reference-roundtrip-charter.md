# Draft stage charter — rc07b-reference-roundtrip

Drafted in explore 2026-09-15, ratified in chat by Sal as the direction. NOT YET DECLARED:
writing a stage into `orbit/architecture/clean-up-review-cycle.md` is an ARCHITECT act, and
declaring it from an explore session would leave a stage in the program with no architect emit
behind it. Paste-ready in the doc's grammar.

---

### Stage rc07b-reference-roundtrip — a shipped reference is proven by running it

Depends-on: (none)
Complete: [ ]

SPLIT 2026-09-15 from rc07-artifact-lint, under R-crc-9 — and this time BEFORE a review pass found
it rather than after three. The two halves share a charter sentence and nothing else: different
inputs, different mechanism, different capabilities. rc07 verifies that prose agrees with a computed
fact; this stage verifies that a SHIPPED REFERENCE agrees with the SURFACE IT DOCUMENTS, proven by
execution rather than by comparing field sets.

Charter: every reference orbit ships describing a payload, a format or an invocation SHALL be
provable by running it against the surface it documents. The instrument is round-trip, not
comparison: build the documented shape, submit it to the real surface, and assert acceptance.

The empirical origin is exact, and it is why comparison is not enough. `orbit-audit-drift`'s shipped
`run-summary-schema.md` documents six per-command payload fields (`context`, `caller`, `depth`,
`flags`, `categories_skipped`, `findings_summary`). `orbit emit audit-drift` REJECTS every one of
them. The existing parity test (`test/core/emit-schema-parity.test.ts`, rc01's instrument) compares
FIELD SETS and therefore records the gap as a KNOWN_DIVERGENCE exemption — accurate, and it let a
ratified follow-up describe the engine as "accepting a third shape" when the truth is a hard refusal.
A project-wide audit-drift sweep on 2026-09-14 failed twice on this before its payload was rewritten
against `emit-composition.ts`: the standalone command's own documented Step 10 is unfollowable from
its own reference. A field-set comparison cannot see the difference between a type divergence and a
refusal; running it can.

R-crc-10 CHECK: every input is an artifact the engine owns — the reference text (generated), the
payload table (`COMMANDS[cmd].payloadFields`), and the surface's own accept/reject on a submitted
payload. Nothing here asks the engine to judge prose, which is why this half is buildable and the
sibling half needs an author-written marker.

Goal G2. Touches: orbit-audit-drift, orbit-emit-composition. Exit: (1) a reference whose documented
shape the surface refuses fails a test, by EXECUTION; (2) the `KNOWN_DIVERGENCE` exemption is
retired or re-stated as a refusal rather than a divergence; (3) the audit-drift reference and its
emit surface agree, so the command's own Step 10 is followable from its own shipped reference.

---

## Open, for the architect session

- **rc07's exit criterion (3)** currently carries the round-trip requirement ("every shipped payload
  reference round-trips through its own emit surface, proven by execution rather than by field-set
  comparison"). It moves here; rc07's criteria should be re-cut to the one-voice half alone.
- **rc07's `Touches:` line** names the validator, orbit-audit-drift and orbit-conventions. After the
  split, orbit-audit-drift belongs to this stage and rc07 keeps the validator and orbit-conventions.
- **Ordering**: neither depends on the other. This half is smaller and fully buildable today.
