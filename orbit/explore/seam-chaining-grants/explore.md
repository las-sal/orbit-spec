> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: seam-chaining-grants

## Premise

The second of stage seam-chaining's two changes (D-sc-19 of the first change, archived at
`orbit/changes/archive/2026-11-10-seam-chaining/`). The first change chained the review-and-walk loop; this one
owes what was split off, plus two items carried into it on 2026-11-10:

1. **The apply and archive grants**: `chain` keys `apply` and `archive`, and a chained arrival recording
   `consent: "setting"` with no consent prompt (D-sc-7, and the apply and archive rows of D-sc-5 and D-sc-12).
2. **A commit before a chained external review**: today a chained external review or blind pair on an uncommitted
   tree refuses and stops on `no-progress`; option C of the first change's dirty-tree finding, carried here.
3. **The replacement-liveness gap**: a replacement record re-checks a carried decision citation for liveness, so a
   record whose cited decision was later superseded cannot be replaced (the architect session, 2026-11-10).

The question this exploration must settle first is size: the first change was split because the consent value
alone makes four capabilities' requirements false, and the ceiling is three.

## Mechanism

### D-sga-4 — the apply and archive keys grant every write the designed flow makes
Domain: every write a granted apply or archive makes, and the acts that sit next to them
| member | covered by |
|---|---|
| apply: the body's edits (code, `tasks.md`) and its run summary | key `apply` |
| apply: a commit or push of the applied work | not a write the apply body makes; the third change's (D-sga-1) |
| archive: the baseline sync, the move, the run summary, an at-archive doc edit | key `archive`; the sync prompt takes its marked default (D-sc-12) |
| archive tail: `stage` and `commit` of the named paths | key `archive` |
| archive tail: `push` to the attachment's branch | key `archive`, named in the key's row |
| archive tail: `rewrite` of a per-change PR's description, or `append` of a program PR's stage entry | key `archive`, named in the key's row |
| archive tail: `ready`, on a per-change PR only | key `archive`, named in the key's row |
| the tail's `human_acts`: the merge, the return to the default branch | never granted here: the driver's settings (D-sc-17); shown, never run |
| an unattached change | no tail runs, so nothing outward is granted |
| bulk-archive | never chained, and it runs no tail |
Closure: SOURCED — the tail's steps are the step names `src/core/pr/tail.ts` composes (`stage`, `commit`, `push`, `append` or `rewrite`, `ready`) and `human_acts` is its other output; the in-repo writes are the archive body's sync, move and emit
Moves:
- READ: applied — `src/core/pr/tail.ts` lines 155 to 190 read 2026-11-10; the archive body's Step 5.6 says the tail rides archive's entry consent with no second prompt
- ENUMERATE: applied — this table
- COHERE: applied — the grant covers exactly what entry consent covers on a typed arrival, so `setting` and `user-invoked` authorize the same writes
- EXECUTE: applied — the archive of `replacement-liveness` ran the five steps in this order on 2026-11-10 under typed consent (commit 2513aa59; PR #38 flipped ready)
- FALSIFY: applied — a row saying only "archive" would let a user grant it believing it writes in the repository only, and a granted arrival never shows the consent preview that names the outward writes today; hence the row names the push and the flip
- CONFORM: applied — R-adf-6 (the grant is exact because its row names each outward write), R-adf-1 (absent means today), R-adf-3's fourth condition (an act the config grants is not a stop), D-sc-17 (the merge and the return stay out)
- FEASIBILITY: not applied — the text of one table row
- CONSUME: applied — the user reading the key's row before granting it; the tail itself reads no consent value
- INVOKE: applied — at a granted archive's Step 5.6, when the preflight was not `off`

### D-sga-5 — an arrival the user did not type records setting when the chain object allows the command
Domain: every arrival at a consent-scoped command, by who typed it and what the `chain` object says at entry
| member | covered by |
|---|---|
| typed by the user, whatever the map grants | `user-invoked`, no prompt, as today |
| not typed; `chain.next` is this command and `may_run` is true | `setting`, no prompt |
| not typed; `why: not-granted` (the key absent or false, or no map) | the consent prompt fires as today: `prompted` on Proceed, no summary on Abort |
| not typed; `why: open-stop` | the consent prompt fires as today; the stop's question was put by the closing step that stopped the chain |
| not typed; `chain.next` names another command, or `why: none` | the consent prompt fires as today, then the gate inflection as today |
| `why: needs-user` | cannot hold for apply or archive: that row is tested for the `review-external` key only |
| `why: no-progress` | cannot hold at entry: that row is tested only when a closing step passes `--chain-ran` |
| the later chunks of one chunked apply | the entry's value, constant across the invocation's emits |
| the sync inside archive | inherits archive's value and never prompts |
| bulk-archive | never `setting`: the engine never names it as a next command; it prompts as today |
Closure: DERIVED — who typed the arrival (the user, or not) crossed with the `chain` object's outcomes (`may_run`, or one of its five reasons), plus the three members `orbit-lifecycle-consent`'s Purpose adds (chunks, the inherited sync, bulk-archive)
Moves:
- READ: applied — `composeChainObject`'s row order in `src/core/chain.ts`; today `chainKeyFor` returns null for both commands, so every arrival the user did not type reads `not-granted`
- ENUMERATE: applied — this table
- COHERE: applied — the entry's read and the closing step's read are one function over one state, so the chain that ran the command and the entry that records it agree unless the map or a stop changed between them; then the entry's read governs and the prompt fires
- EXECUTE: not applied — no key grants either command yet
- FALSIFY: applied — reading "a chain brought me here" from the conversation is a judgement of delegated intent, which the provenance rule forbids; and without this rule an arrival by "continue" would prompt for a command the user has said may run unasked
- CONFORM: applied — `orbit-lifecycle-consent`'s `Invocation-provenance rule` (an observable fact; uncertain means prompt), R-adf-1 and G0 (no map reads `not-granted`, so today's prompt fires), gate verdicts stay engine-computed
- FEASIBILITY: applied — one status read, which apply's Step 2 and archive's Step 3.4 already make
- CONSUME: applied — the apply and archive emits' `consent` field; D-sc-12's routine defaults are taken only on a `setting` arrival
- INVOKE: applied — at Step 0 of apply and of archive, after read-only discovery and before any write

