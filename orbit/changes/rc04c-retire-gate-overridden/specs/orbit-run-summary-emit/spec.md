## MODIFIED Requirements

### Requirement: Apply per-chunk-end emission

`/orbit:apply` SHALL emit `apply-<TS>.json` at chunk boundaries when chunks are explicitly declared in the change's tasks.md preamble — via `orbit emit apply`, whose ENGINE parses the preamble and computes the chunk/checkbox fields (D-arc Stage D5; the grammar below is engine data, no longer body prose). The chunk preamble SHALL use this format: an HTML comment block at the top of tasks.md (before the first `## <group-name>` header) containing lines of the form `Chunk N (groups X[-Y]): <chunk-name>`. Example:

```
<!--
Implementation chunks:
  Chunk 1 (groups 1):    Foundation
  Chunk 2 (groups 2-3):  Workflow emits
  Chunk 3 (groups 4):    Apply behavior
-->
```

**Format constraints**:
- The `(groups X[-Y])` portion supports a single group (`X`) or a contiguous range (`X-Y`). Non-contiguous group sets (e.g., `(groups 6,8,9)`) are NOT supported in v1 — restructure tasks.md groups to be contiguous, or split into multiple chunks.
- **Cross-declaration coverage rules**: across the declaration set, chunk numbers SHALL be in ascending order and group ranges SHALL be non-overlapping with no gap (a declared-range group covered by no chunk); and the declared span's ENDS SHALL match the numbered groups actually present in tasks.md (declared start == the lowest numbered group, declared end == the highest — an omitted leading or trailing group is the same uncovered-work hazard as an internal gap, from outside the span); and NO unnumbered group may carry checkboxes when a preamble exists (its tasks count in the arithmetic but no chunk can ever cover them — undeclarable work is incompatible with chunking). Overlap, gap, out-of-order chunk numbers, and omitted leading/trailing groups are all malformed-preamble cases handled per the next bullet — a tolerated omission would let rule 1 recommend verify at final-chunk completion while uncovered tasks remain unchecked, the wrong-but-plausible record class this capability exists to prevent.
- **Malformed preamble handling** (graceful degradation): if the preamble comment block exists but cannot be parsed (missing parens, typo in `Chunk N`, malformed group range, overlapping/gapped/out-of-order declarations, etc.), the emit-layer SHALL log a single warning to stderr (`"warning: tasks.md preamble at <path> could not be parsed as chunk declarations; falling back to no-chunking mode"`) and proceed under no-chunking-apply rules (single emit at session end with `chunk: null`). The implementation is "tolerant on read, strict on write" — don't block the user's work; surface the parse issue so they can fix the preamble.

The emit follows these rules:

