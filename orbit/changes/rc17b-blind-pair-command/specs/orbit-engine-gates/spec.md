## MODIFIED Requirements

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
decides the reason, the canonical next and `nextSlot`, rows tested in order. A member has LANDED when
the membership table below names it, stale or not; a landed member is USABLE on this state when it is in
the fresh pass list (per the freshness rule) and above the bound. A pair whose latest launch ENDED is the
last row.

| state at the bound | reason | canonical next | `nextSlot` |
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

- **WHEN** nothing covers a gate's `invoked` slot, and `review_preference` maps that gate to
  `external`, to `fresh`, to an unknown value, or is absent
- **THEN** the canonical next is the external review, the fresh review, the pair command with a
  warning, and the pair command respectively; the gate's state, its reason and every field other
  than `nextCommand` and `nextSlot` are identical across the four

#### Scenario: The preference never re-grades a covered slot

- **WHEN** a single fresh pass covers a gate's `invoked` slot and `review_preference` maps the gate to
  `blind-pair`
- **THEN** the slot stays covered; the preference is read only where nothing covers it

#### Scenario: The default preference presents the pair command

- **WHEN** nothing covers a `review-system` gate's `invoked` slot, no pair launch is open, and `review_preference` is absent
- **THEN** the canonical next is `/orbit:review --as system --reviewer blind-pair <change>` and `nextSlot` is `blind-pair`
