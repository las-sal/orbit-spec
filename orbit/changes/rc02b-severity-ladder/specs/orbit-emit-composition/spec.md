## ADDED Requirements

### Requirement: The review payload carries `blocks`

The `review` command's payload table SHALL admit an OPTIONAL `blocks` field: an array of single-line strings, each naming a lifecycle BLOCK the pass found (per `orbit-conventions`' Severity ladder — a condition that must be addressed before apply and is not a severity) with its location. The write gate enforces the single-line slot on each entry and the array shape; a non-array or a multi-line entry is refused naming the index. The field is pass-through narrative: it is never counted in the scorecard rollup, never read by the gate graph, and absent means no block was found. `references/run-summary-schema.md` names it and the schema-table parity test derives it.

#### Scenario: Blocks accepted and carried

- **WHEN** a review payload carries `"blocks": ["Pass 1: orbit validate fails — specs/x/spec.md:12 scenario has 3 hashtags"]`
- **THEN** the emit writes with the array verbatim; the scorecard rollup check is unchanged by it

#### Scenario: Malformed blocks refused

- **WHEN** `blocks` is not an array, or an entry is not a string, or an entry contains a newline
- **THEN** the surface exits non-zero naming `blocks[<i>]` (or `blocks` for a non-array); no file is written

### Requirement: An internal CRITICAL carries its reproduction at the write gate

`orbit emit review` SHALL refuse a review payload in ANY mode (proposal, system, architecture — the check reads one field of one severity and never reads `mode`) whose `findings[]` holds an entry with `severity: "CRITICAL"` and no non-empty string `reproduction` — absent, non-string, or blank after trimming — exiting non-zero, naming the finding's title and index, writing no file, with empty stdout. This is the first gate check that REFUSES on a finding entry's narrative field (the scorecard rollup already reads every entry's `dimension` and `severity`, as a rollup); `validatePayload`'s unknown-KEY check stays at the top level (unknown finding keys remain unchecked, so `recommendation_options`-style forward-compat is untouched), and the new check reads exactly one field of exactly one severity. The engine judges PRESENCE only (R-crc-10): whether the reproduction reproduces is the walk's judgement, per `orbit-address-reviews`. The rule the check enforces is `orbit-conventions`' Severity ladder; this requirement names it and defines nothing of its own.

#### Scenario: CRITICAL without reproduction refused

- **WHEN** a review payload's `findings[]` carries `{ "severity": "CRITICAL", "title": "X", … }` with no `reproduction` key, or `"reproduction": ""`, or `"reproduction": 42`
- **THEN** the surface exits non-zero with `write gate: findings[<i>] 'X' is CRITICAL and carries no reproduction`; no file is written; stdout is empty

#### Scenario: CRITICAL with a multi-line reproduction accepted

- **WHEN** a CRITICAL entry's `reproduction` is a non-empty string containing newlines
- **THEN** the emit writes — the field is not a single-line slot and the single-line helper is not applied to it

#### Scenario: WARNING and SUGGESTION are not checked

- **WHEN** a WARNING or SUGGESTION entry carries no `reproduction`
- **THEN** the emit writes; the field is optional below CRITICAL and its presence there is passed through verbatim

#### Scenario: Architecture mode is checked the same way

- **WHEN** `orbit emit review --doc <doc>` composes an architecture-mode summary whose CRITICAL carries no `reproduction`
- **THEN** it is refused exactly as a change-mode payload is — the mode-scoped render exemption is about the normalizer, not this check

#### Scenario: Prior-generation emits are untouched

- **WHEN** the trail holds a review emit written before this requirement whose CRITICAL carries no `reproduction`
- **THEN** every reader (trail, render, gate) accepts it as before — the check runs at write time only and no migration re-grades or rewrites it
