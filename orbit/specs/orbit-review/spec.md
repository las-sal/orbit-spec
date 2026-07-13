# orbit-review Specification

## Purpose

The unified `/orbit:review` command — editorial review of an OpenSpec change in either proposal mode (pre-apply, 9 passes over artifacts) or system mode (post-apply, `verify-change` as Pass 0 + 6 system-wide passes). Both modes share the 3-dimension scorecard (Completeness / Correctness / Coherence), the severity ladder (CRITICAL / WARNING / SUGGESTION), pushback discipline, and `.orbit-runs/` persistence. Generates findings but does not resolve them; resolution flows through `/orbit:address-reviews`.
## Requirements
### Requirement: Review command available with `--as` mode flag

The system SHALL expose a single `/orbit:review` command that runs an editorial review of an OpenSpec change. The `--as proposal` flag reviews pre-implementation artifacts (proposal/design/specs/tasks); the `--as system` flag reviews the whole product state after a change has been applied.

#### Scenario: Invoke with change name and explicit mode

- **WHEN** the user invokes `/orbit:review <change-name> --as proposal` or `/orbit:review <change-name> --as system`
- **THEN** the command reads the change's artifacts and runs the appropriate set of passes for that mode

#### Scenario: Invoke without change name

- **WHEN** the user invokes `/orbit:review` with no argument
- **THEN** the command runs `orbit list --json`, presents the active changes via `AskUserQuestion`, and uses the user's selection as the change scope

#### Scenario: Mode inference when `--as` omitted

- **WHEN** the user invokes `/orbit:review <change-name>` without `--as`
- **THEN** the command infers the mode from `tasks.md` state: ALL task boxes unchecked → `proposal`; all tasks checked and code exists → `system`; ambiguous (mixed checked/unchecked, or checked without visible code changes) → prompt the user via `AskUserQuestion` to pick; the inferred mode is shown in the report header

### Requirement: Proposal mode runs nine passes

The system SHALL execute 9 distinct review passes in proposal mode: (1) Structure & Delta Integrity, (2) Internal Coherence, (3) Cross-Doc Coherence, (4) Archive Consistency, (5) Codegen Readiness, (6) Gap Hunt (generative completeness probe), (7) Drift Hunt, (8) Inline Review Marker Residue, (9) Pre-Handoff Sweep.

#### Scenario: Proposal mode default depth runs all passes

- **WHEN** the command runs as `--as proposal` with default `--full` depth
- **THEN** all 9 passes execute sequentially and each produces findings (possibly zero) of severity CRITICAL, WARNING, or SUGGESTION

#### Scenario: Proposal mode `--fast` runs cheap subset only

- **WHEN** the command runs as `--as proposal` with `--fast`
- **THEN** only Passes 1 (Structure & Delta), 7 (Drift Hunt), and 8 (Inline Review Marker Residue) execute, and the remaining passes are reported as skipped

#### Scenario: Pass 6 Gap Hunt operational heuristic (proposal mode)

- **WHEN** Pass 6 runs
- **THEN** for each requirement in the change's spec deltas, the AI asks (and answers in the finding when affirmative): (a) are there unstated assumptions an implementer would have to invent (e.g., "what file path?", "what default value?")? (b) are error or edge-case paths specified, not just happy paths? (c) are state transitions explicit, including invalid transitions? (d) for any "X SHALL do Y", is Y precise enough that two implementers would produce the same behavior? Findings cite the requirement's file:line and the specific gap; suggest concrete spec additions to close the gap

#### Scenario: Pass 8 marker residue detection (operational)

- **WHEN** Pass 8 runs
- **THEN** the AI greps the change directory for `@review:` markers and distinguishes two cases: (a) **actual unresolved markers** — markers in proposal/design/spec/tasks/explore.md content that represent unaddressed review notes (these are CRITICAL findings and MUST be addressed before applying); (b) **documentation appearances of the marker syntax** — `@review:` text inside code blocks, examples, or scenarios that document the marker convention itself (these are NOT findings). The distinction is whether the marker is inside a fenced code block / inline-code span / explicit "example" prose context (documentation) vs. sitting bare in artifact content (unresolved). When ambiguous, classify as CRITICAL and let the user decide during `/orbit:address-reviews`.

### Requirement: System mode runs verify-change + six system-wide passes

The system SHALL execute 7 review passes in system mode: Pass 0 delegates to upstream `verify-change`; Passes 1–6 are orbit additions covering Baseline Compliance, Cohesion, Surface Walk, Perspective Reviews, Critical-Path Scan, Drift/Residue.

#### Scenario: Pass 0 delegates to upstream verify-change

- **WHEN** the command runs as `--as system` and `--skip-verify` is not specified
- **THEN** Pass 0 invokes `/orbit:verify <change-name>` (via the upstream `orbit-verify-change` skill) and folds its CRITICAL/WARNING/SUGGESTION findings into the report under the appropriate scorecard dimensions

#### Scenario: System mode default depth runs all passes

- **WHEN** the command runs as `--as system` with default `--full` depth
- **THEN** Passes 0–6 all execute (subject to `--skip-verify`) and each produces findings (possibly zero)

#### Scenario: System mode `--fast` runs cheap subset only

- **WHEN** the command runs as `--as system` with `--fast`
- **THEN** Pass 0 (verify-change), Pass 1 (Baseline Compliance), and Pass 6 (Drift/Residue) execute; Passes 2–5 are reported as skipped

#### Scenario: Pass 1 — Baseline Compliance

