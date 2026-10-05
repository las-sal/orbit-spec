## MODIFIED Requirements

### Requirement: Review-external T0 multi-step recommendation

The external-review packaging branch (`/orbit:review --as <mode> --reviewer external`, D-arc Stage D5's merge — record vocabulary frozen per `orbit-review-external`) SHALL emit `review-external-<TS>.json` at T0 (when the prompt is packaged, before findings return from the external AI). The emit includes per-command extensions:

```
mode                  "proposal" | "system"
prompt_path           string   path to the just-written external-prompt-<mode>-<TS>.md
target                string|null   the named external AI (e.g., "codex", "gpt-5"), or null
awaiting_findings     bool     always true at T0
```

`next_recommended` SHALL be multi-step prose describing the USER ACTION ONLY, ending at the save step:

```
"Paste orbit/changes/<name>/.orbit-runs/external-prompt-<mode>-<TS>.md
 into the target AI, and save the response as
 orbit/changes/<name>/.orbit-runs/external-<mode>-<TS>.md"
```

It SHALL name no walk command. What follows the save is whatever the gate's canonical next computes once the return is saved (`orbit-engine-gates`) — never written into this record; when that next is a walk, it discovers the saved return with no path (`orbit-address-reviews`' `Address-reviews command available`). A walk command written into the record would be a one-half walk recorded as the next step.

A downstream status reader's best-effort parse will find no leading `/orbit:<verb>` (because the string leads with "Paste"); `command` and `args` are left null, and the full verbatim string is surfaced in `reason`. This is the expected behavior — multi-step user actions are accurately represented as prose, not collapsed into a single command.

T1 (findings returned and walked, by discovery or by `--from-file`) is the existing `/orbit:address-reviews` emit and is unaffected by this requirement.

#### Scenario: Review-external T0 emit has awaiting_findings=true
- **WHEN** `/orbit:review foo --as proposal --reviewer external` runs and packages the prompt
- **THEN** `review-external-<TS>.json` is written with `mode: "proposal"`, `awaiting_findings: true`, `prompt_path` pointing at the just-written `external-prompt-proposal-<TS>.md`

#### Scenario: Review-external T0 recommendation is prose-only
- **WHEN** a downstream status reader reads the review-external T0 JSON and best-effort parses `next_recommended`
- **THEN** no leading slash command is found; `command` and `args` are null; the full multi-step instruction is preserved verbatim in `reason`

#### Scenario: A clean return is not followed by a walk

- **WHEN** the T0 emit packages an external whose return, once saved, will complete a clean blind pair (no substantive findings on either half) on a cadence that still owes an in-context slot
- **THEN** the T0 record's `next_recommended` names the paste and save steps and no walk, and the eligibility line read after the return is saved names the in-context review, not a walk

#### Scenario: The T0 recommendation names no walk

- **WHEN** `/orbit:review foo --as system --reviewer external` packages its prompt
- **THEN** the T0 emit's `next_recommended` ends at the `save the response as <path>` step and contains no `/orbit:address-reviews`

### Requirement: Audit-drift standalone recommendations

Standalone `/orbit:audit-drift` emits `audit-drift-<TS>.json`, and THIS requirement owns that emit's payload: the `orbit-audit-drift` skill's `references/run-summary-schema.md` (shipped alongside the generated skill) MIRRORS it, never defines it, per `orbit-emit-composition`'s `Payload tables agree with their schema references`. The emit SHALL include the universal spine from `orbit-conventions`'s `Internal-run JSON summary format` (with `kind: "editorial"`). The emit-layer recognizes TWO standalone invocation modes — **change-scoped** (`/orbit:audit-drift <name>`) and **project-wide** (`/orbit:audit-drift` with no argument) — each with distinct emit path, `change` value, and recommendation logic:

