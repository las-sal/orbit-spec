## Review: golden-change --as proposal

Mode: proposal · Iteration: 2 · Reviewer: in-context · Depth: full · Pass genre: REVIEW
Trend: 0C/3W/2S → 1C/1W/1S (0 repeat, 3 new)

| Dimension    | Critical | Warning | Suggestion |
|--------------|----------|---------|------------|
| Completeness | 0        | 1       | 0          |
| Correctness  | 1        | 0       | 0          |
| Coherence    | 0        | 0       | 1          |

### Findings

#### CRITICAL
- [unreproduced] **orbit/changes/golden-change/specs/some-cap/spec.md:12** — Delta drops three baseline scenarios
  > The MODIFIED block must carry the full requirement.
  > 
  > ## CRITICAL
  > ---
  > ```
  > fenced content
  > ```
  > Re-copy the baseline block before editing.
  - (A) Re-copy the baseline requirement block and re-apply the edit
  - (B) Convert the delta to ADDED and leave the baseline untouched

#### WARNING
- **orbit/changes/golden-change/tasks.md:40** — Task 3.2 has no owning requirement
  > Add a spec requirement or drop the task.

#### SUGGESTION
- **orbit/changes/golden-change/design.md:8** — Vocabulary drift: 'gateway' vs 'surface'
  > Pick one term.

### Suppressed
- CLAUDE.md still lists the old count — grep shows the count already updated

### Commentary

> The pattern behind the findings is delta hygiene: both non-trivial items trace to hand-edited MODIFIED blocks.
> Probed the spec deltas hardest; code-level risk feels low.

---
Gate review-proposal: unpassed — pass 2026-07-25T10-00-00Z has unresolved substantive findings
Position: propose ✓ → review(proposal) unpassed → apply ready → review(system) blocked-by-gate → archive blocked-by-gate
Ready when you are: /orbit:address-reviews golden-change --from-file orbit/changes/golden-change/.orbit-runs/review-proposal-2026-07-25T10-00-00Z.json
