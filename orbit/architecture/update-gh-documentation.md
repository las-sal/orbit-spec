# Program: update-gh-documentation

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

This repository goes PUBLIC when this program ends, and its GitHub landing page still describes upstream
OpenSpec. Measured 2026-10-12: `README.md` and the eleven pages under `docs/` total about 168 KB, and eleven of the
twelve never mention `orbit`. They name the old surface throughout (`openspec` 374 times, `/opsx` 280, `OpenSpec`
90), the install instructions point at `@fission-ai/openspec`, and the README carries upstream's logo, badges and
Discord. An adopter following them installs the wrong package and runs commands that do not exist. Nor do the docs
describe anything orbit added: the review cadence and gates, blind pairs and walks, `orbit status` orientation,
emits and trails, the architect tier, `orbit pr`.

The docs are also the one surface no test reads: rc05 and rc05b's sweeps check the generated skills only, so a
rewritten page could drift again the next day. Issue #1 ("Docs: comprehensive rewrite of README + docs/ for
orbit-spec") is this program's origin.

What the program must produce: a landing page that says what orbit is, how it improves on OpenSpec, and how to use
it; all eleven `docs/` pages rewritten in orbit's names; those pages under machine checks; and a repository fit to
be seen. Flipping visibility to public is Sal's act at arc-done, never an orbit step.

## Goals

- **G1 — the landing page is correct.** A newcomer following the README installs orbit and runs its core loop.
  Falsified by any README instruction or link that installs or invokes upstream (`@fission-ai/openspec`, the
  `openspec` command, `/opsx:`, upstream's Discord, CI or npm badges).
- **G2 — "why orbit" is true.** Every improvement the README claims over OpenSpec is carried by a shipped baseline
  capability. Falsified by a claim that no `orbit/specs/` capability carries.
- **G3 — the docs are orbit's.** All eleven `docs/` pages are rewritten for orbit, cover the core loop (install,
  init, explore → propose → review → apply → review → archive, the architect tier, `orbit status`), and follow
  R-ugd-1. Falsified by a page that still teaches upstream's commands, or an "OpenSpec" mention R-ugd-1 does not
  admit.
- **G4 — the docs are checked.** README and `docs/` command snippets run through the existing recorded-contract and
  `orbit` grammar sweeps, and an old-name residue check runs over them. Falsified by a doc snippet that fails to
  parse, or residue the check misses.

## Rulings index

- **R-ugd-1** (Sal, 2026-10-12) — remove as much "openspec" nomenclature as reasonable and use orbit's names
  instead. The docs say `orbit`, `orbit/`, `orbit-*` and `/orbit:`. "OpenSpec" stays only where it is the honest word:
  the attribution, the "how orbit improves on OpenSpec" comparison, and migration guidance for adopters coming from
  it. Names the tool still writes on disk (`.openspec.yaml`, the global config directory) are documented as they
  are, because a doc that renamed them would be wrong.
- **R-ugd-2** (Sal, 2026-10-12) — all eleven `docs/` pages are rewritten; none is removed or left labelled as
  upstream reference.
- **R-ugd-3** (Sal, 2026-10-12) — the Tier-C code scrub (`OpenSpec` in CLI help text and messages) is OUT of this
  program: it is code, and the landing page does not depend on it.
- **R-ugd-4** (Sal, 2026-10-12; resolves Q-ugd-1) — the install path at launch is a GitHub install PINNED to a
  release tag, `npm install -g github:las-sal/orbit-spec#<tag>`. The page makes no promise about npm: npm appears
  in the docs only if and when it is published, which stays Sal's separate outward act.
