## ADDED Requirements

### Requirement: A blind-pair member's inputs exclude its partner's findings

The system SHALL ensure that neither member of a `blind-pair` slot receives its partner's findings through any input it is instructed to read. The property delivered is R-crc-4's — the two members are blind TO EACH OTHER — not blindness to all prior history: findings from earlier, already-walked iterations are legitimate shared context and both members may see them.

The mechanism is ORDERING, owned by `orbit-engine-gates`: the canonical command for an empty pair names the external half, so the external prompt is composed while the trail holds no pair member and has nothing of its partner to carry. This requirement covers the ONE residual that ordering does not empty, plus the one channel that has no artifact behind it.

**The diff residual.** System-mode reviews are instructed to read the change's commit range. `.orbit-runs/` files are committed, not gitignored, and the external-handoff preflight withholds the pull invocation until the tree is clean and pushed — so by the time the fresh half runs, its partner's findings file is inside that range by construction. The system-mode read instruction SHALL therefore exclude the change's own `.orbit-runs/` directory from the commit range a blind-pair member is told to read.

**The brief.** A `fresh` pass runs in a clean execution context, and what reaches that context is the launching brief, not a file — so no file-level rule can constrain it. When the launching context dispatches a blind-pair member, the brief SHALL carry the change name, the mode, and the pass set only, and SHALL name no prior finding, count, severity, or trend. This is the one channel that ordering does not empty: under external-first the orchestrator holds the external half's findings at the moment it dispatches the fresh half, and it is the orchestrator's own context that must be withheld.

#### Scenario: System-mode blind-pair member reads a diff excluding the trail

- **WHEN** a system-mode review pass runs as a member of a `blind-pair` slot
- **THEN** the commit range it is instructed to read excludes `orbit/changes/<name>/.orbit-runs/`, so the partner's committed findings file is not among its inputs

#### Scenario: A dispatched blind-pair member's brief names no prior finding

- **WHEN** the launching context dispatches a `fresh` pass as a blind-pair member while holding the other half's findings
- **THEN** the brief carries the change name, mode and pass set only — no finding title, count, severity or trend — and the pass's emit records `reviewer_class: "fresh"` exactly as an unconstrained dispatch would

#### Scenario: A non-member pass is unaffected

- **WHEN** a review pass runs that is not a member of a `blind-pair` slot — a confirming pass, a sequential external iteration, any proposal-mode pass, or any architecture-mode pass
- **THEN** its inputs are unchanged: the full commit range, the prior-run read, and today's briefing all apply, because the blindness property is scoped to pair members and architecture mode has no cadence at all
