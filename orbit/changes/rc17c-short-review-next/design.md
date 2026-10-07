## Context

The decisions here come from `explore.md` (D-rc17c-1 through D-rc17c-7, Cases 1–3). rc17a shipped discovery: the
change-scoped walk reaches every pass that carries a finding (`unresolvedPasses` and `unwalkedPasses`). The gate's
canonical next already names no file. The review emit's `next_recommended` is the one surface still aiming at a single
pass file.

Three code sites carry the pointer today:

- the `review` case of `composeEmit` (`src/core/emit-composition.ts`): an architecture branch and a change-mode branch,
  each split on `hasFindings`;
- the renderer's spine-semantics check (`src/core/report-render.ts`, "SPINE SEMANTICS"), which fails the render on any
  value but the computed one;
- the review body (`src/core/templates/workflows/review.ts`): the spine paragraph and the schema line of
  `run-summary-schema.md`, both restating the composition rule.

No report prints `next_recommended`. The tail's eligibility line is the gate's canonical next, computed at render time
(explore.md, Case 2). Of the 182 archived proposal/system review emits, 152 carry the self pointer.

## Goals / Non-Goals

**Goals:**

- Exit (1): no change-mode review emit's `next_recommended` names a path.
- Exit (2): a review emit written before the stage, carrying the self pointer, renders unchanged.
- Exit (3): the architecture-mode pointer is unchanged.
- D-rc17c-6 (Sal): `orbit-conventions`' three canonical examples match what the engine writes, and a test keeps them so.

**Non-Goals:**

