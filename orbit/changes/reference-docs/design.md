## Context

The `update-gh-documentation` program rewrites the user docs before the repository goes public (see
`orbit/architecture/update-gh-documentation.md`). `docs-under-test` put every user doc under machine checks, with an
exact pending-rewrite list of the files still owed. `landing-page` rewrote `README.md` and took it off that list. This
change is the `reference-docs` stage: six pages that teach commands and workflows. Its exploration settled seven
decisions (see explore.md, D-rd-1 … D-rd-7), and R-ugd-10 carves `orbit feedback` out of R-ugd-3.

Measured at the exploration (explore.md, Premise):

- The program has 23 visible top-level commands and 32 visible subcommands.
- `docs/cli.md` has a heading for 15 of the top-level commands. Eight appear on none of the six pages: `change`,
  `spec`, `emit`, `fingerprint`, `external`, `pr`, `architecture` and `new`.
- `docs/commands.md` documents 11 workflows. The four missing are `review`, `address-reviews`, `architect` and
  `audit-drift`.
- `docs/opsx.md` repeats three sections that other pages own.

## Goals / Non-Goals

**Goals:**

- The six pages teach orbit, in orbit's names (R-ugd-1), and leave the pending-rewrite list (exit 1).
- A test holds `docs/cli.md` to every visible command path and `docs/commands.md` to every workflow id (exit 2).
- No page teaches an upstream command or an upstream behaviour orbit made inert (exit 3).
- `orbit feedback` files on orbit's tracker (R-ugd-10).

**Non-Goals:**

- The five concept pages (`concepts`, `customization`, `supported-tools`, `multi-language`, `migration-guide`). They
  belong to `concept-docs`. The one exception is the migration guide's link to `opsx.md`, which this change repoints.
- Any CLI string other than `orbit feedback`'s (R-ugd-3), and the unused `feedback` workflow template
  (`src/core/templates/workflows/feedback.ts`, absent from `ALL_WORKFLOWS`).
- The root `flake.nix`, which still names upstream. It is a root file, and public-readiness owns its keep, move or
  delete decision.

## Decisions

### D1 — the coverage check is per page: commands on `cli.md`, workflows on `commands.md`

D-rd-1 said every command path and workflow id is "named by one of the six pages". This design narrows that to the
page a reader would look on. A command mentioned only in `getting-started.md` is not documented, and the CLI reference
is where a reader looks for it. Exit (2)'s wording, "named by at least one page", is met by the narrower rule.

*Alternative:* any of the six pages. Rejected because a passing mention anywhere would satisfy it.

### D2 — the check is file-local, modelled on the improvement-claims check

