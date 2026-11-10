## Why

A decision record is fixed by a replacement that carries the original's links unchanged, but the write gate checks a
carried link as if it were new, and a new citation of a decision must name a LIVE Decisions entry. So once a decision a
record cites is superseded or assigned, which is routine during an exploration, that record can never be corrected. It
happened on 2026-11-10 (seam-chaining's `ledger-2026-11-09T17-50-54Z.json`, citing D-sc-9), and the only way out was a
second, separate entry. The gate is stricter than its own reader: the brief renders a Decisions entry of any
disposition, and the spec already says a carried link stays as its original wrote it. This is the first of the three
changes D-sga-1 set for finishing stage `seam-chaining` of `automate-dev-flow` (see `explore.md`).

## What Changes

- On a replacement (a payload carrying `replaces`), a carried `decision` citation is accepted when the work's
  `explore.md` holds a Decisions entry with that ID, whatever its `Disposition:` (D-rl-1).
- A new citation of a decision, on a record that replaces nothing, still needs a live entry; a carried citation of an
  ID the `explore.md` does not hold is still refused.
- Every other citation kind (`requirement`, `ruling`, `goal`, `resolution`) and the named-stop links (`raised_stop`,
  `stop`) are checked exactly as today.
- A carried `requirement` citation whose requirement another change's archive renamed or removed stays refused, stated
  as a named limit (D-rl-2).
- The generated `decision-records.md` reference states the carried exception beside the live rule.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-decision-records`: `A ledger entry names what it relies on` — the `decision` row of the citation table gains
  the carried exception, a scenario shows a replacement keeping its citation of a superseded decision, and a named limit
  records the requirement-rot case.

## Impact

- `src/core/decision-records.ts` — `checkCitationExists` takes whether the citation is carried; `checkDecisionLinks`
  passes it.
- `src/core/disciplines.ts` — the `decision` line of `CITATION_EXISTS`, which every generated `decision-records.md`
  reference carries.
- `test/core/decision-records.test.ts` — the new scenarios.
- No change to the brief, to any other record kind, or to what a user is asked.
