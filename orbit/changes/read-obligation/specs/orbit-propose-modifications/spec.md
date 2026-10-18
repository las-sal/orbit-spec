## ADDED Requirements

### Requirement: Propose-shaped bodies read the baseline before writing proposal.md

The propose body and the ff body SHALL each carry, in upstream step 4a, the two lines fenced below, immediately after
the line `- Read any completed dependency files for context` and before the line ``- Create the artifact file using
`template` as the structure``. This is a named in-place edit of the upstream portion of each body, per
`orbit-conventions`' `Generated-file disposition`: it replaces the step's dependency-read line with that line followed
by these two, and no `# Orbit additions` text restates them. The bodies are the propose-shaped ones that
`orbit-run-summary-emit`'s `Propose-shaped and artifact-completion-aware recommendation logic` names, `/orbit:propose`
and `/orbit:ff`; `/orbit:continue`, which writes one artifact per invocation, does not carry them.

```
- Before writing the proposal artifact: list the capabilities the change will modify, grep `orbit/specs/` for the rule the change alters and list each spec that restates it too, then read each listed capability's whole baseline spec (`orbit/specs/<capability>/spec.md`)
- Before writing the specs artifact: copy each MODIFIED requirement whole from its baseline block, as the instruction's MODIFIED requirements workflow says; a scenario left out is dropped from the baseline at archive
```

The lines are an instruction and nothing checks that an agent follows them: no artifact section and no validation or
emit check records the read. Whether agents read is measured outside this repository, by `propose-reads-specs`'
`measure` stage.

#### Scenario: Both generated bodies carry the two lines in step 4a

- **WHEN** the propose and ff skills are generated
- **THEN** each body carries the fence's two lines, in order, on the lines immediately after `- Read any completed dependency files for context`, and before ``- Create the artifact file using `template` as the structure``

#### Scenario: A body missing a line fails

- **WHEN** a generated body lacks either line, or carries them anywhere other than immediately after the dependency-read line
- **THEN** the test fails, naming the body and the line

## MODIFIED Requirements

### Requirement: Upstream propose behavior preserved in standalone mode

The system SHALL preserve upstream `/orbit:propose`'s behavior when no `orbit/explore/<name>/` staging directory exists, except for the orbit steps that run in both modes, among them the baseline read of `Propose-shaped bodies read the baseline before writing proposal.md`, the `## Touchpoints` section of `design.md`, and the size brief of `Size brief after generation`.

#### Scenario: Standalone mode

- **WHEN** the user invokes `/orbit:propose <name>` and `orbit/explore/<name>/` does not exist
- **THEN** the command behaves as upstream, apart from the orbit steps that run in both modes: takes a description, generates `proposal.md` / `design.md` / `specs/<capability>/spec.md` / `tasks.md` into `orbit/changes/<name>/`
