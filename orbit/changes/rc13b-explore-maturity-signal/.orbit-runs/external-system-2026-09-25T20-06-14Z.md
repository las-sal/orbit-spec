# External Review: rc13b-explore-maturity-signal (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-25

## CRITICAL

### Repeated sections discard earlier rule evidence and falsely render Accounted
**File**: src/core/parsers/explore-counter.ts:97
**Description**: The collector now feeding the FORM parser replaces an existing section whenever its heading recurs. I executed a file with four live Decisions, an initial `## Mechanism` containing D-x-1 without a Closure and orphan D-x-9, then a second `## Mechanism` containing complete SOURCED entries D-x-1 through D-x-4. Both the parser and real `orbit emit explore` returned `rules_total: 4`, empty `rules_open` and `key_defects`, and `/orbit:propose ... 4 live rules accounted`. The first D-x-1 must remain the owning entry with `no-closure`; the later D-x-1 must be a duplicate and D-x-9 an orphan. Repeating `## Decisions` likewise discards an earlier live rule. This loses members before the join and defeats the central no-silently-open-domain obligation. Preserve all occurrences in file order, including section/entry boundaries, and apply first-key-wins across the complete file; add regressions spanning repeated sections rather than only repeated IDs within one section.

## WARNING

### Slots outside a Decisions list item can silently opt its rule out
**File**: src/core/parsers/explore-counter.ts:114
**Description**: Once a top-level item starts, every subsequent line up to another item or H1/H2 is attributed to it. An unindented `### Example` ends the Markdown list item, but the following unindented `Kind: fact` is still consumed as that decision's slot. In a real emit with four decisions, D-x-1 otherwise defaulting to a live rule, three legitimate fact entries, and no Mechanism entries, inserting that H3 and slot after D-x-1 produced `rules_total: 0`, no open rules, and an Accounted/propose recommendation instead of D-x-1 being `absent`. The owning Decision-entry requirement allows slots only in lines belonging to the list item; this heading is not a lazy paragraph continuation. Respect list-item/block boundaries while retaining valid nested bullets and lazy continuations. Add tests ensuring out-of-item Kind, Disposition, and Re-entry lines cannot modify the preceding decision.

### Valid Domain-table whitespace is rejected as a malformed rule
**File**: src/core/explore-grammar.ts:102
**Description**: `TABLE_CELL_ROW` requires literal spaces immediately inside every pipe and forbids trailing whitespace after the final pipe. With the required header and separator unchanged, replacing `| a | case |` by `|a|case|`, or merely appending two spaces to the original member row, changes four otherwise accounted SOURCED rules into four `malformed-entry` rules. The compact-row case also reproduced through the real CLI and switched its recommendation to explore. These remain two-cell tables under the [GFM table grammar](https://github.github.com/gfm/#tables-extension-), which the owner explicitly adopts for cells; neither is one of the owner's malformed-table conditions. Parse unescaped cell separators with GFM-compatible whitespace handling, then validate the required columns and nonempty enumeration. Cover compact rows, padded rows, trailing spaces, and escaped pipes in regressions.

### A concluded explore regains the eligibility label when metadata is degraded
**File**: src/commands/workflow/status.ts:307
**Description**: The bare-next exception checks `entry.position`, but the degraded orientation branch preserves the trustworthy trail-derived `last` and `next` without preserving position. After a real concluded emit, I made only the staging metadata invalid YAML (`schema: [broken`). Full text status then rendered `Ready when you are: Concluded 2026-09-25. Reopens when: a third withdrawn stage.` JSON still contained `last.status.token: concluded` and the correct prose. Thus an unrelated metadata error reintroduces the eligibility claim that the concluded rule expressly removes. Determine this exception from the retained newest valid emit's status token, or retain the independently trustworthy concluded state through degradation. Exercise degraded concluded explores in both text tiers, without rereading the live header or suppressing the metadata error.

### Generated explore instructions still teach the retired count-only Mature rung
**File**: src/core/templates/workflows/explore.ts:673
**Description**: The live Run-summary emit paragraph still describes the recommendation as `Early / Mid / Mature / Stalled from the counts`. I confirmed this sentence in the generated skill instructions returned by the template. It contradicts the shipped six-rung, header-and-rule-aware grid and is not either of the two deferred KNOWN/concluded-outcome clauses declared in the design. Replace this restated grid with a pointer to the owning maturity-recommendation requirement, or accurately describe the new inputs and rungs. The byte-identical-body/unchanged-pin tasks currently preserve this contradiction: resolve that constraint explicitly when correcting the prose rather than silently moving the pin, and retain the checked grammar mirrors.

## SUGGESTION

### Reconcile the remaining contradictory field-shape descriptions
**File**: orbit/changes/rc13b-explore-maturity-signal/design.md:73
**Description**: The design still says an orphan is reported in `rules_open` with `key_defects` kind orphan, despite its surrounding disjoint-array decision and the correct implementation placing it only in `key_defects`. Its five-field description also says `re_entry` is present only with exactly one live carrier, while its earlier recovery rule and the implementation retain the first when multiple carriers exist. The emit-composition delta repeats the latter contradiction: “iff ... exactly one” followed immediately by first-wins for multiple carriers. Remove the stale orphan-array phrase and distinguish the exactly-one authoring obligation from the decoder's explicit first-wins recovery in both design and delta. These are documentation corrections, not requests to change the implemented recovery behavior.

## Notes

Reviewed apply revision `69adda5da25a2b373b75314c2d0c594ea36d9698` and the requested diff from `99b51afc`. The blind-pair boundary was maintained: no system-review emit, post-prompt walk, or other half's findings were read.

Build succeeded; all 2,312 tests in 100 files passed. Strict change validation succeeded and all six checked fingerprints verified. The four capability deltas cover seven requirement blocks; the declared ceiling exception is recorded. Seventeen of eighteen tasks are checked, with task 6.4 intentionally left as the user-validation handoff rather than edited by this review. The grammar-string parity tests and unchanged explore-body hash pin passed.

Executed the shipped scenario tests plus 39 independent asserted parser/grid/CLI check groups and additional adversarial probes. Coverage included every rung and open-rule state, bounded identifier rendering, CRLF, blank lines before tables, fenced slots and closures, nested fence lengths, over-indentation, uppercase IDs, wrapped openers, duplicate/orphan keys, disposition defaults, superseded Re-entry carriers, engine-owned refusal without writes, and both the current exploration and archived exemplar. The ordinary scratch conclude sequence behaved correctly: a header edit alone did not change orientation; the subsequent emit supplied the concluded chip, position, and bare prose in text and JSON without adding WAITING entries.

Consumer checks exercised boot, report rendering against a synthetic scratch review, audit-drift deferral of prose recommendations, review-trail filtering, and archived emit reading. Caller inspection found no unresolved maturity-function signature drift or mandatory leading-command-token consumer. Optional project/convention context and the named perspective/critical-path lens files were absent; no named perspectives were invented.

The main residual risk is input ownership before the ID join: parity of grammar strings does not establish that every section and every slot is attributed correctly. The repeated-section failure is an ENUMERATE failure of the shipped mechanism.

READ/ENUMERATE/COHERE CRITICALs: 1 of 1.
