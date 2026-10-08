## MODIFIED Requirements

### Requirement: Single-voiced canonical-next computation

The engine SHALL compute ONE canonical next command per change state — the full invocation with
all applicable arguments and flags (e.g. `/orbit:review --as system --reviewer external <change>`
— the merged reviewer-class form, D-arc Stage D5; the retired `/orbit:review-external` invocation
never renders on any recommendation surface, while archived records citing it remain untouched) —
derived from the gate graph and cadence position. When the next uncovered cadence slot is the
`independent` meta-class (satisfiable by a `fresh` OR an `external` pass), the engine's single
canonical command SHALL be the fresh-context review (`/orbit:review --as <mode> --fresh <change>`)
— the lighter proposal-phase default. An external pass also satisfies an `independent` slot for
class-coverage purposes, but the rendered recommendation stays single-voiced: the fresh-context
command only, never co-offered with the external alternative. When the next uncovered slot is `invoked`, the canonical
command is the one `The first review slot covers what the user invoked`'s presentation table names.
When the next uncovered slot is `blind-pair`, the canonical command names the class missing from
the earliest pair STILL FORMABLE on this state. A standing pass counts as a candidate member only
while it is PAIRABLE — that is, while no `address-reviews-*.json` record referencing its findings
artifact carries a token AT OR AFTER its own. The bound is INCLUSIVE because the blindness interval
is: a record sharing a member's token already falls inside it, so an exclusive test would recommend
buying a partner for a pass that cannot form a valid pair. Once a pass has been walked it can never
pair with any later partner, so its class no longer counts as present. DIAGNOSIS USES THE SAME
PREDICATE AS ASSIGNMENT, OVER THE SAME SET: the passes ELIGIBLE at the failed slot — tokens above
its lower bound — never the whole pass list, so the reason and the canonical command can never name
different classes. When several lower bounds reach the failed slot, the LOWEST is canonical, the same
key the coverage search memoizes on. No FORECLOSED diagnosis exists: a pair excluded by the ordering
constraints is a class missing above the bound, and reads as one. The diagnosis is this table (the
states of a cadence whose coverage search fails deepest at a `blind-pair` slot, read at the canonical
reaching state), rows tested in order, first match wins:

| member | covered by |
|---|---|
| the deepest failed slot is not `blind-pair` | no pair diagnosis |
| several lower bounds reach the deepest slot | the LOWEST is canonical: eligibility is `token > bound`, so its eligible set contains every other reaching state's |
| no pairable eligible member | `none-standing`: no `openPair`; a safe walk may run first |
| pairable eligible fresh only, however many | `no-external`: `openPair: {missing: "external"}` |
| pairable eligible external only, however many | `no-fresh`: `openPair: {missing: "fresh"}` |
| both classes eligible, every pair tied | `tie` |
| both classes eligible, every untied pair has a record inside its interval | `blindness-broken` (defensive) |
| both classes eligible with one blind untied pair | unreachable: the slot would have a candidate, so a LATER slot is the deepest failure |
| a pairable pair exists in the whole list but one class is missing above the bound | the `no-external` or `no-fresh` row: the retired `foreclosed` label named this state and set no `openPair` |

Closure: DERIVED — a partition of the eligible pairable set by class presence, then by why no
candidate formed, plus the two rows that choose the state the set is read at. One consequence is worth stating rather than leaving as dead
vocabulary: the pairability filter SUBSUMES most of the blindness diagnosis, because a record that
breaks blindness has already made the member it references unpairable, so that member leaves the
candidate set before the blindness test runs. `blindness-broken` therefore survives as a DEFENSIVE
branch — reachable only for a record referencing the later member with an earlier token, which an
ordinary trail cannot produce — and not as a diagnosis a user should expect to see. When a pairable eligible fresh pass stands, the command
is the external invocation; when a pairable eligible external pass stands, the fresh invocation; when NO
pairable eligible independent pass stands, the command is the fresh invocation as the lighter first half AND
the gate's reason SHALL state that both members must run before EITHER is walked. Without the
pairability test the engine recommends a partner for a pass that can never pair, and every
recommended run satisfies no slot while still costing an independent pass.