### D-sga-6 — the consent value is one of three and the write gate checks it
Domain: every `consent` value an apply or archive payload can carry
| member | covered by |
|---|---|
| `user-invoked` | accepted; self-reported, as today |
| `prompted` | accepted; self-reported, as today |
| `setting`, and the map grants the emit's command (`apply` for an apply emit, `archive` for an archive emit) | accepted |
| `setting`, and the key is absent or false, or there is no map | refused, naming the key |
| any other string, or a value that is not a string | refused, naming the three values |
| the field absent | as today: the gate does not require it, and audit-drift's check reports the absence |
| `consent` in any other command's payload | as today: refused as an unknown payload key |
Closure: SOURCED — the payload tables in `src/core/emit-composition.ts` list `consent` for apply and archive only, and a value is one of this rule's three or it is not
Moves:
- READ: applied — `consent` appears twice in `src/core/emit-composition.ts`, both in payload-field lists, and no code outside the templates names `prompted`; `resolveChainSetting` is the one resolver of the map
- ENUMERATE: applied — this table
- COHERE: applied — the gate reads the resolver the `chain` object reads, so D-sga-5's test and the gate's share one definition of granted; the gate does not test for an open stop, since a stop written during the command must not refuse that command's own summary
- EXECUTE: not applied — no check exists yet
- FALSIFY: applied — refusing unknown values could refuse a record an older convention wrote: all 139 apply and archive emits on record were read, 125 carry `user-invoked`, 14 carry no field and none carries another value; and a grant withdrawn between entry and emit refuses a true record, the named limit in the decision
- CONFORM: applied — R-adf-6 (what is allowed must be exactly clear, so a record claiming a grant is checked against it), D-sc-20 (no new payload field), `orbit-lifecycle-consent`'s self-report for the two values a file cannot check
- FEASIBILITY: applied — one config read per apply or archive emit
- CONSUME: applied — audit-drift's consent check reads presence only and is unchanged; the archive schema reference's executed example carries `user-invoked` and stays accepted
- INVOKE: applied — on every `orbit emit apply` and `orbit emit archive`