1. **Chunk completion**: when the last task in chunk N is checked, emit with `chunk: "N of M"`, `chunk_complete: true`, and `next_recommended` = the engine's post-landing canonical `next_command` per `orbit-emit-composition`'s post-write-semantics class — `/orbit:apply <name>` while chunks remain (the engine MAY extend it with the engine-composed ` — next chunk: <chunk-name>` suffix; the next chunk's name is preamble data), or the schema's next phase command on apply-complete (chunk N == M — the SCHEMA's value, read from the gate graph and never transcribed here; a version-pinned example in this sentence goes stale at the next bump, as the `v3` one written here did). Never a hand-authored or fixed alternative — the pre-gates verify-first vocabulary is retired from this surface.
2. **Mid-chunk session pause**: when the user pauses or hands off mid-chunk-N (e.g., "stopping here for now"), emit with `chunk: "N of M"`, `chunk_complete: false`, and `next_recommended: "/orbit:apply <name>"` to resume.
3. **No-chunking apply**: when tasks.md has no explicit chunk preamble, emit once at session end with `chunk: null`; `chunk_complete` is COMPUTED by the same engine formula with the whole task set as the "current chunk" (all unchecked tasks minus the full user-validation set == 0 — never a constant), and `next_recommended` is the engine's post-landing canonical `next_command` — the schema's next phase command when that computation is true, `/orbit:apply <name>` while AI-doable tasks remain.

The apply emit per-command extensions SHALL include the following fields beyond the spine:

```
tasks_completed              int   running total of checked tasks across all chunks
tasks_remaining              int   running total of unchecked tasks (includes user-validation tasks if present)
user_validation_remaining    int   subset of tasks_remaining that are acknowledged user-validation tasks
                                   (acknowledged-convention work intentionally left unchecked at apply-time for runtime
                                   testing or user confirmation; surfaces as warnings at archive time, not blockers).
                                   Default: 0. ENGINE-computed (D-arc Stage D5) as the length of the payload's
                                   `user_validation_tasks` identifier list — the ONE checkbox judgment the payload
                                   supplies: the task ids it recognizes as user-validation per their text (e.g.,
                                   ["9.6", "9.7"] for "Live-test ...", "(User-validation handoff)"). Each named task
                                   is validated to exist in tasks.md and be unchecked — a bad entry is rejected
                                   naming it; payload supply of the count itself is rejected as engine-owned.
                                   The VERIFIED identifier list PERSISTS on the emit as
                                   `user_validation_tasks` (an empty list is elided) — it is the trail record
                                   the tracked-gate user-validation subset rule consumes (per
                                   `orbit-engine-gates`' Tracked-gate pass condition).
chunk                        string | null   e.g., "3 of 5" or null — ENGINE-computed from the preamble
chunk_name                   string | null   e.g., "phase+attention engine" — ENGINE-computed
chunk_complete               bool             true when AI-doable work in this chunk is done — ENGINE-computed
                                              (D-arc Stage D5): the current chunk's unchecked tasks minus its
                                              user-validation subset == 0, where the per-chunk subset derives from
                                              task → group → chunk membership via the preamble grammar and the
                                              payload's `user_validation_tasks` list; when `chunk` is null
                                              (no-chunking), the "current chunk" is the WHOLE task set and the
                                              subset is the full list; payload supply rejected;
                                              user_validation_remaining > 0 does NOT block chunk_complete: true
tasks_completed_this_session int             delta since prior apply JSON — ENGINE-computed from the trail
files_touched                string[] | null  file paths changed since the previous apply emit's recorded
                                              `diff_base` boundary — ENGINE-computed from the git diff against
                                              the WORKING TREE (committed + uncommitted tracked changes; the
                                              first apply emit — or one whose predecessor lacks `diff_base` —
                                              references the change's first commit; boundary semantics per
                                              orbit-emit-composition — D-arc Stage D5; the per-chunk half of the
                                              predicted/actual touchpoints split); null outside a git repo or
                                              when no base resolves; NEVER hand-listed
diff_base                    string | null    the git TREE OID of the tracked working state at THIS emit's
                                              boundary — ENGINE-captured (`git write-tree` on a temporary index,
                                              per orbit-emit-composition; D-arc Stage D5); the next apply emit
                                              diffs from it, making per-chunk lists exact under every commit
                                              ordering; null outside a git repo; payload supply rejected
```

**Semantic rule**: `chunk_complete: true` means "AI-doable work in this chunk is done." `tasks_remaining > 0` AND `user_validation_remaining == tasks_remaining` is the expected state at the final chunk's emit when user-validation tasks exist — the AI is done; the remaining work is user-driven runtime testing. `tasks_remaining > 0` AND `user_validation_remaining < tasks_remaining` with `chunk_complete: true` is a contradiction the emit-layer MUST NOT produce.

#### Scenario: Chunk-1-of-5 completion emits with chunk_complete=true
- **WHEN** `/orbit:apply foo` completes the last task in chunk 1 of a 5-chunk apply
- **THEN** `apply-<TS>.json` is written with `chunk: "1 of 5"`, `chunk_complete: true`, and `next_recommended` advancing to `/orbit:apply foo` (next chunk)

#### Scenario: Mid-chunk pause emits with chunk_complete=false
- **WHEN** the user pauses mid-chunk-3 with 5 of 12 tasks in the chunk checked
- **THEN** `apply-<TS>.json` is written with `chunk: "3 of 5"`, `chunk_complete: false`, `tasks_completed_this_session: 5`, and `next_recommended: "/orbit:apply foo"`

#### Scenario: Apply-complete recommends the engine's canonical next
- **WHEN** `/orbit:apply foo` completes the last task in the final chunk
- **THEN** `apply-<TS>.json` is written with `chunk_complete: true` and `next_recommended` equal to the engine's post-landing canonical `next_command` as the gate graph computes it for the change's schema — never a hand-authored alternative

#### Scenario: No-chunking apply emits once at session end
- **WHEN** `/orbit:apply foo` runs on a change with no explicit chunk preamble in tasks.md and completes all AI-doable tasks
- **THEN** exactly one `apply-<TS>.json` is written at session end with `chunk: null` and `chunk_complete: true` — the whole-task-set computation, not a constant

#### Scenario: Overlapping chunk declarations fall back to no-chunking
- **WHEN** tasks.md declares `Chunk 1 (groups 1-3)` and `Chunk 2 (groups 3-4)`
- **THEN** the emit-layer logs the single malformed-preamble stderr warning and proceeds under no-chunking rules (`chunk: null`); no chunk arithmetic is attempted against overlapping declarations

#### Scenario: Final chunk completes with user-validation tasks remaining
- **WHEN** `/orbit:apply foo` completes the last AI-doable task in the final chunk, but 6 user-validation tasks (e.g., "9.1 Live-test ...", "9.9 (User-validation handoff)") remain explicitly unchecked per the user-validation convention (the payload's `user_validation_tasks` list names them; the engine verifies each and derives the counts)
- **THEN** `apply-<TS>.json` is written with `chunk_complete: true`, `tasks_remaining: 6`, `user_validation_remaining: 6` (matching `tasks_remaining`), and `next_recommended` equal to the engine's canonical `next_command` — the AI is done; user-validation happens through the review-system phase's verify pass

#### Scenario: Apply past an unpassed proposal gate records the decision
- **WHEN** the user invokes `/orbit:apply foo` while the `review-proposal` gate is unpassed or stale and chooses proceed-anyway at the inflection prompt
- **THEN** the `apply-<TS>.json` emit carries a `judgements` entry with `kind: "continuation"`, `disposition: "proceed"`, `gate: "review-proposal"`, and its `gate_state` and `gate_reason` captured at decision time; emits for applies where no such decision was taken omit the `judgements` key entirely

#### Scenario: Per-chunk touched files computed from the diff
- **WHEN** a chunk-completion emit fires in a git repository with commits and/or uncommitted tracked edits since the previous apply emit
- **THEN** `files_touched` lists the changed paths engine-computed from the diff against the working tree; in a non-git workspace, or when no reference resolves, the field is `null` — never an AI-authored list

### Requirement: Consent field on the apply emit

The apply emit (`apply-<TS>.json`) SHALL carry the flat `consent: "user-invoked" | "prompted"`
field per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` when the apply was
user-typed, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded.
The field applies to every post-capability apply emit (all three emit rules: chunk completion,
mid-chunk pause, no-chunking session end — the consent story is a property of the apply
invocation, identical across its chunks' emits). Emits predating the consent capability lack the
field and are exempt from the audit-drift tripwire (per `orbit-audit-drift`). Downstream parsers
SHALL ignore the field if unknown (forward-compat, matching `recommendation_options` precedent).
The archive emit's consent field is specified in `orbit-archive-modifications`' `Archive run
summary written` requirement.

#### Scenario: Apply emit carries consent

- **WHEN** a user-typed `/orbit:apply` session writes its chunk-end emit
- **THEN** the emit includes `consent: "user-invoked"` alongside the existing spine and
  per-command extensions (the `judgements` record unchanged and independent)

#### Scenario: Consent constant across one apply's chunk emits

- **WHEN** a single apply invocation emits at multiple chunk boundaries
- **THEN** every emit of that invocation carries the same consent value (provenance is a property
  of the invocation, not the chunk)

### Requirement: The judgement record — one spine, two kinds

A CADENCE JUDGEMENT is a decision formed against INDEPENDENT REVIEW OUTPUT, and it SHALL be
recorded rather than left in narrative prose. The qualifying test is exactly that — *is the
judgement formed against independent review output?* — and it is not a tidiness rule: citing the
passes is the SAME property the write gate's ordering check consumes, so the criterion for
belonging and the constraint that makes the record trustworthy are ONE thing.

**WHAT IS EXCLUDED, AND ON WHAT GROUND.** Method calls, scope calls and process notes keep their
existing homes: they occupy no position in a cadence, so there is nothing about them for the
ordering check to consume. The exclusion is by CADENCE POSITION, not by citation count — and the
distinction is load-bearing, because a decision CAN hold a cadence position while having nothing
to cite. A gate is unpassed precisely when its cadence is incomplete, which INCLUDES the state
where no independent pass has run at all, and a decision to proceed anyway is taken at a cadence
seam whether or not evidence exists to name. Such a record is ADMITTED, and what the ordering
check consumes there is the emptiness ITSELF: the entry asserts the trail is empty and the trail
is read to confirm it (the rule and its scope are below; the check is `orbit-emit-composition`'s
edge (d)). So the criterion and the constraint remain ONE thing — an empty citation is checked,
not unchecked.

**THE PAYLOAD KEY IS `judgements`, AND IT IS AN ARRAY.** It is a literal top-level payload key on
the commands named below, and it is named here because `orbit-emit-composition`'s payload tables
are a literal allowlist that refuses unknown keys — a record whose key is left to the implementer
is a record that does not ship. It is an ARRAY because a single emit can legitimately carry more
than one judgement: an archive may both continue past an unpassed gate AND assert readiness, and
those are two decisions, not one with two faces. An emit carrying no judgement omits the key
entirely rather than sending an empty array.

Each entry SHALL carry:

```
kind            enum          "continuation" | "readiness"
formed_against  string[]      list of independent pass <TS> tokens (fresh or external); NON-EMPTY
                              except on `continuation`/`proceed`, where `[]` is legal IF AND ONLY IF
                              no independent pass precedes this emit — see the totality rule below
disposition     enum          kind-dependent; see below
reasoning       string        prose — why, in the author's own words (a RECORD under R-crc-10)
ratified_by     enum          "ai" | "user"
```

`formed_against` sits INSIDE each entry, never beside the array: two judgements on one emit may be
formed against different passes, and the write gate's ordering check runs per entry.

`ratified_by` is REQUIRED and is never inferred. The difference between the AI's own belief and a
user's ratification is a fact about the decision that context will not preserve, and a record that
leaves it implicit claims an authority it may not have.

`formed_against` cites BY TOKEN, never in prose. A prose citation — the shape the RETIRED
`gate_overridden` field used — cannot be ordered against anything, which is why no ordering check
was ever possible on it.

**`kind: "continuation"`** is formed MID-CADENCE and answers *given what came back, what next?*
Its `disposition` is `proceed` (continue past a gate that has not passed, additionally carrying
`gate`, `gate_state` and `gate_reason`) or `spend` (buy a further independent pass past a gate that
HAS passed — a decision the cadence has no other home for).

**`formed_against` MAY be EMPTY on a `continuation`/`proceed` entry, and ONLY when the emptiness is
TRUE.** `[]` is accepted IF AND ONLY IF the trail carries NO independent pass (`reviewer_class`
`fresh` or `external`, any mode) earlier than this emit's own token; where one exists the emit is
REFUSED, NAMING the LATEST preceding independent pass. "Latest" is normative rather than
incidental: the ordinary trail carries several preceding passes, and an unqualified "names the
pass" leaves an implementer to choose between one and all while the error text is what a user
acts on. This is what makes the record TOTAL over the
proceed-anyway domain: a gate is unpassed precisely when its cadence is incomplete, which INCLUDES
the state where no independent pass exists at all, so a record that could not be written there
would leave that case with no successor. *"I cited nothing because there was nothing to cite"* is
fully observable, so R-crc-10 permits a CHECK rather than only a record.

**The exemption is scoped to `continuation`/`proceed` and to nothing else.** `continuation`/`spend`
buys a further pass past a gate that HAS passed, so independent passes necessarily exist;
`readiness` asserts a belief formed knowing what came back, and with nothing back there is no
readiness judgement to record. An empty citation on either would be the uncheckable record this
capability refuses.

**`kind: "readiness"`** is formed at the cadence's END. Its `disposition` is `ready` or `not-ready`.

A `not-ready` record is an ARCHIVE-TIME DISSENT: the work was archived against the author's own
judgement. It is NOT a routing decision, and it carries no `destination`. Readiness is admitted
only on `archive`, the archive's completion readout calls the record *the session's own
judgement*, and routing a cadence back to architecture was already excluded from this capability
for want of a reader — so requiring a routing destination here would re-import the excluded
concept through the validator while refusing the honest dissent the one reader describes.
Accordingly `ratified_by` on a `not-ready` record takes EITHER value and records which it was: `ai`
when the belief is the authoring session's own, `user` when a human ratified it. That is the field
doing its ordinary work — the difference between the AI's belief and a user's ratification is a
fact about the decision, and here it is recorded rather than legislated. Every readiness record
additionally carries `accepted`: a list of `{claim, why}` pairs naming what was accepted WITHOUT resolution and
why that was acceptable. The accepted residuals are the assertion's CONTENT, not peer records —
*"I accepted the residual because the scoped pass came back sound"* is one statement, and splitting
it loses the because.

A `not-ready` record RECORDS; it SHALL NOT block. Readiness is a judgement, and an engine that
blocks on it acts on what it cannot observe (R-crc-10); the lifecycle already carries consent, gate
and audit prompts for stopping.

#### Scenario: A readiness record carries its acceptances as content

- **WHEN** a cadence ends with residual risk the author judges acceptable
- **THEN** the record's `accepted` list names each `{claim, why}`, and they appear there rather
  than as separate judgement records

#### Scenario: An empty formed_against is refused when a pass was available to cite

- **WHEN** a judgement entry carries `formed_against: []` AND the trail carries an independent pass
  earlier than this emit's own token
- **THEN** the emit is REFUSED, naming the LATEST preceding independent pass — claiming an empty
  cadence while one is on disk is not a cadence judgement, and the claim is checkable

#### Scenario: An empty formed_against is LEGAL on proceed when the trail is genuinely empty

- **WHEN** a `continuation`/`proceed` entry carries `formed_against: []` AND no independent pass
  precedes this emit's own token
- **THEN** the emit is ACCEPTED — the emptiness is the truth about the cadence. This is the one
  case the retired `gate_overridden` field could express and the record previously could not, and
  closing it is what makes the record TOTAL over the override's domain rather than nearly total

#### Scenario: The empty exemption does not extend to readiness or to spend

- **WHEN** a `readiness` entry, or a `continuation`/`spend` entry, carries `formed_against: []`
- **THEN** the emit is REFUSED regardless of trail state — the exemption is scoped to
  `continuation`/`proceed`, the only disposition whose trigger condition admits an empty cadence

#### Scenario: ratified_by is never inferred

- **WHEN** a judgement entry omits `ratified_by`
- **THEN** the emit is refused naming the field — the engine SHALL NOT guess whether a human
  ratified a decision

#### Scenario: An AI-authored archive dissent is accepted

- **WHEN** a `readiness` entry carries `disposition: "not-ready"` with `ratified_by: "ai"` and no
  `destination`
- **THEN** the emit is WRITTEN — the record is the authoring session's own dissent about work that
  archived anyway, and refusing it would leave the archive readout describing a record the engine
  will not accept

#### Scenario: A routing destination is refused as an unknown key

- **WHEN** a `readiness` entry carries `destination`
- **THEN** the emit is refused naming the key — the record's shape is closed, and routing has no
  carrier in this capability

### Requirement: Where a judgement record may appear

`judgements` SHALL appear ONLY on the emits written at the moments a cadence judgement is actually
taken. There are THREE, and the enumeration is CLOSED:

| emit | admits | because |
|---|---|---|
| `apply` | `continuation` | the proceed-past-`review-proposal` decision is taken here |
| `review-external` (T0) | `continuation` | the spend decision is taken at the moment the handoff is packaged |
| `archive` | `continuation` AND `readiness` | `review-system` is overridden here, and the cadence ends here |

The archive admits BOTH kinds, which is why the carrier is an array. This is not symmetry for its
own sake: the archive seam guards `review-system` while apply is gated by `review-proposal`, and
the archive is where the proceed-anyway decision is most often actually taken. A
`continuation/proceed` that could not be recorded at archive would leave the commonest override
with no record at all.

A judgement record supplied on any other emit is REFUSED naming the command. The record marks where
a decision was TAKEN; admitting it anywhere would make its location meaningless, and the location
is what the ordering check is anchored to.

**BOTH HALVES OF THAT TABLE ARE ENFORCED.** The COMMAND half is the payload allowlist, which refuses
the `judgements` key outright on any command outside the three. The KIND half is a separate refusal:
an entry whose `kind` is not in the `admits` column for the command being emitted is REFUSED, naming
the command and the kind. Without it the `admits` column reads as a contract and behaves as a
comment — a `readiness` writes cleanly onto a `review-external` T0 emit, which no surface reads,
producing exactly the write-only record this capability condemns. Kind-per-command is fully
observable, so R-crc-10 permits a check rather than only a record.

**DELIBERATELY NOT ADMITTED HERE: the `address-reviews` emit.** A cadence can also end by ROUTING
the work back to architecture rather than archiving, and that judgement is real. It is NOT carried
by this change, for a reason about READERS rather than size: the archive completion readout is the
single reader that keeps this record from being write-only, and in the routing case there is no
archive to read it. A routing-case record would be exactly the write-only record this capability
condemns. Its carrier belongs with whatever surface reads it, which no stage has yet declared.

#### Scenario: A continuation record names the passes it was formed against

- **WHEN** a further independent pass is bought past a gate that has already passed
- **THEN** the emit carries a `judgements` entry with `kind: "continuation"`,
  `disposition: "spend"`, a non-empty `formed_against` of pass tokens, prose `reasoning`, and
  `ratified_by`

#### Scenario: One archive emit carries both kinds

- **WHEN** an archive both continues past an unpassed `review-system` gate and asserts readiness
- **THEN** `judgements` carries TWO entries — one `continuation/proceed`, one `readiness` — each
  with its own `formed_against`, and the ordering check runs per entry

#### Scenario: A judgement record on an emit that takes no judgement is refused

- **WHEN** `judgements` is supplied on any command outside the closed three
- **THEN** the emit is refused naming the command

#### Scenario: A kind the seam does not admit is refused

- **WHEN** a `readiness` entry is supplied on an `apply` or `review-external` emit — a command that
  admits `judgements` but not that kind
- **THEN** the emit is refused naming the command and the kind; no file is written

#### Scenario: An emit with no judgement omits the key

- **WHEN** an emit carries no cadence judgement
- **THEN** `judgements` is absent entirely rather than present-and-empty, so key presence means a
  judgement was taken