- **WHEN** Pass 1 runs in system mode
- **THEN** the command reads every requirement in archived `orbit/specs/*/spec.md` (not just the change's deltas) and reports CRITICAL when a baseline requirement appears violated; WARNING when a baseline scenario looks regressed

#### Scenario: Pass 2 — Cohesion walk

- **WHEN** Pass 2 runs in system mode
- **THEN** the command identifies files the change touched (from `git diff` and the tasks list) and walks callers/dependents not in the change's tasks for signature drift, semantic shifts, or side effects; flags WARNING for caller-side contract drift, CRITICAL when a downstream is clearly broken

#### Scenario: Pass 3 — Surface walk derives surfaces from specs

- **WHEN** Pass 3 runs in system mode
- **THEN** the command enumerates surfaces from `orbit/specs/<capability>/spec.md` (capabilities ARE surfaces) and checks each entry remains coherent after the change; flags WARNING for inconsistencies, CRITICAL when a surface was removed unintentionally

#### Scenario: Pass 4 — Perspective reviews from lenses

- **WHEN** Pass 4 runs in system mode and `orbit/lenses/perspectives.md` exists
- **THEN** for each named perspective, the command simulates typical call patterns; flags SUGGESTION/WARNING when interactions are awkward, inconsistent, or surprising from a registered caller's POV

#### Scenario: Pass 4 — No perspectives defined

- **WHEN** Pass 4 runs in system mode but `orbit/lenses/perspectives.md` is empty or absent
- **THEN** Pass 4 is skipped with a note "no perspectives defined; skip Pass 4"

#### Scenario: Pass 5 — Critical-path scan from lenses

- **WHEN** Pass 5 runs in system mode and `orbit/lenses/critical-paths.md` exists
- **THEN** for each named flow, the command walks the code end-to-end checking for breakage, regression, or drift; flags CRITICAL for path breakage, WARNING for regression risk

#### Scenario: Pass 5 — No critical paths defined

- **WHEN** Pass 5 runs in system mode but `orbit/lenses/critical-paths.md` is empty or absent
- **THEN** Pass 5 is skipped with a note "no critical paths defined; skip Pass 5"

#### Scenario: Pass 6 — Drift / Residue via audit-drift

- **WHEN** Pass 6 runs in system mode
- **THEN** the command invokes `/orbit:audit-drift` as a library function and folds its findings into the report under the Coherence dimension

### Requirement: Findings rolled into a shared 3-dimension scorecard

The system SHALL roll all passes (mode-specific) into a 3-dimension scorecard (Completeness / Correctness / Coherence) per the orbit-conventions reporting standard, regardless of mode.

#### Scenario: Proposal-mode scorecard mapping

- **WHEN** the command runs in proposal mode and findings are reported
- **THEN** Pass 1 (Structure & Delta), Pass 5 (Codegen Readiness), and Pass 6 (Gap Hunt) contribute to Completeness; Pass 2 (Internal Coherence) and Pass 4 (Archive Consistency) contribute to Correctness; Pass 3 (Cross-Doc), Pass 7 (Drift Hunt), Pass 8 (Inline Review Marker Residue), and Pass 9 (Pre-Handoff Sweep) contribute to Coherence

#### Scenario: System-mode scorecard mapping

- **WHEN** the command runs in system mode and findings are reported
- **THEN** Pass 0 contributes to all three dimensions per verify-change's own mapping (Completeness: task-completion + spec-coverage findings; Correctness: requirement-implementation-mapping + scenario-coverage findings; Coherence: design-adherence + code-pattern-consistency findings); Pass 1 (Baseline Compliance) contributes to Correctness; Pass 2 (Cohesion) contributes to Correctness; Pass 3 (Surface Walk) contributes to Coherence; Pass 4 (Perspective Reviews) contributes to Coherence; Pass 5 (Critical-Path Scan) contributes to both Completeness and Correctness; Pass 6 (Drift/Residue) contributes to Coherence

#### Scenario: Severity ladder applied

- **WHEN** any pass produces a finding
- **THEN** the finding is tagged CRITICAL, WARNING, or SUGGESTION with bias toward lower severity when uncertain; includes a file:line reference and an actionable recommendation

### Requirement: Final assessment phrasings depend on mode

The system SHALL emit a final-assessment line in the report using one of the stock phrasings below, with gate text varying by mode. BOTH modes' "no CRITICAL" cases vary on the engine-computed review gate state for the phase — proposal mode on the `review-proposal` gate (`confirm: no-new-findings`; its cadence is declared in `orbit-engine-gates`' spec-driven schema, not restated here), system mode on the `review-system` gate — so the final assessment always renders the computed gate state plus one canonical next command (never a bare "Ready to apply" / "Ready to archive" without a command). orbit-review evaluates ALL proposal- and system-mode convergence branches below over the on-disk trail PLUS a synthetic pass for the run currently completing (per the `Final assessment counts the current pass (as-of-completion, both modes)` scenario), so each branch's "exists / most recent / latest" test includes the active run even though its emit is not yet on disk. Per `orbit-engine-gates`' v1 freshness rule a `review-proposal` pass never goes stale (no pre-apply artifact-changing event), so proposal mode has no stale state. System-mode "no CRITICAL" cases additionally vary on the external-review state for the change — orbit-review SHALL inspect both the most recent `external-system-*.md` file's content (for findings presence) AND any `address-reviews-*.json` whose `source_path` references that external file (for resolution status), to determine which of five convergence states applies: (1) no prior external, (2) external clean, (3) external resolved via address-reviews, (4) external present with unresolved findings, (5) external stale relative to artifacts. These five states are EXTERNAL-DIMENSION rendering buckets layered on the engine's base `review-system` gate verdict: the Path A / Path B `gate review-system PASSED` phrasings apply ONLY when `orbit-engine-gates` reports the gate PASSED — BOTH full ordered-slot coverage (including the leading `in-context` slot preceding the external) AND the confirm predicate (`findings-resolved`: the external pass yielded 0 CRITICAL and all its findings are resolved). When the external has converged on the external dimension but the engine's verdict is still unpassed, the assessment defers to the engine-computed gate state plus canonical next command, routed by WHY it is unpassed: a missing ordered SLOT → the `System mode — external converged but gate not yet passed on ordered-slot grounds` scenario (an in-context command), while a failed confirm PREDICATE (a resolved-but-CRITICAL external) → the `System mode — external resolved but carried a CRITICAL` scenario (a fresh external). When BOTH hold, the missing slot takes precedence (clause (a) before clause (c)), so the ordered-slot scenario governs. The state determination over the on-disk audit trail is deterministic and matches `orbit-engine-gates`' reviewed-gate state computation; orbit-review's final-assessment rendering additionally folds in the synthetic current-run pass (above) — itself a deterministic computation over the documented inputs, distinct from the engine's on-disk-only computation that backs `orbit status` / `orbit instructions`. The skill never composes a recommendation from SUBJECTIVE judgment: every phrasing is the deterministic rendering of a computed state. All phrasings are SINGLE-VOICED per `orbit-engine-gates`' single-voiced recommendation requirement: one canonical next command (full invocation with flags), no advertised alternatives or skip paths — overrides happen only at the gated command's inflection prompt. Rendered next-command labels follow `orbit-engine-gates`' eligibility-phrasing rule (D-arc Stage D1): the label is `Ready when you are:` — never an imperative `Next:` — with ` — user-invoked` appended when the recommended command enters a consent-marked phase (`/orbit:apply`, `/orbit:archive` in `spec-driven`).

