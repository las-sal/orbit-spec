> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: reference-docs

## Premise

The stage `update-gh-documentation › reference-docs` rewrites six pages for orbit: `docs/installation.md`,
`docs/getting-started.md`, `docs/cli.md`, `docs/commands.md`, `docs/workflows.md` and `docs/opsx.md`. The last one is
renamed and its links repointed. The charter asks that every `orbit` CLI command and `/orbit:` workflow be documented
(goal G3). Its exits: (1) the six pages pass docs-under-test's checks with no recorded exception; (2) every command the
completion registry holds is named by at least one page, checked by a test; (3) no page teaches an upstream command.

Measured 2026-10-12 (this session):

- **Size.** The six pages are 3,124 lines and about 100 KB (`installation` 1.2 KB, `getting-started` 7.2 KB, `cli`
  25.3 KB, `commands` 20.1 KB, `workflows` 13.5 KB, `opsx` 33.5 KB). Five of them never mention `orbit`, and `cli.md`
  mentions it four times. All six are on `test/core/user-docs/pending-rewrite.json`.
- **The program has 23 visible top-level commands**, plus `experimental` and `__complete`, which are hidden.
  `cli.md` has a heading for 15 of them. Seven orbit-added commands appear on none of the six pages: `change`,
  `spec`, `emit`, `fingerprint`, `external`, `pr`, `architecture` and `new`. (`change` and `spec` are upstream's
  older noun-first forms, also missing.)
- **`commands.md` documents 11 `/opsx:` workflows.** orbit installs 15 (D15, full surface). The four with no page are
  `review`, `address-reviews`, `architect` and `audit-drift`. The page's "core profile vs expanded" framing describes
  profile gating, which D15 made inert.
- **`orbit feedback` files on upstream's tracker.** `src/commands/feedback.ts` hardcodes `Fission-AI/OpenSpec`, and
  its help says "Submit feedback about OpenSpec". It is in the program and therefore in the completion registry, so
  exit (2) requires a page to name it, while exit (3) forbids teaching an upstream command. R-ugd-3 keeps code changes
  out of the program.
- **`orbit config profile` is live in the program**, but D15 makes the profile it sets inert for which workflows get
  installed (only `delivery` is honoured).
- **The README links into five of the six** (`getting-started`, `installation`, `workflows`, `commands`, `cli`). It
  does not link `opsx.md`.
- **Overlap.** `installation.md` overlaps the README's Install section, and `getting-started.md` overlaps its
  Quickstart. `commands.md`, `workflows.md` and `opsx.md` all teach the same 11 workflows from three angles:
  reference, patterns, and philosophy plus architecture.

## Mechanism

### D-rd-1 — every visible command path and every workflow id is named by one of the six pages
Domain: what exit (2) and the charter's "every `/orbit:` workflow" sentence range over
| member | covered by |
|---|---|
| the 23 visible top-level commands | the coverage test, reading the visible command tree the way `test/helpers/registry-parity.ts`'s `fromProgram` does |
| the 32 visible subcommands (`change` 3, `spec` 3, `config` 8, `schema` 4, `external` 2, `pr` 5, `architecture` 3, `completion` 3, `new` 1) | the same test, as a two-word path `orbit <command> <subcommand>` |
| the 15 workflow ids in `ALL_WORKFLOWS` (`src/core/profiles.ts`) | the same test, as `/orbit:<id>` |
| the hidden commands `experimental` and `__complete` | excluded, because `fromProgram` filters `_hidden` and the registry carries neither |
| flags | not members; rc05's `orbit` grammar sweep already parses every documented flag |
Closure: SOURCED — the command tree is the program `buildProgram` returns, which rc05 holds equal to the completion registry, and the workflow set is `ALL_WORKFLOWS`, which D15 makes the installed surface
Moves:
- READ: applied — counts are from `buildProgram` (23 + 32, hidden excluded) and `ALL_WORKFLOWS` (15), and `.claude/commands/orbit/` holds the same 15 launchers
- ENUMERATE: applied — this table; the domain is read from the two authorities, never typed as a list in the test
- COHERE: applied — exit (2) names the registry and this rule reads the program, which are one set because rc05's parity test holds them equal both ways
- EXECUTE: not applied — the coverage test does not exist yet; propose writes it and shows it can fail
- FALSIFY: applied — a page can name a command without teaching it (a bare mention in a table); exit (2) asks only for naming, and teaching quality is the review's call (D-rd-4)
- CONFORM: applied — R-crc-11 (mechanize what the engine observes: the command tree and the workflow list are both engine data); R-crc-14 (the domain is derived, never restated)
- FEASIBILITY: not applied — 70 lookups over six files
- CONSUME: not applied — nothing consumes the test's result but the suite
- INVOKE: applied — runs in `npm test`, so a command added to the program without a page fails the suite the day it lands

## Decisions

- **2026-10-12 — D-rd-1: exit (2) counts command paths and workflow ids, derived from the program** A command
  counts at both levels the registry holds: the 23 visible top-level commands and the 32 visible subcommands, 55
  paths in all. The same test also checks the 15 workflow ids, because the charter promises every `/orbit:` workflow
  and exit (2) alone would not check it. Hidden commands are excluded, and flags are left to the snippet sweeps.
  Settled as method (R-crc-3); resolves Q-rd-1.
  Kind: rule
