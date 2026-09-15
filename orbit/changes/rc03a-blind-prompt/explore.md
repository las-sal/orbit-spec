> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc03a-blind-prompt

## Premise

Two archived requirements cannot both hold. `orbit-review-external`'s `Cycle context populated
from prior runs` SHALL-includes "prior findings (open and resolved)" in every external prompt.
`orbit-engine-gates` requires a `blind-pair`'s two members to be blind to each other. The gate's
blindness predicate checks only for a WALK recorded between the two passes' tokens, so a pair
anchored through its PROMPT is certified blind — and the engine's own canonical next command
(`gates.ts:878`: an empty `blind-pair` slot renders `--fresh`) is the path that produces it.

rc02's pair escaped by ordering luck: its external prompt was written 24 minutes before the fresh
pass existed, recording "Prior internal findings still open: 0". The only measurement this program
has produced — zero CRITICAL overlap, ~60% residual — survives because the operator did not do
what the tool said.

The question this stage answers is not "delete a bullet". It is: **what does a review prompt owe a
reviewer, as a function of what kind of pass the reviewer is running?** Cycle context is CORRECT
for a sequential iteration reviewing what the last pass found, and WRONG for a blind-pair member.

R-crc-7 is applied by hand again (rc13 has not shipped): mechanism written and executed once
before anything is specified.

## Mechanism

### The rule

The external-handoff branch reads `next_hint_keys.slot` from
`orbit status --change <name> --json` — a call the branch DOES NOT MAKE today (corrected
2026-09-15; `review.ts:288-496` contains no `orbit status` invocation) — and renders the Cycle
context section conditionally:

```
SUPERSEDED 2026-09-15 by D-rc03a-9 — kept as the record of a mechanism that did not survive.
The rule below keyed on `next_hint_keys.slot` and suppressed per site:

  slot == 'blind-pair'   →  cycle context is SUPPRESSED
  slot != 'blind-pair'   →  today's content, unchanged
  slot unavailable       →  SUPPRESSED (fail closed — see D-rc03a-3)

It failed three ways, each found by a pass rather than by this file: the slot is scoped to the
first unpassed gate rather than the reviewed mode; the empty-pair branch it relied on sits
downstream of the resolution clause, so an absent slot does not mean no pair is forming; and
suppression-per-site cannot cover eleven channels, one of which has no artifact (Case 3).

THE MECHANISM OF RECORD IS NOW: canonical-next renders the EXTERNAL half first for an empty
blind-pair slot, and the fresh half's system-mode diff excludes the change's `.orbit-runs/`.
Blindness by timing, not by instruction — see Case 4.
```

No engine change is required for detection. `canonicalNextForReviewed` already returns
`slot: 'blind-pair'` from BOTH the open-pair branch (`gates.ts:857-863`, one member standing) and
the empty-pair branch (`gates.ts:868-878`, neither standing). The branch that packages the prompt
simply never asks.

### Case 1 — run the rule against every slot state the cadence can produce (2026-09-15)

**Input**: the four states a `review-system` gate reaches, plus `review-proposal`'s cadence
(`[independent, in-context]`, which has no pair at all).

**Procedure**: for each, read what `canonicalNextForReviewed` returns as `slot`, apply the rule,
and judge whether the resulting prompt is correct for that reviewer.

**Output**:

| gate state | `slot` | rule fires? | prompt is… |
|---|---|---|---|
| system, no passes stand (rc02 at 09:42) | `blind-pair` (empty-pair branch) | suppress | CORRECT — this is the pair's first member |
| system, fresh half landed (the leak path) | `blind-pair` (open-pair branch) | suppress | CORRECT — this is the pair's second member, the case that anchors today |
| system, pair complete + walked, confirming pass | `in-context` | retain | CORRECT — a confirming pass SHOULD see what came before |
| system, budget spent (rc02 at archive) | `in-context` | retain | CORRECT — same; exhaustion is reported BESIDE the state and does not determine the slot |
| proposal mode, any external pass | `independent` | retain | CORRECT — proposal's cadence has no pair, so no blindness requirement exists |
| ANY mode, a prior pass's findings stand unwalked | ABSENT | retain (after D-rc03a-7) | the unresolved-findings branch returns no `slot` key (`gates.ts:864-866`); this is the NORMAL state between a review and its walk |
| ANY mode, every gate passed | ABSENT | retain (after D-rc03a-7) | `next_hint_keys` is `{phase}` with no slot (`instruction-loader.ts:463-471`) |

**CORRECTED 2026-09-15** by the first fresh proposal pass. Rows 3 and 4 originally read `external`;
the next uncovered slot after a walked pair under `[blind-pair, in-context]` is `in-context`, and
`external` arises only from the confirm-failure branch. The last two rows were MISSING ENTIRELY —
and their absence is exactly what let D-rc03a-3's fail-closed default ship as if undeterminable
slots were rare. The verdicts for rows 3-4 were unaffected, which is why the error survived: a
table can be wrong in a cell and right in its conclusion, and only the omitted rows mattered.

**Finding — the rule is correct on all five and needs no new engine surface.** It also fixes the
case rc02 escaped by luck: at 09:42 the slot was `blind-pair` (zero passes standing), so the rule
would have suppressed cycle context whether or not the fresh half had already landed. Blindness
stops depending on the order the operator happened to choose.

### Case 2 — is the leak bilateral? (2026-09-15)

**Input**: the review body's Step 5 and the internal-class branches.

**Procedure**: trace what each half reads when it runs SECOND.

**Output**:

```
fresh first → external second   external-handoff Step 5 reads the most-recent
                                review-<mode>-*.json — which IS the fresh half's emit   LEAK

