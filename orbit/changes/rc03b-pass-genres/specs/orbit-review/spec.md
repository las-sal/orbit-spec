## ADDED Requirements

### Requirement: Review-genre passes read the artifacts and the code, never the trail's findings

The system SHALL compose every REVIEW-genre pass (per `orbit-conventions`' `Review mode decision framework` — its genre table decides the genre; its brief rule is the owner of what a brief may carry) from the change's artifacts and the code alone. Concretely, in the review body: (a) a "Dispatching a fresh pass" step spawns the clean-context subagent with the review contract and hands it a brief that carries what the owner's list names and nothing from the trail (the list is stated once, in the owner; this step points at it), and the subagent persists through `orbit emit review`; (b) the body's prior-run inspection step is NOT RUN for a REVIEW-genre pass — the iteration ordinal is engine-computed at render time and pushback needs no prior list — and the body's pushback epitome states the discipline as current-state verification, naming no prior-run comparison; (c) the system-mode commit-range read EXCLUDES the trail: `git diff <change-start>..HEAD -- . ':!orbit/changes/<name>/.orbit-runs'` (the same pathspec in the body's own read list and in the external prompt's system-mode "what to read" section); (d) the in-context body decides its own pass genre from the one directory fact the owner names — the token-ordered listing of `address-reviews-*.json` and each record's `source_path`, read as a listing, never as findings — and treats an unreadable listing as REVIEW. A VERIFICATION-genre pass is outside this requirement: it reads the walk records of its mode by definition. The pushback discipline (`Pushback discipline on stale findings`) is unchanged — it verifies against current state, and a review-genre pass may still populate `stale_suppressed` with evidence it found itself. The one brief with no artifact — the fresh launching brief — is bound by the rule and by nothing checkable; the owner's requirement states that residual once.

#### Scenario: Fresh brief carries no finding

- **WHEN** the body dispatches a `--reviewer fresh` pass
- **THEN** the "Dispatching a fresh pass" step's brief carries what `orbit-conventions`' review-genre brief rule lists and contains no finding title, no pass token and no `.orbit-runs/` path; the pass's emit is produced identically to any fresh pass

#### Scenario: Prior-run inspection skipped for review genre

- **WHEN** a REVIEW-genre pass runs (any independent class; an in-context pass with no readable walk of its mode before it)
- **THEN** the body does not read `review-<mode>-*.json`, `external-<mode>-*.md` or `address-reviews-*.json` for that pass; the rendered report's iteration ordinal and trend are unchanged, because the engine computes them from the trail at render time

#### Scenario: System-mode diff excludes the trail

- **WHEN** a REVIEW-genre pass in system mode reads the change's commit range
- **THEN** the instruction carries the pathspec `-- . ':!orbit/changes/<name>/.orbit-runs'`, so a committed pass record or walk log is not in what the reviewer reads; the external prompt's system-mode read list carries the same pathspec

#### Scenario: Generated surface grep-tested by a decidable rule

- **WHEN** the review skill is generated
- **THEN** a test greps the skill's body and references under TWO rules and fails on any hit: (i) the PHRASE rule — "still open", "Resolved since" and "carry context" are hits ANYWHERE in the skill (they describe handing a reviewer prior findings wherever they appear), and "iteration history" is a hit only on a line that also names `.orbit-runs/`; (ii) the REGION rule — a `.orbit-runs/` mention is a hit only inside a BRIEF REGION, which is exactly the prompt template reference (whole file) and the fenced brief of the body's "Dispatching a fresh pass" step; body-side reads outside those regions (the iteration count, the `**Reviewer**:` field, the VERIFICATION-genre walk listing, write paths) are not hits. The red count on the pre-apply tree is computed FROM these rules at apply and recorded in the task, never carried from an earlier measurement

#### Scenario: In-context pass decides its own genre from the walk listing

- **WHEN** an in-context pass runs in proposal or system mode
- **THEN** the body lists `address-reviews-*.json` in the change's trail in token order and reads each record's `source_path` to decide whether a qualifying walk of its mode precedes it (per the owner's table), opens no record's findings, and treats an unreadable listing as REVIEW genre

## MODIFIED Requirements

### Requirement: `--fresh` runs pass work in a clean execution context

The system SHALL support a `--fresh` flag (all modes — proposal, system, and architecture) as shorthand for `--reviewer fresh` (D-arc Stage D5): the main pass work runs in a fresh execution context (e.g., a clean-context subagent) rather than the invoking conversation — mitigating anchoring when the invoking context authored or extensively discussed the artifacts under review. Findings, scorecard rollup, and run-summary persistence are unchanged; the flag affects only where pass work executes. A fresh-context pass fills the review cadence's independent slot (per `orbit-engine-gates`' reviewed-gate model) as the lighter-weight of the two independent classes: `--fresh` is the SAME MODEL in a CLEAN CONTEXT; `--reviewer external` is a DIFFERENT AI in a SEPARATE SESSION, the cross-vendor handoff a human carries (the class descriptions are `orbit-conventions`' `Review mode decision framework`'s; this sentence names them and restates nothing else). The engine's computed canonical next command names whichever the cadence needs. A fresh pass is REVIEW pass genre (per the same requirement's pass-genre table), so its launching brief carries no finding and no trail pointer — the review-genre read rule below says how.

#### Scenario: Fresh pass execution

- **WHEN** the command runs with `--fresh` (or the equivalent `--reviewer fresh`)
- **THEN** the passes execute in a clean context that did not author the artifacts under review; the report and run summary are produced identically to a non-fresh run, with `fresh: true` recorded in the run summary's `flags` object and `reviewer_class: "fresh"` on the emit
