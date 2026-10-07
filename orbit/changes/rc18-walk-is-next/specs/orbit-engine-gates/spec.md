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

**The change's next is selected over the gates in flow order (rc18).** The per-gate commands above
supply it, and the change-level selection visits the gates in the order the position readout uses
and takes the FIRST row of this table that yields a command. A reviewed gate is the FRONTIER while
its `before` phase is not yet complete. That is the negation of the superseded test in `Gate-aware
status and instructions with position readout`, applied to a `passed` gate, which is never marked
superseded. When no gate yields a command, the flow-latest `passed` gate's own command is the next,
so the eligibility line never goes silent at a lifecycle seam:

| member | covered by |
|---|---|
| ungated schema | no gate rows; no command from this selection |
| tracked gate `ready` | the apply command (with ` — user-invoked` when the gate declaring `before: apply` is consent-marked) |
| tracked gate `passed` | nothing; selection continues |
| reviewed gate `blocked` | nothing from this selection; it carries no `unwalkedPasses` |
| reviewed gate `unpassed` or `stale`, not superseded | its canonical command as computed above; its unwalked passes are already discovered by the walk it may name |
| reviewed gate superseded | skipped; its unwalked passes are not recommended |
| reviewed gate `passed`, frontier, `unwalkedPasses` non-empty | `/orbit:address-reviews <change>`, naming no file; no ` — user-invoked` marker; its hint keys are the gate's phase id, as for the unresolved-pass walk |
| reviewed gate `passed`, frontier, `unwalkedPasses` empty | nothing; selection continues, and the gate's own command is the phase command |
| reviewed gate `passed`, not the frontier | nothing; selection continues |

Closure: DERIVED — reviewed state (`blocked` / `unpassed` / `stale` / `passed`) × superseded ×
frontier × an empty or non-empty unwalked set, where `passed` is never superseded, so only its
frontier split applies, plus the two tracked-gate states and the ungated schema the selection also
visits. A passed frontier gate's own row `nextCommand` SHALL equal the command its table row yields,
computed by the SAME predicate, so the row and the change never name different commands. The walk
moves the RECOMMENDATION only: the gate's state, its reason and the next phase's eligibility are
unchanged, because SUGGESTIONs never gate. Walking an unwalked pass can still un-pass the gate. A walk
of a pass that filled an earlier slot, written after the following slot's pass, raises that slot's
ordering bar (`A reviewed gate lists its outstanding passes`), and the next is then the `unpassed`
row's command. That cost is bounded: the trailing slot is the cadence's last, and a walk of the last
slot's pass raises no bar.
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

#### Scenario: Walking an earlier slot's pass after the gate passed names the check it owes

- **WHEN** cadence `[invoked, in-context]` passed with a fresh pass at T1 carrying only SUGGESTIONs and
  an in-context pass at T2, and a walk record referencing T1 is written at T3
- **THEN** the gate reads `unpassed`, and the change's `next_command` is that gate's in-context
  command, not the walk and not the phase command

#### Scenario: A gate past its phase never names the walk

- **WHEN** `review-proposal` holds an unwalked pass and its `before` phase, `apply`, has passed
- **THEN** the selection does not name the walk for that gate

### Requirement: A reviewed gate lists its outstanding passes

A reviewed gate whose state is `unpassed`, `stale` or `passed` — `superseded` being a flag on one of those, never a state of its own — SHALL report EVERY pass its resolution clause finds unresolved, not only the first: its status row carries `unresolvedPasses`, an array in token order (oldest first) of `{token, file, mode, source}` — `token` the pass's filename `<TS>` token, `file` its repo-relative path, `mode` its review mode, `source` `internal-review` or `external`. The array is `[]` when every pass is resolved. It is computed by the same predicate and the same pass set as the resolution clause of `Reviewed-gate pass condition — the computed convergence criterion`, so its first element is the pass the gate's `reason` names; a `passed` gate carries `unresolvedPasses: []` from its own return path. `reason`, the position readout and every human rendering are unchanged.

The row SHALL also carry `unwalkedPasses`, in the same shape and order: every pass in the resolution
clause's set that carries at least one finding of any severity, that no `address-reviews-*.json`
record's `source_path` references, and that is not in `unresolvedPasses`. It is `[]` when there is
none, and a `passed` gate computes it like any other, since a passed gate can still hold an unwalked
SUGGESTION-only pass. The gate's STATE never reads it — SUGGESTIONs never gate — while the change's
canonical next does (`Single-voiced canonical-next computation`), and severity, the reviewer's
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

When the gate's canonical next command names a walk because a pass is unresolved, it SHALL be the change-scoped form `/orbit:address-reviews <change>`, naming no file: the walk discovers every listed pass, and the `openPair` warning applies (`orbit-address-reviews`' `Address-reviews command available`). A `--from-file` aim at one pass would walk one half and skip both. The blind-pair command that precedes it in the canonical-next order is unchanged.

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
