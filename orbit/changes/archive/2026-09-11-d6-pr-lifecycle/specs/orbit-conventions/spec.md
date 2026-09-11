# orbit-conventions Delta

## ADDED Requirements

### Requirement: Residual outward-actions rule

Outward-facing repository actions not designed into a lifecycle step SHALL remain the
human's — merging any PR, publishing releases, filing issues on external trackers, and any
comparable off-script outward act are invoked outside orbit workflows; orbit commands
recommend, never perform them. Lifecycle-completion outputs that hand control back at an
outward seam (the archive tail's readout, the arc-done readout) SHALL echo this rule in one
line where an outward act is the natural next step (e.g. "merging is yours: `gh pr merge`
when satisfied"). Projects SHOULD carry a one-line CLAUDE.md note stating the rule for
non-orbit sessions working the same repo. This requirement is the residue of the D1-era
outward-actions concern after `orbit-pr-lifecycle` designed the PR path: what remains
off-script stays off-script.

#### Scenario: Completion output echoes at the merge seam

- **WHEN** the archive tail completes with a READY PR
- **THEN** the completion readout names the merge as the human's act in one line, and no
  orbit surface offers to perform it

#### Scenario: Off-script actions stay out

- **WHEN** any orbit workflow completes
- **THEN** no release, external issue-filing, or merge has been performed by the workflow
  regardless of configuration