**An unpassed or stale reviewed gate's own canonical command is chosen in ORDER (rc18), first match
wins:** (1) when the row carries `openPair`, the missing member's review; (2) when `unresolvedPasses`
OR `unwalkedPasses` is non-empty, the walk, `/orbit:address-reviews <change>`, naming no file; (3)
otherwise the review command for the cadence position, as computed above and by `The first review
slot covers what the user invoked`. Step (2)'s second list is rc18's: a pass carrying only SUGGESTIONs
is walked BEFORE the following slot's review runs, exactly as a pass carrying a WARNING already is, so
on the recommended path every walk precedes the pass that checks it. An open pair outranks the walk
because walking a landed member ends the pair.

**The change's next is selected over the gates in flow order (rc18).** The change-level selection
visits the gates in the order the position readout uses and takes the command of the FIRST gate, in
that order, whose row in the table below yields one. A reviewed gate is the FRONTIER while its `before`
names no gate that has passed: the gate-id test `Gate-aware status and instructions with position
readout` states for superseded gates, negated, and read on a gate of any state. When no gate yields a command, the flow-latest `passed` gate's own command is the
next, so the eligibility line never goes silent at a lifecycle seam:

| member | covered by |
|---|---|
| ungated schema | no gate rows; no command from this selection |
| tracked gate `ready` | the apply command (with ` — user-invoked` when the gate declaring `before: apply` is consent-marked) |
| tracked gate `passed` | nothing; selection continues |
| tracked gate `blocked` | nothing; selection continues |
| reviewed gate `blocked` | nothing from this selection; it carries no `unwalkedPasses` |
| reviewed gate `unpassed` or `stale`, not superseded | its own canonical command, in the order above |
| reviewed gate superseded | skipped; its unwalked passes are not recommended |
| reviewed gate `passed`, frontier, `unwalkedPasses` non-empty | `/orbit:address-reviews <change>`, naming no file; no ` — user-invoked` marker; its hint keys are the gate's phase id, as for the walk in step (2) |
| reviewed gate `passed`, frontier, `unwalkedPasses` empty | nothing; selection continues, and the gate's own command stays the phase command |
| reviewed gate `passed`, not the frontier | nothing; selection continues |

Closure: DERIVED — reviewed state (`blocked` / `unpassed` / `stale` / `passed`) × superseded ×
frontier × an empty or non-empty unwalked set, where `passed` is never superseded, so only its
frontier split applies, plus the three tracked-gate states and the ungated schema the selection also
visits. For a `passed` frontier gate whose `unwalkedPasses` is non-empty, the gate row's own
`nextCommand` SHALL be the walk, computed by the SAME predicate the selection applies, so the row and
the change never name different commands; every other `passed` gate's row keeps its phase command,
and the selection takes a passed gate's command only on that predicate, never because the row carries
one. The walk moves the RECOMMENDATION only: the gate's state, its reason and the next phase's
eligibility are unchanged, because SUGGESTIONs never gate. On the recommended path, the unwalked pass
of a `passed` gate is the last slot's, and walking it raises no bar. A gate is un-passed by a walk
only off that path: an EARLIER slot's pass walked after the following slot's pass ran raises that
slot's ordering bar (`A reviewed gate lists its outstanding passes`), the gate reads `unpassed`, and
the next is whatever this order computes for the slots the raised bar uncovers. On `spec-driven`'s
`[invoked, in-context]` that is the one in-context review; a longer cadence can uncover more than one
slot.
Recommendation surfaces (gate
reasons, blocked-by-gate payloads, and the workflow handoffs that render them) SHALL present only
this canonical command: no advertised alternatives, no skip paths, and no bare command names
without arguments. Skills render the engine-computed command verbatim.

**Eligibility phrasing (D-arc Stage D1, D-elc-4)**: the canonical-next command SHALL be rendered under
an eligibility-framed label — `Ready when you are:` — never an imperative label (`Next:` and
equivalents are prohibited on every recommendation surface: `orbit status` output,
`instructions` payload rendering, and generated workflow bodies that quote the readout). When the
canonical-next command's phase entry is consent-marked (`consent: user-invoked` on the gate whose
`before:` is that phase), the rendered line SHALL append the marker ` — user-invoked`
(e.g. `Ready when you are: /orbit:apply <name> — user-invoked`). Rationale: words are the API
when the consumer is a model; an imperative label reads as an instruction to execute. Emit FIELD
names (`next_recommended`) are unchanged — display wording only.