### Case 1 — the consent values on record
Read 2026-11-10 over every `apply-*.json` and `archive-*.json` under `orbit/changes/`, archived changes included: 139 emits, 125 with `consent: "user-invoked"`, 14 with no `consent` field, none with any other value.

## Decisions

- **2026-11-10 — D-sga-1: the owed work lands as three changes, all citing stage seam-chaining: the replacement-liveness exemption first, then the consent value with both grants, then the commit before a chained external review** Measured 2026-11-10: together the three pieces change requirements in six capabilities against a ceiling of three — the consent values are listed as exactly two in `orbit-lifecycle-consent` (1 requirement), `orbit-conventions` (1), `orbit-run-summary-emit` (1) and `orbit-archive-modifications` (3), the keys join `orbit-engine-gates`' table, the commit rule sits in `orbit-conventions`' `No-chaining contract`, and the exemption is `orbit-decision-records`'. The exemption is one capability and independent, and the grants change will likely meet the gap, since the D-sc rows it implements supersede earlier entries. The consent value and the grants that write it are one feature, so that change declares a breach of four or five capabilities. The commit rule follows the grants, because chained apply chunks are what leave a tree dirty. This exploration carries the second change; the first opens as its own small change. Revises the architect session's fold of the gap into this change, made before the size was measured. User's word, 2026-11-10 ("a"; AI recommendation).
  Kind: scope
- **2026-11-10 — D-sga-2: the first of the three changes shipped, so this exploration now carries the consent value with the apply and archive grants alone** `replacement-liveness` was archived and merged on 2026-11-10 (`orbit/changes/archive/2026-11-10-replacement-liveness/`, PR #38): a replacement keeps its citation of a superseded or assigned decision. Premise items 1 and 2 remain; item 2 is the third change and stays out of this one.
  Kind: fact
- **2026-11-10 — D-sga-3: what the first change left in place for the grants, read from the code and the generated bodies** `src/core/chain.ts` already maps `/orbit:apply` and `/orbit:archive`, with or without the user-invoked marker, to their own targets, and no key grants them (`CHAIN_KEY_TABLE` has three rows; `chainKeyFor` returns null for both). The emit write gate lists `consent` as a payload field of apply and archive and checks no value of it: no code outside the templates names `prompted`. The apply, propose and ff bodies carry prompt-kind tags and a Chain end step; the archive body carries neither.
  Kind: fact

- **2026-11-10 — D-sga-4: the `apply` and `archive` keys each grant the command and every write its designed flow makes, the archive tail's push and ready flip included** A granted archive of a PR-attached change commits, pushes, rewrites the description (or appends the stage entry) and flips a per-change PR to ready, with nobody asked, exactly as a typed archive does under its entry consent. The key's row names the push and the flip, so the grant is exact (R-adf-6). The merge and the return to the default branch are never granted here (D-sc-17). Option A of three; the others were a flip that stops the chain or takes its own key, and a chained archive that stops before the tail. User's word, 2026-11-10 ("a"; AI recommendation).
  Kind: rule
- **2026-11-10 — D-sga-5: an arrival at apply or archive that the user did not type records `consent: "setting"` and fires no consent prompt exactly when the change status's `chain` object names that command with `may_run: true`; otherwise the consent prompt fires as today** One predicate covers a chain's arrival and an arrival by "continue" alike, and the body judges nothing about how it was reached. It refines D-sc-7's "a chained arrival" (the first change's exploration, archived). The AI's method call, recorded per R-crc-3.
  Kind: rule
