## 1. Engine: citation divergence (D-rba-1)

- [ ] 1.1 Extract the targeting predicate from `publish.ts:62` into one exported function in `src/core/pr/inputs.ts` returning `{granularity, doc?}`; `publish` resolves its branch and attachment through it, with no behaviour change (the publish suite stays green unmodified)
- [ ] 1.2 In `preflight.ts`, compute `observations.citation` as `{recorded, current, would_select, diverged}` through that function, `diverged` comparing `would_select` with the attachment's `(granularity, doc)`; the outcome logic is untouched
- [ ] 1.3 Add preflight cases for all five rows of the delta's divergence table (change 1's false positive first), tagged `@scenario` for the two new preflight scenarios
- [ ] 1.4 Run `orbit pr preflight rc12-body-adoption --json` on this change (cited, `per-proposal`, attached at propose) and record `diverged: false` in the apply emit

## 2. References: call and act (D-rba-4, D-rba-2, D-rba-3)

- [ ] 2.1 Rewrite the propose/ff reference in `pr-choreography.ts`: call `select` at phase 1 and `publish` at phase 3, point at the consumption table and the title rule by owner (R-crc-14), and keep only the judgment (title, intent body, commit message, note wording); delete the resolution, preconditions, compatibility, commit-scope, query and recovery prose
- [ ] 2.2 Rewrite the archive reference: `preflight` before the emit (its `observations.emit` feeds the emit's `pr_url`/`pr_state`, the divergence note from `citation.diverged`), `tail --outcome` after it, the achievement body or stage entry as judgment, and `human_acts` shown verbatim at the close as the user's (the post-merge return)
- [ ] 2.3 Rewrite the architect reference around `orbit pr program <doc>` and its `human_acts`; if it cannot come in under 2,307 bytes as a file, fold the call into the architect body and delete the reference (design Risks)
- [ ] 2.4 Rewrite the PR sections of `propose.ts`, `ff-change.ts`, `archive-change.ts` and `architect.ts` to name the subcommand at each step; keep the regime read from `orbit status --json`'s `pr` field
- [ ] 2.5 Sweep the four bodies and `pr-choreography.ts` for the deleted runbook's vocabulary (`check-ref-format`, `four-axis`, `git commit --only`, `symbolic-ref`, `title line`) and remove every survivor that restates an engine step

## 3. Instruments and pins

- [ ] 3.1 `npm run build && node bin/orbit.js update --force`; run the recorded-contract sweep, the tool-inventory test and the `orbit` grammar sweep over the new snippets, fixing any head or flag the surface now writes that the contracts lack
- [ ] 3.2 Move the content-fidelity, skill-templates parity and generated-surface pins the rewrite breaks, each recorded as its own act in the test it moves
- [ ] 3.3 Tag the consumption and title scenarios against the tests or reference assertions that exercise them; ledger any whose THEN only a body read can show, with its why
- [ ] 3.4 Full `npm test` green; state the count

## 4. Exit (2) measurement (D-rba-6)

- [ ] 4.1 `wc -c` the three generated references and record each against its target (< 9,229, < 6,450, < 2,307) in the apply emit; a miss is briefed to Sal before any D-rc12-3 fallback code moves
