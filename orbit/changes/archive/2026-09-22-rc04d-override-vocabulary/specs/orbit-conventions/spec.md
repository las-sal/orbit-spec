## MODIFIED Requirements

### Requirement: Review mode decision framework

The system SHALL codify the decision criteria for choosing among orbit's three reviewer classes (in-context, fresh, external — the `--reviewer` axis on the merged `/orbit:review` surface, D-arc Stage D5; "mode" belongs to `--as proposal|system|architecture`). This is the normative-force complement to README's "Choosing a review mode" section, which documents the same framework as user-facing guidance. The framework exists because empirical evidence (notably `bootstrap-orbit-status-cli`'s 3-of-3 finding — in-context system review missed all 3 real implementation bugs that external review caught) demonstrates that mode choice materially affects review-finding completeness. As of C1 the framework's recommendations are BACKED BY the engine's `reviewed` gates (per `orbit-engine-gates`): the gate computes convergence and surfaces the canonical next mode, but enforcement is apply-parity — the gate surfaces and records, never hard-blocks. The framework remains advisory in the sense that the user can always proceed past an unpassed gate at the inflection prompt (the override is recorded); it is no longer purely advisory in the sense that the recommendation is now an engine-computed gate state rather than free-form prose.

The three classes:

1. **In-context** (default `/orbit:review`) — the current AI session does the review against its accumulated context. Fast iteration; low cross-AI cost. Anchoring risk: AI may be biased toward confirming work it has visibility into.
2. **Fresh internal subagent** (`/orbit:review --reviewer fresh`; `--fresh` remains as shorthand — D-arc Stage D5) — spawns a fresh subagent within the same Claude process. Loses session-level anchoring; same model architecture so model-level biases remain. Middle-ground between in-context and external.
3. **External** (`/orbit:review --reviewer external` — D-arc Stage D5's merge; the standalone launcher is retired, record vocabulary frozen per `orbit-review-external`) — packages a self-contained prompt for a different AI session (different model + different chat + completely separate context). Maximum independence; cross-AI round-trip cost. Best for substantive changes + code-vs-spec verification.

#### Scenario: In-context default for first-pass review with low anchoring risk

- **WHEN** the user invokes `/orbit:review` for the first review pass of a change AND no design ambiguity has been flagged AND the change is small (e.g., docs-only, single-file, or otherwise low-stakes)
- **THEN** in-context (the default) is the appropriate mode; session-level anchoring is an asset (the AI knows the context) rather than a liability; cross-AI cost is unnecessary. The framework does NOT require `--fresh` or external for low-stakes first passes. The `spec-driven` cadence still prescribes an independent pass before the gate converges, but apply-parity means a low-stakes change can proceed past the unpassed gate via the recorded inflection-prompt override.

#### Scenario: `--fresh` for anchoring-break in multi-iteration cases

- **WHEN** the same in-context AI session has reviewed an artifact 2+ times AND the user wants to verify convergence without paying cross-AI round-trip cost
- **THEN** `/orbit:review --fresh` is the appropriate mode. The fresh subagent loses the iter-1 + iter-2 in-session anchoring while preserving same-model semantics; it confirms that the multi-iteration in-context reviews didn't accumulate blind spots. Use `--fresh` as a lighter alternative to external when same-model coverage is acceptable.

#### Scenario: External for system-mode + substantive cross-AI verification

- **WHEN** running system-mode review (verifying code-vs-spec coherence where the AI may have authored the code in a recent session — high anchoring risk per `bootstrap-orbit-status-cli` evidence) OR the change is substantive enough that cross-AI cross-check pays for itself (e.g., breaking changes, security-sensitive code, multi-capability changes)
- **THEN** `/orbit:review --reviewer external` is the appropriate mode. The cross-AI round-trip cost is justified by the independence — a different model + different session has no anchoring to the code the original AI wrote. The `review-system` cadence's external slot encodes this default (per `orbit-engine-gates`), and the engine-rendered report tail surfaces the resulting canonical next command (per `orbit-report-rendering` — D-arc Stage D4). In C1+ this recommendation is realized as the `review-system` gate (per `orbit-engine-gates`), whose `external` cadence slot must be covered for convergence; the gate surfaces the canonical next command but NEVER hard-blocks — the user may proceed past it at the archive inflection prompt, and the override is recorded. The recommendation is gate-surfaced, not gate-enforced.

#### Scenario: Framework is documented in README + spec; drift between the two is caught

- **WHEN** the README's "Choosing a review mode" section drifts from this requirement's normative criteria (e.g., README claims `--fresh` is appropriate for X but the spec scenarios don't reflect that)
- **THEN** `/orbit:audit-drift` Category 3 (cross-doc consistency) SHALL surface the drift on next run; orbit's docs and spec stay aligned via the audit-drift discipline rather than ad-hoc reconciliation.

#### Scenario: Framework guidance is gate-surfaced, never gate-enforced

- **WHEN** a change is "substantial" by the README's guidance (would benefit from external review per the framework) BUT the user chooses to archive without running external
- **THEN** orbit's archive flow proceeds via the inflection-prompt override (per `orbit-engine-gates`): the `review-system` gate computes as unpassed and the archive flow fires the address / proceed-anyway / abort prompt; choosing proceed records the override in the archive run summary. The gate NEVER refuses the archive — apply-parity enforcement. orbit's role is to surface the engine-computed recommendation and record the override, not to refuse archive of changes that skip the recommendation.
