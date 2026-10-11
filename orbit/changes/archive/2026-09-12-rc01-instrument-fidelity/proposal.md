## Why

Two of D6's three real defects were `gh` invocations the real CLI rejects (`gh repo view --repo`, a selector-less `gh pr view --repo`), and five review passes walked past the first because the cycle's own instruments — the `gh` stub and the fidelity sweep — encoded a remembered grammar rather than the tool's. A third instance of the same shape surfaced at the D6 archive: the archive emit's payload table omitted four fields its own schema reference documents, so the fail-loud write gate would have rejected a record the archive is required to write. Stage rc01 of `clean-up-review-cycle` (Phase 1, goal G2) makes each instrument DERIVE from a recorded source, so a divergence becomes a failing test instead of a reviewer's finding.

## What Changes

- A checked-in `gh` contract (`test/integration/pr-lifecycle/gh-contract.json`) captured from the real binary by a script: per command, the usage's positional shape, the accepted flag set, the two empirically recorded error rules (`unknown flag: --repo` on `repo view`; `argument required when using the --repo flag` on selector-taking `pr` verbs), and the `gh` version recorded. Re-capture is a deliberate `npm run capture:gh` reviewed as a diff; the suite never shells to a real `gh`.
- The harness `gh` stub becomes a generic argv validator over the contract (unknown flags rejected with the real message; positional shape enforced; the selector rule applied; orbit's own `--repo`-on-`pr`-verbs contract kept), returning the same scripted JSON as today. Five hand-written branches retire.
- The fidelity sweep validates every invocation-shaped snippet in the three PR references against the same contract through a shared validator, replacing its hand-written regexes; placeholders (`<owner>/<repo>`, `<url>`, `<number>`) are recognized as positionals. Grammar only — executing snippets is rc05's.
- A schema-table parity test derives each schema reference's AI-supplied field set (the review, address-reviews, audit-drift, and archive references) and asserts the matching `emit-composition.ts` payload table accepts every field; the archive table's four conditional fields are the first regression case.
- Two small spec deltas recording the instrument contract (see Capabilities).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `orbit-pr-lifecycle`: ADDED requirement — test instruments derive from a recorded real-CLI contract (the stub and the sweep share one source; re-capture is deliberate; no live `gh` in CI).
- `orbit-emit-composition`: ADDED requirement — payload tables agree with their schema references (a parity test over the four documented schemas).

## Impact

- **Tests and harness, one script, and the `src/` edits the parity test forces**: `test/integration/pr-lifecycle/` (harness stub → validator, shared validator module, contract file, new cases), `test/core/templates/orbit-content-fidelity.test.ts` (sweep over the contract), a new `test/core/emit-schema-parity.test.ts`, `scripts/capture-gh-contract.mjs`, and a `capture:gh` entry in `package.json`. No engine BEHAVIOR changes. The `src/` diff is: the review reference's architecture-mode block (`findings_summary` → `scorecard`), the address-reviews block (gained the `delegation_directive` its own notes already documented), a dated divergence note on the audit-drift reference (whose three-way spec contradiction is a ratified rc07 follow-up, not this stage's to resolve — see design D6), and one read-only `payloadFieldsFor` accessor. The final inventory is the change's diff and `orbit update --force`'s output, not a count repeated here.
- **Specs**: two ADDED requirements, no MODIFIED — nothing to fingerprint.
- **Sizing (R-crc-1)**: 2 capabilities touched, 2 requirements, well under the ceiling. The smallest stage in the program; no dependencies.
- **Out of scope (recorded)**: executing snippets (rc05); the emit commands without a schema reference — every command except the four documented ones (rc07); a `git` contract (the harness runs real `git`); any `gh` state simulation.