- **2026-10-12 — D-rd-2: the install and quickstart pages extend the README, never restate it** The README owns the
  short path (install line, quickstart loop). `installation.md` goes deeper (prerequisites, the release-tree install
  and why it exists, Codex, verifying the install), and `getting-started.md` walks one change end to end with what
  each step writes. Both link back to the README for the short path. One section that two pages duplicate today,
  "When to Update vs Start Fresh" (`workflows.md` and `opsx.md`), goes to one page, and the other points to it.
  Settled as method (R-crc-3, R-crc-14); resolves Q-rd-4.
  Kind: scope
- **2026-10-12 — D-rd-3: one change, sized at propose by the engine** The stage proposes as one change, and propose
  runs `orbit validate` with the size record. If it breaches R-crc-1's ceiling, the split is CLI reference (`cli.md`,
  `installation.md`) versus workflow pages (`commands.md`, `workflows.md`, the renamed `opsx.md`,
  `getting-started.md`). Doc bytes are not a size dimension, so the likely pressure is the task count. Settled as
  method (R-crc-3); resolves Q-rd-5.
  Kind: scope
- **2026-10-12 — D-rd-4: exit (3) is graded by the residue check plus a reviewed record** The residue check catches
  upstream NAMES. Upstream BEHAVIOUR taught under orbit's name, such as the `core`-versus-expanded install or a
  profile that selects workflows, is a reader's judgement. It is graded in the stage's reviews and recorded on the
  archive emit's readiness record, never claimed as a check (R-crc-10). Exit (2)'s coverage test plus the `orbit`
  grammar sweep catch any documented command that does not exist. Settled as method; resolves Q-rd-6.
  Kind: scope

- **2026-10-12 — D-rd-5: `orbit config profile` is documented as it behaves, read from its code** D15 made profile
  gating inert: every install carries all 15 workflows, and only `delivery` is honoured. The page states what the
  command does today, read from `src/core/profiles.ts` and the config command at authoring time. It never presents a
  `core` versus expanded workflow selection. Settled as method (read-before-reference); splits the profile half off
  Q-rd-2.
  Kind: scope

- **2026-10-12 — D-rd-6: `orbit feedback` is retargeted to orbit's repository in this stage** (Sal: B; resolves
  Q-rd-2.) `src/commands/feedback.ts` names `Fission-AI/OpenSpec` twice: in the pre-filled issue URL and in the
  `gh issue create --repo` argv. Both become `las-sal/orbit-spec`, and the help line "Submit feedback about OpenSpec"
  says orbit. `test/commands/feedback.test.ts` moves with them. The page then documents the command as orbit's. This
  is a carve-out from R-ugd-3, which Sal records as an architect ruling before propose. Measured the same day: the fork
  has no `feedback` label (`gh label list`), and the command passes `--label feedback`, so the change must either drop
  the label or have Sal create it. That is settled at propose. The `feedback` workflow template
  (`src/core/templates/workflows/feedback.ts`) is not in `ALL_WORKFLOWS`, is never installed, and is out of scope.
  Kind: scope
- **2026-10-12 — D-rd-7: `docs/opsx.md` becomes `docs/workflow-engine.md`** (Sal; resolves Q-rd-3.) The page keeps
  the engine view: the artifact dependency graph, how `orbit status` and `orbit instructions` drive the workflows,
  iteration, custom schemas, and where the gates sit in the graph. Its three duplicated sections become links: project
  config to `customization.md`, the command list to `commands.md`, and update versus fresh to `workflows.md` (D-rd-2).
  The README's docs list gains the link. `docs/migration-guide.md:595` is repointed in this stage, ahead of
  concept-docs' rewrite of that page. The pending-rewrite list's entry for `docs/opsx.md` leaves with the rename.
  Kind: scope

## Open questions

## Considered & out

- **2026-10-12 — documenting `orbit feedback` without naming upstream (Q-rd-2's A), or removing it (C).** A would
  document a command orbit's own docs steer people away from, and C would remove a working path for reporting bugs.
  Out on Sal's B (D-rd-6).
- **2026-10-12 — folding `opsx.md` into other pages.** R-ugd-2 forbids removing a page. Out on Sal's
  `workflow-engine.md` (D-rd-7).

## References

- `orbit/architecture/update-gh-documentation.md` — the program: R-ugd-1 (nomenclature), R-ugd-2 (all eleven
  rewritten), R-ugd-3 (code scrub out), R-ugd-5 (interim states unprotected); docs-under-test's and landing-page's
  `Shipped as` paragraphs.
- `test/core/user-docs/` — the pending-rewrite list and its exactness test, the residue, claims and floors tests.
- `src/core/completions/command-registry.ts` — the completion registry exit (2) names; held equal to
  `src/cli/program.ts`'s `buildProgram` by rc05.
- `src/commands/feedback.ts` — the hardcoded upstream repository.
- `README.md` — the landing page's Install, Quickstart and docs links (landing-page, archived 2026-10-12).
