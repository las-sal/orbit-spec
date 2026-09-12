## ADDED Requirements

### Requirement: Test instruments derive from a recorded real-CLI contract

The test instruments that stand in for the GitHub CLI SHALL derive from ONE recorded contract captured from the real binary — `test/integration/pr-lifecycle/gh-contract.json`, carrying per command the usage's positional shape, the accepted flag set, the empirically recorded error rules a help page cannot express (that `gh repo view` rejects `--repo` with `unknown flag: --repo`; that a selector-taking `gh pr` verb given `--repo` without a selector exits with `argument required when using the --repo flag`), and the `gh` version the capture ran against. The harness stub SHALL validate every invocation against that contract and reject in both directions — a flag the real CLI rejects, with the real message; a `gh pr` verb without the `--repo` qualification the shared resolution requires — while returning its scripted responses unchanged on success. The fidelity sweep SHALL validate every invocation-shaped snippet in the generated PR references through the SAME validator, recognizing the references' placeholders as positionals, and SHALL prove grammar only (execution is a separate instrument). The contract's command set is exactly the commands the references invoke plus the availability probe; a verb the contract does not know is a sweep failure. Re-capture is a DELIBERATE act (`npm run capture:gh`, reviewed as a diff); the suite SHALL never shell to a real `gh`. A remembered grammar — hand-written stub branches or sweep regexes beside the contract — is the defect this requirement retires.

#### Scenario: The stub rejects what the real CLI rejects, with the real message

- **WHEN** a harness case invokes the stub as `gh repo view --repo acme/widget --json defaultBranchRef`
- **THEN** the stub exits non-zero with `unknown flag: --repo` on stderr, exactly as the recorded contract states, and `gh repo view acme/widget --json defaultBranchRef` succeeds with the scripted response

#### Scenario: The selector rule is enforced from the contract

- **WHEN** a harness case invokes the stub as `gh pr view --repo acme/widget --json isDraft` with no URL or number
- **THEN** the stub exits non-zero with `argument required when using the --repo flag`, and the same invocation carrying `<url>` succeeds

#### Scenario: The sweep and the stub cannot disagree

- **WHEN** a reference snippet is changed to a form the contract rejects (a flag the CLI does not accept on that verb, or a selector-taking verb without its selector)
- **THEN** the fidelity sweep fails naming the snippet and the contract rule, through the same validator module the stub loads

#### Scenario: Re-capture is deliberate and the suite needs no real gh

- **WHEN** the full suite runs on a machine with no `gh` installed
- **THEN** every contract-derived case passes from the checked-in file, the freshness test asserts only that the file parses and records a version, and no test process spawns a real `gh`; updating the contract requires running the capture script and committing the diff
