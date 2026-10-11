# External Review: rc01-instrument-fidelity (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-09-12

## CRITICAL

### The shared validator accepts malformed flag values that the captured CLI rejects
**File**: test/integration/pr-lifecycle/gh-contract-validate.cjs:34
**Description**: The parser recognizes a flag's name and arity but discards its value without validating it; an arbitrary `=value` is accepted even on a boolean flag. Reproduction: I ran `gh repo view x/y --web=garbage` through the stub installed by `makeRepo()`: exit 0 with the scripted default-branch JSON. The same command against the captured version, real gh 2.91.0, exits 1 with `invalid argument "garbage" for "-w, --web" flag: strconv.ParseBool: parsing "garbage": invalid syntax`. Likewise, `gh pr list --repo x/y --limit=garbage` returns exit 0 and `[]` from the stub, while real gh rejects it with a ParseInt error before any network request. These are parser errors, not PR-state simulation. Preserve the relevant value types from help in the recorded contract, validate explicit boolean and typed values, and add these reproductions to both consumer tests. Otherwise the stage still certifies commands the very binary it captured cannot parse.

### Schema extraction silently drops documented fields based on formatting
**File**: test/core/emit-schema-parity.test.ts:40
**Description**: `documentedKeys` identifies top-level keys by exactly two spaces and one key per line, rather than object structure. Reproduction: in the audit-drift reference, change the command line to `  "command": "audit-drift", "unexpected_field": true,`, then run `npx vitest run test/core/emit-schema-parity.test.ts`: all 13 tests pass although the payload table rejects `unexpected_field`. Putting that field on its own line with four spaces also passes; putting it on its own line with two spaces correctly fails naming the field. The new field-note extractor has the same silent-omission problem: replacing the categories bullet's subject with ``- **`categories_run` / `categories_skipped`**`` also leaves all 13 tests green, despite restoring the orphaned field that motivated this check. Extract keys structurally, or explicitly reject unsupported schema formatting, and collect every named subject in grouped field-note bullets. Keep these mutations as negative fixtures so valid formatting changes cannot bypass the instruments.

### Unknown command families bypass the snippet sweep entirely
**File**: test/core/templates/orbit-content-fidelity.test.ts:385
**Description**: The extractor hard-codes `repo|pr` before the shared validator sees any argv. Reproduction: add the backticked invocation `gh frobnicate --repo <owner>/<repo>` to `PR_RESOLUTION_SECTION` in `src/core/templates/workflows/pr-choreography.ts`, then run `npx vitest run test/core/templates/orbit-content-fidelity.test.ts`: all 113 tests pass. The validator itself rejects those argv as an unknown command. As a control, inserting `gh pr frobnicate --repo <owner>/<repo>` makes the sweep fail. Thus the declared unknown-verb failure only works inside two remembered command families; a new or mistyped top-level command silently escapes the contract. Extract invocation-shaped `gh` snippets independently of the supported command set, then let contract lookup reject unsupported commands. Exercise the extractor in the negative fixtures, rather than passing preselected strings directly to `snippetArgv`.

## WARNING

### The audit-drift mirror correction leaves contradictory archived emit requirements
**File**: src/core/templates/workflows/audit-drift.ts:29
**Description**: The correction agrees with the engine's accepted keys, but baseline compliance is not established. `orbit/specs/orbit-conventions/spec.md:223` explicitly preserves audit-drift's `findings_summary`; its `Editorial command emit shape (with findings)` scenario at line 321 explicitly requires audit-drift to keep `findings_summary` and `finding_titles`. Both are absent from the corrected reference and rejected by its payload table. There is also an existing shape contradiction in the reference this change rewrites: `orbit/specs/orbit-run-summary-emit/spec.md:477` requires `categories_run` to be an object of named booleans, while the corrected field note at audit-drift.ts:74 specifies an array of category IDs. An implementer following these archived requirements would produce a different emit. Reconcile the standalone audit contract through the owning spec deltas, preserving the separately defined nested archive `audit.findings_summary` shape. The two current ADDED-only deltas do not resolve these disagreements.

### Whitespace splitting makes the sweep disagree with the stub on quoted values
**File**: test/core/templates/orbit-content-fidelity.test.ts:334
**Description**: Sharing `validate` does not ensure the consumers supply equivalent argv. Reproduction: replace only `--title "<title>"` with `--title "Fix title"` in the existing PR-create recovery snippet, then run `npx vitest run test/core/templates/orbit-content-fidelity.test.ts`. The grammar test fails with `accepts 0 arg(s), received 1`: whitespace splitting turns one quoted value into a flag value and a stray positional. The actual shell/stub argv carries `Fix title` as one value and is accepted by the validator. Use a quote-aware tokenizer that preserves angle-bracket placeholders without executing them, and add paired snippet/stub cases for quoted and escaped values. Update design D5's whitespace-splitting prescription accordingly; it cannot satisfy the scenario that the sweep and stub cannot disagree.