#### Scenario: Proposal mode — at least one CRITICAL

- **WHEN** running as `--as proposal` and the report contains one or more CRITICAL findings
- **THEN** the final assessment reads `X critical issue(s) found. Fix before /orbit:apply.`

#### Scenario: Proposal mode — no CRITICAL, no fresh independent pass yet

- **WHEN** running as `--as proposal` and the report contains zero CRITICAL findings AND no FRESH independent-class pass (`fresh` or `external`) exists in the change's `.orbit-runs/` (only `in-context` review emits are present) — the `review-proposal` cadence's leading `independent` slot is uncovered
- **THEN** the final assessment renders the engine-computed `review-proposal` state (UNPASSED, reason `cadence class 'independent' has no fresh pass`) and the canonical command for the independent slot. The independent slot is satisfied by a fresh-context OR an external pass; the canonical command is the fresh-context review (the proposal-phase default per the cadence). Exact stock phrasing for "all clear" sub-case: `All checks passed (in-context pass). gate review-proposal UNPASSED — the cadence's independent slot is uncovered. Ready when you are: /orbit:review --as proposal --fresh <change> — independent cross-check required by the review cadence before apply (per orbit-conventions Review mode decision framework).` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. gate review-proposal UNPASSED — the cadence's independent slot is uncovered. Ready when you are: /orbit:review --as proposal --fresh <change> — independent cross-check required by the review cadence before apply (per orbit-conventions Review mode decision framework).`

#### Scenario: Proposal mode — no CRITICAL, a gate-relevant pass has unresolved findings

- **WHEN** running as `--as proposal` and the report contains zero CRITICAL findings AND ANY gate-relevant pass — independent (`fresh`/`external`) OR `in-context`, since `orbit-engine-gates`' reviewed-gate clause (b) requires EVERY pass's findings resolved, not only the latest independent one — has findings with no completing address-reviews run (no `address-reviews-*.json` whose `source_path` references that pass's findings artifact shows `resolution_summary.deferred == 0 AND escalated == 0`). This branch takes precedence over ALL other no-CRITICAL proposal branches — including "no fresh independent pass yet" (resolve outstanding findings before adding more review passes) as well as "new findings" / "trailing in-context" / "gate passed": any unresolved gate-relevant pass blocks the gate, even when the leading independent slot is uncovered or the most recent independent pass is clean.
- **THEN** the final assessment recommends address-reviews, not apply, targeting the unresolved pass's findings artifact — `review-<mode>-<TS>.json` for an internal pass OR `external-<as>-<TS>.md` for an external pass (both are valid `--from-file` inputs). `<unresolved-path>` resolves to the MOST RECENT unresolved gate-relevant pass by `<TS>` token; when several are unresolved, each address-reviews run clears one and the next assessment surfaces the next until clause (b) holds for all. Exact stock phrasing for "all clear" sub-case: `All checks passed against current state, but a prior gate-relevant pass has unresolved findings; gate review-proposal UNPASSED. Ready when you are: /orbit:address-reviews <change> --from-file <unresolved-path>.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. A prior gate-relevant pass has unresolved findings; gate review-proposal UNPASSED. Ready when you are: /orbit:address-reviews <change> --from-file <unresolved-path>.`

#### Scenario: Proposal mode — no CRITICAL, independent loop has not converged (new findings)

- **WHEN** running as `--as proposal` and the report contains zero CRITICAL findings AND the most recent independent-class pass's findings are resolved (`deferred == 0 AND escalated == 0`) BUT that pass yielded one or more NEW findings (matched against same-gate prior passes by trimmed title + path per `orbit-engine-gates`) — so the `confirm: no-new-findings` predicate is not yet met
- **THEN** the final assessment repeats the independent pass (the independent+address loop continues until an independent pass yields no new findings). Exact stock phrasing for "all clear" sub-case: `All checks passed, but the latest independent pass yielded new findings (now resolved); gate review-proposal UNPASSED until an independent pass yields none. Ready when you are: /orbit:review --as proposal --fresh <change>.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. The latest independent pass yielded new findings (now resolved); gate review-proposal UNPASSED until an independent pass yields none. Ready when you are: /orbit:review --as proposal --fresh <change>.`

#### Scenario: Proposal mode — no CRITICAL, independent confirm met, trailing in-context slot uncovered

- **WHEN** running as `--as proposal` and the report contains zero CRITICAL findings AND the most recent independent-class pass meets `confirm: no-new-findings` (0 CRITICAL AND 0 new findings, its findings resolved) BUT no `in-context` pass exists whose `<TS>` token is STRICTLY LATER than that independent pass (the trailing `in-context` cadence slot is uncovered)
- **THEN** the final assessment recommends the closing in-context confirm. Exact stock phrasing for "all clear" sub-case: `All checks passed. Independent review converged; gate review-proposal needs its closing in-context confirm. Ready when you are: /orbit:review --as proposal <change>.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. Independent review converged; gate review-proposal needs its closing in-context confirm. Ready when you are: /orbit:review --as proposal <change>.`

#### Scenario: Proposal mode — no CRITICAL, review-proposal gate passed

- **WHEN** running as `--as proposal` and the report contains zero CRITICAL findings AND the `review-proposal` gate is PASSED per `orbit-engine-gates`' reviewed-gate pass condition (ordered cadence-slot coverage, all passes' findings resolved, latest independent pass meets `no-new-findings`)
- **THEN** the final assessment clears the gate to apply. Exact stock phrasing for "all clear" sub-case: `All checks passed. gate review-proposal PASSED. Ready when you are: /orbit:apply <change> — user-invoked.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. gate review-proposal PASSED. Ready when you are: /orbit:apply <change> (with noted improvements) — user-invoked.`

