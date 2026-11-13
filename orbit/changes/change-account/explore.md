> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: change-account

## Premise

The first of stage program-brief's three changes (D-pb-7 and D-pb-9 in `orbit/explore/program-brief/explore.md`).
The program brief (R-adf-7, G5) needs three things orbit's records do not hold — what a change built, the new places
the user is asked something, and where the work left its stage's plan — so the AI writes them, in plain language,
once per change, as a new record: the change's account (D-pb-4 there, divided here). This change adds that record
and the instruction to write it. No reader takes the account until the third change adds the sign-off setting
(D-pb-5 there), so with this change alone nothing a user sees changes: the apply body gains an instruction to record
something, which G0 allows (R-adf-9).

## Mechanism

### D-ca-1 — each change carries one account, written when apply finishes
Domain: each lifecycle step that runs on a change, as it touches the account
| member | covered by |
|---|---|
| propose, ff, the proposal review and its walk | nothing is built yet; no account |
| an apply session that leaves tasks unchecked | no account; the next apply session carries on |
| the apply session that checks the last task | writes the account (`built`, `seams`, `deviations`, with `defines` and `detail` as the other records have them) before its run summary |
| an apply session after an account exists (a walk reopened tasks) | writes a replacement of the latest account when what it built changes the account |
| the system review | reads nothing new by this change (D-ca-2) |
| the system walk, when a fix changes what was built, a seam, or a deviation | writes a replacement of the latest account |
| archive | writes no account; the archived change keeps the latest one |
| a change abandoned before apply finishes | no account; a brief over it says none was written (brief-render) |
| a change citing no architecture doc | `deviations` is stated against the proposal's scope rather than a stage charter |
Closure: DERIVED — the spec-driven schema's phases (propose, the proposal review, apply, the system review, archive) with the walks that follow each review, every phase listed, plus the two shapes a change can take outside them (abandoned, uncited)
Moves:
- READ: applied — `orbit-decision-records`' `Three decision records, one job each`, `Where decision records are kept`, `Decision records are written in every mode` and `A record is fixed by a replacement, never edited`; the plain-language table in `Decision records are written for a reader who knows only the architecture`, whose residual names a new prose field
- ENUMERATE: applied — this table
- COHERE: applied — the account is written by the session that finishes apply, while the existing records are written at call time; the replacement rule (the latest of a chain is current) is the one the other records use, so the brief reads the latest account
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — an apply that finishes across a session boundary could leave no session that "finishes apply"; the session that checks the last task is a fact the tasks file shows, so one session always owns the write
- CONFORM: applied — R-adf-7 (written in every mode), R-adf-9 (the apply body gains an instruction to record something), R-adf-10 ("the user"), the plain-language rule
- FEASIBILITY: not applied — one record per change, a replacement now and then
- CONSUME: applied — brief-render renders it (D-br-1); the third change's reader takes it when sign-off is on
- INVOKE: applied — fires at the apply session that checks the last task, in every mode

### D-ca-2 — no reader takes the account while sign-off cannot be on
Domain: every consumer of the reading's selection, with an account in the change's records
| member | covered by |
|---|---|
| `orbit decisions brief`'s selection | the account is left out |
| the system review's read list check (`decision_records_owed`, `decision_records_read`) | the same selection, so the account is neither owed nor listable |
| the archive's `decision_records_unread` count | the same selection, so the account is not counted; brief-render shows it as not checked |
| whether the reading step runs at all | a change whose only record is its account has nothing selected, so no reader is dispatched |
Closure: SOURCED — `selectUnreadRecords` in `src/core/decision-records.ts`, the one function the brief, the owed and read-list check and the archive count call
Moves:
- READ: applied — the selection function's own comment names its three callers; `orbit-review`'s `No records, no reading` keys the dispatch on the folder's absence
- ENUMERATE: applied — this table
- COHERE: applied — the dispatch rule today says a change with no `decisions/` folder gets no reader, but a change whose folder holds only an account has a folder and an empty selection; the rule must key on the selection, checked at propose
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — leaving the account out of the selection also hides it from the unread count, so the brief must say separately that the account was not checked
- CONFORM: applied — D-pb-5 (the reader takes the account only when sign-off is on; with no sign-off setting yet, never), R-adf-11 (no new default-on behaviour), R-adf-12
- FEASIBILITY: not applied — one filter in one function
- CONSUME: applied — the three callers above, and the third change, which adds the rows where sign-off is on
- INVOKE: applied — at every system review and archive of a change carrying an account

## Decisions

- **2026-11-12 — D-ca-1: each change carries one account, written when apply finishes** From D-pb-4 in
  `orbit/explore/program-brief/explore.md` (divided by D-pb-9): a new record, the account, with three plain fields —
  what was built, the new places the user is asked something or a setting now changes what happens, and where the work
  left its stage's charter — written by the apply session that checks the last task, in every mode, and replaced by a
  later apply or the system walk when what it says changes. The record's and fields' names are settled at propose.
  Kind: rule
- **2026-11-12 — D-ca-2: no reader takes the account while sign-off cannot be on** From D-pb-5's off row (D-pb-9): the
  account is left out of the reading's selection, so it is neither read, owed nor counted as unread, and a change whose
  only record is its account dispatches no reader. The third change adds the rows where sign-off is on.
  Kind: rule

## Open questions

## Considered & out

- **2026-11-12 — Writing the three fields into the archive record:** out (D-pb-4). No reader would check them before
  the user signs.

## References

- `orbit/explore/program-brief/explore.md` — D-pb-4, D-pb-5, D-pb-7, D-pb-9: where this change's rules came from.
- `orbit/specs/orbit-decision-records/spec.md` — the three records, where they are kept, the plain-language rule and its table, the replacement rule, the reading step's selection.
- `orbit/specs/orbit-review/spec.md` — `No records, no reading` (the reading's dispatch rule).
- `src/core/decision-records.ts` — `selectUnreadRecords`, the one selection.