## SUGGESTION

### Resolve the contract files relative to the test module
**File**: test/core/templates/orbit-content-fidelity.test.ts:325
**Description**: Both new file paths depend on `process.cwd()` being the repository root. I ran `node <repo>/node_modules/vitest/vitest.mjs run --root <repo> test/core/templates/orbit-content-fidelity.test.ts` from `/private/tmp`; collection failed with ENOENT for `/private/tmp/test/integration/pr-lifecycle/gh-contract.json`, before any tests ran. Use module-relative URLs or paths for the contract and validator, as the dedicated contract test already does. This preserves normal root execution while making explicit-root invocations work.

### Refresh the restated mirror and surface counts from the completed change
**File**: orbit/changes/rc01-instrument-fidelity/proposal.md:24
**Description**: The proposal still says two mirror corrections and exactly two generated reference changes; design's context/non-goals/D6/touchpoints and checked tasks 4.3/5.1 repeat that earlier scope. The source of truth is the final diff and an actual generation comparison: the address-reviews correction makes three changed references, alongside audit-drift and review, and the accessor is another `src/` edit. Update these active restatements from that source, or point to the final change inventory instead of repeating counts. The later resolution log records the expansion, but the checked acceptance wording remains stale.

## Notes

Reviewed commit `5790f37` against `6a5e3b6`, including the program premise/rulings, change artifacts, prior review/resolution trail, and relevant archived capabilities. The branch contained the implementation as a pushed commit. All 13 tasks are checked; their implementation sites exist, with the instrument gaps and stale acceptance wording described above.

Delta-scenario tracing (paths below are under `test/`):

| Scenario | Executing coverage |
| --- | --- |
| Stub rejects the invalid repo flag with the real message | `integration/pr-lifecycle/phase1.test.ts:102` and `gh-contract.test.ts:60`; positive positional form is executed through the installed stub. |
| Selector rule comes from the contract | `integration/pr-lifecycle/phase1.test.ts:121` exercises the copied stub's rejection; `gh-contract.test.ts:65` checks rejection and acceptance with a URL. |
| Sweep and stub cannot disagree | `core/templates/orbit-content-fidelity.test.ts:374` and `:395` invoke the shared module; the extraction/tokenization mutations above expose the remaining gaps. |
| Deliberate recapture; no real gh needed by the suite | `integration/pr-lifecycle/gh-contract.test.ts:15` checks the saved contract. Both full-suite runs passed, including the run with no host gh on PATH. All test-tree gh spawns were traced to the stub or deliberately absent PATH. |
| Documented conditional fields accepted | `core/emit-schema-parity.test.ts:98` covers all four archive fields; `:122` removes `gate_overridden` from a comparison table and detects it. |
| Every full-record block read | `core/emit-schema-parity.test.ts:68` unions extracted keys; `:114` checks both review blocks and the architecture-only `handoff` key. Formatting bypasses are reproduced above. |
| New engine-owned key must be declared | `core/emit-schema-parity.test.ts:76` subtracts the explicit lists and checks the remainder. A two-space `unexpected_field` mutation fails; alternate formatting bypasses that assertion. |

`npm ci` built successfully. Normal `npm test` and the isolated-PATH run each passed 2,036 tests across 93 files. Strict validation passed. Recapture against installed gh 2.91.0 reproduced the contract with only `captured_at` changing. A baseline build/init followed by the current `update --force` retained 15 skills and 15 commands and changed exactly the address-reviews, audit-drift, and review schema references. The copied stub fails nonzero for malformed or missing contract JSON. All temporary source mutations and the recaptured contract were restored; no implementation changes are included in this review.

The architecture-mode switch to `scorecard` is supported by `orbit-review`'s summary requirement and `orbit-emit-composition`'s mode-scoped write-gate requirement. Address-reviews' added `delegation_directive` agrees with its existing notes and payload table. Perspective and critical-path passes were skipped because `orbit/lenses/` is absent. Live GitHub API access was unavailable in this environment; the reproduced real-CLI parser failures and contract capture completed before network access. An additional terminator probe showed the validator rejecting `--` as an unknown flag while real gh proceeded to its network step; successful online execution was not established.