- **2026-11-10 — D-sga-6: the consent value is one of three, `user-invoked`, `prompted` and `setting`, written flat with no field naming the key, and the write gate refuses `setting` when the project's `chain` map does not grant the emit's command, and any value outside the three** The key and the command are one-to-one, so the value names the key by itself (D-sc-20's reasoning against a new payload field). Named limit: a grant withdrawn between a command's entry and its emit refuses a true record; the refusal names the key, and the session then asks the user and records `prompted`. The rule's owner is `orbit-lifecycle-consent`'s `Consent recorded in consent-scoped lifecycle emits`; whether `orbit-emit-composition` restates the gate's checks is read at propose. The AI's method call, recorded per R-crc-3.
  Kind: rule
- **2026-11-10 — D-sga-7: this change is measured at five capabilities, six if the write-gate check is restated in `orbit-emit-composition`** Read 2026-11-10 by grep over `orbit/specs`: `orbit-lifecycle-consent` (the provenance rule, the prompts at seams, the recorded value), `orbit-archive-modifications` (`Archive run summary written`, `Archive summary schema reference ships with the skill`, `Consent prompt on AI-mediated archive entry`), `orbit-run-summary-emit` (the apply emit's consent sentence), `orbit-engine-gates` (`The chain setting grants each command on its own key`, whose text says no key grants apply or archive) and `orbit-conventions` (the summary format's two consent mentions, `A chain treats each prompt by its kind`, whose table lists review and address-reviews only, and `Each chained prompt states its kind`). `orbit-pr-lifecycle` names consent at its line 387 and is read at propose. D-sga-1 declared a breach of four or five; the count is settled at propose.
  Kind: fact


## Open questions

## Considered & out

- **2026-11-10 — The ready flip stops a chained archive, or takes its own key:** out (D-sga-4). A key nothing else reads, for an act that is reversible and already part of archive's designed tail.
- **2026-11-10 — A chained archive of an attached change stops before the tail:** out (D-sga-4). The archive would land locally and never reach its PR, which is the state the tail exists to prevent.
- **2026-11-10 — `setting` only for an arrival a chain brought:** out (D-sga-5). The body would have to judge how it was reached, and "continue" would prompt for a command already granted.
- **2026-11-10 — A payload field naming the granting key:** out (D-sga-6). The key and the command are one-to-one, and a new field joins every payload table and example.
- **2026-11-10 — `setting` self-reported like the other two values:** out (D-sga-6). Unlike a typed command or a clicked prompt, a grant is a file the gate can read.
- **2026-11-10 — The grants and the liveness gap as one change, then the commit rule:** out (D-sga-1). A six-capability breach for a gap that ships alone in one.
- **2026-11-10 — All three pieces as one change:** out (D-sga-1). The largest review surface this program has had, with three independent concerns in one pass.

## References

- `orbit/changes/archive/2026-11-10-seam-chaining/explore.md` — D-sc-5, D-sc-7, D-sc-12, D-sc-14, D-sc-19 and their Mechanism entries
- `orbit/changes/archive/2026-11-10-seam-chaining/.orbit-runs/decisions/ledger-2026-11-10T03-00-50Z.json` — the live case of the liveness gap
- `orbit/changes/archive/2026-11-10-replacement-liveness/` — the first of the three changes, shipped (D-sga-2)
- `src/core/chain.ts` — `CHAIN_KEY_TABLE`, `chainTargetFor`, `composeChainObject` (D-sga-3)
- `orbit/specs/orbit-lifecycle-consent/spec.md` — `Consent recorded in consent-scoped lifecycle emits`
