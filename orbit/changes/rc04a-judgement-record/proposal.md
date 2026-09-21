# Proposal: rc04a-judgement-record

## Why

The cadence produces two judgements and records one of them unevenly.

WALK decisions already have a structured home. Nine of them across rc02c's cycle carry
`ratified_via`; five carry a `recommendation_fork` and five a verbatim `resolution`, which are
COMPLEMENTARY by design rather than incomplete — `orbit-address-reviews` makes `resolution`
required only when the ratified direction is off-menu or no fork was detected, so five plus five
minus one overlap is exactly the nine. The capability was built for this shape. READINESS-shaped judgements have no home
at all. *"Buy a scoped external pass over an already-passed gate"* — the clearest readiness call of
that entire cycle, and the one that found the walk-authored mechanism nobody independent had read —
lives in a T0 emit's `final_assessment` as prose, indistinguishable from any other sentence in a
paragraph and readable back by nothing.

The cost of that asymmetry is measurable rather than theoretical. rc02c archived through a computed
PASSED gate carrying **SIX residual-risk entries — 3,333 characters of free prose** — in the
archive emit's `warnings` array, a field whose own schema example is
`"Archived with 2 incomplete artifacts"`. Three of those six existed earlier in the cycle as
judgements and had to be REWRITTEN at the seam, because there was nothing structured to render
from. And the terminal judgement — whether the AI believed the work was ready — was **never written
down anywhere**. It exists only as the fact that someone archived.

R-crc-11(g) says a cadence ends when the AI judges the work ready *knowing what came back*. That
belief is not observable and this change does not pretend otherwise. **ORDERING is.** A readiness
record must POST-DATE the independent passes it cites, and an engine can refuse one that does not —
which is the whole of what is mechanized here, per R-crc-10.

## What Changes

- **A structured judgement record under the payload key `judgements`, an ARRAY.** One spine, two
  kinds; an array because one archive emit can legitimately carry both a continuation and a
  readiness record. Every entry carries `kind`
  (`continuation` | `readiness`), a NON-EMPTY `formed_against` list of independent pass TOKENS, a
  kind-varying `disposition`, prose `reasoning`, and `ratified_by` (`ai` | `user`).
- **`kind: continuation`** — formed mid-cadence, *given what came back, what next?* Dispositions
  are `proceed` (past a gate that says no — carrying `gate`, `gate_state`, `gate_reason`) and
  `spend` (buy a further independent pass past a gate that says yes, which has no home today at
  all).
- **`kind: readiness`** — formed at the cadence's end. Dispositions are `ready` and `not-ready`,
  and it carries `accepted: [{claim, why}]` — the residuals are the assertion's CONTENT, not peer
  judgements.
- **ONE computed rule about the record's RELATION TO ITS EVIDENCE.** Every token in
  `formed_against` MUST precede the record's own timestamp, or the write gate REFUSES the emit with
  a named error. The engine never judges whether the AI was RIGHT to be ready; it refuses a claim
  that could not have been informed. Two further refusals are about the record's SHAPE and LOCATION
  rather than its evidence, and both are there because the alternative is a contract that behaves
  like a comment: the CLOSED carrier table is enforced by kind as well as by command, and a
  `continuation/proceed` coexisting with `gate_overridden` must AGREE with it field for field — a
  narrowly-scoped constraint that retires with `gate_overridden` in rc04c.
- **`ratified_by` is REQUIRED**, because the difference between the AI's own belief and a
  user ratification has to be STATED rather than inferred from context that will not survive.
- **A `not-ready` record RECORDS and never BLOCKS**, and it gets a READER: the archive completion
  readout states it. A record nothing consumes is the failure this stage's parent charter names in
  its own exit criterion.
- **No new trail location.** Verified against rc02c's archived trail: every qualifying judgement
  already lands on an emit that exists — `continuation/proceed` on apply and archive,
  `continuation/spend` on the `review-external` T0 emit written at exactly the moment that decision
  is taken, `readiness` on archive. The ROUTING case, where a cadence ends by sending work back to
  architecture instead of archiving, is deliberately NOT carried here: the archive completion
  readout is the single reader that keeps this record from being write-only, and the routing case
  has no archive to read it. Carrying it would ship exactly the write-only record this change
  condemns.

**What this change does NOT do**, because the split declared it elsewhere: it does not make
independent passes emit a forward recommendation (`rc04b-forward-recommendation`), and it does not
retire `gate_overridden` (`rc04c-retire-gate-overridden`). `gate_overridden` keeps being written
until rc04c; that coexistence is the split's accepted and bounded cost, named in the architecture
doc rather than discovered later.

## Capabilities

### New Capabilities

None. The record is a field shape on emits that already exist, validated by a write gate that
already exists. Inventing a capability for it would be the two-capabilities-one-rule defect this
program keeps catching.

### Modified Capabilities

- `orbit-emit-composition`: the write gate gains the ORDERING refusal — a record whose
  `formed_against` cites a token at or after its own timestamp is refused, materialize-first, with
  a named error. The payload tables gain the judgement fields for three commands.
- `orbit-run-summary-emit`: two ADDED requirements — the record's shape, and the CLOSED set of
  three emits that may carry it (`apply` and `review-external` admit `continuation`; `archive`
  admits BOTH kinds, since `review-system` is overridden there and the cadence ends there). The
  spine requirement is NOT modified: placement is its own requirement rather than an insertion into
  the spine, which keeps the delta ADDED-only.
- `orbit-archive-modifications`: the archive emit carries the terminal `readiness` record, and the
  completion readout STATES a `not-ready` disposition — the reader that keeps the record from being
  write-only.

## Impact

- **Nothing is removed and nothing changes behaviour that exists today.** `gate_overridden` is
  untouched here; the new record is additive, and the two coexist by design until rc04c.
- **The write-gate refusal is the only new failure mode**, and it can only fire on a record this
  change introduces. No existing emit can newly fail: records without a `formed_against` field are
  not judgement records and are not checked.
- **Exit criterion (3) of the parent charter finally has something to check.** `gate_overridden`
  cites its pass in PROSE — `"latest independent pass has 6 CRITICAL"` — so no ordering check could
  ever have run against it. Citation BY TOKEN is what makes the constraint real rather than
  aspirational.
- The archived rc02c trail is the acceptance fixture: its six `warnings` entries are the concrete
  thing this record has to structure. Re-derived under the shipped qualifying test: TWO are `accepted`
  pairs, THREE are process notes correctly staying in `warnings`, and ONE — the size overage — is a
  method call misfiled in `warnings` today, which the new shape makes visible.
