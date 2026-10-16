# orbit

orbit is a spec-driven workflow for AI coding assistants. You and the AI agree on a change in writing first:
why it is needed, what changes, the requirements it adds or modifies, and the tasks. Then the AI implements it,
reviewers check it, and its specs are merged into your project's living baseline. orbit is built for Claude Code
first, with Codex as its second supported assistant. It is for people who want an AI to do the development while
they stay informed and keep the decisions.

For a walkthrough of the loop and two case studies of orbit in use, see the
[overview deck](docs/OrbitOverview_CaseStudies.pdf) (PDF).

## Built on OpenSpec

orbit is a hard fork of
[`@fission-ai/openspec@1.3.1`](https://github.com/Fission-AI/OpenSpec). The vendored upstream source is this
repository's root commit, tagged `upstream/v1.3.1`; the engine is forked from OpenSpec 1.3.1 and frozen there, and
moves only by a deliberate, recorded cherry-pick. orbit's version numbers are its own: orbit 2.0.0 is orbit's first
release, not OpenSpec 2.0.0. Upstream's telemetry has been removed: orbit collects nothing.

OpenSpec supplies the engine: the change folder, the artifact graph, delta specs and their archive merge, and the
skill generator. orbit adds the editorial layer on top of it, in the same CLI.

## How orbit improves on OpenSpec

Orbit adds some much needed features in OpenSpec. It adds an "architect" capability that allows you to work through
big changes with the AI. The AI documents these and breaks them down into stages - each corresponding to an OpenSpec
Explore->Propose. The engine works to limit the size of each stage as one of the issues we've seen with OpenSpec is 
very large proposals tend to start falling down. It also adds a review cycle and gives the ability to have both a 
proposal and apply validated by a fresh context AI review, an external AI review, or a blind-pair - both in parallel 
restricted from seeing each others results. A mechanism to walk the results and address them is also provided. Other 
features include a status command that orients you in the flow as well as boots a clean context and detailed records
of the development flow. More details listed below.

Each claim names the capabilities whose specs, under [`orbit/specs/`](orbit/specs/), carry it.

- **The architect tier.** A program of changes is declared as stages in an architecture document, and each stage's
  state is computed from disk (`orbit-architect`, `orbit-architecture-engine`).
- **Reviewed gates with a computed cadence.** A change cannot reach apply or archive silently: each gate's state
  is computed from the review trail on disk, never asserted (`orbit-engine-gates`, `orbit-review`).
- **The blind pair and the external runner.** One command runs a fresh review and an external review from another
  model, blind to each other; a recorded runner launches the external half with no copy and paste
  (`orbit-review-external`, `orbit-external-runner`).
- **Walks with pushback.** Review findings are walked one at a time: each is checked against the current state
  before anything is fixed, and stale findings are suppressed with evidence (`orbit-address-reviews`).
- **Orientation.** `orbit status` answers where you are, what happened last and what is ready next, with no
  artifact reads (`orbit-orientation`).
- **Engine-composed records.** Each lifecycle and review workflow records its run in a summary the engine
  composes and validates, and every review renders through one engine-owned report (`orbit-emit-composition`, `orbit-run-summary-emit`,
  `orbit-report-rendering`).
- **Safe parallel archive.** Each change fingerprints the baseline requirements it touches, so archiving one change
  never silently overwrites another's edits (`orbit-base-fingerprints`).
- **You invoke every lifecycle step.** The AI recommends the next step and never runs it unasked; an AI-initiated
  apply or archive asks first (`orbit-lifecycle-consent`).
- **A PR lifecycle and a drift audit.** A change can open a draft pull request at proposal and mark it ready at
  archive, and a project-wide audit finds drift between what the project's documents record and what is actually
  in the repository (`orbit-pr-lifecycle`, `orbit-audit-drift`).

## Install

You need Node.js 20.19.0 or higher, and Git: npm fetches orbit from GitHub with it. The tag is a release built
ahead of time, so nothing is compiled on your machine.

```bash
npm install -g github:las-sal/orbit-spec#v2.0.1
orbit --version
```

`orbit --version` prints `2.0.1`.

## Quickstart

In your project, set orbit up for Claude Code:

```bash
cd your-project
orbit init --tools claude
```

### What you should see after install

`orbit init --tools claude` creates:

- `orbit/specs/`, for your project's living specs, and `orbit/changes/` (with `orbit/changes/archive/`), for
  changes in flight and archived;
- 15 commands under `.claude/commands/orbit/` and 15 skills under `.claude/skills/`, one of each per workflow:

| Command | Command file | Skill directory |
|---|---|---|
| `/orbit:architect` | `.claude/commands/orbit/architect.md` | `.claude/skills/orbit-architect/` |
| `/orbit:explore` | `.claude/commands/orbit/explore.md` | `.claude/skills/orbit-explore/` |
| `/orbit:new` | `.claude/commands/orbit/new.md` | `.claude/skills/orbit-new-change/` |
| `/orbit:continue` | `.claude/commands/orbit/continue.md` | `.claude/skills/orbit-continue-change/` |
| `/orbit:ff` | `.claude/commands/orbit/ff.md` | `.claude/skills/orbit-ff-change/` |
| `/orbit:propose` | `.claude/commands/orbit/propose.md` | `.claude/skills/orbit-propose/` |
| `/orbit:review` | `.claude/commands/orbit/review.md` | `.claude/skills/orbit-review/` |
| `/orbit:address-reviews` | `.claude/commands/orbit/address-reviews.md` | `.claude/skills/orbit-address-reviews/` |
| `/orbit:apply` | `.claude/commands/orbit/apply.md` | `.claude/skills/orbit-apply-change/` |
| `/orbit:verify` | `.claude/commands/orbit/verify.md` | `.claude/skills/orbit-verify-change/` |
| `/orbit:sync` | `.claude/commands/orbit/sync.md` | `.claude/skills/orbit-sync-specs/` |
| `/orbit:archive` | `.claude/commands/orbit/archive.md` | `.claude/skills/orbit-archive-change/` |
| `/orbit:bulk-archive` | `.claude/commands/orbit/bulk-archive.md` | `.claude/skills/orbit-bulk-archive-change/` |
| `/orbit:audit-drift` | `.claude/commands/orbit/audit-drift.md` | `.claude/skills/orbit-audit-drift/` |
| `/orbit:onboard` | `.claude/commands/orbit/onboard.md` | `.claude/skills/orbit-onboard/` |

Each skill directory holds a `SKILL.md`. The skills of eight commands (`address-reviews`, `architect`, `archive`,
`audit-drift`, `explore`, `ff`, `propose` and `review`) also hold a `references/` directory the skill reads.

### Your first change

In Claude Code:

1. `/orbit:architect <program>` to declare the work: a program whose stages each become a change.
2. `/orbit:explore <change>` to think the stage's change through with the AI.
3. `/orbit:propose <change>` to write the proposal, design, delta specs and tasks.
4. `/orbit:review --as proposal --fresh <change>` to review the proposal in a clean context before any code is
   written.
5. `/orbit:apply <change>` to implement the tasks.
6. `/orbit:review --as system --fresh <change>` to review the implementation the same way.
7. `/orbit:archive <change>` to merge the change's specs into your baseline.
8. `/orbit:architect <program>` to review the stage and ratify it.

An architect session is never required: for a one-off fix, `/orbit:explore <change>` alone is the path, and step 8
does not apply.

A review starts its gate; it does not pass it on its own. Each of these commands ends with a `Ready when you are:`
line, computed from your change's state: after a review it names, in turn, the walk of its findings
(`/orbit:address-reviews <change>`) and a confirming review, and it names the next step of the list above only
once the gate has passed. With a second AI set up, `--blind-pair` in place of `--fresh` runs a fresh review and an
external one, blind to each other.

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
- [Workflow engine](docs/workflow-engine.md)
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

To run your clone as `orbit`, install it globally from the clone:

```bash
npm install -g .
```

The global `orbit` is then a link into the clone, so keep the clone in place and rebuild after changing the source.
A release is cut with `npm run release:tree`, which tags the build of the current commit on a release commit of its
own; the release commit is never merged back.

## Contributing

Issues are welcome on [las-sal/orbit-spec](https://github.com/las-sal/orbit-spec/issues). Larger changes start as
an orbit change proposal.

## License

MIT. See [LICENSE](LICENSE).