#### Scenario: Final assessment counts the current pass (as-of-completion, both modes)

- **WHEN** orbit-review renders the final assessment for ANY in-progress `/orbit:review` run, in EITHER mode — the run's own pass is not yet on disk because its `review-<mode>-<TS>.json` emit is written at Step 10, after the assessment is rendered at Step 9
- **THEN** orbit-review SHALL compute gate state over the on-disk trail PLUS a synthetic pass standing in for the active run, carrying: this run's `mode`, its `reviewer_class` (`in-context`, or `fresh` under `--fresh`; an external run is never the current pass — externals arrive via handoff), a `<TS>` token of "now" (later than every on-disk token), the path of the about-to-be-written `review-<mode>-<TS>.json`, and the run's CURRENT findings. The synthetic pass is counted only for orbit-review's own final-assessment rendering; `orbit status` / `orbit instructions` gate computation stays a pure function of the on-disk trail (per `orbit-engine-gates`), so between Step 9 and Step 10 those surfaces may briefly read the gate as one slot short — expected, resolved once the emit lands. Consequences the synthetic pass MUST produce:
  - **Proposal, current `--fresh` run, no prior independent pass**: the current fresh pass covers the leading `independent` slot — so the assessment does NOT fall into "no fresh independent pass yet" and re-recommend `--fresh`. If the current pass has findings → the unresolved-pass branch fires with `<unresolved-path>` = the just-written `review-proposal-<TS>.json` (`Ready when you are: /orbit:address-reviews <change> --from-file <unresolved-path>`); if clean and no-new → the trailing `in-context` slot is what remains (`Ready when you are: /orbit:review --as proposal <change>`).
  - **Proposal, current `in-context` run, clean independent already on disk**: the current pass covers the trailing `in-context` slot → gate-passed phrasing (`Ready when you are: /orbit:apply <change> — user-invoked`), not a redundant in-context-confirm recommendation.
  - **System, current `in-context` run after a converged external**: the system gate's cadence needs a trailing `in-context` slot after the external; the current in-context system run supplies it, so the Path A / Path B `gate review-system PASSED` phrasings are reachable in the same run that observes the converged external (provided the leading in-context slot was already covered before the external) rather than requiring a further separate confirm run.
  - **Any mode, current pass has findings**: the canonical address-reviews command points at the just-written `review-<mode>-<TS>.json` (the synthetic pass's own findings artifact), never at a stale prior pass.

#### Scenario: System mode — at least one CRITICAL

- **WHEN** running as `--as system` and the report contains one or more CRITICAL findings
- **THEN** the final assessment reads `X critical issue(s) found. Fix before /orbit:archive.`

#### Scenario: System mode — no CRITICAL, no prior external system review

- **WHEN** running as `--as system` and the report contains zero CRITICAL findings AND no `external-system-*.md` file exists in the change's `.orbit-runs/` directory AND the leading `in-context` cadence slot is covered — the current run is itself `in-context` (the normal first system pass) OR a prior in-context system pass exists. (A `--fresh`-first system run with no external does NOT match this scenario: `fresh` does not satisfy an `in-context` slot, so the engine's canonical-next is the leading in-context pass `/orbit:review --as system <change>`, not external — that off-cadence case routes through the engine-computed gate state, not this recommend-external scenario, and is rendered directly as the engine canonical command with NO dedicated stock phrasing here, per the intro's general subordination rule.)
- **THEN** the final assessment recommends external review before archive, citing the empirical evidence. Exact stock phrasing for "all clear" sub-case: `All checks passed (in-context pass). Ready when you are: /orbit:review-external --as system <change> — external cross-check required by the review cadence before archive (per orbit-conventions Review mode decision framework; in an early dogfooding cycle, in-context system review missed 3 of 3 real implementation bugs — all caught by external review).` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. Ready when you are: /orbit:review-external --as system <change> — external cross-check required by the review cadence before archive (per orbit-conventions Review mode decision framework).`

#### Scenario: System mode — no CRITICAL, external content is clean (Path A convergence)

- **WHEN** running as `--as system` and the report contains zero CRITICAL findings AND the most recent `external-system-*.md` file in the change's `.orbit-runs/` directory has zero findings across all severities (parsed using the empty-severity-sentinel definition from `orbit-address-reviews/references/external-findings-format.md`: each of `## CRITICAL`, `## WARNING`, and `## SUGGESTION` sections contains only `None.` or an accepted equivalent — `None`, `none.`, or `(none)` — with no `### <title>` entries underneath) AND no later artifact-changing event (latest `apply-*.json` filename `<TS>` token, per orbit-conventions `Internal-run JSON summary format`) is newer than the external file's filename token
  AND `orbit-engine-gates` reports the `review-system` gate's other ordered cadence slots covered (a leading `in-context` pass precedes the external, and the trailing `in-context` slot is covered — the current in-context system run supplies it per the as-of-completion rule); if that ordered-slot coverage is incomplete, the `external converged but gate not yet passed on ordered-slot grounds` scenario applies instead of this one
- **THEN** the final assessment treats the external as converged via clean content. Exact stock phrasing for "all clear" sub-case: `All checks passed. External system review (clean) converged; gate review-system PASSED. Ready when you are: /orbit:archive <change> — user-invoked.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. External system review (clean) converged; gate review-system PASSED. Ready when you are: /orbit:archive <change> (with noted improvements) — user-invoked.`

#### Scenario: System mode — no CRITICAL, external resolved via address-reviews (Path B convergence)

- **WHEN** running as `--as system` and the report contains zero CRITICAL findings AND the most recent `external-system-*.md` file exists AND the most recent `address-reviews-*.json` whose `source_path` field references that external file (using repo-relative path normalization: both the address-reviews `source_path` and the candidate external file path are canonicalized to repo-relative form before exact string comparison; absolute paths are accepted only after normalization to the same repo-relative target) has `resolution_summary.deferred == 0` AND `resolution_summary.escalated == 0` (all findings either resolved, stale-suppressed, or out-of-scope) AND no later `apply-*.json` exists whose filename `<TS>` token is newer than the EXTERNAL file's filename token (consistent with precedence rule (1): any apply after the external forces re-validation via the stale state regardless of subsequent resolution; later address-reviews-*.json for OTHER inputs do NOT affect this external's convergence — per the per-external-scoped artifact-change guard discussed in the precedence-rules scenario below)
  AND `orbit-engine-gates` reports the `review-system` gate's other ordered cadence slots covered (a leading `in-context` pass precedes the external, and the trailing `in-context` slot is covered — the current in-context system run supplies it per the as-of-completion rule); if that ordered-slot coverage is incomplete, the `external converged but gate not yet passed on ordered-slot grounds` scenario applies instead of this one
  AND that external pass itself yielded 0 CRITICAL findings — the `confirm: findings-resolved` predicate per `orbit-engine-gates`' reviewed-gate clause (c) (which requires "0 CRITICAL AND that pass's findings all resolved"); a resolved-but-CRITICAL external does NOT converge (the cadence repeats the external while it yields CRITICALs, per D-c1-4), and routes to the `external resolved but carried a CRITICAL` scenario below instead of this one