**Model-hint garnish (D-arc Stage D5, D-d5-9)**: when `orbit/config.yaml` carries an OPTIONAL
`models:` map and the canonical-next command's phase or cadence slot has an entry, the rendered
eligibility line SHALL append ` — hint: <value>` (after any ` — user-invoked` marker). Valid
keys are the two vocabularies the engine already computes against: the active schema's phase
ids (under the active schema, e.g. `review-proposal`, `apply`, `review-system`, plus any other declared
phase) and the cadence slot names (`in-context`, `fresh`, `independent`, `external`,
`blind-pair`). For an `invoked` slot, the slot entry read is the CLASS of the presented
command — `fresh`, `external`, or `blind-pair` for the pair command, per `The first review slot covers what the user
invoked` — so a hint describes the command it garnishes, and a `blind-pair` hint describes the pair command as a whole; a `models:` key
naming `invoked` is never read, and is inert like any other unknown key. When both
the resolved command's phase AND its cadence slot carry entries, the SLOT entry wins (the more
specific hook); keys outside both vocabularies are inert (never an error — the map is garnish).
The VALUE is checked only at the rendering boundary: a renderable hint is a non-empty
single-line string of at most 80 characters containing no control characters — the
eligibility line is a model-facing protocol, and an embedded newline could forge additional
readout lines; a value failing the check is INERT exactly like an unknown key (the line
renders without the suffix, byte-identical to an absent entry, never an error). Beyond that
boundary check the hint is pure garnish: the content is not validated, nothing is enforced,
and an absent map (or absent
entry) yields byte-identical pre-capability output. The phase-mapping content itself is
user-owned config, never spec.

#### Scenario: One command, fully specified

- **WHEN** any recommendation surface renders the next step
- **THEN** it is a single complete invocation; phrasings like "run review-external next" (no
  arguments) or "or proceed directly to archive" (advertised skip) do not appear

#### Scenario: Eligibility label, never imperative

- **WHEN** `orbit status --change <name>` renders the canonical next command
- **THEN** the label is `Ready when you are:` (with ` — user-invoked` appended for
  consent-marked phase entries); no recommendation surface renders an imperative `Next:` label

#### Scenario: External slot renders the merged form

- **WHEN** the cadence's next uncovered slot is `external`
- **THEN** the canonical command renders as `/orbit:review --as <mode> --reviewer external <change>` — the retired standalone invocation appears on no surface

#### Scenario: Model hint appends when configured

- **WHEN** `orbit/config.yaml` maps the external slot to `"GPT-5 Codex"` and the canonical next command is the external review
- **THEN** the eligibility line ends ` — hint: GPT-5 Codex`; with no `models:` map the line is byte-identical to pre-capability output

#### Scenario: Malformed hint value is inert at the rendering boundary

- **WHEN** a `models:` entry's value contains an embedded newline (or control characters, or exceeds 80 characters)
- **THEN** the eligibility line renders WITHOUT the hint suffix — byte-identical to an absent entry; no error, no partial injection into the readout

#### Scenario: The blind pair's missing member is the canonical next

- **WHEN** a PAIRABLE external pass stands on the current state and the `blind-pair` slot has no
  fresh partner
- **THEN** the canonical next command is `/orbit:review --as <mode> --fresh <change>` and the gate
  reason says the pair is open, naming the missing class

#### Scenario: A walked pass is not a pairable member

- **WHEN** on a gate whose cadence declares a `blind-pair` slot, both a fresh and an external pass stand on the current state but each has been walked,
  so no pair can be formed with any later partner
- **THEN** the canonical next command is the fresh invocation and the reason states that BOTH
  members must run before either is walked — the engine never recommends a partner for an
  unpairable pass

#### Scenario: A pair excluded by an earlier slot reports its missing class

- **WHEN** cadence `[external, blind-pair]` has a clean external pass at T1, consumed by the first
  slot, and an unwalked fresh pass at T2 carrying a WARNING
- **THEN** the row carries `openPair: {missing: "external"}` and the canonical next is
  `/orbit:review --as <mode> --reviewer external <change>`, not the walk

#### Scenario: An invoked slot's hint reads the presented class

- **WHEN** `models:` maps `external` to a hint and an `invoked` slot's canonical next is the external
  review
- **THEN** the eligibility line ends with that hint

#### Scenario: A blind-pair hint garnishes the presented pair command

- **WHEN** `orbit/config.yaml` carries `models: {blind-pair: "codex gpt-6.1-sol + a fresh subagent"}` and a gate's uncovered `invoked` slot presents the pair command under the default preference
- **THEN** the eligibility line ends with ` — hint: codex gpt-6.1-sol + a fresh subagent`

#### Scenario: A passed proposal gate with an unwalked pass names the walk

