## MODIFIED Requirements

### Requirement: No-chaining contract

The AI SHALL invoke at most the orbit workflow commands the user's message explicitly requests, plus the next command
the change status's `chain` object allows (`orbit-engine-gates`' `The change status says whether the next command may
run unasked`) — one command per explicit user request; without that allowance the AI recommends, never invokes.
Completing a command ENDS the turn at the position readout and the engine's canonical-next line (eligibility-framed,
per `orbit-engine-gates`); the AI SHALL NOT invoke the next orbit command — any `/orbit:*`
workflow, review iterations included — unless the user's message requests it or the `chain` object reports
`may_run: true` for it. When it does, the AI renders the position readout and the eligibility line, then one line naming
the command it runs and the setting key that granted it, and runs that command as the next act of the same turn; the
chained command ends the same way, so a chain continues until the object reports `may_run: false` (a chained archive
ends the chain at its completion readout and reads no object, because the command after it is not a change command), and the AI then
states its `why` in one line whenever `configured` is true — on `open-stop`, naming the object's `stop` record and
putting that stop's question to the user. A command run because the object allowed it records that as one sentence,
`Chained: granted by chain.<key>.`, in the record its session writes: a walk in its run summary's `final_assessment`,
an external review or a blind pair in its launch record's `final_assessment`, an in-context review in its pass's
`commentary` (the review emit owns a pass's `final_assessment`); a chained apply or archive records it as its
`consent: "setting"` value and writes no sentence, because the key and the command are one-to-one
(`orbit-lifecycle-consent`'s `Consent recorded in consent-scoped lifecycle emits`); a chained fresh review records nothing, because its
pass is written by a worker whose brief carries nothing from the session that dispatched it — a named limit. Only the session that invoked a
command reads the object at its end: a worker that session dispatched — a fresh reviewer, a blind pair's fresh half —
persists its pass and returns, and never chains. A command with no change target — an architecture-mode review, a
`--doc` walk, a project-wide walk — reads no object and ends at its readout. A chained external review or blind pair
needs a committed tree: on an uncommitted one it writes no run record, the object reports `no-progress`, and the AI
says the tree is uncommitted — a named limit. With no `chain` setting the object never allows a command,
and the contract holds exactly as without the setting. Blanket delegation
("follow the cadence", "take it through review") covers work WITHIN each explicitly requested
command (the passes of one review, the tasks of one apply), never the next command; gate `passed`
means *eligible*, not *commanded* — only the user's own `chain` setting commands. This contract is echoed in every generated workflow body
(the self-contained-disciplines pattern) and is the behavior layer the consent prompts
(`orbit-lifecycle-consent`) backstop at the consent-marked seams. The per-body echo MAY take
the EPITOME form (D-arc Stage D5's body economy): for no-chaining, ~2 structural-leaning lines
leaning on the turn-ending structure (position readout + eligibility line); for the
disciplines block generally, an epitome of one bullet per discipline with procedural detail moved to the
step that uses it (detail-to-situ) — the full normative text keeps ONE home (this capability's
discipline requirements), an epitome echo is COMPLIANT, and body-fidelity checks pin the
epitome form, not the pre-D5 full block. The bodies whose end can name a change's next command — propose, ff,
apply, review and address-reviews — carry the `chain` allowance in their echo and in their closing step.

#### Scenario: Command completion ends the turn

- **WHEN** an orbit workflow command completes, a next command is eligible, and the change status's `chain` object
  reports `may_run: false`
- **THEN** the AI renders the position readout + the engine's canonical-next line and stops;
  it does not invoke the eligible command

#### Scenario: A granted next command runs in the same turn

- **WHEN** a fresh system review completes with findings and the `chain` object reports
  `next: "/orbit:address-reviews <change>"` and `may_run: true`, granted by `chain.address-reviews`
- **THEN** the AI renders the position readout and the eligibility line, names `/orbit:address-reviews <change>` and the
  key `address-reviews` in one line, and runs the walk; the walk's `final_assessment` carries
  `Chained: granted by chain.address-reviews.`, and at the walk's end it reads the object again

#### Scenario: A chain ends by stating why

- **WHEN** a chained command completes, `configured` is true, and the `chain` object reports `may_run: false` with
  `why: "not-granted"`
- **THEN** the AI renders the position readout and the eligibility line, states that the chain stops because the next
  command is not granted, and ends the turn

#### Scenario: A dispatched worker never chains

- **WHEN** a fresh reviewer — dispatched by `/orbit:review --fresh` or as a blind pair's fresh half — persists its pass,
  and the `chain` object reports `may_run: true` for `/orbit:address-reviews <change>`
- **THEN** the worker returns without reading the object or running the walk; only the invoking session's closing step
  may run it

#### Scenario: Blanket delegation does not cross commands

- **WHEN** the user has said "run the review cadence", no `chain` setting grants the next review, and one review
  command completes with the gate still unpassed
- **THEN** the AI reports position and recommends; the next review invocation is the user's
  (review-cycle COUNT is the user's call)

#### Scenario: Explicit multi-command requests are honored as scoped

- **WHEN** the user's message explicitly names multiple commands ("run a fresh review, then
  address its findings")
- **THEN** exactly those named commands are run — the request defines the scope; nothing beyond
  it is invoked unless the `chain` object allows it

#### Scenario: A chained apply records its grant in its consent value

- **WHEN** a proposal walk ends, the `chain` object reports `may_run: true` for `/orbit:apply <change> — user-invoked`,
  granted by `chain.apply`, and the walk's closing step runs apply
- **THEN** apply's emits carry `consent: "setting"`, and no `Chained:` sentence is added to their assessment

#### Scenario: Epitome echo is a compliant echo

- **WHEN** a generated body carries the ~2-line no-chaining epitome and the disciplines
  epitome (one bullet per discipline) instead of the full blocks
- **THEN** the body satisfies this contract's echo expectation — the full text's single
  normative home is this capability; fidelity and drift checks compare bodies against the
  epitome form, not the pre-D5 full block

### Requirement: A chain treats each prompt by its kind

A command the AI runs because the `chain` object allowed it SHALL treat each prompt its body can put to the user by the
prompt's kind: a TARGET prompt (which change, which mode) does not fire, because the next command names both; a
ROUTINE confirmation — a prompt whose body marks a default and whose default sends nothing outside the project — is
answered with that default, and the command's run summary records it as one sentence in its `final_assessment`:
`The chain took the default: <prompt> — <answer>.`; every other prompt is a DECISION, which stops the chain: the AI asks
it exactly as on an arrival the user typed, the chain does not continue after it, and the AI states in one line that the
chain stopped at it. A prompt that would leave unfinished work behind is a decision whatever default it marks, and so
is every anomaly prompt (a gate inflection, a base-fingerprint check, a critical audit). The prompts of the four
commands a chain can arrive at, `orbit-review`, `orbit-address-reviews`, `orbit-apply-change` and
`orbit-archive-change`:

| prompt | kind |
|---|---|
| review: which change — or, in architecture mode, which doc — when none is named | target: does not fire (a chain names a change, never architecture mode) |
| review: which mode, when `--as` is not given and `tasks.md` is missing, mixed or ambiguous | target: does not fire |
| review: which change, in the external handoff, when none is named or the name is ambiguous | target: does not fire |
| review: the external return the user pastes back | not a prompt: the `chain` object refuses the command with `needs-user` before it runs |
| address-reviews: triage scoping the user's reply leaves unsettled (default: walk all) | routine: walks all, recorded |
| address-reviews: a half-landed pair, stop or walk now | decision: stops |
| address-reviews: a decision-lane finding (briefing, ratification, closure prompt) | decision: stops |
| address-reviews: an unresolvable finding's alternatives to filing a task (convert to `@todo`, or escalate) | decision: stops |
| apply: which change, when none is named or it is ambiguous | target: does not fire |
| apply: the consent prompt | not a prompt on an arrival the `chain` object allowed: the arrival is granted, records `setting`, and the prompt does not fire (`orbit-lifecycle-consent`) |
| apply: the gate inflection at a `blocked-by-gate` entry | decision: stops |
| apply: a pause — an unclear task, a design issue the work reveals, an error or a blocker | decision: stops |
| archive: which change, when none is named | target: does not fire |
| archive: the consent prompt | not a prompt on an arrival the `chain` object allowed: the arrival is granted, records `setting`, and the prompt does not fire (`orbit-lifecycle-consent`) |
| archive: unaddressed `@review:` markers (address now, convert to `@todo:`, or proceed) | decision: stops |
| archive: incomplete artifacts | decision: stops |
| archive: incomplete tasks | decision: stops |
| archive: a user-validation task line the closure cannot dispose of (repair `tasks.md`, or abort) | decision: stops |
| archive: the sync assessment (default: Sync now when deltas need syncing; Archive now when they are already synced) | routine: takes the marked default, recorded |
| archive: the gate inflection | decision: stops |
| archive: the base-fingerprint check, unverified or diverged | decision: stops |
| archive: critical audit findings | decision: stops |

On any arrival the user typed, every prompt fires exactly as without the `chain` setting. The list is a named limit —
Residual kind: a question a chained body asks in prose that matches neither pattern of Case 1. Residual method: D-sc-13's
test over the generated bodies, apply's and archive's among them, and a fixture chain run through each granted command, any turn that ends awaiting the
user without a listed prompt being the missed member. (Case 1 and D-sc-13 are the stage exploration's, archived with
this change: the two patterns are the `AskUserQuestion` sites and the prose asks of the pause pattern, and D-sc-13's
test is `Each chained prompt states its kind`.)

#### Scenario: A routine scoping prompt takes its default

- **WHEN** `/orbit:address-reviews <change>` runs because the `chain` object allowed it, and triage would ask how much
  to walk
- **THEN** no prompt fires, every finding is walked, and the walk's `final_assessment` carries
  `The chain took the default: triage scoping — walk all.`

#### Scenario: A decision-lane finding stops the chain

- **WHEN** a chained walk reaches a finding in the decision lane
- **THEN** the AI briefs it and waits for the user exactly as on a typed walk, and after the walk ends it runs no next
  command, stating that the chain stopped at a decision

#### Scenario: A typed arrival asks every prompt

- **WHEN** the user types `/orbit:address-reviews <change>` under a `chain` setting that grants `address-reviews`
- **THEN** triage scoping asks as it does today, and no default is taken

#### Scenario: A chained archive takes the sync default

- **WHEN** `/orbit:archive <change>` runs because the `chain` object allowed it and its deltas need syncing
- **THEN** no sync prompt fires, the deltas are synced, and the archive's `final_assessment` carries
  `The chain took the default: sync assessment — Sync now.`

#### Scenario: A pause in a chained apply stops the chain

- **WHEN** apply runs because the `chain` object allowed it and a task turns out unclear
- **THEN** the AI asks as on a typed apply, and after apply ends it runs no next command, stating that the chain
  stopped at a decision

#### Scenario: Unaddressed markers stop a chained archive

- **WHEN** a chained archive's marker scan finds `@review:` markers in the change
- **THEN** the marker prompt is asked exactly as on a typed archive

### Requirement: Each chained prompt states its kind

Each prompt that `A chain treats each prompt by its kind` lists SHALL carry, at its site in the generated body or
reference, a tag naming its kind in the form `(chain: target)`, `(chain: routine, default: <option>)` or
`(chain: decision)`; a line that names `AskUserQuestion` or the pause pattern without asking anything (a mention), and
the list's not-a-prompt rows, carry `(chain: not a prompt)`. A test over the generated `orbit-review`,
`orbit-address-reviews`, `orbit-apply-change` and `orbit-archive-change` bodies and their references SHALL fail on an `AskUserQuestion` site, or a prose ask matching
the pause pattern (pause, wait for guidance, ask for clarification), that carries no tag, and on a tagged site whose
prompt the requirement's list does not name. The tag is
read only on an arrival the `chain` object allowed; on every other arrival it changes nothing the AI does (G0, as
R-adf-12 words it). The sites are found by two patterns — a named limit: Residual kind: a question a chained body asks
in prose that neither pattern matches. Residual method: the stage's fixture chain, where a turn ending on the user
without a tagged prompt is the missed member.

#### Scenario: An untagged prompt fails the test

- **WHEN** a template edit adds an `AskUserQuestion` to the address-reviews body with no `(chain: …)` tag
- **THEN** the test fails naming the site

#### Scenario: A tag the list does not name fails the test

- **WHEN** a review reference carries `(chain: routine, default: proceed)` at a prompt the requirement's list does not name
- **THEN** the test fails naming the tag

#### Scenario: The apply and archive bodies are scanned

- **WHEN** a template edit adds an untagged `AskUserQuestion` to the archive body
- **THEN** the test fails naming the site, as it does for the review and address-reviews bodies

### Requirement: Internal-run JSON summary format

The system SHALL use a consistent JSON shape for run-summary emissions across **all orbit commands that mutate artifacts** — workflow, editorial, and lifecycle alike. Every run-summary JSON SHALL include a universal spine; commands extend the spine with per-kind and per-command extensions. Emits are COMPOSED via the engine emit surface (`orbit emit <command>` per `orbit-emit-composition`, D-arc Stage D5) — the spine's computable fields are engine-owned; the emitting AI supplies only narrative payload fields.

The universal spine (7 required fields):

```
command          string       identifies which command emitted (matches filename prefix)
timestamp        string       ISO-8601 UTC; JSON field uses standard colon format `YYYY-MM-DDTHH:MM:SSZ`
                              (e.g., `"2026-05-21T13:34:12Z"`). Filename embeds a colon-replaced `<TS>` token
                              `YYYY-MM-DDTHH-MM-SSZ` (e.g., `propose-2026-05-21T13-34-12Z.json`) because
                              colons aren't filesystem-safe across all platforms.
change           string|null  the change name (or null for project-scope and architecture-scoped commands)
final_assessment string       narrative of what just happened (human-readable)
next_recommended string       verbatim recommendation, suitable for best-effort parse by downstream status readers
kind             enum         "workflow" | "editorial" | "lifecycle"
model            string|null  the emitting AI's model identity (provenance — D-arc Stage D5); null when unknown.
                              The emit surface REQUIRES the key in every payload (explicit null allowed) so
                              provenance is always a conscious act. Pre-capability emits lack the field —
                              readers SHALL tolerate absence (both generations valid on the trail).
```

Per-kind extensions:

- **`kind: "workflow"`** — emitted by `explore`, `propose`, `new`, `continue`, `ff`, `apply`, `verify`, `architect` (D-arc Stage D2; `architect` emits to the architecture trail with `change: null` plus a `doc` extension — shape owned by `orbit-architect`). Per-command extensions are defined in the `orbit-run-summary-emit` capability (e.g., `apply.chunk_complete`, `verify.verdict`, `explore.decisions_captured`). Consent-era `apply` emits additionally carry `consent: "user-invoked" | "prompted" | "setting"` (per `orbit-lifecycle-consent`).
- **`kind: "editorial"`** — emitted by `review`, `address-reviews`, `audit-drift`, `review-external`. Per-command extensions include: `iteration` (when applicable to the command — e.g., review iter-N, address-reviews iter-N), `scorecard` (the 3-dimension × severity counts shape — Completeness/Correctness/Coherence, each with critical/warning/suggestion — on review completion emits; the renderer's required counts source per `orbit-report-rendering`; D-arc Stage D4), and full `findings[]` entries (each carrying its own `title` — no separate title array). The former `findings_summary` AND `finding_titles` fields are RETIRED for review emits (superseded by `scorecard`; live practice had already migrated) — readers SHALL tolerate both generations (a severity count is recoverable by counting `findings[]`, the existing trail-reader fallback; the report RENDERER's strict generation boundary is the named exception, per `orbit-report-rendering`); audit-drift's payload is owned by `orbit-run-summary-emit`'s `Audit-drift standalone recommendations`, and archive-audit emits keep their own `findings_summary` shape unchanged. Command-specific fields beyond these are documented in per-skill schema references (`references/run-summary-schema.md`, shipped alongside the generated skill — payload-field lists MIRRORING the engine's authoritative table per `orbit-emit-composition`, never defining it; the spine is engine-owned and documented HERE, not per skill).
- **`kind: "lifecycle"`** — emitted by `archive` only. Per-command extensions include: `archive_path`, `audit`, `sync_specs` (reports what the archive flow's spec-sync step did, mirroring upstream's archive summary), `unresolved_markers`, `user_decision`, plus other fields defined in the archive skill. Consent-era emits (per `orbit-lifecycle-consent`) additionally carry the flat `consent: "user-invoked" | "prompted" | "setting"` field.

**Canonical examples** (one per kind, illustrating spine + per-kind extensions; each is EXECUTED, per the paragraph after them):

Workflow-kind example — an `apply` emit written at chunk 2 completion of a chunked apply (the `final_assessment` shown is the ENGINE-composed chunk/counts core per `orbit-emit-composition`'s deterministic-facts requirement — the payload may only append an optional `assessment_suffix`, never author the counts; the `next_recommended` shown is the engine's canonical next_command extended by the ENGINE-composed next-chunk suffix from the preamble — every character engine-owned; `diff_base` is the tree the next apply's `files_touched` diffs from):

```json
{
  "command": "apply",
  "timestamp": "2026-05-21T13:34:12Z",
  "change": "add-detail-flag",
  "final_assessment": "Completed chunk 2 of 5 (inventory+parsing); 28 of 76 tasks done.",
  "next_recommended": "/orbit:apply add-detail-flag — next chunk: phase+attention+recommendation engine",
  "kind": "workflow",
  "model": "claude-fable-5",
  "consent": "user-invoked",
  "tasks_completed": 28,
  "tasks_remaining": 48,
  "user_validation_remaining": 0,
  "chunk": "2 of 5",
  "chunk_name": "inventory+parsing",
  "chunk_complete": true,
  "tasks_completed_this_session": 16,
  "files_touched": ["src/core/parsers/preamble.ts", "test/core/preamble.test.ts"],
  "diff_base": "fd6f2826ece1c27853a35ca6a7ed37efccb28218"
}
```

Editorial-kind example — a `review` emit written by a `/orbit:review --as proposal --reviewer fresh` iter-1 pass with findings (`next_recommended` is the change-scoped walk per `orbit-emit-composition`'s `Deterministic facts are engine-composed per command`; `pass_genre`, `verified_walks` and `iteration` are engine-computed; `direction` is owed by an independent class):

```json
{
  "command": "review",
  "timestamp": "2026-05-21T00:18:14Z",
  "change": "emit-run-summary-jsons-from-workflow-commands",
  "kind": "editorial",
  "model": "claude-fable-5",
  "mode": "proposal",
  "reviewer_class": "fresh",
  "depth": "full",
  "flags": { "parallel": false, "focus": null, "strict": false, "fresh": true, "mark": false, "skip_verify": false },
  "scorecard": {
    "completeness": { "critical": 1, "warning": 0, "suggestion": 0 },
    "correctness": { "critical": 0, "warning": 1, "suggestion": 0 },
    "coherence": { "critical": 0, "warning": 0, "suggestion": 0 }
  },
  "findings": [
    { "pass": "3", "severity": "CRITICAL", "dimension": "completeness", "title": "Emit timing undefined for bare-mode explore", "file": "specs/emit/spec.md", "line": 12, "recommendation": "…", "reproduction": "run /orbit:explore with no name, speak two decisions, stop: no explore-<TS>.json is written and the spec names no rule for it" },
    { "pass": "5", "severity": "WARNING", "dimension": "correctness", "title": "Apply chunk-preamble format unspecified", "file": "specs/apply/spec.md", "line": 40, "recommendation": "…" }
  ],
  "stale_suppressed": [],
  "passes_run": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  "passes_skipped": [],
  "direction": { "disposition": "hold", "reasoning": "The bare-mode emit gap is a user path with no rule; settle it before apply." },
  "final_assessment": "1 critical, 1 warning, 0 suggestion.",
  "pass_genre": "REVIEW",
  "verified_walks": [],
  "iteration": 1,
  "next_recommended": "/orbit:address-reviews emit-run-summary-jsons-from-workflow-commands"
}
```

Lifecycle-kind example — an `archive` emit written after `/orbit:archive bootstrap-orbit-status-cli` (the `judgements` array carries the readiness record per `orbit-emit-composition`, its `formed_against` naming the independent passes it was formed against):

```json
{
  "command": "archive",
  "timestamp": "2026-05-20T16:31:59Z",
  "change": "bootstrap-orbit-status-cli",
  "kind": "lifecycle",
  "model": "claude-fable-5",
  "final_assessment": "Archived bootstrap-orbit-status-cli to orbit/changes/archive/2026-05-20-bootstrap-orbit-status-cli/.",
  "archive_path": "orbit/changes/archive/2026-05-20-bootstrap-orbit-status-cli/",
  "audit": { "ran": true, "failure_reason": null, "findings_summary": { "critical": 0, "warning": 0, "suggestion": 0 }, "summary_path": null },
  "sync_specs": { "ran": true, "skipped_reason": null, "capabilities_updated": ["orbit-status-output"], "added": 3, "modified": 1, "removed": 0, "renamed": 0 },
  "unresolved_markers": [],
  "user_decision": "proceeded_with_no_critical",
  "consent": "user-invoked",
  "warnings": [],
  "decision_records_unread": 0,
  "judgements": [
    { "kind": "readiness", "formed_against": ["2026-05-19T22-10-04Z"], "disposition": "ready", "reasoning": "The system gate passed and the one independent pass's findings are all resolved.", "ratified_by": "user", "accepted": [{ "claim": "no independent pass read the final tree", "why": "the walk's edits were single-line repairs the verification graded landed" }] }
  ],
  "next_recommended": "/orbit:architect <name> — change archived; plan the next piece of work, or run /orbit:audit-drift for a project-wide drift check."
}
```

**Each canonical example is executed, never trusted.** A test SHALL read every `json` fence after the `**Canonical examples**` line of this requirement AS IT WILL STAND — the MODIFIED block of an active change's delta for this requirement when one exists (more than one such active change fails the test naming both), and the baseline otherwise, so a change that edits the examples is held to them during its own apply — found by the engine's CommonMark fence tracker, and for each: subtract the keys the engine composes and refuses in a payload for the example's `command` (the spine plus that command's engine-owned set, read from the engine's own list, never a test-side copy), submit the remainder through the real write gate (`composeAndWriteEmit`) in a disposable project of the target the command writes to (an active change for `apply` and `review` — for `review`, one named by the example's own `change`; an archived change directory for `archive`), seeded only as the write gate requires (a minimal `tasks.md` for `apply`, with no chunk seeded, because the engine writes the chunk keys on every apply emit; one minimal independent pass at every `formed_against` token), and assert that the gate ACCEPTS the payload and that the written emit's top-level key set EQUALS the example's. For the `review` example — on a fresh trail every value the engine composes for it except `timestamp` is reproducible — each engine-composed key the example carries other than `timestamp` SHALL EQUAL the written emit's value, a difference failing the test naming the key and both values, so the subtraction cannot discard a stale pointer or counts sentence unseen; its written emit is additionally rendered through `orbit status --change <name> --report`. A fence whose `command` the test has no target for fails the test naming the fence's opening line, so an example cannot be added unexecuted. Unlike a payload reference's round trip (`orbit-emit-composition`'s `Payload schema references are proven by execution`), this one SUBTRACTS before submission, because an example here is a written emit, not a payload. **Named limit.** For `apply` and `archive` the check is exactly as strong as the write gate's validators plus a top-level key-set comparison: a stale value under a current key, or a stale nested key, passes for them — including their engine-composed values, which the subtraction discards and the renderer never sees. For `review`, a stale value the payload supplies passes wherever the write gate and the renderer accept it.

#### Scenario: Universal spine present on every emit

- **WHEN** any orbit command (workflow, editorial, or lifecycle) writes a run-summary JSON
- **THEN** the JSON contains the 7 spine fields with valid values: `command`, `timestamp`, `change` (or null), `final_assessment`, `next_recommended`, `kind`, and `model` (nullable; absent only on pre-capability emits, which readers tolerate)

#### Scenario: Workflow command emit shape

- **WHEN** a workflow command (e.g., `/orbit:propose`, `/orbit:apply`, `/orbit:verify`) writes its JSON
- **THEN** `kind` equals `"workflow"`; per-command extensions are present per the `orbit-run-summary-emit` capability (which defines the specific extension fields per workflow command)

#### Scenario: Editorial command emit shape (with findings)

- **WHEN** an editorial command that has produced findings (`/orbit:review`, `/orbit:address-reviews`, `/orbit:audit-drift`) writes its JSON
- **THEN** `kind` equals `"editorial"`; per-command extensions include `iteration` (when the command tracks iterations), the counts shape the command owns (`scorecard` for review emits — D-arc Stage D4; audit-drift's per `orbit-run-summary-emit`'s `Audit-drift standalone recommendations`), plus command-specific fields documented in the emitting skill's `references/run-summary-schema.md`

#### Scenario: Editorial command emit shape (pre-findings T0 case)

- **WHEN** the external-review packaging branch writes its T0 JSON (prompt packaged, external findings not yet returned)
- **THEN** `kind` equals `"editorial"`; per-command extensions include `mode`, `prompt_path`, `target`, `awaiting_findings: true` — and OMIT the counts shape because no findings exist yet

#### Scenario: Lifecycle command emit shape

- **WHEN** `/orbit:archive` writes its JSON
- **THEN** `kind` equals `"lifecycle"`; per-command extensions include `archive_path`, `audit`, `sync_specs`, `unresolved_markers`, `user_decision` per the archive skill's emit. Consent-era archive emits also include `consent`.

#### Scenario: Downstream status readers parse next_recommended uniformly across kinds

- **WHEN** a downstream status reader reads any run-summary JSON (regardless of `kind`) and best-effort parses `next_recommended`
- **THEN** the leading `/orbit:<verb> [args]` token (if present) is extracted into `command` and `args`; on parse failure (e.g., prose recommendation), the full string is preserved in `reason`

#### Scenario: Future consumers route by `kind` field rather than parsing filename prefix

- **WHEN** a downstream consumer (dashboard, CI bot, IDE plugin) reads `.orbit-runs/*.json` files
- **THEN** the consumer MAY route by reading the `kind` field directly rather than pattern-matching filename prefixes (e.g., `review-*`, `address-reviews-*`); filename prefix routing remains valid as a fallback

#### Scenario: Model provenance recorded, absence tolerated

- **WHEN** a post-capability emit is written via the surface and a pre-capability emit sits beside it on the trail
- **THEN** the new emit carries `model` (a string or explicit null); every reader treats the old emit's missing key as valid (no degradation, no warning)

#### Scenario: A stale canonical example fails by execution

- **WHEN** an engine change adds a field every `review` emit carries, and this requirement's editorial example is not updated
- **THEN** the canonical-example test fails: the written emit's top-level key set carries the new field and the example's does not, and the message names both sets

#### Scenario: A stale engine-composed value in the review example fails

- **WHEN** the editorial example's `next_recommended` is edited back to the self pointer `--from-file <this emit's own path>` while every key stays present
- **THEN** the canonical-example test fails naming `next_recommended`, the example's value and the value the engine writes for the example's own change

#### Scenario: An example with no executable target fails

- **WHEN** a fourth `json` fence is added after the `**Canonical examples**` line whose `command` is one the test has no target for
- **THEN** the test fails naming that fence's opening line

#### Scenario: An active change's edit to the examples is checked during its apply

- **WHEN** an active change's delta MODIFIES this requirement and its editorial example omits a key the engine writes
- **THEN** the canonical-example test fails before that change archives, reading the delta's block rather than the baseline's
