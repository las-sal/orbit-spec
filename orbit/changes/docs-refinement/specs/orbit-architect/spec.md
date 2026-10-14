## MODIFIED Requirements

### Requirement: Start surfaces name the architect workflow first

Every orbit surface that suggests where NEW work starts SHALL name `/orbit:architect <name>` first
(R-rda-1, R-rda-2). The surfaces are two kinds:

| surface | kind | what it names |
|---|---|---|
| the archive emit's `next_recommended` (`orbit-emit-composition`) | strict | `/orbit:architect <doc>` or `/orbit:architect <name>`; no `/orbit:explore`, `/orbit:new` or `/orbit:propose` |
| idle `orbit status`'s next line (`orbit-orientation`) | strict for its fallback | `/orbit:architect <name>` when no recorded command exists; a recorded `/orbit:` command is continuing work, not a start, and renders as recorded |
| the no-active-changes message and the two no-changes errors raised by `orbit status --change` and `orbit instructions` (`orbit-orientation`) | strict | `No active changes.`, naming no command; the errors name `/orbit:architect <name>` only |
| `orbit init`'s `Getting started:` line | strict | `/orbit:architect <name>` only |
| `orbit update`'s `Getting started:` list | strict for its first line | `/orbit:architect`, then `/orbit:explore` and `/orbit:propose` — the canonical flow's order; later lines list commands, not where to start |
| the welcome screen's quick-start list | strict for its first line | as `orbit update`'s list |
| this workflow's body (its stance paragraph) | prose | the architect-first canonical flow, and that an architect session is never required |
| the onboard body (`orbit-onboard`) | prose | architect first; explore described as the one-off path, after architect |
| the user docs' start sections (`orbit-user-docs`) | prose, checked | as the onboard body; `orbit-user-docs`' `The user docs' start sections name the architect workflow first` lists the sections and checks that each names `/orbit:architect` before any other start |

A strict surface is checked by a test that fails when it names another start. A prose surface may
describe explore, after architect and never as the default; a checked prose surface's test reads that order. Named limit: the table is the
set a sweep of the command names found. Residual kind: a surface that steers new work to explore or new without naming either command (e.g. "start by thinking it through").
Residual method: whenever a change adds or edits a user-visible start string, grep the generated bodies and the CLI's user-visible strings for "start", "begin", "first change", "new work", "entry" and "create", and classify each hit against this table; it first ran at architect-first's apply. Known residual instance: the
bulk-archive body's no-changes output (`No active changes found. Create a new change to get started.`)
lies in the upstream portion of an orbit-modified body, which changes only through a named edit
(`orbit-conventions`' `Generated-file disposition`); it is recorded here, not edited.

#### Scenario: A strict surface names only architect

- **WHEN** the start-surfaces test reads `orbit init`'s getting-started output, the first line of `orbit update`'s and the welcome screen's lists, the archive emit's `next_recommended` for a cited and an uncited change, idle `orbit status` with no emit, and the no-active-changes message and the two no-changes errors
- **THEN** each names `/orbit:architect`, except the no-active-changes message, which names no command; and none names `/orbit:explore`, `/orbit:new` or `/orbit:propose` as where to start

#### Scenario: A prose surface keeps the one-off path

- **WHEN** the onboard body is read
- **THEN** it names `/orbit:architect` before any other start and describes explore as the path for a one-off fix, never as the default