- **WHEN** `review-proposal` is `passed`, its `unwalkedPasses` lists an in-context pass carrying three
  SUGGESTIONs, and the `apply` gate is `ready`
- **THEN** the change's `next_command` is `/orbit:address-reviews <change>`, the gate row's
  `nextCommand` is the same command, and the gate's state still reads `passed`

#### Scenario: A passed system gate with an unwalked pass names the walk before archive

- **WHEN** every gate is `passed` and `review-system`'s `unwalkedPasses` is non-empty
- **THEN** the change's `next_command` is `/orbit:address-reviews <change>`, not
  `/orbit:archive <change> — user-invoked`, and archive stays eligible

#### Scenario: Walking the last slot's pass returns the phase command

- **WHEN** the only unwalked pass on a `passed` gate filled the cadence's last slot, and a walk record
  referencing it is written
- **THEN** the gate still reads `passed` and the change's `next_command` is the phase command again

#### Scenario: An unpassed gate with an unwalked SUGGESTION-only pass names the walk first

- **WHEN** cadence `[invoked, in-context]` has a fresh pass at T1 carrying only SUGGESTIONs, no pair
  launch, and no in-context pass
- **THEN** the gate reads `unpassed` with its reason unchanged, its `nextCommand` and the change's
  `next_command` are `/orbit:address-reviews <change>`, and after a walk record referencing T1 is
  written at T2 both are the in-context review

#### Scenario: A half-landed pair outranks the walk

- **WHEN** a pair launched at T1 has a fresh member at T2 carrying only SUGGESTIONs and no external
  return
- **THEN** the row carries `openPair: {missing: "external"}` and the canonical next is the external
  review, not the walk

#### Scenario: Walking an earlier slot's pass after the gate passed names the check it owes

- **WHEN** cadence `[invoked, in-context]` passed with a fresh pass at T1 carrying only SUGGESTIONs and
  an in-context pass at T2 — the walk the order named before T2 was not taken — and a walk record
  referencing T1 is written at T3
- **THEN** the gate reads `unpassed`, and the change's `next_command` is that gate's in-context
  command, not the walk and not the phase command

#### Scenario: A longer cadence can owe more than one review after an off-path walk

- **WHEN** cadence `[fresh, external, in-context]` passed with a fresh pass at T1 carrying only
  SUGGESTIONs, an external pass at T2 and an in-context pass at T3, and a walk record referencing T1
  is written at T4
- **THEN** the gate reads `unpassed` and the change's `next_command` is the external review; once it
  lands, an in-context review is still owed

#### Scenario: A gate past its phase never names the walk

- **WHEN** `review-proposal` holds an unwalked pass and its `before` phase, `apply`, has passed
- **THEN** the selection does not name the walk for that gate

### Requirement: A reviewed gate lists its outstanding passes

A reviewed gate whose state is `unpassed`, `stale` or `passed` — `superseded` being a flag on one of those, never a state of its own — SHALL report EVERY pass its resolution clause finds unresolved, not only the first: its status row carries `unresolvedPasses`, an array in token order (oldest first) of `{token, file, mode, source}` — `token` the pass's filename `<TS>` token, `file` its repo-relative path, `mode` its review mode, `source` `internal-review` or `external`. The array is `[]` when every pass is resolved. It is computed by the same predicate and the same pass set as the resolution clause of `Reviewed-gate pass condition — the computed convergence criterion`, so its first element is the pass the gate's `reason` names; a `passed` gate carries `unresolvedPasses: []` from its own return path. `reason`, the position readout and every human rendering are unchanged.

The row SHALL also carry `unwalkedPasses`, in the same shape and order: every pass in the resolution
clause's set that carries at least one finding of any severity, that no `address-reviews-*.json`
record's `source_path` references, and that is not in `unresolvedPasses`. It is `[]` when there is
none, and a `passed` gate computes it like any other, since a passed gate can still hold an unwalked
SUGGESTION-only pass. The gate's STATE never reads it — SUGGESTIONs never gate — while its canonical
next and the change's do (`Single-voiced canonical-next computation`), and severity, the reviewer's
consequence judgement, ranks a finding without deciding whether it is read. The two sets partition the
discovered passes as this table states (a change-mode pass, by what it carries and whether a walk
record references it):

