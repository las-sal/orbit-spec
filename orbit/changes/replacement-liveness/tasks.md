## 1. The carried decision check

- [ ] 1.1 In `src/core/decision-records.ts`, give `checkCitationExists` a `carried` parameter, passed from `checkDecisionLinks`'s existing flag; in the `decision` case, a carried citation resolves when `decisionEntryText` finds the ID (any disposition) and a new one when `liveDecisionIds` holds it; the refusal names the citation either way, saying "no Decisions entry" for a carried citation and "no live Decisions entry" for a new one
- [ ] 1.2 In `src/core/disciplines.ts`, add the carried exception to `CITATION_EXISTS.decision`: on a replacement, whose citation is carried, an entry with that ID whatever its `Disposition:`

## 2. Tests

- [ ] 2.1 In `test/core/decision-records.test.ts`, add a test for `A replacement keeps its citation of a superseded decision`: write `ledger-A` citing a live `D-foo-2`, mark `D-foo-2` superseded, then show a replacement carrying `ledger-A`'s links is written and the same citation without `replaces` is refused; repeat with `Disposition: assigned <stage-id>` (the motivating D-sc-9 case); and show `buildDecisionBrief` renders the replacement with the cited entry's text, its `Disposition:` line included; shown able to fail by reverting the predicate to the live check
- [ ] 2.2 Add a test for `A carried decision citation that names nothing is refused`: `ledger-A` cites `D-foo-2`, the entry is removed from `explore.md`, and a replacement is refused naming `relies_on[0]`; shown able to fail by letting a carried decision citation skip the check
- [ ] 2.3 Keep the existing `A superseded decision is not citable` test (a payload without `replaces`) green and its declaration unchanged
- [ ] 2.4 In `test/core/decision-writing-parity.test.ts`, assert that `DECISION_RECORDS_REFERENCE`'s `decision` line names the carried exception (a replacement's carried citation, whatever its `Disposition:`); shown able to fail by reverting the line in `CITATION_EXISTS.decision`
- [ ] 2.5 Run `npm run build && node bin/orbit.js update --force` and the full `npm test`
