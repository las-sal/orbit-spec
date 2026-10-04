## MODIFIED Requirements

### Requirement: Audit-drift standalone recommendations

Standalone `/orbit:audit-drift` emits `audit-drift-<TS>.json`, and THIS requirement owns that emit's payload: the `orbit-audit-drift` skill's `references/run-summary-schema.md` (shipped alongside the generated skill) MIRRORS it, never defines it, per `orbit-emit-composition`'s `Payload tables agree with their schema references`. The emit SHALL include the universal spine from `orbit-conventions`'s `Internal-run JSON summary format` (with `kind: "editorial"`). The emit-layer recognizes TWO standalone invocation modes — **change-scoped** (`/orbit:audit-drift <name>`) and **project-wide** (`/orbit:audit-drift` with no argument) — each with distinct emit path, `change` value, and recommendation logic:

**Change-scoped standalone** (`/orbit:audit-drift <name>`):
- Emit path: `orbit/changes/<name>/.orbit-runs/audit-drift-<TS>.json`
- `change` field: the change name
- `next_recommended` on findings: `"/orbit:address-reviews <name> — N drift(s) detected; resolve before next workflow step"`. The `--from-file <this-json>` argument is NOT required: `/orbit:address-reviews` auto-discovers the most-recent `audit-drift-*.json` in the change's `.orbit-runs/` per the orbit-address-reviews `Address-reviews command available` requirement's auto-discovery fallback. Address-reviews picks the audit-drift JSON via the recency rule (single global most-recent across `review-<mode>-*.json` + `audit-drift-*.json`); the just-written `audit-drift-<TS>.json` will be the most recent at recommendation-emit time, so auto-discovery resolves to it cleanly.
- `next_recommended` on clean (zero findings): copy from the most recent prior `.orbit-runs/*.json` for the same change, excluding the just-written audit-drift JSON itself. `final_assessment` SHALL note "drift check clean; deferring to prior workflow state."

**Project-wide standalone** (`/orbit:audit-drift` with no argument):
- Emit path: `orbit/.orbit-runs/audit-drift-<TS>.json` (create the directory if it doesn't exist)
- `change` field: `null` (no change scope)
- `next_recommended` on findings: `"/orbit:address-reviews --from-file <this-json> — N drift(s) detected project-wide; resolve before next workflow step"`. The `--from-file <path>` argument IS required here: project-wide audit-drift has no change-directory anchor for `.orbit-runs/` lookup, so auto-discovery does NOT apply per the orbit-address-reviews spec's positional-resolution algorithm (no positional → bare invocation → grep-only; bare invocation skips auto-discovery).
- `next_recommended` on clean (zero findings): `"No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift."` (no prior-workflow defer because project-wide audit-drift has no per-change workflow narrative to defer to). `final_assessment` SHALL note "project-wide drift check clean."

(Historical note: `--from-file <this-json>` was historically required for the change-scoped recommendation because earlier versions of `/orbit:address-reviews` did not auto-discover internal JSON. Now that auto-discovery handles change-scoped invocations, the `--from-file` argument is dropped for change-scoped recommendations to give users the cleaner 2-command workflow. Project-wide invocations still require explicit `--from-file` because they have no change-directory anchor.)

Per-command extensions for audit-drift SHALL include:

```
categories_run        array    category-id strings, "1".."6" — the categories that ran; skip reasons belong in the report body
findings              array    the finding entries, each carrying its own `category`, `severity`, `file`, `line`, `title`, `recommendation`, optional `recommendation_options`
stale_suppressed      array    suppressed-finding entries ({category, title, evidence})
findings_total        int      ENGINE-COMPUTED, refused in the payload — per orbit-emit-composition's `Audit-drift counts are engine-computed`
findings_by_category  object   ENGINE-COMPUTED, refused in the payload — per the same requirement
```

No other per-command extension is part of the payload; the write gate refuses any field outside the engine's audit-drift payload table.

This requirement applies only to **standalone** `/orbit:audit-drift` invocations (both change-scoped and project-wide). Inline audit-drift during `/orbit:archive` is captured in `archive-<TS>.json` per the existing archive emit convention (unchanged).

#### Scenario: Change-scoped standalone audit-drift with findings recommends address-reviews

- **WHEN** `/orbit:audit-drift foo` runs and detects 3 drifts
- **THEN** `orbit/changes/foo/.orbit-runs/audit-drift-<TS>.json` is written with `change: "foo"`, `findings_total: 3`, and `next_recommended` beginning with `"/orbit:address-reviews foo —"` (no `--from-file` argument; auto-discovery picks up the just-written audit-drift JSON via the recency rule)

#### Scenario: Change-scoped clean audit-drift defers to prior workflow recommendation

- **WHEN** `/orbit:audit-drift foo` runs and detects 0 drifts, and the prior latest `.orbit-runs/*.json` for `foo` is `apply-2026-05-21T10-00-00Z.json` with `next_recommended: "/orbit:apply foo — chunk 3 of 5 done"`
- **THEN** the new `audit-drift-<TS>.json` has `findings_total: 0` and `next_recommended` equal to the verbatim string `"/orbit:apply foo — chunk 3 of 5 done"`, and `final_assessment` notes drift-check-clean + deferral

#### Scenario: Project-wide standalone audit-drift with findings

- **WHEN** `/orbit:audit-drift` runs with no change argument and detects 2 project-wide drifts
- **THEN** `orbit/.orbit-runs/audit-drift-<TS>.json` is written with `change: null`, `findings_total: 2`, and `next_recommended` beginning with `"/orbit:address-reviews --from-file"` (still requires `--from-file` because project-wide invocations have no change-directory anchor; auto-discovery does not apply to bare `/orbit:address-reviews` invocations)

#### Scenario: Project-wide clean audit-drift (no prior workflow to defer to)

- **WHEN** `/orbit:audit-drift` runs with no change argument and detects 0 drifts
- **THEN** `orbit/.orbit-runs/audit-drift-<TS>.json` is written with `change: null`, `findings_total: 0`, and `next_recommended` reads `"No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift."`

#### Scenario: Inline audit-drift during archive unchanged

- **WHEN** `/orbit:archive foo` runs and the inline audit-drift step produces findings
- **THEN** the findings are captured in `archive-<TS>.json` per existing archive emit behavior; no separate `audit-drift-<TS>.json` is written for the inline pass

#### Scenario: The payload is the owner's shape

- **WHEN** a standalone audit-drift payload carries `categories_run: ["1", "3", "4"]`, `findings`, `stale_suppressed` and `final_assessment`
- **THEN** the write gate accepts it; the same payload with `context`, `depth`, `flags`, `categories_skipped` or `findings_summary` added is refused naming the field
