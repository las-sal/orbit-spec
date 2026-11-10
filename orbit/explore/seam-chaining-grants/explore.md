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

## Decisions

- **2026-11-10 — D-sga-1: the owed work lands as three changes, all citing stage seam-chaining: the replacement-liveness exemption first, then the consent value with both grants, then the commit before a chained external review** Measured 2026-11-10: together the three pieces change requirements in six capabilities against a ceiling of three — the consent values are listed as exactly two in `orbit-lifecycle-consent` (1 requirement), `orbit-conventions` (1), `orbit-run-summary-emit` (1) and `orbit-archive-modifications` (3), the keys join `orbit-engine-gates`' table, the commit rule sits in `orbit-conventions`' `No-chaining contract`, and the exemption is `orbit-decision-records`'. The exemption is one capability and independent, and the grants change will likely meet the gap, since the D-sc rows it implements supersede earlier entries. The consent value and the grants that write it are one feature, so that change declares a breach of four or five capabilities. The commit rule follows the grants, because chained apply chunks are what leave a tree dirty. This exploration carries the second change; the first opens as its own small change. Revises the architect session's fold of the gap into this change, made before the size was measured. User's word, 2026-11-10 ("a"; AI recommendation).
  Kind: scope

## Open questions

## Considered & out

- **2026-11-10 — The grants and the liveness gap as one change, then the commit rule:** out (D-sga-1). A six-capability breach for a gap that ships alone in one.
- **2026-11-10 — All three pieces as one change:** out (D-sga-1). The largest review surface this program has had, with three independent concerns in one pass.

## References

- `orbit/changes/archive/2026-11-10-seam-chaining/explore.md` — D-sc-5, D-sc-7, D-sc-12, D-sc-14, D-sc-19 and their Mechanism entries
- `orbit/changes/archive/2026-11-10-seam-chaining/.orbit-runs/decisions/ledger-2026-11-10T03-00-50Z.json` — the live case of the liveness gap
- `src/core/decision-records.ts:422` — the liveness refusal on a carried decision citation
- `orbit/specs/orbit-lifecycle-consent/spec.md` — `Consent recorded in consent-scoped lifecycle emits`
