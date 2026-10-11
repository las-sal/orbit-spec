> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc01-instrument-fidelity

## Premise

Stage rc01 of `clean-up-review-cycle` (Phase 1, goal G2): the cycle's own instruments must
reject what the real tools reject. The D6 trail shows the failure mode twice: `gh repo view
--repo` and a selector-less `gh pr view --repo` were invalid CLI grammar, and five review
passes walked past the first because the `gh` stub accepted it and the fidelity sweep
checked only that `--repo` was present. A third instance of the same shape appeared at the
D6 archive: the archive emit's payload table omitted four fields its own schema reference
documents, and the fail-loud write gate would have rejected the record the archive is
required to write.

All three instruments encode a REMEMBERED truth — hand-written stub branches, hand-written
sweep regexes, hand-listed payload fields — beside a real source (the installed `gh`, the
schema reference) they are not derived from. The exploration's question: what is the
smallest change that makes each instrument DERIVE from its source, so a divergence is a
failing test rather than a reviewer's finding?

Smallest stage in the program; no dependencies; ships first. Sized under R-crc-1: one
capability delta at most, tests and harness otherwise.

## Decisions

- **2026-09-11 — D-rc01-1: a checked-in `gh` contract, captured from the real binary, is the
  single source both the stub and the sweep derive from** (settled under R-crc-3). File:
  `test/integration/pr-lifecycle/gh-contract.json`. Per command in the contract set: the
  USAGE line's positional shape (`gh repo view [<repository>]`, `gh pr view [<number> |
  <url> | <branch>]`), the accepted flag names (from the FLAGS and INHERITED FLAGS
  sections), and the empirically recorded rules a help page cannot express — that `gh pr
  <verb> --repo X` without a selector exits with `argument required when using the --repo
  flag`, and that `gh repo view` rejects `--repo` with `unknown flag`. Captured by a script
  (`scripts/capture-gh-contract.mjs`) that runs `gh <cmd> --help` for each command and the
  two error probes (both fail before any network request), and records `gh --version` in
  the file. Rationale: the two D6 CRITICALs are exactly the class a recorded contract
  catches, and deriving both instruments from one file means the stub and the sweep can
  never disagree with each other, only — detectably — with a newer `gh`.
- **2026-09-11 — D-rc01-2: the stub becomes a generic argv validator over the contract**
  (settled under R-crc-3). It splits flags from positionals, rejects any flag not in the
  command's accepted set with the real CLI's message (`unknown flag: --repo`), enforces the
  positional shape, applies the recorded selector rule for `--repo`, and keeps enforcing
  orbit's own contract that `gh pr` verbs carry `--repo` (the real CLI would guess a
  repository; the reference forbids relying on that). The scripted responses
  (`defaultBranch`, `prList`) stay as they are. Rationale: today's stub is five hand-written
  branches that grew one rule per CRITICAL; a validator over the contract grows zero
  branches when the contract set grows.
- **2026-09-11 — D-rc01-3: the fidelity sweep checks snippets against the same contract, not
  against hand-written regexes** (settled under R-crc-3). Each invocation-shaped snippet in
  the three PR references is parsed into verb + flags + positionals and validated exactly as
  the stub validates argv (shared helper). Placeholders (`<owner>/<repo>`, `<url>`,
  `<number>`) are recognized as positionals. Executing the snippets is rc05's job; here the
  sweep proves grammar only, and says so in its test name.
- **2026-09-11 — D-rc01-4: re-capture is a deliberate act, and the tests never require a
  real `gh`** (settled under R-crc-3). The suite reads the checked-in contract; nothing in CI
  shells to a real `gh`. A `contract-freshness` test asserts the file parses and records a
  version, never that it matches the host's `gh`. Re-capture is `npm run capture:gh` on a
  machine with `gh` installed, reviewed as a diff — the same discipline as `orbit
  fingerprint --refresh`. Rationale: help output changes across versions; a test that parses
  live `--help` would be nondeterministic across machines and would need `gh` everywhere.
- **2026-09-11 — D-rc01-5: a schema-table parity test derives the AI-supplied field set from
  each schema reference and asserts the matching payload table accepts it** (settled under
  R-crc-3). The four schema references live as template constants (the review,
  address-reviews, audit-drift, and archive `references/*schema*.md` contents in
  `src/core/templates/workflows/`); the test parses each one's JSON block, subtracts the
  engine-owned spine and computed fields (a single explicit list: `command`, `timestamp`,
  `change`, `doc`, `kind`, `model`, `next_recommended`, `iteration`, and the per-command
  computed extensions the mirror marks as engine-owned), and asserts every remaining key is
  in `emit-composition.ts`'s `payloadFields` for that command. The archive table's four
  conditional fields are the first regression case. Rationale: the mirror is documented as
  "never the definition"; the test makes the definition and the mirror agree without
  choosing which is authoritative.
- **2026-09-11 — D-rc01-6: one small spec delta, not a new capability** (settled under
  R-crc-3). An ADDED requirement on `orbit-pr-lifecycle` — "Test instruments derive from a
  recorded real-CLI contract" — with three scenarios (unknown flag rejected with the real
  message; selector rule enforced; re-capture is deliberate), plus one scenario on
  `orbit-emit-composition` for the schema-table parity. Two capability deltas, two
  requirements, well under R-crc-1.
- **2026-09-11 — D-rc01-7: the contract set is exactly the commands the three PR references
  invoke** (settled under R-crc-3; was Q-rc01-1) — `repo view`, `pr list`, `pr create`,
  `pr view`, `pr edit`, `pr ready`, `pr merge` (user-copied text, still a grammar claim) —
  plus the `--version` availability probe. Nothing speculative; the set grows only when a
  reference grows, and the sweep fails on a verb the contract does not know.
- **2026-09-11 — D-rc01-8: the contract covers `gh` only, never `git`** (settled under
  R-crc-3; was Q-rc01-2). The harness runs real `git`, so a `git` claim is checked by
  execution; simulating it would replace a real check with a remembered one. rc05 extends
  execution to every snippet.
- **2026-09-11 — D-rc01-9: the ten commands without a schema reference are out of rc01's
  scope, recorded as a gap for rc07** (settled under R-crc-3; was Q-rc01-3). Their payload
  fields are documented inline in bodies; a parity test needs a machine-readable source,
  and rc07's one-voice rule is where that source gets made.
- **2026-09-11 — D-rc01-10: the capture script records the real error STRINGS, not just that
  the CLI errors** (settled under R-crc-3; was Q-rc01-4). The stub reproducing `unknown
  flag: --repo` and `argument required when using the --repo flag` is what lets a
  transcription test assert the real failure; the strings are cheap to re-capture and a
  changed string is itself a signal worth a diff.

## Open questions

(none — the four raised during the session were settled under R-crc-3 and moved to
Decisions; see D-rc01-7 through D-rc01-10)

## Considered & out

- **Parsing `gh --help` live at test time** (2026-09-11) — needs `gh` on every machine and
  drifts with the installed version; rejected for a checked-in contract with deliberate
  re-capture.
- **A fuller `gh` simulator** (2026-09-11) — modelling PR state transitions in the stub is
  rc12-territory and out of scope; the stub validates grammar and returns scripted JSON,
  nothing more.
- **Making the schema references the single source by generating the payload tables from
  them** (2026-09-11) — the cleaner end state, but it inverts the documented authority
  (the engine table is the definition, the mirror follows) and touches the emit engine; a
  parity test gives the same guarantee with no engine change. Revisit under rc07 if the
  one-voice rule wants generation.

## References

- `test/integration/pr-lifecycle/harness.ts` — the current stub (`installGhStub`), five
  hand-written branches to be replaced by the validator.
- `test/core/templates/orbit-content-fidelity.test.ts` — the current sweep (`every copyable
  gh invocation … IN THE GRAMMAR THE COMMAND ACCEPTS`), hand-written regexes to be replaced
  by contract checks.
- `src/core/emit-composition.ts` — the fourteen `payloadFields` tables; the archive table's
  four conditional fields added 2026-09-11 are the first parity regression case.
- `src/core/templates/workflows/{review,address-reviews,audit-drift,archive-change}.ts` —
  the four schema references as template constants.
- `orbit/changes/archive/2026-09-11-d6-pr-lifecycle/.orbit-runs/external-system-2026-09-11T00-54-45Z.md`
  and `…T15-27-09Z.md` — the two real-CLI grammar CRITICALs.
- `orbit/changes/archive/2026-09-11-d6-pr-lifecycle/.orbit-runs/archive-2026-09-11T17-41-00Z.json`
  — the archive whose emit table gap was fixed in-flow.
- `orbit/architecture/clean-up-review-cycle.md` — stage rc01's charter; R-crc-1 (ceiling),
  R-crc-3 (method delegated), G2.