- The external T0 line, both audit-drift pointers, and the clean pointer (all unchanged; D-bpc-16's table).
- The external prompt's "eventual findings path" item (`orbit-review-external`). `--from-file` stays a legal explicit
  aim (explore.md, Considered & out).
- Migrating archived emits. They are records and stay as written.

## Decisions

**D1 — the change-mode branch composes `/orbit:address-reviews <change>` when the pass has findings** (D-rc17c-1). One
branch in one composer. The architecture branch is untouched. After this, whenever the gate's canonical next is a walk
(`orbit-engine-gates`' `A reviewed gate lists its outstanding passes`), the emit's next names that same walk. The two
differ when the gate names something else, as it does on a half-landed pair, where it names the missing member: the
emit's pointer depends only on the pass's findings. *Alternative:* keep
`--from-file` and add the change name. Rejected because it still aims at one half of a pair.

**D2 — the renderer accepts two values by VALUE, never by date** (D-rc17c-2). On a pass with findings, the expected set
is `{ /orbit:address-reviews <change>, /orbit:address-reviews <change> --from-file <emitRepoPath> }`. Both are computed
from the emit's `change` and file name, exactly as `emitRepoPath` is rebuilt today. A clean pass still accepts only the
report pointer. The drift error names `next_recommended` and lists the accepted values. *Alternatives:* a generation
field, or a date cutoff. Both rejected: the value already identifies its generation, and prior generations have been
marked by shape, never by date, since rc02b.

**D3 — the review body names the owner and stops restating the rule** (D-rc17c-3, R-crc-14). The spine paragraph says
`next_recommended` is the pointer `orbit-emit-composition`'s `Deterministic facts are engine-composed per command`
composes. It says the walk is change-scoped when the pass has findings, and the report render when the pass is clean.
The schema line's placeholder names the same owner and spells neither pointer, so the body carries no second statement of the rule. The external-handoff reference's "paste/save/ingest recommendation" (stale since rc08b, the D4 clause's twin in the body) names its owner the same way. The architecture-mode lines (the handoff example and the final-assessment table)
keep `--from-file`, because architecture mode is unchanged.

**D4 — the T0 clause in the same block points at its owner.** `Deterministic facts are engine-composed per command` still
says "paste/save/ingest". Since rc08b, the owner (`orbit-run-summary-emit`'s `Review-external T0 multi-step
recommendation`) says the line ends at the save step. The block is open anyway, so the clause names the owner, and its
scenario reads "ending at the save step". This adds no new capability and changes no code; the composer already ends at
save.

**D5 — the three canonical examples are refreshed from real emits** (D-rc17c-6). Each example keeps its illustrative
values. Its top-level key set is the one rc17b's real emits carry for the same situation:

- apply gains `diff_base`;
- review gains `reviewer_class`, `flags`, `stale_suppressed`, `passes_skipped`, `direction`, `pass_genre` and
  `verified_walks`, its findings gain `pass`, and the pass becomes a fresh one so `direction` is owed;
- archive gains `judgements` and the fuller `audit` / `sync_specs` objects.

Optional payload fields the examples do not need (`user_validation_tasks`, `commentary`, `assessment_suffix`) are left
out. The guard compares written key sets, so an example shows exactly what its payload produces.

**D6 — the guard SUBTRACTS, then submits** (D-rc17c-7). It differs from rc07b's round trip, which submits payload
references unchanged. These examples are written emits, so the test removes the engine-composed keys first: the spine
(`SPINE_FIELDS`) plus `ENGINE_OWNED_EXTRA[command]`, both exported from `emit-composition.ts` so there is one list. It
then submits through `composeAndWriteEmit` and holds the written top-level key set equal to the example's. The review
example is submitted under its own `change` name, its engine-composed values other than `timestamp` are compared with
the written emit, and it is rendered. Fences are found with `src/core/markdown-fence.ts`, after the `**Canonical examples**` line.
The disposable projects reuse rc07b's helpers wherever they fit (`test/helpers/schema-references.ts`). No chunk is
seeded for apply: the engine writes `chunk`, `chunk_name`, `chunk_complete`, `files_touched` and `diff_base` on every
apply emit (the nullable ones as `null` when unused), and the check compares keys, so the apply project needs only the minimal `tasks.md`
the engine reads. The example's chunk values stay illustrative and are not checked, which the named limit already
states.

**D7 — declared size: four capabilities** (D-rc17c-6, R-crc-9). The fourth, `orbit-conventions`, is the example's
owner. Without it the stale example would stay.

**D8 — the guard reads the requirement as it will stand.** The refreshed examples reach the baseline only at archive
sync, so a test reading `orbit/specs/` alone would fail throughout this change's apply. The test reads the MODIFIED block
of the active change whose delta modifies `Internal-run JSON summary format` when there is one, and the baseline
otherwise. Two active changes modifying the requirement fail the test, naming both. Any later change that edits the
examples is held to them during its own apply. *Alternatives:* syncing the baseline mid-apply was rejected, because it
would break this change's own base fingerprint at archive. Reading the baseline and accepting a red suite until archive
was rejected outright.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc17c-1 | SOURCED | live rule | `orbit-emit-composition` — `Deterministic facts are engine-composed per command` (SENTENCE naming the members in prose, plus the scenarios for findings, clean and architecture) |
| D-rc17c-2 | SOURCED | live rule | `orbit-report-rendering` — `Strict input validation — fail loud, no partial render` (SENTENCE naming the closed two-value set and its source, the emit itself; two scenarios) |
| D-rc17c-7 | SOURCED | live rule | `orbit-conventions` — `Internal-run JSON summary format` (SENTENCE naming the source, the fences after the `**Canonical examples**` line; two scenarios) |

D-rc17c-3 through D-rc17c-6 are `scope` or `fact` entries. They are not carried as rules; they appear above as design
decisions.

## Touchpoints

- `src/core/emit-composition.ts` — the review composer's change-mode branch; `export` on `SPINE_FIELDS` and `ENGINE_OWNED_EXTRA`.
- `src/core/report-render.ts` — the spine-semantics pointer check.
- `src/core/templates/workflows/review.ts` — the spine paragraph and the schema line.
- `test/core/emit-composition.test.ts` — the review pointer assertions.
- `test/core/report-render.test.ts` + `test/core/report-render-hardening.test.ts` — the prior-generation and drift cases.
- `test/core/canonical-examples.test.ts` — the new guard.
- `test/core/rc03b-untouched-modules.test.ts` — the hash pin over `emit-composition.ts` and `report-render.ts` (a planned move).
- `orbit/architecture/clean-up-review-cycle.md` — the stage's size declaration.

## Risks / Trade-offs

- [A post-stage emit hand-edited back to the self pointer renders silently] → Accepted. The old form still walks the
  pass it names, and the composer is the only writer. This is stated in D2 and not checked.
- [The guard compares top-level keys only] → A stale nested key or value passes for apply and archive. This is the named
  limit in the `orbit-conventions` requirement. The review example is held harder: it is submitted under its own
  `change` name, and every engine-composed value but `timestamp` is compared with the written emit (the renderer alone
  would grade only the values the engine recomposed, never the example's).
- [36 delta scenarios across four MODIFIED blocks must be declared before the apply gate passes] → Most are existing
  behaviour with existing tests. The task adds `@scenario` tags where a test asserts the THEN, and ledger entries
  otherwise. It never backfills baseline scenarios outside this delta.
- [The rc03b hash pin moves] → A planned act, recorded in the pin's comment like rc07b's and rc08a's moves.

## Migration Plan

None. Emits already on a trail keep their pointer and keep rendering (D2). New emits carry the short form from the first
`orbit emit review` after the change lands.
