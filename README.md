# orbit

orbit is a spec-driven workflow for AI coding assistants. You and the AI agree on a change in writing first:
why it is needed, what changes, the requirements it adds or modifies, and the tasks. Then the AI implements it,
reviewers check it, and its specs are merged into your project's living baseline. orbit is built for Claude Code
first, with Codex as its second supported assistant. It is for people who want an AI to do the development while
they stay informed and keep the decisions.

## Built on OpenSpec

orbit is a hard fork of
[`@fission-ai/openspec@1.3.1`](https://github.com/Fission-AI/OpenSpec). The vendored upstream source is this
repository's root commit, tagged `upstream/v1.3.1`; the engine is forked from OpenSpec 1.3.1 and frozen there, and
moves only by a deliberate, recorded cherry-pick. orbit's version numbers are its own: orbit 2.0.0 is orbit's first
release, not OpenSpec 2.0.0. Upstream's telemetry has been removed: orbit collects nothing.

OpenSpec supplies the engine: the change folder, the artifact graph, delta specs and their archive merge, and the
skill generator. orbit adds the editorial layer on top of it, in the same CLI.

## How orbit improves on OpenSpec

Each claim names the capabilities whose specs, under [`orbit/specs/`](orbit/specs/), carry it.

- **Reviewed gates with a computed cadence.** A change cannot reach apply or archive silently: each gate's state
  is computed from the review trail on disk, never asserted (`orbit-engine-gates`, `orbit-review`).
- **The blind pair and the external runner.** One command runs a fresh review and an external review from another
  model, blind to each other; a recorded runner launches the external half with no copy and paste
  (`orbit-review-external`, `orbit-external-runner`).
- **Walks with pushback.** Review findings are walked one at a time: each is checked against the current state
  before anything is fixed, and stale findings are suppressed with evidence (`orbit-address-reviews`).
- **Orientation.** `orbit status` answers where you are, what happened last and what is ready next, with no
  artifact reads (`orbit-orientation`).
- **Engine-composed records.** Every run writes a summary the engine composes and validates, and every review
  renders through one engine-owned report (`orbit-emit-composition`, `orbit-run-summary-emit`,
  `orbit-report-rendering`).
- **The architect tier.** A program of changes is declared as stages in an architecture document, and each stage's
  state is computed from disk (`orbit-architect`, `orbit-architecture-engine`).
- **Safe parallel archive.** Each change fingerprints the baseline requirements it touches, so archiving one change
  never silently overwrites another's edits (`orbit-base-fingerprints`).
- **You invoke every lifecycle step.** The AI recommends the next step and never runs it unasked; an AI-initiated
  apply or archive asks first (`orbit-lifecycle-consent`).
- **A PR lifecycle and a drift audit.** A change can open a draft pull request at proposal and mark it ready at
  archive, and a project-wide audit finds drift between what the project's documents record and what is actually
  in the repository (`orbit-pr-lifecycle`, `orbit-audit-drift`).

## Install

You need Node.js 20.19.0 or higher, and Git: npm fetches orbit from GitHub with it and builds it on your machine.

```bash
npm install -g github:las-sal/orbit-spec#v2.0.0
orbit --version
```

`orbit --version` prints `2.0.0`.

## Quickstart

In your project, set orbit up for Claude Code:

```bash
cd your-project
orbit init --tools claude
```

This creates an `orbit/` directory for your specs and changes, and installs the `/orbit:*` commands and their
skills. Then, in Claude Code:

1. `/orbit:explore` to think a change through with the AI.
2. `/orbit:propose <change>` to write the proposal, design, delta specs and tasks.
3. `/orbit:review --as proposal <change>` to review the proposal before any code is written.
4. `/orbit:apply <change>` to implement the tasks.
5. `/orbit:review --as system <change>` to review the implementation.
6. `/orbit:archive <change>` to merge the change's specs into your baseline.

At any point, ask orbit where you are:

```bash
orbit status
```

For Codex, run `orbit init --tools codex` instead; it installs orbit's skills and prompts for Codex, and
[Supported tools](docs/supported-tools.md) describes how Codex invokes them. The generator also carries adapters
for other assistants, inherited and untested.

## Docs

These pages are being rewritten for orbit; until then, some still describe the tool orbit was forked from.

- [Getting started](docs/getting-started.md)
- [Installation](docs/installation.md)
- [Workflows](docs/workflows.md)
- [Commands](docs/commands.md)
- [CLI](docs/cli.md)
- [Concepts](docs/concepts.md)
- [Customization](docs/customization.md)
- [Multi-language](docs/multi-language.md)
- [Supported tools](docs/supported-tools.md)
- [Migration guide](docs/migration-guide.md)

## Development

Clone the repository, then:

```bash
npm install
npm run build
npm test
```

## Contributing

Issues are welcome on [las-sal/orbit-spec](https://github.com/las-sal/orbit-spec/issues). Larger changes start as
an orbit change proposal.

## License

MIT. See [LICENSE](LICENSE).
