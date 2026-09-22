## 1. The five replacements

The delta specs under `specs/` were BUILT FROM BASELINE BY SCRIPT and already carry all five —
verified 0 scenarios dropped, 0 scenario bodies altered beyond the named substitution, and every
diff exactly one substitution. These tasks confirm rather than author; if a task here requires
NEW wording, the delta and `explore.md` D-rc04d-2 have diverged and that is the finding.

- [ ] 1.1 `orbit-engine-gates` :: `Gate-aware status and instructions with position readout` — "…and records **the override** on proceed-anyway." (was: ``records `gate_overridden` on proceed-anyway``). Confirm against D-rc04d-2 row 1.
- [ ] 1.2 `orbit-engine-gates` :: `Inflection-prompt override contract` — the OWNERSHIP MOVE, this stage's one substantive edit. The requirement states THAT the override is recorded and WHAT it carries (gate, state, reason AT DECISION TIME), names `orbit-run-summary-emit` as the shape's owner, and says explicitly it never names the field carrying it. Confirm the final clause is true both today AND after rc04c — that is the whole reason ownership moves now (D2 in `design.md`).
- [ ] 1.3 `orbit-engine-gates` :: `Review budget reported beside the gate state` — the closed-set-consumers scenario reads "…and **the override record**". Confirm against D-rc04d-2 row 3.
- [ ] 1.4 `orbit-pr-lifecycle` :: `Generalized READY rule` — BOTH sites: the requirement prose ("a recorded **proceed-anyway override** SHALL still flip READY") and its `Override still flips` scenario ("with **the override** recorded"). Confirm against rows 4a and 4b.
- [ ] 1.5 `orbit-conventions` :: `Review mode decision framework` — the gate-surfaced scenario reads "choosing proceed records **the override** in the archive run summary". Confirm against D-rc04d-2 row 5.

## 2. Verify the stage did what it claims

- [ ] 2.1 Exit (1): `grep -rn "gate_overridden" orbit/changes/rc04d-override-vocabulary/specs/` returns ZERO. The field name must not survive anywhere in the deltas.
- [ ] 2.2 Exit (2), and it is the stage's real mechanism: `git diff --name-only` for this change touches NOTHING under `src/` and NOTHING under `test/`. A hit means the stage was mis-scoped — do not "fix" it by widening the stage; stop and report. Run `npm test` and confirm green with no test edited.
- [ ] 2.3 Exit (3): re-run the exploration's own measurement and confirm `gate_overridden`'s footprint in `orbit/specs/` drops from SIX capabilities to THREE once these deltas sync. Pre-sync it still reads six; the check belongs at archive, after sync — note it for the at-archive step rather than asserting it now.
- [ ] 2.4 Confirm every de-named form is TRUE OF THE ENGINE AS IT STANDS — read each replacement against the behaviour it describes, not against its predecessor's wording. This is the claim exit (2) makes falsifiable and the one a reviewer should attack hardest.
- [ ] 2.5 Re-run the scenario-level fidelity check (delta vs live baseline, per requirement): 0 dropped, and every changed scenario body changed by exactly its named substitution. Do not trust the authoring script's own assertions as the only witness — that is the instrument-error class this program has now recorded five times.

## 3. Hand off what the sibling stage inherits

- [ ] 3.1 RECORD (do not perform) for `rc04c-retire-gate-overridden`: `test/core/templates/orbit-content-fidelity.test.ts` pins `gate_overridden` in the `apply-change` and `archive-change` BODIES. Those two pins go RED the moment rc04c stops the bodies writing the field — a pin doing its job, and it belongs in rc04c's task list as a deliberate update with the reason recorded rather than a surprise mid-apply. Captured in `explore.md` D-rc04d-1.
- [ ] 3.2 RECORD for rc04c: after this stage archives, `gate_overridden` remains in exactly three baseline capabilities — `orbit-emit-composition`, `orbit-run-summary-emit`, `orbit-archive-modifications` — which is rc04c's scope, at the ceiling rather than double it.
