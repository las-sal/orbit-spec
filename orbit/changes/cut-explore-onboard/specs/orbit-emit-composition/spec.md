## MODIFIED Requirements

### Requirement: The explore grammar has one source in code

The three productions `orbit-conventions` owns for `explore.md` — the status header, the Decision entry (ID opener and slot lines), and the Mechanism entry (`Domain:` table, `Closure:` token, residual slots, move lines) — SHALL be carried in code by ONE module, `src/core/explore-grammar.ts`, exporting the productions as the strings the spec fences and the regular expressions that match them. Every engine extension of the grammar SHALL import that module: the form parse this capability computes, the generated-surface test's grammar assertions, and the explore skill template, which interpolates the module's strings so that the rendered skill's mirrors are BYTE-IDENTICAL to the pre-module render (the skill's hash pin does not move): the status header and the Decision entry in its body, and the Mechanism entry in its `references/mechanism-entries.md`, which carries the Mechanism grammar since `reduce-orbit-phase2`'s `cut-explore-onboard` (`orbit-explore-modifications`' `Nine moves applied per rule in the Mechanism section`). A parity test SHALL read the OWNING spec text's three fenced productions — resolving the owner the way the generated-surface mirror test already does: ONE active change's delta holding the block when one exists, the baseline otherwise — and assert the module's strings equal them, so the spec remains the single stated source (R-crc-14), the module is a checked extension of it rather than a second statement, and parity stays enforceable while a later change is mid-flight on a production. Matching rules the spec states in PROSE rather than in a fence (e.g. the `Closure:` token "matched from line start to the first ` — `") have no fenced text to compare and are covered instead by the parse's fixture tests over the two exemplar entries the explore skill's `references/mechanism-entries.md` carries.

#### Scenario: Module and spec agree

- **WHEN** the parity test reads the owning text's fenced status-header, Decision-entry and Mechanism-entry productions (an active delta's block first, `orbit/specs/orbit-conventions/spec.md` otherwise)
- **THEN** each equals the corresponding string the grammar module exports; a divergence fails the test naming the production

#### Scenario: Body interpolation changes no byte

- **WHEN** the explore skill template interpolates the module's production strings in place of its literal mirrors
- **THEN** the rendered `orbit-explore` skill is byte-identical to the literal render, and the skill-templates hash pin is unchanged

#### Scenario: Each production is interpolated where the skill carries it

- **WHEN** the explore skill is generated
- **THEN** its body carries the status-header and Decision-entry productions once each, and its
  `references/mechanism-entries.md` carries the Mechanism-entry production once, each equal to the module's string; the
  body does not carry the Mechanism-entry production

#### Scenario: The parse and the surface test share one regex

- **WHEN** the form parse and the generated-surface test each match a `Closure:` line
- **THEN** both use the module's exported expression; neither file restates the pattern