**Change-scoped standalone** (`/orbit:audit-drift <name>`):
- Emit path: `orbit/changes/<name>/.orbit-runs/audit-drift-<TS>.json`
- `change` field: the change name
- `next_recommended` on findings: `"/orbit:address-reviews <name> — N drift(s) detected; resolve before next workflow step"`. The `--from-file <this-json>` argument is NOT required: a change-scoped walk discovers every `audit-drift-*.json` no resolution log names, per `orbit-address-reviews`' `Address-reviews command available`, so the just-written emit is discovered with no path.
- `next_recommended` on clean (zero findings): copy from the most recent prior `.orbit-runs/*.json` for the same change, excluding the just-written audit-drift JSON itself. `final_assessment` SHALL note "drift check clean; deferring to prior workflow state."

**Project-wide standalone** (`/orbit:audit-drift` with no argument):
- Emit path: `orbit/.orbit-runs/audit-drift-<TS>.json` (create the directory if it doesn't exist)
- `change` field: `null` (no change scope)
- `next_recommended` on findings: `"/orbit:address-reviews --from-file <this-json> — N drift(s) detected project-wide; resolve before next workflow step"`. The `--from-file <path>` argument IS required here: project-wide audit-drift writes to `orbit/.orbit-runs/`, which no change-scoped walk reads, so `orbit-address-reviews`' discovery never reaches it.
- `next_recommended` on clean (zero findings): `"No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift."` (no prior-workflow defer because project-wide audit-drift has no per-change workflow narrative to defer to). `final_assessment` SHALL note "project-wide drift check clean."

(Historical note: `--from-file <this-json>` was historically required for the change-scoped recommendation because earlier versions of `/orbit:address-reviews` did not discover internal JSON. Change-scoped walks now discover it, so the argument is dropped there; project-wide emits still need it, because no change-scoped walk reads `orbit/.orbit-runs/`.)

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
- **THEN** `orbit/changes/foo/.orbit-runs/audit-drift-<TS>.json` is written with `change: "foo"`, `findings_total: 3`, and `next_recommended` beginning with `"/orbit:address-reviews foo —"` (no `--from-file` argument; a change-scoped walk discovers the just-written audit-drift JSON because no resolution log names it yet)

#### Scenario: Change-scoped clean audit-drift defers to prior workflow recommendation

- **WHEN** `/orbit:audit-drift foo` runs and detects 0 drifts, and the prior latest `.orbit-runs/*.json` for `foo` is `apply-2026-05-21T10-00-00Z.json` with `next_recommended: "/orbit:apply foo — chunk 3 of 5 done"`
- **THEN** the new `audit-drift-<TS>.json` has `findings_total: 0` and `next_recommended` equal to the verbatim string `"/orbit:apply foo — chunk 3 of 5 done"`, and `final_assessment` notes drift-check-clean + deferral

#### Scenario: Project-wide standalone audit-drift with findings

- **WHEN** `/orbit:audit-drift` runs with no change argument and detects 2 project-wide drifts
- **THEN** `orbit/.orbit-runs/audit-drift-<TS>.json` is written with `change: null`, `findings_total: 2`, and `next_recommended` beginning with `"/orbit:address-reviews --from-file"` (still requires `--from-file`, because no change-scoped walk reads `orbit/.orbit-runs/`)

#### Scenario: Project-wide clean audit-drift (no prior workflow to defer to)

- **WHEN** `/orbit:audit-drift` runs with no change argument and detects 0 drifts
- **THEN** `orbit/.orbit-runs/audit-drift-<TS>.json` is written with `change: null`, `findings_total: 0`, and `next_recommended` reads `"No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift."`

#### Scenario: Inline audit-drift during archive unchanged

- **WHEN** `/orbit:archive foo` runs and the inline audit-drift step produces findings
- **THEN** the findings are captured in `archive-<TS>.json` per existing archive emit behavior; no separate `audit-drift-<TS>.json` is written for the inline pass

#### Scenario: The payload is the owner's shape

- **WHEN** a standalone audit-drift payload carries `categories_run: ["1", "3", "4"]`, `findings`, `stale_suppressed` and `final_assessment`
- **THEN** the write gate accepts it; the same payload with `context`, `depth`, `flags`, `categories_skipped` or `findings_summary` added is refused naming the field
