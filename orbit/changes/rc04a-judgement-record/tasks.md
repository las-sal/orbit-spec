# Tasks: rc04a-judgement-record

## 1. The record shape

- [ ] 1.1 Define the judgement-record type in `src/core/artifact-graph/` (or alongside the emit types — put it where the emit surface already reads types from, not in a new module): `kind` (`continuation` | `readiness`), `formed_against: string[]`, `disposition`, `reasoning`, `ratified_by` (`ai` | `user`), plus the kind-specific extras — `gate`/`gate_state`/`gate_reason` on `continuation/proceed`, `accepted: {claim, why}[]` on `readiness`. Model `disposition` as a DISCRIMINATED union on `kind` rather than one flat enum: a `readiness` record with `disposition: "spend"` must be a type error, not a runtime check.
- [ ] 1.2 Add the record to the payload tables for exactly FOUR commands — `apply`, `review-external`, `archive`, and `address-reviews` (the routing case where a cadence ends without an archive). Any other command supplying one is REFUSED naming the command. Verify by construction: a judgement record on an `explore` payload must fail.

## 2. The ordering refusal (the one computed rule)

- [ ] 2.1 In `src/core/emit-composition.ts`'s write gate, add the ORDERING check, scoped BY PRESENCE of `formed_against` so no existing emit can newly fail. Every cited token must be STRICTLY earlier than the candidate record's own timestamp token; equal is REFUSED. Compare tokens the way the trail reader already does — do not write a second comparison, and if the existing one is not reusable say so rather than duplicating it (the two-fence-grammars lesson, Q-crc-15).
- [ ] 2.2 A cited token matching no readable pass on the change's trail is REFUSED as unresolvable. This is the Q-crc-17 failure mode in a new field — a citation that resolves to nothing certifies nothing — so it must fail loudly rather than skip.
- [ ] 2.3 An EMPTY `formed_against` is refused, and so is a missing `ratified_by`. Both are refusals of the record's defining properties, not validation pedantry: the first would admit a judgement formed against nothing, the second would let the engine guess whether a human ratified a decision.
- [ ] 2.4 Every refusal names the offending value — the token, the command, the field — on stderr, writes NO file, and exits non-zero with empty stdout, matching the write gate's existing contract exactly.

## 3. The archive seam

- [ ] 3.1 `src/core/templates/workflows/archive-change.ts`: the archive payload table gains `readiness`; the schema reference gains its shape. State plainly in the body that RESIDUAL RISK now belongs in `accepted` and that `warnings` keeps only process notes that arose at the seam — with the qualifying test named, so the next author can tell them apart rather than guessing.
- [ ] 3.2 The completion readout STATES a `not-ready` disposition in one line and names the record. A `ready` disposition renders NOTHING. This is the record's reader and the reason this change does not repeat `gate_overridden`'s write-only defect.
- [ ] 3.3 `apply-change.ts` gains `continuation` in its payload table; the `review-external` T0 table in the review body gains `continuation` with `disposition: "spend"`. Do NOT touch `gate_overridden` anywhere — it keeps being written until rc04c, and the coexistence is the split's accepted cost.

## 4. Instruments

- [ ] 4.1 Constructed-payload cases for every refusal in section 2: a later token, an EQUAL token, an unresolvable token, an empty `formed_against`, a missing `ratified_by`, and a record on a command that takes none. Each asserts the named error AND that no file was written — a refusal that writes a file is worse than no refusal.
- [ ] 4.2 The pass case: a record citing only earlier, resolvable tokens writes, and the written bytes carry the record unchanged.
- [ ] 4.3 Assert the PRESENCE scoping directly: an emit with no `formed_against` is byte-identical to what the same payload produces before this change. This is the claim that nothing existing can newly fail, and it should be executed rather than asserted in prose.
- [ ] 4.4 Type-level: a `readiness` record carrying a `continuation` disposition does not compile. If the discriminated union in 1.1 was built correctly this is free; if it needs a runtime guard, 1.1 was built wrong.

## 5. The acceptance fixture

- [ ] 5.1 Reproduce rc02c's SIX `warnings` entries (`orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/.orbit-runs/archive-2026-09-21T15-38-59Z.json`) against the new shape: THREE become `accepted` pairs in a readiness record (the capture-recapture residual, the passed-gate-is-not-a-clean-pass reading, the stale cross-reference deferred to audit-drift) and the rest stay `warnings` as process notes. This is the stage's exit criterion (3) and the reason the record's shape is credible rather than merely tidy — it was derived from this artifact.
- [ ] 5.2 Also reproduce the CONTINUATION cases from that same trail: the apply's `gate_overridden` as `continuation/proceed`, and the scoped iteration-2 external pass as `continuation/spend` — the judgement that had no home at all and motivated the stage. Confirm both cite resolvable, earlier tokens.

## 6. Close-out

- [ ] 6.1 `npm run build && npm test` green; `orbit validate --all --strict` clean.
- [ ] 6.2 Run the new write gate against EVERY archived trail's emits. Not one may newly fail — the presence scoping guarantees it, and this is the measurement that proves the guarantee rather than trusting it. Any failure is a defect this change introduced.
- [ ] 6.3 Review-marker sweep returns ZERO: `rg -n '@review[:]' orbit/changes/rc04a-judgement-record --glob '!**/.orbit-runs/**'`.
- [ ] 6.4 RECOMMEND — do not perform — the architect note this stage earns: rc04a's exit criteria met, and rc04c now unblocked (it has a hard `Depends-on` on this stage). Stage declarations belong to `/orbit:architect`.
