## MODIFIED Requirements

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

**When a review pass is outstanding, the walk leads.** When the gate graph's canonical next for the
change is the change-scoped walk, `/orbit:address-reviews <name>` (per `orbit-engine-gates`' `Single-voiced
canonical-next computation`), the leading token is that walk and the text is
`"/orbit:address-reviews <name> — verification clean; walk the outstanding review findings before the next review"`,
with no `/orbit:archive` alternative: verify never points at a review the gate's order puts after the walk.
Any other graph next that is not a system review — the archive command once the system gate has passed with
nothing outstanding — falls back to the bare `/orbit:review --as system <name>`.

#### Scenario: Verify pass emit recommends review-as-system canonically
- **WHEN** `/orbit:verify foo` passes
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with the gate graph's canonical system-review invocation for that change — `"/orbit:review --as system --fresh foo"` under `spec-driven` v4, whose first uncovered system slot is `blind-pair` — and the reason text mentions `/orbit:archive foo` as alternative

#### Scenario: A verify pass with a review pass outstanding leads with the walk
- **WHEN** `/orbit:verify foo` passes and the gate graph's canonical next is `/orbit:address-reviews foo`, the system gate unpassed or passed
- **THEN** `verify-<TS>.json`'s `next_recommended` is `"/orbit:address-reviews foo — verification clean; walk the outstanding review findings before the next review"` and names no `/orbit:archive`

#### Scenario: Status reader parses verify-pass recommendation
- **WHEN** a downstream status reader reads the verify-pass JSON and best-effort parses
- **THEN** `command` is `"/orbit:review --as system"`, `args` carries the class qualifier and the change name as the graph composed them, `reason` is the full verbatim string

### Requirement: Verify fail-mode recommendations

When standalone `/orbit:verify <name>` fails, verify SHALL classify the failure mode from its own findings and an `orbit validate <name>` run, by the precedence below, and hand it to the emit layer as `fail_mode`; the emit layer SHALL write `next_recommended` from that mode:

- **Mode ① (tasks-incomplete)**: tasks.md has unchecked items → `"/orbit:apply <name> — N tasks remain unchecked; complete implementation before re-verifying"`
- **Mode ② (impl-vs-spec gap)**: tasks all checked but spec scenarios fail → `"/orbit:review --as system <name> — N spec scenarios fail against implementation; system review will surface findings in its scorecard for you to walk each as code fix or spec revision"`
- **Mode ③ (orbit-validate failure)**: `orbit validate` itself fails → `"Fix artifact validation errors: <validator message verbatim>"` (no leading orbit command; reason field carries the validator output)

When verify completes with warnings (passes but with non-blocking findings), the emit-layer SHALL write `next_recommended: "/orbit:review --as system <name> — verification passed with N warnings; system review recommended"`.

The leading `/orbit:review --as system <name>` of mode ② and of the warn state is the gate graph's canonical
system-review command, as in `Verify pass recommendation`, and when that graph's next is the change-scoped walk
the walk leads by the same rule: mode ② reads `"/orbit:address-reviews <name> — N spec scenarios fail against
implementation; walk the outstanding review findings before the next review"` and the warn state
`"/orbit:address-reviews <name> — verification passed with N warnings; walk the outstanding review findings before
the next review"`.

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
- **WHEN** `/orbit:verify foo` fails because spec scenarios don't pass against the implementation, and no review pass is outstanding
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with `"/orbit:review --as system foo"` (without `--mark` — that flag is proposal-mode only); reason text explains the user must walk each system-review finding as either a code fix or spec revision

#### Scenario: Mode ② and the warn state lead with the walk when a review pass is outstanding
- **WHEN** `/orbit:verify foo` fails in mode ②, or passes with warnings, and the gate graph's canonical next is `/orbit:address-reviews foo`
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with `"/orbit:address-reviews foo — "` and ends `"walk the outstanding review findings before the next review"`

#### Scenario: Mode-③ fail preserves verbatim validator message
- **WHEN** `/orbit:verify foo` fails because `orbit validate` itself errors (e.g., malformed spec frontmatter)
- **THEN** `verify-<TS>.json`'s `next_recommended` text begins with `"Fix artifact validation errors:"` and includes the validator's verbatim error message; a downstream status reader's parse finds no leading slash command and preserves the full text in `reason`

#### Scenario: Multiple fail signals — precedence ③ > ① > ②
- **WHEN** `/orbit:verify foo` reports BOTH unchecked tasks (mode ① signal) AND `orbit validate` errors (mode ③ signal) simultaneously
- **THEN** verify classifies the run as mode ③ and hands `fail_mode: "validator-error"` to the emit, so `verify-<TS>.json`'s `next_recommended` follows mode ③ (verbatim validator message), NOT mode ①; the user is directed to fix the spec validation error first, after which a re-run will surface the tasks-incomplete signal

### Requirement: No forward-look at planned future behavior changes

Emit text SHALL recommend canonical command names without anticipating behavior changes planned in other (not-yet-landed) changes. Specifically:

- When a planned change inverts a command's default behavior (e.g., inverting `/orbit:review --as system`'s default to external/fresh-context reviewer mode), the emit text SHALL recommend `/orbit:review --as system` without qualifiers like "external recommended" or "fresh-context preferred"
- When a planned change adds a flag or sub-behavior, the emit text SHALL NOT preview the new flag or behavior

When the planned change lands, every prior emit that recommended its command automatically benefits because users invoking the recommended command experience the new default behavior at that moment; no emit-time forward-references are needed.

#### Scenario: Verify-pass recommendation does not reference planned reviewer-mode changes
- **WHEN** the emit-layer writes a verify-pass JSON's `next_recommended`
- **THEN** its leading invocation is the one `Verify pass recommendation` names, read from the gate graph, and the text adds NO qualifier of its own about external review, fresh-context, or reviewer-mode defaults

#### Scenario: Emit text contains no other-issue references
- **WHEN** any run-summary JSON is inspected
- **THEN** `next_recommended` and `final_assessment` text contain no issue numbers (e.g., `#20`, `#15`) or references to future-issue behavior changes