external first → fresh second   review body Step 5 matches review-<mode>-*.json ONLY;
                                external findings live in external-<as>-*.md, and the
                                internal-class branches never load external-handoff.md   NO LEAK
```

**Finding — the leak is ONE-DIRECTIONAL, and the engine's default recommendation is the leaking
order.** An empty `blind-pair` slot renders `--fresh` (`gates.ts:878`), so external is always the
second half on the default path. The safe order is the one rc02 took by accident.

**Consequence — the cheap fix is a mitigation, not a fix.** Swapping the recommendation to
external-first would make the default path safe in one line with no requirement change. It is
still an ORDERING DISCIPLINE: a user who runs fresh first gets the leaking path, and the fresh
half's immunity is INCIDENTAL (it holds only because Step 5's glob happens not to match
`external-*.md`; any future "read prior external findings for pushback" reopens it). rc03a exists
because rc02 survived on exactly this kind of luck. The swap is worth taking as immediate
hardening; it is not the deliverable.


### Case 3 — enumerate EVERY channel, from source (2026-09-15)

**Input**: `src/core/templates/workflows/review.ts`, grepped for every instruction that points a
reviewer at prior findings or at the change's trail.

**Procedure**: read each hit; classify by which half receives it.

**Output — eleven channels, not one:**

| # | half | channel | site |
|---|---|---|---|
| 1 | external | cycle context — prior internal findings | `review.ts:344` |
| 2 | external | cycle context — prior external findings | `:345` |
| 3 | external | cycle context — resolved-since | `:346` |
| 4 | external | iteration count reads `external-*.md` and its `**Reviewer**:` field | `:334`, `:352` |
| 5 | external | project-context reading-list pointer at `.orbit-runs/` | `:573` |
| 6 | external | write-path: "pick a fresh timestamp so this file doesn't overwrite prior reviews" | `:594-599` |
| 7 | external | system mode: `git diff <change-start>..HEAD` | `:528` |
| 8 | fresh | Step 5 prior-run read | `:783` |
| 9 | fresh | disciplines epitome's pushback comparison | `:727` |
| 10 | fresh | system mode: `git diff <change-start>..HEAD` | `:778` |
| 11 | fresh | **the launching brief — no artifact at all** | — |

**Finding — every channel is the same instruction wearing different clothes: READ THE CHANGE'S OWN
HISTORY.** That settles the shape question. Deny-listing eleven prose sites is not a design, it is
a chore that rots on the next body edit — and #11 cannot be denied at all, because there is no file
to edit. THIS ENUMERATION IS THE WORK THAT WAS NEVER DONE: the change claimed to close "every
channel" across two proposal passes while having enumerated none.

### Case 4 — run each ORDER against the channel list (2026-09-15)

**Input**: the eleven channels, and the two possible orders for a pair.

**Procedure**: for each order, ask of each channel whether the partner's findings EXIST at the
moment that channel is read.

**Output**:

```
FRESH FIRST (the engine's current default, gates.ts:878)
  T0  fresh runs        → lands review-system-<TS>.json
  T1  external prompt   → channels 1,2,3,5,6,7 ALL OPEN — the partner's
                          findings exist and every one of those sites reads them
  ............................................................ 6 channels open

EXTERNAL FIRST
  T0  external prompt   → nothing on the trail; channels 1-7 have nothing
                          to read. Not suppressed — EMPTY.
  T1  external findings land as external-<as>-<TS>.md
  T2  fresh half runs   → Step 5 (8) and the epitome (9) match
                          review-<mode>-*.json ONLY, so external-*.md is
                          invisible to both. git diff (10) WOULD see it if
                          committed.
  ............................................................ 1 channel open
```

**Finding — ordering does not SUPPRESS the channels, it EMPTIES them.** Blindness by timing rather
than by instruction: at T0 the partner's findings do not exist, so there is nothing for six sites
to leak. One residual remains — the fresh half's system-mode diff — closable with a single path
exclusion. Eleven prose edits and one unclosable brief, versus one ordering change and one
exclusion.

**And it retires channel 11.** The launching brief has no artifact to constrain, but under
external-first the orchestrator holds nothing to leak at the moment it dispatches the fresh half —
except what the diff exclusion also covers.

## Decisions

- **2026-09-15 — D-rc03a-9: the fix is ORDERING plus ONE EXCLUSION; the deny-list shape is
  abandoned** (ratified in chat by Sal, 2026-09-15, after the second fresh pass). Canonical-next
  renders the EXTERNAL half first for an empty `blind-pair` slot, and the fresh half's system-mode
  diff instruction excludes `orbit/changes/<name>/.orbit-runs/`. That is the whole mechanism.
  Capabilities: `orbit-engine-gates` (the order) + `orbit-review` (the exclusion) — TWO, and
  `orbit-review-external` DROPS OUT of the change entirely.
  **Why the previous shape was abandoned rather than repaired**: it tried to suppress, site by
  site, a class of instruction that appears in eleven places and grows with every body edit, one
  of which has no artifact behind it. Case 4 shows ordering closes ten of the eleven by making the
  partner's findings NOT YET EXIST, which no amount of prose can do.
  **I rejected this twice before enumerating** — first as "a discipline, not a fix", then as
  "obsoleted by D-rc13-4". Neither survives Case 3. It is not a discipline when the ENGINE renders
  the order in its canonical-next; the user runs what the tool says. And it is not obsoleted,
  because it is the only mechanism that addresses all channels at once rather than one at a time —
  D-rc13-4's launcher makes it free, it does not make it unnecessary.

- **2026-09-15 — D-rc03a-10: the property being delivered is R-crc-4's "blind to EACH OTHER", not
  "blind to all prior history"** (settled under R-crc-3, and this is a DESCOPE). D-rc03a-4 argued
  for the stronger property on capture-recapture grounds — priming both members on a common prior
  frame inflates overlap. That reasoning stands, but the stronger property is MINE, not the
  ruling's, and it is what generated the eleven-channel problem: blinding a pair to each other is a
  timing fact, while blinding it to all history is a censorship problem with no closed boundary.
  Under ordering, an iteration-2 pair still sees iteration 1's WALKED findings — legitimate history
  both members share — and that is exactly what R-crc-4 asks for. The residual inflation is a
  KNOWN, NAMED limit for rc04's residual estimate to discount, not a defect this stage chases.

- **2026-09-15 — D-rc03a-11: the genre SIGNAL problem dissolves and is not solved here**
  (settled under R-crc-3). `next_hint_keys.slot` failed for two independent reasons the second
  fresh pass found: it is scoped to the FIRST UNPASSED gate rather than the gate matching the
  invoked mode (so a system-mode pair run while `apply` is `ready` reads no slot at all), and the
  empty-pair branch that the non-leak proof cited sits downstream of the resolution clause (so
  "pair empty" does not imply "slot rendered"). No conjunction repairs either. Under D-rc03a-9
  nothing needs to infer the genre: the ENGINE chooses the order, and neither body branch asks a
  question about what kind of pass it is. The per-gate `nextSlot` already exists on the gate object
  (`gates.ts:33,839`) and is simply not projected into the status rows — worth exposing WHEN
  something needs it, which after this change nothing does.


- **2026-09-15 — D-rc03a-7: the rule keys on a CONJUNCTION and fires only on a POSITIVE signal;
  D-rc03a-3's fail-closed default is REVERSED** — **SUPERSEDED by D-rc03a-9/D-rc03a-11: the conjunction's first term was unusable. Its non-leak proof was FALSE — the empty-pair branch it cites sits downstream of the resolution clause, so "pair empty" does not imply "slot rendered".** (ratified in chat by Sal, 2026-09-15, after the
  first fresh proposal pass). Withhold when `slot == 'blind-pair'` AND the INVOKED reviewer class
  is independent (`fresh` or `external`). Otherwise retain. No fail-closed branch.
  **What was wrong**: `next_hint_keys.slot` answers "what does the engine recommend NEXT", not
  "what is the pass in hand". Those coincide while a pair is open and diverge everywhere else, so
  the original single-key rule failed two ways at once — it withheld from sequential iterations
  whenever the slot was ABSENT (the routine state between a review and its walk, and the
  all-gates-passed state), and it blinded `in-context` passes during the pair window even though an
  in-context pass can never satisfy a blind-pair slot and is, per rc03's charter, the VERIFICATION
  genre that most needs prior context.
  **Why positive-only does not leak**: a pair member can only be run in two states — pair empty, or
  pair open. The empty case renders `blind-pair` from the `neededSlot` branch; the open case renders
  it from the `openPair` branch, which rc02 deliberately ordered BEFORE `unresolvedPass`. Both
  produce the signal, so the absent-slot states are never pair states.
  **Why D-rc03a-3 was reversed rather than defended**: it was argued on consequence asymmetry, and
  that asymmetry only holds if fail-closed misfires rarely. It misfires on two routine states. The
  expected cost flipped, and the original decision was made without the frequency data — which the
  Case 1 table would have carried had it been complete.
  **Cost**: none in capabilities. The body already knows its invoked class (it is the flag the user
  passed) and the gate still answers whether a pair is in play, so D-rc03a-1's one-voice rule
  survives intact — neither side derives what the other owns.

- **2026-09-15 — D-rc03a-8: three of the five CRITICALs are REPAIRS, not redesign** — **PARTLY MOOT under D-rc03a-9: the status-read repair and the architecture carve-out belonged to a mechanism that no longer exists. The instruments repair (assertions over the generated surface) survives and still applies.** (ratified in
  chat by Sal, 2026-09-15). R-crc-6's lanes applied to the first fresh pass: (1) the external-handoff
  branch makes NO `orbit status --change --json` call — the premise that it "already makes" one is
  false, and the repair is an explicit new step ordered before the Cycle-context step, plus
  corrections to proposal.md, design.md D1 and tasks.md 1.1 which all lean on the false claim;
  (2) architecture mode has no change and no gate, so the ADDED requirement's "every reviewer class"
  binding would blind every architecture pass and contradict the live requirement that architecture
  mode hand-computes its iteration note from prior emits — the repair is an explicit carve-out with
  its own scenario; (3) tasks 3.1-3.4 specify tests against engine code that does not exist, because
  the Cycle context section is composed at runtime by the reviewing AI from a markdown reference —
  the repair is recasting section 3 as assertions over the GENERATED SURFACE TEXT, which rc01
  already established as a legitimate instrument class rather than a fallback.
  The change does NOT return to propose-from-scratch; the shape survives with one keyed correction.


- **2026-09-15 — D-rc03a-6: trail ATTESTATION of blindness is OUT OF SCOPE and becomes a declared
  follow-up** (resolved by Sal at promotion, 2026-09-15; resolves Q-rc03a-1). Today the gate infers
  blindness from absence-of-walk, which is exactly why a prompt-anchored pair passes. The stronger
  mechanism is attestation: the prompt file already persists and is committed, the T0 emit could
  record `cycle_context: "withheld" | "full"`, and the gate could REQUIRE the withheld value before
  counting a blind-pair member — converting "the body promised" into "the trail proves", which is
  the affordance-over-discipline move R-crc-6 is built on. It is deferred because it needs
  `orbit-run-summary-emit` (the field) and `orbit-engine-gates` (the check) ON TOP of this stage's
  two, which is R-crc-1's ceiling, and rc02 at three capabilities cost six proposal passes.
  FIXING THE LEAK AND PROVING IT IS FIXED ARE SEPARABLE, and shipping the fix first is strictly
  better than shipping neither. To be declared as a stage in a later architect session.


- **2026-09-15 — D-rc03a-4: blinding is SYMMETRIC, because a blind-pair member is a REVIEW in
  rc03's genre sense** — **SUPERSEDED by D-rc03a-10: the symmetric-blinding property was the STRONGER "blind to all prior history", which is mine rather than R-crc-4's and is what generated the eleven-channel problem. Ordering delivers "blind to each other" for both halves without enumerating sites.** (settled under R-crc-3; resolves Q-rc03a-2). The first attempt at this rule
  was "a member must not read its PARTNER's findings", which is narrower and wrong. rc03's charter
  already defines the genre: *"A REVIEW reads the whole artifact and the thesis and receives NO
  'resolved since' list."* A blind-pair member IS that genre, so it receives no prior-findings
  context from ANY source — not because of the partner specifically, but because that is what a
  review is. The external half's cycle context and the fresh half's Step 5 prior-summary read are
  THE SAME THING wearing different names, so the same rule governs both: when the slot is
  `blind-pair`, the fresh branch skips Step 5's prior-run read exactly as the handoff branch
  suppresses Cycle context.
  **This is the point of the stage, not an extra.** Case 2 established that the fresh half does not
  leak today — but only because Step 5's glob happens not to match `external-*.md`. An immunity
  that rests on a filename pattern nobody marked as load-bearing is precisely the kind of luck
  rc02's pair survived on, and leaving one half explicitly blinded and the other accidentally safe
  would ship the asymmetry that caused this stage.
  **Cost, stated rather than hidden**: both members may re-report findings resolved in earlier
  iterations, which the walk then suppresses as stale. That is real waste and it is the price of
  independence. It is also the cheaper error — capture-recapture assumes the two observers are
  independent, and priming both on a common prior frame inflates their overlap and DEFLATES the
  residual estimate, making the instrument read safer than it is.
  **Capability cost**: adds `orbit-review` alongside `orbit-review-external` — two of R-crc-1's
  three.

- **2026-09-15 — D-rc03a-5: the external-first scheduling swap is OUT, and it is OBSOLETED rather
  than merely deferred** — **REVERSED by D-rc03a-9: the swap IS the fix. Every argument recorded below was made BEFORE the channels were enumerated, and none survives Case 3. Kept verbatim as the record of reasoning that was confident and wrong twice.** (settled under R-crc-3). Two reasons, the second decisive. It is
  ergonomics (dispatch the slow human round-trip first, run the fast subagent while it is out)
  riding on a correctness stage, and after D-rc03a-4 the order no longer affects blindness at all.
  More to the point, rc13's D-rc13-4 already decided that ONE INVOCATION launches both halves —
  and once that ships there is no first and no second, so the swap fixes a problem a decision
  already taken removes entirely. Building it would be work whose own design supersedes it.
  Recorded here so the scheduling argument is not rediscovered and mistaken for new.


- **2026-09-15 — D-rc03a-1: the prompt's genre is READ FROM THE ENGINE, not inferred by the body** — **SUPERSEDED by D-rc03a-9/D-rc03a-11: nothing reads the slot under the ordering mechanism, and the slot could not have carried this anyway (wrong gate scope; absent in reachable pair states). The premise below that the branch "already makes" the call is also FALSE — corrected 2026-09-15.**
  (settled under R-crc-3). The external-handoff branch consults `next_hint_keys.slot` from the
  `orbit status --change <name> --json` call it already makes, and suppresses Cycle context when
  the slot is `blind-pair`. No new engine surface: `canonicalNextForReviewed` already returns that
  slot from both the open-pair and empty-pair branches. This keeps ONE VOICE for "what kind of pass
  is this" — the gate decides cadence, so the gate decides genre, and a body-side heuristic could
  disagree with the gate about the very thing the gate is computing.

- **2026-09-15 — D-rc03a-2: the requirement becomes GENRE-CONDITIONAL, not deleted** — **SUPERSEDED by D-rc03a-9: `orbit-review-external` drops out of the change entirely, so there is no genre condition to add.**
  (settled under R-crc-3). `Cycle context populated from prior runs` is CORRECT for a sequential
  iteration — a reviewer verifying whether prior findings were addressed needs to know what they
  were, and Case 1 confirms three of five slot states legitimately keep it. The MODIFIED
  requirement adds the blind-pair condition and a scenario for it; it does not remove the existing
  behaviour or its scenarios.

- **2026-09-15 — D-rc03a-3: when the slot cannot be determined, FAIL CLOSED (suppress)** — **SUPERSEDED the same day by D-rc03a-7; kept as the record of what was decided and why it was wrong.**
  (settled under R-crc-3). If `orbit status` fails, the change has no reviewed gate, or the field
  is absent on an older engine, the prompt suppresses cycle context rather than retaining it. The
  consequences are asymmetric: suppressing on a sequential iteration costs that reviewer some
  convenience and is visible in the prompt itself ("withheld"), while retaining on a blind-pair
  member silently anchors the pair, certifies it as blind, and corrupts the only measurement this
  program produces. Severity by consequence — rc02b's thesis applied to a default.


## Open questions

- **Q-rc03a-2 — `/orbit:explore` has no defined behavior for a name that already promoted.**
  R-crc-6 routes REDESIGN back to explore, and this change took that route after its first fresh
  pass. But the staging directory moved into the change at propose, so Mode B would have scaffolded
  a SECOND `explore.md` while the authoritative one sits in `orbit/changes/<name>/` — a second claim
  on one truth, which is the exact condition propose's own metadata merge refuses when it discards
  the staged `.openspec.yaml`. This session resumed in place instead, by judgment, with nothing in
  the body sanctioning it.
  Standing recommendation: the body should RESUME IN PLACE against `orbit/changes/<name>/explore.md`
  when the name resolves to an active change, and say so — never scaffold a second staging
  directory. PROGRAM-TIER: it is a gap in the explore surface, so it belongs to rc13
  (explore-mechanism) or rc03 (genres), and assigning it is an architect act, not this change's.

## Considered & out

- **2026-09-15 — Deleting the Cycle context section outright.** Rejected: Case 1 shows three of
  five slot states legitimately keep it, and a confirming external pass that cannot see what the
  pair found is strictly worse at its job.
- **2026-09-15 — Swapping the canonical recommendation to external-first.** Considered three ways
  and rejected on all three; see D-rc03a-5 for the settled form. As THE FIX: it makes the default
  path safe in one line but leaves blindness an ordering discipline, and rc03a exists because rc02
  survived on that kind of luck. As IMMEDIATE HARDENING alongside the fix (the reading held earlier
  in this session): superseded by D-rc03a-4 — once blinding is symmetric the order does not affect
  blindness at all, so there is nothing left to harden. As an ERGONOMIC change on its own merits
  (dispatch the slow human round-trip first, run the fast subagent while it is out — a real
  argument, and the strongest of the three): obsoleted by rc13's D-rc13-4, which already decided
  ONE INVOCATION launches both halves, leaving no first and no second to order.


## References

- `orbit/explore/rc13-explore-mechanism/explore.md` — Cases 2, 3 and 5 are this stage's entire
  evidence base; Case 5 is why it is a requirement conflict rather than a prompt tweak.
- `orbit/specs/orbit-review-external/spec.md:273` — `Cycle context populated from prior runs`,
  the requirement this stage modifies, and its two scenarios.
- `src/core/templates/workflows/review.ts:344` — the shipped prompt-generation step that
  implements it.
- `src/core/artifact-graph/gates.ts:878` — why `--fresh` is the default first half. (NOT
  `gates.ts:113`: that `case 'blind-pair':` in `commandForClass` is unreachable on this path,
  because `canonicalNextForReviewed` intercepts `neededSlot === 'blind-pair'` at `gates.ts:868`
  before the `commandForClass` call at 881. Corrected 2026-09-15 by the first fresh pass.)
- `orbit/architecture/clean-up-review-cycle.md` — the rc03a charter and its three exit criteria.
