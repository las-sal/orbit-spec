## MODIFIED Requirements

### Requirement: Reviewer-class field on review-cycle emits

Review-cycle emits SHALL carry a first-class `reviewer_class` field identifying the execution context that produced the pass: `"in-context"` (the authoring conversation), `"fresh"` (a clean-context execution, e.g. `--fresh`), or `"external"` (a different AI via the review-external handoff). The field appears on `review-<mode>-<TS>.json` emits and on `review-external-<TS>.json` T0 emits (where it is `"external"` by definition, describing the packaged-but-not-yet-returned handoff). The field exists so the engine's reviewed-gate convergence computation (per `orbit-engine-gates`) can count class coverage from the audit trail without inference.

A `review-external-<TS>.json` T0 emit is a PACKAGING record, NOT a completed pass: it carries `awaiting_findings: true`. For class-coverage purposes an `external` pass exists ONLY when an `external-<as>-<TS>.md` findings file exists in `.orbit-runs/`; a T0 emit with `awaiting_findings: true` SHALL NEVER satisfy external class coverage, so a packaged-but-never-returned external cannot converge a `reviewed` gate. Its `reviewer_class: "external"` describes the intended handoff class for audit readability, not a counted pass.

#### Scenario: Review emit records its reviewer class

- **WHEN** `/orbit:review` completes and persists `review-<mode>-<TS>.json`
- **THEN** the JSON includes `reviewer_class`: `"fresh"` when the pass work ran in a clean execution context (`--fresh`), otherwise `"in-context"`

#### Scenario: Externally-sourced findings are classed external

- **WHEN** the engine computes class coverage and encounters an `external-<as>-<TS>.md` findings file
- **THEN** that pass counts as `reviewer_class: "external"` (the markdown's `**Reviewer**:` line carries the specific model; the class is structural)

#### Scenario: Packaged-but-unreturned external is not class coverage

- **WHEN** a `review-external-<TS>.json` T0 emit exists with `awaiting_findings: true` but no corresponding `external-<as>-<TS>.md` findings file has landed
- **THEN** the engine counts NO external pass for class coverage; whichever cadence slot the external return would satisfy (a bare `external` slot, an `independent` slot, or the external half of a `blind-pair`) stays unsatisfied and the gate remains unpassed, with the canonical next command being whatever `orbit-engine-gates`' single-voiced requirement computes for that uncovered slot — the external return when the slot is `external` or `independent` or a pairable partner already stands, and the fresh invocation when the uncovered slot is a `blind-pair` with no pairable pass standing (a T0 packaging emit is not a pass)

#### Scenario: Legacy emits without the field degrade to inference

- **WHEN** the engine reads an emit that predates this field
- **THEN** the class is inferred — `flags.fresh: true` → `"fresh"`; `external-*.md` provenance → `"external"`; otherwise `"in-context"` — and the absence of the field never breaks gate computation

### Requirement: Verify pass recommendation

When standalone `/orbit:verify <name>` passes (verify-change reports no failures), the emit-layer SHALL write `verify-<TS>.json` with `next_recommended`:

```
"/orbit:review --as system <name> — verification clean; formal pre-archive
 review recommended (or /orbit:archive <name> if you're skipping the
 editorial pass)"
```

The leading token is the GATE GRAPH's canonical system-review command, read from the graph rather
than composed here (rc02): under a cadence whose first uncovered system slot is `blind-pair` it
carries the class qualifier the graph computes — `/orbit:review --as system --fresh <name>` — and
under a cadence whose first uncovered slot is `in-context` it is the bare `/orbit:review --as system
<name>`. A hardcoded form is PROHIBITED, because a literal goes stale the moment a cadence changes
and would then name a class satisfying no slot. A downstream status reader extracts the leading
invocation into `command`/`args`; the class qualifier travels in `args` alongside the change name. The alternative `/orbit:archive <name>` path lives in the reason text and is surfaced to the user via the reader's `reason` field.

#### Scenario: Verify pass emit recommends review-as-system canonically
- **WHEN** `/orbit:verify foo` passes
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with the gate graph's canonical system-review invocation for that change — `"/orbit:review --as system --fresh foo"` under `spec-driven` v4, whose first uncovered system slot is `blind-pair` — and the reason text mentions `/orbit:archive foo` as alternative

#### Scenario: Status reader parses verify-pass recommendation
- **WHEN** a downstream status reader reads the verify-pass JSON and best-effort parses
- **THEN** `command` is `"/orbit:review --as system"`, `args` carries the class qualifier and the change name as the graph composed them, `reason` is the full verbatim string