- **R-ugd-5** (Sal, 2026-10-12; from docs-under-test's D-dut-3) — interim states between this program's stages need no
  protection: the program runs as one sequence and is validated by installing and using the result at its end. A
  check may leave a file it has not yet graded unprotected while that file awaits its rewrite stage.
- **R-ugd-6** (Sal, 2026-10-12; resolves Q-ugd-2) — orbit's first version is `1.0.0`. The landing-page stage bumps
  `package.json` from upstream's `1.3.1` and cuts the `v1.0.0` tag on `main` that R-ugd-4's install pins; a GitHub
  Release page, if wanted, stays Sal's.

## Open questions

- **Q-ugd-1 — RESOLVED by R-ugd-4 (Sal, 2026-10-12).** the install path. `orbit-spec` is not on npm (`npm view
  orbit-spec` returns 404, 2026-10-12). Four options were weighed: a GitHub install, an npm publish, a GitHub
  install at launch with npm later, and a release tarball. Sal took the third, with npm left unpromised on the page.
  A git install builds on the user's machine because `package.json`'s `prepare` script runs the build.
- **Q-ugd-2 — RESOLVED by R-ugd-6 (Sal, 2026-10-12).** orbit's first version number. The R-ugd-4 pin needs a tag, and `package.json` still reads `1.3.1`,
  upstream's version, which on a public page reads as upstream's 1.3.1. The recommendation was `0.1.0`, a young
  fork in its own right; Sal took `1.0.0`; the bump and the tag on `main` ride the landing-page stage (a tag is a git act a stage can
  carry; a GitHub Release page, if wanted, is Sal's).

## Program stages

### Stage docs-under-test — the docs are graded by a machine before they are rewritten

Depends-on: (none)
Complete: [x] 2026-10-12 (Sal)

Charter: extend the sweeps that already check the generated surface (rc05's `orbit` grammar sweep, rc05b's
recorded-contract sweep for `git` and `gh`, rc09b's tool inventory) to `README.md` and `docs/*.md`, and add an
old-name residue check that applies R-ugd-1 (its admitted exceptions named, so a check failure is a real residue).
It runs first so every later stage is graded by the check, not by review. Today's docs are expected to FAIL it;
the stage ships the check against a recorded list of today's failures, which the later stages empty. Goal G4.

Exit: (1) a test reads `README.md` and every `docs/*.md` and fails on an unparseable `orbit`, `git` or `gh` snippet,
naming file and line; (2) the residue check fails on an `openspec`, `/opsx` or `@fission-ai` occurrence outside
R-ugd-1's exceptions, naming file and line; (3) the recorded list of today's failures is exact, and a test shows
each check able to fail.

Shipped as (2026-10-12; archived as `orbit/changes/archive/2026-10-12-docs-under-test/`; the charter stands, and exit (3)
is revised in one term): the user docs are a checked surface. `test/core/user-docs/pending-rewrite.json` lists all twelve
docs, exact in both directions: a listed file that passes every file-local check fails the suite, and so does a stale
entry. Each of today's twelve fails at least one check, about 810 failures in all. The residue check reads `openspec`,
`opsx` and `fission` in any case, admitting the README's two titled sections (read from top-level ATX headings of a
markdown-it parse with HTML enabled, after the system pair found a heading hidden in an HTML comment), all of
`docs/migration-guide.md`, `.openspec.yaml` and the global directories. The `orbit`, `git`/`gh` and inventory sweeps read
the unlisted docs; the inventory judges them against their own `docs-inventory` fence, empty today, where `utility` also
admits an installer such as `npm` (Sal: A at the system walk). The docs floors are unset until the list empties and must
then be positive integers. The `git` capture reads every user doc; the docs add nothing to the contract, though a
re-capture shows the checked-in contract still records six keys and six flags rc12 removed from the surface (kept, a
named residual). New capability `orbit-user-docs` (27 baseline capabilities); `orbit-cli-grammar`'s three sweeps
widened. Exit (1) MET: the `orbit` and `git`/`gh` sweeps fail an unparseable snippet in an unlisted doc naming file and
line, and run over each listed doc in the exactness test. Exit (2) MET: `fission` covers `@fission-ai`, and `/opsx` is
matched as `opsx`. Exit (3) MET AS REVISED (R-crc-12's first case): the "recorded list of today's failures" is a FILE list
(D-dut-2), not a per-line one; it is exact, and every check was shown able to fail, including by deliberate mutation. The
system blind pair on `5ef9821a` (fresh 0C/1W/3S forward, external GPT-6 Codex 0C/2W/0S hold) shared no finding; two walk
logs, then an in-context VERIFICATION grading six `landed`; a computed PASSED gate. 3617 tests green.

### Stage landing-page — the README says what orbit is, why, and how to start

Depends-on: docs-under-test
Complete: [ ]

Charter: rewrite `README.md` as orbit's landing page: what orbit is (a hard fork of OpenSpec 1.3.1, attributed),
how it improves on OpenSpec (each claim naming the baseline capability that carries it), install (the pinned
GitHub install of R-ugd-4, at version `1.0.0` per R-ugd-6, with `package.json` bumped and the `v1.0.0` tag cut on `main`),
a quickstart through the core loop, and links into `docs/`. Upstream's logo, badges and Discord leave the page.
Goals G1, G2.

Exit: (1) the README passes docs-under-test's checks with no recorded exception; (2) every improvement claimed over
OpenSpec names its capability, and each named capability exists in `orbit/specs/`; (3) a clean-machine run of the
README's install and quickstart is recorded (observed, not inferred), rehearsed from a local `git+file://` clone before the repository is public and
re-run against the public URL after the flip.

### Stage reference-docs — the command and workflow pages teach orbit

Depends-on: docs-under-test
Complete: [ ]

Charter: rewrite `docs/installation.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/commands.md`,
`docs/workflows.md` and `docs/opsx.md` for orbit (the last renamed to an orbit name, its links repointed). Every
`orbit` CLI command and `/orbit:` workflow is documented. Goal G3.

Exit: (1) the six pages pass docs-under-test's checks with no recorded exception; (2) every command the completion
registry holds (rc05 keeps it equal to the program) is named by at least one page, checked by a test; (3) no page
teaches an upstream command.

### Stage concept-docs — the concept pages explain what orbit adds

Depends-on: docs-under-test
Complete: [ ]

Charter: rewrite `docs/concepts.md`, `docs/customization.md`, `docs/supported-tools.md`, `docs/multi-language.md` and
`docs/migration-guide.md` for orbit. Concepts covers what orbit adds over OpenSpec (reviewed gates and the cadence,
the blind pair and walks, emits and trails, the architect tier, `orbit pr`); the migration guide is rewritten for an
adopter arriving FROM OpenSpec. Goals G2, G3.

Exit: (1) the five pages pass docs-under-test's checks with no recorded exception; (2) every concept page claim
about orbit's behaviour names the capability that carries it; (3) the migration guide's steps are run once on a
real OpenSpec project and the run is recorded.

### Stage public-readiness — the repository is fit to be seen

Depends-on: landing-page, reference-docs, concept-docs
Complete: [ ]

Charter: sweep what should not be public as it stands: root files (`README_OLD.md`, the adopter report,
`openspec-parallel-merge-plan.md`, and anything else at the root a newcomer would trip on), upstream assets and
links outside the docs, `LICENSE` attribution (the upstream notice kept, orbit's added beside it), and a scan for
secrets, tokens and local absolute paths in tracked files. Each root file is kept, moved or deleted by an explicit
decision. The visibility flip, the repository description and its topics are Sal's acts at arc-done.

Exit: (1) every root-level file has a recorded keep / move / delete decision; (2) the secrets-and-paths scan runs
over every tracked file and its findings are resolved or accepted with a reason; (3) `LICENSE` carries the upstream
notice and orbit's.

## Considered & out

- **2026-10-12 — the Tier-C code scrub.** Folding the `OpenSpec` strings in CLI help and messages into this program
  (issue #1 suggested it). Out by R-ugd-3: it is code, and the landing page does not depend on it.
- **2026-10-12 — removing or labelling the pages not rewritten.** Out by R-ugd-2: all eleven are rewritten.

## Status log

**2026-10-12 — program declared (Sal), in an architect session.** Context from Sal: the repository goes public after
this program, and the GitHub landing page must give proper orbit instructions instead of OpenSpec's, with a summary of
how orbit improves on OpenSpec and basic documentation on how to use it. Rulings R-ugd-1 (nomenclature), R-ugd-2 (all
eleven pages) and R-ugd-3 (the code scrub out) captured; Q-ugd-1 (the install path) left open with its standing
recommendation. Five stages declared, docs-under-test first so the rewrite is graded by a machine.

**2026-10-12 — Q-ugd-1 resolved (Sal): R-ugd-4.** The install path at launch is a GitHub install pinned to a release
tag, with no npm promise on the page. The options weighed are recorded under Q-ugd-1. The version the tag carries
opened as Q-ugd-2 (standing recommendation `0.1.0`). The landing-page stage's charter and exit (3) now point at both,
and its install run is rehearsed from a local clone before the flip and re-run against the public URL after it.

**2026-10-12 — docs-under-test ratified (Sal), in an architect session; R-ugd-5 and R-ugd-6 captured.** The stage
archived the same day (`orbit/changes/archive/2026-10-12-docs-under-test/`, PR #18 merged), its exits graded MET, exit
(3) as revised: the recorded list of today's failures is a FILE list (D-dut-2). D-dut-3 became R-ugd-5 (interim
states need no protection). Q-ugd-2 resolved as R-ugd-6: the first version is `1.0.0`, against the standing
recommendation of `0.1.0`; the landing-page charter now names it. Carried from the stage: the checked-in `git`
contract still records six keys and six flags rc12 removed from the generated surface, an accepted residual left for
its own change.
