## MODIFIED Requirements

### Requirement: Emit scope

The following orbit commands SHALL emit `orbit/changes/<name>/.orbit-runs/<command>-<TS>.json` (or `orbit/explore/<name>/.orbit-runs/<command>-<TS>.json` for explore, or `orbit/architecture/.orbit-runs/<command>-<TS>.json` for architecture-scoped commands) when invoked — COMPOSED AND WRITTEN VIA THE ENGINE EMIT SURFACE (`orbit emit <command>` per `orbit-emit-composition`, D-arc Stage D5): generated bodies instruct the surface with a narrative-only payload and never hand-compose the JSON (hand-composition is the retired practice; pre-capability emits on the trail are historical records, readers tolerate both generations). This requirement covers two categories:

- **New emit behavior** (commands that don't emit any run-summary JSON today):
  - Workflow commands: `/orbit:explore` (named mode only — bare mode does NOT emit; named mode emits at BEGIN as well as at boundaries, per `Emit timing semantics` — D-arc Stage D3), `/orbit:propose`, `/orbit:new`, `/orbit:continue`, `/orbit:ff`, `/orbit:apply`, `/orbit:verify`, `/orbit:architect` (D-arc Stage D2; emits to the architecture trail with `change: null` + a `doc` field, shape owned by `orbit-architect`)
  - The external-review packaging branch at T0 (when the prompt is packaged, before findings return — the `command: "review-external"` emit, invoked via `/orbit:review --reviewer external` per D-arc Stage D5's merge; record vocabulary frozen)
- **Refined existing emit** (already emits today; this change refines the recommendation logic and aligns with the universal spine from orbit-conventions):
  - Standalone `/orbit:audit-drift` (schema documented in the `orbit-audit-drift` skill's `references/run-summary-schema.md`, shipped alongside the generated skill)

The following commands SHALL NOT emit additional JSONs as part of this change:

- `/orbit:bulk-archive` — wrapper; each inner `/orbit:archive` invocation emits separately
- `/orbit:onboard` — meta walkthrough; no change-state transition
- `/orbit:sync` (the `orbit-sync-specs` skill) — upstream primitive whose upstream portion orbit does not edit (per `orbit-conventions`' `Generated-file disposition`); no emit behavior is added to it

Existing emit-producing commands (`/orbit:review`, `/orbit:address-reviews`, `/orbit:archive`, inline `/orbit:audit-drift` during archive) continue emitting as today — through the emit surface; `/orbit:review`'s architecture mode persists to the architecture trail per `orbit-review`'s per-mode persistence requirement — a location change for that mode, not a new emitter.

#### Scenario: Named-mode /orbit:explore writes explore JSON
- **WHEN** the user invokes `/orbit:explore foo` (named mode) and the session ends
- **THEN** the emit-layer writes `orbit/explore/foo/.orbit-runs/explore-<TS>.json` via `orbit emit explore`

#### Scenario: Named-mode explore BEGIN emit at scaffold (D-arc Stage D3)
- **WHEN** `/orbit:explore foo` creates the staging directory in Mode B (new named exploration)
- **THEN** the emit-layer writes a begin `explore-<TS>.json` immediately — `decisions_captured: 0`, `next_recommended: "/orbit:explore foo — continue capturing thinking"` (the maturity requirement's Early canonical string), the `final_assessment` recording the scaffold and the citation decision (cited or declined) — so the trail records the workstream's start (and any `premised → exploring` stage transition) and the orientation surface can anchor from minute zero

#### Scenario: Mode C crystallization BEGIN emit carries the back-filled state (D-arc Stage D3)
- **WHEN** a bare-mode exploration crystallizes to `foo` (Mode C: the user confirmed the crystallization warning; 2+ substantive decisions are back-filled into `explore.md` at creation)
- **THEN** the begin emit carries the BACK-FILLED counts (`decisions_captured` = the decisions written at creation, `open_questions_count` likewise) and a maturity-consistent `next_recommended` per the `Named-mode explore recommendation by maturity` requirement — the trail's first record states true on-disk state, never a knowingly-false zero; this begin emit IS the crystallization's first emit (see the modified crystallization requirement below); the counts are ENGINE-COMPUTED from the back-filled file by the emit surface

#### Scenario: /orbit:architect writes to the architecture trail
- **WHEN** an `/orbit:architect my-program` session reaches a conversation boundary
- **THEN** the emit-layer writes `orbit/architecture/.orbit-runs/architect-<TS>.json` with `change: null` and `doc: "my-program"`

#### Scenario: Bare-mode /orbit:explore writes no JSON
- **WHEN** the user invokes `/orbit:explore` without a name argument
- **THEN** no `.orbit-runs/` JSON is written for that conversation

#### Scenario: /orbit:onboard does not emit
- **WHEN** the user invokes `/orbit:onboard` and completes the walkthrough
- **THEN** no `.orbit-runs/onboard-<TS>.json` is written anywhere in the project

#### Scenario: /orbit:bulk-archive relies on inner /orbit:archive emits
- **WHEN** the user invokes `/orbit:bulk-archive` to archive 3 changes
- **THEN** 3 `archive-<TS>.json` files are written (one per inner archive), and no `bulk-archive-<TS>.json` file is written

#### Scenario: Bodies instruct the surface, never hand-compose
- **WHEN** any generated body reaches its emit step
- **THEN** the body's instruction is to compose the narrative payload and invoke `orbit emit <command>` — no generated body contains JSON-shape prose for the spine, timestamp/collision rules, or deterministic-fact composition (those are engine-owned per `orbit-emit-composition`)

### Requirement: Emit-layer wraps upstream skills without modifying them

The emit-layer SHALL be implemented as a wrapper that runs after a command completes, inspects the command's output (artifact state, return codes, tasks state), and writes the JSON. The emit layer itself SHALL NOT change what the command it wraps does. Whether and how the upstream-authored portion of an orbit-modified body changes is owned by `orbit-conventions`' `Generated-file disposition`, which this requirement names and does not restate.

Specifically:

- The emit layer SHALL NOT give `/orbit:verify` marker-dropping, spec-edit shortcuts, or other behaviors that change what verify itself does. The fail-mode CLASSIFICATION (per `Requirement: Verify fail-mode recommendations`) is verify's own, stated in its `# Orbit additions`; the emit layer composes the recommendation from the mode verify hands it and classifies nothing.
- The emit layer SHALL NOT give `/orbit:apply` task-ordering changes, parallel-task execution, or other behaviors that change what apply itself does. The chunk-end emit logic (per `Requirement: Apply per-chunk-end emission`) lives in the emit-layer, not in apply.
- Where orbit modifies an upstream skill via the `# Orbit additions` pattern (the orbit-modified workflows per `orbit-conventions`'s `Generated-file disposition` requirement), the emit-layer instructions MAY be added to those `# Orbit additions` sections, and only there.

#### Scenario: A cherry-picked verify body keeps the emit layer's additions
- **WHEN** a deliberate engine upgrade cherry-picks a newer upstream `verify-change` body into orbit's bundled template
- **THEN** the upstream-authored portion is handled as `orbit-conventions`' `Generated-file disposition` says, re-applying each named edit, while the `# Orbit additions` section (including any emit-layer instructions) carries over unchanged; the emit-layer never silently overrides upstream verify behavior

#### Scenario: emit-layer does not modify task-checking
- **WHEN** `/orbit:apply` runs and checks off tasks per upstream behavior
- **THEN** the task-checking algorithm is identical to upstream; only the side-effect of writing `apply-<TS>.json` is new

### Requirement: Verify fail-mode recommendations

When standalone `/orbit:verify <name>` fails, verify SHALL classify the failure mode from its own findings and an `orbit validate <name>` run, by the precedence below, and hand it to the emit layer as `fail_mode`; the emit layer SHALL write `next_recommended` from that mode:

- **Mode ① (tasks-incomplete)**: tasks.md has unchecked items → `"/orbit:apply <name> — N tasks remain unchecked; complete implementation before re-verifying"`
- **Mode ② (impl-vs-spec gap)**: tasks all checked but spec scenarios fail → `"/orbit:review --as system <name> — N spec scenarios fail against implementation; system review will surface findings in its scorecard for you to walk each as code fix or spec revision"`
- **Mode ③ (orbit-validate failure)**: `orbit validate` itself fails → `"Fix artifact validation errors: <validator message verbatim>"` (no leading orbit command; reason field carries the validator output)

When verify completes with warnings (passes but with non-blocking findings), the emit-layer SHALL write `next_recommended: "/orbit:review --as system <name> — verification passed with N warnings; system review recommended"`.

The classification is verify's, stated in its body's `# Orbit additions`, where `orbit-conventions`' `Generated-file disposition` puts orbit behavior; the emit layer classifies nothing, composes from the mode it is handed, and gives verify no marker-dropping or other behaviors (see `Requirement: Emit-layer wraps upstream skills without modifying them`). The mode-② recommendation does NOT use `/orbit:review --as system --mark` because that flag is proposal-mode only and silently ignored in system mode (per `orbit-review/spec.md`'s `Requirement: --mark flag is proposal-mode only`). The user manually walks each system-review finding to decide code-vs-spec.

**Precedence when multiple fail signals fire simultaneously** (highest precedence first):

1. **Mode ③ (orbit-validate failure)** — if `orbit validate` itself errors, verify cannot meaningfully evaluate impl-vs-spec until the spec is fixable. Mode ③'s recommendation wins over modes ① and ②.
2. **Mode ① (tasks-incomplete)** — if tasks.md has unchecked items, evaluation is premature regardless of any impl-vs-spec signal. Mode ①'s recommendation wins over mode ②.
3. **Mode ② (impl-vs-spec gap)** — applies when modes ③ and ① are clean.
4. **Warn state** — applies on pass with warnings only when none of the failure modes fire.

This precedence directs the user to the root cause first: fix the spec (mode ③) → complete the implementation (mode ①) → resolve impl-vs-spec gaps (mode ②).

**Out of scope**: partial or aborted verify runs (e.g., verify timed out before classifying findings, transient validator failure). These are upstream verify-change concerns; the emit-layer SHALL emit whatever verify-change reports. If verify-change reports incomplete output, the emit-layer SHALL set `next_recommended` to `"Re-run /orbit:verify <name> — prior verify run incomplete (see verify-change output for details)"`.

#### Scenario: Mode-① fail recommends /orbit:apply
- **WHEN** `/orbit:verify foo` fails because tasks.md has unchecked items
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with `"/orbit:apply foo"` and mentions the count of remaining tasks

#### Scenario: Mode-② fail recommends /orbit:review --as system (without --mark)
- **WHEN** `/orbit:verify foo` fails because spec scenarios don't pass against the implementation
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with `"/orbit:review --as system foo"` (without `--mark` — that flag is proposal-mode only); reason text explains the user must walk each system-review finding as either a code fix or spec revision

#### Scenario: Mode-③ fail preserves verbatim validator message
- **WHEN** `/orbit:verify foo` fails because `orbit validate` itself errors (e.g., malformed spec frontmatter)
- **THEN** `verify-<TS>.json`'s `next_recommended` text begins with `"Fix artifact validation errors:"` and includes the validator's verbatim error message; a downstream status reader's parse finds no leading slash command and preserves the full text in `reason`

#### Scenario: Multiple fail signals — precedence ③ > ① > ②
- **WHEN** `/orbit:verify foo` reports BOTH unchecked tasks (mode ① signal) AND `orbit validate` errors (mode ③ signal) simultaneously
- **THEN** verify classifies the run as mode ③ and hands `fail_mode: "validator-error"` to the emit, so `verify-<TS>.json`'s `next_recommended` follows mode ③ (verbatim validator message), NOT mode ①; the user is directed to fix the spec validation error first, after which a re-run will surface the tasks-incomplete signal
