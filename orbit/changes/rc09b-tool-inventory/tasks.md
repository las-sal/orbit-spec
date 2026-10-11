## 1. The head walk

- [ ] 1.1 Give `walkText` in `test/helpers/surface-snippets.ts` a visitor for shell-fence segments and inline spans, keeping the quote-joining loop of `extractFenceLines` the one join; the existing `orbit`, `git` and `gh` sweeps stay green with no expectation changed (design D1)
- [ ] 1.2 Export `analyseHeads(surfaces)` returning `{surface, line, head, source}` per read segment, by the head production of design D5: assignment prefix skipped, every fence segment read, an inline segment read only with a lowercase bare head and a flag token, refused or open lines yielding nothing
- [ ] 1.3 Unit cases for `analyseHeads`: an assignment prefix, a subshell's inner heads, a brace group read as the head `{`, a markdown-nested fence, a flagless inline span, a path head inline (not read) and in a fence (read), `head -1`

## 2. The exemption block

- [ ] 2.1 A reader that resolves the requirement as it stands (exactly one active delta that ADDs or MODIFIes it, two failing and naming both, the baseline otherwise) and parses its `inventory` fence by the production of design D2
- [ ] 2.2 Reader cases: an active delta over the baseline, the baseline alone, two deltas, and each malformation of the requirement's list (no fence, two fences, a non-matching line, an unknown kind, a repeated kind, a repeated head)

## 3. The inventory sweep

- [ ] 3.1 `test/core/cli-grammar/tool-inventory.test.ts`: the day-one sweep, with recorded tools derived as `orbit` plus `recordedTools()` (design D3), all four failure kinds collected (design D4), a non-vacuity floor of the Case 2 heads, and the scenario tag for `Today's surface passes the inventory`
- [ ] 3.2 Injection cases into copies of real surfaces, one per scenario of the ADDED requirement, each asserting its scenario's own outcome by design D6 (a pass; surface, line and head; head and kind; or requirement and line), each carrying its `@scenario` tag
- [ ] 3.3 Carry the MODIFIED requirement's scenarios unchanged; confirm `orbit status --change rc09b-tool-inventory --scenarios` lists every delta scenario declared

## 4. Close

- [ ] 4.1 `npm test` green in full (the full run, never a filtered one), with the count before and after recorded
- [ ] 4.2 `orbit validate rc09b-tool-inventory --strict` passes, and `orbit status --change rc09b-tool-inventory` reads no size breach
- [ ] 4.3 Exit (2) observed: a scratch edit adding `jq -r .x <path>` to a generated body fails the suite naming surface, line and `jq`, then is reverted (the injection tests are its standing proof)