| member | covered by |
|---|---|
| no findings at all | neither set: nothing to walk |
| a substantive finding, unresolved | `unresolvedPasses`: discovered, and it holds the gate |
| a substantive finding, resolved | neither set: walked |
| SUGGESTIONs only, no walk record references it | `unwalkedPasses`: discovered; the gate does NOT hold on it |
| SUGGESTIONs only, a walk record references it (fixed or deferred) | neither set: walked once is walked; deferral stays a recorded outcome |
| any finding, on a gate reporting `openPair` | listed as computed; the walk's `openPair` warning comes first (`orbit-address-reviews`) |
| a stale pass from an earlier iteration, SUGGESTIONs only, never walked | `unwalkedPasses`: the walk's pushback discipline suppresses stale findings with evidence |
| an external return carrying SUGGESTIONs only | the same rows: the trail reader's pass set is genre-blind |
| an audit-drift emit | not a gate pass: neither set (`orbit-address-reviews`' basename rule reaches it) |

Closure: DERIVED — (findings: none / SUGGESTIONs only / substantive) × (walked or not), plus the three
existing discovery paths it sits beside.

A walk of an `unwalkedPasses` entry is a walk like any other: clause (a)'s ordering rule makes a
following slot beat EVERY walk record of the previous slot's passes, at any severity, so a walk that
lands after the following slot's pass leaves that slot uncovered until a later pass of its class runs.
In the ordinary order (review, walk, then the following slot's pass) the walk already precedes it; the
rule bites only when the walk comes after.

When the gate's canonical next command names a walk because a pass is unresolved or unwalked, it SHALL be the change-scoped form `/orbit:address-reviews <change>`, naming no file: the walk discovers every listed pass, and the `openPair` warning applies (`orbit-address-reviews`' `Address-reviews command available`). A `--from-file` aim at one pass would walk one half and skip both. The blind-pair command that precedes it in the canonical-next order is unchanged.

When the gate's own pair diagnosis — the computation behind the `reason`'s pair note — finds the cadence's blind-pair slot open with a pairable member standing and the other class missing, however many members of the standing class there are — or an `invoked` slot in the state of the presentation table's row that sets `openPair` in `The first review slot covers what the user invoked` — the row SHALL also carry `openPair: {missing}`, `missing` `fresh` or `external`: the same fact the pair note states in prose, now a field a reader need not parse. Absent otherwise.

A `blocked` gate computes no resolution and carries none of the three fields. A `superseded` gate carries all three as computed; whether a reader acts on a superseded gate's list is the reader's rule (`orbit-address-reviews`' `Address-reviews command available` does not).

The fields REPORT; nothing new is ruled (R-crc-13). `orbit status --change <name> --json` carries them on the gate row, and `unresolvedPasses` with `unwalkedPasses` is the set the walk discovers.

#### Scenario: Two unresolved passes are both listed

- **WHEN** a `review-system` gate's trail holds a fresh pass at `T1` and an external return at `T2`, both with unwalked substantive findings
- **THEN** its row carries `unresolvedPasses` with two entries, `T1` first, `source` `internal-review` then `external`, and `reason` still names `T1`

#### Scenario: A resolved gate lists nothing

- **WHEN** every pass on a reviewed gate's trail is resolved
- **THEN** its row carries `unresolvedPasses: []`

#### Scenario: An open pair is a field

- **WHEN** a reviewed gate with cadence `[blind-pair, in-context]` holds a fresh pass and no external pass on the same state, so its blind-pair slot is open
- **THEN** its row carries `openPair: {missing: "external"}` beside the unchanged `reason`

#### Scenario: The walk next names no file

- **WHEN** a `review-proposal` gate's first unresolved pass is `review-proposal-T1.json` and no blind pair is open
- **THEN** its canonical next command is `/orbit:address-reviews <change>`, with no `--from-file`

#### Scenario: Two fresh passes and no external still report the open pair

- **WHEN** a reviewed gate with cadence `[blind-pair, in-context]` holds two pairable fresh passes and no external pass
- **THEN** its row carries `openPair: {missing: "external"}`

#### Scenario: A blocked gate carries none of the three fields

- **WHEN** `review-system` is blocked by an incomplete `apply`
- **THEN** its row carries no `unresolvedPasses`, no `unwalkedPasses` and no `openPair`

#### Scenario: An unwalked SUGGESTION-only pass is listed and does not hold

- **WHEN** a `review-proposal` gate's only pass carries two SUGGESTIONs and no walk record references it
- **THEN** its row carries that pass in `unwalkedPasses`, `unresolvedPasses: []`, and the gate's state
  is computed exactly as without the field

#### Scenario: A walk after the confirm moves the following slot's bar

- **WHEN** cadence `[invoked, in-context]` has a fresh pass at T1 carrying only SUGGESTIONs, a clean
  in-context pass at T2, and the gate passed; then a walk record at T3 references T1, deferring both
- **THEN** the in-context slot is uncovered, because T2 precedes the walk at T3, and the gate is
  unpassed until an in-context pass later than T3 runs

#### Scenario: A deferred SUGGESTION leaves the unwalked set

- **WHEN** a walk record referencing that pass defers both SUGGESTIONs
- **THEN** the row carries `unwalkedPasses: []`

### Requirement: The first review slot covers what the user invoked

An `invoked` cadence slot SHALL be covered by what the user INVOKED, never by what the user's
configuration prefers: a single independent pass that is not a pair member covers it at its own
token, and a COMPLETE pair (per `A pair's membership is computed from its launch`) covers it as one
unit at its later member's token. A pair, once launched, covers only when both members land, blind;
a pair ended by a walk of its landed half leaves that half covering as a single; a single fresh or
single external pass covers by itself. The ordering constraints of clause (a) of
`Reviewed-gate pass condition — the computed convergence criterion` apply to both forms unchanged.

`orbit/config.yaml` MAY carry `review_preference`, a map from reviewed-gate id to one of
`blind-pair` | `fresh` | `external`. It shapes ONLY the command the readout presents when nothing
covers the slot; it enters no coverage row, no state, no reason and no field other than
`nextCommand` and `nextSlot`, so a teammate's configuration can never re-grade a change. An absent
map or entry resolves to `blind-pair`, for each gate independently. An entry with any other value
warns, naming the gate and the value, and resolves to `blind-pair`. An entry whose key names no
reviewed gate of the active schema warns, naming the key, and is ignored. A `review_preference` that
is not a map warns and is ignored, as the `pr:` scalar's inert shapes are.

The slot's domain is this table (what covers the first slot, by what the user INVOKED, and what the
readout presents, per gate):

| member | covered by |
|---|---|
| nothing independent standing, preference `blind-pair` (the default) | presents the pair command, `/orbit:review --as <mode> --reviewer blind-pair <change>` (`orbit-review`'s `The blind-pair reviewer runs both halves in one invocation`); the pair it launches covers only when both halves land |
| nothing standing, preference `fresh` or `external` | presents that class's single invocation |
| preference absent | `blind-pair`, for each gate independently |
| preference an unknown value | warns and resolves to `blind-pair`, as the `pr:` scalar's inert values warn and resolve to `never` |
| a pair INVOKED, both halves landed, blind | covers the slot as one unit; the in-context slot follows the walks of BOTH members |
| a pair INVOKED, one half landed | NOT covered: `openPair: {missing}` presents the partner; a walk warns first (`orbit-address-reviews`' discovery row 4) |
| a pair INVOKED, its landed half walked before the partner lands | the pair ENDS: the walked half covers the slot as a single, the user having walked past the walk's warning |
| a pair INVOKED, the partner never lands and the user wants to proceed | re-run the missing half, or walk the landed half (which ends the pair; a landed half carrying no finding has nothing to walk, so instead a further review of its class lands as a single and covers), or the recorded `continuation`/`proceed` judgement at the gate's seam; the gate keeps reporting its computed state |
| a single fresh or single external INVOKED, landed | covers the slot |
| two singles invoked separately on one state | the first covers the slot; the second is an extra independent pass whose findings clause (b) still requires resolved |
| how the engine knows a pass was invoked as a pair member | `A pair's membership is computed from its launch` |

Closure: BOUNDED — the invocation forms are the four `--reviewer` values (the three classes and the
pair) plus the preference's two fallbacks; pair membership is the launch requirement's record. Revised
from the exploration's table in two rows: walking a pair's landed half ENDS the pair rather than
breaking it, so the walked half covers as a single and walking is one more way to proceed. The default
preference's row presents the pair command; it presented the fresh review until a command ran a pair.

**Named limit.** Residual kind: a pass whose pair membership the trail cannot decide (a single invoked while a pair launch stands open)
Residual method: D-bpc-10's residual slots carry it — the residual and its method are stated in `A pair's membership is computed from its launch`.

When the deepest uncovered slot is `invoked`, read at the canonical lower bound (the lowest bound
that reaches it, per `Single-voiced canonical-next computation`), the latest launch of the gate's mode
decides the reason, the slot's command and `nextSlot`, rows tested in order. The slot's command is the
gate's canonical next unless an earlier step of that requirement's order applies: the open pair's
missing member (this table's second row, which is that step), or the walk when a pass is unresolved
or unwalked. A member has LANDED when
the membership table below names it, stale or not; a landed member is USABLE on this state when it is in
the fresh pass list (per the freshness rule) and above the bound. A pair whose latest launch ENDED is the
last row.

| state at the bound | reason | slot's command | `nextSlot` |
|---|---|---|---|
| PAIR-OPEN, one member landed, stale | `pair launched at <L> cannot fill this slot: its <class> member is stale (an apply landed after it); a further <class> review lands as a single` | the landed member's class's review | the landed member's class |
| PAIR-OPEN, one member landed, usable | `pair launched at <L> is open: the <class> member has no <missing> partner; run it before walking these findings` | the missing class's review | the missing class |
| PAIR-OPEN, one member landed, at or below the bound | `pair launched at <L> cannot fill this slot: its <class> member sits at or below the slot's bound; a further <class> review lands as a single` | the landed member's class's review | the landed member's class |
| PAIR-OPEN, no member landed, a pass sharing the launch's token | `pair launched at <L> ambiguous: the <class> pass sharing its token may have preceded it; a further <class> review lands as its member` | the tied pass's class's review | the tied pass's class |
| PAIR-OPEN, no member landed | `pair launched at <L>: neither member has landed; both must land before either is walked` | the fresh review | `fresh` |
| both landed, usable, sharing a token | `pair launched at <L> ambiguous: its two members share a timestamp token` | the preference's command | the presented command's class |
| anything else: NO-LAUNCH, an ENDED pair, or a complete pair with a member stale or at or below the bound | `no outside review stands on this state` | the preference's command | the presented command's class |

`openPair` is set on the second row only. Where several passes share the launch's token, `<class>` is the
first by findings-artifact filename. `<L>` is the launch's token. The fresh review is
`/orbit:review --as <mode> --fresh <change>`, the external review
`/orbit:review --as <mode> --reviewer external <change>`, and the pair command
`/orbit:review --as <mode> --reviewer blind-pair <change>`, whose presented class — the `nextSlot` value and the
`models:` hint key — is `blind-pair`.

#### Scenario: A single fresh pass covers the invoked slot

- **WHEN** a `review-proposal` gate with cadence `[invoked, in-context]` has a fresh pass at T1, no
  pair launch, and an in-context pass at T2 later than every walk of T1
- **THEN** the gate's coverage holds, with T1 covering the `invoked` slot alone

#### Scenario: A single external pass covers the invoked slot

- **WHEN** the same gate has an external return at T1 instead, and no pair launch
- **THEN** T1 covers the `invoked` slot alone

#### Scenario: An invoked pair with one half landed does not cover

- **WHEN** a `review-system` gate with cadence `[invoked, in-context]` has a pair launch at T1 and a
  fresh pass at T2, and no external return after T1
- **THEN** the `invoked` slot is uncovered, the row carries `openPair: {missing: "external"}`, and the
  canonical next is `/orbit:review --as system --reviewer external <change>`

#### Scenario: The preference changes only the presented command

- **WHEN** nothing covers a gate's `invoked` slot, no pass is unresolved or unwalked, and `review_preference` maps that gate to
  `external`, to `fresh`, to an unknown value, or is absent
- **THEN** the canonical next is the external review, the fresh review, the pair command with a
  warning, and the pair command respectively; the gate's state, its reason and every field other
  than `nextCommand` and `nextSlot` are identical across the four

#### Scenario: The preference never re-grades a covered slot

- **WHEN** a single fresh pass covers a gate's `invoked` slot and `review_preference` maps the gate to
  `blind-pair`
- **THEN** the slot stays covered; the preference is read only where nothing covers it

#### Scenario: The default preference presents the pair command

- **WHEN** nothing covers a `review-system` gate's `invoked` slot, no pair launch is open, no pass is unresolved or unwalked, and `review_preference` is absent
- **THEN** the canonical next is `/orbit:review --as system --reviewer blind-pair <change>` and `nextSlot` is `blind-pair`

### Requirement: Gate-aware status and instructions with position readout

`orbit status --change <name>` (the per-change form; bare `orbit status` is the orientation surface per `orbit-orientation` — D-arc Stage D3) SHALL render gate rows (state: `blocked | ready | passed | stale | unpassed`, with
reasons, plus the RECORDED SPEND on a reviewed gate) alongside artifact rows, and a one-line
POSITION READOUT of the canonical flow (e.g.
`propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate`).

**THE TWO GATE-ROW SURFACES DIFFER DELIBERATELY, and the split is normative.** The HUMAN row
renders `independentSpend` ALONE — never beside the declaration, never composed with it. The JSON
projection carries the optional `budget` declaration and `independentSpend` as SEPARATE named
fields, composing neither, and OMITS either key entirely when its value is absent rather than
emitting it undefined-valued: an in-process consumer testing key presence must not be told a gate
declares a budget it does not.

Each position-readout step token is a gate id or lifecycle-phase token (`propose`, `review(proposal)`,
`apply`, `review(system)`, `archive`); a gate step renders its computed state (`✓` passed, `STALE`,
`ready`, `blocked-by-gate`, `unpassed` — there is NO spend-derived token, because no
token may make a recorded cost read as a verdict (the retired forms were `unpassed BUDGET-SPENT`
and `STALE BUDGET-SPENT`), or `(past)` for a superseded gate). **Superseded gates**: a
`reviewed` gate that has NOT passed and whose `before` names a GATE that has passed (e.g.
`review-proposal` after `apply` has passed) is no longer the active frontier — it gated ENTRY to a
phase that has since run. The test is on gate ids only (rc18): a `before` naming an artifact, a
lifecycle phase that is not a gate (`archive`), or nothing never marks a gate superseded, whether or
not that artifact is complete. Such a gate
is marked SUPERSEDED (distinct from `passed`: it may never have converged; the flow simply advanced
past it), renders as `(past)`, and is SKIPPED by the single-voiced canonical-next computation so the
recommendation advances to the next actionable gate rather than re-surfacing a moot earlier one.
Step order follows the gate graph's `requires`/`before` edges; ties broken by declaration order in
the schema YAML (v1 relies on declaration order matching flow order, as the shipped `spec-driven`
schema does). `orbit instructions` for a phase whose gate is unpassed SHALL return a `blocked-by-gate`
state carrying the gate id, the human-readable reason, and the canonical next command. JSON outputs
carry the same fields for downstream readers.

#### Scenario: Status shows the position readout

- **WHEN** `orbit status --change <name>` runs on a gated schema
- **THEN** the output includes the position readout and per-gate rows with reasons

#### Scenario: A before naming an artifact never marks a gate superseded

- **WHEN** a reviewed gate declaring `before: tasks` (an artifact, not a gate) is unpassed and `tasks` is complete
- **THEN** the gate carries no `superseded` flag, its position token is its computed state rather than `(past)`, and
  its own canonical command can be the change's next

#### Scenario: An undeclared budget is absent as a KEY, not merely as a JSON value

- **WHEN** a gate declaring no `budget` is projected to the gate-status row
- **THEN** the row carries NO `budget` key at all — `Object.hasOwn(row, 'budget')` is false, so an
  in-process consumer testing key presence is never told a gate declares what it does not; JSON
  hiding an undefined value is not sufficient

#### Scenario: Spend never renders a position token

- **WHEN** an unpassed reviewed gate's independent spend has reached or exceeded its declared budget
- **THEN** its gate row carries `state: "unpassed"` with `independentSpend` reporting the figure,
  its reason names only the clause that failed, and its position token reads `unpassed` — no
  spend-derived token exists, because a recorded cost must never read as a verdict

#### Scenario: Instructions surface blocked-by-gate

- **WHEN** `orbit instructions apply --change <name> --json` runs while `review-proposal` is
  unpassed AND no task has been checked yet (apply has not started)
- **THEN** the JSON includes `state: "blocked-by-gate"`, the gate id, the reason, and
  `next_command` (the canonical full invocation)

#### Scenario: blocked-by-gate is entry-gated, not a mid-apply re-block

- **WHEN** `orbit instructions apply` runs while `review-proposal` is unpassed/stale BUT one or more
  tasks are already checked (implementation is underway)
- **THEN** the state is `ready` (not `blocked-by-gate`): the gate gates ENTRY to apply and is checked
  only before the first task is completed. Post-apply the `review-proposal` pass goes stale relative
  to the `apply-*.json` emit (expected + moot per the v1 freshness scope) and the gate has already
  served its purpose, so mid-apply continuation is never re-blocked. Apply-parity holds throughout:
  even at entry the gate NEVER hard-blocks — the consuming skill prompts (address / proceed-anyway /
  abort) and records the override on proceed-anyway.
