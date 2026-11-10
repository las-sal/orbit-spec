## Context

The first seam-chaining change (archived `2026-11-10-seam-chaining`) gave `orbit/config.yaml` a `chain` map with three
keys (`review`, `review-external`, `address-reviews`) and the change status a `chain` object saying whether the next
command may run unasked. It left apply and archive out on purpose (D-sc-19): `src/core/chain.ts` already maps
`/orbit:apply <change>` and `/orbit:archive <change>`, marked or not, to their own targets, but `CHAIN_KEY_TABLE` has
three rows and `chainKeyFor` returns null for both, so every arrival the user did not type reads `not-granted` and the
consent prompt fires (D-sga-3, see explore.md). The emit write gate lists `consent` as an apply and archive payload field
and checks no value of it. The apply body carries the Chain end step and the no-chaining clause; the archive body
carries neither, and neither body tags its prompts.

Every apply and archive emit on record carries `user-invoked` or no field: 139 emits, 125 and 14 (Case 1 of
explore.md's Mechanism), so a value check refuses no record already written.

## Goals / Non-Goals

**Goals:**

- `chain.apply` and `chain.archive` grant their commands exactly as a typed invocation authorizes them, the archive
  tail's outward writes included and named (D-sga-4).
- A granted arrival records `consent: "setting"` with no prompt, decided by one engine read (D-sga-5).
- The write gate refuses a `setting` the map does not grant, and any value outside the three (D-sga-6).
- A chained apply or archive meets each of its prompts by kind, as review and address-reviews already do (D-sc-12).

**Non-Goals:**

- Committing before a chained external review: the third change (D-sga-1).
- Merging the PR or returning to the default branch: the driver's settings (D-sc-17). They stay `human_acts`.
- Setting `chain` in this repository: R-adf-5 keeps it absent here, so nothing in orbit-spec's own flow changes.
- Any change to the human readout, a gate, a position token or `next_command`. The ` — user-invoked` marker stays on
  the rendered next command whatever the setting grants.

## Decisions

**1. Two keys, each row naming what it grants (D-sga-4).** `CHAIN_KEYS` in `src/core/project-config.ts` gains `apply`
and `archive`; `CHAIN_KEY_TABLE` gains their rows, each listing the bare and the marked command form; `chainKeyFor`
returns the target itself, and the `ChainTarget` type folds into `ChainKey | null`. The `archive` row in
`orbit-engine-gates`' requirement names the tail's push, description rewrite or stage-entry append, and ready flip,
because a granted arrival shows no consent preview, and the preview is where a typed-but-AI-mediated archive names
those writes today (D-sga-4's FALSIFY move). `CHAIN_END_STEP` interpolates the table, so the five bodies that carry it
(propose, ff, apply, review, address-reviews) gain the two rows by regeneration and no body text is hand-edited for them.
Alternatives, from explore.md's Considered & out: a ready flip that stops the chain or takes its own key (a key nothing
else reads, for a reversible act already in the tail), and a chained archive that stops before the tail (the archive
would land locally and never reach its PR).

**2. One predicate at entry (D-sga-5).** Apply's and archive's Step 0 gain a third provenance bullet: not typed, and
`orbit status --change "<name>" --json`'s `chain` object reports `next` as this command with `may_run: true` → record
`setting`, fire no consent prompt, stamp the consent era as on the other two paths. Every other arrival the user did
not type prompts as today. Apply's Step 2 and archive's Step 3.4 already make this status read, so it moves earlier
rather than being added. The body never judges how it was reached: "continue" and a chain's closing step are
the same arrival. The arrival table lives in `orbit-lifecycle-consent`'s `Consent prompts at consent-marked seams`.
Alternative: `setting` only for an arrival a chain brought (out: the body would judge its own route, and "continue"
would prompt for a command the user granted).

**3. The value check sits beside the payload validation (D-sga-6).** In `src/core/emit-composition.ts`, a
`validateConsent(command, payload, projectRoot)` runs right after `validatePayload` in `composeAndWriteEmit`, for apply
and archive only and only when the key is present: a value outside `user-invoked`, `prompted` and `setting` is refused
naming the three; `setting` is refused naming the key unless `resolveChainSetting(projectRoot).grants[command]` is true.
It reads the same resolver the `chain` object reads, so entry and gate share one definition of granted; it tests no open
stop, so a stop written during the command never refuses that command's own summary. The archive emit is written after
the move, but the gate reads `orbit/config.yaml`, which the move does not touch. The rule's owner is
`orbit-lifecycle-consent`'s `Consent recorded in consent-scoped lifecycle emits`; `orbit-emit-composition` restates no
consent check (read at propose: its spec names `consent` nowhere), so it gains no delta. Alternatives: a payload field
naming the granting key (out: the key and the command are one-to-one, and a field joins every table and example), and
`setting` self-reported like the other two (out: a grant is a file the gate can read).

**4. The archive body states the tag rules itself.** A chained archive's session holds the previous body's Chain end
step, which says how a tagged prompt behaves, but the archive skill must not depend on another skill's text being in
context. Its granted bullet says it in one sentence: a `(chain: target)` prompt does not fire, a
`(chain: routine, default: <option>)` prompt takes that default and the run summary's `final_assessment` records
`The chain took the default: <prompt> — <answer>.`, and a `(chain: decision)` prompt is asked as on a typed arrival.
Archive gains no Chain end step: the command after it is not a change command (D-sc-17), so its no-chaining bullet stays
the standard one and the tag test's count of standard bullets is unchanged. Apply already carries the step.

**5. The sync assessment is the one routine prompt.** Upstream's Step 4 prompt has a recommended option when deltas
need syncing and none marked when they are already synced; each line gets its own tag,
`(chain: routine, default: Sync now)` and `(chain: routine, default: Archive now)`, the tag being the body's mark of the
default. Every other archive prompt — incomplete artifacts or tasks, unaddressed `@review:` markers, a user-validation
line the closure cannot dispose of, the gate inflection, the fingerprint check, critical audit findings — is a decision,
because it either leaves unfinished work behind or asks whether the state is sound. Apply's prompts are the target
selection, the gate inflection and the pause pattern, the last two decisions. The consent prompt in each body is tagged
`(chain: not a prompt)`: on an allowed arrival it does not fire.

**6. Where the grant is recorded.** A chained review or walk records `Chained: granted by chain.<key>.`; a chained apply
or archive records it as `consent: "setting"` and writes no sentence (`orbit-conventions`' `No-chaining contract`).
The Chain end step's sentence naming where the record goes gains that clause, so the five bodies carrying it stay
byte-equal to one another.

**7. Docs.** `docs/customization.md`'s `chain` row drops "No key grants apply or archive" and names the two keys and the
archive key's outward writes; its `consent` row and `docs/workflow-engine.md`'s consent paragraph say a step marked
`user-invoked` is one you invoke yourself or grant with `chain`. `docs/getting-started.md`'s marker sentence gains the
same clause.

## Risks / Trade-offs

- [A grant withdrawn between a command's entry and its emit refuses a true record] → the named limit in
  `Consent recorded in consent-scoped lifecycle emits`: the refusal names the key, and the session asks the user and
  records `prompted`.
- [A granted archive pushes and flips a PR with nobody asked] → the user's own grant, whose row names the push and the
  flip; a push rejection or a degraded tail skips with its note exactly as on a typed archive, and the merge stays the
  user's act.
- [The ` — user-invoked` marker reads oddly on a command the setting grants] → accepted: the marker describes the gate,
  and the `chain` key enters no readout; the docs say the setting can grant a marked step.
- [The tag inventory misses a prose ask in the two bodies] → the requirement's named limit (Residual kind and method in
  `A chain treats each prompt by its kind`), now covering the apply and archive bodies.
- [Parity pins move] → every body carrying `CHAIN_END_STEP` changes, so `skill-templates-parity`'s function and content
  hashes for propose, ff, apply, review and address-reviews move, and archive's too; `rc03b-untouched-modules`' pin on
  `emit-composition.ts` moves. Re-pinned deliberately in tasks.
- [Carried scenarios] → the twelve modified blocks carry 51 baseline scenarios; with the 16 new ones, 32 of the 67 are
  undeclared at propose. Each is declared by a test tag or a ledger entry before the apply gate, when undeclared turns
  to ERROR.

## Migration Plan

None: an absent `chain` key, or one without `apply` or `archive`, behaves as today. Emits already written carry
`user-invoked` or nothing, both accepted. Rollback is a revert.

## Open Questions

None.

## Touchpoints

- `src/core/project-config.ts` — `CHAIN_KEYS` gains `apply` and `archive`.
- `src/core/chain.ts` — `CHAIN_KEY_TABLE` rows; `chainKeyFor`; the `ChainTarget` type.
- `src/core/emit-composition.ts` — the consent value check at the write gate.
- `src/core/disciplines.ts` — the Chain end step's sentence on where a chained command records its grant.
- `src/core/templates/workflows/apply-change.ts` — Step 0's granted arrival, the `consent` payload note, prompt tags.
- `src/core/templates/workflows/archive-change.ts` — Step 0's granted arrival and tag rules, the schema reference's
  `consent` field and notes, prompt tags.
- `test/core/chain.test.ts` — the two keys, the marked forms, a key no row names.
- `test/core/emit-composition.test.ts` — the consent value refusals and acceptances.
- `test/core/templates/chain-prompt-tags.test.ts` — the scanned bodies, the inventory, the routine tags.
- `test/core/templates/skill-templates-parity.test.ts` + `test/core/rc03b-untouched-modules.test.ts` — re-pinned.
- `docs/customization.md` + `docs/workflow-engine.md` + `docs/getting-started.md` — what the keys grant.
- `orbit/scenario-ledger.yaml` — entries for scenarios no test can assert.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-sga-4 | SOURCED | live rule | `orbit-engine-gates`' `The chain setting grants each command on its own key` — a normative TABLE (what a granted apply or archive meets), the `Closure:` source as the sentence naming the tail's step names |
| D-sga-5 | DERIVED | live rule | `orbit-lifecycle-consent`'s `Consent prompts at consent-marked seams` — a normative TABLE (each arrival), the derivation as the sentence after it |
| D-sga-6 | SOURCED | live rule | `orbit-lifecycle-consent`'s `Consent recorded in consent-scoped lifecycle emits` — a normative TABLE (each `consent` value), the source as the sentence after it |