- **THEN** the final assessment treats the external as converged via resolution. Exact stock phrasing for "all clear" sub-case: `All checks passed. External system review findings resolved via /orbit:address-reviews; gate review-system PASSED. Ready when you are: /orbit:archive <change> — user-invoked.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. External system review findings resolved via /orbit:address-reviews; gate review-system PASSED. Ready when you are: /orbit:archive <change> (with noted improvements) — user-invoked.`

#### Scenario: System mode — external converged but gate not yet passed on ordered-slot grounds

- **WHEN** running as `--as system` and the report contains zero CRITICAL findings AND the most recent `external-system-*.md` is content-clean (Path A) OR has its findings fully resolved (the matching `address-reviews-*.json` shows `resolution_summary.deferred == 0 AND escalated == 0`), and is not stale — i.e. it would converge on the external dimension but for cadence ordering, REGARDLESS of whether the external itself carried a (now-resolved) CRITICAL — BUT `orbit-engine-gates` reports the `review-system` gate UNPASSED because an ordered cadence slot is uncovered, most commonly the leading `in-context` slot (no in-context system pass precedes the external). A missing ordered slot (clause (a)) is evaluated BEFORE the confirm predicate (clause (c)), so this scenario TAKES PRECEDENCE over `external resolved but carried a CRITICAL` whenever a slot is uncovered AND the external carried a resolved CRITICAL — the engine's canonical-next targets the uncovered slot's class, not a fresh external
- **THEN** the final assessment does NOT render `gate review-system PASSED`; it defers to the engine-computed gate state and its single canonical next command (per `orbit-engine-gates`' single-voiced canonical-next computation), naming the uncovered slot's class. For the common leading-`in-context`-uncovered case the canonical command is `/orbit:review --as system <change>` (the in-context system pass the cadence wants first). Exact stock phrasing for "all clear" sub-case: `All checks passed; the external system review has converged, but gate review-system is UNPASSED — the cadence's leading in-context slot is uncovered. Ready when you are: /orbit:review --as system <change>.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. The external system review has converged, but gate review-system is UNPASSED — the cadence's leading in-context slot is uncovered. Ready when you are: /orbit:review --as system <change>.` **v1 ordering caveat**: because slot satisfaction is strictly time-ordered (per `orbit-engine-gates`' reviewed-gate clause (a)), an in-context pass run NOW carries a token later than the external and so covers only a TRAILING slot — a gate whose LEADING in-context slot was skipped before the external cannot be retroactively covered in v1; the user's recourse is the apply-parity override at the archive inflection prompt (surfaced only there, never advertised in this recommendation).

#### Scenario: System mode — external resolved but carried a CRITICAL (confirm predicate unmet)

- **WHEN** running as `--as system` and the report contains zero CRITICAL findings AND the most recent `external-system-*.md` exists AND its findings are fully resolved (the matching `address-reviews-*.json` shows `resolution_summary.deferred == 0 AND escalated == 0`) AND no later `apply-*.json` exists (so it is not stale) AND the gate's ordered cadence slots are otherwise COVERED (a leading `in-context` pass precedes the external and the trailing `in-context` slot is covered — so the only unmet clause is the confirm predicate; if a slot is ALSO uncovered, the `ordered-slot grounds` scenario above takes precedence) BUT that external pass itself yielded ONE OR MORE CRITICAL findings — so `orbit-engine-gates`' `confirm: findings-resolved` predicate (clause (c): "0 CRITICAL AND that pass's findings all resolved") is NOT met and the engine reports the `review-system` gate UNPASSED even though every finding was resolved
- **THEN** the final assessment does NOT render `gate review-system PASSED`; the cadence repeats the external while it yields CRITICALs (per D-c1-4), so the canonical next command is a fresh external. Exact stock phrasing for "all clear" sub-case: `All checks passed; the prior /orbit:review-external found and resolved a CRITICAL, so gate review-system is UNPASSED until a fresh external yields none. Ready when you are: /orbit:review-external --as system <change>.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. The prior /orbit:review-external found and resolved a CRITICAL, so gate review-system is UNPASSED until a fresh external yields none. Ready when you are: /orbit:review-external --as system <change>.` This scenario is distinct from `external converged but gate not yet passed on ordered-slot grounds` (which fires on missing slot COVERAGE, → an in-context command) — here coverage is complete but the confirm PREDICATE fails, → a fresh external.

#### Scenario: System mode — no CRITICAL, external present with unresolved findings

- **WHEN** running as `--as system` and the report contains zero CRITICAL findings AND the most recent `external-system-*.md` has one or more `### <title>` entries under any severity (i.e., NOT clean per Path A) AND EITHER no `address-reviews-*.json` exists with `source_path` (repo-relative-normalized per the Path B comparison rule) referencing that external file OR the most recent such address-reviews JSON shows `resolution_summary.deferred > 0` OR `resolution_summary.escalated > 0`
- **THEN** the final assessment recommends address-reviews next, not archive. Exact stock phrasing for "all clear" sub-case: `All checks passed against current state, but the prior /orbit:review-external has unresolved findings. Ready when you are: /orbit:address-reviews <change> --from-file <external-path>.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. Prior /orbit:review-external has unresolved findings. Ready when you are: /orbit:address-reviews <change> --from-file <external-path>.`

#### Scenario: System mode — no CRITICAL, external stale relative to artifact changes

- **WHEN** running as `--as system` and the report contains zero CRITICAL findings AND a `external-system-*.md` file exists AND an `apply-*.json` exists with a filename `<TS>` token LATER than the external file's filename token (i.e., implementation changed after the external review evaluated the artifacts)
- **THEN** the final assessment recommends re-running external because the prior external evaluation no longer applies to the current artifact state. Exact stock phrasing for "all clear" sub-case: `All checks passed against current state, but the prior /orbit:review-external is older than the most recent apply step (artifacts changed since external evaluated); gate review-system STALE. Ready when you are: /orbit:review-external --as system <change> — re-validate against current product state.` Exact stock phrasing for "Only WARNING/SUGGESTION" sub-case: `No critical issues. Y warning(s) to consider. Prior /orbit:review-external is older than the most recent apply step; gate review-system STALE. Ready when you are: /orbit:review-external --as system <change> — re-validate against current product state.`

#### Scenario: Convergence-state precedence when multiple states apply

- **WHEN** the iteration-aware logic encounters a change-state where multiple convergence scenarios could match (e.g., external is clean AND artifacts changed; OR external has unresolved findings AND artifacts also changed since)
- **THEN** orbit-review SHALL apply the precedence order: (1) `external stale relative to artifact changes` takes precedence over Path A clean / Path B resolved / unresolved-findings — if artifacts changed after the external, the external's evaluation is no longer trustworthy regardless of its content or resolution. (2) `external present with unresolved findings` takes precedence over Path B resolved — unresolved findings are a stronger signal than a partially-resolved external (a prior address-reviews run with `deferred > 0` or `escalated > 0` does not converge; Path A clean is mutually exclusive with unresolved by content, so no precedence is needed between those two). (3) Path A clean and Path B resolved are mutually exclusive (either the external is clean OR it had findings; can't be both); precedence between them doesn't apply. **The per-external scoping rule**: when evaluating "artifact-changing event after the external" for the stale check, ONLY `apply-*.json` files matter — `address-reviews-*.json` files for OTHER inputs (resolving inline markers or a different external) do NOT trigger stale because they don't change the artifacts the external evaluated. This per-external-scoped guard ensures the 5-state model is exhaustive and mutually exclusive: every change-state falls into exactly one of states 1-5 without falling through.

#### Scenario: Unpassed gate surfaces at archive via the inflection prompt, never a hard block

- **WHEN** the user invokes `/orbit:archive` while the `review-system` gate is unpassed or stale
- **THEN** the archive flow fires the gate inflection prompt per `orbit-engine-gates`' override contract (address the gate / proceed anyway / abort); proceeding is recorded in the archive run summary; the gate NEVER hard-blocks. Skip paths are not advertised in any recommendation text — the inflection prompt is the single place the override choice exists (apply-parity enforcement, per `orbit-engine-gates`).

#### Scenario: Edge-case assumptions for the iteration-aware logic

- **WHEN** the iteration-aware logic encounters edge cases not explicitly enumerated in the prior scenarios (corrupted/empty `external-system-*.md`; malformed `address-reviews-*.json` whose JSON fields cannot be read; multiple matching files of the same type; filename-token parse failures; address-reviews JSON whose `source_path` references a non-existent external file)
- **THEN** the v1 behavior follows these documented assumptions: (a) **Multiple matching files** — when multiple matching files of the same type exist (multiple `external-system-*.md`, multiple `address-reviews-*.json`, multiple `apply-*.json`), the most-recent filename `<TS>` token determines comparison (lexical sort works because the token format is `YYYY-MM-DDTHH-MM-SSZ` — ISO-8601 with colons replaced; later timestamps sort lexically later). (b) **Unparseable filename token** — a file whose `<TS>` token cannot be parsed is treated as absent for comparison purposes. (c) **External markdown parse failure** — if the external file cannot be parsed for the Path A "clean content" check (e.g., severity headers missing, malformed markdown), it is treated as NOT-clean (defaulting to the unresolved-findings or stale branch); Path A requires confident parse success. (d) **address-reviews JSON parse failure** — if the JSON cannot be read or `resolution_summary` is missing required fields, it is treated as if no address-reviews has run for that external (defaulting to the unresolved-findings branch). (e) **Dangling source_path** — an `address-reviews-*.json` whose `source_path` references a non-existent file is ignored for convergence detection. Future drift-audit Cat 4 or downstream tools MAY add validation for these cases; orbit-review's v1 stays simple.

#### Scenario: Iteration-aware logic does NOT inspect apply-chunk emit chain

- **WHEN** determining "artifacts changed after external" for the stale-detection logic
- **THEN** orbit-review SHALL inspect `apply-*.json` filename tokens (the apply skill emits one per chunk-end per orbit-run-summary-emit's `Apply per-chunk-end emission` requirement). The CURRENT v1 check considers ANY `apply-*.json` later than the external file as evidence of artifact change, without distinguishing between mid-implementation chunks (where the external was correctly run against partial state) and post-final-chunk applies. This is intentional v1 simplification — orbit doesn't currently track which chunks were applied when; the assumption is that ANY apply-chunk after external is meaningful enough to warrant re-running external. Future enhancement could refine this against the change's task-completion graph.

#### Scenario: Recommendation prose is auditable by drift-audit

- **WHEN** the stock-phrasings prose drifts from the `Review mode decision framework` requirement's criteria, OR the cited empirical evidence (the 3-of-3 early-dogfooding-cycle citation) becomes inaccurate
- **THEN** `/orbit:audit-drift` Category 3 (cross-doc consistency) SHALL surface the drift on next run. The recommendation prose's empirical citation is treated as documentation that can rot; drift-audit catches the rot.

### Requirement: Special-case lenses supported via `--focus`

The system SHALL accept a `--focus <lens>` flag that adds emphasis to specific passes without skipping others.

#### Scenario: Proposal-mode `--focus rename`

- **WHEN** the command runs as `--as proposal --focus rename`
- **THEN** Pass 7 (Drift Hunt), Pass 3 (Cross-Doc), and Pass 4 (Archive Consistency) run with elevated rigor; all other passes still execute

#### Scenario: Proposal-mode `--focus flip`

- **WHEN** the command runs as `--as proposal --focus flip`
- **THEN** Pass 2 (Internal Coherence) emphasizes directionality and Pass 5 (Codegen Readiness) emphasizes that surfaces are specified for both directions

#### Scenario: System-mode `--focus hotpath`

- **WHEN** the command runs as `--as system --focus hotpath`
- **THEN** Pass 5 (Critical-Path Scan) runs with elevated rigor; all other passes still execute

### Requirement: `--mark` flag is proposal-mode only

The system SHALL support a `--mark` flag that, after the review report is generated, writes `@review: <text>` markers into the relevant artifacts based on the findings; this flag is meaningful only in proposal mode.

#### Scenario: `--mark` enabled in proposal mode

- **WHEN** the command runs as `--as proposal --mark`
- **THEN** for each finding, a corresponding `@review: <finding text>` marker is inserted at the finding's file:line, enabling unified resolution via `/orbit:address-reviews`

#### Scenario: `--mark` ignored in system mode (v1)

- **WHEN** the command runs as `--as system --mark`
- **THEN** the flag is accepted but produces a note `--mark` writes to source files is v2; ignored for v1 system-mode runs

### Requirement: `--skip-verify` flag is system-mode only

The system SHALL support a `--skip-verify` flag in system mode to bypass Pass 0 when the user has already run `/orbit:verify` separately.

#### Scenario: `--skip-verify` flag in system mode

- **WHEN** the command runs as `--as system --skip-verify`
- **THEN** Pass 0 is skipped with a note "verify-change skipped per --skip-verify flag" and Passes 1–6 execute

#### Scenario: `--skip-verify` ignored in proposal mode

- **WHEN** the command runs as `--as proposal --skip-verify`
- **THEN** the flag is ignored (there is no Pass 0 in proposal mode); no error

### Requirement: `--fresh` runs pass work in a clean execution context

The system SHALL support a `--fresh` flag (both modes) that runs the main pass work in a fresh execution context (e.g., a clean-context subagent) rather than the invoking conversation — mitigating anchoring when the invoking context authored or extensively discussed the artifacts under review. Findings, scorecard rollup, and run-summary persistence are unchanged; `--fresh` affects only where pass work executes. This is the lighter-weight alternative the system-mode stock phrasings offer alongside `/orbit:review-external` (same model, fresh context, no cross-AI handoff).

#### Scenario: Fresh pass execution

- **WHEN** the command runs with `--fresh`
- **THEN** the passes execute in a clean context that did not author the artifacts under review; the report and run summary are produced identically to a non-fresh run, with `fresh: true` recorded in the run summary's `flags` object

### Requirement: Parallel execution via `--parallel`

The system SHALL support a `--parallel` flag that spawns subagents for heavy passes to run concurrently. Which passes are parallelized depends on mode.

#### Scenario: Proposal mode `--parallel`

- **WHEN** the command runs as `--as proposal --parallel`
- **THEN** Passes 2 (Internal Coherence), 4 (Archive Consistency), and 6 (Gap Hunt) execute concurrently in separate subagents and their findings are merged into the unified report

#### Scenario: System mode `--parallel`

- **WHEN** the command runs as `--as system --parallel`
- **THEN** Passes 2, 3, 4, and 5 execute concurrently in separate subagents and their findings are merged into the unified report

### Requirement: Pushback discipline on stale findings

The system SHALL verify each finding against current state before reporting it, regardless of mode.

#### Scenario: Stale finding suppressed

- **WHEN** an internal pass would produce a finding for an issue already resolved in current state (verified via `grep`, `git log`, or file inspection)
- **THEN** the finding is suppressed with an explanatory note ("stale finding suppressed: <evidence>") and not included in the user-facing report

### Requirement: Internal run summary persisted per mode

The system SHALL write a JSON run summary to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` after each invocation, where `<mode>` is `proposal` or `system`.

#### Scenario: Summary written after run

- **WHEN** the command completes
- **THEN** a JSON file is created at `.orbit-runs/review-<mode>-<ISO-timestamp>.json` containing the command name, timestamp, change name, mode, iteration number, findings summary (counts by severity and by pass), and a `findings[]` array of full per-finding entries (severity / title / file / line / recommendation, plus `recommendation_options` when disjunctive) per the skill's `references/run-summary-schema.md` — the shape `/orbit:address-reviews` maps to virtual markers on ingest

### Requirement: Iteration note when prior runs exist

The system SHALL include a one-sentence iteration note in the report when prior run summaries exist for the same change and mode.

#### Scenario: Subsequent run on same change in same mode

- **WHEN** the command runs and `.orbit-runs/` contains at least one prior `review-<mode>-<TS>.json` matching the current mode
- **THEN** the report includes a note such as "Note: N of these findings appeared in the last run on <date>. M new this run."

#### Scenario: First run for a mode on a change

- **WHEN** the command runs and `.orbit-runs/` contains no prior `review-<mode>-<TS>.json` matching the current mode
- **THEN** the report omits the iteration note, or notes "First proposal-mode run for this change." / "First system-mode run for this change."

### Requirement: Graceful degradation on missing inputs

The system SHALL degrade gracefully when expected inputs are absent.

#### Scenario: No `orbit/specs/` baseline (proposal mode)

- **WHEN** Pass 4 (Archive Consistency) would run in proposal mode but `orbit/specs/` is empty
- **THEN** Pass 4 is skipped with a note "no baseline to check against" and other passes proceed normally

#### Scenario: No `orbit/lenses/` (system mode)

- **WHEN** Passes 4 or 5 would run in system mode but `orbit/lenses/` is empty or absent
- **THEN** the affected passes skip with a note; Pass 3 (Surface Walk) still runs against capabilities derived from `orbit/specs/`

#### Scenario: No project context docs (proposal mode)

- **WHEN** Pass 3 (Cross-Doc Coherence) would run in proposal mode but `CLAUDE.md` / `project.md` / `*_convention.md` are absent
- **THEN** lens-driven cross-checks within Pass 3 are skipped with a note; the rest of Pass 3 runs normally

### Requirement: Optional `recommendation_options` field on finding entries

The system SHALL emit findings whose `recommendation` is genuinely disjunctive — offering the user a choice between two or more concrete alternatives — with an additional optional structured field `recommendation_options: [{label, body}]` alongside the existing prose `recommendation` field. This field exists as a producer-side affordance for the address-reviews consumer's structured decision-fork detection path (per `orbit-address-reviews` `Disjunctive recommendation fields surface as decision forks`).

**Field shape** (when present on a finding entry):

```
recommendation_options: [
  { "label": "A", "body": "<concrete option 1 text>" },
  { "label": "B", "body": "<concrete option 2 text>" },
  ...
]
```

- `label`: short identifier (typically `"A"`, `"B"`, `"C"`, …, or `"1"`, `"2"`, `"3"`, …).
- `body`: the concrete option text (the action the user would take if they pick this option).
- Array MUST contain ≥ 2 entries when present (single-option arrays defeat the purpose; the regular `recommendation` field carries single recommendations).

**When to emit** (normative — applies to all 9 proposal-mode passes + 7 system-mode passes; pass-specific behavior is enumerated in scenarios below where helpful):

- Emit `recommendation_options` when the finding's recommendation genuinely requires a choice — multiple defensible paths, each producing a different outcome (e.g., "file a follow-up issue" vs. "extend the current change's scope").
- Do NOT emit `recommendation_options` for findings with a single concrete action ("rename X to Y", "remove the duplicate scenario") — those use the prose `recommendation` field alone.
- The prose `recommendation` field SHALL still summarize the disjunction for readers of the markdown report (e.g., "Either (A) file a follow-up issue, or (B) extend scope to tasks.md"). The structured field complements the prose; it does not replace it.

**Backward compatibility**: the `recommendation_options` field is OPTIONAL on every finding. Findings without disjunctive recommendations omit it. Existing parsers that don't recognize the field SHALL ignore it (forward-compatible by design).

#### Scenario: Disjunctive finding emits both recommendation prose and structured options

- **WHEN** a proposal-mode pass identifies a finding where the recommendation is "Either file a follow-up issue tracking the v2 polish work, OR add Group 19 to tasks.md extending this change's scope to cover the missing scenarios"
- **THEN** the finding's JSON entry contains both: (a) `recommendation`: the prose summary string with "Either … or …" phrasing; (b) `recommendation_options`: `[{label: "A", body: "file a follow-up issue tracking the v2 polish work"}, {label: "B", body: "add Group 19 to tasks.md extending this change's scope to cover the missing scenarios"}]`

#### Scenario: Single-recommendation finding omits structured options

- **WHEN** a system-mode pass identifies a finding whose recommendation is a single concrete action (e.g., "Rename `ReviewMode` to `ReviewModeConfig` consistently across all callers")
- **THEN** the finding's JSON entry contains the prose `recommendation` field but does NOT include `recommendation_options`

#### Scenario: Three-way option fork emitted with three entries

- **WHEN** a pass identifies a finding offering three distinct paths (e.g., "(A) rewrite the assertion, (B) skip the test, (C) file an issue and document the skip rationale")
- **THEN** the `recommendation_options` array contains three entries with labels "A", "B", "C" and the corresponding option bodies

#### Scenario: Address-reviews structured-path detection uses recommendation_options

- **WHEN** address-reviews ingests a `review-<mode>-<TS>.json` produced by this command and one of its findings includes `recommendation_options`
- **THEN** address-reviews surfaces the structured options directly (without re-parsing the prose `recommendation` field via heuristic), per `orbit-address-reviews` `Disjunctive recommendation fields surface as decision forks`

#### Scenario: Field is forward-compatible — old parsers ignore it cleanly

- **WHEN** a downstream parser (e.g., a hypothetical older `address-reviews` or a downstream status reader) reads a review JSON containing `recommendation_options`
- **THEN** the parser MUST treat the field as ignorable (parsers SHOULD NOT fail on unknown fields per JSON forward-compat conventions); the parser's behavior on the finding's other fields is unchanged

#### Scenario: Producer-side enforcement — minimum 2 entries when field is present

- **WHEN** an editorial pass would emit a finding with `recommendation_options` containing fewer than 2 entries (zero or one)
- **THEN** the producer SHALL EITHER (a) omit the field entirely (preferred — single-recommendation findings use the prose `recommendation` field alone) OR (b) refuse to emit and surface a writer-side warning. Producing a JSON with a 0- or 1-entry `recommendation_options` array is a producer bug; downstream consumers handle it via fallback (per `orbit-address-reviews` `Disjunctive recommendation fields surface as decision forks` malformed-array scenario), but emit-time should not produce such arrays in the first place.

#### Scenario: Producer-side enforcement — every entry has required label and body fields

- **WHEN** an editorial pass would emit a finding with `recommendation_options` where any entry is missing the required `label` or `body` field, or either field is an empty string
- **THEN** the producer SHALL EITHER (a) populate the missing/empty field with a meaningful value OR (b) drop the malformed entry (re-check the ≥ 2-entry rule afterward) OR (c) refuse to emit. The structured field's contract is "every entry has non-empty label AND non-empty body"; emitting malformed entries is a producer bug.

