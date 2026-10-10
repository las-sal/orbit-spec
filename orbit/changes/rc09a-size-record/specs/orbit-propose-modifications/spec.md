## ADDED Requirements

### Requirement: Size brief after generation

The propose body SHALL read the `size` object from `orbit status --change <name> --json` after every artifact is
generated and before the completion emit, in consume mode and standalone mode alike (the object is owned by
`orbit-change-size`'s `Status carries the size figures`), and act by this table:

| `size` | the body |
|---|---|
| `ceiling` is `null` (the check is OFF) | says nothing about size |
| `breaches` is empty | says nothing about size |
| every breach `declared` | states each declared breach in one line, at the completion summary |
| any breach not `declared` | BRIEFS the user before the completion emit: each undeclared dimension with its figure and maximum, and the two routes below |

The two routes for an undeclared breach, asked with `AskUserQuestion`, the user's answer deciding:

- **Split** — the change is split before review (R-crc-9). Propose does not split it: it says which dimensions are
  over and recommends returning to `/orbit:explore <name>` or the architecture doc. The artifacts stay in place.
- **Declare** — the body writes a `## Size` section into `proposal.md` (or adds to it), one item per undeclared
  dimension, carrying the user's reason in the user's words.

The body carries the declaration's production as a CHECKED MIRROR of `orbit-change-size`'s `A breach is declared in
the proposal's Size section`, because an adopter's installed skill has neither this repository's specs nor its parser;
a parity test holds the copy byte-equal to the owner's fence. Propose never writes a declaration the user did not
choose, and never chooses a split for the user. The brief REPORTS: it blocks nothing, and the change's artifacts are
complete whichever route is taken.

#### Scenario: A check that is off says nothing

- **WHEN** `orbit/config.yaml` carries no `size_ceiling` key and propose generates a change touching five capabilities
- **THEN** the propose body's output says nothing about size

#### Scenario: An undeclared breach is briefed before the emit

- **WHEN** the check is ON with `capabilities: 3` and the generated change touches four capabilities
- **THEN** before the completion emit the body names capabilities, 4 and 3, and asks the user to split or declare

#### Scenario: Declare writes the user's reason

- **WHEN** the user answers declare with a reason
- **THEN** `proposal.md` carries `## Size` with a `capabilities` item holding that reason, and `orbit validate <name> --strict` passes on size

#### Scenario: Split leaves the artifacts in place

- **WHEN** the user answers split
- **THEN** the body recommends `/orbit:explore <name>` or the architecture doc, writes no `## Size` section, and leaves every artifact in place

#### Scenario: The mirror matches its owner

- **WHEN** the generated propose skill is rendered
- **THEN** the parity test finds its `## Size` production byte-equal to the fence in `orbit-change-size`'s declaration requirement
