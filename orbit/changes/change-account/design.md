## Context

Stage program-brief of `automate-dev-flow` lands as three changes (D-pb-7, D-pb-9 in
`orbit/explore/program-brief/explore.md`); this is the first. The brief the second change renders needs three parts no
record holds — what was built, new seams, deviations from the charter — so the AI writes them once per change, as the
account (see `explore.md`, D-ca-1). The third change adds the sign-off setting, under which a reader takes the account
(D-pb-5); until then none does (D-ca-2).

Today a change's history (`.orbit-runs/`) holds run summaries directly, and decision records in its `decisions/` child,
which no run-summary reader opens (`orbit-decision-records`' `Where decision records are kept`). The decision records
are written through `orbit emit ledger | stop | resolution`, checked by `src/core/decision-records.ts`, and their
commands sit in `src/core/emit-composition.ts`'s command table with `kind: null`. The reading step selects through one
function, `selectUnreadRecords`, which reads only `decisions/`.

## Goals / Non-Goals

**Goals:**
- A fourth record, the account, with a write gate as strict in form as the decision records'.
- The apply and address-reviews bodies tell the AI when to write and replace it.
- Nothing the user sees or is asked changes, and no reader runs on the account (G0).

**Non-Goals:**
- Rendering the account to the user — the second change (`orbit/explore/brief-render/`).
- A reader taking the account when sign-off is on — the third change (D-pb-5).
- The account in the shared `references/decision-records.md` (below, decision 4).

## Decisions

1. **The account lives in `.orbit-runs/account/`, beside `decisions/` and outside it.** D-ca-2's Mechanism entry
   imagined a filter inside `selectUnreadRecords`; a separate folder reaches the same rule by construction: every
   caller of the selection reads only `decisions/`, and every run-summary reader reads only the files directly in
   `.orbit-runs/`, so no reader can take the account by forgetting a filter. It also keeps every "decision record
   (`ledger`, `stop`, `resolution`)" statement in `orbit-emit-composition` and `orbit-decision-records` true, so the
   change modifies one requirement rather than six. The third change, which makes a reader take the account, adds the
   folder to the selection there. Alternative: `decisions/account-<TS>.json` with a filter — rejected for the reasons
   above.
2. **The account is not a decision record.** It records no call and no stop, so `Three decision records, one job each`
   stays as written, and the account has its own ADDED requirement. It shares the decision records' plain-language rule
   (the one MODIFIED requirement: its field table gains the account's three fields), their spine checks, their
   absence of a recommendation and their no-overwrite publish.
3. **One chain per change, enforced.** The write gate refuses a second account without `replaces`, naming the latest to
   replace, and a replacement of a replaced account (a measured fact is not an enforced rule; the gate holds "one
   account" rather than the bodies' good behaviour). A replacement may change every field, since an account carries no
   link to another record. The three plain fields are strings, not arrays: "none" is said in words, so the brief never
   shows an empty section that could mean "not written".
4. **The bodies carry the instruction; the shared reference does not.** `orbit-conventions`' `Decision-record reference
   ships beside the statement` makes `references/decision-records.md` the three records' reference, shared by every
   statement-carrying skill, and says when-to-write belongs to the statement. The account is written only by apply and
   replaced only by apply and the walk, so one constant in `src/core/disciplines.ts` (an `ACCOUNT_STEP`, composed from
   the write gate's field list) is carried by the apply body before its run summary, and one sentence by the
   address-reviews body; a test holds both. This keeps `orbit-conventions` out of the change.
5. **Active change only.** An account is written while a change is built, so `--doc`, an exploration-only name and an
   archived-only name are refused; this also keeps the account off the explore trail that propose moves.

## Alternatives considered

- **Writing the three fields into the archive record** (from `explore.md`'s Considered & out): no reader would check
  them before the user signs.
- **The account inside `decisions/` with a filter in the selection**: decision 1.
- **The account in the shared decision-records reference**: decision 4.
- **Arrays for `seams` and `deviations`**: decision 3.

## Risks / Trade-offs

- [The AI writes an incomplete or flattering account] → the gate checks form only (R-crc-10); the second change renders
  the computed signals (archive warnings, accepted claims, size breaches) beside `deviations`, and the third change's
  reader checks the account when sign-off is on.
- [A walk fix changes what was built and the walk writes no replacement] → the address-reviews body names the moment;
  whether it was missed is visible against the walk record at the next review. Not checked by the engine.
- [A change applied across several sessions] → the session that checks the last task is a fact `tasks.md` shows, so one
  session owns the write.
- [G0] → the apply and address-reviews bodies gain an instruction to record something (R-adf-9); the tests that move are
  closed sets this change extends, each named at archive: `rc03b-untouched-modules.test.ts`'s `emit-composition.ts`
  pin, `emit-composition.test.ts`'s every-command spine case list (the account joins the non-run-summary commands), and
  `skill-templates-parity.test.ts`'s apply function and generated-file hashes (and address-reviews' if pinned).

## Touchpoints

- `src/core/decision-records.ts` — the account's payload fields and checks (or a sibling module beside it).
- `src/core/emit-composition.ts` — the `account` command row, its path under `account/`, and its spine.
- `src/core/disciplines.ts` — the `ACCOUNT_STEP` constant.
- `src/core/templates/workflows/apply-change.ts` — the account step before the run summary.
- `src/core/templates/workflows/address-reviews.ts` — the replacement sentence in the walk.
- `test/core/` — the account write-gate tests, the body test, and the moved pins.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure | owner's state | destination |
|---|---|---|---|
| D-ca-1 | DERIVED | live rule | `orbit-decision-records`' `Each change carries one account, written when apply finishes` — a normative TABLE (the lifecycle steps), its justification the closing sentence naming the schema's phases |
| D-ca-2 | SOURCED | live rule | `orbit-decision-records`' `No reader takes the account yet` — a normative TABLE (the selection's readers), its source the sentence naming the one selection function and the `decisions/` folder it reads |
