## MODIFIED Requirements

### Requirement: Emit-layer wraps upstream skills without modifying them

The emit-layer SHALL be implemented as a wrapper that runs after a command completes, inspects the command's output (artifact state, return codes, tasks state), and writes the JSON. The emit layer itself SHALL NOT change what the command it wraps does. Whether and how the upstream-authored portion of an orbit-modified body changes is owned by `orbit-conventions`' `Generated-file disposition`, which this requirement names and does not restate.

Specifically:

- The emit layer SHALL NOT give `/orbit:verify` marker-dropping, spec-edit shortcuts, or other behaviors that change what verify itself does. The recommendation-classification logic for verify-fail modes (per `Requirement: Verify fail-mode recommendations`) lives in the emit-layer, not in verify.
- The emit layer SHALL NOT give `/orbit:apply` task-ordering changes, parallel-task execution, or other behaviors that change what apply itself does. The chunk-end emit logic (per `Requirement: Apply per-chunk-end emission`) lives in the emit-layer, not in apply.
- Where orbit modifies an upstream skill via the `# Orbit additions` pattern (the orbit-modified workflows per `orbit-conventions`'s `Generated-file disposition` requirement), the emit-layer instructions MAY be added to those `# Orbit additions` sections, and only there.

#### Scenario: A cherry-picked verify body keeps the emit layer's additions
- **WHEN** a deliberate engine upgrade cherry-picks a newer upstream `verify-change` body into orbit's bundled template
- **THEN** the upstream-authored portion is handled as `orbit-conventions`' `Generated-file disposition` says, re-applying each named edit, while the `# Orbit additions` section (including any emit-layer instructions) carries over unchanged; the emit-layer never silently overrides upstream verify behavior

#### Scenario: emit-layer does not modify task-checking
- **WHEN** `/orbit:apply` runs and checks off tasks per upstream behavior
- **THEN** the task-checking algorithm is identical to upstream; only the side-effect of writing `apply-<TS>.json` is new

### Requirement: Verify fail-mode recommendations

When standalone `/orbit:verify <name>` fails, the emit-layer SHALL classify the failure mode based on verify-change's output and write `next_recommended` accordingly:

- **Mode ① (tasks-incomplete)**: tasks.md has unchecked items → `"/orbit:apply <name> — N tasks remain unchecked; complete implementation before re-verifying"`
- **Mode ② (impl-vs-spec gap)**: tasks all checked but spec scenarios fail → `"/orbit:review --as system <name> — N spec scenarios fail against implementation; system review will surface findings in its scorecard for you to walk each as code fix or spec revision"`
- **Mode ③ (orbit-validate failure)**: `orbit validate` itself fails → `"Fix artifact validation errors: <validator message verbatim>"` (no leading orbit command; reason field carries the validator output)

When verify completes with warnings (passes but with non-blocking findings), the emit-layer SHALL write `next_recommended: "/orbit:review --as system <name> — verification passed with N warnings; system review recommended"`.

The classification SHALL happen in the emit-layer; the emit layer gives verify no marker-dropping or other behaviors (see `Requirement: Emit-layer wraps upstream skills without modifying them`), and what verify itself does is owned by its body under `orbit-conventions`' `Generated-file disposition`. The mode-② recommendation does NOT use `/orbit:review --as system --mark` because that flag is proposal-mode only and silently ignored in system mode (per `orbit-review/spec.md`'s `Requirement: --mark flag is proposal-mode only`). The user manually walks each system-review finding to decide code-vs-spec.

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
- **THEN** `verify-<TS>.json`'s `next_recommended` follows mode ③ (verbatim validator message), NOT mode ①; the user is directed to fix the spec validation error first, after which a re-run will surface the tasks-incomplete signal