The check reads `docs/cli.md` and `docs/commands.md` and passes every other user doc. That makes it a member of the
file-local set, which the checked-surface requirement enumerates; that enumeration gains it (the MODIFIED block). The
pending list's exactness rule then runs it over a listed page alone. The helper is `commandCoverageFailures(surfaces,
paths, workflowIds)` in `test/helpers/user-docs.ts`. It is pure: the paths and ids are passed in, so the test can
show it failing on a fixture. `fileLocalFailures` feeds it the real domain:

- The command paths come from `fromProgram(buildProgram(...))`, which is recursive and drops `_hidden` at every level.
- The workflow ids come from `ALL_WORKFLOWS`.

The test types neither list.

### D3 — "names" is a bounded text match over the whole file

A path `orbit <words>` is named when that string appears, with a boundary on each side: before `orbit`, no letter,
digit, `_`, `/`, `.` or `-` (so `orbit/changes` and `.orbit-runs` never count); after the last word, no letter, digit,
`_` or `-`. A workflow id is named by `/orbit:<id>` with the same trailing boundary. Fences and inline code count.

A prefix is named by any longer path (`orbit pr select` names `orbit pr`), so a parent with subcommands needs no
separate mention. The `bulk-archive` id cannot satisfy `archive`, because `/orbit:bulk-archive` does not contain
`/orbit:archive`.

### D4 — page outlines

- **`installation.md`** (D-rd-2) covers:
  - Prerequisites: Node `>=20.19.0`, read from `package.json` `engines`.
  - R-ugd-4's install line, and why it installs a built release tree (R-ugd-8).
  - Verifying with `orbit --version`.
  - `orbit init`, including `--tools codex`.
  - Updating with `orbit update`.
  - Pointers to the README's from-source route.

  The pnpm, yarn, bun and Nix sections leave. None of those routes has been run against a release tree, and the
  flake still names upstream.
- **`getting-started.md`** walks one change end to end: explore, propose, review, apply, review, archive. It shows
  what each step writes on disk (`orbit/changes/<name>/`, `.orbit-runs/`), the readout's `Ready when you are:` line,
  and `orbit status`. It links back to the README's Quickstart and does not repeat it.
- **`cli.md`** is the reference for every visible command path, grouped as follows:
  - setup;
  - browsing;
  - validation;
  - lifecycle;
  - workflow support (`status`, `instructions`, `templates`, `schemas`, `new change`);
  - orbit's engine surfaces (`emit`, `fingerprint`, `external`, `pr`, `architecture`);
  - schemas;
  - config (with `config profile` per D-rd-5);
  - utility (`feedback`, `completion`).

  The page keeps upstream's split between human and agent commands, extended to the engine surfaces, which the
  workflow bodies call. The noun-first forms `change` and `spec` are documented as their help text describes them
  (`orbit change list` prints "DEPRECATED: use "orbit list" instead").
- **`commands.md`** is the reference for all 15 `/orbit:` workflows, with the four orbit adds: `review` (its three
  modes and its reviewer selectors), `address-reviews`, `architect` and `audit-drift`. The profile framing leaves:
  every install carries all 15 (D15).
- **`workflows.md`** covers the workflow patterns. It owns "When to Update vs Start Fresh" (D-rd-2), adds the review
  cadence around apply (proposal review, apply, system review, archive) and the walk, and drops the profile framing.
- **`workflow-engine.md`** (renamed from `opsx.md`, D-rd-7) covers:
  - actions, not phases;
  - the artifact dependency graph;
  - how `orbit status` and `orbit instructions` drive the workflows;
  - iteration;
  - custom schemas;
  - the gates as nodes in the graph.

  Config points to `customization.md`, the command list to `commands.md`, and update versus fresh to `workflows.md`.

### D5 — `orbit feedback`: retarget both sites, drop the label

`src/commands/feedback.ts` changes in three places:

- the URL constant becomes `las-sal/orbit-spec`;
- the `gh issue create --repo` argv names the same repository;
- the help line "Submit feedback about OpenSpec" becomes "Submit feedback about orbit".

The `feedback` label is dropped from both the URL and the argv. The fork has no such label (`gh label list`,
2026-10-12), and `gh issue create --label` with a missing label fails. Creating the label would be an outward act on
the repository, and the command works without one. `test/commands/feedback.test.ts` moves with the code. Any other
`OpenSpec` string the file prints stays, per R-ugd-3.

### D6 — the pages write only heads the surface already knows

The rewritten pages invoke only `orbit`, `git`, `gh`, `npm` and `cd`. The last two are already declared in the
`docs-inventory` fence; the first three are recorded. A page that needs another head, such as `node --version` for the
prerequisite, declares it in the same change by MODIFYING `orbit-user-docs`' `The user docs declare their own command
heads`, a second delta block. The prerequisite is stated in prose to avoid that.

### D7 — exit (3) is graded by the residue check plus review (D-rd-4)

The residue check fails any `openspec`, `opsx` or `fission` on the six pages; none of R-ugd-1's admitted places is
among them. Behaviour taught under orbit's name — profiles, a `core` install, a command orbit lacks — is checked by
the proposal and system reviews, and the archive emit's readiness record states what they read. The coverage check
and the `orbit` grammar sweep catch a documented command that does not exist.

## Alternatives considered

- **Documenting `orbit feedback` without naming upstream, or removing it** (explore.md, Considered & out). Out on
  Sal's B (D-rd-6).
- **Folding `opsx.md` into other pages.** R-ugd-2 forbids removing a page. Out on Sal's `workflow-engine.md`.
- **Naming anywhere on the six pages** for exit (2). Out by D1.
- **Keeping the pnpm, yarn, bun and Nix install sections.** Out by D4: no route but R-ugd-4's has been run against a
  release tree.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rd-1 | SOURCED | live rule | `orbit-user-docs` › `The reference pages name every command and every workflow` (a normative TABLE; the closure sentence names `buildProgram` and `ALL_WORKFLOWS`) |

D-rd-2 … D-rd-7 are `Kind: scope` and carry no Mechanism entry. They are not carried as requirements.

## Touchpoints

- `docs/installation.md` — rewritten.
- `docs/getting-started.md` — rewritten.
- `docs/cli.md` — rewritten; every visible command path.
- `docs/commands.md` — rewritten; all 15 workflows.
- `docs/workflows.md` — rewritten.
- `docs/opsx.md` + `docs/workflow-engine.md` — the rename.
- `docs/migration-guide.md` — one link repointed.
- `README.md` — the docs list gains `workflow-engine.md`.
- `test/core/user-docs/pending-rewrite.json` — six entries out.
- `test/helpers/user-docs.ts` — `commandCoverageFailures`, wired into `fileLocalFailures`.
- `test/core/user-docs/coverage.test.ts` — the check's tests and scenario tags.
- `src/commands/feedback.ts` + `test/commands/feedback.test.ts` — the retarget.

## Risks / Trade-offs

- **The check names, it does not teach** (D3). A table row naming `orbit emit` with no description passes. The
  reviews judge whether each command is taught.
- **Prose accuracy is read, not checked.** The pages describe behaviour the engine owns: gates, the pair, walks,
  `pr`. Each description is read against its capability at authoring time. A page that restates a rule a spec owns
  goes stale with it, so the pages point to the specs for detail rather than restating the rules (R-crc-14).
- **`orbit-conventions`' scenario on upstream skills** says `feedback` "sends user feedback to Fission-AI". It is
  about the `feedback` *skill* template, which is never installed, not the CLI command, so it stays true after D5.
- **Size.** About 100 KB of prose in one change. Doc bytes are not a size dimension; the task count is measured by
  the size brief after generation (D-rd-3).
- **The `git` contract residual** from docs-under-test (six keys and six flags the surface no longer writes) is
  unchanged. If a page writes one of those, the sweep still accepts it, because the contract still records it.
