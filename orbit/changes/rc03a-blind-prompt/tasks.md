# Tasks: rc03a-blind-prompt

## 1. Ordering (the mechanism)

- [ ] 1.1 In `src/core/artifact-graph/gates.ts`, the empty-pair branch of
      `canonicalNextForReviewed` renders the EXTERNAL command when neither member stands.
- [ ] 1.2 The open-pair branch is UNCHANGED — it already names the missing member, whichever it is.
- [ ] 1.3 No other slot's recommendation changes; `independent` still renders the fresh command.

## 2. The two residual channels

- [ ] 2.1 The system-mode "what to read" instruction excludes the change's own `.orbit-runs/` from
      the commit range for a blind-pair member, in BOTH places it appears (the internal body's read
      list and the external prompt's mode block).
- [ ] 2.2 The dispatch brief for a blind-pair member carries the change name, mode and pass set
      only — no finding title, count, severity or trend.
- [ ] 2.3 Nothing else in either branch changes. No cycle-context edit, no prior-run-read edit, no
      suppression logic anywhere.

## 3. Instruments

- [ ] 3.1 Unit test: with a blind-pair slot and no members standing, the canonical command is the
      external one. With one standing, it names the missing half.
- [ ] 3.2 Unit test: no other cadence entry's recommendation changed (guard against collateral).
- [ ] 3.3 Generated-surface assertion: the emitted body's system-mode read instruction carries the
      `.orbit-runs/` exclusion on the blind path.
- [ ] 3.4 Generated-surface assertion: the emitted body states the brief constraint.
- [ ] 3.5 Regression: the existing `commandForClass` blind-pair case is now unreachable on this
      path — either remove it or assert its unreachability, so the next reader is not misled the
      way three artifacts in this change's own history were.

## 4. Regenerate and verify

- [ ] 4.1 `npm run build && node bin/orbit.js update --force`.
- [ ] 4.2 `npm test` green; `node bin/orbit.js validate --all --strict` green.

## 5. Close-out

- [ ] 5.1 (User-validation) Run rc13's own system-review pair under this rule — the charter's
      named instance for exit criterion 3 — and confirm from the COMMITTED external prompt that it
      carries no prior-findings content. Cannot be asserted before archive: it needs a real pair.
- [ ] 5.2 (Architect-tier — NOT this change's to perform) Raise in an architect session: the stage
      charter's `Touches:` line names `orbit-review-external`, which this change no longer touches
      at all; its exit criteria are phrased around suppressing the external prompt, where the
      mechanism is now ordering; and `clean-up-review-cycle.md:436` cites `gates.ts:113` for the
      fresh-first default, which is unreachable on that path (`canonicalNextForReviewed` intercepts
      at 868 and returns at 878).
- [ ] 5.3 (Architect-tier) Record in the program status log what the first pair run under this rule
      measured, so the overlap number has a stated provenance.
