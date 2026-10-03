## ADDED Requirements

### Requirement: An internal CRITICAL carries its reproduction at the write gate

`orbit emit review` SHALL refuse a proposal- or system-mode payload whose `findings[]` holds an entry with `severity: "CRITICAL"` and no non-empty string `reproduction` — absent, non-string, or blank after trimming — exiting non-zero, naming the finding's title and index, writing no file, with empty stdout. This is the first check the gate performs INSIDE a finding entry: `validatePayload`'s unknown-key check stays at the top level (unknown finding keys remain unchecked, so `recommendation_options`-style forward-compat is untouched), and the new check reads exactly one field of exactly one severity. The engine judges PRESENCE only (R-crc-10): whether the reproduction reproduces is the walk's judgement, per `orbit-address-reviews`. The rule the check enforces is `orbit-conventions`' Severity ladder; this requirement names it and defines nothing of its own.

#### Scenario: CRITICAL without reproduction refused

- **WHEN** a review payload's `findings[]` carries `{ "severity": "CRITICAL", "title": "X", … }` with no `reproduction` key, or `"reproduction": ""`, or `"reproduction": 42`
- **THEN** the surface exits non-zero with `write gate: findings[<i>] 'X' is CRITICAL and carries no reproduction`; no file is written; stdout is empty

#### Scenario: CRITICAL with a multi-line reproduction accepted

- **WHEN** a CRITICAL entry's `reproduction` is a non-empty string containing newlines
- **THEN** the emit writes — the field is not a single-line slot and the single-line helper is not applied to it

#### Scenario: WARNING and SUGGESTION are not checked

- **WHEN** a WARNING or SUGGESTION entry carries no `reproduction`
- **THEN** the emit writes; the field is optional below CRITICAL and its presence there is passed through verbatim

#### Scenario: Prior-generation emits are untouched

- **WHEN** the trail holds a review emit written before this requirement whose CRITICAL carries no `reproduction`
- **THEN** every reader (trail, render, gate) accepts it as before — the check runs at write time only and no migration re-grades or rewrites it
